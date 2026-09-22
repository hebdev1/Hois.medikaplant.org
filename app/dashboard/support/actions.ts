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

// ─── Attachments (shared public-assets bucket) ──────────────────────────────
// Images render inline; every other allowed type becomes a download chip.
const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_FILE_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/zip',
];
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 Mo

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/zip': 'zip',
};

// Only accept attachment URLs we produced (our own Supabase public bucket) —
// never an arbitrary external URL a client might try to inject into a message.
function ownBucketUrlOrNull(url: string | null | undefined): string | null {
  const v = (url ?? '').trim();
  if (!v) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const prefix = `${base}/storage/v1/object/public/`;
  return base && v.startsWith(prefix) ? v : null;
}

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
  body: string,
  attachment?: { imageUrl?: string | null; fileUrl?: string | null; fileName?: string | null }
): Promise<
  { ok: true; message: MessageRow } | { ok: false; error: string }
> {
  const text = body.trim();
  const image = ownBucketUrlOrNull(attachment?.imageUrl);
  const fileUrl = ownBucketUrlOrNull(attachment?.fileUrl);
  const fileName = fileUrl
    ? ((attachment?.fileName ?? '').trim() || 'fichye').slice(0, 200)
    : null;
  if (text.length === 0 && !image && !fileUrl) return { ok: false, error: 'Mesaj la vid.' };
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
      image_url: image,
      file_url: fileUrl,
      file_name: fileName,
    })
    .select('*')
    .single();
  if (error || !inserted) {
    return { ok: false, error: error?.message ?? 'Erè inkoni.' };
  }

  // NOTE: deliberately NO revalidatePath here. The chat updates itself via the
  // optimistic insert + realtime echo, so revalidating would force a full
  // server re-render of /dashboard/support on every send — the round-trip that
  // made sending feel slow (and widened the realtime-echo duplicate race).
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

// ─── Read-only fetch for the floating widget (never creates a thread) ───────
// Used on dashboard load to compute the unread badge. getOrCreateThread would
// mint an empty thread for every visitor, so the widget uses this first and
// only creates a thread when the member actually opens the chat.
export async function getMemberThread(): Promise<
  | { ok: true; data: ThreadWithMessages | null }
  | { ok: false; error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  const { data: existing } = await supabase
    .from('support_threads')
    .select('*')
    .eq('user_id', user.id)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const thread = existing as ThreadRow | null;
  if (!thread) return { ok: true, data: null };

  const { data: msgs } = await supabase
    .from('support_messages')
    .select('*')
    .eq('thread_id', thread.id)
    .order('created_at', { ascending: true });

  return { ok: true, data: { thread, messages: (msgs ?? []) as MessageRow[] } };
}

// ─── Mark the conversation read (clears the unread badge) ───────────────────

export async function markThreadRead(
  threadId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  // Only the owner may stamp this (enforced again by RLS).
  const { error } = await supabase
    .from('support_threads')
    .update({ member_last_read_at: new Date().toISOString() })
    .eq('id', threadId)
    .eq('user_id', user.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
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

// ─── Upload a chat attachment (member or admin — any authenticated user) ─────
// Handles images and documents. Returns a public URL in our own bucket plus
// the original filename and a kind, which the composer uses to render the
// staged attachment and which sendMessage / adminSendSupportReply validate.
export async function uploadSupportAttachment(
  formData: FormData
): Promise<
  | { ok: true; url: string; name: string; kind: 'image' | 'file' }
  | { ok: false; error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  const file = formData.get('file');
  if (!(file instanceof File)) return { ok: false, error: 'Pa gen fichye.' };
  const isImage = ALLOWED_IMAGE_MIME.includes(file.type);
  const isFile = ALLOWED_FILE_MIME.includes(file.type);
  if (!isImage && !isFile) {
    return { ok: false, error: 'Kalite fichye sa a pa otorize.' };
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return { ok: false, error: 'Fichye a twò gwo (maks 10 Mo).' };
  }

  const ext =
    EXT_BY_MIME[file.type] ??
    (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
  // High-entropy key so attachment URLs in the public bucket can't be guessed
  // or enumerated (defense-in-depth until these move to a private bucket).
  const rand = crypto.randomUUID();
  const objectPath = `support/attachments/${user.id}/${rand}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('public-assets')
    .upload(objectPath, await file.arrayBuffer(), {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });
  if (uploadError) return { ok: false, error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from('public-assets').getPublicUrl(objectPath);
  return {
    ok: true,
    url: publicUrl,
    name: file.name,
    kind: isImage ? 'image' : 'file',
  };
}

// ─── Edit / delete a message ────────────────────────────────────────────────
// Permissions are enforced in the SECURITY DEFINER RPCs: a member may touch
// only their own 'user' messages, an admin only 'agent'/'system' messages.

export async function editSupportMessage(
  messageId: string,
  body: string
): Promise<{ ok: true; message: MessageRow } | { ok: false; error: string }> {
  const text = body.trim();
  if (text.length === 0) return { ok: false, error: 'Mesaj la vid.' };
  if (text.length > 4000) return { ok: false, error: 'Mesaj la twò long (maks 4000 karaktè).' };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  const { data, error } = await (
    supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ data: MessageRow | null; error: { message: string } | null }>
  )('edit_support_message', { p_message_id: messageId, p_body: text });
  if (error || !data) return { ok: false, error: error?.message ?? 'Erè inkoni.' };
  return { ok: true, message: data as MessageRow };
}

export async function deleteSupportMessage(
  messageId: string
): Promise<{ ok: true; message: MessageRow } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  const { data, error } = await (
    supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ data: MessageRow | null; error: { message: string } | null }>
  )('delete_support_message', { p_message_id: messageId });
  if (error || !data) return { ok: false, error: error?.message ?? 'Erè inkoni.' };
  return { ok: true, message: data as MessageRow };
}
