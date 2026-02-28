const express = require('express');
const router = express.Router();
const {
    getAllConsignees,
    getConsigneesByShipper,
    getConsigneeById,
    createConsignee,
    updateConsignee,
    deleteConsignee
} = require('../controllers/consignee.controller');
const { protect, checkPermission } = require('../middleware/auth.middleware');

// Protect all routes
router.use(protect);

router.get('/', checkPermission('shipper', 'view'), getAllConsignees);
router.post('/', checkPermission('shipper', 'add'), createConsignee);
router.get('/shipper/:shipperId', checkPermission('shipper', 'view'), getConsigneesByShipper);
router.get('/:id', checkPermission('shipper', 'view'), getConsigneeById);
router.put('/:id', checkPermission('shipper', 'edit'), updateConsignee);
router.delete('/:id', checkPermission('shipper', 'delete'), deleteConsignee);

module.exports = router;
