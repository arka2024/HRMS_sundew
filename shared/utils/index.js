/**
 * Get the dashboard route for a given role.
 * @param {import('../types/index.js').UserRole} role
 * @returns {string}
 */
export function getDashboardRouteForRole(role) {
  if (role === 'hr') return '/hr/dashboard';
  if (role === 'manager') return '/manager/dashboard';
  return '/login';
}

/**
 * Check if a role is allowed to access a path prefix.
 * @param {import('../types/index.js').UserRole} role
 * @param {string} path
 * @returns {boolean}
 */
export function isRouteAllowedForRole(role, path) {
  if (path.startsWith('/hr')) return role === 'hr';
  if (path.startsWith('/manager')) return role === 'manager';
  return true;
}

/**
 * Parse authorization header token.
 * @param {string|undefined} authHeader
 * @returns {string|null}
 */
export function parseBearerToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

/**
 * Sleep helper for health check retries.
 * @param {number} ms
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
