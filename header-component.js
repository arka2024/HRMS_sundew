/**
 * Unified Header Component
 * Manages header display and logout functionality
 */

class HeaderComponent {
  constructor() {
    this.currentUser = authService.getCurrentUser();
    this.initialize();
    this.setupAuthListener();
  }

  initialize() {
    this.render();
    this.attachEventListeners();
  }

  setupAuthListener() {
    window.addEventListener('authchange', (event) => {
      this.currentUser = event.detail;
      if (this.currentUser) {
        this.render();
      }
    });
  }

  render() {
    const header = document.getElementById('app-header');
    if (!header || !this.currentUser) return;

    header.innerHTML = `
      <div class="header-wrapper">
        <div class="header-left">
          <div class="logo">
            <span class="logo-icon">⚙️</span>
            <span class="logo-text">HRMS</span>
          </div>
        </div>
        <div class="header-right">
          <div class="notification-btn">
            <span class="material-symbols-outlined">notifications</span>
            <span class="notification-badge" id="notification-count">0</span>
          </div>
          <div class="user-profile">
            <img src="${this.currentUser.avatar}" alt="${this.currentUser.name}" class="user-avatar" />
            <div class="user-info">
              <div class="user-name">${this.currentUser.name}</div>
              <div class="user-role">${this.getRoleLabel(this.currentUser.role)}</div>
            </div>
            <button class="profile-dropdown-btn" id="profile-dropdown-btn">
              <span class="material-symbols-outlined">expand_more</span>
            </button>
            <div class="profile-dropdown" id="profile-dropdown">
              <div class="dropdown-item">
                <span class="material-symbols-outlined">person</span>
                <span>My Profile</span>
              </div>
              <div class="dropdown-item">
                <span class="material-symbols-outlined">settings</span>
                <span>Settings</span>
              </div>
              <hr class="dropdown-divider" />
              <div class="dropdown-item logout" id="logout-btn">
                <span class="material-symbols-outlined">logout</span>
                <span>Sign Out</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add styles if not already added
    if (!document.getElementById('header-styles')) {
      this.addStyles();
    }
  }

  getRoleLabel(role) {
    const labels = {
      'hr': '👤 HR Administrator',
      'manager': '👥 Manager'
    };
    return labels[role] || role;
  }

  attachEventListeners() {
    const dropdownBtn = document.getElementById('profile-dropdown-btn');
    const dropdown = document.getElementById('profile-dropdown');
    const logoutBtn = document.getElementById('logout-btn');

    if (dropdownBtn && dropdown) {
      dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-profile')) {
          dropdown.classList.remove('active');
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.handleLogout();
      });
    }
  }

  handleLogout() {
    // Show confirmation
    if (confirm('Are you sure you want to sign out?')) {
      authService.logout();
      window.location.href = '/login';
    }
  }

  addStyles() {
    const style = document.createElement('style');
    style.id = 'header-styles';
    style.textContent = `
      #app-header {
        background: white;
        border-bottom: 1px solid #E0E0E0;
        padding: 0 24px;
        position: sticky;
        top: 0;
        z-index: 100;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .header-wrapper {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 60px;
      }

      .header-left {
        display: flex;
        align-items: center;
      }

      .logo {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 20px;
        font-weight: 700;
        color: #667eea;
      }

      .logo-icon {
        font-size: 28px;
      }

      .logo-text {
        color: #1a1a1a;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 24px;
      }

      .notification-btn {
        position: relative;
        cursor: pointer;
        color: #666;
        font-size: 24px;
        transition: color 0.3s ease;
      }

      .notification-btn:hover {
        color: #667eea;
      }

      .notification-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #F06292;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 600;
      }

      .user-profile {
        display: flex;
        align-items: center;
        gap: 12px;
        position: relative;
      }

      .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid #667eea;
      }

      .user-info {
        display: flex;
        flex-direction: column;
      }

      .user-name {
        font-size: 13px;
        font-weight: 600;
        color: #1a1a1a;
      }

      .user-role {
        font-size: 11px;
        color: #999;
      }

      .profile-dropdown-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: #666;
        font-size: 20px;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.3s ease;
      }

      .profile-dropdown-btn:hover {
        color: #667eea;
      }

      .profile-dropdown-btn.active .material-symbols-outlined {
        transform: rotate(180deg);
      }

      .profile-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        border: 1px solid #E0E0E0;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        min-width: 200px;
        margin-top: 8px;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-8px);
        transition: all 0.3s ease;
        z-index: 1000;
      }

      .profile-dropdown.active {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .dropdown-item {
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 13px;
        color: #1a1a1a;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .dropdown-item:hover {
        background: #F5F5F5;
      }

      .dropdown-item.logout {
        color: #F06292;
      }

      .dropdown-item .material-symbols-outlined {
        font-size: 18px;
      }

      .dropdown-divider {
        border: none;
        border-top: 1px solid #E0E0E0;
        margin: 8px 0;
      }

      @media (max-width: 768px) {
        #app-header {
          padding: 0 16px;
        }

        .header-right {
          gap: 16px;
        }

        .user-info {
          display: none;
        }

        .profile-dropdown-btn {
          margin-left: 8px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  updateNotificationCount(count) {
    const badge = document.getElementById('notification-count');
    if (badge) {
      badge.textContent = count;
    }
  }
}

// Create singleton instance
let headerComponent = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('app-header')) {
    headerComponent = new HeaderComponent();
  }
});

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HeaderComponent;
}
