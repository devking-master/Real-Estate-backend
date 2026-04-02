const Transaction = require('../models/Transaction');
const Property = require('../models/Property'); 
const Receipt = require('../models/Receipt'); // ADDED THIS
const Invoice = require('../models/Invoice'); // ADDED THIS

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

    // 1. Update the Property status
    if (req.body.property) {
      const propertyStatus = transaction.status === 'completed' ? 'sold' : 'under_contract';
      await Property.findByIdAndUpdate(req.body.property, { status: propertyStatus });
    }

    // 2. Automatically Create Receipt if payment is made
    if (Number(transaction.paidAmount) > 0) {
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
          paymentMethod: 'bank_transfer',
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

    // Find original to see the difference in payment
    const oldTransaction = await Transaction.findById(req.params.id);
    if (!oldTransaction) return res.status(404).json({ success: false, error: 'Transaction not found' });

    // AUTOMATION: Status logic
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

    // AUTOMATION: Create Receipt if the paid amount was increased
    const newPaymentMade = Number(paidAmount || 0) - Number(oldTransaction.paidAmount || 0);
    
    if (newPaymentMade > 0) {
      const uniqueSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      
      // Try to find a linked invoice if it exists
      const linkedInvoice = await Invoice.findOne({ transactionId: transaction._id });

      const receipt = new Receipt({
        receiptNumber: `REC-${Date.now()}-${uniqueSuffix}`,
        transactionId: transaction._id,
        invoiceId: linkedInvoice ? linkedInvoice._id : undefined,
        clientId: transaction.client._id || transaction.client,
        propertyId: transaction.property._id || transaction.property,
        amountPaid: newPaymentMade, // Only receipt the NEW money paid
        balanceRemaining: Math.max(0, transaction.totalAmount - transaction.paidAmount),
        paymentMethod: 'bank_transfer',
        date: new Date()
      });
      await receipt.save();
    }

    // Update property status
    if (transaction.status === 'completed' && transaction.property) {
      await Property.findByIdAndUpdate(transaction.property, { status: 'sold' });
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
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