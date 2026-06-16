# HRMS RBAC System - Visual Reference Guide

## 🎨 System Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                    HRMS RBAC SYSTEM                            │
│                   Complete Architecture                        │
└────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                   🌐 CLIENT LAYER (Browser)                │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │  1. LOGIN PAGE (login.html)                         │  │
│  │     ┌─────────────────────────────────────────────┐ │  │
│  │     │ Email:    ________________                  │ │  │
│  │     │ Password: ________________                  │ │  │
│  │     │ [Sign In]  [Sign Up] [Demo]               │ │  │
│  │     └─────────────────────────────────────────────┘ │  │
│  │                        ↓                           │  │
│  │  2. AUTH SERVICE (auth-service.js)                │  │
│  │     ┌─────────────────────────────────────────────┐ │  │
│  │     │ • Validate credentials                       │ │  │
│  │     │ • Create session                             │ │  │
│  │     │ • Store in localStorage                      │ │  │
│  │     │ • Manage user database                       │ │  │
│  │     └─────────────────────────────────────────────┘ │  │
│  │                        ↓                           │  │
│  │  3. ROUTE PROTECTION (route-protection.js)        │  │
│  │     ┌─────────────────────────────────────────────┐ │  │
│  │     │ • Check user role                            │ │  │
│  │     │ • Validate route access                      │ │  │
│  │     │ • Smart redirection                          │ │  │
│  │     └─────────────────────────────────────────────┘ │  │
│  │                        ↓                           │  │
│  │  4. ROLE-BASED REDIRECT                           │  │
│  │     ┌──────────────────────────────────────────┐   │  │
│  │     │                                          │   │  │
│  │     │  IF role = "HR"                          │   │  │
│  │     │  → /hr/dashboard                         │   │  │
│  │     │                                          │   │  │
│  │     │  IF role = "manager"                     │   │  │
│  │     │  → /manager/dashboard                    │   │  │
│  │     │                                          │   │  │
│  │     └──────────────────────────────────────────┘   │  │
│  │                        ↓                           │  │
│  │  5. PORTAL + HEADER                               │  │
│  │     ┌─────────────────────────────────────────────┐ │  │
│  │     │ ┌─────────────────────────────────────────┐ │ │  │
│  │     │ │ Logo    Nav    [🔔] Elena Vance [▼]    │ │ │  │
│  │     │ │ HRMS    [menu]  5    HR Admin          │ │ │  │
│  │     │ └─────────────────────────────────────────┘ │ │  │
│  │     │                                            │ │  │
│  │     │ [Dashboard Content Area]                  │ │  │
│  │     │                                            │ │  │
│  │     └─────────────────────────────────────────────┘ │  │
│  │                                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           localStorage Session Storage             │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │ Key: 'hrms_session'                           │ │  │
│  │  │ Value: {                                       │ │  │
│  │  │   id: "hr-001",                              │ │  │
│  │  │   name: "Elena Vance",                        │ │  │
│  │  │   email: "hr@sundew.com",                     │ │  │
│  │  │   role: "hr",                                 │ │  │
│  │  │   avatar: "https://...",                      │ │  │
│  │  │   loginTime: "2024-06-15T10:00:00Z"          │ │  │
│  │  │ }                                              │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  │                                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│               🖥️  SERVER LAYER (Node.js)                   │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   server.js (Port 3000)               │ │
│  │                                                        │ │
│  │  Routes:                                              │ │
│  │  GET /            → login.html                        │ │
│  │  GET /login       → login.html                        │ │
│  │  GET /auth-service.js  → Shared auth service        │ │
│  │  GET /hr/*        → HR portal files                   │ │
│  │  GET /manager/*   → Manager portal files              │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│           ↙                          ↘                       │
│  ┌──────────────────┐        ┌──────────────────────────┐   │
│  │   HR PORTAL      │        │   MANAGER PORTAL         │   │
│  │   (Port 5000)    │        │   (Port 5001)            │   │
│  │                  │        │                          │   │
│  │ • Dashboard      │        │ • Dashboard              │   │
│  │ • Employees      │        │ • Team Members           │   │
│  │ • Evaluations    │        │ • Evaluations            │   │
│  │ • Reports        │        │ • Feedback               │   │
│  │ • Probation      │        │ • Probation Reviews      │   │
│  │ • Managers       │        │ • Pending Actions        │   │
│  │                  │        │                          │   │
│  └──────────────────┘        └──────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Authentication Flow

```
START
  ↓
┌─────────────────────────────────────┐
│  User visits http://localhost:3000  │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│  Check localStorage for session?    │
└─────────────────────────────────────┘
  ↙ YES                          NO ↘
  │                               │
  ↓                               ↓
┌──────────────────────┐  ┌─────────────────────────┐
│ Session Found        │  │ No Session              │
│ Load user object     │  │ Show login.html         │
│ Update last login    │  │                         │
└──────────────────────┘  └─────────────────────────┘
  ↓                               ↓
┌──────────────────────────────────────────────────┐
│      User Enters Email & Password                │
│      (or clicks Demo User Button)                │
└──────────────────────────────────────────────────┘
  ↓
┌──────────────────────────────────────────────────┐
│  authService.login(email, password)              │
│  or                                              │
│  authService.register(name, email, pass, role)   │
└──────────────────────────────────────────────────┘
  ↓
┌──────────────────────────────────────────────────┐
│  Validate Credentials                            │
│  Check user database                             │
└──────────────────────────────────────────────────┘
  ↓
  ├─ INVALID → Show error, stay on login
  │
  └─ VALID → Continue
     ↓
┌──────────────────────────────────────────────────┐
│  Create Session Object:                          │
│  {                                               │
│    id: "...",                                    │
│    name: "...",                                  │
│    email: "...",                                 │
│    role: "hr" or "manager",                      │
│    avatar: "...",                                │
│    loginTime: ISO_STRING                         │
│  }                                               │
└──────────────────────────────────────────────────┘
  ↓
┌──────────────────────────────────────────────────┐
│  localStorage.setItem('hrms_session', user_json) │
└──────────────────────────────────────────────────┘
  ↓
┌──────────────────────────────────────────────────┐
│  Route Protection Check                          │
│  routeProtection.getHomeDashboard(role)          │
└──────────────────────────────────────────────────┘
  ↓
  ├─ IF role = "hr" → /hr/dashboard
  │                      ↓
  │                  Load HR Portal
  │                  Show HR Header
  │
  └─ IF role = "manager" → /manager/dashboard
                              ↓
                          Load Manager Portal
                          Show Manager Header
  ↓
┌──────────────────────────────────────────────────┐
│  User in Portal                                  │
│  Can access role-specific pages                  │
│  Cannot access other role's pages                │
│  Can use all features                            │
└──────────────────────────────────────────────────┘
  ↓
┌──────────────────────────────────────────────────┐
│  User clicks Logout                              │
│  Show confirmation dialog                        │
└──────────────────────────────────────────────────┘
  ↓
  ├─ Cancel → Return to portal, stay logged in
  │
  └─ Confirm → Continue
     ↓
┌──────────────────────────────────────────────────┐
│  authService.logout()                            │
│  localStorage.removeItem('hrms_session')         │
│  Dispatch 'authchange' event                     │
└──────────────────────────────────────────────────┘
  ↓
┌──────────────────────────────────────────────────┐
│  Redirect to /login.html                         │
│  User back at login page                         │
└──────────────────────────────────────────────────┘
  ↓
END
```

---

## 🔐 Route Protection Logic

```
┌──────────────────────────────────────────────────┐
│  User tries to access: /hr/dashboard             │
│  (From address bar or navigation)                │
└──────────────────────────────────────────────────┘
  ↓
┌──────────────────────────────────────────────────┐
│  enforceHRAccess() or enforceManagerAccess()    │
└──────────────────────────────────────────────────┘
  ↓
┌──────────────────────────────────────────────────┐
│  Step 1: Get User from localStorage              │
│  user = authService.getCurrentUser()             │
└──────────────────────────────────────────────────┘
  ↓
  ├─ User = null (Not Logged In)
  │    ↓
  │    Redirect to /login.html
  │
  └─ User exists → Continue
     ↓
┌──────────────────────────────────────────────────┐
│  Step 2: Check User Role Matches Route          │
│  if (user.role !== expectedRole)                │
└──────────────────────────────────────────────────┘
  ↓
  ├─ Role Mismatch
  │    ↓
  │    Get correct dashboard: /manager/dashboard
  │    Redirect to user's home
  │
  └─ Role Matches → Continue
     ↓
┌──────────────────────────────────────────────────┐
│  Step 3: Update UI with User Info               │
│  • Show user name in header                      │
│  • Show user role in header                      │
│  • Show user avatar in header                    │
│  • Initialize portal features                    │
└──────────────────────────────────────────────────┘
  ↓
┌──────────────────────────────────────────────────┐
│  Step 4: Allow Portal Access                    │
│  User can now:                                   │
│  • Access role-specific pages                    │
│  • Use all portal features                       │
│  • Refresh page (session persists)               │
│  • Navigate within their role                    │
│                                                  │
│  User CANNOT:                                    │
│  • Access other role's pages                     │
│  • Bypass route protection                       │
│  • Access portals after logout                   │
└──────────────────────────────────────────────────┘
```

---

## 📱 Responsive Design Breakpoints

```
Mobile (< 576px)
┌──────────────────┐
│ Header (stacked) │
│ Form (full-width)│
│ 1 Column layout  │
└──────────────────┘

Tablet (576px - 992px)
┌─────────────────────┐
│ Header (expanded)   │
│ Form (centered)     │
│ 2 Column layout     │
└─────────────────────┘

Desktop (> 992px)
┌─────────────────────────────────┐
│ Header (full)                   │
│ Sidebar │ Content │ Profile     │
│ Multi-column layout             │
└─────────────────────────────────┘
```

---

## 🎨 Component Hierarchy

```
App Root
├── login.html (entry point)
│   ├── Login Form
│   │   ├── Email Input
│   │   ├── Password Input
│   │   └── Submit Button
│   ├── Register Form (conditional)
│   │   ├── Name Input
│   │   ├── Email Input
│   │   ├── Password Input
│   │   ├── Role Select
│   │   └── Submit Button
│   └── Demo Users Quick Login
│
├── auth-service.js (module)
│   ├── initializeUsers()
│   ├── login()
│   ├── register()
│   ├── logout()
│   ├── getCurrentUser()
│   ├── isAuthenticated()
│   └── hasRole()
│
├── route-protection.js (module)
│   ├── isProtectedRoute()
│   ├── canAccessRoute()
│   ├── getHomeDashboard()
│   ├── navigateTo()
│   └── enforceRouteProtection()
│
├── HR Portal (/hr/dashboard)
│   ├── header-component.js
│   │   ├── User Profile Display
│   │   ├── Notification Badge
│   │   ├── Logout Menu
│   │   └── Styling & Events
│   │
│   ├── HR Specific Features
│   │   ├── Employee Management
│   │   ├── Evaluation Review
│   │   ├── Reports
│   │   └── Probation Tracking
│   │
│   └── app.js (HR Logic)
│       └── Feature Implementation
│
└── Manager Portal (/manager/dashboard)
    ├── header-component.js
    │   ├── User Profile Display
    │   ├── Notification Badge
    │   ├── Logout Menu
    │   └── Styling & Events
    │
    ├── Manager Specific Features
    │   ├── Team Members
    │   ├── Evaluations
    │   ├── Feedback
    │   └── Probation Reviews
    │
    └── app.js (Manager Logic)
        └── Feature Implementation
```

---

## 📊 Data Flow Diagram

```
User Input
  ↓
┌─────────────────────────────────────────────┐
│  Browser Event Listeners                    │
│  • Form submission                          │
│  • Button clicks                            │
│  • Page load                                │
└─────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────┐
│  Event Handlers                             │
│  • handleLogin()                            │
│  • handleRegister()                         │
│  • enforceHRAccess()                        │
│  • enforceManagerAccess()                   │
└─────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────┐
│  Auth Service Methods                       │
│  • Validate credentials                     │
│  • Create/clear session                     │
│  • Manage user database                     │
└─────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────┐
│  localStorage                               │
│  • Store/retrieve session                   │
│  • Persist user data                        │
│  • Cache user database                      │
└─────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────┐
│  DOM Updates                                │
│  • Update header with user info             │
│  • Show/hide elements                       │
│  • Display error messages                   │
│  • Show notifications                       │
└─────────────────────────────────────────────┘
  ↓
User Sees Updated UI
```

---

## 🔀 State Management

```
Application State

┌─────────────────────────────────────────┐
│  Session State (localStorage)           │
│  Key: 'hrms_session'                    │
│  ┌─────────────────────────────────────┐│
│  │ {                                   ││
│  │   id: string                        ││
│  │   name: string                      ││
│  │   email: string                     ││
│  │   role: 'hr' | 'manager'           ││
│  │   avatar: string                    ││
│  │   loginTime: ISO 8601 string       ││
│  │ }                                   ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  User Database (localStorage)           │
│  Key: 'hrms_users_db'                   │
│  ┌─────────────────────────────────────┐│
│  │ [                                   ││
│  │   {                                 ││
│  │     id: string                      ││
│  │     name: string                    ││
│  │     email: string                   ││
│  │     password: string (demo only)    ││
│  │     role: 'hr' | 'manager'         ││
│  │     avatar: string                  ││
│  │   },                                ││
│  │   ...                               ││
│  │ ]                                   ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Other State (in memory during session) │
│  • Current user object                  │
│  • Active notifications                 │
│  • Portal-specific data                 │
└─────────────────────────────────────────┘
```

---

## 🔔 Event System

```
Auth Events

┌─────────────────────────────────────┐
│  'authchange' Custom Event          │
│  Triggered when:                    │
│  • User logs in                     │
│  • User logs out                    │
│  • Session expires                  │
│                                     │
│  Listeners:                         │
│  • Header component                 │
│  • Portal components                │
│  • Notification system              │
└─────────────────────────────────────┘

Event Flow:
┌──────────────────────┐
│ authService.login()  │
└──────┬───────────────┘
       ↓
┌──────────────────────────────────────┐
│ window.dispatchEvent(new CustomEvent │
│   ('authchange',                     │
│    { detail: sessionUser }))         │
└──────┬───────────────────────────────┘
       ↓
┌──────────────────────────────────────┐
│ Listeners React:                     │
│ • Update header with user info      │
│ • Show success notification         │
│ • Update UI elements                │
└──────────────────────────────────────┘
```

---

## 🎯 File Dependency Tree

```
index.html (entry point)
├── login.html
│   ├── auth-service.js
│   ├── route-protection.js
│   └── header-component.js (loaded on portal)
│
├── HR/index.html
│   ├── ../auth-service.js
│   ├── ../route-protection.js
│   ├── ../header-component.js
│   ├── js/app.js
│   └── css/styles.css
│
└── manager/index.html
    ├── ../auth-service.js
    ├── ../route-protection.js
    ├── ../header-component.js
    ├── js/app.js
    └── css/styles.css

server.js
├── Serves login.html
├── Serves auth-service.js
├── Routes /hr/* to HR portal
├── Routes /manager/* to Manager portal
└── Handles static files
```

---

## 🚀 Deployment Architecture

```
Production Setup (Recommended)

                    ┌──────────────┐
                    │   User       │
                    │  Browser     │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │ HTTPS/SSL    │
                    │  (Required)  │
                    └──────┬───────┘
                           ↓
            ┌──────────────────────────────┐
            │  Nginx/Apache (Reverse Proxy)│
            │  Load Balancer               │
            └──────┬───────────────────────┘
                   ↓
        ┌──────────────────────────┐
        │  Node.js Server(s)       │
        │  server.js (Port 3000)   │
        │  (Multiple instances)    │
        └──────┬───────────────────┘
               ↓
        ┌──────────────────────────┐
        │  Authentication API      │
        │  (Backend Service)       │
        │  - Login endpoint        │
        │  - User verification     │
        │  - Token generation      │
        └──────┬───────────────────┘
               ↓
        ┌──────────────────────────┐
        │  Database               │
        │  - User credentials     │
        │  - Sessions             │
        │  - Audit logs           │
        └──────────────────────────┘
```

---

This visual guide complements the technical documentation.
For more details, see the other documentation files.
