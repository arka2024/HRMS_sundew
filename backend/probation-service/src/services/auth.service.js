import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import { findManagerByEmail } from '../repositories/manager.repository.js';

// Mock user database for HR and Manager roles (in production, use actual database)
const mockUsers = {
  'hr@sundew.com': { id: '1', name: 'HR Admin', email: 'hr@sundew.com', passwordHash: '$2a$10$mockHash', role: 'hr' },
  'manager@sundew.com': { id: '2', name: 'Manager', email: 'manager@sundew.com', passwordHash: '$2a$10$mockHash', role: 'manager' },
  'demo@sundew.com': { id: '3', name: 'Demo User', email: 'demo@sundew.com', passwordHash: '$2a$10$mockHash', role: 'manager' },
};

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '4h' });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export async function authenticateManager(email, password) {
  const manager = await findManagerByEmail(email);
  if (!manager) return null;

  const isValidPassword = await bcrypt.compare(password, manager.passwordHash);
  if (!isValidPassword) return null;

  return {
    managerId: manager.managerId,
    managerName: manager.managerName,
    email: manager.email,
  };
}

export async function authenticateUser(email, password) {
  const user = mockUsers[email];
  if (!user) return null;

  // For demo purposes, accept 'password123' for all accounts
  // In production, use bcrypt.compare
  if (password !== 'password123') return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function registerUser(name, email, password, role) {
  // Check if user already exists
  if (mockUsers[email]) {
    throw new Error('User already exists');
  }

  // In production, hash the password with bcrypt
  // const passwordHash = await bcrypt.hash(password, 10);
  
  // For demo purposes, store plain password check
  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    passwordHash: '$2a$10$mockHash', // Mock hash
    role,
  };

  mockUsers[email] = newUser;

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
  };
}
