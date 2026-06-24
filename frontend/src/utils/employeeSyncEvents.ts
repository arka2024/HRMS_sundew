/** Cross-portal event when HR employee data is uploaded/synced. */
export const EMPLOYEE_SYNC_EVENT = 'hrms:employee-sync';

export function notifyEmployeeSync(detail?: { successCount?: number; failedCount?: number }) {
  window.dispatchEvent(new CustomEvent(EMPLOYEE_SYNC_EVENT, { detail }));
}

export function onEmployeeSync(listener: (detail?: { successCount?: number; failedCount?: number }) => void) {
  const handler = (event: Event) => {
    listener((event as CustomEvent).detail);
  };
  window.addEventListener(EMPLOYEE_SYNC_EVENT, handler);
  return () => window.removeEventListener(EMPLOYEE_SYNC_EVENT, handler);
}

export function slugifyEmployeeId(name: string, employeeNumber?: string) {
  const fromName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (fromName) return fromName;
  return String(employeeNumber || 'employee')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}
