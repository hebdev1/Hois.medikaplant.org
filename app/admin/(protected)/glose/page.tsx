import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import { createServiceClient } from '@/lib/supabase/service';
import { hasCapability, type AdminRole } from '../admin-nav-config';
import GloseAdmin, { type AdminTerm } from './glose-admin';

export const metadata = { title: 'Admin · Glosè plant' };
export const dynamic = 'force-dynamic';

export default async function AdminGlosePage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  const { data: prof } = await supabase
    .from('profiles')
    .select('admin_role')
    .eq('id', user.id)
    .maybeSingle();
  const role = (prof as { admin_role: AdminRole | null } | null)?.admin_role;
  if (!hasCapability(role, 'manage_guides')) redirect('/admin');

  // Service role: the admin sees every term, including inactive ones.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;
  const { data } = await db
    .from('glossary_terms')
    .select(
      'id, code, letter, name, variants, family, scientific_name, tramil, status, note, active, display_order'
    )
    .order('letter', { ascending: true })
    .order('name', { ascending: true });

  const terms = (data ?? []) as AdminTerm[];
  return <GloseAdmin initial={terms} />;
}
