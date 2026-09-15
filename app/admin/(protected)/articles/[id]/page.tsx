import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ArticleEditor from './article-editor';
import type { Block } from '@/components/cms/page-blocks';

export const metadata = { title: 'Admin · Modifye atik' };
export const dynamic = 'force-dynamic';

export default async function EditArticle({ params }: { params: { id: string } }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data } = await sb
    .from('cms_articles')
    .select(
      'id, title, slug, status, excerpt, cover_image, category, tags, blocks, seo_title, seo_description'
    )
    .eq('id', params.id)
    .maybeSingle();

  if (!data) notFound();

  const article = {
    id: data.id as string,
    title: (data.title as string) ?? '',
    slug: (data.slug as string) ?? '',
    status: (data.status as 'draft' | 'published') ?? 'draft',
    excerpt: (data.excerpt as string) ?? '',
    cover_image: (data.cover_image as string) ?? '',
    category: (data.category as string) ?? '',
    tags: (Array.isArray(data.tags) ? data.tags : []) as string[],
    blocks: (Array.isArray(data.blocks) ? data.blocks : []) as Block[],
    seo_title: (data.seo_title as string) ?? '',
    seo_description: (data.seo_description as string) ?? '',
  };

  return <ArticleEditor article={article} />;
}
