'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  createProgramTask,
  updateProgramTask,
  deleteProgramTask,
} from './actions';
import {
  CONDITION_CATALOG,
  CONDITION_GROUP_LABEL,
  type ConditionGroup,
  describeCondition,
} from '@/lib/conditions/catalog';
import type { Database } from '@/types/database';

type ProgramTaskRow = Database['public']['Tables']['program_tasks']['Row'];

const CHIP_KINDS: Array<{ value: string; label: string; tone: string }> = [
  { value: 'forest', label: '🌿 Forest', tone: 'bg-forest-100 text-forest-700' },
  { value: 'gold',   label: '🌟 Gold',   tone: 'bg-gold-100 text-gold-700' },
  { value: 'cream',  label: '🥛 Cream',  tone: 'bg-cream-200 text-earth-700' },
  { value: 'rose',   label: '🌸 Rose',   tone: 'bg-rose-100 text-rose-700' },
  { value: 'sky',    label: '💧 Sky',    tone: 'bg-sky-100 text-sky-700' },
];

type EditTarget =
  | { kind: 'new'; day: number }
  | { kind: 'edit'; day: number; task: ProgramTaskRow };

export default function ScheduleEditor({
  programId,
  programSlug,
  totalDays,
  days,
  tasksByDay,
}: {
  programId: string;
  programSlug: string;
  totalDays: number;
  days: number[];
  tasksByDay: Record<string, ProgramTaskRow[]>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [filterDay, setFilterDay] = useState<number | null>(null);

  // Quick scrolling helper — clicking a number in the day index jumps to
  // the matching grid cell without a re-render.
  function scrollToDay(day: number) {
    const el = document.getElementById(`day-${day}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
      {/* Day index strip — sticky scroll-jumper for the 30-day grid */}
      <nav className="sticky top-0 z-20 -mx-5 md:-mx-8 lg:-mx-10 px-5 md:px-8 lg:px-10 py-3 bg-white/85 backdrop-blur border-y border-cream-200 mb-5 overflow-x-auto">
        <div className="flex items-center gap-1">
          <span className="text-[10px] uppercase tracking-wider text-earth-500 font-bold mr-2 shrink-0">
            Jou:
          </span>
          {days.map((day) => {
            const count = tasksByDay[String(day)]?.length ?? 0;
            const isFiltered = filterDay === day;
            return (
              <button
                key={day}
                onClick={() => {
                  scrollToDay(day);
                  setFilterDay(isFiltered ? null : day);
                }}
                className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition ${
                  isFiltered
                    ? 'bg-forest-700 text-cream-50'
                    : count > 0
                    ? 'bg-forest-50 text-forest-700 hover:bg-forest-100'
                    : 'bg-cream-50 text-earth-500 hover:bg-cream-100'
                }`}
                title={`Jou ${day} · ${count} tach`}
              >
                {day}
                {count > 0 && (
                  <span className={`text-[9px] font-mono ${isFiltered ? 'text-cream-200' : 'text-earth-500'}`}>
                    ·{count}
                  </span>
                )}
              </button>
            );
          })}
          {filterDay !== null && (
            <button
              onClick={() => setFilterDay(null)}
              className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-earth-600 hover:text-ink ml-2"
            >
              <X className="w-3 h-3" strokeWidth={2.4} />
              Filtre
            </button>
          )}
        </div>
      </nav>

      {/* 30-day grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {days
          .filter((d) => filterDay === null || d === filterDay)
          .map((day) => {
            const tasks = tasksByDay[String(day)] ?? [];
            return (
              <section
                key={day}
                id={`day-${day}`}
                className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden scroll-mt-24"
              >
                <header className="px-4 py-3 border-b border-cream-100 flex items-center justify-between bg-gradient-to-r from-cream-50 to-white">
                  <h3 className="font-display text-base font-bold text-ink">
                    Jou {day}
                    <span className="text-earth-500 font-normal text-xs ml-2">
                      / {totalDays}
                    </span>
                  </h3>
                  <span className="text-[10px] font-mono text-earth-500">
                    {tasks.length} tach
                  </span>
                </header>
                {tasks.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-earth-500 italic">
                    Pa gen tach pou jou sa
                  </div>
                ) : (
                  <ul className="divide-y divide-cream-100">
                    {tasks.map((t) => {
                      const chipMeta =
                        CHIP_KINDS.find((c) => c.value === t.chip_kind) ??
                        CHIP_KINDS[0];
                      const tags = (t.condition_tags ?? []).map((s) =>
                        describeCondition(s)
                      );
                      return (
                        <li
                          key={t.id}
                          className="px-4 py-3 group hover:bg-cream-50/40 transition"
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-sm font-semibold text-ink leading-snug">
                                  {t.title}
                                </span>
                                {t.chip_label && (
                                  <span
                                    className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${chipMeta.tone}`}
                                  >
                                    {t.chip_label}
                                  </span>
                                )}
                              </div>
                              {t.meta && (
                                <p className="text-[11px] text-earth-600 mb-1">
                                  {t.meta}
                                </p>
                              )}
                              {tags.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {tags.map((tag) => (
                                    <span
                                      key={tag.slug}
                                      className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-forest-50 text-forest-700"
                                    >
                                      <span aria-hidden>{tag.icon}</span>
                                      {tag.label}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="inline-block text-[10px] italic text-earth-500 mt-1">
                                  Pa gen tag — vizib pou tout manm
                                </span>
                              )}
                            </div>
                            <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button
                                onClick={() =>
                                  setEditing({ kind: 'edit', day, task: t })
                                }
                                aria-label="Edit"
                                className="grid place-items-center w-7 h-7 rounded-lg bg-cream-100 hover:bg-cream-200 text-earth-700 transition"
                              >
                                <Edit2 className="w-3 h-3" strokeWidth={2.4} />
                              </button>
                              <DeleteButton
                                taskId={t.id}
                                programSlug={programSlug}
                              />
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <footer className="px-4 py-2 border-t border-cream-100">
                  <button
                    onClick={() => setEditing({ kind: 'new', day })}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-forest-50 hover:bg-forest-100 text-forest-700 text-xs font-semibold transition"
                  >
                    <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
                    Ajoute yon tach jou {day}
                  </button>
                </footer>
              </section>
            );
          })}
      </div>

      {/* Modal editor */}
      {editing && (
        <TaskModal
          target={editing}
          programId={programId}
          programSlug={programSlug}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function DeleteButton({
  taskId,
  programSlug,
}: {
  taskId: string;
  programSlug: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm('Efase tach sa?')) return;
        startTransition(async () => {
          const res = await deleteProgramTask({ taskId, programSlug });
          if (!res.ok) {
            alert(res.error);
            return;
          }
          router.refresh();
        });
      }}
      aria-label="Efase"
      className="grid place-items-center w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition disabled:opacity-60"
    >
      <Trash2 className="w-3 h-3" strokeWidth={2.4} />
    </button>
  );
}

function TaskModal({
  target,
  programId,
  programSlug,
  onClose,
  onSaved,
}: {
  target: EditTarget;
  programId: string;
  programSlug: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initial = target.kind === 'edit' ? target.task : null;
  const [title, setTitle] = useState(initial?.title ?? '');
  const [meta, setMeta] = useState(initial?.meta ?? '');
  const [chipLabel, setChipLabel] = useState(initial?.chip_label ?? '');
  const [chipKind, setChipKind] = useState(initial?.chip_kind ?? 'forest');
  const [conditionTags, setConditionTags] = useState<string[]>(
    initial?.condition_tags ?? []
  );
  const [dayNumber, setDayNumber] = useState(target.day);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleTag(slug: string) {
    setConditionTags((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      if (target.kind === 'new') {
        const res = await createProgramTask({
          programId,
          programSlug,
          dayNumber,
          title,
          meta,
          chipLabel,
          chipKind,
          conditionTags,
        });
        if (!res.ok) {
          setError(res.error);
          return;
        }
      } else {
        const res = await updateProgramTask({
          taskId: target.task.id,
          programSlug,
          dayNumber,
          title,
          meta,
          chipLabel,
          chipKind,
          conditionTags,
        });
        if (!res.ok) {
          setError(res.error);
          return;
        }
      }
      onSaved();
    });
  }

  // Group catalog by family so the picker stays scannable.
  const groupedCatalog = new Map<ConditionGroup, typeof CONDITION_CATALOG>();
  for (const c of CONDITION_CATALOG) {
    const arr = groupedCatalog.get(c.group) ?? [];
    arr.push(c);
    groupedCatalog.set(c.group, arr);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <header className="sticky top-0 px-5 py-4 border-b border-cream-200 bg-white flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-earth-500 font-bold">
              {target.kind === 'new' ? 'Nouvo tach' : 'Edit tach'}
            </div>
            <h3 className="font-display text-lg font-bold text-ink">
              Jou {dayNumber}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="grid place-items-center w-9 h-9 rounded-lg bg-cream-100 hover:bg-cream-200 text-earth-700 transition"
          >
            <X className="w-4 h-4" strokeWidth={2.4} />
          </button>
        </header>

        <div className="p-5 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
              <span>{error}</span>
            </div>
          )}

          <Field label="Jou nan plan">
            <input
              type="number"
              min={1}
              max={365}
              value={dayNumber}
              onChange={(e) => setDayNumber(Math.max(1, Number(e.target.value) || 1))}
              className={inputCls}
            />
          </Field>

          <Field label="Tit tach" required>
            <input
              type="text"
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Egzanp: Pran 1 tas tizan jenjanm anvan manje"
              className={inputCls}
            />
          </Field>

          <Field label="Meta (sub-tèks)" hint="Optionnel — yon ti detay anplis">
            <input
              type="text"
              maxLength={300}
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              placeholder="Egzanp: 15-20 min anvan manje midi"
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Chip label" hint='Egzanp: "Tizan"'>
              <input
                type="text"
                maxLength={20}
                value={chipLabel}
                onChange={(e) => setChipLabel(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Chip koulè">
              <select
                value={chipKind}
                onChange={(e) => setChipKind(e.target.value)}
                className={inputCls}
              >
                {CHIP_KINDS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field
            label="Kondisyon sante"
            hint="Si vid, tach la vizib pou tout manm. Si w chwazi yon oswa plis, sèl manm ki gen youn nan kondisyon sa yo ki ap wè tach la."
          >
            <div className="space-y-3 mt-1 rounded-xl border border-cream-200 p-3 bg-cream-50/40 max-h-72 overflow-y-auto">
              {Array.from(groupedCatalog.entries()).map(([group, items]) => (
                <div key={group}>
                  <div className="text-[10px] uppercase tracking-wider text-earth-500 font-bold mb-1.5">
                    {CONDITION_GROUP_LABEL[group]}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((c) => {
                      const selected = conditionTags.includes(c.slug);
                      return (
                        <button
                          key={c.slug}
                          type="button"
                          onClick={() => toggleTag(c.slug)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium transition ${
                            selected
                              ? 'bg-forest-700 text-cream-50 shadow-sm'
                              : 'bg-white text-earth-700 border border-cream-200 hover:border-forest-300'
                          }`}
                        >
                          <span aria-hidden>{c.icon}</span>
                          {c.label}
                          {selected && (
                            <CheckCircle2
                              className="w-3 h-3 ml-0.5"
                              strokeWidth={2.4}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {conditionTags.length > 0 && (
              <div className="mt-2 text-[11px] text-earth-600">
                <strong>{conditionTags.length}</strong> kondisyon chwazi —
                sèl manm ki gen youn ladan yo ap wè tach sa.
              </div>
            )}
          </Field>
        </div>

        <footer className="sticky bottom-0 px-5 py-4 border-t border-cream-200 bg-white flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={pending}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-earth-700 hover:bg-cream-50 transition"
          >
            Anile
          </button>
          <button
            onClick={submit}
            disabled={pending || title.trim().length < 3}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 text-sm font-semibold transition"
          >
            <Save className="w-3.5 h-3.5" strokeWidth={2.4} />
            {pending ? 'Anrejistreman...' : 'Anrejistre'}
          </button>
        </footer>
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm text-ink placeholder:text-earth-400 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-200 transition';

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-earth-700 mb-1">
        {label}
        {required && <span className="text-rose-600 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-earth-500 mt-1">{hint}</p>}
    </div>
  );
}
