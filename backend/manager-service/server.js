import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseBearerToken } from '../../shared/utils/index.js';
import {
  DEMO_MANAGER,
  getEmployeesByManagerId,
  readEmployeeStore,
  toEmployeeDto,
} from '../shared/employee-store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5002;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5000';

const defaultAssociates = [];

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

function getCurrentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatJoinDate(isoDate) {
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function calculateProbationEndDate(isoDate, months) {
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  const result = new Date(parsed);
  result.setMonth(result.getMonth() + months);
  return result.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function slugifyName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createFreshEvaluation() {
  return {
    tech: 3,
    learn: 3,
    adapt: 3,
    attitude: 3,
    comments: '',
  };
}

function employeeToAssociate(employee) {
  const id = slugifyName(employee.employeeName) || slugifyName(employee.employeeNumber);
  const probationDurationMonths = employee.probationDurationMonths || 4;
  const joinDate = formatJoinDate(employee.dateOfJoining);
  const probationEndDate = calculateProbationEndDate(employee.dateOfJoining, probationDurationMonths);
  
  return {
    id,
    name: employee.employeeName,
    employeeId: employee.employeeNumber,
    joinDate,
    manager: DEMO_MANAGER.name,
    probationDurationMonths,
    probationEndDate,
    probation: getCalculatedProbation(joinDate, probationDurationMonths),
    status: 'On Track',
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.employeeName)}&background=0044ff&color=fff`,
    project: {
      name: employee.projectName,
      phase: employee.department,
      progress: Math.min(100, Math.round(employee.totalHoursWorked / 2)),
      status: 'Healthy',
    },
    department: employee.department,
    totalHoursWorked: employee.totalHoursWorked,
    history: [],
    currentEvaluation: createFreshEvaluation(),
    syncedFromHr: true,
  };
}

function syncEmployeesIntoManagerDb(employees) {
  const db = readDb();
  const byEmployeeId = new Map(db.map((associate) => [associate.employeeId, associate]));

  employees.forEach((employee) => {
    const existing = byEmployeeId.get(employee.employeeNumber);
    const next = employeeToAssociate(employee);

    if (existing) {
      byEmployeeId.set(employee.employeeNumber, {
        ...next,
        id: existing.id,
        history: existing.history || [],
        currentEvaluation: existing.currentEvaluation || createFreshEvaluation(),
        syncedFromHr: true,
        averagePerformanceScore: existing.averagePerformanceScore,
        evaluationLockedForMonth: existing.evaluationLockedForMonth,
      });
    } else {
      byEmployeeId.set(employee.employeeNumber, next);
    }
  });

  const merged = [...byEmployeeId.values()];
  writeDb(merged);
  return merged;
}

function normalizeScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 3;
  return Math.min(5, Math.max(1, Math.round(score)));
}

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
    if (data.user?.role !== 'manager' && data.user?.role !== 'hr') {
      return res.status(403).json({ error: 'Manager or HR access required' });
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

function getCalculatedProbation(joinDateStr, probationDurationMonths = 4) {
  const joinDate = new Date(joinDateStr);
  if (Number.isNaN(joinDate.getTime())) {
    return 'Month 1/4';
  }
  const now = new Date();
  const diffYears = now.getFullYear() - joinDate.getFullYear();
  const diffMonths = now.getMonth() - joinDate.getMonth();
  let totalMonths = diffYears * 12 + diffMonths;
  if (now.getDate() < joinDate.getDate()) {
    totalMonths -= 1;
  }
  const monthIndex = Math.max(1, totalMonths + 1);
  
  if (monthIndex > probationDurationMonths) {
    return 'Completed';
  }
  return `Month ${monthIndex}/${probationDurationMonths}`;
}

function enrichAssociate(associate) {
  if (!associate) return associate;
  return {
    ...associate,
    probation: getCalculatedProbation(associate.joinDate, associate.probationDurationMonths || 4),
  };
}

function sortAssociatesForPortal(associates) {
  return [...associates].sort((left, right) => {
    if (left.syncedFromHr && !right.syncedFromHr) return -1;
    if (!left.syncedFromHr && right.syncedFromHr) return 1;
    return left.name.localeCompare(right.name);
  });
}

// Helpers for month name conversion
function getMonthNum(monthName) {
  if (!monthName) return '01';
  const m = String(monthName).trim().toLowerCase();
  const shortNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const fullNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  
  let idx = shortNames.indexOf(m);
  if (idx === -1) idx = fullNames.indexOf(m);
  if (idx === -1) {
    const num = parseInt(m, 10);
    if (num >= 1 && num <= 12) return String(num).padStart(2, '0');
    return '01';
  }
  return String(idx + 1).padStart(2, '0');
}

function getMonthLongName(monthName) {
  if (!monthName) return 'January';
  const m = String(monthName).trim().toLowerCase();
  const shortNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const fullNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  let idx = shortNames.indexOf(m);
  if (idx === -1) idx = fullNames.map(f => f.toLowerCase()).indexOf(m);
  if (idx === -1) return monthName;
  return fullNames[idx];
}

// Sync data list from db.json — HR-synced employees appear first
app.get('/api/associates', validateManagerToken, async (req, res) => {
  try {
    const db = readDb();
    const enriched = db.map(enrichAssociate);
    
    // Fetch all evaluations from probation-service using the manager token
    const probationUrl = process.env.PROBATION_SERVICE_URL || 'http://localhost:5004';
    const response = await fetch(`${probationUrl}/api/evaluation-reports`, {
      headers: { Authorization: req.headers.authorization }
    });
    
    if (response.ok) {
      const data = await response.json();
      const evaluations = data.evaluations || [];
      
      // Group evaluations by employeeNumber
      const evalsByEmployee = {};
      evaluations.forEach(e => {
        const key = e.employeeNumber;
        if (!evalsByEmployee[key]) evalsByEmployee[key] = [];
        evalsByEmployee[key].push(e);
      });
      
      // Merge evaluations into enriched associates history
      enriched.forEach(associate => {
        const evals = evalsByEmployee[associate.employeeId] || [];
        associate.history = evals.map(e => ({
          month: e.evaluationMonth,
          monthKey: `${e.evaluationYear}-${getMonthNum(e.evaluationMonth)}`,
          tech: e.performanceScore,
          learn: e.productivityScore,
          adapt: e.communicationScore,
          attitude: e.attendanceScore,
          comments: e.hrRemarks,
          average: e.overallScore,
          savedAt: e.savedAt || new Date().toISOString(),
          locked: e.status === 'Locked',
          status: e.status,
          lockedBy: e.lockedBy,
          lockedDate: e.lockedDate
        }));
        
        // Calculate average performance score
        if (associate.history.length > 0) {
          const sum = associate.history.reduce((acc, h) => acc + h.average, 0);
          associate.averagePerformanceScore = parseFloat((sum / associate.history.length).toFixed(2));
          
          // Set last locked month key if any
          const lockedEvals = associate.history.filter(h => h.locked);
          if (lockedEvals.length > 0) {
            lockedEvals.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
            associate.evaluationLockedForMonth = lockedEvals[0].monthKey;
          }
        }
      });
    }
    
    res.json(sortAssociatesForPortal(enriched));
  } catch (error) {
    console.error('Get associates error:', error);
    res.status(500).json({ error: 'Failed to load associates' });
  }
});

app.get('/api/associates/:id', validateManagerToken, async (req, res) => {
  try {
    const db = readDb();
    const associate = db.find(a => a.id === req.params.id);
    if (!associate) {
      return res.status(404).json({ error: "Associate not found" });
    }
    
    const enriched = enrichAssociate(associate);
    
    // Fetch evaluations for this specific employee
    const probationUrl = process.env.PROBATION_SERVICE_URL || 'http://localhost:5004';
    const response = await fetch(`${probationUrl}/api/evaluation-reports?employeeNumber=${associate.employeeId}`, {
      headers: { Authorization: req.headers.authorization }
    });
    
    if (response.ok) {
      const data = await response.json();
      const evaluations = data.evaluations || [];
      
      enriched.history = evaluations.map(e => ({
        month: e.evaluationMonth,
        monthKey: `${e.evaluationYear}-${getMonthNum(e.evaluationMonth)}`,
        tech: e.performanceScore,
        learn: e.productivityScore,
        adapt: e.communicationScore,
        attitude: e.attendanceScore,
        comments: e.hrRemarks,
        average: e.overallScore,
        savedAt: e.savedAt || new Date().toISOString(),
        locked: e.status === 'Locked',
        status: e.status,
        lockedBy: e.lockedBy,
        lockedDate: e.lockedDate
      }));
      
      if (enriched.history.length > 0) {
        const sum = enriched.history.reduce((acc, h) => acc + h.average, 0);
        enriched.averagePerformanceScore = parseFloat((sum / enriched.history.length).toFixed(2));
        
        const lockedEvals = enriched.history.filter(h => h.locked);
        if (lockedEvals.length > 0) {
          lockedEvals.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
          enriched.evaluationLockedForMonth = lockedEvals[0].monthKey;
        }
      }
    }
    
    res.json(enriched);
  } catch (error) {
    console.error('Get associate details error:', error);
    res.status(500).json({ error: 'Failed to load associate details' });
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
    currentEvaluation: createFreshEvaluation()
  };

  db.push(newAssociate);
  writeDb(db);
  res.status(201).json(newAssociate);
});

app.post('/api/associates/:id/evaluations', validateManagerToken, async (req, res) => {
  try {
    const { tech, learn, adapt, attitude, comments, status } = req.body;
    const db = readDb();
    const associateIndex = db.findIndex(a => a.id === req.params.id);

    if (associateIndex === -1) {
      return res.status(404).json({ error: "Associate not found" });
    }

    const associate = db[associateIndex];
    const joinDate = new Date(associate.joinDate);
    if (!Number.isNaN(joinDate.getTime())) {
      const now = new Date();
      const diffYears = now.getFullYear() - joinDate.getFullYear();
      const diffMonths = now.getMonth() - joinDate.getMonth();
      let totalMonths = diffYears * 12 + diffMonths;
      if (now.getDate() < joinDate.getDate()) {
        totalMonths -= 1;
      }
      const monthIndex = Math.max(1, totalMonths + 1);
      if (monthIndex > (associate.probationDurationMonths || 6)) {
        return res.status(403).json({
          error: `Evaluation forbidden. The ${associate.probationDurationMonths || 6}-month probation period has expired.`,
        });
      }
    }

    const monthKey = getCurrentMonthKey();
    const month = monthLabels[new Date().getMonth()];
    const fullMonthName = getMonthLongName(month);
    
    // Fetch current evaluations from MongoDB to see if locked
    const probationUrl = process.env.PROBATION_SERVICE_URL || 'http://localhost:5004';
    const checkRes = await fetch(`${probationUrl}/api/evaluation-reports?employeeNumber=${associate.employeeId}`, {
      headers: { Authorization: req.headers.authorization }
    });
    
    if (checkRes.ok) {
      const data = await checkRes.json();
      const evaluations = data.evaluations || [];
      const currentEval = evaluations.find(e => getMonthLongName(e.evaluationMonth) === fullMonthName && e.evaluationYear === new Date().getFullYear().toString());
      if (currentEval && currentEval.status === 'Locked') {
        return res.status(409).json({
          error: `Evaluation for ${fullMonthName} is locked and cannot be updated.`,
        });
      }
    }

    const parsedEvaluation = {
      tech: normalizeScore(tech),
      learn: normalizeScore(learn),
      adapt: normalizeScore(adapt),
      attitude: normalizeScore(attitude),
      comments: comments || ""
    };
    const average = (parsedEvaluation.tech + parsedEvaluation.learn + parsedEvaluation.adapt + parsedEvaluation.attitude) / 4;
    const savedAt = new Date().toISOString();
    
    const evalStatus = status || 'Completed';

    // Forward evaluation to probation-service MongoDB
    const payload = {
      employeeId: associate.id,
      employeeNumber: associate.employeeId,
      employeeName: associate.name,
      department: associate.department || associate.project.phase,
      project: associate.project.name,
      evaluationMonth: fullMonthName,
      evaluationYear: new Date().getFullYear().toString(),
      performanceScore: parsedEvaluation.tech,
      attendanceScore: parsedEvaluation.attitude,
      productivityScore: parsedEvaluation.learn,
      communicationScore: parsedEvaluation.adapt,
      learningScore: parsedEvaluation.learn,
      collaborationScore: parsedEvaluation.adapt,
      overallScore: average,
      hrRemarks: parsedEvaluation.comments,
      evaluationStatus: evalStatus,
      lockedBy: evalStatus === 'Locked' ? req.user.name : null,
      lockedDate: evalStatus === 'Locked' ? new Date().toISOString() : null
    };

    const probationSaveRes = await fetch(`${probationUrl}/api/evaluation-reports/save`, {
      method: 'POST',
      headers: {
        Authorization: req.headers.authorization,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!probationSaveRes.ok) {
      const errData = await probationSaveRes.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to save evaluation to database');
    }

    const historyEntry = {
      month,
      monthKey,
      ...parsedEvaluation,
      average: Number(average.toFixed(3)),
      savedAt,
      locked: evalStatus === 'Locked',
      status: evalStatus,
      lockedBy: evalStatus === 'Locked' ? req.user.name : null,
      lockedDate: evalStatus === 'Locked' ? new Date().toISOString() : null,
    };

    const history = associate.history || [];
    const existingMonthIndex = history.findIndex((item) => item.monthKey === monthKey);
    associate.history =
      existingMonthIndex >= 0
        ? history.map((item, index) => (index === existingMonthIndex ? historyEntry : item))
        : [...history, historyEntry];
    associate.averagePerformanceScore = Number(
      (associate.history.reduce((sum, item) => sum + item.average, 0) / associate.history.length).toFixed(2)
    );
    associate.evaluationLockedForMonth = evalStatus === 'Locked' ? monthKey : associate.evaluationLockedForMonth;
    associate.currentEvaluation = createFreshEvaluation();

    if (average >= 4.0) {
      associate.status = "On Track";
    } else if (average >= 3.0) {
      associate.status = "On Track";
    } else {
      associate.status = "Needs Improvement";
    }

    db[associateIndex] = associate;
    writeDb(db);
    
    // Return dynamically enriched associate
    const returnVal = enrichAssociate(associate);
    returnVal.history = returnVal.history.map(h => h.monthKey === monthKey ? historyEntry : h);
    res.json(returnVal);
  } catch (error) {
    console.error('Save evaluation error:', error);
    res.status(500).json({ error: error.message || 'Failed to save evaluation' });
  }
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

app.get('/api/managers/:managerId/employees', validateManagerToken, (req, res) => {
  const employees = getEmployeesByManagerId(req.params.managerId);
  res.json(employees);
});

app.get('/api/sync/status', validateManagerToken, (_req, res) => {
  const employees = getEmployeesByManagerId(DEMO_MANAGER.id);
  const db = readDb();
  const syncedAssociates = db.filter((associate) => associate.syncedFromHr);
  const store = readEmployeeStore();

  res.json({
    managerId: DEMO_MANAGER.id,
    managerName: DEMO_MANAGER.name,
    employeeCount: employees.length,
    syncedAssociateCount: syncedAssociates.length,
    lastSyncedAt: employees.length > 0
      ? employees.reduce((latest, employee) => {
          const record = store.employees.find((item) => item.employee_number === employee.employeeNumber);
          if (!record?.updated_at) return latest;
          return !latest || record.updated_at > latest ? record.updated_at : latest;
        }, null)
      : null,
  });
});

app.post('/api/employees/sync', async (req, res) => {
  const employees = Array.isArray(req.body?.employees) ? req.body.employees : [];
  if (employees.length === 0) {
    return res.status(400).json({ error: 'No employees provided for sync' });
  }

  const associates = syncEmployeesIntoManagerDb(employees);
  res.json({
    synced: employees.length,
    associates: associates.filter((associate) => associate.syncedFromHr),
  });
});

app.get('/api/managers/demo', validateManagerToken, (_req, res) => {
  res.json({
    ...DEMO_MANAGER,
    employeeId: DEMO_MANAGER.employee_id,
  });
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

// Evaluation Reports API
app.get('/api/evaluation-reports/dashboard', validateManagerToken, (req, res) => {
  const db = readDb();
  const { period, startDate, endDate, months, department, project } = req.query;

  let allEvaluations = db.flatMap(associate => 
    (associate.history || []).map(h => ({
      employeeId: associate.employeeId,
      employeeName: associate.name,
      department: associate.department,
      project: associate.project?.name,
      managerId: associate.manager,
      ...h
    }))
  );

  // Apply filters
  if (period === 'monthly') {
    const currentMonth = new Date().toISOString().slice(0, 7);
    allEvaluations = allEvaluations.filter(e => e.savedAt?.startsWith(currentMonth));
  } else if (period === 'quarterly') {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
    const quarterEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
    allEvaluations = allEvaluations.filter(e => {
      const date = new Date(e.savedAt);
      return date >= quarterStart && date <= quarterEnd;
    });
  } else if (period === 'yearly') {
    const currentYear = new Date().getFullYear().toString();
    allEvaluations = allEvaluations.filter(e => e.evaluationYear === currentYear);
  } else if (period === 'custom' && startDate && endDate) {
    allEvaluations = allEvaluations.filter(e => {
      const date = new Date(e.savedAt);
      return date >= new Date(startDate) && date <= new Date(endDate);
    });
  } else if (months) {
    // Multi-month selection (e.g., "2026-01,2026-03,2026-06")
    const selectedMonths = months.split(',');
    allEvaluations = allEvaluations.filter(e => 
      selectedMonths.some(m => e.monthKey?.startsWith(m))
    );
  }

  if (department) {
    allEvaluations = allEvaluations.filter(e => e.department === department);
  }

  if (project) {
    allEvaluations = allEvaluations.filter(e => e.project === project);
  }

  const totalEvaluated = new Set(allEvaluations.map(e => e.employeeId)).size;
  const lockedCycles = allEvaluations.filter(e => e.status === 'Locked').length;
  const completedCycles = allEvaluations.filter(e => e.status === 'Completed').length;
  const pendingCycles = allEvaluations.filter(e => e.status === 'Pending' || e.status === 'In Review').length;
  const avgRating = allEvaluations.length > 0 
    ? (allEvaluations.reduce((sum, e) => sum + e.average, 0) / allEvaluations.length).toFixed(2)
    : 0;

  res.json({
    totalEvaluatedEmployees: totalEvaluated,
    pendingEvaluations: pendingCycles,
    completedEvaluations: completedCycles,
    lockedEvaluations: lockedCycles,
    averageRating: parseFloat(avgRating)
  });
});

app.get('/api/evaluation-reports', validateManagerToken, (req, res) => {
  const db = readDb();
  const {
    period,
    startDate,
    endDate,
    employeeId,
    department,
    project,
    managerId,
    status,
    months
  } = req.query;

  let evaluations = db.flatMap(associate => 
    (associate.history || []).map(h => ({
      employeeId: associate.employeeId,
      employeeName: associate.name,
      department: associate.department,
      project: associate.project?.name,
      managerId: associate.manager,
      evaluationMonth: h.month,
      evaluationYear: h.monthKey?.split('-')[0],
      performanceScore: h.tech,
      attendanceScore: h.attitude,
      productivityScore: h.learn,
      communicationScore: h.adapt,
      learningScore: h.learn,
      collaborationScore: h.adapt,
      overallScore: h.average,
      hrRemarks: h.comments,
      status: h.status || 'Completed',
      lockedBy: h.lockedBy,
      lockedDate: h.lockedDate,
      savedAt: h.savedAt
    }))
  );

  // Filter by period
  if (period === 'monthly') {
    const currentMonth = new Date().toISOString().slice(0, 7);
    evaluations = evaluations.filter(e => e.savedAt?.startsWith(currentMonth));
  } else if (period === 'quarterly') {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
    const quarterEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
    evaluations = evaluations.filter(e => {
      const date = new Date(e.savedAt);
      return date >= quarterStart && date <= quarterEnd;
    });
  } else if (period === 'yearly') {
    const currentYear = new Date().getFullYear().toString();
    evaluations = evaluations.filter(e => e.evaluationYear === currentYear);
  } else if (period === 'custom' && startDate && endDate) {
    evaluations = evaluations.filter(e => {
      const date = new Date(e.savedAt);
      return date >= new Date(startDate) && date <= new Date(endDate);
    });
  } else if (months) {
    // Multi-month selection (e.g., "2026-01,2026-03,2026-06")
    const selectedMonths = months.split(',');
    evaluations = evaluations.filter(e => 
      selectedMonths.some(m => {
        const evalMonth = e.evaluationYear + '-' + getMonthNum(e.evaluationMonth);
        return evalMonth.startsWith(m);
      })
    );
  }

  // Filter by employee
  if (employeeId) {
    evaluations = evaluations.filter(e => e.employeeId === employeeId);
  }

  // Filter by department
  if (department) {
    evaluations = evaluations.filter(e => e.department === department);
  }

  // Filter by project
  if (project) {
    evaluations = evaluations.filter(e => e.project === project);
  }

  // Filter by manager
  if (managerId) {
    evaluations = evaluations.filter(e => e.managerId === managerId);
  }

  // Filter by status
  if (status) {
    evaluations = evaluations.filter(e => e.status === status);
  }

  // Role-based filtering - managers can only see their own employees
  if (req.user.role === 'manager' && !managerId) {
    evaluations = evaluations.filter(e => e.managerId === req.user.name);
  }

  res.json({ evaluations });
});

app.get('/api/evaluation-reports/:employeeId', validateManagerToken, (req, res) => {
  const db = readDb();
  const { employeeId } = req.params;

  const associate = db.find(a => a.employeeId === employeeId);
  if (!associate) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  // Role-based check
  if (req.user.role === 'manager' && associate.manager !== req.user.name) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const evaluations = (associate.history || []).map(h => ({
    employeeId: associate.employeeId,
    employeeName: associate.name,
    department: associate.department,
    project: associate.project?.name,
    managerId: associate.manager,
    evaluationMonth: h.month,
    evaluationYear: h.monthKey?.split('-')[0],
    performanceScore: h.tech,
    attendanceScore: h.attitude,
    productivityScore: h.learn,
    communicationScore: h.adapt,
    learningScore: h.learn,
    collaborationScore: h.adapt,
    overallScore: h.average,
    hrRemarks: h.comments,
    status: h.status || 'Completed',
    lockedBy: h.lockedBy,
    lockedDate: h.lockedDate,
    savedAt: h.savedAt
  }));

  res.json({
    employee: {
      id: associate.id,
      employeeId: associate.employeeId,
      name: associate.name,
      department: associate.department,
      project: associate.project,
      manager: associate.manager,
      joinDate: associate.joinDate,
      probationDurationMonths: associate.probationDurationMonths,
      probationEndDate: associate.probationEndDate,
      status: associate.status
    },
    evaluations
  });
});

// HR Lock/Unlock Evaluation Endpoint
app.post('/api/evaluation-reports/:employeeId/lock', async (req, res) => {
  const { employeeId } = req.params;
  const { monthKey, lock } = req.body;
  
  if (typeof lock !== 'boolean') {
    return res.status(400).json({ error: 'lock parameter must be a boolean' });
  }

  const db = readDb();
  const associateIndex = db.findIndex(a => a.employeeId === employeeId);
  
  if (associateIndex === -1) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  const associate = db[associateIndex];
  const historyEntry = associate.history?.find(h => h.monthKey === monthKey);
  
  if (!historyEntry) {
    return res.status(404).json({ error: 'Evaluation not found for the specified month' });
  }

  // Update local history
  historyEntry.locked = lock;
  historyEntry.status = lock ? 'Locked' : 'Completed';
  if (lock) {
    historyEntry.lockedBy = req.user?.name || 'HR Specialist';
    historyEntry.lockedDate = new Date().toISOString();
  } else {
    historyEntry.lockedBy = null;
    historyEntry.lockedDate = null;
  }

  writeDb(db);

  // Also update in probation-service MongoDB
  try {
    const probationUrl = process.env.PROBATION_SERVICE_URL || 'http://localhost:5004';
    const monthName = historyEntry.month;
    const year = monthKey.split('-')[0];
    
    const checkRes = await fetch(`${probationUrl}/api/evaluation-reports?employeeNumber=${employeeId}`, {
      headers: { Authorization: req.headers.authorization }
    });
    
    if (checkRes.ok) {
      const data = await checkRes.json();
      const evaluations = data.evaluations || [];
      const mongoEval = evaluations.find(e => 
        getMonthLongName(e.evaluationMonth) === monthName && 
        e.evaluationYear === year
      );
      
      if (mongoEval) {
        await fetch(`${probationUrl}/api/evaluation-reports/${mongoEval._id}/lock`, {
          method: 'POST',
          headers: {
            Authorization: req.headers.authorization,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ lock })
        });
      }
    }
  } catch (error) {
    console.error('Failed to sync lock status to probation-service:', error);
  }

  res.json({
    message: lock ? 'Evaluation locked successfully' : 'Evaluation unlocked successfully',
    evaluation: historyEntry
  });
});

app.post('/api/evaluation-reports/bulk', validateManagerToken, (req, res) => {
  const db = readDb();
  const { employeeIds, filters } = req.body;

  let targetEmployees = db;
  if (employeeIds && employeeIds.length > 0) {
    targetEmployees = db.filter(a => employeeIds.includes(a.employeeId));
  }

  // Role-based filtering
  if (req.user.role === 'manager') {
    targetEmployees = targetEmployees.filter(e => e.manager === req.user.name);
  }

  const allEvaluations = targetEmployees.flatMap(associate => 
    (associate.history || []).map(h => ({
      employeeId: associate.employeeId,
      employeeName: associate.name,
      department: associate.department,
      project: associate.project?.name,
      managerId: associate.manager,
      evaluationMonth: h.month,
      evaluationYear: h.monthKey?.split('-')[0],
      performanceScore: h.tech,
      attendanceScore: h.attitude,
      productivityScore: h.learn,
      communicationScore: h.adapt,
      learningScore: h.learn,
      collaborationScore: h.adapt,
      overallScore: h.average,
      hrRemarks: h.comments,
      status: h.status || 'Completed',
      lockedBy: h.lockedBy,
      lockedDate: h.lockedDate,
      savedAt: h.savedAt
    }))
  );

  // Apply filters if provided
  let filteredEvaluations = allEvaluations;
  if (filters?.period === 'monthly') {
    const currentMonth = new Date().toISOString().slice(0, 7);
    filteredEvaluations = filteredEvaluations.filter(e => e.savedAt?.startsWith(currentMonth));
  } else if (filters?.period === 'quarterly') {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
    const quarterEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
    filteredEvaluations = filteredEvaluations.filter(e => {
      const date = new Date(e.savedAt);
      return date >= quarterStart && date <= quarterEnd;
    });
  } else if (filters?.period === 'yearly') {
    const currentYear = new Date().getFullYear().toString();
    filteredEvaluations = filteredEvaluations.filter(e => e.evaluationYear === currentYear);
  }

  // Calculate summaries
  const averageRatings = filteredEvaluations.length > 0
    ? {
        performance: (filteredEvaluations.reduce((sum, e) => sum + e.performanceScore, 0) / filteredEvaluations.length).toFixed(2),
        attendance: (filteredEvaluations.reduce((sum, e) => sum + e.attendanceScore, 0) / filteredEvaluations.length).toFixed(2),
        productivity: (filteredEvaluations.reduce((sum, e) => sum + e.productivityScore, 0) / filteredEvaluations.length).toFixed(2),
        communication: (filteredEvaluations.reduce((sum, e) => sum + e.communicationScore, 0) / filteredEvaluations.length).toFixed(2),
        learning: (filteredEvaluations.reduce((sum, e) => sum + e.learningScore, 0) / filteredEvaluations.length).toFixed(2),
        collaboration: (filteredEvaluations.reduce((sum, e) => sum + e.collaborationScore, 0) / filteredEvaluations.length).toFixed(2),
        overall: (filteredEvaluations.reduce((sum, e) => sum + e.overallScore, 0) / filteredEvaluations.length).toFixed(2)
      }
    : null;

  const departmentSummary = {};
  filteredEvaluations.forEach(e => {
    if (!departmentSummary[e.department]) {
      departmentSummary[e.department] = { count: 0, totalScore: 0 };
    }
    departmentSummary[e.department].count++;
    departmentSummary[e.department].totalScore += e.overallScore;
  });

  const departmentAverages = Object.entries(departmentSummary).map(([dept, data]) => ({
    department: dept,
    employeeCount: data.count,
    averageScore: (data.totalScore / data.count).toFixed(2)
  }));

  const topPerformers = filteredEvaluations
    .filter(e => e.overallScore >= 4.0)
    .slice(0, 10);

  const improvementRequired = filteredEvaluations
    .filter(e => e.overallScore < 3.0)
    .slice(0, 10);

  res.json({
    evaluations: filteredEvaluations,
    summary: {
      totalEvaluations: filteredEvaluations.length,
      averageRatings,
      departmentAverages,
      topPerformers,
      improvementRequired
    }
  });
});

app.post('/api/evaluation-reports/lock/:employeeId/:monthKey', validateManagerToken, (req, res) => {
  const db = readDb();
  const { employeeId, monthKey } = req.params;

  const associateIndex = db.findIndex(a => a.employeeId === employeeId);
  if (associateIndex === -1) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  const associate = db[associateIndex];

  // Role-based check - only HR can lock evaluations
  if (req.user.role !== 'hr') {
    return res.status(403).json({ error: 'Only HR can lock evaluations' });
  }

  const history = associate.history || [];
  const historyIndex = history.findIndex(h => h.monthKey === monthKey);

  if (historyIndex === -1) {
    return res.status(404).json({ error: 'Evaluation not found' });
  }

  const evaluation = history[historyIndex];
  if (evaluation.status === 'Locked') {
    return res.status(409).json({ error: 'Evaluation already locked' });
  }

  evaluation.status = 'Locked';
  evaluation.lockedBy = req.user.name;
  evaluation.lockedDate = new Date().toISOString();
  evaluation.locked = true;

  db[associateIndex] = associate;
  writeDb(db);

  res.json({ message: 'Evaluation locked successfully', evaluation });
});

app.post('/api/evaluation-reports/unlock/:employeeId/:monthKey', validateManagerToken, (req, res) => {
  const db = readDb();
  const { employeeId, monthKey } = req.params;

  const associateIndex = db.findIndex(a => a.employeeId === employeeId);
  if (associateIndex === -1) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  const associate = db[associateIndex];

  // Role-based check - only HR can unlock evaluations
  if (req.user.role !== 'hr') {
    return res.status(403).json({ error: 'Only HR can unlock evaluations' });
  }

  const history = associate.history || [];
  const historyIndex = history.findIndex(h => h.monthKey === monthKey);

  if (historyIndex === -1) {
    return res.status(404).json({ error: 'Evaluation not found' });
  }

  const evaluation = history[historyIndex];
  if (evaluation.status !== 'Locked') {
    return res.status(409).json({ error: 'Evaluation is not locked' });
  }

  evaluation.status = 'Completed';
  evaluation.lockedBy = null;
  evaluation.lockedDate = null;
  evaluation.locked = false;

  db[associateIndex] = associate;
  writeDb(db);

  res.json({ message: 'Evaluation unlocked successfully', evaluation });
});

app.listen(PORT, () => {
  console.log(`Manager service listening on http://localhost:${PORT}`);
});

