import { authenticateManager, authenticateUser, registerUser, signToken } from '../services/auth.service.js';

export async function loginController(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Try to authenticate with new user system first
  const user = await authenticateUser(email, password);
  if (user) {
    const token = signToken({ id: user.id, name: user.name, email: user.email, role: user.role });
    return res.json({ user, token });
  }

  // Fallback to old manager authentication for backward compatibility
  const manager = await authenticateManager(email, password);
  if (manager) {
    const token = signToken({ managerId: manager.managerId, managerName: manager.managerName, email: manager.email, role: 'manager' });
    return res.json({ user: { ...manager, role: 'manager' }, token });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
}

export async function registerController(req, res) {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  if (!['hr', 'manager'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const user = await registerUser(name, email, password, role);
    const token = signToken({ id: user.id, name: user.name, email: user.email, role: user.role });
    return res.json({ user, token });
  } catch (error) {
    if (error.message === 'User already exists') {
      return res.status(409).json({ error: 'User already exists' });
    }
    return res.status(500).json({ error: 'Registration failed' });
  }
}
