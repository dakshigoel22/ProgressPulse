import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  getCheckinsByDateRange,
  getGoals,
  getWeeklyReport,
  saveWeeklyReport,
} from '@/lib/db';
import { weeklyPrompt } from '@/lib/prompts';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function getMonday(d: Date): string {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const weekStart = request.nextUrl.searchParams.get('week_start');
  if (!weekStart) {
    return Response.json({ error: 'week_start is required' }, { status: 400 });
  }
  const report = getWeeklyReport(weekStart) ?? null;
  return Response.json({ report });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const weekStart: string = (body as { week_start?: string }).week_start ?? getMonday(new Date());
    const weekEnd = addDays(weekStart, 6);

    const checkins = getCheckinsByDateRange(weekStart, weekEnd);
    const allGoals = getGoals();

    const eveningCheckins = checkins.filter(c => c.type === 'evening');
    const eveningCount = eveningCheckins.length;

    const goalStats = allGoals.map(goal => {
      const completions = eveningCheckins.filter(c => {
        if (!c.completed_goal_ids) return false;
        const ids: number[] = JSON.parse(c.completed_goal_ids);
        return ids.includes(goal.id);
      }).length;
      return {
        name: goal.name,
        completionRate: eveningCount > 0 ? completions / eveningCount : 0,
      };
    });

    const blockerCounts = new Map<string, number>();
    for (const c of eveningCheckins) {
      const b = c.blockers?.trim();
      if (b) blockerCounts.set(b, (blockerCounts.get(b) ?? 0) + 1);
    }
    const recurringBlockers = [...blockerCounts.entries()]
      .filter(([, count]) => count >= 2)
      .map(([blocker]) => blocker);

    const prompt = weeklyPrompt(checkins, goalStats, recurringBlockers);

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = msg.content[0].type === 'text' ? msg.content[0].text : '';
    saveWeeklyReport(weekStart, content);

    const report = getWeeklyReport(weekStart);
    return Response.json({ report });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
