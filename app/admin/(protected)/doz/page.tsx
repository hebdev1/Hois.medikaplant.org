import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FlaskConical, Plus, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import DozCategories from './doz-categories';
import DozRowActions from './doz-row-actions';

export const metadata = { title: 'Admin · Resèt ak Dòz' };
export const dynamic = 'force-dynamic';

export default async function AdminDozPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if ((profile as { role?: string } | null)?.role !== 'admin') redirect('/admin');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const [{ data: recipesRaw }, { data: catsRaw }] = await Promise.all([
    sb.from('doz_recipes').select('id, title, slug, published, category_id, updated_at').order('updated_at', { ascending: false }),
    sb.from('doz_categories').select('id, label, display_order').order('display_order', { ascending: true }),
  ]);
  const recipes = (recipesRaw ?? []) as Array<{ id: string; title: string; slug: string; published: boolean; category_id: string | null }>;
  const cats = (catsRaw ?? []) as Array<{ id: string; label: string; display_order: number }>;
  const catLabel = new Map(cats.map((c) => [c.id, c.label]));

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1280px] mx-auto">
      <header className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-semibold mb-2">
            <FlaskConical className="w-3.5 h-3.5" strokeWidth={2.2} />
            Admin · Resèt ak Dòz
          </div>
          <h1 className="font-display text-3xl font-bold text-ink">Dòz ak fòmil</h1>
        </div>
        <Link href="/admin/doz/new" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-forest-700 hover:bg-forest-800 text-cream-50 text-sm font-semibold transition">
          <Plus className="w-4 h-4" strokeWidth={2.4} />
          Nouvo resèt
        </Link>
      </header>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <section className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
          {recipes.length === 0 ? (
            <p className="p-8 text-center text-sm text-earth-600">Pa gen resèt pou kounye a. Klike "Nouvo resèt".</p>
          ) : (
            <ul className="divide-y divide-cream-100">
              {recipes.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/doz/${r.id}`} className="font-semibold text-ink hover:text-forest-700 transition inline-flex items-center gap-1.5">
                      <Pencil className="w-3 h-3 text-earth-400" strokeWidth={2} />
                      {r.title}
                    </Link>
                    <div className="text-[11px] text-earth-500 mt-0.5 flex items-center gap-2">
                      {r.category_id && catLabel.get(r.category_id) && (
                        <span className="px-1.5 py-0.5 rounded bg-cream-100">{catLabel.get(r.category_id)}</span>
                      )}
                      {!r.published && <span className="text-amber-700 font-semibold">Bouyon</span>}
                    </div>
                  </div>
                  <DozRowActions id={r.id} published={r.published} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <DozCategories categories={cats} />
      </div>
    </div>
  );
}
