import Link from 'next/link';
import { GraduationCap, PlayCircle, Video, Inbox, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import Topbar from '@/components/dashboard/topbar';

export const metadata = { title: 'Kou mwen yo · MedikaPlant' };
export const dynamic = 'force-dynamic';

const PLAN_LABEL: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

type CourseLite = {
  slug: string;
  title: string;
  cover_image_url: string | null;
  format: string;
  instructor_name: string | null;
};

export default async function MyCoursesPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const [profileResult, enrollmentsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('plan, full_name, email, avatar_url')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('course_enrollments')
      .select('enrolled_at, courses(slug, title, cover_image_url, format, instructor_name)')
      .eq('user_id', user.id)
      .order('enrolled_at', { ascending: false }),
  ]);

  const profile = profileResult.data as {
    plan: 'basic' | 'premium' | 'vip';
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;

  // supabase-js types a to-one embed as an array, but returns a single
  // object at runtime — cast through unknown.
  const rows = (enrollmentsResult.data ?? []) as unknown as Array<{
    enrolled_at: string;
    courses: CourseLite | null;
  }>;
  const courses = rows.map((r) => r.courses).filter(Boolean) as CourseLite[];

  const userName = profile?.full_name || profile?.email.split('@')[0] || 'Manm';
  const shortName = userName.split(' ')[0];

  return (
    <>
      <Topbar
        userName={shortName}
        userCondition={`${PLAN_LABEL[profile?.plan ?? 'basic']} · Kou`}
        userId={user.id}
        userPlan={profile?.plan ?? 'basic'}
        avatarUrl={profile?.avatar_url ?? null}
      />

      <div className="p-5 md:p-8 lg:p-10 max-w-[1280px] mx-auto grid gap-5 md:gap-6">
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-semibold mb-3">
            <GraduationCap className="w-3.5 h-3.5" strokeWidth={2.2} />
            Kou mwen yo
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Kontinye aprann
          </h1>
          <p className="mt-2 text-sm text-earth-600 max-w-2xl">
            Kou ou enskri yo. Klike sou youn pou gade videyo yo oswa antre nan
            sesyon Zoom an dirèk la.
          </p>
        </header>

        {courses.length === 0 ? (
          <div className="rounded-2xl bg-cream-50 border border-dashed border-cream-300 p-10 text-center">
            <Inbox className="w-10 h-10 mx-auto text-earth-400 mb-3" strokeWidth={1.6} />
            <p className="text-sm text-earth-700 font-medium">
              Ou poko enskri nan okenn kou.
            </p>
            <Link
              href="/klas"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-forest-700 hover:bg-forest-800 text-cream-50 text-sm font-semibold transition"
            >
              Dekouvri kou yo
              <ChevronRight className="w-4 h-4" strokeWidth={2.4} />
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {courses.map((c) => (
              <Link
                key={c.slug}
                href={`/dashboard/kou/${c.slug}`}
                className="group bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-card hover:shadow-cardHover transition"
              >
                <div className="relative aspect-video bg-forest-100">
                  {c.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.cover_image_url}
                      alt={c.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-forest-400">
                      <GraduationCap className="w-10 h-10" strokeWidth={1.5} />
                    </div>
                  )}
                  <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 text-forest-800 text-[10px] font-bold uppercase tracking-wider">
                    {c.format === 'video' ? (
                      <>
                        <PlayCircle className="w-3 h-3" strokeWidth={2.4} /> Videyo
                      </>
                    ) : (
                      <>
                        <Video className="w-3 h-3" strokeWidth={2.4} /> Zoom
                      </>
                    )}
                  </span>
                </div>
                <div className="p-4">
                  <h2 className="font-display font-bold text-ink leading-snug line-clamp-2 group-hover:text-forest-700 transition">
                    {c.title}
                  </h2>
                  {c.instructor_name && (
                    <p className="text-xs text-earth-600 mt-1">
                      {c.instructor_name}
                    </p>
                  )}
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-forest-700">
                    Kontinye
                    <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.4} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
