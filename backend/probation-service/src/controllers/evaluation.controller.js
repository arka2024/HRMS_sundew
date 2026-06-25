import {
  createEvaluation,
  findAllEvaluations,
  findEvaluationByEmployeeAndPeriod,
  updateEvaluation,
  saveOrUpdateEvaluation,
  lockEvaluation,
  unlockEvaluation,
  getDashboardStats,
  getEvaluationReportSummary,
  seedEvaluations
} from '../repositories/evaluation.repository.js';
import { findAllEmployees, findDistinctDepartments } from '../repositories/employee.repository.js';
import xlsx from 'xlsx';
import PDFDocument from 'pdfkit';

export async function getEvaluationsController(req, res) {
  try {
    const { period, startDate, endDate, employeeId, employeeName, department, project, managerId, status, year, month, quarter, halfYear } = req.query;
    const filters = { period, startDate, endDate, employeeId, employeeName, department, project, status, year, month, quarter, halfYear };
    
    // If user is a manager, filter by their managerId
    if (req.user?.role === 'manager') {
      filters.managerId = req.user.managerId || req.user.id || req.user.name;
    } else if (managerId) {
      filters.managerId = managerId;
    }

    const evaluations = await findAllEvaluations(filters);
    const formattedEvaluations = evaluations.map(e => ({
      employeeId: e.employeeId,
      employeeNumber: e.employeeNumber,
      employeeName: e.employeeName,
      department: e.department,
      project: e.project,
      managerId: e.managerId,
      evaluationMonth: e.evaluationMonth,
      evaluationYear: e.evaluationYear,
      performanceScore: e.performanceScore,
      attendanceScore: e.attendanceScore,
      productivityScore: e.productivityScore,
      communicationScore: e.communicationScore,
      learningScore: e.learningScore,
      collaborationScore: e.collaborationScore,
      overallScore: e.overallScore,
      hrRemarks: e.hrRemarks,
      status: e.evaluationStatus,
      lockedBy: e.lockedBy,
      lockedDate: e.lockedDate,
      savedAt: e.updatedAt,
    }));
    res.json({ evaluations: formattedEvaluations });
  } catch (error) {
    console.error('Get evaluations error:', error);
    res.status(500).json({ error: 'Failed to load evaluations' });
  }
}

export async function getDashboardStatsController(req, res) {
  try {
    const { period, startDate, endDate, employeeId, employeeName, department, project, managerId, status, year, month, quarter, halfYear } = req.query;
    const filters = { period, startDate, endDate, employeeId, employeeName, department, project, status, year, month, quarter, halfYear };
    
    if (req.user?.role === 'manager') {
      filters.managerId = req.user.managerId || req.user.id || req.user.name;
    } else if (managerId) {
      filters.managerId = managerId;
    }

    const stats = await getDashboardStats(filters);
    res.json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to load dashboard stats' });
  }
}

export async function getEmployeeReportController(req, res) {
  try {
    const { employeeId } = req.params;
    const employees = await findAllEmployees();
    const employee = employees.find(e => e._id.toString() === employeeId || e.employeeNumber === employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    const evaluations = await findAllEvaluations({ employeeNumber: employee.employeeNumber });
    const formattedEvaluations = evaluations.map(e => ({
      employeeId: e.employeeId,
      employeeNumber: e.employeeNumber,
      employeeName: e.employeeName,
      department: e.department,
      project: e.project,
      managerId: e.managerId,
      evaluationMonth: e.evaluationMonth,
      evaluationYear: e.evaluationYear,
      performanceScore: e.performanceScore,
      attendanceScore: e.attendanceScore,
      productivityScore: e.productivityScore,
      communicationScore: e.communicationScore,
      learningScore: e.learningScore,
      collaborationScore: e.collaborationScore,
      overallScore: e.overallScore,
      hrRemarks: e.hrRemarks,
      status: e.evaluationStatus,
      lockedBy: e.lockedBy,
      lockedDate: e.lockedDate,
      savedAt: e.updatedAt,
    }));
    res.json({
      employee: {
        id: employee._id,
        employeeId: employee.employeeNumber,
        name: employee.employeeName,
        department: employee.department,
        project: {
          name: employee.projectName,
          phase: 'Active',
          progress: 75,
          status: 'Ongoing',
        },
        manager: employee.managerId,
        joinDate: employee.dateOfJoining.toISOString(),
        probationDurationMonths: employee.probationDurationMonths || 6,
        probationEndDate: new Date(employee.dateOfJoining.getTime() + (employee.probationDurationMonths || 6) * 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Active',
      },
      evaluations: formattedEvaluations,
    });
  } catch (error) {
    console.error('Get employee report error:', error);
    res.status(500).json({ error: 'Failed to load employee report' });
  }
}

export async function getBulkReportController(req, res) {
  try {
    const { employeeIds, filters } = req.body;
    const evaluations = await findAllEvaluations({ status: 'Locked', ...filters });
    let filteredEvaluations = evaluations;
    if (employeeIds && employeeIds.length > 0) {
      filteredEvaluations = evaluations.filter(e => employeeIds.includes(e.employeeId));
    }
    const formattedEvaluations = filteredEvaluations.map(e => ({
      employeeId: e.employeeId,
      employeeNumber: e.employeeNumber,
      employeeName: e.employeeName,
      department: e.department,
      project: e.project,
      managerId: e.managerId,
      evaluationMonth: e.evaluationMonth,
      evaluationYear: e.evaluationYear,
      performanceScore: e.performanceScore,
      attendanceScore: e.attendanceScore,
      productivityScore: e.productivityScore,
      communicationScore: e.communicationScore,
      learningScore: e.learningScore,
      collaborationScore: e.collaborationScore,
      overallScore: e.overallScore,
      hrRemarks: e.hrRemarks,
      status: e.evaluationStatus,
      lockedBy: e.lockedBy,
      lockedDate: e.lockedDate,
      savedAt: e.updatedAt,
    }));
    const summary = await getEvaluationReportSummary(employeeIds);
    res.json({ evaluations: formattedEvaluations, summary });
  } catch (error) {
    console.error('Get bulk report error:', error);
    res.status(500).json({ error: 'Failed to load bulk report' });
  }
}

export async function saveEvaluationController(req, res) {
  try {
    const evaluationData = req.body;
    
    // Validate manager permissions
    if (req.user?.role !== 'manager' && req.user?.role !== 'hr') {
      return res.status(403).json({ error: 'Access denied. Managers or HR only.' });
    }
    
    // If manager, enforce managerId
    if (req.user?.role === 'manager') {
      evaluationData.managerId = req.user.managerId || req.user.id || req.user.name;
    }
    
    const evaluation = await saveOrUpdateEvaluation(evaluationData);
    res.json({ message: 'Evaluation saved successfully', evaluation });
  } catch (error) {
    console.error('Save evaluation error:', error);
    res.status(500).json({ error: error.message || 'Failed to save evaluation' });
  }
}

export async function lockEvaluationController(req, res) {
  try {
    const { employeeId, monthKey } = req.params;
    const [year, month] = monthKey.split('-');
    const evaluation = await lockEvaluation(employeeId, year, month, req.user?.name || 'HR Admin');
    res.json({ message: 'Evaluation locked successfully', evaluation });
  } catch (error) {
    console.error('Lock evaluation error:', error);
    res.status(500).json({ error: 'Failed to lock evaluation' });
  }
}

export async function unlockEvaluationController(req, res) {
  try {
    const { employeeId, monthKey } = req.params;
    const [year, month] = monthKey.split('-');
    const evaluation = await unlockEvaluation(employeeId, year, month);
    res.json({ message: 'Evaluation unlocked successfully', evaluation });
  } catch (error) {
    console.error('Unlock evaluation error:', error);
    res.status(500).json({ error: 'Failed to unlock evaluation' });
  }
}

export async function exportExcelController(req, res) {
  try {
    const { period, startDate, endDate, employeeId, employeeName, department, project, managerId, status, year, month, quarter, halfYear } = req.query;
    const filters = { period, startDate, endDate, employeeId, employeeName, department, project, year, month, quarter, halfYear };
    
    if (req.user?.role === 'manager') {
      filters.managerId = req.user.managerId || req.user.id || req.user.name;
    } else if (managerId) {
      filters.managerId = managerId;
    }
    
    const allEvals = await findAllEvaluations(filters);
    
    // Only completed or locked evaluations can be generated in reports
    const evaluations = allEvals.filter(e => e.evaluationStatus === 'Completed' || e.evaluationStatus === 'Locked');
    
    const data = evaluations.map(e => {
      let rating = 'Meets Expectations';
      if (e.overallScore >= 4.5) rating = 'Outstanding';
      else if (e.overallScore >= 4.0) rating = 'Exceeds Expectations';
      else if (e.overallScore < 3.0) rating = 'Needs Improvement';

      return {
        'Employee ID': e.employeeNumber,
        'Employee Name': e.employeeName,
        'Department': e.department,
        'Project': e.project,
        'Manager': e.managerId,
        'Evaluation Period': `${e.evaluationMonth} ${e.evaluationYear}`,
        'Overall Score': e.overallScore.toFixed(2),
        'Rating': rating,
        'Remarks': e.hrRemarks,
        'Evaluation Status': e.evaluationStatus
      };
    });

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Evaluation Reports');
    
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=evaluation_reports.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({ error: 'Failed to export Excel' });
  }
}

export async function seedEvaluationsController(req, res) {
  try {
    const employees = await findAllEmployees();
    await seedEvaluations(employees);
    res.json({ message: 'Sample evaluations seeded successfully' });
  } catch (error) {
    console.error('Seed evaluations error:', error);
    res.status(500).json({ error: 'Failed to seed evaluations' });
  }
}

export async function getDistinctDepartmentsController(req, res) {
  try {
    const departments = await findDistinctDepartments();
    res.json({ departments });
  } catch (error) {
    console.error('Get distinct departments error:', error);
    res.status(500).json({ error: 'Failed to get departments' });
  }
}

export async function exportPDFController(req, res) {
  try {
    const { period, startDate, endDate, employeeId, employeeName, department, project, managerId, status, year, month, quarter, halfYear } = req.query;
    const filters = { period, startDate, endDate, employeeId, employeeName, department, project, year, month, quarter, halfYear };
    
    if (req.user?.role === 'manager') {
      filters.managerId = req.user.managerId || req.user.id || req.user.name;
    } else if (managerId) {
      filters.managerId = managerId;
    }
    
    const allEvals = await findAllEvaluations(filters);
    
    // Only completed or locked evaluations can be generated in reports
    const evaluations = allEvals.filter(e => e.evaluationStatus === 'Completed' || e.evaluationStatus === 'Locked');
    
    const doc = new PDFDocument({ margin: 50 });
    
    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=evaluation_reports.pdf');
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Header
    doc
      .fontSize(24)
      .text('Employee Evaluation Reports', { align: 'center' })
      .moveDown(0.5)
      .fontSize(12)
      .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' })
      .moveDown(2);
    
    // Table header
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 150;
    const col3 = 270;
    const col4 = 370;
    const col5 = 450;
    const col6 = 530;
    
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Employee', col1, tableTop)
      .text('Department', col2, tableTop)
      .text('Period', col3, tableTop)
      .text('Score', col4, tableTop)
      .text('Rating', col5, tableTop)
      .text('Status', col6, tableTop)
      .moveDown(0.5)
      .font('Helvetica');
    
    // Draw line under header
    doc
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke()
      .moveDown(0.5);
    
    // Add evaluations to PDF
    evaluations.forEach((e, index) => {
      let rating = 'Meets Expectations';
      if (e.overallScore >= 4.5) rating = 'Outstanding';
      else if (e.overallScore >= 4.0) rating = 'Exceeds Expectations';
      else if (e.overallScore < 3.0) rating = 'Needs Improvement';
      
      const yPos = doc.y;
      doc
        .fontSize(10)
        .text(e.employeeName, col1, yPos)
        .text(e.department, col2, yPos)
        .text(`${e.evaluationMonth} ${e.evaluationYear}`, col3, yPos)
        .text(e.overallScore.toFixed(2), col4, yPos)
        .text(rating, col5, yPos)
        .text(e.evaluationStatus, col6, yPos)
        .moveDown(0.5);
      
      // Check if we need a new page
      if (doc.y > 700 && index < evaluations.length - 1) {
        doc.addPage();
      }
    });
    
    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ error: 'Failed to export PDF' });
  }
}
