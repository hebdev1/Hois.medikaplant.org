import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Activity } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import PrintButton from './print-button';

export const metadata = { title: 'Rapò Sante · Hoïs' };
export const dynamic = 'force-dynamic';

const MONTHS_HT = [
  'Janvye', 'Fevriye', 'Mas', 'Avril', 'Me', 'Jen',
  'Jiyè', 'Out', 'Septanm', 'Oktòb', 'Novanm', 'Desanm',
];
function dateHT(d: Date) {
  return `${d.getDate()} ${MONTHS_HT[d.getMonth()]} ${d.getFullYear()}`;
}

type Log = {
  blood_sugar: number | null;
  weight: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate: number | null;
  logged_at: string;
};

const METRICS: {
  key: keyof Omit<Log, 'logged_at'>;
  label: string;
  unit: string;
  decimals: number;
}[] = [
  { key: 'blood_sugar', label: 'Sik nan san', unit: 'mg/dL', decimals: 0 },
  { key: 'weight', label: 'Pwa', unit: 'kg', decimals: 1 },
  { key: 'blood_pressure_systolic', label: 'Tansyon sistolik', unit: 'mmHg', decimals: 0 },
  { key: 'blood_pressure_diastolic', label: 'Tansyon dyastolik', unit: 'mmHg', decimals: 0 },
  { key: 'heart_rate', label: 'Batman kè', unit: 'bpm', decimals: 0 },
];

export default async function HealthReportPage({
  searchParams,
}: {
  searchParams: { jou?: string };
}) {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login?redirect=/rapo-sante');

  const days = searchParams.jou === '90' ? 90 : 30;
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const [profileRes, logsRes, treatmentsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('health_logs')
      .select(
        'blood_sugar, weight, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, logged_at'
      )
      .eq('user_id', user.id)
      .gte('logged_at', since)
      .order('logged_at', { ascending: false }),
    supabase
      .from('treatment_recommendations')
      .select('title, kind, dose, frequency')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
  ]);

  const profile = profileRes.data as {
    full_name: string | null;
    email: string;
  } | null;
  const name = profile?.full_name?.trim() || profile?.email?.split('@')[0] || 'Elèv';
  const logs = (logsRes.data ?? []) as Log[];
  const treatments = (treatmentsRes.data ?? []) as Array<{
    title: string;
    kind: string;
    dose: string | null;
    frequency: string | null;
  }>;

  const summaries = METRICS.map((m) => {
    const values = logs
      .map((l) => l[m.key])
      .filter((v): v is number => typeof v === 'number');
    if (values.length === 0) return null;
    const sum = values.reduce((a, b) => a + b, 0);
    // Latest = first non-null value (logs are newest-first).
    const latest = logs.find((l) => typeof l[m.key] === 'number')?.[m.key] as number;
    return {
      ...m,
      count: values.length,
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      latest,
    };
  }).filter(Boolean) as Array<
    (typeof METRICS)[number] & {
      count: number;
      avg: number;
      min: number;
      max: number;
      latest: number;
    }
  >;

  const fmt = (v: number, d: number) => v.toFixed(d);

  return (
    <main className="min-h-screen bg-cream-100 print:bg-white px-4 py-8 md:py-10">
      {/* Actions (hidden on print) */}
      <div className="print:hidden max-w-3xl mx-auto mb-6 flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/dashboard/health"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-earth-700 hover:text-ink"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.2} />
          Tounen nan Swivi Sante
        </Link>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full border border-cream-300 bg-white p-0.5 text-xs font-semibold">
            <Link
              href="/rapo-sante?jou=30"
              className={`px-3 py-1.5 rounded-full ${days === 30 ? 'bg-forest-700 text-cream-50' : 'text-earth-700'}`}
            >
              30 jou
            </Link>
            <Link
              href="/rapo-sante?jou=90"
              className={`px-3 py-1.5 rounded-full ${days === 90 ? 'bg-forest-700 text-cream-50' : 'text-earth-700'}`}
            >
              90 jou
            </Link>
          </div>
          <PrintButton />
        </div>
      </div>

      {/* Report */}
      <article className="max-w-3xl mx-auto bg-white border border-cream-200 print:border-0 rounded-2xl shadow-card print:shadow-none p-8 md:p-10">
        <header className="flex items-start justify-between gap-4 border-b border-cream-200 pb-5">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">
              Rapò Sante
            </h1>
            <p className="mt-1 text-sm text-earth-600">
              {name} · {days} dènye jou yo
            </p>
          </div>
          <div className="text-right">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-hois.png" alt="Hoïs" className="h-8 w-auto ml-auto" />
            <p className="mt-1 text-[11px] text-earth-500">
              Jenere {dateHT(new Date())}
            </p>
          </div>
        </header>

        {summaries.length === 0 ? (
          <p className="py-10 text-center text-sm text-earth-600">
            Pa gen mezi anrejistre sou peryòd sa a.
          </p>
        ) : (
          <>
            {/* Summary table */}
            <section className="mt-6">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-forest-700 mb-3 inline-flex items-center gap-1.5">
                <Activity className="w-4 h-4" strokeWidth={2.2} />
                Rezime mezi yo
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-earth-500 border-b border-cream-200">
                      <th className="py-2 pr-3 font-semibold">Mezi</th>
                      <th className="py-2 px-3 font-semibold text-right">Dènye</th>
                      <th className="py-2 px-3 font-semibold text-right">Mwayèn</th>
                      <th className="py-2 px-3 font-semibold text-right">Min</th>
                      <th className="py-2 px-3 font-semibold text-right">Max</th>
                      <th className="py-2 pl-3 font-semibold text-right"># mezi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaries.map((s) => (
                      <tr key={s.key} className="border-b border-cream-100">
                        <td className="py-2.5 pr-3 font-semibold text-ink">
                          {s.label}{' '}
                          <span className="text-[11px] font-normal text-earth-500">
                            {s.unit}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-forest-800">
                          {fmt(s.latest, s.decimals)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-ink">
                          {fmt(s.avg, s.decimals)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-earth-600">
                          {fmt(s.min, s.decimals)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-earth-600">
                          {fmt(s.max, s.decimals)}
                        </td>
                        <td className="py-2.5 pl-3 text-right text-earth-600">
                          {s.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Recent readings */}
            <section className="mt-8">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-forest-700 mb-3">
                Dènye mezi yo
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-earth-500 border-b border-cream-200">
                      <th className="py-2 pr-3 font-semibold">Dat</th>
                      <th className="py-2 px-3 font-semibold text-right">Sik</th>
                      <th className="py-2 px-3 font-semibold text-right">Pwa</th>
                      <th className="py-2 px-3 font-semibold text-right">Tansyon</th>
                      <th className="py-2 pl-3 font-semibold text-right">Kè</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.slice(0, 20).map((l, i) => {
                      const bp =
                        l.blood_pressure_systolic != null
                          ? `${l.blood_pressure_systolic}${l.blood_pressure_diastolic != null ? '/' + l.blood_pressure_diastolic : ''}`
                          : '—';
                      return (
                        <tr key={i} className="border-b border-cream-100">
                          <td className="py-2 pr-3 text-earth-700">
                            {dateHT(new Date(l.logged_at))}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {l.blood_sugar ?? '—'}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {l.weight ?? '—'}
                          </td>
                          <td className="py-2 px-3 text-right">{bp}</td>
                          <td className="py-2 pl-3 text-right">
                            {l.heart_rate ?? '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {treatments.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-forest-700 mb-3">
              Tretman aktif yo
            </h2>
            <ul className="space-y-2">
              {treatments.map((t, i) => (
                <li key={i} className="text-sm text-ink flex flex-wrap gap-x-2">
                  <span className="font-semibold">{t.title}</span>
                  {(t.dose || t.frequency) && (
                    <span className="text-earth-600">
                      — {[t.dose, t.frequency].filter(Boolean).join(', ')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-8 pt-5 border-t border-cream-200 text-[11px] text-earth-500 leading-relaxed">
          Rapò sa a jenere otomatikman apati mezi manm nan antre sou Hoïs
          Inivèsite. Li se yon zouti swivi — li pa ranplase konsèy yon
          pwofesyonèl sante. Hoïs Inivèsite · HOÏSMedikaplant.com
        </p>
      </article>
    </main>
  );
}
