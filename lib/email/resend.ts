/**
 * Thin Resend wrapper. Sends transactional email from server actions.
 *
 * Configuration (Vercel env vars):
 *   RESEND_API_KEY  — your Resend secret (re_...). REQUIRED to send.
 *   EMAIL_FROM      — e.g. "Hoïs MedikaPlant <notifications@medikaplant.org>".
 *                     Until you verify medikaplant.org in Resend, you can
 *                     only send from "onboarding@resend.dev" and only to
 *                     your own Resend account email (test mode).
 *
 * If RESEND_API_KEY is missing the helper NO-OPS (returns ok:false) so the
 * rest of the app keeps working before email is configured — a missing key
 * never throws or blocks a server action.
 */

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

export type EmailResult = { ok: true } | { ok: false; error: string };

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: SendArgs): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY pa konfigire.' };
  }
  const from =
    process.env.EMAIL_FROM ?? 'Hoïs MedikaPlant <onboarding@resend.dev>';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return { ok: false, error: `Resend ${res.status}: ${detail.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
