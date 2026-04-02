const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },

  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },

  // ✅ ADD THIS
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },

  // ✅ ADD THIS
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },

  clientName: {
    type: String
  },

  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },

 amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },

  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending'
  },
  date: { type: Date, default: Date.now },
  dueDate: { type: Date }
}, { timestamps: true }); // Adding timestamps helps with the .sort() in your controller

module.exports = mongoose.model('Invoice', invoiceSchema);