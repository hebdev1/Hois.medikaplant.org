'use client';

import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Save,
  Trash2,
  Loader2,
  ChevronUp,
  ChevronDown,
  Plus,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Video,
  Clock,
  Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  saveModule,
  deleteModule,
  reorderModule,
  type ModuleState,
} from './actions';

type ModuleRow = {
  id: string;
  course_id: string;
  display_order: number;
  title: string;
  description: string | null;
  duration_text: string | null;
  video_url: string | null;
  resource_links: Array<{ label: string; url: string }> | null;
  preview: boolean;
};

type Props = {
  courseId: string;
  initial: ModuleRow[];
};

export default function ModulesManager({ courseId, initial }: Props) {
  const router = useRouter();
  const [showNew, setShowNew] = React.useState(false);

  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-4 md:p-5 shadow-card space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-sm font-bold text-ink uppercase tracking-wide">
            Modil ({initial.length})
          </h2>
          <p className="text-[11px] text-earth-600 mt-0.5">
            Chak modil reprezante yon leson nan klas la. Lis sa parèt sou paj
            piblik /klas/[slug] la nan lòd ki anba a.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNew((s) => !s)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-lg transition"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
          {showNew ? 'Anile' : 'Ajoute modil'}
        </button>
      </header>

      {showNew && (
        <ModuleForm
          courseId={courseId}
          moduleId={null}
          onSaved={() => {
            setShowNew(false);
            router.refresh();
          }}
        />
      )}

      {initial.length === 0 && !showNew && (
        <p className="text-sm text-earth-600 italic">
          Pa gen okenn modil pou kounye a. Klike "Ajoute modil" pou kòmanse
          ranpli plan klas la.
        </p>
      )}

      <ul className="space-y-3">
        {initial.map((m, idx) => (
          <li key={m.id}>
            <ModuleCard
              courseId={courseId}
              module={m}
              canMoveUp={idx > 0}
              canMoveDown={idx < initial.length - 1}
              onChanged={() => router.refresh()}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── Per-module card with collapse + reorder ──────────────────────────────

function ModuleCard({
  courseId,
  module: m,
  canMoveUp,
  canMoveDown,
  onChanged,
}: {
  courseId: string;
  module: ModuleRow;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onChanged: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [moving, setMoving] = React.useState<'up' | 'down' | null>(null);

  async function onReorder(dir: 'up' | 'down') {
    if (moving) return;
    setMoving(dir);
    try {
      await reorderModule(courseId, m.id, dir);
      onChanged();
    } finally {
      setMoving(null);
    }
  }

  return (
    <div className="border border-cream-200 rounded-xl bg-cream-50/50 overflow-hidden">
      {/* Collapsed header — clickable to expand */}
      <div className="flex items-center gap-2 p-3">
        <div className="flex flex-col items-center gap-0.5">
          <button
            type="button"
            onClick={() => onReorder('up')}
            disabled={!canMoveUp || !!moving}
            title="Monte"
            className="grid place-items-center w-5 h-5 rounded text-earth-600 hover:bg-cream-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {moving === 'up' ? (
              <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.2} />
            ) : (
              <ChevronUp className="w-3 h-3" strokeWidth={2.4} />
            )}
          </button>
          <button
            type="button"
            onClick={() => onReorder('down')}
            disabled={!canMoveDown || !!moving}
            title="Desann"
            className="grid place-items-center w-5 h-5 rounded text-earth-600 hover:bg-cream-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {moving === 'down' ? (
              <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.2} />
            ) : (
              <ChevronDown className="w-3 h-3" strokeWidth={2.4} />
            )}
          </button>
        </div>
        <span className="grid place-items-center w-7 h-7 rounded-lg bg-forest-100 text-forest-800 text-xs font-bold shrink-0">
          {m.display_order}
        </span>
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          className="flex-1 min-w-0 text-left"
        >
          <div className="text-sm font-semibold text-ink truncate">
            {m.title}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-earth-600 mt-0.5">
            {m.duration_text && (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" strokeWidth={2.2} />
                {m.duration_text}
              </span>
            )}
            {m.video_url && (
              <span className="inline-flex items-center gap-1 text-forest-700">
                <Video className="w-3 h-3" strokeWidth={2.2} />
                Videyo
              </span>
            )}
            {m.preview && (
              <span className="inline-flex items-center gap-1 text-amber-700">
                <Eye className="w-3 h-3" strokeWidth={2.2} />
                Preview
              </span>
            )}
            {(m.resource_links?.length ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-earth-700">
                <LinkIcon className="w-3 h-3" strokeWidth={2.2} />
                {m.resource_links!.length} resous
              </span>
            )}
          </div>
        </button>
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          className="text-xs font-semibold text-earth-600 hover:text-ink px-2 py-1 rounded"
        >
          {open ? 'Fèmen' : 'Edite'}
        </button>
      </div>

      {open && (
        <div className="border-t border-cream-200 p-4 bg-white">
          <ModuleForm
            courseId={courseId}
            moduleId={m.id}
            initial={m}
            onSaved={() => {
              setOpen(false);
              onChanged();
            }}
            onDelete={() => {
              setOpen(false);
              onChanged();
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Add/edit form (shared between new + existing) ────────────────────────

function ModuleForm({
  courseId,
  moduleId,
  initial,
  onSaved,
  onDelete,
}: {
  courseId: string;
  moduleId: string | null;
  initial?: ModuleRow;
  onSaved: () => void;
  onDelete?: () => void;
}) {
  const action = saveModule.bind(null, courseId, moduleId);
  const [state, formAction] = useFormState<ModuleState, FormData>(action, {});

  // Fire onSaved once after a successful save so the parent can refresh
  // its module list + collapse this form. We track ok+id to avoid
  // firing on the initial empty state.
  const lastOk = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (state.ok && state.id !== lastOk.current) {
      lastOk.current = state.id;
      onSaved();
    }
  }, [state.ok, state.id, onSaved]);

  const [linksText, setLinksText] = React.useState(
    (initial?.resource_links ?? [])
      .map((l) => `${l.label} | ${l.url}`)
      .join('\n')
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid sm:grid-cols-[1fr_120px] gap-3">
        <Field label="Tit modil la" required>
          <input
            name="title"
            defaultValue={initial?.title ?? ''}
            required
            className={inputClass}
            placeholder="Modil 1 — Idantifye 3 plant kle"
          />
        </Field>
        <Field label="Lòd">
          <input
            type="number"
            name="display_order"
            min={0}
            defaultValue={initial?.display_order ?? 0}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Deskripsyon" help="Sa moun nan ap aprann nan modil sa a.">
        <textarea
          name="description"
          rows={3}
          defaultValue={initial?.description ?? ''}
          className={cn(inputClass, 'resize-y')}
          placeholder="Aprann jwenn Mountain Bwa nan jaden w + ki diferans li ak plant ki sanble avè l."
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Dirasyon" help="Egz: 25 min, 1h 10min">
          <input
            name="duration_text"
            defaultValue={initial?.duration_text ?? ''}
            className={inputClass}
          />
        </Field>
        <Field label="Lyen videyo (opsyonèl)">
          <input
            name="video_url"
            type="url"
            defaultValue={initial?.video_url ?? ''}
            className={cn(inputClass, 'font-mono text-xs')}
            placeholder="https://vimeo.com/... oswa https://youtu.be/..."
          />
        </Field>
      </div>

      <Field
        label="Resous adisyonèl (yon liy chak : Tit | URL)"
        help="Egz: Gid PDF | https://example.com/gid.pdf"
      >
        <textarea
          name="resource_links"
          rows={3}
          value={linksText}
          onChange={(e) => setLinksText(e.target.value)}
          className={cn(inputClass, 'resize-y font-mono text-[11px]')}
          placeholder={'Gid plant santiniye PDF | https://example.com/gid.pdf\nNòt egzamen | https://example.com/not.pdf'}
        />
      </Field>

      <Toggle
        name="preview"
        label="Pèmèt preview (san abònman)"
        description="Lè aktif, modil sa a parèt sou pòsyon piblik /klas/[slug] la menm pou vizitè ki pa abone."
        defaultChecked={initial?.preview ?? false}
      />

      <SaveBar
        state={state}
        moduleId={moduleId}
        courseId={courseId}
        onDelete={onDelete}
      />
    </form>
  );
}

function SaveBar({
  state,
  moduleId,
  courseId,
  onDelete,
}: {
  state: ModuleState;
  moduleId: string | null;
  courseId: string;
  onDelete?: () => void;
}) {
  const { pending } = useFormStatus();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  async function handleDelete() {
    if (!moduleId || !onDelete) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      window.setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    setDeleting(true);
    try {
      await deleteModule(courseId, moduleId);
      onDelete();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-cream-200">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 rounded-lg transition"
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
        ) : (
          <Save className="w-3.5 h-3.5" strokeWidth={2.2} />
        )}
        {moduleId ? 'Anrejistre' : 'Kreye modil'}
      </button>

      {moduleId && onDelete && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition',
            confirmDelete
              ? 'bg-rose-600 text-white hover:bg-rose-700'
              : 'text-rose-600 hover:bg-rose-50 border border-rose-200'
          )}
        >
          {deleting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
          ) : (
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2.2} />
          )}
          {confirmDelete ? 'Konfime efas modil la' : 'Efase modil la'}
        </button>
      )}

      {state.error && (
        <span className="text-xs text-rose-700 inline-flex items-center gap-1">
          <AlertCircle className="w-3 h-3" strokeWidth={2.4} /> {state.error}
        </span>
      )}
      {state.ok && (
        <span className="text-xs text-forest-700 inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" strokeWidth={2.4} /> Anrejistre.
        </span>
      )}
    </div>
  );
}

// ─── Primitives ────────────────────────────────────────────────────────────

const inputClass =
  'w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 text-ink';

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
      {help && (
        <p className="text-[11px] text-earth-500 mt-1 leading-snug">{help}</p>
      )}
    </label>
  );
}

function Toggle({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = React.useState(defaultChecked ?? false);
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2 rounded-lg bg-cream-50 border border-cream-200">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-ink flex items-center gap-1.5">
          {checked ? (
            <Eye className="w-3.5 h-3.5" strokeWidth={2.2} />
          ) : (
            <EyeOff className="w-3.5 h-3.5" strokeWidth={2.2} />
          )}
          {label}
        </div>
        {description && (
          <div className="text-[11px] text-earth-600 mt-0.5 leading-snug">
            {description}
          </div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => setChecked((s) => !s)}
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
