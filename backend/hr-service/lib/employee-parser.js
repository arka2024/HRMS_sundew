import path from 'path';
import * as XLSX from 'xlsx';
import { createRequire } from 'module';
import { toIsoDate } from '../../shared/associate-store.js';
import { validateUploadedEmployee } from '../../shared/employee-store.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

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

function parseCsvBuffer(buffer) {
  const text = buffer.toString('utf-8').replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
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

function parseSpreadsheetBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  if (!workbook.SheetNames.length) return [];

  const rows = [];
  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    XLSX.utils
      .sheet_to_json(sheet, { defval: '', raw: false })
      .forEach((record, index) => {
        rows.push({ ...record, __rowNumber: index + 2, __sheetName: sheetName });
      });
  });

  return rows;
}

async function parsePdfEmployees(buffer) {
  const pdfData = await pdfParse(buffer);
  const lines = pdfData.text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const records = [];
  const headerIndex = lines.findIndex((line) =>
    /employee\s*number|employee\s*name|employeenumber/i.test(line),
  );

  if (headerIndex >= 0) {
    const headerParts = lines[headerIndex].split(/\s{2,}|\t|,/).map((part) => part.trim());
    for (let i = headerIndex + 1; i < lines.length; i += 1) {
      const parts = lines[i].split(/\s{2,}|\t|,/).map((part) => part.trim());
      if (parts.length < 2) continue;

      const record = {};
      headerParts.forEach((header, idx) => {
        record[header] = parts[idx] ?? '';
      });
      records.push({ ...record, __rowNumber: i + 1 });
    }
  }

  if (records.length === 0) {
    const rowPattern =
      /^(EMP\d+|HR-\d+-\d+|\w{2,}-\d+)\s+(.+?)\s+(\d{4}-\d{2}-\d{2}|\w+\s+\d{1,2},?\s+\d{4})\s+(\d+)\s+(\w+)\s+(.+)$/i;

    lines.forEach((line, index) => {
      const match = line.match(rowPattern);
      if (!match) return;
      records.push({
        'Employee Number': match[1],
        'Employee Name': match[2],
        DOJ: match[3],
        'Total Hours Worked': match[4],
        Department: match[5],
        'Project Name': match[6],
        __rowNumber: index + 1,
      });
    });
  }

  return records;
}

export async function parseEmployeeUploadFile(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.csv') return parseCsvBuffer(file.buffer);
  if (ext === '.xlsx' || ext === '.xls') return parseSpreadsheetBuffer(file.buffer);
  if (ext === '.pdf') return parsePdfEmployees(file.buffer);
  throw new Error('Unsupported file format. Use CSV, XLSX, or PDF.');
}

export function validateEmployeeRow(record, rowNumber) {
  return validateUploadedEmployee(record, rowNumber, toIsoDate);
}

export function processEmployeeRows(rows) {
  const successfulRecords = [];
  const failedRecords = [];

  rows.forEach((row, index) => {
    const result = validateEmployeeRow(row, row.__rowNumber || index + 2);
    if (result.ok) successfulRecords.push(result.value);
    else failedRecords.push(result.error);
  });

  return { successfulRecords, failedRecords };
}
