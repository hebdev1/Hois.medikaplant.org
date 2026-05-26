'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/**
 * Gate: must be a signed-in admin (role='admin'). The setting screen is
 * available to every sub-role — anything role-specific is enforced in
 * the cross-admin actions file (../users/actions.ts).
 */
async function assertAdminSelf() {
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
  if ((profile as { role: string } | null)?.role !== 'admin') {
    return { ok: false as const, error: 'Aksè entèdi.' };
  }
  return { ok: true as const, user, supabase };
}

export type AdminProfileResult =
  | { ok: true; profile: ProfileRow }
  | { ok: false; error: string };

// ─── Identity (first/last/phone/avatar/bio) ────────────────────────────────

const IDENTITY_KEYS: readonly (keyof ProfileUpdate)[] = [
  'first_name',
  'last_name',
  'phone',
  'bio',
  'avatar_url',
] as const;

export async function updateAdminProfile<K extends (typeof IDENTITY_KEYS)[number]>(
  key: K,
  value: ProfileUpdate[K]
): Promise<AdminProfileResult> {
  if (!IDENTITY_KEYS.includes(key)) {
    return { ok: false, error: 'Chan pa otorize.' };
  }
  const auth = await assertAdminSelf();
  if (!auth.ok) return { ok: false, error: auth.error };

  let cleaned: ProfileUpdate[K] = value;
  if (typeof cleaned === 'string') {
    const trimmed = (cleaned as string).trim();
    cleaned = (trimmed === '' ? null : trimmed) as ProfileUpdate[K];
  }
  if (key === 'phone' && cleaned !== null) {
    const phone = (cleaned as string).replace(/[\s\-()]/g, '');
    if (!/^[+]?[0-9]{7,15}$/.test(phone)) {
      return { ok: false, error: 'Nimewo telefòn pa valid.' };
    }
    cleaned = phone as ProfileUpdate[K];
  }
  if (key === 'bio' && cleaned !== null && (cleaned as string).length > 400) {
    cleaned = (cleaned as string).slice(0, 400) as ProfileUpdate[K];
  }

  const update: ProfileUpdate = { [key]: cleaned } as ProfileUpdate;

  // Recompute full_name when first/last change (mirrors the user-side
  // settings behaviour so the topbar greeting stays in sync).
  if (key === 'first_name' || key === 'last_name') {
    const { data: current } = await auth.supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', auth.user.id)
      .single();
    const cur = current as { first_name: string | null; last_name: string | null } | null;
    const first =
      key === 'first_name' ? (cleaned as string | null) : cur?.first_name ?? null;
    const last =
      key === 'last_name' ? (cleaned as string | null) : cur?.last_name ?? null;
    const combined = [first, last].filter(Boolean).join(' ').trim();
    if (combined.length >= 2) update.full_name = combined;
  }

  const { data, error } = await auth.supabase
    .from('profiles')
    .update(update)
    .eq('id', auth.user.id)
    .select('*')
    .single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? 'Erè inkoni.' };
  }

  revalidatePath('/admin/settings');
  return { ok: true, profile: data as ProfileRow };
}

// ─── Support persona (display name shown in support chat) ──────────────────

export async function updateAdminSupportPersona(
  personaName: string | null
): Promise<AdminProfileResult> {
  const auth = await assertAdminSelf();
  if (!auth.ok) return { ok: false, error: auth.error };

  const cleaned = personaName?.trim() ?? '';
  const value = cleaned.length === 0 ? null : cleaned.slice(0, 60);

  const { data, error } = await auth.supabase
    .from('profiles')
    .update({ support_persona_name: value })
    .eq('id', auth.user.id)
    .select('*')
    .single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? 'Erè inkoni.' };
  }

  revalidatePath('/admin/settings');
  revalidatePath('/admin/support');
  return { ok: true, profile: data as ProfileRow };
}

// ─── Email change ──────────────────────────────────────────────────────────
// Goes through Supabase Auth (sends a confirmation email to the new
// address). On success the email change isn't applied until the user
// clicks the confirmation link — that's by design.

export async function updateAdminEmail(
  newEmail: string
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const cleaned = newEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
    return { ok: false, error: 'Imèl pa valid.' };
  }
  const auth = await assertAdminSelf();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (cleaned === auth.user.email) {
    return { ok: false, error: 'Imèl la se menm ke aktyèl la.' };
  }

  const { error } = await auth.supabase.auth.updateUser({ email: cleaned });
  if (error) return { ok: false, error: error.message };

  return {
    ok: true,
    message:
      'Yon imèl konfimasyon voye nan nouvo adrès la. Klike sou lyen nan li pou aplike chanjman an.',
  };
}

// ─── Password change ───────────────────────────────────────────────────────

export async function updateAdminPassword(
  newPassword: string,
  confirmPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (newPassword.length < 8) {
    return { ok: false, error: 'Modpas la dwe gen omwen 8 karaktè.' };
  }
  if (newPassword.length > 200) {
    return { ok: false, error: 'Modpas la twò long.' };
  }
  if (newPassword !== confirmPassword) {
    return { ok: false, error: 'De modpas yo pa menm.' };
  }
  // Basic strength: at least one letter + one digit
  if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return {
      ok: false,
      error: 'Mete omwen yon lèt ak yon chif nan modpas la.',
    };
  }

  const auth = await assertAdminSelf();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

// ─── Email notification preferences ────────────────────────────────────────
// Stored on user_preferences. We reuse the existing row that every
// profile has (auto-healed elsewhere) so admins manage their inbox the
// same way regular members do — just with admin-relevant toggles.

const NOTIFICATION_KEYS = [
  'email_notifications',
  'daily_advice_email',
  'weekly_summary_email',
  'badge_unlock_email',
] as const;
export type NotificationKey = (typeof NOTIFICATION_KEYS)[number];

export async function updateAdminNotificationPreference(
  key: NotificationKey,
  value: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!NOTIFICATION_KEYS.includes(key)) {
    return { ok: false, error: 'Preferans pa otorize.' };
  }
  const auth = await assertAdminSelf();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from('user_preferences')
    .upsert(
      { user_id: auth.user.id, [key]: value },
      { onConflict: 'user_id' }
    );
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/settings');
  return { ok: true };
}
