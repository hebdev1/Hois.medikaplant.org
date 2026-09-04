'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { hasCapability, type AdminRole } from '../../admin-nav-config';

async function assertGlossAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Ou dwe konekte.' };
  const { data } = await supabase
    .from('profiles')
    .select('role, admin_role')
    .eq('id', user.id)
    .maybeSingle();
  const p = data as { role: string; admin_role: AdminRole | null } | null;
  if (p?.role !== 'admin') return { ok: false as const, error: 'Aksè entèdi.' };
  if (!hasCapability(p.admin_role, 'manage_guides')) {
    return { ok: false as const, error: 'Ou pa gen pèmisyon pou jere glosè a.' };
  }
  return { ok: true as const, user };
}

export async function reviewContribution(
  id: string,
  decision: 'apwouve' | 'rejte'
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (decision !== 'apwouve' && decision !== 'rejte') {
    return { ok: false, error: 'Desizyon an pa valab.' };
  }
  const auth = await assertGlossAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;
  const { error } = await db
    .from('glossary_contributions')
    .update({
      status: decision,
      reviewed_at: new Date().toISOString(),
      reviewed_by: auth.user.id,
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/glose/kontribisyon');
  revalidatePath('/admin/glose');
  return { ok: true };
}
