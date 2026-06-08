import { Sparkles, Calendar, Crown, Headphones, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import AdviceComposer from './advice-composer';
import AdviceRowActions from './advice-row-actions';
import type { Database } from '@/types/database';

export const metadata = { title: 'Admin · Konsèy jou a' };
export const dynamic = 'force-dynamic';

type AdviceRow = Database['public']['Tables']['daily_advice']['Row'];

const PLAN_LABEL: Record<string, string> = {
  basic: 'Bazilik',
  premium: 'Sitwonèl',
  vip: 'Melis',
};
const PLAN_TONE: Record<string, string> = {
  basic: 'bg-slate-100 text-slate-700',
  premium: 'bg-teal-100 text-teal-700',
  vip: 'bg-amber-100 text-amber-700',
};

const MOIS = [
  'Janvye', 'Fevriye', 'Mas', 'Avril', 'Me', 'Jen',
  'Jiyè', 'Out', 'Septanm', 'Oktòb', 'Novanm', 'Desanm',
];
function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}
function formatDuration(seconds: number | null) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m} min` : `${m}:${String(s).padStart(2, '0')}`;
}

export default async function AdminAdvicePage() {
  const supabase = createClient();
  const { data: rows } = await supabase
    .from('daily_advice')
    .select('*')
    .order('publish_date', { ascending: false })
    .limit(60);

  const all = (rows ?? []) as AdviceRow[];
  const today = new Date().toISOString().slice(0, 10);
  const todayAdvice = all.find((r) => r.publish_date === today) ?? null;
  const upcoming = all.filter((r) => r.publish_date > today);
  const past = all.filter((r) => r.publish_date < today);

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1280px] mx-auto">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" strokeWidth={2.2} />
          Admin · Konsèy jou a
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Konsèy plant chak jou
        </h1>
        <p className="mt-2 text-sm text-earth-600 max-w-2xl">
          Yo parèt sou tablodebò manm yo nan kat "Konsèy jou a". Yon konsèy
          pa jou  si dat la pase, manm nan wè dènye ki te pibliye a. Ou ka
          pwograme konsèy yo davans (nan yon pwochen dat ).
        </p>
      </header>

      {/* Today's advice — composer if missing, edit form if present */}
      <section className="bg-white border border-cream-200 rounded-2xl shadow-card p-5 md:p-6 mb-6">
        <header className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-gradient text-white">
              <Calendar className="w-4 h-4" strokeWidth={2.2} />
            </span>
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-forest-700 font-bold">
                Jodi a
              </div>
              <div className="font-display text-lg font-bold text-ink">
                {formatDate(today)}
              </div>
            </div>
          </div>
          {todayAdvice ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-forest-100 text-forest-700">
              Yon konsèy deja pibliye
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-amber-100 text-amber-800">
              Pa gen konsèy pou jodi a
            </span>
          )}
        </header>

        <AdviceComposer initial={todayAdvice} defaultDate={today} />
      </section>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section className="bg-white border border-cream-200 rounded-2xl shadow-card p-5 md:p-6 mb-6">
          <h2 className="font-display text-lg font-bold text-ink mb-3">
            Pwograme pou demen ak swit la
          </h2>
          <ul className="space-y-3">
            {upcoming.map((r) => (
              <AdviceListItem
                key={r.id}
                row={r}
                planLabel={PLAN_LABEL[r.plan_required]}
                planTone={PLAN_TONE[r.plan_required]}
                duration={formatDuration(r.duration_seconds)}
              />
            ))}
          </ul>
        </section>
      )}

      {/* Past */}
      <section className="bg-white border border-cream-200 rounded-2xl shadow-card p-5 md:p-6">
        <h2 className="font-display text-lg font-bold text-ink mb-3">
          Istwa ({past.length})
        </h2>
        {past.length === 0 ? (
          <div className="rounded-xl bg-cream-50 border border-dashed border-cream-200 p-6 text-center text-sm text-earth-600">
            Pa gen konsèy ki te pibliye anvan. Premye konsèy ou kreye a ap
            kòmanse istwa a.
          </div>
        ) : (
          <ul className="space-y-3">
            {past.map((r) => (
              <AdviceListItem
                key={r.id}
                row={r}
                planLabel={PLAN_LABEL[r.plan_required]}
                planTone={PLAN_TONE[r.plan_required]}
                duration={formatDuration(r.duration_seconds)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function AdviceListItem({
  row,
  planLabel,
  planTone,
  duration,
}: {
  row: AdviceRow;
  planLabel: string;
  planTone: string;
  duration: string | null;
}) {
  return (
    <li className="rounded-xl border border-cream-200 bg-cream-50/40 p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-earth-600 inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" strokeWidth={2.4} />
              {formatDate(row.publish_date)}
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${planTone}`}
            >
              <Crown className="w-2.5 h-2.5" strokeWidth={2.4} />
              {planLabel}
            </span>
            {row.audio_url && (
              <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 inline-flex items-center gap-1">
                <Headphones className="w-2.5 h-2.5" strokeWidth={2.4} />
                Odyo
              </span>
            )}
            {duration && (
              <span className="text-[10px] text-earth-500 inline-flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" strokeWidth={2.4} />
                {duration}
              </span>
            )}
          </div>
          <p
            className="font-serif text-sm text-ink leading-snug line-clamp-3"
            dangerouslySetInnerHTML={{ __html: row.body_html }}
          />
          {row.plant_name && (
            <div className="font-serif italic text-[11px] text-earth-600 mt-1">
              {row.plant_name}
            </div>
          )}
        </div>
        <AdviceRowActions id={row.id} />
      </div>
    </li>
  );
}
