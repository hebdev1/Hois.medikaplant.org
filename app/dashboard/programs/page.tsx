import Link from 'next/link';
import { ChevronRight, Flame, Sparkles, CheckCircle2, Pause as PauseIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Topbar from '@/components/dashboard/topbar';
import ChecklistPanel, {
  type ChecklistItem,
} from '@/components/dashboard/checklist-panel';
import ProgramActions from './program-actions';
import EnrollButton from './enroll-button';
import { cn } from '@/lib/utils';
import type { Database, TaskChipKind } from '@/types/database';

export const metadata = { title: 'Pwogram mwen yo · MedikaPlant' };
export const dynamic = 'force-dynamic';

type ProgramRow = Database['public']['Tables']['programs']['Row'];
type ProgramPhaseRow = Database['public']['Tables']['program_phases']['Row'];
type UserProgramRow = Database['public']['Tables']['user_programs']['Row'];
type ProgramTaskRow = Database['public']['Tables']['program_tasks']['Row'];

const PLAN_RANK: Record<string, number> = { basic: 0, premium: 1, vip: 2 };
const PLAN_LABEL: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

const MOIS = [
  'Janvye', 'Fevriye', 'Mas', 'Avril', 'Me', 'Jen',
  'Jiyè', 'Out', 'Septanm', 'Oktòb', 'Novanm', 'Desanm',
];

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Compute current day-of-plan based on elapsed time, paused state, and offset. */
function computeDayOfPlan(
  startedAtIso: string,
  pausedAtIso: string | null,
  pauseOffsetSeconds: number,
  totalDays: number
): number {
  const startMs = new Date(startedAtIso).getTime();
  const nowMs = pausedAtIso ? new Date(pausedAtIso).getTime() : Date.now();
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - startMs) / 1000));
  const effectiveSeconds = Math.max(0, elapsedSeconds - (pauseOffsetSeconds ?? 0));
  const effectiveDays = Math.floor(effectiveSeconds / 86400) + 1;
  return Math.max(1, Math.min(totalDays, effectiveDays));
}

export default async function ProgramsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);

  const [
    profileResult,
    activeProgramResult,
    completedResult,
    catalogResult,
    streakResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('plan, full_name, email')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('user_programs')
      .select(
        'id, started_at, finished_at, is_active, paused_at, pause_offset_seconds, programs(*)'
      )
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('user_programs')
      .select('id, started_at, finished_at, is_active, programs(id, slug, name, variant, total_days, accent_color, level)')
      .eq('user_id', user.id)
      .not('finished_at', 'is', null)
      .order('finished_at', { ascending: false })
      .limit(6),
    supabase
      .from('programs')
      .select('*')
      .eq('active', true)
      .order('plan_required', { ascending: true })
      .order('total_days', { ascending: true }),
    supabase.rpc('user_streak', { uid: user.id }),
  ]);

  const profile = profileResult.data as {
    plan: 'basic' | 'premium' | 'vip';
    full_name: string | null;
    email: string;
  } | null;

  type ActiveProgramJoinRow = UserProgramRow & { programs: ProgramRow | null };
  const activeEnrollment = activeProgramResult.data as unknown as
    | ActiveProgramJoinRow
    | null;
  const activeProgram = activeEnrollment?.programs ?? null;

  const catalog = (catalogResult.data ?? []) as ProgramRow[];
  const otherPrograms = catalog.filter((p) => p.id !== activeProgram?.id);

  type CompletedJoinRow = {
    id: string;
    started_at: string;
    finished_at: string;
    programs: {
      id: string;
      slug: string;
      name: string;
      variant: string | null;
      total_days: number;
      accent_color: string;
      level: string;
    } | null;
  };
  const completed = (completedResult.data ?? []) as unknown as CompletedJoinRow[];

  const streak = (streakResult.data as number | null) ?? 0;
  const userPlanRank = PLAN_RANK[profile?.plan ?? 'basic'] ?? 0;

  // ── Fetch phases + tasks + today's completions for the active program ────
  let phases: ProgramPhaseRow[] = [];
  let tasks: ChecklistItem[] = [];
  let dayOfPlan = 1;
  let totalDays = 30;
  let progressPct = 0;
  let milestoneDays: number[] = [];

  if (activeProgram && activeEnrollment) {
    totalDays = activeProgram.total_days;
    milestoneDays = activeProgram.milestone_days ?? [];

    dayOfPlan = computeDayOfPlan(
      activeEnrollment.started_at,
      activeEnrollment.paused_at ?? null,
      activeEnrollment.pause_offset_seconds ?? 0,
      totalDays
    );
    progressPct = Math.round(((dayOfPlan - 1) / totalDays) * 100);

    const [phasesResult, taskRowsResult, completionsResult] = await Promise.all([
      supabase
        .from('program_phases')
        .select('*')
        .eq('program_id', activeProgram.id)
        .order('phase_num', { ascending: true }),
      supabase
        .from('program_tasks')
        .select('*')
        .eq('program_id', activeProgram.id)
        .order('order_index', { ascending: true }),
      supabase
        .from('user_task_completions')
        .select('task_id')
        .eq('user_id', user.id)
        .eq('completion_date', today),
    ]);

    phases = (phasesResult.data ?? []) as ProgramPhaseRow[];

    const taskRows = (taskRowsResult.data ?? []) as ProgramTaskRow[];
    const completedTaskIds = new Set(
      ((completionsResult.data ?? []) as Array<{ task_id: string }>).map(
        (r) => r.task_id
      )
    );

    tasks = taskRows.map((t) => ({
      id: t.id,
      title: t.title,
      meta: t.meta ?? '',
      chip: t.chip_label ?? '',
      chipKind: (['forest', 'gold', 'cream'].includes(t.chip_kind)
        ? t.chip_kind
        : 'forest') as TaskChipKind,
      done: completedTaskIds.has(t.id),
    }));
  }

  const isPaused = Boolean(activeEnrollment?.paused_at);

  const userName =
    profile?.full_name || profile?.email.split('@')[0] || 'Manm';
  const shortName = userName.split(' ')[0];

  return (
    <>
      <Topbar
        userName={shortName}
        userCondition={`${PLAN_LABEL[profile?.plan ?? 'basic']} · Pwogram`}
      />
      <div className="p-5 md:p-8 lg:p-10 max-w-[1320px] mx-auto grid gap-5 md:gap-6">
        {/* Page header */}
        <header>
          <nav className="text-xs text-earth-600 mb-3 flex items-center gap-1.5">
            <Link href="/dashboard" className="hover:text-forest-700 transition">
              Tablodebò
            </Link>
            <ChevronRight className="w-3 h-3" strokeWidth={2.4} />
            <span className="text-ink font-medium">Pwogram mwen yo</span>
          </nav>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2.2} />
            Pwogram mwen yo
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
                {activeProgram ? (
                  <>
                    {activeProgram.name}{' '}
                    {activeProgram.variant && (
                      <em className="text-forest-600 not-italic font-bold">
                        — {activeProgram.variant}
                      </em>
                    )}
                  </>
                ) : (
                  'Pa gen pwogram aktif'
                )}
              </h1>
              <p className="mt-2 text-sm md:text-base text-earth-600 max-w-2xl leading-relaxed">
                {activeProgram
                  ? `Yon plan ${totalDays} jou — ${totalDays - dayOfPlan + 1} jou rete. ${
                      activeProgram.short_tagline ??
                      activeProgram.description ??
                      'Swiv chak etap pou pi bon rezilta.'
                    }`
                  : 'Chwazi yon pwogram pi ba a pou kòmanse vwayaj sante ou.'}
              </p>
            </div>
            {activeProgram && (
              <ProgramActions
                isPaused={isPaused}
                resourceUrl={null}
              />
            )}
          </div>
        </header>

        {/* Active program — timeline */}
        {activeProgram ? (
          <>
            <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
              <header className="flex items-start justify-between gap-4 flex-wrap mb-5">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">
                    Eta <em className="text-forest-600 not-italic font-bold">plan an</em>
                  </h2>
                  <p className="text-xs text-earth-600 mt-1">
                    Chak kare se yon jou — koche aktivite yo pou avanse.
                  </p>
                </div>
                <div className="flex items-stretch gap-5">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-earth-600">
                      Pwogrè
                    </div>
                    <div className="font-display text-3xl font-bold text-forest-700 leading-none mt-1">
                      {progressPct}%
                    </div>
                  </div>
                  <div className="w-px bg-cream-200" />
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-earth-600 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-gold-500" strokeWidth={2.4} />
                      Jou seri
                    </div>
                    <div className="font-display text-3xl font-bold text-gold-600 leading-none mt-1">
                      {streak}
                    </div>
                  </div>
                </div>
              </header>

              {isPaused && (
                <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 flex items-start gap-2 text-xs text-amber-800">
                  <PauseIcon className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={2.4} />
                  <div>
                    <strong>Plan ou sou pòz.</strong> Konte jou yo kanpe depi{' '}
                    {formatDate(activeEnrollment?.paused_at)}. Klike sou
                    &ldquo;Repran plan an&rdquo; pou kontinye.
                  </div>
                </div>
              )}

              {/* Timeline grid */}
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: totalDays }, (_, i) => {
                  const day = i + 1;
                  const done = day < dayOfPlan;
                  const todayCell = day === dayOfPlan;
                  const milestone = milestoneDays.includes(day);
                  return (
                    <div
                      key={day}
                      title={`Jou ${day}${milestone ? ' · Etap kle' : ''}`}
                      className={cn(
                        'relative grid place-items-center w-8 h-8 md:w-9 md:h-9 rounded-lg text-[11px] font-bold transition',
                        done && 'bg-forest-700 text-cream-50 shadow-sm',
                        todayCell &&
                          'bg-gold-400 text-ink ring-2 ring-gold-200 scale-110 shadow',
                        !done &&
                          !todayCell &&
                          'bg-cream-100 text-earth-500 border border-cream-200'
                      )}
                    >
                      {day}
                      {milestone && (
                        <span
                          className="absolute -top-1 -right-1 text-[8px] leading-none text-gold-500"
                          aria-hidden
                        >
                          ★
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 flex items-center gap-4 flex-wrap text-[11px] text-earth-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-forest-700" />
                  Fini ({Math.max(0, dayOfPlan - 1)})
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-gold-400" />
                  Jodi a
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-cream-100 border border-cream-200" />
                  Vini ({Math.max(0, totalDays - dayOfPlan)})
                </span>
                <span className="ml-auto text-gold-600 font-semibold">★ Etap kle</span>
              </div>
            </section>

            {/* Two-col: tasks + phases */}
            <div className="grid lg:grid-cols-2 gap-5 md:gap-6">
              <ChecklistPanel initialTasks={tasks} />

              <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
                <header className="mb-5">
                  <h2 className="font-display text-xl font-bold text-ink">
                    Faz <em className="text-forest-600 not-italic font-bold">plan an</em>
                  </h2>
                  <p className="text-xs text-earth-600 mt-1">
                    {phases.length} etap pwogresif sou {totalDays} jou.
                  </p>
                </header>
                {phases.length === 0 ? (
                  <div className="rounded-xl bg-cream-50 border border-dashed border-cream-200 p-5 text-center text-sm text-earth-600 italic">
                    Pa gen faz konfigire pou pwogram sa ankò.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {phases.map((phase) => {
                      const status: 'fini' | 'aktif' | 'venn' =
                        dayOfPlan > phase.day_end
                          ? 'fini'
                          : dayOfPlan >= phase.day_start
                            ? 'aktif'
                            : 'venn';
                      return (
                        <PhaseRow
                          key={phase.id}
                          num={phase.phase_num}
                          title={`${phase.title} (Jou ${phase.day_start}–${phase.day_end})`}
                          sub={phase.sub ?? ''}
                          status={status}
                        />
                      );
                    })}
                  </ul>
                )}
              </section>
            </div>
          </>
        ) : (
          <section className="bg-white border border-dashed border-cream-200 rounded-2xl p-8 text-center">
            <div className="font-display text-lg font-bold text-ink">
              Ou pa gen pwogram aktif kounye a.
            </div>
            <p className="text-sm text-earth-600 mt-2">
              Chwazi yon pwogram nan katalòg la pi ba a pou kòmanse vwayaj sante ou.
            </p>
          </section>
        )}

        {/* Other programs catalog */}
        {otherPrograms.length > 0 && (
          <section>
            <header className="mb-4">
              <h2 className="font-display text-2xl font-bold text-ink">
                Lòt pwogram pou <em className="text-forest-600 not-italic font-bold">dekouvri</em>
              </h2>
              <p className="text-sm text-earth-600 mt-1">
                {activeProgram
                  ? `Lè ou fini ${activeProgram.name}, chwazi pwochen vwayaj sante ou.`
                  : 'Kòmanse vwayaj sante ou ak yon nan pwogram sa yo.'}
              </p>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {otherPrograms.map((p) => {
                const locked = (PLAN_RANK[p.plan_required] ?? 0) > userPlanRank;
                return (
                  <ProgramCard
                    key={p.id}
                    program={p}
                    isCurrent={false}
                    locked={locked}
                    lockReason={locked ? `Bezwen plan ${PLAN_LABEL[p.plan_required]}` : undefined}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Completed programs */}
        {completed.length > 0 && (
          <section>
            <header className="mb-4">
              <h2 className="font-display text-lg font-bold text-ink">
                Pwogram <em className="text-forest-600 not-italic font-bold">w fini</em>
              </h2>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {completed.map((row) => (
                <CompletedCard key={row.id} row={row} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function PhaseRow({
  num,
  title,
  sub,
  status,
}: {
  num: number;
  title: string;
  sub: string;
  status: 'fini' | 'aktif' | 'venn';
}) {
  const tone =
    status === 'fini'
      ? { box: 'bg-forest-700 text-cream-50', chip: 'bg-forest-100 text-forest-700', label: 'Fini' }
      : status === 'aktif'
        ? { box: 'bg-gold-400 text-ink', chip: 'bg-gold-100 text-gold-700', label: 'Aktif' }
        : { box: 'bg-cream-200 text-earth-600', chip: 'bg-cream-100 text-earth-600 border border-cream-200', label: 'Pwochèn' };
  return (
    <li className="flex items-center gap-3 p-3 rounded-xl border border-cream-200 bg-cream-50/40">
      <span
        className={cn(
          'grid place-items-center w-10 h-10 rounded-xl font-display text-lg font-bold shrink-0',
          tone.box
        )}
      >
        {num}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-ink leading-tight">{title}</div>
        <div className="text-xs text-earth-600 mt-0.5 leading-relaxed">{sub}</div>
      </div>
      <span
        className={cn(
          'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0',
          tone.chip
        )}
      >
        {tone.label}
      </span>
    </li>
  );
}

function ProgramCard({
  program,
  isCurrent,
  locked,
  lockReason,
}: {
  program: ProgramRow;
  isCurrent: boolean;
  locked: boolean;
  lockReason?: string;
}) {
  return (
    <article className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden flex flex-col">
      <div
        className="relative h-28 grid place-items-center text-cream-50"
        style={{
          background: `linear-gradient(135deg, ${program.accent_color}, ${program.accent_color}AA)`,
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 48 48"
          fill="none"
          className="absolute right-1 bottom-0 opacity-30"
          aria-hidden
        >
          <ellipse cx="24" cy="40" rx="14" ry="3" fill="#00000033" />
          <path
            d="M24 6 C16 14 12 24 16 32 C18 36 22 38 24 38 C26 38 30 36 32 32 C36 24 32 14 24 6Z"
            fill="#FFFDF8"
            opacity="0.4"
          />
          <path
            d="M24 6 C28 16 26 28 24 38"
            stroke="#FFFDF8"
            strokeWidth="1.4"
            fill="none"
            opacity="0.7"
          />
        </svg>
        <div className="relative z-10 text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-cream-50/90">
            {program.total_days} jou
          </div>
          <div className="font-display text-lg font-bold mt-0.5">
            {program.level}
          </div>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-display text-base font-bold text-ink leading-tight">
          {program.name}
          {program.variant && (
            <span className="text-earth-600 font-medium"> — {program.variant}</span>
          )}
        </h3>
        <p className="text-xs text-earth-600 mt-1.5 leading-relaxed line-clamp-3 flex-1">
          {program.short_tagline ?? program.description ?? ''}
        </p>
        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-cream-100">
          <span className="text-[11px] text-earth-500">Pa kòmanse</span>
          <EnrollButton
            programId={program.id}
            locked={locked}
            lockReason={lockReason}
            isCurrent={isCurrent}
          />
        </div>
      </div>
    </article>
  );
}

function CompletedCard({
  row,
}: {
  row: {
    started_at: string;
    finished_at: string;
    programs: {
      name: string;
      variant: string | null;
      total_days: number;
      level: string;
    } | null;
  };
}) {
  const program = row.programs;
  if (!program) return null;
  return (
    <article className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden opacity-90">
      <div className="relative h-20 grid place-items-center bg-gradient-to-br from-earth-600 to-earth-900 text-cream-50">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-200 border border-gold-400/30">
          <CheckCircle2 className="w-3 h-3" strokeWidth={2.4} />
          Fini
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-display text-base font-bold text-ink leading-tight">
          {program.name}
          {program.variant && (
            <span className="text-earth-600 font-medium"> — {program.variant}</span>
          )}
        </h3>
        <p className="text-xs text-earth-600 mt-1">
          {program.total_days} jou · 100%
        </p>
        <p className="text-[11px] text-earth-500 mt-2">
          Fini {formatDate(row.finished_at)}
        </p>
      </div>
    </article>
  );
}
