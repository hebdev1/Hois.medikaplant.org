'use server';

import { createClient } from '@/lib/supabase/server';

// Read-state for the admin bell lives in the same `notification_reads` table
// the member bell uses (presence of a row = read). These actions are the
// admin-scoped twins of app/dashboard/notifications/actions.ts: they only ever
// touch the current admin's OWN event feed (target='user', target_user_id=me),
// never the whole notifications table (which, for an admin, RLS exposes in
// full — every member's personal rows included).

export async function markAdminNotificationRead(
  notificationId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  const { error } = await supabase.from('notification_reads').upsert(
    { user_id: user.id, notification_id: notificationId },
    { onConflict: 'notification_id,user_id', ignoreDuplicates: true }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function markAllAdminNotificationsRead(): Promise<
  { ok: true; count: number } | { ok: false; error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  // Only THIS admin's own event feed — never the global table.
  const { data: rows } = await supabase
    .from('notifications')
    .select('id')
    .eq('target', 'user')
    .eq('target_user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const list = (rows ?? []) as { id: string }[];
  if (list.length === 0) return { ok: true, count: 0 };

  const { error } = await supabase.from('notification_reads').upsert(
    list.map((r) => ({ user_id: user.id, notification_id: r.id })),
    { onConflict: 'notification_id,user_id', ignoreDuplicates: true }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true, count: list.length };
}
