import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Bath, Plus, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import { hasCapability, type AdminRole } from '../admin-nav-config';
import BenyRowActions from './beny-row-actions';

export const metadata = { title: 'Admin · Beny Spirityèl' };
export const dynamic = 'force-dynamic';

export default async function AdminBenyPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  const { data: profile } = await supabase.from('profiles').select('role, admin_role').eq('id', user.id).maybeSingle();
  const me = profile as { role?: string; admin_role?: AdminRole | null } | null;
  if (me?.role !== 'admin' || !hasCapability(me.admin_role ?? null, 'manage_guides')) redirect('/admin');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bathsRaw } = await (supabase as any)
    .from('spiritual_baths')
    .select('id, title, intention, display_order, published, cover_image_url')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });
  const baths = (bathsRaw ?? []) as Array<{
    id: string;
    title: string;
    intention: string | null;
    display_order: number;
    published: boolean;
    cover_image_url: string | null;
  }>;

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1000px] mx-auto">
      <header className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-100 text-gold-700 text-xs font-semibold mb-2">
            <Bath className="w-3.5 h-3.5" strokeWidth={2.2} />
            Admin · Beny Spirityèl
          </div>
          <h1 className="font-display text-3xl font-bold text-ink">Beny spirityèl</h1>
          <p className="text-sm text-earth-600 mt-1">
            Manm yo wè yo nan seksyon Spirityalite a. Resèt konplè a rezève pou manm Melis.
          </p>
        </div>
        <Link href="/admin/beny/new" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-forest-700 hover:bg-forest-800 text-cream-50 text-sm font-semibold transition">
          <Plus className="w-4 h-4" strokeWidth={2.4} />
          Nouvo beny
        </Link>
      </header>

      <section className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
        {baths.length === 0 ? (
          <p className="p-8 text-center text-sm text-earth-600">Pa gen beny pou kounye a. Klike «&nbsp;Nouvo beny&nbsp;».</p>
        ) : (
          <ul className="divide-y divide-cream-100">
            {baths.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-cream-100 shrink-0 grid place-items-center">
                  {b.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.cover_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Bath className="w-4 h-4 text-earth-400" strokeWidth={2} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/admin/beny/${b.id}`} className="font-semibold text-ink hover:text-forest-700 transition inline-flex items-center gap-1.5">
                    <Pencil className="w-3 h-3 text-earth-400" strokeWidth={2} />
                    {b.title}
                  </Link>
                  <div className="text-[11px] text-earth-500 mt-0.5 flex items-center gap-2">
                    {b.intention && <span className="px-1.5 py-0.5 rounded bg-cream-100">{b.intention}</span>}
                    <span>Lòd {b.display_order}</span>
                    {!b.published && <span className="text-amber-700 font-semibold">Bouyon</span>}
                  </div>
                </div>
                <BenyRowActions id={b.id} published={b.published} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
