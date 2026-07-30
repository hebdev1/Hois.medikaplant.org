import Link from 'next/link';
import { LibraryBig, LayoutDashboard, BookOpen, Home } from 'lucide-react';

export const metadata = { title: 'Espas Elèv · Hoïs' };
export const dynamic = 'force-dynamic';

const NAV = [
  { href: '/aprann', label: 'Tablodebò', icon: LayoutDashboard },
  { href: '/klas', label: 'Katalòg klas', icon: BookOpen },
  { href: '/', label: 'Sit la', icon: Home },
];

// Standalone student area — independent of the member dashboard, so a course
// buyer without a plan can still learn. Auth is enforced by middleware; each
// page gates on enrolment.
export default function AprannLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream-50 md:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:sticky md:top-0 md:h-screen bg-forest-900 text-cream-50 p-6">
        <Link href="/aprann" className="flex items-center gap-2.5 mb-9">
          <span className="grid place-items-center w-9 h-9 rounded-full bg-gold-400 text-forest-900 font-display font-bold text-lg">
            H
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-semibold">Hoïs</span>
            <span className="block text-[10px] uppercase tracking-[0.16em] text-brand-400/90 font-semibold">
              Inivèsite
            </span>
          </span>
        </Link>

        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-cream-100/85 hover:bg-cream-50/10 transition"
            >
              <Icon className="w-4 h-4 text-brand-400" strokeWidth={2.2} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl bg-brand-500/15 p-4">
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-brand-300 font-semibold mb-1.5">
            <LibraryBig className="w-3.5 h-3.5" strokeWidth={2.4} />
            Espas Elèv
          </div>
          <p className="text-xs text-cream-200/80 leading-relaxed">
            Tout kou ou achte yo, nan pwòp rit ou — san bezwen abònman.
          </p>
        </div>
      </aside>

      {/* Top bar (mobile) */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-forest-900 text-cream-50 px-4 py-3">
        <Link href="/aprann" className="inline-flex items-center gap-2">
          <span className="grid place-items-center w-8 h-8 rounded-full bg-gold-400 text-forest-900 font-display font-bold">
            H
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
            <LibraryBig className="w-4 h-4 text-brand-400" strokeWidth={2.2} />
            Espas Elèv
          </span>
        </Link>
        <Link href="/klas" className="text-xs font-medium text-cream-100/85">
          Katalòg
        </Link>
      </header>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
