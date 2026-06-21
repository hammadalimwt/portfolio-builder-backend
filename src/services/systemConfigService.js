const SystemConfig = require('../models/SystemConfig');
const logger = require('./loggerService');

class SystemConfigService {
  async getConfig() {
    let config = await SystemConfig.findOne();
    if (!config) {
      // Create default configuration if none exists
      config = await SystemConfig.create({
        allowRegistrations: true,
        maintenanceMode: false,
        maxUploadSize: 5242880, // 5MB
        defaultTheme: 'dark'
      });
      logger.info('Initialized default system configurations in database.');
    }
    return config;
  }

  async updateConfig(updateData) {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig(updateData);
    } else {
      Object.assign(config, updateData);
    }
    await config.save();
    logger.info('System configurations updated successfully.');
    return config;
  }
}

module.exports = new SystemConfigService();
