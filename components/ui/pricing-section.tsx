'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import NumberFlow from '@number-flow/react';
import { CheckCheck, Sparkles, Crown, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TimelineContent } from '@/components/ui/timeline-animation';
import { VerticalCutReveal } from '@/components/ui/vertical-cut-reveal';

/**
 * Hoïs dual-cycle pricing section. Replaces the previous bento layout
 * with a monthly/yearly toggle. Pricing math is mirrored from the
 * subscription_plans table seeded in migration 037 — see CONTENT_VOICE.md
 * for the brand tone.
 *
 * Pricing rules:
 *   • Yearly displayed shows BOTH the original yearly and the 10%-off
 *     discounted price + a "Save $X" pill.
 *   • Monthly = yearly_original / 12, no discount.
 *   • Default toggle position = Yearly (the cheaper-per-month option).
 *   • Yearly = "Best Value" / "Save 10%".
 */

type Plan = {
  id: 'basic' | 'premium' | 'vip';
  name: string;
  description: string;
  // Yearly view (after 10% discount applied)
  yearlyDiscounted: number;
  yearlyOriginal: number;
  // Monthly view (yearly_original / 12)
  monthly: number;
  popular?: boolean;
  features: string[];
  icon: typeof Leaf;
  accent: string;
};

const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Hoïs Bazilik',
    description: 'Pòt antre nan inivè VIP la — pou kòmanse vwayaj sante w.',
    yearlyDiscounted: 121.5,
    yearlyOriginal: 135,
    monthly: 11.25,
    icon: Leaf,
    accent: '#65881a',
    features: [
      'Dokiman ak echantiyon pwodui gratis',
      'Aksè privilejye nan aktivite Hoïs',
      'Rabè sou MedikaplantShop',
      'Rabè sou sèvis ak kou Hoïs Inivèsite',
      'Konsèy ak sipò sipirityèl tradisyonèl',
    ],
  },
  {
    id: 'premium',
    name: 'Hoïs Sitwonèl',
    description: 'Plan ki pi popilè — plis aksè, plis gidans, pi bon valè.',
    yearlyDiscounted: 157.5,
    yearlyOriginal: 175,
    monthly: 14.58,
    popular: true,
    icon: Sparkles,
    accent: '#e78e17',
    features: [
      'Tout sa ki nan Bazilik',
      'Aksè davans pou li kèk pòs anvan li piblik',
      'Salon, prezantasyon, fòmasyon gratis VIP',
      'Motivasyon ak gidans espirityèl',
      'Aksè priyoritè nan sipò chat la',
    ],
  },
  {
    id: 'vip',
    name: 'Hoïs Melis',
    description: 'Eksperyans VIP ki pi konplè — ak Vye Ewòl li menm.',
    yearlyDiscounted: 224.1,
    yearlyOriginal: 249,
    monthly: 20.75,
    icon: Crown,
    accent: '#985c0c',
    features: [
      'Tout sa ki nan Sitwonèl',
      'Konsiltasyon patikilye sou ka maladi mistik',
      'Non w pibliye nan paj Hoïs VIP',
      'Yon konvèsasyon konfidansyèl 21 min ak Vye Ewòl',
      'Limyè eksklizif (Primè) sou gwo fenomèn',
    ],
  },
];

function PricingSwitch({
  isYearly,
  onSwitch,
}: {
  isYearly: boolean;
  onSwitch: (yearly: boolean) => void;
}) {
  return (
    <div className="flex justify-center">
      <div className="relative z-10 mx-auto flex w-fit rounded-2xl bg-cream-50 border border-cream-200 p-1 shadow-sm">
        <button
          type="button"
          onClick={() => onSwitch(false)}
          className={cn(
            'relative z-10 w-fit cursor-pointer h-12 rounded-xl sm:px-6 px-4 font-semibold transition-colors text-sm sm:text-base',
            !isYearly ? 'text-white' : 'text-earth-700 hover:text-ink'
          )}
        >
          {!isYearly && (
            <motion.span
              layoutId="hois-pricing-switch"
              className="absolute top-0 left-0 h-12 w-full rounded-xl shadow-sm"
              style={{
                background:
                  'linear-gradient(to top, #435b12, #65881a, #435b12)',
                border: '2px solid #435b12',
                boxShadow: '0 6px 24px -8px rgba(45,90,27,0.55)',
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative">Pa mwa</span>
        </button>

        <button
          type="button"
          onClick={() => onSwitch(true)}
          className={cn(
            'relative z-10 w-fit cursor-pointer h-12 rounded-xl sm:px-6 px-4 font-semibold transition-colors text-sm sm:text-base',
            isYearly ? 'text-white' : 'text-earth-700 hover:text-ink'
          )}
        >
          {isYearly && (
            <motion.span
              layoutId="hois-pricing-switch"
              className="absolute top-0 left-0 h-12 w-full rounded-xl shadow-sm"
              style={{
                background:
                  'linear-gradient(to top, #985c0c, #e78e17, #985c0c)',
                border: '2px solid #985c0c',
                boxShadow: '0 6px 24px -8px rgba(133,105,21,0.55)',
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative flex items-center gap-2">
            Pa ane
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-bold',
                isYearly
                  ? 'bg-white/95 text-gold-700'
                  : 'bg-gold-100 text-gold-700'
              )}
            >
              Ekonomize 10%
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}

export default function PricingSection() {
  // Default = yearly (cheaper per month + the discount is the headline).
  const [isYearly, setIsYearly] = useState(true);
  const pricingRef = useRef<HTMLDivElement>(null);

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: 'blur(0px)',
      transition: { delay: i * 0.18, duration: 0.5 },
    }),
    hidden: {
      filter: 'blur(10px)',
      y: -20,
      opacity: 0,
    },
  };

  return (
    <section
      id="pri"
      className="relative w-full py-24 md:py-32 bg-gradient-to-b from-white via-brand-50/30 to-white overflow-hidden"
      ref={pricingRef}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/60 to-transparent"
      />
      <div
        aria-hidden
        className="absolute -top-32 right-1/4 w-[500px] h-[500px] bg-gold-100/30 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative max-w-7xl mx-auto px-4 md:px-12">
        {/* Heading */}
        <article className="text-center mb-12 space-y-5 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium">
            <Sparkles className="w-4 h-4" strokeWidth={2.2} />
            Plan Hoïs VIP
          </span>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-ink">
            <VerticalCutReveal
              splitBy="words"
              staggerDuration={0.15}
              staggerFrom="first"
              reverse={true}
              containerClassName="justify-center"
              transition={{
                type: 'spring',
                stiffness: 250,
                damping: 40,
                delay: 0,
              }}
            >
              Chwazi plan ki adapte ak vwayaj ou
            </VerticalCutReveal>
          </h2>

          <TimelineContent
            as="p"
            animationNum={0}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="text-base md:text-lg text-ink-muted leading-relaxed max-w-2xl mx-auto"
          >
            Twa nivo ladesyon. Chwazi pèyman mansyèl pou flèksibilite, oswa
            anyèl pou ekonomize 10% sou tout plan.
          </TimelineContent>

          <TimelineContent
            as="div"
            animationNum={1}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="pt-2"
          >
            <PricingSwitch isYearly={isYearly} onSwitch={setIsYearly} />
          </TimelineContent>
        </article>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-5 md:gap-6 max-w-[1180px] mx-auto pt-4">
          {PLANS.map((plan, index) => {
            const Icon = plan.icon;
            const displayPrice = isYearly ? plan.yearlyDiscounted : plan.monthly;
            const cycleSuffix = isYearly ? 'an' : 'mwa';
            const savingAnnual = plan.yearlyOriginal - plan.yearlyDiscounted;

            return (
              <TimelineContent
                key={plan.id}
                as="div"
                animationNum={2 + index}
                timelineRef={pricingRef}
                customVariants={revealVariants}
              >
                <Card
                  className={cn(
                    'relative border bg-white shadow-card overflow-hidden h-full flex flex-col',
                    plan.popular
                      ? 'border-gold-300 ring-2 ring-gold-200'
                      : 'border-cream-200'
                  )}
                  style={
                    plan.popular
                      ? {
                          background:
                            'linear-gradient(180deg, #fefcf6 0%, #ffffff 60%)',
                        }
                      : undefined
                  }
                >
                  {/* Top accent stripe */}
                  <span
                    aria-hidden
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ background: plan.accent }}
                  />

                  <CardHeader className="text-left pt-7">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="grid place-items-center w-10 h-10 rounded-xl shrink-0"
                          style={{
                            background: `${plan.accent}1A`,
                            color: plan.accent,
                            border: `1px solid ${plan.accent}33`,
                          }}
                        >
                          <Icon className="w-5 h-5" strokeWidth={2.2} />
                        </span>
                        <h3 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">
                          {plan.name}
                        </h3>
                      </div>
                      {plan.popular && (
                        <span
                          className="text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shadow"
                          style={{
                            background:
                              'linear-gradient(135deg, #e78e17, #985c0c)',
                          }}
                        >
                          ★ Best Value
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-ink-muted mt-2 mb-2 leading-relaxed">
                      {plan.description}
                    </p>

                    {/* Price block */}
                    <div className="mt-3">
                      {isYearly && (
                        <div className="text-sm text-earth-600 mb-1.5">
                          <span className="line-through text-earth-500">
                            ${plan.yearlyOriginal.toFixed(0)}
                          </span>
                          <span
                            className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                            style={{
                              background: '#e78e171A',
                              color: '#985c0c',
                              border: '1px solid #e78e1740',
                            }}
                          >
                            Ekonomize ${savingAnnual.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-bold text-ink leading-none">
                          $
                          <NumberFlow
                            value={displayPrice}
                            format={{
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }}
                            className="text-5xl font-bold"
                          />
                        </span>
                        <span className="text-base text-earth-600 ml-1">
                          / {cycleSuffix}
                        </span>
                      </div>
                      {!isYearly && (
                        <p className="mt-1.5 text-[11px] text-earth-500">
                          Chanje sou pèyman anyèl pou ekonomize 10%.
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col pt-0">
                    {/* CTA */}
                    <Link
                      href={`/checkout?plan=${plan.id}&cycle=${
                        isYearly ? 'yearly' : 'monthly'
                      }`}
                      className={cn(
                        'w-full text-center mb-6 px-6 py-3.5 text-base font-bold rounded-xl transition-all shadow-md',
                        plan.popular
                          ? 'text-white hover:brightness-110'
                          : 'border border-cream-200 text-ink hover:bg-cream-50'
                      )}
                      style={
                        plan.popular
                          ? {
                              background:
                                'linear-gradient(to top, #985c0c, #e78e17, #985c0c)',
                              boxShadow:
                                '0 10px 30px -10px rgba(133,105,21,0.55)',
                            }
                          : {
                              background:
                                'linear-gradient(to top, #f1ead7, #fefcf6)',
                            }
                      }
                    >
                      {plan.popular ? 'Vin manm Sitwonèl' : `Chwazi ${plan.name.split(' ').slice(-1)[0]}`}
                    </Link>

                    {/* Features */}
                    <div className="space-y-3 pt-4 border-t border-cream-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-earth-700">
                        Sa ki ladann
                      </h4>
                      <ul className="space-y-2.5">
                        {plan.features.map((feature, fi) => (
                          <li
                            key={fi}
                            className="flex items-start gap-3"
                          >
                            <span
                              className="mt-0.5 h-5 w-5 rounded-full grid place-items-center shrink-0"
                              style={{
                                background: `${plan.accent}1A`,
                                border: `1px solid ${plan.accent}40`,
                              }}
                            >
                              <CheckCheck
                                className="h-3 w-3"
                                strokeWidth={2.6}
                                style={{ color: plan.accent }}
                              />
                            </span>
                            <span className="text-sm text-ink/85 leading-relaxed">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TimelineContent>
            );
          })}
        </div>

        {/* Reassurance row */}
        <div className="mt-14 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-8 text-sm text-ink-muted">
          <span className="flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-brand-600" strokeWidth={3} />
            Pèman sekirize
          </span>
          <span
            aria-hidden
            className="hidden md:inline-block w-1 h-1 rounded-full bg-slate-300"
          />
          <span className="flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-brand-600" strokeWidth={3} />
            Anile nenpòt lè
          </span>
          <span
            aria-hidden
            className="hidden md:inline-block w-1 h-1 rounded-full bg-slate-300"
          />
          <span className="flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-brand-600" strokeWidth={3} />
            Sipò 24/7 nan kreyòl ak fransè
          </span>
        </div>
      </div>
    </section>
  );
}
