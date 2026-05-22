import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import ResourceForm from '../resource-form';
import type { Database } from '@/types/database';

export const metadata = { title: 'Admin · Modifye resous' };
export const dynamic = 'force-dynamic';

type Resource = Database['public']['Tables']['resources']['Row'];

export default async function EditResourcePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { created?: string };
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error || !data) notFound();
  const resource = data as Resource;

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[860px] mx-auto">
      <Link
        href="/admin/resources"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-earth-700 hover:text-forest-700 transition mb-4"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2.2} />
        Tounen nan resous yo
      </Link>

      <header className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
            Modifye resous
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            {resource.title}
          </h1>
        </div>
        <a
          href={resource.file_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-cream-200 hover:border-forest-300 text-earth-700 hover:text-forest-700 rounded-lg transition"
        >
          <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.2} />
          Wè fichye a
        </a>
      </header>

      {searchParams.created && (
        <div className="mb-5 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-forest-50 border border-forest-200 text-sm text-forest-800">
          <CheckCircle2 className="w-4 h-4" strokeWidth={2.2} />
          Resous la kreye avèk siksè. Pou pibliye li, aktive boutwoumank
          &ldquo;Pibliye&rdquo; pi ba a epi anrejistre.
        </div>
      )}

      <section className="bg-white border border-cream-200 rounded-2xl shadow-card p-5 md:p-8">
        <ResourceForm mode="edit" resource={resource} />
      </section>
    </div>
  );
}
