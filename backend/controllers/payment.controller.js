const Payment = require('../models/Payment.model');
const Invoice = require('../models/Invoice.model');
const Booking = require('../models/Booking.model');
const Shipper = require('../models/Shipper.model');
const axios = require('axios');
const crypto = require('crypto');

// PayPal Configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox'; // sandbox or live
const PAYPAL_API_BASE = PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

// Skrill Configuration
const SKRILL_MERCHANT_EMAIL = process.env.SKRILL_MERCHANT_EMAIL;
const SKRILL_MERCHANT_ID = process.env.SKRILL_MERCHANT_ID;
const SKRILL_SECRET_WORD = process.env.SKRILL_SECRET_WORD;
const SKRILL_API_URL = 'https://pay.skrill.com';

// Get PayPal Access Token
const getPayPalAccessToken = async () => {
    try {
        const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
        const response = await axios.post(
            `${PAYPAL_API_BASE}/v1/oauth2/token`,
            'grant_type=client_credentials',
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting PayPal access token:', error);
        throw new Error('Failed to authenticate with PayPal');
    }
};

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
exports.getPayments = async (req, res) => {
    try {
        const { shipper, status, gateway, fromDate, toDate, search } = req.query;

        const filter = {};
        if (shipper) filter.shipper = shipper;
        if (status) filter.status = status;
        if (gateway) filter.gateway = gateway;

        if (fromDate || toDate) {
            filter.createdAt = {};
            if (fromDate) filter.createdAt.$gte = new Date(fromDate);
            if (toDate) filter.createdAt.$lte = new Date(toDate);
        }

        if (search) {
            filter.$or = [
                { transactionId: { $regex: search, $options: 'i' } },
                { gatewayTransactionId: { $regex: search, $options: 'i' } }
            ];
        }

        const payments = await Payment.find(filter)
            .populate('shipper', 'companyName email')
            .populate('invoice', 'invoiceNumber')
            .populate('booking', 'awbNumber')
            .sort({ createdAt: -1 });

        res.json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
exports.getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('shipper')
            .populate('invoice')
            .populate('booking')
            .populate('createdBy', 'name email');

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json(payment);
    } catch (error) {
        console.error('Error fetching payment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create PayPal payment order
// @route   POST /api/payments/paypal/create
// @access  Private
exports.createPayPalPayment = async (req, res) => {
    try {
        const { invoiceId, amount, currency = 'USD', description } = req.body;

        if (!invoiceId || !amount) {
            return res.status(400).json({ message: 'Invoice ID and amount are required' });
        }

        // Validate invoice
        const invoice = await Invoice.findById(invoiceId).populate('shipper');
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Create payment record
        const transactionId = await Payment.generateTransactionId();

        const payment = new Payment({
            transactionId,
            invoice: invoiceId,
            shipper: invoice.shipper._id,
            amount,
            currency,
            gateway: 'PayPal',
            status: 'Pending',
            description: description || `Payment for Invoice ${invoice.invoiceNumber}`,
            payerEmail: invoice.shipper.email,
            payerName: invoice.shipper.companyName,
            createdBy: req.user?.id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        // Get PayPal access token
        const accessToken = await getPayPalAccessToken();

        // Create PayPal order
        const orderData = {
            intent: 'CAPTURE',
            purchase_units: [{
                reference_id: transactionId,
                description: payment.description,
                amount: {
                    currency_code: currency,
                    value: amount.toFixed(2)
                },
                invoice_id: invoice.invoiceNumber
            }],
            application_context: {
                return_url: `${process.env.FRONTEND_URL}/payments/paypal/success`,
                cancel_url: `${process.env.FRONTEND_URL}/payments/paypal/cancel`,
                brand_name: 'Thermovex Courier',
                user_action: 'PAY_NOW'
            }
        };

        const orderResponse = await axios.post(
            `${PAYPAL_API_BASE}/v2/checkout/orders`,
            orderData,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Update payment with PayPal order ID
        payment.paypalPaymentId = orderResponse.data.id;
        payment.gatewayOrderId = orderResponse.data.id;
        payment.status = 'Processing';

        await payment.save();

        // Get approval URL
        const approvalUrl = orderResponse.data.links.find(link => link.rel === 'approve').href;

        res.json({
            success: true,
            paymentId: payment._id,
            transactionId: payment.transactionId,
            orderId: orderResponse.data.id,
            approvalUrl
        });

    } catch (error) {
        console.error('Error creating PayPal payment:', error.response?.data || error);
        res.status(500).json({
            message: 'Failed to create PayPal payment',
            error: error.response?.data?.message || error.message
        });
    }
};

// @desc    Capture PayPal payment
// @route   POST /api/payments/paypal/capture/:orderId
// @access  Private
exports.capturePayPalPayment = async (req, res) => {
    try {
        const { orderId } = req.params;

        const payment = await Payment.findOne({ paypalPaymentId: orderId });
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Get PayPal access token
        const accessToken = await getPayPalAccessToken();

        // Capture the payment
        const captureResponse = await axios.post(
            `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
            {},
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const captureData = captureResponse.data;

        // Update payment
        payment.status = 'Completed';
        payment.completedAt = new Date();
        payment.gatewayTransactionId = captureData.purchase_units[0].payments.captures[0].id;
        payment.paypalPayerId = captureData.payer.payer_id;
        payment.payerEmail = captureData.payer.email_address;
        payment.payerName = `${captureData.payer.name.given_name} ${captureData.payer.name.surname}`;
        payment.webhookData = captureData;

        await payment.save();

        // Update invoice
        if (payment.invoice) {
            const invoice = await Invoice.findById(payment.invoice);
            if (invoice) {
                invoice.addPayment({
                    amount: payment.amount,
                    paymentDate: new Date(),
                    paymentMethod: 'PayPal',
                    reference: payment.gatewayTransactionId,
                    remarks: `PayPal Payment - ${payment.transactionId}`
                }, req.user?.id);
                await invoice.save();
            }
        }

        res.json({
            success: true,
            payment,
            message: 'Payment completed successfully'
        });

    } catch (error) {
        console.error('Error capturing PayPal payment:', error.response?.data || error);

        // Mark payment as failed
        const payment = await Payment.findOne({ paypalPaymentId: req.params.orderId });
        if (payment) {
            payment.markFailed(
                error.response?.data?.name || 'CAPTURE_ERROR',
                error.response?.data?.message || error.message
            );
            await payment.save();
        }

        res.status(500).json({
            message: 'Failed to capture PayPal payment',
            error: error.response?.data?.message || error.message
        });
    }
};

// @desc    Create Skrill payment
// @route   POST /api/payments/skrill/create
// @access  Private
exports.createSkrillPayment = async (req, res) => {
    try {
        const { invoiceId, amount, currency = 'USD', description } = req.body;

        if (!invoiceId || !amount) {
            return res.status(400).json({ message: 'Invoice ID and amount are required' });
        }

        // Validate invoice
        const invoice = await Invoice.findById(invoiceId).populate('shipper');
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Create payment record
        const transactionId = await Payment.generateTransactionId();

        const payment = new Payment({
            transactionId,
            invoice: invoiceId,
            shipper: invoice.shipper._id,
            amount,
            currency,
            gateway: 'Skrill',
            status: 'Pending',
            description: description || `Payment for Invoice ${invoice.invoiceNumber}`,
            payerEmail: invoice.shipper.email,
            payerName: invoice.shipper.companyName,
            createdBy: req.user?.id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        await payment.save();

        // Prepare Skrill payment data
        const skrillData = {
            pay_to_email: SKRILL_MERCHANT_EMAIL,
            transaction_id: payment.transactionId,
            return_url: `${process.env.FRONTEND_URL}/payments/skrill/success`,
            cancel_url: `${process.env.FRONTEND_URL}/payments/skrill/cancel`,
            status_url: `${process.env.BACKEND_URL}/api/payments/skrill/webhook`,
            language: 'EN',
            amount: amount.toFixed(2),
            currency: currency,
            detail1_description: 'Invoice Number',
            detail1_text: invoice.invoiceNumber,
            recipient_description: 'Thermovex Courier Services',
            merchant_fields: `payment_id:${payment._id}`,
            logo_url: `${process.env.FRONTEND_URL}/logo.png`
        };

        res.json({
            success: true,
            paymentId: payment._id,
            transactionId: payment.transactionId,
            skrillData,
            skrillUrl: SKRILL_API_URL
        });

    } catch (error) {
        console.error('Error creating Skrill payment:', error);
        res.status(500).json({
            message: 'Failed to create Skrill payment',
            error: error.message
        });
    }
};

// @desc    Handle Skrill webhook
// @route   POST /api/payments/skrill/webhook
// @access  Public
exports.skrillWebhook = async (req, res) => {
    try {
        const {
            transaction_id,
            mb_transaction_id,
            status,
            amount,
            currency,
            pay_from_email,
            merchant_fields,
            md5sig
        } = req.body;

        // Verify MD5 signature
        const expectedSignature = crypto
            .createHash('md5')
            .update(`${SKRILL_MERCHANT_ID}${transaction_id}${SKRILL_SECRET_WORD}${mb_transaction_id}${amount}${currency}${status}`)
            .digest('hex')
            .toUpperCase();

        if (md5sig !== expectedSignature) {
            console.error('Invalid Skrill signature');
            return res.status(400).send('Invalid signature');
        }

        // Find payment
        const payment = await Payment.findOne({ transactionId: transaction_id });
        if (!payment) {
            console.error('Payment not found:', transaction_id);
            return res.status(404).send('Payment not found');
        }

        // Update payment based on status
        payment.skrillTransactionId = mb_transaction_id;
        payment.gatewayTransactionId = mb_transaction_id;
        payment.webhookReceived = true;
        payment.webhookData = req.body;
        payment.webhookReceivedAt = new Date();

        if (status === '2') {
            // Payment processed
            payment.status = 'Completed';
            payment.completedAt = new Date();
            payment.payerEmail = pay_from_email;

            // Update invoice
            if (payment.invoice) {
                const invoice = await Invoice.findById(payment.invoice);
                if (invoice) {
                    invoice.addPayment({
                        amount: payment.amount,
                        paymentDate: new Date(),
                        paymentMethod: 'Skrill',
                        reference: mb_transaction_id,
                        remarks: `Skrill Payment - ${transaction_id}`
                    }, payment.createdBy);
                    await invoice.save();
                }
            }
        } else if (status === '0') {
            // Payment pending
            payment.status = 'Processing';
        } else if (status === '-1' || status === '-2' || status === '-3') {
            // Payment failed/cancelled
            payment.markFailed('SKRILL_ERROR', `Status code: ${status}`);
        }

        await payment.save();

        res.status(200).send('OK');

    } catch (error) {
        console.error('Error processing Skrill webhook:', error);
        res.status(500).send('Error processing webhook');
    }
};

// @desc    Get payment statistics
// @route   GET /api/payments/stats/summary
// @access  Private
exports.getPaymentStats = async (req, res) => {
    try {
        const totalPayments = await Payment.countDocuments();
        const completedPayments = await Payment.countDocuments({ status: 'Completed' });
        const pendingPayments = await Payment.countDocuments({ status: 'Pending' });
        const failedPayments = await Payment.countDocuments({ status: 'Failed' });

        const totalRevenue = await Payment.aggregate([
            { $match: { status: 'Completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const revenueByGateway = await Payment.aggregate([
            { $match: { status: 'Completed' } },
            { $group: { _id: '$gateway', total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);

        res.json({
            totalPayments,
            completedPayments,
            pendingPayments,
            failedPayments,
            totalRevenue: totalRevenue[0]?.total || 0,
            revenueByGateway
        });
    } catch (error) {
        console.error('Error fetching payment stats:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Refund payment
// @route   POST /api/payments/:id/refund
// @access  Private
exports.refundPayment = async (req, res) => {
    try {
        const { amount, reason } = req.body;

        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        if (payment.status !== 'Completed') {
            return res.status(400).json({ message: 'Only completed payments can be refunded' });
        }

        const refundAmount = amount || payment.amount;

        if (refundAmount > payment.amount) {
            return res.status(400).json({ message: 'Refund amount cannot exceed payment amount' });
        }

        // Process refund based on gateway
        if (payment.gateway === 'PayPal') {
            const accessToken = await getPayPalAccessToken();

            await axios.post(
                `${PAYPAL_API_BASE}/v2/payments/captures/${payment.gatewayTransactionId}/refund`,
                {
                    amount: {
                        currency_code: payment.currency,
                        value: refundAmount.toFixed(2)
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
        }
        // Note: Skrill refunds need to be processed manually through merchant account

        payment.markRefunded(refundAmount, reason, req.user.id);
        await payment.save();

        res.json({
            success: true,
            payment,
            message: 'Payment refunded successfully'
        });

    } catch (error) {
        console.error('Error refunding payment:', error);
        res.status(500).json({
            message: 'Failed to refund payment',
            error: error.response?.data?.message || error.message
        });
    }
};
