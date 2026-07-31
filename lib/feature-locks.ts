// Pages temporarily locked while they're being built. This is the single
// source of truth: flip a value to `false` (or delete the entry) to re-enable
// BOTH the sidebar link and the route in one place.
export const LOCKED_PATHS: Record<string, boolean> = {
  '/dashboard/badges': true,
  '/dashboard/vip': true,
};

// True when `pathname` is a locked page or lives under one (e.g. a badge
// detail page at /dashboard/badges/<slug>).
export function isPathLocked(pathname: string): boolean {
  return Object.entries(LOCKED_PATHS).some(
    ([path, locked]) =>
      locked && (pathname === path || pathname.startsWith(`${path}/`))
  );
}
