const express = require('express');
const ticketController = require('../controllers/ticket.controller');
const validateRequest = require('../middlewares/validateRequest.middleware');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { mongoIdParamValidator } = require('../validators/common.validator');
const {
  createTicketValidator,
  updateTicketValidator,
  addCommentValidator,
  listTicketsValidator,
} = require('../validators/ticket.validator');

const router = express.Router();

router.post(
  '/',
  protect,
  authorize('customer'),
  createTicketValidator,
  validateRequest,
  ticketController.createTicket
);
router.get('/', protect, listTicketsValidator, validateRequest, ticketController.listTickets);

// Must be declared before GET /:id, otherwise Express matches "stats" as the :id param.
router.get('/stats', protect, authorize('agent'), ticketController.getStats);

router.get('/:id', protect, mongoIdParamValidator, validateRequest, ticketController.getTicketById);
router.patch(
  '/:id',
  protect,
  authorize('agent'),
  mongoIdParamValidator,
  updateTicketValidator,
  validateRequest,
  ticketController.updateTicket
);
router.post(
  '/:id/comments',
  protect,
  mongoIdParamValidator,
  addCommentValidator,
  validateRequest,
  ticketController.addComment
);

module.exports = router;
