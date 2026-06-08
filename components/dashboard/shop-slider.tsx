'use client';

import React from 'react';
import { ShoppingBag, ChevronLeft, ChevronRight, ExternalLink, Sparkles } from 'lucide-react';

/**
 * Curated list of products pulled from medikaplantshop.com. Updating this
 * list is intentionally a code change (not an admin CRUD) until the shop
 * exposes a proper public catalog API — that way we keep tight control over
 * what gets featured to members. Each card opens the medikaplantshop.com
 * product page in a new tab (rel="noopener noreferrer" prevents back-channel
 * window.opener manipulation).
 */
type ShopProduct = {
  name: string;
  url: string;
  image: string;
  price: string;
  tagline: string;
};

const PRODUCTS: ShopProduct[] = [
  {
    name: 'Dijesyon+',
    url: 'https://medikaplantshop.com/product/dijesyon-digestion-tea/',
    image:
      'https://medikaplantshop.com/wp-content/uploads/2026/05/IMAGE-2026-05-17-004211.jpg',
    price: '$35 – $63',
    tagline: 'Tizan dijesyon — ekilibre vant ou natirèlman.',
  },
  {
    name: 'Astragalus Root',
    url: 'https://medikaplantshop.com/product/3112/',
    image:
      'https://medikaplantshop.com/wp-content/uploads/2026/05/Astragulus-TOP.png',
    price: '$11.99',
    tagline: 'Rasin pou ranfòse imunite + enèji.',
  },
  {
    name: 'Doulè Règ',
    url: 'https://medikaplantshop.com/product/doule-reg-menstrual-pain-tea/',
    image:
      'https://medikaplantshop.com/wp-content/uploads/2026/03/Doule-Reg-product-shot-.png',
    price: '$31.99',
    tagline: 'Tizan ki soulaje doulè règ menm jou a.',
  },
  {
    name: 'Kaba Kandida',
    url: 'https://medikaplantshop.com/product/kaba-kandida/',
    image:
      'https://medikaplantshop.com/wp-content/uploads/2025/07/kABA-KANDIDA.jpg',
    price: '$41',
    tagline: 'Fòmil sible pou ekilibre flo entestinal.',
  },
  {
    name: 'Ilan-Ilan Essential Oil',
    url: 'https://medikaplantshop.com/product/ilan-ilan-essential-oil-ylang-ylang/',
    image:
      'https://medikaplantshop.com/wp-content/uploads/2026/03/Ilan-Ilan-Sized-up.jpg',
    price: '$19.99',
    tagline: "Lwil esansyèl ylang-ylang pou kò + lespri.",
  },
  {
    name: 'Klintoks Detox',
    url: 'https://medikaplantshop.com/product/klin-toks/',
    image:
      'https://medikaplantshop.com/wp-content/uploads/2025/09/Untitled-5.png',
    price: 'Wè pwodwi a',
    tagline: 'Detox konplè kò — elimine toksin, soutni dijesyon.',
  },
  {
    name: 'Pikliz Kaliko',
    url: 'https://medikaplantshop.com/product/pikliz-kaliko/',
    image:
      'https://medikaplantshop.com/wp-content/uploads/2026/03/Pikliz-Kaliko.png',
    price: '$14.99',
    tagline: 'Pikliz tradisyonèl ki pike kou yon kaliko.',
  },
  {
    name: 'Fanmilite Kit',
    url: 'https://medikaplantshop.com/product/fanmilite-kit/',
    image:
      'https://medikaplantshop.com/wp-content/uploads/2026/03/Fanmalite-Kit-shot.png',
    price: '$399',
    tagline: 'Bondi konplè pou fanmi — fètilite + ekilibre fanmsi.',
  },
];

/**
 * Horizontal scrollable product carousel for the user dashboard. Replaces
 * the old single UpsellCard so we can showcase more of the shop catalog at
 * once. Uses CSS scroll-snap on a flex row + JS arrow buttons that scroll
 * the viewport one card-width at a time. Pure CSS, no carousel lib.
 */
export default function ShopSlider() {
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  // Recompute arrow availability whenever the scroll position changes —
  // disables arrows at the edges so the buttons never sit there looking
  // tappable but doing nothing.
  const updateArrows = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows]);

  function scrollBy(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    // Scroll by ~one card width (we read it from the first child so it
    // stays accurate if the card sizing ever changes).
    const card = el.querySelector<HTMLElement>('[data-shop-card]');
    const step = card ? card.offsetWidth + 16 : 280;
    el.scrollBy({ left: step * direction, behavior: 'smooth' });
  }

  return (
    // Outer wrapper guarantees the slider can NEVER push the dashboard
    // wider than its column: min-w-0 lets it shrink inside a grid cell,
    // overflow-hidden caps any pixel that leaks out of the scroller
    // (notably the absolute-positioned arrow buttons + protruding cards
    // on mobile).
    <div className="relative min-w-0 w-full overflow-hidden rounded-2xl">
      <section className="relative overflow-hidden bg-gradient-to-br from-forest-800 to-forest-900 text-cream-50 border border-forest-700 rounded-2xl p-5 md:p-6 shadow-hero">
      <div
        className="absolute -top-12 -right-10 w-64 h-64 bg-gold-400/15 rounded-full blur-3xl pointer-events-none"
        aria-hidden
      />

      {/* Header */}
      <header className="relative z-10 flex items-end justify-between gap-3 flex-wrap mb-4 md:mb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-gold-300 font-semibold mb-2">
            <Sparkles className="w-3 h-3" strokeWidth={2.2} />
            Boutik MedikaPlant
          </div>
          <h3 className="font-display text-xl md:text-2xl font-bold leading-snug">
            Pwodwi pou{' '}
            <em className="text-gold-300 not-italic font-bold">
              ranfòse plan ou
            </em>
          </h3>
          <p className="mt-1 text-sm text-cream-200/85 max-w-md">
            Plant, tizan, ak lwil esansyèl ki disponib sou medikaplantshop.com.
            Klike sou yon pwodwi pou wè detay yo.
          </p>
        </div>

        <a
          href="https://medikaplantshop.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-cream-50/10 hover:bg-cream-50/15 border border-cream-50/15 text-cream-50 text-xs font-semibold transition shrink-0"
        >
          <ShoppingBag className="w-3.5 h-3.5" strokeWidth={2.4} />
          Wè tout pwodwi
          <ExternalLink className="w-3 h-3 opacity-70" strokeWidth={2.4} />
        </a>
      </header>

      {/* Scroller — relative parent has its own overflow-hidden so the
          absolutely-positioned arrow buttons (which sit just inside the
          edges) and the protruding right-most card can never widen the
          outer section. */}
      <div className="relative z-10 min-w-0 overflow-hidden">
        <div
          ref={scrollerRef}
          className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2
                     [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Pwodwi MedikaPlant"
        >
          {PRODUCTS.map((p) => (
            <ProductCard key={p.url} product={p} />
          ))}
        </div>

        {/* Arrows (desktop only; mobile users swipe). Positive insets so
            the buttons live inside the section padding and never get
            clipped by the wrapper's overflow-hidden. */}
        <button
          type="button"
          aria-label="Glise alagoch"
          onClick={() => scrollBy(-1)}
          disabled={!canScrollLeft}
          className={`hidden md:grid absolute left-1 top-1/2 -translate-y-1/2 place-items-center w-9 h-9 rounded-full bg-cream-50 text-forest-900 shadow-lg border border-cream-200 transition ${
            canScrollLeft
              ? 'opacity-100 hover:scale-110'
              : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2.4} />
        </button>
        <button
          type="button"
          aria-label="Glise adwat"
          onClick={() => scrollBy(1)}
          disabled={!canScrollRight}
          className={`hidden md:grid absolute right-1 top-1/2 -translate-y-1/2 place-items-center w-9 h-9 rounded-full bg-cream-50 text-forest-900 shadow-lg border border-cream-200 transition ${
            canScrollRight
              ? 'opacity-100 hover:scale-110'
              : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronRight className="w-4 h-4" strokeWidth={2.4} />
        </button>
      </div>
    </section>
    </div>
  );
}

function ProductCard({ product }: { product: ShopProduct }) {
  // Some upstream image URLs come back as protocol-relative ("//..."). We
  // normalize to https so the browser doesn't choke on a missing scheme.
  const normalizedImage = product.image.startsWith('//')
    ? `https:${product.image}`
    : product.image;

  return (
    <a
      data-shop-card
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      className="snap-start shrink-0 w-[230px] sm:w-[250px] md:w-[240px] rounded-2xl bg-cream-50 text-ink overflow-hidden border border-cream-200 shadow-card hover:shadow-xl hover:-translate-y-0.5 transition group"
    >
      {/* Image */}
      <div className="aspect-square bg-cream-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={normalizedImage}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
        />
      </div>

      {/* Body */}
      <div className="p-3 md:p-4">
        <div className="font-display text-sm md:text-base font-bold text-ink leading-tight line-clamp-1">
          {product.name}
        </div>
        <p className="text-[11px] text-earth-600 mt-1 line-clamp-2 leading-snug">
          {product.tagline}
        </p>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="font-display text-sm font-bold text-forest-700">
            {product.price}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-forest-700 group-hover:text-forest-900 transition">
            Wè
            <ExternalLink className="w-3 h-3" strokeWidth={2.4} />
          </span>
        </div>
      </div>
    </a>
  );
}
