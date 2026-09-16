'use client';

// Member dashboard sidebar. Refined, collapsible rail (w-64 ↔ icon-only)
// adapted from a "dashboard sidebar" pattern, themed in the Hoïs palette and
// wired to the real member navigation (grouped, with badges). Desktop collapse
// state persists in localStorage; mobile uses a slide-in drawer triggered by
// the topbar hamburger. Preserves the UserTour anchors + locked-path handling.

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  GraduationCap,
  Download,
  Activity,
  BookOpen,
  LifeBuoy,
  UserCircle,
  LogOut,
  X,
  MessagesSquare,
  Award,
  Crown,
  FlaskConical,
  Lock,
  Sparkles,
  Leaf,
  Sprout,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LOCKED_PATHS } from '@/lib/feature-locks';
import { createClient } from '@/lib/supabase/client';
import Avatar from './avatar';

type SidebarProps = {
  /** @deprecated kept for backward-compatibility with existing callers. */
  isAdmin?: boolean;
  userName: string;
  planLabel: string;
  level?: number;
  avatarUrl?: string | null;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

const NAV_GROUPS: { heading?: string; items: NavItem[] }[] = [
  {
    items: [
      { href: '/dashboard', label: 'Tablodebò', icon: LayoutDashboard },
      { href: '/dashboard/lakou-limye', label: 'Lakou Limyè', icon: Sparkles },
    ],
  },
  {
    heading: 'Sante',
    items: [
      { href: '/dashboard/health', label: 'Swivi Sante', icon: Activity },
      { href: '/dashboard/programs', label: 'Pwotokòl mwen yo', icon: FolderOpen },
      { href: '/dashboard/reset-doz', label: 'Resèt ak Dòz', icon: FlaskConical },
    ],
  },
  {
    heading: 'Aprann',
    items: [
      { href: '/dashboard/kou', label: 'Klas mwen yo', icon: GraduationCap },
      { href: '/dashboard/guides', label: 'Gid & Konsèy', icon: BookOpen },
      { href: '/glose', label: 'Glosè plant', icon: Leaf },
      { href: '/laboratwa', label: 'Laboratwa', icon: Sprout },
      { href: '/dashboard/resources', label: 'Telechajman', icon: Download, badge: '12' },
    ],
  },
  {
    heading: 'Kominote',
    items: [
      { href: '/dashboard/forum', label: 'Fowòm', icon: MessagesSquare, badge: 'NEW' },
      { href: '/dashboard/badges', label: 'Badj mwen yo', icon: Award },
      { href: '/dashboard/vip', label: 'Espas VIP', icon: Crown },
      { href: '/dashboard/support', label: 'Sipò', icon: LifeBuoy },
    ],
  },
];

// Plain bottom rows (model-style) — Settings + sign-out as clean nav rows,
// not a heavy user card.
const BOTTOM_ITEMS: NavItem[] = [
  { href: '/dashboard/settings', label: 'Kont mwen', icon: UserCircle },
];

const STORAGE_KEY = 'hois:member:sidebar-open';

export default function Sidebar({
  userName,
  planLabel,
  level = 3,
  avatarUrl,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [open, setOpen] = React.useState(true); // desktop expanded/collapsed

  React.useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === '0') setOpen(false);
    } catch {
      /* storage blocked */
    }
  }, []);

  function toggleCollapse() {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  // Hamburger button in the topbar opens the mobile drawer
  React.useEffect(() => {
    function onOpen() {
      setDrawerOpen(true);
    }
    window.addEventListener('open-user-nav-drawer', onOpen);
    return () => window.removeEventListener('open-user-nav-drawer', onOpen);
  }, []);

  React.useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!drawerOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [drawerOpen]);

  React.useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  async function onSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === href || pathname.startsWith(`${href}/`);

  function Row({
    item,
    collapsed,
    onLinkClick,
  }: {
    item: NavItem;
    collapsed: boolean;
    onLinkClick?: () => void;
  }) {
    const { href, label, icon: Icon, badge } = item;
    const active = isActive(href);
    const tourKey = 'nav-' + href.replace(/^\//, '').replace(/\//g, '-');

    if (LOCKED_PATHS[href]) {
      return (
        <div
          data-tour={tourKey}
          aria-disabled="true"
          title={collapsed ? `${label} (fèmen)` : 'Seksyon sa a fèmen pou kounye a'}
          className={cn(
            'flex items-center rounded-lg text-sm font-medium text-earth-400 cursor-not-allowed select-none',
            collapsed ? 'justify-center py-2.5' : 'gap-3 px-3 py-2'
          )}
        >
          <Icon className="w-[18px] h-[18px] shrink-0 text-earth-300" strokeWidth={1.75} />
          {!collapsed && (
            <>
              <span className="flex-1 truncate">{label}</span>
              <Lock className="w-3.5 h-3.5 shrink-0 text-earth-400" strokeWidth={2} />
            </>
          )}
        </div>
      );
    }

    return (
      <Link
        href={href}
        onClick={onLinkClick}
        data-tour={tourKey}
        title={collapsed ? label : undefined}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'group relative flex items-center rounded-lg text-sm transition-all',
          collapsed ? 'justify-center py-2.5' : 'gap-3 px-3 py-2',
          active
            ? 'bg-forest-50 text-forest-800 font-semibold'
            : 'text-earth-600 font-medium hover:bg-cream-100 hover:text-ink'
        )}
      >
        <span className="relative shrink-0">
          <Icon
            className={cn(
              'w-[18px] h-[18px]',
              active ? 'text-forest-700' : 'text-earth-400 group-hover:text-earth-600'
            )}
            strokeWidth={1.75}
          />
          {collapsed && badge && (
            <span
              className={cn(
                'absolute -top-1 -right-1 w-2 h-2 rounded-full',
                badge === 'NEW' ? 'bg-gold-400' : 'bg-forest-500'
              )}
            />
          )}
        </span>
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{label}</span>
            {badge && (
              <span
                className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide',
                  badge === 'NEW' ? 'bg-gold-400 text-forest-900' : 'bg-forest-100 text-forest-700'
                )}
              >
                {badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
  }

  function NavContent({
    collapsed,
    onLinkClick,
    showClose,
  }: {
    collapsed: boolean;
    onLinkClick?: () => void;
    showClose?: boolean;
  }) {
    return (
      <>
        {/* Header: brand + collapse toggle */}
        <div
          className={cn(
            'border-b border-cream-200 flex items-center gap-2',
            collapsed ? 'justify-center px-2 py-4' : 'px-4 py-4'
          )}
        >
          {!collapsed && (
            <Link href="/" className="flex items-center min-w-0 flex-1" onClick={onLinkClick}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-hois.png" alt="Hoïs" className="h-9 w-auto shrink-0" />
            </Link>
          )}
          {showClose ? (
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Fèmen"
              className="grid place-items-center w-9 h-9 rounded-lg bg-cream-100 hover:bg-cream-200 text-earth-700 shrink-0 transition"
            >
              <X className="w-4 h-4" strokeWidth={2.2} />
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleCollapse}
              aria-label={collapsed ? 'Ouvri meni an' : 'Kache meni an'}
              className="grid place-items-center w-9 h-9 rounded-lg text-earth-500 hover:bg-cream-100 hover:text-ink shrink-0 transition"
            >
              {collapsed ? (
                <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.75} />
              ) : (
                <PanelLeftClose className="w-[18px] h-[18px]" strokeWidth={1.75} />
              )}
            </button>
          )}
        </div>

        {/* Account chip (identity at top, model-style) */}
        {collapsed ? (
          <div className="px-2 pt-3 flex justify-center">
            <Link
              href="/dashboard/settings"
              onClick={onLinkClick}
              data-tour="user-card"
              title={`${userName} · ${planLabel}`}
              className="rounded-full ring-2 ring-transparent hover:ring-forest-200 transition"
            >
              <Avatar size={36} src={avatarUrl} alt={userName} />
            </Link>
          </div>
        ) : (
          <Link
            href="/dashboard/settings"
            onClick={onLinkClick}
            data-tour="user-card"
            className="mx-2.5 mt-3 flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-cream-100 transition"
          >
            <Avatar size={38} src={avatarUrl} alt={userName} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-ink truncate leading-tight">
                {userName}
              </div>
              <div className="text-[11px] text-earth-500 truncate mt-0.5">
                {planLabel} · Niv. {level}
              </div>
            </div>
          </Link>
        )}

        {/* Nav groups */}
        <div className="flex-1 px-2.5 py-3 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-3">
          {NAV_GROUPS.map((group, i) => (
            <div key={group.heading ?? `g${i}`} className="flex flex-col gap-0.5">
              {group.heading &&
                (collapsed ? (
                  i > 0 && <div className="mx-2 my-1 border-t border-cream-200" aria-hidden />
                ) : (
                  <span className="px-2.5 mb-1 text-[11px] font-semibold tracking-wider text-earth-400 uppercase">
                    {group.heading}
                  </span>
                ))}
              {group.items.map((item) => (
                <Row key={item.href} item={item} collapsed={collapsed} onLinkClick={onLinkClick} />
              ))}
            </div>
          ))}
        </div>

        {/* Bottom: Settings + sign out as clean plain rows (model-style) */}
        <div className="mt-auto border-t border-cream-200 p-2.5 flex flex-col gap-0.5">
          {BOTTOM_ITEMS.map((item) => (
            <Row key={item.href} item={item} collapsed={collapsed} onLinkClick={onLinkClick} />
          ))}
          <button
            type="button"
            onClick={onSignOut}
            title={collapsed ? 'Dekonekte' : undefined}
            className={cn(
              'group flex items-center rounded-lg text-sm font-medium text-earth-600 hover:bg-rose-50 hover:text-rose-700 transition w-full',
              collapsed ? 'justify-center py-2.5' : 'gap-3 px-3 py-2'
            )}
          >
            <LogOut
              className="w-[18px] h-[18px] shrink-0 text-earth-400 group-hover:text-rose-600"
              strokeWidth={1.75}
            />
            {!collapsed && <span className="flex-1 text-left truncate">Dekonekte</span>}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* ── Desktop sidebar (collapsible) ────────────────────────────── */}
      <aside
        className={cn(
          'hidden lg:flex flex-col shrink-0 bg-cream-50 border-r border-cream-200 h-screen sticky top-0 z-30 transition-[width] duration-300 ease-in-out',
          open ? 'w-64' : 'w-[76px]'
        )}
      >
        <NavContent collapsed={!open} />
      </aside>

      {/* ── Mobile drawer ────────────────────────────────────────────── */}
      {drawerOpen && (
        <>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Fèmen navigasyon"
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fadeIn"
          />
          <aside
            className="lg:hidden fixed left-0 top-0 bottom-0 w-72 max-w-[85vw] z-50 bg-cream-50 border-r border-cream-200 flex flex-col shadow-2xl animate-slideInLeft"
            role="dialog"
            aria-modal="true"
            aria-label="Navigasyon manm"
          >
            <NavContent collapsed={false} showClose onLinkClick={() => setDrawerOpen(false)} />
          </aside>
        </>
      )}
    </>
  );
}
