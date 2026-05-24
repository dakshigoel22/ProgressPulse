import { getAllWeeklyReports, getWeeklyReport } from '@/lib/db';
import GenerateReport from './GenerateReport';

function getMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().slice(0, 10);
}

export default function ReportPage() {
  const weekStart = getMonday();
  const current = getWeeklyReport(weekStart);
  const all = getAllWeeklyReports();

  return (
    <div className="px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Weekly Report</h1>
      <p className="mb-6 text-sm text-gray-500">Week of {weekStart}</p>

      {current ? (
        <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-indigo-400">This week</p>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
            {current.content}
          </div>
        </div>
      ) : (
        <GenerateReport weekStart={weekStart} />
      )}

      {all.filter(r => r.week_start !== weekStart).length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Past reports</h2>
          <div className="space-y-3">
            {all
              .filter(r => r.week_start !== weekStart)
              .map(r => (
                <details key={r.id} className="rounded-2xl bg-white shadow-sm">
                  <summary className="cursor-pointer p-4 text-sm font-medium text-gray-700">
                    Week of {r.week_start}
                  </summary>
                  <div className="border-t border-gray-100 p-4 text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
                    {r.content}
                  </div>
                </details>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
