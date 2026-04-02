const PDFDocument = require('pdfkit');
const Invoice = require('../models/Invoice');
const Transaction = require('../models/Transaction');
const Receipt = require('../models/Receipt');

// 1. Create a new invoice (Manual)
exports.createInvoice = async (req, res) => {
  try {
    const invoice = new Invoice(req.body);
    await invoice.save();

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('transactionId')
      .populate('clientId', 'name')
      .populate('propertyId', 'title name');

    res.status(201).json({ success: true, data: populatedInvoice });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// 2. Get all invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('transactionId')
      .populate('clientId', 'name')
      .populate('propertyId', 'title name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Get single invoice
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('transactionId')
      .populate('clientId', 'name')
      .populate('propertyId', 'title name');

    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 4. Update invoice
exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('transactionId')
      .populate('clientId', 'name')
      .populate('propertyId', 'title name');

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 5. Delete invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ success: true, message: 'Invoice deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 6. Generate invoice from transaction (The Sync Logic)
exports.generateFromTransaction = async (req, res) => {
  try {
    const { transactionId } = req.body;

    // 1. Find the transaction and populate links
    const transaction = await Transaction.findById(transactionId).populate('client property');
    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    // 2. Check if an invoice already exists for this transaction
    let invoice = await Invoice.findOne({ transactionId });

    // 3. Define the values to sync
    const total = Number(transaction.totalAmount || 0);
    const paid = Number(transaction.paidAmount || 0);
    const isFullyPaid = transaction.status === 'completed' || paid >= total;

    if (invoice) {
      // UPDATE EXISTING INVOICE
      invoice.totalAmount = total;
      invoice.amountPaid = paid; // Now saves because of your Schema update
      invoice.status = isFullyPaid ? 'paid' : 'pending';
      
      // Ensure IDs are synced in case they changed in the transaction
      invoice.clientId = transaction.client?._id || transaction.client;
      invoice.propertyId = transaction.property?._id || transaction.property;
      invoice.clientName = transaction.client?.name || 'Unknown';
    } else {
      // CREATE NEW INVOICE
      invoice = new Invoice({
        invoiceNumber: `INV-${Date.now()}`, // Generates a unique number
        transactionId: transaction._id,
        clientId: transaction.client?._id || transaction.client,
        propertyId: transaction.property?._id || transaction.property,
        clientName: transaction.client?.name || 'Unknown',
        totalAmount: total,
        amountPaid: paid, 
        status: isFullyPaid ? 'paid' : 'pending',
        date: new Date()
      });
    }

    // 4. Save to Database
    await invoice.save();

    // 5. Return populated data so the Frontend UI looks good immediately
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('clientId', 'name')
      .populate('propertyId', 'title name');

    res.status(200).json({ 
      success: true, 
      data: populatedInvoice 
    });

  } catch (error) {
    console.error("GENERATE INVOICE ERROR:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// 7. Pay invoice (Updated for Receipt Data Accuracy)
exports.payInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, date } = req.body;
    
    const paymentAmount = Number(amount);
    if (!paymentAmount || isNaN(paymentAmount)) {
        return res.status(400).json({ success: false, error: 'Invalid payment amount' });
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });

    const transaction = await Transaction.findById(invoice.transactionId);
    if (!transaction) return res.status(404).json({ success: false, error: 'Linked transaction not found' });

    // 1. Calculate NEW totals
    const totalPaidSoFar = Math.round(((transaction.paidAmount || 0) + paymentAmount) * 100) / 100;
    const remaining = Math.round((transaction.totalAmount - totalPaidSoFar) * 100) / 100;

    // 2. Update Transaction
    transaction.paidAmount = totalPaidSoFar;
    transaction.status = remaining <= 0 ? 'completed' : 'partially_paid';

    // 3. Update Invoice
    invoice.amountPaid = totalPaidSoFar; 
    invoice.status = remaining <= 0 ? 'paid' : 'pending';

    await transaction.save();
    await invoice.save();

    // 4. Clean up Payment Method
    let formattedMethod = 'bank_transfer'; 
    const methodInput = (paymentMethod || '').toLowerCase();
    if (methodInput.includes('transfer')) formattedMethod = 'bank_transfer';
    else if (methodInput.includes('cash')) formattedMethod = 'cash';
    else if (methodInput.includes('card')) formattedMethod = 'credit_card';
    else if (methodInput.includes('check')) formattedMethod = 'check';

    // 5. Create Receipt (Added unique random suffix to ensure creation on every payment)
    let receipt = null;
    try {
        const uniqueSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
        receipt = new Receipt({
            receiptNumber: `REC-${Date.now()}-${uniqueSuffix}`,
            invoiceId: invoice._id,
            transactionId: transaction._id,
            clientId: invoice.clientId,    
            propertyId: invoice.propertyId, 
            amountPaid: paymentAmount, 
            balanceRemaining: Math.max(0, remaining),
            paymentMethod: formattedMethod,
            date: date || new Date()
        });
        await receipt.save();
    } catch (receiptError) {
        console.error("Receipt Save Error:", receiptError.message);
    }

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('clientId', 'name')
      .populate('propertyId', 'title name');

    res.status(201).json({
      success: true,
      data: { receipt, invoice: populatedInvoice, transaction }
    });
  } catch (error) {
    console.error("PAYMENT ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 8. Download PDF
exports.downloadInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('clientId')
      .populate('propertyId');

    if (!invoice) return res.status(404).send('Invoice not found');

    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${invoice.invoiceNumber}.pdf`);
    doc.pipe(res);

    // Header Background
    doc.rect(0, 0, 612, 120).fill('#1e293b'); 
    doc.fillColor('#ffffff').fontSize(25).font('Helvetica-Bold').text('INVOICE', 40, 45);
    doc.fontSize(10).font('Helvetica').text(`NO: ${invoice.invoiceNumber}`, 40, 75);

    // Status Badge
    const statusColor = invoice.status === 'paid' ? '#10b981' : '#f59e0b';
    doc.rect(450, 40, 100, 30).fill(statusColor);
    doc.fillColor('#ffffff').fontSize(12).text(invoice.status?.toUpperCase() || 'PENDING', 450, 50, { width: 100, align: 'center' });

    doc.fillColor('#000000').fontSize(10);
    const bodyStart = 150;

    // From Section
    doc.font('Helvetica-Bold').text('FROM:', 40, bodyStart);
    doc.font('Helvetica').text('SurePay Real Estate', 40, bodyStart + 15);
    doc.text('Ibadan, Oyo State, Nigeria', 40, bodyStart + 30);

    // Bill To Section
    doc.font('Helvetica-Bold').text('BILL TO:', 300, bodyStart);
    doc.font('Helvetica').text(invoice.clientId?.name || invoice.clientName || 'Valued Client', 300, bodyStart + 15);

    // Property Box
    doc.rect(40, 220, 512, 60).fill('#f8fafc');
    doc.fillColor('#475569').font('Helvetica-Bold').text('PROPERTY DETAILS', 55, 230);
    doc.fillColor('#1e293b').font('Helvetica').text(invoice.propertyId?.title || invoice.propertyId?.name || 'Real Estate Asset', 55, 250);

    // Table Header
    const tableTop = 320;
    doc.fillColor('#1e293b').rect(40, tableTop, 512, 25).fill();
    doc.fillColor('#ffffff').font('Helvetica-Bold');
    doc.text('Description', 60, tableTop + 7);
    doc.text('Total', 320, tableTop + 7);
    doc.text('Paid', 400, tableTop + 7);
    doc.text('Balance', 480, tableTop + 7);

    // Table Row
    const rowY = tableTop + 40;
    const currentPaid = Number(invoice.amountPaid || 0);
    const currentTotal = Number(invoice.totalAmount || 0);
    const balance = currentTotal - currentPaid;

    doc.fillColor('#000000').font('Helvetica');
    doc.text('Property Transaction Fee', 60, rowY);
    doc.text(`N${currentTotal.toLocaleString()}`, 320, rowY);
    doc.text(`N${currentPaid.toLocaleString()}`, 400, rowY);
    doc.text(`N${balance.toLocaleString()}`, 480, rowY);

    // Total Due Box
    doc.rect(330, 450, 222, 100).fill('#f1f5f9');
    doc.fillColor('#475569').fontSize(12).text('TOTAL BALANCE', 350, 470);
    doc.fillColor('#1e293b').fontSize(22).font('Helvetica-Bold').text(`N${balance.toLocaleString()}`, 350, 490);

    // Footer
    doc.fontSize(10).fillColor('#94a3b8').text('This is a computer-generated document.', 0, 780, { align: 'center', width: 595 });

    doc.end();
  } catch (error) {
    console.error("PDF Generation Error:", error);
    if (!res.headersSent) {
      res.status(500).send('Error generating PDF');
    }
  }
};