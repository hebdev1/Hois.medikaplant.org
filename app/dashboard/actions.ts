'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type ToggleResult =
  | { ok: true; done: boolean; completionDate: string }
  | { ok: false; error: string };

/**
 * Toggle a checklist task's completion for today. Insert a row if the task is
 * being checked, delete the row if it's being unchecked. The DB trigger
 * `trg_user_task_completions_badges` recomputes badges automatically.
 */
export async function toggleTaskCompletion(taskId: string): Promise<ToggleResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  const today = new Date().toISOString().slice(0, 10);

  const { data: existing, error: selectError } = await supabase
    .from('user_task_completions')
    .select('id')
    .eq('user_id', user.id)
    .eq('task_id', taskId)
    .eq('completion_date', today)
    .maybeSingle();

  if (selectError) return { ok: false, error: selectError.message };

  if (existing) {
    const { error } = await supabase
      .from('user_task_completions')
      .delete()
      .eq('id', existing.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/dashboard');
    return { ok: true, done: false, completionDate: today };
  }

  const { error } = await supabase.from('user_task_completions').insert({
    user_id: user.id,
    task_id: taskId,
    completion_date: today,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard');
  return { ok: true, done: true, completionDate: today };
}

/**
 * Mark all "just_unlocked" flags as seen for the current user so the gold
 * "Nouvo" badge ribbon only shows once.
 */
export async function dismissJustUnlocked() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('user_badges')
    .update({ just_unlocked: false })
    .eq('user_id', user.id)
    .eq('just_unlocked', true);
  revalidatePath('/dashboard');
}
