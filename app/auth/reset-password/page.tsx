import Link from 'next/link';
import ResetPasswordForm from './reset-password-form';

export const metadata = { title: 'Chwazi nouvo modpas' };
// Skip static generation — see note in /auth/forgot-password/page.tsx.
// The form needs the Supabase browser client at runtime, and the build
// step shouldn't try to instantiate it ahead of time.
export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-ink">
        Chwazi yon nouvo modpas
      </h1>
      <p className="mt-2 text-ink-muted text-sm">
        Antre modpas ou chwazi 2 fwa. Apre konfimasyon, n ap konekte ou
        otomatikman.
      </p>
      <div className="mt-8">
        <ResetPasswordForm />
      </div>
      <p className="mt-6 text-sm text-ink-muted text-center">
        Pa bezwen chanje l ankò?{' '}
        <Link
          href="/auth/login"
          className="text-brand-700 font-medium hover:underline"
        >
          Tounen sou paj koneksyon an
        </Link>
      </p>
    </>
  );
}
