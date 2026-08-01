import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { Award, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import PrintButton from './print-button';

export const metadata = { title: 'Sètifika · Hoïs Inivèsite' };
export const dynamic = 'force-dynamic';

const MONTHS_HT = [
  'Janvye', 'Fevriye', 'Mas', 'Avril', 'Me', 'Jen',
  'Jiyè', 'Out', 'Septanm', 'Oktòb', 'Novanm', 'Desanm',
];

function dateHT(d: Date) {
  return `${d.getDate()} ${MONTHS_HT[d.getMonth()]} ${d.getFullYear()}`;
}

// A course-completion certificate. Only reachable once the member owns the
// course AND has finished every module — both checked server-side here.
export default async function CertificatePage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect(`/etidyan/login?redirect=/setifika/${params.slug}`);

  const { data: courseRaw } = await supabase
    .from('courses')
    .select('id, slug, title, instructor_name')
    .eq('slug', params.slug)
    .maybeSingle();
  const course = courseRaw as {
    id: string;
    slug: string;
    title: string;
    instructor_name: string | null;
  } | null;
  if (!course) notFound();

  // Must be enrolled.
  const { data: enrolled } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('course_id', course.id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!enrolled) redirect(`/klas/${course.slug}`);

  // Must have completed every module.
  const [{ count: totalModules }, doneRes] = await Promise.all([
    supabase
      .from('course_modules')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', course.id),
    // course_module_progress isn't in the generated types — cast the client.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('course_module_progress')
      .select('module_id')
      .eq('user_id', user.id)
      .eq('course_id', course.id),
  ]);

  const total = totalModules ?? 0;
  const doneModuleIds = new Set(
    ((doneRes.data ?? []) as Array<{ module_id: string }>).map(
      (r) => r.module_id
    )
  );
  const complete = total > 0 && doneModuleIds.size >= total;

  // Not finished yet → send them back to the course to keep going.
  if (!complete) redirect(`/aprann/${course.slug}`);

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .maybeSingle();
  const profile = profileRaw as {
    full_name: string | null;
    email: string;
  } | null;
  const name =
    profile?.full_name?.trim() ||
    profile?.email?.split('@')[0] ||
    'Elèv Hoïs';

  return (
    <main className="min-h-screen bg-cream-100 print:bg-white px-4 py-8 md:py-12">
      {/* Actions (hidden when printing) */}
      <div className="print:hidden max-w-3xl mx-auto mb-6 flex items-center justify-between gap-3">
        <Link
          href="/aprann"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-earth-700 hover:text-ink"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.2} />
          Tounen nan Espas Elèv
        </Link>
        <PrintButton />
      </div>

      {/* Certificate */}
      <article className="max-w-3xl mx-auto bg-white border-[6px] border-double border-forest-700 rounded-sm shadow-card print:shadow-none relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-brand-500/5" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-gold-400/10" />

        <div className="relative px-8 md:px-14 py-12 md:py-16 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-hois.png"
            alt="Hoïs"
            className="h-10 w-auto mx-auto mb-1"
          />
          <p className="text-[11px] uppercase tracking-[0.22em] text-brand-700 font-semibold">
            Inivèsite
          </p>

          <div className="mt-8 inline-flex items-center gap-2 text-gold-700">
            <span className="h-px w-8 bg-gold-400" />
            <Award className="w-6 h-6" strokeWidth={1.8} />
            <span className="h-px w-8 bg-gold-400" />
          </div>

          <h1 className="mt-4 font-display text-2xl md:text-3xl font-bold text-ink tracking-tight">
            Sètifika Akonplisman
          </h1>
          <p className="mt-6 text-sm text-earth-600">Sa a sètifye ke</p>

          <p className="mt-2 font-display text-3xl md:text-4xl font-bold text-forest-800">
            {name}
          </p>

          <p className="mt-6 text-sm text-earth-600">
            te konplete kou a ak siksè
          </p>
          <p className="mt-1.5 font-display text-xl md:text-2xl font-semibold text-ink">
            « {course.title} »
          </p>

          <div className="mt-10 flex items-end justify-between gap-6 text-left">
            <div>
              <div className="font-display text-sm font-semibold text-ink">
                {course.instructor_name || 'Hoïs Inivèsite'}
              </div>
              <div className="mt-1 border-t border-cream-300 pt-1 text-[11px] uppercase tracking-wider text-earth-500">
                Enstriktè
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-sm font-semibold text-ink">
                {dateHT(new Date())}
              </div>
              <div className="mt-1 border-t border-cream-300 pt-1 text-[11px] uppercase tracking-wider text-earth-500">
                Dat
              </div>
            </div>
          </div>
        </div>
      </article>

      <p className="print:hidden max-w-3xl mx-auto mt-5 text-center text-xs text-earth-500">
        Hoïs Inivèsite · HOÏSMedikaplant.com
      </p>
    </main>
  );
}
