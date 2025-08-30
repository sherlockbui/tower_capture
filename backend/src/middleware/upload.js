const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { configureCloudinary, cloudinary } = require('../config/cloudinary');

// Configure Cloudinary
configureCloudinary();

// Ensure uploads directory exists for local storage
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Local storage configuration
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Memory storage for Cloudinary (files will be stored in memory temporarily)
const memoryStorage = multer.memoryStorage();

// Choose storage based on environment
const storage = process.env.NODE_ENV === 'production' && 
                process.env.CLOUDINARY_CLOUD_NAME && 
                process.env.CLOUDINARY_API_KEY && 
                process.env.CLOUDINARY_API_SECRET
                ? memoryStorage 
                : localStorage;

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 10 // Maximum 10 files
  }
});

// Middleware to handle file uploads to Cloudinary after multer processing
const handleCloudinaryUpload = async (req, res, next) => {
  // If not in production or Cloudinary not configured, skip
  if (process.env.NODE_ENV !== 'production' || 
      !process.env.CLOUDINARY_CLOUD_NAME || 
      !process.env.CLOUDINARY_API_KEY || 
      !process.env.CLOUDINARY_API_SECRET) {
    return next();
  }

  // If no files uploaded, skip
  if (!req.files || req.files.length === 0) {
    return next();
  }

  try {
    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        // Convert buffer to base64 for Cloudinary
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        
        cloudinary.uploader.upload(dataURI, {
          folder: 'tower-captures',
          resource_type: 'auto',
          transformation: [
            { quality: 'auto:good' }, // Optimize quality
            { fetch_format: 'auto' }  // Auto format
          ]
        }, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              filename: file.originalname,
              cloudinaryUrl: result.secure_url,
              cloudinaryId: result.public_id,
              mimetype: file.mimetype,
              size: file.size
            });
          }
        });
      });
    });

    const cloudinaryResults = await Promise.all(uploadPromises);
    
    // Replace req.files with Cloudinary results
    req.files = cloudinaryResults;
    
    next();
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return res.status(500).json({ 
      message: 'Error uploading files to Cloudinary',
      error: error.message 
    });
  }
};

module.exports = { upload, handleCloudinaryUpload };
