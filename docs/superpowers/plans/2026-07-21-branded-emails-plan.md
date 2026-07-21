# Implementation plan — unified, localized branded emails

Spec: `docs/superpowers/specs/2026-07-21-branded-emails-design.md`

Ordered, each step ends compiling. Steps 1–2 are pure additions (no behaviour
change until wired). Build + typecheck after the wiring steps.

## Step 1 — `lib/email/copy.ts` (localized dictionary)
- `export type Lang = 'ht' | 'fr' | 'en';` + `normalizeLang(x): Lang` (fallback `ht`).
- `authCopy[type][lang] = { subject, heading, paragraphs[], ctaLabel? }` for
  the 7 auth action types (signup, magiclink, invite, recovery, email_change,
  email_change_new, reauthentication). Reauth includes a codeIntro line.
- `notifyCopy[kind](lang, vars) => { subject, heading, paragraphs[], ctaLabel, linkPath }`
  for `daily_advice`, `weekly_summary`, `badge_unlock`.
- `footerCopy[variant][lang]` for `transactional | notification | advice`
  (brand line, "you got this because…", manage-notifications link label,
  health disclaimer).
- Author all three languages; `ht` mirrors today's live copy so nothing
  regresses.

## Step 2 — `lib/email/template.ts` (shared renderer)
- `renderBrandedEmail(opts)` per the spec signature. Inline styles, table
  shell, `#f6f5f0` bg, white card, 5-colour hairline, logo `${SITE_URL}/logo-hois.png`,
  accent→hex map (`green #65881A`, `sienna #D24C28`, `tangerine #E78E17`),
  pill button, optional code box, footer via `footerCopy`, hidden preheader.
- Escapes `paragraphs`; injects `bodyHtml` verbatim.
- Export `ACCENT_HEX` and types for callers.

## Step 3 — wire auth hook (`app/api/auth/send-email/route.ts`)
- Add `resolveLang(userId, userMeta)`: `createServiceClient()` →
  `user_preferences.language` → `user_metadata.language` → `ht`. Wrap in
  try/catch → `ht` on any error (never break sending).
- Replace `renderEmail()` internals: pick `authCopy[type][lang]` + accent +
  footer='transactional', call `renderBrandedEmail`. Keep `resolveTargets` /
  `buildVerifyUrl` (the new-address token fix) intact. Reauth → codeBox +
  cta to `${SITE_URL}/dashboard`.
- Delete `brandedTemplate()`.

## Step 4 — wire `lib/email/notify.ts`
- Read `language` from the `user_preferences` fetch it already does.
- Change signature to `{ kind, vars, requirePref }`; resolve
  `notifyCopy[kind](lang, vars)`; footer = `advice` for daily_advice else
  `notification`; call `renderBrandedEmail`.
- Delete `renderTemplate()`.

## Step 5 — update the 3 notification callers
- `cron/daily-advice`: pass `kind:'daily_advice'`, vars `{ plantName?, adviceExcerpt }`.
- `cron/weekly-summary`: pass `kind:'weekly_summary'`, vars for the stat lines.
- `webhooks/badge-unlocked`: pass `kind:'badge_unlock'`, vars `{ badgeName, badgeSlug }`.

## Step 6 — render harness + verify
- `scripts/preview-emails.mjs`: render every type × `ht|fr|en` to
  `scratch/email-preview/*.html` for eyeballing (dev-only, not shipped).
- Spot-check a few in the browser; `npx tsc --noEmit`; `npm run build`.

## Step 7 — ship
- Commit; push to `main`.

## Acceptance (from spec)
Old `brandedTemplate` + `renderTemplate` gone; both sites use the shared
renderer; each type renders in ht/fr/en with correct accent/footer/logo;
tsc + build pass; auth-hook token routing preserved.
