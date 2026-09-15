import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Bell,
  BookOpen,
  Leaf,
  Sprout,
  Activity,
  MessageCircle,
  MessagesSquare,
  Sparkles,
  Link2,
  Award,
  Inbox,
  Layers,
  CalendarRange,
  FolderKanban,
  GraduationCap,
  FlaskConical,
  Lightbulb,
  Image as ImageIcon,
  Settings as SettingsIcon,
  Video,
  PanelsTopLeft,
  ListTree,
  Search,
  ShieldCheck,
  KeyRound,
  ScrollText,
  Database,
  ShoppingBag,
  Ticket,
  Images,
  ArrowRightLeft,
  Newspaper,
  Clapperboard,
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
  | 'manage_courses'
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
    'manage_courses',
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
    'manage_courses',
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
    'manage_courses',
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
    'Aksè total, ka jere wòl tout admin, plan, abònman, ak tout done.',
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

/**
 * CMS sidebar groups (WordPress-style). Order here is the render order.
 * `overview` is rendered standalone above the groups, not inside one.
 */
export type AdminNavGroup =
  | 'content'
  | 'media'
  | 'design'
  | 'community'
  | 'commerce'
  | 'seo'
  | 'users'
  | 'system';

export const ADMIN_NAV_GROUPS: { id: AdminNavGroup; label: string }[] = [
  { id: 'content', label: 'Kontni' },
  { id: 'media', label: 'Medya' },
  { id: 'design', label: 'Konsepsyon' },
  { id: 'community', label: 'Kominote' },
  { id: 'commerce', label: 'Komès' },
  { id: 'seo', label: 'SEO' },
  { id: 'users', label: 'Itilizatè & Wòl' },
  { id: 'system', label: 'Sistèm' },
];

export type AdminNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  capability: AdminCapability;
  /** Which CMS group this link lives under. */
  group: AdminNavGroup;
  /** Planned-but-not-built section: shown disabled with a "Byento" tag. */
  soon?: boolean;
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
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, capability: 'overview', group: 'content' },

  // ── Kontni ──────────────────────────────────────────────────────────
  { href: '/admin/pages', label: 'Paj', icon: FileText, capability: 'manage_guides', group: 'content' },
  { href: '/admin/articles', label: 'Atik', icon: Newspaper, capability: 'manage_guides', group: 'content' },
  { href: '/admin/videos', label: 'Videyo', icon: Video, capability: 'manage_guides', group: 'content' },
  { href: '/admin/lakou', label: 'Lakou Limyè', icon: Clapperboard, capability: 'manage_guides', group: 'content' },
  { href: '/admin/laboratwa', label: 'Laboratwa', icon: Sprout, capability: 'manage_guides', group: 'content' },
  { href: '/admin/glose', label: 'Glosè plant', icon: Leaf, capability: 'manage_guides', group: 'content' },
  { href: '/admin/doz', label: 'Resèt ak Dòz', icon: FlaskConical, capability: 'manage_guides', group: 'content' },
  { href: '/admin/programs', label: 'Pwotokòl', icon: FolderKanban, capability: 'manage_programs', group: 'content' },
  { href: '/admin/guides', label: 'Gid', icon: BookOpen, capability: 'manage_guides', group: 'content' },
  { href: '/admin/resources', label: 'Resous', icon: FileText, capability: 'manage_resources', group: 'content' },
  { href: '/admin/klas', label: 'Kou (Klas)', icon: GraduationCap, capability: 'manage_courses', group: 'content' },
  { href: '/admin/kesyon', label: 'Kesyon kou', icon: MessagesSquare, capability: 'manage_courses', group: 'content' },
  { href: '/admin/advice', label: 'Konsèy jou a', icon: Sparkles, capability: 'manage_advice', group: 'content' },

  // ── Medya ───────────────────────────────────────────────────────────
  { href: '/admin/media', label: 'Bibliyotèk Medya', icon: Images, capability: 'manage_resources', group: 'media' },
  { href: '/admin/imaj', label: 'Imaj paj dakèy', icon: ImageIcon, capability: 'manage_resources', group: 'media' },

  // ── Konsepsyon ──────────────────────────────────────────────────────
  { href: '/admin/menus', label: 'Meni, Header & Footer', icon: ListTree, capability: 'manage_guides', group: 'design' },
  { href: '/admin/templates', label: 'Modèl', icon: Layers, capability: 'manage_guides', group: 'design' },

  // ── Kominote ────────────────────────────────────────────────────────
  // Swivi Sante hosts Pasyan/Segman/Plan under tabs at /admin/health?tab=…
  { href: '/admin/health', label: 'Swivi Sante', icon: Activity, capability: 'view_health', group: 'community' },
  { href: '/admin/support', label: 'Sipò chat', icon: MessageCircle, capability: 'reply_support', group: 'community' },
  { href: '/admin/contact', label: 'Mesaj kontak', icon: Inbox, capability: 'manage_contact', group: 'community' },
  { href: '/admin/forum', label: 'Fowòm', icon: MessagesSquare, capability: 'moderate_forum', group: 'community' },
  { href: '/admin/suggestions', label: 'Sijesyon manm', icon: Lightbulb, capability: 'manage_self', group: 'community' },
  { href: '/admin/badges', label: 'Badj', icon: Award, capability: 'manage_badges', group: 'community' },

  // ── Komès ───────────────────────────────────────────────────────────
  { href: '/admin/subscriptions', label: 'Abònman & Plan', icon: CreditCard, capability: 'manage_subscriptions', group: 'commerce' },
  { href: '/admin/products', label: 'Pwodwi Shop', icon: ShoppingBag, capability: 'manage_subscriptions', group: 'commerce' },
  { href: '/admin/coupons', label: 'Koupon', icon: Ticket, capability: 'manage_subscriptions', group: 'commerce' },
  { href: '/admin/hubspot', label: 'HubSpot CRM', icon: Link2, capability: 'view_hubspot', group: 'commerce' },

  // ── SEO ─────────────────────────────────────────────────────────────
  { href: '/admin/seo', label: 'SEO / Metadata', icon: Search, capability: 'manage_guides', group: 'seo' },
  { href: '/admin/redirects', label: 'Redireksyon', icon: ArrowRightLeft, capability: 'manage_resources', group: 'seo' },

  // ── Itilizatè & Wòl ─────────────────────────────────────────────────
  { href: '/admin/users', label: 'Itilizatè', icon: Users, capability: 'manage_users', group: 'users' },

  // ── Sistèm ──────────────────────────────────────────────────────────
  { href: '/admin/notifications', label: 'Notifikasyon', icon: Bell, capability: 'broadcast_notifications', group: 'system' },
  { href: '/admin/audit', label: 'Jounal odit', icon: ScrollText, capability: 'manage_admins', group: 'system' },
  { href: '/admin/backup', label: 'Backup', icon: Database, capability: 'manage_admins', group: 'system' },
  { href: '/admin/settings', label: 'Paramèt', icon: SettingsIcon, capability: 'manage_self', group: 'system' },
];

/**
 * Planned CMS sections not built yet. Rendered disabled ("Byento") so the
 * full CMS structure is visible and the roadmap is obvious. As each is
 * built, move it into ADMIN_NAV_LINKS with a real href.
 */
export const ADMIN_NAV_SOON: readonly AdminNavLink[] = [
  { href: '#', label: 'Temwayaj', icon: MessagesSquare, capability: 'manage_resources', group: 'content', soon: true },

  { href: '#', label: 'Page Builder', icon: PanelsTopLeft, capability: 'manage_admins', group: 'design', soon: true },

  { href: '#', label: 'Konsiltasyon', icon: CalendarRange, capability: 'manage_subscriptions', group: 'commerce', soon: true },

  { href: '#', label: 'Wòl & Pèmisyon', icon: ShieldCheck, capability: 'manage_admins', group: 'users', soon: true },
  { href: '#', label: 'Sesyon aktif', icon: KeyRound, capability: 'manage_admins', group: 'users', soon: true },

];

export function navLinksForRole(role: AdminRole | null | undefined): AdminNavLink[] {
  // No admin_role assigned yet → behave like 'admin' so legacy accounts
  // (pre-migration-038) still see the full menu until a super_admin tunes
  // them down.
  const effective: AdminRole = role ?? 'admin';
  return ADMIN_NAV_LINKS.filter((l) => hasCapability(effective, l.capability));
}

export type AdminNavSection = {
  id: AdminNavGroup;
  label: string;
  links: AdminNavLink[];
};

/**
 * The sidebar as the CMS renders it: a standalone Dashboard link on top,
 * then each group (in ADMIN_NAV_GROUPS order) holding the real links this
 * role can use plus any "Byento" placeholders they'd eventually own. Empty
 * groups are dropped so lesser roles never see hollow headers.
 */
export function groupedNavForRole(role: AdminRole | null | undefined): {
  top: AdminNavLink[];
  sections: AdminNavSection[];
} {
  const effective: AdminRole = role ?? 'admin';
  const visible = (l: AdminNavLink) => hasCapability(effective, l.capability);
  const real = ADMIN_NAV_LINKS.filter(visible);
  const soon = ADMIN_NAV_SOON.filter(visible);

  const top = real.filter((l) => l.href === '/admin');

  const sections = ADMIN_NAV_GROUPS.map(({ id, label }) => ({
    id,
    label,
    links: [
      ...real.filter((l) => l.group === id && l.href !== '/admin'),
      ...soon.filter((l) => l.group === id),
    ],
  })).filter((s) => s.links.length > 0);

  return { top, sections };
}
