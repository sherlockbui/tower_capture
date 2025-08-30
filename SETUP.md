# Tower Capture Management App - Setup Guide

This is a fullstack application with a Next.js frontend and Node.js/Express backend, both using yarn as the package manager.

## Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud instance)
- Yarn package manager

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
yarn install

# Install all frontend and backend dependencies
yarn install:all
```

### 2. Environment Setup

#### Backend Environment
Create `backend/.env` file based on `backend/env.example`:

```bash
cd backend
cp env.example .env
```

Edit `.env` with your MongoDB connection string and other settings:

```env
MONGODB_URI=mongodb://localhost:27017/tower_capture
JWT_SECRET=your_secure_jwt_secret_here
PORT=5000
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

#### Frontend Environment (Optional)
Create `frontend/.env.local` if you need to change the API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Database Setup

#### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Create database: `tower_capture`

#### Option B: MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create cluster and get connection string
3. Update `MONGODB_URI` in backend `.env`

### 4. Initialize Database

```bash
# Create admin user and temp directories
cd backend
node src/init-db.js
```

### 5. Start Development Servers

#### Option A: Run Both Together
```bash
# From root directory
yarn dev
```

#### Option B: Run Separately
```bash
# Terminal 1 - Backend
cd backend
yarn dev

# Terminal 2 - Frontend  
cd frontend
yarn dev
```

## Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## Default Admin Credentials

- **Username**: admin
- **Password**: admin123

## Project Structure

```
capture_stations/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth & upload middleware
│   │   ├── index.js        # Main server file
│   │   └── init-db.js      # Database initialization
│   ├── uploads/            # Image uploads (auto-created)
│   ├── temp/               # Temporary files (auto-created)
│   ├── package.json
│   └── env.example
├── frontend/                # Next.js web app
│   ├── app/                # App router pages
│   ├── components/         # React components
│   ├── lib/                # API services
│   ├── types/              # TypeScript types
│   └── package.json
├── package.json            # Root package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Sites
- `POST /api/sites` - Create new site
- `GET /api/sites` - Get user's sites

### Types
- `POST /api/types/:siteId` - Create type for site
- `GET /api/types/:siteId` - Get types for site

### Captures
- `POST /api/captures/:typeId` - Upload images
- `GET /api/captures?date=YYYY-MM-DD` - Get captures by date

### Admin (Admin role required)
- `GET /api/admin/export?date=YYYY-MM-DD` - Export data by date
- `DELETE /api/admin/cleanup?before=YYYY-MM-DD` - Cleanup old data
- `GET /api/admin/stats` - System statistics

## Features

### User Features
- ✅ Manual station (site) input
- ✅ Multiple types per station
- ✅ Multiple images per type
- ✅ Mobile-optimized interface
- ✅ Drag & drop image upload

### Admin Features
- ✅ Export data by date (ZIP + CSV)
- ✅ Cleanup old data by date range
- ✅ System statistics dashboard
- ✅ View all captures across users

## Development

### Backend Development
```bash
cd backend
yarn dev          # Start with nodemon
yarn start        # Start production server
```

### Frontend Development
```bash
cd frontend
yarn dev          # Start Next.js dev server
yarn build        # Build for production
yarn start        # Start production server
```

### Database Operations
```bash
cd backend
node src/init-db.js    # Initialize admin user
```

## Production Deployment

### Backend
1. Set production environment variables
2. Build: `yarn build`
3. Start: `yarn start`
4. Use PM2 or similar for process management

### Frontend
1. Build: `yarn build`
2. Start: `yarn start`
3. Deploy to Vercel, Netlify, or similar

### Separation
The backend can be deployed independently by copying the `backend/` folder to a separate server.

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check MongoDB service is running
   - Verify connection string in `.env`
   - Check network/firewall settings

2. **Port Already in Use**
   - Change `PORT` in backend `.env`
   - Kill processes using ports 3000/5000

3. **Image Upload Fails**
   - Check `uploads/` directory permissions
   - Verify file size limits
   - Check image format support

4. **Admin Access Denied**
   - Run `node src/init-db.js` to create admin user
   - Check admin credentials in `.env`

### Logs
- Backend logs appear in terminal
- Frontend errors in browser console
- Check MongoDB logs for database issues

## Security Notes

- Change default admin password in production
- Use strong JWT_SECRET
- Enable HTTPS in production
- Implement rate limiting for production use
- Regular security updates for dependencies

## Support

For issues or questions:
1. Check this setup guide
2. Review error logs
3. Verify environment configuration
4. Check MongoDB connection and permissions
