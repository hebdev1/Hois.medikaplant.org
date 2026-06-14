import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
  try {
    const supabase = createClient();
    // Race the query against a 2s timeout so a Supabase outage doesn't
    // hang the entire healthcheck and cause LSWS to flag us as down.
    const queryPromise = supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('supabase_timeout_2s')), 2000)
    );
    const { error } = (await Promise.race([
      queryPromise,
      timeoutPromise,
    ])) as { error: { message: string } | null };
    if (error) return { ok: false, error: error.message };
    return { ok: true, latencyMs: Date.now() - start };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
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
