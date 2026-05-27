'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  Mail,
  Phone,
  User,
  Video,
  Users as UsersIcon,
  FileText,
  CalendarCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Inbox,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  scheduleConsultation,
  completeConsultation,
  cancelConsultationAdmin,
} from './actions';
import type { Database } from '@/types/database';

type ConsultationRow = Database['public']['Tables']['consultations']['Row'];

export type EnrichedConsultation = ConsultationRow & {
  user_email: string;
  user_full_name: string | null;
  user_plan: 'basic' | 'premium' | 'vip';
  user_phone: string | null;
};

type Tab = 'requested' | 'scheduled' | 'closed';

const TYPE_META: Record<
  Database['public']['Enums']['consultation_type'],
  { label: string; icon: React.ReactNode; tone: string }
> = {
  video: { label: 'Vidyo', icon: <Video className="w-3.5 h-3.5" strokeWidth={2.2} />, tone: 'bg-indigo-100 text-indigo-700' },
  audio: { label: 'Telefòn', icon: <Phone className="w-3.5 h-3.5" strokeWidth={2.2} />, tone: 'bg-sky-100 text-sky-700' },
  in_person: { label: 'An pèsòn', icon: <UsersIcon className="w-3.5 h-3.5" strokeWidth={2.2} />, tone: 'bg-forest-100 text-forest-700' },
  written: { label: 'Ekri', icon: <FileText className="w-3.5 h-3.5" strokeWidth={2.2} />, tone: 'bg-amber-100 text-amber-700' },
};

const PLAN_LABEL: Record<string, string> = {
  basic: 'Bazilik',
  premium: 'Sitwonèl',
  vip: 'Melis',
};

function fmtRequestedAt(iso: string) {
  return new Intl.DateTimeFormat('fr-HT', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function fmtScheduledAt(iso: string | null) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('fr-HT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default function ConsultationsBoard({
  initial,
  counts,
}: {
  initial: EnrichedConsultation[];
  counts: { requested: number; scheduled: number; closed: number };
}) {
  const [tab, setTab] = React.useState<Tab>('requested');

  const filtered = React.useMemo(() => {
    if (tab === 'requested') return initial.filter((c) => c.status === 'requested');
    if (tab === 'scheduled') return initial.filter((c) => c.status === 'scheduled');
    return initial.filter(
      (c) => c.status === 'completed' || c.status === 'cancelled' || c.status === 'no_show'
    );
  }, [initial, tab]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5 mb-5 p-1.5 rounded-xl bg-cream-100 border border-cream-200 w-fit">
        <TabBtn active={tab === 'requested'} onClick={() => setTab('requested')}>
          Demann <Badge>{counts.requested}</Badge>
        </TabBtn>
        <TabBtn active={tab === 'scheduled'} onClick={() => setTab('scheduled')}>
          Pwograme <Badge>{counts.scheduled}</Badge>
        </TabBtn>
        <TabBtn active={tab === 'closed'} onClick={() => setTab('closed')}>
          Pase <Badge>{counts.closed}</Badge>
        </TabBtn>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-cream-200 rounded-2xl p-10 text-center shadow-card">
          <span className="inline-grid place-items-center w-12 h-12 rounded-2xl bg-cream-100 text-earth-500 mb-3">
            <Inbox className="w-5 h-5" strokeWidth={1.8} />
          </span>
          <div className="font-display text-base font-bold text-ink">
            {tab === 'requested' && 'Pa gen demann ann atant'}
            {tab === 'scheduled' && 'Pa gen konsiltasyon pwograme'}
            {tab === 'closed' && 'Pa gen istwa konsiltasyon ankò'}
          </div>
          <p className="text-xs text-earth-600 mt-1">
            {tab === 'requested'
              ? 'Lè manm yo voye yon demann, w ap wè li la a.'
              : 'Wè onglet yo pou jwenn yo.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((c) => (
            <ConsultationCard key={c.id} consultation={c} />
          ))}
        </ul>
      )}
    </>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition',
        active
          ? 'bg-white text-ink shadow-sm'
          : 'text-earth-600 hover:text-ink'
      )}
    >
      {children}
    </button>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-cream-200 text-earth-700 text-[10px] font-bold">
      {children}
    </span>
  );
}

function ConsultationCard({
  consultation: c,
}: {
  consultation: EnrichedConsultation;
}) {
  const router = useRouter();
  const typeMeta = TYPE_META[c.type];
  const [expanded, setExpanded] = React.useState(c.status === 'requested');
  const [error, setError] = React.useState<string | null>(null);

  const userName =
    c.user_full_name || c.user_email.split('@')[0] || 'Manm';

  return (
    <li
      className={cn(
        'bg-white border rounded-2xl shadow-card overflow-hidden',
        c.status === 'requested'
          ? 'border-amber-200'
          : c.status === 'scheduled'
          ? 'border-forest-200'
          : 'border-cream-200'
      )}
    >
      <header className="grid grid-cols-[auto_1fr_auto] gap-3 items-start p-4">
        <span className={cn('grid place-items-center w-10 h-10 rounded-xl shrink-0', typeMeta.tone)}>
          {typeMeta.icon}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-bold text-ink">{userName}</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-cream-100 text-earth-700 border border-cream-200">
              {typeMeta.label}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-cream-100 text-earth-700">
              Plan {PLAN_LABEL[c.user_plan] ?? c.user_plan}
            </span>
            <StatusPill status={c.status} />
          </div>
          <div className="text-xs text-earth-600 mt-1 flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Mail className="w-3 h-3" strokeWidth={2} />
              {c.user_email}
            </span>
            {c.user_phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3 h-3" strokeWidth={2} />
                {c.user_phone}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" strokeWidth={2} />
              Voye {fmtRequestedAt(c.created_at)}
            </span>
            {c.scheduled_at && (
              <span className="inline-flex items-center gap-1 text-forest-700 font-semibold">
                <CalendarCheck className="w-3 h-3" strokeWidth={2} />
                {fmtScheduledAt(c.scheduled_at)}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="grid place-items-center w-8 h-8 rounded-lg text-earth-500 hover:text-ink hover:bg-cream-50 transition"
          aria-label={expanded ? 'Fèmen' : 'Ouvri'}
        >
          <ChevronDown
            className={cn('w-4 h-4 transition-transform', expanded && 'rotate-180')}
            strokeWidth={2.2}
          />
        </button>
      </header>

      {expanded && (
        <div className="px-4 pb-4 border-t border-cream-200/60 pt-3 space-y-4">
          {c.topic && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-earth-500 font-bold mb-1">
                Sijè
              </div>
              <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
                {c.topic}
              </p>
            </div>
          )}
          {c.notes && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-earth-500 font-bold mb-1">
                Nòt
              </div>
              <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{c.notes}</p>
            </div>
          )}
          {c.recommendations && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-earth-500 font-bold mb-1">
                Rekòmandasyon
              </div>
              <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{c.recommendations}</p>
            </div>
          )}
          {c.prescription && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <div className="text-[10px] uppercase tracking-wider text-amber-700 font-bold mb-1">
                Òdonans
              </div>
              <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{c.prescription}</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
              <span>{error}</span>
            </div>
          )}

          {c.status === 'requested' && (
            <ScheduleForm
              consultation={c}
              onSuccess={() => router.refresh()}
              onError={setError}
            />
          )}
          {c.status === 'scheduled' && (
            <CompleteForm
              consultation={c}
              onSuccess={() => router.refresh()}
              onError={setError}
            />
          )}
        </div>
      )}
    </li>
  );
}

function StatusPill({ status }: { status: ConsultationRow['status'] }) {
  const meta: Record<
    ConsultationRow['status'],
    { label: string; tone: string }
  > = {
    requested: { label: 'Ann atant', tone: 'bg-amber-100 text-amber-700' },
    scheduled: { label: 'Pwograme', tone: 'bg-forest-100 text-forest-700' },
    completed: { label: 'Konplete', tone: 'bg-sky-100 text-sky-700' },
    cancelled: { label: 'Anile', tone: 'bg-rose-100 text-rose-700' },
    no_show: { label: 'Pa parèt', tone: 'bg-cream-200 text-earth-700' },
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full',
        meta[status].tone
      )}
    >
      {meta[status].label}
    </span>
  );
}

/* ─── Schedule form (requested → scheduled) ──────────────────────────── */

function ScheduleForm({
  consultation: c,
  onSuccess,
  onError,
}: {
  consultation: EnrichedConsultation;
  onSuccess: () => void;
  onError: (s: string | null) => void;
}) {
  const [consultantName, setConsultantName] = React.useState('Vye Ewòl');
  const [consultantRole, setConsultantRole] = React.useState('Èrboris santiniye');
  const [date, setDate] = React.useState('');
  const [time, setTime] = React.useState('');
  const [duration, setDuration] = React.useState(30);
  const [meetingUrl, setMeetingUrl] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);

  React.useEffect(() => {
    const t = new Date(Date.now() + 86400000);
    t.setHours(14, 0, 0, 0);
    setDate(t.toISOString().slice(0, 10));
    setTime('14:00');
  }, []);

  async function onSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time) return;
    setSubmitting(true);
    onError(null);
    const scheduled_at = new Date(`${date}T${time}`).toISOString();
    const res = await scheduleConsultation(c.id, {
      consultant_name: consultantName,
      consultant_role: consultantRole,
      scheduled_at,
      duration_minutes: duration,
      meeting_url: meetingUrl,
      notes,
    });
    setSubmitting(false);
    if (!res.ok) {
      onError(res.error);
      return;
    }
    onSuccess();
  }

  async function onReject() {
    setCancelling(true);
    onError(null);
    const reason = window.prompt('Rezon pou anile demann nan? (opsyonèl)') ?? '';
    const res = await cancelConsultationAdmin(c.id, reason || null);
    setCancelling(false);
    if (!res.ok) {
      onError(res.error);
      return;
    }
    onSuccess();
  }

  return (
    <form onSubmit={onSchedule} className="rounded-xl bg-cream-50/60 border border-cream-200 p-4 space-y-3">
      <header className="flex items-center gap-2 mb-1">
        <CalendarCheck className="w-4 h-4 text-forest-700" strokeWidth={2.2} />
        <h4 className="text-sm font-bold text-ink">Pwograme demann sa</h4>
      </header>

      <div className="grid sm:grid-cols-2 gap-3">
        <FormField label="Konsiltan">
          <input
            type="text"
            value={consultantName}
            onChange={(e) => setConsultantName(e.target.value)}
            required
            minLength={2}
            className={input}
          />
        </FormField>
        <FormField label="Wòl konsiltan an (opsyonèl)">
          <input
            type="text"
            value={consultantRole}
            onChange={(e) => setConsultantRole(e.target.value)}
            placeholder="Èrboris, Doktè, eks."
            className={input}
          />
        </FormField>
        <FormField label="Dat">
          <input
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            required
            className={input}
          />
        </FormField>
        <FormField label="Èdtan">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            className={input}
          />
        </FormField>
        <FormField label="Dire (min)">
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className={input}
          >
            <option value={15}>15 min</option>
            <option value={30}>30 min</option>
            <option value={45}>45 min</option>
            <option value={60}>60 min</option>
            <option value={90}>90 min</option>
          </select>
        </FormField>
        <FormField label="Lyen reyinyon (opsyonèl)">
          <input
            type="url"
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
            placeholder="https://meet.google.com/…"
            className={input}
          />
        </FormField>
      </div>

      <FormField label="Mesaj pou manm nan (opsyonèl)">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Ti detay pou prepare reyinyon an…"
          className={cn(input, 'resize-y')}
        />
      </FormField>

      <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
        <button
          type="button"
          onClick={onReject}
          disabled={cancelling || submitting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition disabled:opacity-60"
        >
          {cancelling ? <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.2} /> : <XCircle className="w-3 h-3" strokeWidth={2.2} />}
          Refize demann
        </button>
        <button
          type="submit"
          disabled={submitting || cancelling}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 rounded-lg transition"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />}
          Pwograme + voye notif
        </button>
      </div>
    </form>
  );
}

/* ─── Complete form (scheduled → completed) ──────────────────────────── */

function CompleteForm({
  consultation: c,
  onSuccess,
  onError,
}: {
  consultation: EnrichedConsultation;
  onSuccess: () => void;
  onError: (s: string | null) => void;
}) {
  const [showFull, setShowFull] = React.useState(false);
  const [notes, setNotes] = React.useState(c.notes ?? '');
  const [recommendations, setRecommendations] = React.useState(c.recommendations ?? '');
  const [prescription, setPrescription] = React.useState(c.prescription ?? '');
  const [followUpAt, setFollowUpAt] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);

  async function onComplete(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    onError(null);
    const res = await completeConsultation(c.id, {
      notes: notes || null,
      recommendations: recommendations || null,
      prescription: prescription || null,
      follow_up_at: followUpAt || null,
    });
    setSubmitting(false);
    if (!res.ok) {
      onError(res.error);
      return;
    }
    onSuccess();
  }

  async function onCancel() {
    if (!window.confirm('Sèten ou vle anile konsiltasyon sa?')) return;
    setCancelling(true);
    onError(null);
    const res = await cancelConsultationAdmin(c.id, null);
    setCancelling(false);
    if (!res.ok) {
      onError(res.error);
      return;
    }
    onSuccess();
  }

  if (!showFull) {
    return (
      <div className="flex items-center justify-between gap-2 flex-wrap rounded-xl bg-cream-50 border border-cream-200 p-3">
        <span className="text-xs text-earth-600">
          Konsiltasyon sa pwograme. Ranpli swivi a lè li fini.
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={cancelling}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition disabled:opacity-60"
          >
            {cancelling ? <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.2} /> : <XCircle className="w-3 h-3" strokeWidth={2.2} />}
            Anile
          </button>
          <button
            type="button"
            onClick={() => setShowFull(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-lg transition"
          >
            <CheckCircle2 className="w-3 h-3" strokeWidth={2.2} />
            Make konplete
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onComplete} className="rounded-xl bg-cream-50/60 border border-cream-200 p-4 space-y-3">
      <h4 className="text-sm font-bold text-ink">Fini konsiltasyon sa</h4>

      <FormField label="Nòt entèn (sa pasyan an pap wè)">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={cn(input, 'resize-y')}
        />
      </FormField>

      <FormField label="Rekòmandasyon (pasyan an ap wè sa)">
        <textarea
          value={recommendations}
          onChange={(e) => setRecommendations(e.target.value)}
          rows={3}
          className={cn(input, 'resize-y')}
        />
      </FormField>

      <FormField label="Òdonans (opsyonèl)">
        <textarea
          value={prescription}
          onChange={(e) => setPrescription(e.target.value)}
          rows={2}
          className={cn(input, 'resize-y')}
          placeholder="Medikaman + dòz, tizan, eks."
        />
      </FormField>

      <FormField label="Dat swivi (opsyonèl)">
        <input
          type="datetime-local"
          value={followUpAt}
          onChange={(e) => setFollowUpAt(e.target.value)}
          className={input}
        />
      </FormField>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => setShowFull(false)}
          className="px-3 py-1.5 text-sm font-semibold text-earth-700 hover:text-ink transition"
        >
          Anile
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 rounded-lg transition"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />}
          Make konplete
        </button>
      </div>
    </form>
  );
}

const input =
  'w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300';

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-earth-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
