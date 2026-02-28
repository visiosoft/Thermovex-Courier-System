const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Reference
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice'
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    },
    shipper: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipper',
        required: true
    },

    // Payment Details
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD']
    },

    // Gateway Information
    gateway: {
        type: String,
        required: true,
        enum: ['PayPal', 'Skrill', 'Manual', 'Cash', 'Cheque', 'Bank Transfer']
    },
    gatewayTransactionId: {
        type: String,
        index: true
    },
    gatewayOrderId: String,
    gatewayPayerId: String,

    // PayPal Specific
    paypalPaymentId: String,
    paypalPayerId: String,
    paypalToken: String,

    // Skrill Specific
    skrillTransactionId: String,
    skrillMbTransactionId: String,
    skrillSessionId: String,

    // Status
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Completed', 'Failed', 'Cancelled', 'Refunded'],
        default: 'Pending',
        index: true
    },

    // Payment Method
    paymentMethod: {
        type: String,
        enum: ['Credit Card', 'Debit Card', 'PayPal Balance', 'Skrill Wallet', 'Bank Transfer', 'Cash', 'Cheque', 'Other']
    },

    // Customer Information
    payerEmail: String,
    payerName: String,
    payerPhone: String,

    // Transaction Dates
    initiatedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: Date,
    failedAt: Date,
    refundedAt: Date,

    // Error Handling
    errorCode: String,
    errorMessage: String,

    // Webhook Data
    webhookReceived: {
        type: Boolean,
        default: false
    },
    webhookData: mongoose.Schema.Types.Mixed,
    webhookReceivedAt: Date,

    // Refund Information
    isRefunded: {
        type: Boolean,
        default: false
    },
    refundAmount: Number,
    refundReason: String,
    refundedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Additional Info
    description: String,
    metadata: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,

    // Record Keeping
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: String
}, {
    timestamps: true
});

// Generate unique transaction ID
paymentSchema.statics.generateTransactionId = async function () {
    const count = await this.countDocuments();
    const number = String(count + 1).padStart(8, '0');
    return `TXN${number}`;
};

// Update payment status
paymentSchema.methods.markCompleted = function (gatewayData = {}) {
    this.status = 'Completed';
    this.completedAt = new Date();
    this.webhookReceived = true;
    this.webhookData = gatewayData;
    this.webhookReceivedAt = new Date();
};

paymentSchema.methods.markFailed = function (errorCode, errorMessage) {
    this.status = 'Failed';
    this.failedAt = new Date();
    this.errorCode = errorCode;
    this.errorMessage = errorMessage;
};

paymentSchema.methods.markRefunded = function (refundAmount, reason, userId) {
    this.status = 'Refunded';
    this.isRefunded = true;
    this.refundedAt = new Date();
    this.refundAmount = refundAmount || this.amount;
    this.refundReason = reason;
    this.refundedBy = userId;
};

// Indexes
paymentSchema.index({ shipper: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ gateway: 1, status: 1 });
paymentSchema.index({ invoice: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
