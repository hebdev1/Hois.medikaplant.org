'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { emailNotifyMember } from '@/lib/email/notify';
import type { Database } from '@/types/database';

type TreatmentInsert = Database['public']['Tables']['treatment_recommendations']['Insert'];
type TreatmentRow = Database['public']['Tables']['treatment_recommendations']['Row'];

const KIND_VALUES = ['medication', 'herbal', 'lifestyle', 'monitoring', 'referral'] as const;
const STATUS_VALUES = ['active', 'completed', 'cancelled'] as const;
const METRIC_VALUES = ['blood_sugar', 'weight', 'pressure'] as const;

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
  if ((profile as { role: string } | null)?.role !== 'admin') {
    return { ok: false as const, error: 'Aksè entèdi.' };
  }
  return { ok: true as const, user, supabase };
}

// ─── Create ──────────────────────────────────────────────────────────────

export type AdminTreatmentState = { error?: string; ok?: boolean; createdId?: string };

export async function createTreatment(
  userId: string,
  _prev: AdminTreatmentState,
  formData: FormData
): Promise<AdminTreatmentState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const get = (k: string) => (formData.get(k)?.toString() ?? '').trim();
  const title = get('title');
  const description = get('description');
  const kind = get('kind') as (typeof KIND_VALUES)[number];
  const dose = get('dose') || null;
  const frequency = get('frequency') || null;
  const duration = get('duration') || null;
  const notes = get('notes') || null;
  const relatedMetric = get('related_metric') || null;
  const relatedCondition = get('related_condition') || null;
  const startDate = get('start_date') || new Date().toISOString().slice(0, 10);
  const endDate = get('end_date') || null;

  if (title.length < 2) return { error: 'Tit la twò kout.' };
  if (description.length < 4) return { error: 'Deskripsyon an twò kout.' };
  if (!KIND_VALUES.includes(kind)) return { error: 'Tip tretman pa valid.' };
  if (relatedMetric && !METRIC_VALUES.includes(relatedMetric as (typeof METRIC_VALUES)[number])) {
    return { error: 'Mezi a pa valid.' };
  }

  const insert: TreatmentInsert = {
    user_id: userId,
    admin_id: auth.user.id,
    kind,
    title,
    description,
    dose,
    frequency,
    duration,
    notes,
    related_metric: relatedMetric,
    related_condition: relatedCondition,
    status: 'active',
    start_date: startDate,
    end_date: endDate,
  };

  const { data, error } = await auth.supabase
    .from('treatment_recommendations')
    .insert(insert)
    .select('id')
    .single();
  if (error || !data) return { error: error?.message ?? 'Erè inkoni.' };

  // Email the member (best-effort, respects their email preference).
  await emailNotifyMember(auth.supabase, userId, {
    subject: 'Yon tretman pwopoze pou ou',
    heading: 'Èrboris ou pwopoze yon tretman',
    body: [
      `Ou gen yon nouvo pwopozisyon: "${title}".`,
      'Konekte sou kont ou pou wè detay konplè yo — dòz, frekans, ak enstriksyon.',
    ],
    linkPath: '/dashboard/health',
    linkLabel: 'Wè tretman an',
  });

  revalidatePath(`/admin/health/${userId}`);
  revalidatePath('/admin/health');
  revalidatePath('/dashboard/health');
  return { ok: true, createdId: (data as { id: string }).id };
}

// ─── Edit existing treatment (admin can fix mistakes) ───────────────────
// Mirrors createTreatment's validation rules. We accept a partial set
// of fields via FormData so the same form component works for both
// create and edit (just toggles which action it submits to).

export async function updateTreatment(
  treatmentId: string,
  _prev: AdminTreatmentState,
  formData: FormData
): Promise<AdminTreatmentState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const get = (k: string) => (formData.get(k)?.toString() ?? '').trim();
  const title = get('title');
  const description = get('description');
  const kind = get('kind') as (typeof KIND_VALUES)[number];
  const dose = get('dose') || null;
  const frequency = get('frequency') || null;
  const duration = get('duration') || null;
  const notes = get('notes') || null;
  const relatedMetric = get('related_metric') || null;
  const relatedCondition = get('related_condition') || null;
  const startDate = get('start_date') || null;
  const endDate = get('end_date') || null;

  if (title.length < 2) return { error: 'Tit la twò kout.' };
  if (description.length < 4) return { error: 'Deskripsyon an twò kout.' };
  if (!KIND_VALUES.includes(kind)) return { error: 'Tip tretman pa valid.' };
  if (relatedMetric && !METRIC_VALUES.includes(relatedMetric as (typeof METRIC_VALUES)[number])) {
    return { error: 'Mezi a pa valid.' };
  }

  const { data, error } = await auth.supabase
    .from('treatment_recommendations')
    .update({
      kind,
      title,
      description,
      dose,
      frequency,
      duration,
      notes,
      related_metric: relatedMetric,
      related_condition: relatedCondition,
      start_date: startDate ?? new Date().toISOString().slice(0, 10),
      end_date: endDate,
    })
    .eq('id', treatmentId)
    .select('user_id, id')
    .single();
  if (error || !data) return { error: error?.message ?? 'Erè inkoni.' };

  const row = data as { user_id: string; id: string };
  revalidatePath(`/admin/health/${row.user_id}`);
  revalidatePath('/admin/health');
  revalidatePath('/dashboard/health');
  return { ok: true, createdId: row.id };
}

// ─── Update status (toggle completed / cancelled) ────────────────────────

export async function setTreatmentStatus(
  id: string,
  status: (typeof STATUS_VALUES)[number]
): Promise<{ ok: true; row: TreatmentRow } | { ok: false; error: string }> {
  if (!STATUS_VALUES.includes(status)) return { ok: false, error: 'Estati pa valid.' };
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data, error } = await auth.supabase
    .from('treatment_recommendations')
    .update({
      status,
      end_date: status === 'completed' || status === 'cancelled' ? new Date().toISOString().slice(0, 10) : null,
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Erè inkoni.' };

  revalidatePath(`/admin/health/${(data as TreatmentRow).user_id}`);
  revalidatePath('/admin/health');
  revalidatePath('/dashboard/health');
  return { ok: true, row: data as TreatmentRow };
}

// ─── Delete ──────────────────────────────────────────────────────────────

export async function deleteTreatment(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data: row } = await auth.supabase
    .from('treatment_recommendations')
    .select('user_id')
    .eq('id', id)
    .maybeSingle();
  const userId = (row as { user_id: string } | null)?.user_id;

  const { error } = await auth.supabase
    .from('treatment_recommendations')
    .delete()
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  if (userId) revalidatePath(`/admin/health/${userId}`);
  revalidatePath('/admin/health');
  revalidatePath('/dashboard/health');
  return { ok: true };
}

// ─── Personal Hoïs Plan (admin builds a program per member) ───────────────

export type PersonalPlanTask = {
  title: string;
  meta?: string | null;
  chip_label?: string | null;
  chip_kind?: 'forest' | 'gold' | 'cream';
};

export type PersonalPlanInput = {
  name: string;
  variant?: string | null;
  total_days: number;
  plan_required?: 'basic' | 'premium' | 'vip';
  tasks: PersonalPlanTask[];
};

export type PersonalPlanResult =
  | { ok: true; programId: string }
  | { ok: false; error: string };

export async function createPersonalProgram(
  userId: string,
  input: PersonalPlanInput
): Promise<PersonalPlanResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: 'Non pwogram nan twò kout.' };
  if (!Number.isFinite(input.total_days) || input.total_days < 1 || input.total_days > 365) {
    return { ok: false, error: 'Dire a dwe ant 1 ak 365 jou.' };
  }
  const tasks = (input.tasks ?? []).filter(
    (t) => t.title && t.title.trim().length > 0
  );
  if (tasks.length === 0) {
    return { ok: false, error: 'Ajoute omwen yon tach nan plan an.' };
  }
  if (tasks.length > 30) {
    return { ok: false, error: 'Maks 30 tach pa plan.' };
  }

  // Normalize tasks for the JSONB payload the RPC ingests.
  const tasksPayload = tasks.map((t) => ({
    title: t.title.trim(),
    meta: t.meta?.trim() || null,
    chip_label: t.chip_label?.trim() || null,
    chip_kind: t.chip_kind ?? 'forest',
  }));

  const { data, error } = await auth.supabase.rpc(
    'admin_create_personal_program',
    {
      p_user_id: userId,
      p_name: name,
      p_variant: input.variant?.trim() || null,
      p_total_days: input.total_days,
      p_plan_required: input.plan_required ?? 'basic',
      p_tasks: tasksPayload,
    }
  );
  if (error || !data) {
    return { ok: false, error: error?.message ?? 'Erè inkoni.' };
  }

  revalidatePath(`/admin/health/${userId}`);
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/programs');
  return { ok: true, programId: data as string };
}
