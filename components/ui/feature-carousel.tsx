'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  HandHeart,
  Wind,
  Heart,
  Leaf,
  Flame,
  Users,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * HOÏS feature carousel — adapted from the shadcn FeatureCarousel demo.
 *
 * Two-pane animated rotator: chip pills tumble vertically on the left,
 * matching image card spins in on the right. Auto-plays every 3 seconds
 * and pauses while the visitor hovers a chip.
 *
 * Original demo used @hugeicons and an icy-blue background. This version
 * swaps to lucide-react icons (already in the project) and the Hoïs gold
 * palette to match the rest of the brand.
 */

const ITEMS: {
  id: string;
  label: string;
  icon: LucideIcon;
  image: string;
  description: string;
}[] = [
  {
    id: 'limye',
    label: 'Limyè',
    icon: Sparkles,
    image:
      'https://images.unsplash.com/photo-1473773508845-188df298d2d1?q=80&w=1200',
    description:
      'HOÏS se yon mo sakre ki vle di « Limyè », « Ekla Limyè ». Reprezante pwisans Limyè a nan yon mond ki gen fènwa.',
  },
  {
    id: 'zev-limye',
    label: 'Zèv Limyè',
    icon: HandHeart,
    image:
      'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=1200',
    description:
      'Aksyon konkrè pou materyalize limyè a. Chak jou nou reveye, nou dwe asire n fè yon zèv limyè pou kore pawòl espirityalite n.',
  },
  {
    id: 'granmet-souf',
    label: 'Granmèt Souf',
    icon: Wind,
    image:
      'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?q=80&w=1200',
    description:
      'Se « Souf » la ki pèmèt tout sa ki viv sou latè vivan. Kreyatè Siprèm nan, sila « Ki Pa Gen Sou Tèt » la.',
  },
  {
    id: 'charit',
    label: 'Charit',
    icon: Heart,
    image:
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1200',
    description:
      'Pi gwo prèv lanmou pou yon lòt ki nan bezwen. Yon zam espirityèl pwisan ki pwoteje lavi w kont atak fizik ak malefik.',
  },
  {
    id: 'lanati',
    label: 'Lanati',
    icon: Leaf,
    image:
      'https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=1200',
    description:
      'Amonize w ak lanati ak kòmòs la atravè plan ekzistansyèl yo. Plant medisinal Ayisyen yo se manm fanmi w.',
  },
  {
    id: 'espirityalite',
    label: 'Espirityalite',
    icon: Flame,
    image:
      'https://images.unsplash.com/photo-1507692049790-de58290a4334?q=80&w=1200',
    description:
      'Konekte ak Pwisans Granmèt Souf la pou louvri je w, ede w pa dewoute, epi atenn dimansyon pèsonèl Limyè a.',
  },
  {
    id: 'kominote',
    label: 'Kominote Hoïs',
    icon: Users,
    image:
      'https://images.unsplash.com/photo-1529390079861-591de354faf5?q=80&w=1200',
    description:
      'Rantre nan lakou HOÏS-Medikaplant. Yon kominote ki transfòme tèt yo chak jou kòm ajan limyè pou amelyore kondisyon lavi lòt.',
  },
  {
    id: 'tradisyon',
    label: 'Tradisyon Ayisyen',
    icon: BookOpen,
    image:
      'https://images.unsplash.com/photo-1611078489935-0cb964de46d6?q=80&w=1200',
    description:
      'Konesans plant medisinal transmèt soti jenerasyon an jenerasyon. Yon eritaj Hoïs Inivèsite ap prezève epi pataje.',
  },
];

const AUTO_PLAY_INTERVAL = 4000;
const ITEM_HEIGHT = 65;

// HOÏS gold — see tailwind.config.ts gold-400. Hard-coded here so
// inline arbitrary classes stay legible.
const HOIS_GOLD = '#C9A227';

const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

export function FeatureCarousel() {
  const [step, setStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentIndex =
    ((step % ITEMS.length) + ITEMS.length) % ITEMS.length;

  const nextStep = useCallback(() => {
    setStep((prev) => prev + 1);
  }, []);

  const handleChipClick = (index: number) => {
    const diff = (index - currentIndex + ITEMS.length) % ITEMS.length;
    if (diff > 0) setStep((s) => s + diff);
  };

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextStep, AUTO_PLAY_INTERVAL);
    return () => clearInterval(interval);
  }, [nextStep, isPaused]);

  const getCardStatus = (index: number) => {
    const diff = index - currentIndex;
    const len = ITEMS.length;

    let normalizedDiff = diff;
    if (diff > len / 2) normalizedDiff -= len;
    if (diff < -len / 2) normalizedDiff += len;

    if (normalizedDiff === 0) return 'active';
    if (normalizedDiff === -1) return 'prev';
    if (normalizedDiff === 1) return 'next';
    return 'hidden';
  };

  return (
    <div className="w-full max-w-7xl mx-auto md:p-4">
      <div className="relative overflow-hidden rounded-[2.5rem] lg:rounded-[4rem] flex flex-col lg:flex-row min-h-[600px] lg:aspect-video border border-slate-200/60 shadow-card">
        {/* ─── Left pane: rotating chip pills ──────────────────────── */}
        <div
          className="w-full lg:w-[40%] min-h-[350px] md:min-h-[450px] lg:h-full relative z-30 flex flex-col items-start justify-center overflow-hidden px-8 md:px-16 lg:pl-16"
          style={{ background: HOIS_GOLD }}
        >
          <div
            className="absolute inset-x-0 top-0 h-12 md:h-20 lg:h-16 z-40"
            style={{
              background:
                'linear-gradient(to bottom, #C9A227, rgba(201,162,39,0.8), transparent)',
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-12 md:h-20 lg:h-16 z-40"
            style={{
              background:
                'linear-gradient(to top, #C9A227, rgba(201,162,39,0.8), transparent)',
            }}
          />
          <div className="relative w-full h-full flex items-center justify-center lg:justify-start z-20">
            {ITEMS.map((feature, index) => {
              const isActive = index === currentIndex;
              const distance = index - currentIndex;
              const wrappedDistance = wrap(
                -(ITEMS.length / 2),
                ITEMS.length / 2,
                distance
              );
              const Icon = feature.icon;

              return (
                <motion.div
                  key={feature.id}
                  style={{
                    height: ITEM_HEIGHT,
                    width: 'fit-content',
                  }}
                  animate={{
                    y: wrappedDistance * ITEM_HEIGHT,
                    opacity: 1 - Math.abs(wrappedDistance) * 0.25,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 90,
                    damping: 22,
                    mass: 1,
                  }}
                  className="absolute flex items-center justify-start"
                >
                  <button
                    type="button"
                    onClick={() => handleChipClick(index)}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    className={cn(
                      'relative flex items-center gap-4 px-6 md:px-10 lg:px-8 py-3.5 md:py-5 lg:py-4 rounded-full transition-all duration-700 text-left group border',
                      isActive
                        ? 'bg-white border-white z-10'
                        : 'bg-transparent text-white/70 border-white/30 hover:border-white/60 hover:text-white'
                    )}
                    style={isActive ? { color: HOIS_GOLD } : undefined}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center transition-colors duration-500',
                        isActive ? '' : 'text-white/50'
                      )}
                      style={isActive ? { color: HOIS_GOLD } : undefined}
                    >
                      <Icon size={18} strokeWidth={2} />
                    </div>

                    <span className="font-semibold text-sm md:text-[15px] tracking-tight whitespace-nowrap uppercase">
                      {feature.label}
                    </span>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ─── Right pane: image card with description overlay ─────── */}
        <div className="flex-1 min-h-[500px] md:min-h-[600px] lg:h-full relative bg-cream-50 flex items-center justify-center py-16 md:py-24 lg:py-16 px-6 md:px-12 lg:px-10 overflow-hidden border-t lg:border-t-0 lg:border-l border-slate-200/40">
          <div className="relative w-full max-w-[420px] aspect-[4/5] flex items-center justify-center">
            {ITEMS.map((feature, index) => {
              const status = getCardStatus(index);
              const isActive = status === 'active';
              const isPrev = status === 'prev';
              const isNext = status === 'next';

              return (
                <motion.div
                  key={feature.id}
                  initial={false}
                  animate={{
                    x: isActive ? 0 : isPrev ? -100 : isNext ? 100 : 0,
                    scale: isActive ? 1 : isPrev || isNext ? 0.85 : 0.7,
                    opacity: isActive ? 1 : isPrev || isNext ? 0.4 : 0,
                    rotate: isPrev ? -3 : isNext ? 3 : 0,
                    zIndex: isActive ? 20 : isPrev || isNext ? 10 : 0,
                    pointerEvents: isActive ? 'auto' : 'none',
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 25,
                    mass: 0.8,
                  }}
                  className="absolute inset-0 rounded-[2rem] md:rounded-[2.8rem] overflow-hidden border-4 md:border-8 border-white bg-white origin-center shadow-card"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={feature.image}
                    alt={feature.label}
                    className={cn(
                      'w-full h-full object-cover transition-all duration-700',
                      isActive
                        ? 'grayscale-0 blur-0'
                        : 'grayscale blur-[2px] brightness-75'
                    )}
                  />

                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute inset-x-0 bottom-0 p-8 md:p-10 pt-32 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end pointer-events-none"
                      >
                        <div
                          className="bg-white text-ink px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.2em] w-fit shadow-lg mb-3 border border-slate-200"
                          style={{ color: HOIS_GOLD }}
                        >
                          {index + 1} • {feature.label}
                        </div>
                        <p className="text-white font-normal text-lg md:text-2xl leading-tight drop-shadow-md tracking-tight">
                          {feature.description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div
                    className={cn(
                      'absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-3 transition-opacity duration-300',
                      isActive ? 'opacity-100' : 'opacity-0'
                    )}
                  >
                    <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white] animate-pulse" />
                    <span className="text-white/80 text-[10px] font-semibold uppercase tracking-[0.3em] font-mono">
                      Pakou HOÏS
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeatureCarousel;
