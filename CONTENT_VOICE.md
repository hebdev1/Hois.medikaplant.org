# Guide du ton et de la voix de contenu — Hoïs / MedikaPlant

Document de référence pour toute personne qui écrit du contenu sur le SaaS
(guides, conseils du jour, descriptions de programmes, notifications,
emails, etc.). Source d'inspiration : la page
[medikaplant.org/hois-2/](https://medikaplant.org/hois-2/) et les quatre
guides fondateurs ajoutés par la migration `036b_hois_content_retry`.

---

## 1 · Le mot HOÏS

**HOÏS** est un mot sacré qui signifie « Limyè » (Lumière) et « Ekla
Limyè » (Éclat de Lumière). Ce mot est l'âme du projet — il fonde tout
ce qu'on écrit. Utiliser systématiquement les graphies suivantes :

| À écrire | Plutôt que |
| --- | --- |
| HOÏS (caps + tréma) | hois / Hois en bas de casse |
| Hoïs Inivèsite | Hoïs Université, Hoïs Univ |
| Pwisans Granmèt Souf la | Dieu, le Créateur, l'Être Suprême |
| Zèv limyè | bonne action, charité, devoir |

## 2 · Vocabulaire central

Le **register sacré** s'appuie sur six pierres angulaires. Quand on
introduit ces termes, on garde la majuscule ou les guillemets typographiques
« » :

| Terme | Sens | Contexte d'usage |
| --- | --- | --- |
| **Limyè** | Lumière, principe de bien | Ton d'ouverture, contraste avec fènwa |
| **Fènwa** | Obscurité, énergies négatives | Cadre de la mission HOÏS |
| **Pwisans Granmèt Souf la** | Créateur Suprême | Toujours la première mention de Dieu |
| **Zèv limyè** | Praxis du bien | Pour parler d'une action concrète |
| **Lanati ak kòmòs** | Nature + cosmos | Pour la cosmologie naturopathique |
| **Pakou HOÏS** | Le chemin / parcours | Pour parler du voyage du membre |

## 3 · Cosmologie de référence

À garder en tête quand on construit le récit :

- Granmèt Souf la est « **sila ki pa gen sou tèt** » — il n'y a personne au-dessus.
- L'humain a un **desten pèsonèl** (destin personnel) à découvrir.
- Le but de HOÏS est de **« louvri je »** (ouvrir les yeux) des moun ki dewoute
  (gens égarés).
- On distingue **plan ekzistansyèl** (plans d'existence) — le monde
  visible n'est qu'un plan parmi d'autres.
- Charit est à la fois un **acte d'amour** et un **« zam espirityèl »** (arme
  spirituelle) qui protège.

## 4 · Registres de communication

Le SaaS a quatre registres possibles selon le contexte :

### A · Registre sacré (guides, daily_advice, hero de la landing)

- Phrases courtes et solennelles
- Contraste limyè / fènwa
- Citations en italique avec guillemets typographiques
- Métaphores végétales et lumineuses

> Exemple : « Pa gen ankenn kontak ak HOÏS san premye rekonesans
> Pwisans Granmèt Souf la. Se ladann tout zèv limyè jwenn fòs yo. »

### B · Registre praticien (programmes, plantes, recettes)

- Concret, pratique
- Verbes d'action en seconde personne (« Bwè », « Fè », « Note »)
- Détails matériels (doses, durées, fréquences)
- Sans abandonner les mots sacrés mais sans surcharger

> Exemple : « Bwè yon tas tizan mounn-bwa avan dòmi — l ap kalme nè yo
> epi prepare kò w pou yon nwit rejenere. »

### C · Registre amical (forum, support chat)

- Tu/ou directement
- Ton chaleureux, jamais condescendant
- Encouragements explicites
- Phrases plus longues, conversationnelles

> Exemple : « Mèsi pou mesaj la. M ap reponn ou nan mwens ke 5 minit.
> Pandan tan an, gade gid yo nan paj Telechajman. »

### D · Registre technique (notifications, formulaires, erreurs)

- Court, factuel, sans floritures
- Indicatif présent
- Bilingue accepté (« checkout », « plan ») mais pas obligé

> Exemple : « Plan ou aktif kounye a. Tout sa plan an ofri disponib pou
> ou. »

## 5 · Règles d'orthotypographie

- **Guillemets** : utiliser « » pour les concepts sacrés en première
  mention. Apostrophes typographiques ’ partout sauf code.
- **Italique** : pour les noms de plantes et de tisanes, et pour les
  citations courtes.
- **Gras** : pour les verbes d'action et les mots-clés sacrés en première
  apparition dans un texte court.
- **Listes** : OK partout sauf en registre sacré. Les guides de praticien
  les aiment.
- **Tirets** : préférer le tiret cadratin « — » plutôt que le simple « - »
  dans les textes narratifs.
- **Nombres** : en chiffres dans le registre praticien (« 3 souf
  pwofon »), en lettres dans le sacré (« twa souf pwofon »).

## 6 · Personae auteur

Quand un guide ou un conseil porte une signature, choisir parmi :

| Persona | Pour quoi |
| --- | --- |
| **Vye Ewòl** | Guides spirituels et fondateurs HOÏS |
| **Mèt Joseph** | Support chat (déjà en place) |
| **Doktè Marie Lourdes** | Détox 24h, contenus médicaux |
| **Mèt èrboris** | Tisanes et préparations |

Garder ces personae cohérents pour que la communauté s'attache.

## 7 · Patterns à ré-utiliser

### Ouverture d'un guide

```markdown
# {Titre court et sacré}

**{Mot-clé HOÏS}** est {définition courte avec « »}.

{Cadrage en 2-3 phrases qui pose le contraste limyè/fènwa OU le
problème pratique}.

## {Premier sous-titre}
```

### Ouverture d'un conseil du jour

```html
<p><strong>Konsèy jou a — {micro-thème}.</strong></p>
<p>{2-3 phrases pratiques}</p>
<p>{Lien à une plante ou tisane si pertinent}</p>
```

### Fermeture d'un guide

Toujours finir par :

1. Une **citation italique entre guillemets typographiques**, OU
2. Une **invitation explicite à l'action** (« Klike pou… », « Pa kite
   yon sèl jou pase san… »)

## 8 · Ce qu'il ne faut pas faire

- ❌ Donner des conseils médicaux qui remplacent un vrai médecin
- ❌ Promettre des guérisons miraculeuses
- ❌ Mélanger les graphies (hois / HOÏS) dans le même document
- ❌ Sermonner — la voix HOÏS est invitante, pas culpabilisante
- ❌ Forcer le français là où le créole est plus juste
- ❌ Anglicismes (« checkout » accepté car nom de page ; « life-changing »
  non)

## 9 · Sources canoniques

- **medikaplant.org/hois-2/** — page « Kisa HOÏS ye? » ; texte verbatim
  importé dans la migration 036b.
- **Quatre guides fondateurs** : `/dashboard/guides/kisa-hois-ye`,
  `zev-limye`, `pwisans-granmet-souf-la`, `charit-pi-gwo-prev-lanmou`.
- **Plans HOÏS** : `app/checkout/plans.ts` (Bazilik / Sitwonèl / Melis).

Quand on hésite sur le ton, ouvrir un des quatre guides fondateurs et
s'en imprégner avant d'écrire.
