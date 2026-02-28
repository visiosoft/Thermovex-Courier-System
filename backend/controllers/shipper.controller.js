const Shipper = require('../models/Shipper.model');
const Consignee = require('../models/Consignee.model');

// @desc    Get all shippers
// @route   GET /api/shippers
// @access  Private
exports.getAllShippers = async (req, res) => {
    try {
        const { search, status, city, paymentType, page = 1, limit = 10 } = req.query;

        // Build query
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } }
            ];
        }

        if (status) {
            query.status = status;
        }

        if (city) {
            query['address.city'] = { $regex: city, $options: 'i' };
        }

        if (paymentType) {
            query.paymentType = paymentType;
        }

        // Execute query with pagination
        const shippers = await Shipper.find(query)
            .populate('accountManager', 'name email')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const count = await Shipper.countDocuments(query);

        res.status(200).json({
            success: true,
            data: shippers,
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

// @desc    Get single shipper
// @route   GET /api/shippers/:id
// @access  Private
exports.getShipperById = async (req, res) => {
    try {
        const shipper = await Shipper.findById(req.params.id)
            .populate('accountManager', 'name email mobile');

        if (!shipper) {
            return res.status(404).json({
                success: false,
                message: 'Shipper not found'
            });
        }

        // Get consignees count
        const consigneesCount = await Consignee.countDocuments({ shipper: shipper._id });

        res.status(200).json({
            success: true,
            data: {
                ...shipper.toObject(),
                consigneesCount
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create new shipper
// @route   POST /api/shippers
// @access  Private
exports.createShipper = async (req, res) => {
    try {
        const shipperData = {
            ...req.body,
            createdBy: req.user._id
        };

        const shipper = await Shipper.create(shipperData);

        res.status(201).json({
            success: true,
            message: 'Shipper created successfully',
            data: shipper
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A shipper with this email already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update shipper
// @route   PUT /api/shippers/:id
// @access  Private
exports.updateShipper = async (req, res) => {
    try {
        const shipper = await Shipper.findById(req.params.id);

        if (!shipper) {
            return res.status(404).json({
                success: false,
                message: 'Shipper not found'
            });
        }

        // Update fields
        Object.assign(shipper, req.body);
        await shipper.save();

        res.status(200).json({
            success: true,
            message: 'Shipper updated successfully',
            data: shipper
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete shipper
// @route   DELETE /api/shippers/:id
// @access  Private
exports.deleteShipper = async (req, res) => {
    try {
        const shipper = await Shipper.findById(req.params.id);

        if (!shipper) {
            return res.status(404).json({
                success: false,
                message: 'Shipper not found'
            });
        }

        // Check if shipper has bookings (to be implemented later)
        // For now, just delete
        await shipper.deleteOne();

        // Also delete associated consignees
        await Consignee.deleteMany({ shipper: shipper._id });

        res.status(200).json({
            success: true,
            message: 'Shipper deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Toggle shipper status
// @route   PUT /api/shippers/:id/status
// @access  Private
exports.toggleShipperStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const shipper = await Shipper.findById(req.params.id);

        if (!shipper) {
            return res.status(404).json({
                success: false,
                message: 'Shipper not found'
            });
        }

        shipper.status = status;
        await shipper.save();

        res.status(200).json({
            success: true,
            message: 'Shipper status updated successfully',
            data: { status: shipper.status }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Verify shipper
// @route   PUT /api/shippers/:id/verify
// @access  Private
exports.verifyShipper = async (req, res) => {
    try {
        const shipper = await Shipper.findById(req.params.id);

        if (!shipper) {
            return res.status(404).json({
                success: false,
                message: 'Shipper not found'
            });
        }

        shipper.isVerified = !shipper.isVerified;
        shipper.verifiedAt = shipper.isVerified ? new Date() : null;
        await shipper.save();

        res.status(200).json({
            success: true,
            message: `Shipper ${shipper.isVerified ? 'verified' : 'unverified'} successfully`,
            data: { isVerified: shipper.isVerified }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get shipper statistics
// @route   GET /api/shippers/:id/stats
// @access  Private
exports.getShipperStats = async (req, res) => {
    try {
        const shipper = await Shipper.findById(req.params.id);

        if (!shipper) {
            return res.status(404).json({
                success: false,
                message: 'Shipper not found'
            });
        }

        const stats = {
            totalBookings: shipper.totalBookings,
            totalRevenue: shipper.totalRevenue,
            pendingCOD: shipper.pendingCOD,
            currentBalance: shipper.currentBalance,
            creditLimit: shipper.creditLimit,
            lastBookingDate: shipper.lastBookingDate
        };

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
