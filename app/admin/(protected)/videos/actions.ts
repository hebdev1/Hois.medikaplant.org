'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/cms/audit';

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
  if ((profile as { role?: string } | null)?.role !== 'admin') {
    return { ok: false as const, error: 'Aksè entèdi.' };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { ok: true as const, user, sb: supabase as any };
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `videyo-${Date.now().toString(36)}`
  );
}

export type VideoState = { ok?: boolean; error?: string; id?: string };

export async function saveVideo(input: {
  id?: string;
  title: string;
  slug: string;
  description?: string;
  video_url?: string;
  thumbnail?: string;
  category?: string;
}): Promise<VideoState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const title = input.title.trim() || 'San tit';
  const slug = slugify(input.slug || input.title);
  const row = {
    title,
    slug,
    description: input.description || null,
    video_url: input.video_url || null,
    thumbnail: input.thumbnail || null,
    category: input.category || null,
    updated_at: new Date().toISOString(),
  };

  let error;
  let id = input.id;
  if (input.id) {
    ({ error } = await auth.sb.from('cms_videos').update(row).eq('id', input.id));
  } else {
    const res = await auth.sb
      .from('cms_videos')
      .insert({ ...row, created_by: auth.user.id })
      .select('id')
      .single();
    error = res.error;
    id = res.data?.id;
  }
  if (error) {
    if (/duplicate key|unique/i.test(error.message)) {
      return { error: `Slug "${slug}" deja pran.` };
    }
    return { error: error.message };
  }
  await logAudit(auth.sb, auth.user, {
    action: input.id ? 'update' : 'create',
    entity: 'video',
    entity_id: id,
    summary: title,
  });
  revalidatePath('/admin/videos');
  revalidatePath('/videyo');
  revalidatePath(`/videyo/${slug}`);
  return { ok: true, id };
}

export async function setVideoStatus(
  id: string,
  status: 'draft' | 'published'
): Promise<VideoState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };
  const now = new Date().toISOString();
  const { data, error } = await auth.sb
    .from('cms_videos')
    .update({ status, published_at: status === 'published' ? now : null, updated_at: now })
    .eq('id', id)
    .select('slug')
    .single();
  if (error) return { error: error.message };
  await logAudit(auth.sb, auth.user, {
    action: status === 'published' ? 'publish' : 'unpublish',
    entity: 'video',
    entity_id: id,
    summary: data?.slug,
  });
  revalidatePath('/admin/videos');
  revalidatePath('/videyo');
  if (data?.slug) revalidatePath(`/videyo/${data.slug}`);
  return { ok: true };
}

export async function deleteVideo(id: string): Promise<VideoState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };
  const { error } = await auth.sb.from('cms_videos').delete().eq('id', id);
  if (error) return { error: error.message };
  await logAudit(auth.sb, auth.user, { action: 'delete', entity: 'video', entity_id: id });
  revalidatePath('/admin/videos');
  return { ok: true };
}
