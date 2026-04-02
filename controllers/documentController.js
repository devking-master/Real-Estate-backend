const Document = require('../models/Document');

// Controller for handling document-related operations
// Includes CRUD operations for documents

// Create a new document
exports.createDocument = async (req, res) => {
  try {
    const document = new Document(req.body);
    await document.save();
    res.json({ data: document });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all documents
exports.getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.find().populate('clientId').populate('propertyId');
    res.json({ data: documents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single document by ID
exports.getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id).populate('clientId').populate('propertyId');
    if (!document) return res.status(404).json({ error: 'Document not found' });
    res.json({ data: document });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a document by ID
exports.updateDocument = async (req, res) => {
  try {
    const document = await Document.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!document) return res.status(404).json({ error: 'Document not found' });
    res.json({ data: document });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a document by ID
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findByIdAndDelete(req.params.id);
    if (!document) return res.status(404).json({ error: 'Document not found' });
    res.json({ data: { message: 'Document deleted' } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};