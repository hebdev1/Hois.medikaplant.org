'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  AlertCircle,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { enrollInCourse } from '../actions';

type Props = {
  courseId: string;
  slug: string;
  seatCapacity: number | null;
  seatsTaken: number;
  alreadyEnrolled: boolean;
  isAuthenticated: boolean;
  isFreeWithSubscription: boolean;
  planRequired: string;
  upgradeHref: string;
};

const PLAN_LABEL: Record<string, string> = {
  basic: 'Bazilik',
  premium: 'Sitwonèl',
  vip: 'Melis',
};

export default function EnrollButton({
  courseId,
  slug,
  seatCapacity,
  seatsTaken,
  alreadyEnrolled,
  isAuthenticated,
  isFreeWithSubscription,
  planRequired,
  upgradeHref,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [feedback, setFeedback] = React.useState<
    | null
    | {
        kind: 'error' | 'success';
        message: string;
        full?: boolean;
        needsLogin?: boolean;
      }
  >(null);

  const seatsLeft =
    seatCapacity !== null ? Math.max(0, seatCapacity - seatsTaken) : null;
  const isFull = seatsLeft === 0;

  async function onClick() {
    if (pending) return;
    setPending(true);
    setFeedback(null);
    try {
      const res = await enrollInCourse(courseId);
      if (res.ok) {
        setFeedback({
          kind: 'success',
          message: 'Ou enskri ak siksè. Ale nan tablodebò w pou kòmanse.',
        });
        router.refresh();
      } else {
        setFeedback({
          kind: 'error',
          message: res.error,
          full: res.full,
          needsLogin: res.needsLogin,
        });
        if (res.full) router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  // ─── State 1: already enrolled ──────────────────────────────────────────
  if (alreadyEnrolled) {
    return (
      <div className="space-y-2">
        <Link
          href="/dashboard"
          className="block w-full text-center bg-forest-700 hover:bg-forest-800 text-cream-50 px-5 py-3 rounded-full font-medium transition shadow-md inline-flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" strokeWidth={2.4} />
          Ou deja enskri — ale nan tablodebò
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

  // ─── State 3: needs to upgrade plan first ───────────────────────────────
  if (!isFreeWithSubscription) {
    return (
      <div className="space-y-2">
        <Link
          href={upgradeHref}
          className="block w-full text-center bg-brand-gradient hover:brightness-110 text-white px-5 py-3 rounded-full font-medium transition shadow-md"
        >
          Achte klas la
        </Link>
        {seatsLeft !== null && seatsLeft <= 10 && (
          <SeatsLeftBadge seatsLeft={seatsLeft} seatCapacity={seatCapacity!} />
        )}
      </div>
    );
  }

  // ─── State 4: included with current/future subscription ─────────────────
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className={cn(
          'block w-full text-center bg-brand-gradient hover:brightness-110 disabled:opacity-70 text-white px-5 py-3 rounded-full font-medium transition shadow-md inline-flex items-center justify-center gap-2'
        )}
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
        ) : (
          <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
        )}
        {isAuthenticated
          ? 'Pran plas mwen kounye a'
          : 'Konekte pou pran yon plas'}
      </button>

      {seatsLeft !== null && seatsLeft <= 10 && (
        <SeatsLeftBadge seatsLeft={seatsLeft} seatCapacity={seatCapacity!} />
      )}
      {seatsLeft === null && (
        <p className="text-[11px] text-ink-muted text-center inline-flex items-center justify-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-forest-700" strokeWidth={2.4} />
          Plas san limit
        </p>
      )}

      {feedback && (
        <div
          className={cn(
            'rounded-xl px-3 py-2 text-xs flex items-start gap-2',
            feedback.kind === 'success'
              ? 'bg-forest-50 border border-forest-200 text-forest-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          )}
        >
          {feedback.kind === 'success' ? (
            <CheckCircle2
              className="w-3.5 h-3.5 mt-0.5 shrink-0"
              strokeWidth={2.4}
            />
          ) : (
            <AlertCircle
              className="w-3.5 h-3.5 mt-0.5 shrink-0"
              strokeWidth={2.4}
            />
          )}
          <div className="flex-1">
            <p>{feedback.message}</p>
            {feedback.needsLogin && (
              <Link
                href={`/auth/login?redirect=/klas/${slug}`}
                className="mt-1 inline-flex items-center gap-1 text-forest-700 font-semibold underline"
              >
                Konekte
                <ArrowRight className="w-3 h-3" strokeWidth={2.4} />
              </Link>
            )}
          </div>
        </div>
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
