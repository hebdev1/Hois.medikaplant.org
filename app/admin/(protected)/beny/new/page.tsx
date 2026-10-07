import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import { hasCapability, type AdminRole } from '../../admin-nav-config';
import BenyForm from '../beny-form';

export const metadata = { title: 'Admin · Nouvo beny' };
export const dynamic = 'force-dynamic';

export default async function NewBenyPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  const { data: profile } = await supabase.from('profiles').select('role, admin_role').eq('id', user.id).maybeSingle();
  const me = profile as { role?: string; admin_role?: AdminRole | null } | null;
  if (me?.role !== 'admin' || !hasCapability(me.admin_role ?? null, 'manage_guides')) redirect('/admin');

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1280px] mx-auto">
      <Link href="/admin/beny" className="inline-flex items-center gap-1.5 text-sm text-earth-600 hover:text-forest-700 mb-4">
        <ArrowLeft className="w-4 h-4" strokeWidth={2.2} /> Beny Spirityèl
      </Link>
      <h1 className="font-display text-2xl font-bold text-ink mb-6">Nouvo beny</h1>
      <BenyForm mode="create" />
    </div>
  );
}
