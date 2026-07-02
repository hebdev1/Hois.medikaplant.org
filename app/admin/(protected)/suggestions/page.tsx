import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Lightbulb,
  Palette,
  Sparkles,
  Bug,
  FileText,
  Zap,
  MoreHorizontal,
  User,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasCapability, type AdminRole } from '../admin-nav-config';
import SuggestionRow from './suggestion-row';

export const metadata = { title: 'Admin · Sijesyon manm yo' };
export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  user_id: string;
  category: string;
  message: string;
  status: string;
  admin_notes: string | null;
  page_url: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
  triaged_at: string | null;
};

const CATEGORY_META: Record<
  string,
  { label: string; icon: LucideIcon; tone: string }
> = {
  general: { label: 'Jeneral', icon: Lightbulb, tone: 'bg-slate-100 text-slate-700' },
  ui: { label: 'UI', icon: Palette, tone: 'bg-indigo-100 text-indigo-700' },
  feature: { label: 'Feature', icon: Sparkles, tone: 'bg-amber-100 text-amber-800' },
  bug: { label: 'Bug', icon: Bug, tone: 'bg-rose-100 text-rose-700' },
  content: { label: 'Kontni', icon: FileText, tone: 'bg-cyan-100 text-cyan-800' },
  performance: { label: 'Vitès', icon: Zap, tone: 'bg-lime-100 text-lime-800' },
  other: { label: 'Lòt', icon: MoreHorizontal, tone: 'bg-cream-100 text-earth-700' },
};

const STATUS_LABEL: Record<string, string> = {
  new: 'Nouvo',
  triaged: 'Triaje',
  planned: 'Planifye',
  in_progress: 'Ap fèt',
  done: 'Fèt',
  declined: 'Rejte',
};

const STATUS_TONE: Record<string, string> = {
  new: 'bg-amber-100 text-amber-900',
  triaged: 'bg-cyan-100 text-cyan-800',
  planned: 'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-forest-100 text-forest-800',
  done: 'bg-forest-200 text-forest-900',
  declined: 'bg-slate-200 text-slate-700',
};

export default async function AdminSuggestionsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
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
  if (!hasCapability(adminRole, 'manage_self')) {
    redirect('/admin');
  }

  const filterStatus = searchParams.status ?? 'all';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  let query = sb
    .from('user_suggestions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (filterStatus !== 'all' && filterStatus in STATUS_LABEL) {
    query = query.eq('status', filterStatus);
  }
  const { data: rowsRaw } = await query;
  const rows = (rowsRaw ?? []) as Row[];

  // Enrich rows with the member's display name in one extra query
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const namesById = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profs } = await sb
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);
    for (const p of ((profs ?? []) as Array<{
      id: string;
      full_name: string | null;
      email: string;
    }>)) {
      namesById.set(p.id, p.full_name || p.email.split('@')[0]);
    }
  }

  const counts = {
    all: rows.length,
    new: rows.filter((r) => r.status === 'new').length,
    triaged: rows.filter((r) => r.status === 'triaged').length,
    planned: rows.filter((r) => r.status === 'planned').length,
    in_progress: rows.filter((r) => r.status === 'in_progress').length,
    done: rows.filter((r) => r.status === 'done').length,
    declined: rows.filter((r) => r.status === 'declined').length,
  };

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1200px] mx-auto">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
          <Lightbulb className="w-3.5 h-3.5" strokeWidth={2.2} />
          Admin · Sijesyon manm yo
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Sa manm yo mande
        </h1>
        <p className="mt-2 text-sm text-earth-600 max-w-2xl">
          Lide, obsèvasyon, ak sijesyon ki soti nan bouton "Sijesyon" flotan
          sou tablodebò a. Triye pa kategori, chanje estati, pran nòt.
        </p>
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-1 p-1 bg-cream-100 border border-cream-200 rounded-2xl">
        <FilterPill href="/admin/suggestions" active={filterStatus === 'all'}>
          Tout ({counts.all})
        </FilterPill>
        {(['new', 'triaged', 'planned', 'in_progress', 'done', 'declined'] as const).map(
          (s) => (
            <FilterPill
              key={s}
              href={`/admin/suggestions?status=${s}`}
              active={filterStatus === s}
            >
              {STATUS_LABEL[s]} ({counts[s]})
            </FilterPill>
          )
        )}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-cream-200 bg-white p-8 text-center text-sm text-earth-600">
          Pa gen sijesyon nan filtre sa a pou kounye a.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const cat =
              CATEGORY_META[r.category] ?? CATEGORY_META.other;
            const CatIcon = cat.icon;
            const memberName = namesById.get(r.user_id) ?? 'Manm';
            return (
              <article
                key={r.id}
                className="bg-white border border-cream-200 rounded-2xl p-4 md:p-5 shadow-card"
              >
                <header className="flex items-start justify-between gap-3 flex-wrap mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cat.tone}`}
                    >
                      <CatIcon className="w-3 h-3" strokeWidth={2.4} />
                      {cat.label}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_TONE[r.status] ?? 'bg-cream-100 text-earth-700'}`}
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
                    {r.page_url && (
                      <Link
                        href={r.page_url}
                        target="_blank"
                        className="text-[11px] text-forest-700 hover:text-forest-900 underline underline-offset-2"
                      >
                        {r.page_url}
                      </Link>
                    )}
                  </div>
                </header>

                <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap mb-3">
                  {r.message}
                </p>

                <SuggestionRow
                  id={r.id}
                  status={r.status}
                  notes={r.admin_notes}
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
