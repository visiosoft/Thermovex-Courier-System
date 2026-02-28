const Booking = require('../models/Booking.model');
const Invoice = require('../models/Invoice.model');
const Payment = require('../models/Payment.model');
const Shipper = require('../models/Shipper.model');
const User = require('../models/User.model');

// @desc    Get dashboard overview statistics
// @route   GET /api/dashboard/overview
// @access  Private
exports.getOverviewStats = async (req, res) => {
    try {
        // Get current month start and end
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Previous month for comparison
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        // Total counts
        const totalBookings = await Booking.countDocuments();
        const totalShippers = await Shipper.countDocuments({ status: 'Active' });
        const totalRevenue = await Invoice.aggregate([
            { $match: { status: { $ne: 'Cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const totalPayments = await Payment.aggregate([
            { $match: { status: 'Completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // This month statistics
        const thisMonthBookings = await Booking.countDocuments({
            createdAt: { $gte: monthStart, $lte: monthEnd }
        });
        const thisMonthRevenue = await Invoice.aggregate([
            {
                $match: {
                    invoiceDate: { $gte: monthStart, $lte: monthEnd },
                    status: { $ne: 'Cancelled' }
                }
            },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const thisMonthPayments = await Payment.aggregate([
            {
                $match: {
                    createdAt: { $gte: monthStart, $lte: monthEnd },
                    status: 'Completed'
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // Previous month statistics for comparison
        const prevMonthBookings = await Booking.countDocuments({
            createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd }
        });
        const prevMonthRevenue = await Invoice.aggregate([
            {
                $match: {
                    invoiceDate: { $gte: prevMonthStart, $lte: prevMonthEnd },
                    status: { $ne: 'Cancelled' }
                }
            },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        // Calculate growth percentages
        const bookingGrowth = prevMonthBookings > 0
            ? ((thisMonthBookings - prevMonthBookings) / prevMonthBookings * 100).toFixed(1)
            : 0;
        const revenueGrowth = (prevMonthRevenue[0]?.total || 0) > 0
            ? (((thisMonthRevenue[0]?.total || 0) - prevMonthRevenue[0].total) / prevMonthRevenue[0].total * 100).toFixed(1)
            : 0;

        // Booking status breakdown
        const bookingsByStatus = await Booking.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Pending tasks
        const pendingDeliveries = await Booking.countDocuments({
            status: { $in: ['Booked', 'Picked Up', 'In Transit', 'Out for Delivery'] }
        });
        const overdueInvoices = await Invoice.countDocuments({
            status: { $ne: 'Paid' },
            dueDate: { $lt: now }
        });
        const pendingPayments = await Payment.countDocuments({ status: 'Pending' });

        res.json({
            totals: {
                bookings: totalBookings,
                shippers: totalShippers,
                revenue: totalRevenue[0]?.total || 0,
                payments: totalPayments[0]?.total || 0
            },
            thisMonth: {
                bookings: thisMonthBookings,
                revenue: thisMonthRevenue[0]?.total || 0,
                payments: thisMonthPayments[0]?.total || 0
            },
            growth: {
                bookings: parseFloat(bookingGrowth),
                revenue: parseFloat(revenueGrowth)
            },
            bookingsByStatus,
            pending: {
                deliveries: pendingDeliveries,
                overdueInvoices,
                payments: pendingPayments
            }
        });
    } catch (error) {
        console.error('Error fetching overview stats:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get revenue analytics
// @route   GET /api/dashboard/revenue
// @access  Private
exports.getRevenueAnalytics = async (req, res) => {
    try {
        const { period = '30' } = req.query; // days
        const daysAgo = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);

        // Daily revenue for the period
        const dailyRevenue = await Invoice.aggregate([
            {
                $match: {
                    invoiceDate: { $gte: startDate },
                    status: { $ne: 'Cancelled' }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$invoiceDate' },
                        month: { $month: '$invoiceDate' },
                        day: { $dayOfMonth: '$invoiceDate' }
                    },
                    revenue: { $sum: '$totalAmount' },
                    paid: { $sum: '$paidAmount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
            }
        ]);

        // Revenue by service type
        const revenueByService = await Booking.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: 'Delivered'
                }
            },
            {
                $group: {
                    _id: '$serviceType',
                    revenue: { $sum: '$totalAmount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Revenue by payment gateway
        const revenueByGateway = await Payment.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: 'Completed'
                }
            },
            {
                $group: {
                    _id: '$gateway',
                    revenue: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Top revenue generating shippers
        const topShippers = await Booking.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: 'Delivered'
                }
            },
            {
                $group: {
                    _id: '$shipper',
                    revenue: { $sum: '$totalAmount' },
                    bookings: { $sum: 1 }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'shippers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'shipperInfo'
                }
            },
            { $unwind: '$shipperInfo' }
        ]);

        res.json({
            dailyRevenue,
            revenueByService,
            revenueByGateway,
            topShippers
        });
    } catch (error) {
        console.error('Error fetching revenue analytics:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get booking analytics
// @route   GET /api/dashboard/bookings
// @access  Private
exports.getBookingAnalytics = async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const daysAgo = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);

        // Daily bookings trend
        const dailyBookings = await Booking.aggregate([
            {
                $match: { createdAt: { $gte: startDate } }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    delivered: {
                        $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] }
                    },
                    cancelled: {
                        $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] }
                    }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
            }
        ]);

        // Bookings by service type
        const bookingsByService = await Booking.aggregate([
            {
                $match: { createdAt: { $gte: startDate } }
            },
            {
                $group: {
                    _id: '$serviceType',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' }
                }
            }
        ]);

        // Bookings by status
        const bookingsByStatus = await Booking.aggregate([
            {
                $match: { createdAt: { $gte: startDate } }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Delivery performance
        const deliveryPerformance = await Booking.aggregate([
            {
                $match: {
                    status: 'Delivered',
                    deliveryDate: { $gte: startDate }
                }
            },
            {
                $project: {
                    onTime: {
                        $cond: [
                            { $lte: ['$deliveryDate', '$expectedDeliveryDate'] },
                            1,
                            0
                        ]
                    },
                    delayed: {
                        $cond: [
                            { $gt: ['$deliveryDate', '$expectedDeliveryDate'] },
                            1,
                            0
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    onTime: { $sum: '$onTime' },
                    delayed: { $sum: '$delayed' },
                    total: { $sum: 1 }
                }
            }
        ]);

        // Average delivery time by service type
        const avgDeliveryTime = await Booking.aggregate([
            {
                $match: {
                    status: 'Delivered',
                    deliveryDate: { $exists: true }
                }
            },
            {
                $project: {
                    serviceType: 1,
                    deliveryDays: {
                        $divide: [
                            { $subtract: ['$deliveryDate', '$createdAt'] },
                            1000 * 60 * 60 * 24
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: '$serviceType',
                    avgDays: { $avg: '$deliveryDays' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            dailyBookings,
            bookingsByService,
            bookingsByStatus,
            deliveryPerformance: deliveryPerformance[0] || { onTime: 0, delayed: 0, total: 0 },
            avgDeliveryTime
        });
    } catch (error) {
        console.error('Error fetching booking analytics:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get performance metrics
// @route   GET /api/dashboard/performance
// @access  Private
exports.getPerformanceMetrics = async (req, res) => {
    try {
        const now = new Date();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Success rate (delivered vs total)
        const totalBookings = await Booking.countDocuments({
            createdAt: { $gte: last30Days }
        });
        const deliveredBookings = await Booking.countDocuments({
            status: 'Delivered',
            deliveryDate: { $gte: last30Days }
        });
        const successRate = totalBookings > 0
            ? ((deliveredBookings / totalBookings) * 100).toFixed(1)
            : 0;

        // Collection rate (paid vs invoiced)
        const totalInvoiced = await Invoice.aggregate([
            {
                $match: {
                    invoiceDate: { $gte: last30Days },
                    status: { $ne: 'Cancelled' }
                }
            },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const totalCollected = await Invoice.aggregate([
            {
                $match: {
                    invoiceDate: { $gte: last30Days },
                    status: { $ne: 'Cancelled' }
                }
            },
            { $group: { _id: null, total: { $sum: '$paidAmount' } } }
        ]);
        const collectionRate = (totalInvoiced[0]?.total || 0) > 0
            ? (((totalCollected[0]?.total || 0) / totalInvoiced[0].total) * 100).toFixed(1)
            : 0;

        // Customer satisfaction (based on delivered without exceptions)
        const deliveredWithoutIssues = await Booking.countDocuments({
            status: 'Delivered',
            deliveryDate: { $gte: last30Days },
            hasException: { $ne: true }
        });
        const satisfactionRate = deliveredBookings > 0
            ? ((deliveredWithoutIssues / deliveredBookings) * 100).toFixed(1)
            : 0;

        // Average response time (booking to pickup)
        const avgResponseTime = await Booking.aggregate([
            {
                $match: {
                    status: { $in: ['Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'] },
                    pickupDate: { $exists: true },
                    createdAt: { $gte: last30Days }
                }
            },
            {
                $project: {
                    responseHours: {
                        $divide: [
                            { $subtract: ['$pickupDate', '$createdAt'] },
                            1000 * 60 * 60
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    avgHours: { $avg: '$responseHours' }
                }
            }
        ]);

        // Active shippers (with bookings in last 7 days)
        const activeShippers = await Booking.aggregate([
            {
                $match: { createdAt: { $gte: last7Days } }
            },
            {
                $group: { _id: '$shipper' }
            },
            {
                $count: 'count'
            }
        ]);

        // Recent activity (last 24 hours)
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const recentActivity = {
            newBookings: await Booking.countDocuments({ createdAt: { $gte: last24Hours } }),
            newPayments: await Payment.countDocuments({
                createdAt: { $gte: last24Hours },
                status: 'Completed'
            }),
            deliveries: await Booking.countDocuments({
                status: 'Delivered',
                deliveryDate: { $gte: last24Hours }
            })
        };

        res.json({
            successRate: parseFloat(successRate),
            collectionRate: parseFloat(collectionRate),
            satisfactionRate: parseFloat(satisfactionRate),
            avgResponseTime: avgResponseTime[0]?.avgHours?.toFixed(1) || 0,
            activeShippers: activeShippers[0]?.count || 0,
            recentActivity
        });
    } catch (error) {
        console.error('Error fetching performance metrics:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get recent activities
// @route   GET /api/dashboard/activities
// @access  Private
exports.getRecentActivities = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;

        // Recent bookings
        const recentBookings = await Booking.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('shipper', 'companyName')
            .select('awbNumber status serviceType totalAmount createdAt');

        // Recent payments
        const recentPayments = await Payment.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('shipper', 'companyName')
            .select('transactionId amount gateway status createdAt');

        // Recent invoices
        const recentInvoices = await Invoice.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('shipper', 'companyName')
            .select('invoiceNumber totalAmount status createdAt');

        res.json({
            bookings: recentBookings,
            payments: recentPayments,
            invoices: recentInvoices
        });
    } catch (error) {
        console.error('Error fetching recent activities:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
