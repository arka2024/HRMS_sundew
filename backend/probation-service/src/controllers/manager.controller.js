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
