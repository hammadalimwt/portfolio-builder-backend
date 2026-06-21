const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema(
  {
    allowRegistrations: {
      type: Boolean,
      default: true
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    maxUploadSize: {
      type: Number,
      default: 5242880 // 5MB
    },
    defaultTheme: {
      type: String,
      default: 'dark'
    }
  },
  {
    timestamps: true
  }
);

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);
module.exports = SystemConfig;
