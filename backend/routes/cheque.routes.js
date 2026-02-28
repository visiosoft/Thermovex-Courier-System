const express = require('express');
const router = express.Router();
const {
    getAllCheques,
    getChequesByShipper,
    getChequeById,
    createCheque,
    updateCheque,
    updateChequeStatus,
    deleteCheque
} = require('../controllers/cheque.controller');
const { protect, checkPermission } = require('../middleware/auth.middleware');

// Protect all routes
router.use(protect);

router.get('/', checkPermission('payments', 'view'), getAllCheques);
router.post('/', checkPermission('payments', 'add'), createCheque);
router.get('/shipper/:shipperId', checkPermission('payments', 'view'), getChequesByShipper);
router.get('/:id', checkPermission('payments', 'view'), getChequeById);
router.put('/:id', checkPermission('payments', 'edit'), updateCheque);
router.put('/:id/status', checkPermission('payments', 'edit'), updateChequeStatus);
router.delete('/:id', checkPermission('payments', 'delete'), deleteCheque);

module.exports = router;
