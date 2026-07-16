import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import {
  ArrowLeft,
  GraduationCap,
  Video,
  Calendar,
  Clock,
  PlayCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import Topbar from '@/components/dashboard/topbar';
import CourseVideoPlayer from '@/components/dashboard/course-video-player';

export const dynamic = 'force-dynamic';

const PLAN_LABEL: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

type ModuleRow = {
  id: string;
  display_order: number;
  title: string;
  description: string | null;
  duration_text: string | null;
  preview: boolean;
};

export default async function CoursePlayerPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect(`/auth/login?redirect=/dashboard/klas/${params.slug}`);

  const { data: courseRaw } = await supabase
    .from('courses')
    .select('id, slug, title, format, zoom_url, zoom_schedule, instructor_name')
    .eq('slug', params.slug)
    .maybeSingle();

  const course = courseRaw as {
    id: string;
    slug: string;
    title: string;
    format: string;
    zoom_url: string | null;
    zoom_schedule: { text?: string } | null;
    instructor_name: string | null;
  } | null;
  if (!course) notFound();

  // Access gate: must be enrolled. Non-enrolled → send to the sales page.
  const { data: enrolled } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('course_id', course.id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!enrolled) redirect(`/klas/${params.slug}`);

  // Metadata only — the player fetches the actual source through the gated
  // getModulePlayback action (column hygiene: no video source here).
  const [profileResult, modulesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('plan, full_name, email, avatar_url')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('course_modules')
      .select('id, display_order, title, description, duration_text, preview')
      .eq('course_id', course.id)
      .order('display_order', { ascending: true }),
  ]);

  const profile = profileResult.data as {
    plan: 'basic' | 'premium' | 'vip';
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
  const modules = (modulesResult.data ?? []) as ModuleRow[];

  const userName = profile?.full_name || profile?.email.split('@')[0] || 'Manm';
  const shortName = userName.split(' ')[0];
  const isLive = course.format !== 'video';

  return (
    <>
      <Topbar
        userName={shortName}
        userCondition={`${PLAN_LABEL[profile?.plan ?? 'basic']} · Klas`}
        userId={user.id}
        userPlan={profile?.plan ?? 'basic'}
        avatarUrl={profile?.avatar_url ?? null}
      />

      <div className="p-5 md:p-8 lg:p-10 max-w-[900px] mx-auto grid gap-5">
        <Link
          href="/dashboard/klas"
          className="inline-flex items-center gap-1.5 text-sm text-earth-600 hover:text-forest-700 transition"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.2} />
          Klas mwen yo
        </Link>

        <header>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-ink">
            {course.title}
          </h1>
          {course.instructor_name && (
            <p className="mt-1 text-sm text-earth-600">
              Avèk {course.instructor_name}
            </p>
          )}
        </header>

        {/* Live Zoom session (course-level in Phase 1) */}
        {isLive && (
          <div className="rounded-2xl bg-forest-800 text-cream-50 p-5 md:p-6">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gold-300 mb-2">
              <Video className="w-3.5 h-3.5" strokeWidth={2.4} />
              Sesyon an dirèk
            </div>
            {course.zoom_schedule?.text && (
              <p className="text-sm text-cream-200 flex items-center gap-1.5 mb-3">
                <Calendar className="w-3.5 h-3.5" strokeWidth={2.2} />
                {course.zoom_schedule.text}
              </p>
            )}
            {course.zoom_url ? (
              <a
                href={course.zoom_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gold-400 hover:bg-gold-300 text-forest-900 font-semibold px-5 py-2.5 rounded-full transition"
              >
                <Video className="w-4 h-4" strokeWidth={2.4} />
                Antre nan Zoom
              </a>
            ) : (
              <p className="text-sm text-cream-200/80">
                Lyen Zoom la ap disponib anvan sesyon an.
              </p>
            )}
          </div>
        )}

        {/* Modules / lessons */}
        <section className="grid gap-3">
          <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-forest-700" strokeWidth={2.2} />
            {isLive ? 'Materyèl ak replay' : 'Leson yo'}
            <span className="text-sm font-normal text-earth-500">
              ({modules.length})
            </span>
          </h2>

          {modules.length === 0 ? (
            <p className="text-sm text-earth-600 rounded-xl bg-cream-50 border border-dashed border-cream-200 p-6 text-center">
              Kontni an ap vin disponib byento.
            </p>
          ) : (
            modules.map((m, i) => (
              <article
                key={m.id}
                className="bg-white border border-cream-200 rounded-2xl p-4 md:p-5 shadow-card"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="grid place-items-center w-7 h-7 rounded-lg bg-forest-100 text-forest-700 text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-ink leading-snug">
                      {m.title}
                    </h3>
                    {m.description && (
                      <p className="text-sm text-earth-600 mt-0.5 leading-snug">
                        {m.description}
                      </p>
                    )}
                    {m.duration_text && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-earth-500 mt-1">
                        <Clock className="w-3 h-3" strokeWidth={2.4} />
                        {m.duration_text}
                      </span>
                    )}
                  </div>
                  {m.preview && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-forest-100 text-forest-700 shrink-0">
                      <PlayCircle className="w-2.5 h-2.5" strokeWidth={2.4} />
                      Preview
                    </span>
                  )}
                </div>
                <CourseVideoPlayer moduleId={m.id} />
              </article>
            ))
          )}
        </section>
      </div>
    </>
  );
}
