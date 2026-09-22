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

// Participant Team Registration (Passwordless direct entry via Team Name)
authRouter.post('/team', async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamName } = req.body;
    const validation = validateAndNormalizeTeamName(teamName);
    if (!validation.valid || !validation.normalized) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const normTeam = validation.normalized;

    // 1. Check current event state
    const eventRes = await db.query('SELECT status, max_players FROM events ORDER BY created_at DESC LIMIT 1');
    const event = eventRes.rows[0];
    const eventStatus = event?.status || 'WAITING';
    const maxPlayers = event?.max_players || 40;

    // 2. Check if team is already registered (case-insensitive)
    const existingTeam = await db.query(
      'SELECT id, player_code, display_name, team_name, role, is_active FROM users WHERE lower(team_name) = $1',
      [normTeam.toLowerCase()]
    );

    let user: any = null;

    if (existingTeam.rows.length > 0) {
      user = existingTeam.rows[0];
      // If event has started/live or waiting, re-authenticating same team is allowed (session recovery)
    } else {
      // New team registration: Check event status
      if (eventStatus === 'ENDED') {
        res.status(400).json({ error: 'This event has already concluded.' });
        return;
      }

      if (eventStatus !== 'WAITING') {
        res.status(400).json({ error: 'New team registrations are closed as the event is currently active.' });
        return;
      }

      // Check current capacity (40 registered teams)
      const registeredCountRes = await db.query(
        "SELECT count(*) as count FROM users WHERE role = 'PLAYER' AND team_name IS NOT NULL"
      );
      const registeredCount = parseInt(registeredCountRes.rows[0]?.count || '0', 10);

      if (registeredCount >= maxPlayers) {
        res.status(400).json({ error: `Event capacity reached. Maximum participating teams: ${maxPlayers}` });
        return;
      }

      // Find an available player slot or assign new player slot
      const availableUserRes = await db.query(
        "SELECT id, player_code, display_name, team_name, role, is_active FROM users WHERE role = 'PLAYER' AND team_name IS NULL ORDER BY player_code ASC LIMIT 1"
      );

      if (availableUserRes.rows.length > 0) {
        user = availableUserRes.rows[0];
        await db.query(
          'UPDATE users SET team_name = $1, display_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [normTeam, user.id]
        );
        user.team_name = normTeam;
        user.display_name = normTeam;
      } else {
        // Fallback create user slot if needed
        const newCode = `CQ${String(registeredCount + 1).padStart(3, '0')}`;
        const newId = `usr_${newCode.toLowerCase()}`;
        const dummyHash = await bcrypt.hash(`TEAM_${normTeam}_${Date.now()}`, 4);

        const insertUserRes = await db.query(
          'INSERT INTO users (id, player_code, display_name, team_name, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [newId, newCode, normTeam, normTeam, dummyHash, 'PLAYER', true]
        );
        user = insertUserRes.rows[0] || {
          id: newId,
          player_code: newCode,
          display_name: normTeam,
          team_name: normTeam,
          role: 'PLAYER',
          is_active: true,
        };
      }

      await logEventAction('TEAM_REGISTERED', user.id, null, {
        player_code: user.player_code,
        team_name: normTeam,
      });
    }

    if (!user.is_active) {
      res.status(403).json({ error: 'Team access is deactivated. Please contact the coordinator.' });
      return;
    }

    // Generate secure participant session token
    const token = jwt.sign(
      { id: user.id, player_code: user.player_code, role: 'PLAYER' },
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

    res.json({
      success: true,
      token,
      message: 'Team joined successfully.',
      user: {
        id: user.id,
        player_code: user.player_code,
        display_name: user.display_name,
        team_name: user.team_name || normTeam,
        role: 'PLAYER',
      },
    });
  } catch (err: any) {
    console.error('Team entry error:', err);
    res.status(500).json({ error: 'Failed to process team entry.' });
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
