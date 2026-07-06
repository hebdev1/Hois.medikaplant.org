// "Remèd pou ou" — personalized product recommendations on the dashboard.
//
// Server component. Reuses the Remèd Finder dataset (conditions /
// condition_products / shop_products, migrations 077-079): the member's
// medical-profile conditions + health goal are bridged onto Remèd Finder
// condition slugs by remedSlugsFor() (lib/dashboard/personalization.ts),
// then we pull each matched condition's products in priority order.
//
// Compliance: same rules as the widget — products are presented as
// traditional herbal support, never treatment; the FDA disclaimer is
// always visible at the bottom of the block.

import { Leaf, ExternalLink, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { remedSlugsFor } from '@/lib/dashboard/personalization';

type Props = {
  conditions: string[];
  healthGoal: string | null;
};

type ProductRow = {
  wc_id: number;
  name: string;
  price_min: number | null;
  price_max: number | null;
  image_url: string | null;
  shop_url: string;
  short_benefit_ht: string | null;
  in_stock: boolean;
};

type ConditionRow = {
  slug: string;
  name_ht: string;
  emoji: string | null;
  condition_products: Array<{
    priority: number;
    shop_products: ProductRow | null;
  }>;
};

const DISCLAIMER =
  'Pwodui sa yo pa fèt pou dyagnostike, trete, geri, oswa anpeche okenn maladi. ' +
  'Deklarasyon sa yo pa evalye pa FDA. Toujou konsilte yon pwofesyonèl sante anvan ' +
  'ou itilize remèd fèy, sitou si w ap pran medikaman.';

function priceLabel(p: ProductRow): string | null {
  if (p.price_min === null) return null;
  const min = `$${Number(p.price_min).toFixed(2).replace(/\.00$/, '')}`;
  if (p.price_max !== null && p.price_max > p.price_min) return `Apati ${min}`;
  return min;
}

export default async function RemedRecommendations({
  conditions,
  healthGoal,
}: Props) {
  const slugs = remedSlugsFor(conditions, healthGoal);
  if (slugs.length === 0) return null;

  const supabase = createClient();
  // conditions / condition_products / shop_products are newer than the
  // generated types — same `as any` pattern as the rest of the Remèd
  // Finder surfaces until the next type regen.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const { data: rowsRaw } = await sb
    .from('conditions')
    .select(
      'slug, name_ht, emoji, condition_products(priority, shop_products(wc_id, name, price_min, price_max, image_url, shop_url, short_benefit_ht, in_stock))'
    )
    .in('slug', slugs);

  const rows = (rowsRaw ?? []) as ConditionRow[];
  if (rows.length === 0) return null;

  // Keep the member's own ordering (their conditions first, goal last),
  // flatten to products by priority, dedupe across conditions, cap at 6,
  // in-stock first.
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const seen = new Set<number>();
  const picks: Array<{ product: ProductRow; reason: ConditionRow }> = [];
  for (const slug of slugs) {
    const row = bySlug.get(slug);
    if (!row) continue;
    const sorted = [...row.condition_products].sort(
      (a, b) => a.priority - b.priority
    );
    for (const cp of sorted) {
      const p = cp.shop_products;
      if (!p || seen.has(p.wc_id)) continue;
      seen.add(p.wc_id);
      picks.push({ product: p, reason: row });
    }
  }
  const ordered = [
    ...picks.filter(({ product }) => product.in_stock),
    ...picks.filter(({ product }) => !product.in_stock),
  ].slice(0, 6);

  if (ordered.length === 0) return null;

  const reasonNames = slugs
    .map((s) => bySlug.get(s))
    .filter((r): r is ConditionRow => !!r)
    .map((r) => `${r.emoji ?? ''} ${r.name_ht}`.trim());

  return (
    <section className="relative overflow-hidden bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
      <div
        className="absolute -top-10 -right-10 w-56 h-56 bg-forest-100/50 rounded-full blur-3xl pointer-events-none"
        aria-hidden
      />

      <header className="relative z-10 mb-4">
        <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-forest-700 font-semibold mb-2">
          <Sparkles className="w-3 h-3" strokeWidth={2.2} />
          Chwazi pou ou
        </div>
        <h3 className="font-display text-xl md:text-2xl font-bold text-ink leading-snug">
          Remèd ki matche{' '}
          <em className="text-forest-600 not-italic font-bold">pwofil ou</em>
        </h3>
        <p className="mt-1 text-sm text-earth-600 max-w-xl">
          Baze sou pwofil sante w ({reasonNames.join(' · ')}), men remèd fèy
          tradisyonèl ki ka akonpaye w. Klike pou wè detay sou boutik la.
        </p>
      </header>

      <div className="relative z-10 grid sm:grid-cols-2 gap-3">
        {ordered.map(({ product, reason }) => {
          const price = priceLabel(product);
          return (
            <a
              key={product.wc_id}
              href={product.shop_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex gap-3 rounded-xl border border-cream-200 bg-cream-50/50 hover:bg-white hover:border-forest-300 p-3 transition"
            >
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
                  <span className="text-sm font-semibold text-ink leading-snug line-clamp-2 group-hover:text-forest-800">
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
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-forest-50 text-forest-800 border border-forest-100">
                    {reason.emoji && <span aria-hidden>{reason.emoji}</span>}
                    {reason.name_ht}
                  </span>
                  {!product.in_stock && (
                    <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-cream-200 text-earth-600">
                      Ripti stòk
                    </span>
                  )}
                  <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-forest-700 group-hover:text-forest-900">
                    Wè sou boutik la
                    <ExternalLink className="w-3 h-3" strokeWidth={2.4} />
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      <footer className="relative z-10 mt-4 pt-3 border-t border-cream-100">
        <p className="text-[9.5px] leading-snug text-earth-500">{DISCLAIMER}</p>
      </footer>
    </section>
  );
}
