'use client';

import { Search, Bell, ShoppingCart, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Avatar from './avatar';

type TopbarProps = {
  userName: string;
  userCondition?: string;
  unreadCount?: number;
};

export default function Topbar({
  userName,
  userCondition = 'Manm Hoïs',
  unreadCount = 0,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 px-6 md:px-8 lg:px-10 py-4 bg-cream-50/85 backdrop-blur-md border-b border-cream-200">
      <label className="relative flex-1 max-w-2xl">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-500"
          strokeWidth={2}
          aria-hidden
        />
        <input
          type="search"
          placeholder="Chèche yon gid, pwodwi, oswa konsèy..."
          className="w-full pl-11 pr-16 py-2.5 rounded-full bg-white border border-cream-200 text-sm text-ink placeholder:text-earth-500 focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 transition"
        />
        <kbd className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 px-2 py-0.5 rounded-md bg-cream-100 border border-cream-200 text-[10px] font-semibold text-earth-600">
          ⌘ K
        </kbd>
      </label>

      <div className="flex items-center gap-2">
        <button
          aria-label="Notifikasyon"
          className="relative grid place-items-center w-10 h-10 rounded-full bg-white border border-cream-200 hover:border-forest-300 text-earth-700 hover:text-forest-700 transition"
        >
          <Bell className="w-[18px] h-[18px]" strokeWidth={1.8} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-accent ring-2 ring-cream-50" />
          )}
        </button>
        <button
          aria-label="Panye"
          className="grid place-items-center w-10 h-10 rounded-full bg-white border border-cream-200 hover:border-forest-300 text-earth-700 hover:text-forest-700 transition"
        >
          <ShoppingCart className="w-[18px] h-[18px]" strokeWidth={1.8} />
        </button>
        <Link
          href="/dashboard/settings"
          className="hidden sm:flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full bg-white border border-cream-200 hover:border-forest-300 transition"
        >
          <Avatar size={32} />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-ink truncate max-w-[160px]">
              {userName}
            </span>
            <span className="text-[11px] text-earth-600 truncate max-w-[160px]">
              {userCondition}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-earth-500" strokeWidth={2} />
        </Link>
      </div>
    </header>
  );
}
