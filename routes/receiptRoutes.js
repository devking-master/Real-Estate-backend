const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');

// Routes for receipt operations
// Base path: /api/receipts

// Create a new receipt
router.post('/', receiptController.createReceipt);

// Generate receipt from payment
router.post('/generate', receiptController.generateFromPayment);

// Get all receipts
router.get('/', receiptController.getAllReceipts);

// Get a single receipt by ID
router.get('/:id', receiptController.getReceiptById);

// Update a receipt by ID
router.put('/:id', receiptController.updateReceipt);

// Delete a receipt by ID
router.delete('/:id', receiptController.deleteReceipt);

// Add this to receiptRoutes.js
router.get('/:id/pdf', receiptController.downloadReceiptPDF);

module.exports = router;