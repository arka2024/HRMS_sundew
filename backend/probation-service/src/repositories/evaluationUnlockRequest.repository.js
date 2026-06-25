import { EvaluationUnlockRequest } from '../models/EvaluationUnlockRequest.js';

export async function createEvaluationUnlockRequest(data) {
  return EvaluationUnlockRequest.create(data);
}

export async function findAllEvaluationUnlockRequests(filters = {}) {
  let query = {};
  if (filters.employeeNumber) query.employeeNumber = filters.employeeNumber;
  if (filters.status && filters.status !== 'all') query.status = filters.status;
  return EvaluationUnlockRequest.find(query).sort({ requestedDate: -1 }).exec();
}

export async function findEvaluationUnlockRequestById(id) {
  return EvaluationUnlockRequest.findById(id).exec();
}

export async function updateEvaluationUnlockRequest(id, updateData) {
  return EvaluationUnlockRequest.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true }).exec();
}

export async function approveEvaluationUnlockRequest(id, approvedBy) {
  return EvaluationUnlockRequest.findByIdAndUpdate(
    id,
    {
      $set: {
        status: 'Approved',
        approvedBy,
        approvedDate: new Date(),
      }
    },
    { new: true, runValidators: true }
  ).exec();
}

export async function rejectEvaluationUnlockRequest(id, rejectionReason, rejectedBy) {
  return EvaluationUnlockRequest.findByIdAndUpdate(
    id,
    {
      $set: {
        status: 'Rejected',
        rejectionReason,
        approvedBy: rejectedBy,
        approvedDate: new Date(),
      }
    },
    { new: true, runValidators: true }
  ).exec();
}
