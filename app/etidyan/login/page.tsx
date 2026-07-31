import { Suspense } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  PlayCircle,
  BarChart3,
  Infinity as InfinityIcon,
} from 'lucide-react';
import StudentLoginForm from './student-login-form';

export const metadata = { title: 'Konekte · Potay Etidyan · Hoïs' };
export const dynamic = 'force-dynamic';

// Dedicated STUDENT login — separate route + design from the member login
// (/auth/login) on purpose. Course buyers land here (via the "Potay etidyan"
// button / the middleware), members keep their own door. The form enforces the
// buyer-only rule; the portal pages enforce it again server-side.
export default function StudentLoginPage() {
  return (
    <div className="flex min-h-screen w-full bg-cream-50">
      {/* Left: branded panel (desktop only) */}
      <div className="relative hidden md:flex md:w-1/2 lg:w-[55%] flex-col justify-between overflow-hidden bg-forest-900 text-cream-50 p-10 lg:p-14">
        <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-brand-500/15" />
        <div className="absolute -left-20 bottom-8 w-64 h-64 rounded-full bg-gold-400/10" />

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="grid place-items-center w-10 h-10 rounded-full bg-gold-400 text-forest-900 font-display font-bold text-lg">
              H
            </span>
            <span className="leading-tight">
              <span className="block font-display text-lg font-semibold">Hoïs</span>
              <span className="block text-[10px] uppercase tracking-[0.16em] text-brand-300 font-semibold">
                Inivèsite
              </span>
            </span>
          </Link>
        </div>

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-gold-300 font-semibold">
            <GraduationCap className="w-4 h-4" strokeWidth={2.2} />
            Potay Etidyan
          </span>
          <h2 className="mt-3 font-display text-3xl lg:text-4xl font-bold leading-tight">
            Kou ou yo, nan pwòp rit ou.
          </h2>
          <p className="mt-3 text-cream-200/85 leading-relaxed">
            Konekte pou w kontinye aprann — tout kou ou achte yo nan yon sèl
            kote, san bezwen abònman.
          </p>
          <ul className="mt-7 space-y-3 text-sm text-cream-100/90">
            <li className="flex items-center gap-3">
              <PlayCircle className="w-4 h-4 text-gold-300 shrink-0" strokeWidth={2.2} />
              Videyo ak modil entèraktif
            </li>
            <li className="flex items-center gap-3">
              <BarChart3 className="w-4 h-4 text-gold-300 shrink-0" strokeWidth={2.2} />
              Pwogrè ou sove otomatikman
            </li>
            <li className="flex items-center gap-3">
              <InfinityIcon className="w-4 h-4 text-gold-300 shrink-0" strokeWidth={2.2} />
              Aksè pou tout lavi ak kou ou achte
            </li>
          </ul>
        </div>

        <div className="relative text-xs text-cream-200/55">
          © {new Date().getFullYear()} Hoïs Inivèsite
        </div>
      </div>

      {/* Right: form */}
      <div className="flex w-full md:w-1/2 lg:w-[45%] items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo (the left panel is hidden on small screens) */}
          <Link
            href="/"
            className="md:hidden inline-flex items-center gap-2 mb-8"
          >
            <span className="grid place-items-center w-9 h-9 rounded-full bg-gold-400 text-forest-900 font-display font-bold">
              H
            </span>
            <span className="font-display text-lg font-semibold text-ink">
              Hoïs
            </span>
          </Link>

          <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-forest-700 font-semibold">
            <GraduationCap className="w-4 h-4" strokeWidth={2.2} />
            Potay Etidyan
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">
            Konekte
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Antre ak kont ou te kreye lè w te achte kou a.
          </p>

          <div className="mt-8">
            <Suspense
              fallback={
                <div className="h-64 rounded-xl bg-cream-100 animate-pulse" />
              }
            >
              <StudentLoginForm />
            </Suspense>
          </div>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Ou poko gen kont?{' '}
            <Link
              href="/klas"
              className="text-forest-700 font-semibold hover:underline"
            >
              Achte yon kou pou kòmanse
            </Link>
          </p>
          <p className="mt-3 text-center text-xs text-ink-muted">
            Ou se yon manm plan?{' '}
            <Link href="/auth/login" className="underline hover:text-ink">
              Konekte sou dashboard manm nan
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
