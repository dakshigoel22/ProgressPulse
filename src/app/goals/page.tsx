'use client';

import { useEffect, useState } from 'react';
import { Trash2, Plus } from 'lucide-react';

interface Goal {
  id: number;
  name: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/goals')
      .then(r => r.json())
      .then(d => setGoals(d.goals ?? []));
  }, []);

  async function addGoal() {
    if (!input.trim()) return;
    setLoading(true);
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: input.trim() }),
    });
    const data = await res.json();
    setGoals(data.goals ?? []);
    setInput('');
    setLoading(false);
  }

  async function deleteGoal(id: number) {
    const res = await fetch(`/api/goals?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    setGoals(data.goals ?? []);
  }

  return (
    <div className="px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Goals</h1>

      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addGoal()}
          placeholder="Add a goal..."
          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <button
          onClick={addGoal}
          disabled={!input.trim() || loading}
          className="flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {goals.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-12">No goals yet. Add one above.</p>
      ) : (
        <ul className="space-y-2">
          {goals.map(g => (
            <li key={g.id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
              <span className="text-sm text-gray-800">{g.name}</span>
              <button
                onClick={() => deleteGoal(g.id)}
                className="text-gray-400 transition hover:text-red-500"
                aria-label="Delete goal"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
