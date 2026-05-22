/**
 * Resolve the canonical site origin for outgoing email redirect URLs.
 *
 * Without this helper, both auth flows fell back to
 * `window.location.origin`, which is correct when the visitor is already
 * on the production domain but wrong during local dev or when SSR'd from
 * the server (where `window` doesn't exist). Supabase Auth requires
 * absolute URLs in `emailRedirectTo` / `resetPasswordForEmail.redirectTo`,
 * and any URL outside the project's allow-list is silently rewritten to
 * the configured Site URL — which used to be `http://localhost:3000`.
 *
 * Resolution order:
 *   1. `NEXT_PUBLIC_SITE_URL` — explicit canonical override (recommended).
 *      Set this in Vercel project settings to
 *      `https://hois-medikaplant.vercel.app`.
 *   2. `NEXT_PUBLIC_VERCEL_URL` — Vercel-provided per-deployment URL
 *      (no scheme prefix; we add `https://`).
 *   3. `window.location.origin` — last-resort client-side fallback.
 *   4. Literal production URL — final fallback if all else is missing
 *      (server-side dev with no env vars).
 *
 * Always returns a value with NO trailing slash, so callers can append
 * the path directly: `${getSiteUrl()}/auth/reset-password`.
 */

const PRODUCTION_FALLBACK = 'https://hois-medikaplant.vercel.app';

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit && explicit.length > 0) {
    return stripTrailingSlash(explicit);
  }

  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercel && vercel.length > 0) {
    const withScheme = vercel.startsWith('http') ? vercel : `https://${vercel}`;
    return stripTrailingSlash(withScheme);
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return stripTrailingSlash(window.location.origin);
  }

  return PRODUCTION_FALLBACK;
}

/** Build an absolute URL inside the canonical site origin. */
export function siteUrl(path: string): string {
  const base = getSiteUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}
