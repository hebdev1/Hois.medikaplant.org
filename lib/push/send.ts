import 'server-only';
import webpush from 'web-push';
import { createServiceClient } from '@/lib/supabase/service';

// Web Push send helper. Server-only. Configures VAPID lazily from env so the
// rest of the app builds/runs even before the keys are set (it just no-ops).
let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:contact@hoismedikaplant.com';
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

export type PushPayload = { title: string; body: string; url?: string; tag?: string };

// Push to every subscription a user has. Dead endpoints (404/410) are pruned.
// Returns false (no-op) when VAPID isn't configured on this server.
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; removed: number } | false> {
  if (!ensureConfigured()) return false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any;
  const { data: subs } = await sb
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);
  const rows = (subs ?? []) as Array<{
    id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  }>;
  if (rows.length === 0) return { sent: 0, removed: 0 };

  const body = JSON.stringify(payload);
  const dead: string[] = [];
  let sent = 0;

  await Promise.all(
    rows.map(async (r) => {
      try {
        await webpush.sendNotification(
          { endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } },
          body
        );
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) dead.push(r.id);
      }
    })
  );

  if (dead.length > 0) {
    await sb.from('push_subscriptions').delete().in('id', dead);
  }
  return { sent, removed: dead.length };
}
