const express = require('express');
const { body, validationResult } = require('express-validator');
const Site = require('../models/Site');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create new site or get existing one
router.post('/', [
  auth,
  body('siteCode').notEmpty().withMessage('Site code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { siteCode } = req.body;
    
    // Check if site already exists for this user
    let site = await Site.findOne({
      siteCode,
      createdBy: req.user._id
    });

    if (site) {
      // Site đã tồn tại, trả về thông tin site
      return res.json({
        message: 'Site already exists',
        site: {
          id: site._id,
          siteCode: site.siteCode,
          createdAt: site.createdAt
        }
      });
    }

    // Tạo site mới
    site = new Site({
      siteCode,
      createdBy: req.user._id
    });

    await site.save();

    res.status(201).json({
      message: 'Site created successfully',
      site: {
        id: site._id,
        siteCode: site.siteCode,
        createdAt: site.createdAt
      }
    });
  } catch (error) {
    console.error('Create site error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all sites for current user
router.get('/', auth, async (req, res) => {
  try {
    const sites = await Site.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      sites: sites.map(site => ({
        id: site._id,
        siteCode: site.siteCode,
        createdAt: site.createdAt
      }))
    });
  } catch (error) {
    console.error('Get sites error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
