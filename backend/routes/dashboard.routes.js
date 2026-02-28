const express = require('express');
const router = express.Router();
const {
    getOverviewStats,
    getRevenueAnalytics,
    getBookingAnalytics,
    getPerformanceMetrics,
    getRecentActivities
} = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes are protected
router.use(protect);

// Dashboard routes
router.get('/overview', getOverviewStats);
router.get('/revenue', getRevenueAnalytics);
router.get('/bookings', getBookingAnalytics);
router.get('/performance', getPerformanceMetrics);
router.get('/activities', getRecentActivities);

module.exports = router;
