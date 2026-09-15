import { createClient } from '@/lib/supabase/server';
import ArticlesList from './articles-list';

export const metadata = { title: 'Admin · Atik' };
export const dynamic = 'force-dynamic';

export default async function ArticlesAdmin() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data } = await sb
    .from('cms_articles')
    .select('id, title, slug, status, category, updated_at')
    .order('updated_at', { ascending: false });
  return <ArticlesList articles={data ?? []} />;
}
