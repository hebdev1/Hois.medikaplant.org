'use client';

import React from 'react';
import {
  User,
  IdCard,
  Mail,
  Lock,
  Bell,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  updateAdminProfile,
  updateAdminSupportPersona,
  updateAdminEmail,
  updateAdminPassword,
  updateAdminNotificationPreference,
  type NotificationKey,
} from './actions';

type IdentityField = 'first_name' | 'last_name' | 'phone' | 'bio';

type InitialState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  supportPersonaName: string;
  notifications: {
    email_notifications: boolean;
    daily_advice_email: boolean;
    weekly_summary_email: boolean;
    badge_unlock_email: boolean;
  };
};

export default function AdminSettingsForm({ initial }: { initial: InitialState }) {
  return (
    <div className="grid gap-5 md:gap-6">
      <IdentitySection
        firstName={initial.firstName}
        lastName={initial.lastName}
        phone={initial.phone}
        bio={initial.bio}
      />

      <PersonaSection initialPersona={initial.supportPersonaName} />

      <EmailSection currentEmail={initial.email} />

      <PasswordSection />

      <NotificationsSection initialPrefs={initial.notifications} />
    </div>
  );
}

/* ─── Identity ─────────────────────────────────────────────────────────── */

function IdentitySection({
  firstName,
  lastName,
  phone,
  bio,
}: {
  firstName: string;
  lastName: string;
  phone: string;
  bio: string;
}) {
  return (
    <Card
      icon={User}
      title="Idantite"
      description="Non w jan li parèt nan en-tèt admin nan ak nan kominikasyon yo."
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <InlineTextField
          field="first_name"
          label="Prenon"
          initial={firstName}
          placeholder="Joseph"
        />
        <InlineTextField
          field="last_name"
          label="Non"
          initial={lastName}
          placeholder="Brutus"
        />
        <InlineTextField
          field="phone"
          label="Telefòn"
          initial={phone}
          placeholder="+509 …"
          type="tel"
        />
      </div>
      <InlineTextField
        field="bio"
        label="Bio kout"
        initial={bio}
        placeholder="Yon fraz ki dekri ou (opsyonèl, maks 400 karaktè)…"
        multiline
      />
    </Card>
  );
}

function InlineTextField({
  field,
  label,
  initial,
  placeholder,
  type = 'text',
  multiline = false,
}: {
  field: IdentityField;
  label: string;
  initial: string;
  placeholder?: string;
  type?: 'text' | 'tel';
  multiline?: boolean;
}) {
  const [value, setValue] = React.useState(initial);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const dirty = value.trim() !== initial.trim();

  async function onSave() {
    setPending(true);
    setError(null);
    const cleaned = value.trim();
    const res = await updateAdminProfile(
      field,
      (cleaned.length === 0 ? null : cleaned) as string | null
    );
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-earth-600 flex items-center gap-1.5 mb-1">
        {label}
        {saved && (
          <span className="inline-flex items-center gap-1 text-[10px] text-forest-700 normal-case">
            <CheckCircle2 className="w-3 h-3" strokeWidth={2.6} />
            Anrejistre
          </span>
        )}
      </label>
      <div className={cn('flex gap-2', multiline ? 'flex-col' : 'flex-row')}>
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            rows={3}
            maxLength={400}
            disabled={pending}
            className="flex-1 px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 resize-none disabled:opacity-60"
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            disabled={pending}
            className="flex-1 px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 disabled:opacity-60"
          />
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={!dirty || pending}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg shrink-0 transition',
            'bg-forest-700 hover:bg-forest-800 text-cream-50 disabled:opacity-50 disabled:cursor-not-allowed',
            multiline && 'self-end'
          )}
        >
          {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />}
          Anrejistre
        </button>
      </div>
      {error && (
        <p className="mt-1 text-[11px] text-rose-700 inline-flex items-center gap-1">
          <AlertCircle className="w-3 h-3" strokeWidth={2.4} /> {error}
        </p>
      )}
    </div>
  );
}

/* ─── Support persona ──────────────────────────────────────────────────── */

function PersonaSection({ initialPersona }: { initialPersona: string }) {
  const [value, setValue] = React.useState(initialPersona);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const dirty = (value.trim() || '') !== initialPersona;

  async function onSave() {
    setPending(true);
    setError(null);
    const cleaned = value.trim();
    const res = await updateAdminSupportPersona(
      cleaned.length === 0 ? null : cleaned
    );
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  return (
    <Card
      icon={IdCard}
      title="Non nan sipò chat"
      description="Sa a se non ki ap parèt nan en-tèt chat manm yo lè ou voye yon repons. Si w kite l vid, n ap sèvi ak non konplè pwofil ou."
    >
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={60}
          placeholder="ex: Mèt Joseph, èrboris santiniye"
          disabled={pending}
          className="flex-1 px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onSave}
          disabled={!dirty || pending}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-50 disabled:cursor-not-allowed text-cream-50 rounded-lg transition shrink-0"
        >
          {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />}
          Anrejistre
        </button>
      </div>
      {saved && (
        <p className="mt-2 text-[11px] text-forest-700 inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" strokeWidth={2.6} />
          Anrejistre.
        </p>
      )}
      {error && (
        <p className="mt-2 text-[11px] text-rose-700 inline-flex items-center gap-1">
          <AlertCircle className="w-3 h-3" strokeWidth={2.4} /> {error}
        </p>
      )}
    </Card>
  );
}

/* ─── Email ────────────────────────────────────────────────────────────── */

function EmailSection({ currentEmail }: { currentEmail: string }) {
  const [value, setValue] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  async function onSave() {
    setPending(true);
    setError(null);
    setInfo(null);
    const res = await updateAdminEmail(value);
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setInfo(res.message);
    setValue('');
  }

  return (
    <Card
      icon={Mail}
      title="Imèl"
      description={`Imèl aktyèl: ${currentEmail}. Yon imèl konfimasyon ap voye nan nouvo adrès la — chanjman an pa aplike anvan w klike sou lyen an.`}
    >
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="nouvo-imel@medikaplant.org"
          disabled={pending}
          autoComplete="email"
          className="flex-1 px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onSave}
          disabled={value.trim().length === 0 || pending}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-50 disabled:cursor-not-allowed text-cream-50 rounded-lg transition shrink-0"
        >
          {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />}
          Chanje imèl
        </button>
      </div>
      {info && (
        <p className="mt-2 text-[11px] text-forest-700 inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" strokeWidth={2.6} /> {info}
        </p>
      )}
      {error && (
        <p className="mt-2 text-[11px] text-rose-700 inline-flex items-center gap-1">
          <AlertCircle className="w-3 h-3" strokeWidth={2.4} /> {error}
        </p>
      )}
    </Card>
  );
}

/* ─── Password ─────────────────────────────────────────────────────────── */

function PasswordSection() {
  const [currentPwd, setCurrentPwd] = React.useState('');
  const [pwd, setPwd] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [showPwd, setShowPwd] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  async function onSave() {
    setPending(true);
    setError(null);
    setDone(false);
    const res = await updateAdminPassword(currentPwd, pwd, confirm);
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setCurrentPwd('');
    setPwd('');
    setConfirm('');
    setDone(true);
    setTimeout(() => setDone(false), 2400);
  }

  return (
    <Card
      icon={Lock}
      title="Sekirite — chanje modpas"
      description="Tape modpas aktyèl ou pou konfime, epi yon nouvo modpas (omwen 8 karaktè, ak yon melanj lèt + chif)."
    >
      <div className="mb-3">
        <input
          type={showPwd ? 'text' : 'password'}
          value={currentPwd}
          onChange={(e) => setCurrentPwd(e.target.value)}
          placeholder="Modpas aktyèl"
          disabled={pending}
          autoComplete="current-password"
          className="w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 disabled:opacity-60"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="relative">
          <input
            type={showPwd ? 'text' : 'password'}
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="Nouvo modpas"
            disabled={pending}
            autoComplete="new-password"
            className="w-full px-3 py-2 pr-10 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            aria-label={showPwd ? 'Kache modpas' : 'Montre modpas'}
            className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-7 h-7 rounded text-earth-500 hover:text-ink hover:bg-cream-100 transition"
          >
            {showPwd ? (
              <EyeOff className="w-4 h-4" strokeWidth={2} />
            ) : (
              <Eye className="w-4 h-4" strokeWidth={2} />
            )}
          </button>
        </div>
        <input
          type={showPwd ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Konfime modpas"
          disabled={pending}
          autoComplete="new-password"
          className="w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 disabled:opacity-60"
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[11px] text-earth-500">
          Sèvi ak yon modpas ki pa nan lòt sit ou itilize.
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={currentPwd.length === 0 || pwd.length === 0 || confirm.length === 0 || pending}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-50 disabled:cursor-not-allowed text-cream-50 rounded-lg transition"
        >
          {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />}
          Mete ajou modpas
        </button>
      </div>
      {done && (
        <p className="mt-2 text-[11px] text-forest-700 inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" strokeWidth={2.6} />
          Modpas la chanje.
        </p>
      )}
      {error && (
        <p className="mt-2 text-[11px] text-rose-700 inline-flex items-center gap-1">
          <AlertCircle className="w-3 h-3" strokeWidth={2.4} /> {error}
        </p>
      )}
    </Card>
  );
}

/* ─── Email notification preferences ───────────────────────────────────── */

function NotificationsSection({
  initialPrefs,
}: {
  initialPrefs: {
    email_notifications: boolean;
    daily_advice_email: boolean;
    weekly_summary_email: boolean;
    badge_unlock_email: boolean;
  };
}) {
  return (
    <Card
      icon={Bell}
      title="Preferans imèl"
      description="Kontwole kilè platfòm la voye imèl ba ou."
    >
      <div className="space-y-2">
        <NotificationToggle
          field="email_notifications"
          label="Notifikasyon jeneral pa imèl"
          description="Resevwa imèl pou aktivite enpòtan (sipò chat, fowòm, sistèm)."
          initial={initialPrefs.email_notifications}
        />
        <NotificationToggle
          field="weekly_summary_email"
          label="Rezime chak semèn"
          description="Yon rezime aktivite manm yo ak admin pa semèn."
          initial={initialPrefs.weekly_summary_email}
        />
        <NotificationToggle
          field="daily_advice_email"
          label="Konsèy chak jou"
          description="Yon mesaj kout chak jou avèk konsèy plant santiniye."
          initial={initialPrefs.daily_advice_email}
        />
        <NotificationToggle
          field="badge_unlock_email"
          label="Mark ou debloke yon badj"
          description="Aktive si ou vle resevwa imèl chak fwa yon badj debloke."
          initial={initialPrefs.badge_unlock_email}
        />
      </div>
    </Card>
  );
}

function NotificationToggle({
  field,
  label,
  description,
  initial,
}: {
  field: NotificationKey;
  label: string;
  description: string;
  initial: boolean;
}) {
  const [value, setValue] = React.useState(initial);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onToggle() {
    const prev = value;
    const next = !prev;
    setValue(next);
    setPending(true);
    setError(null);
    const res = await updateAdminNotificationPreference(field, next);
    setPending(false);
    if (!res.ok) {
      setValue(prev);
      setError(res.error);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl bg-cream-50/70 border border-cream-200">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-ink">{label}</div>
        <div className="text-[11px] text-earth-600 leading-relaxed">{description}</div>
        {error && (
          <p className="mt-1 text-[11px] text-rose-700 inline-flex items-center gap-1">
            <AlertCircle className="w-3 h-3" strokeWidth={2.4} /> {error}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={onToggle}
        disabled={pending}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-wait',
          value ? 'bg-forest-600' : 'bg-cream-200'
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
            value ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}

/* ─── Card layout ──────────────────────────────────────────────────────── */

function Card({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
      <header className="flex items-start gap-3 mb-4">
        <span className="grid place-items-center w-10 h-10 rounded-xl bg-accent/10 text-accent shrink-0">
          <Icon className="w-4 h-4" strokeWidth={2.2} />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-lg font-bold text-ink leading-tight">
            {title}
          </h2>
          <p className="text-[12px] text-earth-600 mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </header>
      {children}
    </section>
  );
}
