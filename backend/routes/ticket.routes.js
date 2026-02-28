const express = require('express');
const router = express.Router();
const {
    getAllTickets,
    getTicketsByShipper,
    getTicketById,
    createTicket,
    updateTicket,
    addResponse,
    assignTicket,
    escalateTicket,
    resolveTicket,
    closeTicket,
    deleteTicket
} = require('../controllers/ticket.controller');
const { protect, checkPermission } = require('../middleware/auth.middleware');

// Protect all routes
router.use(protect);

router.get('/', checkPermission('complaints', 'view'), getAllTickets);
router.post('/', checkPermission('complaints', 'add'), createTicket);
router.get('/shipper/:shipperId', checkPermission('complaints', 'view'), getTicketsByShipper);
router.get('/:id', checkPermission('complaints', 'view'), getTicketById);
router.put('/:id', checkPermission('complaints', 'edit'), updateTicket);
router.post('/:id/response', checkPermission('complaints', 'edit'), addResponse);
router.put('/:id/assign', checkPermission('complaints', 'edit'), assignTicket);
router.put('/:id/escalate', checkPermission('complaints', 'edit'), escalateTicket);
router.put('/:id/resolve', checkPermission('complaints', 'edit'), resolveTicket);
router.put('/:id/close', checkPermission('complaints', 'edit'), closeTicket);
router.delete('/:id', checkPermission('complaints', 'delete'), deleteTicket);

module.exports = router;
