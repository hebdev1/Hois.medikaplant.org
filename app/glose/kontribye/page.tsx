import { Poppins } from 'next/font/google';
import { createClient } from '@/lib/supabase/server';
import PromoteHeader from '@/components/ui/promote-header';
import Footer from '@/components/ui/footer';
import ContributionForm, { type PlantLite } from './contribution-form';
import './kontribye.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata = {
  title: 'Kontribye nan Glosè a',
  description:
    'Pataje yon non plant, yon foto, oswa yon koreksyon pou glosè plant Ayisyen an. Yon kiratè ap gade chak kontribisyon anvan li parèt.',
};
export const dynamic = 'force-dynamic';

export default async function KontribyePage() {
  const supabase = createClient();
  // glossary_terms isn't in the generated types yet — loose handle. RLS lets
  // anon read active rows.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data } = await sb
    .from('glossary_terms')
    .select('code, name, scientific_name, family')
    .eq('active', true)
    .order('name', { ascending: true });

  const plants: PlantLite[] = ((data ?? []) as Array<Record<string, unknown>>).map(
    (r) => ({
      id: (r.code as string) ?? '',
      k: (r.name as string) ?? '',
      n: (r.scientific_name as string) ?? '',
      f: (r.family as string) ?? '',
    })
  );

  return (
    <>
      <PromoteHeader />
      <main className={poppins.variable}>
        <ContributionForm plants={plants} />
      </main>
      <Footer />
    </>
  );
}
