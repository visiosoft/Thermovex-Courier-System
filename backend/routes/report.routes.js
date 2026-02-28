const express = require('express');
const router = express.Router();
const {
    generateRevenueReport,
    generateBookingReport,
    generatePerformanceReport,
    exportToPDF,
    exportToExcel
} = require('../controllers/report.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes are protected
router.use(protect);

// Report generation routes
router.post('/revenue', generateRevenueReport);
router.post('/bookings', generateBookingReport);
router.post('/performance', generatePerformanceReport);

// Export routes
router.post('/export/pdf', exportToPDF);
router.post('/export/excel', exportToExcel);

module.exports = router;
