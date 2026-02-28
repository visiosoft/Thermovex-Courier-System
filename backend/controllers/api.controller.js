const Booking = require('../models/Booking.model');
const Invoice = require('../models/Invoice.model');
const Consignee = require('../models/Consignee.model');

// @desc    Create booking via API
// @route   POST /api/v1/bookings
// @access  API Key
exports.createBooking = async (req, res) => {
    try {
        const {
            consignee,
            serviceType,
            shipmentType,
            weight,
            dimensions,
            paymentMode,
            codAmount,
            packageValue,
            referenceNumber,
            specialInstructions
        } = req.body;

        // Validate required fields
        if (!consignee || !serviceType || !weight) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                required: ['consignee', 'serviceType', 'weight']
            });
        }

        // Create or find consignee
        let consigneeDoc = await Consignee.findOne({
            shipper: req.apiShipper._id,
            phone: consignee.phone
        });

        if (!consigneeDoc) {
            consigneeDoc = await Consignee.create({
                shipper: req.apiShipper._id,
                name: consignee.name,
                phone: consignee.phone,
                email: consignee.email,
                address: consignee.address,
                city: consignee.city,
                state: consignee.state,
                pincode: consignee.pincode
            });
        }

        // Calculate rates (simplified)
        const baseRates = {
            'Express': 100,
            'Standard': 70,
            'Economy': 50,
            'Same Day': 150,
            'Overnight': 120,
            'International': 200
        };

        const baseRate = baseRates[serviceType] || 70;
        const shippingCharges = baseRate + (weight * 10);
        const insuranceCharges = packageValue ? packageValue * 0.02 : 0;
        const codCharges = (paymentMode === 'COD' && codAmount) ? codAmount * 0.02 : 0;
        const fuelSurcharge = shippingCharges * 0.1;
        const subtotal = shippingCharges + insuranceCharges + codCharges + fuelSurcharge;
        const gst = subtotal * 0.18;
        const totalAmount = subtotal + gst;

        // Create booking
        const booking = await Booking.create({
            shipper: req.apiShipper._id,
            consignee: consigneeDoc._id,
            serviceType,
            shipmentType: shipmentType || 'Parcel',
            weight,
            dimensions,
            paymentMode: paymentMode || 'Prepaid',
            codAmount: paymentMode === 'COD' ? codAmount : 0,
            packageValue: packageValue || 0,
            shippingCharges,
            insuranceCharges,
            codCharges,
            fuelSurcharge,
            subtotal,
            gst,
            totalAmount,
            referenceNumber,
            specialInstructions,
            status: 'Booked',
            expectedDeliveryDate: calculateExpectedDelivery(serviceType)
        });

        await booking.populate('consignee');

        res.status(201).json({
            success: true,
            data: {
                awbNumber: booking.awbNumber,
                bookingId: booking._id,
                status: booking.status,
                expectedDelivery: booking.expectedDeliveryDate,
                totalAmount: booking.totalAmount,
                consignee: {
                    name: booking.consignee.name,
                    phone: booking.consignee.phone,
                    address: booking.consignee.address
                },
                charges: {
                    shipping: shippingCharges,
                    insurance: insuranceCharges,
                    cod: codCharges,
                    fuelSurcharge,
                    gst,
                    total: totalAmount
                }
            }
        });
    } catch (error) {
        console.error('API booking creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create booking',
            message: error.message
        });
    }
};

// @desc    Get booking status
// @route   GET /api/v1/bookings/:awbNumber
// @access  API Key
exports.getBooking = async (req, res) => {
    try {
        const { awbNumber } = req.params;

        const booking = await Booking.findOne({
            awbNumber,
            shipper: req.apiShipper._id
        }).populate('consignee');

        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }

        res.json({
            success: true,
            data: {
                awbNumber: booking.awbNumber,
                status: booking.status,
                serviceType: booking.serviceType,
                weight: booking.weight,
                consignee: {
                    name: booking.consignee.name,
                    phone: booking.consignee.phone,
                    city: booking.consignee.city,
                    state: booking.consignee.state
                },
                dates: {
                    booked: booking.createdAt,
                    expected: booking.expectedDeliveryDate,
                    delivered: booking.deliveryDate
                },
                tracking: booking.statusHistory || []
            }
        });
    } catch (error) {
        console.error('API booking fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch booking',
            message: error.message
        });
    }
};

// @desc    Track shipment
// @route   GET /api/v1/track/:awbNumber
// @access  API Key
exports.trackShipment = async (req, res) => {
    try {
        const { awbNumber } = req.params;

        const booking = await Booking.findOne({ awbNumber });

        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Shipment not found'
            });
        }

        res.json({
            success: true,
            data: {
                awbNumber: booking.awbNumber,
                currentStatus: booking.status,
                currentLocation: booking.currentLocation || 'In Transit',
                expectedDelivery: booking.expectedDeliveryDate,
                timeline: booking.statusHistory || [],
                pod: booking.podFile ? {
                    available: true,
                    url: `/uploads/${booking.podFile}`
                } : { available: false }
            }
        });
    } catch (error) {
        console.error('API tracking error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to track shipment',
            message: error.message
        });
    }
};

// @desc    Calculate shipping rate
// @route   POST /api/v1/rates/calculate
// @access  API Key
exports.calculateRate = async (req, res) => {
    try {
        const { serviceType, weight, origin, destination, packageValue, codAmount } = req.body;

        if (!serviceType || !weight) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                required: ['serviceType', 'weight']
            });
        }

        const baseRates = {
            'Express': 100,
            'Standard': 70,
            'Economy': 50,
            'Same Day': 150,
            'Overnight': 120,
            'International': 200
        };

        const baseRate = baseRates[serviceType] || 70;
        const shippingCharges = baseRate + (weight * 10);
        const insuranceCharges = packageValue ? packageValue * 0.02 : 0;
        const codCharges = codAmount ? codAmount * 0.02 : 0;
        const fuelSurcharge = shippingCharges * 0.1;
        const subtotal = shippingCharges + insuranceCharges + codCharges + fuelSurcharge;
        const gst = subtotal * 0.18;
        const totalAmount = subtotal + gst;

        res.json({
            success: true,
            data: {
                serviceType,
                weight,
                charges: {
                    shipping: parseFloat(shippingCharges.toFixed(2)),
                    insurance: parseFloat(insuranceCharges.toFixed(2)),
                    cod: parseFloat(codCharges.toFixed(2)),
                    fuelSurcharge: parseFloat(fuelSurcharge.toFixed(2)),
                    gst: parseFloat(gst.toFixed(2)),
                    subtotal: parseFloat(subtotal.toFixed(2)),
                    total: parseFloat(totalAmount.toFixed(2))
                },
                estimatedDelivery: calculateExpectedDelivery(serviceType)
            }
        });
    } catch (error) {
        console.error('API rate calculation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate rate',
            message: error.message
        });
    }
};

// @desc    Get invoices
// @route   GET /api/v1/invoices
// @access  API Key
exports.getInvoices = async (req, res) => {
    try {
        const { status, startDate, endDate, limit = 50, page = 1 } = req.query;

        const query = { shipper: req.apiShipper._id };

        if (status) query.status = status;
        if (startDate || endDate) {
            query.invoiceDate = {};
            if (startDate) query.invoiceDate.$gte = new Date(startDate);
            if (endDate) query.invoiceDate.$lte = new Date(endDate);
        }

        const invoices = await Invoice.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .select('-lineItems');

        const total = await Invoice.countDocuments(query);

        res.json({
            success: true,
            data: invoices.map(inv => ({
                invoiceNumber: inv.invoiceNumber,
                invoiceDate: inv.invoiceDate,
                dueDate: inv.dueDate,
                totalAmount: inv.totalAmount,
                paidAmount: inv.paidAmount,
                balanceAmount: inv.totalAmount - inv.paidAmount,
                status: inv.status,
                paymentStatus: inv.paymentStatus
            })),
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('API invoice fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch invoices',
            message: error.message
        });
    }
};

// Helper function
function calculateExpectedDelivery(serviceType) {
    const now = new Date();
    const deliveryDays = {
        'Express': 1,
        'Standard': 3,
        'Economy': 5,
        'Same Day': 0,
        'Overnight': 1,
        'International': 7
    };

    const days = deliveryDays[serviceType] || 3;
    const deliveryDate = new Date(now);
    deliveryDate.setDate(deliveryDate.getDate() + days);

    return deliveryDate;
}
