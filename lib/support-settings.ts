// Server-side read of the support_settings singleton, with a module-level TTL
// cache — the same outage-hardened anon-REST pattern as lib/site-chrome.ts.
//
// SAFETY: this is awaited on member page renders (dashboard layout mounts the
// floating chat widget on every page). A no-timeout fetch that stalls would
// hang the page, so we bound it hard and fall back to DEFAULT_SUPPORT_SETTINGS
// on any failure — the badge can never block or render blank.

import {
  DEFAULT_SUPPORT_SETTINGS,
  normalizeSupportSettings,
  type SupportSettings,
} from '@/lib/support-presence';

let cache: { settings: SupportSettings; at: number } | null = null;
const TTL_MS = 60_000;

async function refresh(): Promise<void> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) {
    cache = { settings: DEFAULT_SUPPORT_SETTINGS, at: Date.now() };
    return;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(
      `${base}/rest/v1/support_settings?id=eq.1&select=*`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: 'no-store',
        signal: controller.signal,
      }
    );
    const rows = res.ok ? ((await res.json()) as unknown[]) : [];
    const settings = rows[0]
      ? normalizeSupportSettings(rows[0])
      : DEFAULT_SUPPORT_SETTINGS;
    cache = { settings, at: Date.now() };
  } catch {
    // Timeout or network error: reuse last-known (or defaults) and reset the
    // TTL so we don't re-hang on every request.
    cache = { settings: cache?.settings ?? DEFAULT_SUPPORT_SETTINGS, at: Date.now() };
  } finally {
    clearTimeout(timer);
  }
}

/** Resolve the support settings (cached, fallback-safe). */
export async function getSupportSettings(): Promise<SupportSettings> {
  if (!cache || Date.now() - cache.at > TTL_MS) {
    await refresh();
  }
  return cache?.settings ?? DEFAULT_SUPPORT_SETTINGS;
}
