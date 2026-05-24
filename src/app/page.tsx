import { getCheckinByDate, getStreak } from '@/lib/db';
import Link from 'next/link';
import { Flame, Sun, Moon } from 'lucide-react';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function Home() {
  const date = today();
  const morning = getCheckinByDate(date, 'morning');
  const evening = getCheckinByDate(date, 'evening');
  const streak = getStreak();

  return (
    <div className="px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ProgressPulse</h1>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Streak */}
      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-indigo-50 px-5 py-4">
        <Flame className="text-orange-500" size={28} />
        <div>
          <p className="text-2xl font-bold text-gray-900">{streak}</p>
          <p className="text-sm text-gray-600">{streak === 1 ? 'day' : 'days'} streak</p>
        </div>
      </div>

      {/* Today's check-ins */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Today</h2>
      <div className="space-y-3">
        <CheckinCard
          type="morning"
          icon={<Sun size={18} className="text-yellow-500" />}
          label="Morning Check-in"
          done={!!morning}
          detail={morning?.focus ?? undefined}
          href="/checkin?type=morning"
        />
        <CheckinCard
          type="evening"
          icon={<Moon size={18} className="text-indigo-500" />}
          label="Evening Check-in"
          done={!!evening}
          detail={evening ? 'Completed' : undefined}
          href="/checkin?type=evening"
        />
      </div>

      {/* Today's AI response */}
      {morning?.ai_response && (
        <div className="mt-6 rounded-2xl border border-indigo-100 bg-white p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-400">Morning coaching</p>
          <p className="text-sm leading-relaxed text-gray-700">{morning.ai_response}</p>
        </div>
      )}
    </div>
  );
}

function CheckinCard({
  icon,
  label,
  done,
  detail,
  href,
}: {
  type: string;
  icon: React.ReactNode;
  label: string;
  done: boolean;
  detail?: string;
  href: string;
}) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="font-medium text-gray-800">{label}</p>
          {detail && <p className="text-xs text-gray-500 truncate max-w-[180px]">{detail}</p>}
        </div>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
        {done ? 'Done' : 'Start'}
      </span>
    </Link>
  );
}
