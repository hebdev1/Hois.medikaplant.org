'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, ChevronRight, Leaf, ShieldCheck, Users } from 'lucide-react';

const TRUST_BADGES = [
  { icon: Users, label: '500+ Manm Hoïs' },
  { icon: ShieldCheck, label: 'Sètifye & Konfidansyèl' },
  { icon: Leaf, label: '100% Plant-Based' },
];

export default function HeroSection() {
  return (
    <section
      id="akey"
      className="relative w-full overflow-hidden bg-gradient-to-b from-brand-50/60 via-white to-white pb-24 md:pb-32"
    >
      {/* Decorative grid */}
      <div className="absolute inset-0 leaf-grid opacity-70 pointer-events-none" aria-hidden />
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-brand-200/30 rounded-full blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute -bottom-40 -left-20 w-[420px] h-[420px] bg-accent/10 rounded-full blur-3xl pointer-events-none" aria-hidden />

      <div className="relative max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32 pt-20 md:pt-28">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
          {/* LEFT — copy */}
          <div className="flex flex-col items-start animate-fadeUp">
            <div className="flex items-center gap-2 border border-brand-200 bg-white/70 backdrop-blur-sm rounded-full px-4 py-2 mb-6 shadow-sm">
              <Sparkles className="w-4 h-4 text-brand-600" strokeWidth={2.2} />
              <span className="text-sm text-ink/80">
                Nouvo: <span className="font-semibold text-ink">Plan Hoïs VIP 2026</span> louvri
              </span>
              <a href="#pri" className="flex items-center gap-1 text-brand-700 font-medium text-sm hover:gap-2 transition-all">
                Li plis
                <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
              </a>
            </div>

            <h1 className="text-4xl md:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight text-ink max-w-[640px]">
              Geri ak <span className="text-brand-600">fòs lanati</span>, viv ak lasajès Hoïs.
            </h1>

            <p className="mt-6 text-base md:text-lg text-ink-muted max-w-[560px] leading-relaxed">
              MedikaPlant pote pou ou remèd fèy, konsiltasyon natiropatik, ak yon kominote VIP ki rasin nan medsin tradisyonèl ayisyen — pou pran swen kò ou, lespri ou, ak nanm ou.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="#pri"
                className="group inline-flex items-center gap-2 bg-brand-gradient hover:brightness-110 text-white px-7 py-3.5 rounded-full font-semibold shadow-lg shadow-brand-600/20 transition-all"
              >
                Kòmanse Vwayaj ou
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.4} />
              </Link>
              <Link
                href="#pwodui"
                className="inline-flex items-center gap-2 border border-slate-300 hover:border-brand-400 hover:bg-brand-50/40 text-ink px-7 py-3.5 rounded-full font-medium transition-all"
              >
                <span>Dekouvri Pwodui yo</span>
                <ChevronRight className="w-4 h-4 opacity-60" strokeWidth={2.2} />
              </Link>
            </div>

            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
              {TRUST_BADGES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2 text-sm text-ink-muted">
                  <span className="grid place-items-center w-7 h-7 rounded-full bg-brand-100 text-brand-700">
                    <Icon className="w-3.5 h-3.5" strokeWidth={2.4} />
                  </span>
                  <span className="font-medium text-ink/80">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT — visual */}
          <div className="relative animate-fadeUp" style={{ animationDelay: '120ms' }}>
            <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-card border border-white/40">
              <Image
                src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80"
                alt="Fèy ak plant medisinal Ayisyen"
                fill
                priority
                sizes="(min-width: 1024px) 540px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
            </div>

            {/* Floating stat card */}
            <div className="absolute -left-4 md:-left-10 bottom-10 bg-white rounded-2xl shadow-card p-4 flex items-center gap-3 max-w-[240px] animate-fadeUp" style={{ animationDelay: '320ms' }}>
              <div className="grid place-items-center w-12 h-12 rounded-xl bg-brand-100 text-brand-700">
                <Leaf className="w-6 h-6" strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-xs text-ink-muted">Manm aktif</p>
                <p className="text-xl font-bold text-ink leading-tight">5 200+</p>
              </div>
            </div>

            {/* Floating quote card */}
            <div className="absolute -right-4 md:-right-8 top-8 bg-white rounded-2xl shadow-card p-4 max-w-[230px] animate-fadeUp" style={{ animationDelay: '440ms' }}>
              <div className="flex items-center gap-1 text-amber-500 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M10 1.5l2.6 5.4 5.9.6-4.3 4.1 1.1 5.8L10 14.7 4.7 17.4l1.1-5.8L1.5 7.5l5.9-.6z" />
                  </svg>
                ))}
              </div>
              <p className="text-xs text-ink-muted leading-snug">
                &ldquo;Hoïs chanje vi mwen — kò m vin pi an sante, lespri m vin pi limen.&rdquo;
              </p>
              <p className="text-xs font-semibold text-ink mt-2">— Marie L., Pòtoprens</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
