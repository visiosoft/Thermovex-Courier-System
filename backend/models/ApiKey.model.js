const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    key: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    secret: {
        type: String,
        required: true
    },
    shipper: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipper',
        required: true
    },
    permissions: [{
        type: String,
        enum: ['booking.create', 'booking.read', 'booking.update', 'tracking.read', 'invoice.read', 'rate.calculate']
    }],
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Revoked'],
        default: 'Active'
    },
    environment: {
        type: String,
        enum: ['sandbox', 'production'],
        default: 'sandbox'
    },
    rateLimit: {
        requestsPerMinute: {
            type: Number,
            default: 60
        },
        requestsPerDay: {
            type: Number,
            default: 10000
        }
    },
    usage: {
        totalRequests: {
            type: Number,
            default: 0
        },
        lastUsed: Date,
        requestsToday: {
            type: Number,
            default: 0
        },
        lastResetDate: Date
    },
    ipWhitelist: [{
        type: String
    }],
    webhookUrl: {
        type: String,
        trim: true
    },
    expiresAt: Date,
    notes: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Generate API key and secret
apiKeySchema.statics.generateCredentials = function () {
    const key = 'ak_' + crypto.randomBytes(16).toString('hex');
    const secret = 'sk_' + crypto.randomBytes(32).toString('hex');
    return { key, secret };
};

// Hash secret before saving
apiKeySchema.pre('save', function (next) {
    if (this.isModified('secret')) {
        this.secret = crypto.createHash('sha256').update(this.secret).digest('hex');
    }
    next();
});

// Verify secret
apiKeySchema.methods.verifySecret = function (secret) {
    const hashedSecret = crypto.createHash('sha256').update(secret).digest('hex');
    return this.secret === hashedSecret;
};

// Check if API key is valid
apiKeySchema.methods.isValid = function () {
    if (this.status !== 'Active') return false;
    if (this.expiresAt && this.expiresAt < new Date()) return false;
    return true;
};

// Check permission
apiKeySchema.methods.hasPermission = function (permission) {
    return this.permissions.includes(permission);
};

// Increment usage
apiKeySchema.methods.incrementUsage = async function () {
    const today = new Date().setHours(0, 0, 0, 0);
    const lastReset = this.usage.lastResetDate ? this.usage.lastResetDate.setHours(0, 0, 0, 0) : 0;

    if (today > lastReset) {
        this.usage.requestsToday = 1;
        this.usage.lastResetDate = new Date();
    } else {
        this.usage.requestsToday += 1;
    }

    this.usage.totalRequests += 1;
    this.usage.lastUsed = new Date();
    await this.save();
};

// Check rate limit
apiKeySchema.methods.checkRateLimit = function () {
    if (this.usage.requestsToday >= this.rateLimit.requestsPerDay) {
        return { allowed: false, reason: 'Daily rate limit exceeded' };
    }
    return { allowed: true };
};

module.exports = mongoose.model('ApiKey', apiKeySchema);
