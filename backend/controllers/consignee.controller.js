const Consignee = require('../models/Consignee.model');
const Shipper = require('../models/Shipper.model');

// @desc    Get all consignees for a shipper
// @route   GET /api/shippers/:shipperId/consignees
// @access  Private
exports.getConsigneesByShipper = async (req, res) => {
    try {
        const { shipperId } = req.params;
        const { search } = req.query;

        let query = { shipper: shipperId };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } }
            ];
        }

        const consignees = await Consignee.find(query)
            .sort({ isDefault: -1, createdAt: -1 });

        res.status(200).json({
            success: true,
            data: consignees
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all consignees
// @route   GET /api/consignees
// @access  Private
exports.getAllConsignees = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;

        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } }
            ];
        }

        const consignees = await Consignee.find(query)
            .populate('shipper', 'name company')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const count = await Consignee.countDocuments(query);

        res.status(200).json({
            success: true,
            data: consignees,
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

// @desc    Get single consignee
// @route   GET /api/consignees/:id
// @access  Private
exports.getConsigneeById = async (req, res) => {
    try {
        const consignee = await Consignee.findById(req.params.id)
            .populate('shipper', 'name company email mobile');

        if (!consignee) {
            return res.status(404).json({
                success: false,
                message: 'Consignee not found'
            });
        }

        res.status(200).json({
            success: true,
            data: consignee
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create new consignee
// @route   POST /api/consignees
// @access  Private
exports.createConsignee = async (req, res) => {
    try {
        const consigneeData = {
            ...req.body,
            createdBy: req.user._id
        };

        // Verify shipper exists
        const shipper = await Shipper.findById(consigneeData.shipper);
        if (!shipper) {
            return res.status(404).json({
                success: false,
                message: 'Shipper not found'
            });
        }

        // If this is set as default, remove default from other consignees
        if (consigneeData.isDefault) {
            await Consignee.updateMany(
                { shipper: consigneeData.shipper },
                { isDefault: false }
            );
        }

        const consignee = await Consignee.create(consigneeData);

        res.status(201).json({
            success: true,
            message: 'Consignee created successfully',
            data: consignee
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update consignee
// @route   PUT /api/consignees/:id
// @access  Private
exports.updateConsignee = async (req, res) => {
    try {
        const consignee = await Consignee.findById(req.params.id);

        if (!consignee) {
            return res.status(404).json({
                success: false,
                message: 'Consignee not found'
            });
        }

        // If setting as default, remove default from other consignees
        if (req.body.isDefault && !consignee.isDefault) {
            await Consignee.updateMany(
                { shipper: consignee.shipper, _id: { $ne: consignee._id } },
                { isDefault: false }
            );
        }

        Object.assign(consignee, req.body);
        await consignee.save();

        res.status(200).json({
            success: true,
            message: 'Consignee updated successfully',
            data: consignee
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete consignee
// @route   DELETE /api/consignees/:id
// @access  Private
exports.deleteConsignee = async (req, res) => {
    try {
        const consignee = await Consignee.findById(req.params.id);

        if (!consignee) {
            return res.status(404).json({
                success: false,
                message: 'Consignee not found'
            });
        }

        await consignee.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Consignee deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
