import { createClient } from '@/lib/supabase/server';
import MediaLibrary from './media-library';

export const metadata = { title: 'Admin · Bibliyotèk Medya' };
export const dynamic = 'force-dynamic';

export default async function MediaPage() {
  // media_* tables aren't in the (stale) generated types yet — cast like the
  // other newer-table admin pages.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;

  const [{ data: folders }, { data: assets }] = await Promise.all([
    sb
      .from('media_folders')
      .select('id, name, slug, sort_order')
      .order('sort_order', { ascending: true }),
    sb
      .from('media_assets')
      .select(
        'id, url, filename, title, alt_text, caption, folder_id, mime_type, bytes, width, height, created_at'
      )
      .order('created_at', { ascending: false }),
  ]);

  return <MediaLibrary folders={folders ?? []} assets={assets ?? []} />;
}
