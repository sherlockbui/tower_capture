export const config = {
  // Backend Configuration
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000',
  apiUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api',
  
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
