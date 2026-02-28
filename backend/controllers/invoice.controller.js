const Invoice = require('../models/Invoice.model');
const Booking = require('../models/Booking.model');
const Shipper = require('../models/Shipper.model');

// Get all invoices with filtering and pagination
const getAllInvoices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      invoiceType,
      shipperId,
      startDate,
      endDate,
      search
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (invoiceType) query.invoiceType = invoiceType;
    if (shipperId) query.shipper = shipperId;

    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) query.invoiceDate.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { referenceNumber: { $regex: search, $options: 'i' } },
        { 'customerDetails.companyName': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const invoices = await Invoice.find(query)
      .populate('shipper', 'companyName contactPerson mobile email')
      .populate('booking', 'awbNumber')
      .populate('createdBy', 'name')
      .sort({ invoiceDate: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Invoice.countDocuments(query);

    res.json({
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get invoice by ID
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('shipper')
      .populate('booking')
      .populate('createdBy', 'name email')
      .populate('paymentRecords.recordedBy', 'name');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get invoice by invoice number (public access for shippers)
const getInvoiceByNumber = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ invoiceNumber: req.params.invoiceNumber })
      .populate('shipper')
      .populate('booking');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create invoice
const createInvoice = async (req, res) => {
  try {
    const {
      invoiceType,
      bookingId,
      shipperId,
      shipper: shipperIdAlt, // Support both 'shipper' and 'shipperId'
      bookings, // Support bulk invoices
      periodFrom,
      periodTo,
      dueDate,
      items,
      discount,
      discountPercentage,
      discountType,
      gstRate,
      paymentTerms,
      termsAndConditions,
      notes,
      bankDetails,
      referenceNumber,
      poNumber
    } = req.body;

    // Support both field names
    const actualShipperId = shipperId || shipperIdAlt;

    // Get shipper details
    const shipper = await Shipper.findById(actualShipperId);
    if (!shipper) {
      return res.status(404).json({ message: 'Shipper not found' });
    }

    let invoiceItems = items;
    let bookingIds = bookingId ? [bookingId] : [];

    // Handle bulk invoice with multiple bookings
    if (bookings && bookings.length > 0) {
      bookingIds = bookings;

      // Fetch all bookings
      const fetchedBookings = await Booking.find({ _id: { $in: bookings } });

      if (fetchedBookings.length === 0) {
        return res.status(404).json({ message: 'No bookings found' });
      }

      // Create items from bookings
      invoiceItems = fetchedBookings.map(booking => ({
        description: `${booking.serviceType || 'Freight'} - AWB: ${booking.awbNumber}`,
        sacCode: '996791',
        quantity: 1,
        unit: 'service',
        rate: booking.totalAmount || 0,
        amount: booking.totalAmount || 0,
        taxable: true
      }));
    }

    // Validate items
    if (!invoiceItems || invoiceItems.length === 0) {
      return res.status(400).json({ message: 'No items or bookings provided' });
    }

    // Calculate amounts
    const subtotal = invoiceItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    let discountAmount = 0;

    // Support both discount and discountPercentage
    if (discountPercentage) {
      discountAmount = (subtotal * discountPercentage) / 100;
    } else if (discount) {
      discountAmount = discountType === 'percentage'
        ? (subtotal * discount) / 100
        : discount;
    }

    const taxableAmount = subtotal - discountAmount;

    // Determine if IGST or CGST+SGST based on shipper state
    const isInterState = shipper.address?.state !== 'Maharashtra'; // Change based on company state

    const actualGstRate = gstRate || 18;
    let cgst = 0, sgst = 0, igst = 0;

    if (isInterState) {
      igst = (taxableAmount * actualGstRate) / 100;
    } else {
      cgst = (taxableAmount * actualGstRate) / 200;
      sgst = (taxableAmount * actualGstRate) / 200;
    }

    const totalTax = cgst + sgst + igst;
    const totalAmount = taxableAmount + totalTax;
    const roundOff = Math.round(totalAmount) - totalAmount;
    const grandTotal = Math.round(totalAmount);

    // Create invoice
    const invoice = new Invoice({
      invoiceType: invoiceType || 'Freight',
      booking: bookingId,
      shipper: actualShipperId,
      invoiceDate: new Date(),
      periodFrom: periodFrom ? new Date(periodFrom) : undefined,
      periodTo: periodTo ? new Date(periodTo) : undefined,
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
      customerDetails: {
        companyName: shipper.companyName || shipper.company,
        contactPerson: shipper.contactPerson || shipper.name,
        email: shipper.email,
        mobile: shipper.mobile,
        address: shipper.address,
        gstNumber: shipper.gstNumber,
        panNumber: shipper.panNumber
      },
      items: invoiceItems,
      subtotal,
      discount: discountAmount,
      discountType: discountPercentage ? 'percentage' : (discountType || 'fixed'),
      taxableAmount,
      cgst,
      sgst,
      igst,
      gstRate: actualGstRate,
      totalTax,
      totalAmount,
      roundOff,
      grandTotal,
      paymentMode: shipper.paymentType || 'Credit',
      paymentTerms: termsAndConditions || paymentTerms || 'Payment due within 30 days',
      notes,
      bankDetails: bankDetails || {
        bankName: 'HDFC Bank',
        accountNumber: '50200012345678',
        ifscCode: 'HDFC0001234',
        accountHolderName: 'Thermovex Courier Services',
        branch: 'Mumbai Main Branch'
      },
      referenceNumber,
      poNumber,
      createdBy: req.user._id
    });

    await invoice.save();

    // Update bookings with invoice reference
    if (bookingIds.length > 0) {
      await Booking.updateMany(
        { _id: { $in: bookingIds } },
        {
          invoice: invoice._id,
          invoiceGenerated: true
        }
      );
    }

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Auto-generate invoice from booking
const generateInvoiceFromBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId).populate('shipper');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if invoice already exists
    const existingInvoice = await Invoice.findOne({ booking: bookingId });
    if (existingInvoice) {
      return res.status(400).json({ message: 'Invoice already exists for this booking' });
    }

    const shipper = booking.shipper;

    // Create invoice items from booking charges
    const items = [];

    items.push({
      description: `${booking.serviceType} Freight Charges (${booking.shipmentType}) - AWB: ${booking.awbNumber}`,
      sacCode: '996791', // SAC code for courier services
      quantity: 1,
      unit: 'service',
      rate: booking.charges.shippingCharges,
      amount: booking.charges.shippingCharges,
      taxable: true
    });

    if (booking.charges.insuranceCharges > 0) {
      items.push({
        description: 'Insurance Charges',
        sacCode: '996791',
        quantity: 1,
        unit: 'service',
        rate: booking.charges.insuranceCharges,
        amount: booking.charges.insuranceCharges,
        taxable: true
      });
    }

    if (booking.charges.codCharges > 0) {
      items.push({
        description: 'COD Handling Charges',
        sacCode: '996791',
        quantity: 1,
        unit: 'service',
        rate: booking.charges.codCharges,
        amount: booking.charges.codCharges,
        taxable: true
      });
    }

    if (booking.charges.fuelSurcharge > 0) {
      items.push({
        description: 'Fuel Surcharge',
        sacCode: '996791',
        quantity: 1,
        unit: 'service',
        rate: booking.charges.fuelSurcharge,
        amount: booking.charges.fuelSurcharge,
        taxable: true
      });
    }

    // Calculate totals (GST already included in booking)
    const subtotal = booking.charges.subtotal;
    const taxableAmount = subtotal;

    const isInterState = shipper.address?.state !== 'Maharashtra';
    let cgst = 0, sgst = 0, igst = 0;

    if (isInterState) {
      igst = booking.charges.gst;
    } else {
      cgst = booking.charges.gst / 2;
      sgst = booking.charges.gst / 2;
    }

    const totalTax = booking.charges.gst;
    const grandTotal = booking.charges.totalAmount;

    // Create invoice
    const invoice = new Invoice({
      invoiceType: 'Freight',
      booking: bookingId,
      shipper: shipper._id,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      customerDetails: {
        companyName: shipper.companyName,
        contactPerson: shipper.contactPerson,
        email: shipper.email,
        mobile: shipper.mobile,
        address: shipper.address,
        gstNumber: shipper.gstNumber,
        panNumber: shipper.panNumber
      },
      items,
      subtotal,
      taxableAmount,
      cgst,
      sgst,
      igst,
      gstRate: 18,
      totalTax,
      totalAmount: grandTotal,
      grandTotal,
      paymentMode: booking.paymentMode,
      paymentStatus: booking.paymentMode === 'Prepaid' ? 'Paid' : 'Unpaid',
      paidAmount: booking.paymentMode === 'Prepaid' ? grandTotal : 0,
      referenceNumber: booking.referenceNumber,
      createdBy: req.user._id
    });

    await invoice.save();

    // Update booking with invoice reference
    booking.invoice = invoice._id;
    await booking.save();

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update invoice
const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.status === 'Paid' || invoice.status === 'Cancelled') {
      return res.status(400).json({ message: 'Cannot update paid or cancelled invoice' });
    }

    Object.assign(invoice, req.body);
    invoice.updatedBy = req.user._id;

    await invoice.save();

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Record payment
const recordPayment = async (req, res) => {
  try {
    const { amount, paymentMode, paymentDate, reference, remarks } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.paymentStatus === 'Paid') {
      return res.status(400).json({ message: 'Invoice is already fully paid' });
    }

    const paymentAmount = parseFloat(amount);
    if (paymentAmount <= 0 || paymentAmount > invoice.balanceAmount) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    // Add payment record
    invoice.paymentRecords.push({
      amount: paymentAmount,
      paymentMode,
      paymentDate: paymentDate || new Date(),
      reference,
      remarks,
      recordedBy: req.user._id
    });

    invoice.paidAmount += paymentAmount;
    invoice.updatedBy = req.user._id;

    await invoice.save();

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel invoice
const cancelInvoice = async (req, res) => {
  try {
    const { reason } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.paidAmount > 0) {
      return res.status(400).json({ message: 'Cannot cancel invoice with payments. Issue credit note instead.' });
    }

    invoice.status = 'Cancelled';
    invoice.paymentStatus = 'Cancelled';
    invoice.cancelledBy = req.user._id;
    invoice.cancelledAt = new Date();
    invoice.cancellationReason = reason;

    await invoice.save();

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark invoice as sent
const markAsSent = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    invoice.status = 'Sent';
    await invoice.save();

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get invoice statistics
const getInvoiceStats = async (req, res) => {
  try {
    const { startDate, endDate, shipperId } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) query.invoiceDate.$lte = new Date(endDate);
    }
    if (shipperId) query.shipper = shipperId;

    const stats = await Invoice.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$grandTotal' },
          totalPaid: { $sum: '$paidAmount' },
          totalOutstanding: { $sum: '$balanceAmount' },
          paidInvoices: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, 1, 0] }
          },
          unpaidInvoices: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'Unpaid'] }, 1, 0] }
          },
          overdueInvoices: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'Overdue'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json(stats[0] || {
      totalInvoices: 0,
      totalAmount: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      paidInvoices: 0,
      unpaidInvoices: 0,
      overdueInvoices: 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete invoice
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.paidAmount > 0) {
      return res.status(400).json({ message: 'Cannot delete invoice with payments' });
    }

    await invoice.deleteOne();
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  getInvoiceByNumber,
  createInvoice,
  generateInvoiceFromBooking,
  updateInvoice,
  recordPayment,
  cancelInvoice,
  markAsSent,
  getInvoiceStats,
  deleteInvoice
};
