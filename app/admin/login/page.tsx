import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Leaf, ShieldCheck, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import AdminLoginForm from './login-form';

export const metadata = {
  title: 'Konekte · Admin · MedikaPlant',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  // If already authed AND already admin, jump straight in.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if ((profile as { role: string } | null)?.role === 'admin') {
      redirect('/admin');
    }
    // logged in as non-admin? we still show the login screen so they can
    // sign in with a different (admin) account. The "not_admin" banner will
    // appear via searchParams if they were just bounced.
  }

  const errorBanner =
    searchParams.error === 'not_admin'
      ? 'Kont aktyèl la pa gen aksè administratè. Konekte ak yon kont admin.'
      : null;

  return (
    <div className="min-h-screen relative overflow-hidden bg-ink text-cream-50">
      {/* Decorative gradient orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full opacity-30 blur-3xl"
        style={{
          background:
            'radial-gradient(circle at center, #c9a227 0%, transparent 60%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-32 w-[520px] h-[520px] rounded-full opacity-25 blur-3xl"
        style={{
          background:
            'radial-gradient(circle at center, #5A9138 0%, transparent 60%)',
        }}
      />

      {/* Top strip */}
      <header className="relative z-10 px-6 md:px-10 py-5 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-accent-gradient text-white shadow">
            <Leaf className="w-4 h-4" strokeWidth={2.4} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-bold text-white text-sm">MedikaPlant</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/55 font-medium">
              Admin
            </span>
          </span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.4} />
          Tounen sou sit la
        </Link>
      </header>

      <main className="relative z-10 px-6 py-12 md:py-16 grid lg:grid-cols-2 gap-10 max-w-6xl mx-auto items-center">
        {/* Left: hero panel */}
        <section className="hidden lg:block">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-cream-50 text-xs font-semibold mb-4">
            <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2.2} />
            Sèksyon rezève
          </div>
          <h1 className="font-display text-4xl xl:text-5xl font-bold leading-tight">
            Panèl{' '}
            <em className="not-italic bg-gradient-to-r from-gold-300 to-forest-300 bg-clip-text text-transparent">
              administratif
            </em>{' '}
            Hoïs Inivèsite
          </h1>
          <p className="mt-4 text-cream-100/80 text-base leading-relaxed max-w-md">
            Aksè konplè sou kont manm, plan abònman, kondisyon medikal, gid,
            sipò ak swivi sante. Konekte ak idantifyan administratè ou yo.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-cream-100/75">
            <FeatureItem>Modifye nenpòt enfòmasyon sou kont yon kliyan</FeatureItem>
            <FeatureItem>Sispann oswa reaktive kont, jere wòl yo</FeatureItem>
            <FeatureItem>Pwopoze tretman ak swiv pwogrè klinik</FeatureItem>
            <FeatureItem>Pibliye gid, voye notifikasyon dirèk</FeatureItem>
          </ul>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 text-xs text-cream-100/70 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-gold-300 mt-0.5 shrink-0" strokeWidth={2.2} />
            <p className="leading-relaxed">
              Manm regilye yo pa ka antre nan paj sa. Pou kont manm, sèvi ak{' '}
              <Link
                href="/auth/login"
                className="text-gold-300 hover:underline font-semibold"
              >
                /auth/login
              </Link>
              .
            </p>
          </div>
        </section>

        {/* Right: login card */}
        <section>
          <div className="bg-white text-ink rounded-2xl shadow-2xl border border-white/20 p-6 md:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider mb-3">
                <ShieldCheck className="w-3 h-3" strokeWidth={2.4} />
                Admin only
              </div>
              <h2 className="font-display text-2xl font-bold text-ink">
                Konekte
              </h2>
              <p className="text-sm text-earth-600 mt-1">
                Ranpli idantifyan administratè w yo.
              </p>
            </div>

            {errorBanner && (
              <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-800 font-medium">
                {errorBanner}
              </div>
            )}

            <AdminLoginForm />

            <div className="mt-6 pt-5 border-t border-cream-200 text-center text-xs text-earth-600">
              Pa admin?{' '}
              <Link
                href="/auth/login"
                className="font-semibold text-forest-700 hover:text-forest-800 hover:underline"
              >
                Konekte kòm manm →
              </Link>
            </div>
          </div>

          {/* Help text on mobile (replaces left hero) */}
          <p className="lg:hidden mt-5 text-center text-xs text-cream-100/60">
            Sèksyon rezève pou administratè Hoïs Inivèsite. Manm regilye yo dwe
            konekte sou{' '}
            <Link href="/auth/login" className="text-gold-300 hover:underline">
              paj manm yo
            </Link>
            .
          </p>
        </section>
      </main>
    </div>
  );
}

function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span
        aria-hidden
        className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold-400 shrink-0"
      />
      <span>{children}</span>
    </li>
  );
}
