export const ROLES = {
  HR: 'hr',
  MANAGER: 'manager',
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

export const DEFAULT_PORTS = {
  FRONTEND: 3000,
  AUTH: 5000,
  HR: 5001,
  MANAGER: 5002,
  REPORT: 5003,
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'hrms_auth_token',
  AUTH_USER: 'hrms_auth_user',
};

export const DEMO_CREDENTIALS = {
  HR: { email: 'hr@sundew.com', password: 'password123' },
  MANAGER: { email: 'manager@sundew.com', password: 'password123' },
};
