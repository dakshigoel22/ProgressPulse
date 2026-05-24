# ProgressPulse — Minimal Implementation Plan

## Context

Build a simple personal daily coaching app as a vehicle for **learning Claude Code** — hooks, MCP servers, slash commands, Claude API patterns. Keep the codebase small and approachable. The app should work, but architecture simplicity > completeness.

**Stack:**
- Next.js 14 (App Router, mobile-responsive)
- SQLite via `better-sqlite3` (local file, no ORM)
- Claude API via Next.js API route
- Tailwind + shadcn/ui (minimal component set)
- Recharts (just the mood chart)

**No auth. No deployment. Runs locally.**

---

## File Structure (lean)

```
ProgressPulse/
├── .env.local                  # ANTHROPIC_API_KEY
├── next.config.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout + bottom nav
│   │   ├── page.tsx             # Home: streak + today status
│   │   ├── checkin/page.tsx     # Morning/evening check-in
│   │   ├── goals/page.tsx       # Goal list + add
│   │   ├── mood/page.tsx        # 30-day chart
│   │   ├── report/page.tsx      # Weekly reflection
│   │   └── api/
│   │       ├── checkin/route.ts # Save check-in + call Claude
│   │       ├── goals/route.ts   # CRUD goals
│   │       └── report/route.ts  # Generate weekly report
│   ├── components/
│   │   ├── BottomNav.tsx
│   │   └── ui/                  # shadcn components
│   └── lib/
│       ├── db.ts                # SQLite singleton + all queries
│       └── prompts.ts           # Claude prompt builders
```

---

## Database (`src/lib/db.ts`)

Single file. Use `better-sqlite3` synchronously — no async complexity.

```typescript
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'data.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS check_ins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    type TEXT NOT NULL,        -- 'morning' | 'evening'
    mood_score INTEGER,        -- morning only
    focus TEXT,                -- morning only
    ai_response TEXT,
    completed_goal_ids TEXT,   -- JSON array, evening only
    blockers TEXT,             -- evening only
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

export default db;
```

Export plain query functions from the same file:
- `getCheckinByDate(date, type)` — single check-in lookup
- `saveCheckin(data)` — insert
- `updateCheckinAiResponse(id, text)` — patch ai_response after Claude responds
- `getGoals()` — active goals
- `addGoal(name)` / `deleteGoal(id)`
- `getMoodHistory(days)` — last N morning check-ins
- `getStreak()` — count consecutive days with evening check-ins backwards from yesterday
- `getWeeklyReport(weekStart)` / `saveWeeklyReport(weekStart, content)`

---

## API Routes (all in `src/app/api/`)

### `checkin/route.ts` — POST
- Receive `{ date, type, mood_score?, focus?, completed_goal_ids?, blockers? }`
- Save to SQLite immediately
- Build prompt via `prompts.ts`, call Claude (`claude-sonnet-4-6`, max_tokens 256)
- Update record with `ai_response`
- Return the full check-in record

### `goals/route.ts` — GET + POST + DELETE
- GET: return `getGoals()`
- POST: `addGoal(name)`
- DELETE: `deleteGoal(id)`

### `report/route.ts` — GET + POST
- GET: return report for given `week_start`
- POST: collect last 7 days of check-ins + goal completions, call Claude (max_tokens 1024), save and return

---

## Pages (minimal)

**Home (`page.tsx`):** Server component. Reads today's check-ins + streak from SQLite. Shows morning/evening done badges + streak count + today's focus.

**Check-in (`checkin/page.tsx`):** Client component. Step-by-step card flow. Calls `POST /api/checkin`. Shows Claude's response at the end. Guards against duplicate check-ins (shows saved response if already done).

**Goals (`goals/page.tsx`):** Client component. Fetches goals, shows list with add form + delete button. Weekly completion per goal: count evening check-ins where `completed_goal_ids` includes goal id over last 7 days.

**Mood (`mood/page.tsx`):** Server component. Passes last 30 morning check-ins to `<MoodChart>` (client component with Recharts).

**Report (`report/page.tsx`):** Server component. Shows current week's report or a "Generate" button (calls `POST /api/report`). Lists past reports.

---

## Claude Prompts (`src/lib/prompts.ts`)

Three functions — keep them short:

**`morningPrompt(mood, focus, recentDays)`** — 3-sentence warm response. Acknowledge mood honestly (no fake positivity on low scores). Reference the stated focus.

**`eveningPrompt(completedNames, totalNames, blockers, morningFocus)`** — 2-sentence response. Validate blockers; honest on completions.

**`weeklyPrompt(checkins, goalStats, recurringBlockers)`** — 4-section markdown: week summary, what worked, patterns, one thing for next week. Under 300 words. Data-specific, not generic.

---

## Claude Code Learning Touchpoints

Structure the build to practice these:

| Feature | Where to use |
|---|---|
| **Hooks** | Post-save hook to log check-ins to a file; pre-commit hook for lint |
| **MCP servers** | Use filesystem MCP to read `data.db` export; try Notion/Obsidian MCP for weekly report export |
| **Slash commands** | `/checkin` to trigger check-in from terminal; `/report` to generate weekly summary |
| **Claude API** | All three prompt types in `prompts.ts` — practice prompt engineering |
| **Sessions** | Use `CLAUDE.md` to persist app context between sessions |

Add a `CLAUDE.md` at the repo root with project context so Claude Code remembers the stack between sessions.

---

## Build Order

1. **Setup**: `create-next-app`, install `better-sqlite3 @anthropic-ai/sdk`, add shadcn `button card input badge`
2. **DB layer**: Write `src/lib/db.ts` with schema + all query functions
3. **API routes**: `checkin`, `goals`, `report` — test with curl
4. **Home + Nav**: Static layout, streak, today's status
5. **Check-in flow**: Card steps → POST to API → show Claude response
6. **Goals page**: List + add/delete
7. **Mood chart**: Recharts line chart from `/api/mood` data
8. **Report page**: Generate + display weekly reflection
9. **CLAUDE.md + Hooks**: Add project memory file and Claude Code hooks

---

## Verification

- `curl -X POST localhost:3000/api/checkin -d '{"date":"2026-05-23","type":"morning","mood_score":7,"focus":"Learn Claude Code"}'` returns Claude response
- SQLite file `data.db` exists and has 3 tables after first run
- Check-in page shows "Already done" guard if visited twice on same day
- Report page generates markdown on Sunday (or via manual POST)
