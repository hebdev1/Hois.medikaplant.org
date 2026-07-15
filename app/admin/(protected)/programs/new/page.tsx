import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { hasCapability, type AdminRole } from '../../admin-nav-config';
import ProgramForm from '../program-form';

export const metadata = { title: 'Admin · Nouvo pwotokòl' };
export const dynamic = 'force-dynamic';

export default async function AdminNewProgramPage() {
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
  if (!hasCapability(adminRole, 'manage_programs')) {
    redirect('/admin');
  }

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1400px] mx-auto">
      <header className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">
          Nouvo pwotokòl
        </h1>
        <p className="text-sm text-earth-600 mt-1">
          Ranpli detay pwotokòl la. Yon fwa kreye, ou pral ka pwograme tach
          yo jou pa jou nan kalandriye a.
        </p>
      </header>
      <ProgramForm mode="create" />
    </div>
  );
}
