const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Routes for transaction operations
// Base path: /api/transactions

// Create a new transaction
router.post('/', transactionController.createTransaction);

// Get all transactions
router.get('/', transactionController.getAllTransactions);

// Get a single transaction by ID
router.get('/:id', transactionController.getTransactionById);

// Update a transaction by ID
router.put('/:id', transactionController.updateTransaction);

// Update transaction status
router.patch('/:id/status', transactionController.updateTransactionStatus);

// Delete a transaction by ID
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;