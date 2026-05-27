'use client';

import React from 'react';
import {
  CalendarPlus,
  Video,
  Phone,
  Users,
  FileText,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createConsultation, cancelConsultation } from '@/app/dashboard/settings/actions';
import type { Database } from '@/types/database';

type ConsultationRow = Database['public']['Tables']['consultations']['Row'];

const TYPE_META: Record<
  Database['public']['Enums']['consultation_type'],
  { label: string; icon: React.ReactNode; tone: string }
> = {
  video: { label: 'Vidyo', icon: <Video className="w-3.5 h-3.5" strokeWidth={2.2} />, tone: 'bg-indigo-100 text-indigo-700' },
  audio: { label: 'Telefòn', icon: <Phone className="w-3.5 h-3.5" strokeWidth={2.2} />, tone: 'bg-sky-100 text-sky-700' },
  in_person: { label: 'An pèsòn', icon: <Users className="w-3.5 h-3.5" strokeWidth={2.2} />, tone: 'bg-forest-100 text-forest-700' },
  written: { label: 'Ekri', icon: <FileText className="w-3.5 h-3.5" strokeWidth={2.2} />, tone: 'bg-amber-100 text-amber-700' },
};

const STATUS_META: Record<
  Database['public']['Enums']['consultation_status'],
  { label: string; tone: string }
> = {
  requested: { label: 'Ann atant', tone: 'bg-amber-100 text-amber-700' },
  scheduled: { label: 'Pwograme', tone: 'bg-gold-100 text-gold-600' },
  completed: { label: 'Konplete', tone: 'bg-forest-100 text-forest-700' },
  cancelled: { label: 'Anile', tone: 'bg-rose-100 text-rose-700' },
  no_show: { label: 'Pa parèt', tone: 'bg-cream-200 text-earth-700' },
};

function formatDateTime(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return new Intl.DateTimeFormat('fr-HT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export default function ConsultationsPanel({
  initial,
}: {
  initial: ConsultationRow[];
}) {
  const [items, setItems] = React.useState(initial);
  const [showForm, setShowForm] = React.useState(false);
  const [cancellingId, setCancellingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => setItems(initial), [initial]);

  const now = Date.now();
  // Requests (awaiting admin to schedule) + upcoming scheduled meetings
  // both belong in the "active" lane.
  const upcoming = items.filter(
    (c) =>
      c.status === 'requested' ||
      (c.status === 'scheduled' &&
        c.scheduled_at !== null &&
        new Date(c.scheduled_at).getTime() >= now)
  );
  const past = items.filter(
    (c) =>
      !(
        c.status === 'requested' ||
        (c.status === 'scheduled' &&
          c.scheduled_at !== null &&
          new Date(c.scheduled_at).getTime() >= now)
      )
  );

  async function onCreate(data: {
    type: 'video' | 'audio' | 'in_person' | 'written';
    topic: string;
    preferred_timeframe: string;
  }) {
    setError(null);
    const res = await createConsultation({
      type: data.type,
      topic: data.topic,
      preferred_timeframe: data.preferred_timeframe || null,
    });
    if (!res.ok) {
      setError(res.error);
      return false;
    }
    setItems((prev) => [res.consultation, ...prev]);
    setShowForm(false);
    return true;
  }

  async function onCancel(id: string) {
    setCancellingId(id);
    setError(null);
    const res = await cancelConsultation(id);
    setCancellingId(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setItems((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'cancelled' as const } : c))
    );
  }

  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
      <header className="flex items-start justify-between gap-3 flex-wrap mb-5">
        <div>
          <h2 className="font-display text-lg md:text-xl font-bold text-ink">
            Dosye Konsiltasyon
          </h2>
          <p className="text-sm text-earth-600 mt-1">
            Voye yon demann konsiltasyon. Yon admin Hoïs ap kontakte w pou
            pwograme dat ak èdtan an, epi swivi w pandan ak apre konsiltasyon
            an.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-lg transition"
          >
            <CalendarPlus className="w-3.5 h-3.5" strokeWidth={2.2} />
            Mande yon konsiltasyon
          </button>
        )}
      </header>

      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
          <span>{error}</span>
        </div>
      )}

      {showForm && (
        <BookingForm onSubmit={onCreate} onCancel={() => setShowForm(false)} />
      )}

      {upcoming.length > 0 && (
        <div className={cn('mt-2', showForm && 'mt-6')}>
          <h3 className="text-xs uppercase tracking-wider text-earth-600 font-semibold mb-3">
            Pwograme + ann atant
          </h3>
          <ul className="space-y-2">
            {upcoming.map((c) => (
              <ConsultationItem
                key={c.id}
                consultation={c}
                onCancel={onCancel}
                cancelling={cancellingId === c.id}
              />
            ))}
          </ul>
        </div>
      )}

      {past.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs uppercase tracking-wider text-earth-600 font-semibold mb-3">
            Istwa konsiltasyon
          </h3>
          <ul className="space-y-2">
            {past.map((c) => (
              <ConsultationItem key={c.id} consultation={c} onCancel={onCancel} cancelling={false} />
            ))}
          </ul>
        </div>
      )}

      {items.length === 0 && !showForm && (
        <div className="text-center py-8 rounded-xl bg-cream-50 border border-dashed border-cream-200">
          <p className="text-sm text-earth-600">
            Ou poko gen konsiltasyon. Klike <strong>Mande yon konsiltasyon</strong>{' '}
            pou voye yon demann.
          </p>
        </div>
      )}
    </section>
  );
}

function ConsultationItem({
  consultation: c,
  onCancel,
  cancelling,
}: {
  consultation: ConsultationRow;
  onCancel: (id: string) => void;
  cancelling: boolean;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const typeMeta = TYPE_META[c.type];
  const statusMeta = STATUS_META[c.status];
  const canCancel =
    c.status === 'requested' ||
    (c.status === 'scheduled' &&
      c.scheduled_at !== null &&
      new Date(c.scheduled_at).getTime() > Date.now());
  const hasDetails = c.notes || c.recommendations || c.prescription;
  const formattedTime = formatDateTime(c.scheduled_at);
  const headline =
    c.consultant_name ||
    (c.status === 'requested' ? 'Demann ann atant — admin ap kontakte w' : 'Konsiltasyon');

  return (
    <li className="rounded-xl border border-cream-200 bg-cream-50 hover:bg-white transition overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left grid grid-cols-[auto_1fr_auto] gap-3 items-center p-3"
      >
        <span className={cn('grid place-items-center w-9 h-9 rounded-lg', typeMeta.tone)}>
          {typeMeta.icon}
        </span>
        <div className="min-w-0">
          <div className="font-semibold text-sm text-ink truncate">
            {headline}
            {c.consultant_role && (
              <span className="text-earth-500 font-normal"> · {c.consultant_role}</span>
            )}
          </div>
          <div className="text-[11px] text-earth-600 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <Clock className="w-3 h-3" strokeWidth={2.2} />
            <span>
              {formattedTime
                ? formattedTime
                : 'Dat poko fikse — admin ap pwograme l'}
            </span>
            {c.duration_minutes && formattedTime && (
              <>
                <span aria-hidden>·</span>
                <span>{c.duration_minutes} min</span>
              </>
            )}
            {c.topic && (
              <>
                <span aria-hidden>·</span>
                <span className="truncate">{c.topic}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full',
              statusMeta.tone
            )}
          >
            {statusMeta.label}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 grid gap-2.5 border-t border-cream-200/60 pt-3">
          {c.meeting_url && c.status === 'scheduled' && (
            <a
              href={c.meeting_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700 hover:text-forest-800 w-fit"
            >
              <ExternalLink className="w-3 h-3" strokeWidth={2.2} />
              Lyen reyinyon
            </a>
          )}
          {c.notes && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-earth-500 font-semibold mb-1">
                Nòt konsiltan an
              </div>
              <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{c.notes}</p>
            </div>
          )}
          {c.recommendations && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-earth-500 font-semibold mb-1">
                Rekòmandasyon
              </div>
              <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{c.recommendations}</p>
            </div>
          )}
          {c.prescription && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <div className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold mb-1">
                Òdonans
              </div>
              <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{c.prescription}</p>
            </div>
          )}
          {c.follow_up_at && (
            <div className="text-xs text-earth-600 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-forest-700" strokeWidth={2.2} />
              Swivi planifye pou {formatDateTime(c.follow_up_at)}
            </div>
          )}
          {!hasDetails && c.status === 'scheduled' && (
            <p className="text-xs text-earth-500 italic">
              Nòt yo ap parèt isit la apre konsiltasyon an.
            </p>
          )}
          {canCancel && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onCancel(c.id)}
                disabled={cancelling}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition disabled:opacity-60"
              >
                {cancelling ? (
                  <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.2} />
                ) : (
                  <XCircle className="w-3 h-3" strokeWidth={2.2} />
                )}
                {c.status === 'requested' ? 'Anile demann' : 'Anile konsiltasyon'}
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function BookingForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: {
    type: 'video' | 'audio' | 'in_person' | 'written';
    topic: string;
    preferred_timeframe: string;
  }) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [type, setType] = React.useState<'video' | 'audio' | 'in_person' | 'written'>('video');
  const [topic, setTopic] = React.useState('');
  const [preferredTimeframe, setPreferredTimeframe] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (topic.trim().length < 4) return;
    setSubmitting(true);
    const ok = await onSubmit({
      type,
      topic: topic.trim(),
      preferred_timeframe: preferredTimeframe.trim(),
    });
    setSubmitting(false);
    if (ok) {
      setTopic('');
      setPreferredTimeframe('');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 rounded-xl border border-cream-200 bg-cream-50/50 p-4 space-y-3"
    >
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-900 leading-relaxed">
        Yon admin Hoïs ap revize demann ou epi kontakte w pou fikse dat + èdtan
        an. Ou pap chwazi dat la la a — admin nan pwograme l avèk ou.
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-earth-700">
            Tip konsiltasyon
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="mt-1 w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200"
          >
            <option value="video">Vidyo</option>
            <option value="audio">Telefòn</option>
            <option value="in_person">An pèsòn</option>
            <option value="written">Ekri</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-earth-700">
            Tan ki pi bon pou ou (opsyonèl)
          </label>
          <input
            type="text"
            value={preferredTimeframe}
            onChange={(e) => setPreferredTimeframe(e.target.value)}
            placeholder="ex: maten yo, jou semèn 14:00–18:00"
            className="mt-1 w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-earth-700">
          Sijè / sa w bezwen pale sou li <span className="text-rose-600">*</span>
        </label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
          minLength={4}
          maxLength={1000}
          rows={4}
          placeholder="Dekri kondisyon, sentom, oswa sijè w vle pale sou li…"
          className="mt-1 w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 resize-y"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-3 py-1.5 text-sm font-semibold text-earth-700 hover:text-ink transition"
        >
          Anile
        </button>
        <button
          type="submit"
          disabled={submitting || topic.trim().length < 4}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 rounded-lg transition"
        >
          {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />}
          Voye demann
        </button>
      </div>
    </form>
  );
}
