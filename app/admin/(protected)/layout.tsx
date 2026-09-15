import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import { ADMIN_ROLE_LABEL, type AdminRole } from './admin-nav-config';
import AdminSidebar from './admin-sidebar';
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
      className="notranslate min-h-screen bg-cream-50 lg:flex"
    >
      {/* ── Mobile-only top strip + drawer (hidden lg+) ──────────────── */}
      <AdminMobileNav
        adminName={adminName}
        initials={initials}
        adminRole={profile.admin_role}
        roleLabel={roleLabel}
        adminId={user.id}
      />

      {/* ── Desktop collapsible sidebar (hidden below lg) ────────────── */}
      <AdminSidebar
        adminName={adminName}
        initials={initials}
        roleLabel={roleLabel}
        adminRole={profile.admin_role}
      />

      <div className="flex-1 min-w-0">
        {/* ── Desktop topbar (hidden below lg) ─────────────────────── */}
        <header className="hidden lg:flex items-center justify-end gap-3 px-6 lg:px-10 py-3 bg-cream-50/85 backdrop-blur-md border-b border-cream-200 sticky top-0 z-20">
          <AdminNotificationBell adminId={user.id} />
        </header>
        {children}
      </div>
    </div>
  );
}
