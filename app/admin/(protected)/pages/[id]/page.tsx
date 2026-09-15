import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PageEditor from './page-editor';
import type { Block } from '@/components/cms/page-blocks';

export const metadata = { title: 'Admin · Modifye paj' };
export const dynamic = 'force-dynamic';

export default async function EditPage({ params }: { params: { id: string } }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data } = await sb
    .from('cms_pages')
    .select('id, title, slug, status, blocks, seo_title, seo_description, og_image')
    .eq('id', params.id)
    .maybeSingle();

  if (!data) notFound();

  const page = {
    id: data.id as string,
    title: (data.title as string) ?? '',
    slug: (data.slug as string) ?? '',
    status: (data.status as 'draft' | 'published') ?? 'draft',
    blocks: (Array.isArray(data.blocks) ? data.blocks : []) as Block[],
    seo_title: (data.seo_title as string) ?? '',
    seo_description: (data.seo_description as string) ?? '',
    og_image: (data.og_image as string) ?? '',
  };

  return <PageEditor page={page} />;
}
