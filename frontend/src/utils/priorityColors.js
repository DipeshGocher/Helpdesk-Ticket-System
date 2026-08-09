export const PRIORITY_COLORS = {
  Critical: { color: 'var(--priority-critical)', bg: 'var(--priority-critical-bg)' },
  High: { color: 'var(--priority-high)', bg: 'var(--priority-high-bg)' },
  Medium: { color: 'var(--priority-medium)', bg: 'var(--priority-medium-bg)' },
  Low: { color: 'var(--priority-low)', bg: 'var(--priority-low-bg)' },
};

export const STATUS_COLORS = {
  Open: { color: 'var(--status-open)', bg: 'var(--status-open-bg)' },
  'In Progress': { color: 'var(--status-inprogress)', bg: 'var(--status-inprogress-bg)' },
  Resolved: { color: 'var(--status-resolved)', bg: 'var(--status-resolved-bg)' },
  Closed: { color: 'var(--status-closed)', bg: 'var(--status-closed-bg)' },
  Queued: { color: 'var(--status-queued)', bg: 'var(--status-queued-bg)' },
};

export const SLA_COLORS = {
  ok: { color: 'var(--sla-ok)', bg: 'var(--sla-ok-bg)' },
  at_risk: { color: 'var(--sla-at_risk)', bg: 'var(--sla-at_risk-bg)' },
  breached: { color: 'var(--sla-breached)', bg: 'var(--sla-breached-bg)' },
};

export const SLA_LABELS = {
  ok: 'On Track',
  at_risk: 'At Risk',
  breached: 'Breached',
};

const CATEGORY_PALETTE = {
  Bug: { color: '#be123c', bg: '#ffe4e6' },
  Feature: { color: '#1d4ed8', bg: '#dbeafe' },
  Billing: { color: '#7e22ce', bg: '#f3e8ff' },
  Other: { color: '#475467', bg: '#f2f4f7' },
};

export function getCategoryColors(category) {
  return CATEGORY_PALETTE[category] || CATEGORY_PALETTE.Other;
}
