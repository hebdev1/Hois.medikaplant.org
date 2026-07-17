import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import DozForm from '../doz-form';

export const metadata = { title: 'Admin · Nouvo resèt' };
export const dynamic = 'force-dynamic';

export default async function NewDozPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if ((profile as { role?: string } | null)?.role !== 'admin') redirect('/admin');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cats } = await (supabase as any)
    .from('doz_categories')
    .select('id, label')
    .order('display_order', { ascending: true });

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1280px] mx-auto">
      <Link href="/admin/doz" className="inline-flex items-center gap-1.5 text-sm text-earth-600 hover:text-forest-700 mb-4">
        <ArrowLeft className="w-4 h-4" strokeWidth={2.2} /> Resèt ak Dòz
      </Link>
      <h1 className="font-display text-2xl font-bold text-ink mb-6">Nouvo resèt</h1>
      <DozForm mode="create" categories={(cats ?? []) as Array<{ id: string; label: string }>} />
    </div>
  );
}
