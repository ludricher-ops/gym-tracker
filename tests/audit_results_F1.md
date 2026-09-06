# Audit `generateProgramDraft` — Groupe F (P41–P50)
# lower_pull / lower_push / push·pull focus / upper ambiguous / auto-split gaps

> Fichiers lus en entier : `src/utils/programGenerator.ts` (814 lignes) + `tests/audit_prompt_v3.md`.
> Seed non chargé → colonnes « Exercice retenu » indiquent le groupe musculaire cible et la catégorie.
> Tous les calculs sont exécutés pas-à-pas depuis le code source.

---

## Rappel des constantes utilisées

```
COMPOUND_SPEC  strength:    5×3-5   rest 180s
               hypertrophy: 4×8-12  rest 90s
               endurance:   3×15-20 rest 60s
               fat_loss:    3×12-15 rest 60s

ISOLATION_SPEC strength:    3×5-8   rest 120s
               hypertrophy: 3×10-15 rest 75s
               endurance:   3×15-20 rest 45s
               fat_loss:    3×12-15 rest 60s

adjustedSpec   60min ou 90min → inchangé
               45min → max(2, floor(sets × 0.75))
               20min → max(2, floor(sets × 0.5))

adjustedSlotCount 60min non-strength → base
                  60min strength     → max(3, floor(base × 0.75))
                  45min non-strength → max(3, floor(base × 0.75))
                  45min strength     → max(2, floor(base × 0.5))
                  90min strength     → base
                  90min non-strength → min(base + 2, 8)
                  20min              → max(2, floor(base × 0.5))
```

---

## P41 — legs + back → lower_pull (chaîne postérieure)

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:['barbell','dumbbell'],
  level:'beginner', focusMuscles:['legs','back'] }
```

### Étape 1 — workoutTypeFromFocus(['legs','back'])

| Flag | Valeur | Raison |
|------|--------|--------|
| hasLower | true | 'legs' ∈ focusMuscles |
| hasPush | false | ni 'chest' ni 'shoulders' |
| hasPull | true | 'back' ∈ focusMuscles |
| hasArms | false | — |
| hasCore | false | — |
| hasUpper | true | hasPull=true |

Parcours des règles (lignes 303-321) :
- Rule 1 `hasLower && !hasUpper` → true && false → ✗
- Rule 2 `hasCore && !hasLower && !hasUpper` → false → ✗
- Rule 3 `hasPush && !hasPull && !hasLower` → false → ✗
- Rule 4 `hasPull && !hasPush && !hasLower` → true && true && **false** (hasLower=true) → ✗
- Rule 5 `hasUpper && !hasLower` → true && false → ✗
- Rule 6 `hasLower && hasPush && !hasPull` → false → ✗
- **Rule 7** `hasLower && hasPull && !hasPush` → **true** → **`'lower_pull'`** ✓

### Étape 2 — selectSplit

focusType = 'lower_pull' (ni 'lower' ni 'upper') → `Array.from({ length:2 }, () => 'lower_pull')`

Split interne : `['lower_pull', 'lower_pull']`
Types publics : `['lower', 'lower']`
toPublicType : lower_pull → 'lower' (ligne 103)

### Étape 3 — Slots par session

focusedMuscles = FOCUS_TO_MUSCLES['legs'] ∪ FOCUS_TO_MUSCLES['back']
= { quads, hamstrings, glutes, calves, back, back_width, back_thickness }

**Slots bruts lower_pull (9) :**

| # | Muscles | Compound | aF (focus) |
|---|---------|----------|------------|
| 0 | hamstrings, glutes | true | 0 (hamstrings ∈ focused) |
| 1 | back_width, back | true | 0 (back_width ∈ focused) |
| 2 | back_thickness, back | true | 0 (back_thickness ∈ focused) |
| 3 | quads, glutes | true | 0 (quads ∈ focused) |
| 4 | glutes, hamstrings | false | 0 (glutes ∈ focused) |
| 5 | back_thickness, back_width, back | false | 0 (back_thickness ∈ focused) |
| 6 | hamstrings | false | 0 (hamstrings ∈ focused) |
| 7 | biceps | false | 1 (biceps ∉ focused) |
| 8 | calves | false | 0 (calves ∈ focused) |

reorderSlotsByFocus :
- Composés (tous aF=0, ordre stable) : [0, 1, 2, 3]
- Isolations (aF=0 : [4,5,6,8] ; aF=1 : [7]) : [4, 5, 6, 8, 7]
- Reordonné final : [0, 1, 2, 3, 4, 5, 6, 8, 7]

adjustedSlotCount(9, 60, 'hypertrophy') = **9** (non-strength, 60min → base)

Total 9 slots pris.

### Étape 5 — Séries × Répétitions

adjustedSpec(60min) → inchangé
- Composé : 4×8-12 (rest 90s)
- Isolation : 3×10-15 (rest 75s)
- Warmup : 2×10
- Core : 3×15

### Étape 6 — Table (session A, usedGlobally vide)

| # | Slot (muscles cibles) | Cat | Exercice attendu | Séries×Reps |
|---|----------------------|-----|-----------------|-------------|
| 0 | warmup | — | [isWarmupExercise, BB ou DB] | 2×10 |
| 1 | hamstrings, glutes | cpd | [Deadlift / RDL — barbell ou DB] | 4×8-12 |
| 2 | back_width, back | cpd | [Traction / Lat pulldown — DB row ou similar] | 4×8-12 |
| 3 | back_thickness, back | cpd | [Rowing barre ou DB] | 4×8-12 |
| 4 | quads, glutes | cpd | [Squat / leg press — barbell ou DB] | 4×8-12 |
| 5 | glutes, hamstrings | isol | [Hip thrust DB / cable kickback] | 3×10-15 |
| 6 | back_thickness, back_width, back | isol | [Isolation dos — DB pullover ou similar] | 3×10-15 |
| 7 | hamstrings | isol | [Leg curl DB] | 3×10-15 |
| 8 | calves | isol | [Mollets — DB ou BW] | 3×10-15 |
| 9 | biceps | isol | [Curl DB] | 3×10-15 |
| 10 | core | — | [Planche / crunch — BW ou DB] | 3×15 |

Session B : mêmes slots, usedGlobally = exercices de A → variantes DB différentes si pool suffisant.

**Nommage** :
- totalOfType('lower') = 2 → suffixe A/B
- "Lower — Chaîne postérieure A" / "Lower — Chaîne postérieure B"

**Assertions :**
- LP1 : legs+back(!push) → lower_pull, jamais fullbody : **PASS** (ligne 319)
- LP4 : slot 1 (après warmup) = hamstrings/glutes compound (deadlift-first) : **PASS**
- Split public = ['lower','lower'] : **PASS**
- Noms "Lower — Chaîne postérieure A/B" : **PASS** (WORKOUT_NAMES['lower_pull'] ligne 403)
- autoProgress: true (barbell/dumbbell → progressStepKg=2.5, ligne 563) : **PASS**
- 11 exercices par session (warmup+9+core) : **PASS**

**Coach :**
- **Équilibre musculaire** : excellent — le deadlift (slot 1) recrute simultanément ischio-jambiers, fessiers et érecteurs spinaux, validant la logique "jambes + dos en un mouvement". Le tirage et le rowing couvrent l'ensemble du dos. Les quads sont traités en composé (squat). Seul manque : les mollets n'ont qu'un slot isolation, acceptable.
- **Cohérence objectif** : hypertrophie 4×8-12 ✓. Volume de 9 slots (4 composés + 5 isolations) bien adapté à la prise de masse.
- **Durée/contenu** : estimation réaliste — 4 composés × 4 séries × ~2.25 min/série = 36 min + 5 isolations × 3 séries × ~1.75 min = 26 min + warmup/core ~8 min ≈ **70 min**. ⚠️ Légèrement au-dessus de 60 min déclarées. 9 slots est ambitieux pour 60 min en hypertrophie.
- **Équipement** : BB+DB bien exploité. Le slot dos composé (back_width/back) : sans barbell pull-up ni câble lat pulldown, un dumbbell row ou un one-arm row sera sélectionné — acceptable.
- **Variété inter-sessions** : variété d'exercices seulement (mêmes 9 slots, même ordre musculaire, exercices alternés via usedGlobally). Avec seulement 2 sessions, la rotation est limitée mais suffisante.
- **Couverture isolation** : biceps (accessoire pull) ✓, dos isolation ✓, hamstrings ✓, glutes ✓, calves ✓. Lacunes : pas de slot dédié shoulders_rear ni forearms — **acceptable** vu l'objectif postérieur.
- **Verdict** : ✅ Bon programme — deadlift-first logique, équilibre jambes/dos solide. Légère tension sur le timing.

---

## P42 — legs + back + core → lower_pull (core ne change pas le type)

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner',
  focusMuscles:['legs','back','core'] }
```

### Étape 1 — workoutTypeFromFocus(['legs','back','core'])

| Flag | Valeur |
|------|--------|
| hasLower | true |
| hasPush | false |
| hasPull | true |
| hasArms | false |
| hasCore | true |
| hasUpper | true |

- Rule 1 `hasLower && !hasUpper` → false
- Rule 2 `hasCore && !hasLower && !hasUpper` → true && **false** (hasLower=true) → ✗
- Rule 7 `hasLower && hasPull && !hasPush` → **true** → **`'lower_pull'`** ✓

Le core ne neutralise pas lower_pull (hasCore ne figure dans aucune règle lower/lower_pull).

### Étape 2 — selectSplit

focusType = 'lower_pull' → `Array.from({ length:3 }, () => 'lower_pull')`
Split interne : `['lower_pull', 'lower_pull', 'lower_pull']`
Types publics : `['lower', 'lower', 'lower']`

### Étape 3 — Slots

FULL = ['barbell','dumbbell','cable','machine','bodyweight']

focusedMuscles = { quads, hamstrings, glutes, calves, back, back_width, back_thickness, core }

Note : 'core' apparaît dans focusedMuscles mais **aucun slot lower_pull** ne liste 'core' → l'ajout de core au focus n'affecte pas le reorderSlotsByFocus des slots lower_pull. Le core est ajouté en queue via corePool, indépendamment des slots.

Reorderment identique à P41 : [0,1,2,3,4,5,6,8,7]

adjustedSlotCount(9, 60, 'hypertrophy') = **9**

**Nommage** :
- totalOfType('lower') = 3 → suffixes A/B/C
- "Lower — Chaîne postérieure A", "B", "C"

### Étape 5 — Séries × Répétitions

Identique à P41 : composé 4×8-12, isolation 3×10-15, warmup 2×10, core 3×15.

### Étape 6 — Table (structure identique aux 3 sessions)

| # | Slot (muscles cibles) | Cat | Exercice attendu | Séries×Reps |
|---|----------------------|-----|-----------------|-------------|
| 0 | warmup | — | [rotation par session] | 2×10 |
| 1 | hamstrings, glutes | cpd | [Deadlift / RDL — barbell/DB/cable/machine] | 4×8-12 |
| 2 | back_width, back | cpd | [Traction / lat pulldown cable ou machine] | 4×8-12 |
| 3 | back_thickness, back | cpd | [Rowing barre / cable / DB] | 4×8-12 |
| 4 | quads, glutes | cpd | [Squat / leg press machine] | 4×8-12 |
| 5 | glutes, hamstrings | isol | [Hip thrust BB/machine / cable kickback] | 3×10-15 |
| 6 | back_thickness, back_width, back | isol | [Pullover cable / isolation dos machine] | 3×10-15 |
| 7 | hamstrings | isol | [Leg curl machine] | 3×10-15 |
| 8 | calves | isol | [Calf raise machine ou BW] | 3×10-15 |
| 9 | biceps | isol | [Curl DB / câble] | 3×10-15 |
| 10 | core | — | [Planche / crunch cable — rotation corePool] | 3×15 |

Sessions B et C : mêmes slots, usedGlobally croissant → diversité d'exercices via pool FULL (large).

**Assertions :**
- LP1 : legs+back(!push)+core → lower_pull, jamais fullbody : **PASS**
- Core en queue via corePool (pas dans les slots) : **PASS** (lignes 769-775)
- Split public = ['lower','lower','lower'] : **PASS**
- Noms "Lower — Chaîne postérieure A/B/C" : **PASS**
- LP4 : slot 1 = hamstrings/glutes compound : **PASS**

**Coach :**
- **Équilibre musculaire (profil féminin fessiers/dos/gainage)** : très adapté. Deadlift (fessiers + dos), hip thrust isolation (fessiers ciblés), tirage (posture dos), squat (quads/fessiers), leg curl (ischio). Le gainage arrive en core queue à chaque séance. ✓
- **Hip thrust présent ?** : slot 5 (glutes/hamstrings isolation) → oui, hip thrust barbell ou machine sera candidat. ✓
- **3 sessions lower_pull par semaine** : fréquence élevée sur les mêmes groupes (jambes + dos). ⚠️ Pour un débutant, cela peut générer de la fatigue cumulée sur deadlift + squat + tirage × 3. Un programme push/pull/lower serait plus récupérant.
- **Variété inter-sessions** : variété d'exercices seulement (même structure 9 slots). Avec FULL, le pool est large → rotations possibles sur 3 sessions.
- **Durée** : ~70 min estimé pour 60 min déclaré (même problème que P41).
- **Couverture isolation** : idem P41 — pas de slot épaules ni avant-bras, acceptable vu le focus postérieur.
- **Verdict** : ✅ Bon programme pour le profil ciblé, avec réserve sur la fréquence × 3 chez le débutant.

---

## P43 — legs + shoulders → lower_push (squat+press, haltérophile)

```
{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:['barbell','dumbbell'],
  level:'intermediate', focusMuscles:['legs','shoulders'] }
```

### Étape 1 — workoutTypeFromFocus(['legs','shoulders'])

| Flag | Valeur |
|------|--------|
| hasLower | true |
| hasPush | true (shoulders) |
| hasPull | false |
| hasArms | false |
| hasUpper | true |

- Rule 1 `hasLower && !hasUpper` → false
- Rule 3 `hasPush && !hasPull && !hasLower` → true && true && **false** → ✗
- Rule 6 **`hasLower && hasPush && !hasPull`** → **true** → **`'lower_push'`** ✓

### Étape 2 — selectSplit

focusType = 'lower_push' → `Array.from({ length:3 }, () => 'lower_push')`
Split interne : `['lower_push', 'lower_push', 'lower_push']`
Types publics : `['lower', 'lower', 'lower']`

### Étape 3 — Slots

focusedMuscles = { quads, hamstrings, glutes, calves, shoulders, shoulders_front, shoulders_lateral, shoulders_rear }

**Slots bruts lower_push (9) :**

| # | Muscles | Compound | aF |
|---|---------|----------|----|
| 0 | quads, glutes | true | 0 (quads ∈ focused) |
| 1 | chest, chest_upper | true | 1 (ni l'un ni l'autre ∈ focused) |
| 2 | shoulders, shoulders_front | true | 0 (shoulders ∈ focused) |
| 3 | hamstrings, glutes | true | 0 (hamstrings ∈ focused) |
| 4 | quads | false | 0 |
| 5 | chest, chest_lower, chest_upper | false | 1 |
| 6 | triceps | false | 1 |
| 7 | glutes | false | 0 |
| 8 | calves | false | 0 |

Reorderment composés (stable sort) :
- aF=0 : [0, 2, 3] ; aF=1 : [1]
- Ordre composés : [0, 2, 3, 1]

Reorderment isolations :
- aF=0 : [4, 7, 8] ; aF=1 : [5, 6]
- Ordre isolations : [4, 7, 8, 5, 6]

Reordonné final : [0, 2, 3, 1, 4, 7, 8, 5, 6]

adjustedSlotCount(9, 60, 'strength') = max(3, floor(9 × 0.75)) = max(3, 6) = **6 slots**

6 premiers slots du tableau reordonné :
1. slot 0 → quads/glutes - composé
2. slot 2 → shoulders/shoulders_front - composé
3. slot 3 → hamstrings/glutes - composé
4. slot 1 → chest/chest_upper - composé
5. slot 4 → quads - isolation
6. slot 7 → glutes - isolation

### Étape 5 — Séries × Répétitions

adjustedSpec(60min, strength) → inchangé
- Composé strength : **5×3-5** (rest 180s)
- Isolation strength : **3×5-8** (rest 120s)
- Warmup : 2×10 ; Core : 3×15

### Étape 6 — Table (sessions A/B/C — intermediate → top-3 random)

| # | Slot (muscles cibles) | Cat | Exercice attendu | Séries×Reps |
|---|----------------------|-----|-----------------|-------------|
| 0 | warmup | — | [rotation] | 2×10 |
| 1 | quads, glutes | cpd | [Squat barbell — priorité barbell strength] | 5×3-5 |
| 2 | shoulders, shoulders_front | cpd | [OHP barbell] | 5×3-5 |
| 3 | hamstrings, glutes | cpd | [RDL barbell] | 5×3-5 |
| 4 | chest, chest_upper | cpd | [Bench press barbell] | 5×3-5 |
| 5 | quads | isol | [Leg extension machine — absent BB+DB → slot potentiellement vide] | 3×5-8 |
| 6 | glutes | isol | [Hip thrust DB / fente] | 3×5-8 |
| 7 | core | — | [rotation] | 3×15 |

⚠️ **Slot 5 (quads isolation)** : primaryMuscle 'quads', category 'isolation', equipment BB ou DB. Si le seed ne contient pas d'exercice isolation quads en barbell/dumbbell (leg extension = machine) → slot **potentiellement vide** (pickExercise retourne null, l'exercice est sauté silencieusement).

**Nommage** :
- totalOfType('lower') = 3 → A/B/C
- "Lower — Squat & Press A/B/C"
- intermediate → random top-3 (non déterministe)

**Assertions :**
- LP2 : legs+push(!pull) → lower_push : **PASS** (ligne 316)
- LP5 : slot 1 après warmup = quads/glutes compound (squat-first après reorder) : **PASS**
- Split public = ['lower','lower','lower'] : **PASS**
- Noms "Lower — Squat & Press A/B/C" : **PASS**
- autoProgress: true + barbell prioritaire (strengthEquipmentPrio) : **PASS**
- Deuxième composé = shoulders/front (OHP) à la 2ème position : **PASS** (reorder met shoulders en 2)

**Coach :**
- **Pattern haltérophile/Wendler** : squat + OHP + RDL + bench — quatre mouvements fondamentaux. ✓
- **Ordre squat → OHP → RDL → bench** : inhabituel (classique = squat / bench / OHP séparés). L'OHP en 2ème position alors que les jambes sont encore fraîches est sous-optimal — normalement OHP se fait avant RDL, non après. C'est un effet du reorderSlotsByFocus qui monte shoulders avant hamstrings, puis chest en dernier.
- **Séries × reps force** : 5×3-5 correct pour la force. ✓
- **Durée** : 4 composés × 5 séries × ~3.5 min/série = 70 min pour les composés seuls + 2 isolations × 3 séries × 2.5 min = 15 min → total **~85+ min** pour une séance annoncée à 60 min. ❌ **Problème sérieux de timing** : 6 slots en force 60 min reste trop long même après la réduction de 9→6.
- **Slot quads isolation sans machine** : avec BB+DB uniquement, le leg extension (machine) est absent → risque de slot vide. ⚠️
- **Variété** : intermediate → top-3 random assure une variation entre A/B/C.
- **Verdict** : ⚠️ Problème mineur — programme cohérent sportivement mais timing sous-estimé, slot isolation quads risqué sans machine.

---

## P44 — legs + chest + shoulders → lower_push (push complet + jambes)

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:FULL, level:'beginner',
  focusMuscles:['legs','chest','shoulders'] }
```

### Étape 1 — workoutTypeFromFocus(['legs','chest','shoulders'])

| Flag | Valeur |
|------|--------|
| hasLower | true |
| hasPush | true (chest + shoulders) |
| hasPull | false |
| hasUpper | true |

- Rule 6 **`hasLower && hasPush && !hasPull`** → **`'lower_push'`** ✓

### Étape 2 — selectSplit

focusType = 'lower_push' → `['lower_push', 'lower_push']`
Public : `['lower', 'lower']`

### Étape 3 — Slots

focusedMuscles = { quads, hamstrings, glutes, calves, chest, chest_upper, chest_lower, shoulders, shoulders_front, shoulders_lateral, shoulders_rear }

| # | Muscles | Compound | aF |
|---|---------|----------|----|
| 0 | quads, glutes | true | 0 |
| 1 | chest, chest_upper | true | 0 |
| 2 | shoulders, shoulders_front | true | 0 |
| 3 | hamstrings, glutes | true | 0 |
| 4 | quads | false | 0 |
| 5 | chest, chest_lower, chest_upper | false | 0 |
| 6 | triceps | false | 1 (triceps ∉ focused) |
| 7 | glutes | false | 0 |
| 8 | calves | false | 0 |

Composés (tous aF=0, stable) : [0, 1, 2, 3]
Isolations aF=0 : [4, 5, 7, 8] ; aF=1 : [6]
Isolations triées : [4, 5, 7, 8, 6]

Reordonné final : [0, 1, 2, 3, 4, 5, 7, 8, 6]

adjustedSlotCount(9, 60, 'hypertrophy') = **9** (base)

9 slots pris dans l'ordre :
1. quads/glutes - composé
2. chest/chest_upper - composé
3. shoulders/shoulders_front - composé
4. hamstrings/glutes - composé
5. quads - isolation
6. chest/chest_lower/chest_upper - isolation
7. glutes - isolation (slot 7)
8. calves - isolation (slot 8)
9. triceps - isolation (slot 6, déplacé en fin)

### Étape 5 — Séries × Répétitions

- Composé hypertrophy : **4×8-12** (rest 90s)
- Isolation : **3×10-15** (rest 75s)

### Étape 6 — Table

| # | Slot | Cat | Exercice attendu | Séries×Reps |
|---|------|-----|-----------------|-------------|
| 0 | warmup | — | [rotation] | 2×10 |
| 1 | quads, glutes | cpd | [Squat barbell/machine] | 4×8-12 |
| 2 | chest, chest_upper | cpd | [Bench press barbell/machine] | 4×8-12 |
| 3 | shoulders, shoulders_front | cpd | [OHP barbell/machine] | 4×8-12 |
| 4 | hamstrings, glutes | cpd | [RDL barbell / leg press] | 4×8-12 |
| 5 | quads | isol | [Leg extension machine] | 3×10-15 |
| 6 | chest/chest_lower/chest_upper | isol | [Fly machine/cable] | 3×10-15 |
| 7 | glutes | isol | [Hip abduction machine] | 3×10-15 |
| 8 | calves | isol | [Calf raise machine] | 3×10-15 |
| 9 | triceps | isol | [Extension cable] | 3×10-15 |
| 10 | core | — | [Planche / crunch] | 3×15 |

**Nommage** : totalOfType('lower')=2 → "Lower — Squat & Press A/B"

**Assertions :**
- LP2 : legs+push(!pull) → lower_push : **PASS**
- LP5 : slot 1 = quads/glutes composé (squat) : **PASS**
- Split public = ['lower','lower'] : **PASS**
- Noms A/B : **PASS**

**Coach :**
- **Surcharge pour débutant** : quads + pecs + épaules + ischio dans la même séance — 4 composés sollicitant pratiquement tout le corps sauf le dos. Pour un débutant en 2j/semaine, le volume total (4 cpd × 4 séries + 5 isol × 3 séries = 31 séries/session) est élevé. ⚠️
- **Déséquilibre push/pull** : aucun tirage — la pression articulaire antérieure (pecs, deltoïdes) sans équilibre postérieur (dos) est un facteur de risque de blessure épaule à terme. ⚠️
- **Timing** : ~70 min estimé pour 60 min.
- **Verdict** : ⚠️ Problème mineur — sportivement cohérent (lower_push valide) mais le déséquilibre push/pull chronique sur 2j est un risque posture/blessure à signaler à l'utilisateur.

---

## P45 — chest + shoulders → push (push day complet)

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:['dumbbell'],
  level:'beginner', focusMuscles:['chest','shoulders'] }
```

### Étape 1 — workoutTypeFromFocus(['chest','shoulders'])

| Flag | Valeur |
|------|--------|
| hasLower | false |
| hasPush | true |
| hasPull | false |
| hasUpper | true |

- Rule 3 **`hasPush && !hasPull && !hasLower`** → **`'push'`** ✓ (prioritaire sur rule 5 'upper')

### Étape 2 — selectSplit

focusType = 'push' → `['push', 'push', 'push']`

### Étape 3 — Slots

focusedMuscles = { chest, chest_upper, chest_lower, shoulders, shoulders_front, shoulders_lateral, shoulders_rear }

**Slots push (6) :**

| # | Muscles | Compound | aF |
|---|---------|----------|----|
| 0 | chest, chest_upper, chest_lower | true | 0 |
| 1 | shoulders, shoulders_front | true | 0 |
| 2 | chest, chest_upper, chest_lower | false | 0 |
| 3 | triceps | false | 1 |
| 4 | shoulders_lateral, shoulders | false | 0 |
| 5 | triceps | false | 1 |

Composés aF=0 : [0,1] (stable)
Isolations aF=0 : [2,4] ; aF=1 : [3,5]
Isolations : [2, 4, 3, 5]

Reordonné : [0, 1, 2, 4, 3, 5]

adjustedSlotCount(6, 60, 'hypertrophy') = **6** (base)

6 slots :
1. chest compound
2. shoulders compound
3. chest isolation
4. shoulders_lateral isolation
5. triceps isolation (#1)
6. triceps isolation (#2)

### Étape 5 — Specs

Composé : 4×8-12 ; Isolation : 3×10-15

### Étape 6 — Table (session A)

| # | Slot | Cat | Exercice attendu | Séries×Reps |
|---|------|-----|-----------------|-------------|
| 0 | warmup | — | [BW ou DB] | 2×10 |
| 1 | chest compound | cpd | [DB bench press] | 4×8-12 |
| 2 | shoulders compound | cpd | [DB overhead press] | 4×8-12 |
| 3 | chest isolation | isol | [DB fly] | 3×10-15 |
| 4 | shoulders_lateral isolation | isol | [DB lateral raise] | 3×10-15 |
| 5 | triceps isolation | isol | [DB overhead extension] | 3×10-15 |
| 6 | triceps isolation | isol | [DB kickback] | 3×10-15 |
| 7 | core | — | [BW ou DB] | 3×15 |

**Nommage** : totalOfType('push')=3 → "Push — Poussée A/B/C"

**Assertions :**
- PUSH_FULL : chest+shoulders → push (pas upper) : **PASS**
- Split = ['push','push','push'] : **PASS**
- Slots chest ET shoulders couverts : **PASS** (slots 1 cpd chest, 2 cpd shoulders, 3 isol chest, 4 isol shoulders)

**Coach :**
- **OHP en DB** : dumbbell overhead press disponible → épaules bien couvertes sans barre. ✓
- **Chest sans barre** : DB bench press est un excellent substitut — activation pectorale comparable, ROM légèrement supérieure. ✓
- **Double slot triceps** (slots 5 et 6 sont tous deux triceps) : les triceps reçoivent 2 exercices isolation. C'est un biais déjà présent dans les slots push d'origine — acceptable en push day mais redondant.
- **Zéro dos** : 3 séances push/semaine sans aucune séance pull → déséquilibre postérieur majeur. ⚠️ Si l'utilisateur ne fait QUE ce programme, c'est problématique ; mais le wizard génère ce split sur demande explicite 'chest+shoulders'.
- **Variété inter-sessions** : 3 sessions × même structure → variété d'exercices seulement (DB press → incliné → décliné selon usedGlobally).
- **Verdict** : ✅ Bon programme pour l'objectif déclaré. Réserve : triple push sans pull — avertir l'utilisateur du déséquilibre.

---

## P46 — back + arms → pull (pull day complet)

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:['barbell','dumbbell','cable'],
  level:'intermediate', focusMuscles:['back','arms'] }
```

### Étape 1 — workoutTypeFromFocus(['back','arms'])

| Flag | Valeur |
|------|--------|
| hasLower | false |
| hasPush | false |
| hasPull | true (back) |
| hasArms | true |
| hasUpper | true |

- Rule 4 **`hasPull && !hasPush && !hasLower`** → **`'pull'`** ✓

Note : 'arms' inclut biceps, triceps, forearms — mais la détection repose uniquement sur hasPull/hasPush/hasLower. hasArms=true → hasUpper=true mais hasPush=false → rule 4 s'active avant rule 5.

### Étape 2 — selectSplit

focusType = 'pull' → `['pull', 'pull', 'pull']`

### Étape 3 — Slots

focusedMuscles = { back, back_width, back_thickness, biceps, triceps, forearms }

**Slots pull (6) :**

| # | Muscles | Compound | aF |
|---|---------|----------|----|
| 0 | back_width, back | true | 0 |
| 1 | back_thickness, back | true | 0 |
| 2 | back_thickness, back_width, back | false | 0 |
| 3 | biceps | false | 0 |
| 4 | shoulders_rear | false | 1 (∉ focused) |
| 5 | forearms | false | 0 |

Composés [0,1] (tous aF=0, stable)
Isolations aF=0 : [2,3,5] ; aF=1 : [4]
Isolations : [2, 3, 5, 4]

Reordonné : [0, 1, 2, 3, 5, 4]

adjustedSlotCount(6, 60, 'hypertrophy') = **6**

6 slots :
1. back_width/back - composé
2. back_thickness/back - composé
3. back isolation
4. biceps - isolation
5. forearms - isolation (monté depuis slot 5)
6. shoulders_rear - isolation (ravalé)

### Étape 5 — Specs

Composé : 4×8-12 ; Isolation : 3×10-15

### Étape 6 — Table

| # | Slot | Cat | Exercice attendu | Séries×Reps |
|---|------|-----|-----------------|-------------|
| 0 | warmup | — | [BB/DB/cable] | 2×10 |
| 1 | back_width, back | cpd | [Lat pulldown cable / traction BB] | 4×8-12 |
| 2 | back_thickness, back | cpd | [Rowing barbell / DB row / cable row] | 4×8-12 |
| 3 | back isolation | isol | [Pullover cable / DB] | 3×10-15 |
| 4 | biceps | isol | [Curl barbell / DB / câble] | 3×10-15 |
| 5 | forearms | isol | [Wrist curl DB / reverse curl] | 3×10-15 |
| 6 | shoulders_rear | isol | [Face pull cable] | 3×10-15 |
| 7 | core | — | [rotation] | 3×15 |

**Nommage** : totalOfType('pull')=3 → "Pull — Tirage A/B/C"
intermediate → top-3 random

**Assertions :**
- PULL_FULL : back+arms → pull : **PASS**
- Biceps slot dédié (slot 4) en plus du tirage composé : **PASS**
- Split = ['pull','pull','pull'] : **PASS**

**Coach :**
- **Biceps dédié** : oui, slot isolation biceps présent après les tirages. ✓
- **Triceps absent** : 'arms' inclut triceps dans focusedMuscles, mais les slots pull ne comportent aucun slot triceps. L'utilisateur qui veut "dos + bras" ne verra pas de triceps dans ses séances. ⚠️
- **Forearms** : slot dédié présent — rare mais cohérent pour un utilisateur bras/dos.
- **3 sessions pull/semaine** : fréquence élevée. Adéquate pour intermediate si récupération correcte (48h entre sessions).
- **Zéro push** : même problème que P45 inversé — déséquilibre chronique si programme exclusif.
- **Verdict** : ✅ Bon programme dos+bras. Réserve : triceps absent (demandé via 'arms'), déséquilibre push/pull.

---

## P47 — chest + arms → push (règle de priorité)

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:['dumbbell'],
  level:'beginner', focusMuscles:['chest','arms'] }
```

### Étape 1 — workoutTypeFromFocus(['chest','arms'])

| Flag | Valeur |
|------|--------|
| hasLower | false |
| hasPush | true (chest) |
| hasPull | false |
| hasArms | true |
| hasUpper | true |

- Rule 3 **`hasPush && !hasPull && !hasLower`** → **`'push'`** ✓

Rule 3 (ligne 309) s'active avant rule 5 (ligne 313). Le fait que hasArms=true n'empêche pas rule 3.

### Étape 2 — selectSplit

focusType = 'push' → `['push', 'push']`

### Étape 3 — Slots

focusedMuscles = { chest, chest_upper, chest_lower, biceps, triceps, forearms }

**Slots push (6) avec focus chest+arms :**

| # | Muscles | Compound | aF |
|---|---------|----------|----|
| 0 | chest, chest_upper, chest_lower | true | 0 |
| 1 | shoulders, shoulders_front | true | 1 (∉ focused) |
| 2 | chest, chest_upper, chest_lower | false | 0 |
| 3 | triceps | false | 0 |
| 4 | shoulders_lateral, shoulders | false | 1 |
| 5 | triceps | false | 0 |

Composés aF=0 : [0] ; aF=1 : [1] → [0, 1]
Isolations aF=0 : [2, 3, 5] ; aF=1 : [4] → [2, 3, 5, 4]

Reordonné : [0, 1, 2, 3, 5, 4]

adjustedSlotCount(6, 60, 'hypertrophy') = **6**

Slots :
1. chest compound
2. shoulders compound (not focused, mais maintenu)
3. chest isolation
4. triceps isolation
5. triceps isolation #2
6. shoulders_lateral isolation (ravalé)

**⚠️ Observation critique** : 'arms' inclut biceps, triceps, forearms. Dans les slots push, **aucun slot biceps** n'existe. L'utilisateur qui cible "chest + arms" ne verra aucun curl dans ses séances push.

### Étape 5 — Specs

Composé : 4×8-12 ; Isolation : 3×10-15

### Étape 6 — Table

| # | Slot | Cat | Exercice attendu | Séries×Reps |
|---|------|-----|-----------------|-------------|
| 0 | warmup | — | [DB] | 2×10 |
| 1 | chest compound | cpd | [DB bench press] | 4×8-12 |
| 2 | shoulders compound | cpd | [DB overhead press] | 4×8-12 |
| 3 | chest isolation | isol | [DB fly] | 3×10-15 |
| 4 | triceps isolation | isol | [DB overhead extension] | 3×10-15 |
| 5 | triceps isolation | isol | [DB kickback] | 3×10-15 |
| 6 | shoulders_lateral | isol | [DB lateral raise] | 3×10-15 |
| 7 | core | — | [BW] | 3×15 |

**Nommage** : totalOfType('push')=2 → "Push — Poussée A/B"

**Assertions :**
- Rule 3 prioritaire sur rule 5 (hasPush+!hasPull+!hasLower → 'push') : **PASS** (ligne 309)
- Split = ['push','push'] : **PASS**
- Triceps couvert : **PASS** (2 slots)
- Chest couvert : **PASS**

**Coach :**
- **Biceps absent** : l'utilisateur demande 'arms' (biceps+triceps+forearms) mais les slots push ne comportent aucun slot biceps. C'est une lacune connue du mapping focusMuscles→workoutType. Un utilisateur cherchant "pecs + bras" s'attendrait à des curls. ⚠️
- **Double triceps** : deux slots triceps isolation dans push, cohérent (synergiste du développé), mais le biceps zéro est criant.
- **Recommandation** : le wizard pourrait avertir "chest+arms choisit un push day — biceps non couverts".
- **Verdict** : ⚠️ Problème mineur — triceps bien traités, mais biceps (demandé via 'arms') totalement absent.

---

## P48 — shoulders + back → upper (mixte haut du corps)

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:FULL,
  level:'beginner', focusMuscles:['shoulders','back'] }
```

### Étape 1 — workoutTypeFromFocus(['shoulders','back'])

| Flag | Valeur |
|------|--------|
| hasLower | false |
| hasPush | true (shoulders) |
| hasPull | true (back) |
| hasUpper | true |

- Rule 3 `hasPush && !hasPull && !hasLower` → false (hasPull=true)
- Rule 4 `hasPull && !hasPush && !hasLower` → false (hasPush=true)
- Rule 5 **`hasUpper && !hasLower`** → **`'upper'`** ✓

### Étape 2 — selectSplit

focusType = 'upper' → alternate upper-push/upper-pull (ligne 339)
`Array.from({ length:2 }, (_, i) => i%2===0 ? 'upper-push' : 'upper-pull')`
= `['upper-push', 'upper-pull']`
Public : `['upper', 'upper']`

### Étape 3 — Slots

focusedMuscles = { shoulders, shoulders_front, shoulders_lateral, shoulders_rear, back, back_width, back_thickness }

**Session A — upper-push (8 slots) :**

| # | Muscles | Compound | aF |
|---|---------|----------|----|
| 0 | chest, chest_upper | true | 1 |
| 1 | back_width, back_thickness, back | true | 0 |
| 2 | shoulders, shoulders_front | true | 0 |
| 3 | chest, chest_lower, chest_upper | false | 1 |
| 4 | triceps | false | 1 |
| 5 | shoulders_lateral | false | 0 |
| 6 | biceps | false | 1 |
| 7 | back_thickness, back | false | 0 |

Composés : aF=0 → [1,2] ; aF=1 → [0] → [1, 2, 0]
Isolations : aF=0 → [5,7] ; aF=1 → [3,4,6] → [5, 7, 3, 4, 6]

Reordonné A : [1, 2, 0, 5, 7, 3, 4, 6]

adjustedSlotCount(8, 60, 'hypertrophy') = **8** (base)

**Slots A (8)** :
1. back_width/back_thickness/back - composé (tirage vertical → **back-first** car reorder)
2. shoulders/shoulders_front - composé (OHP)
3. chest/chest_upper - composé (bench)
4. shoulders_lateral - isolation
5. back_thickness/back - isolation
6. chest isolation
7. triceps - isolation
8. biceps - isolation

**Session B — upper-pull (8 slots) :**

| # | Muscles | Compound | aF |
|---|---------|----------|----|
| 0 | back_width, back | true | 0 |
| 1 | back_thickness, back | true | 0 |
| 2 | chest, chest_upper | true | 1 |
| 3 | shoulders_rear | false | 0 |
| 4 | biceps | false | 1 |
| 5 | back_thickness, back | false | 0 |
| 6 | triceps | false | 1 |
| 7 | shoulders_lateral | false | 0 |

Composés : aF=0 → [0,1] ; aF=1 → [2] → [0, 1, 2]
Isolations : aF=0 → [3,5,7] ; aF=1 → [4,6] → [3, 5, 7, 4, 6]

Reordonné B : [0, 1, 2, 3, 5, 7, 4, 6]

**Slots B (8)** :
1. back_width/back - composé
2. back_thickness/back - composé
3. chest/chest_upper - composé
4. shoulders_rear - isolation
5. back_thickness/back - isolation
6. shoulders_lateral - isolation
7. biceps - isolation
8. triceps - isolation

### Étape 5 — Specs

Composé : 4×8-12 ; Isolation : 3×10-15

### Étape 6 — Tables

**Session A — Upper A (upper-push, reordonné pour shoulders+back) :**

| # | Slot | Cat | Exercice attendu | Séries×Reps |
|---|------|-----|-----------------|-------------|
| 0 | warmup | — | [rotation] | 2×10 |
| 1 | back_width/back_thickness/back | cpd | [Lat pulldown / traction barbell] | 4×8-12 |
| 2 | shoulders/shoulders_front | cpd | [OHP barbell/DB] | 4×8-12 |
| 3 | chest/chest_upper | cpd | [Bench press] | 4×8-12 |
| 4 | shoulders_lateral | isol | [Lateral raise DB/cable] | 3×10-15 |
| 5 | back_thickness/back | isol | [DB pullover / cable row isolation] | 3×10-15 |
| 6 | chest isolation | isol | [Fly DB/cable] | 3×10-15 |
| 7 | triceps | isol | [Extension cable] | 3×10-15 |
| 8 | biceps | isol | [Curl DB/cable] | 3×10-15 |
| 9 | core | — | [rotation] | 3×15 |

**Session B — Upper B (upper-pull) :**

| # | Slot | Cat | Exercice attendu | Séries×Reps |
|---|------|-----|-----------------|-------------|
| 0 | warmup | — | [rotation] | 2×10 |
| 1 | back_width/back | cpd | [Traction / lat pulldown] | 4×8-12 |
| 2 | back_thickness/back | cpd | [Rowing barbell/cable] | 4×8-12 |
| 3 | chest/chest_upper | cpd | [Développé incliné] | 4×8-12 |
| 4 | shoulders_rear | isol | [Face pull cable] | 3×10-15 |
| 5 | back_thickness/back | isol | [Isolation dos cable] | 3×10-15 |
| 6 | shoulders_lateral | isol | [Lateral raise cable] | 3×10-15 |
| 7 | biceps | isol | [Curl câble/DB] | 3×10-15 |
| 8 | triceps | isol | [Extension cable] | 3×10-15 |
| 9 | core | — | [rotation] | 3×15 |

**Nommage** : totalOfType('upper')=2 → "Upper — Haut du corps A/B"

**Assertions :**
- hasPush+hasPull+!hasLower → 'upper' (rule 5) : **PASS**
- Split interne ['upper-push','upper-pull'] → public ['upper','upper'] : **PASS**
- Noms "Upper — Haut du corps A/B" : **PASS**
- Épaules dans upper-push : slot OHP composé + slot shoulders_lateral isol → **PASS**
- Épaules dans upper-pull : slot shoulders_rear isol + slot shoulders_lateral isol → **PASS**

**Coach :**
- **Effet du reorderSlotsByFocus sur upper-push** : avec shoulders+back focus, le tirage (back) monte devant le bench (non-focused). La session A devient dos-first → non "upper-push" au sens conventionnel. C'est cohérent (le focus back prioritise le dos) mais l'utilisateur pourrait être surpris. ⚠️
- **Épaules** : bien représentées dans les deux sessions (OHP en A, face pull + écarté latéral en B). ✓
- **Ratio push/pull** : session A = 1 composé dos + 1 composé bench + 1 OHP + isolations mixtes. Session B = 2 composés dos + 1 bench. Le dos est majoritaire dans les deux — adapté au focus 'back'.
- **Est-ce le meilleur split** ? Pour shoulders+back uniquement (sans chest ni bras), un split push/pull serait plus ciblé. Mais 'hasPush+hasPull → upper' est la règle correcte du code. ✓
- **Variété structurelle** : upper-push vs upper-pull = slots différents → variété structurelle A/B réelle. ✓
- **Verdict** : ✅ Bon programme. Réserve : l'effet du reorder sur upper-push peut surprendre (dos avant bench).

---

## P49 — fat_loss 4j intermediate (gap auto-split)

```
{ goal:'fat_loss', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'intermediate' }
```

### Étape 1 — workoutTypeFromFocus([])

`focusMuscles.length === 0` → retourne **`null`** (ligne 293)

### Étape 2 — selectSplit

focusType = null → branche par défaut (lignes 347-377)

```
daysPerWeek = 4
isMass = goal === 'strength' || goal === 'hypertrophy' = false  (fat_loss)

case 4:
  if (isMass)          → false
  if (level !== 'beginner') → true  (intermediate)
  → return ['push', 'pull', 'lower-quad', 'fullbody-quad']   ← ligne 364
```

Split interne : `['push', 'pull', 'lower-quad', 'fullbody-quad']`
Types publics : `['push', 'pull', 'lower', 'fullbody']`

**Confirmation** : fat_loss (isMass=false) + intermediate + 4j → branche `level !== 'beginner'` → **['push','pull','lower-quad','fullbody-quad']**. Ce n'est PAS la branche upper/lower (qui est isMass+4j, ligne 362).

### Étape 3 — Slots

adjustedSlotCount par session (60min, fat_loss = non-strength → base) :
- push : base=6 → **6 slots**
- pull : base=6 → **6 slots**
- lower-quad : base=6 → **6 slots**
- fullbody-quad : base=9 → **9 slots**

focusedMuscles = {} → reorderSlotsByFocus retourne slots inchangés.

Specs fat_loss : composé 3×12-15 (rest 60s), isolation 3×12-15 (rest 60s)
adjustedSpec(60min) → inchangé

**Session 1 — Push (6 slots dans l'ordre original) :**

| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | warmup | — | 2×10 |
| 1 | chest compound | cpd | 3×12-15 |
| 2 | shoulders compound (OHP) | cpd | 3×12-15 |
| 3 | chest isolation | isol | 3×12-15 |
| 4 | triceps | isol | 3×12-15 |
| 5 | shoulders_lateral | isol | 3×12-15 |
| 6 | triceps | isol | 3×12-15 |
| 7 | core | — | 3×15 |

**Session 2 — Pull (6 slots) :**

| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | warmup | — | 2×10 |
| 1 | back_width/back | cpd | 3×12-15 |
| 2 | back_thickness/back | cpd | 3×12-15 |
| 3 | back isolation | isol | 3×12-15 |
| 4 | biceps | isol | 3×12-15 |
| 5 | shoulders_rear | isol | 3×12-15 |
| 6 | forearms | isol | 3×12-15 |
| 7 | core | — | 3×15 |

**Session 3 — Lower A (lower-quad, 6 slots) :**

| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | warmup | — | 2×10 |
| 1 | quads/glutes | cpd | 3×12-15 |
| 2 | hamstrings/glutes | cpd | 3×12-15 |
| 3 | quads | isol | 3×12-15 |
| 4 | hamstrings | isol | 3×12-15 |
| 5 | glutes | isol | 3×12-15 |
| 6 | calves | isol | 3×12-15 |
| 7 | core | — | 3×15 |

**Session 4 — Full Body (fullbody-quad, 9 slots) :**

| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | warmup | — | 2×10 |
| 1 | quads/glutes | cpd | 3×12-15 |
| 2 | chest/chest_upper | cpd | 3×12-15 |
| 3 | back_width/back | cpd | 3×12-15 |
| 4 | shoulders/shoulders_front | cpd | 3×12-15 |
| 5 | hamstrings | isol | 3×12-15 |
| 6 | shoulders_rear | isol | 3×12-15 |
| 7 | biceps | isol | 3×12-15 |
| 8 | triceps | isol | 3×12-15 |
| 9 | calves | isol | 3×12-15 |
| 10 | core | — | 3×15 |

**Nommage** (1 occurrence de chaque type → pas de suffixe) :
- "Push — Poussée" / "Pull — Tirage" / "Lower — Bas du corps" / "Full Body"

**Assertions :**
- fat_loss (isMass=false) + intermediate + 4j → branche `level !== 'beginner'` → **['push','pull','lower-quad','fullbody-quad']** : **PASS** (ligne 364)
- Fat_loss ne tombe PAS dans upper/lower (qui requiert isMass=true) : **PASS**
- Split exact produit : **PASS**

**Coach :**
- **Structure pertinente pour fat_loss** : Push/Pull/Lower/Full Body = 4 types distincts, chaque groupe musculaire sollicité 2× par semaine (push + fullbody pour pecs, pull + fullbody pour dos, lower + fullbody pour jambes). Fréquence optimale pour composition corporelle. ✓
- **Specs fat_loss** : 3×12-15 avec repos 60s → densité élevée, compatible avec l'objectif. ✓
- **Timing** : fullbody 9 slots × 3 séries × ~1.75 min/série ≈ 47 min + warmup/core ≈ 55 min. ✓ Les 3 autres sessions (6 slots) ≈ 35-40 min. Tout tient dans 60 min.
- **Cardio/force** : le générateur ne prévoit pas de cardio explicite (pas de slot cardio) — fat_loss reste un programme de musculation à haute densité. Acceptable si l'utilisateur complète avec du cardio séparé.
- **Verdict** : ✅ Bon programme — structure équilibrée et pertinente pour fat_loss intermediate 4j.

---

## P50 — strength 2j advanced (gap niveau advanced)

```
{ goal:'strength', daysPerWeek:2, sessionDuration:90, equipment:FULL, level:'advanced' }
```

### Étape 1 — workoutTypeFromFocus([])

`focusMuscles.length === 0` → **`null`**

### Étape 2 — selectSplit

focusType = null → branche par défaut

```
daysPerWeek = 2
case 2: return ['fullbody-quad', 'fullbody-hip']   ← ligne 350
```

La branche case 2 **n'a aucune condition** sur level ou goal — 2j = fullbody toujours.
Le niveau 'advanced' ne bifurque pas avant que daysPerWeek soit évalué. ✓

Split interne : `['fullbody-quad', 'fullbody-hip']`
Types publics : `['fullbody', 'fullbody']`
isMass = true (strength) mais n'influe pas sur le case 2.

### Étape 3 — Slots

focusedMuscles = {} → slots non reordonnés.

adjustedSlotCount(9, 90, 'strength') :
```
isStrength = true
// 90 min
return isStrength ? base : Math.min(base + 2, 8)
→ return 9   (pas de bonus +2 en strength)
```
→ **9 slots** par session.

**fullbody-quad (9 slots, ordre original) :**
0. quads/glutes - composé
1. chest/chest_upper - composé
2. back_width/back_thickness/back - composé
3. shoulders/shoulders_front - composé
4. hamstrings - isolation
5. shoulders_rear - isolation
6. biceps - isolation
7. triceps - isolation
8. calves - isolation

**fullbody-hip (9 slots, ordre original) :**
0. hamstrings/glutes - composé
1. chest/chest_upper - composé
2. back_width/back - composé
3. shoulders/shoulders_front - composé
4. quads - isolation
5. shoulders_lateral/shoulders_rear - isolation
6. biceps - isolation
7. triceps - isolation
8. calves - isolation

Specs strength : composé **5×3-5** (rest 180s), isolation **3×5-8** (rest 120s)
adjustedSpec(90min) → inchangé.

Total par session = 1 warmup + 9 slots + 1 core = **11 exercices**

### Étape 6 — Tables

**Session A — Full Body A (fullbody-quad) :**

| # | Slot | Cat | Exercice attendu | Séries×Reps |
|---|------|-----|-----------------|-------------|
| 0 | warmup | — | [rotation] | 2×10 |
| 1 | quads/glutes | cpd | [Squat barbell] | 5×3-5 |
| 2 | chest/chest_upper | cpd | [Bench press barbell] | 5×3-5 |
| 3 | back_width/back | cpd | [Traction / Pendlay row barbell] | 5×3-5 |
| 4 | shoulders/shoulders_front | cpd | [OHP barbell] | 5×3-5 |
| 5 | hamstrings | isol | [Leg curl machine/DB] | 3×5-8 |
| 6 | shoulders_rear | isol | [Face pull cable] | 3×5-8 |
| 7 | biceps | isol | [Curl barbell] | 3×5-8 |
| 8 | triceps | isol | [Extension barbell/cable] | 3×5-8 |
| 9 | calves | isol | [Calf raise] | 3×5-8 |
| 10 | core | — | [rotation] | 3×15 |

**Session B — Full Body B (fullbody-hip) :**

| # | Slot | Cat | Exercice attendu | Séries×Reps |
|---|------|-----|-----------------|-------------|
| 0 | warmup | — | [rotation] | 2×10 |
| 1 | hamstrings/glutes | cpd | [RDL barbell / Deadlift] | 5×3-5 |
| 2 | chest/chest_upper | cpd | [Bench press barbell (usedGlobally → incliné ?)] | 5×3-5 |
| 3 | back_width/back | cpd | [Lat pulldown cable / Pendlay row] | 5×3-5 |
| 4 | shoulders/shoulders_front | cpd | [OHP barbell] | 5×3-5 |
| 5 | quads | isol | [Leg extension machine] | 3×5-8 |
| 6 | shoulders_lateral/rear | isol | [Lateral raise / face pull] | 3×5-8 |
| 7 | biceps | isol | [Curl DB/câble] | 3×5-8 |
| 8 | triceps | isol | [Extension] | 3×5-8 |
| 9 | calves | isol | [Calf raise] | 3×5-8 |
| 10 | core | — | [rotation] | 3×15 |

**Nommage** : totalOfType('fullbody')=2 → "Full Body A" / "Full Body B"

**Assertions :**
- 2j = fullbody toujours (case 2 sans condition) : **PASS** (ligne 350)
- Level 'advanced' ne bifurque pas avant daysPerWeek : **PASS**
- Split = ['fullbody-quad','fullbody-hip'] : **PASS**
- adjustedSlotCount(9, 90, 'strength') = 9 (pas de bonus +2) : **PASS** (ligne 430)
- Total = 1+9+1 = **11 exercices** : **PASS**

**Coach :**
- **Advanced en strength sur 2j** : un athlète confirmé en force s'entraîne typiquement 4-5j (PPL, Upper/Lower, Conjugate…). Le fullbody 2j n'est pas idéal pour maximiser la force chez un advanced — récupération certes optimale entre sessions, mais fréquence trop basse par groupe musculaire (1×/semaine). ⚠️
- **Timing critique** : 4 composés × 5 séries × 3.5 min/série (45s travail + 180s repos) = **70 min** pour les seuls composés. + 5 isolations × 3 séries × 2.5 min = 37.5 min. Total ≈ **107 min + warmup/core ≈ 115 min** pour 90 min déclarés. ❌ **Problème sérieux de timing** — le programme ne tient pas dans 90 min pour un objectif force.
- **Variété A/B** : fullbody-quad (squat-dominant) vs fullbody-hip (RDL/deadlift-dominant) → variété structurelle réelle. ✓
- **Specs isolation en force** : 3×5-8 pour face pull, biceps, triceps — acceptable mais inhabituel (force = mouvements lourds, pas isolation). Un advanced en force ferait peu d'isolation.
- **Verdict** : ⚠️ Problème mineur sur la pertinence (fullbody 2j pour advanced strength), ❌ problème sérieux de timing (≈115 min pour 90 min déclarés en strength).

---

## Récapitulatif des assertions critiques P41–P50

| Profil | Split produit | Assertions critiques | Verdict | Réserves coach |
|--------|--------------|----------------------|---------|----------------|
| P41 | lower_pull × 2 | LP1 ✓, LP4 ✓, autoProgress ✓ | ✅ PASS | Timing ~70min pour 60min déclarés |
| P42 | lower_pull × 3 | LP1 ✓, LP4 ✓, core en queue ✓ | ✅ PASS | Fréquence × 3 élevée pour débutant ; timing ~70min |
| P43 | lower_push × 3 | LP2 ✓, LP5 ✓, barbell prio ✓ | ✅ PASS | Timing ~85min pour 60min strength ; slot quads isol potentiellement vide sans machine ; ordre OHP avant RDL inhabituel |
| P44 | lower_push × 2 | LP2 ✓, LP5 ✓ | ✅ PASS | Volume élevé débutant (4 cpd) ; déséquilibre push/pull chronique |
| P45 | push × 3 | PUSH_FULL ✓, chest+shoulders couverts ✓ | ✅ PASS | Triple push sans pull = déséquilibre chronique |
| P46 | pull × 3 | PULL_FULL ✓, biceps dédié ✓ | ✅ PASS | Triceps absent malgré 'arms' dans focus ; triple pull sans push |
| P47 | push × 2 | Rule 3 > Rule 5 ✓, triceps ✓ | ✅ PASS | Biceps absent malgré 'arms' dans focus |
| P48 | upper-push/upper-pull | upper ✓, épaules A+B ✓ | ✅ PASS | Reorder monte dos avant bench dans upper-push (non conventionnel) |
| P49 | push/pull/lower-quad/fullbody-quad | !isMass+intermed+4j ✓, pas upper/lower ✓ | ✅ PASS | Pas de cardio explicite (fat_loss) |
| P50 | fullbody-quad/fullbody-hip | 2j=fullbody ✓, 9 slots strength 90min ✓ | ⚠️ PASS | Timing ~115min pour 90min ; fullbody 2j inadapté niveau advanced strength |

---

## Assertions LP du Groupe F — bilan P41–P50

| Code | Assertion | Statut |
|------|-----------|--------|
| LP1 | legs+back(!push) → lower_pull, jamais fullbody | **PASS** (P41, P42) |
| LP2 | legs+push(!pull) → lower_push, jamais fullbody | **PASS** (P43, P44) |
| LP4 | lower_pull slot 1 = hamstrings/glutes compound (deadlift-first) | **PASS** (P41, P42) |
| LP5 | lower_push slot 1 = quads/glutes compound (squat-first) | **PASS** (P43, P44) |
| PUSH_FULL | chest+shoulders → push (pas upper) | **PASS** (P45) |
| PULL_FULL | back+arms → pull (pas upper) | **PASS** (P46) |
| 2J | 2j = fullbody toujours, quel que soit le niveau | **PASS** (P50) |

---

## Problèmes ouverts détectés dans P41–P50

### Bugs / anomalies logicielles

**Aucun FAIL technique** sur les 10 profils. Toutes les assertions de code passent.

### Réserves coach récurrentes

**1. Timing systématiquement sous-estimé pour la force (P43, P50)**
- Cause : adjustedSlotCount réduit le nombre de slots mais pas assez. 6 slots × strength = ~85 min pour 60 min ; 9 slots × strength 90 min = ~115 min.
- Recommandation : pour goal='strength', plafonner à 4-5 slots max en 60 min, 6-7 en 90 min.

**2. Timing légèrement sous-estimé en hypertrophie 60 min pour lower_pull/lower_push (P41, P42, P44)**
- 9 slots hypertrophie ≈ 62-70 min sans warmup/core. Avec warmup/core : 70-78 min.
- Recommandation : cap à 7-8 slots pour sessionDuration=60, non-strength.

**3. Biceps absent en push day avec focus 'arms' (P47)**
- Pattern : chest+arms → 'push' → slots push sans biceps. L'utilisateur attend des curls.
- Recommandation : le wizard pourrait afficher un avertissement "les biceps ne sont pas dans un push day".

**4. Triceps absent en pull day avec focus 'arms' (P46)**
- Symétrique : back+arms → 'pull' → slots pull sans triceps.
- Même recommandation d'avertissement.

**5. Déséquilibre push/pull pour focusMuscles exclusivement push ou exclusivement pull (P44, P45, P46)**
- 2-3 sessions push ou pull par semaine sans contrepartie = risque posture/blessure épaule à terme.
- Recommandation : le wizard pourrait suggérer d'ajouter 'back' si seul 'chest/shoulders' est sélectionné.

**6. lower_push fullbody 2j advanced en strength — timing impossible (P50)**
- 4 composés force 5×3-5 à 180s repos = 70 min pour les composés seuls.
- Recommandation : pour advanced strength 2j, limiter à 4-5 exercices (3-4 composés + 1-2 isolations).

**7. Slot quads isolation sans machine (P43 BB+DB strength)**
- leg extension = machine ; sans machine ni câble, le slot peut être vide (null silencieux).
- Recommandation : ajouter des exercices isolation quads en dumbbell dans le seed (Bulgarian split squat en isolation ?) ou fallback sur compound.
