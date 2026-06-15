import Link from 'next/link';
import { Activity, Layers, CalendarRange } from 'lucide-react';

export type CareTab = 'patients' | 'segments' | 'programs';

export const CARE_TABS: Array<{
  id: CareTab;
  label: string;
  icon: typeof Activity;
}> = [
  { id: 'patients', label: 'Pasyan',     icon: Activity },
  { id: 'segments', label: 'Segman maladi', icon: Layers },
  { id: 'programs', label: 'Plan + Tach 1-30', icon: CalendarRange },
];

/**
 * Sticky tab strip for the unified care page. Each tab is a Link with
 * its own ?tab=… so the URL stays bookmarkable. We render this as a
 * server component because the active tab comes from URL search params
 * and there's no client state to track.
 */
export default function CareTabBar({ active }: { active: CareTab }) {
  return (
    <nav
      className="sticky top-0 z-20 -mx-5 md:-mx-8 lg:-mx-10 px-5 md:px-8 lg:px-10 py-3 mb-6 bg-white/85 backdrop-blur border-b border-cream-200"
      aria-label="Seksyon swivi sante"
    >
      <ul className="flex items-center gap-1 overflow-x-auto">
        {CARE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <li key={tab.id} className="shrink-0">
              <Link
                href={`/admin/health?tab=${tab.id}`}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                  isActive
                    ? 'bg-forest-700 text-cream-50 shadow-sm'
                    : 'text-earth-700 hover:bg-cream-100 hover:text-ink'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-4 h-4" strokeWidth={2.2} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
