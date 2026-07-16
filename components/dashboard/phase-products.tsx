// Suggested shop products for a single protocol phase.
//
// Zero admin work: the phase's own words (title + subtitle, plus the
// protocol name) are matched against the SAME keyword dictionary Doktè Maton
// searches (conditions / condition_products / shop_products, via the
// match_remed_conditions RPC). So a "Fwa — Detox" phase surfaces the liver
// products automatically, and any protocol the admin creates later works the
// same with no mapping step.
//
// No medical claims: products are framed as suggestions and the FDA
// disclaimer stays with them.

import { createClient } from '@/lib/supabase/server';
import { ShoppingBag } from 'lucide-react';
import ProductCard from '@/components/remed-finder/product-card';

type ProductRow = {
  id: string;
  wc_id: number;
  product_type: 'simple' | 'variable' | 'bundle';
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
  condition_products: Array<{ priority: number; shop_products: ProductRow | null }>;
};

// Kreyòl filler that carries no clinical meaning — dropped so we only match
// on substantive words ("fwa", "detox", "tansyon"...).
const STOP = new Set([
  'plan', 'faz', 'jou', 'yon', 'nan', 'pou', 'yo', 'ki', 'sou', 'chak',
  'tout', 'epi', 'oswa', 'etap', 'semen', 'premye', 'dezyem', 'twazyem',
  'katriyem', 'nou', 'ou', 'li', 'se', 'avek', 'ave', 'ant', 'apre', 'anvan',
  'kont', 'plis', 'mwens', 'byen', 'bon', 'nouvo', 'pwotokol', 'pwogram',
]);

function termsFrom(...texts: Array<string | null | undefined>): string[] {
  const words = texts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w));
  return [...new Set(words)].slice(0, 8);
}

export default async function PhaseProducts({
  title,
  sub,
  programName,
  limit = 3,
}: {
  title: string;
  sub?: string | null;
  programName?: string | null;
  limit?: number;
}) {
  const terms = termsFrom(title, sub, programName);
  if (terms.length === 0) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;

  const { data: matched } = await sb.rpc('match_remed_conditions', {
    p_terms: terms,
  });
  const slugs = [
    ...new Set(((matched ?? []) as Array<{ slug: string }>).map((m) => m.slug)),
  ];
  if (slugs.length === 0) return null;

  const { data: rowsRaw } = await sb
    .from('conditions')
    .select(
      'slug, name_ht, emoji, condition_products(priority, shop_products(id, wc_id, product_type, name, price_min, price_max, image_url, shop_url, short_benefit_ht, in_stock))'
    )
    .in('slug', slugs);

  const rows = (rowsRaw ?? []) as ConditionRow[];
  if (rows.length === 0) return null;

  // Flatten by priority, dedupe across conditions, in-stock first, cap.
  const seen = new Set<number>();
  const picks: Array<{ product: ProductRow; reason: ConditionRow }> = [];
  for (const row of rows) {
    for (const cp of [...row.condition_products].sort((a, b) => a.priority - b.priority)) {
      const p = cp.shop_products;
      if (!p || seen.has(p.wc_id)) continue;
      seen.add(p.wc_id);
      picks.push({ product: p, reason: row });
    }
  }
  const ordered = [
    ...picks.filter(({ product }) => product.in_stock),
    ...picks.filter(({ product }) => !product.in_stock),
  ].slice(0, limit);
  if (ordered.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl bg-forest-50/60 border border-forest-100 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-forest-700 mb-2">
        <ShoppingBag className="w-3 h-3" strokeWidth={2.4} />
        Remèd ki ka ede nan faz sa a
      </div>
      <div className="space-y-2">
        {ordered.map(({ product, reason }) => (
          <div key={product.wc_id}>
            <ProductCard product={product} />
            <span className="mt-0.5 inline-block text-[10px] text-earth-500">
              {reason.emoji ? `${reason.emoji} ` : ''}
              {reason.name_ht}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[9px] leading-snug text-earth-500">
        Sijesyon sèlman — pa yon dyagnostik. Pwodui sa yo pa evalye pa FDA epi
        yo pa fèt pou dyagnostike, trete, geri, oswa anpeche okenn maladi.
      </p>
    </div>
  );
}
