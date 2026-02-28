const express = require('express');
const router = express.Router();
const {
  getAllExceptions,
  getExceptionById,
  reportException,
  updateException,
  assignException,
  resolveException,
  addNote,
  deleteException
} = require('../controllers/exception.controller');

const { protect } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/permission.middleware');

// Public route for reporting exceptions
router.post('/report', reportException);

// Protected routes
router.use(protect);

router.get('/', checkPermission('complaints', 'canView'), getAllExceptions);
router.post('/', checkPermission('complaints', 'canAdd'), reportException);

router.get('/:id', checkPermission('complaints', 'canView'), getExceptionById);
router.put('/:id', checkPermission('complaints', 'canEdit'), updateException);
router.delete('/:id', checkPermission('complaints', 'canDelete'), deleteException);

router.put('/:id/assign', checkPermission('complaints', 'canEdit'), assignException);
router.put('/:id/resolve', checkPermission('complaints', 'canEdit'), resolveException);
router.post('/:id/notes', checkPermission('complaints', 'canEdit'), addNote);

module.exports = router;
