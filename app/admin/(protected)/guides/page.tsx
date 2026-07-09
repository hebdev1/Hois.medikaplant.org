import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Plus,
  BookOpen,
  Star,
  Eye,
  EyeOff,
  FileText,
  type LucideIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import GuidesTable from './guides-table';
import type { Database } from '@/types/database';
import { hasCapability, type AdminRole } from '../admin-nav-config';

export const metadata = { title: 'Admin · Gid' };
export const dynamic = 'force-dynamic';

type Guide = Database['public']['Tables']['guides']['Row'];
type Category = Database['public']['Tables']['guide_categories']['Row'];

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

      {/* Table (client — handles selection + bulk delete + thumbnails) */}
      <GuidesTable
        guides={guides.map((g) => ({
          id: g.id,
          title: g.title,
          slug: g.slug,
          read_minutes: g.read_minutes,
          accent_color: g.accent_color,
          cover_image_url: g.cover_image_url ?? null,
          category_label: g.category_id
            ? catMap.get(g.category_id)?.label ?? null
            : null,
          plan_required: g.plan_required,
          published: g.published,
          featured: g.featured,
          updated_at: g.updated_at,
        }))}
      />
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
