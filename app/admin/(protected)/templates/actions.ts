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

export type BlockTemplate = { id: string; name: string; blocks: Block[] };
export type TemplateState = { ok?: boolean; error?: string; id?: string };

/** List templates — used by the manager and the block-editor insert menu. */
export async function listBlockTemplates(): Promise<BlockTemplate[]> {
  const auth = await assertAdmin();
  if (!auth.ok) return [];
  const { data } = await auth.sb
    .from('cms_block_templates')
    .select('id, name, blocks')
    .order('name', { ascending: true });
  return ((data ?? []) as Array<{ id: string; name: string; blocks: unknown }>).map((t) => ({
    id: t.id,
    name: t.name,
    blocks: (Array.isArray(t.blocks) ? t.blocks : []) as Block[],
  }));
}

export async function saveBlockTemplate(input: {
  id?: string;
  name: string;
  blocks: Block[];
}): Promise<TemplateState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };
  const name = input.name.trim();
  if (!name) return { error: 'Bay yon non pou modèl la.' };

  let error;
  let id = input.id;
  if (input.id) {
    ({ error } = await auth.sb
      .from('cms_block_templates')
      .update({ name, blocks: input.blocks, updated_at: new Date().toISOString() })
      .eq('id', input.id));
  } else {
    const res = await auth.sb
      .from('cms_block_templates')
      .insert({ name, blocks: input.blocks, created_by: auth.user.id })
      .select('id')
      .single();
    error = res.error;
    id = res.data?.id;
  }
  if (error) return { error: error.message };
  await logAudit(auth.sb, auth.user, {
    action: input.id ? 'update' : 'create',
    entity: 'template',
    entity_id: id,
    summary: name,
  });
  revalidatePath('/admin/templates');
  return { ok: true, id };
}

export async function deleteBlockTemplate(id: string): Promise<TemplateState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };
  const { error } = await auth.sb.from('cms_block_templates').delete().eq('id', id);
  if (error) return { error: error.message };
  await logAudit(auth.sb, auth.user, { action: 'delete', entity: 'template', entity_id: id });
  revalidatePath('/admin/templates');
  return { ok: true };
}
