import { Router, Response } from 'express';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import { db } from '../db/client.js';
import { logEventAction } from '../services/auditService.js';
import { checkAndAdvanceCountdown } from './eventRoutes.js';

export const adminRouter = Router();

// Apply auth + requireAdmin middleware across all admin routes
adminRouter.use(authenticate);
adminRouter.use(requireAdmin);

// 1. Get Event Control Status & Participant Matrix
adminRouter.get('/overview', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const eventRes = await db.query('SELECT * FROM events ORDER BY created_at DESC LIMIT 1');
    let event = eventRes.rows[0];
    event = await checkAndAdvanceCountdown(event);

    let countdownRemainingSeconds: number | null = null;
    if (event.status === 'COUNTDOWN' && event.countdown_started_at) {
      const elapsedMs = Date.now() - new Date(event.countdown_started_at).getTime();
      const elapsedSec = elapsedMs / 1000;
      countdownRemainingSeconds = Math.max(0, Math.ceil(5 - elapsedSec));
    }

    // Get all 40 player users
    const usersRes = await db.query("SELECT id, player_code, display_name, team_name, is_active FROM users WHERE role = 'PLAYER' ORDER BY player_code ASC");
    const players = usersRes.rows;

    // Get all game sessions for this event
    const sessionsRes = await db.query('SELECT * FROM game_sessions WHERE event_id = $1', [event.id]);
    const sessionMap = new Map(sessionsRes.rows.map(s => [s.user_id, s]));

    // Get integrity event counts grouped by user_id for this event
    const integrityRes = await db.query(
      "SELECT user_id, COUNT(*) as count FROM event_logs WHERE event_id = $1 AND action = 'INTEGRITY_EVENT' GROUP BY user_id",
      [event.id]
    );
    const integrityMap = new Map(integrityRes.rows.map(r => [r.user_id, parseInt(r.count || '0', 10)]));

    // Build Participant Matrix
    let waitingCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let totalScoreSum = 0;
    let maxScore = 0;

    const participantsMatrix = players.map(p => {
      const sess = sessionMap.get(p.id);
      const integrityEventsCount = integrityMap.get(p.id) || 0;
      let status = 'WAITING';
      let currentQuestion = 1;
      let currentClueLevel = 1;
      let currentQuestionValue = 100;
      let totalScore = 0;

      if (sess) {
        currentQuestion = sess.current_question;
        currentClueLevel = sess.current_clue_level;
        currentQuestionValue = sess.current_question_value;
        totalScore = sess.total_score || 0;

        if (sess.status === 'COMPLETED') {
          status = 'COMPLETED';
          completedCount++;
        } else if (event.status === 'LIVE' || event.status === 'COUNTDOWN') {
          status = 'LIVE';
          inProgressCount++;
        } else if (event.status === 'PAUSED') {
          status = 'PAUSED';
          inProgressCount++;
        } else {
          status = 'WAITING';
          waitingCount++;
        }
      } else {
        waitingCount++;
      }

      totalScoreSum += totalScore;
      if (totalScore > maxScore) maxScore = totalScore;

      return {
        user_id: p.id,
        player_code: p.player_code,
        display_name: p.display_name,
        team_name: p.team_name || null,
        question_display: `Q${String(currentQuestion).padStart(2, '0')}`,
        question_number: currentQuestion,
        clue_display: `C${currentClueLevel}`,
        clue_level: currentClueLevel,
        current_value: currentQuestionValue,
        total_score: totalScore,
        integrity_events_count: integrityEventsCount,
        status,
        last_updated: sess?.updated_at || null,
      };
    });

    const activeQuestionsRes = await db.query('SELECT COUNT(*) as count FROM questions WHERE is_active = true');
    const questionCount = parseInt(activeQuestionsRes.rows[0]?.count || '0', 10);

    res.json({
      event: {
        ...event,
        countdown_remaining_seconds: countdownRemainingSeconds,
      },
      stats: {
        total_participants: players.length,
        waiting_count: waitingCount,
        in_progress_count: inProgressCount,
        completed_count: completedCount,
        total_questions: questionCount,
        avg_score: players.length > 0 ? Math.round(totalScoreSum / players.length) : 0,
        max_score: maxScore,
      },
      participants: participantsMatrix,
    });
  } catch (err: any) {
    console.error('Admin overview error:', err);
    res.status(500).json({ error: 'Failed to retrieve admin overview' });
  }
});

// Participant Detail Diagnostics for Coordinator Modal
adminRouter.get('/participant/:userId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const userRes = await db.query(
      "SELECT id, player_code, display_name, team_name, role, is_active FROM users WHERE id = $1 AND role = 'PLAYER'",
      [userId]
    );

    if (userRes.rows.length === 0) {
      res.status(404).json({ error: 'Participant not found' });
      return;
    }

    const player = userRes.rows[0];
    const eventRes = await db.query('SELECT id, status FROM events ORDER BY created_at DESC LIMIT 1');
    const event = eventRes.rows[0];

    const sessRes = await db.query(
      'SELECT * FROM game_sessions WHERE user_id = $1 AND event_id = $2',
      [player.id, event.id]
    );
    const session = sessRes.rows[0] || null;

    let attempts: any[] = [];
    if (session) {
      const attRes = await db.query(
        'SELECT * FROM question_attempts WHERE session_id = $1 ORDER BY submitted_at ASC',
        [session.id]
      );
      attempts = attRes.rows;
    }

    const correctCount = attempts.filter(a => a.is_correct).length;
    const incorrectCount = attempts.filter(a => !a.is_correct).length;
    const cluesRevealed = attempts.reduce((acc, a) => acc + (a.highest_clue_level || 1), 0);

    // Fetch integrity event logs for this participant
    const logsRes = await db.query(
      "SELECT id, action, metadata, created_at FROM event_logs WHERE user_id = $1 AND event_id = $2 AND action = 'INTEGRITY_EVENT' ORDER BY created_at DESC",
      [player.id, event.id]
    );
    const integrityLogs = logsRes.rows.map(r => {
      let meta = r.metadata;
      if (typeof meta === 'string') {
        try { meta = JSON.parse(meta); } catch {}
      }
      return {
        id: r.id,
        type: meta?.type || 'UNKNOWN',
        metadata: meta,
        created_at: r.created_at,
      };
    });

    res.json({
      success: true,
      participant: {
        id: player.id,
        player_code: player.player_code,
        display_name: player.display_name,
        team_name: player.team_name || 'UNREGISTERED',
        is_active: player.is_active,
        status: session ? session.status : 'WAITING',
        current_question: session ? session.current_question : 1,
        current_clue_level: session ? session.current_clue_level : 1,
        current_question_value: session ? session.current_question_value : 100,
        total_score: session ? session.total_score : 0,
        questions_completed: attempts.length,
        correct_answers: correctCount,
        incorrect_answers: incorrectCount,
        clues_revealed: cluesRevealed,
        integrity_events_count: integrityLogs.length,
        started_at: session?.started_at || null,
        completed_at: session?.completed_at || null,
      },
      integrity_logs: integrityLogs,
      attempts: attempts.map(a => ({
        question_id: a.question_id,
        highest_clue_level: a.highest_clue_level,
        final_question_value: a.final_question_value,
        user_answer: a.user_answer,
        is_correct: a.is_correct,
        earned_points: a.earned_points,
        submitted_at: a.submitted_at,
      })),
    });
  } catch (err: any) {
    console.error('Participant detail error:', err);
    res.status(500).json({ error: 'Failed to retrieve participant detail' });
  }
});

// 2. Event Lifecycle Controls (START / START NOW, PAUSE, RESUME, END, RESET)
adminRouter.post('/event/control', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { action } = req.body;
    const eventRes = await db.query('SELECT * FROM events ORDER BY created_at DESC LIMIT 1');
    if (eventRes.rows.length === 0) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    let event = eventRes.rows[0];
    event = await checkAndAdvanceCountdown(event);

    if (action === 'START' || action === 'START_NOW') {
      if (event.status !== 'WAITING') {
        res.status(400).json({ error: `Cannot start event. Current event state is ${event.status}. Reset event first if you wish to restart.` });
        return;
      }

      // PRE-START VALIDATION
      const validationErrors: string[] = [];
      const qRes = await db.query('SELECT id, question_number, question_text, answer FROM questions WHERE is_active = true ORDER BY question_number ASC');
      
      if (qRes.rows.length !== 20) {
        validationErrors.push(`Exactly 20 active questions are required (currently ${qRes.rows.length} found).`);
      }

      // Validate sequential numbers from 1 to 20
      const numbers = qRes.rows.map(q => q.question_number).sort((a, b) => a - b);
      for (let i = 1; i <= 20; i++) {
        if (numbers[i - 1] !== i) {
          validationErrors.push(`Question numbers must be sequential 1 to 20 (missing or duplicate at #${i}).`);
          break;
        }
      }

      // Validate all questions have non-empty text, answer, and all 4 clues
      for (const q of qRes.rows) {
        const qNumStr = String(q.question_number).padStart(2, '0');
        if (!q.question_text || !q.question_text.trim()) {
          validationErrors.push(`Question ${qNumStr} has an empty question statement.`);
        }
        if (!q.answer || !q.answer.trim()) {
          validationErrors.push(`Question ${qNumStr} is missing a valid answer.`);
        }

        const cluesRes = await db.query('SELECT level, clue_text FROM clues WHERE question_id = $1 ORDER BY level ASC', [q.id]);
        if (cluesRes.rows.length !== 4) {
          validationErrors.push(`Question ${qNumStr} has ${cluesRes.rows.length}/4 clues.`);
        } else {
          for (let l = 1; l <= 4; l++) {
            const clue = cluesRes.rows.find(c => c.level === l);
            if (!clue || !clue.clue_text || !clue.clue_text.trim()) {
              validationErrors.push(`Question ${qNumStr} is missing Clue ${l}.`);
            }
          }
        }
      }

      // Check registered participants
      const userCountRes = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'PLAYER' AND is_active = true");
      if (parseInt(userCountRes.rows[0]?.count || '0', 10) === 0) {
        validationErrors.push('At least one active participant must be registered.');
      }

      if (validationErrors.length > 0) {
        res.status(400).json({
          error: 'EVENT CANNOT START: The question bank is incomplete.',
          details: validationErrors,
        });
        return;
      }

      const now = new Date().toISOString();
      await db.query(
        "UPDATE events SET status = 'COUNTDOWN', countdown_started_at = $1 WHERE id = $2",
        [now, event.id]
      );

      await logEventAction('EVENT_START', req.user?.id, event.id, { timestamp: now, initiated_by: req.user?.player_code });
      res.json({
        success: true,
        message: 'Synchronized countdown triggered! Event transitioning to LIVE in 5 seconds.',
        status: 'COUNTDOWN',
        countdown_started_at: now,
      });
      return;
    }

    if (action === 'PAUSE') {
      if (event.status !== 'LIVE') {
        res.status(400).json({ error: 'Only LIVE events can be paused.' });
        return;
      }
      await db.query("UPDATE events SET status = 'PAUSED' WHERE id = $1", [event.id]);
      await logEventAction('ADMIN_EVENT_PAUSED', req.user?.id, event.id);
      res.json({ success: true, message: 'Event paused.', status: 'PAUSED' });
      return;
    }

    if (action === 'RESUME') {
      if (event.status !== 'PAUSED') {
        res.status(400).json({ error: 'Only PAUSED events can be resumed.' });
        return;
      }
      await db.query("UPDATE events SET status = 'LIVE' WHERE id = $1", [event.id]);
      await logEventAction('ADMIN_EVENT_RESUMED', req.user?.id, event.id);
      res.json({ success: true, message: 'Event resumed.', status: 'LIVE' });
      return;
    }

    if (action === 'END') {
      const now = new Date().toISOString();
      await db.query("UPDATE events SET status = 'ENDED', completed_at = $1 WHERE id = $2", [now, event.id]);
      await logEventAction('ADMIN_EVENT_ENDED', req.user?.id, event.id);
      res.json({ success: true, message: 'Event ended.', status: 'ENDED' });
      return;
    }

    if (action === 'RESET') {
      // Clear sessions and attempts for clean fresh competition round
      await db.query('DELETE FROM question_attempts');
      await db.query('DELETE FROM game_sessions WHERE event_id = $1', [event.id]);
      await db.query("UPDATE events SET status = 'WAITING', countdown_started_at = NULL, started_at = NULL, completed_at = NULL WHERE id = $1", [event.id]);

      if (!db.isNeon()) {
        const mem = db.getMemoryStore();
        mem.question_attempts.clear();
        mem.game_sessions.clear();
        event.status = 'WAITING';
        event.countdown_started_at = null;
        event.started_at = null;
        event.completed_at = null;
      }

      await logEventAction('ADMIN_EVENT_RESET', req.user?.id, event.id);
      res.json({ success: true, message: 'Competition sessions reset to WAITING state.', status: 'WAITING' });
      return;
    }

    res.status(400).json({ error: 'Unknown action: ' + action });
  } catch (err: any) {
    console.error('Event control error:', err);
    res.status(500).json({ error: err.message || 'Failed to update event state' });
  }
});

// Helper: Parse CSV into Rows
function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentVal.trim());
      if (currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal.length > 0 || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// 3. CSV Import Endpoint: POST /api/admin/questions/import-csv
adminRouter.post('/questions/import-csv', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { csvText } = req.body;
    if (!csvText || typeof csvText !== 'string' || !csvText.trim()) {
      res.status(400).json({ error: 'Please provide CSV content to import.' });
      return;
    }

    const rows = parseCSV(csvText.trim());
    if (rows.length < 2) {
      res.status(400).json({ error: 'CSV file is empty or missing data rows.' });
      return;
    }

    // Header check
    const header = rows[0].map(h => h.toLowerCase().trim());
    const expectedHeaders = ['serial number', 'question', 'clue 1', 'clue 2', 'clue 3', 'clue 4', 'answer'];
    
    // Find column indexes
    const snIdx = header.findIndex(h => h.includes('serial') || h === 'sn' || h === 'no' || h === '#');
    const qIdx = header.findIndex(h => h.includes('question') && !h.includes('clue'));
    const c1Idx = header.findIndex(h => h.includes('clue 1') || h === 'clue1' || h === 'clue 01');
    const c2Idx = header.findIndex(h => h.includes('clue 2') || h === 'clue2' || h === 'clue 02');
    const c3Idx = header.findIndex(h => h.includes('clue 3') || h === 'clue3' || h === 'clue 03');
    const c4Idx = header.findIndex(h => h.includes('clue 4') || h === 'clue4' || h === 'clue 04');
    const aIdx = header.findIndex(h => h.includes('answer') || h === 'correct answer');

    if (snIdx === -1 || qIdx === -1 || c1Idx === -1 || c2Idx === -1 || c3Idx === -1 || c4Idx === -1 || aIdx === -1) {
      res.status(400).json({
        error: 'Invalid CSV Headers. Required columns: serial number, question, clue 1, clue 2, clue 3, clue 4, answer',
      });
      return;
    }

    const dataRows = rows.slice(1);
    if (dataRows.length !== 20) {
      res.status(400).json({
        error: `QUESTION BANK INVALID: Exactly 20 questions are required for the official competition (${dataRows.length} found).`,
      });
      return;
    }

    const parsedQuestions: Array<{
      serial: number;
      question: string;
      clue1: string;
      clue2: string;
      clue3: string;
      clue4: string;
      answer: string;
    }> = [];

    const validationErrors: string[] = [];
    const seenSerials = new Set<number>();

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 1;

      const serialVal = parseInt(row[snIdx] || '', 10);
      const questionText = row[qIdx] || '';
      const clue1 = row[c1Idx] || '';
      const clue2 = row[c2Idx] || '';
      const clue3 = row[c3Idx] || '';
      const clue4 = row[c4Idx] || '';
      const answer = row[aIdx] || '';

      if (isNaN(serialVal)) {
        validationErrors.push(`Row ${rowNum}: Invalid serial number.`);
      } else {
        if (seenSerials.has(serialVal)) {
          validationErrors.push(`Row ${rowNum}: Duplicate serial number ${serialVal}.`);
        }
        seenSerials.add(serialVal);
      }

      if (!questionText.trim()) validationErrors.push(`Row ${rowNum} (Q#${serialVal}): Missing question text.`);
      if (!clue1.trim()) validationErrors.push(`Row ${rowNum} (Q#${serialVal}): Missing Clue 1.`);
      if (!clue2.trim()) validationErrors.push(`Row ${rowNum} (Q#${serialVal}): Missing Clue 2.`);
      if (!clue3.trim()) validationErrors.push(`Row ${rowNum} (Q#${serialVal}): Missing Clue 3.`);
      if (!clue4.trim()) validationErrors.push(`Row ${rowNum} (Q#${serialVal}): Missing Clue 4.`);
      if (!answer.trim()) validationErrors.push(`Row ${rowNum} (Q#${serialVal}): Missing answer.`);

      parsedQuestions.push({
        serial: serialVal,
        question: questionText.trim(),
        clue1: clue1.trim(),
        clue2: clue2.trim(),
        clue3: clue3.trim(),
        clue4: clue4.trim(),
        answer: answer.trim().toUpperCase(),
      });
    }

    // Verify serials are 1..20 sequential
    for (let s = 1; s <= 20; s++) {
      if (!seenSerials.has(s)) {
        validationErrors.push(`Missing Question #${s}. Questions must be sequential from 1 to 20.`);
      }
    }

    if (validationErrors.length > 0) {
      res.status(400).json({
        error: 'CSV Validation Failed. No database changes committed.',
        details: validationErrors,
      });
      return;
    }

    // ATOMIC COMMIT: Clear and insert all 20 questions
    if (db.isNeon()) {
      await db.query('BEGIN');
      try {
        await db.query('DELETE FROM clues');
        await db.query('DELETE FROM questions');

        for (const q of parsedQuestions) {
          const qId = `q_${String(q.serial).padStart(2, '0')}`;
          await db.query(`
            INSERT INTO questions (id, question_number, question_text, answer, accepted_aliases, category, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [qId, q.serial, q.question, q.answer, JSON.stringify([q.answer]), 'Electronics', true]);

          const clues = [
            { level: 1, text: q.clue1, points: 100 },
            { level: 2, text: q.clue2, points: 75 },
            { level: 3, text: q.clue3, points: 50 },
            { level: 4, text: q.clue4, points: 25 },
          ];

          for (const c of clues) {
            const clueId = `clue_${qId}_l${c.level}`;
            await db.query(`
              INSERT INTO clues (id, question_id, level, clue_text, points)
              VALUES ($1, $2, $3, $4, $5)
            `, [clueId, qId, c.level, c.text, c.points]);
          }
        }
        await db.query('COMMIT');
      } catch (e) {
        await db.query('ROLLBACK');
        throw e;
      }
    } else {
      const mem = db.getMemoryStore();
      mem.clues.clear();
      mem.questions.clear();

      for (const q of parsedQuestions) {
        const qId = `q_${String(q.serial).padStart(2, '0')}`;
        mem.questions.set(qId, {
          id: qId,
          question_number: q.serial,
          question_text: q.question,
          answer: q.answer,
          accepted_aliases: [q.answer],
          category: 'Electronics',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        const clues = [
          { level: 1, text: q.clue1, points: 100 },
          { level: 2, text: q.clue2, points: 75 },
          { level: 3, text: q.clue3, points: 50 },
          { level: 4, text: q.clue4, points: 25 },
        ];

        for (const c of clues) {
          const clueId = `clue_${qId}_l${c.level}`;
          mem.clues.set(clueId, {
            id: clueId,
            question_id: qId,
            level: c.level,
            clue_text: c.text,
            points: c.points,
          });
        }
      }
    }

    await logEventAction('QUESTIONS_CSV_IMPORTED', req.user?.id, null, { count: 20 });
    res.json({
      success: true,
      message: 'All 20 questions imported and verified atomically!',
      count: 20,
    });
  } catch (err: any) {
    console.error('CSV import error:', err);
    res.status(500).json({ error: err.message || 'Failed to import CSV' });
  }
});

// 4. CSV Export Endpoint: GET /api/admin/questions/export-csv
adminRouter.get('/questions/export-csv', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const qRes = await db.query('SELECT * FROM questions ORDER BY question_number ASC');
    const questions = qRes.rows;

    let csvContent = 'serial number,question,clue 1,clue 2,clue 3,clue 4,answer\n';

    for (const q of questions) {
      const cluesRes = await db.query('SELECT level, clue_text FROM clues WHERE question_id = $1 ORDER BY level ASC', [q.id]);
      const c1 = cluesRes.rows.find(c => c.level === 1)?.clue_text || '';
      const c2 = cluesRes.rows.find(c => c.level === 2)?.clue_text || '';
      const c3 = cluesRes.rows.find(c => c.level === 3)?.clue_text || '';
      const c4 = cluesRes.rows.find(c => c.level === 4)?.clue_text || '';

      const escapeCSV = (val: string) => {
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      };

      csvContent += `${q.question_number},${escapeCSV(q.question_text)},${escapeCSV(c1)},${escapeCSV(c2)},${escapeCSV(c3)},${escapeCSV(c4)},${escapeCSV(q.answer.toUpperCase())}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=clue_quest_20_questions.csv');
    res.send(csvContent);
  } catch (err: any) {
    console.error('CSV Export error:', err);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// 5. Question Management: List All Questions with Clues
adminRouter.get('/questions', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const qRes = await db.query('SELECT * FROM questions ORDER BY question_number ASC');
    const questions = qRes.rows;

    const fullQuestions = await Promise.all(
      questions.map(async q => {
        const cluesRes = await db.query('SELECT * FROM clues WHERE question_id = $1 ORDER BY level ASC', [q.id]);
        return {
          ...q,
          accepted_aliases: Array.isArray(q.accepted_aliases)
            ? q.accepted_aliases
            : (typeof q.accepted_aliases === 'string' ? JSON.parse(q.accepted_aliases) : []),
          clues: cluesRes.rows,
        };
      })
    );

    res.json({ success: true, questions: fullQuestions });
  } catch (err: any) {
    console.error('Questions fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// 6. Create / Edit Question
adminRouter.post('/questions/save', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id, question_number, question_text, answer, accepted_aliases, category, clues } = req.body;

    if (!question_text || !answer || !category) {
      res.status(400).json({ error: 'Question text, answer, and category are required.' });
      return;
    }

    const qId = id || `q_${String(question_number || Date.now()).padStart(2, '0')}`;
    const cleanAliases = Array.isArray(accepted_aliases) ? accepted_aliases.map(a => String(a).toUpperCase()) : [];
    const upperAnswer = String(answer).trim().toUpperCase();

    // Save Question
    const existing = await db.query('SELECT id FROM questions WHERE id = $1', [qId]);
    if (existing.rows.length > 0) {
      await db.query(`
        UPDATE questions
        SET question_text = $1, answer = $2, accepted_aliases = $3, category = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
      `, [question_text, upperAnswer, JSON.stringify(cleanAliases), category, qId]);
    } else {
      await db.query(`
        INSERT INTO questions (id, question_number, question_text, answer, accepted_aliases, category, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [qId, Number(question_number), question_text, upperAnswer, JSON.stringify(cleanAliases), category, true]);
    }

    // Save Clues (Points are fixed: L1=100, L2=75, L3=50, L4=25)
    if (Array.isArray(clues)) {
      const fixedPoints = [100, 75, 50, 25];
      for (let i = 0; i < clues.length; i++) {
        const lvl = i + 1;
        const clueText = clues[i].clue_text || clues[i].text || '';
        const clueId = `clue_${qId}_l${lvl}`;
        await db.query(`
          INSERT INTO clues (id, question_id, level, clue_text, points)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (question_id, level) DO UPDATE SET
            clue_text = EXCLUDED.clue_text
        `, [clueId, qId, lvl, clueText, fixedPoints[i]]);
      }
    }

    await logEventAction('QUESTION_UPDATED', req.user?.id, null, { question_id: qId, number: question_number });
    res.json({ success: true, message: 'Question saved successfully.', question_id: qId });
  } catch (err: any) {
    console.error('Save question error:', err);
    res.status(500).json({ error: err.message || 'Failed to save question' });
  }
});

// 7. Delete Question
adminRouter.delete('/questions/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM questions WHERE id = $1', [id]);
    await logEventAction('QUESTION_DELETED', req.user?.id, null, { question_id: id });
    res.json({ success: true, message: 'Question deleted.' });
  } catch (err: any) {
    console.error('Delete question error:', err);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// 8. Audit Logs
adminRouter.get('/logs', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const logsRes = await db.query('SELECT * FROM event_logs ORDER BY created_at DESC LIMIT 60');
    res.json({ success: true, logs: logsRes.rows });
  } catch (err: any) {
    console.error('Logs fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});
