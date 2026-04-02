const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const Client = require('../models/Client');
const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');

// Routes for reports
// Base path: /api/reports

// Get dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const totalProperties = await Property.countDocuments();
    const totalClients = await Client.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    const totalInvoices = await Invoice.countDocuments();
    const pendingInvoices = await Invoice.countDocuments({ status: 'pending' });
    const totalRevenue = await Transaction.aggregate([
      { $group: { _id: null, total: { $sum: '$amountPaid' } } }
    ]);

    const stats = {
      totalProperties,
      totalClients,
      totalTransactions,
      totalInvoices,
      pendingInvoices,
      totalRevenue: totalRevenue[0]?.total || 0
    };

    res.json({ data: stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;