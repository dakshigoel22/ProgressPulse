import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import BottomNav from '@/components/BottomNav';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: 'ProgressPulse',
  description: 'Your personal daily coaching companion',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-gray-50 font-sans antialiased">
        <main className="mx-auto w-full max-w-md flex-1 pb-20">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
