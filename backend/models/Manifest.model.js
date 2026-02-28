const mongoose = require('mongoose');

const manifestSchema = new mongoose.Schema({
    manifestNumber: {
        type: String,
        unique: true,
        required: true
    },

    // Manifest Details
    date: {
        type: Date,
        default: Date.now
    },
    type: {
        type: String,
        enum: ['Pickup', 'Delivery', 'Transfer'],
        default: 'Delivery'
    },

    // Route Information
    originCity: String,
    destinationCity: String,
    route: String,

    // Driver/Vehicle Information
    driverName: String,
    driverMobile: String,
    vehicleNumber: String,

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
    totalPieces: {
        type: Number,
        default: 0
    },
    totalCODAmount: {
        type: Number,
        default: 0
    },

    // Status
    status: {
        type: String,
        enum: ['Draft', 'Dispatched', 'In Transit', 'Completed', 'Cancelled'],
        default: 'Draft'
    },
    dispatchedAt: Date,
    completedAt: Date,

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

// Auto-generate manifest number
manifestSchema.pre('save', async function (next) {
    if (this.isNew && !this.manifestNumber) {
        const count = await mongoose.model('Manifest').countDocuments();
        const prefix = 'MAN';
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const number = String(count + 1).padStart(4, '0');
        this.manifestNumber = `${prefix}${date}${number}`;
    }
    next();
});

module.exports = mongoose.model('Manifest', manifestSchema);
