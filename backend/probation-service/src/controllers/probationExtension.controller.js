import {
  createProbationExtension,
  findAllProbationExtensions,
  findProbationExtensionById,
  updateProbationExtension,
  approveProbationExtension,
  rejectProbationExtension,
  approveProbationExtensionByManager,
  deleteProbationExtension,
} from '../repositories/probationExtension.repository.js';
import { findAllEmployees, findEmployeeByNumber } from '../repositories/employee.repository.js';
import { findManagerById } from '../repositories/manager.repository.js';
import { emailService } from '../services/email.service.js';

export async function createProbationExtensionController(req, res) {
  try {
    const data = req.body;
    data.requestedBy = req.user?.name || req.user?.managerId || 'Unknown';
    data.requestedDate = new Date();
    const extension = await createProbationExtension(data);

    // Send email to HR
    const hrEmail = process.env.HR_EMAIL || 'hr@sundew.com';
    await emailService.sendProbationExtensionRequested(
      extension.employeeName,
      hrEmail,
      extension.durationMonths,
      extension.reason
    );

    res.json({ message: 'Probation extension request created', extension });
  } catch (error) {
    console.error('Create probation extension error:', error);
    res.status(500).json({ error: error.message || 'Failed to create probation extension request' });
  }
}

export async function getProbationExtensionsController(req, res) {
  try {
    const filters = req.query;
    const extensions = await findAllProbationExtensions(filters);
    res.json({ extensions });
  } catch (error) {
    console.error('Get probation extensions error:', error);
    res.status(500).json({ error: 'Failed to get probation extensions' });
  }
}

export async function getProbationExtensionByIdController(req, res) {
  try {
    const { id } = req.params;
    const extension = await findProbationExtensionById(id);
    if (!extension) {
      return res.status(404).json({ error: 'Probation extension not found' });
    }
    res.json({ extension });
  } catch (error) {
    console.error('Get probation extension by id error:', error);
    res.status(500).json({ error: 'Failed to get probation extension' });
  }
}

export async function updateProbationExtensionController(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    const extension = await updateProbationExtension(id, data);
    res.json({ message: 'Probation extension updated', extension });
  } catch (error) {
    console.error('Update probation extension error:', error);
    res.status(500).json({ error: error.message || 'Failed to update probation extension' });
  }
}

export async function approveProbationExtensionByManagerController(req, res) {
  try {
    const { id } = req.params;
    const managerId = req.user?.name || req.user?.managerId || 'Unknown';
    const extension = await approveProbationExtensionByManager(id, managerId);
    res.json({ message: 'Probation extension approved by manager', extension });
  } catch (error) {
    console.error('Approve probation extension by manager error:', error);
    res.status(500).json({ error: 'Failed to approve probation extension' });
  }
}

export async function approveProbationExtensionController(req, res) {
  try {
    const { id } = req.params;
    const approvedBy = req.user?.name || 'HR Admin';
    const extension = await approveProbationExtension(id, approvedBy);
    
    // Send emails
    const employee = await findEmployeeByNumber(extension.employeeNumber);
    const manager = employee ? await findManagerById(employee.managerId) : null;
    
    if (manager) {
      await emailService.sendProbationExtensionApproved(
        extension.employeeName,
        manager.email,
        extension.durationMonths
      );
    }
    
    if (employee) {
      await emailService.sendProbationExtended(
        extension.employeeName,
        'employee@example.com', // In a real app, you'd have employee email
        extension.durationMonths
      );
    }

    res.json({ message: 'Probation extension approved', extension });
  } catch (error) {
    console.error('Approve probation extension error:', error);
    res.status(500).json({ error: 'Failed to approve probation extension' });
  }
}

export async function rejectProbationExtensionController(req, res) {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const rejectedBy = req.user?.name || 'HR Admin';
    const extension = await rejectProbationExtension(id, rejectionReason, rejectedBy);
    
    // Send email to manager
    const employee = await findEmployeeByNumber(extension.employeeNumber);
    const manager = employee ? await findManagerById(employee.managerId) : null;
    
    if (manager) {
      await emailService.sendProbationExtensionRejected(
        extension.employeeName,
        manager.email,
        rejectionReason
      );
    }

    res.json({ message: 'Probation extension rejected', extension });
  } catch (error) {
    console.error('Reject probation extension error:', error);
    res.status(500).json({ error: 'Failed to reject probation extension' });
  }
}

export async function deleteProbationExtensionController(req, res) {
  try {
    const { id } = req.params;
    await deleteProbationExtension(id);
    res.json({ message: 'Probation extension deleted' });
  } catch (error) {
    console.error('Delete probation extension error:', error);
    res.status(500).json({ error: 'Failed to delete probation extension' });
  }
}
