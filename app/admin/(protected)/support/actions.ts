'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { emailNotifyMember } from '@/lib/email/notify';
import type { Database } from '@/types/database';
import { hasCapability, type AdminRole } from '../admin-nav-config';
import {
  normalizeHours,
  DEFAULT_OFFLINE_MESSAGE,
  DEFAULT_TIMEZONE,
  type DayHours,
} from '@/lib/support-presence';

type MessageRow = Database['public']['Tables']['support_messages']['Row'];

async function assertAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Ou dwe konekte.' };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, admin_role')
    .eq('id', user.id)
    .maybeSingle();
  const row = profile as { role: string; admin_role: AdminRole | null } | null;
  if (row?.role !== 'admin') {
    return { ok: false as const, error: 'Aksè entèdi.' };
  }
  if (!hasCapability(row.admin_role, 'reply_support')) {
    return { ok: false as const, error: 'Ou pa gen pèmisyon pou reponn sipò.' };
  }
  return { ok: true as const, user, supabase };
}

/**
 * Admin sends a reply in a support thread.
 * Inserts via SECURITY DEFINER RPC so we get the correct sender_role='agent'.
 */
export async function adminSendSupportReply(
  threadId: string,
  body: string,
  attachment?: { imageUrl?: string | null; fileUrl?: string | null; fileName?: string | null }
): Promise<{ ok: true; message: MessageRow } | { ok: false; error: string }> {
  const text = body.trim();
  const image = ownBucketUrlOrNull(attachment?.imageUrl);
  const fileUrl = ownBucketUrlOrNull(attachment?.fileUrl);
  const fileName = fileUrl
    ? ((attachment?.fileName ?? '').trim() || 'fichye').slice(0, 200)
    : null;
  if (text.length === 0 && !image && !fileUrl) return { ok: false, error: 'Mesaj la vid.' };
  if (text.length > 4000) {
    return { ok: false, error: 'Mesaj la twò long (maks 4000 karaktè).' };
  }

  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  // The generated types still describe the old RPC shape, so call untyped.
  const { data, error } = await (auth.supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: MessageRow | null; error: { message: string } | null }>)(
    'admin_send_support_reply',
    {
      p_thread_id: threadId,
      p_body: text,
      p_image_url: image,
      p_file_url: fileUrl,
      p_file_name: fileName,
    }
  );
  if (error || !data) {
    return { ok: false, error: error?.message ?? 'Erè inkoni.' };
  }

  // Notify the member by email — best-effort, and OFF the reply's critical
  // path. Awaiting the email (a Resend round-trip) plus its thread lookup made
  // every reply slow; the persistent Node server finishes this after we return.
  // No revalidatePath either: the inbox updates itself via realtime + optimistic.
  void notifyMemberOfReply(threadId).catch((e) =>
    console.error('[support] member notify failed', e)
  );

  return { ok: true, message: data as MessageRow };
}

// Best-effort "you got a reply" email, run detached from the reply request.
// Uses the service-role client so it doesn't depend on the request's auth
// context still being alive when it runs.
async function notifyMemberOfReply(threadId: string): Promise<void> {
  const sb = createServiceClient();
  const { data: threadRaw } = await sb
    .from('support_threads')
    .select('user_id')
    .eq('id', threadId)
    .maybeSingle();
  const threadUserId = (threadRaw as { user_id: string } | null)?.user_id;
  if (!threadUserId) return;
  await emailNotifyMember(sb, threadUserId, {
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

// ─── Support presence / identity settings ────────────────────────────────────

const ALLOWED_PHOTO_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // 4 Mo

// Only persist attachment URLs from our own public bucket (never external).
function ownBucketUrlOrNull(url: string | null | undefined): string | null {
  const v = (url ?? '').trim();
  if (!v) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const prefix = `${base}/storage/v1/object/public/`;
  return base && v.startsWith(prefix) ? v : null;
}

/** Save availability mode + weekly hours + offline message + agent identity. */
export async function updateSupportSettings(input: {
  mode: 'auto' | 'online' | 'offline';
  hours: DayHours[];
  timezone: string;
  offlineMessage: string;
  agentName: string | null;
  agentRole: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const mode =
    input.mode === 'online' || input.mode === 'offline' ? input.mode : 'auto';
  const hours = normalizeHours(input.hours);
  let tz = (input.timezone || '').trim() || DEFAULT_TIMEZONE;
  try {
    // Reject an unusable IANA zone so presence never throws downstream.
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
  } catch {
    tz = DEFAULT_TIMEZONE;
  }

  const { error } = await (auth.supabase as any)
    .from('support_settings')
    .update({
      availability_mode: mode,
      hours,
      timezone: tz,
      offline_message: (input.offlineMessage || '').trim() || DEFAULT_OFFLINE_MESSAGE,
      agent_name: (input.agentName || '').trim() || null,
      agent_role: (input.agentRole || '').trim() || null,
      updated_by: auth.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/support');
  revalidatePath('/dashboard/support');
  return { ok: true };
}

/** Upload / replace the global support agent photo. */
export async function uploadSupportPhoto(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const file = formData.get('file');
  if (!(file instanceof File)) return { ok: false, error: 'Pa gen fichye.' };
  if (!ALLOWED_PHOTO_MIME.includes(file.type)) {
    return { ok: false, error: 'Sèl JPG, PNG, ak WEBP otorize.' };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { ok: false, error: 'Foto a twò gwo (maks 4 Mo).' };
  }

  const ext =
    file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
  const objectPath = `support/agent/${Date.now()}.${ext}`;

  const { error: upErr } = await auth.supabase.storage
    .from('public-assets')
    .upload(objectPath, await file.arrayBuffer(), {
      contentType: file.type,
      cacheControl: '3600',
      upsert: true,
    });
  if (upErr) return { ok: false, error: upErr.message };

  const {
    data: { publicUrl },
  } = auth.supabase.storage.from('public-assets').getPublicUrl(objectPath);

  // Delete older agent photos so we don't leak storage.
  const { data: prev } = await auth.supabase.storage
    .from('public-assets')
    .list('support/agent');
  const toDelete = (prev ?? [])
    .map((f: { name: string }) => `support/agent/${f.name}`)
    .filter((p: string) => p !== objectPath);
  if (toDelete.length > 0) {
    await auth.supabase.storage.from('public-assets').remove(toDelete);
  }

  const { error } = await (auth.supabase as any)
    .from('support_settings')
    .update({
      agent_photo_url: publicUrl,
      updated_by: auth.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/support');
  revalidatePath('/dashboard/support');
  return { ok: true, url: publicUrl };
}

/** Remove the support agent photo (revert to initials avatar). */
export async function removeSupportPhoto(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data: prev } = await auth.supabase.storage
    .from('public-assets')
    .list('support/agent');
  const paths = (prev ?? []).map((f: { name: string }) => `support/agent/${f.name}`);
  if (paths.length > 0) {
    await auth.supabase.storage.from('public-assets').remove(paths);
  }

  const { error } = await (auth.supabase as any)
    .from('support_settings')
    .update({
      agent_photo_url: null,
      updated_by: auth.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/support');
  revalidatePath('/dashboard/support');
  return { ok: true };
}
