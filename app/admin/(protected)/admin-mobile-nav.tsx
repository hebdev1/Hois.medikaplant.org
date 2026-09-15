'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { groupedNavForRole, type AdminRole } from './admin-nav-config';
import AdminNotificationBell from './admin-notification-bell';
import { adminSignOut } from '../login/actions';

type Props = {
  adminName: string;
  initials: string;
  /**
   * The admin's sub-role (profiles.admin_role). We pass the role string —
   * not link objects — because Next.js cannot serialize Lucide's
   * React-component icons across the server→client boundary; the grouped
   * nav (with icons) is recomputed locally from the config.
   */
  adminRole: AdminRole | null;
  roleLabel: string;
  /** The signed-in admin's id — scopes the notification bell's event feed. */
  adminId: string;
};

/**
 * Mobile/tablet-only chrome for the admin panel (renders only below `lg`).
 * Mirrors the light desktop sidebar's look — white/cream surfaces, forest
 * active state, the real Hoïs logo — so the admin feels like one product at
 * every width. Provides a sticky top strip (hamburger + logo + bell +
 * sign-out) and a slide-in drawer with the grouped CMS nav.
 *
 * The drawer auto-closes on route change so tapping a link feels native.
 */
export default function AdminMobileNav({
  adminName,
  initials,
  adminRole,
  roleLabel,
  adminId,
}: Props) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const nav = React.useMemo(() => groupedNavForRole(adminRole), [adminRole]);

  const isActive = (href: string) =>
    href === '/admin'
      ? pathname === '/admin'
      : pathname === href || pathname.startsWith(`${href}/`);

  // Auto-close on route change
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while drawer is open
  React.useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // ESC closes drawer
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {/* ── Sticky top strip on <lg ───────────────────────────────────── */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-2.5 bg-white/90 backdrop-blur border-b border-cream-200 shadow-sm">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvri navigasyon admin"
          className="grid place-items-center w-10 h-10 rounded-lg bg-cream-100 hover:bg-cream-200 text-ink transition"
        >
          <Menu className="w-5 h-5" strokeWidth={2.2} />
        </button>

        <Link href="/admin" className="flex items-center gap-2 flex-1 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-hois.png" alt="Hoïs" className="h-8 w-auto shrink-0" />
          <span className="text-[10px] uppercase tracking-[0.16em] text-earth-500 font-semibold truncate">
            Panèl Admin
          </span>
        </Link>

        <AdminNotificationBell adminId={adminId} />

        <form action={adminSignOut}>
          <button
            type="submit"
            aria-label="Dekonèkte"
            className="grid place-items-center w-10 h-10 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition"
          >
            <LogOut className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </form>
      </header>

      {/* ── Slide-in drawer ──────────────────────────────────────────── */}
      {open && (
        <>
          {/* Scrim */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fèmen navigasyon"
            className="lg:hidden fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm animate-fadeIn"
          />

          {/* Drawer */}
          <aside
            className="lg:hidden fixed left-0 top-0 bottom-0 w-72 max-w-[85vw] z-50 bg-white flex flex-col shadow-2xl border-r border-cream-200 animate-slideInLeft"
            role="dialog"
            aria-modal="true"
            aria-label="Navigasyon admin"
          >
            {/* Brand row */}
            <div className="p-4 border-b border-cream-200 flex items-center justify-between gap-2">
              <Link
                href="/admin"
                className="flex items-center gap-2 min-w-0"
                onClick={() => setOpen(false)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-hois.png" alt="Hoïs" className="h-9 w-auto shrink-0" />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fèmen"
                className="grid place-items-center w-9 h-9 rounded-lg bg-cream-100 hover:bg-cream-200 text-ink shrink-0 transition"
              >
                <X className="w-4 h-4" strokeWidth={2.2} />
              </button>
            </div>

            {/* Admin identity */}
            <div className="px-4 py-3 border-b border-cream-200 flex items-center gap-2.5">
              <span className="grid place-items-center w-10 h-10 rounded-full bg-forest-100 text-forest-800 font-display font-bold text-sm shrink-0">
                {initials}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink truncate">
                  {adminName}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-earth-500 font-bold">
                  {roleLabel}
                </div>
              </div>
            </div>

            {/* Nav links (grouped, CMS-style) */}
            <nav className="flex-1 px-2.5 py-3 overflow-y-auto">
              {nav.top.map((link) => (
                <MobileNavItem
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  Icon={link.icon}
                  active={isActive(link.href)}
                  onNavigate={() => setOpen(false)}
                />
              ))}

              {nav.sections.map((section) => (
                <div key={section.id} className="mt-4 first:mt-2">
                  <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-earth-400">
                    {section.label}
                  </div>
                  <div className="space-y-0.5">
                    {section.links.map((link) => (
                      <MobileNavItem
                        key={link.soon ? `${section.id}-${link.label}` : link.href}
                        href={link.href}
                        label={link.label}
                        Icon={link.icon}
                        active={!link.soon && isActive(link.href)}
                        soon={link.soon}
                        onNavigate={() => setOpen(false)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            {/* Sign-out */}
            <div className="p-2.5 border-t border-cream-200">
              <form action={adminSignOut}>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 w-full transition"
                >
                  <LogOut className="w-4 h-4" strokeWidth={2.4} />
                  Dekonèkte
                </button>
              </form>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

function MobileNavItem({
  href,
  label,
  Icon,
  active,
  soon,
  onNavigate,
}: {
  href: string;
  label: string;
  Icon: LucideIcon;
  active?: boolean;
  soon?: boolean;
  onNavigate: () => void;
}) {
  if (soon) {
    return (
      <span
        aria-disabled="true"
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-earth-400 cursor-default select-none"
      >
        <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
        <span className="flex-1 truncate">{label}</span>
        <span className="text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cream-200 text-earth-500">
          Byento
        </span>
      </span>
    );
  }
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition',
        active
          ? 'bg-forest-50 text-forest-800 font-semibold'
          : 'text-earth-700 font-medium hover:bg-cream-100 hover:text-ink'
      )}
    >
      <Icon
        className={cn('w-4 h-4 shrink-0', active ? 'text-forest-700' : '')}
        strokeWidth={2}
      />
      {label}
    </Link>
  );
}
