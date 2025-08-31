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
const cloudinary = require('cloudinary').v2; // Added for Cloudinary cleanup
const axios = require('axios'); // Added for Cloudinary image download

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
          checklist: '', // Mặc định là Done
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
    let processedImages = 0;
    const totalImages = captures.reduce((sum, capture) => sum + capture.images.length, 0);
    
    console.log(`📊 Starting to process ${totalImages} images...`);
    
    // Set proper headers BEFORE creating archive
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=captures_${date}.zip`);
    
    // Create archive and pipe to response
    const archive = archiver('zip', { 
      zlib: { level: 9 },
      store: false // Enable compression
    });
    
    // Pipe archive to response
    archive.pipe(res);
    
    // Handle archive events
    archive.on('error', (err) => {
      console.error('❌ Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error creating ZIP archive' });
      }
    });
    
    archive.on('end', () => {
      console.log(`🎉 Archive completed successfully with ${processedImages} images`);
    });
    
    // Process images sequentially to avoid race conditions
    const processImages = async () => {
      try {
        for (const [siteCode, siteCaptures] of Object.entries(siteGroups)) {
          for (const capture of siteCaptures) {
            for (let index = 0; index < capture.images.length; index++) {
              const imagePath = capture.images[index];
              
              if (imagePath.includes('cloudinary.com')) {
                // Production: Handle Cloudinary images
                try {
                  console.log(`🌐 Processing Cloudinary image ${processedImages + 1}/${totalImages}:`, imagePath);
                  
                  // Download image from Cloudinary with timeout
                  const response = await axios.get(imagePath, { 
                    responseType: 'stream',
                    timeout: 30000, // 30 seconds timeout
                    maxContentLength: 10 * 1024 * 1024 // 10MB max
                  });
                  
                  const fileName = `${capture.typeId.typeName}_${capture._id}_${index}.jpg`;
                  const zipPath = `${siteCode}/${fileName}`;
                  
                  // Add to archive
                  archive.append(response.data, { name: zipPath });
                  processedImages++;
                  console.log(`✅ Added Cloudinary image to ZIP: ${zipPath} (${processedImages}/${totalImages})`);
                  
                } catch (error) {
                  console.error(`❌ Error downloading Cloudinary image:`, imagePath, error.message);
                  // Continue with next image
                }
              } else if (imagePath.startsWith('/uploads/')) {
                // Development: Handle local files
                try {
                  const cleanImagePath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
                  const fullImagePath = path.join(__dirname, '../../', cleanImagePath);
                  
                  console.log(`💻 Processing local image ${processedImages + 1}/${totalImages}:`, {
                    originalPath: imagePath,
                    cleanPath: cleanImagePath,
                    fullPath: fullImagePath,
                    exists: fs.existsSync(fullImagePath)
                  });
                  
                  if (fs.existsSync(fullImagePath)) {
                    const fileName = `${capture.typeId.typeName}_${capture._id}_${index}${path.extname(imagePath)}`;
                    const zipPath = `${siteCode}/${fileName}`;
                    archive.file(fullImagePath, { name: zipPath });
                    processedImages++;
                    console.log(`✅ Added local image to ZIP: ${zipPath} (${processedImages}/${totalImages})`);
                  } else {
                    console.log(`⚠️ Local image not found: ${fullImagePath}`);
                  }
                } catch (error) {
                  console.error(`❌ Error processing local image:`, imagePath, error.message);
                }
              } else {
                console.log(`⚠️ Skipping unsupported image type: ${imagePath}`);
              }
            }
          }
        }
        
        console.log(`📦 Processed ${processedImages}/${totalImages} images. Finalizing archive...`);
        
        // Finalize archive after all images processed
        archive.finalize();
        
      } catch (error) {
        console.error('❌ Error processing images:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error processing images' });
        }
      }
    };
    
    // Start processing images
    processImages();

  } catch (error) {
    console.error('Download images error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper functions for cleanup
const deleteLocalFiles = (captures) => {
  let deletedCount = 0;
  let errorCount = 0;

  captures.forEach(capture => {
    capture.images.forEach(imagePath => {
      try {
        // Only handle local uploads
        if (imagePath.startsWith('/uploads/')) {
          const cleanImagePath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
          const fullImagePath = path.join(__dirname, '../../', cleanImagePath);
          
          if (fs.existsSync(fullImagePath)) {
            fs.unlinkSync(fullImagePath);
            console.log('🗑️ Deleted local file:', fullImagePath);
            deletedCount++;
          } else {
            console.log('⚠️ Local file not found:', fullImagePath);
          }
        }
      } catch (error) {
        console.error('❌ Error deleting local file:', imagePath, error);
        errorCount++;
      }
    });
  });

  return { deletedCount, errorCount };
};

const deleteCloudinaryImages = async (captures) => {
  let deletedCount = 0;
  let errorCount = 0;

  for (const capture of captures) {
    for (const imageUrl of capture.images) {
      try {
        // Only handle Cloudinary URLs
        if (imageUrl.includes('cloudinary.com')) {
          // Extract public ID from Cloudinary URL
          // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
          const urlParts = imageUrl.split('/');
          const filename = urlParts[urlParts.length - 1];
          const folder = urlParts[urlParts.length - 2];
          
          // Remove file extension and version prefix
          const publicId = filename.split('.')[0];
          const fullPublicId = `${folder}/${publicId}`;
          
          console.log('🗑️ Deleting Cloudinary image:', { url: imageUrl, publicId: fullPublicId });
          
          await cloudinary.uploader.destroy(fullPublicId);
          console.log('✅ Deleted Cloudinary image:', fullPublicId);
          deletedCount++;
        }
      } catch (error) {
        console.error('❌ Error deleting Cloudinary image:', imageUrl, error);
        errorCount++;
      }
    }
  }

  return { deletedCount, errorCount };
};

// NEW: Hybrid cleanup function that handles both local and Cloudinary images
const hybridCleanup = async (captures) => {
  let localDeleted = 0;
  let cloudinaryDeleted = 0;
  let localErrors = 0;
  let cloudinaryErrors = 0;

  console.log('🔄 Starting hybrid cleanup...');
  console.log(`📊 Total captures to process: ${captures.length}`);

  // Process local images first
  console.log('💻 Processing local images...');
  const localResult = deleteLocalFiles(captures);
  localDeleted = localResult.deletedCount;
  localErrors = localResult.errorCount;

  // Process Cloudinary images
  console.log('🌐 Processing Cloudinary images...');
  const cloudinaryResult = await deleteCloudinaryImages(captures);
  cloudinaryDeleted = cloudinaryResult.deletedCount;
  cloudinaryErrors = cloudinaryResult.errorCount;

  console.log('✅ Hybrid cleanup completed:');
  console.log(`   - Local images deleted: ${localDeleted}`);
  console.log(`   - Cloudinary images deleted: ${cloudinaryDeleted}`);
  console.log(`   - Local errors: ${localErrors}`);
  console.log(`   - Cloudinary errors: ${cloudinaryErrors}`);

  return {
    localDeleted,
    cloudinaryDeleted,
    localErrors,
    cloudinaryErrors,
    totalDeleted: localDeleted + cloudinaryDeleted,
    totalErrors: localErrors + cloudinaryErrors
  };
};

// Cleanup old data
router.delete('/cleanup', [
  adminAuth,
  query('before').notEmpty().withMessage('Before date parameter is required (YYYY-MM-DD)'),
  query('confirm').notEmpty().withMessage('Confirmation required. Set confirm=true to proceed with deletion')
], async (req, res) => {
  try {
    const { before, confirm } = req.query;
    
    // Safety check
    if (confirm !== 'true') {
      return res.status(400).json({ 
        message: 'Confirmation required. Set confirm=true to proceed with deletion',
        warning: 'This action will permanently delete data and cannot be undone!'
      });
    }
    
    const cutoffDate = new Date(before);
    cutoffDate.setHours(23, 59, 59, 999);

    console.log(`🧹 Starting cleanup for data before: ${cutoffDate.toISOString()}`);

    const capturesToDelete = await Capture.find({
      capturedAt: { $lt: cutoffDate }
    });

    if (capturesToDelete.length === 0) {
      return res.json({ message: 'No old data found to delete' });
    }

    console.log(`📊 Found ${capturesToDelete.length} captures to delete`);

    // Use hybrid cleanup for all environments
    console.log('🔄 Using hybrid cleanup (handles both local and Cloudinary images)');
    const imageCleanupResult = await hybridCleanup(capturesToDelete);

    const deleteResult = await Capture.deleteMany({
      capturedAt: { $lt: cutoffDate }
    });

    console.log(`🗑️ Cleanup completed:`);
    console.log(`   - Database records: ${deleteResult.deletedCount}`);
    console.log(`   - Local images deleted: ${imageCleanupResult.localDeleted}`);
    console.log(`   - Cloudinary images deleted: ${imageCleanupResult.cloudinaryDeleted}`);
    console.log(`   - Total errors: ${imageCleanupResult.totalErrors}`);

    res.json({
      message: `Cleanup completed successfully`,
      summary: {
        databaseRecords: deleteResult.deletedCount,
        imagesDeleted: {
          local: imageCleanupResult.localDeleted,
          cloudinary: imageCleanupResult.cloudinaryDeleted,
          total: imageCleanupResult.totalDeleted
        },
        errors: {
          local: imageCleanupResult.localErrors,
          cloudinary: imageCleanupResult.cloudinaryErrors,
          total: imageCleanupResult.totalErrors
        },
        environment: 'hybrid (local + cloudinary)'
      }
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

