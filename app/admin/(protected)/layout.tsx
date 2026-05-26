import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Leaf, LogOut } from 'lucide-react';
import { adminSignOut } from '../login/actions';
import {
  navLinksForRole,
  ADMIN_ROLE_LABEL,
  type AdminRole,
} from './admin-nav-config';
import AdminMobileNav from './admin-mobile-nav';

export const dynamic = 'force-dynamic';

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  const links = navLinksForRole(profile.admin_role);
  const roleLabel = profile.admin_role
    ? ADMIN_ROLE_LABEL[profile.admin_role]
    : 'Administratè';

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* ── Mobile-only top strip + drawer (hidden lg+) ──────────────── */}
      <AdminMobileNav
        adminName={adminName}
        initials={initials}
        visibleHrefs={links.map((l) => l.href)}
        roleLabel={roleLabel}
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

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition"
            >
              <Icon className="w-4 h-4" strokeWidth={2} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Sign-out — now visually distinct with a tinted red background */}
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

      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
