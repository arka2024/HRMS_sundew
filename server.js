import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Route: Login Page
 * GET / or /login or /login.html - Serve the unified login page
 */
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.use(express.static(__dirname));

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

/**
 * Route: Serve Auth Service and Route Protection
 * These are shared libraries for authentication
 */
app.get('/auth-service.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth-service.js'));
});

app.get('/route-protection.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'route-protection.js'));
});

app.get('/header-component.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'header-component.js'));
});

/**
 * Route: HR Portal
 * GET /hr/* - Routes to HR portal
 */
app.get('/hr/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'HR', 'index.html'));
});

app.get(/^\/hr\/.*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'HR', 'index.html'));
});

/**
 * Route: Manager Portal
 * GET /manager/* - Routes to Manager portal
 */
app.get('/manager/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'manager', 'index.html'));
});

app.get(/^\/manager\/.*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'manager', 'index.html'));
});

/**
 * API Routes
 * Proxy API calls to respective backends
 */

// HR API Endpoints
app.use('/api/associates', (req, res, next) => {
  // Forward to HR backend
  forwardRequest(req, res, 'http://localhost:5000');
});

app.use('/api/hr', (req, res, next) => {
  // Forward to HR backend
  forwardRequest(req, res, 'http://localhost:5000');
});

// Manager API Endpoints
app.use('/api/manager', (req, res, next) => {
  // Forward to Manager backend
  forwardRequest(req, res, 'http://localhost:5001');
});

/**
 * Static Files
 * HR Assets
 */
app.use('/hr/css', express.static(path.join(__dirname, 'HR', 'css')));
app.use('/hr/js', express.static(path.join(__dirname, 'HR', 'js')));

/**
 * Static Files
 * Manager Assets
 */
app.use('/manager/css', express.static(path.join(__dirname, 'manager', 'css')));
app.use('/manager/js', express.static(path.join(__dirname, 'manager', 'js')));

/**
 * Error Handling
 */
app.use((req, res) => {
  // Default to login page for undefined routes
  res.sendFile(path.join(__dirname, 'login.html'));
});

/**
 * Helper: Forward requests to backend servers
 */
function forwardRequest(req, res, backendUrl) {
  const http_module = backendUrl.startsWith('https') ? require('https') : http;
  
  const options = {
    hostname: new URL(backendUrl).hostname,
    port: new URL(backendUrl).port || 80,
    path: req.originalUrl,
    method: req.method,
    headers: req.headers,
  };

  const proxyReq = http_module.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (error) => {
    console.error('Proxy error:', error);
    res.status(503).json({ error: 'Backend service unavailable' });
  });

  if (req.body && Object.keys(req.body).length > 0) {
    proxyReq.write(JSON.stringify(req.body));
  }

  proxyReq.end();
}

/**
 * Start Server
 */
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║          HRMS Unified Portal Server Started                  ║
║                                                              ║
║  URL: http://localhost:${PORT}                                ║
║  Login Page: http://localhost:${PORT}/login.html             ║
║                                                              ║
║  HR Portal: http://localhost:${PORT}/hr/dashboard            ║
║  Manager Portal: http://localhost:${PORT}/manager/dashboard  ║
║                                                              ║
║  Demo Credentials:                                           ║
║  HR: hr@sundew.com / password123                            ║
║  Manager: manager@sundew.com / password123                  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
