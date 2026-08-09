const { body, query } = require('express-validator');
const { CATEGORY_ENUM, PRIORITY_ENUM, STATUS_ENUM } = require('../models/ticket.model');

const createTicketValidator = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 20 })
    .withMessage('Description must be at least 20 characters'),
  body('category').isIn(CATEGORY_ENUM).withMessage(`Category must be one of: ${CATEGORY_ENUM.join(', ')}`),
  body('priority').isIn(PRIORITY_ENUM).withMessage(`Priority must be one of: ${PRIORITY_ENUM.join(', ')}`),
];

const updateTicketValidator = [
  body('version').exists().withMessage('version is required').isInt({ min: 0 }).withMessage('version must be a non-negative integer').toInt(),
  body('title').optional().trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description').optional().trim().isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  body('category').optional().isIn(CATEGORY_ENUM).withMessage(`Category must be one of: ${CATEGORY_ENUM.join(', ')}`),
  body('priority').optional().isIn(PRIORITY_ENUM).withMessage(`Priority must be one of: ${PRIORITY_ENUM.join(', ')}`),
  body('status').optional().isIn(STATUS_ENUM).withMessage(`Status must be one of: ${STATUS_ENUM.join(', ')}`),
];

const addCommentValidator = [
  body('text').trim().isLength({ min: 3 }).withMessage('Comment must be at least 3 characters'),
];

const listTicketsValidator = [
  query('status').optional().isIn(STATUS_ENUM).withMessage(`status must be one of: ${STATUS_ENUM.join(', ')}`),
  query('priority').optional().isIn(PRIORITY_ENUM).withMessage(`priority must be one of: ${PRIORITY_ENUM.join(', ')}`),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('sortOrder must be asc or desc'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1 }).withMessage('limit must be a positive integer').toInt(),
];

module.exports = {
  createTicketValidator,
  updateTicketValidator,
  addCommentValidator,
  listTicketsValidator,
};
