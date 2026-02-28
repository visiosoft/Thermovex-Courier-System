const express = require('express');
const router = express.Router();
const {
    getAllRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    duplicateRole,
    initializeDefaultRoles
} = require('../controllers/role.controller');
const { protect, checkPermission, restrictTo } = require('../middleware/auth.middleware');

// Protect all routes
router.use(protect);

router.get('/', checkPermission('roles', 'view'), getAllRoles);
router.post('/', checkPermission('roles', 'add'), createRole);
router.post('/init-defaults', restrictTo('Super Admin'), initializeDefaultRoles);
router.get('/:id', checkPermission('roles', 'view'), getRoleById);
router.put('/:id', checkPermission('roles', 'edit'), updateRole);
router.delete('/:id', checkPermission('roles', 'delete'), deleteRole);
router.post('/:id/duplicate', checkPermission('roles', 'add'), duplicateRole);

module.exports = router;
