'use client';

import { Menu } from 'lucide-react';

/**
 * Hamburger button rendered inside the topbar on mobile/tablet. Clicking it
 * dispatches a window-level `open-user-nav-drawer` CustomEvent which the
 * (client-side) Sidebar listens for and opens its slide-in drawer.
 *
 * This indirection lets us keep Topbar as a server component while still
 * triggering client-only state across components without prop-drilling
 * through the dashboard layout.
 */
export default function MobileNavButton() {
  return (
    <button
      type="button"
      aria-label="Ouvri navigasyon"
      onClick={() =>
        window.dispatchEvent(new CustomEvent('open-user-nav-drawer'))
      }
      className="lg:hidden grid place-items-center w-10 h-10 rounded-full bg-white border border-cream-200 hover:border-forest-300 text-earth-700 hover:text-forest-700 transition shrink-0"
    >
      <Menu className="w-[18px] h-[18px]" strokeWidth={1.8} />
    </button>
  );
}
