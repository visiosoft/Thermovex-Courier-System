const express = require('express');
const router = express.Router();
const {
    getAllBookings,
    getBookingById,
    getBookingByAWB,
    createBooking,
    updateBooking,
    updateBookingStatus,
    cancelBooking,
    deleteBooking,
    getBookingStats,
    bulkCreateBookings,
    uploadPOD
} = require('../controllers/booking.controller');

const { protect } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/permission.middleware');
const { upload } = require('../middleware/upload.middleware');

// Public route for tracking
router.get('/awb/:awbNumber', getBookingByAWB);

// Protected routes
router.use(protect);

// Stats
router.get('/stats/summary', checkPermission('booking', 'canView'), getBookingStats);

// Bulk operations
router.post('/bulk', checkPermission('booking', 'canAdd'), bulkCreateBookings);

// Standard CRUD
router.get('/', checkPermission('booking', 'canView'), getAllBookings);
router.post('/', checkPermission('booking', 'canAdd'), createBooking);

router.get('/:id', checkPermission('booking', 'canView'), getBookingById);
router.put('/:id', checkPermission('booking', 'canEdit'), updateBooking);
router.delete('/:id', checkPermission('booking', 'canDelete'), deleteBooking);

// Status operations
router.put('/:id/status', checkPermission('booking', 'canEdit'), updateBookingStatus);
router.put('/:id/cancel', checkPermission('booking', 'canEdit'), cancelBooking);

// POD upload
router.post('/:id/pod', checkPermission('booking', 'canEdit'), upload.single('podFile'), uploadPOD);

module.exports = router;
