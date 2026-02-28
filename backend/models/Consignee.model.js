const mongoose = require('mongoose');

const consigneeSchema = new mongoose.Schema({
    shipper: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipper',
        required: true
    },

    // Contact Information
    name: {
        type: String,
        required: [true, 'Consignee name is required'],
        trim: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true
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
        street: {
            type: String,
            required: [true, 'Street address is required']
        },
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

    // Business Information
    company: {
        type: String,
        trim: true
    },
    taxId: {
        type: String,
        trim: true
    },

    // Additional Information
    notes: {
        type: String
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },

    // Usage Metrics
    totalOrders: {
        type: Number,
        default: 0
    },
    lastOrderDate: {
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
consigneeSchema.index({ shipper: 1, name: 'text' });

module.exports = mongoose.model('Consignee', consigneeSchema);
