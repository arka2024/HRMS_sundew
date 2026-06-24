import { AUTH_SERVICE_URL } from '../config/env.js';
import { verifyToken } from '../services/auth.service.js';

async function validateExternalToken(token) {
  const response = await fetch(`${AUTH_SERVICE_URL}/validate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Invalid external token');
  }

  const data = await response.json();
  if (!data.valid || !data.user) {
    throw new Error('Invalid external token');
  }

  return data.user;
}

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    try {
      const externalUser = await validateExternalToken(token);
      req.user = {
        ...externalUser,
        managerId: externalUser.role === 'manager' ? externalUser.id : undefined,
      };
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }
}
