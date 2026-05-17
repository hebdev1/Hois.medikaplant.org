import { Suspense } from 'react';
import SignupForm from './signup-form';
import Link from 'next/link';

export const metadata = { title: 'Kreye yon kont' };

export default function SignupPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-ink">Kreye yon kont</h1>
      <p className="mt-2 text-ink-muted text-sm">
        Rantre nan kominote Hoïs jodi a — 1 minit pou kòmanse.
      </p>
      <div className="mt-8">
        <Suspense fallback={<div className="h-80 rounded-xl bg-slate-50 animate-pulse" />}>
          <SignupForm />
        </Suspense>
      </div>
      <p className="mt-6 text-sm text-ink-muted text-center">
        Deja gen yon kont? <Link href="/auth/login" className="text-brand-700 font-medium hover:underline">Konekte</Link>
      </p>
    </>
  );
}
