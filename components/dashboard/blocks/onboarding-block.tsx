import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Activity,
  Stethoscope,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

type Step = {
  done: boolean;
  title: string;
  body: string;
  href: string;
  cta: string;
  Icon: typeof Activity;
};

/**
 * Shown only to brand-new members (lifecycle='new'). Replaces the chart
 * blocks — a member who hasn't logged anything shouldn't be greeted by
 * empty/fake graphs. Gives 3 concrete first steps; each row turns green
 * once its underlying signal flips true.
 */
export default function OnboardingBlock({
  firstName,
  hasGoal,
  hasCondition,
  hasLoggedMetric,
}: {
  firstName: string;
  hasGoal: boolean;
  hasCondition: boolean;
  hasLoggedMetric: boolean;
}) {
  const steps: Step[] = [
    {
      done: hasGoal || hasCondition,
      title: 'Konplete pwofil sante ou',
      body: 'Di nou objektif ou ak kondisyon ou pou nou pèsonalize konsèy yo.',
      href: '/dashboard/settings',
      cta: 'Ranpli pwofil',
      Icon: Stethoscope,
    },
    {
      done: hasLoggedMetric,
      title: 'Anrejistre premye mezi ou',
      body: 'Sik nan san, tansyon, oswa pwa — premye chif la kòmanse istwa a.',
      href: '/dashboard/health',
      cta: 'Ajoute yon mezi',
      Icon: Activity,
    },
    {
      done: false,
      title: 'Eksplore premye gid ou',
      body: 'Aprann sou plant ki konekte ak kondisyon ou yo.',
      href: '/dashboard/guides',
      cta: 'Wè gid yo',
      Icon: BookOpen,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;

  return (
    <section className="bg-gradient-to-br from-forest-600 to-forest-800 text-cream-50 rounded-2xl shadow-card overflow-hidden relative">
      <div
        aria-hidden
        className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-2xl"
      />
      <div className="relative p-6 md:p-7">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-gold-200" strokeWidth={2.4} />
          <span className="text-[11px] uppercase tracking-[0.18em] text-cream-100/80 font-bold">
            Byenveni
          </span>
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-bold leading-tight">
          Ann mete tout bagay an plas, {firstName}
        </h2>
        <p className="mt-1.5 text-sm text-cream-100/85 max-w-lg">
          {doneCount} sou {steps.length} etap fini. Plis ou ranpli, plis Hoïs
          ka pèsonalize eksperyans ou.
        </p>

        <ul className="mt-5 space-y-2.5">
          {steps.map((step) => (
            <li key={step.title}>
              <Link
                href={step.href}
                className="group flex items-center gap-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 p-3 md:p-3.5 transition"
              >
                <span className="shrink-0">
                  {step.done ? (
                    <CheckCircle2 className="w-5 h-5 text-gold-200" strokeWidth={2.4} />
                  ) : (
                    <Circle className="w-5 h-5 text-cream-100/50" strokeWidth={2.2} />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-semibold ${
                      step.done ? 'text-cream-100/70 line-through' : 'text-white'
                    }`}
                  >
                    {step.title}
                  </div>
                  {!step.done && (
                    <div className="text-[12px] text-cream-100/70 leading-snug mt-0.5">
                      {step.body}
                    </div>
                  )}
                </div>
                {!step.done && (
                  <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-gold-200 group-hover:gap-2 transition-all">
                    {step.cta}
                    <ArrowRight className="w-3 h-3" strokeWidth={2.6} />
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
