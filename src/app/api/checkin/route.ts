import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  getCheckinByDate,
  saveCheckin,
  updateCheckinAiResponse,
  getMoodHistory,
  getGoals,
} from '@/lib/db';
import { morningPrompt, eveningPrompt } from '@/lib/prompts';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') ?? '';
  const type = (searchParams.get('type') ?? 'morning') as 'morning' | 'evening';
  const checkin = getCheckinByDate(date, type);
  return Response.json({ checkin: checkin ?? null });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, type, mood_score, focus, completed_goal_ids, blockers } = body as {
      date: string;
      type: 'morning' | 'evening';
      mood_score?: number;
      focus?: string;
      completed_goal_ids?: number[];
      blockers?: string;
    };

    const existing = getCheckinByDate(date, type);
    if (existing) {
      return Response.json({ checkin: existing });
    }

    const id = saveCheckin({
      date,
      type,
      mood_score: mood_score ?? null,
      focus: focus ?? null,
      ai_response: null,
      completed_goal_ids: completed_goal_ids ? JSON.stringify(completed_goal_ids) : null,
      blockers: blockers ?? null,
      created_at: Date.now(),
    });

    let prompt: string;

    if (type === 'morning') {
      const recentDays = getMoodHistory(7).slice(1);
      prompt = morningPrompt(mood_score ?? 5, focus ?? '', recentDays);
    } else {
      const morningCheckin = getCheckinByDate(date, 'morning');
      const allGoals = getGoals();
      const completedIds: number[] = completed_goal_ids ?? [];
      const completedNames = allGoals
        .filter(g => completedIds.includes(g.id))
        .map(g => g.name);
      const totalNames = allGoals.map(g => g.name);
      prompt = eveningPrompt(completedNames, totalNames, blockers ?? '', morningCheckin?.focus ?? null);
    }

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const aiText = msg.content[0].type === 'text' ? msg.content[0].text : '';
    updateCheckinAiResponse(id, aiText);

    const checkin = getCheckinByDate(date, type);
    return Response.json({ checkin });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
