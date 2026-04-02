const Payment = require('../models/Payment');

// Controller for handling payment-related operations
// Includes CRUD operations for payments

// Create a new payment
exports.createPayment = async (req, res) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();
    res.json({ data: payment });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all payments
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().populate('invoiceId').populate('clientId');
    res.json({ data: payments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single payment by ID
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('invoiceId').populate('clientId');
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json({ data: payment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a payment by ID
exports.updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json({ data: payment });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a payment by ID
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json({ data: { message: 'Payment deleted' } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};