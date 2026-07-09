# Supabase — reproducing the database from git

The database schema is the source of truth in the **linked Supabase
project** (`kmzmtuthwssyuoklmydy`). Historically most migrations were
applied directly against the project (via the dashboard / MCP), so the
`supabase/migrations/` folder in git is **incomplete** — it holds only
the migrations authored as files. This doc is the one-time procedure to
make the repo the authoritative source going forward.

## Prerequisites

- Supabase CLI (`npx supabase` works; no global install needed)
- The project's **database password** (Dashboard → Settings → Database →
  Connection string / password). Keep it out of git.

## 1. Link the repo to the project (one time)

```bash
npx supabase link --project-ref kmzmtuthwssyuoklmydy
# paste the DB password when prompted, OR:
#   SUPABASE_DB_PASSWORD=... npx supabase link --project-ref kmzmtuthwssyuoklmydy
```

## 2. Pull the full schema into git

```bash
# Writes a single authoritative schema snapshot as a new timestamped
# migration under supabase/migrations/. This captures every table, RLS
# policy, function, trigger, and grant currently live.
npx supabase db pull

git add supabase/migrations
git commit -m "chore(db): snapshot live schema into migrations"
```

After this, `supabase/migrations/` reproduces the database. New changes
should be authored as migration files and applied with
`npx supabase db push` (or kept in sync with `db pull` if applied
out-of-band).

## 3. Download the edge functions into git

The project has these functions (also currently living only in Supabase):

```
cart · checkout · stripe-webhook · ai-chat · scan-plant · notifications
scraper · ingest · auto-update · analytics · recommend
product-enrichment · delete-user
```

Pull them all:

```bash
for fn in cart checkout stripe-webhook ai-chat scan-plant notifications \
          scraper ingest auto-update analytics recommend \
          product-enrichment delete-user; do
  npx supabase functions download "$fn"
done

git add supabase/functions
git commit -m "chore(functions): vendor edge functions into git"
```

## Notes

- **Secrets never go in git.** The DB password, `SUPABASE_SERVICE_ROLE_KEY`,
  `CRON_SECRET`, HubSpot + Vercel tokens, and Stripe keys stay in the
  hosting env (Hostinger Node.js panel) and Supabase secrets. See
  `DEPLOY.md` for the required env-var list.
- Runtime config the cron jobs read (`app_config.cron_secret`,
  `app_config.site_url`) is DB data, not schema — it won't appear in
  `db pull` and is set once per environment (see `DEPLOY.md`).
- `app/` server actions talk to the DB through RLS with the anon key;
  only edge functions + a few server actions use the service role.
