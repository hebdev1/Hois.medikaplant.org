import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Crown, User, Clock, CalendarClock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import { hasCapability, type AdminRole } from '../admin-nav-config';
import SessionRow from './session-row';

export const metadata = { title: 'Admin · Sesyon VIP' };
export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  user_id: string;
  topic: string;
  preferred_window: string | null;
  note: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  nouvo: 'Nouvo',
  pwograme: 'Pwograme',
  'fèt': 'Fèt',
  refize: 'Refize',
};

const STATUS_TONE: Record<string, string> = {
  nouvo: 'bg-gold-100 text-gold-700',
  pwograme: 'bg-forest-100 text-forest-800',
  'fèt': 'bg-forest-200 text-forest-900',
  refize: 'bg-slate-200 text-slate-700',
};

export default async function AdminVipSessionsPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('admin_role')
    .eq('id', user.id)
    .maybeSingle();
  const adminRole = (profileRaw as { admin_role: AdminRole | null } | null)
    ?.admin_role;
  if (!hasCapability(adminRole, 'manage_subscriptions')) {
    redirect('/admin');
  }

  const filterStatus = searchParams.status ?? 'all';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  let query = sb
    .from('vip_session_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (filterStatus !== 'all' && filterStatus in STATUS_LABEL) {
    query = query.eq('status', filterStatus);
  }
  const { data: rowsRaw } = await query;
  const rows = (rowsRaw ?? []) as Row[];

  // Enrich with the member's display name in one extra query
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const namesById = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profs } = await sb
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);
    for (const p of (profs ?? []) as Array<{
      id: string;
      full_name: string | null;
      email: string;
    }>) {
      namesById.set(p.id, p.full_name || p.email.split('@')[0]);
    }
  }

  const counts = {
    all: rows.length,
    nouvo: rows.filter((r) => r.status === 'nouvo').length,
    pwograme: rows.filter((r) => r.status === 'pwograme').length,
    'fèt': rows.filter((r) => r.status === 'fèt').length,
    refize: rows.filter((r) => r.status === 'refize').length,
  };

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1100px] mx-auto">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-100 text-gold-700 text-xs font-semibold mb-3">
          <Crown className="w-3.5 h-3.5" strokeWidth={2.2} />
          Admin · Sesyon VIP (Melis)
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Demann sesyon ak Vye Ewòl
        </h1>
        <p className="mt-2 text-sm text-earth-600 max-w-2xl">
          Demann konvèsasyon 21 min manm Melis yo fè. Chanje estati epi pran
          nòt prive. Konfidansyèl — admin sèlman.
        </p>
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-1 p-1 bg-cream-100 border border-cream-200 rounded-2xl">
        <FilterPill href="/admin/sesyon-vip" active={filterStatus === 'all'}>
          Tout ({counts.all})
        </FilterPill>
        {(['nouvo', 'pwograme', 'fèt', 'refize'] as const).map((s) => (
          <FilterPill
            key={s}
            href={`/admin/sesyon-vip?status=${s}`}
            active={filterStatus === s}
          >
            {STATUS_LABEL[s]} ({counts[s]})
          </FilterPill>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-cream-200 bg-white p-8 text-center text-sm text-earth-600">
          Pa gen demann nan filtre sa a pou kounye a.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const memberName = namesById.get(r.user_id) ?? 'Manm';
            return (
              <article
                key={r.id}
                className="bg-white border border-cream-200 rounded-2xl p-4 md:p-5 shadow-card"
              >
                <header className="flex items-start justify-between gap-3 flex-wrap mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        STATUS_TONE[r.status] ?? 'bg-cream-100 text-earth-700'
                      }`}
                    >
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-earth-600">
                      <User className="w-3 h-3" strokeWidth={2.2} />
                      {memberName}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-earth-500">
                      <Clock className="w-3 h-3" strokeWidth={2.2} />
                      {new Date(r.created_at).toLocaleString('fr-FR', {
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {r.preferred_window && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-earth-600">
                        <CalendarClock className="w-3 h-3" strokeWidth={2.2} />
                        {r.preferred_window}
                      </span>
                    )}
                  </div>
                </header>

                <p className="text-sm font-semibold text-ink leading-relaxed mb-1">
                  {r.topic}
                </p>
                {r.note && (
                  <p className="text-sm text-earth-700 leading-relaxed whitespace-pre-wrap mb-3">
                    {r.note}
                  </p>
                )}

                <SessionRow
                  id={r.id}
                  status={r.status}
                  adminNote={r.admin_note}
                />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
        active
          ? 'bg-white text-forest-800 shadow-sm'
          : 'text-earth-700 hover:text-ink'
      }`}
    >
      {children}
    </Link>
  );
}
