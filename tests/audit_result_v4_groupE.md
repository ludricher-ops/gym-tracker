# Audit `generateProgramDraft` v4 — GROUPE E (Durée × Structure) — P60 → P65

**Auditeur :** coach sportif certifié (15 ans de programmation) + simulation ligne à ligne du code.
**Fichiers simulés :**
- `src/utils/programGenerator.ts` (1172 lignes, lu en entier)
- `src/components/screens/ProgramGeneratorScreen.tsx` (note ℹ️ durée force, l. 296–314)
- `src/data/exercises-seed.json` (151 exercices, ordre fichier utilisé pour les départages)

**Rappel des barèmes lus dans le code**

`adjustedSlotCount(base, duration, goal)` — l. 627–644 :

| durée | strength | autres goals | ligne |
|---|---|---|---|
| 20 | `max(2, floor(base×0.5))` | `max(2, floor(base×0.5))` | 633 |
| 45 | `max(2, floor(base×0.5))` | `max(3, floor(base×0.75))` | 634–636 |
| 60 | `max(4, floor(base×0.5))` | `base` | 637–639 |
| 90 | `min(base, 5)` | `min(base+2, 8)` | 641–643 |

`adjustedSpec(spec, duration)` — l. 651–655 : 60/90 → inchangé ; 20 → `×0.5` ; 45 → `×0.75` ; plancher `max(2, …)` (l. 654).

**Règle « séance très courte » (l. 1017–1036) — impacte tout le groupe E à 20 min :**
```ts
const isVeryShort = sessionDuration <= 20            // l. 1017
const effectiveWarmupSpec = isVeryShort ? { ...WARMUP_SPEC, sets: 1 } : WARMUP_SPEC   // l. 1018
if (!isVeryShort && corePool.length > 0) { … }       // l. 1031 → PAS de core à 20 min
```
→ à 20 min le total réel est **slots + 1 (warmup)**, et non `slots + warmup + core`. Les totaux annoncés dans le prompt d'audit pour P60, P61 et P64 sont donc à corriger (voir assertions).

---

## P60 — 20 min + strength + intermediate 3j → volume extrêmement réduit

```
{ goal:'strength', daysPerWeek:3, sessionDuration:20, equipment:FULL, level:'intermediate' }
```

### Simulation

**Étape 1 —** `focusMuscles` absent → `[]` → `workoutTypeFromFocus([])` → `null` (l. 402, retour immédiat sur `length === 0`).
Flags non évalués : `hasLower=–, hasPush=–, hasPull=–, hasArms=–, hasUpper=–, hasCore=–`.

**Étape 2 —** `selectSplit` : `pref='auto'`, `focusType=null` → switch par défaut, `case 3` :
`isMass = (goal==='strength') → true` ; `level='intermediate' ≠ 'beginner'` → **`['push','pull','legs']`** (l. 553).
Noms (l. 590–611 + suffixe l. 1039–1041) : canons `push`/`pull`/`legs` uniques → aucun suffixe →
« Push — Poussée » · « Pull — Tirage » · « Legs — Jambes ».

**Étape 3 — `adjustedSlotCount` pas à pas** (duration=20 → l. 633, formule identique quel que soit le goal) :
- push  : base=6 → `max(2, floor(6×0.5)) = max(2, floor(3)) = max(2,3) = **3**`
- pull  : base=6 → `max(2, floor(3)) = **3**`
- legs  : base=6 → `max(2, floor(3)) = **3**`

**`adjustedSpec` pas à pas** (duration=20 → `factor = 0.5`, l. 653) :
- compound strength `{sets:5, 3-5, rest 180}` → `max(2, floor(5×0.5)) = max(2, floor(2.5)) = max(2,2) = **2 séries × 3-5**, rest 180 s
- isolation strength `{sets:3, 5-8, rest 120}` → `max(2, floor(3×0.5)) = max(2, floor(1.5)) = max(2,1) = **2 séries × 5-8**, rest 120 s
- warmup : `isVeryShort` → **1 × 10** (l. 1018)
- core : **supprimé** (l. 1031)

**Total réel par séance : 3 slots + 1 warmup + 0 core = 4 exercices.**

`reorderSlotsByFocus` : `focused.size === 0` → retour identité (l. 692), ordre canonique conservé.
`level='intermediate'` → `pickExercise` renvoie un aléatoire du top-3 (l. 782–783) ; le top-3 est cité, le « retenu » indiqué est `candidates[0]` (issue la plus probable / référence déterministe).
`goal='strength'` + `slot.compound` → tri par `strengthEquipmentPrio` (l. 707–719, appliqué l. 769–772) : barbell(0) > machine/câble(1) > haltère/KB(2) > élastique(3) > BW/pullup(4).

### Tables des exercices

**Push (séance 1, warmupPool[0 % 16])**

| # | Slot muscles | Cat | Top-3 candidats (tri code) | Retenu (réf.) | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | seed-bird-dog | seed-bird-dog · Bird dog | 1×10 |
| 1 | chest / chest_upper / chest_lower | cmp | seed-bench-barbell(bb,8), seed-chest-press-machine(mach,3), seed-bench-dumbbell(db,3) | seed-bench-barbell · Développé couché barre | 2×3-5 (180 s) |
| 2 | shoulders / shoulders_front | cmp | seed-ohp-barbell(bb,3), seed-shoulder-press-machine(mach,3), seed-shoulder-press-dumbbell(db,3) | seed-ohp-barbell · Développé militaire barre | 2×3-5 (180 s) |
| 3 | chest / chest_upper / chest_lower | iso | seed-fly-dumbbell(2), seed-fly-cable(2), seed-pec-deck(2) | seed-fly-dumbbell · Écarté haltères | 2×5-8 (120 s) |
| c | core | — | — (supprimé, l. 1031) | — | — |

**Pull (séance 2, warmupPool[1])**

| # | Slot muscles | Cat | Top-3 candidats | Retenu (réf.) | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | seed-cat-cow | seed-cat-cow · Cat-Cow | 1×10 |
| 1 | back_width / back | cmp | seed-lat-pulldown(cable,3), seed-pullup(pu_bar,3), seed-deadlift(bb,3) | seed-lat-pulldown · Tirage vertical | 2×3-5 (180 s) |
| 2 | back_thickness / back | cmp | seed-row-barbell(bb,7), seed-row-tbar(bb,2), seed-row-cable(cable,2) | seed-row-barbell · Rowing barre | 2×3-5 (180 s) |
| 3 | back_thickness / back_width / back | iso | seed-pullover-dumbbell(3), seed-pullover-cable(2), seed-straight-arm-pulldown(2) | seed-pullover-dumbbell · Pull-over haltère | 2×5-8 (120 s) |
| c | core | — | — (supprimé) | — | — |

**Legs (séance 3, warmupPool[2])**

| # | Slot muscles | Cat | Top-3 candidats | Retenu (réf.) | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | seed-shoulder-circles | seed-shoulder-circles · Cercles d'épaules | 1×10 |
| 1 | quads | cmp | seed-squat-barbell(bb,8), seed-front-squat(bb,2), seed-leg-press(mach,3) | seed-squat-barbell · Squat barre | 2×3-5 (180 s) |
| 2 | hamstrings / glutes | cmp | seed-romanian-deadlift(bb,3), seed-good-morning(bb,1), dumbbell-rdl(db,2) | seed-romanian-deadlift · SDT jambes tendues | 2×3-5 (180 s) |
| 3 | quads | iso | seed-leg-extension(3), bw-wall-sit(2) *(pool = 2)* | seed-leg-extension · Leg extension | 2×5-8 (120 s) |
| c | core | — | — (supprimé) | — | — |

`generatorWarnings` : aucun (pas de force+débutant l. 1066, 3 types publics distincts l. 1083, push ET pull présents l. 1115).

### Assertions [PASS/FAIL]

| # | Assertion | Résultat | Ligne |
|---|---|---|---|
| 1 | `workoutTypeFromFocus([])` → null | ✅ PASS | 402 |
| 2 | Split auto = `['push','pull','legs']` | ✅ PASS | 553 |
| 3 | `adjustedSlotCount(6,20,'strength') = max(2,floor(3)) = 3` (×3 sessions) | ✅ PASS | 633 |
| 4 | **Total par session = 3 + warmup + core = 5 exercices** | ❌ **FAIL — 4 exercices** : le core est supprimé quand `sessionDuration ≤ 20` | 1017, 1031 |
| 5 | Warmup réduit à 1 série à 20 min | ✅ PASS (non prévu par le prompt, mais correct) | 1018 |
| 6 | `adjustedSpec(compound_strength, 20)` = 2 séries × 3-5 | ✅ PASS | 653–654 |
| 7 | `adjustedSpec(isolation_strength, 20)` = 2 séries × 5-8 | ✅ PASS | 654 |
| 8 | Barbell prioritaire sur les composés force | ✅ PASS (bench bb, OHP bb, squat bb, RDL bb) | 707–719 / 769–772 |
| 9 | **Note wizard « 20 min = 2 exercices » cohérente avec 3 slots calculés** | ❌ **FAIL — incohérence confirmée** | ProgramGeneratorScreen l. 310–311 |
| 10 | `autoProgress: true`, `progressStepKg: 2.5` sur les composés barre | ✅ PASS | 789–790 |

### ⚠️ Vérification de la note wizard (demande explicite)

Note affichée uniquement si `goal === 'strength'` (l. 297) :
> « Force : les repos de 3 min entre séries limitent le volume. 20 min = 2 exercices · 45 min = 3 exercices · 60 min = 4 exercices · 90 min = 5 exercices. » (l. 310–311)

Confrontation avec `adjustedSlotCount(base, duration, 'strength')` pour **toutes** les bases existantes :

| durée | note | base=6 (push/pull/legs/lower-quad/lower-hip) | base=7 (chest-tri) | base=8 (upper, upper-push/pull, shoulders-arms, back-bi, glutes-hip, quad-glutes) | base=9 (fullbody, lower_pull, lower_push, chest-back) | verdict |
|---|---|---|---|---|---|---|
| 20 | **2** | 3 | 3 | 4 | 4 | ❌ **jamais exact** — aucun template ne descend à 2 |
| 45 | **3** | 3 | 3 | 4 | 4 | ⚠️ exact seulement pour base ≤ 7 |
| 60 | **4** | 4 | 4 | 4 | 4 | ✅ exact partout |
| 90 | **5** | 5 | 5 | 5 | 5 | ✅ exact partout |

Deux conséquences :
1. **« 20 min = 2 exercices » est faux dans 100 % des cas** — le plancher `max(2, …)` n'est jamais atteint puisque `base ≥ 6` partout (`floor(6×0.5)=3`). Le minimum réel est 3, et 4 pour les templates base 8/9 (fullbody force débutant, upper/lower force, glutes-focus force).
2. **20 min et 45 min appliquent exactement la même formule en force** (`×0.5`, l. 633 et 634–635) : le nombre d'exercices est identique ; seules les **séries** changent (2 vs 3). La note laisse croire à une gradation 2/3/4/5 alors que le code produit 3/3/4/5 (base 6) ou 4/4/4/5 (base 8-9).
3. La note parle d'« exercices » alors que l'écran final affichera slots **+1 warmup** (+1 core au-dessus de 20 min) : à 60 min force l'utilisateur voit 6 lignes pour une note qui en annonce 4.

**Correctif recommandé :** rendre la note dynamique (calculée depuis `adjustedSlotCount` avec la base du split retenu), ou à défaut la corriger en « 20 min = 3 exercices · 45 min = 3-4 · 60 min = 4 · 90 min = 5 (+ échauffement, + gainage au-delà de 20 min) ».

### Coach

- **Équilibre musculaire :** push/pull/legs équilibré sur la semaine (1 poussée horizontale, 1 verticale, 1 tirage vertical, 1 horizontal, squat + charnière de hanche). Mais avec 3 slots seulement : **zéro bras, zéro mollets, zéro deltoïde postérieur, zéro core**. Sur 3 séances/semaine cela reste défendable en force (les bras travaillent en synergie), mais l'absence totale de face pull / deltoïde arrière sur un programme avec 2 pressions lourdes par semaine est un facteur de risque épaule à moyen terme.
- **Cohérence objectif :** 2×3-5 à 180 s de repos = specs de force correctes, mais **2 séries de travail par exercice, soit 4 séries lourdes par séance** = volume infra-minimal. En force, l'effet dose-réponse démarre vers 4-6 séries lourdes par pattern et par semaine ; ici on est à 2 séries/pattern/semaine. Progression réelle attendue : très lente, essentiellement neuromusculaire les 3-4 premières semaines puis plateau.
- **Timing réaliste :** 2 composés × 2 séries = 4 séries à 180 s + 1 isolation × 2 séries à 120 s.
  Travail ≈ 6 × 40 s = 4 min · repos ≈ 3×180 + 2×120 = 13 min · warmup 1 série ≈ 1 min · transitions ≈ 2 min → **≈ 20 min**. Le dimensionnement du code (3 slots) est **juste** ; c'est la note wizard qui sous-estime.
- **Équipement :** FULL exploité correctement, barre systématiquement prioritaire sur les composés (bench barre, OHP barre, squat barre, RDL barre) grâce à `strengthEquipmentPrio`. ⚠️ Réserve : `seed-chest-press-machine` et `seed-shoulder-press-machine` sont classés **au-dessus des haltères** (prio 1 vs 2) : un tirage aléatoire du top-3 peut donner une *presse poitrine machine en 2×3-5*, ce qui n'a aucun sens en force (pas de stabilisation, plafond de charge machine). La priorité machine/câble devrait passer **après** l'haltère pour les slots compound en force.
- **Variété inter-sessions :** 3 types distincts → ✅ variété structurelle complète.
- **Couverture isolation :** ❌ **Lacunes problématiques** — un seul slot isolation par séance (pec, dos, quadriceps). Biceps, triceps, mollets, deltoïdes latéral/postérieur, abdos : absents du programme entier.
- **Verdict global : ⚠️ Problème mineur côté code (le calcul de slots est sain et le timing tient), ❌ problème sérieux côté wizard** (note ℹ️ fausse) + réserve coach sur le volume total, structurellement insuffisant pour progresser en force.

---

## P61 — 20 min + hypertrophy + beginner 3j → fullbody 4 slots

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:20, equipment:FULL, level:'beginner' }
```

### Simulation

**Étape 1 —** `workoutTypeFromFocus([])` → `null` (l. 402).

**Étape 2 —** `selectSplit`, `case 3` : `isMass=true` mais `level==='beginner'` → les deux premiers `if` (l. 553, 555) échouent → retour ligne 557 :
**`['fullbody-quad','fullbody-hip','fullbody-quad']`**.
Noms : canon `fullbody` ×3 → suffixes A/B/C → « Full Body A » · « Full Body B » · « Full Body C » (l. 1039–1041).

**Étape 3 — `adjustedSlotCount`** (duration=20 → l. 633) :
- fullbody-quad : base=9 → `max(2, floor(9×0.5)) = max(2, floor(4.5)) = max(2,4) = **4**`
- fullbody-hip  : base=9 → `max(2, floor(4.5)) = **4**`
- fullbody-quad : **4**

Les 4 premiers slots des deux templates fullbody sont **tous compound** (l. 361–366 et 374–379) → **aucun slot isolation n'est atteint**.

**`adjustedSpec`** (factor 0.5) :
- compound hypertrophy `{4, 8-12, 90 s}` → `max(2, floor(4×0.5)) = max(2,2) = **2 × 8-12**, rest 90 s
- isolation hypertrophy `{3, 10-15, 75 s}` → `max(2, floor(1.5)) = **2 × 10-15**` — *jamais utilisé ici (aucun slot iso)*
- warmup 1×10 (l. 1018) · core supprimé (l. 1031)

**Total réel : 4 slots + 1 warmup = 5 exercices** par séance.

`level='beginner'` → `pickExercise` renvoie **toujours `candidates[0]`** (l. 781) → sélection déterministe.
`usedGlobally` (l. 773–775) départage avant la popularité → la séance C diffère de la séance A.

### Tables des exercices

**Full Body A — fullbody-quad (warmupPool[0])**

| # | Slot muscles | Cat | Exercice retenu (déterministe) | Séries×Reps |
|---|---|---|---|---|
| w | warmup | — | seed-bird-dog · Bird dog | 1×10 |
| 1 | quads / glutes | cmp | seed-squat-barbell · Squat barre (pop 8) | 2×8-12 (90 s) |
| 2 | chest / chest_upper | cmp | seed-bench-barbell · Développé couché barre (pop 8) | 2×8-12 |
| 3 | back_width / back_thickness / back | cmp | seed-lat-pulldown · Tirage vertical (pop 3, fichier < pullup) | 2×8-12 |
| 4 | shoulders / shoulders_front | cmp | seed-shoulder-press-dumbbell · Développé épaules haltères (pop 3, 1er du fichier) | 2×8-12 |
| c | core | — | — (supprimé, l. 1031) | — |

**Full Body B — fullbody-hip (warmupPool[1])**

| # | Slot muscles | Cat | Exercice retenu | Séries×Reps |
|---|---|---|---|---|
| w | warmup | — | seed-cat-cow · Cat-Cow | 1×10 |
| 1 | hamstrings / glutes | cmp | seed-romanian-deadlift · SDT jambes tendues | 2×8-12 |
| 2 | chest / chest_upper | cmp | seed-bench-dumbbell · Développé couché haltères *(bench barre pénalisé par `usedGlobally`)* | 2×8-12 |
| 3 | back_width / back | cmp | seed-pullup · Tractions *(lat pulldown déjà utilisé)* | 2×8-12 |
| 4 | shoulders / shoulders_front | cmp | seed-ohp-barbell · Développé militaire barre | 2×8-12 |
| c | core | — | — | — |

**Full Body C — fullbody-quad (warmupPool[2])**

| # | Slot muscles | Cat | Exercice retenu | Séries×Reps |
|---|---|---|---|---|
| w | warmup | — | seed-shoulder-circles · Cercles d'épaules | 1×10 |
| 1 | quads / glutes | cmp | seed-leg-press · Presse à cuisses *(squat déjà utilisé)* | 2×8-12 |
| 2 | chest / chest_upper | cmp | seed-chest-press-machine · Presse poitrine | 2×8-12 |
| 3 | back_width / back_thickness / back | cmp | seed-lat-pulldown · Tirage vertical *(les 2 candidats back_width sont utilisés → départage par popularité/ordre fichier)* | 2×8-12 |
| 4 | shoulders / shoulders_front | cmp | seed-shoulder-press-machine · Développé épaules machine | 2×8-12 |

`generatorWarnings` : aucun (débutant mais `daysPerWeek=3 < 5`, l. 1074 ; split non unilatéral ; pull présent).

### Assertions [PASS/FAIL]

| # | Assertion | Résultat | Ligne |
|---|---|---|---|
| 1 | Split = `['fullbody-quad','fullbody-hip','fullbody-quad']` (débutant, isMass ignoré) | ✅ PASS | 557 |
| 2 | `adjustedSlotCount(9,20,'hypertrophy') = max(2,floor(4.5)) = 4` | ✅ PASS | 633 |
| 3 | **Total = 4 + warmup + core = 6 exercices** | ❌ **FAIL — 5 exercices** (core supprimé à 20 min) | 1031 |
| 4 | `adjustedSpec(compound_hyp, 20)` = 2 séries × 8-12 | ✅ PASS | 653–654 |
| 5 | Warmup à 1 série | ✅ PASS | 1018 |
| 6 | Beginner → `candidates[0]` déterministe | ✅ PASS | 781 |
| 7 | Rotation d'exercices A→C via `usedGlobally` | ✅ PASS | 773–775 |
| 8 | Assertion transverse SLOT-FORCE20 (`max(2, floor(base×0.5))`) vérifiée aussi hors force | ✅ PASS (formule commune à tous les goals à 20 min) | 633 |
| 9 | Note wizard durée | n/a — non affichée (`goal !== 'strength'`) | ProgramGeneratorScreen l. 297 |

### Coach

- **Équilibre musculaire :** excellent pour un format 20 min — les 4 patterns fondamentaux (squat/charnière, poussée horizontale, tirage vertical, poussée verticale) sont couverts chaque séance. Sur la semaine : 2 séances quad-dominantes + 1 hip-dominante, 3 poussées horizontales, 3 tirages verticaux, 3 pressions verticales. ⚠️ **Aucun tirage horizontal** : le slot dos de `fullbody-quad` cible `back_width` en priorité (`slot.muscles[0]`, tri l. 763–767) et celui de `fullbody-hip` est explicitement `back_width` → le rowing n'apparaît **jamais** dans le programme complet. Déséquilibre scapulaire réel (lat dominant, rhomboïdes/trapèzes moyens jamais chargés) — d'autant que le slot `shoulders_rear` (position 6) est coupé par la durée.
- **Cohérence objectif :** 2×8-12 = specs d'hypertrophie correctes en reps, mais **2 séries par exercice**. Volume hebdo par groupe : pec 6 séries, dos 6, épaules 6, quads 4, ischios 2. Le seuil communément retenu pour l'hypertrophie est ~10 séries/muscle/semaine ; chez un **débutant**, 6 séries suffisent à déclencher des adaptations les 8 premières semaines — c'est donc **acceptable pour ce profil précis**, mais ce sera un plancher dès la semaine 8-10. Les ischios (2 séries/sem.) et les mollets/bras/abdos (0) sont clairement sacrifiés.
- **Timing réaliste :** 4 exercices × 2 séries = 8 séries, cycle ≈ 45 s travail + 90 s repos = 135 s → 18 min, − 1 repos final ≈ 16,5 min, + warmup 1 min + 3 transitions ≈ 2 min → **≈ 19-20 min. Parfaitement calibré.**
- **Équipement :** FULL exploité, mouvements canoniques (squat barre, bench barre) en séance A — idéal pour un débutant. Réserve : la séance C bascule sur **presse à cuisses + presse poitrine machine + développé épaules machine** à cause de la pénalité `usedGlobally` — une séance « tout machine » pour un débutant qui devrait au contraire répéter les patterns libres pour les automatiser. La variation forcée dessert l'apprentissage moteur à ce niveau.
- **Variété inter-sessions :** A et C = **mêmes slots, même ordre** → ⚠️ **variété d'exercices seulement** (structure identique). B est réellement différenciée (charnière de hanche en ouverture).
- **Couverture isolation :** ❌ **aucune isolation dans tout le programme** (les slots 5-9 sont coupés) + core supprimé. Pour un débutant hypertrophie à 20 min, les lacunes bras/mollets/abdos sont acceptables ; l'absence de **deltoïde postérieur** (slot 6 de fullbody-quad) l'est moins compte tenu des 3 pressions/semaine.
- **Verdict global : ⚠️ Problème mineur** — dimensionnement et timing exacts, mais (a) totaux du prompt d'audit faux (core supprimé), (b) aucun tirage horizontal sur l'ensemble du programme, (c) dérive « tout machine » en séance C.

---

## P62 — 45 min + strength + intermediate 3j → barème réduit

```
{ goal:'strength', daysPerWeek:3, sessionDuration:45, equipment:BB+DB, level:'intermediate' }
```

### Simulation

**Étape 1 —** `workoutTypeFromFocus([])` → `null` (l. 402).

**Étape 2 —** `selectSplit`, `case 3` : isMass=true, `level='intermediate'` → **`['push','pull','legs']`** (l. 553).
Noms sans suffixe : « Push — Poussée » · « Pull — Tirage » · « Legs — Jambes ».

**Étape 3 — `adjustedSlotCount`** (duration=45, `isStrength=true` → branche l. 634–635) :
- push : base=6 → `max(2, floor(6×0.5)) = max(2, floor(3)) = max(2,3) = **3**`
- pull : base=6 → **3**
- legs : base=6 → **3**

**`adjustedSpec`** (duration=45 → `factor = 0.75`, l. 653) :
- compound strength → `max(2, floor(5×0.75)) = max(2, floor(3.75)) = max(2,3) = **3 séries × 3-5**, rest 180 s
- isolation strength → `max(2, floor(3×0.75)) = max(2, floor(2.25)) = max(2,2) = **2 séries × 5-8**, rest 120 s
- `isVeryShort = false` → warmup **2×10**, core **3×15** (rest 60 s)

**Total réel : 3 slots + warmup + core = 5 exercices.**

Équipement BB+DB → `available` = barbell + dumbbell uniquement.
- warmupPool (l. 948–951, `allowed || bodyweight`) : 16 entrées (band exclu) → séances 0/1/2 → bird-dog / cat-cow / cercles d'épaules.
- corePool (l. 952–955) : 11 entrées (cable-crunch, hanging-leg-raise, turkish get-up exclus) → séances 0/1/2 → **seed-scissors / seed-crunch / seed-bicycle-crunch**.

### Tables des exercices

**Push (séance 1)**

| # | Slot muscles | Cat | Top-3 candidats (BB+DB, tri force) | Retenu (réf.) | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | — | seed-bird-dog · Bird dog | 2×10 |
| 1 | chest / chest_upper / chest_lower | cmp | seed-bench-barbell(bb,8), seed-bench-dumbbell(db,3), seed-incline-bench-barbell(bb,4) | seed-bench-barbell · Développé couché barre | 3×3-5 (180 s) |
| 2 | shoulders / shoulders_front | cmp | seed-ohp-barbell(bb,3), seed-shoulder-press-dumbbell(db,3), seed-arnold-press(db,2) | seed-ohp-barbell · Développé militaire barre | 3×3-5 |
| 3 | chest (iso) | iso | **1 seul candidat** : seed-fly-dumbbell(2) | seed-fly-dumbbell · Écarté haltères | 2×5-8 (120 s) |
| c | core | — | — | seed-scissors · Ciseaux abdominaux | 3×15 |

**Pull (séance 2)**

| # | Slot muscles | Cat | Top-3 candidats | Retenu (réf.) | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | — | seed-cat-cow · Cat-Cow | 2×10 |
| 1 | back_width / back | cmp | **1 seul candidat** : seed-deadlift(bb,3) — aucun tirage vertical en BB+DB (lat pulldown=câble, traction=barre fixe) | seed-deadlift · Soulevé de terre | 3×3-5 (180 s) |
| 2 | back_thickness / back | cmp | seed-row-barbell(bb,7), seed-row-tbar(bb,2), seed-row-dumbbell(db,3) | seed-row-barbell · Rowing barre | 3×3-5 |
| 3 | back_thickness / back_width / back | iso | seed-pullover-dumbbell(3), seed-shrug(2), seed-pullover(1) | seed-pullover-dumbbell · Pull-over haltère | 2×5-8 |
| c | core | — | — | seed-crunch · Crunch | 3×15 |

**Legs (séance 3)**

| # | Slot muscles | Cat | Top-3 candidats | Retenu (réf.) | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | — | seed-shoulder-circles · Cercles d'épaules | 2×10 |
| 1 | quads | cmp | seed-squat-barbell(bb,8), seed-front-squat(bb,2), seed-lunges(db,2) | seed-squat-barbell · Squat barre | 3×3-5 (180 s) |
| 2 | hamstrings / glutes | cmp | seed-romanian-deadlift(bb,3), seed-good-morning(bb,1), dumbbell-rdl(db,2) | seed-romanian-deadlift · SDT jambes tendues | 3×3-5 |
| 3 | quads | iso | ⚠️ **aucune isolation quads en BB+DB** → repli compound (l. 748–751) : seed-lunges(2), seed-front-squat(2), seed-bulgarian-split-squat(2) | seed-lunges · Fentes | **2×5-8** (spec isolation appliquée à un composé) |
| c | core | — | — | seed-bicycle-crunch · Crunch bicyclette | 3×15 |

`generatorWarnings` : aucun.

### Assertions [PASS/FAIL]

| # | Assertion | Résultat | Ligne |
|---|---|---|---|
| 1 | Split = `['push','pull','legs']` | ✅ PASS | 553 |
| 2 | `adjustedSlotCount(6,45,'strength') = max(2,floor(3)) = 3` | ✅ PASS | 634–635 |
| 3 | `adjustedSpec(compound_strength,45)` = 3 séries × 3-5 | ✅ PASS | 653–654 |
| 4 | `adjustedSpec(isolation_strength,45)` = 2 séries × 5-8 | ✅ PASS | 654 |
| 5 | Total = 3 + warmup + core = 5 exercices | ✅ PASS (45 > 20 → core conservé) | 1017, 1031 |
| 6 | Note wizard « 45 min = 3 exercices » cohérente **pour base=6** | ✅ PASS partiel | Screen l. 311 |
| 7 | Note wizard « 45 min = 3 exercices » **universellement exacte** | ❌ **FAIL** — base 8/9 (upper/lower, fullbody, glutes-focus) donne `floor(8×0.5)=4` / `floor(9×0.5)=4` | 634–635 vs Screen l. 311 |
| 8 | 20 min et 45 min produisent le **même** nombre de slots en force | ✅ PASS (constat) — formules identiques `×0.5` | 633 vs 634–635 |
| 9 | Barbell prioritaire sur tous les composés | ✅ PASS | 707–719 |
| 10 | Slot `back_width` couvert en BB+DB | ❌ **FAIL fonctionnel** — aucun candidat `back_width` compound ; repli sur `seed-deadlift` (via `back`). Pas de warning émis car le slot est rempli. | 738–746 |

### Coach

- **Équilibre musculaire :** correct sur les patterns lourds (bench, OHP, deadlift, row, squat, RDL = les 6 mouvements de base). ⚠️ **Aucun tirage vertical de la semaine** : en BB+DB le slot `back_width` tombe sur le soulevé de terre, si bien que la séance Pull enchaîne **deadlift + rowing barre** — deux charnières de hanche lourdes en 3×3-5 le même jour, alors que la séance Legs remet **squat + RDL** 48 h plus tard. Charge lombaire cumulée très élevée : c'est le vrai défaut de ce profil.
- **Cohérence objectif :** 3×3-5 à 180 s = force pure, cohérent. 3 séries lourdes par pattern et par semaine : c'est le minimum syndical mais **fonctionnel** pour un intermédiaire (proche d'un 5×5 allégé). Bien meilleur que P60.
- **Timing réaliste :** 2 composés × 3 séries = 6 séries à 180 s (≈ 6×45 s travail + 5×180 s repos ≈ 19,5 min) + 1 isolation × 2 séries (≈ 3,5 min) + warmup 2 séries (≈ 2 min) + core 3×15 (≈ 4 min) + 4 transitions (≈ 4 min) → **≈ 33 min pour un créneau de 45 min**. Le barème force à 45 min est **trop conservateur** : il resterait la place pour un 4ᵉ slot (~+8 min) ou une 4ᵉ série sur les composés. C'est le pendant du problème de P60 : à 20 min le code est juste et la note fausse ; à 45 min le code sous-remplit le créneau.
- **Équipement :** BB+DB bien exploité (barre partout sur les composés). Deux limites du seed plus que du générateur : une seule isolation pectorale disponible (écarté haltères) et **zéro isolation quadriceps** → le slot 3 de Legs se remplit avec des **fentes en 2×5-8** (spec isolation collée sur un exercice composé, l. 991 `slot.compound ? COMPOUND : ISOLATION`). Fentes lourdes en 5-8 reps après squat + RDL : discutable mais pas absurde.
- **Variété inter-sessions :** ✅ 3 types distincts, variété structurelle.
- **Couverture isolation :** ⚠️ **lacunes acceptables** — 1 isolation par séance (pec / dos / quads « fentes »). Bras, mollets, deltoïdes latéral et postérieur absents ; acceptable en force pure sur un créneau de 45 min, mais l'absence de travail deltoïde postérieur reste une réserve posturale.
- **Verdict global : ⚠️ Problème mineur** — code conforme à sa spec, mais (a) note wizard inexacte pour les templates base ≥ 8, (b) créneau 45 min sous-exploité (~12 min inutilisées), (c) enchaînement deadlift + rowing lourd le même jour en BB+DB.

---

## P63 — 90 min + hypertrophy + intermediate 4j → cap 8 slots

```
{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:90, equipment:FULL, level:'intermediate' }
```

### Simulation

**Étape 1 —** `workoutTypeFromFocus([])` → `null` (l. 402).

**Étape 2 —** `selectSplit`, `case 4` : `isMass=true` → **`['upper-push','lower-quad','upper-pull','lower-hip']`** (l. 561, condition `if (isMass)` sans test de niveau).
Noms : canon `upper` ×2 et `lower` ×2 → suffixes → « Upper — Haut du corps **A** » · « Lower — Bas du corps **A** » · « Upper — Haut du corps **B** » · « Lower — Bas du corps **B** » (l. 1039–1041).

**Étape 3 — `adjustedSlotCount`** (duration=90, non-force → l. 643 `min(base+2, 8)`) :
- upper-push : base=8 → `min(8+2, 8) = min(10,8) = **8**` → `slice(0,8)` sur 8 slots → **8 slots effectifs**
- lower-quad : base=6 → `min(6+2, 8) = **8**` → `slice(0,8)` sur un tableau de **6** → **6 slots effectifs** (l. 985, `slice` borne naturellement)
- upper-pull : base=8 → **8** → 8 slots effectifs
- lower-hip  : base=6 → **8** → **6 slots effectifs**

**`adjustedSpec`** : duration=90 → **retour inchangé** (l. 652) :
- compound hypertrophy = **4 × 8-12**, rest 90 s
- isolation hypertrophy = **3 × 10-15**, rest 75 s
- warmup 2×10 · core 3×15 (`isVeryShort=false`)

**Totaux :** Upper A = 8 + 2 = **10 exercices** · Lower A = 6 + 2 = **8** · Upper B = **10** · Lower B = **8**.

`level='intermediate'` → aléatoire dans le top-3 (l. 782–783) ; le « retenu » cité est `candidates[0]`, et les sessions C/D sont simulées avec cette hypothèse (l'effet `usedGlobally` est réel quel que soit le tirage).
warmupPool FULL séances 0-3 → bird-dog / cat-cow / cercles d'épaules / dead-bug.
corePool FULL séances 0-3 → seed-scissors / seed-crunch / seed-cable-crunch / seed-bicycle-crunch.

### Tables des exercices

**Upper A — upper-push (8 slots)**

| # | Slot muscles | Cat | Top-3 candidats | Retenu (réf.) | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | — | seed-bird-dog | 2×10 |
| 1 | chest / chest_upper | cmp | bench-barbell(8), bench-dumbbell(3), chest-press-machine(3) | seed-bench-barbell | 4×8-12 (90 s) |
| 2 | back_width / back_thickness / back | cmp | lat-pulldown(3), pullup(3), row-barbell(7)* | seed-lat-pulldown | 4×8-12 |
| 3 | shoulders / shoulders_front | cmp | shoulder-press-dumbbell(3), ohp-barbell(3), shoulder-press-machine(3) | seed-shoulder-press-dumbbell | 4×8-12 |
| 4 | chest / chest_lower / chest_upper | iso | fly-dumbbell(2), fly-cable(2), pec-deck(2) | seed-fly-dumbbell | 3×10-15 (75 s) |
| 5 | triceps | iso | triceps-rope(3), triceps-pushdown(3), skullcrusher(2) | seed-triceps-rope | 3×10-15 |
| 6 | shoulders_lateral | iso | lateral-raise(3), lateral-raise-cable(2) *(pool=2)* | seed-lateral-raise | 3×10-15 |
| 7 | biceps | iso | curl-barbell(3), curl-dumbbell(3), curl-hammer(3) | seed-curl-barbell | 3×10-15 |
| 8 | back_thickness / back | iso | pullover-dumbbell(3), pullover-cable(2), straight-arm-pulldown(2) | seed-pullover-dumbbell | 3×10-15 |
| c | core | — | — | seed-scissors | 3×15 |

\* `row-barbell` (pop 7) passe **derrière** lat-pulldown/pullup (pop 3) car `slot.muscles[0]='back_width'` prime sur la popularité (tri l. 763–767).

**Lower A — lower-quad (6 slots — les 2 slots « bonus » du barème 90 min sont perdus)**

| # | Slot muscles | Cat | Top-3 candidats | Retenu (réf.) | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | — | seed-cat-cow | 2×10 |
| 1 | quads / glutes | cmp | squat-barbell(8), leg-press(3), bw-squat(3) | seed-squat-barbell | 4×8-12 |
| 2 | hamstrings / glutes | cmp | romanian-deadlift(3), bw-nordic-curl(2), dumbbell-rdl(2) | seed-romanian-deadlift | 4×8-12 |
| 3 | quads | iso | leg-extension(3), bw-wall-sit(2) *(pool=2)* | seed-leg-extension | 3×10-15 |
| 4 | hamstrings | iso | leg-curl-lying(3), leg-curl-seated(2), leg-curl-standing(2) | seed-leg-curl-lying | 3×10-15 |
| 5 | glutes | iso | glute-bridge(3), donkey-kick(2), fire-hydrant(2) | seed-glute-bridge | 3×10-15 |
| 6 | calves | iso | calf-raise-seated(2), calf-raise-standing(2), bw-calf-raise(2) | seed-calf-raise-seated | 3×10-15 |
| c | core | — | — | seed-crunch | 3×15 |

**Upper B — upper-pull (8 slots)**

| # | Slot muscles | Cat | Top-3 candidats (après pénalité `usedGlobally`) | Retenu (réf.) | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | — | seed-shoulder-circles | 2×10 |
| 1 | back_width / back | cmp | pullup(3, inutilisé), lat-pulldown(3, utilisé), deadlift(3) | seed-pullup | 4×8-12 |
| 2 | back_thickness / back | cmp | row-barbell(7), row-dumbbell(3), row-tbar(2) | seed-row-barbell | 4×8-12 |
| 3 | chest / chest_upper | cmp | bench-dumbbell(3), chest-press-machine(3), pushup(2) | seed-bench-dumbbell | 4×8-12 |
| 4 | shoulders_rear | iso | face-pull(2), rear-delt-fly(2) *(pool=2)* | seed-face-pull | 3×10-15 |
| 5 | biceps | iso | curl-dumbbell(3), curl-hammer(3), curl-incline(2) | seed-curl-dumbbell | 3×10-15 |
| 6 | back_thickness / back | iso | pullover-cable(2), straight-arm-pulldown(2), pullover-dumbbell(3, utilisé) | seed-pullover-cable | 3×10-15 |
| 7 | triceps | iso | triceps-pushdown(3), skullcrusher(2), triceps-overhead(2) | seed-triceps-pushdown | 3×10-15 |
| 8 | shoulders_lateral | iso | lateral-raise-cable(2), lateral-raise(3, utilisé) *(pool=2)* | seed-lateral-raise-cable | 3×10-15 |
| c | core | — | — | seed-cable-crunch | 3×15 |

**Lower B — lower-hip (6 slots)**

| # | Slot muscles | Cat | Top-3 candidats | Retenu (réf.) | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | — | seed-dead-bug | 2×10 |
| 1 | glutes / hamstrings | cmp | hip-thrust(4), hip-thrust-bw(3), hip-thrust-machine(3) | seed-hip-thrust | 4×8-12 |
| 2 | quads / glutes | cmp | leg-press(3), bw-squat(3), lunges(2) *(squat barre pénalisé)* | seed-leg-press | 4×8-12 |
| 3 | glutes | iso | donkey-kick(2), fire-hydrant(2), hip-abduction(2) | seed-donkey-kick | 3×10-15 |
| 4 | hamstrings | iso | leg-curl-seated(2), leg-curl-standing(2), leg-curl-lying(3, utilisé) | seed-leg-curl-seated | 3×10-15 |
| 5 | quads | iso | bw-wall-sit(2), leg-extension(3, utilisé) *(pool=2)* | bw-wall-sit | 3×10-15 |
| 6 | calves | iso | calf-raise-standing(2), bw-calf-raise(2), calf-raise-db(2) | seed-calf-raise-standing | 3×10-15 |
| c | core | — | — | seed-bicycle-crunch | 3×15 |

`generatorWarnings` : aucun.

### Assertions [PASS/FAIL]

| # | Assertion | Résultat | Ligne |
|---|---|---|---|
| 1 | Split = `['upper-push','lower-quad','upper-pull','lower-hip']` | ✅ PASS | 561 |
| 2 | `adjustedSlotCount(8,90,'hypertrophy') = min(10,8) = 8` | ✅ PASS | 643 |
| 3 | `adjustedSlotCount(6,90,'hypertrophy') = min(8,8) = 8` mais effectif = 6 | ✅ PASS | 643 + 985 |
| 4 | `slice(0, adjusted)` borne sans erreur quand `adjusted > slots.length` | ✅ PASS (sémantique de `Array.slice`) | 985 |
| 5 | Total upper-push = 8 + warmup + core = 10 exercices | ✅ PASS | 1021–1035 |
| 6 | Total lower-quad = 6 + warmup + core = 8 exercices | ✅ PASS | — |
| 7 | `adjustedSpec(·, 90)` inchangé (4×8-12 / 3×10-15) | ✅ PASS | 652 |
| 8 | Noms Upper A/B et Lower A/B (suffixe par type **public**) | ✅ PASS | 1039–1041 + 117–127 |
| 9 | Note wizard durée | n/a — non affichée (`goal !== 'strength'`) | Screen l. 297 |
| 10 | **90 min apporte plus de contenu que 60 min sur les séances Lower** | ❌ **FAIL** — `adjustedSlotCount(6,60,'hypertrophy') = base = 6` et `(6,90) = 6` effectifs, `adjustedSpec` identique à 60 et 90 → **séances Lower strictement identiques en 60 et 90 min** | 639 vs 643, 652 |

### Coach

- **Équilibre musculaire :** ✅ excellent. Fréquence 2×/semaine par groupe (upper A/B, lower A/B), alternance bench-first / traction-first en haut, squat-dominant / hip-dominant en bas. Ratio push/pull sur la semaine : 4 slots poussée (bench, OHP, fly, bench DB) vs 5 slots tirage (lat pulldown, pullup, row, 2 isolations dos) + face pull → ratio favorable au tirage, idéal pour la santé d'épaule. Mollets, fessiers, ischios, bras, deltoïdes latéraux et postérieurs : tous couverts.
- **Cohérence objectif :** 4×8-12 (composés) / 3×10-15 (isolations) = specs d'hypertrophie canoniques. Volume hebdo : pec ≈ 11 séries, dos ≈ 20, quads ≈ 10, ischios ≈ 10, fessiers ≈ 10, biceps 6, triceps 6, deltoïdes 4+6. **Volume dos très élevé (~20 séries)** par rapport au pec (~11) — c'est un choix défendable (posture) mais l'écart est important pour un intermédiaire.
- **Timing réaliste :** Upper A = 3 composés × 4 + 5 isolations × 3 = **27 séries de travail**.
  Cycle composé ≈ 45 s + 90 s = 135 s → 12 séries ≈ 27 min. Cycle isolation ≈ 40 s + 75 s = 115 s → 15 séries ≈ 29 min. + warmup 2 séries ≈ 2 min + core 3×15 ≈ 4 min + 9 transitions/installations ≈ 9-12 min → **≈ 72-75 min pour un créneau de 90 min : ça tient** (l'estimation « 96 min » du prompt d'audit surestime, elle compte 4 min/série ce qui correspond au barème force, pas à un repos de 90 s).
  Lower A = 2 composés × 4 + 4 isolations × 3 = 20 séries → ≈ 18 + 23 + 6 + 7 = **≈ 54 min**. → **~36 min de créneau inutilisées les jours Lower.**
- **⚠️ Anomalie structurelle majeure du profil :** le barème 90 min (`min(base+2, 8)`) n'a d'effet que sur les templates de base 6 ou 7 **dont le tableau `SLOTS` contient plus d'entrées** — or `lower-quad` et `lower-hip` n'ont **que 6 entrées**. Le bonus « +2 » est donc structurellement inatteignable : passer de 60 à 90 min ne change **rien** aux séances Lower (mêmes 6 slots, mêmes séries — `adjustedSpec` est identité à 60 et 90). L'utilisateur paie 30 min de plus pour un contenu identique. Même constat pour tout template base 6 en non-force (`push`, `pull`, `legs`). **Correctif : allonger les tableaux `SLOTS['lower-quad']`/`['lower-hip']`/`['push']`/`['pull']`/`['legs']` à 8 entrées, ou augmenter les séries à 90 min (ex. `+1 série` sur les composés).**
- **Équipement :** FULL bien exploité, mix barre/haltère/poulie/machine cohérent en hypertrophie (contrairement à la force, aucune priorité d'équipement n'est appliquée ici — c'est correct pour ce goal).
- **Variété inter-sessions :** ✅ **variété structurelle réelle** — upper-push et upper-pull ont des slots et un ordre différents ; lower-quad et lower-hip aussi. La pénalité `usedGlobally` évite en plus la répétition d'exercices entre A et B.
- **Couverture isolation :** ✅ **complète** — chaque groupe (pec, dos, deltoïde latéral, deltoïde postérieur, biceps, triceps, quads, ischios, fessiers, mollets, abdos) dispose d'au moins un slot isolation sur la semaine. Seuls les avant-bras n'ont pas de slot dédié : lacune acceptable.
- **Verdict global : ✅ Bon programme**, avec **⚠️ une réserve produit sérieuse** : le créneau 90 min n'est honoré que sur les séances Upper ; les séances Lower sont identiques à leur version 60 min.

---

## P64 — 20 min + glutes-focus explicite + beginner + fat_loss

```
{ goal:'fat_loss', daysPerWeek:3, sessionDuration:20, equipment:FULL, level:'beginner',
  splitPreference:'glutes-focus' }
```

### Simulation

**Étape 1 —** split explicite → l'étape Muscles du wizard est sautée, `focusMuscles = []` → `workoutTypeFromFocus([])` → `null` (l. 402). *Note : avec `pref='glutes-focus'`, `selectSplit` retourne avant même d'appeler `workoutTypeFromFocus` (l. 487 vs l. 500) — le focus est donc doublement inopérant.*

**Étape 2 —** `selectSplit`, `pref='glutes-focus'`, `case 3` → **`['glutes-hip','quad-glutes','glutes-hip']`** (l. 492).
`toPublicType` : `glutes-hip` et `quad-glutes` → **`'lower'`** (l. 125) → canon unique compté 3 fois → suffixes A/B/C :
« Glutes & Hip — Fessiers & Ischio **A** » · « Quad & Glutes — Jambes & Fessiers **B** » · « Glutes & Hip — Fessiers & Ischio **C** » (l. 1039–1041).

**Étape 3 — `adjustedSlotCount`** (duration=20 → l. 633) :
- glutes-hip  : base=8 → `max(2, floor(8×0.5)) = max(2, floor(4)) = max(2,4) = **4**`
- quad-glutes : base=8 → `max(2, floor(4)) = **4**`
- glutes-hip  : **4**

**`adjustedSpec`** (factor 0.5) :
- compound fat_loss `{3, 12-15, 60 s}` → `max(2, floor(3×0.5)) = max(2, floor(1.5)) = max(2,1) = **2 × 12-15**, rest 60 s
- isolation fat_loss `{3, 12-15, 60 s}` → `max(2, floor(1.5)) = **2 × 12-15**, rest 60 s
- warmup **1×10** (l. 1018) · core **supprimé** (l. 1031)

**Total réel : 4 slots + 1 warmup = 5 exercices** par séance.

Découpe des slots : `glutes-hip` positions 1-4 = **4 composés** (glutes/ham, ham/glutes, quads/glutes, back_width) ; `quad-glutes` positions 1-4 = 3 composés + 1 isolation quads.
`level='beginner'` → `candidates[0]` déterministe (l. 781).

### Tables des exercices

**Glutes & Hip A — glutes-hip (warmupPool[0])**

| # | Slot muscles | Cat | Exercice retenu (déterministe) | Séries×Reps |
|---|---|---|---|---|
| w | warmup | — | seed-bird-dog · Bird dog | 1×10 |
| 1 | glutes / hamstrings | cmp | seed-hip-thrust · Hip thrust (barre, pop 4) | 2×12-15 (60 s) |
| 2 | hamstrings / glutes | cmp | seed-romanian-deadlift · SDT jambes tendues | 2×12-15 |
| 3 | quads / glutes | cmp | seed-squat-barbell · Squat barre | 2×12-15 |
| 4 | back_width / back | cmp | seed-lat-pulldown · Tirage vertical | 2×12-15 |
| c | core | — | — (supprimé, l. 1031) | — |

**Quad & Glutes B — quad-glutes (warmupPool[1])**

| # | Slot muscles | Cat | Exercice retenu | Séries×Reps |
|---|---|---|---|---|
| w | warmup | — | seed-cat-cow · Cat-Cow | 1×10 |
| 1 | quads / glutes | cmp | seed-leg-press · Presse à cuisses *(squat pénalisé par `usedGlobally`)* | 2×12-15 |
| 2 | glutes / hamstrings | cmp | seed-hip-thrust-bw · Hip thrust poids du corps | 2×12-15 |
| 3 | back_thickness / back | cmp | seed-row-barbell · Rowing barre | 2×12-15 |
| 4 | quads | iso | seed-leg-extension · Leg extension | 2×12-15 |
| c | core | — | — | — |

**Glutes & Hip C — glutes-hip (warmupPool[2])**

| # | Slot muscles | Cat | Exercice retenu | Séries×Reps |
|---|---|---|---|---|
| w | warmup | — | seed-shoulder-circles · Cercles d'épaules | 1×10 |
| 1 | glutes / hamstrings | cmp | seed-hip-thrust-machine · Hip thrust machine *(hip-thrust et hip-thrust-bw utilisés)* | 2×12-15 |
| 2 | hamstrings / glutes | cmp | ⚠️ **bw-nordic-curl · Nordic curl** *(RDL utilisé ; nordic pop 2 passe devant dumbbell-rdl par ordre fichier)* | 2×12-15 |
| 3 | quads / glutes | cmp | bw-squat · Squat poids du corps | 2×12-15 |
| 4 | back_width / back | cmp | ⚠️ **seed-pullup · Tractions** *(lat pulldown utilisé)* | 2×12-15 |
| c | core | — | — | — |

`generatorWarnings` (l. 1082–1091) : `publicTypes = {'lower'}` (taille 1) → **1 warning émis** :
> « Programme de spécialisation : toutes les séances ciblent le même groupe. Convient pour un bloc court (4–6 semaines) mais ne constitue pas un programme complet. »
(Pas de warning push/pull : `hasPushSession=false` → la condition l. 1115 exige `hasPushSession && !hasPullSession`.)

### Assertions [PASS/FAIL]

| # | Assertion | Résultat | Ligne |
|---|---|---|---|
| 1 | Split = `['glutes-hip','quad-glutes','glutes-hip']` | ✅ PASS | 492 |
| 2 | `adjustedSlotCount(8,20,'fat_loss') = max(2,floor(4)) = 4` (glutes-hip **et** quad-glutes) | ✅ PASS | 633 |
| 3 | **Total = 4 + warmup + core = 6 exercices** | ❌ **FAIL — 5 exercices** (core supprimé à 20 min) | 1031 |
| 4 | `adjustedSpec(compound_fat_loss,20)` = 2 séries × 12-15 | ✅ PASS | 653–654 |
| 5 | `adjustedSpec(isolation_fat_loss,20)` = 2 séries × 12-15 | ✅ PASS | 654 |
| 6 | Assertion GLUTES-SLOTS : zéro slot push (pec / OHP / triceps) | ✅ PASS | 331–355 |
| 7 | Nommage A/B/C sur le canon `'lower'` commun aux deux templates | ✅ PASS | 125 + 1039–1041 |
| 8 | Warning « Programme de spécialisation » émis | ✅ PASS | 1083–1091 |
| 9 | Note wizard durée | n/a — non affichée (`goal !== 'strength'`) | Screen l. 297 |
| 10 | Slot `back_width` rempli avec FULL (`seed-pullup` disponible) | ✅ PASS (lat pulldown en A, traction en C) | 738–746 |

### Coach

- **Équilibre musculaire :** conforme à l'intention du template (fessiers/ischios prioritaires, dos en soutien postural, zéro poussée). Sur la semaine : fessiers touchés dans **7 des 12 slots**, ischios 3, quads 3, dos 2. C'est un programme de spécialisation assumé — le warning l. 1086 le dit. Mais à 20 min, la coupe à 4 slots supprime **toutes les isolations fessiers** de `glutes-hip` (hip abduction, kickback) : le programme devient « 3-4 gros composés » et perd précisément ce qui fait la valeur d'un programme fessiers (le travail d'abduction/extension isolée en fin de séance). Paradoxe : le template le plus orienté isolation est celui qui perd le plus à la troncature.
- **Cohérence objectif fat_loss :** 2×12-15 à 60 s de repos = bon format métabolique. Mais **8 séries de travail par séance, 24/semaine, sans aucun cardio** : le générateur ne place jamais d'exercice `primaryMuscle: 'cardio'` (burpees, corde à sauter, rameur existent pourtant dans le seed) car aucun slot ne cible ce muscle. Pour un objectif fat_loss, c'est la lacune de fond — la dépense énergétique du programme est marginale (~3×20 min/semaine).
- **Timing réaliste :** 4 exercices × 2 séries = 8 séries, cycle ≈ 40 s + 60 s = 100 s → 13 min − dernier repos ≈ 12 min, + warmup 1 min + 3 transitions ≈ 3 min → **≈ 17-18 min. Calibrage correct** (il resterait même la place pour le core supprimé).
- **Équipement :** FULL, cohérent. ⚠️ **Deux choix inadaptés au niveau débutant en séance C**, tous deux causés par la pénalité `usedGlobally` (l. 773–775) : **Nordic curl** (un des exercices les plus durs du répertoire ischios, excentrique lourd — inaccessible à un débutant) et **tractions** en 2×12-15 (une débutante en programme fessiers ne fera pas 12-15 tractions). Le générateur n'a aucun garde-fou de difficulté : `usedGlobally` prime sur la popularité, donc plus il y a de séances du même type, plus les exercices retenus sont exotiques. **Correctif recommandé : pondérer la pénalité `usedGlobally` par la popularité (ex. ne pas déclasser un exercice pop ≥ 3 au profit d'un pop ≤ 2), ou introduire un champ `difficulty` filtré par `level`.**
- **Variété inter-sessions :** A et C = mêmes slots, même ordre → ⚠️ **variété d'exercices seulement**. B est structurellement différente (squat-first + rowing).
- **Couverture isolation :** ❌ **lacunes problématiques pour ce type de programme** — une seule isolation dans toute la semaine (leg extension, séance B). Zéro isolation fessiers, zéro ischios isolés, zéro abdos (core supprimé) — sur un programme dont c'est la raison d'être.
- **Verdict global : ⚠️ Problème mineur côté code** (calculs et timing exacts) **mais ❌ inadéquation produit** : glutes-focus à 20 min perd sa spécificité (0 isolation fessiers) et sert du Nordic curl / des tractions à une débutante. **Recommandation produit : afficher un avertissement quand `splitPreference='glutes-focus'` est combiné à `sessionDuration=20`, ou réordonner les templates féminins pour placer au moins une isolation fessiers dans les 4 premiers slots.**

---

## P65 — 45 min + fullbody explicite + fat_loss + beginner (HOME, 2j)

```
{ goal:'fat_loss', daysPerWeek:2, sessionDuration:45, equipment:HOME, level:'beginner',
  splitPreference:'fullbody' }
```

### Simulation

**Étape 1 —** split explicite → `focusMuscles = []` → `workoutTypeFromFocus([])` → `null` (l. 402) ; de nouveau non atteint, `selectSplit` sort en l. 478–485 avant la logique auto.

**Étape 2 —** `selectSplit`, `pref='fullbody'`, `case 2` → **`['fullbody-quad','fullbody-hip']`** (l. 480).
Noms : canon `fullbody` ×2 → « Full Body **A** » · « Full Body **B** ».

**Étape 3 — `adjustedSlotCount`** (duration=45, `goal='fat_loss'` → branche non-force l. 636) :
- fullbody-quad : base=9 → `max(3, floor(9×0.75)) = max(3, floor(6.75)) = max(3,6) = **6**`
- fullbody-hip  : base=9 → `max(3, floor(6.75)) = **6**`

**`adjustedSpec`** (duration=45 → `factor = 0.75`) :
- compound fat_loss `{3, 12-15, 60 s}` → `max(2, floor(3×0.75)) = max(2, floor(2.25)) = max(2,2) = **2 × 12-15**, rest 60 s
- isolation fat_loss `{3, 12-15, 60 s}` → `max(2, floor(2.25)) = **2 × 12-15**, rest 60 s
- `isVeryShort=false` → warmup **2×10**, core **3×15**

**Total réel : 6 slots + warmup + core = 8 exercices** par séance.

Slots retenus (6 premiers) :
- `fullbody-quad` : quads/glutes cmp · chest cmp · back cmp · OHP cmp · **hamstrings iso** · **shoulders_rear iso** (biceps, mollets, triceps coupés)
- `fullbody-hip` : ham/glutes cmp · chest cmp · back_width cmp · OHP cmp · **quads iso** · **shoulders_lat/rear iso**

HOME = `['dumbbell','kettlebell','band','bodyweight']` → ni barre, ni poulie, ni machine, ni barre de traction.
- warmupPool HOME : **18 entrées** (band autorisé) → séance 0 → `seed-band-pull-apart`, séance 1 → `seed-bird-dog`.
- corePool HOME : 12 entrées (cable-crunch et hanging-leg-raise exclus, turkish get-up inclus) → séance 0 → `seed-scissors`, séance 1 → `seed-crunch`.
`level='beginner'` → `candidates[0]` (l. 781).

### Tables des exercices

**Full Body A — fullbody-quad (warmupPool[0])**

| # | Slot muscles | Cat | Exercice retenu (déterministe, HOME) | Séries×Reps |
|---|---|---|---|---|
| w | warmup | — | seed-band-pull-apart · Band pull-apart | 2×10 |
| 1 | quads / glutes | cmp | seed-goblet-squat · Goblet squat (KB, pop 3) | 2×12-15 (60 s) |
| 2 | chest / chest_upper | cmp | seed-bench-dumbbell · Développé couché haltères | 2×12-15 |
| 3 | back_width / back_thickness / back | cmp | seed-row-dumbbell · Rowing haltère *(aucun candidat `back_width` compound en HOME → repli sur back_thickness via le tri)* | 2×12-15 |
| 4 | shoulders / shoulders_front | cmp | seed-shoulder-press-dumbbell · Développé épaules haltères | 2×12-15 |
| 5 | hamstrings | iso | ⚠️ **kb-rdl · SDT kettlebell jambes tendues** — aucune isolation ischios en HOME → repli compound (l. 748–751), **spec isolation appliquée** | 2×12-15 |
| 6 | shoulders_rear | iso | seed-rear-delt-fly · Oiseau buste penché | 2×12-15 |
| c | core | — | seed-scissors · Ciseaux abdominaux | 3×15 |

**Full Body B — fullbody-hip (warmupPool[1])**

| # | Slot muscles | Cat | Exercice retenu | Séries×Reps |
|---|---|---|---|---|
| w | warmup | — | seed-bird-dog · Bird dog | 2×10 |
| 1 | hamstrings / glutes | cmp | dumbbell-rdl · SDT jambes tendues haltères *(kb-rdl pénalisé par `usedGlobally`)* | 2×12-15 |
| 2 | chest / chest_upper | cmp | seed-pushup · Pompes *(bench DB utilisé)* | 2×12-15 |
| 3 | back_width / back | cmp | ⚠️ **kb-deadlift · Soulevé de terre kettlebell** — seul composé du slot en HOME (`back_width` vide, `back` → kb-deadlift). **Aucun tirage dans la séance B.** | 2×12-15 |
| 4 | shoulders / shoulders_front | cmp | seed-arnold-press · Développé Arnold | 2×12-15 |
| 5 | quads | iso | bw-wall-sit · Wall sit (seule isolation quads en HOME) | 2×12-15 |
| 6 | shoulders_lateral / shoulders_rear | iso | seed-lateral-raise · Élévations latérales | 2×12-15 |
| c | core | — | seed-crunch · Crunch | 3×15 |

`progressStepKg` (l. 789–790) : 2,5 kg + `autoProgress: true` pour les haltères/KB ; **0 et `autoProgress: false`** pour `seed-pushup`, `bw-wall-sit`, `seed-band-pull-apart` (bodyweight/band).
`generatorWarnings` : aucun (fullbody → `hasPullSession=true` l. 1108 ; 2 jours ; pas de focus).

### Assertions [PASS/FAIL]

| # | Assertion | Résultat | Ligne |
|---|---|---|---|
| 1 | `pref='fullbody'`, 2j → `['fullbody-quad','fullbody-hip']` | ✅ PASS | 480 |
| 2 | `adjustedSlotCount(9,45,'fat_loss') = max(3,floor(6.75)) = 6` | ✅ PASS | 636 |
| 3 | Total = 6 + warmup + core = 8 exercices | ✅ PASS | 1021–1035 |
| 4 | `adjustedSpec(compound_fat_loss,45)` = 2 séries × 12-15 | ✅ PASS | 653–654 |
| 5 | Aucun exercice hors HOME (ni barre, ni poulie, ni machine, ni pullup_bar) | ✅ PASS | 941–944 |
| 6 | Candidat chest compound identifié en HOME | ✅ PASS — `seed-bench-dumbbell` (A) / `seed-pushup` (B) | — |
| 7 | Candidat back compound identifié en HOME | ⚠️ **PASS partiel** — `seed-row-dumbbell` en A, mais en B le slot `['back_width','back']` n'a que `kb-deadlift` → **zéro tirage en séance B**, sans warning (le slot est « rempli ») | 738–746 |
| 8 | Noms « Full Body A / B » | ✅ PASS | 1039–1041 |
| 9 | Note wizard durée | n/a — non affichée (`goal !== 'strength'`) | Screen l. 297 |
| 10 | Spec isolation appliquée à un composé de repli (kb-rdl slot 5, séance A) | ⚠️ comportement voulu mais discutable | 991 + 748–751 |

### Coach

- **Équilibre musculaire :** séance A équilibrée (squat, poussée horizontale, tirage horizontal, poussée verticale, ischios, deltoïde postérieur) — c'est un très bon full body maison. **Séance B en revanche est déséquilibrée** : `dumbbell-rdl` (slot 1) + `kb-deadlift` (slot 3) = **deux charnières de hanche consécutives**, et **aucun mouvement de tirage** (ni vertical ni horizontal) face à deux poussées (pompes + Arnold press). Cause racine : le slot 3 de `fullbody-hip` est défini `['back_width','back']` (l. 378) — sans barre de traction ni poulie, `back_width` est vide en HOME et le tri retombe sur `seed-deadlift`/`kb-deadlift` via `back`. **Correctif : élargir ce slot à `['back_width','back_thickness','back']` comme celui de `fullbody-quad` (l. 365)** — le rowing haltère deviendrait alors candidat et la séance B retrouverait un tirage.
- **Cohérence objectif :** 2×12-15 à 60 s = format fat_loss correct en reps/densité. Mais **12 séries de travail par séance, 24 par semaine, pour tout le corps** : c'est un volume de maintien, pas de progression. Et là encore, **zéro cardio** : le seed contient burpees, corde à sauter, high knees (`primaryMuscle: 'cardio'`) mais aucun slot ne cible ce muscle, donc un programme `fat_loss` n'inclut jamais de travail cardio-métabolique. Pour 2 séances/semaine à domicile, c'est la principale limite du programme.
- **Timing réaliste :** 6 exercices × 2 séries = 12 séries, cycle ≈ 40 s + 60 s = 100 s → 20 min ; + warmup 2×10 (≈ 2 min) + core 3×15 avec repos 60 s (≈ 4 min) + 7 transitions (≈ 5 min) → **≈ 31 min pour un créneau de 45 min**. Le barème 45 min non-force (`×0.75` sur les slots **et** sur les séries) **double la réduction** : on coupe à la fois le nombre d'exercices et le nombre de séries. Il reste ~14 min inutilisées. **Recommandation : à 45 min, ne réduire que l'un des deux axes** (par ex. garder 3 séries et 6 slots ≈ 42 min, ou 2 séries et 7-8 slots).
- **Équipement :** HOME correctement respecté, aucun exercice hors périmètre. Bonne exploitation du KB (goblet squat, kb-rdl) et des haltères. ⚠️ `bw-wall-sit` reçoit une spec « 2×12-15 répétitions » alors que c'est un exercice isométrique (tenue en temps) — incohérence de prescription, mineure mais visible par l'utilisateur.
- **Variété inter-sessions :** ✅ **variété structurelle** — A quad-dominante / B hip-dominante, ordres différents, et `usedGlobally` évite tout doublon d'exercice entre les deux séances.
- **Couverture isolation :** ⚠️ **lacunes acceptables** compte tenu du format : ischios (via repli composé), deltoïdes postérieur et latéral, quads couverts ; **biceps, triceps, mollets absents** (slots 7-9 coupés) — normal à 45 min en full body. Le core est bien présent (2 séances).
- **Verdict global : ⚠️ Problème mineur** — génération correcte et conforme, mais (a) séance B sans aucun tirage (bug de définition de slot en équipement limité), (b) créneau 45 min sous-exploité de ~30 %, (c) aucun cardio pour un objectif fat_loss.

---

# Synthèse GROUPE E

## Bloc 1 — Tableau de synthèse

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|---|---|---|---|
| **P60** | `adjustedSlotCount(6,20,'strength')=3` ✅ · split PPL ✅ · 2 séries ✅ · **total 4 ≠ 5** ❌ · **note wizard « 20 min = 2 exercices »** ❌ | ⚠️ **FAIL (note wizard + total)** | Volume infra-minimal (4 séries lourdes/séance) ; 0 isolation bras/mollets/deltoïdes ; machine prioritaire sur haltère en force |
| **P61** | Split fullbody×3 débutant ✅ · `adjustedSlotCount(9,20)=4` ✅ · 2×8-12 ✅ · **total 5 ≠ 6** ❌ | ⚠️ **PASS avec réserve** | Aucun tirage horizontal du programme entier ; séance C « tout machine » ; 0 isolation |
| **P62** | Split PPL ✅ · `adjustedSlotCount(6,45,'strength')=3` ✅ · 3 séries ✅ · total 5 ✅ · **note wizard exacte seulement pour base ≤ 7** ❌ | ⚠️ **PASS avec réserve** | Créneau 45 min rempli à ~33 min ; deadlift + rowing lourds le même jour ; pas de tirage vertical en BB+DB |
| **P63** | Split upper/lower ✅ · cap 8 ✅ · Lower effectif 6 ✅ · specs 90 min inchangées ✅ · **90 min ≡ 60 min sur les Lower** ❌ | ✅ **Bon programme** (⚠️ réserve produit) | Séances Lower à 54 min pour un créneau de 90 ; bonus `+2` inatteignable sur tout template base 6 |
| **P64** | Split glutes-focus 3j ✅ · `adjustedSlotCount(8,20)=4` ✅ · 2 séries ✅ · zéro slot push ✅ · warning spécialisation ✅ · **total 5 ≠ 6** ❌ | ⚠️ **PASS technique / inadéquation produit** | 0 isolation fessiers (le cœur du template est coupé) ; Nordic curl + tractions servis à une débutante ; 0 cardio en fat_loss |
| **P65** | Split fullbody 2j ✅ · `adjustedSlotCount(9,45,'fat_loss')=6` ✅ · 2 séries ✅ · total 8 ✅ · équipement HOME respecté ✅ · **séance B sans tirage** ❌ | ⚠️ **PASS avec réserve** | Double réduction slots+séries à 45 min (~14 min inutilisées) ; 2 charnières de hanche et 0 tirage en séance B ; 0 cardio ; wall sit prescrit en reps |

## Bloc 2 — Problèmes ouverts

### Bugs / anomalies logicielles

1. **[FAIL — note wizard] « 20 min = 2 exercices » est faux pour tous les templates.**
   *Profils :* P60 (et P62 partiellement). *Fichier :* `ProgramGeneratorScreen.tsx` l. 310–311 vs `programGenerator.ts` l. 633–635.
   *Impact :* l'utilisateur force voit une promesse de 2 exercices et en reçoit 3 (base 6) ou 4 (base 8-9) ; à 45 min la note annonce 3 pour un résultat de 4 sur fullbody / upper-lower / glutes-focus. La note laisse aussi croire à une gradation 2/3/4/5 alors que 20 et 45 min appliquent **la même formule** (`×0.5`).
   *Correction :* note dynamique calculée depuis `adjustedSlotCount(base_du_split, duration, 'strength')`, ou libellé corrigé : « 20 min = 3 · 45 min = 3-4 · 60 min = 4 · 90 min = 5 exercices (hors échauffement et gainage) ».

2. **[FAIL — totaux du prompt] Le core est supprimé sous 20 min et le warmup passe à 1 série.**
   *Profils :* P60 (4 et non 5), P61 (5 et non 6), P64 (5 et non 6). *Lignes :* 1017, 1018, 1031.
   *Impact :* comportement du **code correct et voulu**, mais les assertions du référentiel d'audit v4 sont fausses. À corriger dans `audit_prompt_v4.md`. Effet secondaire réel : à 20 min il n'y a **aucun travail abdominal** dans le programme, alors que les slots core n'existent nulle part ailleurs.

3. **[FAIL — barème 90 min] `min(base + 2, 8)` est inopérant pour tous les templates de base 6.**
   *Profil :* P63 (`lower-quad`, `lower-hip`), s'étend à `push`/`pull`/`legs`/`lower`. *Lignes :* 643 + 985 + 652.
   *Impact :* une séance de 90 min est **strictement identique** à la même séance en 60 min (mêmes 6 slots, mêmes séries — `adjustedSpec` est l'identité à 60 comme à 90). L'utilisateur ne reçoit rien pour ses 30 min supplémentaires ; en P63 les jours Lower durent ~54 min pour un créneau annoncé de 90.
   *Correction :* allonger les tableaux `SLOTS` base 6 à 8 entrées, **ou** ajouter une série sur les composés à 90 min (`adjustedSpec` : `duration===90 → sets+1`).

4. **[FAIL fonctionnel — slot `back_width` en équipement limité]**
   *Profils :* P62 (BB+DB : le slot `['back_width','back']` de `pull` tombe sur `seed-deadlift`), P65 (HOME : le slot `['back_width','back']` de `fullbody-hip` tombe sur `kb-deadlift` → **séance B sans aucun tirage**). *Lignes :* 144, 378, 738–746.
   *Impact :* le slot est « rempli », donc **aucun warning n'est émis** (l. 996–1006 ne se déclenche que sur un slot vide), et l'utilisateur se retrouve avec deux charnières de hanche et zéro tirage dans la même séance.
   *Correction :* élargir le slot dos de `fullbody-hip` à `['back_width','back_thickness','back']` (comme `fullbody-quad`, l. 365) et, plus généralement, émettre un warning quand un slot compound est rempli par un exercice dont le `primaryMuscle` n'appartient pas aux 2 premiers muscles du slot.

5. **[Anomalie — `usedGlobally` prime sur la popularité]**
   *Profils :* P61 (séance C « tout machine »), P64 (Nordic curl + tractions pour une débutante en programme fessiers). *Lignes :* 773–775 (comparaison `usedGlobally` **avant** `popularity`).
   *Impact :* plus il y a de séances du même type dans la semaine, plus les exercices retenus s'éloignent des mouvements canoniques — l'inverse de ce qu'il faut pour un débutant.
   *Correction :* pondérer (ne pas déclasser un exercice `popularity ≥ 3` au profit d'un `popularity ≤ 2`), ou introduire un champ `difficulty` filtré par `level`.

6. **[Anomalie mineure — spec isolation sur exercice composé de repli]**
   *Profils :* P62 (fentes en 2×5-8), P65 (kb-rdl en 2×12-15 sur un slot isolation). *Lignes :* 991 + 748–751. Comportement voulu, mais un composé lourd hérite d'un repos de 120 s (force) ou d'un format d'isolation. À surveiller.

7. **[Anomalie mineure — `strengthEquipmentPrio` place machine/câble devant l'haltère]**
   *Profil :* P60. *Lignes :* 707–719. En force, `seed-chest-press-machine` et `seed-shoulder-press-machine` se retrouvent en 2ᵉ position du top-3 et peuvent être tirés au sort pour un 2×3-5. Recommandation : `barbell(0) < dumbbell/kettlebell(1) < machine/cable(2) < band(3) < bodyweight(4)` pour les slots compound en force.

8. **[Anomalie mineure — prescription en répétitions d'un exercice isométrique]** `bw-wall-sit` prescrit « 2×12-15 reps » (P65, slot quads iso HOME).

### Réserves coach cumulées (par thème)

**Volume trop faible aux durées courtes** — P60 (4 séries lourdes/séance), P61 (2 séries/exercice, 0 isolation), P64 (8 séries/séance).
→ *Recommandation :* à 20 min, privilégier **moins d'exercices mais plus de séries** (2 slots × 3-4 séries plutôt que 3-4 slots × 2 séries) : c'est plus efficace physiologiquement et plus simple à exécuter. Le plancher `max(2, …)` de `adjustedSpec` mérite d'être relevé à 3 pour les composés.

**Créneaux moyens/longs sous-exploités** — P62 (33 min réelles pour 45 annoncées), P63 (54 min pour 90 sur les Lower), P65 (31 min pour 45).
→ *Recommandation :* le barème 45 min non-force applique `×0.75` **deux fois** (slots ET séries) ; n'en réduire qu'un seul. Le barème 45 min force est identique au barème 20 min, ce qui est trop conservateur (il y a la place pour un 4ᵉ slot).

**Équilibre musculaire / patterns manquants** — P61 (aucun tirage horizontal du programme), P62 (aucun tirage vertical + deadlift & rowing le même jour), P65 (séance B sans tirage, 2 charnières de hanche).
→ *Recommandation :* ajouter une vérification post-génération « au moins 1 tirage horizontal ET 1 tirage vertical par semaine » et, à défaut, un warning explicite. La priorité `slot.muscles[0]` (l. 763–767) est la cause première : elle verrouille le slot dos de `fullbody-quad` sur `back_width` alors que le tableau autorise aussi `back_thickness`.

**Objectif fat_loss sans cardio** — P64, P65.
→ *Recommandation :* aucun slot ne cible `primaryMuscle: 'cardio'`, donc burpees, corde à sauter, rameur, tapis ne sont **jamais** proposés. Pour `goal === 'fat_loss'` (et `endurance`), ajouter un slot cardio en fin de séance, ou un format circuit (repos réduits, superset) qui justifierait le choix d'objectif.

**Adéquation niveau ↔ exercices** — P64 (Nordic curl, tractions pour une débutante), P61 (dérive machine).
→ *Recommandation :* champ `difficulty` dans le seed, filtré par `level`.

**Spécialisation à durée courte** — P64 : `glutes-focus` + 20 min supprime toutes les isolations fessiers, c'est-à-dire la raison d'être du template.
→ *Recommandation :* pour les templates spécialisés, réordonner les slots afin qu'au moins une isolation du muscle cible figure dans les 4 premiers, ou avertir dans le wizard.

### Incohérences wizard ↔ générateur (groupe E)

| # | Incohérence | Détail |
|---|---|---|
| E-1 | **Note ℹ️ durée force fausse à 20 min (toujours) et à 45 min (base ≥ 8)** | Screen l. 310–311 vs générateur l. 633–635. Le wizard promet 2/3/4/5 exercices ; le code produit 3/3/4/5 (base 6) ou 4/4/4/5 (base 8-9). |
| E-2 | **La note compte les slots, l'écran final affiche slots + warmup (+ core)** | À 60 min force la note annonce « 4 exercices » et la séance générée en contient 6. Aucun des deux nombres n'est faux, mais ils ne parlent pas de la même chose. |
| E-3 | **La durée est choisie (étape 3) avant la structure (étape 4)** alors que le nombre d'exercices dépend de la base du split retenu | Screen l. 295–321 (durée) puis l. 324 (structure). Une note dynamique n'est donc calculable qu'après l'étape 4 — d'où le libellé figé, et l'incohérence E-1. *Correction possible : déplacer la note sur l'écran de récapitulatif, où le split est connu.* |
| E-4 | **Aucun garde-fou wizard sur durée × structure** | `glutes-focus` + 20 min (P64) supprime toute l'identité du template, `fullbody` + 20 min supprime toutes les isolations (P61). `incompatibleReason` (Screen l. 628–645) ne teste que `days`, `level` et `goal` — jamais `duration`. |
