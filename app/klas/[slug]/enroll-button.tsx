'use client';

import Link from 'next/link';
import { CheckCircle2, Lock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  slug: string;
  seatCapacity: number | null;
  seatsTaken: number;
  alreadyEnrolled: boolean;
  isPaidCourse: boolean;
  priceCents: number | null;
};

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function EnrollButton({
  slug,
  seatCapacity,
  seatsTaken,
  alreadyEnrolled,
  isPaidCourse,
  priceCents,
}: Props) {
  const seatsLeft =
    seatCapacity !== null ? Math.max(0, seatCapacity - seatsTaken) : null;
  const isFull = seatsLeft === 0;

  // ─── State 1: already enrolled ──────────────────────────────────────────
  if (alreadyEnrolled) {
    return (
      <div className="space-y-2">
        <Link
          href="/aprann"
          className="block w-full text-center bg-forest-700 hover:bg-forest-800 text-cream-50 px-5 py-3 rounded-full font-medium transition shadow-md inline-flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" strokeWidth={2.4} />
          Ou deja enskri — ale nan Espas Elèv
        </Link>
        {seatsLeft !== null && (
          <p className="text-[11px] text-ink-muted text-center">
            <Users className="inline w-3 h-3 mr-1" strokeWidth={2.2} />
            {seatsTaken} / {seatCapacity} plas okipe
          </p>
        )}
      </div>
    );
  }

  // ─── State 2: course is full ────────────────────────────────────────────
  if (isFull) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled
          className="block w-full text-center bg-cream-200 text-earth-600 px-5 py-3 rounded-full font-medium cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          <Lock className="w-4 h-4" strokeWidth={2.4} />
          Klas la konplè ({seatCapacity} / {seatCapacity})
        </button>
        <p className="text-[11px] text-rose-700 text-center">
          Pa gen plas ki rete. Kontakte sipò pou jwen yon plas si yon moun
          dezenskri.
        </p>
      </div>
    );
  }

  // ─── State 3: not enrolled — route to the course checkout ───────────────
  // Paid AND free courses take the exact same path. The checkout page runs the
  // account step (create account / log in), then either takes payment or, for a
  // free course, enrols right away — and sends the buyer to /aprann. So there is
  // no direct-enrol here any more: everyone goes through /checkout/klas/[slug].
  const isPaid = isPaidCourse && !!priceCents;
  return (
    <div className="space-y-2">
      <Link
        href={`/checkout/klas/${slug}`}
        className="block w-full text-center bg-brand-gradient hover:brightness-110 text-white px-5 py-3 rounded-full font-medium transition shadow-md"
      >
        {isPaid ? `Achte klas la pou ${dollars(priceCents!)}` : 'Enskri gratis'}
      </Link>
      <p className="text-[11px] text-ink-muted text-center">
        {isPaid
          ? 'Yon sèl acha. Pa bezwen abònman. Aksè pou tout lavi.'
          : 'Gratis nèt. Kreye yon kont oswa konekte pou kòmanse.'}
      </p>
      {seatsLeft !== null && seatsLeft <= 10 && (
        <SeatsLeftBadge seatsLeft={seatsLeft} seatCapacity={seatCapacity!} />
      )}
    </div>
  );
}

function SeatsLeftBadge({
  seatsLeft,
  seatCapacity,
}: {
  seatsLeft: number;
  seatCapacity: number;
}) {
  const tone =
    seatsLeft <= 3
      ? 'bg-rose-100 text-rose-800 border-rose-200'
      : 'bg-amber-100 text-amber-900 border-amber-200';
  return (
    <p
      className={cn(
        'text-[11px] font-semibold text-center px-3 py-1.5 rounded-full border inline-flex items-center justify-center gap-1 w-full',
        tone
      )}
    >
      <Users className="w-3 h-3" strokeWidth={2.4} />
      Sèlman {seatsLeft} plas ki rete sou {seatCapacity}
    </p>
  );
}
