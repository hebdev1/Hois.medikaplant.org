import type { MetadataRoute } from 'next';
import { withTimeout } from '@/lib/with-timeout';

// Render per request instead of prerendering during `next build`. The CMS-page
// lookup below hits Supabase; on 2026-10-04 an IO-starved database stalled that
// fetch, static generation of /sitemap.xml blew past Next's 60s limit three
// times, and every deploy failed. The fetch is also time-boxed + TTL-cached so
// crawlers can't pile requests onto a slow database at runtime either.
export const dynamic = 'force-dynamic';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://hoismedikaplant.com';

// Key public routes. CMS pages (/paj/<slug>) are appended dynamically.
const STATIC_ROUTES = [
  '',
  '/laboratwa',
  '/glose',
  '/klas',
  '/kontak',
  '/istwa-nou',
  '/konfidansyalite',
];

type PageRow = { slug: string; updated_at: string | null };

let pagesCache: { rows: PageRow[]; at: number } | null = null;
const TTL_MS = 60 * 60_000;

async function publishedPages(): Promise<PageRow[]> {
  if (pagesCache && Date.now() - pagesCache.at < TTL_MS) return pagesCache.rows;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return [];
  // withTimeout bounds the read even when the abort signal is ignored; on a
  // timeout or error, serve the last-known list (or just the static routes).
  const rows = await withTimeout(
    (async () => {
      const res = await fetch(
        `${base}/rest/v1/cms_pages?status=eq.published&select=slug,updated_at`,
        {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
          cache: 'no-store',
          signal: AbortSignal.timeout(4000),
        }
      );
      if (!res.ok) return null;
      return (await res.json()) as PageRow[];
    })(),
    4000,
    null
  );
  if (!rows) return pagesCache?.rows ?? [];
  pagesCache = { rows, at: Date.now() };
  return rows;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: 'weekly',
    priority: p === '' ? 1 : 0.7,
  }));

  for (const page of await publishedPages()) {
    entries.push({
      url: `${BASE}/paj/${page.slug}`,
      lastModified: page.updated_at ? new Date(page.updated_at) : undefined,
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  }

  return entries;
}
