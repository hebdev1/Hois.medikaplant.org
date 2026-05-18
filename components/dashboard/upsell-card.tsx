import { Sparkles, ChevronRight } from 'lucide-react';

type UpsellCardProps = {
  productName: string;
  tagline: string;
  botanical: string;
  price: string;
  oldPrice?: string;
  shippingNote?: string;
};

/**
 * Recommended product card with a stylized bottle illustration on the left.
 */
export default function UpsellCard({
  productName,
  tagline,
  botanical,
  price,
  oldPrice,
  shippingNote = 'Livrezon gratis · Pòtoprens',
}: UpsellCardProps) {
  return (
    <div className="relative overflow-hidden grid grid-cols-[auto_1fr] md:grid-cols-[auto_1fr_auto] gap-5 md:gap-6 items-center bg-gradient-to-br from-forest-800 to-forest-900 text-cream-50 border border-forest-700 rounded-2xl p-5 md:p-6 shadow-hero">
      <div
        className="absolute -top-12 -right-10 w-64 h-64 bg-gold-400/15 rounded-full blur-3xl pointer-events-none"
        aria-hidden
      />

      {/* Bottle illustration */}
      <div className="grid place-items-center w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-forest-900/40 border border-cream-50/10 shrink-0">
        <svg width="80" height="80" viewBox="0 0 120 120">
          <rect x="38" y="22" width="44" height="80" rx="10" fill="#1E3A0F" />
          <rect x="38" y="22" width="44" height="22" fill="#5C3D2E" />
          <rect x="42" y="48" width="36" height="34" rx="3" fill="#FAF6ED" />
          <text
            x="60"
            y="62"
            fontFamily="var(--font-playfair), serif"
            fontSize="9"
            fill="#1E3A0F"
            textAnchor="middle"
            fontWeight="700"
          >
            HOIS
          </text>
          <text
            x="60"
            y="73"
            fontFamily="var(--font-dm-sans), sans-serif"
            fontSize="6"
            fill="#5C3D2E"
            textAnchor="middle"
            letterSpacing="2"
          >
            DETOX PLUS
          </text>
          <path
            d="M 56 92 Q 60 86 64 92"
            stroke="#7AAF52"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M 20 50 Q 28 40 36 48 Q 28 55 20 50 Z"
            fill="#7AAF52"
            opacity="0.9"
          />
          <path
            d="M 100 60 Q 92 50 84 58 Q 92 65 100 60 Z"
            fill="#5A9138"
            opacity="0.9"
          />
          <path
            d="M 22 90 Q 30 84 36 92 Q 30 96 22 90 Z"
            fill="#C9A227"
            opacity="0.75"
          />
        </svg>
      </div>

      {/* Body */}
      <div className="relative z-10 min-w-0">
        <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-gold-300 font-semibold mb-2">
          <Sparkles className="w-3 h-3" strokeWidth={2.2} />
          Rekòmande pou ou
        </div>
        <h3 className="font-display text-xl md:text-2xl font-bold leading-snug">
          {productName} <em className="text-gold-300 not-italic">—</em>
          <br />
          <span className="text-cream-50/95">Booste plan ou.</span>
        </h3>
        <p className="mt-2 text-sm text-cream-200 leading-relaxed">{tagline}</p>
        <div className="mt-3 font-serif italic text-xs text-cream-200/70">
          {botanical}
        </div>
      </div>

      {/* Price + CTA */}
      <div className="relative z-10 md:text-right md:min-w-[180px]">
        <div className="font-display text-3xl md:text-4xl font-bold text-gold-300 tracking-tight leading-none">
          {price}
        </div>
        {oldPrice && (
          <div className="text-xs text-cream-200/70 line-through mt-1">
            {oldPrice}
          </div>
        )}
        <button className="mt-3 w-full md:w-auto inline-flex items-center justify-center gap-1.5 bg-gold-400 hover:bg-gold-300 text-forest-900 font-semibold text-sm px-4 py-2.5 rounded-full transition shadow">
          Ajoute nan panye
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.4} />
        </button>
        <div className="text-[10px] text-cream-200/70 mt-2">{shippingNote}</div>
      </div>
    </div>
  );
}
