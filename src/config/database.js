const mongoose = require('mongoose');
const dns = require('dns');
const logger = require('../services/loggerService');

// Programmatically set DNS servers to Google and Cloudflare to resolve Atlas SRV records reliably
// try {
//   dns.setServers(['8.8.8.8', '1.1.1.1']);
// } catch (err) {
//   logger.warn(`Failed to set custom DNS servers: ${err.message}`);
// }

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    logger.info('Using existing MongoDB connection.');
    return;
  }

  try {
    const dbUri = process.env.MONGODB_URI;
    if (!dbUri) {
      throw new Error('MONGODB_URI environment variable is missing.');
    }

    const conn = await mongoose.connect(dbUri);
    isConnected = !!conn.connections[0].readyState;
    logger.info(`MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
