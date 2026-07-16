'use server';

// VIP membership opt-in. The tier gate (Sitwonèl / premium and above) is
// enforced here, not just in the UI, so a locked user can't join by calling
// the action directly.

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';

const UNLOCKED = new Set(['premium', 'vip']); // Sitwonèl + Melis

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
    return { ok: false, error: 'VIP rezève pou plan Sitwonèl.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('vip_members')
    .upsert({ user_id: user.id }, { onConflict: 'user_id' });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard/vip');
  return { ok: true };
}
