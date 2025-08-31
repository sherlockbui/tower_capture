const mongoose = require('mongoose');
const { transformTimestamps } = require('../utils/timezone');

const typeSchema = new mongoose.Schema({
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  typeName: {
    type: String,
    required: true,
    trim: true
  },
  note: {
    type: String,
    default: '',
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

// Ensure typeName is unique per site
typeSchema.index({ siteId: 1, typeName: 1 }, { unique: true });

module.exports = mongoose.model('Type', typeSchema);
