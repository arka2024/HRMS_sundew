// ============================================================
// run.ts — Bootstrap DB and print a quick smoke-test
// Usage:   npx tsx Run.ts
// ============================================================

import {
  bootstrap,
  getAllEmployees,
  addEmployee,
  getStats,
  searchEmployees,
} from "./employeedb.js";

bootstrap();

console.log("\n── All active employees ──────────────────────────────");
getAllEmployees().forEach(({ emp_number, full_name, date_joined }) =>
  console.log(`  ${emp_number}  ${full_name.padEnd(28)}  ${date_joined}`)
);

console.log("\n── Search: 'ghosh' ───────────────────────────────────");
searchEmployees("ghosh").forEach(({ emp_number, full_name }) =>
  console.log(`  ${emp_number}  ${full_name}`)
);

console.log("\n── Add a new employee ────────────────────────────────");
const demoNumber = `SDS${Date.now()}`;
const newEmp = addEmployee({
  emp_number: demoNumber,
  full_name:  "Demo Employee",
  email:      `demo.employee.${demoNumber}@sundewsolutions.com`,
  date_joined: "2026-06-12",
});
console.log("  Created:", newEmp);

console.log("\n── Stats ─────────────────────────────────────────────");
console.log(" ", getStats());