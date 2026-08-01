import Link from 'next/link';
import { redirect } from 'next/navigation';
import { HelpCircle, CheckCircle2, Clock, Inbox, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';

export const metadata = { title: 'Kesyon & Repons · Hoïs' };
export const dynamic = 'force-dynamic';

const MONTHS_HT = [
  'Janvye', 'Fevriye', 'Mas', 'Avril', 'Me', 'Jen',
  'Jiyè', 'Out', 'Septanm', 'Oktòb', 'Novanm', 'Desanm',
];
function dateHT(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_HT[d.getMonth()]} ${d.getFullYear()}`;
}

type Question = {
  id: string;
  body: string;
  answer: string | null;
  created_at: string;
  course_id: string;
  module_id: string | null;
};

// "Kesyon & Repons" — every question the student has asked across all their
// courses, with the elder's answers, in one place. course_questions +
// course_modules aren't in the generated types yet, so we cast + resolve the
// course / module labels in follow-up queries rather than a PostgREST embed.
export default async function MyQuestionsPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login?redirect=/aprann/kesyon');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data: qRaw } = await sb
    .from('course_questions')
    .select('id, body, answer, created_at, course_id, module_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const questions = (qRaw ?? []) as Question[];

  const courseIds = [...new Set(questions.map((q) => q.course_id).filter(Boolean))];
  const moduleIds = [
    ...new Set(
      questions.map((q) => q.module_id).filter((m): m is string => !!m)
    ),
  ];

  // Resolve course label + kind (drives the right course URL).
  const courseMap = new Map<string, { slug: string; title: string; kind: string }>();
  if (courseIds.length > 0) {
    const { data: courses } = await supabase
      .from('courses')
      .select('id, slug, title, kind')
      .in('id', courseIds);
    for (const c of (courses ?? []) as unknown as Array<{
      id: string;
      slug: string;
      title: string;
      kind: string;
    }>) {
      courseMap.set(c.id, { slug: c.slug, title: c.title, kind: c.kind });
    }
  }

  // Resolve module titles for the questions asked from inside a lesson.
  const moduleMap = new Map<string, string>();
  if (moduleIds.length > 0) {
    const { data: mods } = await supabase
      .from('course_modules')
      .select('id, title')
      .in('id', moduleIds);
    for (const m of (mods ?? []) as Array<{ id: string; title: string }>) {
      moduleMap.set(m.id, m.title);
    }
  }

  const hrefForCourse = (c: { slug: string; kind: string }) =>
    c.kind === 'interactive' ? `/klas/${c.slug}` : `/aprann/${c.slug}`;

  const answered = questions.filter((q) => q.answer && q.answer.trim().length > 0);

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[860px] mx-auto">
      <header className="mb-7">
        <span className="text-[11px] uppercase tracking-[0.16em] text-earth-500 font-semibold">
          Espas Elèv
        </span>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink tracking-tight flex items-center gap-2.5">
          <HelpCircle className="w-7 h-7 text-forest-700" strokeWidth={2} />
          Kesyon & Repons
        </h1>
        <p className="mt-1.5 text-sm text-earth-600">
          Tout kesyon ou poze ton vye a atravè kou ou yo, ak repons yo — yon sèl
          kote.
        </p>
      </header>

      {questions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cream-300 bg-white px-5 py-14 text-center">
          <Inbox className="w-10 h-10 mx-auto text-earth-400 mb-3" strokeWidth={1.6} />
          <p className="text-sm text-earth-600 max-w-sm mx-auto">
            Ou poko poze okenn kesyon. Antre nan yon kou epi poze ton vye a nenpòt
            kesyon ou genyen — n ap ranmase yo tout isit la.
          </p>
          <Link
            href="/aprann"
            className="mt-4 inline-flex items-center gap-1.5 bg-forest-700 hover:bg-forest-800 text-cream-50 px-5 py-2.5 rounded-full text-sm font-semibold transition"
          >
            Ale nan kou yo <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-5 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-100 border border-cream-200 px-3 py-1.5 font-semibold text-earth-700">
              {questions.length} kesyon
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-50 border border-forest-100 px-3 py-1.5 font-semibold text-forest-700">
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.4} />
              {answered.length} reponn
            </span>
            {questions.length - answered.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-50 border border-gold-200 px-3 py-1.5 font-semibold text-gold-700">
                <Clock className="w-3.5 h-3.5" strokeWidth={2.4} />
                {questions.length - answered.length} ap tann
              </span>
            )}
          </div>

          <ul className="space-y-4">
            {questions.map((q) => {
              const course = courseMap.get(q.course_id);
              const moduleTitle = q.module_id ? moduleMap.get(q.module_id) : null;
              return (
                <li
                  key={q.id}
                  className="bg-white border border-cream-200 rounded-2xl p-5 shadow-card"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs mb-2.5">
                    {course ? (
                      <Link
                        href={hrefForCourse(course)}
                        className="inline-flex items-center gap-1 font-semibold text-forest-700 hover:text-forest-900 transition"
                      >
                        {course.title}
                      </Link>
                    ) : (
                      <span className="font-semibold text-earth-600">Kou</span>
                    )}
                    {moduleTitle && (
                      <span className="text-earth-500">· {moduleTitle}</span>
                    )}
                    <span className="text-earth-400">· {dateHT(q.created_at)}</span>
                  </div>

                  <p className="text-sm text-ink font-medium whitespace-pre-wrap">
                    {q.body}
                  </p>

                  {q.answer && q.answer.trim().length > 0 ? (
                    <div className="mt-3 rounded-xl bg-forest-50 border border-forest-100 p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-forest-700 mb-0.5 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" strokeWidth={2.4} />
                        Repons Ton vye
                      </div>
                      <p className="text-sm text-ink/90 whitespace-pre-wrap">
                        {q.answer}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2.5 text-[11px] text-earth-500 italic inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" strokeWidth={2.4} />
                      N ap tann repons ton vye a…
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
