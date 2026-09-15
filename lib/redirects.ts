// Middleware-side dynamic redirect lookup. Active redirects are fetched from
// Supabase at most once per TTL and held in a module-level Map, so the common
// case (checking each navigation) is an O(1) in-memory lookup with NO
// per-request database round-trip. Runs in the edge runtime, but on the
// self-hosted `next start` server the module scope persists across requests.

type Hit = { to: string; code: number };

let cache: { map: Map<string, Hit>; at: number } | null = null;
const TTL_MS = 60_000;

function normalize(path: string): string {
  const p = path.split('?')[0].replace(/\/+$/, '');
  return p === '' ? '/' : p;
}

async function refresh(): Promise<void> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) {
    cache = { map: new Map(), at: Date.now() };
    return;
  }
  try {
    const res = await fetch(
      `${base}/rest/v1/redirects?active=eq.true&select=from_path,to_path,status_code`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store' }
    );
    if (!res.ok) {
      if (!cache) cache = { map: new Map(), at: Date.now() };
      return;
    }
    const rows = (await res.json()) as Array<{
      from_path: string;
      to_path: string;
      status_code: number;
    }>;
    const map = new Map<string, Hit>();
    for (const r of rows) {
      map.set(normalize(r.from_path), { to: r.to_path, code: r.status_code });
    }
    cache = { map, at: Date.now() };
  } catch {
    // Network hiccup: keep any stale cache, else start an empty one so we
    // don't refetch on every request.
    if (!cache) cache = { map: new Map(), at: Date.now() };
  }
}

/** Returns the redirect target for a pathname, or null. Cheap + cached. */
export async function getRedirectFor(pathname: string): Promise<Hit | null> {
  if (!cache || Date.now() - cache.at > TTL_MS) {
    await refresh();
  }
  return cache?.map.get(normalize(pathname)) ?? null;
}
