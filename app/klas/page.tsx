import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Leaf,
  Sparkles,
  Activity,
  Sprout,
  Heart,
  Clock,
  Users,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Star,
  Video,
  Mountain,
  type LucideIcon,
} from 'lucide-react';
import PromoteHeader from '@/components/ui/promote-header';
import Footer from '@/components/ui/footer';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Klas · MedikaPlant Hoïs Inivèsite',
  description:
    'Katalòg klas Hoïs Inivèsite — plant santiniye, espiritualite HOÏS, nitrisyon, lavi natiropatik. Aprann ak yon èrboris.',
};

export const dynamic = 'force-dynamic';

// ─── Iconography registry ──────────────────────────────────────────────────
// Categories + formats store their icon as a string ("leaf", "video"…)
// so admins can pick from a dropdown. Map back to the lucide React component
// at render time. Falls back to GraduationCap for unknown values.

const ICONS: Record<string, LucideIcon> = {
  leaf: Leaf,
  sprout: Sprout,
  mountain: Mountain,
  heart: Heart,
  activity: Activity,
  'graduation-cap': GraduationCap,
  'book-open': BookOpen,
  video: Video,
  users: Users,
  star: Star,
};

const LEVEL_LABEL_TONE: Record<string, { label: string; tone: string }> = {
  debutan: { label: 'Debutan', tone: 'bg-brand-100 text-brand-700' },
  entermedye: { label: 'Entèmedyè', tone: 'bg-amber-100 text-amber-700' },
  avanse: { label: 'Avanse', tone: 'bg-rose-100 text-rose-700' },
  tout_nivo: { label: 'Tout nivo', tone: 'bg-sky-100 text-sky-700' },
};

const PLAN_HREF: Record<string, string> = {
  basic: '/checkout?plan=basic',
  premium: '/checkout?plan=premium',
  vip: '/checkout?plan=vip',
};

// ─── DB row shapes ─────────────────────────────────────────────────────────

type CategoryRow = {
  slug: string;
  title: string;
  body: string;
  icon: string;
  tone: string;
  display_order: number;
};

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover_image_url: string | null;
  instructor_name: string;
  instructor_role: string | null;
  duration_text: string | null;
  level: string;
  format: string;
  student_count_text: string | null;
  rating: number;
  plan_required: string;
  category_id: string | null;
  featured: boolean;
  tags: string[];
};

type PageConfigRow = {
  hero_eyebrow: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_cta_label: string | null;
  hero_cta_href: string | null;
  hero_image_url: string | null;
  stat_courses_label: string | null;
  stat_categories_label: string | null;
  stat_rating_label: string | null;
  stat_rating_value: number | null;
  benefits: string[];
  faqs: Array<{ q: string; a: string }>;
  formats: Array<{ title: string; body: string; icon: string }>;
  cta_title: string | null;
  cta_subtitle: string | null;
};

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function KlasPage() {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const [categoriesRes, coursesRes, configRes] = await Promise.all([
    sb
      .from('course_categories')
      .select('slug, title, body, icon, tone, display_order')
      .eq('active', true)
      .order('display_order', { ascending: true }),
    sb
      .from('courses')
      .select(
        'id, slug, title, description, cover_image_url, instructor_name, instructor_role, duration_text, level, format, student_count_text, rating, plan_required, category_id, featured, tags'
      )
      .eq('active', true)
      .order('display_order', { ascending: true }),
    sb.from('klas_page_config').select('*').eq('id', 1).maybeSingle(),
  ]);

  const categories = (categoriesRes.data ?? []) as CategoryRow[];
  const courses = (coursesRes.data ?? []) as CourseRow[];
  const config = (configRes.data ?? null) as PageConfigRow | null;

  // Count courses per category so each category card shows the correct
  // number without an extra round-trip per row.
  const courseCountByCat = new Map<string, number>();
  for (const c of courses) {
    if (!c.category_id) continue;
    courseCountByCat.set(
      c.category_id,
      (courseCountByCat.get(c.category_id) ?? 0) + 1
    );
  }
  // The query above returns category_id alongside courses; we need the
  // category id from course_categories for the count lookup. Fetch a tiny
  // {id, slug} map so the count chips display.
  const { data: catIdMap } = await sb
    .from('course_categories')
    .select('id, slug')
    .eq('active', true);
  const slugById = new Map(
    ((catIdMap ?? []) as Array<{ id: string; slug: string }>).map((c) => [
      c.id,
      c.slug,
    ])
  );
  const countBySlug = new Map<string, number>();
  for (const [id, count] of courseCountByCat) {
    const s = slugById.get(id);
    if (s) countBySlug.set(s, count);
  }

  const featuredCourses = courses.filter((c) => c.featured).slice(0, 6);

  const heroEyebrow = config?.hero_eyebrow ?? 'Klas Hoïs';
  const heroTitle =
    config?.hero_title ??
    'Aprann plant ki geri, jan grann nou yo te konnen yo.';
  const heroSubtitle =
    config?.hero_subtitle ??
    `${courses.length}+ klas an Kreyòl, sou plant santiniye, espiritualite HOÏS, nitrisyon, ak lavi natiropatik.`;
  const heroCtaLabel = config?.hero_cta_label ?? 'Vin manm pou aksè total';
  const heroCtaHref = config?.hero_cta_href ?? '/#pri';
  const heroImageUrl =
    config?.hero_image_url ??
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=700&q=80';
  const benefits = config?.benefits?.length
    ? config.benefits
    : [
        'Aksè iliminmite a tout klas + nouvo klas chak mwa',
        'Sètifika ofisyèl pou chak klas ou fini',
      ];
  const faqs = config?.faqs ?? [];
  const formats = config?.formats ?? [];

  return (
    <main className="min-h-screen bg-white">
      <PromoteHeader />

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-white to-white">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 90% 10%, rgba(22,163,74,0.10), transparent 45%), radial-gradient(circle at 10% 90%, rgba(196,49,120,0.07), transparent 40%)',
          }}
        />
        <div className="relative max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32 py-20 md:py-28">
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-5">
                <GraduationCap className="w-3.5 h-3.5" strokeWidth={2.4} />
                {heroEyebrow}
              </span>
              <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-ink leading-[1.05]">
                {heroTitle}
              </h1>
              <p className="mt-6 text-lg md:text-xl text-ink-muted leading-relaxed max-w-2xl">
                {heroSubtitle}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={heroCtaHref}
                  className="inline-flex items-center gap-2 bg-brand-gradient hover:brightness-110 text-white px-6 py-3 rounded-full font-medium transition shadow-md"
                >
                  {heroCtaLabel}
                  <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
                </Link>
                <a
                  href="#kategori"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-ink hover:text-brand-700 border border-slate-200 hover:border-brand-300 transition"
                >
                  Wè kategori yo
                </a>
              </div>

              <div className="mt-10 flex items-center gap-6 flex-wrap">
                <Stat
                  value={`${courses.length}+`}
                  label={config?.stat_courses_label ?? 'klas an Kreyòl'}
                />
                <div className="w-px h-10 bg-slate-200" />
                <Stat
                  value={`${categories.length}`}
                  label={config?.stat_categories_label ?? 'kategori prensipal'}
                />
                <div className="w-px h-10 bg-slate-200" />
                <Stat
                  value={(config?.stat_rating_value ?? 4.9).toFixed(1)}
                  label={config?.stat_rating_label ?? 'nòt manm yo bay'}
                />
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative aspect-[4/5] rounded-[1.8rem] overflow-hidden shadow-card">
                <Image
                  src={heroImageUrl}
                  alt="Fèy santiniye"
                  fill
                  sizes="500px"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-card px-4 py-3 flex items-center gap-3 max-w-[250px]">
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-brand-gradient text-white shrink-0">
                  <Star className="w-4 h-4 fill-current" strokeWidth={2.2} />
                </span>
                <div>
                  <div className="text-xs text-ink-muted">
                    {(config?.stat_rating_value ?? 4.9).toFixed(1)} ·{' '}
                    {courses.length} klas
                  </div>
                  <div className="text-sm font-semibold text-ink leading-tight">
                    Yon kominote ki sipòte w
                  </div>
                </div>
              </div>
              <div className="absolute -top-6 -right-2 bg-ink text-cream-50 rounded-2xl shadow-card px-4 py-3">
                <Sparkles className="w-4 h-4 text-brand-300 mb-1" strokeWidth={2.4} />
                <div className="text-xs text-white/70">Nouvo klas chak mwa</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── KATEGORI ────────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section id="kategori" className="py-20 md:py-28 bg-white">
          <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
            <div className="max-w-2xl mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                <BookOpen className="w-3.5 h-3.5" strokeWidth={2.4} />
                Kategori
              </span>
              <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-ink leading-tight">
                {categories.length} chemen aprann ki konekte
              </h2>
              <p className="mt-4 text-ink-muted leading-relaxed">
                Chwazi kote w vle kòmanse — ou ka pase yon chemen nan yon lòt
                san pwoblèm. Tout klas yo vini ansanm nan abònman ou.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {categories.map((cat) => {
                const Icon = ICONS[cat.icon] ?? Leaf;
                const count = countBySlug.get(cat.slug) ?? 0;
                return (
                  <article
                    key={cat.slug}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-6 md:p-7 hover:border-brand-300 hover:shadow-card transition-all"
                  >
                    <span
                      className={`grid place-items-center w-12 h-12 rounded-xl bg-gradient-to-br ${cat.tone} text-white shadow-sm`}
                    >
                      <Icon className="w-5 h-5" strokeWidth={2.2} />
                    </span>
                    <h3 className="mt-5 font-display text-xl font-bold text-ink">
                      {cat.title}
                    </h3>
                    <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                      {cat.body}
                    </p>
                    <div className="mt-5 pt-5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink-muted">
                        {count} klas
                      </span>
                      <span className="text-xs font-bold text-brand-700 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                        Eksplore
                        <ArrowRight className="w-3 h-3" strokeWidth={2.4} />
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── KLAS VEDÈT ─────────────────────────────────────────────────── */}
      {featuredCourses.length > 0 && (
        <section className="py-20 md:py-28 bg-gradient-to-b from-white to-brand-50/40">
          <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
            <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
              <div>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-4">
                  <Sparkles className="w-3.5 h-3.5" strokeWidth={2.4} />
                  Klas vedèt
                </span>
                <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-ink leading-tight">
                  Sa ki popilè kounye a
                </h2>
              </div>
              <Link
                href="/#pri"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                Wè tout klas yo
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.4} />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {featuredCourses.map((c) => {
                const lvl = LEVEL_LABEL_TONE[c.level] ?? {
                  label: c.level,
                  tone: 'bg-cream-100 text-earth-700',
                };
                return (
                  <article
                    key={c.id}
                    className="group rounded-2xl bg-white border border-slate-200/70 overflow-hidden hover:border-brand-300 hover:shadow-card transition-all flex flex-col"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-cream-100">
                      {c.cover_image_url ? (
                        <Image
                          src={c.cover_image_url}
                          alt={c.title}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center text-earth-500">
                          <GraduationCap className="w-10 h-10" strokeWidth={1.5} />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        {(c.tags ?? []).slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 backdrop-blur text-ink"
                          >
                            {tag}
                          </span>
                        ))}
                        {c.format === 'live_zoom' && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500 text-white inline-flex items-center gap-1">
                            <Video className="w-2.5 h-2.5" strokeWidth={2.5} />
                            Live
                          </span>
                        )}
                      </div>
                      <div className="absolute top-3 right-3">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${lvl.tone}`}
                        >
                          {lvl.label}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 md:p-6 flex-1 flex flex-col">
                      <h3 className="font-display text-lg font-bold text-ink leading-tight">
                        {c.title}
                      </h3>
                      <p className="mt-2 text-sm text-ink-muted leading-relaxed line-clamp-3">
                        {c.description}
                      </p>
                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-ink-muted gap-2">
                        <div>
                          <div className="font-semibold text-ink">
                            {c.instructor_name}
                          </div>
                          {c.instructor_role && (
                            <div className="text-[10px]">{c.instructor_role}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="w-3 h-3 fill-current" strokeWidth={0} />
                          <span className="font-bold text-ink">
                            {c.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-ink-muted">
                        {c.duration_text && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" strokeWidth={2.2} />
                            {c.duration_text}
                          </span>
                        )}
                        {c.student_count_text && (
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3 h-3" strokeWidth={2.2} />
                            {c.student_count_text}
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/klas/${c.slug}`}
                        className="mt-5 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold bg-ink hover:bg-brand-gradient text-cream-50 transition"
                      >
                        Wè detay klas la
                        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.4} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── FÒMA ────────────────────────────────────────────────────────── */}
      {formats.length > 0 && (
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
            <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20 items-start">
              <div>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-4">
                  <Video className="w-3.5 h-3.5" strokeWidth={2.4} />
                  Fòma
                </span>
                <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-ink leading-tight">
                  {formats.length} fason pou aprann nan ritm pa w
                </h2>
                <p className="mt-4 text-ink-muted leading-relaxed">
                  Pa gen yon "bon" fason aprann — gen sèlman fason ki bon pou
                  ou. Hoïs Inivèsite konbinen plizyè fòma pou kreye yon
                  eksperyans konplè.
                </p>
              </div>

              <div className="grid gap-4">
                {formats.map((fmt) => {
                  const Icon = ICONS[fmt.icon] ?? Video;
                  return (
                    <article
                      key={fmt.title}
                      className="flex items-start gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 md:p-6 hover:border-brand-300 transition-colors"
                    >
                      <span className="grid place-items-center w-12 h-12 rounded-xl bg-brand-50 text-brand-700 shrink-0">
                        <Icon className="w-5 h-5" strokeWidth={2.2} />
                      </span>
                      <div>
                        <h3 className="font-display text-lg font-bold text-ink">
                          {fmt.title}
                        </h3>
                        <p className="mt-1 text-sm text-ink-muted leading-relaxed">
                          {fmt.body}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── BENEFIS ─────────────────────────────────────────────────────── */}
      {benefits.length > 0 && (
        <section className="py-20 md:py-28 bg-ink text-cream-50 relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                'radial-gradient(circle at 25% 25%, rgba(22,163,74,0.4), transparent 50%), radial-gradient(circle at 75% 75%, rgba(196,49,120,0.3), transparent 50%)',
            }}
          />
          <div className="relative max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-brand-200 text-sm font-medium mb-4">
                  <Sparkles className="w-3.5 h-3.5" strokeWidth={2.4} />
                  Sa ou jwenn
                </span>
                <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight leading-tight">
                  Pa yon klas — yon kominote vivan
                </h2>
                <p className="mt-4 text-white/70 leading-relaxed">
                  Lè ou abonè, ou pa sèlman jwenn klas — ou jwenn aksè a yon
                  kominote, yon èrboris, ak yon rezo sipò ki la chak jou.
                </p>
              </div>

              <ul className="space-y-4">
                {benefits.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="grid place-items-center w-6 h-6 rounded-full bg-brand-500 text-white shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.4} />
                    </span>
                    <span className="text-white/90 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      {faqs.length > 0 && (
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
            <div className="max-w-2xl mb-10">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-4">
                Kesyon yo poze souvan
              </span>
              <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-ink leading-tight">
                Sa w ka bezwen konnen
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4 md:gap-5">
              {faqs.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl bg-white border border-slate-200/70 p-5 md:p-6 hover:border-brand-300 transition-colors"
                >
                  <summary className="flex items-start gap-3 cursor-pointer list-none">
                    <span className="grid place-items-center w-7 h-7 rounded-lg bg-brand-100 text-brand-700 shrink-0 mt-0.5">
                      <span className="font-display font-bold text-sm">+</span>
                    </span>
                    <span className="font-semibold text-ink">{item.q}</span>
                  </summary>
                  <p className="mt-3 pl-10 text-sm text-ink-muted leading-relaxed">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
          <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-brand-50 via-white to-accent/10 border border-brand-100 px-6 py-14 md:px-14 md:py-20 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-brand-700 text-sm font-medium mb-5 shadow-sm">
              <GraduationCap className="w-3.5 h-3.5" strokeWidth={2.4} />
              Kòmanse jodi a
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-ink leading-tight max-w-3xl mx-auto">
              {config?.cta_title ??
                'Premye klas la ka chanje fason ou wè sante w'}
            </h2>
            <p className="mt-5 max-w-2xl mx-auto text-ink-muted text-base md:text-lg leading-relaxed">
              {config?.cta_subtitle ??
                'Chwazi yon plan, jwenn aksè a tout klas yo, epi konekte ak yon èrboris kounye a. Pa gen angajman long — ou ka anile nenpòt lè.'}
            </p>
            <div className="mt-8 flex flex-wrap justify-center items-center gap-3">
              <Link
                href="/#pri"
                className="inline-flex items-center gap-2 bg-brand-gradient hover:brightness-110 text-white px-7 py-3.5 rounded-full font-medium transition shadow-md"
              >
                Wè plan yo
                <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
              </Link>
              <Link
                href="/kontak"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-medium text-ink hover:text-brand-700 border border-slate-200 hover:border-brand-300 transition"
              >
                Pale ak yon konseye
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl md:text-3xl font-bold text-ink">
        {value}
      </div>
      <div className="text-xs text-ink-muted">{label}</div>
    </div>
  );
}
