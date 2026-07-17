import Link from 'next/link';
import { FlaskConical, Leaf, ChevronRight, Inbox } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import Topbar from '@/components/dashboard/topbar';

export const metadata = { title: 'Resèt ak Dòz · MedikaPlant' };
export const dynamic = 'force-dynamic';

const PLAN_LABEL: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

type Recipe = {
  slug: string;
  title: string;
  excerpt: string | null;
  tag: string | null;
  category_id: string | null;
};

export default async function ResetDozPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const [{ data: profileRaw }, { data: recipesRaw }, { data: catsRaw }] = await Promise.all([
    supabase.from('profiles').select('plan, full_name, email, avatar_url').eq('id', user.id).maybeSingle(),
    sb.from('doz_recipes').select('slug, title, excerpt, tag, category_id').eq('published', true).order('published_at', { ascending: false }),
    sb.from('doz_categories').select('id, label, display_order').eq('active', true).order('display_order', { ascending: true }),
  ]);

  const profile = profileRaw as { plan: 'basic' | 'premium' | 'vip'; full_name: string | null; email: string; avatar_url: string | null } | null;
  const recipes = (recipesRaw ?? []) as Recipe[];
  const cats = (catsRaw ?? []) as Array<{ id: string; label: string }>;
  const shortName = (profile?.full_name || profile?.email.split('@')[0] || 'Manm').split(' ')[0];

  // Group by category; uncategorized last.
  const groups: Array<{ label: string; items: Recipe[] }> = cats
    .map((c) => ({ label: c.label, items: recipes.filter((r) => r.category_id === c.id) }))
    .filter((g) => g.items.length > 0);
  const uncat = recipes.filter((r) => !r.category_id || !cats.some((c) => c.id === r.category_id));
  if (uncat.length > 0) groups.push({ label: 'Lòt', items: uncat });

  return (
    <>
      <Topbar
        userName={shortName}
        userCondition={`${PLAN_LABEL[profile?.plan ?? 'basic']} · Resèt`}
        userId={user.id}
        userPlan={profile?.plan ?? 'basic'}
        avatarUrl={profile?.avatar_url ?? null}
      />

      <div className="p-5 md:p-8 lg:p-10 max-w-[1000px] mx-auto grid gap-6">
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-semibold mb-3">
            <FlaskConical className="w-3.5 h-3.5" strokeWidth={2.2} />
            Resèt ak Dòz
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Dòz ak fòmil natirèl
          </h1>
          <p className="mt-2 text-sm text-earth-600 max-w-2xl">
            Resèt fèy tradisyonèl yo — klike sou youn pou li tout dòz la.
          </p>
        </header>

        {recipes.length === 0 ? (
          <div className="rounded-2xl bg-cream-50 border border-dashed border-cream-300 p-10 text-center">
            <Inbox className="w-10 h-10 mx-auto text-earth-400 mb-3" strokeWidth={1.6} />
            <p className="text-sm text-earth-700">Pa gen resèt ki pibliye pou kounye a.</p>
          </div>
        ) : (
          groups.map((g) => (
            <section key={g.label}>
              <h2 className="font-display text-lg font-bold text-ink mb-3">{g.label}</h2>
              <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
                {g.items.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/dashboard/reset-doz/${r.slug}`}
                    className="group flex items-start gap-3 bg-white border border-cream-200 rounded-2xl p-4 shadow-card hover:shadow-cardHover hover:border-forest-300 transition"
                  >
                    <span className="grid place-items-center w-10 h-10 rounded-xl bg-forest-100 text-forest-700 shrink-0">
                      <Leaf className="w-5 h-5" strokeWidth={1.9} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-ink leading-snug group-hover:text-forest-700 transition">{r.title}</h3>
                      {r.excerpt && <p className="text-xs text-earth-600 mt-0.5 line-clamp-2">{r.excerpt}</p>}
                      {r.tag && <span className="mt-1 inline-block text-[11px] text-earth-500">{r.tag}</span>}
                    </div>
                    <ChevronRight className="w-4 h-4 text-earth-400 group-hover:text-forest-600 shrink-0 mt-1" strokeWidth={2} />
                  </Link>
                ))}
              </div>
            </section>
          ))
        )}

        <p className="text-[10px] leading-snug text-earth-500">
          Sijesyon edikatif sèlman — pa yon dyagnostik. Konsilte yon
          pwofesyonèl sante anvan ou itilize remèd fèy.
        </p>
      </div>
    </>
  );
}
