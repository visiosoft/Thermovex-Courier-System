const Booking = require('../models/Booking.model');
const Invoice = require('../models/Invoice.model');
const Payment = require('../models/Payment.model');
const Shipper = require('../models/Shipper.model');
const Exception = require('../models/Exception.model');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// @desc    Generate revenue report
// @route   POST /api/reports/revenue
// @access  Private
exports.generateRevenueReport = async (req, res) => {
    try {
        const { startDate, endDate, shipperId, groupBy = 'day' } = req.body;

        const matchQuery = {
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            },
            status: { $ne: 'Cancelled' }
        };

        if (shipperId) {
            matchQuery.shipper = shipperId;
        }

        // Revenue by period
        let groupByFormat;
        switch (groupBy) {
            case 'month':
                groupByFormat = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                };
                break;
            case 'week':
                groupByFormat = {
                    year: { $year: '$createdAt' },
                    week: { $week: '$createdAt' }
                };
                break;
            default: // day
                groupByFormat = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                };
        }

        const revenueByPeriod = await Invoice.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: groupByFormat,
                    totalRevenue: { $sum: '$totalAmount' },
                    paidAmount: { $sum: '$paidAmount' },
                    outstandingAmount: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } },
                    invoiceCount: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        // Revenue by service type
        const revenueByService = await Booking.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
                    status: 'Delivered'
                }
            },
            {
                $group: {
                    _id: '$serviceType',
                    revenue: { $sum: '$totalAmount' },
                    count: { $sum: 1 },
                    avgRevenue: { $avg: '$totalAmount' }
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        // Revenue by shipper
        const revenueByShipper = await Invoice.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$shipper',
                    totalRevenue: { $sum: '$totalAmount' },
                    paidAmount: { $sum: '$paidAmount' },
                    invoiceCount: { $sum: 1 }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 20 },
            {
                $lookup: {
                    from: 'shippers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'shipperInfo'
                }
            },
            { $unwind: '$shipperInfo' }
        ]);

        // Payment method breakdown
        const paymentByMethod = await Payment.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
                    status: 'Completed'
                }
            },
            {
                $group: {
                    _id: '$gateway',
                    totalAmount: { $sum: '$amount' },
                    transactionCount: { $sum: 1 },
                    avgAmount: { $avg: '$amount' }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        // Summary totals
        const summary = await Invoice.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalAmount' },
                    totalPaid: { $sum: '$paidAmount' },
                    totalOutstanding: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } },
                    invoiceCount: { $sum: 1 }
                }
            }
        ]);

        res.json({
            summary: summary[0] || { totalRevenue: 0, totalPaid: 0, totalOutstanding: 0, invoiceCount: 0 },
            revenueByPeriod,
            revenueByService,
            revenueByShipper,
            paymentByMethod,
            filters: { startDate, endDate, shipperId, groupBy }
        });
    } catch (error) {
        console.error('Error generating revenue report:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Generate booking report
// @route   POST /api/reports/bookings
// @access  Private
exports.generateBookingReport = async (req, res) => {
    try {
        const { startDate, endDate, status, serviceType, shipperId } = req.body;

        const matchQuery = {
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };

        if (status) matchQuery.status = status;
        if (serviceType) matchQuery.serviceType = serviceType;
        if (shipperId) matchQuery.shipper = shipperId;

        // Get detailed bookings
        const bookings = await Booking.find(matchQuery)
            .populate('shipper', 'companyName contactPerson email phone')
            .populate('consignee', 'name phone address')
            .sort({ createdAt: -1 })
            .limit(1000);

        // Status breakdown
        const statusBreakdown = await Booking.aggregate([
            { $match: { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' }
                }
            }
        ]);

        // Service type breakdown
        const serviceBreakdown = await Booking.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$serviceType',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' },
                    avgWeight: { $avg: '$weight' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Daily booking trend
        const dailyTrend = await Booking.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        // Top shippers by booking count
        const topShippers = await Booking.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$shipper',
                    bookingCount: { $sum: 1 },
                    totalRevenue: { $sum: '$totalAmount' }
                }
            },
            { $sort: { bookingCount: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'shippers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'shipperInfo'
                }
            },
            { $unwind: '$shipperInfo' }
        ]);

        // Summary
        const summary = {
            totalBookings: bookings.length,
            totalAmount: bookings.reduce((sum, b) => sum + b.totalAmount, 0),
            avgBookingValue: bookings.length > 0 ? bookings.reduce((sum, b) => sum + b.totalAmount, 0) / bookings.length : 0,
            totalWeight: bookings.reduce((sum, b) => sum + b.weight, 0)
        };

        res.json({
            summary,
            bookings: bookings.slice(0, 100), // Limit detailed data
            statusBreakdown,
            serviceBreakdown,
            dailyTrend,
            topShippers,
            filters: { startDate, endDate, status, serviceType, shipperId }
        });
    } catch (error) {
        console.error('Error generating booking report:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Generate performance report
// @route   POST /api/reports/performance
// @access  Private
exports.generatePerformanceReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;

        const dateRange = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };

        // Delivery performance
        const deliveryStats = await Booking.aggregate([
            {
                $match: {
                    status: 'Delivered',
                    deliveryDate: dateRange
                }
            },
            {
                $project: {
                    onTime: {
                        $cond: [
                            { $lte: ['$deliveryDate', '$expectedDeliveryDate'] },
                            1,
                            0
                        ]
                    },
                    delayed: {
                        $cond: [
                            { $gt: ['$deliveryDate', '$expectedDeliveryDate'] },
                            1,
                            0
                        ]
                    },
                    deliveryDays: {
                        $divide: [
                            { $subtract: ['$deliveryDate', '$createdAt'] },
                            1000 * 60 * 60 * 24
                        ]
                    },
                    serviceType: 1
                }
            },
            {
                $group: {
                    _id: '$serviceType',
                    totalDeliveries: { $sum: 1 },
                    onTimeDeliveries: { $sum: '$onTime' },
                    delayedDeliveries: { $sum: '$delayed' },
                    avgDeliveryDays: { $avg: '$deliveryDays' }
                }
            }
        ]);

        // Exception analysis
        const exceptionStats = await Exception.aggregate([
            {
                $match: { createdAt: dateRange }
            },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    resolved: {
                        $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] }
                    },
                    avgResolutionTime: {
                        $avg: {
                            $cond: [
                                { $eq: ['$status', 'Resolved'] },
                                { $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 1000 * 60 * 60] },
                                null
                            ]
                        }
                    }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Revenue vs expenses (COD collections)
        const financialPerformance = await Booking.aggregate([
            {
                $match: {
                    createdAt: dateRange,
                    status: 'Delivered'
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalAmount' },
                    codAmount: {
                        $sum: { $cond: [{ $eq: ['$paymentMode', 'COD'] }, '$codAmount', 0] }
                    },
                    shippingCharges: { $sum: '$shippingCharges' },
                    bookingCount: { $sum: 1 }
                }
            }
        ]);

        // Customer satisfaction (based on exceptions)
        const totalDeliveries = await Booking.countDocuments({
            status: 'Delivered',
            deliveryDate: dateRange
        });
        const totalExceptions = await Exception.countDocuments({ createdAt: dateRange });
        const satisfactionRate = totalDeliveries > 0
            ? (((totalDeliveries - totalExceptions) / totalDeliveries) * 100).toFixed(2)
            : 100;

        res.json({
            deliveryPerformance: deliveryStats,
            exceptionAnalysis: exceptionStats,
            financialPerformance: financialPerformance[0] || {},
            satisfactionMetrics: {
                totalDeliveries,
                totalExceptions,
                satisfactionRate: parseFloat(satisfactionRate)
            },
            filters: { startDate, endDate }
        });
    } catch (error) {
        console.error('Error generating performance report:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Export report to PDF
// @route   POST /api/reports/export/pdf
// @access  Private
exports.exportToPDF = async (req, res) => {
    try {
        const { reportType, data, filters } = req.body;

        const doc = new PDFDocument({ margin: 50 });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report-${Date.now()}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).text('Thermovex Courier Management', { align: 'center' });
        doc.fontSize(16).text(`${reportType.toUpperCase()} REPORT`, { align: 'center' });
        doc.moveDown();

        // Filters
        doc.fontSize(10).text(`Report Period: ${filters.startDate} to ${filters.endDate}`, { align: 'left' });
        doc.text(`Generated: ${new Date().toLocaleString()}`, { align: 'left' });
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        if (reportType === 'revenue') {
            // Summary
            doc.fontSize(14).text('Summary', { underline: true });
            doc.fontSize(10);
            doc.text(`Total Revenue: ₹${data.summary.totalRevenue?.toLocaleString() || 0}`);
            doc.text(`Total Paid: ₹${data.summary.totalPaid?.toLocaleString() || 0}`);
            doc.text(`Outstanding: ₹${data.summary.totalOutstanding?.toLocaleString() || 0}`);
            doc.text(`Invoice Count: ${data.summary.invoiceCount || 0}`);
            doc.moveDown();

            // Revenue by Service
            if (data.revenueByService?.length > 0) {
                doc.fontSize(12).text('Revenue by Service Type', { underline: true });
                doc.fontSize(9);
                data.revenueByService.forEach(service => {
                    doc.text(`${service._id}: ₹${service.revenue.toLocaleString()} (${service.count} bookings)`);
                });
                doc.moveDown();
            }

            // Top Shippers
            if (data.revenueByShipper?.length > 0) {
                doc.fontSize(12).text('Top Shippers', { underline: true });
                doc.fontSize(9);
                data.revenueByShipper.slice(0, 10).forEach((shipper, index) => {
                    doc.text(`${index + 1}. ${shipper.shipperInfo.companyName}: ₹${shipper.totalRevenue.toLocaleString()}`);
                });
            }
        } else if (reportType === 'booking') {
            // Summary
            doc.fontSize(14).text('Summary', { underline: true });
            doc.fontSize(10);
            doc.text(`Total Bookings: ${data.summary.totalBookings}`);
            doc.text(`Total Amount: ₹${data.summary.totalAmount?.toLocaleString() || 0}`);
            doc.text(`Average Booking Value: ₹${data.summary.avgBookingValue?.toFixed(2) || 0}`);
            doc.text(`Total Weight: ${data.summary.totalWeight?.toFixed(2) || 0} kg`);
            doc.moveDown();

            // Status Breakdown
            if (data.statusBreakdown?.length > 0) {
                doc.fontSize(12).text('Status Breakdown', { underline: true });
                doc.fontSize(9);
                data.statusBreakdown.forEach(status => {
                    doc.text(`${status._id}: ${status.count} bookings (₹${status.totalAmount?.toLocaleString() || 0})`);
                });
                doc.moveDown();
            }

            // Service Breakdown
            if (data.serviceBreakdown?.length > 0) {
                doc.fontSize(12).text('Service Type Breakdown', { underline: true });
                doc.fontSize(9);
                data.serviceBreakdown.forEach(service => {
                    doc.text(`${service._id}: ${service.count} bookings, Avg Weight: ${service.avgWeight?.toFixed(2) || 0} kg`);
                });
            }
        } else if (reportType === 'performance') {
            // Delivery Performance
            if (data.deliveryPerformance?.length > 0) {
                doc.fontSize(14).text('Delivery Performance', { underline: true });
                doc.fontSize(9);
                data.deliveryPerformance.forEach(perf => {
                    const onTimeRate = ((perf.onTimeDeliveries / perf.totalDeliveries) * 100).toFixed(1);
                    doc.text(`${perf._id}: ${perf.totalDeliveries} deliveries, ${onTimeRate}% on-time, Avg: ${perf.avgDeliveryDays?.toFixed(1)} days`);
                });
                doc.moveDown();
            }

            // Satisfaction Metrics
            doc.fontSize(14).text('Customer Satisfaction', { underline: true });
            doc.fontSize(10);
            doc.text(`Total Deliveries: ${data.satisfactionMetrics.totalDeliveries}`);
            doc.text(`Total Exceptions: ${data.satisfactionMetrics.totalExceptions}`);
            doc.text(`Satisfaction Rate: ${data.satisfactionMetrics.satisfactionRate}%`);
        }

        doc.end();
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Export report to Excel
// @route   POST /api/reports/export/excel
// @access  Private
exports.exportToExcel = async (req, res) => {
    try {
        const { reportType, data, filters } = req.body;

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Thermovex Courier System';
        workbook.created = new Date();

        if (reportType === 'revenue') {
            const sheet = workbook.addWorksheet('Revenue Report');

            // Header
            sheet.mergeCells('A1:D1');
            sheet.getCell('A1').value = 'REVENUE REPORT';
            sheet.getCell('A1').font = { size: 16, bold: true };
            sheet.getCell('A1').alignment = { horizontal: 'center' };

            sheet.getCell('A2').value = `Period: ${filters.startDate} to ${filters.endDate}`;
            sheet.getCell('A3').value = `Generated: ${new Date().toLocaleString()}`;

            // Summary
            sheet.getCell('A5').value = 'SUMMARY';
            sheet.getCell('A5').font = { bold: true };
            sheet.getCell('A6').value = 'Total Revenue:';
            sheet.getCell('B6').value = data.summary.totalRevenue || 0;
            sheet.getCell('A7').value = 'Total Paid:';
            sheet.getCell('B7').value = data.summary.totalPaid || 0;
            sheet.getCell('A8').value = 'Outstanding:';
            sheet.getCell('B8').value = data.summary.totalOutstanding || 0;
            sheet.getCell('A9').value = 'Invoice Count:';
            sheet.getCell('B9').value = data.summary.invoiceCount || 0;

            // Revenue by Service
            if (data.revenueByService?.length > 0) {
                let row = 12;
                sheet.getCell(`A${row}`).value = 'REVENUE BY SERVICE TYPE';
                sheet.getCell(`A${row}`).font = { bold: true };
                row++;
                sheet.getRow(row).values = ['Service Type', 'Revenue', 'Count', 'Avg Revenue'];
                sheet.getRow(row).font = { bold: true };
                row++;

                data.revenueByService.forEach(service => {
                    sheet.getRow(row).values = [
                        service._id,
                        service.revenue,
                        service.count,
                        service.avgRevenue
                    ];
                    row++;
                });
            }

            // Column widths
            sheet.getColumn(1).width = 25;
            sheet.getColumn(2).width = 15;
            sheet.getColumn(3).width = 15;
            sheet.getColumn(4).width = 15;

        } else if (reportType === 'booking') {
            const sheet = workbook.addWorksheet('Booking Report');

            // Header
            sheet.mergeCells('A1:F1');
            sheet.getCell('A1').value = 'BOOKING REPORT';
            sheet.getCell('A1').font = { size: 16, bold: true };
            sheet.getCell('A1').alignment = { horizontal: 'center' };

            // Bookings details
            let row = 4;
            sheet.getRow(row).values = ['AWB Number', 'Shipper', 'Service Type', 'Status', 'Weight', 'Amount'];
            sheet.getRow(row).font = { bold: true };
            row++;

            if (data.bookings?.length > 0) {
                data.bookings.forEach(booking => {
                    sheet.getRow(row).values = [
                        booking.awbNumber,
                        booking.shipper?.companyName || 'N/A',
                        booking.serviceType,
                        booking.status,
                        booking.weight,
                        booking.totalAmount
                    ];
                    row++;
                });
            }

            // Column widths
            sheet.columns = [
                { width: 20 },
                { width: 30 },
                { width: 15 },
                { width: 15 },
                { width: 12 },
                { width: 12 }
            ];
        } else if (reportType === 'performance') {
            const sheet = workbook.addWorksheet('Performance Report');

            // Header
            sheet.mergeCells('A1:E1');
            sheet.getCell('A1').value = 'PERFORMANCE REPORT';
            sheet.getCell('A1').font = { size: 16, bold: true };
            sheet.getCell('A1').alignment = { horizontal: 'center' };

            // Delivery Performance
            let row = 4;
            sheet.getCell(`A${row}`).value = 'DELIVERY PERFORMANCE';
            sheet.getCell(`A${row}`).font = { bold: true };
            row++;
            sheet.getRow(row).values = ['Service Type', 'Total', 'On-Time', 'Delayed', 'Avg Days'];
            sheet.getRow(row).font = { bold: true };
            row++;

            if (data.deliveryPerformance?.length > 0) {
                data.deliveryPerformance.forEach(perf => {
                    sheet.getRow(row).values = [
                        perf._id,
                        perf.totalDeliveries,
                        perf.onTimeDeliveries,
                        perf.delayedDeliveries,
                        perf.avgDeliveryDays?.toFixed(2)
                    ];
                    row++;
                });
            }

            // Satisfaction metrics
            row += 2;
            sheet.getCell(`A${row}`).value = 'CUSTOMER SATISFACTION';
            sheet.getCell(`A${row}`).font = { bold: true };
            row++;
            sheet.getCell(`A${row}`).value = 'Total Deliveries:';
            sheet.getCell(`B${row}`).value = data.satisfactionMetrics.totalDeliveries;
            row++;
            sheet.getCell(`A${row}`).value = 'Total Exceptions:';
            sheet.getCell(`B${row}`).value = data.satisfactionMetrics.totalExceptions;
            row++;
            sheet.getCell(`A${row}`).value = 'Satisfaction Rate:';
            sheet.getCell(`B${row}`).value = `${data.satisfactionMetrics.satisfactionRate}%`;

            // Column widths
            sheet.columns = [
                { width: 20 },
                { width: 12 },
                { width: 12 },
                { width: 12 },
                { width: 12 }
            ];
        }

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report-${Date.now()}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
