// Edge Function: delete-user
// Authenticated user calls this to permanently delete their own account.
// Uses the service role to call auth.admin.deleteUser, which cascades
// to profiles, subscriptions, health_logs, etc. via ON DELETE CASCADE.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS, status: 204 });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return jsonResponse({ error: 'Missing bearer token' }, 401);
  }
  const token = authHeader.slice(7).trim();

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'Server misconfigured' }, 500);
  }

  // Verify the caller is who they say they are
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userResp, error: userErr } = await userClient.auth.getUser(token);
  if (userErr || !userResp.user) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  const userId = userResp.user.id;

  // Optional: require an explicit confirmation token from the request body
  let confirmation: string | null = null;
  try {
    const body = await req.json();
    confirmation = typeof body?.confirmation === 'string' ? body.confirmation : null;
  } catch (_) {
    // body is optional
  }
  if (confirmation !== 'DELETE MY ACCOUNT') {
    return jsonResponse({ error: 'Missing or invalid confirmation phrase' }, 400);
  }

  // Use the service role to actually delete the auth user.
  // ON DELETE CASCADE on profiles.id → auth.users.id removes everything else.
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Clean storage objects under avatars/<uid>/ before the user is gone
  try {
    const { data: avatarFiles } = await admin.storage
      .from('public-assets')
      .list(`avatars/${userId}`);
    if (avatarFiles && avatarFiles.length > 0) {
      const paths = avatarFiles.map((f: { name: string }) => `avatars/${userId}/${f.name}`);
      await admin.storage.from('public-assets').remove(paths);
    }
  } catch (_) {
    // Non-fatal — proceed with deletion even if storage cleanup fails.
  }

  const { error: deleteErr } = await admin.auth.admin.deleteUser(userId);
  if (deleteErr) {
    return jsonResponse({ error: deleteErr.message }, 500);
  }

  return jsonResponse({ ok: true });
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}
