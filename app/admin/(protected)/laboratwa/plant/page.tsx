import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import { createServiceClient } from '@/lib/supabase/service';
import { hasCapability, type AdminRole } from '../../admin-nav-config';
import PlantsAdmin, { type AdminPlant } from './plants-admin';

export const metadata = { title: 'Admin · Plant Laboratwa' };
export const dynamic = 'force-dynamic';

export default async function AdminPlantsPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  const { data: prof } = await supabase.from('profiles').select('admin_role').eq('id', user.id).maybeSingle();
  const role = (prof as { admin_role: AdminRole | null } | null)?.admin_role;
  if (!hasCapability(role, 'manage_guides')) redirect('/admin');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;
  const { data } = await db
    .from('plants')
    .select('id, slug, name_kr, name_fr, name_en, name_sci, family, parts_used, preparations, season_months, regions, summary_kr, support_kr, cautions_kr, status')
    .order('name_kr', { ascending: true });

  return (
    <div>
      <div className="px-5 md:px-8 lg:px-10 pt-5 md:pt-8 lg:pt-8 max-w-[1100px] mx-auto">
        <Link href="/admin/laboratwa" className="inline-flex items-center gap-1.5 text-sm font-semibold text-earth-600 hover:text-forest-700">
          <ArrowLeft className="w-4 h-4" strokeWidth={2.2} /> Laboratwa
        </Link>
      </div>
      <PlantsAdmin initial={(data ?? []) as AdminPlant[]} />
    </div>
  );
}
