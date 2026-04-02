const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');

// Routes for property operations
// Base path: /api/products

// Create a new property
router.post('/', propertyController.createProperty);

// Get all properties
router.get('/', propertyController.getAllProperties);

// Get a single property by ID
router.get('/:id', propertyController.getPropertyById);

// Update a property by ID
router.put('/:id', propertyController.updateProperty);

// Upload image for a property
router.post('/:id/upload-image', propertyController.uploadImage);

// Update property status
router.patch('/:id/status', propertyController.updatePropertyStatus);

// Delete a property by ID
router.delete('/:id', propertyController.deleteProperty);

module.exports = router;