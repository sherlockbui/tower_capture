const mongoose = require('mongoose');
const { transformTimestamps } = require('../utils/timezone');

const siteSchema = new mongoose.Schema({
  siteCode: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { transform: transformTimestamps },
  toObject: { transform: transformTimestamps }
});

// Ensure siteCode is unique per user
siteSchema.index({ siteCode: 1, createdBy: 1 }, { unique: true });

module.exports = mongoose.model('Site', siteSchema);
