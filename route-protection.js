/**
 * Route Protection and Navigation Utilities
 * Handles protected routes and role-based redirection
 */

class RouteProtection {
  constructor() {
    this.PROTECTED_ROUTES = {
      hr: [
        '/hr/dashboard',
        '/hr/employees',
        '/hr/evaluations',
        '/hr/reports',
        '/hr/probation',
        '/hr/managers'
      ],
      manager: [
        '/manager/dashboard',
        '/manager/team',
        '/manager/evaluations',
        '/manager/feedback',
        '/manager/probation',
        '/manager/actions'
      ]
    };
  }

  /**
   * Get user's home dashboard based on role
   * @param {string} role - User role (hr or manager)
   * @returns {string} - Dashboard URL
   */
  getHomeDashboard(role) {
    switch (role) {
      case 'hr':
        return '/HR/';
      case 'manager':
        return '/manager/';
      default:
        return '/login.html';
    }
  }

  /**
   * Check if a route is protected
   * @param {string} path - Route path
   * @returns {boolean}
   */
  isProtectedRoute(path) {
    const hrRoutes = this.PROTECTED_ROUTES.hr || [];
    const managerRoutes = this.PROTECTED_ROUTES.manager || [];
    return [...hrRoutes, ...managerRoutes].some(route => 
      path.startsWith(route) || path === route
    );
  }

  /**
   * Check if user can access a route
   * @param {Object} user - Current user
   * @param {string} path - Route path to check
   * @returns {boolean}
   */
  canAccessRoute(user, path) {
    if (!user) {
      return path === '/login' || path === '/';
    }

    // Allow access to own role's routes
    const userRoutes = this.PROTECTED_ROUTES[user.role] || [];
    if (userRoutes.some(route => path.startsWith(route))) {
      return true;
    }

    // Allow access to login
    if (path === '/login' || path === '/') {
      return true;
    }

    return false;
  }

  /**
   * Navigate to a protected route
   * @param {string} path - Route path
   * @param {Object} user - Current user (optional)
   * @returns {boolean} - True if navigation is allowed
   */
  navigateTo(path, user = null) {
    user = user || authService.getCurrentUser();

    if (this.canAccessRoute(user, path)) {
      window.location.href = path;
      return true;
    }

    // Redirect to home or login
    if (user) {
      const homeUrl = this.getHomeDashboard(user.role);
      window.location.href = homeUrl;
    } else {
      window.location.href = '/login';
    }
    return false;
  }

  /**
   * Check and enforce route protection
   * Call this on page load to protect routes
   */
  enforceRouteProtection() {
    const currentPath = window.location.pathname;
    const user = authService.getCurrentUser();

    // If trying to access protected route
    if (this.isProtectedRoute(currentPath)) {
      if (!user) {
        // Not logged in - redirect to login
        window.location.href = '/login';
        return false;
      }

      if (!this.canAccessRoute(user, currentPath)) {
        // Wrong role - redirect to home
        const homeUrl = this.getHomeDashboard(user.role);
        window.location.href = homeUrl;
        return false;
      }

      return true;
    }

    // If logged in and trying to access login page, redirect to home
    if ((currentPath === '/login' || currentPath === '/') && user) {
      const homeUrl = this.getHomeDashboard(user.role);
      window.location.href = homeUrl;
      return false;
    }

    return true;
  }
}

// Create singleton instance
const routeProtection = new RouteProtection();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = routeProtection;
}
