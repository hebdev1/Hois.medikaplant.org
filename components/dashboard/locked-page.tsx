import Link from 'next/link';
import { Lock, ArrowLeft } from 'lucide-react';

// Shown in place of a page that is temporarily locked while it's being built.
// Keep it self-contained (no data fetching) so a locked route stays cheap.
export default function LockedPage({
  title = 'Seksyon fèmen',
}: {
  title?: string;
}) {
  return (
    <div className="min-h-[70vh] grid place-items-center px-6 py-16">
      <div className="max-w-md text-center">
        <span className="grid place-items-center w-16 h-16 mx-auto rounded-2xl bg-cream-100 text-forest-700 mb-5">
          <Lock className="w-7 h-7" strokeWidth={2} />
        </span>
        <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
        <p className="mt-2 text-earth-600 leading-relaxed">
          Seksyon sa a fèmen pou kounye a — n ap travay sou li. L ap tounen
          disponib byento.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-1.5 bg-forest-700 hover:bg-forest-800 text-cream-50 px-5 py-2.5 rounded-full text-sm font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.4} />
          Tounen nan tablodebò
        </Link>
      </div>
    </div>
  );
}
