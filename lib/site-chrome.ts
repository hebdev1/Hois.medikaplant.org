// Public site chrome (header nav + announcement + footer) resolved from the
// CMS (nav_items + site_settings) with a module-level TTL cache — same cheap
// anon-REST pattern as lib/redirects.ts, no per-request DB round-trip.
//
// SAFETY: every field falls back to the hard-coded DEFAULTS below (the site's
// current chrome). An empty table, a failed fetch, or missing env vars all
// resolve to DEFAULTS, so the live header/footer can never render blank.

export type ChromeLink = { label: string; url: string; target: '_self' | '_blank' };
export type ChromeColumn = { title: string; links: ChromeLink[] };
export type SiteChrome = {
  announcement: { active: boolean; text: string; ctaLabel: string; ctaHref: string };
  headerNav: ChromeLink[];
  footerColumns: ChromeColumn[];
  footerTagline: string;
  socials: { facebook: string; instagram: string; youtube: string; email: string };
};

// ── Defaults = the site's current hard-coded chrome ─────────────────────────
export const DEFAULT_CHROME: SiteChrome = {
  announcement: {
    active: true,
    text: 'Vin enskri kòm manb jodi a pou w ka tou benefisye nan rabè sa a.',
    ctaLabel: 'Wè pri yo',
    ctaHref: '/#pri',
  },
  headerNav: [
    { label: 'Akèy', url: 'https://www.hoismedikaplant.com', target: '_self' },
    { label: 'Boutik', url: 'https://www.medikaplantshop.com', target: '_blank' },
    { label: 'Glosè', url: '/glose', target: '_self' },
    { label: 'Laboratwa', url: '/laboratwa', target: '_self' },
    { label: 'Istwa', url: '/#istwa', target: '_self' },
    { label: 'HOÏS', url: '/#hois', target: '_self' },
    { label: 'Pri', url: '/#pri', target: '_self' },
  ],
  footerColumns: [
    {
      title: 'Pwodui',
      links: [
        { label: 'Medikaplant', url: 'https://medikaplant.org/', target: '_self' },
        { label: 'Boutik', url: 'https://medikaplantshop.com', target: '_self' },
        { label: 'Konsiltasyon', url: 'https://medikaplantshop.com/consultation', target: '_self' },
      ],
    },
    {
      title: 'Hoïs Inivèsite',
      links: [
        { label: 'Plan VIP', url: '/#pri', target: '_self' },
        { label: 'Fòmasyon', url: '#', target: '_self' },
        { label: 'Blòg', url: '#', target: '_self' },
        { label: 'Evènman', url: '#', target: '_self' },
      ],
    },
    {
      title: 'Konpayi',
      links: [
        { label: 'Istwa nou', url: '/istwa-nou', target: '_self' },
        { label: 'Kontak', url: '/kontak', target: '_self' },
        { label: 'Klas', url: '/klas', target: '_self' },
        { label: 'Glosè plant', url: '/glose', target: '_self' },
        { label: 'Laboratwa', url: '/laboratwa', target: '_self' },
        { label: 'Konfidansyalite', url: '/konfidansyalite', target: '_self' },
      ],
    },
  ],
  footerTagline:
    'Platfòm natiropatik #1 nan kominote Ayisyèn nan, yon pon ant medsin tradisyonèl ak teknoloji modèn pou byennèt total ou.',
  socials: {
    facebook: 'https://www.facebook.com/medikaplant/?locale=fr_FR',
    instagram: 'https://www.instagram.com/medikaplant/',
    youtube: 'https://www.youtube.com/@medikaplant',
    email: 'mailto:plant@medikaplant.org',
  },
};

type NavRow = {
  location: 'header' | 'footer';
  group_title: string | null;
  label: string;
  url: string;
  target: '_self' | '_blank';
  display_order: number;
};
type SettingsRow = {
  announcement_active: boolean | null;
  announcement_text: string | null;
  announcement_cta_label: string | null;
  announcement_cta_href: string | null;
  footer_tagline: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_youtube: string | null;
  social_email: string | null;
};

let cache: { chrome: SiteChrome; at: number } | null = null;
const TTL_MS = 60_000;

function buildChrome(nav: NavRow[], s: SettingsRow | null): SiteChrome {
  const headerNav: ChromeLink[] = nav
    .filter((r) => r.location === 'header')
    .map((r) => ({ label: r.label, url: r.url, target: r.target }));

  // Group footer rows into columns, preserving first-seen order.
  const colOrder: string[] = [];
  const colMap = new Map<string, ChromeLink[]>();
  for (const r of nav.filter((x) => x.location === 'footer')) {
    const key = r.group_title || 'Lyen';
    if (!colMap.has(key)) {
      colMap.set(key, []);
      colOrder.push(key);
    }
    colMap.get(key)!.push({ label: r.label, url: r.url, target: r.target });
  }
  const footerColumns: ChromeColumn[] = colOrder.map((title) => ({
    title,
    links: colMap.get(title)!,
  }));

  const pick = (v: string | null | undefined, fb: string) =>
    v && v.trim() ? v : fb;

  return {
    announcement: s
      ? {
          active: s.announcement_active ?? DEFAULT_CHROME.announcement.active,
          text: pick(s.announcement_text, DEFAULT_CHROME.announcement.text),
          ctaLabel: pick(s.announcement_cta_label, DEFAULT_CHROME.announcement.ctaLabel),
          ctaHref: pick(s.announcement_cta_href, DEFAULT_CHROME.announcement.ctaHref),
        }
      : DEFAULT_CHROME.announcement,
    headerNav: headerNav.length ? headerNav : DEFAULT_CHROME.headerNav,
    footerColumns: footerColumns.length ? footerColumns : DEFAULT_CHROME.footerColumns,
    footerTagline: pick(s?.footer_tagline, DEFAULT_CHROME.footerTagline),
    socials: {
      facebook: pick(s?.social_facebook, DEFAULT_CHROME.socials.facebook),
      instagram: pick(s?.social_instagram, DEFAULT_CHROME.socials.instagram),
      youtube: pick(s?.social_youtube, DEFAULT_CHROME.socials.youtube),
      email: pick(s?.social_email, DEFAULT_CHROME.socials.email),
    },
  };
}

async function refresh(): Promise<void> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) {
    cache = { chrome: DEFAULT_CHROME, at: Date.now() };
    return;
  }
  try {
    const headers = { apikey: key, Authorization: `Bearer ${key}` };
    const [navRes, setRes] = await Promise.all([
      fetch(
        `${base}/rest/v1/nav_items?active=eq.true&select=location,group_title,label,url,target,display_order&order=display_order.asc`,
        { headers, cache: 'no-store' }
      ),
      fetch(`${base}/rest/v1/site_settings?id=eq.1&select=*`, {
        headers,
        cache: 'no-store',
      }),
    ]);
    const nav = navRes.ok ? ((await navRes.json()) as NavRow[]) : [];
    const settingsRows = setRes.ok ? ((await setRes.json()) as SettingsRow[]) : [];
    cache = { chrome: buildChrome(nav, settingsRows[0] ?? null), at: Date.now() };
  } catch {
    // Keep any stale cache; otherwise fall back to defaults.
    if (!cache) cache = { chrome: DEFAULT_CHROME, at: Date.now() };
  }
}

/** Resolve the public site chrome (cached, fallback-safe). */
export async function getSiteChrome(): Promise<SiteChrome> {
  if (!cache || Date.now() - cache.at > TTL_MS) {
    await refresh();
  }
  return cache?.chrome ?? DEFAULT_CHROME;
}
