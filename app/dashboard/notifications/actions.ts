'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * Mark a single notification as read by inserting into `notification_reads`.
 * Idempotent — if the row exists already, it's a no-op (ON CONFLICT).
 */
export async function markNotificationRead(
  notificationId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  const { error } = await supabase.from('notification_reads').upsert(
    {
      user_id: user.id,
      notification_id: notificationId,
    },
    { onConflict: 'notification_id,user_id', ignoreDuplicates: true }
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard');
  return { ok: true };
}

/**
 * Mark every notification visible to the current user as read.
 * Picks up notifications targeted to all/plan/user and fans out reads.
 */
export async function markAllNotificationsRead(): Promise<
  { ok: true; count: number } | { ok: false; error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  // RLS already restricts SELECT on `notifications` to visible rows
  const { data: visible } = await supabase
    .from('notifications')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(200);

  const rows = (visible ?? []) as { id: string }[];
  if (rows.length === 0) return { ok: true, count: 0 };

  const { error } = await supabase.from('notification_reads').upsert(
    rows.map((r) => ({ user_id: user.id, notification_id: r.id })),
    { onConflict: 'notification_id,user_id', ignoreDuplicates: true }
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard');
  return { ok: true, count: rows.length };
}
