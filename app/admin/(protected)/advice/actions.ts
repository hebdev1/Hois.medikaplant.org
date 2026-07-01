'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import { hasCapability, type AdminRole } from '../admin-nav-config';

type AdviceRow = Database['public']['Tables']['daily_advice']['Row'];
type AdviceInsert = Database['public']['Tables']['daily_advice']['Insert'];
type AdviceUpdate = Database['public']['Tables']['daily_advice']['Update'];

const PLAN_VALUES = ['basic', 'premium', 'vip'] as const;
type Plan = (typeof PLAN_VALUES)[number];

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
  if (!hasCapability(row.admin_role, 'manage_advice')) {
    return { ok: false as const, error: 'Ou pa gen pèmisyon pou jere konsèy yo.' };
  }
  return { ok: true as const, user, supabase };
}

export type AdviceResult =
  | { ok: true; row: AdviceRow }
  | { ok: false; error: string };

function clean(formData: FormData) {
  const get = (k: string) => (formData.get(k)?.toString() ?? '').trim();
  const bodyHtml = get('body_html');
  const plantName = get('plant_name') || null;
  const audioUrl = get('audio_url') || null;
  const durationRaw = get('duration_seconds');
  const duration = durationRaw ? Number(durationRaw) : null;
  const publishDate = get('publish_date') || new Date().toISOString().slice(0, 10);
  const planRaw = get('plan_required') || 'basic';
  const planRequired: Plan = PLAN_VALUES.includes(planRaw as Plan)
    ? (planRaw as Plan)
    : 'basic';
  return { bodyHtml, plantName, audioUrl, duration, publishDate, planRequired };
}

function validate(input: ReturnType<typeof clean>) {
  if (input.bodyHtml.length < 6) {
    return 'Mesaj la twò kout.';
  }
  if (input.bodyHtml.length > 4000) {
    return 'Mesaj la twò long (maks 4000 karaktè).';
  }
  if (input.duration !== null && (input.duration < 10 || input.duration > 3600)) {
    return 'Dire a dwe ant 10 ak 3600 segond.';
  }
  if (input.audioUrl && !/^https?:\/\//i.test(input.audioUrl)) {
    return 'URL odyo a dwe kòmanse ak http(s)://.';
  }
  return null;
}

// ─── Create ──────────────────────────────────────────────────────────────

export type AdviceFormState = { error?: string; ok?: boolean; id?: string };

export async function createAdvice(
  _prev: AdviceFormState,
  formData: FormData
): Promise<AdviceFormState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const input = clean(formData);
  const v = validate(input);
  if (v) return { error: v };

  const insert: AdviceInsert = {
    publish_date: input.publishDate,
    body_html: input.bodyHtml,
    plant_name: input.plantName,
    audio_url: input.audioUrl,
    duration_seconds: input.duration,
    plan_required: input.planRequired,
    created_by: auth.user.id,
  };

  const { data, error } = await auth.supabase
    .from('daily_advice')
    .insert(insert)
    .select('*')
    .single();
  if (error || !data) return { error: error?.message ?? 'Erè inkoni.' };

  revalidatePath('/admin/advice');
  revalidatePath('/dashboard');
  return { ok: true, id: (data as AdviceRow).id };
}

// ─── Update ──────────────────────────────────────────────────────────────

export async function updateAdvice(
  id: string,
  _prev: AdviceFormState,
  formData: FormData
): Promise<AdviceFormState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const input = clean(formData);
  const v = validate(input);
  if (v) return { error: v };

  const update: AdviceUpdate = {
    publish_date: input.publishDate,
    body_html: input.bodyHtml,
    plant_name: input.plantName,
    audio_url: input.audioUrl,
    duration_seconds: input.duration,
    plan_required: input.planRequired,
  };

  const { data, error } = await auth.supabase
    .from('daily_advice')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) return { error: error?.message ?? 'Erè inkoni.' };

  revalidatePath('/admin/advice');
  revalidatePath('/dashboard');
  return { ok: true, id };
}

// ─── Delete ──────────────────────────────────────────────────────────────

export async function deleteAdvice(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from('daily_advice')
    .delete()
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/advice');
  revalidatePath('/dashboard');
  return { ok: true };
}
