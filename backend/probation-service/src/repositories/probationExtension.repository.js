import { ProbationExtension } from '../models/ProbationExtension.js';
import { findAllEmployees } from './employee.repository.js';

export async function createProbationExtension(data) {
  return ProbationExtension.create(data);
}

export async function findAllProbationExtensions(filters = {}) {
  let query = {};
  if (filters.employeeNumber) query.employeeNumber = filters.employeeNumber;
  if (filters.status && filters.status !== 'all') query.status = filters.status;
  return ProbationExtension.find(query).sort({ requestedDate: -1 }).exec();
}

export async function findProbationExtensionById(id) {
  return ProbationExtension.findById(id).exec();
}

export async function updateProbationExtension(id, updateData) {
  return ProbationExtension.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true }).exec();
}

export async function deleteProbationExtension(id) {
  return ProbationExtension.findByIdAndDelete(id).exec();
}

export async function approveProbationExtension(id, approvedBy) {
  return ProbationExtension.findByIdAndUpdate(
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

export async function rejectProbationExtension(id, rejectionReason, rejectedBy) {
  return ProbationExtension.findByIdAndUpdate(
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

export async function approveProbationExtensionByManager(id, managerId) {
  return ProbationExtension.findByIdAndUpdate(
    id,
    {
      $set: {
        managerApproved: true,
        managerApprovedBy: managerId,
        managerApprovedDate: new Date(),
      }
    },
    { new: true, runValidators: true }
  ).exec();
}
