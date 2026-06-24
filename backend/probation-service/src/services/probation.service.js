import * as XLSX from 'xlsx';
import { upsertEmployee } from '../repositories/employee.repository.js';

const KEY_ALIASES = {
  employeeNumber: [
    'employeeNumber',
    'Employee Number',
    'EmployeeNumber',
    'Employee ID',
    'EmployeeId',
    'Employee No',
    'Emp No',
    'ID',
    'id',
    'Emp ID',
  ],
  employeeName: ['employeeName', 'Employee Name', 'EmployeeName', 'Name', 'Full Name'],
  dateOfJoining: ['dateOfJoining', 'Date Of Joining', 'DateOfJoining', 'DOJ', 'Date Joined', 'Joining Date', 'JoiningDate', 'Date'],
  totalHoursWorked: [
    'totalHoursWorked',
    'TotalHoursWorked',
    'Total Hours Worked',
    'Total Hours',
    'Hours Worked',
    'Hours',
    'Total',
  ],
  department: ['department', 'Department', 'Dept', 'Team'],
  projectName: ['projectName', 'Project Name', 'ProjectName', 'Project', 'Project Title'],
};

function lookupRowValue(row, aliases) {
  for (const key of aliases) {
    if (Object.prototype.hasOwnProperty.call(row, key) && row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return row[key];
    }
  }
  return undefined;
}

function normalizeEmployeeRow(rowRecord, index, managerId) {
  const row = rowRecord.row;
  const employeeNumberRaw = lookupRowValue(row, KEY_ALIASES.employeeNumber);
  const employeeNameRaw = lookupRowValue(row, KEY_ALIASES.employeeName);
  const dateOfJoiningRaw = lookupRowValue(row, KEY_ALIASES.dateOfJoining);
  const totalHoursWorkedRaw = lookupRowValue(row, KEY_ALIASES.totalHoursWorked);
  const departmentRaw = lookupRowValue(row, KEY_ALIASES.department);
  const projectNameRaw = lookupRowValue(row, KEY_ALIASES.projectName);

  const employeeNumber = String(employeeNumberRaw || '').trim();
  const employeeName = String(employeeNameRaw || '').trim();
  const dateOfJoining = dateOfJoiningRaw;
  const totalHoursWorked = Number(totalHoursWorkedRaw ?? 0);
  const department = String(departmentRaw || '').trim();
  const projectName = String(projectNameRaw || '').trim();

  return {
    employeeNumber,
    employeeName,
    dateOfJoining: new Date(dateOfJoining),
    totalHoursWorked,
    department,
    projectName,
    managerId,
    __sheetName: rowRecord.sheetName,
    __sheetRow: rowRecord.sheetRow,
    __flatIndex: index,
  };
}

function parseWorkbook(fileBuffer) {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
  if (!workbook.SheetNames.length) throw new Error('Excel file must contain at least one worksheet');

  const rows = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const sheetRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    sheetRows.forEach((row, index) => {
      rows.push({ row, sheetName, sheetRow: index + 2 });
    });
  }

  return rows;
}

export async function parseExcelAndUpsertEmployees(fileBuffer, managerId) {
  const rows = parseWorkbook(fileBuffer);
  const normalizedRows = rows.map((row, index) => normalizeEmployeeRow(row, index, managerId));

  const results = [];
  for (const record of normalizedRows) {
    if (!record.employeeNumber || !record.employeeName || !record.department || !record.projectName || Number.isNaN(record.totalHoursWorked) || !record.dateOfJoining || isNaN(record.dateOfJoining.getTime())) {
      results.push({
        sheetName: record.__sheetName,
        row: record.__sheetRow,
        status: 'failed',
        reason: 'Missing required fields or invalid dates',
      });
      continue;
    }

    try {
      await upsertEmployee(record);
      results.push({
        sheetName: record.__sheetName,
        row: record.__sheetRow,
        status: 'success',
      });
    } catch (error) {
      results.push({
        sheetName: record.__sheetName,
        row: record.__sheetRow,
        status: 'failed',
        reason: error.message,
      });
    }
  }

  return results;
}

export async function previewExcelEmployees(fileBuffer, managerId) {
  const rows = parseWorkbook(fileBuffer);
  const normalizedRows = rows.map((row, index) => normalizeEmployeeRow(row, index, managerId));

  const preview = [];
  const failedRecords = [];

  for (const record of normalizedRows) {
    if (!record.employeeNumber || !record.employeeName || !record.department || !record.projectName || Number.isNaN(record.totalHoursWorked) || !record.dateOfJoining || isNaN(record.dateOfJoining.getTime())) {
      failedRecords.push({
        sheetName: record.__sheetName,
        row: record.__sheetRow,
        reason: 'Missing required fields or invalid dates',
      });
      continue;
    }

    preview.push({
      sheetName: record.__sheetName,
      row: record.__sheetRow,
      employeeNumber: record.employeeNumber,
      employeeName: record.employeeName,
      dateOfJoining: record.dateOfJoining.toISOString().split('T')[0],
      totalHoursWorked: record.totalHoursWorked,
      department: record.department,
      projectName: record.projectName,
    });
  }

  return {
    preview,
    failedRecords,
    summary: {
      total: normalizedRows.length,
      valid: preview.length,
      failed: failedRecords.length,
    },
  };
}
