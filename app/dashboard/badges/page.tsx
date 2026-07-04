import Link from 'next/link';
import { Award, Sparkles, Flame, ChevronRight, Trophy } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Topbar from '@/components/dashboard/topbar';
import BadgeArt from '@/components/dashboard/badge-art';
import {
  asBadgeIcon,
  asBadgeMetric,
  METRIC_LABEL,
  METRIC_UNIT,
} from '@/lib/badges/metric-helpers';
import type { Database } from '@/types/database';

export const metadata = { title: 'Badj mwen yo' };
export const dynamic = 'force-dynamic';

type BadgeRow = Database['public']['Tables']['badges']['Row'];
type UserBadgeRow = Database['public']['Tables']['user_badges']['Row'];

const PLAN_LABELS: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

const MONTHS_HT = [
  'Janvye', 'Fevriye', 'Mas', 'Avril', 'Me', 'Jen',
  'Jiyè', 'Out', 'Septanm', 'Oktòb', 'Novanm', 'Desanm',
];

function formatHaitianDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MONTHS_HT[d.getMonth()]} ${d.getFullYear()}`;
}

export default async function BadgesGalleryPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [
    profileResult,
    badgesResult,
    userBadgesResult,
    streakResult,
    levelResult,
    levelNameResult,
    unreadCountResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, first_name, last_name, email, plan')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('badges')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true }),
    supabase.from('user_badges').select('*').eq('user_id', user.id),
    supabase.rpc('user_streak', { uid: user.id }),
    supabase.rpc('user_level', { uid: user.id }),
    supabase.rpc('user_level_name', { uid: user.id }),
    supabase.rpc('user_unread_notifications_count', { uid: user.id }),
  ]);

  const profile = (profileResult.data ?? null) as {
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string;
    plan: 'basic' | 'premium' | 'vip';
  } | null;

  const userName =
    profile?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    profile?.email.split('@')[0] ||
    'Manm';
  const shortName = userName.split(' ')[0];
  const planLabel = PLAN_LABELS[profile?.plan ?? 'basic'] ?? 'Hoïs Bazilik';

  const badges = (badgesResult.data ?? []) as BadgeRow[];
  const userBadgesMap = new Map(
    ((userBadgesResult.data ?? []) as UserBadgeRow[]).map((ub) => [
      ub.badge_id,
      ub,
    ])
  );
  const streak = (streakResult.data as number | null) ?? 0;
  const level = (levelResult.data as number | null) ?? 1;
  const levelName =
    (levelNameResult.data as string | null) ?? 'Nouvo Manm';
  const unreadCount = (unreadCountResult.data as number | null) ?? 0;

  const unlockedCount = badges.filter(
    (b) => userBadgesMap.get(b.id)?.unlocked
  ).length;
  const totalCount = badges.length;
  const overallPercent =
    totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <>
      <Topbar
        userName={shortName}
        userCondition={planLabel}
        unreadCount={unreadCount}
      />

      <div className="p-5 md:p-8 lg:p-10 max-w-[1100px]">
        {/* ── Header ───────────────────────────────────────────────────── */}
        <header className="mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-100 text-gold-800 text-xs font-semibold mb-3">
            <Award className="w-3.5 h-3.5" strokeWidth={2.2} />
            Reyalisasyon ou
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Badj <em className="text-gold-500 not-italic font-bold">mwen yo</em>
          </h1>
          <p className="mt-2 text-sm md:text-base text-earth-600 max-w-2xl">
            Chak badj se yon ti viktwa konkrè ki swiv yon mezi reyèl nan kont
            ou. Klike sou yon badj pou wè detay ak kijan pou debloke li.
          </p>
        </header>

        {/* ── Stat strip ────────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-7 md:mb-8">
          <StatCard
            icon={<Trophy className="w-4 h-4" strokeWidth={2.2} />}
            label="Debloke"
            value={`${unlockedCount} / ${totalCount}`}
            tone="gold"
          />
          <StatCard
            icon={<Sparkles className="w-4 h-4" strokeWidth={2.2} />}
            label="Nivo aktyèl"
            value={`Niv. ${level}`}
            sub={levelName}
            tone="forest"
          />
          <StatCard
            icon={<Flame className="w-4 h-4" strokeWidth={2.2} />}
            label="Streak"
            value={`${streak} jou`}
            tone="rose"
          />
          <StatCard
            icon={<Award className="w-4 h-4" strokeWidth={2.2} />}
            label="Pwogresyon"
            value={`${overallPercent}%`}
            tone="cream"
          />
        </section>

        {/* ── Gallery ──────────────────────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {badges.map((b) => {
              const state = userBadgesMap.get(b.id);
              const unlocked = state?.unlocked ?? false;
              const progress = state?.progress
                ? Number(state.progress)
                : 0;
              const justUnlocked = state?.just_unlocked ?? false;
              const metric = asBadgeMetric(b.criteria_metric);
              const icon = asBadgeIcon(b.icon);
              const currentValue = Math.round(progress * b.criteria_threshold);
              const unit = METRIC_UNIT[metric];

              return (
                <Link
                  key={b.id}
                  href={`/dashboard/badges/${b.slug}`}
                  className={`group relative bg-white border rounded-2xl p-4 md:p-5 flex flex-col items-center text-center transition shadow-card hover:shadow-plant ${
                    unlocked
                      ? 'border-gold-200 hover:border-gold-400'
                      : 'border-cream-200 hover:border-forest-300'
                  }`}
                >
                  {justUnlocked && (
                    <span className="absolute -top-2 right-3 inline-flex items-center px-2 py-0.5 rounded-full bg-gold-400 text-forest-900 text-[10px] font-bold uppercase tracking-wide shadow">
                      Nouvo
                    </span>
                  )}

                  <div className={unlocked ? '' : 'opacity-70'}>
                    <div className="scale-[1.4] origin-center my-2">
                      <BadgeArt icon={icon} unlocked={unlocked} />
                    </div>
                  </div>

                  <div className="mt-3 text-sm md:text-base font-display font-bold text-ink leading-tight line-clamp-2 min-h-[2.5em]">
                    {b.name}
                  </div>
                  {b.sub && (
                    <div className="text-[11px] text-earth-500 mt-1 line-clamp-1">
                      {b.sub}
                    </div>
                  )}

                  {/* Progress / unlock state */}
                  {unlocked ? (
                    <div className="mt-3 w-full">
                      <div className="text-[10px] uppercase tracking-wide text-gold-700 font-bold">
                        Debloke
                      </div>
                      {state?.unlocked_at && (
                        <div className="text-[10px] text-earth-500 mt-0.5">
                          {formatHaitianDate(state.unlocked_at)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 w-full">
                      <div className="flex items-center justify-between text-[10px] text-earth-600 mb-1">
                        <span className="font-mono">
                          {currentValue} / {b.criteria_threshold} {unit}
                        </span>
                        <span className="font-mono">
                          {Math.round(progress * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-cream-200 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-forest-400 to-gold-400 transition-[width] duration-700"
                          style={{
                            width: `${Math.max(2, Math.round(progress * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700 group-hover:text-forest-900 transition">
                    Wè detay
                    <ChevronRight
                      className="w-3 h-3 group-hover:translate-x-0.5 transition"
                      strokeWidth={2.4}
                    />
                  </div>
                </Link>
              );
            })}
          </div>

          {badges.length === 0 && (
            <div className="rounded-2xl border border-dashed border-cream-300 bg-cream-50/60 p-8 text-center text-sm text-earth-600">
              Pa gen okenn badj ki konfigire pou kounye a.
            </div>
          )}
        </section>

        {/* ── How it works ─────────────────────────────────────────────── */}
        <section className="mt-8 md:mt-10 rounded-2xl border border-cream-200 bg-cream-50/60 p-5 md:p-6">
          <h2 className="font-display text-lg font-bold text-ink mb-2">
            Kijan badj yo travay
          </h2>
          <ul className="text-sm text-earth-700 space-y-1.5 list-disc pl-5">
            <li>
              Chak badj swiv yon <strong>mezi reyèl</strong> nan kont ou (jou seri,
              mezi sante, jou idratasyon, elatriye).
            </li>
            <li>
             Mizajou pwogrè a fèt.{' '}
              <strong>otomatik</strong> Chak fwa w konplete yon tach oswa anrejistre yon mezi.
            </li>
            <li>
              Chak badj ou debloke fè w monte yon nivo siperyè. Lè w debloke 5 badj, ou rive nan nivo "Èboris Pwofesyonèl".
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: 'gold' | 'forest' | 'rose' | 'cream';
}) {
  const toneStyles: Record<typeof tone, string> = {
    gold: 'bg-gold-50 border-gold-200 text-gold-800',
    forest: 'bg-forest-50 border-forest-200 text-forest-800',
    rose: 'bg-rose-50 border-rose-200 text-rose-800',
    cream: 'bg-cream-100 border-cream-300 text-earth-800',
  } as const;
  return (
    <div
      className={`rounded-2xl border p-4 md:p-5 flex flex-col gap-1 ${toneStyles[tone]}`}
    >
      <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold opacity-80">
        {icon}
        {label}
      </div>
      <div className="font-display text-2xl font-bold tracking-tight">
        {value}
      </div>
      {sub && <div className="text-[11px] opacity-75">{sub}</div>}
    </div>
  );
}
