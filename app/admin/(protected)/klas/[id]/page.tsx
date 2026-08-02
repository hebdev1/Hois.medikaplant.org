import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { hasCapability, type AdminRole } from '../../admin-nav-config';
import CourseForm from '../course-form';
import ModulesManager from '../modules-manager';
import SessionsManager from './sessions-manager';

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

  // Live courses get a Zoom "sessions" manager. Sessions are read with the
  // service role (admins aren't enrolled, and zoom_start_url is column-withheld
  // from client roles).
  const isLiveCourse =
    course.format === 'live_zoom' || course.format === 'hybrid';
  let liveSessions: Array<{
    id: string;
    title: string;
    session_type: 'recurring' | 'single';
    starts_at: string;
    duration_minutes: number;
    schedule_text: string | null;
    status: string;
    zoom_start_url: string | null;
    registrants: Array<{ name: string; attended: boolean; minutes: number | null }>;
  }> = [];
  if (isLiveCourse) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svcAny = createServiceClient() as any;
    const { data: sess } = await svcAny
      .from('course_sessions')
      .select(
        'id, title, session_type, starts_at, duration_minutes, schedule_text, status, zoom_start_url'
      )
      .eq('course_id', params.id)
      .order('starts_at', { ascending: true });
    const sessions = (sess ?? []) as Array<Record<string, unknown> & { id: string }>;
    const rosterBySession = new Map<
      string,
      Array<{ name: string; attended: boolean; minutes: number | null }>
    >();
    if (sessions.length > 0) {
      const { data: regs } = await svcAny
        .from('course_session_registrants')
        .select('session_id, user_id, attended, attended_minutes')
        .in(
          'session_id',
          sessions.map((s) => s.id)
        );
      const regRows = (regs ?? []) as Array<{
        session_id: string;
        user_id: string;
        attended: boolean;
        attended_minutes: number | null;
      }>;
      const uids = [...new Set(regRows.map((r) => r.user_id))];
      const nameByUid = new Map<string, string>();
      if (uids.length > 0) {
        const { data: profs } = await svcAny
          .from('profiles')
          .select('id, full_name, email')
          .in('id', uids);
        for (const p of (profs ?? []) as Array<{
          id: string;
          full_name: string | null;
          email: string | null;
        }>) {
          nameByUid.set(p.id, p.full_name || p.email || 'Elèv');
        }
      }
      for (const r of regRows) {
        const list = rosterBySession.get(r.session_id) ?? [];
        list.push({
          name: nameByUid.get(r.user_id) ?? 'Elèv',
          attended: r.attended,
          minutes: r.attended_minutes,
        });
        rosterBySession.set(r.session_id, list);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    liveSessions = sessions.map((s: any) => ({
      id: s.id,
      title: s.title,
      session_type: s.session_type,
      starts_at: s.starts_at,
      duration_minutes: s.duration_minutes,
      schedule_text: s.schedule_text,
      status: s.status,
      zoom_start_url: s.zoom_start_url,
      registrants: rosterBySession.get(s.id) ?? [],
    }));
  }

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
    video_source: 'external' | 'storage';
    video_url: string | null;
    video_path: string | null;
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
      {isLiveCourse && (
        <div className="mt-6">
          <SessionsManager courseId={params.id} initial={liveSessions} />
        </div>
      )}
    </div>
  );
}
