import { createClient } from '@/lib/supabase/server';
import { Bell, FileText, HeartPulse, Sparkles } from 'lucide-react';
import Link from 'next/link';

const PLAN_LABELS: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

const PLAN_BADGES: Record<string, string> = {
  basic: 'bg-slate-100 text-slate-700',
  premium: 'bg-teal-100 text-teal-700',
  vip: 'bg-amber-100 text-amber-700',
};

export default async function DashboardHome() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: resources }, { data: notifications }, { data: latestHealth }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('resources').select('*').order('created_at', { ascending: false }).limit(4),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(3),
      supabase
        .from('health_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const planLabel = PLAN_LABELS[profile?.plan ?? 'basic'];
  const badgeCls = PLAN_BADGES[profile?.plan ?? 'basic'];

  return (
    <div className="p-6 md:p-10 max-w-[1280px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
        <div>
          <p className="text-sm text-ink-muted">Bonjou,</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-ink">
            {profile?.full_name || user.email?.split('@')[0]} 👋
          </h1>
          <div className="mt-3 inline-flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badgeCls}`}>
              <Sparkles className="w-3 h-3" strokeWidth={2.4} />
              {planLabel}
            </span>
          </div>
        </div>
        <Link
          href="/dashboard/health"
          className="inline-flex items-center gap-2 bg-brand-gradient hover:brightness-110 text-white px-5 py-2.5 rounded-full font-medium shadow-md text-sm"
        >
          <HeartPulse className="w-4 h-4" strokeWidth={2.2} />
          Anrejistre sante ou
        </Link>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <StatCard
          icon={FileText}
          label="Resous disponib"
          value={resources?.length ?? 0}
          accent="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          icon={Bell}
          label="Notifikasyon"
          value={notifications?.length ?? 0}
          accent="bg-amber-100 text-amber-700"
        />
        <StatCard
          icon={HeartPulse}
          label="Dènye sik (mg/dL)"
          value={latestHealth?.blood_sugar ? Number(latestHealth.blood_sugar).toFixed(0) : '—'}
          accent="bg-rose-100 text-rose-700"
        />
      </div>

      {/* Recent resources */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ink">Dènye Resous yo</h2>
          <Link href="/dashboard/resources" className="text-sm text-brand-700 hover:underline">
            Wè tout →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(resources ?? []).map((r) => (
            <article key={r.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card card-lift">
              <span className="inline-flex px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-xs font-medium uppercase mb-3">
                {r.type}
              </span>
              <h3 className="font-semibold text-ink leading-snug line-clamp-2">{r.title}</h3>
              <p className="mt-2 text-xs text-ink-muted line-clamp-2">{r.description}</p>
              <a
                href={r.file_url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center text-sm text-brand-700 font-medium hover:underline"
              >
                Telechaje →
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section>
        <h2 className="text-lg font-bold text-ink mb-4">Notifikasyon resan</h2>
        <div className="space-y-3">
          {(notifications ?? []).map((n) => (
            <div key={n.id} className="bg-white rounded-2xl p-5 border border-slate-200">
              <h3 className="font-semibold text-ink">{n.title}</h3>
              <p className="text-sm text-ink-muted mt-1">{n.message}</p>
            </div>
          ))}
          {(!notifications || notifications.length === 0) && (
            <p className="text-sm text-ink-muted">Pa gen notifikasyon pou kounye a.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 flex items-center gap-4">
      <span className={`grid place-items-center w-12 h-12 rounded-xl ${accent}`}>
        <Icon className="w-5 h-5" strokeWidth={2.2} />
      </span>
      <div>
        <p className="text-xs text-ink-muted">{label}</p>
        <p className="text-2xl font-bold text-ink leading-tight">{value}</p>
      </div>
    </div>
  );
}
