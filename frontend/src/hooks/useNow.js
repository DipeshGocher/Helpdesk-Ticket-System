import { useState } from 'react';
import { useInterval } from './useInterval';

// Ticking clock for live countdowns (e.g. SLA badges). Re-renders the consuming
// component every `intervalMs` without any network activity.
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useInterval(() => setNow(new Date()), intervalMs);
  return now;
}
