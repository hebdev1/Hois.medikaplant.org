import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Bell,
  BookOpen,
  Activity,
  MessageCircle,
  MessagesSquare,
  type LucideIcon,
} from 'lucide-react';

export type AdminNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/**
 * Single source of truth for the admin navigation. Imported by:
 *   • app/admin/(protected)/layout.tsx       (desktop sidebar)
 *   • app/admin/(protected)/admin-mobile-nav.tsx (mobile drawer)
 */
export const ADMIN_NAV_LINKS: readonly AdminNavLink[] = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/health', label: 'Swivi Sante', icon: Activity },
  { href: '/admin/support', label: 'Sipò chat', icon: MessageCircle },
  { href: '/admin/forum', label: 'Fowòm', icon: MessagesSquare },
  { href: '/admin/resources', label: 'Resources', icon: FileText },
  { href: '/admin/guides', label: 'Guides', icon: BookOpen },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
];
