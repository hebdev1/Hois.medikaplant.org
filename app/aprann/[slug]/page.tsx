import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import {
  ArrowLeft,
  GraduationCap,
  Video,
  Calendar,
  Clock,
  PlayCircle,
  CheckCircle2,
  Award,
  Download,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import CourseVideoPlayer from '@/components/dashboard/course-video-player';
import LessonCompleteButton from './lesson-complete-button';
import LessonNotes from './lesson-notes';
import CourseQuestions from './course-questions';

export const dynamic = 'force-dynamic';

type ModuleRow = {
  id: string;
  display_order: number;
  title: string;
  description: string | null;
  duration_text: string | null;
  preview: boolean;
  resource_links: { label: string; url: string }[] | null;
};

export default async function AprannCoursePage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect(`/auth/login?redirect=/aprann/${params.slug}`);

  const { data: courseRaw } = await supabase
    .from('courses')
    .select(
      'id, slug, title, kind, format, zoom_url, zoom_schedule, instructor_name'
    )
    .eq('slug', params.slug)
    .maybeSingle();

  const course = courseRaw as {
    id: string;
    slug: string;
    title: string;
    kind: string;
    format: string;
    zoom_url: string | null;
    zoom_schedule: { text?: string } | null;
    instructor_name: string | null;
  } | null;
  if (!course) notFound();

  // Access gate: must be enrolled. Non-enrolled → the sales page.
  const { data: enrolled } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('course_id', course.id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!enrolled) redirect(`/klas/${params.slug}`);

  // Interactive courses render their whole experience (progress, quizzes) on
  // the public course page, which is open to enrolled buyers — send them there.
  if (course.kind === 'interactive') redirect(`/klas/${params.slug}`);

  const { data: modulesData } = await supabase
    .from('course_modules')
    .select(
      'id, display_order, title, description, duration_text, preview, resource_links'
    )
    .eq('course_id', course.id)
    .order('display_order', { ascending: true });
  const modules = (modulesData ?? []) as ModuleRow[];

  // Which lessons has the member marked complete? (Drives the progress bar +
  // certificate unlock — now works for video courses, not just interactive.)
  // course_module_progress isn't in the generated types — cast the client.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: progressData } = await (supabase as any)
    .from('course_module_progress')
    .select('module_id')
    .eq('user_id', user.id)
    .eq('course_id', course.id);
  const doneIds = new Set(
    ((progressData ?? []) as Array<{ module_id: string }>).map(
      (r) => r.module_id
    )
  );
  const total = modules.length;
  const doneCount = modules.filter((m) => doneIds.has(m.id)).length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const allDone = total > 0 && doneCount >= total;
  // First not-yet-done lesson — highlighted so the member knows where to resume.
  const nextModuleId = modules.find((m) => !doneIds.has(m.id))?.id ?? null;

  // Personal notes per lesson (module_id → body).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: notesData } = await (supabase as any)
    .from('lesson_notes')
    .select('module_id, body')
    .eq('user_id', user.id);
  const noteByModule = new Map<string, string>(
    ((notesData ?? []) as Array<{ module_id: string; body: string }>).map(
      (n) => [n.module_id, n.body]
    )
  );

  // This member's questions for the course (with any answers).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: questionsData } = await (supabase as any)
    .from('course_questions')
    .select('id, body, answer, created_at')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .order('created_at', { ascending: false });
  const questions = (questionsData ?? []) as Array<{
    id: string;
    body: string;
    answer: string | null;
    created_at: string;
  }>;

  const isLive = course.format !== 'video';

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[900px] mx-auto grid gap-5">
      <Link
        href="/aprann"
        className="inline-flex items-center gap-1.5 text-sm text-earth-600 hover:text-forest-700 transition"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2.2} />
        Kou mwen yo
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

      {total > 0 && (
        <div className="rounded-2xl bg-white border border-cream-200 p-4 md:p-5 shadow-card">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-semibold text-ink">Pwogrè w</span>
            <span className="text-earth-600">
              {doneCount} / {total} leson · {pct}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-cream-200 overflow-hidden">
            <div
              className="h-full bg-forest-600 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          {allDone && (
            <Link
              href={`/setifika/${course.slug}`}
              className="mt-4 inline-flex items-center gap-2 bg-gold-400 hover:bg-gold-500 text-forest-900 px-5 py-2.5 rounded-full text-sm font-semibold transition"
            >
              <Award className="w-4 h-4" strokeWidth={2.4} />
              Gade sètifika w
            </Link>
          )}
        </div>
      )}

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
          modules.map((m, i) => {
            const done = doneIds.has(m.id);
            const isNext = m.id === nextModuleId;
            return (
              <article
                key={m.id}
                className={`bg-white border rounded-2xl p-4 md:p-5 shadow-card ${
                  isNext
                    ? 'border-forest-300 ring-1 ring-forest-200'
                    : 'border-cream-200'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span
                    className={`grid place-items-center w-7 h-7 rounded-lg text-xs font-bold shrink-0 ${
                      done
                        ? 'bg-forest-600 text-cream-50'
                        : 'bg-forest-100 text-forest-700'
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="w-4 h-4" strokeWidth={2.6} />
                    ) : (
                      i + 1
                    )}
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
                  {isNext && !done ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-forest-600 text-cream-50 shrink-0">
                      Kòmanse la
                    </span>
                  ) : m.preview ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-forest-100 text-forest-700 shrink-0">
                      <PlayCircle className="w-2.5 h-2.5" strokeWidth={2.4} />
                      Preview
                    </span>
                  ) : null}
                </div>
                <CourseVideoPlayer moduleId={m.id} />

                {Array.isArray(m.resource_links) &&
                  m.resource_links.length > 0 && (
                    <div className="mt-3 rounded-xl bg-cream-50 border border-cream-200 p-3">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-earth-500 mb-2">
                        Materyèl
                      </div>
                      <ul className="space-y-1.5">
                        {m.resource_links.map((r, ri) => (
                          <li key={ri}>
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm font-medium text-forest-700 hover:underline"
                            >
                              <Download
                                className="w-4 h-4 shrink-0"
                                strokeWidth={2.2}
                              />
                              {r.label || 'Telechaje'}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                <LessonCompleteButton
                  courseId={course.id}
                  moduleId={m.id}
                  initialDone={done}
                />
                <LessonNotes
                  moduleId={m.id}
                  initialBody={noteByModule.get(m.id) ?? ''}
                />
              </article>
            );
          })
        )}
      </section>

      <CourseQuestions courseId={course.id} initial={questions} />
    </div>
  );
}
