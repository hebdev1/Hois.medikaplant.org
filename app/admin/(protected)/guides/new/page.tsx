import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import GuideForm from '../guide-form';
import { createGuide } from '../actions';
import type { Database } from '@/types/database';
import { hasCapability, type AdminRole } from '../../admin-nav-config';

export const metadata = { title: 'Admin · Nouvo gid' };
export const dynamic = 'force-dynamic';

type Category = Database['public']['Tables']['guide_categories']['Row'];

export default async function NewGuidePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('admin_role')
    .eq('id', user.id)
    .maybeSingle();
  const adminRole = (profileRaw as { admin_role: AdminRole | null } | null)
    ?.admin_role;
  if (!hasCapability(adminRole, 'manage_guides')) {
    redirect('/admin');
  }

  const { data: catsRaw } = await supabase
    .from('guide_categories')
    .select('*')
    .order('display_order', { ascending: true });
  const categories = (catsRaw ?? []) as Category[];

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1280px] mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/guides"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-earth-700 hover:text-forest-700 mb-3"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.2} />
          Tounen nan Gid
        </Link>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink inline-flex items-center gap-2">
          <PlusCircle className="w-7 h-7 text-forest-700" strokeWidth={2} />
          Nouvo atik
        </h1>
        <p className="mt-2 text-sm text-earth-600 max-w-2xl">
          Konplete enfòmasyon yo. Lè ou pibliye, atik la parèt imedyatman nan{' '}
          <code className="text-xs bg-cream-100 px-1.5 py-0.5 rounded">/dashboard/guides</code> pou
          tout itilizatè ki gen plan obligatwa a oswa pi wo.
        </p>
      </div>

      <GuideForm mode="create" categories={categories} action={createGuide} />
    </div>
  );
}
