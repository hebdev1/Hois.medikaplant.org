import Link from 'next/link';
import { Flame, ChevronRight, Sparkles } from 'lucide-react';
import ProgressPlant from './progress-plant';
import ShareAdviceButton from './share-advice-button';
import { sanitizeGuideHtml } from '@/lib/sanitize-html';

type HeroProps = {
  userShortName: string;
  planName: string;
  planVariant: string;
  dayOfPlan: number;
  totalDays: number;
  streak: number;
  doneToday: number;
  totalToday: number;
  todayCompletion: number;
  todayLabel: string;
  dailyAdvice: {
    date: string;
    bodyHtml: string;
    plant: string;
  };
};

export default function Hero({
  userShortName,
  planName,
  planVariant,
  dayOfPlan,
  totalDays,
  streak,
  doneToday,
  totalToday,
  todayCompletion,
  todayLabel,
  dailyAdvice,
}: HeroProps) {
  const planProgress =
    ((dayOfPlan - 1) / totalDays + todayCompletion / totalDays) * 100;

  return (
    <section className="grid gap-5">
      {/* Main hero card */}
      <div className="relative grid md:grid-cols-[1.5fr_1fr] gap-6 bg-gradient-to-br from-forest-800 to-forest-900 text-cream-50 rounded-3xl p-6 md:p-8 lg:p-10 shadow-hero overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(231, 142, 23,0.35) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
          aria-hidden
        />
        <div
          className="absolute -top-32 -right-20 w-[420px] h-[420px] bg-forest-500/20 rounded-full blur-3xl pointer-events-none"
          aria-hidden
        />

        {/* LEFT — greeting */}
        <div className="relative flex flex-col">
          <div className="text-xs uppercase tracking-[0.2em] text-cream-200/80 mb-3 flex items-center gap-2 flex-wrap">
            <span>{todayLabel}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold-400/15 text-gold-300 normal-case tracking-normal text-[11px] font-semibold">
              <Flame className="w-3 h-3" strokeWidth={2.2} />
              {streak} jou seri
            </span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight">
            Bonjou, <em className="text-gold-300 not-italic">{userShortName}</em>.
            <br />
            <span className="text-cream-50/90">Pyebwa ou ap pouse.</span>
          </h1>

          <p className="mt-4 text-sm md:text-base text-cream-200 leading-relaxed max-w-xl">
            Ou nan jou{' '}
            <strong className="text-gold-300">{dayOfPlan}</strong> sou {totalDays} nan plan{' '}
            <em className="font-serif text-cream-50">
              {planName} — {planVariant}
            </em>
            . Jodi a {doneToday} sou {totalToday} aktivite fini.
          </p>

          {/* Plan strip */}
          <div className="mt-6 grid sm:grid-cols-[auto_1px_1fr] items-center gap-4 sm:gap-5 bg-forest-900/50 border border-cream-50/10 rounded-2xl px-4 py-3.5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-cream-200/60">
                Plan aktif
              </div>
              <div className="font-display font-semibold text-base mt-0.5">
                {planName}
              </div>
            </div>
            <div className="hidden sm:block w-px h-10 bg-cream-50/10" />
            <div className="flex-1">
              <div className="h-2 rounded-full bg-cream-50/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gold-400 to-forest-400 transition-[width] duration-1000 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, planProgress))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-cream-200/80 mt-1.5">
                <span>
                  <strong className="text-cream-50">{Math.round(planProgress)}%</strong> konplete
                </span>
                <span>{Math.max(0, totalDays - dayOfPlan)} jou rete</span>
              </div>
            </div>
          </div>

          <Link
            href="/dashboard/programs"
            className="mt-5 self-start inline-flex items-center gap-2 bg-gold-400 hover:bg-gold-300 text-forest-900 font-semibold px-5 py-2.5 rounded-full transition shadow-plant"
          >
            Kontinye sesyon jou a
            <ChevronRight className="w-4 h-4" strokeWidth={2.4} />
          </Link>
        </div>

        {/* RIGHT — progress plant */}
        <div className="relative min-h-[340px]">
          <ProgressPlant
            day={dayOfPlan}
            total={totalDays}
            todayCompletion={todayCompletion}
          />
        </div>
      </div>

      {/* Daily advice card */}
      <article className="bg-cream-50 border border-cream-200 rounded-2xl p-5 md:p-6 grid md:grid-cols-[1fr_auto] gap-4 md:items-center">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-forest-600 font-semibold flex items-center gap-2 mb-2">
            <Sparkles className="w-3 h-3" strokeWidth={2.2} />
            Konsèy jou a
            <span aria-hidden className="text-earth-500">·</span>
            <span className="font-normal text-earth-500 tracking-normal normal-case">
              {dailyAdvice.date}
            </span>
          </div>
          <p
            className="font-serif text-lg md:text-xl text-ink leading-snug"
            dangerouslySetInnerHTML={{
              __html: sanitizeGuideHtml(dailyAdvice.bodyHtml),
            }}
          />
          <div className="font-serif italic text-sm text-earth-600 mt-2">
            {dailyAdvice.plant}
          </div>
        </div>

        <div className="flex items-center gap-2 md:flex-col md:items-stretch">
          <ShareAdviceButton
            bodyHtml={dailyAdvice.bodyHtml}
            plant={dailyAdvice.plant}
            date={dailyAdvice.date}
          />
        </div>
      </article>
    </section>
  );
}
