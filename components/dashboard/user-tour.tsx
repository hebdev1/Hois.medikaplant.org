'use client';

// Welcome tour for first-time members. Walks them through the dashboard
// using driver.js — a tiny ~30kb library that highlights elements via
// CSS selectors with a popover overlay. Runs once per user (we persist
// completion to user_preferences.tour_completed_at); they can replay
// it from /dashboard/settings → "Refè tour la".

import React from 'react';
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

type Props = {
  /** When true, the tour boots immediately on mount (auto-launch on
   *  first visit, OR when the user clicks "replay" with ?tour=1). */
  autoStart: boolean;
  /** Server action to call when the tour finishes or is dismissed. */
  onComplete: () => Promise<void> | void;
};

// Steps reference `data-tour` attributes scattered through the sidebar,
// topbar, and dashboard. If a target is missing on this page (e.g. the
// user landed somewhere narrow that doesn't render the sidebar) driver.js
// skips that step gracefully.
const STEPS: DriveStep[] = [
  {
    popover: {
      title: '👋 Byenveni nan Hoïs MedikaPlant',
      description:
        'M ap montre w an kèk segond ki kote tout sa enpòtan yo ye sou tablodebò ou. Ou ka kanpe pou ale nenpòt lè.',
      side: 'over',
      align: 'center',
    },
  },
  {
    element: '[data-tour="nav-dashboard"]',
    popover: {
      title: '🏠 Tablodebò',
      description:
        'Lakay ou. Isi a ou wè konsèy plant jou a, tach pou jou a, ak rezime pwogrè w lan.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-dashboard-programs"]',
    popover: {
      title: '📒 Pwogram mwen yo',
      description:
        'Tout pwogram pèsonalize w yo, ak tach pa jou pou kondisyon sante w lan.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-dashboard-health"]',
    popover: {
      title: '❤️ Swivi Sante',
      description:
        'Note sik, tansyon, pwa, ak lòt valè. Ou ap wè evolisyon w nan tan reyèl.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-dashboard-guides"]',
    popover: {
      title: '📚 Gid & Konsèy',
      description:
        'Atik konplè sou plant Ayisyen, fason pou prepare yo, ak entèraksyon ak medikaman.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-dashboard-forum"]',
    popover: {
      title: '💬 Fowòm',
      description:
        'Pataje eksperyans ou ak lòt manm. Poze kesyon, bay konsèy, kreye lyen.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-dashboard-support"]',
    popover: {
      title: '🛟 Sipò',
      description:
        'Si w gen yon kesyon, ekip sipò Hoïs la la pou ou. Repons rapid ak konpasyonèl.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-dashboard-settings"]',
    popover: {
      title: '⚙️ Kont mwen',
      description:
        'Konfigire pwofil ou, plan, paramèt sante, ak aparans (mòd fonse, koulè, gwosè tèks, elatriye).',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="topbar-notif"]',
    popover: {
      title: '🔔 Notifikasyon',
      description:
        'Tout alèt yo — tretman, fowòm, repons sipò, badj. Klike pou wè detay yo.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="user-card"]',
    popover: {
      title: '👤 Pwofil ou',
      description:
        'Plan abònman ou + bouton dekonekte. Klike pou ale nan paramèt ou.',
      side: 'right',
      align: 'end',
    },
  },
  {
    popover: {
      title: '✨ Ou prè!',
      description:
        'Ou ka refè tour sa a nenpòt lè nan <strong>Kont mwen → Aparans → Refè tour la</strong>. Bon vwayaj nan Hoïs!',
      side: 'over',
      align: 'center',
    },
  },
];

export default function UserTour({ autoStart, onComplete }: Props) {
  const completedRef = React.useRef(false);

  React.useEffect(() => {
    if (!autoStart) return;
    // Defer one tick so the dashboard finishes painting and driver.js
    // can compute element rects.
    const timer = window.setTimeout(() => start(), 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  function start() {
    const d = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Pwochen →',
      prevBtnText: '← Anvan',
      doneBtnText: 'Fini',
      progressText: 'Etap {{current}} sou {{total}}',
      overlayOpacity: 0.55,
      stagePadding: 6,
      stageRadius: 12,
      allowClose: true,
      // Steps targeting an element that isn't on the page (e.g. a
      // collapsed mobile sidebar) get filtered out automatically.
      steps: STEPS.filter((s) => {
        if (!s.element) return true;
        try {
          return document.querySelector(s.element as string) !== null;
        } catch {
          return false;
        }
      }),
      onDestroyed: () => {
        if (completedRef.current) return;
        completedRef.current = true;
        // Best-effort — failure to persist just means the user sees
        // the tour again next visit, not a broken page.
        Promise.resolve(onComplete()).catch(() => undefined);
      },
    });
    d.drive();
  }

  return null;
}
