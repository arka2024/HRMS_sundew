import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_DIR = path.resolve(__dirname, '../employee-store');
const STORE_PATH = path.join(STORE_DIR, 'db.json');

export const DEMO_MANAGER = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  employee_id: 'MGR001',
  name: 'Demo Manager',
  email: 'demo.manager@sundew.com',
};

const DEFAULT_STORE = {
  managers: [DEMO_MANAGER],
  employees: [],
  uploadHistory: [],
};

function ensureStore() {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }

  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(DEFAULT_STORE, null, 2));
  }
}

export function readEmployeeStore() {
  ensureStore();

  try {
    const data = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    return {
      managers: Array.isArray(parsed.managers) ? parsed.managers : [DEMO_MANAGER],
      employees: Array.isArray(parsed.employees) ? parsed.employees : [],
      uploadHistory: Array.isArray(parsed.uploadHistory) ? parsed.uploadHistory : [],
    };
  } catch (error) {
    console.error('Employee store read failed:', error);
    return { ...DEFAULT_STORE };
  }
}

export function writeEmployeeStore(store) {
  ensureStore();
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

function normalizeHeader(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function readField(record, aliases) {
  const entries = Object.entries(record || {});
  const match = entries.find(([key]) => aliases.includes(normalizeHeader(key)));
  return match ? match[1] : undefined;
}

export function validateUploadedEmployee(record, rowNumber, toIsoDate) {
  const employeeNumber = String(
    readField(record, ['employeenumber', 'empno', 'empid', 'employeeid', 'employee']) || '',
  ).trim();
  const employeeName = String(
    readField(record, ['employeename', 'name', 'fullname']) || '',
  ).trim();
  const dateOfJoining = toIsoDate(readField(record, ['dateofjoining', 'doj', 'joiningdate', 'date']));
  const hoursRaw = readField(record, ['totalhoursworked', 'hoursworked', 'hours', 'totalhours']);
  const totalHoursWorked = Number.parseInt(String(hoursRaw ?? '').trim(), 10);
  const department = String(readField(record, ['department', 'dept']) || '').trim();
  const projectName = String(
    readField(record, ['projectname', 'project', 'assignment']) || '',
  ).trim();
  const probationDurationRaw = readField(record, ['probationdurationmonths', 'probationduration', 'probationmonths', 'probation']);
  const probationDurationMonths = Number.parseInt(String(probationDurationRaw || '4').trim(), 10) || 4;

  const errors = [];
  if (!employeeNumber) errors.push('Employee Number is required');
  if (!employeeName) errors.push('Employee Name is required');
  if (!dateOfJoining) errors.push('Date of Joining must be a valid date');
  if (!Number.isInteger(totalHoursWorked) || totalHoursWorked < 0) {
    errors.push('Total Hours Worked must be a non-negative integer');
  }
  if (!department) errors.push('Department is required');
  if (!projectName) errors.push('Project Name is required');
  if (!Number.isInteger(probationDurationMonths) || probationDurationMonths <= 0) {
    errors.push('Probation Duration must be a positive month count');
  }

  if (errors.length > 0) {
    return {
      ok: false,
      error: {
        row: rowNumber,
        employeeNumber: employeeNumber || undefined,
        reason: errors.join('; '),
      },
    };
  }

  return {
    ok: true,
    value: {
      employee_number: employeeNumber,
      employee_name: employeeName,
      date_of_joining: dateOfJoining,
      total_hours_worked: totalHoursWorked,
      department,
      project_name: projectName,
      probation_duration_months: probationDurationMonths,
    },
  };
}

export function toEmployeeDto(record) {
  return {
    employeeNumber: record.employee_number,
    employeeName: record.employee_name,
    dateOfJoining: record.date_of_joining,
    totalHoursWorked: record.total_hours_worked,
    department: record.department,
    projectName: record.project_name,
    probationDurationMonths: record.probation_duration_months || 4,
  };
}

export function upsertEmployees(records, managerId = DEMO_MANAGER.id) {
  const store = readEmployeeStore();
  const now = new Date().toISOString();
  const byEmployeeNumber = new Map(store.employees.map((item) => [item.employee_number, item]));

  const saved = records.map((record) => {
    const existing = byEmployeeNumber.get(record.employee_number);
    const next = {
      id: existing?.id || randomUUID(),
      employee_number: record.employee_number,
      employee_name: record.employee_name,
      date_of_joining: record.date_of_joining,
      total_hours_worked: record.total_hours_worked,
      department: record.department,
      project_name: record.project_name,
      probation_duration_months: record.probation_duration_months || existing?.probation_duration_months || 4,
      manager_id: managerId,
      created_at: existing?.created_at || now,
      updated_at: now,
    };
    byEmployeeNumber.set(record.employee_number, next);
    return next;
  });

  store.employees = [...byEmployeeNumber.values()];
  writeEmployeeStore(store);
  return saved;
}

export function addUploadHistoryEntry(entry) {
  const store = readEmployeeStore();
  const historyItem = {
    id: randomUUID(),
    fileName: entry.fileName,
    uploadedAt: new Date().toISOString(),
    uploadedBy: entry.uploadedBy || 'HR Specialist',
    successCount: entry.successCount,
    failedCount: entry.failedCount,
    errors: entry.errors || [],
  };
  store.uploadHistory.unshift(historyItem);
  writeEmployeeStore(store);
  return historyItem;
}

export function getEmployeesByManagerId(managerId) {
  const store = readEmployeeStore();
  return store.employees
    .filter((employee) => employee.manager_id === managerId)
    .map(toEmployeeDto);
}

export function getAllEmployees() {
  return readEmployeeStore().employees.map(toEmployeeDto);
}

export function getUploadHistory() {
  return readEmployeeStore().uploadHistory;
}

export function getDemoManager() {
  const store = readEmployeeStore();
  return store.managers.find((manager) => manager.id === DEMO_MANAGER.id) || DEMO_MANAGER;
}
