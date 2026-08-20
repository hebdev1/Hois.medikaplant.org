import { Clock, BellRing } from 'lucide-react';
import { cn } from '@/lib/utils';

// Shared pre-order UI. A course sold "peye davans" is active (buyable) but not
// yet `released`; buyers keep their enrollment and are emailed + notified the
// instant an admin releases it.

// Small pill that marks a course as pre-order. Shown on course cards and the
// course detail page while the course is active but not yet released.
export function PreorderBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-forest-900 shadow-sm',
        className
      )}
    >
      <Clock className="h-2.5 w-2.5" strokeWidth={2.6} />
      Pre-order
    </span>
  );
}

// Enrolled buyer opening a course still in pre-order. Their access is intact;
// the content just isn't ready yet.
export function PreorderPending({ title }: { title: string }) {
  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[720px] mx-auto">
      <div className="rounded-3xl border border-gold-200 bg-gradient-to-br from-gold-50 to-cream-50 p-8 md:p-10 text-center">
        <span className="grid place-items-center w-16 h-16 mx-auto rounded-2xl bg-gold-100 text-gold-700 mb-5">
          <Clock className="w-8 h-8" strokeWidth={1.8} />
        </span>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-ink">
          Kou a poko pare
        </h1>
        <p className="mt-3 text-earth-700 leading-relaxed">
          Ou byen enskri nan « {title} » — plas ou rezève. Kou a nan preparasyon
          toujou. Depi li pare, w ap jwenn aksè a tout kontni an otomatikman.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white border border-gold-200 px-4 py-2 text-sm font-semibold text-forest-800">
          <BellRing className="w-4 h-4 text-gold-600" strokeWidth={2.2} />
          N ap avize w pa imel ak notifikasyon lè li lanse
        </div>
      </div>
    </div>
  );
}
