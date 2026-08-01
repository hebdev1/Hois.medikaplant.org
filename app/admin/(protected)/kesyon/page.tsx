import { HelpCircle, CheckCircle2, Inbox } from 'lucide-react';
import { createServiceClient } from '@/lib/supabase/service';
import AnswerForm from './answer-form';

export const metadata = { title: 'Kesyon kou · Admin' };
export const dynamic = 'force-dynamic';

const MONTHS_HT = [
  'Jan', 'Fev', 'Mas', 'Avr', 'Me', 'Jen',
  'Jiy', 'Out', 'Sep', 'Okt', 'Nov', 'Des',
];
function dateHT(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_HT[d.getMonth()]} ${d.getFullYear()}`;
}

// Admin Q&A inbox. Access is already gated by the admin layout; reads go
// through the service role so an admin sees every student's question.
export default async function AdminQuestionsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any;

  const { data: qRaw } = await sb
    .from('course_questions')
    .select('id, body, answer, created_at, course_id, user_id')
    .order('created_at', { ascending: false })
    .limit(200);
  const questions = (qRaw ?? []) as Array<{
    id: string;
    body: string;
    answer: string | null;
    created_at: string;
    course_id: string;
    user_id: string;
  }>;

  const courseIds = [...new Set(questions.map((q) => q.course_id))];
  const userIds = [...new Set(questions.map((q) => q.user_id))];
  const [coursesRes, profilesRes] = await Promise.all([
    courseIds.length
      ? sb.from('courses').select('id, title').in('id', courseIds)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? sb.from('profiles').select('id, full_name, email').in('id', userIds)
      : Promise.resolve({ data: [] }),
  ]);
  const courseTitle = new Map(
    ((coursesRes.data ?? []) as Array<{ id: string; title: string }>).map(
      (c) => [c.id, c.title]
    )
  );
  const student = new Map(
    (
      (profilesRes.data ?? []) as Array<{
        id: string;
        full_name: string | null;
        email: string;
      }>
    ).map((p) => [p.id, p.full_name || p.email])
  );

  // Unanswered first, then newest.
  const sorted = [...questions].sort(
    (a, b) => (a.answer ? 1 : 0) - (b.answer ? 1 : 0)
  );
  const unanswered = questions.filter((q) => !q.answer).length;

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[900px]">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold mb-3">
          <HelpCircle className="w-3.5 h-3.5" strokeWidth={2.2} />
          Kesyon kou
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          Kesyon elèv yo
        </h1>
        <p className="mt-2 text-sm text-earth-600">
          {unanswered} kesyon k ap tann repons · {questions.length} an tou.
        </p>
      </header>

      {questions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-14 text-center">
          <Inbox className="w-10 h-10 mx-auto text-earth-400 mb-3" strokeWidth={1.6} />
          <p className="text-sm text-earth-600">Pa gen okenn kesyon pou kounye a.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sorted.map((q) => (
            <li
              key={q.id}
              className={`rounded-2xl border p-4 md:p-5 ${
                q.answer
                  ? 'bg-white border-slate-200'
                  : 'bg-amber-50/50 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                <div className="text-xs text-earth-600">
                  <span className="font-semibold text-ink">
                    {student.get(q.user_id) ?? 'Elèv'}
                  </span>{' '}
                  · {courseTitle.get(q.course_id) ?? 'Kou'} · {dateHT(q.created_at)}
                </div>
                {q.answer ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-forest-100 text-forest-700">
                    <CheckCircle2 className="w-2.5 h-2.5" strokeWidth={2.4} />
                    Reponn
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    K ap tann
                  </span>
                )}
              </div>
              <p className="text-sm text-ink font-medium whitespace-pre-wrap">
                {q.body}
              </p>
              <AnswerForm questionId={q.id} initialAnswer={q.answer} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
