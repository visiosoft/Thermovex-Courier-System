const mongoose = require('mongoose');

const exceptionSchema = new mongoose.Schema({
  // Exception Details
  exceptionNumber: {
    type: String,
    unique: true,
    sparse: true
  },

  // Related Booking
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  awbNumber: {
    type: String,
    required: true
  },

  // Exception Information
  type: {
    type: String,
    enum: [
      'Damaged Package',
      'Missing Items',
      'Wrong Address',
      'Delivery Delay',
      'Package Lost',
      'Delivery Refused',
      'Wrong Item Delivered',
      'Customer Not Available',
      'Weather Delay',
      'Vehicle Breakdown',
      'Other'
    ],
    required: true
  },

  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },

  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed', 'Escalated'],
    default: 'Open'
  },

  // Description
  description: {
    type: String,
    required: true
  },

  // Reporter Information
  reportedBy: {
    name: String,
    email: String,
    mobile: String,
    relationship: {
      type: String,
      enum: ['Shipper', 'Consignee', 'System', 'Agent', 'Customer Support']
    }
  },

  // Location when exception occurred
  location: String,

  // Resolution
  resolution: String,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,

  // Assigned To
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: Date,

  // Internal Notes
  internalNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  // Attachments
  attachments: [{
    filename: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Timestamps
  reportedAt: {
    type: Date,
    default: Date.now
  },

  // Follow-up
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date

}, {
  timestamps: true
});

// Auto-generate exception number
exceptionSchema.pre('save', async function (next) {
  if (this.isNew && !this.exceptionNumber) {
    const count = await mongoose.model('Exception').countDocuments();
    const prefix = 'EXC';
    const number = String(count + 1).padStart(6, '0');
    this.exceptionNumber = `${prefix}${number}`;
  }
  next();
});

// Index for faster searches
exceptionSchema.index({ exceptionNumber: 1 });
exceptionSchema.index({ booking: 1 });
exceptionSchema.index({ awbNumber: 1 });
exceptionSchema.index({ status: 1 });

module.exports = mongoose.model('Exception', exceptionSchema);
