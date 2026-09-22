import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db } from '../db/client.js';

export interface AuthUser {
  id: string;
  player_code: string;
  display_name: string;
  team_name?: string | null;
  role: 'PLAYER' | 'ADMIN';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function extractToken(req: Request): string | null {
  // Check Authorization Header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  // Check Signed or Plain Cookies
  if (req.cookies && req.cookies.cq_auth_token) {
    return req.cookies.cq_auth_token;
  }
  return null;
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Authentication token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string; role: 'PLAYER' | 'ADMIN' };
    const result = await db.query('SELECT id, player_code, display_name, team_name, role, is_active FROM users WHERE id = $1', [decoded.id]);
    
    if (result.rows.length === 0 || !result.rows[0].is_active) {
      res.status(401).json({ error: 'User account not found or disabled' });
      return;
    }

    const u = result.rows[0];
    req.user = {
      id: u.id,
      player_code: u.player_code,
      display_name: u.display_name,
      team_name: u.team_name || null,
      role: u.role,
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session token' });
    return;
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden: Administrator privileges required' });
    return;
  }
  next();
}

export function requirePlayer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'PLAYER') {
    res.status(403).json({ error: 'Forbidden: Player privileges required' });
    return;
  }
  next();
}
