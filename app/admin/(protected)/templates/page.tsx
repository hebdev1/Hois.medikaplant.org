import { createClient } from '@/lib/supabase/server';
import TemplatesAdmin from './templates-admin';
import type { Block } from '@/components/cms/page-blocks';

export const metadata = { title: 'Admin · Modèl' };
export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data } = await sb
    .from('cms_block_templates')
    .select('id, name, blocks')
    .order('name', { ascending: true });
  const templates = ((data ?? []) as Array<{ id: string; name: string; blocks: unknown }>).map(
    (t) => ({ id: t.id, name: t.name, blocks: (Array.isArray(t.blocks) ? t.blocks : []) as Block[] })
  );
  return <TemplatesAdmin templates={templates} />;
}
