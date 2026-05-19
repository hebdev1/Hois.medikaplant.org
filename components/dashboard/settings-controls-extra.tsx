'use client';

/**
 * Additional settings form controls used by the expanded /dashboard/settings
 * page: select dropdown, date, textarea, checklist multi-select, avatar
 * uploader, and a danger-zone button with inline confirmation.
 *
 * Each control follows the same contract as the controls in
 * settings-controls.tsx: receive current value, call `commit(next)` which
 * returns { ok, error? }. Local state updates optimistically; rollback on
 * rejection. A green "Anrejistre" pulse confirms success.
 */

import React from 'react';
import Image from 'next/image';
import {
  Check,
  Loader2,
  AlertCircle,
  Camera,
  Trash2,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ControlStatus = 'idle' | 'saving' | 'saved' | 'error';

function useStatus() {
  const [status, setStatus] = React.useState<ControlStatus>('idle');
  const [error, setError] = React.useState<string | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function pulseSaved() {
    setStatus('saved');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus('idle'), 1400);
  }

  return { status, setStatus, error, setError, pulseSaved };
}

function StatusBadge({ status }: { status: ControlStatus }) {
  if (status === 'saving') {
    return (
      <Loader2 className="w-3.5 h-3.5 text-earth-500 animate-spin" strokeWidth={2.2} />
    );
  }
  if (status === 'saved') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-forest-700">
        <Check className="w-3 h-3" strokeWidth={2.6} /> Anrejistre
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-rose-700">
        <AlertCircle className="w-3 h-3" strokeWidth={2.4} /> Erè
      </span>
    );
  }
  return null;
}

function Row({
  label,
  description,
  status,
  control,
  inline = true,
}: {
  label: string;
  description?: string;
  status: ControlStatus;
  control: React.ReactNode;
  inline?: boolean;
}) {
  return (
    <div className="pt-5 first:pt-0">
      <div
        className={cn(
          inline
            ? 'flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3'
            : 'space-y-3'
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-ink">{label}</div>
          {description && (
            <div className="text-xs text-earth-600 mt-0.5 leading-relaxed">
              {description}
            </div>
          )}
        </div>
        <div className="flex items-start gap-2">
          <StatusBadge status={status} />
          {control}
        </div>
      </div>
    </div>
  );
}

// ─── Select (dropdown) ──────────────────────────────────────────────────────
export function SelectSetting<T extends string>({
  label,
  description,
  value,
  options,
  placeholder,
  commit,
}: {
  label: string;
  description?: string;
  value: T | null;
  options: { value: T; label: string }[];
  placeholder?: string;
  commit: (v: T | null) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [local, setLocal] = React.useState<T | null>(value);
  const { status, setStatus, setError, pulseSaved } = useStatus();

  React.useEffect(() => setLocal(value), [value]);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const raw = e.target.value;
    const next = (raw === '' ? null : (raw as T));
    const prev = local;
    setLocal(next);
    setStatus('saving');
    setError(null);
    const res = await commit(next);
    if (!res.ok) {
      setLocal(prev);
      setError(res.error ?? 'Erè');
      setStatus('error');
      return;
    }
    pulseSaved();
  }

  return (
    <Row
      label={label}
      description={description}
      status={status}
      control={
        <div className="relative">
          <select
            value={local ?? ''}
            onChange={onChange}
            disabled={status === 'saving'}
            className="appearance-none pr-8 pl-3 py-1.5 text-sm bg-cream-50 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 min-w-[180px] disabled:opacity-60"
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-500 pointer-events-none"
            strokeWidth={2}
          />
        </div>
      }
    />
  );
}

// ─── Date ───────────────────────────────────────────────────────────────────
export function DateSetting({
  label,
  description,
  value,
  commit,
}: {
  label: string;
  description?: string;
  value: string | null; // ISO date 'YYYY-MM-DD'
  commit: (v: string | null) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [local, setLocal] = React.useState(value ?? '');
  const { status, setStatus, setError, pulseSaved } = useStatus();

  React.useEffect(() => setLocal(value ?? ''), [value]);

  async function persist() {
    const next = local === '' ? null : local;
    if (next === value) return;
    const prev = value;
    setStatus('saving');
    setError(null);
    const res = await commit(next);
    if (!res.ok) {
      setLocal(prev ?? '');
      setError(res.error ?? 'Erè');
      setStatus('error');
      return;
    }
    pulseSaved();
  }

  return (
    <Row
      label={label}
      description={description}
      status={status}
      control={
        <input
          type="date"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={persist}
          aria-label={label}
          className="px-3 py-1.5 text-sm bg-cream-50 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
        />
      }
    />
  );
}

// ─── Textarea ───────────────────────────────────────────────────────────────
export function TextareaSetting({
  label,
  description,
  value,
  placeholder,
  rows = 3,
  commit,
}: {
  label: string;
  description?: string;
  value: string | null;
  placeholder?: string;
  rows?: number;
  commit: (v: string | null) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [local, setLocal] = React.useState(value ?? '');
  const { status, setStatus, setError, pulseSaved } = useStatus();

  React.useEffect(() => setLocal(value ?? ''), [value]);

  async function persist() {
    const next = local.trim() === '' ? null : local.trim();
    if (next === value) return;
    const prev = value;
    setStatus('saving');
    setError(null);
    const res = await commit(next);
    if (!res.ok) {
      setLocal(prev ?? '');
      setError(res.error ?? 'Erè');
      setStatus('error');
      return;
    }
    pulseSaved();
  }

  return (
    <Row
      label={label}
      description={description}
      status={status}
      inline={false}
      control={
        <textarea
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={persist}
          placeholder={placeholder}
          rows={rows}
          aria-label={label}
          className="w-full px-3 py-2 text-sm bg-cream-50 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 leading-relaxed resize-y"
        />
      }
    />
  );
}

// ─── MultiSelect (checklist) ────────────────────────────────────────────────
export function MultiSelectSetting({
  label,
  description,
  value,
  options,
  commit,
  allowCustom = false,
}: {
  label: string;
  description?: string;
  value: string[];
  options: { value: string; label: string; icon?: React.ReactNode }[];
  commit: (v: string[]) => Promise<{ ok: boolean; error?: string }>;
  allowCustom?: boolean;
}) {
  const [local, setLocal] = React.useState<string[]>(value);
  const [custom, setCustom] = React.useState('');
  const { status, setStatus, setError, pulseSaved } = useStatus();

  React.useEffect(() => setLocal(value), [value]);

  async function persist(next: string[]) {
    const prev = local;
    setLocal(next);
    setStatus('saving');
    setError(null);
    const res = await commit(next);
    if (!res.ok) {
      setLocal(prev);
      setError(res.error ?? 'Erè');
      setStatus('error');
      return;
    }
    pulseSaved();
  }

  function toggle(v: string) {
    const next = local.includes(v) ? local.filter((x) => x !== v) : [...local, v];
    persist(next);
  }

  function addCustom() {
    const v = custom.trim();
    if (!v || v.length > 64 || local.includes(v)) return;
    setCustom('');
    persist([...local, v]);
  }

  // Custom values that aren't in the predefined option list
  const knownValues = new Set(options.map((o) => o.value));
  const customValues = local.filter((v) => !knownValues.has(v));

  return (
    <Row
      label={label}
      description={description}
      status={status}
      inline={false}
      control={
        <div className="space-y-3 w-full">
          <div className="grid sm:grid-cols-2 gap-2">
            {options.map((opt) => {
              const checked = local.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  disabled={status === 'saving'}
                  aria-pressed={checked}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-xl border text-sm text-left transition disabled:cursor-not-allowed',
                    checked
                      ? 'bg-forest-50 border-forest-200 text-forest-800'
                      : 'bg-cream-50 border-cream-200 text-ink hover:border-forest-200'
                  )}
                >
                  <span
                    className={cn(
                      'grid place-items-center w-4 h-4 rounded border-2 shrink-0',
                      checked
                        ? 'bg-forest-600 border-forest-600 text-cream-50'
                        : 'bg-white border-cream-300 text-transparent'
                    )}
                  >
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </span>
                  {opt.icon && (
                    <span className="text-base shrink-0">{opt.icon}</span>
                  )}
                  <span className="flex-1">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {customValues.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {customValues.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-medium"
                >
                  {v}
                  <button
                    type="button"
                    onClick={() => persist(local.filter((x) => x !== v))}
                    className="hover:text-rose-700 transition"
                    aria-label={`Retire ${v}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {allowCustom && (
            <div className="flex gap-2">
              <input
                type="text"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustom();
                  }
                }}
                placeholder="Ajoute pa ou…"
                maxLength={64}
                className="flex-1 px-3 py-1.5 text-sm bg-cream-50 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
              />
              <button
                type="button"
                onClick={addCustom}
                disabled={!custom.trim() || status === 'saving'}
                className="px-3 py-1.5 text-sm font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-50 text-cream-50 rounded-lg transition"
              >
                Ajoute
              </button>
            </div>
          )}
        </div>
      }
    />
  );
}

// ─── Avatar upload ──────────────────────────────────────────────────────────
export function AvatarUpload({
  label,
  description,
  currentUrl,
  fallbackInitials,
  uploadAction,
  removeAction,
}: {
  label: string;
  description?: string;
  currentUrl: string | null;
  fallbackInitials: string;
  uploadAction: (formData: FormData) => Promise<{ ok: boolean; error?: string; url?: string }>;
  removeAction: () => Promise<{ ok: boolean; error?: string }>;
}) {
  const [preview, setPreview] = React.useState<string | null>(currentUrl);
  const { status, setStatus, error, setError, pulseSaved } = useStatus();
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => setPreview(currentUrl), [currentUrl]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setStatus('saving');
    setError(null);

    const fd = new FormData();
    fd.append('file', file);
    const res = await uploadAction(fd);

    URL.revokeObjectURL(localPreview);

    if (!res.ok) {
      setPreview(currentUrl);
      setError(res.error ?? 'Erè');
      setStatus('error');
      return;
    }
    setPreview(res.url ?? null);
    pulseSaved();
    // Reset input so picking the same file twice still triggers change
    if (inputRef.current) inputRef.current.value = '';
  }

  async function onRemove() {
    if (!preview) return;
    setStatus('saving');
    setError(null);
    const res = await removeAction();
    if (!res.ok) {
      setError(res.error ?? 'Erè');
      setStatus('error');
      return;
    }
    setPreview(null);
    pulseSaved();
  }

  return (
    <Row
      label={label}
      description={description}
      status={status}
      inline={false}
      control={
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-forest-100 ring-4 ring-cream-100">
            {preview ? (
              <Image
                src={preview}
                alt={label}
                fill
                sizes="80px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center font-display text-2xl font-bold text-forest-700">
                {fallbackInitials.slice(0, 2).toUpperCase()}
              </div>
            )}
            {status === 'saving' && (
              <div className="absolute inset-0 bg-ink/40 grid place-items-center">
                <Loader2 className="w-6 h-6 text-cream-50 animate-spin" strokeWidth={2} />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onPick}
              className="sr-only"
              id="avatar-upload-input"
              aria-label={label}
            />
            <label
              htmlFor="avatar-upload-input"
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-lg cursor-pointer transition w-fit',
                status === 'saving' && 'opacity-60 pointer-events-none'
              )}
            >
              <Camera className="w-3.5 h-3.5" strokeWidth={2.2} />
              {preview ? 'Chanje foto' : 'Mete foto'}
            </label>
            {preview && (
              <button
                type="button"
                onClick={onRemove}
                disabled={status === 'saving'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cream-100 hover:bg-cream-200 text-earth-700 border border-cream-200 rounded-lg transition w-fit disabled:opacity-60"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={2.2} />
                Retire foto
              </button>
            )}
            <p className="text-[11px] text-earth-500">JPG, PNG oswa WEBP · maks 4 Mo</p>
            {error && (
              <p className="text-[11px] text-rose-700 inline-flex items-center gap-1">
                <AlertCircle className="w-3 h-3" strokeWidth={2.4} /> {error}
              </p>
            )}
          </div>
        </div>
      }
    />
  );
}

// ─── Danger Button (with inline confirmation) ───────────────────────────────
export function DangerButton({
  label,
  description,
  confirmLabel,
  cancelLabel = 'Anile',
  buttonLabel,
  confirmTitle,
  onConfirm,
}: {
  label: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  buttonLabel: string;
  confirmTitle: string;
  onConfirm: () => Promise<{ ok: boolean; error?: string }>;
}) {
  const [confirming, setConfirming] = React.useState(false);
  const { status, setStatus, error, setError, pulseSaved } = useStatus();

  async function run() {
    setStatus('saving');
    setError(null);
    const res = await onConfirm();
    if (!res.ok) {
      setError(res.error ?? 'Erè');
      setStatus('error');
      return;
    }
    setConfirming(false);
    pulseSaved();
  }

  return (
    <Row
      label={label}
      description={description}
      status={status}
      inline={false}
      control={
        <div className="w-full">
          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition"
            >
              <ShieldAlert className="w-4 h-4" strokeWidth={2} />
              {buttonLabel}
            </button>
          ) : (
            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
              <div className="flex items-start gap-2 mb-3">
                <ShieldAlert className="w-4 h-4 text-rose-700 mt-0.5 shrink-0" strokeWidth={2} />
                <p className="text-sm text-rose-900 font-medium">{confirmTitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={run}
                  disabled={status === 'saving'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-rose-700 hover:bg-rose-800 disabled:opacity-60 text-white rounded-lg transition"
                >
                  {status === 'saving' && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
                  )}
                  {confirmLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={status === 'saving'}
                  className="px-3 py-1.5 text-sm font-semibold text-earth-700 hover:text-ink transition"
                >
                  {cancelLabel}
                </button>
              </div>
              {error && (
                <p className="mt-2 text-xs text-rose-700 inline-flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" strokeWidth={2.4} /> {error}
                </p>
              )}
            </div>
          )}
        </div>
      }
    />
  );
}
