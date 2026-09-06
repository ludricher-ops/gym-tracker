# Audit `generateProgramDraft` — Groupe F (P51–P57)

> Coach sportif certifié — simulation pas à pas + évaluation.
> Fichiers lus : `src/utils/programGenerator.ts` (814 lignes) + `tests/audit_prompt_v3.md`.
> Exercices-seed non requis pour Groupe F — les slots sont décrits par leurs muscles cibles.

---

## P51 — endurance 5j advanced

```
{ goal:'endurance', daysPerWeek:5, sessionDuration:60, equipment:FULL, level:'advanced' }
```

### Étape 1 — workoutTypeFromFocus

`focusMuscles` absent → `[]` → ligne 293 : `if (focusMuscles.length === 0) return null`

```
focusType = null
```

### Étape 2 — selectSplit

`isMass = goal === 'strength' || goal === 'hypertrophy'` → **false** (endurance)

`case 5` :
- `isMass && level !== 'beginner'` → false
- `isMass` → false
- `level !== 'beginner'` → **true** (advanced) → **branche 3**

```
Split = ['push', 'pull', 'lower-quad', 'lower-hip', 'fullbody-quad']
Public = ['push', 'pull', 'lower', 'lower', 'fullbody']
```

Jours par défaut `DAY_ASSIGNMENTS[5]` = `['monday','tuesday','wednesday','thursday','friday']`

Noms : "Push — Poussée", "Pull — Tirage", "Lower — Bas du corps A", "Lower — Bas du corps B", "Full Body"
(lower apparaît 2× → suffixe A/B ; push, pull, fullbody 1× → pas de suffixe)

### Étape 3 — adjustedSlotCount

`adjustedSlotCount(base, 60, 'endurance')` → `isStrength=false`, `duration=60` → retourne `base` (ligne 428).

| Session | Type interne | Base slots | Slots retenus | + warmup + core | Total exos |
|---------|-------------|-----------|--------------|-----------------|------------|
| Lundi | push | 6 | 6 | +2 | 8 |
| Mardi | pull | 6 | 6 | +2 | 8 |
| Mercredi | lower-quad | 6 | 6 | +2 | 8 |
| Jeudi | lower-hip | 6 | 6 | +2 | 8 |
| Vendredi | fullbody-quad | 9 | 9 | +2 | 11 |

`focusedMuscles` vide → `reorderSlotsByFocus` retourne les slots dans l'ordre original (ligne 479).

**Slots push (6) :**
1. chest/chest_upper/chest_lower — compound
2. shoulders/shoulders_front — compound
3. chest/chest_upper/chest_lower — isolation *(⚠️ doublon chest-isol)*
4. triceps — isolation
5. shoulders_lateral/shoulders — isolation
6. triceps — isolation *(⚠️ 2e slot triceps)*

**Slots pull (6) :**
1. back_width/back — compound
2. back_thickness/back — compound
3. back_thickness/back_width/back — isolation
4. biceps — isolation
5. shoulders_rear — isolation
6. forearms — isolation

**Slots lower-quad (6) :**
1. quads/glutes — compound
2. hamstrings/glutes — compound
3. quads — isolation
4. glutes — isolation
5. hamstrings — isolation
6. calves — isolation

**Slots lower-hip (6) :**
1. glutes/hamstrings — compound
2. quads/glutes — compound
3. glutes — isolation
4. hamstrings — isolation
5. quads — isolation
6. calves — isolation

**Slots fullbody-quad (9) :**
1. quads/glutes — compound
2. chest/chest_upper — compound
3. back_width/back_thickness/back — compound
4. shoulders/shoulders_front — compound
5. hamstrings — isolation
6. shoulders_rear — isolation
7. biceps — isolation
8. triceps — isolation
9. calves — isolation

### Étape 5 — Sets × Reps

`goal='endurance'` + `duration=60` → pas d'ajustement (`adjustedSpec` retourne la spec brute).

- Compound : `COMPOUND_SPEC['endurance']` = 3 séries × 15–20 reps, repos 60 s
- Isolation : `ISOLATION_SPEC['endurance']` = 3 séries × 15–20 reps, repos 45 s
- Warmup : 2×10 (fixe)
- Core : 3×15 (fixe)

Tous les exercices de travail : **3×15-20**

### Étape 6 — Programme final

**Lundi — Push — Poussée**

| # | Slot (muscles) | Cat | Séries×Reps |
|---|---------------|-----|-------------|
| 0 | warmup | — | 2×10 |
| 1 | chest/chest_upper/chest_lower | cpd | 3×15-20 |
| 2 | shoulders/shoulders_front | cpd | 3×15-20 |
| 3 | chest/chest_upper/chest_lower | isol | 3×15-20 |
| 4 | triceps | isol | 3×15-20 |
| 5 | shoulders_lateral/shoulders | isol | 3×15-20 |
| 6 | triceps | isol | 3×15-20 |
| 7 | core | — | 3×15 |

**Mardi — Pull — Tirage**

| # | Slot (muscles) | Cat | Séries×Reps |
|---|---------------|-----|-------------|
| 0 | warmup | — | 2×10 |
| 1 | back_width/back | cpd | 3×15-20 |
| 2 | back_thickness/back | cpd | 3×15-20 |
| 3 | back_thickness/back_width/back | isol | 3×15-20 |
| 4 | biceps | isol | 3×15-20 |
| 5 | shoulders_rear | isol | 3×15-20 |
| 6 | forearms | isol | 3×15-20 |
| 7 | core | — | 3×15 |

**Mercredi — Lower — Bas du corps A (lower-quad)**

| # | Slot (muscles) | Cat | Séries×Reps |
|---|---------------|-----|-------------|
| 0 | warmup | — | 2×10 |
| 1 | quads/glutes | cpd | 3×15-20 |
| 2 | hamstrings/glutes | cpd | 3×15-20 |
| 3 | quads | isol | 3×15-20 |
| 4 | glutes | isol | 3×15-20 |
| 5 | hamstrings | isol | 3×15-20 |
| 6 | calves | isol | 3×15-20 |
| 7 | core | — | 3×15 |

**Jeudi — Lower — Bas du corps B (lower-hip)**

| # | Slot (muscles) | Cat | Séries×Reps |
|---|---------------|-----|-------------|
| 0 | warmup | — | 2×10 |
| 1 | glutes/hamstrings | cpd | 3×15-20 |
| 2 | quads/glutes | cpd | 3×15-20 |
| 3 | glutes | isol | 3×15-20 |
| 4 | hamstrings | isol | 3×15-20 |
| 5 | quads | isol | 3×15-20 |
| 6 | calves | isol | 3×15-20 |
| 7 | core | — | 3×15 |

**Vendredi — Full Body (fullbody-quad)**

| # | Slot (muscles) | Cat | Séries×Reps |
|---|---------------|-----|-------------|
| 0 | warmup | — | 2×10 |
| 1 | quads/glutes | cpd | 3×15-20 |
| 2 | chest/chest_upper | cpd | 3×15-20 |
| 3 | back_width/back_thickness/back | cpd | 3×15-20 |
| 4 | shoulders/shoulders_front | cpd | 3×15-20 |
| 5 | hamstrings | isol | 3×15-20 |
| 6 | shoulders_rear | isol | 3×15-20 |
| 7 | biceps | isol | 3×15-20 |
| 8 | triceps | isol | 3×15-20 |
| 9 | calves | isol | 3×15-20 |
| 10 | core | — | 3×15 |

### Assertions

- `isMass=false` + advanced + 5j → branche `!isMass && level!=='beginner'` (ligne 374) : **PASS**
- Split = `['push','pull','lower-quad','lower-hip','fullbody-quad']` : **PASS**
- Niveau `advanced` ne produit pas de crash ni de split inattendu : **PASS**
- Reps 15-20 cohérentes avec `endurance` : **PASS**

### Coach

**Équilibre musculaire / récupération :**
- Chest : Push (lun) + Fullbody (ven) — 3 jours de repos ✓
- Back : Pull (mar) + Fullbody (ven) — 2 jours de repos ✓ (limite)
- Shoulders : Push (lun) + Fullbody (ven) — 3 jours ✓
- **Quadriceps/ischios : Lower-quad (mer) + Lower-hip (jeu) + Fullbody (ven) — 3 sessions jambes consécutives** ⚠️

**Doublon triceps dans la séance Push :** les slots 4 et 6 ciblent tous deux les triceps. `usedInWorkout` évite le même exercice mais il faut 2 exercices triceps différents dans le pool. À 3×15-20 × 2 slots, c'est 6 séries triceps/session — sur-représenté pour de l'endurance.

**Cohérence objectif :** 3×15-20 est correct pour l'endurance. Le fullbody vendredi cumule 4 composés + 5 isolations (11 exercices) — dense mais réalisable en 60 min à 60 s de repos.

**Volume hebdomadaire legs :** Lower-quad + Lower-hip + Fullbody = 3 sessions basses dans 3 jours consécutifs (mer-jeu-ven). Même en endurance, ce cumul de sollicitations pour un advanced est risqué sans décharge intermédiaire.

**Verdict : ⚠️ Problème mineur** — structure logiquement correcte mais jambes 3× consécutives sous-optimale ; doublon triceps en Push.

---

## P52 — legs + back + chest (ambiguïté totale) → fullbody

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner',
  focusMuscles:['legs','back','chest'] }
```

### Étape 1 — workoutTypeFromFocus(['legs','back','chest'])

```
hasLower = true  (legs)
hasPush  = true  (chest)
hasPull  = true  (back)
hasArms  = false
hasUpper = true  (hasPush || hasPull)
hasCore  = false
```

Parcours des règles (lignes 303-321) :
- `hasLower && !hasUpper` → false (hasUpper=true)
- `hasCore && !hasLower && !hasUpper` → false
- `hasPush && !hasPull && !hasLower` → false (hasPull=true, hasLower=true)
- `hasPull && !hasPush && !hasLower` → false (hasPush=true, hasLower=true)
- `hasUpper && !hasLower` → false (hasLower=true)
- `hasLower && hasPush && !hasPull` → false (hasPull=true)
- `hasLower && hasPull && !hasPush` → false (hasPush=true)
- `return null` → **ambiguïté totale**

```
focusType = null
```

### Étape 2 — selectSplit

Pas de focusType → split par défaut.

`isMass = true` (hypertrophy), `level='beginner'`, `daysPerWeek=3`

`case 3` :
- `isMass && level !== 'beginner'` → false (beginner)
- `!isMass && level !== 'beginner'` → false
- Fallback : `return ['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`

```
Split = ['fullbody-quad', 'fullbody-hip', 'fullbody-quad']
Public = ['fullbody', 'fullbody', 'fullbody']
```

Noms : "Full Body A", "Full Body B", "Full Body C" (3 occurrences → suffixes A/B/C)

### Étape 3 — adjustedSlotCount et reorderSlotsByFocus

`focusedMuscles` = FOCUS_TO_MUSCLES['legs'] ∪ FOCUS_TO_MUSCLES['back'] ∪ FOCUS_TO_MUSCLES['chest']
= `{'quads','hamstrings','glutes','calves','back','back_width','back_thickness','chest','chest_upper','chest_lower'}`

`adjustedSlotCount(9, 60, 'hypertrophy')` = 9 (no-op, ligne 428)

**fullbody-quad reorderSlotsByFocus :**

Composés :
- quads/glutes → quads ∈ focused → **FOCUSED** (idx 0)
- chest/chest_upper → chest ∈ focused → **FOCUSED** (idx 1)
- back_width/back_thickness/back → back ∈ focused → **FOCUSED** (idx 2)
- shoulders/shoulders_front → NOT focused (idx 3)

Après tri stable : [quads/glutes, chest, back, shoulders]

Isolations :
- hamstrings → FOCUSED (idx 4)
- shoulders_rear → NOT focused (idx 5)
- biceps → NOT focused (idx 6)
- triceps → NOT focused (idx 7)
- calves → FOCUSED (idx 8)

Après tri stable : [hamstrings, calves, shoulders_rear, biceps, triceps]

Ordre final fullbody-quad reordonné :
1. quads/glutes cpd
2. chest/chest_upper cpd
3. back_width/back_thickness/back cpd
4. shoulders/shoulders_front cpd
5. hamstrings isol
6. calves isol
7. shoulders_rear isol
8. biceps isol
9. triceps isol

**fullbody-hip reorderSlotsByFocus :**

Composés originaux :
- hamstrings/glutes → FOCUSED (idx 0)
- chest/chest_upper → FOCUSED (idx 1)
- back_width/back → FOCUSED (idx 2)
- shoulders/shoulders_front → NOT focused (idx 3)

Après tri : [hamstrings/glutes, chest, back_width, shoulders]

Isolations :
- quads → FOCUSED (idx 4)
- shoulders_lateral/shoulders_rear → NOT focused (idx 5)
- biceps → NOT focused (idx 6)
- triceps → NOT focused (idx 7)
- calves → FOCUSED (idx 8)

Après tri : [quads, calves, shoulders_lat/rear, biceps, triceps]

### Étape 5 — Sets × Reps

`goal='hypertrophy'`, `duration=60` → pas d'ajustement

- Compound : 4×8-12, repos 90 s
- Isolation : 3×10-15, repos 75 s
- Warmup : 2×10
- Core : 3×15

### Étape 6 — Programme final

**Full Body A (fullbody-quad reordonné)**

| # | Slot (muscles) | Cat | Séries×Reps |
|---|---------------|-----|-------------|
| 0 | warmup | — | 2×10 |
| 1 | quads/glutes | cpd | 4×8-12 |
| 2 | chest/chest_upper | cpd | 4×8-12 |
| 3 | back_width/back_thickness/back | cpd | 4×8-12 |
| 4 | shoulders/shoulders_front | cpd | 4×8-12 |
| 5 | hamstrings | isol | 3×10-15 |
| 6 | calves | isol | 3×10-15 |
| 7 | shoulders_rear | isol | 3×10-15 |
| 8 | biceps | isol | 3×10-15 |
| 9 | triceps | isol | 3×10-15 |
| 10 | core | — | 3×15 |

**Full Body B (fullbody-hip reordonné)**

| # | Slot (muscles) | Cat | Séries×Reps |
|---|---------------|-----|-------------|
| 0 | warmup | — | 2×10 |
| 1 | hamstrings/glutes | cpd | 4×8-12 |
| 2 | chest/chest_upper | cpd | 4×8-12 |
| 3 | back_width/back | cpd | 4×8-12 |
| 4 | shoulders/shoulders_front | cpd | 4×8-12 |
| 5 | quads | isol | 3×10-15 |
| 6 | calves | isol | 3×10-15 |
| 7 | shoulders_lateral/shoulders_rear | isol | 3×10-15 |
| 8 | biceps | isol | 3×10-15 |
| 9 | triceps | isol | 3×10-15 |
| 10 | core | — | 3×15 |

**Full Body C** = structure identique à Full Body A (même type `fullbody-quad`), `usedGlobally` différent → exercices potentiellement différents.

### Assertions

- `workoutTypeFromFocus(['legs','back','chest'])` = null (LP3) : **PASS** (ligne 321)
- Split = `['fullbody-quad','fullbody-hip','fullbody-quad']` — jamais lower_pull ni lower_push : **PASS**
- Noms "Full Body A/B/C" (3 occurrences → suffixes) : **PASS**

### Coach

Profil 3j beginner hypertrophie avec muscles diversifiés → fullbody cohérent. La reorderSlotsByFocus hisse bien les composés legs/chest/back en tête. OHP (shoulders) passe 4e — acceptable. Isolations épaules/biceps/triceps non prioritaires.

**Couverture isolation :** shoulders_rear (face pull) présent. Mollets présents. Structurellement complet.

**Variété A→B :** fullbody-quad vs fullbody-hip offrent une vraie différenciation structurelle (squat-dominant vs hip-dominant). Variété réelle ✓

**Verdict : ✅ Bon programme** — ambiguïté correctement résolue, fullbody adapté à un débutant 3j hypertrophie.

---

## P53 — arms seul → upper (cas surprenant mais documenté)

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:DB, level:'beginner',
  focusMuscles:['arms'] }
```

### Étape 1 — workoutTypeFromFocus(['arms'])

```
hasLower = false
hasPush  = false  (pas de chest ni shoulders)
hasPull  = false  (pas de back)
hasArms  = true
hasUpper = hasPush || hasPull || hasArms = true   (ligne 300)
hasCore  = false
```

Parcours des règles :
- `hasLower && !hasUpper` → false
- `hasCore && !hasLower && !hasUpper` → false
- `hasPush && !hasPull && !hasLower` → false (hasPush=false)
- `hasPull && !hasPush && !hasLower` → false (hasPull=false)
- `hasUpper && !hasLower` → **true** → `return 'upper'` (ligne 313)

```
focusType = 'upper'
```

### Étape 2 — selectSplit

`focusType === 'upper'` → ligne 339 :
```
Array.from({ length: 2 }, (_, i) => i % 2 === 0 ? 'upper-push' : 'upper-pull')
= ['upper-push', 'upper-pull']
```

Public types : `['upper', 'upper']`
Noms : "Upper — Haut du corps A", "Upper — Haut du corps B" (2 occurrences → A/B)

### Étape 3 — adjustedSlotCount + reorderSlotsByFocus

`focusedMuscles` = FOCUS_TO_MUSCLES['arms'] = `{'biceps','triceps','forearms'}`

`adjustedSlotCount(8, 60, 'hypertrophy')` = 8 (no-op)

**upper-push reorderSlotsByFocus ({'biceps','triceps','forearms'}) :**

Composés originaux (tous NON focused) :
- chest/chest_upper → NOT focused
- back_width/back_thickness/back → NOT focused
- shoulders/shoulders_front → NOT focused

Isolations :
- chest/chest_lower/chest_upper isol → NOT focused
- **triceps isol** → **FOCUSED**
- shoulders_lateral → NOT focused
- **biceps isol** → **FOCUSED**
- back_thickness/back isol → NOT focused

Après tri :
- Composés (tous non-focused) → ordre inchangé : [chest cpd, back cpd, shoulders cpd]
- Isolations focused first : [triceps, biceps, chest isol, shoulders_lateral, back isol]

Ordre final upper-push :
1. chest/chest_upper cpd (non-focused)
2. back_width/back_thickness/back cpd (non-focused)
3. shoulders/shoulders_front cpd (non-focused)
4. **triceps isol (FOCUSED)**
5. **biceps isol (FOCUSED)**
6. chest/chest_lower/chest_upper isol (non-focused)
7. shoulders_lateral isol (non-focused)
8. back_thickness/back isol (non-focused)

**upper-pull reorderSlotsByFocus ({'biceps','triceps','forearms'}) :**

Composés (tous NON focused) : [back_width/back cpd, back_thickness/back cpd, chest/chest_upper cpd]

Isolations :
- shoulders_rear → NOT focused
- **biceps** → **FOCUSED**
- back_thickness/back isol → NOT focused
- **triceps** → **FOCUSED**
- shoulders_lateral → NOT focused

Ordre final upper-pull :
1. back_width/back cpd (non-focused)
2. back_thickness/back cpd (non-focused)
3. chest/chest_upper cpd (non-focused)
4. **biceps isol (FOCUSED)**
5. **triceps isol (FOCUSED)**
6. shoulders_rear isol (non-focused)
7. back_thickness/back isol (non-focused)
8. shoulders_lateral isol (non-focused)

### Étape 5 — Sets × Reps

`goal='hypertrophy'`, `duration=60`, `level='beginner'` → `candidates[0]`

- Compound : 4×8-12, repos 90 s
- Isolation : 3×10-15, repos 75 s
- Warmup : 2×10 | Core : 3×15

### Étape 6 — Programme final

**Upper A (upper-push, equipment DB)**

| # | Slot (muscles) | Cat | Focus | Séries×Reps |
|---|---------------|-----|-------|-------------|
| 0 | warmup | — | — | 2×10 |
| 1 | chest/chest_upper | cpd | non | 4×8-12 |
| 2 | back_width/back_thickness/back | cpd | non | 4×8-12 |
| 3 | shoulders/shoulders_front | cpd | non | 4×8-12 |
| 4 | **triceps** | isol | **oui** | 3×10-15 |
| 5 | **biceps** | isol | **oui** | 3×10-15 |
| 6 | chest isol | isol | non | 3×10-15 |
| 7 | shoulders_lateral | isol | non | 3×10-15 |
| 8 | back_thickness isol | isol | non | 3×10-15 |
| 9 | core | — | — | 3×15 |

**Upper B (upper-pull, equipment DB)**

| # | Slot (muscles) | Cat | Focus | Séries×Reps |
|---|---------------|-----|-------|-------------|
| 0 | warmup | — | — | 2×10 |
| 1 | back_width/back | cpd | non | 4×8-12 |
| 2 | back_thickness/back | cpd | non | 4×8-12 |
| 3 | chest/chest_upper | cpd | non | 4×8-12 |
| 4 | **biceps** | isol | **oui** | 3×10-15 |
| 5 | **triceps** | isol | **oui** | 3×10-15 |
| 6 | shoulders_rear | isol | non | 3×10-15 |
| 7 | back_thickness isol | isol | non | 3×10-15 |
| 8 | shoulders_lateral | isol | non | 3×10-15 |
| 9 | core | — | — | 3×15 |

### Assertions

- `workoutTypeFromFocus(['arms'])` = `'upper'` via rule 5 `hasUpper && !hasLower` (ligne 313) : **PASS** (ARMS)
- `hasPush=false`, `hasPull=false` → rules 3 & 4 non déclenchées avant rule 5 : **PASS**
- Split = `['upper-push','upper-pull']` → `['upper','upper']` public : **PASS**
- Slots upper-push contient biceps (pos 5) ET triceps (pos 4) : **PASS**
- Slots upper-pull contient biceps (pos 4) ET triceps (pos 5) : **PASS**

### Coach

**Pertinence du split :** L'utilisateur qui sélectionne "arms" se retrouve avec du développé couché, tirage vertical et OHP avant ses isolations bras. C'est surprenant mais pédagogiquement justifié : les composés bras (bench, row) sollicitent triceps et biceps en synergiste, et `reorderSlotsByFocus` remonte les isolations biceps/triceps juste après les composés.

**Équipement DB :** le slot back compound (back_width/back_thickness) doit trouver une row haltère dans le seed. À vérifier que `candidates[0]` n'est pas null.

**Couverture isolation bras :** biceps ET triceps couverts dans les 2 sessions ✓. Les forearms (bras focus) n'ont pas de slot dédié — lacune mineure car forearms sont travaillés indirectement en curl/row.

**Verdict : ⚠️ Problème mineur** — logique correcte, mais l'UX est trompeuse : un débutant qui choisit "arms" ne comprend pas spontanément pourquoi il fait du bench press. Ajouter une explication wizard serait utile.

---

## P54 — chest + back + shoulders + arms → upper (haut du corps complet 4j)

```
{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'intermediate',
  focusMuscles:['chest','back','shoulders','arms'] }
```

### Étape 1 — workoutTypeFromFocus(['chest','back','shoulders','arms'])

```
hasLower = false  (pas de legs)
hasPush  = true   (chest, shoulders)
hasPull  = true   (back)
hasArms  = true
hasUpper = true
hasCore  = false
```

- `hasUpper && !hasLower` → **true** → `return 'upper'` (ligne 313)

```
focusType = 'upper'
```

### Étape 2 — selectSplit

`focusType === 'upper'`, `daysPerWeek=4` :
```
Array.from({ length: 4 }, (_, i) => i % 2 === 0 ? 'upper-push' : 'upper-pull')
= ['upper-push', 'upper-pull', 'upper-push', 'upper-pull']
```

**NB :** le split par défaut 4j isMass serait `['upper-push','lower-quad','upper-pull','lower-hip']`. Le focusMuscles override **bypasse entièrement** la logique par défaut (ligne 333 : `if (focusType) { ... return ... }`) → aucun lower dans le split.

Public = `['upper','upper','upper','upper']`
Noms : "Upper — Haut du corps A/B/C/D" (4 occurrences, suffixes A–D)

Jours par défaut `DAY_ASSIGNMENTS[4]` = `['monday','tuesday','thursday','friday']`

### Étape 3 — adjustedSlotCount + reorderSlotsByFocus

`focusedMuscles` = toutes les MuscleGroups du haut du corps :
`{'chest','chest_upper','chest_lower','back','back_width','back_thickness','shoulders','shoulders_front','shoulders_lateral','shoulders_rear','biceps','triceps','forearms'}`

Pratiquement tous les slots upper sont ciblés → `reorderSlotsByFocus` n'a pas d'effet (tous focused ou quasi).

`adjustedSlotCount(8, 60, 'hypertrophy')` = 8 (no-op)

**upper-push (sessions A et C) :** 8 slots dans l'ordre original (tous focused)
1. chest/chest_upper cpd
2. back_width/back_thickness/back cpd
3. shoulders/shoulders_front cpd
4. chest isol
5. triceps isol
6. shoulders_lateral isol
7. biceps isol
8. back_thickness isol

**upper-pull (sessions B et D) :** 8 slots dans l'ordre original (tous focused)
1. back_width/back cpd
2. back_thickness/back cpd
3. chest/chest_upper cpd
4. shoulders_rear isol
5. biceps isol
6. back_thickness isol
7. triceps isol
8. shoulders_lateral isol

### Étape 5 — Sets × Reps

`goal='hypertrophy'`, `duration=60`, `level='intermediate'` → random top-3 pour chaque slot

- Compound : 4×8-12, repos 90 s
- Isolation : 3×10-15, repos 75 s

### Étape 6 — Programme final

**Sessions A et C — Upper — Haut du corps (upper-push)**

| # | Slot (muscles) | Cat | Séries×Reps |
|---|---------------|-----|-------------|
| 0 | warmup | — | 2×10 |
| 1 | chest/chest_upper | cpd | 4×8-12 |
| 2 | back_width/back_thickness/back | cpd | 4×8-12 |
| 3 | shoulders/shoulders_front | cpd | 4×8-12 |
| 4 | chest isol | isol | 3×10-15 |
| 5 | triceps isol | isol | 3×10-15 |
| 6 | shoulders_lateral isol | isol | 3×10-15 |
| 7 | biceps isol | isol | 3×10-15 |
| 8 | back_thickness isol | isol | 3×10-15 |
| 9 | core | — | 3×15 |

**Sessions B et D — Upper — Haut du corps (upper-pull)**

| # | Slot (muscles) | Cat | Séries×Reps |
|---|---------------|-----|-------------|
| 0 | warmup | — | 2×10 |
| 1 | back_width/back | cpd | 4×8-12 |
| 2 | back_thickness/back | cpd | 4×8-12 |
| 3 | chest/chest_upper | cpd | 4×8-12 |
| 4 | shoulders_rear isol | isol | 3×10-15 |
| 5 | biceps isol | isol | 3×10-15 |
| 6 | back_thickness isol | isol | 3×10-15 |
| 7 | triceps isol | isol | 3×10-15 |
| 8 | shoulders_lateral isol | isol | 3×10-15 |
| 9 | core | — | 3×15 |

**Variété structurelle :** upper-push vs upper-pull offrent une structure différenciée (bench-first vs traction-first) ✓. Sur 4 sessions, A=C (même slots, potentiellement exercices différents via `usedGlobally`) ; B=D idem.

### Assertions

- `workoutTypeFromFocus` = `'upper'` (hasUpper && !hasLower) : **PASS**
- Override du split par défaut 4j intermediate (upper/lower) → upper × 4 : **PASS** (ligne 333)
- Types internes upper-push/upper-pull alternés × 4 : **PASS**
- Noms "Upper — Haut du corps A/B/C/D" : **PASS**
- 0 session lower dans la semaine : PASS (comportement attendu avec focusMuscles override)

### Coach

**Récupération :** 4 sessions haut du corps consécutives (lun/mar/jeu/ven) sans aucun travail du bas du corps. Les groupes musculaires chest/back/shoulders sont sollicités 2× par semaine chacun (sessions A+C ou B+D), avec ~48h de repos entre les deux sessions de même structure. C'est tolérable pour un intermediate en hypertrophie.

**Absence de jambes :** zéro travail lower body sur la semaine — volume hebdomadaire déséquilibré. Un utilisateur qui spécifie tous les muscles du haut du corps sans `legs` obtient exactement ce qu'il a demandé, mais le programme est incomplet d'un point de vue athlétique.

**Volume :** 4 sessions × 8 exercices de travail (+ warmup + core) = 32 exercices semaine = ~96 séries (compound 4 × 8 slots × 2 sessions = 64 séries compound + 48 isol) — volume élevé mais acceptable sur 4 sessions.

**Verdict : ⚠️ Problème mineur** — logique d'override correcte ; absence totale de jambes est un choix utilisateur mais mérite un avertissement wizard.

---

## P55 — focusMuscles + selectedDays custom

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner',
  focusMuscles:['legs','back'], selectedDays:['tuesday','thursday','saturday'] }
```

### Étape 1 — workoutTypeFromFocus(['legs','back'])

```
hasLower = true  (legs)
hasPush  = false
hasPull  = true  (back)
hasArms  = false
hasUpper = true  (hasPull)
hasCore  = false
```

- `hasLower && hasPull && !hasPush` → **true** → `return 'lower_pull'` (ligne 319)

```
focusType = 'lower_pull'
```

### Étape 2 — selectSplit

`focusType === 'lower_pull'` (ni 'lower' ni 'upper') → ligne 344 :
```
Array.from({ length: 3 }, () => 'lower_pull') = ['lower_pull', 'lower_pull', 'lower_pull']
```

Public = `['lower','lower','lower']`
Noms : "Lower — Chaîne postérieure A/B/C"

**Jours selectedDays :**
`selectedDays.length === daysPerWeek` → `3 === 3` → condition vraie (ligne 722)
`days = ['tuesday','thursday','saturday']`

weekMap :
- tuesday → session A
- thursday → session B
- saturday → session C

### Étape 3 — adjustedSlotCount + reorderSlotsByFocus

`focusedMuscles` = FOCUS_TO_MUSCLES['legs'] ∪ FOCUS_TO_MUSCLES['back']
= `{'quads','hamstrings','glutes','calves','back','back_width','back_thickness'}`

`adjustedSlotCount(9, 60, 'hypertrophy')` = 9 (no-op)

**lower_pull slots originaux :**
```
Index 0 : hamstrings/glutes cpd           → FOCUSED (hamstrings, glutes ∈ legs)
Index 1 : back_width/back cpd             → FOCUSED (back ∈ back)
Index 2 : back_thickness/back cpd         → FOCUSED
Index 3 : quads/glutes cpd                → FOCUSED (quads, glutes ∈ legs)
Index 4 : glutes/hamstrings isol          → FOCUSED
Index 5 : back_thickness/back_width/back isol → FOCUSED
Index 6 : hamstrings isol                 → FOCUSED
Index 7 : biceps isol                     → NOT focused
Index 8 : calves isol                     → FOCUSED
```

Après tri stable :
- Composés tous FOCUSED → ordre inchangé : [idx0, idx1, idx2, idx3]
- Isolations focused (idx4, idx5, idx6, idx8), non-focused (idx7)

Ordre final :
1. hamstrings/glutes cpd
2. back_width/back cpd
3. back_thickness/back cpd
4. quads/glutes cpd
5. glutes/hamstrings isol
6. back_thickness/back_width/back isol
7. hamstrings isol
8. calves isol
9. biceps isol

9 slots retenus.

### Étape 5 — Sets × Reps

`goal='hypertrophy'`, `duration=60`, `level='beginner'` → `candidates[0]`

- Compound : 4×8-12, repos 90 s
- Isolation : 3×10-15, repos 75 s
- Warmup : 2×10 | Core : 3×15

### Étape 6 — Programme final

**Sessions A, B, C — Lower — Chaîne postérieure (lower_pull)**
*(même structure pour les 3 sessions, exercices variés via usedGlobally)*

| # | Slot (muscles) | Cat | Focus | Séries×Reps |
|---|---------------|-----|-------|-------------|
| 0 | warmup | — | — | 2×10 |
| 1 | hamstrings/glutes | cpd | oui | 4×8-12 |
| 2 | back_width/back | cpd | oui | 4×8-12 |
| 3 | back_thickness/back | cpd | oui | 4×8-12 |
| 4 | quads/glutes | cpd | oui | 4×8-12 |
| 5 | glutes/hamstrings | isol | oui | 3×10-15 |
| 6 | back_thickness/back_width/back | isol | oui | 3×10-15 |
| 7 | hamstrings | isol | oui | 3×10-15 |
| 8 | calves | isol | oui | 3×10-15 |
| 9 | biceps | isol | non | 3×10-15 |
| 10 | core | — | — | 3×15 |

**Variété :** les 3 sessions ont la même structure de slots (lower_pull × 3, pas d'alternance quad/hip). La diversité repose uniquement sur `usedGlobally` — variété d'exercices seulement, pas structurelle.

### Assertions

- `workoutTypeFromFocus(['legs','back'])` = `'lower_pull'` (LP1) : **PASS** (ligne 319)
- Split = `['lower_pull','lower_pull','lower_pull']` : **PASS**
- `selectedDays` longueur 3 = daysPerWeek 3 → override appliqué (ligne 722) : **PASS**
- weekMap : tuesday/thursday/saturday → A/B/C : **PASS**
- Slot 1 = hamstrings/glutes compound (LP4) : **PASS** (deadlift-first)
- Jours par défaut (lun/mer/ven) NON utilisés : **PASS**

### Coach

**Cohérence lower_pull :** 4 composés (deadlift/RDL, tirage, rowing, squat) + 5 isolations → séance très polyvalente jambes+dos. Logique pour un profil "posture et force basse chaîne".

**3 sessions identiques structurellement :** sans alternance lower_pull-A / lower_pull-B (comme lower-quad/lower-hip), le programme est moins varié. Pool de 9 exercices par slot limité pour 3 sessions ; `usedGlobally` assure la rotation mais au bout de 3 sessions les pools s'épuisent.

**selectedDays tuesday/thursday/saturday :** 2 jours de repos entre mar/jeu, 2 jours entre jeu/sam — bien réparti ✓.

**Verdict : ✅ Bon programme** — correction lower_pull, selectedDays respectés. Réserve : variété structurelle limitée (3× même squelette).

---

## P56 — lower_push + BW only

```
{ goal:'endurance', daysPerWeek:2, sessionDuration:45, equipment:BW, level:'beginner',
  focusMuscles:['legs','shoulders'] }
```

### Étape 1 — workoutTypeFromFocus(['legs','shoulders'])

```
hasLower = true  (legs)
hasPush  = true  (shoulders)
hasPull  = false
hasArms  = false
hasUpper = true
hasCore  = false
```

- `hasLower && hasPush && !hasPull` → **true** → `return 'lower_push'` (ligne 316)

```
focusType = 'lower_push'
```

### Étape 2 — selectSplit

`focusType = 'lower_push'` (ni 'lower' ni 'upper') → ligne 344 :
```
['lower_push', 'lower_push']
```

Public = `['lower','lower']`
Noms : "Lower — Squat & Press A", "Lower — Squat & Press B"

Jours `DAY_ASSIGNMENTS[2]` = `['monday','thursday']`

### Étape 3 — adjustedSlotCount + reorderSlotsByFocus

`focusedMuscles` = FOCUS_TO_MUSCLES['legs'] ∪ FOCUS_TO_MUSCLES['shoulders']
= `{'quads','hamstrings','glutes','calves','shoulders','shoulders_front','shoulders_lateral','shoulders_rear'}`

`adjustedSlotCount(9, 45, 'endurance')` :
`isStrength = false`, `duration = 45` → `Math.max(3, Math.floor(9 × 0.75))` = `Math.max(3, 6)` = **6**

**lower_push slots originaux :**
```
Index 0 : quads/glutes cpd                         → FOCUSED (quads, glutes ∈ legs)
Index 1 : chest/chest_upper cpd                    → NOT focused
Index 2 : shoulders/shoulders_front cpd            → FOCUSED
Index 3 : hamstrings/glutes cpd                    → FOCUSED
Index 4 : quads isol                               → FOCUSED
Index 5 : chest/chest_lower/chest_upper isol       → NOT focused
Index 6 : triceps isol                             → NOT focused
Index 7 : glutes isol                              → FOCUSED
Index 8 : calves isol                              → FOCUSED
```

Tri composés :
- Focused : idx0, idx2, idx3
- Non-focused : idx1

Ordre : [quads/glutes cpd, shoulders cpd, hamstrings/glutes cpd, chest cpd]

Tri isolations :
- Focused : idx4 (quads), idx7 (glutes), idx8 (calves)
- Non-focused : idx5 (chest isol), idx6 (triceps)

Ordre : [quads isol, glutes isol, calves isol, chest isol, triceps isol]

Ordre final (9 slots) :
1. quads/glutes cpd (focused)
2. shoulders/shoulders_front cpd (focused)
3. hamstrings/glutes cpd (focused)
4. chest/chest_upper cpd (non-focused)
5. quads isol (focused)
6. glutes isol (focused)
7. calves isol (focused)
8. chest isol (non-focused)
9. triceps isol (non-focused)

**Slots retenus (6 premiers) :**
1. quads/glutes cpd
2. shoulders/shoulders_front cpd
3. hamstrings/glutes cpd
4. chest/chest_upper cpd ← non-focused (4e position)
5. quads isol
6. glutes isol

### Étape 5 — Sets × Reps

`goal='endurance'`, `duration=45` :
`adjustedSpec(spec, 45)` → `factor=0.75`

- Compound base : 3 sets → `Math.max(2, Math.floor(3×0.75))` = `Math.max(2,2)` = **2** → 2×15-20
- Isolation base : 3 sets → même calcul → **2** → 2×15-20
- Warmup : 2×10 (non ajusté)
- Core : 3×15 (non ajusté)

`equipment = BW` → `progressStepKg = 0`, `autoProgress = false` (ligne 563)

### Étape 6 — Programme final

**Sessions A et B — Lower — Squat & Press (lower_push, BW only)**

| # | Slot (muscles) | Cat | Focus | Séries×Reps | BW disponible ? |
|---|---------------|-----|-------|-------------|-----------------|
| 0 | warmup | — | — | 2×10 | oui (BW warmup) |
| 1 | quads/glutes | cpd | oui | 2×15-20 | squat BW ✓ |
| 2 | shoulders/shoulders_front | cpd | oui | 2×15-20 | ⚠️ pike push-up (si dans seed) |
| 3 | hamstrings/glutes | cpd | oui | 2×15-20 | glute bridge / hip thrust BW ✓ |
| 4 | chest/chest_upper | cpd | non | 2×15-20 | push-up BW ✓ |
| 5 | quads | isol | oui | 2×15-20 | lunge BW ✓ |
| 6 | glutes | isol | oui | 2×15-20 | donkey kick BW ✓ |
| 7 | core | — | — | 3×15 | oui |

`autoProgress = false`, `progressStepKg = 0` pour tous les exercices BW.

### Assertions

- `workoutTypeFromFocus(['legs','shoulders'])` = `'lower_push'` (LP2) : **PASS** (ligne 316)
- Split = `['lower_push','lower_push']` public `['lower','lower']` : **PASS**
- `adjustedSlotCount(9, 45, 'endurance')` = 6 : **PASS**
- `autoProgress = false` pour BW : **PASS**
- `progressStepKg = 0` pour BW : **PASS**
- Équipement BW uniquement (aucun exercice machine/barbell/dumbbell) : **PASS** (filtre ligne 704)

### Coach

**Slot shoulders BW compound (slot 2) :** exercice OHP ou pike push-up bodyweight requis. Si le seed ne contient pas de compound BW pour `shoulders/shoulders_front`, ce slot retourne null → slot élidé → 5 exercices de travail seulement. C'est le risque principal de ce profil.

**Slot 4 chest compound (non-focused) :** push-up est probablement disponible. Ce slot est dans les 6 retenus malgré son statut non-focused — le reorderSlotsByFocus ne le remonte pas (chest non ciblé), mais il passe sous la coupure à 6 slots.

**Qualité du profil :** BW endurance pour jambes+épaules est réaliste (squat, pike push-up, glute bridge). 2×15-20 à 60s de repos = circuit-training léger, bon pour l'endurance musculaire.

**Verdict : ✅ Bon programme** — logique LP2 correcte, ajustement 45min correct, BW filtré. Réserve : slot shoulders compound potentiellement vide selon le seed.

---

## P57 — lower_pull + machine+cable only

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:MACH+CABLE, level:'beginner',
  focusMuscles:['legs','back'] }
```

### Étape 1 — workoutTypeFromFocus(['legs','back'])

```
hasLower = true  (legs)
hasPush  = false
hasPull  = true  (back)
hasArms  = false
hasUpper = true
hasCore  = false
```

- `hasLower && hasPull && !hasPush` → **true** → `return 'lower_pull'` (ligne 319)

```
focusType = 'lower_pull'
```

### Étape 2 — selectSplit

`daysPerWeek=2` :
```
['lower_pull', 'lower_pull']   →   public ['lower','lower']
```

Noms : "Lower — Chaîne postérieure A", "Lower — Chaîne postérieure B"
Jours : monday, thursday

### Étape 3 — adjustedSlotCount + reorderSlotsByFocus

`focusedMuscles` = `{'quads','hamstrings','glutes','calves','back','back_width','back_thickness'}`

`adjustedSlotCount(9, 60, 'hypertrophy')` = 9

Reorder identique à P55 (mêmes focusMuscles) → ordre final :
1. hamstrings/glutes cpd (focused)
2. back_width/back cpd (focused)
3. back_thickness/back cpd (focused)
4. quads/glutes cpd (focused)
5. glutes/hamstrings isol (focused)
6. back isol (focused)
7. hamstrings isol (focused)
8. calves isol (focused)
9. biceps isol (non-focused)

### Étape 5 — Sets × Reps

`goal='hypertrophy'`, `duration=60` → pas d'ajustement

- Compound : 4×8-12, repos 90 s
- Isolation : 3×10-15, repos 75 s
- `equipment = {'machine','cable'}` → progressStepKg = 2.5, autoProgress = true

### Étape 6 — Programme final

**Sessions A et B — Lower — Chaîne postérieure (lower_pull, machine+cable)**

| # | Slot (muscles) | Cat | Focus | Séries×Reps | Machine/Cable disponible ? |
|---|---------------|-----|-------|-------------|---------------------------|
| 0 | warmup | — | — | 2×10 | BW warmup ✓ |
| 1 | hamstrings/glutes | cpd | oui | 4×8-12 | **⚠️ slot à risque** — voir ci-dessous |
| 2 | back_width/back | cpd | oui | 4×8-12 | Lat pulldown machine / cable ✓ |
| 3 | back_thickness/back | cpd | oui | 4×8-12 | Cable row / machine row ✓ |
| 4 | quads/glutes | cpd | oui | 4×8-12 | Leg press machine ✓ |
| 5 | glutes/hamstrings | isol | oui | 3×10-15 | Machine hip thrust / cable kickback ✓ |
| 6 | back isol | isol | oui | 3×10-15 | Cable pullover / machine row isol ✓ |
| 7 | hamstrings | isol | oui | 3×10-15 | Machine leg curl ✓ |
| 8 | calves | isol | oui | 3×10-15 | Machine calf raise ✓ |
| 9 | biceps | isol | non | 3×10-15 | Cable curl ✓ |
| 10 | core | — | — | 3×15 | BW planche ✓ |

**⚠️ Slot 1 — hamstrings/glutes COMPOUND avec machine/cable :**
Le deadlift et le RDL (exercises canoniques du lower_pull) sont barbell/dumbbell. Pour machine/cable :
- Un deadlift machine ou trap-bar deadlift machine n'est pas toujours présent dans les seeds standard.
- Le cable pull-through (hamstrings/glutes, cable, compound) est une alternative viable si elle est dans le seed avec `primaryMuscle ∈ ['hamstrings','glutes']` et `category='compound'`.
- Si le slot est vide (aucun candidat compound machine/cable pour hamstrings/glutes) → l'exercice est skippé → 8 exercices de travail au lieu de 9.

### Assertions

- `workoutTypeFromFocus(['legs','back'])` = `'lower_pull'` (LP1) : **PASS** (ligne 319)
- Split = `['lower_pull','lower_pull']` public `['lower','lower']` : **PASS**
- Aucun exercice barbell ni dumbbell dans la sortie : **PASS** (filtre ligne 704, `allowed = {'machine','cable'}`)
- Slot 1 = hamstrings/glutes compound : structure PASS, exercice potentiellement null selon seed : **⚠️ CONDITIONNEL**

### Coach

**Remplacement du deadlift :** sans barre, le mouvement-roi du lower_pull disparaît. Le cable pull-through ou la machine RDL (rare) peut le remplacer. Si le slot est vide, la session perd son exercice le plus structurant — c'est un trou sérieux pour un programme "chaîne postérieure".

**Slots 2 et 3 :** lat pulldown + cable row → parfaitement couverts par machine/cable ✓

**Slot 4 :** leg press machine → quads/glutes compound ✓

**Qualité machine/cable pour lower_pull :** sauf pour le slot 1 (hip hinge compound), le reste du programme est bien adapté au matériel. Machine leg curl (hamstrings isol) + cable kickback (glutes isol) sont de bons substituts.

**Verdict : ⚠️ Problème mineur** — logique LP1 et filtre équipement corrects ; risque de slot vide sur le composé hamstrings/glutes faute de machine hip-hinge dans le seed.

---

## Récapitulatif assertions Groupe F — P51 à P57

### Tableau de synthèse

| Profil | Assertion principale | Verdict technique | Réserves coach ⚠️ |
|--------|---------------------|-------------------|-------------------|
| P51 | endurance 5j advanced → `['push','pull','lower-quad','lower-hip','fullbody-quad']` | ✅ PASS | Jambes 3× consécutives (mer-jeu-ven) ; doublon slots triceps en Push |
| P52 | legs+back+chest → null → fullbody×3 (LP3) | ✅ PASS | — |
| P53 | arms seul → upper (ARMS, rule 5) | ✅ PASS | UX trompeuse pour débutant (bench press ≠ "bras") ; forearms sans slot dédié |
| P54 | haut du corps complet → upper × 4 (override lower défaut) | ✅ PASS | Aucun travail jambes sur la semaine ; volume haut du corps élevé 4j |
| P55 | legs+back → lower_pull × 3, selectedDays respectés (LP1) | ✅ PASS | Variété structurelle absente (3× même squelette lower_pull) |
| P56 | legs+shoulders → lower_push, BW, 45min → 6 slots (LP2) | ✅ PASS | Slot shoulders BW compound potentiellement vide (dépend du seed) |
| P57 | legs+back → lower_pull, machine+cable (LP1) | ✅ PASS | Slot hamstrings/glutes compound potentiellement vide (pas de deadlift machine standard) |

### Vérification assertions critiques Groupe F

| Code | Assertion | Validé dans P51-P57 | Statut |
|------|-----------|--------------------|----|
| LP1 | `legs+back(!push)` → `lower_pull` | P55 (legs+back), P57 (legs+back) | ✅ PASS |
| LP2 | `legs+push(!pull)` → `lower_push` | P56 (legs+shoulders) | ✅ PASS |
| LP3 | `legs+push+pull` → null → fullbody | P52 (legs+back+chest) | ✅ PASS |
| LP4 | lower_pull : slot[0] = hamstrings/glutes compound (deadlift-first) | Code ligne 220 + P55/P57 | ✅ PASS |
| LP5 | lower_push : slot[0] = quads/glutes compound (squat-first) | Code ligne 237 + P56 | ✅ PASS |
| PUSH_FULL | chest+shoulders → `push` (pas upper) | Hors P51-P57 (P45), vérifié par code rule 3 ligne 309 | ✅ PASS (code) |
| PULL_FULL | back+arms → `pull` (pas upper) | Hors P51-P57 (P46), vérifié par code rule 4 ligne 311 | ✅ PASS (code) |
| ARMS | arms seul → `upper` (rule 5 avant rules 3/4) | P53 | ✅ PASS |

**Toutes les assertions Groupe F sont validées.**

### Problèmes ouverts identifiés dans P51-P57

**Bugs / anomalies potentielles :**

1. **P57 / P56 — Slot compound potentiellement vide selon seed :**
   - P57 slot hamstrings/glutes compound sans barbell/dumbbell : aucun deadlift machine standard dans la plupart des seeds → slot skippé silencieusement.
   - P56 slot shoulders/shoulders_front compound BW : pike push-up requis dans le seed avec `category='compound'` et `primaryMuscle ∈ ['shoulders','shoulders_front']`.
   - Impact : séance plus courte que prévu, groupe musculaire central du split non couvert en composé.
   - Recommandation : ajouter une validation post-génération qui détecte `ex === null` sur les slots composés d'un type de séance et avertit l'utilisateur.

2. **P51 — Doublon de slots triceps dans la séance Push :**
   - Slots 4 et 6 du type `push` ciblent tous deux `['triceps']` isolation. `usedInWorkout` évite le même exercice, mais exige 2 exercices triceps distincts dans le pool. Si le pool est pauvre (endurance + FULL devrait suffire, mais BW-only serait problématique).
   - Recommandation : vérifier que le slot 6 de `push` est intentionnel ou envisager de le remplacer par `forearms`.

**Réserves coach récurrentes :**

| Thème | Profils | Recommandation |
|-------|---------|----------------|
| Jambes consécutives en fin de semaine | P51 | Permuter Fullbody au milieu (jeu) et Lower-hip en fin (ven) dans le split non-mass 5j |
| Slot compound vide en équipement restreint | P56, P57 | Fallback isolation si aucun compound disponible, ou warning utilisateur |
| Variété structurelle absente pour N× même type | P55 (lower_pull × 3) | Envisager une alternance lower_pull-A / lower_pull-B quand daysPerWeek ≥ 3 |
| UX trompeuse arms → upper | P53 | Message d'explication wizard : "Arms only → programme upper complet avec priorité bras" |
| Absence jambes avec focusMuscles upper-only | P54 | Warning wizard : "Aucun groupe musculaire bas du corps sélectionné" |
