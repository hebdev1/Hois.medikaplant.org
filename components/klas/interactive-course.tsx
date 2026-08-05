'use client';

import React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  ShieldAlert,
  Clock,
  Loader2,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  markModuleComplete,
  gradeAnswer,
} from '@/app/klas/[slug]/progress-actions';
import type {
  InteractiveModule,
  CourseOverview,
  Block,
  QuizQuestion,
} from '@/lib/klas/course-content';

type Props = {
  courseId: string;
  title: string;
  lede: string | null;
  chips: string[];
  overview: CourseOverview | null;
  modules: InteractiveModule[];
  initialCompleted: string[];
  canSaveProgress: boolean;
  cta?: { href: string; label: string } | null;
  lockedCount?: number;
};

export default function InteractiveCourse({
  courseId,
  title,
  lede,
  chips,
  overview,
  modules,
  initialCompleted,
  canSaveProgress,
  cta,
  lockedCount = 0,
}: Props) {
  const [active, setActive] = React.useState<string>('overview');
  const [completed, setCompleted] = React.useState<Set<string>>(
    () => new Set(initialCompleted)
  );
  const [pending, setPending] = React.useState(false);

  const total = modules.length;
  const doneCount = modules.filter((m) => completed.has(m.id)).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  const order = ['overview', ...modules.map((m) => m.id)];
  const idx = order.indexOf(active);
  const activeModule = modules.find((m) => m.id === active) ?? null;

  // Sequential gating: a module unlocks once the one before it is completed.
  // Module 1 is always open, and any completed module stays open to revisit.
  const isUnlocked = (i: number) =>
    i <= 0 ||
    completed.has(modules[i - 1].id) ||
    completed.has(modules[i].id);

  const activeIdx = activeModule
    ? modules.findIndex((m) => m.id === activeModule.id)
    : -1;
  const nextModuleLocked =
    activeIdx >= 0 &&
    activeIdx + 1 < modules.length &&
    !isUnlocked(activeIdx + 1);

  function go(to: string) {
    setActive(to);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function toggleComplete(moduleId: string) {
    const isDone = completed.has(moduleId);
    // Optimistic update
    setCompleted((prev) => {
      const next = new Set(prev);
      if (isDone) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
    if (canSaveProgress) {
      setPending(true);
      await markModuleComplete(courseId, moduleId, !isDone).catch(() => {});
      setPending(false);
    }
    if (!isDone && idx < order.length - 1) go(order[idx + 1]);
  }

  return (
    <div className="bg-cream-50">
      {/* ── Hero ── */}
      <header className="border-b border-cream-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <div className="flex items-center gap-2.5 mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-hois.png" alt="Hoïs" className="h-8 w-auto" />
            <span className="text-sm font-semibold text-earth-700">
              Hoïs Inivèsite
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-ink tracking-tight">
            {title}
          </h1>
          {lede && (
            <p className="mt-3 text-base text-earth-700 leading-relaxed max-w-2xl">
              {lede}
            </p>
          )}
          {chips.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {chips.map((c, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cream-100 text-earth-700 text-xs font-semibold"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
          {cta && (
            <Link
              href={cta.href}
              className="mt-6 inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-800 text-cream-50 px-6 py-3 rounded-full font-semibold transition shadow-md"
            >
              {cta.label}
              <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
            </Link>
          )}
        </div>
      </header>

      {/* ── Sticky progress bar ── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-cream-200">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-earth-700 mb-1.5">
            <span>Pwogrè w</span>
            <span>
              {doneCount} / {total} modil {pending && '· n ap sove…'}
            </span>
          </div>
          <div className="h-2 rounded-full bg-cream-200 overflow-hidden">
            <div
              className="h-full bg-forest-600 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <nav className="max-w-4xl mx-auto px-4 md:px-8 pt-5">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <TabButton
            active={active === 'overview'}
            done={false}
            label="Apèsi"
            onClick={() => go('overview')}
          />
          {modules.map((m, i) => {
            const locked = !isUnlocked(i);
            return (
              <TabButton
                key={m.id}
                active={active === m.id}
                done={completed.has(m.id)}
                locked={locked}
                label={`${i + 1}. ${m.title}`}
                onClick={() => {
                  if (!locked) go(m.id);
                }}
              />
            );
          })}
        </div>
      </nav>

      {/* ── Panel ── */}
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {active === 'overview' ? (
          <OverviewPanel
            overview={overview}
            modules={modules}
            lockedCount={lockedCount}
            cta={cta}
            isUnlocked={isUnlocked}
            onStart={() => modules[0] && go(modules[0].id)}
          />
        ) : activeModule ? (
          <ModulePanel
            key={activeModule.id}
            module={activeModule}
            index={modules.findIndex((m) => m.id === activeModule.id)}
          />
        ) : null}

        {/* ── Modnav ── */}
        {activeModule && (
          <>
            <div className="mt-10 flex items-center justify-between gap-3 border-t border-cream-200 pt-6">
              <button
                type="button"
                onClick={() => idx > 0 && go(order[idx - 1])}
                disabled={idx <= 1}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-earth-700 hover:text-ink disabled:opacity-40 transition"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={2.2} /> Anvan
              </button>
              <button
                type="button"
                onClick={() => toggleComplete(activeModule.id)}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-sm',
                  completed.has(activeModule.id)
                    ? 'bg-forest-100 text-forest-800'
                    : 'bg-forest-700 hover:bg-forest-800 text-cream-50'
                )}
              >
                {pending ? (
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
                ) : (
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2.2} />
                )}
                {completed.has(activeModule.id) ? 'Modil fini ✓' : 'Make modil fini'}
              </button>
              <button
                type="button"
                onClick={() =>
                  idx < order.length - 1 &&
                  !nextModuleLocked &&
                  go(order[idx + 1])
                }
                disabled={idx >= order.length - 1 || nextModuleLocked}
                title={
                  nextModuleLocked
                    ? 'Fini modil sa a pou w debloke pwochen an'
                    : undefined
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-earth-700 hover:text-ink disabled:opacity-40 transition"
              >
                Pwochen <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
              </button>
            </div>
            {nextModuleLocked && (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-earth-600">
                <Lock className="w-3 h-3" strokeWidth={2.2} />
                Make modil sa a fini pou w debloke pwochen modil la.
              </p>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-cream-200 bg-white mt-8">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 text-xs text-earth-600">
          Hoïs Inivèsite · HOÏSMedikaplant.com
        </div>
      </footer>
    </div>
  );
}

function TabButton({
  active,
  done,
  locked = false,
  label,
  onClick,
}: {
  active: boolean;
  done: boolean;
  locked?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked}
      aria-disabled={locked}
      title={locked ? 'Fini modil anvan an pou w debloke sa a' : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition',
        locked
          ? 'bg-cream-100 text-earth-400 cursor-not-allowed'
          : active
            ? 'bg-forest-700 text-cream-50 shadow-sm'
            : 'bg-cream-100 text-earth-700 hover:bg-cream-200'
      )}
    >
      {locked ? (
        <Lock className="w-3.5 h-3.5" strokeWidth={2.2} />
      ) : done ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-forest-500" strokeWidth={2.4} />
      ) : (
        <Circle className="w-3.5 h-3.5 opacity-50" strokeWidth={2.2} />
      )}
      {label}
    </button>
  );
}

function OverviewPanel({
  overview,
  modules,
  lockedCount,
  cta,
  isUnlocked,
  onStart,
}: {
  overview: CourseOverview | null;
  modules: InteractiveModule[];
  lockedCount: number;
  cta?: { href: string; label: string } | null;
  isUnlocked: (i: number) => boolean;
  onStart: () => void;
}) {
  return (
    <div className="space-y-8">
      {overview?.intro && (
        <p className="text-lg text-ink leading-relaxed">{overview.intro}</p>
      )}
      {overview?.howItWorks && overview.howItWorks.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-3">
          {overview.howItWorks.map((c, i) => (
            <div
              key={i}
              className="rounded-2xl border-l-4 border-forest-500 bg-white p-4 shadow-card"
            >
              <h3 className="font-display font-bold text-ink text-sm mb-1">
                {c.title}
              </h3>
              <p className="text-xs text-earth-700 leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      )}
      {overview?.objectives && overview.objectives.length > 0 && (
        <div className="rounded-2xl bg-white border border-cream-200 p-5">
          <h3 className="font-display font-bold text-ink mb-3 flex items-center gap-2">
                        Nan fen kou sa a, ou va kapab
          </h3>
          <ul className="space-y-2">
            {overview.objectives.map((o, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink">
                <CheckCircle2
                  className="w-4 h-4 mt-0.5 shrink-0 text-forest-600"
                  strokeWidth={2.2}
                />
                {o}
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Module list */}
      <div>
        <h3 className="font-display font-bold text-ink mb-3">Modil yo</h3>
        <ol className="space-y-2">
          {modules.map((m, i) => {
            const locked = !isUnlocked(i);
            return (
              <li
                key={m.id}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-4 py-3',
                  locked
                    ? 'bg-cream-50 border-cream-200 opacity-75'
                    : 'bg-white border-cream-200'
                )}
              >
                <span
                  className={cn(
                    'grid place-items-center w-6 h-6 rounded-full text-xs font-bold shrink-0',
                    locked
                      ? 'bg-cream-200 text-earth-500'
                      : 'bg-forest-100 text-forest-700'
                  )}
                >
                  {i + 1}
                </span>
                <span className="text-sm font-semibold text-ink flex-1">
                  {m.title}
                </span>
                {locked ? (
                  <Lock
                    className="w-3.5 h-3.5 text-earth-400 shrink-0"
                    strokeWidth={2.2}
                  />
                ) : (
                  m.duration_text && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-earth-600">
                      <Clock className="w-3 h-3" strokeWidth={2.2} />
                      {m.duration_text}
                    </span>
                  )
                )}
              </li>
            );
          })}
        </ol>
      </div>
      {lockedCount > 0 && (
        <div className="rounded-2xl bg-forest-50 border border-forest-200 p-4 flex items-center gap-3 flex-wrap">
          <Lock className="w-5 h-5 text-forest-700 shrink-0" strokeWidth={2.2} />
          <p className="text-sm text-forest-900 flex-1 min-w-[180px]">
            <strong>{lockedCount} modil an plis</strong> disponib apre ou achte
            kou a.
          </p>
          {cta && (
            <Link
              href={cta.href}
              className="shrink-0 inline-flex items-center gap-1 bg-forest-700 hover:bg-forest-800 text-cream-50 px-4 py-2 rounded-full text-sm font-semibold"
            >
              {cta.label}
            </Link>
          )}
        </div>
      )}
      {overview?.disclaimer && (
        <p className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-900">
          {overview.disclaimer}
        </p>
      )}
      {modules.length > 0 && (
        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-800 text-cream-50 px-6 py-3 rounded-full font-semibold transition shadow-md"
        >
          Kòmanse modil 1 <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
}

function ModulePanel({
  module: m,
  index,
}: {
  module: InteractiveModule;
  index: number;
}) {
  const c = m.content;
  return (
    <article className="space-y-6">
      <div className="rounded-2xl border-l-4 border-forest-500 bg-white p-5 shadow-card">
        <div className="text-xs font-bold uppercase tracking-wider text-forest-700 mb-1">
          Modil {index + 1}
          {m.duration_text ? ` · ${m.duration_text}` : ''}
        </div>
        <h2 className="font-display text-2xl font-bold text-ink">{m.title}</h2>
      </div>

      {c?.objective && (
        <div className="rounded-xl bg-forest-50 border border-forest-100 p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-forest-700 mb-1">
            Objektif
          </div>
          <p className="text-sm text-ink leading-relaxed">{c.objective}</p>
        </div>
      )}

      {(c?.lessons ?? []).map((lesson, li) => (
        <section key={li} className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-lg font-bold text-ink">
              {lesson.title}
            </h3>
            {lesson.time && (
              <span className="text-[11px] text-earth-600 shrink-0">
                {lesson.time}
              </span>
            )}
          </div>
          {lesson.blocks.map((b, bi) => (
            <BlockView key={bi} block={b} />
          ))}
        </section>
      ))}

      {c?.activity && (
        <div className="rounded-xl bg-gold-50 border border-gold-200 p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-gold-700 mb-1">
            {c.activity.title ?? 'Egzèsis refleksyon'}
          </div>
          <p className="text-sm text-ink leading-relaxed">{c.activity.text}</p>
        </div>
      )}

      {c?.quiz && c.quiz.length > 0 && (
        <div className="rounded-2xl bg-white border border-cream-200 p-5 space-y-5">
          <h3 className="font-display font-bold text-ink">Tcheke sa w aprann</h3>
          {c.quiz.map((q, qi) => (
            <QuizQuestionView key={qi} moduleId={m.id} qi={qi} q={q} />
          ))}
        </div>
      )}
    </article>
  );
}

// One quiz question — single choice (radio), multiple choice (checkboxes) or
// short answer. Grading is done by the server (gradeAnswer): the correct answer
// is never in the client, so a student cannot read it from the page.
function QuizQuestionView({
  moduleId,
  qi,
  q,
}: {
  moduleId: string;
  qi: number;
  q: QuizQuestion;
}) {
  const type = q.type ?? 'single';
  const [single, setSingle] = React.useState<number | null>(null);
  const [multi, setMulti] = React.useState<Set<number>>(new Set());
  const [text, setText] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [result, setResult] = React.useState<{
    correct: boolean;
    feedback?: string;
    answerText?: string;
  } | null>(null);

  const canSubmit =
    type === 'single'
      ? single !== null
      : type === 'multiple'
        ? multi.size > 0
        : text.trim().length > 0;

  async function submit() {
    if (result || !canSubmit || pending) return;
    setPending(true);
    const response =
      type === 'single' ? single! : type === 'multiple' ? [...multi] : text;
    const r = await gradeAnswer(moduleId, qi, response).catch(() => ({
      correct: false,
    }));
    setResult(r);
    setPending(false);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-ink">{q.q}</p>

      {type === 'short' ? (
        <input
          value={text}
          disabled={!!result}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          className="w-full text-sm px-3 py-2 rounded-lg border border-cream-200 bg-white focus:outline-none focus:ring-2 focus:ring-forest-200 disabled:opacity-70"
          placeholder="Repons ou…"
        />
      ) : (
        <div className="grid gap-2">
          {(q.choices ?? []).map((choice, ci) => {
            const chosen = type === 'single' ? single === ci : multi.has(ci);
            return (
              <button
                key={ci}
                type="button"
                disabled={!!result}
                onClick={() => {
                  if (result) return;
                  if (type === 'single') setSingle(ci);
                  else
                    setMulti((prev) => {
                      const n = new Set(prev);
                      if (n.has(ci)) n.delete(ci);
                      else n.add(ci);
                      return n;
                    });
                }}
                className={cn(
                  'text-left text-sm px-3 py-2 rounded-lg border transition flex items-center gap-2',
                  chosen
                    ? 'border-forest-400 bg-forest-50'
                    : 'border-cream-200 hover:border-forest-300 bg-white'
                )}
              >
                <span
                  className={cn(
                    'grid place-items-center w-4 h-4 shrink-0 border',
                    type === 'multiple' ? 'rounded' : 'rounded-full',
                    chosen
                      ? 'bg-forest-600 border-forest-600'
                      : 'border-earth-400'
                  )}
                >
                  {chosen && (
                    <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />
                  )}
                </span>
                {choice}
              </button>
            );
          })}
        </div>
      )}

      {!result ? (
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit || pending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forest-700 hover:bg-forest-800 disabled:opacity-50 text-cream-50 text-sm font-semibold"
        >
          {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.4} />}
          Verifye
        </button>
      ) : (
        <p
          className={cn(
            'text-xs px-3 py-2 rounded-lg',
            result.correct
              ? 'bg-forest-50 text-forest-800'
              : 'bg-rose-50 text-rose-800'
          )}
        >
          {result.correct
            ? '✓ Kòrèk!'
            : `✗ Bon repons: ${result.answerText ?? ''}`}
          {result.feedback ? ` — ${result.feedback}` : ''}
        </p>
      )}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'p':
      return <p className="text-sm text-ink leading-relaxed">{block.text}</p>;
    case 'list':
      return (
        <ul className="space-y-1.5 pl-1">
          {block.items.map((it, i) => (
            <li key={i} className="flex gap-2 text-sm text-ink">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-forest-500 shrink-0" />
              {it}
            </li>
          ))}
        </ul>
      );
    case 'keybox':
      return (
        <div className="rounded-xl bg-cream-100 border-l-4 border-gold-500 p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gold-700 mb-1">
            <Lightbulb className="w-3.5 h-3.5" strokeWidth={2.4} />
            {block.title ?? 'Lide kle'}
          </div>
          <p className="text-sm text-ink leading-relaxed">{block.text}</p>
        </div>
      );
    case 'mythbox':
      return (
        <div className="rounded-xl bg-white border border-cream-200 p-4 space-y-2">
          <div className="flex items-start gap-2">
            <ShieldAlert
              className="w-4 h-4 mt-0.5 shrink-0 text-rose-600"
              strokeWidth={2.2}
            />
            <p className="text-sm text-ink">
              <span className="font-bold text-rose-700">Manti:</span>{' '}
              {block.myth}
            </p>
          </div>
          <p className="text-sm text-ink pl-6">
            <span className="font-bold text-forest-700">Verite:</span>{' '}
            {block.truth}
          </p>
        </div>
      );
    default:
      return null;
  }
}
