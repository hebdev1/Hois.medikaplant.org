import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Edit3, ExternalLink, Eye, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import GuideForm from '../guide-form';
import { updateGuide } from '../actions';
import type { Database } from '@/types/database';
import { hasCapability, type AdminRole } from '../../admin-nav-config';

export const metadata = { title: 'Admin · Modifye gid' };
export const dynamic = 'force-dynamic';

type Guide = Database['public']['Tables']['guides']['Row'];
type Category = Database['public']['Tables']['guide_categories']['Row'];

export default async function EditGuidePage({
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

  const [guideResult, catsResult] = await Promise.all([
    supabase.from('guides').select('*').eq('id', params.id).maybeSingle(),
    supabase
      .from('guide_categories')
      .select('*')
      .order('display_order', { ascending: true }),
  ]);
  const guide = guideResult.data as Guide | null;
  if (!guide) notFound();
  const categories = (catsResult.data ?? []) as Category[];

  // Bind the guide id to the update action so the form can call action(state, formData)
  const action = updateGuide.bind(null, guide.id);

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1280px] mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/guides"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-earth-700 hover:text-forest-700 mb-3"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.2} />
          Tounen nan Gid
        </Link>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink inline-flex items-center gap-2">
              <Edit3 className="w-6 h-6 text-forest-700" strokeWidth={2} />
              Modifye atik
            </h1>
            <p className="mt-2 text-sm text-earth-600">
              <span className="font-mono text-xs bg-cream-100 px-1.5 py-0.5 rounded">
                /{guide.slug}
              </span>{' '}
              · Vyou: {guide.view_count}
            </p>
          </div>
          {guide.published && (
            <a
              href={`/dashboard/guides/${guide.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-cream-200 hover:border-forest-300 text-earth-700 hover:text-forest-700 rounded-lg transition"
            >
              <Eye className="w-3.5 h-3.5" strokeWidth={2.2} />
              Wè sou sit la
              <ExternalLink className="w-3 h-3" strokeWidth={2.2} />
            </a>
          )}
        </div>
        {searchParams.created && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-forest-50 border border-forest-200 text-sm text-forest-800">
            <CheckCircle2 className="w-4 h-4" strokeWidth={2.2} />
            Atik la kreye ak siksè. Ou ka modifye li oswa pibliye li kounye a.
          </div>
        )}
      </div>

      <GuideForm
        mode="edit"
        guide={guide}
        categories={categories}
        action={action}
      />
    </div>
  );
}
