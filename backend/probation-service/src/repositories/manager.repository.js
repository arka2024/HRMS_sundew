import bcrypt from 'bcryptjs';
import { Manager } from '../models/Manager.js';

export async function findManagerByEmail(email) {
  return Manager.findOne({ email }).exec();
}

export async function findManagerById(managerId) {
  return Manager.findOne({ managerId }).exec();
}

export async function findAnyManager() {
  return Manager.findOne({}).sort({ managerName: 1 }).exec();
}

export async function createManager(managerData) {
  const manager = new Manager(managerData);
  return manager.save();
}

export async function ensureDummyManager() {
  const existing = await Manager.findOne({ email: 'emma.hayes@company.com' }).exec();
  if (existing) return existing;

  return createManager({
    managerId: 'manager-001',
    managerName: 'Emma Hayes',
    email: 'emma.hayes@company.com',
    passwordHash: await bcrypt.hash('password123', 10),
  });
}
