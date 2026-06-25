import bcrypt from 'bcryptjs';
import {
  findAllManagers,
  findManagerById,
  createManager,
  updateManager,
} from '../repositories/manager.repository.js';
import { findEmployeesByManager } from '../repositories/employee.repository.js';

export async function getEmployeesForManagerController(req, res) {
  try {
    const user = req.user;
    if (!user?.managerId) {
      return res.status(403).json({ error: 'Manager credentials required' });
    }

    const employees = await findEmployeesByManager(user.managerId);
    return res.json({ employees });
  } catch (error) {
    console.error('Manager employee list error:', error);
    return res.status(500).json({ error: 'Failed to load employees' });
  }
}

export async function getAllManagersController(req, res) {
  try {
    const { status, department } = req.query;
    const managers = await findAllManagers({ status, department });
    return res.json({ managers });
  } catch (error) {
    console.error('Get all managers error:', error);
    return res.status(500).json({ error: 'Failed to load managers' });
  }
}

export async function getManagerByIdController(req, res) {
  try {
    const { managerId } = req.params;
    const manager = await findManagerById(managerId);
    if (!manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }
    return res.json({ manager });
  } catch (error) {
    console.error('Get manager by id error:', error);
    return res.status(500).json({ error: 'Failed to load manager' });
  }
}

export async function createManagerController(req, res) {
  try {
    const { managerId, managerName, email, password, department, status } = req.body;
    if (!managerId || !managerName || !email || !password || !department) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    const existingManager = await findManagerById(managerId);
    if (existingManager) {
      return res.status(409).json({ error: 'Manager with this ID already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const manager = await createManager({
      managerId,
      managerName,
      email,
      passwordHash,
      department,
      status: status || 'Active',
    });

    return res.status(201).json({ manager });
  } catch (error) {
    console.error('Create manager error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Manager with this email or ID already exists' });
    }
    return res.status(500).json({ error: 'Failed to create manager' });
  }
}

export async function updateManagerController(req, res) {
  try {
    const { managerId } = req.params;
    const { managerName, email, password, department, status } = req.body;

    const updateData = {};
    if (managerName) updateData.managerName = managerName;
    if (email) updateData.email = email;
    if (password) updateData.passwordHash = await bcrypt.hash(password, 10);
    if (department) updateData.department = department;
    if (status) updateData.status = status;

    const manager = await updateManager(managerId, updateData);
    if (!manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }

    return res.json({ manager });
  } catch (error) {
    console.error('Update manager error:', error);
    return res.status(500).json({ error: 'Failed to update manager' });
  }
}
