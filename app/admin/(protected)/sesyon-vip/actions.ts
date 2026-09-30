'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { hasCapability, type AdminRole } from '../admin-nav-config';

// Confidential VIP (Melis) session requests. Gated to `manage_subscriptions`
// (super_admin + admin only) so support staff can't see founder sessions.

const STATUS_VALUES = ['nouvo', 'pwograme', 'fèt', 'refize'] as const;
type Status = (typeof STATUS_VALUES)[number];

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
  if (!hasCapability(row.admin_role, 'manage_subscriptions')) {
    return { ok: false as const, error: 'Pa gen pèmisyon.' };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { ok: true as const, user, supabase, sb: supabase as any };
}

export async function updateVipSessionStatus(
  id: string,
  next: Status
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!STATUS_VALUES.includes(next)) {
    return { ok: false, error: 'Estati pa valid.' };
  }
  const { error } = await auth.sb
    .from('vip_session_requests')
    .update({
      status: next,
      handled_by: auth.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/sesyon-vip');
  return { ok: true };
}

export async function updateVipSessionAdminNote(
  id: string,
  note: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const clean = note.trim().slice(0, 4000);
  const { error } = await auth.sb
    .from('vip_session_requests')
    .update({
      admin_note: clean.length > 0 ? clean : null,
      handled_by: auth.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/sesyon-vip');
  return { ok: true };
}
