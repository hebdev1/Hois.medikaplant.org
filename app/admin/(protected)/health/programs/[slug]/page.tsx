import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, CalendarRange } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { describeCondition } from '@/lib/conditions/catalog';
import ScheduleEditor from './schedule-editor';
import type { Database } from '@/types/database';

export const dynamic = 'force-dynamic';

type ProgramRow = Database['public']['Tables']['programs']['Row'];
type ProgramTaskRow = Database['public']['Tables']['program_tasks']['Row'];

const PLAN_LABEL: Record<string, string> = {
  basic: 'Bazilik',
  premium: 'Sitwonèl',
  vip: 'Melis',
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const { data } = await supabase
    .from('programs')
    .select('name')
    .eq('slug', params.slug)
    .maybeSingle();
  const name = (data as { name: string } | null)?.name;
  return { title: name ? `Admin · ${name}` : 'Admin · Plan' };
}

export default async function AdminProgramSchedulerPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();

  const { data: programData } = await supabase
    .from('programs')
    .select('*')
    .eq('slug', params.slug)
    .maybeSingle();
  const program = programData as ProgramRow | null;
  if (!program) notFound();

  const { data: tasksData } = await supabase
    .from('program_tasks')
    .select('*')
    .eq('program_id', program.id)
    .order('day_number', { ascending: true })
    .order('order_index', { ascending: true });
  const tasks = (tasksData ?? []) as ProgramTaskRow[];

  // Group tasks by day for the grid. Days with no tasks still render as
  // empty slots so admin can add the first task with a click.
  const tasksByDay = new Map<number, ProgramTaskRow[]>();
  for (const t of tasks) {
    const day = t.day_number ?? 1;
    const arr = tasksByDay.get(day) ?? [];
    arr.push(t);
    tasksByDay.set(day, arr);
  }

  // Render up to total_days days. We cap at 90 for the UI even if a
  // program is configured longer — admin can still edit beyond 90 via the
  // jump-to-day input, but the rendered grid stays scannable.
  const renderedDays = Math.min(program.total_days, 90);
  const days = Array.from({ length: renderedDays }, (_, i) => i + 1);

  const conditionTagsPreview = (program.condition_tags ?? []).map((slug) =>
    describeCondition(slug)
  );

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1280px] mx-auto">
      <Link
        href="/admin/health?tab=programs"
        className="inline-flex items-center gap-1 text-xs font-semibold text-earth-600 hover:text-forest-700 transition mb-5"
      >
        <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.4} />
        Tounen nan tout plan yo
      </Link>

      <header className="mb-6 md:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
          <CalendarRange className="w-3.5 h-3.5" strokeWidth={2.2} />
          Kalandriye 1–{program.total_days} jou
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
              {program.name}
            </h1>
            {program.short_tagline && (
              <p className="mt-1 text-sm text-earth-600 max-w-xl">
                {program.short_tagline}
              </p>
            )}
          </div>
          <span className="text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full bg-cream-100 text-earth-700">
            Plan {PLAN_LABEL[program.plan_required] ?? program.plan_required}
          </span>
        </div>

        {conditionTagsPreview.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {conditionTagsPreview.map((t) => (
              <span
                key={t.slug}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-cream-100 text-earth-700"
              >
                <span aria-hidden>{t.icon}</span>
                {t.label}
              </span>
            ))}
          </div>
        )}
      </header>

      <ScheduleEditor
        programId={program.id}
        programSlug={program.slug}
        totalDays={program.total_days}
        days={days}
        tasksByDay={Object.fromEntries(
          Array.from(tasksByDay.entries()).map(([k, v]) => [String(k), v])
        )}
      />
    </div>
  );
}
