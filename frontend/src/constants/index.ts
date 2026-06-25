export const ROLES = {
  HR: 'hr' as const,
  MANAGER: 'manager' as const,
};

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  HR: {
    DASHBOARD: '/hr/dashboard',
    ASSOCIATES: '/hr/associates',
    ASSOCIATE_UPLOAD: '/hr/associate-upload',
    EMPLOYEE_UPLOAD: '/hr/employees/upload',
    EMPLOYEES: '/hr/employees',
    REPORTS: '/hr/reports',
    EVALUATION_REPORTS: '/hr/evaluation-reports',
    MANAGERS: '/hr/managers',
    PROBATION_EXTENSIONS: '/hr/probation-extensions',
    EVALUATION_UNLOCK_REQUESTS: '/hr/evaluation-unlock-requests',
    ASSOCIATE_MANAGER_MAPPINGS: '/hr/associate-manager-mappings',
  },
  MANAGER: {
    DASHBOARD: '/manager/dashboard',
    ASSOCIATES: '/manager/associates',
    EMPLOYEES: '/manager/employees',
    TEAM: '/manager/team',
    EVALUATIONS: '/manager/evaluations',
    EVALUATION_REPORTS: '/manager/evaluation-reports',
    PROBATION_EXTENSIONS: '/manager/probation-extensions',
    EVALUATION_UNLOCK_REQUESTS: '/manager/evaluation-unlock-requests',
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
  PROBATION: import.meta.env.VITE_PROBATION_API_URL || 'http://localhost:5004',
};

export function getDashboardRouteForRole(role: string): string {
  if (role === ROLES.HR) return ROUTES.HR.DASHBOARD;
  if (role === ROLES.MANAGER) return ROUTES.MANAGER.DASHBOARD;
  return ROUTES.LOGIN;
}
