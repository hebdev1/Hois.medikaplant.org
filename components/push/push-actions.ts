'use server';

import { createClient } from '@/lib/supabase/server';

export type PushSubInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
};

// Save (or refresh) the current member's Web Push subscription. RLS scopes the
// write to the authenticated user; the endpoint is globally unique so a
// re-subscribe from the same device upserts.
export async function savePushSubscription(
  sub: PushSubInput
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };
  if (!sub.endpoint || !sub.p256dh || !sub.auth) {
    return { ok: false, error: 'Abònman an pa konplè.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
      user_agent: sub.userAgent ?? null,
    },
    { onConflict: 'endpoint' }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deletePushSubscription(
  endpoint: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)
    .eq('user_id', user.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
