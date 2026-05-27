'use client';

import React from 'react';
import {
  Mail,
  User as UserIcon,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { inviteAdmin, type AdminRole } from '../actions';
import {
  ADMIN_ROLE_LABEL,
  ADMIN_ROLE_DESCRIPTION,
} from '../../admin-nav-config';

const ROLE_OPTIONS: AdminRole[] = [
  'super_admin',
  'admin',
  'support',
  'moderator',
  'content',
];

export default function InviteAdminForm() {
  const [email, setEmail] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [adminRole, setAdminRole] = React.useState<AdminRole>('support');
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{
    url: string;
    email: string;
    expiresAt: string;
  } | null>(null);
  const [copied, setCopied] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await inviteAdmin(email, firstName, lastName, adminRole);
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setResult({
      url: res.invite_url,
      email: res.invite.email,
      expiresAt: res.invite.expires_at,
    });
  }

  async function onCopyUrl() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // older browsers — fall back to selecting the text
      const el = document.getElementById('invite-url-output') as HTMLInputElement | null;
      if (el) {
        el.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    }
  }

  if (result) {
    const expiresFmt = new Date(result.expiresAt).toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    return (
      <section className="bg-white border border-forest-200 rounded-2xl p-5 md:p-6 shadow-card space-y-4">
        <div className="flex items-start gap-3">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-forest-100 text-forest-700 shrink-0">
            <CheckCircle2 className="w-5 h-5" strokeWidth={2.2} />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-ink">
              Envitasyon kreye
            </h2>
            <p className="text-sm text-earth-600 mt-1">
              Pataje lyen sa ak <strong>{result.email}</strong>. Lè li klike sou li
              epi enskri ak modpas li, l ap otomatikman gen wòl la w te chwazi a.
            </p>
            <p className="text-[11px] text-earth-500 mt-1">
              Lyen sa ekspire {expiresFmt}.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="invite-url-output"
            type="text"
            value={result.url}
            readOnly
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 px-3 py-2 text-xs font-mono bg-cream-50 border border-cream-200 rounded-lg text-earth-700 focus:outline-none focus:ring-2 focus:ring-forest-200"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCopyUrl}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-lg transition shrink-0"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.4} />
                  Kopye!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" strokeWidth={2.2} />
                  Kopye lyen
                </>
              )}
            </button>
            <a
              href={result.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white hover:bg-cream-50 text-earth-700 border border-cream-200 rounded-lg transition shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.2} />
              Ouvè
            </a>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-cream-200">
          <button
            type="button"
            onClick={() => {
              setEmail('');
              setFirstName('');
              setLastName('');
              setAdminRole('support');
              setResult(null);
            }}
            className="px-3 py-2 text-xs font-semibold bg-cream-100 hover:bg-cream-200 text-earth-700 rounded-lg transition"
          >
            Envite yon lòt admin
          </button>
        </div>
      </section>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card space-y-5"
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Imèl" icon={Mail} required>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="off"
            placeholder="nouvo-admin@medikaplant.org"
            className={inputClass}
          />
        </Field>
        <div /> {/* spacer */}
        <Field label="Prenon" icon={UserIcon}>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Marie"
            className={inputClass}
          />
        </Field>
        <Field label="Non" icon={UserIcon}>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Joseph"
            className={inputClass}
          />
        </Field>
      </div>

      <div>
        <div className="text-xs font-semibold text-earth-700 mb-2 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" strokeWidth={2.2} />
          Wòl admin
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {ROLE_OPTIONS.map((r) => {
            const active = r === adminRole;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setAdminRole(r)}
                aria-pressed={active}
                className={cn(
                  'text-left p-3 rounded-xl border transition',
                  active
                    ? 'bg-accent/10 border-accent ring-2 ring-accent/30'
                    : 'bg-white border-cream-200 hover:border-accent/40'
                )}
              >
                <div className="text-sm font-bold text-ink">
                  {ADMIN_ROLE_LABEL[r]}
                </div>
                <div className="text-[11px] text-earth-600 mt-0.5 leading-snug">
                  {ADMIN_ROLE_DESCRIPTION[r]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-cream-100">
        <button
          type="submit"
          disabled={pending || email.trim().length === 0}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 rounded-lg transition"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />}
          Jenere lyen envitasyon
        </button>
      </div>
    </form>
  );
}

const inputClass =
  'w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 disabled:opacity-60';

function Field({
  label,
  icon: Icon,
  required,
  children,
}: {
  label: string;
  icon: LucideIcon;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-earth-700 flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
        {label}
        {required && <span className="text-rose-600">*</span>}
      </span>
      {children}
    </label>
  );
}
