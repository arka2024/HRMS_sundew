import {
  createEvaluationUnlockRequest,
  findAllEvaluationUnlockRequests,
  findEvaluationUnlockRequestById,
  updateEvaluationUnlockRequest,
  approveEvaluationUnlockRequest,
  rejectEvaluationUnlockRequest,
} from '../repositories/evaluationUnlockRequest.repository.js';
import { unlockEvaluation } from '../repositories/evaluation.repository.js';
import { findEmployeeByNumber } from '../repositories/employee.repository.js';
import { findManagerById } from '../repositories/manager.repository.js';
import { emailService } from '../services/email.service.js';

export async function createEvaluationUnlockRequestController(req, res) {
  try {
    const data = req.body;
    data.requestedBy = req.user?.name || req.user?.managerId || 'Unknown';
    data.requestedDate = new Date();
    const request = await createEvaluationUnlockRequest(data);

    // Send email to HR
    const hrEmail = process.env.HR_EMAIL || 'hr@sundew.com';
    const evaluationPeriod = `${request.evaluationMonth} ${request.evaluationYear}`;
    await emailService.sendUnlockRequested(
      request.employeeName,
      hrEmail,
      request.reason,
      evaluationPeriod
    );

    res.json({ message: 'Evaluation unlock request created', request });
  } catch (error) {
    console.error('Create evaluation unlock request error:', error);
    res.status(500).json({ error: error.message || 'Failed to create evaluation unlock request' });
  }
}

export async function getEvaluationUnlockRequestsController(req, res) {
  try {
    const filters = req.query;
    const requests = await findAllEvaluationUnlockRequests(filters);
    res.json({ requests });
  } catch (error) {
    console.error('Get evaluation unlock requests error:', error);
    res.status(500).json({ error: 'Failed to get evaluation unlock requests' });
  }
}

export async function getEvaluationUnlockRequestByIdController(req, res) {
  try {
    const { id } = req.params;
    const request = await findEvaluationUnlockRequestById(id);
    if (!request) {
      return res.status(404).json({ error: 'Evaluation unlock request not found' });
    }
    res.json({ request });
  } catch (error) {
    console.error('Get evaluation unlock request by id error:', error);
    res.status(500).json({ error: 'Failed to get evaluation unlock request' });
  }
}

export async function updateEvaluationUnlockRequestController(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    const request = await updateEvaluationUnlockRequest(id, data);
    res.json({ message: 'Evaluation unlock request updated', request });
  } catch (error) {
    console.error('Update evaluation unlock request error:', error);
    res.status(500).json({ error: error.message || 'Failed to update evaluation unlock request' });
  }
}

export async function approveEvaluationUnlockRequestController(req, res) {
  try {
    const { id } = req.params;
    const approvedBy = req.user?.name || 'HR Admin';
    const request = await approveEvaluationUnlockRequest(id, approvedBy);
    
    // Unlock the evaluation!
    await unlockEvaluation(
      request.employeeNumber,
      request.evaluationYear,
      request.evaluationMonth,
      approvedBy,
      'Unlock approved by HR'
    );

    // Send email to manager
    const employee = await findEmployeeByNumber(request.employeeNumber);
    const manager = employee ? await findManagerById(employee.managerId) : null;
    const evaluationPeriod = `${request.evaluationMonth} ${request.evaluationYear}`;
    
    if (manager) {
      await emailService.sendUnlockApproved(
        request.employeeName,
        manager.email,
        evaluationPeriod
      );
    }
    
    res.json({ message: 'Evaluation unlock request approved and evaluation unlocked', request });
  } catch (error) {
    console.error('Approve evaluation unlock request error:', error);
    res.status(500).json({ error: 'Failed to approve evaluation unlock request' });
  }
}

export async function rejectEvaluationUnlockRequestController(req, res) {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const rejectedBy = req.user?.name || 'HR Admin';
    const request = await rejectEvaluationUnlockRequest(id, rejectionReason, rejectedBy);

    // Send email to manager
    const employee = await findEmployeeByNumber(request.employeeNumber);
    const manager = employee ? await findManagerById(employee.managerId) : null;
    const evaluationPeriod = `${request.evaluationMonth} ${request.evaluationYear}`;
    
    if (manager) {
      await emailService.sendUnlockRejected(
        request.employeeName,
        manager.email,
        evaluationPeriod,
        rejectionReason
      );
    }

    res.json({ message: 'Evaluation unlock request rejected', request });
  } catch (error) {
    console.error('Reject evaluation unlock request error:', error);
    res.status(500).json({ error: 'Failed to reject evaluation unlock request' });
  }
}
