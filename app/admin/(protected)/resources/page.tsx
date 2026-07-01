import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Plus,
  Library,
  Eye,
  EyeOff,
  Edit3,
  FileText,
  Play,
  Volume2,
  Lock,
  type LucideIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import ResourceRowActions from './resource-row-actions';
import type { Database } from '@/types/database';
import { cn } from '@/lib/utils';
import { hasCapability, type AdminRole } from '../admin-nav-config';

export const metadata = { title: 'Admin · Resous' };
export const dynamic = 'force-dynamic';

type Resource = Database['public']['Tables']['resources']['Row'];

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

const TYPE_META: Record<
  string,
  { label: string; icon: LucideIcon; tone: string }
> = {
  pdf: {
    label: 'PDF',
    icon: FileText,
    tone: 'bg-rose-100 text-rose-700 border-rose-200',
  },
  video: {
    label: 'VIDEYO',
    icon: Play,
    tone: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  },
  audio: {
    label: 'ODYO',
    icon: Volume2,
    tone: 'bg-amber-100 text-amber-700 border-amber-200',
  },
};

const MOIS = [
  'Jan',
  'Fev',
  'Mas',
  'Avr',
  'Me',
  'Jen',
  'Jiy',
  'Out',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatSize(bytes: number | null): string {
  if (bytes == null || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  if (bytes < 1024 * 1024 * 1024) {
    const mo = bytes / (1024 * 1024);
    return `${mo < 10 ? mo.toFixed(1) : Math.round(mo)} Mo`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} Go`;
}

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds <= 0) return '—';
  return `${Math.round(seconds / 60)} min`;
}

export default async function AdminResourcesPage({
  searchParams,
}: {
  searchParams: { filter?: string; type?: string; plan?: string };
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
  if (!hasCapability(adminRole, 'manage_resources')) {
    redirect('/admin');
  }

  const { data: resourcesRaw } = await supabase
    .from('resources')
    .select('*')
    .order('updated_at', { ascending: false });

  const allResources = (resourcesRaw ?? []) as Resource[];

  const filter = searchParams.filter; // 'published' | 'draft'
  const typeFilter = searchParams.type as 'pdf' | 'video' | 'audio' | undefined;
  const planFilter = searchParams.plan as 'basic' | 'premium' | 'vip' | undefined;

  let resources = allResources;
  if (filter === 'published') resources = resources.filter((r) => r.published);
  if (filter === 'draft') resources = resources.filter((r) => !r.published);
  if (typeFilter) resources = resources.filter((r) => r.type === typeFilter);
  if (planFilter)
    resources = resources.filter((r) => r.plan_required === planFilter);

  const stats = {
    total: allResources.length,
    published: allResources.filter((r) => r.published).length,
    draft: allResources.filter((r) => !r.published).length,
    locked: allResources.filter((r) => r.plan_required !== 'basic').length,
  };

  const hasAnyFilter =
    Boolean(filter) || Boolean(typeFilter) || Boolean(planFilter);

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1280px] mx-auto">
      <header className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
            <Library className="w-3.5 h-3.5" strokeWidth={2.2} />
            Admin · Resous
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Bibliyotèk Medikaplant
          </h1>
          <p className="mt-2 text-sm text-earth-600 max-w-2xl">
            Jere PDF, videyo ak meditasyon odyo ki nan paj Telechajman manm
            yo. Lè w pibliye yon nouvo dosye, tout manm yo resevwa yon
            notifikasyon otomatik.
          </p>
        </div>
        <Link
          href="/admin/resources/new"
          className="inline-flex items-center gap-1.5 bg-forest-700 hover:bg-forest-800 text-cream-50 font-semibold px-5 py-2.5 rounded-full transition shadow-plant"
        >
          <Plus className="w-4 h-4" strokeWidth={2.4} />
          Nouvo resous
        </Link>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={Library}
          label="Total"
          value={stats.total}
          accent="bg-slate-100 text-slate-700"
        />
        <StatCard
          icon={Eye}
          label="Pibliye"
          value={stats.published}
          accent="bg-forest-100 text-forest-700"
        />
        <StatCard
          icon={EyeOff}
          label="Bouyon"
          value={stats.draft}
          accent="bg-cream-200 text-earth-700"
        />
        <StatCard
          icon={Lock}
          label="Lock pa plan"
          value={stats.locked}
          accent="bg-amber-100 text-amber-700"
        />
      </section>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-2 items-center">
        <FilterChip
          href="/admin/resources"
          label="Tout"
          active={!hasAnyFilter}
        />
        <FilterChip
          href="/admin/resources?filter=published"
          label="Pibliye"
          active={filter === 'published'}
        />
        <FilterChip
          href="/admin/resources?filter=draft"
          label="Bouyon"
          active={filter === 'draft'}
        />
        <span className="mx-2 self-center text-cream-300">|</span>
        <FilterChip
          href="/admin/resources?type=pdf"
          label="PDF"
          active={typeFilter === 'pdf'}
        />
        <FilterChip
          href="/admin/resources?type=video"
          label="Videyo"
          active={typeFilter === 'video'}
        />
        <FilterChip
          href="/admin/resources?type=audio"
          label="Odyo"
          active={typeFilter === 'audio'}
        />
        <span className="mx-2 self-center text-cream-300">|</span>
        <FilterChip
          href="/admin/resources?plan=basic"
          label="Bazilik"
          active={planFilter === 'basic'}
        />
        <FilterChip
          href="/admin/resources?plan=premium"
          label="Sitwonèl"
          active={planFilter === 'premium'}
        />
        <FilterChip
          href="/admin/resources?plan=vip"
          label="Melis"
          active={planFilter === 'vip'}
        />
      </div>

      {/* Table */}
      <section className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
        {resources.length === 0 ? (
          <div className="p-12 text-center">
            <Library
              className="w-8 h-8 text-earth-500 mx-auto mb-3"
              strokeWidth={1.6}
            />
            <p className="text-earth-700 font-semibold">
              Pa gen resous ki matche filtè a.
            </p>
            <Link
              href="/admin/resources/new"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:text-forest-800"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
              Kreye premye resous
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 border-b border-cream-200 text-[10px] uppercase tracking-wider text-earth-600 font-semibold">
                <tr>
                  <th className="text-left px-5 py-3">Tit</th>
                  <th className="text-left px-3 py-3">Tip</th>
                  <th className="text-left px-3 py-3">Plan</th>
                  <th className="text-left px-3 py-3">Dirasyon / Gwosè</th>
                  <th className="text-left px-3 py-3">Estati</th>
                  <th className="text-left px-3 py-3">Mete ajou</th>
                  <th className="text-right px-5 py-3">Aksyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {resources.map((r) => {
                  const meta = TYPE_META[r.type] ?? TYPE_META.pdf;
                  const Icon = meta.icon;
                  return (
                    <tr key={r.id} className="hover:bg-cream-50/60">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/resources/${r.id}`}
                          className="flex items-center gap-3 group"
                        >
                          <span
                            className={cn(
                              'grid place-items-center w-9 h-9 rounded-lg border shrink-0',
                              meta.tone
                            )}
                          >
                            <Icon className="w-4 h-4" strokeWidth={2.2} />
                          </span>
                          <div className="min-w-0">
                            <div className="font-semibold text-ink truncate group-hover:text-forest-700 transition">
                              {r.title}
                            </div>
                            {r.category && (
                              <div className="text-[11px] text-earth-500 truncate mt-0.5">
                                {r.category}
                              </div>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                            meta.tone
                          )}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full',
                            PLAN_TONE[r.plan_required]
                          )}
                        >
                          {PLAN_LABEL[r.plan_required]}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-earth-700">
                        <div className="flex flex-col">
                          <span>{formatDuration(r.duration_seconds)}</span>
                          <span className="text-[10px] text-earth-500">
                            {formatSize(r.file_size_bytes)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {r.published ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-forest-100 text-forest-700">
                            <Eye className="w-3 h-3" strokeWidth={2.4} />
                            Pibliye
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-cream-200 text-earth-700">
                            <EyeOff className="w-3 h-3" strokeWidth={2.4} />
                            Bouyon
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-earth-600">
                        {formatDate(r.updated_at)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/resources/${r.id}`}
                            title="Modifye"
                            className="grid place-items-center w-8 h-8 rounded-lg bg-white text-earth-600 border border-cream-200 hover:bg-forest-50 hover:text-forest-700 hover:border-forest-200 transition"
                          >
                            <Edit3 className="w-4 h-4" strokeWidth={2.2} />
                          </Link>
                          <ResourceRowActions
                            resourceId={r.id}
                            initialPublished={r.published}
                            title={r.title}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
  icon: LucideIcon;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-4 shadow-card flex items-center gap-3">
      <span className={cn('grid place-items-center w-10 h-10 rounded-xl', accent)}>
        <Icon className="w-4 h-4" strokeWidth={2.2} />
      </span>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-earth-600 font-semibold">
          {label}
        </div>
        <div className="text-2xl font-bold text-ink leading-tight">{value}</div>
      </div>
    </div>
  );
}

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'px-3 py-1 rounded-full text-xs font-semibold transition border',
        active
          ? 'bg-forest-700 text-cream-50 border-forest-700'
          : 'bg-white text-earth-700 border-cream-200 hover:border-forest-300 hover:text-forest-700'
      )}
    >
      {label}
    </Link>
  );
}
