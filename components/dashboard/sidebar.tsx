'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, LayoutDashboard, FileText, HeartPulse, Bell, Settings, LogOut, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Props = {
  isAdmin?: boolean;
};

const USER_LINKS = [
  { href: '/dashboard', label: 'Akèy', icon: LayoutDashboard },
  { href: '/dashboard/resources', label: 'Resous', icon: FileText },
  { href: '/dashboard/health', label: 'Sante', icon: HeartPulse },
  { href: '/dashboard/notifications', label: 'Notifikasyon', icon: Bell },
  { href: '/dashboard/settings', label: 'Paramèt', icon: Settings },
];

export default function Sidebar({ isAdmin }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function onSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-slate-200 h-screen sticky top-0">
      <div className="p-6 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-gradient text-white shadow">
            <Leaf className="w-4 h-4" strokeWidth={2.4} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-bold text-ink">MedikaPlant</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-brand-700 font-medium">
              Hoïs Inivèsite
            </span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {USER_LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-ink-muted hover:text-ink hover:bg-slate-50'
              )}
            >
              <Icon className="w-4 h-4" strokeWidth={2} />
              {label}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition mt-4',
              pathname.startsWith('/admin')
                ? 'bg-accent/10 text-accent'
                : 'text-accent hover:bg-accent/5'
            )}
          >
            <Shield className="w-4 h-4" strokeWidth={2} />
            Admin Dashboard
          </Link>
        )}
      </nav>

      <div className="p-3 border-t border-slate-100">
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ink-muted hover:text-red-600 hover:bg-red-50 w-full transition"
        >
          <LogOut className="w-4 h-4" strokeWidth={2} />
          Dekonekte
        </button>
      </div>
    </aside>
  );
}
