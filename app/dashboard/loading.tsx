/**
 * Generic skeleton for every /dashboard/* navigation. Next.js renders this
 * INSTANTLY when the visitor clicks a Link, before the server component
 * has finished resolving its data fetches. Without it, the browser kept
 * showing the previous page until the new one was fully ready, which made
 * navigation feel sluggish on slow connections (Haiti / mobile).
 *
 * The sidebar persists across the navigation (it lives in
 * app/dashboard/layout.tsx) so we only need to paint the topbar slot and
 * a content placeholder.
 */
export default function DashboardLoading() {
  return (
    <>
      {/* Topbar skeleton — matches the real one's height/padding */}
      <header className="sticky top-0 z-30 flex items-center gap-3 sm:gap-4 px-4 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-4 bg-cream-50/85 backdrop-blur-md border-b border-cream-200">
        <div className="lg:hidden w-10 h-10 rounded-full bg-cream-100 animate-pulse" />
        <div className="hidden md:block flex-1 max-w-2xl">
          <div className="h-10 rounded-full bg-cream-100 animate-pulse" />
        </div>
        <div className="flex-1 md:hidden" />
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-cream-100 animate-pulse" />
          <div className="hidden sm:block w-10 h-10 rounded-full bg-cream-100 animate-pulse" />
          <div className="hidden sm:flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full bg-cream-100 animate-pulse w-48 h-10" />
          <div className="sm:hidden w-9 h-9 rounded-full bg-cream-100 animate-pulse" />
        </div>
      </header>

      {/* Page content skeleton */}
      <div className="p-5 md:p-8 lg:p-10 max-w-[1320px] mx-auto grid gap-5 md:gap-6 animate-pulse">
        {/* Eyebrow + title */}
        <div className="space-y-3">
          <div className="h-6 w-32 rounded-full bg-cream-100" />
          <div className="h-10 md:h-12 w-3/4 max-w-xl rounded-xl bg-cream-100" />
          <div className="h-4 w-2/3 max-w-lg rounded bg-cream-100" />
        </div>

        {/* Stat cards row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-cream-200 rounded-2xl p-4 shadow-card flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-cream-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-16 rounded bg-cream-100" />
                <div className="h-6 w-12 rounded bg-cream-100" />
              </div>
            </div>
          ))}
        </div>

        {/* Two-column content */}
        <div className="grid lg:grid-cols-2 gap-5 md:gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card space-y-3"
            >
              <div className="h-5 w-1/2 rounded bg-cream-100" />
              <div className="h-3 w-2/3 rounded bg-cream-100" />
              <div className="space-y-2 pt-3">
                {Array.from({ length: 4 }).map((__, j) => (
                  <div key={j} className="h-12 rounded-xl bg-cream-100/70" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
