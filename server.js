require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// --- 1. MIDDLEWARE (Order is Critical) ---

// Configure CORS to allow local and production origins
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000', 
    'https://real-estate-frontend-three-kappa.vercel.app' // ADD THIS
  ], 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev')); 

// --- 2. FILE STORAGE (Multer) ---

const { storage } = require('./config/cloudinary');
const upload = multer({ storage: storage });

// Serve static files
app.use('/uploads', express.static('uploads'));

// --- 3. ROUTES ---

const transactionRoutes = require('./routes/transactionRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const clientRoutes = require('./routes/clientRoutes');
const documentRoutes = require('./routes/documentRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const authRoutes = require('./routes/authRoutes');

// Upload route - Uploads file to Cloudinary and returns the secure URL
app.post('/api/upload', upload.single('document'), (req, res) => {
  console.log('--- Upload Request Received ---');
  try {
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File received and uploaded to Cloudinary:', req.file.path);

    res.json({ data: { fileUrl: req.file.path } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/auth', authRoutes);

// Root route for health check
app.get('/', (req, res) => {
  res.send('Real Estate API is running...');
});

// --- 4. ERROR HANDLING ---

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// --- 5. DATABASE & SERVER START ---

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
  });