const Transaction = require('../models/Transaction');
const Property = require('../models/Property');

// Safe imports — won't crash the whole file if model doesn't exist yet
let Receipt, Invoice;
try { Receipt = require('../models/Receipt'); } catch (e) { console.warn('Receipt model not found'); }
try { Invoice = require('../models/Invoice'); } catch (e) { console.warn('Invoice model not found'); }

// Create a new transaction
exports.createTransaction = async (req, res) => {
  try {
    // Handle empty transactionId strings
    if (!req.body.transactionId || req.body.transactionId === "") {
        delete req.body.transactionId;
    }

    const transactionData = {
      ...req.body,
      transactionId: req.body.transactionId || `TXN-${Date.now().toString().slice(-6)}`
    };

    const transaction = new Transaction(transactionData);
    await transaction.save();

    // FIX: Update Property status immediately on creation
    if (req.body.property) {
      const propId = req.body.property;
      // If fully paid -> sold. If deposit made -> under_contract.
      const newStatus = transaction.status === 'completed' ? 'sold' : 'sold';
      await Property.findByIdAndUpdate(propId, { status: newStatus });
    }

    // 2. Automatically Create Receipt if payment is made
    if (Receipt && Number(transaction.paidAmount) > 0) {
      try {
        const uniqueSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
        
        const receipt = new Receipt({
          receiptNumber: `REC-${Date.now()}-${uniqueSuffix}`,
          transactionId: transaction._id,
          // invoiceId is now optional, so it's okay if this is missing!
          clientId: transaction.client,
          propertyId: transaction.property,
          amountPaid: transaction.paidAmount,
          balanceRemaining: Math.max(0, transaction.totalAmount - transaction.paidAmount),
          paymentMethod: req.body.paymentMethod || 'bank_transfer',
          date: new Date()
        });
        
        await receipt.save();
      } catch (receiptErr) {
        console.error("Auto-Receipt Error:", receiptErr.message);
        // We don't fail the whole request if just the receipt fails
      }
    }

    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('client')
      .populate('property');

    res.status(201).json({ success: true, data: populatedTransaction });
  } catch (error) {
    console.error("Creation Error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('client')
      .populate('property')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get a single transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('client')
      .populate('property');
    if (!transaction) return res.status(404).json({ success: false, error: 'Transaction not found' });
    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update a transaction by ID
exports.updateTransaction = async (req, res) => {
  try {
    const { paidAmount, totalAmount } = req.body;
    const updateData = { ...req.body };

    const oldTransaction = await Transaction.findById(req.params.id);
    if (!oldTransaction) return res.status(404).json({ success: false, error: 'Transaction not found' });

    // 1. Update Transaction Status (Internal Logic)
    if (paidAmount !== undefined && totalAmount !== undefined) {
      if (Number(paidAmount) >= Number(totalAmount)) {
        updateData.status = 'completed';
      } else if (Number(paidAmount) > 0) {
        updateData.status = 'partially_paid';
      }
    }

    const transaction = await Transaction.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('client')
      .populate('property');

    // 2. FORCE PROPERTY STATUS TO 'SOLD'
    if (transaction.property) {
      const propId = transaction.property._id || transaction.property;
      
      // LOGIC CHANGE: If ANY money is paid (> 0), set to 'sold'
      // This prevents the status from being blank.
      if (Number(transaction.paidAmount) > 0) {
        await Property.findByIdAndUpdate(propId, { status: 'sold' });
        console.log(`Property ${propId} forced to SOLD due to payment.`);
      }
    }

    // 3. Receipt Automation (Keep your existing logic)
    const newPaymentMade = Number(paidAmount || 0) - Number(oldTransaction.paidAmount || 0);
    if (newPaymentMade > 0 && Receipt) {
      const uniqueSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      const linkedInvoice = Invoice ? await Invoice.findOne({ transactionId: transaction._id }) : null;

      const receipt = new Receipt({
        receiptNumber: `REC-${Date.now()}-${uniqueSuffix}`,
        transactionId: transaction._id,
        invoiceId: linkedInvoice ? linkedInvoice._id : undefined,
        clientId: transaction.client._id || transaction.client,
        propertyId: transaction.property._id || transaction.property, // Ensures ID is passed
        amountPaid: newPaymentMade,
        balanceRemaining: Math.max(0, transaction.totalAmount - transaction.paidAmount),
        paymentMethod: req.body.paymentMethod || 'bank_transfer', // Uses selected method
        date: new Date()
      });
      await receipt.save();
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete a transaction by ID
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, error: 'Transaction not found' });

    if (transaction.property) {
      await Property.findByIdAndUpdate(transaction.property, { status: 'available' });
    }

    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: { message: 'Transaction deleted and property released' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update transaction status manually
exports.updateTransactionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const transaction = await Transaction.findByIdAndUpdate(req.params.id, { status }, { new: true });
    
    if (!transaction) return res.status(404).json({ success: false, error: 'Transaction not found' });

    if (status === 'completed' && transaction.property) {
      await Property.findByIdAndUpdate(transaction.property, { status: 'sold' });
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};