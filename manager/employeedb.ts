// ============================================================
// employeeDb.ts — Thin CRUD wrapper around the local SQLite DB
// ============================================================

import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Employee, NewEmployee, UpdateEmployee } from "./Employee.types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = resolve(__dirname, "employees.db");
const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");

export function bootstrap(): void {
  const schema = readFileSync(resolve(__dirname, "Schema.sql"), "utf8");
  const seed = readFileSync(resolve(__dirname, "seed.sql"), "utf8");

  db.exec(schema);
  db.exec(seed);

  console.log("employees.db bootstrapped");
}

function toEmployee(row: Record<string, unknown>): Employee {
  return {
    id: Number(row.id),
    emp_number: String(row.emp_number),
    full_name: String(row.full_name),
    email: String(row.email),
    date_joined: String(row.date_joined),
    is_active: Number(row.is_active) === 1,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function getAllEmployees(activeOnly = true): Employee[] {
  const rows = activeOnly
    ? db.prepare("SELECT * FROM employees WHERE is_active = 1 ORDER BY emp_number").all()
    : db.prepare("SELECT * FROM employees ORDER BY emp_number").all();

  return (rows as Record<string, unknown>[]).map(toEmployee);
}

export function getEmployeeByNumber(empNumber: string): Employee | undefined {
  const row = db
    .prepare("SELECT * FROM employees WHERE emp_number = ?")
    .get(empNumber) as Record<string, unknown> | undefined;

  return row ? toEmployee(row) : undefined;
}

export function searchEmployees(query: string): Employee[] {
  const like = `%${query}%`;
  const rows = db
    .prepare(
      `SELECT * FROM employees
       WHERE (full_name LIKE ? OR email LIKE ?)
         AND is_active = 1
       ORDER BY emp_number`
    )
    .all(like, like) as Record<string, unknown>[];

  return rows.map(toEmployee);
}

export function addEmployee(payload: NewEmployee): Employee {
  const stmt = db.prepare(`
    INSERT INTO employees (emp_number, full_name, email, date_joined)
    VALUES (@emp_number, @full_name, @email, @date_joined)
  `);
  const info = stmt.run(payload);
  const row = db
    .prepare("SELECT * FROM employees WHERE id = ?")
    .get(info.lastInsertRowid) as Record<string, unknown> | undefined;

  if (!row) {
    throw new Error(`Employee was not created for emp_number ${payload.emp_number}`);
  }

  return toEmployee(row);
}

export function updateEmployee(
  empNumber: string,
  changes: UpdateEmployee
): Employee | undefined {
  const allowed = ["full_name", "email", "date_joined", "is_active"] as const;
  const fields = (Object.keys(changes) as string[]).filter((field) =>
    (allowed as readonly string[]).includes(field)
  );

  if (fields.length === 0) {
    return getEmployeeByNumber(empNumber);
  }

  const setClause = fields.map((field) => `${field} = @${field}`).join(", ");
  db.prepare(
    `UPDATE employees SET ${setClause} WHERE emp_number = @emp_number`
  ).run({ ...changes, emp_number: empNumber });

  return getEmployeeByNumber(empNumber);
}

export function deactivateEmployee(empNumber: string): boolean {
  const info = db
    .prepare("UPDATE employees SET is_active = 0 WHERE emp_number = ?")
    .run(empNumber);

  return info.changes > 0;
}

export function getStats(): { total: number; active: number; inactive: number } {
  const row = db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active,
         SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS inactive
       FROM employees`
    )
    .get() as { total: number; active: number | null; inactive: number | null };

  return {
    total: row.total,
    active: row.active ?? 0,
    inactive: row.inactive ?? 0,
  };
}
