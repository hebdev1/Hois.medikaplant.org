import Link from 'next/link';
import {
  MessagesSquare,
  Plus,
  Eye,
  MessageCircle,
  Pin,
  Lock,
  Search,
  Inbox,
  Sparkles,
  Users as UsersIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Topbar from '@/components/dashboard/topbar';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';

export const metadata = { title: 'Fowòm · MedikaPlant' };
export const dynamic = 'force-dynamic';

type Topic = Database['public']['Tables']['forum_topics']['Row'];
type Category = Database['public']['Tables']['forum_categories']['Row'];
type Profile = {
  id: string;
  full_name: string | null;
  email: string;
};

const MOIS = [
  'Janvye', 'Fevriye', 'Mas', 'Avril', 'Me', 'Jen',
  'Jiyè', 'Out', 'Septanm', 'Oktòb', 'Novanm', 'Desanm',
];

function relativeLabel(iso: string | null | undefined): string {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'kounye a';
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} è`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} jou`;
  if (days < 30) return `${Math.floor(days / 7)} sem`;
  if (days < 365) return `${Math.floor(days / 30)} mwa`;
  const d = new Date(iso);
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

export default async function ForumIndexPage({
  searchParams,
}: {
  searchParams: { cat?: string; q?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [categoriesResult, topicsResult, profileResult] = await Promise.all([
    supabase
      .from('forum_categories')
      .select('*')
      .order('display_order'),
    supabase
      .from('forum_topics')
      .select('*')
      .order('pinned', { ascending: false })
      .order('last_reply_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(80),
    supabase
      .from('profiles')
      .select('full_name, email, plan')
      .eq('id', user.id)
      .maybeSingle(),
  ]);

  const categories = (categoriesResult.data ?? []) as Category[];
  const topicsAll = (topicsResult.data ?? []) as Topic[];
  const viewer = profileResult.data as {
    full_name: string | null;
    email: string;
    plan: string;
  } | null;

  // Resolve author + last-reply-by profiles in one query
  const userIds = new Set<string>();
  for (const t of topicsAll) {
    if (t.user_id) userIds.add(t.user_id);
    if (t.last_reply_by) userIds.add(t.last_reply_by);
  }
  const profilesById = new Map<string, Profile>();
  if (userIds.size > 0) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', Array.from(userIds));
    for (const p of (profs ?? []) as Profile[]) {
      profilesById.set(p.id, p);
    }
  }
  const categoriesById = new Map(categories.map((c) => [c.id, c]));

  // Filters
  const catFilter = searchParams.cat;
  const qFilter = searchParams.q?.toLowerCase().trim();

  let topics = topicsAll;
  if (catFilter && catFilter !== 'all') {
    const cat = categories.find((c) => c.slug === catFilter);
    if (cat) topics = topics.filter((t) => t.category_id === cat.id);
  }
  if (qFilter) {
    topics = topics.filter(
      (t) =>
        t.title.toLowerCase().includes(qFilter) ||
        t.body.toLowerCase().includes(qFilter)
    );
  }

  // Stats over the whole forum (not filtered)
  const stats = {
    topics: topicsAll.length,
    replies: topicsAll.reduce((s, t) => s + (t.reply_count ?? 0), 0),
    members: new Set(topicsAll.map((t) => t.user_id)).size,
  };

  const shortName =
    viewer?.full_name?.split(' ')[0] ?? viewer?.email?.split('@')[0] ?? 'Manm';

  return (
    <>
      <Topbar userName={shortName} userCondition="Fowòm kominote" />
      <div className="p-5 md:p-8 lg:p-10 max-w-[1120px] mx-auto grid gap-5 md:gap-6">
        {/* Header */}
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-semibold mb-3">
            <MessagesSquare className="w-3.5 h-3.5" strokeWidth={2.2} />
            Fowòm kominote
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
                Echanj ant{' '}
                <em className="text-forest-600 not-italic font-bold">manm yo</em>
              </h1>
              <p className="mt-2 text-sm text-earth-600 max-w-2xl leading-relaxed">
                Yon espas ki akeyan ak san jijman kote w ka pataje kesyon, eksperyans, ak konsèy ak lòt manm HOÏS yo.
                Nou ankouraje respè, koutwazi, ak sipò youn pou lòt nan tout entèraksyon..
              </p>
            </div>
            <Link
              href="/dashboard/forum/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-xl transition shadow-plant"
            >
              <Plus className="w-4 h-4" strokeWidth={2.4} />
              Nouvo sijè
            </Link>
          </div>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-3">
          <StatCard
            icon={MessagesSquare}
            label="Sijè"
            value={`${stats.topics}`}
            tone="bg-forest-100 text-forest-700"
          />
          <StatCard
            icon={MessageCircle}
            label="Repons"
            value={`${stats.replies}`}
            tone="bg-amber-100 text-amber-700"
          />
          <StatCard
            icon={UsersIcon}
            label="Manm aktif"
            value={`${stats.members}`}
            tone="bg-teal-100 text-teal-700"
          />
        </section>

        {/* Category pills + search */}
        <form
          action="/dashboard/forum"
          className="flex flex-wrap items-center gap-2"
        >
          <CategoryPill
            href="/dashboard/forum"
            active={!catFilter || catFilter === 'all'}
            label="Tout"
            color="#3f7522"
            icon="✨"
          />
          {categories.map((c) => (
            <CategoryPill
              key={c.id}
              href={`/dashboard/forum?cat=${c.slug}`}
              active={catFilter === c.slug}
              label={c.name}
              color={c.color}
              icon={c.icon ?? '•'}
            />
          ))}
          <label className="relative flex-1 min-w-[200px] sm:max-w-md ml-auto">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-500"
              strokeWidth={2}
            />
            <input
              type="search"
              name="q"
              defaultValue={searchParams.q ?? ''}
              placeholder="Chèche nan sijè…"
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
            />
            {catFilter && catFilter !== 'all' && (
              <input type="hidden" name="cat" value={catFilter} />
            )}
          </label>
        </form>

        {/* Topics list */}
        <section className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
          {topics.length === 0 ? (
            <div className="p-12 text-center">
              <span className="grid place-items-center w-12 h-12 rounded-2xl bg-cream-100 text-earth-500 mx-auto mb-3">
                <Inbox className="w-5 h-5" strokeWidth={1.8} />
              </span>
              <div className="font-display text-lg font-bold text-ink">
                {qFilter || catFilter
                  ? 'Pa gen sijè ki matche.'
                  : 'Poko gen sijè.'}
              </div>
              <p className="text-sm text-earth-600 mt-1.5 max-w-md mx-auto">
                {qFilter || catFilter
                  ? 'Eseye yon lòt filtè oswa reset rechèch la.'
                  : 'Kòmanse premye konvèsasyon an — kominote a ap reponn!'}
              </p>
              {(qFilter || catFilter) && (
                <Link
                  href="/dashboard/forum"
                  className="inline-block mt-3 text-xs font-semibold text-forest-700 hover:text-forest-800"
                >
                  Reset →
                </Link>
              )}
              {!qFilter && !catFilter && (
                <Link
                  href="/dashboard/forum/new"
                  className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 text-sm font-bold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-lg transition"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.4} />
                  Louvri yon nouvo sijè
                </Link>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-cream-100">
              {topics.map((t) => {
                const author = profilesById.get(t.user_id);
                const lastReplier = t.last_reply_by
                  ? profilesById.get(t.last_reply_by)
                  : null;
                const category = t.category_id
                  ? categoriesById.get(t.category_id)
                  : null;
                const authorName =
                  author?.full_name?.split(' ')[0] ??
                  author?.email?.split('@')[0] ??
                  'Manm';
                const initials = (
                  author?.full_name?.[0] ??
                  author?.email?.[0] ??
                  'M'
                ).toUpperCase();
                return (
                  <li key={t.id}>
                    <Link
                      href={`/dashboard/forum/${t.slug}`}
                      className="block px-4 md:px-5 py-4 hover:bg-cream-50/60 transition relative"
                    >
                      {/* Pinned indicator stripe on the left */}
                      {t.pinned && (
                        <span
                          aria-hidden
                          className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gold-400"
                        />
                      )}
                      <div className="flex items-start gap-3">
                        <span
                          className="grid place-items-center w-10 h-10 rounded-full bg-forest-100 text-forest-700 font-display font-bold text-sm shrink-0"
                          title={authorName}
                        >
                          {initials}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            {t.pinned && (
                              <Pin
                                className="w-3 h-3 text-gold-600"
                                strokeWidth={2.4}
                              />
                            )}
                            {t.locked && (
                              <Lock
                                className="w-3 h-3 text-rose-600"
                                strokeWidth={2.4}
                              />
                            )}
                            {category && (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border"
                                style={{
                                  background: `${category.color}15`,
                                  color: category.color,
                                  borderColor: `${category.color}33`,
                                }}
                              >
                                {category.icon && (
                                  <span aria-hidden>{category.icon}</span>
                                )}
                                {category.name}
                              </span>
                            )}
                          </div>
                          <h2 className="font-display text-base md:text-lg font-bold text-ink leading-tight line-clamp-1">
                            {t.title}
                          </h2>
                          <p className="text-xs text-earth-600 mt-1 line-clamp-2 leading-relaxed">
                            {t.body}
                          </p>
                          <div className="mt-2 flex items-center gap-3 flex-wrap text-[11px] text-earth-500">
                            <span>
                              pa{' '}
                              <span className="font-semibold text-earth-700">
                                {authorName}
                              </span>
                            </span>
                            <span>·</span>
                            <span>{relativeLabel(t.created_at)} pase</span>
                            {t.last_reply_at && lastReplier && (
                              <>
                                <span>·</span>
                                <span>
                                  Dènye repons{' '}
                                  <span className="font-semibold text-earth-700">
                                    {lastReplier.full_name?.split(' ')[0] ??
                                      lastReplier.email?.split('@')[0]}
                                  </span>{' '}
                                  {relativeLabel(t.last_reply_at)} pase
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 text-[11px] text-earth-600 shrink-0">
                          <span className="inline-flex items-center gap-1">
                            <Eye className="w-3 h-3" strokeWidth={2.4} />
                            {t.view_count}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" strokeWidth={2.4} />
                            {t.reply_count}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function CategoryPill({
  href,
  active,
  label,
  color,
  icon,
}: {
  href: string;
  active: boolean;
  label: string;
  color: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition border',
        active
          ? 'shadow-sm'
          : 'bg-white text-earth-700 border-cream-200 hover:border-forest-300 hover:text-forest-700'
      )}
      style={
        active
          ? {
              background: color,
              color: '#fefcf6',
              borderColor: color,
            }
          : undefined
      }
    >
      <span aria-hidden>{icon}</span>
      {label}
    </Link>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof MessagesSquare;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-4 shadow-card flex items-center gap-3">
      <span className={cn('grid place-items-center w-10 h-10 rounded-xl', tone)}>
        <Icon className="w-4 h-4" strokeWidth={2.2} />
      </span>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-earth-600 font-semibold">
          {label}
        </div>
        <div className="text-xl font-bold text-ink leading-tight">{value}</div>
      </div>
    </div>
  );
}
