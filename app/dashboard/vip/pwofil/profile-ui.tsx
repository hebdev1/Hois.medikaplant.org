import Link from 'next/link';
import {
  Crown,
  ArrowLeft,
  Flame,
  MapPin,
  CalendarClock,
  type LucideIcon,
} from 'lucide-react';
import Avatar from '@/components/dashboard/avatar';

// Shared presentational pieces for the VIP profile (own + other-member views).
// Pure display — themed with the MedikaPlant tokens (the design the founder
// exported *is* this system: Playfair display, gold-on-forest hero, cream cards).

const MONTHS_HT = [
  'Janvye', 'Fevriye', 'Mas', 'Avril', 'Me', 'Jen',
  'Jiyè', 'Out', 'Septanm', 'Oktòb', 'Novanm', 'Desanm',
];

export function dateHT(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MONTHS_HT[d.getMonth()]} ${d.getFullYear()}`;
}

export function ProfileHeader({
  name,
  avatarUrl,
  memberSince,
  city,
  country,
  bio,
  levelName,
  showBackToWall,
}: {
  name: string;
  avatarUrl: string | null;
  memberSince: string | null;
  city?: string | null;
  country?: string | null;
  bio?: string | null;
  levelName?: string | null;
  showBackToWall?: boolean;
}) {
  const place = [city, country].filter(Boolean).join(', ');
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gold-500 to-forest-900 text-cream-50 p-6 md:p-8 shadow-hero">
      <div
        className="absolute -top-16 -right-12 w-72 h-72 bg-gold-400/20 rounded-full blur-3xl pointer-events-none"
        aria-hidden
      />
      <div className="relative">
        {showBackToWall && (
          <Link
            href="/dashboard/vip/miray"
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-cream-100/90 hover:text-cream-50 mb-4 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.4} />
            Retounen nan Miray VIP
          </Link>
        )}
        <div className="flex items-center gap-4 md:gap-5">
          <span className="shrink-0 rounded-full ring-2 ring-gold-200/60">
            <Avatar size={84} src={avatarUrl} alt={name} />
          </span>
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-200 mb-1.5">
              <Crown className="w-3.5 h-3.5" strokeWidth={2.4} />
              Manm Hoïs Melis
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold leading-tight truncate">
              {name}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-cream-200/90">
              {levelName && (
                <span className="inline-flex items-center gap-1 font-semibold text-gold-200">
                  <Crown className="w-3 h-3" strokeWidth={2.4} />
                  {levelName}
                </span>
              )}
              {memberSince && (
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="w-3 h-3" strokeWidth={2.2} />
                  Manm depi {dateHT(memberSince)}
                </span>
              )}
              {place && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" strokeWidth={2.2} />
                  {place}
                </span>
              )}
            </div>
            {bio && (
              <p className="mt-2.5 text-sm text-cream-100/90 leading-relaxed max-w-2xl">
                {bio}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function LevelCard({
  level,
  levelName,
  streak,
  unlockedBadges,
  totalBadges,
}: {
  level: number;
  levelName: string;
  streak: number;
  unlockedBadges: number;
  totalBadges: number;
}) {
  const pct =
    totalBadges > 0 ? Math.round((unlockedBadges / totalBadges) * 100) : 0;
  return (
    <section className="bg-white border border-gold-200 rounded-2xl p-5 md:p-6 shadow-card">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-gold-700 font-semibold mb-1">
            <Crown className="w-3 h-3" strokeWidth={2.4} />
            Nivo manm
          </div>
          <h2 className="font-display text-xl md:text-2xl font-bold text-ink">
            Nivo {level} · {levelName}
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold-50 border border-gold-200 text-sm font-bold text-gold-700">
          <Flame className="w-4 h-4" strokeWidth={2.2} />
          {streak} jou seri
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[12px] text-earth-600 mb-1.5">
          <span>Pwogrè nivo (badj)</span>
          <span className="font-semibold text-ink">
            {unlockedBadges} / {totalBadges}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-cream-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-forest-500 to-gold-400 transition-[width] duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-earth-500">
          Chak badj ou debloke fè w monte yon nivo.
        </p>
      </div>
    </section>
  );
}

export function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
}) {
  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-4 shadow-card">
      <span className="grid place-items-center w-9 h-9 rounded-xl bg-gold-100 text-gold-700 mb-2.5">
        <Icon className="w-5 h-5" strokeWidth={2} />
      </span>
      <div className="font-display text-2xl font-bold text-ink leading-none">
        {value}
      </div>
      <div className="text-[11px] text-earth-600 mt-1 leading-tight">{label}</div>
    </div>
  );
}

export function SectionCard({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
      <header className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-display text-lg md:text-xl font-bold text-ink inline-flex items-center gap-2">
          <Icon className="w-5 h-5 text-forest-700" strokeWidth={2} />
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}
