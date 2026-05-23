import { Suspense } from 'react';
import LoginForm from './login-form';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata = { title: 'Konekte' };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string; plan?: string };
}) {
  // Account creation is gated behind plan selection: you can't have an
  // account without paying for one. If a plan is already carried in the
  // URL (the visitor came from a pricing card), send them straight back
  // to /checkout so the inline signup form picks them up. Otherwise drop
  // them on the pricing section of the landing page.
  const planHref = searchParams.plan
    ? `/checkout?plan=${searchParams.plan}`
    : '/#pri';

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-ink">Bon retou</h1>
      <p className="mt-2 text-ink-muted text-sm">
        Konekte ak kont MedikaPlant ou pou kontinye vwayaj ou.
      </p>
      <div className="mt-8">
        <Suspense fallback={<div className="h-64 rounded-xl bg-slate-50 animate-pulse" />}>
          <LoginForm />
        </Suspense>
      </div>
      <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3.5 text-sm text-center">
        <p className="text-ink font-semibold">Pa gen kont toujou?</p>
        <p className="text-ink-muted text-xs mt-0.5">
          Pou kreye yon kont MedikaPlant, ou dwe chwazi yon plan an premye.
        </p>
        <Link
          href={planHref}
          className="inline-flex items-center gap-1.5 mt-2.5 px-4 py-1.5 text-xs font-bold bg-brand-gradient text-white rounded-full hover:brightness-110 transition shadow-sm"
        >
          {searchParams.plan ? 'Kontinye nan checkout' : 'Wè plan yo'}
          <ArrowRight className="w-3 h-3" strokeWidth={2.4} />
        </Link>
      </div>
    </>
  );
}
