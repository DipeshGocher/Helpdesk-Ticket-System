const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const config = require('../config/env');

// Stateless: verifies the JWT and trusts its payload without a DB round-trip, so the
// 5s-polled GET /tickets stays cheap. Trade-off: no server-side revocation - a deleted
// account's token keeps working until it naturally expires.
function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return next(new ApiError(401, 'Not authenticated'));
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    next(err);
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
}

module.exports = { protect, authorize };
