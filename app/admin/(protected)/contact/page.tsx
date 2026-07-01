import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Inbox,
  Mail,
  ChevronRight,
  Archive,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import { hasCapability, type AdminRole } from '../admin-nav-config';

export const metadata = { title: 'Admin · Mesaj kontak' };
export const dynamic = 'force-dynamic';

type ContactRow = Database['public']['Tables']['contact_messages']['Row'];

const TOPIC_LABEL: Record<string, string> = {
  general: 'Jeneral',
  support: 'Sipò',
  partnership: 'Patnèsip',
  press: 'Près',
  plant: 'Plant',
};
const TOPIC_TONE: Record<string, string> = {
  general: 'bg-slate-100 text-slate-700',
  support: 'bg-rose-100 text-rose-700',
  partnership: 'bg-violet-100 text-violet-700',
  press: 'bg-amber-100 text-amber-700',
  plant: 'bg-forest-100 text-forest-700',
};

const MONTHS_HT = [
  'Jan', 'Fev', 'Mas', 'Avr', 'Me', 'Jen',
  'Jiy', 'Out', 'Sep', 'Okt', 'Nov', 'Des',
];
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  if (sameDay) return `Jodi a · ${hh}h${mm}`;
  return `${d.getDate()} ${MONTHS_HT[d.getMonth()]} · ${hh}h${mm}`;
}

type Tab = 'new' | 'responded' | 'archived';

export default async function AdminContactInbox({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const tab: Tab =
    searchParams.tab === 'responded' ||
    searchParams.tab === 'archived' ||
    searchParams.tab === 'new'
      ? searchParams.tab
      : 'new';

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('admin_role')
    .eq('id', user.id)
    .maybeSingle();
  const adminRole = (profileRaw as { admin_role: AdminRole | null } | null)
    ?.admin_role;
  if (!hasCapability(adminRole, 'manage_contact')) {
    redirect('/admin');
  }

  // One query for the filtered list, three count queries for the tab pills
  // so the UI always shows the correct totals regardless of the active tab.
  const [listResult, newCountResult, respondedCountResult, archivedCountResult] =
    await Promise.all([
      supabase
        .from('contact_messages')
        .select('*')
        .eq('status', tab)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('contact_messages')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'new'),
      supabase
        .from('contact_messages')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'responded'),
      supabase
        .from('contact_messages')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'archived'),
    ]);

  const rows = (listResult.data ?? []) as ContactRow[];
  const counts: Record<Tab, number> = {
    new: newCountResult.count ?? 0,
    responded: respondedCountResult.count ?? 0,
    archived: archivedCountResult.count ?? 0,
  };

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1280px] mx-auto">
      <header className="mb-6 md:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
          <Inbox className="w-3.5 h-3.5" strokeWidth={2.2} />
          Admin · Mesaj kontak
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Inbox kontak
        </h1>
        <p className="mt-2 text-sm text-earth-600 max-w-2xl">
          Mesaj ki soti nan paj <code>/kontak</code> rive isit la.
          Ou ka reponn yo dirèkteman pa imèl, oswa achive yo.
        </p>
      </header>

      {/* Filter tabs */}
      <nav className="flex gap-2 mb-6 overflow-x-auto -mx-1 px-1 pb-1">
        <TabPill
          href="/admin/contact?tab=new"
          active={tab === 'new'}
          count={counts.new}
          icon={<Clock className="w-3.5 h-3.5" strokeWidth={2.4} />}
          label="Nouvo"
          tone="rose"
        />
        <TabPill
          href="/admin/contact?tab=responded"
          active={tab === 'responded'}
          count={counts.responded}
          icon={<CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.4} />}
          label="Reponn"
          tone="forest"
        />
        <TabPill
          href="/admin/contact?tab=archived"
          active={tab === 'archived'}
          count={counts.archived}
          icon={<Archive className="w-3.5 h-3.5" strokeWidth={2.4} />}
          label="Achive"
          tone="cream"
        />
      </nav>

      {/* List */}
      <section className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-earth-600">
            {tab === 'new'
              ? 'Pa gen okenn nouvo mesaj pou kounye a. 🌿'
              : tab === 'responded'
              ? 'Poko gen mesaj ki reponn.'
              : 'Achiv la vid.'}
          </div>
        ) : (
          <ul className="divide-y divide-cream-100">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/admin/contact/${row.id}`}
                  className="block p-4 md:p-5 hover:bg-cream-50/60 transition group"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar circle with initial */}
                    <div
                      className="shrink-0 grid place-items-center w-10 h-10 rounded-full bg-gradient-to-br from-forest-500 to-forest-800 text-cream-50 font-display font-bold text-sm"
                      aria-hidden
                    >
                      {(row.full_name[0] ?? '?').toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-ink truncate">
                          {row.full_name}
                        </span>
                        <span className="text-xs text-earth-500 font-mono truncate">
                          {row.email}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                            TOPIC_TONE[row.topic] ?? TOPIC_TONE.general
                          }`}
                        >
                          {TOPIC_LABEL[row.topic] ?? row.topic}
                        </span>
                        {tab === 'new' && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500" />
                        )}
                      </div>

                      <div className="font-display text-base font-bold text-ink truncate mb-1">
                        {row.subject}
                      </div>
                      <p className="text-sm text-earth-700 line-clamp-2 max-w-3xl">
                        {row.message}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-earth-500">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3 h-3" strokeWidth={2.4} />
                          {formatDate(row.created_at)}
                        </span>
                        {row.phone && (
                          <>
                            <span>·</span>
                            <span className="font-mono">{row.phone}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <ChevronRight
                      className="w-4 h-4 text-earth-400 group-hover:text-forest-600 group-hover:translate-x-0.5 transition shrink-0 mt-2"
                      strokeWidth={2.4}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function TabPill({
  href,
  active,
  count,
  icon,
  label,
  tone,
}: {
  href: string;
  active: boolean;
  count: number;
  icon: React.ReactNode;
  label: string;
  tone: 'rose' | 'forest' | 'cream';
}) {
  const activeStyles: Record<typeof tone, string> = {
    rose: 'bg-rose-100 text-rose-800 border-rose-200',
    forest: 'bg-forest-100 text-forest-800 border-forest-200',
    cream: 'bg-cream-200 text-earth-900 border-cream-300',
  } as const;
  const idleStyles =
    'bg-white text-earth-700 border-cream-200 hover:border-forest-300 hover:bg-cream-50';
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition shrink-0 ${
        active ? activeStyles[tone] : idleStyles
      }`}
    >
      {icon}
      {label}
      <span
        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
          active ? 'bg-white/60' : 'bg-cream-100'
        }`}
      >
        {count}
      </span>
    </Link>
  );
}
