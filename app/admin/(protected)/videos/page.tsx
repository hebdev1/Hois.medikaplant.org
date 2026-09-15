import { createClient } from '@/lib/supabase/server';
import VideosAdmin from './videos-admin';
import { getLakouTabOptions } from '../lakou/actions';

export const metadata = { title: 'Admin · Videyo' };
export const dynamic = 'force-dynamic';

export default async function VideosPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const [{ data }, lakouTabs] = await Promise.all([
    sb
      .from('cms_videos')
      .select(
        'id, title, slug, status, description, video_url, thumbnail, category, lakou_tab_id'
      )
      .order('updated_at', { ascending: false }),
    getLakouTabOptions(),
  ]);
  return <VideosAdmin videos={data ?? []} lakouTabs={lakouTabs} />;
}
