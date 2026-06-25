import { Employee } from '../models/Employee.js';

export async function upsertEmployee(employeeData) {
  return Employee.findOneAndUpdate(
    { employeeNumber: employeeData.employeeNumber },
    { $set: employeeData },
    { upsert: true, new: true, runValidators: true }
  ).exec();
}

export async function findEmployeesByManager(managerId) {
  return Employee.find({ managerId }).sort({ employeeName: 1 }).exec();
}

export async function findAllEmployees() {
  return Employee.find({}).sort({ employeeName: 1 }).exec();
}

export async function findEmployeeById(id) {
  return Employee.findById(id).exec();
}

export async function findEmployeeByNumber(employeeNumber) {
  return Employee.findOne({ employeeNumber }).exec();
}

export async function createEmployee(employeeData) {
  const existing = await findEmployeeByNumber(employeeData.employeeNumber);
  if (existing) {
    throw new Error('Employee with this number already exists');
  }
  return Employee.create(employeeData);
}

export async function updateEmployee(employeeNumber, updateData) {
  return Employee.findOneAndUpdate(
    { employeeNumber },
    { $set: updateData },
    { new: true, runValidators: true }
  ).exec();
}

export async function deleteEmployee(employeeNumber) {
  return Employee.findOneAndDelete({ employeeNumber }).exec();
}

export async function findDistinctDepartments() {
  return Employee.distinct('department').exec();
}
