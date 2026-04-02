const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    required: true,
    unique: true 
  },
  // CHANGED: Use ObjectId and ref so .populate() works
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    // required: true
  },
  // ADDED: These must exist for your controller to work
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  amountPaid: {
    type: Number,
    required: true,
    min: 0 
  },
  balanceRemaining: { // Added because your Frontend/PDF uses this
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash', 'credit_card', 'bank_transfer', 'check']
  },
  date: {
    type: Date,
    default: Date.now 
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true }); // Added timestamps to support .sort({ createdAt: -1 })

module.exports = mongoose.model('Receipt', receiptSchema);