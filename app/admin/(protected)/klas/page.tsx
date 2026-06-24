import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  GraduationCap,
  PlusCircle,
  FolderTree,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Star,
  StarOff,
  ExternalLink,
  Video,
  Users as UsersIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasCapability, type AdminRole } from '../admin-nav-config';
import KlasTabBar from './tab-bar';
import CategoryEditor from './category-editor';
import PageConfigEditor from './page-config-editor';
import CourseRowActions from './course-row-actions';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Admin · Klas' };
export const dynamic = 'force-dynamic';

type SearchParams = { tab?: 'courses' | 'categories' | 'config' };

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  level: string;
  format: string;
  plan_required: string;
  category_id: string | null;
  featured: boolean;
  active: boolean;
  display_order: number;
  price_cents: number | null;
  seat_capacity: number | null;
  rating: number;
  cover_image_url: string | null;
  instructor_name: string;
  student_count_text: string | null;
};

type CategoryRow = {
  id: string;
  slug: string;
  title: string;
  body: string;
  icon: string;
  tone: string;
  display_order: number;
  active: boolean;
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
  faqs: unknown;
  formats: unknown;
  cta_title: string | null;
  cta_subtitle: string | null;
};

const FORMAT_LABEL: Record<string, string> = {
  video: 'Videyo',
  live_zoom: 'Zoom direkt',
  hybrid: 'Hybrid',
};

const LEVEL_LABEL: Record<string, string> = {
  debutan: 'Debutan',
  entermedye: 'Entèmedyè',
  avanse: 'Avanse',
  tout_nivo: 'Tout nivo',
};

const PLAN_LABEL: Record<string, string> = {
  basic: 'Bazilik',
  premium: 'Sitwonèl',
  vip: 'Melis',
};

function dollars(cents: number | null): string {
  if (cents === null || cents === undefined) return 'Enkli nan plan';
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function AdminKlasPage({
  searchParams,
}: {
  searchParams: SearchParams;
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
  if (!hasCapability(adminRole, 'manage_courses')) {
    redirect('/admin');
  }

  const tab = searchParams.tab ?? 'courses';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const [coursesRes, categoriesRes, configRes, enrollmentsRes] = await Promise.all([
    sb
      .from('courses')
      .select(
        'id, slug, title, level, format, plan_required, category_id, featured, active, display_order, price_cents, seat_capacity, rating, cover_image_url, instructor_name, student_count_text'
      )
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false }),
    sb
      .from('course_categories')
      .select(
        'id, slug, title, body, icon, tone, display_order, active'
      )
      .order('display_order', { ascending: true }),
    sb.from('klas_page_config').select('*').eq('id', 1).maybeSingle(),
    // Count enrollments per course so we can show "X / Y plas okipe"
    // chips inline. Aggregating in TS is fine here — counts are small.
    sb.from('course_enrollments').select('course_id'),
  ]);

  const courses = (coursesRes.data ?? []) as CourseRow[];
  const categories = (categoriesRes.data ?? []) as CategoryRow[];
  const config = (configRes.data ?? null) as PageConfigRow | null;
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const enrollmentCountByCourse = new Map<string, number>();
  for (const row of ((enrollmentsRes.data ?? []) as Array<{ course_id: string }>)) {
    enrollmentCountByCourse.set(
      row.course_id,
      (enrollmentCountByCourse.get(row.course_id) ?? 0) + 1
    );
  }

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1400px] mx-auto">
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
            <GraduationCap className="w-3.5 h-3.5" strokeWidth={2.2} />
            Admin · Klas
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Jere katalòg klas Hoïs Inivèsite
          </h1>
          <p className="mt-2 text-sm text-earth-600 max-w-2xl">
            Kreye/modifye kou, kategori, ak konfigirasyon paj /klas la nèt.
            Tout chanjman aplike imedyatman sou sit la.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/klas"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-earth-700 hover:text-ink border border-cream-200 rounded-lg transition"
          >
            <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.2} />
            Wè paj piblik la
          </Link>
          {tab === 'courses' && (
            <Link
              href="/admin/klas/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-lg transition"
            >
              <PlusCircle className="w-3.5 h-3.5" strokeWidth={2.2} />
              Nouvo kou
            </Link>
          )}
        </div>
      </header>

      <KlasTabBar
        active={tab}
        counts={{
          courses: courses.length,
          categories: categories.length,
        }}
      />

      {tab === 'courses' && (
        <CoursesTab
          courses={courses}
          categoryById={categoryById}
          enrollmentCountByCourse={enrollmentCountByCourse}
        />
      )}
      {tab === 'categories' && <CategoriesTab categories={categories} />}
      {tab === 'config' && <PageConfigEditor initial={config} />}
    </div>
  );
}

// ─── Courses tab ─────────────────────────────────────────────────────────────

function CoursesTab({
  courses,
  categoryById,
  enrollmentCountByCourse,
}: {
  courses: CourseRow[];
  categoryById: Map<string, CategoryRow>;
  enrollmentCountByCourse: Map<string, number>;
}) {
  if (courses.length === 0) {
    return (
      <div className="rounded-2xl border border-cream-200 bg-white p-8 text-center text-sm text-earth-600">
        Pa gen okenn klas pou kounye a.{' '}
        <Link href="/admin/klas/new" className="text-forest-700 font-semibold underline">
          Kreye premye kou a
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {courses.map((c) => {
        const cat = c.category_id ? categoryById.get(c.category_id) : null;
        return (
          <article
            key={c.id}
            className="grid sm:grid-cols-[120px_1fr_auto] gap-4 bg-white border border-cream-200 rounded-2xl p-3 hover:border-forest-200 transition"
          >
            <div className="relative aspect-[4/3] sm:aspect-square rounded-xl overflow-hidden bg-cream-100">
              {c.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.cover_image_url}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="grid place-items-center w-full h-full text-earth-500">
                  <GraduationCap className="w-8 h-8" strokeWidth={1.5} />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-start gap-2 flex-wrap mb-1">
                <Link
                  href={`/admin/klas/${c.id}`}
                  className="font-display text-base font-bold text-ink hover:text-forest-700 truncate"
                >
                  {c.title}
                </Link>
                {!c.active && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cream-200 text-earth-700">
                    Pa pibliye
                  </span>
                )}
                {c.featured && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold-100 text-gold-700">
                    Vedèt
                  </span>
                )}
              </div>
              <div className="text-xs text-earth-600 mb-2">
                {cat && (
                  <>
                    <span className="font-semibold">{cat.title}</span>
                    <span className="mx-1.5 opacity-50">·</span>
                  </>
                )}
                {c.instructor_name}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <Chip>{LEVEL_LABEL[c.level] ?? c.level}</Chip>
                <Chip icon={c.format === 'live_zoom' ? Video : undefined}>
                  {FORMAT_LABEL[c.format] ?? c.format}
                </Chip>
                <Chip>Plan {PLAN_LABEL[c.plan_required] ?? c.plan_required}</Chip>
                <Chip>{dollars(c.price_cents)}</Chip>
                {(() => {
                  const taken = enrollmentCountByCourse.get(c.id) ?? 0;
                  if (c.seat_capacity === null) {
                    return taken > 0 ? (
                      <Chip icon={UsersIcon}>{taken} enskri</Chip>
                    ) : null;
                  }
                  const full = taken >= c.seat_capacity;
                  return (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold',
                        full
                          ? 'bg-rose-100 text-rose-700'
                          : taken / c.seat_capacity > 0.8
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-forest-50 text-forest-800'
                      )}
                    >
                      <UsersIcon className="w-3 h-3" strokeWidth={2.2} />
                      {taken} / {c.seat_capacity} plas
                      {full ? ' (konplè)' : ''}
                    </span>
                  );
                })()}
                {c.student_count_text && (
                  <Chip icon={UsersIcon}>{c.student_count_text}</Chip>
                )}
                <Chip icon={Star}>{c.rating.toFixed(1)}</Chip>
              </div>
            </div>
            <CourseRowActions
              id={c.id}
              featured={c.featured}
              active={c.active}
            />
          </article>
        );
      })}
    </div>
  );
}

function Chip({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: typeof Star;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cream-100 text-earth-700 font-medium">
      {Icon && <Icon className="w-3 h-3" strokeWidth={2.2} />}
      {children}
    </span>
  );
}

// ─── Categories tab ──────────────────────────────────────────────────────────

function CategoriesTab({ categories }: { categories: CategoryRow[] }) {
  return (
    <div className="space-y-6">
      <CategoryEditor mode="create" />
      <div className="grid md:grid-cols-2 gap-3">
        {categories.map((c) => (
          <CategoryEditor key={c.id} mode="edit" initial={c} />
        ))}
      </div>
    </div>
  );
}
