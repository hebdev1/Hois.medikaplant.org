import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { sendEmail } from '@/lib/email/resend';
import { createServiceClient } from '@/lib/supabase/service';
import { authCopy, authStyle, normalizeLang, type Lang } from '@/lib/email/copy';
import { renderBrandedEmail } from '@/lib/email/template';

// ───────────────────────────────────────────────────────────────────────────
// Supabase Send Email Hook
//
// Supabase Auth fires every outgoing email (recovery, magic-link, signup
// confirm, email change, invite, reauth) at this endpoint *instead of*
// shipping its default English templates. We verify the request came from
// Supabase using Standard Webhooks HMAC, render our own branded HTML in the
// member's language (see lib/email/template.ts + copy.ts), and ship via Resend.
//
// Required env vars:
//   SUPABASE_AUTH_HOOK_SECRET — the shared secret you paste into
//     Supabase Dashboard → Authentication → Hooks → Send email hook.
//     Format: `v1,whsec_<base64-secret>` (Supabase prefills the v1, prefix
//     when you generate the secret).
//   RESEND_API_KEY + EMAIL_FROM — already used by lib/email/resend.ts.
//
// Configure in Supabase Dashboard:
//   1. Authentication → Hooks → Send email hook → Enable
//   2. URL: https://hoismedikaplant.com/api/auth/send-email
//   3. Generate secret, copy into Vercel env as SUPABASE_AUTH_HOOK_SECRET
//
// Standard Webhooks signature spec:
//   https://www.standardwebhooks.com/
// The minimal verifier we implement here avoids pulling the heavy
// standardwebhooks npm package — under 30 lines and zero new dependencies.
// ───────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type EmailActionType =
  | 'signup'
  | 'invite'
  | 'magiclink'
  | 'recovery'
  | 'email_change'
  | 'email_change_new'
  | 'reauthentication';

type SupabaseEmailHookPayload = {
  user: {
    id: string;
    email: string;
    // Present only during an email change — the address the member is
    // switching TO. Supabase does NOT put it in `email`, which stays the
    // current address until the change is confirmed.
    new_email?: string;
    user_metadata?: Record<string, unknown> | null;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: EmailActionType;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
};

function safeEqual(a: string, b: string): boolean {
  // Pad to equal length so timingSafeEqual doesn't throw on mismatched
  // sizes (which would itself be a timing oracle).
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    // Still touch a comparable buffer so timing remains constant.
    timingSafeEqual(aBuf, Buffer.alloc(aBuf.length));
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

function verifySignature(
  body: string,
  headers: Headers
): { ok: true } | { ok: false; reason: string } {
  const rawSecret = process.env.SUPABASE_AUTH_HOOK_SECRET ?? '';
  // Supabase prefixes secrets with `v1,whsec_` — strip both off so the
  // same env var value works whether the user pasted the full versioned
  // form or just the base64 inner part.
  const secret = rawSecret
    .replace(/^v1,/, '')
    .replace(/^whsec_/, '');
  if (!secret) {
    return { ok: false, reason: 'hook_secret_not_configured' };
  }

  // ── Path A: simple Bearer token (Supabase "HTTPS only" auth hooks) ──
  // Newer Supabase auth-hook UI doesn't sign payloads — it just sends
  // `Authorization: Bearer <secret>`. Accept that when it matches the
  // configured secret (compared timing-safely).
  const auth = headers.get('authorization') ?? '';
  if (auth.toLowerCase().startsWith('bearer ')) {
    const token = auth.slice(7).trim();
    if (safeEqual(token, secret) || safeEqual(token, rawSecret)) {
      return { ok: true };
    }
    return { ok: false, reason: 'invalid_bearer_token' };
  }

  // ── Path B: Standard Webhooks HMAC signature ──────────────────────────
  const id = headers.get('webhook-id');
  const timestamp = headers.get('webhook-timestamp');
  const signatureHeader = headers.get('webhook-signature');
  if (!id || !timestamp || !signatureHeader) {
    return { ok: false, reason: 'missing_webhook_headers' };
  }

  const signedPayload = `${id}.${timestamp}.${body}`;
  const secretBytes = Buffer.from(secret, 'base64');
  const expected = createHmac('sha256', secretBytes)
    .update(signedPayload)
    .digest('base64');

  // `webhook-signature` is space-separated `v1,<sig> v1,<sig2>` — any
  // version-1 signature that matches is acceptable.
  const candidates = signatureHeader
    .split(' ')
    .map((s) => s.trim())
    .filter((s) => s.startsWith('v1,'))
    .map((s) => s.slice(3));

  for (const candidate of candidates) {
    if (safeEqual(candidate, expected)) return { ok: true };
  }
  return { ok: false, reason: 'invalid_signature' };
}

// ───────────────────────────────────────────────────────────────────────────
// Language resolution. Emails render in the member's own language. Source of
// truth is user_preferences.language; fall back to a language in
// user_metadata (set at signup, if any), then Kreyòl. A lookup failure — a
// missing service key or, for a brand-new signup, no preferences row yet —
// must never block sending, so every path returns a valid Lang.
// ───────────────────────────────────────────────────────────────────────────
async function resolveLang(
  userId: string,
  userMeta?: Record<string, unknown> | null
): Promise<Lang> {
  try {
    const sb = createServiceClient();
    const { data } = await sb
      .from('user_preferences')
      .select('language')
      .eq('user_id', userId)
      .maybeSingle();
    const stored = (data as { language?: string } | null)?.language;
    if (stored) return normalizeLang(stored);
  } catch {
    // service key absent or row missing — fall through to metadata / default
  }
  const metaLang = userMeta?.language;
  return normalizeLang(typeof metaLang === 'string' ? metaLang : undefined);
}

// ───────────────────────────────────────────────────────────────────────────
// Render one auth email through the shared branded template. Copy + accent +
// footer come from lib/email/copy.ts. Reauth is the only type with a code box
// (the OTP) and a button that returns to the app rather than a verify link.
// ───────────────────────────────────────────────────────────────────────────
function renderEmail(
  payload: SupabaseEmailHookPayload,
  verifyUrl: string,
  lang: Lang
): { subject: string; html: string } {
  const { user, email_data } = payload;
  const type = email_data.email_action_type;
  const firstName =
    (user.user_metadata?.first_name as string | undefined)?.trim() ||
    (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ||
    user.email.split('@')[0];

  const copy = authCopy(type, lang);
  const { accent, footer } = authStyle(type);
  const isReauth = type === 'reauthentication';
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || 'https://hoismedikaplant.com'
  ).replace(/\/$/, '');

  const html = renderBrandedEmail({
    lang,
    accent,
    footer,
    firstName,
    heading: copy.heading,
    paragraphs: copy.paragraphs,
    note: copy.note,
    codeBox: isReauth ? email_data.token : undefined,
    cta: copy.ctaLabel
      ? { label: copy.ctaLabel, url: isReauth ? `${siteUrl}/dashboard` : verifyUrl }
      : undefined,
  });

  return { subject: copy.subject, html };
}

type SendTarget = { to: string; tokenHash: string };

/**
 * Who this hook invocation must email, and with which token.
 *
 * Every flow except email change is a single message to the account's
 * address. Email change is the exception: the confirmation that actually
 * completes the switch has to reach the NEW address and carry the NEW token
 * (token_hash_new). With "Secure email change" enabled Supabase also wants
 * the current address to confirm, using the original token — so we send to
 * both when both tokens are present.
 */
function resolveTargets(payload: SupabaseEmailHookPayload): SendTarget[] {
  const { user, email_data } = payload;
  const action = email_data.email_action_type;

  if (action === 'email_change' || action === 'email_change_new') {
    const targets: SendTarget[] = [];

    // Essential leg: confirm the new address with the new token.
    if (user.new_email && email_data.token_hash_new) {
      targets.push({ to: user.new_email, tokenHash: email_data.token_hash_new });
    }
    // Secure-change leg: confirm the current address with the original
    // token — only when it's a distinct token from the new one.
    if (
      email_data.token_hash &&
      email_data.token_hash !== email_data.token_hash_new
    ) {
      targets.push({ to: user.email, tokenHash: email_data.token_hash });
    }
    if (targets.length > 0) return targets;
    // Fallback for older payloads that omit new_email / token_hash_new.
    return [{ to: user.email, tokenHash: email_data.token_hash }];
  }

  return [{ to: user.email, tokenHash: email_data.token_hash }];
}

/**
 * Build the verification URL Supabase wants the user to click.
 *
 * `tokenHash` is passed in rather than read off email_data because an email
 * change produces TWO tokens — token_hash (current address) and
 * token_hash_new (new address) — and each confirmation link must carry the
 * one that matches its recipient.
 */
function buildVerifyUrl(
  payload: SupabaseEmailHookPayload,
  tokenHash: string
): string {
  const { email_data } = payload;

  // We deliberately IGNORE email_data.redirect_to here. Supabase
  // silently rewrites any redirect_to that isn't on the Redirect URLs
  // allow-list back to the bare Site URL — so `redirectTo:
  // siteUrl('/auth/reset-password')` from the client comes through to
  // the hook as just `https://hoismedikaplant.com/`, which would land
  // users on the homepage instead of the form they need.
  //
  // Pinning the target path here per email_action_type makes the link
  // correct even if the operator never touches the Supabase Redirect
  // URLs panel. The token_hash + type query params are exchanged for
  // a session on the landing page via supabase.auth.verifyOtp(), which
  // enforces the same single-use semantics that /auth/v1/verify would.
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || 'https://hoismedikaplant.com'
  ).replace(/\/$/, '');

  const pathByAction: Record<string, string> = {
    recovery: '/auth/reset-password',
    magiclink: '/auth/login',
    signup: '/auth/login',
    invite: '/auth/login',
    email_change: '/dashboard/settings',
    email_change_new: '/dashboard/settings',
    reauthentication: '/dashboard',
  };
  const targetPath = pathByAction[email_data.email_action_type] ?? '/';

  const url = new URL(`${siteUrl}${targetPath}`);
  url.searchParams.set('token_hash', email_data.token_hash);
  url.searchParams.set('type', email_data.email_action_type);
  return url.toString();
}

// ───────────────────────────────────────────────────────────────────────────
// Diagnostic GET — hit /api/auth/send-email?debug=<token> in a browser to
// see which env vars are configured without revealing their values. The
// debug token is the FIRST 8 CHARACTERS of SUPABASE_AUTH_HOOK_SECRET so
// only someone who already has the secret can read it. If the secret is
// missing entirely, the endpoint stays public BUT only reveals missing-
// flag booleans — no value, no length, no hint at the real secret.
// ───────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const expectedToken = (process.env.SUPABASE_AUTH_HOOK_SECRET || '')
    .replace(/^v1,/, '')
    .replace(/^whsec_/, '')
    .slice(0, 8);
  const provided = new URL(req.url).searchParams.get('debug') ?? '';
  const authorized = expectedToken.length > 0 && provided === expectedToken;

  const status = {
    SUPABASE_AUTH_HOOK_SECRET: !!process.env.SUPABASE_AUTH_HOOK_SECRET,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    EMAIL_FROM: !!process.env.EMAIL_FROM,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    CONTACT_REPLY_TO: !!process.env.CONTACT_REPLY_TO,
  };
  const result: Record<string, unknown> = { ok: true, env: status };

  if (authorized) {
    // Authorized callers see the FORMAT of EMAIL_FROM so they can spot
    // typos like a missing angle bracket without us echoing the raw value.
    const from = process.env.EMAIL_FROM ?? '';
    result.emailFromShape = {
      length: from.length,
      hasName: from.includes('<') && from.includes('>'),
      hasAtSign: from.includes('@'),
      preview: from.slice(0, 4) + '…' + from.slice(-12),
    };
  }

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  try {
    let bodyText: string;
    try {
      bodyText = await req.text();
    } catch (e) {
      console.error('[send-email] cannot read body', e);
      return NextResponse.json(
        { error: 'cannot_read_body' },
        { status: 400 }
      );
    }

    // Signature verification — short-circuit before parsing JSON so an
    // unauthenticated caller never gets a chance to influence our state.
    const verified = verifySignature(bodyText, req.headers);
    if (!verified.ok) {
      console.error('[send-email] signature verification failed:', verified.reason);
      return NextResponse.json(
        { error: verified.reason },
        { status: 401 }
      );
    }

    let payload: SupabaseEmailHookPayload;
    try {
      payload = JSON.parse(bodyText) as SupabaseEmailHookPayload;
    } catch (e) {
      console.error('[send-email] invalid JSON', e);
      return NextResponse.json(
        { error: 'invalid_json' },
        { status: 400 }
      );
    }
    if (!payload?.user?.email || !payload?.email_data?.email_action_type) {
      console.error(
        '[send-email] missing required fields. Got keys:',
        Object.keys(payload || {}),
        'user keys:',
        Object.keys(payload?.user || {}),
        'email_data keys:',
        Object.keys(payload?.email_data || {})
      );
      return NextResponse.json(
        { error: 'missing_required_fields' },
        { status: 400 }
      );
    }

    const targets = resolveTargets(payload);
    const lang = await resolveLang(payload.user.id, payload.user.user_metadata);
    const replyTo =
      process.env.CONTACT_REPLY_TO || process.env.EMAIL_FROM || undefined;

    // eslint-disable-next-line no-console
    console.log(
      '[send-email] sending',
      payload.email_data.email_action_type,
      `(${lang})`,
      'to',
      targets.map((t) => t.to).join(', ')
    );

    for (const target of targets) {
      const verifyUrl = buildVerifyUrl(payload, target.tokenHash);
      const { subject, html } = renderEmail(payload, verifyUrl, lang);

      const result = await sendEmail({ to: target.to, subject, html, replyTo });

      if (!result.ok) {
        // Loud server log so operators can see the actual Resend message in
        // the Hostinger/Vercel runtime logs. Surface the message in the
        // response body too — Supabase shows only the status code in the
        // UI but the body still lands in their hook delivery log.
        console.error(
          `[send-email] Resend failed for ${target.to}:`,
          result.error
        );
        return NextResponse.json(
          {
            error: {
              message: result.error,
              http_code: 500,
              hint: result.error.includes('verify a domain')
                ? 'Resend sandbox: you can only send to the email registered on your Resend account. Verify a custom domain in Resend → Domains and set EMAIL_FROM to use it.'
                : undefined,
            },
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    // Last-resort catch so an unhandled crash doesn't leak a stack trace
    // through Supabase's hook delivery UI. Still log it for diagnosis.
    console.error('[send-email] unexpected error', e);
    return NextResponse.json(
      { error: (e as Error).message ?? 'unexpected' },
      { status: 500 }
    );
  }
}
