'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import { hasCapability, type AdminRole } from '../admin-nav-config';

type BadgeRow = Database['public']['Tables']['badges']['Row'];
type BadgeUpdate = Database['public']['Tables']['badges']['Update'];

const ALLOWED_ICONS = [
  'sprout',
  'leaf',
  'droplet',
  'flame',
  'activity',
  'target',
  'calendar',
  'star',
] as const;
type BadgeIcon = (typeof ALLOWED_ICONS)[number];

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
  if (!hasCapability(row.admin_role, 'manage_badges')) {
    return { ok: false as const, error: 'Ou pa gen pèmisyon pou jere badj yo.' };
  }
  return { ok: true as const, user, supabase };
}

export type BadgeFormState = { error?: string; ok?: boolean; id?: string };

function clean(formData: FormData) {
  const get = (k: string) => (formData.get(k)?.toString() ?? '').trim();
  const name = get('name');
  const sub = get('sub') || null;
  const description = get('description') || null;
  const iconRaw = get('icon') as BadgeIcon;
  const icon: BadgeIcon = (ALLOWED_ICONS as readonly string[]).includes(iconRaw)
    ? iconRaw
    : 'star';
  const thresholdRaw = get('criteria_threshold');
  const threshold = thresholdRaw ? Math.max(1, Math.floor(Number(thresholdRaw))) : 1;
  const orderRaw = get('display_order');
  const order = orderRaw ? Math.max(0, Math.floor(Number(orderRaw))) : 0;
  const active = formData.get('active') === 'on';
  return { name, sub, description, icon, threshold, order, active };
}

function validate(input: ReturnType<typeof clean>) {
  if (input.name.length < 2) return 'Non badj la twò kout.';
  if (input.name.length > 80) return 'Non badj la twò long (maks 80).';
  if (input.sub && input.sub.length > 80) return 'Sub-tit twò long (maks 80).';
  if (input.description && input.description.length > 2000) {
    return 'Deskripsyon twò long (maks 2000 karaktè).';
  }
  if (!Number.isFinite(input.threshold) || input.threshold < 1) {
    return 'Sèyi a dwe yon nimewo pi gran pase 0.';
  }
  return null;
}

/**
 * Update an existing badge. We intentionally do NOT let admin change
 * the slug (used in URLs) or criteria_metric (hard-coded in the
 * recompute_user_badges() SQL function — changing it without a matching
 * DB migration would silently break unlock logic).
 */
export async function updateBadge(
  id: string,
  _prev: BadgeFormState,
  formData: FormData
): Promise<BadgeFormState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const input = clean(formData);
  const v = validate(input);
  if (v) return { error: v };

  const update: BadgeUpdate = {
    name: input.name,
    sub: input.sub,
    description: input.description,
    icon: input.icon,
    criteria_threshold: input.threshold,
    display_order: input.order,
    active: input.active,
  };

  const { data, error } = await auth.supabase
    .from('badges')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) return { error: error?.message ?? 'Erè inkoni.' };

  // If threshold/icon changed, recompute every user who already has a row
  // for this badge so the gallery + detail pages reflect reality without
  // waiting for the next trigger fire. This is bounded by user count and
  // runs after the response is committed to the DB — best-effort, errors
  // are swallowed so a stuck user doesn't block the form.
  try {
    const { data: affected } = await auth.supabase
      .from('user_badges')
      .select('user_id')
      .eq('badge_id', id);
    const userIds = Array.from(
      new Set(
        ((affected ?? []) as Array<{ user_id: string }>).map((r) => r.user_id)
      )
    );
    await Promise.all(
      userIds.map((uid) =>
        auth.supabase.rpc('recompute_user_badges', { uid })
      )
    );
  } catch {
    /* best-effort */
  }

  revalidatePath('/admin/badges');
  revalidatePath('/dashboard/badges');
  revalidatePath(`/dashboard/badges/${(data as BadgeRow).slug}`);
  return { ok: true, id: (data as BadgeRow).id };
}

/**
 * Toggle the `active` flag without going through the full edit form.
 * Inactive badges disappear from the user gallery; they are NOT deleted —
 * historical unlocks stay on the user_badges table.
 */
export async function toggleBadgeActive(
  id: string,
  next: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from('badges')
    .update({ active: next })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/badges');
  revalidatePath('/dashboard/badges');
  return { ok: true };
}
