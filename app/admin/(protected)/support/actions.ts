'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type MessageRow = Database['public']['Tables']['support_messages']['Row'];

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

/**
 * Admin sends a reply in a support thread.
 * Inserts via SECURITY DEFINER RPC so we get the correct sender_role='agent'.
 */
export async function adminSendSupportReply(
  threadId: string,
  body: string
): Promise<{ ok: true; message: MessageRow } | { ok: false; error: string }> {
  const text = body.trim();
  if (text.length === 0) return { ok: false, error: 'Mesaj la vid.' };
  if (text.length > 4000) {
    return { ok: false, error: 'Mesaj la twò long (maks 4000 karaktè).' };
  }

  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data, error } = await auth.supabase.rpc('admin_send_support_reply', {
    p_thread_id: threadId,
    p_body: text,
  });
  if (error || !data) {
    return { ok: false, error: error?.message ?? 'Erè inkoni.' };
  }

  revalidatePath('/admin/support');
  return { ok: true, message: data as MessageRow };
}

/**
 * Admin marks a thread resolved (closes it).
 */
export async function adminResolveThread(
  threadId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from('support_threads')
    .update({ status: 'resolved', updated_at: new Date().toISOString() })
    .eq('id', threadId);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/support');
  return { ok: true };
}

/**
 * Admin reopens a previously-resolved thread.
 */
export async function adminReopenThread(
  threadId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from('support_threads')
    .update({ status: 'open', updated_at: new Date().toISOString() })
    .eq('id', threadId);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/support');
  return { ok: true };
}
