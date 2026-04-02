const mongoose = require('mongoose');

// Settings model schema
// Represents system settings
const settingsSchema = new mongoose.Schema({
  companyName: {
    type: String,
    default: 'Real Estate Company'
  },
  companyAddress: {
    type: String,
    default: ''
  },
  companyPhone: {
    type: String,
    default: ''
  },
  companyEmail: {
    type: String,
    default: ''
  },
  currency: {
    type: String,
    default: 'USD'
  },
  taxRate: {
    type: Number,
    default: 0
  },
  // Additional settings can be added here
  date: {
    type: Date,
    default: Date.now
  }
});

// Create and export the Settings model
module.exports = mongoose.model('Settings', settingsSchema);