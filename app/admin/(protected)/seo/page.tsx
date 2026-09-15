import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Search, Check, AlertTriangle, FileText, Newspaper, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import { hasCapability, type AdminRole } from '../admin-nav-config';

export const metadata = { title: 'Admin · SEO' };
export const dynamic = 'force-dynamic';

type SeoRow = {
  kind: 'page' | 'article';
  id: string;
  title: string;
  slug: string;
  status: string;
  seoTitle: string | null;
  seoDesc: string | null;
  social: string | null;
  editHref: string;
  publicHref: string;
};

const DESC_MIN = 60;
const DESC_MAX = 160;

export default async function SeoManagerPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  const supabase = createClient();
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('admin_role')
    .eq('id', user.id)
    .maybeSingle();
  const adminRole = (profileRaw as { admin_role: AdminRole | null } | null)?.admin_role;
  if (!hasCapability(adminRole, 'manage_guides')) redirect('/admin');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const [pagesRes, articlesRes] = await Promise.all([
    sb
      .from('cms_pages')
      .select('id, title, slug, status, seo_title, seo_description, og_image')
      .order('updated_at', { ascending: false }),
    sb
      .from('cms_articles')
      .select('id, title, slug, status, seo_title, seo_description, cover_image')
      .order('updated_at', { ascending: false }),
  ]);

  const rows: SeoRow[] = [
    ...((pagesRes.data ?? []) as Record<string, string | null>[]).map((p) => ({
      kind: 'page' as const,
      id: String(p.id),
      title: p.title || '(San tit)',
      slug: p.slug || '',
      status: p.status || 'draft',
      seoTitle: p.seo_title,
      seoDesc: p.seo_description,
      social: p.og_image,
      editHref: `/admin/pages/${p.id}`,
      publicHref: `/paj/${p.slug}`,
    })),
    ...((articlesRes.data ?? []) as Record<string, string | null>[]).map((a) => ({
      kind: 'article' as const,
      id: String(a.id),
      title: a.title || '(San tit)',
      slug: a.slug || '',
      status: a.status || 'draft',
      seoTitle: a.seo_title,
      seoDesc: a.seo_description,
      social: a.cover_image,
      editHref: `/admin/articles/${a.id}`,
      publicHref: `/atik/${a.slug}`,
    })),
  ];

  const has = (s: string | null) => !!s && s.trim().length > 0;
  const missingTitle = rows.filter((r) => !has(r.seoTitle)).length;
  const missingDesc = rows.filter((r) => !has(r.seoDesc)).length;
  const missingSocial = rows.filter((r) => !has(r.social)).length;

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1200px] mx-auto">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
          <Search className="w-3.5 h-3.5" strokeWidth={2.2} />
          SEO · Metadata
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Jesyon SEO
        </h1>
        <p className="mt-1.5 text-sm text-earth-600">
          Tout paj ak atik yo, ak eta metadone SEO yo. Klike yon liy pou ranje tit,
          deskripsyon oswa imaj sosyal la nan editè a.
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total kontni" value={rows.length} tone="ink" />
        <StatCard label="San tit SEO" value={missingTitle} tone={missingTitle ? 'amber' : 'forest'} />
        <StatCard label="San deskripsyon" value={missingDesc} tone={missingDesc ? 'amber' : 'forest'} />
        <StatCard label="San imaj sosyal" value={missingSocial} tone={missingSocial ? 'amber' : 'forest'} />
      </div>

      <div className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-earth-500">
            Poko gen paj ni atik.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-earth-600 bg-cream-50">
                  <th className="px-4 py-2.5 font-semibold">Kontni</th>
                  <th className="px-3 py-2.5 font-semibold">Tit SEO</th>
                  <th className="px-3 py-2.5 font-semibold">Deskripsyon</th>
                  <th className="px-3 py-2.5 font-semibold">Imaj sosyal</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Aksyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {rows.map((r) => {
                  const descLen = r.seoDesc?.trim().length ?? 0;
                  const descTone: FieldTone = !has(r.seoDesc)
                    ? 'missing'
                    : descLen < DESC_MIN || descLen > DESC_MAX
                      ? 'warn'
                      : 'ok';
                  return (
                    <tr key={`${r.kind}-${r.id}`} className="hover:bg-cream-50/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {r.kind === 'page' ? (
                            <FileText className="w-4 h-4 text-earth-400 shrink-0" strokeWidth={2} />
                          ) : (
                            <Newspaper className="w-4 h-4 text-earth-400 shrink-0" strokeWidth={2} />
                          )}
                          <Link href={r.editHref} className="font-semibold text-ink hover:text-forest-700 truncate max-w-[240px]">
                            {r.title}
                          </Link>
                          {r.status !== 'published' && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-cream-200 text-earth-600 shrink-0">
                              Bouyon
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-earth-400 font-mono truncate mt-0.5">
                          {r.kind === 'page' ? '/paj/' : '/atik/'}{r.slug}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <FieldFlag tone={has(r.seoTitle) ? 'ok' : 'missing'} />
                      </td>
                      <td className="px-3 py-3">
                        <FieldFlag
                          tone={descTone}
                          note={descTone === 'warn' ? `${descLen} karaktè` : undefined}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <FieldFlag tone={has(r.social) ? 'ok' : 'missing'} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {r.status === 'published' && r.slug && (
                            <a
                              href={r.publicHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-earth-400 hover:text-forest-700"
                              aria-label="Wè paj piblik la"
                            >
                              <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.2} />
                            </a>
                          )}
                          <Link
                            href={r.editHref}
                            className="text-xs font-bold text-forest-700 hover:text-forest-900 px-2.5 py-1.5 rounded-lg hover:bg-forest-50 transition"
                          >
                            Ranje
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-earth-500">
        Yon bon meta deskripsyon fè ant {DESC_MIN} ak {DESC_MAX} karaktè.
      </p>
    </div>
  );
}

type FieldTone = 'ok' | 'warn' | 'missing';

function FieldFlag({ tone, note }: { tone: FieldTone; note?: string }) {
  if (tone === 'ok') {
    return (
      <span className="inline-flex items-center gap-1 text-forest-700 text-xs font-semibold">
        <Check className="w-3.5 h-3.5" strokeWidth={2.6} /> OK
      </span>
    );
  }
  if (tone === 'warn') {
    return (
      <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-semibold">
        <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.4} /> {note ?? 'Tcheke'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-earth-400 text-xs font-semibold">
      <span className="w-3.5 h-3.5 grid place-items-center rounded-full border border-current text-[9px]">–</span>
      Manke
    </span>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'ink' | 'amber' | 'forest';
}) {
  const toneCls =
    tone === 'amber' ? 'text-amber-700' : tone === 'forest' ? 'text-forest-700' : 'text-ink';
  return (
    <div className="rounded-xl border border-cream-200 bg-white p-4">
      <div className={`font-display text-2xl font-bold ${toneCls}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-earth-500 font-bold mt-0.5">
        {label}
      </div>
    </div>
  );
}
