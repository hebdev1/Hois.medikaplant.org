'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Ban,
  ShieldAlert,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  UserCog,
  IdCard,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  setUserPlan,
  setUserSuspended,
  setUserRole,
  setUserAdminRole,
  setSupportPersonaName,
  adminDeleteUser,
  type AdminRole,
} from '../actions';
import { ADMIN_ROLE_LABEL, ADMIN_ROLE_DESCRIPTION } from '../../admin-nav-config';

type Plan = 'basic' | 'premium' | 'vip';
type Role = 'user' | 'admin';

const ADMIN_ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: 'super_admin', label: ADMIN_ROLE_LABEL.super_admin },
  { value: 'admin', label: ADMIN_ROLE_LABEL.admin },
  { value: 'support', label: ADMIN_ROLE_LABEL.support },
  { value: 'moderator', label: ADMIN_ROLE_LABEL.moderator },
  { value: 'content', label: ADMIN_ROLE_LABEL.content },
];

export default function DangerZone({
  userId,
  initialPlan,
  initialRole,
  initialAdminRole,
  initialPersonaName,
  initialSuspended,
  email,
  isSelf,
  viewerIsSuperAdmin,
}: {
  userId: string;
  initialPlan: Plan;
  initialRole: Role;
  initialAdminRole: AdminRole | null;
  initialPersonaName: string | null;
  initialSuspended: boolean;
  email: string;
  isSelf: boolean;
  /**
   * True when the currently-signed-in admin has admin_role='super_admin'.
   * Controls visibility of the role / admin_role selectors, which are
   * super-admin-only per migration 038. Non-super admins still see
   * plan/suspend/persona controls (subject to per-action guards on the
   * server).
   */
  viewerIsSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [plan, setPlan] = React.useState(initialPlan);
  const [role, setRole] = React.useState(initialRole);
  const [adminRole, setAdminRole] = React.useState<AdminRole | null>(initialAdminRole);
  const [personaName, setPersonaName] = React.useState(initialPersonaName ?? '');
  const [personaSaving, setPersonaSaving] = React.useState(false);
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
    // Server defaults new admins to 'support'; reflect that locally so the
    // sub-role picker shows up immediately without a refresh.
    if (r === 'admin') {
      setAdminRole((existing) => existing ?? 'support');
    } else {
      setAdminRole(null);
    }
    flashSaved('role');
  }

  async function onPickAdminRole(next: AdminRole) {
    if (next === adminRole) return;
    const prev = adminRole;
    setAdminRole(next);
    setPending('admin_role');
    setErrors((e) => ({ ...e, admin_role: null }));
    const res = await setUserAdminRole(userId, next);
    setPending(null);
    if (!res.ok) {
      setAdminRole(prev);
      setErrors((e) => ({ ...e, admin_role: res.error }));
      return;
    }
    flashSaved('admin_role');
  }

  async function onSavePersona() {
    setPersonaSaving(true);
    setErrors((e) => ({ ...e, persona: null }));
    const cleaned = personaName.trim();
    const res = await setSupportPersonaName(
      userId,
      cleaned.length === 0 ? null : cleaned
    );
    setPersonaSaving(false);
    if (!res.ok) {
      setErrors((e) => ({ ...e, persona: res.error }));
      return;
    }
    flashSaved('persona');
    router.refresh();
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

  // Persona input is editable for self OR by any super_admin.
  const canEditPersona = isSelf || viewerIsSuperAdmin;
  const personaDirty = (personaName.trim() || null) !== (initialPersonaName ?? null);
  const showAdminRolePicker = role === 'admin' && viewerIsSuperAdmin;

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

      {/* Role — gated behind super_admin */}
      <Row
        label={
          <span className="inline-flex items-center gap-1.5">
            Wòl
            {!viewerIsSuperAdmin && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-cream-100 text-earth-600 font-bold">
                <Lock className="w-2.5 h-2.5" strokeWidth={2.4} />
                Super-admin sèlman
              </span>
            )}
          </span>
        }
        description={
          isSelf
            ? 'Ou pa ka retire pwòp wòl admin ou (anpechman lockout).'
            : !viewerIsSuperAdmin
              ? 'Sèlman super-admin yo ka pwomote oswa retire wòl admin.'
              : 'Yon admin gen aksè total sou tout done.'
        }
        saved={savedTick === 'role'}
        error={errors.role}
      >
        <Segment
          value={role}
          onChange={onPickRole}
          disabled={pending === 'role' || isSelf || !viewerIsSuperAdmin}
          options={[
            { value: 'user', label: 'Itilizatè' },
            { value: 'admin', label: 'Admin' },
          ]}
          activeTone="bg-accent text-white"
        />
      </Row>

      {/* Admin sub-role picker — only when target is admin AND viewer is super_admin */}
      {showAdminRolePicker && (
        <div className="rounded-xl bg-cream-50/70 border border-cream-200 p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-accent/10 text-accent shrink-0">
              <UserCog className="w-4 h-4" strokeWidth={2.2} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-ink flex items-center gap-1.5">
                Wòl admin
                {savedTick === 'admin_role' && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-forest-700">
                    <CheckCircle2 className="w-3 h-3" strokeWidth={2.6} />
                    Anrejistre
                  </span>
                )}
              </div>
              <div className="text-[11px] text-earth-600 mt-0.5 leading-relaxed">
                {adminRole
                  ? ADMIN_ROLE_DESCRIPTION[adminRole]
                  : 'Chwazi yon wòl pou defini sa moun sa ka fè nan panel admin nan.'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {ADMIN_ROLE_OPTIONS.map((opt) => {
              const active = opt.value === adminRole;
              const disabled =
                pending === 'admin_role' ||
                (isSelf && adminRole === 'super_admin' && opt.value !== 'super_admin');
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => onPickAdminRole(opt.value)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-semibold rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-50',
                    active
                      ? 'bg-accent text-white border-accent shadow-sm'
                      : 'bg-white text-earth-700 border-cream-200 hover:border-accent/60 hover:text-ink'
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {errors.admin_role && (
            <p className="text-[11px] text-rose-700 inline-flex items-center gap-1">
              <AlertCircle className="w-3 h-3" strokeWidth={2.4} />
              {errors.admin_role}
            </p>
          )}
          {isSelf && adminRole === 'super_admin' && (
            <p className="text-[11px] text-earth-500 italic">
              Ou pa ka retire pwòp wòl super-admin ou.
            </p>
          )}
        </div>
      )}

      {/* Support persona — visible to all admins; editable for self or super_admin */}
      {role === 'admin' && (
        <div className="rounded-xl bg-cream-50/70 border border-cream-200 p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-forest-100 text-forest-700 shrink-0">
              <IdCard className="w-4 h-4" strokeWidth={2.2} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-ink flex items-center gap-1.5">
                Non nan sipò chat
                {savedTick === 'persona' && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-forest-700">
                    <CheckCircle2 className="w-3 h-3" strokeWidth={2.6} />
                    Anrejistre
                  </span>
                )}
              </div>
              <div className="text-[11px] text-earth-600 mt-0.5 leading-relaxed">
                {canEditPersona
                  ? 'Non sa ap parèt nan en-tèt chat manm yo lè ou voye yon repons. Si w kite l vid, n ap sèvi ak non konplè pwofil ou.'
                  : 'Sèlman moun sa oswa yon super-admin ka chanje non sa.'}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={personaName}
              maxLength={60}
              disabled={!canEditPersona || personaSaving}
              onChange={(e) => setPersonaName(e.target.value)}
              placeholder="ex: Mèt Joseph, èrboris santiniye"
              className="flex-1 px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={onSavePersona}
              disabled={!canEditPersona || personaSaving || !personaDirty}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-forest-700 hover:bg-forest-800 text-cream-50 disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0"
            >
              {personaSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />}
              Anrejistre
            </button>
          </div>

          {errors.persona && (
            <p className="text-[11px] text-rose-700 inline-flex items-center gap-1">
              <AlertCircle className="w-3 h-3" strokeWidth={2.4} />
              {errors.persona}
            </p>
          )}
        </div>
      )}

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
  label: React.ReactNode;
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
