const PDFDocument = require('pdfkit');
const Invoice = require('../models/Invoice.model');

const generateInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('shipper')
      .populate('booking');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoice.invoiceNumber}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Helper function for drawing lines
    const drawLine = (y) => {
      doc.moveTo(50, y)
         .lineTo(545, y)
         .stroke();
    };

    // Company Header
    doc.fontSize(22)
       .font('Helvetica-Bold')
       .fillColor('#1976d2')
       .text(invoice.companyInfo.name, 50, 50);

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#333333')
       .text(invoice.companyInfo.address, 50, 80)
       .text(`GST: ${invoice.companyInfo.gstNumber} | PAN: ${invoice.companyInfo.panNumber}`, 50, 95)
       .text(`Email: ${invoice.companyInfo.email} | Phone: ${invoice.companyInfo.mobile}`, 50, 110);

    // Invoice Title
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor('#1976d2')
       .text(`TAX INVOICE`, 400, 50);

    // Invoice Number and Date Box
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#333333')
       .text(`Invoice No: ${invoice.invoiceNumber}`, 400, 75)
       .text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`, 400, 90)
       .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}`, 400, 105);

    if (invoice.referenceNumber) {
      doc.text(`Ref: ${invoice.referenceNumber}`, 400, 120);
    }

    // Draw horizontal line
    drawLine(140);

    // Bill To Section
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#1976d2')
       .text('BILL TO:', 50, 155);

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#333333')
       .text(invoice.customerDetails.companyName, 50, 175);

    doc.font('Helvetica')
       .text(invoice.customerDetails.contactPerson, 50, 190)
       .text(`${invoice.customerDetails.address?.street || ''}`, 50, 205)
       .text(`${invoice.customerDetails.address?.city || ''}, ${invoice.customerDetails.address?.state || ''} - ${invoice.customerDetails.address?.pincode || ''}`, 50, 220)
       .text(`Email: ${invoice.customerDetails.email || 'N/A'}`, 50, 235)
       .text(`Mobile: ${invoice.customerDetails.mobile || 'N/A'}`, 50, 250);

    if (invoice.customerDetails.gstNumber) {
      doc.text(`GST: ${invoice.customerDetails.gstNumber}`, 50, 265);
    }

    // Shipment Details (if booking linked)
    if (invoice.booking) {
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#1976d2')
         .text('SHIPMENT DETAILS:', 320, 155);

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#333333')
         .text(`AWB: ${invoice.booking.awbNumber || 'N/A'}`, 320, 175)
         .text(`Service: ${invoice.booking.serviceType || 'N/A'}`, 320, 190)
         .text(`Type: ${invoice.booking.shipmentType || 'N/A'}`, 320, 205)
         .text(`Weight: ${invoice.booking.weight || 'N/A'} kg`, 320, 220);
    }

    // Items Table Header
    const tableTop = 305;
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#ffffff');

    // Table header background
    doc.rect(50, tableTop - 5, 495, 25)
       .fill('#1976d2');

    doc.fillColor('#ffffff')
       .text('Description', 55, tableTop + 5)
       .text('HSN/SAC', 280, tableTop + 5)
       .text('Qty', 350, tableTop + 5)
       .text('Rate', 400, tableTop + 5)
       .text('Amount', 480, tableTop + 5, { align: 'right' });

    // Items
    let yPosition = tableTop + 35;
    doc.font('Helvetica')
       .fillColor('#333333');

    invoice.items.forEach((item, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      doc.fontSize(9)
         .text(item.description, 55, yPosition, { width: 215 })
         .text(item.sacCode || item.hsnCode || '-', 280, yPosition)
         .text(item.quantity.toString(), 350, yPosition)
         .text(`₹${item.rate.toFixed(2)}`, 400, yPosition)
         .text(`₹${item.amount.toFixed(2)}`, 480, yPosition, { align: 'right' });

      yPosition += 25;
    });

    // Draw line before totals
    yPosition += 10;
    drawLine(yPosition);

    // Totals Section
    yPosition += 20;
    const totalsX = 380;

    doc.fontSize(10)
       .font('Helvetica')
       .text('Subtotal:', totalsX, yPosition)
       .text(`₹${invoice.subtotal.toFixed(2)}`, 480, yPosition, { align: 'right' });

    if (invoice.discount > 0) {
      yPosition += 20;
      doc.text(`Discount${invoice.discountType === 'percentage' ? ' (%)' : ''}:`, totalsX, yPosition)
         .text(`-₹${invoice.discount.toFixed(2)}`, 480, yPosition, { align: 'right' });
    }

    yPosition += 20;
    doc.text('Taxable Amount:', totalsX, yPosition)
       .text(`₹${invoice.taxableAmount.toFixed(2)}`, 480, yPosition, { align: 'right' });

    // GST Breakdown
    if (invoice.cgst > 0) {
      yPosition += 20;
      doc.text(`CGST (${invoice.gstRate / 2}%):`, totalsX, yPosition)
         .text(`₹${invoice.cgst.toFixed(2)}`, 480, yPosition, { align: 'right' });

      yPosition += 20;
      doc.text(`SGST (${invoice.gstRate / 2}%):`, totalsX, yPosition)
         .text(`₹${invoice.sgst.toFixed(2)}`, 480, yPosition, { align: 'right' });
    }

    if (invoice.igst > 0) {
      yPosition += 20;
      doc.text(`IGST (${invoice.gstRate}%):`, totalsX, yPosition)
         .text(`₹${invoice.igst.toFixed(2)}`, 480, yPosition, { align: 'right' });
    }

    if (invoice.roundOff !== 0) {
      yPosition += 20;
      doc.text('Round Off:', totalsX, yPosition)
         .text(`₹${invoice.roundOff.toFixed(2)}`, 480, yPosition, { align: 'right' });
    }

    // Grand Total
    yPosition += 25;
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#1976d2')
       .text('Grand Total:', totalsX, yPosition)
       .text(`₹${invoice.grandTotal.toFixed(2)}`, 480, yPosition, { align: 'right' });

    // Amount in Words
    yPosition += 30;
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#333333')
       .text(`Amount in Words: ${numberToWords(invoice.grandTotal)} Rupees Only`, 50, yPosition);

    // Bank Details
    yPosition += 30;
    if (invoice.bankDetails && invoice.bankDetails.bankName) {
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#1976d2')
         .text('BANK DETAILS:', 50, yPosition);

      yPosition += 20;
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#333333')
         .text(`Bank: ${invoice.bankDetails.bankName}`, 50, yPosition)
         .text(`A/C Number: ${invoice.bankDetails.accountNumber}`, 50, yPosition + 15)
         .text(`IFSC: ${invoice.bankDetails.ifscCode}`, 50, yPosition + 30)
         .text(`A/C Holder: ${invoice.bankDetails.accountHolderName}`, 50, yPosition + 45);
    }

    // Terms and Conditions
    yPosition += 80;
    if (yPosition > 650) {
      doc.addPage();
      yPosition = 50;
    }

    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor('#1976d2')
       .text('TERMS & CONDITIONS:', 50, yPosition);

    yPosition += 20;
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#333333')
       .text(invoice.paymentTerms || 'Payment due within 30 days', 50, yPosition);

    if (invoice.notes) {
      yPosition += 20;
      doc.text(`Note: ${invoice.notes}`, 50, yPosition, { width: 495 });
    }

    // Signature Section
    yPosition += 60;
    if (yPosition > 700) {
      doc.addPage();
      yPosition = 50;
    }

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('For ' + invoice.companyInfo.name, 380, yPosition);

    yPosition += 50;
    doc.text('Authorized Signatory', 380, yPosition);

    // Footer
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#666666')
       .text('This is a computer-generated invoice and does not require a signature.', 50, 770, {
         align: 'center',
         width: 495
       });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ message: 'Error generating PDF: ' + error.message });
  }
};

// Helper function to convert number to words (Indian numbering system)
function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';

  const crores = Math.floor(num / 10000000);
  num %= 10000000;
  const lakhs = Math.floor(num / 100000);
  num %= 100000;
  const thousands = Math.floor(num / 1000);
  num %= 1000;
  const hundreds = Math.floor(num / 100);
  num %= 100;

  let words = '';

  if (crores > 0) {
    words += convertTwoDigit(crores) + ' Crore ';
  }
  if (lakhs > 0) {
    words += convertTwoDigit(lakhs) + ' Lakh ';
  }
  if (thousands > 0) {
    words += convertTwoDigit(thousands) + ' Thousand ';
  }
  if (hundreds > 0) {
    words += ones[hundreds] + ' Hundred ';
  }
  if (num > 0) {
    words += convertTwoDigit(num);
  }

  return words.trim();

  function convertTwoDigit(n) {
    if (n < 10) return ones[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    return tens[Math.floor(n / 10)] + ' ' + ones[n % 10];
  }
}

module.exports = { generateInvoicePDF };
