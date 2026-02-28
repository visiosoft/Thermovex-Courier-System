const express = require('express');
const router = express.Router();
const {
    getAllSettings,
    getSettingsByKey,
    updateSettings,
    deleteSettings
} = require('../controllers/settings.controller');

const { protect } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/permission.middleware');

// All routes are protected
router.use(protect);

router.get('/', checkPermission('settings', 'canView'), getAllSettings);
router.get('/:key', checkPermission('settings', 'canView'), getSettingsByKey);
router.put('/:key', checkPermission('settings', 'canEdit'), updateSettings);
router.delete('/:key', checkPermission('settings', 'canDelete'), deleteSettings);

module.exports = router;
