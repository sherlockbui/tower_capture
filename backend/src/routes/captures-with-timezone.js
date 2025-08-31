const express = require('express');
const { body, validationResult } = require('express-validator');
const Capture = require('../models/Capture');
const Type = require('../models/Type');
const Site = require('../models/Site');
const { auth } = require('../middleware/auth');
const { upload, handleCloudinaryUpload } = require('../middleware/upload');
const { 
  getDayRangeVietnam, 
  toUTC, 
  toVietnamTimeString,
  getCurrentVietnamTime 
} = require('../utils/timezone');

const router = express.Router();

// Upload images for a type
router.post('/types/:typeId/captures', [
  auth,
  upload.array('images', 15),
  handleCloudinaryUpload,
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

    // Create image URLs based on environment
    const imageUrls = req.files.map(file => {
      if (process.env.NODE_ENV === 'production' && file.cloudinaryUrl) {
        // Production: use Cloudinary URLs
        return file.cloudinaryUrl;
      } else {
        // Development: use local uploads URLs
        return `/uploads/${file.filename}`;
      }
    });

    // Use current Vietnam time for capturedAt
    const vietnamTime = getCurrentVietnamTime();

    const capture = new Capture({
      typeId,
      images: imageUrls,
      capturedBy: req.user._id,
      capturedAt: vietnamTime // This will be stored as UTC in MongoDB
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
        capturedAt: capture.capturedAt, // Automatically converted to Vietnam timezone
        capturedAtFormatted: toVietnamTimeString(capture.capturedAt, 'DD/MM/YYYY HH:mm')
      }
    });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get captures by date (now with Vietnam timezone support)
router.get('/', auth, async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required (YYYY-MM-DD)' });
    }

    // Parse date and create date range in Vietnam timezone
    const { start, end } = getDayRangeVietnam(date);
    
    // Convert to UTC for MongoDB query (since data is stored in UTC)
    const utcStart = toUTC(start);
    const utcEnd = toUTC(end);

    let query = { capturedAt: { $gte: utcStart, $lte: utcEnd } };

    // By default, all users (including admin) only see their own captures
    // This ensures data privacy and prevents admin from accidentally seeing other users' data
    query.capturedBy = req.user._id;

    // TODO: If admin needs to see all users' data, add a special query parameter
    // Example: ?date=2024-01-01&showAll=true (admin only)
    // if (req.user.role === 'admin' && req.query.showAll === 'true') {
    //   delete query.capturedBy;
    // }

    const captures = await Capture.find(query)
      .populate({
        path: 'typeId',
        populate: {
          path: 'siteId',
          select: 'siteCode'
        }
      })
      .populate('capturedBy', 'username')
      .sort({ capturedAt: -1 })
      .lean(); // Use lean() for better performance and automatic timezone conversion

    res.json({
      captures: captures.map(capture => ({
        id: capture._id,
        typeId: capture.typeId._id,
        typeName: capture.typeId.typeName,
        note: capture.typeId.note || '',
        siteCode: capture.typeId.siteId.siteCode,
        images: capture.images,
        capturedBy: capture.capturedBy.username,
        capturedAt: capture.capturedAt, // Now in Vietnam timezone
        capturedAtFormatted: toVietnamTimeString(capture.capturedAt, 'DD/MM/YYYY HH:mm'),
        createdAt: capture.createdAt, // Now in Vietnam timezone
        updatedAt: capture.updatedAt // Now in Vietnam timezone
      })),
      dateRange: {
        vietnam: {
          start: toVietnamTimeString(start),
          end: toVietnamTimeString(end)
        },
        utc: {
          start: utcStart,
          end: utcEnd
        }
      }
    });
  } catch (error) {
    console.error('Get captures error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin route to get all captures by date (admin only)
router.get('/admin/all', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required (YYYY-MM-DD)' });
    }

    // Parse date and create date range in Vietnam timezone
    const { start, end } = getDayRangeVietnam(date);
    
    // Convert to UTC for MongoDB query (since data is stored in UTC)
    const utcStart = toUTC(start);
    const utcEnd = toUTC(end);

    const query = { capturedAt: { $gte: utcStart, $lte: utcEnd } };

    const captures = await Capture.find(query)
      .populate({
        path: 'typeId',
        populate: {
          path: 'siteId',
          select: 'siteCode'
        }
      })
      .populate('capturedBy', 'username')
      .sort({ capturedAt: -1 })
      .lean();

    res.json({
      captures: captures.map(capture => ({
        id: capture._id,
        typeId: capture.typeId._id,
        typeName: capture.typeId.typeName,
        note: capture.typeId.note || '',
        siteCode: capture.typeId.siteId.siteCode,
        images: capture.images,
        capturedBy: capture.capturedBy.username,
        capturedAt: capture.capturedAt,
        capturedAtFormatted: toVietnamTimeString(capture.capturedAt, 'DD/MM/YYYY HH:mm'),
        createdAt: capture.createdAt,
        updatedAt: capture.updatedAt
      })),
      dateRange: {
        vietnam: {
          start: toVietnamTimeString(start),
          end: toVietnamTimeString(end)
        },
        utc: {
          start: utcStart,
          end: utcEnd
        }
      }
    });
  } catch (error) {
    console.error('Admin get all captures error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
