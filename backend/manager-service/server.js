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

const PORT = process.env.PORT || 5002;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5000';

const defaultAssociates = [
  {
    "id": "sarah-chen",
    "name": "Sarah Chen",
    "employeeId": "HR-2024-001",
    "joinDate": "Jan 15, 2024",
    "manager": "Sarah Thompson",
    "probation": "Month 3/4",
    "status": "On Track",
    "avatar": "https://lh3.googleusercontent.com/aida-public/AB6AXuDwipckJtsRT5jNcB8fC-YO9nro0-sHfX5b-wHB0PiDgmggS0rEbG1ibzJBPRomUWqEOSwX1RT6nyzNG8eA5jikqUWz5r6529vATPHcNd1x5l3oHRDG_eKPube8i5Cwk1Ixe_TUiO22aMsiLNw7oBgQ8eOBU9yYGE5aA8H2Bxx9pxOezlYEl2gvHaJgU3CYmVPao6JXvxzFzrq9w__LPY6DIyomULj_58TZz4Dgnpc7kuhU15ymf8o0HZ4W9UGoyG1eGdLtadBtNpY",
    "project": {
      "name": "Enterprise HR Portal Redesign",
      "phase": "Development",
      "progress": 65,
      "status": "Healthy"
    },
    "history": [
      { "month": "Jan", "tech": 2, "learn": 2, "adapt": 3, "attitude": 4, "comments": "Onboarding completed successfully. Good base.", "average": 2.75 },
      { "month": "Feb", "tech": 2.5, "learn": 4, "adapt": 3, "attitude": 4, "comments": "Excellent learning speed, very adaptable to project requirements.", "average": 3.375 },
      { "month": "Mar", "tech": 4, "learn": 4, "adapt": 4.5, "attitude": 4, "comments": "Solid progress in development speed and code quality.", "average": 4.125 }
    ],
    "currentEvaluation": {
      "tech": 3,
      "learn": 3,
      "adapt": 3,
      "attitude": 3,
      "comments": "Sarah has shown steady improvement. We are on track to pass probation."
    }
  },
  {
    "id": "marcus-thorne",
    "name": "Marcus Thorne",
    "employeeId": "HR-2024-002",
    "joinDate": "Feb 1, 2024",
    "manager": "Sarah Thompson",
    "probation": "Month 2/4",
    "status": "On Track",
    "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    "project": {
      "name": "Cloud Migration",
      "phase": "Testing & Deployment",
      "progress": 40,
      "status": "At Risk"
    },
    "history": [
      { "month": "Feb", "tech": 2, "learn": 3, "adapt": 2, "attitude": 3, "comments": "Needs assistance with infrastructure scripting.", "average": 2.5 }
    ],
    "currentEvaluation": {
      "tech": 2,
      "learn": 3,
      "adapt": 2,
      "attitude": 3,
      "comments": "Struggling to adapt to complex system setups. Coaching scheduled."
    }
  },
  {
    "id": "elena-rodriguez",
    "name": "Elena Rodriguez",
    "employeeId": "HR-2024-003",
    "joinDate": "Mar 10, 2024",
    "manager": "Marcus Vance",
    "probation": "Month 1/4",
    "status": "On Track",
    "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    "project": {
      "name": "Mobile App Dev",
      "phase": "Planning & Design",
      "progress": 15,
      "status": "Healthy"
    },
    "history": [],
    "currentEvaluation": {
      "tech": 4,
      "learn": 4,
      "adapt": 4,
      "attitude": 5,
      "comments": "Outstanding initial month. Already delivering clean components."
    }
  },
  {
    "id": "james-wilson",
    "name": "James Wilson",
    "employeeId": "HR-2024-004",
    "joinDate": "Nov 12, 2023",
    "manager": "Elena Vance",
    "probation": "Month 4/4",
    "status": "On Track",
    "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    "project": {
      "name": "Security Audit",
      "phase": "Final Review",
      "progress": 90,
      "status": "Healthy"
    },
    "history": [
      { "month": "Nov", "tech": 3.5, "learn": 3.5, "adapt": 3, "attitude": 4, "comments": "Initial evaluation went smoothly.", "average": 3.5 },
      { "month": "Dec", "tech": 4, "learn": 4, "adapt": 4, "attitude": 4, "comments": "Strong audit logs produced.", "average": 4 },
      { "month": "Jan", "tech": 4.5, "learn": 4, "adapt": 4.5, "attitude": 4.5, "comments": "Highly independent. High contribution.", "average": 4.375 }
    ],
    "currentEvaluation": {
      "tech": 5,
      "learn": 4,
      "adapt": 5,
      "attitude": 5,
      "comments": "Excellent compliance work. Strongly recommended to hire permanently."
    }
  }
];

function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultAssociates, null, 2));
      return defaultAssociates;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Database reading error, resetting database:", error);
    return defaultAssociates;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Database writing error:", error);
  }
}

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

async function validateManagerToken(req, res, next) {
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
    if (data.user?.role !== 'manager') {
      return res.status(403).json({ error: 'Manager access required' });
    }

    req.user = data.user;
    next();
  } catch {
    return res.status(503).json({ error: 'Auth service unavailable' });
  }
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'manager-service', timestamp: new Date().toISOString() });
});

// Sync data list from db.json
app.get('/api/associates', validateManagerToken, (_req, res) => {
  const db = readDb();
  res.json(db);
});

app.get('/api/associates/:id', validateManagerToken, (req, res) => {
  const db = readDb();
  const associate = db.find(a => a.id === req.params.id);
  if (associate) {
    res.json(associate);
  } else {
    res.status(404).json({ error: "Associate not found" });
  }
});

app.post('/api/associates', validateManagerToken, (req, res) => {
  const { name, employeeId, joinDate, manager, probation, avatar, project } = req.body;
  if (!name || !employeeId) {
    return res.status(400).json({ error: "Name and Employee ID are required" });
  }
  
  const db = readDb();
  const id = name.toLowerCase().replace(/\s+/g, '-');
  
  if (db.some(a => a.id === id)) {
    return res.status(400).json({ error: "An associate with this name already exists" });
  }

  const newAssociate = {
    id,
    name,
    employeeId,
    joinDate: joinDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    manager: manager || "Sarah Thompson",
    probation: probation || "Month 1/4",
    status: "On Track",
    avatar: avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    project: project || {
      name: "New Assignment",
      phase: "Onboarding",
      progress: 0,
      status: "Healthy"
    },
    history: [],
    currentEvaluation: {
      tech: 3,
      learn: 3,
      adapt: 3,
      attitude: 3,
      comments: ""
    }
  };

  db.push(newAssociate);
  writeDb(db);
  res.status(201).json(newAssociate);
});

app.post('/api/associates/:id/evaluations', validateManagerToken, (req, res) => {
  const { tech, learn, adapt, attitude, comments } = req.body;
  const db = readDb();
  const associateIndex = db.findIndex(a => a.id === req.params.id);

  if (associateIndex === -1) {
    return res.status(404).json({ error: "Associate not found" });
  }

  const associate = db[associateIndex];
  const parsedEvaluation = {
    tech: parseFloat(tech),
    learn: parseFloat(learn),
    adapt: parseFloat(adapt),
    attitude: parseFloat(attitude),
    comments: comments || ""
  };
  const average = (parsedEvaluation.tech + parsedEvaluation.learn + parsedEvaluation.adapt + parsedEvaluation.attitude) / 4;
  const savedAt = new Date().toISOString();
  const month = monthLabels[new Date().getMonth()];
  const historyEntry = {
    month,
    ...parsedEvaluation,
    average: Number(average.toFixed(3)),
    savedAt
  };
  
  associate.currentEvaluation = {
    ...parsedEvaluation,
    average: Number(average.toFixed(3)),
    savedAt
  };
  const history = associate.history || [];
  const existingMonthIndex = history.findIndex((item) => item.month === month);
  associate.history =
    existingMonthIndex >= 0
      ? history.map((item, index) => (index === existingMonthIndex ? historyEntry : item))
      : [...history, historyEntry];
  associate.averagePerformanceScore = Number(
    (associate.history.reduce((sum, item) => sum + item.average, 0) / associate.history.length).toFixed(2)
  );

  if (average >= 4.0) {
    associate.status = "On Track";
  } else if (average >= 3.0) {
    associate.status = "On Track";
  } else {
    associate.status = "Needs Improvement";
  }

  db[associateIndex] = associate;
  writeDb(db);
  res.json(associate);
});

app.delete('/api/associates/:id', validateManagerToken, (req, res) => {
  const db = readDb();
  const newDb = db.filter(a => a.id !== req.params.id);
  
  if (db.length === newDb.length) {
    return res.status(404).json({ error: "Associate not found" });
  }
  
  writeDb(newDb);
  res.json({ message: "Associate deleted successfully" });
});

app.post('/api/reset', validateManagerToken, (_req, res) => {
  writeDb(defaultAssociates);
  res.json({ message: "Database reset to defaults successfully" });
});

// Original legacy support
app.get('/dashboard', validateManagerToken, (_req, res) => {
  const db = readDb();
  const totalScores = db.map(a => {
    const avgCur = (a.currentEvaluation.tech + a.currentEvaluation.learn + a.currentEvaluation.adapt + a.currentEvaluation.attitude) / 4;
    return avgCur;
  });
  const avgPerformanceScore = totalScores.length ? (totalScores.reduce((a, b) => a + b, 0) / totalScores.length) : 0;
  
  res.json({
    stats: {
      teamSize: db.length,
      pendingEvaluations: db.filter(e => e.status !== 'On Track').length,
      completedEvaluations: db.filter(e => e.status === 'On Track').length,
      avgPerformanceScore: parseFloat(avgPerformanceScore.toFixed(2)),
    },
    upcomingReviews: db.map(a => ({
      id: a.id,
      employeeName: a.name,
      period: 'Q2 2026',
      status: a.status === 'On Track' ? 'Completed' : 'Pending',
      score: (a.currentEvaluation.tech + a.currentEvaluation.learn + a.currentEvaluation.adapt + a.currentEvaluation.attitude) / 4
    })).slice(0, 3),
  });
});

app.get('/team', validateManagerToken, (_req, res) => {
  const db = readDb();
  const team = db.map(a => ({
    id: a.id,
    name: a.name,
    role: a.project.name,
    performance: a.status
  }));
  res.json({ team });
});

app.get('/evaluations', validateManagerToken, (_req, res) => {
  const db = readDb();
  const evals = db.map(a => ({
    id: a.id,
    employeeName: a.name,
    period: 'Current Month',
    status: 'Completed',
    score: (a.currentEvaluation.tech + a.currentEvaluation.learn + a.currentEvaluation.adapt + a.currentEvaluation.attitude) / 4
  }));
  res.json({ evaluations: evals });
});

app.listen(PORT, () => {
  console.log(`Manager service listening on http://localhost:${PORT}`);
});

