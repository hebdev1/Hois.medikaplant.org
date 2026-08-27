import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasCapability, type AdminRole } from '../../admin-nav-config';
import AddMemberForm from './add-member-form';

export const metadata = { title: 'Admin · Ajoute yon manm' };
export const dynamic = 'force-dynamic';

export default async function NewMemberPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  // Same gate as the members list: any admin who can manage users can add one.
  const { data: viewerRaw } = await supabase
    .from('profiles')
    .select('admin_role')
    .eq('id', user.id)
    .maybeSingle();
  const adminRole = (viewerRaw as { admin_role: AdminRole | null } | null)
    ?.admin_role;
  if (!hasCapability(adminRole, 'manage_users')) {
    redirect('/admin');
  }

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[820px] mx-auto">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-earth-700 hover:text-forest-700 transition mb-4"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2.2} />
        Tounen nan lis manm yo
      </Link>

      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-semibold mb-3">
          <UserPlus className="w-3.5 h-3.5" strokeWidth={2.2} />
          Admin · Nouvo manm
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Ajoute yon <em className="text-forest-600 not-italic font-bold">manm</em>
        </h1>
        <p className="mt-2 text-sm text-earth-600 max-w-2xl">
          Kreye yon kont pou yon manm san peman, bay li yon plan pou kantite ane
          ou vle, epi voye yon imèl otomatik pou li chwazi modpas li epi konekte
          — menm jan ak yon manm ki peye nòmalman.
        </p>
      </header>

      <AddMemberForm />
    </div>
  );
}
