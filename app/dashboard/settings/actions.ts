'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type PrefRow = Database['public']['Tables']['user_preferences']['Row'];
type PrefUpdate = Database['public']['Tables']['user_preferences']['Update'];

const ALLOWED_KEYS: readonly (keyof PrefUpdate)[] = [
  'accent',
  'density',
  'font_size',
  'dark_mode',
  'language',
  'email_notifications',
  'push_notifications',
  'daily_advice_email',
  'badge_unlock_email',
  'weekly_summary_email',
  'reminder_time',
  'target_blood_sugar_min',
  'target_blood_sugar_max',
  'target_weight_kg',
  'daily_water_liters',
  'weight_unit',
  'show_in_vip_list',
  'share_progress_with_coach',
  'allow_research_use',
] as const;

export type UpdateResult =
  | { ok: true; preferences: PrefRow }
  | { ok: false; error: string };

/**
 * Update a single preference key. Each form control on the settings page calls
 * this on change for live persistence; the server returns the canonical row so
 * any normalization (e.g. clamping) reaches the UI immediately.
 */
export async function updatePreference<K extends keyof PrefUpdate>(
  key: K,
  value: PrefUpdate[K]
): Promise<UpdateResult> {
  if (!ALLOWED_KEYS.includes(key)) {
    return { ok: false, error: 'Kle prefere a pa valid.' };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  const update: PrefUpdate = { [key]: value } as PrefUpdate;

  // Upsert so missing rows (rare — trigger should have created one) are handled.
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: user.id, ...update }, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'Erè inkoni.' };
  }

  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard');
  return { ok: true, preferences: data as PrefRow };
}

/**
 * Update profile fields the settings page exposes (full_name, avatar_url).
 * Profile.email / role / plan are managed elsewhere (admin / checkout).
 */
export async function updateProfile(input: {
  full_name?: string;
  avatar_url?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  const update: Database['public']['Tables']['profiles']['Update'] = {};
  if (input.full_name !== undefined) {
    const trimmed = input.full_name.trim();
    if (trimmed.length < 2) return { ok: false, error: 'Non an twò kout.' };
    update.full_name = trimmed;
  }
  if (input.avatar_url !== undefined) update.avatar_url = input.avatar_url;

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/settings');
  return { ok: true };
}
