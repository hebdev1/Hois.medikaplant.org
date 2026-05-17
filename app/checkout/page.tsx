import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Check, Leaf, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PLANS, isValidPlan } from './plans';
import CheckoutForm from './checkout-form';

export const metadata = { title: 'Checkout' };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  const planKey = searchParams.plan;

  if (!isValidPlan(planKey)) {
    redirect('/#pri');
  }

  const plan = PLANS[planKey];

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/signup?plan=${plan.key}&redirect=/checkout?plan=${plan.key}`);
  }

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
            Konplete pèman ou pou <span className="text-brand-600">{plan.name}</span>
          </h1>
          <p className="mt-3 text-ink-muted">
            Apre w peye, w ap jwenn aksè a tout sa plan an ofri imedyatman.
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
                <p className="text-2xl font-extrabold text-ink leading-none">
                  ${plan.price}
                </p>
                <p className="text-xs text-ink-muted mt-1">/ {plan.period}</p>
              </div>
            </div>

            <ul className="py-5 space-y-3 border-b border-slate-100">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-3 items-start text-sm text-ink/85">
                  <span className="mt-0.5 grid place-items-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 shrink-0">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </span>
                  <span className="leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>

            <dl className="pt-5 space-y-2 text-sm">
              <div className="flex justify-between text-ink-muted">
                <dt>Sou-total</dt>
                <dd>${plan.price}.00</dd>
              </div>
              <div className="flex justify-between text-ink-muted">
                <dt>Taks</dt>
                <dd>$0.00</dd>
              </div>
              <div className="flex justify-between text-ink font-bold text-base pt-3 border-t border-slate-100">
                <dt>Total kounye a</dt>
                <dd>${plan.price}.00 USD</dd>
              </div>
            </dl>
          </aside>

          {/* RIGHT — Payment form */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 md:p-8 lg:order-1">
            <h2 className="text-lg font-bold text-ink mb-1">Enfòmasyon pèman</h2>
            <p className="text-sm text-ink-muted mb-6">
              Konekte tankou <strong className="text-ink">{user.email}</strong>
            </p>

            <CheckoutForm plan={plan.key} amount={plan.price} />
          </section>
        </div>
      </div>
    </main>
  );
}
