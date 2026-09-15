import { createClient } from '@/lib/supabase/server';
import VideosAdmin from './videos-admin';

export const metadata = { title: 'Admin · Videyo' };
export const dynamic = 'force-dynamic';

export default async function VideosPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data } = await sb
    .from('cms_videos')
    .select('id, title, slug, status, description, video_url, thumbnail, category')
    .order('updated_at', { ascending: false });
  return <VideosAdmin videos={data ?? []} />;
}
