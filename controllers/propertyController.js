const Property = require('../models/Property');
const multer = require('multer');
const fs = require('fs');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' }); // Files will be stored in 'uploads' directory

// Controller for handling property-related operations
// Includes CRUD operations and image upload for properties

// Create a new property
exports.createProperty = async (req, res) => {
  try {
    const property = new Property(req.body);
    await property.save();
    res.status(201).json({ data: property });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all properties
exports.getAllProperties = async (req, res) => {
  try {
    const properties = await Property.find();
    res.json({ data: properties });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single property by ID
exports.getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });
    res.json({ data: property });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a property by ID
exports.updateProperty = async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!property) return res.status(404).json({ error: 'Property not found' });
    res.json({ data: property });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a property by ID
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });
    res.json({ data: { message: 'Property deleted' } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update property status
exports.updatePropertyStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const property = await Property.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!property) return res.status(404).json({ error: 'Property not found' });
    res.json({ data: property });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Upload image for a property
exports.uploadImage = [
  upload.single('image'), // Middleware to handle single file upload with field name 'image'
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
      }

      const property = await Property.findById(req.params.id);
      if (!property) {
        // Cleanup file if property not found
        fs.unlink(req.file.path, () => {});
        return res.status(404).json({ error: 'Property not found' });
      }

      // Convert to Base64
      const fileData = fs.readFileSync(req.file.path);
      const base64Data = fileData.toString('base64');
      const mimeType = req.file.mimetype;
      const base64Url = `data:${mimeType};base64,${base64Data}`;

      // Update the property's image URL with the Base64 data
      property.imageUrl = base64Url;
      await property.save();

      // Cleanup: delete the temporary file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });

      res.json({ data: property });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
];