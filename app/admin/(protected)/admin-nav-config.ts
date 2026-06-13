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
  Sparkles,
  Link2,
  Award,
  Inbox,
  Layers,
  CalendarRange,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react';

/**
 * Sub-roles inside the admin panel. The DB-side enum lives in
 * profiles.admin_role (migration 038). Mirroring the enum here lets us
 * compute capabilities on the client without an extra fetch.
 *
 * Hierarchy / intent:
 *   super_admin → everything, plus user/role/persona management
 *   admin       → near-full operational access, but cannot grant roles
 *   support     → support chat + read-only user list
 *   moderator   → forum + support
 *   content     → guides + resources + notifications
 */
export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'support'
  | 'moderator'
  | 'content';

export type AdminCapability =
  | 'overview'
  | 'manage_users'
  | 'manage_admins'
  | 'view_health'
  | 'reply_support'
  | 'moderate_forum'
  | 'manage_resources'
  | 'manage_guides'
  | 'manage_subscriptions'
  | 'broadcast_notifications'
  | 'manage_advice'
  | 'manage_badges'
  | 'manage_contact'
  | 'view_segments'
  | 'manage_programs'
  | 'view_hubspot'
  | 'manage_self';

/**
 * Which capabilities each admin role unlocks. Used by the layout to filter
 * the sidebar, and by server actions to short-circuit unauthorised calls.
 * Keep in sync with admin_has_capability() in the database (migration 038).
 */
export const ROLE_CAPABILITIES: Record<AdminRole, ReadonlySet<AdminCapability>> = {
  super_admin: new Set<AdminCapability>([
    'overview',
    'manage_users',
    'manage_admins',
    'view_health',
    'reply_support',
    'moderate_forum',
    'manage_resources',
    'manage_guides',
    'manage_subscriptions',
    'broadcast_notifications',
    'manage_advice',
    'manage_badges',
    'manage_contact',
    'view_segments',
    'manage_programs',
    'view_hubspot',
    'manage_self',
  ]),
  admin: new Set<AdminCapability>([
    'overview',
    'manage_users',
    'view_health',
    'reply_support',
    'moderate_forum',
    'manage_resources',
    'manage_guides',
    'manage_subscriptions',
    'broadcast_notifications',
    'manage_advice',
    'manage_badges',
    'manage_contact',
    'view_segments',
    'manage_programs',
    'view_hubspot',
    'manage_self',
  ]),
  support: new Set<AdminCapability>([
    'overview',
    'manage_users',
    'reply_support',
    'manage_contact',
    'manage_self',
  ]),
  moderator: new Set<AdminCapability>([
    'overview',
    'reply_support',
    'moderate_forum',
    'manage_self',
  ]),
  content: new Set<AdminCapability>([
    'overview',
    'manage_resources',
    'manage_guides',
    'manage_advice',
    'manage_badges',
    'broadcast_notifications',
    'manage_self',
  ]),
};

export const ADMIN_ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  support: 'Sipò chat',
  moderator: 'Modeyatè fowòm',
  content: 'Editè kontni',
};

export const ADMIN_ROLE_DESCRIPTION: Record<AdminRole, string> = {
  super_admin:
    'Aksè total — ka jere wòl tout admin, plan, abònman, ak tout done.',
  admin:
    'Aksè operasyonèl konplè, men pa ka chanje wòl yon admin oswa pwomote yon manm an admin.',
  support: 'Ka reponn sipò chat yo epi konsilte manm yo (lekti sèlman).',
  moderator: 'Ka modere fowòm an epi reponn sipò chat.',
  content: 'Ka kreye/edit gid, resous, ak voye notifikasyon.',
};

export function hasCapability(
  role: AdminRole | null | undefined,
  capability: AdminCapability
): boolean {
  if (!role) return false;
  return ROLE_CAPABILITIES[role].has(capability);
}

export type AdminNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  capability: AdminCapability;
};

/**
 * Single source of truth for the admin navigation. Imported by:
 *   • app/admin/(protected)/layout.tsx       (desktop sidebar)
 *   • app/admin/(protected)/admin-mobile-nav.tsx (mobile drawer)
 *
 * Each link declares the capability it needs; the layout filters down to
 * just what the signed-in admin can use.
 */
export const ADMIN_NAV_LINKS: readonly AdminNavLink[] = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, capability: 'overview' },
  { href: '/admin/users', label: 'Users', icon: Users, capability: 'manage_users' },
  { href: '/admin/segments', label: 'Segman maladi', icon: Layers, capability: 'view_segments' },
  { href: '/admin/programs', label: 'Plan + Tach 1-30', icon: CalendarRange, capability: 'manage_programs' },
  { href: '/admin/health', label: 'Swivi Sante', icon: Activity, capability: 'view_health' },
  { href: '/admin/support', label: 'Sipò chat', icon: MessageCircle, capability: 'reply_support' },
  { href: '/admin/contact', label: 'Mesaj kontak', icon: Inbox, capability: 'manage_contact' },
  { href: '/admin/forum', label: 'Fowòm', icon: MessagesSquare, capability: 'moderate_forum' },
  { href: '/admin/resources', label: 'Resources', icon: FileText, capability: 'manage_resources' },
  { href: '/admin/guides', label: 'Guides', icon: BookOpen, capability: 'manage_guides' },
  { href: '/admin/advice', label: 'Konsèy jou a', icon: Sparkles, capability: 'manage_advice' },
  { href: '/admin/badges', label: 'Badj', icon: Award, capability: 'manage_badges' },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard, capability: 'manage_subscriptions' },
  { href: '/admin/hubspot', label: 'HubSpot CRM', icon: Link2, capability: 'view_hubspot' },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell, capability: 'broadcast_notifications' },
  { href: '/admin/settings', label: 'Paramèt', icon: SettingsIcon, capability: 'manage_self' },
];

export function navLinksForRole(role: AdminRole | null | undefined): AdminNavLink[] {
  // No admin_role assigned yet → behave like 'admin' so legacy accounts
  // (pre-migration-038) still see the full menu until a super_admin tunes
  // them down.
  const effective: AdminRole = role ?? 'admin';
  return ADMIN_NAV_LINKS.filter((l) => hasCapability(effective, l.capability));
}
