// SLA windows in hours per priority level.
const SLA_HOURS = {
  Critical: 2,
  High: 8,
  Medium: 24,
  Low: 72,
};

// Fraction of the SLA window elapsed before a non-breached ticket is flagged "at_risk".
const AT_RISK_THRESHOLD = 0.75;

const SLA_STATES = {
  OK: 'ok',
  AT_RISK: 'at_risk',
  BREACHED: 'breached',
};

module.exports = { SLA_HOURS, AT_RISK_THRESHOLD, SLA_STATES };
