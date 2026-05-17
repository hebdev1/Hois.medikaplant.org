# MedikaPlant — Hoïs Inivèsite

A production-ready SaaS health platform combining traditional Haitian naturopathic medicine with modern tooling.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS 3**
- **Supabase** — Auth, Postgres, Realtime, Storage
- **lucide-react** icons
- **Recharts** for health-tracking charts

## Features

### Public landing page (Haitian Creole)
- Hero, Features, About, Testimonials, CTA, Footer
- **Pricing section** with three Hoïs plans:
  - Hoïs Bazilik — $350 / 1 Ane
  - Hoïs Sitwonèl — $600 / 2 Ane (popular)
  - Hoïs Melis — $800 / 3 Ane

### Auth
- Email/password signup + login via Supabase Auth
- Auto-creation of `profiles` row via trigger
- Route protection through Next middleware + RLS

### User dashboard (`/dashboard`)
- Greeting & current plan badge
- Resources gated by plan tier
- Health-log entry + history
- Plan-targeted notifications

### Admin dashboard (`/admin`, role = admin only)
- Overview KPIs
- Manage users, resources, subscriptions, notifications

## Local development

```bash
cp .env.example .env.local   # fill values
npm install
npm run dev
```

Open <http://localhost:3000>.

## Database

Schema lives in Supabase project **medikaplant** (`kmzmtuthwssyuoklmydy`). 8 tables, 5 enums, helper functions (`is_admin`, `get_user_plan`, `plan_rank`), 2 storage buckets, RLS on every table.

## Folder structure

```
app/
  (marketing)/          public landing
  auth/login            login
  auth/signup           signup (?plan=basic|premium|vip)
  dashboard/            user area (protected)
  admin/                admin area (role=admin only)
components/
  ui/                   hero, pricing, navbar, footer, …
  dashboard/            sidebar etc.
lib/
  supabase/             browser, server, middleware clients
  utils.ts              cn() & formatters
types/database.ts       generated Supabase types
middleware.ts           session refresh + route guard
```
