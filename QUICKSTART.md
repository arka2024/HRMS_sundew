# HRMS RBAC System - Quick Start Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies
```bash
cd "HRMS-Sundew (Probation)"
npm install
```

### Step 2: Start the Application
```bash
npm run dev
```

Or start individual components:
```bash
# Terminal 1 - Main Server
npm run server

# Terminal 2 - HR Portal (in another terminal)
npm run hr

# Terminal 3 - Manager Portal (in another terminal)
npm run manager
```

### Step 3: Open Browser
```
http://localhost:3000
```

### Step 4: Login with Demo Credentials

#### Option A: HR Administrator
- **Email**: `hr@sundew.com`
- **Password**: `password123`
- **Result**: Redirects to `/hr/dashboard`

#### Option B: Manager
- **Email**: `manager@sundew.com`
- **Password**: `password123`
- **Result**: Redirects to `/manager/dashboard`

---

## ✨ Features Implemented

### ✅ Authentication
- [x] Unified login page with email/password
- [x] Registration with role selection
- [x] Session persistence (localStorage)
- [x] Demo user quick-login
- [x] Loading spinners and animations
- [x] Error message display

### ✅ Authorization & Access Control
- [x] Role-Based Access Control (RBAC)
- [x] Protected routes for HR and Manager
- [x] Automatic redirection on unauthorized access
- [x] Session validation on page load
- [x] Prevent direct URL access to unauthorized modules

### ✅ User Interface
- [x] Modern, professional login page
- [x] Unified header with user profile
- [x] Notification badge
- [x] User role display
- [x] Logout button with confirmation
- [x] Responsive design (desktop & tablet)
- [x] Toast notifications

### ✅ Session Management
- [x] Session creation on login
- [x] Session persistence across page refresh
- [x] Session clearing on logout
- [x] Auth state change events
- [x] Custom event listeners

### ✅ Security Features
- [x] Role-based navigation
- [x] Protected routes validation
- [x] Session expiry handling
- [x] Unauthorized access blocking
- [x] Logout with confirmation

---

## 📁 File Structure

```
HRMS-Sundew (Probation)/
├── login.html                    # Unified login page
├── auth-service.js              # Authentication service
├── route-protection.js          # Route protection logic
├── header-component.js          # Header component
├── server.js                    # Root server
├── package.json                 # Root dependencies
├── RBAC-SYSTEM-DOCUMENTATION.md # Full documentation
├── QUICKSTART.md                # This file
├── HR/
│   ├── index.html              # HR portal
│   ├── server.js               # HR backend (port 5000)
│   ├── package.json
│   ├── css/styles.css
│   └── js/app.js
└── manager/
    ├── index.html              # Manager portal
    ├── server.js               # Manager backend (port 5001)
    ├── package.json
    ├── css/styles.css
    └── js/app.js
```

---

## 🔌 Server Ports

| Service | Port | URL |
|---------|------|-----|
| Main Server | 3000 | http://localhost:3000 |
| HR Backend | 5000 | http://localhost:5000 |
| Manager Backend | 5001 | http://localhost:5001 |

---

## 🧪 Test Scenarios

### Test 1: HR Login & Dashboard Access
```
1. Go to http://localhost:3000
2. Login with hr@sundew.com / password123
3. ✓ Redirected to /hr/dashboard
4. ✓ Header shows "Elena Vance" + "HR Administrator"
5. ✓ Try /manager/dashboard → redirects back to /hr/dashboard
```

### Test 2: Manager Login & Dashboard Access
```
1. Go to http://localhost:3000
2. Login with manager@sundew.com / password123
3. ✓ Redirected to /manager/dashboard
4. ✓ Header shows "Sarah Thompson" + "Manager"
5. ✓ Try /hr/dashboard → redirects back to /manager/dashboard
```

### Test 3: Session Persistence
```
1. Login as HR
2. Refresh page (Ctrl+F5)
3. ✓ Still logged in
4. ✓ Session data preserved
```

### Test 4: Logout Flow
```
1. Login as any user
2. Click user avatar in header
3. Click "Sign Out"
4. Confirm logout
5. ✓ Redirected to /login.html
6. ✓ Session cleared
```

### Test 5: Unauthorized Access
```
1. Login as HR
2. Manually enter: http://localhost:3000/manager/dashboard
3. ✓ Automatically redirected to /hr/dashboard
4. ✓ Toast notification about unauthorized access
```

---

## 🔑 User Database

### Predefined Users

#### HR Users
```javascript
{
  id: "hr-001",
  name: "Elena Vance",
  email: "hr@sundew.com",
  password: "password123",
  role: "hr",
  avatar: "..."
}

{
  id: "hr-002",
  name: "Priya Sharma",
  email: "priya@sundew.com",
  password: "password123",
  role: "hr",
  avatar: "..."
}
```

#### Manager Users
```javascript
{
  id: "manager-001",
  name: "Sarah Thompson",
  email: "manager@sundew.com",
  password: "password123",
  role: "manager",
  avatar: "..."
}

{
  id: "manager-002",
  name: "Marcus Vance",
  email: "marcus@sundew.com",
  password: "password123",
  role: "manager",
  avatar: "..."
}
```

---

## 📋 Protected Routes

### HR Routes
- `/hr/dashboard` - Dashboard
- `/hr/employees` - Employee management
- `/hr/evaluations` - Evaluation review
- `/hr/reports` - Performance reports
- `/hr/probation` - Probation tracking
- `/hr/managers` - Manager assignments

### Manager Routes
- `/manager/dashboard` - Dashboard
- `/manager/team` - Team members
- `/manager/evaluations` - Evaluations
- `/manager/feedback` - Feedback
- `/manager/probation` - Probation reviews
- `/manager/actions` - Pending actions

---

## 🎨 UI Components

### Login Page Features
- ✓ Two tabs: "Sign In" and "Sign Up"
- ✓ Email validation
- ✓ Password strength indicator (coming soon)
- ✓ Demo credentials quick-link buttons
- ✓ Modern gradient background
- ✓ Responsive form design
- ✓ Toast notifications

### Header Features
- ✓ Logo and brand name
- ✓ Notification bell with badge
- ✓ User avatar
- ✓ User name and role display
- ✓ Dropdown menu
- ✓ Logout button with confirmation

---

## 🐛 Troubleshooting

### Problem: Can't login
**Solution**: Check that user email and password are correct:
```
HR: hr@sundew.com / password123
Manager: manager@sundew.com / password123
```

### Problem: Redirected to login after login
**Solution**: Check browser localStorage is enabled:
- Open DevTools (F12)
- Go to Application → LocalStorage
- Should see `hrms_session` key

### Problem: Wrong portal opens
**Solution**: Verify email/password credentials:
```javascript
// In console:
JSON.parse(localStorage.getItem('hrms_session'))
// Check the 'role' field
```

### Problem: Logout button not working
**Solution**: Try clearing localStorage and logging in again:
```javascript
localStorage.clear();
location.reload();
```

### Problem: "Cannot find module" error
**Solution**: Ensure dependencies are installed:
```bash
npm install
cd HR && npm install
cd ../manager && npm install
```

---

## 📚 Documentation

Full documentation available in:
- **RBAC-SYSTEM-DOCUMENTATION.md** - Complete technical documentation
- **QUICKSTART.md** - This file
- **Code comments** - Inline documentation in JS files

---

## 🚨 Important Notes

1. **This is development/demo mode** - Not suitable for production
2. **Passwords are in plain text** - Use hashed passwords in production
3. **Session stored in localStorage** - Use HTTP-only cookies in production
4. **No backend validation** - Implement server-side validation
5. **No HTTPS** - Use HTTPS in production

---

## 📞 Next Steps

1. ✅ Review the authentication system works correctly
2. ✅ Test all user roles and redirections
3. ✅ Verify session persistence
4. ✅ Test logout functionality
5. ✅ Review security documentation
6. 🔄 Customize users and routes as needed
7. 🚀 Implement backend authentication API
8. 🔐 Add security enhancements for production

---

## 🎯 Acceptance Criteria Checklist

- [x] ✓ HR login opens HR Portal
- [x] ✓ Manager login opens Manager Portal
- [x] ✓ Unauthorized route access is blocked
- [x] ✓ User remains logged in after refresh
- [x] ✓ Logout clears session and returns to Login
- [x] ✓ Role information is visible throughout the application
- [x] ✓ Secure role-based navigation implemented
- [x] ✓ Modern enterprise HRMS design
- [x] ✓ Responsive for desktop and tablet
- [x] ✓ Professional sidebar navigation
- [x] ✓ Top navigation bar with user profile
- [x] ✓ Loading spinner during authentication
- [x] ✓ Toast notifications for messages
- [x] ✓ Role-Based Access Control implemented
- [x] ✓ Protected routes working correctly
- [x] ✓ Session persistence active
- [x] ✓ Prevent direct URL unauthorized access

---

**Status**: ✅ COMPLETE - All features implemented and tested

**Last Updated**: June 15, 2024

**Ready for**: Development Testing & Production Planning
