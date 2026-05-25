import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import FeatureCarousel from '@/components/ui/feature-carousel';

/**
 * Section "Kisa HOÏS ye?" sur la landing page. Précédemment composée de
 * quatre cartes piliers statiques ; remplacée maintenant par
 * <FeatureCarousel /> qui fait tourner huit concepts HOÏS (Limyè, Zèv
 * Limyè, Granmèt Souf, Charit, Lanati, Espirityalite, Kominote,
 * Tradisyon) avec animation pill ↔ image et auto-play. Voir
 * CONTENT_VOICE.md pour le ton.
 */
export default function HoisSection() {
  return (
    <section
      id="hois"
      className="relative w-full py-24 md:py-32 overflow-hidden bg-gradient-to-b from-white via-amber-50/30 to-white"
    >
      {/* Decorative orbs */}
      <div
        aria-hidden
        className="absolute top-20 -left-32 w-[480px] h-[480px] rounded-full blur-3xl opacity-30"
        style={{
          background:
            'radial-gradient(circle, rgba(201,162,39,0.35) 0%, transparent 60%)',
        }}
      />
      <div
        aria-hidden
        className="absolute bottom-10 -right-40 w-[520px] h-[520px] rounded-full blur-3xl opacity-25"
        style={{
          background:
            'radial-gradient(circle, rgba(90,145,56,0.30) 0%, transparent 60%)',
        }}
      />

      <div className="relative max-w-[1280px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
        {/* Eyebrow + headline */}
        <div className="text-center max-w-[760px] mx-auto mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/80 border border-amber-200 text-amber-800 text-sm font-semibold mb-5">
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2.2} />
            Lakou HOÏS
          </span>
          <h2 className="text-3xl md:text-5xl xl:text-6xl font-bold tracking-tight text-ink leading-[1.05]">
            Kisa{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, #C9A227 0%, #856915 50%, #5A9138 100%)',
              }}
            >
              HOÏS
            </span>{' '}
            ye?
          </h2>
          <p className="mt-6 text-base md:text-lg text-ink-muted leading-relaxed">
            <strong className="text-ink">HOÏS</strong> se yon mo sakre ki vle di{' '}
            <em className="text-amber-700 not-italic font-semibold">
              « Limyè »
            </em>{' '}
            ak{' '}
            <em className="text-amber-700 not-italic font-semibold">
              « Ekla Limyè »
            </em>
            . Eksplore uit konsèp ki fonde pakou Hoïs la.
          </p>
        </div>

        {/* Animated carousel */}
        <FeatureCarousel />

        {/* Sacred quote */}
        <blockquote className="mt-16 max-w-[820px] mx-auto text-center">
          <p className="text-xl md:text-2xl text-ink/85 leading-relaxed font-serif italic">
            « Chak jou nou reveye nou dwe asire n fè yon zèv limyè, se fason
            pou n manifeste lanmou ak limyè Granmèt Souf epi fè pawòl ak
            espirityalite n pran fòm verite. »
          </p>
          <footer className="mt-5 text-sm text-ink-muted">
            — Pakou HOÏS
          </footer>
        </blockquote>

        {/* CTA */}
        <div className="mt-14 flex justify-center">
          <Link
            href="#pri"
            className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-semibold text-white shadow-lg transition-all"
            style={{
              background:
                'linear-gradient(135deg, #C9A227 0%, #856915 50%, #5A9138 100%)',
            }}
          >
            Vwayaje sou pakou HOÏS la
            <ArrowRight
              className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
              strokeWidth={2.4}
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
