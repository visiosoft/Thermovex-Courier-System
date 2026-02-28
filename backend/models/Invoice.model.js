const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  hsnCode: {
    type: String,
    default: ''
  },
  sacCode: {
    type: String,
    default: ''
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  unit: {
    type: String,
    enum: ['piece', 'kg', 'box', 'service'],
    default: 'service'
  },
  rate: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  taxable: {
    type: Boolean,
    default: true
  }
});

const paymentRecordSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'Cheque', 'Bank Transfer', 'UPI', 'Card', 'Online', 'Adjustment'],
    required: true
  },
  paymentDate: {
    type: Date,
    required: true
  },
  reference: {
    type: String,
    default: ''
  },
  remarks: {
    type: String,
    default: ''
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recordedAt: {
    type: Date,
    default: Date.now
  }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true
  },
  invoiceType: {
    type: String,
    enum: ['Freight', 'Proforma', 'Credit Note', 'Debit Note', 'GST Invoice'],
    default: 'Freight'
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

  // Invoice Dates
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  periodFrom: {
    type: Date
  },
  periodTo: {
    type: Date
  },

  // Customer Details (copied from shipper at time of invoice)
  customerDetails: {
    companyName: String,
    contactPerson: String,
    email: String,
    mobile: String,
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: String
    },
    gstNumber: String,
    panNumber: String
  },

  // Items
  items: [invoiceItemSchema],

  // Financial Calculations
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'fixed'
  },
  taxableAmount: {
    type: Number,
    required: true,
    default: 0
  },

  // GST Breakdown
  cgst: {
    type: Number,
    default: 0
  },
  sgst: {
    type: Number,
    default: 0
  },
  igst: {
    type: Number,
    default: 0
  },
  gstRate: {
    type: Number,
    default: 18
  },

  // Totals
  totalTax: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  roundOff: {
    type: Number,
    default: 0
  },
  grandTotal: {
    type: Number,
    required: true
  },

  // Payment Information
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'],
    default: 'Unpaid'
  },
  paymentMode: {
    type: String,
    enum: ['COD', 'Prepaid', 'Credit', 'Multiple'],
    default: 'Credit'
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  balanceAmount: {
    type: Number,
    default: 0
  },
  paymentRecords: [paymentRecordSchema],

  // Terms and Conditions
  paymentTerms: {
    type: String,
    default: 'Payment due within 30 days'
  },
  termsAndConditions: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },

  // Bank Details
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    branch: String
  },

  // Company Information
  companyInfo: {
    name: {
      type: String,
      default: 'Thermovex Courier Services'
    },
    address: {
      type: String,
      default: '123 Main Street, Business District, Mumbai - 400001'
    },
    gstNumber: {
      type: String,
      default: '27AABCT1234A1Z5'
    },
    panNumber: {
      type: String,
      default: 'AABCT1234A'
    },
    email: {
      type: String,
      default: 'accounts@thermovex.com'
    },
    mobile: {
      type: String,
      default: '1-800-THERMOVEX'
    },
    website: {
      type: String,
      default: 'www.thermovex.com'
    }
  },

  // Status
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Viewed', 'Paid', 'Cancelled'],
    default: 'Draft'
  },

  // References
  referenceNumber: {
    type: String,
    default: ''
  },
  poNumber: {
    type: String,
    default: ''
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Auto-generate invoice number
invoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const lastInvoice = await this.constructor.findOne().sort({ createdAt: -1 }).exec();

    let nextNumber = 1;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.replace('INV', ''));
      nextNumber = lastNumber + 1;
    }

    this.invoiceNumber = `INV${String(nextNumber).padStart(6, '0')}`;
  }

  // Calculate balance amount
  this.balanceAmount = this.grandTotal - this.paidAmount;

  // Update payment status based on payment
  if (this.paidAmount === 0) {
    this.paymentStatus = 'Unpaid';
  } else if (this.paidAmount >= this.grandTotal) {
    this.paymentStatus = 'Paid';
  } else {
    this.paymentStatus = 'Partially Paid';
  }

  // Check if overdue
  if (this.paymentStatus !== 'Paid' && this.dueDate < new Date()) {
    this.paymentStatus = 'Overdue';
  }

  next();
});

// Indexes
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ shipper: 1 });
invoiceSchema.index({ booking: 1 });
invoiceSchema.index({ invoiceDate: -1 });
invoiceSchema.index({ paymentStatus: 1 });
invoiceSchema.index({ status: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
