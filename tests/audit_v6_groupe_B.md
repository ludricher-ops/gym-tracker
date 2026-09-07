# Audit P13–P22 — Groupe B (v6)

**Date :** 2026-09-07
**Fichiers lus :** `src/utils/programGenerator.ts` + `src/data/exercises-seed.json`
**Fixes vérifiés :** BUG-HIP-BACK, UX-NORDIC-BEGINNER (+ régressions BUG-BW-PULL, ajustements slots/durée)

---

## Formules de référence (extraites du code)

### SLOTS — valeurs clés pour le groupe B

| Type | Index | muscles | compound |
|------|-------|---------|----------|
| `fullbody-hip` | 2 | `['back_width', 'back_thickness', 'back']` | `true` ← **BUG-HIP-BACK FIX** |
| `fullbody-quad` | 2 | `['back_width', 'back_thickness', 'back']` | `true` (inchangé) |
| `fullbody-hip` | 0 | `['hamstrings', 'glutes']` | `true` |
| `lower-quad` | 1 | `['hamstrings', 'glutes']` | `true` |

### adjustedSlotCount (durée 60 min, non-strength)

```
duration === 60, !isStrength → return base
```

- `fullbody-hip` (9 slots) → 9 slots à 60 min
- `fullbody-quad` (9 slots) → 9 slots à 60 min
- `lower-quad` (6+2 slots) → 6 slots à 60 min (8 bonus 90 min)
- `lower-hip` (6+2 slots) → 6 slots à 60 min

### Exercices dos compound — données seed

| id | name | primaryMuscle | equipment | category | popularity |
|----|------|---------------|-----------|----------|------------|
| seed-row-dumbbell | Rowing haltère | `back_thickness` | dumbbell | compound | 3 |
| band-row | Rowing élastique | `back_thickness` | band | compound | 2 |
| seed-pullup | Tractions | `back_width` | pullup_bar | compound | 3 |
| bw-inverted-row | Rowing inversé | `back_thickness` | pullup_bar | compound | 1 |
| seed-lat-pulldown | Tirage vertical | `back_width` | cable | compound | 3 |
| seed-row-cable | Tirage horizontal poulie | `back_thickness` | cable | compound | 2 |
| seed-row-machine | Rowing machine | `back_thickness` | machine | compound | 1 |
| kb-row | Rowing kettlebell | `back_thickness` | kettlebell | compound | 2 |
| seed-row-barbell | Rowing barre | `back_thickness` | barbell | compound | 7 |

**Observation critique :** Il n'existe aucun exercice `machine` avec `primaryMuscle = 'back_width'` dans le seed (pas de lat pulldown machine). Seul `seed-row-machine` (back_thickness) couvre le dos en machine.

### Exercice nordic curl

| id | primaryMuscle | equipment | category | popularity |
|----|---------------|-----------|----------|------------|
| bw-nordic-curl | hamstrings | pullup_bar | compound | **1** ← UX-NORDIC-BEGINNER FIX |

Fix confirmé : popularity est bien 1 (anciennement 2).

### Exercices hamstrings/glutes compound BW+pullup_bar (pertinents P21/P22)

| id | primaryMuscle | equipment | category | popularity | isWarmup |
|----|---------------|-----------|----------|------------|---------|
| bw-nordic-curl | hamstrings | pullup_bar | compound | 1 | false |
| seed-hip-thrust-bw | glutes | bodyweight | compound | 3 | false |
| seed-curtsy-lunge | glutes | bodyweight | compound | 1 | false |
| seed-good-morning-bw | hamstrings | bodyweight | compound | — | **true** (exclu de `available`) |

---

### P13 — [BUG-HIP-BACK-FIXED-DB] Fullbody×3 DB-only → fullbody-hip slot dos

**Paramètres :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell], level=beginner, splitPreference=auto

**Simulation étape par étape :**

1. `selectSplit` : goal=hypertrophy, 3j, level=beginner → branche `// Débutants → fullbody A/B/A`
   - `rawSplit = ['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`

2. `available` = exercices dumbbell, `!deleted`, `!isWarmupExercise`
   - Contient : seed-row-dumbbell (back_thickness, compound), dumbbell-rdl (hamstrings, compound), etc.

3. `hasCompoundBack` : seed-row-dumbbell (primaryMuscle=back_thickness ∈ {back_width, back_thickness, back}, category=compound) → **true**
   - Split inchangé, pas de remplacement pull (pas de 'pull' dans le split de toute façon)

4. `split final = ['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`

5. Séance fullbody-hip (session B), slot [2] :
   - `SLOTS['fullbody-hip'][2]` = `{ muscles: ['back_width', 'back_thickness', 'back'], compound: true }` ← fix appliqué
   - `adjustedSlotCount(9, 60, 'hypertrophy')` = 9 (base) → slot [2] inclus
   - Candidats compound (dumbbell, primaryMuscle ∈ {back_width, back_thickness, back}) :
     - **seed-row-dumbbell** : back_thickness ∈ liste → CANDIDAT VALIDE ✅
     - seed-pullover (dumbbell, back_width) : category=isolation → éliminé par filtre compound
   - seed-row-dumbbell sélectionné (seul compound dos dumbbell) → slot non vide ✅

6. Séance fullbody-quad (sessions A, C), slot [2] :
   - `SLOTS['fullbody-quad'][2]` = `{ muscles: ['back_width', 'back_thickness', 'back'], compound: true }`
   - seed-row-dumbbell candidat (déjà utilisé globalement en B → `usedGlobally` flag) mais c'est le seul → sélectionné quand même (ou null si déjà dans le workout, mais usedInWorkout est par séance)
   - Attention : usedGlobally élimine seed-row-dumbbell des sessions A et C si déjà utilisé → null possible → warning BUG-5

**Assertions : PASS/FAIL**

- SLOTS['fullbody-hip'][2] = `{muscles:['back_width','back_thickness','back'], compound:true}` : **PASS** ← fix confirmé dans le code (ligne ~395)
- seed-row-dumbbell.primaryMuscle = back_thickness, dans la liste → CANDIDAT VALIDE : **PASS**
- Slot [2] fullbody-hip non vide (seed-row-dumbbell sélectionné) : **PASS**
- SLOTS['fullbody-quad'][2] inchangé = même structure : **PASS** (régression OK)
- RÉSERVE : usedGlobally peut éjecter seed-row-dumbbell des séances A/C si utilisé en B → warning BUG-5 possible pour les séances fullbody-quad (seul compound dos dumbbell)

**Verdict : ✅ Bon programme**
Le fix BUG-HIP-BACK est opérant : seed-row-dumbbell qualifié pour fullbody-hip slot dos.

---

### P14 — [BUG-HIP-BACK-FIXED-BAND] Fullbody×3 BAND+BW → fullbody-hip slot dos

**Paramètres :** goal=fat_loss, days=3, duration=60, equipment=[bodyweight, band], level=intermediate, splitPreference=fullbody

**Simulation étape par étape :**

1. `selectSplit` : pref=fullbody, 3j → `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`

2. `available` = exercices band + bodyweight, `!isWarmup`
   - Contient : band-row (back_thickness, compound), band-hip-thrust (glutes, compound), exercices BW divers...

3. `hasCompoundBack` : band-row (primaryMuscle=back_thickness ∈ {back_width, back_thickness, back}, category=compound) → **true**
   - `hasPullInSplit` = false (aucun 'pull' dans ['fullbody-quad', 'fullbody-hip', 'fullbody-quad']) → BUG-BW-PULL non déclenché

4. `split final = ['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`

5. Séance fullbody-hip slot [2] :
   - `{ muscles: ['back_width', 'back_thickness', 'back'], compound: true }`
   - Candidats compound (band + bodyweight, primaryMuscle ∈ {back_width, back_thickness, back}) :
     - **band-row** : back_thickness ∈ liste → CANDIDAT VALIDE ✅
     - Pas d'exercice bodyweight avec back_width/back_thickness comme primaryMuscle et category=compound
     - Pas de pullup_bar dans l'équipement → seed-pullup, bw-inverted-row exclus
   - band-row sélectionné → slot non vide ✅

**Assertions : PASS/FAIL**

- band-row.primaryMuscle = back_thickness, category=compound → CANDIDAT VALIDE : **PASS**
- Slot [2] fullbody-hip non vide : **PASS**
- Split = ['fullbody-quad', 'fullbody-hip', 'fullbody-quad'] : **PASS**
- BUG-BW-PULL non déclenché (pas de 'pull' dans split fullbody) : **PASS**

**Verdict : ✅ Bon programme**
Fix BUG-HIP-BACK opérant en BAND+BW : band-row est le candidat unique et qualifié.

---

### P15 — [BUG-HIP-BACK-FIXED-HOME] Fullbody×2 HOME (KB+DB+BW) → fullbody-hip slot dos

**Paramètres :** goal=hypertrophy, days=2, duration=60, equipment=[kettlebell, dumbbell, bodyweight], level=intermediate, splitPreference=auto

**Simulation étape par étape :**

1. `selectSplit` : auto, 2j → `case 2: return ['fullbody-quad', 'fullbody-hip']`

2. `available` = exercices kettlebell + dumbbell + bodyweight, `!isWarmup`

3. `hasCompoundBack` : seed-row-dumbbell (back_thickness, dumbbell) ou kb-row (back_thickness, kettlebell) → **true**

4. `split final = ['fullbody-quad', 'fullbody-hip']`

5. Séance fullbody-hip slot [2] (muscles: back_width/back_thickness/back, compound) :
   - Candidats : seed-row-dumbbell (back_thickness, dumbbell, pop 3), kb-row (back_thickness, kettlebell, pop 2)
   - slotPrimary = back_width → les deux ont primaryMuscle=back_thickness ≠ back_width → tie sur ce critère
   - Sort final par popularité : seed-row-dumbbell (3) > kb-row (2)
   - Intermediate → top-3 pool (2 candidats) → tirage entre seed-row-dumbbell et kb-row → les deux sont valides ✅

6. Séance fullbody-quad slot [2] (identique) :
   - usedGlobally contient l'exercice sélectionné en fullbody-hip
   - Si seed-row-dumbbell utilisé en hip → kb-row sélectionné en quad (anti-répétition) ✅

**Assertions : PASS/FAIL**

- Slot dos fullbody-hip non vide : **PASS** (seed-row-dumbbell ou kb-row)
- Slot dos fullbody-quad non vide : **PASS** (l'autre exercice grâce à usedGlobally)
- Les deux sessions ont des exercices de dos : **PASS**

**Verdict : ✅ Bon programme**
Le HOME gym bénéficie de deux candidats dos compound (dumbbell row + KB row), bien alternés par usedGlobally.

---

### P16 — [BUG-HIP-BACK-QUAD-INTACT] fullbody-quad slot dos — inchangé (régression)

**Paramètres :** goal=hypertrophy, days=2, duration=60, equipment=[dumbbell], level=intermediate, splitPreference=auto

**Simulation étape par étape :**

1. `selectSplit` : auto, 2j → `['fullbody-quad', 'fullbody-hip']`

2. `hasCompoundBack` : seed-row-dumbbell → true

3. `split final = ['fullbody-quad', 'fullbody-hip']`

4. Séance fullbody-quad slot [2] :
   - `SLOTS['fullbody-quad'][2]` = `{ muscles: ['back_width', 'back_thickness', 'back'], compound: true }`
   - Ce slot existait déjà avec back_thickness AVANT le fix BUG-HIP-BACK (il concernait uniquement fullbody-hip)
   - seed-row-dumbbell (back_thickness, dumbbell, compound) → CANDIDAT VALIDE ✅
   - slot non vide ✅

5. Séance fullbody-hip slot [2] :
   - Même structure (BUG-HIP-BACK fix appliqué) → PASS
   - seed-row-dumbbell déjà dans usedGlobally (utilisé en quad) → warning possible BUG-5

**Assertions : PASS/FAIL**

- SLOTS['fullbody-quad'][2] = `{muscles:['back_width','back_thickness','back'], compound:true}` : **PASS** (inchangé depuis avant le fix)
- seed-row-dumbbell qualifié → slot non vide : **PASS**
- Régression : pas de régression introduite par le fix BUG-HIP-BACK sur fullbody-quad : **PASS**
- RÉSERVE : avec dumbbell seul et 2 sessions, usedGlobally peut forcer le slot fullbody-hip à null pour seed-row-dumbbell → warning attendu (seul compound dos dumbbell)

**Verdict : ✅ Bon programme** (régression vérifiée, pas de cassure)

---

### P17 — [BUG-HIP-BACK-MACH] Fullbody×3 machines → fullbody-hip slot dos

**Paramètres :** goal=fat_loss, days=3, duration=60, equipment=[machine], level=beginner, splitPreference=fullbody

**Simulation étape par étape :**

1. `selectSplit` : pref=fullbody, 3j → `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`

2. `available` = exercices machine, `!isWarmup`
   - Compound dos machine : **seed-row-machine** (back_thickness, machine, compound, pop 1)
   - NOTE : Le seed ne contient **aucun lat pulldown machine** (seed-lat-pulldown est câble). Seul seed-row-machine existe en machine compound dos.

3. `hasCompoundBack` : seed-row-machine (back_thickness ∈ liste) → **true**

4. `split final = ['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`

5. Séance fullbody-hip slot [2] :
   - `{ muscles: ['back_width', 'back_thickness', 'back'], compound: true }`
   - Candidats : seed-row-machine (back_thickness ∈ liste) → CANDIDAT VALIDE ✅
   - slotPrimary = back_width → seed-row-machine (primaryMuscle=back_thickness ≠ back_width) → critère slotPrimary non favorable, mais c'est le seul compound dos machine
   - seed-row-machine sélectionné → slot non vide ✅

**Assertions : PASS/FAIL**

- Séance fullbody-hip slot dos : seed-row-machine (back_thickness ∈ liste) → CANDIDAT VALIDE : **PASS**
- La documentation mentionne "lat-pulldown-machine" comme candidat — **FAUX** : ce n'est pas dans le seed. Seul seed-row-machine existe. : **RÉSERVE**
- Slot non vide : **PASS**

**Verdict : ✅ Bon programme** avec réserve coach.

**Réserve :** Le seed machine ne contient pas de tirage vertical machine (lat pulldown machine). Seul le rowing machine (back_thickness) couvre le slot dos compound en machine. Les débutants machine n'ont donc pas de tirage vertical, ce qui est pédagogiquement incomplet.

---

### P18 — [BUG-HIP-BACK-CABLE] Fullbody alternant câble → fullbody-hip slot dos

**Paramètres :** goal=hypertrophy, days=4, duration=60, equipment=[cable, dumbbell], level=intermediate, splitPreference=fullbody

**Simulation étape par étape :**

1. `selectSplit` : pref=fullbody, 4j → `['fullbody-quad', 'fullbody-hip', 'fullbody-quad', 'fullbody-hip']`

2. `available` = exercices cable + dumbbell, `!isWarmup`

3. `hasCompoundBack` : seed-lat-pulldown (back_width, cable), seed-row-cable (back_thickness, cable), seed-row-dumbbell (back_thickness, dumbbell) → **true**

4. `split final = ['fullbody-quad', 'fullbody-hip', 'fullbody-quad', 'fullbody-hip']`

5. Séance fullbody-hip #1 (session 2) slot [2] :
   - `{ muscles: ['back_width', 'back_thickness', 'back'], compound: true }`
   - Candidats : seed-lat-pulldown (back_width, cable, pop 3), seed-row-cable (back_thickness, cable, pop 2), seed-row-dumbbell (back_thickness, dumbbell, pop 3)
   - slotPrimary = back_width → seed-lat-pulldown (back_width = slotPrimary) priorisé
   - Sort : seed-lat-pulldown (0), puis seed-row-dumbbell (pop 3), puis seed-row-cable (pop 2)
   - Top-3 pool → tirage aléatoire intermediate → seed-lat-pulldown probable mais pas garanti
   - Dans tous les cas, slot non vide ✅

6. Séance fullbody-hip #2 (session 4) slot [2] :
   - seed-lat-pulldown dans usedGlobally → poussé en bas du tri par usedGlobally
   - seed-row-dumbbell (pop 3) ou seed-row-cable (pop 2) probable → slot non vide ✅

**Assertions : PASS/FAIL**

- Toutes les séances fullbody-hip ont un exercice de dos compound : **PASS**
- Candidats câble pour back_width : seed-lat-pulldown (pop 3) → valide : **PASS**
- Candidats câble pour back_thickness : seed-row-cable (pop 2) → valide : **PASS**
- Anti-répétition entre les deux sessions fullbody-hip grâce à usedGlobally : **PASS**

**Verdict : ✅ Bon programme**
Câble + haltères offrent 3 candidats valides, usedGlobally assure la variété entre sessions.

---

### P19 — [BUG-HIP-BACK-PULLUP] Fullbody×3 BW+BAR → fullbody-hip slot dos

**Paramètres :** goal=endurance, days=3, duration=60, equipment=[bodyweight, pullup_bar], level=intermediate, splitPreference=fullbody

**Simulation étape par étape :**

1. `selectSplit` : pref=fullbody, 3j → `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`

2. `available` = exercices bodyweight + pullup_bar, `!isWarmup`

3. `hasCompoundBack` :
   - seed-pullup (back_width, pullup_bar, compound) → **true**
   - bw-inverted-row (back_thickness, pullup_bar, compound) → confirmé aussi

4. `split final = ['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`

5. Séance fullbody-hip slot [2] :
   - `{ muscles: ['back_width', 'back_thickness', 'back'], compound: true }`
   - Candidats : seed-pullup (back_width, pullup_bar, pop 3), bw-inverted-row (back_thickness, pullup_bar, pop 1)
   - slotPrimary = back_width → seed-pullup (primaryMuscle=back_width = slotPrimary) priorisé
   - Sort : seed-pullup (0), bw-inverted-row (1)
   - Intermediate → top-3 (2 candidats) → seed-pullup probable
   - Slot non vide ✅

**Assertions : PASS/FAIL**

- Séance fullbody-hip slot dos : seed-pullup (back_width) → CANDIDAT VALIDE : **PASS**
- primaryMuscle = back_width ∈ {back_width, back_thickness, back} : **PASS**
- Slot non vide : **PASS**

**Verdict : ✅ Bon programme**
Le fix BUG-HIP-BACK est opérant : les tractions (back_width) et le rowing inversé (back_thickness) qualifient pour le slot dos fullbody-hip.

---

### P20 — [BUG-HIP-BACK-FULLGYM] Fullbody×3 salle complète → régression, exercice dos attendu

**Paramètres :** goal=hypertrophy, days=3, duration=60, equipment=[barbell, dumbbell, cable, machine, bodyweight, pullup_bar], level=intermediate, splitPreference=fullbody

**Simulation étape par étape :**

1. `selectSplit` : pref=fullbody, 3j → `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`

2. `hasCompoundBack` : nombreux candidats (seed-row-barbell, seed-row-dumbbell, seed-lat-pulldown, seed-pullup, etc.) → **true**

3. `split final = ['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`

4. Séance fullbody-hip slot [2] :
   - Candidats back_width : seed-lat-pulldown (cable, pop 3), seed-pullup (pullup_bar, pop 3)
   - Candidats back_thickness : seed-row-barbell (barbell, pop 7), seed-row-dumbbell (dumbbell, pop 3), seed-row-cable (cable, pop 2), seed-row-machine (machine, pop 1), bw-inverted-row (pullup_bar, pop 1)
   - slotPrimary = back_width → seed-lat-pulldown et seed-pullup (pop 3) priorisés
   - Intermediate : top-3 pool → seed-lat-pulldown, seed-pullup + (après tie-break popularité) seed-row-barbell ?
     - En réalité, seed-row-barbell a primaryMuscle=back_thickness ≠ back_width → rang inférieur à seed-lat-pulldown/seed-pullup
     - Top-3 parmi back_width : seed-lat-pulldown (pop 3) et seed-pullup (pop 3) en tête → pool de 2 candidats primaires + back_thickness en 3e
   - Slot non vide ✅ (exercice dos sélectionné)

5. Séances fullbody-quad (A et C) : même pattern, anti-répétition via usedGlobally ✅

**Assertions : PASS/FAIL**

- Séance fullbody-hip : exercice dos compound sélectionné : **PASS**
- Toutes les sessions hip ont un exercice de dos : **PASS**
- Anti-répétition entre sessions A et C : **PASS** (usedGlobally actif)

**Verdict : ✅ Bon programme**
Salle complète → abondance de candidats, slot dos jamais vide.

---

### P21 — [NORDIC-BEGINNER-FIXED] lower_pull BW+BAR débutant → nordic curl moins prioritaire

**Paramètres :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight, pullup_bar], level=beginner, splitPreference=auto

**Simulation étape par étape :**

1. `selectSplit` : auto, 3j, beginner → branche `// Débutants → fullbody A/B/A`
   - `rawSplit = ['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`
   - **Pas de lower_pull dans ce split** ✅

2. `available` = exercices bodyweight + pullup_bar, `!isWarmup`

3. `hasCompoundBack` : seed-pullup (back_width, pullup_bar, compound) → **true**
   - Pas de 'pull' dans rawSplit → BUG-BW-PULL non déclenché

4. `split final = ['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`

5. bw-nordic-curl : primaryMuscle=hamstrings, equipment=pullup_bar ∈ {bodyweight, pullup_bar} → disponible
   - popularity = **1** ← fix UX-NORDIC-BEGINNER confirmé

6. Apparition du nordic curl dans les séances :
   - fullbody-hip slot [0] = `{ muscles: ['hamstrings', 'glutes'], compound: true }` :
     - Candidats hamstrings/glutes compound (BW+pullup_bar) :
       - bw-nordic-curl (hamstrings, pullup_bar, compound, pop 1)
       - seed-hip-thrust-bw (glutes, bodyweight, compound, pop 3)
       - seed-curtsy-lunge (glutes, bodyweight, compound, pop 1)
       - seed-good-morning-bw (hamstrings, bodyweight, compound) → **exclu** (isWarmupExercise=true)
     - slotPrimary = 'hamstrings' → bw-nordic-curl (primaryMuscle=hamstrings=slotPrimary) classé en 1er
     - **Beginner** → toujours candidates[0] = bw-nordic-curl sélectionné
     - Malgré la popularité 1, le critère slotPrimary le place en tête → **sélectionné**
   - fullbody-quad : slot hamstrings = isolation (slot [4] = `{muscles:['hamstrings'], compound:false}`) → bw-nordic-curl exclu (compound, préférence isolation)

7. Nordic curl est en slot 1 des séances fullbody-hip (indirectement liés au slot 0 = position 1 parmi les exercises générés, pas la position 1 de la séance finale après warmup)
   - L'assertion "pas en slot 1 (indirect)" signifie : pas dans le contexte d'un lower_pull (slot 1 = lat pulldown), ce qui est correct ici ✅

**Assertions : PASS/FAIL**

- Split = fullbody×3 (beginner 3j) : **PASS**
- Pas de lower_pull dans ce split → nordic curl hors contexte lower_pull slot 1 : **PASS**
- bw-nordic-curl.popularity = 1 (fix appliqué) : **PASS**
- bw-nordic-curl apparaît dans fullbody-hip slot [0] (hamstrings compound) : **PASS** (seul hamstrings compound BW+pullup non-warmup)
- RÉSERVE : En BW+pullup_bar pur, bw-nordic-curl est le **seul exercice hamstrings compound non-warmup**. La dé-priorisation via popularity=1 est sans effet concret ici car il n'y a pas de concurrent hamstrings compound. L'effet du fix se manifeste uniquement en contexte multi-équipements (ex. barbell/dumbbell où RDL est disponible).

**Verdict : ✅ Bon programme** avec réserve coach.

**Réserve coach :** La popularité 1 de bw-nordic-curl ne produit pas d'effet visible pour un profil BW+pullup_bar seul, car c'est le seul composé ischio disponible (good-morning-bw est warmup). L'exercice sera toujours sélectionné pour le slot hamstrings compound fullbody-hip.

---

### P22 — [NORDIC-BEGINNER-FIXED] lower_pull BW+BAR intermédiaire → nordic curl dé-priorisé

**Paramètres :** goal=fat_loss, days=3, duration=60, equipment=[bodyweight, pullup_bar], level=intermediate, focusMuscles=['legs'] (→ split lower via workoutTypeFromFocus)

**Simulation étape par étape :**

1. `workoutTypeFromFocus(['legs'])` :
   - hasLower=true, !hasUpper (pas chest/shoulders/back/arms) → `return 'lower'`

2. `selectSplit` : focusType='lower' → branche lower seul :
   - `Array.from({length: 3}, (_, i) => i%2===0 ? 'lower-quad' : 'lower-hip')`
   - `split = ['lower-quad', 'lower-hip', 'lower-quad']` ✅

3. `available` = exercices bodyweight + pullup_bar, `!isWarmup`

4. `hasCompoundBack` : seed-pullup (back_width, pullup_bar) → **true**
   - Mais : pas de 'pull' dans rawSplit → BUG-BW-PULL non déclenché

5. `split final = ['lower-quad', 'lower-hip', 'lower-quad']`

6. lower-quad slot [1] = `{ muscles: ['hamstrings', 'glutes'], compound: true }` :
   - adjustedSlotCount(6, 60, 'fat_loss') = 6 (base) → slot [1] inclus
   - focusMuscles=['legs'] → focusedMuscles = {quads, hamstrings, glutes, calves}
   - Candidats compound (BW+pullup_bar, primaryMuscle ∈ {hamstrings, glutes}) :
     - **bw-nordic-curl** (hamstrings, pullup_bar, compound, pop 1)
     - **seed-hip-thrust-bw** (glutes, bodyweight, compound, pop 3)
     - **seed-curtsy-lunge** (glutes, bodyweight, compound, pop 1)
     - seed-good-morning-bw → **exclu** (isWarmupExercise=true)
   - Tri des candidats :
     - Step 1 focusMuscles : tous dans {hamstrings, glutes} ⊆ focusedMuscles → aF=bF=0 → tie
     - Step 2 slotPrimary = 'hamstrings' :
       - bw-nordic-curl (primaryMuscle=hamstrings=slotPrimary) → aP=0
       - seed-hip-thrust-bw (primaryMuscle=glutes≠hamstrings) → bP=1
       - seed-curtsy-lunge (primaryMuscle=glutes≠hamstrings) → bP=1
       - **bw-nordic-curl classé AVANT les glutes** malgré popularity=1
     - Step 5 popularité (entre seed-hip-thrust-bw et seed-curtsy-lunge) : seed-hip-thrust-bw (pop 3) > seed-curtsy-lunge (pop 1)
   - Ordre final : bw-nordic-curl (1er), seed-hip-thrust-bw (2e), seed-curtsy-lunge (3e)
   - **Intermediate → top-3 pool → tirage aléatoire parmi les 3 candidats**
   - bw-nordic-curl a 1/3 de chance d'être sélectionné (vs seed-hip-thrust-bw et seed-curtsy-lunge)

7. Autres candidats hamstrings compound BW+pullup_bar à popularité > 1 ?
   - seed-good-morning-bw : exclu (warmup)
   - **AUCUN autre exercice hamstrings compound BW+pullup avec popularity > 1** ✅

8. Impact réel du fix (popularity 1 vs 2) :
   - Avant fix (pop 2) : bw-nordic-curl classé 1er (slotPrimary=hamstrings), dans le top-3 → 1/3 chance
   - Après fix (pop 1) : idem, toujours 1er dans le tri slotPrimary, toujours dans le top-3 → 1/3 chance
   - **Le fix n'a pas d'effet perceptible dans ce contexte** (le critère slotPrimary prime sur la popularité)
   - L'effet du fix est visible uniquement quand un autre exercice hamstrings compound est disponible avec popularité > 1 (ex. dumbbell-RDL ou barbell RDL)

**Assertions : PASS/FAIL**

- Split : lower-quad + lower-hip + lower-quad : **PASS**
- lower-quad slot [1] hamstrings compound : bw-nordic-curl candidat (popularité 1) : **PASS**
- bw-nordic-curl.popularity = 1 : **PASS** (fix confirmé)
- Vérification d'un autre exercice hamstrings compound BW+BAR avec popularité > 1 : **AUCUN** → **PASS** (assertion confirmée)
- Effet de dé-priorisation perceptible dans ce scénario BW+pullup_bar : **FAIL partiel / RÉSERVE** — le slotPrimary='hamstrings' place toujours nordic curl en tête, indépendamment de sa popularité. Le fix n'a pas d'effet pratique ici.

**Verdict : ⚠️ Problème mineur / RÉSERVE**
Le fix UX-NORDIC-BEGINNER est correctement appliqué (popularity=1 ✅) mais son effet réel est nul en contexte BW+pullup_bar : le critère `slotPrimary` force toujours bw-nordic-curl en tête des candidats pour un slot hamstrings, que sa popularité soit 1 ou 2. L'exercice reste dans le top-3 et a 1/3 de chance d'être sélectionné pour un utilisateur intermédiaire.

---

## Tableau de synthèse P13–P22

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|--------|---------------------|---------|-------------------|
| P13 — DB-only fullbody-hip slot dos | SLOTS['fullbody-hip'][2] fix ✅, seed-row-dumbbell candidat ✅ | ✅ | usedGlobally peut vider le slot quad des séances A/C (seul DB row compound dos) |
| P14 — BAND+BW fullbody-hip slot dos | band-row (back_thickness, compound) candidat ✅, slot non vide ✅ | ✅ | band-row seul candidat : si absent du seed, slot serait vide |
| P15 — KB+DB+BW fullbody×2 | DB row + KB row candidats ✅, anti-répétition usedGlobally ✅ | ✅ | Aucune |
| P16 — DB-only fullbody-quad régression | SLOTS['fullbody-quad'][2] inchangé ✅, seed-row-dumbbell ✅ | ✅ | usedGlobally: même réserve que P13 pour programme 2j |
| P17 — Machine fullbody-hip slot dos | seed-row-machine (back_thickness) candidat ✅, slot non vide ✅ | ✅ | Pas de lat pulldown machine dans le seed → seul seed-row-machine (back_thickness) disponible ; tirage vertical absent |
| P18 — Câble+DB fullbody 4j | lat pulldown câble + seated cable row candidats ✅, usedGlobally ✅ | ✅ | Aucune |
| P19 — BW+pullup_bar fullbody-hip | seed-pullup (back_width) ✅, bw-inverted-row (back_thickness) ✅ | ✅ | Aucune |
| P20 — Salle complète fullbody-hip | Abondance candidats, slot non vide ✅ | ✅ | Aucune |
| P21 — Beginner BW+pullup 3j fullbody | Split fullbody×3 ✅, pop=1 ✅, pas de lower_pull ✅ | ✅ | Fix sans effet pratique en BW seul : nordic curl = seul hamstrings compound non-warmup → toujours sélectionné |
| P22 — Intermediate BW+pullup lower-focus | Split lower-quad/hip/quad ✅, pop=1 ✅, nordic curl dans top-3 | ⚠️ | slotPrimary='hamstrings' force nordic curl en tête malgré pop=1 ; fix n'a pas d'effet visible en BW+pullup |

---

## Synthèse des problèmes ouverts

### Bugs / anomalies logicielles (assertions FAIL)

**Aucun FAIL bloquant détecté sur P13–P22.**

Toutes les assertions structurelles passent :
- `SLOTS['fullbody-hip'][2]` contient bien `back_thickness` depuis le fix BUG-HIP-BACK ✅
- `band-row.primaryMuscle = back_thickness`, `category = compound` ✅ (P14 qualifié)
- `bw-nordic-curl.popularity = 1` ✅ (fix UX-NORDIC-BEGINNER confirmé)

### FAIL partiel / Réserves techniques

**P22 — Effet du fix UX-NORDIC-BEGINNER nul en BW+pullup_bar :**
Le critère `slotPrimary` de `pickExercise` place toujours bw-nordic-curl en tête pour les slots hamstrings compound, indépendamment de sa popularité. Le fix (pop 2→1) n'a d'effet perceptible que lorsqu'un exercice concurrent avec `primaryMuscle='hamstrings'` et `popularity ≥ 2` est disponible (ex. barbell RDL, pop 7). En BW+pullup_bar, aucun concurrent hamstrings compound non-warmup n'existe, rendant le fix sans conséquence pratique pour ces profils.

### Réserves coach cumulées

1. **Absence de lat pulldown machine dans le seed** (P17) : les utilisateurs machine-only n'ont accès qu'à un exercice de dos compound (seed-row-machine, back_thickness). L'absence de tirage vertical machine prive ces utilisateurs d'un mouvement fondamental pour la largeur du dos.

2. **Slot fullbody-hip dos en contexte 1-seul-exercice** (P13, P16) : avec dumbbell seul, le seed-row-dumbbell est l'unique compound dos. usedGlobally peut potentiellement le marquer comme "used" dans une session précédente, forçant null dans les sessions suivantes et émettant un warning BUG-5. À 2 sessions fullbody-hip (P16, 2j), la deuxième session fullbody-hip aura probablement son slot dos compound vide.

3. **Fix UX-NORDIC-BEGINNER à portée limitée** (P21, P22) : la dé-priorisation via popularité n'est efficace que si des exercices hamstrings compound alternatifs sont disponibles. En BW+pullup_bar, bw-nordic-curl reste systématiquement sélectionné car il est le seul candidat hamstrings compound non-warmup.
