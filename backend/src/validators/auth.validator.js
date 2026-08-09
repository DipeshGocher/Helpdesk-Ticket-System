const { body } = require('express-validator');

const registerValidator = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').trim().isEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('A valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('role').isIn(['agent', 'customer']).withMessage('role must be agent or customer'),
];

module.exports = { registerValidator, loginValidator };
