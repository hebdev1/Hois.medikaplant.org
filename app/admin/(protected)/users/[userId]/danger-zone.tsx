'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Ban,
  ShieldAlert,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  setUserPlan,
  setUserSuspended,
  setUserRole,
  adminDeleteUser,
} from '../actions';

type Plan = 'basic' | 'premium' | 'vip';
type Role = 'user' | 'admin';

export default function DangerZone({
  userId,
  initialPlan,
  initialRole,
  initialSuspended,
  email,
  isSelf,
}: {
  userId: string;
  initialPlan: Plan;
  initialRole: Role;
  initialSuspended: boolean;
  email: string;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [plan, setPlan] = React.useState(initialPlan);
  const [role, setRole] = React.useState(initialRole);
  const [suspended, setSuspended] = React.useState(initialSuspended);
  const [pending, setPending] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string | null>>({});
  const [savedTick, setSavedTick] = React.useState<string | null>(null);

  function flashSaved(field: string) {
    setSavedTick(field);
    setTimeout(() => setSavedTick((t) => (t === field ? null : t)), 1600);
  }

  async function onPickPlan(p: Plan) {
    if (p === plan) return;
    const prev = plan;
    setPlan(p);
    setPending('plan');
    setErrors((e) => ({ ...e, plan: null }));
    const res = await setUserPlan(userId, p);
    setPending(null);
    if (!res.ok) {
      setPlan(prev);
      setErrors((e) => ({ ...e, plan: res.error }));
      return;
    }
    flashSaved('plan');
  }

  async function onPickRole(r: Role) {
    if (r === role) return;
    const prev = role;
    setRole(r);
    setPending('role');
    setErrors((e) => ({ ...e, role: null }));
    const res = await setUserRole(userId, r);
    setPending(null);
    if (!res.ok) {
      setRole(prev);
      setErrors((e) => ({ ...e, role: res.error }));
      return;
    }
    flashSaved('role');
  }

  async function onToggleSuspended() {
    const prev = suspended;
    const next = !prev;
    setSuspended(next);
    setPending('suspend');
    setErrors((e) => ({ ...e, suspend: null }));
    const res = await setUserSuspended(userId, next);
    setPending(null);
    if (!res.ok) {
      setSuspended(prev);
      setErrors((e) => ({ ...e, suspend: res.error }));
      return;
    }
    flashSaved('suspend');
  }

  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card space-y-5">
      <header>
        <h2 className="font-display text-lg md:text-xl font-bold text-ink">
          Plan, Wòl & Estati
        </h2>
        <p className="text-sm text-earth-600 mt-1">
          Yon klike sou yon segman pou aplike chanjman an. Tout fas yo pwoteje
          ak validasyon — w pap ka anile pwòp wòl admin ou.
        </p>
      </header>

      {/* Plan */}
      <Row
        label="Plan"
        description="Subscription_status trigger pap touche otomatikman lè admin chanje plan manyèlman."
        saved={savedTick === 'plan'}
        error={errors.plan}
      >
        <Segment
          value={plan}
          onChange={onPickPlan}
          disabled={pending === 'plan'}
          options={[
            { value: 'basic', label: 'Bazilik' },
            { value: 'premium', label: 'Sitwonèl' },
            { value: 'vip', label: 'Melis' },
          ]}
          activeTone="bg-white text-forest-800 shadow-sm"
        />
      </Row>

      {/* Role */}
      <Row
        label="Wòl"
        description={
          isSelf
            ? 'Ou pa ka retire pwòp wòl admin ou (anpechman lockout).'
            : 'Yon admin gen aksè total sou tout done.'
        }
        saved={savedTick === 'role'}
        error={errors.role}
      >
        <Segment
          value={role}
          onChange={onPickRole}
          disabled={pending === 'role' || isSelf}
          options={[
            { value: 'user', label: 'Itilizatè' },
            { value: 'admin', label: 'Admin' },
          ]}
          activeTone="bg-accent text-white"
        />
      </Row>

      {/* Suspended */}
      <Row
        label={suspended ? 'Kont sispann' : 'Kont aktif'}
        description={
          suspended
            ? 'Manm pa ka konekte. Klike pou re-aktive.'
            : 'Klike pou sispann aksè manm la.'
        }
        saved={savedTick === 'suspend'}
        error={errors.suspend}
      >
        <button
          type="button"
          onClick={onToggleSuspended}
          disabled={pending === 'suspend' || (isSelf && !suspended)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition disabled:opacity-60 disabled:cursor-not-allowed',
            suspended
              ? 'bg-forest-50 hover:bg-forest-100 text-forest-700 border-forest-200'
              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
          )}
        >
          {pending === 'suspend' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
          ) : suspended ? (
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2.2} />
          ) : (
            <Ban className="w-3.5 h-3.5" strokeWidth={2.2} />
          )}
          {suspended ? 'Reaktive kont' : 'Sispann kont'}
        </button>
      </Row>

      {/* Delete (hard) */}
      <div className="pt-5 border-t border-rose-100">
        <DeleteRow userId={userId} email={email} isSelf={isSelf} onDeleted={() => router.push('/admin/users')} />
      </div>
    </section>
  );
}

function Row({
  label,
  description,
  saved,
  error,
  children,
}: {
  label: string;
  description?: string;
  saved?: boolean;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-ink flex items-center gap-1.5">
            {label}
            {saved && (
              <span className="inline-flex items-center gap-1 text-[10px] text-forest-700">
                <CheckCircle2 className="w-3 h-3" strokeWidth={2.6} />
                Anrejistre
              </span>
            )}
          </div>
          {description && (
            <div className="text-[11px] text-earth-600 mt-0.5 leading-relaxed">
              {description}
            </div>
          )}
        </div>
        {children}
      </div>
      {error && (
        <p className="mt-1 text-[11px] text-rose-700 inline-flex items-center gap-1">
          <AlertCircle className="w-3 h-3" strokeWidth={2.4} /> {error}
        </p>
      )}
    </div>
  );
}

function Segment<T extends string>({
  value,
  options,
  onChange,
  disabled,
  activeTone,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  disabled: boolean;
  activeTone: string;
}) {
  return (
    <div
      role="radiogroup"
      className={cn(
        'inline-flex p-1 bg-cream-100 rounded-xl border border-cream-200',
        disabled && 'opacity-60'
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:cursor-not-allowed',
              active ? activeTone : 'text-earth-600 hover:text-ink'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const CONFIRM_PHRASE = 'EFASE';

function DeleteRow({
  userId,
  email,
  isSelf,
  onDeleted,
}: {
  userId: string;
  email: string;
  isSelf: boolean;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = React.useState(false);
  const [phrase, setPhrase] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onDelete() {
    if (phrase !== CONFIRM_PHRASE) return;
    setPending(true);
    setError(null);
    const res = await adminDeleteUser(userId, phrase);
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onDeleted();
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-rose-800 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" strokeWidth={2.2} />
            Efase pwofil pasyan
          </div>
          <div className="text-[11px] text-earth-600 mt-0.5 max-w-xl">
            Sa ap detwi liy nan tab profiles ak tout liy CASCADE ki depandan
            (subscriptions, health_logs, user_preferences, user_medical_info,
            treatment_recommendations). Liy nan auth.users la rete; itilize
            edge function delete-user pou yon koupe konplèt.
          </div>
        </div>
        {!confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={isSelf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed text-rose-700 border border-rose-200 rounded-lg transition w-fit"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2.2} />
            Efase
          </button>
        )}
      </div>

      {confirming && (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/60 p-4">
          <p className="text-sm text-rose-900 mb-3">
            Èske w sèten ou vle efase <strong>{email}</strong>? Pou konfime,
            tape{' '}
            <code className="bg-white border border-rose-200 px-1.5 py-0.5 rounded font-mono text-xs">
              {CONFIRM_PHRASE}
            </code>{' '}
            anba a.
          </p>
          <input
            type="text"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            disabled={pending}
            autoComplete="off"
            className="w-full px-3 py-2 text-sm font-mono bg-white border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200 mb-3"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDelete}
              disabled={phrase !== CONFIRM_PHRASE || pending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-700 hover:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition"
            >
              {pending && <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.2} />}
              Wi, efase
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setPhrase('');
                setError(null);
              }}
              disabled={pending}
              className="px-3 py-1.5 text-xs font-semibold text-earth-700 hover:text-ink transition"
            >
              Anile
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
  );
}
