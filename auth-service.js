/**
 * Unified Authentication Service
 * Manages authentication for both HR and Manager roles
 */

class AuthService {
  constructor() {
    this.STORAGE_KEY = 'hrms_session';
    this.USERS_KEY = 'hrms_users_db';
    this.initializeUsers();
  }

  // Initialize default users in localStorage
  initializeUsers() {
    let users = this.getStoredUsers();
    if (!users || users.length === 0) {
      users = [
        {
          id: 'hr-001',
          name: 'Elena Vance',
          email: 'hr@sundew.com',
          password: 'password123', // In production, use hashed passwords
          role: 'hr',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCEBSgyvWhWcUFD0_sFk0Z5fn365kbumbRqrv0GfIZuJzhpIr_eUJNWeIBGOl3ilIv7K2R5i4SFlgLPUmMLkSojNB61S0Y-tspj1SNDCxbSMr327OASz9b24mdOjMqUvq2GKMtN4H5b8Se1gxiKRGOkQKZgNqW7QE59DYjL4guWRIGz4azjNWxeGTr8iJBEJBzwMmY-49ETYtOTynhsY_SqQ6vOxPyxzNOP3VZLhi8Skrjr1D3s7TyorKUMJf9YiCbHAmFsV07M9c'
        },
        {
          id: 'hr-002',
          name: 'Priya Sharma',
          email: 'priya@sundew.com',
          password: 'password123',
          role: 'hr',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'
        },
        {
          id: 'manager-001',
          name: 'Sarah Thompson',
          email: 'manager@sundew.com',
          password: 'password123',
          role: 'manager',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCEBSgyvWhWcUFD0_sFk0Z5fn365kbumbRqrv0GfIZuJzhpIr_eUJNWeIBGOl3ilIv7K2R5i4SFlgLPUmMLkSojNB61S0Y-tspj1SNDCxbSMr327OASz9b24mdOjMqUvq2GKMtN4H5b8Se1gxiKRGOkQKZgNqW7QE59DYjL4guWRIGz4azjNWxeGTr8iJBEJBzwMmY-49ETYtOTynhsY_SqQ6vOxPyxzNOP3VZLhi8Skrjr1D3s7TyorKUMJf9YiCbHAmFsV07M9c'
        },
        {
          id: 'manager-002',
          name: 'Marcus Vance',
          email: 'marcus@sundew.com',
          password: 'password123',
          role: 'manager',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'
        }
      ];
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    }
  }

  /**
   * Get all stored users from localStorage
   */
  getStoredUsers() {
    const users = localStorage.getItem(this.USERS_KEY);
    return users ? JSON.parse(users) : [];
  }

  /**
   * Authenticate user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object|null} - User object without password or null if invalid
   */
  login(email, password) {
    const users = this.getStoredUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      return null;
    }

    // Create session object (without password)
    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      loginTime: new Date().toISOString()
    };

    // Store session
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionUser));

    // Dispatch custom event for auth change
    window.dispatchEvent(new CustomEvent('authchange', { detail: sessionUser }));

    return sessionUser;
  }

  /**
   * Register a new user
   * @param {Object} userData - User data {name, email, password, role}
   * @returns {Object|null} - New user object or null if email exists
   */
  register(userData) {
    const users = this.getStoredUsers();
    
    // Check if email already exists
    if (users.find(u => u.email === userData.email)) {
      return null;
    }

    const newUser = {
      id: `${userData.role}-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      avatar: userData.avatar || this.getDefaultAvatar()
    };

    users.push(newUser);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

    // Auto-login after registration
    return this.login(userData.email, userData.password);
  }

  /**
   * Get current session user
   * @returns {Object|null} - Current user or null if not logged in
   */
  getCurrentUser() {
    const session = localStorage.getItem(this.STORAGE_KEY);
    return session ? JSON.parse(session) : null;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.getCurrentUser();
  }

  /**
   * Check if current user has required role
   * @param {string} requiredRole - Role to check
   * @returns {boolean}
   */
  hasRole(requiredRole) {
    const user = this.getCurrentUser();
    return user && user.role === requiredRole;
  }

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem(this.STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('authchange', { detail: null }));
  }

  /**
   * Get default avatar based on random selection
   * @returns {string}
   */
  getDefaultAvatar() {
    const avatars = [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'
    ];
    return avatars[Math.floor(Math.random() * avatars.length)];
  }

  /**
   * Update user profile
   * @param {Object} updates - Fields to update
   * @returns {Object|null} - Updated user or null if update fails
   */
  updateProfile(updates) {
    const user = this.getCurrentUser();
    if (!user) return null;

    const updatedUser = { ...user, ...updates };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedUser));
    
    window.dispatchEvent(new CustomEvent('authchange', { detail: updatedUser }));
    return updatedUser;
  }
}

// Create singleton instance
const authService = new AuthService();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = authService;
}
