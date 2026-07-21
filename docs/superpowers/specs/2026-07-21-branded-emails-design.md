# Unified, localized branded emails — design

**Date:** 2026-07-21
**Status:** Approved (design), pending implementation plan

## Goal

Replace the two drifted email templates with a single branded, localized
email system for every transactional and notification email the platform
sends. Emails render in the **member's own language** (Kreyòl / Français /
English), carry the **Hoïs logo** and the **5-colour palette**, and stay
visually consistent because they share one template.

## Current state (the problem)

Two independent templates that have already drifted:

- `app/api/auth/send-email/route.ts` → `brandedTemplate()` — auth emails,
  uses the new forest-green brand (`#587d17`). Kreyòl only.
- `lib/email/notify.ts` → `renderTemplate()` — notification emails, still
  uses the **old emerald** (`#16a34a` / `#166534`). Kreyòl only, and the
  copy is passed in pre-built by each caller.

Neither adapts to language, neither uses the approved palette, and any
future change must be made twice.

## Emails in scope (~10)

Auth (fired by Supabase via the send-email hook):

| Type | Accent | Footer | CTA / body |
|------|--------|--------|------------|
| `signup` | Green | transactional | button "confirm email" |
| `magiclink` | Green | transactional | button "log in" |
| `invite` | Green | transactional | button "accept invite" |
| `recovery` | Sienna | transactional | button "choose new password" |
| `email_change` / `email_change_new` | Sienna | transactional | button "confirm new email" |
| `reauthentication` | Sienna | transactional | **code box + button** "back to MedikaPlant" |

Notifications (fired in-app via `emailNotifyMember`):

| Type | Accent | Footer | CTA / body |
|------|--------|--------|------------|
| `daily_advice` | Tangerine | advice (manage + disclaimer) | admin-authored advice + button "see full advice" |
| `weekly_summary` | Tangerine | notification (manage) | localized stat lines + button "see dashboard" |
| `badge_unlock` | Tangerine | notification (manage) | localized congrats + button "see badge" |

## Palette & accent mapping

Approved palette: Citrus Green `#C5CF5E`, Sienna Red `#D24C28`, Tangerine
`#E78E17`, Light Green `#DFE1B5`, Green `#65881A`.

- **Green `#65881A`** — primary/positive actions: signup, magic link, invite.
- **Sienna `#D24C28`** — security: password reset, email change, reauth code.
- **Tangerine `#E78E17`** — notifications + the Hoïs logo colour.
- **Citrus `#C5CF5E`** / **Light green `#DFE1B5`** — the 5-colour hairline at
  the top of every email, hairlines, and soft chips.

## Visual template (approved "style A")

- Outer background `#f6f5f0`; centred white card, `max-width: 520px`,
  `border-radius: 16px`, `1px` warm border.
- **Top hairline** `4px` gradient of all five palette colours (ties the
  brand together, same on every email regardless of accent).
- **Hoïs logo** `<img>` at `~34px` height, loaded from
  `${SITE_URL}/logo-hois.png` (already served at
  `https://hoismedikaplant.com/logo-hois.png`). `alt="Hoïs"` so a blocked
  image still reads.
- Dark-green heading (`#1c2a0a`), greeting "Bonjou {firstName}," then body
  paragraphs, then the accent-coloured pill button.
- Reauth: a large centred **code box** (letter-spaced monospace) above a
  button back to `${SITE_URL}/dashboard` (matching the existing
  reauthentication redirect target), so the member can return and paste the
  code.
- Everything inline-styled (no `<style>` block, no external CSS) for email
  client compatibility. No base64 images.

## Architecture — one template, one copy dictionary

Two new modules, both imported by the two send sites:

### `lib/email/template.ts`
Pure rendering. One exported function:

```ts
type Accent = 'green' | 'sienna' | 'tangerine';
type FooterVariant = 'transactional' | 'notification' | 'advice';

renderBrandedEmail(opts: {
  lang: Lang;                 // 'ht' | 'fr' | 'en'
  accent: Accent;
  firstName: string;
  heading: string;
  paragraphs: string[];       // localized plain text — the template HTML-escapes each
  bodyHtml?: string;          // pre-sanitized HTML passthrough (daily-advice excerpt only)
  cta?: { label: string; url: string };
  codeBox?: string;           // reauth OTP
  footer: FooterVariant;
}): string
```

The template **escapes** every string in `paragraphs`. The single exception
is `bodyHtml` — used only for the admin-authored daily-advice excerpt, which
is already sanitized upstream (`sanitizeGuideHtml`) — rendered as-is.

The footer text (brand line, "you received this because…", the
**"manage notifications"** link → `${SITE_URL}/dashboard/settings`, and the
**health disclaimer**) is chosen by `footer` + `lang` from the copy module.
`renderBrandedEmail` owns no business logic and no email-type knowledge.

### `lib/email/copy.ts`
All localized strings, one source of truth. Shape:

```ts
type Lang = 'ht' | 'fr' | 'en';

// Auth: fully fixed chrome per type.
authCopy: Record<AuthType, Record<Lang, {
  subject: string; heading: string; paragraphs: string[]; ctaLabel?: string;
}>>

// Notifications: fixed chrome + interpolation of caller vars.
notifyCopy: Record<NotifyKind, (lang: Lang, vars) => {
  subject: string; heading: string; paragraphs: string[]; ctaLabel: string;
}>

// Shared footer chrome per variant + lang.
footerCopy: Record<FooterVariant, Record<Lang, {...}>>
```

`ht` is the fallback for any missing string.

## Language resolution

Source of truth: **`user_preferences.language`** (`'ht' | 'fr' | 'en'`,
default `ht`), already editable by the member in settings.

- **Notification emails** — `emailNotifyMember` already reads
  `user_preferences`; add `language` to what it reads and pass it down. No
  extra query.
- **Auth emails** — the hook has only `user.id` + `user.user_metadata`. It
  looks up `user_preferences.language` for that id with
  `createServiceClient()` (server-only, already used elsewhere). Order of
  precedence: `user_preferences.language` → `user.user_metadata.language`
  (if present) → `'ht'`.
- At signup there may be **no** `user_preferences` row yet (the
  `handle_new_user` trigger creates a profile + subscription, not
  preferences), so the very first confirmation defaults to `ht`. Optional
  enhancement (not required): the signup form writes the current UI language
  into `user_metadata.language` so even the first email matches.

## Notification call-site change

Today each caller passes fully-built Kreyòl `subject`/`heading`/`body`. To
localize, callers instead pass a **kind + typed vars**, and `notify.ts`
builds the localized copy:

```ts
emailNotifyMember(supabase, userId, {
  kind: 'badge_unlock',
  vars: { badgeName, badgeSlug },
  requirePref: 'badge_unlock_email',
});
```

- `daily_advice` vars: `{ plantName?: string; adviceExcerpt: string; }` — the
  admin-authored advice text is **passed through untranslated** (it exists in
  one language); only the surrounding chrome, heading, and button localize.
- `weekly_summary` vars: the stat numbers; body lines localized around them.
- `badge_unlock` vars: `{ badgeName, badgeSlug }`.

`emailNotifyMember` keeps its existing guarantees: respects the
`email_notifications` master switch and the per-category `requirePref`,
never throws, no-ops when RESEND is unconfigured or the member has no email.

## Email-client compatibility

- Inline styles only; table-based shell; system font stack.
- Hosted logo via absolute HTTPS URL + `alt`; never base64.
- Buttons are styled `<a>` pills (bulletproof enough for our clients; VML
  not required for the audience).
- Preheader text (hidden) per email for inbox preview — localized.

## Non-goals

- No third-party email framework (react-email/MJML) — plain inline HTML,
  zero new dependencies.
- The daily-advice **content** is not machine-translated; only chrome is
  localized.
- No new email types; no redesign of the settings UI.
- No change to when/why emails fire — only how they're rendered and localized.

## Acceptance

- One template + one copy module; `brandedTemplate()` and the old
  `renderTemplate()` are deleted, both send sites call the shared renderer.
- Each email type renders correctly in `ht`, `fr`, `en` with the right
  accent, footer variant, logo, and hairline (spot-check via a local
  render harness that writes sample HTML to disk).
- `tsc --noEmit` and `next build` pass.
- Auth-hook routing from the previous fix (new-address token) is preserved.
- Manual: trigger one auth email and one notification email in a non-`ht`
  language and confirm language + branding.
```
