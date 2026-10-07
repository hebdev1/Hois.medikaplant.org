import Link from 'next/link';
import { ArrowUpRight, Crown } from 'lucide-react';
import { PLANS } from '@/app/checkout/plans';

// Compact "upgrade to Melis" banner for Melis-only sections, styled like the
// non-Melis state of /dashboard/vip. Prices come from the checkout catalog.
export default function MelisUpsell({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const melis = PLANS.vip;
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gold-500 to-forest-900 text-cream-50 p-6 md:p-7 shadow-card">
      <div
        className="absolute -top-16 -right-12 w-72 h-72 bg-gold-400/20 rounded-full blur-3xl pointer-events-none"
        aria-hidden
      />
      <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-5">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-200 mb-3">
            <Crown className="w-3.5 h-3.5" strokeWidth={2.4} />
            Hoïs Melis
          </div>
          <h2 className="font-display text-2xl md:text-[26px] font-bold leading-tight">{title}</h2>
          <p className="mt-2 text-sm md:text-[15px] text-cream-200/90 leading-relaxed">{description}</p>
        </div>
        <div className="shrink-0 flex flex-col items-start md:items-end gap-1.5">
          <Link
            href="/checkout?plan=vip&cycle=yearly"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gold-400 hover:bg-gold-300 text-forest-900 font-bold text-sm shadow-sm transition"
          >
            Pase sou Melis
            <ArrowUpRight className="w-4 h-4" strokeWidth={2.4} />
          </Link>
          <span className="text-[12px] text-cream-200/80">
            ${melis.priceYearlyDiscounted.toFixed(2)} / ane oswa ${melis.priceMonthly.toFixed(2)} / mwa
          </span>
        </div>
      </div>
    </section>
  );
}
