import { db } from '../db/client.js';

export async function logEventAction(
  action: string,
  userId?: string | null,
  eventId?: string | null,
  metadata: Record<string, any> = {}
) {
  try {
    const id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    await db.query(`
      INSERT INTO event_logs (id, event_id, user_id, action, metadata)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, eventId || null, userId || null, action, JSON.stringify(metadata)]);
  } catch (err) {
    console.error('Audit log failure:', err);
  }
}
