'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/cms/audit';
import { hasCapability, type AdminRole } from '../admin-nav-config';

// The `products` table (site remedy catalog, mirrored from medikaplantshop.com)
// predates types/database.ts's last regenerate, so this module uses a
// loosely-typed handle. Admin-gated by profiles.role === 'admin'.

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
    return { ok: false as const, error: 'Ou pa gen pèmisyon pou sa.' };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { ok: true as const, user, sb: supabase as any };
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `pwodwi-${Date.now().toString(36)}`
  );
}

const PLAN_VALUES = ['basic', 'premium', 'vip'] as const;
const CURRENCY_VALUES = ['EUR', 'USD', 'HTG', 'CAD'] as const;

function toMoney(raw: number | string | null | undefined): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

export type ProductState = { ok?: boolean; error?: string; id?: string };

export async function saveProduct(input: {
  id?: string;
  name: string;
  slug?: string;
  tagline?: string;
  botanical?: string;
  description?: string;
  price: number | string;
  old_price?: number | string | null;
  currency?: string;
  shipping_note?: string;
  image_url?: string;
  plan_recommendation?: string | null;
  featured: boolean;
  active: boolean;
}): Promise<ProductState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const name = input.name.trim();
  if (name.length < 2) return { error: 'Non pwodwi a twò kout.' };

  const price = toMoney(input.price);
  if (price === null) return { error: 'Pri a dwe yon nonm valab (0 oswa plis).' };

  const slug = slugify(input.slug || name);
  const currency = CURRENCY_VALUES.includes(
    (input.currency ?? '') as (typeof CURRENCY_VALUES)[number]
  )
    ? input.currency
    : 'EUR';
  const plan =
    input.plan_recommendation &&
    PLAN_VALUES.includes(input.plan_recommendation as (typeof PLAN_VALUES)[number])
      ? input.plan_recommendation
      : null;

  const row = {
    name,
    slug,
    tagline: input.tagline?.trim() || null,
    botanical: input.botanical?.trim() || null,
    description: input.description?.trim() || null,
    price,
    old_price: toMoney(input.old_price ?? null),
    currency,
    shipping_note: input.shipping_note?.trim() || null,
    image_url: input.image_url?.trim() || null,
    plan_recommendation: plan,
    featured: !!input.featured,
    active: !!input.active,
    updated_at: new Date().toISOString(),
  };

  let error;
  let id = input.id;
  if (input.id) {
    ({ error } = await auth.sb.from('products').update(row).eq('id', input.id));
  } else {
    const res = await auth.sb.from('products').insert(row).select('id').single();
    error = res.error;
    id = res.data?.id;
  }
  if (error) {
    if (/duplicate key|unique/i.test(error.message)) {
      return { error: `Slug "${slug}" deja pran.` };
    }
    return { error: error.message };
  }

  await logAudit(auth.sb, auth.user, {
    action: input.id ? 'update' : 'create',
    entity: 'product',
    entity_id: id,
    summary: name,
  });
  revalidatePath('/admin/products');
  revalidatePath('/dashboard');
  return { ok: true, id };
}

export async function toggleProductFlag(
  id: string,
  field: 'featured' | 'active'
): Promise<{ ok: true; value: boolean } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data: current } = await auth.sb
    .from('products')
    .select(`${field}, name`)
    .eq('id', id)
    .maybeSingle();
  const c = current as Record<string, boolean | string> | null;
  if (!c) return { ok: false, error: 'Pwodwi a pa egziste.' };

  const next = !c[field];
  const { error } = await auth.sb.from('products').update({ [field]: next }).eq('id', id);
  if (error) return { ok: false, error: error.message };

  await logAudit(auth.sb, auth.user, {
    action: 'update',
    entity: 'product',
    entity_id: id,
    summary: `${String(c.name)} · ${field}=${next}`,
  });
  revalidatePath('/admin/products');
  revalidatePath('/dashboard');
  return { ok: true, value: next };
}

export async function deleteProduct(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const { error } = await auth.sb.from('products').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logAudit(auth.sb, auth.user, { action: 'delete', entity: 'product', entity_id: id });
  revalidatePath('/admin/products');
  revalidatePath('/dashboard');
  return { ok: true };
}
