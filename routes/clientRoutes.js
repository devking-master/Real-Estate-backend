const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

// Routes for client operations
// Base path: /api/clients

// Create a new client
router.post('/', clientController.createClient);

// Get all clients
router.get('/', clientController.getAllClients);

// Get a single client by ID
router.get('/:id', clientController.getClientById);

// Update a client by ID
router.put('/:id', clientController.updateClient);

// Delete a client by ID
router.delete('/:id', clientController.deleteClient);

module.exports = router;