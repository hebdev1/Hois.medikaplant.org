import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { sendEmail } from '@/lib/email/resend';

// ───────────────────────────────────────────────────────────────────────────
// Supabase Send Email Hook
//
// Supabase Auth fires every outgoing email (recovery, magic-link, signup
// confirm, email change, invite, reauth) at this endpoint *instead of*
// shipping its default English templates. We verify the request came from
// Supabase using Standard Webhooks HMAC, render our own Kreyòl-branded
// HTML, and ship via Resend.
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

function verifySignature(
  body: string,
  headers: Headers
): { ok: true } | { ok: false; reason: string } {
  const rawSecret = process.env.SUPABASE_AUTH_HOOK_SECRET ?? '';
  // Supabase prefixes secrets with `v1,whsec_` — strip both off.
  const secret = rawSecret
    .replace(/^v1,/, '')
    .replace(/^whsec_/, '');
  if (!secret) {
    return { ok: false, reason: 'hook_secret_not_configured' };
  }

  const id = headers.get('webhook-id');
  const timestamp = headers.get('webhook-timestamp');
  const signatureHeader = headers.get('webhook-signature');
  if (!id || !timestamp || !signatureHeader) {
    return { ok: false, reason: 'missing_webhook_headers' };
  }

  // Standard Webhooks: signed_payload = `${id}.${timestamp}.${body}`
  const signedPayload = `${id}.${timestamp}.${body}`;
  const secretBytes = Buffer.from(secret, 'base64');
  const expected = createHmac('sha256', secretBytes)
    .update(signedPayload)
    .digest('base64');

  // The header is space-separated `v1,<sig> v1,<sig2>` — any version 1
  // signature that matches is acceptable. timingSafeEqual prevents
  // timing-based comparison leaks.
  const candidates = signatureHeader
    .split(' ')
    .map((s) => s.trim())
    .filter((s) => s.startsWith('v1,'))
    .map((s) => s.slice(3));

  for (const candidate of candidates) {
    try {
      const a = Buffer.from(candidate);
      const b = Buffer.from(expected);
      if (a.length === b.length && timingSafeEqual(a, b)) {
        return { ok: true };
      }
    } catch {
      /* malformed candidate, try next */
    }
  }
  return { ok: false, reason: 'invalid_signature' };
}

// ───────────────────────────────────────────────────────────────────────────
// Branded HTML templates per email type. Kept inline here so the hook is
// self-contained; we could share with lib/email/notify.ts later if we
// need both flows to drift in lockstep.
// ───────────────────────────────────────────────────────────────────────────
function renderEmail(
  payload: SupabaseEmailHookPayload
): { subject: string; html: string } {
  const { user, email_data } = payload;
  const firstName =
    (user.user_metadata?.first_name as string | undefined)?.trim() ||
    (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ||
    user.email.split('@')[0];

  // The action link Supabase wants us to embed. It contains the token
  // hash + a redirect_to query param so the user lands back in our app.
  const verifyUrl = buildVerifyUrl(payload);

  switch (email_data.email_action_type) {
    case 'recovery':
      return {
        subject: 'Reyajiste modpas ou — Hoïs MedikaPlant',
        html: brandedTemplate({
          firstName,
          heading: 'Reyajiste modpas ou',
          body: [
            "Nou resevwa yon demand pou reyajiste modpas kont MedikaPlant ou.",
            'Klike sou bouton anba a pou chwazi yon nouvo modpas. Lyen sa ap ekspire nan yon èdtan.',
            "Si se pa ou ki te mande sa, ou ka inyore mesaj sa — kont ou rete an sekirite.",
          ],
          linkLabel: 'Chwazi yon nouvo modpas',
          linkUrl: verifyUrl,
        }),
      };

    case 'magiclink':
      return {
        subject: 'Lyen koneksyon ou — Hoïs MedikaPlant',
        html: brandedTemplate({
          firstName,
          heading: 'Konekte san modpas',
          body: [
            'Klike sou bouton anba a pou konekte sou kont MedikaPlant ou.',
            'Lyen sa ap ekspire nan yon èdtan.',
          ],
          linkLabel: 'Konekte kounye a',
          linkUrl: verifyUrl,
        }),
      };

    case 'signup':
      return {
        subject: 'Konfime kont MedikaPlant ou',
        html: brandedTemplate({
          firstName,
          heading: 'Byenveni nan Hoïs',
          body: [
            "Mèsi pou enskripsyon ou nan MedikaPlant — Hoïs Inivèsite.",
            'Klike sou bouton anba a pou konfime imèl ou ak aktive kont ou.',
          ],
          linkLabel: 'Konfime imèl mwen',
          linkUrl: verifyUrl,
        }),
      };

    case 'invite':
      return {
        subject: 'Ou envite nan MedikaPlant — Hoïs Inivèsite',
        html: brandedTemplate({
          firstName,
          heading: 'Yon envitasyon pou ou',
          body: [
            "Yon admin MedikaPlant envite ou rantre nan kominote Hoïs la.",
            'Klike sou bouton anba a pou aktive kont ou ak chwazi modpas ou.',
          ],
          linkLabel: 'Aksepte envitasyon an',
          linkUrl: verifyUrl,
        }),
      };

    case 'email_change':
    case 'email_change_new':
      return {
        subject: 'Konfime nouvo imèl ou',
        html: brandedTemplate({
          firstName,
          heading: 'Konfime chanjman imèl ou',
          body: [
            'Klike sou bouton anba a pou konfime nouvo imèl ou pou kont MedikaPlant.',
            'Si se pa ou ki te mande sa, inyore mesaj sa.',
          ],
          linkLabel: 'Konfime nouvo imèl',
          linkUrl: verifyUrl,
        }),
      };

    case 'reauthentication':
      return {
        subject: 'Kòd verifikasyon ou',
        html: brandedTemplate({
          firstName,
          heading: 'Verifikasyon idantite',
          body: [
            `Antre kòd sa pou konplete operasyon w an: ${email_data.token}`,
            "Si se pa ou ki te mande sa, chanje modpas ou kounye a.",
          ],
        }),
      };

    default:
      return {
        subject: 'MedikaPlant — yon mesaj otomatik',
        html: brandedTemplate({
          firstName,
          heading: 'Yon mesaj otomatik',
          body: ['Klike sou bouton an pou kontinye.'],
          linkLabel: 'Kontinye',
          linkUrl: verifyUrl,
        }),
      };
  }
}

/** Build the verification URL Supabase wants the user to click. */
function buildVerifyUrl(payload: SupabaseEmailHookPayload): string {
  const { email_data } = payload;
  // We let Supabase handle the OTP verification itself by hitting their
  // /verify endpoint — that endpoint then bounces the user to our
  // redirect_to with the recovery token in the URL hash. Doing it this way
  // means the link expires/single-use semantics are managed by Supabase,
  // not by us.
  const base = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://kmzmtuthwssyuoklmydy.supabase.co'
  ).replace(/\/$/, '');
  const url = new URL(`${base}/auth/v1/verify`);
  url.searchParams.set('token', email_data.token_hash);
  url.searchParams.set('type', email_data.email_action_type);
  url.searchParams.set('redirect_to', email_data.redirect_to);
  return url.toString();
}

/** Branded HTML shell. Inline styles only so mail clients render right. */
function brandedTemplate({
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
  const escape = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  const paragraphs = body
    .map(
      (p) =>
        `<p style="margin:0 0 16px;color:#3f3a52;font-size:15px;line-height:1.6;">${escape(p)}</p>`
    )
    .join('');
  const button =
    linkUrl && linkLabel
      ? `<div style="margin:24px 0 8px;">
           <a href="${linkUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:14px 28px;border-radius:9999px;">${escape(linkLabel)}</a>
         </div>
         <p style="margin:8px 0 0;color:#8a8699;font-size:11px;word-break:break-all;">
           Si bouton an pa mache, kopye lyen sa nan navigatè ou:<br/>
           <a href="${linkUrl}" style="color:#16a34a;text-decoration:underline;">${linkUrl}</a>
         </p>`
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
                <h1 style="margin:0 0 16px;color:#050040;font-size:22px;line-height:1.3;">${escape(heading)}</h1>
                <p style="margin:0 0 16px;color:#3f3a52;font-size:15px;line-height:1.6;">Bonjou ${escape(firstName)},</p>
                ${paragraphs}
                ${button}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;border-top:1px solid #e7e5dd;">
                <p style="margin:0;color:#8a8699;font-size:12px;line-height:1.5;">
                  Ou resevwa imèl sa paske ou gen yon kont MedikaPlant. Pou
                  nenpòt kesyon, reponn imèl sa epi yon admin ap kontakte ou.
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

    // eslint-disable-next-line no-console
    console.log(
      '[send-email] sending',
      payload.email_data.email_action_type,
      'to',
      payload.user.email
    );

    const { subject, html } = renderEmail(payload);

    const result = await sendEmail({
      to: payload.user.email,
      subject,
      html,
      replyTo:
        process.env.CONTACT_REPLY_TO || process.env.EMAIL_FROM || undefined,
    });

    if (!result.ok) {
      // Loud server log so operators can see the actual Resend message in
      // the Hostinger/Vercel runtime logs. Surface the message in the
      // response body too — Supabase shows only the status code in the
      // UI but the body still lands in their hook delivery log.
      console.error('[send-email] Resend failed:', result.error);
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
