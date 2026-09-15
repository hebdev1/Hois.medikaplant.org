'use client';

// Desktop admin sidebar — a collapsible rail (w-64 ↔ w-16) in the Hoïs
// palette. Adapted from the "collapsible dashboard sidebar" pattern, but
// wired to the real grouped CMS nav, the real Hoïs logo, and the signed-in
// admin's identity. Collapse state persists in localStorage so it survives
// navigation and reloads. Renders only at lg+ (mobile uses AdminMobileNav).

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronsRight, LogOut, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { groupedNavForRole, type AdminRole } from './admin-nav-config';
import { adminSignOut } from '../login/actions';
import BrandLogo from '@/components/ui/brand-logo';

const STORAGE_KEY = 'hois:admin:sidebar-open';

export default function AdminSidebar({
  adminName,
  initials,
  roleLabel,
  adminRole,
}: {
  adminName: string;
  initials: string;
  roleLabel: string;
  adminRole: AdminRole | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(true);

  // Sync the persisted preference after mount (start open to avoid a
  // hydration mismatch; snap to the saved value once we can read storage).
  React.useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === '0') setOpen(false);
    } catch {
      /* storage blocked — stay with the default */
    }
  }, []);

  function toggle() {
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

  const nav = React.useMemo(() => groupedNavForRole(adminRole), [adminRole]);

  const isActive = (href: string) =>
    href === '/admin'
      ? pathname === '/admin'
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col shrink-0 h-screen sticky top-0 z-30',
        'bg-white border-r border-cream-200 shadow-sm',
        'transition-[width] duration-300 ease-in-out',
        open ? 'w-64' : 'w-16'
      )}
    >
      {/* Brand */}
      <div className="border-b border-cream-200 p-3">
        <Link
          href="/admin"
          className={cn(
            'flex items-center rounded-lg p-1.5 hover:bg-cream-100 transition',
            open ? 'gap-2.5' : 'justify-center'
          )}
          title={!open ? 'Panèl Admin · MedikaPlant' : undefined}
        >
          {open ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-hois.png" alt="Hoïs" className="h-9 w-auto shrink-0" />
              <span className="flex flex-col leading-tight min-w-0">
                <span className="font-display font-bold text-ink text-sm truncate">
                  Panèl Admin
                </span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-earth-500 font-semibold truncate">
                  MedikaPlant
                </span>
              </span>
            </>
          ) : (
            <BrandLogo size={34} className="shrink-0" />
          )}
        </Link>
      </div>

      {/* Signed-in admin */}
      <div
        className={cn(
          'border-b border-cream-200 flex items-center',
          open ? 'gap-2.5 px-4 py-3' : 'justify-center py-3'
        )}
      >
        <span
          className="grid place-items-center w-9 h-9 rounded-full bg-forest-100 text-forest-800 font-display font-bold text-sm shrink-0"
          title={!open ? `${adminName} · ${roleLabel}` : undefined}
        >
          {initials}
        </span>
        {open && (
          <div className="min-w-0">
            <div className="text-sm font-semibold text-ink truncate">{adminName}</div>
            <div className="text-[10px] uppercase tracking-wide text-earth-500 font-bold">
              {roleLabel}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
        {nav.top.map((link) => (
          <NavItem
            key={link.href}
            href={link.href}
            label={link.label}
            Icon={link.icon}
            open={open}
            active={isActive(link.href)}
          />
        ))}

        {nav.sections.map((section) => (
          <div key={section.id} className="mt-4 first:mt-3">
            {open ? (
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-earth-400">
                {section.label}
              </div>
            ) : (
              <div className="mx-2 mb-2 border-t border-cream-200" aria-hidden />
            )}
            <div className="space-y-0.5">
              {section.links.map((link) => (
                <NavItem
                  key={link.soon ? `${section.id}-${link.label}` : link.href}
                  href={link.href}
                  label={link.label}
                  Icon={link.icon}
                  open={open}
                  active={!link.soon && isActive(link.href)}
                  soon={link.soon}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div className="border-t border-cream-200 p-2">
        <form action={adminSignOut}>
          <button
            type="submit"
            title={!open ? 'Dekonèkte' : undefined}
            className={cn(
              'flex items-center rounded-lg text-sm font-bold text-rose-700 hover:bg-rose-50 transition w-full',
              open ? 'gap-2 px-3 py-2.5' : 'justify-center py-2.5'
            )}
          >
            <LogOut className="w-4 h-4 shrink-0" strokeWidth={2.2} />
            {open && 'Dekonèkte'}
          </button>
        </form>
      </div>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={toggle}
        aria-label={open ? 'Kache meni an' : 'Ouvri meni an'}
        aria-expanded={open}
        className="border-t border-cream-200 hover:bg-cream-100 transition"
      >
        <div className={cn('flex items-center py-3', open ? 'px-3 gap-2' : 'justify-center')}>
          <ChevronsRight
            className={cn(
              'w-4 h-4 text-earth-500 transition-transform duration-300',
              open && 'rotate-180'
            )}
            strokeWidth={2.2}
          />
          {open && <span className="text-sm font-medium text-earth-600">Kache meni an</span>}
        </div>
      </button>
    </aside>
  );
}

function NavItem({
  href,
  label,
  Icon,
  open,
  active,
  soon,
}: {
  href: string;
  label: string;
  Icon: LucideIcon;
  open: boolean;
  active?: boolean;
  soon?: boolean;
}) {
  if (soon) {
    return (
      <span
        aria-disabled="true"
        title={!open ? `${label} (Byento)` : undefined}
        className={cn(
          'flex items-center rounded-lg text-sm font-medium text-earth-400 cursor-default select-none',
          open ? 'gap-3 px-3 py-2' : 'justify-center py-2.5'
        )}
      >
        <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
        {open && (
          <>
            <span className="flex-1 truncate">{label}</span>
            <span className="text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cream-200 text-earth-500">
              Byento
            </span>
          </>
        )}
      </span>
    );
  }

  return (
    <Link
      href={href}
      title={!open ? label : undefined}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center rounded-lg text-sm transition',
        open ? 'gap-3 px-3 py-2' : 'justify-center py-2.5',
        active
          ? 'bg-forest-50 text-forest-800 font-semibold'
          : 'text-earth-600 font-medium hover:bg-cream-100 hover:text-ink'
      )}
    >
      <Icon
        className={cn('w-4 h-4 shrink-0', active ? 'text-forest-700' : '')}
        strokeWidth={2}
      />
      {open && <span className="truncate">{label}</span>}
    </Link>
  );
}
