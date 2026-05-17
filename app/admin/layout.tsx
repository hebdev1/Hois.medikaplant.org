import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Leaf, LayoutDashboard, Users, FileText, CreditCard, Bell, LogOut, ArrowLeft } from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login?redirect=/admin');

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  const profile = profileRaw as { role: 'user' | 'admin' } | null;

  if (profile?.role !== 'admin') redirect('/dashboard');

  const links = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/resources', label: 'Resources', icon: FileText },
    { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
    { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-ink text-white/80 h-screen sticky top-0">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
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
        <nav className="flex-1 px-3 py-4 space-y-1">
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
        <div className="p-3 border-t border-white/10 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 w-full transition"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            Back to user dashboard
          </Link>
        </div>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
