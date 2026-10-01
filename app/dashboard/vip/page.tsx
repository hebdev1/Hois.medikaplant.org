import Link from 'next/link';
import {
  Crown,
  Sparkles,
  Star,
  MessageCircle,
  Sunrise,
  LifeBuoy,
  BookOpen,
  Activity,
  ChevronRight,
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import Topbar from '@/components/dashboard/topbar';
import ConsultationsPanel from '@/components/dashboard/consultations-panel';
import JoinVipButton from './join-button';
import VipSessionCard from './vip-session-card';
import LockedPage from '@/components/dashboard/locked-page';
import { LOCKED_PATHS } from '@/lib/feature-locks';

export const metadata = { title: 'Espas VIP · MedikaPlant' };
export const dynamic = 'force-dynamic';

const PLAN_LABEL: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

// Benefit 1 + 5 → quick access to the surfaces Melis includes (everything in
// Sitwonèl, plus the Lakou Limyè "Primè"/Salon content). These are real routes.
const QUICK_ACCESS: { icon: LucideIcon; label: string; desc: string; href: string }[] = [
  { icon: Sparkles, label: 'Lakou Limyè', desc: 'Salon, emisyon & Limyè eksklizif (Primè)', href: '/dashboard/lakou-limye' },
  { icon: LifeBuoy, label: 'Sipò priyoritè', desc: 'Repons pi rapid nan chat la', href: '/dashboard/support' },
  { icon: BookOpen, label: 'Gid & Konsèy', desc: 'Tout bibliyotèk konesans lan', href: '/dashboard/guides' },
  { icon: Activity, label: 'Swivi Sante', desc: 'Tablodebò sante pèsonèl ou', href: '/dashboard/health' },
];

// The Melis sales pitch shown to non-Melis members (verbatim from pricing).
const MELIS_BENEFITS: { icon: LucideIcon; text: string }[] = [
  { icon: Crown, text: 'Tout sa ki nan Sitwonèl' },
  { icon: Sparkles, text: 'Konsiltasyon patikilye sou ka maladi mistik' },
  { icon: Star, text: 'Non w pibliye nan sèk Hoïs VIP la' },
  { icon: MessageCircle, text: 'Yon konvèsasyon konfidansyèl 21 min ak Vye Ewòl' },
  { icon: Sunrise, text: 'Limyè eksklizif (Primè) sou gwo fenomèn' },
];

export default async function VipPage() {
  if (LOCKED_PATHS['/dashboard/vip']) return <LockedPage title="Espas VIP" />;

  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const [{ data: profileRaw }, { data: vipRaw }, { data: reqRaw }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('plan, full_name, email, avatar_url')
        .eq('id', user.id)
        .maybeSingle(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('vip_members')
        .select('user_id, joined_at')
        .eq('user_id', user.id)
        .maybeSingle(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('vip_session_requests')
        .select('status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const profile = profileRaw as {
    plan: 'basic' | 'premium' | 'vip';
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;

  const plan = profile?.plan ?? 'basic';
  const isMelis = plan === 'vip';
  const joined = !!vipRaw;
  const joinedAt = (vipRaw as { joined_at?: string } | null)?.joined_at ?? null;
  const request = reqRaw
    ? {
        status: (reqRaw as { status: string }).status as
          | 'nouvo'
          | 'pwograme'
          | 'fèt'
          | 'refize',
        createdAt: (reqRaw as { created_at: string }).created_at,
      }
    : null;
  const shortName = (
    profile?.full_name ||
    profile?.email.split('@')[0] ||
    'Manm'
  ).split(' ')[0];

  return (
    <>
      <Topbar
        userName={shortName}
        userCondition={`${PLAN_LABEL[plan]} · VIP`}
        userId={user.id}
        userPlan={plan}
        avatarUrl={profile?.avatar_url ?? null}
      />

      <div className="p-5 md:p-8 lg:p-10 max-w-[1100px] mx-auto grid gap-5 md:gap-6">
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-100 text-gold-700 text-xs font-semibold mb-3">
            <Crown className="w-3.5 h-3.5" strokeWidth={2.2} />
            Sèk Melis
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Espas VIP
          </h1>
          <p className="mt-2 text-sm md:text-base text-earth-600 max-w-2xl leading-relaxed">
            {isMelis
              ? 'Avantaj eksklizif ou yo kòm manm Hoïs Melis — rezève pou sèk la sèlman.'
              : 'Sèk ki pi pre Vye Ewòl la, ak avantaj rezève pou manm Hoïs Melis.'}
          </p>
        </header>

        {isMelis ? (
          <>
            {/* Welcome hero */}
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gold-500 to-forest-900 text-cream-50 p-6 md:p-8 shadow-hero">
              <div
                className="absolute -top-16 -right-12 w-72 h-72 bg-gold-400/20 rounded-full blur-3xl pointer-events-none"
                aria-hidden
              />
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-200 mb-3">
                  <Crown className="w-3.5 h-3.5" strokeWidth={2.4} />
                  Manm Hoïs Melis
                </div>
                <h2 className="font-display text-2xl md:text-3xl font-bold leading-tight">
                  Byenveni nan Sèk Melis la, {shortName}.
                </h2>
                <p className="mt-2 text-sm md:text-[15px] text-cream-200/90 max-w-2xl leading-relaxed">
                  Ou gen aksè a sa ki pi rezève nan Hoïs — depi konsiltasyon
                  patikilye rive nan konvèsasyon prive ak Vye Ewòl.
                </p>
                {joined && joinedAt && (
                  <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream-50/12 border border-cream-50/15 text-[12px] font-semibold text-cream-50">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gold-200" strokeWidth={2.4} />
                    Nan sèk la depi{' '}
                    {new Date(joinedAt).toLocaleDateString('fr-HT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Profile + Wall — the member showcase */}
            <section className="grid sm:grid-cols-2 gap-3 md:gap-4">
              <Link
                href="/dashboard/vip/pwofil"
                className="group bg-white border border-gold-200 rounded-2xl p-5 shadow-card hover:shadow-cardHover hover:border-gold-300 transition flex items-center gap-4"
              >
                <span className="grid place-items-center w-12 h-12 rounded-xl bg-gold-100 text-gold-700 shrink-0">
                  <UserRound className="w-6 h-6" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-bold text-ink">
                    Pwofil VIP ou
                  </h3>
                  <p className="text-[13px] text-earth-600 leading-snug">
                    Nivo, badj, sètifika ak pakou ou — tout nan yon sèl kote.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-earth-400 shrink-0 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.4} />
              </Link>
              <Link
                href="/dashboard/vip/miray"
                className="group bg-white border border-gold-200 rounded-2xl p-5 shadow-card hover:shadow-cardHover hover:border-gold-300 transition flex items-center gap-4"
              >
                <span className="grid place-items-center w-12 h-12 rounded-xl bg-gold-100 text-gold-700 shrink-0">
                  <Users className="w-6 h-6" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-bold text-ink">
                    Miray VIP
                  </h3>
                  <p className="text-[13px] text-earth-600 leading-snug">
                    Dekouvri lòt manm Sèk Melis la ki chwazi parèt.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-earth-400 shrink-0 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.4} />
              </Link>
            </section>

            {/* Marquee: the 21-min session with Vye Ewòl */}
            <VipSessionCard request={request} />

            {/* Real consultation booking */}
            <ConsultationsPanel isMelis />

            {/* Benefit 3 — opt into the VIP circle (name featured) */}
            <section className="bg-white border border-gold-200 rounded-2xl p-5 md:p-6 shadow-card">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-gold-700 font-semibold mb-1.5">
                    <Star className="w-3 h-3" strokeWidth={2.4} />
                    Sèk Hoïs VIP
                  </div>
                  <h3 className="font-display text-lg md:text-xl font-bold text-ink">
                    Parèt nan sèk Melis la
                  </h3>
                  <p className="mt-1 text-sm text-earth-600 max-w-xl leading-relaxed">
                    Enskri pou w fè pati sèk VIP la ofisyèlman — se konsantman w
                    pou non w figire pami manm Melis yo. (Paj piblik sèk la ap
                    vini.)
                  </p>
                </div>
                <div className="shrink-0">
                  <JoinVipButton joined={joined} />
                </div>
              </div>
            </section>

            {/* Benefit 1 + 5 — quick access to everything Melis includes */}
            <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
              <header className="mb-4">
                <h3 className="font-display text-lg md:text-xl font-bold text-ink">
                  Tout sa Melis ba ou
                </h3>
                <p className="text-xs text-earth-600 mt-0.5">
                  Tout avantaj Sitwonèl yo, plis kontni eksklizif la — nan yon
                  klik.
                </p>
              </header>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {QUICK_ACCESS.map((q) => {
                  const Icon = q.icon;
                  return (
                    <Link
                      key={q.href}
                      href={q.href}
                      className="group bg-cream-50 border border-cream-200 rounded-xl p-4 flex flex-col gap-2 transition hover:border-gold-300 hover:shadow-card"
                    >
                      <span className="grid place-items-center w-10 h-10 rounded-xl bg-gold-100 text-gold-700">
                        <Icon className="w-5 h-5" strokeWidth={2} />
                      </span>
                      <span className="block font-semibold text-sm text-ink mt-0.5">
                        {q.label}
                      </span>
                      <span className="block text-[12px] text-earth-600 leading-snug">
                        {q.desc}
                      </span>
                      <span className="mt-auto inline-flex items-center gap-1 text-[12px] font-semibold text-forest-700 group-hover:text-forest-800 pt-1">
                        Ouvri
                        <ChevronRight className="w-3 h-3" strokeWidth={2.4} />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          /* Non-Melis — polished upgrade-to-Melis state */
          <section className="relative overflow-hidden rounded-2xl border border-gold-200 bg-white shadow-card">
            <div className="relative overflow-hidden bg-gradient-to-br from-gold-500 to-forest-900 text-cream-50 p-6 md:p-8">
              <div
                className="absolute -top-16 -right-12 w-72 h-72 bg-gold-400/20 rounded-full blur-3xl pointer-events-none"
                aria-hidden
              />
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-200 mb-3">
                  <Crown className="w-3.5 h-3.5" strokeWidth={2.4} />
                  Hoïs Melis
                </div>
                <h2 className="font-display text-2xl md:text-3xl font-bold leading-tight">
                  Espas sa a rezève pou manm Melis.
                </h2>
                <p className="mt-2 text-sm md:text-[15px] text-cream-200/90 max-w-2xl leading-relaxed">
                  Pase sou plan Hoïs Melis pou debloke sèk ki pi pre Vye Ewòl la
                  ak tout avantaj eksklizif li yo.
                </p>
              </div>
            </div>

            <div className="p-5 md:p-7">
              <ul className="grid gap-2.5 mb-6">
                {MELIS_BENEFITS.map((b, i) => {
                  const Icon = b.icon;
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-0.5 grid place-items-center w-6 h-6 rounded-lg bg-gold-100 text-gold-700 shrink-0">
                        <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
                      </span>
                      <span className="text-sm text-ink/90 leading-relaxed">
                        {b.text}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/checkout?plan=vip&cycle=yearly"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gold-400 hover:bg-gold-300 text-forest-900 font-bold text-sm shadow-sm transition"
                >
                  Pase sou Melis
                  <ArrowUpRight className="w-4 h-4" strokeWidth={2.4} />
                </Link>
                <span className="text-[13px] text-earth-600">
                  $224.10 / ane{' '}
                  <span className="text-earth-400">oswa $20.75 / mwa</span>
                </span>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
