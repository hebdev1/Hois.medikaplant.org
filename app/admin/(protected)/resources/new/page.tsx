import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Library } from 'lucide-react';
import ResourceForm from '../resource-form';
import { createClient } from '@/lib/supabase/server';
import { hasCapability, type AdminRole } from '../../admin-nav-config';

export const metadata = { title: 'Admin · Nouvo resous' };
export const dynamic = 'force-dynamic';

export default async function NewResourcePage() {
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
  if (!hasCapability(adminRole, 'manage_resources')) {
    redirect('/admin');
  }

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[860px] mx-auto">
      <Link
        href="/admin/resources"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-earth-700 hover:text-forest-700 transition mb-4"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2.2} />
        Tounen nan resous yo
      </Link>

      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
          <Library className="w-3.5 h-3.5" strokeWidth={2.2} />
          Nouvo resous
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Ajoute yon dosye
        </h1>
        <p className="mt-2 text-sm text-earth-600">
          Yon fwa li pibliye, dosye a parèt sou paj{' '}
          <code className="text-xs bg-cream-100 px-1.5 py-0.5 rounded">
            /dashboard/resources
          </code>{' '}
          pou tout manm ki gen plan ki kòrèk la.
        </p>
      </header>

      <section className="bg-white border border-cream-200 rounded-2xl shadow-card p-5 md:p-8">
        <ResourceForm mode="create" />
      </section>
    </div>
  );
}
