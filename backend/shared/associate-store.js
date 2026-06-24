import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_DIR = path.resolve(__dirname, '../associate-store');
const STORE_PATH = path.join(STORE_DIR, 'db.json');

function ensureStore() {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }

  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify({ associates: [] }, null, 2));
  }
}

export function readAssociateStore() {
  ensureStore();

  try {
    const data = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    return {
      associates: Array.isArray(parsed.associates) ? parsed.associates : [],
    };
  } catch (error) {
    console.error('Associate store read failed:', error);
    return { associates: [] };
  }
}

export function writeAssociateStore(store) {
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

function formatIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function parseExcelSerialDate(value) {
  const excelEpoch = Date.UTC(1899, 11, 30);
  const date = new Date(excelEpoch + Number(value) * 24 * 60 * 60 * 1000);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toIsoDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatIsoDate(value);
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = parseExcelSerialDate(value);
    return date ? formatIsoDate(date) : null;
  }

  const text = String(value || '').trim();
  if (!text) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const date = new Date(`${text}T00:00:00Z`);
    return Number.isNaN(date.getTime()) ? null : text;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : formatIsoDate(parsed);
}

export function addMonthsToIsoDate(isoDate, months) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const result = new Date(Date.UTC(year, month - 1, day));
  result.setUTCMonth(result.getUTCMonth() + months);

  if (result.getUTCDate() !== day) {
    result.setUTCDate(0);
  }

  return formatIsoDate(result);
}

export function validateUploadedAssociate(record, rowNumber) {
  const employeeId = String(readField(record, ['employeeid', 'empid', 'employee']) || '').trim();
  const name = String(readField(record, ['employeename', 'name', 'associatename']) || '').trim();
  const dateOfJoining = toIsoDate(readField(record, ['dateofjoining', 'doj', 'joiningdate']));
  const durationRaw = readField(record, [
    'probationdurationmonths',
    'probationduration',
    'durationmonths',
  ]);
  const probationDurationMonths = Number.parseInt(String(durationRaw || '').trim(), 10);
  const designation = String(readField(record, ['designation', 'role', 'title', 'position']) || '').trim();

  const errors = [];
  if (!employeeId) errors.push('Employee ID is required');
  if (!name) errors.push('Employee Name is required');
  if (!dateOfJoining) errors.push('Date of Joining must be a valid date');
  if (!Number.isInteger(probationDurationMonths) || probationDurationMonths <= 0) {
    errors.push('Probation Duration must be a positive month count');
  }

  if (errors.length > 0) {
    return {
      ok: false,
      error: {
        row: rowNumber,
        employeeId: employeeId || undefined,
        reason: errors.join('; '),
        raw: record,
      },
    };
  }

  return {
    ok: true,
    value: {
      employee_id: employeeId,
      name,
      designation,
      date_of_joining: dateOfJoining,
      probation_duration_months: probationDurationMonths,
      probation_end_date: addMonthsToIsoDate(dateOfJoining, probationDurationMonths),
    },
  };
}

function calculateProbationProgress(dateOfJoining, probationEndDate, now = new Date()) {
  const start = Date.parse(`${dateOfJoining}T00:00:00Z`);
  const end = Date.parse(`${probationEndDate}T00:00:00Z`);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 100;
  }

  const percentage = ((today - start) / (end - start)) * 100;
  return Math.round(Math.min(100, Math.max(0, percentage)));
}

export function upsertAssociates(records) {
  const store = readAssociateStore();
  const now = new Date().toISOString();
  const byEmployeeId = new Map(store.associates.map((item) => [item.employee_id, item]));

  const saved = records.map((record) => {
    const existing = byEmployeeId.get(record.employee_id);
    const next = {
      id: existing?.id || randomUUID(),
      employee_id: record.employee_id,
      name: record.name,
      designation: record.designation || existing?.designation || '',
      date_of_joining: record.date_of_joining,
      probation_duration_months: record.probation_duration_months,
      probation_end_date: record.probation_end_date,
      task_count: Number.isFinite(existing?.task_count) ? existing.task_count : 0,
      created_at: existing?.created_at || now,
      updated_at: now,
    };
    byEmployeeId.set(record.employee_id, next);
    return next;
  });

  writeAssociateStore({ associates: [...byEmployeeId.values()] });
  return saved;
}

function calculateMonthsWorking(dateOfJoining, now = new Date()) {
  const start = new Date(`${dateOfJoining}T00:00:00Z`);
  if (Number.isNaN(start.getTime())) return 0;
  
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const yearDiff = today.getUTCFullYear() - start.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - start.getUTCMonth();
  return Math.max(0, yearDiff * 12 + monthDiff);
}

export function toProcessedAssociate(record) {
  return {
    employeeId: record.employee_id,
    name: record.name,
    designation: record.designation || '',
    dateOfJoining: record.date_of_joining,
    probationDurationMonths: record.probation_duration_months,
    probationEndDate: record.probation_end_date,
    probationProgress: calculateProbationProgress(record.date_of_joining, record.probation_end_date),
    monthsWorking: calculateMonthsWorking(record.date_of_joining),
    taskCount: Number.isFinite(record.task_count) ? record.task_count : 0,
  };
}

export function getProcessedAssociates() {
  return readAssociateStore().associates.map(toProcessedAssociate);
}

export function getProcessedAssociateByEmployeeId(employeeId) {
  return getProcessedAssociates().find(
    (associate) => associate.employeeId.toLowerCase() === String(employeeId || '').toLowerCase(),
  );
}

export async function syncAssociateTaskCounts(taskServiceUrl) {
  const store = readAssociateStore();
  const updated = [];
  const failedRecords = [];

  for (const associate of store.associates) {
    try {
      const response = await fetch(
        `${taskServiceUrl.replace(/\/$/, '')}/tasks/employee/${encodeURIComponent(associate.employee_id)}`,
      );

      if (!response.ok) {
        throw new Error(`Task service returned ${response.status}`);
      }

      const payload = await response.json();
      const totalTasks = Number(payload.totalTasks);
      if (!Number.isFinite(totalTasks) || totalTasks < 0) {
        throw new Error('Task service response did not include a valid totalTasks value');
      }

      associate.task_count = Math.round(totalTasks);
      associate.updated_at = new Date().toISOString();
      updated.push(toProcessedAssociate(associate));
    } catch (error) {
      failedRecords.push({
        employeeId: associate.employee_id,
        reason: error instanceof Error ? error.message : 'Task sync failed',
      });
    }
  }

  writeAssociateStore(store);

  return {
    summary: {
      total: store.associates.length,
      updated: updated.length,
      failed: failedRecords.length,
    },
    updatedRecords: updated,
    failedRecords,
  };
}
