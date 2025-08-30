const express = require('express');
const { body, validationResult } = require('express-validator');
const Type = require('../models/Type');
const Site = require('../models/Site');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create new type for a site or get existing one
router.post('/sites/:siteId', [
  auth,
  body('typeName').notEmpty().withMessage('Type name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { siteId } = req.params;
    const { typeName } = req.body;

    // Check if site exists and belongs to user
    const site = await Site.findOne({
      _id: siteId,
      createdBy: req.user._id
    });

    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    // Check if type already exists for this site
    let type = await Type.findOne({
      siteId,
      typeName
    });

    if (type) {
      // Type đã tồn tại, trả về thông tin type
      return res.json({
        message: 'Type already exists',
        type: {
          id: type._id,
          siteId: type.siteId,
          typeName: type.typeName,
          createdAt: type.createdAt
        }
      });
    }

    // Tạo type mới
    type = new Type({
      siteId,
      typeName,
      createdBy: req.user._id
    });

    await type.save();

    res.status(201).json({
      message: 'Type created successfully',
      type: {
        id: type._id,
        siteId: type.siteId,
        typeName: type.typeName,
        createdAt: type.createdAt
      }
    });
  } catch (error) {
    console.error('Create type error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all types for a site
router.get('/sites/:siteId', auth, async (req, res) => {
  try {
    const { siteId } = req.params;

    // Check if site exists and belongs to user
    const site = await Site.findOne({
      _id: siteId,
      createdBy: req.user._id
    });

    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    const types = await Type.find({ siteId })
      .sort({ createdAt: -1 });

    res.json({
      types: types.map(type => ({
        id: type._id,
        siteId: type.siteId,
        typeName: type.typeName,
        createdAt: type.createdAt
      }))
    });
  } catch (error) {
    console.error('Get types error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
