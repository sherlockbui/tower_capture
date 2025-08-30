# Cloudinary Setup Guide

## Overview
This application now supports both local file storage (for development) and Cloudinary cloud storage (for production) based on the `NODE_ENV` environment variable.

## Development Environment
- **Storage**: Local folder (`uploads/`)
- **Configuration**: Set `NODE_ENV=development` (default)
- **Files**: Stored directly in the `uploads/` directory

## Production Environment
- **Storage**: Cloudinary cloud storage
- **Configuration**: Set `NODE_ENV=production` and configure Cloudinary credentials
- **Files**: Uploaded to Cloudinary with optimized transformations

## Setup Steps

### 1. Create Cloudinary Account
1. Go to [Cloudinary Console](https://cloudinary.com/console)
2. Sign up for a free account
3. Note your Cloud Name, API Key, and API Secret

### 2. Environment Configuration
Create a `.env` file in the backend directory with:

```env
# Environment
NODE_ENV=production

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Other configurations...
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5000
```

### 3. Cloudinary Dashboard Settings
In your Cloudinary dashboard:
1. Go to **Settings** > **Upload**
2. Set default folder to `tower-captures` (optional)
3. Configure upload presets if needed

## How It Works

### Development Mode (`NODE_ENV=development`)
```
File Upload → Local Storage (uploads/ folder) → Return local URL
```

### Production Mode (`NODE_ENV=production`)
```
File Upload → Memory Buffer → Cloudinary → Return Cloudinary URL
```

## Benefits

### Local Storage (Development)
- ✅ Fast uploads
- ✅ No external dependencies
- ✅ Easy debugging
- ✅ No costs

### Cloudinary (Production)
- ✅ Scalable cloud storage
- ✅ Automatic image optimization
- ✅ CDN delivery
- ✅ Image transformations
- ✅ Backup and security

## File Structure
```
backend/
├── src/
│   ├── middleware/
│   │   └── upload.js          # Smart upload middleware
│   ├── config/
│   │   └── cloudinary.js      # Cloudinary configuration
│   └── routes/
│       └── captures.js        # Updated routes
├── uploads/                    # Local storage (development)
└── .env                       # Environment configuration
```

## Testing

### Test Local Storage
```bash
NODE_ENV=development yarn dev
# Upload files will be stored in uploads/ folder
```

### Test Cloudinary
```bash
NODE_ENV=production yarn dev
# Upload files will be sent to Cloudinary
```

## Troubleshooting

### Common Issues
1. **Cloudinary not configured**: Check environment variables
2. **Upload fails**: Verify Cloudinary credentials
3. **Files not showing**: Check NODE_ENV setting

### Debug Mode
Add logging to see which storage method is being used:
```javascript
console.log('Storage method:', process.env.NODE_ENV === 'production' ? 'Cloudinary' : 'Local');
```

## Security Notes
- Never commit `.env` files to version control
- Use environment variables for sensitive data
- Cloudinary API keys should be kept secure
- Consider using Cloudinary upload presets for additional security
