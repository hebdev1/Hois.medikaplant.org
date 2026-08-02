import 'server-only';

// Zoom Server-to-Server OAuth client. Server-only: the account credentials must
// never reach the browser. Import this from server actions / server components
// only — the `server-only` guard above turns an accidental client import into a
// build error.
//
// Setup (one-time, done by the account owner): create a Server-to-Server OAuth
// app in the Zoom Marketplace and set ZOOM_ACCOUNT_ID / ZOOM_CLIENT_ID /
// ZOOM_CLIENT_SECRET in the server environment. See docs/zoom-setup-guide.md.

const ZOOM_OAUTH_URL = 'https://zoom.us/oauth/token';
const ZOOM_API_BASE = 'https://api.zoom.us/v2';

type CachedToken = { token: string; expiresAt: number };
let cached: CachedToken | null = null;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Zoom is not configured: ${name} is missing. See docs/zoom-setup-guide.md.`
    );
  }
  return v;
}

// Fetch (and cache) an account access token. Tokens live 1h; we refresh ~5 min
// early. Cached in module memory — fine for a single server instance.
export async function getAccessToken(): Promise<string> {
  if (cached && Date.now() < cached.expiresAt) return cached.token;

  const accountId = requireEnv('ZOOM_ACCOUNT_ID');
  const clientId = requireEnv('ZOOM_CLIENT_ID');
  const clientSecret = requireEnv('ZOOM_CLIENT_SECRET');
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(
    `${ZOOM_OAUTH_URL}?grant_type=account_credentials&account_id=${encodeURIComponent(
      accountId
    )}`,
    {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}` },
      cache: 'no-store',
    }
  );
  if (!res.ok) {
    throw new Error(`Zoom token request failed (${res.status}).`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cached = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };
  return cached.token;
}

export type ZoomFetchInit = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

// Authenticated Zoom API call. Retries once on 401 (expired/revoked token).
export async function zoomFetch(
  path: string,
  init: ZoomFetchInit = {},
  retry = false
): Promise<Response> {
  const token = await getAccessToken();
  const res = await fetch(`${ZOOM_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (res.status === 401 && !retry) {
    cached = null; // force a fresh token, then retry once
    return zoomFetch(path, init, true);
  }
  return res;
}
