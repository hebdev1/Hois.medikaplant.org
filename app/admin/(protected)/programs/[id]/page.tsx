import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { hasCapability, type AdminRole } from '../../admin-nav-config';
import ProgramForm from '../program-form';
import type { Database } from '@/types/database';

type ProgramRow = Database['public']['Tables']['programs']['Row'];

export const metadata = { title: 'Admin · Edite pwogram' };
export const dynamic = 'force-dynamic';

export default async function AdminEditProgramPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { created?: string };
}) {
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

  const { data: programRaw } = await supabase
    .from('programs')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();
  const program = programRaw as ProgramRow | null;
  if (!program) notFound();

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1400px] mx-auto">
      <header className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">
          {program.name}
        </h1>
        <p className="text-sm text-earth-600 mt-1">
          Modifye detay pwogram lan. Tach jou pa jou yo edite nan kalandriye a
          (bouton adwat la).
        </p>
        {searchParams.created === '1' && (
          <div className="mt-3 rounded-xl bg-forest-50 border border-forest-200 px-3 py-2 text-sm text-forest-800">
            ✓ Pwogram lan kreye avèk siksè.
          </div>
        )}
      </header>
      <ProgramForm mode="edit" initial={program} />
    </div>
  );
}
