'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { toggleBadgeActive } from './actions';

/**
 * Tiny inline toggle on the admin list. Flips active in-place and refreshes
 * the route so the row pill re-renders without a full reload.
 */
export default function BadgeActiveToggle({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await toggleBadgeActive(id, !active);
          if (!res.ok) {
            alert(res.error);
            return;
          }
          router.refresh();
        })
      }
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition ${
        active
          ? 'bg-cream-100 hover:bg-cream-200 text-earth-700'
          : 'bg-forest-100 hover:bg-forest-200 text-forest-800'
      } ${pending ? 'opacity-60' : ''}`}
    >
      {active ? (
        <>
          <EyeOff className="w-3 h-3" strokeWidth={2.4} />
          Kache
        </>
      ) : (
        <>
          <Eye className="w-3 h-3" strokeWidth={2.4} />
          Mete aktif
        </>
      )}
    </button>
  );
}
