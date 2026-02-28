const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
    // Ticket Information
    ticketNumber: {
        type: String,
        unique: true,
        required: true
    },

    // Related Entities
    shipper: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipper'
    },
    awbNumber: {
        type: String,
        trim: true
    },

    // Ticket Details
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    category: {
        type: String,
        enum: ['Delivery Issue', 'Payment Issue', 'Tracking Issue', 'Damage/Loss', 'General Inquiry', 'Other'],
        default: 'General Inquiry'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },

    // Status Management
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Resolved', 'Closed', 'Escalated'],
        default: 'Open'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    department: {
        type: String,
        enum: ['Operations', 'Finance', 'Customer Service', 'Technical', 'Management'],
        default: 'Customer Service'
    },

    // Resolution
    resolution: {
        type: String
    },
    resolutionDeadline: {
        type: Date
    },
    resolvedAt: {
        type: Date
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Communication Thread
    responses: [{
        message: String,
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        respondedAt: {
            type: Date,
            default: Date.now
        },
        isInternal: {
            type: Boolean,
            default: false
        }
    }],

    // Escalation
    escalatedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    escalatedAt: {
        type: Date
    },
    escalationReason: {
        type: String
    },

    // Additional
    attachments: [{
        filename: String,
        url: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Auto-generate ticket number
supportTicketSchema.pre('save', async function (next) {
    if (this.isNew && !this.ticketNumber) {
        const count = await mongoose.model('SupportTicket').countDocuments();
        this.ticketNumber = `TKT-${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

// Index for faster searches
supportTicketSchema.index({ ticketNumber: 1, status: 1, shipper: 1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
