const Cheque = require('../models/Cheque.model');
const Shipper = require('../models/Shipper.model');

// @desc    Get all cheques
// @route   GET /api/cheques
// @access  Private
exports.getAllCheques = async (req, res) => {
    try {
        const { shipperId, status, search, page = 1, limit = 10 } = req.query;

        let query = {};

        if (shipperId) {
            query.shipper = shipperId;
        }

        if (status) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { chequeNumber: { $regex: search, $options: 'i' } },
                { bankName: { $regex: search, $options: 'i' } },
                { reference: { $regex: search, $options: 'i' } }
            ];
        }

        const cheques = await Cheque.find(query)
            .populate('shipper', 'name company')
            .populate('processedBy', 'name')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ chequeDate: -1 });

        const count = await Cheque.countDocuments(query);

        res.status(200).json({
            success: true,
            data: cheques,
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

// @desc    Get cheques by shipper
// @route   GET /api/shippers/:shipperId/cheques
// @access  Private
exports.getChequesByShipper = async (req, res) => {
    try {
        const { shipperId } = req.params;

        const cheques = await Cheque.find({ shipper: shipperId })
            .populate('processedBy', 'name')
            .sort({ chequeDate: -1 });

        res.status(200).json({
            success: true,
            data: cheques
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single cheque
// @route   GET /api/cheques/:id
// @access  Private
exports.getChequeById = async (req, res) => {
    try {
        const cheque = await Cheque.findById(req.params.id)
            .populate('shipper', 'name company email mobile')
            .populate('processedBy', 'name email')
            .populate('createdBy', 'name');

        if (!cheque) {
            return res.status(404).json({
                success: false,
                message: 'Cheque not found'
            });
        }

        res.status(200).json({
            success: true,
            data: cheque
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create new cheque
// @route   POST /api/cheques
// @access  Private
exports.createCheque = async (req, res) => {
    try {
        // Verify shipper exists
        const shipper = await Shipper.findById(req.body.shipper);
        if (!shipper) {
            return res.status(404).json({
                success: false,
                message: 'Shipper not found'
            });
        }

        const chequeData = {
            ...req.body,
            createdBy: req.user._id
        };

        const cheque = await Cheque.create(chequeData);

        res.status(201).json({
            success: true,
            message: 'Cheque recorded successfully',
            data: cheque
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update cheque
// @route   PUT /api/cheques/:id
// @access  Private
exports.updateCheque = async (req, res) => {
    try {
        const cheque = await Cheque.findById(req.params.id);

        if (!cheque) {
            return res.status(404).json({
                success: false,
                message: 'Cheque not found'
            });
        }

        Object.assign(cheque, req.body);
        await cheque.save();

        res.status(200).json({
            success: true,
            message: 'Cheque updated successfully',
            data: cheque
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update cheque status
// @route   PUT /api/cheques/:id/status
// @access  Private
exports.updateChequeStatus = async (req, res) => {
    try {
        const { status, bounceReason } = req.body;
        const cheque = await Cheque.findById(req.params.id);

        if (!cheque) {
            return res.status(404).json({
                success: false,
                message: 'Cheque not found'
            });
        }

        cheque.status = status;
        cheque.processedBy = req.user._id;

        if (status === 'Cleared') {
            cheque.clearedDate = new Date();
        } else if (status === 'Bounced') {
            cheque.bouncedDate = new Date();
            cheque.bounceReason = bounceReason;
        }

        await cheque.save();

        res.status(200).json({
            success: true,
            message: 'Cheque status updated successfully',
            data: cheque
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete cheque
// @route   DELETE /api/cheques/:id
// @access  Private
exports.deleteCheque = async (req, res) => {
    try {
        const cheque = await Cheque.findById(req.params.id);

        if (!cheque) {
            return res.status(404).json({
                success: false,
                message: 'Cheque not found'
            });
        }

        await cheque.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Cheque deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
