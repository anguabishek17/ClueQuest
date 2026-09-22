import { db } from '../db/client.js';
import { logEventAction } from './auditService.js';

export const CLUE_POINT_VALUES: Record<number, number> = {
  1: 100,
  2: 75,
  3: 50,
  4: 25,
};

export function normalizeAnswer(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .toUpperCase()
    .replace(/[^\w\s-]/g, '') // remove punctuation except hyphens
    .replace(/\s+/g, ' ')      // collapse multiple spaces
    .trim();
}

export function isAnswerMatch(userAnswer: string, correctAnswer: string, aliases: string[] = []): boolean {
  const normUser = normalizeAnswer(userAnswer);
  if (!normUser) return false;

  const normCorrect = normalizeAnswer(correctAnswer);
  if (normUser === normCorrect) return true;

  for (const alias of aliases) {
    if (normUser === normalizeAnswer(alias)) return true;
  }

  // Check plural/singular variations
  if (normUser === normCorrect + 'S' || normUser + 'S' === normCorrect) return true;

  return false;
}

export async function getOrCreateGameSession(userId: string, eventId: string) {
  const existing = await db.query(
    'SELECT * FROM game_sessions WHERE user_id = $1 AND event_id = $2',
    [userId, eventId]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const sessionId = `sess_${userId.replace('usr_', '')}_${Date.now()}`;
  const insertRes = await db.query(`
    INSERT INTO game_sessions (id, event_id, user_id, status, current_question, current_clue_level, current_question_value, total_score)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [sessionId, eventId, userId, 'IN_PROGRESS', 1, 1, 100, 0]);

  await logEventAction('GAME_START', userId, eventId, { session_id: sessionId });

  return insertRes.rows[0] || {
    id: sessionId,
    event_id: eventId,
    user_id: userId,
    status: 'IN_PROGRESS',
    current_question: 1,
    current_clue_level: 1,
    current_question_value: 100,
    total_score: 0,
  };
}

export const TEST_DURATION_SECONDS = 20 * 60; // 20 minutes (1200 seconds)

export async function recordIntegrityEvent(
  userId: string,
  eventId: string,
  type: string,
  metadata: Record<string, any> = {}
) {
  await logEventAction('INTEGRITY_EVENT', userId, eventId, {
    type,
    ...metadata,
    recorded_at: new Date().toISOString(),
  });
}

export async function getPlayerGameState(userId: string, eventId: string, eventStatus: string = 'LIVE') {
  const session = await getOrCreateGameSession(userId, eventId);

  // Fetch current event to compute authoritative deadline
  const eventRes = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
  const event = eventRes.rows[0] || null;

  let deadlineAt: string | null = null;
  let serverNow = new Date().toISOString();
  let isExpired = false;

  if (event && event.started_at) {
    const startedTime = new Date(event.started_at).getTime();
    const deadlineTime = startedTime + TEST_DURATION_SECONDS * 1000;
    deadlineAt = new Date(deadlineTime).toISOString();
    if (Date.now() >= deadlineTime) {
      isExpired = true;
    }
  }

  // If event is not LIVE (e.g. WAITING, COUNTDOWN, PAUSED, ENDED), NEVER leak question content or clues to participant!
  if (eventStatus !== 'LIVE' && eventStatus !== 'PAUSED') {
    return {
      session,
      question: null,
      unlocked_clues: [],
      already_attempted: null,
      total_questions: 20,
      deadline_at: deadlineAt,
      server_now: serverNow,
      is_expired: isExpired,
    };
  }

  // If test has expired and session not yet completed, auto-complete
  if (isExpired && session.status !== 'COMPLETED') {
    await db.query("UPDATE game_sessions SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP WHERE id = $1", [session.id]);
    session.status = 'COMPLETED';
    await logEventAction('TEST_EXPIRED_COMPLETED', userId, eventId, { session_id: session.id, score: session.total_score });
  }

  // Get active question for the session's current_question number
  const qRes = await db.query(
    'SELECT id, question_number, question_text, category, is_active FROM questions WHERE question_number = $1 AND is_active = true',
    [session.current_question]
  );

  if (qRes.rows.length === 0 || isExpired) {
    // If past question 20 or test expired or no question, mark completed
    if (session.status !== 'COMPLETED') {
      await db.query("UPDATE game_sessions SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP WHERE id = $1", [session.id]);
      session.status = 'COMPLETED';
    }
    return {
      session,
      question: null,
      unlocked_clues: [],
      already_attempted: null,
      total_questions: 20,
      deadline_at: deadlineAt,
      server_now: serverNow,
      is_expired: isExpired,
    };
  }

  const rawQ = qRes.rows[0];
  const question = {
    id: rawQ.id,
    question_number: rawQ.question_number,
    question_text: rawQ.question_text,
    category: rawQ.category,
    is_active: rawQ.is_active,
  };

  // Fetch only unlocked clues (up to session.current_clue_level) - SERVER AUTHORITATIVE (Never send locked clues)
  const cluesRes = await db.query(
    'SELECT id, level, clue_text, points FROM clues WHERE question_id = $1 AND level <= $2 ORDER BY level ASC',
    [question.id, session.current_clue_level]
  );

  // Check if current question has already been attempted in this session
  const attemptRes = await db.query(
    'SELECT id, session_id, question_id, highest_clue_level, final_question_value, user_answer, correct_answer, is_correct, earned_points, submitted_at FROM question_attempts WHERE session_id = $1 AND question_id = $2',
    [session.id, question.id]
  );

  const attempt = attemptRes.rows.length > 0 ? attemptRes.rows[0] : null;

  return {
    session,
    question,
    unlocked_clues: cluesRes.rows,
    already_attempted: attempt,
    total_questions: 20,
    deadline_at: deadlineAt,
    server_now: serverNow,
    is_expired: isExpired,
  };
}

export async function checkEventDeadline(eventId: string) {
  const eventRes = await db.query('SELECT started_at, status FROM events WHERE id = $1', [eventId]);
  const event = eventRes.rows[0];
  if (!event || !event.started_at) return { isExpired: false, deadlineAt: null };

  const deadlineTime = new Date(event.started_at).getTime() + TEST_DURATION_SECONDS * 1000;
  const isExpired = Date.now() >= deadlineTime;
  return { isExpired, deadlineAt: new Date(deadlineTime).toISOString() };
}

export async function revealNextClue(userId: string, eventId: string, requestedLevel?: number) {
  const { isExpired } = await checkEventDeadline(eventId);
  if (isExpired) {
    throw new Error('TEST_EXPIRED: The 20-minute competition duration has elapsed.');
  }

  const session = await getOrCreateGameSession(userId, eventId);

  if (session.status === 'COMPLETED') {
    throw new Error('Game session already completed');
  }

  if (session.current_clue_level >= 4) {
    throw new Error('Maximum clues already revealed (Level 4 / 25 points)');
  }

  const nextLevel = session.current_clue_level + 1;

  // Prevent race condition skipping (e.g. 1 -> 3)
  if (requestedLevel && requestedLevel !== nextLevel) {
    throw new Error(`Sequential clue progression only. Current is Clue ${session.current_clue_level}. Next must be Clue ${nextLevel}.`);
  }

  // Verify the question hasn't already been submitted
  const qRes = await db.query(
    'SELECT id FROM questions WHERE question_number = $1 AND is_active = true',
    [session.current_question]
  );
  if (qRes.rows.length === 0) throw new Error('Question not found');

  const attemptRes = await db.query(
    'SELECT id FROM question_attempts WHERE session_id = $1 AND question_id = $2',
    [session.id, qRes.rows[0].id]
  );
  if (attemptRes.rows.length > 0) {
    throw new Error('Question has already been answered. Cannot reveal additional clues.');
  }

  const nextValue = CLUE_POINT_VALUES[nextLevel];

  // Irreversible atomic update
  await db.query(`
    UPDATE game_sessions
    SET current_clue_level = $1, current_question_value = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
  `, [nextLevel, nextValue, session.id]);

  session.current_clue_level = nextLevel;
  session.current_question_value = nextValue;

  await logEventAction('CLUE_REVEALED', userId, eventId, {
    session_id: session.id,
    question_number: session.current_question,
    new_level: nextLevel,
    new_value: nextValue,
  });

  return getPlayerGameState(userId, eventId, 'LIVE');
}

export async function submitQuestionAnswer(userId: string, eventId: string, rawUserAnswer: string) {
  const { isExpired } = await checkEventDeadline(eventId);
  if (isExpired) {
    throw new Error('TEST_EXPIRED: The 20-minute competition duration has elapsed.');
  }

  const session = await getOrCreateGameSession(userId, eventId);

  if (session.status === 'COMPLETED') {
    throw new Error('Game session is already completed');
  }

  const qRes = await db.query(
    'SELECT * FROM questions WHERE question_number = $1 AND is_active = true',
    [session.current_question]
  );

  if (qRes.rows.length === 0) {
    throw new Error('Active question not found');
  }

  const question = qRes.rows[0];

  // Atomic idempotency check: Prevent duplicate submissions
  const existingAttempt = await db.query(
    'SELECT id FROM question_attempts WHERE session_id = $1 AND question_id = $2',
    [session.id, question.id]
  );

  if (existingAttempt.rows.length > 0) {
    throw new Error('This question has already been answered for this session. Duplicate submissions prevented.');
  }

  const normalizedInput = normalizeAnswer(rawUserAnswer);
  if (!normalizedInput) {
    throw new Error('Please enter a valid answer.');
  }

  const aliases = Array.isArray(question.accepted_aliases)
    ? question.accepted_aliases
    : (typeof question.accepted_aliases === 'string' ? JSON.parse(question.accepted_aliases) : []);

  const isCorrect = isAnswerMatch(normalizedInput, question.answer, aliases);
  const earnedPoints = isCorrect ? session.current_question_value : 0;

  const attemptId = `att_${session.id}_q${question.question_number}_${Date.now()}`;

  // Insert attempt record with normalized uppercase answer
  await db.query(`
    INSERT INTO question_attempts (id, session_id, question_id, highest_clue_level, final_question_value, user_answer, correct_answer, is_correct, earned_points)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `, [
    attemptId,
    session.id,
    question.id,
    session.current_clue_level,
    session.current_question_value,
    normalizedInput,
    question.answer.toUpperCase(),
    isCorrect,
    earnedPoints
  ]);

  // Update session total score
  const newTotal = (session.total_score || 0) + earnedPoints;
  await db.query(`
    UPDATE game_sessions
    SET total_score = total_score + $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `, [earnedPoints, session.id]);

  session.total_score = newTotal;

  await logEventAction('ANSWER_SUBMITTED', userId, eventId, {
    session_id: session.id,
    question_number: session.current_question,
    clue_level: session.current_clue_level,
    question_value: session.current_question_value,
    is_correct: isCorrect,
    earned_points: earnedPoints,
    new_total_score: newTotal,
  });

  return {
    is_correct: isCorrect,
    earned_points: earnedPoints,
    total_score: newTotal,
    correct_answer: question.answer.toUpperCase(),
    user_answer: normalizedInput,
    question_number: session.current_question,
  };
}

export async function advanceToNextQuestion(userId: string, eventId: string) {
  const { isExpired } = await checkEventDeadline(eventId);
  if (isExpired) {
    throw new Error('TEST_EXPIRED: The 20-minute competition duration has elapsed.');
  }

  const session = await getOrCreateGameSession(userId, eventId);

  if (session.status === 'COMPLETED') {
    return { session, is_complete: true };
  }

  // Ensure current question attempt was made
  const qRes = await db.query(
    'SELECT id FROM questions WHERE question_number = $1 AND is_active = true',
    [session.current_question]
  );

  if (qRes.rows.length > 0) {
    const attempt = await db.query(
      'SELECT id FROM question_attempts WHERE session_id = $1 AND question_id = $2',
      [session.id, qRes.rows[0].id]
    );
    if (attempt.rows.length === 0) {
      throw new Error('Cannot advance without submitting an answer for the current question.');
    }
  }

  const nextQuestionNum = session.current_question + 1;

  if (nextQuestionNum > 20) {
    // Finish Game!
    await db.query(`
      UPDATE game_sessions
      SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [session.id]);
    session.status = 'COMPLETED';

    await logEventAction('GAME_COMPLETED', userId, eventId, {
      session_id: session.id,
      final_score: session.total_score,
    });

    return { session, is_complete: true };
  }

  // Reset clue level to 1 and value to 100 for the next question
  await db.query(`
    UPDATE game_sessions
    SET current_question = $1, current_clue_level = 1, current_question_value = 100, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `, [nextQuestionNum, session.id]);

  session.current_question = nextQuestionNum;
  session.current_clue_level = 1;
  session.current_question_value = 100;

  await logEventAction('QUESTION_COMPLETED', userId, eventId, {
    session_id: session.id,
    next_question: nextQuestionNum,
  });

  return { session, is_complete: false };
}

export async function getGameResultsSummary(userId: string, eventId: string) {
  const session = await getOrCreateGameSession(userId, eventId);

  const attemptsRes = await db.query(`
    SELECT qa.*, q.question_number, q.question_text, q.category
    FROM question_attempts qa
    JOIN questions q ON qa.question_id = q.id
    WHERE qa.session_id = $1
    ORDER BY q.question_number ASC
  `, [session.id]);

  const attempts = attemptsRes.rows;

  let correctCount = 0;
  let incorrectCount = 0;
  let totalCluesUsed = 0;
  let count100 = 0;
  let count75 = 0;
  let count50 = 0;
  let count25 = 0;

  for (const a of attempts) {
    totalCluesUsed += a.highest_clue_level;
    if (a.is_correct) {
      correctCount++;
      if (a.earned_points === 100) count100++;
      else if (a.earned_points === 75) count75++;
      else if (a.earned_points === 50) count50++;
      else if (a.earned_points === 25) count25++;
    } else {
      incorrectCount++;
    }
  }

  return {
    session,
    total_score: session.total_score,
    max_possible_score: 2000,
    total_questions: attempts.length,
    correct_count: correctCount,
    incorrect_count: incorrectCount,
    clues_used: totalCluesUsed,
    answers_100_pt: count100,
    answers_75_pt: count75,
    answers_50_pt: count50,
    answers_25_pt: count25,
    attempts,
  };
}
