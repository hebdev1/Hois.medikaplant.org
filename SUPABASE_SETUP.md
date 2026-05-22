# Supabase Dashboard Configuration

These three settings cannot be applied via SQL migrations or the MCP
tools — they need to be set once in the Supabase Dashboard.

Project: **medikaplant** (`kmzmtuthwssyuoklmydy`)
Project URL: <https://supabase.com/dashboard/project/kmzmtuthwssyuoklmydy>

---

## 1. Site URL + redirect allow-list

**Why:** Supabase Auth rewrites any `redirectTo` that isn't on the
allow-list back to the Site URL. If the Site URL is `localhost:3000`,
every password-reset and signup-confirmation email links to localhost
even when sent from the production site.

**Where:** Authentication → URL Configuration

**Set:**

| Field                       | Value                                       |
| --------------------------- | ------------------------------------------- |
| **Site URL**                | `https://hois-medikaplant.vercel.app`       |
| **Additional Redirect URLs** | (one per line)                              |
|                             | `https://hois-medikaplant.vercel.app/**`    |
|                             | `https://*-elieherbybrutus1gmailcoms-projects.vercel.app/**` |
|                             | `http://localhost:3000/**`                  |

The wildcard `*-…vercel.app/**` entry lets preview deploys keep working
during PR reviews. The localhost entry is only needed if you still run
the app locally during development; remove it once dev moves to a
shared preview URL.

---

## 2. Enable the access-token auth hook

**Why:** Migration `029_custom_access_token_hook` ships a Postgres
function that adds `app_role` and `app_plan` claims to every issued
JWT. Without enabling the hook in the dashboard, the function exists
but Auth never calls it.

**Where:** Authentication → Hooks → "Custom Access Token Hook"

**Set:**

- **Enabled:** on
- **Hook type:** Postgres function
- **Schema:** `public`
- **Function name:** `custom_access_token_hook`

**Test:** sign out + sign back in, then inspect the JWT (the access
token cookie on `supabase-auth-token`) at <https://jwt.io>. You should
see `app_role` and `app_plan` in the decoded payload.

---

## 3. Email confirmation (optional)

**Where:** Authentication → Providers → Email

If you keep "Confirm email" **enabled**, signup at `/checkout` returns
a clean "tcheke imel ou" message and the visitor finishes payment
after confirmation. If you set it **disabled**, the checkout flow runs
end-to-end in a single submit (recommended for the demo).

---

## Vercel environment variables

In Vercel project settings → Environment Variables, ensure these are set
for **Production**, **Preview**, and **Development**:

| Name                            | Value                                      |
| ------------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://kmzmtuthwssyuoklmydy.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (publishable key from Supabase API page)   |
| `NEXT_PUBLIC_SITE_URL`          | `https://hois-medikaplant.vercel.app`      |

The `NEXT_PUBLIC_SITE_URL` is what `lib/site-url.ts` reads to anchor all
email redirect URLs to production, regardless of where the request was
SSR'd from.
