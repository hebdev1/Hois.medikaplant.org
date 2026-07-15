'use client';

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
  Leaf,
  LogOut,
  X,
  MessagesSquare,
  Award,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import Avatar from './avatar';

type SidebarProps = {
  /** @deprecated kept for backward-compatibility with existing callers;
   *  no longer used since admin/user dashboards are intentionally
   *  isolated and there is no cross-link from here to /admin. */
  isAdmin?: boolean;
  userName: string;
  planLabel: string;
  level?: number;
  /** Optional public URL of the member's uploaded profile picture.
   *  When present the sidebar user card renders it instead of the SVG
   *  illustration so the member's identity is immediately recognizable. */
  avatarUrl?: string | null;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

const NAV_ITEMS: readonly NavItem[] = [
  { href: '/dashboard', label: 'Tablodebò', icon: LayoutDashboard },
  { href: '/dashboard/programs', label: 'Pwotokòl mwen yo', icon: FolderOpen },
  { href: '/dashboard/kou', label: 'Kou mwen yo', icon: GraduationCap },
  { href: '/dashboard/resources', label: 'Telechajman', icon: Download, badge: '12' },
  { href: '/dashboard/health', label: 'Swivi Sante', icon: Activity },
  { href: '/dashboard/guides', label: 'Gid & Konsèy', icon: BookOpen },
  { href: '/dashboard/badges', label: 'Badj mwen yo', icon: Award },
  { href: '/dashboard/forum', label: 'Fowòm', icon: MessagesSquare, badge: 'NEW' },
  { href: '/dashboard/support', label: 'Sipò', icon: LifeBuoy },
  { href: '/dashboard/settings', label: 'Kont mwen', icon: UserCircle },
];

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

  // Listen for the hamburger button in the topbar
  React.useEffect(() => {
    function onOpen() {
      setDrawerOpen(true);
    }
    window.addEventListener('open-user-nav-drawer', onOpen);
    return () => window.removeEventListener('open-user-nav-drawer', onOpen);
  }, []);

  // Auto-close drawer on route change
  React.useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll while drawer is open
  React.useEffect(() => {
    if (!drawerOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [drawerOpen]);

  // ESC closes drawer
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

  function NavList({
    onLinkClick,
    showBrand,
    showClose,
  }: {
    onLinkClick?: () => void;
    showBrand: boolean;
    showClose?: boolean;
  }) {
    return (
      <>
        {/* Brand */}
        {showBrand && (
          <div className="px-6 pt-6 pb-5 border-b border-cream-200 flex items-center justify-between gap-2">
            <Link
              href="/"
              className="flex items-center gap-2.5 min-w-0"
              onClick={onLinkClick}
            >
              <span className="grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br from-forest-500 to-forest-800 text-white shadow-plant shrink-0">
                <Leaf className="w-5 h-5" strokeWidth={2.2} />
              </span>
              <span className="flex flex-col leading-tight min-w-0">
                <span className="font-display font-bold text-lg text-forest-800 tracking-tight truncate">
                  Medikaplant
                </span>
                <span className="font-serif italic text-[11px] text-earth-600 truncate">
                  un pied à la fois
                </span>
              </span>
            </Link>
            {showClose && (
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Fèmen"
                className="grid place-items-center w-9 h-9 rounded-lg bg-cream-100 hover:bg-cream-200 text-earth-700 shrink-0 transition"
              >
                <X className="w-4 h-4" strokeWidth={2.2} />
              </button>
            )}
          </div>
        )}

        {/* Nav */}
        <div className="flex-1 px-3 pt-5 overflow-y-auto">
          <div className="px-3 pb-3 text-[10px] uppercase tracking-[0.18em] text-earth-500 font-semibold">
            Navigasyon
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
              const active = pathname === href;
              // Tour anchor: derive a stable selector from the href so the
              // UserTour client component can highlight individual nav
              // entries (e.g. data-tour="nav-dashboard-health").
              const tourKey =
                'nav-' + href.replace(/^\//, '').replace(/\//g, '-');
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onLinkClick}
                  data-tour={tourKey}
                  className={cn(
                    'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    active
                      ? 'bg-forest-700 text-cream-50 shadow-plant'
                      : 'text-earth-700 hover:bg-cream-100 hover:text-forest-800'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-[18px] h-[18px] shrink-0',
                      active
                        ? 'text-gold-300'
                        : 'text-forest-500 group-hover:text-forest-700'
                    )}
                    strokeWidth={1.8}
                  />
                  <span className="flex-1 truncate">{label}</span>
                  {badge && (
                    <span
                      className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide',
                        badge === 'NEW'
                          ? 'bg-gold-400 text-forest-900'
                          : active
                          ? 'bg-cream-50 text-forest-700'
                          : 'bg-forest-100 text-forest-700'
                      )}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User card */}
        <div
          data-tour="user-card"
          className="m-3 rounded-2xl bg-gradient-to-br from-forest-700 to-forest-900 text-cream-50 p-3 flex items-center gap-3 shadow-plant"
        >
          <Avatar size={42} src={avatarUrl} alt={userName} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate font-display">
              {userName}
            </div>
            <div className="text-[11px] text-cream-200 truncate">
              {planLabel} · Niv. {level}
            </div>
          </div>
          <button
            onClick={onSignOut}
            aria-label="Dekonekte"
            className="grid place-items-center w-8 h-8 rounded-lg text-cream-200 hover:text-white hover:bg-white/10 transition"
          >
            <LogOut className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-cream-50 border-r border-cream-200 h-screen sticky top-0">
        <NavList showBrand />
      </aside>

      {/* ── Mobile drawer ────────────────────────────────────────────── */}
      {drawerOpen && (
        <>
          {/* Scrim */}
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Fèmen navigasyon"
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fadeIn"
          />

          {/* Drawer */}
          <aside
            className="lg:hidden fixed left-0 top-0 bottom-0 w-72 max-w-[85vw] z-50 bg-cream-50 border-r border-cream-200 flex flex-col shadow-2xl animate-slideInLeft"
            role="dialog"
            aria-modal="true"
            aria-label="Navigasyon manm"
          >
            <NavList showBrand showClose onLinkClick={() => setDrawerOpen(false)} />
          </aside>
        </>
      )}
    </>
  );
}
