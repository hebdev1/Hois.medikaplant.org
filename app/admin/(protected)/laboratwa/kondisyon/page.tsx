import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import { createServiceClient } from '@/lib/supabase/service';
import { hasCapability, type AdminRole } from '../../admin-nav-config';
import ConditionsAdmin, { type AdminCondition } from './conditions-admin';

export const metadata = { title: 'Admin · Maladi & Plant' };
export const dynamic = 'force-dynamic';

export default async function AdminConditionsPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  const { data: prof } = await supabase.from('profiles').select('admin_role').eq('id', user.id).maybeSingle();
  const role = (prof as { admin_role: AdminRole | null } | null)?.admin_role;
  if (!hasCapability(role, 'manage_guides')) redirect('/admin');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;
  const { data } = await db
    .from('lab_conditions')
    .select('id, slug, name_kr, intro_kr, red_flag_kr, doctor_limit_kr, doctor_attention_kr, display_order, status, plants')
    .order('display_order', { ascending: true });

  return <ConditionsAdmin initial={(data ?? []) as AdminCondition[]} />;
}
