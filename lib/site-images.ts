import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { SITE_IMAGE_SLOTS } from './site-image-slots';

export type SiteImageMap = Record<string, string>;

/**
 * Resolved homepage graphics: every slot's admin override when one exists,
 * otherwise the default shipped in code. Wrapped in React cache() so a single
 * render hits the table once no matter how many sections read it.
 *
 * Because unset slots fall back, the site can never render a broken image —
 * and an admin can replace any of them from /admin/imaj without a deploy.
 */
export const getSiteImages = cache(async (): Promise<SiteImageMap> => {
  const map: SiteImageMap = {};
  for (const s of SITE_IMAGE_SLOTS) map[s.key] = s.fallback;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = createClient() as any;
    const { data } = await sb.from('site_images').select('key, url');
    for (const row of (data ?? []) as Array<{ key: string; url: string }>) {
      if (row.url) map[row.key] = row.url;
    }
  } catch {
    // Never let a graphics lookup take the homepage down — fall back to code.
  }
  return map;
});

/** Ordered slot keys for one section prefix, e.g. imageKeys('hero') */
export function imageKeys(prefix: string): string[] {
  return SITE_IMAGE_SLOTS.filter((s) => s.key.startsWith(prefix + '-')).map(
    (s) => s.key
  );
}
