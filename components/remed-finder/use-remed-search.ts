'use client';

// Data + matching logic for the Remèd Finder widget.
//
// Contract (per the roadmap):
//   • ONE Supabase round-trip per session — the get_remed_finder_data()
//     RPC bundles conditions + products + mappings into a single POST.
//     Cached in module memory + sessionStorage.
//   • Fuse.js fuzzy matching, built lazily on first use (the lib is
//     dynamic-imported so it never lands in the initial page JS).
//   • Input is normalized lowercase + unaccented before matching; the
//     keyword dictionary is stored the same way.

import React from 'react';
import { createClient } from '@/lib/supabase/client';

export type RemedCondition = {
  id: string;
  slug: string;
  name_ht: string;
  name_fr: string;
  name_en: string;
  keywords: string[];
  emoji: string | null;
  is_featured: boolean;
  sort_order: number;
};

export type RemedProduct = {
  id: string;
  wc_id: number;
  name: string;
  product_type: 'simple' | 'variable' | 'bundle';
  price_min: number | null;
  price_max: number | null;
  image_url: string | null;
  shop_url: string;
  short_benefit_ht: string | null;
  in_stock: boolean;
};

type Mapping = { condition_id: string; product_id: string; priority: number };

type RemedData = {
  conditions: RemedCondition[];
  products: RemedProduct[];
  mappings: Mapping[];
};

export type ConditionResult = {
  condition: RemedCondition;
  products: RemedProduct[];
};

const CACHE_KEY = 'remed-finder-data-v1';

// Module-level cache survives panel close/open without refetching.
let memoryCache: RemedData | null = null;
let inflight: Promise<RemedData> | null = null;

export function normalizeQuery(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function loadData(): Promise<RemedData> {
  if (memoryCache) return memoryCache;

  // sessionStorage: survives soft navigations within the tab session.
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) {
      memoryCache = JSON.parse(raw) as RemedData;
      return memoryCache;
    }
  } catch {
    /* private mode / quota — fall through to network */
  }

  if (!inflight) {
    inflight = (async () => {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc(
        'get_remed_finder_data'
      );
      if (error) throw new Error(error.message);
      const parsed = data as RemedData;
      memoryCache = parsed;
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
      } catch {
        /* best-effort */
      }
      return parsed;
    })().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

// Fuse instance built once per data load. Type is `unknown` at the module
// level because fuse.js is dynamic-imported.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let fuseIndex: any = null;

async function buildIndex(conditions: RemedCondition[]) {
  if (fuseIndex) return fuseIndex;
  const { default: Fuse } = await import('fuse.js');
  fuseIndex = new Fuse(conditions, {
    keys: [
      { name: 'keywords', weight: 0.7 },
      { name: 'name_ht', weight: 0.15 },
      { name: 'name_fr', weight: 0.075 },
      { name: 'name_en', weight: 0.075 },
    ],
    threshold: 0.32,
    ignoreLocation: true,
    includeScore: true,
  });
  return fuseIndex;
}

export function useRemedSearch(open: boolean) {
  const [data, setData] = React.useState<RemedData | null>(memoryCache);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<ConditionResult[]>([]);
  const debounceRef = React.useRef<number | null>(null);

  // Fetch on FIRST OPEN, never on page load.
  React.useEffect(() => {
    if (!open || data) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    loadData()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setLoadError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, data]);

  // Product lookup helpers derived once per data load.
  const derived = React.useMemo(() => {
    if (!data) return null;
    const productById = new Map(data.products.map((p) => [p.id, p]));
    const mappingsByCondition = new Map<string, Mapping[]>();
    for (const m of data.mappings) {
      const arr = mappingsByCondition.get(m.condition_id) ?? [];
      arr.push(m);
      mappingsByCondition.set(m.condition_id, arr);
    }
    for (const arr of mappingsByCondition.values()) {
      arr.sort((a, b) => a.priority - b.priority);
    }
    return { productById, mappingsByCondition };
  }, [data]);

  const productsFor = React.useCallback(
    (conditionId: string, seen: Set<string>): RemedProduct[] => {
      if (!derived) return [];
      const rows = derived.mappingsByCondition.get(conditionId) ?? [];
      const out: RemedProduct[] = [];
      for (const m of rows) {
        if (seen.has(m.product_id)) continue;
        const p = derived.productById.get(m.product_id);
        if (!p) continue;
        seen.add(m.product_id);
        out.push(p);
      }
      // In-stock first; out-of-stock still shown, at the end (roadmap).
      return [...out.filter((p) => p.in_stock), ...out.filter((p) => !p.in_stock)];
    },
    [derived]
  );

  // Debounced fuzzy search (150ms per roadmap).
  React.useEffect(() => {
    if (!data) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    const norm = normalizeQuery(query);
    if (norm.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      const fuse = await buildIndex(data.conditions);
      const hits = fuse.search(norm) as Array<{
        item: RemedCondition;
        score?: number;
      }>;
      const seen = new Set<string>();
      const grouped: ConditionResult[] = [];
      for (const hit of hits.slice(0, 3)) {
        const products = productsFor(hit.item.id, seen);
        if (products.length > 0) {
          grouped.push({ condition: hit.item, products });
        }
      }
      setResults(grouped);
    }, 150);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, data, productsFor]);

  const featured = React.useMemo(
    () => (data?.conditions ?? []).filter((c) => c.is_featured),
    [data]
  );

  // Chip tap = instant results for that condition, bypassing fuse.
  const selectCondition = React.useCallback(
    (c: RemedCondition) => {
      setQuery(c.name_ht);
      const seen = new Set<string>();
      const products = productsFor(c.id, seen);
      setResults(products.length > 0 ? [{ condition: c, products }] : []);
    },
    [productsFor]
  );

  return {
    loading,
    loadError,
    ready: !!data,
    query,
    setQuery,
    results,
    featured,
    selectCondition,
  };
}
