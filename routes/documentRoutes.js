const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');

// Routes for document operations
// Base path: /api/documents

// Create a new document
router.post('/', documentController.createDocument);

// Get all documents
router.get('/', documentController.getAllDocuments);

// Get a single document by ID
router.get('/:id', documentController.getDocumentById);

// Update a document by ID
router.put('/:id', documentController.updateDocument);

// Delete a document by ID
router.delete('/:id', documentController.deleteDocument);

module.exports = router;