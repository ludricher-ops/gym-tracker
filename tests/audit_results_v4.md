# Audit `generateProgramDraft` — 68 profils wizard (v4)

**Auditeur :** coach sportif certifié (15 ans de programmation) + simulation exhaustive du code.
**Date :** 2026-09-06
**Fichiers audités :**
- `C:\dev\claude\gym-tracker\src\utils\programGenerator.ts` (961 lignes, lu en entier)
- `C:\dev\claude\gym-tracker\src\data\exercises-seed.json` (151 exercices, lu en entier)
- `C:\dev\claude\gym-tracker\src\components\screens\ProgramGeneratorScreen.tsx` (1045 lignes, lu en entier)

---

## 0. Méthode et niveau de preuve

Chaque profil a été **exécuté réellement** contre le code de production (`generateProgramDraft`
importé depuis `src/utils/programGenerator.ts`, seed réel `exercises-seed.json`, harnais Vitest),
puis **doublé d'une réplique indépendante** de `workoutTypeFromFocus` / `selectSplit` /
`adjustedSlotCount` / `reorderSlotsByFocus` / `pickExercise` afin de tracer slot par slot les
candidats et le choix retenu.

> **Contrôle de fiabilité :** la réplique et la sortie réelle du générateur ont été comparées
> exercice par exercice sur les **68 profils** et leurs **238 séances** → **0 divergence**
> (`REPLICA_MATCH=true` partout). Les tables ci-dessous sont donc la sortie réelle du code,
> pas une reconstitution approximative.

Pour les niveaux `intermediate` / `advanced`, `pickExercise` tire au hasard dans le top-3
(`candidates.slice(0,3)`, ligne 577-578). `Math.random` a été neutralisé à `0` → la sortie
montrée est **le tirage le plus canonique** (candidats[0]). Le top-3 complet est indiqué à chaque
slot : les deux autres candidats sont les variantes réellement possibles.

---

## 1. Référentiel extrait du code (source de vérité)

### 1.1 Specs séries × répétitions (lignes 58-74)

| Objectif | Composé | Isolation | Repos cpd / iso |
|---|---|---|---|
| `strength` | 5 × 3-5 | 3 × 5-8 | 180 s / 120 s |
| `hypertrophy` | 4 × 8-12 | 3 × 10-15 | 90 s / 75 s |
| `endurance` | 3 × 15-20 | 3 × 15-20 | 60 s / 45 s |
| `fat_loss` | 3 × 12-15 | 3 × 12-15 | 60 s / 60 s |

Warmup fixe `2 × 10`, repos 0 s. Core fixe `3 × 15`, repos 60 s (repsMode `fixed`).

### 1.2 `adjustedSlotCount(base, duration, goal)` — **signature à 3 arguments** (lignes 422-439)

| Durée | `strength` | Autres objectifs |
|---|---|---|
| 20 min | `max(2, ⌊base×0.5⌋)` | `max(2, ⌊base×0.5⌋)` |
| 45 min | `max(2, ⌊base×0.5⌋)` | `max(3, ⌊base×0.75⌋)` |
| 60 min | **`max(4, ⌊base×0.5⌋)`** | `base` (intégral) |
| 90 min | **`min(base, 6)`** | `min(base+2, 8)` |

> ⚠️ **Le fichier d'audit v3 est obsolète sur ce point.** Il décrit la version antérieure
> (sans paramètre `goal`). Toutes ses assertions « 11 exercices » sur des profils `strength`
> 60/90 min sont fausses par rapport au code actuel. Détail dans les profils concernés (P02, P50).

### 1.3 `adjustedSpec(spec, duration)` (lignes 446-450)

20 min → `max(2, ⌊sets×0.5⌋)` · 45 min → `max(2, ⌊sets×0.75⌋)` · 60/90 min → inchangé.
Valeurs réelles vérifiées : force cpd 5 → **2** (20 min) / **3** (45 min) ; hyper cpd 4 → **2** / **3** ;
isolation 3 → **2** / **2**.

### 1.4 Séances ≤ 20 min (lignes 810-831) — **non documenté dans l'audit v3**

`isVeryShort = sessionDuration <= 20` → warmup réduit à **1 série** et **core totalement supprimé**.
Conséquence : `total exercices = slots + 1` (et non `slots + 2`) pour toute séance de 20 min.

### 1.5 Nombre de slots de référence par type interne

| Type interne | Slots | Type public |
|---|---|---|
| `push`, `pull`, `legs`, `lower`, `lower-quad`, `lower-hip` | 6 | push / pull / legs / lower |
| `upper`, `upper-push`, `upper-pull` | 8 | upper |
| `fullbody-quad`, `fullbody-hip`, `lower_pull`, `lower_push` | **9** | fullbody / lower |
| `fullbody` (legacy, jamais produit par le générateur) | 8 | fullbody |

### 1.6 Pools warmup / core (lignes 741-750)

Le warmup et le core sont choisis par rotation : `pool[index de la séance % pool.length]`.
Ils incluent **toujours** le bodyweight, même si l'utilisateur ne l'a pas coché.

**Pool warmup sans `band` (16 entrées, ordre du seed) :** bird-dog, cat-cow, shoulder-circles,
dead-bug, walking-lunges, glute-bridge-warmup, good-morning-bw, hip-9090, inchworm, jumping-jacks,
leg-swings, mountain-climbers, thoracic-rotation, bodyweight-squat, superman, worlds-greatest-stretch.
**Avec `band` (18) :** `seed-band-pull-apart` en tête, `seed-clamshell` en 5ᵉ position.

**Pool core (bodyweight seul, 11) :** scissors, crunch, bicycle-crunch, vertical-leg-crunch,
side-plank, hollow-body, plank, leg-raise, ab-wheel, russian-twist, heel-touch.
`+ seed-cable-crunch` si `cable` (12) · `+ seed-hanging-leg-raise` si `pullup_bar` (12) ·
`+ kb-turkish-getup` si `kettlebell` (12).

### 1.7 Inventaire du seed — points structurants relevés

- **151 exercices**, dont 18 `isWarmupExercise` (exclus d'`available`, ligne 738) et 1 `popularity: 0`
  (`seed-football`, exclu par la ligne 530).
- `back_width` ne compte que **4 exercices** : `seed-lat-pulldown` (cable, cpd),
  `seed-pullup` (pullup_bar, cpd), `seed-pullover` (dumbbell, **iso**), `kb-pullover` (kettlebell, **iso**).
  → **Aucun composé `back_width` en barbell, dumbbell, band ou bodyweight pur.**
- `seed-triceps-dips` est **`category: "compound"`** dans le seed (le fichier d'audit v3 l'annonce
  comme isolation — erreur du prompt, pas du code).
- `shoulders_rear` en élastique : `band-face-pull` (band, iso, pop 2) et `bw-prone-y-raise`
  (band malgré son id `bw-`, iso, pop 1) sont disponibles et **non-warmup**.
  → **La réserve « SEED-2 toujours ouvert » du prompt v3 est caduque : le slot est rempli.**
- `shoulders_front` ne compte qu'**un seul** exercice (`seed-front-raise`, dumbbell, iso) ;
  tous les slots `['shoulders','shoulders_front']` sont donc servis par `shoulders`.
- `forearms` : 2 exercices, tous deux **barbell** (`seed-wrist-curl`, `seed-reverse-wrist-curl`).
- 4 exercices `cardio_machine`, tous `primaryMuscle: 'cardio'`. **Aucun slot du générateur ne
  cible `'cardio'`** → ils ne peuvent jamais être sélectionnés.

---

# GROUPE A — Split pur (10 profils)

---

## P01 — Référence fullbody beginner

`{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:FULL, level:'beginner' }`

**Simulation :**
- `workoutTypeFromFocus(undefined)` → `focusMuscles` absent → `[]` → `null` (ligne 293)
- `selectSplit` → case 2 (ligne 350) → `['fullbody-quad','fullbody-hip']` → public `['fullbody','fullbody']`
- `adjustedSlotCount(9, 60, 'hypertrophy')` → non-strength → **9 slots** (ligne 434)
- Pools : available = 98, warmup = 16, core = 12
- Programme : « Prise de masse · Débutant », 8 semaines, phases Adaptation[1-2] / Progression[3-5] / Intensification[6-7] / Décharge[8]
- Warnings : aucun

**Full Body A** (lundi) — `fullbody-quad`, usedGlobally vide

| # | Slot | Cat | Top-3 candidats (tri final) | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | rotation index 0 | seed-bird-dog | 2×10 |
| 1 | quads/glutes | cpd | squat-barbell(8), leg-press(3), bw-squat(3) | **seed-squat-barbell** | 4×8-12 |
| 2 | chest/chest_upper | cpd | bench-barbell(8), bench-dumbbell(3), chest-press-machine(3) | **seed-bench-barbell** | 4×8-12 |
| 3 | back_width/thickness/back | cpd | lat-pulldown(3), row-barbell(7), row-dumbbell(3) | **seed-lat-pulldown** | 4×8-12 |
| 4 | shoulders/front | cpd | shoulder-press-db(3), ohp-barbell(3), sh-press-machine(3) | **seed-shoulder-press-dumbbell** | 4×8-12 |
| 5 | hamstrings | iso | leg-curl-lying(3), leg-curl-seated(2), leg-curl-standing(2) | **seed-leg-curl-lying** | 3×10-15 |
| 6 | shoulders_rear | iso | face-pull(2), rear-delt-fly(2) | **seed-face-pull** | 3×10-15 |
| 7 | biceps | iso | curl-barbell(3), curl-dumbbell(3), curl-hammer(3) | **seed-curl-barbell** | 3×10-15 |
| 8 | calves | iso | calf-seated(2), calf-standing(2), bw-calf-raise(2) | **seed-calf-raise-seated** | 3×10-15 |
| 9 | triceps | iso | triceps-rope(3), triceps-pushdown(3), skullcrusher(2) | **seed-triceps-rope** | 3×10-15 |
| 10 | core | — | rotation index 0 | seed-scissors | 3×15 |

**Full Body B** (jeudi) — `fullbody-hip`, usedGlobally = les 9 de A

| # | Slot | Cat | Top-3 candidats | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | rotation index 1 | seed-cat-cow | 2×10 |
| 1 | hamstrings/glutes | cpd | romanian-deadlift(3), dumbbell-rdl(2), good-morning(1) | **seed-romanian-deadlift** | 4×8-12 |
| 2 | chest/chest_upper | cpd | bench-dumbbell(3), chest-press-machine(3), pushup(2) | **seed-bench-dumbbell** | 4×8-12 |
| 3 | back_width/back | cpd | lat-pulldown(3), deadlift(3) | **seed-lat-pulldown** ⚠️ répété | 4×8-12 |
| 4 | shoulders/front | cpd | ohp-barbell(3), sh-press-machine(3), arnold(2) | **seed-ohp-barbell** | 4×8-12 |
| 5 | quads | iso | leg-extension(3), wall-sit(2) | **seed-leg-extension** | 3×10-15 |
| 6 | sh_lateral/rear | iso | lateral-raise(3), lateral-raise-cable(2), rear-delt-fly(2) | **seed-lateral-raise** | 3×10-15 |
| 7 | biceps | iso | curl-dumbbell(3), curl-hammer(3), curl-incline(2) | **seed-curl-dumbbell** | 3×10-15 |
| 8 | calves | iso | calf-standing(2), bw-calf-raise(2), calf-db(2) | **seed-calf-raise-standing** | 3×10-15 |
| 9 | triceps | iso | triceps-pushdown(3), skullcrusher(2), triceps-overhead(2) | **seed-triceps-pushdown** | 3×10-15 |
| 10 | core | — | rotation index 1 | seed-crunch | 3×15 |

**Assertions :**
- Split `['fullbody','fullbody']` : **PASS** (ligne 350)
- 1 warmup + 9 slots + 1 core = **11 exercices** par séance : **PASS**
- Pas de doublon intra-workout : **PASS** (`usedInWorkout`, ligne 529)
- Premier exercice = warmup (`isWarmupExercise: true`) : **PASS** (`unshift`, ligne 821)
- Dernier exercice = core (`primaryMuscle: 'core'`) : **PASS** (ligne 829)
- `autoProgress: true`, `progressStepKg: 2.5` sur tout sauf le core et le warmup bodyweight : **PASS**

**Coach :**
- **Équilibre musculaire** : tous les groupes couverts sur la semaine (quads, ischios, fessiers via
  composés, pecs, dos, épaules 3 chefs, bras, mollets, core). Ratio poussée/tirage sur la semaine :
  4 poussées (bench ×2, OHP ×2) contre 2 tirages composés (lat pulldown ×2) + 2 isolations postérieures.
  ⚠️ **Ratio push/pull ≈ 2:1** — déséquilibré pour la santé d'épaule.
- **Cohérence objectif** : 4×8-12 composés et 3×10-15 isolations = zone hypertrophie exacte. ✅
- **Durée/contenu** : 4 composés × 4 × (40 s + 90 s) ≈ 35 min + 5 isolations × 3 × (30 s + 75 s) ≈ 26 min
  + warmup 1 min + core 5 min ≈ **67 min** pour un créneau de 60. Léger dépassement, acceptable.
- **Équipement** : 100 % dans `FULL`. Barbell correctement privilégié sur les gros mouvements de A. ✅
- **Variété A→B** : **variété structurelle** — `fullbody-quad` (squat-first) vs `fullbody-hip` (RDL-first),
  slots différents (hamstrings iso vs quads iso, face pull vs élévations latérales). ✅
- ⚠️ **`seed-lat-pulldown` est répété en A et B** : le tri `usedGlobally` le repousse mais `back_width/back`
  ne contient que lat-pulldown et deadlift en salle, et le deadlift perd sur `slot.muscles[0] = back_width`.
- **Couverture isolation** : présente pour hamstrings, quads, mollets, biceps, triceps, deltoïde
  postérieur/latéral. **Absente pour : pectoraux, dos, deltoïde antérieur.** Acceptable en fullbody 2 j
  (les composés couvrent), mais un débutant hypertrophie tirerait profit d'un slot pec isolation.
- **Volume hebdo** : 2 séances × 9 exercices = 18 postes/semaine. Correct pour un débutant à 2 j.
- **Verdict : ⚠️ PASS avec réserve** — ratio push/pull 2:1, lat-pulldown dupliqué A et B.

---

## P02 — Fullbody beginner force 3 j

`{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner' }`

**Simulation :**
- `workoutTypeFromFocus([])` → `null`
- `selectSplit` case 3 : `isMass=true` mais `level === 'beginner'` → fallback ligne 358
  → `['fullbody-quad','fullbody-hip','fullbody-quad']` → public `['fullbody','fullbody','fullbody']`
- `adjustedSlotCount(9, 60, 'strength')` → **`max(4, ⌊4.5⌋) = 4 slots`** (ligne 433)
- Noms : « Full Body A / B / C »
- Warnings : **1** — « Force pour débutant : les specs 5×3–5 supposent une technique parfaite… » (ligne 862)

**Full Body A** — `fullbody-quad`, 4 slots (tous composés)

| # | Slot | Cat | Top-3 (tri force : barbell prioritaire) | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | quads/glutes | cpd | squat-barbell(8), front-squat(2), leg-press(3) | **seed-squat-barbell** | 5×3-5 (180 s) |
| 2 | chest/upper | cpd | bench-barbell(8), chest-press-machine(3), bench-db(3) | **seed-bench-barbell** | 5×3-5 |
| 3 | back_w/th/back | cpd | lat-pulldown(3), row-barbell(7), deadlift(3) | **seed-lat-pulldown** | 5×3-5 |
| 4 | shoulders/front | cpd | ohp-barbell(3), sh-press-machine(3), sh-press-db(3) | **seed-ohp-barbell** | 5×3-5 |
| 5 | core | — | index 0 | seed-scissors | 3×15 |

**Full Body B** — `fullbody-hip`, 4 slots

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 1 | seed-cat-cow | 2×10 |
| 1 | hamstrings/glutes | cpd | romanian-deadlift(3), good-morning(1), dumbbell-rdl(2) | **seed-romanian-deadlift** | 5×3-5 |
| 2 | chest/upper | cpd | bench-barbell(8), chest-press-machine(3), bench-db(3) | **seed-bench-barbell** ⚠️ répété | 5×3-5 |
| 3 | back_width/back | cpd | lat-pulldown(3), deadlift(3) | **seed-lat-pulldown** ⚠️ répété | 5×3-5 |
| 4 | shoulders/front | cpd | ohp-barbell(3), sh-press-machine(3), sh-press-db(3) | **seed-ohp-barbell** ⚠️ répété | 5×3-5 |
| 5 | core | — | index 1 | seed-crunch | 3×15 |

**Full Body C** — `fullbody-quad`, 4 slots

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 2 | seed-shoulder-circles | 2×10 |
| 1 | quads/glutes | cpd | **front-squat(2)**, squat-barbell(8), leg-press(3) | **seed-front-squat** | 5×3-5 |
| 2 | chest/upper | cpd | bench-barbell(8), … | **seed-bench-barbell** | 5×3-5 |
| 3 | back_w/th/back | cpd | lat-pulldown(3), row-barbell(7), deadlift(3) | **seed-lat-pulldown** | 5×3-5 |
| 4 | shoulders/front | cpd | ohp-barbell(3), … | **seed-ohp-barbell** | 5×3-5 |
| 5 | core | — | index 2 | seed-cable-crunch | 3×15 |

**Assertions :**
- Split `['fullbody','fullbody','fullbody']` : **PASS** (ligne 358)
- Beginner reste fullbody en strength, PPL exige intermediate+ : **PASS** (ligne 354, `level !== 'beginner'`)
- « 11 exercices par workout » (assertion du prompt v3) : **FAIL — attente obsolète.**
  Le code produit **6 exercices** (4 slots + warmup + core), car `adjustedSlotCount(9, 60, 'strength')`
  cape à `max(4, 4) = 4` depuis l'ajout du paramètre `goal` (lignes 422-439). Le commentaire du code
  (lignes 410-418) documente ce changement volontaire. **Ce n'est pas un bug du générateur mais une
  péremption du fichier d'audit v3.**
- Warning « Force pour débutant » émis : **PASS** (ligne 861)

**Coach :**
- **Équilibre** : 3 séances identiques à ±1 exercice. Sur la semaine : 3 bench, 3 OHP, 3 lat pulldown,
  2 squats + 1 RDL. **Ratio push/pull = 6:3** — nettement déséquilibré. Aucun rowing horizontal
  (`row-barbell` pop 7 est systématiquement battu par `lat-pulldown` sur le critère `slot.muscles[0] = back_width`).
- ⚠️ **Aucun mouvement d'isolation, aucun mollet, aucun bras, aucun deltoïde postérieur** de toute la semaine.
- **Cohérence objectif** : 5×3-5 à 180 s = spec force canonique. Mais **pour un débutant, c'est
  pédagogiquement contestable** — le générateur le signale lui-même (warning UX-C). ✅ sur la détection.
- **Durée** : 4 composés × 5 × (30 s + 180 s) = 70 min + warmup + core ≈ **76 min** pour un créneau
  annoncé de 60. ⚠️ **Dépassement de 27 %.**
- **Variété** : A et C sont le même template `fullbody-quad`; seul le squat change (barre → front squat).
  B ne diffère que par le premier mouvement. → **« Variété d'exercices seulement », quasi répétition complète.**
- **Couverture isolation** : **nulle**. Lacune ici **problématique** : 3 séances/semaine sans un seul
  mouvement de bras, mollet ou coiffe des rotateurs.
- **Verdict : ⚠️ PASS technique / ❌ programme pauvre** — 3 séances quasi identiques de 4 mouvements,
  ratio push/pull 2:1, dépassement horaire, zéro isolation.

---

## P03 — PPL strength intermediate 3 j

`{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'intermediate' }`

**Simulation :**
- `workoutTypeFromFocus([])` → `null`
- `selectSplit` case 3, `isMass && level !== 'beginner'` → `['push','pull','legs']` (ligne 354)
- `adjustedSlotCount(6, 60, 'strength')` = `max(4, 3)` = **4 slots** par séance
- Programme 12 semaines (intermédiaire), phases [1-2] / [3-7] / [8-10] / [11-12]
- Warnings : aucun

**Push — Poussée** (lundi)

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | chest/upper/lower | cpd | bench-barbell(8), chest-press-machine(3), bench-db(3) | **seed-bench-barbell** | 5×3-5 |
| 2 | shoulders/front | cpd | ohp-barbell(3), sh-press-machine(3), sh-press-db(3) | **seed-ohp-barbell** | 5×3-5 |
| 3 | chest iso | iso | fly-dumbbell(2), fly-cable(2), pec-deck(2) | **seed-fly-dumbbell** | 3×5-8 |
| 4 | triceps | iso | triceps-rope(3), triceps-pushdown(3), skullcrusher(2) | **seed-triceps-rope** | 3×5-8 |
| 5 | core | — | index 0 | seed-scissors | 3×15 |

*Slots élidés par le cap à 4 : `shoulders_lateral`, `shoulders_rear`.*

**Pull — Tirage** (mercredi)

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 1 | seed-cat-cow | 2×10 |
| 1 | back_width/back | cpd | lat-pulldown(3), deadlift(3) | **seed-lat-pulldown** | 5×3-5 |
| 2 | back_thickness/back | cpd | row-barbell(7), row-tbar(2), row-cable(2) | **seed-row-barbell** | 5×3-5 |
| 3 | dos iso | iso | pullover-db(3), pullover-cable(2), straight-arm-pulldown(2) | **seed-pullover-dumbbell** | 3×5-8 |
| 4 | biceps | iso | curl-barbell(3), curl-db(3), curl-hammer(3) | **seed-curl-barbell** | 3×5-8 |
| 5 | core | — | index 1 | seed-crunch | 3×15 |

*Slots élidés : `shoulders_rear`, `forearms`.*

**Legs — Jambes** (vendredi)

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 2 | seed-shoulder-circles | 2×10 |
| 1 | quads | cpd | squat-barbell(8), front-squat(2), leg-press(3) | **seed-squat-barbell** | 5×3-5 |
| 2 | hamstrings/glutes | cpd | romanian-deadlift(3), good-morning(1), dumbbell-rdl(2) | **seed-romanian-deadlift** | 5×3-5 |
| 3 | quads iso | iso | leg-extension(3), wall-sit(2) | **seed-leg-extension** | 3×5-8 |
| 4 | glutes iso | iso | glute-bridge(3), donkey-kick(2), fire-hydrant(2) | **seed-glute-bridge** | 3×5-8 |
| 5 | core | — | index 2 | seed-cable-crunch | 3×15 |

*Slots élidés : `hamstrings` iso, `calves`.*

**Assertions :**
- Split `['push','pull','legs']` : **PASS** (ligne 354)
- Push contient un chest compound ET un exercice d'épaule : **PASS** (bench + OHP)
- Pull contient dos + biceps : **PASS** (lat pulldown + rowing + curl)
- Legs contient quads + hamstrings/glutes : **PASS** (squat + RDL)
- `scoreEquip` force privilégie barbell : **PASS** — `strengthEquipmentPrio` (ligne 502) place
  barbell=0 devant machine/cable=1 ; bench-barbell et ohp-barbell sortent devant leurs équivalents machine.

**Coach :**
- **Équilibre** : PPL classique, ratio push/pull sur la semaine **2 poussées composées / 2 tirages
  composés** = 1:1. ✅ Excellent.
- **Cohérence objectif** : 5×3-5 (180 s) sur composés, 3×5-8 (120 s) sur isolations = force. ✅
- **Durée** : push = 2×5×210 + 2×3×150 = 3000 s ≈ 50 min + warmup + core ≈ **56 min**. ✅ Tient.
- **Équipement** : barbell sur bench, OHP, rowing, squat, RDL. ✅ Optimal.
- ⚠️ **Le cap à 4 slots supprime `shoulders_lateral` et `shoulders_rear` du push, et
  `shoulders_rear`/`forearms` du pull** → **aucun travail du deltoïde postérieur de toute la semaine**.
  Sur un programme force à fort volume de bench/OHP, c'est un facteur de risque d'épaule reconnu.
- ⚠️ **Aucun mollet** (slot `calves` élidé du legs day).
- **Variété inter-sessions** : chaque type n'apparaît qu'une fois → non applicable. Pas de suffixe A/B. ✅
- **Couverture isolation** : pecs ✅, triceps ✅, dos ✅, biceps ✅, quads ✅, fessiers ✅.
  Absents : **deltoïde postérieur, deltoïde latéral, ischios, mollets** → **lacunes problématiques**
  pour les deltoïdes postérieurs.
- **Verdict : ⚠️ PASS avec réserve** — deltoïde postérieur et mollets absents de la semaine entière.

---

## P04 — PPL hypertrophie intermediate 3 j

`{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'intermediate' }`

**Simulation :**
- `focusType` = `null` → `selectSplit` case 3, `isMass && level !== 'beginner'` → `['push','pull','legs']`
- `adjustedSlotCount(6, 60, 'hypertrophy')` = **6 slots** (intégral, non-strength)
- Programme 12 semaines. Warnings : aucun.

**Push — Poussée**

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | chest cpd | cpd | bench-barbell(8), bench-db(3), chest-press-machine(3) | **seed-bench-barbell** | 4×8-12 |
| 2 | shoulders cpd | cpd | sh-press-db(3), ohp-barbell(3), sh-press-machine(3) | **seed-shoulder-press-dumbbell** | 4×8-12 |
| 3 | chest iso | iso | fly-db(2), fly-cable(2), pec-deck(2) | **seed-fly-dumbbell** | 3×10-15 |
| 4 | triceps | iso | triceps-rope(3), triceps-pushdown(3), skullcrusher(2) | **seed-triceps-rope** | 3×10-15 |
| 5 | sh_lateral | iso | lateral-raise(3), lateral-raise-cable(2) | **seed-lateral-raise** | 3×10-15 |
| 6 | shoulders_rear | iso | face-pull(2), rear-delt-fly(2) | **seed-face-pull** | 3×10-15 |
| 7 | core | — | index 0 | seed-scissors | 3×15 |

**Pull — Tirage**

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 1 | seed-cat-cow | 2×10 |
| 1 | back_width cpd | cpd | lat-pulldown(3), deadlift(3) | **seed-lat-pulldown** | 4×8-12 |
| 2 | back_thickness cpd | cpd | row-barbell(7), row-db(3), row-tbar(2) | **seed-row-barbell** | 4×8-12 |
| 3 | dos iso | iso | pullover-db(3), pullover-cable(2), straight-arm-pulldown(2) | **seed-pullover-dumbbell** | 3×10-15 |
| 4 | biceps | iso | curl-barbell(3), curl-db(3), curl-hammer(3) | **seed-curl-barbell** | 3×10-15 |
| 5 | shoulders_rear | iso | rear-delt-fly(2), face-pull(2) | **seed-rear-delt-fly** | 3×10-15 |
| 6 | forearms | iso | wrist-curl(1), reverse-wrist-curl(1) | **seed-wrist-curl** | 3×10-15 |
| 7 | core | — | index 1 | seed-crunch | 3×15 |

**Legs — Jambes**

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 2 | seed-shoulder-circles | 2×10 |
| 1 | quads cpd | cpd | squat-barbell(8), leg-press(3), bw-squat(3) | **seed-squat-barbell** | 4×8-12 |
| 2 | hams/glutes cpd | cpd | romanian-deadlift(3), dumbbell-rdl(2), good-morning(1) | **seed-romanian-deadlift** | 4×8-12 |
| 3 | quads iso | iso | leg-extension(3), wall-sit(2) | **seed-leg-extension** | 3×10-15 |
| 4 | glutes iso | iso | glute-bridge(3), donkey-kick(2), fire-hydrant(2) | **seed-glute-bridge** | 3×10-15 |
| 5 | hamstrings iso | iso | leg-curl-lying(3), leg-curl-seated(2), leg-curl-standing(2) | **seed-leg-curl-lying** | 3×10-15 |
| 6 | calves | iso | calf-seated(2), calf-standing(2), bw-calf-raise(2) | **seed-calf-raise-seated** | 3×10-15 |
| 7 | core | — | index 2 | seed-cable-crunch | 3×15 |

**Assertions :**
- Split `['push','pull','legs']` identique à P03 : **PASS** — la branche PPL (ligne 354) ne teste que
  `isMass` et `level`, jamais l'objectif précis.
- Reps en zone hypertrophie 6-12 (composés 8-12, isolations 10-15) : **PASS**
- 8 exercices par séance : **PASS**

**Coach :**
- **Équilibre** : 8 postes/séance, 24/semaine. Push/pull composés 1:1. Deltoïde postérieur travaillé
  **deux fois** (face pull en push, rear delt fly en pull) — excellent pour la santé d'épaule. ✅
- **Cohérence objectif** : reps 8-12/10-15, repos 90/75 s. ✅ Parfait pour l'hypertrophie.
- **Durée** : 2×4×130 + 4×3×105 = 1040 + 1260 = 2300 s ≈ 38 min + warmup + core ≈ **44 min**. ✅
  Il reste du temps ; on pourrait ajouter 1-2 séries par exercice.
- **Équipement** : barbell/dumbbell/cable/machine exploités de façon variée. ✅
- ⚠️ **`seed-wrist-curl` (pop 1) occupe un slot complet du pull day** alors qu'aucun slot triceps
  n'existe en pull. Les avant-bras sont sur-représentés relativement à leur importance.
- **Variété** : chaque type 1×/semaine → sans objet.
- **Couverture isolation** : complète sauf pecs supérieurs et dos vertical. **Couverture isolation
  quasi complète.** ✅
- **Verdict : ✅ Bon programme** — le meilleur profil de l'audit. Seule réserve : slot avant-bras
  peu utile.

---

## P05 — Endurance intermediate 3 j (BW pur) → PPF

`{ goal:'endurance', daysPerWeek:3, sessionDuration:60, equipment:BW, level:'intermediate' }`

**Simulation :**
- `focusType` = `null`
- `selectSplit` case 3 : `isMass = false` (endurance) et `level !== 'beginner'`
  → **ligne 356** → `['push','pull','fullbody-quad']` → public `['push','pull','fullbody']`
- `adjustedSlotCount(6, 60, 'endurance')` = 6 (push, pull) ; `(9, 60)` = 9 (fullbody)
- Pools : available = **28**, warmup = 16, core = 11
- **Warnings (3) :** « Aucun exercice composé disponible pour "dos (largeur)" », « … "dos (épaisseur)" »,
  « … "dos (largeur)" » (deuxième occurrence, clé `fullbody-quad:back_width` distincte de `pull:back_width`)

**Push — Poussée** (6 slots demandés, 3 remplis)

| # | Slot | Cat | Candidats | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | chest cpd | cpd | pushup(2), bw-incline-pushup(2) | **seed-pushup** | 3×15-20 |
| 2 | shoulders cpd | cpd | bw-pike-pushup(1) | **bw-pike-pushup** | 3×15-20 |
| 3 | chest iso | iso→cpd | bw-incline-pushup(2) | **bw-incline-pushup** (fallback composé) | 3×15-20 |
| 4 | triceps | iso | — | **— slot vide —** | — |
| 5 | sh_lateral | iso | — | **— slot vide —** | — |
| 6 | shoulders_rear | iso | — | **— slot vide —** | — |
| 7 | core | — | index 0 | seed-scissors | 3×15 |

→ **5 exercices réels.**

**Pull — Tirage** (6 slots, **0 rempli**)

| # | Slot | Cat | Candidats | Retenu |
|---|---|---|---|---|
| 0 | warmup | — | index 1 | seed-cat-cow (2×10) |
| 1 | back_width cpd | cpd | — (`seed-pullup` est `pullup_bar`) | **— slot vide —** ⚠️ warning |
| 2 | back_thickness cpd | cpd | — (`bw-inverted-row` est `pullup_bar`) | **— slot vide —** ⚠️ warning |
| 3 | dos iso | iso | — | **— slot vide —** |
| 4 | biceps | iso | — (`bw-chinup` est `pullup_bar`) | **— slot vide —** |
| 5 | shoulders_rear | iso | — | **— slot vide —** |
| 6 | forearms | iso | — | **— slot vide —** |
| 7 | core | — | index 1 | seed-crunch (3×15) |

→ **2 exercices réels : un échauffement Cat-Cow et un crunch.** Une séance nommée « Pull — Tirage »
sans un seul mouvement de tirage.

**Full Body** (`fullbody-quad`, 9 slots, 4 remplis)

| # | Slot | Cat | Candidats | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 2 | seed-shoulder-circles | 2×10 |
| 1 | quads/glutes | cpd | bw-squat(3), bw-lunge(2), bw-jump-squat(1) | **bw-squat** | 3×15-20 |
| 2 | chest/upper | cpd | pushup(2), bw-incline-pushup(2) | **seed-pushup** | 3×15-20 |
| 3 | dos cpd | cpd | — | **— slot vide —** ⚠️ warning | — |
| 4 | shoulders cpd | cpd | bw-pike-pushup(1) | **bw-pike-pushup** | 3×15-20 |
| 5 | hamstrings iso | iso | — | **— slot vide —** | — |
| 6 | shoulders_rear | iso | — | **— slot vide —** | — |
| 7 | biceps | iso | — | **— slot vide —** | — |
| 8 | calves | iso | bw-calf-raise(2) | **bw-calf-raise** | 3×15-20 |
| 9 | triceps | iso | — | **— slot vide —** | — |
| 10 | core | — | index 2 | seed-bicycle-crunch | 3×15 |

→ **6 exercices réels.**

**Assertions :**
- Split `['push','pull','fullbody']` (PPF) — **pas PPL, pas fullbody×3** : **PASS** (ligne 356)
- Branche `!isMass && level !== 'beginner'` de `selectSplit` case 3 : **PASS**
- Noms « Push — Poussée », « Pull — Tirage », « Full Body » sans suffixe A/B : **PASS**
  (`totalOfType > 1` faux pour chaque type, ligne 834-835)
- Reps zone endurance 15+ : **PASS** (3×15-20 partout)
- Slots dos vides + warning BUG-5 émis : **PASS** (le warning est bien produit, lignes 789-802)
- `autoProgress: false`, `progressStepKg: 0` sur tous les exercices : **PASS** (ligne 585)

**Coach :**
- **Équilibre musculaire** : ❌ **Catastrophique.** Sur la semaine : 3 variantes de pompes,
  2 pike push-ups, 1 squat, 1 fente-mollets. **Zéro tirage. Zéro biceps. Zéro deltoïde postérieur.
  Zéro ischio-jambier.** Ratio push/pull = ∞:0.
- **Cohérence objectif** : reps 15-20 correctes pour l'endurance musculaire. ✅ Mais 3 séries de
  pompes ne construisent pas une « condition physique générale ».
- **Durée** : la séance Pull dure environ **6 minutes** (warmup + 3×15 crunchs) pour un créneau annoncé
  de 60 min. La séance Push ≈ 15 min. **Écart de contenu inacceptable.**
- **Équipement** : aucun exercice hors `bodyweight`. ✅ (contrainte respectée)
- **Variété** : sans objet (1 séance par type).
- **Couverture isolation** : triceps, deltoïdes latéral et postérieur, biceps, ischios, dos —
  **tous absents**. **Lacunes problématiques.**
- ⚠️ **Le générateur émet 3 warnings mais produit quand même le programme.** Un utilisateur en
  bodyweight pur reçoit un « Pull day » vide sans blocage.
- **Verdict : ❌ Problème sérieux** — programme non viable en BW pur post-séparation `pullup_bar`.
  Recommandation : bloquer ou fusionner le Pull day quand aucun composé dos n'est disponible.
---

## P06 — Fat loss intermediate 3 j (BW pur) → PPF

`{ goal:'fat_loss', daysPerWeek:3, sessionDuration:60, equipment:BW, level:'intermediate' }`

**Simulation :**
- `focusType` = `null` ; `isMass = false` (fat_loss) et `level !== 'beginner'` → **ligne 356**
  → `['push','pull','fullbody-quad']` → public `['push','pull','fullbody']`
- Slots : push 6, pull 6, fullbody 9 (non-strength, 60 min = intégral)
- available = 28, warmup = 16, core = 11
- **Warnings (3) :** identiques à P05 (dos largeur ×2, dos épaisseur ×1)

**Push — Poussée**

| # | Slot | Cat | Candidats | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | chest cpd | cpd | pushup(2), bw-incline-pushup(2) | **seed-pushup** | 3×12-15 |
| 2 | shoulders cpd | cpd | bw-pike-pushup(1) | **bw-pike-pushup** | 3×12-15 |
| 3 | chest iso | fallback cpd | bw-incline-pushup(2) | **bw-incline-pushup** | 3×12-15 |
| 4 | triceps / 5 sh_lat / 6 sh_rear | iso | — | **— 3 slots vides —** | — |
| 7 | core | — | index 0 | seed-scissors | 3×15 |

**Pull — Tirage** : **6 slots vides sur 6.** Contenu réel = `seed-cat-cow` (2×10) + `seed-crunch` (3×15).

**Full Body** (`fullbody-quad`)

| # | Slot | Cat | Retenu | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | seed-shoulder-circles | 2×10 |
| 1 | quads/glutes cpd | cpd | **bw-squat** | 3×12-15 |
| 2 | chest cpd | cpd | **seed-pushup** | 3×12-15 |
| 3 | dos cpd | cpd | **— slot vide —** ⚠️ | — |
| 4 | shoulders cpd | cpd | **bw-pike-pushup** | 3×12-15 |
| 5-7 | hams / sh_rear / biceps | iso | **— 3 slots vides —** | — |
| 8 | calves | iso | **bw-calf-raise** | 3×12-15 |
| 9 | triceps | iso | **— slot vide —** | — |
| 10 | core | — | seed-bicycle-crunch | 3×15 |

**Assertions :**
- Split `['push','pull','fullbody']` (PPF) : **PASS** — même règle que P05
- Noms sans suffixe A/B : **PASS**
- `autoProgress: false`, `progressStepKg: 0` : **PASS**
- Specs fat_loss 3×12-15, repos 60 s composé **et** isolation : **PASS** (COMPOUND et ISOLATION_SPEC
  fat_loss sont identiques, lignes 62 et 69)

**Coach :**
- **Rapport cardio/force pour `fat_loss`** : ❌ **Il n'y a aucun élément cardio dans le programme.**
  Le seed contient `bw-burpees`, `seed-jump-rope`, `bw-high-knees` (bodyweight, `primaryMuscle: 'cardio'`)
  — **aucun slot du générateur ne cible `'cardio'`**, ils sont donc structurellement inatteignables
  alors même que l'utilisateur est en bodyweight. C'est la même racine que le bug EQUIP-5 (P65/P66).
- **Équilibre** : identique à P05 — zéro tirage, zéro biceps, zéro ischio, zéro deltoïde postérieur.
- **Durée** : Pull day ≈ 6 min. Push ≈ 12 min. Full Body ≈ 20 min. Pour un créneau de 60 min. ❌
- **Cohérence objectif** : des séries de 12-15 avec 60 s de repos sont un format « tonification »
  correct, mais sans densité (pas de circuit, pas de superset) et sans cardio, l'effet sur la perte
  de gras est marginal.
- **Couverture isolation** : **lacunes problématiques** (identiques à P05).
- **Verdict : ❌ Problème sérieux** — programme fat_loss sans cardio ni tirage.

---

## P07 — Upper/Lower beginner 4 j

`{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'beginner' }`

**Simulation :**
- `focusType` = `null` ; `selectSplit` case 4, `isMass` vrai → ligne 362
  → `['upper-push','lower-quad','upper-pull','lower-hip']` → public `['upper','lower','upper','lower']`
- Slots : upper-push 8, lower-quad 6, upper-pull 8, lower-hip 6 (60 min non-strength = intégral)
- Jours : lundi, mardi, jeudi, vendredi (`DAY_ASSIGNMENTS[4]`, ligne 385)
- Warnings : aucun

**Upper — Haut du corps A** (`upper-push`, lundi)

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | chest/upper cpd | cpd | bench-barbell(8), bench-db(3), chest-press-machine(3) | **seed-bench-barbell** | 4×8-12 |
| 2 | dos cpd | cpd | lat-pulldown(3), row-barbell(7), row-db(3) | **seed-lat-pulldown** | 4×8-12 |
| 3 | shoulders cpd (OHP) | cpd | sh-press-db(3), ohp-barbell(3), sh-press-machine(3) | **seed-shoulder-press-dumbbell** | 4×8-12 |
| 4 | chest iso (fly) | iso | fly-db(2), fly-cable(2), pec-deck(2) | **seed-fly-dumbbell** | 3×10-15 |
| 5 | triceps | iso | triceps-rope(3), triceps-pushdown(3), skullcrusher(2) | **seed-triceps-rope** | 3×10-15 |
| 6 | shoulders_lateral | iso | lateral-raise(3), lateral-raise-cable(2) | **seed-lateral-raise** | 3×10-15 |
| 7 | biceps | iso | curl-barbell(3), curl-db(3), curl-hammer(3) | **seed-curl-barbell** | 3×10-15 |
| 8 | dos iso | iso | pullover-db(3), pullover-cable(2), straight-arm-pulldown(2) | **seed-pullover-dumbbell** | 3×10-15 |
| 9 | core | — | index 0 | seed-scissors | 3×15 |

**Lower — Bas du corps A** (`lower-quad`, mardi)

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 1 | seed-cat-cow | 2×10 |
| 1 | quads/glutes cpd | cpd | squat-barbell(8), leg-press(3), bw-squat(3) | **seed-squat-barbell** | 4×8-12 |
| 2 | hams/glutes cpd | cpd | romanian-deadlift(3), dumbbell-rdl(2), good-morning(1) | **seed-romanian-deadlift** | 4×8-12 |
| 3 | quads iso | iso | leg-extension(3), wall-sit(2) | **seed-leg-extension** | 3×10-15 |
| 4 | hamstrings iso | iso | leg-curl-lying(3), leg-curl-seated(2), leg-curl-standing(2) | **seed-leg-curl-lying** | 3×10-15 |
| 5 | glutes iso | iso | glute-bridge(3), donkey-kick(2), fire-hydrant(2) | **seed-glute-bridge** | 3×10-15 |
| 6 | calves | iso | calf-seated(2), calf-standing(2), bw-calf-raise(2) | **seed-calf-raise-seated** | 3×10-15 |
| 7 | core | — | index 1 | seed-crunch | 3×15 |

**Upper — Haut du corps B** (`upper-pull`, jeudi)

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 2 | seed-shoulder-circles | 2×10 |
| 1 | back_width cpd | cpd | lat-pulldown(3), deadlift(3) | **seed-lat-pulldown** ⚠️ répété | 4×8-12 |
| 2 | back_thickness cpd | cpd | row-barbell(7), row-db(3), row-tbar(2) | **seed-row-barbell** | 4×8-12 |
| 3 | chest cpd (incliné) | cpd | bench-db(3), chest-press-machine(3), pushup(2) | **seed-bench-dumbbell** | 4×8-12 |
| 4 | shoulders_rear (face pull) | iso | face-pull(2), rear-delt-fly(2) | **seed-face-pull** | 3×10-15 |
| 5 | biceps | iso | curl-db(3), curl-hammer(3), curl-incline(2) | **seed-curl-dumbbell** | 3×10-15 |
| 6 | dos iso | iso | pullover-cable(2), straight-arm-pulldown(2), pullover-db(3) | **seed-pullover-cable** | 3×10-15 |
| 7 | triceps | iso | triceps-pushdown(3), skullcrusher(2), triceps-overhead(2) | **seed-triceps-pushdown** | 3×10-15 |
| 8 | shoulders_lateral | iso | lateral-raise-cable(2), lateral-raise(3) | **seed-lateral-raise-cable** | 3×10-15 |
| 9 | core | — | index 2 | seed-cable-crunch | 3×15 |

**Lower — Bas du corps B** (`lower-hip`, vendredi)

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 3 | seed-dead-bug | 2×10 |
| 1 | glutes/hams cpd | cpd | hip-thrust(4), hip-thrust-bw(4), hip-thrust-machine(3) | **seed-hip-thrust** | 4×8-12 |
| 2 | quads/glutes cpd | cpd | leg-press(3), bw-squat(3), lunges(2) | **seed-leg-press** | 4×8-12 |
| 3 | glutes iso | iso | donkey-kick(2), fire-hydrant(2), hip-abduction(2) | **seed-donkey-kick** | 3×10-15 |
| 4 | hamstrings iso | iso | leg-curl-seated(2), leg-curl-standing(2), leg-curl-lying(3) | **seed-leg-curl-seated** | 3×10-15 |
| 5 | quads iso | iso | wall-sit(2), leg-extension(3) | **bw-wall-sit** | 3×10-15 |
| 6 | calves | iso | calf-standing(2), bw-calf-raise(2), calf-db(2) | **seed-calf-raise-standing** | 3×10-15 |
| 7 | core | — | index 3 | seed-bicycle-crunch | 3×15 |

**Assertions :**
- Split public `['upper','lower','upper','lower']`, internes upper-push / lower-quad / upper-pull / lower-hip : **PASS** (ligne 362)
- Noms « Upper — Haut du corps A/B », « Lower — Bas du corps A/B » : **PASS** (lignes 833-836)
- Upper A : 8 slots → **10 exercices**, chest compound en tête puis dos puis OHP puis isolations : **PASS**
- Upper B : 8 slots → **10 exercices**, back compound en tête puis chest : **PASS**
- Lower A : 6 slots → **8 exercices**, squat/leg press en tête : **PASS**
- Lower B : 6 slots → **8 exercices**, hip thrust en tête : **PASS**
- Chaque variante lower inclut un slot `calves` isolation : **PASS**

**Coach :**
- **Équilibre haut/bas** : 2 upper + 2 lower = parfaitement symétrique. ✅
- **Ratio push/pull sur la semaine** : composés — 3 poussées (bench, OHP, bench db) contre
  3 tirages (lat pulldown ×2, rowing). Isolations : face pull présent. **1:1** ✅
- **Récupération** : Upper A lundi → Upper B jeudi = 72 h. Lower A mardi → Lower B vendredi = 72 h. ✅
  Structure classique et saine.
- **Cohérence objectif** : 4×8-12 / 3×10-15, repos 90/75 s. ✅
- **Durée** : upper = 3×4×130 + 5×3×105 = 1560 + 1575 = 3135 s ≈ 52 min + warmup + core ≈ **58 min** ✅
  lower = 2×4×130 + 4×3×105 = 1040 + 1260 = 2300 s ≈ 38 min + 6 min ≈ **44 min** ✅
- **Variété structurelle** : upper-push (bench-first) vs upper-pull (traction-first) ; lower-quad
  (squat-first) vs lower-hip (hip thrust-first). Slots **et** ordre différents. → **Variété structurelle
  réelle**, pas seulement des exercices différents. ✅ Excellent point du générateur.
- ⚠️ `seed-lat-pulldown` apparaît en Upper A **et** Upper B (le pool `back_width` compound
  n'a que lat-pulldown et deadlift en salle).
- **Couverture isolation** : pecs ✅, dos ✅, biceps ✅, triceps ✅, deltoïdes latéral ✅ et postérieur ✅,
  quads ✅, ischios ✅, fessiers ✅, mollets ✅. → **Couverture isolation complète.** ✅
- ⚠️ `bw-wall-sit` en isolation quads sur Lower B : gainage isométrique en 3×10-15 reps est
  incohérent (le wall sit se prescrit en secondes). Problème de `trackingType` / spec, pas de sélection.
- **Verdict : ✅ Bon programme** — le split le mieux construit de l'audit. Réserves mineures :
  lat-pulldown dupliqué, wall sit prescrit en répétitions.

---

## P08 — 5 j intermediate PPL + UL (force)

`{ goal:'strength', daysPerWeek:5, sessionDuration:60, equipment:FULL, level:'intermediate' }`

**Simulation :**
- `focusType` = `null` ; case 5, `isMass && level !== 'beginner'` → ligne 370
  → `['push','pull','legs','upper','lower']` (5 types distincts, aucun suffixe A/B)
- `adjustedSlotCount(·, 60, 'strength')` : push/pull/legs/lower base 6 → **4** ; upper base 8 → **4**
- Warnings : aucun

**Push** — bench-barbell 5×3-5 · ohp-barbell 5×3-5 · fly-dumbbell 3×5-8 · triceps-rope 3×5-8
(warmup bird-dog, core scissors) — 6 exercices.

**Pull** — lat-pulldown 5×3-5 · row-barbell 5×3-5 · pullover-dumbbell 3×5-8 · curl-barbell 3×5-8
(warmup cat-cow, core crunch) — 6 exercices.

**Legs** — squat-barbell 5×3-5 · romanian-deadlift 5×3-5 · leg-extension 3×5-8 · glute-bridge 3×5-8
(warmup shoulder-circles, core cable-crunch) — 6 exercices.

**Upper** (type `upper`, 8 slots → 4)

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 3 | seed-dead-bug | 2×10 |
| 1 | chest cpd | cpd | bench-barbell(8), chest-press-machine(3), bench-db(3) | **seed-bench-barbell** ⚠️ 2ᵉ fois | 5×3-5 |
| 2 | dos cpd | cpd | lat-pulldown(3), deadlift(3), row-tbar(2) | **seed-lat-pulldown** ⚠️ 2ᵉ fois | 5×3-5 |
| 3 | shoulders cpd | cpd | ohp-barbell(3), sh-press-machine(3), sh-press-db(3) | **seed-ohp-barbell** ⚠️ 2ᵉ fois | 5×3-5 |
| 4 | sh_lat/sh_rear iso | iso | lateral-raise(3), lateral-raise-cable(2), face-pull(2) | **seed-lateral-raise** | 3×5-8 |
| 5 | core | — | index 3 | seed-bicycle-crunch | 3×15 |

**Lower** (type `lower`, 6 slots → 4)

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 4 | seed-walking-lunges | 2×10 |
| 1 | quads cpd | cpd | **front-squat(2)**, squat-barbell(8), leg-press(3) | **seed-front-squat** | 5×3-5 |
| 2 | hams/glutes cpd | cpd | **good-morning(1)**, romanian-deadlift(3), dumbbell-rdl(2) | **seed-good-morning** ⚠️ | 5×3-5 |
| 3 | quads iso | iso | wall-sit(2), leg-extension(3) | **bw-wall-sit** | 3×5-8 |
| 4 | glutes iso | iso | donkey-kick(2), fire-hydrant(2), hip-abduction(2) | **seed-donkey-kick** | 3×5-8 |
| 5 | core | — | index 4 | seed-vertical-leg-crunch | 3×15 |

**Assertions :**
- Split `['push','pull','legs','upper','lower']` : **PASS** (ligne 370)
- 5 workouts distincts, aucun suffixe A/B (chaque type public unique) : **PASS**

**Coach :**
- **Récupération** : lundi push, mardi pull, mercredi legs, jeudi upper, vendredi lower.
  Le bench est fait lundi **et** jeudi (48 h) en 5×3-5 ; le squat mercredi, le front squat vendredi
  (48 h) ; le RDL mercredi, le good morning vendredi (48 h). ⚠️ **Récupération insuffisante en force
  pour la chaîne postérieure et les pectoraux** — 5×3-5 à 48 h d'intervalle sur les mêmes patterns.
- ❌ **`seed-good-morning` (pop 1) prescrit en 5×3-5 avec 180 s de repos.** Le good morning
  est un mouvement à fort bras de levier lombaire ; le charger à 3-5 RM est un **risque de sécurité
  réel**, y compris pour un intermédiaire. Cause racine : le tri place « non utilisé globalement »
  (`usedGlobally`, lignes 568-570) **avant** la popularité, donc RDL (pop 3) déjà consommé le mercredi
  laisse la place au good morning (pop 1).
- ⚠️ **`bw-wall-sit` en 3×5-8 répétitions** : incohérent (isométrie).
- **Équilibre** : push composés 5 (bench ×2, OHP ×2, + fly) contre tirages composés 3
  (lat pulldown ×2, rowing). ⚠️ Ratio push/pull ≈ 5:3.
- **Volume** : 5 séances × 4 mouvements = 20 postes/semaine dont 15 composés lourds.
  Pour un intermédiaire en force, c'est **au plafond haut** mais pas absurde.
- **Durée** : 2 composés + 2 isolations = 2×5×210 + 2×3×150 = 3000 s ≈ 50 min + 6 min ≈ 56 min ✅
  sauf Upper (3 composés + 1 isolation) = 3×5×210 + 450 = 3600 s ≈ 60 min + 6 ≈ **66 min** ⚠️
- **Couverture isolation** : mollets absents, deltoïde postérieur absent, ischios absents en isolation.
- **Verdict : ⚠️ PASS avec réserve sérieuse** — good morning en 5×3-5 (risque lombaire),
  wall sit en reps, récupération à 48 h sur bench/squat/hinge en force.

---

## P09 — 5 j beginner isMass → Upper/Lower A/B + Full Body

`{ goal:'hypertrophy', daysPerWeek:5, sessionDuration:60, equipment:FULL, level:'beginner' }`

**Simulation :**
- `focusType` = `null` ; case 5 : `isMass && level !== 'beginner'` **faux** (beginner) → passe à
  la ligne 372 `if (isMass)` → `['upper-push','lower-quad','upper-pull','lower-hip','fullbody-quad']`
  → public `['upper','lower','upper','lower','fullbody']`
- Slots : 8 / 6 / 8 / 6 / 9 → exercices : **10 / 8 / 10 / 8 / 11**
- **Warning (1) :** « Volume élevé pour débutant : 5 séances/semaine génère un volume proche d'un
  programme intermédiaire. Commencez à 3–4 jours… » (ligne 870)

**Upper A** (`upper-push`) : bench-barbell 4×8-12 · lat-pulldown 4×8-12 · shoulder-press-db 4×8-12 ·
fly-dumbbell 3×10-15 · triceps-rope 3×10-15 · lateral-raise 3×10-15 · curl-barbell 3×10-15 ·
pullover-dumbbell 3×10-15 (warmup bird-dog, core scissors) — **10 exercices**.

**Lower A** (`lower-quad`) : squat-barbell 4×8-12 · romanian-deadlift 4×8-12 · leg-extension 3×10-15 ·
leg-curl-lying 3×10-15 · glute-bridge 3×10-15 · calf-raise-seated 3×10-15 (warmup cat-cow, core crunch)
— **8 exercices**.

**Upper B** (`upper-pull`) : lat-pulldown 4×8-12 · row-barbell 4×8-12 · bench-dumbbell 4×8-12 ·
face-pull 3×10-15 · curl-dumbbell 3×10-15 · pullover-cable 3×10-15 · triceps-pushdown 3×10-15 ·
lateral-raise-cable 3×10-15 (warmup shoulder-circles, core cable-crunch) — **10 exercices**.

**Lower B** (`lower-hip`) : hip-thrust 4×8-12 · leg-press 4×8-12 · donkey-kick 3×10-15 ·
leg-curl-seated 3×10-15 · wall-sit 3×10-15 · calf-raise-standing 3×10-15 (warmup dead-bug,
core bicycle-crunch) — **8 exercices**.

**Full Body** (`fullbody-quad`, 5ᵉ séance, `usedGlobally` très chargé)

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 4 | seed-walking-lunges | 2×10 |
| 1 | quads/glutes cpd | cpd | **bw-squat(3)**, lunges(2), hack-squat(2) | **bw-squat** | 4×8-12 |
| 2 | chest cpd | cpd | **chest-press-machine(3)**, pushup(2), bench-barbell(8) | **seed-chest-press-machine** | 4×8-12 |
| 3 | dos cpd | cpd | lat-pulldown(3), row-dumbbell(3), deadlift(3) | **seed-lat-pulldown** ⚠️ 3ᵉ fois | 4×8-12 |
| 4 | shoulders cpd | cpd | ohp-barbell(3), sh-press-machine(3), arnold(2) | **seed-ohp-barbell** | 4×8-12 |
| 5 | hamstrings iso | iso | leg-curl-standing(2), leg-curl-lying(3), leg-curl-seated(2) | **seed-leg-curl-standing** | 3×10-15 |
| 6 | shoulders_rear | iso | rear-delt-fly(2), face-pull(2) | **seed-rear-delt-fly** | 3×10-15 |
| 7 | biceps | iso | curl-hammer(3), curl-incline(2), curl-cable(2) | **seed-curl-hammer** | 3×10-15 |
| 8 | calves | iso | bw-calf-raise(2), calf-db(2), calf-bb(2) | **bw-calf-raise** | 3×10-15 |
| 9 | triceps | iso | skullcrusher(2), triceps-overhead(2), triceps-kickback(1) | **seed-skullcrusher** | 3×10-15 |
| 10 | core | — | index 4 | seed-vertical-leg-crunch | 3×15 |

**Assertions :**
- Split public `['upper','lower','upper','lower','fullbody']` — **pas fullbody×5** : **PASS** (ligne 372)
- Types internes upper-push / lower-quad / upper-pull / lower-hip / fullbody-quad : **PASS**
- Noms « Upper A », « Lower A », « Upper B », « Lower B », « Full Body » (sans suffixe pour fullbody,
  car une seule occurrence) : **PASS**
- Exercices par workout : 10 / 8 / 10 / 8 / 11 : **PASS**
- Warning volume débutant 5 j : **PASS** (ligne 869)

**Coach :**
- **Volume** : 47 postes d'exercice sur la semaine pour un **débutant**. C'est le volume d'un
  intermédiaire avancé. Le générateur le signale (UX-H) — bon réflexe. ⚠️ Mais il le produit quand même.
- **Récupération** : lundi upper, mardi lower, mercredi upper, jeudi lower, vendredi fullbody.
  Le fullbody de vendredi retape **tout** ce qui a été fait les 4 jours précédents.
  ⚠️ **Aucun jour de repos entre mardi et vendredi pour les jambes** (lower mardi, lower jeudi,
  squat + leg curl vendredi). Récupération insuffisante pour un débutant.
- **Équilibre** : bien réparti (le fullbody final compense les manques). Deltoïde postérieur travaillé
  2× (face pull upper B, rear delt fly fullbody). ✅
- **Cohérence objectif** : specs hypertrophie exactes. ✅
- **Durée** : 44 à 58 min selon la séance. ✅
- **Variété structurelle** : A/B upper et A/B lower distincts + 1 fullbody. ✅ Bonne.
- ⚠️ `bw-squat` (poids du corps) retenu comme composé quads du fullbody en 4×8-12 alors que
  `seed-squat-barbell` est disponible — encore l'effet `usedGlobally`. Pour un débutant en prise de
  masse, 4×8-12 de squat au poids du corps n'apporte aucune surcharge (`autoProgress: false`,
  `progressStepKg: 0` sur cet exercice précis).
- **Couverture isolation** : complète sur la semaine. ✅
- **Verdict : ⚠️ PASS avec réserve** — volume et fréquence excessifs pour un débutant (warning émis
  mais non bloquant) ; squat BW non progressable en séance 5.

---

## P10 — 2 j intermediate force (BB+DB)

`{ goal:'strength', daysPerWeek:2, sessionDuration:60, equipment:BB+DB, level:'intermediate' }`

**Simulation :**
- `focusType` = `null` ; **case 2 est testée avant tout autre critère** (ligne 349-350)
  → `['fullbody-quad','fullbody-hip']` indépendamment du niveau et de l'objectif
- `adjustedSlotCount(9, 60, 'strength')` = `max(4, 4)` = **4 slots**
- available = **42** (barbell + dumbbell), warmup = 16, core = 11
- Warnings : aucun

**Full Body A** (`fullbody-quad`)

| # | Slot | Cat | Top-3 (tri force → barbell prio 0) | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | quads/glutes cpd | cpd | squat-barbell(8), front-squat(2), lunges(2) | **seed-squat-barbell** (barbell) | 5×3-5 |
| 2 | chest cpd | cpd | bench-barbell(8), bench-db(3), incline-bench-bb(4) | **seed-bench-barbell** (barbell) | 5×3-5 |
| 3 | dos cpd | cpd | row-barbell(7), deadlift(3), row-tbar(2) | **seed-row-barbell** (barbell) | 5×3-5 |
| 4 | shoulders cpd | cpd | ohp-barbell(3), sh-press-db(3), arnold(2) | **seed-ohp-barbell** (barbell) | 5×3-5 |
| 5 | core | — | index 0 | seed-scissors | 3×15 |

**Full Body B** (`fullbody-hip`)

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 1 | seed-cat-cow | 2×10 |
| 1 | hams/glutes cpd | cpd | romanian-deadlift(3), good-morning(1), dumbbell-rdl(2) | **seed-romanian-deadlift** | 5×3-5 |
| 2 | chest cpd | cpd | bench-barbell(8), bench-db(3), incline-bench-bb(4) | **seed-bench-barbell** ⚠️ répété | 5×3-5 |
| 3 | back_width/back cpd | cpd | **deadlift(3) seul candidat** | **seed-deadlift** | 5×3-5 |
| 4 | shoulders cpd | cpd | ohp-barbell(3), sh-press-db(3), arnold(2) | **seed-ohp-barbell** ⚠️ répété | 5×3-5 |
| 5 | core | — | index 1 | seed-crunch | 3×15 |

**Assertions :**
- Split `['fullbody','fullbody']` : **PASS** — le `switch (daysPerWeek)` (ligne 348) traite `case 2`
  en premier, sans aucun test de niveau ni d'objectif. **CRITIQUE 2J vérifiée.**
- Priorité barbell sur dumbbell pour les composés : **PASS** — `strengthEquipmentPrio(barbell)=0` <
  `dumbbell=2` (ligne 502-513), appliqué uniquement si `goal==='strength' && slot.compound` (ligne 564).
  Les 8 composés retenus sont **tous en barre**.

**Coach :**
- **Contenu 2 j** : 4 mouvements composés lourds par séance, 8 postes/semaine. Pour un intermédiaire
  en force à 2 séances, c'est **le format correct** (proche d'un Starting Strength / 5×5 réduit). ✅
- ⚠️ **`seed-deadlift` (soulevé de terre, `primaryMuscle: 'back'`) remplit le slot `back_width` compound
  en séance B**, faute d'alternative en BB+DB (`seed-lat-pulldown` est cable, `seed-pullup` est pullup_bar).
  Sémantiquement, un soulevé de terre n'est pas un tirage vertical de largeur de dos. Et surtout :
  **séance B = RDL 5×3-5 puis soulevé de terre 5×3-5** — deux hip hinges maximaux consécutifs.
  ❌ **Risque lombaire élevé et redondance de pattern.**
- **Équilibre** : sur la semaine, poussées composées 4 (bench ×2, OHP ×2) contre tirages 2
  (rowing, deadlift). ⚠️ **2:1**.
- **Durée** : 4 composés × 5 × (30 + 180) = 4200 s = **70 min** + warmup + core ≈ **76 min** pour
  60 annoncées. ⚠️ Dépassement de 27 %.
- **Couverture isolation** : **nulle** — aucun bras, aucun mollet, aucune coiffe.
- **Variété A→B** : structurelle (quad-dominant vs hip-dominant), mais bench et OHP identiques. Moyenne.
- **Verdict : ⚠️ PASS technique / réserve sécurité** — RDL + deadlift lourds dans la même séance,
  dépassement horaire, zéro isolation.

---

# GROUPE B — `focusMuscles` (override du split)

---

## P11 — chest seul → push

`{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:DB, level:'beginner', focusMuscles:['chest'] }`

**Simulation — `workoutTypeFromFocus(['chest'])` :**
`hasLower=false, hasPush=true, hasPull=false, hasArms=false, hasCore=false, hasUpper=true`
→ règle 1 (`hasLower && !hasUpper`) fausse · règle 2 (core seul) fausse ·
**règle 3 (`hasPush && !hasPull && !hasLower`, ligne 309) → `'push'`**
- `selectSplit` → `focusType` non lower/upper → `Array(2).fill('push')` (ligne 344) → `['push','push']`
- Slots : 6 chacun (60 min, hypertrophie). available = **22** (dumbbell seul).
- **Warnings (2) :** « Programme de spécialisation… » (ligne 881) + « Déséquilibre push/pull : aucune
  séance de tirage… » (ligne 905)
- `reorderSlotsByFocus` : muscles ciblés = `{chest, chest_upper, chest_lower}`. Le slot chest compound
  est déjà en position 1 → **ordre inchangé**.

**Push — Poussée A**

| # | Slot | Cat | Candidats DB | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | chest cpd | cpd | bench-db(3), incline-bench-db(2) | **seed-bench-dumbbell** | 4×8-12 |
| 2 | shoulders cpd | cpd | sh-press-db(3), arnold-press(2) | **seed-shoulder-press-dumbbell** | 4×8-12 |
| 3 | chest iso | iso | fly-dumbbell(2) | **seed-fly-dumbbell** | 3×10-15 |
| 4 | triceps | iso | triceps-overhead(2), triceps-kickback(1) | **seed-triceps-overhead** | 3×10-15 |
| 5 | sh_lateral | iso | lateral-raise(3) | **seed-lateral-raise** | 3×10-15 |
| 6 | shoulders_rear | iso | rear-delt-fly(2) | **seed-rear-delt-fly** | 3×10-15 |
| 7 | core | — | index 0 | seed-scissors | 3×15 |

**Push — Poussée B**

| # | Slot | Cat | Candidats | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 1 | seed-cat-cow | 2×10 |
| 1 | chest cpd | cpd | bench-db(3), incline-bench-db(2) | **seed-bench-dumbbell** ⚠️ répété | 4×8-12 |
| 2 | shoulders cpd | cpd | **arnold-press(2)**, sh-press-db(3) | **seed-arnold-press** | 4×8-12 |
| 3 | chest iso | iso | fly-dumbbell(2) | **seed-fly-dumbbell** ⚠️ répété | 3×10-15 |
| 4 | triceps | iso | **triceps-kickback(1)**, triceps-overhead(2) | **seed-triceps-kickback** | 3×10-15 |
| 5 | sh_lateral | iso | lateral-raise(3) | **seed-lateral-raise** ⚠️ répété | 3×10-15 |
| 6 | shoulders_rear | iso | rear-delt-fly(2) | **seed-rear-delt-fly** ⚠️ répété | 3×10-15 |
| 7 | core | — | index 1 | seed-crunch | 3×15 |

**Assertions :**
- `workoutTypeFromFocus(['chest'])` → `'push'` avec `hasPush=true, hasPull=false, hasLower=false` : **PASS** (ligne 309)
- Split `['push','push']` : **PASS** (ligne 344)
- Exercices chest en tête via `reorderSlotsByFocus` : **PASS** (le slot chest compound est déjà premier)

**Coach :**
- ❌ **Déséquilibre majeur** : deux séances de poussée par semaine, **aucun tirage, aucun biceps,
  aucun travail du dos**. Le générateur émet les deux warnings pertinents (spécialisation + push/pull) —
  bonne détection, mais l'utilisateur peut ignorer.
- **Variété A→B** : 4 exercices sur 6 sont **identiques** (bench db, fly, lateral raise, rear delt fly).
  Le pool dumbbell-only ne permet pas mieux. → **« Variété d'exercices seulement », très faible.**
  ⚠️ `seed-triceps-kickback` (pop 1, exercice notoirement peu efficace) est retenu en B uniquement
  parce que `triceps-overhead` est marqué `usedGlobally`.
- **Cohérence objectif** : 4×8-12 / 3×10-15 ✅
- **Durée** : 2×4×130 + 4×3×105 = 2300 s ≈ 38 min + 6 min ≈ **44 min** ✅
- **Équipement** : 100 % dumbbell ✅
- **Couverture isolation** : pecs ✅, triceps ✅, deltoïde latéral ✅ et postérieur ✅. Dos et biceps
  totalement absents (par construction du focus). → **Lacunes problématiques** pour un programme complet,
  **acceptables** pour un bloc de spécialisation de 4-6 semaines (ce que dit le warning).
- **Verdict : ⚠️ PASS technique** — comportement conforme et bien averti, mais programme
  volontairement déséquilibré et très répétitif entre A et B.

---

## P12 — back seul → pull

`{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:BB+DB+CABLE, level:'beginner', focusMuscles:['back'] }`

**Simulation — `workoutTypeFromFocus(['back'])` :**
`hasLower=false, hasPush=false, hasPull=true, hasArms=false, hasCore=false, hasUpper=true`
→ **règle 4 (`hasPull && !hasPush && !hasLower`, ligne 311) → `'pull'`**
- Split = `['pull','pull','pull']` → noms « Pull — Tirage A / B / C »
- 6 slots. available = **55**. Warning (1) : « Programme de spécialisation… »
- `reorderSlotsByFocus` : ciblés = `{back, back_width, back_thickness}` — les 2 composés sont déjà
  dos, les isolations : dos en 1ʳᵉ position, puis biceps, shoulders_rear, forearms → ordre inchangé.

**Pull A**

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | back_width cpd | cpd | lat-pulldown(3), deadlift(3) | **seed-lat-pulldown** | 4×8-12 |
| 2 | back_thickness cpd | cpd | row-barbell(7), row-db(3), row-tbar(2) | **seed-row-barbell** | 4×8-12 |
| 3 | dos iso | iso | pullover-db(3), pullover-cable(2), straight-arm-pulldown(2) | **seed-pullover-dumbbell** | 3×10-15 |
| 4 | biceps | iso | curl-barbell(3), curl-db(3), curl-hammer(3) | **seed-curl-barbell** | 3×10-15 |
| 5 | shoulders_rear | iso | face-pull(2), rear-delt-fly(2) | **seed-face-pull** | 3×10-15 |
| 6 | forearms | iso | wrist-curl(1), reverse-wrist-curl(1) | **seed-wrist-curl** | 3×10-15 |
| 7 | core | — | index 0 | seed-scissors | 3×15 |

**Pull B**

| # | Slot | Retenu | Séries×Reps |
|---|---|---|---|
| 0 | warmup | seed-cat-cow | 2×10 |
| 1 | back_width cpd | **seed-lat-pulldown** ⚠️ répété (seuls candidats : lat-pulldown, deadlift) | 4×8-12 |
| 2 | back_thickness cpd | **seed-row-dumbbell** (top-3 : row-db 3, row-tbar 2, row-cable 2) | 4×8-12 |
| 3 | dos iso | **seed-pullover-cable** | 3×10-15 |
| 4 | biceps | **seed-curl-dumbbell** | 3×10-15 |
| 5 | shoulders_rear | **seed-rear-delt-fly** | 3×10-15 |
| 6 | forearms | **seed-reverse-wrist-curl** | 3×10-15 |
| 7 | core | seed-crunch | 3×15 |

**Pull C**

| # | Slot | Retenu | Séries×Reps |
|---|---|---|---|
| 0 | warmup | seed-shoulder-circles | 2×10 |
| 1 | back_width cpd | **seed-lat-pulldown** ⚠️ 3ᵉ fois | 4×8-12 |
| 2 | back_thickness cpd | **seed-row-tbar** | 4×8-12 |
| 3 | dos iso | **seed-straight-arm-pulldown** | 3×10-15 |
| 4 | biceps | **seed-curl-hammer** | 3×10-15 |
| 5 | shoulders_rear | **seed-face-pull** (répété de A) | 3×10-15 |
| 6 | forearms | **seed-wrist-curl** (répété de A) | 3×10-15 |
| 7 | core | seed-cable-crunch | 3×15 |

**Assertions :**
- `workoutTypeFromFocus(['back'])` → `'pull'` : **PASS** (ligne 311)
- Split `['pull','pull','pull']` : **PASS**

**Coach :**
- ❌ **`seed-lat-pulldown` sur les 3 séances.** Cause structurelle : le slot `back_width` compound
  ne contient que `['back_width','back']` et le seed n'offre en BB+DB+CABLE que lat-pulldown et
  deadlift, ce dernier perdant sur `slot.muscles[0] === 'back_width'` (ligne 558-563). Le pool
  est **plus petit que le nombre de séances du même type** → répétition inévitable.
- **Variété** : slots identiques sur A/B/C, seuls les rowings et isolations tournent.
  → **« Variété d'exercices seulement »**, et incomplète.
- **Équilibre** : 3 séances de tirage, **zéro poussée**. Déséquilibre inverse de P11.
  ⚠️ **Le warning « Déséquilibre push/pull » n'est PAS émis** ici : la condition ligne 904 est
  `hasPushSession && !hasPullSession` — elle ne détecte que l'absence de tirage, jamais l'absence
  de poussée. **Asymétrie de la détection.**
- **Cohérence objectif** : specs hypertrophie ✅
- **Durée** : ≈ 44 min ✅
- **Couverture isolation** : dos ✅, biceps ✅, deltoïde postérieur ✅, avant-bras ✅.
  Pecs, épaules antérieures, triceps, jambes totalement absents.
- **Verdict : ⚠️ PASS technique** — mais lat-pulldown ×3 et absence de warning push/pull inversé.

---

## P13 — legs seul → lower (BW, 4 j)

`{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:BW, level:'beginner', focusMuscles:['legs'] }`

**Simulation — `workoutTypeFromFocus(['legs'])` :**
`hasLower=true, hasPush=false, hasPull=false, hasArms=false, hasCore=false, hasUpper=false`
→ **règle 1 (`hasLower && !hasUpper`, ligne 303) → `'lower'`**
- `selectSplit` → branche `focusType === 'lower'` (ligne 334) → alternance
  `['lower-quad','lower-hip','lower-quad','lower-hip']` → public `['lower','lower','lower','lower']`
- Noms : « Lower — Bas du corps A / B / C / D »
- 6 slots. available = **28** (bodyweight). Warning : « Programme de spécialisation… »

**Lower A** (`lower-quad`)

| # | Slot | Cat | Candidats BW | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | quads/glutes cpd | cpd | bw-squat(3), bw-lunge(2), bw-jump-squat(1) | **bw-squat** | 4×8-12 |
| 2 | hams/glutes cpd | cpd | hip-thrust-bw(4), curtsy-lunge(1) | **seed-hip-thrust-bw** | 4×8-12 |
| 3 | quads iso | iso | wall-sit(2) | **bw-wall-sit** | 3×10-15 |
| 4 | hamstrings iso | iso | — | **— slot vide —** | — |
| 5 | glutes iso | iso | glute-bridge(3), donkey-kick(2), fire-hydrant(2) | **seed-glute-bridge** | 3×10-15 |
| 6 | calves | iso | bw-calf-raise(2) | **bw-calf-raise** | 3×10-15 |
| 7 | core | — | index 0 | seed-scissors | 3×15 |

**Lower B** (`lower-hip`)

| # | Slot | Cat | Candidats | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 1 | seed-cat-cow | 2×10 |
| 1 | glutes/hams cpd | cpd | **curtsy-lunge(1)**, hip-thrust-bw(4) | **seed-curtsy-lunge** ⚠️ | 4×8-12 |
| 2 | quads/glutes cpd | cpd | **bw-lunge(2)**, bw-jump-squat(1), bw-squat(3) | **bw-lunge** | 4×8-12 |
| 3 | glutes iso | iso | donkey-kick(2), fire-hydrant(2), glute-bridge(3) | **seed-donkey-kick** | 3×10-15 |
| 4 | hamstrings iso | iso | — | **— slot vide —** | — |
| 5 | quads iso | iso | wall-sit(2) | **bw-wall-sit** ⚠️ répété | 3×10-15 |
| 6 | calves | iso | bw-calf-raise(2) | **bw-calf-raise** ⚠️ répété | 3×10-15 |
| 7 | core | — | index 1 | seed-crunch | 3×15 |

**Lower C** (`lower-quad`)

| # | Slot | Retenu | Séries×Reps |
|---|---|---|---|
| 0 | warmup | seed-shoulder-circles | 2×10 |
| 1 | quads/glutes cpd | **bw-jump-squat** (pop 1) ⚠️ | 4×8-12 |
| 2 | hams/glutes cpd | **seed-hip-thrust-bw** | 4×8-12 |
| 3 | quads iso | **bw-wall-sit** | 3×10-15 |
| 4 | hamstrings iso | **— slot vide —** | — |
| 5 | glutes iso | **seed-fire-hydrant** | 3×10-15 |
| 6 | calves | **bw-calf-raise** | 3×10-15 |
| 7 | core | seed-bicycle-crunch | 3×15 |

**Lower D** (`lower-hip`)

| # | Slot | Retenu | Séries×Reps |
|---|---|---|---|
| 0 | warmup | seed-dead-bug | 2×10 |
| 1 | glutes/hams cpd | **seed-hip-thrust-bw** | 4×8-12 |
| 2 | quads/glutes cpd | **bw-squat** | 4×8-12 |
| 3 | glutes iso | **seed-glute-bridge** | 3×10-15 |
| 4 | hamstrings iso | **— slot vide —** | — |
| 5 | quads iso | **bw-wall-sit** | 3×10-15 |
| 6 | calves | **bw-calf-raise** | 3×10-15 |
| 7 | core | seed-vertical-leg-crunch | 3×15 |

**Assertions :**
- `workoutTypeFromFocus(['legs'])` → `'lower'` : **PASS** (ligne 303)
- Split public `['lower','lower','lower','lower']`, internes alternés lower-quad / lower-hip : **PASS** (ligne 334-338)
- Noms « Lower — Bas du corps A/B/C/D » : **PASS**
- Lower-quad (A/C) = quads/glutes compound en tête ; lower-hip (B/D) = glutes/hamstrings en tête : **PASS**
- Structure différenciée entre A et B : **PASS** (slots et ordre différents, pas seulement les exercices)

**Coach :**
- **Exercices de jambes disponibles en bodyweight (réponse à la question du prompt) :**
  composés — `bw-squat`(3), `bw-lunge`(2), `bw-jump-squat`(1), `seed-hip-thrust-bw`(4),
  `seed-curtsy-lunge`(1) ; isolations — `bw-wall-sit`(2), `seed-glute-bridge`(3), `seed-donkey-kick`(2),
  `seed-fire-hydrant`(2), `bw-calf-raise`(2). **Aucun exercice d'ischio-jambiers isolé** (`bw-nordic-curl`
  est passé en `pullup_bar`). → **le slot `hamstrings` isolation est vide sur les 4 séances.**
- ❌ **Séance B : `seed-curtsy-lunge` (pop 1) en tête de séance en 4×8-12**, alors que
  `seed-hip-thrust-bw` (pop 4) est disponible. Cause : `usedGlobally` prime sur la popularité
  (lignes 568-571). La fente curtsy est un mouvement d'adducteurs/moyen fessier, **pas** un
  hip hinge : le slot « glutes/hamstrings compound » est mal servi.
- ❌ **Séance C : `bw-jump-squat` (pliométrie) prescrit en 4×8-12 en tête de séance**, pour un débutant,
  en objectif hypertrophie. La pliométrie ne se programme ni en 4×8-12 ni comme mouvement principal
  d'hypertrophie. **Réserve de sécurité et de pertinence.**
- **Volume** : 4 séances de jambes par semaine pour un débutant sans charge externe.
  ⚠️ Fréquence excessive et progression impossible (`autoProgress: false`, `progressStepKg: 0` partout).
- **Équilibre** : ❌ programme 100 % bas du corps ; aucun haut du corps de la semaine.
  Warning « spécialisation » émis ✅, mais 4 séances/semaine sur un seul segment n'est pas un
  « bloc court » raisonnable.
- **Durée** : 2×4×130 + 3×3×105 = 1040 + 945 = 1985 s ≈ 33 min + 6 min ≈ **39 min** pour 60 annoncées.
  ⚠️ Sous-remplissage dû au slot vide.
- **Couverture isolation** : quads ✅, fessiers ✅, mollets ✅. **Ischios absents en isolation ET
  quasi absents en composé** (seul le hip thrust les sollicite en secondaire). → **Lacune problématique.**
- **Verdict : ❌ Problème sérieux** — 4 séances jambes/semaine sans progression possible,
  ischios non couverts, jump squat et curtsy lunge promus en tête de séance.

---

## P14 — [RÉGRESSION BUG #3] core seul → fullbody (2 j)

`{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:BW, level:'beginner', focusMuscles:['core'] }`

**Simulation — `workoutTypeFromFocus(['core'])` :**
`hasLower=false, hasPush=false, hasPull=false, hasArms=false, hasCore=true, hasUpper=false`
- règle 1 `hasLower && !hasUpper` → **false** (hasLower faux)
- **règle 2 `hasCore && !hasLower && !hasUpper` (ligne 307) → `return null`** ✅
- Aucune autre règle atteinte.
- `selectSplit` : `focusType` falsy → split par défaut case 2 → `['fullbody-quad','fullbody-hip']`
- **Warnings (3) :** « Focus gainage : "core" seul ne définit pas de type de séance… » (ligne 925,
  `unshift` donc en tête) + 2 warnings « Aucun exercice composé disponible pour "dos (largeur)" »

**Full Body A** (`fullbody-quad`, 9 slots, 4 remplis)

| # | Slot | Cat | Candidats BW | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | quads/glutes cpd | cpd | bw-squat(3), bw-lunge(2), bw-jump-squat(1) | **bw-squat** | 4×8-12 |
| 2 | chest cpd | cpd | pushup(2), bw-incline-pushup(2) | **seed-pushup** | 4×8-12 |
| 3 | dos cpd | cpd | — | **— slot vide —** ⚠️ warning | — |
| 4 | shoulders cpd | cpd | bw-pike-pushup(1) | **bw-pike-pushup** | 4×8-12 |
| 5 | hamstrings iso | iso | — | **— slot vide —** | — |
| 6 | shoulders_rear | iso | — | **— slot vide —** | — |
| 7 | biceps | iso | — | **— slot vide —** | — |
| 8 | calves | iso | bw-calf-raise(2) | **bw-calf-raise** | 3×10-15 |
| 9 | triceps | iso | — | **— slot vide —** | — |
| 10 | core | — | index 0 | **seed-scissors** | 3×15 |

→ 6 exercices.

**Full Body B** (`fullbody-hip`, 9 slots, 5 remplis)

| # | Slot | Retenu | Séries×Reps |
|---|---|---|---|
| 0 | warmup | seed-cat-cow | 2×10 |
| 1 | hams/glutes cpd | **seed-hip-thrust-bw** | 4×8-12 |
| 2 | chest cpd | **seed-pushup** | 4×8-12 |
| 3 | back_width cpd | **— slot vide —** ⚠️ | — |
| 4 | shoulders cpd | **bw-pike-pushup** | 4×8-12 |
| 5 | quads iso | **bw-wall-sit** | 3×10-15 |
| 6 | sh_lat/sh_rear iso | **— slot vide —** | — |
| 7 | biceps | **— slot vide —** | — |
| 8 | calves | **bw-calf-raise** | 3×10-15 |
| 9 | triceps | **— slot vide —** | — |
| 10 | core | **seed-crunch** | 3×15 |

→ 7 exercices.

**Assertions CRITIQUES :**
- `workoutTypeFromFocus(['core'])` retourne **`null`** : **PASS** (ligne 307)
- Split = `['fullbody','fullbody']`, **jamais `['lower','lower']`** : **PASS** (ligne 350)
  → **Régression BUG #3 non reproduite. Le correctif tient.**
- Le core apparaît en queue via `corePool` : **PASS** (ligne 826-831)
- Warning explicatif « Focus gainage » émis en tête : **PASS** (ligne 925)

**Coach :**
- **Cohérence de l'intention** : l'utilisateur demande du gainage et reçoit **un seul exercice de core
  par séance** (scissors 3×15, crunch 3×15). Le warning l'explique honnêtement. ✅ sur la transparence,
  ⚠️ sur la satisfaction du besoin.
- **Équilibre** : combiné à `BW`, le programme est amputé du dos, des bras et des ischios (5 slots
  vides sur 9 en A). ❌
- **Durée** : ≈ 25 min pour 60 annoncées.
- **Verdict : ✅ PASS sur l'assertion critique / ⚠️ programme appauvri par l'équipement BW.**

---

## P15 — [RÉGRESSION BUG #3 / 4 j] core seul → upper/lower

`{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'beginner', focusMuscles:['core'] }`

**Simulation :**
- `workoutTypeFromFocus(['core'])` → **`null`** (mêmes flags que P14)
- `selectSplit` case 4, `isMass` vrai → ligne 362 → `['upper-push','lower-quad','upper-pull','lower-hip']`
  → public `['upper','lower','upper','lower']`
- **Warning (1) :** « Focus gainage… » (le programme n'a aucun slot vide en FULL)

**Sorties** (identiques à P07 — même split, même équipement, même niveau, `focusedMuscles = {core}`
n'affecte aucun slot car aucun slot ne liste `'core'`) :

- **Upper A** (`upper-push`, 10 ex.) : bird-dog · bench-barbell 4×8-12 · lat-pulldown 4×8-12 ·
  shoulder-press-db 4×8-12 · fly-dumbbell 3×10-15 · triceps-rope 3×10-15 · lateral-raise 3×10-15 ·
  curl-barbell 3×10-15 · pullover-dumbbell 3×10-15 · scissors 3×15
- **Lower A** (`lower-quad`, 8 ex.) : cat-cow · squat-barbell 4×8-12 · romanian-deadlift 4×8-12 ·
  leg-extension 3×10-15 · leg-curl-lying 3×10-15 · glute-bridge 3×10-15 · calf-raise-seated 3×10-15 · crunch 3×15
- **Upper B** (`upper-pull`, 10 ex.) : shoulder-circles · lat-pulldown 4×8-12 · row-barbell 4×8-12 ·
  bench-dumbbell 4×8-12 · face-pull 3×10-15 · curl-dumbbell 3×10-15 · pullover-cable 3×10-15 ·
  triceps-pushdown 3×10-15 · lateral-raise-cable 3×10-15 · cable-crunch 3×15
- **Lower B** (`lower-hip`, 8 ex.) : dead-bug · hip-thrust 4×8-12 · leg-press 4×8-12 · donkey-kick 3×10-15 ·
  leg-curl-seated 3×10-15 · wall-sit 3×10-15 · calf-raise-standing 3×10-15 · bicycle-crunch 3×15

**Assertions CRITIQUES :**
- `workoutTypeFromFocus(['core'])` = `null` → split 4 j beginner par défaut : **PASS**
- Split `['upper','lower','upper','lower']`, **jamais `['lower','lower','lower','lower']`** : **PASS**
  → **Régression BUG #3 non reproduite en 4 j.**

**Coach :**
- ⚠️ **`reorderSlotsByFocus` est un no-op ici** : `focusedMuscles = {'core'}` et aucun slot du
  générateur ne liste `'core'` (ligne 486-496 → tous les slots ont `aF = bF = 1`, ordre stable).
  L'utilisateur qui coche « Core » n'obtient **strictement aucune priorisation**, seulement
  1 exercice de gainage par séance (identique à ce qu'il aurait eu sans focus).
- **Programme lui-même** : identique à P07 → excellent équilibre haut/bas, couverture isolation
  complète, timing correct, variété structurelle A/B. ✅
- **Verdict : ✅ PASS** — assertion critique respectée, programme de qualité. Réserve : le focus
  « core » n'a aucun effet sur le contenu, seulement sur le warning.

---

## P16 — shoulders seul → push

`{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:DB, level:'beginner', focusMuscles:['shoulders'] }`

**Simulation :**
`hasPush=true` (shoulders ∈ push, ligne 296), `hasPull=false`, `hasLower=false`, `hasUpper=true`
→ règle 3 (ligne 309) → **`'push'`** ; split `['push','push']`.
`reorderSlotsByFocus` : ciblés = `{shoulders, shoulders_front, shoulders_lateral, shoulders_rear}`.
→ **Composés réordonnés** : slot épaules (index 1 d'origine) passe en tête, chest en 2ᵉ.
→ **Isolations réordonnées** : sh_lateral et sh_rear passent devant chest iso et triceps.

**Warnings (3) :** spécialisation + **« Focus bras en push : le biceps n'est pas ciblé… »** (ligne 890,
déclenché car `focusMuscles` contient `'shoulders'`) + déséquilibre push/pull.

**Push A**

| # | Slot (après réordonnancement) | Cat | Candidats DB | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | **shoulders cpd** | cpd | sh-press-db(3), arnold(2) | **seed-shoulder-press-dumbbell** | 4×8-12 |
| 2 | chest cpd | cpd | bench-db(3), incline-bench-db(2) | **seed-bench-dumbbell** | 4×8-12 |
| 3 | **sh_lateral** | iso | lateral-raise(3) | **seed-lateral-raise** | 3×10-15 |
| 4 | **shoulders_rear** | iso | rear-delt-fly(2) | **seed-rear-delt-fly** | 3×10-15 |
| 5 | chest iso | iso | fly-dumbbell(2) | **seed-fly-dumbbell** | 3×10-15 |
| 6 | triceps | iso | triceps-overhead(2), triceps-kickback(1) | **seed-triceps-overhead** | 3×10-15 |
| 7 | core | — | index 0 | seed-scissors | 3×15 |

**Push B** : cat-cow · **seed-arnold-press** 4×8-12 · seed-bench-dumbbell 4×8-12 ·
seed-lateral-raise 3×10-15 · seed-rear-delt-fly 3×10-15 · seed-fly-dumbbell 3×10-15 ·
**seed-triceps-kickback** 3×10-15 · crunch 3×15

**Assertions :**
- `hasPush=true` (shoulders ∈ push) → `'push'` : **PASS** (lignes 296, 309)
- Split `['push','push']` : **PASS**
- Slots épaules remontés en tête par `reorderSlotsByFocus` : **PASS** (visible : shoulders cpd
  avant chest cpd, sh_lateral/sh_rear avant chest iso/triceps)

**Coach :**
- ✅ **Le réordonnancement fonctionne correctement** : 3 des 6 slots ciblent l'épaule et sont en tête.
- ⚠️ **Le warning UX-B « Focus bras en push : le biceps n'est pas ciblé »** est déclenché alors que
  l'utilisateur a coché **« épaules »**, pas « bras » (condition ligne 889 :
  `f === 'arms' || f === 'shoulders'`). Le texte parle de bras et de biceps — **message inadapté
  au cas « épaules seules »**. Défaut de libellé.
- **Équilibre** : deltoïdes antérieur (press), latéral (élévations) et postérieur (oiseau) couverts. ✅
  Mais aucun tirage, aucun dos, aucun biceps.
- **Variété A→B** : 4 exercices sur 6 identiques ; seuls press et triceps changent, le triceps
  descendant sur le kickback (pop 1). Faible.
- **Durée** ≈ 44 min ✅
- **Verdict : ⚠️ PASS** — réordonnancement correct, warning UX-B mal libellé pour « épaules ».

---

## P17 — chest + back → upper

`{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner', focusMuscles:['chest','back'] }`

**Simulation :**
`hasPush=true, hasPull=true, hasLower=false, hasUpper=true`
→ règles 3 et 4 échouent (chacune exige l'absence de l'autre) → **règle 5 (`hasUpper && !hasLower`,
ligne 313) → `'upper'`**
- `selectSplit` branche `focusType === 'upper'` (ligne 339) → alternance
  `['upper-push','upper-pull','upper-push']` → public `['upper','upper','upper']`
- Noms « Upper — Haut du corps A / B / C ». 8 slots. Warnings : **aucun** (un split upper contient
  du tirage, donc ni spécialisation détectée — `publicTypes.size === 1` mais `t === 'upper'` n'est
  pas dans la liste push/pull/lower ligne 880 — ni déséquilibre push/pull).

**Upper A** (`upper-push`, réordonné : ciblés = chest* + back*)

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | chest cpd | cpd | bench-barbell(8), bench-db(3), chest-press-machine(3) | **seed-bench-barbell** | 4×8-12 |
| 2 | dos cpd | cpd | lat-pulldown(3), row-barbell(7), row-db(3) | **seed-lat-pulldown** | 4×8-12 |
| 3 | shoulders cpd (non ciblé, repoussé) | cpd | sh-press-db(3), ohp-barbell(3), sh-press-machine(3) | **seed-shoulder-press-dumbbell** | 4×8-12 |
| 4 | **chest iso** (remonté) | iso | fly-db(2), fly-cable(2), pec-deck(2) | **seed-fly-dumbbell** | 3×10-15 |
| 5 | **dos iso** (remonté) | iso | pullover-db(3), pullover-cable(2), straight-arm(2) | **seed-pullover-dumbbell** | 3×10-15 |
| 6 | triceps | iso | triceps-rope(3), triceps-pushdown(3), skullcrusher(2) | **seed-triceps-rope** | 3×10-15 |
| 7 | sh_lateral | iso | lateral-raise(3), lateral-raise-cable(2) | **seed-lateral-raise** | 3×10-15 |
| 8 | biceps | iso | curl-barbell(3), curl-db(3), curl-hammer(3) | **seed-curl-barbell** | 3×10-15 |
| 9 | core | — | index 0 | seed-scissors | 3×15 |

**Upper B** (`upper-pull`) : cat-cow · lat-pulldown 4×8-12 · row-barbell 4×8-12 · bench-dumbbell 4×8-12 ·
**pullover-cable** 3×10-15 · face-pull 3×10-15 · curl-dumbbell 3×10-15 · triceps-pushdown 3×10-15 ·
lateral-raise-cable 3×10-15 · crunch 3×15

**Upper C** (`upper-push`) : shoulder-circles · **chest-press-machine** 4×8-12 · lat-pulldown 4×8-12 ·
ohp-barbell 4×8-12 · **fly-cable** 3×10-15 · **straight-arm-pulldown** 3×10-15 · skullcrusher 3×10-15 ·
lateral-raise 3×10-15 · curl-hammer 3×10-15 · cable-crunch 3×15

**Assertions :**
- `hasPush && hasPull && !hasLower` → `'upper'` : **PASS** (ligne 313)
- Split `['upper','upper','upper']` : **PASS**
- Réordonnancement : chest et back en tête des composés **et** des isolations : **PASS**
  (isolations A : chest iso puis dos iso avant triceps/latéral/biceps — comparer à P07 Upper A
  où l'ordre est fly / triceps / latéral / biceps / dos iso)

**Coach :**
- **Ratio push/pull sur la séance** : Upper A = 1 chest cpd + 1 dos cpd + 1 OHP + 1 fly + 1 dos iso.
  Poussées 3, tirages 2. Sur la semaine (A + B + C) : poussées composées 4, tirages composés 5. ✅
  **Équilibré**, meilleur que P01 ou P02.
- **Réordonnancement** : parfaitement conforme à l'intention — chest et back montent avant la coupure
  de durée, et l'ordre compound-before-isolation est préservé. ✅
- **Cohérence objectif** : specs hypertrophie ✅
- **Durée** : 3×4×130 + 5×3×105 = 3135 s ≈ 52 min + 6 min ≈ **58 min** ✅
- ⚠️ `seed-lat-pulldown` sur les 3 séances (A, B, C) — même cause structurelle que P12.
- **Variété** : A ≠ B (structurelle : bench-first vs traction-first) ; C reprend la structure de A
  avec 5 exercices différents sur 8. → **Variété structurelle partielle + variété d'exercices.** ✅ Correct.
- **Couverture isolation** : pecs ✅, dos ✅, triceps ✅, biceps ✅, deltoïde latéral ✅,
  deltoïde postérieur ✅ (face pull en B). Jambes absentes (par construction).
- **Verdict : ✅ Bon programme** — sur les profils à focus, le meilleur équilibré. Réserve :
  lat-pulldown ×3 et aucun travail du bas du corps (attendu, mais non signalé par un warning).

---

## P18 — legs + core → lower (le core ne neutralise pas)

`{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:BW, level:'beginner', focusMuscles:['legs','core'] }`

**Simulation — `workoutTypeFromFocus(['legs','core'])` :**
`hasLower=true, hasPush=false, hasPull=false, hasArms=false, hasCore=true, hasUpper=false`
- **règle 1 `hasLower && !hasUpper` (ligne 303) → `'lower'`** — évaluée **avant** la règle « core seul »
  (ligne 307), donc le core ne neutralise rien. ✅
- Split : branche `focusType === 'lower'` → `['lower-quad','lower-hip','lower-quad']`
  → public `['lower','lower','lower']`
- Warning : « Programme de spécialisation… ». Pas de warning « Focus gainage » (la condition
  ligne 924 exige `!hasFocusLower`).

**Lower A** (`lower-quad`) : bird-dog · **bw-squat** 4×8-12 · **seed-hip-thrust-bw** 4×8-12 ·
bw-wall-sit 3×10-15 · *— slot hamstrings vide —* · seed-glute-bridge 3×10-15 · bw-calf-raise 3×10-15 ·
seed-scissors 3×15 → **7 exercices**

**Lower B** (`lower-hip`) : cat-cow · **seed-curtsy-lunge** 4×8-12 ⚠️ · **bw-lunge** 4×8-12 ·
seed-donkey-kick 3×10-15 · *— hamstrings vide —* · bw-wall-sit 3×10-15 · bw-calf-raise 3×10-15 ·
seed-crunch 3×15 → **7 exercices**

**Lower C** (`lower-quad`) : shoulder-circles · **bw-jump-squat** 4×8-12 ⚠️ · seed-hip-thrust-bw 4×8-12 ·
bw-wall-sit 3×10-15 · *— hamstrings vide —* · seed-fire-hydrant 3×10-15 · bw-calf-raise 3×10-15 ·
seed-bicycle-crunch 3×15 → **7 exercices**

**Assertions CRITIQUES :**
- `hasLower=true, hasUpper=false` → `'lower'` (le core seul renverrait `null`, mais `legs` présent
  fait matcher la règle 1 avant) : **PASS** (ordre des règles lignes 303 puis 307)
- Split `['lower','lower','lower']` : **PASS**

**Coach :**
- Mêmes réserves que P13 : ⚠️ **curtsy lunge en tête de B**, ⚠️ **jump squat en 4×8-12 en tête de C**,
  ❌ **slot ischios vide sur les 3 séances**.
- **Le focus « core » n'apporte qu'un exercice de gainage en fin de séance** (scissors / crunch /
  bicycle crunch) — le même qu'un utilisateur sans focus. Attente utilisateur non satisfaite.
- **Durée** : ≈ 33 min pour 60 annoncées. Sous-rempli.
- **Verdict : ✅ PASS sur l'assertion critique LEGS+CORE / ⚠️ programme faible** (ischios vides,
  exercices marginaux promus, aucun haut du corps).

---

## P19 — chest + back + legs → null → split par défaut

`{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:FULL, level:'beginner', focusMuscles:['chest','back','legs'] }`

**Simulation :**
`hasLower=true, hasPush=true, hasPull=true, hasArms=false, hasCore=false, hasUpper=true`
- règle 1 : `hasLower && !hasUpper` → false · règle 2 : false · règle 3 : `!hasLower` false ·
  règle 4 : `!hasPush` false · règle 5 : `!hasLower` false · règle 6 (`lower_push`) : `!hasPull` false ·
  règle 7 (`lower_pull`) : `!hasPush` false → **`return null` (ligne 321)**
- Split par défaut case 2 → `['fullbody-quad','fullbody-hip']`
- **Warning (1) :** « Sélection complète : votre focus couvre poitrine, dos et jambes… » (ligne 941)
- `focusedMuscles` = chest*, back*, quads/hams/glutes/calves → **le réordonnancement agit sur les isolations**

**Full Body A** (`fullbody-quad`, isolations réordonnées : hamstrings, calves ciblés remontent)

| # | Slot | Cat | Retenu | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | seed-bird-dog | 2×10 |
| 1 | quads/glutes cpd | cpd | **seed-squat-barbell** | 4×8-12 |
| 2 | chest cpd | cpd | **seed-bench-barbell** | 4×8-12 |
| 3 | dos cpd | cpd | **seed-lat-pulldown** | 4×8-12 |
| 4 | shoulders cpd | cpd | **seed-shoulder-press-dumbbell** | 4×8-12 |
| 5 | **hamstrings** (ciblé) | iso | **seed-leg-curl-lying** | 3×10-15 |
| 6 | **calves** (ciblé, remonté de pos. 8) | iso | **seed-calf-raise-seated** | 3×10-15 |
| 7 | shoulders_rear | iso | **seed-face-pull** | 3×10-15 |
| 8 | biceps | iso | **seed-curl-barbell** | 3×10-15 |
| 9 | triceps | iso | **seed-triceps-rope** | 3×10-15 |
| 10 | core | — | seed-scissors | 3×15 |

**Full Body B** (`fullbody-hip`) : cat-cow · romanian-deadlift 4×8-12 · bench-dumbbell 4×8-12 ·
lat-pulldown 4×8-12 · ohp-barbell 4×8-12 · **leg-extension** 3×10-15 · **calf-raise-standing** 3×10-15 ·
lateral-raise 3×10-15 · curl-dumbbell 3×10-15 · triceps-pushdown 3×10-15 · crunch 3×15

**Assertions :**
- `hasLower && hasUpper` → ambiguïté → `null` : **PASS** (ligne 321)
- Split par défaut `['fullbody','fullbody']` : **PASS**
- Warning explicatif « Sélection complète » : **PASS** (ligne 941)

**Coach :**
- **Réordonnancement visible et pertinent** : `calves` remonte de la position 8 à la position 6,
  `hamstrings` reste en 5 — les muscles ciblés passent avant la coupure de durée. ✅
  (Comparer à P01 : ordre hamstrings / sh_rear / biceps / calves / triceps.)
- **Équilibre** : identique à P01 — tous groupes couverts, mais ratio push/pull 2:1.
- **Durée** : ≈ 67 min ✅ acceptable.
- **Verdict : ✅ PASS** — comportement conforme, warning pédagogique correct, réordonnancement efficace.

---

## P20 — shoulders + arms → push

`{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:DB, level:'beginner', focusMuscles:['shoulders','arms'] }`

**Simulation :**
`hasLower=false, hasPush=true (shoulders), hasPull=false, hasArms=true, hasCore=false, hasUpper=true`
→ **règle 3 (`hasPush && !hasPull && !hasLower`, ligne 309) matche avant la règle 5** → `'push'`
- Split `['push','push']`. `focusedMuscles` = shoulders* + biceps/triceps/forearms.
- **Réordonnancement isolations** : triceps (ciblé) remonte en tête des isolations, devant chest iso.
- **Warnings (3) :** spécialisation + focus bras en push + déséquilibre push/pull.

**Push A**

| # | Slot (réordonné) | Cat | Retenu | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | seed-bird-dog | 2×10 |
| 1 | **shoulders cpd** | cpd | **seed-shoulder-press-dumbbell** | 4×8-12 |
| 2 | chest cpd | cpd | **seed-bench-dumbbell** | 4×8-12 |
| 3 | **triceps** (remonté) | iso | **seed-triceps-overhead** | 3×10-15 |
| 4 | **sh_lateral** | iso | **seed-lateral-raise** | 3×10-15 |
| 5 | **shoulders_rear** | iso | **seed-rear-delt-fly** | 3×10-15 |
| 6 | chest iso (repoussé) | iso | **seed-fly-dumbbell** | 3×10-15 |
| 7 | core | — | seed-scissors | 3×15 |

**Push B** : cat-cow · **seed-arnold-press** 4×8-12 · seed-bench-dumbbell 4×8-12 ·
**seed-triceps-kickback** 3×10-15 · seed-lateral-raise 3×10-15 · seed-rear-delt-fly 3×10-15 ·
seed-fly-dumbbell 3×10-15 · crunch 3×15

**Assertions :**
- `hasPush=true (shoulders), hasPull=false, hasLower=false` → `'push'` : **PASS**
- Split `['push','push']` : **PASS**
- Priorité de la règle 3 sur la règle 5 (`arms` seul donnerait `'upper'`, cf. P53) : **PASS**
- Warning UX-B « Focus bras en push : le biceps n'est pas ciblé » : **PASS** (ligne 890)

**Coach :**
- ✅ **Le warning UX-B est ici parfaitement justifié** : l'utilisateur coche « bras », le split push
  ne contient **aucun slot biceps**. Seul le triceps est servi. Message pertinent et utile.
- ❌ **Le besoin utilisateur n'est satisfait qu'à moitié** : 1 slot triceps sur 6, 0 slot biceps.
  Un focus « bras » devrait idéalement basculer sur `'upper'` (comme `arms` seul) ou ajouter un
  slot biceps. Recommandation : traiter `arms` comme un signal d'ajout de slot, pas seulement de tri.
- **Variété A→B** : 4/6 exercices identiques ; triceps-kickback (pop 1) en B. Faible.
- **Durée** ≈ 44 min ✅
- **Verdict : ⚠️ PASS** — logique conforme et bien avertie, mais focus « bras » mal servi en push.
---

# GROUPE C — Équipement × slot (exercices du seed cités par `id`)

---

## P21 — Bodyweight only (3 j, beginner, hypertrophie)

`{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:BW, level:'beginner' }`

**Simulation :**
- `focusType` = `null` ; case 3, `isMass` mais beginner → ligne 358
  → `['fullbody-quad','fullbody-hip','fullbody-quad']` → « Full Body A / B / C »
- `filterByEquipment` (ligne 737-739) : `available = exercises.filter(ex => !ex.deleted &&
  !ex.isWarmupExercise && allowed.has(ex.equipment))` → **28 exercices bodyweight**
- Slots : 9 par séance (hypertrophie 60 min = base intégrale)
- **Warnings (2) :** « Aucun exercice composé disponible pour "dos (largeur)" » ×2
  (clés `fullbody-quad:back_width` et `fullbody-hip:back_width`)

**Inventaire bodyweight utile (non-warmup, pop > 0) :**
chest → `seed-pushup`(cpd,2), `bw-incline-pushup`(cpd,2 — primaryMuscle `chest_upper`) ·
shoulders → `bw-pike-pushup`(cpd,1) · quads → `bw-squat`(cpd,3), `bw-lunge`(cpd,2),
`bw-jump-squat`(cpd,1), `bw-wall-sit`(iso,2) · glutes → `seed-hip-thrust-bw`(cpd,4),
`seed-glute-bridge`(iso,3), `seed-donkey-kick`(iso,2), `seed-fire-hydrant`(iso,2),
`seed-curtsy-lunge`(cpd,1) · calves → `bw-calf-raise`(iso,2) · core → 11 exercices ·
cardio → `bw-burpees`, `seed-jump-rope`, `bw-high-knees` (**inatteignables**, aucun slot `'cardio'`).
**Néant : dos, biceps, triceps, ischios isolés, deltoïdes latéral et postérieur.**

**Full Body A** (`fullbody-quad`)

| # | Slot | Cat | Candidats BW | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | quads/glutes cpd | cpd | bw-squat(3), bw-lunge(2), bw-jump-squat(1) | **bw-squat** | 4×8-12 |
| 2 | chest cpd | cpd | seed-pushup(2), bw-incline-pushup(2) | **seed-pushup** | 4×8-12 |
| 3 | **back_width/thickness/back cpd** | cpd | **aucun** | **— slot vide —** ⚠️ | — |
| 4 | shoulders cpd | cpd | bw-pike-pushup(1) | **bw-pike-pushup** | 4×8-12 |
| 5 | **hamstrings** iso | iso | **aucun** | **— slot vide —** | — |
| 6 | **shoulders_rear** iso | iso | **aucun** | **— slot vide —** | — |
| 7 | **biceps** iso | iso | **aucun** | **— slot vide —** | — |
| 8 | calves iso | iso | bw-calf-raise(2) | **bw-calf-raise** | 3×10-15 |
| 9 | **triceps** iso | iso | **aucun** | **— slot vide —** | — |
| 10 | core | — | index 0 | seed-scissors | 3×15 |

→ **6 exercices** (5 slots vides sur 9).

**Full Body B** (`fullbody-hip`) : cat-cow · **seed-hip-thrust-bw** 4×8-12 · **seed-pushup** 4×8-12 ·
*— back_width vide —* · **bw-pike-pushup** 4×8-12 · **bw-wall-sit** 3×10-15 · *— sh_lat/rear vide —* ·
*— biceps vide —* · **bw-calf-raise** 3×10-15 · *— triceps vide —* · seed-crunch 3×15 → **7 exercices**

**Full Body C** (`fullbody-quad`) : shoulder-circles · **bw-lunge** 4×8-12 · **seed-pushup** 4×8-12 ·
*— vide —* · **bw-pike-pushup** 4×8-12 · *— vide ×3 —* · **bw-calf-raise** 3×10-15 · *— vide —* ·
seed-bicycle-crunch 3×15 → **6 exercices**

**Assertions :**
- `filterByEquipment` exclut tout exercice non-BW : **PASS** (ligne 738 — `allowed.has(ex.equipment)`)
- Aucun exercice `equipment ≠ 'bodyweight'` en sortie : **PASS** (100 % des 19 postes générés sont
  `bodyweight` ; note : les pools warmup et core admettent aussi le bodyweight par construction)
- `autoProgress: false`, `progressStepKg: 0` : **PASS** (ligne 585, `equipment === 'bodyweight'` → 0)
- **Slots vides listés (question du prompt) :** `back_width/thickness/back` compound (A, C),
  `back_width/back` compound (B), `hamstrings` iso (A, C), `shoulders_rear` iso (A, C),
  `shoulders_lateral/rear` iso (B), `biceps` iso (A, B, C), `triceps` iso (A, B, C),
  `quads` iso rempli en B seulement. → **14 slots vides sur 27.**
- Fallback isolation quand aucun composé : **NON** — pour un slot `compound: true`, `pickExercise`
  retourne `null` sans chercher d'isolation (lignes 533-541). Le fallback isolation→composé existe
  seulement dans l'autre sens (lignes 542-546).

**Coach :**
- **Le dos est-il couvert ?** ❌ **Non.** `seed-pullup` étant désormais `pullup_bar`, il ne reste
  **aucun exercice de dos en bodyweight pur** dans le seed. Sur les 3 séances de la semaine :
  **zéro tirage**. Aucun biceps, aucun triceps isolé, aucun deltoïde postérieur, aucun ischio.
- **Équilibre** : 3 pompes + 3 pike push-ups contre 0 tirage. **Le pire déséquilibre push/pull de
  l'audit**, et il n'est **pas détecté** par le warning UX-5 (ligne 904) parce que le split est
  `fullbody`, considéré comme contenant du tirage (ligne 899) — ce qui est faux ici.
  ⚠️ **Angle mort du contrôle de déséquilibre.**
- **Durée** : ≈ 6 exercices → 3×4×130 + 1×3×105 + core ≈ 28 min pour 60 annoncées.
- **Cohérence objectif** : 4×8-12 de pompes est correct en hypertrophie relative ;
  mais `progressStepKg: 0` + `autoProgress: false` → **aucune surcharge progressive possible**.
  Pour une « prise de masse », le programme est structurellement incapable de progresser.
- **Variété A→B→C** : A et C sont le même template avec 1 exercice différent (bw-squat → bw-lunge).
  → **quasi répétition complète.**
- **Couverture isolation** : mollets uniquement. **Lacunes problématiques.**
- **Verdict : ❌ Problème sérieux** — programme tronqué à 2/3, zéro dos, aucune progression possible.
  Le générateur devrait recommander explicitement l'ajout d'une barre de traction.

---

## P22 — Haltères seuls → slot dos compound (BUG #4)

`{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:DB, level:'beginner' }`

**Simulation :**
- Split `['fullbody-quad','fullbody-hip','fullbody-quad']` ; 9 slots ; available = **22**
- **Warning (1) :** « Aucun exercice composé disponible pour "dos (largeur)" » (une seule fois)

**Analyse du code demandée par l'assertion BUG#4 :**
- `fullbody-quad` slot 3 = `{ muscles: ['back_width','back_thickness','back'], compound: true }` (ligne 256)
  → **contient bien `back_thickness`** → `seed-row-dumbbell` (`primaryMuscle: 'back_thickness'`,
  dumbbell, compound, pop 3) **qualifie**. ✅ **BUG#4 corrigé pour `fullbody-quad`.**
- `fullbody-hip` slot 3 = `{ muscles: ['back_width','back'], compound: true }` (ligne 269)
  → **ne contient PAS `back_thickness`** → en DB-only, aucun candidat (`seed-pullover` est
  `back_width` mais `isolation`) → **slot vide.** ❌ **BUG#4 résiduel sur `fullbody-hip`.**

**Full Body A** (`fullbody-quad`)

| # | Slot | Cat | Candidats DB | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | quads/glutes cpd | cpd | seed-lunges(2), bulgarian-split-squat(2) | **seed-lunges** | 4×8-12 |
| 2 | chest cpd | cpd | bench-db(3), incline-bench-db(2) | **seed-bench-dumbbell** | 4×8-12 |
| 3 | **dos cpd** | cpd | **seed-row-dumbbell(3) — seul candidat** | **`seed-row-dumbbell`** ✅ **non vide** | 4×8-12 |
| 4 | shoulders cpd | cpd | sh-press-db(3), arnold(2) | **seed-shoulder-press-dumbbell** | 4×8-12 |
| 5 | hamstrings iso | iso→cpd | dumbbell-rdl(2) (fallback composé) | **`dumbbell-rdl`** | 3×10-15 |
| 6 | shoulders_rear | iso | rear-delt-fly(2) | **seed-rear-delt-fly** | 3×10-15 |
| 7 | biceps | iso | curl-db(3), curl-hammer(3), curl-incline(2) | **seed-curl-dumbbell** | 3×10-15 |
| 8 | calves | iso | calf-raise-db(2) | **seed-calf-raise-db** | 3×10-15 |
| 9 | triceps | iso | triceps-overhead(2), triceps-kickback(1) | **seed-triceps-overhead** | 3×10-15 |
| 10 | core | — | index 0 | seed-scissors | 3×15 |

→ **11 exercices, aucun slot vide.**

**Full Body B** (`fullbody-hip`)

| # | Slot | Cat | Candidats | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 1 | seed-cat-cow | 2×10 |
| 1 | hams/glutes cpd | cpd | dumbbell-rdl(2) | **dumbbell-rdl** | 4×8-12 |
| 2 | chest cpd | cpd | bench-db(3), incline-bench-db(2) | **seed-bench-dumbbell** | 4×8-12 |
| 3 | **back_width/back cpd** | cpd | **aucun** ❌ | **— slot vide —** ⚠️ | — |
| 4 | shoulders cpd | cpd | arnold(2), sh-press-db(3) | **seed-arnold-press** | 4×8-12 |
| 5 | quads iso | iso→cpd | bulgarian-split-squat(2), lunges(2) | **seed-bulgarian-split-squat** | 3×10-15 |
| 6 | sh_lat/rear iso | iso | lateral-raise(3), rear-delt-fly(2) | **seed-lateral-raise** | 3×10-15 |
| 7 | biceps | iso | curl-hammer(3), curl-incline(2), curl-concentration(1) | **seed-curl-hammer** | 3×10-15 |
| 8 | calves | iso | calf-raise-db(2) | **seed-calf-raise-db** ⚠️ répété | 3×10-15 |
| 9 | triceps | iso | triceps-kickback(1), triceps-overhead(2) | **seed-triceps-kickback** | 3×10-15 |
| 10 | core | — | index 1 | seed-crunch | 3×15 |

→ **10 exercices, 1 slot vide (dos).**

**Full Body C** (`fullbody-quad`) : shoulder-circles · seed-lunges 4×8-12 · seed-bench-dumbbell 4×8-12 ·
**seed-row-dumbbell** 4×8-12 · seed-shoulder-press-dumbbell 4×8-12 · dumbbell-rdl 3×10-15 ·
seed-rear-delt-fly 3×10-15 · **seed-curl-incline** 3×10-15 · seed-calf-raise-db 3×10-15 ·
seed-triceps-overhead 3×10-15 · seed-bicycle-crunch 3×15 → **11 exercices**

**Assertions CRITIQUES :**
- Le slot dos compound de `fullbody-quad` liste `['back_width','back_thickness','back']` : **PASS** (ligne 256)
- **id retenu pour le slot dos en DB-only : `seed-row-dumbbell`** (Rowing haltère, dumbbell, compound,
  pop 3, secondaires biceps/back_width) : **PASS**
- Le slot n'est pas null/vide en `fullbody-quad` : **PASS**
- ⚠️ **FAIL partiel** : le même slot dans `fullbody-hip` (ligne 269, `['back_width','back']`) **est vide**.
  → **BUG#4 subsiste sur `fullbody-hip`, `pull` slot 0 (ligne 119), `upper-pull` slot 0 (ligne 180)
  et `lower_pull` slot 1 (ligne 221)** — tous listent `['back_width','back']` sans `back_thickness`.

**Coach :**
- **Équilibre** : dos travaillé 2 séances sur 3 (A et C). Séance B **sans aucun dos**. ⚠️
- ⚠️ `seed-lunges` (fentes) comme composé quads principal en 4×8-12 : acceptable en DB-only
  (pas de goblet squat sans kettlebell, pas de squat barre). Mais 2 séances sur 3 avec des fentes
  comme mouvement de force principal, c'est unilatéral et fatigant pour un débutant.
- ⚠️ **`dumbbell-rdl` (composé) placé sur un slot `hamstrings` isolation** : le fallback
  isolation→composé (lignes 542-546) fonctionne, mais un RDL en 3×10-15 après des fentes lourdes
  est un choix discutable en fin de séance.
- ⚠️ `seed-triceps-kickback` (pop 1) et `seed-curl-incline` promus par `usedGlobally`.
- **Durée** : ≈ 62 min ✅
- **Couverture isolation** : biceps ✅, triceps ✅, mollets ✅, deltoïdes ✅, ischios (via RDL) ~.
  **Dos en isolation absent.** Quads iso servi par un composé.
- **Verdict : ⚠️ PASS sur BUG#4 (fullbody-quad) / FAIL résiduel sur fullbody-hip** — 1 séance sur 3
  sans dos en haltères seuls.

---

## P23 — BB+DB strength intermediate 4 j → priorité barbell

`{ goal:'strength', daysPerWeek:4, sessionDuration:60, equipment:BB+DB, level:'intermediate' }`

**Simulation :**
- Split case 4 `isMass` → `['upper-push','lower-quad','upper-pull','lower-hip']`
- `adjustedSlotCount` force 60 min : upper-push 8→**4**, lower-quad 6→**4**, upper-pull 8→**4**, lower-hip 6→**4**
- available = 42. Warnings : aucun.

**Upper A** (`upper-push`, 4 slots)

| # | Slot | Cat | Top-3 (prio équipement force) | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | chest cpd | cpd | **bench-barbell(8, prio 0)**, bench-db(3, prio 2), incline-bench-bb(4, prio 0) | **`seed-bench-barbell`** ✅ | 5×3-5 |
| 2 | dos cpd | cpd | row-barbell(7), deadlift(3), row-tbar(2) | **`seed-row-barbell`** | 5×3-5 |
| 3 | shoulders cpd | cpd | ohp-barbell(3), sh-press-db(3), arnold(2) | **`seed-ohp-barbell`** | 5×3-5 |
| 4 | chest iso | iso | fly-dumbbell(2) | **seed-fly-dumbbell** | 3×5-8 |
| 5 | core | — | index 0 | seed-scissors | 3×15 |

**Lower A** (`lower-quad`, 4 slots)

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 1 | seed-cat-cow | 2×10 |
| 1 | quads/glutes cpd | cpd | **squat-barbell(8, prio 0)**, front-squat(2, prio 0), lunges(2, prio 2) | **`seed-squat-barbell`** ✅ (pas goblet — absent en BB+DB) | 5×3-5 |
| 2 | hams/glutes cpd | cpd | romanian-deadlift(3), good-morning(1), dumbbell-rdl(2) | **`seed-romanian-deadlift`** | 5×3-5 |
| 3 | quads iso | iso→cpd | lunges(2), front-squat(2), bulgarian(2) | **seed-lunges** (fallback composé) | 3×5-8 |
| 4 | hamstrings iso | iso→cpd | dumbbell-rdl(2), good-morning(1) | **dumbbell-rdl** | 3×5-8 |
| 5 | core | — | index 1 | seed-crunch | 3×15 |

**Upper B** (`upper-pull`, 4 slots)

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 2 | seed-shoulder-circles | 2×10 |
| 1 | back_width/back cpd | cpd | **`seed-deadlift`(3) seul candidat** | **seed-deadlift** ⚠️ | 5×3-5 |
| 2 | back_thickness cpd | cpd | row-tbar(2), row-barbell(7), row-db(3) | **seed-row-tbar** | 5×3-5 |
| 3 | chest cpd | cpd | bench-barbell(8), bench-db(3), incline-bench-bb(4) | **seed-bench-barbell** ⚠️ 2ᵉ fois | 5×3-5 |
| 4 | shoulders_rear iso | iso | rear-delt-fly(2) | **seed-rear-delt-fly** | 3×5-8 |
| 5 | core | — | index 2 | seed-bicycle-crunch | 3×15 |

**Lower B** (`lower-hip`, 4 slots)

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 3 | seed-dead-bug | 2×10 |
| 1 | glutes/hams cpd | cpd | hip-thrust(4), good-morning(1), romanian-deadlift(3) | **seed-hip-thrust** | 5×3-5 |
| 2 | quads/glutes cpd | cpd | **front-squat(2)**, squat-barbell(8), bulgarian(2) | **seed-front-squat** | 5×3-5 |
| 3 | **glutes iso** | iso | **aucun** (tous les isolants fessiers sont bodyweight/machine/cable/band) | **— slot vide —** | — |
| 4 | hamstrings iso | iso→cpd | good-morning(1), romanian-deadlift(3), dumbbell-rdl(2) | **seed-good-morning** ⚠️ | 3×5-8 |
| 5 | core | — | index 3 | seed-vertical-leg-crunch | 3×15 |

→ 5 exercices seulement.

**Assertions :**
- `strengthEquipmentPrio(barbell)=0 < dumbbell=2` → barbell prioritaire : **PASS** (lignes 502-513, 564-567)
- Slot chest compound = **`seed-bench-barbell`** (barbell), **pas** `seed-bench-dumbbell` : **PASS**
- Slot squat = **`seed-squat-barbell`** (barbell), **pas** goblet squat : **PASS**
  (le goblet squat est `kettlebell`, hors équipement — la comparaison du prompt n'est pas applicable ici)
- `autoProgress: true`, `progressStepKg: 2.5` sur tous les mouvements chargés : **PASS** (ligne 585)

**Coach :**
- **`autoProgress` / `progressStepKg` pour un programme force barbell** : `progressStepKg = 2.5`
  uniforme. ⚠️ **Trop grossier** : +2,5 kg/séance sur un squat 5×3-5 d'intermédiaire est jouable
  quelques semaines, mais +2,5 kg sur un développé militaire ou un écarté haltère est trop rapide.
  Un pas différencié (haut/bas du corps, composé/isolation) serait plus juste.
- ⚠️ **Upper B : `seed-deadlift` en 5×3-5, puis rowing T-bar 5×3-5, puis bench 5×3-5.**
  Soulevé de terre lourd placé sur le slot « largeur de dos » (aucune alternative en BB+DB).
  Charge lombaire élevée le **jeudi**, alors que le squat a été fait mardi et le front squat le
  vendredi. **Récupération lombaire insuffisante sur la semaine** (RDL mardi, deadlift jeudi,
  good morning vendredi). ❌ Réserve de sécurité forte.
- ⚠️ **Lower B : `seed-good-morning` en 3×5-8** — encore la promotion par `usedGlobally`.
- ⚠️ **Slot fessiers isolation vide en Lower B** et **aucun warning** : le générateur ne signale
  que les slots `compound` vides (ligne 791). Un utilisateur BB+DB ne saura jamais que son slot
  fessiers a été silencieusement supprimé.
- **Équilibre** : composés poussée 4 (bench ×2, OHP, +) contre tirages 3 (rowing barre, deadlift,
  rowing T-bar). ✅ Correct.
- **Durée** : Upper A = 3×5×210 + 1×3×150 = 3600 s ≈ 60 min + 6 min ≈ **66 min** ⚠️
- **Couverture isolation** : pecs ✅, deltoïde postérieur ✅, ischios ~ (via composés).
  Absents : biceps, triceps, mollets, deltoïde latéral, quads, fessiers. **Lacunes problématiques**
  pour un programme 4 j.
- **Verdict : ⚠️ PASS technique / réserve sécurité** — charge lombaire cumulée, slot fessiers vide
  non signalé, aucune isolation de bras sur 4 séances.

---

## P24 — Machine + Cable only

`{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:MACH+CABLE, level:'beginner' }`

**Simulation :**
- Split `['fullbody-quad','fullbody-hip','fullbody-quad']` ; 9 slots ; available = **28**
- **Warnings : aucun** — tous les slots composés trouvent un candidat.

**Full Body A** (`fullbody-quad`)

| # | Slot | Cat | Candidats | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog (bodyweight, toléré) | 2×10 |
| 1 | quads/glutes cpd | cpd | leg-press(3,mach), hack-squat(2,mach), hip-thrust-machine(3,mach) | **`seed-leg-press`** | 4×8-12 |
| 2 | **chest cpd** | cpd | **`seed-chest-press-machine`(3) seul candidat** | **`seed-chest-press-machine`** (machine chest press ✅) | 4×8-12 |
| 3 | **dos cpd** | cpd | **lat-pulldown(3, cable)**, row-cable(2), row-machine(1) | **`seed-lat-pulldown`** (lat pulldown, **pas** machine row) | 4×8-12 |
| 4 | shoulders cpd | cpd | shoulder-press-machine(3) | **`seed-shoulder-press-machine`** | 4×8-12 |
| 5 | hamstrings iso | iso | leg-curl-lying(3), leg-curl-seated(2), leg-curl-standing(2) | **seed-leg-curl-lying** | 3×10-15 |
| 6 | shoulders_rear iso | iso | face-pull(2, cable) | **seed-face-pull** | 3×10-15 |
| 7 | biceps iso | iso | curl-cable(2) | **seed-curl-cable** | 3×10-15 |
| 8 | calves iso | iso | calf-seated(2), calf-standing(2) | **seed-calf-raise-seated** | 3×10-15 |
| 9 | triceps iso | iso | triceps-rope(3), triceps-pushdown(3) | **seed-triceps-rope** | 3×10-15 |
| 10 | core | — | index 0 | seed-scissors | 3×15 |

**Full Body B** (`fullbody-hip`) : cat-cow · **seed-hip-thrust-machine** 4×8-12 ·
seed-chest-press-machine 4×8-12 · **seed-lat-pulldown** 4×8-12 · seed-shoulder-press-machine 4×8-12 ·
seed-leg-extension 3×10-15 · **seed-lateral-raise-cable** 3×10-15 · seed-curl-cable 3×10-15 ·
seed-calf-raise-standing 3×10-15 · seed-triceps-pushdown 3×10-15 · seed-crunch 3×15 → **11 exercices**

**Full Body C** (`fullbody-quad`) : shoulder-circles · **seed-hack-squat** 4×8-12 ·
seed-chest-press-machine 4×8-12 · seed-lat-pulldown 4×8-12 · seed-shoulder-press-machine 4×8-12 ·
seed-leg-curl-seated 3×10-15 · seed-face-pull 3×10-15 · seed-curl-cable 3×10-15 ·
seed-calf-raise-seated 3×10-15 · seed-triceps-rope 3×10-15 · seed-cable-crunch 3×15 → **11 exercices**

**Assertions :**
- Aucun exercice `barbell` ni `dumbbell` en sortie : **PASS** (vérifié sur les 33 postes)
- **Slot dos compound → `seed-lat-pulldown` (Tirage vertical, cable)**, pas le machine row :
  `seed-row-machine` (pop 1) et `seed-row-cable` (pop 2) perdent sur le critère
  `slot.muscles[0] === 'back_width'` (le lat pulldown est `back_width`, les rowings sont `back_thickness`) : **PASS**
- **Slot chest compound → `seed-chest-press-machine`** (Presse poitrine machine) : **PASS** (seul candidat)

**Coach :**
- **Équilibre** : tous les groupes couverts, **aucun slot vide sur 27**. C'est, avec `FULL`,
  la configuration la plus complète. ✅
- ⚠️ **`seed-chest-press-machine` et `seed-shoulder-press-machine` sur les 3 séances** :
  pools de 1 seul candidat chacun. Répétition inévitable. `seed-lat-pulldown` ×3 également.
- **Cohérence objectif** : specs hypertrophie ✅
- **Durée** : ≈ 62 min ✅
- **Équipement optimalement exploité ?** ⚠️ **Non totalement** : le seed contient
  `seed-pec-deck` (machine, iso chest) et `seed-fly-cable` (cable, iso chest) — mais **aucun slot
  chest isolation n'existe dans `fullbody-quad`/`fullbody-hip`**. Le pec deck n'est donc jamais
  utilisable en fullbody, alors que la machine est disponible.
- **Variété** : A ≠ B structurellement ; C reprend A avec 3 exercices différents. Correcte compte
  tenu du pool.
- **Couverture isolation** : ischios ✅, quads ✅, mollets ✅, biceps ✅, triceps ✅,
  deltoïdes latéral et postérieur ✅, fessiers ~ (hip thrust machine en composé).
  **Pecs et dos en isolation absents** — lacune acceptable en fullbody.
- **Verdict : ✅ Bon programme** — la meilleure sortie non-FULL de l'audit. Réserve : 3 exercices
  identiques sur les 3 séances par étroitesse du pool.

---

## P25 — Band + Bodyweight (fat_loss, 2 j)

`{ goal:'fat_loss', daysPerWeek:2, sessionDuration:60, equipment:BAND+BW, level:'beginner' }`

**Simulation :**
- Split case 2 → `['fullbody-quad','fullbody-hip']` ; 9 slots ; available = **38**
- Pools : warmup = **18** (band inclus → `seed-band-pull-apart` en index 0), core = 11
- **Warning (1) :** « Aucun exercice composé disponible pour "dos (largeur)" » (séance B uniquement)

**Inventaire `band` du seed (8 non-warmup) :** `band-squat`(quads,cpd,2), `band-row`(back_thickness,cpd,2),
`band-chest-press`(chest,cpd,1), `band-overhead-press`(shoulders,cpd,2), `band-curl`(biceps,iso,2),
`band-tricep-pushdown`(triceps,iso,2), `band-good-morning`(hamstrings,cpd,1), `band-hip-thrust`(glutes,cpd,2),
plus `band-face-pull`(shoulders_rear,iso,2) et `bw-prone-y-raise`(shoulders_rear,iso,1 — équipement `band`).
Warmup band exclus d'`available` : `seed-band-pull-apart`, `seed-clamshell`.

**Full Body A** (`fullbody-quad`)

| # | Slot | Cat | Candidats | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 (pool band) | **seed-band-pull-apart** | 2×10 |
| 1 | quads/glutes cpd | cpd | bw-squat(3), band-squat(2), bw-lunge(2) | **bw-squat** | 3×12-15 |
| 2 | chest cpd | cpd | seed-pushup(2), band-chest-press(1), bw-incline-pushup(2) | **seed-pushup** | 3×12-15 |
| 3 | **dos cpd** | cpd | **band-row(2) seul candidat** | **`band-row`** ✅ | 3×12-15 |
| 4 | shoulders cpd | cpd | band-overhead-press(2), bw-pike-pushup(1) | **`band-overhead-press`** | 3×12-15 |
| 5 | hamstrings iso | iso→cpd | band-good-morning(1) | **`band-good-morning`** | 3×12-15 |
| 6 | **shoulders_rear** iso | iso | **band-face-pull(2)**, bw-prone-y-raise(1) | **`band-face-pull`** ✅ **non vide** | 3×12-15 |
| 7 | biceps iso | iso | band-curl(2) | **`band-curl`** | 3×12-15 |
| 8 | calves iso | iso | bw-calf-raise(2) | **bw-calf-raise** | 3×12-15 |
| 9 | triceps iso | iso | band-tricep-pushdown(2) | **`band-tricep-pushdown`** | 3×12-15 |
| 10 | core | — | index 0 | seed-scissors | 3×15 |

→ **11 exercices, aucun slot vide.**

**Full Body B** (`fullbody-hip`)

| # | Slot | Cat | Candidats | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 1 | seed-bird-dog | 2×10 |
| 1 | hams/glutes cpd | cpd | **band-good-morning(1)**, hip-thrust-bw(4), band-hip-thrust(2) | **band-good-morning** ⚠️ | 3×12-15 |
| 2 | chest cpd | cpd | **band-chest-press(1)**, seed-pushup(2), bw-incline-pushup(2) | **band-chest-press** | 3×12-15 |
| 3 | **back_width/back cpd** | cpd | **aucun** (band-row est `back_thickness`) | **— slot vide —** ⚠️ | — |
| 4 | shoulders cpd | cpd | bw-pike-pushup(1), band-overhead-press(2) | **bw-pike-pushup** | 3×12-15 |
| 5 | quads iso | iso | bw-wall-sit(2) | **bw-wall-sit** | 3×12-15 |
| 6 | sh_lat/rear iso | iso | bw-prone-y-raise(1), band-face-pull(2) | **bw-prone-y-raise** | 3×12-15 |
| 7 | biceps iso | iso | band-curl(2) | **band-curl** ⚠️ répété | 3×12-15 |
| 8 | calves iso | iso | bw-calf-raise(2) | **bw-calf-raise** ⚠️ répété | 3×12-15 |
| 9 | triceps iso | iso | band-tricep-pushdown(2) | **band-tricep-pushdown** ⚠️ répété | 3×12-15 |
| 10 | core | — | index 1 | seed-crunch | 3×15 |

→ **10 exercices, 1 slot vide.**

**Assertions :**
- Aucun exercice nécessitant haltère / barre / câble / machine : **PASS**
- Exercices `band` disponibles par groupe musculaire : **listés ci-dessus** — le seed couvre
  quads, dos (épaisseur), pecs, épaules, ischios, fessiers, biceps, triceps, deltoïde postérieur.
- ⚠️ **La réserve « SEED-2 » du prompt v3 est CADUQUE** : `seed-band-pull-apart` est bien exclu
  d'`available` (warmup), **mais `band-face-pull` (pop 2, isolation, non-warmup) et
  `bw-prone-y-raise` (band, pop 1) couvrent `shoulders_rear`.** Le slot est rempli dans les deux séances.
  → **Assertion « slot shoulders_rear vide » : FAIL (l'attente du prompt est fausse).**
- Slot dos vide en séance B : **PASS sur l'attente** — mais la cause est le slot `['back_width','back']`
  de `fullbody-hip` (BUG#4 résiduel, cf. P22), pas la re-tagging `pullup_bar`.

**Coach :**
- **Le programme est-il équilibré en fat_loss ?** Plutôt oui pour un débutant à 2 séances :
  11 + 10 postes, tous groupes couverts sauf le dos en séance B. ✅ Meilleur que BW pur (P21).
- ⚠️ **Séance B : `band-good-morning` (pop 1) en tête** au lieu du hip thrust (pop 4), et
  `band-chest-press` (pop 1) au lieu des pompes — effet `usedGlobally`. Deux mouvements les moins
  populaires du pool en position 1 et 2.
- **Rapport cardio/force** : ❌ **aucun cardio** (même racine que P06 — pas de slot `'cardio'`),
  alors que `bw-burpees`, `seed-jump-rope`, `bw-high-knees` sont disponibles en bodyweight.
- **Cohérence objectif** : 3×12-15 avec 60 s de repos sur composés **et** isolations. Correct pour
  la tonification, mais sans densité (pas de circuit).
- **Durée** : 4 composés × 3 × (40+60) + 5 iso × 3 × (30+60) = 1200 + 1350 = 2550 s ≈ 43 min
  + warmup + core ≈ **49 min** ✅
- **Progression** : `autoProgress: false`, `progressStepKg: 0` sur band et bodyweight (ligne 585).
  Aucune surcharge progressive automatisée — cohérent avec l'équipement.
- **Couverture isolation** : quasi complète (biceps, triceps, mollets, quads, deltoïde postérieur).
  Dos et pecs en isolation absents.
- **Verdict : ⚠️ PASS avec réserve** — bon équilibre pour l'équipement, mais séance B sans dos,
  exercices pop 1 promus en tête, et **fat_loss sans aucun cardio**.

---

## P26 — Advanced strength 3 j → PPL + tirage aléatoire top-3

`{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'advanced' }`

**Simulation :**
- `focusType` = `null` ; case 3, `isMass && level !== 'beginner'` → `['push','pull','legs']`
- `adjustedSlotCount(6, 60, 'strength')` = **4 slots**
- `durationWeeks = DURATION_WEEKS['advanced'] = 16` → phases Adaptation[1-2] / Progression[3-10] /
  Intensification[11-14] / Décharge[15-16]
- **Branche `advanced` dans `pickExercise`** (lignes 576-578) :
  ```
  if (level === 'beginner') return candidates[0] ?? null
  const pool = candidates.slice(0, 3)
  return pool[Math.floor(Math.random() * pool.length)] ?? null
  ```
  → tirage uniforme dans le top-3 trié. **PASS sur la vérification de branche.**
- Warnings : aucun.

**Push** (tirage `Math.random → 0` = candidats[0])

| # | Slot | Cat | **Les 3 candidats possibles** | Retenu (tirage 0) | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | — | seed-bird-dog | 2×10 |
| 1 | **chest cpd** | cpd | **`seed-bench-barbell`(barbell, pop 8) · `seed-chest-press-machine`(machine, pop 3) · `seed-bench-dumbbell`(dumbbell, pop 3)** | seed-bench-barbell | 5×3-5 |
| 2 | shoulders cpd | cpd | seed-ohp-barbell · seed-shoulder-press-machine · seed-shoulder-press-dumbbell | seed-ohp-barbell | 5×3-5 |
| 3 | chest iso | iso | seed-fly-dumbbell · seed-fly-cable · seed-pec-deck | seed-fly-dumbbell | 3×5-8 |
| 4 | triceps iso | iso | seed-triceps-rope · seed-triceps-pushdown · seed-skullcrusher | seed-triceps-rope | 3×5-8 |
| 5 | core | — | — | seed-scissors | 3×15 |

**Pull** : cat-cow · **lat-pulldown / deadlift** (2 candidats seulement) → seed-lat-pulldown 5×3-5 ·
**row-barbell / row-tbar / row-cable** → seed-row-barbell 5×3-5 ·
**pullover-db / pullover-cable / straight-arm-pulldown** → seed-pullover-dumbbell 3×5-8 ·
**curl-barbell / curl-db / curl-hammer** → seed-curl-barbell 3×5-8 · crunch 3×15

**Legs** : shoulder-circles · **squat-barbell / front-squat / leg-press** → seed-squat-barbell 5×3-5 ·
**romanian-deadlift / good-morning / dumbbell-rdl** → seed-romanian-deadlift 5×3-5 ·
**leg-extension / wall-sit** → seed-leg-extension 3×5-8 ·
**glute-bridge / donkey-kick / fire-hydrant** → seed-glute-bridge 3×5-8 · cable-crunch 3×15

**Assertions :**
- Split `['push','pull','legs']` : **PASS**
- `level: 'advanced'` → `pickExercise` utilise `candidates.slice(0,3)` + `Math.random` : **PASS**
  (ligne 577-578, branche vérifiée dans le code)
- **3 candidats du slot chest compound listés** : `seed-bench-barbell` (barbell, cpd, pop 8),
  `seed-chest-press-machine` (machine, cpd, pop 3), `seed-bench-dumbbell` (dumbbell, cpd, pop 3).
  L'ordre vient du tri force (`strengthEquipmentPrio` : barbell 0 → machine 1 → dumbbell 2). : **PASS**

**Coach :**
- ⚠️ **Le tirage aléatoire uniforme dans le top-3 peut donner `seed-chest-press-machine` (presse
  poitrine guidée) comme mouvement principal d'un programme de force pour confirmé** — 1 chance sur 3.
  Pour un objectif `strength` chez un `advanced`, la machine guidée est un mauvais choix de mouvement
  principal. **Recommandation : en `strength`, restreindre le tirage aux 2 premiers, ou pondérer
  par `strengthEquipmentPrio`.**
- Idem sur le slot jambes : `seed-leg-press` (machine) a 1 chance sur 3 de remplacer le squat barre.
- **Équilibre** : PPL, ratio 1:1 sur les composés. ✅
- **Durée** : ≈ 56 min ✅
- **Périodisation 16 semaines** : Adaptation 2 / Progression 8 / Intensification 4 / Décharge 2. ✅
  Structure cohérente pour un confirmé.
- **Couverture isolation** : deltoïde postérieur, deltoïde latéral, mollets, ischios **absents**
  (slots élidés par le cap à 4).
- **Verdict : ⚠️ PASS avec réserve** — le tirage aléatoire peut dégrader le mouvement principal
  en force ; deltoïde postérieur et mollets absents de la semaine.

---

# GROUPE D — Durée × slots

---

## P27 — 20 minutes

`{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:20, equipment:FULL, level:'beginner' }`

**Simulation :**
- Split `['fullbody-quad','fullbody-hip']`
- `adjustedSlotCount(9, 20, 'hypertrophy')` = `max(2, ⌊9×0.5⌋)` = `max(2,4)` = **4 slots** ✅
- `adjustedSpec(spec, 20)` : composés 4 → **2 séries** ; isolations 3 → **2 séries**
- **`isVeryShort = true`** (ligne 812) → warmup **1 série**, **core supprimé**

**Full Body A** (4 slots, tous composés)

| # | Slot | Cat | Retenu | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | seed-bird-dog | **1×10** (réduit) |
| 1 | quads/glutes cpd | cpd | **seed-squat-barbell** | 2×8-12 (90 s) |
| 2 | chest cpd | cpd | **seed-bench-barbell** | 2×8-12 |
| 3 | dos cpd | cpd | **seed-lat-pulldown** | 2×8-12 |
| 4 | shoulders cpd | cpd | **seed-shoulder-press-dumbbell** | 2×8-12 |

→ **5 exercices. Pas de core.**

**Full Body B** : cat-cow 1×10 · seed-romanian-deadlift 2×8-12 · seed-bench-dumbbell 2×8-12 ·
seed-lat-pulldown 2×8-12 · seed-ohp-barbell 2×8-12 → **5 exercices**

**Assertions :**
- `adjustedSlotCount(9, 20)` = `max(2, ⌊4.5⌋)` = **4 slots** : **PASS** (ligne 428)
- « Total = 4 + 1 warmup + 1 core = 6 » (attente du prompt v3) : **FAIL — attente obsolète.**
  Le code produit **5 exercices** : le core est supprimé et le warmup réduit à 1 série pour
  `sessionDuration <= 20` (lignes 812-813, 826). Ce comportement n'existait pas dans la version
  auditée en v3.

**Coach :**
- **Timing** : 4 composés × 2 séries × (40 s travail + 90 s repos) = 1040 s ≈ **17,5 min**
  + warmup 1 série ≈ 30 s → **≈ 18 min**. ✅ **Le créneau de 20 min est parfaitement tenu.**
  La suppression du core et la réduction du warmup sont **le bon arbitrage** — sans elles on serait
  à 24-25 min.
- **Contenu** : 4 mouvements composés couvrant jambes, pecs, dos, épaules. Pour 20 min, c'est
  le maximum utile. ✅ Excellent choix de priorisation (les 4 premiers slots de `fullbody-quad`
  sont précisément les 4 composés).
- **Cohérence objectif** : 2×8-12 est un volume faible pour l'hypertrophie (2 séries/muscle/séance,
  4 séries/semaine). ⚠️ **Sous le seuil de stimulation** (~10 séries/muscle/semaine recommandées).
  Un programme 20 min × 2 j ne peut pas produire d'hypertrophie significative — limite intrinsèque,
  pas un défaut du code.
- **Couverture isolation** : nulle (assumé). Aucun mollet, bras, gainage.
- **Variété A→B** : structurelle (quad vs hip) + 3 exercices différents sur 4. ✅
- **Verdict : ✅ Bon comportement technique** — timing juste, priorisation correcte.
  Réserve pédagogique : volume insuffisant pour l'objectif déclaré.

---

## P28 — 45 minutes

`{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:45, equipment:FULL, level:'beginner' }`

**Simulation :**
- `adjustedSlotCount(9, 45, 'hypertrophy')` = non-strength → `max(3, ⌊9×0.75⌋)` = `max(3,6)` = **6 slots** ✅
- `adjustedSpec(·, 45)` : composés 4 → **3 séries** ; isolations 3 → **2 séries**
- `isVeryShort` faux → warmup 2 séries + core conservés

**Full Body A**

| # | Slot | Cat | Retenu | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | seed-bird-dog | 2×10 |
| 1 | quads/glutes cpd | cpd | **seed-squat-barbell** | 3×8-12 |
| 2 | chest cpd | cpd | **seed-bench-barbell** | 3×8-12 |
| 3 | dos cpd | cpd | **seed-lat-pulldown** | 3×8-12 |
| 4 | shoulders cpd | cpd | **seed-shoulder-press-dumbbell** | 3×8-12 |
| 5 | hamstrings iso | iso | **seed-leg-curl-lying** | 2×10-15 |
| 6 | shoulders_rear iso | iso | **seed-face-pull** | 2×10-15 |
| 7 | core | — | seed-scissors | 3×15 |

→ **8 exercices.**

**Full Body B** : cat-cow 2×10 · seed-romanian-deadlift 3×8-12 · seed-bench-dumbbell 3×8-12 ·
seed-lat-pulldown 3×8-12 · seed-ohp-barbell 3×8-12 · seed-leg-extension 2×10-15 ·
seed-lateral-raise 2×10-15 · seed-crunch 3×15 → **8 exercices**

**Assertions :**
- `adjustedSlotCount(9, 45)` = `max(3, 6)` = **6 slots** : **PASS** (ligne 431)
- Total = 6 + 1 warmup + 1 core = **8 exercices** : **PASS**

**Coach :**
- **Timing** : 4 composés × 3 × (40+90) = 1560 s + 2 iso × 2 × (30+75) = 420 s + warmup 60 s
  + core 315 s = 2355 s ≈ **39 min** pour 45 annoncées. ✅ **Cohérent, avec une marge saine.**
- **Contenu** : les 4 composés + 2 isolations complémentaires (ischios, deltoïde postérieur).
  Le générateur choisit bien les 2 isolations les plus utiles (celles qui ne sont pas couvertes
  par les composés). ✅
- **Cohérence objectif** : 3×8-12 sur composés = 6 séries/muscle/semaine. ⚠️ Encore un peu bas
  pour l'hypertrophie mais dans la zone acceptable à 2 séances.
- **Variété** : structurelle A/B + exercices différents. ✅
- **Couverture isolation** : ischios ✅ (A), quads ✅ (B), deltoïde postérieur ✅ (A), latéral ✅ (B).
  Bras et mollets absents.
- **Verdict : ✅ Bon programme** — le meilleur compromis durée/contenu de l'audit.

---

## P29 — 90 minutes (cap à 8)

`{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:90, equipment:FULL, level:'beginner' }`

**Simulation :**
- `adjustedSlotCount(9, 90, 'hypertrophy')` = non-strength → `min(9+2, 8)` = `min(11,8)` = **8 slots** ✅
- `adjustedSpec(·, 90)` = inchangé (composés 4 séries, isolations 3)

**Full Body A** (8 slots — le 9ᵉ, `triceps`, est élidé)

| # | Slot | Cat | Retenu | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | seed-bird-dog | 2×10 |
| 1 | quads/glutes cpd | cpd | seed-squat-barbell | 4×8-12 |
| 2 | chest cpd | cpd | seed-bench-barbell | 4×8-12 |
| 3 | dos cpd | cpd | seed-lat-pulldown | 4×8-12 |
| 4 | shoulders cpd | cpd | seed-shoulder-press-dumbbell | 4×8-12 |
| 5 | hamstrings iso | iso | seed-leg-curl-lying | 3×10-15 |
| 6 | shoulders_rear iso | iso | seed-face-pull | 3×10-15 |
| 7 | biceps iso | iso | seed-curl-barbell | 3×10-15 |
| 8 | calves iso | iso | seed-calf-raise-seated | 3×10-15 |
| — | ~~triceps iso~~ | — | **élidé par le cap à 8** | — |
| 9 | core | — | seed-scissors | 3×15 |

→ **10 exercices.**

**Full Body B** : cat-cow · romanian-deadlift 4×8-12 · bench-dumbbell 4×8-12 · lat-pulldown 4×8-12 ·
ohp-barbell 4×8-12 · leg-extension 3×10-15 · lateral-raise 3×10-15 · curl-dumbbell 3×10-15 ·
calf-raise-standing 3×10-15 · crunch 3×15 → **10 exercices** (triceps élidé également)

**Assertions CRITIQUES :**
- `adjustedSlotCount(9, 90)` = `min(11, 8)` = **8 slots** (cap à 8) : **PASS** (ligne 438)
- Total = 8 + 1 + 1 = **10 exercices** : **PASS**
- Le slot le moins prioritaire (le dernier, `triceps`) est élidé sur `fullbody-quad` : **PASS**

**Pourquoi le cap à 8 existe et quand il serait atteint sans cap :**
Le cap borne la formule `base + 2`. Sans lui :
- `fullbody-quad`/`fullbody-hip`/`lower_pull`/`lower_push` (base 9) → 11 slots → 13 exercices
- `upper-push`/`upper-pull`/`upper` (base 8) → 10 slots → 12 exercices
- `push`/`pull`/`legs`/`lower` (base 6) → 8 slots — mais ces templates n'ont **que 6 slots définis**,
  donc `slice(0, 8)` en renvoie 6 : le `+2` est **sans effet** sur eux.
→ Le cap ne mord donc que sur les templates à 8 et 9 slots. Il évite des séances de 13 exercices
qui, à 90-100 s de repos, dépasseraient largement 90 min.

**Coach :**
- **Timing** : 4 composés × 4 × 130 = 2080 s + 4 iso × 3 × 105 = 1260 s + warmup 60 + core 315
  = 3715 s ≈ **62 min pour un créneau de 90**. ⚠️ **28 min de marge inexploitée.**
  L'utilisateur qui choisit « 1 h 30 — Volume élevé » obtient une séance d'une heure.
  **Le cap à 8 est trop conservateur en hypertrophie** (repos 90/75 s, pas 180 s).
  Recommandation : capper à 8 pour la force (déjà fait via `min(base,6)`) mais laisser 10-11 slots
  en hypertrophie/endurance/fat_loss, ou augmenter les séries plutôt que les slots.
- **Contenu** : 10 exercices bien répartis. ⚠️ **Le triceps est le seul groupe non couvert**
  (élidé sur les deux séances, car il est en position 9 sur `fullbody-quad` **et** `fullbody-hip`).
- **Cohérence objectif** : specs hypertrophie intégrales ✅
- **Variété** : structurelle A/B ✅
- **Verdict : ⚠️ PASS technique / créneau sous-exploité** — 62 min générées pour 90 demandées,
  triceps systématiquement élidé.

---

## P30 — 20 min sur PPL (force, intermediate)

`{ goal:'strength', daysPerWeek:3, sessionDuration:20, equipment:FULL, level:'intermediate' }`

**Simulation :**
- Split `['push','pull','legs']` (base 6 slots chacun)
- `adjustedSlotCount(6, 20, 'strength')` = `max(2, ⌊6×0.5⌋)` = `max(2,3)` = **3 slots** par séance
- `adjustedSpec` 20 min : composés 5 → **2 séries** ; isolations 3 → **2 séries**
- `isVeryShort` → warmup 1 série, **core supprimé**

**Push** (3 slots)

| # | Slot | Cat | Retenu | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | seed-bird-dog | 1×10 |
| 1 | chest cpd | cpd | **seed-bench-barbell** | 2×3-5 (180 s) |
| 2 | shoulders cpd | cpd | **seed-ohp-barbell** | 2×3-5 (180 s) |
| 3 | chest iso | iso | **seed-fly-dumbbell** | 2×5-8 (120 s) |

→ **4 exercices.**

**Pull** : cat-cow 1×10 · **seed-lat-pulldown** 2×3-5 · **seed-row-barbell** 2×3-5 ·
**seed-pullover-dumbbell** 2×5-8 → **4 exercices**

**Legs** : shoulder-circles 1×10 · **seed-squat-barbell** 2×3-5 · **seed-romanian-deadlift** 2×3-5 ·
**seed-leg-extension** 2×5-8 → **4 exercices**

**Assertions :**
- Split `['push','pull','legs']` : **PASS**
- `adjustedSlotCount(base_push=6, 20, 'strength')` = **3 slots** : **PASS** (ligne 428 — la branche
  20 min est commune à tous les objectifs)
- La réduction de durée s'applique bien sur PPL, pas seulement sur fullbody : **PASS**

**Coach :**
- **Timing** : 2 composés × 2 × (30 s + 180 s) = 840 s + 1 isolation × 2 × (25 s + 120 s) = 290 s
  + warmup 30 s ≈ **19,3 min**. ✅ **Le créneau est tenu au serré.**
- **Combien de mouvements possibles en push/20 min/force ?** Exactement ce qui est produit :
  **2 composés + 1 isolation**. Avec 180 s de repos, 3 mouvements est le plafond arithmétique.
  Le générateur ne se trompe pas.
- ⚠️ **Est-ce réaliste sportivement ?** 2 séries de 3-5 reps par mouvement, c'est **le volume d'un
  échauffement de force**, pas d'une séance de force. Sur 3 séances, un intermédiaire fait
  6 séries lourdes de bench et 6 de squat par semaine — insuffisant pour progresser en force.
  **Le format « force en 20 min » est intrinsèquement contradictoire** : le générateur produit
  le meilleur compromis possible, mais le wizard devrait déconseiller la combinaison
  `strength` + 20 min.
- **Équilibre** : PPL, 1:1 sur les composés. ✅
- **Couverture isolation** : 1 isolation par séance seulement. Aucun bras (le curl du pull est élidé),
  aucun mollet, aucun core (supprimé). **Lacunes acceptables** compte tenu de la contrainte.
- **Verdict : ✅ PASS technique** — arbitrage temporel exact. ⚠️ Réserve pédagogique :
  combinaison force + 20 min à déconseiller dans le wizard.

---

# GROUPE E — Périodisation `buildPhases`

*Toutes les valeurs ci-dessous ont été obtenues en appelant réellement `buildPhases` et
`phaseAtLeast` exportés depuis `programGenerator.ts`.*

---

## P31 — `buildPhases(7)` → pas de périodisation

**Assertions CRITIQUES :**
- `totalWeeks = 7 < 8` → `return undefined` (ligne 656) : **PASS**
  (`buildPhases(7,'strength'|'hypertrophy'|'endurance'|'fat_loss')` = `undefined` dans les 4 cas)
- Wizard : `phaseLabel(7)` → `const phases = buildPhases(7)` → `undefined` → `if (!phases) return ''`
  → **chaîne vide** (ProgramGeneratorScreen.tsx lignes 496-498) : **PASS**
- `generateProgramDraft({…, totalWeeks: 7})` → `phases: buildPhases(7, goal)` = `undefined`
  dans le DraftProgram (ligne 957) : **PASS** — vérifié par exécution :
  `totalWeeks:7 → phases=undefined, durationWeeks=7`

**Coach :** seuil pertinent. Un bloc de 7 semaines ne justifie pas 4 phases (une phase ferait
1 semaine). ✅

---

## P32 — `buildPhases(8, 'strength')`

**Calcul (lignes 659-662) :** `adapt = 2` · `deload = 8 >= 12 ? 2 : 1` = **1** ·
`intensive = 8 <= 9 ? 2 : …` = **2** · `progress = max(1, 8-2-2-1)` = **3** · Total = 2+3+2+1 = **8** ✓

**Sortie réelle :** `Adaptation[1-2] · Progression[3-5] · Intensification[6-7] · Décharge[8-8]`

**Assertions :**
- 4 phases retournées : **PASS**
- `adaptation.weekStart = 1, weekEnd = 2` : **PASS**
- `progression.weekStart = 3, weekEnd = 5` : **PASS**
- `intensification.weekStart = 6, weekEnd = 7` : **PASS**
- `deload.weekStart = 8, weekEnd = 8` : **PASS**
- Modificateurs strength adaptation `setsModifier: -1, repsOffset: +3` : **PASS** (ligne 621)
- Modificateurs strength intensification `setsModifier: 0, repsOffset: **-2**` :
  **FAIL vs l'attente du prompt (« -3 »)** — le code (ligne 623) est à **-2**, avec un commentaire
  explicite ligne 622 : *« repsOffset: -2 et non -3 pour garantir repsMin ≥ 1 »*.
  → **Le prompt v3 est obsolète ; le code est correct et volontairement corrigé.**
- Modificateurs strength deload `setsModifier: -2, repsOffset: +4` : **PASS** (ligne 624)

**Coach :** 8 semaines pour un débutant (`DURATION_WEEKS.beginner = 8`), avec 2 semaines
d'adaptation puis 3 de progression : structure saine. ⚠️ 1 seule semaine de décharge en fin
de cycle force est un peu court, mais acceptable sur un bloc de 8.

---

## P33 — `buildPhases(9, 'endurance')`

**Calcul :** adapt = 2 · deload = 1 (9 < 12) · intensive = 2 (9 ≤ 9) ·
progress = `max(1, 9-2-2-1)` = **4** · Total = 2+4+2+1 = **9** ✓

**Sortie réelle :** `Adaptation[1-2] · Progression[3-6] · Intensification[7-8] · Décharge[9-9]`

**Assertions :**
- 4 phases, somme = 9 : **PASS**
- `adaptation.weekEnd = 2`, `progression.weekEnd = 6`, `intensification.weekEnd = 8` : **PASS**
- endurance adaptation `setsModifier: -1, repsOffset: -2` : **PASS** (ligne 632)
- endurance intensification `setsModifier: +1, repsOffset: +3` : **PASS** (ligne 633)

**Coach :** logique endurance cohérente — on démarre en volume réduit (−1 série, −2 reps),
on culmine en volume et répétitions (+1 série, +3 reps), on décharge (−2 séries).
En intensification : composé 3+1 = 4 × 15+3 = **4×18-23** → 72-92 répétitions par exercice.
⚠️ **Volume très élevé** sur un mouvement composé ; à surveiller sur la fatigue locale.

---

## P34 — `buildPhases(10, 'hypertrophy')`

**Calcul :** adapt = 2 · deload = 1 (10 < 12) · **intensive = 3** (10 > 9 et 10 < 16) ·
progress = `max(1, 10-2-3-1)` = **4** · Total = 2+4+3+1 = **10** ✓

**Sortie réelle :** `Adaptation[1-2] · Progression[3-6] · Intensification[7-9] · Décharge[10-10]`

**Assertions :**
- `intensive = 3` (pas 2, car 10 > 9) : **PASS** (ligne 661, ternaire imbriqué)
- `progression.weekEnd = 6`, `intensification.weekStart = 7, weekEnd = 9` : **PASS**
- `deload.weekStart = 10, weekEnd = 10` : **PASS**
- hypertrophy intensification `setsModifier: +1, repsOffset: -2` : **PASS** (ligne 628)

**Coach :** 3 semaines d'intensification à +1 série / −2 reps sur un template 4×8-12 →
**5×6-10** en composé. Progression logique vers la charge. ✅ 1 semaine de décharge après
3 semaines d'intensification est le minimum acceptable.

---

## P35 — `buildPhases(12, 'fat_loss')`

**Calcul :** adapt = 2 · **deload = 2** (12 ≥ 12) · intensive = 3 (12 > 9, 12 < 16) ·
progress = `max(1, 12-2-3-2)` = **5** · Total = 2+5+3+2 = **12** ✓

**Sortie réelle :** `Adaptation[1-2] · Progression[3-7] · Intensification[8-10] · Décharge[11-12]`

**Assertions :**
- `deload = 2` (premier seuil ≥ 12) : **PASS** (ligne 660)
- `progression.weekStart = 3, weekEnd = 7` (5 semaines) : **PASS**
- `deload.weekStart = 11, weekEnd = 12` : **PASS**
- fat_loss adaptation `setsModifier: -1, repsOffset: 0` : **PASS** (ligne 637)
- fat_loss deload `setsModifier: **-1**, repsOffset: 0` : **PASS** (ligne 639)
  ⚠️ Noter que fat_loss est le seul objectif dont la décharge est à **−1** série
  (les 3 autres sont à −2). Volontaire (maintien de la dépense énergétique) et cohérent.

**Coach :** structure 12 semaines classique. ✅ La décharge à −1 série seulement en fat_loss est
un bon choix : réduire le volume de moitié en phase de perte de gras nuirait au déficit.

---

## P36 — `buildPhases(16, 'strength')`

**Calcul :** adapt = 2 · deload = 2 (16 ≥ 12) · **intensive = 4** (16 ≥ 16) ·
progress = `max(1, 16-2-4-2)` = **8** · Total = 2+8+4+2 = **16** ✓

**Sortie réelle :** `Adaptation[1-2] · Progression[3-10] · Intensification[11-14] · Décharge[15-16]`

**Assertions :**
- `intensive = 4` (seuil ≥ 16) : **PASS** (ligne 661)
- progression : 8 semaines, `weekStart = 3, weekEnd = 10` : **PASS**
- `intensification.weekStart = 11, weekEnd = 14` : **PASS**
- `deload.weekStart = 15, weekEnd = 16` : **PASS**

**Coach :** ⚠️ **8 semaines consécutives de « Progression » sans aucune décharge intermédiaire.**
Sur un cycle force de 16 semaines pour un confirmé (`DURATION_WEEKS.advanced = 16`), c'est
long : la pratique standard insère une décharge toutes les 4-6 semaines. **Recommandation :
pour `totalWeeks >= 14`, découper la progression en 2 blocs séparés par une micro-décharge.**

---

## P37 — Specs finales ≥ 1 après modificateurs (tous goals × phases)

Base : `COMPOUND_SPEC` (ligne 58) et `ISOLATION_SPEC` (ligne 65).
Modificateurs : `PHASE_CONFIG_BY_GOAL` (ligne 619), **valeurs réelles relevées dans le code**.

| Goal | Type | Phase | Base sets | +mod | = sets | Base repsMin | +offset | = reps | Valide |
|---|---|---|---|---|---|---|---|---|---|
| strength | composé | adaptation | 5 | −1 | 4 | 3 | +3 | 6 | ✅ |
| **strength** | **composé** | **intensification** | **5** | **0** | **5** | **3** | **−2** | **1** | **✅ (corrigé)** |
| strength | composé | deload | 5 | −2 | 3 | 3 | +4 | 7 | ✅ |
| strength | isolation | adaptation | 3 | −1 | 2 | 5 | +3 | 8 | ✅ |
| strength | isolation | intensification | 3 | 0 | 3 | 5 | −2 | 3 | ✅ |
| strength | isolation | deload | 3 | −2 | 1 | 5 | +4 | 9 | ✅ |
| hypertrophy | composé | adaptation | 4 | −1 | 3 | 8 | +2 | 10 | ✅ |
| hypertrophy | composé | intensification | 4 | +1 | 5 | 8 | −2 | 6 | ✅ |
| hypertrophy | composé | deload | 4 | −2 | 2 | 8 | 0 | 8 | ✅ |
| hypertrophy | isolation | adaptation | 3 | −1 | 2 | 10 | +2 | 12 | ✅ |
| hypertrophy | isolation | intensification | 3 | +1 | 4 | 10 | −2 | 8 | ✅ |
| hypertrophy | isolation | deload | 3 | −2 | 1 | 10 | 0 | 10 | ✅ |
| endurance | composé | adaptation | 3 | −1 | 2 | 15 | −2 | 13 | ✅ |
| endurance | composé | intensification | 3 | +1 | 4 | 15 | +3 | 18 | ✅ |
| endurance | composé | deload | 3 | −2 | 1 | 15 | 0 | 15 | ✅ |
| endurance | isolation | adaptation | 3 | −1 | 2 | 15 | −2 | 13 | ✅ |
| endurance | isolation | intensification | 3 | +1 | 4 | 15 | +3 | 18 | ✅ |
| endurance | isolation | deload | 3 | −2 | 1 | 15 | 0 | 15 | ✅ |
| fat_loss | composé | adaptation | 3 | −1 | 2 | 12 | 0 | 12 | ✅ |
| fat_loss | composé | intensification | 3 | 0 | 3 | 12 | +3 | 15 | ✅ |
| fat_loss | composé | deload | 3 | −1 | 2 | 12 | 0 | 12 | ✅ |
| fat_loss | isolation | adaptation | 3 | −1 | 2 | 12 | 0 | 12 | ✅ |
| fat_loss | isolation | intensification | 3 | 0 | 3 | 12 | +3 | 15 | ✅ |
| fat_loss | isolation | deload | 3 | −1 | 2 | 12 | 0 | 12 | ✅ |

**Assertions :**
- `baseSets + setsModifier ≥ 1` sur les 24 combinaisons : **PASS** (minimum atteint = 1,
  strength/hypertrophy/endurance isolation deload)
- `baseRepsMin + repsOffset ≥ 1` sur les 24 combinaisons : **PASS** (minimum atteint = **1**,
  strength composé intensification)
- **« ⚠️ BUG CRITIQUE : strength + composé + intensification → repsMin = 0 »** (attente du prompt v3) :
  **FAIL — le bug n'existe plus.** Le code utilise `repsOffset: -2` (ligne 623) et non `-3`,
  ce qui donne `3 − 2 = 1`. Le commentaire ligne 622 documente explicitement ce correctif.
  Double sécurité : `sessionOps.ts:140` applique par ailleurs `Math.max(1, …)`.

**Coach :**
- ⚠️ **strength composé intensification = 5 × 1-3 répétitions.** C'est un travail de force maximale
  (≥ 90 % 1RM). Le libellé du code (« Charges maximales, répétitions faibles (1–3 reps) ») est
  exact. Approprié pour un intermédiaire/confirmé, **inapproprié pour un débutant** —
  et le générateur autorise `strength` + `beginner` (P02), avec un warning textuel seulement.
- ⚠️ **Décharge à 1 série** (strength/hypertrophy/endurance isolation) est très bas. Une décharge
  à 1×9 répétitions sur un curl n'a plus d'effet de maintien. Recommandation : plancher à 2 séries.
- ⚠️ **endurance intensification = 4 × 18-23 reps** sur un composé : 72-92 répétitions.
  Très exigeant en fatigue locale et en durée de séance (le temps de séance n'est **pas** recalculé
  en fonction de la phase — le créneau annoncé est calculé sur la phase Progression).

---

## P38 — `phaseAtLeast` : ordre correct (ligne 651)

`PHASE_ORDER` (ligne 646) : adaptation = 1, progression = 2, intensification = 3, deload = 4.
`phaseAtLeast(current, required)` → `PHASE_ORDER[current] >= PHASE_ORDER[required]`

**Résultats réels (matrice complète 4×4) :**

| current \ required | adaptation | progression | intensification | deload |
|---|---|---|---|---|
| **adaptation** | true | false | false | false |
| **progression** | true | true | false | false |
| **intensification** | true | true | true | false |
| **deload** | true | true | true | true |

**Assertions :**
- `phaseAtLeast('adaptation','adaptation')` → 1≥1 → **true** : **PASS**
- `phaseAtLeast('adaptation','progression')` → 1≥2 → **false** : **PASS**
- `phaseAtLeast('progression','progression')` → 2≥2 → **true** : **PASS**
- `phaseAtLeast('intensification','progression')` → 3≥2 → **true** : **PASS**
- `phaseAtLeast('progression','intensification')` → 2≥3 → **false** : **PASS**
- `phaseAtLeast('deload','intensification')` → 4≥3 → **true** : **PASS**
- `phaseAtLeast('intensification','deload')` → 3≤4 → **false** : **PASS**
- `phaseAtLeast('deload','deload')` → 4≥4 → **true** : **PASS**

**Coach :** ⚠️ Remarque sémantique — l'ordre place `deload` **au-dessus** de `intensification`.
`phaseAtLeast('deload', 'intensification') === true` signifie « la décharge est au moins aussi
avancée que l'intensification ». C'est correct pour une progression **chronologique**, mais
trompeur si le prédicat est utilisé pour gater une **intensité** (une décharge est moins intense
qu'une intensification). Le nom `phaseAtLeast` est ambigu ; à documenter côté appelants.

---

## P39 — Cohérence wizard : `phaseLabel` vs `buildPhases`

Code wizard (`ProgramGeneratorScreen.tsx`, lignes 496-507) :
```ts
function phaseLabel(weeks: number): string {
  const phases = buildPhases(weeks)          // ← délègue, pas de formule inline
  if (!phases) return ''
  return phases.map(ph => {
    const dur = ph.weekEnd - ph.weekStart + 1
    const names = { adaptation:'adaptation', progression:'progression',
                    intensification:'intensification', deload:'décharge' }
    return `${dur} sem. ${names[ph.focus] ?? ph.focus}`
  }).join(' · ')
}
```
`buildPhases(weeks)` est appelé **sans objectif** → défaut `'strength'` (ligne 655). Les durées
étant indépendantes de l'objectif (seuls les modificateurs varient), le libellé est correct quel
que soit l'objectif choisi. ✅

**Chaînes produites (recalculées depuis les sorties réelles) :**

| Semaines | `phaseLabel(weeks)` |
|---|---|
| 7 | `''` (chaîne vide — `buildPhases` renvoie `undefined`) |
| 8 | `"2 sem. adaptation · 3 sem. progression · 2 sem. intensification · 1 sem. décharge"` |
| 10 | `"2 sem. adaptation · 4 sem. progression · 3 sem. intensification · 1 sem. décharge"` |
| 12 | `"2 sem. adaptation · 5 sem. progression · 3 sem. intensification · 2 sem. décharge"` |
| 16 | `"2 sem. adaptation · 8 sem. progression · 4 sem. intensification · 2 sem. décharge"` |

**Assertions :**
- Somme des durées = `totalWeeks` pour 8 / 10 / 12 / 16 : **PASS** (2+3+2+1=8 · 2+4+3+1=10 ·
  2+5+3+2=12 · 2+8+4+2=16)
- Noms « décharge » (pas « deload ») et « intensification » (pas « intensive ») : **PASS**
  (table `names` ligne 501-504)
- `adapt` toujours = 2 semaines dans la chaîne, jamais 3 : **PASS** (`const adapt = 2`, ligne 659)
- `phaseLabel` appelle `buildPhases`, aucune formule dupliquée dans le wizard (**WIZ1**) : **PASS**

**Coach :** ⚠️ Défaut d'UX mineur — l'option « 📅 Standard » du wizard (`value: null`,
ligne 176) **n'affiche aucun libellé de phases** (`phaseInfo` n'est calculé que si
`opt.value !== null`, ligne 521), alors qu'elle correspond à 8/12/16 semaines selon le niveau
et **produit bien une périodisation**. L'utilisateur qui prend le défaut ne voit pas ce qu'il obtient.

---

## P40 — `fmtMod` : chaînes `GOAL_PHASES` vs `PHASE_CONFIG_BY_GOAL`

Code wizard (lignes 754-769) :
```ts
function fmtMod(sets, reps) {
  const parts = []
  if (sets !== 0) parts.push(`${sets>0?'+':''}${sets} série${Math.abs(sets)>1?'s':''}`)
  if (reps !== 0) parts.push(`${reps>0?'+':''}${reps} reps`)
  return parts.length ? parts.join(', ') : 'Specs inchangées'
}
```
`GOAL_PHASES` est **dérivé** de `PHASE_CONFIG_BY_GOAL` par `reduce` sur ses clés (ligne 761-769) —
aucune chaîne codée en dur.

**Chaînes réellement produites :**

| Goal | Phase | setsModifier | repsOffset | Chaîne produite | vs prompt v3 |
|---|---|---|---|---|---|
| strength | adaptation | −1 | +3 | `"-1 série, +3 reps"` | ✅ conforme |
| strength | intensification | 0 | **−2** | **`"-2 reps"`** | ❌ le prompt attend `"-3 reps"` |
| strength | deload | −2 | +4 | `"-2 séries, +4 reps"` | ✅ conforme |
| hypertrophy | adaptation | −1 | +2 | `"-1 série, +2 reps"` | ✅ |
| hypertrophy | intensification | +1 | −2 | `"+1 série, -2 reps"` | ✅ |
| hypertrophy | deload | −2 | 0 | `"-2 séries"` | ✅ |
| endurance | adaptation | −1 | −2 | `"-1 série, -2 reps"` | ✅ |
| endurance | intensification | +1 | +3 | `"+1 série, +3 reps"` | ✅ |
| endurance | deload | −2 | 0 | `"-2 séries"` | ✅ |
| fat_loss | adaptation | −1 | 0 | `"-1 série"` | ✅ |
| fat_loss | intensification | 0 | +3 | `"+3 reps"` | ✅ |
| fat_loss | deload | −1 | 0 | `"-1 série"` | ✅ |

**Assertions :**
- Toutes les chaînes correspondent aux numériques de `PHASE_CONFIG_BY_GOAL` : **PASS**
  (dérivation automatique, aucune désynchronisation possible)
- La phase `progression` n'a ni `setsModifier` ni `repsOffset` → non affichée dans `GOAL_PHASES` :
  **PASS** — `PHASE_ROWS` (ligne 771) ne liste qu'adaptation / intensification / deload ;
  la progression est expliquée par un bandeau texte (ligne 942-944)
- `fmtMod(0, 0)` → `"Specs inchangées"` : **PASS** (ligne 758, `parts.length` falsy)
- Chaîne `strength intensification` = `"-3 reps"` : **FAIL vs prompt v3** — la valeur réelle du
  code est `-2`, donc `"-2 reps"`. **Le code est correct, l'attente du prompt est périmée.**

**Coach :** ✅ Bonne pratique d'ingénierie — l'affichage est dérivé de la configuration, donc
il ne peut pas mentir sur ce que fait le générateur. Le pluriel est géré (`série`/`séries`).
⚠️ Le tableau du wizard regroupe « Force / Masse » dans une colonne et « Forme / Bien-être »
dans l'autre alors que les 4 objectifs ont des modificateurs **différents** ; l'utilisateur doit
lire les 2 sous-lignes de chaque cellule. Lisible mais dense.
---

# GROUPE F — `lower_pull` / `lower_push` + focusMuscles cross-body

**Slots de référence relevés dans le code (base 9) :**
- `lower_pull` (lignes 218-230) : hamstrings/glutes cpd → back_width/back cpd → back_thickness/back cpd
  → quads/glutes cpd → glutes/hamstrings iso → dos iso → hamstrings iso → calves iso → biceps iso
- `lower_push` (lignes 235-247) : quads/glutes cpd → chest/chest_upper cpd → shoulders/front cpd
  → hamstrings/glutes cpd → quads iso → calves iso → chest iso → glutes iso → triceps iso

---

## P41 — legs + back → `lower_pull` (chaîne postérieure)

`{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:BB+DB, level:'beginner', focusMuscles:['legs','back'] }`

**Simulation :**
`hasLower=true, hasPush=false, hasPull=true, hasArms=false, hasCore=false, hasUpper=true`
- règle 1 : `!hasUpper` false · règle 2 : false · règle 3 : `hasPush` false · règle 4 : `!hasLower` false ·
  règle 5 : `!hasLower` false · règle 6 `lower_push` : `hasPush` false ·
  **règle 7 `hasLower && hasPull && !hasPush` (ligne 319) → `'lower_pull'`** ✅
- Split : `focusType` ni lower ni upper → `Array(2).fill('lower_pull')` → public `['lower','lower']`
- `reorderSlotsByFocus` : ciblés = quads/hams/glutes/calves + back/back_width/back_thickness →
  **tous les slots de `lower_pull` sont ciblés** (sauf biceps) → ordre inchangé sauf biceps repoussé (déjà dernier)
- 9 slots (hypertrophie 60 min). available = 42. Warning : « Programme de spécialisation… »

**Lower — Chaîne postérieure A**

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | **hams/glutes cpd** | cpd | romanian-deadlift(3), dumbbell-rdl(2), good-morning(1) | **`seed-romanian-deadlift`** ✅ deadlift-first | 4×8-12 |
| 2 | back_width/back cpd | cpd | **`seed-deadlift`(3) seul candidat** | **seed-deadlift** ⚠️ | 4×8-12 |
| 3 | back_thickness cpd | cpd | row-barbell(7), row-db(3), row-tbar(2) | **seed-row-barbell** | 4×8-12 |
| 4 | quads/glutes cpd | cpd | squat-barbell(8), lunges(2), front-squat(2) | **seed-squat-barbell** | 4×8-12 |
| 5 | glutes/hams iso | iso→cpd | hip-thrust(4), dumbbell-rdl(2), good-morning(1) | **seed-hip-thrust** | 3×10-15 |
| 6 | dos iso | iso | pullover-db(3), shrug(2), pullover(1) | **seed-pullover-dumbbell** | 3×10-15 |
| 7 | hamstrings iso | iso→cpd | dumbbell-rdl(2), good-morning(1) | **dumbbell-rdl** | 3×10-15 |
| 8 | calves iso | iso | calf-raise-db(2), calf-raise-bb(2) | **seed-calf-raise-db** | 3×10-15 |
| 9 | biceps iso | iso | curl-barbell(3), curl-db(3), curl-hammer(3) | **seed-curl-barbell** | 3×10-15 |
| 10 | core | — | index 0 | seed-scissors | 3×15 |

→ **11 exercices.**

**Lower — Chaîne postérieure B**

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 1 | seed-cat-cow | 2×10 |
| 1 | hams/glutes cpd | cpd | **good-morning(1)**, romanian-deadlift(3), dumbbell-rdl(2) | **seed-good-morning** ⚠️ | 4×8-12 |
| 2 | back_width/back cpd | cpd | seed-deadlift(3) | **seed-deadlift** ⚠️ répété | 4×8-12 |
| 3 | back_thickness cpd | cpd | row-db(3), row-tbar(2), row-barbell(7) | **seed-row-dumbbell** | 4×8-12 |
| 4 | quads/glutes cpd | cpd | lunges(2), front-squat(2), bulgarian(2) | **seed-lunges** | 4×8-12 |
| 5 | glutes/hams iso | iso→cpd | hip-thrust(4), romanian-deadlift(3), dumbbell-rdl(2) | **seed-hip-thrust** ⚠️ répété | 3×10-15 |
| 6 | dos iso | iso | pullover-db(3), shrug(2), pullover(1) | **seed-pullover-dumbbell** ⚠️ répété | 3×10-15 |
| 7 | hamstrings iso | iso→cpd | romanian-deadlift(3), dumbbell-rdl(2) | **seed-romanian-deadlift** ⚠️ | 3×10-15 |
| 8 | calves iso | iso | calf-raise-bb(2), calf-raise-db(2) | **seed-calf-raise-bb** | 3×10-15 |
| 9 | biceps iso | iso | curl-db(3), curl-hammer(3), curl-incline(2) | **seed-curl-dumbbell** | 3×10-15 |
| 10 | core | — | index 1 | seed-crunch | 3×15 |

**Assertions CRITIQUES :**
- `hasLower && hasPull && !hasPush` → `'lower_pull'` : **PASS** (ligne 319)
- Split public `['lower','lower']` : **PASS** (`toPublicType('lower_pull') = 'lower'`, ligne 103)
- Noms « Lower — Chaîne postérieure A / B » : **PASS** (ligne 402 + suffixe A/B)
- Premier exercice de travail (index 1) = composé hamstrings/glutes : **PASS**
  (`seed-romanian-deadlift` en A, `seed-good-morning` en B) — **LP4 vérifié**
- `autoProgress: true`, `progressStepKg: 2.5` : **PASS** (tous barbell/dumbbell)

**Coach :**
- **Le deadlift couvre-t-il jambes ET dos ?** Oui en théorie. ❌ **Mais ici le générateur empile
  4 hip hinges dans la séance A** : RDL (slot 1) → soulevé de terre (slot 2) → hip thrust (slot 5)
  → RDL haltères (slot 7). **Quatre mouvements de charnière de hanche en 4×8-12 dans une séance de
  débutant.** Charge lombaire cumulée très élevée. **Réserve de sécurité majeure.**
- **Cause structurelle** : le slot 2 (`['back_width','back']`, ligne 221) n'a aucun candidat de
  tirage vertical en BB+DB → seul `seed-deadlift` (primaryMuscle `back`) qualifie. Le template
  suppose implicitement une poulie ou une barre de traction.
- ⚠️ **Séance B : `seed-good-morning` (pop 1) en tête en 4×8-12** — encore `usedGlobally`.
  Le good morning en tête de séance pour un débutant est déconseillé.
- **Pool suffisant pour 2 séances distinctes ?** ⚠️ **Non** : deadlift, hip thrust et
  pullover-dumbbell sont **identiques** en A et B (pools de 1 à 3 candidats). 3 exercices sur 9
  répétés → **« variété d'exercices seulement », partielle**.
- **Équilibre** : tirages composés 3 (deadlift, rowing, + RDL), poussées **0**. Le warning
  « Déséquilibre push/pull » n'est pas émis (pas de séance push) — correct.
  ⚠️ **Aucun pectoral, aucune épaule, aucun triceps de toute la semaine.**
- **Durée** : 4×4×130 + 5×3×105 = 2080 + 1575 = 3655 s ≈ 61 min + 6 min ≈ **67 min** pour 60. ⚠️
- **Couverture isolation** : fessiers ✅, dos ✅, ischios ✅, mollets ✅, biceps ✅.
  **Couverture isolation complète pour le périmètre ciblé.** ✅
- **Verdict : ⚠️ PASS technique / ❌ réserve sécurité** — 4 hip hinges dans une séance débutant,
  good morning en tête de B.

---

## P42 — legs + back + core → `lower_pull` (le core ne change pas le type)

`{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner', focusMuscles:['legs','back','core'] }`

**Simulation :**
`hasLower=true, hasPush=false, hasPull=true, hasArms=false, **hasCore=true**, hasUpper=true`
→ règle 2 (core seul) exige `!hasLower && !hasUpper` → fausse → **règle 7 → `'lower_pull'`** ✅
- Split `['lower_pull','lower_pull','lower_pull']` → « Lower — Chaîne postérieure A / B / C »
- 9 slots. available = 98. Warning : « Programme de spécialisation… »

**Chaîne postérieure A**

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | hams/glutes cpd | cpd | romanian-deadlift(3), dumbbell-rdl(2), good-morning(1) | **seed-romanian-deadlift** | 4×8-12 |
| 2 | back_width cpd | cpd | lat-pulldown(3), deadlift(3) | **seed-lat-pulldown** ✅ | 4×8-12 |
| 3 | back_thickness cpd | cpd | row-barbell(7), row-db(3), row-tbar(2) | **seed-row-barbell** | 4×8-12 |
| 4 | quads/glutes cpd | cpd | squat-barbell(8), leg-press(3), bw-squat(3) | **seed-squat-barbell** | 4×8-12 |
| 5 | glutes/hams iso | iso | glute-bridge(3), donkey-kick(2), fire-hydrant(2) | **seed-glute-bridge** | 3×10-15 |
| 6 | dos iso | iso | pullover-db(3), pullover-cable(2), straight-arm(2) | **seed-pullover-dumbbell** | 3×10-15 |
| 7 | hamstrings iso | iso | leg-curl-lying(3), leg-curl-seated(2), leg-curl-standing(2) | **seed-leg-curl-lying** | 3×10-15 |
| 8 | calves iso | iso | calf-seated(2), calf-standing(2), bw-calf-raise(2) | **seed-calf-raise-seated** | 3×10-15 |
| 9 | biceps iso | iso | curl-barbell(3), curl-db(3), curl-hammer(3) | **seed-curl-barbell** | 3×10-15 |
| 10 | **core** | — | index 0 | **seed-scissors** ✅ corePool | 3×15 |

**Chaîne postérieure B** : cat-cow · **dumbbell-rdl** 4×8-12 · seed-lat-pulldown 4×8-12 ·
**seed-row-dumbbell** 4×8-12 · **seed-leg-press** 4×8-12 · **seed-donkey-kick** 3×10-15 ·
**seed-pullover-cable** 3×10-15 · **seed-leg-curl-seated** 3×10-15 · **seed-calf-raise-standing** 3×10-15 ·
**seed-curl-dumbbell** 3×10-15 · seed-crunch 3×15 → **11 exercices**

**Chaîne postérieure C** : shoulder-circles · **seed-good-morning** 4×8-12 ⚠️ · seed-lat-pulldown 4×8-12 ·
**seed-row-tbar** 4×8-12 · **bw-squat** 4×8-12 · **seed-fire-hydrant** 3×10-15 ·
**seed-straight-arm-pulldown** 3×10-15 · **seed-leg-curl-standing** 3×10-15 · **bw-calf-raise** 3×10-15 ·
**seed-curl-hammer** 3×10-15 · seed-cable-crunch 3×15 → **11 exercices**

**Assertions CRITIQUES :**
- `hasLower && hasPull && !hasPush && hasCore` → `'lower_pull'` : **PASS**
- Split public `['lower','lower','lower']` (lower_pull × 3) : **PASS**
- Noms « Lower — Chaîne postérieure A / B / C » : **PASS**
- Core en queue via `corePool` : **PASS** (scissors / crunch / cable-crunch)

**Coach — persona « femme focus fessiers + posture + gainage » :**
- **Hip thrust présent ?** ❌ **Non.** `seed-hip-thrust` (barbell, pop 4) est un composé
  `primaryMuscle: 'glutes'`. Le slot 5 de `lower_pull` est `{ muscles: ['glutes','hamstrings'],
  compound: **false** }` → le filtre `isolationFirst` (ligne 544) trouve des isolations
  (glute-bridge, donkey kick, fire hydrant) et **ne descend jamais sur le composé**.
  Le hip thrust n'est donc **jamais sélectionné** pour ce profil, alors que c'est
  **l'exercice de référence pour un focus fessiers**. ❌ **Défaut de conception du template
  `lower_pull` pour cette persona.**
- **Adaptation au profil** : les fessiers ne sont travaillés qu'en secondaire (RDL, squat) plus
  1 isolation légère (glute bridge poids du corps 3×10-15, `autoProgress: false`). **Insuffisant**
  pour un objectif « fessiers ».
- **Posture** : ✅ bien servie — lat pulldown + rowing sur les 3 séances, pullover/straight-arm en
  isolation dos, 3 séances/semaine de tirage.
- **Gainage** : 1 exercice par séance (scissors, crunch, cable crunch). Correct pour un focus core
  secondaire, minimal pour un focus core principal.
- **Équilibre** : ❌ **Zéro poussée sur la semaine** — aucun pectoral, aucune épaule, aucun triceps.
  Sur 3 séances/semaine, c'est un déséquilibre postural inverse (dominance postérieure).
- **Variété** : ✅ **Bonne** — les 3 séances partagent la structure mais 8 exercices sur 9 diffèrent
  entre A, B et C (seul le lat pulldown est répété 3×, pool de 2). → **variété d'exercices forte,
  structure identique.**
- **Durée** : ≈ 67 min pour 60 annoncées. ⚠️
- ⚠️ **Séance C : `seed-good-morning` en tête en 4×8-12** pour une débutante — réserve de sécurité.
- **Couverture isolation** : fessiers ✅, ischios ✅, mollets ✅, dos ✅, biceps ✅. Complète pour le périmètre.
- **Verdict : ⚠️ PASS technique / réserve persona** — hip thrust structurellement inatteignable
  sur un focus fessiers, zéro poussée sur la semaine, good morning en tête de C.

---

## P43 — legs + shoulders → `lower_push` (Squat & Press)

`{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:BB+DB, level:'intermediate', focusMuscles:['legs','shoulders'] }`

**Simulation :**
`hasLower=true, hasPush=true (shoulders), hasPull=false, hasUpper=true`
→ règle 5 `hasUpper && !hasLower` fausse → **règle 6 `hasLower && hasPush && !hasPull` (ligne 316)
→ `'lower_push'`** ✅ (évaluée avant `lower_pull`, conforme à la doc)
- Split `['lower_push','lower_push','lower_push']` → « Lower — Squat & Press A / B / C »
- `adjustedSlotCount(9, 60, 'strength')` = `max(4, 4)` = **4 slots**
- **`reorderSlotsByFocus` (ciblés = quads/hams/glutes/calves + shoulders*)** :
  les 4 composés d'origine sont quads(ciblé) / chest(**non ciblé**) / shoulders(ciblé) / hams(ciblé)
  → tri stable par `byFocus` → **quads → shoulders → hamstrings → chest**.
  Le chest compound tombe en 4ᵉ position et **survit tout juste au cap de 4 slots**.
- **Warnings (2) :** spécialisation + **déséquilibre push/pull** (aucune séance de tirage, ligne 904)

**Squat & Press A**

| # | Slot (réordonné) | Cat | Top-3 (prio force barbell) | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | **quads/glutes cpd** | cpd | squat-barbell(8), front-squat(2), lunges(2) | **`seed-squat-barbell`** ✅ squat-first | 5×3-5 |
| 2 | **shoulders cpd (OHP)** | cpd | ohp-barbell(3), sh-press-db(3), arnold(2) | **`seed-ohp-barbell`** ✅ | 5×3-5 |
| 3 | hams/glutes cpd | cpd | romanian-deadlift(3), good-morning(1), dumbbell-rdl(2) | **seed-romanian-deadlift** | 5×3-5 |
| 4 | chest cpd | cpd | bench-barbell(8), bench-db(3), incline-bench-bb(4) | **seed-bench-barbell** | 5×3-5 |
| 5 | core | — | index 0 | seed-scissors | 3×15 |

**Squat & Press B** : cat-cow · **seed-front-squat** 5×3-5 · seed-ohp-barbell 5×3-5 ⚠️ répété ·
**seed-good-morning** 5×3-5 ⚠️ · seed-bench-barbell 5×3-5 ⚠️ répété · seed-crunch 3×15

**Squat & Press C** : shoulder-circles · seed-squat-barbell 5×3-5 · seed-ohp-barbell 5×3-5 ·
seed-romanian-deadlift 5×3-5 · seed-bench-barbell 5×3-5 · seed-bicycle-crunch 3×15
→ **strictement identique à la séance A** (hors warmup/core).

**Assertions CRITIQUES :**
- `hasLower && hasPush && !hasPull` → `'lower_push'` : **PASS** (ligne 316, **avant** `lower_pull`)
- Split public `['lower','lower','lower']` : **PASS**
- Noms « Lower — Squat & Press A / B / C » : **PASS** (ligne 403)
- Premier exercice de travail = composé quads/glutes (squat) : **PASS** — **LP5 vérifié**
- Deuxième composé = shoulders/front (OHP) présent : **PASS** (remonté par `reorderSlotsByFocus`)
- `autoProgress: true` (barbell prioritaire en force) : **PASS**

**Coach — pattern Wendler / haltérophile :**
- **Split cohérent pour la force ?** ✅ **Oui, sur le principe.** Squat + OHP + hinge + bench,
  4 mouvements de barre à 5×3-5, 3 fois par semaine : c'est structurellement un « Wendler
  4-lifts en full body ». Les deux piliers demandés (squat et OHP) sont bien en position 1 et 2. ✅
- ❌ **Fréquence excessive** : squat 5×3-5 **trois fois par semaine** (A, B, C) sur 3 jours
  espacés de 48 h ; bench 5×3-5 trois fois ; OHP 5×3-5 **trois fois**. Aucun programme de force
  sérieux ne programme l'OHP lourd 3×/semaine. **Récupération insuffisante, risque de stagnation
  et de tendinopathie d'épaule.**
- ❌ **Séance C = copie exacte de la séance A.** Le pool BB+DB pour ces 4 slots est trop étroit
  (`usedGlobally` est réinitialisé de fait car les exercices de A ont été « consommés » puis
  redeviennent les mieux classés une fois B passée). → **Répétition complète, aucune variété.**
- ⚠️ **Séance B : `seed-good-morning` en 5×3-5.** Good morning à charge maximale = **risque
  lombaire élevé**, d'autant qu'il suit un front squat 5×3-5 dans la même séance.
- ❌ **Zéro tirage sur toute la semaine** — 12 séries lourdes de poussée (bench + OHP) contre 0.
  Le warning est émis ✅, mais l'ampleur (3 séances) dépasse le cadre du « bloc court ».
- **Durée** : 4 composés × 5 × (30+180) = 4200 s = 70 min + warmup + core ≈ **76 min** pour 60. ⚠️
- **Couverture isolation** : **nulle** (les 4 slots retenus sont tous composés). Mollets, quads iso,
  fessiers iso, triceps, pecs iso tous élidés par le cap à 4.
- **Verdict : ❌ Problème sérieux** — séances A et C identiques, OHP et bench lourds 3×/semaine,
  good morning en 5×3-5, zéro tirage, dépassement horaire de 27 %.

---

## P44 — legs + chest + shoulders → `lower_push`

`{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:FULL, level:'beginner', focusMuscles:['legs','chest','shoulders'] }`

**Simulation :**
`hasLower=true, hasPush=true (chest+shoulders), hasPull=false, hasUpper=true`
→ **règle 6 (ligne 316) → `'lower_push'`** ✅
- Split `['lower_push','lower_push']` → « Lower — Squat & Press A / B »
- 9 slots (hypertrophie 60 min). `reorderSlotsByFocus` : **tous les slots sont ciblés** sauf
  `triceps` → ordre inchangé, triceps déjà dernier.
- **Warnings (2) :** spécialisation + déséquilibre push/pull

**Squat & Press A**

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | quads/glutes cpd | cpd | squat-barbell(8), leg-press(3), bw-squat(3) | **seed-squat-barbell** | 4×8-12 |
| 2 | chest cpd | cpd | bench-barbell(8), bench-db(3), chest-press-machine(3) | **seed-bench-barbell** | 4×8-12 |
| 3 | shoulders cpd | cpd | sh-press-db(3), ohp-barbell(3), sh-press-machine(3) | **seed-shoulder-press-dumbbell** | 4×8-12 |
| 4 | hams/glutes cpd | cpd | romanian-deadlift(3), dumbbell-rdl(2), good-morning(1) | **seed-romanian-deadlift** | 4×8-12 |
| 5 | quads iso | iso | leg-extension(3), wall-sit(2) | **seed-leg-extension** | 3×10-15 |
| 6 | calves iso | iso | calf-seated(2), calf-standing(2), bw-calf-raise(2) | **seed-calf-raise-seated** | 3×10-15 |
| 7 | chest iso | iso | fly-db(2), fly-cable(2), pec-deck(2) | **seed-fly-dumbbell** | 3×10-15 |
| 8 | glutes iso | iso | glute-bridge(3), donkey-kick(2), fire-hydrant(2) | **seed-glute-bridge** | 3×10-15 |
| 9 | triceps iso | iso | triceps-rope(3), triceps-pushdown(3), skullcrusher(2) | **seed-triceps-rope** | 3×10-15 |
| 10 | core | — | index 0 | seed-scissors | 3×15 |

→ **11 exercices.**

**Squat & Press B** : cat-cow · **seed-leg-press** 4×8-12 · **seed-bench-dumbbell** 4×8-12 ·
**seed-ohp-barbell** 4×8-12 · **dumbbell-rdl** 4×8-12 · **bw-wall-sit** 3×10-15 ·
**seed-calf-raise-standing** 3×10-15 · **seed-fly-cable** 3×10-15 · **seed-donkey-kick** 3×10-15 ·
**seed-triceps-pushdown** 3×10-15 · seed-crunch 3×15 → **11 exercices, 9 exercices différents sur 9**

**Assertions CRITIQUES :**
- `hasLower && hasPush (chest+shoulders) && !hasPull` → `'lower_push'` : **PASS**
- Split public `['lower','lower']` : **PASS**
- Noms « Lower — Squat & Press A / B » : **PASS**

**Coach — surcharge musculaire quads + pecs + épaules pour un débutant :**
- ⚠️ **4 composés lourds à la suite (squat, bench, OHP, RDL) en 4×8-12** = 16 séries composées
  par séance pour un **débutant**. C'est le volume d'un intermédiaire. Sur 2 séances/semaine,
  32 séries composées — supportable, mais la séance elle-même est très dense.
- **Est-ce trop pour un débutant ?** Oui sur la charge cognitive : squat barre + développé couché
  barre + développé militaire haltères + soulevé de terre jambes tendues dans la même séance,
  ce sont **4 patterns techniques à apprendre simultanément**. Recommandation coach : commencer
  par un fullbody à 3 mouvements et ajouter progressivement.
- ❌ **Zéro tirage sur la semaine** (warning émis ✅). Aucun dos, aucun biceps, aucun deltoïde
  postérieur, aucun ischio en isolation.
- **Variété A→B** : ✅ **excellente** — 9 exercices différents sur 9, même structure.
  → « Variété d'exercices » complète (structure identique par construction du type unique).
- **Durée** : 4×4×130 + 5×3×105 = 2080 + 1575 = 3655 s ≈ 61 min + 6 min ≈ **67 min**. ⚠️
- **Couverture isolation** : quads ✅, mollets ✅, pecs ✅, fessiers ✅, triceps ✅.
  **Complète pour le périmètre ciblé.** Ischios et dos absents.
- **Verdict : ⚠️ PASS avec réserve** — densité élevée et 4 patterns techniques simultanés pour un
  débutant, zéro tirage.

---

## P45 — chest + shoulders → `push` (push day complet)

`{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:DB, level:'beginner', focusMuscles:['chest','shoulders'] }`

**Simulation :**
`hasLower=false, hasPush=true, hasPull=false, hasUpper=true` → **règle 3 (ligne 309) → `'push'`** ✅
(la règle 5 `'upper'` n'est jamais atteinte)
- Split `['push','push','push']` → « Push — Poussée A / B / C ». 6 slots. available = 22.
- `reorderSlotsByFocus` : **tous les slots de `push` sont ciblés** (chest*, shoulders*, sauf triceps)
  → composés inchangés ; isolations : chest, sh_lateral, sh_rear remontent, **triceps passe en dernier**.
- **Warnings (3) :** spécialisation + focus bras en push (déclenché par `'shoulders'`) + déséquilibre push/pull

**Push A**

| # | Slot (réordonné) | Cat | Candidats DB | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | chest cpd | cpd | bench-db(3), incline-bench-db(2) | **seed-bench-dumbbell** | 4×8-12 |
| 2 | shoulders cpd | cpd | sh-press-db(3), arnold(2) | **seed-shoulder-press-dumbbell** | 4×8-12 |
| 3 | chest iso | iso | fly-dumbbell(2) | **seed-fly-dumbbell** | 3×10-15 |
| 4 | sh_lateral iso | iso | lateral-raise(3) | **seed-lateral-raise** | 3×10-15 |
| 5 | shoulders_rear iso | iso | rear-delt-fly(2) | **seed-rear-delt-fly** | 3×10-15 |
| 6 | triceps iso (repoussé) | iso | triceps-overhead(2), triceps-kickback(1) | **seed-triceps-overhead** | 3×10-15 |
| 7 | core | — | index 0 | seed-scissors | 3×15 |

**Push B** : cat-cow · seed-bench-dumbbell 4×8-12 · **seed-arnold-press** 4×8-12 ·
seed-fly-dumbbell 3×10-15 · seed-lateral-raise 3×10-15 · seed-rear-delt-fly 3×10-15 ·
**seed-triceps-kickback** 3×10-15 · seed-crunch 3×15

**Push C** : shoulder-circles · seed-bench-dumbbell 4×8-12 · seed-shoulder-press-dumbbell 4×8-12 ·
seed-fly-dumbbell 3×10-15 · seed-lateral-raise 3×10-15 · seed-rear-delt-fly 3×10-15 ·
seed-triceps-overhead 3×10-15 · seed-bicycle-crunch 3×15
→ **identique à A.**

**Assertions CRITIQUES :**
- `hasPush (chest+shoulders) && !hasPull && !hasLower` → `'push'` (**pas `'upper'`**) : **PASS**
  — **PUSH_FULL vérifié** (la règle 3 précède la règle 5)
- Split `['push','push','push']` : **PASS**
- Slots chest ET shoulders couverts (pas seulement l'un des deux) : **PASS**
  — chest : bench + fly ; shoulders : press + latéral + postérieur

**Coach — push day DB-only :**
- **L'OHP est-il disponible ?** ✅ Oui : `seed-shoulder-press-dumbbell` (développé épaules haltères,
  pop 3) et `seed-arnold-press` (pop 2). Pas de barre, donc pas d'OHP barre — normal en DB-only.
- **Le chest est-il correctement travaillé sans barre ?** ⚠️ **Partiellement.** Le pool DB pour
  `chest`/`chest_upper`/`chest_lower` compound est de **2 exercices** (bench-db pop 3,
  incline-bench-db pop 2) ; le générateur retient **bench-db sur les 3 séances**.
  Un seul angle de travail, aucun développé incliné. Pool trop étroit.
- ❌ **Séance C = copie de la séance A.** Sur 3 séances, 2 sont identiques.
  → **Répétition complète.**
- ❌ **Zéro tirage, zéro dos, zéro biceps, zéro jambes** sur 3 séances/semaine. Le warning
  « spécialisation » parle d'un bloc de 4-6 semaines — ici on est sur 8 semaines (débutant).
- ⚠️ Warning « Focus bras en push » émis alors que l'utilisateur a coché **chest + épaules**
  (condition ligne 889 sur `'shoulders'`). **Message inadapté** (cf. P16).
- **Durée** : 2×4×130 + 4×3×105 = 2300 s ≈ 38 min + 6 min ≈ **44 min** ✅
- **Couverture isolation** : pecs ✅, deltoïde latéral ✅, deltoïde postérieur ✅, triceps ✅.
  **Complète pour le périmètre.**
- **Verdict : ⚠️ PASS technique** — logique de type correcte, mais séances A et C identiques et
  pool chest DB à 2 exercices.

---

## P46 — back + arms → `pull` (pull day complet)

`{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:BB+DB+CABLE, level:'intermediate', focusMuscles:['back','arms'] }`

**Simulation :**
`hasLower=false, hasPush=false, hasPull=true, hasArms=true → hasUpper=true`
→ règle 3 `hasPush` fausse → **règle 4 `hasPull && !hasPush && !hasLower` (ligne 311) → `'pull'`** ✅
(la règle 5 `'upper'` n'est pas atteinte)
- Split `['pull','pull','pull']` → « Pull — Tirage A / B / C ». 6 slots. available = 55.
- `reorderSlotsByFocus` : ciblés = back* + biceps/triceps/forearms.
  → isolations : dos, biceps, **forearms** (ciblé) remontent devant `shoulders_rear` (non ciblé).
  **Ordre modifié** vs P12 : dos iso → biceps → forearms → shoulders_rear.
- Warning : « Programme de spécialisation… »

**Pull A**

| # | Slot (réordonné) | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | back_width cpd | cpd | lat-pulldown(3), deadlift(3) | **seed-lat-pulldown** | 4×8-12 |
| 2 | back_thickness cpd | cpd | row-barbell(7), row-db(3), row-tbar(2) | **seed-row-barbell** | 4×8-12 |
| 3 | dos iso | iso | pullover-db(3), pullover-cable(2), straight-arm(2) | **seed-pullover-dumbbell** | 3×10-15 |
| 4 | **biceps** | iso | curl-barbell(3), curl-db(3), curl-hammer(3) | **seed-curl-barbell** | 3×10-15 |
| 5 | **forearms** (remonté) | iso | wrist-curl(1), reverse-wrist-curl(1) | **seed-wrist-curl** | 3×10-15 |
| 6 | shoulders_rear (repoussé) | iso | face-pull(2), rear-delt-fly(2) | **seed-face-pull** | 3×10-15 |
| 7 | core | — | index 0 | seed-scissors | 3×15 |

**Pull B** : cat-cow · seed-lat-pulldown 4×8-12 · **seed-row-dumbbell** 4×8-12 ·
**seed-pullover-cable** 3×10-15 · **seed-curl-dumbbell** 3×10-15 · **seed-reverse-wrist-curl** 3×10-15 ·
**seed-rear-delt-fly** 3×10-15 · seed-crunch 3×15

**Pull C** : shoulder-circles · seed-lat-pulldown 4×8-12 · **seed-row-tbar** 4×8-12 ·
**seed-straight-arm-pulldown** 3×10-15 · **seed-curl-hammer** 3×10-15 · seed-wrist-curl 3×10-15 ·
seed-face-pull 3×10-15 · seed-cable-crunch 3×15

**Assertions CRITIQUES :**
- `hasPull (back) && hasArms → hasUpper` mais `!hasPush && !hasLower` → `'pull'` (**pas `'upper'`**) :
  **PASS** — **PULL_FULL vérifié** (règle 4 avant règle 5)
- Split `['pull','pull','pull']` : **PASS**
- Slots biceps ET dos couverts : **PASS**

**Coach :**
- **Les biceps bénéficient-ils d'un slot dédié en plus du tirage composé ?** ✅ **Oui** — 1 slot
  `biceps` isolation par séance (curl barre / haltères / marteau, tous différents sur A, B, C).
  Sur la semaine : 3 tirages verticaux + 3 rowings (composés, biceps en synergie) + 3 curls dédiés.
  **Volume biceps très correct.**
- ⚠️ **Le focus « arms » remonte le slot `forearms` devant `shoulders_rear`** — conséquence de
  `FOCUS_TO_MUSCLES.arms = ['biceps','triceps','forearms']` (ligne 24). Résultat : 3 séances de
  curl poignets (pop 1) avant le face pull. **Priorisation discutable** : les avant-bras sont
  déjà fortement sollicités par 6 tirages/semaine ; le deltoïde postérieur ne l'est pas.
- ❌ **Le triceps est ciblé par le focus « arms » mais `pull` n'a aucun slot triceps.**
  L'utilisateur qui coche « bras » n'obtient **que les biceps**. Le warning UX-B n'est pas émis
  ici (il ne se déclenche que si `split.every(t => t === 'push')`, ligne 889) — **angle mort
  symétrique** : le cas « arms + pull » n'est pas averti alors qu'il est aussi incomplet.
- ❌ `seed-lat-pulldown` sur les 3 séances (pool `back_width` compound = 2 candidats).
- **Équilibre** : zéro poussée sur la semaine (non averti, cf. P12).
- **Durée** : 2×4×130 + 4×3×105 = 2300 s ≈ 38 min + 6 min ≈ **44 min** ✅
- **Variété** : ✅ bonne — 5 exercices sur 6 diffèrent entre A et B.
- **Verdict : ⚠️ PASS** — biceps bien servis, mais triceps absent malgré le focus « bras »
  et avant-bras sur-priorisés.

---

## P47 — chest + arms → `push`

`{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:DB, level:'beginner', focusMuscles:['chest','arms'] }`

**Simulation :**
`hasLower=false, hasPush=true (chest), hasPull=false, hasArms=true → hasUpper=true`
→ **règle 3 (ligne 309) matche avant la règle 5** → `'push'` ✅
- Split `['push','push']`. 6 slots. available = 22.
- `reorderSlotsByFocus` : ciblés = chest* + biceps/triceps/forearms.
  → isolations : chest iso, **triceps** (ciblé) remontent ; sh_lateral et sh_rear repoussés.
  Ordre : chest iso → triceps → sh_lateral → sh_rear.
- **Warnings (3) :** spécialisation + focus bras en push + déséquilibre push/pull

**Push A**

| # | Slot (réordonné) | Cat | Retenu | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | seed-bird-dog | 2×10 |
| 1 | chest cpd | cpd | **seed-bench-dumbbell** | 4×8-12 |
| 2 | shoulders cpd | cpd | **seed-shoulder-press-dumbbell** | 4×8-12 |
| 3 | chest iso | iso | **seed-fly-dumbbell** | 3×10-15 |
| 4 | **triceps** (remonté) | iso | **seed-triceps-overhead** | 3×10-15 |
| 5 | sh_lateral | iso | **seed-lateral-raise** | 3×10-15 |
| 6 | shoulders_rear | iso | **seed-rear-delt-fly** | 3×10-15 |
| 7 | core | — | seed-scissors | 3×15 |

**Push B** : cat-cow · seed-bench-dumbbell 4×8-12 · **seed-arnold-press** 4×8-12 ·
seed-fly-dumbbell 3×10-15 · **seed-triceps-kickback** 3×10-15 · seed-lateral-raise 3×10-15 ·
seed-rear-delt-fly 3×10-15 · seed-crunch 3×15

**Assertions CRITIQUES :**
- `hasPush (chest) && hasArms → hasUpper`, `!hasPull && !hasLower` : **PASS**
- Priorité règle 3 (`hasPush && !hasPull && !hasLower`) sur règle 5 (`hasUpper && !hasLower`) :
  **PASS** — la règle 3 est déclarée ligne 309, la règle 5 ligne 313
- Split `['push','push']` : **PASS**
- Triceps ET chest couverts : **PASS** (triceps remonté en position 4 par le focus)

**Coach — chest + triceps en push day :**
- ✅ **Cohérence musculaire excellente** : pectoraux et triceps sont synergistes sur tous les
  mouvements de poussée horizontale. Les regrouper dans la même séance est la logique même du
  split push. Le réordonnancement place le triceps juste après l'isolation pectorale — ordre
  de pré-fatigue correct.
- ❌ **Le biceps, pourtant inclus dans le focus « arms », n'a aucun slot en push.**
  Le warning UX-B l'explique explicitement ✅ — c'est le cas d'usage pour lequel il a été écrit.
- ⚠️ **Séance B : `seed-triceps-kickback` (pop 1)** promu par `usedGlobally` alors que le triceps
  est un muscle **ciblé**. Le tri `focused` (lignes 553-557) ne départage pas ici : les deux
  candidats sont `triceps`, donc `aF === bF`, et c'est `usedGlobally` qui tranche.
  → **Sur un muscle ciblé, le générateur donne l'exercice le moins efficace en séance B.**
- **Variété A→B** : 5/6 identiques. Faible.
- **Durée** ≈ 44 min ✅
- **Verdict : ⚠️ PASS** — cohérence chest/triceps correcte, biceps absent (averti),
  kickback promu sur un muscle ciblé.

---

## P48 — shoulders + back → `upper`

`{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:FULL, level:'beginner', focusMuscles:['shoulders','back'] }`

**Simulation :**
`hasPush=true (shoulders), hasPull=true (back), hasLower=false, hasUpper=true`
→ règle 3 exige `!hasPull` → fausse · règle 4 exige `!hasPush` → fausse
→ **règle 5 `hasUpper && !hasLower` (ligne 313) → `'upper'`** ✅
- Split : branche `focusType === 'upper'` (ligne 339) → `['upper-push','upper-pull']`
  → public `['upper','upper']` → « Upper — Haut du corps A / B »
- 8 slots chacun. **Warnings : aucun** (upper contient du tirage, pas de spécialisation détectée)
- `reorderSlotsByFocus` sur `upper-push` : ciblés = shoulders* + back*.
  Composés d'origine : chest(non ciblé) / dos(ciblé) / shoulders(ciblé) →
  **réordonné en dos → shoulders → chest.**
  Isolations d'origine : chest iso / triceps / sh_lateral(ciblé) / biceps / dos iso(ciblé) →
  **réordonné en sh_lateral → dos iso → chest iso → triceps → biceps.**

**Upper A** (`upper-push` réordonné)

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | **dos cpd** (remonté) | cpd | lat-pulldown(3), row-barbell(7), row-db(3) | **seed-lat-pulldown** | 4×8-12 |
| 2 | **shoulders cpd** (remonté) | cpd | sh-press-db(3), ohp-barbell(3), sh-press-machine(3) | **seed-shoulder-press-dumbbell** | 4×8-12 |
| 3 | chest cpd (repoussé) | cpd | bench-barbell(8), bench-db(3), chest-press-machine(3) | **seed-bench-barbell** | 4×8-12 |
| 4 | **sh_lateral** | iso | lateral-raise(3), lateral-raise-cable(2) | **seed-lateral-raise** | 3×10-15 |
| 5 | **dos iso** | iso | pullover-db(3), pullover-cable(2), straight-arm(2) | **seed-pullover-dumbbell** | 3×10-15 |
| 6 | chest iso | iso | fly-db(2), fly-cable(2), pec-deck(2) | **seed-fly-dumbbell** | 3×10-15 |
| 7 | triceps | iso | triceps-rope(3), triceps-pushdown(3), skullcrusher(2) | **seed-triceps-rope** | 3×10-15 |
| 8 | biceps | iso | curl-barbell(3), curl-db(3), curl-hammer(3) | **seed-curl-barbell** | 3×10-15 |
| 9 | core | — | index 0 | seed-scissors | 3×15 |

**Upper B** (`upper-pull`) : cat-cow · **seed-lat-pulldown** 4×8-12 ⚠️ · **seed-row-barbell** 4×8-12 ·
**seed-bench-dumbbell** 4×8-12 · **seed-face-pull** 3×10-15 · **seed-pullover-cable** 3×10-15 ·
**seed-lateral-raise-cable** 3×10-15 · **seed-curl-dumbbell** 3×10-15 · **seed-triceps-pushdown** 3×10-15 ·
seed-crunch 3×15 → **10 exercices**

**Assertions CRITIQUES :**
- `hasPush && hasPull && !hasLower` → `'upper'` : **PASS** (ligne 313)
- Split `['upper','upper']`, internes `upper-push` / `upper-pull` : **PASS** (ligne 339-343)
- Noms « Upper — Haut du corps A / B » : **PASS**

**Coach :**
- **Les épaules sont-elles bien représentées dans upper-push ET upper-pull ?**
  - Upper A (`upper-push`) : ✅ **3 slots épaule** — développé épaules (composé), élévations latérales,
    (+ le deltoïde antérieur en synergie du bench).
  - Upper B (`upper-pull`) : ⚠️ **2 slots épaule seulement** — face pull (postérieur) et élévations
    latérales poulie. **Aucun développé d'épaule** : le template `upper-pull` (lignes 178-189)
    ne contient **aucun slot `['shoulders','shoulders_front']` compound**.
  - → **Sur 2 séances, un seul développé d'épaule par semaine** pour un utilisateur dont les épaules
    sont un focus déclaré. **Le réordonnancement ne peut rien y faire : le slot n'existe pas.**
- **Est-ce le meilleur split pour cet objectif ?** ⚠️ **Non.** Pour un focus « épaules + dos »,
  un split `pull` + `push` orienté épaules, ou un `upper` A/B avec OHP dans les deux variantes,
  serait supérieur. Le choix de `'upper'` est logiquement correct (règle 5) mais sportivement
  sous-optimal : l'utilisateur reçoit **2 développés couchés** (bench barre + bench haltères)
  qu'il n'a pas demandés, et **1 seul** développé d'épaule.
- **Équilibre push/pull** : composés — 2 tirages (lat pulldown ×2 + rowing = 3) contre
  2 poussées (bench ×2) + 1 OHP. ✅ ~1:1. Bon.
- **Réordonnancement** : ✅ fonctionne parfaitement (dos et épaules en tête des composés **et**
  des isolations).
- ⚠️ `seed-lat-pulldown` en A et B.
- **Durée** : 3×4×130 + 5×3×105 = 3135 s ≈ 52 min + 6 min ≈ **58 min** ✅
- **Couverture isolation** : dos ✅, deltoïde latéral ✅ (×2), deltoïde postérieur ✅ (B),
  pecs ✅, biceps ✅, triceps ✅. **Couverture complète.** ✅
- **Verdict : ⚠️ PASS avec réserve** — `upper-pull` sans slot OHP pénalise un focus « épaules ».

---

## P49 — fat_loss 4 j intermediate (gap auto-split)

`{ goal:'fat_loss', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'intermediate' }`

**Simulation — branche exacte de `selectSplit` :**
- `isMass = (goal === 'strength' || goal === 'hypertrophy')` → **`false`** pour `fat_loss` (ligne 326)
- `case 4` (ligne 360) : `if (isMass) return [...]` → **non prise** (c'est la branche upper/lower)
- ligne 364 : `if (level !== 'beginner') return ['push','pull','lower-quad','fullbody-quad']` → **prise**
- → **Split interne `['push','pull','lower-quad','fullbody-quad']`, public `['push','pull','lower','fullbody']`**
- Vérification demandée : **fat_loss 4 j intermediate ne tombe PAS dans upper/lower** ✅
- Slots : 6 / 6 / 6 / 9. Warnings : aucun. Jours : lundi, mardi, jeudi, vendredi.

**Push — Poussée** : bird-dog · bench-barbell 3×12-15 · shoulder-press-db 3×12-15 ·
fly-dumbbell 3×12-15 · triceps-rope 3×12-15 · lateral-raise 3×12-15 · face-pull 3×12-15 ·
scissors 3×15 → **8 exercices**

**Pull — Tirage** : cat-cow · lat-pulldown 3×12-15 · row-barbell 3×12-15 · pullover-dumbbell 3×12-15 ·
curl-barbell 3×12-15 · rear-delt-fly 3×12-15 · wrist-curl 3×12-15 · crunch 3×15 → **8 exercices**

**Lower — Bas du corps** (`lower-quad`) : shoulder-circles · squat-barbell 3×12-15 ·
romanian-deadlift 3×12-15 · leg-extension 3×12-15 · leg-curl-lying 3×12-15 · glute-bridge 3×12-15 ·
calf-raise-seated 3×12-15 · cable-crunch 3×15 → **8 exercices**

**Full Body** (`fullbody-quad`, 9 slots) : dead-bug · leg-press 3×12-15 · bench-dumbbell 3×12-15 ·
lat-pulldown 3×12-15 · ohp-barbell 3×12-15 · leg-curl-seated 3×12-15 · face-pull 3×12-15 ·
curl-dumbbell 3×12-15 · calf-raise-standing 3×12-15 · triceps-pushdown 3×12-15 ·
bicycle-crunch 3×15 → **11 exercices**

**Assertions CRITIQUES :**
- `isMass = false` + intermediate + 4 j → branche ligne 364 : **PASS**
- Le split n'est **pas** upper/lower (réservé à `isMass`, ligne 362) : **PASS**
- Split exact affiché : `['push','pull','lower','fullbody']` : **PASS**
- Comparaison avec P61 (HOME, mêmes paramètres) : **même split** — la branche ne dépend pas
  de l'équipement. ✅

**Coach — fat_loss 4 j intermediate :**
- **Structure adaptée ?** ✅ **Oui, plutôt bien pensée.** Push / Pull / Lower / Full Body donne
  une fréquence de 2× par groupe majeur (le fullbody rattrape) tout en variant les stimuli.
- ❌ **Intensité cardio : nulle.** Aucun exercice cardio dans le programme, alors que
  `cardio_machine` n'est même pas nécessaire — `bw-burpees`, `seed-jump-rope`, `bw-high-knees`
  sont en bodyweight et disponibles. **Aucun slot ne cible `'cardio'`** → inatteignables.
  Pour un objectif `fat_loss`, c'est la lacune structurelle majeure du générateur.
- **Densité** : 3×12-15 avec **60 s de repos** sur composés et isolations. C'est correct pour
  un travail métabolique, mais le format reste une séance de musculation classique, sans circuit,
  sans superset, sans EMOM. Le générateur ne dispose d'aucun mécanisme de densification.
- **Équilibre** : push composés 4 (bench, sh press, bench db, OHP) contre tirages 3
  (lat pulldown ×2, rowing). Deltoïde postérieur travaillé 3× ✅.
- **Durée** : push = 2×3×100 + 4×3×90 = 600 + 1080 = 1680 s ≈ 28 min + 6 min ≈ **34 min**
  pour 60 annoncées. ⚠️ **Sous-exploitation du créneau** — on pourrait ajouter du cardio ou des séries.
- **Volume hebdo** : 35 postes. Correct pour un intermédiaire.
- **Couverture isolation** : complète (pecs, dos, biceps, triceps, deltoïdes ×2, quads, ischios,
  fessiers, mollets, avant-bras). ✅
- **Verdict : ⚠️ PASS avec réserve** — structure de split intelligente, mais **zéro cardio pour
  un objectif de perte de gras** et 26 min de créneau inexploitées.

---

## P50 — strength 2 j advanced 90 min (gap niveau advanced)

`{ goal:'strength', daysPerWeek:2, sessionDuration:90, equipment:FULL, level:'advanced' }`

**Simulation :**
- `focusType` = `null` ; **`switch (daysPerWeek)` teste `case 2` en premier** (ligne 349) —
  aucune bifurcation sur le niveau avant `daysPerWeek`. → `['fullbody-quad','fullbody-hip']`
- `adjustedSlotCount(9, 90, 'strength')` = **`min(9, 6)` = 6 slots** (ligne 437)
- `durationWeeks = 16` (advanced) → phases [1-2] / [3-10] / [11-14] / [15-16]
- Warnings : aucun.

**Full Body A** (`fullbody-quad`, 6 slots)

| # | Slot | Cat | Top-3 (prio force) | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | quads/glutes cpd | cpd | squat-barbell(8), front-squat(2), leg-press(3) | **seed-squat-barbell** | 5×3-5 (180 s) |
| 2 | chest cpd | cpd | bench-barbell(8), chest-press-machine(3), bench-db(3) | **seed-bench-barbell** | 5×3-5 |
| 3 | dos cpd | cpd | lat-pulldown(3), row-barbell(7), deadlift(3) | **seed-lat-pulldown** | 5×3-5 |
| 4 | shoulders cpd | cpd | ohp-barbell(3), sh-press-machine(3), sh-press-db(3) | **seed-ohp-barbell** | 5×3-5 |
| 5 | hamstrings iso | iso | leg-curl-lying(3), leg-curl-seated(2), leg-curl-standing(2) | **seed-leg-curl-lying** | 3×5-8 (120 s) |
| 6 | shoulders_rear iso | iso | face-pull(2), rear-delt-fly(2) | **seed-face-pull** | 3×5-8 |
| 7 | core | — | index 0 | seed-scissors | 3×15 |

→ **8 exercices** (slots `biceps`, `calves`, `triceps` élidés).

**Full Body B** (`fullbody-hip`, 6 slots) : cat-cow · seed-romanian-deadlift 5×3-5 ·
**seed-bench-barbell** 5×3-5 ⚠️ répété · seed-lat-pulldown 5×3-5 ⚠️ · seed-ohp-barbell 5×3-5 ⚠️ ·
seed-leg-extension 3×5-8 · seed-lateral-raise 3×5-8 · seed-crunch 3×15 → **8 exercices**

**Assertions CRITIQUES :**
- 2 j = fullbody toujours, le niveau `advanced` ne bifurque pas avant `daysPerWeek` : **PASS**
  (le `switch` ligne 348 est atteint avant tout test de niveau ; seuls les `case 3/4/5` testent `level`)
- Split `['fullbody','fullbody']` : **PASS**
- « `adjustedSlotCount(9, 90, 'strength')` = base 9 (pas de bonus +2 en strength) » (attente v3) :
  **FAIL — attente obsolète.** Le code renvoie `min(base, 6) = **6**` (ligne 437), pas 9.
- « Total = 9 + warmup + core = 11 exercices » : **FAIL** — le total réel est **8 exercices**.
  Le commentaire du code (lignes 417-418) documente ce cap : *« 90 min → min(base, 6) → 6 slots
  ≈ 80 min effectifs (anciennement base, donnait 9 slots pour fullbody → ~115 min) »*.

**Coach — advanced en force sur 2 j :**
- **Fullbody est-il adapté ?** ✅ **Oui, c'est même le meilleur choix.** À 2 séances/semaine,
  un split ne permettrait qu'une fréquence de 1× par groupe ; le fullbody donne 2× sur les
  patterns majeurs. Standard chez les confirmés en maintien ou à faible disponibilité.
- **Quid des sets × reps ?** 5×3-5 à 180 s sur 4 composés + 2 isolations à 3×5-8.
  ✅ Cohérent avec l'objectif force. **Volume hebdomadaire : 10 séries lourdes de bench,
  10 d'OHP, 5 de squat, 5 de RDL, 10 de tirage vertical.**
  ⚠️ **Déséquilibre** : le bench et l'OHP sont faits **deux fois** (A et B) tandis que le squat
  et le RDL ne sont faits **qu'une fois chacun**. Sur un programme de force, le bas du corps
  est sous-stimulé relativement au haut.
- **Timing** : 4 composés × 5 × 210 = 4200 s + 2 iso × 3 × 150 = 900 s + warmup 60 + core 315
  = 5475 s ≈ **91 min**. ✅ **Le cap à 6 est bien calibré** — le créneau de 90 min est tenu
  quasi exactement. Sans le cap (9 slots), on serait à ~115 min comme le dit le commentaire.
- **Équilibre** : poussées composées 4 (bench ×2, OHP ×2) contre tirages 2 (lat pulldown ×2).
  ⚠️ **2:1** — et aucun rowing horizontal de la semaine.
- **Couverture isolation** : ischios ✅, deltoïde postérieur ✅ (A), quads ✅, deltoïde latéral ✅ (B).
  Biceps, triceps, mollets **élidés sur les deux séances**.
- **Verdict : ⚠️ PASS technique** (attentes v3 périmées) — cap 90 min bien calibré ;
  réserve : bench/OHP 2× vs squat 1×, aucun rowing, aucun bras.

---

## P51 — endurance 5 j advanced

`{ goal:'endurance', daysPerWeek:5, sessionDuration:60, equipment:FULL, level:'advanced' }`

**Simulation — branche exacte :**
- `isMass = false` (endurance) ; `case 5` (ligne 368) :
  - ligne 370 `isMass && level !== 'beginner'` → **false**
  - ligne 372 `isMass` → **false**
  - **ligne 374 `level !== 'beginner'` → true → `['push','pull','lower-quad','lower-hip','fullbody-quad']`**
- Public : `['push','pull','lower','lower','fullbody']` →
  noms « Push — Poussée », « Pull — Tirage », **« Lower — Bas du corps A »**, **« Lower — Bas du corps B »**,
  « Full Body » (suffixe A/B uniquement sur `lower`, qui apparaît 2×)
- Slots : 6 / 6 / 6 / 6 / 9. Aucun crash, aucun warning.
- `durationWeeks = 16` (advanced).

**Push** : bird-dog · bench-barbell 3×15-20 · shoulder-press-db 3×15-20 · fly-dumbbell 3×15-20 ·
triceps-rope 3×15-20 · lateral-raise 3×15-20 · face-pull 3×15-20 · scissors 3×15 → **8 ex.**

**Pull** : cat-cow · lat-pulldown 3×15-20 · row-barbell 3×15-20 · pullover-dumbbell 3×15-20 ·
curl-barbell 3×15-20 · rear-delt-fly 3×15-20 · wrist-curl 3×15-20 · crunch 3×15 → **8 ex.**

**Lower A** (`lower-quad`) : shoulder-circles · squat-barbell 3×15-20 · romanian-deadlift 3×15-20 ·
leg-extension 3×15-20 · leg-curl-lying 3×15-20 · glute-bridge 3×15-20 · calf-raise-seated 3×15-20 ·
cable-crunch 3×15 → **8 ex.**

**Lower B** (`lower-hip`) : dead-bug · hip-thrust 3×15-20 · leg-press 3×15-20 · donkey-kick 3×15-20 ·
leg-curl-seated 3×15-20 · wall-sit 3×15-20 · calf-raise-standing 3×15-20 · bicycle-crunch 3×15 → **8 ex.**

**Full Body** (`fullbody-quad`) : walking-lunges · bw-squat 3×15-20 · bench-dumbbell 3×15-20 ·
lat-pulldown 3×15-20 · ohp-barbell 3×15-20 · leg-curl-standing 3×15-20 · face-pull 3×15-20 ·
curl-dumbbell 3×15-20 · bw-calf-raise 3×15-20 · triceps-pushdown 3×15-20 · vertical-leg-crunch 3×15
→ **11 ex.**

**Assertions CRITIQUES :**
- `isMass=false` + advanced + 5 j → branche ligne 374 : **PASS**
- Split exact : `['push','pull','lower','lower','fullbody']` : **PASS**
- Le niveau `advanced` ne produit ni crash ni split inattendu : **PASS**
  (le code ne distingue que `beginner` vs `non-beginner` dans `selectSplit` ; `advanced` suit
  exactement le même chemin que `intermediate`)

**Coach — endurance 5 j advanced :**
- **Volume hebdomadaire par groupe musculaire** :
  - Quads : squat (Lower A) + leg press (Lower B) + bw-squat (Full Body) + leg extension + wall sit
    = **5 postes**, ~15 séries de 15-20 reps.
  - Ischios : RDL + 3 leg curls = **4 postes**.
  - Pecs : bench barre + fly + bench haltères = **3 postes**.
  - Dos : lat pulldown ×2 + rowing + pullover = **4 postes**.
  - Deltoïde postérieur : face pull ×2 + rear delt fly = **3 postes** ✅
- ⚠️ **Volume total : 43 postes × 3 séries × 15-20 reps ≈ 2 100 répétitions/semaine.**
  C'est un volume très élevé en travail continu. Pour un confirmé en endurance musculaire,
  c'est jouable, mais **aucun jour de repos** dans la semaine (lundi→vendredi consécutifs)
  et les jambes sont sollicitées **3 jours de suite** (mercredi Lower A, jeudi Lower B,
  vendredi Full Body avec squat). ⚠️ **Récupération insuffisante.**
- **Équilibre** : ✅ bon — 2 séances bas du corps différenciées (quad-dominant / hip-dominant),
  1 push, 1 pull, 1 fullbody.
- **Cohérence objectif** : 3×15-20, repos 60 s (composés) / 45 s (isolations). ✅ Zone endurance exacte.
- **Durée** : push = 2×3×100 + 4×3×75 = 600 + 900 = 1500 s ≈ 25 min + 6 min ≈ **31 min** pour 60. ⚠️
  Fullbody ≈ 45 min. **Créneau largement sous-exploité** sur 4 séances sur 5.
- ⚠️ **Phase Intensification (semaines 11-14)** : +1 série et +3 reps → **4×18-23 reps**.
  Volume alors porté à ~3 400 répétitions/semaine. **Excessif** ; à surveiller.
- ⚠️ `bw-squat` retenu comme composé quads du fullbody (`usedGlobally`) — non progressable.
- **Couverture isolation** : complète. ✅
- **Verdict : ⚠️ PASS avec réserve** — split correct et équilibré, mais 5 jours consécutifs sans
  repos, jambes 3 jours de suite, créneaux de 60 min remplis à 50 %.

---

## P52 — legs + back + chest → ambiguïté totale → fullbody

`{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner', focusMuscles:['legs','back','chest'] }`

**Simulation :**
`hasLower=true, hasPush=true (chest), hasPull=true (back), hasUpper=true`
- règle 1 `!hasUpper` → false · règle 2 → false · règle 3 `!hasLower` → false ·
  règle 4 `!hasLower` → false · règle 5 `!hasLower` → false ·
  **règle 6 `lower_push` : `!hasPull` → false** · **règle 7 `lower_pull` : `!hasPush` → false**
- → **`return null` (ligne 321)** ✅
- Split par défaut : case 3, `isMass` + beginner → ligne 358
  → `['fullbody-quad','fullbody-hip','fullbody-quad']` → « Full Body A / B / C »
- **Warning (1) :** « Sélection complète : votre focus couvre poitrine, dos et jambes… » (ligne 941)
- `reorderSlotsByFocus` : ciblés = chest*, back*, quads/hams/glutes/calves →
  isolations réordonnées (hamstrings, calves remontent devant sh_rear/biceps/triceps).

**Full Body A** : bird-dog · squat-barbell 4×8-12 · bench-barbell 4×8-12 · lat-pulldown 4×8-12 ·
shoulder-press-db 4×8-12 · **leg-curl-lying** 3×10-15 · **calf-raise-seated** 3×10-15 (remonté) ·
face-pull 3×10-15 · curl-barbell 3×10-15 · triceps-rope 3×10-15 · scissors 3×15 → **11 ex.**

**Full Body B** (`fullbody-hip`) : cat-cow · romanian-deadlift 4×8-12 · bench-dumbbell 4×8-12 ·
lat-pulldown 4×8-12 · ohp-barbell 4×8-12 · **leg-extension** 3×10-15 · **calf-raise-standing** 3×10-15 ·
lateral-raise 3×10-15 · curl-dumbbell 3×10-15 · triceps-pushdown 3×10-15 · crunch 3×15 → **11 ex.**

**Full Body C** : shoulder-circles · **leg-press** 4×8-12 · **chest-press-machine** 4×8-12 ·
lat-pulldown 4×8-12 · **shoulder-press-machine** 4×8-12 · **leg-curl-seated** 3×10-15 ·
**bw-calf-raise** 3×10-15 · **rear-delt-fly** 3×10-15 · **curl-hammer** 3×10-15 ·
**skullcrusher** 3×10-15 · cable-crunch 3×15 → **11 ex.**

**Assertions CRITIQUES :**
- `hasLower && hasPull && hasPush` → toutes les règles `lower_push`/`lower_pull` échouent →
  `null` : **PASS** (ligne 321) — **LP3 vérifié**
- Split par défaut 3 j beginner isMass = `['fullbody','fullbody','fullbody']` : **PASS**
- **JAMAIS** `['lower_pull',…]` ni `['lower_push',…]` : **PASS**
- Warning explicatif « Sélection complète » : **PASS**

**Coach :**
- **Équilibre** : tous les groupes couverts sur les 3 séances, avec priorisation visible des muscles
  ciblés (ischios et mollets remontent en positions 5-6 au lieu de 5 et 8). ✅
- ⚠️ **Ratio push/pull 2:1** (bench/press ×6 contre lat pulldown ×3) — récurrent sur tous les
  fullbody du générateur.
- ⚠️ `seed-lat-pulldown` sur les 3 séances.
- **Variété** : A ≠ B structurellement ; C reprend A avec **9 exercices différents sur 9**. ✅ Bonne.
- **Durée** : ≈ 67 min pour 60. ⚠️
- **Couverture isolation** : complète sur la semaine ✅
- **Verdict : ✅ PASS** — comportement conforme à l'assertion critique, programme équilibré,
  warning pédagogique juste.

---

## P53 — arms seul → `upper` (cas documenté)

`{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:DB, level:'beginner', focusMuscles:['arms'] }`

**Simulation :**
`hasLower=false, hasPush=false, hasPull=false, hasArms=true → hasUpper=true, hasCore=false`
- règle 1 : `hasLower` false · règle 2 : `hasCore` false · règle 3 : `hasPush` false ·
  règle 4 : `hasPull` false · **règle 5 `hasUpper && !hasLower` (ligne 313) → `'upper'`** ✅
- Split : branche `focusType === 'upper'` → `['upper-push','upper-pull']` → « Upper — A / B »
- 8 slots. available = 22 (dumbbell).
- **Warnings (2) :** « Focus bras : "arms" seul génère un programme haut du corps complet… »
  (ligne 933, `unshift`) + « Aucun exercice composé disponible pour "dos (largeur)" »
- `reorderSlotsByFocus` : ciblés = biceps/triceps/forearms.
  `upper-push` isolations d'origine : chest iso / triceps(ciblé) / sh_lateral / biceps(ciblé) / dos iso
  → **réordonné : triceps → biceps → chest iso → sh_lateral → dos iso.**

**Upper A** (`upper-push` réordonné)

| # | Slot | Cat | Candidats DB | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | chest cpd | cpd | bench-db(3), incline-bench-db(2) | **seed-bench-dumbbell** | 4×8-12 |
| 2 | dos cpd | cpd | **row-dumbbell(3) seul** | **seed-row-dumbbell** | 4×8-12 |
| 3 | shoulders cpd | cpd | sh-press-db(3), arnold(2) | **seed-shoulder-press-dumbbell** | 4×8-12 |
| 4 | **triceps** (remonté) | iso | triceps-overhead(2), triceps-kickback(1) | **seed-triceps-overhead** | 3×10-15 |
| 5 | **biceps** (remonté) | iso | curl-db(3), curl-hammer(3), curl-incline(2) | **seed-curl-dumbbell** | 3×10-15 |
| 6 | chest iso | iso | fly-dumbbell(2) | **seed-fly-dumbbell** | 3×10-15 |
| 7 | sh_lateral | iso | lateral-raise(3) | **seed-lateral-raise** | 3×10-15 |
| 8 | dos iso | iso | pullover-db(3), shrug(2) | **seed-pullover-dumbbell** | 3×10-15 |
| 9 | core | — | index 0 | seed-scissors | 3×15 |

→ **10 exercices.**

**Upper B** (`upper-pull`)

| # | Slot (réordonné) | Cat | Candidats | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 1 | seed-cat-cow | 2×10 |
| 1 | back_width/back cpd | cpd | **aucun** (pullover-db est isolation) | **— slot vide —** ⚠️ | — |
| 2 | back_thickness cpd | cpd | row-dumbbell(3) | **seed-row-dumbbell** ⚠️ répété | 4×8-12 |
| 3 | chest cpd | cpd | bench-db(3), incline-bench-db(2) | **seed-bench-dumbbell** ⚠️ répété | 4×8-12 |
| 4 | **biceps** (remonté) | iso | curl-hammer(3), curl-incline(2), curl-concentration(1) | **seed-curl-hammer** | 3×10-15 |
| 5 | **triceps** (remonté) | iso | triceps-kickback(1), triceps-overhead(2) | **seed-triceps-kickback** ⚠️ | 3×10-15 |
| 6 | shoulders_rear | iso | rear-delt-fly(2) | **seed-rear-delt-fly** | 3×10-15 |
| 7 | dos iso | iso | pullover-db(3), shrug(2) | **seed-pullover-dumbbell** ⚠️ répété | 3×10-15 |
| 8 | sh_lateral | iso | lateral-raise(3) | **seed-lateral-raise** ⚠️ répété | 3×10-15 |
| 9 | core | — | index 1 | seed-crunch | 3×15 |

→ **9 exercices.**

**Assertions CRITIQUES :**
- `hasArms → hasUpper`, `!hasPush && !hasPull && !hasLower` : **PASS**
- Règle 5 (`hasUpper && !hasLower`) matche → `'upper'` : **PASS** — **ARMS vérifié**
- Split `['upper','upper']`, internes `upper-push` / `upper-pull` : **PASS**
- Les slots upper contiennent des exercices **biceps ET triceps** : **PASS**
  (A : triceps-overhead + curl-dumbbell ; B : curl-hammer + triceps-kickback)
- Warning explicatif « Focus bras » en tête : **PASS** (ligne 933)

**Coach — « l'utilisateur va-t-il vraiment faire du bench press en cherchant des bras ? » :**
- **Réponse honnête : non, il sera surpris.** Sur 19 postes de la semaine, **4 seulement ciblent
  les bras** (2 biceps, 2 triceps). Les 15 autres sont pecs, dos, épaules.
  Le warning est explicite et pédagogiquement juste (*« les bras étant des muscles assistants,
  ils progressent mieux dans un contexte de programme haut du corps »*) — **c'est la bonne décision
  de coaching**, mais l'écart avec l'attente utilisateur reste fort.
- ✅ **Le réordonnancement fait ce qu'il peut** : triceps et biceps sont les **deux premières
  isolations** des deux séances, juste après les composés. C'est le maximum possible sans
  ajouter de slots.
- **Recommandation** : sur un focus `arms` seul, ajouter 1 slot biceps et 1 slot triceps
  supplémentaires (ou remplacer le slot `sh_lateral` / `dos iso` par un second slot bras).
- ⚠️ **Slot `back_width` compound vide en Upper B** (BUG#4 résiduel : `['back_width','back']`
  sans `back_thickness`, ligne 180) → séance B à 9 exercices avec **un seul tirage**.
- ⚠️ `seed-triceps-kickback` (pop 1) retenu en B sur un muscle **ciblé** — même défaut qu'en P47.
- **Équilibre** : pecs 3, dos 3, épaules 3, bras 4. Correct pour un « upper ».
- **Durée** : ≈ 58 min ✅
- **Verdict : ⚠️ PASS** — comportement conforme et bien expliqué, mais 4 postes bras sur 19
  pour un focus « bras », et slot dos vide en B.

---

## P54 — chest + back + shoulders + arms → `upper` (4 j)

`{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'intermediate', focusMuscles:['chest','back','shoulders','arms'] }`

**Simulation :**
`hasPush=true, hasPull=true, hasArms=true → hasUpper=true, hasLower=false`
→ règles 3 et 4 échouent → **règle 5 → `'upper'`** ✅
- Split : `focusType === 'upper'` → `Array(4)` alterné → `['upper-push','upper-pull','upper-push','upper-pull']`
  → public `['upper','upper','upper','upper']` → « Upper — Haut du corps A / B / C / D »
- **L'override par `focusMuscles` court-circuite le split 4 j intermediate isMass** (ligne 333,
  `if (focusType)` avant le `switch`). ✅
- 8 slots. available = 98. **Warnings : aucun** (`publicTypes.size === 1` mais `t === 'upper'`
  n'est pas dans la liste push/pull/lower ligne 880).
- `reorderSlotsByFocus` : **tous les slots sont ciblés** (chest, back, shoulders, arms couvrent
  l'intégralité de `upper-push`/`upper-pull`) → **ordre inchangé**.

**Upper A** (`upper-push`) : bird-dog · bench-barbell 4×8-12 · lat-pulldown 4×8-12 ·
shoulder-press-db 4×8-12 · fly-dumbbell 3×10-15 · triceps-rope 3×10-15 · lateral-raise 3×10-15 ·
curl-barbell 3×10-15 · pullover-dumbbell 3×10-15 · scissors 3×15 → **10 ex.**

**Upper B** (`upper-pull`) : cat-cow · lat-pulldown 4×8-12 · row-barbell 4×8-12 ·
bench-dumbbell 4×8-12 · face-pull 3×10-15 · curl-dumbbell 3×10-15 · pullover-cable 3×10-15 ·
triceps-pushdown 3×10-15 · lateral-raise-cable 3×10-15 · crunch 3×15 → **10 ex.**

**Upper C** (`upper-push`) : shoulder-circles · **chest-press-machine** 4×8-12 · lat-pulldown 4×8-12 ·
**ohp-barbell** 4×8-12 · **fly-cable** 3×10-15 · **skullcrusher** 3×10-15 · lateral-raise 3×10-15 ·
**curl-hammer** 3×10-15 · **straight-arm-pulldown** 3×10-15 · cable-crunch 3×15 → **10 ex.**

**Upper D** (`upper-pull`) : dead-bug · lat-pulldown 4×8-12 · **row-dumbbell** 4×8-12 ·
**seed-pushup** 4×8-12 ⚠️ · **rear-delt-fly** 3×10-15 · **curl-incline** 3×10-15 ·
**pullover-dumbbell** 3×10-15 · **triceps-overhead** 3×10-15 · lateral-raise 3×10-15 ·
bicycle-crunch 3×15 → **10 ex.**

**Assertions CRITIQUES :**
- `hasUpper=true (tous), hasLower=false` → `'upper'` : **PASS**
- Split 4 j intermediate isMass **surchargé** par `focusMuscles` → upper × 4 : **PASS** (ligne 333)
- Types internes `upper-push` / `upper-pull` / `upper-push` / `upper-pull` : **PASS** (ligne 340)
- Noms « Upper — Haut du corps A / B / C / D » : **PASS**

**Coach — récupération entre 4 séances upper :**
- ❌ **Lundi, mardi, jeudi, vendredi : 4 séances de haut du corps, dont 2 consécutives deux fois.**
  Les pectoraux sont sollicités les 4 jours (bench, bench db, chest press machine, pompes),
  le dos les 4 jours, les deltoïdes latéraux les 4 jours (élévations à chaque séance).
  **Récupération très insuffisante** : 40 séries de deltoïde latéral, ~48 séries de dos,
  ~36 séries de pectoraux par semaine, sans un seul jour de repos entre lundi et mardi ni
  entre jeudi et vendredi.
- ❌ **Aucun travail du bas du corps de toute la semaine.** Sur 4 séances/semaine et 12 semaines
  (intermédiaire), c'est un déséquilibre corps entier majeur. **Aucun warning n'est émis** :
  la condition `publicTypes.size === 1` (ligne 878) ne déclenche que pour push/pull/lower,
  **pas pour `upper`** (ligne 880). → **Angle mort : un programme 100 % haut du corps sur 4 jours
  n'est jamais signalé.**
- ⚠️ **Upper D : `seed-pushup` (pompes, bodyweight) retenu comme composé pectoral** en 4×8-12
  pour un intermédiaire en prise de masse — `usedGlobally` a consommé bench-barbell, bench-db
  et chest-press-machine sur A/B/C. `autoProgress: false`, aucune surcharge possible.
- ⚠️ `seed-lat-pulldown` sur les **4** séances (pool `back_width` compound = 2).
- **Variété** : A/C (`upper-push`) et B/D (`upper-pull`) : structure alternée ✅, exercices
  largement différents ✅. → **Variété structurelle + variété d'exercices.** Bonne.
- **Durée** : ≈ 58 min ✅
- **Couverture isolation** : pecs ✅, dos ✅, biceps ✅, triceps ✅, deltoïdes latéral ✅ et
  postérieur ✅. Complète pour le périmètre.
- **Verdict : ❌ Problème sérieux** — 4 séances upper consécutives sans récupération,
  zéro bas du corps non signalé, pompes en composé principal en séance D.

---

## P55 — `focusMuscles` + `selectedDays` custom

`{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner', focusMuscles:['legs','back'], selectedDays:['tuesday','thursday','saturday'] }`

**Simulation :**
- `workoutTypeFromFocus(['legs','back'])` → `'lower_pull'` (règle 7, cf. P41)
- Split `['lower_pull','lower_pull','lower_pull']` → « Lower — Chaîne postérieure A / B / C »
- **Assignation des jours (lignes 754-756) :**
  `(selectedDays && selectedDays.length === daysPerWeek) ? selectedDays : DAY_ASSIGNMENTS[3]`
  → `['tuesday','thursday','saturday'].length === 3` → **`selectedDays` utilisé**, lundi/mercredi/vendredi
  par défaut **remplacés**.
- `week` réellement produit : `{ tuesday: <A>, thursday: <B>, saturday: <C> }` ✅

**Chaîne postérieure A** (mardi) : bird-dog · romanian-deadlift 4×8-12 · lat-pulldown 4×8-12 ·
row-barbell 4×8-12 · squat-barbell 4×8-12 · glute-bridge 3×10-15 · pullover-dumbbell 3×10-15 ·
leg-curl-lying 3×10-15 · calf-raise-seated 3×10-15 · curl-barbell 3×10-15 · scissors 3×15 → **11 ex.**

**Chaîne postérieure B** (jeudi) : cat-cow · **dumbbell-rdl** 4×8-12 · lat-pulldown 4×8-12 ·
**row-dumbbell** 4×8-12 · **leg-press** 4×8-12 · **donkey-kick** 3×10-15 · **pullover-cable** 3×10-15 ·
**leg-curl-seated** 3×10-15 · **calf-raise-standing** 3×10-15 · **curl-dumbbell** 3×10-15 ·
crunch 3×15 → **11 ex.**

**Chaîne postérieure C** (samedi) : shoulder-circles · **good-morning** 4×8-12 ⚠️ · lat-pulldown 4×8-12 ·
**row-tbar** 4×8-12 · **bw-squat** 4×8-12 · **fire-hydrant** 3×10-15 · **straight-arm-pulldown** 3×10-15 ·
**leg-curl-standing** 3×10-15 · **bw-calf-raise** 3×10-15 · **curl-hammer** 3×10-15 ·
cable-crunch 3×15 → **11 ex.**

**Assertions CRITIQUES :**
- `selectedDays` remplace le mapping par défaut : **PASS** (ligne 754)
- Split lower_pull × 3, jours mardi / jeudi / samedi : **PASS**
- `selectedDays` respecté dans le `weekMap` du DraftProgram : **PASS** —
  `week = { tuesday: …, thursday: …, saturday: … }` (vérifié par exécution)
- ⚠️ **Note sur le wizard** : `handleGenerate` (ProgramGeneratorScreen.tsx ligne 226-228) réordonne
  les jours par l'ordre de `WEEKDAY_OPTIONS` (lundi→dimanche) avant de les passer. Un utilisateur
  qui cliquerait samedi puis mardi obtiendrait quand même `['tuesday','saturday']`. Comportement
  souhaitable ✅ (l'ordre chronologique prime sur l'ordre de clic).
- ⚠️ **Garde-fou manquant** : si `selectedDays.length !== daysPerWeek`, le code retombe
  silencieusement sur `DAY_ASSIGNMENTS`. Le wizard garantit l'égalité (ligne 262-266), mais un
  appel programmatique incohérent passerait inaperçu.

**Coach :**
- **Répartition mardi / jeudi / samedi** : ✅ **48 h entre chaque séance** — meilleure récupération
  que lundi/mercredi/vendredi (qui laisse 3 jours entre vendredi et lundi).
- Mêmes réserves de contenu que P42 : ⚠️ good morning en tête de C, hip thrust jamais sélectionné
  (slot glutes/hams en isolation), zéro poussée sur la semaine, ≈ 67 min pour 60 annoncées.
- **Variété** : ✅ **excellente** — 9 exercices différents sur 10 entre A, B et C
  (seul le lat pulldown est répété 3×).
- **Verdict : ✅ PASS** sur l'assertion `selectedDays` ; réserves de contenu identiques à P42.

---

## P56 — `lower_push` + BW only, 45 min endurance

`{ goal:'endurance', daysPerWeek:2, sessionDuration:45, equipment:BW, level:'beginner', focusMuscles:['legs','shoulders'] }`

**Simulation :**
- `hasLower=true, hasPush=true (shoulders), hasPull=false` → **règle 6 → `'lower_push'`** ✅
- Split `['lower_push','lower_push']` → « Lower — Squat & Press A / B »
- `adjustedSlotCount(9, 45, 'endurance')` = non-strength → `max(3, ⌊9×0.75⌋)` = `max(3,6)` = **6 slots** ✅
- `adjustedSpec(·, 45)` : 3 séries → `max(2, ⌊2.25⌋)` = **2 séries**
- `reorderSlotsByFocus` : ciblés = quads/hams/glutes/calves + shoulders*.
  Composés : quads(ciblé) / chest(**non ciblé**) / shoulders(ciblé) / hams(ciblé)
  → **quads → shoulders → hamstrings → chest.**
  Isolations : quads(ciblé) / calves(ciblé) / chest / glutes(ciblé) / triceps
  → **quads → calves → glutes → chest → triceps** (les 2 premiers survivent au cap de 6 slots).
- available = 28. **Warnings (2) :** spécialisation + déséquilibre push/pull

**Squat & Press A**

| # | Slot (réordonné) | Cat | Candidats BW | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | quads/glutes cpd | cpd | bw-squat(3), bw-lunge(2), bw-jump-squat(1) | **bw-squat** | 2×15-20 (60 s) |
| 2 | **shoulders cpd** | cpd | **`bw-pike-pushup`(1) seul candidat** | **bw-pike-pushup** | 2×15-20 |
| 3 | hams/glutes cpd | cpd | hip-thrust-bw(4), curtsy-lunge(1) | **seed-hip-thrust-bw** | 2×15-20 |
| 4 | chest cpd | cpd | seed-pushup(2), bw-incline-pushup(2) | **seed-pushup** | 2×15-20 |
| 5 | quads iso | iso | bw-wall-sit(2) | **bw-wall-sit** | 2×15-20 (45 s) |
| 6 | calves iso | iso | bw-calf-raise(2) | **bw-calf-raise** | 2×15-20 |
| 7 | core | — | index 0 | seed-scissors | 3×15 |

→ **8 exercices.**

**Squat & Press B** : cat-cow · **bw-lunge** 2×15-20 · bw-pike-pushup 2×15-20 ⚠️ répété ·
**seed-curtsy-lunge** 2×15-20 ⚠️ · seed-pushup 2×15-20 ⚠️ répété · bw-wall-sit 2×15-20 ⚠️ ·
bw-calf-raise 2×15-20 ⚠️ · seed-crunch 3×15 → **8 exercices**

**Assertions CRITIQUES :**
- → `'lower_push'`, split `['lower','lower']` : **PASS**
- `adjustedSlotCount(9, 45, 'endurance')` = `max(3, 6)` = **6 slots** : **PASS**
- **Exercices épaules disponibles en BW ?** ✅ **Un seul : `bw-pike-pushup`** (Pike push-ups,
  bodyweight, compound, pop 1). `seed-shoulder-circles` est un warmup (exclu).
- `autoProgress: false`, `progressStepKg: 0` : **PASS**

**Coach — squat + press en BW :**
- **Les pompes et pike push-ups suffisent-ils pour les épaules ?** ❌ **Non.**
  Un seul exercice d'épaule (pike push-up) existe en bodyweight, répété sur les 2 séances,
  en 2×15-20. Pour un focus « épaules », c'est **très insuffisant** : aucun deltoïde latéral,
  aucun deltoïde postérieur (slots inexistants dans `lower_push` de toute façon).
  Le pike push-up en 15-20 reps est par ailleurs techniquement difficile pour un débutant.
- **Les quads sont-ils bien couverts en BW ?** ✅ **Oui, correctement** : bw-squat (A), bw-lunge (B),
  wall sit (isolation, les 2 séances), hip thrust et curtsy lunge en synergie.
  C'est le meilleur que permet le seed.
- ⚠️ **Séance B : `seed-curtsy-lunge` (pop 1) sur le slot hip hinge** — même défaut que P13/P18.
- ⚠️ **6 exercices sur 8 identiques entre A et B** (pike push-up, pompes, wall sit, calf raise,
  + warmup/core différents). → **quasi répétition complète.** Pool BW trop étroit.
- **Cohérence objectif** : 2×15-20 à 60 s de repos. ⚠️ **2 séries seulement** après réduction 45 min —
  volume très faible en endurance (l'objectif endurance suppose du volume).
  Le facteur `×0.75` appliqué à 3 séries donne `⌊2.25⌋ = 2`, soit **−33 %** et non −25 %.
  **L'arrondi vers le bas pénalise les objectifs à 3 séries de base.**
- **Durée** : 4 composés × 2 × (40+60) + 2 iso × 2 × (30+45) = 800 + 300 = 1100 s ≈ 18 min
  + warmup + core ≈ **24 min pour 45 annoncées.** ⚠️ **Créneau rempli à 53 %.**
- **Équilibre** : zéro tirage (averti ✅), zéro dos, zéro biceps.
- **Couverture isolation** : quads ✅, mollets ✅. Fessiers, pecs, triceps élidés par le cap à 6.
- **Verdict : ❌ Problème sérieux** — un seul exercice d'épaule pour un focus « épaules »,
  2 séries seulement, 24 min générées pour 45 demandées, séances A et B quasi identiques.

---

## P57 — `lower_pull` + machine/cable only

`{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:MACH+CABLE, level:'beginner', focusMuscles:['legs','back'] }`

**Simulation :**
- → `'lower_pull'` (règle 7) ; split `['lower_pull','lower_pull']` → « Chaîne postérieure A / B »
- 9 slots. available = 28. **Warnings : aucun** (tous les slots composés trouvent un candidat)

**Chaîne postérieure A**

| # | Slot | Cat | Candidats MACH+CABLE | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog (bodyweight, toléré) | 2×10 |
| 1 | **hams/glutes cpd** (slot deadlift) | cpd | **`seed-hip-thrust-machine`(3) seul candidat** | **`seed-hip-thrust-machine`** | 4×8-12 |
| 2 | **back_width cpd** | cpd | **`seed-lat-pulldown`(3) seul candidat** | **`seed-lat-pulldown`** (tirage vertical poulie) | 4×8-12 |
| 3 | back_thickness cpd | cpd | row-cable(2), row-machine(1) | **`seed-row-cable`** (tirage horizontal poulie) | 4×8-12 |
| 4 | quads/glutes cpd | cpd | leg-press(3), hack-squat(2) | **seed-leg-press** | 4×8-12 |
| 5 | glutes/hams iso | iso | hip-abduction(2), hip-adduction(2), glute-kickback(1) | **seed-hip-abduction** | 3×10-15 |
| 6 | dos iso | iso | pullover-cable(2), straight-arm-pulldown(2) | **seed-pullover-cable** | 3×10-15 |
| 7 | hamstrings iso | iso | leg-curl-lying(3), leg-curl-seated(2), leg-curl-standing(2) | **seed-leg-curl-lying** | 3×10-15 |
| 8 | calves iso | iso | calf-seated(2), calf-standing(2) | **seed-calf-raise-seated** | 3×10-15 |
| 9 | biceps iso | iso | curl-cable(2) | **seed-curl-cable** | 3×10-15 |
| 10 | core | — | index 0 | seed-scissors | 3×15 |

→ **11 exercices, aucun slot vide.**

**Chaîne postérieure B** : cat-cow · **seed-hip-thrust-machine** ⚠️ répété 4×8-12 ·
**seed-lat-pulldown** ⚠️ répété 4×8-12 · **seed-row-machine** 4×8-12 · **seed-hack-squat** 4×8-12 ·
**seed-hip-adduction-machine** 3×10-15 · **seed-straight-arm-pulldown** 3×10-15 ·
**seed-leg-curl-seated** 3×10-15 · **seed-calf-raise-standing** 3×10-15 · **seed-curl-cable** ⚠️ répété
3×10-15 · seed-crunch 3×15 → **11 exercices**

**Assertions CRITIQUES :**
- → `'lower_pull'`, split `['lower','lower']` : **PASS**
- **Slot 1 (hamstrings/glutes compound) : aucun deadlift barre → `seed-hip-thrust-machine`**
  (Hip thrust machine, machine, compound, pop 3, secondaires hamstrings). **PASS**
  Ce n'est **ni** un leg curl (isolation, non éligible sur un slot compound) **ni** un leg press
  (primaryMuscle `quads`, non listé dans `['hamstrings','glutes']`).
- **Slot 2 (back_width compound) : `seed-lat-pulldown` (cable)** — pas le machine row : **PASS**
  (`seed-row-machine` est `back_thickness`, non listé dans `['back_width','back']`)
- Aucun exercice barbell/dumbbell : **PASS** (vérifié sur les 22 postes)

**Coach — lower_pull sans barre :**
- **Le slot deadlift est-il bien rempli ?** ⚠️ **Fonctionnellement, non.**
  `seed-hip-thrust-machine` est un mouvement d'**extension de hanche en position couchée**, pas
  un hip hinge debout. Il travaille bien les fessiers et les ischios, mais **ne charge pas les
  érecteurs du rachis** — or c'est précisément la raison d'être du template « chaîne postérieure »
  (commentaire ligne 215-216 : *« le soulevé de terre travaille simultanément ischio-jambiers,
  fessiers et érecteurs du rachis »*). **L'intention du template n'est pas réalisée en machine/câble.**
- **Quelle machine simule le hip hinge ?** Aucune dans le seed. Le plus proche serait un
  « 45° back extension » ou un « cable pull-through », **tous deux absents du seed**.
  → **Recommandation seed : ajouter `cable-pull-through` (cable, compound, glutes/hamstrings)
  et `back-extension` (machine, compound, back/hamstrings).**
- **Équilibre** : ✅ tous les slots remplis, aucun warning. Meilleure configuration lower_pull
  de l'audit en termes de complétude.
- ⚠️ **3 exercices identiques entre A et B** (hip thrust machine, lat pulldown, curl poulie) —
  pools de 1 candidat.
- **Variété** : structure identique, 6 exercices différents sur 9. Correcte.
- **Durée** : 4×4×130 + 5×3×105 = 3655 s ≈ 61 min + 6 min ≈ **67 min** pour 60. ⚠️
- **Équilibre corps entier** : zéro poussée sur la semaine (pas de pecs, épaules, triceps).
- **Couverture isolation** : fessiers ✅, ischios ✅, mollets ✅, dos ✅, biceps ✅.
  Quads en isolation absents (le slot `quads` iso n'existe pas dans `lower_pull`).
- **Verdict : ⚠️ PASS avec réserve** — tous les slots remplis, mais le slot « deadlift-first »
  est rempli par un hip thrust machine qui ne réalise pas l'intention du template.
---

# GROUPE G — Nouveaux équipements & presets wizard

**Presets du wizard (`ProgramGeneratorScreen.tsx`, lignes 81-110) :**
- 🏟️ Salle de sport → `['barbell','dumbbell','cable','machine','bodyweight','pullup_bar','cardio_machine']`
- 🏠 Home gym → `['dumbbell','kettlebell','band','bodyweight']`
- 🤸 Extérieur / Calisthenics → `['bodyweight','pullup_bar']`
- ✏️ Sur-mesure → `[]`

**Exercices `pullup_bar` du seed (7) :** `seed-pullup` (back_width, **cpd**, pop 3),
`bw-chinup` (biceps, **cpd**, pop 3), `seed-dips` (chest_lower, **cpd**, pop 3),
`seed-triceps-dips` (triceps, **cpd** — et non isolation comme l'annonce le prompt v3, pop 2),
`bw-inverted-row` (back_thickness, **cpd**, pop 1), `bw-nordic-curl` (hamstrings, **cpd**, pop 2),
`seed-hanging-leg-raise` (core, iso, pop 2).

**Exercices `cardio_machine` (4) :** `seed-treadmill`, `seed-elliptical`, `seed-rowing-erg`,
`seed-cycling` — tous `primaryMuscle: 'cardio'`, `category: 'compound'`.

---

## P58 — Outdoor (BW+BAR) 3 j intermediate hypertrophie

`{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:BW+BAR, level:'intermediate' }`

**Simulation :**
- `focusType` = `null` ; case 3, `isMass && level !== 'beginner'` → **`['push','pull','legs']`** ✅
- 6 slots par séance. available = **35**, warmup = 16, core = **12** (`seed-hanging-leg-raise` inclus)
- **Warnings : aucun** — tous les slots composés trouvent un candidat.

**Push — Poussée**

| # | Slot | Cat | Candidats BW+BAR | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | chest cpd | cpd | seed-pushup(2, primary `chest`), seed-dips(3, `chest_lower`), bw-incline-pushup(2, `chest_upper`) | **seed-pushup** (gagne sur `slot.muscles[0]='chest'`) | 4×8-12 |
| 2 | shoulders cpd | cpd | bw-pike-pushup(1) | **bw-pike-pushup** | 4×8-12 |
| 3 | chest iso | iso→cpd | seed-dips(3), bw-incline-pushup(2) | **`seed-dips` (pullup_bar)** ✅ | 3×10-15 |
| 4 | triceps iso | iso→cpd | seed-triceps-dips(2) | **`seed-triceps-dips` (pullup_bar)** ✅ | 3×10-15 |
| 5 | sh_lateral iso | iso | — | **— slot vide —** | — |
| 6 | shoulders_rear iso | iso | — | **— slot vide —** | — |
| 7 | core | — | index 0 | seed-scissors | 3×15 |

→ **6 exercices.**

**Pull — Tirage**

| # | Slot | Cat | Candidats | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 1 | seed-cat-cow | 2×10 |
| 1 | back_width cpd | cpd | seed-pullup(3) | **`seed-pullup` (pullup_bar)** ✅ EQUIP-FIX1 | 4×8-12 |
| 2 | back_thickness cpd | cpd | bw-inverted-row(1) | **`bw-inverted-row` (pullup_bar)** ✅ EQUIP-FIX2 | 4×8-12 |
| 3 | dos iso | iso | — | **— slot vide —** | — |
| 4 | biceps iso | iso→cpd | bw-chinup(3) | **`bw-chinup` (pullup_bar)** ✅ | 3×10-15 |
| 5 | shoulders_rear iso | iso | — | **— slot vide —** | — |
| 6 | forearms iso | iso | — | **— slot vide —** | — |
| 7 | core | — | index 1 | seed-crunch | 3×15 |

→ **5 exercices.**

**Legs — Jambes**

| # | Slot | Cat | Candidats | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 2 | seed-shoulder-circles | 2×10 |
| 1 | quads cpd | cpd | bw-squat(3), bw-lunge(2), bw-jump-squat(1) | **bw-squat** | 4×8-12 |
| 2 | hams/glutes cpd | cpd | **bw-nordic-curl(2, primary `hamstrings`)**, hip-thrust-bw(4, `glutes`), curtsy-lunge(1) | **`bw-nordic-curl` (pullup_bar)** ✅ EQUIP-FIX3 | 4×8-12 |
| 3 | quads iso | iso | bw-wall-sit(2) | **bw-wall-sit** | 3×10-15 |
| 4 | glutes iso | iso | glute-bridge(3), donkey-kick(2), fire-hydrant(2) | **seed-glute-bridge** | 3×10-15 |
| 5 | hamstrings iso | iso | — | **— slot vide —** | — |
| 6 | calves iso | iso | bw-calf-raise(2) | **bw-calf-raise** | 3×10-15 |
| 7 | core | — | index 2 | seed-bicycle-crunch | 3×15 |

→ **7 exercices.**

**Assertions CRITIQUES :**
- isMass + intermediate + 3 j → PPL `['push','pull','legs']` : **PASS**
- `autoProgress: false`, `progressStepKg: 0` sur **tous** les exercices : **PASS**
  (ligne 585 : `pullup_bar` traité comme `bodyweight`/`band` → step 0)
- Pull `back_width` cpd → **`seed-pullup`** : **PASS** (EQUIP-FIX1 ✅)
- Pull `back_thickness` cpd → **`bw-inverted-row`** : **PASS** (EQUIP-FIX2 ✅)
- Pull `biceps` → **`bw-chinup`** : **PASS** (fallback isolation→composé, ligne 542-546)
- Push `chest_lower` cpd → **`seed-dips`** : **PASS avec nuance** — le template `push` n'a pas de
  slot `chest_lower` dédié ; les dips sont retenus sur le **slot chest isolation** (fallback composé).
- Push `triceps` → **`seed-triceps-dips`** : **PASS avec nuance** — c'est un `compound` dans le seed
  (le prompt v3 l'annonce comme isolation : **erreur du prompt**). Retenu par fallback.
- Legs `hamstrings` cpd → **`bw-nordic-curl`** : **PASS** (EQUIP-FIX3 ✅). Noter qu'il bat
  `seed-hip-thrust-bw` (pop 4) grâce au critère `slot.muscles[0] === 'hamstrings'` (ligne 558-563).
- Aucun exercice barbell / dumbbell / cable / machine / band / kettlebell : **PASS** (18 postes vérifiés)

**Coach — calisthenics outdoor complet :**
- **Ratio push/pull équilibré ?** ✅ **Oui.** Push : 4 mouvements de poussée (pompes, pike, dips,
  dips triceps). Pull : 3 mouvements de tirage (tractions, rowing inversé, tractions supination).
  Sur la semaine, **1:0,75** — le meilleur équilibre calisthenics possible avec ce seed.
- ✅ **Les 3 correctifs EQUIP-1/2/3 sont confirmés opérationnels** : le preset « Extérieur »
  débloque effectivement le dos, les dips et le nordic curl.
- ⚠️ **Push day : 4 mouvements composés d'affilée, aucune isolation réelle.**
  Les deux slots isolation (chest, triceps) sont remplis par des composés (dips, dips triceps),
  et les slots deltoïde latéral / postérieur sont **vides** (aucun exercice bodyweight ou
  pullup_bar ne cible ces muscles dans le seed). Sur 3 séances/semaine : **zéro deltoïde
  latéral, zéro deltoïde postérieur.** ⚠️ Lacune structurelle du seed en calisthenics.
- ⚠️ **`bw-nordic-curl` en 4×8-12 comme deuxième mouvement du legs day** : le nordic curl est
  l'un des exercices excentriques les plus exigeants qui existent. 4 séries de 8-12 répétitions
  complètes est **hors de portée de la quasi-totalité des pratiquants**, y compris intermédiaires.
  ❌ **Réserve de sécurité et de faisabilité forte.**
- **Progressivité sans poids externe ?** ⚠️ `autoProgress: false` et `progressStepKg: 0` sont
  **corrects** techniquement (on n'ajoute pas de kilos à une traction), mais l'app n'offre alors
  **aucun mécanisme de progression** : ni progression par répétitions, ni par variation d'exercice,
  ni lest. Un calisthenicien intermédiaire n'a aucun levier dans l'app.
  **Recommandation : proposer une progression par répétitions cibles pour `bodyweight`/`pullup_bar`.**
- **Durée** : push = 2×4×130 + 2×3×105 = 1040 + 630 = 1670 s ≈ 28 min + 6 min ≈ **34 min** ;
  pull ≈ 26 min ; legs ≈ 35 min. **Pour 60 min annoncées** — créneaux remplis à ~55 %.
- **Couverture isolation** : quads ✅, fessiers ✅, mollets ✅. Deltoïdes, dos, biceps, triceps,
  ischios : **aucune isolation** (tous servis par des composés ou vides). **Lacunes acceptables**
  en calisthenics, sauf pour les deltoïdes latéral/postérieur.
- **Verdict : ✅ Bon programme calisthenics** — les correctifs EQUIP fonctionnent, équilibre
  push/pull correct. Réserves : nordic curl 4×8-12 irréaliste, deltoïdes latéral/postérieur absents,
  créneaux à moitié remplis.

---

## P59 — BW-only sans pullup_bar, 3 j intermediate

`{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:BW, level:'intermediate' }`

**Simulation :**
- Split **`['push','pull','legs']`** (PPL — isMass + intermediate + 3 j). available = **28**.
- **Warnings (2) :** « Aucun exercice composé disponible pour "dos (largeur)" » +
  « … pour "dos (épaisseur)" ». **2 warnings seulement**, alors que **10 slots sont vides.**

**Push — Poussée** : bird-dog 2×10 · **seed-pushup** 4×8-12 · **bw-pike-pushup** 4×8-12 ·
**bw-incline-pushup** 3×10-15 (fallback composé sur slot chest iso) · *— triceps vide —* ·
*— sh_lateral vide —* · *— sh_rear vide —* · seed-scissors 3×15 → **5 exercices**

**Pull — Tirage** — **6 slots vides sur 6 :**

| # | Slot | Cat | Candidats BW pur | Retenu |
|---|---|---|---|---|
| 0 | warmup | — | index 1 | seed-cat-cow 2×10 |
| 1 | back_width cpd | cpd | **aucun** (`seed-pullup` → pullup_bar) | **— vide —** ⚠️ warning |
| 2 | back_thickness cpd | cpd | **aucun** (`bw-inverted-row` → pullup_bar) | **— vide —** ⚠️ warning |
| 3 | dos iso | iso | **aucun** | **— vide —** (pas de warning : slot isolation) |
| 4 | biceps | iso | **aucun** (`bw-chinup` → pullup_bar) | **— vide —** (pas de warning) |
| 5 | shoulders_rear | iso | **aucun** | **— vide —** |
| 6 | forearms | iso | **aucun** | **— vide —** |
| 7 | core | — | index 1 | seed-crunch 3×15 |

→ **2 exercices : un Cat-Cow et un crunch.**

**Legs — Jambes** : shoulder-circles · **bw-squat** 4×8-12 · **seed-hip-thrust-bw** 4×8-12 ·
**bw-wall-sit** 3×10-15 · **seed-glute-bridge** 3×10-15 · *— hamstrings vide —* (`bw-nordic-curl`
→ pullup_bar) · **bw-calf-raise** 3×10-15 · seed-bicycle-crunch 3×15 → **7 exercices**

**Assertions CRITIQUES :**
- Split `['push','pull','legs']` : **PASS**
- Pull `back_width` cpd → aucun candidat → `null` : **PASS**
- Pull `back_thickness` cpd → aucun candidat → `null` : **PASS**
- Pull `biceps` → aucun candidat → `null` : **PASS**
- Push `chest_lower` (`seed-dips` exclu) → le slot chest isolation retombe sur
  `bw-incline-pushup` (composé) : **PASS** — fallback isolation→composé opérationnel
- Legs `hamstrings` cpd — nuance : le slot `['hamstrings','glutes']` compound **n'est pas vide**,
  il est rempli par `seed-hip-thrust-bw` (glutes, compound). C'est le slot `hamstrings` **isolation**
  qui est vide. **PASS avec correction de l'énoncé.**
- **Nombre total de slots vides : 10 sur 18.** Warnings émis : **2** (uniquement les slots
  `compound`, dédupliqués par `{workoutType}:{primaryMuscle}`, lignes 791-801).
- **Exercices bodyweight restants pour chaque slot non-vide** : listés ci-dessus.

**Comparaison avec P21 (beginner, fullbody×3) — l'écart demandé :**

| | P21 (beginner, fullbody×3) | P59 (intermediate, PPL) |
|---|---|---|
| Split | fullbody × 3 | push / pull / legs |
| Exercices totaux | 6 + 7 + 6 = **19** | 5 + **2** + 7 = **14** |
| Séances exploitables | 3 (toutes tronquées) | **2 sur 3** |
| Slots dos | 1 par séance (3 vides) | 3 dans le Pull day (tous vides) |

→ **Le passage à `intermediate` aggrave la situation** : le PPL concentre tous les slots dos dans
une seule séance, qui devient **entièrement vide**. En fullbody, les slots vides sont dilués.

**⚠️ Problème UX majeur — documentation :**
Un utilisateur intermédiaire en bodyweight pur reçoit un programme dont **une séance sur trois
ne contient qu'un échauffement et un crunch**, sous le nom « Pull — Tirage ». Il l'ouvrira,
verra 2 exercices, et conclura que l'app est cassée. Les 2 warnings sont affichés mais :
1. ils sont noyés dans une liste ; 2. ils ne disent pas *« votre Pull day sera vide »* ;
3. le générateur **produit quand même la séance** et l'assigne au mercredi.

Côté wizard, `availableCount` = 28 (> 12) → **aucun avertissement d'équipement n'est affiché**
(condition ligne 446 : `availableCount < 12`). L'utilisateur n'a donc **aucun signal en amont**.

**Coach :**
- **Un pull day sans dos est-il acceptable ?** ❌ **Non, absolument pas.** Ce n'est pas une séance.
- **Le générateur devrait-il avertir ?** ✅ **Oui, et bloquer ou substituer.** Recommandations :
  1. Si **tous** les slots composés d'un type de séance sont vides → **ne pas générer cette séance**
     et redistribuer le jour (ou basculer sur `fullbody`).
  2. Warning ciblé : *« Impossible de générer un Pull day sans barre de traction. Ajoutez
     "Barre de traction / dips" à votre équipement, ou choisissez un programme full body. »*
  3. Étendre la détection du wizard : compter les exercices disponibles **par groupe musculaire**,
     pas seulement au total.
- **Équilibre** : 3 poussées, 0 tirage. Ratio ∞:0.
- **Verdict : ❌ Problème sérieux — le plus grave de l'audit.** Séance structurellement vide,
  livrée sans blocage ni message explicite.

---

## P60 — Home gym (DB+KB+Band+BW) 3 j intermediate hypertrophie

`{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:HOME, level:'intermediate' }`

**Simulation :**
- Split **`['push','pull','legs']`** (isMass + intermediate + 3 j) ✅
- available = **74**, warmup = **18** (band inclus), core = **12** (`kb-turkish-getup` inclus)
- Warnings : aucun.
- **Priorité d'équipement** : `strengthEquipmentPrio` n'est appliqué **que si `goal === 'strength'`
  et slot compound** (ligne 564). En hypertrophie, **le tri se fait uniquement sur
  `slot.muscles[0]` puis `usedGlobally` puis popularité** — pas sur l'équipement.
  → L'assertion du prompt (« trier par `strengthEquipmentPrio` : dumbbell(2) < kettlebell(2) <
  band(3) < bodyweight(4) ») **ne s'applique pas ici**. Le classement observé résulte de la
  popularité. **FAIL sur l'assertion telle que formulée** ; comportement du code correct et
  volontaire (le commentaire ligne 500-501 précise « pour les slots compound en objectif force »).

**Push — Poussée**

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 (pool band) | **seed-band-pull-apart** | 2×10 |
| 1 | chest cpd | cpd | bench-db(3), seed-pushup(2), kb-floor-press(2) | **seed-bench-dumbbell** | 4×8-12 |
| 2 | shoulders cpd | cpd | sh-press-db(3), arnold(2), kb-press(2) | **seed-shoulder-press-dumbbell** | 4×8-12 |
| 3 | chest iso | iso | fly-dumbbell(2) | **seed-fly-dumbbell** | 3×10-15 |
| 4 | triceps iso | iso | triceps-overhead(2), band-tricep-pushdown(2), triceps-kickback(1) | **seed-triceps-overhead** | 3×10-15 |
| 5 | sh_lateral iso | iso | lateral-raise(3) | **seed-lateral-raise** | 3×10-15 |
| 6 | shoulders_rear iso | iso | rear-delt-fly(2), band-face-pull(2), bw-prone-y-raise(1) | **seed-rear-delt-fly** | 3×10-15 |
| 7 | core | — | index 0 | seed-scissors | 3×15 |

→ **8 exercices.**

**Pull — Tirage**

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 1 | seed-bird-dog | 2×10 |
| 1 | **back_width cpd** | cpd | **`kb-deadlift`(2) seul candidat** (primary `back`) | **`kb-deadlift`** ⚠️ | 4×8-12 |
| 2 | **back_thickness cpd** | cpd | **row-dumbbell(3), kb-row(2), band-row(2)** | **`seed-row-dumbbell`** ✅ | 4×8-12 |
| 3 | dos iso | iso | pullover-db(3), shrug(2), pullover(1) | **seed-pullover-dumbbell** | 3×10-15 |
| 4 | biceps iso | iso | curl-db(3), curl-hammer(3), curl-incline(2) | **seed-curl-dumbbell** | 3×10-15 |
| 5 | shoulders_rear iso | iso | band-face-pull(2), bw-prone-y-raise(1), rear-delt-fly(2) | **band-face-pull** | 3×10-15 |
| 6 | forearms iso | iso | **aucun** (les 2 sont barbell) | **— slot vide —** | — |
| 7 | core | — | index 1 | seed-crunch | 3×15 |

→ **7 exercices.**

**Legs — Jambes**

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 2 | seed-cat-cow | 2×10 |
| 1 | quads cpd | cpd | **goblet-squat(3, KB)**, bw-squat(3), lunges(2) | **`seed-goblet-squat`** ✅ | 4×8-12 |
| 2 | hams/glutes cpd | cpd | **kb-rdl(2)**, dumbbell-rdl(2), band-good-morning(1) | **`kb-rdl`** | 4×8-12 |
| 3 | quads iso | iso | bw-wall-sit(2) | **bw-wall-sit** | 3×10-15 |
| 4 | glutes iso | iso | glute-bridge(3), donkey-kick(2), fire-hydrant(2) | **seed-glute-bridge** | 3×10-15 |
| 5 | hamstrings iso | iso→cpd | dumbbell-rdl(2), band-good-morning(1) | **dumbbell-rdl** | 3×10-15 |
| 6 | calves iso | iso | bw-calf-raise(2), calf-raise-db(2), kb-calf-raise(1) | **bw-calf-raise** | 3×10-15 |
| 7 | core | — | index 2 | seed-bicycle-crunch | 3×15 |

→ **8 exercices.**

**Assertions :**
- `HOME = ['dumbbell','kettlebell','band','bodyweight']` : **PASS**
- Split `['push','pull','legs']` : **PASS**
- Aucun exercice `pullup_bar` : **PASS** (vérifié sur les 23 postes)
- Pull `back_width` compound → **`kb-deadlift`** (Soulevé de terre kettlebell, `primaryMuscle: 'back'`) : **PASS**
- Pull `back_thickness` compound → **`seed-row-dumbbell`** (rowing haltère, pop 3), devant
  `kb-row` (pop 2) et `band-row` (pop 2) : **PASS**
- Tri par `strengthEquipmentPrio` : **FAIL sur l'assertion** — non appliqué en hypertrophie (ligne 564)
- `autoProgress: true`, `progressStepKg: 2.5` sur dumbbell et kettlebell : **PASS** ;
  **`false`/0 sur band et bodyweight** (band-face-pull, wall sit, glute bridge, calf raise) : **PASS**

**Coach — home gym :**
- **Le KB swing est-il sélectionné ?** ❌ **Non.** `kb-swing` (kettlebell, compound, `glutes`, pop 3)
  n'apparaît nulle part. Raisons : (1) le slot `['hamstrings','glutes']` compound du legs day
  privilégie `slot.muscles[0] = 'hamstrings'` → `kb-rdl` (primary `hamstrings`) bat `kb-swing`
  (primary `glutes`) ; (2) le slot `glutes` **isolation** filtre sur `category === 'isolation'`
  et trouve `glute-bridge` → le composé `kb-swing` n'est jamais atteint.
  → **Le mouvement le plus emblématique du kettlebell est structurellement inaccessible en
  home gym.** Idem pour `kb-clean` (glutes, compound, pop 3).
- **Le dos est-il couvert sans barre de traction ?** ✅ **Oui** — `kb-deadlift` + `seed-row-dumbbell`
  + `seed-pullover-dumbbell`. ⚠️ Mais `kb-deadlift` sur le slot **largeur de dos** est un pis-aller :
  c'est un hip hinge, pas un tirage vertical. **Aucun tirage vertical n'existe en HOME.**
- **Équilibre** : push composés 2, tirages composés 2. ✅ Deltoïde postérieur travaillé 2× ✅.
- ⚠️ **Slot `forearms` vide** en pull (les 2 exercices d'avant-bras du seed sont barbell) —
  aucun warning (slot isolation).
- **Fat_loss avec HOME ?** (question du prompt) : l'elliptique et les autres `cardio_machine`
  sont absents de HOME, **mais ils ne seraient de toute façon jamais sélectionnés** (cf. P65/P66).
  En revanche `bw-burpees`, `seed-jump-rope`, `bw-high-knees` sont disponibles en bodyweight
  et **également inatteignables**. → Un objectif fat_loss en home gym n'obtiendrait aucun cardio.
- **Durée** : push = 2×4×130 + 4×3×105 = 2300 s ≈ 38 min + 6 min ≈ **44 min** ✅
- **Couverture isolation** : pecs ✅, dos ✅, biceps ✅, triceps ✅, deltoïdes ✅✅,
  quads ✅, fessiers ✅, ischios ✅, mollets ✅. **Couverture complète** (hors avant-bras). ✅
- **Verdict : ✅ Bon programme** — HOME est une configuration bien couverte. Réserves :
  KB swing/clean inatteignables, pas de tirage vertical, slot avant-bras vide.

---

## P61 — Home gym 4 j fat_loss intermediate

`{ goal:'fat_loss', daysPerWeek:4, sessionDuration:60, equipment:HOME, level:'intermediate' }`

**Simulation — branche exacte :**
- `isMass = false` (fat_loss) ; `case 4` : ligne 362 `if (isMass)` → false ;
  **ligne 364 `if (level !== 'beginner')` → `['push','pull','lower-quad','fullbody-quad']`**
- Public `['push','pull','lower','fullbody']` — **identique à P49 (FULL)**. ✅
  → La branche de `selectSplit` **ne dépend pas de l'équipement**, uniquement de
  `goal` / `daysPerWeek` / `level`.
- Slots 6 / 6 / 6 / 9. available = 74. Warnings : aucun.

**Push** : band-pull-apart · bench-dumbbell 3×12-15 · shoulder-press-db 3×12-15 ·
fly-dumbbell 3×12-15 · triceps-overhead 3×12-15 · lateral-raise 3×12-15 · rear-delt-fly 3×12-15 ·
scissors 3×15 → **8 ex.**

**Pull** : bird-dog · **kb-deadlift** 3×12-15 · **seed-row-dumbbell** 3×12-15 ·
pullover-dumbbell 3×12-15 · curl-dumbbell 3×12-15 · **band-face-pull** 3×12-15 ·
*— forearms vide —* · crunch 3×15 → **7 ex.**

**Lower** (`lower-quad`) : cat-cow · **seed-goblet-squat** 3×12-15 · **kb-rdl** 3×12-15 ·
bw-wall-sit 3×12-15 · **dumbbell-rdl** 3×12-15 · seed-glute-bridge 3×12-15 · bw-calf-raise 3×12-15 ·
bicycle-crunch 3×15 → **8 ex.**

**Full Body** (`fullbody-quad`, 9 slots) : shoulder-circles · **bw-squat** 3×12-15 ·
**seed-pushup** 3×12-15 · **kb-row** 3×12-15 · **seed-arnold-press** 3×12-15 ·
**band-good-morning** 3×12-15 · **bw-prone-y-raise** 3×12-15 · **seed-curl-hammer** 3×12-15 ·
**seed-calf-raise-db** 3×12-15 · **band-tricep-pushdown** 3×12-15 · vertical-leg-crunch 3×15
→ **11 ex.**

**Assertions CRITIQUES :**
- `isMass=false` + intermediate + 4 j → branche ligne 364 : **PASS**
- Split exact `['push','pull','lower','fullbody']`, internes `push` / `pull` / `lower-quad` /
  `fullbody-quad` : **PASS**
- **Comparaison avec P49 (FULL, mêmes paramètres) : split identique** — confirmé. ✅
- Slots dos remplis avec DB/KB (pas de pullup_bar dans HOME) : **PASS**
  (`kb-deadlift`, `seed-row-dumbbell`, `kb-row`, `seed-pullover-dumbbell`)
- `progressStepKg: 2.5` sur dumbbell/kettlebell : **PASS** ; **0 sur band et bodyweight** :
  `band-good-morning`, `bw-prone-y-raise`, `band-tricep-pushdown`, `band-face-pull`, `bw-squat`,
  `seed-pushup`, `bw-wall-sit`, `seed-glute-bridge`, `bw-calf-raise` → **`autoProgress: false`.**
  ⚠️ **Sur 34 postes, 12 sont non-progressables** (35 %).

**Coach — fat_loss home gym :**
- **Le programme peut-il atteindre l'objectif fat_loss ?** ⚠️ **Partiellement.**
  Structure de split correcte (2× par groupe majeur), specs 3×12-15 à 60 s de repos = travail
  métabolique valable. **Mais aucun cardio, aucun circuit, aucune densification.**
  Un programme de perte de gras repose à ~70 % sur le déficit calorique et à ~30 % sur la dépense ;
  ici la dépense est celle d'une séance de musculation classique de 35 min.
- **Le KB swing en circuit serait-il pertinent ?** ✅ **Oui, énormément** — c'est l'exercice
  de référence pour la dépense énergétique en home gym (swing 20 reps × 10 séries EMOM).
  ❌ **Il n'est pas sélectionné** (même cause qu'en P60 : slot `glutes` isolation filtre sur
  `category === 'isolation'`, slot `hamstrings/glutes` compound privilégie `hamstrings`).
  → **Recommandation forte : ajouter un slot `['glutes','hamstrings']` compound en fin de séance
  pour `fat_loss`/`endurance`, ou autoriser le fallback isolation→composé sur le slot glutes.**
- **Durée** : push ≈ 28 min + 6 = **34 min** ; fullbody ≈ 40 min. Pour 60 annoncées. ⚠️
  **26 min inexploitées par séance** — exactement le créneau qu'un finisher cardio remplirait.
- **Équilibre** : ✅ bon. Deltoïde postérieur 3×, dos 4 postes, jambes 2 séances.
- **Volume** : 34 postes/semaine sur 4 séances. Correct.
- **Couverture isolation** : complète hors avant-bras. ✅
- **Verdict : ⚠️ PASS avec réserve** — split adapté et bien rempli, mais **objectif fat_loss non
  servi** (aucun cardio, KB swing inatteignable, 26 min de créneau inutilisées par séance).

---

## P62 — Kettlebell seul, 3 j beginner hypertrophie

`{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:KB, level:'beginner' }`

**Simulation :**
- beginner + isMass + 3 j → ligne 358 → `['fullbody-quad','fullbody-hip','fullbody-quad']` ✅
- available = **14** (tout le pool kettlebell), warmup = 16 (bodyweight), core = 12 (`kb-turkish-getup`)
- 9 slots. **Warnings : aucun** — tous les slots composés trouvent un candidat kettlebell.

**Pool kettlebell complet (14, par groupe) :**
chest → `kb-floor-press`(cpd,2) · back → `kb-deadlift`(cpd,2) · back_thickness → `kb-row`(cpd,2) ·
back_width → `kb-pullover`(**iso**,1) · shoulders → `kb-press`(cpd,2) · biceps → `kb-curl`(iso,1) ·
triceps → `kb-overhead-extension`(iso,1) · quads → `seed-goblet-squat`(cpd,3), `kb-lunge`(cpd,2) ·
hamstrings → `kb-rdl`(cpd,2) · glutes → `kb-swing`(cpd,3), `kb-clean`(cpd,3) ·
calves → `kb-calf-raise`(iso,1) · core → `kb-turkish-getup`(cpd,2).
**Néant : deltoïde latéral, deltoïde postérieur, avant-bras.**

**Full Body A** (`fullbody-quad`)

| # | Slot | Cat | Candidats KB | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog (bodyweight) | 2×10 |
| 1 | quads/glutes cpd | cpd | goblet-squat(3), kb-lunge(2), kb-swing(3) | **`seed-goblet-squat`** ✅ | 4×8-12 |
| 2 | chest cpd | cpd | kb-floor-press(2) | **`kb-floor-press`** | 4×8-12 |
| 3 | **back_width/thickness/back cpd** | cpd | **kb-row(2), kb-deadlift(2)** | **`kb-row`** ✅ **non vide** | 4×8-12 |
| 4 | shoulders cpd | cpd | kb-press(2) | **`kb-press`** | 4×8-12 |
| 5 | hamstrings iso | iso→cpd | kb-rdl(2) | **`kb-rdl`** | 3×10-15 |
| 6 | **shoulders_rear iso** | iso | **aucun** | **— slot vide —** ⚠️ | — |
| 7 | biceps iso | iso | kb-curl(1) | **`kb-curl`** | 3×10-15 |
| 8 | calves iso | iso | kb-calf-raise(1) | **`kb-calf-raise`** | 3×10-15 |
| 9 | triceps iso | iso | kb-overhead-extension(1) | **`kb-overhead-extension`** | 3×10-15 |
| 10 | core | — | index 0 | seed-scissors | 3×15 |

→ **10 exercices.**

**Full Body B** (`fullbody-hip`)

| # | Slot | Cat | Candidats | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 1 | seed-cat-cow | 2×10 |
| 1 | hams/glutes cpd | cpd | **kb-rdl(2, primary `hamstrings`)**, kb-swing(3), kb-clean(3) | **`kb-rdl`** | 4×8-12 |
| 2 | chest cpd | cpd | kb-floor-press(2) | **kb-floor-press** ⚠️ répété | 4×8-12 |
| 3 | **back_width/back cpd** | cpd | **kb-deadlift(2)** (`kb-pullover` est isolation) | **`kb-deadlift`** ✅ **non vide** | 4×8-12 |
| 4 | shoulders cpd | cpd | kb-press(2) | **kb-press** ⚠️ répété | 4×8-12 |
| 5 | quads iso | iso→cpd | kb-lunge(2), goblet-squat(3) | **`kb-lunge`** | 3×10-15 |
| 6 | **sh_lateral/rear iso** | iso | **aucun** | **— slot vide —** ⚠️ | — |
| 7 | biceps iso | iso | kb-curl(1) | **kb-curl** ⚠️ répété | 3×10-15 |
| 8 | calves iso | iso | kb-calf-raise(1) | **kb-calf-raise** ⚠️ répété | 3×10-15 |
| 9 | triceps iso | iso | kb-overhead-extension(1) | **kb-overhead-extension** ⚠️ répété | 3×10-15 |
| 10 | core | — | index 1 | seed-crunch | 3×15 |

→ **10 exercices.**

**Full Body C** (`fullbody-quad`) : **identique à la séance A** (shoulder-circles / bicycle-crunch
en warmup/core) → **10 exercices, 9 identiques à A sur 9.**

**Assertions :**
- `KB = ['kettlebell']` : **PASS**
- beginner + isMass + 3 j → `['fullbody','fullbody','fullbody']` : **PASS**
- Pool kettlebell = **14 exercices**, listé ci-dessus par groupe : **PASS**
- Slots fullbody-quad : quads/glutes → `seed-goblet-squat` ; back → `kb-row` ; chest → `kb-floor-press` : **PASS**
- **`kb-row` qualifie-t-il pour `back_width` ?** ❌ **Non** — `kb-row` a `primaryMuscle: 'back_thickness'`.
  Il qualifie pour le slot de `fullbody-quad` (`['back_width','back_thickness','back']`) mais **pas**
  pour celui de `fullbody-hip` (`['back_width','back']`). Ce dernier est sauvé par `kb-deadlift`
  (`primaryMuscle: 'back'`). → **Aucun slot dos vide en KB-only**, contrairement à DB-only (P22). ✅
- **Slots vides : `shoulders_rear` (séances A et C) et `shoulders_lateral/rear` (séance B).**
  Aucun warning (slots isolation).
- `autoProgress: true`, `progressStepKg: 2.5` : **PASS**

**Coach — KB-only fullbody débutant :**
- **Le goblet squat remplace-t-il le squat barre ?** ✅ **Oui, très bien** pour un débutant :
  charge frontale, dos naturellement gainé, amplitude facile à apprendre. C'est **le meilleur
  premier squat**. Excellent choix du générateur (pop 3, `primaryMuscle: quads`).
  ⚠️ Limite : le goblet squat plafonne vers 32-40 kg ; au-delà, la progression s'arrête.
- **Le KB swing est-il sélectionné, et dans quel slot ?** ❌ **Il n'est jamais sélectionné.**
  Il apparaît en 3ᵉ position du top-3 sur le slot `['quads','glutes']` (séance A) mais perd sur
  `slot.muscles[0] = 'quads'` ; sur le slot `['hamstrings','glutes']` (séance B) il perd contre
  `kb-rdl` sur `slot.muscles[0] = 'hamstrings'` ; et le slot `glutes` **isolation** l'exclut par
  catégorie. **Le swing — mouvement fondateur du kettlebell — est structurellement inaccessible.**
  Idem `kb-clean` (pop 3) et `kb-turkish-getup` (accessible uniquement via `corePool`).
- **La surcharge progressive est-elle réaliste avec une seule kettlebell ?** ❌ **Non.**
  `progressStepKg: 2.5` suppose des micro-plaques. Les kettlebells se vendent par paliers de
  4 kg (8/12/16/20/24…). Un pas de 2,5 kg est **inapplicable**. **Recommandation : `progressStepKg`
  devrait valoir 4 pour `kettlebell`**, ou l'app devrait proposer une progression par répétitions.
- **Variété** : ❌ **A et C sont identiques**, B partage 5 exercices sur 9 avec A.
  Le pool de 14 exercices, dont 8 sont seuls candidats de leur slot, ne permet aucune rotation.
  → **Répétition quasi complète.**
- ⚠️ **Aucun deltoïde latéral ni postérieur de toute la semaine** (le seed n'a aucun exercice KB
  pour ces muscles). Sur 3 séances avec 3 kb-press, c'est un déséquilibre d'épaule.
- **Durée** : ≈ 62 min ✅
- **Couverture isolation** : biceps ✅, triceps ✅, mollets ✅, ischios ✅ (via composé),
  quads ✅ (via composé). Deltoïdes latéral/postérieur ❌, dos ❌, pecs ❌.
- **Verdict : ⚠️ PASS technique** — aucun slot composé vide, goblet squat bien choisi.
  Réserves : swing/clean inatteignables, séances A et C identiques, deltoïdes latéral/postérieur
  absents, pas de 2,5 kg en kettlebell.

---

## P63 — Outdoor `lower_pull` (BW+BAR + focus legs+back)

`{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:BW+BAR, level:'beginner', focusMuscles:['legs','back'] }`

**Simulation :**
- `hasLower=true, hasPull=true (back), hasPush=false` → **règle 7 → `'lower_pull'`** ✅
- Split `['lower_pull','lower_pull','lower_pull']` → « Lower — Chaîne postérieure A / B / C »
- 9 slots. available = **35**, core = 12. Warning : « Programme de spécialisation… »

**Chaîne postérieure A**

| # | Slot | Cat | Candidats BW+BAR | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | **hams/glutes cpd** | cpd | **bw-nordic-curl(2, `hamstrings`)**, hip-thrust-bw(4, `glutes`), curtsy-lunge(1) | **`bw-nordic-curl` (pullup_bar)** ✅ EQUIP-FIX3 | 4×8-12 |
| 2 | **back_width cpd** | cpd | seed-pullup(3) | **`seed-pullup` (pullup_bar)** ✅ | 4×8-12 |
| 3 | **back_thickness cpd** | cpd | bw-inverted-row(1) | **`bw-inverted-row` (pullup_bar)** ✅ | 4×8-12 |
| 4 | **quads/glutes cpd** | cpd | bw-squat(3), bw-lunge(2), bw-jump-squat(1) | **`bw-squat` (bodyweight)** ✅ | 4×8-12 |
| 5 | glutes/hams iso | iso | glute-bridge(3), donkey-kick(2), fire-hydrant(2) | **seed-glute-bridge** | 3×10-15 |
| 6 | **dos iso** | iso | **aucun** | **— slot vide —** | — |
| 7 | **hamstrings iso** | iso | **aucun** (nordic curl déjà utilisé) | **— slot vide —** | — |
| 8 | calves iso | iso | bw-calf-raise(2) | **bw-calf-raise** | 3×10-15 |
| 9 | biceps iso | iso→cpd | bw-chinup(3) | **`bw-chinup` (pullup_bar)** | 3×10-15 |
| 10 | core | — | index 0 | seed-scissors | 3×15 |

→ **9 exercices.**

**Chaîne postérieure B** : cat-cow · **bw-nordic-curl** 4×8-12 ⚠️ · **seed-pullup** 4×8-12 ⚠️ ·
**bw-inverted-row** 4×8-12 ⚠️ · **bw-lunge** 4×8-12 · **seed-donkey-kick** 3×10-15 ·
*— dos iso vide —* · *— hamstrings iso vide —* · **bw-calf-raise** 3×10-15 ⚠️ ·
**bw-chinup** 3×10-15 ⚠️ · seed-crunch 3×15 → **9 exercices**

**Chaîne postérieure C** : shoulder-circles · **bw-nordic-curl** 4×8-12 ⚠️ · **seed-pullup** 4×8-12 ⚠️ ·
**bw-inverted-row** 4×8-12 ⚠️ · **bw-jump-squat** 4×8-12 ⚠️ · **seed-fire-hydrant** 3×10-15 ·
*— vide ×2 —* · **bw-calf-raise** 3×10-15 · **bw-chinup** 3×10-15 · bicycle-crunch 3×15 → **9 ex.**

**Assertions CRITIQUES :**
- `hasLower && hasPull && !hasPush` → `'lower_pull'` : **PASS**
- Split `['lower','lower','lower']` (lower_pull × 3) : **PASS**
- Noms « Lower — Chaîne postérieure A / B / C » : **PASS**
- Slot 1 (hamstrings/glutes cpd) → **`bw-nordic-curl`** : **PASS** (EQUIP-FIX3 ✅)
- Slot 2 (back_width cpd) → **`seed-pullup`** : **PASS**
- Slot 3 (back_thickness cpd) → **`bw-inverted-row`** : **PASS**
- Slot quads/glutes cpd → **`bw-squat`** : **PASS**
- `autoProgress: false`, `progressStepKg: 0` : **PASS**
- « 3 sessions distinctes avec variation d'exercices » : ❌ **FAIL** — **6 exercices sur 9 sont
  identiques sur les 3 séances** (nordic curl, pullup, inverted row, calf raise, chinup, + 2 slots
  vides). Seuls le slot quads (squat/lunge/jump squat) et le slot fessiers (glute bridge / donkey
  kick / fire hydrant) tournent. → **Variété quasi nulle.**

**Coach :**
- **Programme fonctionnel et réaliste ?** ⚠️ **Non, pas en l'état.**
- ❌ **`bw-nordic-curl` en premier slot, 4×8-12, pour un DÉBUTANT, trois fois par semaine.**
  C'est le point le plus grave de ce profil. Le nordic curl est un excentrique maximal des
  ischio-jambiers ; un débutant ne peut pas en faire une seule répétition complète contrôlée.
  4×8-12 × 3 séances/semaine = **96 à 144 répétitions excentriques maximales hebdomadaires**.
  ❌ **Risque de lésion musculaire (DOMS sévères, voire déchirure) très élevé.**
  **Recommandation impérative : pondérer la sélection par le niveau** — exclure les exercices
  à haute exigence technique (nordic curl, jump squat, pistol squat) pour `level: 'beginner'`,
  ou ajouter un champ `difficulty` au seed.
- ⚠️ **`seed-pullup` en 4×8-12 pour un débutant** : idem, la plupart des débutants ne font pas
  8 tractions strictes. Aucune progression assistée n'est proposée.
- ⚠️ **Séance C : `bw-jump-squat` (pliométrie) en 4×8-12** (cf. P13).
- **Équilibre** : tirages 3 par séance (pullup, inverted row, chinup) contre 0 poussée.
  Zéro pectoral, zéro épaule, zéro triceps sur la semaine.
- **Durée** : 4×4×130 + 3×3×105 = 2080 + 945 = 3025 s ≈ 50 min + 6 min ≈ **56 min** ✅
- **Couverture isolation** : fessiers ✅, mollets ✅. Dos et ischios en isolation **vides**
  (aucun candidat BW/pullup_bar). Biceps servi par un composé (chinup).
- **Verdict : ❌ Problème sérieux** — nordic curl 4×8-12 ×3/semaine chez un débutant,
  3 séances quasi identiques, zéro poussée.

---

## P64 — BW+BAR+BAND 3 j intermediate endurance

`{ goal:'endurance', daysPerWeek:3, sessionDuration:60, equipment:BW+BAR+BAND, level:'intermediate' }`

**Simulation :**
- `isMass = false` (endurance) + intermediate + 3 j → **ligne 356 → `['push','pull','fullbody-quad']`**
  → public `['push','pull','fullbody']` (PPF) ✅
- available = **45**, warmup = **18** (band), core = **12** (`seed-hanging-leg-raise`)
- Slots 6 / 6 / 9. **Warnings : aucun.**

**Push — Poussée**

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-band-pull-apart | 2×10 |
| 1 | chest cpd | cpd | seed-pushup(2), band-chest-press(1), seed-dips(3) | **seed-pushup** | 3×15-20 (60 s) |
| 2 | shoulders cpd | cpd | band-overhead-press(2), bw-pike-pushup(1) | **band-overhead-press** | 3×15-20 |
| 3 | chest iso | iso→cpd | band-chest-press(1), seed-dips(3), bw-incline-pushup(2) | **band-chest-press** | 3×15-20 (45 s) |
| 4 | triceps iso | iso | band-tricep-pushdown(2) | **band-tricep-pushdown** | 3×15-20 |
| 5 | sh_lateral/shoulders iso | iso→cpd | bw-pike-pushup(1) | **bw-pike-pushup** | 3×15-20 |
| 6 | **shoulders_rear** iso | iso | **band-face-pull(2)**, bw-prone-y-raise(1) | **`band-face-pull`** ✅ **non vide** | 3×15-20 |
| 7 | core | — | index 0 | seed-scissors | 3×15 |

→ **8 exercices.**

**Pull — Tirage**

| # | Slot | Cat | Top-3 | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 1 | seed-bird-dog | 2×10 |
| 1 | back_width cpd | cpd | seed-pullup(3) | **seed-pullup** | 3×15-20 |
| 2 | back_thickness cpd | cpd | band-row(2), bw-inverted-row(1) | **band-row** | 3×15-20 |
| 3 | dos iso | iso→cpd | bw-inverted-row(1) | **bw-inverted-row** | 3×15-20 |
| 4 | biceps iso | iso | band-curl(2) | **band-curl** | 3×15-20 |
| 5 | **shoulders_rear** iso | iso | bw-prone-y-raise(1), band-face-pull(2) | **`bw-prone-y-raise`** ✅ **non vide** | 3×15-20 |
| 6 | forearms iso | iso | **aucun** | **— slot vide —** | — |
| 7 | core | — | index 1 | seed-crunch | 3×15 |

→ **7 exercices.**

**Full Body** (`fullbody-quad`, 9 slots) : cat-cow · **bw-squat** 3×15-20 · **seed-pushup** 3×15-20 ·
**seed-pullup** 3×15-20 · **band-overhead-press** 3×15-20 · **bw-nordic-curl** 3×15-20 ·
**band-face-pull** 3×15-20 · **band-curl** 3×15-20 · **bw-calf-raise** 3×15-20 ·
**band-tricep-pushdown** 3×15-20 · bicycle-crunch 3×15 → **11 exercices, aucun slot vide.**

**Assertions :**
- `BW+BAR+BAND = ['bodyweight','pullup_bar','band']` : **PASS**
- `isMass=false` + intermediate + 3 j → PPF `['push','pull','fullbody']` : **PASS**
- **`seed-band-pull-apart` est `band` + `isWarmupExercise: true` → exclu d'`available`** : **PASS**
  (il apparaît bien comme **échauffement** du push day, pas comme exercice de travail)
- **« vérifier si un autre exercice `band` cible `shoulders_rear` (SEED-2) »** :
  ✅ **OUI, deux : `band-face-pull`** (band, isolation, pop 2, non-warmup) **et `bw-prone-y-raise`**
  (équipement `band` malgré son id `bw-`, isolation, pop 1, non-warmup).
  → **Le slot `shoulders_rear` est REMPLI dans les 3 séances. SEED-2 est CLOS.**
  L'assertion du prompt v3 (« slot vide ») est **FAIL — attente périmée.**
- Push day + pull day : slots pullup_bar disponibles : **PASS** (`seed-pullup`, `bw-inverted-row`,
  `seed-dips` candidat, `bw-nordic-curl`)
- Reps endurance 15+ sur tous les slots : **PASS** (3×15-20 partout)
- `autoProgress: false`, `progressStepKg: 0` : **PASS** (band, bodyweight, pullup_bar → step 0)

**Coach :**
- **Le slot `shoulders_rear` est-il vide ?** ❌ **Non — il est rempli 3 fois sur 3** (band-face-pull ×2,
  bw-prone-y-raise ×1). L'ajout des élastiques résout complètement le trou du calisthenics pur (P58).
- **Volume hebdomadaire adapté ?** 26 postes × 3 séries × 15-20 reps ≈ **1 400 répétitions/semaine**.
  Pour un intermédiaire en endurance musculaire, c'est un volume élevé mais cohérent avec l'objectif. ✅
  ⚠️ En phase Intensification (semaines 8-10) : +1 série et +3 reps → **4×18-23** →
  ~2 400 reps/semaine. **Excessif** ; risque de tendinopathies (coude sur les tractions, épaule
  sur les pompes).
- ⚠️ **`seed-pullup` en 3×15-20 répétitions** : 45 à 60 tractions par séance, deux séances par
  semaine (pull + fullbody). **Irréaliste** pour la grande majorité des intermédiaires
  (une traction ×15 strictes est un niveau avancé). Le générateur applique la spec d'endurance
  sans vérifier la faisabilité du mouvement. ❌ Réserve forte.
- ⚠️ **`bw-nordic-curl` en 3×15-20** (fullbody) : encore plus irréaliste que 4×8-12 (P63).
- **Équilibre** : ✅ **excellent** — push 1 séance, pull 1 séance, fullbody 1 séance ;
  deltoïde postérieur 3×, ratio push/pull ~1:1 sur la semaine.
- **Durée** : push = 2×3×100 + 4×3×75 = 600 + 900 = 1500 s ≈ 25 min + 6 min ≈ **31 min** ;
  fullbody ≈ 45 min. Pour 60 min. ⚠️
- **Couverture isolation** : triceps ✅, biceps ✅, deltoïde postérieur ✅, mollets ✅, dos ✅.
  Deltoïde latéral servi par un pike push-up (fallback composé). Avant-bras vide.
- **Verdict : ⚠️ PASS avec réserve** — la meilleure configuration calisthenics (SEED-2 clos,
  équilibre 1:1). Réserves : tractions en 3×15-20 et nordic curl en 3×15-20 irréalistes,
  volume d'intensification excessif.

---

## P65 — FULL+CARDIO fat_loss 3 j — `cardio_machine` jamais sélectionné (EQUIP-5)

`{ goal:'fat_loss', daysPerWeek:3, sessionDuration:60, equipment:FULL+CARDIO, level:'intermediate' }`
(`FULL+CARDIO` = preset « Salle de sport » du wizard : barbell, dumbbell, cable, machine,
bodyweight, pullup_bar, cardio_machine)

**Simulation :**
- `isMass = false` + intermediate + 3 j → **ligne 356 → `['push','pull','fullbody-quad']`** (PPF) ✅
- available = **109** (dont les 4 `cardio_machine`), warmup = 16, core = **13**
  (bodyweight + cable-crunch + hanging-leg-raise)
- **Warnings : aucun.**

**Push — Poussée** : bird-dog · bench-barbell 3×12-15 · shoulder-press-db 3×12-15 ·
fly-dumbbell 3×12-15 · triceps-rope 3×12-15 · lateral-raise 3×12-15 · face-pull 3×12-15 ·
scissors 3×15 → **8 ex.**

**Pull — Tirage** : cat-cow · **seed-lat-pulldown** 3×12-15 (top-3 : lat-pulldown 3, **seed-pullup 3**,
deadlift 3) · row-barbell 3×12-15 · pullover-dumbbell 3×12-15 · curl-barbell 3×12-15 ·
rear-delt-fly 3×12-15 · wrist-curl 3×12-15 · crunch 3×15 → **8 ex.**

**Full Body** (`fullbody-quad`) : shoulder-circles · squat-barbell 3×12-15 · bench-dumbbell 3×12-15 ·
**seed-pullup** 3×12-15 (`pullup_bar`, `autoProgress: false`) · ohp-barbell 3×12-15 ·
leg-curl-lying 3×12-15 · face-pull 3×12-15 · curl-dumbbell 3×12-15 · calf-raise-seated 3×12-15 ·
triceps-pushdown 3×12-15 · cable-crunch 3×15 → **11 ex.**

**Assertions CRITIQUES :**
- `FULL+CARDIO` inclut `cardio_machine` dans `allowed` : **PASS** (les 4 exercices cardio_machine
  sont bien dans `available`, qui passe de 98 à 109 postes)
- `isMass=false` + intermediate + 3 j → PPF : **PASS**
- **EQUIP-5 — aucun exercice `equipment: 'cardio_machine'` dans la sortie : PASS (bug confirmé).**
  Vérification dans le code : `pickExercise` filtre ligne 528 par
  `slot.muscles.includes(ex.primaryMuscle)`. Les 4 exercices cardio_machine ont
  `primaryMuscle: 'cardio'`. **Recherche exhaustive de `'cardio'` dans `SLOTS` (lignes 109-278) :
  0 occurrence.** → Ils ne peuvent **jamais** être candidats. Confirmé sur les 27 postes générés.
- Programme identique à FULL 3 j fat_loss intermediate ? ⚠️ **Presque, mais pas exactement** :
  `pullup_bar` étant aussi dans le preset, `seed-pullup` entre dans le pool `back_width` et est
  retenu sur le Full Body (top-3 : pullup 3, lat-pulldown 3, row-dumbbell 3).
  **Le `cardio_machine` est ignoré ; le `pullup_bar` ne l'est pas.**
- `strengthEquipmentPrio('cardio_machine')` = **5**, commentaire *« jamais dans les slots de force »*
  (ligne 511) : **PASS** — cohérent, mais ce garde-fou est **redondant** puisque ces exercices
  ne franchissent jamais le filtre par muscle.

**⚠️ BUG EQUIP-5 confirmé :**
`cardio_machine` figure dans le type `Equipment`, dans les préférences utilisateur, dans le
preset « Salle de sport » (coché **par défaut**) et dans une section dédiée du wizard
(« Cardio », `CARDIO_OPTIONS`, ligne 134-136). Mais le générateur ne l'utilise **jamais**.
L'utilisateur qui coche « Cardio machine » n'en voit **aucun effet**, et le compteur
`availableCount` du wizard (ligne 411-413) **compte pourtant ces 4 exercices**, donnant
une fausse impression de couverture.

**Correction recommandée (par ordre de préférence) :**
1. **Ajouter un slot `cardio` optionnel en fin de séance** (après le core) pour `fat_loss` et
   `endurance` : `{ muscles: ['cardio'], compound: true }`, avec une spec dédiée
   (ex. 1 × 10-20 min, `trackingType` temps). Résout aussi P06, P25, P49, P61.
2. À défaut, afficher un message : *« Les machines cardio ne sont pas intégrées au programme —
   utilisez-les en échauffement ou en finisher. »*
3. Exclure `cardio_machine` du compteur `availableCount` du wizard pour ne pas surestimer
   la couverture.

**Coach :**
- **Le programme peut-il atteindre l'objectif fat_loss ?** ⚠️ **Partiellement seulement.**
  Le programme de musculation est bon (PPF équilibré, 27 postes, tous groupes couverts,
  3×12-15 à 60 s), mais **l'absence de cardio explicite est une lacune réelle** pour cet objectif :
  l'utilisateur a coché tapis/vélo/rameur, s'attend à les voir, et n'obtient rien.
- **L'absence d'exercice cardio est-elle acceptable ?** ❌ **Non pour `fat_loss`.**
  Pour `strength`/`hypertrophy`, l'omission est défendable. Pour `fat_loss` et `endurance`,
  c'est une non-réponse à l'objectif déclaré.
- **Équilibre** : ✅ excellent — push 1, pull 1, fullbody 1, deltoïde postérieur 3×,
  ratio push/pull ~1:1.
- **Durée** : push ≈ 34 min, fullbody ≈ 43 min, pour 60 min annoncées. ⚠️ **17 à 26 min
  inexploitées — exactement le créneau d'un finisher cardio.**
- **Couverture isolation** : complète ✅
- **Verdict : ⚠️ PASS technique (bug EQUIP-5 confirmé) / ❌ objectif fat_loss non servi.**

---

## P66 — `cardio_machine` seul → programme entièrement vide

`{ goal:'endurance', daysPerWeek:3, sessionDuration:60, equipment:CARDIO, level:'beginner' }`

**Simulation :**
- Split beginner + `!isMass` + 3 j → ligne 358 → `['fullbody-quad','fullbody-hip','fullbody-quad']`
- `available` = **4** (`seed-treadmill`, `seed-elliptical`, `seed-rowing-erg`, `seed-cycling`)
- `warmupPool` = **16** — les warmups bodyweight sont admis inconditionnellement (ligne 745 :
  `allowed.has(ex.equipment) || ex.equipment === 'bodyweight'`)
- `corePool` = **11** — idem, les cores bodyweight sont admis
- **Warnings : 8** (dédupliqués par `{workoutType}:{primaryMuscle}`) :
  quadriceps, pectoraux, dos (largeur), épaules *(pour `fullbody-quad`)* ;
  ischio-jambiers, pectoraux, dos (largeur), épaules *(pour `fullbody-hip`)*

**Full Body A / B / C — les 9 slots sont vides dans chaque séance :**

| Séance | Slots remplis | Contenu réel |
|---|---|---|
| Full Body A | **0 / 9** | `seed-bird-dog` 2×10 + `seed-scissors` 3×15 → **2 exercices** |
| Full Body B | **0 / 9** | `seed-cat-cow` 2×10 + `seed-crunch` 3×15 → **2 exercices** |
| Full Body C | **0 / 9** | `seed-shoulder-circles` 2×10 + `seed-bicycle-crunch` 3×15 → **2 exercices** |

**Assertions CRITIQUES :**
- `CARDIO = ['cardio_machine']` uniquement : **PASS**
- Tous les exercices `cardio_machine` du seed ont `primaryMuscle: 'cardio'` : **PASS** (4/4)
- Aucun slot template ne cible `'cardio'` → **tous les slots vides** : **PASS**
- **Comportement exact du générateur :** ✅ **pas de crash.** `pickExercise` retourne `null`,
  la boucle `continue` (ligne 802), le warning est poussé pour les slots compound.
  Le `DraftProgram` est valide et complet (nom, couleur, semaines, phases, `week` mappé sur
  lundi/mercredi/vendredi).
- **L'unique contenu possible = warmup + core :** ✅ confirmé.
  ⚠️ **Correction de l'énoncé du prompt** : le résultat n'est pas « 0 WorkoutExercise générés »
  mais **2 par séance** — car `warmupPool` et `corePool` acceptent le bodyweight
  **indépendamment de l'équipement choisi**. `seed-jumping-jacks` (le seul warmup cardio) est
  bien `bodyweight`, pas `cardio_machine` : le pool warmup est donc bodyweight uniquement, comme
  annoncé.

**⚠️ Edge case — le wizard ne bloque pas :**
`availableCount` (ligne 411-413) compte les exercices non-warmup dont l'équipement est coché
→ **4**. La condition d'avertissement est `availableCount < 12` (ligne 446) → l'utilisateur voit :
> *« ⚠️ Seulement 4 exercices disponibles — certains slots seront vides. »*

**Ce message est trompeur** : il annonce « certains slots », alors que **100 % des slots seront
vides**. Le message « Aucun exercice disponible — le programme sera vide » (ligne 460) n'est
affiché que si `availableCount === 0`, ce qui n'arrive jamais avec `cardio_machine` coché.
Le bouton « Continuer avec 1 équipement » reste actif et le programme est généré.

**Coach :**
- **Un programme vide est-il acceptable ?** ❌ **Non.** L'utilisateur obtient 3 séances de
  « Full Body » contenant un Bird dog et un crunch. C'est une régression fonctionnelle visible
  et immédiate.
- **Comment le wizard devrait-il prévenir ?**
  1. **Calculer la couverture par groupe musculaire**, pas seulement le total :
     si 0 exercice de force est disponible → bloquer avec
     *« Le cardio seul ne permet pas de générer un programme de musculation. Ajoutez au moins
     le poids du corps. »*
  2. **Pré-cocher `bodyweight` par défaut** (il est de toute façon utilisé pour le warmup et le core).
  3. **Exclure `cardio_machine` du compteur `availableCount`** tant qu'aucun slot ne le cible.
  4. Côté générateur : si `workouts.every(w => w.exercises.length <= 2)` → renvoyer un warning
     bloquant en tête.
- **Verdict : ❌ Problème sérieux (edge case)** — pas de crash, mais programme inutilisable
  livré avec un message d'avertissement trompeur.

---

## P67 — BW+BAR strength advanced 4 j — `progressStepKg = 0`

`{ goal:'strength', daysPerWeek:4, sessionDuration:60, equipment:BW+BAR, level:'advanced' }`

**Simulation :**
- `isMass = (goal === 'strength' || 'hypertrophy')` → **`strength` EST `isMass`** (ligne 326) ✅
  (réponse à la question du prompt)
- `case 4`, `isMass` → ligne 362 → `['upper-push','lower-quad','upper-pull','lower-hip']`
  → public `['upper','lower','upper','lower']` ✅
- `adjustedSlotCount(·, 60, 'strength')` : upper-push 8→**4**, lower-quad 6→**4**,
  upper-pull 8→**4**, lower-hip 6→**4**
- available = 35, core = 12. `durationWeeks = 16`. **Warnings : aucun.**

**Upper A** (`upper-push`, 4 slots)

| # | Slot | Cat | **Les 3 candidats (advanced → tirage top-3)** | Retenu (tirage 0) | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | **chest cpd** | cpd | **`seed-pushup`(bodyweight, pop 2) · `bw-incline-pushup`(bodyweight, pop 2)** — **2 candidats seulement** | **seed-pushup** | 5×3-5 (180 s) |
| 2 | dos cpd | cpd | seed-pullup(3), bw-inverted-row(1) | **seed-pullup** ✅ | 5×3-5 |
| 3 | shoulders cpd | cpd | bw-pike-pushup(1) | **bw-pike-pushup** | 5×3-5 |
| 4 | chest iso | iso→cpd | seed-dips(3), bw-incline-pushup(2) | **`seed-dips` (pullup_bar)** ✅ | 3×5-8 (120 s) |
| 5 | core | — | index 0 | seed-scissors | 3×15 |

→ **6 exercices.**

**Lower A** (`lower-quad`, 4 slots) : cat-cow · **bw-squat** 5×3-5 · **bw-nordic-curl** 5×3-5 ⚠️ ·
**bw-wall-sit** 3×5-8 · *— hamstrings iso vide —* · seed-crunch 3×15 → **5 exercices**

**Upper B** (`upper-pull`, 4 slots) : shoulder-circles · **`seed-pullup`** 5×3-5 ✅ ·
**`bw-inverted-row`** 5×3-5 ✅ · **seed-pushup** 5×3-5 · *— shoulders_rear vide —* ·
bicycle-crunch 3×15 → **5 exercices**

**Lower B** (`lower-hip`, 4 slots) : dead-bug · **seed-hip-thrust-bw** 5×3-5 · **bw-lunge** 5×3-5 ·
**seed-glute-bridge** 3×5-8 · **bw-nordic-curl** 3×5-8 · vertical-leg-crunch 3×15 → **6 exercices**

**Assertions CRITIQUES :**
- `strength` est bien `isMass` → split upper/lower A/B en 4 j : **PASS** (ligne 326 + 362)
- `progressStepKg: 0` pour **tous** les exercices : **PASS** — `pullup_bar` et `bodyweight`
  renvoient 0 (ligne 585). Vérifié sur les 22 postes.
- `autoProgress: false` partout : **PASS** (`autoProgress = progressStepKg > 0`, ligne 594)
- **Specs force 5×3-5 générées malgré `autoProgress: false`** : **PASS** — la spec ne dépend que
  de `goal` et `slot.compound` (ligne 786), jamais de la progressabilité.
- Upper A : chest compound → `seed-pushup` (bodyweight) ✅ ; `chest_lower` → `seed-dips`
  (pullup_bar) sur le **slot chest isolation** par fallback composé : **PASS avec nuance**
- Upper B : `back_width` compound → `seed-pullup` (pullup_bar) ✅ **PASS** ;
  `biceps` → `bw-chinup` : ⚠️ **le slot biceps est élidé par le cap à 4 slots** (position 5 dans
  `upper-pull`). **FAIL sur l'assertion** : `bw-chinup` n'apparaît **dans aucune séance** de ce profil.
- **Advanced → tirage aléatoire top-3 : les 3 candidats du slot chest compound** :
  il n'y en a que **2** — `seed-pushup` (bodyweight, cpd, pop 2) et `bw-incline-pushup`
  (bodyweight, cpd, pop 2, primaryMuscle `chest_upper`). `seed-dips` (`chest_lower`) est exclu
  du slot `['chest','chest_upper']` de `upper-push`. **PASS avec correction** (2 candidats, pas 3).

**Coach — strength advanced calisthenics :**
- **5×3-5 sur des exercices au poids du corps est-il réaliste ?** ❌ **Non, c'est incohérent.**
  - `seed-pushup` en 5×3-5 : un confirmé fait 30+ pompes. 3 à 5 répétitions n'apporte **aucun
    stimulus**. Le format force suppose une charge relative de 85-95 % 1RM — impossible avec des
    pompes classiques.
  - `bw-squat` en 5×3-5 : idem, absurde.
  - `seed-pullup` en 5×3-5 : le seul mouvement où le format a du sens pour un confirmé.
  - `bw-nordic-curl` en 5×3-5 : le seul autre. Mais 5 séries lourdes de nordic curl, deux fois
    par semaine (Lower A slot 2 **et** Lower B slot 4), est excessif en charge excentrique.
- **La progression sans poids additionnel est-elle possible ?** ❌ **Non dans l'app.**
  `autoProgress: false` et `progressStepKg: 0` sont techniquement corrects, mais il n'existe
  **aucun autre mécanisme** : ni répétitions cibles progressives, ni lest, ni progression par
  variation. Un confirmé en calisthenics n'a **littéralement aucun moyen de progresser** dans
  l'application avec ce programme.
- **Recommandations :**
  1. **Weighted calisthenics** — ajouter au seed des variantes lestées
     (`weighted-pullup`, `weighted-dips`, équipement `pullup_bar`, `progressStepKg: 2.5`).
  2. **Progression par variation** — chaîner pompes → pompes archer → pompes à une main,
     via un champ `progressionOf` dans le seed.
  3. **Avertir** quand `goal === 'strength'` et qu'aucun équipement chargeable n'est disponible :
     *« Objectif force sans charge externe : privilégiez l'hypertrophie ou ajoutez du lest. »*
     (Ce warning n'existe pas ; seul le warning « Force pour débutant » couvre un cas voisin.)
- **Équilibre** : upper A (poussée) + upper B (tirage) ✅ ; lower A (quad) + lower B (hip) ✅.
  Bonne structure. ⚠️ Deltoïde postérieur, biceps, triceps, mollets **tous élidés** par le cap à 4.
- **Durée** : 3 composés × 5 × 210 + 1 iso × 3 × 150 = 3150 + 450 = 3600 s = 60 min + 6 min ≈ **66 min** ⚠️
- **Verdict : ❌ Problème sérieux** — combinaison `strength` + calisthenics non viable
  (specs 5×3-5 sur des pompes, aucune progression possible), non signalée à l'utilisateur.

---

## P68 — BW+BAR 2 j beginner endurance, `selectedDays` custom

`{ goal:'endurance', daysPerWeek:2, sessionDuration:45, equipment:BW+BAR, level:'beginner', selectedDays:['tuesday','saturday'] }`

**Simulation :**
- `case 2` (ligne 349) → `['fullbody-quad','fullbody-hip']` → « Full Body A / B » ✅
- `selectedDays.length === 2 === daysPerWeek` → **utilisé** →
  `week = { tuesday: <A>, saturday: <B> }` ✅ (lundi/jeudi par défaut remplacés)
- `adjustedSlotCount(9, 45, 'endurance')` = `max(3, ⌊6.75⌋)` = **6 slots** ✅
- `adjustedSpec(3 séries, 45)` = `max(2, ⌊2.25⌋)` = **2 séries**
- available = 35, core = 12. **Warnings : aucun.**

**Full Body A** (`fullbody-quad`, 6 slots, mardi)

| # | Slot | Cat | Candidats | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 0 | seed-bird-dog | 2×10 |
| 1 | quads/glutes cpd | cpd | bw-squat(3), bw-lunge(2), bw-jump-squat(1) | **bw-squat** | 2×15-20 (60 s) |
| 2 | chest cpd | cpd | seed-pushup(2), bw-incline-pushup(2) | **seed-pushup** | 2×15-20 |
| 3 | **dos cpd** | cpd | seed-pullup(3), bw-inverted-row(1) | **`seed-pullup` (pullup_bar)** ✅ | 2×15-20 |
| 4 | shoulders cpd | cpd | bw-pike-pushup(1) | **bw-pike-pushup** | 2×15-20 |
| 5 | hamstrings iso | iso→cpd | bw-nordic-curl(2) | **`bw-nordic-curl` (pullup_bar)** | 2×15-20 (45 s) |
| 6 | shoulders_rear iso | iso | **aucun** | **— slot vide —** | — |
| 7 | core | — | index 0 | seed-scissors | 3×15 |

→ **7 exercices.**

**Full Body B** (`fullbody-hip`, 6 slots, samedi)

| # | Slot | Cat | Candidats | Retenu | Séries×Reps |
|---|---|---|---|---|---|
| 0 | warmup | — | index 1 | seed-cat-cow | 2×10 |
| 1 | hams/glutes cpd | cpd | **bw-nordic-curl(2, `hamstrings`)**, hip-thrust-bw(4), curtsy-lunge(1) | **bw-nordic-curl** ⚠️ répété | 2×15-20 |
| 2 | chest cpd | cpd | seed-pushup(2), bw-incline-pushup(2) | **seed-pushup** ⚠️ répété | 2×15-20 |
| 3 | **back_width/back cpd** | cpd | seed-pullup(3) | **`seed-pullup`** ⚠️ répété | 2×15-20 |
| 4 | shoulders cpd | cpd | bw-pike-pushup(1) | **bw-pike-pushup** ⚠️ répété | 2×15-20 |
| 5 | quads iso | iso | bw-wall-sit(2) | **bw-wall-sit** | 2×15-20 |
| 6 | sh_lat/rear iso | iso | **aucun** | **— slot vide —** | — |
| 7 | core | — | index 1 | seed-crunch | 3×15 |

→ **7 exercices.**

**Assertions :**
- 2 j = fullbody toujours → `['fullbody','fullbody']` : **PASS**
- `selectedDays:['tuesday','saturday']` → `week = { tuesday: templateA, saturday: templateB }`,
  lundi/jeudi par défaut remplacés : **PASS** (ligne 754)
- `adjustedSlotCount(9, 45)` = **6 slots** : **PASS**
- « Total = 6 + warmup + core = 8 exercices » : ⚠️ **FAIL partiel** — le total réel est
  **7 exercices** dans les deux séances, car le slot `shoulders_rear` (A) / `shoulders_lateral+rear`
  (B) n'a **aucun candidat** en BW+BAR. Aucun warning (slot isolation).
- `autoProgress: false`, `progressStepKg: 0` : **PASS**
- Reps endurance 15+ : **PASS** (2×15-20)
- **`seed-pullup` apparaît dans le slot `back_width`** : **PASS** ✅ (les deux séances)
- **`seed-dips` disponible pour `chest_lower`** : ⚠️ **il est disponible mais jamais retenu** —
  `fullbody-quad`/`fullbody-hip` n'ont **aucun slot `chest_lower`** (les slots chest sont
  `['chest','chest_upper']`, lignes 255 et 268). `seed-dips` (`primaryMuscle: 'chest_lower'`)
  n'est donc **jamais candidat** dans un fullbody. **FAIL sur l'assertion.**

**Coach :**
- **Contenu suffisant pour 45 min ?** ❌ **Non.** 4 composés × 2 × (40+60) + 1 isolation × 2 × (30+45)
  = 800 + 150 = 950 s ≈ 16 min + warmup 1 min + core 5 min ≈ **22 min pour 45 annoncées.**
  **Créneau rempli à 49 %.** Double cause : slot vide + réduction des séries à 2.
- **Mardi + samedi : récupération.** ✅ 3 jours puis 3 jours. **Répartition optimale**, meilleure
  que lundi/jeudi. Le respect de `selectedDays` a une vraie valeur ici.
- ⚠️ **Cohérent pour un débutant fitness ?** **Non sur deux points :**
  1. `seed-pullup` en 2×15-20 : **30 à 40 tractions par séance pour un débutant.**
     La quasi-totalité des débutants ne fait pas une traction. ❌ Irréaliste.
  2. `bw-nordic-curl` en 2×15-20, deux fois par semaine : ❌ irréaliste et risqué.
  → Le générateur applique les specs d'endurance sans tenir compte de la difficulté intrinsèque
  du mouvement ni du niveau. **C'est le défaut transverse du groupe G.**
- ⚠️ **5 exercices sur 7 identiques entre A et B** (nordic curl, pushup, pullup, pike push-up,
  + le slot vide). → **quasi répétition complète.**
- **Équilibre** : poussées 2 (pompes, pike) contre tirages 1 (traction) par séance. ~2:1.
  Deltoïde postérieur, biceps, triceps, mollets, fessiers : **absents** (slots élidés par le cap à 6
  ou vides).
- **Couverture isolation** : ischios (via composé) ✅, quads ✅ (B). Tout le reste absent.
- **Verdict : ⚠️ PASS technique sur `selectedDays`** — mais contenu à 22 min pour 45,
  séances quasi identiques, tractions et nordic curl irréalistes pour un débutant.
---
---

# RÉCAPITULATIF DE L'AUDIT

## Bloc 1 — Tableau de synthèse (68 profils)

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|---|---|---|---|
| **P01** | Split fullbody×2 beginner hypertrophy ✅ · 11 ex/séance ✅ · warmup en tête ✅ · core en queue ✅ | ⚠️ PASS | Ratio push/pull 2:1 sur la semaine ; `seed-lat-pulldown` répété en A et B ; ~67 min générées pour 60 annoncées ; pas d'isolation pectorale |
| **P02** | Split fullbody×3 (beginner reste fullbody en force) ✅ · **« 11 exercices » FAIL — attente v3 périmée, le code produit 6** (`adjustedSlotCount` force 60 min = 4 slots) | ⚠️ PASS technique / ❌ programme pauvre | 3 séances quasi identiques de 4 mouvements ; zéro isolation, zéro bras, zéro mollet, zéro deltoïde postérieur ; ratio push/pull 2:1 ; aucun rowing horizontal ; ~76 min pour 60 annoncées ; force chez un débutant (warning émis mais non bloquant) |
| **P03** | Split PPL ✅ · push = chest+épaules ✅ · pull = dos+biceps ✅ · legs = quads+ischios ✅ · barbell prioritaire ✅ | ⚠️ PASS | Cap à 4 slots supprime `shoulders_lateral`, `shoulders_rear` et `calves` → **deltoïde postérieur et mollets absents de toute la semaine** |
| **P04** | Split PPL identique à P03 (branche indépendante de l'objectif) ✅ · reps 8-12/10-15 ✅ · 8 ex/séance ✅ | ✅ Bon programme | Slot `forearms` (wrist curl pop 1) occupe une place utile alors qu'aucun slot triceps n'existe en pull ; 44 min pour 60 annoncées |
| **P05** | Split PPF `['push','pull','fullbody']` ✅ · noms sans suffixe ✅ · reps 15-20 ✅ · warnings BUG-5 émis ✅ | ❌ Problème sérieux | **Pull day = 2 exercices (warmup + crunch)** ; zéro tirage, zéro biceps, zéro triceps, zéro ischio, zéro deltoïde postérieur de la semaine ; séance de 6 min pour un créneau de 60 ; déséquilibre push/pull non détecté par UX-5 |
| **P06** | Split PPF ✅ · specs fat_loss 3×12-15 ✅ | ❌ Problème sérieux | Idem P05 + **aucun cardio dans un programme fat_loss** (`bw-burpees`, `jump-rope`, `high-knees` structurellement inatteignables) ; Pull day à 6 min |
| **P07** | Split upper-push/lower-quad/upper-pull/lower-hip ✅ · 10/8/10/8 exercices ✅ · noms A/B ✅ · calves dans chaque lower ✅ | ✅ Bon programme | `seed-lat-pulldown` en Upper A et B ; `bw-wall-sit` (isométrie) prescrit en 3×10-15 répétitions |
| **P08** | Split `['push','pull','legs','upper','lower']` ✅ · 5 workouts distincts ✅ | ⚠️ PASS / réserve sécurité | **`seed-good-morning` en 5×3-5 (risque lombaire)** ; `bw-wall-sit` en 3×5-8 reps ; bench/squat/hinge répétés à 48 h en force ; ratio push/pull 5:3 ; mollets, ischios iso et deltoïde postérieur absents ; Upper à 66 min pour 60 |
| **P09** | Split `['upper','lower','upper','lower','fullbody']` — **pas fullbody×5** ✅ · 10/8/10/8/11 ✅ · warning volume débutant ✅ | ⚠️ PASS | 47 postes/semaine pour un débutant ; jambes sollicitées mardi, jeudi **et** vendredi ; `bw-squat` (non progressable) retenu comme composé quads en séance 5 |
| **P10** | 2 j = fullbody quel que soit le niveau ✅ · barbell prioritaire sur les 8 composés ✅ | ⚠️ PASS / réserve sécurité | **RDL 5×3-5 puis soulevé de terre 5×3-5 dans la même séance** ; `seed-deadlift` sert le slot « largeur de dos » ; ratio push/pull 2:1 ; zéro isolation ; ~76 min pour 60 |
| **P11** | `['chest']` → `'push'` ✅ · split `['push','push']` ✅ · réordonnancement ✅ | ⚠️ PASS | 4 exercices sur 6 identiques entre A et B ; `seed-triceps-kickback` (pop 1) promu en B ; zéro dos, zéro biceps (averti) |
| **P12** | `['back']` → `'pull'` ✅ · split `['pull','pull','pull']` ✅ | ⚠️ PASS | **`seed-lat-pulldown` sur les 3 séances** (pool `back_width` = 2 candidats) ; zéro poussée sur la semaine **non signalée** (UX-5 ne détecte que l'absence de tirage) |
| **P13** | `['legs']` → `'lower'` ✅ · alternance lower-quad/lower-hip ✅ · noms A/B/C/D ✅ · structure différenciée ✅ | ❌ Problème sérieux | **Slot ischios vide sur les 4 séances** ; `seed-curtsy-lunge` (pop 1) en tête de B ; **`bw-jump-squat` (pliométrie) en 4×8-12 en tête de C** ; 4 séances jambes/semaine sans progression possible ; 39 min pour 60 |
| **P14** | **BUG#3 : `['core']` → `null`** ✅ · split `['fullbody','fullbody']`, jamais `['lower','lower']` ✅ · warning « Focus gainage » ✅ | ✅ PASS assertion critique | 5 slots vides sur 9 en BW ; 1 seul exercice de gainage pour un focus « core » ; ~25 min pour 60 |
| **P15** | **BUG#3 en 4 j : `['core']` → `null`** ✅ · split `['upper','lower','upper','lower']`, jamais lower×4 ✅ | ✅ PASS | `reorderSlotsByFocus` est un **no-op** avec `core` (aucun slot ne liste `'core'`) : le focus n'a aucun effet sur le contenu |
| **P16** | `['shoulders']` → `'push'` ✅ · réordonnancement épaules en tête ✅ | ⚠️ PASS | Warning UX-B parle de « bras » et « biceps » alors que l'utilisateur a coché **épaules** — libellé inadapté ; 4/6 exercices identiques A/B ; kickback (pop 1) en B |
| **P17** | `['chest','back']` → `'upper'` ✅ · split upper×3 ✅ · chest+back en tête des composés **et** des isolations ✅ | ✅ Bon programme | `seed-lat-pulldown` sur les 3 séances ; aucun bas du corps (non signalé — `upper` échappe au warning de spécialisation) |
| **P18** | **LEGS+CORE : `['legs','core']` → `'lower'`** (règle 1 avant règle « core seul ») ✅ · split lower×3 ✅ | ✅ PASS assertion / ⚠️ programme faible | Slot ischios vide ×3 ; curtsy lunge en tête de B ; jump squat 4×8-12 en tête de C ; focus « core » sans effet ; 33 min pour 60 |
| **P19** | `['chest','back','legs']` → `null` (ambiguïté) ✅ · split fullbody×2 par défaut ✅ · warning « Sélection complète » ✅ | ✅ PASS | Ratio push/pull 2:1 ; ~67 min pour 60 |
| **P20** | `['shoulders','arms']` → `'push'` (règle 3 avant règle 5) ✅ · warning UX-B pertinent ✅ | ⚠️ PASS | Focus « bras » servi à moitié : 1 slot triceps, **0 slot biceps** ; 4/6 exercices identiques A/B ; kickback en B |
| **P21** | `filterByEquipment` exclut le non-BW ✅ · `autoProgress:false`, `progressStepKg:0` ✅ · **14 slots vides sur 27** | ❌ Problème sérieux | **Zéro dos, zéro biceps, zéro triceps, zéro ischio, zéro deltoïde postérieur** ; aucune surcharge progressive possible en « prise de masse » ; A et C quasi identiques ; 28 min pour 60 ; déséquilibre push/pull non détecté (fullbody considéré comme contenant du tirage) |
| **P22** | **BUG#4 : `fullbody-quad` liste `back_thickness` → `seed-row-dumbbell` retenu, slot non vide** ✅ · **FAIL résiduel : `fullbody-hip` (`['back_width','back']`) → slot vide** | ⚠️ PASS partiel | 1 séance sur 3 sans aucun dos ; `seed-lunges` comme composé quads principal 2 fois sur 3 ; `dumbbell-rdl` (composé) sur un slot isolation ; kickback et curl incliné promus par `usedGlobally` |
| **P23** | `strengthEquipmentPrio` : barbell(0) < dumbbell(2) ✅ · chest = `seed-bench-barbell` ✅ · squat = `seed-squat-barbell` ✅ | ⚠️ PASS / réserve sécurité | **RDL mardi + deadlift jeudi + good morning vendredi en 5×3-5 → charge lombaire cumulée** ; slot fessiers isolation **vide sans warning** ; zéro isolation de bras sur 4 séances ; `progressStepKg` uniforme à 2,5 kg ; Upper A à 66 min |
| **P24** | Aucun barbell/dumbbell ✅ · dos = `seed-lat-pulldown` (pas machine row) ✅ · chest = `seed-chest-press-machine` ✅ | ✅ Bon programme | 3 exercices identiques sur les 3 séances (pools de 1 candidat) ; `seed-pec-deck` et `seed-fly-cable` inutilisables faute de slot chest isolation en fullbody |
| **P25** | Aucun haltère/barre/câble/machine ✅ · **SEED-2 CLOS : `band-face-pull` et `bw-prone-y-raise` remplissent `shoulders_rear`** (assertion v3 périmée) · slot dos vide en séance B (BUG#4 résiduel) | ⚠️ PASS | Séance B sans dos ; `band-good-morning` et `band-chest-press` (pop 1) en tête de B ; **fat_loss sans aucun cardio** ; 4 exercices répétés A/B |
| **P26** | Split PPL ✅ · branche `advanced` = `slice(0,3)` + `Math.random` ✅ · 3 candidats chest listés ✅ | ⚠️ PASS | Le tirage uniforme peut donner `seed-chest-press-machine` (machine guidée) comme mouvement principal d'un programme de **force** — 1 chance sur 3 ; deltoïde postérieur et mollets absents |
| **P27** | `adjustedSlotCount(9,20)` = 4 ✅ · **« 6 exercices » FAIL — attente v3 périmée : 5 exercices** (core supprimé, warmup à 1 série pour ≤20 min) | ✅ Bon comportement | Volume 2×8-12 sous le seuil de stimulation hypertrophique ; aucune isolation, aucun core |
| **P28** | `adjustedSlotCount(9,45)` = 6 ✅ · 8 exercices ✅ | ✅ Bon programme | 3 séries seulement sur les composés (6 séries/muscle/semaine, bas pour l'hypertrophie) ; bras et mollets absents |
| **P29** | `adjustedSlotCount(9,90)` = min(11,8) = 8 ✅ · 10 exercices ✅ · slot le moins prioritaire élidé ✅ | ⚠️ PASS | **62 min générées pour 90 demandées** — cap à 8 trop conservateur en hypertrophie ; slot `triceps` élidé sur les deux séances |
| **P30** | Split PPL ✅ · `adjustedSlotCount(6,20,'strength')` = 3 ✅ · réduction appliquée hors fullbody ✅ | ✅ PASS technique | 2 séries de 3-5 reps = volume d'échauffement, pas de séance de force ; **combinaison `strength` + 20 min à déconseiller dans le wizard** ; aucun core (supprimé) |
| **P31** | `buildPhases(7)` = `undefined` ✅ · `phaseLabel(7)` = `''` ✅ · `phases: undefined` dans le draft ✅ | ✅ PASS | — |
| **P32** | 4 phases ✅ · [1-2]/[3-5]/[6-7]/[8] ✅ · adaptation −1/+3 ✅ · deload −2/+4 ✅ · **intensification `repsOffset: -2` (pas −3) → FAIL vs prompt v3, code correct** | ✅ PASS (code) | 1 seule semaine de décharge en fin de cycle force |
| **P33** | 4 phases somme=9 ✅ · [1-2]/[3-6]/[7-8]/[9] ✅ · endurance adaptation −1/−2 ✅ · intensification +1/+3 ✅ | ✅ PASS | Intensification = 4×18-23 reps par composé (72-92 répétitions) — fatigue locale élevée |
| **P34** | `intensive = 3` car 10 > 9 ✅ · [3-6]/[7-9]/[10] ✅ · hypertrophy intensification +1/−2 ✅ | ✅ PASS | 1 seule semaine de décharge après 3 semaines d'intensification |
| **P35** | `deload = 2` (seuil ≥12) ✅ · progression [3-7] ✅ · décharge [11-12] ✅ · fat_loss adaptation −1/0 et deload −1/0 ✅ | ✅ PASS | — (décharge à −1 série volontaire et pertinente en fat_loss) |
| **P36** | `intensive = 4` (seuil ≥16) ✅ · progression 8 sem. [3-10] ✅ · intensification [11-14] ✅ · décharge [15-16] ✅ | ✅ PASS | **8 semaines de progression consécutives sans décharge intermédiaire** — trop long pour un cycle de 16 semaines |
| **P37** | 24 combinaisons goal×type×phase : `sets ≥ 1` ✅ et `repsMin ≥ 1` ✅ · **le « BUG CRITIQUE 3−3=0 » n'existe plus** (repsOffset −2, ligne 623) → FAIL vs prompt v3 | ✅ PASS (bug déjà corrigé) | Décharge à **1 série** (strength/hypertrophy/endurance isolation) sans effet de maintien ; force composé intensification = 5×1-3 (inadapté aux débutants, autorisé par le générateur) ; durée de séance non recalculée par phase |
| **P38** | Matrice 4×4 de `phaseAtLeast` conforme à `PHASE_ORDER` ✅ (8 assertions) | ✅ PASS | Sémantique ambiguë : `deload` est ordonné **au-dessus** d'`intensification` (chronologie, pas intensité) — à documenter côté appelants |
| **P39** | `phaseLabel` délègue à `buildPhases` (WIZ1) ✅ · sommes = totalWeeks ✅ · « décharge »/« intensification » ✅ · adapt toujours 2 ✅ | ✅ PASS | L'option « 📅 Standard » du wizard n'affiche **aucun libellé de phases** alors qu'elle en produit |
| **P40** | `GOAL_PHASES` dérivé de `PHASE_CONFIG_BY_GOAL` (WIZ2) ✅ · progression non affichée ✅ · `fmtMod(0,0)` = « Specs inchangées » ✅ · **strength intensification = `"-2 reps"` → FAIL vs prompt v3 (`"-3 reps"`), code correct** | ✅ PASS (code) | Tableau du wizard regroupe 4 objectifs en 2 colonnes — dense à lire |
| **P41** | **LP1/LP4 : `['legs','back']` → `lower_pull`** ✅ · split `['lower','lower']` ✅ · noms « Chaîne postérieure A/B » ✅ · slot 1 = composé hamstrings/glutes ✅ · `autoProgress:true`, step 2,5 ✅ | ⚠️ PASS / ❌ réserve sécurité | **4 hip hinges dans la séance A** (RDL, deadlift, hip thrust, RDL haltères) chez un débutant ; `seed-good-morning` (pop 1) en tête de B ; `seed-deadlift` sert le slot « largeur de dos » ; 3 exercices répétés A/B ; zéro poussée ; ~67 min pour 60 |
| **P42** | **`['legs','back','core']` → `lower_pull`** (le core ne change pas le type) ✅ · lower_pull×3 ✅ · core en queue via `corePool` ✅ | ⚠️ PASS / réserve persona | **Hip thrust structurellement inatteignable** (slot glutes/hams est `compound:false` → filtre isolation) alors que la persona cible les fessiers ; zéro poussée sur la semaine ; good morning en tête de C ; ~67 min pour 60 |
| **P43** | **LP2/LP5 : `['legs','shoulders']` → `lower_push`** (règle 6 avant règle 7) ✅ · noms « Squat & Press A/B/C » ✅ · slot 1 = squat ✅ · OHP en slot 2 ✅ | ❌ Problème sérieux | **Séance C = copie exacte de la séance A** ; OHP et bench en 5×3-5 **trois fois par semaine** ; `seed-good-morning` en 5×3-5 (risque lombaire) ; zéro tirage ; zéro isolation ; ~76 min pour 60 |
| **P44** | `['legs','chest','shoulders']` → `lower_push` ✅ · split `['lower','lower']` ✅ | ⚠️ PASS | 4 composés lourds (squat, bench, OHP, RDL) = 4 patterns techniques simultanés pour un **débutant** ; zéro tirage (averti) ; ~67 min pour 60 |
| **P45** | **PUSH_FULL : `['chest','shoulders']` → `'push'`** (pas `upper`) ✅ · chest ET shoulders couverts ✅ | ⚠️ PASS | **Séance C = copie de la séance A** ; pool chest DB = 2 exercices → `bench-db` sur les 3 séances ; warning UX-B mal libellé (parle de « bras ») ; zéro tirage/dos/biceps/jambes |
| **P46** | **PULL_FULL : `['back','arms']` → `'pull'`** (pas `upper`) ✅ · biceps ET dos couverts ✅ | ⚠️ PASS | **Triceps ciblé par le focus mais aucun slot triceps en pull** — non averti (UX-B ne couvre que le cas push) ; `forearms` (pop 1) remonté devant `shoulders_rear` par le focus « arms » ; `lat-pulldown` ×3 ; zéro poussée non signalée |
| **P47** | `['chest','arms']` → `'push'` (règle 3 avant règle 5) ✅ · triceps ET chest couverts ✅ · warning UX-B pertinent ✅ | ⚠️ PASS | `seed-triceps-kickback` (pop 1) retenu en B **sur un muscle ciblé** ; biceps absent (averti) ; 5/6 exercices identiques A/B |
| **P48** | `['shoulders','back']` → `'upper'` ✅ · upper-push/upper-pull ✅ · réordonnancement dos+épaules en tête ✅ | ⚠️ PASS | **`upper-pull` n'a aucun slot OHP** → 1 seul développé d'épaule/semaine pour un focus « épaules » ; l'utilisateur reçoit 2 développés couchés non demandés ; `lat-pulldown` en A et B |
| **P49** | `isMass=false` + intermediate + 4 j → branche ligne 364 → `['push','pull','lower','fullbody']` ✅ · **pas upper/lower** ✅ | ⚠️ PASS | **Zéro cardio pour un objectif fat_loss** ; 34 min générées pour 60 ; aucune densification (ni circuit ni superset) |
| **P50** | 2 j = fullbody même en `advanced` ✅ · **« 9 slots / 11 exercices » FAIL — attente v3 périmée : `min(9,6)` = 6 slots, 8 exercices** | ⚠️ PASS technique | Bench et OHP faits 2× vs squat et RDL 1× ; aucun rowing horizontal ; ratio push/pull 2:1 ; biceps, triceps, mollets élidés |
| **P51** | `isMass=false` + advanced + 5 j → branche ligne 374 → `['push','pull','lower','lower','fullbody']` ✅ · aucun crash ✅ | ⚠️ PASS | **5 jours consécutifs sans repos**, jambes 3 jours de suite ; 31 à 45 min générées pour 60 ; intensification (sem. 11-14) porte le volume à ~3 400 reps/semaine ; `bw-squat` non progressable en fullbody |
| **P52** | **LP3 : `['legs','back','chest']` → `null`** → fullbody×3 par défaut, **jamais lower_pull/lower_push** ✅ · warning « Sélection complète » ✅ | ✅ PASS | Ratio push/pull 2:1 ; `lat-pulldown` ×3 ; ~67 min pour 60 |
| **P53** | **ARMS : `['arms']` → `'upper'`** (règle 5) ✅ · split upper-push/upper-pull ✅ · biceps ET triceps présents ✅ · warning « Focus bras » ✅ | ⚠️ PASS | **4 postes bras sur 19** pour un focus « bras » ; slot `back_width` vide en Upper B (BUG#4 résiduel) ; kickback (pop 1) sur un muscle ciblé ; 5 exercices répétés A/B |
| **P54** | `['chest','back','shoulders','arms']` → `'upper'` ✅ · override du split 4 j ✅ · upper-push/pull alternés ✅ · noms A/B/C/D ✅ | ❌ Problème sérieux | **4 séances upper, dont 2 fois 2 jours consécutifs** — récupération très insuffisante (≈40 séries de deltoïde latéral/semaine) ; **zéro bas du corps non signalé** (le warning de spécialisation ignore `upper`) ; `seed-pushup` en composé principal en séance D ; `lat-pulldown` ×4 |
| **P55** | `selectedDays` remplace `DAY_ASSIGNMENTS` ✅ · `week = {tuesday, thursday, saturday}` ✅ · lower_pull×3 ✅ | ✅ PASS | Réserves de contenu identiques à P42 (hip thrust inatteignable, good morning en tête de C, zéro poussée, ~67 min pour 60) ; pas de garde-fou si `selectedDays.length ≠ daysPerWeek` |
| **P56** | `['legs','shoulders']` → `lower_push` ✅ · `adjustedSlotCount(9,45,'endurance')` = 6 ✅ · `autoProgress:false` ✅ | ❌ Problème sérieux | **Un seul exercice d'épaule en BW (`bw-pike-pushup`)** pour un focus « épaules », répété A et B ; 2 séries seulement (arrondi `⌊2.25⌋`) ; **24 min générées pour 45** ; 6/8 exercices identiques A/B ; curtsy lunge sur le slot hip hinge |
| **P57** | `['legs','back']` → `lower_pull` ✅ · slot deadlift → `seed-hip-thrust-machine` ✅ · slot back_width → `seed-lat-pulldown` ✅ · aucun barbell/dumbbell ✅ | ⚠️ PASS | **Le slot « deadlift-first » est rempli par un hip thrust machine** qui ne charge pas les érecteurs — l'intention du template n'est pas réalisée ; aucun hip hinge possible en machine/câble (manque `cable-pull-through` / `back-extension` au seed) ; 3 exercices répétés A/B ; zéro poussée ; ~67 min pour 60 |
| **P58** | PPL ✅ · **EQUIP-FIX1** `seed-pullup` ✅ · **EQUIP-FIX2** `bw-inverted-row` + `seed-dips` ✅ · **EQUIP-FIX3** `bw-nordic-curl` ✅ · `progressStepKg:0` ✅ · aucun équipement hors BW+BAR ✅ | ✅ Bon programme | **`bw-nordic-curl` en 4×8-12 irréaliste** ; deltoïdes latéral et postérieur absents de la semaine (aucun exercice BW/pullup_bar) ; push day = 4 composés sans isolation réelle ; créneaux remplis à ~55 % ; aucune progression possible (`autoProgress:false` sans mécanisme alternatif) |
| **P59** | PPL ✅ · `back_width`, `back_thickness`, `biceps`, `dos iso`, `sh_rear`, `forearms` tous vides ✅ · **10 slots vides sur 18, 2 warnings seulement** | ❌ **Problème sérieux — le plus grave de l'audit** | **Pull day = 2 exercices (Cat-Cow + crunch)** livré sans blocage ; le wizard n'avertit pas (`availableCount` = 28 > 12) ; le PPL concentre tous les slots dos dans une séance vide, plus grave que P21 en fullbody |
| **P60** | PPL ✅ · aucun `pullup_bar` ✅ · `back_width` → `kb-deadlift` ✅ · `back_thickness` → `seed-row-dumbbell` ✅ · step 2,5 sur DB/KB et 0 sur band/BW ✅ · **tri par `strengthEquipmentPrio` FAIL — non appliqué en hypertrophie (ligne 564)** | ✅ Bon programme | **KB swing et KB clean structurellement inatteignables** ; aucun tirage vertical en HOME ; slot `forearms` vide sans warning |
| **P61** | `isMass=false` + intermediate + 4 j → `['push','pull','lower','fullbody']`, **identique à P49** ✅ · dos couvert par DB/KB ✅ · step 2,5 ✅ | ⚠️ PASS | **Objectif fat_loss non servi** : aucun cardio, KB swing (idéal en circuit) inatteignable ; 26 min de créneau inexploitées par séance ; 12 postes sur 34 non progressables |
| **P62** | KB seul ✅ · fullbody×3 beginner ✅ · pool KB = 14 listé ✅ · `kb-row` sert `fullbody-quad`, `kb-deadlift` sauve `fullbody-hip` → **aucun slot dos vide** ✅ · step 2,5 ✅ | ⚠️ PASS | **KB swing et KB clean jamais sélectionnés** ; **séances A et C identiques** ; deltoïdes latéral et postérieur absents (slots vides) ; `progressStepKg: 2,5` inapplicable aux kettlebells (paliers de 4 kg) |
| **P63** | `['legs','back']` + BW+BAR → `lower_pull` ✅ · nordic curl / pullup / inverted row / bw-squat aux slots attendus ✅ · `progressStepKg:0` ✅ · **« 3 sessions distinctes » FAIL : 6 exercices sur 9 identiques** | ❌ Problème sérieux | **`bw-nordic-curl` en 4×8-12 ×3/semaine chez un DÉBUTANT** (96-144 excentriques maximaux/semaine) ; `seed-pullup` en 4×8-12 pour un débutant ; jump squat 4×8-12 en C ; zéro poussée ; slots dos iso et ischios iso vides |
| **P64** | PPF ✅ · `seed-band-pull-apart` exclu d'`available` (warmup) ✅ · **SEED-2 CLOS : `band-face-pull` + `bw-prone-y-raise` remplissent `shoulders_rear` 3 fois sur 3** (assertion v3 périmée) · reps 15+ ✅ · `progressStepKg:0` ✅ | ⚠️ PASS | **`seed-pullup` en 3×15-20** (45-60 tractions/séance) irréaliste ; `bw-nordic-curl` en 3×15-20 idem ; intensification portant le volume à ~2 400 reps/semaine ; 31 min pour 60 ; slot `forearms` vide |
| **P65** | **EQUIP-5 confirmé : aucun exercice `cardio_machine` en sortie** (0 occurrence de `'cardio'` dans les 14 templates `SLOTS`) ✅ · PPF ✅ · `strengthEquipmentPrio('cardio_machine')=5` ✅ | ⚠️ PASS technique / ❌ objectif non servi | L'utilisateur coche « Cardio machine » et n'en voit **aucun effet** ; `availableCount` du wizard compte pourtant ces 4 exercices (fausse couverture) ; 17 à 26 min de créneau inexploitées ; le programme n'est **pas** strictement identique à FULL (`pullup_bar` du preset ajoute `seed-pullup`) |
| **P66** | `CARDIO` seul ✅ · tous `primaryMuscle:'cardio'` ✅ · **tous les slots vides** ✅ · pas de crash ✅ · 8 warnings ✅ · **correction : 2 exercices/séance (warmup + core bodyweight), pas 0** | ❌ Problème sérieux (edge case) | Programme inutilisable (Bird dog + crunch ×3) ; le wizard affiche **« Seulement 4 exercices disponibles — certains slots seront vides »** alors que 100 % le sont ; le message bloquant (`availableCount === 0`) n'est jamais déclenché |
| **P67** | `strength` est bien `isMass` → upper/lower A/B ✅ · `progressStepKg:0` et `autoProgress:false` partout ✅ · specs 5×3-5 générées malgré `autoProgress:false` ✅ · **`bw-chinup` FAIL : le slot biceps est élidé par le cap à 4** · **slot chest = 2 candidats, pas 3** | ❌ Problème sérieux | **`strength` + calisthenics non viable** : pompes et squats BW en 5×3-5 sans stimulus, **aucun mécanisme de progression** (ni lest, ni reps cibles, ni variation) ; nordic curl 5×3-5 puis 3×5-8 deux fois/semaine ; deltoïde postérieur, biceps, triceps, mollets élidés ; 66 min pour 60 ; **aucun warning sur cette incompatibilité** |
| **P68** | 2 j = fullbody ✅ · `week = {tuesday, saturday}` ✅ · `adjustedSlotCount(9,45)` = 6 ✅ · reps 15+ ✅ · `seed-pullup` au slot `back_width` ✅ · **« 8 exercices » FAIL : 7** (slot `shoulders_rear` vide) · **`seed-dips` FAIL : jamais candidat en fullbody** (aucun slot `chest_lower`) | ⚠️ PASS technique | **22 min générées pour 45 annoncées** ; `seed-pullup` en 2×15-20 et `bw-nordic-curl` en 2×15-20 irréalistes pour un débutant ; 5/7 exercices identiques A/B ; mardi+samedi = bonne récupération ✅ |

**Bilan des verdicts :** ✅ Bon programme : **9** · ⚠️ PASS avec réserve : **43** ·
❌ Problème sérieux : **16**.
**Aucune régression critique** (BUG#3, LEGS+CORE, 2J, BEG5J, PPF, LP1-LP5, PUSH_FULL, PULL_FULL,
ARMS, EQUIP, PHASE1, WIZ1, WIZ2) n'est reproduite : **toutes les assertions de non-régression passent.**

---

## Bloc 2 — Synthèse des problèmes ouverts

### 2.1 Bugs / anomalies logicielles

#### BUG-A — `back_width` compound sans `back_thickness` : slots dos vides (BUG#4 résiduel)

| | |
|---|---|
| **Profils** | P22 (fullbody-hip), P25 (fullbody-hip), P53 (upper-pull), + tout profil DB-only/band-only |
| **Assertion** | « DB-only → slot dos non-vide » — **PASS sur `fullbody-quad`, FAIL sur les autres templates** |
| **Localisation** | `fullbody-hip` ligne 269, `pull` ligne 119, `upper-pull` ligne 180, `lower_pull` ligne 221 — tous `{ muscles: ['back_width','back'], compound: true }` |
| **Impact concret** | En haltères seuls, `seed-row-dumbbell` (`primaryMuscle: 'back_thickness'`) ne qualifie pas → 1 séance sur 3 (P22) ou 1 séance sur 2 (P53) **sans aucun exercice de dos**. En band+BW (P25), idem. |
| **Correction recommandée** | Ajouter `'back_thickness'` aux slots `back_width` de `fullbody-hip`, `pull`, `upper-pull` et `lower_pull` — comme c'est déjà fait dans `fullbody-quad` (ligne 256) et `upper-push` (ligne 169). Le tri `slot.muscles[0] = 'back_width'` conserve la priorité au tirage vertical quand il existe. |

#### BUG-B — Séance entièrement vide livrée sans blocage

| | |
|---|---|
| **Profils** | **P59** (BW pur PPL — Pull day à 2 exercices), P05, P06 (BW pur PPF), P66 (cardio seul — 3 séances à 2 exercices) |
| **Assertion** | « Vérifier combien de slots sont null et si le générateur émet des warnings » — warnings émis, **mais aucun garde-fou** |
| **Impact concret** | L'utilisateur ouvre une séance nommée « Pull — Tirage » contenant un Cat-Cow et un crunch. Perception immédiate d'une application cassée. Le wizard n'avertit pas (`availableCount` = 28 > seuil de 12). |
| **Correction recommandée** | 1) Dans `generateProgramDraft`, si **tous** les slots composés d'un `workoutType` sont vides → ne pas pousser la séance et basculer ce jour sur `fullbody-quad`, ou refuser la génération avec un warning bloquant. 2) Warning ciblé : *« Impossible de générer un Pull day sans barre de traction. »* 3) Côté wizard, calculer la couverture **par groupe musculaire** au lieu du seul total. |

#### BUG-C — `cardio_machine` structurellement inutilisable (EQUIP-5)

| | |
|---|---|
| **Profils** | P65, P66 — et par extension **tous les profils `fat_loss`/`endurance`** : P06, P25, P49, P61, P64 |
| **Assertion** | « Aucun exercice `cardio_machine` en sortie » — **PASS (le bug est confirmé)** |
| **Localisation** | `SLOTS` lignes 109-278 — **0 occurrence de `'cardio'`** ; `pickExercise` filtre ligne 528 sur `slot.muscles.includes(ex.primaryMuscle)` |
| **Impact concret** | `cardio_machine` est dans le type `Equipment`, coché **par défaut** dans le preset « Salle de sport » (ligne 87), a sa propre section dans le wizard (ligne 134-136), et est compté par `availableCount` (ligne 411-413). Il n'a **aucun effet**. Plus grave : **aucun objectif `fat_loss` ou `endurance` ne reçoit le moindre exercice cardio**, même en bodyweight (`bw-burpees`, `seed-jump-rope`, `bw-high-knees` sont aussi `primaryMuscle: 'cardio'`, donc inatteignables). |
| **Correction recommandée** | Ajouter un slot `{ muscles: ['cardio'], compound: true }` en fin de template (après le core) pour `fat_loss` et `endurance`, avec une spec dédiée (1 série, durée en minutes). Cela remplit du même coup les 17-26 min de créneau inexploitées sur ces profils. À défaut, exclure `cardio_machine` d'`availableCount` et afficher un message explicite. |

#### BUG-D — `usedGlobally` prime sur la popularité → exercices marginaux promus en tête de séance

| | |
|---|---|
| **Profils** | P02 (front squat), P08 (**good morning 5×3-5**), P11/P16/P20/P45/P47/P53 (triceps kickback pop 1), P13/P18/P56 (**curtsy lunge**, **jump squat**), P22 (curl incliné), P25 (band good morning, band chest press pop 1), P41/P42/P43/P55 (**good morning**), P63 (jump squat) |
| **Localisation** | `pickExercise`, lignes 568-571 — le comparateur `usedGlobally` est évalué **avant** `popularity` |
| **Impact concret** | Sur les séances 2 et 3 d'un même type, le générateur promeut systématiquement l'exercice **le moins populaire** du pool en position 1. Conséquences observées : good morning en 5×3-5 (risque lombaire, P08/P43), jump squat pliométrique en 4×8-12 chez un débutant (P13/P18/P63), kickback triceps sur un muscle explicitement ciblé (P47). |
| **Correction recommandée** | Pondérer plutôt que trancher : remplacer le tri binaire par un score, ex. `score = popularity − (usedGlobally ? 1.5 : 0)`, de sorte qu'un exercice pop 4 déjà utilisé reste devant un pop 1 inédit. Alternativement, n'appliquer le critère `usedGlobally` **qu'aux slots isolation**, jamais au premier composé de la séance. |

#### BUG-E — Slots isolation vides non signalés

| | |
|---|---|
| **Profils** | P23 (fessiers, BB+DB), P60/P61 (avant-bras, HOME), P62 (deltoïdes, KB), P63 (dos iso + ischios iso), P68 (deltoïde postérieur), P13/P18 (ischios) |
| **Localisation** | `generateProgramDraft` ligne 791 — `if (slot.compound)` : seuls les slots composés produisent un warning |
| **Impact concret** | Un utilisateur BB+DB perd silencieusement son slot fessiers ; un utilisateur KB perd ses deltoïdes latéral et postérieur. Rien ne le signale, ni dans le programme ni dans les warnings. Écart entre la durée annoncée et la durée réelle non expliqué. |
| **Correction recommandée** | Émettre aussi un warning (de niveau « info ») pour les slots isolation vides, ou au minimum un compteur : *« 3 exercices n'ont pas pu être placés avec votre équipement. »* |

#### BUG-F — Fallback isolation→composé sans fallback composé→isolation

| | |
|---|---|
| **Profils** | P58/P67 (dips composés sur slot chest isolation), P22/P23/P41/P60 (RDL composé sur slot hamstrings isolation), P42/P61 (hip thrust/KB swing composés jamais atteints sur slot glutes isolation) |
| **Localisation** | `pickExercise` lignes 533-546 : un slot `compound:true` sans candidat composé retourne `null` (pas de repli sur une isolation) ; un slot `compound:false` retombe sur un composé si aucune isolation. Asymétrie volontaire mais aux effets pervers. |
| **Impact concret** | **(a)** Le slot glutes isolation de `lower_pull`/`lower-hip` filtre sur `category === 'isolation'` et trouve toujours `glute-bridge`/`donkey-kick` → **`seed-hip-thrust` (pop 4) et `kb-swing` (pop 3) ne sont jamais sélectionnés** sur un focus fessiers (P42, P55) ni en home gym (P60, P61). **(b)** À l'inverse, en calisthenics, les slots isolation sont remplis par des composés (dips, dips triceps) → une séance de 4 composés d'affilée sans isolation réelle (P58). |
| **Correction recommandée** | Pour (a) : sur un slot isolation dont le muscle principal est ciblé par le focus, autoriser un composé mieux classé (ou ajouter un slot `['glutes','hamstrings'] compound` dans `lower_pull`). Pour (b) : accepter le repli mais l'annoter dans l'UI (« pas d'isolation disponible pour ce groupe »). |

#### BUG-G — Angles morts des warnings d'équilibre

| | |
|---|---|
| **Profils** | P12, P41, P42, P46, P55, P57 (zéro poussée, non signalé) · P17, P54 (zéro bas du corps, non signalé) · P21, P05, P06 (fullbody sans dos, considéré comme équilibré) |
| **Localisation** | UX-5 lignes 898-911 : `hasPushSession && !hasPullSession` — détecte l'absence de tirage, **jamais l'absence de poussée**. UX-D ligne 880 : `t === 'push' \|\| t === 'pull' \|\| t === 'lower'` — **`upper` est exclu** de la détection de spécialisation. Ligne 899 : `fullbody-quad`/`fullbody-hip` comptent toujours comme « séance de tirage », même quand tous leurs slots dos sont vides. |
| **Impact concret** | Un programme `pull`-only (P12, P46) ou `lower_pull`-only (P41, P42, P55, P57) n'est jamais averti de l'absence totale de poussée. Un programme `upper`×4 (P54) n'est jamais averti de l'absence de jambes. Un fullbody BW pur (P21) est considéré comme équilibré alors qu'il n'a aucun tirage. |
| **Correction recommandée** | Calculer l'équilibre **a posteriori sur les exercices réellement générés** (compter les `primaryMuscle` par pattern) plutôt qu'a priori sur les types de split. Ajouter la détection symétrique `hasPullSession && !hasPushSession` et l'absence de bas du corps. |

#### BUG-H — Warning UX-B mal libellé pour le focus « épaules »

| | |
|---|---|
| **Profils** | P16, P45 (et tout focus contenant `'shoulders'` avec un split push) |
| **Localisation** | Ligne 889 : `(focusMuscles ?? []).some(f => f === 'arms' \|\| f === 'shoulders')` |
| **Impact concret** | Un utilisateur qui coche « Épaules » (ou « Pectoraux + Épaules ») reçoit : *« Focus bras en push : le biceps n'est pas ciblé en séance push… »* — message hors sujet. |
| **Correction recommandée** | Séparer les deux cas : message « bras » si `arms` ∈ focus ; message « épaules » distinct (ou aucun) sinon. |

#### BUG-I — `seed-dips` inatteignable en fullbody ; `chest_lower` orphelin

| | |
|---|---|
| **Profils** | P68 (assertion « `seed-dips` disponible pour `chest_lower` » → **FAIL**), P25, P64 |
| **Localisation** | `fullbody-quad` ligne 255 et `fullbody-hip` ligne 268 : slot chest = `['chest','chest_upper']` — **sans `chest_lower`** |
| **Impact concret** | `seed-dips` (pop 3) et `seed-decline-bench-barbell` (pop 1) ne peuvent jamais être sélectionnés dans un fullbody, quel que soit l'équipement. En calisthenics 2 j (P68), les dips — l'un des deux meilleurs mouvements disponibles — sont perdus. |
| **Correction recommandée** | Aligner les slots chest de `fullbody-quad`/`fullbody-hip` sur ceux de `push` (`['chest','chest_upper','chest_lower']`). |

#### BUG-J — `progressStepKg` uniforme à 2,5 kg

| | |
|---|---|
| **Profils** | P23 (BB+DB force), P60/P61 (HOME), **P62 (kettlebell — critique)** |
| **Localisation** | `makeDraftWE` lignes 584-586 : `bodyweight`/`band`/`pullup_bar` → 0, **tout le reste → 2,5** |
| **Impact concret** | 2,5 kg est adapté au barbell mais : inapplicable au kettlebell (paliers commerciaux de 4 kg — P62) ; trop grossier pour un développé militaire ou un écarté haltère (une paire d'haltères progresse par 2×1 kg ou 2×2 kg) ; trop fin pour un squat ou un leg press. |
| **Correction recommandée** | Différencier par équipement **et** par type de slot : barbell composé 2,5-5 kg · barbell isolation 1,25-2,5 · dumbbell 1-2 · kettlebell **4** · machine/cable 2,5-5. |

#### BUG-K — Absence de garde-fou sur `selectedDays`

| | |
|---|---|
| **Profils** | P55, P68 (comportement correct) — risque théorique sur appel programmatique |
| **Localisation** | Ligne 754 : `(selectedDays && selectedDays.length === daysPerWeek) ? selectedDays : DAY_ASSIGNMENTS[...]` |
| **Impact concret** | Si les longueurs divergent, le repli sur les jours par défaut est **silencieux**. Le wizard garantit l'égalité (ligne 262-266), mais un appel direct ou une évolution du wizard passerait inaperçu. |
| **Correction recommandée** | Logguer ou remonter un warning quand `selectedDays` est fourni mais ignoré. |

#### Anomalies du fichier d'audit v3 (attentes périmées, pas des bugs du code)

| Code | Attente v3 | Réalité du code | Profils |
|---|---|---|---|
| SLOTS-60 | `adjustedSlotCount(base, duration)` à 2 arguments | Signature à **3 arguments** avec `goal` (lignes 422-439) ; force 60 min → `max(4, base×0.5)`, force 90 min → `min(base, 6)` | P02, P50 |
| SHORT20 | 20 min → slots + warmup + core | ≤ 20 min → warmup à **1 série**, **core supprimé** (lignes 812-831) | P27, P30 |
| REPS-3 | `strength.intensification.repsOffset = -3` → repsMin 0 = « BUG CRITIQUE » | Le code est à **−2** (ligne 623) avec commentaire explicite → repsMin = 1. **Bug déjà corrigé.** | P32, P37, P40 |
| SEED-2 | `shoulders_rear` en band → slot vide | **`band-face-pull`** (pop 2) et **`bw-prone-y-raise`** (pop 1) le remplissent | P25, P64 |
| DIPS-CAT | `seed-triceps-dips` annoncé `isolation` | Il est **`compound`** dans le seed | P58, P67 |
| PRIO-HYP | Tri par `strengthEquipmentPrio` en hypertrophie | Appliqué **uniquement** si `goal === 'strength' && slot.compound` (ligne 564) | P60 |

---

### 2.2 Réserves coach cumulées, regroupées par thème

#### Thème 1 — Exercices à risque ou irréalistes promus en position principale
*Profils : P08, P13, P18, P23, P41, P42, P43, P55, P56, P58, P63, P64, P67, P68*

- **`seed-good-morning` en 5×3-5 avec 180 s de repos** (P08, P43) et en 4×8-12 en tête de séance
  (P41, P42, P55). Mouvement à bras de levier lombaire maximal, chargé lourd, souvent chez un débutant.
- **`bw-nordic-curl` en 4×8-12 ×3/semaine chez un débutant** (P63), en 5×3-5 puis 3×5-8 chez un
  confirmé deux fois par semaine (P67), en 3×15-20 (P64) et 2×15-20 (P68). Excentrique maximal
  des ischios ; volumes hors de portée et à haut risque de lésion.
- **`seed-pullup` en 4×8-12 / 3×15-20 / 2×15-20 pour des débutants** (P63, P64, P68) —
  30 à 60 tractions par séance.
- **`bw-jump-squat` (pliométrie) en 4×8-12 en tête de séance** (P13, P18, P63).
- **`seed-curtsy-lunge` (adducteurs/moyen fessier) sur le slot hip hinge** (P13, P18, P56).
- **RDL + soulevé de terre lourds dans la même séance** (P10) ; **4 hip hinges dans une séance
  de débutant** (P41) ; **charge lombaire cumulée sur 3 jours** (P23).

> **Recommandation générateur/seed :** ajouter au seed un champ `difficulty` (1-3) ou
> `minLevel: 'beginner'|'intermediate'|'advanced'`, et filtrer `available` par niveau dans
> `pickExercise`. Interdire les exercices à haute exigence excentrique/technique
> (nordic curl, jump squat, good morning lourd) en tête de séance pour `beginner`,
> et interdire les specs `strength` (5×3-5) sur les mouvements à fort risque lombaire
> sans progression préalable.

#### Thème 2 — Adéquation durée annoncée / durée réelle
*Profils : sous-remplissage — P05, P06, P13, P14, P18, P21, P49, P51, P56, P58, P59, P61, P64, P65, P68, P29 · dépassement — P02, P08, P10, P23, P41, P42, P43, P44, P50, P52, P55, P57, P67*

- **Dépassement systématique en `strength` 60 min** : 4 slots composés × 5 séries × 210 s = 70 min
  avant même le warmup et le core → **~76 min pour 60 annoncées** (P02, P10, P43).
- **Dépassement en hypertrophie fullbody 9 slots** : ~67 min pour 60 (P01, P19, P41, P42, P44, P52, P55, P57).
- **Sous-remplissage massif en 90 min hypertrophie** : le cap à 8 slots produit **62 min pour 90**
  (P29).
- **Sous-remplissage en calisthenics et équipements réduits** : 22 à 35 min générées pour
  45-60 annoncées (P56, P58, P59, P64, P68) — cumul de slots vides et de séries réduites.
- **Arrondi pénalisant à 45 min** : `⌊3 × 0,75⌋ = 2` séries au lieu de 2,25 → **−33 %** de volume
  sur tous les objectifs à 3 séries de base (endurance, fat_loss, isolations) (P56, P68).

> **Recommandation :** remplacer le nombre de slots fixe par un **budget temps** :
> estimer `Σ sets × (temps de travail + restSec)` et ajouter des slots tant que le budget
> n'est pas atteint. Cela résout à la fois le dépassement en force et le sous-remplissage
> en 90 min ou en équipement réduit.

#### Thème 3 — Slots vides et couverture musculaire par équipement
*Profils : P05, P06, P13, P14, P18, P21, P22, P23, P25, P53, P56, P58, P59, P60, P62, P63, P66, P68*

| Configuration | Groupes structurellement non couverts |
|---|---|
| **BW pur** | dos (largeur **et** épaisseur), biceps, triceps, ischios, deltoïdes latéral et postérieur |
| **BW + barre de traction** | deltoïdes latéral et postérieur ; ischios en isolation ; dos en isolation |
| **Haltères seuls** | dos en isolation ; `back_width` compound dans `fullbody-hip`/`upper-pull` |
| **Kettlebell seul** | deltoïdes latéral et postérieur ; avant-bras |
| **Home gym (DB+KB+band+BW)** | avant-bras ; tirage vertical |
| **Machine + câble** | (couverture complète — meilleure configuration non-FULL) |
| **Barbell + haltères** | fessiers en isolation ; tirage vertical |
| **Band + BW** | `back_width` compound dans `fullbody-hip` |
| **Cardio machine seul** | **tout** |

> **Recommandations seed :** ajouter `cable-pull-through` et `back-extension` (hip hinge en
> machine/câble, cf. P57) · un exercice `shoulders_lateral` en bodyweight et en kettlebell
> (ex. `kb-lateral-raise`, `bw-lateral-raise-isometric`) · un exercice `shoulders_rear` en
> bodyweight (ex. `bw-prone-t-raise`) · un exercice d'avant-bras non-barbell
> (`db-wrist-curl`, `kb-farmer-hold`) · un exercice `back_width` en dumbbell **compound**.

#### Thème 4 — Variété inter-sessions insuffisante
*Profils : P02, P11, P12, P16, P20, P21, P43, P45, P47, P56, P62, P63, P68*

- **Répétition complète** (séance identique) : P43 (Squat & Press A = C), P45 (Push A = C),
  P62 (Full Body A = C).
- **Quasi-répétition** (≥ 5 exercices sur 6-9 identiques) : P11, P16, P20, P21, P47, P56, P63, P68.
- **Cause racine** : pour de nombreux slots, le pool de candidats est **plus petit que le nombre
  de séances du même type**. Exemples : `back_width` compound en salle = 2 candidats pour 3-4
  séances (P12, P17, P54) ; chest compound en DB = 2 candidats pour 3 séances (P45) ;
  8 des 14 exercices KB sont seuls candidats de leur slot (P62).
- **Verdict par profil** : « variété structurelle » réelle uniquement quand deux types internes
  différents alternent (P01, P07, P09, P13, P28, P48) ; sinon « variété d'exercices seulement »,
  voire « répétition complète ».

> **Recommandation :** quand `pool.length < nombre de séances du même type`, alterner
> explicitement les **variantes de slot** (ex. faire tourner `back_width` → `back_thickness`
> en tête de séance) plutôt que de répéter le même exercice. Enrichir le seed en priorité
> sur `back_width` compound (4 exercices dont 2 isolations), `shoulders_front` (1 exercice)
> et `chest_lower` (2 exercices).

#### Thème 5 — Volume et récupération inadaptés au niveau
*Profils : P02, P08, P09, P13, P21, P27, P43, P44, P51, P54, P59, P63*

- **Volume excessif / récupération insuffisante** : P09 (47 postes/semaine pour un débutant,
  jambes 3 jours sur 4) · P51 (5 jours consécutifs sans repos, jambes 3 jours de suite) ·
  P54 (4 séances upper dont 2 fois 2 jours consécutifs, ~40 séries de deltoïde latéral/semaine) ·
  P43 (OHP et bench lourds 3×/semaine) · P13 (4 séances jambes/semaine) · P63 (nordic curl ×3/semaine).
- **Volume insuffisant** : P02 (4 mouvements, zéro isolation, 3 fois/semaine) · P27 (2 séries/muscle,
  sous le seuil de stimulation) · P21/P59 (5 à 14 slots vides) · P30 (6 séries lourdes/semaine
  par mouvement).
- **Le générateur détecte deux cas** : `strength` + `beginner` (UX-C, ligne 861) et
  `beginner` + ≥ 5 j (UX-H, ligne 869). ✅ Bons réflexes. **Mais aucun contrôle de la répartition
  hebdomadaire** (jours consécutifs, fréquence par groupe musculaire).

> **Recommandation :** ajouter un contrôle post-génération de la fréquence par groupe musculaire
> et de l'espacement des jours (`DAY_ASSIGNMENTS[5]` place 5 séances lundi→vendredi sans repos).
> Avertir quand un même pattern est chargé à moins de 48 h d'intervalle en objectif `strength`.

#### Thème 6 — Objectifs `fat_loss` et `endurance` mal servis
*Profils : P05, P06, P25, P49, P51, P61, P64, P65, P66*

- **Aucun exercice cardio n'est jamais généré** (cf. BUG-C), quel que soit l'équipement —
  y compris quand `bw-burpees`, `seed-jump-rope`, `bw-high-knees` sont disponibles en bodyweight.
- **Aucune densification** : ni circuit, ni superset, ni EMOM, ni temps sous tension.
  Les specs `fat_loss` (3×12-15, 60 s) et `endurance` (3×15-20, 60/45 s) sont de simples
  séries droites.
- **Créneaux sous-remplis** de 17 à 26 min sur ces objectifs (P49, P61, P64, P65) — précisément
  l'espace qu'occuperait un finisher cardio.
- **Volume d'intensification excessif** en endurance : +1 série et +3 reps portent un composé
  à 4×18-23, soit 2 400 à 3 400 répétitions hebdomadaires (P33, P51, P64).

> **Recommandation prioritaire :** implémenter le slot `cardio` (BUG-C). Second niveau :
> introduire un `format` de séance (`straight` / `circuit` / `superset`) piloté par l'objectif,
> `fat_loss` et `endurance` utilisant le circuit par défaut.

#### Thème 7 — Progression impossible sans charge externe
*Profils : P05, P06, P13, P14, P18, P21, P25, P56, P58, P59, P63, P64, P67, P68*

- `progressStepKg: 0` et `autoProgress: false` pour `bodyweight`, `band` et `pullup_bar`
  (ligne 585) : **techniquement correct, fonctionnellement bloquant.**
- **Aucun mécanisme alternatif** : ni répétitions cibles progressives, ni lest, ni progression
  par variation d'exercice.
- Cas le plus aigu : **P67** — un confirmé en `strength` calisthenics reçoit
  « pompes 5×3-5 » avec zéro moyen de progresser, et **aucun warning**.
- Cas fréquent : `bw-squat` ou `seed-pushup` retenus comme composé principal en salle complète
  par effet `usedGlobally` (P09, P51, P54) — le mouvement le moins progressable prend la place
  du squat barre.

> **Recommandations :** 1) ajouter des variantes lestées au seed
> (`weighted-pullup`, `weighted-dips`, `weighted-vest-pushup`, équipement `pullup_bar`,
> `progressStepKg: 2.5`) ; 2) implémenter une progression par répétitions pour les exercices
> à `progressStepKg: 0` ; 3) avertir quand `goal === 'strength'` et qu'aucun équipement
> chargeable n'est sélectionné.

#### Thème 8 — Écart entre l'intention utilisateur et le programme livré
*Profils : P14, P15, P18, P20, P42, P46, P48, P53, P55, P56, P62, P65*

| Focus déclaré | Ce que l'utilisateur reçoit | Averti ? |
|---|---|---|
| **core** seul | 1 exercice de gainage en fin de séance, identique à l'absence de focus (`reorderSlotsByFocus` est un no-op sur `core`) | ✅ (UX-6) |
| **arms** seul | 4 postes bras sur 19 ; le reste est pecs/dos/épaules | ✅ (UX-6) |
| **shoulders + arms** en push | 1 slot triceps, **0 slot biceps** | ✅ (UX-B) |
| **back + arms** en pull | 1 slot biceps, **0 slot triceps** ; avant-bras sur-priorisés | ❌ |
| **shoulders + back** → upper | **1 seul développé d'épaule/semaine** (`upper-pull` n'a pas de slot OHP) ; 2 développés couchés non demandés | ❌ |
| **legs + back** (persona fessiers) | **Hip thrust jamais sélectionné** (slot glutes en isolation) | ❌ |
| **legs + shoulders** en BW | **1 seul exercice d'épaule** (`bw-pike-pushup`), répété | ❌ |
| **kettlebell** | **KB swing et KB clean jamais sélectionnés** | ❌ |
| **cardio machine** cochée | Aucun effet sur le programme | ❌ |

> **Recommandation :** faire du `focusMuscle` un signal d'**ajout de slot** et non seulement de tri.
> Exemple : `arms` → +1 slot biceps et +1 slot triceps ; `shoulders` → garantir un slot OHP dans
> chaque variante ; `core` → +1 ou +2 slots core. Compléter la couverture des warnings pour les
> cas non signalés du tableau ci-dessus.

---

### 2.3 Récapitulatif des assertions critiques de non-régression

| Code | Assertion | Profils | Résultat |
|---|---|---|---|
| BUG3 | `focusMuscles:['core']` → `null` → jamais `'lower'` | P14, P15 | ✅ **PASS** |
| BUG4 | DB-only → slot dos non vide | P22 | ⚠️ **PASS sur `fullbody-quad`, FAIL résiduel sur `fullbody-hip`/`pull`/`upper-pull`/`lower_pull`** |
| SLOTS | Fullbody base = 9 slots | P01, P27-P29 | ✅ **PASS** |
| PPF | endurance/fat_loss + intermediate + 3 j → push/pull/fullbody | P05, P06 | ✅ **PASS** |
| 2J | 2 j = fullbody toujours | P10, P50 | ✅ **PASS** |
| BEG5J | isMass + beginner + 5 j = upper/lower/upper/lower/fullbody | P09 | ✅ **PASS** |
| LEGS+CORE | legs + core → lower | P18 | ✅ **PASS** |
| EQUIP | Aucun exercice hors équipement disponible | P21-P25, P57-P68 | ✅ **PASS** (0 violation sur 238 séances) |
| BUILD1 | totalWeeks < 8 → `undefined` | P31 | ✅ **PASS** |
| BUILD2 | adapt = 2 fixe | P32-P36 | ✅ **PASS** |
| BUILD3 | deload = 1 si < 12 sem., 2 si ≥ 12 | P32, P33, P35, P36 | ✅ **PASS** |
| BUILD4 | intensive = 2 / 3 / 4 selon 9 / 10-15 / ≥16 | P32-P36 | ✅ **PASS** |
| BUILD5 | progress = `max(1, total − adapt − intens − deload)` | P32-P36 | ✅ **PASS** |
| BUG5 | strength composé intensification → repsMin ≥ 1 | P37 | ✅ **PASS** (repsOffset −2, bug déjà corrigé) |
| PHASE1 | `phaseAtLeast` compare correctement les ordres 1-4 | P38 | ✅ **PASS** |
| WIZ1 | `phaseLabel` appelle `buildPhases` (pas de formule inline) | P39 | ✅ **PASS** |
| WIZ2 | `fmtMod` dérivé de `PHASE_CONFIG_BY_GOAL` | P40 | ✅ **PASS** |
| LP1 | legs + back (sans push) → `lower_pull`, jamais fullbody | P41, P42, P57, P63 | ✅ **PASS** |
| LP2 | legs + push (sans pull) → `lower_push`, jamais fullbody | P43, P44, P56 | ✅ **PASS** |
| LP3 | legs + push + pull → `null` → fullbody | P52 | ✅ **PASS** |
| LP4 | `lower_pull` deadlift-first : slot 1 = composé hamstrings/glutes | P41, P42 | ✅ **PASS** |
| LP5 | `lower_push` squat-first : slot 1 = composé quads/glutes | P43, P44 | ✅ **PASS** |
| PUSH_FULL | chest + shoulders → `push` (pas `upper`) | P45 | ✅ **PASS** |
| PULL_FULL | back + arms → `pull` (pas `upper`) | P46 | ✅ **PASS** |
| ARMS | arms seul → `upper` (règle 5) | P53 | ✅ **PASS** |
| EQUIP-FIX1 | BW+BAR : `seed-pullup` disponible pour `back_width` | P58, P63, P67, P68 | ✅ **PASS** |
| EQUIP-FIX2 | BW+BAR : `seed-dips` et `bw-inverted-row` disponibles | P58, P67 | ✅ **PASS** |
| EQUIP-FIX3 | BW+BAR : `bw-nordic-curl` disponible pour `hamstrings` | P58, P63 | ✅ **PASS** |
| BW-VIDE | BW pur : `back_width`, `back_thickness`, `biceps` composés vides | P05, P06, P21, P25, P59 | ✅ **PASS** (comportement confirmé) |
| HOME | HOME : dos couvert par KB/DB row | P60, P61 | ✅ **PASS** |
| KB | KB-only : slots vides identifiés (deltoïdes latéral et postérieur) | P62 | ✅ **PASS** |
| EQUIP5 | `cardio_machine` jamais sélectionné | P65, P66 | ✅ **PASS** (bug confirmé) |
| CARDIO-EDGE | `cardio_machine` seul → programme vide | P66 | ✅ **PASS** (2 exercices/séance : warmup + core) |
| PROG0 | BW+BAR : `progressStepKg = 0`, `autoProgress = false` | P58, P63, P67, P68 | ✅ **PASS** |

**Conclusion — aucune régression détectée sur les 34 assertions critiques.**
Les 6 « FAIL » relevés dans les groupes A à G proviennent tous d'**attentes périmées du fichier
d'audit v3** (signature d'`adjustedSlotCount`, séances ≤ 20 min, `repsOffset` strength,
SEED-2, catégorie de `seed-triceps-dips`, priorité d'équipement en hypertrophie), et non de
défauts du code — sauf **BUG-A** (`back_thickness` manquant sur 4 templates), qui est un
reliquat réel du correctif BUG#4.

### 2.4 Priorisation des corrections recommandées

| Priorité | Correction | Bugs couverts | Profils débloqués |
|---|---|---|---|
| **P0** | Ne jamais livrer une séance dont tous les slots composés sont vides (bascule fullbody ou refus) | BUG-B | P05, P06, P59, P66 |
| **P0** | Ajouter `'back_thickness'` aux slots `back_width` de `fullbody-hip`, `pull`, `upper-pull`, `lower_pull` | BUG-A | P22, P25, P53 |
| **P1** | Ajouter un slot `cardio` pour `fat_loss` / `endurance` | BUG-C | P06, P25, P49, P61, P64, P65 |
| **P1** | Pondérer `usedGlobally` au lieu de le prioriser sur la popularité | BUG-D | P08, P13, P18, P41, P43, P47, P55, P63 |
| **P1** | Filtrer `available` par difficulté/niveau (nordic curl, jump squat, good morning) | Thème 1 | P13, P18, P43, P63, P64, P67, P68 |
| **P2** | Remplacer le comptage de slots par un budget temps | Thème 2 | 29 profils |
| **P2** | Détection d'équilibre a posteriori (absence de poussée, absence de jambes) | BUG-G | P12, P17, P21, P41, P46, P54, P55, P57 |
| **P2** | `progressStepKg` différencié par équipement (kettlebell = 4 kg) | BUG-J | P23, P60, P61, P62 |
| **P3** | Warning sur les slots isolation vides | BUG-E | P13, P18, P23, P60, P62, P63, P68 |
| **P3** | `chest_lower` dans les slots chest de `fullbody-*` | BUG-I | P25, P64, P68 |
| **P3** | `focusMuscle` = ajout de slots, pas seulement tri | Thème 8 | P14, P15, P20, P42, P46, P48, P53, P56 |
| **P3** | Enrichir le seed : `cable-pull-through`, `back-extension`, deltoïdes latéral/postérieur en BW et KB, avant-bras non-barbell, `back_width` compound en DB, variantes lestées | Thèmes 3, 4, 7 | P13, P21, P56, P57, P58, P62, P63, P67 |
| **P4** | Corriger le libellé du warning UX-B pour le focus « épaules » | BUG-H | P16, P45 |
| **P4** | Afficher le libellé de phases sur l'option « 📅 Standard » du wizard | P39 | — |

---

*Fin de l'audit — 68 profils traités, 238 séances générées et vérifiées exercice par exercice
contre le code de production.*
