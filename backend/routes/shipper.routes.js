const express = require('express');
const router = express.Router();
const {
    getAllShippers,
    getShipperById,
    createShipper,
    updateShipper,
    deleteShipper,
    toggleShipperStatus,
    verifyShipper,
    getShipperStats
} = require('../controllers/shipper.controller');
const { protect, checkPermission } = require('../middleware/auth.middleware');

// Protect all routes
router.use(protect);

router.get('/', checkPermission('shipper', 'view'), getAllShippers);
router.post('/', checkPermission('shipper', 'add'), createShipper);
router.get('/:id', checkPermission('shipper', 'view'), getShipperById);
router.put('/:id', checkPermission('shipper', 'edit'), updateShipper);
router.delete('/:id', checkPermission('shipper', 'delete'), deleteShipper);
router.put('/:id/status', checkPermission('shipper', 'edit'), toggleShipperStatus);
router.put('/:id/verify', checkPermission('shipper', 'edit'), verifyShipper);
router.get('/:id/stats', checkPermission('shipper', 'view'), getShipperStats);

module.exports = router;
