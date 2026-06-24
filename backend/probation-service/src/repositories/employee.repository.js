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
