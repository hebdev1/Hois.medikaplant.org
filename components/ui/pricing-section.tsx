'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type Plan = {
  key: 'basic' | 'premium' | 'vip';
  name: string;
  tagline: string;
  price: number;
  period: string;
  popular?: boolean;
  features: string[];
  ctaLabel: string;
  accentClass: string;
  buttonClass: string;
};

const PLANS: Plan[] = [
  {
    key: 'basic',
    name: 'Hoïs Bazilik',
    tagline: 'Pòt antre nan inivè VIP la',
    price: 350,
    period: '1 Ane',
    features: [
      'Dokiman ak echantiyon pwodui gratis',
      'Aksè privilejye nan aktivite Hoïs & Medikaplant',
      'Rabè sou MedikaplantShop',
      'Rabè sou sèvis ak kou Hoïs Inivèsite ofri yo',
      'Salon, prezantasyon, fòmasyon gratis sou gwoup Hoïs VIP a',
      'Konsèy, kèk sipò sipirityèl ak medsin Tradisyonèl ayisyen',
    ],
    ctaLabel: 'Vin manm',
    accentClass: 'border-slate-200',
    buttonClass: 'bg-accent-gradient hover:brightness-110 text-white',
  },
  {
    key: 'premium',
    name: 'Hoïs Sitwonèl',
    tagline: 'Plan ki pi popilè',
    price: 600,
    period: '2 Ane',
    popular: true,
    features: [
      'Dokiman ak echantiyon pwodui gratis',
      'Aksè davans pou li kèk pòs anvan li piblik',
      'Aksè privilejye nan aktivite Hoïs & Medikaplant',
      'Rabè sou MedikaplantShop',
      'Rabè sou sèvis ak kou Hoïs Inivèsite ofri yo',
      'Salon, prezantasyon, fòmasyon gratis sou gwoup Hoïs VIP a',
      'Konsèy, kèk sipò sipirityèl ak medsin Tradisyonèl ayisyen',
      'Motivasyon ak gidans espirityèl',
    ],
    ctaLabel: 'Vin manm',
    accentClass: 'border-teal-300/70 ring-2 ring-teal-300/40 shadow-cardHover',
    buttonClass: 'bg-popular-gradient hover:brightness-110 text-white',
  },
  {
    key: 'vip',
    name: 'Hoïs Melis',
    tagline: 'Eksperyans VIP ki pi konplè',
    price: 800,
    period: '3 Ane',
    features: [
      'Tout kontni ki nan plan presedan yo',
      'Konsiltasyon patikilye nan yon ka maladi mistik',
      'Sansibilizasyon pou itilize remèd fèy',
      'Non w pibliye nan paj Hoïs VIP sou Medikaplant.org',
      'Mayo gratis Hoïs & Medikaplant ak lòt sipriz',
      'Yon konvèsasyon konfidansyèl 21 minit ak Vye Ewòl',
      'Limyè eksklizif (Primè) sou gwo fenomèn mondyal',
    ],
    ctaLabel: 'Vin manm',
    accentClass: 'border-slate-200',
    buttonClass: 'bg-accent-gradient hover:brightness-110 text-white',
  },
];

export default function PricingSection() {
  return (
    <section
      id="pri"
      className="relative w-full py-24 md:py-32 bg-gradient-to-b from-white via-brand-50/30 to-white overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/60 to-transparent" aria-hidden />
      <div className="absolute -top-32 right-1/4 w-[500px] h-[500px] bg-brand-200/20 rounded-full blur-3xl pointer-events-none" aria-hidden />

      <div className="relative max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
        {/* Heading */}
        <div className="flex flex-col items-center text-center max-w-[760px] mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" strokeWidth={2.2} />
            Plan Hoïs VIP
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-ink">
            Chwazi plan ki <span className="text-brand-600">adapte ak vwayaj</span> ou
          </h2>
          <p className="mt-5 text-base md:text-lg text-ink-muted leading-relaxed">
            Twa nivo ladesyon pou rantre nan kominote Hoïs la. Chak plan louvri pòt pou pi gwo aksè a remèd fèy, konsèy espirityèl, ak yon eksperyans natiropatik konplè.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-[1180px] mx-auto">
          {PLANS.map((plan) => (
            <article
              key={plan.key}
              className={cn(
                'relative bg-white rounded-3xl p-8 md:p-9 shadow-card card-lift flex flex-col border',
                plan.accentClass,
                plan.popular && 'md:-translate-y-3'
              )}
            >
              {plan.popular && (
                <span className="absolute top-5 right-5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                  <span className="text-amber-500">★</span> Popilè
                </span>
              )}

              {/* Header */}
              <header className="mb-6">
                <h3 className="text-xl md:text-2xl font-bold text-ink tracking-tight">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-ink-muted">{plan.tagline}</p>
              </header>

              {/* Price */}
              <div className="flex items-end gap-2 mb-8 pb-8 border-b border-slate-100">
                <span className="text-lg font-medium text-ink-muted leading-none mt-2">$</span>
                <span className="text-5xl md:text-6xl font-extrabold text-ink tracking-tight leading-none">
                  {plan.price}
                </span>
                <span className="text-sm text-ink-muted mb-1.5">/ {plan.period}</span>
              </div>

              {/* Features */}
              <ul className="flex-1 space-y-3.5 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 items-start">
                    <span
                      className={cn(
                        'mt-0.5 grid place-items-center w-5 h-5 rounded-full shrink-0',
                        plan.popular
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-brand-100 text-brand-700'
                      )}
                    >
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </span>
                    <span className="text-sm text-ink/80 leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={`/checkout?plan=${plan.key}`}
                className={cn(
                  'w-full text-center px-6 py-3.5 rounded-full font-semibold transition-all shadow-md',
                  plan.buttonClass
                )}
              >
                {plan.ctaLabel}
              </Link>
            </article>
          ))}
        </div>

        {/* Reassurance */}
        <div className="mt-14 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-8 text-sm text-ink-muted">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-brand-600" strokeWidth={3} />
            Pèman sekirize
          </span>
          <span className="hidden md:inline-block w-1 h-1 rounded-full bg-slate-300" aria-hidden />
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-brand-600" strokeWidth={3} />
            Anile nenpòt lè
          </span>
          <span className="hidden md:inline-block w-1 h-1 rounded-full bg-slate-300" aria-hidden />
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-brand-600" strokeWidth={3} />
            Sipò 24/7 nan kreyòl ak fransè
          </span>
        </div>
      </div>
    </section>
  );
}
