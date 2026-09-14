import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import { Leaf, LogOut } from 'lucide-react';
import { adminSignOut } from '../login/actions';
import {
  groupedNavForRole,
  ADMIN_ROLE_LABEL,
  type AdminRole,
} from './admin-nav-config';
import AdminMobileNav from './admin-mobile-nav';
import AdminNotificationBell from './admin-notification-bell';

export const dynamic = 'force-dynamic';

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const user = await getCurrentUser();

  if (!user) redirect('/admin/login');

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role, admin_role, first_name, last_name, email, avatar_url')
    .eq('id', user.id)
    .maybeSingle();
  const profile = profileRaw as {
    role: 'user' | 'admin';
    admin_role: AdminRole | null;
    first_name: string | null;
    last_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;

  if (!profile || profile.role !== 'admin') {
    redirect('/admin/login?error=not_admin');
  }

  const adminName =
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    profile.email.split('@')[0];
  const initials = (profile.first_name?.[0] ?? profile.email[0] ?? 'A').toUpperCase();
  const nav = groupedNavForRole(profile.admin_role);
  const roleLabel = profile.admin_role
    ? ADMIN_ROLE_LABEL[profile.admin_role]
    : 'Administratè';

  return (
    // translate="no" + notranslate: Google Translate mutates text nodes
    // in ways React can't reconcile — realtime-state components (bell,
    // drawer, forms) crash with "Failed to execute 'insertBefore' on
    // 'Node'". Admin panel is Kreyòl-only anyway.
    <div
      translate="no"
      className="notranslate min-h-screen bg-slate-50 lg:flex"
    >
      {/* ── Mobile-only top strip + drawer (hidden lg+) ──────────────── */}
      <AdminMobileNav
        adminName={adminName}
        initials={initials}
        adminRole={profile.admin_role}
        roleLabel={roleLabel}
        adminId={user.id}
      />

      {/* ── Desktop sidebar (hidden below lg) ────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-ink text-white/80 h-screen sticky top-0">
        <div className="p-6 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-accent-gradient text-white shadow">
              <Leaf className="w-4 h-4" strokeWidth={2.4} />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-bold text-white">Admin Panel</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/60 font-medium">
                MedikaPlant
              </span>
            </span>
          </Link>
        </div>

        {/* Admin identity */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
          <span className="grid place-items-center w-9 h-9 rounded-full bg-white/10 text-cream-50 font-display font-bold text-sm">
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

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {/* Standalone Dashboard link */}
          {nav.top.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-white hover:bg-white/10 transition mb-1"
            >
              <Icon className="w-4 h-4" strokeWidth={2} />
              {label}
            </Link>
          ))}

          {/* Grouped sections */}
          {nav.sections.map((section) => (
            <div key={section.id} className="mt-4">
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
                {section.label}
              </div>
              <div className="space-y-0.5">
                {section.links.map(({ href, label, icon: Icon, soon }) =>
                  soon ? (
                    <span
                      key={`${section.id}-${label}`}
                      aria-disabled="true"
                      title="Byento"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/30 cursor-default select-none"
                    >
                      <Icon className="w-4 h-4" strokeWidth={2} />
                      <span className="flex-1 truncate">{label}</span>
                      <span className="text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-white/45">
                        Byento
                      </span>
                    </span>
                  ) : (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition"
                    >
                      <Icon className="w-4 h-4" strokeWidth={2} />
                      {label}
                    </Link>
                  )
                )}
              </div>
            </div>
          ))}
        </nav>

        {/* Sign-out, now visually distinct with a tinted red background */}
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

      <div className="flex-1 min-w-0">
        {/* ── Desktop topbar (hidden below lg) ─────────────────────── */}
        <header className="hidden lg:flex items-center justify-end gap-3 px-6 lg:px-10 py-3 bg-slate-50/85 backdrop-blur-md border-b border-cream-200 sticky top-0 z-20">
          <AdminNotificationBell adminId={user.id} />
        </header>
        {children}
      </div>
    </div>
  );
}
