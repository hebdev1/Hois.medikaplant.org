'use client';

import React, { useEffect, useState } from 'react';

// ───────────────────────────────────────────────────────────────────────────
// Arc Gallery Hero
//
// Generic visual hero that lays an array of images out along a semicircle
// arc at the top of the section and renders headline + CTAs below.
//
// Everything that's *content* (images, headline, subtitle, button labels +
// hrefs, accessibility alt builder) is a prop, so a brand wrapper can
// supply its own copy without forking the component. Geometry props
// (angles + radii + card sizes) have sensible defaults and only need
// tuning if the gallery layout itself needs adjusting.
//
// The component is client-only because it listens to window resize to
// pick a responsive radius/card-size bucket. We keep state minimal so
// hydration cost stays small.
// ───────────────────────────────────────────────────────────────────────────

export type ArcGalleryCta = {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
  external?: boolean;
};

type ArcGalleryHeroProps = {
  images: string[];

  /** Headline. Can be a string or a node (use a node for inline highlights). */
  title?: React.ReactNode;
  /** Lead paragraph below the title. */
  subtitle?: React.ReactNode;
  /** Optional eyebrow chip above the title (e.g. "Nouvo · Plan VIP 2026"). */
  eyebrow?: React.ReactNode;
  /** Up to two action buttons. The first uses the primary brand style, the
   *  second uses an outlined secondary style. */
  ctas?: ArcGalleryCta[];

  /** Builds the alt text for each gallery image. Defaults to `Memory ${i+1}`. */
  altFor?: (index: number) => string;

  /** Arc geometry — defaults work for most layouts. */
  startAngle?: number;
  endAngle?: number;
  radiusLg?: number;
  radiusMd?: number;
  radiusSm?: number;
  cardSizeLg?: number;
  cardSizeMd?: number;
  cardSizeSm?: number;

  /** Optional extra class on the outer section. */
  className?: string;
};

export const ArcGalleryHero: React.FC<ArcGalleryHeroProps> = ({
  images,
  title = 'Rediscover Your Memories with AI',
  subtitle = 'Our intelligent platform finds, organizes, and brings your most cherished moments back to life.',
  eyebrow,
  ctas = [
    { label: 'Explore Your Past', href: '#', variant: 'primary' },
    { label: 'How It Works', href: '#', variant: 'secondary' },
  ],
  altFor = (i) => `Memory ${i + 1}`,
  startAngle = 20,
  endAngle = 160,
  radiusLg = 480,
  radiusMd = 360,
  radiusSm = 260,
  cardSizeLg = 120,
  cardSizeMd = 100,
  cardSizeSm = 80,
  className = '',
}) => {
  const [dimensions, setDimensions] = useState({
    radius: radiusLg,
    cardSize: cardSizeLg,
  });

  // Handle responsive resizing of the arc and cards.
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setDimensions({ radius: radiusSm, cardSize: cardSizeSm });
      } else if (width < 1024) {
        setDimensions({ radius: radiusMd, cardSize: cardSizeMd });
      } else {
        setDimensions({ radius: radiusLg, cardSize: cardSizeLg });
      }
    };

    handleResize(); // Set initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [radiusLg, radiusMd, radiusSm, cardSizeLg, cardSizeMd, cardSizeSm]);

  // Distribute the angles across the arc — clamp to at least 2 points so
  // the step calculation never divides by zero.
  const count = Math.max(images.length, 2);
  const step = (endAngle - startAngle) / (count - 1);

  return (
    <section
      className={`relative overflow-hidden bg-white text-gray-900 min-h-screen flex flex-col ${className}`}
    >
      {/* Background ring container that controls geometry */}
      <div
        className="relative mx-auto"
        style={{
          width: '100%',
          // Give it extra height so the highest card on the arc is never clipped.
          height: dimensions.radius * 1.2,
        }}
      >
        {/* Center pivot for transforms — anchored at bottom center. */}
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2">
          {images.map((src, i) => {
            const angle = startAngle + step * i; // degrees
            const angleRad = (angle * Math.PI) / 180;

            // Compute x/y on the circle.
            const x = Math.cos(angleRad) * dimensions.radius;
            const y = Math.sin(angleRad) * dimensions.radius;

            return (
              <div
                key={i}
                className="absolute opacity-0 animate-fade-in-up"
                style={{
                  width: dimensions.cardSize,
                  height: dimensions.cardSize,
                  left: `calc(50% + ${x}px)`,
                  bottom: `${y}px`,
                  transform: `translate(-50%, 50%)`,
                  animationDelay: `${i * 100}ms`,
                  animationFillMode: 'forwards',
                  zIndex: count - i,
                }}
              >
                <div
                  className="rounded-2xl shadow-xl overflow-hidden ring-1 ring-gray-200 bg-white transition-transform hover:scale-105 w-full h-full"
                  style={{ transform: `rotate(${angle / 4}deg)` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={altFor(i)}
                    className="block w-full h-full object-cover"
                    draggable={false}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://placehold.co/400x400/334155/e2e8f0?text=Photo';
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content positioned below the arc */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 -mt-40 md:-mt-52 lg:-mt-64">
        <div
          className="text-center max-w-2xl px-6 opacity-0 animate-fade-in"
          style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}
        >
          {eyebrow && (
            <div className="inline-flex items-center justify-center mb-5">
              {eyebrow}
            </div>
          )}

          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-4 text-lg text-gray-600 leading-relaxed">
              {subtitle}
            </p>
          )}

          {ctas.length > 0 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              {ctas.slice(0, 2).map((cta, i) => (
                <ArcGalleryButton key={i} cta={cta} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CSS for fade animations */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translate(-50%, 60%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 50%);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation-name: fade-in-up;
          animation-duration: 0.8s;
          animation-timing-function: ease-out;
        }
        .animate-fade-in {
          animation-name: fade-in;
          animation-duration: 0.8s;
          animation-timing-function: ease-out;
        }
      `}</style>
    </section>
  );
};

function ArcGalleryButton({ cta }: { cta: ArcGalleryCta }) {
  const isPrimary = cta.variant !== 'secondary';
  const base =
    'w-full sm:w-auto px-6 py-3 rounded-full transition-all duration-200 font-semibold';
  const styles = isPrimary
    ? 'bg-forest-700 hover:bg-forest-800 text-cream-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
    : 'border border-cream-300 hover:border-forest-400 hover:bg-cream-50 text-ink';

  const externalProps = cta.external
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <a href={cta.href} {...externalProps} className={`${base} ${styles}`}>
      {cta.label}
    </a>
  );
}
