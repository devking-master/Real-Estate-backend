const mongoose = require('mongoose');

// Payment model schema
// Represents a payment in the billing system
const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  method: {
    type: String,
    required: true,
    enum: ['cash', 'credit_card', 'bank_transfer', 'check']
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  date: {
    type: Date,
    default: Date.now
  },
  // Additional fields
  notes: {
    type: String,
    default: ''
  }
});

// Create and export the Payment model
module.exports = mongoose.model('Payment', paymentSchema);