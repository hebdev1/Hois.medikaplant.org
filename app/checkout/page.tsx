import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Check, Leaf, ArrowLeft, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import {
  PLANS,
  isValidPlan,
  isValidCycle,
  priceFor,
  type BillingCycle,
} from './plans';
import CheckoutForm from './checkout-form';

export const metadata = { title: 'Checkout' };
export const dynamic = 'force-dynamic';

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { plan?: string; cycle?: string };
}) {
  const planKey = searchParams.plan;

  if (!isValidPlan(planKey)) {
    redirect('/#pri');
  }

  const plan = PLANS[planKey];
  const cycle: BillingCycle = isValidCycle(searchParams.cycle)
    ? searchParams.cycle
    : 'yearly';

  // Resolved price for the chosen cycle. Used to render the order summary;
  // the edge function re-resolves it from get_plan_price() on submit so
  // the user can't tamper with what they pay.
  const displayPrice = priceFor(plan, cycle);
  const savings =
    cycle === 'yearly' ? plan.priceYearlyOriginal - plan.priceYearlyDiscounted : 0;

  // We intentionally DO NOT redirect anonymous visitors away — they should
  // land on this page with the plan they chose and complete login OR signup
  // inline as part of the purchase flow. The Haiti-only gate is applied
  // inside the server action when a fresh signup is being created.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-gradient text-white shadow">
              <Leaf className="w-4 h-4" strokeWidth={2.4} />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-bold text-ink text-sm">MedikaPlant</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-brand-700 font-medium">
                Hoïs Inivèsite
              </span>
            </span>
          </Link>
          <Link
            href="/#pri"
            className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2.2} />
            Tounen sou plan yo
          </Link>
        </div>
      </header>

      <div className="max-w-[1180px] mx-auto px-4 md:px-12 py-10 md:py-16">
        <div className="mb-10 text-center max-w-[640px] mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-4">
            Etap final
          </span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Konplete pèman ou pou{' '}
            <span className="text-brand-600">{plan.name}</span>
          </h1>
          <p className="mt-3 text-ink-muted">
            {user
              ? 'Antre detay pèman ou pou aktive plan an imedyatman.'
              : 'Konekte (oswa kreye yon kont) epi peye nan menm fòm sa.'}
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-6 lg:gap-10">
          {/* LEFT — Order summary */}
          <aside className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 md:p-8 lg:order-2">
            <h2 className="text-sm uppercase tracking-wide text-ink-muted font-semibold mb-4">
              Rezime kòmand ou
            </h2>

            <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-ink">{plan.name}</h3>
                <p className="text-sm text-ink-muted mt-0.5">{plan.tagline}</p>
              </div>
              <div className="text-right">
                {cycle === 'yearly' && (
                  <p className="text-xs text-ink-muted line-through">
                    ${plan.priceYearlyOriginal.toFixed(2)}
                  </p>
                )}
                <p className="text-2xl font-extrabold text-ink leading-none">
                  ${displayPrice.toFixed(2)}
                </p>
                <p className="text-xs text-ink-muted mt-1">
                  / {cycle === 'yearly' ? 'an' : 'mwa'}
                </p>
                {cycle === 'yearly' && savings > 0 && (
                  <p className="mt-1 inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    Ekonomize ${savings.toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            <ul className="py-5 space-y-3 border-b border-slate-100">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex gap-3 items-start text-sm text-ink/85"
                >
                  <span className="mt-0.5 grid place-items-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 shrink-0">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </span>
                  <span className="leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>

            <dl className="pt-5 space-y-2 text-sm">
              {cycle === 'yearly' && (
                <>
                  <div className="flex justify-between text-ink-muted">
                    <dt>Pri anyèl</dt>
                    <dd>${plan.priceYearlyOriginal.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <dt>Rabè 10% (anyèl)</dt>
                    <dd>− ${savings.toFixed(2)}</dd>
                  </div>
                </>
              )}
              {cycle === 'monthly' && (
                <div className="flex justify-between text-ink-muted">
                  <dt>Pèman mansyèl</dt>
                  <dd>${displayPrice.toFixed(2)}</dd>
                </div>
              )}
              <div className="flex justify-between text-ink-muted">
                <dt>Taks</dt>
                <dd>$0.00</dd>
              </div>
              <div className="flex justify-between text-ink font-bold text-base pt-3 border-t border-slate-100">
                <dt>Total kounye a</dt>
                <dd>${displayPrice.toFixed(2)} USD</dd>
              </div>
            </dl>

            <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-[11px] text-slate-700 flex items-start gap-2">
              <Lock
                className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-500"
                strokeWidth={2.2}
              />
              <span>
                Plan sa yo disponib <strong>pou tout moun atravè lemond</strong>.
                Ou ka kreye yon kont peye epi jwenn aksè ak sèvis yo kèlkeswa peyi kote w ap viv.
              </span>
            </div>
          </aside>

          {/* RIGHT — Auth + Payment form */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 md:p-8 lg:order-1">
            <CheckoutForm
              plan={plan.key}
              cycle={cycle}
              amount={displayPrice}
              userEmail={user?.email ?? null}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
