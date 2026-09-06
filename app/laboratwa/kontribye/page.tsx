import { createClient } from '@/lib/supabase/server';
import { LabHeader, Disclaimer, readLang } from '../lab-ui';
import ContributeForm from './form';

export const metadata = { title: 'Kontribye · Laboratwa' };
export const dynamic = 'force-dynamic';

export default async function KontribyePage({ searchParams }: { searchParams: { lang?: string } }) {
  const lang = readLang(searchParams);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data } = await sb
    .from('plants').select('id, slug, name_kr').eq('status', 'published').order('name_kr');

  return (
    <div className="lab-wrap" style={{ paddingBottom: 60, maxWidth: 640 }}>
      <LabHeader lang={lang} back={{ href: '/laboratwa', label: 'Laboratwa' }} />
      <h1 style={{ marginTop: 20 }}>Kontribye yon non</h1>
      <p className="lab-lead">
        Non plant yo chanje soti nan yon rejyon rive nan yon lòt. Si ou konnen yon non
        oswa yon detay nou pa genyen, pataje l — yon moun nan ekip la ap revize l.
      </p>
      <Disclaimer short />
      <ContributeForm plants={(data ?? []) as { slug: string; name_kr: string; id: string }[]} />
    </div>
  );
}
