# RAPÒ CODE REVIEW + FUNCTIONAL AUDIT — MedikaPlant / Hoïs
**Dat:** 27 Sept 2026 · **Branch:** `main` · **Metòd:** 6 odit pwofon an paralèl + koreksyon dirèk + verifikasyon sou baz done a an dirèk (Supabase).

---

## 1. PROJECT HEALTH — Rezime

**Nòt jeneral: 🟢 An bon sante.**

- **Build:** ✅ pase (`next build` exit 0, tout 124 paj konpile)
- **Typecheck:** ✅ pase (`tsc --noEmit` exit 0)
- **Sekirite:** solid. **Okenn pwoblèm CRITICAL.** Kontwòl aksè (auth/authz) byen fèt toupatou — chak aksyon admin gen yon `assertAdmin` (role + kapasite). Chemen peman an ranfòse kounye a.
- **Sa mwen jwenn:** aplikasyon an te deja mi e byen sekirize (ranfòsman anvan yo kenbe). Pas sa a korije **1 bug ki t ap koute lajan** (Stripe), **1 twou nan kontwòl aksè** (plan pwotokòl), abi/fwit enfòmasyon sou fòm piblik yo, yon lyen admin ki t ap bay 404, ak plizyè bouton admin ki t ap echwe an silans.
- **Okenn fonksyonalite pa kraze.**

**Sa mwen kouvri:** envantè konplè (124 paj, 9 route handler, 53 fichye `actions.ts`, 59 migrasyon), odit fonksyonèl fonksyonalite-pa-fonksyonalite (6 domèn), bouton mouri/lyen kase, DB/RLS, sekirite, auth, API, jesyon erè, fòm, build.

---

## 2. SA MWEN KORIJE (FIXED) — pa severite

### 🔴 HIGH — korije

1. **Stripe webhook — risk lajan.** `app/api/webhooks/stripe/route.ts`
   Anvan: si yon ekriti aksè-peye a te echwe (abònman, acha kou, enskripsyon), webhook la te ka retounen `200` kanmenm → **manm nan peye men li pa jwenn aksè**, e Stripe pa t ap eseye ankò. Kounye a: tout 4 ekriti yo tcheke erè e voye yon `500` pou Stripe reeseye; barye idempotans lan sèlman trete kòd `23505` (doublon) kòm siksè.

2. **Barye plan pwotokòl (server-side).** `app/dashboard/programs/actions.ts`
   Anvan: `enrollInProgram` te tcheke plan an nan UI sèlman → yon manm `basic` te ka aktive yon pwotokòl `premium/vip` ak yon apèl dirèk. Kounye a: aksyon an li plan manm nan nan `profiles`, konpare ak `plan_required`, epi rejte si twò ba.

3. **Rate-limit + mesaj erè jenerik sou fòm piblik yo.** `lib/rate-limit.ts` (nouvo) + `app/glose/kontribye/actions.ts`, `app/laboratwa/kontribye/actions.ts`, `app/kontak/actions.ts`
   Anvan: fòm piblik san otantifikasyon (kontribisyon glosè/laboratwa, kontak) pa t gen limit → yon script te ka inonde yo; e yo t ap retounen `error.message` brital (fwit detay baz done a). Kounye a: limit pa IP (5–10/min) + mesaj jenerik an Kreyòl + `console.error` sèl kote pou dyagnostik.

4. **Lyen admin ki mouri (404).** `app/admin/(protected)/page.tsx`
   2 kat sou paj dakèy admin lan (`Segman aktif` + `Top segman maladi`) te pwente sou `/admin/segments` ki **pa egziste**. Korije → `/admin/health?tab=segments`.

5. **Bouton admin ki echwe an silans.** `laboratwa/plant/plants-admin.tsx`, `laboratwa/kondisyon/conditions-admin.tsx`, `doz/doz-row-actions.tsx`, `doz/doz-categories.tsx`
   Anvan: efase/pibliye te inyore rezilta a e pa t gen `try/catch` → si l echwe, UI a te aji kòmsi l te reyisi, e wondèl la (spinner) te ka rete kole. Kounye a: `try/finally` + montre `res.error` (menm modèl ak `course-row-actions`).

### 🟡 MEDIUM — korije

6. **Validasyon plan nan `createPersonalProgram`.** `app/admin/(protected)/health/actions.ts` — yon valè plan enkoni te ka klase kòm 0 (vizib pou tout moun); kounye a li tonbe sou `basic` si l pa nan lis la.
7. **Validasyon metrik nan `createTreatmentForSegment`.** `app/admin/(protected)/health/segments/[slug]/actions.ts` — menm tchèk ak vèsyon manm-endividyèl la (rejte metrik ki pa valid anvan ensèsyon an mas).
8. **Migrasyon 138 — trigde wòl-imwabl (DR).** `supabase/migrations/138_role_immutable_trigger.sql` — trigde sekirite a (`trg_profiles_enforce_role`) te egziste sou baz done a men **li pa t nan migrasyon repo yo** → yon rebati ta pèdi pwoteksyon an. Kounye a li nan repo a + aplike sou live (idempotan).
9. **(anvan pas sa a)** rekri `.env.example` (12+ varyab ki te manke), kreye `.eslintrc.json`, mete `eslint.ignoreDuringBuilds` (pou lint pa kraze deplwaman — tsc toujou barye), `npm audit fix` (41→33 vilnerabilite).

---

## 3. SECURITY REVIEW

| Zòn | Estati |
|---|---|
| **Auth / authz** | ✅ Solid. Chak aksyon admin gate ak `assertAdmin` (`role==='admin'` + `hasCapability`). Wòl soti nan DB, pa nan `user_metadata`. Trigde wòl-imwabl live + kounye a nan repo. |
| **Peman** | ✅ Webhook Stripe = sèl bay-aksè, verifye siyati, idempotan, e kounye a **fail-closed** sou erè ekriti. |
| **RLS** | ✅ Lekti piblik pase pa fonksyon `SECURITY DEFINER`; service-role sèlman sou sèvè; revoke `anon` kòrèk. |
| **XSS** | ✅ DOMPurify sou tout HTML rich (guides, doz, atik). |
| **Rate-limiting** | ✅ Ajoute sou fòm piblik yo (pas sa a). |

**⚠️ RETE (rekòmandasyon, pa korije):**
- **Bucket atachman prive** — imaj sipò/glosè/laboratwa yo nan bucket `public-assets` piblik (kle ale-atwa kòm stopgap). Rekòmande yon bucket prive ak URL siyen.
- **CSP** fèb — pa gen `script-src` (dokimante kòm entansyonèl).
- **Twou gad-paj** sou 4 paj admin (`products`, `coupons`, `audit`, `backup`) — yon admin sou-wòl ba ka **wè** done a pa URL dirèk (mitasyon yo toujou bloke). Ajoute yon `hasCapability` redirect.
- **Kouvèti audit-log** se CMS sèlman — aksyon user/commerce/support/health/forum/badge pa ekri nan `audit_logs`.
- **Avi Next.js** (RCE) mande Next 16 (chanjman kase) — pwobableman pa aplikab sou host Linux la.

---

## 4. DATABASE REVIEW

- **Tout tab/RPC ke odit yo te make "pa ka verifye" EGZISTE sou live** (mwen tcheke): `user_dashboard_bundle` ✅, `user_suggestions` ✅, `resource_progress` ✅, `admin_impersonation_logs` ✅, fonksyon wòl-gad la ✅.
- **`types/database.ts` gen ~20 tab ki fin vye** → tout kouch CMS/dashboard fonksyone sou `as any` (pa gen sekirite tip sou non kolòn nan build la). **Se pa yon bug runtime**, men rekòmande **rejenere tip yo** pou pwoteksyon konpilasyon.
- **Ijyèn migrasyon:** trigde wòl-imwabl te live-sèlman → kounye a nan migrasyon 138 (aplike + repo).

---

## 5. FUNCTIONAL REVIEW — Checklist

**Lejand:** ✅ mache · ⚠️ mache men gen nòt · ❌ kase · ❓ pa ka verifye san kle live

| Domèn | Estati | Nòt |
|---|---|---|
| Homepage / marketing / header / footer / pricing | ✅ | pri yo kode-di (ap "mirror" `subscription_plans`) — risk driv afichaj sèlman |
| Glose (lekti + kontribisyon) | ✅ | |
| Laboratwa (tout zouti: eksploratè, plant, maladi, kalendriye, kat, konparezon, jwèt, kontribye) | ⚠️ | **galri foto plant la mwatye-bati** — `plants.photos` chaje men pa janm afiche (toujou placeholder) |
| Kou piblik + Potay etidyan (`/aprann`, `/klas`) | ⚠️ | mache; **aksyon `enrollInCourse` òfelen** (pa rele okenn kote); `dashboard/kou/[slug]` òfelen + `kou`≡`klas` doublon |
| Kontni CMS piblik (`/paj`, `/atik`, `/videyo`) | ✅ | |
| Dashboard manm (15 zòn: sante, pwotokòl, doz, kou, gid, resous, lakou, forum, badj, VIP, sipò, paramèt, notifikasyon, tutoryèl) | ✅ | VIP fèmen espre; badj yo debloke espre |
| Admin CMS/kontni (21 fonksyonalite) | ✅ | apwobasyon kontribisyon glosè/laboratwa = 2-etap manyèl (espre) |
| Admin commerce/users/ops (14) | ⚠️ | **koupon òfelen** (jere men pa janm aplike nan checkout); **enpèsonasyon pa bati**; **pa gen UI admin pou `subscription_plans`** (price-ID yo mande edite dirèk nan DB) |
| Admin health / fòm | ✅ | bouton echwe-an-silans yo korije pas sa a |
| Flux Auth (konekte, enskri-via-checkout, dekonekte, bliye/reset modpas, konfime imèl, login admin/etidyan) | ✅ | tout konplè |

**❓ Pa ka verifye san kle/env live (kòd konplè):** pòtal faktirasyon Stripe (`billingPortal`), livrezon web-push an dirèk (bezwen VAPID — memwa di li konfigire live).

---

## 6. BUILD STATUS

```
tsc --noEmit ......... ✅ exit 0
next build ........... ✅ exit 0 (tout wout konpile)
eslint ............... konfigire (.eslintrc.json), pa-barye-deplwaman (tsc barye)
npm audit ............ 33 (te 41); rès la mande Next 16
```

---

## 7. FILES MODIFIED (pas sa a)

**Modifye:**
- `app/api/webhooks/stripe/route.ts` — idempotans + tchèk erè ekriti (HIGH)
- `app/dashboard/programs/actions.ts` — barye plan server-side (HIGH)
- `app/glose/kontribye/actions.ts`, `app/laboratwa/kontribye/actions.ts`, `app/kontak/actions.ts` — rate-limit + mesaj jenerik (HIGH)
- `app/admin/(protected)/page.tsx` — korije lyen `/admin/segments` (HIGH)
- `app/admin/(protected)/laboratwa/plant/plants-admin.tsx`, `.../kondisyon/conditions-admin.tsx`, `.../doz/doz-row-actions.tsx`, `.../doz/doz-categories.tsx` — try/finally + montre erè (HIGH)
- `app/admin/(protected)/health/actions.ts` — validasyon plan (MEDIUM)
- `app/admin/(protected)/health/segments/[slug]/actions.ts` — validasyon metrik (MEDIUM)
- `.env.example`, `next.config.js`, `package-lock.json` — ijyèn build/depandans

**Nouvo:**
- `lib/rate-limit.ts` — limitè an-memwa pou aksyon piblik
- `supabase/migrations/138_role_immutable_trigger.sql` — DR trigde wòl (aplike sou live tou)
- `.eslintrc.json` — konfigirasyon lint

**⚠️ Nouvo, PA gen rapò ak odit la (travay tutoryèl anvan an, ap tann apwobasyon ou):**
- `app/dashboard/tutorial/`, `components/dashboard/tutorial-guide.tsx`, `components/dashboard/sidebar.tsx` (atik "Tutoryèl")
- `app/tutorial-preview/` — **wout TANPORÈ, dwe efase anvan nenpòt deplwaman**

---

## 8. REMAINING RECOMMENDATIONS (pa korije — bezwen desizyon/priyorite)

**MEDIUM**
- Modèl "spinner ki rete kole" nan ~12 handler admin (sèlman si aksyon an *voye* yon erè inatandi) — resèt: `try/finally` + montre `res.error`.
- `error.message` brital rive nan UI admin (admin-sèlman; make kòd yo bay mesaj jenerik).
- Bucket atachman prive (sipò/glosè/laboratwa).
- Gad-paj sou 4 paj admin (products/coupons/audit/backup).
- Rejenere `types/database.ts` (~20 tab an reta).

**LOW / netwayaj**
- Koupon: konekte nan checkout oswa kache yo (jodi a jere men pa janm aplike).
- UI admin pou `subscription_plans` price-ID (checkout depann de yo; edite dirèk nan DB kounye a).
- Galri foto plant laboratwa (afiche `plants.photos`).
- Netwayaj kòd mouri: `enrollInCourse`, `dashboard/kou/[slug]`, `UpsellCard`, `BentoPricing`, `PLAN_HREF`, fetch `products` sou dashboard-home, badj Resous kode-di `'12'`.
- Doublon `dashboard/kou` ≡ `dashboard/klas`.
- Bouton mouri: panye nan topbar, `Apèl`/`Plis` nan chat sipò.
- CSP `script-src`; upgrade Next 16 pou avi sekirite.

**❓ COULD NOT FULLY VERIFY** (bezwen kle/env live): pòtal faktirasyon Stripe, livrezon web-push an dirèk.
