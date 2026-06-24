import { Evaluation } from '../models/Evaluation.js';
import { Manager } from '../models/Manager.js';
import { Employee } from '../models/Employee.js';
import { findAllEmployees } from './employee.repository.js';

export async function createEvaluation(evaluationData) {
  return Evaluation.create(evaluationData);
}

export async function findAllEvaluations(filters = {}) {
  let queryObj = {};

  // 1. Employee-specific filters
  if (filters.employeeId) {
    queryObj.employeeId = filters.employeeId;
  }
  if (filters.employeeName) {
    queryObj.employeeName = { $regex: filters.employeeName, $options: 'i' };
  }
  if (filters.employeeNumber) {
    queryObj.employeeNumber = filters.employeeNumber;
  }
  if (filters.department) {
    queryObj.department = filters.department;
  }
  if (filters.project) {
    queryObj.project = filters.project;
  }
  if (filters.managerId) {
    queryObj.managerId = filters.managerId;
  }

  // 2. Status filters
  if (filters.status && filters.status !== 'all') {
    if (filters.status === 'Draft') {
      queryObj.evaluationStatus = { $in: ['Pending', 'In Review'] };
    } else {
      queryObj.evaluationStatus = filters.status;
    }
  }

  // 3. Time period filtering
  if (filters.period && filters.period !== 'all' && filters.period !== 'probation') {
    const year = filters.year || new Date().getFullYear().toString();
    
    if (filters.period === 'monthly') {
      if (filters.month) {
        const monthOptions = getMonthOptions(filters.month);
        queryObj.evaluationMonth = { $in: monthOptions };
      }
      queryObj.evaluationYear = year;
    } else if (filters.period === 'quarterly') {
      if (filters.quarter) {
        const quarterMonths = getQuarterMonths(filters.quarter);
        queryObj.evaluationMonth = { $in: quarterMonths };
      }
      queryObj.evaluationYear = year;
    } else if (filters.period === 'half-yearly') {
      if (filters.halfYear) {
        const halfMonths = getHalfYearMonths(filters.halfYear);
        queryObj.evaluationMonth = { $in: halfMonths };
      }
      queryObj.evaluationYear = year;
    } else if (filters.period === 'yearly') {
      queryObj.evaluationYear = year;
    }
  }

  let evaluations = await Evaluation.find(queryObj).sort({ createdAt: -1 }).exec();

  // Custom date range in-memory filter
  if (filters.period === 'custom' && filters.startDate && filters.endDate) {
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    evaluations = evaluations.filter(e => {
      const evalDate = parseEvaluationToDate(e.evaluationYear, e.evaluationMonth);
      return evalDate >= start && evalDate <= end;
    });
  }

  // Full probation period filter
  if (filters.period === 'probation') {
    const employees = await findAllEmployees();
    const employeeMap = new Map(employees.map(emp => [emp.employeeNumber, emp]));
    evaluations = evaluations.filter(e => {
      const emp = employeeMap.get(e.employeeNumber) || employeeMap.get(e.employeeId);
      if (!emp) return true;
      const joinDate = new Date(emp.dateOfJoining);
      const duration = emp.probationDurationMonths || 4;
      const evalDate = parseEvaluationToDate(e.evaluationYear, e.evaluationMonth);
      const endDate = new Date(joinDate);
      endDate.setMonth(joinDate.getMonth() + duration);
      return evalDate >= joinDate && evalDate <= endDate;
    });
  }

  return evaluations;
}

export async function findEvaluationByEmployeeAndPeriod(employeeId, evaluationYear, evaluationMonth) {
  // Try exact match or month options
  const monthOptions = getMonthOptions(evaluationMonth);
  return Evaluation.findOne({
    $or: [
      { employeeId, evaluationYear, evaluationMonth },
      { employeeId, evaluationYear, evaluationMonth: { $in: monthOptions } }
    ]
  }).exec();
}

export async function updateEvaluation(employeeId, evaluationYear, evaluationMonth, updateData) {
  const monthOptions = getMonthOptions(evaluationMonth);
  return Evaluation.findOneAndUpdate(
    { 
      $or: [
        { employeeId, evaluationYear, evaluationMonth },
        { employeeId, evaluationYear, evaluationMonth: { $in: monthOptions } }
      ]
    },
    { $set: updateData },
    { new: true, runValidators: true }
  ).exec();
}

export async function saveOrUpdateEvaluation(data) {
  const { employeeId, evaluationYear, evaluationMonth } = data;
  
  // Check if locked
  const existing = await findEvaluationByEmployeeAndPeriod(employeeId, evaluationYear, evaluationMonth);
  if (existing && existing.evaluationStatus === 'Locked') {
    throw new Error('Evaluation is locked and cannot be updated');
  }
  
  // Find employee to populate details if not provided
  if (!data.employeeName || !data.employeeNumber) {
    const employees = await findAllEmployees();
    const emp = employees.find(e => e._id.toString() === employeeId || e.employeeNumber === employeeId);
    if (emp) {
      data.employeeName = emp.employeeName;
      data.employeeNumber = emp.employeeNumber;
      data.department = emp.department;
      data.project = emp.projectName;
      data.managerId = emp.managerId;
    }
  }
  
  if (existing) {
    return Evaluation.findOneAndUpdate(
      { _id: existing._id },
      { $set: data },
      { new: true, runValidators: true }
    ).exec();
  } else {
    return Evaluation.create(data);
  }
}

export async function lockEvaluation(employeeId, evaluationYear, evaluationMonth, lockedBy) {
  const monthOptions = getMonthOptions(evaluationMonth);
  return Evaluation.findOneAndUpdate(
    { 
      $or: [
        { employeeId, evaluationYear, evaluationMonth },
        { employeeId, evaluationYear, evaluationMonth: { $in: monthOptions } }
      ]
    },
    {
      $set: {
        evaluationStatus: 'Locked',
        lockedBy,
        lockedDate: new Date()
      }
    },
    { new: true, runValidators: true }
  ).exec();
}

export async function unlockEvaluation(employeeId, evaluationYear, evaluationMonth) {
  const monthOptions = getMonthOptions(evaluationMonth);
  return Evaluation.findOneAndUpdate(
    { 
      $or: [
        { employeeId, evaluationYear, evaluationMonth },
        { employeeId, evaluationYear, evaluationMonth: { $in: monthOptions } }
      ]
    },
    {
      $set: {
        evaluationStatus: 'Completed',
        lockedBy: null,
        lockedDate: null
      }
    },
    { new: true, runValidators: true }
  ).exec();
}

export async function getDashboardStats(filters = {}) {
  const evaluations = await findAllEvaluations(filters);
  
  const activeEvals = evaluations.filter(e => e.evaluationStatus === 'Completed' || e.evaluationStatus === 'Locked');
  const uniqueEmployees = new Set(activeEvals.map(e => e.employeeNumber));
  const totalEvaluated = uniqueEmployees.size;

  const lockedEvaluations = evaluations.filter(e => e.evaluationStatus === 'Locked').length;
  
  const distinctLockedCycles = new Set();
  for (const e of evaluations) {
    if (e.evaluationStatus === 'Locked') {
      distinctLockedCycles.add(`${e.evaluationYear}-${e.evaluationMonth}`);
    }
  }

  // Calculate pending evaluations count dynamically
  let employees = [];
  try {
    employees = await findAllEmployees();
  } catch (err) {
    console.error('Error loading employees for dashboard stats:', err);
    employees = [];
  }
  
  if (filters.employeeId) employees = employees.filter(e => e.employeeNumber === filters.employeeId);
  if (filters.employeeName) employees = employees.filter(e => e.employeeName.toLowerCase().includes((filters.employeeName || '').toLowerCase()));
  if (filters.department) employees = employees.filter(e => e.department === filters.department);
  if (filters.project) employees = employees.filter(e => e.projectName === filters.project);
  if (filters.managerId) employees = employees.filter(e => e.managerId === filters.managerId);

  let pendingEvaluations = 0;
  const currentDate = new Date();

  for (const emp of employees) {
    try {
      const joinDate = new Date(emp.dateOfJoining);
      const probationMonthsCount = emp.probationDurationMonths || 4;
      
      for (let m = 0; m < probationMonthsCount; m++) {
        const probationMonthDate = new Date(joinDate.getFullYear(), joinDate.getMonth() + m, 1);
        if (probationMonthDate > currentDate) {
          break;
        }
        
        const monthName = probationMonthDate.toLocaleString('default', { month: 'long' });
        const shortMonthName = probationMonthDate.toLocaleString('default', { month: 'short' });
        const yearStr = probationMonthDate.getFullYear().toString();
        
        if (filters.period && filters.period !== 'all') {
          const matchesTime = checkProbationMonthMatchesTimeFilter(probationMonthDate, monthName, yearStr, filters);
          if (!matchesTime) continue;
        }
        
        const hasFinishedEval = evaluations.some(e => 
          (e.employeeNumber === emp.employeeNumber) && 
          (getMonthOptions(e.evaluationMonth).includes(monthName) || getMonthOptions(e.evaluationMonth).includes(shortMonthName)) &&
          (e.evaluationYear === yearStr) &&
          (e.evaluationStatus === 'Completed' || e.evaluationStatus === 'Locked')
        );
        
        if (!hasFinishedEval) {
          pendingEvaluations++;
        }
      }
    } catch (err) {
      console.error('Error processing employee for pending evaluation count:', err);
    }
  }
  
  let avgRating = 0;
  if (activeEvals.length > 0) {
    const total = activeEvals.reduce((sum, e) => sum + e.overallScore, 0);
    avgRating = total / activeEvals.length;
  }

  return {
    totalEvaluatedEmployees: totalEvaluated,
    pendingEvaluations,
    lockedEvaluationCycles: distinctLockedCycles.size,
    lockedEvaluations,
    averageRating: avgRating
  };
}

export async function getEvaluationReportSummary(employeeIds = null) {
  let evaluations = await Evaluation.find({ evaluationStatus: 'Locked' });
  if (employeeIds && employeeIds.length > 0) {
    evaluations = evaluations.filter(e => employeeIds.includes(e.employeeId));
  }

  const totalEvaluations = evaluations.length;
  let averageRatings = null;

  if (totalEvaluations > 0) {
    const scores = evaluations.reduce(
      (acc, e) => ({
        performance: acc.performance + e.performanceScore,
        attendance: acc.attendance + e.attendanceScore,
        productivity: acc.productivity + e.productivityScore,
        communication: acc.communication + e.communicationScore,
        learning: acc.learning + e.learningScore,
        collaboration: acc.collaboration + e.collaborationScore,
        overall: acc.overall + e.overallScore,
      }),
      { performance: 0, attendance: 0, productivity: 0, communication: 0, learning: 0, collaboration: 0, overall: 0 }
    );
    averageRatings = {
      performance: (scores.performance / totalEvaluations).toFixed(2),
      attendance: (scores.attendance / totalEvaluations).toFixed(2),
      productivity: (scores.productivity / totalEvaluations).toFixed(2),
      communication: (scores.communication / totalEvaluations).toFixed(2),
      learning: (scores.learning / totalEvaluations).toFixed(2),
      collaboration: (scores.collaboration / totalEvaluations).toFixed(2),
      overall: (scores.overall / totalEvaluations).toFixed(2),
    };
  }

  const departmentAveragesMap = new Map();
  for (const evaluation of evaluations) {
    if (!departmentAveragesMap.has(evaluation.department)) {
      departmentAveragesMap.set(evaluation.department, { totalScore: 0, count: 0 });
    }
    const dept = departmentAveragesMap.get(evaluation.department);
    dept.totalScore += evaluation.overallScore;
    dept.count += 1;
  }
  const departmentAverages = Array.from(departmentAveragesMap.entries()).map(([department, data]) => ({
    department,
    employeeCount: data.count,
    averageScore: (data.totalScore / data.count).toFixed(2),
  }));

  const sortedByScore = [...evaluations].sort((a, b) => b.overallScore - a.overallScore);
  const topPerformers = sortedByScore.slice(0, 5);
  const improvementRequired = sortedByScore.slice(-5).reverse();

  return {
    totalEvaluations,
    averageRatings,
    departmentAverages,
    topPerformers,
    improvementRequired,
  };
}

export async function seedEvaluations(employees) {
  // First, seed a manager if none exists
  let manager = await Manager.findOne({ managerId: 'manager-001' });
  if (!manager) {
    manager = await Manager.create({
      managerId: 'manager-001',
      managerName: 'Sarah Thompson',
      email: 'manager@sundew.com',
      passwordHash: 'hashed-password-123' // just a placeholder for seed
    });
    console.log('Sample manager seeded');
  }

  // If no employees provided, seed sample employees
  let seedEmployees = employees;
  if (!seedEmployees || seedEmployees.length === 0) {
    const sampleEmployees = [
      {
        employeeNumber: 'EMP001',
        employeeName: 'John Doe',
        dateOfJoining: new Date('2026-01-01'),
        totalHoursWorked: 160,
        department: 'Engineering',
        projectName: 'Project Alpha',
        managerId: 'manager-001'
      },
      {
        employeeNumber: 'EMP002',
        employeeName: 'Jane Smith',
        dateOfJoining: new Date('2026-02-01'),
        totalHoursWorked: 150,
        department: 'Design',
        projectName: 'Project Beta',
        managerId: 'manager-001'
      },
      {
        employeeNumber: 'EMP003',
        employeeName: 'Bob Johnson',
        dateOfJoining: new Date('2026-01-15'),
        totalHoursWorked: 170,
        department: 'Engineering',
        projectName: 'Project Alpha',
        managerId: 'manager-001'
      }
    ];
    
    for (const emp of sampleEmployees) {
      const existing = await Employee.findOne({ employeeNumber: emp.employeeNumber });
      if (!existing) {
        await Employee.create(emp);
      }
    }
    seedEmployees = await findAllEmployees();
    console.log('Sample employees seeded');
  }

  const months = ['January', 'February', 'March', 'April', 'May', 'June'];
  const year = '2026';
  const statuses = ['Pending', 'In Review', 'Completed', 'Locked'];

  // Clear existing evaluations
  await Evaluation.deleteMany({});

  for (const employee of seedEmployees) {
    for (const month of months) {
      const performanceScore = Math.floor(Math.random() * 3) + 2.5;
      const attendanceScore = Math.floor(Math.random() * 3) + 2.5;
      const productivityScore = Math.floor(Math.random() * 3) + 2.5;
      const communicationScore = Math.floor(Math.random() * 3) + 2.5;
      const learningScore = Math.floor(Math.random() * 3) + 2.5;
      const collaborationScore = Math.floor(Math.random() * 3) + 2.5;
      const overallScore = (performanceScore + attendanceScore + productivityScore + communicationScore + learningScore + collaborationScore) / 6;
      
      // Compute rating based on overall score
      let rating = 'Meets Expectations';
      if (overallScore >= 4.5) rating = 'Outstanding';
      else if (overallScore >= 4.0) rating = 'Exceeds Expectations';
      else if (overallScore < 3.0) rating = 'Needs Improvement';

      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const lockedBy = status === 'Locked' ? 'HR Admin' : null;
      const lockedDate = status === 'Locked' ? new Date() : null;
      const hrRemarks = status === 'Pending' ? '' : 'Consistent worker. Met standard milestones for this month.';

      await Evaluation.create({
        employeeId: employee._id.toString(),
        employeeNumber: employee.employeeNumber,
        employeeName: employee.employeeName,
        department: employee.department,
        project: employee.projectName,
        managerId: employee.managerId,
        evaluationMonth: month,
        evaluationYear: year,
        performanceScore,
        attendanceScore,
        productivityScore,
        communicationScore,
        learningScore,
        collaborationScore,
        overallScore,
        rating,
        hrRemarks,
        evaluationStatus: status,
        lockedBy,
        lockedDate,
      });
    }
  }
  console.log('Sample evaluations seeded successfully');
}

// Helpers
function getMonthOptions(monthInput) {
  if (!monthInput) return [];
  const input = String(monthInput).trim().toLowerCase();
  const shortNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const fullNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  let idx = shortNames.indexOf(input);
  if (idx === -1) idx = fullNames.map(f => f.toLowerCase()).indexOf(input);
  if (idx === -1) {
    const num = parseInt(input, 10);
    if (num >= 1 && num <= 12) idx = num - 1;
  }
  
  if (idx !== -1) {
    return [fullNames[idx], shortNames[idx]];
  }
  return [monthInput];
}

function getQuarterMonths(quarter) {
  const q = String(quarter).trim().toUpperCase();
  if (q === 'Q1') return ['January', 'Jan', 'February', 'Feb', 'March', 'Mar'];
  if (q === 'Q2') return ['April', 'Apr', 'May', 'May', 'June', 'Jun'];
  if (q === 'Q3') return ['July', 'Jul', 'August', 'Aug', 'September', 'Sep'];
  if (q === 'Q4') return ['October', 'Oct', 'November', 'Nov', 'December', 'Dec'];
  return [];
}

function getHalfYearMonths(half) {
  const h = String(half).trim().toUpperCase();
  if (h === 'H1' || h === '1' || h === 'FIRST') {
    return ['January', 'Jan', 'February', 'Feb', 'March', 'Mar', 'April', 'Apr', 'May', 'May', 'June', 'Jun'];
  }
  if (h === 'H2' || h === '2' || h === 'SECOND') {
    return ['July', 'Jul', 'August', 'Aug', 'September', 'Sep', 'October', 'Oct', 'November', 'Nov', 'December', 'Dec'];
  }
  return [];
}

function parseEvaluationToDate(yearStr, monthStr) {
  const year = parseInt(yearStr, 10) || 2026;
  const monthOptions = getMonthOptions(monthStr);
  const shortNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const fullNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  let monthIdx = 0;
  for (const opt of monthOptions) {
    const idx = shortNames.indexOf(opt.toLowerCase());
    if (idx !== -1) { monthIdx = idx; break; }
    const fidx = fullNames.map(f => f.toLowerCase()).indexOf(opt.toLowerCase());
    if (fidx !== -1) { monthIdx = fidx; break; }
  }
  return new Date(year, monthIdx, 1);
}

function checkProbationMonthMatchesTimeFilter(date, monthName, yearStr, filters) {
  const year = filters.year || new Date().getFullYear().toString();
  if (filters.period === 'monthly') {
    return yearStr === year && getMonthOptions(filters.month).includes(monthName);
  }
  if (filters.period === 'quarterly') {
    return yearStr === year && getQuarterMonths(filters.quarter).includes(monthName);
  }
  if (filters.period === 'half-yearly') {
    return yearStr === year && getHalfYearMonths(filters.halfYear).includes(monthName);
  }
  if (filters.period === 'yearly') {
    return yearStr === year;
  }
  if (filters.period === 'custom' && filters.startDate && filters.endDate) {
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    return date >= start && date <= end;
  }
  return true;
}
