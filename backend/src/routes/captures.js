const express = require('express');
const { body, validationResult } = require('express-validator');
const Capture = require('../models/Capture');
const Type = require('../models/Type');
const Site = require('../models/Site');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Upload images for a type
router.post('/types/:typeId/captures', [
  auth,
  upload.array('images', 10),
  body('typeId').notEmpty().withMessage('Type ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { typeId } = req.params;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    // Check if type exists
    const type = await Type.findById(typeId);
    if (!type) {
      return res.status(404).json({ message: 'Type not found' });
    }

    // Check if site exists and belongs to user
    const site = await Site.findById(type.siteId);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    // Check if user has access to this site
    if (site.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this site' });
    }

    // Create image URLs
    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);

    const capture = new Capture({
      typeId,
      images: imageUrls,
      capturedBy: req.user._id
    });

    await capture.save();

    res.status(201).json({
      message: 'Images uploaded successfully',
      capture: {
        id: capture._id,
        typeId: capture.typeId,
        typeName: type.typeName,
        siteCode: site.siteCode,
        images: capture.images,
        capturedBy: req.user.username,
        capturedAt: capture.capturedAt
      }
    });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get captures by date
router.get('/', auth, async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required (YYYY-MM-DD)' });
    }

    // Parse date and create date range
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    let query = { capturedAt: { $gte: startDate, $lte: endDate } };

    // If user is not admin, only show their captures
    if (req.user.role !== 'admin') {
      query.capturedBy = req.user._id;
    }

    const captures = await Capture.find(query)
      .populate({
        path: 'typeId',
        populate: {
          path: 'siteId',
          select: 'siteCode'
        }
      })
      .populate('capturedBy', 'username')
      .sort({ capturedAt: -1 });

    res.json({
      captures: captures.map(capture => ({
        id: capture._id,
        typeId: capture.typeId._id,
        typeName: capture.typeId.typeName,
        siteCode: capture.typeId.siteId.siteCode,
        images: capture.images,
        capturedBy: capture.capturedBy.username,
        capturedAt: capture.capturedAt
      }))
    });
  } catch (error) {
    console.error('Get captures error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
