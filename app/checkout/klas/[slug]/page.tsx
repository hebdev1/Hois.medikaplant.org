import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  Lock,
} from 'lucide-react';
import PromoteHeader from '@/components/ui/promote-header';
import Footer from '@/components/ui/footer';
import { createClient } from '@/lib/supabase/server';
import CourseCheckoutForm from './checkout-form';

export const dynamic = 'force-dynamic';

type Course = {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover_image_url: string | null;
  price_cents: number;
  seat_capacity: number | null;
  instructor_name: string;
  instructor_role: string | null;
  duration_text: string | null;
  active: boolean;
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  return { title: `Achte klas · ${params.slug}` };
}

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function CourseCheckoutPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const { data: courseRaw } = await sb
    .from('courses')
    .select(
      'id, slug, title, description, cover_image_url, price_cents, seat_capacity, instructor_name, instructor_role, duration_text, active'
    )
    .eq('slug', params.slug)
    .maybeSingle();
  const course = courseRaw as Course | null;
  if (!course || !course.active) notFound();

  // Course must actually be for sale here. NULL/0 price = subscription-only.
  if (!course.price_cents || course.price_cents <= 0) {
    redirect(`/klas/${course.slug}`);
  }

  // If user already bought + enrolled, route them straight to the dashboard.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: existing } = await sb
      .from('course_enrollments')
      .select('id')
      .eq('course_id', course.id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (existing) {
      redirect(`/klas/${course.slug}?already_owned=1`);
    }
  }

  // Capacity / seats available check happens server-side again in the
  // action — this is just the visual hint for the form header.
  const [{ count: seatsTaken = 0 }] = (await Promise.all([
    sb
      .from('course_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', course.id),
  ])) as Array<{ count: number | null }>;
  const seatsLeft =
    course.seat_capacity !== null
      ? Math.max(0, course.seat_capacity - (seatsTaken ?? 0))
      : null;
  const isFull = seatsLeft === 0;

  return (
    <main className="min-h-screen bg-cream-50">
      <PromoteHeader />

      <section className="max-w-[1200px] mx-auto px-4 md:px-12 lg:px-20 py-10 md:py-16">
        <Link
          href={`/klas/${course.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-earth-700 hover:text-brand-700 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.2} />
          Tounen nan detay klas la
        </Link>

        <div className="grid lg:grid-cols-[1fr_420px] gap-8 lg:gap-12 items-start">
          {/* ── Order summary ─────────────────────────────────────────── */}
          <aside className="lg:order-2 rounded-2xl bg-white border border-cream-200 shadow-card overflow-hidden">
            <div className="relative aspect-video bg-cream-100">
              {course.cover_image_url ? (
                <Image
                  src={course.cover_image_url}
                  alt={course.title}
                  fill
                  sizes="(min-width: 1024px) 420px, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-earth-500">
                  <GraduationCap className="w-12 h-12" strokeWidth={1.5} />
                </div>
              )}
            </div>
            <div className="p-5 md:p-6 space-y-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-earth-600 mb-1">
                  Sa w ap achte
                </div>
                <h2 className="font-display text-lg font-bold text-ink leading-tight">
                  {course.title}
                </h2>
                <p className="text-xs text-earth-600 mt-1">
                  {course.instructor_name}
                  {course.instructor_role && ` · ${course.instructor_role}`}
                </p>
              </div>

              <div className="flex items-baseline justify-between gap-3 pt-3 border-t border-cream-200">
                <span className="text-sm font-semibold text-earth-700">
                  Total
                </span>
                <span className="font-display text-3xl font-bold text-ink">
                  {dollars(course.price_cents)}
                </span>
              </div>

              <ul className="space-y-1.5 text-[11px] text-earth-700 border-t border-cream-200 pt-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2
                    className="w-3.5 h-3.5 text-forest-700 mt-0.5 shrink-0"
                    strokeWidth={2.4}
                  />
                  Aksè lifetime ak resous yo
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2
                    className="w-3.5 h-3.5 text-forest-700 mt-0.5 shrink-0"
                    strokeWidth={2.4}
                  />
                  Sètifika ofisyèl nan fen klas la
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2
                    className="w-3.5 h-3.5 text-forest-700 mt-0.5 shrink-0"
                    strokeWidth={2.4}
                  />
                  Pa bezwen abònman — yon achte sèlman
                </li>
              </ul>

              {seatsLeft !== null && (
                <div
                  className={
                    isFull
                      ? 'rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-[11px] text-rose-800'
                      : seatsLeft <= 5
                        ? 'rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-900 font-semibold'
                        : 'rounded-xl bg-forest-50 border border-forest-200 px-3 py-2 text-[11px] text-forest-800'
                  }
                >
                  {isFull
                    ? `Tout ${course.seat_capacity} plas yo deja okipe — pa ka achte ankò.`
                    : `${seatsLeft} sou ${course.seat_capacity} plas ki rete`}
                </div>
              )}
            </div>
          </aside>

          {/* ── Checkout form ─────────────────────────────────────────── */}
          <div className="lg:order-1">
            <header className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold mb-3">
                <Lock className="w-3 h-3" strokeWidth={2.4} />
                Achte yon klas
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink leading-tight">
                Peman pou klas <em className="text-brand-700 not-italic">{course.title}</em>
              </h1>
              <p className="mt-3 text-ink-muted leading-relaxed">
                Pa bezwen achte yon plan abònman — yon sèl achte ba w aksè total
                a klas sa a pou tout tan.
              </p>
            </header>

            {isFull ? (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 px-5 py-6 text-rose-900">
                <h2 className="font-display text-lg font-bold mb-1">
                  Klas la deja konplè
                </h2>
                <p className="text-sm">
                  Tout {course.seat_capacity} plas yo okipe. Tanpri tounen pita
                  oswa chwazi yon lòt klas.
                </p>
              </div>
            ) : (
              <CourseCheckoutForm
                slug={course.slug}
                priceCents={course.price_cents}
                isAuthenticated={!!user}
              />
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
