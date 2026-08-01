'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Droplet, Loader2, Plus, X, CalendarHeart } from 'lucide-react';
import { logPeriodDay, removePeriodDay } from '@/app/dashboard/health/actions';

type Day = { day: string; flow: number | null };

const MONTHS_HT = [
  'Jan', 'Fev', 'Mas', 'Avr', 'Me', 'Jen',
  'Jiy', 'Out', 'Sep', 'Okt', 'Nov', 'Des',
];
function fmt(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${d.getUTCDate()} ${MONTHS_HT[d.getUTCMonth()]}`;
}
function daysBetween(a: string, b: string) {
  return Math.round(
    (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000
  );
}

function computeStats(days: Day[]) {
  const sorted = [...new Set(days.map((d) => d.day))].sort();
  if (sorted.length === 0) {
    return { avgCycle: null, avgLen: null, lastStart: null, next: null };
  }
  // Group consecutive days into "periods".
  const runs: string[][] = [];
  let run: string[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if (daysBetween(sorted[i - 1], sorted[i]) === 1) run.push(sorted[i]);
    else {
      runs.push(run);
      run = [sorted[i]];
    }
  }
  runs.push(run);
  const starts = runs.map((r) => r[0]);
  const lens = runs.map((r) => r.length);
  const avgLen = Math.round(lens.reduce((a, b) => a + b, 0) / lens.length);
  let avgCycle: number | null = null;
  if (starts.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < starts.length; i++) {
      gaps.push(daysBetween(starts[i - 1], starts[i]));
    }
    avgCycle = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
  }
  const lastStart = starts[starts.length - 1];
  let next: string | null = null;
  if (avgCycle) {
    const d = new Date(`${lastStart}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + avgCycle);
    next = d.toISOString().slice(0, 10);
  }
  return { avgCycle, avgLen, lastStart, next };
}

export default function MenstruationTracker({
  initialDays,
}: {
  initialDays: Day[];
}) {
  const router = useRouter();
  const [days, setDays] = React.useState<Day[]>(initialDays);
  const [pending, setPending] = React.useState(false);
  const [addDate, setAddDate] = React.useState('');

  const today = new Date().toISOString().slice(0, 10);
  const daySet = new Set(days.map((d) => d.day));
  const todayLogged = daySet.has(today);
  const stats = computeStats(days);
  const recent = [...days].sort((a, b) => (a.day < b.day ? 1 : -1)).slice(0, 21);

  async function mutate(fn: () => Promise<{ ok: boolean }>, optimistic: () => void, revert: () => void) {
    if (pending) return;
    setPending(true);
    optimistic();
    const res = await fn().catch(() => ({ ok: false as const }));
    if (!res.ok) revert();
    else router.refresh();
    setPending(false);
  }

  function toggleToday() {
    if (todayLogged) {
      mutate(
        () => removePeriodDay(today),
        () => setDays((d) => d.filter((x) => x.day !== today)),
        () => setDays((d) => [...d, { day: today, flow: null }])
      );
    } else {
      mutate(
        () => logPeriodDay(today, null),
        () => setDays((d) => [...d, { day: today, flow: null }]),
        () => setDays((d) => d.filter((x) => x.day !== today))
      );
    }
  }

  function addDay() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(addDate) || daySet.has(addDate)) return;
    const date = addDate;
    mutate(
      () => logPeriodDay(date, null),
      () => setDays((d) => [...d, { day: date, flow: null }]),
      () => setDays((d) => d.filter((x) => x.day !== date))
    );
    setAddDate('');
  }

  function remove(date: string) {
    mutate(
      () => removePeriodDay(date),
      () => setDays((d) => d.filter((x) => x.day !== date)),
      () => setDays((d) => [...d, { day: date, flow: null }])
    );
  }

  const Stat = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-xl bg-white border border-rose-100 px-3 py-2 text-center">
      <div className="font-display text-base font-bold text-rose-700 leading-tight">
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-earth-500 mt-0.5">
        {label}
      </div>
    </div>
  );

  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
      <header className="mb-4">
        <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
          <CalendarHeart className="w-5 h-5 text-rose-500" strokeWidth={2.2} />
          Swivi règ
        </h2>
        <p className="text-xs text-earth-600 mt-0.5">
          Make jou ou gen règ ou — n ap kalkile sik ou ak pwochen dat la.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat
          label="Dènye règ"
          value={stats.lastStart ? fmt(stats.lastStart) : '—'}
        />
        <Stat
          label="Sik mwayen"
          value={stats.avgCycle ? `${stats.avgCycle} jou` : '—'}
        />
        <Stat
          label="Pwochen ~"
          value={stats.next ? fmt(stats.next) : '—'}
        />
      </div>

      <button
        type="button"
        onClick={toggleToday}
        disabled={pending}
        className={`w-full inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
          todayLogged
            ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
            : 'bg-rose-500 hover:bg-rose-600 text-white'
        }`}
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
        ) : (
          <Droplet className="w-4 h-4" strokeWidth={2.2} />
        )}
        {todayLogged ? 'Jodi a make ✓ (retire)' : 'Make jodi a kòm jou règ'}
      </button>

      <div className="mt-3 flex items-center gap-2">
        <input
          type="date"
          value={addDate}
          max={today}
          onChange={(e) => setAddDate(e.target.value)}
          className="flex-1 text-sm rounded-lg border border-cream-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-200"
        />
        <button
          type="button"
          onClick={addDay}
          disabled={pending || !addDate}
          className="inline-flex items-center gap-1 rounded-lg bg-cream-100 hover:bg-cream-200 disabled:opacity-50 text-earth-700 px-3 py-2 text-sm font-semibold"
        >
          <Plus className="w-4 h-4" strokeWidth={2.4} />
          Ajoute yon jou
        </button>
      </div>

      {recent.length > 0 && (
        <div className="mt-4 pt-4 border-t border-cream-100">
          <div className="text-[11px] uppercase tracking-wider text-earth-500 font-semibold mb-2">
            Jou ki make yo
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recent.map((d) => (
              <button
                key={d.day}
                type="button"
                onClick={() => remove(d.day)}
                disabled={pending}
                title="Klike pou retire"
                className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 px-2.5 py-1 text-xs font-medium hover:bg-rose-100 transition"
              >
                {fmt(d.day)}
                <X className="w-3 h-3 opacity-60" strokeWidth={2.4} />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
