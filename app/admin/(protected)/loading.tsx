/**
 * Skeleton rendered between admin route navigations. Same intent as the
 * one in /dashboard — gives the operator instant feedback when clicking
 * a sidebar link instead of leaving the previous page on screen until
 * data resolves.
 */
export default function AdminLoading() {
  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1280px] mx-auto animate-pulse">
      <div className="space-y-3 mb-6">
        <div className="h-6 w-32 rounded-full bg-cream-100" />
        <div className="h-10 md:h-12 w-3/4 max-w-xl rounded-xl bg-cream-100" />
        <div className="h-4 w-2/3 max-w-lg rounded bg-cream-100" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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

      <div className="bg-white border border-cream-200 rounded-2xl shadow-card p-5 md:p-6 space-y-3">
        <div className="h-5 w-1/3 rounded bg-cream-100" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-cream-100/70" />
        ))}
      </div>
    </div>
  );
}
