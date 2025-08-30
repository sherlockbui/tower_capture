const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const siteRoutes = require('./routes/sites');
const typeRoutes = require('./routes/types');
const captureRoutes = require('./routes/captures');
const adminRoutes = require('./routes/admin');
const { getUploadConfig } = require('./config/cloudinary');

const app = express();
const PORT = process.env.PORT || 5000;
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://192.168.1.42:3000', // Thay bằng IP máy bạn
        'http://0.0.0.0:3000',
        // Allow all LAN IPs
        /^http:\/\/192\.168\.\d+\.\d+:3000$/,
        /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/types', typeRoutes);
app.use('/api/captures', captureRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Tower Capture API is running' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Access via: http://0.0.0.0:${PORT}`);
            
            // Display upload configuration
            const uploadConfig = getUploadConfig();
            console.log(`📁 File Storage: ${uploadConfig.storage === 'cloudinary' ? 'Cloudinary (Production)' : 'Local (Development)'}`);
            if (uploadConfig.storage === 'cloudinary') {
                console.log(`   📂 Cloudinary Folder: ${uploadConfig.folder}`);
            } else {
                console.log(`   📂 Local Directory: ${uploadConfig.directory}`);
            }
        });
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    });

module.exports = app;
