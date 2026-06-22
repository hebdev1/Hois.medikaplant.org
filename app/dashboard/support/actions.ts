'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type ThreadRow = Database['public']['Tables']['support_threads']['Row'];
type MessageRow = Database['public']['Tables']['support_messages']['Row'];

const DEFAULT_WELCOME =
  'Bonjou!  Kòman ou santi w jodi a? m ap reponn nan kèk minit.';

// Single fixed acknowledgement sent after each user message. Replaces the
// earlier 4-option pool so members always get the same, predictable reply
// while they wait for a real admin response from /admin/support.
const AUTO_REPLY =
  'Mèsi pou mesaj la. M ap reponn ou nan mwens ke 5 minit. Pandan tan an, gade gid yo nan paj Telechajman.';

// ─── Get-or-create the user's open thread ───────────────────────────────────

export type ThreadWithMessages = {
  thread: ThreadRow;
  messages: MessageRow[];
};

export async function getOrCreateThread(): Promise<
  { ok: true; data: ThreadWithMessages } | { ok: false; error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  // Most-recent open thread for this user
  const { data: existing } = await supabase
    .from('support_threads')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'open')
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let thread = existing as ThreadRow | null;

  if (!thread) {
    const { data: created, error } = await supabase
      .from('support_threads')
      .insert({ user_id: user.id })
      .select('*')
      .single();
    if (error || !created) {
      return { ok: false, error: error?.message ?? 'Erè inkoni.' };
    }
    thread = created as ThreadRow;

    // Seed the conversation with a welcome message from the agent persona.
    await supabase.from('support_messages').insert({
      thread_id: thread.id,
      sender_role: 'system',
      body: DEFAULT_WELCOME,
    });
  }

  const { data: msgs } = await supabase
    .from('support_messages')
    .select('*')
    .eq('thread_id', thread.id)
    .order('created_at', { ascending: true });

  return {
    ok: true,
    data: { thread, messages: (msgs ?? []) as MessageRow[] },
  };
}

// ─── Send a user message ────────────────────────────────────────────────────

export async function sendMessage(
  threadId: string,
  body: string
): Promise<
  { ok: true; message: MessageRow } | { ok: false; error: string }
> {
  const text = body.trim();
  if (text.length === 0) return { ok: false, error: 'Mesaj la vid.' };
  if (text.length > 4000) return { ok: false, error: 'Mesaj la twò long (maks 4000 karaktè).' };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  // Verify thread is theirs and still open
  const { data: thread } = await supabase
    .from('support_threads')
    .select('id, status, user_id')
    .eq('id', threadId)
    .maybeSingle();
  const t = thread as { id: string; status: string; user_id: string } | null;
  if (!t || t.user_id !== user.id) {
    return { ok: false, error: 'Konvèsasyon sa a pa pou ou.' };
  }
  if (t.status !== 'open') {
    return { ok: false, error: 'Konvèsasyon sa a fèmen.' };
  }

  const { data: inserted, error } = await supabase
    .from('support_messages')
    .insert({
      thread_id: threadId,
      sender_role: 'user',
      sender_id: user.id,
      body: text,
    })
    .select('*')
    .single();
  if (error || !inserted) {
    return { ok: false, error: error?.message ?? 'Erè inkoni.' };
  }

  revalidatePath('/dashboard/support');
  return { ok: true, message: inserted as MessageRow };
}

// ─── Auto-reply (demo persona — replaced by real agents later) ──────────────

export async function simulateAgentReply(
  threadId: string
): Promise<
  { ok: true; message: MessageRow } | { ok: false; error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  // The reply is inserted as 'system' — RLS doesn't let regular users
  // insert agent/system rows, so we go through a SECURITY DEFINER helper.
  const { data, error } = await supabase.rpc('insert_support_auto_reply', {
    p_thread_id: threadId,
    p_body: AUTO_REPLY,
  });
  if (error || !data) {
    return { ok: false, error: error?.message ?? 'Erè inkoni.' };
  }
  return { ok: true, message: data as MessageRow };
}

// ─── Close a thread ─────────────────────────────────────────────────────────

export async function markThreadResolved(
  threadId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  const { error } = await supabase
    .from('support_threads')
    .update({ status: 'resolved' })
    .eq('id', threadId)
    .eq('user_id', user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard/support');
  return { ok: true };
}
