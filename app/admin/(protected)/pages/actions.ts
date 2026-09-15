'use server';

// CMS Pages server actions. Pages are block documents stored in cms_pages and
// rendered publicly at /paj/<slug>. Every action re-checks the admin session.

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Block } from '@/components/cms/page-blocks';
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
      .replace(/^-|-$/g, '') || `paj-${Date.now().toString(36)}`
  );
}

export type PageState = { ok?: boolean; error?: string };

/** Create a blank draft; returns its id so the client can open the editor. */
export async function createPage(): Promise<{ ok: boolean; id?: string; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const slug = `paj-${Date.now().toString(36)}`;
  const { data, error } = await auth.sb
    .from('cms_pages')
    .insert({ title: 'Nouvo paj', slug, created_by: auth.user.id })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };
  await logAudit(auth.sb, auth.user, { action: 'create', entity: 'page', entity_id: data.id, summary: 'Nouvo paj' });
  revalidatePath('/admin/pages');
  return { ok: true, id: data.id };
}

/** Save the editor's content. */
export async function updatePage(
  id: string,
  patch: {
    title: string;
    slug: string;
    blocks: Block[];
    seo_title?: string;
    seo_description?: string;
    og_image?: string;
  }
): Promise<PageState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const slug = slugify(patch.slug || patch.title);
  const { error } = await auth.sb
    .from('cms_pages')
    .update({
      title: patch.title.trim() || 'San tit',
      slug,
      blocks: patch.blocks,
      seo_title: patch.seo_title || null,
      seo_description: patch.seo_description || null,
      og_image: patch.og_image || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) {
    if (/duplicate key|unique/i.test(error.message)) {
      return { error: `Slug "${slug}" deja pran. Chwazi yon lòt.` };
    }
    return { error: error.message };
  }
  await auth.sb.from('cms_revisions').insert({
    content_type: 'page',
    content_id: id,
    title: patch.title.trim() || 'San tit',
    blocks: patch.blocks,
    saved_by: auth.user.id,
  });
  await logAudit(auth.sb, auth.user, { action: 'update', entity: 'page', entity_id: id, summary: patch.title });
  revalidatePath('/admin/pages');
  revalidatePath(`/paj/${slug}`);
  return { ok: true };
}

/** Publish / unpublish. */
export async function setPageStatus(
  id: string,
  status: 'draft' | 'published'
): Promise<PageState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };
  const now = new Date().toISOString();
  const { data, error } = await auth.sb
    .from('cms_pages')
    .update({
      status,
      published_at: status === 'published' ? now : null,
      updated_at: now,
    })
    .eq('id', id)
    .select('slug')
    .single();
  if (error) return { error: error.message };
  await logAudit(auth.sb, auth.user, {
    action: status === 'published' ? 'publish' : 'unpublish',
    entity: 'page',
    entity_id: id,
    summary: data?.slug,
  });
  revalidatePath('/admin/pages');
  if (data?.slug) revalidatePath(`/paj/${data.slug}`);
  return { ok: true };
}

export async function deletePage(id: string): Promise<PageState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };
  const { error } = await auth.sb.from('cms_pages').delete().eq('id', id);
  if (error) return { error: error.message };
  await logAudit(auth.sb, auth.user, { action: 'delete', entity: 'page', entity_id: id });
  revalidatePath('/admin/pages');
  return { ok: true };
}
