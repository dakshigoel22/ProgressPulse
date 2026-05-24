'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardList, Target, TrendingUp, FileText } from 'lucide-react';

const nav = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/checkin', label: 'Check-in', icon: ClipboardList },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/mood', label: 'Mood', icon: TrendingUp },
  { href: '/report', label: 'Report', icon: FileText },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-md justify-around">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                active ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
