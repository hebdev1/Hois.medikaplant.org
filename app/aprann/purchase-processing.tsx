'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, RefreshCw, MessageCircle } from 'lucide-react';

// Shown right after a paid checkout while we wait for the Stripe webhook to
// record the enrolment. It reloads every few seconds; once the enrolment lands,
// the reload renders the real dashboard instead of this. Bounded to a handful
// of tries (tracked in the URL) so it can't loop forever if a webhook is lost.
export default function PurchaseProcessing({ attempt }: { attempt: number }) {
  const stalled = attempt >= 5;

  useEffect(() => {
    if (stalled) return;
    const t = setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.set('achte', '1');
      url.searchParams.set('t', String(attempt + 1));
      window.location.href = url.toString();
    }, 4000);
    return () => clearTimeout(t);
  }, [attempt, stalled]);

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[720px] mx-auto">
      <div className="rounded-3xl border border-cream-200 bg-white p-8 md:p-10 text-center">
        <span className="grid place-items-center w-14 h-14 mx-auto rounded-full bg-forest-50 text-forest-700 mb-4">
          <CheckCircle2 className="w-7 h-7" strokeWidth={2.2} />
        </span>
        <h1 className="font-display text-2xl font-bold text-ink">
          Peman w resevwa ✓
        </h1>

        {!stalled ? (
          <>
            <p className="mt-2 text-earth-600 leading-relaxed">
              N ap prepare espas ou kounye a. Paj la ap rafrechi otomatikman nan
              yon ti moman…
            </p>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-forest-700">
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
              N ap tann konfimasyon an…
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-earth-600 leading-relaxed">
              Peman w pase, men konfimasyon an ap pran plis tan pase pou
              abitid. Eseye rafrechi paj la; si kou a poko parèt, kontakte ekip
              la epi n ap regle l touswit.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/aprann"
                className="inline-flex items-center gap-1.5 bg-forest-700 hover:bg-forest-800 text-cream-50 px-5 py-2.5 rounded-full text-sm font-semibold transition"
              >
                <RefreshCw className="w-4 h-4" strokeWidth={2.4} />
                Rafrechi
              </Link>
              <Link
                href="/kontak"
                className="inline-flex items-center gap-1.5 border border-cream-300 hover:bg-cream-50 text-ink px-5 py-2.5 rounded-full text-sm font-medium transition"
              >
                <MessageCircle className="w-4 h-4" strokeWidth={2.4} />
                Kontakte ekip la
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
