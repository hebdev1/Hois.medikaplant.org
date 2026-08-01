import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  GraduationCap,
  PlayCircle,
  ArrowRight,
  Inbox,
  Sparkles,
  BookOpen,
  Award,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import PurchaseProcessing from './purchase-processing';

export const dynamic = 'force-dynamic';

type CourseJoin = {
  id: string;
  slug: string;
  title: string;
  cover_image_url: string | null;
  format: string;
  instructor_name: string | null;
  kind: string;
};

type CourseCard = CourseJoin & {
  total: number;
  done: number;
  pct: number;
  nextTitle: string | null;
};

function pctOf(done: number, total: number) {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

export default async function AprannPage({
  searchParams,
}: {
  searchParams: { achte?: string; t?: string };
}) {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login?redirect=/aprann');

  const [profileRes, enrollRes, progressRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email, avatar_url')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('course_enrollments')
      .select(
        'enrolled_at, courses(id, slug, title, cover_image_url, format, instructor_name, kind)'
      )
      .eq('user_id', user.id)
      .order('enrolled_at', { ascending: false }),
    // course_module_progress isn't in the generated types yet — cast the client.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('course_module_progress')
      .select('course_id, module_id')
      .eq('user_id', user.id),
  ]);

  const profile = profileRes.data as {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
  const firstName = (profile?.full_name || profile?.email?.split('@')[0] || 'Elèv')
    .split(' ')[0];

  // Dedupe enrolled courses (one row per course, most recent first).
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

  // Portal is for course buyers only. Nobody enrolled = not a student: send
  // them to the catalogue — unless they just paid (?achte=1), in which case
  // wait out the brief window before the Stripe webhook records the enrolment.
  if (enrolled.length === 0) {
    if (searchParams?.achte) {
      return <PurchaseProcessing attempt={Number(searchParams.t ?? 0)} />;
    }
    redirect('/klas');
  }

  // Total modules + which modules this member finished, per course.
  const doneByCourse = new Map<string, Set<string>>();
  for (const p of (progressRes.data ?? []) as Array<{
    course_id: string;
    module_id: string;
  }>) {
    const set = doneByCourse.get(p.course_id) ?? new Set<string>();
    set.add(p.module_id);
    doneByCourse.set(p.course_id, set);
  }

  const modulesByCourse = new Map<
    string,
    Array<{ id: string; title: string }>
  >();
  if (courseIds.length > 0) {
    const { data: mods } = await supabase
      .from('course_modules')
      .select('id, course_id, title, display_order')
      .in('course_id', courseIds)
      .order('display_order', { ascending: true });
    for (const m of (mods ?? []) as Array<{
      id: string;
      course_id: string;
      title: string;
    }>) {
      const list = modulesByCourse.get(m.course_id) ?? [];
      list.push({ id: m.id, title: m.title });
      modulesByCourse.set(m.course_id, list);
    }
  }

  const cards: CourseCard[] = enrolled.map((c) => {
    const mods = modulesByCourse.get(c.id) ?? [];
    const done = doneByCourse.get(c.id) ?? new Set<string>();
    const next = mods.find((m) => !done.has(m.id)) ?? null;
    return {
      ...c,
      total: mods.length,
      done: done.size,
      pct: pctOf(done.size, mods.length),
      nextTitle: next?.title ?? null,
    };
  });

  // Resume = an in-progress course first, else the most recent enrolment.
  const resume =
    cards.find((c) => c.pct > 0 && c.pct < 100) ?? cards[0] ?? null;

  // Discover: active courses the member hasn't bought yet.
  const { data: discoverRaw } = await supabase
    .from('courses')
    .select('slug, title, cover_image_url, instructor_name, price_cents')
    .eq('active', true)
    .order('featured', { ascending: false })
    .limit(8);
  const discover = ((discoverRaw ?? []) as Array<{
    slug: string;
    title: string;
    cover_image_url: string | null;
    instructor_name: string | null;
    price_cents: number | null;
  }>)
    .filter((d) => !enrolled.some((e) => e.slug === d.slug))
    .slice(0, 3);

  const hrefFor = (c: { slug: string; kind?: string }) =>
    c.kind === 'interactive' ? `/klas/${c.slug}` : `/aprann/${c.slug}`;

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1100px] mx-auto">
      {/* Greeting */}
      <header className="flex items-center justify-between gap-4 mb-7">
        <div>
          <span className="text-[11px] uppercase tracking-[0.16em] text-earth-500 font-semibold">
            Tablodebò
          </span>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink tracking-tight">
            Bonjou, {firstName}
          </h1>
        </div>
        <span className="grid place-items-center w-11 h-11 rounded-full bg-brand-100 text-forest-700 font-display font-bold shrink-0 overflow-hidden">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            firstName.charAt(0).toUpperCase()
          )}
        </span>
      </header>

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cream-300 bg-white px-5 py-14 text-center">
          <Inbox
            className="w-10 h-10 mx-auto text-earth-400 mb-3"
            strokeWidth={1.6}
          />
          <p className="text-sm text-earth-600">Ou poko achte okenn kou.</p>
          <Link
            href="/klas"
            className="mt-3 inline-flex items-center gap-1.5 bg-forest-700 hover:bg-forest-800 text-cream-50 px-5 py-2.5 rounded-full text-sm font-semibold"
          >
            Gade katalòg la <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
          </Link>
        </div>
      ) : (
        <>
          {/* Continue-learning hero */}
          {resume && (
            <section className="rounded-3xl bg-forest-900 text-cream-50 p-6 md:p-8 relative overflow-hidden mb-8">
              <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-brand-500/15" />
              <div className="relative">
                <span className="text-[11px] uppercase tracking-[0.16em] text-gold-300 font-semibold">
                  Kontinye aprann
                </span>
                <h2 className="font-display text-2xl md:text-3xl font-bold mt-2 leading-tight">
                  {resume.title}
                </h2>
                {resume.nextTitle && (
                  <p className="mt-1.5 text-cream-200/90">
                    Pwochen: {resume.nextTitle}
                  </p>
                )}
                <div className="mt-5 max-w-md">
                  <div className="h-2 rounded-full bg-cream-50/15 overflow-hidden">
                    <div
                      className="h-full bg-gold-400 transition-all"
                      style={{ width: `${resume.pct}%` }}
                    />
                  </div>
                  <div className="mt-1.5 text-sm text-cream-200/90">
                    {resume.done} / {resume.total} modil fini · {resume.pct}%
                  </div>
                </div>
                <Link
                  href={hrefFor(resume)}
                  className="mt-6 inline-flex items-center gap-2 bg-gold-400 hover:bg-gold-500 text-forest-900 px-6 py-3 rounded-full font-semibold transition"
                >
                  <PlayCircle className="w-4 h-4" strokeWidth={2.4} />
                  {resume.pct > 0 ? 'Kontinye' : 'Kòmanse'}
                </Link>
              </div>
            </section>
          )}

          {/* My classes */}
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-xl md:text-2xl font-bold text-ink flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-forest-700" strokeWidth={2.2} />
              Klas mwen yo
            </h2>
            <span className="text-sm text-earth-600">
              {cards.length} kou
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {cards.map((c) => (
              <Link
                key={c.id}
                href={hrefFor(c)}
                className="group bg-white border border-cream-200 rounded-2xl p-4 hover:border-forest-300 hover:shadow-card transition flex flex-col"
              >
                <div className="flex items-start gap-3">
                  <div className="relative w-16 aspect-square rounded-xl overflow-hidden bg-cream-100 shrink-0">
                    {c.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.cover_image_url}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="grid place-items-center w-full h-full text-earth-400">
                        <GraduationCap className="w-6 h-6" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-bold text-ink leading-snug group-hover:text-forest-700 transition line-clamp-2">
                      {c.title}
                    </h3>
                    {c.instructor_name && (
                      <p className="text-xs text-earth-600 mt-0.5">
                        Avèk {c.instructor_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-cream-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-forest-700">
                      {c.pct}%
                    </span>
                    <span className="text-earth-500">
                      {c.total > 0 ? `${c.done} / ${c.total} modil` : 'Byento'}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-cream-200 overflow-hidden">
                    <div
                      className="h-full bg-forest-600 transition-all"
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-forest-700">
                    <PlayCircle className="w-3.5 h-3.5" strokeWidth={2.2} />
                    {c.pct >= 100
                      ? 'Fini ✓'
                      : c.nextTitle
                        ? c.nextTitle
                        : 'Kontinye'}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Certificates — for fully-completed courses */}
          {cards.some((c) => c.pct >= 100) && (
            <section className="mt-10">
              <h2 className="font-display text-xl font-bold text-ink flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-gold-500" strokeWidth={2.2} />
                Sètifika ou yo
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {cards
                  .filter((c) => c.pct >= 100)
                  .map((c) => (
                    <Link
                      key={c.id}
                      href={`/setifika/${c.slug}`}
                      className="flex items-center gap-3 bg-white border border-cream-200 rounded-2xl p-4 hover:border-gold-300 transition"
                    >
                      <span className="grid place-items-center w-11 h-11 rounded-xl bg-gold-100 text-gold-700 shrink-0">
                        <Award className="w-5 h-5" strokeWidth={2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-gold-700">
                          Sètifika
                        </div>
                        <div className="text-sm font-bold text-ink truncate">
                          {c.title}
                        </div>
                      </div>
                      <ArrowRight
                        className="w-4 h-4 text-earth-400 shrink-0"
                        strokeWidth={2.2}
                      />
                    </Link>
                  ))}
              </div>
            </section>
          )}

          {/* Discover more */}
          {discover.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-xl font-bold text-ink flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-gold-500" strokeWidth={2.2} />
                Dekouvri plis kou
              </h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {discover.map((d) => (
                  <Link
                    key={d.slug}
                    href={`/klas/${d.slug}`}
                    className="bg-white border border-cream-200 rounded-2xl p-4 hover:border-gold-300 transition"
                  >
                    <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold-700 mb-1.5">
                      <BookOpen className="w-3.5 h-3.5" strokeWidth={2.2} />
                      {d.price_cents
                        ? `$${(d.price_cents / 100).toFixed(2)}`
                        : 'Gratis'}
                    </div>
                    <h3 className="font-display font-bold text-ink leading-snug text-sm line-clamp-2">
                      {d.title}
                    </h3>
                    {d.instructor_name && (
                      <p className="text-xs text-earth-600 mt-1">
                        Avèk {d.instructor_name}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
