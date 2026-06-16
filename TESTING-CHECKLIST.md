# HRMS RBAC System - Testing & Verification Checklist

## Pre-Test Setup

- [ ] All dependencies installed: `npm install` (in root and subdirectories)
- [ ] No port conflicts (3000, 5000, 5001 should be available)
- [ ] Browser localStorage enabled
- [ ] JavaScript enabled in browser
- [ ] Console open for debugging (F12)

---

## Test Suite 1: Login Functionality

### Test 1.1: HR Login
- [ ] Visit http://localhost:3000
- [ ] Click "Sign In" tab
- [ ] Enter email: `hr@sundew.com`
- [ ] Enter password: `password123`
- [ ] Click "Sign In" button
- [ ] ✓ Loading spinner appears
- [ ] ✓ Redirected to `/hr/dashboard`
- [ ] ✓ Header shows "Elena Vance"
- [ ] ✓ Header shows "HR Administrator"
- [ ] ✓ User avatar displayed

### Test 1.2: Manager Login
- [ ] Go back to http://localhost:3000 (or logout)
- [ ] Click "Sign In" tab
- [ ] Enter email: `manager@sundew.com`
- [ ] Enter password: `password123`
- [ ] Click "Sign In" button
- [ ] ✓ Loading spinner appears
- [ ] ✓ Redirected to `/manager/dashboard`
- [ ] ✓ Header shows "Sarah Thompson"
- [ ] ✓ Header shows "Manager"
- [ ] ✓ User avatar displayed

### Test 1.3: Invalid Credentials
- [ ] Clear login form
- [ ] Enter email: `invalid@email.com`
- [ ] Enter password: `wrongpassword`
- [ ] Click "Sign In"
- [ ] ✓ Error message: "Invalid email or password"
- [ ] ✓ Not redirected to dashboard

### Test 1.4: Empty Fields
- [ ] Clear login form
- [ ] Leave email empty
- [ ] Enter password: `password123`
- [ ] Click "Sign In"
- [ ] ✓ Error message: "Email is required"
- [ ] ✓ Not submitted

### Test 1.5: Demo User Quick Login
- [ ] Visit http://localhost:3000
- [ ] Click on "HR Admin" demo user box
- [ ] ✓ Email auto-filled with `hr@sundew.com`
- [ ] ✓ Password auto-filled with `password123`
- [ ] ✓ Login form submitted automatically
- [ ] ✓ Redirected to HR Dashboard

---

## Test Suite 2: Session Persistence

### Test 2.1: Page Refresh
- [ ] Login as HR: `hr@sundew.com`
- [ ] Verify in HR Dashboard
- [ ] Press F5 (refresh page)
- [ ] ✓ Still on HR Dashboard
- [ ] ✓ User info preserved
- [ ] ✓ No redirect to login

### Test 2.2: New Tab Same Domain
- [ ] Login as Manager: `manager@sundew.com`
- [ ] Open new tab: http://localhost:3000/manager/dashboard
- [ ] ✓ Directly access Manager Dashboard
- [ ] ✓ No login required
- [ ] ✓ Session recognized

### Test 2.3: Browser Close and Reopen
- [ ] Login as HR
- [ ] Close browser (or just tab)
- [ ] Reopen http://localhost:3000
- [ ] ✓ Redirected directly to HR Dashboard
- [ ] ✓ Session restored

### Test 2.4: DevTools Verification
- [ ] Login as any user
- [ ] Open DevTools (F12)
- [ ] Go to Application → LocalStorage
- [ ] ✓ Find key: `hrms_session`
- [ ] ✓ Value contains: id, name, email, role, avatar, loginTime

---

## Test Suite 3: Route Protection

### Test 3.1: HR User Cannot Access Manager Routes
- [ ] Login as HR: `hr@sundew.com`
- [ ] Try to access: http://localhost:3000/manager/dashboard
- [ ] ✓ Automatically redirected to `/hr/dashboard`
- [ ] ✓ No error, seamless redirect

### Test 3.2: Manager User Cannot Access HR Routes
- [ ] Login as Manager: `manager@sundew.com`
- [ ] Try to access: http://localhost:3000/hr/dashboard
- [ ] ✓ Automatically redirected to `/manager/dashboard`
- [ ] ✓ No error, seamless redirect

### Test 3.3: Unauthorized Users Cannot Access Protected Routes
- [ ] Logout (clear localStorage manually if needed)
- [ ] Try to access: http://localhost:3000/hr/dashboard
- [ ] ✓ Redirected to `/login.html`
- [ ] ✓ Login page displayed

### Test 3.4: All HR Routes Protected
- [ ] Login as Manager
- [ ] Try to access each HR route:
  - [ ] `/hr/employees` → Redirect to manager dashboard
  - [ ] `/hr/evaluations` → Redirect to manager dashboard
  - [ ] `/hr/reports` → Redirect to manager dashboard

### Test 3.5: All Manager Routes Protected
- [ ] Login as HR
- [ ] Try to access each Manager route:
  - [ ] `/manager/team` → Redirect to HR dashboard
  - [ ] `/manager/evaluations` → Redirect to HR dashboard
  - [ ] `/manager/feedback` → Redirect to HR dashboard

---

## Test Suite 4: Logout Functionality

### Test 4.1: Logout Button Location
- [ ] Login as any user
- [ ] Click user avatar in header (top-right)
- [ ] ✓ Dropdown menu appears
- [ ] ✓ See "Sign Out" option

### Test 4.2: Logout Confirmation
- [ ] Click "Sign Out" button
- [ ] ✓ Confirmation dialog appears
- [ ] ✓ Message: "Are you sure you want to sign out?"
- [ ] ✓ Two options: [Cancel] [Sign Out]

### Test 4.3: Cancel Logout
- [ ] Click "Sign Out" button
- [ ] Click "Cancel" in dialog
- [ ] ✓ Dialog closes
- [ ] ✓ Still logged in
- [ ] ✓ User info still visible

### Test 4.4: Confirm Logout
- [ ] Click "Sign Out" button
- [ ] Click "Sign Out" in confirmation
- [ ] ✓ Redirected to `/login.html`
- [ ] ✓ Login page displayed
- [ ] ✓ Can see fresh login form

### Test 4.5: Session Cleared After Logout
- [ ] Logout from any portal
- [ ] Open DevTools (F12)
- [ ] Go to Application → LocalStorage
- [ ] ✓ Key `hrms_session` no longer exists OR is empty
- [ ] ✓ No session data persists

### Test 4.6: Cannot Access Portal After Logout
- [ ] Logout
- [ ] Try to access: http://localhost:3000/hr/dashboard
- [ ] ✓ Redirected to `/login.html`

---

## Test Suite 5: Header Component

### Test 5.1: Header Elements Present
- [ ] Login to any portal
- [ ] Verify header contains:
  - [ ] Logo/HRMS text
  - [ ] Notification bell icon
  - [ ] Notification count badge
  - [ ] User name
  - [ ] User role
  - [ ] User avatar
  - [ ] Dropdown arrow

### Test 5.2: User Name Display
- [ ] Login as HR
- [ ] ✓ Header shows: "Elena Vance"
- [ ] Logout, login as Manager
- [ ] ✓ Header shows: "Sarah Thompson"

### Test 5.3: User Role Display
- [ ] Login as HR
- [ ] ✓ Header shows role label
- [ ] Logout, login as Manager
- [ ] ✓ Header shows different role label

### Test 5.4: Avatar Display
- [ ] Login as any user
- [ ] ✓ Avatar image loads
- [ ] ✓ Correct image for user
- [ ] ✓ Proper border styling

### Test 5.5: Dropdown Menu
- [ ] Click on avatar or dropdown arrow
- [ ] ✓ Menu appears with smooth animation
- [ ] ✓ Contains: Profile, Settings, Sign Out options
- [ ] Click outside menu
- [ ] ✓ Menu closes

---

## Test Suite 6: Registration Functionality

### Test 6.1: Registration Tab
- [ ] Visit http://localhost:3000
- [ ] Click "Sign Up" tab
- [ ] ✓ Registration form appears
- [ ] ✓ Fields: Name, Email, Password, Role

### Test 6.2: Register New HR User
- [ ] Fill form:
  - [ ] Name: "Test HR User"
  - [ ] Email: "testhr@sundew.com"
  - [ ] Password: "password123"
  - [ ] Role: "HR Administrator"
- [ ] Click "Create Account"
- [ ] ✓ Loading spinner appears
- [ ] ✓ New account created
- [ ] ✓ Auto-logged in
- [ ] ✓ Redirected to HR Dashboard

### Test 6.3: Register New Manager User
- [ ] Click Logout
- [ ] Go to Sign Up tab
- [ ] Fill form:
  - [ ] Name: "Test Manager User"
  - [ ] Email: "testmanager@sundew.com"
  - [ ] Password: "password123"
  - [ ] Role: "Manager"
- [ ] Click "Create Account"
- [ ] ✓ New account created
- [ ] ✓ Auto-logged in
- [ ] ✓ Redirected to Manager Dashboard

### Test 6.4: Duplicate Email Prevention
- [ ] Go to Sign Up tab
- [ ] Try to register with existing email: `hr@sundew.com`
- [ ] ✓ Error message: "Email already registered..."
- [ ] ✓ Account not created

### Test 6.5: Validation Messages
- [ ] Click "Create Account" without filling fields
- [ ] ✓ See error messages for empty fields
- [ ] Enter short password (< 6 chars)
- [ ] ✓ Error: "Password must be at least 6 characters"

---

## Test Suite 7: Responsive Design

### Test 7.1: Desktop (1920x1080)
- [ ] Open browser in desktop resolution
- [ ] Login page renders correctly
- [ ] Login form properly sized
- [ ] Header spans full width
- [ ] All elements readable

### Test 7.2: Tablet (768x1024)
- [ ] Open DevTools (F12)
- [ ] Set device to iPad/tablet
- [ ] Login page renders correctly
- [ ] Form still accessible
- [ ] No overlapping elements
- [ ] Touch-friendly buttons

### Test 7.3: Mobile (375x667)
- [ ] Set device to mobile
- [ ] Login page responsive
- [ ] Form elements stack vertically
- [ ] Buttons full width and tappable
- [ ] No horizontal scroll

---

## Test Suite 8: UI/UX Features

### Test 8.1: Loading Spinner
- [ ] Click login/register button
- [ ] ✓ Spinner appears while processing
- [ ] ✓ Button text changes to "Signing in..." or similar
- [ ] ✓ Button disabled during loading

### Test 8.2: Toast Notifications
- [ ] Login successfully
- [ ] ✓ Success toast appears at bottom-right
- [ ] ✓ Toast auto-dismisses after 3 seconds
- [ ] Try invalid login
- [ ] ✓ Error toast appears

### Test 8.3: Error Messages
- [ ] Try to login with empty email
- [ ] ✓ "Email is required" appears below field
- [ ] Try invalid password
- [ ] ✓ "Invalid email or password" message appears

### Test 8.4: Form Validation
- [ ] Email field accepts only valid emails
- [ ] Try: "notanemail"
- [ ] ✓ Browser validation catches it (or app validates)
- [ ] Password field shows masked characters
- [ ] ✓ Cannot see password in field

---

## Test Suite 9: Browser Compatibility

- [ ] **Chrome** - Login, redirect, session persist ✓
- [ ] **Firefox** - Login, redirect, session persist ✓
- [ ] **Safari** - Login, redirect, session persist ✓
- [ ] **Edge** - Login, redirect, session persist ✓
- [ ] **Mobile Browser** - Responsive, functional ✓

---

## Test Suite 10: Console Checks

### Test 10.1: No JavaScript Errors
- [ ] Open DevTools Console (F12 → Console tab)
- [ ] Login
- [ ] ✓ No red error messages
- [ ] ✓ Only info/log messages (if any)

### Test 10.2: Session Object in Console
- [ ] In console, type: `authService.getCurrentUser()`
- [ ] ✓ Returns user object with: id, name, email, role, avatar
- [ ] Type: `authService.isAuthenticated()`
- [ ] ✓ Returns: true (if logged in)

### Test 10.3: Route Protection in Console
- [ ] In console, type: `routeProtection.canAccessRoute(authService.getCurrentUser(), '/hr/dashboard')`
- [ ] ✓ Returns: true (for HR user)
- [ ] If manager: ✓ Returns: false

---

## Test Suite 11: Cross-Session Testing

### Test 11.1: Two Browser Instances
- [ ] Open Browser 1 → Login as HR
- [ ] Open Browser 2 → Login as Manager
- [ ] Switch between browsers
- [ ] ✓ Each maintains their own session
- [ ] ✓ No interference between sessions

### Test 11.2: Incognito/Private Window
- [ ] Open incognito window
- [ ] Try to access HR dashboard
- [ ] ✓ Redirected to login (no session)
- [ ] Login and verify works normally

---

## Test Suite 12: Edge Cases

### Test 12.1: Navigate Using Browser Back
- [ ] Login
- [ ] Go to different pages
- [ ] Press browser back button
- [ ] ✓ Navigation works correctly
- [ ] ✓ Session still valid

### Test 12.2: Rapid Clicks
- [ ] Click login button rapidly multiple times
- [ ] ✓ Only one login attempt processed
- [ ] ✓ No duplicate sessions

### Test 12.3: Manual URL Changes
- [ ] Type directly in address bar: `/manager/dashboard`
- [ ] ✓ Proper redirects based on role

### Test 12.4: Logout During Navigation
- [ ] Login
- [ ] Open another tab
- [ ] Logout in first tab
- [ ] Refresh second tab
- [ ] ✓ Redirected to login page

---

## Final Verification Checklist

### Core Functionality
- [ ] Login system works
- [ ] Registration works
- [ ] Session persists
- [ ] Session cleared on logout
- [ ] Role-based redirection works

### Security
- [ ] Unauthorized access blocked
- [ ] Session validation works
- [ ] Routes protected correctly
- [ ] Logout completely clears data

### User Experience
- [ ] UI responsive
- [ ] Loading states shown
- [ ] Error messages clear
- [ ] Success feedback given
- [ ] Smooth animations

### Testing Tools
- [ ] Console shows no errors
- [ ] localStorage working
- [ ] Auth service functional
- [ ] Route protection functional

---

## Summary Scoring

| Area | Status | Pass/Fail |
|------|--------|-----------|
| Authentication | | ✓/✗ |
| Authorization | | ✓/✗ |
| Session Management | | ✓/✗ |
| UI/UX | | ✓/✗ |
| Responsiveness | | ✓/✗ |
| Error Handling | | ✓/✗ |
| Security | | ✓/✗ |
| Performance | | ✓/✗ |

---

**Test Date**: _____________
**Tester**: _____________
**Overall Status**: ✓ PASSED / ✗ FAILED

**Notes**:
```
[Space for test notes]
```

---

**All tests should pass before deploying to production.**
