const express = require('express');
const router = express.Router();
const {
    getAllManifests,
    getManifestById,
    createManifest,
    updateManifest,
    dispatchManifest,
    deleteManifest
} = require('../controllers/manifest.controller');

const { protect } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/permission.middleware');

router.use(protect);

router.get('/', checkPermission('booking', 'canView'), getAllManifests);
router.post('/', checkPermission('booking', 'canAdd'), createManifest);

router.get('/:id', checkPermission('booking', 'canView'), getManifestById);
router.put('/:id', checkPermission('booking', 'canEdit'), updateManifest);
router.delete('/:id', checkPermission('booking', 'canDelete'), deleteManifest);

router.put('/:id/dispatch', checkPermission('booking', 'canEdit'), dispatchManifest);

module.exports = router;
