import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Award,
  GraduationCap,
  FolderKanban,
  BookOpen,
  Users,
  Trophy,
  Flame,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import Topbar from '@/components/dashboard/topbar';
import BadgesPanel, {
  type DashboardBadge,
} from '@/components/dashboard/badges-panel';
import { asBadgeIcon } from '@/lib/badges/metric-helpers';
import {
  ProfileHeader,
  LevelCard,
  StatTile,
  SectionCard,
  dateHT,
} from './profile-ui';

export const metadata = { title: 'Pwofil VIP · MedikaPlant' };
export const dynamic = 'force-dynamic';

type BadgeRow = {
  id: string;
  name: string;
  sub: string;
  icon: string;
  display_order: number;
};
type UserBadgeRow = {
  badge_id: string;
  unlocked: boolean;
  just_unlocked: boolean;
  progress: number;
  unlocked_at: string | null;
};

export default async function VipProfilePage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login?redirect=/dashboard/vip/pwofil');

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select(
      'full_name, first_name, last_name, email, plan, avatar_url, bio, city, country, created_at'
    )
    .eq('id', user.id)
    .maybeSingle();
  const profile = profileRaw as {
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string;
    plan: 'basic' | 'premium' | 'vip';
    avatar_url: string | null;
    bio: string | null;
    city: string | null;
    country: string | null;
    created_at: string;
  } | null;

  // Melis-only — non-Melis members get the upgrade state on the VIP hub.
  if ((profile?.plan ?? 'basic') !== 'vip') redirect('/dashboard/vip');

  const name =
    profile?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    profile?.email.split('@')[0] ||
    'Manm';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const [
    levelRes,
    levelNameRes,
    streakRes,
    badgesRes,
    userBadgesRes,
    enrollRes,
    progressRes,
    programsRes,
    libraryRes,
    topicsRes,
    repliesRes,
    suggestionsRes,
  ] = await Promise.all([
    supabase.rpc('user_level', { uid: user.id }),
    supabase.rpc('user_level_name', { uid: user.id }),
    supabase.rpc('user_streak', { uid: user.id }),
    supabase
      .from('badges')
      .select('id, name, sub, icon, display_order')
      .eq('active', true)
      .order('display_order', { ascending: true }),
    supabase
      .from('user_badges')
      .select('badge_id, unlocked, just_unlocked, progress, unlocked_at')
      .eq('user_id', user.id),
    supabase
      .from('course_enrollments')
      .select('courses(id, slug, title)')
      .eq('user_id', user.id),
    sb
      .from('course_module_progress')
      .select('course_id, module_id, completed_at')
      .eq('user_id', user.id),
    sb
      .from('user_programs')
      .select('program_id, is_active, finished_at, started_at, programs(name)')
      .eq('user_id', user.id),
    sb
      .from('resource_progress')
      .select('completed_at, resources(title, type)')
      .eq('user_id', user.id)
      .eq('completed', true)
      .order('completed_at', { ascending: false })
      .limit(8),
    supabase
      .from('forum_topics')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('forum_replies')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    sb
      .from('user_suggestions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ]);

  const level = (levelRes.data as number | null) ?? 1;
  const levelName = (levelNameRes.data as string | null) ?? 'Nouvo Manm';
  const streak = (streakRes.data as number | null) ?? 0;

  const badges = (badgesRes.data ?? []) as BadgeRow[];
  const userBadges = (userBadgesRes.data ?? []) as UserBadgeRow[];
  const ubMap = new Map(userBadges.map((u) => [u.badge_id, u]));
  const badgeById = new Map(badges.map((b) => [b.id, b]));

  const dashBadges: DashboardBadge[] = badges.map((b) => {
    const ub = ubMap.get(b.id);
    return {
      id: b.id,
      name: b.name,
      sub: b.sub,
      unlocked: !!ub?.unlocked,
      justUnlocked: ub?.just_unlocked ?? false,
      progress: ub?.progress ?? 0,
      icon: asBadgeIcon(b.icon),
    };
  });
  const unlockedCount = dashBadges.filter((b) => b.unlocked).length;
  const totalBadges = dashBadges.length;

  // Achievements timeline: unlocked badges newest-first.
  const achievements = userBadges
    .filter((u) => u.unlocked && u.unlocked_at)
    .sort((a, b) => (b.unlocked_at ?? '').localeCompare(a.unlocked_at ?? ''))
    .slice(0, 6)
    .map((u) => ({
      name: badgeById.get(u.badge_id)?.name ?? 'Badj',
      icon: asBadgeIcon(badgeById.get(u.badge_id)?.icon ?? 'star'),
      at: u.unlocked_at as string,
    }));

  // Certificates = courses whose every module is complete (same math as /aprann/setifika).
  const enrolled: { id: string; slug: string; title: string }[] = [];
  {
    const seen = new Set<string>();
    for (const r of (enrollRes.data ?? []) as unknown as Array<{
      courses: { id: string; slug: string; title: string } | null;
    }>) {
      if (r.courses && !seen.has(r.courses.id)) {
        seen.add(r.courses.id);
        enrolled.push(r.courses);
      }
    }
  }
  const courseIds = enrolled.map((c) => c.id);
  const doneByCourse = new Map<string, Set<string>>();
  const earnedAt = new Map<string, string>();
  for (const p of (progressRes.data ?? []) as Array<{
    course_id: string;
    module_id: string;
    completed_at: string | null;
  }>) {
    const set = doneByCourse.get(p.course_id) ?? new Set<string>();
    set.add(p.module_id);
    doneByCourse.set(p.course_id, set);
    if (p.completed_at) {
      const prev = earnedAt.get(p.course_id);
      if (!prev || p.completed_at > prev) earnedAt.set(p.course_id, p.completed_at);
    }
  }
  const totalByCourse = new Map<string, number>();
  if (courseIds.length > 0) {
    const { data: mods } = await supabase
      .from('course_modules')
      .select('id, course_id')
      .in('course_id', courseIds);
    for (const m of (mods ?? []) as Array<{ id: string; course_id: string }>) {
      totalByCourse.set(m.course_id, (totalByCourse.get(m.course_id) ?? 0) + 1);
    }
  }
  const certificates = enrolled
    .filter((c) => {
      const total = totalByCourse.get(c.id) ?? 0;
      const done = doneByCourse.get(c.id)?.size ?? 0;
      return total > 0 && done >= total;
    })
    .map((c) => ({ ...c, earnedAt: earnedAt.get(c.id) ?? null }));

  // Protocols
  const programs = (programsRes.data ?? []) as Array<{
    program_id: string;
    is_active: boolean;
    finished_at: string | null;
    started_at: string | null;
    programs: { name: string } | null;
  }>;
  const protoCompleted = programs.filter((p) => p.finished_at).length;
  const protoActive = programs.filter((p) => p.is_active).length;
  const protoStarted = programs.length;
  const protoRate =
    protoStarted > 0 ? Math.round((protoCompleted / protoStarted) * 100) : 0;
  const currentProgram =
    programs.find((p) => p.is_active)?.programs?.name ?? null;

  // Library
  const library = (libraryRes.data ?? []) as Array<{
    completed_at: string | null;
    resources: { title: string; type: string } | null;
  }>;

  const forumTopics = topicsRes.count ?? 0;
  const forumReplies = repliesRes.count ?? 0;
  const suggestions = suggestionsRes.count ?? 0;
  const contributions = forumTopics + forumReplies + suggestions;

  return (
    <>
      <Topbar
        userName={name.split(' ')[0]}
        userCondition={`Hoïs Melis · Niv. ${level}`}
        userId={user.id}
        userPlan="vip"
        avatarUrl={profile?.avatar_url ?? null}
      />

      <div className="p-5 md:p-8 lg:p-10 max-w-[1100px] mx-auto grid gap-5 md:gap-6">
        <ProfileHeader
          name={name}
          avatarUrl={profile?.avatar_url ?? null}
          memberSince={profile?.created_at ?? null}
          city={profile?.city}
          country={profile?.country}
          bio={profile?.bio}
          levelName={levelName}
          showBackToWall
        />

        <LevelCard
          level={level}
          levelName={levelName}
          streak={streak}
          unlockedBadges={unlockedCount}
          totalBadges={totalBadges}
        />

        {/* Learning stats */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          <StatTile icon={Award} label="Badj debloke" value={unlockedCount} />
          <StatTile icon={GraduationCap} label="Kou fini (sètifika)" value={certificates.length} />
          <StatTile icon={FolderKanban} label="Pwotokòl fini" value={protoCompleted} />
          <StatTile icon={Users} label="Kontribisyon" value={contributions} />
          <StatTile icon={Flame} label="Jou seri" value={streak} />
        </section>

        {/* Badges */}
        <BadgesPanel badges={dashBadges} level={level} levelName={levelName} />

        {/* Achievements timeline */}
        {achievements.length > 0 && (
          <SectionCard title="Pakou akonplisman" icon={Trophy}>
            <ol className="relative border-l-2 border-cream-200 ml-2 space-y-4">
              {achievements.map((a, i) => (
                <li key={i} className="pl-4 relative">
                  <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-gold-400 border-2 border-white" />
                  <div className="text-sm font-semibold text-ink">{a.name}</div>
                  <div className="text-[11px] text-earth-500">
                    Debloke {dateHT(a.at)}
                  </div>
                </li>
              ))}
            </ol>
          </SectionCard>
        )}

        {/* Certificates */}
        <SectionCard
          title="Sètifika"
          icon={Award}
          action={
            <Link
              href="/aprann/setifika"
              className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700 hover:text-forest-800 transition"
            >
              Wè tout <ArrowRight className="w-3 h-3" strokeWidth={2.4} />
            </Link>
          }
        >
          {certificates.length === 0 ? (
            <p className="text-sm text-earth-500">
              Ou poko fini okenn kou nèt. Lè w konplete tout modil yon kou, sètifika
              w ap parèt isit la.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {certificates.map((c) => (
                <Link
                  key={c.id}
                  href={`/setifika/${c.slug}`}
                  className="group bg-cream-50 border border-cream-200 rounded-xl p-4 hover:border-gold-300 transition flex items-center gap-3"
                >
                  <span className="grid place-items-center w-11 h-11 rounded-xl bg-gold-100 text-gold-700 shrink-0">
                    <Award className="w-5 h-5" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-ink leading-snug line-clamp-2 group-hover:text-forest-700 transition">
                      {c.title}
                    </h3>
                    {c.earnedAt && (
                      <p className="text-[11px] text-earth-500 mt-0.5">
                        Fini {dateHT(c.earnedAt)}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-earth-400 shrink-0 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.2} />
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Protocol history */}
        <SectionCard title="Istwa pwotokòl" icon={FolderKanban}>
          {protoStarted === 0 ? (
            <p className="text-sm text-earth-500">
              Ou poko kòmanse okenn pwotokòl.{' '}
              <Link href="/dashboard/programs" className="text-forest-700 font-semibold hover:underline">
                Dekouvri pwotokòl yo
              </Link>
              .
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <MiniStat value={protoCompleted} label="Fini" />
                <MiniStat value={protoActive} label="Aktif" />
                <MiniStat value={`${protoRate}%`} label="To reyisit" />
              </div>
              {currentProgram && (
                <p className="text-[13px] text-earth-700 inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-gold-600" strokeWidth={2.2} />
                  Pwotokòl aktyèl: <span className="font-semibold text-ink">{currentProgram}</span>
                </p>
              )}
            </>
          )}
        </SectionCard>

        {/* Library */}
        {library.length > 0 && (
          <SectionCard
            title="Bibliyotèk"
            icon={BookOpen}
            action={
              <Link href="/dashboard/resources" className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700 hover:text-forest-800 transition">
                Wè tout <ArrowRight className="w-3 h-3" strokeWidth={2.4} />
              </Link>
            }
          >
            <ul className="space-y-2">
              {library.map((r, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-forest-600 shrink-0" strokeWidth={2.2} />
                  <span className="text-ink flex-1 min-w-0 truncate">
                    {r.resources?.title ?? 'Resous'}
                  </span>
                  {r.completed_at && (
                    <span className="text-[11px] text-earth-500 shrink-0">
                      {dateHT(r.completed_at)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {/* Community contribution */}
        <SectionCard title="Kontribisyon kominote" icon={Users}>
          <div className="grid grid-cols-3 gap-3">
            <MiniStat value={forumTopics} label="Sijè fowòm" />
            <MiniStat value={forumReplies} label="Repons fowòm" />
            <MiniStat value={suggestions} label="Sijesyon" />
          </div>
        </SectionCard>
      </div>
    </>
  );
}

function MiniStat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-xl bg-cream-50 border border-cream-200 p-3 text-center">
      <div className="font-display text-2xl font-bold text-ink leading-none">
        {value}
      </div>
      <div className="text-[11px] text-earth-600 mt-1 leading-tight">{label}</div>
    </div>
  );
}
