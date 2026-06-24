import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Users,
  Star,
  GraduationCap,
  Video,
  Calendar,
  CheckCircle2,
  Lock,
  ExternalLink,
  FileText,
  Languages,
} from 'lucide-react';
import PromoteHeader from '@/components/ui/promote-header';
import Footer from '@/components/ui/footer';
import { createClient } from '@/lib/supabase/server';
import { sanitizeGuideHtml } from '@/lib/sanitize-html';

export const dynamic = 'force-dynamic';

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  body_html: string | null;
  cover_image_url: string | null;
  instructor_name: string;
  instructor_role: string | null;
  instructor_avatar_url: string | null;
  duration_text: string | null;
  level: string;
  format: string;
  zoom_url: string | null;
  zoom_schedule: { text?: string } | null;
  student_count_text: string | null;
  rating: number;
  price_cents: number | null;
  plan_required: 'basic' | 'premium' | 'vip';
  category_id: string | null;
  language: string;
  tags: string[];
};

type ModuleRow = {
  id: string;
  display_order: number;
  title: string;
  description: string | null;
  duration_text: string | null;
  video_url: string | null;
  resource_links: Array<{ label: string; url: string }> | null;
  preview: boolean;
};

type CategoryRow = { slug: string; title: string };

const LEVEL_LABEL: Record<string, string> = {
  debutan: 'Debutan',
  entermedye: 'Entèmedyè',
  avanse: 'Avanse',
  tout_nivo: 'Tout nivo',
};

const FORMAT_LABEL: Record<string, string> = {
  video: 'Videyo sou demand',
  live_zoom: 'Sesyon Zoom an direkt',
  hybrid: 'Hybrid — videyo + Zoom',
};

const LANGUAGE_LABEL: Record<string, string> = {
  ht: 'Kreyòl',
  fr: 'Français',
  en: 'English',
};

const PLAN_LABEL: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

const PLAN_HREF: Record<string, string> = {
  basic: '/checkout?plan=basic',
  premium: '/checkout?plan=premium',
  vip: '/checkout?plan=vip',
};

function priceLabel(cents: number | null): string {
  if (cents === null || cents === undefined) return 'Enkli nan abònman';
  return `$${(cents / 100).toFixed(2)}`;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data } = await sb
    .from('courses')
    .select('title, description')
    .eq('slug', params.slug)
    .eq('active', true)
    .maybeSingle();
  const c = data as { title: string; description: string } | null;
  return {
    title: c?.title ?? 'Klas',
    description: c?.description,
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const { data: courseRaw } = await sb
    .from('courses')
    .select('*')
    .eq('slug', params.slug)
    .eq('active', true)
    .maybeSingle();
  const course = courseRaw as CourseRow | null;
  if (!course) notFound();

  const [modulesRes, categoryRes, relatedRes] = await Promise.all([
    sb
      .from('course_modules')
      .select(
        'id, display_order, title, description, duration_text, video_url, resource_links, preview'
      )
      .eq('course_id', course.id)
      .order('display_order', { ascending: true }),
    course.category_id
      ? sb
          .from('course_categories')
          .select('slug, title')
          .eq('id', course.category_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    course.category_id
      ? sb
          .from('courses')
          .select(
            'id, slug, title, description, cover_image_url, instructor_name, duration_text, level, format, rating, plan_required'
          )
          .eq('category_id', course.category_id)
          .eq('active', true)
          .neq('id', course.id)
          .order('display_order', { ascending: true })
          .limit(3)
      : Promise.resolve({ data: [] }),
  ]);

  const modules = (modulesRes.data ?? []) as ModuleRow[];
  const category = (categoryRes.data ?? null) as CategoryRow | null;
  const related = (relatedRes.data ?? []) as Array<
    Pick<
      CourseRow,
      | 'id'
      | 'slug'
      | 'title'
      | 'description'
      | 'cover_image_url'
      | 'instructor_name'
      | 'duration_text'
      | 'level'
      | 'format'
      | 'rating'
      | 'plan_required'
    >
  >;

  const totalDurationModules = modules.length;
  const planHref = PLAN_HREF[course.plan_required] ?? '/#pri';

  return (
    <main className="min-h-screen bg-white">
      <PromoteHeader />

      <article className="max-w-[1200px] mx-auto px-4 md:px-12 lg:px-20 py-10 md:py-16">
        {/* Back link */}
        <Link
          href="/klas"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-earth-700 hover:text-brand-700 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.2} />
          Tounen nan tout klas yo
        </Link>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <header className="grid lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-12 items-start mb-12">
          <div>
            {category && (
              <Link
                href="/klas#kategori"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold mb-4 hover:bg-brand-200 transition"
              >
                <GraduationCap className="w-3 h-3" strokeWidth={2.4} />
                {category.title}
              </Link>
            )}
            <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-ink leading-tight">
              {course.title}
            </h1>
            <p className="mt-4 text-base md:text-lg text-ink-muted leading-relaxed">
              {course.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs">
              <Chip>{LEVEL_LABEL[course.level] ?? course.level}</Chip>
              <Chip icon={course.format === 'live_zoom' ? Video : undefined}>
                {FORMAT_LABEL[course.format] ?? course.format}
              </Chip>
              <Chip icon={Languages}>
                {LANGUAGE_LABEL[course.language] ?? course.language}
              </Chip>
              {course.duration_text && (
                <Chip icon={Clock}>{course.duration_text}</Chip>
              )}
              {course.student_count_text && (
                <Chip icon={Users}>{course.student_count_text}</Chip>
              )}
              <Chip icon={Star}>{course.rating.toFixed(1)}</Chip>
            </div>

            {(course.tags ?? []).length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {course.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-cream-100 text-earth-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* Instructor block */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex items-center gap-3">
              {course.instructor_avatar_url ? (
                <Image
                  src={course.instructor_avatar_url}
                  alt={course.instructor_name}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
              ) : (
                <span className="grid place-items-center w-12 h-12 rounded-full bg-brand-gradient text-white font-bold">
                  {course.instructor_name[0]?.toUpperCase() ?? 'H'}
                </span>
              )}
              <div>
                <div className="text-sm font-semibold text-ink">
                  {course.instructor_name}
                </div>
                {course.instructor_role && (
                  <div className="text-xs text-ink-muted">
                    {course.instructor_role}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CTA card */}
          <aside className="lg:sticky lg:top-6 rounded-2xl border border-slate-200 bg-white shadow-card overflow-hidden">
            <div className="relative aspect-video bg-cream-100">
              {course.cover_image_url ? (
                <Image
                  src={course.cover_image_url}
                  alt={course.title}
                  fill
                  sizes="(min-width: 1024px) 480px, 100vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-earth-500">
                  <GraduationCap className="w-14 h-14" strokeWidth={1.5} />
                </div>
              )}
              {course.format === 'live_zoom' && (
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider">
                  <Video className="w-3 h-3" strokeWidth={2.4} />
                  Live
                </span>
              )}
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="font-display text-2xl font-bold text-ink">
                  {priceLabel(course.price_cents)}
                </div>
                <div className="text-xs text-ink-muted mt-0.5">
                  Plan{' '}
                  <span className="font-semibold">
                    {PLAN_LABEL[course.plan_required] ?? course.plan_required}
                  </span>{' '}
                  oswa pi wo
                </div>
              </div>

              <Link
                href={planHref}
                className="block w-full text-center bg-brand-gradient hover:brightness-110 text-white px-5 py-3 rounded-full font-medium transition shadow-md"
              >
                {course.price_cents !== null
                  ? 'Achte klas la'
                  : 'Vin manm pou jwenn aksè'}
              </Link>

              {course.format !== 'video' && course.zoom_schedule?.text && (
                <div className="rounded-xl bg-cream-100 px-3 py-2.5 text-xs text-earth-700">
                  <div className="inline-flex items-center gap-1.5 font-semibold mb-0.5">
                    <Calendar className="w-3 h-3" strokeWidth={2.4} />
                    Pwogram sesyon yo
                  </div>
                  <p className="text-[11px] leading-snug">
                    {course.zoom_schedule.text}
                  </p>
                </div>
              )}

              <ul className="space-y-2 text-xs text-earth-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2
                    className="w-3.5 h-3.5 text-forest-700 mt-0.5 shrink-0"
                    strokeWidth={2.4}
                  />
                  Aksè lifetime ak abònman aktif
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2
                    className="w-3.5 h-3.5 text-forest-700 mt-0.5 shrink-0"
                    strokeWidth={2.4}
                  />
                  Sètifika otomatik nan fen
                </li>
                {totalDurationModules > 0 && (
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      className="w-3.5 h-3.5 text-forest-700 mt-0.5 shrink-0"
                      strokeWidth={2.4}
                    />
                    {totalDurationModules} modil ak resous telechaje
                  </li>
                )}
              </ul>
            </div>
          </aside>
        </header>

        {/* ── BODY (rich html) ──────────────────────────────────────────── */}
        {course.body_html && course.body_html.trim().length > 0 && (
          <section className="mb-12 max-w-3xl">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-ink mb-5">
              Sou klas sa a
            </h2>
            <div
              className="guide-rich-body text-base text-ink leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: sanitizeGuideHtml(course.body_html),
              }}
            />
          </section>
        )}

        {/* ── MODULES ───────────────────────────────────────────────────── */}
        <section className="mb-16">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-ink mb-2">
            Plan klas la
          </h2>
          <p className="text-sm text-ink-muted mb-6">
            {modules.length > 0
              ? `${modules.length} modil — ${modules.filter((m) => m.preview).length} ki gen preview gratis.`
              : 'Plan klas la ap vin disponib talè konsa.'}
          </p>

          {modules.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-earth-600">
              Otè klas la ap travay sou modil yo. Tcheke ankò byento.
            </div>
          ) : (
            <ol className="space-y-3">
              {modules.map((m) => (
                <li key={m.id}>
                  <details className="group rounded-2xl border border-slate-200 bg-white hover:border-brand-300 transition-colors overflow-hidden">
                    <summary className="flex items-start gap-3 p-5 cursor-pointer list-none">
                      <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-100 text-brand-800 font-display font-bold text-sm shrink-0">
                        {m.display_order}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-ink">
                          {m.title}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                          {m.duration_text && (
                            <span className="inline-flex items-center gap-1">
                              <Clock
                                className="w-3 h-3"
                                strokeWidth={2.2}
                              />
                              {m.duration_text}
                            </span>
                          )}
                          {m.video_url && (
                            <span className="inline-flex items-center gap-1 text-brand-700">
                              <Video
                                className="w-3 h-3"
                                strokeWidth={2.2}
                              />
                              Videyo
                            </span>
                          )}
                          {m.preview ? (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                              <CheckCircle2
                                className="w-3 h-3"
                                strokeWidth={2.4}
                              />
                              Preview gratis
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-earth-500">
                              <Lock className="w-3 h-3" strokeWidth={2.2} />
                              Abònman obligatwa
                            </span>
                          )}
                          {(m.resource_links?.length ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1 text-earth-600">
                              <FileText
                                className="w-3 h-3"
                                strokeWidth={2.2}
                              />
                              {m.resource_links!.length} resous
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-ink-muted shrink-0 group-open:hidden">
                        Wè detay
                      </span>
                      <span className="hidden text-xs font-semibold text-ink-muted shrink-0 group-open:inline">
                        Fèmen
                      </span>
                    </summary>
                    <div className="px-5 pb-5 pl-[68px] space-y-3">
                      {m.description && (
                        <p className="text-sm text-ink leading-relaxed">
                          {m.description}
                        </p>
                      )}

                      {m.video_url && m.preview && (
                        <a
                          href={m.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
                        >
                          <Video className="w-3.5 h-3.5" strokeWidth={2.2} />
                          Gade preview videyo a
                          <ExternalLink
                            className="w-3 h-3"
                            strokeWidth={2.2}
                          />
                        </a>
                      )}

                      {(m.resource_links?.length ?? 0) > 0 && (
                        <ul className="space-y-1">
                          {m.resource_links!.map((link) => (
                            <li key={link.url}>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-earth-700 hover:text-brand-700"
                              >
                                <FileText
                                  className="w-3 h-3"
                                  strokeWidth={2.2}
                                />
                                {link.label}
                                <ExternalLink
                                  className="w-2.5 h-2.5"
                                  strokeWidth={2.2}
                                />
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}

                      {!m.preview && (
                        <Link
                          href={planHref}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800"
                        >
                          <Lock className="w-3 h-3" strokeWidth={2.4} />
                          Vin manm pou debloke modil sa a
                          <ArrowRight
                            className="w-3 h-3"
                            strokeWidth={2.4}
                          />
                        </Link>
                      )}
                    </div>
                  </details>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* ── RELATED ───────────────────────────────────────────────────── */}
        {related.length > 0 && (
          <section className="pt-10 border-t border-slate-200">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-ink mb-6">
              Lòt klas <em className="text-brand-700 not-italic">menm jan</em>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/klas/${r.slug}`}
                  className="group rounded-2xl bg-white border border-slate-200 overflow-hidden hover:border-brand-300 hover:shadow-card transition-all"
                >
                  <div className="relative aspect-video bg-cream-100">
                    {r.cover_image_url ? (
                      <Image
                        src={r.cover_image_url}
                        alt={r.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, 100vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-earth-500">
                        <GraduationCap
                          className="w-10 h-10"
                          strokeWidth={1.5}
                        />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="font-display text-base font-bold text-ink leading-tight line-clamp-2">
                      {r.title}
                    </div>
                    <div className="mt-2 text-xs text-ink-muted line-clamp-2">
                      {r.description}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>

      <Footer />
    </main>
  );
}

function Chip({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: typeof Clock;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cream-100 text-earth-700 font-semibold">
      {Icon && <Icon className="w-3 h-3" strokeWidth={2.2} />}
      {children}
    </span>
  );
}
