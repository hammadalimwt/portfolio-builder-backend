const dotenv = require('dotenv');
dotenv.config();

const app = require('../app');
const mongoose = require('mongoose');

const PORT = 5001;

console.log('Starting test server on port 5001...');
const server = app.listen(PORT, () => {
  console.log(`Test server listening on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
