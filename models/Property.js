const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  propertyId: {
    type: String,
    required: true,
    unique: true 
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['house', 'apartment', 'land', 'commercial'] 
  },
  price: {
    type: Number,
    required: true,
    min: 0 
  },
  status: {
    type: String,
    enum: ['available', 'sold', 'rented', 'under_contract'],
    default: 'available'
  },
  // --- NEW FIELDS ADDED BELOW ---
  location: {
    type: String,
    required: true,
    default: 'Unknown'
  },
  size: {
    type: String,
    required: true,
    default: '—'
  },
  titleStatus: {
    type: String,
    default: 'Deed of Assignment'
  },
  // Supporting both a single URL and an Array for flexibility
  imageUrl: {
    type: String,
    default: ''
  },
  images: {
    type: [String],
    default: []
  },
  // ------------------------------
  description: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now 
  }
});

module.exports = mongoose.model('Property', propertySchema);