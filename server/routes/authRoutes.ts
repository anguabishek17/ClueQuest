import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/client.js';
import { config } from '../config.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { logEventAction } from '../services/auditService.js';

export const authRouter = Router();

authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { player_code, password } = req.body;

    if (!player_code || !password) {
      res.status(400).json({ error: 'Player ID and Password are required' });
      return;
    }

    const cleanCode = String(player_code).trim().toUpperCase();
    const result = await db.query(
      'SELECT id, player_code, display_name, password_hash, role, is_active FROM users WHERE player_code = $1',
      [cleanCode]
    );

    if (result.rows.length === 0) {
      // Also check lowercased admin
      const adminCheck = await db.query(
        'SELECT id, player_code, display_name, password_hash, role, is_active FROM users WHERE player_code = $1',
        [cleanCode.toLowerCase()]
      );
      if (adminCheck.rows.length === 0) {
        res.status(401).json({ error: 'Invalid Player ID / Username or Password' });
        return;
      }
      result.rows[0] = adminCheck.rows[0];
    }

    const user = result.rows[0];

    if (!user.is_active) {
      res.status(403).json({ error: 'Account is deactivated. Contact Coordinator.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid Player ID / Username or Password' });
      return;
    }

    // Generate secure JWT
    const token = jwt.sign(
      { id: user.id, player_code: user.player_code, role: user.role },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    // Set secure HTTP-only cookie
    res.cookie('cq_auth_token', token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    await logEventAction('LOGIN', user.id, null, { player_code: user.player_code, role: user.role });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        player_code: user.player_code,
        display_name: user.display_name,
        team_name: user.team_name || null,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
});

// Dedicated Admin Login Endpoint
authRouter.post('/admin/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Admin username and password are required' });
      return;
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const result = await db.query(
      "SELECT id, player_code, display_name, password_hash, role, is_active FROM users WHERE lower(player_code) = $1 AND role = 'ADMIN'",
      [cleanUsername]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid Administrator credentials' });
      return;
    }

    const adminUser = result.rows[0];

    if (!adminUser.is_active) {
      res.status(403).json({ error: 'Admin account is deactivated' });
      return;
    }

    const isMatch = await bcrypt.compare(password, adminUser.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid Administrator credentials' });
      return;
    }

    // Generate secure JWT
    const token = jwt.sign(
      { id: adminUser.id, player_code: adminUser.player_code, role: 'ADMIN' },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    res.cookie('cq_auth_token', token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    await logEventAction('ADMIN_LOGIN', adminUser.id, null, { username: adminUser.player_code });

    res.json({
      success: true,
      token,
      user: {
        id: adminUser.id,
        player_code: adminUser.player_code,
        display_name: adminUser.display_name,
        role: 'ADMIN',
      },
    });
  } catch (err: any) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Internal server error during admin authentication' });
  }
});

// Sanitization and validation helper for team name
function validateAndNormalizeTeamName(raw: any): { valid: boolean; normalized?: string; error?: string } {
  if (!raw || typeof raw !== 'string') {
    return { valid: false, error: 'Please enter your team name.' };
  }

  // Strip script tags / HTML
  const sanitized = raw.replace(/<[^>]*>?/gm, '').trim();

  // Check if original had tags or malicious content
  if (/<[a-z][\s\S]*>/i.test(raw)) {
    return { valid: false, error: 'HTML and script tags are not allowed in team names.' };
  }

  // Normalize multiple spaces
  const normalized = sanitized.replace(/\s+/g, ' ');

  if (normalized.length < 2) {
    return { valid: false, error: 'Team name must contain at least 2 characters.' };
  }

  if (normalized.length > 60) {
    return { valid: false, error: 'Team name must not exceed 60 characters.' };
  }

  return { valid: true, normalized };
}

// Participant Team Registration (First-time)
authRouter.post('/team', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    if (user.role !== 'PLAYER') {
      res.status(403).json({ error: 'Only participants can register team names.' });
      return;
    }

    const { teamName } = req.body;
    const validation = validateAndNormalizeTeamName(teamName);
    if (!validation.valid || !validation.normalized) {
      res.status(400).json({ error: validation.error });
      return;
    }

    // Verify event state is WAITING
    const eventRes = await db.query('SELECT status FROM events ORDER BY created_at DESC LIMIT 1');
    const eventStatus = eventRes.rows[0]?.status || 'WAITING';
    if (eventStatus !== 'WAITING') {
      res.status(400).json({ error: 'Team name changes are disabled after the event begins.' });
      return;
    }

    // Check for team name uniqueness across other participants (case-insensitive)
    const existingTeam = await db.query(
      'SELECT id, player_code FROM users WHERE lower(team_name) = $1 AND id != $2',
      [validation.normalized.toLowerCase(), user.id]
    );

    if (existingTeam.rows.length > 0) {
      res.status(400).json({ error: 'This team name is already registered. Please choose another team name.' });
      return;
    }

    // Save team name for authenticated participant
    await db.query(
      'UPDATE users SET team_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [validation.normalized, user.id]
    );

    await logEventAction('TEAM_REGISTERED', user.id, null, {
      player_code: user.player_code,
      team_name: validation.normalized,
    });

    res.json({
      success: true,
      message: 'Team name registered successfully.',
      user: {
        id: user.id,
        player_code: user.player_code,
        display_name: user.display_name,
        team_name: validation.normalized,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error('Team registration error:', err);
    res.status(500).json({ error: 'Failed to register team name.' });
  }
});

// Participant Team Update (Editing before start)
authRouter.patch('/team', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    if (user.role !== 'PLAYER') {
      res.status(403).json({ error: 'Only participants can update team names.' });
      return;
    }

    // Check event status
    const eventRes = await db.query('SELECT status FROM events ORDER BY created_at DESC LIMIT 1');
    const eventStatus = eventRes.rows[0]?.status || 'WAITING';
    if (eventStatus !== 'WAITING') {
      res.status(400).json({ error: 'Team name changes are disabled after the event begins.' });
      return;
    }

    const { teamName } = req.body;
    const validation = validateAndNormalizeTeamName(teamName);
    if (!validation.valid || !validation.normalized) {
      res.status(400).json({ error: validation.error });
      return;
    }

    // Check uniqueness excluding self
    const existingTeam = await db.query(
      'SELECT id FROM users WHERE lower(team_name) = $1 AND id != $2',
      [validation.normalized.toLowerCase(), user.id]
    );

    if (existingTeam.rows.length > 0) {
      res.status(400).json({ error: 'This team name is already registered. Please choose another team name.' });
      return;
    }

    const oldTeam = user.team_name || null;
    await db.query(
      'UPDATE users SET team_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [validation.normalized, user.id]
    );

    await logEventAction('TEAM_UPDATED', user.id, null, {
      player_code: user.player_code,
      old_team_name: oldTeam,
      new_team_name: validation.normalized,
    });

    res.json({
      success: true,
      message: 'Team name updated successfully.',
      user: {
        id: user.id,
        player_code: user.player_code,
        display_name: user.display_name,
        team_name: validation.normalized,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error('Team update error:', err);
    res.status(500).json({ error: 'Failed to update team name.' });
  }
});

authRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.json({
    user: req.user,
  });
});

authRouter.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (req.user) {
    await logEventAction('LOGOUT', req.user.id, null, { player_code: req.user.player_code });
  }
  res.clearCookie('cq_auth_token');
  res.json({ success: true, message: 'Logged out successfully' });
});
