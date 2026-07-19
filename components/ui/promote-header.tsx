'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BrandLogo from './brand-logo';
import {
  Leaf,
  BookOpen,
  GraduationCap,
  MessageCircle,
  ShieldCheck,
  Search,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

// ───────────────────────────────────────────────────────────────────────────
// MedikaPlant landing header — adapted from the generic "PromoteHeader"
// pattern (announcement bar + sticky chrome + desktop nav + Resources hover
// panel + mobile drawer + auth CTAs).
//
// What we keep from the source pattern:
//   • Skip-to-content link for keyboard users
//   • Top announcement bar with a primary CTA into pricing
//   • Sticky blurred header with desktop nav + Resources hover panel
//   • Mobile slide-in drawer with the same structure
//   • Two-button auth pair (Konekte + Vin manm)
//
// What we drop (and why):
//   • Dark mode toggle — the public site doesn't ship a dark theme yet,
//     and forcing one on the landing without consistent token coverage
//     would create halftone artifacts in the brand gradient.
//   • Search bar — there's no public search endpoint on this site, so
//     a non-functional input would mislead visitors.
//
// Branding swaps:
//   • Generic zinc neutrals → cream/forest/ink (Tailwind tokens defined
//     in tailwind.config.ts).
//   • Ruixen logo → Leaf icon + "MedikaPlant" wordmark + "Hoïs Inivèsite"
//     eyebrow, matching the rest of the site chrome.
//   • Nav labels translated to Kreyòl, pointing at the existing landing
//     section anchors. The Resources panel surfaces the public utility
//     pages (Klas, Istwa nou, Kontak, Konfidansyalite) — content pages
//     that benefit from being one click away.
// ───────────────────────────────────────────────────────────────────────────

type NavItem = { href: string; label: string; target?: '_blank'| '_self';};
type Resource = {
  href: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
};

const NAV: NavItem[] = [
  { href: 'https://www.hoismedikaplant.com', label: 'Akèy' },
  { href: 'https://www.medikaplantshop.com', label: 'Boutik',  target: '_blank'},
  { href: '#istwa', label: 'Istwa' },
  { href: '#hois', label: 'HOÏS' },
  { href: '#pri', label: 'Pri' },
];

const RESOURCES: Resource[] = [
  {
    href: '/klas',
    title: 'Klas Hoïs',
    desc: 'Klas espirityèl ak Ton vye ki disponib pou manm yo.',
    icon: <GraduationCap className="h-5 w-5" strokeWidth={1.8} />,
  },
  {
    href: '/istwa-nou',
    title: 'Istwa nou',
    desc: 'Misyon nou + jan Hoïs te kòmanse.',
    icon: <BookOpen className="h-5 w-5" strokeWidth={1.8} />,
  },
  {
    href: '/kontak',
    title: 'Kontak',
    desc: 'Ekri nou epi yon admin ap reponn ou.',
    icon: <MessageCircle className="h-5 w-5" strokeWidth={1.8} />,
  },
  {
    href: '/konfidansyalite',
    title: 'Konfidansyalite',
    desc: 'Politik done ou + dwa ou kòm manm.',
    icon: <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />,
  },
];

export default function PromoteHeader() {
  const pathname = usePathname() ?? '/';
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  // Track scroll position so we can ramp the header's frosted-glass
  // effect after the user moves past the announcement bar. A single
  // boolean (>8px) is enough — we don't need pixel-precise interpolation
  // because the CSS transitions smooth the visual jump.
  React.useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close drawer on route change, ESC, scroll lock while open. All
  // gated by `open` so we don't pile listeners on an idle nav.
  React.useEffect(() => {
    if (!open) {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (href: string) =>
    href.startsWith('#')
      ? false // Anchor links on a single-page landing never claim "current page".
      : href === '/'
      ? pathname === '/'
      : pathname.startsWith(href);

  const primaryBtn =
    'inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold ' +
    'bg-brand-gradient text-white hover:brightness-110 shadow-md ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-300';

  const secondaryBtn =
    'inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-medium ' +
    'text-ink border border-cream-300 hover:border-forest-400 hover:bg-cream-50 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-300';

  const desktopLink = (active: boolean) =>
    [
      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
      'outline-none ring-0 focus-visible:ring-2 focus-visible:ring-forest-300',
      'hover:bg-cream-100',
      active
        ? 'text-ink ring-1 ring-inset ring-cream-300 bg-cream-50'
        : 'text-ink-muted hover:text-ink',
    ].join(' ');

  return (
    <div className="flex flex-col">
      {/* Skip to content for keyboard users */}
      <a
        href="#akey"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] rounded bg-forest-700 px-3 py-2 text-sm text-cream-50"
      >
        Ale dirèkteman nan kontni
      </a>

      {/* Announcement bar — drives traffic to pricing */}
      <div className="w-full border-b border-cream-200 bg-gradient-to-r from-brand-50/60 to-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-1.5 text-xs sm:text-sm">
          <span className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-white px-2 py-0.5 font-bold text-brand-700">
            <Sparkles className="w-3 h-3" strokeWidth={2.4} />
            Nouvo
          </span>
          <span className="text-ink-muted hidden sm:inline">
            Vin enskri kòm manb jodi a pou w ka tou benefisye nan rabè sa a.
          </span>
          <span className="text-ink-muted sm:hidden">
            Platfòm Hoïs VIP a ouvè
          </span>
          <Link
            href="#pri"
            className="inline-flex items-center gap-1 underline decoration-brand-300 decoration-dashed underline-offset-4 hover:decoration-solid text-ink font-medium"
          >
            Wè pri yo
            <ArrowRight className="w-3 h-3" strokeWidth={2.4} />
          </Link>
        </div>
      </div>

      {/* Sticky main header.
          Two layers of dynamic frosted-glass effect on scroll:
            • `backdrop-blur-xl` (vs. `backdrop-blur-md` at rest) gives a
              deeper, more cinematic blur once the user moves past hero.
            • Opacity drops from 60→55 so a hint of the scrolling content
              shows through, plus a soft shadow + saturated edge color
              produce real depth (not just a flat white pill).
          We animate every transition so the swap is silky, never jumpy. */}
      <header
        className={[
          'sticky top-0 z-50 w-full transition-all duration-300 ease-out',
          'border-b',
          scrolled
            ? 'backdrop-blur-xl backdrop-saturate-150 bg-white/70 supports-[backdrop-filter]:bg-white/55 border-cream-300/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)]'
            : 'backdrop-blur-md bg-white/85 supports-[backdrop-filter]:bg-white/60 border-cream-200',
        ].join(' ')}
      >
        {/* Subtle gradient hairline under the bar for depth */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-cream-300 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Three-column grid: brand (auto) | centered nav (1fr) | CTAs (auto).
              Using grid instead of flex justify-between guarantees the nav
              stays visually centered regardless of how wide the brand or
              CTA clusters grow.
              Height shrinks slightly when scrolled for a "compact mode" feel. */}
          <div
            className={[
              'grid grid-cols-[auto_1fr_auto] items-center gap-3 transition-[height] duration-300',
              scrolled ? 'h-12 md:h-14' : 'h-14 md:h-16',
            ].join(' ')}
          >
            {/* Left: burger + brand */}
            <div className="flex items-center gap-2">
              {/* Mobile burger */}
              <button
                type="button"
                aria-label="Louvri meni"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className={[
                  'md:hidden group relative size-9 rounded-md',
                  'text-ink hover:text-forest-700',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-300',
                ].join(' ')}
              >
                <span
                  className={[
                    'absolute inset-x-2 top-[9px] h-[2px] rounded bg-current transition-transform',
                    open ? 'translate-y-[6px] rotate-45' : '',
                  ].join(' ')}
                />
                <span
                  className={[
                    'absolute inset-x-2 top-1/2 h-[2px] -translate-y-1/2 rounded bg-current transition-opacity',
                    open ? 'opacity-0' : 'opacity-100',
                  ].join(' ')}
                />
                <span
                  className={[
                    'absolute inset-x-2 bottom-[9px] h-[2px] rounded bg-current transition-transform',
                    open ? '-translate-y-[6px] -rotate-45' : '',
                  ].join(' ')}
                />
              </button>

              {/* Brand */}
              <Link
                href="/"
                className="inline-flex items-center gap-2"
                aria-label="MedikaPlant — Akèy"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-hois.png"
                  alt="Hoïs"
                  className="h-9 sm:h-10 w-auto shrink-0"
                />
                <span className="flex flex-col leading-tight">
                  <span className="font-bold text-base sm:text-lg text-ink tracking-tight">
                    MedikaPlant
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-brand-700 font-medium hidden sm:block">
                    Hoïs Inivèsite
                  </span>
                </span>
              </Link>

            </div>

            {/* CENTER: Desktop nav. justify-self-center anchors the nav to
                the grid cell's center; the cell itself takes 1fr so the
                cluster sits exactly between brand + CTAs no matter what
                widths they have. */}
            <nav className="hidden md:flex justify-self-center items-center gap-1">
              {NAV.map((item) => {
                // External links (e.g. Boutik → medikaplantshop.com)
                // open in a new tab so the member's dashboard session
                // stays put. Internal + hash links use the SPA path.
                const isExternal = /^https?:\/\//i.test(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className={desktopLink(isActive(item.href))}
                    {...(isExternal
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {/* Resources hover panel */}
              <div className="relative group">
                <button type="button" className={desktopLink(false)}>
                  Resous
                </button>
                <div
                  className={[
                    'pointer-events-none absolute left-1/2 top-full z-40 -translate-x-1/2 pt-2 opacity-0 transition',
                    'group-hover:pointer-events-auto group-hover:opacity-100',
                    'group-focus-within:pointer-events-auto group-focus-within:opacity-100',
                  ].join(' ')}
                >
                  <div
                    className={[
                      'max-w-[calc(100vw-2rem)] sm:w-[520px] rounded-xl border border-cream-200 bg-white/95 p-3 shadow-xl',
                      'backdrop-blur supports-[backdrop-filter]:bg-white/80',
                    ].join(' ')}
                  >
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {RESOURCES.map((r) => (
                        <li key={r.href}>
                          <Link
                            href={r.href}
                            className={[
                              'flex items-start gap-3 rounded-lg p-3 transition',
                              'hover:bg-cream-50',
                              'border border-transparent hover:border-cream-300',
                            ].join(' ')}
                          >
                            <div className="mt-0.5 text-brand-700">
                              {r.icon}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-ink">
                                {r.title}
                              </div>
                              <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">
                                {r.desc}
                              </p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 rounded-lg border border-cream-200 bg-brand-50/40 p-2 text-xs text-ink-muted">
                      Manm? Konekte sou{' '}
                      <Link
                        href="/auth/login"
                        className="text-brand-700 underline font-medium"
                      >
                        panèl ou
                      </Link>{' '}
                      pou jwenn gid plant, fowòm, ak konsèy jou a.
                    </div>
                  </div>
                </div>
              </div>
            </nav>

            {/* Right: CTAs (desktop) */}
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/auth/login" className={secondaryBtn}>
                Konekte
              </Link>
              <Link href="#pri" className={primaryBtn}>
                Vin manm
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" strokeWidth={2.4} />
              </Link>
            </div>

            {/* Right (mobile): quick CTA */}
            <div className="md:hidden">
              <Link href="#pri" className={primaryBtn}>
                Vin manm
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={[
          'fixed inset-0 z-50 md:hidden transition',
          open ? 'pointer-events-auto' : 'pointer-events-none',
        ].join(' ')}
        aria-hidden={!open}
      >
        {/* Overlay */}
        <div
          className={[
            'absolute inset-0 bg-black/40 backdrop-blur-sm',
            open ? 'opacity-100' : 'opacity-0',
            'transition-opacity',
          ].join(' ')}
          onClick={() => setOpen(false)}
        />

        {/* Panel */}
        <aside
          className={[
            'absolute right-0 top-0 h-full w-80 max-w-[calc(100vw-0.75rem)] transform bg-white/95 p-4 shadow-2xl',
            'backdrop-blur supports-[backdrop-filter]:bg-white/80',
            'border-l border-cream-200',
            open ? 'translate-x-0' : 'translate-x-full',
            'transition-transform',
            'overflow-y-auto',
          ].join(' ')}
          role="dialog"
          aria-modal="true"
        >
          {/* Header in drawer */}
          <div className="mb-3 flex items-center justify-between">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2"
            >
              <BrandLogo size={36} className="shrink-0 rounded-xl shadow-md" />
              <span className="flex flex-col leading-tight">
                <span className="font-bold text-base text-ink">
                  MedikaPlant
                </span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-brand-700 font-medium">
                  Hoïs Inivèsite
                </span>
              </span>
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="inline-flex size-9 items-center justify-center rounded-md border border-cream-300 text-ink hover:bg-cream-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-300"
              aria-label="Fèmen meni"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          {/* Nav list */}
          <nav className="space-y-1">
            {NAV.map((item) => {
              const isExternal = /^https?:\/\//i.test(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={[
                    'block rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                    'hover:bg-cream-50',
                    isActive(item.href)
                      ? 'text-ink ring-1 ring-inset ring-cream-300 bg-cream-50'
                      : 'text-ink-muted',
                  ].join(' ')}
                  {...(isExternal
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Resources block */}
          <div className="mt-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Resous
            </div>
            <div className="grid grid-cols-2 gap-2">
              {RESOURCES.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-2 rounded-lg border border-cream-200 p-2 text-sm hover:bg-cream-50"
                >
                  <span className="mt-0.5 text-brand-700">{r.icon}</span>
                  <span className="truncate text-ink">{r.title}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              className={secondaryBtn}
            >
              Konekte
            </Link>
            <Link
              href="#pri"
              onClick={() => setOpen(false)}
              className={primaryBtn}
            >
              Vin manm
            </Link>
          </div>

          {/* Contact footer row */}
          <div className="mt-4 flex items-center justify-center">
            <Link
              href="/kontak"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 rounded-md border border-cream-300 px-3 py-2 text-sm text-ink-muted hover:bg-cream-50"
            >
              <MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />
              Kontakte ekip la
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
