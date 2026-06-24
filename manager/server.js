import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

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
      { "month": "Jan", "tech": 2.0, "learn": 2.0, "adapt": 3.0, "attitude": 4.0, "comments": "Onboarding completed successfully. Good base.", "average": 2.75 },
      { "month": "Feb", "tech": 2.5, "learn": 4.0, "adapt": 3.0, "attitude": 4.0, "comments": "Excellent learning speed, very adaptable to project requirements.", "average": 3.375 },
      { "month": "Mar", "tech": 4.0, "learn": 4.0, "adapt": 4.5, "attitude": 4.0, "comments": "Solid progress in development speed and code quality.", "average": 4.125 }
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
    "status": "Needs Improvement",
    "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    "project": {
      "name": "Cloud Migration",
      "phase": "Testing & Deployment",
      "progress": 40,
      "status": "At Risk"
    },
    "history": [
      { "month": "Feb", "tech": 2.0, "learn": 3.0, "adapt": 2.0, "attitude": 3.0, "comments": "Needs assistance with infrastructure scripting.", "average": 2.5 }
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
      { "month": "Nov", "tech": 3.5, "learn": 3.5, "adapt": 3.0, "attitude": 4.0, "comments": "Initial evaluation went smoothly.", "average": 3.5 },
      { "month": "Dec", "tech": 4.0, "learn": 4.0, "adapt": 4.0, "attitude": 4.0, "comments": "Strong audit logs produced.", "average": 4.0 },
      { "month": "Jan", "tech": 4.5, "learn": 4.0, "adapt": 4.5, "attitude": 4.5, "comments": "Highly independent. High contribution.", "average": 4.375 }
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

// Helper to read database
const readDb = () => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultAssociates, null, 2));
      return defaultAssociates;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Database reading error, resetting database:", error);
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultAssociates, null, 2));
    return defaultAssociates;
  }
};

// Helper to write database
const writeDb = (data) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function normalizeScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 3;
  return Math.min(5, Math.max(1, Math.round(score)));
}

// Initialize DB on server start
readDb();

// Endpoints
app.get('/api/associates', (req, res) => {
  const db = readDb();
  res.json(db);
});

app.get('/api/associates/:id', (req, res) => {
  const db = readDb();
  const associate = db.find(a => a.id === req.params.id);
  if (associate) {
    res.json(associate);
  } else {
    res.status(404).json({ error: "Associate not found" });
  }
});

app.post('/api/associates', (req, res) => {
  const { name, employeeId, joinDate, manager, probation, avatar, project } = req.body;
  if (!name || !employeeId) {
    return res.status(400).json({ error: "Name and Employee ID are required" });
  }
  
  const db = readDb();
  const id = name.toLowerCase().replace(/\s+/g, '-');
  
  // Avoid duplicate ID
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

app.post('/api/associates/:id/evaluations', (req, res) => {
  const { tech, learn, adapt, attitude, comments } = req.body;
  const db = readDb();
  const associateIndex = db.findIndex(a => a.id === req.params.id);

  if (associateIndex === -1) {
    return res.status(404).json({ error: "Associate not found" });
  }

  const associate = db[associateIndex];
  const parsedEvaluation = {
    tech: normalizeScore(tech),
    learn: normalizeScore(learn),
    adapt: normalizeScore(adapt),
    attitude: normalizeScore(attitude),
    comments: comments || ""
  };
  
  // Calculate average of the current evaluation
  const average = (parsedEvaluation.tech + parsedEvaluation.learn + parsedEvaluation.adapt + parsedEvaluation.attitude) / 4;
  const savedAt = new Date().toISOString();
  const month = monthLabels[new Date().getMonth()];
  const historyEntry = {
    month,
    ...parsedEvaluation,
    average: Number(average.toFixed(3)),
    savedAt
  };
  
  // Save current evaluation with its calculated monthly score
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

  // Determine standard status based on the average
  if (average >= 4.0) {
    associate.status = "On Track";
  } else if (average >= 3.0) {
    associate.status = "On Track";
  } else {
    associate.status = "Needs Improvement";
  }

  // Check if we should update history:
  // If the user saves the evaluation, it updates the current evaluation.
  // In a real application, the manager might transition to the next month.
  // We can let them save the current evaluation, which updates the stats.
  
  db[associateIndex] = associate;
  writeDb(db);
  res.json(associate);
});

app.delete('/api/associates/:id', (req, res) => {
  let db = readDb();
  const newDb = db.filter(a => a.id !== req.params.id);
  
  if (db.length === newDb.length) {
    return res.status(404).json({ error: "Associate not found" });
  }
  
  writeDb(newDb);
  res.json({ message: "Associate deleted successfully" });
});

app.post('/api/reset', (req, res) => {
  writeDb(defaultAssociates);
  res.json({ message: "Database reset to defaults successfully" });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
