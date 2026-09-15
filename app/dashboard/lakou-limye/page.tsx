import { Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import Topbar from '@/components/dashboard/topbar';
import { videoThumb } from '@/components/cms/video-embed';
import LakouTabs, { type LakouItem, type LakouTabData } from './lakou-tabs';

export const metadata = { title: 'Lakou Limyè · MedikaPlant' };
export const dynamic = 'force-dynamic';

const PLAN_LABEL: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

export default async function LakouLimyePage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const [profileRes, tabsRes, vidsRes, audsRes, artsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('plan, full_name, email, avatar_url')
      .eq('id', user.id)
      .maybeSingle(),
    sb
      .from('lakou_tabs')
      .select('id, name, slug, display_order')
      .eq('active', true)
      .order('display_order', { ascending: true }),
    sb
      .from('cms_videos')
      .select('id, title, description, video_url, thumbnail, lakou_tab_id')
      .eq('status', 'published')
      .not('lakou_tab_id', 'is', null),
    sb
      .from('resources')
      .select('id, title, description, file_url, type, lakou_tab_id')
      .eq('published', true)
      .not('lakou_tab_id', 'is', null),
    sb
      .from('cms_articles')
      .select('id, title, slug, excerpt, cover_image, lakou_tab_id')
      .eq('status', 'published')
      .not('lakou_tab_id', 'is', null),
  ]);

  const profile = profileRes.data as {
    plan: 'basic' | 'premium' | 'vip';
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;

  const tabs = (tabsRes.data ?? []) as {
    id: string;
    name: string;
    slug: string;
    display_order: number;
  }[];

  const byTab = new Map<string, LakouItem[]>();
  const push = (tabId: string | null, item: LakouItem) => {
    if (!tabId) return;
    const arr = byTab.get(tabId) ?? [];
    arr.push(item);
    byTab.set(tabId, arr);
  };

  for (const v of (vidsRes.data ?? []) as Record<string, string | null>[]) {
    push(v.lakou_tab_id, {
      kind: 'video',
      id: String(v.id),
      title: v.title || 'Videyo',
      description: v.description,
      url: v.video_url,
      thumbnail: v.thumbnail || videoThumb(v.video_url),
      href: null,
    });
  }
  for (const r of (audsRes.data ?? []) as Record<string, string | null>[]) {
    push(r.lakou_tab_id, {
      kind: r.type === 'audio' ? 'audio' : 'file',
      id: String(r.id),
      title: r.title || 'Fichye',
      description: r.description,
      url: r.file_url,
      thumbnail: null,
      href: null,
    });
  }
  for (const a of (artsRes.data ?? []) as Record<string, string | null>[]) {
    push(a.lakou_tab_id, {
      kind: 'article',
      id: String(a.id),
      title: a.title || 'Atik',
      description: a.excerpt,
      url: null,
      thumbnail: a.cover_image,
      href: `/atik/${a.slug}`,
    });
  }

  const data: LakouTabData[] = tabs.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    items: byTab.get(t.id) ?? [],
  }));

  const plan = profile?.plan ?? 'basic';
  const userName = profile?.full_name || profile?.email.split('@')[0] || 'Manm';
  const shortName = userName.split(' ')[0];

  return (
    <>
      <Topbar
        userName={shortName}
        userCondition={`${PLAN_LABEL[plan]} · Lakou Limyè`}
        userId={user.id}
        userPlan={plan}
        avatarUrl={profile?.avatar_url ?? null}
      />
      <div className="p-5 md:p-8 lg:p-10 max-w-[1320px] mx-auto grid gap-5 md:gap-6">
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2.2} />
            Lakou Limyè
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Lakou <em className="text-forest-600 not-italic font-bold">Limyè</em>
          </h1>
          <p className="mt-2 text-sm md:text-base text-earth-600 max-w-2xl leading-relaxed">
            Salon mistik, emisyon spirityèl, ak pakou limyè — videyo, odyo ak atik pou
            nouri chemen limyè ou.
          </p>
        </header>

        <LakouTabs tabs={data} initialSlug={searchParams.tab} />
      </div>
    </>
  );
}
