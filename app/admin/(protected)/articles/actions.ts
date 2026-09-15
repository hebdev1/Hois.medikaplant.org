'use server';

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
      .replace(/^-|-$/g, '') || `atik-${Date.now().toString(36)}`
  );
}

export type ArticleState = { ok?: boolean; error?: string };

export async function createArticle(): Promise<{ ok: boolean; id?: string; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const slug = `atik-${Date.now().toString(36)}`;
  const { data, error } = await auth.sb
    .from('cms_articles')
    .insert({ title: 'Nouvo atik', slug, author_id: auth.user.id })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };
  await logAudit(auth.sb, auth.user, { action: 'create', entity: 'article', entity_id: data.id, summary: 'Nouvo atik' });
  revalidatePath('/admin/articles');
  return { ok: true, id: data.id };
}

export async function updateArticle(
  id: string,
  patch: {
    title: string;
    slug: string;
    excerpt?: string;
    cover_image?: string;
    category?: string;
    tags?: string[];
    blocks: Block[];
    seo_title?: string;
    seo_description?: string;
  }
): Promise<ArticleState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const slug = slugify(patch.slug || patch.title);
  const { error } = await auth.sb
    .from('cms_articles')
    .update({
      title: patch.title.trim() || 'San tit',
      slug,
      excerpt: patch.excerpt || null,
      cover_image: patch.cover_image || null,
      category: patch.category || null,
      tags: patch.tags ?? [],
      blocks: patch.blocks,
      seo_title: patch.seo_title || null,
      seo_description: patch.seo_description || null,
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
    content_type: 'article',
    content_id: id,
    title: patch.title.trim() || 'San tit',
    blocks: patch.blocks,
    saved_by: auth.user.id,
  });
  await logAudit(auth.sb, auth.user, { action: 'update', entity: 'article', entity_id: id, summary: patch.title });
  revalidatePath('/admin/articles');
  revalidatePath('/atik');
  revalidatePath(`/atik/${slug}`);
  return { ok: true };
}

export async function setArticleStatus(
  id: string,
  status: 'draft' | 'published'
): Promise<ArticleState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };
  const now = new Date().toISOString();
  const { data, error } = await auth.sb
    .from('cms_articles')
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
    entity: 'article',
    entity_id: id,
    summary: data?.slug,
  });
  revalidatePath('/admin/articles');
  revalidatePath('/atik');
  if (data?.slug) revalidatePath(`/atik/${data.slug}`);
  return { ok: true };
}

export async function deleteArticle(id: string): Promise<ArticleState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };
  const { error } = await auth.sb.from('cms_articles').delete().eq('id', id);
  if (error) return { error: error.message };
  await logAudit(auth.sb, auth.user, { action: 'delete', entity: 'article', entity_id: id });
  revalidatePath('/admin/articles');
  return { ok: true };
}
