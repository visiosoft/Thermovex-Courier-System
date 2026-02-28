const Dispatch = require('../models/Dispatch.model');
const Manifest = require('../models/Manifest.model');
const Booking = require('../models/Booking.model');

// @desc    Get all dispatches
// @route   GET /api/dispatches
// @access  Private
exports.getAllDispatches = async (req, res) => {
    try {
        const { status, type, startDate, endDate, page = 1, limit = 10 } = req.query;

        let query = {};

        if (status) query.status = status;
        if (type) query.type = type;

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const dispatches = await Dispatch.find(query)
            .populate('manifests')
            .populate('createdBy', 'name')
            .populate('receivedBy', 'name')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ date: -1 });

        const count = await Dispatch.countDocuments(query);

        res.status(200).json({
            success: true,
            data: dispatches,
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

// @desc    Get single dispatch
// @route   GET /api/dispatches/:id
// @access  Private
exports.getDispatchById = async (req, res) => {
    try {
        const dispatch = await Dispatch.findById(req.params.id)
            .populate('manifests')
            .populate('bookings')
            .populate('createdBy', 'name email')
            .populate('receivedBy', 'name email');

        if (!dispatch) {
            return res.status(404).json({
                success: false,
                message: 'Dispatch not found'
            });
        }

        res.status(200).json({
            success: true,
            data: dispatch
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create dispatch
// @route   POST /api/dispatches
// @access  Private
exports.createDispatch = async (req, res) => {
    try {
        const { manifestIds, bookingIds, ...dispatchData } = req.body;

        let manifests = [];
        let bookings = [];
        let totalWeight = 0;

        // If manifest IDs provided
        if (manifestIds && manifestIds.length > 0) {
            manifests = await Manifest.find({ _id: { $in: manifestIds } });

            // Get all bookings from manifests
            const manifestBookingIds = manifests.reduce((acc, manifest) => {
                return [...acc, ...manifest.bookings];
            }, []);

            bookings = await Booking.find({ _id: { $in: manifestBookingIds } });
        }

        // If additional booking IDs provided
        if (bookingIds && bookingIds.length > 0) {
            const additionalBookings = await Booking.find({ _id: { $in: bookingIds } });
            bookings = [...bookings, ...additionalBookings];
        }

        // Calculate total weight
        bookings.forEach(booking => {
            totalWeight += booking.weight || 0;
        });

        const dispatch = await Dispatch.create({
            ...dispatchData,
            manifests: manifestIds || [],
            bookings: bookings.map(b => b._id),
            totalBookings: bookings.length,
            totalWeight,
            createdBy: req.user._id,
            branch: req.user.branch
        });

        // Update bookings with dispatch reference
        await Booking.updateMany(
            { _id: { $in: bookings.map(b => b._id) } },
            { dispatchId: dispatch._id }
        );

        res.status(201).json({
            success: true,
            message: 'Dispatch created successfully',
            data: dispatch
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update dispatch
// @route   PUT /api/dispatches/:id
// @access  Private
exports.updateDispatch = async (req, res) => {
    try {
        const dispatch = await Dispatch.findById(req.params.id);

        if (!dispatch) {
            return res.status(404).json({
                success: false,
                message: 'Dispatch not found'
            });
        }

        Object.assign(dispatch, req.body);
        await dispatch.save();

        res.status(200).json({
            success: true,
            message: 'Dispatch updated successfully',
            data: dispatch
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Mark dispatch as dispatched
// @route   PUT /api/dispatches/:id/dispatch
// @access  Private
exports.markDispatched = async (req, res) => {
    try {
        const dispatch = await Dispatch.findById(req.params.id);

        if (!dispatch) {
            return res.status(404).json({
                success: false,
                message: 'Dispatch not found'
            });
        }

        dispatch.status = 'Dispatched';
        dispatch.dispatchedAt = new Date();
        await dispatch.save();

        res.status(200).json({
            success: true,
            message: 'Dispatch marked as dispatched',
            data: dispatch
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Mark dispatch as received
// @route   PUT /api/dispatches/:id/receive
// @access  Private
exports.markReceived = async (req, res) => {
    try {
        const dispatch = await Dispatch.findById(req.params.id);

        if (!dispatch) {
            return res.status(404).json({
                success: false,
                message: 'Dispatch not found'
            });
        }

        dispatch.status = 'Received';
        dispatch.receivedAt = new Date();
        dispatch.receivedBy = req.user._id;
        await dispatch.save();

        res.status(200).json({
            success: true,
            message: 'Dispatch marked as received',
            data: dispatch
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete dispatch
// @route   DELETE /api/dispatches/:id
// @access  Private
exports.deleteDispatch = async (req, res) => {
    try {
        const dispatch = await Dispatch.findById(req.params.id);

        if (!dispatch) {
            return res.status(404).json({
                success: false,
                message: 'Dispatch not found'
            });
        }

        if (dispatch.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: 'Can only delete pending dispatches'
            });
        }

        // Remove dispatch reference from bookings
        await Booking.updateMany(
            { dispatchId: dispatch._id },
            { $unset: { dispatchId: 1 } }
        );

        await dispatch.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Dispatch deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
