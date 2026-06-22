import type { SupabaseClient } from '@supabase/supabase-js';
import { sendEmail } from './resend';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'https://hoismedikaplant.com';

// Which boolean columns on user_preferences gate a given email type.
// `email_notifications` is the master switch — every email respects it.
// The other keys are per-category opt-outs the member chooses in their
// settings panel.
export type EmailPrefKey =
  | 'daily_advice_email'
  | 'weekly_summary_email'
  | 'badge_unlock_email';

type NotifyOpts = {
  subject: string;
  /** Big heading inside the email body. */
  heading: string;
  /** One or more paragraphs of body text (plain strings; rendered as <p>). */
  body: string | string[];
  /** Optional CTA button path (relative, e.g. '/dashboard/health'). */
  linkPath?: string;
  linkLabel?: string;
  /**
   * Optional secondary preference key to check on top of `email_notifications`.
   * Omit for transactional / direct-from-admin emails that should land even
   * if the user opted out of categorized notifications.
   */
  requirePref?: EmailPrefKey;
};

/**
 * Send a branded email to a member IF they have email notifications on.
 *
 * Must be called with an admin-scoped Supabase client (the actor needs
 * RLS rights to read the target's email + preferences — admins do via the
 * "Admins read all" policies). Silently no-ops when:
 *   • the member has no email,
 *   • email_notifications is OFF,
 *   • RESEND_API_KEY isn't configured yet.
 *
 * Never throws — email failure must not break the originating action.
 */
export async function emailNotifyMember(
  supabase: SupabaseClient,
  userId: string,
  opts: NotifyOpts
): Promise<void> {
  try {
    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('email, full_name, first_name')
      .eq('id', userId)
      .maybeSingle();
    const profile = profileRaw as {
      email: string | null;
      full_name: string | null;
      first_name: string | null;
    } | null;
    if (!profile?.email) return;

    // Pull both the master switch + (optionally) the categorized opt-in
    // in a single round-trip. select('*') is fine because the row is tiny
    // and we don't want the field list to drift if we add more pref keys.
    const { data: prefRaw } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    const prefs = prefRaw as Record<string, unknown> | null;

    const masterOn = (prefs?.email_notifications as boolean | undefined) ?? true;
    if (!masterOn) return;
    if (opts.requirePref) {
      const categoryOn = (prefs?.[opts.requirePref] as boolean | undefined) ?? false;
      if (!categoryOn) return;
    }

    const firstName =
      profile.first_name ||
      profile.full_name?.split(' ')[0] ||
      profile.email.split('@')[0];

    const html = renderTemplate({
      firstName,
      heading: opts.heading,
      body: Array.isArray(opts.body) ? opts.body : [opts.body],
      linkUrl: opts.linkPath ? `${SITE_URL}${opts.linkPath}` : undefined,
      linkLabel: opts.linkLabel,
    });

    await sendEmail({ to: profile.email, subject: opts.subject, html });
  } catch {
    // Swallow — email is best-effort, never blocks the caller.
  }
}

function renderTemplate({
  firstName,
  heading,
  body,
  linkUrl,
  linkLabel,
}: {
  firstName: string;
  heading: string;
  body: string[];
  linkUrl?: string;
  linkLabel?: string;
}): string {
  const paragraphs = body
    .map(
      (p) =>
        `<p style="margin:0 0 16px;color:#3f3a52;font-size:15px;line-height:1.6;">${escapeHtml(
          p
        )}</p>`
    )
    .join('');

  const button =
    linkUrl && linkLabel
      ? `<a href="${linkUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:9999px;">${escapeHtml(
          linkLabel
        )}</a>`
      : '';

  return `<!doctype html>
<html lang="ht">
  <body style="margin:0;padding:0;background:#f6f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f5f0;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e5dd;">
            <tr>
              <td style="background:linear-gradient(135deg,#16a34a,#166534);padding:24px 28px;">
                <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.01em;">MedikaPlant</span>
                <span style="color:#bbf7d0;font-size:11px;text-transform:uppercase;letter-spacing:0.18em;display:block;margin-top:2px;">Hoïs Inivèsite</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 16px;color:#050040;font-size:22px;line-height:1.3;">${escapeHtml(
                  heading
                )}</h1>
                <p style="margin:0 0 16px;color:#3f3a52;font-size:15px;line-height:1.6;">Bonjou ${escapeHtml(
                  firstName
                )},</p>
                ${paragraphs}
                ${button ? `<div style="margin:24px 0 8px;">${button}</div>` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;border-top:1px solid #e7e5dd;">
                <p style="margin:0;color:#8a8699;font-size:12px;line-height:1.5;">
                  Ou resevwa imèl sa paske ou gen yon kont MedikaPlant Hoïs Inivèsite.
                  Pou sispann, ale nan paramèt ou epi etenn notifikasyon yo.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
