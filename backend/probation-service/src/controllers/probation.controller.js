import { parseExcelAndUpsertEmployees, previewExcelEmployees } from '../services/probation.service.js';
import { findManagerById, findAnyManager } from '../repositories/manager.repository.js';
import { addUploadHistory, getUploadHistoryByManager } from '../repositories/uploadHistory.repository.js';
import { findAllEmployees } from '../repositories/employee.repository.js';

async function resolveUploadManager(user) {
  if (user?.managerId) {
    const manager = await findManagerById(user.managerId);
    if (manager) return manager.managerId;
  }

  const defaultManager = await findAnyManager();
  if (defaultManager) return defaultManager.managerId;

  throw new Error('No available manager found for upload assignment');
}

export async function uploadEmployeesController(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Excel file is required' });
    }

    const managerId = await resolveUploadManager(req.user);
    const results = await parseExcelAndUpsertEmployees(req.file.buffer, managerId);
    const processed = results.filter((row) => row.status === 'success').length;
    const failed = results.filter((row) => row.status === 'failed');

    await addUploadHistory({
      managerId,
      uploadedBy: req.user?.email || req.user?.name || 'HR Portal',
      fileName: req.file.originalname,
      successCount: processed,
      failedCount: failed.length,
      errors: failed.map((row) => ({
        row: row.row,
        employeeNumber: row.employeeNumber,
        reason: row.reason,
      })),
    });

    return res.json({
      success: true,
      summary: results,
      processed,
      failed: failed.length,
      errors: failed,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Failed to parse or save Excel data' });
  }
}

export async function previewEmployeesController(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Excel file is required for preview' });
    }

    await resolveUploadManager(req.user);
    const preview = await previewExcelEmployees(req.file.buffer);
    return res.json({ fileName: req.file.originalname, ...preview });
  } catch (error) {
    console.error('Preview error:', error);
    return res.status(500).json({ error: 'Failed to parse excel preview' });
  }
}

export async function getAllEmployeesController(_req, res) {
  try {
    const employees = await findAllEmployees();
    return res.json({ employees });
  } catch (error) {
    console.error('Load employees error:', error);
    return res.status(500).json({ error: 'Failed to load employees' });
  }
}

export async function getUploadHistoryController(req, res) {
  try {
    const user = req.user;
    let history;
    if (user?.managerId) {
      history = await getUploadHistoryByManager(user.managerId);
    } else {
      history = await getUploadHistoryByManager();
    }

    return res.json({ history });
  } catch (error) {
    console.error('Load upload history error:', error);
    return res.status(500).json({ error: 'Failed to load upload history' });
  }
}
