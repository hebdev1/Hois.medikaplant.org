import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import { createServiceClient } from '@/lib/supabase/service';
import { hasCapability, type AdminRole } from '../../admin-nav-config';
import LabContributionsReview, { type LabContribution } from './review';

export const metadata = { title: 'Admin · Kontribisyon Laboratwa' };
export const dynamic = 'force-dynamic';

export default async function AdminLabContributionsPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  const { data: prof } = await supabase.from('profiles').select('admin_role').eq('id', user.id).maybeSingle();
  const role = (prof as { admin_role: AdminRole | null } | null)?.admin_role;
  if (!hasCapability(role, 'manage_guides')) redirect('/admin');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;
  const { data } = await db
    .from('contributions')
    .select('id, plant_id, local_name, region, body, photo_path, status, created_at, plant:plants(name_kr, slug)')
    .order('created_at', { ascending: false })
    .limit(300);

  return <LabContributionsReview initial={(data ?? []) as LabContribution[]} />;
}
