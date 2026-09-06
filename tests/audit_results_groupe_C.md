# Audit P21–P26 — Groupe C : Equipment × slot

> Sources lues : `audit_prompt_v3.md`, `programGenerator.ts`, `exercises-seed.json` (intégralité, 8 passes).

---

## Catalogue d'exercices — référence rapide (non-warmup, non-deleted, popularity > 0)

| id | Muscle primaire | Équipement | Cat | Pop |
|----|----------------|-----------|-----|-----|
| seed-bench-barbell | chest | barbell | cmp | 8 |
| seed-squat-barbell | quads | barbell | cmp | 8 |
| seed-row-barbell | back_thickness | barbell | cmp | 7 |
| seed-incline-bench-barbell | chest_upper | barbell | cmp | 4 |
| seed-hip-thrust | glutes | barbell | cmp | 4 |
| seed-ohp-barbell | shoulders | barbell | cmp | 3 |
| seed-romanian-deadlift | hamstrings | barbell | cmp | 3 |
| seed-deadlift | back | barbell | cmp | 3 |
| seed-curl-barbell | biceps | barbell | iso | 3 |
| seed-front-squat | quads | barbell | cmp | 2 |
| seed-row-tbar | back_thickness | barbell | cmp | 2 |
| seed-skullcrusher | triceps | barbell | iso | 2 |
| seed-curl-preacher | biceps | barbell | iso | 2 |
| seed-upright-row-barbell | shoulders_lateral | barbell | cmp | 2 |
| seed-close-grip-bench | triceps | barbell | cmp | 2 |
| seed-decline-bench-barbell | chest_lower | barbell | cmp | 1 |
| seed-good-morning | hamstrings | barbell | cmp | 1 |
| seed-wrist-curl | forearms | barbell | iso | 1 |
| seed-reverse-wrist-curl | forearms | barbell | iso | 1 |
| seed-bench-dumbbell | chest | dumbbell | cmp | 3 |
| seed-shoulder-press-dumbbell | shoulders | dumbbell | cmp | 3 |
| seed-curl-dumbbell | biceps | dumbbell | iso | 3 |
| seed-curl-hammer | biceps | dumbbell | iso | 3 |
| seed-lateral-raise | shoulders_lateral | dumbbell | iso | 3 |
| seed-pullover-dumbbell | back_thickness | dumbbell | iso | 3 |
| seed-row-dumbbell | back_thickness | dumbbell | cmp | 3 |
| seed-arnold-press | shoulders | dumbbell | cmp | 2 |
| seed-incline-bench-dumbbell | chest_upper | dumbbell | cmp | 2 |
| seed-fly-dumbbell | chest | dumbbell | iso | 2 |
| seed-rear-delt-fly | shoulders_rear | dumbbell | iso | 2 |
| seed-triceps-overhead | triceps | dumbbell | iso | 2 |
| seed-curl-incline | biceps | dumbbell | iso | 2 |
| seed-lunges | quads | dumbbell | cmp | 2 |
| seed-bulgarian-split-squat | quads | dumbbell | cmp | 2 |
| seed-shrug | back | dumbbell | iso | 2 |
| dumbbell-rdl | hamstrings | dumbbell | cmp | 2 |
| seed-triceps-kickback | triceps | dumbbell | iso | 1 |
| seed-curl-concentration | biceps | dumbbell | iso | 1 |
| seed-front-raise | shoulders_front | dumbbell | iso | 1 |
| seed-pullover | back_width | dumbbell | iso | 1 |
| seed-lat-pulldown | back_width | cable | cmp | 3 |
| seed-triceps-rope | triceps | cable | iso | 3 |
| seed-triceps-pushdown | triceps | cable | iso | 3 |
| seed-row-cable | back_thickness | cable | cmp | 2 |
| seed-face-pull | shoulders_rear | cable | iso | 2 |
| seed-curl-cable | biceps | cable | iso | 2 |
| seed-fly-cable | chest | cable | iso | 2 |
| seed-lateral-raise-cable | shoulders_lateral | cable | iso | 2 |
| seed-pullover-cable | back_thickness | cable | iso | 2 |
| seed-straight-arm-pulldown | back_thickness | cable | iso | 2 |
| seed-upright-row-cable | shoulders_lateral | cable | cmp | 2 |
| seed-cable-crunch | core | cable | iso | 2 |
| seed-glute-kickback | glutes | cable | iso | 1 |
| seed-leg-press | quads | machine | cmp | 3 |
| seed-leg-extension | quads | machine | iso | 3 |
| seed-leg-curl-lying | hamstrings | machine | iso | 3 |
| seed-chest-press-machine | chest | machine | cmp | 3 |
| seed-shoulder-press-machine | shoulders | machine | cmp | 3 |
| seed-calf-raise-seated | calves | machine | iso | 2 |
| seed-calf-raise-standing | calves | machine | iso | 2 |
| seed-hack-squat | quads | machine | cmp | 2 |
| seed-leg-curl-seated | hamstrings | machine | iso | 2 |
| seed-leg-curl-standing | hamstrings | machine | iso | 2 |
| seed-hip-abduction | glutes | machine | iso | 2 |
| seed-hip-adduction-machine | glutes | machine | iso | 2 |
| seed-row-machine | back_thickness | machine | cmp | 1 |
| seed-pullup | back_width | bodyweight | cmp | 3 |
| bw-chinup | biceps | bodyweight | cmp | 3 |
| seed-plank | core | bodyweight | iso | 3 |
| seed-hip-thrust-bw | glutes | bodyweight | cmp | 4 |
| seed-glute-bridge | glutes | bodyweight | iso | 3 |
| seed-dips | chest_lower | bodyweight | cmp | 3 |
| seed-pushup | chest | bodyweight | cmp | 2 |
| bw-squat | quads | bodyweight | cmp | 3 |
| bw-calf-raise | calves | bodyweight | iso | 2 |
| bw-lunge | quads | bodyweight | cmp | 2 |
| bw-nordic-curl | hamstrings | bodyweight | cmp | 2 |
| bw-incline-pushup | chest_upper | bodyweight | cmp | 2 |
| bw-wall-sit | quads | bodyweight | iso | 2 |
| seed-donkey-kick | glutes | bodyweight | iso | 2 |
| seed-fire-hydrant | glutes | bodyweight | iso | 2 |
| seed-triceps-dips | triceps | bodyweight | cmp | 2 |
| bw-pike-pushup | shoulders | bodyweight | cmp | 1 |
| bw-jump-squat | quads | bodyweight | cmp | 1 |
| seed-curtsy-lunge | glutes | bodyweight | cmp | 1 |
| bw-inverted-row | back_thickness | bodyweight | cmp | 1 |
| band-squat | quads | band | cmp | 2 |
| band-row | back_thickness | band | cmp | 2 |
| band-overhead-press | shoulders | band | cmp | 2 |
| band-hip-thrust | glutes | band | cmp | 2 |
| band-curl | biceps | band | iso | 2 |
| band-tricep-pushdown | triceps | band | iso | 2 |
| band-chest-press | chest | band | cmp | 1 |
| band-good-morning | hamstrings | band | cmp | 1 |

> **Note :** `seed-band-pull-apart` (shoulders_rear, band) est **isWarmupExercise:true** → exclu de `available`, présent dans `warmupPool` uniquement si band ∈ allowed. `seed-glute-bridge` (glutes, bodyweight, iso, pop:3) non-warmup, `seed-glute-bridge-warmup` est warmup.

---

## P21 — Bodyweight only, hypertrophie, 3j, beginner

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:['bodyweight'], level:'beginner' }
```

### Étape 1 — workoutTypeFromFocus
Pas de focusMuscles → `null`

### Étape 2 — selectSplit (ligne 302–306)
`daysPerWeek:3`, `isMass:true`, `level:'beginner'`
→ branche beginner 3j : `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`
Noms : "Full Body A", "Full Body B", "Full Body C"

### Étape 3 — adjustedSlotCount
`adjustedSlotCount(9, 60)` = 9 slots (durée=60, retourne base=9)

### Étape 4 — Sélection d'exercices

**available (BW uniquement, non-warmup, non-deleted, pop>0) :**
quads cmp : bw-squat(3), bw-lunge(2), bw-jump-squat(1)
chest cmp : seed-pushup(2), bw-incline-pushup(2)
back_width cmp : seed-pullup(3)
back_thickness cmp : bw-inverted-row(1)
glutes cmp : seed-hip-thrust-bw(4), seed-curtsy-lunge(1)
hamstrings cmp : bw-nordic-curl(2) [seul]
hamstrings iso : **aucune** → fallback sur compound
shoulders cmp : bw-pike-pushup(1)
biceps cmp : bw-chinup(3) [seul, compound]
triceps cmp : seed-triceps-dips(2) [seul, compound]
calves iso : bw-calf-raise(2)
chest_lower cmp : seed-dips(3)
shoulders_rear : **aucune** (band-pull-apart est warmup, exclu)
shoulders_lateral : **aucune**
glutes iso : seed-donkey-kick(2), seed-fire-hydrant(2), seed-glute-bridge(3)

**warmupPool (BW)** : seed-bird-dog(2), seed-cat-cow(2), seed-shoulder-circles(1), seed-walking-lunges(2), seed-glute-bridge-warmup(2), seed-bodyweight-squat(2), seed-mountain-climbers(2), seed-jumping-jacks(2), seed-dead-bug(2), seed-good-morning-bw(1), seed-superman(1), seed-worlds-greatest-stretch(1), seed-leg-swings(1), seed-hip-9090(1), seed-thoracic-rotation(1), seed-inchworm(1)
→ Session 0 : warmupPool[0] = `seed-bird-dog`
→ Session 1 : warmupPool[1] = `seed-cat-cow`
→ Session 2 : warmupPool[2] = `seed-shoulder-circles`

**corePool (BW)** (ordre JSON) : seed-scissors(1), seed-crunch(2), seed-bicycle-crunch(2), seed-vertical-leg-crunch(1), bw-hollow-body(1), seed-side-plank(2), seed-russian-twist(1), seed-plank(3), seed-leg-raise(2), seed-hanging-leg-raise(2), seed-ab-wheel(1), seed-heel-touch(1)
→ Session 0 : corePool[0] = `seed-scissors`
→ Session 1 : corePool[1] = `seed-crunch`
→ Session 2 : corePool[2] = `seed-bicycle-crunch`

---

**Full Body A (fullbody-quad, usedGlobally = ∅) :**

| # | Slot (muscles) | Cmp? | Top-3 candidats (pop desc) | Exercice retenu | Séries×Reps |
|---|---------------|------|---------------------------|-----------------|-------------|
| 0 | warmup | — | — | seed-bird-dog | 2×10 |
| 1 | quads/glutes | cmp | bw-squat(3), bw-lunge(2), bw-jump-squat(1) | **bw-squat** | 4×8-12 |
| 2 | chest/chest_upper | cmp | seed-pushup(2), bw-incline-pushup(2) | **seed-pushup** | 4×8-12 |
| 3 | back_width/back_thickness/back | cmp | seed-pullup(3), bw-inverted-row(1) | **seed-pullup** | 4×8-12 |
| 4 | shoulders/shoulders_front | cmp | bw-pike-pushup(1) seul | **bw-pike-pushup** | 4×8-12 |
| 5 | hamstrings | iso→fallback | bw-nordic-curl(2) seul | **bw-nordic-curl** | 3×10-15 |
| 6 | shoulders_rear | iso | **aucun candidat BW** | — slot vide — | — |
| 7 | biceps | iso→fallback | bw-chinup(3) seul | **bw-chinup** | 3×10-15 |
| 8 | triceps | iso→fallback | seed-triceps-dips(2) seul | **seed-triceps-dips** | 3×10-15 |
| 9 | calves | iso | bw-calf-raise(2) seul | **bw-calf-raise** | 3×10-15 |
| 10 | core | — | — | seed-scissors | 3×15 |

usedGlobally après A : {bw-squat, seed-pushup, seed-pullup, bw-pike-pushup, bw-nordic-curl, bw-chinup, seed-triceps-dips, bw-calf-raise}
Total exercices A : 8 slots effectifs + warmup + core = **10**

---

**Full Body B (fullbody-hip, usedGlobally = {bw-squat, seed-pushup, seed-pullup, bw-pike-pushup, bw-nordic-curl, bw-chinup, seed-triceps-dips, bw-calf-raise}) :**

Slots fullbody-hip :
```
hamstrings/glutes cmp | chest/chest_upper cmp | back_width/back cmp | shoulders/shoulders_front cmp
quads iso | shoulders_lateral/shoulders_rear iso | biceps iso | triceps iso | calves iso
```

| # | Slot | Exercice retenu | Note |
|---|------|-----------------|------|
| 0 | warmup | seed-cat-cow | rotation |
| 1 | hamstrings/glutes cmp | **seed-hip-thrust-bw** (pop:4, non utilisé) | bw-nordic-curl utilisé → hip-thrust-bw |
| 2 | chest/chest_upper cmp | **bw-incline-pushup** (pop:2, non utilisé) | seed-pushup utilisé |
| 3 | back_width/back cmp | **seed-pullup** (pop:3, UTILISÉ — seul candidat BW) | Répétition forcée |
| 4 | shoulders/shoulders_front cmp | **bw-pike-pushup** (pop:1, UTILISÉ — seul) | Répétition forcée |
| 5 | quads iso | **bw-wall-sit** (isolation, pop:2) | bw-squat utilisé mais bw-wall-sit dispo |
| 6 | shoulders_lat/rear iso | — slot vide — | Aucun BW shoulders_lateral ni shoulders_rear |
| 7 | biceps iso→fallback | **bw-chinup** (UTILISÉ — seul) | Répétition forcée |
| 8 | triceps iso→fallback | **seed-triceps-dips** (UTILISÉ — seul) | Répétition forcée |
| 9 | calves iso | **bw-calf-raise** (UTILISÉ — seul) | Répétition forcée |
| 10 | core | seed-crunch | rotation |

usedGlobally après B += {seed-hip-thrust-bw, bw-incline-pushup, bw-wall-sit}

---

**Full Body C (fullbody-quad, usedGlobally étendu) :**

| # | Slot | Exercice retenu | Note |
|---|------|-----------------|------|
| 0 | warmup | seed-shoulder-circles | rotation |
| 1 | quads/glutes cmp | **bw-lunge** (pop:2, non utilisé) | bw-squat/hip-thrust-bw utilisés |
| 2 | chest/chest_upper cmp | **seed-pushup** (UTILISÉ — bw-incline-pushup aussi utilisé) | Répétition forcée |
| 3 | back_width/back_thickness/back cmp | **bw-inverted-row** (pop:1, non utilisé) | seed-pullup utilisé |
| 4 | shoulders cmp | **bw-pike-pushup** (UTILISÉ — seul) | Répétition forcée |
| 5 | hamstrings iso→fallback | **bw-nordic-curl** (UTILISÉ — seul) | Répétition forcée |
| 6 | shoulders_rear iso | — slot vide — | |
| 7 | biceps iso→fallback | **bw-chinup** (UTILISÉ — seul) | Répétition forcée |
| 8 | triceps iso→fallback | **seed-triceps-dips** (UTILISÉ — seul) | Répétition forcée |
| 9 | calves iso | **bw-calf-raise** (UTILISÉ — seul) | Répétition forcée |
| 10 | core | seed-bicycle-crunch | rotation |

### Étape 5 — Séries×Reps
Goal hypertrophie, 60 min → pas d'ajustement (`adjustedSpec` retourne le spec brut pour 60/90 min).
- Compound : `COMPOUND_SPEC.hypertrophy` → 4 séries, 8-12 reps, repos 90s
- Isolation : `ISOLATION_SPEC.hypertrophy` → 3 séries, 10-15 reps, repos 75s
- Warmup : 2×10, repos 0s
- Core : 3×15, repos 60s

### progressStepKg / autoProgress
`makeDraftWE` (ligne 501-502) : `progressStepKg = equipment === 'bodyweight' ? 0 : 2.5`
Tous les exercices BW → `progressStepKg: 0`
`autoProgress: true` (valeur par défaut) — seul le warmup reçoit `autoProgress: false` (ligne 693)

### Assertions [PASS/FAIL]

- Split `['fullbody-quad','fullbody-hip','fullbody-quad']` (beginner 3j) : **PASS** (ligne 306)
- Aucun exercice non-BW dans la sortie : **PASS**
- `progressStepKg: 0` pour tous les exercices BW : **PASS** (ligne 502)
- `autoProgress: false` pour les exercices de slots : **FAIL** — `autoProgress` = `true` par défaut ; seul le warmup reçoit `false` (ligne 693). Les exercices de slots ont `autoProgress:true`, `progressStepKg:0`.
- Slot `shoulders_rear` vide : **PASS** (aucun exercice BW shoulders_rear non-warmup)

### Évaluation coach

**Équilibre musculaire :**
- Dos couvert par pullup (back_width) ✓, mais aucun rowing vertical possible → pas de back_thickness compound BW sauf bw-inverted-row (pop:1, peu connu)
- Épaules très limites : seul bw-pike-pushup pour OHP compound (1 seul candidat)
- Mollets, ischiojambiers, biceps, triceps : 1 seul exercice disponible → répétitions garanties dès B
- Épaules arrière/latérales : slots **toujours vides** — pas de mouvement BW pour shoulders_rear ou shoulders_lateral non-warmup dans le seed

**Cohérence objectif :**
- Hypertrophie 4×8-12 sur des pompes et squats BW : charge insuffisante pour un intermédiaire ou un pratiquant régulier. Pour un débutant strict, acceptable.

**Durée/contenu :**
- 10 exercices × ~4 min = ~40 min effectifs : créneau 60 min tenu (repos 90s hypertrophie absorbés)

**Qualité équipement :**
- BW exploité au maximum de ce que le seed permet ✓
- Pool trop étroit : 5-6 exercices de slots effectifs seulement, contre 9 slots théoriques
- Slot shoulders_rear systématiquement vide sur les 3 sessions : manque de band-pull-apart non-warmup

**Variété inter-sessions :**
Sessions A/B ont une structure différenciée (fullbody-quad vs fullbody-hip) ✓
Mais en B et C : 5 exercices répétés sur 8 slots (pullup, pike-pushup, chinup, dips, calf-raise)
→ Verdict : **"Variété structurelle A/B, mais répétition quasi-totale dès la session B"**

**Couverture isolation :**
Pas de slot isolation pour shoulders (lateral/rear) → lacune problématique
Aucun leg curl machine ou ischio dédié → bw-nordic-curl en compound fallback
→ Verdict : **Lacunes problématiques** (shoulders_rear/lat manquants, ischio limité)

**Verdict global :** ⚠️ Problème mineur à modéré — programme fonctionnel pour un débutant absolu mais avec un pool d'exercices insuffisant pour 3 sessions distinctes en BW seul. Recommandation : ajouter des exercices BW non-warmup pour shoulders_rear (ex. reverse snow angel) et calves isolation.

---

## P22 — Haltères seuls, hypertrophie, 3j, beginner

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:['dumbbell'], level:'beginner' }
```

### Étapes 1–2
workoutTypeFromFocus → null
selectSplit : 3j, isMass, beginner → `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`

### Étape 3 — adjustedSlotCount(9, 60) = 9

### Étape 4 — Sélection (BUG4 focus)

**Vérification BUG4 — slot dos compound en DB-only :**

Slot fullbody-quad #3 : `{ muscles: ['back_width', 'back_thickness', 'back'], compound: true }`

Candidats DB avec primaryMuscle ∈ ['back_width', 'back_thickness', 'back'] :
- `seed-row-dumbbell` (back_thickness, **compound**, pop:3) ✓
- `seed-pullover-dumbbell` (back_thickness, isolation, pop:3) — filtré car compound preferred
- `seed-pullover` (back_width, isolation, pop:1) — filtré
- `seed-shrug` (back, isolation, pop:2) — filtré

Filtre compound : `seed-row-dumbbell` (seul compound) → **slot non vide**
→ BUG4 : **PASS** — `back_thickness` est bien dans les muscles du slot (ligne 152-153), donc `seed-row-dumbbell` qualifie.

Le BUG4 aurait été déclenché si le slot n'avait listé que `['back_width']`. Avec `['back_width','back_thickness','back']`, le rowing haltère est qualifié.

**Full Body A (fullbody-quad) :**

| # | Slot (muscles) | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|---------------|-----------------|-----------------|-------------|
| 0 | warmup | — | seed-bird-dog | 2×10 |
| 1 | quads/glutes cmp | seed-lunges(2,db), seed-bulgarian-split-squat(2,db) | **seed-lunges** | 4×8-12 |
| 2 | chest/chest_upper cmp | seed-bench-dumbbell(3), seed-incline-bench-dumbbell(2) | **seed-bench-dumbbell** | 4×8-12 |
| 3 | back_width/back_thickness/back cmp | seed-row-dumbbell(3) seul compound | **seed-row-dumbbell** | 4×8-12 |
| 4 | shoulders/shoulders_front cmp | seed-shoulder-press-dumbbell(3), seed-arnold-press(2) | **seed-shoulder-press-dumbbell** | 4×8-12 |
| 5 | hamstrings iso→fallback | dumbbell-rdl(2) seul DB hamstrings | **dumbbell-rdl** | 3×10-15 |
| 6 | shoulders_rear iso | seed-rear-delt-fly(2) seul DB | **seed-rear-delt-fly** | 3×10-15 |
| 7 | biceps iso | seed-curl-dumbbell(3), seed-curl-hammer(3), seed-curl-incline(2) | **seed-curl-dumbbell** | 3×10-15 |
| 8 | triceps iso | seed-triceps-overhead(2), seed-triceps-kickback(1) | **seed-triceps-overhead** | 3×10-15 |
| 9 | calves iso | **aucun exercice DB calves** | — slot vide — | — |
| 10 | core | seed-scissors | | 3×15 |

usedGlobally après A : {seed-lunges, seed-bench-dumbbell, seed-row-dumbbell, seed-shoulder-press-dumbbell, dumbbell-rdl, seed-rear-delt-fly, seed-curl-dumbbell, seed-triceps-overhead}
Total : 8 slots effectifs + warmup + core = **10**

---

**Full Body B (fullbody-hip) :**

Slots fullbody-hip : hamstrings/glutes cmp | chest/chest_upper cmp | back_width/back cmp | shoulders cmp | quads iso | shoulders_lat/rear iso | biceps iso | triceps iso | calves iso

| # | Slot | Exercice retenu | Note |
|---|------|-----------------|------|
| 0 | warmup | seed-cat-cow | |
| 1 | hamstrings/glutes cmp | **dumbbell-rdl** (UTILISÉ — seul DB hamstrings) | Répétition forcée |
| 2 | chest/chest_upper cmp | **seed-incline-bench-dumbbell** (non utilisé) | |
| 3 | back_width/back cmp `['back_width','back']` | **seed-shrug** (back, iso, pop:2) | Aucun DB compound pour back_width ou back — fallback iso. seed-pullover(1) en second. |
| 4 | shoulders cmp | **seed-arnold-press** (non utilisé, pop:2) | seed-shoulder-press utilisé |
| 5 | quads iso→fallback | **seed-bulgarian-split-squat** (non utilisé, cmp fallback) | Aucun DB quads isolation |
| 6 | shoulders_lat/rear iso | **seed-lateral-raise** (non utilisé, pop:3) | seed-rear-delt-fly utilisé |
| 7 | biceps iso | **seed-curl-hammer** (non utilisé, pop:3) | seed-curl-dumbbell utilisé |
| 8 | triceps iso | **seed-triceps-kickback** (non utilisé, pop:1) | seed-triceps-overhead utilisé |
| 9 | calves iso | — slot vide — | Aucun DB calves |
| 10 | core | seed-crunch | |

---

**Full Body C (fullbody-quad) :**

| # | Slot | Exercice retenu | Note |
|---|------|-----------------|------|
| 0 | warmup | seed-shoulder-circles | |
| 1 | quads/glutes cmp | **seed-lunges** (tous DB quads utilisés — lunges retenu car pop:2 = bulgarian) | Répétition forcée |
| 2 | chest/chest_upper cmp | **seed-bench-dumbbell** (utilisé, bw-incline aussi utilisé) | Répétition forcée |
| 3 | back_width/back_thickness/back cmp | **seed-row-dumbbell** (utilisé — seul compound) | Répétition forcée |
| 4 | shoulders cmp | **seed-shoulder-press-dumbbell** (utilisé) | Répétition forcée |
| 5 | hamstrings iso→fallback | **dumbbell-rdl** (utilisé — seul) | Répétition forcée |
| 6 | shoulders_rear iso | **seed-rear-delt-fly** (utilisé — seul) | Répétition forcée |
| 7 | biceps iso | **seed-curl-incline** (non utilisé, pop:2) | |
| 8 | triceps iso | **seed-triceps-overhead** (utilisé — kickback aussi utilisé) | Répétition forcée |
| 9 | calves | — slot vide — | |
| 10 | core | seed-bicycle-crunch | |

### Assertions [PASS/FAIL]

- Split `['fullbody-quad','fullbody-hip','fullbody-quad']` : **PASS**
- BUG4 — slot dos compound non vide en DB-only : **PASS** (seed-row-dumbbell retenu)
- `back_thickness` dans muscles du slot compound back (ligne 152) : **PASS**
- Aucun exercice non-dumbbell : **PASS**
- Slot calves vide en DB-only (aucun dumbbell calves dans le seed) : **PASS** (comportement attendu, slot skippé)

### Évaluation coach

**Équilibre musculaire :**
- Push/pull respecté (bench + row) ✓
- Slot back_width : fallback sur shrug (isolation "dos général") en session B — tirage vertical absent en DB-only (pullup est BW, lat pulldown est câble) → back_width mal couvert

**Cohérence objectif :**
- 4×8-12 hypertrophie ✓
- dumbbell-rdl en compound ET isolation hamstrings → même exercice dans deux rôles différents entre sessions

**Équipement :**
- Pas de calves DB dans le seed → slot calves systématiquement vide (3 sessions)
- Pas de quads isolation DB → fallback Bulgarian split squat (compound) pour le slot iso

**Variété :**
- Session C quasiment identique à A (mêmes exercices, pool épuisé)
- Verdict : **"Variété exercices uniquement A→B, Répétition partielle B→C"**

**Verdict global :** ⚠️ Problème mineur — BUG4 bien corrigé (row-dumbbell qualifié). Lacune notable : absence de calves DB et de quads isolation DB dans le seed limite la qualité du programme.

---

## P23 — BB+DB strength, intermediate, 4j → Upper/Lower A/B

```
{ goal:'strength', daysPerWeek:4, sessionDuration:60, equipment:['barbell','dumbbell'], level:'intermediate' }
```

### Étape 1
workoutTypeFromFocus → null

### Étape 2 — selectSplit (ligne 309–310)
`daysPerWeek:4`, `isMass:true` → `['upper-push', 'lower-quad', 'upper-pull', 'lower-hip']`
Noms : "Upper — Haut du corps A", "Lower — Bas du corps A", "Upper — Haut du corps B", "Lower — Bas du corps B"

### Étape 3 — adjustedSlotCount
- upper-push / upper-pull : base = 8 slots → `adjustedSlotCount(8, 60)` = 8
- lower-quad / lower-hip : base = 6 slots → `adjustedSlotCount(6, 60)` = 6

Specs strength :
- Compound : 5 séries, 3-5 reps, repos 180s
- Isolation : 3 séries, 5-8 reps, repos 120s

Tri strength compound (ligne 473-475) : `strengthEquipmentPrio` → barbell(0) < machine(1) = cable(1) < dumbbell(2) < band(3) < bodyweight(4)

### Étape 4 — Session 1 : upper-push

Slots : chest/chest_upper cmp | back/width/thickness cmp | shoulders cmp | chest isol | triceps isol | shoulders_lat isol | biceps isol | back_thickness isol

| # | Slot | Top-3 candidats (pop × équip) | Exercice probable (intermédiaire) | Séries×Reps |
|---|------|-------------------------------|----------------------------------|-------------|
| 0 | warmup | — | seed-bird-dog | 2×10 |
| 1 | chest/chest_upper cmp ★ | **seed-bench-barbell(8,bb)**, seed-incline-bench-barbell(4,bb), seed-bench-dumbbell(3,db) | seed-bench-barbell (random top-3, bb favori) | 5×3-5 |
| 2 | back_width/thickness/back cmp | **seed-row-barbell(7,bb)**, seed-deadlift(3,bb), seed-row-tbar(2,bb) | seed-row-barbell (random top-3) | 5×3-5 |
| 3 | shoulders/shoulders_front cmp | **seed-ohp-barbell(3,bb)**, seed-shoulder-press-dumbbell(3,db), seed-arnold-press(2,db) | seed-ohp-barbell (bb prioritaire) | 5×3-5 |
| 4 | chest/chest_lower/chest_upper isol | seed-fly-dumbbell(2,db) seul isol | **seed-fly-dumbbell** | 3×5-8 |
| 5 | triceps isol | seed-skullcrusher(2,bb), seed-triceps-overhead(2,db), seed-triceps-kickback(1,db) | random top-3 | 3×5-8 |
| 6 | shoulders_lateral isol | seed-lateral-raise(3,db) seul isol | **seed-lateral-raise** | 3×5-8 |
| 7 | biceps isol | seed-curl-barbell(3,bb), seed-curl-dumbbell(3,db), seed-curl-hammer(3,db) | random top-3 | 3×5-8 |
| 8 | back_thickness/back isol | seed-pullover-dumbbell(3,db), seed-shrug(2,db) | random top-2 | 3×5-8 |
| 9 | core | seed-scissors | | 3×15 |

★ Assertion P23 : slot chest compound → barbell prioritaire. Top-3 = [seed-bench-barbell, seed-incline-bench-barbell, seed-decline-bench-barbell]. Tous BB. **PASS**.

### Session 2 : lower-quad

Slots : quads/glutes cmp | hamstrings/glutes cmp | quads isol | hamstrings isol | glutes isol | calves isol

| # | Slot | Top-3 candidats | Exercice probable | Séries×Reps |
|---|------|-----------------|-------------------|-------------|
| 0 | warmup | — | seed-cat-cow | 2×10 |
| 1 | quads/glutes cmp ★★ | **seed-squat-barbell(8,bb)**, seed-hip-thrust(4,bb), seed-front-squat(2,bb) | seed-squat-barbell (bb prioritaire) | 5×3-5 |
| 2 | hamstrings/glutes cmp | seed-hip-thrust(4,bb), seed-romanian-deadlift(3,bb), seed-good-morning(1,bb) | random top-3 | 5×3-5 |
| 3 | quads isol→fallback cmp | seed-front-squat(2,bb), seed-lunges(2,db), seed-bulgarian-split-squat(2,db) | random top-3 (aucun isol BB/DB quads) | 3×5-8 |
| 4 | hamstrings isol→fallback | dumbbell-rdl(2,db), seed-good-morning(1,bb) | dumbbell-rdl ou good-morning | 3×5-8 |
| 5 | glutes isol | **— slot vide —** | Aucun glutes isolation BB/DB | — |
| 6 | calves isol | **— slot vide —** | Aucun calves BB/DB | — |
| 7 | core | seed-bicycle-crunch | | 3×15 |

★★ Assertion : squat slot → barbell squat, pas goblet squat. **PASS** (goblet-squat est kettlebell, exclu de available).

### Session 3 : upper-pull

Slots : back_width/back cmp | back_thickness/back cmp | chest/chest_upper cmp | shoulders_rear isol | biceps isol | back_thickness/back isol | triceps isol | shoulders_lateral isol

| # | Slot | Top-3 candidats | Exercice probable | Séries×Reps |
|---|------|-----------------|-------------------|-------------|
| 0 | warmup | seed-shoulder-circles | | 2×10 |
| 1 | back_width/back cmp | seed-deadlift(3,bb) [seul bb back_width/back], seed-row-dumbbell(3,db) | seed-deadlift ou row-dumbbell | 5×3-5 |
| 2 | back_thickness/back cmp | seed-row-barbell(7,bb), seed-row-tbar(2,bb), seed-row-dumbbell(3,db) | random top-3 (bb first) | 5×3-5 |
| 3 | chest/chest_upper cmp | seed-bench-barbell(8,bb), seed-incline-bench-barbell(4,bb), seed-bench-dumbbell(3,db) | random top-3 non utilisé | 5×3-5 |
| 4 | shoulders_rear isol | seed-rear-delt-fly(2,db) seul | **seed-rear-delt-fly** | 3×5-8 |
| 5 | biceps isol | seed-curl-barbell(3,bb), seed-curl-dumbbell(3,db), seed-curl-hammer(3,db) | random top-3 | 3×5-8 |
| 6 | back_thickness/back isol | seed-pullover-dumbbell(3,db), seed-shrug(2,db) | random top-2 | 3×5-8 |
| 7 | triceps isol | seed-skullcrusher(2,bb), seed-triceps-overhead(2,db), seed-triceps-kickback(1,db) | random top-3 | 3×5-8 |
| 8 | shoulders_lateral isol | seed-lateral-raise(3,db) | **seed-lateral-raise** | 3×5-8 |
| 9 | core | seed-vertical-leg-crunch | | 3×15 |

### Session 4 : lower-hip

Slots : glutes/hamstrings cmp | quads/glutes cmp | glutes isol | hamstrings isol | quads isol | calves isol

| # | Slot | Top-3 candidats | Exercice probable | Séries×Reps |
|---|------|-----------------|-------------------|-------------|
| 0 | warmup | seed-dead-bug | | 2×10 |
| 1 | glutes/hamstrings cmp | seed-hip-thrust(4,bb), seed-romanian-deadlift(3,bb), seed-good-morning(1,bb) | random top-3 | 5×3-5 |
| 2 | quads/glutes cmp | seed-squat-barbell(8,bb), seed-front-squat(2,bb), seed-lunges(2,db) | random top-3 | 5×3-5 |
| 3 | glutes isol | **— slot vide —** | Aucun glutes iso BB/DB | — |
| 4 | hamstrings isol→fallback | dumbbell-rdl(2,db), seed-good-morning(1,bb) | | 3×5-8 |
| 5 | quads isol→fallback | seed-front-squat(2,bb), seed-lunges(2,db), seed-bulgarian-split-squat(2,db) | | 3×5-8 |
| 6 | calves isol | **— slot vide —** | Aucun calves BB/DB | — |
| 7 | core | seed-leg-raise | | 3×15 |

### Assertions [PASS/FAIL]

- Split `['upper-push','lower-quad','upper-pull','lower-hip']` : **PASS** (ligne 310)
- `scoreEquip(strength, barbell) < scoreEquip(strength, dumbbell)` → prio bb (0 < 2) : **PASS** (ligne 424-434)
- Slot chest compound → barbell en top-3, barbell prioritaire : **PASS**
- Slot squat → seed-squat-barbell (bb, pop:8) en tête : **PASS**
- Slots glutes isolation et calves vides (aucun BB/DB dans le seed) : attendu, **PASS comportemental**

### autoProgress / progressStepKg P23
BB/DB exercises → `progressStepKg: 2.5`, `autoProgress: true` ✓

### Évaluation coach

**Qualité équipement :**
- Barbell bien prioritaire sur compound en strength ✓
- Excellent pour les composés majeurs (squat, bench, row, OHP)
- Manque isolation glutes et mollets (aucun BB/DB disponible dans seed)

**Cohérence objectif :**
- 5×3-5 sur compound strength ✓ — approprié pour force
- 3×5-8 sur isolation — cohérent avec strength (force-endurance)
- Repos 180s/120s — correct pour développement force

**Variété :**
- Structure différenciée upper-push/upper-pull ✓ (bench-first vs traction-first)
- Structure différenciée lower-quad/lower-hip ✓ (squat-dominant vs hip-dominant)
- intermediate → pickExercise random top-3 → rotation naturelle ✓

**Lacunes :**
- 2 slots systématiquement vides sur lower-quad ET lower-hip : glutes isolation + calves isolation
- Hamstrings isolation : fallback sur compound (dumbbell-rdl ou good-morning) — acceptable pour strength

**Verdict global :** ✅ Bon programme avec réserves sur les slots vides (glutes iso, calves iso). Structure BB+DB strength bien implémentée.

---

## P24 — Machine+Cable only, hypertrophie, 3j, beginner

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:['machine','cable'], level:'beginner' }
```

### Étapes 1–2
workoutTypeFromFocus → null
selectSplit : 3j, isMass, beginner → `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`

### Étape 4 — Sélection

**available Machine+Cable (non-warmup, non-deleted, pop>0) :**
Muscle → exercices :
- quads cmp : seed-leg-press(3,mach), seed-hack-squat(2,mach)
- chest cmp : seed-chest-press-machine(3,mach)
- back_width cmp : seed-lat-pulldown(3,cable)
- back_thickness cmp : seed-row-cable(2,cable), seed-row-machine(1,mach)
- shoulders cmp : seed-shoulder-press-machine(3,mach)
- hamstrings iso : seed-leg-curl-lying(3,mach), seed-leg-curl-seated(2), seed-leg-curl-standing(2)
- quads iso : seed-leg-extension(3,mach)
- glutes iso : seed-hip-abduction(2,mach), seed-hip-adduction-machine(2,mach), seed-glute-kickback(1,cable)
- calves iso : seed-calf-raise-seated(2,mach), seed-calf-raise-standing(2,mach)
- triceps iso : seed-triceps-rope(3,cable), seed-triceps-pushdown(3,cable)
- biceps iso : seed-curl-cable(2,cable)
- shoulders_rear iso : seed-face-pull(2,cable)
- shoulders_lateral iso : seed-lateral-raise-cable(2,cable)
- shoulders_lateral cmp : seed-upright-row-cable(2,cable)
- back_thickness iso : seed-pullover-cable(2,cable), seed-straight-arm-pulldown(2,cable)
- chest iso : seed-fly-cable(2,cable)
- core : seed-cable-crunch(2,cable) + BW core pool

**MANQUANTS :** Aucun machine ou cable pour back_width machine ; aucun hamstrings/glutes compound machine/cable.

---

**Full Body A (fullbody-quad) :**

| # | Slot | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|------|-----------------|-----------------|-------------|
| 0 | warmup | — | seed-bird-dog | 2×10 |
| 1 | quads/glutes cmp | seed-leg-press(3,mach), seed-hack-squat(2,mach) | **seed-leg-press** | 4×8-12 |
| 2 | chest/chest_upper cmp | seed-chest-press-machine(3,mach) seul | **seed-chest-press-machine** | 4×8-12 |
| 3 | back_width/thickness/back cmp | seed-lat-pulldown(3,cable), seed-row-cable(2,cable), seed-row-machine(1,mach) | **seed-lat-pulldown** | 4×8-12 |
| 4 | shoulders cmp | seed-shoulder-press-machine(3,mach) seul | **seed-shoulder-press-machine** | 4×8-12 |
| 5 | hamstrings iso | seed-leg-curl-lying(3,mach), seed-leg-curl-seated(2), seed-leg-curl-standing(2) | **seed-leg-curl-lying** | 3×10-15 |
| 6 | shoulders_rear iso | seed-face-pull(2,cable) seul | **seed-face-pull** | 3×10-15 |
| 7 | biceps iso | seed-curl-cable(2,cable) seul | **seed-curl-cable** | 3×10-15 |
| 8 | triceps iso | seed-triceps-rope(3,cable), seed-triceps-pushdown(3,cable) | **seed-triceps-rope** | 3×10-15 |
| 9 | calves iso | seed-calf-raise-seated(2), seed-calf-raise-standing(2) | **seed-calf-raise-seated** | 3×10-15 |
| 10 | core | seed-scissors → mais cable-crunch disponible | corePool[0] = seed-scissors* | 3×15 |

*corePool pour Machine+Cable : le code filtre `allowed.has(ex.equipment) || ex.equipment === 'bodyweight'`. seed-cable-crunch (cable) → allowed.has('cable') = true. Mais les exercices BW core sont aussi inclus. corePool en ordre JSON : seed-scissors(BW), seed-crunch(BW), seed-cable-crunch(cable)... → corePool[0] = seed-scissors.

Total : 9 slots + warmup + core = **11 exercices**

---

**Full Body B (fullbody-hip) :**

usedGlobally = {seed-leg-press, seed-chest-press-machine, seed-lat-pulldown, seed-shoulder-press-machine, seed-leg-curl-lying, seed-face-pull, seed-curl-cable, seed-triceps-rope, seed-calf-raise-seated}

| # | Slot | Exercice retenu | Note |
|---|------|-----------------|------|
| 0 | warmup | seed-cat-cow | |
| 1 | hamstrings/glutes cmp | **seed-glute-kickback** (iso fallback, pop:1) | Aucun machine/cable hamstring ou glute compound → fallback iso |
| 2 | chest/chest_upper cmp | **seed-chest-press-machine** (UTILISÉ — seul) | Répétition forcée |
| 3 | back_width/back cmp `['back_width','back']` | **seed-lat-pulldown** (UTILISÉ — seul back_width cable) | Répétition forcée |
| 4 | shoulders cmp | **seed-shoulder-press-machine** (UTILISÉ — seul) | Répétition forcée |
| 5 | quads iso | **seed-leg-extension** (non utilisé, pop:3) | |
| 6 | shoulders_lat/rear iso | **seed-lateral-raise-cable** (non utilisé, pop:2) | seed-face-pull utilisé |
| 7 | biceps iso | **seed-curl-cable** (UTILISÉ — seul) | Répétition forcée |
| 8 | triceps iso | **seed-triceps-pushdown** (non utilisé, pop:3) | seed-triceps-rope utilisé |
| 9 | calves iso | **seed-calf-raise-standing** (non utilisé, pop:2) | |
| 10 | core | seed-crunch | |

**Problème majeur B :** slot 1 (hamstrings/glutes compound) → aucun machine/cable compound → fallback sur `seed-glute-kickback` (isolation cable, pop:1) — un kickback fessier comme premier exercice de la session fullbody-hip.

---

**Full Body C (fullbody-quad) :**

| # | Slot | Exercice retenu |
|---|------|-----------------|
| 0 | warmup | seed-shoulder-circles |
| 1 | quads/glutes cmp | **seed-hack-squat** (non utilisé, pop:2) |
| 2 | chest cmp | **seed-chest-press-machine** (utilisé 2×) |
| 3 | back cmp | **seed-lat-pulldown** (utilisé 2×) |
| 4 | shoulders cmp | **seed-shoulder-press-machine** (utilisé 2×) |
| 5 | hamstrings iso | **seed-leg-curl-seated** (non utilisé, pop:2) |
| 6 | shoulders_rear iso | **seed-face-pull** (utilisé — seul) |
| 7 | biceps iso | **seed-curl-cable** (utilisé 2×) |
| 8 | triceps iso | **seed-triceps-rope** (utilisé — pushdown aussi utilisé) → seed-triceps-rope retenu (push-down en usedGlobally, rope aussi) → les deux utilisés → seed-triceps-rope (pop:3 = pushdown) → ordre array : seed-triceps-rope avant |
| 9 | calves iso | **seed-calf-raise-seated** (utilisé) ou seed-calf-raise-standing (utilisé) → les deux utilisés → seed-calf-raise-seated (array order) |
| 10 | core | seed-bicycle-crunch |

### Assertions [PASS/FAIL]

- Aucun exercice barbell ou dumbbell : **PASS**
- Slot dos compound — lat pulldown (cable) identifié : **PASS** (seed-lat-pulldown, pop:3)
- Slot chest compound — machine chest press identifié : **PASS** (seed-chest-press-machine, pop:3)
- Slot hamstrings/glutes compound en fullbody-hip → fallback iso (glute-kickback) : anomalie comportementale — **à noter**

### Évaluation coach

**Qualité équipement :**
- Machine/Cable bien exploité pour les isolations : excellentes machines (leg curl, extension, calf raise) ✓
- Lat pulldown cable = meilleur substitut au pullup ✓
- **Manque critique** : aucun compound machine ou cable pour hamstrings ni glutes — la session fullbody-hip démarre avec un kickback fessier (isolation câble, pop:1) au lieu d'un composé hip-dominant

**Équilibre musculaire :**
- Sessions A/C : quads très bien couvertes (leg press + hack squat sur la semaine)
- Session B : glutes/hamstrings sous-stimulés (kickback seulement)
- Biceps : 1 seul exercice dans le seed (curl câble) → répétition garantie

**Variété :**
- 4 exercices structurellement répétés dès session B (chest press, lat pulldown, shoulder press machine, curl câble)
- Verdict : **"Variété partielle — pool machine trop restreint pour composés bas du corps"**

**Verdict global :** ⚠️ Problème modéré — filtrage équipement correct mais le seed ne couvre pas les composés bas du corps en machine/cable. Recommandation : ajouter des exercices machine pour hamstrings compound (leg press horizontal), ou marquer seed-leg-press comme glutes/quads compound utilisable pour fullbody-hip.

---

## P25 — Band+Bodyweight, fat_loss, 2j, beginner

```
{ goal:'fat_loss', daysPerWeek:2, sessionDuration:60, equipment:['band','bodyweight'], level:'beginner' }
```

### Étapes 1–2
workoutTypeFromFocus → null
selectSplit : 2j → `['fullbody-quad', 'fullbody-hip']`
Noms : "Full Body A", "Full Body B"

### Specs fat_loss
- Compound : 3 séries, 12-15 reps, repos 60s
- Isolation : 3 séries, 12-15 reps, repos 60s
- Warmup : 2×10, repos 0s / Core : 3×15, repos 60s

### available Band+BW (non-warmup, non-deleted, pop>0)

Band : band-squat(2), band-row(2), band-overhead-press(2), band-hip-thrust(2), band-curl(2), band-tricep-pushdown(2), band-chest-press(1), band-good-morning(1)
BW : seed-hip-thrust-bw(4), seed-glute-bridge(3), bw-squat(3), bw-chinup(3), seed-dips(3), seed-pullup(3), seed-pushup(2), bw-lunge(2), bw-nordic-curl(2), bw-calf-raise(2), bw-incline-pushup(2), bw-wall-sit(2), seed-donkey-kick(2), seed-fire-hydrant(2), seed-triceps-dips(2), seed-curtsy-lunge(1), bw-inverted-row(1), bw-pike-pushup(1), bw-jump-squat(1)

**Note critique :** `seed-band-pull-apart` (shoulders_rear, band) est `isWarmupExercise:true` → exclu de `available`, uniquement dans `warmupPool`.

**warmupPool Band+BW :** seed-band-pull-apart(2,band) en tête (premier en JSON), puis BW warmup
→ Session A (index 0) : seed-band-pull-apart
→ Session B (index 1) : seed-bird-dog

**corePool Band+BW :** BW core + aucun band core → même que P21
→ Session A (index 0) : seed-scissors
→ Session B (index 1) : seed-crunch

---

**Full Body A (fullbody-quad) :**

| # | Slot (muscles) | Top-3 candidats (pop desc) | Exercice retenu | Séries×Reps |
|---|---------------|---------------------------|-----------------|-------------|
| 0 | warmup | — | seed-band-pull-apart | 2×10 |
| 1 | quads/glutes cmp | seed-hip-thrust-bw(4,BW), bw-squat(3,BW), band-squat(2,band) | **seed-hip-thrust-bw** | 3×12-15 |
| 2 | chest/chest_upper cmp | seed-pushup(2,BW), bw-incline-pushup(2,BW), band-chest-press(1,band) | **seed-pushup** | 3×12-15 |
| 3 | back_width/thickness/back cmp | seed-pullup(3,BW), band-row(2,band), bw-inverted-row(1,BW) | **seed-pullup** | 3×12-15 |
| 4 | shoulders/shoulders_front cmp | band-overhead-press(2,band), bw-pike-pushup(1,BW) | **band-overhead-press** | 3×12-15 |
| 5 | hamstrings iso→fallback | bw-nordic-curl(2,BW), band-good-morning(1,band) | **bw-nordic-curl** | 3×12-15 |
| 6 | shoulders_rear iso | **— slot vide —** | Aucun BW/band shoulders_rear non-warmup | — |
| 7 | biceps iso | band-curl(2,band) [seul isolation] | **band-curl** | 3×12-15 |
| 8 | triceps iso | band-tricep-pushdown(2,band) [seul isolation] | **band-tricep-pushdown** | 3×12-15 |
| 9 | calves iso | bw-calf-raise(2,BW) seul | **bw-calf-raise** | 3×12-15 |
| 10 | core | seed-scissors | | 3×15 |

Total : 8 slots effectifs + warmup + core = **10 exercices**

Note coach : slot 1 retient seed-hip-thrust-bw (pop:4) pour quads/glutes — la fullbody-quad devrait commencer par un squat, mais l'algorithme choisit l'exercice de plus haute popularité (hip-thrust-bw). Résultat : la session A commence par un hip thrust, exercice hip-dominant, dans une session fullbody-**quad**.

---

**Full Body B (fullbody-hip) :**

usedGlobally = {seed-hip-thrust-bw, seed-pushup, seed-pullup, band-overhead-press, bw-nordic-curl, band-curl, band-tricep-pushdown, bw-calf-raise}

| # | Slot | Top-3 candidats | Exercice retenu | Note |
|---|------|-----------------|-----------------|------|
| 0 | warmup | — | seed-bird-dog | |
| 1 | hamstrings/glutes cmp | band-hip-thrust(2,non utilisé), band-good-morning(1,non utilisé), seed-curtsy-lunge(1,non utilisé) | **band-hip-thrust** | seed-hip-thrust-bw utilisé |
| 2 | chest/chest_upper cmp | bw-incline-pushup(2,non utilisé), band-chest-press(1) | **bw-incline-pushup** | seed-pushup utilisé |
| 3 | back_width/back cmp `['back_width','back']` | seed-pullup(3,UTILISÉ — seul back_width/back BW/band) | **seed-pullup** (répétition forcée) | bw-inverted-row a primaryMuscle:back_thickness, pas dans ce slot |
| 4 | shoulders cmp | bw-pike-pushup(1,non utilisé) | **bw-pike-pushup** | band-overhead-press utilisé |
| 5 | quads iso | bw-wall-sit(2,iso,non utilisé) | **bw-wall-sit** | |
| 6 | shoulders_lat/rear iso | **— slot vide —** | Aucun BW/band shoulders_lateral/rear non-warmup | |
| 7 | biceps iso | band-curl(UTILISÉ — seul iso biceps) | **band-curl** (répétition) | |
| 8 | triceps iso | band-tricep-pushdown(UTILISÉ — seul iso) | **band-tricep-pushdown** (répétition) | |
| 9 | calves iso | bw-calf-raise(UTILISÉ — seul) | **bw-calf-raise** (répétition) | |
| 10 | core | seed-crunch | | |

### Assertions [PASS/FAIL]

- Aucun exercice nécessitant haltère/barre/câble/machine : **PASS**
- Slot shoulders_rear vide (band-pull-apart est warmup → exclu de available) : **PASS** comportemental, anomalie sémantique
- fat_loss → 3×12-15, repos 60s : **PASS**
- autoProgress:true pour slots non-warmup, progressStepKg:0 (band et bodyweight) : **PASS** (partial — autoProgress:true, non false)

### Évaluation coach

**Objectif fat_loss / intensité :**
- 3×12-15 à 60s repos en circuit → bon stimulus cardio-force ✓
- Band + BW = faible résistance absolue → difficile de progresser au-delà d'un niveau intermédiaire
- hip-thrust-bw (pop:4) en slot 1 fullbody-quad : inadéquat pour une session quad-dominante

**Équilibre :**
- Slot shoulders_rear systématiquement vide (2 sessions) — déséquilibre push/pull vertical
- Biceps et triceps : 1 seul exercice disponible chacun → répétition totale dès session B

**Qualité band :**
- Band correctement utilisé pour press, row, curl, tricep, OHP ✓
- band-chest-press (pop:1) peu connu mais fonctionnel

**Verdict global :** ⚠️ Problème modéré — filtrage correct, mais pool Band+BW insuffisant (shoulders_rear absent hors warmup, biceps et triceps 1 exercice chacun). Programme acceptable pour un total débutant, insuffisant au-delà.

---

## P26 — Advanced strength PPL 3j → pickExercise random top-3

```
{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'advanced' }
```

### Étape 1
workoutTypeFromFocus → null

### Étape 2 — selectSplit (ligne 302)
`daysPerWeek:3`, `isMass:true` (strength), `level:'advanced'` (≠ 'beginner')
→ `if (isMass && level !== 'beginner') return ['push', 'pull', 'legs']`
Noms : "Push — Poussée", "Pull — Tirage", "Legs — Jambes"

### Vérification branche pickExercise (ligne 484-486)

```typescript
if (level === 'beginner') return candidates[0] ?? null  // ligne 484
const pool = candidates.slice(0, 3)                     // ligne 485
return pool[Math.floor(Math.random() * pool.length)] ?? null  // ligne 486
```

`level:'advanced'` → branche else → `candidates.slice(0,3)` + `Math.random()` ✓

### Étape 4 — Top-3 chest compound (Push, slot 0)

Slot : `{ muscles: ['chest', 'chest_upper', 'chest_lower'], compound: true }`
Goal : strength → `strengthEquipmentPrio` appliqué (barbell=0, machine=1, cable=1, dumbbell=2, bodyweight=4)

Candidats FULL avec primaryMuscle ∈ ['chest', 'chest_upper', 'chest_lower'] et category='compound' :

| id | Muscle | Equipment | Prio | Pop |
|----|--------|-----------|------|-----|
| seed-bench-barbell | chest | barbell | 0 | 8 |
| seed-incline-bench-barbell | chest_upper | barbell | 0 | 4 |
| seed-decline-bench-barbell | chest_lower | barbell | 0 | 1 |
| seed-bench-dumbbell | chest | dumbbell | 2 | 3 |
| seed-incline-bench-dumbbell | chest_upper | dumbbell | 2 | 2 |
| seed-dips | chest_lower | bodyweight | 4 | 3 |
| seed-pushup | chest | bodyweight | 4 | 2 |
| bw-incline-pushup | chest_upper | bodyweight | 4 | 2 |
| seed-chest-press-machine | chest | machine | 1 | 3 |

Tri : prio équipement (asc), puis usedGlobally, puis pop desc :
1. **seed-bench-barbell** (barbell, prio:0, pop:8)
2. **seed-incline-bench-barbell** (barbell, prio:0, pop:4)
3. **seed-decline-bench-barbell** (barbell, prio:0, pop:1)

→ `candidates.slice(0,3)` = [seed-bench-barbell, seed-incline-bench-barbell, seed-decline-bench-barbell]

Tous les 3 sont des exercices **barbell** (bench couché, incliné, décliné). Le random choisit l'un des trois.

**Les 3 candidats chest compound pour P26 (advanced, strength, FULL) :**
1. `seed-bench-barbell` — Développé couché barre (chest, barbell, pop:8)
2. `seed-incline-bench-barbell` — Développé incliné barre (chest_upper, barbell, pop:4)
3. `seed-decline-bench-barbell` — Développé décliné barre (chest_lower, barbell, pop:1)

### Programme Push complet (advanced, strength, FULL)

Slots push (6 slots, 60 min) :
```
chest/chest_upper/chest_lower cmp | shoulders/shoulders_front cmp
chest/chest_upper/chest_lower iso | triceps iso | shoulders_lateral/shoulders iso | triceps iso
```

| # | Slot | Top-3 candidats | Séries×Reps |
|---|------|-----------------|-------------|
| 0 | warmup | — | seed-bird-dog, 2×10 |
| 1 | chest cmp | seed-bench-barbell(8,bb), seed-incline-bench-barbell(4,bb), seed-decline-bench-barbell(1,bb) | 5×3-5 |
| 2 | shoulders cmp | seed-ohp-barbell(3,bb), seed-shoulder-press-dumbbell(3,db), seed-shoulder-press-machine(3,mach) | 5×3-5 |
| 3 | chest iso | seed-fly-dumbbell(2,db), seed-fly-cable(2,cable), seed-pec-deck(2,mach) | 3×5-8 |
| 4 | triceps iso | seed-triceps-rope(3,cable), seed-triceps-pushdown(3,cable), seed-skullcrusher(2,bb) | 3×5-8 |
| 5 | shoulders_lat/shoulders iso | seed-lateral-raise(3,db), seed-lateral-raise-cable(2,cable), seed-upright-row-cable(2,cable) | 3×5-8 |
| 6 | triceps iso | pool résiduel, ex. seed-skullcrusher ou seed-triceps-overhead | 3×5-8 |
| 7 | core | seed-scissors | 3×15 |

Note : slot 5 `{ muscles: ['shoulders_lateral', 'shoulders'], compound: false }` — seed-lateral-raise(3,db,iso) en tête d'isolation, top-3 random pour advanced.

### Assertions [PASS/FAIL]

- Split `['push','pull','legs']` (advanced strength 3j) : **PASS** (ligne 302)
- `level:'advanced'` → `pickExercise` utilise `candidates.slice(0,3)` + `Math.random()` (ligne 485-486) : **PASS**
- Top-3 chest compound = [seed-bench-barbell, seed-incline-bench-barbell, seed-decline-bench-barbell] (tous BB, barbell prioritaire en strength) : **PASS**
- Aucun exercice non-FULL : trivial (**PASS**)

### Évaluation coach

**Qualité équipement :**
- FULL équipement → accès optimal au barbell pour tous les composés ✓
- random top-3 advanced → variété séance à séance ✓

**Cohérence objectif :**
- 5×3-5 compound strength → optimal ✓
- Repos 180s → nécessaire pour la force ✓

**Variété inter-sessions :**
- 3 séances distinctes (push/pull/legs) → pas de répétition de type ✓
- random top-3 crée une variation naturelle sur plusieurs semaines ✓

**Réserve coach :**
- seed-decline-bench-barbell (pop:1) en top-3 — exercice rarement sélectionné dans les programmes standard; pression discale cervicale à surveiller
- Slot triceps apparaît 2× dans push (slots 4 et 6) — sur-représentation triceps

**Verdict global :** ✅ Bon programme — PPL strength advanced bien structuré. La logique random top-3 est correctement implémentée.

---

## Récapitulatif Groupe C

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|--------|----------------------|---------|-------------------|
| P21 BW 3j | autoProgress:false FAIL (true pour slots) ; shoulders_rear slot vide ×3 | ⚠️ PASS partiel | Répétitions massives dès session B ; pool BW trop petit pour 3 sessions distinctes ; slot shoulders vide systématique |
| P22 DB 3j | BUG4 PASS (seed-row-dumbbell qualifie) ; slot calves vide ×3 | ⚠️ PASS partiel | Calves absent en DB ; back_width couvert par shrug (isolation) en session B ; C ≈ A |
| P23 BB+DB strength 4j | Barbell prioritaire PASS ; squat barbell PASS ; glutes iso + calves vides | ✅ PASS | Slots glutes isolation et calves vides (aucun BB/DB dans seed) ; hamstrings fallback compound |
| P24 Machine+Cable 3j | Aucun barbell/dumbbell PASS ; lat pulldown = slot back_width PASS ; hamstrings/glutes compound absent → fallback iso | ⚠️ PASS partiel | Session fullbody-hip débute par kickback cable (isolation) faute de composé hip machine/cable ; biceps 1 seul exercice |
| P25 Band+BW fat_loss 2j | Aucun BB/DB/mach/cable PASS ; shoulders_rear vide (band-pull-apart warmup) | ⚠️ PASS partiel | Slot shoulders_rear vide ; hip-thrust-bw choisi en slot quads/glutes cmp fullbody-quad (incohérent) ; pool trop étroit pour fat_loss |
| P26 Advanced PPL strength | Split PPL PASS ; random top-3 PASS (ligne 485) ; top-3 chest = 3 BB PASS | ✅ PASS | Slot triceps ×2 dans push ; decline bench (pop:1) en top-3 peu courant |

### Problèmes récurrents identifiés (Groupe C)

**Bug / Anomalie logicielle :**
- **[SLOTS-VIDES-CALVES]** Aucun exercice calves pour les équipements DB, BB+DB, Band+BW → slot calves systématiquement vide pour ces profils. Correction : ajouter `bw-calf-raise` au seed (déjà présent, BW) → sera disponible pour BB+DB et Band+BW via `ex.equipment==='bodyweight'`? Non — `available` filtre sur `allowed.has(ex.equipment)` strictement. Correction requise : ajouter dumbbell-calf-raise ou barbell-calf-raise dans le seed.
- **[SLOTS-VIDES-SHOULDERS]** Aucun exercice `shoulders_rear` ou `shoulders_lateral` en BW non-warmup → slot vide pour BW et Band+BW. `seed-band-pull-apart` devrait exister en version non-warmup (ou un exercice BW shoulders_rear dédié ajouté).
- **[AUTOPROGRESS-ASSERTION]** Assertion P21 spécifie `autoProgress:false` pour BW — le code génère `autoProgress:true` avec `progressStepKg:0`. Fonctionnellement sans impact (progressStep=0 → pas de progression réelle), mais l'assertion est inexacte ou le code devrait forcer `autoProgress:false` quand `progressStepKg===0`.

**Réserves coach thématiques :**
1. **Pool BW/Band insuffisant** (P21, P25) : 3 sessions identiques de type = répétitions quasi totales. Le seed manque d'exercices BW pour épaules arrière/latérales et ischiojambiers isolation.
2. **Absence composé machine bas du corps** (P24) : pas de squat machine/cable, pas de RDL cable → fullbody-hip machine/cable démarre par une isolation (kickback).
3. **Slot calves vide** (P22, P23) : absence d'exercice calves pour dumbbell et barbell. Impact réel sur la complétude du programme lower.
4. **Hip-thrust-bw priorité haute dans slot quads/glutes** (P21, P25) : pop:4 le place avant le squat BW (pop:3) dans le slot fullbody-quad — incohérent avec l'intention quad-dominante de la session A.
