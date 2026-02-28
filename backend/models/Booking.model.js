const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    // AWB (Airway Bill Number) - Auto-generated
    awbNumber: {
        type: String,
        unique: true,
        sparse: true  // Allow null during creation
    },

    // Shipper Information
    shipper: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipper',
        required: true
    },

    // Consignee Information
    consignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Consignee'
    },
    // Manual consignee details (if not using saved consignee)
    consigneeDetails: {
        name: String,
        mobile: String,
        email: String,
        company: String,
        address: {
            street: String,
            city: String,
            state: String,
            postalCode: String,
            country: String
        }
    },

    // Shipment Details
    serviceType: {
        type: String,
        enum: ['Express', 'Standard', 'Economy', 'Same Day', 'Overnight', 'International'],
        default: 'Standard'
    },
    shipmentType: {
        type: String,
        enum: ['Document', 'Parcel', 'Cargo'],
        default: 'Parcel'
    },
    destinationType: {
        type: String,
        enum: ['Local', 'Domestic', 'International'],
        default: 'Local'
    },

    // Package Information
    numberOfPieces: {
        type: Number,
        default: 1,
        min: 1
    },
    weight: {
        type: Number,
        required: true,
        min: 0
    },
    weightUnit: {
        type: String,
        enum: ['kg', 'lb'],
        default: 'kg'
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: {
            type: String,
            enum: ['cm', 'in'],
            default: 'cm'
        }
    },
    volumetricWeight: Number,

    // Package Contents
    description: {
        type: String,
        required: true
    },
    declaredValue: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: 'USD'
    },

    // Pricing
    shippingCharges: {
        type: Number,
        default: 0
    },
    insuranceCharges: {
        type: Number,
        default: 0
    },
    codCharges: {
        type: Number,
        default: 0
    },
    fuelSurcharge: {
        type: Number,
        default: 0
    },
    gstAmount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        default: 0
    },

    // Payment Information
    paymentMode: {
        type: String,
        enum: ['COD', 'Prepaid', 'Credit'],
        default: 'COD'
    },
    codAmount: {
        type: Number,
        default: 0
    },

    // Status Tracking
    status: {
        type: String,
        enum: [
            'Booked',
            'Picked Up',
            'In Transit',
            'Out for Delivery',
            'Delivered',
            'Returned',
            'Cancelled',
            'On Hold',
            'Failed Delivery'
        ],
        default: 'Booked'
    },

    // Status History
    statusHistory: [{
        status: String,
        location: String,
        remarks: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],

    // Delivery Information
    deliveryDate: Date,
    deliveredTo: String,
    deliverySignature: String,
    deliveryProof: String,
    deliveryRemarks: String,

    // Return Information
    returnReason: String,
    returnDate: Date,

    // Special Instructions
    specialInstructions: String,
    referenceNumber: String,

    // Invoice
    invoiceType: {
        type: String,
        enum: ['Commercial', 'Gift', 'Performa', 'Sample'],
        default: 'Commercial'
    },
    invoiceNumber: String,

    // Manifest & Dispatch
    manifestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Manifest'
    },
    dispatchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dispatch'
    },

    // Pickup Details
    pickupDate: Date,
    pickupAddress: {
        street: String,
        city: String,
        state: String,
        postalCode: String
    },

    // Delivery Attempt
    deliveryAttempts: {
        type: Number,
        default: 0
    },
    lastAttemptDate: Date,

    // System Fields
    bookingDate: {
        type: Date,
        default: Date.now
    },
    bookedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    branch: String,
    zone: String,

    // Flags
    isUrgent: {
        type: Boolean,
        default: false
    },
    isFragile: {
        type: Boolean,
        default: false
    },
    requiresInsurance: {
        type: Boolean,
        default: false
    },

    // Notes
    internalNotes: String,

}, {
    timestamps: true
});

// Auto-generate AWB number before saving
bookingSchema.pre('save', async function (next) {
    if (this.isNew && !this.awbNumber) {
        const count = await mongoose.model('Booking').countDocuments();
        const prefix = 'AWB';
        const year = new Date().getFullYear().toString().slice(-2);
        const number = String(count + 1).padStart(7, '0');
        this.awbNumber = `${prefix}${year}${number}`;
    }

    // Calculate volumetric weight
    if (this.dimensions && this.dimensions.length && this.dimensions.width && this.dimensions.height) {
        const divider = this.dimensions.unit === 'cm' ? 5000 : 139;
        this.volumetricWeight = (this.dimensions.length * this.dimensions.width * this.dimensions.height) / divider;
    }

    // Calculate total amount
    this.totalAmount = (this.shippingCharges || 0) +
        (this.insuranceCharges || 0) +
        (this.codCharges || 0) +
        (this.fuelSurcharge || 0) +
        (this.gstAmount || 0);

    next();
});

// Add status to history when status changes
bookingSchema.methods.addStatusUpdate = function (status, location, remarks, userId) {
    this.status = status;
    this.statusHistory.push({
        status,
        location,
        remarks,
        timestamp: new Date(),
        updatedBy: userId
    });

    if (status === 'Delivered') {
        this.deliveryDate = new Date();
    } else if (status === 'Returned') {
        this.returnDate = new Date();
    }

    return this.save();
};

// Index for faster searches
bookingSchema.index({ awbNumber: 1 });
bookingSchema.index({ shipper: 1, bookingDate: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingDate: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
