const logger = require('../services/loggerService');
const { sendError } = require('../utilities/responseHelper');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error
  logger.error(`${err.message} \nStack: ${err.stack}`);

  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || [],   // ← always expose for frontend consumption
      stack: err.stack,
      error: err
    });
  }

  // Production error format (safe, clean, hides internal database errors)
  let message = err.message;
  let errors = err.errors || [];

  // Mongoose duplicate key error
  if (err.code === 11000) {
    err.statusCode = 400;
    const keyName = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered: ${keyName}. Please use another value.`;
    errors.push({ field: keyName, message });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    err.statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    err.statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
    errors.push({ field: err.path, message });
  }

  // JWT expired
  if (err.name === 'TokenExpiredError') {
    err.statusCode = 401;
    message = 'Your token has expired. Please log in again.';
  }

  // JWT invalid
  if (err.name === 'JsonWebTokenError') {
    err.statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  return sendError(res, message, errors, err.statusCode);
};

module.exports = errorHandler;
