import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import InviteAdminForm from './invite-admin-form';

export const metadata = { title: 'Admin · Ajoute nouvo admin' };
export const dynamic = 'force-dynamic';

export default async function NewAdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  // Super-admin gate: page-level so /admin/users/new is a hard 404 for
  // anyone else, even if they typed the URL directly.
  const { data: viewerRaw } = await supabase
    .from('profiles')
    .select('admin_role')
    .eq('id', user.id)
    .maybeSingle();
  const isSuperAdmin =
    (viewerRaw as { admin_role: string | null } | null)?.admin_role ===
    'super_admin';
  if (!isSuperAdmin) {
    redirect('/admin/users?error=not_super_admin');
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
          <UserPlus className="w-3.5 h-3.5" strokeWidth={2.2} />
          Admin · Nouvo admin
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Envite yon nouvo <em className="text-forest-600 not-italic font-bold">admin</em>
        </h1>
        <p className="mt-2 text-sm text-earth-600 max-w-2xl">
          Ranpli fòm sa pou jenere yon lyen envitasyon. Pataje lyen an ak moun
          nan (WhatsApp, imèl, eks.). Lè li klike sou li epi li enskri ak
          modpas li, li ap otomatikman gen wòl admin ou chwazi a.
        </p>
      </header>

      <InviteAdminForm />
    </div>
  );
}
