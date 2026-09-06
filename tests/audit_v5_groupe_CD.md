# Audit P21–P30 — Groupes C+D (v5)
**Date :** 2026-09-06
**Fichiers lus :** programGenerator.ts + exercises-seed.json (≈150 exercices) + audit_prompt_v3.md
**Changements depuis v4 :** BUG-1 (strength 90min → cap 5 slots) · SEED-1 (seed-calf-raise-db) · SEED-2 (band-face-pull + bw-prone-y-raise) · SEED-3 (seed-hip-thrust-machine) · pullup_bar séparé de bodyweight

---

## Référence seed complète (exercices utilisés dans cet audit)

### BW (bodyweight) — non warmup, non supprimé
| id | primaryMuscle | cat | pop |
|----|--------------|-----|-----|
| bw-squat | quads | cmp | 3 |
| bw-lunge | quads | cmp | 2 |
| bw-jump-squat | quads | cmp | 1 |
| bw-wall-sit | quads | iso | 2 |
| seed-pushup | chest | cmp | 2 |
| bw-incline-pushup | chest_upper | cmp | 2 |
| bw-pike-pushup | shoulders | cmp | 1 |
| seed-hip-thrust-bw | glutes | cmp | 3 |
| seed-curtsy-lunge | glutes | cmp | 1 |
| seed-donkey-kick | glutes | iso | 2 |
| seed-fire-hydrant | glutes | iso | 2 |
| seed-glute-bridge | glutes | iso | 3 |
| bw-calf-raise | calves | iso | 2 |
| seed-plank | core | iso | 3 |
| seed-crunch | core | iso | 2 |
| seed-bicycle-crunch | core | iso | 2 |
| seed-side-plank | core | iso | 2 |
| seed-leg-raise | core | iso | 2 |
| seed-scissors | core | iso | 1 |
| bw-hollow-body | core | iso | 1 |
| seed-russian-twist | core | iso | 1 |
| seed-ab-wheel | core | iso | 1 |
| seed-vertical-leg-crunch | core | iso | 1 |
| seed-heel-touch | core | iso | 1 |
| bw-burpees | cardio | cmp | 2 |
| bw-high-knees | cardio | cmp | 1 |
| seed-football | cardio | cmp | 0 (désactivé) |

### pullup_bar (7 exercices)
| id | primaryMuscle | cat | pop |
|----|--------------|-----|-----|
| seed-pullup | back_width | cmp | 3 |
| bw-inverted-row | back_thickness | cmp | 1 |
| bw-chinup | biceps | cmp | 3 |
| seed-dips | chest_lower | cmp | 3 |
| seed-triceps-dips | triceps | cmp | 2 |
| bw-nordic-curl | hamstrings | cmp | 2 |
| seed-hanging-leg-raise | core | iso | 2 |

### barbell (20 exercices, sélection pertinente)
| id | primaryMuscle | cat | pop |
|----|--------------|-----|-----|
| seed-bench-barbell | chest | cmp | 8 |
| seed-incline-bench-barbell | chest_upper | cmp | 4 |
| seed-ohp-barbell | shoulders | cmp | 3 |
| seed-row-barbell | back_thickness | cmp | 7 |
| seed-squat-barbell | quads | cmp | 8 |
| seed-romanian-deadlift | hamstrings | cmp | 3 |
| seed-deadlift | back | cmp | 3 |
| seed-hip-thrust | glutes | cmp | 4 |
| seed-front-squat | quads | cmp | 2 |
| seed-curl-barbell | biceps | iso | 3 |
| seed-calf-raise-bb | calves | iso | 2 |
| seed-close-grip-bench | triceps | cmp | 2 |
| seed-row-tbar | back_thickness | cmp | 2 |
| seed-skullcrusher | triceps | iso | 2 |
| seed-curl-preacher | biceps | iso | 2 |
| seed-good-morning | hamstrings | cmp | 1 |
| seed-decline-bench-barbell | chest_lower | cmp | 1 |
| seed-upright-row-barbell | shoulders_lateral | cmp | 2 |
| seed-wrist-curl | forearms | iso | 1 |
| seed-reverse-wrist-curl | forearms | iso | 1 |

### dumbbell (22 exercices)
| id | primaryMuscle | cat | pop |
|----|--------------|-----|-----|
| seed-bench-dumbbell | chest | cmp | 3 |
| seed-incline-bench-dumbbell | chest_upper | cmp | 2 |
| seed-shoulder-press-dumbbell | shoulders | cmp | 3 |
| seed-arnold-press | shoulders | cmp | 2 |
| seed-fly-dumbbell | chest | iso | 2 |
| seed-lateral-raise | shoulders_lateral | iso | 3 |
| seed-rear-delt-fly | shoulders_rear | iso | 2 |
| seed-curl-dumbbell | biceps | iso | 3 |
| seed-curl-hammer | biceps | iso | 3 |
| seed-curl-incline | biceps | iso | 2 |
| seed-curl-concentration | biceps | iso | 1 |
| seed-triceps-overhead | triceps | iso | 2 |
| seed-triceps-kickback | triceps | iso | 1 |
| seed-lunges | quads | cmp | 2 |
| seed-bulgarian-split-squat | quads | cmp | 2 |
| seed-row-dumbbell | back_thickness | cmp | 3 |
| seed-pullover | back_width | iso | 1 |
| seed-pullover-dumbbell | back_thickness | iso | 3 |
| seed-shrug | back | iso | 2 |
| dumbbell-rdl | hamstrings | cmp | 2 |
| seed-calf-raise-db | calves | iso | 2 |
| seed-front-raise | shoulders_front | iso | 1 |

### cable (13 exercices)
| id | primaryMuscle | cat | pop |
|----|--------------|-----|-----|
| seed-lat-pulldown | back_width | cmp | 3 |
| seed-row-cable | back_thickness | cmp | 2 |
| seed-face-pull | shoulders_rear | iso | 2 |
| seed-lateral-raise-cable | shoulders_lateral | iso | 2 |
| seed-fly-cable | chest | iso | 2 |
| seed-triceps-rope | triceps | iso | 3 |
| seed-triceps-pushdown | triceps | iso | 3 |
| seed-cable-crunch | core | iso | 2 |
| seed-curl-cable | biceps | iso | 2 |
| seed-glute-kickback | glutes | iso | 1 |
| seed-upright-row-cable | shoulders_lateral | cmp | 2 |
| seed-pullover-cable | back_thickness | iso | 2 |
| seed-straight-arm-pulldown | back_thickness | iso | 2 |

### machine (15 exercices)
| id | primaryMuscle | cat | pop |
|----|--------------|-----|-----|
| seed-leg-press | quads | cmp | 3 |
| seed-hack-squat | quads | cmp | 2 |
| seed-leg-extension | quads | iso | 3 |
| seed-leg-curl-lying | hamstrings | iso | 3 |
| seed-leg-curl-seated | hamstrings | iso | 2 |
| seed-leg-curl-standing | hamstrings | iso | 2 |
| seed-hip-abduction | glutes | iso | 2 |
| seed-hip-adduction-machine | glutes | iso | 2 |
| seed-hip-thrust-machine | glutes | cmp | 3 |
| seed-calf-raise-seated | calves | iso | 2 |
| seed-calf-raise-standing | calves | iso | 2 |
| seed-row-machine | back_thickness | cmp | 1 |
| seed-pec-deck | chest | iso | 2 |
| seed-chest-press-machine | chest | cmp | 3 |
| seed-shoulder-press-machine | shoulders | cmp | 3 |

### kettlebell (14 exercices)
| id | primaryMuscle | cat | pop |
|----|--------------|-----|-----|
| seed-goblet-squat | quads | cmp | 3 |
| kb-swing | glutes | cmp | 3 |
| kb-press | shoulders | cmp | 2 |
| kb-row | back_thickness | cmp | 2 |
| kb-rdl | hamstrings | cmp | 2 |
| kb-deadlift | back | cmp | 2 |
| kb-floor-press | chest | cmp | 2 |
| kb-clean | glutes | cmp | 3 |
| kb-lunge | quads | cmp | 2 |
| kb-turkish-getup | core | cmp | 2 |
| kb-curl | biceps | iso | 1 |
| kb-overhead-extension | triceps | iso | 1 |
| kb-pullover | back_width | iso | 1 |
| kb-calf-raise | calves | iso | 1 |

### band (10 non-warmup, 2 warmup)
| id | primaryMuscle | cat | pop | warmup |
|----|--------------|-----|-----|--------|
| band-squat | quads | cmp | 2 | non |
| band-row | back_thickness | cmp | 2 | non |
| band-chest-press | chest | cmp | 1 | non |
| band-overhead-press | shoulders | cmp | 2 | non |
| band-curl | biceps | iso | 2 | non |
| band-tricep-pushdown | triceps | iso | 2 | non |
| band-good-morning | hamstrings | cmp | 1 | non |
| band-hip-thrust | glutes | cmp | 2 | non |
| band-face-pull | shoulders_rear | iso | 2 | non — SEED-2 |
| bw-prone-y-raise | shoulders_rear | iso | 1 | non — SEED-2 |
| seed-band-pull-apart | shoulders_rear | iso | 2 | **OUI** — exclu d'`available` |
| seed-clamshell | glutes | iso | 1 | **OUI** — exclu d'`available` |

### cardio_machine (4 exercices — jamais sélectionnables)
seed-treadmill, seed-elliptical, seed-rowing-erg, seed-cycling — primaryMuscle='cardio', aucun slot template ne cible 'cardio'.

---

## Note sur warmupPool et corePool

**warmupPool** = exercises avec `isWarmupExercise:true` ET (`allowed.has(equipment)` OU `equipment==='bodyweight'`).
→ Les exercices bodyweight de warmup sont TOUJOURS inclus, quel que soit l'équipement choisi.

Warmup bodyweight (16, dans l'ordre du fichier JSON) :
`seed-bird-dog`, `seed-cat-cow`, `seed-shoulder-circles`, `seed-dead-bug`, `seed-walking-lunges`, `seed-glute-bridge-warmup`, `seed-hip-9090`, `seed-inchworm`, `seed-jumping-jacks`, `seed-mountain-climbers`, `seed-good-morning-bw`, `seed-bodyweight-squat`, `seed-superman`, `seed-thoracic-rotation`, `seed-worlds-greatest-stretch`, `seed-leg-swings`

**corePool BW-only** (dans l'ordre JSON) :
`seed-scissors`[0], `seed-crunch`[1], `seed-bicycle-crunch`[2], `seed-vertical-leg-crunch`[3], `seed-side-plank`[4], `bw-hollow-body`[5], `seed-plank`[6], `seed-leg-raise`[7], `seed-ab-wheel`[8], `seed-russian-twist`[9], `seed-heel-touch`[10]

---

# GROUPE C — Equipment × slot

---

## P21 — Bodyweight only

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:BW, level:'beginner' }
```

**Étape 1 — workoutTypeFromFocus**
`focusMuscles` absent → retourne `null`

**Étape 2 — selectSplit**
daysPerWeek=3, isMass=true (hypertrophy), level='beginner'
→ case 3, last branch (beginner) : `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`

**Étape 3 — adjustedSlotCount**
duration=60, goal=hypertrophy (non-strength) → retourne `base` tel quel = **9 slots** chaque session.

**Impact pullup_bar séparé :**
Exclu de `available` (allowed = Set{'bodyweight'}) :
- `seed-pullup` (back_width compound) → slot back compound **vide**
- `bw-inverted-row` (back_thickness compound) → idem
- `bw-chinup` (biceps compound) → slot biceps **vide**
- `seed-dips` (chest_lower compound) → slot chest_lower **vide** (mais compound:false dans fullbody, pas de null)
- `seed-triceps-dips` (triceps compound) → slot triceps vide
- `bw-nordic-curl` (hamstrings compound) → slot hamstrings vide

**Pool warmup BW :** 16 exercices bodyweight (toujours inclus quel que soit l'équipement).
**Pool core BW :** 11 exercices bodyweight.
**autoProgress : false, progressStepKg : 0** (tous bodyweight)

---

### Full Body A — fullbody-quad (workout index 0)

Slots fullbody-quad : 9 (pris en entier)
```
[0] quads/glutes compound
[1] chest/chest_upper compound
[2] back_width/back_thickness/back compound
[3] shoulders/shoulders_front compound
[4] hamstrings isolation
[5] shoulders_rear isolation
[6] biceps isolation
[7] calves isolation
[8] triceps isolation
```

| # | Slot (muscles) | cmp? | Top-3 candidats BW (pop↓) | Exercice retenu | Séries×Reps |
|---|---------------|------|--------------------------|-----------------|-------------|
| W | warmup | — | warmupPool[0]=seed-bird-dog | **seed-bird-dog** (BW) | 2×10 |
| 1 | quads/glutes | oui | bw-squat(3), bw-lunge(2), bw-jump-squat(1) | **bw-squat** | 4×8–12 |
| 2 | chest/chest_upper | oui | seed-pushup(2,chest=match0), bw-incline-pushup(2,chest_upper=match1) | **seed-pushup** | 4×8–12 |
| 3 | back_width/back_thickness/back | oui | — aucun BW compound dos | **— slot vide —** (warning) | — |
| 4 | shoulders/shoulders_front | oui | bw-pike-pushup(1) | **bw-pike-pushup** | 4×8–12 |
| 5 | hamstrings | non | — aucun BW hamstrings | **— slot vide —** (silencieux) | — |
| 6 | shoulders_rear | non | — aucun BW shoulders_rear | **— slot vide —** (silencieux) | — |
| 7 | biceps | non | — aucun BW biceps | **— slot vide —** (silencieux) | — |
| 8 | calves | non | bw-calf-raise(2) | **bw-calf-raise** | 3×10–15 |
| 9 | triceps | non | — aucun BW triceps | **— slot vide —** (silencieux) | — |
| C | core | — | corePool[0]=seed-scissors | **seed-scissors** (BW) | 3×15 |

**Total : 1 warmup + 4 slots remplis + 1 core = 6 exercices** (9 slots dont 5 vides)
usedGlobally après A : {bw-squat, seed-pushup, bw-pike-pushup, bw-calf-raise}

---

### Full Body B — fullbody-hip (workout index 1)

Slots fullbody-hip :
```
[0] hamstrings/glutes compound
[1] chest/chest_upper compound
[2] back_width/back compound
[3] shoulders/shoulders_front compound
[4] quads isolation
[5] shoulders_lateral/shoulders_rear isolation
[6] biceps isolation
[7] calves isolation
[8] triceps isolation
```

| # | Slot (muscles) | cmp? | Candidats BW (après usedGlobally) | Exercice retenu | Séries×Reps |
|---|---------------|------|----------------------------------|-----------------|-------------|
| W | warmup | — | warmupPool[1]=seed-cat-cow | **seed-cat-cow** | 2×10 |
| 1 | hamstrings/glutes | oui | seed-hip-thrust-bw(3,glutes), seed-curtsy-lunge(1,glutes) — slotPrimary='hamstrings', les deux rank=1 | **seed-hip-thrust-bw** (pop3) | 4×8–12 |
| 2 | chest/chest_upper | oui | seed-pushup(pop2,match0,usedG=1), bw-incline-pushup(pop2,match1,usedG=0) — match0 prime | **seed-pushup** (répété★) | 4×8–12 |
| 3 | back_width/back | oui | — aucun BW compound (back_thickness exclu de ce slot) | **— slot vide —** (warning) | — |
| 4 | shoulders/shoulders_front | oui | bw-pike-pushup(1,usedG=1) seul candidat | **bw-pike-pushup** (répété★) | 4×8–12 |
| 5 | quads isolation | non | bw-wall-sit(2,iso) | **bw-wall-sit** | 3×10–15 |
| 6 | shoulders_lat/rear | non | — aucun BW | **— slot vide —** | — |
| 7 | biceps | non | — aucun BW | **— slot vide —** | — |
| 8 | calves | non | bw-calf-raise(usedG=1) seul candidat | **bw-calf-raise** (répété★) | 3×10–15 |
| 9 | triceps | non | — aucun BW | **— slot vide —** | — |
| C | core | — | corePool[1]=seed-crunch | **seed-crunch** | 3×15 |

★ = exercice déjà dans usedGlobally (pénalisé en tri mais seul candidat).
**Total : 6 exercices**

---

### Full Body C — fullbody-quad (workout index 2)

usedGlobally : {bw-squat, seed-pushup, bw-pike-pushup, bw-calf-raise, seed-hip-thrust-bw, bw-wall-sit}

| # | Slot | cmp? | Candidats après usedGlobally | Exercice retenu | Séries×Reps |
|---|------|------|------------------------------|-----------------|-------------|
| W | warmup | — | warmupPool[2]=seed-shoulder-circles | **seed-shoulder-circles** | 2×10 |
| 1 | quads/glutes | oui | bw-lunge(match0,usedG=0,pop2) > bw-jump-squat(match0,usedG=0,pop1) > bw-squat(usedG=1) | **bw-lunge** ✓ variation | 4×8–12 |
| 2 | chest/chest_upper | oui | seed-pushup(match0,usedG=1) > bw-incline-pushup(match1,usedG=0) — match prime | **seed-pushup** (3e fois★) | 4×8–12 |
| 3 | back_width/back_thickness/back | oui | — aucun | **— slot vide —** | — |
| 4 | shoulders | oui | bw-pike-pushup seul | **bw-pike-pushup** (3e fois★) | 4×8–12 |
| 5 | hamstrings | non | — aucun | **— slot vide —** | — |
| 6 | shoulders_rear | non | — aucun | **— slot vide —** | — |
| 7 | biceps | non | — aucun | **— slot vide —** | — |
| 8 | calves | non | bw-calf-raise seul | **bw-calf-raise** (3e fois★) | 3×10–15 |
| 9 | triceps | non | — aucun | **— slot vide —** | — |
| C | core | — | corePool[2]=seed-bicycle-crunch | **seed-bicycle-crunch** | 3×15 |

**Total : 6 exercices**

---

**Assertions P21 : [PASS/FAIL]**
- `filterByEquipment` exclut tout non-BW : **PASS** (ligne 737)
- Aucun exercice pullup_bar dans la sortie : **PASS**
- `autoProgress: false`, `progressStepKg: 0` : **PASS** (ligne 584–585)
- Slots vides identifiés (back_width, back_thickness, biceps, hamstrings compound, triceps, shoulders_rear) : **PASS** (conforme aux attentes post-fix)

**Coach P21 :**
- Équilibre musculaire : ❌ Programme très tronqué. Dos entièrement absent (zéro exercice de tirage), biceps absents, triceps absents, ischio-jambiers absents, épaules arrière absentes. Seuls chest (pompes), quads/glutes (squat/hip thrust), épaules avant (pike push-up) et mollets sont couverts.
- Cohérence objectif : hypertrophy 4×8–12 sur les exercices présents : OK. Mais le volume par groupe musculaire est dramatiquement insuffisant.
- Durée/contenu : 6 exercices en 60 min est très sous-utilisé. ~24 min effectives, 36 min perdues.
- Variété inter-sessions : "Variété d'exercices seulement" — slot 1 varie (bw-squat → bw-lunge), mais slots 2/4/8 répètent seed-pushup, bw-pike-pushup, bw-calf-raise à chaque séance faute de pool. Répétition complète sur ces 3 slots.
- Couverture isolation : Lacunes problématiques — dos, biceps, triceps, ischio-jambiers entièrement manquants.
- Verdict global : ❌ Programme non viable en bodyweight pur post-fix EQUIP-1/2. Recommander fortement BW+BAR (preset "Extérieur") qui débloque 7 exercices pullup_bar.

---

## P22 — Haltères seuls → slot dos compound

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:DB, level:'beginner' }
```

**Étape 1 :** `null`
**Étape 2 :** `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']` (même logique P21)
**Étape 3 :** 9 slots · 60 min

**Available DB (non-warmup) :** 22 exercices listés ci-dessus.
**Pool warmup :** 16 warmup bodyweight (bodyweight toujours inclus dans warmupPool).
**Pool core :** 11 core bodyweight (même logique).

**Analyse BUG#4 — slot dos compound :**

- `fullbody-quad` slot 3 : `{ muscles: ['back_width', 'back_thickness', 'back'], compound: true }`
  → `seed-row-dumbbell` (primaryMuscle='back_thickness' ∈ liste) → **candidat valide** → slot rempli ✓
- `fullbody-hip` slot 3 : `{ muscles: ['back_width', 'back'], compound: true }`
  → Candidats DB compound avec primaryMuscle ∈ {back_width, back} :
  - `seed-pullover` (back_width) → `category='isolation'` → exclu du compound filter → **null**
  - `seed-shrug` (back) → `category='isolation'` → exclu → **null**
  - `seed-row-dumbbell` (back_thickness) → primaryMuscle NOT IN {back_width, back} → exclu
  → **Slot vide** avec warning "Aucun exercice composé pour dos (largeur)"

BUG#4 : **PARTIELLEMENT présent** — fullbody-quad A/C est OK (back_thickness dans la liste), fullbody-hip B est vide (liste réduite back_width/back exclut back_thickness).

---

### Full Body A — fullbody-quad DB (workout index 0)

| # | Slot | cmp? | Top-3 candidats DB | Exercice retenu | Séries×Reps |
|---|------|------|-------------------|-----------------|-------------|
| W | warmup | — | warmupPool[0]=seed-bird-dog | **seed-bird-dog** | 2×10 |
| 1 | quads/glutes | oui | seed-lunges(DB,pop2,match0), seed-bulgarian-split-squat(DB,pop2,match0) | **seed-lunges** | 4×8–12 |
| 2 | chest/chest_upper | oui | seed-bench-dumbbell(chest,pop3,match0), seed-incline-bench-dumbbell(chest_upper,pop2,match1) | **seed-bench-dumbbell** | 4×8–12 |
| 3 | back_width/back_thick/back | oui | seed-row-dumbbell(back_thickness,pop3) — seul compound DB pour ce slot | **seed-row-dumbbell** ✓ | 4×8–12 |
| 4 | shoulders/shoulders_front | oui | seed-shoulder-press-dumbbell(pop3), seed-arnold-press(pop2) | **seed-shoulder-press-dumbbell** | 4×8–12 |
| 5 | hamstrings | non | dumbbell-rdl(cmp,pop2) — seul candidat DB hamstrings | **dumbbell-rdl** | 3×10–15 |
| 6 | shoulders_rear | non | seed-rear-delt-fly(iso,pop2) | **seed-rear-delt-fly** | 3×10–15 |
| 7 | biceps | non | seed-curl-dumbbell(pop3), seed-curl-hammer(pop3), seed-curl-incline(pop2) | **seed-curl-dumbbell** | 3×10–15 |
| 8 | calves | non | seed-calf-raise-db(pop2) — SEED-1 ✓ | **seed-calf-raise-db** | 3×10–15 |
| 9 | triceps | non | seed-triceps-overhead(pop2), seed-triceps-kickback(pop1) | **seed-triceps-overhead** | 3×10–15 |
| C | core | — | corePool[0]=seed-scissors | **seed-scissors** | 3×15 |

**Total : 11 exercices** (9 slots remplis + warmup + core) ✓

---

### Full Body B — fullbody-hip DB (workout index 1)

usedGlobally : {seed-lunges, seed-bench-dumbbell, seed-row-dumbbell, seed-shoulder-press-dumbbell, dumbbell-rdl, seed-rear-delt-fly, seed-curl-dumbbell, seed-calf-raise-db, seed-triceps-overhead}

| # | Slot | cmp? | Candidats DB | Exercice retenu | Séries×Reps |
|---|------|------|-------------|-----------------|-------------|
| W | warmup | — | warmupPool[1]=seed-cat-cow | **seed-cat-cow** | 2×10 |
| 1 | hamstrings/glutes | oui | dumbbell-rdl(usedG=1,ham,pop2), seed-bulgarian-split-squat(usedG=0,quads→glute slot) — dumbbell-rdl usedG mais slotPrimary='hamstrings' → match0 | **dumbbell-rdl** (usedG, seul ham compound DB) | 4×8–12 |
| 2 | chest/chest_upper | oui | seed-bench-dumbbell(usedG=1,match0), seed-incline-bench-dumbbell(usedG=0,match1) | **seed-bench-dumbbell** (usedG, match0 prime) | 4×8–12 |
| 3 | back_width/back | oui | — aucun DB compound avec back_width/back | **— slot vide —** (warning BUG#4) | — |
| 4 | shoulders/shoulders_front | oui | seed-shoulder-press-dumbbell(usedG=1,pop3), seed-arnold-press(usedG=0,pop2) → arnold non usedG | **seed-arnold-press** ✓ variation | 4×8–12 |
| 5 | quads iso | non | seed-bulgarian-split-squat(cmp,pop2) — fallback compound | **seed-bulgarian-split-squat** | 3×10–15 |
| 6 | shoulders_lat/rear | non | seed-rear-delt-fly(usedG=1) seul → **seed-rear-delt-fly** (usedG) | 3×10–15 |
| 7 | biceps | non | seed-curl-dumbbell(usedG=1,pop3), seed-curl-hammer(usedG=0,pop3) | **seed-curl-hammer** ✓ variation |  3×10–15 |
| 8 | calves | non | seed-calf-raise-db(usedG=1) seul | **seed-calf-raise-db** (usedG) | 3×10–15 |
| 9 | triceps | non | seed-triceps-overhead(usedG=1,pop2), seed-triceps-kickback(usedG=0,pop1) | **seed-triceps-kickback** (variation) | 3×10–15 |
| C | core | — | corePool[1]=seed-crunch | **seed-crunch** | 3×15 |

**Total : 10 exercices** (8 slots remplis — slot 3 vide — + warmup + core)

---

### Full Body C — fullbody-quad DB (workout index 2)

usedGlobally contient maintenant ~16 exercices. Principaux slots :

| # | Slot | Exercice retenu | Note |
|---|------|-----------------|------|
| W | warmup | seed-shoulder-circles | warmupPool[2] |
| 1 | quads/glutes cmp | seed-bulgarian-split-squat | usedG: seed-lunges → variation ✓ |
| 2 | chest cmp | seed-incline-bench-dumbbell | usedG: seed-bench-dumbbell → variation ✓ |
| 3 | back cmp | seed-row-dumbbell (usedG) | seul candidat, répété |
| 4 | shoulders cmp | seed-shoulder-press-dumbbell (usedG) | seul compound DB pop3 |
| 5 | hamstrings iso | dumbbell-rdl (usedG) | seul candidat |
| 6 | shoulders_rear iso | seed-rear-delt-fly (usedG) | seul candidat |
| 7 | biceps iso | seed-curl-incline | usedG: curl-dumbbell + curl-hammer → 3e rotation ✓ |
| 8 | calves iso | seed-calf-raise-db (usedG) | seul candidat |
| 9 | triceps iso | seed-triceps-overhead (usedG) | pool de 2 épuisé |
| C | core | seed-bicycle-crunch | corePool[2] |

**Total : 11 exercices**

---

**Assertions P22 : [PASS/FAIL]**
- Slot dos compound fullbody-quad : `back_thickness` dans la liste → seed-row-dumbbell qualifié → **PASS** (BUG#4 non présent pour le quad)
- Slot dos compound fullbody-hip : back_width/back seulement → aucun DB compound → **FAIL** (slot vide, BUG#4 résiduel sur le pattern hip)
- Exercice id retenu slot dos fullbody-quad : `seed-row-dumbbell` (dumbbell, back_thickness) → **PASS**
- Slot non null global : PARTIELLEMENT — quad OK, hip vide

**Coach P22 :**
- Équilibre musculaire : Bien meilleur que P21 — dos couvert en fullbody-quad via rowing haltère. Mais fullbody-hip perd le tirage → déséquilibre sur cette session.
- Cohérence objectif : 4×8–12 compound, 3×10–15 isolation → zone hypertrophie ✓
- Équipement : seed-calf-raise-db (SEED-1) correctement sélectionné ✓
- Variété : Bonne rotation sur biceps (curl-dumbbell → curl-hammer → curl-incline), triceps (overhead → kickback), épaules (press → arnold → press). Pool de 2 exercices par slot limite la 3e session.
- Couverture isolation : Manque de back_width isolation significatif en session hip. seed-pullover qualifie comme isolation back_width mais ne peut pas remplir le compound slot.
- Verdict global : ⚠️ Bon programme avec haltères, mais le pattern fullbody-hip expose un BUG#4 résiduel sur le slot back_width/back (compound uniquement). Recommander d'ajouter un exercice DB compound avec primaryMuscle='back' ou 'back_width' au seed.

---

## P23 — BB+DB strength intermediate → priorité barbell

```
{ goal:'strength', daysPerWeek:4, sessionDuration:60, equipment:BB+DB, level:'intermediate' }
```

**Étape 1 :** `null`

**Étape 2 :** daysPerWeek=4, isMass=true (strength), level≠beginner
→ `['upper-push', 'lower-quad', 'upper-pull', 'lower-hip']`

Noms : "Upper — Haut du corps A", "Lower — Bas du corps A", "Upper — Haut du corps B", "Lower — Bas du corps B"

**Étape 3 — adjustedSlotCount (strength, 60min) :**
`Math.max(4, Math.floor(base * 0.5))`
- upper-push : 8 slots → floor(4)=4 → max(4,4) = **4 slots**
- lower-quad : 6 slots → floor(3)=3 → max(4,3) = **4 slots**
- upper-pull : 8 slots → **4 slots**
- lower-hip : 6 slots → **4 slots**

Tous à **4 slots** (BUG-1 : ne concerne que 90min, pas 60min).

**adjustedSpec strength 60min :** duration=60 → spec inchangée. COMPOUND_SPEC.strength = 5×3–5, restSec=180.
**autoProgress : true, progressStepKg : 2.5** (barbell et dumbbell).

**Tri strength compound :** `strengthEquipmentPrio(barbell)=0 < strengthEquipmentPrio(dumbbell)=2` → barbell prioritaire.

---

### Upper-push A (4 premiers slots sur 8)

SLOTS['upper-push'] = [chest cmp, back_wide cmp, shoulders cmp, chest iso, triceps iso, shoulders_lat iso, biceps iso, back iso]
→ 4 slots : [0]=chest cmp, [1]=back_wide cmp, [2]=shoulders cmp, [3]=chest iso

| # | Slot | Top-3 candidats BB+DB (strength sort) | Exercice retenu | 5×3–5 |
|---|------|--------------------------------------|-----------------|-------|
| W | warmup | seed-bird-dog | **seed-bird-dog** | 2×10 |
| 1 | chest/chest_upper cmp | seed-bench-barbell(0,0,8) > seed-chest-press … wait machine exclu > seed-bench-dumbbell(0,2,3) > seed-incline-bench-barbell(1,0,4) | Top-3 intermediate : **seed-bench-barbell**, seed-bench-dumbbell, seed-incline-bench-barbell | 5×3–5 |
| 2 | back_width/back_thick/back cmp | seed-row-barbell(back_thick,0,7) > seed-deadlift(back,0,3) > seed-row-tbar(back_thick,0,2) > seed-row-dumbbell(back_thick,2,3) | Top-3 : **seed-row-barbell**, seed-deadlift, seed-row-tbar | 5×3–5 |
| 3 | shoulders/shoulders_front cmp | seed-ohp-barbell(match0,0,3) > seed-shoulder-press-dumbbell(match0,2,3) > seed-arnold-press(match0,2,2) | Top-3 : **seed-ohp-barbell**, seed-shoulder-press-dumbbell, seed-arnold-press | 5×3–5 |
| 4 | chest/chest_lower/chest_upper iso | seed-fly-dumbbell(chest,iso,pop2) > seed-incline-bench-dumbbell(cmp, fallback si pas iso) | **seed-fly-dumbbell** | 3×5–8 |
| C | core | corePool[0]=seed-scissors | **seed-scissors** | 3×15 |

**Assertion slot chest compound :** seed-bench-barbell retenu (barbell, pop8) ✓ — top-3 disponible pour intermediate.

---

### Lower-quad A (4 premiers slots sur 6)

SLOTS['lower-quad'] = [quads/glutes cmp, hamstrings/glutes cmp, quads iso, hamstrings iso, glutes iso, calves iso]
→ 4 slots : [0]=quads/glutes cmp, [1]=hamstrings/glutes cmp, [2]=quads iso, [3]=hamstrings iso

| # | Slot | Top-3 (strength) | Exercice retenu | 5×3–5 |
|---|------|-----------------|-----------------|-------|
| W | warmup | warmupPool[1]=seed-cat-cow | **seed-cat-cow** | 2×10 |
| 1 | quads/glutes cmp | seed-squat-barbell(match0,equip0,pop8) > seed-front-squat(match0,0,2) > seed-lunges(match0,2,2) | **seed-squat-barbell** ✓ | 5×3–5 |
| 2 | hamstrings/glutes cmp | seed-romanian-deadlift(ham,equip0,pop3) > seed-hip-thrust(glutes,equip0,pop4→rank1) — slotPrimary='hamstrings', RDL gagne | **seed-romanian-deadlift** | 5×3–5 |
| 3 | quads iso | seed-bulgarian-split-squat(cmp) fallback — aucune isolation quads BB/DB | **seed-bulgarian-split-squat** (compound utilisé comme isolation) | 3×5–8 |
| 4 | hamstrings iso | dumbbell-rdl(cmp) fallback | **dumbbell-rdl** | 3×5–8 |
| C | core | corePool[1]=seed-crunch | **seed-crunch** | 3×15 |

**Assertion squat barbell :** seed-squat-barbell (barbell, pop8) retenu ✓

---

### Upper-pull B et Lower-hip B (résumé)

Upper-pull B — 4 slots [back_width, back_thick, chest, shoulders_rear] :

| # | Slot | Exercice retenu | Note |
|---|------|-----------------|------|
| W | warmup | warmupPool[2]=seed-shoulder-circles | |
| 1 | back_width/back cmp | seed-row-barbell(usedG=1) ou seed-deadlift(usedG=0) → deadlift non usedG et match0 pour 'back' | **seed-deadlift** ✓ (variation) | 5×3–5 |
| 2 | back_thick/back cmp | seed-row-barbell(usedG=1) → mais usedG en A, row-tbar non usedG → **seed-row-tbar** | 5×3–5 |
| 3 | chest/chest_upper cmp | seed-bench-barbell(usedG=1), seed-incline-bench-barbell → **seed-incline-bench-barbell** | 5×3–5 |
| 4 | shoulders_rear iso | seed-rear-delt-fly(DB) | **seed-rear-delt-fly** | 3×5–8 |
| C | core | seed-bicycle-crunch | |

Lower-hip B — 4 slots [glutes/hamstrings cmp, quads/glutes cmp, glutes iso, hamstrings iso] :

| # | Slot | Exercice retenu | Note |
|---|------|-----------------|------|
| W | warmup | warmupPool[3]=seed-dead-bug | |
| 1 | glutes/hamstrings cmp | seed-hip-thrust(barbell,pop4,glutes=slotPrimary) | **seed-hip-thrust** (barre) | 5×3–5 |
| 2 | quads/glutes cmp | seed-squat-barbell(usedG=1), seed-front-squat(usedG=0) → **seed-front-squat** | 5×3–5 |
| 3 | glutes iso | seed-fly-dumbbell→chest non; seed-curtsy-lunge(BW,glutes,cmp) non disponible; aucun iso glutes DB/BB → fallback seed-hip-thrust(usedG=1) | — slot très limité — |
| 4 | hamstrings iso | dumbbell-rdl(usedG=1) seul | **dumbbell-rdl** (usedG) | 3×5–8 |
| C | core | seed-vertical-leg-crunch | |

---

**Assertions P23 : [PASS/FAIL]**
- scoreEquip(strength,barbell) < scoreEquip(strength,dumbbell) → barbell prioritaire : **PASS** (ligne 502)
- Slot chest compound = seed-bench-barbell (barbell) : **PASS**
- Slot squat = seed-squat-barbell (barbell) : **PASS**
- autoProgress=true, progressStepKg=2.5 : **PASS**
- adjustedSlotCount 4 slots pour strength 60min : **PASS** (4 = max(4, floor(8×0.5)))

**Coach P23 :**
- Équilibre musculaire : Barbell correctement privilégié. 2 upper + 2 lower = répartition équilibrée sur la semaine ✓.
- Cohérence objectif : 5×3–5 strength ✓. Repos 180s nécessite ~50 min pour 4 exercices = timing correct.
- Adéquation durée : 4 slots strength à 5 séries × 3 min repos = 60 min pile, réaliste ✓.
- Équipement : Barbell dominant sur les composés (bench-barbell, squat-barbell, row-barbell, OHP-barbell) ✓. Haltères utilisés pour les isolations et variantes.
- Verdict : ✅ Programme force cohérent. Réserve : deadlift en upper-pull (dos compound) cumule avec squat en lower-quad le lendemain — si lundi/mardi/jeudi/vendredi, les érecteurs pourraient être sur-sollicités. Recommander un jour de repos entre lower-quad et upper-pull.

---

## P24 — Machine+Cable only

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:MACH+CABLE, level:'beginner' }
```

**Étape 1 :** `null`
**Étape 2 :** `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`
**Étape 3 :** 9 slots · 60 min

**Available MACH+CABLE :** 28 exercices (15 machine + 13 cable).
**Pool warmup :** 16 warmup bodyweight (toujours inclus).
**Pool core :** BW core + seed-cable-crunch(cable,pop2) → 12 éléments.

---

### Full Body A — fullbody-quad MACH+CABLE (index 0)

| # | Slot | cmp? | Top-3 candidats MACH+CABLE | Exercice retenu | Séries×Reps |
|---|------|------|---------------------------|-----------------|-------------|
| W | warmup | — | seed-bird-dog | **seed-bird-dog** | 2×10 |
| 1 | quads/glutes cmp | oui | seed-leg-press(machine,quads,pop3,match0), seed-hack-squat(machine,quads,pop2,match0), seed-hip-thrust-machine(machine,glutes,pop3,match1=SEED-3) | **seed-leg-press** | 4×8–12 |
| 2 | chest/chest_upper cmp | oui | seed-chest-press-machine(machine,chest,pop3) seul compound chest MACH+CABLE | **seed-chest-press-machine** ✓ | 4×8–12 |
| 3 | back_width/back_thick/back cmp | oui | seed-lat-pulldown(back_width,cable,pop3,match0) > seed-row-cable(back_thick,cable,pop2) > seed-row-machine(back_thick,machine,pop1) | **seed-lat-pulldown** ✓ | 4×8–12 |
| 4 | shoulders/shoulders_front cmp | oui | seed-shoulder-press-machine(machine,shoulders,pop3) seul compound shoulders MACH+CABLE | **seed-shoulder-press-machine** | 4×8–12 |
| 5 | hamstrings iso | non | seed-leg-curl-lying(machine,pop3) > seed-leg-curl-seated(pop2) > seed-leg-curl-standing(pop2) | **seed-leg-curl-lying** | 3×10–15 |
| 6 | shoulders_rear iso | non | seed-face-pull(cable,pop2) | **seed-face-pull** | 3×10–15 |
| 7 | biceps iso | non | seed-curl-cable(cable,pop2) seul | **seed-curl-cable** | 3×10–15 |
| 8 | calves iso | non | seed-calf-raise-seated(machine,pop2), seed-calf-raise-standing(machine,pop2) | **seed-calf-raise-seated** | 3×10–15 |
| 9 | triceps iso | non | seed-triceps-rope(cable,pop3), seed-triceps-pushdown(cable,pop3) | **seed-triceps-rope** | 3×10–15 |
| C | core | — | corePool[0] (inclut seed-cable-crunch) → seed-scissors[0] | **seed-scissors** | 3×15 |

**Total : 11 exercices** ✓ — aucun barbell/dumbbell ✓

---

### Full Body B — fullbody-hip MACH+CABLE (index 1)

| # | Slot | Exercice retenu | Note |
|---|------|-----------------|------|
| W | warmup | seed-cat-cow | |
| 1 | hamstrings/glutes cmp | seed-hip-thrust-machine(glutes,cmp,pop3=SEED-3) — slotPrimary='hamstrings', hip-thrust=glutes=match1 ; seul compound machine avec primaryMuscle∈{hamstrings,glutes} | **seed-hip-thrust-machine** ✓ (SEED-3) | 4×8–12 |
| 2 | chest/chest_upper cmp | seed-chest-press-machine(usedG=1) seul | **seed-chest-press-machine** (usedG) | 4×8–12 |
| 3 | back_width/back cmp | seed-lat-pulldown(back_width,cable,usedG=1) — seul compound back_width/back | **seed-lat-pulldown** (usedG) | 4×8–12 |
| 4 | shoulders cmp | seed-shoulder-press-machine(usedG=1) seul | **seed-shoulder-press-machine** (usedG) | 4×8–12 |
| 5 | quads iso | seed-leg-extension(machine,pop3) | **seed-leg-extension** | 3×10–15 |
| 6 | shoulders_lat/rear iso | seed-lateral-raise-cable(pop2) > seed-face-pull(usedG=1) — lateral-raise non usedG | **seed-lateral-raise-cable** ✓ | 3×10–15 |
| 7 | biceps iso | seed-curl-cable(usedG=1) seul | **seed-curl-cable** (usedG) | 3×10–15 |
| 8 | calves iso | seed-calf-raise-standing(calf-seated usedG) | **seed-calf-raise-standing** ✓ variation | 3×10–15 |
| 9 | triceps iso | seed-triceps-pushdown(non usedG) > seed-triceps-rope(usedG) | **seed-triceps-pushdown** ✓ variation | 3×10–15 |
| C | core | seed-crunch | corePool[1] |

**Total : 11 exercices** ✓

---

**Assertions P24 : [PASS/FAIL]**
- Aucun exercice barbell/dumbbell : **PASS**
- Slot dos compound = seed-lat-pulldown (cable, back_width) : **PASS** ✓
- Slot chest compound = seed-chest-press-machine (machine) : **PASS** ✓
- seed-hip-thrust-machine (SEED-3) correctement sélectionné pour glutes/hamstrings cmp : **PASS**

**Coach P24 :**
- Équilibre musculaire : Couverture complète en machine/cable. seed-hip-thrust-machine (SEED-3) apporte la chaîne postérieure ✓.
- Cohérence objectif : 4×8–12 hypertrophie ✓. Machines = stabilisation assurée, idéal débutant.
- Pool de variation : Limité sur certains slots (1 seul compound chest, 1 seul compound shoulders) → répétition inévitable en B et C sur ces slots. Tolérable car les machines restent efficaces.
- Verdict global : ✅ Programme viable et cohérent. La répétition chest-press-machine et shoulder-press-machine sur les 3 sessions est une légère réserve.

---

## P25 — Band+Bodyweight

```
{ goal:'fat_loss', daysPerWeek:2, sessionDuration:60, equipment:BAND+BW, level:'beginner' }
```

**Étape 1 :** `null`
**Étape 2 :** daysPerWeek=2 → `['fullbody-quad', 'fullbody-hip']`
**Étape 3 :** 9 slots · 60 min (fat_loss non-strength)

**Available BAND+BW :** 
- Bodyweight non-warmup (~26 exercices)
- Band non-warmup : band-squat, band-row, band-chest-press, band-overhead-press, band-curl, band-tricep-pushdown, band-good-morning, band-hip-thrust, band-face-pull(SEED-2), bw-prone-y-raise(SEED-2)

**Impact pullup_bar séparé :** Même que P21 — back_width/back_thickness compound vide en BW pur. Mais band-row (back_thickness) est disponible ! Corrige partiellement.

COMPOUND_SPEC.fat_loss = 3×12–15, restSec=60
ISOLATION_SPEC.fat_loss = 3×12–15, restSec=60

---

### Full Body A — fullbody-quad BAND+BW (index 0)

| # | Slot | cmp? | Top-3 candidats BAND+BW | Exercice retenu | Séries×Reps |
|---|------|------|------------------------|-----------------|-------------|
| W | warmup | — | seed-bird-dog | **seed-bird-dog** | 2×10 |
| 1 | quads/glutes cmp | oui | bw-squat(BW,quads,pop3,match0), bw-lunge(BW,quads,pop2,match0), band-squat(band,quads,pop2,match0) | **bw-squat** (pop3) | 3×12–15 |
| 2 | chest/chest_upper cmp | oui | seed-pushup(BW,chest,pop2,match0), band-chest-press(band,chest,pop1,match0), bw-incline-pushup(BW,chest_upper,pop2,match1) | **seed-pushup** | 3×12–15 |
| 3 | back_width/back_thick/back cmp | oui | band-row(band,back_thick,pop2) — seul compound dos BAND+BW | **band-row** ✓ | 3×12–15 |
| 4 | shoulders/shoulders_front cmp | oui | band-overhead-press(band,shoulders,pop2,match0), bw-pike-pushup(BW,shoulders,pop1,match0) | **band-overhead-press** (pop2) | 3×12–15 |
| 5 | hamstrings iso | non | band-good-morning(band,ham,cmp,pop1) — fallback cmp | **band-good-morning** | 3×12–15 |
| 6 | shoulders_rear iso | non | band-face-pull(band,pop2,SEED-2) > bw-prone-y-raise(band,pop1,SEED-2) | **band-face-pull** ✓ (SEED-2) | 3×12–15 |
| 7 | biceps iso | non | band-curl(band,pop2) | **band-curl** | 3×12–15 |
| 8 | calves iso | non | bw-calf-raise(BW,pop2) | **bw-calf-raise** | 3×12–15 |
| 9 | triceps iso | non | band-tricep-pushdown(band,pop2) | **band-tricep-pushdown** | 3×12–15 |
| C | core | — | seed-scissors | **seed-scissors** | 3×15 |

**Total : 11 exercices** ✓ — aucun haltère/barre/câble/machine ✓
**autoProgress : false, progressStepKg : 0** (band + bodyweight)

---

### Full Body B — fullbody-hip BAND+BW (index 1)

usedGlobally : {bw-squat, seed-pushup, band-row, band-overhead-press, band-good-morning, band-face-pull, band-curl, bw-calf-raise, band-tricep-pushdown}

| # | Slot | cmp? | Exercice retenu | Note |
|---|------|------|-----------------|------|
| W | warmup | — | seed-cat-cow | warmupPool[1] |
| 1 | hamstrings/glutes cmp | oui | band-hip-thrust(band,glutes,pop2) > seed-hip-thrust-bw(BW,glutes,pop3) — both slotPrimary='hamstrings'=match1. Pop: seed-hip-thrust-bw(3) > band-hip-thrust(2). Neither usedG. | **seed-hip-thrust-bw** (pop3) | 3×12–15 |
| 2 | chest/chest_upper cmp | oui | seed-pushup(usedG=1,match0) > bw-incline-pushup(usedG=0,match1) — match prime | **seed-pushup** (usedG, répété) | 3×12–15 |
| 3 | back_width/back cmp | oui | — aucun BAND+BW compound avec primaryMuscle=back_width ou back | **— slot vide —** (warning) | — |
| 4 | shoulders cmp | oui | band-overhead-press(usedG=1,pop2), bw-pike-pushup(usedG=0,pop1) → bw-pike-pushup non usedG | **bw-pike-pushup** ✓ variation | 3×12–15 |
| 5 | quads iso | non | bw-wall-sit(BW,quads,iso,pop2) | **bw-wall-sit** | 3×12–15 |
| 6 | shoulders_lat/rear iso | non | bw-prone-y-raise(band,sho_rear,iso,pop1) — band-face-pull(usedG) | **bw-prone-y-raise** ✓ (SEED-2) | 3×12–15 |
| 7 | biceps iso | non | band-curl(usedG=1) seul | **band-curl** (usedG) | 3×12–15 |
| 8 | calves iso | non | bw-calf-raise(usedG=1) seul | **bw-calf-raise** (usedG) | 3×12–15 |
| 9 | triceps iso | non | band-tricep-pushdown(usedG=1) seul | **band-tricep-pushdown** (usedG) | 3×12–15 |
| C | core | — | seed-crunch | corePool[1] |

**Total : 10 exercices** (slot 3 vide)

---

**Assertions P25 : [PASS/FAIL]**
- Aucun exercice haltère/barre/câble/machine : **PASS**
- Slot shoulders_rear rempli par band-face-pull (SEED-2) : **PASS** ✓
- seed-band-pull-apart exclu (isWarmupExercise:true) : **PASS** ✓
- Slot back_width compound fullbody-hip vide (pullup_bar séparé) : **PASS** (comportement attendu post-fix)

**Coach P25 :**
- Équilibre musculaire : fullbody-quad A bien couvert grâce à band-row. fullbody-hip B perd le tirage horizontal — même limitation qu'en BW pur pour ce pattern.
- SEED-2 fonctionnel : band-face-pull et bw-prone-y-raise disponibles pour shoulders_rear ✓.
- Cohérence objectif : fat_loss 3×12–15, repos 60s → zones métaboliques correctes ✓.
- Équipement exploité : Élastiques bien utilisés (overhead-press, row, curl, tricep, hip-thrust, face-pull). Pas de sous-utilisation.
- Verdict global : ⚠️ Programme fat_loss Band+BW acceptable en session A, lacune en B (tirage dos absent). Pédagogiquement correct pour cet équipement. Suggérer 3j/sem pour compenser.

---

## P26 — Advanced strength 3j → PPL + random top-3

```
{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'advanced' }
```

**Étape 1 :** `null`
**Étape 2 :** daysPerWeek=3, isMass=true (strength), level≠beginner → `['push','pull','legs']`
Noms : "Push — Poussée", "Pull — Tirage", "Legs — Jambes" (1 occurrence chacun → pas de suffixe A/B)

**Étape 3 — adjustedSlotCount (strength, 60min) :**
`Math.max(4, Math.floor(base * 0.5))`
- push : 6 slots → max(4, 3) = **4 slots**
- pull : 6 slots → **4 slots**
- legs : 6 slots → **4 slots**

**Level 'advanced' :** `pickExercise` utilise `candidates.slice(0, 3)` avec `Math.floor(Math.random() * pool.length)` (ligne 577–578).

COMPOUND_SPEC.strength = 5×3–5 ; ISOLATION_SPEC.strength = 3×5–8.

---

### Push — 4 slots [chest cmp, shoulders cmp, chest iso, triceps iso]

**Top-3 candidats slot chest compound :**
Slot SLOTS['push'][0] = `{ muscles: ['chest','chest_upper','chest_lower'], compound: true }`

Candidats FULL (all equipment) pour primaryMuscle ∈ {chest, chest_upper, chest_lower} AND compound, triés (strength sort) :
- seed-bench-barbell (chest, barbell, equip=0, pop=8, match0)
- seed-chest-press-machine (chest, machine, equip=1, pop=3, match0)
- seed-bench-dumbbell (chest, dumbbell, equip=2, pop=3, match0)
- seed-incline-bench-barbell (chest_upper, barbell, equip=0, pop=4, match1)
- seed-dips (chest_lower, pullup_bar, equip=4, pop=3, match1)
- seed-decline-bench-barbell (chest_lower, barbell, equip=0, pop=1, match1)
- seed-incline-bench-dumbbell (chest_upper, dumbbell, equip=2, pop=2, match1)

Sort par (match0, equip, usedG, pop) :
1. seed-bench-barbell (0, 0, 0, 8)
2. seed-chest-press-machine (0, 1, 0, 3)
3. seed-bench-dumbbell (0, 2, 0, 3)

**Top-3 chest compound (advanced) : seed-bench-barbell, seed-chest-press-machine, seed-bench-dumbbell**
Le programme choisit aléatoirement l'un des trois.

---

### Pull — 4 slots [back_width cmp, back_thick cmp, back iso, biceps iso]

| # | Slot | Top-3 FULL | Note |
|---|------|-----------|------|
| 1 | back_width/back cmp | seed-row-barbell(back_thick,0,0,7)→match1 ; seed-deadlift(back,0,0,3)→match0 ; seed-pullup(back_width,4,0,3)→match0 — strength sort: deadlift(match0,equip0) > pullup(match0,equip4) > row-barbell(match1,equip0) | **Top-3 : seed-deadlift, seed-pullup, seed-row-barbell** |
| 2 | back_thick/back cmp | seed-row-barbell(back_thick,equip0,pop7,match0) > seed-row-tbar(back_thick,0,2,match0) > seed-deadlift(back,0,3,match0→usedG si deadlift pris) | **Top-3 : seed-row-barbell, seed-row-tbar, seed-deadlift** |
| 3 | back_thick/back_width/back iso | seed-pullover-dumbbell(back_thick,iso,pop3) > seed-pullover-cable(back_thick,iso,pop2) | **seed-pullover-dumbbell** probable |
| 4 | biceps iso | seed-curl-barbell(pop3) = seed-curl-dumbbell(pop3) > bw-chinup(cmp→fallback? non, il y a des iso) | **seed-curl-barbell ou seed-curl-dumbbell** |

---

### Legs — 4 slots [quads cmp, hamstrings/glutes cmp, quads iso, hamstrings iso]

| # | Slot | Top-3 FULL (strength) | Note |
|---|------|----------------------|------|
| 1 | quads/glutes cmp | seed-squat-barbell(quads,0,0,8) > seed-front-squat(quads,0,0,2) > seed-lunges(quads,2,0,2) | **Top-3 : squat-barbell, front-squat, lunges** |
| 2 | hamstrings/glutes cmp | seed-romanian-deadlift(ham,0,0,3) > seed-hip-thrust(glutes,0,0,4)→match1 ; RDL match0 prime | **Top-3 : RDL, good-morning, dumbbell-rdl** |
| 3 | quads iso | seed-leg-extension(machine,iso,pop3) | **seed-leg-extension** |
| 4 | hamstrings iso | seed-leg-curl-lying(machine,iso,pop3) | **seed-leg-curl-lying** |

---

**Assertions P26 : [PASS/FAIL]**
- Split = ['push','pull','legs'] : **PASS**
- level='advanced' → random top-3 (ligne 577) : **PASS** (vérifié dans le code)
- Top-3 chest compound identifiés (seed-bench-barbell, seed-chest-press-machine, seed-bench-dumbbell) : **PASS**

**Coach P26 :**
- Équilibre musculaire : PPL équilibré sur la semaine ✓. 4 slots strength par session = volume ciblé et intense.
- Cohérence objectif : 5×3–5 avec 180s repos → force maximale ✓. La variation random top-3 apporte de la diversité.
- Adéquation durée : 4 exercices strength = ~60 min (4×5×3min repos) ✓.
- Variété inter-sessions : "Variété d'exercices" — le random top-3 crée de la variation d'une session à l'autre ✓.
- Verdict global : ✅ Programme force avancé cohérent. Réserve : sur 3j/sem, chaque groupe n'est touché qu'une fois — recommander 4j si l'objectif est la performance maximale.

---

# GROUPE D — Durée × slots

---

## P27 — 20 minutes → slots et total

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:20, equipment:FULL, level:'beginner' }
```

**Étape 2 :** `['fullbody-quad', 'fullbody-hip']`

**Étape 3 — adjustedSlotCount :**
duration=20, goal=hypertrophy (non-strength) :
`Math.max(2, Math.floor(base * 0.5))`
- fullbody-quad base=9 → floor(9×0.5)=4 → max(2,4) = **4 slots** ✓

**Session très courte (≤20min) — code lignes 812–830 :**
```javascript
const isVeryShort = sessionDuration <= 20   // true pour 20min
const effectiveWarmupSpec = { ...WARMUP_SPEC, sets: 1 }  // 1 série au lieu de 2
// Core supprimé : if (!isVeryShort && ...) → non exécuté
```

Total par workout = 4 slots + 1 warmup (**1 série**) + **0 core** = **5 exercices**

⚠️ **ASSERTION FAIL :** le prompt v3 indique "4 + 1 warmup + 1 core = 6" — le code supprime le core pour sessionDuration ≤ 20min. Total réel = **5 exercices**.

**adjustedSpec pour 20min :**
`factor=0.5 → sets = max(2, floor(4×0.5)) = max(2,2) = 2`
- COMPOUND_SPEC.hypertrophy ajusté : **2×8–12**
- ISOLATION_SPEC.hypertrophy ajusté : **2×10–15**

| # | Slot fullbody-quad (4) | Exercice (FULL, beginner) | Séries×Reps |
|---|----------------------|--------------------------|-------------|
| W | warmup (1 série) | seed-bird-dog | 1×10 |
| 1 | quads/glutes cmp | seed-squat-barbell (pop8) | 2×8–12 |
| 2 | chest/chest_upper cmp | seed-bench-barbell (pop8,chest=match0) | 2×8–12 |
| 3 | back_width/back_thick/back cmp | seed-row-barbell (back_thick,pop7) ; slotPrimary=back_width → deadlift(back,pop3,match0) > row-barbell(back_thick,match1,pop7) → deadlift retenu | **seed-deadlift** (match0,pop3) | 2×8–12 |
| 4 | shoulders/shoulders_front cmp | seed-ohp-barbell (pop3) | 2×8–12 |
| (C) | core supprimé | — | — |

**Total : 5 exercices** (4 slots + 1 warmup 1 série, pas de core)

**Assertions P27 :**
- adjustedSlotCount(9, 20) = 4 : **PASS**
- Total = 4 + warmup + core = 6 : **FAIL** (core supprimé → total = 5)
- Warmup réduit à 1 série (isVeryShort) : **PASS** (code ligne 813)

**Coach P27 :**
- 20min / 5 exercices : 4 composés forts (squat+bench+deadlift+OHP) en 2 séries chacun. À 2×3min repos = 24min, déjà légèrement au-dessus. Sans core = raisonnable pour ce créneau.
- Timing : squat barbell + deadlift + bench + OHP en 20min est TRÈS ambitieux même à 2 séries. Recommander de réduire à 3 slots pour ce créneau.
- Verdict : ⚠️ Contenu pédagogiquement intéressant (4 fondamentaux) mais timing serré même à 2 séries avec barbell.

---

## P28 — 45 minutes → 6 slots → 8 exercices

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:45, equipment:FULL, level:'beginner' }
```

**Étape 2 :** `['fullbody-quad', 'fullbody-hip']`

**Étape 3 — adjustedSlotCount :**
duration=45, goal=hypertrophy (non-strength) :
`Math.max(3, Math.floor(base * 0.75))`
- fullbody-quad base=9 → floor(9×0.75)=floor(6.75)=6 → max(3,6) = **6 slots** ✓

isVeryShort = (45 ≤ 20) = **false** → warmup 2 séries, core inclus.

Total = 6 + 1 warmup + 1 core = **8 exercices** ✓

**adjustedSpec 45min :**
`factor=0.75 → sets = max(2, floor(4×0.75)) = max(2,3) = 3`
- COMPOUND_SPEC.hypertrophy ajusté : **3×8–12**
- ISOLATION_SPEC.hypertrophy ajusté : **3×10–15** (floor(3×0.75)=2 → max(2,2)=2 en réalité)

Wait — ISOLATION_SPEC.hypertrophy.sets=3 → floor(3×0.75)=floor(2.25)=2 → max(2,2)=2.
Donc isolation : **2×10–15**.

Fullbody-quad 6 slots = slots [0..5] = quads/glutes cmp, chest cmp, back cmp, shoulders cmp, hamstrings iso, shoulders_rear iso.

| # | Slot (6 premiers) | Exercice FULL beginner | Séries×Reps |
|---|-----------------|----------------------|-------------|
| W | warmup | seed-bird-dog | 2×10 |
| 1 | quads/glutes cmp | seed-squat-barbell | 3×8–12 |
| 2 | chest cmp | seed-bench-barbell | 3×8–12 |
| 3 | back cmp | seed-deadlift (back=match0 prime sur row-barbell=back_thick=match1) | 3×8–12 |
| 4 | shoulders cmp | seed-ohp-barbell | 3×8–12 |
| 5 | hamstrings iso | seed-romanian-deadlift? Non — slot iso, prefer isolation ; aucun iso hamstrings BB/DB → fallback cmp → seed-romanian-deadlift(BB,ham,pop3) | **seed-romanian-deadlift** | 2×10–15 |
| 6 | shoulders_rear iso | seed-face-pull (cable,pop2) | **seed-face-pull** | 2×10–15 |
| C | core | seed-scissors | 3×15 |

**Total : 8 exercices** ✓

**Assertions P28 :**
- adjustedSlotCount(9, 45) = 6 : **PASS**
- Total = 6 + 1 warmup + 1 core = 8 : **PASS** ✓

**Coach P28 :**
- 45min / 8 exercices : 4 compound + 2 isolation + warmup + core. À ~3min/série (hypertrophie) : 3×4×3min = 36min travail + 10min warmup+core ≈ 46min. Légèrement au-dessus mais acceptable.
- Contenu : Les 4 fondamentaux barbell (squat, bench, deadlift, OHP) + RDL + face-pull = programme très solide pour 45min.
- Verdict : ✅ Excellent rapport durée/contenu.

---

## P29 — 90 minutes → cap à 8 slots

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:90, equipment:FULL, level:'beginner' }
```

**Étape 2 :** `['fullbody-quad', 'fullbody-hip']`

**Étape 3 — adjustedSlotCount :**
duration=90, goal=hypertrophy (non-strength) :
`Math.min(base + 2, 8)`
- fullbody-quad base=9 → min(9+2, 8) = min(11, 8) = **8 slots** (cap à 8) ✓

Total = 8 + 1 warmup + 1 core = **10 exercices** ✓

**Pourquoi le cap à 8 :** La formule `base + 2` donnerait 11, mais le template fullbody-quad n'a que 9 slots. Le cap à 8 garantit de ne pas dépasser l'index disponible ET définit un plafond raisonnable (~90 min avec repos 60–90s). Sans cap, le code ferait `baseSlots.slice(0, 11)` qui retournerait seulement 9 éléments — le cap à 8 est donc une garantie de qualité : slot 9 (triceps) éjecté intentionnellement.

**Slot 9 éjecté (triceps) :** En fullbody-quad, le triceps est en position 9 (index 8). Avec cap=8, seuls les slots [0..7] sont pris — triceps absent. Acceptable car les triceps sont sollicités indirectement (bench press, OHP).

**adjustedSpec 90min :** duration=90 → spec inchangée (60 et 90 retournent spec brute).
COMPOUND_SPEC.hypertrophy = **4×8–12**.

Fullbody-quad 8 slots = [quads cmp, chest cmp, back cmp, shoulders cmp, hamstrings iso, shoulders_rear iso, biceps iso, calves iso] — triceps éjecté.

| # | Slot | Exercice FULL beginner | 4×8–12 |
|---|------|----------------------|--------|
| W | warmup | seed-bird-dog | 2×10 |
| 1 | quads/glutes cmp | seed-squat-barbell | 4×8–12 |
| 2 | chest cmp | seed-bench-barbell | 4×8–12 |
| 3 | back cmp | seed-deadlift | 4×8–12 |
| 4 | shoulders cmp | seed-ohp-barbell | 4×8–12 |
| 5 | hamstrings iso | seed-romanian-deadlift (fallback cmp) | 3×10–15 |
| 6 | shoulders_rear iso | seed-face-pull | 3×10–15 |
| 7 | biceps iso | seed-curl-barbell (pop3) | 3×10–15 |
| 8 | calves iso | seed-calf-raise-bb (barbell,pop2) | 3×10–15 |
| C | core | seed-scissors | 3×15 |

**Total : 10 exercices** ✓

**Assertions P29 :**
- adjustedSlotCount(9, 90) = min(11, 8) = 8 : **PASS** ✓
- Total = 8 + warmup + core = 10 : **PASS** ✓
- Cap à 8 = slot triceps éjecté en dernier (position 9) : **PASS** ✓

**Coach P29 :**
- 90min pour 10 exercices : Timing réaliste. 4×4×90s repos = 60min travail + transitions + warmup ≈ 85–90min ✓.
- Repos 90s hypertrophie → le temps est bien utilisé. Un programme force 90min aurait cap=5 (BUG-1) = seulement 7 exercices total, ce qui illustre la différence de tempo repos.
- Verdict : ✅ Programme bien calibré pour 90min hypertrophie.

---

## P30 — Duration 20min sur PPL (pas juste fullbody)

```
{ goal:'strength', daysPerWeek:3, sessionDuration:20, equipment:FULL, level:'intermediate' }
```

**Étape 2 :** daysPerWeek=3, isMass=true (strength), level≠beginner → `['push','pull','legs']`

**Étape 3 — adjustedSlotCount (20min) :**
`Math.max(2, Math.floor(base * 0.5))` — formule identique pour tous les goals à 20min.
- push base=6 → floor(6×0.5)=3 → max(2,3) = **3 slots**
- pull base=6 → **3 slots**
- legs base=6 → **3 slots**

La réduction de durée s'applique identiquement sur PPL ✓.

**isVeryShort = (20 ≤ 20) = true** → warmup 1 série, **core supprimé**.

**adjustedSpec strength 20min :**
`factor=0.5 → sets = max(2, floor(5×0.5)) = max(2,2) = 2`
- COMPOUND_SPEC.strength ajusté : **2×3–5**, restSec=180
- ISOLATION_SPEC.strength ajusté : **2×5–8**, restSec=120

Push 3 slots = SLOTS['push'][0,1,2] = [chest cmp, shoulders cmp, chest iso]
Pull 3 slots = SLOTS['pull'][0,1,2] = [back_width cmp, back_thick cmp, back iso]
Legs 3 slots = SLOTS['legs'][0,1,2] = [quads cmp, hamstrings/glutes cmp, quads iso]

| Session | # | Slot | Exercice (FULL, intermediate→random top-3) | 2×3–5 |
|---------|---|------|------------------------------------------|-------|
| Push | W | warmup | seed-bird-dog (1 série) | 1×10 |
| Push | 1 | chest cmp | Top-3 : seed-bench-barbell, seed-chest-press-machine, seed-bench-dumbbell | 2×3–5 |
| Push | 2 | shoulders cmp | Top-3 : seed-ohp-barbell, seed-shoulder-press-machine, seed-shoulder-press-dumbbell | 2×3–5 |
| Push | 3 | chest iso | seed-fly-dumbbell(pop2) ou seed-fly-cable(pop2) | 2×5–8 |
| Pull | W | warmup | seed-cat-cow (1 série) | 1×10 |
| Pull | 1 | back_width/back cmp | Top-3 : seed-deadlift(back,match0), seed-pullup(back_width,match0,equip4), seed-row-barbell(back_thick,match1) | 2×3–5 |
| Pull | 2 | back_thick/back cmp | Top-3 : seed-row-barbell(back_thick,equip0,pop7), seed-row-tbar(pop2), seed-deadlift(back,usedG si pris en slot1) | 2×3–5 |
| Pull | 3 | back iso | seed-pullover-dumbbell(back_thick,iso,pop3) | 2×5–8 |
| Legs | W | warmup | seed-shoulder-circles (1 série) | 1×10 |
| Legs | 1 | quads cmp | Top-3 : seed-squat-barbell(pop8), seed-front-squat(pop2), seed-lunges(pop2) | 2×3–5 |
| Legs | 2 | hamstrings/glutes cmp | Top-3 : seed-romanian-deadlift(ham,pop3), seed-hip-thrust(glutes,pop4→match1), seed-good-morning(ham,pop1) | 2×3–5 |
| Legs | 3 | quads iso | seed-leg-extension(machine,iso,pop3) | 2×5–8 |

**Total par session : 3 slots + 1 warmup + 0 core = 4 exercices**

**Réalisme 20min force :**
3 exercices (hors warmup) × 2 séries × 3min repos = 18min + transitions ≈ 20–25min. Timing très serré mais théoriquement faisable en force (2 séries au lieu de 5).

**Assertions P30 :**
- Split = ['push','pull','legs'] : **PASS**
- adjustedSlotCount(6, 20, 'strength') = max(2, floor(6×0.5)) = max(2,3) = 3 slots : **PASS** ✓
- Réduction appliquée sur PPL (pas seulement fullbody) : **PASS** (même formule, ligne 428)
- Core supprimé (isVeryShort) : **PASS**
- adjustedSpec : 2×3–5 (max(2, floor(5×0.5))=2) : **PASS**

**Coach P30 :**
- Push 20min avec strength : 2×3–5 sur bench + OHP + fly = ~18min. Faisable si l'athlète est discipliné sur les repos. Mais 3min de repos × 2 séries × 3 exercices = 18min de repos seuls, plus le temps d'exécution = ~22–25min réels.
- Pertinence : 3 exercices strength en 20min — pédagogiquement utile pour les "mini-sessions" d'un athlète avancé mais sous-optimal pour la progression. Recommander au minimum 45min pour de la force.
- Verdict : ⚠️ Faisable mais timing en réalité ~25min. La suppression du core est judicieuse. Recommander 45min minimum pour un programme force.

---

# Récapitulatif P21–P30

## Tableau de synthèse

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|--------|---------------------|---------|-------------------|
| P21 | BW pur : slots back/biceps/triceps/hamstrings vides, autoProgress=false | ✅ PASS assertions techniques | ❌ Programme non viable — dos totalement absent ; 5 slots vides sur 9 ; répétition inévitable seed-pushup/bw-pike-pushup/bw-calf-raise à chaque session ; recommander fortement BW+BAR |
| P22 | slot dos quad : seed-row-dumbbell (back_thick dans liste) ✓ ; slot dos hip : VIDE (BUG#4 résiduel) | ⚠️ PASS partiel | BUG#4 résiduel sur fullbody-hip (back_width/back seulement) ; répétition seed-row-dumbbell forcée sur sessions C (pool épuisé) |
| P23 | Barbell prioritaire (bench-barbell, squat-barbell) ; 4 slots strength 60min ; autoProgress=true | ✅ PASS | Deadlift upper-pull + squat lower-quad dos-à-dos si lundi/mardi → érecteurs sur-sollicités ; slot glutes iso lower-hip presque vide (BB/DB) |
| P24 | seed-lat-pulldown ✓ ; seed-chest-press-machine ✓ ; seed-hip-thrust-machine (SEED-3) ✓ ; aucun BB/DB | ✅ PASS | Pool compound limité (1 seul chest-press-machine, 1 seul shoulder-press-machine) → répétition sur sessions B et C |
| P25 | band-face-pull (SEED-2) ✓ ; seed-band-pull-apart exclu (warmup) ✓ ; slot back_width hip vide (attendu) | ✅ PASS | fullbody-hip B sans tirage dos (back_width vide, band-row=back_thick non dans slot hip) ; pool très restreint → nombreuses répétitions session B |
| P26 | PPL strength avancé ; random top-3 ✓ ; top-3 chest identifiés | ✅ PASS | 4 slots strength par session = sous-optimal pour avancé (recommander 5–6 slots → passer à 60min strength avec cap=4 est le comportement actuel, correct) |
| P27 | 4 slots ✓ ; warmup 1 série ✓ ; **total=5 (core supprimé), pas 6** | ❌ ASSERTION FAIL (prompt indique 6, code produit 5) | 20min avec 4 fondamentaux barbell (squat+bench+deadlift+OHP) = timing serré ; recommander 3 slots max |
| P28 | 6 slots ✓ ; 8 exercices ✓ ; adjustedSpec 3× compound / 2× isolation | ✅ PASS | Timing légèrement serré (~46min) mais acceptable ; RDL utilisé comme isolation hamstrings (fallback compound) |
| P29 | cap 8 = min(11,8) ✓ ; 10 exercices ✓ ; slot triceps éjecté en pos 9 | ✅ PASS | — Programme bien calibré |
| P30 | PPL 20min : 3 slots ✓ ; core supprimé ✓ ; adjustedSpec 2×3–5 ✓ | ✅ PASS | 20min force = ~25min réels (repos 3min) ; 3 exercices insuffisant pour progresser ; recommander 45min minimum pour PPL force |

---

## Bloc 2 — Problèmes ouverts

### Bugs / anomalies logicielles

| Code | Profil | Assertion | Impact | Correction recommandée |
|------|--------|-----------|--------|----------------------|
| **ASSERT-P27** | P27 | Le prompt v3 affirme total=6 (4+warmup+core) ; le code produit 5 (core supprimé ≤20min) | La documentation du générateur est incorrecte | Corriger l'assertion du prompt : "Total = 4 + 1 warmup (1 série) = **5 exercices** (core supprimé)" |
| **BUG#4-résiduel** | P22 | fullbody-hip slot 3 = {muscles:['back_width','back']} → aucun DB compound qualifié (seed-row-dumbbell=back_thickness non dans liste) | Une session sur trois sans tirage en DB-only | Élargir le slot fullbody-hip dos à ['back_width','back_thickness','back'] comme en fullbody-quad |
| **BUG#4-résiduel-P25** | P25 | fullbody-hip slot 3 (back_width/back) : band-row=back_thickness non dans liste → vide en fullbody-hip | Session hip sans tirage en BAND+BW | Même correction que BUG#4 : élargir la liste muscles du slot hip |

### Réserves coach cumulées par thème

**Thème 1 — BW pur post-fix EQUIP : programme structurellement vide (P21)**
Le retrait de pullup_bar de bodyweight rend le programme BW-only non viable : 5 slots vides sur 9, dos/biceps/triceps/ischio totalement absents. Recommandation : le wizard devrait afficher une alerte "Bodyweight seul — programme très limité. Activez 'Barre de traction' pour un programme complet" et/ou suggérer automatiquement BW+BAR.

**Thème 2 — Répétition forcée faute de pool (P21, P22, P24, P25)**
Avec des équipements restreints (BW, DB, MACH+CABLE, BAND+BW), les slots avec un seul candidat (bw-pike-pushup, bw-calf-raise, seed-chest-press-machine, bw-calf-raise) se répètent à chaque session. Un avertissement UX ("La variation entre séances sera limitée avec cet équipement") améliorerait l'expérience.

**Thème 3 — Slot back_width/back vs back_width/back_thickness/back (P22, P25)**
Le pattern fullbody-hip a un slot dos plus restrictif que fullbody-quad, excluant back_thickness. Cela crée un BUG#4 résiduel en DB-only et BAND+BW. La correction est simple : aligner les deux patterns sur `['back_width','back_thickness','back']`.

**Thème 4 — 20 minutes et timing irréaliste (P27, P30)**
La formule floor(base×0.5) pour 20min génère 3–4 slots de force (5 séries, 3min repos) qui dépassent en réalité 20min. Pour les goals strength, un facteur 0.3–0.4 et un max de 2 slots seraient plus appropriés. En hypertrophie, le core est justement supprimé — cohérent.

**Thème 5 — Hamstrings isolation vide en BB/DB (P23, P28, P29)**
Les slots hamstrings isolation tentent d'abord les isolations (leg curl), mais barbell et dumbbell n'ont pas d'isolation hamstrings. Le fallback compound retient dumbbell-rdl ou seed-romanian-deadlift — acceptable mais sémantiquement incorrect (ce sont des composés dans un slot isolation). Un exercice dumbbell isolation hamstrings (ex. "Leg curl avec haltère") renforcerait le pool.

**Thème 6 — Glutes isolation quasi-vide en BB/DB strength (P23 lower-hip)**
Le slot glutes isolation (position 3 dans lower-hip) n'a pratiquement aucun candidat barbell/dumbbell → slot silencieusement vide ou rempli par un composé réutilisé. Ajouter cable kickback (déjà en FULL) ou hip abduction machine améliorerait le coverage.
