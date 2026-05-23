import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ChevronRight,
  ArrowLeft,
  Eye,
  MessageCircle,
  Pin,
  Lock,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Topbar from '@/components/dashboard/topbar';
import RepliesList from './replies-list';
import { bumpTopicView, deleteTopic } from '../actions';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';

export const metadata = { title: 'Fowòm · MedikaPlant' };
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

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

async function deleteTopicAction(id: string) {
  'use server';
  await deleteTopic(id);
}

export default async function ForumTopicPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Topic
  const { data: rawTopic } = await supabase
    .from('forum_topics')
    .select('*')
    .eq('slug', params.slug)
    .maybeSingle();
  const topic = rawTopic as Topic | null;
  if (!topic) notFound();

  // Bump view count for this request (fire-and-forget; ignore failures)
  bumpTopicView(topic.id).catch(() => {});

  // Category + author + viewer profile + replies in parallel
  const [
    categoryResult,
    authorResult,
    viewerResult,
    repliesResult,
  ] = await Promise.all([
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
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('forum_replies')
      .select('*')
      .eq('topic_id', topic.id)
      .order('created_at', { ascending: true }),
  ]);

  const category = (categoryResult.data ?? null) as Category | null;
  const author = (authorResult.data ?? null) as Profile | null;
  const viewer = (viewerResult.data ?? null) as Profile | null;
  const replies = (repliesResult.data ?? []) as Reply[];
  const isAdmin = viewer?.role === 'admin';
  const canDeleteTopic = isAdmin || topic.user_id === user.id;

  // Profiles for everyone who replied (so the client list renders names)
  const replierIds = Array.from(new Set(replies.map((r) => r.user_id)));
  const idsToFetch = replierIds.filter((id) => id !== topic.user_id);
  const authorByIdInit: Record<string, Profile | undefined> = {};
  if (author) authorByIdInit[author.id] = author;
  if (viewer && !authorByIdInit[viewer.id]) authorByIdInit[viewer.id] = viewer;

  if (idsToFetch.length > 0) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('id', idsToFetch);
    for (const p of (profs ?? []) as Profile[]) {
      authorByIdInit[p.id] = p;
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
    <>
      <Topbar
        userName={viewer?.full_name?.split(' ')[0] ?? 'Manm'}
        userCondition="Fowòm kominote"
      />
      <div className="p-5 md:p-8 lg:p-10 max-w-[900px] mx-auto grid gap-5">
        {/* Breadcrumb */}
        <nav className="text-xs text-earth-600 flex items-center gap-1.5 flex-wrap">
          <Link href="/dashboard" className="hover:text-forest-700 transition">
            Tablodebò
          </Link>
          <ChevronRight className="w-3 h-3" strokeWidth={2.4} />
          <Link href="/dashboard/forum" className="hover:text-forest-700 transition">
            Fowòm
          </Link>
          <ChevronRight className="w-3 h-3" strokeWidth={2.4} />
          <span className="text-ink font-medium truncate max-w-[220px]">
            {topic.title}
          </span>
        </nav>

        <Link
          href="/dashboard/forum"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-earth-700 hover:text-forest-700 transition w-fit"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.2} />
          Tounen nan fowòm
        </Link>

        {/* Topic */}
        <article className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
          {/* Color stripe based on category */}
          {category && (
            <div
              aria-hidden
              className="h-1.5"
              style={{ background: category.color }}
            />
          )}
          <div className="p-5 md:p-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
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

            <h1 className="font-display text-2xl md:text-3xl font-bold text-ink leading-tight">
              {topic.title}
            </h1>

            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <span className="grid place-items-center w-10 h-10 rounded-full bg-forest-100 text-forest-700 font-display font-bold text-sm shrink-0">
                  {authorInitials}
                </span>
                <div>
                  <div className="text-sm font-semibold text-ink flex items-center gap-1.5">
                    {authorName}
                    {author?.role === 'admin' && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                        <ShieldAlert className="w-2.5 h-2.5" strokeWidth={2.4} />
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-earth-500">
                    {formatDate(topic.created_at)}
                  </div>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-3 text-[11px] text-earth-600">
                <span className="inline-flex items-center gap-1">
                  <Eye className="w-3 h-3" strokeWidth={2.4} />
                  {topic.view_count}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" strokeWidth={2.4} />
                  {topic.reply_count}
                </span>
                {canDeleteTopic && (
                  <form action={deleteTopicAction.bind(null, topic.id)}>
                    <button
                      type="submit"
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition',
                        'text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200'
                      )}
                    >
                      <Trash2 className="w-3 h-3" strokeWidth={2.2} />
                      Efase
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-cream-100">
              <p className="text-base text-ink/90 leading-relaxed whitespace-pre-wrap break-words">
                {topic.body}
              </p>
            </div>
          </div>
        </article>

        {/* Replies + composer (client) */}
        <RepliesList
          topicId={topic.id}
          topicLocked={topic.locked}
          currentUserId={user.id}
          isAdmin={isAdmin}
          initialReplies={replies}
          authorById={authorByIdInit}
        />
      </div>
    </>
  );
}
