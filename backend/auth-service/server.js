import express from 'express';
import cors from 'cors';
import { parseBearerToken } from '../../shared/utils/index.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const users = [
  {
    id: 'hr-001',
    name: 'Elena Vance',
    email: 'hr@sundew.com',
    password: 'password123',
    role: 'hr',
  },
  {
    id: 'manager-001',
    name: 'Sarah Thompson',
    email: 'manager@sundew.com',
    password: 'password123',
    role: 'manager',
  },
];

const sessions = new Map();

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function getUserFromToken(token) {
  if (!token || !sessions.has(token)) return null;
  return sessions.get(token);
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = Buffer.from(JSON.stringify({ id: user.id, role: user.role, ts: Date.now() })).toString('base64');
  sessions.set(token, user);

  res.json({ user: sanitizeUser(user), token });
});

app.get('/me', (req, res) => {
  const token = parseBearerToken(req.headers.authorization);
  const user = getUserFromToken(token);

  if (!user) {
    return res.status(401).json({ user: null, error: 'Unauthorized' });
  }

  res.json({ user: sanitizeUser(user) });
});

app.post('/logout', (req, res) => {
  const token = parseBearerToken(req.headers.authorization);
  if (token) sessions.delete(token);
  res.json({ success: true });
});

function handleValidate(req, res) {
  const token = parseBearerToken(req.headers.authorization);
  const user = getUserFromToken(token);

  if (!user) {
    return res.status(401).json({ valid: false });
  }

  res.json({ valid: true, user: sanitizeUser(user) });
}

app.get('/validate', handleValidate);
app.post('/validate', handleValidate);

app.listen(PORT, () => {
  console.log(`Auth service listening on http://localhost:${PORT}`);
});
