import express from 'express';
import cors from 'cors';
import { parseBearerToken } from '../../shared/utils/index.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5003;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5000';

const reports = [
  { id: 'rep-001', title: 'Monthly Headcount', type: 'Headcount', generatedAt: '2026-06-01T10:00:00Z', status: 'Ready' },
  { id: 'rep-002', title: 'Team Performance Q2', type: 'Performance', generatedAt: '2026-06-10T14:30:00Z', status: 'Ready' },
  { id: 'rep-003', title: 'Leave Utilization', type: 'Leave', generatedAt: '2026-06-14T09:15:00Z', status: 'Processing' },
  { id: 'rep-004', title: 'Probation Tracker', type: 'Probation', generatedAt: '2026-06-15T16:00:00Z', status: 'Ready' },
];

async function validateToken(req, res, next) {
  const token = parseBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/validate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const data = await response.json();
    req.user = data.user;
    next();
  } catch {
    return res.status(503).json({ error: 'Auth service unavailable' });
  }
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'report-service', timestamp: new Date().toISOString() });
});

app.get('/reports', validateToken, (req, res) => {
  const { role } = req.user;

  const filtered =
    role === 'hr'
      ? reports
      : reports.filter((r) => r.type === 'Performance' || r.type === 'Probation');

  res.json({ reports: filtered });
});

app.get('/reports/:id', validateToken, (req, res) => {
  const report = reports.find((r) => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.json({ report });
});

app.listen(PORT, () => {
  console.log(`Report service listening on http://localhost:${PORT}`);
});
