import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import DozForm, { type DozRecipe } from '../doz-form';

export const metadata = { title: 'Admin · Edite resèt' };
export const dynamic = 'force-dynamic';

export default async function EditDozPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { created?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if ((profile as { role?: string } | null)?.role !== 'admin') redirect('/admin');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const [{ data: recipeRaw }, { data: cats }] = await Promise.all([
    sb.from('doz_recipes').select('id, slug, title, excerpt, body_html, category_id, tag, cover_image_url, published').eq('id', params.id).maybeSingle(),
    sb.from('doz_categories').select('id, label').order('display_order', { ascending: true }),
  ]);
  const recipe = recipeRaw as DozRecipe | null;
  if (!recipe) notFound();

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1280px] mx-auto">
      <Link href="/admin/doz" className="inline-flex items-center gap-1.5 text-sm text-earth-600 hover:text-forest-700 mb-4">
        <ArrowLeft className="w-4 h-4" strokeWidth={2.2} /> Resèt ak Dòz
      </Link>
      <h1 className="font-display text-2xl font-bold text-ink mb-1">{recipe.title}</h1>
      {searchParams.created === '1' && (
        <p className="mb-5 text-sm text-forest-800 bg-forest-50 border border-forest-200 rounded-lg px-3 py-2">✓ Resèt la kreye.</p>
      )}
      <div className="mt-4">
        <DozForm mode="edit" recipe={recipe} categories={(cats ?? []) as Array<{ id: string; label: string }>} />
      </div>
    </div>
  );
}
