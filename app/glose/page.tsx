import { Poppins } from 'next/font/google';
import { createClient } from '@/lib/supabase/server';
import GlossaryReader, { type GlossTerm } from '@/components/glose/glossary-reader';
import PromoteHeader from '@/components/ui/promote-header';
import Footer from '@/components/ui/footer';
import './glose.css';

// Poppins, per the brief — scoped to this page via the --font-poppins variable
// the reader's CSS reads.
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata = {
  title: 'Glosè Plant Ayisyen',
  description:
    'Glosè plant medsin Ayisyen: non kreyòl, non syantifik, ak fanmi botanik, kontwole ak TRAMIL.',
};
export const dynamic = 'force-dynamic';

export default async function GlosePage() {
  const supabase = createClient();
  // glossary_terms isn't in the generated types yet — loose handle.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data } = await sb
    .from('glossary_terms')
    .select(
      'code, letter, name, variants, family, scientific_name, tramil, status, note'
    )
    .eq('active', true)
    .order('letter', { ascending: true })
    .order('name', { ascending: true });

  const terms: GlossTerm[] = ((data ?? []) as Array<Record<string, unknown>>).map(
    (r) => ({
      code: (r.code as string) ?? '',
      letter: (r.letter as string) ?? 'A',
      name: (r.name as string) ?? '',
      variants: (r.variants as string[]) ?? [],
      family: (r.family as string) ?? '',
      scientific: (r.scientific_name as string) ?? '',
      tramil: (r.tramil as string) ?? 'pa-jwenn',
      status: (r.status as string) ?? 'pwovizwa',
      note: (r.note as string) ?? '',
    })
  );

  return (
    <>
      <PromoteHeader />
      <main className={poppins.variable}>
        <GlossaryReader terms={terms} />
      </main>
      <Footer />
    </>
  );
}
