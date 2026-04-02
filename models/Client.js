const mongoose = require('mongoose');

// Client model schema
// Represents a client in the real estate system
const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true // Ensure unique emails
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now // Default to current date if not provided
  },
  // Additional fields can be added here as needed
  notes: {
    type: String,
    default: ''
  }
});

// Create and export the Client model
module.exports = mongoose.model('Client', clientSchema);