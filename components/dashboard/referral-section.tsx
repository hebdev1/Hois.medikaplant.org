'use client';

import React from 'react';
import { Copy, Check, Share2, Gift, Users as UsersIcon } from 'lucide-react';

type ReferralStats = {
  link: string;
  code: string;
  signedUpCount: number;
  pendingCreditCount: number;
  consumedCreditCount: number;
  recent: Array<{ email: string; signed_up_at: string | null }>;
};

const MONTHS_HT = [
  'Jan', 'Fev', 'Mas', 'Avr', 'Me', 'Jen',
  'Jiy', 'Out', 'Sep', 'Okt', 'Nov', 'Des',
];
function formatDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MONTHS_HT[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Member-facing referral / "Envite zanmi" panel for /dashboard/settings.
 * Shows the inviter's personal link with a one-click copy button, plus a
 * tally of pending credits (10% off the next renewal) and a list of
 * recent signups that came through the link.
 */
export default function ReferralSection({ stats }: { stats: ReferralStats }) {
  const [copied, setCopied] = React.useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(stats.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Older browsers: fall back to a hidden textarea select.
      const el = document.createElement('textarea');
      el.value = stats.link;
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand('copy');
      } catch {
        /* nothing to do */
      }
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function shareNative() {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      navigator
        .share({
          title: 'Vin manm Hoïs MedikaPlant',
          text: 'Mwen vle envite w nan kominote Hoïs ak yon ti rabè:',
          url: stats.link,
        })
        .catch(() => {
          /* user dismissed */
        });
    } else {
      copyLink();
    }
  }

  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
      <header className="mb-4">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-gold-100 text-gold-800 text-[10px] font-bold uppercase tracking-wider mb-2">
          <Gift className="w-3 h-3" strokeWidth={2.4} />
          Envite zanmi w
        </div>
        <h2 className="font-display text-xl md:text-2xl font-bold text-ink">
          Pataje, epi resevwa <em className="text-brand-600 not-italic">10% off</em> sou pwochen renouvèlman ou
        </h2>
        <p className="text-sm text-earth-600 mt-1 leading-relaxed">
          Chak fwa yon moun enskri via lyen pèsonèl ou, ou resevwa 10%
          otomatik sou pwochen renouvèlman plan ou. Pa gen limit — plis ou
          envite, plis kredi ou jenere.
        </p>
      </header>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat label="Enskri" value={stats.signedUpCount} tone="forest" />
        <Stat
          label="Kredi disponib"
          value={stats.pendingCreditCount}
          tone="gold"
        />
        <Stat
          label="Deja itilize"
          value={stats.consumedCreditCount}
          tone="cream"
        />
      </div>

      {/* Link + copy */}
      <div className="rounded-xl bg-cream-50 border border-cream-200 p-3 flex items-center gap-2">
        <code className="flex-1 min-w-0 truncate text-xs font-mono text-ink select-all">
          {stats.link}
        </code>
        <button
          type="button"
          onClick={copyLink}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
            copied
              ? 'bg-forest-100 text-forest-700'
              : 'bg-forest-700 hover:bg-forest-800 text-cream-50'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" strokeWidth={2.4} />
              Kopye
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" strokeWidth={2.4} />
              Kopye
            </>
          )}
        </button>
        <button
          type="button"
          onClick={shareNative}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-cream-300 hover:border-forest-400 hover:bg-cream-50 transition shrink-0"
          aria-label="Pataje"
        >
          <Share2 className="w-3.5 h-3.5" strokeWidth={2.4} />
          Pataje
        </button>
      </div>
      <div className="mt-2 text-[10px] text-earth-500">
        Kòd referans ou: <code className="font-mono text-ink">{stats.code}</code>
      </div>

      {/* Recent signups */}
      {stats.recent.length > 0 && (
        <div className="mt-5 border-t border-cream-100 pt-4">
          <h3 className="text-[10px] uppercase tracking-wider text-earth-600 font-bold mb-2 flex items-center gap-1.5">
            <UsersIcon className="w-3 h-3" strokeWidth={2.4} />
            Dènye enskripsyon yo
          </h3>
          <ul className="space-y-1.5">
            {stats.recent.slice(0, 5).map((r, i) => (
              <li
                key={`${r.email}-${i}`}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="text-ink truncate">{r.email}</span>
                <span className="text-earth-500 font-mono shrink-0">
                  {formatDate(r.signed_up_at)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'forest' | 'gold' | 'cream';
}) {
  const toneStyles: Record<typeof tone, string> = {
    forest: 'bg-forest-50 border-forest-200 text-forest-800',
    gold: 'bg-gold-50 border-gold-200 text-gold-800',
    cream: 'bg-cream-50 border-cream-200 text-earth-800',
  } as const;
  return (
    <div className={`rounded-xl border p-3 ${toneStyles[tone]}`}>
      <div className="text-[9px] uppercase tracking-wider font-bold opacity-80 mb-0.5">
        {label}
      </div>
      <div className="font-display text-xl font-bold tracking-tight">
        {value}
      </div>
    </div>
  );
}
