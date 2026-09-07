# Audit `generateProgramDraft` v4 — GROUPE B (P26 → P37)

> Chemin **Auto + focusMuscles** (`splitPreference` absent → `'auto'`, étape 5 Muscles active).
> Toutes les lignes citées réfèrent à `src/utils/programGenerator.ts`.

## Rappels de code utilisés dans tout le groupe

`workoutTypeFromFocus` (l. 399-431), ordre des règles :

| # | Ligne | Règle | Retour |
|---|-------|-------|--------|
| 0 | 402 | `focusMuscles.length === 0` | `null` |
| 1 | 412 | `hasLower && !hasUpper` | `'lower'` |
| 2 | 416 | `hasCore && !hasLower && !hasUpper` | `null` |
| 3 | 418 | `hasPush && !hasPull && !hasLower` | `'push'` |
| 4 | 420 | `hasPull && !hasPush && !hasLower` | `'pull'` |
| 5 | 422 | `hasUpper && !hasLower` | `'upper'` |
| 6 | 425 | `hasLower && hasPush && !hasPull` | `'lower_push'` |
| 7 | 428 | `hasLower && hasPull && !hasPush` | `'lower_pull'` |
| 8 | 430 | (défaut) | `null` |

Flags (l. 404-409) : `hasLower = legs`, `hasPush = chest || shoulders`, `hasPull = back`,
`hasArms = arms`, `hasCore = core`, `hasUpper = hasPush || hasPull || hasArms`.

`selectSplit` (l. 433) → `focusType` calculé l. 500, branches : `lower` l. 503-507 ·
`upper` l. 511-520 · `push` l. 523-530 · `pull` l. 533-540 · fallback type fixe l. 543 ·
split par défaut l. 547-576.

`adjustedSlotCount` l. 627-644 · `adjustedSpec` l. 651-655 · `reorderSlotsByFocus` l. 691-701
(appliqué **avant** la coupe de durée, l. 983-985 — un slot ciblé remonté survit à la coupe).
Nommage / suffixes A/B/C : l. 1038-1041 (le suffixe se calcule sur le **type public**, `toPublicType` l. 117-127).

Specs (l. 73-89) : hypertrophie cmp `4×8-12`/90 s, iso `3×10-15`/75 s · force cmp `5×3-5`/180 s,
iso `3×5-8`/120 s · fat_loss cmp & iso `3×12-15`/60 s · warmup `2×10`/0 s · core `3×15`/60 s.

---

## P26 — Auto + chest, hypertrophy 2j 60 min DB beginner

**Étape 1** — `workoutTypeFromFocus(['chest'])`
`hasLower=false · hasPush=true (chest, l.405) · hasPull=false · hasArms=false · hasCore=false · hasUpper=true`
→ règles 1-2 ignorées, **règle l. 418** `hasPush && !hasPull && !hasLower` → **`'push'`**

**Étape 2** — `selectSplit` : `pref='auto'` (l. 436), `focusType='push'` → branche l. 523,
`case 2` **l. 525** → **`['push','upper-push']`**
Types publics : `push` / `upper` → 2 canons distincts → `totalOfType=1` chacun (l. 1039) → **aucun suffixe**.
Noms : `Push — Poussée` / `Upper — Haut du corps`.

**Étape 3** — `focusedMuscles = {chest, chest_upper, chest_lower}` (l. 936-938).
- `push` : base 6 → `adjustedSlotCount(6, 60, 'hypertrophy')` = 60 min non-force → `base` = **6**
- `upper-push` : base 8 → **8**
`reorderSlotsByFocus` : les slots pectoraux sont déjà en tête de leur bloc (cmp 0, iso 0) → **ordre canonique inchangé** dans les deux séances.

**Étape 4/5 — Séance 1 · Push — Poussée (6 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | chest / chest_upper / chest_lower | cmp | 4×8-12 (90 s) |
| 2 | shoulders / shoulders_front | cmp | 4×8-12 |
| 3 | chest / chest_upper / chest_lower | iso | 3×10-15 (75 s) |
| 4 | triceps | iso | 3×10-15 |
| 5 | shoulders_lateral / shoulders | iso | 3×10-15 |
| 6 | shoulders_rear | iso | 3×10-15 |
| c | core | — | 3×15 |

**Séance 2 · Upper — Haut du corps (8 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | chest / chest_upper | cmp | 4×8-12 |
| 2 | back_width / back_thickness / back | cmp | 4×8-12 |
| 3 | shoulders / shoulders_front | cmp | 4×8-12 |
| 4 | chest / chest_lower / chest_upper | iso | 3×10-15 |
| 5 | triceps | iso | 3×10-15 |
| 6 | shoulders_lateral | iso | 3×10-15 |
| 7 | biceps | iso | 3×10-15 |
| 8 | back_thickness / back | iso | 3×10-15 |
| c | core | — | 3×15 |

Remplissage DB : les 14 slots sont pourvus (bench DB, shoulder press DB, fly, triceps, lateral raise, rear-delt fly, row DB, curl, pullover DB). Aucun slot vide.
`progressStepKg = 2.5`, `autoProgress = true` (l. 789-790, dumbbell).

**Assertions**

| Assertion | Verdict | Ligne |
|---|---|---|
| `workoutTypeFromFocus(['chest'])` → `'push'` | **PASS** | 418 |
| Split 2j push = `['push','upper-push']` (alternance, pas `['push','push']`) | **PASS** | 525 |
| Noms `Push — Poussée` / `Upper — Haut du corps` (sans suffixe) | **PASS** | 1039-1041 |
| Chest en tête dans les deux séances | **PASS** (déjà slot 0 canonique ; reorder sans effet) | 691-701 |

**Warning généré** : UX-5 (l. 1115) — `hasPushSession=true`, `hasPullSession=false` (`upper-push` n'est pas dans la liste pull l. 1103-1109) → *« Déséquilibre push/pull : aucune séance de tirage »*.
⚠️ **Faux positif partiel** : la séance `upper-push` contient bien 1 composé dos + 1 isolation dos. Le message est trop absolu.

**Évaluation coach** — Sur la semaine : 4 slots pecs, 4 slots épaules, 2 triceps… contre **1 composé dos + 1 isolation dos**. Ratio push/pull ≈ 5:1, très au-delà du 1:1 recommandé. Sur 2 séances/sem. c'est tenable 4-6 semaines en bloc de spécialisation, pas plus. 6 et 8 slots + warmup + core en 60 min hypertrophie (≈ 22 et 29 séries) → **irréaliste** : ~4 min/série ⇒ 90-115 min réels. Le bas du corps est totalement absent (cohérent avec un focus, mais aucun warning ne le signale). Verdict variété : **variété structurelle** (push ≠ upper-push). Isolation manquante : dos, jambes, avant-bras — lacune acceptable pour un bloc pec, **problématique** au-delà.

---

## P27 — Auto + back, hypertrophy 3j 60 min BB+DB+CABLE beginner

**Étape 1** — `workoutTypeFromFocus(['back'])`
`hasLower=false · hasPush=false · hasPull=true (l.406) · hasArms=false · hasCore=false · hasUpper=true`
→ règle 3 (l. 418) échoue (`hasPush=false`), **règle l. 420** `hasPull && !hasPush && !hasLower` → **`'pull'`**

**Étape 2** — branche `pull` l. 533, `case 3` **l. 535** → **`['pull','upper-pull','pull']`**
Types publics : `pull`, **`upper`**, `pull` → `totalOfType('pull')=2`, `totalOfType('upper')=1`.
Noms réels : **`Pull — Tirage A` / `Upper — Haut du corps` (sans suffixe) / `Pull — Tirage B`**.

**Étape 3** — `focused = {back, back_width, back_thickness}`.
- `pull` base 6 → `adjustedSlotCount(6,60,'hypertrophy')` = **6**
- `upper-pull` base 8 → **8**
Reorder `pull` : les 3 premiers slots sont déjà dos → inchangé.
Reorder `upper-pull` : compounds inchangés (2 dos puis chest) ; **isolations réordonnées** — l'isolation dos (pos 6 canonique) remonte en **1ʳᵉ isolation**, devant face pull / biceps.

**Séances A et C · Pull — Tirage (6 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | back_width / back | cmp | 4×8-12 |
| 2 | back_thickness / back | cmp | 4×8-12 |
| 3 | back_thickness / back_width / back | iso | 3×10-15 |
| 4 | biceps | iso | 3×10-15 |
| 5 | shoulders_rear | iso | 3×10-15 |
| 6 | forearms | iso | 3×10-15 |
| c | core | — | 3×15 |

**Séance B · Upper — Haut du corps (8 slots, après reorder)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | back_width / back | cmp | 4×8-12 |
| 2 | back_thickness / back | cmp | 4×8-12 |
| 3 | chest / chest_upper | cmp | 4×8-12 |
| 4 | back_thickness / back (iso dos — **remonté**) | iso | 3×10-15 |
| 5 | shoulders_rear | iso | 3×10-15 |
| 6 | biceps | iso | 3×10-15 |
| 7 | triceps | iso | 3×10-15 |
| 8 | shoulders_lateral | iso | 3×10-15 |
| c | core | — | 3×15 |

Remplissage BB+DB+CABLE : tous les slots pourvus (lat pulldown câble, row barbell, pullover DB, curl, face pull, wrist curl, bench barbell…).

**Assertions**

| Assertion | Verdict | Ligne |
|---|---|---|
| `workoutTypeFromFocus(['back'])` → `'pull'` | **PASS** | 420 |
| Split 3j pull = `['pull','upper-pull','pull']` | **PASS** | 535 |
| Noms « Pull — Tirage A/B/C » | **FAIL** — réel : `Pull — Tirage A` / `Upper — Haut du corps` / `Pull — Tirage B`. `upper-pull` se projette sur le type public `upper` (l. 119) donc compte séparément dans `totalOfType` | 1039-1041 |
| Dos en tête dans chaque séance | **PASS** (compounds dos en 1-2 partout ; iso dos remontée en B) | 691-701 |

**Warnings** : aucun. `publicTypes = {pull, upper}` → taille 2, donc **pas** de warning de spécialisation (l. 1083). `hasPullSession=true` → pas de warning push/pull.

**Évaluation coach** — 3 séances, 20 slots, dont **14 orientés dos/biceps**. Pectoraux : 1 seul composé sur la semaine ; quadriceps, ischios, fessiers, mollets : **zéro**. Le ratio pull/push ≈ 7:1 inverse le déséquilibre habituel — sans risque postural (le tirage protège l'épaule) mais le programme n'est **pas complet** : c'est un bloc de spécialisation. Problème : **aucun warning n'est émis** alors que le programme est aussi déséquilibré que P26 (qui, lui, en reçoit un). L'asymétrie de la règle UX-5 (elle ne détecte que l'absence de tirage) est une lacune à corriger. Variété : **structurelle** (pull vs upper-pull) mais A et C sont **identiques structurellement** — seule la rotation d'exercices via `usedGlobally` (l. 773-775) les différencie. Couverture isolation : complète côté dos/bras, **lacunes problématiques** sur jambes et pecs.

---

## P28 — Auto + legs, hypertrophy 4j 60 min BW beginner

**Étape 1** — `workoutTypeFromFocus(['legs'])`
`hasLower=true · hasPush=false · hasPull=false · hasArms=false · hasCore=false · hasUpper=false`
→ **règle l. 412** `hasLower && !hasUpper` → **`'lower'`**

**Étape 2** — branche `focusType === 'lower'` **l. 503-506** :
`Array.from({length:4}, (_,i) => i%2===0 ? 'lower-quad' : 'lower-hip')`
→ **`['lower-quad','lower-hip','lower-quad','lower-hip']`**
`toPublicType` → `'lower'` ×4 → `totalOfType=4` → suffixes **A/B/C/D**, tous nommés `Lower — Bas du corps`.

**Étape 3** — `focused = {quads, hamstrings, glutes, calves}` : **tous** les slots de `lower-quad` et `lower-hip` sont ciblés → `reorderSlotsByFocus` sans effet (tous `aF=0`).
`adjustedSlotCount(6, 60, 'hypertrophy')` = **6** pour les deux types.

**Séances A et C · lower-quad (6 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads / glutes | cmp | 4×8-12 |
| 2 | hamstrings / glutes | cmp | 4×8-12 |
| 3 | quads | iso | 3×10-15 |
| 4 | hamstrings | iso | 3×10-15 |
| 5 | glutes | iso | 3×10-15 |
| 6 | calves | iso | 3×10-15 |
| c | core | — | 3×15 |

**Séances B et D · lower-hip (6 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | glutes / hamstrings | cmp | 4×8-12 |
| 2 | quads / glutes | cmp | 4×8-12 |
| 3 | glutes | iso | 3×10-15 |
| 4 | hamstrings | iso | 3×10-15 |
| 5 | quads | iso | 3×10-15 |
| 6 | calves | iso | 3×10-15 |
| c | core | — | 3×15 |

**Remplissage réel en BW pur** (vérifié dans `exercises-seed.json`) :
le pool bodyweight non-warmup contient `bw-squat`, `bw-lunge`, `bw-jump-squat`, `seed-curtsy-lunge`, `seed-hip-thrust-bw`, `bw-wall-sit`, `seed-glute-bridge`, `seed-donkey-kick`, `seed-fire-hydrant`, `bw-calf-raise`.
**Aucun exercice ischio-jambiers** : `seed-good-morning-bw` est `isWarmupExercise` (exclu l. 943) et `bw-nordic-curl` est `pullup_bar`.
→ slot 4 (`hamstrings` iso) **vide et silencieux** dans les 4 séances (pas de warning : le warning n'existe que pour `slot.compound`, l. 996).
→ chaque séance rend **5 exercices + warmup + core = 7**, pas 8.

**Assertions**

| Assertion | Verdict | Ligne |
|---|---|---|
| `workoutTypeFromFocus(['legs'])` → `'lower'` | **PASS** | 412 |
| Split = `['lower-quad','lower-hip','lower-quad','lower-hip']` | **PASS** | 503-506 |
| Noms `Lower — Bas du corps A/B/C/D` | **PASS** | 1039-1041 |
| « slot hamstrings **compound** vide en BW pur » | **FAIL** — le slot `{hamstrings, glutes}` cmp trouve `seed-hip-thrust-bw` (glutes, compound, pop 3) : le filtre `slot.muscles.includes(primaryMuscle)` (l. 733) accepte glutes. Le slot **réellement vide** est l'isolation `hamstrings` (silencieuse) | 733-745 |
| `autoProgress:false`, `progressStepKg:0` | **PASS** (equipment `bodyweight`) | 789-790 |

**Warnings** : UX-D (l. 1083-1090) — `publicTypes = {'lower'}`, taille 1, `t==='lower'` → *« Programme de spécialisation… »*. Aucun warning « composé indisponible » (tous les slots compound trouvent un candidat).

**Évaluation coach** — 4 séances jambes/sem. en poids du corps chez un débutant : **volume excessif en fréquence, insuffisant en intensité**. Le squat BW (pop 3) sature dès la 2ᵉ semaine chez la plupart des débutants ; sans charge externe, la progression passe uniquement par les reps, et `autoProgress=false` le confirme. Les ischios ne sont **jamais** entraînés (ni compound ni isolation) — lacune **problématique** sur un programme jambes : déséquilibre quadriceps/ischios direct, facteur de risque genou. Le haut du corps est absent des 4 séances : sur 4 j/sem. c'est une semaine entière sans tirage → poids sur la posture. Verdict variété : **structurelle** (quad-dominant vs hip-dominant) + rotation exercices forcée par `usedGlobally` (séance B prendra `seed-curtsy-lunge`/`bw-lunge` faute d'inédits). Recommandation : 2 j jambes + 2 j haut du corps, ou ajouter une barre de traction (`bw-nordic-curl` débloque les ischios).

---

## P29 — Auto + core seul, hypertrophy 2j 60 min BW beginner (régression BUG#3)

**Étape 1** — `workoutTypeFromFocus(['core'])`
`hasLower=false · hasPush=false · hasPull=false · hasArms=false · hasCore=true · hasUpper=false`
→ règle 1 (l. 412) échoue (`hasLower=false`), **règle l. 416** `hasCore && !hasLower && !hasUpper` → **`null`**

**Étape 2** — `focusType` falsy → le bloc l. 501-544 est sauté → split par défaut, `switch(daysPerWeek)` **case 2, l. 548-549** → **`['fullbody-quad','fullbody-hip']`**
`toPublicType` → `'fullbody'` ×2 → **`Full Body A` / `Full Body B`**.

**Étape 3** — `focused = {core}`. Aucun slot de `SLOTS` ne contient `core` → tous les slots ont `aF=1` → tri stable neutre, ordre canonique conservé (l. 693-700).
`adjustedSlotCount(9, 60, 'hypertrophy')` = **9** pour les deux séances.

**Séance A · fullbody-quad (9 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads / glutes | cmp | 4×8-12 |
| 2 | chest / chest_upper | cmp | 4×8-12 |
| 3 | back_width / back_thickness / back | cmp | 4×8-12 |
| 4 | shoulders / shoulders_front | cmp | 4×8-12 |
| 5 | hamstrings | iso | 3×10-15 |
| 6 | shoulders_rear | iso | 3×10-15 |
| 7 | biceps | iso | 3×10-15 |
| 8 | calves | iso | 3×10-15 |
| 9 | triceps | iso | 3×10-15 |
| c | **core** (corePool, l. 1031-1036) | — | 3×15 |

**Séance B · fullbody-hip (9 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | hamstrings / glutes | cmp | 4×8-12 |
| 2 | chest / chest_upper | cmp | 4×8-12 |
| 3 | back_width / back | cmp | 4×8-12 |
| 4 | shoulders / shoulders_front | cmp | 4×8-12 |
| 5 | quads | iso | 3×10-15 |
| 6 | shoulders_lateral / shoulders_rear | iso | 3×10-15 |
| 7 | biceps | iso | 3×10-15 |
| 8 | calves | iso | 3×10-15 |
| 9 | triceps | iso | 3×10-15 |
| c | **core** | — | 3×15 |

**Remplissage réel en BW pur** — sévère :
- A : slot 3 (dos cmp) **vide → warning** (tous les exos dos BW — `seed-cat-cow`, `seed-superman`, `seed-thoracic-rotation` — sont `isWarmupExercise`) ; slots 5 (ham), 6 (rear delt), 7 (biceps), 9 (triceps) vides et silencieux. **4 exercices retenus** sur 9.
- B : slot 3 (dos cmp) **vide → warning** ; slots 6, 7, 9 vides. **5 exercices retenus**.
⚠️ **Bug de déduplication** : la clé est `` `${workoutType}:${primaryMuscle}` `` (l. 998) → `fullbody-quad:back_width` ≠ `fullbody-hip:back_width` → **le même message « Aucun exercice composé disponible pour "dos (largeur)" » est poussé deux fois** dans `generatorWarnings`.

**Assertions**

| Assertion | Verdict | Ligne |
|---|---|---|
| `workoutTypeFromFocus(['core'])` → **null** | **PASS** | 416 |
| Split 2j → `['fullbody-quad','fullbody-hip']` | **PASS** | 548-549 |
| **JAMAIS** `['lower','lower']` | **PASS** — la règle l. 412 exige `hasLower`, faux ici ; l. 416 intercepte avant toute autre | 412 / 416 |
| Core en queue via `corePool` | **PASS** | 1031-1036 |

**Warnings** : (1) UX-6 « Focus gainage » `unshift` (l. 1135-1141) ✔ ; (2) « Aucun exercice composé disponible pour "dos (largeur)" » **×2** (doublon). Pas de warning de spécialisation (`publicTypes={'fullbody'}` mais `t` n'est ni push/pull/lower, l. 1085).

**Évaluation coach** — La dégradation sémantique est **correcte** : « core » n'est pas un type de séance, le fullbody + gainage en queue est la bonne réponse, et le warning UX-6 l'explique à l'utilisateur. En revanche l'exécution en **BW pur est très pauvre** : 4-5 exercices utiles sur 9 slots, sans **aucun** travail de dos ni de bras — un fullbody amputé de toute la chaîne de tirage. C'est le pire déséquilibre postural du groupe (pompes sans tirage), et il n'y a pas de warning global qui le dise (UX-5 ne se déclenche pas car `fullbody-*` est considéré comme séance de tirage l. 1108). Un utilisateur « core, poids du corps » devrait au minimum être orienté vers l'ajout d'une barre de traction. Verdict variété : structurelle (quad vs hip) mais annulée en pratique par le nombre de slots vides. Couverture isolation : **lacunes problématiques** (dos, bras, ischios).

---

## P30 — Auto + shoulders, hypertrophy 2j 60 min DB beginner

**Étape 1** — `workoutTypeFromFocus(['shoulders'])`
`hasLower=false · hasPush=true (**shoulders**, l. 405) · hasPull=false · hasArms=false · hasCore=false · hasUpper=true`
→ **règle l. 418** → **`'push'`**

**Étape 2** — branche `push` l. 523, `case 2` **l. 525** → **`['push','upper-push']`**
Noms : `Push — Poussée` / `Upper — Haut du corps` (canons distincts → aucun suffixe).

**Étape 3** — `focused = {shoulders, shoulders_front, shoulders_lateral, shoulders_rear}`.
Ici `reorderSlotsByFocus` **modifie réellement l'ordre** :
- `push` : compounds `[chest(NF), shoulders(F)]` → **`[shoulders, chest]`** ; isolations `[chest(NF), triceps(NF), sh_lat(F), sh_rear(F)]` → **`[sh_lat, sh_rear, chest, triceps]`**
- `upper-push` : compounds `[chest, back, shoulders(F)]` → **`[shoulders, chest, back]`** ; isolations `[chest, triceps, sh_lat(F), biceps, back]` → **`[sh_lat, chest, triceps, biceps, back]`**

`adjustedSlotCount(6,60,'hypertrophy')=6` · `adjustedSlotCount(8,60,'hypertrophy')=8`.

**Séance 1 · Push — Poussée (6 slots, réordonnés)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | **shoulders / shoulders_front (OHP)** | cmp | 4×8-12 |
| 2 | chest / chest_upper / chest_lower | cmp | 4×8-12 |
| 3 | shoulders_lateral / shoulders | iso | 3×10-15 |
| 4 | shoulders_rear | iso | 3×10-15 |
| 5 | chest / chest_upper / chest_lower | iso | 3×10-15 |
| 6 | triceps | iso | 3×10-15 |
| c | core | — | 3×15 |

**Séance 2 · Upper — Haut du corps (8 slots, réordonnés)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | **shoulders / shoulders_front (OHP)** | cmp | 4×8-12 |
| 2 | chest / chest_upper | cmp | 4×8-12 |
| 3 | back_width / back_thickness / back | cmp | 4×8-12 |
| 4 | shoulders_lateral | iso | 3×10-15 |
| 5 | chest / chest_lower / chest_upper | iso | 3×10-15 |
| 6 | triceps | iso | 3×10-15 |
| 7 | biceps | iso | 3×10-15 |
| 8 | back_thickness / back | iso | 3×10-15 |
| c | core | — | 3×15 |

Remplissage DB : tous les slots pourvus (shoulder press DB / arnold press, bench DB, row DB, lateral raise, rear-delt fly, fly, triceps, curl, pullover DB).

**Assertions**

| Assertion | Verdict | Ligne |
|---|---|---|
| `hasPush=true` via `shoulders` → `'push'` | **PASS** | 405 / 418 |
| Split = `['push','upper-push']` | **PASS** | 525 |
| Épaules remontées en tête | **PASS** — OHP passe de la position 2 → **1** dans `push` et de 3 → **1** dans `upper-push` ; latéral/postérieur en tête des isolations | 691-701 |
| Slot OHP présent dans les deux types | **PASS** | SLOTS l. 134 & 192 |

**Warnings** : UX-5 (l. 1115) → déséquilibre push/pull (même faux positif partiel qu'en P26 : `upper-push` contient 1 composé dos).
UX-B (l. 1094) **ne se déclenche pas** : `split.every(t => t === 'push')` est faux à cause de `upper-push`. Or le focus est `shoulders` et le biceps n'apparaît qu'une fois (séance 2, pos 7) — le garde-fou rate partiellement sa cible.

**Évaluation coach** — Sur la semaine : **2 OHP + 2 élévations latérales + 1 postérieure = 5 slots épaules**, contre 1 composé dos et 1 isolation dos. Le deltoïde antérieur est en plus sollicité par les 2 développés couchés → volume antérieur ~7 slots vs 1 postérieur. C'est le profil type de la **douleur d'épaule antérieure / conflit sous-acromial** à 6-8 semaines. Point positif : le slot `shoulders_rear` est bien remonté en 4ᵉ position de la séance 1 (le générateur protège l'arrière d'épaule par construction). Recommandation coach : imposer un ratio, ex. 1 slot postérieur par OHP. Durée : 6 et 8 slots + warmup + core en 60 min hypertrophie → **hors créneau** (~90-115 min). Variété : **structurelle**. Isolation : jambes, dos (largeur), avant-bras absents — **lacunes acceptables** pour un bloc épaules court, sauf le dos.

---

## P31 — Auto + chest+back, hypertrophy 3j 60 min FULL beginner

**Étape 1** — `workoutTypeFromFocus(['chest','back'])`
`hasLower=false · hasPush=true (chest) · hasPull=true (back) · hasArms=false · hasCore=false · hasUpper=true`
→ l. 412 non · l. 416 non · l. 418 non (`hasPull=true`) · l. 420 non (`hasPush=true`) · **règle l. 422** `hasUpper && !hasLower` → **`'upper'`**

**Étape 2** — branche `upper` l. 511, `case 3` **l. 514-516** :
`level !== 'beginner' ? ['push','pull','upper'] : ['upper-push','upper-pull','upper-push']`
`level='beginner'` → **`['upper-push','upper-pull','upper-push']`**
Les 3 se projettent sur `'upper'` → `totalOfType=3` → **`Upper — Haut du corps A / B / C`**.

**Étape 3** — `focused = {chest, chest_upper, chest_lower, back, back_width, back_thickness}`.
- `upper-push` : compounds `[chest(F), back(F), shoulders(NF)]` → inchangés ; isolations `[chest(F), triceps, sh_lat, biceps, back(F)]` → **`[chest, back, triceps, sh_lat, biceps]`**
- `upper-pull` : compounds `[back_width(F), back_thickness(F), chest(F)]` → inchangés ; isolations `[sh_rear, biceps, back(F), triceps, sh_lat]` → **`[back, sh_rear, biceps, triceps, sh_lat]`**
`adjustedSlotCount(8, 60, 'hypertrophy')` = **8** partout.

**Séances A et C · upper-push (8 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | **chest / chest_upper** | cmp | 4×8-12 |
| 2 | back_width / back_thickness / back | cmp | 4×8-12 |
| 3 | shoulders / shoulders_front | cmp | 4×8-12 |
| 4 | chest / chest_lower / chest_upper | iso | 3×10-15 |
| 5 | back_thickness / back (**remonté**) | iso | 3×10-15 |
| 6 | triceps | iso | 3×10-15 |
| 7 | shoulders_lateral | iso | 3×10-15 |
| 8 | biceps | iso | 3×10-15 |
| c | core | — | 3×15 |

**Séance B · upper-pull (8 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | **back_width / back** | cmp | 4×8-12 |
| 2 | back_thickness / back | cmp | 4×8-12 |
| 3 | chest / chest_upper | cmp | 4×8-12 |
| 4 | back_thickness / back (**remonté**) | iso | 3×10-15 |
| 5 | shoulders_rear | iso | 3×10-15 |
| 6 | biceps | iso | 3×10-15 |
| 7 | triceps | iso | 3×10-15 |
| 8 | shoulders_lateral | iso | 3×10-15 |
| c | core | — | 3×15 |

Remplissage FULL : 24 slots tous pourvus (bench BB, lat pulldown / pullup, OHP BB, fly, pullover, triceps, curl, lateral raise, row BB, face pull…).

**Assertions**

| Assertion | Verdict | Ligne |
|---|---|---|
| `['chest','back']` → `'upper'` | **PASS** | 422 |
| Split 3j upper beginner = `['upper-push','upper-pull','upper-push']` | **PASS** (branche `level === 'beginner'`) | 514-516 |
| Noms `Upper — Haut du corps A/B/C` | **PASS** | 1039-1041 |
| upper-push : chest premier · upper-pull : back premier | **PASS** | 691-701 / SLOTS 188, 200 |

⚠️ **Effet secondaire du reorder** : en `upper-push` le slot `shoulders_lateral` (écarté latéral) descend en position 7 et le **face pull disparaît totalement** de ce type (il n'y est pas au catalogue) ; en `upper-pull` le face pull, décrit dans le code comme « obligatoire » (commentaire l. 206), est **rétrogradé de la 1ʳᵉ à la 2ᵉ isolation** par le focus. Comportement mineur mais contraire à l'intention du commentaire.

**Warnings** : **aucun**. `publicTypes = {'upper'}` (taille 1) mais `'upper'` n'est pas dans la liste `push|pull|lower` (l. 1085) → **pas de warning de spécialisation** ; `hasPushSession` et `hasPullSession` tous deux vrais → pas d'UX-5 ; UX-6 branche 3 exige `hasFocusLower` → pas déclenchée.
→ **Lacune identifiée** : un programme **sans une seule séance de jambes sur 3 j/sem.** ne produit aucun avertissement. `'upper'` devrait être ajouté à la liste l. 1085.

**Évaluation coach** — Structurellement c'est le meilleur profil du groupe : équilibre push/pull quasi parfait (A : 1 chest cmp + 1 back cmp ; B : 2 back cmp + 1 chest cmp ; C = A), fréquence 3× par groupe du haut, biceps et triceps couverts dans les deux patterns. La faiblesse est **l'absence totale de bas du corps** sur un programme de 8 semaines (`DURATION_WEEKS.beginner`) : acceptable en bloc de spécialisation de 4-6 semaines, discutable en programme complet — et **non signalé**. A et C sont structurellement identiques : **variété d'exercices seulement** (via `usedGlobally`) — avec FULL le pool est assez large pour éviter les répétitions. 8 slots + warmup + core en 60 min → ~29 séries, **hors créneau** (~110 min). Couverture isolation : complète sur le haut du corps (pecs, dos, bis, tris, latéral, postérieur) — **lacunes acceptables** hors jambes.

---

## P32 — Auto + legs+back, hypertrophy 2j 60 min BB+DB beginner

**Étape 1** — `workoutTypeFromFocus(['legs','back'])`
`hasLower=true · hasPush=false · hasPull=true · hasArms=false · hasCore=false · hasUpper=true (via hasPull)`
→ l. 412 non (`hasUpper=true`) · l. 416 non · l. 418 non · l. 420 non (`hasLower=true`) · l. 422 non (`hasLower=true`) · l. 425 non (`hasPush=false`) · **règle l. 428** `hasLower && hasPull && !hasPush` → **`'lower_pull'`**

**Étape 2** — `lower_pull` ne correspond à aucune branche spéciale → **fallback l. 543** `Array.from({length:2}, () => 'lower_pull')` → **`['lower_pull','lower_pull']`** (type fixe, aucune alternance).
`toPublicType('lower_pull') = 'lower'` (l. 121) → `totalOfType=2` → **`Lower — Chaîne postérieure A` / `B`**.

**Étape 3** — `focused = {quads, hamstrings, glutes, calves, back, back_width, back_thickness}`.
8 des 9 slots sont ciblés (seul le curl biceps, pos 9, ne l'est pas) et il est déjà en dernier → **ordre canonique inchangé**.
`adjustedSlotCount(9, 60, 'hypertrophy')` : `duration===60` et goal ≠ strength → **`base` = 9**, aucun cap (le cap `min(base+2, 8)` n'existe qu'à 90 min, l. 643).
→ **9 slots + warmup + core = 11 exercices** ✔

**Séances A et B · lower_pull (9 slots — identiques)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | hamstrings / glutes | cmp | 4×8-12 (90 s) |
| 2 | back_width / back | cmp | 4×8-12 |
| 3 | back_thickness / back | cmp | 4×8-12 |
| 4 | quads / glutes | cmp | 4×8-12 |
| 5 | glutes / hamstrings | iso | 3×10-15 (75 s) |
| 6 | back_thickness / back_width / back | iso | 3×10-15 |
| 7 | hamstrings | iso | 3×10-15 |
| 8 | calves | iso | 3×10-15 |
| 9 | biceps | iso | 3×10-15 |
| c | core | — | 3×15 |

**Remplissage BB+DB** — tous les slots pourvus, mais avec des substitutions notables :
- slot 2 (`back_width/back` cmp) : **aucun back_width compound** en BB+DB (lat pulldown = câble, pull-up = pullup_bar) → le seul candidat est `seed-deadlift` (`primaryMuscle: 'back'`) → **le soulevé de terre atterrit sur le slot « largeur du dos »**, pas sur le slot ischios.
- slot 1 (`hamstrings/glutes` cmp) : `seed-romanian-deadlift` (pop 3) — le RDL, pas le deadlift.
- slots 5 et 7 : **aucune isolation glutes/hamstrings** en BB+DB → repli sur des composés (l. 749-750 : `isolationFirst` vide ⇒ on garde les composés) → hip thrust barbell (slot 5) et RDL DB (slot 7), avec les specs **isolation 3×10-15** appliquées à des composés lourds.

**Assertions**

| Assertion | Verdict | Ligne |
|---|---|---|
| `['legs','back']` → `'lower_pull'` | **PASS** | 428 |
| Split = `['lower_pull','lower_pull']` (fixe) | **PASS** | 543 |
| Noms `Lower — Chaîne postérieure A/B` | **PASS** | 601 / 1039-1041 |
| `adjustedSlotCount(9,60,'hypertrophy')` = 9, pas de cap → 11 exercices | **PASS** | 638-639 |
| « deadlift premier slot, puis tractions, puis rowing, puis squat » | **PASS sur la structure**, **nuance** : en BB+DB le slot 1 reçoit le **RDL** et le deadlift remonte au slot 2 (largeur dos) ; sans câble ni barre de traction il n'y a pas de traction | 733-745 |

**Warnings** : UX-D spécialisation (l. 1083-1090, `publicTypes={'lower'}`). Pas d'UX-5 (`lower_pull` compte comme séance de tirage, l. 1105). Pas d'UX-6.

**Évaluation coach** — Excellente logique de programmation : deadlift-first, 4 composés puis isolations, chaîne postérieure + dos = les deux blocs qui se marient le mieux dans une même séance. **Zéro pectoraux / épaules / triceps** sur la semaine, mais c'est le contrat du focus et le tirage protège la posture, donc **aucun risque postural** (contrairement à P26/P30). Vraies faiblesses : (1) les **deux séances sont structurellement identiques** — `['lower_pull','lower_pull']` sans variante quad/hip alors que le générateur sait alterner (`lower-quad`/`lower-hip`) : verdict **variété d'exercices seulement**, et avec BB+DB le pool est étroit (4-5 candidats par slot) donc les répétitions arrivent vite ; (2) 9 slots ≈ 33 séries en 60 min → **très hors créneau** (~120 min réels) ; (3) les slots d'isolation fessiers/ischios se remplissent avec des composés en 3×10-15, ce qui déforme l'intention. Recommandation : introduire une variante `lower_pull-quad` / `lower_pull-hip` pour l'alternance A/B.

---

## P33 — Auto + legs+shoulders, strength 3j 60 min BB+DB intermediate

**Étape 1** — `workoutTypeFromFocus(['legs','shoulders'])`
`hasLower=true · hasPush=true (shoulders) · hasPull=false · hasArms=false · hasCore=false · hasUpper=true`
→ l. 412 non · l. 416 non · l. 418 non (`hasLower`) · l. 420 non · l. 422 non (`hasLower`) · **règle l. 425** `hasLower && hasPush && !hasPull` → **`'lower_push'`**

**Étape 2** — fallback **l. 543** → **`['lower_push','lower_push','lower_push']`**
`toPublicType = 'lower'` → `totalOfType=3` → **`Lower — Squat & Press A / B / C`**.

**Étape 3** — `focused = {quads, hamstrings, glutes, calves, shoulders, shoulders_front, shoulders_lateral, shoulders_rear}`.
`reorderSlotsByFocus` **modifie l'ordre des composés** :
compounds canoniques `[0 quads(F), 1 chest(NF), 2 OHP(F), 3 ham/glutes(F)]` → tri stable par flag → **`[quads, OHP, ham/glutes, chest]`**
isolations `[4 quads(F), 5 calves(F), 6 chest(NF), 7 glutes(F), 8 triceps(NF)]` → **`[quads, calves, glutes, chest, triceps]`**

**Étape 4** — `adjustedSlotCount(9, 60, 'strength')` = `max(4, floor(9×0.5)) = max(4, 4)` = **4 slots** (l. 638) → on garde les **4 composés réordonnés**.

**Séances A / B / C · lower_push (4 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads / glutes (squat) | cmp | 5×3-5 (180 s) |
| 2 | **shoulders / shoulders_front (OHP)** | cmp | 5×3-5 |
| 3 | **hamstrings / glutes (RDL)** | cmp | 5×3-5 |
| 4 | **chest / chest_upper (bench)** | cmp | 5×3-5 |
| c | core | — | 3×15 |

Total : **4 + warmup + core = 6 exercices** ✔ · `adjustedSpec(…, 60)` = inchangé (l. 652).

**Sélection `intermediate` (random top-3, l. 782-783)** — priorité barbell active (`goal==='strength' && slot.compound`, l. 769-771) :
- slot 1 : `seed-squat-barbell` (8) · `seed-front-squat` (2) · `seed-lunges`/`seed-bulgarian-split-squat` (DB, 2)
- slot 2 : `seed-ohp-barbell` (3) · `seed-shoulder-press-dumbbell` (3) · `seed-arnold-press` (2)
- slot 3 : `seed-romanian-deadlift` (3) · `seed-good-morning` (1) · `dumbbell-rdl` (2)
- slot 4 : `seed-bench-barbell` (8) · `seed-bench-dumbbell` (3) · `seed-incline-bench-barbell` (4)

**Assertions**

| Assertion | Verdict | Ligne |
|---|---|---|
| `['legs','shoulders']` → `'lower_push'` | **PASS** | 425 |
| Split = `['lower_push','lower_push','lower_push']` | **PASS** | 543 |
| Noms `Lower — Squat & Press A/B/C` | **PASS** | 602 / 1039-1041 |
| `adjustedSlotCount(9,60,'strength')` = 4 | **PASS** | 638 |
| « Slot 0 quads · **Slot 1 chest (bench)** · **Slot 2 OHP** · Slot 3 ham/glutes » | **FAIL** — `reorderSlotsByFocus` (appliqué **avant** la coupe, l. 983-984) hisse l'OHP (ciblé par `shoulders`) au-dessus du bench : ordre réel **quads → OHP → ham/glutes → bench**. Les 4 mêmes mouvements, mais pas le même ordre | 691-701 / 983-985 |

**Warnings** : (1) UX-D spécialisation (`publicTypes={'lower'}`) ; (2) **UX-5 déséquilibre push/pull** — `lower_push` est dans la liste push (l. 1112) et dans aucune liste pull → warning émis, et ici il est **pleinement justifié**. Pas de warning « force + débutant » (niveau intermediate).

**Évaluation coach** — Squat + OHP + RDL + bench en 5×3-5 trois fois par semaine : c'est exactement le squelette d'un **Wendler 5/3/1 « Boring But Big » ou d'un Starting Strength étendu**, et l'ordre réel (squat → OHP → RDL → bench) est même **plus cohérent** que celui annoncé dans l'assertion (les deux pressings ne s'enchaînent pas). Timing : 4×5 = 20 séries à ~3 min de repos ≈ 65-70 min + warmup + core → légèrement au-dessus des 60 min annoncées, mais c'est le compromis assumé documenté l. 617-623. **Le vrai problème est l'absence totale de tirage** : 3 séances/sem., 9 slots de pressing et de squat, zéro rowing, zéro traction. Sur 12 semaines (`DURATION_WEEKS.intermediate`) c'est un facteur de déséquilibre scapulaire net — le RDL travaille les érecteurs mais pas les rhomboïdes/trapèzes moyens. Le warning UX-5 le dit correctement ; il devrait être **bloquant côté wizard**, pas seulement informatif. Volume force par groupe : 15 séries/sem. de squat et 15 d'OHP → élevé mais gérable en 5/3/1 si l'intensité est ondulée (le générateur ne module pas l'intensité entre A/B/C : **3 séances identiques à 5×3-5**, ce qu'aucun coach ne programmerait — c'est la limite structurelle du fallback l. 543). Variété : **répétition complète** (structure identique ×3, seule la rotation top-3 varie les exercices). Isolation : aucune (normal à 4 slots en force).

---

## P34 — Auto + arms seul, hypertrophy 2j 60 min DB beginner

**Étape 1** — `workoutTypeFromFocus(['arms'])`
`hasLower=false · hasPush=false · hasPull=false · **hasArms=true** · hasCore=false · **hasUpper=true** (l. 409, via `hasArms`)`
→ l. 412 non · l. 416 non (`hasUpper=true`) · l. 418 non (`hasPush=false`) · l. 420 non (`hasPull=false`) · **règle l. 422** `hasUpper && !hasLower` → **`'upper'`**

**Étape 2** — branche `upper` l. 511, **`case 2: return ['push','pull']` (l. 513)** → **`['push','pull']`**
(et **non** `['upper-push','upper-pull']`).
Canons `push` / `pull` distincts → aucun suffixe → **`Push — Poussée` / `Pull — Tirage`** ✔

**Étape 3** — `focused = {biceps, triceps, forearms}` (`FOCUS_TO_MUSCLES.arms`, l. 24).
**Aucun slot compound ne cible les bras** → les compounds restent en tête, inchangés ; seules les isolations bougent :
- `push` : isolations `[chest(NF), triceps(F), sh_lat(NF), sh_rear(NF)]` → **`[triceps, chest, sh_lat, sh_rear]`**
- `pull` : isolations `[back(NF), biceps(F), sh_rear(NF), forearms(F)]` → **`[biceps, forearms, back, sh_rear]`**
`adjustedSlotCount(6, 60, 'hypertrophy')` = **6** pour les deux séances.

**Séance 1 · Push — Poussée (6 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | chest / chest_upper / chest_lower | cmp | 4×8-12 |
| 2 | shoulders / shoulders_front | cmp | 4×8-12 |
| 3 | **triceps (remonté)** | iso | 3×10-15 |
| 4 | chest / chest_upper / chest_lower | iso | 3×10-15 |
| 5 | shoulders_lateral / shoulders | iso | 3×10-15 |
| 6 | shoulders_rear | iso | 3×10-15 |
| c | core | — | 3×15 |

**Séance 2 · Pull — Tirage (6 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | back_width / back | cmp | 4×8-12 |
| 2 | back_thickness / back | cmp | 4×8-12 |
| 3 | **biceps (remonté)** | iso | 3×10-15 |
| 4 | **forearms (remonté)** | iso | 3×10-15 |
| 5 | back_thickness / back_width / back | iso | 3×10-15 |
| 6 | shoulders_rear | iso | 3×10-15 |
| c | core | — | 3×15 |

**Remplissage DB** — deux slots tombent :
- slot 1 pull (`back_width/back` cmp) : **aucun composé DB** en back_width ni back (`seed-pullover` est isolation, `seed-row-dumbbell` est back_thickness) → **slot vide + warning** « Aucun exercice composé disponible pour "dos (largeur)" » (l. 1002-1004).
- slot 4 pull (`forearms` iso) : **aucun exercice avant-bras en dumbbell** au catalogue (`seed-wrist-curl` est barbell) → **slot vide, silencieux**.
→ séance Pull réelle : **4 exercices + warmup + core = 6**, alors que le focus est « bras ».

**Assertions**

| Assertion | Verdict | Ligne |
|---|---|---|
| `hasArms=true → hasUpper=true`, `hasPush=hasPull=hasLower=false` | **PASS** | 404-409 |
| Règle appliquée `hasUpper && !hasLower` → `'upper'` | **PASS** | 422 |
| Split 2j upper = **`['push','pull']`** (pas `['upper-push','upper-pull']`) | **PASS** | 513 |
| Noms `Push — Poussée` / `Pull — Tirage` | **PASS** | 1039-1041 |

**Warnings** : (1) UX-6 branche « bras seul » (l. 1143-1149) **`unshift`** → *« Focus bras : "arms" seul génère un programme haut du corps complet… »* ✔ ; (2) warning composé dos (largeur) ; pas d'UX-5 (séance pull présente), pas d'UX-D (2 canons).

**Évaluation coach** — La décision de code est **sportivement juste** : les bras sont des muscles assistants, ils progressent dans un contexte de pressing/tirage lourd, et le warning UX-6 l'explique clairement à l'utilisateur — bonne UX. Mais la traduction concrète est décevante : sur 12 slots de la semaine, **2 seulement ciblent les bras** (triceps en push, biceps en pull), le 3ᵉ (avant-bras) tombe faute d'exercice DB. Un « focus bras » qui donne 2 slots bras par semaine est **contre-intuitif** au-delà de l'explication. Le reorder ne peut rien faire de plus : aucun slot compound « bras » n'existe (dips, curl barre en compound ne sont pas au catalogue en DB). Piste : ajouter à `upper`/`push`/`pull` un 2ᵉ slot bras quand `focusMuscles` contient `arms`. Équilibre push/pull : correct (1 séance chacune). Équipement : DB pénalise fortement le dos (pas de traction ni de tirage vertical) — un simple `pullup_bar` débloquerait `seed-pullup` **et** `bw-chinup` (biceps, compound, pop 3), soit exactement ce que veut l'utilisateur. Variété : **structurelle**. Isolation : jambes absentes (normal), avant-bras manquant (**lacune**, aggravée par le focus).

---

## P35 — Auto + legs+core, hypertrophy 3j 60 min BW beginner

**Étape 1** — `workoutTypeFromFocus(['legs','core'])`
`hasLower=true · hasPush=false · hasPull=false · hasArms=false · hasCore=true · hasUpper=false`
→ **règle l. 412** `hasLower && !hasUpper` → **`'lower'`** — évaluée **avant** la règle core (l. 416), qui exige `!hasLower` et n'est donc jamais atteinte. **Jamais `null`.**

**Étape 2** — branche `focusType === 'lower'` **l. 503-506**, `daysPerWeek=3` :
`i=0 → 'lower-quad'`, `i=1 → 'lower-hip'`, `i=2 → 'lower-quad'` → **`['lower-quad','lower-hip','lower-quad']`**
`toPublicType = 'lower'` ×3 → **`Lower — Bas du corps A / B / C`**.

**Étape 3** — `focused = {quads, hamstrings, glutes, calves, core}`. Aucun slot ne contient `core`, mais les 6 slots de chaque type sont ciblés par les 4 muscles jambes → `aF=0` partout → **ordre canonique inchangé**.
`adjustedSlotCount(6, 60, 'hypertrophy')` = **6** pour les deux types.

**Séances A et C · lower-quad (6 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads / glutes | cmp | 4×8-12 |
| 2 | hamstrings / glutes | cmp | 4×8-12 |
| 3 | quads | iso | 3×10-15 |
| 4 | hamstrings | iso | 3×10-15 |
| 5 | glutes | iso | 3×10-15 |
| 6 | calves | iso | 3×10-15 |
| c | **core** (corePool, l. 1031-1036) | — | 3×15 |

**Séance B · lower-hip (6 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | glutes / hamstrings | cmp | 4×8-12 |
| 2 | quads / glutes | cmp | 4×8-12 |
| 3 | glutes | iso | 3×10-15 |
| 4 | hamstrings | iso | 3×10-15 |
| 5 | quads | iso | 3×10-15 |
| 6 | calves | iso | 3×10-15 |
| c | **core** | — | 3×15 |

**Remplissage BW pur** : comme en P28, **le slot `hamstrings` isolation est vide** dans les 3 séances (aucun exercice ischio bodyweight non-warmup au catalogue) → 5 exercices utiles + warmup + core = **7** par séance.
`autoProgress = false`, `progressStepKg = 0`.

**Assertions**

| Assertion | Verdict | Ligne |
|---|---|---|
| `hasLower=true`, `hasCore=true`, `hasUpper=false` | **PASS** | 404-409 |
| Règle appliquée en premier : `hasLower && !hasUpper` → `'lower'` | **PASS** | 412 |
| **JAMAIS null** (legs domine core) | **PASS** — l. 416 exige `!hasLower` | 416 |
| Split 3j lower beginner = `['lower-quad','lower-hip','lower-quad']` | **PASS** | 503-506 |
| Core en queue via corePool | **PASS** — 1 exercice core par séance, avec rotation `workouts.length % corePool.length` | 1031-1036 |

**Warnings** : UX-D spécialisation (`publicTypes={'lower'}`, l. 1085) uniquement.
UX-6 « Focus gainage » **non déclenché** (l. 1135 exige `!hasFocusLower`) — **correct** : ici le core est bien pris en compte, un exercice par séance.

**Évaluation coach** — La hiérarchie de règles est la bonne : « jambes + gainage » est une demande cohérente et le résultat (3 séances bas du corps + 1 gainage en fin de chaque séance) y répond exactement. Réserve principale : **le core reste limité à 1 exercice de 3×15 par séance** — un utilisateur qui a explicitement coché « core » attend davantage (l'anti-extension, l'anti-rotation, le carry ne sont pas couverts). Le corePool tourne bien entre les séances (`seed-plank`, `seed-crunch`, `seed-leg-raise`, `seed-side-plank`…), ce qui limite la monotonie. Comme en P28, l'**ischio est totalement absent** en BW (slot iso vide, slot cmp rabattu sur le hip thrust BW) : déséquilibre quadriceps/ischios sur 8 semaines, à corriger en priorité. Zéro haut du corps sur 3 j/sem. — le warning de spécialisation le signale correctement. Variété : **structurelle** (A/C quad-dominant, B hip-dominant), mais A et C identiques : rotation d'exercices seulement, sur un pool BW très étroit (5-6 candidats pour tous les slots jambes) → répétitions inévitables dès la séance C.

---

## P36 — Auto + chest+back+legs, hypertrophy 2j 60 min FULL beginner

**Étape 1** — `workoutTypeFromFocus(['chest','back','legs'])`
`hasLower=true · hasPush=true (chest) · hasPull=true (back) · hasArms=false · hasCore=false · hasUpper=true`

| Règle | Test | Résultat |
|---|---|---|
| l. 412 | `hasLower && !hasUpper` | ✗ (`hasUpper=true`) |
| l. 416 | `hasCore && …` | ✗ (`hasCore=false`) |
| l. 418 | `hasPush && !hasPull && !hasLower` | ✗ |
| l. 420 | `hasPull && !hasPush && !hasLower` | ✗ |
| l. 422 | `hasUpper && !hasLower` | ✗ |
| l. 425 | `hasLower && hasPush && !hasPull` | ✗ (`hasPull=true`) |
| l. 428 | `hasLower && hasPull && !hasPush` | ✗ (`hasPush=true`) |
| **l. 430** | défaut | → **`null`** |

**Ambiguïté totale → `null`** ✔

**Étape 2** — `focusType` falsy → split par défaut, **case 2 l. 548-549** → **`['fullbody-quad','fullbody-hip']`**
→ **`Full Body A` / `Full Body B`**.

**Étape 3** — `focused = {chest, chest_upper, chest_lower, back, back_width, back_thickness, quads, hamstrings, glutes, calves}` (10 muscles).
`adjustedSlotCount(9, 60, 'hypertrophy')` = **9** pour les deux séances.
`reorderSlotsByFocus` : les 3 premiers composés sont ciblés, l'OHP ne l'est pas → compounds inchangés. Les isolations bougent :
- `fullbody-quad` : `[ham(F), sh_rear(NF), biceps(NF), calves(F), triceps(NF)]` → **`[ham, calves, sh_rear, biceps, triceps]`**
- `fullbody-hip` : `[quads(F), sh_lat/rear(NF), biceps(NF), calves(F), triceps(NF)]` → **`[quads, calves, sh_lat/rear, biceps, triceps]`**

**Séance A · fullbody-quad (9 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads / glutes | cmp | 4×8-12 |
| 2 | chest / chest_upper | cmp | 4×8-12 |
| 3 | back_width / back_thickness / back | cmp | 4×8-12 |
| 4 | shoulders / shoulders_front | cmp | 4×8-12 |
| 5 | hamstrings | iso | 3×10-15 |
| 6 | calves (**remonté**) | iso | 3×10-15 |
| 7 | shoulders_rear (**rétrogradé**) | iso | 3×10-15 |
| 8 | biceps | iso | 3×10-15 |
| 9 | triceps | iso | 3×10-15 |
| c | core | — | 3×15 |

**Séance B · fullbody-hip (9 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | hamstrings / glutes | cmp | 4×8-12 |
| 2 | chest / chest_upper | cmp | 4×8-12 |
| 3 | back_width / back | cmp | 4×8-12 |
| 4 | shoulders / shoulders_front | cmp | 4×8-12 |
| 5 | quads | iso | 3×10-15 |
| 6 | calves (**remonté**) | iso | 3×10-15 |
| 7 | shoulders_lateral / shoulders_rear | iso | 3×10-15 |
| 8 | biceps | iso | 3×10-15 |
| 9 | triceps | iso | 3×10-15 |
| c | core | — | 3×15 |

Remplissage FULL : les 18 slots sont pourvus (squat BB, bench BB, pullup/lat pulldown, OHP BB, leg curl machine, calf raise, face pull, curl, triceps, RDL…).

**Assertions**

| Assertion | Verdict | Ligne |
|---|---|---|
| `hasLower`, `hasPush`, `hasPull` tous vrais | **PASS** | 404-409 |
| `lower_push` échoue (`!hasPull` faux) · `lower_pull` échoue (`!hasPush` faux) | **PASS** | 425 / 428 |
| Ambiguïté totale → **null** | **PASS** | 430 |
| Split par défaut 2j → `['fullbody-quad','fullbody-hip']` | **PASS** | 548-549 |

⚠️ **Effet secondaire à noter** : le face pull (`shoulders_rear`), explicitement commenté « prioritaire » (l. 369), **recule de la position 6 à la position 7** derrière les mollets, parce que `calves` fait partie du focus `legs` et pas `shoulders_rear`. Sans conséquence ici (9 slots retenus), mais à 45 min (`adjustedSlotCount(9,45,…) = 6`) le face pull **serait éjecté** au profit des mollets — inversion de priorité coach.

**Warnings** : UX-6 branche 3 (l. 1151-1156) **`unshift`** → *« Sélection complète : votre focus couvre poitrine, dos et jambes — le programme généré est un full body… »* ✔ Message exact et pédagogique. Pas d'UX-D (`'fullbody'` hors liste l. 1085), pas d'UX-5 (`fullbody-*` compte comme tirage).

**Évaluation coach** — **Meilleure dégénérescence du groupe.** L'utilisateur a coché trois groupes contradictoires ; le système ne bricole pas un split bancal, il retombe sur un full body équilibré **et** utilise le focus pour hisser les muscles demandés en tête des isolations. Équilibre : 1 pressing + 1 tirage + 1 OHP + 1 mouvement jambes par séance, quad-dominant en A, hip-dominant en B → couverture complète, fréquence 2× par groupe. Cohérence objectif : 4×8-12 / 3×10-15 conformes à l'hypertrophie. **Durée : le point noir** — 9 slots + warmup + core = 11 exercices ≈ 33 séries de travail en « 60 min » ⇒ ~110-120 min réels. C'est le défaut systémique de `adjustedSlotCount` à 60 min hors force (`return base`, l. 639) : les templates 9 slots ne sont jamais coupés. Variété : **structurelle** (quad vs hip), pool FULL largement suffisant. Couverture isolation : complète (ischios ou quads, mollets, arrière/latéral d'épaule, biceps, triceps) — **aucune lacune**.

---

## P37 — Auto + back+legs, fat_loss 3j 45 min FULL intermediate

**Étape 1** — `workoutTypeFromFocus(['back','legs'])`
`hasLower=true (legs) · hasPush=false · hasPull=true (back) · hasArms=false · hasCore=false · hasUpper=true (via hasPull)`
→ l. 412 non (`hasUpper`) · l. 416 non · l. 418 non · l. 420 non (`hasLower`) · l. 422 non (`hasLower`) · l. 425 non (`hasPush=false`) · **règle l. 428** → **`'lower_pull'`**

**Étape 2** — fallback **l. 543** → **`['lower_pull','lower_pull','lower_pull']`**
`toPublicType='lower'` ×3 → **`Lower — Chaîne postérieure A / B / C`**.

**Étape 3** — `focused = {back, back_width, back_thickness, quads, hamstrings, glutes, calves}`.
8 slots sur 9 ciblés (seul le curl biceps pos 9 ne l'est pas, déjà dernier) → **ordre canonique inchangé**.

**Étape 4** — `adjustedSlotCount(9, 45, 'fat_loss')` : `duration===45`, goal ≠ strength → `max(3, floor(9×0.75)) = max(3, 6)` = **6 slots** (l. 636).
Éjectés par la coupe : pos 7 `hamstrings` iso, pos 8 `calves` iso, pos 9 `biceps` iso.
Total : **6 + warmup + core = 8 exercices** ✔

**Étape 5** — `adjustedSpec(spec, 45)` (l. 651-655), `factor = 0.75` :
compound fat_loss `3×12-15` → `sets = max(2, floor(3×0.75)) = max(2, 2)` = **2×12-15** (repos 60 s)
isolation fat_loss `3×12-15` → **2×12-15** (repos 60 s)
Warmup et core **ne passent pas** par `adjustedSpec` (l. 1018 / 1034) → restent `2×10` et `3×15`.

**Séances A / B / C · lower_pull (6 slots — identiques)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | hamstrings / glutes | cmp | **2×12-15** (60 s) |
| 2 | back_width / back | cmp | **2×12-15** |
| 3 | back_thickness / back | cmp | **2×12-15** |
| 4 | quads / glutes | cmp | **2×12-15** |
| 5 | glutes / hamstrings | iso | **2×12-15** |
| 6 | back_thickness / back_width / back | iso | **2×12-15** |
| c | core | — | 3×15 |

**Sélection `intermediate` (random top-3, l. 782-783) — slot 1 (`hamstrings/glutes` cmp, FULL)** :
candidats compound triés (focus → tous ciblés ; `slot.muscles[0]='hamstrings'` prioritaire ; goal ≠ strength donc pas de priorité barbell ; puis popularité) :
1. `seed-romanian-deadlift` (barbell, hamstrings, pop 3)
2. `dumbbell-rdl` (dumbbell, hamstrings, pop 2)
3. `bw-nordic-curl` (pullup_bar, hamstrings, pop 2)
(puis `seed-good-morning` pop 1, puis les glutes-compound `seed-hip-thrust` pop 4 / `seed-hip-thrust-machine` pop 3, relégués par le critère `slotPrimary`).
→ tirage aléatoire parmi ces 3 à chaque séance, avec bonus « non utilisé globalement » (l. 773-775) qui **force** de facto trois exercices différents en A/B/C.

**Assertions**

| Assertion | Verdict | Ligne |
|---|---|---|
| `['back','legs']` → `'lower_pull'` | **PASS** | 428 |
| Split = `['lower_pull','lower_pull','lower_pull']` | **PASS** | 543 |
| `adjustedSlotCount(9,45,'fat_loss')` = 6 | **PASS** | 636 |
| Total 6 + warmup + core = 8 exercices | **PASS** | 1021-1036 |
| top-3 pour slot 0 (hamstrings/glutes cmp) cité | **PASS** (voir ci-dessus) | 757-783 |
| *(non listé dans le prompt)* séries = 2 et non 3 | **À noter** — `adjustedSpec` à 45 min ramène **tous** les slots à 2 séries | 651-655 |

**Warnings** : UX-D spécialisation (`publicTypes={'lower'}`). Pas d'UX-5 (`lower_pull` ∈ liste tirage). Pas d'UX-6.

**Évaluation coach** — Le choix de split est pertinent : chaîne postérieure + dos, deadlift-first, 4 composés puis 2 isolations, c'est dense et métaboliquement coûteux — exactement ce qu'on veut en fat_loss. Mais **le volume s'effondre** : 6 exercices × 2 séries = **12 séries de travail par séance**, ~24 min de travail effectif repos compris sur un créneau de 45 min. Pour un intermédiaire en déficit calorique, 12 séries/séance est **sous le seuil de maintien de la masse maigre** (~10 séries/groupe/semaine recommandées ; ici les ischios en reçoivent 4, le dos 6, les quads 2). La réduction cumulée slots (9→6) **et** séries (3→2) est trop agressive : une seule des deux suffirait. Ratio cardio/force : **aucun cardio** dans le générateur alors que `cardio_machine` fait partie de FULL et que le catalogue contient tapis/vélo/rameur/elliptique — pour un objectif fat_loss c'est une lacune de conception, pas seulement de profil. Équilibre : zéro poussée sur la semaine (pas de pec, épaule ni triceps) — sans risque postural (le tirage domine) mais le programme reste **incomplet** sur 12 semaines ; le warning de spécialisation le signale. Mollets et ischios en isolation, ainsi que le curl biceps, sont coupés par la durée. Variété : **répétition complète** au niveau structurel (3 séances identiques), compensée par la rotation top-3 + pénalité `usedGlobally` qui garantit 3 exercices distincts par slot avec l'équipement FULL — c'est le seul profil du groupe où le pool est assez large pour que la rotation fonctionne vraiment.

---

# Synthèse GROUPE B (P26 → P37)

## Assertions du prompt en échec

| Profil | Assertion | Réel |
|---|---|---|
| **P27** | Noms « Pull — Tirage A/B/C » | `Pull — Tirage A` / **`Upper — Haut du corps`** (sans suffixe) / `Pull — Tirage B` — le suffixe se calcule sur le type **public**, et `upper-pull` → `'upper'` (l. 119, 1039) |
| **P28** | « slot hamstrings **compound** vide en BW pur » | Le slot cmp `{hamstrings, glutes}` est rempli par `seed-hip-thrust-bw` (glutes). Le slot réellement vide est l'**isolation** `hamstrings` — et il ne produit **aucun warning** (l. 996 ne couvre que les compounds) |
| **P33** | « Slot 1 = chest (bench) · Slot 2 = OHP » | `reorderSlotsByFocus` s'applique **avant** la coupe (l. 983-985) et hisse l'OHP (ciblé) au-dessus du bench : **quads → OHP → ham/glutes → bench** |

Toutes les autres assertions critiques du groupe passent, y compris les quatre cas spéciaux :
**P29** core seul → `null` (l. 416, jamais `'lower'`) · **P35** legs+core → `'lower'` (l. 412 évaluée avant 416) ·
**P36** chest+back+legs → `null` (l. 430) · **P26** push 2j → `['push','upper-push']` (l. 525).

## Défauts de code identifiés

1. **Warning de spécialisation aveugle à `'upper'`** (l. 1085) — P31 génère 3 séances haut du corps sans une seule séance de jambes sur 8 semaines, **sans aucun avertissement**. Ajouter `'upper'` à la liste `push | pull | lower`.
2. **UX-5 asymétrique** (l. 1103-1122) — détecte l'absence de tirage (P26, P30, P33) mais **jamais** l'absence de poussée (P27, P32, P37, où pecs/épaules/triceps sont à zéro). Et il est **faux-positif** en P26/P30, où `upper-push` contient bien un composé dos.
3. **Doublon de warning** (l. 998) — la clé de déduplication `` `${workoutType}:${muscle}` `` inclut le type de séance : en P29 le message « Aucun exercice composé disponible pour "dos (largeur)" » est poussé **deux fois** (`fullbody-quad` + `fullbody-hip`). Dédupliquer sur le seul muscle, ou sur le message final.
4. **Slots d'isolation vides et silencieux** — P28/P35 (ischios en BW), P34 (avant-bras en DB) : le slot disparaît sans trace, l'utilisateur ne sait pas qu'un groupe n'est jamais entraîné. Étendre le warning aux slots isolation quand **aucun** exercice du groupe n'existe dans l'équipement choisi.
5. **`reorderSlotsByFocus` peut rétrograder un slot « prioritaire »** — le face pull (`shoulders_rear`, commenté « prioritaire » l. 369 et « obligatoire » l. 206) recule derrière les mollets en P36 et derrière l'isolation dos en P31. À 45 min il serait purement éjecté. Prévoir des slots épinglés (non réordonnables).
6. **`lower_pull` / `lower_push` n'alternent jamais** (fallback l. 543) — P32, P33, P37 produisent 2 à 3 séances **structurellement identiques**, alors que `lower` sait alterner quad/hip (l. 503-506). Créer des variantes A/B pour ces deux types.
7. **Double réduction à 45 min** — P37 : slots 9→6 (`adjustedSlotCount`) **et** séries 3→2 (`adjustedSpec`), soit 12 séries par séance en fat_loss. Cumul trop agressif ; n'appliquer qu'une des deux réductions.
8. **Aucun cardio en fat_loss** — `cardio_machine` fait partie du preset FULL et le catalogue contient 4 exercices cardio + burpees / jump rope / high knees, mais aucun slot ne les cible (P37).
9. **Templates 9 slots jamais coupés à 60 min** (l. 639, `return base`) — P29, P32, P36 : 11 exercices ≈ 33 séries dans un créneau annoncé de 60 min, soit ~110-120 min réels. Le barème « autres objectifs » à 60 min devrait plafonner comme celui de la force.
10. **Focus « arms » très peu servi** (P34) — 2 slots bras sur 12 dans la semaine, aucun slot compound bras n'existant, et l'avant-bras tombe faute d'exercice DB. Envisager un slot bras supplémentaire lorsque `focusMuscles` contient `arms`.

## Tableau récapitulatif

| # | focusMuscles | focusType (ligne) | Split | Slots/séance | Specs |
|---|---|---|---|---|---|
| P26 | chest | `push` (418) | push · upper-push | 6 · 8 | 4×8-12 / 3×10-15 |
| P27 | back | `pull` (420) | pull · upper-pull · pull | 6 · 8 · 6 | 4×8-12 / 3×10-15 |
| P28 | legs | `lower` (412) | lower-quad/hip ×2 | 6 (5 remplis) | 4×8-12 / 3×10-15 |
| P29 | core | **null** (416) | fullbody-quad · fullbody-hip | 9 (4-5 remplis) | 4×8-12 / 3×10-15 |
| P30 | shoulders | `push` (418) | push · upper-push | 6 · 8 | 4×8-12 / 3×10-15 |
| P31 | chest+back | `upper` (422) | upper-push · upper-pull · upper-push | 8 ×3 | 4×8-12 / 3×10-15 |
| P32 | legs+back | `lower_pull` (428) | lower_pull ×2 | 9 | 4×8-12 / 3×10-15 |
| P33 | legs+shoulders | `lower_push` (425) | lower_push ×3 | 4 | 5×3-5 (force) |
| P34 | arms | `upper` (422) | **push · pull** (513) | 6 · 6 (4 remplis en pull) | 4×8-12 / 3×10-15 |
| P35 | legs+core | `lower` (412) | lower-quad · lower-hip · lower-quad | 6 (5 remplis) | 4×8-12 / 3×10-15 |
| P36 | chest+back+legs | **null** (430) | fullbody-quad · fullbody-hip | 9 | 4×8-12 / 3×10-15 |
| P37 | back+legs | `lower_pull` (428) | lower_pull ×3 | 6 | **2×12-15** (45 min) |
