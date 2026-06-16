export const ROLES = {
  HR: 'hr' as const,
  MANAGER: 'manager' as const,
};

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  HR: {
    DASHBOARD: '/hr/dashboard',
    EMPLOYEES: '/hr/employees',
    REPORTS: '/hr/reports',
  },
  MANAGER: {
    DASHBOARD: '/manager/dashboard',
    TEAM: '/manager/team',
    EVALUATIONS: '/manager/evaluations',
  },
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'hrms_auth_token',
  AUTH_USER: 'hrms_auth_user',
};

export const API_URLS = {
  AUTH: import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5000',
  HR: import.meta.env.VITE_HR_API_URL || 'http://localhost:5001',
  MANAGER: import.meta.env.VITE_MANAGER_API_URL || 'http://localhost:5002',
  REPORT: import.meta.env.VITE_REPORT_API_URL || 'http://localhost:5003',
};

export function getDashboardRouteForRole(role: string): string {
  if (role === ROLES.HR) return ROUTES.HR.DASHBOARD;
  if (role === ROLES.MANAGER) return ROUTES.MANAGER.DASHBOARD;
  return ROUTES.LOGIN;
}
