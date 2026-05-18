import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import BadgeArt from './badge-art';

export type DashboardBadge = {
  id: string;
  name: string;
  sub: string;
  unlocked: boolean;
  justUnlocked?: boolean;
  progress?: number; // 0..1
  icon:
    | 'sprout'
    | 'leaf'
    | 'droplet'
    | 'flame'
    | 'activity'
    | 'target'
    | 'calendar'
    | 'star';
};

type BadgesPanelProps = {
  badges: DashboardBadge[];
  level: number;
  levelName: string;
};

export default function BadgesPanel({
  badges,
  level,
  levelName,
}: BadgesPanelProps) {
  const unlocked = badges.filter((b) => b.unlocked).length;

  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
      <header className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">
            Badj ou <em className="text-gold-500 not-italic font-bold">genyen</em>
          </h2>
          <p className="text-xs text-earth-600 mt-0.5">
            {unlocked} sou {badges.length} · Niv. {level} · {levelName}
          </p>
        </div>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700 hover:text-forest-800 transition shrink-0"
        >
          Wè tout
          <ChevronRight className="w-3 h-3" strokeWidth={2.4} />
        </Link>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {badges.map((b) => (
          <div
            key={b.id}
            className={`relative bg-cream-50 border rounded-xl p-3 text-center flex flex-col items-center gap-1.5 transition ${
              b.unlocked
                ? 'border-gold-200 hover:border-gold-300'
                : 'border-cream-200 opacity-70 hover:opacity-100'
            }`}
          >
            {b.justUnlocked && (
              <span className="absolute -top-1.5 right-2 inline-flex items-center px-1.5 py-0.5 rounded-full bg-gold-400 text-forest-900 text-[9px] font-bold uppercase tracking-wide shadow">
                Nouvo
              </span>
            )}
            <BadgeArt icon={b.icon} unlocked={b.unlocked} />
            <div className="text-[11px] font-semibold text-ink leading-tight mt-1 line-clamp-1">
              {b.name}
            </div>
            <div className="text-[10px] text-earth-500 leading-tight line-clamp-1">
              {b.sub}
            </div>
            {!b.unlocked && b.progress !== undefined && (
              <div className="w-full h-1 rounded-full bg-cream-200 mt-1 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-forest-400 to-gold-400 transition-[width] duration-700"
                  style={{ width: `${Math.round(b.progress * 100)}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
