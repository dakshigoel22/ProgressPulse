import type { CheckIn } from './db';

export function morningPrompt(mood: number, focus: string, recentDays: CheckIn[]): string {
  const moodContext = mood <= 4
    ? `a rough start (mood ${mood}/10)`
    : mood <= 6
    ? `a moderate mood (${mood}/10)`
    : `a good mood (${mood}/10)`;

  const trend = recentDays.length >= 2
    ? ` Recent mood scores: ${recentDays.slice(0, 3).map(c => c.mood_score).join(', ')}.`
    : '';

  return `You are a personal coach giving a brief morning check-in response. The user is starting their day with ${moodContext}. Their focus for today is: "${focus}".${trend}

Write exactly 3 sentences. Be warm but honest — don't fake positivity if their mood is low. Acknowledge their mood authentically, then connect it to their stated focus, and end with one specific actionable encouragement for today.`;
}

export function eveningPrompt(
  completedNames: string[],
  totalNames: string[],
  blockers: string,
  morningFocus: string | null,
): string {
  const completedCount = completedNames.length;
  const totalCount = totalNames.length;
  const focusLine = morningFocus ? ` Their morning focus was: "${morningFocus}".` : '';
  const blockerLine = blockers ? ` They reported this blocker: "${blockers}".` : ' No blockers reported.';

  const completionLine = totalCount === 0
    ? 'No goals were tracked today.'
    : completedCount === totalCount
    ? `They completed all ${totalCount} goals today (${completedNames.join(', ')}).`
    : completedCount === 0
    ? `They completed none of their ${totalCount} goals today.`
    : `They completed ${completedCount} of ${totalCount} goals: ${completedNames.join(', ')}. Incomplete: ${totalNames.filter(n => !completedNames.includes(n)).join(', ')}.`;

  return `You are a personal coach giving a brief evening check-in response.${focusLine} ${completionLine}${blockerLine}

Write exactly 2 sentences. Be honest about the completion rate — don't over-praise partial completion. If there was a blocker, validate it concretely rather than generically.`;
}

export function weeklyPrompt(
  checkins: CheckIn[],
  goalStats: { name: string; completionRate: number }[],
  recurringBlockers: string[],
): string {
  const morningCheckins = checkins.filter(c => c.type === 'morning');
  const eveningCheckins = checkins.filter(c => c.type === 'evening');

  const avgMood = morningCheckins.length > 0
    ? (morningCheckins.reduce((sum, c) => sum + (c.mood_score ?? 0), 0) / morningCheckins.length).toFixed(1)
    : 'N/A';

  const goalSummary = goalStats.length > 0
    ? goalStats.map(g => `${g.name}: ${Math.round(g.completionRate * 100)}%`).join(', ')
    : 'No goals tracked';

  const blockerSummary = recurringBlockers.length > 0
    ? `Recurring blockers: ${recurringBlockers.join('; ')}`
    : 'No recurring blockers';

  const focuses = morningCheckins
    .map(c => c.focus)
    .filter(Boolean)
    .slice(0, 5)
    .join('; ');

  return `You are a personal coach writing a weekly reflection report. Here is the week's data:

- Check-ins: ${morningCheckins.length} morning, ${eveningCheckins.length} evening
- Average morning mood: ${avgMood}/10
- Goal completion rates: ${goalSummary}
- ${blockerSummary}
- Focus themes: ${focuses || 'none recorded'}

Write a weekly reflection in markdown with exactly these 4 sections:
## Week Summary
## What Worked
## Patterns
## One Thing for Next Week

Keep it under 300 words total. Be specific to the data above — avoid generic coaching platitudes. If data is sparse, say so honestly rather than padding.`;
}
