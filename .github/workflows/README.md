# Deplwaman otomatik — konfigirasyon (yon sèl fwa)

Depi Secrets yo anplas, **chak push sou `main` deplwaye otomatik** sou
Hostinger (rale kòd → `npm run build` → rekòmanse). Se `build` la ki aplike
chak chanjman koulè / kòd sou sit an dirèk la.

## 1. Ajoute Secrets yo nan GitHub

GitHub → repo a → **Settings → Secrets and variables → Actions →
New repository secret**. Ajoute chak youn (non yo dwe egzak):

| Non Secret | Sa li ye / kote pou jwenn li |
|---|---|
| `HOSTINGER_SSH_HOST` | Adrès IP sèvè a (hPanel → **SSH Access** — egz. `147.79.x.x`) |
| `HOSTINGER_SSH_USER` | Non itilizatè SSH la (hPanel → SSH Access — egz. `u123456789`) |
| `HOSTINGER_SSH_PORT` | Pò SSH la — sou Hostinger se souvan **`65002`** (pa 22) |
| `HOSTINGER_SSH_KEY` | Kle SSH **prive** la (tout tèks la, `-----BEGIN…END-----`). Wè etap 2. |
| `HOSTINGER_APP_PATH` | Chemen dosye app la sou sèvè a (egz. `/home/u123456789/domains/hoismedikaplant.com/app`) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://kmzmtuthwssyuoklmydy.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Kle anon Supabase la (menm sa ki nan env Hostinger deja) |
| `NEXT_PUBLIC_SITE_URL` | `https://hoismedikaplant.com` |

> Se **sèlman** valè `NEXT_PUBLIC_*` yo ki bezwen isit (yo antre nan build
> la). Secrets prive yo (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`,
> `CRON_SECRET`…) rete nan env app Hostinger la — yo pa ale nan GitHub.

## 2. Kreye yon kle SSH pou GitHub (si w pa genyen youn)

Nan **hPanel → Advanced → SSH Access**:
1. Aktive SSH si l pa aktive.
2. Kreye (oswa mete) yon **SSH key**. W ap gen 2 pati: yon **piblik** ak yon
   **prive**.
3. Mete pati **piblik** la nan "Authorized keys" Hostinger (konsa sèvè a fè
   GitHub konfyans).
4. Kopye pati **prive** la nèt → kole li nan Secret `HOSTINGER_SSH_KEY`.

> ⚠️ Pa janm mete kle prive a nan kòd la — sèlman nan GitHub Secrets.

## 3. Kondisyon sou sèvè a

- Dosye `HOSTINGER_APP_PATH` la dwe deja yon **clone git** repo a
  (li konekte ak GitHub). Si deplwaman te konn mache avan, li deja konsa.
- Node.js 20.x enstale (hPanel → Node.js App).

## 4. Teste

- Onglè **Actions** → **Deploy to Hostinger** → **Run workflow** (branch
  `main`) → **Run**. Gade log la vin vèt (`✓ Deplwaman fini`).
- Apre sa, chak push sou `main` deplwaye pou kont li.
- Sou sit la: **Ctrl+Shift+R** pou vide cache navigatè a.

## Depanaj rapid

| Erè nan log la | Kòz / solisyon |
|---|---|
| `Permission denied (publickey)` | Kle prive/piblik pa matche. Refè etap 2. |
| `port 22: Connection refused` | Mete `HOSTINGER_SSH_PORT` = `65002`. |
| `npm run build` echwe (memwa) | Build la twò gwo pou sèvè a. Di m — n ap chanje pou bati sou GitHub epi voye rezilta a. |
| Sit rete menm apre deplwa | Rekòmanse a pa mache — si w sèvi PM2, chanje liy `touch tmp/restart.txt` nan `deploy.yml` pou `pm2 reload all`. |
| Paj blan / san style | Yon `NEXT_PUBLIC_*` manke nan Secrets — verifye 3 yo. |
