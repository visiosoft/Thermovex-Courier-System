const Manifest = require('../models/Manifest.model');
const Booking = require('../models/Booking.model');

// @desc    Get all manifests
// @route   GET /api/manifests
// @access  Private
exports.getAllManifests = async (req, res) => {
    try {
        const { status, startDate, endDate, page = 1, limit = 10 } = req.query;

        let query = {};

        if (status) query.status = status;

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const manifests = await Manifest.find(query)
            .populate('createdBy', 'name')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ date: -1 });

        const count = await Manifest.countDocuments(query);

        res.status(200).json({
            success: true,
            data: manifests,
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

// @desc    Get single manifest
// @route   GET /api/manifests/:id
// @access  Private
exports.getManifestById = async (req, res) => {
    try {
        const manifest = await Manifest.findById(req.params.id)
            .populate('bookings')
            .populate('createdBy', 'name email');

        if (!manifest) {
            return res.status(404).json({
                success: false,
                message: 'Manifest not found'
            });
        }

        res.status(200).json({
            success: true,
            data: manifest
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create manifest
// @route   POST /api/manifests
// @access  Private
exports.createManifest = async (req, res) => {
    try {
        const { bookingIds, ...manifestData } = req.body;

        // Verify bookings exist
        const bookings = await Booking.find({ _id: { $in: bookingIds } });

        if (bookings.length !== bookingIds.length) {
            return res.status(400).json({
                success: false,
                message: 'Some bookings not found'
            });
        }

        // Calculate statistics
        let totalWeight = 0;
        let totalPieces = 0;
        let totalCODAmount = 0;

        bookings.forEach(booking => {
            totalWeight += booking.weight || 0;
            totalPieces += booking.numberOfPieces || 0;
            if (booking.paymentMode === 'COD') {
                totalCODAmount += booking.codAmount || 0;
            }
        });

        const manifest = await Manifest.create({
            ...manifestData,
            bookings: bookingIds,
            totalBookings: bookings.length,
            totalWeight,
            totalPieces,
            totalCODAmount,
            createdBy: req.user._id,
            branch: req.user.branch
        });

        // Update bookings with manifest reference
        await Booking.updateMany(
            { _id: { $in: bookingIds } },
            { manifestId: manifest._id }
        );

        res.status(201).json({
            success: true,
            message: 'Manifest created successfully',
            data: manifest
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update manifest
// @route   PUT /api/manifests/:id
// @access  Private
exports.updateManifest = async (req, res) => {
    try {
        const manifest = await Manifest.findById(req.params.id);

        if (!manifest) {
            return res.status(404).json({
                success: false,
                message: 'Manifest not found'
            });
        }

        if (manifest.status === 'Completed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update completed manifest'
            });
        }

        Object.assign(manifest, req.body);
        await manifest.save();

        res.status(200).json({
            success: true,
            message: 'Manifest updated successfully',
            data: manifest
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Dispatch manifest
// @route   PUT /api/manifests/:id/dispatch
// @access  Private
exports.dispatchManifest = async (req, res) => {
    try {
        const manifest = await Manifest.findById(req.params.id);

        if (!manifest) {
            return res.status(404).json({
                success: false,
                message: 'Manifest not found'
            });
        }

        manifest.status = 'Dispatched';
        manifest.dispatchedAt = new Date();
        await manifest.save();

        // Update all bookings in manifest
        await Booking.updateMany(
            { _id: { $in: manifest.bookings } },
            {
                $push: {
                    statusHistory: {
                        status: 'In Transit',
                        location: manifest.destinationCity,
                        remarks: `Dispatched via manifest ${manifest.manifestNumber}`,
                        timestamp: new Date(),
                        updatedBy: req.user._id
                    }
                },
                status: 'In Transit'
            }
        );

        res.status(200).json({
            success: true,
            message: 'Manifest dispatched successfully',
            data: manifest
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete manifest
// @route   DELETE /api/manifests/:id
// @access  Private
exports.deleteManifest = async (req, res) => {
    try {
        const manifest = await Manifest.findById(req.params.id);

        if (!manifest) {
            return res.status(404).json({
                success: false,
                message: 'Manifest not found'
            });
        }

        if (manifest.status !== 'Draft') {
            return res.status(400).json({
                success: false,
                message: 'Can only delete draft manifests'
            });
        }

        // Remove manifest reference from bookings
        await Booking.updateMany(
            { manifestId: manifest._id },
            { $unset: { manifestId: 1 } }
        );

        await manifest.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Manifest deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
