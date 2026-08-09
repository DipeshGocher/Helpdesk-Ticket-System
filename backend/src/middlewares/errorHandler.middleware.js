const ApiError = require('../utils/ApiError');
const config = require('../config/env');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let message = 'Internal server error';
  let extra = {};

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    if (err.details) extra = err.details;
  } else if (err.name === 'ValidationError') {
    // Mongoose schema validation error
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join('; ');
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid id format';
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `Duplicate value for field: ${field}` : 'Duplicate key error';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired, please log in again';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else {
    message = config.nodeEnv === 'production' ? 'Internal server error' : err.message;
  }

  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({ success: false, message, ...extra });
}

module.exports = errorHandler;
