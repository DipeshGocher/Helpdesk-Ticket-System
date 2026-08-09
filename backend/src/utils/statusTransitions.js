// Explicit allowed-transitions map for the ticket status state machine.
const ALLOWED_TRANSITIONS = {
  Open: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: ['Closed', 'In Progress'],
  Closed: [],
  Queued: ['Open', 'Closed'],
};

function isValidTransition(from, to) {
  if (from === to) return true;
  return (ALLOWED_TRANSITIONS[from] || []).includes(to);
}

module.exports = { ALLOWED_TRANSITIONS, isValidTransition };
