// Formats a millisecond duration as "1h 24m" / "3d 2h" / "45s" for the live countdown badge.
export function formatDuration(ms) {
  const totalSeconds = Math.max(Math.floor(Math.abs(ms) / 1000), 0);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

// Given a slaDeadline and the "now" instant, returns whether it's overdue and the
// human-readable duration until/since the deadline. Ticket's own slaState (ok/at_risk/
// breached) still comes from the backend - this only drives the live-ticking display.
export function computeCountdown(slaDeadline, now = new Date()) {
  const deadline = new Date(slaDeadline);
  if (Number.isNaN(deadline.getTime())) return { isOverdue: false, label: '—' };

  const diffMs = deadline.getTime() - now.getTime();
  const isOverdue = diffMs <= 0;

  return {
    isOverdue,
    label: isOverdue ? `Overdue by ${formatDuration(diffMs)}` : `${formatDuration(diffMs)} left`,
  };
}
