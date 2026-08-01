import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Award, ArrowRight, GraduationCap, Inbox } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';

export const metadata = { title: 'Sètifika mwen yo · Hoïs' };
export const dynamic = 'force-dynamic';

const MONTHS_HT = [
  'Janvye', 'Fevriye', 'Mas', 'Avril', 'Me', 'Jen',
  'Jiyè', 'Out', 'Septanm', 'Oktòb', 'Novanm', 'Desanm',
];
function dateHT(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_HT[d.getMonth()]} ${d.getFullYear()}`;
}

type CourseJoin = {
  id: string;
  slug: string;
  title: string;
  cover_image_url: string | null;
  instructor_name: string | null;
};

// "Sètifika mwen yo" — an at-a-glance index of every course the student has
// finished (all modules complete). Each links to the printable certificate at
// /setifika/[slug]. Mirrors the completion math the dashboard + certificate
// page already use, so a course only shows here once it's genuinely earned.
export default async function MyCertificatesPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login?redirect=/aprann/setifika');

  const [enrollRes, progressRes] = await Promise.all([
    supabase
      .from('course_enrollments')
      .select(
        'enrolled_at, courses(id, slug, title, cover_image_url, instructor_name)'
      )
      .eq('user_id', user.id)
      .order('enrolled_at', { ascending: false }),
    // course_module_progress isn't in the generated types yet — cast the client.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('course_module_progress')
      .select('course_id, module_id, completed_at')
      .eq('user_id', user.id),
  ]);

  // Dedupe enrolled courses (one row per course).
  const enrollRows = (enrollRes.data ?? []) as unknown as Array<{
    enrolled_at: string;
    courses: CourseJoin | null;
  }>;
  const seen = new Set<string>();
  const enrolled: CourseJoin[] = [];
  for (const r of enrollRows) {
    if (r.courses && !seen.has(r.courses.id)) {
      seen.add(r.courses.id);
      enrolled.push(r.courses);
    }
  }
  const courseIds = enrolled.map((c) => c.id);

  // Completed modules per course + the date the last one was finished.
  const doneByCourse = new Map<string, Set<string>>();
  const earnedAtByCourse = new Map<string, string>();
  for (const p of (progressRes.data ?? []) as Array<{
    course_id: string;
    module_id: string;
    completed_at: string | null;
  }>) {
    const set = doneByCourse.get(p.course_id) ?? new Set<string>();
    set.add(p.module_id);
    doneByCourse.set(p.course_id, set);
    if (p.completed_at) {
      const prev = earnedAtByCourse.get(p.course_id);
      if (!prev || p.completed_at > prev) {
        earnedAtByCourse.set(p.course_id, p.completed_at);
      }
    }
  }

  // Total modules per course.
  const totalByCourse = new Map<string, number>();
  if (courseIds.length > 0) {
    const { data: mods } = await supabase
      .from('course_modules')
      .select('id, course_id')
      .in('course_id', courseIds);
    for (const m of (mods ?? []) as Array<{ id: string; course_id: string }>) {
      totalByCourse.set(m.course_id, (totalByCourse.get(m.course_id) ?? 0) + 1);
    }
  }

  const completed = enrolled.filter((c) => {
    const total = totalByCourse.get(c.id) ?? 0;
    const done = doneByCourse.get(c.id)?.size ?? 0;
    return total > 0 && done >= total;
  });

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1100px] mx-auto">
      <header className="mb-7">
        <span className="text-[11px] uppercase tracking-[0.16em] text-earth-500 font-semibold">
          Espas Elèv
        </span>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink tracking-tight flex items-center gap-2.5">
          <Award className="w-7 h-7 text-gold-500" strokeWidth={2} />
          Sètifika mwen yo
        </h1>
        <p className="mt-1.5 text-sm text-earth-600">
          Chak kou ou konplete nèt ap ba w yon sètifika ou ka telechaje oswa
          enprime.
        </p>
      </header>

      {completed.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cream-300 bg-white px-5 py-14 text-center">
          <Inbox className="w-10 h-10 mx-auto text-earth-400 mb-3" strokeWidth={1.6} />
          <p className="text-sm text-earth-600 max-w-sm mx-auto">
            Ou poko fini okenn kou nèt. Lè w konplete tout modil yon kou, sètifika
            w ap parèt isit la.
          </p>
          <Link
            href="/aprann"
            className="mt-4 inline-flex items-center gap-1.5 bg-forest-700 hover:bg-forest-800 text-cream-50 px-5 py-2.5 rounded-full text-sm font-semibold transition"
          >
            Kontinye aprann <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {completed.map((c) => {
            const earned = dateHT(earnedAtByCourse.get(c.id) ?? null);
            return (
              <Link
                key={c.id}
                href={`/setifika/${c.slug}`}
                className="group bg-white border border-cream-200 rounded-2xl p-4 hover:border-gold-300 hover:shadow-card transition flex items-center gap-4"
              >
                <div className="relative w-16 aspect-square rounded-xl overflow-hidden bg-gold-50 shrink-0 grid place-items-center">
                  {c.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.cover_image_url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <Award className="w-7 h-7 text-gold-500" strokeWidth={1.8} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-gold-700 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" strokeWidth={2.4} />
                    Sètifika akonplisman
                  </div>
                  <h3 className="font-display font-bold text-ink leading-snug line-clamp-2 mt-0.5 group-hover:text-forest-700 transition">
                    {c.title}
                  </h3>
                  {earned && (
                    <p className="text-xs text-earth-500 mt-0.5">Fini {earned}</p>
                  )}
                </div>
                <ArrowRight
                  className="w-4 h-4 text-earth-400 shrink-0 group-hover:translate-x-0.5 transition-transform"
                  strokeWidth={2.2}
                />
              </Link>
            );
          })}
        </div>
      )}

      {/* Courses still in progress — a gentle nudge toward the next certificate. */}
      {completed.length > 0 &&
        enrolled.length > completed.length && (
          <p className="mt-6 text-xs text-earth-500 inline-flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-forest-600" strokeWidth={2} />
            Kontinye kou ou yo pou w touche plis sètifika.
          </p>
        )}
    </div>
  );
}
