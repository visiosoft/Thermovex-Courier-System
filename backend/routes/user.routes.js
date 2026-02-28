const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    toggleBlockUser,
    resetPassword,
    getUserActivity
} = require('../controllers/user.controller');
const { protect, checkPermission } = require('../middleware/auth.middleware');

// Protect all routes
router.use(protect);

router.get('/', checkPermission('users', 'view'), getAllUsers);
router.post('/', checkPermission('users', 'add'), createUser);
router.get('/:id', checkPermission('users', 'view'), getUserById);
router.put('/:id', checkPermission('users', 'edit'), updateUser);
router.delete('/:id', checkPermission('users', 'delete'), deleteUser);
router.put('/:id/block', checkPermission('users', 'edit'), toggleBlockUser);
router.put('/:id/reset-password', checkPermission('users', 'edit'), resetPassword);
router.get('/:id/activity', checkPermission('users', 'view'), getUserActivity);

module.exports = router;
