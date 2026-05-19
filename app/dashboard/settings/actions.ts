'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type PrefRow = Database['public']['Tables']['user_preferences']['Row'];
type PrefUpdate = Database['public']['Tables']['user_preferences']['Update'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type MedicalRow = Database['public']['Tables']['user_medical_info']['Row'];
type MedicalUpdate = Database['public']['Tables']['user_medical_info']['Update'];

// ─── Preferences ────────────────────────────────────────────────────────────

const ALLOWED_PREF_KEYS: readonly (keyof PrefUpdate)[] = [
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

export type UpdatePrefResult =
  | { ok: true; preferences: PrefRow }
  | { ok: false; error: string };

export async function updatePreference<K extends keyof PrefUpdate>(
  key: K,
  value: PrefUpdate[K]
): Promise<UpdatePrefResult> {
  if (!ALLOWED_PREF_KEYS.includes(key)) {
    return { ok: false, error: 'Kle prefere a pa valid.' };
  }
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  const update: PrefUpdate = { [key]: value } as PrefUpdate;
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: user.id, ...update }, { onConflict: 'user_id' })
    .select('*')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Erè inkoni.' };

  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard');
  return { ok: true, preferences: data as PrefRow };
}

// ─── Profile (extended) ─────────────────────────────────────────────────────

const ALLOWED_PROFILE_KEYS: readonly (keyof ProfileUpdate)[] = [
  'first_name',
  'last_name',
  'full_name',
  'avatar_url',
  'date_of_birth',
  'gender',
  'phone',
  'address_line1',
  'address_line2',
  'city',
  'region',
  'postal_code',
  'country',
  'emergency_contact_name',
  'emergency_contact_phone',
  'bio',
] as const;

const GENDER_VALUES = ['male', 'female', 'other', 'prefer_not_to_say'] as const;

export type ProfileResult = { ok: true } | { ok: false; error: string };

export async function updateProfileField<K extends keyof ProfileUpdate>(
  key: K,
  value: ProfileUpdate[K]
): Promise<ProfileResult> {
  if (!ALLOWED_PROFILE_KEYS.includes(key)) {
    return { ok: false, error: 'Chan pwofil sa a pa otorize.' };
  }
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  // Field-specific validation
  let cleaned: ProfileUpdate[K] = value;
  if (typeof cleaned === 'string') {
    const trimmed = (cleaned as string).trim();
    cleaned = (trimmed === '' ? null : trimmed) as ProfileUpdate[K];
  }
  if (key === 'first_name' || key === 'last_name' || key === 'full_name') {
    if (cleaned !== null && (cleaned as string).length < 2) {
      return { ok: false, error: 'Non an twò kout.' };
    }
  }
  if (key === 'gender' && cleaned !== null) {
    if (!GENDER_VALUES.includes(cleaned as (typeof GENDER_VALUES)[number])) {
      return { ok: false, error: 'Sèks ki chwazi a pa valid.' };
    }
  }
  if (key === 'date_of_birth' && cleaned !== null) {
    const d = new Date(cleaned as string);
    if (Number.isNaN(d.getTime())) return { ok: false, error: 'Dat la pa valid.' };
    const today = new Date();
    if (d > today) return { ok: false, error: 'Dat nesans pa ka nan fiti.' };
    const minBirth = new Date(today.getFullYear() - 130, today.getMonth(), today.getDate());
    if (d < minBirth) return { ok: false, error: 'Dat la twò ansyen.' };
  }
  if ((key === 'phone' || key === 'emergency_contact_phone') && cleaned !== null) {
    const phone = (cleaned as string).replace(/[\s\-()]/g, '');
    if (!/^[+]?[0-9]{7,15}$/.test(phone)) {
      return { ok: false, error: 'Nimewo telefòn pa valid.' };
    }
    cleaned = phone as ProfileUpdate[K];
  }

  const update: ProfileUpdate = { [key]: cleaned } as ProfileUpdate;

  // Keep full_name in sync if first/last changed
  if (key === 'first_name' || key === 'last_name') {
    const { data: current } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();
    const cur = current as { first_name: string | null; last_name: string | null } | null;
    const first = key === 'first_name' ? (cleaned as string | null) : cur?.first_name ?? null;
    const last = key === 'last_name' ? (cleaned as string | null) : cur?.last_name ?? null;
    const combined = [first, last].filter(Boolean).join(' ').trim();
    if (combined.length >= 2) update.full_name = combined;
  }

  const { error } = await supabase.from('profiles').update(update).eq('id', user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/settings');
  return { ok: true };
}

// ─── Avatar upload ──────────────────────────────────────────────────────────

const ALLOWED_AVATAR_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_BYTES = 4 * 1024 * 1024; // 4 MB

export async function uploadAvatar(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  const file = formData.get('file');
  if (!(file instanceof File)) return { ok: false, error: 'Pa gen fichye.' };
  if (!ALLOWED_AVATAR_MIME.includes(file.type)) {
    return { ok: false, error: 'Sèl JPG, PNG, ak WEBP otorize.' };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, error: 'Foto a twò gwo (maks 4 Mo).' };
  }

  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
  // Bust browser cache by changing the path on every upload
  const objectPath = `avatars/${user.id}/${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from('public-assets')
    .upload(objectPath, arrayBuffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: true,
    });
  if (uploadError) return { ok: false, error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from('public-assets').getPublicUrl(objectPath);

  // Delete previous avatar(s) so we don't leak storage
  const { data: previous } = await supabase.storage
    .from('public-assets')
    .list(`avatars/${user.id}`);
  const toDelete = (previous ?? [])
    .map((f) => `avatars/${user.id}/${f.name}`)
    .filter((p) => p !== objectPath);
  if (toDelete.length > 0) {
    await supabase.storage.from('public-assets').remove(toDelete);
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id);
  if (profileError) return { ok: false, error: profileError.message };

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/settings');
  return { ok: true, url: publicUrl };
}

export async function removeAvatar(): Promise<ProfileResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  const { data: previous } = await supabase.storage
    .from('public-assets')
    .list(`avatars/${user.id}`);
  const paths = (previous ?? []).map((f) => `avatars/${user.id}/${f.name}`);
  if (paths.length > 0) {
    await supabase.storage.from('public-assets').remove(paths);
  }

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/settings');
  return { ok: true };
}

// ─── Medical info ───────────────────────────────────────────────────────────

const ALLOWED_MEDICAL_KEYS: readonly (keyof MedicalUpdate)[] = [
  'blood_type',
  'height_cm',
  'conditions',
  'allergies',
  'medications',
  'chronic_diseases',
  'past_surgeries',
  'doctor_name',
  'doctor_phone',
  'preferred_pharmacy',
  'health_goal',
  'notes',
] as const;

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'] as const;
const HEALTH_GOALS = [
  'manage_diabetes',
  'manage_hypertension',
  'lose_weight',
  'gain_weight',
  'spiritual_balance',
  'general_wellness',
  'detox',
  'fertility',
  'other',
] as const;

export type MedicalResult =
  | { ok: true; medical: MedicalRow }
  | { ok: false; error: string };

export async function updateMedicalInfo<K extends keyof MedicalUpdate>(
  key: K,
  value: MedicalUpdate[K]
): Promise<MedicalResult> {
  if (!ALLOWED_MEDICAL_KEYS.includes(key)) {
    return { ok: false, error: 'Chan sante sa a pa otorize.' };
  }
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  let cleaned: MedicalUpdate[K] = value;

  if (typeof cleaned === 'string') {
    const trimmed = (cleaned as string).trim();
    cleaned = (trimmed === '' ? null : trimmed) as MedicalUpdate[K];
  }
  if (key === 'blood_type' && cleaned !== null) {
    if (!BLOOD_TYPES.includes(cleaned as (typeof BLOOD_TYPES)[number])) {
      return { ok: false, error: 'Tip san an pa valid.' };
    }
  }
  if (key === 'health_goal' && cleaned !== null) {
    if (!HEALTH_GOALS.includes(cleaned as (typeof HEALTH_GOALS)[number])) {
      return { ok: false, error: 'Objektif sante pa valid.' };
    }
  }
  if (key === 'height_cm' && cleaned !== null) {
    const h = Number(cleaned);
    if (!Number.isFinite(h) || h < 50 || h > 250) {
      return { ok: false, error: 'Wotè a dwe ant 50 ak 250 cm.' };
    }
    cleaned = h as MedicalUpdate[K];
  }
  if (key === 'conditions') {
    if (!Array.isArray(cleaned)) {
      return { ok: false, error: 'Lis kondisyon yo pa valid.' };
    }
    // dedupe + trim
    const cleanedArr = Array.from(
      new Set(
        (cleaned as string[])
          .map((s) => String(s).trim())
          .filter((s) => s.length > 0 && s.length <= 64)
      )
    ).slice(0, 30);
    cleaned = cleanedArr as MedicalUpdate[K];
  }
  if ((key === 'doctor_phone') && cleaned !== null) {
    const p = (cleaned as string).replace(/[\s\-()]/g, '');
    if (!/^[+]?[0-9]{7,15}$/.test(p)) {
      return { ok: false, error: 'Nimewo doktè a pa valid.' };
    }
    cleaned = p as MedicalUpdate[K];
  }

  const update: MedicalUpdate = { [key]: cleaned } as MedicalUpdate;
  const { data, error } = await supabase
    .from('user_medical_info')
    .upsert({ user_id: user.id, ...update }, { onConflict: 'user_id' })
    .select('*')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Erè inkoni.' };

  revalidatePath('/dashboard/settings');
  return { ok: true, medical: data as MedicalRow };
}

// ─── Subscription management ────────────────────────────────────────────────

export async function cancelActiveSubscription(): Promise<ProfileResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  const { data: active, error: fetchErr } = await supabase
    .from('subscriptions')
    .select('id, plan')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (fetchErr) return { ok: false, error: fetchErr.message };
  if (!active) return { ok: false, error: 'Pa gen sibskripsyon aktif.' };

  // Trigger sync_profile_plan_on_subscription will reconcile profile.plan
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled', end_date: new Date().toISOString() })
    .eq('id', (active as { id: string }).id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/settings');
  return { ok: true };
}

// ─── Security: change password ──────────────────────────────────────────────

export async function changePassword(input: {
  newPassword: string;
  confirmPassword: string;
}): Promise<ProfileResult> {
  if (input.newPassword.length < 8) {
    return { ok: false, error: 'Modpas la dwe gen omwen 8 karaktè.' };
  }
  if (input.newPassword !== input.confirmPassword) {
    return { ok: false, error: 'Modpas yo pa menm.' };
  }
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  const { error } = await supabase.auth.updateUser({ password: input.newPassword });
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
