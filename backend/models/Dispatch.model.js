const mongoose = require('mongoose');

const dispatchSchema = new mongoose.Schema({
    dispatchNumber: {
        type: String,
        unique: true,
        required: true
    },

    // Dispatch Details
    date: {
        type: Date,
        default: Date.now
    },
    type: {
        type: String,
        enum: ['Outbound', 'Inbound', 'Transfer'],
        default: 'Outbound'
    },

    // Destination
    destinationBranch: String,
    destinationCity: String,

    // Transport Details
    transportMode: {
        type: String,
        enum: ['Road', 'Air', 'Rail', 'Sea'],
        default: 'Road'
    },
    vehicleNumber: String,
    driverName: String,
    driverMobile: String,
    carrierName: String,

    // Associated Manifests
    manifests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Manifest'
    }],

    // Bookings
    bookings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    }],

    // Statistics
    totalBookings: {
        type: Number,
        default: 0
    },
    totalWeight: {
        type: Number,
        default: 0
    },
    totalBags: {
        type: Number,
        default: 0
    },

    // Status
    status: {
        type: String,
        enum: ['Pending', 'Dispatched', 'In Transit', 'Received', 'Cancelled'],
        default: 'Pending'
    },
    dispatchedAt: Date,
    receivedAt: Date,
    receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Seal Information
    sealNumber: String,

    // Notes
    remarks: String,

    // Created By
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    branch: String

}, {
    timestamps: true
});

// Auto-generate dispatch number
dispatchSchema.pre('save', async function (next) {
    if (this.isNew && !this.dispatchNumber) {
        const count = await mongoose.model('Dispatch').countDocuments();
        const prefix = 'DSP';
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const number = String(count + 1).padStart(4, '0');
        this.dispatchNumber = `${prefix}${date}${number}`;
    }
    next();
});

module.exports = mongoose.model('Dispatch', dispatchSchema);
