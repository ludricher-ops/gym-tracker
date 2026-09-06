# Audit P01–P20 — Groupes A+B (v5)
**Date :** 2026-09-06
**Fichiers lus :** programGenerator.ts (961 lignes) + audit_prompt_v3.md
**Changements depuis v4 :** BUG-1 cap 90min strength 5 slots · BUG-3 repsOffset strength intensification -2 · BUG-4 push slot6=shoulders_rear · BUG-5 generatorWarnings[]

---

## Formules de référence (extraites du code)

### adjustedSlotCount(base, duration, goal) — lignes 422–438
| Duration | Strength | Autres goals |
|----------|----------|--------------|
| 20 min | max(2, floor(base×0.5)) | max(2, floor(base×0.5)) |
| 45 min | max(2, floor(base×0.5)) | max(3, floor(base×0.75)) |
| 60 min | max(4, floor(base×0.5)) | base |
| 90 min | min(base, 5) ← BUG-1 | min(base+2, 8) |

### Tailles de templates SLOTS (lignes 109–278)
| Type interne | Slots |
|---|---|
| push | 6 |
| pull | 6 |
| legs | 6 |
| upper | 8 |
| lower | 6 |
| upper-push | 8 |
| upper-pull | 8 |
| lower-quad | 6 |
| lower-hip | 6 |
| lower_pull | 9 |
| lower_push | 9 |
| fullbody-quad | 9 |
| fullbody-hip | 9 |

### Specs de base (lignes 58–74)
| Goal | Compound | Isolation |
|------|----------|-----------|
| strength | 5×3-5 / 180s | 3×5-8 / 120s |
| hypertrophy | 4×8-12 / 90s | 3×10-15 / 75s |
| endurance | 3×15-20 / 60s | 3×15-20 / 45s |
| fat_loss | 3×12-15 / 60s | 3×12-15 / 60s |
| warmup | 2×10 fixe | |
| core | 3×15 fixe | |

Note : adjustedSpec(60 ou 90 min) = spec inchangée (ligne 447).

---

## GROUPE A — Split pur

---

### P01 — Référence fullbody beginner

**Paramètres :** `{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:FULL, level:'beginner' }`

**Simulation :**

**Étape 1 — workoutTypeFromFocus**
- focusMuscles = undefined → tableau vide → return null immédiat (ligne 293)

**Étape 2 — selectSplit**
- focusType = null → branche défaut
- daysPerWeek = 2 → ligne 350 : `['fullbody-quad', 'fullbody-hip']`
- Types publics : `['fullbody', 'fullbody']`

**Étape 3 — Sessions**

Session A — fullbody-quad :
- rawSlots = 9 (SLOTS['fullbody-quad'])
- focusedMuscles = {} (vide) → reorderSlotsByFocus retourne l'ordre original (ligne 487)
- adjustedSlotCount(9, 60, 'hypertrophy') = base = 9 (pas strength, 60min → return base)
- Slots retenus (9) :

| Pos | Muscles cibles | Cat |
|-----|----------------|-----|
| 1 | quads / glutes | cmp |
| 2 | chest / chest_upper | cmp |
| 3 | back_width / back_thickness / back | cmp |
| 4 | shoulders / shoulders_front | cmp |
| 5 | hamstrings | iso |
| 6 | shoulders_rear | iso |
| 7 | biceps | iso |
| 8 | calves | iso |
| 9 | triceps | iso |

Session B — fullbody-hip :
- rawSlots = 9, adjustedSlotCount(9, 60, 'hypertrophy') = 9
- Slots retenus (9) :

| Pos | Muscles cibles | Cat |
|-----|----------------|-----|
| 1 | hamstrings / glutes | cmp |
| 2 | chest / chest_upper | cmp |
| 3 | back_width / back | cmp |
| 4 | shoulders / shoulders_front | cmp |
| 5 | quads | iso |
| 6 | shoulders_lateral / shoulders_rear | iso |
| 7 | biceps | iso |
| 8 | calves | iso |
| 9 | triceps | iso |

**Étape 4 — Séries × reps** (hypertrophy, 60min → spec inchangée)
- Compound : 4×8-12 / 90s
- Isolation : 3×10-15 / 75s
- Warmup : 2×10 / 0s
- Core : 3×15 / 60s

**Programme final**

Full Body A (fullbody-quad) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Quads / Glutes | cmp | 4×8-12 |
| 2 | Chest / Chest upper | cmp | 4×8-12 |
| 3 | Back width / thickness / back | cmp | 4×8-12 |
| 4 | Shoulders / front | cmp | 4×8-12 |
| 5 | Hamstrings | iso | 3×10-15 |
| 6 | Shoulders rear | iso | 3×10-15 |
| 7 | Biceps | iso | 3×10-15 |
| 8 | Calves | iso | 3×10-15 |
| 9 | Triceps | iso | 3×10-15 |
| 10 | Core | — | 3×15 |

Full Body B (fullbody-hip) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Hamstrings / Glutes | cmp | 4×8-12 |
| 2 | Chest / Chest upper | cmp | 4×8-12 |
| 3 | Back width / back | cmp | 4×8-12 |
| 4 | Shoulders / front | cmp | 4×8-12 |
| 5 | Quads | iso | 3×10-15 |
| 6 | Shoulders lateral / rear | iso | 3×10-15 |
| 7 | Biceps | iso | 3×10-15 |
| 8 | Calves | iso | 3×10-15 |
| 9 | Triceps | iso | 3×10-15 |
| 10 | Core | — | 3×15 |

**Nommage :** totalOfType('fullbody')=2 → suffix → 'Full Body A' / 'Full Body B'

**Warnings générés :** aucun (pas de force-beginner, pas de focus, pas de déséquilibre push/pull dans le split fullbody)

**Assertions : PASS/FAIL**
- Split = ['fullbody','fullbody'] : **PASS** (ligne 350)
- Chaque workout : 1 warmup + 9 slots + 1 core = 11 exercices : **PASS** (9+2=11)
- Pas de doublon intra-workout : **PASS** (usedInWorkout set, ligne 805)
- Premier exercice = warmup (isWarmupExercise:true) : **PASS** (unshift ligne 819)
- Dernier exercice = core (primaryMuscle:'core') : **PASS** (push ligne 829)

**Coach :**
- Équilibre musculaire : excellent pour un programme 2j. A couvre quads-dominant + tout le haut. B couvre hamstrings/glutes-dominant + tout le haut. Complémentarité quad/hip parfaite. Tous les groupes majeurs présents.
- Cohérence objectif (hypertrophie) : 4×8-12 sur composés = zone hypertrophie canonique. 3×10-15 en isolation = correct.
- Durée/contenu : 11 exercices × estimation ~3 min/série (travail+repos) → composés 4×4 séries = 16 séries à 90s = 24 min de repos + ~8 min de travail = ~32 min. Isolations 5×3 séries = 15 séries à 75s = 19 min. Warmup+core ~10 min. Total : ~61 min. Serré mais faisable.
- Variété structurelle A/B : différenciée (quad-dominant vs hip-dominant) — structure différente, pas seulement les exercices. ✓
- Couverture isolation : pas de slot chest_upper isolation dédié, pas de quads isolation en A. Lacunes acceptables dans un fullbody 2j.
- **Verdict : ✅ Bon programme**

---

### P02 — Fullbody beginner force 3j

**Paramètres :** `{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner' }`

**Simulation :**

**Étape 1 — workoutTypeFromFocus**
- focusMuscles = undefined → null

**Étape 2 — selectSplit**
- isMass = true (strength)
- daysPerWeek = 3, beginner → branche finale ligne 358 : `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`
- Types publics : `['fullbody', 'fullbody', 'fullbody']`

**Étape 3 — Sessions**

Chaque session fullbody (base=9) avec strength+60min :
- adjustedSlotCount(9, 60, 'strength') = isStrength → max(4, floor(9×0.5)) = max(4, 4) = **4 slots**

Slots retenus (4 premiers de chaque template) :

Full Body A / C (fullbody-quad, premiers 4 slots) :
| Pos | Muscles | Cat |
|-----|---------|-----|
| 1 | Quads / Glutes | cmp |
| 2 | Chest / Chest upper | cmp |
| 3 | Back width / thickness / back | cmp |
| 4 | Shoulders / front | cmp |

Full Body B (fullbody-hip, premiers 4 slots) :
| Pos | Muscles | Cat |
|-----|---------|-----|
| 1 | Hamstrings / Glutes | cmp |
| 2 | Chest / Chest upper | cmp |
| 3 | Back width / back | cmp |
| 4 | Shoulders / front | cmp |

**Étape 4 — Séries × reps** (strength, 60min → spec inchangée)
- Compound : 5×3-5 / 180s
- Warmup : 2×10
- Core : 3×15

**Programme final**

Full Body A (fullbody-quad, 4 slots) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Quads / Glutes | cmp | 5×3-5 |
| 2 | Chest / Chest upper | cmp | 5×3-5 |
| 3 | Back width / thickness / back | cmp | 5×3-5 |
| 4 | Shoulders / front | cmp | 5×3-5 |
| 5 | Core | — | 3×15 |

Full Body B (fullbody-hip, 4 slots) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Hamstrings / Glutes | cmp | 5×3-5 |
| 2 | Chest / Chest upper | cmp | 5×3-5 |
| 3 | Back width / back | cmp | 5×3-5 |
| 4 | Shoulders / front | cmp | 5×3-5 |
| 5 | Core | — | 3×15 |

Full Body C = même structure que A (fullbody-quad), usedGlobally différent.

**Nommage :** totalOfType('fullbody')=3 → 'Full Body A', 'Full Body B', 'Full Body C'

**Warnings générés :**
- UX-C : "Force pour débutant : les specs 5×3–5 supposent une technique parfaite..." (ligne 861, unshifted)

**Assertions : PASS/FAIL**
- Split = ['fullbody','fullbody','fullbody'] : **PASS** (ligne 358)
- Beginner reste fullbody (PPL nécessite intermediate+) : **PASS** (ligne 354 : isMass && !beginner → PPL)
- 11 exercices par workout (9 slots + warmup + core) : **FAIL** ← strength + 60min → 4 slots seulement → réel : 4+1+1 = **6 exercices** par workout. La formule `max(4, floor(9×0.5))=4` limite à 4 slots. L'assertion du prompt est basée sur l'ancienne formule ×0.75.

**Coach :**
- Équilibre musculaire : 4 composés uniquement (squat, bench, row, OHP) → pas d'isolation. Programme très minimaliste mais cohérent pour force débutant.
- Cohérence objectif : 5×3-5 pour un débutant est techniquement risqué — le warning est justifié. Commencer par 3×5 (Starting Strength) serait plus approprié.
- Durée/contenu : 4 composés × 5 séries à 180s de repos = 20 séries → 60 min de repos seul + travail = 70–80 min pour un débutant (qui prend plus de temps). En pratique plus long que 60 min.
- Variété A/B/C : quad vs hip vs quad — variété structurelle partielle (A et C identiques).
- **Verdict : ⚠️ Problème mineur** — assertion slot FAIL (code récent modifié), timing réel > 60 min pour 5×3-5 débutant, force+débutant = warning justifié mais le programme est techniquement cohérent.

---

### P03 — PPL strength intermediate 3j

**Paramètres :** `{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'intermediate' }`

**Simulation :**

**Étape 1 :** focusMuscles = undefined → null

**Étape 2 — selectSplit**
- isMass = true (strength), !beginner (intermediate)
- daysPerWeek = 3 → ligne 354 : `['push', 'pull', 'legs']`

**Étape 3 — Sessions**

adjustedSlotCount pour strength + 60min :
- push (base=6) : max(4, floor(6×0.5)) = max(4, 3) = **4 slots**
- pull (base=6) : max(4, 3) = **4 slots**
- legs (base=6) : max(4, 3) = **4 slots**

Slots push (4 premiers) :
| Pos | Muscles | Cat |
|-----|---------|-----|
| 1 | Chest / chest_upper / chest_lower | cmp |
| 2 | Shoulders / shoulders_front | cmp |
| 3 | Chest / chest_upper / chest_lower | iso |
| 4 | Triceps | iso |

Slots pull (4 premiers) :
| Pos | Muscles | Cat |
|-----|---------|-----|
| 1 | Back_width / back | cmp |
| 2 | Back_thickness / back | cmp |
| 3 | Back_thickness / back_width / back | iso |
| 4 | Biceps | iso |

Slots legs (4 premiers) :
| Pos | Muscles | Cat |
|-----|---------|-----|
| 1 | Quads | cmp |
| 2 | Hamstrings / Glutes | cmp |
| 3 | Quads | iso |
| 4 | Glutes | iso |

**Étape 4 — Séries × reps** (strength, 60min)
- Compound : 5×3-5 / 180s
- Isolation : 3×5-8 / 120s
- Warmup : 2×10 / Core : 3×15

**Programme final**

Push — Poussée (4 slots) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Chest (compound) | cmp | 5×3-5 |
| 2 | Shoulders / front (compound) | cmp | 5×3-5 |
| 3 | Chest (isolation) | iso | 3×5-8 |
| 4 | Triceps (isolation) | iso | 3×5-8 |
| 5 | Core | — | 3×15 |

Pull — Tirage (4 slots) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Back width (compound) | cmp | 5×3-5 |
| 2 | Back thickness (compound) | cmp | 5×3-5 |
| 3 | Back (isolation) | iso | 3×5-8 |
| 4 | Biceps (isolation) | iso | 3×5-8 |
| 5 | Core | — | 3×15 |

Legs — Jambes (4 slots) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Quads (compound) | cmp | 5×3-5 |
| 2 | Hamstrings / Glutes (compound) | cmp | 5×3-5 |
| 3 | Quads (isolation) | iso | 3×5-8 |
| 4 | Glutes (isolation) | iso | 3×5-8 |
| 5 | Core | — | 3×15 |

**Nommage :** chaque type apparaît 1× → pas de suffixe

**Assertions : PASS/FAIL**
- Split = ['push','pull','legs'] : **PASS** (ligne 354)
- Workout push contient chest compound ET shoulders compound : **PASS** (slots 1 et 2)
- Workout pull contient dos + biceps : **PASS** (slots 1,2 = dos cmp ; slot 4 = biceps iso)
- Workout legs contient quads + hamstrings/glutes : **PASS** (slots 1 et 2)

**Coach :**
- Équilibre musculaire push/pull : 1 séance push, 1 séance pull → équilibre hebdomadaire ✓. Épaules présentes en push, pas de slot face pull en pull (coupé à 4 slots).
- Cohérence strength : 5×3-5 sur composés ✓. Isolations 3×5-8 un peu hautes en reps pour de la force pure, mais acceptable.
- Durée/contenu : 2 composés + 2 isolations × 5 et 3 séries → 10+6+6+6+warmup+core séries ≈ 70 min avec 180s de repos. Trop long pour 60 min déclarées.
- Lacunes : pas de slot calves, hamstrings iso, shoulders_rear en legs/pull (coupés à 4 slots).
- **Verdict : ⚠️ Problème mineur** — timing irréaliste (force 5×3-5 + 180s repos en 60 min), mais structure PPL correcte.

---

### P04 — PPL hypertrophie intermediate 3j

**Paramètres :** `{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'intermediate' }`

**Simulation :**

**Étape 1 :** focusMuscles = undefined → null

**Étape 2 — selectSplit**
- isMass = true (hypertrophy), !beginner
- daysPerWeek = 3 → ligne 354 : `['push', 'pull', 'legs']` (même split que P03)

**Étape 3 — Sessions**

adjustedSlotCount pour hypertrophy + 60min :
- push (base=6) : return base = **6 slots**
- pull (base=6) : **6 slots**
- legs (base=6) : **6 slots**

Slots push (6, tous) :
| Pos | Muscles | Cat |
|-----|---------|-----|
| 1 | Chest / chest_upper / chest_lower | cmp |
| 2 | Shoulders / shoulders_front | cmp |
| 3 | Chest / chest_upper / chest_lower | iso |
| 4 | Triceps | iso |
| 5 | Shoulders_lateral / shoulders | iso |
| 6 | Shoulders_rear | iso |

Slots pull (6) :
| Pos | Muscles | Cat |
|-----|---------|-----|
| 1 | Back_width / back | cmp |
| 2 | Back_thickness / back | cmp |
| 3 | Back_thickness / back_width / back | iso |
| 4 | Biceps | iso |
| 5 | Shoulders_rear | iso |
| 6 | Forearms | iso |

Slots legs (6) :
| Pos | Muscles | Cat |
|-----|---------|-----|
| 1 | Quads | cmp |
| 2 | Hamstrings / Glutes | cmp |
| 3 | Quads | iso |
| 4 | Glutes | iso |
| 5 | Hamstrings | iso |
| 6 | Calves | iso |

**Étape 4 — Séries × reps** (hypertrophy, 60min)
- Compound : 4×8-12 / 90s
- Isolation : 3×10-15 / 75s

**Programme final**

Push — Poussée (6 slots) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Chest compound | cmp | 4×8-12 |
| 2 | Shoulders compound (OHP) | cmp | 4×8-12 |
| 3 | Chest isolation (fly) | iso | 3×10-15 |
| 4 | Triceps isolation | iso | 3×10-15 |
| 5 | Shoulders lateral/isolation | iso | 3×10-15 |
| 6 | Shoulders rear (face pull) | iso | 3×10-15 |
| 7 | Core | — | 3×15 |

Pull — Tirage (6 slots) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Back width compound (pulldown) | cmp | 4×8-12 |
| 2 | Back thickness compound (row) | cmp | 4×8-12 |
| 3 | Back isolation | iso | 3×10-15 |
| 4 | Biceps isolation | iso | 3×10-15 |
| 5 | Shoulders rear isolation | iso | 3×10-15 |
| 6 | Forearms isolation | iso | 3×10-15 |
| 7 | Core | — | 3×15 |

Legs — Jambes (6 slots) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Quads compound (squat) | cmp | 4×8-12 |
| 2 | Hamstrings/Glutes compound (RDL) | cmp | 4×8-12 |
| 3 | Quads isolation (leg ext) | iso | 3×10-15 |
| 4 | Glutes isolation | iso | 3×10-15 |
| 5 | Hamstrings isolation (leg curl) | iso | 3×10-15 |
| 6 | Calves isolation | iso | 3×10-15 |
| 7 | Core | — | 3×15 |

**Assertions : PASS/FAIL**
- Split = ['push','pull','legs'] : **PASS** (même branche que P03, goal ne change pas le split)
- La branche PPL ne dépend pas de l'objectif, seulement du niveau : **PASS** (isMass && !beginner → PPL)
- Reps dans la zone hypertrophie (6-12) : **PASS** (8-12 pour les composés)

**Coach :**
- Équilibre musculaire : excellent. Push = pec + OHP + tri + épaules. Pull = dos + biceps + épaules arrière. Legs = quads + ischios + fessiers + mollets. Couverture complète.
- Volume par groupe : pectoraux 1 cmp + 1 iso = 7 séries ; dos 2 cmp + 1 iso = 11 séries → léger déséquilibre push/pull en volume hebdo, mais ratio acceptable.
- Durée : 2 cmp (8 séries) + 4 iso (12 séries) = 20 séries à ~3 min moyen = 60 min. Faisable.
- Face pull en push (slot 6) ET shoulders_rear en pull (slot 5) = double couverture épaule arrière hebdo ✓ (prévention lésions).
- **Verdict : ✅ Bon programme**

---

### P05 — Endurance intermediate 3j → PPF

**Paramètres :** `{ goal:'endurance', daysPerWeek:3, sessionDuration:60, equipment:BW, level:'intermediate' }`

**Simulation :**

**Étape 1 :** focusMuscles = undefined → null

**Étape 2 — selectSplit**
- isMass = false (endurance ≠ strength/hypertrophy)
- !beginner (intermediate)
- daysPerWeek = 3 → ligne 356 : `!isMass && level !== 'beginner'` → `['push', 'pull', 'fullbody-quad']`
- Types publics : `['push', 'pull', 'fullbody']`

**Étape 3 — Sessions**

adjustedSlotCount pour endurance + 60min = base :
- push (base=6) : **6 slots**
- pull (base=6) : **6 slots**
- fullbody-quad (base=9) : **9 slots**

available : exercises filtrées pour `equipment:'bodyweight'` uniquement, hors warmup, hors deleted.

**Impact post-commit 5941987 (BW pur) :**
- `seed-pullup` → pullup_bar → EXCLU de BW
- `bw-inverted-row` → pullup_bar → EXCLU
- `bw-chinup` → pullup_bar → EXCLU
- `seed-dips` → pullup_bar → EXCLU
- `seed-triceps-dips` → pullup_bar → EXCLU
- `bw-nordic-curl` → pullup_bar → EXCLU
- `seed-hanging-leg-raise` → pullup_bar → EXCLU

Conséquences sur le pull day :
- Slot 1 `back_width / back` compound → aucun exercice bodyweight pur → pickExercise retourne null → **slot vide** → warning BUG-5 : "Aucun exercice composé disponible pour 'dos (largeur)'"
- Slot 2 `back_thickness / back` compound → aucun exercice bodyweight pur pour back_thickness → **slot vide** → warning BUG-5 : "Aucun exercice composé disponible pour 'dos (épaisseur)'"
- Slot 4 `biceps` isolation : bw-chinup exclu → si d'autres exercices BW biceps existent, slot rempli ; sinon vide

**Programme final**

Push — Poussée (6 slots, BW) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Chest compound (ex : push-up) | cmp | 3×15-20 |
| 2 | Shoulders compound (ex : pike push-up) | cmp | 3×15-20 |
| 3 | Chest isolation (ex : push-up incliné, si disponible) | iso | 3×15-20 |
| 4 | Triceps isolation | iso | 3×15-20 |
| 5 | Shoulders lateral isolation | iso | 3×15-20 |
| 6 | Shoulders rear isolation | iso | 3×15-20 |
| 7 | Core | — | 3×15 |

Pull — Tirage (6 slots, BW — slots dos vides) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Back width compound | cmp | **— slot vide —** (warning émis) |
| 2 | Back thickness compound | cmp | **— slot vide —** (warning émis) |
| 3 | Back isolation | iso | (si candidat BW existe) |
| 4 | Biceps isolation | iso | (si candidat BW exist sans chinup) |
| 5 | Shoulders rear isolation | iso | 3×15-20 |
| 6 | Forearms isolation | iso | 3×15-20 |
| 7 | Core | — | 3×15 |

Full Body (fullbody-quad, 9 slots, BW) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Quads/Glutes compound (ex : bw-squat) | cmp | 3×15-20 |
| 2 | Chest compound (ex : push-up) | cmp | 3×15-20 |
| 3 | Back width/thickness compound | cmp | **— slot vide —** (warning déjà dédupliqué) |
| 4 | Shoulders compound | cmp | 3×15-20 |
| 5 | Hamstrings isolation | iso | 3×15-20 |
| 6 | Shoulders rear isolation | iso | 3×15-20 |
| 7 | Biceps isolation | iso | 3×15-20 |
| 8 | Calves isolation | iso | 3×15-20 |
| 9 | Triceps isolation | iso | 3×15-20 |
| 10 | Core | — | 3×15 |

**Nommage :** chaque type 1× dans split → pas de suffixe → 'Push — Poussée', 'Pull — Tirage', 'Full Body'

**Warnings générés :**
- "Aucun exercice composé disponible pour 'dos (largeur)'" (pull, warnKey = 'pull:back_width')
- "Aucun exercice composé disponible pour 'dos (épaisseur)'" (pull, warnKey = 'pull:back_thickness')
- Le fullbody-quad a aussi un slot dos mais warnKey 'fullbody-quad:back_width' est différent → un 3e warning possible selon la déduplication

Note : la déduplication est par `warnKey = "${workoutType}:${primaryMuscle}"` (ligne 793). 'pull' et 'fullbody-quad' sont des workoutType distincts → les warnings du fullbody-quad ne sont PAS dédupliqués avec ceux du pull day → 2 warnings supplémentaires pour fullbody-quad.

**Assertions : PASS/FAIL**
- Split = ['push','pull','fullbody-quad'] (PPF) : **PASS** (ligne 356)
- `endurance` (isMass=false) + intermediate + 3j → PPF, pas PPL ni fullbody×3 : **PASS**
- Branche `!isMass && level !== 'beginner'` : **PASS**
- Noms sans suffixe A/B : **PASS**
- Pas de doublon intra-workout : **PASS**

**Coach :**
- Reps zone endurance (15+) : **PASS** (3×15-20)
- Pull day en BW pur (post-fix EQUIP-1/2) : dos structurellement absent (back_width et back_thickness sans candidats). La séance pull se réduit à des isolations épaule + avant-bras + potentiellement biceps → pull day non viable pour un programme équilibré. Déséquilibre posture flagrant.
- Le programme génère des warnings (BUG-5) mais les émet et continue — résultat : séance pull avec 0 ou 1 exercice de dos.
- Recommandation coach : afficher un message bloquant "Pas de barre de traction disponible → Pull day impossible en BW pur. Passez sur BW+BAR."
- **Verdict : ❌ Problème sérieux** — Pull day sans dos en BW pur. Programme pull non fonctionnel. BW intermédiaire sans pullup_bar = configuration non viable pour un split PPF.

---

### P06 — Fat loss intermediate 3j → PPF

**Paramètres :** `{ goal:'fat_loss', daysPerWeek:3, sessionDuration:60, equipment:BW, level:'intermediate' }`

**Simulation :**

**Étape 1 :** focusMuscles = undefined → null

**Étape 2 — selectSplit**
- isMass = false (fat_loss ≠ strength/hypertrophy)
- !beginner
- daysPerWeek = 3 → ligne 356 : `['push', 'pull', 'fullbody-quad']`

**Étape 3 — Sessions**

adjustedSlotCount pour fat_loss + 60min = base :
- push (6) : 6 slots
- pull (6) : 6 slots
- fullbody-quad (9) : 9 slots

Même impact BW pur que P05 pour le pull day (back_width et back_thickness slots vides).

**Séries × reps** (fat_loss, 60min) :
- Compound : 3×12-15 / 60s
- Isolation : 3×12-15 / 60s

**Programme final**

Push — Poussée (6 slots, BW) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Chest compound | cmp | 3×12-15 |
| 2 | Shoulders compound | cmp | 3×12-15 |
| 3 | Chest isolation | iso | 3×12-15 |
| 4 | Triceps isolation | iso | 3×12-15 |
| 5 | Shoulders lateral iso | iso | 3×12-15 |
| 6 | Shoulders rear iso | iso | 3×12-15 |
| 7 | Core | — | 3×15 |

Pull — Tirage (6 slots, BW — dos vide) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Back width compound | cmp | **— slot vide —** |
| 2 | Back thickness compound | cmp | **— slot vide —** |
| 3–6 | (isolations partielles selon seed) | iso | 3×12-15 |
| 7 | Core | — | 3×15 |

Full Body (9 slots, BW) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Quads/Glutes compound (squat BW) | cmp | 3×12-15 |
| 2 | Chest compound | cmp | 3×12-15 |
| 3 | Back compound | cmp | **— slot vide —** |
| 4 | Shoulders compound | cmp | 3×12-15 |
| 5-9 | Isolations | iso | 3×12-15 |
| 10 | Core | — | 3×15 |

**Assertions : PASS/FAIL**
- Split = ['push','pull','fullbody'] (PPF) : **PASS**
- fat_loss (isMass=false) + intermediate → même règle que endurance : **PASS**
- Noms sans suffixe A/B : **PASS**

**Coach :**
- Rapport cardio/force fat_loss : 3×12-15 avec repos 60s = style circuit, cohérent avec fat_loss. Densité haute ✓.
- Même problème structurel que P05 : pull day sans dos en BW pur.
- En fat_loss, le déséquilibre est peut-être moins problématique (l'emphase est sur la dépense calorique), mais reste une lacune d'équilibre musculaire.
- **Verdict : ❌ Problème sérieux** — même que P05. Pull day non fonctionnel en BW pur post-fix EQUIP-1/2.

---

### P07 — Upper/Lower beginner 4j

**Paramètres :** `{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'beginner' }`

**Simulation :**

**Étape 1 :** focusMuscles = undefined → null

**Étape 2 — selectSplit**
- isMass = true (hypertrophy), beginner
- daysPerWeek = 4 → ligne 362 : `isMass` → `['upper-push', 'lower-quad', 'upper-pull', 'lower-hip']`
- Types publics : `['upper', 'lower', 'upper', 'lower']`

**Étape 3 — Sessions**

adjustedSlotCount pour hypertrophy + 60min = base :
- upper-push (base=8) : **8 slots**
- lower-quad (base=6) : **6 slots**
- upper-pull (base=8) : **8 slots**
- lower-hip (base=6) : **6 slots**

Total exercices : upper 8+2=**10**, lower 6+2=**8**

**Nommage :**
- typeCount: upper-push → canon='upper', count=1 → 'Upper — Haut du corps A'
- lower-quad → canon='lower', count=1 → 'Lower — Bas du corps A'
- upper-pull → canon='upper', count=2 → 'Upper — Haut du corps B'
- lower-hip → canon='lower', count=2 → 'Lower — Bas du corps B'

Slots upper-push (8) :
| Pos | Muscles | Cat |
|-----|---------|-----|
| 1 | Chest / chest_upper | cmp |
| 2 | Back_width / back_thickness / back | cmp |
| 3 | Shoulders / front | cmp |
| 4 | Chest / chest_lower / chest_upper | iso |
| 5 | Triceps | iso |
| 6 | Shoulders_lateral | iso |
| 7 | Biceps | iso |
| 8 | Back_thickness / back | iso |

Slots upper-pull (8) :
| Pos | Muscles | Cat |
|-----|---------|-----|
| 1 | Back_width / back | cmp |
| 2 | Back_thickness / back | cmp |
| 3 | Chest / chest_upper | cmp |
| 4 | Shoulders_rear | iso |
| 5 | Biceps | iso |
| 6 | Back_thickness / back | iso |
| 7 | Triceps | iso |
| 8 | Shoulders_lateral | iso |

Slots lower-quad (6) :
| Pos | Muscles | Cat |
|-----|---------|-----|
| 1 | Quads / Glutes | cmp |
| 2 | Hamstrings / Glutes | cmp |
| 3 | Quads | iso |
| 4 | Hamstrings | iso |
| 5 | Glutes | iso |
| 6 | Calves | iso |

Slots lower-hip (6) :
| Pos | Muscles | Cat |
|-----|---------|-----|
| 1 | Glutes / Hamstrings | cmp |
| 2 | Quads / Glutes | cmp |
| 3 | Glutes | iso |
| 4 | Hamstrings | iso |
| 5 | Quads | iso |
| 6 | Calves | iso |

**Programme final — hypertrophy, 60min**

Upper — Haut du corps A (upper-push, 8 slots) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Chest compound (bench) | cmp | 4×8-12 |
| 2 | Back compound (row/pulldown) | cmp | 4×8-12 |
| 3 | Shoulders compound (OHP) | cmp | 4×8-12 |
| 4 | Chest isolation (fly) | iso | 3×10-15 |
| 5 | Triceps isolation | iso | 3×10-15 |
| 6 | Shoulders lateral isolation | iso | 3×10-15 |
| 7 | Biceps isolation | iso | 3×10-15 |
| 8 | Back isolation | iso | 3×10-15 |
| 9 | Core | — | 3×15 |

Upper — Haut du corps B (upper-pull, 8 slots) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Back width compound (pulldown) | cmp | 4×8-12 |
| 2 | Back thickness compound (row) | cmp | 4×8-12 |
| 3 | Chest compound (incline bench) | cmp | 4×8-12 |
| 4 | Shoulders rear (face pull) | iso | 3×10-15 |
| 5 | Biceps isolation | iso | 3×10-15 |
| 6 | Back isolation | iso | 3×10-15 |
| 7 | Triceps isolation | iso | 3×10-15 |
| 8 | Shoulders lateral isolation | iso | 3×10-15 |
| 9 | Core | — | 3×15 |

Lower — Bas du corps A (lower-quad, 6 slots) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Quads/Glutes compound (squat) | cmp | 4×8-12 |
| 2 | Hamstrings/Glutes compound (RDL) | cmp | 4×8-12 |
| 3 | Quads isolation (leg ext) | iso | 3×10-15 |
| 4 | Hamstrings isolation (leg curl) | iso | 3×10-15 |
| 5 | Glutes isolation | iso | 3×10-15 |
| 6 | Calves isolation | iso | 3×10-15 |
| 7 | Core | — | 3×15 |

Lower — Bas du corps B (lower-hip, 6 slots) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Glutes/Hamstrings compound (hip thrust) | cmp | 4×8-12 |
| 2 | Quads/Glutes compound (lunge/step-up) | cmp | 4×8-12 |
| 3 | Glutes isolation | iso | 3×10-15 |
| 4 | Hamstrings isolation | iso | 3×10-15 |
| 5 | Quads isolation | iso | 3×10-15 |
| 6 | Calves isolation | iso | 3×10-15 |
| 7 | Core | — | 3×15 |

**Assertions : PASS/FAIL**
- Split public = ['upper','lower','upper','lower'] : **PASS**
- Types internes : upper-push / lower-quad / upper-pull / lower-hip : **PASS** (ligne 362)
- Noms A/B : **PASS** (upper A, lower A, upper B, lower B)
- Upper A (8 slots → 10 exos) : **PASS**
- Upper B (8 slots → 10 exos) : **PASS**
- Lower A (6 slots → 8 exos) : **PASS**
- Lower B (6 slots → 8 exos) : **PASS**
- Chest compound en tête de upper-push : **PASS** (slot 1)
- Back compound en tête de upper-pull : **PASS** (slots 1 et 2)
- Chaque lower inclut un slot calves isolation : **PASS** (lower-quad slot 6, lower-hip slot 6)

**Coach :**
- Équilibre haut/bas : 2 sessions upper + 2 sessions lower → parfait pour 4j ✓
- Upper A (bench-first) vs Upper B (traction-first) : variété structurelle ✓. Récupération : upper A lundi, upper B jeudi (si jours 1-2-3-4 = lun/mar/jeu/ven) → 2 jours entre upper A et upper B ✓.
- Lower A (squat-dominant) vs Lower B (hip-dominant) : variété structurelle ✓.
- Volume par groupe : chaque muscle haut du corps travaillé 2× par semaine (A+B). Mollets 2×/semaine ✓.
- Face pull en upper-pull (slot 4) pour la santé de l'épaule ✓.
- **Verdict : ✅ Bon programme** — excellent équilibre pour un débutant 4j.

---

### P08 — 5j intermediate PPL+UL

**Paramètres :** `{ goal:'strength', daysPerWeek:5, sessionDuration:60, equipment:FULL, level:'intermediate' }`

**Simulation :**

**Étape 1 :** focusMuscles = undefined → null

**Étape 2 — selectSplit**
- isMass = true (strength), !beginner
- daysPerWeek = 5 → ligne 370 : `isMass && level !== 'beginner'` → `['push', 'pull', 'legs', 'upper', 'lower']`

**Étape 3 — Sessions**

adjustedSlotCount pour strength + 60min :
- push (6) : max(4, floor(6×0.5)) = max(4,3) = **4 slots**
- pull (6) : **4 slots**
- legs (6) : **4 slots**
- upper (8) : max(4, floor(8×0.5)) = max(4,4) = **4 slots**
- lower (6) : max(4, floor(6×0.5)) = max(4,3) = **4 slots**

Tous : 4 slots + warmup + core = 6 exercices

Slots upper (4 premiers) :
| Pos | Muscles | Cat |
|-----|---------|-----|
| 1 | Chest / chest_upper | cmp |
| 2 | Back_width / back_thickness / back | cmp |
| 3 | Shoulders / front | cmp |
| 4 | Shoulders_lateral / shoulders_rear | iso |

Slots lower (4 premiers) :
| Pos | Muscles | Cat |
|-----|---------|-----|
| 1 | Quads | cmp |
| 2 | Hamstrings / Glutes | cmp |
| 3 | Quads | iso |
| 4 | Glutes | iso |

**Programme final** (tous 4 slots + warmup + core = 6 exos)

Push — Poussée :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Chest compound | cmp | 5×3-5 |
| 2 | Shoulders compound | cmp | 5×3-5 |
| 3 | Chest isolation | iso | 3×5-8 |
| 4 | Triceps isolation | iso | 3×5-8 |
| 5 | Core | — | 3×15 |

Pull — Tirage :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Back width compound | cmp | 5×3-5 |
| 2 | Back thickness compound | cmp | 5×3-5 |
| 3 | Back isolation | iso | 3×5-8 |
| 4 | Biceps isolation | iso | 3×5-8 |
| 5 | Core | — | 3×15 |

Legs — Jambes :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Quads compound (squat) | cmp | 5×3-5 |
| 2 | Hamstrings/Glutes compound (DL) | cmp | 5×3-5 |
| 3 | Quads isolation | iso | 3×5-8 |
| 4 | Glutes isolation | iso | 3×5-8 |
| 5 | Core | — | 3×15 |

Upper — Haut du corps :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Chest compound | cmp | 5×3-5 |
| 2 | Back compound | cmp | 5×3-5 |
| 3 | Shoulders compound | cmp | 5×3-5 |
| 4 | Shoulders lateral/rear isolation | iso | 3×5-8 |
| 5 | Core | — | 3×15 |

Lower — Bas du corps :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Quads compound | cmp | 5×3-5 |
| 2 | Hamstrings/Glutes compound | cmp | 5×3-5 |
| 3 | Quads isolation | iso | 3×5-8 |
| 4 | Glutes isolation | iso | 3×5-8 |
| 5 | Core | — | 3×15 |

**Nommage :** chaque type public apparaît 1× → pas de suffixe.

**Assertions : PASS/FAIL**
- Split = ['push','pull','legs','upper','lower'] : **PASS** (ligne 370)
- 5 workouts distincts : **PASS**

**Coach :**
- Récupération : Bench press (push, chest) ET upper day contient chest compound → pectoraux sollicités 2× sur 5j (push + upper). Similairement dos 2× (pull + upper). Squat 2× (legs + lower). Pour un intermédiaire en force, la fréquence 2× par groupe est correcte mais nécessite des jours de repos bien placés.
- Overlap upper/lower avec push/pull/legs → legs et lower font quads+ischios×2 par semaine. Ischios : squat (legs) + DL (legs) + squat possible dans lower + DL dans lower → risque de sur-sollicitation si les jours sont consécutifs.
- Jours défaut 5j = lun/mar/mer/jeu/ven → 5 jours consécutifs sans repos = problématique pour la récupération en force (repos 3 min par série, ~70-80 min par séance réelles).
- **Verdict : ⚠️ Problème mineur** — structure solide mais jours consécutifs sans repos et sur-solicitation potentielle des groupes travaillés 2×/semaine sur des jours adjacents.

---

### P09 — 5j beginner → upper/lower+fullbody

**Paramètres :** `{ goal:'hypertrophy', daysPerWeek:5, sessionDuration:60, equipment:FULL, level:'beginner' }`

**Simulation :**

**Étape 1 :** focusMuscles = undefined → null

**Étape 2 — selectSplit**
- isMass = true (hypertrophy), beginner
- daysPerWeek = 5 → ligne 372 : `isMass && beginner` → `['upper-push', 'lower-quad', 'upper-pull', 'lower-hip', 'fullbody-quad']`
- Types publics : `['upper', 'lower', 'upper', 'lower', 'fullbody']`

Note : fullbody×5 n'arrive que pour `!isMass && beginner` + 5j (ligne 376).

**Étape 3 — Sessions**

adjustedSlotCount pour hypertrophy + 60min = base :
- upper-push (8) : 8 slots → 10 exos
- lower-quad (6) : 6 slots → 8 exos
- upper-pull (8) : 8 slots → 10 exos
- lower-hip (6) : 6 slots → 8 exos
- fullbody-quad (9) : 9 slots → 11 exos

**Nommage :**
- upper-push (count=1): 'Upper — Haut du corps A'
- lower-quad (count=1): 'Lower — Bas du corps A'
- upper-pull (count=2): 'Upper — Haut du corps B'
- lower-hip (count=2): 'Lower — Bas du corps B'
- fullbody-quad (count=1): 'Full Body' (totalOfType=1 → pas de suffixe)

**Programme final** (4×8-12 cmp, 3×10-15 iso)

Upper A (upper-push, 8 slots) : identique à P07 Upper A

Upper B (upper-pull, 8 slots) : identique à P07 Upper B

Lower A (lower-quad, 6 slots) : identique à P07 Lower A

Lower B (lower-hip, 6 slots) : identique à P07 Lower B

Full Body (fullbody-quad, 9 slots) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Quads/Glutes (squat) | cmp | 4×8-12 |
| 2 | Chest/chest_upper (bench) | cmp | 4×8-12 |
| 3 | Back (pulldown/row) | cmp | 4×8-12 |
| 4 | Shoulders/front (OHP) | cmp | 4×8-12 |
| 5 | Hamstrings (leg curl) | iso | 3×10-15 |
| 6 | Shoulders rear (face pull) | iso | 3×10-15 |
| 7 | Biceps | iso | 3×10-15 |
| 8 | Calves | iso | 3×10-15 |
| 9 | Triceps | iso | 3×10-15 |
| 10 | Core | — | 3×15 |

**Warnings générés :**
- UX-H : "Volume élevé pour débutant : 5 séances/semaine..." (ligne 869)

**Assertions : PASS/FAIL**
- Split public = ['upper','lower','upper','lower','fullbody'] : **PASS** (ligne 372)
- Types internes = upper-push/lower-quad/upper-pull/lower-hip/fullbody-quad : **PASS**
- fullbody×5 uniquement pour beginner+!isMass : **PASS** (ligne 376 : `!isMass && beginner`)
- Noms : 'Upper — Haut du corps A', 'Lower — Bas du corps A', 'Upper — Haut du corps B', 'Lower — Bas du corps B', 'Full Body' : **PASS**
- Exercices : upper=10, lower=8, upper=10, lower=8, fullbody=11 : **PASS**

**Coach :**
- 5j pour un débutant = volume très élevé, warning justifié. Risque de sur-entraînement et abandon.
- Chaque groupe musculaire travaillé 2-3× par semaine (upper A + upper B + fullbody pour le haut) → fréquence élevée pour un débutant.
- La structure est bien pensée (A/B pour upper et lower + fullbody en fin de semaine), mais la fréquence hebdomadaire dépasse ce qui est recommandé pour un débutant.
- **Verdict : ⚠️ Problème mineur** — programme cohérent mais volume trop élevé pour un débutant.

---

### P10 — 2j intermediate → toujours fullbody

**Paramètres :** `{ goal:'strength', daysPerWeek:2, sessionDuration:60, equipment:BB+DB, level:'intermediate' }`

**Simulation :**

**Étape 1 :** focusMuscles = undefined → null

**Étape 2 — selectSplit**
- daysPerWeek = 2 → ligne 350 : **toujours** `['fullbody-quad', 'fullbody-hip']` peu importe level/goal
- Types publics : `['fullbody', 'fullbody']`

**Étape 3 — Sessions**

adjustedSlotCount pour strength + 60min :
- fullbody-quad (9) : max(4, floor(9×0.5)) = max(4,4) = **4 slots**
- fullbody-hip (9) : **4 slots**

Slots retenus fullbody-quad (4 premiers) :
| Pos | Muscles | Cat |
|-----|---------|-----|
| 1 | Quads / Glutes | cmp |
| 2 | Chest / chest_upper | cmp |
| 3 | Back width / thickness / back | cmp |
| 4 | Shoulders / front | cmp |

Slots retenus fullbody-hip (4 premiers) :
| Pos | Muscles | Cat |
|-----|---------|-----|
| 1 | Hamstrings / Glutes | cmp |
| 2 | Chest / chest_upper | cmp |
| 3 | Back width / back | cmp |
| 4 | Shoulders / front | cmp |

**Étape 4 — Séries × reps** (strength, 60min)
- Compound : 5×3-5 / 180s

Priorité barbell en strength compound (ligne 564-567) :
`strengthEquipmentPrio(barbell)=0 < strengthEquipmentPrio(dumbbell)=2` → barbell trié avant dumbbell.
Avec BB+DB, les exercices barbell seront candidats[0] pour les slots compound.

**Programme final**

Full Body A (fullbody-quad, 4 slots) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Quads/Glutes compound (barbell squat prioritaire) | cmp | 5×3-5 |
| 2 | Chest compound (barbell bench press prioritaire) | cmp | 5×3-5 |
| 3 | Back compound (barbell row prioritaire) | cmp | 5×3-5 |
| 4 | Shoulders compound (barbell OHP prioritaire) | cmp | 5×3-5 |
| 5 | Core | — | 3×15 |

Full Body B (fullbody-hip, 4 slots) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Hamstrings/Glutes compound (barbell DL/RDL) | cmp | 5×3-5 |
| 2 | Chest compound (barbell bench) | cmp | 5×3-5 |
| 3 | Back compound (barbell row) | cmp | 5×3-5 |
| 4 | Shoulders compound (barbell OHP) | cmp | 5×3-5 |
| 5 | Core | — | 3×15 |

**Nommage :** totalOfType('fullbody')=2 → 'Full Body A', 'Full Body B'

**Assertions : PASS/FAIL**
- Split = ['fullbody','fullbody'] : **PASS** (ligne 350)
- 2j = fullbody toujours (peu importe niveau/objectif) : **PASS**
- Priorité barbell sur dumbbell pour les compound (scoreEquip strength) : **PASS** (ligne 564-567)

**Coach :**
- Programme "Big 4" (squat, bench, row, OHP) en fullbody 2j = programme force classique très solide pour un intermédiaire.
- 4 composés × 5 séries à 180s = 20 séries × ~3.5 min = 70 min de travail. Serré en 60 min.
- Pas d'isolation → programme très minimaliste, acceptable pour un intermédiaire en force pure.
- usedGlobally garantit que bench A ≠ bench B si plusieurs exercices disponibles dans le seed.
- **Verdict : ✅ Bon programme** — programme force 2j très cohérent.

---

## GROUPE B — focusMuscles (override du split)

---

### P11 — chest seul → push

**Paramètres :** `{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:DB, level:'beginner', focusMuscles:['chest'] }`

**Simulation :**

**Étape 1 — workoutTypeFromFocus(['chest'])**
- hasLower = false ('legs' not in ['chest'])
- hasPush = true (includes 'chest') → ligne 296
- hasPull = false
- hasArms = false
- hasCore = false
- hasUpper = hasPush || hasPull || hasArms = true
- Règles :
  - hasLower && !hasUpper → false
  - hasCore && !hasLower && !hasUpper → false
  - **hasPush && !hasPull && !hasLower → true** → return **'push'** (ligne 309)

**Étape 2 — selectSplit**
- focusType = 'push' → pas 'lower', pas 'upper'
- Ligne 344 : `Array.from({length:2}, () => 'push')` = `['push','push']`

**Étape 3 — Sessions**

adjustedSlotCount pour hypertrophy + 60min = base :
- push (6) : **6 slots**

focusedMuscles pour ['chest'] = {chest, chest_upper, chest_lower} (FOCUS_TO_MUSCLES ligne 21)

reorderSlotsByFocus sur push (6 slots) :
```
Composés originaux : [slot1={chest/upper/lower,cmp}, slot2={shoulders/front,cmp}]
Isolations originales : [slot3={chest/upper/lower,iso}, slot4={triceps,iso}, slot5={shoulders_lat/shoulders,iso}, slot6={shoulders_rear,iso}]

byFocus sur composés : slot1 (muscles contient 'chest' → focused=0), slot2 (pas chest → focused=1)
→ [slot1, slot2] (déjà dans l'ordre)

byFocus sur isolations : slot3 (chest → focused=0), slot4 (triceps → 1), slot5 (shoulders → 1), slot6 (shoulders_rear → 1)
→ [slot3, slot4, slot5, slot6] (déjà dans l'ordre)

Résultat : [slot1, slot2, slot3, slot4, slot5, slot6] = ordre inchangé (chest déjà en tête)
```

**Programme final** (hypertrophy, 60min, DB)

Push — Poussée A (6 slots) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Chest compound (focused, DB bench prioritaire) | cmp | 4×8-12 |
| 2 | Shoulders compound (OHP DB) | cmp | 4×8-12 |
| 3 | Chest isolation (focused, DB fly) | iso | 3×10-15 |
| 4 | Triceps isolation | iso | 3×10-15 |
| 5 | Shoulders lateral isolation | iso | 3×10-15 |
| 6 | Shoulders rear isolation | iso | 3×10-15 |
| 7 | Core | — | 3×15 |

Push — Poussée B : même structure, usedGlobally différent → rotation d'exercices.

**Nommage :** totalOfType('push')=2 → 'Push — Poussée A', 'Push — Poussée B'

**Warnings générés :**
- UX-D : "Programme de spécialisation : toutes les séances ciblent le même groupe..." (ligne 880)
- UX-5 : hasPushSession=true, hasPullSession=false → "Déséquilibre push/pull : aucune séance de tirage..."

**Assertions : PASS/FAIL**
- workoutTypeFromFocus(['chest']) → 'push' : **PASS** (ligne 309)
- hasPush=true, hasPull=false, hasLower=false : **PASS**
- Split = ['push','push'] : **PASS**
- Exercices chest en tête (reorderSlotsByFocus) : **PASS** (slot 1 = chest cmp, slot 3 = chest iso)

**Coach :**
- Haltères seuls pour push : DB bench, DB fly, DB OHP, DB lateral raise = couverture correcte avec haltères.
- Chest en tête : ✓ (objectif prioritaire)
- Déséquilibre push/pull : warning justifié. Sur un bloc de spécialisation court (4-6 sem), acceptable.
- Biceps absent du programme → aucune séance de tirage du tout.
- **Verdict : ⚠️ Problème mineur** — programme de spécialisation cohérent mais déséquilibre posture à long terme.

---

### P12 — back seul → pull

**Paramètres :** `{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:BB+DB+CABLE, level:'beginner', focusMuscles:['back'] }`

**Simulation :**

**Étape 1 — workoutTypeFromFocus(['back'])**
- hasPull = true ('back' inclus)
- hasPush = false, hasLower = false, hasArms = false
- hasUpper = hasPull = true
- Règles : hasPull && !hasPush && !hasLower → **return 'pull'** (ligne 311)

**Étape 2 — selectSplit**
- focusType = 'pull' → pas 'lower', pas 'upper' → `Array.from({length:3}, () => 'pull')` = `['pull','pull','pull']`

**Étape 3 — Sessions**

adjustedSlotCount pour hypertrophy + 60min = base :
- pull (6) : **6 slots**

focusedMuscles pour ['back'] = {back, back_width, back_thickness}

reorderSlotsByFocus sur pull :
```
Composés : slot1={back_width/back,cmp}(focused=0), slot2={back_thickness/back,cmp}(focused=0) → [slot1,slot2]
Isolations : slot3={back_thickness/back_width/back,iso}(focused=0), slot4={biceps,iso}(1), slot5={shoulders_rear,iso}(1), slot6={forearms,iso}(1)
→ [slot3, slot4, slot5, slot6]
Résultat : [slot1, slot2, slot3, slot4, slot5, slot6] = ordre inchangé
```

**Programme final** (hypertrophy, 60min, BB+DB+CABLE)

Pull — Tirage A/B/C (6 slots) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Back width compound (focused, ex : cable lat pulldown) | cmp | 4×8-12 |
| 2 | Back thickness compound (focused, ex : BB row) | cmp | 4×8-12 |
| 3 | Back isolation (focused, ex : cable pullover) | iso | 3×10-15 |
| 4 | Biceps isolation (ex : BB curl) | iso | 3×10-15 |
| 5 | Shoulders rear isolation (ex : cable face pull) | iso | 3×10-15 |
| 6 | Forearms isolation | iso | 3×10-15 |
| 7 | Core | — | 3×15 |

**Nommage :** totalOfType('pull')=3 → 'Pull — Tirage A', 'Pull — Tirage B', 'Pull — Tirage C'

**Warnings générés :**
- UX-D : "Programme de spécialisation"
- Pas UX-5 (aucun push session dans le split → la condition est hasPushSession && !hasPullSession, pas l'inverse)

**Assertions : PASS/FAIL**
- workoutTypeFromFocus(['back']) → 'pull' : **PASS** (ligne 311)
- hasPull=true : **PASS**
- Split = ['pull','pull','pull'] : **PASS**

**Coach :**
- 3 séances pull par semaine : programme de spécialisation dos intense. Biceps travaillé indirectement (slot 4).
- BB+DB+CABLE = pool excellent pour le dos (BB row, cable lat pulldown, DB row, facepull câble).
- Pas de squat, pas de pec, pas d'OHP → programme très orienté. Acceptable pour un bloc dos.
- usedGlobally assure variation A/B/C : BB row A, DB row B, cable row C par exemple.
- **Verdict : ⚠️ Problème mineur** — spécialisation cohérente, déséquilibre attendu et documenté.

---

### P13 — legs seul → lower

**Paramètres :** `{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:BW, level:'beginner', focusMuscles:['legs'] }`

**Simulation :**

**Étape 1 — workoutTypeFromFocus(['legs'])**
- hasLower = true, hasPush = false, hasPull = false, hasUpper = false
- **hasLower && !hasUpper → return 'lower'** (ligne 303)

**Étape 2 — selectSplit**
- focusType = 'lower' → ligne 334-337 : `Array.from({length:4}, (_, i) => i%2===0 ? 'lower-quad' : 'lower-hip')`
- = `['lower-quad', 'lower-hip', 'lower-quad', 'lower-hip']`
- Types publics : `['lower', 'lower', 'lower', 'lower']`

**Étape 3 — Sessions**

adjustedSlotCount pour hypertrophy + 60min = base :
- lower-quad (6) : **6 slots**
- lower-hip (6) : **6 slots**

focusedMuscles pour ['legs'] = {quads, hamstrings, glutes, calves}

reorderSlotsByFocus sur lower-quad :
- Tous les slots de lower-quad ciblent des muscles de legs → tout focused=0 → ordre inchangé

reorderSlotsByFocus sur lower-hip : même chose.

**Nommage :** totalOfType('lower')=4 → suffixes A/B/C/D
- lower-quad (count=1): 'Lower — Bas du corps A'
- lower-hip (count=2): 'Lower — Bas du corps B'
- lower-quad (count=3): 'Lower — Bas du corps C'
- lower-hip (count=4): 'Lower — Bas du corps D'

**Programme final** (hypertrophy, 60min, BW)

Lower A / C (lower-quad, 6 slots) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Quads/Glutes compound (bw-squat) | cmp | 4×8-12 |
| 2 | Hamstrings/Glutes compound (si BW candidat — ex : good morning BW) | cmp | 4×8-12 |
| 3 | Quads isolation | iso | 3×10-15 |
| 4 | Hamstrings isolation | iso | 3×10-15 |
| 5 | Glutes isolation | iso | 3×10-15 |
| 6 | Calves isolation | iso | 3×10-15 |
| 7 | Core | — | 3×15 |

Note : slot 2 (hamstrings/glutes compound) en BW pur : bw-nordic-curl est maintenant pullup_bar → possible absence de candidat → slot vide + warning.

Lower B / D (lower-hip, 6 slots) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Glutes/Hamstrings compound (hip thrust BW ou si disponible) | cmp | 4×8-12 |
| 2 | Quads/Glutes compound (bw lunge) | cmp | 4×8-12 |
| 3 | Glutes isolation | iso | 3×10-15 |
| 4 | Hamstrings isolation | iso | 3×10-15 |
| 5 | Quads isolation | iso | 3×10-15 |
| 6 | Calves isolation | iso | 3×10-15 |
| 7 | Core | — | 3×15 |

**Warnings générés :**
- UX-D : "Programme de spécialisation : toutes les séances ciblent le même groupe" (lower)
- Possible warning slot vide pour hamstrings compound en BW (nordic curl → pullup_bar)

**Assertions : PASS/FAIL**
- workoutTypeFromFocus(['legs']) → 'lower' : **PASS** (ligne 303)
- Split public = ['lower','lower','lower','lower'] : **PASS**
- Types internes alternés lower-quad/lower-hip : **PASS** (ligne 334-337)
- Noms A/B/C/D : **PASS**
- lower-quad : quads/glutes compound en tête (squat) : **PASS**
- lower-hip : glutes/hamstrings compound en tête (hip thrust) : **PASS**
- 4 sessions de structure différenciée : **PASS** (quad-dominant vs hip-dominant)

**Coach :**
- BW-only + lower 4j : pool limité en BW. Squat BW, lunge BW, step-up BW = bons exercices quads. Hip thrust BW = moins intense. Slot hamstrings compound peut être vide (nordic curl → pullup_bar).
- 4 séances jambes/semaine pour un débutant = volume excessif si on ajoute le DOMS.
- Variété structurelle A/B/C/D : A=C (lower-quad) et B=D (lower-hip) → seulement 2 structures différentes, pas 4. La variation vient de usedGlobally pour les exercices.
- **Verdict : ⚠️ Problème mineur** — programme spécialisation cohérent mais BW-only limite les exercices composés jambes et 4j/semaine = volume élevé pour débutant.

---

### P14 — [RÉGRESSION BUG #3] core seul → fullbody

**Paramètres :** `{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:BW, level:'beginner', focusMuscles:['core'] }`

**Simulation :**

**Étape 1 — workoutTypeFromFocus(['core'])**
- hasLower = false, hasPush = false, hasPull = false, hasArms = false
- hasCore = true, hasUpper = false
- Règles :
  - hasLower && !hasUpper → false
  - **hasCore && !hasLower && !hasUpper → true → return null** (ligne 307)

**Étape 2 — selectSplit**
- focusType = null → branche défaut
- daysPerWeek = 2 → `['fullbody-quad', 'fullbody-hip']`
- Types publics : `['fullbody', 'fullbody']`

**Étape 3 — Sessions**

adjustedSlotCount pour hypertrophy + 60min = base :
- fullbody-quad (9) : **9 slots**
- fullbody-hip (9) : **9 slots**

focusedMuscles pour ['core'] = {core} — mais les slots fullbody ne contiennent pas 'core' comme muscles de slot (core est dans corePool séparé). reorderSlotsByFocus : focused={core}, aucun slot fullbody ne contient 'core' dans ses muscles → tous à focused=1 → ordre inchangé.

Programme : identique à P01 (fullbody hypertrophy 2j BW) sauf que l'équipement est BW uniquement.

**Warnings générés :**
- UX-6 core : "Focus gainage : 'core' seul ne définit pas de type de séance..." (ligne 924, unshifted)

**Assertions : PASS/FAIL**
- workoutTypeFromFocus(['core']) = null : **PASS** (ligne 307)
- Split = ['fullbody','fullbody'] — JAMAIS ['lower','lower'] : **PASS**
- Core apparaît en queue via corePool : **PASS**

**Coach :**
- L'utilisateur qui coche "core" reçoit un fullbody équilibré avec 1 exercice core en fin → contre-intuitif mais pédagogiquement justifié (core seul n'est pas un programme complet).
- Warning UX-6 : bien expliqué dans le code.
- BW équipement : mêmes limitations que P05/P06 pour le dos (back_width vide).
- **Verdict : ✅ Bon programme** — comportement correct et documenté pour le cas 'core seul'.

---

### P15 — [RÉGRESSION BUG #3 / 4j] core seul → split défaut upper/lower

**Paramètres :** `{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'beginner', focusMuscles:['core'] }`

**Simulation :**

**Étape 1 — workoutTypeFromFocus(['core'])**
- hasCore=true, !hasLower, !hasUpper → **return null** (ligne 307)

**Étape 2 — selectSplit**
- focusType = null → branche défaut
- isMass = true (hypertrophy), beginner, daysPerWeek = 4
- → ligne 362 : `isMass` → `['upper-push', 'lower-quad', 'upper-pull', 'lower-hip']`
- Types publics : `['upper', 'lower', 'upper', 'lower']`

**Étape 3 — Sessions** : identique à P07 (hypertrophy, 4j, beginner, FULL)

**Warnings générés :**
- UX-6 core : "Focus gainage : 'core' seul..."

**Assertions : PASS/FAIL**
- workoutTypeFromFocus(['core']) = null : **PASS** (ligne 307)
- Split = ['upper','lower','upper','lower'] — JAMAIS ['lower','lower','lower','lower'] : **PASS**

**Coach :**
- L'utilisateur "core" en 4j beginner reçoit un upper/lower complet → programme correct et bien adapté.
- Le warning explique pourquoi.
- **Verdict : ✅ Bon programme**

---

### P16 — shoulders seul → push

**Paramètres :** `{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:DB, level:'beginner', focusMuscles:['shoulders'] }`

**Simulation :**

**Étape 1 — workoutTypeFromFocus(['shoulders'])**
- hasPush = true (includes 'shoulders') → ligne 296
- hasPull = false, hasLower = false
- **hasPush && !hasPull && !hasLower → return 'push'** (ligne 309)

**Étape 2 — selectSplit**
- focusType = 'push' → `['push', 'push']`

**Étape 3 — Sessions**

adjustedSlotCount pour hypertrophy + 60min = base :
- push (6) : **6 slots**

focusedMuscles pour ['shoulders'] = {shoulders, shoulders_front, shoulders_lateral, shoulders_rear}

reorderSlotsByFocus sur push (6 slots) :
```
Composés :
  slot1={chest/upper/lower,cmp} : muscles contient 'chest' → not focused (1)
  slot2={shoulders/shoulders_front,cmp} : muscles contient 'shoulders' → focused (0)
→ sorted : [slot2, slot1]

Isolations :
  slot3={chest/upper/lower,iso} : not focused (1)
  slot4={triceps,iso} : not focused (1)
  slot5={shoulders_lateral/shoulders,iso} : focused (0)
  slot6={shoulders_rear,iso} : focused (0)
→ sorted stable : [slot5, slot6, slot3, slot4]

Résultat final : [slot2, slot1, slot5, slot6, slot3, slot4]
```

**Programme final** (hypertrophy, 60min, DB)

Push — Poussée A/B (6 slots) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Shoulders/front compound (OHP DB — focused) | cmp | 4×8-12 |
| 2 | Chest compound (DB bench) | cmp | 4×8-12 |
| 3 | Shoulders lateral isolation (focused) | iso | 3×10-15 |
| 4 | Shoulders rear isolation (focused) | iso | 3×10-15 |
| 5 | Chest isolation (DB fly) | iso | 3×10-15 |
| 6 | Triceps isolation | iso | 3×10-15 |
| 7 | Core | — | 3×15 |

**Warnings générés :**
- UX-D : spécialisation
- UX-5 : déséquilibre push/pull
- UX-B : split.every('push') && focusMuscles.includes('shoulders') → "Focus bras en push : le biceps n'est pas ciblé en séance push" (ligne 889)

**Assertions : PASS/FAIL**
- hasPush=true (shoulders ∈ push) : **PASS** (ligne 296)
- workoutTypeFromFocus → 'push' : **PASS**
- Split = ['push','push'] : **PASS**
- OHP (shoulders compound) bien en tête après reorder : **PASS**

**Coach :**
- Épaules en priorité : OHP en slot 1, écarté latéral et face pull avant pec isolation ✓
- DB-only : OHP DB, écarté latéral, écarté incliné = couverture correcte
- Chest présent comme "complément" (slot 2)
- Warning UX-B justifié : pas de biceps en push
- **Verdict : ⚠️ Problème mineur** — spécialisation épaules cohérente, déséquilibre attendu.

---

### P17 — chest+back → upper

**Paramètres :** `{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner', focusMuscles:['chest','back'] }`

**Simulation :**

**Étape 1 — workoutTypeFromFocus(['chest','back'])**
- hasPush = true (chest), hasPull = true (back), hasLower = false, hasArms = false
- hasUpper = hasPush || hasPull = true
- Règles :
  - hasLower && !hasUpper → false
  - hasPush && !hasPull && !hasLower → false (hasPull=true)
  - hasPull && !hasPush && !hasLower → false (hasPush=true)
  - **hasUpper && !hasLower → true → return 'upper'** (ligne 313)

**Étape 2 — selectSplit**
- focusType = 'upper' → ligne 339-343 : `Array.from({length:3}, (_, i) => i%2===0 ? 'upper-push' : 'upper-pull')`
- = `['upper-push', 'upper-pull', 'upper-push']`
- Types publics : `['upper', 'upper', 'upper']`

**Étape 3 — Sessions**

adjustedSlotCount pour hypertrophy + 60min = base :
- upper-push (8) : **8 slots**
- upper-pull (8) : **8 slots**

focusedMuscles = {chest, chest_upper, chest_lower, back, back_width, back_thickness}

reorderSlotsByFocus sur upper-push (8 slots) :

```
Composés originaux (3) :
  slot1={chest/chest_upper,cmp} → focused (chest) = 0
  slot2={back_width/back_thickness/back,cmp} → focused (back) = 0
  slot3={shoulders/front,cmp} → not focused = 1
→ sorted stable : [slot1, slot2, slot3]

Isolations originales (5) :
  slot4={chest/chest_lower/chest_upper,iso} → focused (chest) = 0
  slot5={triceps,iso} → not focused = 1
  slot6={shoulders_lateral,iso} → not focused = 1
  slot7={biceps,iso} → not focused = 1
  slot8={back_thickness/back,iso} → focused (back) = 0
→ sorted stable : [slot4, slot8, slot5, slot6, slot7]

Résultat : [slot1, slot2, slot3, slot4, slot8, slot5, slot6, slot7]
```

reorderSlotsByFocus sur upper-pull (8 slots) :
```
Composés originaux (3) :
  slot1={back_width/back,cmp} → focused = 0
  slot2={back_thickness/back,cmp} → focused = 0
  slot3={chest/chest_upper,cmp} → focused (chest) = 0
→ tous focused : [slot1, slot2, slot3] (ordre préservé)

Isolations originales (5) :
  slot4={shoulders_rear,iso} → not focused = 1
  slot5={biceps,iso} → not focused = 1
  slot6={back_thickness/back,iso} → focused (back) = 0
  slot7={triceps,iso} → not focused = 1
  slot8={shoulders_lateral,iso} → not focused = 1
→ sorted stable : [slot6, slot4, slot5, slot7, slot8]

Résultat : [slot1, slot2, slot3, slot6, slot4, slot5, slot7, slot8]
```

**Nommage :** totalOfType('upper')=3 → 'Upper — Haut du corps A', 'Upper — Haut du corps B', 'Upper — Haut du corps C'

**Programme final** (hypertrophy, 60min, FULL)

Upper — Haut du corps A (upper-push, 8 slots, focus chest+back) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Chest compound (focused, bench) | cmp | 4×8-12 |
| 2 | Back compound (focused, row) | cmp | 4×8-12 |
| 3 | Shoulders compound (OHP) | cmp | 4×8-12 |
| 4 | Chest isolation (focused, fly) | iso | 3×10-15 |
| 5 | Back isolation (focused) | iso | 3×10-15 |
| 6 | Triceps isolation | iso | 3×10-15 |
| 7 | Shoulders lateral isolation | iso | 3×10-15 |
| 8 | Biceps isolation | iso | 3×10-15 |
| 9 | Core | — | 3×15 |

Upper — Haut du corps B (upper-pull, 8 slots, focus chest+back) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Back width compound (focused, pulldown) | cmp | 4×8-12 |
| 2 | Back thickness compound (focused, row) | cmp | 4×8-12 |
| 3 | Chest compound (focused, incline bench) | cmp | 4×8-12 |
| 4 | Back isolation (focused) | iso | 3×10-15 |
| 5 | Shoulders rear isolation | iso | 3×10-15 |
| 6 | Biceps isolation | iso | 3×10-15 |
| 7 | Triceps isolation | iso | 3×10-15 |
| 8 | Shoulders lateral isolation | iso | 3×10-15 |
| 9 | Core | — | 3×15 |

Upper C = même structure que A (upper-push), usedGlobally différent.

**Assertions : PASS/FAIL**
- workoutTypeFromFocus(['chest','back']) → 'upper' : **PASS** (ligne 313)
- hasPush=true, hasPull=true, hasLower=false : **PASS**
- Split = ['upper','upper','upper'] : **PASS**
- Chest et back bien en tête après reorder : **PASS** (slots 1,2 = chest+back en A ; slots 1,2,3 = back+chest en B)
- Ratio push/pull sur la séance : **PASS** (A : 2 dos cmp équilibré par 1 chest cmp + isolation chest+back ; B : dos dominant × 2 cmp)

**Coach :**
- A/B bien différenciés : A=bench-first (push), B=traction-first (pull) ✓
- Chest et back tous deux présents dans chaque séance ✓
- 3 séances upper × 2 = A/C sont identiques en structure → variation uniquement sur les exercices via usedGlobally. C idéalement aurait un pool différent de A.
- **Verdict : ✅ Bon programme** — focus chest+back bien respecté, variété A/B structurelle.

---

### P18 — legs+core → lower (core ne neutralise pas legs)

**Paramètres :** `{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:BW, level:'beginner', focusMuscles:['legs','core'] }`

**Simulation :**

**Étape 1 — workoutTypeFromFocus(['legs','core'])**
- hasLower = true ('legs' inclus)
- hasPush = false, hasPull = false
- hasArms = false, hasCore = true
- hasUpper = false
- Règles : **hasLower && !hasUpper → true → return 'lower'** (ligne 303)
- Note : hasCore=true mais la condition core-seul (ligne 307) n'est pas atteinte car hasLower=true → évaluation s'arrête à la 1ère règle

**Étape 2 — selectSplit**
- focusType = 'lower' → ligne 334-337 : alternance lower-quad/lower-hip
- daysPerWeek=3 → `['lower-quad', 'lower-hip', 'lower-quad']`
- Types publics : `['lower', 'lower', 'lower']`

**Étape 3 — Sessions** : similaire à P13 mais 3j au lieu de 4j.

adjustedSlotCount pour hypertrophy + 60min = base :
- lower-quad (6) : **6 slots**
- lower-hip (6) : **6 slots**

**Nommage :** totalOfType('lower')=3 → 'Lower — Bas du corps A', 'Lower — Bas du corps B', 'Lower — Bas du corps C'

**Programme final** (hypertrophy, 60min, BW)

Lower A/C (lower-quad, 6 slots) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Quads/Glutes compound (squat BW) | cmp | 4×8-12 |
| 2 | Hamstrings/Glutes compound (possible slot vide BW) | cmp | 4×8-12 ou vide |
| 3 | Quads isolation | iso | 3×10-15 |
| 4 | Hamstrings isolation | iso | 3×10-15 |
| 5 | Glutes isolation | iso | 3×10-15 |
| 6 | Calves isolation | iso | 3×10-15 |
| 7 | Core | — | 3×15 |

Lower B (lower-hip, 6 slots) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Glutes/Hamstrings compound (hip thrust BW) | cmp | 4×8-12 |
| 2 | Quads/Glutes compound (lunge BW) | cmp | 4×8-12 |
| 3 | Glutes isolation | iso | 3×10-15 |
| 4 | Hamstrings isolation | iso | 3×10-15 |
| 5 | Quads isolation | iso | 3×10-15 |
| 6 | Calves isolation | iso | 3×10-15 |
| 7 | Core | — | 3×15 |

**Warnings générés :**
- UX-D : spécialisation lower
- Possible slot vide pour hamstrings compound en BW (nordic curl → pullup_bar)

**Assertions : PASS/FAIL**
- hasLower=true, hasUpper=false → 'lower' : **PASS** (ligne 303, core n'interfère pas)
- Split = ['lower','lower','lower'] : **PASS**
- JAMAIS ['fullbody'] suite au core : **PASS**

**Coach :**
- Même observation que P13 pour BW-only (limitation hamstrings compound).
- Core apparaît en queue via corePool ✓ — utile pour un utilisateur qui veut "jambes + gainage".
- 3j/sem pour les jambes + BW-only = acceptable en débutant.
- **Verdict : ✅ Bon programme** — comportement correct.

---

### P19 — chest+back+legs → null → split défaut

**Paramètres :** `{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:FULL, level:'beginner', focusMuscles:['chest','back','legs'] }`

**Simulation :**

**Étape 1 — workoutTypeFromFocus(['chest','back','legs'])**
- hasLower = true ('legs')
- hasPush = true ('chest')
- hasPull = true ('back')
- hasUpper = hasPush || hasPull = true
- Règles :
  - hasLower && !hasUpper → false (hasUpper=true)
  - hasCore && !hasLower && !hasUpper → false
  - hasPush && !hasPull && !hasLower → false (hasPull=true, hasLower=true)
  - hasPull && !hasPush && !hasLower → false (hasPush=true, hasLower=true)
  - hasUpper && !hasLower → false (hasLower=true)
  - hasLower && hasPush && !hasPull → false (hasPull=true)
  - hasLower && hasPull && !hasPush → false (hasPush=true)
  - → **return null** (ligne 321)

**Étape 2 — selectSplit**
- focusType = null → branche défaut, daysPerWeek=2 → `['fullbody-quad', 'fullbody-hip']`

**Étape 3 — Sessions** : identique à P01 (fullbody, hypertrophy, 60min)
- 9 slots par session

**Warnings générés :**
- UX-6 "Sélection complète" : hasFocusLower=true, hasFocusPush=true, hasFocusPull=true → "Sélection complète : votre focus couvre poitrine, dos et jambes..." (ligne 940)

**Assertions : PASS/FAIL**
- hasLower=true, hasUpper=true → ambiguïté → null : **PASS** (ligne 321)
- Split = ['fullbody','fullbody'] : **PASS**

**Coach :**
- Résultat identique à P01 — fullbody équilibré. Le focus chest+back+legs n'a aucun effet sur le split (ambiguïté totale) mais le warning UX-6 explique le comportement.
- Cohérent avec l'objectif : l'utilisateur veut "tout" → fullbody ✓.
- **Verdict : ✅ Bon programme**

---

### P20 — shoulders+arms → push

**Paramètres :** `{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:DB, level:'beginner', focusMuscles:['shoulders','arms'] }`

**Simulation :**

**Étape 1 — workoutTypeFromFocus(['shoulders','arms'])**
- hasPush = true (includes 'shoulders') → ligne 296
- hasPull = false ('back' not included)
- hasArms = true ('arms' included) → ligne 298
- hasLower = false
- hasUpper = hasPush || hasPull || hasArms = true
- Règles :
  - hasLower && !hasUpper → false
  - hasCore && !hasLower && !hasUpper → false
  - **hasPush && !hasPull && !hasLower → true → return 'push'** (ligne 309)
  - (la règle 5 `hasUpper && !hasLower` n'est pas atteinte car règle 3 est vraie en premier)

NB : arms seul → hasArms=true, hasUpper=true, hasPush=false → tomberait en règle 5 → 'upper'. Mais ici hasPush=true (shoulders) → règle 3 prend le dessus.

**Étape 2 — selectSplit**
- focusType = 'push' → `['push', 'push']`

**Étape 3 — Sessions**

adjustedSlotCount pour hypertrophy + 60min = base :
- push (6) : **6 slots**

focusedMuscles pour ['shoulders','arms'] = {shoulders, shoulders_front, shoulders_lateral, shoulders_rear, biceps, triceps, forearms}

reorderSlotsByFocus sur push (6 slots) :
```
Composés :
  slot1={chest/upper/lower,cmp} : chest not in focused → 1
  slot2={shoulders/shoulders_front,cmp} : shoulders in focused → 0
→ sorted : [slot2, slot1]

Isolations :
  slot3={chest/upper/lower,iso} : not focused → 1
  slot4={triceps,iso} : triceps in focused (arms) → 0
  slot5={shoulders_lateral/shoulders,iso} : focused → 0
  slot6={shoulders_rear,iso} : focused → 0
→ sorted stable : [slot4, slot5, slot6, slot3]

Résultat : [slot2, slot1, slot4, slot5, slot6, slot3]
```

**Programme final** (hypertrophy, 60min, DB)

Push — Poussée A (6 slots) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | Shoulders/front compound (OHP DB — focused) | cmp | 4×8-12 |
| 2 | Chest compound (DB bench) | cmp | 4×8-12 |
| 3 | Triceps isolation (focused — arms) | iso | 3×10-15 |
| 4 | Shoulders lateral isolation (focused) | iso | 3×10-15 |
| 5 | Shoulders rear isolation (focused) | iso | 3×10-15 |
| 6 | Chest isolation (DB fly) | iso | 3×10-15 |
| 7 | Core | — | 3×15 |

Push — Poussée B : même structure, rotation exercices via usedGlobally.

**Nommage :** totalOfType('push')=2 → 'Push — Poussée A', 'Push — Poussée B'

**Warnings générés :**
- UX-D : spécialisation push
- UX-5 : hasPushSession=true, hasPullSession=false → déséquilibre push/pull
- UX-B : split.every('push') && focusMuscles.some('shoulders') → "Focus bras en push : le biceps n'est pas ciblé" (ligne 889)

**Assertions : PASS/FAIL**
- workoutTypeFromFocus(['shoulders','arms']) → 'push' : **PASS** (hasPush=true, ligne 309)
- Split = ['push','push'] : **PASS**
- hasPush=true (shoulders), hasPull=false, hasLower=false : **PASS**
- arms seul → upper (hasArms seul → rule 5), shoulders+arms → push (hasPush → rule 3 prioritaire) : **PASS** (ligne 309 avant 313)

**Coach :**
- OHP en tête + triceps et épaules latérales/arrière en isolation ✓ — focus épaules+bras bien respecté.
- Biceps absent (warning UX-B correct) — push ne contient aucun slot biceps.
- DB-only : OHP DB, écarté latéral DB, triceps DB = couverture correcte.
- Déséquilibre push/pull : warning justifié.
- **Verdict : ⚠️ Problème mineur** — spécialisation cohérente, biceps absent structurellement du split push (documenté dans le warning).

---

## Récapitulatif — Tableau de synthèse P01–P20

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|--------|---------------------|---------|-------------------|
| P01 | Split fullbody×2, 11 exos, warmup/core OK | ✅ PASS | Programme 2j serré en 60 min (~73 min estimés) ; lacunes isolation mineures |
| P02 | Split fullbody×3 PASS ; 11 exos **FAIL** (réel : 6) | ⚠️ PASS partiel | Assertion stale (ancienne formule ×0.75) ; 5×3-5 débutant = risque technique ; timing 70-80 min réels |
| P03 | Split PPL PASS ; chest+shoulders+dos+quads couverts | ⚠️ PASS | Timing irréaliste (5×3-5 + 180s repos en 60 min déclarées) ; pas de calves ni face pull (coupés) |
| P04 | Split PPL PASS ; reps zone hypertrophie PASS | ✅ PASS | Volume dos (11 séries) > volume pec (7 séries) sur la semaine ; acceptable |
| P05 | Split PPF PASS ; noms sans suffixe PASS | ❌ FAIL fonctionnel | Pull day sans dos en BW pur (back_width + back_thickness vides post-fix EQUIP-1/2) ; programme pull non viable |
| P06 | Split PPF PASS ; noms PASS | ❌ FAIL fonctionnel | Même problème que P05 ; pull day structurellement vide en BW |
| P07 | Split UL PASS ; 10+8+10+8 exos PASS ; calves PASS | ✅ PASS | Volume élevé pour débutant (10 exos upper) ; 60 min serrées pour upper |
| P08 | Split PPL+UL PASS ; 5 workouts PASS | ⚠️ PASS | Jours consécutifs (lun–ven) sans repos ; chest et dos sollicités 2×/semaine sur jours adjacents ; timing irréaliste force 60 min |
| P09 | Split UL+fullbody PASS ; exos 10+8+10+8+11 PASS | ⚠️ PASS | Warning volume débutant justifié ; 5j/sem débutant = fréquence excessive ; A=C same structure |
| P10 | Split fullbody×2 PASS ; barbell prioritaire PASS | ✅ PASS | 4 composés 5×3-5 en 60 min = ~70 min réels ; pas d'isolation |
| P11 | Focus chest→push PASS ; chest en tête PASS | ⚠️ PASS | Déséquilibre push/pull ; biceps absent ; bloc court (4-6 sem) recommandé |
| P12 | Focus back→pull PASS ; split pull×3 PASS | ⚠️ PASS | Spécialisation dos ; pas de pec ni jambes ; biceps indirectement couvert |
| P13 | Focus legs→lower PASS ; alternance quad/hip PASS ; A/B/C/D PASS | ⚠️ PASS | Nordic curl → pullup_bar → slot vide possible ; 4j jambes débutant = volume excessif ; A=C et B=D (2 structures, pas 4) |
| P14 | core→null PASS ; jamais lower PASS | ✅ PASS | BW pur = dos vide (même pb que P05 mais fullbody atténue) ; warning UX-6 bien émis |
| P15 | core→null PASS ; upper/lower 4j PASS | ✅ PASS | Comportement counter-intuitif mais documenté |
| P16 | shoulders→push PASS ; OHP en tête PASS | ⚠️ PASS | Déséquilibre push/pull ; biceps absent ; warning UX-B correct |
| P17 | chest+back→upper PASS ; A/B/C PASS ; reorder PASS | ✅ PASS | Séance C = même structure que A, seuls exercices varient via usedGlobally |
| P18 | legs+core→lower PASS ; core n'interfère pas PASS | ✅ PASS | BW-only : nordic curl possible absent ; 3j jambes acceptable |
| P19 | chest+back+legs→null PASS ; fullbody PASS | ✅ PASS | Focus ignoré car ambiguïté totale — warning UX-6 explique bien |
| P20 | shoulders+arms→push PASS ; OHP en tête PASS | ⚠️ PASS | Déséquilibre push/pull ; biceps absent structurellement du push (warning correct) |

---

## Synthèse des problèmes ouverts

### Bugs / anomalies logicielles (assertions FAIL)

**P02 — Assertion "11 exercices" FAIL :**
- Profil : P02 (strength + 60min + beginner + fullbody)
- Assertion : "11 exercices par workout (9 slots + warmup + core)"
- Réalité code : `adjustedSlotCount(9, 60, 'strength')` = `max(4, floor(9×0.5))` = **4 slots** → 4+2 = **6 exercices**
- Cause : l'assertion du prompt v3 est basée sur l'ancienne formule ×0.75. La formule a été changée en ×0.5 min 4 pour strength+60min (commentaire ligne 417 : "anciennement ×0.75, donnait 6 slots pour les templates 8-9 slots → ~80 min")
- Impact : l'assertion du prompt est obsolète, pas un bug du code. Le code est cohérent avec ses propres commentaires.
- Recommandation : mettre à jour l'assertion du prompt d'audit.

**P05 / P06 — Pull day vide en BW pur :**
- Profils : P05, P06 (et P14 dans une moindre mesure)
- Assertion : pas d'assertion explicite sur ce point dans le prompt, mais les slots vides sont documentés comme attendus
- Réalité : Post-commit 5941987, back_width et back_thickness compound sont tous deux sans candidats en BW pur (seed-pullup et bw-inverted-row → pullup_bar). La séance pull du split PPF (P05/P06) devient non fonctionnelle.
- Impact : Pull day avec 0 exercice de dos = programme déséquilibré. Les warnings BUG-5 sont émis mais le programme continue.
- Correction recommandée : si pull day + BW pur sans pullup_bar → warning fort "Impossible de générer un Pull — Tirage sans barre de traction. Ajoutez 'pullup_bar' ou changez de split."

### Réserves coach cumulées — Thèmes récurrents

**Thème 1 — Timing irréaliste en force (P02, P03, P08, P10) :**
- Les séances force (5×3-5, repos 180s) dépassent systématiquement 60 min déclarées.
- Exemple P02 : 4 composés × 5 séries × 180s repos = ~60 min de repos seul.
- Recommandation : réduire encore plus le slot count en strength+60min (ex : 3 slots max, non 4), ou afficher un disclaimer "Les programmes force nécessitent 75-90 min avec les repos indiqués."

**Thème 2 — BW pur non viable pour les splits avec pull (P05, P06, P13, P14) :**
- Post-fix EQUIP-1/2 : la séparation pullup_bar crée des programmes structurellement incomplets en BW pur.
- Recommandation : validation wizard = si equipment=BW et split inclut pull → warning bloquant. Ou proposer automatiquement BW+BAR.

**Thème 3 — Volume débutant trop élevé (P07, P09) :**
- Upper 10 exercices en 60 min pour un débutant est optimiste.
- Warning UX-H (ligne 869) émis pour P09 mais pas pour P07.
- Recommandation : émettre UX-H aussi pour 4j débutant ou limiter upper-push/pull à 6 slots pour level='beginner'.

**Thème 4 — Déséquilibre push/pull en spécialisation (P11, P12, P16, P20) :**
- Les warnings UX-D et UX-5 sont correctement émis.
- Recommandation : ajouter dans le wizard une durée maximale recommandée pour les programmes de spécialisation ("Ce programme est conseillé pour 4-6 semaines maximum").

**Thème 5 — A=C identiques en structure (P02, P09, P13, P17) :**
- Quand 3 séances du même type sont générées (ex : fullbody A/B/C en P02), A et C ont la même structure (même template interne : fullbody-quad). Seuls les exercices varient via usedGlobally.
- Acceptable à court terme mais peut sembler répétitif à un utilisateur.
- Recommandation : pour un 3e split du même type, envisager un 3e template ou une rotation explicite.

**Thème 6 — Isolation incomplète en strength+60min (P03, P08) :**
- Strength+60min → 4 slots → souvent 2 composés + 2 isolations seulement → calves, face pull, forearms systématiquement absents.
- Acceptable pour un programme force pure, mais lacune à documenter pour l'utilisateur.
