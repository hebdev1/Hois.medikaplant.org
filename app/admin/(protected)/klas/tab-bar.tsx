import Link from 'next/link';
import {
  GraduationCap,
  FolderTree,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'courses' | 'categories' | 'config';

const TABS: Array<{
  key: Tab;
  label: string;
  icon: typeof GraduationCap;
  countKey?: 'courses' | 'categories';
}> = [
  { key: 'courses', label: 'Kou', icon: GraduationCap, countKey: 'courses' },
  { key: 'categories', label: 'Kategori', icon: FolderTree, countKey: 'categories' },
  { key: 'config', label: 'Konfigirasyon paj', icon: SlidersHorizontal },
];

export default function KlasTabBar({
  active,
  counts,
}: {
  active: Tab;
  counts: { courses: number; categories: number };
}) {
  return (
    <nav className="mb-6 inline-flex p-1 bg-cream-100 border border-cream-200 rounded-2xl overflow-x-auto">
      {TABS.map(({ key, label, icon: Icon, countKey }) => {
        const isActive = active === key;
        const count = countKey ? counts[countKey] : null;
        return (
          <Link
            key={key}
            href={`/admin/klas?tab=${key}`}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
              isActive
                ? 'bg-white text-forest-800 shadow-sm'
                : 'text-earth-700 hover:text-ink'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
            {label}
            {count !== null && (
              <span
                className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                  isActive
                    ? 'bg-forest-100 text-forest-700'
                    : 'bg-cream-200 text-earth-700'
                )}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
