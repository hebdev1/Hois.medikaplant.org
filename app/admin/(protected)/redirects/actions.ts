'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/cms/audit';
import { hasCapability, type AdminRole } from '../admin-nav-config';

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
  if (!hasCapability(row.admin_role, 'manage_resources')) {
    return { ok: false as const, error: 'Ou pa gen pèmisyon pou sa.' };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { ok: true as const, user, sb: supabase as any };
}

export type RedirectState = { ok?: boolean; error?: string };

function normalizeFrom(s: string): string {
  let p = s.trim().split('?')[0];
  if (!p.startsWith('/')) p = '/' + p;
  p = p.replace(/\/+$/, '');
  return p === '' ? '/' : p;
}

export async function createRedirect(input: {
  from_path: string;
  to_path: string;
  status_code: number;
}): Promise<RedirectState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const from_path = normalizeFrom(input.from_path);
  const to_path = input.to_path.trim();
  if (from_path.length < 2) return { error: 'Ansyen adrès la pa valab.' };
  if (!to_path) return { error: 'Bay nouvo adrès la.' };
  if (from_path === to_path) return { error: 'Ansyen ak nouvo adrès la menm.' };

  const { error } = await auth.sb.from('redirects').insert({
    from_path,
    to_path,
    status_code: input.status_code || 301,
    created_by: auth.user.id,
  });
  if (error) {
    if (/duplicate key|unique/i.test(error.message)) {
      return { error: `Gen deja yon redireksyon pou "${from_path}".` };
    }
    return { error: error.message };
  }
  await logAudit(auth.sb, auth.user, { action: 'create', entity: 'redirect', summary: `${from_path} → ${to_path}` });
  revalidatePath('/admin/redirects');
  return { ok: true };
}

export async function toggleRedirect(id: string, active: boolean): Promise<RedirectState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };
  const { error } = await auth.sb.from('redirects').update({ active }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/redirects');
  return { ok: true };
}

export async function deleteRedirect(id: string): Promise<RedirectState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };
  const { error } = await auth.sb.from('redirects').delete().eq('id', id);
  if (error) return { error: error.message };
  await logAudit(auth.sb, auth.user, { action: 'delete', entity: 'redirect', entity_id: id });
  revalidatePath('/admin/redirects');
  return { ok: true };
}
