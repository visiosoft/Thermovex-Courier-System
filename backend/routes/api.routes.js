const express = require('express');
const router = express.Router();
const {
    createBooking,
    getBooking,
    trackShipment,
    calculateRate,
    getInvoices
} = require('../controllers/api.controller');
const {
    authenticateApiKey,
    requirePermission,
    apiRateLimiter
} = require('../middleware/apiAuth.middleware');

// Apply API authentication and rate limiting to all routes
router.use(authenticateApiKey);
router.use(apiRateLimiter);

// Booking endpoints
router.post('/bookings', requirePermission('booking.create'), createBooking);
router.get('/bookings/:awbNumber', requirePermission('booking.read'), getBooking);

// Tracking endpoint
router.get('/track/:awbNumber', requirePermission('tracking.read'), trackShipment);

// Rate calculation
router.post('/rates/calculate', requirePermission('rate.calculate'), calculateRate);

// Invoice endpoints
router.get('/invoices', requirePermission('invoice.read'), getInvoices);

module.exports = router;
