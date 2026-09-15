'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/cms/audit';

// The coupons table (migration 130) isn't in types/database.ts yet, so this
// module talks to Supabase through a loosely-typed handle. Admin-only: RLS is
// public.is_admin(auth.uid()) for all operations.

async function assertAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Ou dwe konekte.' };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if ((profile as { role?: string } | null)?.role !== 'admin') {
    return { ok: false as const, error: 'Aksè entèdi.' };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { ok: true as const, user, sb: supabase as any };
}

// Coupon codes are always upper-case, no spaces — the shop matches on the
// exact string so we normalise here rather than trust the operator's caps.
function normalizeCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 40);
}

export type CouponState = { ok?: boolean; error?: string; id?: string };

export async function saveCoupon(input: {
  id?: string;
  code: string;
  description?: string;
  discount_type: 'percent' | 'fixed';
  amount: number;
  active: boolean;
  expires_at?: string | null;
  max_uses?: number | null;
}): Promise<CouponState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const code = normalizeCode(input.code);
  if (code.length < 3) return { error: 'Kòd la twò kout (omwen 3 karaktè).' };

  const discount_type = input.discount_type === 'fixed' ? 'fixed' : 'percent';
  let amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount < 0) amount = 0;
  if (discount_type === 'percent' && amount > 100) amount = 100;

  const rawMax = input.max_uses;
  const max_uses =
    rawMax === null || rawMax === undefined || !Number.isFinite(Number(rawMax))
      ? null
      : Math.max(1, Math.floor(Number(rawMax)));

  const row = {
    code,
    description: input.description?.trim() || null,
    discount_type,
    amount,
    active: !!input.active,
    expires_at: input.expires_at ? new Date(input.expires_at).toISOString() : null,
    max_uses,
  };

  let error;
  let id = input.id;
  if (input.id) {
    ({ error } = await auth.sb.from('coupons').update(row).eq('id', input.id));
  } else {
    const res = await auth.sb
      .from('coupons')
      .insert({ ...row, created_by: auth.user.id })
      .select('id')
      .single();
    error = res.error;
    id = res.data?.id;
  }
  if (error) {
    if (/duplicate key|unique/i.test(error.message)) {
      return { error: `Kòd "${code}" deja egziste.` };
    }
    return { error: error.message };
  }

  await logAudit(auth.sb, auth.user, {
    action: input.id ? 'update' : 'create',
    entity: 'coupon',
    entity_id: id,
    summary: code,
  });
  revalidatePath('/admin/coupons');
  return { ok: true, id };
}

export async function toggleCoupon(
  id: string
): Promise<{ ok: true; value: boolean } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data: current } = await auth.sb
    .from('coupons')
    .select('active, code')
    .eq('id', id)
    .maybeSingle();
  const c = current as { active: boolean; code: string } | null;
  if (!c) return { ok: false, error: 'Koupon an pa egziste.' };

  const next = !c.active;
  const { error } = await auth.sb.from('coupons').update({ active: next }).eq('id', id);
  if (error) return { ok: false, error: error.message };

  await logAudit(auth.sb, auth.user, {
    action: next ? 'publish' : 'unpublish',
    entity: 'coupon',
    entity_id: id,
    summary: c.code,
  });
  revalidatePath('/admin/coupons');
  return { ok: true, value: next };
}

export async function deleteCoupon(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const { error } = await auth.sb.from('coupons').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logAudit(auth.sb, auth.user, { action: 'delete', entity: 'coupon', entity_id: id });
  revalidatePath('/admin/coupons');
  return { ok: true };
}
