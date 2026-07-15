'use client';

import React from 'react';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import {
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Eye,
  EyeOff,
  Shield,
  CalendarRange,
  Copy,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  saveProgram,
  deleteProgram,
  duplicateProgram,
  type ProgramState,
} from './actions';
import {
  CONDITION_CATALOG,
  CONDITION_GROUP_LABEL,
  type ConditionGroup,
} from '@/lib/conditions/catalog';
import type { Database } from '@/types/database';

type ProgramRow = Database['public']['Tables']['programs']['Row'];

type Props = {
  mode: 'create' | 'edit';
  initial?: ProgramRow;
};

const PRESET_COLORS = [
  '#65881a',
  '#3D7222',
  '#93b031',
  '#e78e17',
  '#985c0c',
  '#B73A3A',
  '#5C3D2E',
  '#3A2218',
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export default function ProgramForm({ mode, initial }: Props) {
  const router = useRouter();
  const id = mode === 'edit' && initial ? initial.id : null;
  const action = saveProgram.bind(null, id);
  const [state, formAction] = useFormState<ProgramState, FormData>(action, {});

  const [v, setV] = React.useState({
    name: initial?.name ?? '',
    slug: initial?.slug ?? '',
    description: initial?.description ?? '',
    short_tagline: initial?.short_tagline ?? '',
    // Widen enum-typed fields to plain string so the Segment onChange
    // (which passes a raw string) doesn't fail the TS check. The server
    // action re-validates the value before writing to the DB.
    level: (initial?.level ?? 'tout_nivo') as string,
    variant: initial?.variant ?? '',
    total_days: initial?.total_days ?? 30,
    milestone_days: (initial?.milestone_days ?? [7, 14, 21, 30]).join(', '),
    plan_required: (initial?.plan_required ?? 'basic') as string,
    condition_tags: new Set<string>(initial?.condition_tags ?? []),
    accent_color: initial?.accent_color ?? '#65881a',
    hero_color: initial?.hero_color ?? '',
    active: initial?.active ?? true,
  });

  const [slugTouched, setSlugTouched] = React.useState(mode === 'edit');
  React.useEffect(() => {
    if (slugTouched) return;
    setV((p) => ({ ...p, slug: slugify(p.name) }));
  }, [v.name, slugTouched]);

  function set<K extends keyof typeof v>(k: K, val: (typeof v)[K]) {
    setV((p) => ({ ...p, [k]: val }));
  }

  function toggleTag(slug: string) {
    setV((p) => {
      const next = new Set(p.condition_tags);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return { ...p, condition_tags: next };
    });
  }

  const groupedConditions = React.useMemo(() => {
    const groups = new Map<ConditionGroup, typeof CONDITION_CATALOG>();
    for (const c of CONDITION_CATALOG) {
      const arr = groups.get(c.group) ?? [];
      arr.push(c);
      groups.set(c.group, arr);
    }
    return Array.from(groups.entries());
  }, []);

  return (
    <form action={formAction} className="grid lg:grid-cols-[1fr_340px] gap-6">
      {/* ── LEFT ─────────────────────────────────────────────────────────── */}
      <div className="space-y-5">
        <Section title="Idantite">
          <Field label="Non pwotokòl la" required>
            <input
              name="name"
              value={v.name}
              onChange={(e) => set('name', e.target.value)}
              required
              className={inputClass}
              placeholder="Fondasyon Dyabèt · 30 jou"
            />
          </Field>
          <Field label="Slug (URL)" help="A-z, 0-9, ak tire sèlman.">
            <input
              name="slug"
              value={v.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set('slug', slugify(e.target.value));
              }}
              className={cn(inputClass, 'font-mono')}
              placeholder="fondasyon-dyabet"
            />
          </Field>
          <Field label="Tit kout (tagline)" help="Yon fraz ki paret sou kat pwotokòl la.">
            <input
              name="short_tagline"
              value={v.short_tagline}
              onChange={(e) => set('short_tagline', e.target.value)}
              className={inputClass}
              placeholder="Estabilize sik nan san w san medikaman"
            />
          </Field>
          <Field label="Deskripsyon konplè">
            <textarea
              name="description"
              rows={5}
              value={v.description}
              onChange={(e) => set('description', e.target.value)}
              className={cn(inputClass, 'resize-y')}
              placeholder="Sa moun nan pral aprann, pou konbyen tan, sa yo ap fè…"
            />
          </Field>
        </Section>

        <Section title="Kalandriye + rit">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Total jou">
              <input
                name="total_days"
                type="number"
                min={1}
                max={365}
                value={v.total_days}
                onChange={(e) =>
                  set(
                    'total_days',
                    Math.max(1, Math.min(365, Number(e.target.value) || 1))
                  )
                }
                className={inputClass}
              />
            </Field>
            <Field label="Variant (opsyonèl)">
              <input
                name="variant"
                value={v.variant}
                onChange={(e) => set('variant', e.target.value)}
                className={inputClass}
                placeholder="egz: entansif, dous, evanjelik"
              />
            </Field>
          </div>
          <Field
            label="Milestone jou (separe ak vigil)"
            help="Jou kote yo pral gen selebrasyon oswa evalyasyon."
          >
            <input
              name="milestone_days"
              value={v.milestone_days}
              onChange={(e) => set('milestone_days', e.target.value)}
              className={cn(inputClass, 'font-mono')}
              placeholder="7, 14, 21, 30"
            />
          </Field>
        </Section>

        <Section title="Kondisyon sib">
          <p className="text-[11px] text-earth-600 -mt-1 mb-2">
            Chwazi ki kondisyon sante pwotokòl sa a adrese. Manm ki gen youn
            oswa plizyè nan tag sa yo pral otomatikman jwenn ak/oswa
            rekòmande pwotokòl sa a.
          </p>
          <div className="space-y-3">
            {groupedConditions.map(([group, items]) => (
              <div key={group}>
                <div className="text-[10px] font-bold uppercase tracking-wider text-earth-500 mb-1">
                  {CONDITION_GROUP_LABEL[group]}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((c) => {
                    const on = v.condition_tags.has(c.slug);
                    return (
                      <button
                        key={c.slug}
                        type="button"
                        onClick={() => toggleTag(c.slug)}
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition border',
                          on
                            ? 'bg-forest-700 border-forest-700 text-cream-50'
                            : 'bg-white border-cream-200 text-earth-700 hover:border-forest-300'
                        )}
                      >
                        <span aria-hidden>{c.icon}</span>
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {v.condition_tags.size === 0 && (
            <p className="text-[11px] text-amber-700 mt-2">
              ⚠ Pa gen tag chwazi — pwotokòl sa a ap parèt kòm "jeneral" (tout
              moun).
            </p>
          )}
          <input
            type="hidden"
            name="condition_tags"
            value={Array.from(v.condition_tags).join(',')}
          />
        </Section>
      </div>

      {/* ── RIGHT (settings sidebar) ─────────────────────────────────────── */}
      <aside className="space-y-5">
        <Section title="Vizibilite">
          <Toggle
            name="active"
            label="Aktif"
            description="Lè li ON, pwotokòl la parèt pou manm yo (dashboard + auto-enrollment)."
            checked={v.active}
            onChange={(b) => set('active', b)}
            Icon={v.active ? Eye : EyeOff}
          />
        </Section>

        <Section title="Plan gate">
          <p className="text-[11px] text-earth-600 -mt-1 mb-2 inline-flex items-start gap-1">
            <Shield className="w-3 h-3 shrink-0 mt-0.5" strokeWidth={2.4} />
            <span>
              Ki plan minimòm ki gen aksè. Nivo ki pi wo yo gen aksè
              otomatikman (VIP → wè tout, Sitwonèl → wè Sitwonèl + Bazilik).
            </span>
          </p>
          <Segment
            name="plan_required"
            value={v.plan_required}
            onChange={(val) => set('plan_required', val)}
            options={[
              { value: 'basic', label: 'Bazilik (tout)' },
              { value: 'premium', label: 'Sitwonèl+' },
              { value: 'vip', label: 'Melis sèlman' },
            ]}
          />
        </Section>

        <Section title="Klasifikasyon">
          <Field label="Nivo difikilte">
            <Segment
              name="level"
              value={v.level}
              onChange={(val) => set('level', val)}
              options={[
                { value: 'debutan', label: 'Debutan' },
                { value: 'entermedye', label: 'Entèm.' },
                { value: 'avanse', label: 'Avanse' },
                { value: 'tout_nivo', label: 'Tout' },
              ]}
            />
          </Field>
        </Section>

        <Section title="Aparans">
          <Field label="Koulè aksan">
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('accent_color', c)}
                  aria-label={c}
                  className={cn(
                    'w-7 h-7 rounded-lg border-2 transition',
                    v.accent_color === c
                      ? 'border-ink ring-2 ring-cream-200'
                      : 'border-white hover:border-cream-300'
                  )}
                  style={{ background: c }}
                />
              ))}
              <input
                type="text"
                value={v.accent_color}
                onChange={(e) => set('accent_color', e.target.value)}
                className={cn(inputClass, 'font-mono w-24 text-xs')}
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
            <input type="hidden" name="accent_color" value={v.accent_color} />
          </Field>
          <Field label="Koulè ewo (opsyonèl)">
            <input
              type="text"
              name="hero_color"
              value={v.hero_color}
              onChange={(e) => set('hero_color', e.target.value)}
              className={cn(inputClass, 'font-mono text-xs')}
              placeholder="#3D7222"
            />
          </Field>
        </Section>

        <SubmitBar mode={mode} state={state} />

        {mode === 'edit' && initial && (
          <ProgramSideActions initial={initial} router={router} />
        )}
      </aside>
    </form>
  );
}

// ─── Right-side extra actions (edit mode only) ─────────────────────────────

function ProgramSideActions({
  initial,
  router,
}: {
  initial: ProgramRow;
  router: ReturnType<typeof useRouter>;
}) {
  const [busy, setBusy] = React.useState<'dup' | 'del' | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  async function onDuplicate() {
    if (busy) return;
    setBusy('dup');
    try {
      const res = await duplicateProgram(initial.id);
      if (res.ok) {
        router.push(`/admin/programs/${res.newId}`);
      } else {
        window.alert(res.error);
      }
    } finally {
      setBusy(null);
    }
  }

  async function onDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      window.setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    if (busy) return;
    setBusy('del');
    try {
      const res = await deleteProgram(initial.id);
      if (res.ok) {
        router.push('/admin/programs');
      } else {
        window.alert(res.error);
      }
    } finally {
      setBusy(null);
      setConfirmDelete(false);
    }
  }

  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-4 md:p-5 shadow-card space-y-2">
      <h2 className="font-display text-sm font-bold text-ink uppercase tracking-wide">
        Lòt aksyon
      </h2>
      <Link
        href={`/admin/health/programs/${initial.slug}`}
        className="w-full inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-forest-50 hover:bg-forest-100 text-forest-800 rounded-lg transition"
      >
        <CalendarRange className="w-3.5 h-3.5" strokeWidth={2.2} />
        Ouvri kalandriye tach yo
        <ExternalLink className="w-3 h-3 ml-auto" strokeWidth={2.2} />
      </Link>
      <button
        type="button"
        onClick={onDuplicate}
        disabled={busy === 'dup'}
        className="w-full inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-earth-700 hover:bg-cream-100 border border-cream-200 rounded-lg transition"
      >
        {busy === 'dup' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
        ) : (
          <Copy className="w-3.5 h-3.5" strokeWidth={2.2} />
        )}
        Duplike (kopi enaktif)
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={busy === 'del'}
        className={cn(
          'w-full inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition',
          confirmDelete
            ? 'bg-rose-600 text-white hover:bg-rose-700'
            : 'text-rose-600 hover:bg-rose-50 border border-rose-200'
        )}
      >
        {busy === 'del' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
        ) : (
          <Trash2 className="w-3.5 h-3.5" strokeWidth={2.2} />
        )}
        {confirmDelete ? 'Konfime — efase pwotokòl la' : 'Efase pwotokòl la'}
      </button>
    </section>
  );
}

// ─── Primitives ────────────────────────────────────────────────────────────

const inputClass =
  'w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 text-ink';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-4 md:p-5 shadow-card space-y-4">
      <h2 className="font-display text-sm font-bold text-ink uppercase tracking-wide">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  help,
  children,
}: {
  label: string;
  required?: boolean;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-earth-700">
        {label}
        {required && <span className="text-rose-600 ml-0.5">*</span>}
      </span>
      <div className="mt-1">{children}</div>
      {help && <p className="text-[11px] text-earth-500 mt-1 leading-snug">{help}</p>}
    </label>
  );
}

function Segment({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex p-1 bg-cream-100 rounded-xl border border-cream-200 w-full">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 px-2 py-1.5 text-[11px] font-semibold rounded-lg transition-all',
              active
                ? 'bg-white text-forest-800 shadow-sm'
                : 'text-earth-600 hover:text-ink'
            )}
            aria-pressed={active}
          >
            {opt.label}
          </button>
        );
      })}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}

function Toggle({
  name,
  label,
  description,
  checked,
  onChange,
  Icon,
}: {
  name: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (b: boolean) => void;
  Icon?: typeof Eye;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-ink flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={2} />}
          {label}
        </div>
        {description && (
          <div className="text-[11px] text-earth-600 mt-0.5">{description}</div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors shrink-0',
          checked ? 'bg-forest-600' : 'bg-cream-300'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
            checked && 'translate-x-5'
          )}
        />
      </button>
      {checked && <input type="hidden" name={name} value="on" />}
    </div>
  );
}

function SubmitBar({ mode, state }: { mode: 'create' | 'edit'; state: ProgramState }) {
  const { pending } = useFormStatus();
  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-4 md:p-5 shadow-card space-y-3 sticky top-4">
      <button
        type="submit"
        disabled={pending}
        className="w-full inline-flex items-center justify-center gap-2 bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 font-semibold px-5 py-3 rounded-xl transition"
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
        ) : (
          <Save className="w-4 h-4" strokeWidth={2.4} />
        )}
        {mode === 'create' ? 'Kreye pwotokòl la' : 'Anrejistre chanjman'}
      </button>

      {state.error && (
        <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
          <span>{state.error}</span>
        </div>
      )}
      {state.ok && (
        <div className="flex items-center gap-2 rounded-xl bg-forest-50 border border-forest-200 px-3 py-2 text-sm text-forest-800">
          <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2.2} />
          <span>Chanjman yo anrejistre.</span>
        </div>
      )}

      <Link
        href="/admin/programs"
        className="inline-flex items-center gap-1 text-xs font-semibold text-earth-700 hover:text-ink"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.2} />
        Tounen nan lis pwotokòl yo
      </Link>
    </section>
  );
}
