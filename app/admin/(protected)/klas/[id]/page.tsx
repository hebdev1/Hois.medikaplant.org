import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { hasCapability, type AdminRole } from '../../admin-nav-config';
import CourseForm from '../course-form';
import ModulesManager from '../modules-manager';

export const metadata = { title: 'Admin · Edite klas' };
export const dynamic = 'force-dynamic';

export default async function AdminEditCoursePage({
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
  if (!hasCapability(adminRole, 'manage_courses')) {
    redirect('/admin');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const [courseRes, catsRes, modulesRes] = await Promise.all([
    sb.from('courses').select('*').eq('id', params.id).maybeSingle(),
    sb
      .from('course_categories')
      .select('id, title')
      .order('display_order', { ascending: true }),
    sb
      .from('course_modules')
      .select('*')
      .eq('course_id', params.id)
      .order('display_order', { ascending: true }),
  ]);
  const course = courseRes.data;
  if (!course) notFound();

  const categories = (catsRes.data ?? []) as Array<{
    id: string;
    title: string;
  }>;
  const modules = (modulesRes.data ?? []) as Array<{
    id: string;
    course_id: string;
    display_order: number;
    title: string;
    description: string | null;
    duration_text: string | null;
    video_url: string | null;
    resource_links: Array<{ label: string; url: string }> | null;
    preview: boolean;
  }>;

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1400px] mx-auto">
      <header className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">
          {course.title}
        </h1>
        <p className="text-sm text-earth-600 mt-1">
          Edite tout detay yo. Chanjman yo aplike imedyatman sou /klas la.
        </p>
        {searchParams.created === '1' && (
          <div className="mt-3 rounded-xl bg-forest-50 border border-forest-200 px-3 py-2 text-sm text-forest-800">
            ✓ Klas la kreye avèk siksè.
          </div>
        )}
      </header>
      <CourseForm mode="edit" initial={course} categories={categories} />
      <div className="mt-6">
        <ModulesManager courseId={params.id} initial={modules} />
      </div>
    </div>
  );
}
