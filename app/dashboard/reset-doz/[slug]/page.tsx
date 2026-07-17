import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, FlaskConical } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import Topbar from '@/components/dashboard/topbar';
import { sanitizeGuideHtml } from '@/lib/sanitize-html';

export const dynamic = 'force-dynamic';

const PLAN_LABEL: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

export default async function DozDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const [{ data: profileRaw }, { data: recipeRaw }] = await Promise.all([
    supabase.from('profiles').select('plan, full_name, email, avatar_url').eq('id', user.id).maybeSingle(),
    sb.from('doz_recipes').select('title, excerpt, body_html, tag, published').eq('slug', params.slug).maybeSingle(),
  ]);

  const recipe = recipeRaw as { title: string; excerpt: string | null; body_html: string | null; tag: string | null; published: boolean } | null;
  if (!recipe || !recipe.published) notFound();

  const profile = profileRaw as { plan: 'basic' | 'premium' | 'vip'; full_name: string | null; email: string; avatar_url: string | null } | null;
  const shortName = (profile?.full_name || profile?.email.split('@')[0] || 'Manm').split(' ')[0];

  return (
    <>
      <Topbar
        userName={shortName}
        userCondition={`${PLAN_LABEL[profile?.plan ?? 'basic']} · Resèt`}
        userId={user.id}
        userPlan={profile?.plan ?? 'basic'}
        avatarUrl={profile?.avatar_url ?? null}
      />

      <article className="p-5 md:p-8 lg:p-10 max-w-[760px] mx-auto grid gap-5">
        <Link href="/dashboard/reset-doz" className="inline-flex items-center gap-1.5 text-sm text-earth-600 hover:text-forest-700 transition">
          <ArrowLeft className="w-4 h-4" strokeWidth={2.2} /> Resèt ak Dòz
        </Link>

        <header>
          {recipe.tag && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-semibold mb-3">
              <FlaskConical className="w-3.5 h-3.5" strokeWidth={2.2} />
              {recipe.tag}
            </div>
          )}
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink leading-tight">
            {recipe.title}
          </h1>
          {recipe.excerpt && <p className="mt-3 text-lg text-earth-600 leading-relaxed">{recipe.excerpt}</p>}
        </header>

        {recipe.body_html && recipe.body_html.trim().length > 0 ? (
          <div
            className="guide-rich-body space-y-5 text-base text-ink leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeGuideHtml(recipe.body_html) }}
          />
        ) : (
          <p className="text-sm text-earth-600 italic">Kontni an ap vin disponib byento.</p>
        )}

        <p className="mt-4 text-[10px] leading-snug text-earth-500 border-t border-cream-200 pt-4">
          Sijesyon edikatif sèlman — pa yon dyagnostik. Deklarasyon sa yo pa
          evalye pa FDA. Konsilte yon pwofesyonèl sante anvan ou itilize remèd
          fèy.
        </p>
      </article>
    </>
  );
}
