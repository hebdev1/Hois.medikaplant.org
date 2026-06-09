'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { ArcGalleryHero } from './arc-gallery-hero-component';

// ───────────────────────────────────────────────────────────────────────────
// MedikaPlant landing hero — Arc Gallery variant.
//
// Twelve curated Unsplash photos (plants, herbs, tea, wellness) form a
// semicircle at the top of the section. Headline + subtitle in Kreyòl,
// brand-themed CTAs route to the existing checkout + pricing anchor.
//
// Image strategy: pick photos that already convey the platform's pillars —
// herbal medicine, tea/brews, leaves, nature — so the visual carries the
// promise before any words are read. Images go through Unsplash's CDN with
// `w=400&q=80&fit=crop` so they're small enough for a fast initial paint.
// ───────────────────────────────────────────────────────────────────────────

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1505578360635-fbf6d97ed4ae?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1465379944081-7f47de8d74ac?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502230831726-fe5549140034?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1466637574441-749b8f19452f?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1467043237213-65f2da53396f?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1496449903678-68ddcb189a24?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470081636430-b65dec22f7ec?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1444858345346-58bbac263b59?q=80&w=400&auto=format&fit=crop',
];

const IMAGE_ALTS = [
  'Plant medicine ingredients',
  'Èrboris hand-grinding herbs',
  'Mortar and pestle with herbs',
  'Cup of herbal tea',
  'Fresh lavender',
  'Healing herbs',
  'Forest plants',
  'Herbal flat lay',
  'Plant-based tea ritual',
  'Green leaves close-up',
  'Mint plant',
  'Forest light through trees',
];

export default function HeroSection() {
  return (
    <section
      id="akey"
      className="relative w-full overflow-hidden bg-gradient-to-b from-brand-50/60 via-white to-white"
    >
      {/* Brand-tinted blur orbs behind the gallery */}
      <div
        className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-brand-200/30 rounded-full blur-3xl pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute -bottom-40 -left-20 w-[420px] h-[420px] bg-accent/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden
      />

      <ArcGalleryHero
        images={HERO_IMAGES}
        altFor={(i) => IMAGE_ALTS[i] ?? `Plant ${i + 1}`}
        className="!bg-transparent"
        eyebrow={
          <span className="inline-flex items-center gap-2 border border-brand-200 bg-white/70 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm text-sm">
            <Sparkles className="w-4 h-4 text-brand-600" strokeWidth={2.2} />
            <span className="text-ink/80">
              Nouvo:{' '}
              <span className="font-semibold text-ink">Plan Hoïs VIP 2026</span>{' '}
              louvri
            </span>
          </span>
        }
        title={
          <>
            Geri ak <span className="text-brand-600">fòs lanati</span>,
            <br className="hidden sm:block" /> viv ak lasajès Hoïs.
          </>
        }
        subtitle="MedikaPlant pote pou ou remèd fèy, konsiltasyon natiropatik, ak yon kominote VIP ki rasin nan medsin tradisyonèl ayisyen — pou pran swen kò ou, lespri ou, ak nanm ou."
        ctas={[
          { label: 'Kòmanse Vwayaj ou', href: '#pri', variant: 'primary' },
          { label: 'Dekouvri Pwodui yo', href: '#pwodui', variant: 'secondary' },
        ]}
      />
    </section>
  );
}
