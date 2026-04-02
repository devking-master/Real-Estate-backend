const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// Routes for settings operations
// Base path: /api/settings

// Get settings
router.get('/', settingsController.getSettings);

// Update settings
router.put('/', settingsController.updateSettings);

module.exports = router;