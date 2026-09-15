import { createClient } from '@/lib/supabase/server';
import RedirectsAdmin from './redirects-admin';

export const metadata = { title: 'Admin · Redireksyon' };
export const dynamic = 'force-dynamic';

export default async function RedirectsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data } = await sb
    .from('redirects')
    .select('id, from_path, to_path, status_code, active, hits, created_at')
    .order('created_at', { ascending: false });
  return <RedirectsAdmin redirects={data ?? []} />;
}
