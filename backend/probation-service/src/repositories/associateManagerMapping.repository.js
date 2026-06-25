import { AssociateManagerMapping } from '../models/AssociateManagerMapping.js';

export async function createAssociateManagerMapping(data) {
  // Check for existing active mapping for this associate
  const existing = await AssociateManagerMapping.findOne({
    associateEmployeeNumber: data.associateEmployeeNumber, isActive: true }).exec();
  if (existing) {
    throw new Error('Active mapping already exists for this associate');
  }
  return AssociateManagerMapping.create(data);
}

export async function findAllAssociateManagerMappings(filters = {}) {
  let query = {};
  if (filters.associateEmployeeNumber) query.associateEmployeeNumber = filters.associateEmployeeNumber;
  if (filters.managerEmployeeNumber) query.managerEmployeeNumber = filters.managerEmployeeNumber;
  if (filters.isActive !== undefined) query.isActive = filters.isActive;
  return AssociateManagerMapping.find(query).sort({ createdAt: -1 }).exec();
}

export async function findAssociateManagerMappingById(id) {
  return AssociateManagerMapping.findById(id).exec();
}

export async function updateAssociateManagerMapping(id, updateData) {
  return AssociateManagerMapping.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true }).exec();
}

export async function deleteAssociateManagerMapping(id) {
  return AssociateManagerMapping.findByIdAndDelete(id).exec();
}

export async function deactivateMapping(id) {
  return AssociateManagerMapping.findByIdAndUpdate(
    id,
    { $set: { isActive: false } },
    { new: true, runValidators: true }
  ).exec();
}
