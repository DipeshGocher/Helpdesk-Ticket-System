import { useNow } from '../../hooks/useNow';
import { formatRelativeTime, formatAbsoluteTime } from '../../utils/relativeTime';

// Re-renders on a slow tick so "2 minutes ago" keeps advancing without a page refresh.
export default function RelativeTime({ date, tickMs = 30000, className }) {
  useNow(tickMs);
  if (!date) return null;

  return (
    <time className={className} dateTime={new Date(date).toISOString()} title={formatAbsoluteTime(date)}>
      {formatRelativeTime(date)}
    </time>
  );
}
