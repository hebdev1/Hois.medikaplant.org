'use server';

// VIP (Melis) actions. The plan gate (plan='vip') is enforced HERE, not just
// in the UI, so a non-Melis user can't join the circle or request a session by
// calling the action directly.

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';

const UNLOCKED = new Set(['vip']); // Melis only

export async function joinVip(): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  const supabase = createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .maybeSingle();
  const plan = (profile as { plan?: string } | null)?.plan ?? 'basic';
  if (!UNLOCKED.has(plan)) {
    return { ok: false, error: 'VIP rezève pou plan Melis.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('vip_members')
    .upsert({ user_id: user.id }, { onConflict: 'user_id' });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard/vip');
  return { ok: true };
}

export type VipSessionInput = {
  topic: string;
  preferredWindow?: string | null;
  note?: string | null;
};

/**
 * A Melis member requests their confidential 21-min session with Vye Ewòl.
 * One open request at a time; a DB trigger notifies the admins. The plan and
 * the one-open-request rule are both re-checked server-side.
 */
export async function requestVyeEwolSession(
  input: VipSessionInput
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  const supabase = createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .maybeSingle();
  const plan = (profile as { plan?: string } | null)?.plan ?? 'basic';
  if (!UNLOCKED.has(plan)) {
    return { ok: false, error: 'Sesyon sa a rezève pou manm Melis.' };
  }

  const topic = (input.topic ?? '').trim();
  if (topic.length < 5) {
    return { ok: false, error: 'Ekri sijè sesyon an (omwen 5 karaktè).' };
  }
  if (topic.length > 200) {
    return { ok: false, error: 'Sijè a twò long (maks 200 karaktè).' };
  }
  const preferredWindow =
    (input.preferredWindow ?? '').trim().slice(0, 500) || null;
  const note = (input.note ?? '').trim().slice(0, 500) || null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  // One open request at a time (the partial unique index is the race backstop).
  const { data: openRows } = await sb
    .from('vip_session_requests')
    .select('id')
    .eq('user_id', user.id)
    .in('status', ['nouvo', 'pwograme'])
    .limit(1);
  if (Array.isArray(openRows) && openRows.length > 0) {
    return { ok: false, error: 'Ou gen yon demann k ap tann deja.' };
  }

  const { error } = await sb.from('vip_session_requests').insert({
    user_id: user.id,
    topic,
    preferred_window: preferredWindow,
    note,
  });
  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return { ok: false, error: 'Ou gen yon demann k ap tann deja.' };
    }
    console.error('[vip] session request insert failed', error);
    return {
      ok: false,
      error: 'Nou pa ka voye demann lan kounye a. Reeseye pita.',
    };
  }

  revalidatePath('/dashboard/vip');
  revalidatePath('/admin/sesyon-vip');
  return { ok: true };
}
