import { headers, type UnsafeUnwrappedHeaders } from 'next/headers';

// Lightweight in-memory rate limiter for UNAUTHENTICATED public server actions
// (contact form, glossary/lab contributions). Hostinger runs a single Node
// process, so a module-level Map is effective; it is best-effort by design —
// it resets on restart and isn't shared across instances, but it stops the
// trivial "loop a script" abuse of the public write/upload endpoints. For
// stronger guarantees, move to a DB- or Redis-backed limiter or a CAPTCHA.

type Hit = { count: number; resetAt: number };
const buckets = new Map<string, Hit>();
let lastSweep = 0;

/** Returns true if the call is allowed, false if the key is over its budget. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  // Occasionally drop expired buckets so the Map can't grow unbounded.
  if (now - lastSweep > 60_000) {
    lastSweep = now;
    for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
  }

  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}

/** Best-effort client IP from the proxy headers (Hostinger hCDN / Cloudflare). */
export function clientIp(): string {
  // Next 15 made headers() async; the sync-unwrap keeps clientIp() synchronous
  // (officially supported, dev-only deprecation warning). TODO: switch to
  // `await headers()` when convenient.
  const h = headers() as unknown as UnsafeUnwrappedHeaders;
  const xff = h.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || 'unknown';
  return h.get('cf-connecting-ip') || h.get('x-real-ip') || 'unknown';
}
