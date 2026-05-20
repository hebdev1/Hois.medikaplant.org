import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  Languages,
  User as UserIcon,
  Calendar,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Topbar from '@/components/dashboard/topbar';
import PlantBig from '@/components/dashboard/plant-big';
import SaveGuideButton from '@/components/dashboard/save-guide-button';
import GuideCard from '@/components/dashboard/guide-card';
import { recordGuideView } from '../actions';
import type { Database } from '@/types/database';

export const dynamic = 'force-dynamic';

type Guide = Database['public']['Tables']['guides']['Row'];
type GuideArt = Database['public']['Enums']['guide_art'];

const PLAN_LABELS: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

const LANGUAGE_LABEL: Record<string, string> = {
  ht: 'Kreyòl',
  fr: 'Français',
  en: 'English',
};

const HT_DATE = new Intl.DateTimeFormat('fr-HT', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const { data } = await supabase
    .from('guides')
    .select('title, excerpt')
    .eq('slug', params.slug)
    .maybeSingle();
  const g = data as { title: string; excerpt: string } | null;
  return {
    title: g?.title ?? 'Gid',
    description: g?.excerpt,
  };
}

export default async function GuideDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch the guide. RLS already restricts to published + at-or-below plan,
  // so a missing row here = either not published or above the user's plan.
  const { data: guideRaw } = await supabase
    .from('guides')
    .select('*')
    .eq('slug', params.slug)
    .maybeSingle();
  const guide = guideRaw as Guide | null;

  if (!guide) {
    notFound();
  }

  // Fan-out: profile, save state, related guides, unread notif count
  const [
    profileResult,
    savedResult,
    relatedResult,
    unreadCountResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, first_name, last_name, email, plan')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('user_guide_saves')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('guide_id', guide.id)
      .maybeSingle(),
    // Related: same category, exclude current, top 3 by recency
    guide.category_id
      ? supabase
          .from('guides')
          .select('*')
          .eq('category_id', guide.category_id)
          .eq('published', true)
          .neq('id', guide.id)
          .order('published_at', { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [] }),
    supabase.rpc('user_unread_notifications_count', { uid: user.id }),
  ]);

  // Fire-and-forget view increment (don't block render on it)
  recordGuideView(guide.id);

  const profile = profileResult.data as {
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string;
    plan: 'basic' | 'premium' | 'vip';
  } | null;
  const related = (relatedResult.data ?? []) as Guide[];
  const userName =
    profile?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    profile?.email?.split('@')[0] ||
    user.email?.split('@')[0] ||
    'Manm';
  const shortName = userName.split(' ')[0];
  const planLabel = profile ? PLAN_LABELS[profile.plan] ?? 'Hoïs Bazilik' : 'Hoïs Bazilik';
  const unreadCount = (unreadCountResult.data as number | null) ?? 0;
  const saved = !!savedResult.data;

  return (
    <>
      <Topbar
        userName={shortName}
        userCondition={planLabel}
        unreadCount={unreadCount}
      />
      <article className="max-w-[920px] mx-auto px-5 md:px-8 lg:px-10 py-6 md:py-10">
        {/* Back link */}
        <Link
          href="/dashboard/guides"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-earth-700 hover:text-forest-700 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.2} />
          Tounen nan Gid & Konsèy
        </Link>

        {/* Hero */}
        <section
          className="relative overflow-hidden rounded-3xl p-6 md:p-10 mb-8 shadow-hero text-cream-50"
          style={{
            backgroundImage: `linear-gradient(135deg, ${guide.accent_color}, ${guide.accent_color}DD)`,
          }}
        >
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
              backgroundSize: '22px 22px',
            }}
            aria-hidden
          />

          <div className="relative grid lg:grid-cols-[1fr_220px] gap-6 items-center">
            <div>
              {guide.tag && (
                <span className="inline-block px-2.5 py-1 rounded-full bg-white/85 text-[10px] font-bold text-ink uppercase tracking-wider mb-4">
                  {guide.tag}
                </span>
              )}
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                {guide.title}
              </h1>
              <p className="mt-4 text-cream-100/95 text-base md:text-lg leading-relaxed">
                {guide.excerpt}
              </p>
            </div>
            <div className="hidden lg:block">
              <PlantBig
                art={guide.art as GuideArt}
                accent="#FFFDF8"
                opacity={0.85}
                size={200}
              />
            </div>
          </div>
        </section>

        {/* Meta strip */}
        <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-cream-200">
          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
            <div className="grid place-items-center w-10 h-10 rounded-full bg-forest-100 text-forest-700">
              <UserIcon className="w-4 h-4" strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-sm font-semibold text-ink">
                {guide.author_name}
              </div>
              {guide.author_role && (
                <div className="text-[11px] text-earth-600">{guide.author_role}</div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-earth-600">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" strokeWidth={2.2} />
              {guide.read_minutes} min lekti
            </span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <Languages className="w-3.5 h-3.5" strokeWidth={2.2} />
              {LANGUAGE_LABEL[guide.language] ?? guide.language}
            </span>
            {guide.published_at && (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" strokeWidth={2.2} />
                  {HT_DATE.format(new Date(guide.published_at))}
                </span>
              </>
            )}
          </div>

          <SaveGuideButton
            guideId={guide.id}
            initialSaved={saved}
            variant="pill"
          />
        </div>

        {/* Body */}
        <div className="prose-medikaplant">
          {renderMarkdown(guide.body_markdown)}
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-14 pt-10 border-t border-cream-200">
            <h2 className="font-display text-xl md:text-2xl font-bold text-ink mb-5">
              Atik <em className="text-forest-600 not-italic font-bold">menm jan</em>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map((g) => (
                <GuideCard key={g.id} guide={g} />
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}

// ─── Minimal markdown renderer ──────────────────────────────────────────────
// Supports: ## headings, paragraphs (blank-line separated),
// ordered lists (lines starting with "1. ", "2. "...), and bold **text**.
// Anything else falls through as a plain paragraph. Good enough for the
// seed corpus — we can swap to a full markdown lib later if we ever ship
// raw user-written content.

function renderMarkdown(md: string) {
  const blocks = md.split(/\n\n+/);
  return (
    <div className="space-y-5 text-base text-ink leading-relaxed">
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  );
}

function renderBlock(block: string, key: number) {
  const trimmed = block.trim();
  if (!trimmed) return null;

  // Heading
  if (trimmed.startsWith('## ')) {
    return (
      <h2
        key={key}
        className="font-display text-xl md:text-2xl font-bold text-ink mt-8 mb-3 first:mt-0"
      >
        {renderInline(trimmed.slice(3))}
      </h2>
    );
  }
  if (trimmed.startsWith('# ')) {
    return (
      <h1
        key={key}
        className="font-display text-2xl md:text-3xl font-bold text-ink mt-8 mb-4 first:mt-0"
      >
        {renderInline(trimmed.slice(2))}
      </h1>
    );
  }

  // Ordered list
  const lines = trimmed.split('\n');
  if (lines.every((l) => /^\d+\.\s/.test(l))) {
    return (
      <ol key={key} className="list-decimal pl-5 space-y-1.5 text-ink/90">
        {lines.map((l, j) => (
          <li key={j}>{renderInline(l.replace(/^\d+\.\s/, ''))}</li>
        ))}
      </ol>
    );
  }

  // Unordered list (- or *)
  if (lines.every((l) => /^[-*]\s/.test(l))) {
    return (
      <ul key={key} className="list-disc pl-5 space-y-1.5 text-ink/90 marker:text-forest-600">
        {lines.map((l, j) => (
          <li key={j}>{renderInline(l.replace(/^[-*]\s/, ''))}</li>
        ))}
      </ul>
    );
  }

  return (
    <p key={key} className="text-ink/90">
      {renderInline(trimmed)}
    </p>
  );
}

function renderInline(text: string) {
  // Simple **bold** parser. Split on **...** and wrap matching pieces.
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-ink font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
