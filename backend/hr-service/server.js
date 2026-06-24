import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { parseBearerToken } from '../../shared/utils/index.js';
import {
  getProcessedAssociateByEmployeeId,
  getProcessedAssociates,
  syncAssociateTaskCounts,
  upsertAssociates,
  validateUploadedAssociate,
} from '../shared/associate-store.js';
import {
  addUploadHistoryEntry,
  getAllEmployees,
  getDemoManager,
  getUploadHistory,
  toEmployeeDto,
  upsertEmployees,
} from '../shared/employee-store.js';
import {
  parseEmployeeUploadFile,
  processEmployeeRows,
} from './lib/employee-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5000';
const TASK_SERVICE_URL = process.env.TASK_SERVICE_URL || 'http://localhost:4000';
const MANAGER_SERVICE_URL = process.env.MANAGER_SERVICE_URL || 'http://localhost:5002';

const DEFAULT_DB = {
  documents: [],
  activities: [],
  storage: {
    used: 0,
    limit: 50,
    documentsCount: 0,
    mediaCount: 0,
    legal: 0,
    policies: 0,
    records: 0,
  },
};

/* -------------------------------------------------
   Multer – now accepts XLSX / XLS as well as the
   original formats and limits file size to 5 MiB.
   ------------------------------------------------- */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.csv', '.xlsx', '.xls', '.pdf', '.txt', '.doc', '.docx'].includes(ext)) {
      cb(new Error('Unsupported file format'));
      return;
    }
    cb(null, true);
  },
});

/* -------------------------------------------------
   Helper functions (DB, auth, CSV parsing, XLSX parsing)
   ------------------------------------------------- */
function readDb() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    return {
      ...DEFAULT_DB,
      ...parsed,
      documents: Array.isArray(parsed.documents) ? parsed.documents : [],
      activities: Array.isArray(parsed.activities) ? parsed.activities : [],
      storage: {
        ...DEFAULT_DB.storage,
        ...(parsed.storage || {}),
      },
    };
  } catch (error) {
    console.error('Database reading error inside hr‑service:', error);
    return { ...DEFAULT_DB, storage: { ...DEFAULT_DB.storage } };
  }
}
function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Database writing error inside hr‑service:', error);
  }
}
async function validateHrToken(req, res, next) {
  return validatePortalToken(['hr'], req, res, next);
}
async function validatePortalToken(allowedRoles, req, res, next) {
  const token = parseBearerToken(req.headers.authorization);
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/validate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return res.status(401).json({ error: 'Invalid or expired session' });

    const data = await response.json();
    if (!allowedRoles.includes(data.user?.role))
      return res.status(403).json({ error: 'Insufficient portal access' });

    req.user = data.user;
    next();
  } catch {
    return res.status(503).json({ error: 'Auth service unavailable' });
  }
}

/* -------------------------------------------------
   CSV helpers (unchanged)
   ------------------------------------------------- */
function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function parseCsv(text) {
  const lines = String(text || '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const record = {};
    headers.forEach((header, headerIndex) => {
      record[header] = values[headerIndex] ?? '';
    });
    return { ...record, __rowNumber: index + 2 };
  });
}

function parseCsvBuffer(buffer) {
  return parseCsv(buffer.toString('utf-8'));
}

function toLegacyEmployeeSummary(employee) {
  return {
    id: employee.employeeNumber,
    name: employee.employeeName,
    department: employee.department,
    position: employee.projectName,
    status: 'Active',
  };
}

function buildHrDashboardData() {
  const employees = getAllEmployees();
  const departments = new Set(employees.map((employee) => employee.department).filter(Boolean));

  return {
    stats: {
      totalEmployees: employees.length,
      activeEmployees: employees.length,
      onLeave: 0,
      departments: departments.size,
    },
    recentHires: employees
      .slice()
      .sort((left, right) => String(right.dateOfJoining).localeCompare(String(left.dateOfJoining)))
      .slice(0, 5)
      .map(toLegacyEmployeeSummary),
  };
}

function buildReportsSummary() {
  const db = readDb();
  const employees = getAllEmployees();
  const associates = getProcessedAssociates();
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return [
    {
      id: 'workforce-summary',
      title: 'Workforce Summary',
      type: 'Analytics',
      generatedAt: today,
      status: employees.length > 0 ? 'Ready' : 'Pending',
    },
    {
      id: 'probation-associates',
      title: 'Probation Associates',
      type: 'Probation',
      generatedAt: today,
      status: associates.length > 0 ? 'Ready' : 'Pending',
    },
    {
      id: 'document-register',
      title: 'Document Register',
      type: 'Compliance',
      generatedAt: today,
      status: db.documents.length > 0 ? 'Ready' : 'Pending',
    },
  ];
}

/* -------------------------------------------------
   ODM-based Document Parser for Employee Data
   Maps document structures to employee data models
   ------------------------------------------------- */
class EmployeeDocumentODM {
  constructor(extractedText) {
    this.text = extractedText;
    this.employees = [];
  }

  parseEmployeeTable() {
    const lines = this.text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const headerIndex = this.findHeaderIndex(lines);
    
    if (headerIndex === -1) return [];
    
    const headers = this.parseHeaders(lines[headerIndex]);
    const employeeRows = lines.slice(headerIndex + 1);
    
    return employeeRows
      .map(line => this.parseEmployeeRow(line, headers))
      .filter(emp => emp && emp.employeeNumber);
  }

  findHeaderIndex(lines) {
    const headerPatterns = [
      /employee\s*number|employee\s*name|employeenumber/i,
      /emp\s*no|name|doj/i,
      /sds\d+/i
    ];
    
    for (let i = 0; i < lines.length; i++) {
      if (headerPatterns.some(pattern => pattern.test(lines[i]))) {
        return i;
      }
    }
    return -1;
  }

  parseHeaders(headerLine) {
    const parts = headerLine.split(/\s{2,}|\t|,/).map(p => p.trim().toLowerCase());
    const headerMap = {};
    
    parts.forEach((part, index) => {
      if (part.includes('employee') && part.includes('number')) headerMap.employeeNumber = index;
      else if (part.includes('employee') && part.includes('name')) headerMap.employeeName = index;
      else if (part.includes('doj') || part.includes('date') || part.includes('joining')) headerMap.dateOfJoining = index;
      else if (part.includes('hour') || part.includes('hrs')) headerMap.totalHoursWorked = index;
      else if (part.includes('dept') || part.includes('department')) headerMap.department = index;
      else if (part.includes('project')) headerMap.projectName = index;
      else if (part.includes('probation')) headerMap.probationDurationMonths = index;
    });
    
    return headerMap;
  }

  parseEmployeeRow(line, headerMap) {
    const parts = line.split(/\s{2,}|\t|,/).map(p => p.trim());
    
    if (parts.length < 2) return null;
    
    return {
      employeeNumber: parts[headerMap.employeeNumber] || '',
      employeeName: parts[headerMap.employeeName] || '',
      dateOfJoining: parts[headerMap.dateOfJoining] || '',
      totalHoursWorked: parts[headerMap.totalHoursWorked] || '0',
      department: parts[headerMap.department] || '',
      projectName: parts[headerMap.projectName] || '',
      probationDurationMonths: parts[headerMap.probationDurationMonths] || '4'
    };
  }
}

async function parseEmployeeDataFromDocument(fileBuffer, fileName) {
  const ext = path.extname(fileName).toLowerCase();
  let extractedText = '';

  try {
    if (ext === '.pdf') {
      const pdfData = await pdfParse(fileBuffer);
      extractedText = pdfData.text;
    } else if (['txt', 'csv'].includes(ext)) {
      extractedText = fileBuffer.toString('utf-8');
    } else if (['xls', 'xlsx'].includes(ext)) {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      extractedText = XLSX.utils.sheet_to_txt(sheet) || JSON.stringify(XLSX.utils.sheet_to_json(sheet));
    }

    if (!extractedText) return [];

    const odm = new EmployeeDocumentODM(extractedText);
    const employees = odm.parseEmployeeTable();
    
    return employees.map((emp, index) => ({
      ...emp,
      __rowNumber: index + 2
    }));
  } catch (error) {
    console.error('ODM parsing error:', error);
    return [];
  }
}

/* -------------------------------------------------
   XLSX helper – reads the first sheet and returns an
   array of row objects (adds __rowNumber for validation)
   ------------------------------------------------- */
function parseAssociateUploadFile(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.csv') return parseCsvBuffer(file.buffer);

  const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  return XLSX.utils
    .sheet_to_json(workbook.Sheets[sheetName], { defval: '', raw: false })
    .map((record, index) => ({ ...record, __rowNumber: index + 2 }));
}

/* -------------------------------------------------
   API – health, dashboard, basic HR data (unchanged)
   ------------------------------------------------- */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'hr-service', timestamp: new Date().toISOString() });
});
app.get('/dashboard', validateHrToken, (_req, res) => {
  res.json(buildHrDashboardData());
});

app.get('/employees', validateHrToken, (_req, res) => {
  res.json({ employees: getAllEmployees().map(toLegacyEmployeeSummary) });
});

app.get('/reports/summary', validateHrToken, (_req, res) => {
  res.json({ reports: buildReportsSummary() });
});

/* -------------------------------------------------
   **Document upload endpoint – the core change**
   ------------------------------------------------- */
app.post('/api/documents/upload', validateHrToken, upload.single('file'), async (req, res) => {
  // -------------------------------------------------
  // 1️⃣ Gather file info
  // -------------------------------------------------
  let name, type, fileBuffer;
  if (req.file) {
    name = req.file.originalname;
    fileBuffer = req.file.buffer;
    type = req.body.type;
  } else {
    name = req.body.name;
    type = req.body.type;
  }
  if (!name) return res.status(400).json({ error: 'Filename is required' });

  const db = readDb();
  const ext = name.split('.').pop()?.toLowerCase() ?? '';

  // -------------------------------------------------
  // 2️⃣ Determine a friendly doc type (purely UI)
  // -------------------------------------------------
  let docType = 'Document';
  if (['pdf'].includes(ext)) docType = 'PDF Document';
  else if (['doc', 'docx'].includes(ext)) docType = 'MS Word';
  else if (['xls', 'xlsx'].includes(ext)) docType = 'MS Excel';
  else if (['ppt', 'pptx'].includes(ext)) docType = 'Presentation';
  else if (['csv'].includes(ext)) docType = 'CSV File';
  else if (['txt'].includes(ext)) docType = 'Text File';
  else if (['png', 'jpg', 'jpeg'].includes(ext)) docType = 'Image File';
  else if (['zip'].includes(ext)) docType = 'Zip Archive';

  // -------------------------------------------------
  // 3️⃣ Extract raw text and parse employee data using ODM
  // -------------------------------------------------
  let employeeDataUpdated = false;
  let employeeUpdateResult = null;

  if (fileBuffer && ['pdf', 'xls', 'xlsx', 'csv', 'txt'].includes(ext)) {
    try {
      // Use ODM to parse employee data from document
      const employeeRows = await parseEmployeeDataFromDocument(fileBuffer, name);
      
      if (employeeRows.length > 0) {
        console.log(`ODM parsed ${employeeRows.length} employee records from document`);
        
        // Process parsed employee data
        const { successfulRecords, failedRecords } = processEmployeeRowsFromUpload(employeeRows);
        
        if (successfulRecords.length > 0) {
          const demoManager = getDemoManager();
          const savedRecords = upsertEmployees(successfulRecords, demoManager.id);
          
          // Sync to manager service
          try {
            await syncEmployeesToManagerService(savedRecords, req.headers.authorization);
            employeeDataUpdated = true;
            employeeUpdateResult = {
              updated: savedRecords.length,
              failed: failedRecords.length
            };
            console.log(`ODM: Updated ${savedRecords.length} employee records in Manager Portal`);
          } catch (syncError) {
            console.error('ODM Manager sync error:', syncError);
          }
        }
      }

      // -------------------------------------------------
      // 4️⃣ If we got any text, call the manager‑service for evaluations
      // -------------------------------------------------
      let extractedText = '';
      if (ext === 'pdf') {
        const pdfData = await pdfParse(fileBuffer);
        extractedText = pdfData.text;
      } else if (['txt', 'csv'].includes(ext)) {
        extractedText = fileBuffer.toString('utf-8');
      } else if (['xls', 'xlsx'].includes(ext)) {
        try {
          const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          extractedText =
            XLSX.utils.sheet_to_txt(sheet) || JSON.stringify(XLSX.utils.sheet_to_json(sheet));
        } catch (err) {
          console.error('XLSX extraction error:', err);
        }
      }

      if (extractedText && !employeeDataUpdated) {
        // a) Pull the list of associate IDs so the LLM can match them
        const mgrRes = await fetch(
          `${process.env.MANAGER_SERVICE_URL || 'http://localhost:5002'}/api/associates`,
          { headers: { Authorization: req.headers.authorization } }
        );

        if (mgrRes.ok) {
          const associates = await mgrRes.json(); // array of associate objects
          const associateNames = associates.map((a) => `${a.id} (${a.name})`).join(', ');

          // b) Build the Groq prompt
          const groqKey = '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';
          const prompt = `You are an HR Evaluation parser.
Given the following performance review document text, extract the evaluation scores.
Match the associate to one of these valid IDs: ${associateNames}.
Return ONLY a valid JSON object matching this structure (no markdown, no extra text):
{
  "id": "matched-associate-id",
  "tech": 4,
  "learn": 4,
  "adapt": 4,
  "attitude": 4,
  "comments": "Short summary"
}
Document Text:
${extractedText}`;

          // c) Call Groq
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${groqKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.1,
            }),
          });

          if (groqRes.ok) {
            const groqData = await groqRes.json();
            const content = groqData.choices[0].message.content.trim();
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.id) {
                // d) POST the evaluation to the manager‑service
                await fetch(
                  `${process.env.MANAGER_SERVICE_URL || 'http://localhost:5002'}/api/associates/${parsed.id}/evaluations`,
                  {
                    method: 'POST',
                    headers: {
                      Authorization: req.headers.authorization,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(parsed),
                  }
                );
                console.log(`Evaluated ${parsed.id} from document upload`);
              }
            }
          } else {
            console.error('Groq API error', await groqRes.text());
          }
        }
      }
    } catch (e) {
      console.error('ODM/Evaluation error:', e);
    }
  }

  // -------------------------------------------------
  // 5️⃣ Store the document metadata (unchanged)
  // -------------------------------------------------
  const newDoc = {
    id: `doc-${Date.now()}`,
    name,
    type: type || docType,
    dateAdded: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    owner: req.user.name || 'HR Specialist',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCCEBSgyvWhWcUFD0_sFk0Z5fn365kbumbRqrv0GfIZuJzhpIr_eUJNWeIBGOl3ilIv7K2R5i4SFlgLPUmMLkSojNB61S0Y-tspj1SNDCxbSMr327OASz9b24mdOjMqUvq2GKMtN4H5b8Se1gxiKRGOkQKZgNqW7QE59DYjL4guWRIGz4azjNWxeGTr8iJBEJBzwMmY-49ETYtOTynhsY_SqQ6vOxPyxzNOP3VZLhi8Skrjr1D3s7TyorKUMJf9YiCbHAmFsV07M9c',
  };

  db.documents.unshift(newDoc);

  // -------------------------------------------------
  // 6️⃣ Activity log & storage usage (unchanged)
  // -------------------------------------------------
  const newActivity = {
    id: `act-${Date.now()}`,
    user: req.user.name || 'HR Specialist',
    action: employeeDataUpdated ? 'uploaded and updated employee data' : 'uploaded',
    target: name,
    time: 'Just now',
  };
  db.activities.unshift(newActivity);
  const sizeMb = Math.floor(Math.random() * 5) + 1; // 1‑5 MiB
  db.storage.used = parseFloat((db.storage.used + sizeMb / 1024).toFixed(2));
  db.storage.documentsCount += 1;
  db.storage.records = parseFloat((db.storage.records + sizeMb / 1024).toFixed(2));

  writeDb(db);
  
  const response = { ...newDoc };
  if (employeeUpdateResult) {
    response.employeeUpdate = employeeUpdateResult;
  }
  
  res.status(201).json(response);
});

/* -------------------------------------------------
   Remaining HR‑service routes (associate upload,
   sync‑tasks, getters, activity, storage, etc.)
   ------------------------------------------------- */
app.post('/api/associates/upload', (req, res) => {
  upload.single('file')(req, res, (error) => {
    if (error) return res.status(400).json({ error: error.message });
    if (!req.file) return res.status(400).json({ error: 'Associate upload file is required' });

    let rows;
    try {
      rows = parseAssociateUploadFile(req.file);
    } catch (parseError) {
      return res.status(400).json({
        error: parseError instanceof Error ? parseError.message : 'Unable to parse upload file',
      });
    }
    if (rows.length === 0) return res.status(400).json({ error: 'Upload file did not contain associate rows' });

    const successfulRecords = [];
    const failedRecords = [];

    rows.forEach((row, index) => {
      const result = validateUploadedAssociate(row, row.__rowNumber || index + 2);
      if (result.ok) successfulRecords.push(result.value);
      else failedRecords.push(result.error);
    });

    const savedRecords = upsertAssociates(successfulRecords);
    res.status(201).json({
      summary: {
        total: rows.length,
        successful: savedRecords.length,
        failed: failedRecords.length,
      },
      successfulRecords: savedRecords.map((r) => ({
        employeeId: r.employee_id,
        name: r.name,
        designation: r.designation,
        dateOfJoining: r.date_of_joining,
        probationDurationMonths: r.probation_duration_months,
        probationEndDate: r.probation_end_date,
      })),
      failedRecords,
    });
  });
});

app.post('/api/associates/sync-tasks', async (_req, res) => {
  const result = await syncAssociateTaskCounts(TASK_SERVICE_URL);
  res.json(result);
});

app.get('/api/associates', (_req, res) => {
  res.json({ associates: getProcessedAssociates() });
});

app.get('/api/associates/:employeeId', (req, res) => {
  const associate = getProcessedAssociateByEmployeeId(req.params.employeeId);
  if (!associate) return res.status(404).json({ error: 'Associate not found' });
  res.json(associate);
});

app.get('/api/documents', validateHrToken, (_req, res) => {
  const db = readDb();
  res.json({ documents: db.documents || [] });
});

app.get('/api/activity', validateHrToken, (_req, res) => {
  const db = readDb();
  res.json({ activities: db.activities });
});

app.get('/api/storage', validateHrToken, (_req, res) => {
  const db = readDb();
  res.json({ storage: db.storage });
});

async function syncEmployeesToManagerService(employees, authHeader) {
  const response = await fetch(`${MANAGER_SERVICE_URL}/api/employees/sync`, {
    method: 'POST',
    headers: {
      Authorization: authHeader || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ employees: employees.map(toEmployeeDto) }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Manager Portal sync failed');
  }

  return response.json();
}

function processEmployeeRowsFromUpload(rows) {
  return processEmployeeRows(rows);
}

app.post('/api/employees/preview', validateHrToken, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Employee upload file is required' });

  try {
    const rows = await parseEmployeeUploadFile(req.file);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Upload file did not contain employee rows' });
    }

    const { successfulRecords, failedRecords } = processEmployeeRowsFromUpload(rows);
    res.json({
      fileName: req.file.originalname,
      preview: successfulRecords.map(toEmployeeDto),
      failedRecords,
      summary: {
        total: rows.length,
        valid: successfulRecords.length,
        failed: failedRecords.length,
      },
    });
  } catch (parseError) {
    return res.status(400).json({
      error: parseError instanceof Error ? parseError.message : 'Unable to parse upload file',
    });
  }
});

app.post('/api/employees/upload', validateHrToken, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Employee upload file is required' });

  try {
    const rows = await parseEmployeeUploadFile(req.file);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Upload file did not contain employee rows' });
    }

    const { successfulRecords, failedRecords } = processEmployeeRowsFromUpload(rows);
    const demoManager = getDemoManager();
    const savedRecords = upsertEmployees(successfulRecords, demoManager.id);

    let managerSync = null;
    try {
      managerSync = await syncEmployeesToManagerService(savedRecords, req.headers.authorization);
    } catch (syncError) {
      console.error('Manager sync error:', syncError);
      return res.status(502).json({
        error: 'Employees saved but Manager Portal sync failed. Retry upload or contact support.',
        successCount: savedRecords.length,
        failedCount: failedRecords.length,
        errors: failedRecords,
      });
    }

    addUploadHistoryEntry({
      fileName: req.file.originalname,
      uploadedBy: req.user?.name || 'HR Specialist',
      successCount: savedRecords.length,
      failedCount: failedRecords.length,
      errors: failedRecords,
    });

    const db = readDb();
    db.activities.unshift({
      id: `act-${Date.now()}`,
      user: req.user?.name || 'HR Specialist',
      action: 'imported employees',
      target: req.file.originalname,
      time: 'Just now',
    });
    writeDb(db);

    res.status(201).json({
      successCount: savedRecords.length,
      failedCount: failedRecords.length,
      errors: failedRecords,
      employees: savedRecords.map(toEmployeeDto),
      managerId: demoManager.id,
      managerSync,
    });
  } catch (parseError) {
    return res.status(400).json({
      error: parseError instanceof Error ? parseError.message : 'Unable to parse upload file',
    });
  }
});

app.get('/api/employees', validateHrToken, (_req, res) => {
  res.json({ employees: getAllEmployees() });
});

app.get('/api/employees/upload-history', validateHrToken, (_req, res) => {
  res.json({ history: getUploadHistory() });
});

app.listen(PORT, () => {
  console.log(`HR service listening on http://localhost:${PORT}`);
});
