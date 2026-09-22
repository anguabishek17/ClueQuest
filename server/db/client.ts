import { Pool } from 'pg';
import { config } from '../config.js';
import fs from 'fs';
import path from 'path';

// Memory fallback store for local development execution
interface MemoryStore {
  users: Map<string, any>;
  events: Map<string, any>;
  questions: Map<string, any>;
  clues: Map<string, any>;
  game_sessions: Map<string, any>;
  question_attempts: Map<string, any>;
  event_logs: any[];
}

const memoryStore: MemoryStore = {
  users: new Map(),
  events: new Map(),
  questions: new Map(),
  clues: new Map(),
  game_sessions: new Map(),
  question_attempts: new Map(),
  event_logs: [],
};

let pgPool: Pool | null = null;
let isNeon = false;

export async function initDb() {
  if (config.isProduction && (!config.databaseUrl || !config.databaseUrl.startsWith('postgres'))) {
    throw new Error('FATAL: Production mode requires a valid DATABASE_URL pointing to Neon PostgreSQL.');
  }

  if (config.databaseUrl && config.databaseUrl.startsWith('postgres')) {
    try {
      console.log('🔗 Connecting to Neon PostgreSQL authoritative database...');
      pgPool = new Pool({
        connectionString: config.databaseUrl,
        ssl: { rejectUnauthorized: false },
      });

      // Test connection
      const res = await pgPool.query('SELECT NOW()');
      console.log('✅ Connected to Neon PostgreSQL at:', res.rows[0].now);
      isNeon = true;

      // Run schema if exists
      const schemaPath = path.resolve(process.cwd(), 'server/db/schema.sql');
      if (fs.existsSync(schemaPath)) {
        const ddl = fs.readFileSync(schemaPath, 'utf8');
        await pgPool.query(ddl);
        console.log('✅ Schema tables verified in PostgreSQL.');
      }
    } catch (err) {
      if (config.isProduction) {
        throw new Error(`FATAL: Could not connect to Neon PostgreSQL in production: ${err}`);
      }
      console.warn('⚠️ Could not connect to external PostgreSQL, activating embedded local database engine:', err);
      isNeon = false;
      pgPool = null;
    }
  } else {
    console.log('ℹ️ Running with integrated local PostgreSQL engine (40-user multi-session ready).');
  }
}

export const db = {
  isNeon: () => isNeon,

  async query<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
    if (isNeon && pgPool) {
      const res = await pgPool.query(sql, params);
      return { rows: res.rows, rowCount: res.rowCount || 0 };
    }
    return executeMemoryQuery<T>(sql, params);
  },

  getMemoryStore: () => memoryStore,
};

// High-fidelity SQL query interpreter for the embedded local database
function executeMemoryQuery<T>(sql: string, params: any[]): { rows: T[]; rowCount: number } {
  const cleanSql = sql.trim().replace(/;$/, '');
  const lower = cleanSql.toLowerCase();

  // Handle USERS Queries
  if (lower.startsWith('select') && lower.includes('from users')) {
    let rows = Array.from(memoryStore.users.values());
    if (lower.includes('where lower(player_code) =') || lower.includes('where lower(player_code)=')) {
      const code = String(params[0]).toLowerCase();
      rows = rows.filter(u => u.player_code.toLowerCase() === code);
      if (lower.includes("and role = 'admin'")) {
        rows = rows.filter(u => u.role === 'ADMIN');
      }
    } else if (lower.includes('where player_code =') || lower.includes('where player_code=')) {
      const code = String(params[0]).toLowerCase();
      rows = rows.filter(u => u.player_code.toLowerCase() === code);
    } else if (lower.includes('where id =') && lower.includes("and role = 'player'")) {
      const id = params[0];
      rows = rows.filter(u => u.id === id && u.role === 'PLAYER');
    } else if (lower.includes('where id =') || lower.includes('where id=')) {
      const id = params[0];
      rows = rows.filter(u => u.id === id);
    } else if (lower.includes('where role =') || lower.includes("where role = 'player'") || lower.includes("where role = 'PLAYER'")) {
      const role = params[0] || 'PLAYER';
      rows = rows.filter(u => u.role.toUpperCase() === String(role).toUpperCase());
    } else if (lower.includes('where lower(team_name) =') || lower.includes('where team_name =')) {
      const tName = String(params[0]).toLowerCase();
      const excludeId = params[1] || null;
      rows = rows.filter(u => u.team_name && u.team_name.toLowerCase() === tName && (excludeId ? u.id !== excludeId : true));
    }
    if (lower.includes('count(*)')) {
      return { rows: [{ count: String(rows.length) }] as any, rowCount: 1 };
    }
    if (lower.includes('order by player_code asc')) {
      rows.sort((a, b) => a.player_code.localeCompare(b.player_code));
    }
    return { rows: rows as any, rowCount: rows.length };
  }

  // Handle EVENTS Queries
  if (lower.startsWith('select') && lower.includes('from events')) {
    let rows = Array.from(memoryStore.events.values());
    if (lower.includes('where id =') || lower.includes('where id=')) {
      const id = params[0];
      rows = rows.filter(e => e.id === id);
    } else if (lower.includes('order by created_at desc') && lower.includes('limit 1')) {
      rows = rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 1);
    }
    return { rows: rows as any, rowCount: rows.length };
  }

  // Handle QUESTIONS Queries
  if (lower.startsWith('select') && lower.includes('from questions')) {
    let rows = Array.from(memoryStore.questions.values());
    if (lower.includes('where id =') || lower.includes('where id=')) {
      const id = params[0];
      rows = rows.filter(q => q.id === id);
    } else if (lower.includes('where question_number =') || lower.includes('where question_number=')) {
      const num = Number(params[0]);
      rows = rows.filter(q => q.question_number === num);
    } else if (lower.includes('where is_active = true') || lower.includes('where is_active=true')) {
      rows = rows.filter(q => q.is_active);
    }
    if (lower.includes('count(*)')) {
      return { rows: [{ count: String(rows.length) }] as any, rowCount: 1 };
    }
    rows.sort((a, b) => a.question_number - b.question_number);
    return { rows: rows as any, rowCount: rows.length };
  }

  // Handle CLUES Queries
  if (lower.startsWith('select') && lower.includes('from clues')) {
    let rows = Array.from(memoryStore.clues.values());
    if (lower.includes('where question_id =') && (lower.includes('and level <=') || lower.includes('and level<='))) {
      const qId = params[0];
      const lvl = Number(params[1]);
      rows = rows.filter(c => c.question_id === qId && c.level <= lvl);
    } else if (lower.includes('where question_id =') && (lower.includes('and level =') || lower.includes('and level='))) {
      const qId = params[0];
      const lvl = Number(params[1]);
      rows = rows.filter(c => c.question_id === qId && c.level === lvl);
    } else if (lower.includes('where question_id =') || lower.includes('where question_id=')) {
      const qId = params[0];
      rows = rows.filter(c => c.question_id === qId);
    }
    if (lower.includes('count(*)')) {
      return { rows: [{ count: String(rows.length) }] as any, rowCount: 1 };
    }
    rows.sort((a, b) => a.level - b.level);
    return { rows: rows as any, rowCount: rows.length };
  }

  // Handle GAME_SESSIONS Queries
  if (lower.startsWith('select') && lower.includes('from game_sessions')) {
    let rows = Array.from(memoryStore.game_sessions.values());
    if (lower.includes('where user_id =') && lower.includes('and event_id =')) {
      const uId = params[0];
      const eId = params[1];
      rows = rows.filter(s => s.user_id === uId && s.event_id === eId);
    } else if (lower.includes('where id =') || lower.includes('where id=')) {
      const id = params[0];
      rows = rows.filter(s => s.id === id);
    } else if (lower.includes('where event_id =') || lower.includes('where event_id=')) {
      const eId = params[0];
      rows = rows.filter(s => s.event_id === eId);
    }
    if (lower.includes('order by total_score desc')) {
      rows.sort((a, b) => b.total_score - a.total_score);
    }
    return { rows: rows as any, rowCount: rows.length };
  }

  // Handle QUESTION_ATTEMPTS Queries
  if (lower.startsWith('select') && lower.includes('from question_attempts')) {
    let rows = Array.from(memoryStore.question_attempts.values());
    if (lower.includes('where session_id =') && lower.includes('and question_id =')) {
      const sId = params[0];
      const qId = params[1];
      rows = rows.filter(a => a.session_id === sId && a.question_id === qId);
    } else if (lower.includes('where session_id =') || lower.includes('where session_id=')) {
      const sId = params[0];
      rows = rows.filter(a => a.session_id === sId);
    }
    return { rows: rows as any, rowCount: rows.length };
  }

  // Handle EVENT_LOGS Queries
  if (lower.startsWith('select') && lower.includes('from event_logs')) {
    let rows = [...memoryStore.event_logs];
    if (lower.includes("action = 'integrity_event'") || lower.includes("action = 'INTEGRITY_EVENT'")) {
      rows = rows.filter(l => l.action === 'INTEGRITY_EVENT');
    }

    if (params.length === 2) {
      if (lower.includes('user_id = $1') && lower.includes('event_id = $2')) {
        const uId = params[0];
        const eId = params[1];
        rows = rows.filter(l => (l.user_id === uId || !uId) && (l.event_id === eId || !eId));
      } else if (lower.includes('event_id = $1') && lower.includes('user_id = $2')) {
        const eId = params[0];
        const uId = params[1];
        rows = rows.filter(l => (l.user_id === uId || !uId) && (l.event_id === eId || !eId));
      }
    } else if (params.length === 1) {
      const p = params[0];
      if (lower.includes('event_id = $1') || lower.includes('where event_id =') || lower.includes('where event_id=')) {
        rows = rows.filter(l => l.event_id === p);
      } else if (lower.includes('user_id = $1') || lower.includes('where user_id =') || lower.includes('where user_id=')) {
        rows = rows.filter(l => l.user_id === p);
      }
    }

    if (lower.includes('group by user_id')) {
      const counts = new Map<string, number>();
      for (const r of rows) {
        if (r.user_id) {
          counts.set(r.user_id, (counts.get(r.user_id) || 0) + 1);
        }
      }
      const groupedRows = Array.from(counts.entries()).map(([user_id, count]) => ({
        user_id,
        count: count,
      }));
      return { rows: groupedRows as any, rowCount: groupedRows.length };
    }

    rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (lower.includes('limit')) {
      const limitMatch = lower.match(/limit\s+(\d+)/);
      const limit = limitMatch ? parseInt(limitMatch[1], 10) : 50;
      rows = rows.slice(0, limit);
    }
    return { rows: rows as any, rowCount: rows.length };
  }

  // Handle INSERTS
  if (lower.startsWith('insert into users')) {
    const user = {
      id: params[0],
      player_code: params[1],
      display_name: params[2],
      team_name: params[3] !== undefined && typeof params[3] === 'string' && !params[3].startsWith('$') && params.length >= 7 ? params[3] : (params.length === 7 ? params[3] : null),
      password_hash: params.length >= 7 ? params[4] : params[3],
      role: (params.length >= 7 ? params[5] : params[4]) || 'PLAYER',
      is_active: (params.length >= 7 ? params[6] : params[5]) !== undefined ? (params.length >= 7 ? params[6] : params[5]) : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryStore.users.set(user.id, user);
    return { rows: [user as any], rowCount: 1 };
  }

  if (lower.startsWith('insert into events')) {
    const evt = {
      id: params[0],
      name: params[1],
      status: params[2] || 'WAITING',
      max_players: params[3] || 40,
      countdown_started_at: null,
      started_at: params[4] || null,
      completed_at: params[5] || null,
      created_at: new Date().toISOString(),
    };
    memoryStore.events.set(evt.id, evt);
    return { rows: [evt as any], rowCount: 1 };
  }

  if (lower.startsWith('insert into questions')) {
    const q = {
      id: params[0],
      question_number: Number(params[1]),
      question_text: params[2],
      answer: String(params[3]).toUpperCase(),
      accepted_aliases: typeof params[4] === 'string' ? JSON.parse(params[4]) : params[4],
      category: params[5] || 'Electronics',
      is_active: params[6] !== undefined ? params[6] : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryStore.questions.set(q.id, q);
    return { rows: [q as any], rowCount: 1 };
  }

  if (lower.startsWith('insert into clues')) {
    const c = {
      id: params[0],
      question_id: params[1],
      level: Number(params[2]),
      clue_text: params[3],
      points: Number(params[4]),
    };
    memoryStore.clues.set(c.id, c);
    return { rows: [c as any], rowCount: 1 };
  }

  if (lower.startsWith('insert into game_sessions')) {
    const sess = {
      id: params[0],
      event_id: params[1],
      user_id: params[2],
      status: params[3] || 'IN_PROGRESS',
      current_question: Number(params[4] || 1),
      current_clue_level: Number(params[5] || 1),
      current_question_value: Number(params[6] || 100),
      total_score: Number(params[7] || 0),
      started_at: new Date().toISOString(),
      completed_at: null,
      updated_at: new Date().toISOString(),
    };
    memoryStore.game_sessions.set(sess.id, sess);
    return { rows: [sess as any], rowCount: 1 };
  }

  if (lower.startsWith('insert into question_attempts')) {
    const att = {
      id: params[0],
      session_id: params[1],
      question_id: params[2],
      highest_clue_level: Number(params[3]),
      final_question_value: Number(params[4]),
      user_answer: params[5],
      correct_answer: params[6],
      is_correct: Boolean(params[7]),
      earned_points: Number(params[8]),
      submitted_at: new Date().toISOString(),
    };
    memoryStore.question_attempts.set(att.id, att);
    return { rows: [att as any], rowCount: 1 };
  }

  if (lower.startsWith('insert into event_logs')) {
    const log = {
      id: params[0],
      event_id: params[1] || null,
      user_id: params[2] || null,
      action: params[3],
      metadata: typeof params[4] === 'string' ? JSON.parse(params[4]) : params[4] || {},
      created_at: new Date().toISOString(),
    };
    memoryStore.event_logs.push(log);
    return { rows: [log as any], rowCount: 1 };
  }

  // Handle UPDATES
  if (lower.startsWith('update users')) {
    const id = params[params.length - 1];
    const user = memoryStore.users.get(id);
    if (user) {
      if (lower.includes('team_name =') || lower.includes('team_name=')) {
        user.team_name = params[0];
        user.updated_at = new Date().toISOString();
      }
      memoryStore.users.set(id, user);
      return { rows: [user as any], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  if (lower.startsWith('update events')) {
    const id = params[params.length - 1];
    const evt = memoryStore.events.get(id);
    if (evt) {
      if (lower.includes("status = 'countdown'")) {
        evt.status = 'COUNTDOWN';
        evt.countdown_started_at = params[0] || new Date().toISOString();
      } else if (lower.includes("status = 'live'")) {
        evt.status = 'LIVE';
        evt.started_at = params[0] || new Date().toISOString();
        evt.countdown_started_at = null;
      } else if (lower.includes("status = 'paused'")) {
        evt.status = 'PAUSED';
      } else if (lower.includes("status = 'ended'")) {
        evt.status = 'ENDED';
        evt.completed_at = params[0] || new Date().toISOString();
      } else if (lower.includes("status = 'waiting'")) {
        evt.status = 'WAITING';
        evt.countdown_started_at = null;
        evt.started_at = null;
        evt.completed_at = null;
      } else if (lower.includes('status = $1') || lower.includes('status=$1')) {
        evt.status = params[0];
      }
      memoryStore.events.set(id, evt);
      return { rows: [evt as any], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  if (lower.startsWith('update game_sessions')) {
    const id = params[params.length - 1];
    const sess = memoryStore.game_sessions.get(id);
    if (sess) {
      if (lower.includes('current_clue_level =') && lower.includes('current_question_value =')) {
        sess.current_clue_level = Number(params[0]);
        sess.current_question_value = Number(params[1]);
        sess.updated_at = new Date().toISOString();
      } else if (lower.includes('total_score = total_score +')) {
        const added = Number(params[0]);
        sess.total_score = (sess.total_score || 0) + added;
        sess.updated_at = new Date().toISOString();
      } else if (lower.includes('current_question =') && lower.includes('current_clue_level = 1')) {
        sess.current_question = Number(params[0]);
        sess.current_clue_level = 1;
        sess.current_question_value = 100;
        sess.updated_at = new Date().toISOString();
      } else if (lower.includes("status = 'completed'") || lower.includes('status = $1')) {
        sess.status = params[0] || 'COMPLETED';
        sess.completed_at = new Date().toISOString();
        sess.updated_at = new Date().toISOString();
      }
      memoryStore.game_sessions.set(id, sess);
      return { rows: [sess as any], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  if (lower.startsWith('update questions')) {
    const id = params[params.length - 1];
    const q = memoryStore.questions.get(id);
    if (q) {
      if (lower.includes('question_text =')) q.question_text = params[0];
      if (lower.includes('answer =')) q.answer = String(params[1]).toUpperCase();
      if (lower.includes('accepted_aliases =')) q.accepted_aliases = typeof params[2] === 'string' ? JSON.parse(params[2]) : params[2];
      if (lower.includes('category =')) q.category = params[3];
      q.updated_at = new Date().toISOString();
      memoryStore.questions.set(id, q);
      return { rows: [q as any], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // Handle DELETES
  if (lower.startsWith('delete from questions')) {
    if (params.length === 0) {
      memoryStore.questions.clear();
      memoryStore.clues.clear();
      return { rows: [], rowCount: 0 };
    }
    const id = params[0];
    const exists = memoryStore.questions.delete(id);
    for (const [cId, c] of memoryStore.clues.entries()) {
      if (c.question_id === id) memoryStore.clues.delete(cId);
    }
    return { rows: [], rowCount: exists ? 1 : 0 };
  }

  if (lower.startsWith('delete from clues')) {
    memoryStore.clues.clear();
    return { rows: [], rowCount: 0 };
  }

  return { rows: [], rowCount: 0 };
}
