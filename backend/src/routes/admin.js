const express = require('express');
const { query, validationResult } = require('express-validator');
const Capture = require('../models/Capture');
const Type = require('../models/Type');
const Site = require('../models/Site');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');
const ExcelJS = require('exceljs');
const archiver = require('archiver');
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

    // Create Excel workbook với cấu trúc giống bảng mẫu
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Captures Report');
    
    // Định nghĩa columns giống bảng mẫu
    worksheet.columns = [
      { header: 'Ngày', key: 'ngay', width: 12 },
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Mã số trạm', key: 'maSoTram', width: 20 },
      { header: 'Khu vực', key: 'khuVuc', width: 15 },
      { header: 'Người chụp', key: 'nguoiChup', width: 15 },
      { header: 'Checklist', key: 'checklist', width: 12 },
      { header: 'Ghi chú', key: 'ghiChu', width: 40 },
      { header: 'Tiền', key: 'tien', width: 12 }
    ];
    
    // Style headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Helper function để detect khu vực từ mã trạm
    const getKhuVuc = (siteCode) => {
      if (siteCode.startsWith('DNI')) return 'Đồng Nai';
      if (siteCode.startsWith('HCM') || siteCode.startsWith('SGN')) return 'HCM';
      return 'Khác';
    };
    
    // Helper function để format ngày
    const formatDate = (date) => {
      const d = new Date(date);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    };
    
    // Group captures theo ngày và người chụp
    const groupedCaptures = {};
    captures.forEach(capture => {
      const dateKey = formatDate(capture.capturedAt);
      const userKey = capture.capturedBy.username;
      const groupKey = `${dateKey}_${userKey}`;
      
      if (!groupedCaptures[groupKey]) {
        groupedCaptures[groupKey] = {
          date: capture.capturedAt,
          user: capture.capturedBy.username,
          captures: []
        };
      }
      groupedCaptures[groupKey].captures.push(capture);
    });
    
    // Add data rows với grouping logic
    let rowNumber = 1;
    Object.values(groupedCaptures).forEach((group, groupIndex) => {
      group.captures.forEach((capture, captureIndex) => {
        const isFirstInGroup = captureIndex === 0;
        
        const row = worksheet.addRow({
          ngay: isFirstInGroup ? formatDate(group.date) : '', // Chỉ hiển thị ngày ở row đầu tiên
          stt: rowNumber,
          maSoTram: capture.typeId.siteId.siteCode,
          khuVuc: getKhuVuc(capture.typeId.siteId.siteCode),
          nguoiChup: capture.capturedBy.username,
          checklist: 'Done', // Mặc định là Done
          ghiChu: capture.note || '', // Ghi chú nếu có, không có thì để trống
          tien: '' // Để trống theo yêu cầu
        });
        
        // Style cho group rows
        if (groupIndex % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0F8FF' } // Light blue for even groups
          };
        } else {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF5F5F5' } // Light gray for odd groups
          };
        }
        
        rowNumber++;
      });
    });
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = Math.max(column.width, 12);
    });
    
    // Set response headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=captures_${date}.xlsx`);
    
    // Write Excel file directly to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download all images by date
router.get('/download-images', [
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

    // Ensure temp directory exists
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create ZIP archive
    const zipPath = path.join(tempDir, `images_${date}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      // Send ZIP file
      res.download(zipPath, `captures_${date}.zip`, (err) => {
        // Clean up temporary file
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
      });
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(output);

    // Group captures by site
    const siteGroups = {};
    captures.forEach(capture => {
      const siteCode = capture.typeId.siteId.siteCode;
      if (!siteGroups[siteCode]) {
        siteGroups[siteCode] = [];
      }
      siteGroups[siteCode].push(capture);
    });

    // Add images to ZIP with folder structure
    Object.entries(siteGroups).forEach(([siteCode, siteCaptures]) => {
      siteCaptures.forEach(capture => {
        capture.images.forEach((imagePath, index) => {
          // Remove leading slash if present and construct full path
          const cleanImagePath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
          const fullImagePath = path.join(__dirname, '../../', cleanImagePath);
          
          console.log('Processing image:', {
            originalPath: imagePath,
            cleanPath: cleanImagePath,
            fullPath: fullImagePath,
            exists: fs.existsSync(fullImagePath)
          });
          
          if (fs.existsSync(fullImagePath)) {
            const fileName = `${capture.typeId.typeName}_${capture._id}_${index}${path.extname(imagePath)}`;
            const zipPath = `${siteCode}/${fileName}`;
            archive.file(fullImagePath, { name: zipPath });
            console.log('Added to ZIP:', zipPath);
          } else {
            console.log('Image not found:', fullImagePath);
          }
        });
      });
    });

    archive.finalize();

  } catch (error) {
    console.error('Download images error:', error);
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

// Get user statistics by date
router.get('/user-stats', [
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

    // Get captures grouped by user for the date
    const userStats = await Capture.aggregate([
      {
        $match: {
          capturedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'capturedBy',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $group: {
          _id: '$capturedBy',
          username: { $first: '$user.username' },
          role: { $first: '$user.role' },
          captureCount: { $sum: 1 },
          siteCount: { $addToSet: '$typeId' },
          imageCount: { $sum: { $size: '$images' } }
        }
      },
      {
        $lookup: {
          from: 'types',
          localField: 'siteCount',
          foreignField: '_id',
          as: 'typeDetails'
        }
      },
      {
        $addFields: {
          uniqueSites: {
            $size: {
              $setUnion: '$typeDetails.siteId'
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          username: 1,
          role: 1,
          captureCount: 1,
          uniqueSites: 1,
          imageCount: 1
        }
      },
      {
        $sort: { captureCount: -1, uniqueSites: -1 }
      }
    ]);

    res.json({
      userStats,
      date,
      totalCaptures: userStats.reduce((sum, user) => sum + user.captureCount, 0),
      totalImages: userStats.reduce((sum, user) => sum + user.imageCount, 0)
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

