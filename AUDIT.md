# MedikaPlant / Hoïs Inivèsite — Full SaaS Audit

**Date:** 2026-05-23
**Stack:** Next.js 14 (App Router) + Supabase (Postgres + Auth + Realtime + Storage + Edge Functions) on Vercel
**Project:** kmzmtuthwssyuoklmydy (`medikaplant`)
**Domain:** hois-medikaplant.vercel.app

---

## 1 · Executive summary

The product is a Kreyòl-first naturopathic SaaS targeted at Haiti, with paid plans (Bazilik $350 / Sitwonèl $600 / Melis $800), member dashboards, an admin moderation panel, and community features (forum + support chat). The build is functional end-to-end with **clean separation between member and admin shells**, realtime where it matters, and **strong RLS coverage** on every user-owned table.

### Snapshot

| Metric | Value |
| --- | --- |
| Public tables | 31 |
| Migrations applied | 34 |
| Edge functions active | 2 (checkout, delete-user) — 11 deprecated stubs |
| Member profiles | 4 |
| Active subscriptions | 4 (matches profiles) |
| Active revenue | $1,650 |
| Notifications produced | 23 |
| Resources published | 13 |
| Guides published | 9 |
| Forum categories / topics / replies | 6 / 1 / 0 |
| Support threads / messages | 5 / 29 |
| Programs (catalog) / active enrollments | 6 / 4 |
| App routes built | 36 |

### Overall posture

- **Functionality**: 9/10 — all wireframe pages built, end-to-end checkout works, realtime is wired.
- **Security**: 7/10 — RLS is comprehensive but 123 advisor warnings exist (mostly GraphQL exposure surface).
- **UX/UI**: 8/10 — mobile drawer works on both shells, Kreyòl throughout, responsive.
- **Operational hygiene**: 6/10 — manual Supabase dashboard steps required, several unreachable code paths, no automated test suite.

---

## 2 · Database

### 2.1 Schema map

```
Identity        ── profiles, user_preferences, user_medical_info
Auth/billing    ── subscriptions  (1:1 with active profiles, audit prefix)
Content         ── guides, guide_categories, resources, daily_advice, products
Programs        ── programs, program_phases, program_tasks, user_programs,
                   user_task_completions
Health          ── health_logs, treatment_recommendations
Community       ── forum_categories, forum_topics, forum_replies
Support         ── support_threads, support_messages, support_faqs,
                   support_contacts
Notifications   ── notifications, notification_reads
Gamification    ── badges, user_badges
Misc            ── consultations, admin_impersonation_logs, resource_progress
```

### 2.2 Invariants enforced

- **Every profile has exactly one active subscription** — enforced by `handle_new_user` (default basic on signup) + `setUserPlan` (cancels prior + inserts new for any target) + `checkout` edge function. Migration 034 backfilled.
- **`profiles.plan` mirrors highest active subscription** — `trg_sync_profile_plan` on `subscriptions` INSERT/UPDATE.
- **`forum_topics.reply_count` + `last_reply_at` stay accurate** — `trg_update_topic_on_reply` + `trg_decrement_topic_on_reply_delete`.
- **`forum_topics.slug` is URL-safe + unique** — `generate_topic_slug` BEFORE INSERT using `extensions.unaccent`.

### 2.3 Triggers that drive notifications

| Trigger | Fires on | Effect |
| --- | --- | --- |
| `trg_notify_user_on_agent_reply` | `support_messages` INSERT (agent/system) | Personal notif to thread owner |
| `trg_notify_on_guide_publish` | `guides` published flip false→true | Broadcast to all members |
| `trg_notify_on_resource_publish` | `resources` published flip false→true | Broadcast to all members |
| `trg_notify_on_treatment_created` | `treatment_recommendations` INSERT | Personal notif to recipient |
| `trg_notify_on_forum_reply` | `forum_replies` INSERT (not self-reply) | Personal notif to topic author |

### 2.4 RLS posture

- Every public table that holds personal data has **`ENABLE ROW LEVEL SECURITY`** + at least one SELECT/INSERT/UPDATE/DELETE policy.
- Reads are **per-user OR public-for-authenticated** consistently.
- Writes are **own-row OR admin-via-`is_admin(auth.uid())`**.
- Admins read everything via the dedicated `Admins manage *` policies on every table.

### 2.5 Storage buckets

| Bucket | Public | Mime restrictions | Size cap |
| --- | --- | --- | --- |
| `resources` | **public** | none (any file) | 1 GB |
| `plant-images` | public | jpeg/png/webp/gif | 5 MB |
| `public-assets` | public | jpeg/png/webp/svg | 10 MB |

Storage policies on `objects` already gate `resources` reads by `plan_required` via the matching row in `public.resources` — useful if the bucket ever flips back to private.

---

## 3 · Routes

### 3.1 Public (no auth)

- `/` — landing page (hero + features + about + testimonials + pricing + CTA + footer)
- `/checkout?plan=…` — inline-auth purchase page (Haiti-only signup gate)
- `/auth/login` — login with brand-50 plan-CTA card at bottom
- `/auth/forgot-password` + `/auth/reset-password` — recovery
- `/auth/signup` — **server-redirect to `/#pri` or `/checkout?plan=X`** (form unreachable on purpose)

### 3.2 Member shell (`/dashboard/*`)

Protected by middleware: unauthed → `/auth/login?redirect=…`; signed-in admins → `/admin` (sticky).

```
/dashboard                        — Hero + stats + checklist + badges + downloads + upsell
/dashboard/programs               — Active enrollment timeline + phases + catalog + completed
/dashboard/resources              — Library with type filter + URL-state search
/dashboard/health                 — Condition-aware metrics + chart + log form + treatments
/dashboard/guides                 — Index + categories
/dashboard/guides/[slug]          — Detail with view-count bump + save toggle
/dashboard/forum                  — Topic list, category pills, stats
/dashboard/forum/[slug]           — Topic detail + realtime replies + composer
/dashboard/forum/new              — Create topic (suspended block, category picker)
/dashboard/support                — Realtime chat with Mèt Joseph persona
/dashboard/settings               — Plan, profile, medical, preferences, GDPR export, danger zone
/dashboard/settings/receipts/[id] — Printable receipt
```

### 3.3 Admin shell (`/admin/*`)

Protected by middleware + layout: unauthed → `/admin/login`; signed-in non-admin → `/admin/login?error=not_admin`.

```
/admin                            — Overview
/admin/login                      — Branded dark login w/ no-index + post-auth role recheck
/admin/users                      — Member roster (stats + filters)
/admin/users/[userId]             — Full editor (profile, medical, prefs, plan, role, suspend, delete)
/admin/health                     — Patient roster
/admin/health/[userId]            — Clinical view + 3 charts + prescription form + history
/admin/support                    — Realtime inbox (thread list + selected conversation)
/admin/forum                      — Topic roster + categories CRUD + per-row actions
/admin/forum/[slug]               — Topic detail + reply moderation + admin reply composer
/admin/resources                  — Library list with filters
/admin/resources/new + /[id]      — Form with browser-direct Storage upload
/admin/guides                     — Guide list
/admin/guides/new + /[id]         — Editor with PlantBig SVG variants
/admin/subscriptions              — Roster + plan breakdown + filters + per-row actions
/admin/notifications              — Broadcast composer + history with filters
```

### 3.4 Middleware behavior

| Caller | Path | Effect |
| --- | --- | --- |
| Unauthed | `/admin/*` (except `/admin/login`) | → `/admin/login` |
| Unauthed | `/dashboard/*` | → `/auth/login?redirect=…` |
| Authed member | `/admin/*` | → `/admin/login?error=not_admin` |
| Authed admin | `/dashboard/*` | → `/admin` (sticky) |
| Authed admin | `/admin/login` | → `/admin` |
| Authed (any) | `/auth/login` or `/auth/signup` | → role-appropriate dashboard |

Plus **bfcache prevention** on admin responses via `Cache-Control: no-store`.

---

## 4 · Authentication & access control

### 4.1 Sign-in paths

1. **Members** → `/auth/login` → `supabase.auth.signInWithPassword` → `/dashboard`
2. **Admins** → `/admin/login` → `signInAsAdmin` server action that **re-checks `profile.role === 'admin'` after auth** and signs out non-admins
3. **Checkout-inline** → `/checkout?plan=X` → either signs in OR signs up Haiti-only inside the same submit

### 4.2 Account creation

Direct signup at `/auth/signup` is intentionally **disabled** — the route redirects to `/#pri` or `/checkout?plan=X`. Account creation requires a plan choice up front.

Country gate: `processCheckout` rejects `country !== 'HT'` server-side; the dropdown only offers `Ayiti` or a "pa aksepte" placeholder. After signup, the profile is stamped `country='HT'` redundantly.

### 4.3 JWT enrichment

Migration 029 added `public.custom_access_token_hook(event jsonb)` that injects `app_role` + `app_plan` claims into every issued access token. **Currently dormant** — the dashboard hook must be enabled by hand in Supabase Auth > Hooks (documented in `SUPABASE_SETUP.md`).

### 4.4 Password recovery

`resetPasswordForEmail` → `/auth/reset-password`, with `redirectTo` anchored to `lib/site-url.ts → siteUrl(...)` so the email link points at the production domain regardless of where it was sent from.

### 4.5 Account deletion

`adminDeleteUser` on profiles + `delete-user` edge function for full auth wipeout (still present, uses service role).

---

## 5 · Monetization

### 5.1 Plan catalog (`app/checkout/plans.ts`)

| Plan | Price | Duration | Features |
| --- | --- | --- | --- |
| Bazilik (basic) | $350 | 12 mo | Resources, intro programs |
| Sitwonèl (premium) | $600 | 24 mo | All Bazilik + advanced |
| Melis (vip) | $800 | 36 mo | All Premium + VIP perks |

### 5.2 Checkout flow

1. Pricing card click → `/checkout?plan=X` (anon allowed)
2. Inline form: identity tab toggle (login OR signup with country/name fields) + payment fields
3. Server action `processCheckout` validates card stub + auth (sign-in or sign-up with HT gate) + invokes `checkout` edge function
4. Edge function (service-role) cancels existing active sub → inserts new → returns canonical row
5. `trg_sync_profile_plan` lifts `profiles.plan` to new value
6. Auto-notification dropped: "Plan ou aktif!"
7. Client receives `redirectTo` → `window.location.href` → `/dashboard?welcome=…`

### 5.3 Audit trail

`subscriptions.payment_reference` prefix encodes origin:
- `mock_…` — checkout flow (current demo payment)
- `signup_default_…` — auto-created on direct signup
- `admin_grant_…` — admin promoted via `setUserPlan`
- `admin_grant_backfill[2]_…` — historical backfill
- `*_refunded` — `markSubscriptionRefunded` flipped to cancelled

---

## 6 · Realtime systems

### 6.1 Channels currently active

| Channel | Source | Subscribers |
| --- | --- | --- |
| `support-thread-<id>` | `support_messages` INSERT filtered by thread | Member chat view |
| `admin-support-messages` | `support_messages` + `support_threads` INSERT/UPDATE (no filter) | Admin inbox |
| `notifications-bell-<userId>` | `notifications` INSERT + `notification_reads` INSERT filtered by user | Member bell dropdown |
| `forum-topic-<id>` | `forum_replies` INSERT + DELETE filtered by topic | Member topic detail |

All channels use Supabase Realtime over WebSocket. Tables are explicitly added to `supabase_realtime` publication (verified in migrations 008 + 028 + 032).

### 6.2 Notification fan-out

Both manual (admin broadcast) and triggered (5 DB triggers above). Visible to members through the live bell (filtered client-side by `target`/`target_plan`/`target_user_id` to mirror RLS). Marked read via `notification_reads` upsert.

---

## 7 · Content management

### 7.1 Resources

- 13 published Kreyòl resources seeded (PDFs, videos, audio)
- Direct in-browser upload to Storage (no Next.js body size limit)
- Auto-detected type / size / duration
- Plan-gated reads via storage RLS + UI lock chips
- Admin CRUD with publish toggle (triggers broadcast notification)

### 7.2 Guides

- 9 published guides across 7 categories
- PlantBig SVG illustrations (6 variants)
- View-count bump RPC, save toggle, category chips
- Admin CRUD with rich text body

### 7.3 Programs

- 6 active programs in catalog (Hois Plan, Mantel, Elit VIP + 3 wireframe additions)
- Per-program phases table seeded
- User enrollment with pause/resume support (offset arithmetic preserves day count)
- Daily checklist via `program_tasks` + `user_task_completions`

### 7.4 Forum

- 6 Kreyòl categories (Eksperyans, Plant, Resèt & Tizan, Pwogram, Sante mantal, Lòt)
- Auto-slug + counter triggers
- Notify-on-reply
- Realtime replies on the detail page
- Suspended members blocked at RLS level
- Admin total moderation: pin/lock/delete topics, delete replies, category CRUD, admin reply composer (works on locked topics)

---

## 8 · Health tracking & clinical

- `health_logs` for member self-tracking (blood sugar / weight / blood pressure / heart rate / notes)
- `treatment_recommendations` with 5 kinds (medication/herbal/lifestyle/monitoring/referral)
- Admin clinical view with 3 SVG charts (last 90 days) + condition-aware metric default
- Member health page condition-aware: shows the right primary metric for the user's condition strip
- CSV export from member side

---

## 9 · Edge functions

| Slug | Status | Verify JWT |
| --- | --- | --- |
| `checkout` | **Active** — atomic subscription creation | yes |
| `delete-user` | **Active** — full auth wipeout via service role | yes |
| `cart` | Stub (410 Gone) | no |
| `stripe-webhook` | Stub | no |
| `ai-chat` | Stub | no |
| `scan-plant` | Stub | no |
| `notifications` | Stub | no |
| `scraper` | Stub | no |
| `ingest` | Stub | no |
| `auto-update` | Stub | no |
| `analytics` | Stub | no |
| `recommend` | Stub | no |
| `product-enrichment` | Stub | no |

The 11 stubs were neutralized in-place (each returns `410 Gone`) since the MCP toolset doesn't expose a delete. They're inert but still occupy slots.

---

## 10 · Security findings (Supabase advisor)

123 findings, **all WARN-level — 0 ERROR**.

### Concerning

1. **GraphQL surface exposes every public table to `anon`** (31 tables). The lint flags both `anon` and `authenticated` access. RLS still protects actual rows, but schema discoverability of `user_medical_info`, `health_logs`, `treatment_recommendations`, `consultations`, `subscriptions`, `support_messages` is unwanted. Mitigation: revoke `USAGE ON SCHEMA public` from `anon` for the GraphQL endpoint OR scope the `pg_graphql` resolver to only emit safe tables.

2. **27 SECURITY DEFINER functions are EXECUTE-able by `anon`** — same set duplicated across two lints. Real risk depends on each function's body, but `admin_send_support_reply`, `notify_all_users`, `notify_single_user`, `is_admin` should not be reachable by unauthenticated callers even if they have internal guards. Mitigation: `REVOKE EXECUTE … FROM anon, public; GRANT … TO authenticated` per function.

3. **HaveIBeenPwned password check disabled** at the Supabase Auth project level. Weak/breached passwords accepted today.

### Cosmetic

4. **4 functions without `SET search_path`**: `set_updated_at`, `plan_rank`, `user_level_name`, `handle_guide_publish`. Best-practice hardening, low real risk.

5. **2 public buckets allow listing**: `plant-images` and `public-assets`. Intentional but the lint will keep flagging them.

---

## 11 · Operational gaps

### 11.1 Required manual configuration (documented in `SUPABASE_SETUP.md`)

- Supabase Auth → URL Configuration: set Site URL = `https://hois-medikaplant.vercel.app` and the redirect allow-list.
- Supabase Auth → Hooks → Custom Access Token Hook: enable and point at `public.custom_access_token_hook` (function exists but is dormant).

### 11.2 Code paths now unreachable but still in tree

- `app/auth/signup/signup-form.tsx` — the page redirects so the form is dead code. Prune in a follow-up.
- 11 deprecated edge function source files. They run when called (returning 410) but aren't used by any client.

### 11.3 No automated tests

There's no test suite (no Vitest/Playwright). Every feature is verified manually. Given the level of branching (admin vs member, plan gates, RLS), this is the biggest operational risk.

### 11.4 Payments are mock

`processCheckout` validates card details with regex but accepts any card-shaped string. No actual processor (Stripe/Moncash) integration. The edge function inserts the subscription regardless.

### 11.5 No moderator role

Authorization is binary: `role ∈ {user, admin}`. No fine-grained capabilities (e.g. a forum-moderator who can pin/lock but not delete users). Acceptable for the team size today; will pinch when growing.

### 11.6 Email deliverability

Supabase's built-in SMTP is used. No bounce monitoring, no domain authentication, no custom templates. For a Haiti-targeted product, deliverability into local providers is unverified.

### 11.7 Backfill leftovers

Two `admin_grant_backfill_…` reference families exist (one from migration 031, one from migration 034). Cosmetic — the audit reads fine, just two distinct prefixes for the same intent.

---

## 12 · Prioritized recommendations

### P0 — Do before next member signs up

1. **Enable the access-token hook in Supabase Dashboard** (it's already coded). Otherwise the JWT lacks `app_role` and middleware does an extra round-trip per request.
2. **Set the Site URL + redirect allow-list in Supabase Auth** so password-reset and signup-confirmation emails point at the prod domain.
3. **Wire a real payment processor** before launching paid signups. Without it, anyone clicking "Peye" gets a subscription for free.

### P1 — This week

4. **Revoke `anon` GRANTs on SECURITY DEFINER functions** that shouldn't be callable without auth (see Section 10.2). One migration with `REVOKE EXECUTE … FROM anon` per function.
5. **Restrict GraphQL exposure** of sensitive tables (`user_medical_info`, `health_logs`, `treatment_recommendations`, `consultations`). Either disable pg_graphql for those tables or revoke schema usage from anon.
6. **Enable HaveIBeenPwned in Supabase Auth password policy.**
7. **Add `SET search_path` to the 4 flagged helper functions.**

### P2 — This month

8. **Smoke-test suite** with Playwright covering: signup→checkout→dashboard, login, forgot-password, admin sign-in + non-admin rejection, broadcast notification round-trip, forum topic creation, support chat realtime.
9. **Prune dead code**: delete `app/auth/signup/signup-form.tsx`; consider hard-deleting the 11 deprecated edge function slots via the Supabase Dashboard.
10. **Email templates**: customize Supabase's built-in welcome / confirmation / reset templates with the Hoïs voice.
11. **Add a moderator role** for community ops (between user and admin).

### P3 — As you grow

12. **Domain email setup** (custom SMTP + SPF/DKIM/DMARC) for deliverability.
13. **Observability**: hook Supabase logs into something queryable (e.g. Logflare or just `pg_stat_statements`).
14. **Cron job**: a daily check that the 1:1 user-to-subscription invariant still holds; alert if it ever drifts.
15. **Test coverage on RLS** — write SQL fixtures that simulate user A trying to read user B's data and verify the policy denies it.

---

## 13 · What's working really well

- **Kreyòl-first content** is consistent across every UI surface.
- **Realtime chat + notification bell** with optimistic UI feels fast and modern.
- **Admin shell isolation** (sticky middleware + bfcache busting) is a clever solve for a UX problem.
- **Plan invariant** ensures every member is auditable in `subscriptions`.
- **Direct-to-storage uploads** make admin content management feel native.
- **Forum** has clean RLS (suspended members blocked, locked-topic enforcement, admin override).
- **Forgot-password + canonical site URL helper** is correctly anchored to prod.
- **Mobile responsive** drawers work everywhere.

---

## 14 · Quick command reference

```bash
# Local
npx next build                         # verify TypeScript + RSC
npm run dev                            # local dev server

# Deploy
npx vercel --prod --yes --token …     # push to production

# Supabase
# Run from Supabase Dashboard SQL editor or via MCP execute_sql
```
