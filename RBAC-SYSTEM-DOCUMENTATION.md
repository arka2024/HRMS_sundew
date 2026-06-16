# HRMS Role-Based Authentication & Access Control System

## Overview

This document describes the complete Role-Based Authentication and Access Control (RBAC) system implemented for the HRMS (Human Resource Management System) with separate portals for HR and Manager users.

## System Architecture

### Core Components

1. **auth-service.js** - Centralized authentication service
2. **route-protection.js** - Route protection and redirection logic
3. **login.html** - Unified login/registration page
4. **header-component.js** - Unified header with user profile and logout
5. **server.js** - Root server handling routing and requests

## User Roles

### 1. HR Administrator (`role: "hr"`)
- Email: `hr@sundew.com`
- Password: `password123`
- Portal: `/hr/dashboard`
- Permissions:
  - Access all HR routes
  - Manage employees
  - View evaluations
  - Generate reports
  - Probation tracking
  - Manager assignments

### 2. Manager (`role: "manager"`)
- Email: `manager@sundew.com`
- Password: `password123`
- Portal: `/manager/dashboard`
- Permissions:
  - Access all Manager routes
  - View team members
  - Submit evaluations
  - Review probation
  - Give feedback
  - Track performance

## LOGIN FLOW

### Step 1: User visits application
```
User → http://localhost:3000 → login.html
```

### Step 2: User submits credentials
```
Email: hr@sundew.com
Password: password123

Authentication checked against stored user database
↓
Success: User object created with session
Failure: Error message displayed
```

### Step 3: Session Created
User data stored in localStorage:
```javascript
{
  id: "hr-001",
  name: "Elena Vance",
  email: "hr@sundew.com",
  role: "hr",
  avatar: "...",
  loginTime: "2024-06-15T10:00:00Z"
}
```

### Step 4: Role-Based Redirection
```
If role = "hr" → Redirect to /hr/dashboard
If role = "manager" → Redirect to /manager/dashboard
```

## PROTECTED ROUTES

### HR Routes (Accessible only by HR users)
```
/hr/dashboard      - Main dashboard
/hr/employees      - Employee management
/hr/evaluations    - Evaluation review
/hr/reports        - Performance reports
/hr/probation      - Probation tracking
/hr/managers       - Manager assignments
```

### Manager Routes (Accessible only by Manager users)
```
/manager/dashboard     - Main dashboard
/manager/team         - Team members list
/manager/evaluations  - Submit evaluations
/manager/feedback     - Feedback submission
/manager/probation    - Probation reviews
/manager/actions      - Pending actions
```

### Route Protection Logic

1. **Unauthorized Access Attempt**
   ```
   Manager tries to access: /hr/dashboard
   ↓
   Redirect to: /manager/dashboard (user's home)
   ```

2. **Not Logged In**
   ```
   User tries to access: /hr/dashboard
   ↓
   No session found
   ↓
   Redirect to: /login.html
   ```

3. **Valid Access**
   ```
   HR user accesses: /hr/dashboard
   ↓
   Session verified
   ↓
   Role matches route
   ↓
   Grant access
   ```

## SESSION STRUCTURE

### Session Storage
- **Storage Key**: `hrms_session`
- **Storage Type**: localStorage (survives page refresh)

### Session Object
```javascript
{
  id: "hr-001",
  name: "Elena Vance",
  email: "hr@sundew.com",
  role: "hr",
  avatar: "https://...",
  loginTime: "2024-06-15T10:00:00Z"
}
```

### Persistence
- Session persists after page refresh
- Session survives browser close (localStorage)
- Session cleared on logout
- Session invalidated on role-based redirect block

## USER INTERFACE

### Header Components
Every portal displays a unified header with:

```
┌────────────────────────────────────────────────────┐
│  Logo    Navigation    Notifications    User Menu  │
│  HRMS    Dashboard     [Bell Icon]     [Avatar  ▼] │
│          Team          Unread: 5       Elena V.   │
│          Evaluations                   HR Admin   │
│          Reports                       [Logout]   │
└────────────────────────────────────────────────────┘
```

### Header Features
- **User Name**: Displays logged-in user
- **User Role**: Shows role label (HR Administrator / Manager)
- **Profile Picture**: User avatar image
- **Notification Badge**: Shows unread notifications count
- **Logout Button**: Clears session and redirects to login

## AUTHENTICATION FEATURES

### Login Features
- ✓ Email and password validation
- ✓ Role selection for new users
- ✓ Error messages for invalid credentials
- ✓ Loading spinner during authentication
- ✓ Demo user quick-login buttons
- ✓ Tab-based login/registration UI

### Security Features
- ✓ Role-Based Access Control (RBAC)
- ✓ Protected routes with session validation
- ✓ Session persistence with localStorage
- ✓ Automatic redirect on unauthorized access
- ✓ Logout clears all session data
- ✓ Custom event dispatch on auth state change

## LOGOUT FLOW

### Step 1: User clicks Logout
```
Sidebar → Logout Button → Confirmation Dialog
```

### Step 2: Confirmation
```
Dialog: "Are you sure you want to sign out?"
Options: [Cancel] [Sign Out]
```

### Step 3: Session Cleared
```javascript
// Clear session data
localStorage.removeItem('hrms_session');

// Dispatch auth change event
window.dispatchEvent(new CustomEvent('authchange', { detail: null }));
```

### Step 4: Redirect to Login
```
User → /login.html
```

## API ENDPOINTS

### User Authentication
The system uses localStorage-based authentication. In production, replace with backend API:

```javascript
// Suggested backend endpoints
POST /api/auth/login
  Request: { email, password }
  Response: { user, token }

POST /api/auth/register
  Request: { name, email, password, role }
  Response: { user, token }

POST /api/auth/logout
  Response: { success: true }

GET /api/auth/verify
  Response: { user }
```

## FILE STRUCTURE

```
HRMS-Sundew (Probation)/
├── login.html                 # Unified login page
├── auth-service.js           # Authentication service
├── route-protection.js       # Route protection logic
├── header-component.js       # Header UI component
├── server.js                 # Root server
├── HR/
│   ├── index.html           # HR portal
│   ├── server.js            # HR backend
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── app.js           # HR app logic
├── manager/
│   ├── index.html           # Manager portal
│   ├── server.js            # Manager backend
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── app.js           # Manager app logic
└── Associate/               # Additional folder
```

## RUNNING THE APPLICATION

### Prerequisites
- Node.js v16+
- npm

### Installation
```bash
cd "HRMS-Sundew (Probation)"
npm install
```

### Development Mode
```bash
npm run dev
```

### Access Points
- **Main Portal**: http://localhost:3000
- **Login Page**: http://localhost:3000/login.html
- **HR Dashboard**: http://localhost:3000/hr/dashboard
- **Manager Dashboard**: http://localhost:3000/manager/dashboard

## TESTING SCENARIOS

### Scenario 1: HR Login
1. Open http://localhost:3000
2. Enter email: `hr@sundew.com`
3. Enter password: `password123`
4. Click "Sign In"
5. ✓ Redirected to `/hr/dashboard`
6. ✓ Header shows "Elena Vance" and "HR Administrator"

### Scenario 2: Manager Login
1. Open http://localhost:3000
2. Enter email: `manager@sundew.com`
3. Enter password: `password123`
4. Click "Sign In"
5. ✓ Redirected to `/manager/dashboard`
6. ✓ Header shows "Sarah Thompson" and "Manager"

### Scenario 3: Unauthorized Route Access
1. Login as HR: `hr@sundew.com`
2. Try to access: http://localhost:3000/manager/dashboard
3. ✓ Automatically redirected to `/hr/dashboard`
4. ✓ Toast notification shows role mismatch

### Scenario 4: Session Persistence
1. Login as HR
2. Refresh page (F5)
3. ✓ Still logged in
4. ✓ Header still shows user info

### Scenario 5: Logout
1. Login as any user
2. Click user avatar → Logout
3. Confirm logout
4. ✓ Redirected to `/login.html`
5. ✓ Accessing /hr/dashboard redirects to /login.html

## CUSTOMIZATION

### Adding New Users
Edit `auth-service.js` in the `initializeUsers()` method:

```javascript
initializeUsers() {
  let users = this.getStoredUsers();
  if (!users || users.length === 0) {
    users = [
      // ... existing users
      {
        id: 'hr-003',
        name: 'New HR User',
        email: 'newemail@sundew.com',
        password: 'password123',
        role: 'hr',
        avatar: 'https://...'
      }
    ];
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }
}
```

### Adding New Routes
Edit `route-protection.js`:

```javascript
this.PROTECTED_ROUTES = {
  hr: [
    // ... existing routes
    '/hr/new-page'  // Add new route
  ],
  manager: [
    // ... existing routes
    '/manager/new-page'  // Add new route
  ]
};
```

### Customizing Header
Edit `header-component.js` to modify:
- Header styling
- User info display
- Dropdown menu items
- Notification handling

## SECURITY CONSIDERATIONS

### Current Implementation (Development)
- ✓ Client-side session management
- ✓ localStorage-based authentication
- ✓ In-memory user database
- ⚠️ Passwords stored in plain text

### Production Recommendations
1. **Replace localStorage with HTTP-only cookies**
2. **Implement backend authentication API**
3. **Hash passwords using bcrypt or similar**
4. **Add JWT token validation**
5. **Implement HTTPS/SSL**
6. **Add rate limiting to login endpoint**
7. **Implement session timeout**
8. **Add audit logging**
9. **Use secure backend database**
10. **Implement 2FA/MFA for admin accounts**

## TROUBLESHOOTING

### Issue: User redirected to login after refresh
**Solution**: Check localStorage is enabled in browser
```javascript
localStorage.setItem('test', '1');
localStorage.removeItem('test');
```

### Issue: Wrong portal opens after login
**Solution**: Verify user role in localStorage
```javascript
const user = JSON.parse(localStorage.getItem('hrms_session'));
console.log(user.role); // Should be 'hr' or 'manager'
```

### Issue: Logout not working
**Solution**: Ensure logout function is not overridden
```javascript
// In console, check:
typeof logout === 'function' // Should be true
```

### Issue: Header not showing user info
**Solution**: Verify auth-service.js is loaded
```javascript
console.log(typeof authService); // Should be 'object'
```

## FUTURE ENHANCEMENTS

1. **Multi-Factor Authentication (MFA)**
   - SMS OTP verification
   - Google Authenticator integration

2. **Role Hierarchy**
   - Super Admin role
   - Department-level permissions
   - Custom role creation

3. **Session Management**
   - Multiple active sessions
   - Device management
   - Session timeout warnings

4. **Audit Trail**
   - Login history
   - Action logging
   - Compliance reporting

5. **SSO Integration**
   - Google login
   - Microsoft Active Directory
   - SAML support

## CONTACT & SUPPORT

For issues or questions about the RBAC system:
1. Review this documentation
2. Check browser console for errors
3. Verify localStorage data
4. Test with demo credentials

## VERSION HISTORY

- **v1.0.0** - Initial RBAC system implementation
  - Unified login page
  - Auth service with session management
  - Route protection for HR and Manager roles
  - Header component with user profile
  - Logout functionality

---

**Last Updated**: June 15, 2024
**System Status**: Production Ready (Development Mode)
