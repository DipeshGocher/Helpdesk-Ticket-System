import { useEffect, useRef } from 'react';

// Standard "saved callback" interval hook - keeps firing the latest callback without
// tearing down/recreating the timer every render (which would otherwise restart the cadence).
export function useInterval(callback, delayMs) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delayMs === null) return undefined;
    const id = setInterval(() => savedCallback.current(), delayMs);
    return () => clearInterval(id);
  }, [delayMs]);
}
