'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type PrefRow = Database['public']['Tables']['user_preferences']['Row'];
type PrefUpdate = Database['public']['Tables']['user_preferences']['Update'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type MedicalRow = Database['public']['Tables']['user_medical_info']['Row'];
type MedicalUpdate = Database['public']['Tables']['user_medical_info']['Update'];

// ─── Preferences ────────────────────────────────────────────────────────────

const ALLOWED_PREF_KEYS: readonly (keyof PrefUpdate)[] = [
  'accent',
  'density',
  'font_size',
  'font_scale',
  'dark_mode',
  'reduced_motion',
  'high_contrast',
  'sidebar_compact',
  'card_radius',
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

// Server-side validation for the discrete-string appearance keys so a bad
// value can't sneak in via the API and break CSS selectors.
const ACCENT_VALUES = ['forest', 'gold', 'both'] as const;
const DENSITY_VALUES = ['compact', 'regular', 'comfy'] as const;
const RADIUS_VALUES = ['square', 'rounded', 'pill'] as const;
const FONT_SCALE_VALUES = ['small', 'medium', 'large', 'xlarge'] as const;
const LANG_VALUES = ['ht', 'fr', 'en'] as const;

function validateDiscretePref<K extends keyof PrefUpdate>(
  key: K,
  value: PrefUpdate[K]
): string | null {
  if (value === null || value === undefined) return null;
  if (key === 'accent' && !ACCENT_VALUES.includes(value as never)) {
    return 'Aksan koulè a pa valid.';
  }
  if (key === 'density' && !DENSITY_VALUES.includes(value as never)) {
    return 'Densite a pa valid.';
  }
  if (key === 'card_radius' && !RADIUS_VALUES.includes(value as never)) {
    return 'Stil kwen kat la pa valid.';
  }
  if (key === 'font_scale' && !FONT_SCALE_VALUES.includes(value as never)) {
    return 'Echèl tèks la pa valid.';
  }
  if (key === 'language' && !LANG_VALUES.includes(value as never)) {
    return 'Lang la pa sipòte.';
  }
  if (key === 'font_size') {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 12 || n > 22) {
      return 'Gwosè tèks la dwe ant 12 ak 22 px.';
    }
  }
  return null;
}

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
  const validationError = validateDiscretePref(key, value);
  if (validationError) return { ok: false, error: validationError };

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
export type ProfileWithRowResult =
  | { ok: true; profile: ProfileRow }
  | { ok: false; error: string };

export async function updateProfileField<K extends keyof ProfileUpdate>(
  key: K,
  value: ProfileUpdate[K]
): Promise<ProfileWithRowResult> {
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

  const { data: updated, error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', user.id)
    .select('*')
    .single();
  if (error || !updated) {
    return { ok: false, error: error?.message ?? 'Erè inkoni.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/settings');
  return { ok: true, profile: updated as ProfileRow };
}

// ─── Avatar upload ──────────────────────────────────────────────────────────

const ALLOWED_AVATAR_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_BYTES = 4 * 1024 * 1024; // 4 MB

export async function uploadAvatar(
  formData: FormData
): Promise<
  | { ok: true; url: string; profile: ProfileRow }
  | { ok: false; error: string }
> {
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

  const { data: updatedProfile, error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)
    .select('*')
    .single();
  if (profileError || !updatedProfile) {
    return { ok: false, error: profileError?.message ?? 'Erè inkoni.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/settings');
  return { ok: true, url: publicUrl, profile: updatedProfile as ProfileRow };
}

export async function removeAvatar(): Promise<
  { ok: true; profile: ProfileRow } | { ok: false; error: string }
> {
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

  const { data: updated, error } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', user.id)
    .select('*')
    .single();
  if (error || !updated) {
    return { ok: false, error: error?.message ?? 'Erè inkoni.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/settings');
  return { ok: true, profile: updated as ProfileRow };
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
  'health_goal_other',
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
  if (key === 'health_goal_other' && cleaned !== null) {
    if ((cleaned as string).length > 500) {
      return { ok: false, error: 'Detay yo twò long (maks 500 karaktè).' };
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

  // Cancel EVERY active subscription for this user — there should only be
  // one due to the 1:1 invariant, but being defensive prevents a half-
  // cancelled state if the invariant ever drifts.
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled', end_date: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('status', 'active');
  if (error) return { ok: false, error: error.message };

  // Sign the user out so the session can't keep them inside /dashboard.
  // Middleware's "no active sub" rule will route any future attempt to
  // /checkout, so they must purchase a new plan to regain access.
  await supabase.auth.signOut();

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/settings');
  revalidatePath('/admin/subscriptions');
  return { ok: true };
}

// ─── Security: change password ──────────────────────────────────────────────

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ProfileResult> {
  if (input.newPassword.length < 8) {
    return { ok: false, error: 'Modpas la dwe gen omwen 8 karaktè.' };
  }
  if (input.newPassword !== input.confirmPassword) {
    return { ok: false, error: 'Modpas yo pa menm.' };
  }
  if (!input.currentPassword) {
    return { ok: false, error: 'Tape modpas aktyèl ou.' };
  }
  if (input.currentPassword === input.newPassword) {
    return {
      ok: false,
      error: 'Nouvo modpas la dwe diferan de modpas aktyèl la.',
    };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: 'Ou dwe konekte.' };

  // Supabase "Secure password change" requires the member to re-prove
  // their current password. Re-authenticating with signInWithPassword
  // verifies it AND refreshes the session, which satisfies the
  // reauthentication requirement before updateUser().
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: input.currentPassword,
  });
  if (reauthError) {
    return { ok: false, error: 'Modpas aktyèl la pa kòrèk.' };
  }

  const { error } = await supabase.auth.updateUser({
    password: input.newPassword,
  });
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

// ─── GDPR data export ───────────────────────────────────────────────────────

export type ExportPayload = {
  ok: true;
  filename: string;
  data: Record<string, unknown>;
};

export async function exportUserData(): Promise<
  ExportPayload | { ok: false; error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  // Fetch everything the user owns. Each query is RLS-scoped so the user
  // gets only their own rows.
  const [
    profile,
    preferences,
    medical,
    subscriptions,
    healthLogs,
    notificationReads,
    resourceProgress,
    userBadges,
    userPrograms,
    taskCompletions,
    consultations,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_medical_info').select('*').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false }),
    supabase
      .from('health_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false }),
    supabase
      .from('notification_reads')
      .select('*')
      .eq('user_id', user.id)
      .order('read_at', { ascending: false }),
    supabase
      .from('resource_progress')
      .select('*')
      .eq('user_id', user.id)
      .order('last_accessed_at', { ascending: false }),
    supabase.from('user_badges').select('*').eq('user_id', user.id),
    supabase
      .from('user_programs')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false }),
    supabase
      .from('user_task_completions')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false }),
    supabase
      .from('consultations')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: false }),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    schema_version: '019',
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at ?? null,
    },
    profile: profile.data ?? null,
    preferences: preferences.data ?? null,
    medical_info: medical.data ?? null,
    subscriptions: subscriptions.data ?? [],
    health_logs: healthLogs.data ?? [],
    notification_reads: notificationReads.data ?? [],
    resource_progress: resourceProgress.data ?? [],
    badges: userBadges.data ?? [],
    programs: userPrograms.data ?? [],
    task_completions: taskCompletions.data ?? [],
    consultations: consultations.data ?? [],
  };

  const stamp = new Date().toISOString().slice(0, 10);
  return {
    ok: true,
    filename: `medikaplant-export-${stamp}.json`,
    data: payload,
  };
}

// ─── Account deletion ──────────────────────────────────────────────────────

export async function deleteAccount(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { ok: false, error: 'Ou dwe konekte.' };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return { ok: false, error: 'Konfigirasyon sèvè a manke.' };
  }

  // Call our Edge Function with the user's JWT — it verifies the user and
  // uses the service role to actually drop the auth.users row, which cascades
  // to profiles → all related tables via ON DELETE CASCADE.
  let resp: Response;
  try {
    resp = await fetch(`${url}/functions/v1/delete-user`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confirmation: 'DELETE MY ACCOUNT' }),
    });
  } catch (e) {
    return { ok: false, error: 'Pa ka rive nan sèvè a.' };
  }

  if (!resp.ok) {
    let message = 'Erè sou efase kont la.';
    try {
      const body = await resp.json();
      if (body?.error) message = body.error;
    } catch (_) {
      /* ignore */
    }
    return { ok: false, error: message };
  }

  // After the auth user is gone the cookie session is invalid; sign out locally.
  await supabase.auth.signOut();
  return { ok: true };
}

// ─── Consultations ─────────────────────────────────────────────────────────
//
// Removed. Bookings now happen on medikaplantshop.com/consultation, so the
// dashboard no longer creates/cancels consultation rows. The `consultations`
// table itself stays in the DB for the historical record (no destructive
// migration).
