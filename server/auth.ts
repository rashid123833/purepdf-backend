import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, DbUser } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'purepdf_store_secret_token_rashid_2026_9837492';

export interface AuthenticatedRequest extends Request {
  user?: DbUser;
}

export function generateToken(user: DbUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in to proceed.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = db.getUserById(payload.id);
    if (!user) {
      return res.status(401).json({ error: 'User session invalid or user deleted. Please log in again.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
}

export function sanitizeUser(user: DbUser) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}
