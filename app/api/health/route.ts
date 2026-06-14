import { NextResponse } from 'next/server';

// ───────────────────────────────────────────────────────────────────────────
// Health endpoint.
//
// Two jobs:
//   • Give the hosting platform (Hostinger LSWS, reverse proxies, CI smoke
//     tests, uptime monitors) a cheap 200/OK probe so they can tell the
//     app process is actually serving requests and not stuck mid-boot.
//   • Surface a minimal env-var configuration check so we don't have to
//     remember to hit /api/auth/send-email separately when a deploy
//     "looks fine" but auth or email silently fails.
//
// We deliberately keep this fast — a single Supabase HEAD count, capped by
// a 2s timeout — so calling it every 30s doesn't tax the DB.
// ───────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const REQUIRED_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SITE_URL',
] as const;

const OPTIONAL_ENV = [
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'SUPABASE_AUTH_HOOK_SECRET',
  'SUPABASE_SERVICE_ROLE_KEY',
  'HUBSPOT_PRIVATE_APP_TOKEN',
] as const;

async function pingSupabase(): Promise<
  { ok: true; latencyMs: number } | { ok: false; error: string }
> {
  const start = Date.now();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return { ok: false, error: 'env_vars_missing' };
  }

  // We probe Supabase's PostgREST root with a plain fetch + abort
  // controller rather than going through the SSR helper:
  //
  //   • The SSR helper needs cookies() and runs RLS queries — both of
  //     which can return empty-message errors for an anonymous probe,
  //     producing the {"ok":false,"error":""} we just saw in prod.
  //   • The REST root returns 200 with a minimal JSON body any time
  //     Supabase is reachable; no RLS, no auth wrangling, no table
  //     dependency. This is the canonical "is Supabase up?" check.
  //   • AbortController gives us a hard 2s ceiling so a Supabase outage
  //     can't hang the healthcheck and trigger LSWS to mark the app
  //     unhealthy.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    if (!res.ok) {
      return { ok: false, error: `supabase_http_${res.status}` };
    }
    return { ok: true, latencyMs: Date.now() - start };
  } catch (e) {
    clearTimeout(timeout);
    const err = e as Error;
    const reason =
      err.name === 'AbortError'
        ? 'supabase_timeout_2s'
        : err.message || err.name || 'unknown_error';
    return { ok: false, error: reason };
  }
}

export async function GET() {
  const env: Record<string, boolean> = {};
  for (const key of REQUIRED_ENV) env[key] = !!process.env[key];
  for (const key of OPTIONAL_ENV) env[key] = !!process.env[key];

  const missingRequired = REQUIRED_ENV.filter((k) => !process.env[k]);
  const db = await pingSupabase();

  const overall = missingRequired.length === 0 && db.ok ? 'healthy' : 'degraded';

  return NextResponse.json(
    {
      status: overall,
      uptimeSeconds: Math.floor(process.uptime()),
      node: process.version,
      env,
      missingRequired,
      db,
      timestamp: new Date().toISOString(),
    },
    {
      status: overall === 'healthy' ? 200 : 503,
      headers: {
        'cache-control': 'no-store, max-age=0',
      },
    }
  );
}

// Also accept HEAD so uptime monitors that only want a status code can use
// the cheapest possible probe.
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
