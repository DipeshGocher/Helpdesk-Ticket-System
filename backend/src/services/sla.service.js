const { SLA_HOURS, AT_RISK_THRESHOLD, SLA_STATES } = require('../utils/slaConfig');
const { getNextPriority } = require('../utils/priorityOrder');

const ACTIVE_STATUSES = ['Open', 'In Progress'];
const TERMINAL_STATUSES = ['Resolved', 'Closed'];

// Pure function - no I/O. Given a ticket's relevant fields, returns the computed
// SLA deadline/state and whether an auto-escalation should fire.
function computeSla({ priority, createdAt, status, resolvedAt, slaEscalated }) {
  const durationMs = SLA_HOURS[priority] * 3600000;
  const deadline = new Date(createdAt.getTime() + durationMs);
  const now = new Date();

  const endTime = TERMINAL_STATUSES.includes(status) && resolvedAt ? resolvedAt : now;

  let slaState;
  if (endTime.getTime() > deadline.getTime()) {
    slaState = SLA_STATES.BREACHED;
  } else if (now.getTime() - createdAt.getTime() >= AT_RISK_THRESHOLD * durationMs) {
    slaState = SLA_STATES.AT_RISK;
  } else {
    slaState = SLA_STATES.OK;
  }

  const wouldEscalate =
    slaState === SLA_STATES.BREACHED && ACTIVE_STATUSES.includes(status) && !slaEscalated;

  return { slaDeadline: deadline, slaState, wouldEscalate };
}

// Pulls the same 5 fields off a Mongoose ticket document that computeSla() needs -
// shared by every call site so the field list only lives in one place.
function computeSlaForTicket(ticketDoc) {
  return computeSla({
    priority: ticketDoc.priority,
    createdAt: ticketDoc.createdAt,
    status: ticketDoc.status,
    resolvedAt: ticketDoc.resolvedAt,
    slaEscalated: ticketDoc.slaEscalated,
  });
}

// Side-effecting wrapper: evaluates SLA for a live Mongoose ticket document and,
// if an escalation is due, mutates + persists the ticket (priority bump, history,
// slaEscalated flag, version bump) exactly once.
async function evaluateAndPersistSla(ticketDoc) {
  const result = computeSlaForTicket(ticketDoc);

  if (!result.wouldEscalate) {
    return { slaDeadline: result.slaDeadline, slaState: result.slaState };
  }

  const oldPriority = ticketDoc.priority;
  const newPriority = getNextPriority(oldPriority);

  ticketDoc.history.push({
    type: 'Priority Change',
    from: oldPriority,
    to: newPriority,
    note:
      newPriority === oldPriority
        ? 'SLA breached - already at Critical, no further escalation possible'
        : 'SLA breached - priority auto-escalated',
    timestamp: new Date(),
  });

  ticketDoc.priority = newPriority;
  ticketDoc.slaEscalated = true;
  ticketDoc.version += 1;

  const refreshed = computeSlaForTicket(ticketDoc);
  ticketDoc.slaDeadline = refreshed.slaDeadline;

  await ticketDoc.save();

  return { slaDeadline: refreshed.slaDeadline, slaState: refreshed.slaState };
}

module.exports = { computeSla, computeSlaForTicket, evaluateAndPersistSla };
