import { createClient } from '@/lib/supabase/server';
import { Users, CreditCard, FileText, Bell } from 'lucide-react';

export default async function AdminOverview() {
  const supabase = createClient();

  const [{ count: users }, { count: activeSubs }, { count: resources }, { count: notifs }] =
    await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase.from('resources').select('*', { count: 'exact', head: true }),
      supabase.from('notifications').select('*', { count: 'exact', head: true }),
    ]);

  const stats = [
    { label: 'Total users', value: users ?? 0, icon: Users, accent: 'bg-emerald-100 text-emerald-700' },
    { label: 'Active subscriptions', value: activeSubs ?? 0, icon: CreditCard, accent: 'bg-teal-100 text-teal-700' },
    { label: 'Resources', value: resources ?? 0, icon: FileText, accent: 'bg-indigo-100 text-indigo-700' },
    { label: 'Notifications', value: notifs ?? 0, icon: Bell, accent: 'bg-amber-100 text-amber-700' },
  ];

  return (
    <div className="p-6 md:p-10 max-w-[1280px]">
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-ink">Admin Overview</h1>
        <p className="mt-2 text-ink-muted">Statistik global ak aksyon administratif.</p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card">
            <span className={`inline-grid place-items-center w-12 h-12 rounded-xl ${accent} mb-4`}>
              <Icon className="w-5 h-5" strokeWidth={2.2} />
            </span>
            <p className="text-xs text-ink-muted uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-bold text-ink leading-tight mt-1">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
