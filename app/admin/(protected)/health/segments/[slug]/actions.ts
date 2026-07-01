'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import { hasCapability, type AdminRole } from '../../../admin-nav-config';

type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

async function assertAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Ou dwe konekte.' };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, admin_role')
    .eq('id', user.id)
    .maybeSingle();
  const row = profile as { role: string; admin_role: AdminRole | null } | null;
  if (row?.role !== 'admin') {
    return { ok: false as const, error: 'Aksè entèdi.' };
  }
  if (!hasCapability(row.admin_role, 'view_health')) {
    return { ok: false as const, error: 'Ou pa gen pèmisyon pou jere swivi sante a.' };
  }
  return { ok: true as const, user, supabase };
}

export type BroadcastResult =
  | { ok: true; delivered: number }
  | { ok: false; error: string };

/**
 * Fan-out a single notification to every user_id in the segment via one
 * bulk INSERT against notifications. The schema treats target='user' +
 * target_user_id=<id> as the per-recipient form, so we materialize one row
 * per user. That mirrors what /admin/notifications already does for
 * direct messages — segment broadcast is just a multi-recipient version
 * of the same idempotent insert.
 */
export async function broadcastToSegment(input: {
  slug: string;
  title: string;
  message: string;
  userIds: string[];
}): Promise<BroadcastResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const title = input.title.trim();
  const message = input.message.trim();
  if (title.length < 3) return { ok: false, error: 'Tit la twò kout.' };
  if (title.length > 120) return { ok: false, error: 'Tit la twò long.' };
  if (message.length < 10) return { ok: false, error: 'Mesaj la twò kout.' };
  if (message.length > 1000) return { ok: false, error: 'Mesaj la twò long.' };
  const userIds = input.userIds.filter(
    (id, i, arr) => id && arr.indexOf(id) === i
  );
  if (userIds.length === 0) {
    return { ok: false, error: 'Pa gen okenn manm nan segman sa.' };
  }
  if (userIds.length > 5000) {
    return {
      ok: false,
      error: 'Segman an twò gwo pou yon sèl voye (maks 5000).',
    };
  }

  // One row per recipient. The admin-side notification bell + the
  // user-side notification dropdown both subscribe to INSERTs on this
  // table — recipients see the message in realtime within a second.
  const rows: NotificationInsert[] = userIds.map((uid) => ({
    title,
    message,
    target: 'user',
    target_user_id: uid,
    target_plan: null,
    created_by: auth.user.id,
  }));

  const { error, count } = await auth.supabase
    .from('notifications')
    .insert(rows, { count: 'exact' });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/admin/health/segments/${input.slug}`);
  revalidatePath('/admin/notifications');
  return { ok: true, delivered: count ?? userIds.length };
}
