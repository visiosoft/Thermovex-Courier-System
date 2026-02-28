const Booking = require('../models/Booking.model');
const Shipper = require('../models/Shipper.model');
const Consignee = require('../models/Consignee.model');

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
exports.getAllBookings = async (req, res) => {
    try {
        const {
            search,
            status,
            shipperId,
            serviceType,
            destinationType,
            startDate,
            endDate,
            page = 1,
            limit = 20
        } = req.query;

        let query = {};

        // Search by AWB, reference, or consignee name
        if (search) {
            query.$or = [
                { awbNumber: { $regex: search, $options: 'i' } },
                { referenceNumber: { $regex: search, $options: 'i' } },
                { 'consigneeDetails.name': { $regex: search, $options: 'i' } },
                { 'consigneeDetails.mobile': { $regex: search, $options: 'i' } }
            ];
        }

        if (status) query.status = status;
        if (shipperId) query.shipper = shipperId;
        if (serviceType) query.serviceType = serviceType;
        if (destinationType) query.destinationType = destinationType;

        // Date range filter
        if (startDate || endDate) {
            query.bookingDate = {};
            if (startDate) query.bookingDate.$gte = new Date(startDate);
            if (endDate) query.bookingDate.$lte = new Date(endDate);
        }

        const bookings = await Booking.find(query)
            .populate('shipper', 'name company email mobile')
            .populate('consignee', 'name mobile address')
            .populate('bookedBy', 'name')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ bookingDate: -1 });

        const count = await Booking.countDocuments(query);

        res.status(200).json({
            success: true,
            data: bookings,
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

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('shipper')
            .populate('consignee')
            .populate('bookedBy', 'name email')
            .populate('statusHistory.updatedBy', 'name')
            .populate('manifestId')
            .populate('dispatchId');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get booking by AWB number
// @route   GET /api/bookings/awb/:awbNumber
// @access  Public
exports.getBookingByAWB = async (req, res) => {
    try {
        const booking = await Booking.findOne({ awbNumber: req.params.awbNumber })
            .populate('shipper', 'name company')
            .populate('statusHistory.updatedBy', 'name')
            .select('-internalNotes');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
    try {
        const bookingData = {
            ...req.body,
            bookedBy: req.user._id,
            branch: req.user.branch,
            zone: req.user.zone
        };

        // Verify shipper exists
        const shipper = await Shipper.findById(bookingData.shipper);
        if (!shipper) {
            return res.status(404).json({
                success: false,
                message: 'Shipper not found'
            });
        }

        // If consignee ID provided, verify it exists
        if (bookingData.consignee) {
            const consignee = await Consignee.findById(bookingData.consignee);
            if (!consignee) {
                return res.status(404).json({
                    success: false,
                    message: 'Consignee not found'
                });
            }
        }

        const booking = await Booking.create(bookingData);

        // Update shipper stats
        shipper.totalBookings += 1;
        shipper.lastBookingDate = new Date();
        await shipper.save();

        await booking.populate('shipper consignee bookedBy');

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
exports.updateBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Don't allow updates if already delivered or cancelled
        if (['Delivered', 'Cancelled'].includes(booking.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot update booking with status: ${booking.status}`
            });
        }

        Object.assign(booking, req.body);
        await booking.save();

        res.status(200).json({
            success: true,
            message: 'Booking updated successfully',
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private
exports.updateBookingStatus = async (req, res) => {
    try {
        const { status, location, remarks } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        await booking.addStatusUpdate(status, location, remarks, req.user._id);

        res.status(200).json({
            success: true,
            message: 'Status updated successfully',
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
    try {
        const { reason } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (booking.status === 'Delivered') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel delivered booking'
            });
        }

        await booking.addStatusUpdate('Cancelled', '', reason || 'Cancelled by user', req.user._id);

        res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully',
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private
exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Only allow deletion of draft/booked status
        if (!['Booked', 'Cancelled'].includes(booking.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete booking in current status'
            });
        }

        await booking.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Booking deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get booking statistics
// @route   GET /api/bookings/stats/summary
// @access  Private
exports.getBookingStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let dateFilter = {};
        if (startDate || endDate) {
            dateFilter.bookingDate = {};
            if (startDate) dateFilter.bookingDate.$gte = new Date(startDate);
            if (endDate) dateFilter.bookingDate.$lte = new Date(endDate);
        }

        const stats = await Booking.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: null,
                    totalBookings: { $sum: 1 },
                    totalDelivered: {
                        $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] }
                    },
                    totalReturned: {
                        $sum: { $cond: [{ $eq: ['$status', 'Returned'] }, 1, 0] }
                    },
                    totalCancelled: {
                        $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] }
                    },
                    totalInTransit: {
                        $sum: { $cond: [{ $eq: ['$status', 'In Transit'] }, 1, 0] }
                    },
                    totalCODAmount: { $sum: '$codAmount' },
                    totalRevenue: { $sum: '$totalAmount' }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: stats[0] || {
                totalBookings: 0,
                totalDelivered: 0,
                totalReturned: 0,
                totalCancelled: 0,
                totalInTransit: 0,
                totalCODAmount: 0,
                totalRevenue: 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Bulk create bookings
// @route   POST /api/bookings/bulk
// @access  Private
exports.bulkCreateBookings = async (req, res) => {
    try {
        const { bookings } = req.body;

        if (!Array.isArray(bookings) || bookings.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of bookings'
            });
        }

        const results = {
            success: [],
            failed: []
        };

        for (let i = 0; i < bookings.length; i++) {
            try {
                const bookingData = {
                    ...bookings[i],
                    bookedBy: req.user._id,
                    branch: req.user.branch,
                    zone: req.user.zone
                };

                const booking = await Booking.create(bookingData);
                results.success.push({
                    row: i + 1,
                    awbNumber: booking.awbNumber,
                    booking: booking
                });

                // Update shipper stats
                if (booking.shipper) {
                    await Shipper.findByIdAndUpdate(booking.shipper, {
                        $inc: { totalBookings: 1 },
                        lastBookingDate: new Date()
                    });
                }
            } catch (error) {
                results.failed.push({
                    row: i + 1,
                    error: error.message,
                    data: bookings[i]
                });
            }
        }

        res.status(201).json({
            success: true,
            message: `${results.success.length} bookings created, ${results.failed.length} failed`,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Upload proof of delivery
// @route   POST /api/bookings/:id/pod
// @access  Private
exports.uploadPOD = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Save POD file path
        booking.deliveryProof = req.file.filename;
        
        // If not already delivered, update status
        if (booking.status !== 'Delivered') {
            booking.deliveredTo = req.body.deliveredTo || 'Recipient';
            booking.deliveryRemarks = req.body.deliveryRemarks || '';
            await booking.addStatusUpdate('Delivered', '', 'POD uploaded', req.user._id);
        }

        await booking.save();

        res.status(200).json({
            success: true,
            message: 'Proof of delivery uploaded successfully',
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
