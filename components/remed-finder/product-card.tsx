'use client';

import { Leaf, ExternalLink } from 'lucide-react';
import type { RemedProduct } from './use-remed-search';

function priceLabel(p: RemedProduct): string | null {
  if (p.price_min === null) return null;
  const min = `$${Number(p.price_min).toFixed(2).replace(/\.00$/, '')}`;
  if (p.price_max !== null && p.price_max > p.price_min) {
    return `Apati ${min}`;
  }
  return min;
}

export default function ProductCard({ product }: { product: RemedProduct }) {
  const price = priceLabel(product);
  return (
    <div className="flex gap-3 rounded-xl border border-cream-200 bg-white p-3 hover:border-forest-300 transition">
      {/* Thumb — many shop pages render images via JS so image_url can be
          null; the leaf placeholder keeps the card balanced. */}
      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-forest-50 shrink-0 grid place-items-center">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <Leaf className="w-6 h-6 text-forest-400" strokeWidth={1.8} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold text-ink leading-snug line-clamp-2">
            {product.name}
          </span>
          {price && (
            <span className="text-xs font-bold text-forest-800 shrink-0 whitespace-nowrap">
              {price}
            </span>
          )}
        </div>

        {product.short_benefit_ht && (
          <p className="mt-0.5 text-[11px] text-earth-600 leading-snug line-clamp-2">
            {product.short_benefit_ht}
          </p>
        )}

        <div className="mt-1.5 flex items-center gap-2">
          <a
            href={product.shop_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-forest-700 hover:text-forest-900 transition"
          >
            Wè sou boutik la
            <ExternalLink className="w-3 h-3" strokeWidth={2.4} />
          </a>
          {!product.in_stock && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-cream-200 text-earth-600">
              Ripti stòk
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
