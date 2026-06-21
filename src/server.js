const dotenv = require('dotenv');
// Load environment variables before importing the app
dotenv.config();

const app = require('./app');
const logger = require('./services/loggerService');
const connectDB = require('./config/database');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION! Shutting down... \nError: ${err.message} \nStack: ${err.stack}`);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

// Connect to database on boot (non-blocking for server startup)
connectDB().catch(err => {
  logger.error(`Initial database connection failed on boot: ${err.message}`);
});

const server = app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error(`UNHANDLED REJECTION! Shutting down... \nError: ${err.message} \nStack: ${err.stack}`);
  server.close(() => {
    process.exit(1);
  });
});
