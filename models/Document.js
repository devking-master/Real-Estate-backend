const mongoose = require('mongoose');

// Document model schema
// Represents a document in the real estate system
const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['contract', 'receipt', 'invoice', 'other'] // Possible document types
  },
  fileUrl: {
    type: String,
    required: true // URL to the uploaded file
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client' // Reference to Client model
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property' // Reference to Property model
  },
  date: {
    type: Date,
    default: Date.now // Default to current date if not provided
  },
  // Additional fields can be added here as needed
  description: {
    type: String,
    default: ''
  }
});

// Create and export the Document model
module.exports = mongoose.model('Document', documentSchema);