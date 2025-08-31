const mongoose = require('mongoose');
const { transformTimestamps } = require('../utils/timezone');

const captureSchema = new mongoose.Schema({
  typeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Type',
    required: true
  },
  images: [{
    type: String,
    required: true
  }],
  capturedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  capturedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { transform: transformTimestamps },
  toObject: { transform: transformTimestamps }
});

module.exports = mongoose.model('Capture', captureSchema);
