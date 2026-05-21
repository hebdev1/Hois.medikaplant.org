'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  Download,
  Activity,
  BookOpen,
  LifeBuoy,
  UserCircle,
  Leaf,
  LogOut,
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
};

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Tablodebò', icon: LayoutDashboard },
  { href: '/dashboard/programs', label: 'Pwogram mwen yo', icon: FolderOpen },
  { href: '/dashboard/resources', label: 'Telechajman', icon: Download, badge: '12' },
  { href: '/dashboard/health', label: 'Swivi Sante', icon: Activity },
  { href: '/dashboard/guides', label: 'Gid & Konsèy', icon: BookOpen, badge: 'NEW' },
  { href: '/dashboard/support', label: 'Sipò', icon: LifeBuoy },
  { href: '/dashboard/settings', label: 'Kont mwen', icon: UserCircle },
] as const;

export default function Sidebar({
  userName,
  planLabel,
  level = 3,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function onSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-cream-50 border-r border-cream-200 h-screen sticky top-0">
      {/* Brand */}
      <div className="px-6 pt-6 pb-5 border-b border-cream-200">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br from-forest-500 to-forest-800 text-white shadow-plant">
            <Leaf className="w-5 h-5" strokeWidth={2.2} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display font-bold text-lg text-forest-800 tracking-tight">
              Medikaplant
            </span>
            <span className="font-serif italic text-[11px] text-earth-600">
              un pied à la fois
            </span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <div className="flex-1 px-3 pt-5 overflow-y-auto">
        <div className="px-3 pb-3 text-[10px] uppercase tracking-[0.18em] text-earth-500 font-semibold">
          Navigasyon
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon, ...rest }) => {
            const active = pathname === href;
            const badge = 'badge' in rest ? rest.badge : undefined;
            return (
              <Link
                key={href}
                href={href}
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
                    active ? 'text-gold-300' : 'text-forest-500 group-hover:text-forest-700'
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

        {/* Admin and user dashboards are intentionally isolated — no cross
            link here. Admins reach /admin directly via the URL. */}
      </div>

      {/* User card */}
      <div className="m-3 rounded-2xl bg-gradient-to-br from-forest-700 to-forest-900 text-cream-50 p-3 flex items-center gap-3 shadow-plant">
        <Avatar size={42} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate font-display">{userName}</div>
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
    </aside>
  );
}
