# Deplwaman Hostinger — gid pa etap

Si sit la **parèt san style** (raz) oswa ou wè yon paj blan apre yon
deplwa, swiv etap sa yo nan lòd.

## 1. Tcheke env vars yo anvan tout bagay

Sou Hostinger panel → **Node.js Apps** → **Manage** → **Environment
Variables**. Tout sa yo dwe egziste **AVAN** ou klike Build:

| Non (egzakteman) | Egzanp valè |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://kmzmtuthwssyuoklmydy.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` |
| `NEXT_PUBLIC_SITE_URL` | `https://hoismedikaplant.com` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` |
| `RESEND_API_KEY` | `re_...` |
| `EMAIL_FROM` | `MedikaPlant <onboarding@resend.dev>` |
| `SUPABASE_AUTH_HOOK_SECRET` | `v1,whsec_...` |
| `CRON_SECRET` | Bearer token pataje ak `app_config.cron_secret` nan Supabase. Sa ki pwoteje `/api/cron/daily-advice`, `/api/cron/weekly-summary`, ak `/api/webhooks/badge-unlocked`. Jenere ak 2 GUID (`[guid]::NewGuid()`) nan PowerShell oswa `openssl rand -hex 32`. |
| `CONTACT_REPLY_TO` | `sipò@hoismedikaplant.com` (opsyonèl — fallback sou `EMAIL_FROM`) |
| `HUBSPOT_PRIVATE_APP_TOKEN` | `pat-na1-...` (opsyonèl) |

> **CRON_SECRET setup**: Apre w mete env var la nan Hostinger, ale nan
> **Supabase → SQL Editor** epi kouri:
> ```sql
> insert into public.app_config(key, value) values ('cron_secret', '<MENM_VALÈ_AK_HOSTINGER>')
> on conflict (key) do update set value = excluded.value;
> insert into public.app_config(key, value) values ('site_url', 'https://hoismedikaplant.com')
> on conflict (key) do update set value = excluded.value;
> ```
> Toude valè yo dwe egal. Si absent, tout cron ak webhook yo tounen 401 an silans.

> **⚠️ Sa ki pi enpòtan**: `NEXT_PUBLIC_*` valè yo **enkòpore nan
> bundle browser la pandan build la**. Si yo manke nan moman build,
> manm yo ap wè yon paj blan / san style.

## 2. Konfigirasyon Node.js App la

Sou Hostinger panel:

| Setting | Valè |
|---|---|
| **Node.js version** | `20.x` (oswa pi resan) |
| **Application root** | `/` (rasin pwojè a) |
| **Application URL** | `https://hoismedikaplant.com` |
| **Application startup file** | `node_modules/.bin/next` ak `start` kòm argiman, OSWA `npm start` |
| **NPM install command** | `npm ci` (pi fyab pase `npm install`) |
| **Build command** | `npm run build` |
| **Run command / Start command** | `npm start` |

`.nvmrc` lan nan repo a deja make `20` — Hostinger Node.js panel
respekte sa otomatikman.

## 3. Sekans deplwaman

```
1. Pull latest code from GitHub
2. Stop the app  ←─── ENPÒTAN
3. npm ci
4. npm run build
5. Start the app
```

**Pa ka apèl ou** lan etap 2 a — si app la toujou ap mache pandan
nouvo build la ap fèt, ansyen pwosesis la ka kenbe ansyen `.next/`
chunks an memwa epi sèvi yo bay manm yo (sa esplike "raw / white page"
yo).

## 4. Verifikasyon post-deplwa

Apre app la kòmanse, **anvan ou di sa fini**, tcheke:

### a) Endpoint dyagnostic
Ouvri:
```
https://hoismedikaplant.com/api/auth/send-email
```
Ou ta dwe wè:
```json
{
  "ok": true,
  "env": {
    "SUPABASE_AUTH_HOOK_SECRET": true,
    "RESEND_API_KEY": true,
    "EMAIL_FROM": true,
    "NEXT_PUBLIC_SUPABASE_URL": true
  }
}
```
Si yon `true` manke, env var sa pa rive nan runtime — repete etap 1.

### b) CSS chaje
Ouvri paj akèy la → klike dwat → Inspect → Network tab → Filter
"CSS". Ou ta dwe wè:
- `_next/static/css/<hash>.css` ak estatis **200**

Si l ap retounen **404**, sa siyifi `.next/static/` a pa rive nan
Hostinger reverse proxy a. Solisyon:
- Asire `npm run build` te konplete san erè (Hostinger build log lan)
- Asire start command nan se `npm start` (PAS `npm run dev`)

### c) Imèl yo voye
Sou Supabase Dashboard → **Authentication → Hooks** → Send email
hook. Klike "Send test" — Hostinger app la dwe retounen estatis 200.
Si echwe, gade nan Hostinger runtime logs yo.

## 5. Pwoblèm kòmen + Solisyon

### Sit la parèt san style (raz)
**Kòz pi pwobable**:
- Build pa konplete (out of memory)
- Env vars manke pandan build
- Hostinger nginx reverse proxy pa konfigire pou sèvi `/_next/static/*`

**Solisyon**:
1. Tcheke build log Hostinger nan — gade gen `✓ Compiled successfully`
2. Verifye tout `NEXT_PUBLIC_*` env vars la **anvan build**
3. Restart app la nèt (pa jis reload)

### Erè 502 / 504 Gateway Timeout
**Kòz**: App pa boote, oswa li krazè a chak demand
**Solisyon**: Gade runtime logs nan Hostinger panel → soti pa erè a
pap kraze (anpil fwa env var ki manke)

### Modifikasyon kòd parèt apre 5+ minit
**Kòz**: Browser cache + Cloudflare/Hostinger CDN cache
**Solisyon**:
- Hard refresh (Ctrl+Shift+R)
- Si pèsiste: ouvri Hostinger CDN settings, "Purge cache"

### "Application Error" — sèvè a krazè
**Kòz**: Erè kliyan ki pa kenbe (egz. env var manke)
**Solisyon**: Gade browser console — copie erè a literal — voye li nan
chat.

## 6. Kondisyon idèyal sou Hostinger

```
Node.js:           20.x
Memwa:             2 GB minimum (build a manje yon dose)
Disk:              500 MB pou .next/ + node_modules/
Pò:                3000 (default Next.js)
Reverse proxy:     Nginx (Hostinger default)
HTTPS:             Let's Encrypt (Hostinger ofri sa otomatikman)
```

## 7. Si tout sa pa rezoud li

Voye 3 enfòmasyon sa yo bay devlopè a:
1. URL egzakt sit la
2. **Screenshot** sa w wè (Chrome F12 → Console tab → screenshot)
3. **Hostinger runtime logs yo** (Hostinger panel → Node.js Apps → Manage → Application logs)

Ak 3 yo, dyagnostik la pran 5 minit olye yon èdtan ap devine.
