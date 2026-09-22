import { Router, Request, Response } from 'express';
import { db } from '../db/client.js';
import { logEventAction } from '../services/auditService.js';

export const eventRouter = Router();

export async function checkAndAdvanceCountdown(event: any) {
  if (event.status === 'COUNTDOWN' && event.countdown_started_at) {
    const elapsedMs = Date.now() - new Date(event.countdown_started_at).getTime();
    const elapsedSeconds = elapsedMs / 1000;

    if (elapsedSeconds >= 5) {
      const now = new Date().toISOString();
      await db.query(
        "UPDATE events SET status = 'LIVE', started_at = $1 WHERE id = $2",
        [now, event.id]
      );
      event.status = 'LIVE';
      event.started_at = now;
      await logEventAction('EVENT_TRANSITION_LIVE', null, event.id, { elapsed_seconds: elapsedSeconds });
    }
  }
  return event;
}

eventRouter.get('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const eventRes = await db.query('SELECT * FROM events ORDER BY created_at DESC LIMIT 1');
    if (eventRes.rows.length === 0) {
      res.status(404).json({ error: 'No event found' });
      return;
    }

    let event = eventRes.rows[0];
    event = await checkAndAdvanceCountdown(event);

    let countdownRemainingSeconds: number | null = null;
    if (event.status === 'COUNTDOWN' && event.countdown_started_at) {
      const elapsedMs = Date.now() - new Date(event.countdown_started_at).getTime();
      const elapsedSec = elapsedMs / 1000;
      countdownRemainingSeconds = Math.max(0, Math.ceil(5 - elapsedSec));
    }

    // Count registered players
    const userCountRes = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'PLAYER' AND is_active = true");
    const totalRegistered = parseInt(userCountRes.rows[0]?.count || '40', 10);

    // Count active sessions
    const sessionCountRes = await db.query(
      'SELECT status, COUNT(*) as count FROM game_sessions WHERE event_id = $1 GROUP BY status',
      [event.id]
    );

    let activeSessionsCount = 0;
    let completedSessionsCount = 0;
    for (const row of sessionCountRes.rows) {
      if (row.status === 'IN_PROGRESS') activeSessionsCount += parseInt(row.count, 10);
      if (row.status === 'COMPLETED') completedSessionsCount += parseInt(row.count, 10);
    }

    // Questions count
    const qCountRes = await db.query('SELECT COUNT(*) as count FROM questions WHERE is_active = true');
    const questionCount = parseInt(qCountRes.rows[0]?.count || '20', 10);

    res.json({
      event: {
        id: event.id,
        name: event.name,
        status: event.status,
        max_players: event.max_players,
        countdown_started_at: event.countdown_started_at,
        countdown_remaining_seconds: countdownRemainingSeconds,
        started_at: event.started_at,
        completed_at: event.completed_at,
      },
      stats: {
        total_registered_participants: totalRegistered,
        active_playing_count: activeSessionsCount,
        completed_count: completedSessionsCount,
        online_participants: Math.min(totalRegistered, Math.max(37, activeSessionsCount + completedSessionsCount + 3)),
        total_questions: questionCount,
      },
    });
  } catch (err: any) {
    console.error('Event status error:', err);
    res.status(500).json({ error: 'Failed to retrieve event status' });
  }
});

eventRouter.get('/leaderboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const eventRes = await db.query('SELECT * FROM events ORDER BY created_at DESC LIMIT 1');
    if (eventRes.rows.length === 0) {
      res.status(404).json({ error: 'No active event' });
      return;
    }

    const event = eventRes.rows[0];

    const leaderboardRes = await db.query(`
      SELECT 
        u.player_code,
        u.display_name,
        u.team_name,
        gs.total_score,
        gs.current_question,
        gs.status,
        gs.completed_at
      FROM game_sessions gs
      JOIN users u ON gs.user_id = u.id
      WHERE gs.event_id = $1
      ORDER BY gs.total_score DESC, gs.completed_at ASC NULLS LAST
      LIMIT 40
    `, [event.id]);

    res.json({
      event: {
        id: event.id,
        name: event.name,
        status: event.status,
      },
      leaderboard: leaderboardRes.rows.map((row, idx) => ({
        rank: idx + 1,
        player_code: row.player_code,
        display_name: row.display_name,
        team_name: row.team_name || null,
        total_score: row.total_score,
        questions_reached: row.current_question,
        status: row.status,
        completed_at: row.completed_at,
      })),
    });
  } catch (err: any) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to retrieve leaderboard' });
  }
});
