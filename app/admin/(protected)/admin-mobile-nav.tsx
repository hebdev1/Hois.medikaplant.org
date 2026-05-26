'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, Menu, X, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminNavLink } from './admin-nav-config';
import { adminSignOut } from '../login/actions';

type Props = {
  adminName: string;
  initials: string;
  /**
   * Already filtered by the layout to just the links the current admin
   * can use, based on their admin_role / capabilities.
   */
  links: AdminNavLink[];
  roleLabel: string;
};

/**
 * Mobile/tablet-only chrome for the admin panel. The desktop sidebar in
 * layout.tsx stays exactly as it was — this component renders ONLY when
 * the viewport is below `lg`, and provides:
 *   • a sticky top strip with hamburger + brand + quick sign-out
 *   • a slide-in drawer triggered by the hamburger, which mirrors the
 *     desktop sidebar's links + admin identity card + sign-out
 *
 * The drawer auto-closes on route change so tapping a link feels like
 * native navigation.
 */
export default function AdminMobileNav({
  adminName,
  initials,
  links,
  roleLabel,
}: Props) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

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
      <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-ink text-cream-50 border-b border-white/10 shadow-sm">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvri navigasyon admin"
          className="grid place-items-center w-10 h-10 rounded-lg bg-white/10 hover:bg-white/15 text-white transition"
        >
          <Menu className="w-5 h-5" strokeWidth={2.2} />
        </button>

        <Link
          href="/admin"
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-accent-gradient text-white shrink-0">
            <Leaf className="w-4 h-4" strokeWidth={2.4} />
          </span>
          <span className="flex flex-col leading-tight min-w-0">
            <span className="font-bold text-white text-sm truncate">
              Admin Panel
            </span>
            <span className="text-[10px] uppercase tracking-[0.16em] text-white/55 font-medium truncate">
              {adminName}
            </span>
          </span>
        </Link>

        <form action={adminSignOut}>
          <button
            type="submit"
            aria-label="Dekonèkte"
            className="grid place-items-center w-10 h-10 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 hover:text-rose-100 border border-rose-500/30 transition"
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
            className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm animate-fadeIn"
          />

          {/* Drawer */}
          <aside
            className="lg:hidden fixed left-0 top-0 bottom-0 w-72 max-w-[85vw] z-50 bg-ink text-white/80 flex flex-col shadow-2xl animate-slideInLeft"
            role="dialog"
            aria-modal="true"
            aria-label="Navigasyon admin"
          >
            {/* Brand row */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between gap-2">
              <Link
                href="/admin"
                className="flex items-center gap-2 min-w-0"
                onClick={() => setOpen(false)}
              >
                <span className="grid place-items-center w-9 h-9 rounded-xl bg-accent-gradient text-white shadow shrink-0">
                  <Leaf className="w-4 h-4" strokeWidth={2.4} />
                </span>
                <span className="flex flex-col leading-tight min-w-0">
                  <span className="font-bold text-white truncate">
                    Admin Panel
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-white/55 font-medium truncate">
                    MedikaPlant
                  </span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fèmen"
                className="grid place-items-center w-9 h-9 rounded-lg bg-white/10 hover:bg-white/15 text-white shrink-0 transition"
              >
                <X className="w-4 h-4" strokeWidth={2.2} />
              </button>
            </div>

            {/* Admin identity */}
            <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2.5">
              <span className="grid place-items-center w-10 h-10 rounded-full bg-white/10 text-cream-50 font-display font-bold text-sm shrink-0">
                {initials}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">
                  {adminName}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-white/50 font-bold">
                  {roleLabel}
                </div>
              </div>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {links.map(({ href, label, icon: Icon }) => {
                const active =
                  pathname === href ||
                  (href !== '/admin' && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition',
                      active
                        ? 'bg-accent text-white shadow-sm'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Icon className="w-4 h-4" strokeWidth={2} />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Sign-out */}
            <div className="p-3 border-t border-white/10">
              <form action={adminSignOut}>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold text-rose-100 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 hover:border-rose-500/50 w-full transition"
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
