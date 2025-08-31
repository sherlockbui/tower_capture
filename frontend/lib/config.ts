export const config = {
  // Backend Configuration
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://192.168.1.42:5000',
  apiUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.1.42:5000/api',
  
  // App Configuration
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Tower Capture Management',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Feature Flags
  enableDebugLogs: process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS === 'true',
  enableImagePreview: process.env.NEXT_PUBLIC_ENABLE_IMAGE_PREVIEW === 'true',
  
  // Upload Configuration
  maxFileSize: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760'),
  allowedFileTypes: process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/webp'],
  
  // UI Configuration
  defaultDateFormat: process.env.NEXT_PUBLIC_DEFAULT_DATE_FORMAT || 'YYYY-MM-DD',
  itemsPerPage: parseInt(process.env.NEXT_PUBLIC_ITEMS_PER_PAGE || '20'),
}

// Helper function to get full image URL
export const getImageUrl = (imagePath: string): string => {
  console.log('🔍 getImageUrl input:', imagePath);
  
  // If imagePath is already a full URL (starts with http/https), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    console.log('✅ Full URL detected, returning as is:', imagePath);
    return imagePath;
  }
  
  // If imagePath is a relative path (starts with /), prepend backend URL
  if (imagePath.startsWith('/')) {
    const fullUrl = `${config.backendUrl}${imagePath}`;
    console.log('🔗 Relative path, prepending backend URL:', fullUrl);
    return fullUrl;
  }
  
  // If imagePath doesn't start with /, assume it's relative and add /
  const fullUrl = `${config.backendUrl}/${imagePath}`;
  console.log('🔗 No leading slash, adding / and prepending backend URL:', fullUrl);
  return fullUrl;
};
