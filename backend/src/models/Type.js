const mongoose = require('mongoose');

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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Ensure typeName is unique per site
typeSchema.index({ siteId: 1, typeName: 1 }, { unique: true });

module.exports = mongoose.model('Type', typeSchema);
