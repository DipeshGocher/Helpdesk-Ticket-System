const UNITS = [
  { limit: 60, divisor: 1, unit: 'second' },
  { limit: 3600, divisor: 60, unit: 'minute' },
  { limit: 86400, divisor: 3600, unit: 'hour' },
  { limit: 604800, divisor: 86400, unit: 'day' },
  { limit: 2629800, divisor: 604800, unit: 'week' },
  { limit: 31557600, divisor: 2629800, unit: 'month' },
  { limit: Infinity, divisor: 31557600, unit: 'year' },
];

const rtf = typeof Intl !== 'undefined' ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' }) : null;

// Formats a date as "3 minutes ago" / "in 2 hours", falling back to a locale string
// if Intl.RelativeTimeFormat isn't available.
export function formatRelativeTime(date) {
  const target = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(target.getTime())) return '';

  const diffSeconds = (target.getTime() - Date.now()) / 1000;
  const absSeconds = Math.abs(diffSeconds);

  if (!rtf) return target.toLocaleString();

  for (const { limit, divisor, unit } of UNITS) {
    if (absSeconds < limit) {
      const value = Math.round(diffSeconds / divisor);
      return rtf.format(value, unit);
    }
  }
  return target.toLocaleDateString();
}

export function formatAbsoluteTime(date) {
  const target = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(target.getTime())) return '';
  return target.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
