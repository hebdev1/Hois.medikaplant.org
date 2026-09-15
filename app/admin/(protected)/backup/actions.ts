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

// Every CMS content table (not member/health data — this is a content backup).
const EXPORT_TABLES = [
  'cms_pages',
  'cms_articles',
  'cms_videos',
  'redirects',
  'cms_block_templates',
  'media_folders',
  'media_assets',
] as const;

export async function exportCms(): Promise<{
  ok?: boolean;
  error?: string;
  json?: string;
  counts?: Record<string, number>;
}> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const out: Record<string, unknown> = {
    _meta: { exported_at: new Date().toISOString(), app: 'hois-medikaplant-cms', version: 1 },
  };
  const counts: Record<string, number> = {};

  for (const t of EXPORT_TABLES) {
    const { data, error } = await auth.sb.from(t).select('*');
    if (error) return { error: `${t}: ${error.message}` };
    out[t] = data ?? [];
    counts[t] = (data ?? []).length;
  }

  return { ok: true, json: JSON.stringify(out, null, 2), counts };
}

export type ImportResult = {
  ok?: boolean;
  error?: string;
  results?: Record<string, { imported: number; error?: string }>;
};

/**
 * Restore a CMS backup produced by exportCms. Rows are UPSERTED by id, so
 * existing content is updated and new content is inserted — nothing is ever
 * deleted (a row missing from the backup is left untouched). media_folders
 * import before media_assets so the folder FK resolves. Same-project only:
 * created_by / author_id references expect the same auth.users.
 */
export async function importCms(json: string): Promise<ImportResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(json) as Record<string, unknown>;
  } catch {
    return { error: 'Fichye a se pa yon JSON valab.' };
  }
  const meta = parsed._meta as { app?: string } | undefined;
  if (!meta || meta.app !== 'hois-medikaplant-cms') {
    return { error: 'Fichye sa a pa yon backup CMS Hoïs. (Meta a manke.)' };
  }

  const results: Record<string, { imported: number; error?: string }> = {};
  let total = 0;

  for (const t of EXPORT_TABLES) {
    const rows = Array.isArray(parsed[t]) ? (parsed[t] as unknown[]) : [];
    if (rows.length === 0) {
      results[t] = { imported: 0 };
      continue;
    }
    const { error } = await auth.sb.from(t).upsert(rows, { onConflict: 'id' });
    if (error) {
      results[t] = { imported: 0, error: error.message };
      continue;
    }
    results[t] = { imported: rows.length };
    total += rows.length;
  }

  await logAudit(auth.sb, auth.user, {
    action: 'restore',
    entity: 'backup',
    summary: `${total} liy enpòte`,
  });

  // Content changed across the board — refresh the admin lists + the public
  // content indexes. Individual /paj/[slug] etc. re-render on next visit.
  for (const p of [
    '/admin/pages',
    '/admin/articles',
    '/admin/videos',
    '/admin/media',
    '/admin/redirects',
    '/admin/templates',
    '/atik',
    '/videyo',
  ]) {
    revalidatePath(p);
  }

  return { ok: true, results };
}
