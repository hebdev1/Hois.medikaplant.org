// Cached, outage-hardened read of the published plants list — the same
// anon-REST + timeout + TTL pattern as lib/site-chrome.ts and
// lib/support-settings.ts.
//
// WHY: /laboratwa/eksplorate re-ran this full-table query on EVERY render.
// Crawlers walking the explorer's filter combinations (?pati=…&prep=…) drove it
// ~240×/hour around the clock — 99% of all `plants` traffic. When the database
// became IO-starved (2026-10-04) each call took minutes and kept it pinned. The
// list only changes when an admin edits a plant (which calls
// invalidatePublishedPlants()), so one fetch per TTL serves everyone.

import { withTimeout } from '@/lib/with-timeout';

const SELECT =
  'slug,name_kr,name_fr,name_en,name_sci,family,parts_used,preparations,season_months,regions,summary_kr,photos';
const TTL_MS = 10 * 60_000;
// After a failed refresh, retry this soon instead of waiting a full TTL — but
// never on every request (that would re-hang each render on a sick database).
const RETRY_MS = 30_000;

let cache: { rows: unknown[]; at: number } | null = null;
let inflight: Promise<void> | null = null;

async function refresh(): Promise<void> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) {
    cache = { rows: cache?.rows ?? [], at: Date.now() };
    return;
  }
  try {
    // withTimeout bounds the read even when the abort signal is ignored.
    const rows = await withTimeout(
      (async () => {
        const res = await fetch(
          `${base}/rest/v1/plants?select=${SELECT}&status=eq.published&order=name_kr.asc`,
          {
            headers: { apikey: key, Authorization: `Bearer ${key}` },
            cache: 'no-store',
            signal: AbortSignal.timeout(4000),
          }
        );
        if (!res.ok) return null;
        return (await res.json()) as unknown[];
      })(),
      4000,
      null
    );
    if (!rows) throw new Error('plants unavailable');
    cache = { rows, at: Date.now() };
  } catch {
    // Keep serving the last-known rows (or none) and schedule a retry.
    cache = { rows: cache?.rows ?? [], at: Date.now() - TTL_MS + RETRY_MS };
  }
}

/** Published plants (cached ~10 min, never blocks a render for more than ~4s). */
export async function getPublishedPlants<T>(): Promise<T[]> {
  if (!cache || Date.now() - cache.at > TTL_MS) {
    // De-duplicate concurrent refreshes: a burst of requests shares one fetch.
    inflight ??= refresh().finally(() => {
      inflight = null;
    });
    await inflight;
  }
  return (cache?.rows ?? []) as T[];
}

/** Drop the cache so the next read refetches — call after an admin edit. */
export function invalidatePublishedPlants(): void {
  cache = null;
}
