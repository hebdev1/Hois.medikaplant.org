'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type ProgramActionResult =
  | { ok: true }
  | { ok: false; error: string };

async function getAuthedUserId(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };
  return { ok: true, userId: user.id };
}

/**
 * Enroll the current user in a program. Deactivates any other active enrollment
 * first (only one active program at a time).
 */
export async function enrollInProgram(
  programId: string
): Promise<ProgramActionResult> {
  const auth = await getAuthedUserId();
  if (!auth.ok) return auth;

  const supabase = createClient();

  // Make sure the program exists and is published
  const { data: program } = await supabase
    .from('programs')
    .select('id, active, plan_required')
    .eq('id', programId)
    .maybeSingle();
  if (!program || !(program as { active: boolean }).active) {
    return { ok: false, error: 'Pwotokòl sa pa disponib.' };
  }

  // Deactivate any current active enrollment (don't mark finished — pause-style)
  await supabase
    .from('user_programs')
    .update({ is_active: false })
    .eq('user_id', auth.userId)
    .eq('is_active', true);

  // Insert new enrollment
  const { error } = await supabase.from('user_programs').insert({
    user_id: auth.userId,
    program_id: programId,
    is_active: true,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/programs');
  return { ok: true };
}

/** Pause the user's currently active enrollment. */
export async function pauseActiveProgram(): Promise<ProgramActionResult> {
  const auth = await getAuthedUserId();
  if (!auth.ok) return auth;
  const supabase = createClient();

  const { data: row } = await supabase
    .from('user_programs')
    .select('id, paused_at')
    .eq('user_id', auth.userId)
    .eq('is_active', true)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const enrollment = row as { id: string; paused_at: string | null } | null;
  if (!enrollment) return { ok: false, error: 'Pa gen pwotokòl aktif.' };
  if (enrollment.paused_at) return { ok: false, error: 'Pwotokòl la deja poze.' };

  const { error } = await supabase
    .from('user_programs')
    .update({ paused_at: new Date().toISOString() })
    .eq('id', enrollment.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/programs');
  return { ok: true };
}

/** Resume the paused active enrollment — adds elapsed pause to offset. */
export async function resumeActiveProgram(): Promise<ProgramActionResult> {
  const auth = await getAuthedUserId();
  if (!auth.ok) return auth;
  const supabase = createClient();

  const { data: row } = await supabase
    .from('user_programs')
    .select('id, paused_at, pause_offset_seconds')
    .eq('user_id', auth.userId)
    .eq('is_active', true)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const enrollment = row as {
    id: string;
    paused_at: string | null;
    pause_offset_seconds: number;
  } | null;
  if (!enrollment) return { ok: false, error: 'Pa gen pwotokòl aktif.' };
  if (!enrollment.paused_at) return { ok: false, error: 'Pwotokòl la pa poze.' };

  const pausedAtMs = new Date(enrollment.paused_at).getTime();
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - pausedAtMs) / 1000));
  const newOffset = (enrollment.pause_offset_seconds ?? 0) + elapsedSeconds;

  const { error } = await supabase
    .from('user_programs')
    .update({ paused_at: null, pause_offset_seconds: newOffset })
    .eq('id', enrollment.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/programs');
  return { ok: true };
}

/** Finish the current active enrollment, marking it completed. */
export async function finishActiveProgram(): Promise<ProgramActionResult> {
  const auth = await getAuthedUserId();
  if (!auth.ok) return auth;
  const supabase = createClient();

  const { error } = await supabase
    .from('user_programs')
    .update({
      is_active: false,
      finished_at: new Date().toISOString(),
    })
    .eq('user_id', auth.userId)
    .eq('is_active', true);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/programs');
  return { ok: true };
}
