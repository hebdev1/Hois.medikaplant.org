import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { hasCapability, type AdminRole } from '../../admin-nav-config';
import CourseForm from '../course-form';

export const metadata = { title: 'Admin · Nouvo klas' };
export const dynamic = 'force-dynamic';

export default async function AdminNewCoursePage() {
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
  if (!hasCapability(adminRole, 'manage_courses')) {
    redirect('/admin');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data: catsRaw } = await sb
    .from('course_categories')
    .select('id, title')
    .order('display_order', { ascending: true });
  const categories = (catsRaw ?? []) as Array<{ id: string; title: string }>;

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1400px] mx-auto">
      <header className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">
          Nouvo klas
        </h1>
        <p className="text-sm text-earth-600 mt-1">
          Ranpli detay yo, chwazi fòma livrezon an, epi pibliye lè w prè.
        </p>
      </header>
      <CourseForm mode="create" categories={categories} />
    </div>
  );
}
