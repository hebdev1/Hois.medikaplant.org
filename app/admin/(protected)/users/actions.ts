'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type MedicalUpdate = Database['public']['Tables']['user_medical_info']['Update'];
type MedicalInsert = Database['public']['Tables']['user_medical_info']['Insert'];
type MedicalRow = Database['public']['Tables']['user_medical_info']['Row'];
type PrefUpdate = Database['public']['Tables']['user_preferences']['Update'];
type PrefInsert = Database['public']['Tables']['user_preferences']['Insert'];
type PrefRow = Database['public']['Tables']['user_preferences']['Row'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

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
  const p = profile as {
    role: string;
    admin_role: 'super_admin' | 'admin' | 'support' | 'moderator' | 'content' | null;
  } | null;
  if (p?.role !== 'admin') {
    return { ok: false as const, error: 'Aksè entèdi.' };
  }
  return {
    ok: true as const,
    user,
    supabase,
    adminRole: p.admin_role,
    isSuperAdmin: p.admin_role === 'super_admin',
  };
}

/** Tighter gate: only super_admin can call this branch (for managing
 *  other admins and changing role/admin_role). */
async function assertSuperAdmin() {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;
  if (!auth.isSuperAdmin) {
    return { ok: false as const, error: 'Sèlman super-admin ka fè aksyon sa.' };
  }
  return auth;
}

// ─── Profile editing (admin can edit any field for any user) ────────────────

const ALLOWED_PROFILE_KEYS: readonly (keyof ProfileUpdate)[] = [
  'first_name',
  'last_name',
  'full_name',
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
  'avatar_url',
] as const;

const GENDER_VALUES = ['male', 'female', 'other', 'prefer_not_to_say'] as const;
const PLAN_VALUES = ['basic', 'premium', 'vip'] as const;
const ROLE_VALUES = ['user', 'admin'] as const;

// Granular sub-roles for admin accounts (mirrors the SQL enum from
// migration 038). Declared up here so setUserRole — which lives above the
// sub-role management section — can type its updates object cleanly.
const ADMIN_ROLE_VALUES = [
  'super_admin',
  'admin',
  'support',
  'moderator',
  'content',
] as const;
export type AdminRole = (typeof ADMIN_ROLE_VALUES)[number];

export type ProfileResult =
  | { ok: true; profile: ProfileRow }
  | { ok: false; error: string };

export async function adminUpdateProfileField<K extends keyof ProfileUpdate>(
  userId: string,
  key: K,
  value: ProfileUpdate[K]
): Promise<ProfileResult> {
  if (!ALLOWED_PROFILE_KEYS.includes(key)) {
    return { ok: false, error: 'Chan pwofil sa a pa otorize.' };
  }
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  let cleaned: ProfileUpdate[K] = value;
  if (typeof cleaned === 'string') {
    const trimmed = (cleaned as string).trim();
    cleaned = (trimmed === '' ? null : trimmed) as ProfileUpdate[K];
  }
  if (key === 'gender' && cleaned !== null) {
    if (!GENDER_VALUES.includes(cleaned as (typeof GENDER_VALUES)[number])) {
      return { ok: false, error: 'Sèks pa valid.' };
    }
  }
  if (key === 'date_of_birth' && cleaned !== null) {
    const d = new Date(cleaned as string);
    if (Number.isNaN(d.getTime())) return { ok: false, error: 'Dat pa valid.' };
    if (d > new Date()) return { ok: false, error: 'Dat nan fiti.' };
  }
  if ((key === 'phone' || key === 'emergency_contact_phone') && cleaned !== null) {
    const phone = (cleaned as string).replace(/[\s\-()]/g, '');
    if (!/^[+]?[0-9]{7,15}$/.test(phone)) {
      return { ok: false, error: 'Nimewo telefòn pa valid.' };
    }
    cleaned = phone as ProfileUpdate[K];
  }

  const update: ProfileUpdate = { [key]: cleaned } as ProfileUpdate;

  // Keep full_name in sync when first/last changes
  if (key === 'first_name' || key === 'last_name') {
    const { data: current } = await auth.supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .single();
    const cur = current as { first_name: string | null; last_name: string | null } | null;
    const first = key === 'first_name' ? (cleaned as string | null) : cur?.first_name ?? null;
    const last = key === 'last_name' ? (cleaned as string | null) : cur?.last_name ?? null;
    const combined = [first, last].filter(Boolean).join(' ').trim();
    if (combined.length >= 2) update.full_name = combined;
  }

  const { data: updated, error } = await auth.supabase
    .from('profiles')
    .update(update)
    .eq('id', userId)
    .select('*')
    .single();
  if (error || !updated) {
    return { ok: false, error: error?.message ?? 'Erè inkoni.' };
  }

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath('/admin/users');
  return { ok: true, profile: updated as ProfileRow };
}

// ─── Plan / role / suspend ─────────────────────────────────────────────────

// Admin promotions default to the yearly (discounted) tier of each plan.
// Matches the subscription_plans table seeded in migration 037.
const PLAN_AMOUNT: Record<'basic' | 'premium' | 'vip', number> = {
  basic: 121.5,
  premium: 157.5,
  vip: 224.1,
};

const PLAN_MONTHS: Record<'basic' | 'premium' | 'vip', number> = {
  basic: 12,
  premium: 12,
  vip: 12,
};

export async function setUserPlan(
  userId: string,
  plan: 'basic' | 'premium' | 'vip'
): Promise<ProfileResult> {
  if (!PLAN_VALUES.includes(plan)) return { ok: false, error: 'Plan pa valid.' };
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  // ── 1. Cancel any currently-active subscriptions for this user ─────────
  // The trg_sync_profile_plan trigger reconciles profiles.plan
  // automatically: cancelling all active subs drops the member back to
  // 'basic'; inserting a new active sub below pushes them up again.
  await auth.supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('status', 'active');

  // ── 2. Insert a new active subscription for the target plan ───────────
  // Always insert — even for 'basic' — so the invariant holds:
  //   COUNT(profiles) == COUNT(active subscriptions)
  // This means the /admin/subscriptions tile always mirrors /admin/users
  // and the plan-mix breakdown reflects everyone, including downgrades
  // back to Bazilik.
  {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + PLAN_MONTHS[plan]);

    const { error: insertErr } = await auth.supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        amount: PLAN_AMOUNT[plan],
        payment_reference: `admin_grant_${Date.now()}`,
      });

    if (insertErr) {
      return { ok: false, error: insertErr.message };
    }
  }

  // ── 3. Re-read the profile so we see the value the trigger wrote ──────
  const { data: updated, error } = await auth.supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !updated) {
    return { ok: false, error: error?.message ?? 'Erè inkoni.' };
  }

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath('/admin/users');
  revalidatePath('/admin/subscriptions');
  return { ok: true, profile: updated as ProfileRow };
}

export async function setUserSuspended(
  userId: string,
  suspended: boolean
): Promise<ProfileResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  // Don't let an admin suspend themselves
  if (auth.user.id === userId && suspended) {
    return { ok: false, error: 'Ou pa ka sispann pwòp kont ou.' };
  }

  const { data: updated, error } = await auth.supabase
    .from('profiles')
    .update({ suspended })
    .eq('id', userId)
    .select('*')
    .single();
  if (error || !updated) return { ok: false, error: error?.message ?? 'Erè inkoni.' };

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath('/admin/users');
  return { ok: true, profile: updated as ProfileRow };
}

export async function setUserRole(
  userId: string,
  role: 'user' | 'admin'
): Promise<ProfileResult> {
  if (!ROLE_VALUES.includes(role)) return { ok: false, error: 'Wòl pa valid.' };
  // Only super_admin can grant or revoke the admin badge.
  const auth = await assertSuperAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  // Don't let a super-admin demote themselves (lockout risk)
  if (auth.user.id === userId && role !== 'admin') {
    return { ok: false, error: 'Ou pa ka retire wòl admin ou pwòp tèt ou.' };
  }

  // When promoting fresh user → admin without a sub-role, default to
  // 'support' (least-privileged). Super-admin can upgrade them after.
  const updates: ProfileUpdate = { role };
  if (role === 'admin') {
    // Check current admin_role; if null, give them 'support' by default
    const { data: existing } = await auth.supabase
      .from('profiles')
      .select('admin_role')
      .eq('id', userId)
      .maybeSingle();
    const currentRole = (existing as { admin_role: AdminRole | null } | null)
      ?.admin_role;
    if (!currentRole) updates.admin_role = 'support';
  } else {
    // Demotion → clear admin_role so they're back to plain user.
    updates.admin_role = null;
  }

  const { data: updated, error } = await auth.supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('*')
    .single();
  if (error || !updated) return { ok: false, error: error?.message ?? 'Erè inkoni.' };

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath('/admin/users');
  return { ok: true, profile: updated as ProfileRow };
}

// ─── Admin sub-role management (super_admin only) ──────────────────────────

export async function setUserAdminRole(
  userId: string,
  adminRole: AdminRole
): Promise<ProfileResult> {
  if (!ADMIN_ROLE_VALUES.includes(adminRole)) {
    return { ok: false, error: 'Wòl admin pa valid.' };
  }
  const auth = await assertSuperAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  // A super-admin can't demote themselves out of super_admin (lockout risk)
  if (auth.user.id === userId && adminRole !== 'super_admin') {
    return {
      ok: false,
      error: 'Ou pa ka retire pwòp wòl super-admin ou.',
    };
  }

  // Ensure the target is already an admin (role='admin'); refuse otherwise.
  const { data: target } = await auth.supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  if ((target as { role: string } | null)?.role !== 'admin') {
    return {
      ok: false,
      error: 'Manm sa pa admin. Pwomote l an admin avan w bay yon wòl.',
    };
  }

  const { data: updated, error } = await auth.supabase
    .from('profiles')
    .update({ admin_role: adminRole })
    .eq('id', userId)
    .select('*')
    .single();
  if (error || !updated) {
    return { ok: false, error: error?.message ?? 'Erè inkoni.' };
  }

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath('/admin/users');
  return { ok: true, profile: updated as ProfileRow };
}

/**
 * Update the admin's display name in the support chat. Each admin can
 * tweak their OWN persona; super_admin can also override anyone else's.
 */
export async function setSupportPersonaName(
  userId: string,
  personaName: string | null
): Promise<ProfileResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  // Self-edit always allowed. Cross-edit only by super-admin.
  if (auth.user.id !== userId && !auth.isSuperAdmin) {
    return { ok: false, error: 'Sèlman super-admin ka chanje non yon lòt.' };
  }

  const cleaned = personaName?.trim() ?? '';
  const value =
    cleaned.length === 0 ? null : cleaned.slice(0, 60);

  const { data: updated, error } = await auth.supabase
    .from('profiles')
    .update({ support_persona_name: value })
    .eq('id', userId)
    .select('*')
    .single();
  if (error || !updated) {
    return { ok: false, error: error?.message ?? 'Erè inkoni.' };
  }

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath('/admin/support');
  return { ok: true, profile: updated as ProfileRow };
}

// ─── Medical info (admin can edit anyone's) ─────────────────────────────────

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

export type MedicalResult =
  | { ok: true; medical: MedicalRow }
  | { ok: false; error: string };

export async function adminUpdateMedical<K extends keyof MedicalUpdate>(
  userId: string,
  key: K,
  value: MedicalUpdate[K]
): Promise<MedicalResult> {
  if (!ALLOWED_MEDICAL_KEYS.includes(key)) {
    return { ok: false, error: 'Chan medikal pa otorize.' };
  }
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  let cleaned: MedicalUpdate[K] = value;
  if (typeof cleaned === 'string') {
    const trimmed = (cleaned as string).trim();
    cleaned = (trimmed === '' ? null : trimmed) as MedicalUpdate[K];
  }
  if (key === 'height_cm' && cleaned !== null) {
    const h = Number(cleaned);
    if (!Number.isFinite(h) || h < 50 || h > 250) {
      return { ok: false, error: 'Wòtè a dwe ant 50 ak 250 cm.' };
    }
    cleaned = h as MedicalUpdate[K];
  }
  if (key === 'conditions' && cleaned !== null) {
    if (!Array.isArray(cleaned)) {
      return { ok: false, error: 'Lis kondisyon pa valid.' };
    }
    cleaned = Array.from(
      new Set(
        (cleaned as string[])
          .map((s) => String(s).trim())
          .filter((s) => s.length > 0 && s.length <= 64)
      )
    ).slice(0, 30) as MedicalUpdate[K];
  }

  const { data, error } = await auth.supabase
    .from('user_medical_info')
    .upsert({ user_id: userId, [key]: cleaned } as MedicalInsert, {
      onConflict: 'user_id',
    })
    .select('*')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Erè inkoni.' };

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath(`/admin/health/${userId}`);
  return { ok: true, medical: data as MedicalRow };
}

// ─── Preferences (admin can edit anyone's) ──────────────────────────────────

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

export type PrefResult =
  | { ok: true; preferences: PrefRow }
  | { ok: false; error: string };

export async function adminUpdatePreference<K extends keyof PrefUpdate>(
  userId: string,
  key: K,
  value: PrefUpdate[K]
): Promise<PrefResult> {
  if (!ALLOWED_PREF_KEYS.includes(key)) {
    return { ok: false, error: 'Kle prefere pa otorize.' };
  }
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data, error } = await auth.supabase
    .from('user_preferences')
    .upsert({ user_id: userId, [key]: value } as PrefInsert, {
      onConflict: 'user_id',
    })
    .select('*')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Erè inkoni.' };

  revalidatePath(`/admin/users/${userId}`);
  return { ok: true, preferences: data as PrefRow };
}

// ─── Direct notification to a single user ───────────────────────────────────

export type NotificationState = { error?: string; ok?: boolean };

export async function adminSendDirectNotification(
  userId: string,
  _prev: NotificationState,
  formData: FormData
): Promise<NotificationState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const title = (formData.get('title')?.toString() ?? '').trim();
  const message = (formData.get('message')?.toString() ?? '').trim();
  const link_url = (formData.get('link_url')?.toString() ?? '').trim() || null;

  if (title.length < 2) return { error: 'Tit la twò kout.' };
  if (message.length < 2) return { error: 'Mesaj la twò kout.' };

  const insert: NotificationInsert = {
    title,
    message,
    target: 'user',
    target_user_id: userId,
    link_url,
    created_by: auth.user.id,
  };

  const { error } = await auth.supabase.from('notifications').insert(insert);
  if (error) return { error: error.message };

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath('/dashboard');
  return { ok: true };
}

// ─── Hard delete (last-resort) ──────────────────────────────────────────────
// We keep this gated behind a confirmation phrase to mirror the user-side
// danger zone. Cascading FKs handle everything downstream.

export async function adminDeleteUser(
  userId: string,
  confirmation: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (confirmation !== 'EFASE') {
    return { ok: false, error: 'Fraz konfimasyon an manke.' };
  }
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (auth.user.id === userId) {
    return { ok: false, error: 'Ou pa ka efase pwòp tèt ou nan admin.' };
  }

  // Delete the profile — this cascades to subscriptions, health_logs,
  // user_preferences, user_medical_info, treatment_recommendations, etc.
  // The auth.users row remains; use the user-side delete-user Edge Function
  // for a complete auth wipeout.
  const { error } = await auth.supabase
    .from('profiles')
    .delete()
    .eq('id', userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/users');
  return { ok: true };
}
