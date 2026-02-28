const SupportTicket = require('../models/SupportTicket.model');
const Shipper = require('../models/Shipper.model');

// @desc    Get all support tickets
// @route   GET /api/tickets
// @access  Private
exports.getAllTickets = async (req, res) => {
    try {
        const { shipperId, status, priority, category, search, page = 1, limit = 10 } = req.query;

        let query = {};

        if (shipperId) {
            query.shipper = shipperId;
        }

        if (status) {
            query.status = status;
        }

        if (priority) {
            query.priority = priority;
        }

        if (category) {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { ticketNumber: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
                { awbNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const tickets = await SupportTicket.find(query)
            .populate('shipper', 'name company')
            .populate('assignedTo', 'name')
            .populate('createdBy', 'name')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const count = await SupportTicket.countDocuments(query);

        res.status(200).json({
            success: true,
            data: tickets,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get tickets by shipper
// @route   GET /api/shippers/:shipperId/tickets
// @access  Private
exports.getTicketsByShipper = async (req, res) => {
    try {
        const { shipperId } = req.params;

        const tickets = await SupportTicket.find({ shipper: shipperId })
            .populate('assignedTo', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: tickets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single ticket
// @route   GET /api/tickets/:id
// @access  Private
exports.getTicketById = async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id)
            .populate('shipper', 'name company email mobile')
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name')
            .populate('resolvedBy', 'name')
            .populate('escalatedTo', 'name')
            .populate('responses.respondedBy', 'name');

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        res.status(200).json({
            success: true,
            data: ticket
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create new ticket
// @route   POST /api/tickets
// @access  Private
exports.createTicket = async (req, res) => {
    try {
        const ticketData = {
            ...req.body,
            createdBy: req.user._id
        };

        // Set resolution deadline based on priority
        if (!ticketData.resolutionDeadline) {
            const now = new Date();
            switch (ticketData.priority) {
                case 'Urgent':
                    ticketData.resolutionDeadline = new Date(now.setHours(now.getHours() + 4));
                    break;
                case 'High':
                    ticketData.resolutionDeadline = new Date(now.setHours(now.getHours() + 24));
                    break;
                case 'Medium':
                    ticketData.resolutionDeadline = new Date(now.setDate(now.getDate() + 3));
                    break;
                default:
                    ticketData.resolutionDeadline = new Date(now.setDate(now.getDate() + 7));
            }
        }

        const ticket = await SupportTicket.create(ticketData);

        res.status(201).json({
            success: true,
            message: 'Support ticket created successfully',
            data: ticket
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private
exports.updateTicket = async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        Object.assign(ticket, req.body);
        await ticket.save();

        res.status(200).json({
            success: true,
            message: 'Ticket updated successfully',
            data: ticket
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Add response to ticket
// @route   POST /api/tickets/:id/response
// @access  Private
exports.addResponse = async (req, res) => {
    try {
        const { message, isInternal } = req.body;
        const ticket = await SupportTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        ticket.responses.push({
            message,
            respondedBy: req.user._id,
            isInternal: isInternal || false
        });

        await ticket.save();

        await ticket.populate('responses.respondedBy', 'name');

        res.status(200).json({
            success: true,
            message: 'Response added successfully',
            data: ticket
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Assign ticket
// @route   PUT /api/tickets/:id/assign
// @access  Private
exports.assignTicket = async (req, res) => {
    try {
        const { assignedTo, department } = req.body;
        const ticket = await SupportTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        ticket.assignedTo = assignedTo;
        if (department) ticket.department = department;
        ticket.status = 'In Progress';

        await ticket.save();

        res.status(200).json({
            success: true,
            message: 'Ticket assigned successfully',
            data: ticket
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Escalate ticket
// @route   PUT /api/tickets/:id/escalate
// @access  Private
exports.escalateTicket = async (req, res) => {
    try {
        const { escalatedTo, escalationReason } = req.body;
        const ticket = await SupportTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        ticket.status = 'Escalated';
        ticket.escalatedTo = escalatedTo;
        ticket.escalationReason = escalationReason;
        ticket.escalatedAt = new Date();

        await ticket.save();

        res.status(200).json({
            success: true,
            message: 'Ticket escalated successfully',
            data: ticket
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Resolve ticket
// @route   PUT /api/tickets/:id/resolve
// @access  Private
exports.resolveTicket = async (req, res) => {
    try {
        const { resolution } = req.body;
        const ticket = await SupportTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        ticket.status = 'Resolved';
        ticket.resolution = resolution;
        ticket.resolvedAt = new Date();
        ticket.resolvedBy = req.user._id;

        await ticket.save();

        res.status(200).json({
            success: true,
            message: 'Ticket resolved successfully',
            data: ticket
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Close ticket
// @route   PUT /api/tickets/:id/close
// @access  Private
exports.closeTicket = async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        ticket.status = 'Closed';
        await ticket.save();

        res.status(200).json({
            success: true,
            message: 'Ticket closed successfully',
            data: ticket
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete ticket
// @route   DELETE /api/tickets/:id
// @access  Private
exports.deleteTicket = async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        await ticket.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Ticket deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
