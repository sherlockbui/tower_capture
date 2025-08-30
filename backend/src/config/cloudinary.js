const cloudinary = require('cloudinary').v2;

// Cloudinary configuration
const configureCloudinary = () => {
  // Only configure if we're in production mode
  if (process.env.NODE_ENV === 'production') {
    if (process.env.CLOUDINARY_CLOUD_NAME && 
        process.env.CLOUDINARY_API_KEY && 
        process.env.CLOUDINARY_API_SECRET) {
      
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });
      
      console.log('✅ Cloudinary configured successfully for production');
      return true;
    } else {
      console.log('⚠️  Production mode detected but Cloudinary not configured - using local storage');
      return false;
    }
  } else {
    // Development mode - no need to configure Cloudinary
    return false;
  }
};

// Get upload configuration based on environment
const getUploadConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                 process.env.CLOUDINARY_API_KEY && 
                                 process.env.CLOUDINARY_API_SECRET;
  
  if (isProduction && isCloudinaryConfigured) {
    return {
      storage: 'cloudinary',
      folder: 'tower-captures',
      transformations: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    };
  } else {
    return {
      storage: 'local',
      directory: process.env.UPLOAD_DIR || 'uploads'
    };
  }
};

module.exports = {
  configureCloudinary,
  getUploadConfig,
  cloudinary
};
