// ─────────────────────────────────────────────────────────────────────────
// The one branded email template. Every transactional and notification email
// renders through renderBrandedEmail(). Inline styles + table shell only, for
// email-client compatibility. Copy comes from lib/email/copy.ts.
//
// Approved design ("style A"): white card on a warm background, a 4px hairline
// of the five brand colours at the very top, the Hoïs logo, a dark-green
// heading, and an accent-coloured pill button whose colour depends on the
// email type.
// ─────────────────────────────────────────────────────────────────────────

import {
  BRAND_LINE,
  CHROME,
  FOOTER,
  type Accent,
  type FooterVariant,
  type Lang,
} from './copy';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://hoismedikaplant.com'
).replace(/\/$/, '');

const LOGO_URL = `${SITE_URL}/logo-hois.png`;

export const ACCENT_HEX: Record<Accent, string> = {
  green: '#65881A',
  sienna: '#D24C28',
  tangerine: '#E78E17',
};

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export type BrandedEmailOpts = {
  lang: Lang;
  accent: Accent;
  firstName: string;
  heading: string;
  paragraphs: string[];
  cta?: { label: string; url: string };
  /** Reauthentication OTP shown in a large code box above the button. */
  codeBox?: string;
  /** Small fine-print line under the CTA (expiry / "not you"). */
  note?: string;
  footer: FooterVariant;
  /** Hidden inbox-preview text; defaults to the first paragraph. */
  preheader?: string;
};

export function renderBrandedEmail(opts: BrandedEmailOpts): string {
  const { lang, accent, firstName, heading, paragraphs, cta, codeBox, note, footer } = opts;
  const accentHex = ACCENT_HEX[accent];
  const greeting = `${CHROME[lang].greetingWord} ${escape(firstName)},`;
  const preheader = escape(opts.preheader || paragraphs[0] || CHROME[lang].preheader);

  const bodyParagraphs = paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 13px;color:#3f3a52;font-size:14px;line-height:1.65;">${escape(
          p
        )}</p>`
    )
    .join('');

  const codeBlock = codeBox
    ? `<div style="margin:20px 0;padding:16px;border:1px solid #f0d9d1;background:#fbf1ee;border-radius:12px;text-align:center;">
         <span style="font-family:'Courier New',Courier,monospace;font-size:28px;font-weight:700;letter-spacing:.35em;color:#1c2a0a;">${escape(
           codeBox
         )}</span>
       </div>`
    : '';

  const button = cta
    ? `<div style="margin:24px 0 8px;">
         <a href="${cta.url}" style="display:inline-block;background:${accentHex};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:13px 28px;border-radius:9999px;">${escape(
           cta.label
         )}</a>
       </div>
       <p style="margin:10px 0 0;color:#a8a4b4;font-size:11px;word-break:break-all;">
         ${linkFallback(lang)}<br/>
         <a href="${cta.url}" style="color:${accentHex};text-decoration:underline;">${cta.url}</a>
       </p>`
    : '';

  const noteBlock = note
    ? `<p style="margin:16px 0 0;color:#a8a4b4;font-size:12px;line-height:1.5;">${escape(
        note
      )}</p>`
    : '';

  return `<!doctype html>
<html lang="${lang}">
  <body style="margin:0;padding:0;background:#f6f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;mso-hide:all;">${preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f5f0;padding:24px 0;">
      <tr>
        <td align="center" style="padding:0 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #ece9e0;">
            <tr><td style="height:4px;background:linear-gradient(90deg,#65881A,#C5CF5E,#DFE1B5,#E78E17,#D24C28);font-size:0;line-height:0;">&nbsp;</td></tr>
            <tr>
              <td style="padding:26px 30px 0;">
                <img src="${LOGO_URL}" alt="Hoïs" height="34" style="height:34px;display:block;border:0;outline:none;text-decoration:none;">
              </td>
            </tr>
            <tr>
              <td style="padding:18px 30px 30px;">
                <h1 style="margin:0 0 16px;color:#1c2a0a;font-size:22px;line-height:1.25;">${escape(
                  heading
                )}</h1>
                <p style="margin:0 0 13px;color:#3f3a52;font-size:14px;line-height:1.65;">${greeting}</p>
                ${bodyParagraphs}
                ${codeBlock}
                ${button}
                ${noteBlock}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 30px;border-top:1px solid #f0eee7;">
                ${renderFooter(footer, lang)}
              </td>
            </tr>
          </table>
          <p style="max-width:520px;margin:14px auto 0;color:#b5b1c0;font-size:11px;text-align:center;">${escape(
            BRAND_LINE
          )}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderFooter(variant: FooterVariant, lang: Lang): string {
  const f = FOOTER[variant][lang];
  const rows: string[] = [
    `<p style="margin:0;color:#a8a4b4;font-size:11px;line-height:1.5;">${escape(
      BRAND_LINE
    )}<br/>${escape(f.reason)}</p>`,
  ];
  if (f.manageLabel) {
    rows.push(
      `<p style="margin:8px 0 0;font-size:11px;"><a href="${SITE_URL}/dashboard/settings" style="color:#65881A;text-decoration:underline;">${escape(
        f.manageLabel
      )}</a></p>`
    );
  }
  if (f.disclaimer) {
    rows.push(
      `<p style="margin:10px 0 0;color:#b5b1c0;font-size:10px;line-height:1.5;font-style:italic;">${escape(
        f.disclaimer
      )}</p>`
    );
  }
  return rows.join('');
}

function linkFallback(lang: Lang): string {
  switch (lang) {
    case 'fr':
      return 'Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :';
    case 'en':
      return "If the button doesn't work, copy this link into your browser:";
    default:
      return 'Si bouton an pa mache, kopye lyen sa nan navigatè ou:';
  }
}
