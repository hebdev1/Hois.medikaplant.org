import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import { hasCapability, type AdminRole } from '../../admin-nav-config';
import BenyForm, { type BathRecord } from '../beny-form';

export const metadata = { title: 'Admin · Edite beny' };
export const dynamic = 'force-dynamic';

export default async function EditBenyPage(
  props: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ created?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  const { data: profile } = await supabase.from('profiles').select('role, admin_role').eq('id', user.id).maybeSingle();
  const me = profile as { role?: string; admin_role?: AdminRole | null } | null;
  if (me?.role !== 'admin' || !hasCapability(me.admin_role ?? null, 'manage_guides')) redirect('/admin');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const [{ data: bathRaw }, { data: recipeRaw }] = await Promise.all([
    sb.from('spiritual_baths')
      .select('id, slug, title, intention, excerpt, cover_image_url, display_order, published')
      .eq('id', params.id)
      .maybeSingle(),
    sb.from('spiritual_bath_recipes')
      .select('ingredients, preparation_html, usage_html, cautions_html, video_url')
      .eq('bath_id', params.id)
      .maybeSingle(),
  ]);
  if (!bathRaw) notFound();
  const recipe = (recipeRaw ?? {}) as Partial<BathRecord>;
  const bath: BathRecord = {
    ...(bathRaw as Omit<BathRecord, 'ingredients' | 'preparation_html' | 'usage_html' | 'cautions_html' | 'video_url'>),
    ingredients: recipe.ingredients ?? [],
    preparation_html: recipe.preparation_html ?? null,
    usage_html: recipe.usage_html ?? null,
    cautions_html: recipe.cautions_html ?? null,
    video_url: recipe.video_url ?? null,
  };

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1280px] mx-auto">
      <Link href="/admin/beny" className="inline-flex items-center gap-1.5 text-sm text-earth-600 hover:text-forest-700 mb-4">
        <ArrowLeft className="w-4 h-4" strokeWidth={2.2} /> Beny Spirityèl
      </Link>
      <h1 className="font-display text-2xl font-bold text-ink mb-1">{bath.title}</h1>
      {searchParams.created === '1' && (
        <p className="mb-5 text-sm text-forest-800 bg-forest-50 border border-forest-200 rounded-lg px-3 py-2">✓ Beny lan kreye.</p>
      )}
      <div className="mt-4">
        <BenyForm mode="edit" bath={bath} />
      </div>
    </div>
  );
}
