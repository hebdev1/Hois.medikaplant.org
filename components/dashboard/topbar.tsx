import { Search, ShoppingCart, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Avatar from './avatar';
import NotificationBell from './notification-bell';
import MobileNavButton from './mobile-nav-button';

type TopbarProps = {
  userName: string;
  userCondition?: string;
  /** @deprecated Kept for backward compatibility — NotificationBell now
   *  computes its own live unread count via realtime subscription. */
  unreadCount?: number;
};

/**
 * Topbar is a server component so it can fetch the current user's id + plan
 * once and pass them to the live <NotificationBell />. The bell handles its
 * own realtime subscription + dropdown state on the client. The mobile
 * hamburger sits at the start of the row on small screens; the search input
 * is hidden below md to keep the row compact on phones.
 */
export default async function Topbar({
  userName,
  userCondition = 'Manm Hoïs',
}: TopbarProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Read plan from the JWT claim (populated by custom_access_token_hook).
  // Falls back to a profile query for sessions issued before the hook
  // was enabled — one DB roundtrip saved per dashboard navigation in the
  // common case. The same fallback query also pulls avatar_url so the
  // top-right avatar renders the member's uploaded photo when they have
  // one instead of the SVG placeholder.
  let userPlan: 'basic' | 'premium' | 'vip' = 'basic';
  let avatarUrl: string | null = null;
  if (user) {
    const metaPlan = (user.user_metadata as { app_plan?: string } | null)
      ?.app_plan;
    const needPlanFallback =
      !(metaPlan === 'basic' || metaPlan === 'premium' || metaPlan === 'vip');
    // Always fetch avatar_url; combine with plan fallback when needed to
    // keep the query count at one.
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    const p = profile as {
      plan: 'basic' | 'premium' | 'vip';
      avatar_url: string | null;
    } | null;
    if (needPlanFallback && p?.plan) userPlan = p.plan;
    if (!needPlanFallback && metaPlan) userPlan = metaPlan;
    avatarUrl = p?.avatar_url ?? null;
  }

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 sm:gap-4 px-4 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-4 bg-cream-50/85 backdrop-blur-md border-b border-cream-200">
      <MobileNavButton />

      <label className="relative flex-1 max-w-2xl hidden md:block">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-500"
          strokeWidth={2}
          aria-hidden
        />
        <input
          type="search"
          placeholder="Chèche yon gid, pwodwi, oswa konsèy..."
          className="w-full pl-11 pr-16 py-2.5 rounded-full bg-white border border-cream-200 text-sm text-ink placeholder:text-earth-500 focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 transition"
        />
        <kbd className="hidden lg:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 px-2 py-0.5 rounded-md bg-cream-100 border border-cream-200 text-[10px] font-semibold text-earth-600">
          ⌘ K
        </kbd>
      </label>

      {/* Spacer that grows on mobile to push the controls to the right */}
      <div className="flex-1 md:hidden" />

      <div className="flex items-center gap-2">
        {user && (
          <div data-tour="topbar-notif">
            <NotificationBell userId={user.id} userPlan={userPlan} />
          </div>
        )}
        <button
          aria-label="Panye"
          className="hidden sm:grid place-items-center w-10 h-10 rounded-full bg-white border border-cream-200 hover:border-forest-300 text-earth-700 hover:text-forest-700 transition"
        >
          <ShoppingCart className="w-[18px] h-[18px]" strokeWidth={1.8} />
        </button>
        <Link
          href="/dashboard/settings"
          className="hidden sm:flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full bg-white border border-cream-200 hover:border-forest-300 transition"
        >
          <Avatar size={32} src={avatarUrl} alt={userName} />
          <div className="hidden md:flex flex-col leading-tight">
            <span className="text-sm font-semibold text-ink truncate max-w-[160px]">
              {userName}
            </span>
            <span className="text-[11px] text-earth-600 truncate max-w-[160px]">
              {userCondition}
            </span>
          </div>
          <ChevronDown className="hidden md:block w-3.5 h-3.5 text-earth-500" strokeWidth={2} />
        </Link>
        {/* Compact avatar (mobile only) — links to settings too */}
        <Link
          href="/dashboard/settings"
          className="sm:hidden grid place-items-center"
          aria-label="Pwofil"
        >
          <Avatar size={36} src={avatarUrl} alt={userName} />
        </Link>
      </div>
    </header>
  );
}
