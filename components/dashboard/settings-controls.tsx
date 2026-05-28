'use client';

/**
 * Settings form controls for /dashboard/settings.
 *
 * Each control fires `onCommit(newValue)` after a successful round-trip to
 * the server. Local state updates optimistically; on rejection the control
 * rolls back and surfaces the error. A short green pulse on `data-ok` gives
 * the user confirmation without a toast.
 */

import React from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Section heading ────────────────────────────────────────────────────────
export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
      <header className="mb-5">
        <h2 className="font-display text-lg md:text-xl font-bold text-ink">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-earth-600 mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </header>
      <div className="space-y-5 divide-y divide-cream-200/60">
        {children}
      </div>
    </section>
  );
}

// ─── Row wrapper ────────────────────────────────────────────────────────────
function SettingRow({
  label,
  description,
  control,
  status,
  inline = true,
  comingSoon = false,
}: {
  label: string;
  description?: string;
  control: React.ReactNode;
  status?: ControlStatus;
  inline?: boolean;
  /** Renders a "Talè konsa" pill + dims the row for features whose
   *  delivery channel (email / browser push / scheduler) isn't built yet. */
  comingSoon?: boolean;
}) {
  return (
    <div className={cn('pt-5 first:pt-0', comingSoon && 'opacity-60')}>
      <div
        className={cn(
          inline ? 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3' : 'space-y-3'
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-ink flex items-center gap-2 flex-wrap">
            {label}
            {comingSoon && (
              <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-cream-200 text-earth-600">
                Talè konsa
              </span>
            )}
          </div>
          {description && (
            <div className="text-xs text-earth-600 mt-0.5 leading-relaxed">
              {description}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {status === 'saving' && (
            <Loader2 className="w-3.5 h-3.5 text-earth-500 animate-spin" strokeWidth={2.2} />
          )}
          {status === 'saved' && (
            <span className="inline-flex items-center gap-1 text-[11px] text-forest-700">
              <Check className="w-3 h-3" strokeWidth={2.6} /> Anrejistre
            </span>
          )}
          {status === 'error' && (
            <span className="inline-flex items-center gap-1 text-[11px] text-rose-700">
              <AlertCircle className="w-3 h-3" strokeWidth={2.4} /> Erè
            </span>
          )}
          {control}
        </div>
      </div>
    </div>
  );
}

// ─── Status hook shared by all controls ─────────────────────────────────────
type ControlStatus = 'idle' | 'saving' | 'saved' | 'error';

function useCommit<T>(commit: (v: T) => Promise<{ ok: boolean; error?: string }>) {
  const [status, setStatus] = React.useState<ControlStatus>('idle');
  const [error, setError] = React.useState<string | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function run(next: T, onRollback: () => void) {
    setStatus('saving');
    setError(null);
    const res = await commit(next);
    if (!res.ok) {
      onRollback();
      setError(res.error ?? 'Erè');
      setStatus('error');
      return false;
    }
    setStatus('saved');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus('idle'), 1400);
    return true;
  }

  return { status, error, run };
}

// ─── Toggle switch ──────────────────────────────────────────────────────────
export function ToggleSetting({
  label,
  description,
  value,
  commit,
  comingSoon = false,
}: {
  label: string;
  description?: string;
  value: boolean;
  commit: (v: boolean) => Promise<{ ok: boolean; error?: string }>;
  /** Mark the toggle as not-yet-functional: disabled + "Talè konsa" pill.
   *  Used for channels (email, browser push) whose delivery isn't built. */
  comingSoon?: boolean;
}) {
  const [local, setLocal] = React.useState(value);
  const { status, run } = useCommit<boolean>(commit);

  React.useEffect(() => setLocal(value), [value]);

  async function onToggle() {
    if (comingSoon) return;
    const prev = local;
    const next = !prev;
    setLocal(next);
    await run(next, () => setLocal(prev));
  }

  return (
    <SettingRow
      label={label}
      description={description}
      status={status}
      comingSoon={comingSoon}
      control={
        <button
          type="button"
          role="switch"
          aria-checked={local}
          aria-label={label}
          onClick={onToggle}
          disabled={status === 'saving' || comingSoon}
          className={cn(
            'relative w-11 h-6 rounded-full transition-colors disabled:cursor-not-allowed',
            local ? 'bg-forest-600' : 'bg-cream-300'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
              local && 'translate-x-5'
            )}
          />
        </button>
      }
    />
  );
}

// ─── Radio segments ─────────────────────────────────────────────────────────
type SegmentOption<T extends string> = { value: T; label: string };

export function RadioSetting<T extends string>({
  label,
  description,
  value,
  options,
  commit,
}: {
  label: string;
  description?: string;
  value: T;
  options: SegmentOption<T>[];
  commit: (v: T) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [local, setLocal] = React.useState(value);
  const { status, run } = useCommit<T>(commit);

  React.useEffect(() => setLocal(value), [value]);

  async function onPick(v: T) {
    if (v === local) return;
    const prev = local;
    setLocal(v);
    await run(v, () => setLocal(prev));
  }

  return (
    <SettingRow
      label={label}
      description={description}
      status={status}
      inline={false}
      control={
        <div
          role="radiogroup"
          aria-label={label}
          className="inline-flex p-1 bg-cream-100 rounded-xl border border-cream-200"
        >
          {options.map((opt) => {
            const active = opt.value === local;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onPick(opt.value)}
                disabled={status === 'saving'}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:cursor-not-allowed',
                  active
                    ? 'bg-white text-forest-800 shadow-sm'
                    : 'text-earth-600 hover:text-ink'
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      }
    />
  );
}

// ─── Slider ─────────────────────────────────────────────────────────────────
export function SliderSetting({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  unit = '',
  commit,
}: {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  commit: (v: number) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [local, setLocal] = React.useState(value);
  const [pendingCommit, setPendingCommit] = React.useState(false);
  const { status, run } = useCommit<number>(commit);

  React.useEffect(() => setLocal(value), [value]);

  // Debounce the server commit so dragging the slider doesn't flood requests.
  const debouncedCommit = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  function scheduleCommit(next: number, prev: number) {
    setPendingCommit(true);
    if (debouncedCommit.current) clearTimeout(debouncedCommit.current);
    debouncedCommit.current = setTimeout(async () => {
      setPendingCommit(false);
      await run(next, () => setLocal(prev));
    }, 300);
  }

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const prev = value;
    const next = Number(e.target.value);
    setLocal(next);
    scheduleCommit(next, prev);
  }

  return (
    <SettingRow
      label={label}
      description={description}
      status={pendingCommit ? 'saving' : status}
      inline={false}
      control={
        <div className="flex items-center gap-3 min-w-[200px]">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={local}
            onChange={onInput}
            aria-label={label}
            className="flex-1 accent-forest-600 cursor-pointer"
          />
          <span className="text-sm font-semibold text-ink tabular-nums w-12 text-right">
            {local}
            {unit}
          </span>
        </div>
      }
    />
  );
}

// ─── Number stepper ─────────────────────────────────────────────────────────
export function NumberSetting({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  unit = '',
  commit,
}: {
  label: string;
  description?: string;
  value: number | null;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  commit: (v: number) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [local, setLocal] = React.useState<string>(value?.toString() ?? '');
  const { status, run } = useCommit<number>(commit);

  React.useEffect(() => setLocal(value?.toString() ?? ''), [value]);

  async function persist() {
    const parsed = Number(local);
    if (!Number.isFinite(parsed)) return;
    if (parsed === value) return;
    const prev = value;
    await run(parsed, () => setLocal(prev?.toString() ?? ''));
  }

  return (
    <SettingRow
      label={label}
      description={description}
      status={status}
      control={
        <div className="inline-flex items-center bg-cream-50 border border-cream-200 rounded-lg overflow-hidden">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onBlur={persist}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            aria-label={label}
            className="w-20 px-3 py-1.5 text-sm font-semibold text-ink tabular-nums text-right bg-transparent focus:outline-none"
          />
          {unit && (
            <span className="pr-3 text-xs text-earth-600 font-medium">{unit}</span>
          )}
        </div>
      }
    />
  );
}

// ─── Range pair (e.g. min/max blood sugar) ──────────────────────────────────
export function RangeSetting({
  label,
  description,
  minValue,
  maxValue,
  bounds,
  unit = '',
  commitMin,
  commitMax,
}: {
  label: string;
  description?: string;
  minValue: number;
  maxValue: number;
  bounds: { min: number; max: number };
  unit?: string;
  commitMin: (v: number) => Promise<{ ok: boolean; error?: string }>;
  commitMax: (v: number) => Promise<{ ok: boolean; error?: string }>;
}) {
  return (
    <div className="pt-5 first:pt-0">
      <div className="flex-1 min-w-0 mb-3">
        <div className="text-sm font-semibold text-ink">{label}</div>
        {description && (
          <div className="text-xs text-earth-600 mt-0.5 leading-relaxed">
            {description}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberSetting
          label="Minimòm"
          value={minValue}
          min={bounds.min}
          max={maxValue - 1}
          unit={unit}
          commit={commitMin}
        />
        <NumberSetting
          label="Maksimòm"
          value={maxValue}
          min={minValue + 1}
          max={bounds.max}
          unit={unit}
          commit={commitMax}
        />
      </div>
    </div>
  );
}

// ─── Text input ─────────────────────────────────────────────────────────────
export function TextSetting({
  label,
  description,
  value,
  placeholder,
  commit,
}: {
  label: string;
  description?: string;
  value: string;
  placeholder?: string;
  commit: (v: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [local, setLocal] = React.useState(value);
  const { status, run } = useCommit<string>(commit);

  React.useEffect(() => setLocal(value), [value]);

  async function persist() {
    if (local === value) return;
    const prev = value;
    await run(local, () => setLocal(prev));
  }

  return (
    <SettingRow
      label={label}
      description={description}
      status={status}
      control={
        <input
          type="text"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={persist}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          placeholder={placeholder}
          aria-label={label}
          className="w-56 px-3 py-1.5 text-sm bg-cream-50 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
        />
      }
    />
  );
}

// ─── Time input ─────────────────────────────────────────────────────────────
export function TimeSetting({
  label,
  description,
  value,
  commit,
  comingSoon = false,
}: {
  label: string;
  description?: string;
  value: string; // 'HH:MM:SS'
  commit: (v: string) => Promise<{ ok: boolean; error?: string }>;
  comingSoon?: boolean;
}) {
  const hhmm = value.slice(0, 5);
  const [local, setLocal] = React.useState(hhmm);
  const { status, run } = useCommit<string>(commit);

  React.useEffect(() => setLocal(value.slice(0, 5)), [value]);

  async function persist() {
    if (comingSoon) return;
    const next = local.length === 5 ? `${local}:00` : local;
    if (next === value) return;
    const prev = value;
    await run(next, () => setLocal(prev.slice(0, 5)));
  }

  return (
    <SettingRow
      label={label}
      description={description}
      status={status}
      comingSoon={comingSoon}
      control={
        <input
          type="time"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={persist}
          disabled={comingSoon}
          aria-label={label}
          className="px-3 py-1.5 text-sm bg-cream-50 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 disabled:cursor-not-allowed"
        />
      }
    />
  );
}

// ─── Color swatches ─────────────────────────────────────────────────────────
type SwatchOption = {
  value: string;
  label: string;
  color: string;
  accent?: string;
};

export function SwatchSetting({
  label,
  description,
  value,
  options,
  commit,
}: {
  label: string;
  description?: string;
  value: string;
  options: SwatchOption[];
  commit: (v: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [local, setLocal] = React.useState(value);
  const { status, run } = useCommit<string>(commit);

  React.useEffect(() => setLocal(value), [value]);

  async function onPick(v: string) {
    if (v === local) return;
    const prev = local;
    setLocal(v);
    await run(v, () => setLocal(prev));
  }

  return (
    <SettingRow
      label={label}
      description={description}
      status={status}
      inline={false}
      control={
        <div className="grid grid-cols-3 gap-2 w-full max-w-md">
          {options.map((opt) => {
            const active = opt.value === local;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onPick(opt.value)}
                disabled={status === 'saving'}
                aria-pressed={active}
                className={cn(
                  'relative h-14 rounded-xl border-2 transition-all overflow-hidden text-left disabled:cursor-not-allowed',
                  active
                    ? 'border-ink shadow-cardHover'
                    : 'border-cream-200 hover:border-forest-300'
                )}
                style={{ background: opt.color }}
              >
                {opt.accent && (
                  <span
                    className="absolute top-0 right-0 bottom-0 w-1/3"
                    style={{ background: opt.accent }}
                  />
                )}
                <span className="absolute bottom-1.5 left-2 right-2 text-[11px] font-semibold text-white drop-shadow">
                  {opt.label}
                </span>
                {active && (
                  <span className="absolute top-1.5 right-1.5 grid place-items-center w-5 h-5 rounded-full bg-white text-ink shadow">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      }
    />
  );
}
