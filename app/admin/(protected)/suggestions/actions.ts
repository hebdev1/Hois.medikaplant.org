'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { hasCapability, type AdminRole } from '../admin-nav-config';

// Suggestions triage is a light workspace — every admin sub-role has
// `manage_self` so the gate is essentially "any staff signed in as an
// admin", but we still route it through the capability model for
// consistency with the audit hardening (B1).

const STATUS_VALUES = [
  'new',
  'triaged',
  'planned',
  'in_progress',
  'done',
  'declined',
] as const;
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
  if (!hasCapability(row.admin_role, 'manage_self')) {
    return { ok: false as const, error: 'Pa gen pèmisyon.' };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { ok: true as const, user, supabase, sb: supabase as any };
}

export async function updateSuggestionStatus(
  id: string,
  next: Status
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!STATUS_VALUES.includes(next)) {
    return { ok: false, error: 'Estati pa valid.' };
  }
  const { error } = await auth.sb
    .from('user_suggestions')
    .update({ status: next, triaged_by: auth.user.id })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/suggestions');
  return { ok: true };
}

export async function updateSuggestionNotes(
  id: string,
  notes: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const clean = notes.trim().slice(0, 4000);
  const { error } = await auth.sb
    .from('user_suggestions')
    .update({
      admin_notes: clean.length > 0 ? clean : null,
      triaged_by: auth.user.id,
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/suggestions');
  return { ok: true };
}

export async function deleteSuggestion(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const { error } = await auth.sb
    .from('user_suggestions')
    .delete()
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/suggestions');
  return { ok: true };
}
