const express = require('express');
const router = express.Router();
const {
  getAllInvoices,
  getInvoiceById,
  getInvoiceByNumber,
  createInvoice,
  generateInvoiceFromBooking,
  updateInvoice,
  recordPayment,
  cancelInvoice,
  markAsSent,
  getInvoiceStats,
  deleteInvoice
} = require('../controllers/invoice.controller');
const { generateInvoicePDF } = require('../controllers/pdf.controller');
const { protect } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/permission.middleware');

// Public route - get invoice by number
router.get('/number/:invoiceNumber', getInvoiceByNumber);

// Protected routes
router.use(protect);

// Invoice CRUD
router.get('/', checkPermission('invoice', 'canView'), getAllInvoices);
router.post('/', checkPermission('invoice', 'canCreate'), createInvoice);
router.get('/stats', checkPermission('invoice', 'canView'), getInvoiceStats);
router.get('/:id', checkPermission('invoice', 'canView'), getInvoiceById);
router.put('/:id', checkPermission('invoice', 'canEdit'), updateInvoice);
router.delete('/:id', checkPermission('invoice', 'canDelete'), deleteInvoice);

// Special operations
router.post('/generate/:bookingId', checkPermission('invoice', 'canCreate'), generateInvoiceFromBooking);
router.post('/:id/payment', checkPermission('invoice', 'canEdit'), recordPayment);
router.put('/:id/cancel', checkPermission('invoice', 'canEdit'), cancelInvoice);
router.put('/:id/send', checkPermission('invoice', 'canEdit'), markAsSent);
router.get('/:id/pdf', checkPermission('invoice', 'canView'), generateInvoicePDF);

module.exports = router;
