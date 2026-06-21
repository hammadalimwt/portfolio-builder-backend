const mongoose = require('mongoose');

const downloadHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    portfolioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portfolio',
      required: true,
      index: true
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template',
      required: true,
      index: true
    },
    downloadDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    ipAddress: {
      type: String,
      default: ''
    },
    userAgent: {
      type: String,
      default: ''
    },
    deviceInfo: {
      os: { type: String, default: 'Unknown' },
      browser: { type: String, default: 'Unknown' },
      device: { type: String, default: 'Unknown' }
    }
  },
  {
    timestamps: true
  }
);

const DownloadHistory = mongoose.model('DownloadHistory', downloadHistorySchema);
module.exports = DownloadHistory;
