const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

function validateRequest(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', { errors: result.array() }));
  }
  next();
}

module.exports = validateRequest;
