import type { SupabaseClient } from '@supabase/supabase-js';
import { sendEmail } from './resend';
import { renderBrandedEmail } from './template';
import {
  normalizeLang,
  notifyCopy,
  NOTIFY_STYLE,
  type Accent,
  type FooterVariant,
  type Lang,
  type NotifyResult,
  type NotifyVars,
} from './copy';

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

// Two shapes:
//
//  • KIND — a fixed notification (daily advice, weekly summary, badge). Its
//    copy is resolved per language from lib/email/copy.ts, so the same event
//    reaches each member in their own language.
//
//  • FREE — an admin-authored one-off (support reply, treatment proposal, a
//    custom admin notice). The admin writes the text, so it isn't
//    auto-translated; only the surrounding chrome (greeting, footer)
//    localizes. Still rendered through the shared branded template.
type KindArgs =
  | { kind: 'daily_advice'; vars: NotifyVars['daily_advice']; requirePref?: EmailPrefKey }
  | { kind: 'weekly_summary'; vars: NotifyVars['weekly_summary']; requirePref?: EmailPrefKey }
  | { kind: 'badge_unlock'; vars: NotifyVars['badge_unlock']; requirePref?: EmailPrefKey };

type FreeArgs = {
  subject: string;
  heading: string;
  body: string[];
  linkPath?: string;
  linkLabel?: string;
  requirePref?: EmailPrefKey;
};

export type NotifyArgs = KindArgs | FreeArgs;

type Rendered = {
  subject: string;
  heading: string;
  paragraphs: string[];
  cta?: { label: string; url: string };
  accent: Accent;
  footer: FooterVariant;
};

// Switch so each branch narrows `vars` to the shape its kind expects.
function resolveKindCopy(args: KindArgs, lang: Lang): NotifyResult {
  switch (args.kind) {
    case 'daily_advice':
      return notifyCopy('daily_advice', lang, args.vars);
    case 'weekly_summary':
      return notifyCopy('weekly_summary', lang, args.vars);
    case 'badge_unlock':
      return notifyCopy('badge_unlock', lang, args.vars);
  }
}

function buildRendered(args: NotifyArgs, lang: Lang): Rendered {
  if ('kind' in args) {
    const c = resolveKindCopy(args, lang);
    const { accent, footer } = NOTIFY_STYLE[args.kind];
    return {
      subject: c.subject,
      heading: c.heading,
      paragraphs: c.paragraphs,
      cta: { label: c.ctaLabel, url: `${SITE_URL}${c.linkPath}` },
      accent,
      footer,
    };
  }
  // Free-form admin message: brand-neutral green accent, notification footer
  // (so the member keeps a manage link — these still obey the master switch).
  return {
    subject: args.subject,
    heading: args.heading,
    paragraphs: args.body,
    cta:
      args.linkPath && args.linkLabel
        ? { label: args.linkLabel, url: `${SITE_URL}${args.linkPath}` }
        : undefined,
    accent: 'green',
    footer: 'notification',
  };
}

/**
 * Send a branded, localized email to a member IF they have email
 * notifications on.
 *
 * Must be called with an admin-scoped Supabase client (the actor needs
 * RLS rights to read the target's email + preferences — admins do via the
 * "Admins read all" policies). Silently no-ops when:
 *   • the member has no email,
 *   • email_notifications is OFF,
 *   • the per-category requirePref is OFF,
 *   • RESEND_API_KEY isn't configured yet.
 *
 * Never throws — email failure must not break the originating action.
 */
export async function emailNotifyMember(
  supabase: SupabaseClient,
  userId: string,
  args: NotifyArgs
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

    // Master switch + categorized opt-in + language in one round-trip.
    const { data: prefRaw } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    const prefs = prefRaw as Record<string, unknown> | null;

    const masterOn = (prefs?.email_notifications as boolean | undefined) ?? true;
    if (!masterOn) return;
    if (args.requirePref) {
      const categoryOn = (prefs?.[args.requirePref] as boolean | undefined) ?? false;
      if (!categoryOn) return;
    }

    const lang = normalizeLang(prefs?.language as string | undefined);
    const firstName =
      profile.first_name ||
      profile.full_name?.split(' ')[0] ||
      profile.email.split('@')[0];

    const r = buildRendered(args, lang);
    const html = renderBrandedEmail({
      lang,
      accent: r.accent,
      footer: r.footer,
      firstName,
      heading: r.heading,
      paragraphs: r.paragraphs,
      cta: r.cta,
    });

    await sendEmail({ to: profile.email, subject: r.subject, html });
  } catch {
    // Swallow — email is best-effort, never blocks the caller.
  }
}
