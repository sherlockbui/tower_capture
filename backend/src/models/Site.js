const mongoose = require('mongoose');

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
  timestamps: true
});

// Ensure siteCode is unique per user
siteSchema.index({ siteCode: 1, createdBy: 1 }, { unique: true });

module.exports = mongoose.model('Site', siteSchema);
