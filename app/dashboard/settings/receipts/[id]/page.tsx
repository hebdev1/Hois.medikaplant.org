import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import PrintButton from './print-button';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Resi pèman' };

const PLAN_LABELS: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

const PLAN_TAGLINES: Record<string, string> = {
  basic: 'Pòt antre nan inivè VIP la',
  premium: 'Plan ki pi popilè',
  vip: 'Eksperyans VIP ki pi konplè',
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('fr-HT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('fr-HT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default async function ReceiptPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) notFound();

  const [subResult, profileResult] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ]);

  const sub = subResult.data as {
    id: string;
    plan: 'basic' | 'premium' | 'vip';
    status: 'active' | 'cancelled' | 'expired';
    start_date: string;
    end_date: string | null;
    amount: number | null;
    payment_reference: string | null;
    created_at: string;
  } | null;

  if (!sub) notFound();

  const profile = profileResult.data as {
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    region: string | null;
    postal_code: string | null;
    country: string | null;
  } | null;

  const fullName =
    profile?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    profile?.email ||
    'Manm Hoïs';

  const subtotal = sub.amount ?? 0;
  const tax = 0;
  const total = subtotal + tax;
  const planLabel = PLAN_LABELS[sub.plan];
  const tagline = PLAN_TAGLINES[sub.plan];
  const issuedAt = sub.created_at;
  const invoiceNumber = `HOIS-${sub.id.slice(0, 8).toUpperCase()}`;

  return (
    <main className="min-h-screen bg-cream-100 print:bg-white print:p-0">
      {/* Non-print toolbar */}
      <div className="sticky top-0 bg-white border-b border-cream-200 print:hidden">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-earth-700 hover:text-ink transition"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2.2} />
            Tounen nan paramèt
          </Link>
          <PrintButton />
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 md:p-10 print:p-0">
        <div className="bg-white border border-cream-200 rounded-2xl print:border-0 print:rounded-none p-8 md:p-12 shadow-card print:shadow-none">
          {/* Header */}
          <header className="flex items-start justify-between gap-6 pb-6 border-b border-cream-200 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br from-forest-500 to-forest-800 text-white">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 4S14 4 9 9s-5 11-5 11 6 0 11-5 5-11 5-11z" />
                    <path d="m5 19 9-9" />
                  </svg>
                </span>
                <div>
                  <div className="font-display font-bold text-lg text-forest-800 leading-none">
                    Hois Medikaplant
                  </div>
                  <div className="font-serif italic text-[11px] text-earth-600 mt-0.5">
                   HOÏS Inivèsite · Chak pa konte.
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-earth-600 leading-relaxed">
                hoismedikaplant.com<br />
                contact@hoismedikaplant.com<br />
                1823 S. DIXIE HIGHWAY POMPANO BEACH, FL 33060
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold text-ink">RESI</div>
              <div className="text-xs text-earth-600 mt-1">
                #{invoiceNumber}
              </div>
              <div className="text-xs text-earth-600 mt-3">
                Pibliye: {formatDateTime(issuedAt)}
              </div>
              <div className="mt-3">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    sub.status === 'active'
                      ? 'bg-forest-100 text-forest-700'
                      : sub.status === 'cancelled'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-cream-200 text-earth-700'
                  }`}
                >
                  {sub.status === 'active' && (
                    <CheckCircle2 className="w-3 h-3" strokeWidth={2.4} />
                  )}
                  {sub.status === 'active'
                    ? 'Peye'
                    : sub.status === 'cancelled'
                    ? 'Anile'
                    : 'Ekspire'}
                </span>
              </div>
            </div>
          </header>

          {/* Bill to */}
          <section className="grid sm:grid-cols-2 gap-6 py-6 border-b border-cream-200">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-earth-500 font-semibold mb-2">
                Faktire bay
              </div>
              <div className="font-semibold text-ink">{fullName}</div>
              <div className="text-sm text-earth-700 mt-0.5">{profile?.email}</div>
              {(profile?.address_line1 ||
                profile?.city ||
                profile?.country) && (
                <div className="text-xs text-earth-600 mt-2 leading-relaxed">
                  {profile?.address_line1 && <div>{profile.address_line1}</div>}
                  {profile?.address_line2 && <div>{profile.address_line2}</div>}
                  {(profile?.city || profile?.region || profile?.postal_code) && (
                    <div>
                      {[profile?.city, profile?.region, profile?.postal_code]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  )}
                  {profile?.country && <div>{profile.country}</div>}
                </div>
              )}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-earth-500 font-semibold mb-2">
                Detay
              </div>
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-earth-600">Plan:</dt>
                  <dd className="text-ink font-semibold">{planLabel}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-earth-600">Kòmanse:</dt>
                  <dd className="text-ink">{formatDate(sub.start_date)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-earth-600">Fini:</dt>
                  <dd className="text-ink">{formatDate(sub.end_date)}</dd>
                </div>
                {sub.payment_reference && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-earth-600">Ref. pèman:</dt>
                    <dd className="text-ink font-mono text-xs break-all">
                      {sub.payment_reference}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </section>

          {/* Line items */}
          <section className="py-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-earth-500 font-semibold">
                  <th className="text-left pb-3">Atik</th>
                  <th className="text-right pb-3">Kantite</th>
                  <th className="text-right pb-3">Pri</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-cream-200">
                  <td className="py-4">
                    <div className="font-semibold text-ink">
                      Abònman {planLabel}
                    </div>
                    <div className="text-xs text-earth-600 mt-0.5">{tagline}</div>
                  </td>
                  <td className="text-right py-4 text-ink">1</td>
                  <td className="text-right py-4 font-mono text-ink">
                    ${subtotal.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Totals */}
          <section className="border-t border-cream-200 pt-6 flex justify-end">
            <div className="w-full sm:w-72 space-y-2 text-sm">
              <div className="flex justify-between text-earth-700">
                <span>Sou-total</span>
                <span className="font-mono">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-earth-700">
                <span>Taks</span>
                <span className="font-mono">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-cream-200 font-display text-lg font-bold text-ink">
                <span>Total</span>
                <span className="font-mono">${total.toFixed(2)} USD</span>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-10 pt-6 border-t border-cream-200 text-xs text-earth-600 leading-relaxed">
            <p className="mb-2">
              <strong className="text-ink">Mèsi pou konfyans ou ak Hoïs Inivèsite.</strong>{' '}
              Resi sa a se yon dokiman ofisyèl pou rejis pèsonèl ou.
            </p>
            <p>
              Si ou gen kesyon sou faktirasyon, ekri{' '}
              <a href="mailto:contact@hoismedikaplant.com" className="text-forest-700">
                contact@hoismedikaplant.com
              </a>{' '}
              ak ID#{invoiceNumber}.
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}

