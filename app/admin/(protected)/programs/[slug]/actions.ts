'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type ProgramTaskInsert = Database['public']['Tables']['program_tasks']['Insert'];
type ProgramTaskUpdate = Database['public']['Tables']['program_tasks']['Update'];
type ProgramTaskRow = Database['public']['Tables']['program_tasks']['Row'];

const CHIP_KINDS = ['forest', 'gold', 'cream', 'rose', 'sky'] as const;

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

export type TaskResult =
  | { ok: true; task: ProgramTaskRow }
  | { ok: false; error: string };

function clean(input: {
  programId: string;
  dayNumber: number;
  title: string;
  meta?: string | null;
  chipLabel?: string | null;
  chipKind?: string | null;
  conditionTags?: string[];
}) {
  const title = input.title.trim();
  const meta = input.meta?.trim() || null;
  const chipLabel = input.chipLabel?.trim() || null;
  const chipKindRaw = (input.chipKind ?? 'forest').toLowerCase();
  const chipKind = (CHIP_KINDS as readonly string[]).includes(chipKindRaw)
    ? chipKindRaw
    : 'forest';
  const conditionTags = Array.from(
    new Set((input.conditionTags ?? []).map((t) => t.trim()).filter(Boolean))
  );
  return { title, meta, chipLabel, chipKind, conditionTags };
}

function validate(cleaned: ReturnType<typeof clean>, dayNumber: number) {
  if (cleaned.title.length < 3) {
    return 'Tit tach la twò kout.';
  }
  if (cleaned.title.length > 200) {
    return 'Tit tach la twò long.';
  }
  if (cleaned.meta && cleaned.meta.length > 300) {
    return 'Meta tèks twò long.';
  }
  if (dayNumber < 1 || dayNumber > 365) {
    return 'Nimewo jou pa valid (1–365).';
  }
  return null;
}

export async function createProgramTask(input: {
  programId: string;
  programSlug: string;
  dayNumber: number;
  title: string;
  meta?: string | null;
  chipLabel?: string | null;
  chipKind?: string | null;
  conditionTags?: string[];
}): Promise<TaskResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const cleaned = clean(input);
  const v = validate(cleaned, input.dayNumber);
  if (v) return { ok: false, error: v };

  // Place new task at the end of the day. The query stays cheap because of
  // the (program_id, day_number, order_index) composite index.
  const { data: existingMax } = await auth.supabase
    .from('program_tasks')
    .select('order_index')
    .eq('program_id', input.programId)
    .eq('day_number', input.dayNumber)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder =
    ((existingMax as { order_index: number } | null)?.order_index ?? -1) + 1;

  const insert: ProgramTaskInsert = {
    program_id: input.programId,
    day_number: input.dayNumber,
    order_index: nextOrder,
    title: cleaned.title,
    meta: cleaned.meta,
    chip_label: cleaned.chipLabel,
    chip_kind: cleaned.chipKind,
    condition_tags: cleaned.conditionTags,
  };

  const { data, error } = await auth.supabase
    .from('program_tasks')
    .insert(insert)
    .select('*')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Erè inkoni.' };

  revalidatePath(`/admin/programs/${input.programSlug}`);
  return { ok: true, task: data as ProgramTaskRow };
}

export async function updateProgramTask(input: {
  taskId: string;
  programSlug: string;
  dayNumber: number;
  title: string;
  meta?: string | null;
  chipLabel?: string | null;
  chipKind?: string | null;
  conditionTags?: string[];
}): Promise<TaskResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const cleaned = clean({ programId: '', ...input });
  const v = validate(cleaned, input.dayNumber);
  if (v) return { ok: false, error: v };

  const update: ProgramTaskUpdate = {
    day_number: input.dayNumber,
    title: cleaned.title,
    meta: cleaned.meta,
    chip_label: cleaned.chipLabel,
    chip_kind: cleaned.chipKind,
    condition_tags: cleaned.conditionTags,
  };

  const { data, error } = await auth.supabase
    .from('program_tasks')
    .update(update)
    .eq('id', input.taskId)
    .select('*')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Erè inkoni.' };

  revalidatePath(`/admin/programs/${input.programSlug}`);
  return { ok: true, task: data as ProgramTaskRow };
}

export async function deleteProgramTask(input: {
  taskId: string;
  programSlug: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from('program_tasks')
    .delete()
    .eq('id', input.taskId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/programs/${input.programSlug}`);
  return { ok: true };
}
