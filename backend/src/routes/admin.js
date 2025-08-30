const express = require('express');
const { query, validationResult } = require('express-validator');
const Capture = require('../models/Capture');
const Type = require('../models/Type');
const Site = require('../models/Site');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');
const archiver = require('archiver');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Export data by date
router.get('/export', [
  adminAuth,
  query('date').notEmpty().withMessage('Date parameter is required (YYYY-MM-DD)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date } = req.query;
    
    // Parse date and create date range
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Get all captures for the date
    const captures = await Capture.find({
      capturedAt: { $gte: startDate, $lte: endDate }
    }).populate([
      {
        path: 'typeId',
        populate: {
          path: 'siteId',
          select: 'siteCode'
        }
      },
      {
        path: 'capturedBy',
        select: 'username'
      }
    ]);

    if (captures.length === 0) {
      return res.status(404).json({ message: 'No captures found for this date' });
    }

    // Create CSV data
    const csvData = captures.map(capture => ({
      'Capture ID': capture._id.toString(),
      'Site Code': capture.typeId.siteId.siteCode,
      'Type Name': capture.typeId.typeName,
      'Images Count': capture.images.length,
      'Captured By': capture.capturedBy.username,
      'Captured At': capture.capturedAt.toISOString(),
      'Image URLs': capture.images.join('; ')
    }));

    // Create CSV file
    const csvPath = path.join(__dirname, '../../temp', `captures_${date}.csv`);
    const csvWriter = createCsvWriter({
      path: csvPath,
      header: Object.keys(csvData[0]).map(key => ({ id: key, title: key }))
    });

    await csvWriter.writeRecords(csvData);

    // Create ZIP archive
    const zipPath = path.join(__dirname, '../../temp', `export_${date}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      // Send ZIP file
      res.download(zipPath, `export_${date}.zip`, (err) => {
        // Clean up temporary files
        if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath);
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
      });
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(output);

    // Add CSV to ZIP
    archive.file(csvPath, { name: `captures_${date}.csv` });

    // Add images to ZIP
    captures.forEach(capture => {
      capture.images.forEach((imagePath, index) => {
        const fullImagePath = path.join(__dirname, '../..', imagePath);
        if (fs.existsSync(fullImagePath)) {
          const fileName = `${capture.typeId.siteId.siteCode}_${capture.typeId.typeName}_${capture._id}_${index}${path.extname(imagePath)}`;
          archive.file(fullImagePath, { name: `images/${fileName}` });
        }
      });
    });

    archive.finalize();

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cleanup old data
router.delete('/cleanup', [
  adminAuth,
  query('before').notEmpty().withMessage('Before date parameter is required (YYYY-MM-DD)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { before } = req.query;
    const cutoffDate = new Date(before);
    cutoffDate.setHours(23, 59, 59, 999);

    // Find captures to delete
    const capturesToDelete = await Capture.find({
      capturedAt: { $lt: cutoffDate }
    });

    if (capturesToDelete.length === 0) {
      return res.json({ message: 'No old data found to delete' });
    }

    // Delete image files
    capturesToDelete.forEach(capture => {
      capture.images.forEach(imagePath => {
        const fullImagePath = path.join(__dirname, '../..', imagePath);
        if (fs.existsSync(fullImagePath)) {
          fs.unlinkSync(fullImagePath);
        }
      });
    });

    // Delete captures from database
    const deleteResult = await Capture.deleteMany({
      capturedAt: { $lt: cutoffDate }
    });

    res.json({
      message: `Deleted ${deleteResult.deletedCount} captures and associated images`,
      deletedCount: deleteResult.deletedCount
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get system statistics
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSites = await Site.countDocuments();
    const totalTypes = await Type.countDocuments();
    const totalCaptures = await Capture.countDocuments();
    const totalImages = await Capture.aggregate([
      { $group: { _id: null, total: { $sum: { $size: '$images' } } } }
    ]);

    res.json({
      stats: {
        totalUsers,
        totalSites,
        totalTypes,
        totalCaptures,
        totalImages: totalImages[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
