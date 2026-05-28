'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { emailNotifyMember } from '@/lib/email/notify';
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

  // Email the thread owner that they got a reply (best-effort).
  const { data: threadRaw } = await auth.supabase
    .from('support_threads')
    .select('user_id')
    .eq('id', threadId)
    .maybeSingle();
  const threadUserId = (threadRaw as { user_id: string } | null)?.user_id;
  if (threadUserId) {
    await emailNotifyMember(auth.supabase, threadUserId, {
      subject: 'Nouvo repons nan sipò chat ou',
      heading: 'Sipò Hoïs reponn ou',
      body: [
        'Yon manm ekip sipò Hoïs reponn mesaj ou.',
        'Konekte sou kont ou pou li repons lan epi kontinye konvèsasyon an.',
      ],
      linkPath: '/dashboard/support',
      linkLabel: 'Wè konvèsasyon an',
    });
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
