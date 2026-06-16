import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseBearerToken } from '../../shared/utils/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5000';

const employees = [
  { id: 'emp-001', name: 'Sarah Chen', department: 'Product Design', position: 'Senior Frontend Developer', status: 'Active' },
  { id: 'emp-002', name: 'Marcus Thorne', department: 'Platform Engineering', position: 'DevOps Engineer', status: 'Active' },
  { id: 'emp-003', name: 'Elena Rodriguez', department: 'Mobile Engineering', position: 'iOS Developer', status: 'Active' },
  { id: 'emp-004', name: 'James Wilson', department: 'Information Security', position: 'Security Analyst', status: 'Active' },
];

function readDb() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Database reading error inside hr-service:", error);
    return { documents: [], activities: [], storage: {} };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Database writing error inside hr-service:", error);
  }
}

async function validateHrToken(req, res, next) {
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
    if (data.user?.role !== 'hr') {
      return res.status(403).json({ error: 'HR access required' });
    }

    req.user = data.user;
    next();
  } catch {
    return res.status(503).json({ error: 'Auth service unavailable' });
  }
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'hr-service', timestamp: new Date().toISOString() });
});

app.get('/dashboard', validateHrToken, (_req, res) => {
  res.json({
    stats: {
      totalEmployees: employees.length,
      activeEmployees: employees.filter((e) => e.status === 'Active').length,
      onLeave: employees.filter((e) => e.status === 'On Leave').length,
      departments: [...new Set(employees.map((e) => e.department))].length,
    },
    recentHires: employees.slice(0, 3),
  });
});

app.get('/employees', validateHrToken, (_req, res) => {
  res.json({ employees });
});

app.get('/employees/:id', validateHrToken, (req, res) => {
  const employee = employees.find((e) => e.id === req.params.id);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });
  res.json({ employee });
});

app.get('/reports/summary', validateHrToken, (_req, res) => {
  res.json({
    reports: [
      { id: 'rpt-001', title: 'Headcount Report', type: 'Headcount', generatedAt: '2026-06-01', status: 'Ready' },
      { id: 'rpt-002', title: 'Attrition Analysis', type: 'Attrition', generatedAt: '2026-06-10', status: 'Ready' },
      { id: 'rpt-003', title: 'Leave Summary', type: 'Leave', generatedAt: '2026-06-14', status: 'Processing' },
    ],
  });
});

// Document Management API
app.get('/api/documents', validateHrToken, (_req, res) => {
  const db = readDb();
  res.json({ documents: db.documents });
});

app.post('/api/documents/upload', validateHrToken, (req, res) => {
  const { name, type } = req.body;
  if (!name) return res.status(400).json({ error: "Filename is required" });

  const db = readDb();
  
  const ext = name.split('.').pop() || '';
  let docType = 'Document';
  if (['pdf'].includes(ext.toLowerCase())) docType = 'PDF Document';
  else if (['doc', 'docx'].includes(ext.toLowerCase())) docType = 'MS Word';
  else if (['xls', 'xlsx'].includes(ext.toLowerCase())) docType = 'MS Excel';
  else if (['ppt', 'pptx'].includes(ext.toLowerCase())) docType = 'Presentation';
  else if (['csv'].includes(ext.toLowerCase())) docType = 'CSV File';
  else if (['txt'].includes(ext.toLowerCase())) docType = 'Text File';
  else if (['png', 'jpg', 'jpeg'].includes(ext.toLowerCase())) docType = 'Image File';
  else if (['zip'].includes(ext.toLowerCase())) docType = 'Zip Archive';
  
  const newDoc = {
    id: `doc-${Date.now()}`,
    name,
    type: type || docType,
    dateAdded: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    owner: req.user.name || 'HR Specialist',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCEBSgyvWhWcUFD0_sFk0Z5fn365kbumbRqrv0GfIZuJzhpIr_eUJNWeIBGOl3ilIv7K2R5i4SFlgLPUmMLkSojNB61S0Y-tspj1SNDCxbSMr327OASz9b24mdOjMqUvq2GKMtN4H5b8Se1gxiKRGOkQKZgNqW7QE59DYjL4guWRIGz4azjNWxeGTr8iJBEJBzwMmY-49ETYtOTynhsY_SqQ6vOxPyxzNOP3VZLhi8Skrjr1D3s7TyorKUMJf9YiCbHAmFsV07M9c'
  };

  db.documents.unshift(newDoc);
  
  // Add activity log
  const newActivity = {
    id: `act-${Date.now()}`,
    user: req.user.name || 'HR Specialist',
    action: 'uploaded',
    target: name,
    time: 'Just now'
  };
  db.activities.unshift(newActivity);
  
  // Update storage usage slightly
  const sizeMb = Math.floor(Math.random() * 5) + 1; // 1-5MB
  db.storage.used = parseFloat((db.storage.used + sizeMb / 1024).toFixed(2));
  db.storage.documentsCount += 1;
  db.storage.records = parseFloat((db.storage.records + sizeMb / 1024).toFixed(2));
  
  writeDb(db);
  res.status(201).json(newDoc);
});

app.get('/api/activity', validateHrToken, (_req, res) => {
  const db = readDb();
  res.json({ activities: db.activities });
});

app.get('/api/storage', validateHrToken, (_req, res) => {
  const db = readDb();
  res.json({ storage: db.storage });
});

app.listen(PORT, () => {
  console.log(`HR service listening on http://localhost:${PORT}`);
});

