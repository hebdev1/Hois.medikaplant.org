import { Suspense } from 'react';
import LoginForm from './login-form';
import Link from 'next/link';

export const metadata = { title: 'Konekte' };

export default function LoginPage() {
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
      <p className="mt-6 text-sm text-ink-muted text-center">
        Pa gen kont? <Link href="/auth/signup" className="text-brand-700 font-medium hover:underline">Kreye yon kont</Link>
      </p>
    </>
  );
}
