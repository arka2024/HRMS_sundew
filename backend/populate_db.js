import fs from 'fs';
import path from 'path';

const employees = [
  { no: 'SDS250', name: 'Aishik Maitra', doj: '2026-05-27T18:29:50.000Z', hrs: 6, dept: 'Analytics & Automation', proj: 'ASMBEL 2.0' },
  { no: 'SDS254', name: 'Arunabha Talukdar', doj: '2026-05-26T18:29:50.000Z', hrs: 8.25, dept: 'Digital Experience', proj: 'Empowerreg' },
  { no: 'SDS258', name: 'Kazi Ashique Ur Rahaman', doj: '2026-05-14T18:29:50.000Z', hrs: 4, dept: 'Engineering & Products', proj: 'SUNDEW ECOMMERCE' },
  { no: 'SDS260', name: 'Anisha Mahanty', doj: '2026-05-28T18:29:50.000Z', hrs: 3, dept: 'Engineering & Products', proj: 'Sundew Connect Mobile App' },
  { no: 'SDS261', name: 'Kaustabh Dutta', doj: '2026-05-28T18:29:50.000Z', hrs: 1, dept: 'Engineering & Products', proj: 'ASMBEL 2.0' },
  { no: 'SDS263', name: 'Aparna Mitra', doj: '2026-05-28T18:29:50.000Z', hrs: 7.5, dept: 'Marketing & Sales', proj: 'SUNDEW-WEBSITE-AND-DM' },
  { no: 'SDS265', name: 'Tonmoy Chandra', doj: '2026-05-28T18:29:50.000Z', hrs: 1, dept: 'Finance', proj: 'INTERNAL FINANCE' },
  { no: 'SDS266', name: 'Riya Ghosh', doj: '2026-05-19T18:29:50.000Z', hrs: 5, dept: 'Digital Experience', proj: 'Empowerreg' },
  { no: 'SDS267', name: 'Sarbojit Ghosh', doj: '2026-05-28T18:29:50.000Z', hrs: 2, dept: 'Engineering & Products', proj: 'ASMBEL 2.0' },
  { no: 'SDS268', name: 'Vaibhav Ankush Mohite', doj: '2026-05-14T18:29:50.000Z', hrs: 4, dept: 'Engineering & Products', proj: 'ORG LEVEL ACTIVITIES - 2025-2026, 2026-2027' }
];

function slugifyName(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function formatJoinDate(isoDate) {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// 1. Write employee-store/db.json
const empDbPath = path.join('c:/HRMS-Sundew ( Probation )/backend/employee-store', 'db.json');
const empStore = {
  managers: [{
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    employee_id: "MGR001",
    name: "Demo Manager",
    email: "demo.manager@sundew.com"
  }],
  employees: employees.map((e, i) => ({
    id: `uuid-${i}`,
    employee_number: e.no,
    employee_name: e.name,
    date_of_joining: e.doj,
    total_hours_worked: e.hrs,
    department: e.dept,
    project_name: e.proj,
    manager_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })),
  uploadHistory: []
};
fs.writeFileSync(empDbPath, JSON.stringify(empStore, null, 2));

// 2. Write manager-service/db.json
const mgrDbPath = path.join('c:/HRMS-Sundew ( Probation )/backend/manager-service', 'db.json');
const mgrStore = employees.map(e => ({
  id: slugifyName(e.name) || slugifyName(e.no),
  name: e.name,
  employeeId: e.no,
  joinDate: formatJoinDate(e.doj),
  manager: "Demo Manager",
  probation: "Month 1/4",
  status: "On Track",
  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(e.name)}&background=0044ff&color=fff`,
  project: {
    name: e.proj,
    phase: e.dept,
    progress: Math.min(100, Math.round((e.hrs / 8) * 100)),
    status: "Healthy"
  },
  department: e.dept,
  totalHoursWorked: e.hrs,
  history: [],
  currentEvaluation: {
    tech: 3,
    learn: 3,
    adapt: 3,
    attitude: 3,
    comments: ""
  },
  syncedFromHr: true
}));
fs.writeFileSync(mgrDbPath, JSON.stringify(mgrStore, null, 2));

console.log("Databases updated successfully!");
