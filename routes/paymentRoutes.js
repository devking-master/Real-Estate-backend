const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Routes for payment operations
// Base path: /api/payments

// Create a new payment
router.post('/', paymentController.createPayment);

// Get all payments
router.get('/', paymentController.getAllPayments);

// Get a single payment by ID
router.get('/:id', paymentController.getPaymentById);

// Update a payment by ID
router.put('/:id', paymentController.updatePayment);

// Delete a payment by ID
router.delete('/:id', paymentController.deletePayment);

module.exports = router;