'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type TopicRow = Database['public']['Tables']['forum_topics']['Row'];
type ReplyRow = Database['public']['Tables']['forum_replies']['Row'];

export type TopicState = {
  error?: string;
  /** Set by createTopic so the client can navigate after success. */
  slug?: string;
};

export type ReplyResult =
  | { ok: true; reply: ReplyRow }
  | { ok: false; error: string };

async function getAuthedUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Ou dwe konekte.' };
  return { ok: true as const, user, supabase };
}

// ─── Create topic ────────────────────────────────────────────────────────

export async function createTopic(
  _prev: TopicState,
  formData: FormData
): Promise<TopicState> {
  const auth = await getAuthedUser();
  if (!auth.ok) return { error: auth.error };

  const title = (formData.get('title')?.toString() ?? '').trim();
  const body = (formData.get('body')?.toString() ?? '').trim();
  const categoryId = formData.get('category_id')?.toString() ?? '';

  if (title.length < 3) return { error: 'Tit la twò kout (omwen 3 karaktè).' };
  if (title.length > 200) return { error: 'Tit la twò long (maks 200 karaktè).' };
  if (body.length < 1) return { error: 'Kontni an pa ka vid.' };
  if (body.length > 8000) {
    return { error: 'Kontni an twò long (maks 8000 karaktè).' };
  }

  // Verify category exists if provided
  let resolvedCategoryId: string | null = null;
  if (categoryId) {
    const { data: cat } = await auth.supabase
      .from('forum_categories')
      .select('id')
      .eq('id', categoryId)
      .maybeSingle();
    if (!cat) return { error: 'Kategori a pa egziste.' };
    resolvedCategoryId = (cat as { id: string }).id;
  }

  const { data, error } = await auth.supabase
    .from('forum_topics')
    .insert({
      user_id: auth.user.id,
      title,
      body,
      slug: '', // trigger generates from title
      category_id: resolvedCategoryId,
    })
    .select('id, slug')
    .single();
  if (error || !data) {
    return { error: error?.message ?? 'Erè inkoni.' };
  }

  const row = data as { id: string; slug: string };
  revalidatePath('/dashboard/forum');
  redirect(`/dashboard/forum/${row.slug}`);
}

// ─── Create reply ────────────────────────────────────────────────────────

export async function createReply(
  topicId: string,
  body: string
): Promise<ReplyResult> {
  const auth = await getAuthedUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const text = body.trim();
  if (text.length < 1) return { ok: false, error: 'Repons la pa ka vid.' };
  if (text.length > 4000) {
    return { ok: false, error: 'Repons la twò long (maks 4000 karaktè).' };
  }

  const { data, error } = await auth.supabase
    .from('forum_replies')
    .insert({
      topic_id: topicId,
      user_id: auth.user.id,
      body: text,
    })
    .select('*')
    .single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? 'Erè inkoni.' };
  }

  revalidatePath(`/dashboard/forum`);
  return { ok: true, reply: data as ReplyRow };
}

// ─── Delete topic / reply ────────────────────────────────────────────────

export async function deleteTopic(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await getAuthedUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  // RLS handles the author/admin check
  const { error } = await auth.supabase
    .from('forum_topics')
    .delete()
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard/forum');
  return { ok: true };
}

export async function deleteReply(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await getAuthedUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from('forum_replies')
    .delete()
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard/forum');
  return { ok: true };
}

// ─── Bump view count (one shot per request) ──────────────────────────────

export async function bumpTopicView(topicId: string): Promise<void> {
  const auth = await getAuthedUser();
  if (!auth.ok) return;
  // Fire-and-forget via SECURITY DEFINER RPC for atomic increment
  await auth.supabase.rpc('increment_forum_topic_view', { p_topic_id: topicId });
}

// Surface the type used by the form/topic page
export type ForumTopic = TopicRow;
export type ForumReply = ReplyRow;
