import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  GraduationCap,
  PlayCircle,
  Inbox,
  ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

type CourseLite = {
  slug: string;
  title: string;
  cover_image_url: string | null;
  format: string;
  instructor_name: string | null;
};

export default async function AprannPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login?redirect=/aprann');

  const { data } = await supabase
    .from('course_enrollments')
    .select(
      'enrolled_at, courses(slug, title, cover_image_url, format, instructor_name)'
    )
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false });

  const rows = (data ?? []) as unknown as Array<{
    enrolled_at: string;
    courses: CourseLite | null;
  }>;
  const courses = rows.map((r) => r.courses).filter(Boolean) as CourseLite[];

  return (
    <div className="max-w-[900px] mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-semibold mb-3">
        <GraduationCap className="w-3.5 h-3.5" strokeWidth={2.2} />
        Kou mwen yo
      </div>
      <h1 className="font-display text-3xl font-bold text-ink tracking-tight">
        Kontinye aprann
      </h1>
      <p className="mt-2 text-sm text-earth-600">
        Tout kou ou achte yo — kontni ak pwogrè, nan yon sèl kote.
      </p>

      {courses.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-cream-300 bg-white px-5 py-12 text-center">
          <Inbox
            className="w-10 h-10 mx-auto text-earth-400 mb-3"
            strokeWidth={1.6}
          />
          <p className="text-sm text-earth-600">
            Ou poko achte okenn kou.
          </p>
          <Link
            href="/klas"
            className="mt-3 inline-flex items-center gap-1 text-forest-700 font-semibold underline"
          >
            Gade katalòg klas yo
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {courses.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/aprann/${c.slug}`}
                className="flex items-center gap-4 bg-white border border-cream-200 rounded-2xl p-3 hover:border-forest-300 transition"
              >
                <div className="relative w-24 aspect-[4/3] rounded-xl overflow-hidden bg-cream-100 shrink-0">
                  {c.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.cover_image_url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="grid place-items-center w-full h-full text-earth-400">
                      <GraduationCap className="w-7 h-7" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-ink truncate">
                    {c.title}
                  </div>
                  {c.instructor_name && (
                    <div className="text-xs text-earth-600 mt-0.5">
                      Avèk {c.instructor_name}
                    </div>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs text-forest-700 font-semibold mt-1">
                    <PlayCircle className="w-3.5 h-3.5" strokeWidth={2.2} />
                    Kontinye
                  </span>
                </div>
                <ChevronRight
                  className="w-5 h-5 text-earth-400 shrink-0"
                  strokeWidth={2.2}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
