import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Plus,
  BookOpen,
  Star,
  Eye,
  EyeOff,
  Edit3,
  Clock,
  FileText,
  type LucideIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import GuideRowActions from './guide-row-actions';
import type { Database } from '@/types/database';
import { hasCapability, type AdminRole } from '../admin-nav-config';

export const metadata = { title: 'Admin · Gid' };
export const dynamic = 'force-dynamic';

type Guide = Database['public']['Tables']['guides']['Row'];
type Category = Database['public']['Tables']['guide_categories']['Row'];

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

const HT_DATE = new Intl.DateTimeFormat('fr-HT', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export default async function AdminGuidesPage({
  searchParams,
}: {
  searchParams: { filter?: string; cat?: string };
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
  if (!hasCapability(adminRole, 'manage_guides')) {
    redirect('/admin');
  }

  const [guidesResult, categoriesResult, statsResult] = await Promise.all([
    supabase
      .from('guides')
      .select('*')
      .order('updated_at', { ascending: false }),
    supabase
      .from('guide_categories')
      .select('*')
      .order('display_order', { ascending: true }),
    supabase
      .from('guides')
      .select('published, featured', { count: 'estimated' })
      .limit(1000),
  ]);

  const allGuides = (guidesResult.data ?? []) as Guide[];
  const categories = (categoriesResult.data ?? []) as Category[];
  const catMap = new Map(categories.map((c) => [c.id, c]));

  const filter = searchParams.filter; // 'published' | 'draft' | 'featured'
  const catFilter = searchParams.cat;

  let guides = allGuides;
  if (filter === 'published') guides = guides.filter((g) => g.published);
  if (filter === 'draft') guides = guides.filter((g) => !g.published);
  if (filter === 'featured') guides = guides.filter((g) => g.featured);
  if (catFilter) {
    const cat = categories.find((c) => c.slug === catFilter);
    if (cat) guides = guides.filter((g) => g.category_id === cat.id);
  }

  const stats = {
    total: allGuides.length,
    published: allGuides.filter((g) => g.published).length,
    draft: allGuides.filter((g) => !g.published).length,
    featured: allGuides.filter((g) => g.featured).length,
  };

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1280px] mx-auto">
      <header className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" strokeWidth={2.2} />
            Admin · Gid & Konsèy
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Kontni Hoïs
          </h1>
          <p className="mt-2 text-sm text-earth-600 max-w-2xl">
            Jere atik yo pou tablodebò itilizatè yo. Lè w pibliye yon atik, li
            parèt imedyatman pou tout itilizatè ki gen plan ki kòrèk la.
          </p>
        </div>
        <Link
          href="/admin/guides/new"
          className="inline-flex items-center gap-1.5 bg-forest-700 hover:bg-forest-800 text-cream-50 font-semibold px-5 py-2.5 rounded-full transition shadow-plant"
        >
          <Plus className="w-4 h-4" strokeWidth={2.4} />
          Nouvo atik
        </Link>
      </header>

      {/* Stats strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={FileText}
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
          icon={Star}
          label="Vedèt"
          value={stats.featured}
          accent="bg-gold-100 text-gold-700"
        />
      </section>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-2">
        <FilterChip href="/admin/guides" label="Tout" active={!filter && !catFilter} />
        <FilterChip
          href="/admin/guides?filter=published"
          label="Pibliye"
          active={filter === 'published'}
        />
        <FilterChip
          href="/admin/guides?filter=draft"
          label="Bouyon"
          active={filter === 'draft'}
        />
        <FilterChip
          href="/admin/guides?filter=featured"
          label="Vedèt"
          active={filter === 'featured'}
        />
        <span className="mx-2 self-center text-cream-300">|</span>
        {categories.map((c) => (
          <FilterChip
            key={c.slug}
            href={`/admin/guides?cat=${c.slug}`}
            label={c.label}
            active={catFilter === c.slug}
          />
        ))}
      </div>

      {/* Table */}
      <section className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
        {guides.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-8 h-8 text-earth-500 mx-auto mb-3" strokeWidth={1.6} />
            <p className="text-earth-700 font-semibold">
              Pa gen atik ki matche filtè a.
            </p>
            <Link
              href="/admin/guides/new"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:text-forest-800"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
              Kreye premye atik
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 border-b border-cream-200 text-[10px] uppercase tracking-wider text-earth-600 font-semibold">
                <tr>
                  <th className="text-left px-5 py-3">Tit</th>
                  <th className="text-left px-3 py-3">Kategori</th>
                  <th className="text-left px-3 py-3">Plan</th>
                  <th className="text-left px-3 py-3">Estati</th>
                  <th className="text-left px-3 py-3">Mete ajou</th>
                  <th className="text-right px-5 py-3">Aksyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {guides.map((g) => {
                  const cat = g.category_id ? catMap.get(g.category_id) : null;
                  return (
                    <tr key={g.id} className="hover:bg-cream-50/60">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/guides/${g.id}`}
                          className="flex items-center gap-3 group"
                        >
                          <span
                            className="w-9 h-9 rounded-lg shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${g.accent_color}, ${g.accent_color}AA)`,
                            }}
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-ink truncate group-hover:text-forest-700 transition">
                              {g.title}
                            </div>
                            <div className="text-[11px] text-earth-500 flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono truncate">/{g.slug}</span>
                              <span aria-hidden>·</span>
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" strokeWidth={2.2} />
                                {g.read_minutes} min
                              </span>
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-xs text-earth-700">
                        {cat?.label ?? <span className="text-earth-400">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${PLAN_TONE[g.plan_required]}`}
                        >
                          {PLAN_LABEL[g.plan_required]}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          {g.published ? (
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
                          {g.featured && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gold-100 text-gold-700">
                              <Star className="w-3 h-3 fill-current" strokeWidth={2.4} />
                              Vedèt
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-earth-600">
                        {HT_DATE.format(new Date(g.updated_at))}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/guides/${g.id}`}
                            title="Modifye"
                            className="grid place-items-center w-8 h-8 rounded-lg bg-white text-earth-600 border border-cream-200 hover:bg-forest-50 hover:text-forest-700 hover:border-forest-200 transition"
                          >
                            <Edit3 className="w-4 h-4" strokeWidth={2.2} />
                          </Link>
                          <GuideRowActions
                            guideId={g.id}
                            initialPublished={g.published}
                            initialFeatured={g.featured}
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
      <span className={`grid place-items-center w-10 h-10 rounded-xl ${accent}`}>
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
      className={`px-3 py-1 rounded-full text-xs font-semibold transition border ${
        active
          ? 'bg-forest-700 text-cream-50 border-forest-700'
          : 'bg-white text-earth-700 border-cream-200 hover:border-forest-300 hover:text-forest-700'
      }`}
    >
      {label}
    </Link>
  );
}
