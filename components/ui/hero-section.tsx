'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { ArcGalleryHero } from './arc-gallery-hero-component';

// ───────────────────────────────────────────────────────────────────────────
// MedikaPlant landing hero — Arc Gallery variant.
//
// Twelve curated photos themed around naturopathy + herbal medicine
// (mortar & pestle, fresh herbs, homeopathy globules, acupuncture, hands
// with sage, etc.) form a semicircle at the top of the section. Headline +
// subtitle in Kreyòl, brand-themed CTAs route to the existing checkout +
// pricing anchor.
//
// Source: Pexels (free, hot-linkable CDN). We size each photo to w=400 via
// Pexels' on-the-fly URL params so the arc loads fast on mobile. We
// considered Shutterstock + Pixabay too — Shutterstock blocks hot-linking
// (their CDN serves watermarked previews to unauthenticated requests) and
// Pixabay's search page returns 403 to scrapers, so Pexels is the lone
// open CDN that works without an API key. If we want even more diversity
// later, switch to authenticated Pixabay API.
// ───────────────────────────────────────────────────────────────────────────

const PX = '?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop';

const HERO_IMAGES = [
  `https://images.pexels.com/photos/163186/globuli-medical-bless-you-homeopathy-163186.jpeg${PX}`,
  `https://images.pexels.com/photos/105028/pexels-photo-105028.jpeg${PX}`,
  `https://images.pexels.com/photos/7523449/pexels-photo-7523449.jpeg${PX}`,
  `https://images.pexels.com/photos/8391429/pexels-photo-8391429.jpeg${PX}`,
  `https://images.pexels.com/photos/7615621/pexels-photo-7615621.jpeg${PX}`,
  `https://images.pexels.com/photos/6850901/pexels-photo-6850901.jpeg${PX}`,
  `https://images.pexels.com/photos/5480091/pexels-photo-5480091.jpeg${PX}`,
  `https://images.pexels.com/photos/5480036/pexels-photo-5480036.jpeg${PX}`,
  `https://images.pexels.com/photos/7526026/pexels-photo-7526026.jpeg${PX}`,
  `https://images.pexels.com/photos/7526062/pexels-photo-7526062.jpeg${PX}`,
  `https://images.pexels.com/photos/6076150/pexels-photo-6076150.jpeg${PX}`,
  `https://images.pexels.com/photos/7615466/pexels-photo-7615466.jpeg${PX}`,
];

const IMAGE_ALTS = [
  'Lavande + globil omeyopatik',
  'Mòtye nan mab ak fèy sou yon tab bwa',
  'Plant zòti (ortie) frè ak gout dlo',
  'Ton vye k ap prepare fèy ak yon gout esansyèl',
  'Konplèman natirèl ak fèy ginkgo sou mab',
  'Men ki kenbe fèy lasaj frè',
  'Mòtye ak fèy seche pou yon swen natirèl',
  'Ton vye k ap moulen engredyan ak peta fèy',
  'Engredyan remèd natirèl: mòtye, fyòl, fèy',
  'Fèy esansyèl ak mòtye sou yon fon jòn',
  'Akiponktirè k ap fè yon swen',
  'Fèy, jenjanm ak konplèman natirèl sou mab',
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
              Byenvini:{' '}
              <span className="font-semibold text-ink">nan Hoïs Inivèsite</span>{' '}
              
            </span>
          </span>
        }
        title={
          <>
            Viv ak <span className="text-brand-600">Lasajès tradisyonèl</span>,
            <br className="hidden sm:block" /> Ak nan limyè.
          </>
        }
        subtitle="Hoïs Inivèsite pote pou ou remèd fèy, konsiltasyon natiropatik, ak yon kominote VIP ki rasinen nan medsin tradisyonèl ayisyen  pou ede w pran swen kò w, lespri w, ak nanm ou."
        ctas={[
          { label: 'Kòmanse Vwayaj pa w', href: '#pri', variant: 'primary' },
          { label: 'Dekouvri avantaj yo', href: '#pwodui', variant: 'secondary' },
        ]}
      />
    </section>
  );
}
