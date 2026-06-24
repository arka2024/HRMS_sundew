import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { sleep } from '../shared/utils/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const BACKEND_SERVICES = [
  { name: 'Auth Service', port: 5000, cwd: 'backend/auth-service', entry: 'server.js' },
  { name: 'HR Service', port: 5001, cwd: 'backend/hr-service', entry: 'server.js' },
  { name: 'Manager Service', port: 5002, cwd: 'backend/manager-service', entry: 'server.js' },
  { name: 'Report Service', port: 5003, cwd: 'backend/report-service', entry: 'server.js' },
  { name: 'Probation Service', port: 5004, cwd: 'backend/probation-service', entry: 'src/server.js' },
];

const ROOT_SERVER_PORT = 3000;
const FRONTEND_PORT = 5173;
const MAX_HEALTH_RETRIES = 30;
const HEALTH_RETRY_DELAY_MS = 1000;

const children = [];

function startProcess(name, command, args, cwd) {
  const child = spawn(command, args, {
    cwd: path.join(rootDir, cwd),
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });

  children.push(child);
  return child;
}

async function waitForHealth(name, port) {
  for (let attempt = 1; attempt <= MAX_HEALTH_RETRIES; attempt += 1) {
    try {
      const response = await fetch(`http://localhost:${port}/health`);
      if (response.ok) {
        console.log(`✓ ${name} is healthy on port ${port}`);
        return true;
      }
    } catch {
      // retry
    }

    await sleep(HEALTH_RETRY_DELAY_MS);
  }

  console.error(`✗ ${name} failed health check on port ${port}`);
  return false;
}

async function startBackends() {
  console.log('\nStarting backend services...\n');

  for (const service of BACKEND_SERVICES) {
    const entry = service.entry || 'server.js';
    startProcess(service.name, 'node', [entry], service.cwd);
  }

  await sleep(1500);

  const results = await Promise.all(
    BACKEND_SERVICES.map((service) => waitForHealth(service.name, service.port)),
  );

  if (results.some((healthy) => !healthy)) {
    console.error('\nOne or more backend services failed to start. Check logs above.');
    process.exit(1);
  }

  console.log('\nAll backend services are healthy.\n');
}

function startRootServer() {
  console.log(`Starting root portal server on http://localhost:${ROOT_SERVER_PORT}...\n`);
  startProcess('Root Portal Server', 'node', ['server.js'], '.');
}

function startFrontend() {
  console.log(`Starting frontend on http://localhost:${FRONTEND_PORT}...\n`);
  startProcess('Frontend', 'npm', ['run', 'dev'], 'frontend');
}

function shutdown() {
  console.log('\nShutting down HRMS services...');
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    Sundew HRMS Platform                      ║
╚══════════════════════════════════════════════════════════════╝
  `);

  await startBackends();
  startRootServer();
  startFrontend();

  console.log(`
Services running:
  Root Portal       → http://localhost:${ROOT_SERVER_PORT} (HR & Manager HTML portals)
  React Frontend    → http://localhost:${FRONTEND_PORT}
  Auth Service      → http://localhost:5000
  HR Service        → http://localhost:5001
  Manager Service   → http://localhost:5002
  Report Service    → http://localhost:5003
  Probation Service → http://localhost:5004

Demo credentials:
  HR:      hr@sundew.com / password123
  Manager: manager@sundew.com / password123
  `);
}

main().catch((error) => {
  console.error('Failed to start HRMS:', error);
  process.exit(1);
});
