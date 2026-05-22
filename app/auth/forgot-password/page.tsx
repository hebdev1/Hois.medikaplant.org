import Link from 'next/link';
import ForgotPasswordForm from './forgot-password-form';

export const metadata = { title: 'Bliye modpas' };

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
