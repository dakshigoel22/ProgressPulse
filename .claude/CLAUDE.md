# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

ProgressPulse is a minimal personal daily coaching web app built primarily as a **Claude Code learning project** — hooks, MCP servers, slash commands, and Claude API patterns. Keep changes simple and the codebase small.

## Commands

```bash
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build
npm run lint         # ESLint
```

The SQLite database (`data.db`) is created automatically at the project root on first server start. To inspect it: `sqlite3 data.db ".tables"` or `sqlite3 data.db "SELECT * FROM check_ins;"`.

To test API routes directly:
```bash
curl -X POST localhost:3000/api/checkin \
  -H 'Content-Type: application/json' \
  -d '{"date":"2026-05-23","type":"morning","mood_score":7,"focus":"Test focus"}'
```

## Architecture

**Stack:** Next.js 14 App Router · SQLite (`better-sqlite3`, synchronous) · Groq(llama-3.3-70b-versatile) · Tailwind + shadcn/ui · Recharts

**No auth. Runs locally only. No ORM.**

### Data flow

All data lives in `data.db` (SQLite, 3 tables: `check_ins`, `goals`, `weekly_reports`). The single source of truth for all queries is `src/lib/db.ts` — it exports named functions (`getCheckinByDate`, `saveCheckin`, `getGoals`, `getStreak`, etc.). Nothing else imports from `better-sqlite3` directly.

### AI calls

All LLM API calls route through `src/app/api/` — never from the browser. The API key stays server-side. `src/lib/prompts.ts` contains the three prompt builders (`morningPrompt`, `eveningPrompt`, `weeklyPrompt`); the route handlers call these then call Anthropic SDK.

### Server vs client components

- Home, Mood, Report pages are **Server Components** — they call `src/lib/db.ts` directly (no fetch needed).
- Check-in and Goals pages are **Client Components** (`"use client"`) — they POST/GET from the API routes.

### Check-in duplicate guard

`POST /api/checkin` checks for an existing record with the same `date` + `type` before inserting. The check-in page also checks on load and shows the stored AI response if already done.

### Weekly report generation

Report is generated on demand via `POST /api/report`. The route reads the last 7 days of check-ins and goal completion rates from SQLite, builds the weekly prompt, calls Claude, and saves to `weekly_reports`. User presses "Generate" on the Report page.

## Claude Code features used in this project

| Feature | Location |
|---|---|
| **Hooks** | `.claude/settings.json` — post-tool-use hook logs check-in saves; pre-commit hook runs lint |
| **MCP servers** | Configured in `.claude/settings.json` — filesystem MCP for inspecting `data.db` |
| **Plan** | `.claude/plan.md` — full build plan, consult before adding features |
| **Memory** | `.claude/agent-memory/` — session memory for Claude Code agents |
| **Slash commands** | Configured in `.claude/settings.json` — `/report` to generate weekly report, `/checkin` to generate check-in report |
| **Tools** | Configured in `.claude/settings.json` — SQLite MCP server for database queries |

## Key constraints
- `better-sqlite3` is synchronous — do not wrap its calls in `async/await`.
- `src/lib/db.ts` must only be imported in Server Components or API routes (never in `"use client"` files).
- `data.db` is gitignored (local data only).
