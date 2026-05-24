'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

export default function GenerateReport({ weekStart }: { weekStart: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function generate() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week_start: weekStart }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json();
      setError(d.error ?? 'Failed to generate report');
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 shadow-sm text-center">
      <Sparkles className="text-indigo-400" size={36} />
      <p className="text-sm text-gray-500 max-w-xs">
        Generate your weekly coaching summary based on this week&apos;s check-ins and goals.
      </p>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        onClick={generate}
        disabled={loading}
        className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Generate Report'}
      </button>
    </div>
  );
}
