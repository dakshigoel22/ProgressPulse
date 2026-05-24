'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

type CheckinType = 'morning' | 'evening';

interface Goal {
  id: number;
  name: string;
}

interface SavedCheckin {
  ai_response: string | null;
  focus?: string | null;
}

function CheckinFlow() {
  const params = useSearchParams();
  const typeParam = params.get('type');
  const type: CheckinType = typeParam === 'evening' ? 'evening' : 'morning';

  const [step, setStep] = useState(0);
  const [mood, setMood] = useState(5);
  const [focus, setFocus] = useState('');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [blockers, setBlockers] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [alreadyDone, setAlreadyDone] = useState<SavedCheckin | null>(null);

  const date = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    // Check if already done
    fetch(`/api/checkin?date=${date}&type=${type}`)
      .then(r => r.json())
      .then(data => {
        if (data.checkin) setAlreadyDone(data.checkin);
      })
      .catch(() => {});

    if (type === 'evening') {
      fetch('/api/goals')
        .then(r => r.json())
        .then(data => setGoals(data.goals ?? []));
    }
  }, [date, type]);

  async function submit() {
    setLoading(true);
    const body: Record<string, unknown> = { date, type };
    if (type === 'morning') {
      body.mood_score = mood;
      body.focus = focus;
    } else {
      body.completed_goal_ids = JSON.stringify(completedIds);
      body.blockers = blockers;
    }

    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setResult(data.checkin?.ai_response ?? 'Saved!');
    setLoading(false);
  }

  if (alreadyDone) {
    return (
      <div className="px-4 py-8">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">{type === 'morning' ? 'Morning' : 'Evening'} Check-in</h1>
        <p className="mb-6 text-sm text-green-600 font-medium">Already completed today</p>
        {alreadyDone.focus && (
          <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Today&apos;s focus</p>
            <p className="mt-1 text-gray-800">{alreadyDone.focus}</p>
          </div>
        )}
        {alreadyDone.ai_response && (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400">Coaching response</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">{alreadyDone.ai_response}</p>
          </div>
        )}
      </div>
    );
  }

  if (result) {
    return (
      <div className="px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Done!</h1>
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400">Your coaching</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">{result}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        {type === 'morning' ? 'Morning' : 'Evening'} Check-in
      </h1>

      {type === 'morning' ? (
        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              How&apos;s your mood? <span className="text-indigo-600">{mood}/10</span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={mood}
              onChange={e => setMood(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-400">
              <span>Rough</span><span>Great</span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">What&apos;s your main focus today?</label>
            <textarea
              value={focus}
              onChange={e => setFocus(e.target.value)}
              rows={3}
              placeholder="e.g. Finish the project proposal"
              className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <button
            onClick={submit}
            disabled={!focus.trim() || loading}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Getting coaching...' : 'Submit'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {goals.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Which goals did you work on?</label>
              <div className="space-y-2">
                {goals.map(g => (
                  <label key={g.id} className="flex cursor-pointer items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
                    <input
                      type="checkbox"
                      checked={completedIds.includes(g.id)}
                      onChange={e => setCompletedIds(prev =>
                        e.target.checked ? [...prev, g.id] : prev.filter(id => id !== g.id)
                      )}
                      className="h-4 w-4 accent-indigo-600"
                    />
                    <span className="text-sm text-gray-800">{g.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Any blockers or reflections?</label>
            <textarea
              value={blockers}
              onChange={e => setBlockers(e.target.value)}
              rows={3}
              placeholder="What got in the way? What did you learn?"
              className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <button
            onClick={submit}
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Getting coaching...' : 'Submit'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function CheckinPage() {
  return (
    <Suspense fallback={<div className="px-4 py-8 text-gray-500">Loading...</div>}>
      <CheckinFlow />
    </Suspense>
  );
}
