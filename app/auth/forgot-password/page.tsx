import Link from 'next/link';
import ForgotPasswordForm from './forgot-password-form';

export const metadata = { title: 'Bliye modpas' };
// Render at request time, never at build time. The form mounts a Supabase
// browser client that needs NEXT_PUBLIC_SUPABASE_URL + ANON_KEY — those
// may not exist during the static-generation phase on hosts like
// Hostinger where the build runs before env vars are injected. Marking
// the route dynamic keeps the build green and pushes the env-var check
// to runtime, where the values are guaranteed to be present.
export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-ink">
        Bliye modpas ou?
      </h1>
      <p className="mt-2 text-ink-muted text-sm">
        Antre imel kont MedikaPlant ou — n ap voye yon lyen sekirize pou ou ka
        chwazi yon nouvo modpas.
      </p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
      <p className="mt-6 text-sm text-ink-muted text-center">
        Sonje modpas ou?{' '}
        <Link
          href="/auth/login"
          className="text-brand-700 font-medium hover:underline"
        >
          Tounen pou konekte
        </Link>
      </p>
    </>
  );
}
