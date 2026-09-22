import { Router, Response } from 'express';
import { authenticate, requirePlayer, AuthenticatedRequest } from '../middleware/auth.js';
import { db } from '../db/client.js';
import { checkAndAdvanceCountdown } from './eventRoutes.js';
import {
  getPlayerGameState,
  revealNextClue,
  submitQuestionAnswer,
  advanceToNextQuestion,
  getGameResultsSummary,
  recordIntegrityEvent,
} from '../services/gameService.js';

export const gameRouter = Router();

// Helper to get active event ID with automatic countdown check
async function getActiveEvent() {
  const res = await db.query('SELECT * FROM events ORDER BY created_at DESC LIMIT 1');
  if (res.rows.length === 0) {
    throw new Error('No active event found');
  }
  let event = res.rows[0];
  event = await checkAndAdvanceCountdown(event);
  return event;
}

gameRouter.get('/state', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const event = await getActiveEvent();

    const gameState = await getPlayerGameState(user.id, event.id, event.status);

    let countdownRemainingSeconds: number | null = null;
    if (event.status === 'COUNTDOWN' && event.countdown_started_at) {
      const elapsedMs = Date.now() - new Date(event.countdown_started_at).getTime();
      const elapsedSec = elapsedMs / 1000;
      countdownRemainingSeconds = Math.max(0, Math.ceil(5 - elapsedSec));
    }

    res.json({
      event: {
        id: event.id,
        name: event.name,
        status: event.status,
        countdown_started_at: event.countdown_started_at,
        countdown_remaining_seconds: countdownRemainingSeconds,
        started_at: event.started_at,
      },
      ...gameState,
    });
  } catch (err: any) {
    console.error('Error fetching game state:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch game state' });
  }
});

gameRouter.post('/reveal-clue', authenticate, requirePlayer, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const event = await getActiveEvent();

    if (event.status !== 'LIVE') {
      res.status(400).json({ error: `Event is currently in ${event.status} state. Clues cannot be revealed.` });
      return;
    }

    const { requested_level } = req.body || {};
    const updatedState = await revealNextClue(user.id, event.id, requested_level ? Number(requested_level) : undefined);
    res.json({
      success: true,
      event: {
        id: event.id,
        name: event.name,
        status: event.status,
      },
      ...updatedState,
    });
  } catch (err: any) {
    console.error('Error revealing clue:', err);
    res.status(400).json({ error: err.message || 'Failed to reveal clue' });
  }
});

gameRouter.post('/submit-answer', authenticate, requirePlayer, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const event = await getActiveEvent();

    if (event.status !== 'LIVE') {
      res.status(400).json({ error: `Event is currently in ${event.status} state. Answers cannot be submitted.` });
      return;
    }

    const { answer } = req.body;
    if (!answer || typeof answer !== 'string' || !answer.trim()) {
      res.status(400).json({ error: 'Please provide an answer.' });
      return;
    }

    const result = await submitQuestionAnswer(user.id, event.id, answer.trim());
    res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    console.error('Error submitting answer:', err);
    res.status(400).json({ error: err.message || 'Failed to submit answer' });
  }
});

gameRouter.post('/next-question', authenticate, requirePlayer, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const event = await getActiveEvent();

    if (event.status !== 'LIVE' && event.status !== 'ENDED') {
      res.status(400).json({ error: `Event is currently in ${event.status} state.` });
      return;
    }

    const advanceResult = await advanceToNextQuestion(user.id, event.id);
    const updatedState = await getPlayerGameState(user.id, event.id, event.status);

    res.json({
      success: true,
      is_complete: advanceResult.is_complete,
      event: {
        id: event.id,
        name: event.name,
        status: event.status,
      },
      ...updatedState,
    });
  } catch (err: any) {
    console.error('Error advancing question:', err);
    res.status(400).json({ error: err.message || 'Failed to advance to next question' });
  }
});

gameRouter.get('/results', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const event = await getActiveEvent();

    const results = await getGameResultsSummary(user.id, event.id);
    res.json({
      success: true,
      event: {
        id: event.id,
        name: event.name,
        status: event.status,
      },
      player: {
        id: user.id,
        player_code: user.player_code,
        display_name: user.display_name,
        team_name: user.team_name || null,
      },
      ...results,
    });
  } catch (err: any) {
    console.error('Error fetching results:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch results' });
  }
});

// Participant-side Integrity / Activity Event reporting
gameRouter.post('/integrity-event', authenticate, requirePlayer, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const event = await getActiveEvent();

    const { type, metadata } = req.body || {};
    if (!type || typeof type !== 'string') {
      res.status(400).json({ error: 'Valid event type is required.' });
      return;
    }

    // Only record during LIVE / PAUSED events
    if (event.status !== 'LIVE' && event.status !== 'PAUSED') {
      res.json({ success: true, recorded: false, reason: 'Event is not LIVE' });
      return;
    }

    await recordIntegrityEvent(user.id, event.id, type.trim().toUpperCase(), metadata || {});

    res.json({
      success: true,
      recorded: true,
      event_type: type.trim().toUpperCase(),
    });
  } catch (err: any) {
    console.error('Error recording integrity event:', err);
    res.status(500).json({ error: 'Failed to record integrity event' });
  }
});

