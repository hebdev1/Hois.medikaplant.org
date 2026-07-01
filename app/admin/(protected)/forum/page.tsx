import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  MessagesSquare,
  Pin,
  Lock,
  Eye,
  MessageCircle,
  Search,
  Inbox,
  Users as UsersIcon,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';
import CategoriesManager from './categories-manager';
import TopicRowActions from './topic-row-actions';
import type { Database } from '@/types/database';
import { hasCapability, type AdminRole } from '../admin-nav-config';

export const metadata = { title: 'Admin · Fowòm' };
export const dynamic = 'force-dynamic';

type Topic = Database['public']['Tables']['forum_topics']['Row'];
type Category = Database['public']['Tables']['forum_categories']['Row'];
type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  role: 'user' | 'admin';
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
  const d = new Date(iso);
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

export default async function AdminForumPage({
  searchParams,
}: {
  searchParams: { cat?: string; status?: string; q?: string };
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
  if (!hasCapability(adminRole, 'moderate_forum')) {
    redirect('/admin');
  }

  const [topicsResult, categoriesResult] = await Promise.all([
    supabase
      .from('forum_topics')
      .select('*')
      .order('pinned', { ascending: false })
      .order('last_reply_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('forum_categories')
      .select('*')
      .order('display_order'),
  ]);

  const allTopics = (topicsResult.data ?? []) as Topic[];
  const categories = (categoriesResult.data ?? []) as Category[];

  // Profiles for the author column
  const userIds = Array.from(new Set(allTopics.map((t) => t.user_id)));
  const profilesById = new Map<string, Profile>();
  if (userIds.length > 0) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('id', userIds);
    for (const p of (profs ?? []) as Profile[]) {
      profilesById.set(p.id, p);
    }
  }
  const categoriesById = new Map(categories.map((c) => [c.id, c]));

  // Filters
  const catFilter = searchParams.cat;
  const statusFilter = searchParams.status;
  const qFilter = searchParams.q?.toLowerCase().trim();

  let topics = allTopics;
  if (catFilter && catFilter !== 'all') {
    const cat = categories.find((c) => c.slug === catFilter);
    if (cat) topics = topics.filter((t) => t.category_id === cat.id);
  }
  if (statusFilter === 'pinned') {
    topics = topics.filter((t) => t.pinned);
  } else if (statusFilter === 'locked') {
    topics = topics.filter((t) => t.locked);
  }
  if (qFilter) {
    topics = topics.filter(
      (t) =>
        t.title.toLowerCase().includes(qFilter) ||
        t.body.toLowerCase().includes(qFilter)
    );
  }

  const hasAnyFilter = Boolean(catFilter || statusFilter || qFilter);

  // Stats
  const stats = {
    topics: allTopics.length,
    replies: allTopics.reduce((s, t) => s + (t.reply_count ?? 0), 0),
    pinned: allTopics.filter((t) => t.pinned).length,
    locked: allTopics.filter((t) => t.locked).length,
    authors: new Set(allTopics.map((t) => t.user_id)).size,
  };

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1280px] mx-auto">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
          <ShieldAlert className="w-3.5 h-3.5" strokeWidth={2.2} />
          Admin · Fowòm
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Modere <em className="text-forest-600 not-italic font-bold">kominote a</em>
        </h1>
        <p className="mt-2 text-sm text-earth-600 max-w-2xl">
          Wè tout sijè ak repons manm yo, pin sa ki enpòtan, fèmen sa ki
          deye, oswa efase kontni ki pa apwopriye. Jere kategori yo pou
          ede manm yo òganize konvèsasyon yo.
        </p>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard
          icon={MessagesSquare}
          label="Sijè"
          value={stats.topics}
          tone="bg-forest-100 text-forest-700"
        />
        <StatCard
          icon={MessageCircle}
          label="Repons"
          value={stats.replies}
          tone="bg-amber-100 text-amber-700"
        />
        <StatCard
          icon={Pin}
          label="Pinned"
          value={stats.pinned}
          tone="bg-gold-100 text-gold-700"
        />
        <StatCard
          icon={Lock}
          label="Fèmen"
          value={stats.locked}
          tone="bg-rose-100 text-rose-700"
        />
        <StatCard
          icon={UsersIcon}
          label="Otè"
          value={stats.authors}
          tone="bg-teal-100 text-teal-700"
        />
      </section>

      {/* Categories management */}
      <div className="mb-6">
        <CategoriesManager categories={categories} />
      </div>

      {/* Filters */}
      <form
        action="/admin/forum"
        className="mb-5 flex flex-wrap items-center gap-2"
      >
        <label className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-500"
            strokeWidth={2}
          />
          <input
            type="search"
            name="q"
            defaultValue={searchParams.q ?? ''}
            placeholder="Chèche tit oswa kontni…"
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
          />
        </label>
        <select
          name="cat"
          defaultValue={searchParams.cat ?? ''}
          className="px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
        >
          <option value="">Tout kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.icon ? `${c.icon} ` : ''}
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={searchParams.status ?? ''}
          className="px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
        >
          <option value="">Tout estati</option>
          <option value="pinned">Pinned</option>
          <option value="locked">Fèmen</option>
        </select>
        <button
          type="submit"
          className="px-3 py-2 text-sm font-semibold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-lg transition"
        >
          Filtre
        </button>
        {hasAnyFilter && (
          <Link
            href="/admin/forum"
            className="text-xs font-semibold text-earth-700 hover:text-ink"
          >
            Reset
          </Link>
        )}
      </form>

      {/* Topics table */}
      <section className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
        {topics.length === 0 ? (
          <div className="p-12 text-center">
            <span className="grid place-items-center w-12 h-12 rounded-2xl bg-cream-100 text-earth-500 mx-auto mb-3">
              <Inbox className="w-5 h-5" strokeWidth={1.8} />
            </span>
            <div className="font-display text-base font-bold text-ink">
              {hasAnyFilter
                ? 'Pa gen sijè ki matche filtè a.'
                : 'Poko gen sijè nan fowòm nan.'}
            </div>
            {hasAnyFilter && (
              <Link
                href="/admin/forum"
                className="inline-block mt-3 text-xs font-semibold text-forest-700 hover:text-forest-800"
              >
                Reset →
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-cream-100">
            {topics.map((t) => {
              const author = profilesById.get(t.user_id);
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
                <li key={t.id} className="px-4 md:px-5 py-3.5 hover:bg-cream-50/60 transition relative">
                  {t.pinned && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gold-400"
                    />
                  )}
                  <div className="flex items-start gap-3">
                    <span className="grid place-items-center w-9 h-9 rounded-full bg-forest-100 text-forest-700 font-display font-bold text-sm shrink-0">
                      {initials}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        {t.pinned && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gold-100 text-gold-700 border border-gold-200">
                            <Pin className="w-2.5 h-2.5" strokeWidth={2.4} />
                            Pinned
                          </span>
                        )}
                        {t.locked && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                            <Lock className="w-2.5 h-2.5" strokeWidth={2.4} />
                            Fèmen
                          </span>
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
                      <Link
                        href={`/admin/forum/${t.slug}`}
                        className="font-display text-base font-bold text-ink hover:text-forest-700 transition leading-tight inline-block line-clamp-1"
                      >
                        {t.title}
                      </Link>
                      <p className="text-xs text-earth-600 mt-1 line-clamp-1">
                        {t.body}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 flex-wrap text-[11px] text-earth-500">
                        <span>
                          pa{' '}
                          <span className="font-semibold text-earth-700">
                            {authorName}
                          </span>
                          {author?.role === 'admin' && (
                            <span className="ml-1 inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1 py-0 rounded-sm bg-accent/10 text-accent">
                              Admin
                            </span>
                          )}
                        </span>
                        <span>·</span>
                        <span>{relativeLabel(t.created_at)} pase</span>
                        {t.last_reply_at && (
                          <>
                            <span>·</span>
                            <span>
                              dènye repons {relativeLabel(t.last_reply_at)} pase
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-3 text-[11px] text-earth-600">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="w-3 h-3" strokeWidth={2.4} />
                          {t.view_count}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" strokeWidth={2.4} />
                          {t.reply_count}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TopicRowActions
                          id={t.id}
                          pinned={t.pinned}
                          locked={t.locked}
                        />
                        <Link
                          href={`/admin/forum/${t.slug}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-forest-700 hover:text-forest-800"
                        >
                          Wè
                          <ChevronRight className="w-3 h-3" strokeWidth={2.4} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <footer className="mt-4 text-[11px] text-earth-500">
        {topics.length} sijè ki montre · {allTopics.length} an total
      </footer>
    </div>
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
  value: number;
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
