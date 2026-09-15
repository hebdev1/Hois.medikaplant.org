import { createClient } from '@/lib/supabase/server';
import BackupAdmin from './backup-admin';

export const metadata = { title: 'Admin · Backup' };
export const dynamic = 'force-dynamic';

const TABLES: { key: string; label: string }[] = [
  { key: 'cms_pages', label: 'Paj' },
  { key: 'cms_articles', label: 'Atik' },
  { key: 'cms_videos', label: 'Videyo' },
  { key: 'redirects', label: 'Redireksyon' },
  { key: 'cms_block_templates', label: 'Modèl' },
  { key: 'media_assets', label: 'Medya' },
];

export default async function BackupPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const counts: { label: string; count: number }[] = await Promise.all(
    TABLES.map(async (t) => {
      const { count } = await sb.from(t.key).select('id', { count: 'exact', head: true });
      return { label: t.label, count: count ?? 0 };
    })
  );
  return <BackupAdmin counts={counts} />;
}
