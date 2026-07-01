'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import { hasCapability, type AdminRole } from '../admin-nav-config';

type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

export type BroadcastState = {
  error?: string;
  ok?: boolean;
};

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
  if (!hasCapability(row.admin_role, 'broadcast_notifications')) {
    return { ok: false as const, error: 'Ou pa gen pèmisyon pou voye notifikasyon.' };
  }
  return { ok: true as const, user, supabase };
}

/**
 * Broadcast a notification — target can be:
 *   • all          → every authed member sees it via RLS
 *   • plan         → only members on the chosen plan (basic/premium/vip)
 *   • user         → a single member, resolved by email
 *
 * The realtime subscription on each member's NotificationBell picks the
 * inserted row up live, so there's no polling lag.
 */
export async function sendBroadcastNotification(
  _prev: BroadcastState,
  formData: FormData
): Promise<BroadcastState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const target = formData.get('target')?.toString();
  if (!target || !['all', 'plan', 'user'].includes(target)) {
    return { error: 'Sib pa valid.' };
  }

  const title = (formData.get('title')?.toString() ?? '').trim();
  const message = (formData.get('message')?.toString() ?? '').trim();
  const link_url = (formData.get('link_url')?.toString() ?? '').trim() || null;

  if (title.length < 2) return { error: 'Tit la twò kout.' };
  if (title.length > 120) return { error: 'Tit la twò long (maks 120 karaktè).' };
  if (message.length < 2) return { error: 'Mesaj la twò kout.' };
  if (message.length > 1000) {
    return { error: 'Mesaj la twò long (maks 1000 karaktè).' };
  }

  const insert: NotificationInsert = {
    title,
    message,
    target: target as 'all' | 'plan' | 'user',
    link_url,
    created_by: auth.user.id,
  };

  if (target === 'plan') {
    const plan = formData.get('target_plan')?.toString();
    if (!plan || !['basic', 'premium', 'vip'].includes(plan)) {
      return { error: 'Plan ki chwazi a pa valid.' };
    }
    insert.target_plan = plan as 'basic' | 'premium' | 'vip';
  } else if (target === 'user') {
    const email = (formData.get('target_user_email')?.toString() ?? '')
      .trim()
      .toLowerCase();
    if (!email) return { error: 'Antre imel manm nan.' };
    const { data: profile } = await auth.supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    const row = profile as { id: string } | null;
    if (!row) {
      return { error: `Pa gen manm ki gen imel "${email}".` };
    }
    insert.target_user_id = row.id;
  }

  const { error } = await auth.supabase.from('notifications').insert(insert);
  if (error) return { error: error.message };

  revalidatePath('/admin/notifications');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function deleteNotification(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from('notifications')
    .delete()
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/notifications');
  return { ok: true };
}
