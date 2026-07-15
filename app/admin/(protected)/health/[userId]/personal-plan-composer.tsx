'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Wand2,
  Calendar,
  Target,
  Stethoscope,
  Leaf,
  Activity,
  Heart,
  Droplet,
  Sun,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  createPersonalProgram,
  type PersonalPlanTask,
} from '../actions';

type ChipKind = 'forest' | 'gold' | 'cream';

type Task = PersonalPlanTask & { _id: string };

const CHIP_KINDS: { value: ChipKind; label: string; tone: string }[] = [
  { value: 'forest', label: 'Vèt', tone: 'bg-forest-100 text-forest-700' },
  { value: 'gold', label: 'Lò', tone: 'bg-gold-100 text-gold-600' },
  { value: 'cream', label: 'Krèm', tone: 'bg-cream-200 text-earth-700' },
];

// ── Condition-aware task templates ──────────────────────────────────────
// Used by the "Sigjere" button to pre-fill a tailored list. Maps a known
// condition or health goal to a coherent set of daily tasks.

type Suggestion = {
  match: (ctx: { conditions: string[]; healthGoal: string | null }) => boolean;
  label: string;
  tasks: PersonalPlanTask[];
};

const SUGGESTIONS: Suggestion[] = [
  {
    label: 'Dyabèt — kontwòl sik nan san',
    match: (ctx) =>
      ctx.conditions.includes('diabetes_type_1') ||
      ctx.conditions.includes('diabetes_type_2') ||
      ctx.healthGoal === 'manage_diabetes',
    tasks: [
      { title: 'Note sik nan san anvan dejene', chip_label: 'A jeun', chip_kind: 'forest' },
      { title: 'Bwè 2 vè dlo cho ak yon ti grenn jenjanm', chip_label: 'Maten', chip_kind: 'forest' },
      { title: 'Tizan mounn-bwa apre dejene', chip_label: 'Tizan', chip_kind: 'gold' },
      { title: 'Mache 20 minit apre manje midi', chip_label: 'Aktivite', chip_kind: 'cream' },
      { title: 'Note sik nan san anvan dòmi', chip_label: 'Aswè', chip_kind: 'forest' },
    ],
  },
  {
    label: 'Tansyon wo — ekilib kè',
    match: (ctx) =>
      ctx.conditions.includes('hypertension') ||
      ctx.healthGoal === 'manage_hypertension',
    tasks: [
      { title: 'Note tansyon anvan dejene', chip_label: 'Maten', chip_kind: 'forest' },
      { title: 'Bwè tizan fèy zoranj anmè', chip_label: 'Tizan', chip_kind: 'gold' },
      { title: '10 minit respirasyon nan dyafram', chip_label: 'Espirityèl', chip_kind: 'cream' },
      { title: 'Diminye sèl nan manje midi', chip_label: 'Manje', chip_kind: 'forest' },
      { title: 'Mache lejè 15 minit aswè', chip_label: 'Aktivite', chip_kind: 'cream' },
      { title: 'Note tansyon avan dòmi', chip_label: 'Aswè', chip_kind: 'forest' },
    ],
  },
  {
    label: 'Pèdi pwa — abitid jou pa jou',
    match: (ctx) =>
      ctx.healthGoal === 'lose_weight',
    tasks: [
      { title: 'Peze w chak maten apre twalèt', chip_label: 'Mezi', chip_kind: 'forest' },
      { title: 'Bwè 2 vè dlo anvan chak manje', chip_label: 'Idratasyon', chip_kind: 'gold' },
      { title: 'Tizan fèy zaboka apre dejene', chip_label: 'Tizan', chip_kind: 'gold' },
      { title: 'Mache 30 minit', chip_label: 'Aktivite', chip_kind: 'cream' },
      { title: 'Note sa ou manje (1 foto pa manje)', chip_label: 'Jounal', chip_kind: 'forest' },
    ],
  },
  {
    label: 'Ekilib espirityèl — pratik HOÏS',
    match: (ctx) => ctx.healthGoal === 'spiritual_balance',
    tasks: [
      { title: 'Refleksyon HOÏS jou a (li li sou tablodebò)', chip_label: 'HOÏS', chip_kind: 'gold' },
      { title: '10 minit silans + respirasyon', chip_label: 'Espirityèl', chip_kind: 'cream' },
      { title: 'Tizan bazilik avan dòmi', chip_label: 'Tizan', chip_kind: 'gold' },
      { title: 'Ekri yon entansyon pou jou a', chip_label: 'Jounal', chip_kind: 'forest' },
    ],
  },
  {
    label: 'Detox — netwayaj jeneral',
    match: (ctx) => ctx.healthGoal === 'detox',
    tasks: [
      { title: 'Bwè dlo cho ak sitwon a jeun', chip_label: 'Maten', chip_kind: 'gold' },
      { title: 'Tizan mountain-bwa apre dejene', chip_label: 'Tizan', chip_kind: 'gold' },
      { title: 'Manje fwi ak legim — pa gen vyann jodi a', chip_label: 'Manje', chip_kind: 'forest' },
      { title: 'Mache 30 minit', chip_label: 'Aktivite', chip_kind: 'cream' },
      { title: 'Dòmi anvan 10è aswè', chip_label: 'Repo', chip_kind: 'cream' },
    ],
  },
];

// Generic baseline if nothing matches (or as a fallback default starter)
const GENERIC_TASKS: PersonalPlanTask[] = [
  { title: 'Bwè 8 vè dlo nan jounen an', chip_label: 'Idratasyon', chip_kind: 'gold' },
  { title: 'Mache 20 minit', chip_label: 'Aktivite', chip_kind: 'cream' },
  { title: 'Tizan bazilik aswè', chip_label: 'Tizan', chip_kind: 'gold' },
];

function newTaskId() {
  return `t_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export default function PersonalPlanComposer({
  userId,
  conditions,
  healthGoal,
  existingProgramName,
  existingProgramTaskCount,
}: {
  userId: string;
  conditions: string[];
  healthGoal: string | null;
  existingProgramName: string | null;
  existingProgramTaskCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(!existingProgramName);
  const [name, setName] = React.useState('');
  const [variant, setVariant] = React.useState('');
  const [totalDays, setTotalDays] = React.useState(30);
  const [planRequired, setPlanRequired] =
    React.useState<'basic' | 'premium' | 'vip'>('basic');
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const matchingSuggestions = React.useMemo(
    () =>
      SUGGESTIONS.filter((s) =>
        s.match({ conditions, healthGoal })
      ),
    [conditions, healthGoal]
  );

  function loadSuggestion(s: Suggestion) {
    setName((cur) => cur || s.label);
    setVariant((cur) => cur || s.label);
    setTasks(s.tasks.map((t) => ({ ...t, _id: newTaskId() })));
  }

  function addTask() {
    setTasks((prev) => [
      ...prev,
      {
        _id: newTaskId(),
        title: '',
        chip_label: '',
        chip_kind: 'forest',
      },
    ]);
  }

  function updateTask(id: string, patch: Partial<PersonalPlanTask>) {
    setTasks((prev) =>
      prev.map((t) => (t._id === id ? { ...t, ...patch } : t))
    );
  }

  function removeTask(id: string) {
    setTasks((prev) => prev.filter((t) => t._id !== id));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await createPersonalProgram(userId, {
      name,
      variant,
      total_days: totalDays,
      plan_required: planRequired,
      tasks: tasks.map(({ _id, ...rest }) => rest),
    });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDone(true);
    setTimeout(() => {
      setDone(false);
      setOpen(false);
      router.refresh();
    }, 1400);
  }

  if (!open) {
    return (
      <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
        <header className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-forest-700 font-bold mb-1">
              <Sparkles className="w-3 h-3" strokeWidth={2.4} />
              Hoïs Plan pèsonèl
            </div>
            <h2 className="font-display text-lg md:text-xl font-bold text-ink">
              {existingProgramName}
            </h2>
            <p className="text-xs text-earth-600 mt-1">
              {existingProgramTaskCount} tach · aktif sou tablodebò manm nan
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-lg transition"
          >
            <Wand2 className="w-3.5 h-3.5" strokeWidth={2.2} />
            Kreye yon nouvo plan
          </button>
        </header>
        <p className="text-[11px] text-earth-500">
          Lè ou kreye yon nouvo plan, ansyen an ap dezaktive otomatikman.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
      <header className="mb-5">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-forest-700 font-bold mb-2">
          <Sparkles className="w-3 h-3" strokeWidth={2.4} />
          Hoïs Plan pèsonèl
        </div>
        <h2 className="font-display text-lg md:text-xl font-bold text-ink">
          Konstwi yon plan pou manm sa
        </h2>
        <p className="text-sm text-earth-600 mt-1">
          Kreye yon pwotokòl chak jou ki sib kondisyon ak objektif manm nan.
          Plan an ap parèt kòm pwotokòl aktif li sou tablodebò a.
        </p>

        {/* Patient context */}
        <div className="mt-4 flex items-start gap-2 flex-wrap">
          {conditions.length > 0 ? (
            conditions.slice(0, 5).map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-cream-100 text-earth-700 border border-cream-200 px-2 py-1 rounded-full"
              >
                <Stethoscope className="w-3 h-3" strokeWidth={2.2} />
                {c.replace(/_/g, ' ')}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-earth-500 italic">
              Manm nan pa deklare okenn kondisyon.
            </span>
          )}
          {healthGoal && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-forest-100 text-forest-700 px-2 py-1 rounded-full">
              <Target className="w-3 h-3" strokeWidth={2.2} />
              Objektif: {healthGoal.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      </header>

      {/* Suggestions strip */}
      {matchingSuggestions.length > 0 && (
        <div className="mb-5 rounded-xl bg-amber-50/60 border border-amber-200 p-3">
          <div className="flex items-center gap-2 text-[11px] font-bold text-amber-800 mb-2">
            <Wand2 className="w-3.5 h-3.5" strokeWidth={2.4} />
            Pwopozisyon ki kole ak pwofil sa
          </div>
          <div className="flex flex-wrap gap-2">
            {matchingSuggestions.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => loadSuggestion(s)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 transition"
              >
                {s.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() =>
                setTasks(GENERIC_TASKS.map((t) => ({ ...t, _id: newTaskId() })))
              }
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-cream-200 hover:bg-cream-50 text-earth-700 transition"
            >
              Baz jeneral
            </button>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Non plan an" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={120}
              placeholder="Plan jere dyabèt 30 jou"
              className={inputClass}
            />
          </Field>
          <Field label="Vairyan / sou-tit (opsyonèl)">
            <input
              type="text"
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
              maxLength={120}
              placeholder="Detox & Sik"
              className={inputClass}
            />
          </Field>
          <Field label="Dire (jou)" required>
            <input
              type="number"
              value={totalDays}
              onChange={(e) => setTotalDays(Number(e.target.value))}
              min={1}
              max={365}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Plan minimòm" required>
            <select
              value={planRequired}
              onChange={(e) =>
                setPlanRequired(e.target.value as 'basic' | 'premium' | 'vip')
              }
              className={inputClass}
            >
              <option value="basic">Bazilik (tout manm)</option>
              <option value="premium">Sitwonèl (Premium+)</option>
              <option value="vip">Melis (VIP sèlman)</option>
            </select>
          </Field>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-earth-700">
              Tach chak jou{' '}
              <span className="text-earth-500 font-normal">
                ({tasks.length}/30)
              </span>
            </label>
            <button
              type="button"
              onClick={addTask}
              disabled={tasks.length >= 30}
              className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700 hover:text-forest-800 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
              Ajoute yon tach
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="rounded-xl bg-cream-50 border border-dashed border-cream-200 p-5 text-center text-sm text-earth-600">
              Pa gen tach ankò. Chwazi yon pwopozisyon anwo a oswa klike
              &quot;Ajoute yon tach&quot;.
            </div>
          ) : (
            <ul className="space-y-2">
              {tasks.map((t, idx) => (
                <li
                  key={t._id}
                  className="rounded-xl border border-cream-200 bg-cream-50/40 p-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="grid place-items-center w-7 h-7 rounded-full bg-white text-earth-700 border border-cream-200 text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1 grid sm:grid-cols-[1fr_140px_120px] gap-2">
                      <input
                        type="text"
                        value={t.title}
                        onChange={(e) =>
                          updateTask(t._id, { title: e.target.value })
                        }
                        placeholder="Tit tach la (egz. 'Bwè 2 vè dlo cho maten an')"
                        className={inputClass}
                        maxLength={200}
                      />
                      <input
                        type="text"
                        value={t.chip_label ?? ''}
                        onChange={(e) =>
                          updateTask(t._id, { chip_label: e.target.value })
                        }
                        placeholder="Etikèt"
                        className={inputClass}
                        maxLength={30}
                      />
                      <select
                        value={t.chip_kind ?? 'forest'}
                        onChange={(e) =>
                          updateTask(t._id, {
                            chip_kind: e.target.value as ChipKind,
                          })
                        }
                        className={inputClass}
                      >
                        {CHIP_KINDS.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTask(t._id)}
                      aria-label="Retire tach"
                      className="grid place-items-center w-7 h-7 rounded-lg text-rose-700 hover:bg-rose-50 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={2.2} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
            <span>{error}</span>
          </div>
        )}
        {done && (
          <div className="rounded-xl bg-forest-50 border border-forest-200 px-3 py-2 text-sm text-forest-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2.2} />
            <span>Plan kreye + aktive pou manm nan.</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          {existingProgramName && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={pending}
              className="px-3 py-2 text-sm font-semibold text-earth-700 hover:text-ink transition"
            >
              Anile
            </button>
          )}
          <button
            type="submit"
            disabled={pending || tasks.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 rounded-lg transition"
          >
            {pending ? (
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
            ) : (
              <Sparkles className="w-4 h-4" strokeWidth={2.4} />
            )}
            Aktive plan pou manm nan
          </button>
        </div>
      </form>
    </section>
  );
}

const inputClass =
  'w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 text-ink';

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-earth-700">
        {label}
        {required && <span className="text-rose-600 ml-0.5">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
