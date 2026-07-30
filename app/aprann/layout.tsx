import Link from 'next/link';
import { LibraryBig } from 'lucide-react';

export const metadata = { title: 'Espas Elèv · Hoïs' };
export const dynamic = 'force-dynamic';

// Standalone student area for course buyers — independent of the member
// dashboard, so someone who bought a course without a plan can still learn.
// Auth is enforced by middleware; each page gates on enrolment.
export default function AprannLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream-50">
      <header className="border-b border-cream-200 bg-white sticky top-0 z-30">
        <div className="max-w-[900px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <Link href="/aprann" className="inline-flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-hois.png" alt="Hoïs" className="h-8 w-auto" />
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-earth-700">
              <LibraryBig className="w-4 h-4 text-forest-700" strokeWidth={2.2} />
              Espas Elèv
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/klas" className="text-earth-600 hover:text-forest-700 transition">
              Katalòg
            </Link>
            <Link href="/" className="text-earth-600 hover:text-forest-700 transition">
              Sit la
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
