import type { MetadataRoute } from 'next';

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

async function publishedPages(): Promise<Array<{ slug: string; updated_at: string | null }>> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return [];
  try {
    const res = await fetch(
      `${base}/rest/v1/cms_pages?status=eq.published&select=slug,updated_at`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        // Cache the list for an hour so the sitemap stays cheap.
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];
    return (await res.json()) as Array<{ slug: string; updated_at: string | null }>;
  } catch {
    return [];
  }
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
