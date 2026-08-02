# Gid Konfigirasyon Zoom (pou lyen pèsonèl elèv yo)

Objektif: bay platfòm nan dwa pou l kreye reyinyon Zoom epi enskri chak elèv otomatikman. Ou fè sa **yon sèl fwa**. L ap pran ~15 minit. Fòk ou se **pwopriyetè (owner)** kont Zoom Pro a.

---

## Etap 1 — Kreye yon "Zoom app" (Server-to-Server OAuth)

1. Ale sou **https://marketplace.zoom.us** epi konekte ak kont Zoom Pro ou an.
2. Anlè adwat, klike **Develop → Build App**.
3. Chwazi kalite **Server-to-Server OAuth** → **Create**.
4. Bay li yon non, egzanp: `Hois Medikaplant`.

## Etap 2 — Kopye 3 kle yo

Sou paj app la, nan onglè **App Credentials**, w ap wè 3 bagay. Kopye yo (n ap sèvi ak yo nan Etap 4):

- **Account ID**
- **Client ID**
- **Client Secret**

> ⚠️ Kenbe **Client Secret** la sekrè — se tankou yon modpas. Pa pataje l, pa mete l nan yon imèl.

## Etap 3 — Ajoute otorizasyon (Scopes)

Nan onglè **Scopes → Add Scopes**, chèche epi ajoute otorizasyon sa yo (yo pèmèt app la kreye reyinyon, enskri elèv, epi wè prezans):

- **Meeting** — View, Create, Edit, **Delete** reyinyon (view/write/delete).
- **Meeting Registrant** — View epi **Create** (enskri moun).
- **Report** — View **meeting participant reports** (pou prezans).
- **User** — View user (pou app la konnen ki kont pou l sèvi).

Apre sa, ale nan onglè **Activate your app** epi klike **Activate**.

## Etap 4 — Mete 3 kle yo sou sèvè a

Kle sa yo dwe viv **sou sèvè a sèlman** (janm nan navigatè a). Non yo dwe egzakteman konsa:

```
ZOOM_ACCOUNT_ID=<Account ID ou an>
ZOOM_CLIENT_ID=<Client ID ou an>
ZOOM_CLIENT_SECRET=<Client Secret ou an>
```

Kote pou mete yo:

- **Sou Hostinger** (kote sit la ap viv): nan paramèt anviwònman (Environment Variables) aplikasyon Node ou an. Se la ki pi enpòtan — se la sit reyèl la ap li yo.
- **Sou òdinatè devlopman an** (`.env.local`) si n ap teste an lokal.

> M ap ede w mete yo kòrèkteman lè lè a rive. Fè m konnen lè w gen 3 kle yo, epi si w vle m gide w pou kote egzak sou Hostinger.

## Etap 5 (opsyonèl) — Imèl rapèl otomatik

Si w vle Zoom voye chak elèv yon **imèl rapèl** anvan sesyon an (anplis konfimasyon an): nan paramèt Zoom ou (**Settings → Meeting → Email Settings**), aktive opsyon rapèl pou moun ki enskri yo.

---

## Sa k ap pase apre

Yon fwa 3 kle yo sou sèvè a:
1. Nan admin (`/admin/klas`), lè yon kou gen fòma **Zoom direkt** oswa **Hybrid**, yon seksyon **« Sesyon an dirèk »** ap parèt.
2. Ou ajoute yon sesyon (rekiren oswa dat inik) → platfòm nan kreye reyinyon Zoom lan otomatikman.
3. Chak elèv ki achte a jwenn **pwòp lyen pèsonèl li** + imèl Zoom.
4. Apre sesyon an, ou ka wè **kiyès ki te prezan**.

> Enfòmasyon teknik: `ZOOM_CLIENT_SECRET` bay aksè total — li rete sekrè, sou sèvè a sèlman. Lyen animatè a (host) pa janm parèt bò kote elèv yo.
