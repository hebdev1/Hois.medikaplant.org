'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Pill,
  Leaf,
  Activity,
  Eye,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { markTreatmentRead, toggleDoseToday } from '@/app/dashboard/health/actions';
import type { Database } from '@/types/database';

export type Treatment = Database['public']['Tables']['treatment_recommendations']['Row'];
type Kind = Database['public']['Enums']['treatment_kind'];

export type Adherence = { takenToday: boolean; week: boolean[]; pct: number };

const KIND_META: Record<
  Kind,
  { label: string; icon: typeof Pill; bg: string; iconColor: string }
> = {
  medication: {
    label: 'Medikaman',
    icon: Pill,
    bg: 'bg-indigo-100',
    iconColor: 'text-indigo-700',
  },
  herbal: {
    label: 'Tizan / Plant',
    icon: Leaf,
    bg: 'bg-forest-100',
    iconColor: 'text-forest-700',
  },
  lifestyle: {
    label: 'Abitid lavi',
    icon: Activity,
    bg: 'bg-amber-100',
    iconColor: 'text-amber-700',
  },
  monitoring: {
    label: 'Swivi',
    icon: Eye,
    bg: 'bg-sky-100',
    iconColor: 'text-sky-700',
  },
  referral: {
    label: 'Referans',
    icon: ArrowRight,
    bg: 'bg-rose-100',
    iconColor: 'text-rose-700',
  },
};

const METRIC_LABEL: Record<string, string> = {
  blood_sugar: 'Sik nan san',
  weight: 'Pwa',
  pressure: 'Tansyon',
};

const HT_DATE = (iso: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const MOIS = [
    'Janvye', 'Fevriye', 'Mas', 'Avril', 'Me', 'Jen',
    'Jiyè', 'Out', 'Septanm', 'Oktòb', 'Novanm', 'Desanm',
  ];
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
};

export default function TreatmentsSection({
  treatments,
  adherence = {},
}: {
  treatments: Treatment[];
  adherence?: Record<string, Adherence>;
}) {
  const active = treatments.filter((t) => t.status === 'active');
  const archive = treatments.filter((t) => t.status !== 'active');

  if (treatments.length === 0) {
    return (
      <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
        <header className="mb-3">
          <h2 className="font-display text-lg font-bold text-ink">
            Pwopozisyon <em className="text-forest-600 not-italic font-bold">Ton vye</em>
          </h2>
        </header>
        <div className="rounded-xl bg-cream-50 border border-dashed border-cream-200 p-6 text-center">
          <p className="text-sm text-earth-600">
            Lè Ton vye la voye yon medikaman, yon tizan, oswa yon konsèy pou ou,
            ou pral wè li la a.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">
            Pwopozisyon <em className="text-forest-600 not-italic font-bold">Ton vye</em>
          </h2>
          <p className="text-xs text-earth-600 mt-0.5">
            Bazile sou mezi ou yo ak kondisyon ou yo.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-forest-100 text-forest-700">
          {active.length} aktif
        </span>
      </header>

      <ul className="space-y-3">
        {active.map((t) => (
          <TreatmentItem
            key={t.id}
            treatment={t}
            initialUnread={!t.read_at}
            adherence={adherence[t.id]}
          />
        ))}
      </ul>

      {archive.length > 0 && (
        <details className="mt-5 pt-4 border-t border-cream-200/60">
          <summary className="cursor-pointer text-xs font-semibold text-earth-600 hover:text-ink inline-flex items-center gap-1">
            <ChevronDown className="w-3 h-3" strokeWidth={2.4} />
            {archive.length} pwopozisyon pase yo
          </summary>
          <ul className="mt-3 space-y-2">
            {archive.map((t) => (
              <TreatmentItem
                key={t.id}
                treatment={t}
                initialUnread={false}
                compact
              />
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function TreatmentItem({
  treatment: t,
  initialUnread,
  compact = false,
  adherence,
}: {
  treatment: Treatment;
  initialUnread: boolean;
  compact?: boolean;
  adherence?: Adherence;
}) {
  const router = useRouter();
  const [unread, setUnread] = React.useState(initialUnread);
  const [expanded, setExpanded] = React.useState(initialUnread && !compact);
  const meta = KIND_META[t.kind] ?? KIND_META.monitoring;
  const Icon = meta.icon;

  // Adherence toggle state (optimistic). `pct` is read straight from the prop
  // so it refreshes from the server after router.refresh().
  const [takenToday, setTakenToday] = React.useState(
    adherence?.takenToday ?? false
  );
  const [week, setWeek] = React.useState<boolean[]>(adherence?.week ?? []);
  const [dosePending, setDosePending] = React.useState(false);

  async function toggleDose() {
    if (dosePending) return;
    const next = !takenToday;
    setDosePending(true);
    setTakenToday(next);
    setWeek((w) => (w.length ? [...w.slice(0, -1), next] : w));
    const res = await toggleDoseToday(t.id, next).catch(() => ({
      ok: false as const,
    }));
    if (!res.ok) {
      setTakenToday(!next);
      setWeek((w) => (w.length ? [...w.slice(0, -1), !next] : w));
    } else {
      router.refresh();
    }
    setDosePending(false);
  }

  // Auto-mark as read once expanded
  React.useEffect(() => {
    if (!unread || !expanded) return;
    markTreatmentRead(t.id).then((res) => {
      if (res.ok) setUnread(false);
    });
  }, [unread, expanded, t.id]);

  const isCancelled = t.status === 'cancelled';
  const isCompleted = t.status === 'completed';

  return (
    <li
      className={cn(
        'rounded-xl border transition-colors overflow-hidden',
        unread
          ? 'bg-forest-50/40 border-forest-200'
          : compact
          ? 'bg-cream-50/40 border-cream-200'
          : 'bg-cream-50 border-cream-200'
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="w-full text-left grid grid-cols-[auto_1fr_auto] gap-3 items-center p-3"
      >
        <span className={cn('grid place-items-center w-10 h-10 rounded-xl shrink-0', meta.bg, meta.iconColor)}>
          <Icon className="w-4 h-4" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-ink truncate">{t.title}</span>
            {unread && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-forest-600 text-cream-50 text-[9px] font-bold uppercase tracking-wide">
                Nouvo
              </span>
            )}
            {isCancelled && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[9px] font-bold uppercase tracking-wide">
                Anile
              </span>
            )}
            {isCompleted && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-forest-100 text-forest-700 text-[9px] font-bold uppercase tracking-wide">
                <CheckCircle2 className="w-2.5 h-2.5" strokeWidth={2.4} />
                Konplete
              </span>
            )}
            {adherence && takenToday && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-forest-600 text-cream-50 text-[9px] font-bold uppercase tracking-wide">
                <CheckCircle2 className="w-2.5 h-2.5" strokeWidth={2.4} />
                Fèt jodi a
              </span>
            )}
          </div>
          <div className="text-[11px] text-earth-600 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>{meta.label}</span>
            {t.related_metric && METRIC_LABEL[t.related_metric] && (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <Activity className="w-3 h-3" strokeWidth={2.2} />
                  {METRIC_LABEL[t.related_metric]}
                </span>
              </>
            )}
            {t.related_condition && (
              <>
                <span aria-hidden>·</span>
                <span>{t.related_condition}</span>
              </>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn('w-4 h-4 text-earth-500 shrink-0 transition-transform', expanded && 'rotate-180')}
          strokeWidth={2}
        />
      </button>

      {expanded && (
        <div className="px-3 pb-4 border-t border-cream-200/60 pt-3 grid gap-2.5">
          <p className="text-sm text-ink/90 leading-relaxed whitespace-pre-wrap">
            {t.description}
          </p>

          {(t.dose || t.frequency || t.duration) && (
            <div className="grid sm:grid-cols-3 gap-2">
              {t.dose && (
                <DetailBlock label="Dòz" value={t.dose} />
              )}
              {t.frequency && (
                <DetailBlock label="Frekans" value={t.frequency} />
              )}
              {t.duration && (
                <DetailBlock label="Dire" value={t.duration} />
              )}
            </div>
          )}

          {(t.start_date || t.end_date) && (
            <div className="text-[11px] text-earth-600 inline-flex items-center gap-1.5 flex-wrap">
              <Calendar className="w-3 h-3" strokeWidth={2.2} />
              <span>Soti {HT_DATE(t.start_date)}</span>
              {t.end_date && (
                <>
                  <span aria-hidden>→</span>
                  <span>{HT_DATE(t.end_date)}</span>
                </>
              )}
            </div>
          )}

          {t.notes && (
            <div className="text-xs text-earth-700 italic bg-cream-50 border border-cream-200 rounded-lg px-3 py-2">
              <strong className="not-italic">Nòt:</strong> {t.notes}
            </div>
          )}

          {t.kind === 'medication' && (
            <div className="flex items-start gap-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" strokeWidth={2.4} />
              <span>
                Toujou suiv konsèy doktè ou. Pa janm chanje dòz san pale ak yon
                pwofesyonèl sante.
              </span>
            </div>
          )}

          {/* Adherence: 7-day streak + "did it today" toggle */}
          {adherence && (
            <div className="rounded-xl bg-forest-50/60 border border-forest-100 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700">
                  Obsèvans
                </span>
                <span className="text-[11px] font-semibold text-forest-700">
                  {adherence.pct}% sou 30 jou
                </span>
              </div>
              {week.length > 0 && (
                <div className="flex items-center gap-1.5 mb-3">
                  {week.map((done, i) => (
                    <span
                      key={i}
                      title={i === week.length - 1 ? 'Jodi a' : undefined}
                      className={cn(
                        'w-5 h-5 rounded-full grid place-items-center transition-colors',
                        done ? 'bg-forest-600' : 'bg-cream-200',
                        i === week.length - 1 &&
                          'ring-2 ring-offset-1 ring-forest-300'
                      )}
                    >
                      {done && (
                        <CheckCircle2
                          className="w-3 h-3 text-cream-50"
                          strokeWidth={2.6}
                        />
                      )}
                    </span>
                  ))}
                  <span className="ml-1 text-[10px] text-earth-500">
                    7 dènye jou
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={toggleDose}
                disabled={dosePending}
                className={cn(
                  'w-full inline-flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold transition disabled:opacity-70',
                  takenToday
                    ? 'bg-forest-100 text-forest-800 hover:bg-forest-200'
                    : 'bg-forest-700 hover:bg-forest-800 text-cream-50'
                )}
              >
                {dosePending ? (
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
                ) : (
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2.4} />
                )}
                {takenToday ? 'Fèt jodi a ✓ — bravo!' : 'Mwen pran l jodi a'}
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white border border-cream-200 px-3 py-2">
      <div className="text-[9px] uppercase tracking-wider text-earth-500 font-bold mb-0.5">
        {label}
      </div>
      <div className="text-sm font-semibold text-ink leading-tight">{value}</div>
    </div>
  );
}
