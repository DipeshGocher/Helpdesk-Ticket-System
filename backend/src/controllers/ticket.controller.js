const catchAsync = require('../utils/catchAsync');
const ticketService = require('../services/ticket.service');
const statsService = require('../services/stats.service');

const createTicket = catchAsync(async (req, res) => {
  const { title, description, category, priority } = req.body;
  const ticket = await ticketService.createTicket({ title, description, category, priority }, req.user);
  res.status(201).json({ success: true, data: ticket });
});

const listTickets = catchAsync(async (req, res) => {
  const { status, priority, search, sortBy, sortOrder, page, limit } = req.query;
  const result = await ticketService.listTickets(
    { status, priority, search, sortBy, sortOrder, page, limit },
    req.user
  );
  res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
});

const getStats = catchAsync(async (req, res) => {
  const stats = await statsService.getStats();
  res.status(200).json({ success: true, data: stats });
});

const getTicketById = catchAsync(async (req, res) => {
  const ticket = await ticketService.getTicketById(req.params.id, req.user);
  res.status(200).json({ success: true, data: ticket });
});

const updateTicket = catchAsync(async (req, res) => {
  const { title, description, category, priority, status, version } = req.body;
  const ticket = await ticketService.updateTicket(
    req.params.id,
    { title, description, category, priority, status, version },
    req.user
  );
  res.status(200).json({ success: true, data: ticket });
});

const addComment = catchAsync(async (req, res) => {
  const ticket = await ticketService.addComment(req.params.id, req.body.text, req.user);
  res.status(201).json({ success: true, data: ticket });
});

module.exports = {
  createTicket,
  listTickets,
  getStats,
  getTicketById,
  updateTicket,
  addComment,
};
