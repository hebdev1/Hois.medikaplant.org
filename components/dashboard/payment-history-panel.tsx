import Link from 'next/link';
import { Receipt, ExternalLink, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

type Plan = 'basic' | 'premium' | 'vip';

const PLAN_LABELS: Record<Plan, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

export type PaymentRecord = {
  id: string;
  plan: Plan;
  status: 'active' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string | null;
  amount: number | null;
  payment_reference: string | null;
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('fr-HT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

export default function PaymentHistoryPanel({ payments }: { payments: PaymentRecord[] }) {
  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
      <header className="mb-5">
        <h2 className="font-display text-lg md:text-xl font-bold text-ink">
          Istwa Pèman & Resi
        </h2>
        <p className="text-sm text-earth-600 mt-1">
          Tout pèman ki sou kont ou. Klike sou yon liy pou wè resi a (ou ka enprime li an PDF nan navigatè a).
        </p>
      </header>

      {payments.length === 0 ? (
        <div className="text-center py-8 rounded-xl bg-cream-50 border border-dashed border-cream-200">
          <CreditCard className="w-6 h-6 text-earth-500 mx-auto mb-2" strokeWidth={2} />
          <p className="text-sm text-earth-600">
            Ou poko gen pèman. Lè ou pran yon plan VIP, resi a ap parèt isit la.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-cream-200 overflow-hidden divide-y divide-cream-200">
          {payments.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/settings/receipts/${p.id}`}
              target="_blank"
              className="group grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_auto_auto_auto] gap-3 items-center px-4 py-3 hover:bg-cream-50 transition"
            >
              <span className="grid place-items-center w-10 h-10 rounded-xl bg-forest-100 text-forest-700">
                <Receipt className="w-4 h-4" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink">
                  {PLAN_LABELS[p.plan]}
                </div>
                <div className="text-[11px] text-earth-600 mt-0.5 truncate">
                  {formatDate(p.start_date)} → {formatDate(p.end_date)}
                  {p.payment_reference && (
                    <>
                      <span aria-hidden> · </span>
                      <span className="font-mono">{p.payment_reference.slice(0, 18)}…</span>
                    </>
                  )}
                </div>
              </div>
              <span
                className={cn(
                  'hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full',
                  p.status === 'active'
                    ? 'bg-forest-100 text-forest-700'
                    : p.status === 'cancelled'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-cream-200 text-earth-700'
                )}
              >
                {p.status === 'active' ? 'Aktif' : p.status === 'cancelled' ? 'Anile' : 'Ekspire'}
              </span>
              <span className="text-right font-mono text-sm font-semibold text-ink tabular-nums">
                {p.amount !== null ? `$${p.amount}` : '—'}
              </span>
              <ExternalLink
                className="hidden sm:block w-4 h-4 text-earth-500 group-hover:text-forest-700 transition shrink-0"
                strokeWidth={2}
              />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
