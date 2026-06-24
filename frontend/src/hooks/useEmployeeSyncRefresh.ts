import { useEffect } from 'react';
import { onEmployeeSync } from '../utils/employeeSyncEvents';

/** Re-run callback when HR uploads sync employee data, on focus, and on an interval. */
export function useEmployeeSyncRefresh(
  callback: () => void,
  options?: { intervalMs?: number; enabled?: boolean },
) {
  const { intervalMs = 20000, enabled = true } = options ?? {};

  useEffect(() => {
    if (!enabled) return;

    callback();

    const unsubscribe = onEmployeeSync(() => callback());

    const handleFocus = () => callback();
    window.addEventListener('focus', handleFocus);

    const interval = window.setInterval(callback, intervalMs);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
      window.clearInterval(interval);
    };
  }, [callback, enabled, intervalMs]);
}
