# Stripe — etap konfigirasyon (Kreyòl)

Gid operasyonèl pou konekte Stripe ak MedikaPlant. Kòd la deja fèt; sa ki rete
se konfigirasyon nan Stripe Dashboard la + 3 varyab anviwònman.

> **Test ou Live?** Gen yon bouton **Test mode** anwo adwat nan Stripe. TOUT sa
> ou kreye (pwodwi, pri, kle, webhook) egziste **sèlman** nan mòd kote w te ye
> a. Yon `price_…` ki fèt an Test **pa** mache an Live. Chwazi mòd la anvan w
> kòmanse, epi rete ladan l jiska fen.

---

## Etap 0 — Verifye peyi kont lan (fè sa AVAN tout rès la)

**Settings → Business** (oswa Settings → Business details).

Stripe pa opere pou biznis ki baze **an Ayiti**. Si peyi kont lan se Ayiti, ou
p ap ka **resevwa** lajan an — menm si kliyan yo peye byen pwòp. Nan ka sa a,
rès etap yo p ap sèvi anyen jiskaske sa regle.

Pou w gen kle **Live**, fòk kont lan aktive (Stripe mande enfòmasyon biznis +
kont bank). Si w gen sèlman yon kle test, sa vle di kont lan poko aktive.

---

## Etap 1 — Kreye 3 pwodwi ak 6 pri

**Product catalog → Add product** (nan ansyen vèsyon an: Products → Add product).

Pou chak pwodwi:
1. **Name**: `Hoïs Bazilik` (apre sa `Hoïs Sitwonèl`, apre sa `Hoïs Melis`)
2. Nan seksyon **Pricing**:
   - **Recurring** (pa "One-off")
   - **Currency**: USD
   - **Amount**: pri chak mwa a (gade tablo a)
   - **Billing period**: `Monthly`
3. **Save**.
4. Louvri pwodwi ou fèk kreye a → **Add another price** → menm bagay men:
   - **Amount**: pri chak ane a
   - **Billing period**: `Yearly`

| Pwodwi | Chak mwa (Monthly) | Chak ane (Yearly) |
|---|---|---|
| Hoïs Bazilik | 11.25 | 121.50 |
| Hoïs Sitwonèl | 14.58 | 157.50 |
| Hoïs Melis | 20.75 | 224.10 |

Rezilta: **3 pwodwi, 6 pri**.

---

## Etap 2 — Kopye 6 ID pri yo

Sou paj chak pwodwi, chak pri gen yon ID ki kòmanse ak **`price_`**.
Klike sou pri a (oswa meni **⋮ → Copy ID**).

Yo **pa sekrè** — ou ka voye yo ban mwen nan chat la. M ap antre yo nan baz
done a (`subscription_plans.stripe_price_id_monthly` / `_yearly`).

Voye yo konsa:
```
Bazilik  monthly: price_...   yearly: price_...
Sitwonèl monthly: price_...   yearly: price_...
Melis    monthly: price_...   yearly: price_...
```

---

## Etap 3 — Pran 2 kle API yo

**Developers → API keys**

| Kle | Kòmanse ak | Sekrè? |
|---|---|---|
| Publishable key | `pk_…` | Non — li fèt pou l nan navigatè a |
| Secret key | `sk_…` | **Wi — pa janm pataje l** |

Pou secret key la, klike **Reveal**.

> ⚠️ **Pa kole `sk_…` la nan chat la**, ni nan git. Mete l dirèkteman nan
> anviwònman an (gade Etap 5).

---

## Etap 4 — Kreye webhook la (apre deplwaman)

Webhook la se sa **ki aktive plan yo**. Stripe dwe ka rive sou sit la sou
entènèt, donk fè etap sa a **apre** sit la deplwaye.

**Developers → Webhooks → Add endpoint**

- **Endpoint URL**: `https://hoismedikaplant.com/api/webhooks/stripe`
- **Events to send** — chwazi 6 sa yo:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- **Add endpoint**

Apre sa, sou paj endpoint la: **Signing secret → Reveal**. Li kòmanse ak
**`whsec_…`**. Sa a **se yon sekrè** tou.

---

## Etap 5 — Mete 3 varyab yo nan anviwònman an

Lokalman (fichye `.env.local`), epi sou **Hostinger** nan paramèt
anviwònman aplikasyon an:

```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

Twa yo dwe soti nan **menm mòd** (tout Test, oswa tout Live). Melanje yo ap fè
peman yo echwe.

---

## Etap 6 — Teste

Ak kle **Test**, sou paj checkout la:

| Ka | Nimewo kat |
|---|---|
| Peman pase | `4242 4242 4242 4242` |
| Bank mande verifikasyon (3-D Secure) | `4000 0025 0000 3155` |
| Kat refize | `4000 0000 0000 0002` |

Nenpòt dat nan lavni, nenpòt CVC.

Sa pou w verifye:
1. Kat ki pase → ou rive sou tablodebò a ak plan an aktif.
2. Kat ki refize → ou **rete** sou paj la ak yon mesaj erè (pa gen redireksyon).
3. Nan Stripe → Webhooks → endpoint la: livrezon yo make **200 OK**.
4. Nan Paramèt kont lan, bouton **Jere abònman** louvri pòtay Stripe la.

---

## Etap 7 — Pase an Live

Sèlman apre etap 6 pase nèt:
1. Limen **Live mode** nan Stripe.
2. Repete **Etap 1, 2, 3, 4** an mòd Live (pwodwi, pri, kle, webhook — tout
   bagay diferan an Live).
3. Ban m 6 nouvo ID `price_…` Live yo pou m mete yo nan baz done a.
4. Chanje 3 varyab yo sou Hostinger pou vèsyon Live yo.
