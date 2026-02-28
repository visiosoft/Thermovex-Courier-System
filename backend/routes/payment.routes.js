const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');

// Public routes (webhooks)
router.post('/skrill/webhook', paymentController.skrillWebhook);

// Protected routes
router.use(protect);

router.get('/', paymentController.getPayments);
router.get('/stats/summary', paymentController.getPaymentStats);
router.get('/:id', paymentController.getPaymentById);

// PayPal routes
router.post('/paypal/create', paymentController.createPayPalPayment);
router.post('/paypal/capture/:orderId', paymentController.capturePayPalPayment);

// Skrill routes
router.post('/skrill/create', paymentController.createSkrillPayment);

// Refund
router.post('/:id/refund', paymentController.refundPayment);

module.exports = router;
