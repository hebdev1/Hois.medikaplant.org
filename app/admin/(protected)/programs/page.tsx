import Link from 'next/link';
import { CalendarRange, ChevronRight, Users as UsersIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { describeCondition } from '@/lib/conditions/catalog';
import type { Database } from '@/types/database';

export const metadata = { title: 'Admin · Plan + Tach 1-30' };
export const dynamic = 'force-dynamic';

type ProgramRow = Database['public']['Tables']['programs']['Row'];

const PLAN_LABEL: Record<string, string> = {
  basic: 'Bazilik',
  premium: 'Sitwonèl',
  vip: 'Melis',
};
const PLAN_TONE: Record<string, string> = {
  basic: 'bg-slate-100 text-slate-700',
  premium: 'bg-teal-100 text-teal-700',
  vip: 'bg-amber-100 text-amber-700',
};

export default async function AdminProgramsListPage() {
  const supabase = createClient();

  // Pull every active program along with two activity counters we surface
  // on the card: scheduled tasks (program_tasks rows) and active members
  // (user_programs.is_active=true). Both counters live in the same row so
  // we run a single grouped query rather than per-program subselects.
  const [{ data: programsData }, { data: tasksAgg }, { data: enrollAgg }] =
    await Promise.all([
      supabase
        .from('programs')
        .select('*')
        .eq('active', true)
        .order('plan_required', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase
        .from('program_tasks')
        .select('program_id, day_number'),
      supabase
        .from('user_programs')
        .select('program_id')
        .eq('is_active', true),
    ]);

  const programs = (programsData ?? []) as ProgramRow[];

  // Roll up task + enrollment counts per program.
  type TaskAgg = { program_id: string; day_number: number };
  const taskRows = (tasksAgg ?? []) as TaskAgg[];
  const taskCount = new Map<string, number>();
  const daysFilled = new Map<string, Set<number>>();
  for (const r of taskRows) {
    taskCount.set(r.program_id, (taskCount.get(r.program_id) ?? 0) + 1);
    let s = daysFilled.get(r.program_id);
    if (!s) {
      s = new Set<number>();
      daysFilled.set(r.program_id, s);
    }
    s.add(r.day_number);
  }
  const enrollCount = new Map<string, number>();
  for (const r of (enrollAgg ?? []) as Array<{ program_id: string }>) {
    enrollCount.set(r.program_id, (enrollCount.get(r.program_id) ?? 0) + 1);
  }

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1280px] mx-auto">
      <header className="mb-6 md:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
          <CalendarRange className="w-3.5 h-3.5" strokeWidth={2.2} />
          Admin · Plan + Tach 1-30
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Pwograme tach plan yo
        </h1>
        <p className="mt-2 text-sm text-earth-600 max-w-2xl">
          Chwazi yon plan pou wè kalandriye 1-30 jou a. Pou chak jou, ou ka
          ajoute tach ki pèsonalize selon kondisyon sante manm yo. Lè yon
          manm ki gen kondisyon koresponde a rive jou sa nan plan li, l ap
          wè tach la otomatik sou dashboard li.
        </p>
      </header>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {programs.map((p) => {
          const tasks = taskCount.get(p.id) ?? 0;
          const enrolled = enrollCount.get(p.id) ?? 0;
          const daysScheduled = daysFilled.get(p.id)?.size ?? 0;
          const tagLabels = (p.condition_tags ?? [])
            .slice(0, 3)
            .map((slug) => describeCondition(slug));
          const extraTags = Math.max(
            0,
            (p.condition_tags ?? []).length - tagLabels.length
          );

          return (
            <Link
              key={p.id}
              href={`/admin/programs/${p.slug}`}
              className="group bg-white border border-cream-200 rounded-2xl p-5 shadow-card hover:shadow-plant hover:border-forest-300 transition flex flex-col gap-3"
            >
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-display text-lg font-bold text-ink truncate">
                    {p.name}
                  </div>
                  <div className="text-[10px] font-mono text-earth-500 truncate mt-0.5">
                    {p.slug}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${
                    PLAN_TONE[p.plan_required] ?? PLAN_TONE.basic
                  }`}
                >
                  {PLAN_LABEL[p.plan_required]}
                </span>
              </header>

              {p.short_tagline && (
                <p className="text-xs text-earth-600 line-clamp-2">
                  {p.short_tagline}
                </p>
              )}

              {/* Day progress bar — how many days are populated vs total */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-earth-600 mb-1">
                  <span>
                    <strong className="text-ink">{daysScheduled}</strong> /{' '}
                    {p.total_days} jou pwograme
                  </span>
                  <span className="font-mono">{tasks} tach</span>
                </div>
                <div className="h-1.5 rounded-full bg-cream-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-forest-400 to-forest-600 transition-[width] duration-500"
                    style={{
                      width: `${
                        p.total_days > 0
                          ? Math.min(100, (daysScheduled / p.total_days) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Condition tag preview */}
              {tagLabels.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {tagLabels.map((t) => (
                    <span
                      key={t.slug}
                      className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-cream-100 text-earth-700"
                    >
                      <span aria-hidden>{t.icon}</span>
                      {t.label}
                    </span>
                  ))}
                  {extraTags > 0 && (
                    <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-cream-100 text-earth-500">
                      + {extraTags}
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-[10px] text-earth-500 italic">
                  Pa gen tag kondisyon — plan jeneral
                </div>
              )}

              <footer className="flex items-center justify-between pt-1 border-t border-cream-100 mt-auto">
                <span className="inline-flex items-center gap-1 text-[11px] text-earth-600">
                  <UsersIcon className="w-3 h-3" strokeWidth={2.4} />
                  {enrolled} {enrolled === 1 ? 'manm' : 'manm'}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700 group-hover:text-forest-900">
                  Wè kalandriye
                  <ChevronRight
                    className="w-3 h-3 group-hover:translate-x-0.5 transition"
                    strokeWidth={2.4}
                  />
                </span>
              </footer>
            </Link>
          );
        })}
      </section>

      {programs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-cream-300 bg-cream-50/60 p-10 text-center text-sm text-earth-600">
          Pa gen okenn plan aktif. Kreye yon plan nan baz done a (tab
          <code className="font-mono"> programs</code>) pou kòmanse.
        </div>
      )}
    </div>
  );
}
