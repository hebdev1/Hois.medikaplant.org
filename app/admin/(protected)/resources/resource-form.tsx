'use client';

import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import {
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Play,
  Volume2,
} from 'lucide-react';
import {
  createResource,
  updateResource,
  type AdminResourceState,
} from './actions';
import ResourceUpload, { type UploadedFile } from './resource-upload';
import type { Database } from '@/types/database';
import { cn } from '@/lib/utils';

type ResourceRow = Database['public']['Tables']['resources']['Row'];

type Props =
  | { mode: 'create'; resource?: undefined }
  | { mode: 'edit'; resource: ResourceRow };

const TYPE_OPTIONS: {
  value: 'pdf' | 'video' | 'audio';
  label: string;
  icon: typeof FileText;
  hint: string;
}[] = [
  {
    value: 'pdf',
    label: 'PDF',
    icon: FileText,
    hint: 'Gid, manyèl, modèl, dokiman ki dirèkteman pou enprime',
  },
  {
    value: 'video',
    label: 'Videyo',
    icon: Play,
    hint: 'Yoga, demonstrasyon, jardinage, vizit',
  },
  {
    value: 'audio',
    label: 'Odyo',
    icon: Volume2,
    hint: 'Meditasyon, rakontwa, podcast, soufle',
  },
];

const PLAN_OPTIONS: { value: 'basic' | 'premium' | 'vip'; label: string }[] = [
  { value: 'basic', label: 'Bazilik' },
  { value: 'premium', label: 'Sitwonèl' },
  { value: 'vip', label: 'Melis' },
];

const CATEGORY_SUGGESTIONS = [
  'Esansyèl',
  'Mouvman',
  'Lespri',
  'Plant',
  'Resèt',
  'Aprann',
  'Listwa',
  'Zouti',
  'Detox',
  'Kalm',
  'Manje',
];

export default function ResourceForm(props: Props) {
  const isEdit = props.mode === 'edit';
  const resource = isEdit ? props.resource : null;

  const boundAction = isEdit
    ? updateResource.bind(null, resource!.id)
    : createResource;

  const [state, formAction] = useFormState<AdminResourceState, FormData>(
    boundAction,
    {}
  );

  const [type, setType] = React.useState<'pdf' | 'video' | 'audio'>(
    (resource?.type as 'pdf' | 'video' | 'audio' | undefined) ?? 'pdf'
  );

  // The file URL + size + duration are populated by the upload component.
  // We mirror them into form state so they ride along on submit as hidden
  // inputs (and so we can disable submit until a file is attached).
  const [fileUrl, setFileUrl] = React.useState<string>(resource?.file_url ?? '');
  const [fileSize, setFileSize] = React.useState<number | null>(
    resource?.file_size_bytes ?? null
  );
  const [duration, setDuration] = React.useState<number | null>(
    resource?.duration_seconds ?? null
  );

  function onUploaded(f: UploadedFile) {
    setFileUrl(f.url);
    setFileSize(f.sizeBytes);
    setDuration(f.durationSeconds);
    // Helpful UX: suggest a type from the detected kind, but only if the
    // admin hasn't already picked one different.
    if (
      f.detectedKind === 'pdf' ||
      f.detectedKind === 'video' ||
      f.detectedKind === 'audio'
    ) {
      setType(f.detectedKind);
    }
  }

  function onCleared() {
    setFileUrl('');
    setFileSize(null);
    setDuration(null);
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-xs font-bold uppercase tracking-wide text-earth-700 mb-1.5"
        >
          Tit
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={200}
          defaultValue={resource?.title ?? ''}
          className="w-full px-3 py-2.5 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
          placeholder="ex. Gid konplè Dyabèt Tip 2"
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-xs font-bold uppercase tracking-wide text-earth-700 mb-1.5"
        >
          Deskripsyon
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={600}
          defaultValue={resource?.description ?? ''}
          className="w-full px-3 py-2.5 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 resize-y leading-relaxed"
          placeholder="Yon ti rezime sou kontni an…"
        />
      </div>

      {/* ── File upload ─────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wide text-earth-700 mb-2">
          Fichye <span className="text-rose-700">*</span>
        </label>
        <ResourceUpload
          initialUrl={resource?.file_url ?? null}
          initialSizeBytes={resource?.file_size_bytes ?? null}
          initialDurationSeconds={resource?.duration_seconds ?? null}
          onUploaded={onUploaded}
          onCleared={onCleared}
        />
        {/* Hidden inputs ride along on submit */}
        <input type="hidden" name="file_url" value={fileUrl} />
        <input
          type="hidden"
          name="file_size_bytes"
          value={fileSize ?? ''}
        />
        <input
          type="hidden"
          name="duration_seconds"
          value={duration ?? ''}
        />
      </div>

      {/* Type */}
      <fieldset>
        <legend className="block text-xs font-bold uppercase tracking-wide text-earth-700 mb-2">
          Tip (otomatikman detekte — w ka chanje l)
        </legend>
        <input type="hidden" name="type" value={type} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {TYPE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = type === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={cn(
                  'flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition',
                  active
                    ? 'border-forest-500 bg-forest-50'
                    : 'border-cream-200 bg-white hover:border-forest-300'
                )}
              >
                <span
                  className={cn(
                    'grid place-items-center w-8 h-8 rounded-lg shrink-0',
                    active
                      ? 'bg-forest-600 text-cream-50'
                      : 'bg-cream-100 text-earth-700'
                  )}
                >
                  <Icon className="w-4 h-4" strokeWidth={2.2} />
                </span>
                <div className="min-w-0">
                  <div
                    className={cn(
                      'text-sm font-bold',
                      active ? 'text-forest-800' : 'text-ink'
                    )}
                  >
                    {opt.label}
                  </div>
                  <div className="text-[11px] text-earth-600 leading-snug mt-0.5">
                    {opt.hint}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Plan + Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="plan_required"
            className="block text-xs font-bold uppercase tracking-wide text-earth-700 mb-1.5"
          >
            Plan obligatwa
          </label>
          <select
            id="plan_required"
            name="plan_required"
            defaultValue={resource?.plan_required ?? 'basic'}
            className="w-full px-3 py-2.5 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
          >
            {PLAN_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-earth-500">
            Sèl manm ki gen plan sa oswa pi wo ap ka aksè dosye a.
          </p>
        </div>
        <div>
          <label
            htmlFor="category"
            className="block text-xs font-bold uppercase tracking-wide text-earth-700 mb-1.5"
          >
            Tag (kategori)
          </label>
          <input
            id="category"
            name="category"
            list="category-suggestions"
            maxLength={50}
            defaultValue={resource?.category ?? ''}
            className="w-full px-3 py-2.5 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
            placeholder="ex. Esansyèl"
          />
          <datalist id="category-suggestions">
            {CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <p className="mt-1 text-[11px] text-earth-500">
            Ti badj ki parèt sou kat la (opsyonèl).
          </p>
        </div>
      </div>

      {/* Published toggle */}
      <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-cream-50 border border-cream-200">
        <div>
          <div className="text-sm font-bold text-ink">Pibliye</div>
          <div className="text-[11px] text-earth-600 mt-0.5 leading-relaxed">
            Lè li pibliye, dosye a parèt nan paj Telechajman pou tout manm
            ki gen plan ki kòrèk la. Manm yo resevwa yon notifikasyon
            otomatik.
          </div>
        </div>
        <label className="inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            name="published"
            defaultChecked={resource?.published ?? false}
            className="sr-only peer"
          />
          <span className="relative w-11 h-6 bg-cream-300 peer-checked:bg-forest-600 rounded-full transition-colors">
            <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
          </span>
        </label>
      </div>

      {/* Feedback */}
      {state.error && (
        <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2.5 text-sm text-rose-800">
          <AlertCircle
            className="w-4 h-4 mt-0.5 shrink-0"
            strokeWidth={2.2}
          />
          <span>{state.error}</span>
        </div>
      )}
      {state.ok && (
        <div className="flex items-center gap-2 rounded-xl bg-forest-50 border border-forest-200 px-3 py-2.5 text-sm text-forest-800">
          <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2.2} />
          Chanjman yo anrejistre.
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-cream-200">
        <Link
          href="/admin/resources"
          className="text-sm font-semibold text-earth-700 hover:text-ink transition"
        >
          ← Anile
        </Link>
        <SubmitButton mode={props.mode} disabled={!fileUrl} />
      </div>
    </form>
  );
}

function SubmitButton({
  mode,
  disabled,
}: {
  mode: 'create' | 'edit';
  disabled: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      title={disabled ? 'Monte yon fichye anvan' : undefined}
      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 disabled:cursor-not-allowed text-cream-50 rounded-lg transition shadow-plant"
    >
      {pending ? (
        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
      ) : (
        <Save className="w-4 h-4" strokeWidth={2.2} />
      )}
      {mode === 'create' ? 'Kreye resous' : 'Anrejistre chanjman'}
    </button>
  );
}
