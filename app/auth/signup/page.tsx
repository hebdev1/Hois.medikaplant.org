import { redirect } from 'next/navigation';

export const metadata = { title: 'Kreye yon kont' };

/**
 * Direct signup is intentionally disabled. New accounts must originate from
 * the checkout flow so a plan is selected (and paid for) up front. Anyone
 * who lands on this URL — via a bookmark, an old email link, or a typed
 * address — gets bounced:
 *   • If they brought a `plan` param, send them straight to /checkout
 *     where the inline signup form will create the account on submission.
 *   • Otherwise, send them to the landing-page pricing section so they
 *     pick a plan first.
 */
export default function SignupPage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  if (searchParams.plan) {
    redirect(`/checkout?plan=${searchParams.plan}`);
  }
  redirect('/#pri');
}
