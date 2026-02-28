const mongoose = require('mongoose');

const shipperSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: [true, 'Shipper name is required'],
        trim: true
    },
    company: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    mobile: {
        type: String,
        required: [true, 'Mobile number is required'],
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },

    // Address Information
    address: {
        street: String,
        city: {
            type: String,
            required: [true, 'City is required']
        },
        state: String,
        postalCode: String,
        country: {
            type: String,
            default: 'Pakistan'
        }
    },

    // Return Address (for failed deliveries)
    returnAddress: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String
    },

    // Business Information
    taxId: {
        type: String,
        trim: true
    },
    ntn: {
        type: String,
        trim: true
    },
    strn: {
        type: String,
        trim: true
    },

    // Account Configuration
    paymentType: {
        type: String,
        enum: ['COD', 'Prepaid', 'Credit'],
        default: 'COD'
    },
    creditLimit: {
        type: Number,
        default: 0
    },
    currentBalance: {
        type: Number,
        default: 0
    },

    // Account Status
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Suspended', 'Blocked'],
        default: 'Active'
    },
    isVerified: {
        type: Boolean,
        default: false
    },

    // Business Metrics
    totalBookings: {
        type: Number,
        default: 0
    },
    totalRevenue: {
        type: Number,
        default: 0
    },
    pendingCOD: {
        type: Number,
        default: 0
    },

    // Additional Information
    notes: {
        type: String
    },
    accountManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Timestamps
    lastBookingDate: {
        type: Date
    },
    verifiedAt: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Index for faster searches
shipperSchema.index({ company: 'text', name: 'text', email: 'text' });

module.exports = mongoose.model('Shipper', shipperSchema);
