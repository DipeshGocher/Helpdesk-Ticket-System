const mongoose = require('mongoose');
const Ticket = require('../models/ticket.model');
const Agent = require('../models/agent.model');
const Customer = require('../models/customer.model');
const ApiError = require('../utils/ApiError');
const escapeRegex = require('../utils/escapeRegex');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { isValidTransition } = require('../utils/statusTransitions');
const {
  buildSlaAddFieldsStage,
  buildSlaStateAddFieldsStage,
  buildSlaBreachedAddFieldsStage,
} = require('../utils/slaAggregationStages');
const { computeSla, computeSlaForTicket, evaluateAndPersistSla } = require('./sla.service');
const { assignTicketOnCreate, promoteQueuedTicketIfAny, ACTIVE_STATUSES } = require('./assignment.service');

const TERMINAL_TRIGGER_STATUSES = ['Resolved', 'Closed'];
const SORTABLE_FIELDS = ['createdAt', 'slaDeadline', 'priority'];

function serializeTicket(ticketDoc, slaFields) {
  const obj = ticketDoc.toObject();
  return {
    ...obj,
    slaDeadline: slaFields.slaDeadline,
    slaState: slaFields.slaState,
  };
}

function formatListRow(row) {
  return {
    _id: row._id,
    title: row.title,
    description: row.description,
    category: row.category,
    priority: row.priority,
    status: row.status,
    version: row.version,
    assignedAgent: row.assignedAgentInfo
      ? { _id: row.assignedAgentInfo._id, name: row.assignedAgentInfo.name, maxLoad: row.assignedAgentInfo.maxLoad }
      : null,
    createdBy: row.createdByInfo
      ? { _id: row.createdByInfo._id, name: row.createdByInfo.name, email: row.createdByInfo.email }
      : null,
    slaDeadline: row.slaDeadlineComputed,
    slaState: row.slaState,
    comments: row.comments,
    history: row.history,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function isOwnedByCustomer(ticket, requester) {
  if (!ticket.createdBy) return false;
  const ownerId = ticket.createdBy._id ? ticket.createdBy._id : ticket.createdBy;
  return ownerId.toString() === requester.id;
}

function assertCustomerOwnsTicket(ticket, requester) {
  if (requester.role === 'customer' && !isOwnedByCustomer(ticket, requester)) {
    throw new ApiError(403, 'You do not have access to this ticket');
  }
}

async function getAuthorName(requester) {
  const Model = requester.role === 'agent' ? Agent : Customer;
  const user = await Model.findById(requester.id).select('name');
  return user ? user.name : null;
}

// List rows come from an aggregation pipeline (plain objects, not live documents).
// Any row that's breach-escalation-eligible gets re-fetched as a real document and
// pushed through evaluateAndPersistSla so escalation is actually persisted, not just displayed.
async function reconcileRowEscalation(row) {
  const eligible = row.isBreached && ACTIVE_STATUSES.includes(row.status) && !row.slaEscalated;
  if (!eligible) return row;

  const ticketDoc = await Ticket.findById(row._id);
  if (!ticketDoc) return row;

  const { slaDeadline, slaState } = await evaluateAndPersistSla(ticketDoc);

  return {
    ...ticketDoc.toObject(),
    assignedAgentInfo: row.assignedAgentInfo,
    createdByInfo: row.createdByInfo,
    slaDeadlineComputed: slaDeadline,
    slaState,
  };
}

async function createTicket(payload, requester) {
  const ticket = new Ticket({
    title: payload.title,
    description: payload.description,
    category: payload.category,
    priority: payload.priority,
    createdBy: requester.id,
  });

  await assignTicketOnCreate(ticket);

  // Mongoose's timestamps plugin assigns createdAt at save-time to essentially "now" -
  // computing off our own `now` here is accurate to well within SLA-window tolerances (hours).
  const now = new Date();
  const { slaDeadline, slaState } = computeSla({
    priority: ticket.priority,
    createdAt: now,
    status: ticket.status,
    resolvedAt: null,
    slaEscalated: false,
  });
  ticket.slaDeadline = slaDeadline;

  await ticket.save();
  await ticket.populate('assignedAgent', 'name maxLoad');
  await ticket.populate('createdBy', 'name email');

  return serializeTicket(ticket, { slaDeadline, slaState });
}

async function listTickets(query, requester) {
  const { status, priority, search, sortBy, sortOrder } = query;
  const { page, limit, skip } = parsePagination(query);

  if (sortBy && !SORTABLE_FIELDS.includes(sortBy)) {
    throw new ApiError(400, `Invalid sortBy field. Must be one of: ${SORTABLE_FIELDS.join(', ')}`);
  }

  const match = {};
  if (status) match.status = status;
  if (priority) match.priority = priority;
  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    match.$or = [{ title: re }, { description: re }];
  }
  // Customers only ever see their own tickets. Aggregation $match does NOT auto-cast
  // strings to ObjectId the way Model.find() does, so this must be cast explicitly.
  if (requester.role === 'customer') {
    match.createdBy = new mongoose.Types.ObjectId(requester.id);
  }

  const sortDir = sortOrder === 'asc' ? 1 : -1;
  const sortField = sortBy || 'createdAt';
  let sortStage;
  if (sortField === 'priority') sortStage = { priorityRank: sortDir };
  else if (sortField === 'slaDeadline') sortStage = { slaDeadlineComputed: sortDir };
  else sortStage = { createdAt: sortDir };

  const pipeline = [
    { $match: match },
    buildSlaAddFieldsStage(),
    buildSlaStateAddFieldsStage(),
    buildSlaBreachedAddFieldsStage(),
    { $sort: sortStage },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'agents',
              localField: 'assignedAgent',
              foreignField: '_id',
              as: 'assignedAgentInfo',
            },
          },
          { $unwind: { path: '$assignedAgentInfo', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'customers',
              localField: 'createdBy',
              foreignField: '_id',
              as: 'createdByInfo',
            },
          },
          { $unwind: { path: '$createdByInfo', preserveNullAndEmptyArrays: true } },
        ],
        totalCount: [{ $count: 'count' }],
      },
    },
  ];

  const [result] = await Ticket.aggregate(pipeline);
  const rows = result.data;
  const totalItems = result.totalCount[0]?.count || 0;

  const reconciledRows = await Promise.all(rows.map(reconcileRowEscalation));

  return {
    data: reconciledRows.map(formatListRow),
    pagination: buildPaginationMeta({ page, limit, totalItems }),
  };
}

async function getTicketById(id, requester) {
  const ticket = await Ticket.findById(id)
    .populate('assignedAgent', 'name maxLoad')
    .populate('createdBy', 'name email');
  if (!ticket) throw new ApiError(404, 'Ticket not found');

  assertCustomerOwnsTicket(ticket, requester);

  const slaFields = await evaluateAndPersistSla(ticket);
  return serializeTicket(ticket, slaFields);
}

async function updateTicket(id, payload, requester) {
  // Route-level authorize(['agent']) already blocks customers from reaching this - this
  // is a service-layer backstop so the single most sensitive mutation in the app isn't
  // solely dependent on the route wiring never being misconfigured.
  if (requester.role !== 'agent') {
    throw new ApiError(403, 'Only agents can update tickets');
  }

  const ticket = await Ticket.findById(id);
  if (!ticket) throw new ApiError(404, 'Ticket not found');

  if (payload.version === undefined || payload.version === null) {
    throw new ApiError(400, 'version is required for updates');
  }

  if (payload.version !== ticket.version) {
    await ticket.populate('assignedAgent', 'name maxLoad');
    await ticket.populate('createdBy', 'name email');
    const slaFields = computeSlaForTicket(ticket);
    const currentTicket = serializeTicket(ticket, slaFields);
    throw new ApiError(409, 'Ticket has been modified by another request. Refetch and retry.', {
      currentTicket,
    });
  }

  let statusChanged = false;
  let newStatus = ticket.status;

  if (payload.status !== undefined && payload.status !== ticket.status) {
    const from = ticket.status;
    const to = payload.status;
    if (!isValidTransition(from, to)) {
      throw new ApiError(400, `Invalid status transition from '${from}' to '${to}'`);
    }
    ticket.history.push({ type: 'Status Change', from, to, note: '', timestamp: new Date() });

    if (TERMINAL_TRIGGER_STATUSES.includes(to) && !ticket.resolvedAt) {
      ticket.resolvedAt = new Date();
    }
    if (to === 'In Progress' && from === 'Resolved') {
      // Reopened - SLA clock resumes against wall-clock "now" rather than staying frozen.
      ticket.resolvedAt = null;
    }

    ticket.status = to;
    statusChanged = true;
    newStatus = to;
  }

  if (payload.priority !== undefined && payload.priority !== ticket.priority) {
    ticket.history.push({
      type: 'Priority Change',
      from: ticket.priority,
      to: payload.priority,
      note: 'Manual update',
      timestamp: new Date(),
    });
    ticket.priority = payload.priority;
    // Keep the stored slaDeadline in sync immediately rather than waiting for the
    // next escalation-triggering save - avoids a stale cached value in the DB.
    ticket.slaDeadline = computeSlaForTicket(ticket).slaDeadline;
  }

  if (payload.title !== undefined) ticket.title = payload.title;
  if (payload.description !== undefined) ticket.description = payload.description;
  if (payload.category !== undefined) ticket.category = payload.category;

  ticket.version += 1;
  await ticket.save();

  if (statusChanged && TERMINAL_TRIGGER_STATUSES.includes(newStatus)) {
    await promoteQueuedTicketIfAny(ticket.assignedAgent);
  }

  await ticket.populate('assignedAgent', 'name maxLoad');
  await ticket.populate('createdBy', 'name email');
  const slaFields = await evaluateAndPersistSla(ticket);

  return serializeTicket(ticket, slaFields);
}

async function addComment(id, text, requester) {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw new ApiError(404, 'Ticket not found');

  // Ownership check comes before the Closed check so a customer probing a ticket that
  // isn't theirs doesn't learn anything about it (including whether it's closed).
  assertCustomerOwnsTicket(ticket, requester);

  if (ticket.status === 'Closed') {
    throw new ApiError(400, 'Cannot add comments to a Closed ticket');
  }

  const authorName = await getAuthorName(requester);
  ticket.comments.push({ text, authorName, authorRole: requester.role, createdAt: new Date() });
  await ticket.save();
  await ticket.populate('assignedAgent', 'name maxLoad');
  await ticket.populate('createdBy', 'name email');

  const slaFields = computeSlaForTicket(ticket);

  return serializeTicket(ticket, slaFields);
}

module.exports = {
  createTicket,
  listTickets,
  getTicketById,
  updateTicket,
  addComment,
};
