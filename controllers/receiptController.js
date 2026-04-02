const Receipt = require('../models/Receipt');
const PDFDocument = require('pdfkit');

// 1. Get all receipts (Populated for the Frontend Page)
exports.getAllReceipts = async (req, res) => {
  try {
    const receipts = await Receipt.find()
      .populate('clientId', 'name')
      .populate('propertyId', 'title location')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: receipts
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Generate PDF for a Receipt
exports.downloadReceiptPDF = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('clientId')
      .populate('propertyId')
      .populate('invoiceId');

    if (!receipt) return res.status(404).send('Receipt not found');

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${receipt.receiptNumber}.pdf`);
    doc.pipe(res);

    // Header Design (Teal Color for Receipts)
    doc.rect(0, 0, 612, 100).fill('#0d9488'); 
    doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('PAYMENT RECEIPT', 40, 40);
    doc.fontSize(10).font('Helvetica').text(`RECEIPT NO: ${receipt.receiptNumber}`, 40, 65);

    // Client and Property Info
    doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold').text('RECEIVED FROM:', 40, 130);
    doc.font('Helvetica').text(receipt.clientId?.name || 'Valued Client', 40, 150);

    doc.font('Helvetica-Bold').text('PAYMENT FOR:', 300, 130);
    doc.font('Helvetica').text(receipt.propertyId?.title || 'Property Service', 300, 150);
    doc.fontSize(10).fillColor('#64748b').text(receipt.propertyId?.location || '', 300, 165);

    // Payment Summary Box
    doc.rect(40, 200, 532, 80).fill('#f0fdfa');
    doc.fillColor('#0d9488').font('Helvetica-Bold').fontSize(10).text('AMOUNT PAID', 60, 215);
    doc.fontSize(24).text(`N${receipt.amountPaid.toLocaleString()}`, 60, 230);
    
    doc.fillColor('#475569').fontSize(10).text('PAYMENT METHOD', 350, 215);
    doc.fillColor('#1e293b').text(receipt.paymentMethod?.toUpperCase() || 'CASH', 350, 230);
    doc.fillColor('#475569').text('DATE', 350, 250);
    doc.fillColor('#1e293b').text(new Date(receipt.date).toLocaleDateString(), 350, 265);

    // Balance Remaining
    doc.moveTo(40, 310).lineTo(572, 310).stroke('#e2e8f0');
    doc.fillColor('#64748b').fontSize(11).text('Remaining Balance on Invoice:', 40, 330);
    doc.fillColor('#ef4444').font('Helvetica-Bold').text(`N${(receipt.balanceRemaining || 0).toLocaleString()}`, 220, 330);

    // Footer
    doc.fillColor('#94a3b8').fontSize(10).font('Helvetica-Oblique')
       .text('Thank you for your payment. This is an official computer-generated receipt.', 0, 700, { align: 'center', width: 612 });

    doc.end();
  } catch (error) {
    res.status(500).send('Error generating Receipt PDF');
  }
};

// 3. Standard CRUD
exports.createReceipt = async (req, res) => {
  try {
    const receipt = new Receipt(req.body);
    await receipt.save();
    res.status(201).json({ success: true, data: receipt });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getReceiptById = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('clientId', 'name')
      .populate('propertyId', 'title location');
    if (!receipt) return res.status(404).json({ success: false, error: 'Receipt not found' });
    res.json({ success: true, data: receipt });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!receipt) return res.status(404).json({ success: false, error: 'Receipt not found' });
    res.json({ success: true, data: receipt });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findByIdAndDelete(req.params.id);
    if (!receipt) return res.status(404).json({ success: false, error: 'Receipt not found' });
    res.json({ success: true, message: 'Receipt deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add this to receiptController.js
exports.generateFromPayment = async (req, res) => {
  try {
    const { invoiceId, clientId, propertyId, amountPaid, paymentMethod, balanceRemaining, transactionId } = req.body;

    const receipt = new Receipt({
      receiptNumber: `REC-${Date.now()}`,
      invoiceId,
      transactionId,
      clientId,
      propertyId,
      amountPaid,
      paymentMethod,
      balanceRemaining: balanceRemaining || 0,
      date: new Date()
    });

    await receipt.save();
    
    // FINAL FIX: Populate before sending back to Frontend
    const populatedReceipt = await Receipt.findById(receipt._id)
      .populate('clientId', 'name')
      .populate('propertyId', 'title name');

    res.status(201).json({ 
        success: true, 
        data: populatedReceipt 
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};