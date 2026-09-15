import { createClient } from '@/lib/supabase/server';
import PagesList from './pages-list';

export const metadata = { title: 'Admin · Paj' };
export const dynamic = 'force-dynamic';

export default async function PagesAdmin() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data } = await sb
    .from('cms_pages')
    .select('id, title, slug, status, updated_at')
    .order('updated_at', { ascending: false });
  return <PagesList pages={data ?? []} />;
}
