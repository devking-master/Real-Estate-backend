const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

// Routes for invoice operations
// Base path: /api/invoices

// Create a new invoice
router.post('/', invoiceController.createInvoice);

// Generate invoice from transaction
router.post('/generate-from-transaction', invoiceController.generateFromTransaction);

// Get all invoices
router.get('/', invoiceController.getAllInvoices);

// Get a single invoice by ID
router.get('/:id', invoiceController.getInvoiceById);

// Update an invoice by ID
router.put('/:id', invoiceController.updateInvoice);

// Pay an invoice
router.post('/:id/pay', invoiceController.payInvoice);

// Delete an invoice by ID
router.delete('/:id', invoiceController.deleteInvoice);

router.get('/:id/pdf', invoiceController.downloadInvoicePDF);

module.exports = router;