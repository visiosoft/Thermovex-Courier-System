const mongoose = require('mongoose');

const chequeSchema = new mongoose.Schema({
    shipper: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipper',
        required: true
    },

    // Cheque Details
    chequeNumber: {
        type: String,
        required: [true, 'Cheque number is required'],
        trim: true
    },
    bankName: {
        type: String,
        required: [true, 'Bank name is required'],
        trim: true
    },
    branchName: {
        type: String,
        trim: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: 0
    },
    chequeDate: {
        type: Date,
        required: [true, 'Cheque date is required']
    },

    // Status Tracking
    status: {
        type: String,
        enum: ['Pending', 'Cleared', 'Bounced', 'Cancelled'],
        default: 'Pending'
    },
    receivedDate: {
        type: Date,
        default: Date.now
    },
    clearedDate: {
        type: Date
    },
    bouncedDate: {
        type: Date
    },
    bounceReason: {
        type: String
    },

    // Additional Information
    notes: {
        type: String
    },
    reference: {
        type: String,
        trim: true
    },

    // Tracking
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Index for faster searches
chequeSchema.index({ shipper: 1, status: 1, chequeDate: -1 });

module.exports = mongoose.model('Cheque', chequeSchema);
