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

const TABLE = { page: 'cms_pages', article: 'cms_articles' } as const;
type ContentType = 'page' | 'article';

export type Revision = {
  id: string;
  title: string | null;
  created_at: string;
  actor_email: string | null;
};

export async function listRevisions(
  contentType: ContentType,
  contentId: string
): Promise<Revision[]> {
  const a = await assertAdmin();
  if (!a.ok) return [];
  const { data } = await a.sb
    .from('cms_revisions')
    .select('id, title, created_at, saved_by')
    .eq('content_type', contentType)
    .eq('content_id', contentId)
    .order('created_at', { ascending: false })
    .limit(50);
  const rows = (data ?? []) as Array<{ id: string; title: string | null; created_at: string; saved_by: string | null }>;

  // Resolve author emails in one lookup.
  const ids = [...new Set(rows.map((r) => r.saved_by).filter(Boolean))] as string[];
  const emails = new Map<string, string>();
  if (ids.length) {
    const { data: profs } = await a.sb.from('profiles').select('id, email').in('id', ids);
    for (const p of (profs ?? []) as Array<{ id: string; email: string }>) emails.set(p.id, p.email);
  }
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    created_at: r.created_at,
    actor_email: r.saved_by ? emails.get(r.saved_by) ?? null : null,
  }));
}

export async function restoreRevision(
  revisionId: string
): Promise<{ ok?: boolean; error?: string }> {
  const a = await assertAdmin();
  if (!a.ok) return { error: a.error };
  const { data: rev } = await a.sb
    .from('cms_revisions')
    .select('content_type, content_id, title, blocks')
    .eq('id', revisionId)
    .maybeSingle();
  if (!rev) return { error: 'Revizyon pa jwenn.' };

  const table = TABLE[rev.content_type as ContentType];
  const { error } = await a.sb
    .from(table)
    .update({ title: rev.title, blocks: rev.blocks, updated_at: new Date().toISOString() })
    .eq('id', rev.content_id);
  if (error) return { error: error.message };

  // Restoring creates a NEW revision (never destroys the latest).
  await a.sb.from('cms_revisions').insert({
    content_type: rev.content_type,
    content_id: rev.content_id,
    title: rev.title,
    blocks: rev.blocks,
    saved_by: a.user.id,
  });
  await logAudit(a.sb, a.user, {
    action: 'restore',
    entity: rev.content_type,
    entity_id: rev.content_id,
    summary: rev.title,
  });

  revalidatePath(`/admin/${rev.content_type === 'page' ? 'pages' : 'articles'}`);
  return { ok: true };
}
