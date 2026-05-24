import { getMoodHistory } from '@/lib/db';
import MoodChart from './MoodChart';

export default function MoodPage() {
  const history = getMoodHistory(30).reverse();
  const data = history.map(c => ({
    date: c.date.slice(5), // MM-DD
    mood: c.mood_score,
  }));

  const avg = data.length
    ? Math.round((data.reduce((s, d) => s + (d.mood ?? 0), 0) / data.length) * 10) / 10
    : null;

  return (
    <div className="px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Mood</h1>
      <p className="mb-6 text-sm text-gray-500">Last 30 days</p>

      {avg !== null && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <span className="text-3xl font-bold text-indigo-600">{avg}</span>
          <span className="text-sm text-gray-500">30-day average</span>
        </div>
      )}

      {data.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">No mood data yet. Do a morning check-in first.</p>
      ) : (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <MoodChart data={data} />
        </div>
      )}
    </div>
  );
}
