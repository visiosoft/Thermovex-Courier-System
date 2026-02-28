const express = require('express');
const router = express.Router();
const {
    getAllDispatches,
    getDispatchById,
    createDispatch,
    updateDispatch,
    markDispatched,
    markReceived,
    deleteDispatch
} = require('../controllers/dispatch.controller');

const { protect } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/permission.middleware');

router.use(protect);

router.get('/', checkPermission('booking', 'canView'), getAllDispatches);
router.post('/', checkPermission('booking', 'canAdd'), createDispatch);

router.get('/:id', checkPermission('booking', 'canView'), getDispatchById);
router.put('/:id', checkPermission('booking', 'canEdit'), updateDispatch);
router.delete('/:id', checkPermission('booking', 'canDelete'), deleteDispatch);

router.put('/:id/dispatch', checkPermission('booking', 'canEdit'), markDispatched);
router.put('/:id/receive', checkPermission('booking', 'canEdit'), markReceived);

module.exports = router;
