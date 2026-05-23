import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ChevronRight,
  Eye,
  MessageCircle,
  Pin,
  Lock,
  ShieldAlert,
  Calendar,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import TopicRowActions from '../topic-row-actions';
import ReplyRowActions from './reply-row-actions';
import AdminReplyComposer from './admin-reply-composer';
import type { Database } from '@/types/database';

export const metadata = { title: 'Admin · Sijè fowòm' };
export const dynamic = 'force-dynamic';

type Topic = Database['public']['Tables']['forum_topics']['Row'];
type Reply = Database['public']['Tables']['forum_replies']['Row'];
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

const TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
});

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()} · ${TIME_FORMAT.format(d)}`;
}

export default async function AdminForumTopicPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();

  const [topicResult, viewerAuthResult] = await Promise.all([
    supabase
      .from('forum_topics')
      .select('*')
      .eq('slug', params.slug)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);

  const topic = topicResult.data as Topic | null;
  const viewerUserId = viewerAuthResult.data.user?.id ?? null;
  if (!topic) notFound();

  const [categoryResult, authorResult, repliesResult, viewerResult] = await Promise.all([
    topic.category_id
      ? supabase
          .from('forum_categories')
          .select('*')
          .eq('id', topic.category_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', topic.user_id)
      .maybeSingle(),
    supabase
      .from('forum_replies')
      .select('*')
      .eq('topic_id', topic.id)
      .order('created_at', { ascending: true }),
    viewerUserId
      ? supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .eq('id', viewerUserId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const category = (categoryResult.data ?? null) as Category | null;
  const author = (authorResult.data ?? null) as Profile | null;
  const replies = (repliesResult.data ?? []) as Reply[];
  const viewer = (viewerResult.data ?? null) as Profile | null;

  const viewerName =
    viewer?.full_name ?? viewer?.email?.split('@')[0] ?? 'Admin';
  const viewerInitials = (
    viewer?.full_name?.[0] ??
    viewer?.email?.[0] ??
    'A'
  ).toUpperCase();

  // Profiles for everyone who replied
  const replierIds = Array.from(new Set(replies.map((r) => r.user_id)));
  const profilesById = new Map<string, Profile>();
  if (author) profilesById.set(author.id, author);
  const idsToFetch = replierIds.filter((id) => !profilesById.has(id));
  if (idsToFetch.length > 0) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('id', idsToFetch);
    for (const p of (profs ?? []) as Profile[]) {
      profilesById.set(p.id, p);
    }
  }

  const authorName =
    author?.full_name ?? author?.email?.split('@')[0] ?? 'Manm';
  const authorInitials = (
    author?.full_name?.[0] ??
    author?.email?.[0] ??
    'M'
  ).toUpperCase();

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1000px] mx-auto grid gap-5">
      {/* Breadcrumb */}
      <nav className="text-xs text-earth-600 flex items-center gap-1.5 flex-wrap">
        <Link href="/admin" className="hover:text-forest-700 transition">
          Admin
        </Link>
        <ChevronRight className="w-3 h-3" strokeWidth={2.4} />
        <Link
          href="/admin/forum"
          className="hover:text-forest-700 transition"
        >
          Fowòm
        </Link>
        <ChevronRight className="w-3 h-3" strokeWidth={2.4} />
        <span className="text-ink font-medium truncate max-w-[260px]">
          {topic.title}
        </span>
      </nav>

      <Link
        href="/admin/forum"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-earth-700 hover:text-forest-700 transition w-fit"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2.2} />
        Tounen nan lis sijè yo
      </Link>

      {/* Topic */}
      <article className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
        {category && (
          <div
            aria-hidden
            className="h-1.5"
            style={{ background: category.color }}
          />
        )}
        <div className="p-5 md:p-6">
          <div className="flex items-start gap-3 justify-between mb-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {category && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border"
                  style={{
                    background: `${category.color}1A`,
                    color: category.color,
                    borderColor: `${category.color}40`,
                  }}
                >
                  {category.icon && <span aria-hidden>{category.icon}</span>}
                  {category.name}
                </span>
              )}
              {topic.pinned && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gold-100 text-gold-700 border border-gold-200">
                  <Pin className="w-2.5 h-2.5" strokeWidth={2.4} />
                  Pinned
                </span>
              )}
              {topic.locked && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                  <Lock className="w-2.5 h-2.5" strokeWidth={2.4} />
                  Fèmen
                </span>
              )}
            </div>
            <TopicRowActions
              id={topic.id}
              pinned={topic.pinned}
              locked={topic.locked}
            />
          </div>

          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink leading-tight">
            {topic.title}
          </h1>

          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <Link
              href={`/admin/users/${topic.user_id}`}
              className="flex items-center gap-2.5 group"
            >
              <span className="grid place-items-center w-10 h-10 rounded-full bg-forest-100 text-forest-700 font-display font-bold text-sm shrink-0">
                {authorInitials}
              </span>
              <div>
                <div className="text-sm font-semibold text-ink flex items-center gap-1.5 group-hover:text-forest-700 transition">
                  {authorName}
                  {author?.role === 'admin' && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                      <ShieldAlert className="w-2.5 h-2.5" strokeWidth={2.4} />
                      Admin
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-earth-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" strokeWidth={2.2} />
                  {formatDateTime(topic.created_at)}
                </div>
              </div>
            </Link>
            <div className="ml-auto flex items-center gap-3 text-[11px] text-earth-600">
              <span className="inline-flex items-center gap-1">
                <Eye className="w-3 h-3" strokeWidth={2.4} />
                {topic.view_count} vizit
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="w-3 h-3" strokeWidth={2.4} />
                {topic.reply_count} repons
              </span>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-cream-100">
            <p className="text-base text-ink/90 leading-relaxed whitespace-pre-wrap break-words">
              {topic.body}
            </p>
          </div>
        </div>
      </article>

      {/* Admin reply composer */}
      <AdminReplyComposer
        topicId={topic.id}
        topicLocked={topic.locked}
        adminInitials={viewerInitials}
        adminName={viewerName}
      />

      {/* Replies */}
      <section>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="font-display text-lg font-bold text-ink">
            Repons yo{' '}
            <span className="text-earth-600 font-medium">({replies.length})</span>
          </h2>
        </div>

        {replies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-cream-200 bg-cream-50/40 px-4 py-8 text-center text-sm text-earth-600">
            Poko gen repons nan sijè sa.
          </div>
        ) : (
          <ul className="space-y-3">
            {replies.map((r) => {
              const replier = profilesById.get(r.user_id);
              const replierName =
                replier?.full_name ?? replier?.email?.split('@')[0] ?? 'Manm';
              const initials = (
                replier?.full_name?.[0] ??
                replier?.email?.[0] ??
                'M'
              ).toUpperCase();
              return (
                <li
                  key={r.id}
                  className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid place-items-center w-10 h-10 rounded-full bg-cream-100 text-earth-700 font-display font-bold text-sm shrink-0">
                      {initials}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/admin/users/${r.user_id}`}
                          className="font-semibold text-sm text-ink hover:text-forest-700 transition truncate"
                        >
                          {replierName}
                        </Link>
                        {replier?.role === 'admin' && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                            <ShieldAlert className="w-2.5 h-2.5" strokeWidth={2.4} />
                            Admin
                          </span>
                        )}
                        <span className="text-[10px] text-earth-500">
                          {formatDateTime(r.created_at)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-ink/90 whitespace-pre-wrap break-words leading-relaxed">
                        {r.body}
                      </p>
                    </div>
                    <ReplyRowActions id={r.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
