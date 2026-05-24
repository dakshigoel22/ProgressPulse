import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'data.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS check_ins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    type TEXT NOT NULL,
    mood_score INTEGER,
    focus TEXT,
    ai_response TEXT,
    completed_goal_ids TEXT,
    blockers TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS weekly_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_start TEXT NOT NULL,
    content TEXT NOT NULL,
    generated_at INTEGER NOT NULL
  );
`);

// ── Types ──────────────────────────────────────────────────────────────────

export interface CheckIn {
  id: number;
  date: string;
  type: 'morning' | 'evening';
  mood_score: number | null;
  focus: string | null;
  ai_response: string | null;
  completed_goal_ids: string | null; // JSON array string
  blockers: string | null;
  created_at: number;
}

export interface Goal {
  id: number;
  name: string;
  active: number;
  created_at: number;
}

export interface WeeklyReport {
  id: number;
  week_start: string;
  content: string;
  generated_at: number;
}

// ── Check-in queries ───────────────────────────────────────────────────────

export function getCheckinByDate(date: string, type: 'morning' | 'evening'): CheckIn | undefined {
  return db.prepare('SELECT * FROM check_ins WHERE date = ? AND type = ?').get(date, type) as CheckIn | undefined;
}

export function saveCheckin(data: Omit<CheckIn, 'id'>): number {
  const result = db.prepare(`
    INSERT INTO check_ins (date, type, mood_score, focus, ai_response, completed_goal_ids, blockers, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.date,
    data.type,
    data.mood_score ?? null,
    data.focus ?? null,
    data.ai_response ?? null,
    data.completed_goal_ids ?? null,
    data.blockers ?? null,
    data.created_at,
  );
  return result.lastInsertRowid as number;
}

export function updateCheckinAiResponse(id: number, text: string): void {
  db.prepare('UPDATE check_ins SET ai_response = ? WHERE id = ?').run(text, id);
}

export function getCheckinsByDateRange(startDate: string, endDate: string): CheckIn[] {
  return db.prepare(
    'SELECT * FROM check_ins WHERE date >= ? AND date <= ? ORDER BY date ASC'
  ).all(startDate, endDate) as CheckIn[];
}

// ── Goal queries ───────────────────────────────────────────────────────────

export function getGoals(): Goal[] {
  return db.prepare('SELECT * FROM goals WHERE active = 1 ORDER BY created_at ASC').all() as Goal[];
}

export function addGoal(name: string): number {
  const result = db.prepare(
    'INSERT INTO goals (name, active, created_at) VALUES (?, 1, ?)'
  ).run(name, Date.now());
  return result.lastInsertRowid as number;
}

export function deleteGoal(id: number): void {
  db.prepare('UPDATE goals SET active = 0 WHERE id = ?').run(id);
}

// ── Mood history ───────────────────────────────────────────────────────────

export function getMoodHistory(days: number): CheckIn[] {
  return db.prepare(`
    SELECT * FROM check_ins
    WHERE type = 'morning' AND mood_score IS NOT NULL
    ORDER BY date DESC
    LIMIT ?
  `).all(days) as CheckIn[];
}

// ── Streak ─────────────────────────────────────────────────────────────────

export function getStreak(): number {
  const rows = db.prepare(
    "SELECT DISTINCT date FROM check_ins WHERE type = 'evening' ORDER BY date DESC"
  ).all() as { date: string }[];

  if (rows.length === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - 1); // start from yesterday

  for (const row of rows) {
    const expected = cursor.toISOString().slice(0, 10);
    if (row.date === expected) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// ── Weekly report ──────────────────────────────────────────────────────────

export function getWeeklyReport(weekStart: string): WeeklyReport | undefined {
  return db.prepare(
    'SELECT * FROM weekly_reports WHERE week_start = ?'
  ).get(weekStart) as WeeklyReport | undefined;
}

export function saveWeeklyReport(weekStart: string, content: string): void {
  db.prepare(`
    INSERT INTO weekly_reports (week_start, content, generated_at)
    VALUES (?, ?, ?)
  `).run(weekStart, content, Date.now());
}

export function getAllWeeklyReports(): WeeklyReport[] {
  return db.prepare(
    'SELECT * FROM weekly_reports ORDER BY week_start DESC'
  ).all() as WeeklyReport[];
}

export default db;
