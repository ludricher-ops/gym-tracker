# Audit P41–P57 — Groupe F : lower_pull/lower_push/focus cross-body (v5)
**Date :** 2026-09-06
**Fichiers lus :** programGenerator.ts + audit_prompt_v3.md
**Changements depuis v4 :** BUG-1 (P50: 90min strength=5 slots, 7 ex.) · BUG-4 push slot6=shoulders_rear · UX-1/UX-2 warnings arms

---

## Rappel — formules clés

### `workoutTypeFromFocus` (lignes 290–322)
```
hasLower = includes('legs')
hasPush  = includes('chest') || includes('shoulders')
hasPull  = includes('back')
hasArms  = includes('arms')
hasCore  = includes('core')
hasUpper = hasPush || hasPull || hasArms

R1 : hasLower && !hasUpper          → 'lower'
R2 : hasCore && !hasLower && !hasUpper → null
R3 : hasPush && !hasPull && !hasLower  → 'push'
R4 : hasPull && !hasPush && !hasLower  → 'pull'
R5 : hasUpper && !hasLower             → 'upper'
R6 : hasLower && hasPush && !hasPull   → 'lower_push'
R7 : hasLower && hasPull && !hasPush   → 'lower_pull'
R∞ : → null
```

### `adjustedSlotCount` (lignes 422–439)
| Durée | Non-strength | Strength |
|-------|-------------|---------|
| 20 min | max(2, ⌊base×0.5⌋) | max(2, ⌊base×0.5⌋) |
| 45 min | max(3, ⌊base×0.75⌋) | max(2, ⌊base×0.5⌋) |
| 60 min | base | max(4, ⌊base×0.5⌋) |
| 90 min | min(base+2, 8) | **min(base, 5)** ← BUG-1 fix |

### Bases de slots
- push, pull, legs, lower, lower-quad, lower-hip : **6 slots**
- upper, upper-push, upper-pull : **8 slots**
- fullbody-quad, fullbody-hip, lower_pull, lower_push : **9 slots**

### Specs séries × reps
| Objectif | Composés | Isolations |
|----------|----------|-----------|
| strength | 5×3-5, 180s | 3×5-8, 120s |
| hypertrophy | 4×8-12, 90s | 3×10-15, 75s |
| endurance | 3×15-20, 60s | 3×15-20, 45s |
| fat_loss | 3×12-15, 60s | 3×12-15, 60s |

Warmup : 2×10, 0s · Core : 3×15, 60s
`adjustedSpec` réduit les séries × 0.75 (min 2) à 45 min, × 0.5 (min 2) à 20 min. Pas de changement à 60 et 90 min.

---

## Slots de référence

### lower_pull (9 slots)
| # | Muscle(s) | Cat |
|---|-----------|-----|
| 0 | hamstrings, glutes | composé |
| 1 | back_width, back | composé |
| 2 | back_thickness, back | composé |
| 3 | quads, glutes | composé |
| 4 | glutes, hamstrings | isolation |
| 5 | back_thickness, back_width, back | isolation |
| 6 | hamstrings | isolation |
| 7 | calves | isolation |
| 8 | biceps | isolation |

### lower_push (9 slots)
| # | Muscle(s) | Cat |
|---|-----------|-----|
| 0 | quads, glutes | composé |
| 1 | chest, chest_upper | composé |
| 2 | shoulders, shoulders_front | composé |
| 3 | hamstrings, glutes | composé |
| 4 | quads | isolation |
| 5 | calves | isolation |
| 6 | chest, chest_lower, chest_upper | isolation |
| 7 | glutes | isolation |
| 8 | triceps | isolation |

### push (6 slots — après BUG-4 fix)
| # | Muscle(s) | Cat |
|---|-----------|-----|
| 0 | chest, chest_upper, chest_lower | composé |
| 1 | shoulders, shoulders_front | composé |
| 2 | chest, chest_upper, chest_lower | isolation |
| 3 | triceps | isolation |
| 4 | shoulders_lateral, shoulders | isolation |
| 5 | **shoulders_rear** | isolation ← BUG-4 fix |

---

## P41 — legs + back → lower_pull (chaîne postérieure)

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:BB+DB, level:'beginner',
  focusMuscles:['legs','back'] }
```

### Simulation

**Étape 1 — workoutTypeFromFocus(['legs','back'])**
- hasLower=true, hasPush=false, hasPull=true → hasUpper=true
- R1 : hasLower && !hasUpper → false (hasUpper=true)
- R7 : hasLower && hasPull && !hasPush → **true** → `'lower_pull'`

**Étape 2 — selectSplit**
- focusType='lower_pull' ≠ 'lower' ≠ 'upper' → répété daysPerWeek fois
- Split = `['lower_pull','lower_pull']`
- Types publics = `['lower','lower']`

**Étape 3 — adjustedSlotCount**
- base=9, duration=60, goal=hypertrophy → **9 slots** (base intact)

**focusedMuscles** = legs ∪ back = {quads, hamstrings, glutes, calves, back, back_width, back_thickness}

**reorderSlotsByFocus** (tous les slots de lower_pull sauf biceps[8] sont dans le focus) :
- Composés ciblés : 0,1,2,3 → ordre conservé
- Isolations ciblées : 4,5,6,7 → ordre conservé
- Isolations non ciblées : 8 (biceps)
- Résultat : [0,1,2,3,4,5,6,7,8]

**Étape 4–6 — Table des exercices**

Séance "Lower — Chaîne postérieure A" :
| # | Slot | Cat | Groupe cible | Exercice générique | Séries×Reps |
|---|------|-----|-------------|-------------------|-------------|
| 0 | warmup | — | — | Jumping jacks / mobilité | 2×10 |
| 1 | hamstrings/glutes | cmp | ischio-fessiers | Deadlift BB (ou RDL BB) | 4×8-12 |
| 2 | back_width | cmp | dos (largeur) | Bent-over row BB | 4×8-12 |
| 3 | back_thickness | cmp | dos (épaisseur) | DB row (1 bras) | 4×8-12 |
| 4 | quads/glutes | cmp | quad-fessiers | Squat BB | 4×8-12 |
| 5 | glutes/hamstrings | iso | fessiers | Hip thrust BB | 3×10-15 |
| 6 | back_thickness/width | iso | dos | DB pullover | 3×10-15 |
| 7 | hamstrings | iso | ischio | Leg curl (DB ou machine) | 3×10-15 |
| 8 | calves | iso | mollets | Calf raise BB / DB | 3×10-15 |
| 9 | biceps | iso | biceps | Barbell curl | 3×10-15 |
| 10 | core | — | abdos | Planche / Crunch | 3×15 |

Séance "Lower — Chaîne postérieure B" (usedGlobally = exercices de A) :
| # | Slot | Cat | Exercice générique | Séries×Reps |
|---|------|-----|--------------------|-------------|
| 0 | warmup | — | Rotation articulaire | 2×10 |
| 1 | hamstrings/glutes | cmp | RDL DB | 4×8-12 |
| 2 | back_width | cmp | Pull-up (BB+DB → pas disponible ; → DB row lat ?) | 4×8-12 |
| 3 | back_thickness | cmp | Bent-over row DB | 4×8-12 |
| 4 | quads/glutes | cmp | Front squat BB / Split squat BB | 4×8-12 |
| 5 | glutes/hamstrings | iso | Glute bridge DB | 3×10-15 |
| 6 | back_thickness/width | iso | DB row unilatéral (variation) | 3×10-15 |
| 7 | hamstrings | iso | Leg curl couchée DB | 3×10-15 |
| 8 | calves | iso | Calf raise unilateral DB | 3×10-15 |
| 9 | biceps | iso | DB curl (ou hammer curl) | 3×10-15 |
| 10 | core | — | Russian twist | 3×15 |

> ⚠️ Sans pullup_bar ni câble, le slot back_width (posture composée) se résume à du rowing haltère — variété structurelle limitée en BB+DB.

**Assertions**
- LP1 : legs+back(!push) → lower_pull, jamais fullbody → **PASS** ✓ (R7 ligne 319)
- LP4 : lower_pull deadlift-first : slot 1 = hamstrings/glutes composé → **PASS** ✓ (SLOTS['lower_pull'][0])
- Split public ['lower','lower'] → **PASS** ✓
- Noms "Lower — Chaîne postérieure A/B" → **PASS** ✓ (WORKOUT_NAMES['lower_pull'])
- Premier exercice de travail = deadlift/RDL → **PASS** ✓
- autoProgress=true, progressStepKg=2.5 (BB+DB) → **PASS** ✓
- Warning spécialisation UX-D → **PASS** ✓ (lower×2, publicTypes.size=1, t='lower')

**Coach**
- Équilibre : deadlift couvre ischio+fessiers+dos simultanément — excellent choix de slot-roi ✓
- 4 composés + 5 isolations en hypertrophie 60 min : timing estimé ~70–75 min (4 cmps × 4×2.2min + 5 iso × 3×2min + transitions + warmup/core) → légèrement au-dessus de 60 min
- Pool BB+DB : manque de câble → slot back_width B forcé sur une variation DB du même mouvement → variation limitée
- UX-D (spécialisation lower×2) correct ; dos ET jambes couverts simultanément → acceptable pour un bloc court
- **Verdict : ⚠️ Bon contenu, timing légèrement serré (9 slots / 60 min), pool dos limité sans câble**

---

## P42 — legs + back + core → lower_pull (core ne change pas le type)

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner',
  focusMuscles:['legs','back','core'] }
```

### Simulation

**Étape 1 — workoutTypeFromFocus(['legs','back','core'])**
- hasLower=true, hasPush=false, hasPull=true, hasCore=true → hasUpper=true
- R7 : hasLower && hasPull && !hasPush → **true** → `'lower_pull'`
- (core seul → null, mais ici legs présent → la règle R7 prime)

**Étape 2 — selectSplit**
- focusType='lower_pull' → répété 3 fois
- Split = `['lower_pull','lower_pull','lower_pull']`

**Étape 3 — adjustedSlotCount**
- 9 slots, 60 min, hypertrophy → **9 slots**

**focusedMuscles** = legs ∪ back ∪ core = {quads, hamstrings, glutes, calves, back, back_width, back_thickness, core}

reorderSlotsByFocus : identique à P41 (core n'est dans aucun slot de lower_pull → pas d'impact sur l'ordre). Résultat : [0,1,2,3,4,5,6,7,8].

Core apparaît en queue via corePool (comportement normal ✓).

**Table des exercices — Lower — Chaîne postérieure A/B/C**

3 sessions, équipement FULL, beginner → candidates[0] à chaque fois, rotation via usedGlobally :

| Session | Slot 1 (cmp) | Slot 2 (cmp) | Slot 3 (cmp) | Slot 4 (cmp) | Slots 5-9 (iso) | Core |
|---------|-------------|-------------|-------------|-------------|----------------|------|
| A | Deadlift BB | Traction larg. | Rowing BB | Squat BB | Hip thrust, Iso dos, Leg curl, Mollets, Curl BB | Planche |
| B | RDL BB | Lat pulldown câble | Cable row | Leg press | Glute bridge, Pullover, Leg curl câble, Calf raise, Hammer curl | Crunch |
| C | Sumo DL BB | Traction serré | Rowing DB | Fente bulgare | Donkey kick câble, Row machine, Leg curl couché, Calf press, Curl câble | Relevé jambes |

Séries×Reps :
- Composés (4 par session) : 4×8-12, 90s
- Isolations (5 par session) : 3×10-15, 75s
- Warmup : 2×10 · Core : 3×15
- Total par session : **11 exercices** (warmup + 9 + core)

**Assertions**
- LP1 : lower_pull, jamais fullbody → **PASS** ✓
- LP4 : slot 1 = hamstrings/glutes composé → **PASS** ✓
- Split lower_pull×3 : **PASS** ✓
- Noms "Lower — Chaîne postérieure A/B/C" → **PASS** ✓
- Core en queue via corePool → **PASS** ✓
- FULL equipment : pool large, 3 sessions bien variées → **PASS** ✓

**Coach**
- Profil typique "femme fessiers + posture + gainage" : lower_pull idéal (deadlift + tractions + squat + isolations fessiers)
- Hip thrust (slot 4, fessiers isolation) : présent avec FULL ✓
- 3 séances de lower_pull par semaine pour un débutant : volume élevé pour le bas du dos (deadlift fréquent) — risque de sur-stimulation des érecteurs et des ischio-jambiers
- Timing : ~70 min réel vs 60 min déclarés
- Variété A/B/C : bonne grâce à usedGlobally + FULL
- **Verdict : ⚠️ Programme pertinent pour ce profil, timing légèrement serré, fréquence 3× deadlift-based à surveiller pour un débutant**

---

## P43 — legs + shoulders → lower_push (squat+press, haltérophile)

```
{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:BB+DB, level:'intermediate',
  focusMuscles:['legs','shoulders'] }
```

### Simulation

**Étape 1 — workoutTypeFromFocus(['legs','shoulders'])**
- hasLower=true, hasPush=true (shoulders), hasPull=false → hasUpper=true
- R6 : hasLower && hasPush && !hasPull → **true** → `'lower_push'`

**Étape 2 — selectSplit**
- focusType='lower_push' → répété 3 fois
- Split = `['lower_push','lower_push','lower_push']`

**Étape 3 — adjustedSlotCount**
- base=9, duration=60, goal=strength → max(4, ⌊9×0.5⌋) = max(4,4) = **4 slots**

**focusedMuscles** = legs ∪ shoulders = {quads, hamstrings, glutes, calves, shoulders, shoulders_front, shoulders_lateral, shoulders_rear}

**reorderSlotsByFocus** de lower_push :
- Composés ciblés : 0 (quads/glutes ✓), 2 (shoulders ✓), 3 (hamstrings/glutes ✓)
- Composés non ciblés : 1 (chest)
- Isolations ciblées : 4 (quads ✓), 5 (calves ✓), 7 (glutes ✓)
- Isolations non ciblées : 6 (chest iso), 8 (triceps)
- Résultat : [0, 2, 3, 1, 4, 5, 7, 6, 8]

**Slots retenus (4 premiers)** :
1. quads/glutes composé (squat)
2. shoulders/front composé (OHP)
3. hamstrings/glutes composé (RDL)
4. chest composé (bench — non ciblé mais 4e composé disponible)

**Étape 5 — Specs (strength, 60 min)**
Tous composés → 5×3-5, 180s (adjustedSpec 60min = pas de changement).

**Table des exercices — Lower — Squat & Press A/B/C**
| # | Slot | Muscle cible | Exercice générique | 5×3-5 |
|---|------|-------------|-------------------|-------|
| 0 | warmup | — | Mobilité articulaire | 2×10 |
| 1 | quads/glutes cmp | quad-fessiers | Squat BB | 5×3-5 |
| 2 | shoulders cmp | épaules | OHP BB | 5×3-5 |
| 3 | hamstrings/glutes cmp | ischio-fessiers | RDL BB | 5×3-5 |
| 4 | chest cmp | pectoraux | Bench press BB | 5×3-5 |
| 5 | core | abdos | Planche / Crunch | 3×15 |

Total : **6 exercices** par session (warmup + 4 slots + core)

**Assertions**
- LP2 : legs+push(!pull) → lower_push, jamais fullbody → **PASS** ✓ (R6 ligne 316)
- LP5 : lower_push squat-first, slot 1 = quads/glutes composé → **PASS** ✓
- OHP présent (slot 2 après reorder) → **PASS** ✓
- autoProgress=true (barbell) → **PASS** ✓
- Split lower_push×3 → **PASS** ✓
- Noms "Lower — Squat & Press A/B/C" → **PASS** ✓ (WORKOUT_NAMES['lower_push'])
- Warning UX-D spécialisation lower×3 → **PASS** ✓
- Warning UX-5 push sans pull → **PASS** ✓ (lower_push ∈ push sessions, aucune pull session)

**Coach**
- Pattern Wendler / haltérophile : squat + OHP + RDL + bench en force = classique et efficace ✓
- 4 composés force × 5 séries × (180s+30s) ≈ 70 min hors warmup/core → timing juste
- Absence de tirage (back) sur toute la semaine : UX-5 justifié, risque posture à terme
- Intermediate + BB+DB : progression lineaire réaliste ✓
- 3 sessions identiques en type : variation via usedGlobally (RDL vs DL, squat vs front squat, etc.)
- **Verdict : ⚠️ Programme force solide (squat+OHP+RDL+bench), timing limite à 60 min, déséquilibre push/pull à surveiller**

---

## P44 — legs + chest + shoulders → lower_push (push complet + jambes)

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:FULL, level:'beginner',
  focusMuscles:['legs','chest','shoulders'] }
```

### Simulation

**Étape 1 — workoutTypeFromFocus(['legs','chest','shoulders'])**
- hasLower=true, hasPush=true (chest+shoulders), hasPull=false → hasUpper=true
- R6 : hasLower && hasPush && !hasPull → **true** → `'lower_push'`

**Étape 2 — selectSplit**
- focusType='lower_push' → ['lower_push','lower_push']

**Étape 3 — adjustedSlotCount**
- 9 slots, 60 min, hypertrophy → **9 slots**

**focusedMuscles** = legs ∪ chest ∪ shoulders = {quads, hamstrings, glutes, calves, chest, chest_upper, chest_lower, shoulders, shoulders_front, shoulders_lateral, shoulders_rear}

**reorderSlotsByFocus** :
- Tous les slots sont ciblés sauf slot 8 (triceps)
- Résultat : [0,1,2,3,4,5,6,7, 8(triceps)]

**Table des exercices — Lower — Squat & Press A/B**
| # | Slot | Cat | Muscle cible | Exercice générique | Séries×Reps |
|---|------|-----|-------------|-------------------|-------------|
| 0 | warmup | — | — | Jumping jacks | 2×10 |
| 1 | quads/glutes | cmp | quad-fessiers | Squat BB | 4×8-12 |
| 2 | chest | cmp | pectoraux | Bench press BB | 4×8-12 |
| 3 | shoulders | cmp | épaules | OHP BB | 4×8-12 |
| 4 | hamstrings/glutes | cmp | ischio-fessiers | RDL BB | 4×8-12 |
| 5 | quads | iso | quadriceps | Leg extension machine | 3×10-15 |
| 6 | calves | iso | mollets | Calf raise machine | 3×10-15 |
| 7 | chest | iso | pectoraux | Cable fly | 3×10-15 |
| 8 | glutes | iso | fessiers | Hip thrust machine / câble | 3×10-15 |
| 9 | triceps | iso | triceps | Pushdown câble | 3×10-15 |
| 10 | core | — | abdos | Planche | 3×15 |

Total : **11 exercices** (warmup + 9 + core)

**Assertions**
- LP2 : lower_push → **PASS** ✓
- LP5 : slot 1 = quads/glutes composé → **PASS** ✓
- Split ['lower','lower'] → **PASS** ✓
- Noms "Lower — Squat & Press A/B" → **PASS** ✓
- Warning UX-D, UX-5 → **PASS** ✓

**Coach**
- Quads + pecs + épaules dans la même séance pour un débutant : surcharge cognitive et physique importante
- 4 composés (squat, bench, OHP, RDL) + 5 isolations = programme de niveau intermédiaire pour un beginner
- 9 slots × 60 min hypertrophie : timing estimé ~70 min
- Absence totale de tirage : déséquilibre musculaire (UX-5 ✓) — rhomboïdes, rotateurs sous-sollicités
- **Verdict : ❌ Trop dense pour un débutant (9 slots, 4 composés), déséquilibre push/pull structurel**

---

## P45 — chest + shoulders → push (push day complet, DB)

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:DB, level:'beginner',
  focusMuscles:['chest','shoulders'] }
```

### Simulation

**Étape 1 — workoutTypeFromFocus(['chest','shoulders'])**
- hasLower=false, hasPush=true, hasPull=false → hasUpper=true
- R3 : hasPush && !hasPull && !hasLower → **true** → `'push'`
- (PUSH_FULL : chest+shoulders → push, pas upper ✓)

**Étape 2 — selectSplit**
- focusType='push' → ['push','push','push']

**Étape 3 — adjustedSlotCount**
- base=6, 60 min, hypertrophy → **6 slots**

**focusedMuscles** = chest ∪ shoulders = {chest, chest_upper, chest_lower, shoulders, shoulders_front, shoulders_lateral, shoulders_rear}

**reorderSlotsByFocus** de SLOTS.push (après BUG-4 fix, 6 slots) :
| # orig | Muscle | Ciblé |
|--------|--------|-------|
| 0 | chest cmp | ✓ |
| 1 | shoulders cmp | ✓ |
| 2 | chest iso | ✓ |
| 3 | triceps iso | ✗ |
| 4 | shoulders_lateral iso | ✓ |
| 5 | shoulders_rear iso | ✓ ← BUG-4 fix |

Composés ciblés : [0,1] · Isolations ciblées : [2,4,5] · Isolations non ciblées : [3]
Résultat reorder : [0, 1, 2, 4, 5, 3]

Tous 6 slots retenus.

**Table des exercices — Push — Poussée A/B/C**
| # | Slot (ordre reorder) | Cat | Muscle | Exercice générique | Séries×Reps |
|---|---------------------|-----|--------|-------------------|-------------|
| 0 | warmup | — | — | Mobilité épaule / arm circles | 2×10 |
| 1 | chest cmp [orig 0] | cmp | pectoraux | DB bench press | 4×8-12 |
| 2 | shoulders cmp [orig 1] | cmp | épaules | DB overhead press | 4×8-12 |
| 3 | chest iso [orig 2] | iso | pectoraux | DB fly | 3×10-15 |
| 4 | shoulders_lat iso [orig 4] | iso | épaules lat. | DB lateral raise | 3×10-15 |
| 5 | shoulders_rear iso [orig 5] | iso | épaules arr. | DB rear delt fly | 3×10-15 |
| 6 | triceps iso [orig 3] | iso | triceps | DB triceps ext. | 3×10-15 |
| 7 | core | — | abdos | Crunch / planche | 3×15 |

Total : **8 exercices** (warmup + 6 + core)

**Assertions**
- PUSH_FULL : chest+shoulders → push (pas upper) → **PASS** ✓ (R3 avant R5)
- Split ['push'×3] → **PASS** ✓
- Noms "Push — Poussée A/B/C" → **PASS** ✓
- Chest ET shoulders couverts → **PASS** ✓
- BUG-4 : slot 6 (orig[5]) = shoulders_rear présent (face pull / rear delt fly DB) → **PASS** ✓
- DB only : OHP disponible (DB OHP) → **PASS** ✓
- Warning UX-D (push×3), UX-5 (push sans pull), UX-B (shoulders dans focus + push split) → **PASS** ✓

**Coach**
- DB push day : bench DB, OHP DB, fly, écarté latéral, rear delt → couverture chest+shoulders complète ✓
- BUG-4 fix : shoulders_rear (rear delt fly) améliore l'équilibre antérieur/postérieur de l'épaule ✓
- Timing : 2 cmps × 4×2.2 min + 4 iso × 3×2 min + warmup/core ≈ 46 min → confortable sous 60 min ✓
- Absence de tirage (dos, biceps) sur la semaine : UX-5 et UX-B pertinents
- 3 sessions push × débutant : variété limitée (pool DB restreint), sessions B et C proches de A
- **Verdict : ⚠️ Programme push DB bien équilibré (rear delt inclus), déséquilibre push/pull hebdomadaire**

---

## P46 — back + arms → pull (pull day complet)

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:BB+DB+CABLE, level:'intermediate',
  focusMuscles:['back','arms'] }
```

### Simulation

**Étape 1 — workoutTypeFromFocus(['back','arms'])**
- hasLower=false, hasPush=false, hasPull=true (back), hasArms=true → hasUpper=true
- R3 : hasPush && !hasPull && !hasLower → false
- R4 : hasPull && !hasPush && !hasLower → **true** → `'pull'`
- (PULL_FULL : back+arms → pull, pas upper ✓ ; R4 fire avant R5)

**Étape 2 — selectSplit**
- focusType='pull' → ['pull','pull','pull']

**Étape 3 — adjustedSlotCount**
- base=6, 60 min, hypertrophy → **6 slots**

**focusedMuscles** = back ∪ arms = {back, back_width, back_thickness, biceps, triceps, forearms}

**reorderSlotsByFocus** de SLOTS.pull :
| # | Muscle | Ciblé |
|---|--------|-------|
| 0 | back_width cmp | ✓ |
| 1 | back_thickness cmp | ✓ |
| 2 | back_thickness/width iso | ✓ |
| 3 | biceps iso | ✓ |
| 4 | shoulders_rear iso | ✗ |
| 5 | forearms iso | ✓ |

Résultat : [0, 1, 2, 3, 5, 4]

**Table des exercices — Pull — Tirage A/B/C**
| # | Slot (reorder) | Cat | Muscle | Exercice générique | Séries×Reps |
|---|---------------|-----|--------|-------------------|-------------|
| 0 | warmup | — | — | Bandes élastiques épaule | 2×10 |
| 1 | back_width cmp [0] | cmp | dos (largeur) | Lat pulldown câble | 4×8-12 |
| 2 | back_thickness cmp [1] | cmp | dos (épaisseur) | Seated cable row | 4×8-12 |
| 3 | back iso [2] | iso | dos | Straight-arm pulldown | 3×10-15 |
| 4 | biceps iso [3] | iso | biceps | Barbell curl | 3×10-15 |
| 5 | forearms iso [5] | iso | avant-bras | Wrist curl DB | 3×10-15 |
| 6 | shoulders_rear iso [4] | iso | épaules arr. | Face pull câble | 3×10-15 |
| 7 | core | — | abdos | Crunch | 3×15 |

Total : **8 exercices** (warmup + 6 + core)

Intermediate → selection random top-3 (exercices BB, DB, câble disponibles → bonne variété entre sessions A/B/C).

**Assertions**
- PULL_FULL : back+arms → pull (pas upper), R4 avant R5 → **PASS** ✓
- Split ['pull'×3] → **PASS** ✓
- Slots dos (back_width, back_thickness) ET biceps couverts → **PASS** ✓
- Triceps non couvert (arms focus, mais push absent) → **noter coach**
- Warning UX-D (pull×3 spécialisation) → **PASS** ✓

**Coach**
- Biceps : slot dédié isolation (slot 4) en plus des composés dos ✓
- Triceps (composante de 'arms') : ABSENT du template pull → l'utilisateur qui cible "bras" complets n'aura que les biceps couverts. Warning UX-D/UX-B ne le signale pas explicitement.
- BB+DB+CABLE : pool riche pour dos et bras ✓ ; 3 sessions pull distinctes facilement différenciées
- Face pull câble (slot shoulders_rear) : excellent pour la santé de l'épaule en pull day ✓
- Timing : 2 cmps + 4 iso ≈ 46 min → confortable ✓
- **Verdict : ⚠️ Bon pull day (dos + biceps couverts), triceps absent malgré focus 'arms' — information manquante pour l'utilisateur**

---

## P47 — chest + arms → push (push day avec bras)

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:DB, level:'beginner',
  focusMuscles:['chest','arms'] }
```

### Simulation

**Étape 1 — workoutTypeFromFocus(['chest','arms'])**
- hasLower=false, hasPush=true (chest), hasPull=false, hasArms=true → hasUpper=true
- R3 : hasPush && !hasPull && !hasLower → **true** → `'push'`
- (Rule 3 prime avant Rule 5 ; hasPush=true car chest)

**Étape 2 — selectSplit**
- focusType='push' → ['push','push']

**Étape 3 — adjustedSlotCount**
- base=6, 60 min, hypertrophy → **6 slots**

**focusedMuscles** = chest ∪ arms = {chest, chest_upper, chest_lower, biceps, triceps, forearms}

**reorderSlotsByFocus** :
| # | Muscle | Ciblé |
|---|--------|-------|
| 0 | chest cmp | ✓ |
| 1 | shoulders cmp | ✗ |
| 2 | chest iso | ✓ |
| 3 | triceps iso | ✓ |
| 4 | shoulders_lat iso | ✗ |
| 5 | shoulders_rear iso | ✗ |

Composés ciblés : [0] · Composés non ciblés : [1]
Isolations ciblées : [2, 3] · Isolations non ciblées : [4, 5]
Résultat : [0, 1, 2, 3, 4, 5]

Tous 6 slots retenus.

**Table des exercices — Push — Poussée A/B**
| # | Slot (reorder) | Cat | Muscle | Exercice générique | Séries×Reps |
|---|---------------|-----|--------|-------------------|-------------|
| 0 | warmup | — | — | Arm circles DB | 2×10 |
| 1 | chest cmp [0] | cmp | pectoraux | DB bench press | 4×8-12 |
| 2 | shoulders cmp [1] | cmp | épaules | DB OHP | 4×8-12 |
| 3 | chest iso [2] | iso | pectoraux | DB fly | 3×10-15 |
| 4 | triceps iso [3] | iso | triceps | DB triceps ext. | 3×10-15 |
| 5 | shoulders_lat iso [4] | iso | épaules lat. | DB lateral raise | 3×10-15 |
| 6 | shoulders_rear iso [5] | iso | épaules arr. | DB rear delt fly | 3×10-15 |
| 7 | core | — | abdos | Crunch | 3×15 |

Total : **8 exercices**

**Assertions**
- workoutTypeFromFocus → 'push' (R3 avant R5) → **PASS** ✓
- Split ['push','push'] → **PASS** ✓
- Triceps (arms) ET chest couverts → **PASS** ✓
- BUG-4 : slot 6 (orig[5]) = shoulders_rear → **PASS** ✓
- UX-1 (arms+push) : split all push ET focusMuscles includes 'arms' → UX-B fire : "Focus bras en push : le biceps n'est pas ciblé en séance push" → **PASS** ✓
- UX-5 : hasPushSession=true, hasPullSession=false → warning push/pull imbalance → **PASS** ✓
- UX-D : push×2 spécialisation → **PASS** ✓

**Coach**
- Chest + triceps (synergistes push) : cohérence musculaire ✓
- Biceps ABSENT : UX-1 warning pertinent — utilisateur ciblant "bras" n'aura que triceps ✓
- BUG-4 : rear delt fly inclus → équilibre épaule meilleur ✓
- DB only + beginner : bench DB, fly DB, extension DB, écarté → exercices techniques mais accessibles
- Timing : 2 cmps + 4 iso ≈ 46 min ✓
- **Verdict : ⚠️ Synergisme push correct (chest+tris), biceps absent malgré focus arms (warning UX-1 approprié)**

---

## P48 — shoulders + back → upper (mixte haut du corps)

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:FULL, level:'beginner',
  focusMuscles:['shoulders','back'] }
```

### Simulation

**Étape 1 — workoutTypeFromFocus(['shoulders','back'])**
- hasLower=false, hasPush=true (shoulders), hasPull=true (back) → hasUpper=true
- R3 : hasPush && !hasPull → false (hasPull=true)
- R4 : hasPull && !hasPush → false (hasPush=true)
- R5 : hasUpper && !hasLower → **true** → `'upper'`

**Étape 2 — selectSplit**
- focusType='upper' → alternance upper-push / upper-pull
- Split = ['upper-push', 'upper-pull']
- Types publics = ['upper', 'upper']

**Étape 3 — adjustedSlotCount**
- upper-push : 8 slots, 60 min, hypertrophy → **8 slots**
- upper-pull : 8 slots → **8 slots**

**focusedMuscles** = shoulders ∪ back = {shoulders, shoulders_front, shoulders_lateral, shoulders_rear, back, back_width, back_thickness}

**reorderSlotsByFocus — upper-push (8 slots) :**
| # | Muscle | Ciblé |
|---|--------|-------|
| 0 | chest/chest_upper cmp | ✗ |
| 1 | back_width/thickness/back cmp | ✓ |
| 2 | shoulders/front cmp | ✓ |
| 3 | chest iso (fly) | ✗ |
| 4 | triceps iso | ✗ |
| 5 | shoulders_lat iso | ✓ |
| 6 | biceps iso | ✗ |
| 7 | back_thickness iso | ✓ |

Composés ciblés : [1,2] · Composés non ciblés : [0]
Isolations ciblées : [5,7] · Isolations non ciblées : [3,4,6]
Résultat : [1, 2, 0, 5, 7, 3, 4, 6]

**reorderSlotsByFocus — upper-pull (8 slots) :**
| # | Muscle | Ciblé |
|---|--------|-------|
| 0 | back_width/back cmp | ✓ |
| 1 | back_thickness/back cmp | ✓ |
| 2 | chest cmp | ✗ |
| 3 | shoulders_rear iso | ✓ |
| 4 | biceps iso | ✗ |
| 5 | back_thickness iso | ✓ |
| 6 | triceps iso | ✗ |
| 7 | shoulders_lat iso | ✓ |

Composés ciblés : [0,1] · Composés non ciblés : [2]
Isolations ciblées : [3,5,7] · Isolations non ciblées : [4,6]
Résultat : [0, 1, 2, 3, 5, 7, 4, 6]

**Table des exercices**

Upper — Haut du corps A (upper-push, reorder [1,2,0,5,7,3,4,6]) :
| # | Slot | Cat | Muscle | Exercice générique | Séries×Reps |
|---|------|-----|--------|-------------------|-------------|
| 0 | warmup | — | — | Band pull-apart | 2×10 |
| 1 | back cmp [orig 1] | cmp | dos | Lat pulldown câble | 4×8-12 |
| 2 | shoulders cmp [orig 2] | cmp | épaules | OHP BB | 4×8-12 |
| 3 | chest cmp [orig 0] | cmp | pectoraux | Bench press BB | 4×8-12 |
| 4 | shoulders_lat iso [orig 5] | iso | épaules lat. | DB lateral raise | 3×10-15 |
| 5 | back iso [orig 7] | iso | dos | DB row unilatéral | 3×10-15 |
| 6 | chest iso [orig 3] | iso | pectoraux | Cable fly | 3×10-15 |
| 7 | triceps iso [orig 4] | iso | triceps | Pushdown câble | 3×10-15 |
| 8 | biceps iso [orig 6] | iso | biceps | Barbell curl | 3×10-15 |
| 9 | core | — | abdos | Planche | 3×15 |

Upper — Haut du corps B (upper-pull, reorder [0,1,2,3,5,7,4,6]) :
| # | Slot | Cat | Muscle | Exercice générique | Séries×Reps |
|---|------|-----|--------|-------------------|-------------|
| 0 | warmup | — | — | Rotation épaule | 2×10 |
| 1 | back_width cmp [0] | cmp | dos (larg.) | Tractions BB | 4×8-12 |
| 2 | back_thickness cmp [1] | cmp | dos (ép.) | Rowing BB | 4×8-12 |
| 3 | chest cmp [2] | cmp | pectoraux | DB incline bench | 4×8-12 |
| 4 | shoulders_rear iso [3] | iso | épaules arr. | Face pull câble | 3×10-15 |
| 5 | back iso [5] | iso | dos | Straight-arm pulldown | 3×10-15 |
| 6 | shoulders_lat iso [7] | iso | épaules lat. | DB lateral raise | 3×10-15 |
| 7 | biceps iso [4] | iso | biceps | Hammer curl DB | 3×10-15 |
| 8 | triceps iso [6] | iso | triceps | DB overhead ext. | 3×10-15 |
| 9 | core | — | abdos | Crunch | 3×15 |

Total : **10 exercices** par session (warmup + 8 + core)

**Assertions**
- workoutTypeFromFocus → 'upper' (R5) → **PASS** ✓
- Split = ['upper-push','upper-pull'] (public ['upper','upper']) → **PASS** ✓
- Noms "Upper — Haut du corps A/B" → **PASS** ✓
- Épaules couvertes dans upper-push (OHP, écarté lat) ET upper-pull (rear delt, écarté lat) → **PASS** ✓
- UX-D : publicTypes={'upper'}, t='upper' → NOT in push/pull/lower list → pas de warning spécialisation → **PASS** ✓ (comportement correct)
- UX-5 : hasPushSession=true (upper-push) ET hasPullSession=true (upper-pull) → pas de warning → **PASS** ✓

**Coach**
- Épaules bien représentées : OHP (A, slot 2), écarté lat (A+B), rear delt (B, slot 4) ✓
- Dos en tête dans les deux sessions (back prioritaire via reorder) → bon signal focus ✓
- upper A/B : variété structurelle réelle (chest-first A vs back-first B) ✓
- 8 slots × hypertrophie 60 min : 3 cmps × 4 séries + 5 iso × 3 séries ≈ 57 min → légèrement tendu
- Meilleur split pour ce focus : oui, upper A/B équilibre push/pull à chaque semaine ✓
- **Verdict : ✅ Programme upper équilibré, épaules bien couvertes A+B, structure A/B différenciée**

---

## P49 — fat_loss 4j intermediate (gap auto-split)

```
{ goal:'fat_loss', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'intermediate' }
```

### Simulation

**Étape 1 — workoutTypeFromFocus([])**
- focusMuscles vide → return **null**

**Étape 2 — selectSplit**
- isMass = false (fat_loss) · level = intermediate (≠ beginner)
- case 4 → `if (isMass)` = false · `if (level !== 'beginner')` = true
- → `['push', 'pull', 'lower-quad', 'fullbody-quad']`

Split = `['push', 'pull', 'lower-quad', 'fullbody-quad']`

**Étape 3 — adjustedSlotCount par session**
| Session | Template | Base | 60min fat_loss | Slots |
|---------|----------|------|---------------|-------|
| push | push | 6 | base=6 | **6** |
| pull | pull | 6 | base=6 | **6** |
| lower-quad | lower-quad | 6 | base=6 | **6** |
| fullbody-quad | fullbody-quad | 9 | base=9 | **9** |

**Table des exercices**

Push — Poussée :
| # | Slot | Cat | Muscle | Exercice | Séries×Reps |
|---|------|-----|--------|----------|-------------|
| 0 | warmup | — | — | Jumping jacks | 2×10 |
| 1 | chest cmp | cmp | pectoraux | Bench press | 3×12-15 |
| 2 | shoulders cmp | cmp | épaules | OHP | 3×12-15 |
| 3 | chest iso | iso | pectoraux | Cable fly | 3×12-15 |
| 4 | triceps iso | iso | triceps | Pushdown | 3×12-15 |
| 5 | shoulders_lat iso | iso | épaules | Écarté latéral | 3×12-15 |
| 6 | shoulders_rear iso | iso | épaules arr. | Face pull | 3×12-15 |
| 7 | core | — | abdos | Planche | 3×15 |

Pull — Tirage (idem structure, muscles dos/biceps) :
| # | Slot | Séries×Reps |
|---|------|-------------|
| 0-7 | warmup + 2cmp (dos) + 4iso (dos/biceps/forearms/rear) + core | 3×12-15 |

Lower — Bas du corps (lower-quad, 6 slots) :
| # | Slot | Séries×Reps |
|---|------|-------------|
| 0-7 | warmup + squat(cmp)+RDL(cmp) + 4iso(quads/glutes/hamstrings/calves) + core | 3×12-15 |

Full Body (fullbody-quad, 9 slots) :
| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0-10 | warmup + 4cmp(squat/bench/row/OHP) + 5iso(hamstrings/rear/bis/calves/tris) + core | 3×12-15 |

Total exercices : push=8, pull=8, lower=8, fullbody=11

**Naming** (chaque type apparaît 1× → pas de suffixe A/B) :
"Push — Poussée", "Pull — Tirage", "Lower — Bas du corps", "Full Body"

**Assertions**
- isMass=false + intermediate + 4j → ['push','pull','lower-quad','fullbody-quad'] → **PASS** ✓
- PAS upper/lower (isMass requis pour upper-push/lower-quad/upper-pull/lower-hip) → **PASS** ✓
- UX-D : publicTypes = {push, pull, lower, fullbody}, size=4 → pas de warning spécialisation → **PASS** ✓
- UX-5 : hasPushSession=true, hasPullSession=true → pas de warning → **PASS** ✓

**Coach**
- fat_loss 4j : push/pull/lower/fullbody = couverture corps entier ✓
- Repos 60s entre séries : circuit-style, adapté fat_loss ✓
- 4 séances semaine : fréquence correcte, muscles touchés 1-2× par semaine
- Fullbody 9 slots avec fat_loss : timing ~65 min → légèrement serré
- Bonne structure : pas de sur-spécialisation, équilibre push/pull ✓
- **Verdict : ✅ Structure adaptée fat_loss, mix push/pull/legs/fullbody bien équilibré**

---

## P50 — strength 2j advanced (cas spécial BUG-1)

```
{ goal:'strength', daysPerWeek:2, sessionDuration:90, equipment:FULL, level:'advanced' }
```

### Simulation

**Étape 1 — workoutTypeFromFocus([])**
- focusMuscles vide → null

**Étape 2 — selectSplit**
- case 2 → toujours `['fullbody-quad', 'fullbody-hip']` (ligne 350, indépendant du niveau)
- Split = `['fullbody-quad', 'fullbody-hip']`

**Étape 3 — adjustedSlotCount (BUG-1)**
- fullbody-quad : base=9, 90 min, strength → **min(9, 5) = 5 slots** (BUG-1 fix)
- fullbody-hip : base=9, 90 min, strength → **min(9, 5) = 5 slots** (BUG-1 fix)

> ⚠️ **Le prompt v3 indiquait 9 slots → 11 exercices. Après le fix BUG-1 (commit a9407ac), c'est 5 slots → 7 exercices.**

**Slots retenus** (pas de focusMuscles → reorder = identité) :

fullbody-quad, 5 premiers slots :
| # | Slot | Cat |
|---|------|-----|
| 0 | quads/glutes | cmp |
| 1 | chest/chest_upper | cmp |
| 2 | back_width/thickness/back | cmp |
| 3 | shoulders/front | cmp |
| 4 | hamstrings | iso |

fullbody-hip, 5 premiers slots :
| # | Slot | Cat |
|---|------|-----|
| 0 | hamstrings/glutes | cmp |
| 1 | chest/chest_upper | cmp |
| 2 | back_width/back | cmp |
| 3 | shoulders/front | cmp |
| 4 | quads | iso |

**Table des exercices**

Full Body A (fullbody-quad) :
| # | Slot | Cat | Muscle | Exercice générique | Séries×Reps |
|---|------|-----|--------|-------------------|-------------|
| 0 | warmup | — | — | Mobilité dynamique | 2×10 |
| 1 | quads/glutes cmp | cmp | quad-fessiers | Squat BB | 5×3-5 |
| 2 | chest cmp | cmp | pectoraux | Bench press BB | 5×3-5 |
| 3 | back cmp | cmp | dos | Bent-over row BB | 5×3-5 |
| 4 | shoulders cmp | cmp | épaules | OHP BB | 5×3-5 |
| 5 | hamstrings iso | iso | ischio | Leg curl machine | 3×5-8 |
| 6 | core | — | abdos | Planche lestée | 3×15 |

Full Body B (fullbody-hip) :
| # | Slot | Cat | Muscle | Exercice générique | Séries×Reps |
|---|------|-----|--------|-------------------|-------------|
| 0 | warmup | — | — | Rotation articulaire | 2×10 |
| 1 | hamstrings/glutes cmp | cmp | ischio-fessiers | Deadlift BB | 5×3-5 |
| 2 | chest cmp | cmp | pectoraux | Bench press BB (incliné ou plat) | 5×3-5 |
| 3 | back cmp | cmp | dos | Traction lestée | 5×3-5 |
| 4 | shoulders cmp | cmp | épaules | OHP BB | 5×3-5 |
| 5 | quads iso | iso | quadriceps | Leg extension | 3×5-8 |
| 6 | core | — | abdos | Ab wheel | 3×15 |

**Total : 7 exercices par session** (warmup + 5 + core)

Timing estimé A : 4 cmps × 5 séries × ~4 min + 1 iso × 3 séries × ~3.5 min + warmup/core ≈ 80+10+5 ≈ **88 min**. Le cap à 5 slots est cohérent avec 90 min force.

**Assertions**
- 2j = fullbody toujours (advanced ne change pas la rule case 2) → **PASS** ✓
- Split = ['fullbody-quad','fullbody-hip'] → **PASS** ✓
- adjustedSlotCount(9, 90, 'strength') = min(9,5) = **5** (BUG-1 fix) → **PASS** ✓
- Total = 7 exercices (pas 11 comme l'ancien prompt v3) → **PASS — BUG-1 fix confirmé** ✓
- UX-C : strength && level=advanced → pas de warning beginner → **PASS** ✓

**Coach**
- 5 exercices de force pour un advanced en 90 min : adapté (4 gros composés + 1 isolation)
- Timing réel ≈ 85-90 min avec 3 min de repos : correspondance excellente avec le créneau ✓
- Squat + Bench + Row + OHP par session = 4 piliers du programme de force ✓
- Advanced sur fullbody 2j : acceptable pour maintien ou après une blessure, mais sous-optimal pour la progression max (fréquence trop basse par groupe musculaire)
- **Verdict : ✅ Programme force cohérent après BUG-1 fix, 7 ex. / 90 min correspondance réaliste**

---

## P51 — endurance 5j advanced (gap niveau advanced + fréquence élevée)

```
{ goal:'endurance', daysPerWeek:5, sessionDuration:60, equipment:FULL, level:'advanced' }
```

### Simulation

**Étape 1 — workoutTypeFromFocus([])**
- null

**Étape 2 — selectSplit**
- isMass=false (endurance), level=advanced (≠ beginner)
- case 5 → `if (isMass && level !== 'beginner')` = false · `if (isMass)` = false · `if (level !== 'beginner')` = true
- → `['push', 'pull', 'lower-quad', 'lower-hip', 'fullbody-quad']`

Split = `['push', 'pull', 'lower-quad', 'lower-hip', 'fullbody-quad']`

**Étape 3 — adjustedSlotCount**
| Session | Base | 60min endurance |
|---------|------|----------------|
| push | 6 | **6** |
| pull | 6 | **6** |
| lower-quad | 6 | **6** |
| lower-hip | 6 | **6** |
| fullbody-quad | 9 | **9** |

**Specs (endurance, 60 min)** : composés 3×15-20 60s · isolations 3×15-20 45s

**Naming** :
- push=1, pull=1 → pas de suffixe
- lower-quad et lower-hip → public 'lower' × 2 → suffixe A/B
- fullbody-quad → 'fullbody' × 1 → pas de suffixe

Noms : "Push — Poussée", "Pull — Tirage", "Lower — Bas du corps A", "Lower — Bas du corps B", "Full Body"

**Assertions**
- isMass=false + advanced + 5j → ['push','pull','lower-quad','lower-hip','fullbody-quad'] → **PASS** ✓
- Pas de crash, split cohérent → **PASS** ✓
- UX-D : multiple types → pas de warning spécialisation → **PASS** ✓

**Coach**
- 5 sessions semaine endurance : bon équilibre push/pull/legs×2/fullbody
- Chaque groupe musculaire stimulé 2-3× par semaine → volume endurance adapté ✓
- Repos 45-60s entre séries : circuit-style, cardio-vasculaire efficace ✓
- Advanced : sélection random top-3, bonne variété d'exercices ✓
- Fullbody 9 slots endurance : 3×15-20 sur 9 slots ≈ 9 × 3 × (45s+30s) ≈ 68 min → légèrement tendu mais endurance = moins de repos donc plus proche de 60 min que hypertrophie
- **Verdict : ✅ Split 5j endurance advanced bien structuré, volume hebdomadaire approprié**

---

## P52 — legs + back + chest → null → fullbody (ambiguïté totale)

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner',
  focusMuscles:['legs','back','chest'] }
```

### Simulation

**Étape 1 — workoutTypeFromFocus(['legs','back','chest'])**
- hasLower=true (legs), hasPush=true (chest), hasPull=true (back) → hasUpper=true
- R1 : hasLower && !hasUpper → false
- R6 : hasLower && hasPush && !hasPull → false (hasPull=true)
- R7 : hasLower && hasPull && !hasPush → false (hasPush=true)
- → **null** (ambiguïté totale, R∞)

**Étape 2 — selectSplit**
- focusType=null → split par défaut
- isMass=true (hypertrophy) · level=beginner
- case 3 → `if (isMass && level !== 'beginner')` = false → else
- → `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`

Split = `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`

**JAMAIS lower_pull, lower_push** (R6 et R7 échouent toutes deux) → **LP3 PASS** ✓

**Étape 3 — adjustedSlotCount**
- 9 slots, 60 min, hypertrophy → **9 slots**

**Table des exercices — Full Body A/B/C**

Full Body A (fullbody-quad) — focusedMuscles = {quads, hamstrings, glutes, calves, back, back_width, back_thickness, chest, chest_upper, chest_lower}
Tous les slots sont ciblés ou quasi → ordre naturel non perturbé.

| # | Slot | Cat | Muscle | Exercice | Séries×Reps |
|---|------|-----|--------|----------|-------------|
| 0 | warmup | — | — | Jumping jacks | 2×10 |
| 1 | quads/glutes cmp | cmp | quad-fessiers | Squat BB | 4×8-12 |
| 2 | chest cmp | cmp | pectoraux | Bench press | 4×8-12 |
| 3 | back cmp | cmp | dos | Lat pulldown | 4×8-12 |
| 4 | shoulders cmp | cmp | épaules | OHP BB | 4×8-12 |
| 5 | hamstrings iso | iso | ischio | Leg curl | 3×10-15 |
| 6 | shoulders_rear iso | iso | épaules arr. | Face pull | 3×10-15 |
| 7 | biceps iso | iso | biceps | Barbell curl | 3×10-15 |
| 8 | calves iso | iso | mollets | Calf raise | 3×10-15 |
| 9 | triceps iso | iso | triceps | Pushdown | 3×10-15 |
| 10 | core | — | abdos | Planche | 3×15 |

Full Body B (fullbody-hip) : structure similaire avec deadlift/RDL en tête (slot 0 hamstrings/glutes), variations d'exercices via usedGlobally.

**Assertions**
- LP3 : workoutTypeFromFocus → null → split par défaut fullbody×3 → **PASS** ✓
- JAMAIS lower_pull ou lower_push → **PASS** ✓
- Split = ['fullbody-quad','fullbody-hip','fullbody-quad'] → **PASS** ✓
- UX-6 "Sélection complète" : hasFocusLower=true, hasFocusPush=true, hasFocusPull=true → warning fires → **PASS** ✓

**Coach**
- Fullbody beginner hypertrophie : adapté ✓ (pas de PPL pour débutant)
- UX-6 warning explique le "pourquoi fullbody" malgré le focus complet → bonne UX ✓
- 9 slots beginner : timing ~70 min → légèrement serré
- **Verdict : ✅ Comportement correct (null→fullbody), LP3 validé, warning UX-6 pertinent**

---

## P53 — arms seul → upper (cas surprenant mais documenté)

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:DB, level:'beginner',
  focusMuscles:['arms'] }
```

### Simulation

**Étape 1 — workoutTypeFromFocus(['arms'])**
- hasLower=false, hasPush=false, hasPull=false, hasArms=true → hasUpper=true
- R1 : hasLower && !hasUpper → false
- R3 : hasPush && !hasPull && !hasLower → false (hasPush=false)
- R4 : hasPull && !hasPush && !hasLower → false (hasPull=false)
- R5 : hasUpper && !hasLower → **true** → `'upper'`
- (ARMS : arms seul → upper, rule 5 avant rule 3/4 ne s'applique pas — rule 3 et 4 ne matchent pas car push=false et pull=false)

**Étape 2 — selectSplit**
- focusType='upper' → alternance upper-push/upper-pull
- Split = ['upper-push', 'upper-pull']

**Étape 3 — adjustedSlotCount**
- 8 slots chacun, 60 min, hypertrophy → **8 slots**

**focusedMuscles** = arms = {biceps, triceps, forearms}

**reorderSlotsByFocus — upper-push :**
| # | Muscle ciblé | Ciblé |
|---|-------------|-------|
| 0 | chest cmp | ✗ |
| 1 | back cmp | ✗ |
| 2 | shoulders cmp | ✗ |
| 3 | chest iso (fly) | ✗ |
| 4 | triceps iso | ✓ |
| 5 | shoulders_lat iso | ✗ |
| 6 | biceps iso | ✓ |
| 7 | back iso | ✗ |

Composés : [0,1,2] (aucun ciblé → ordre conservé)
Isolations ciblées : [4,6] · Non ciblées : [3,5,7]
Résultat : [0, 1, 2, 4, 6, 3, 5, 7]

**reorderSlotsByFocus — upper-pull :**
| # | Muscle | Ciblé |
|---|--------|-------|
| 0 | back_width cmp | ✗ |
| 1 | back_thickness cmp | ✗ |
| 2 | chest cmp | ✗ |
| 3 | shoulders_rear iso | ✗ |
| 4 | biceps iso | ✓ |
| 5 | back iso | ✗ |
| 6 | triceps iso | ✓ |
| 7 | shoulders_lat iso | ✗ |

Résultat : [0, 1, 2, 4, 6, 3, 5, 7]

**Table des exercices**

Upper — Haut du corps A (upper-push) :
| # | Slot | Cat | Muscle | Exercice (DB only) | Séries×Reps |
|---|------|-----|--------|-------------------|-------------|
| 0 | warmup | — | — | Arm circles | 2×10 |
| 1 | chest cmp [0] | cmp | pectoraux | DB bench press | 4×8-12 |
| 2 | back cmp [1] | cmp | dos | DB row | 4×8-12 |
| 3 | shoulders cmp [2] | cmp | épaules | DB OHP | 4×8-12 |
| 4 | triceps iso [4] | iso | triceps | DB triceps ext. | 3×10-15 |
| 5 | biceps iso [6] | iso | biceps | DB curl | 3×10-15 |
| 6 | chest iso [3] | iso | pectoraux | DB fly | 3×10-15 |
| 7 | shoulders_lat iso [5] | iso | épaules | DB lateral raise | 3×10-15 |
| 8 | back iso [7] | iso | dos | DB pullover | 3×10-15 |
| 9 | core | — | abdos | Crunch | 3×15 |

Upper — Haut du corps B (upper-pull) : structure similaire (back composés en tête, biceps+triceps iso prioritaires).

**Assertions**
- ARMS : arms seul → upper (R5) → **PASS** ✓
- Split = ['upper-push','upper-pull'] → **PASS** ✓
- Biceps iso PRÉSENT dans upper-push (slot 5) et upper-pull (slot 4) → **PASS** ✓
- Triceps iso PRÉSENT dans upper-push (slot 4) et upper-pull (slot 6) → **PASS** ✓
- UX-6 "arms seul" branch fires : "Focus bras : 'arms' seul génère un programme haut du corps complet..." → **PASS** ✓
- UX-D : publicTypes={'upper'}, t='upper' → NOT in push/pull/lower → pas de warning spécialisation → **PASS** ✓

**Coach**
- Utilisateur ciblant "bras" reçoit bench press et rowing : UX-6 warning essentiel pour expliquer ✓
- Biceps ET triceps couverts dans les deux sessions → couverture bras complète ✓
- DB only : bench DB, row DB, OHP DB, curl DB, ext DB → viable ✓
- 3 composés (chest, back, shoulders) + 5 isolations (dont tris+bis) : programme complet
- **Verdict : ⚠️ Comportement logique (arms→upper complet), le warning UX-6 est essentiel pour la compréhension utilisateur**

---

## P54 — chest + back + shoulders + arms → upper (haut du corps complet sans jambes)

```
{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'intermediate',
  focusMuscles:['chest','back','shoulders','arms'] }
```

### Simulation

**Étape 1 — workoutTypeFromFocus(['chest','back','shoulders','arms'])**
- hasLower=false, hasPush=true (chest+shoulders), hasPull=true (back), hasArms=true → hasUpper=true
- R5 : hasUpper && !hasLower → **true** → `'upper'`

**Étape 2 — selectSplit**
- focusType='upper' → alternance upper-push/upper-pull sur 4 jours
- `Array.from({length:4}, (_, i) => i%2===0 ? 'upper-push' : 'upper-pull')`
- Split = ['upper-push', 'upper-pull', 'upper-push', 'upper-pull']
- Types publics = ['upper','upper','upper','upper']

**Étape 3 — adjustedSlotCount**
- 8 slots, 60 min, hypertrophy → **8 slots** (chaque session)

**focusedMuscles** = chest ∪ back ∪ shoulders ∪ arms = pratiquement tout le haut du corps (tous slots upper-push et upper-pull ciblés)

Comme tous les muscles du haut du corps sont dans le focus, le reorderSlotsByFocus ne change pas l'ordre (tout est ciblé) → slots dans l'ordre naturel des templates.

**Table des exercices**

Upper A (upper-push, 8 slots) :
| # | Slot | Muscle | Séries×Reps |
|---|------|--------|-------------|
| 0 | warmup | — | 2×10 |
| 1 | chest cmp | pectoraux | 4×8-12 |
| 2 | back cmp | dos | 4×8-12 |
| 3 | shoulders cmp (OHP) | épaules | 4×8-12 |
| 4 | chest iso (fly) | pectoraux | 3×10-15 |
| 5 | triceps iso | triceps | 3×10-15 |
| 6 | shoulders_lat iso | épaules lat. | 3×10-15 |
| 7 | biceps iso | biceps | 3×10-15 |
| 8 | back iso | dos | 3×10-15 |
| 9 | core | abdos | 3×15 |

Upper B (upper-pull, 8 slots) :
| # | Slot | Muscle | Séries×Reps |
|---|------|--------|-------------|
| 0 | warmup | — | 2×10 |
| 1 | back_width cmp | dos (larg.) | 4×8-12 |
| 2 | back_thickness cmp | dos (ép.) | 4×8-12 |
| 3 | chest cmp | pectoraux | 4×8-12 |
| 4 | shoulders_rear iso | épaules arr. | 3×10-15 |
| 5 | biceps iso | biceps | 3×10-15 |
| 6 | back iso | dos | 3×10-15 |
| 7 | triceps iso | triceps | 3×10-15 |
| 8 | shoulders_lat iso | épaules lat. | 3×10-15 |
| 9 | core | abdos | 3×15 |

Sessions C et D : mêmes types (upper-push C, upper-pull D) avec variation via usedGlobally.

Total : **10 exercices** par session (warmup + 8 + core)

**BUG-4 note :** P54 utilise les templates upper-push et upper-pull (pas SLOTS.push). Le BUG-4 (push[5]=shoulders_rear) ne s'applique pas à ces templates. Dans upper-pull, shoulders_rear est au slot[3] (natif) ✓ ; dans upper-push, pas de slot shoulders_rear explicite (mais upper-pull B le couvre).

**Assertions**
- workoutTypeFromFocus → 'upper' (R5) → **PASS** ✓
- Split 4j = ['upper-push','upper-pull','upper-push','upper-pull'] → **PASS** ✓
- Types internes alternés (push/pull/push/pull) → **PASS** ✓
- Noms "Upper — Haut du corps A/B/C/D" → **PASS** ✓
- BUG-4 : N/A pour upper templates (pas SLOTS.push) → **N/A**
- UX-D : publicTypes={'upper'} → t='upper' → NOT in push/pull/lower → pas de warning → **PASS** ✓
- UX-5 : hasPushSession (upper-push) ET hasPullSession (upper-pull) → pas de warning → **PASS** ✓

**Coach**
- Programme haut du corps 4j intermediate : haute fréquence
- Chaque muscle haut du corps stimulé 2× par semaine (upper-push A+C, upper-pull B+D) → adapté intermediate ✓
- Variété structurelle A/B (bench-first vs row-first) + usedGlobally pour C/D → bonne diversité ✓
- Aucune séance jambes sur toute la semaine : déséquilibre majeur si pratiqué longtemps (> 4-6 semaines)
- Timing : 3 cmps × 4×2.2 + 5 iso × 3×2 + warmup/core ≈ 57 min → dans les clous ✓
- **Verdict : ⚠️ Haut du corps bien structuré pour un bloc spécialisation, absence totale de jambes problématique à long terme**

---

## P55 — focusMuscles + selectedDays custom (override jours + focus)

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner',
  focusMuscles:['legs','back'], selectedDays:['tuesday','thursday','saturday'] }
```

### Simulation

**Étape 1 — workoutTypeFromFocus(['legs','back'])**
- Identique à P41 : R7 → **'lower_pull'**

**Étape 2 — selectSplit**
- focusType='lower_pull' → ['lower_pull','lower_pull','lower_pull']

**Étape 3 — adjustedSlotCount**
- 9 slots, 60 min, hypertrophy → **9 slots**

**Jours (selectedDays)**
```typescript
(selectedDays && selectedDays.length === daysPerWeek)
  ? selectedDays
  : DAY_ASSIGNMENTS[daysPerWeek]
```
- selectedDays=['tuesday','thursday','saturday'], length=3=daysPerWeek → **selectedDays utilisé**
- days = ['tuesday','thursday','saturday']

**weekMap :**
- tuesday → Lower — Chaîne postérieure A
- thursday → Lower — Chaîne postérieure B
- saturday → Lower — Chaîne postérieure C

**Table des exercices**

Identique à P42 (même type, même équipement FULL, même nombre de slots). 3 sessions lower_pull A/B/C, 11 exercices chacune.

**Assertions**
- selectedDays respectés dans weekMap → **PASS** ✓ (ligne 754)
- Split = lower_pull×3 → **PASS** ✓
- Noms "Lower — Chaîne postérieure A/B/C" → **PASS** ✓
- LP1 : lower_pull jamais fullbody → **PASS** ✓
- Jours : tuesday, thursday, saturday (pas monday, wednesday, friday) → **PASS** ✓

**Coach**
- Mardi/Jeudi/Samedi : espacement de 2 jours entre chaque séance → récupération correcte ✓
- Lower_pull 3× par semaine pour un débutant : volume élevé pour les ischio-jambiers et érecteurs (deadlift-based). Risque de sur-stimulation/fatigue lombaire.
- Programme identique à P42 en termes de contenu
- **Verdict : ⚠️ selectedDays correctement appliqués, fréquence deadlift-based 3×/semaine à surveiller pour un débutant**

---

## P56 — lower_push + BW only (squat+press sans équipement)

```
{ goal:'endurance', daysPerWeek:2, sessionDuration:45, equipment:BW, level:'beginner',
  focusMuscles:['legs','shoulders'] }
```

### Simulation

**Étape 1 — workoutTypeFromFocus(['legs','shoulders'])**
- hasLower=true, hasPush=true (shoulders), hasPull=false → hasUpper=true
- R6 : hasLower && hasPush && !hasPull → **true** → `'lower_push'`

**Étape 2 — selectSplit**
- focusType='lower_push' → ['lower_push','lower_push']

**Étape 3 — adjustedSlotCount**
- base=9, 45 min, endurance (non-strength) → max(3, ⌊9×0.75⌋) = max(3, 6) = **6 slots** ✓

**focusedMuscles** = legs ∪ shoulders = {quads, hamstrings, glutes, calves, shoulders, shoulders_front, shoulders_lateral, shoulders_rear}

**reorderSlotsByFocus de lower_push :**
| # | Muscle | Ciblé |
|---|--------|-------|
| 0 | quads/glutes cmp | ✓ |
| 1 | chest cmp | ✗ |
| 2 | shoulders cmp | ✓ |
| 3 | hamstrings/glutes cmp | ✓ |
| 4 | quads iso | ✓ |
| 5 | calves iso | ✓ |
| 6 | chest iso | ✗ |
| 7 | glutes iso | ✓ |
| 8 | triceps iso | ✗ |

Composés ciblés : [0, 2, 3] · Non ciblés : [1]
Isolations ciblées : [4, 5, 7] · Non ciblées : [6, 8]
Résultat : [0, 2, 3, 1, 4, 5, 7, 6, 8]

**6 slots retenus** : [0 (quads/glutes cmp), 2 (shoulders cmp), 3 (hamstrings/glutes cmp), 1 (chest cmp), 4 (quads iso), 5 (calves iso)]

**Specs (endurance, 45 min)** :
adjustedSpec pour 45 min : factor=0.75
- Composés : max(2, ⌊3×0.75⌋) = max(2, 2) = **2 séries**, 15-20 reps, 60s
- Isolations : max(2, ⌊3×0.75⌋) = **2 séries**, 15-20 reps, 45s

Warmup : 2×10 (45 min → pas "très court" ≤20 min → WARMUP_SPEC normal)
Core : 3×15 (45 min > 20 min → core présent)

**Table des exercices — Lower — Squat & Press A/B**
| # | Slot (reorder) | Cat | Muscle | Exercice BW | Séries×Reps |
|---|---------------|-----|--------|------------|-------------|
| 0 | warmup | — | — | Jumping jacks | 2×10 |
| 1 | quads/glutes cmp [0] | cmp | quad-fessiers | Bodyweight squat | 2×15-20 |
| 2 | shoulders cmp [2] | cmp | épaules | Pike push-up | 2×15-20 |
| 3 | hamstrings/glutes cmp [3] | cmp | ischio-fessiers | Glute bridge BW | 2×15-20 |
| 4 | chest cmp [1] | cmp | pectoraux | Push-up | 2×15-20 |
| 5 | quads iso [4] | iso | quadriceps | Wall sit / Lunge | 2×15-20 |
| 6 | calves iso [5] | iso | mollets | Calf raise BW | 2×15-20 |
| 7 | core | — | abdos | Planche | 3×15 |

Total : **8 exercices** (warmup + 6 + core)

**Assertions**
- LP2 : lower_push → **PASS** ✓
- Split = ['lower','lower'] → **PASS** ✓
- adjustedSlotCount(9, 45, 'endurance') = 6 → **PASS** ✓
- BW only : autoProgress=false, progressStepKg=0 → **PASS** ✓
- adjustedSpec 45 min : 2 séries (vs 3 base) → **PASS** ✓

**Problème BW pour shoulders compound :** Pike push-up cible shoulders_front mais est un exercice peu connu/difficile pour un débutant. Slot rempli mais qualité discutable.

**Problème BW pour hamstrings compound :** Glute bridge BW est souvent catégorisé isolation dans le seed. Si le slot composé hamstrings/glutes n'a aucun candidat compound BW → slot vide + warning BUG-5 possible.

**Warnings**
- UX-D : publicTypes={'lower'}, t='lower' → spécialisation → **PASS** ✓
- UX-5 : lower_push = push session, pas de pull → imbalance warning → **PASS** ✓

**Coach**
- Pike push-up pour OHP en BW : difficile pour un débutant mais c'est le seul mouvement disponible
- Hamstrings compound BW : Nordic curl absent (pullup_bar requis) → slot potentiellement vide ou glute bridge (isolation utilisée en fallback)
- 2 séries × 15-20 reps = volume faible mais adapté à la durée 45 min ✓
- **Verdict : ⚠️ LP2 validé, BW endurance viable mais limité (hamstrings compound incertain, pike push-up technique pour beginner)**

---

## P57 — lower_pull + machine+cable only (chaîne postérieure sans barbell)

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:MACH+CABLE, level:'beginner',
  focusMuscles:['legs','back'] }
```

### Simulation

**Étape 1 — workoutTypeFromFocus(['legs','back'])**
- Identique à P41 : R7 → **'lower_pull'**

**Étape 2 — selectSplit**
- focusType='lower_pull' → ['lower_pull','lower_pull']

**Étape 3 — adjustedSlotCount**
- 9 slots, 60 min, hypertrophy → **9 slots**

**Equipment MACH+CABLE = machine + cable**
- Aucun barbell ni dumbbell
- Deadlift barbell : non disponible
- Slot 0 (hamstrings/glutes composé) : sans barbell, le seul mouvement machine simul. ischio+fessiers = **leg press machine** (primaryMuscle=quads/glutes, pas hamstrings) ou seated leg curl (isolation). Ce slot risque d'être vide (aucun composé hamstrings/glutes en machine/câble standard dans le seed) → **warning BUG-5 probable**

**Table des exercices — Lower — Chaîne postérieure A/B**
| # | Slot | Cat | Muscle | Exercice MACH+CABLE | Résultat |
|---|------|-----|--------|--------------------|-----------| 
| 0 | warmup | — | — | — | 2×10 |
| 1 | hamstrings/glutes cmp [0] | cmp | ischio-fessiers | ??? cable deadlift ? | ⚠️ slot potentiellement vide |
| 2 | back_width cmp [1] | cmp | dos (larg.) | Lat pulldown machine / câble | 4×8-12 ✓ |
| 3 | back_thickness cmp [2] | cmp | dos (ép.) | Seated cable row | 4×8-12 ✓ |
| 4 | quads/glutes cmp [3] | cmp | quad-fessiers | Leg press machine | 4×8-12 ✓ |
| 5 | glutes/hamstrings iso [4] | iso | fessiers | Cable kickback / hip abduction | 3×10-15 ✓ |
| 6 | back iso [5] | iso | dos | Straight-arm pulldown câble | 3×10-15 ✓ |
| 7 | hamstrings iso [6] | iso | ischio | Leg curl machine | 3×10-15 ✓ |
| 8 | calves iso [7] | iso | mollets | Calf raise machine | 3×10-15 ✓ |
| 9 | biceps iso [8] | iso | biceps | Cable curl | 3×10-15 ✓ |
| 10 | core | — | abdos | Crunch machine | 3×15 |

**Assertions**
- LP1 : lower_pull → **PASS** ✓
- Split = ['lower','lower'] → **PASS** ✓
- Slot 2 (back_width composé) = lat pulldown câble ✓ → **PASS** ✓
- Slot 1 (hamstrings/glutes composé) sans barbell : aucun deadlift → slot probablement vide → **warning BUG-5 attendu** → documenter
- Aucun exercice barbell/dumbbell (si seed correct) → **PASS** ✓

**Coach**
- Slot deadlift sans barbell : point critique — le template lower_pull est deadlift-first, mais sans barre ni haltère, le vrai hip hinge lourd n'existe pas. Leg press machine en substitut est fonctionnel mais cible primarily quads, pas la chaîne postérieure.
- Le reste de la séance (lat pulldown, cable row, leg press, kickback, leg curl, calf raise, cable curl) est bien couvert par machine+câble ✓
- Ce profil devrait idéalement avoir au moins un câble rotatif pour simuler le RDL
- **Verdict : ⚠️ lower_pull sans barbell → slot deadlift potentiellement vide (BUG-5), programme viable mais la prémisse "chaîne postérieure" est partiellement manquée**

---

## Récapitulatif des assertions critiques Groupe F

| Code | Assertion | Profils concernés | Résultat |
|------|-----------|-------------------|---------|
| **LP1** | legs+back(!push) → lower_pull, jamais fullbody | P41, P42, P55, P57 | **PASS** ✓ |
| **LP2** | legs+push(!pull) → lower_push, jamais fullbody | P43, P44, P56 | **PASS** ✓ |
| **LP3** | legs+push+pull → null → fullbody (ambiguïté) | P52 | **PASS** ✓ |
| **LP4** | lower_pull deadlift-first : slot 1 = hamstrings/glutes composé | P41, P42 | **PASS** ✓ |
| **LP5** | lower_push squat-first : slot 1 = quads/glutes composé | P43, P44 | **PASS** ✓ |
| **PUSH_FULL** | chest+shoulders → push (pas upper) — R3 avant R5 | P45 | **PASS** ✓ |
| **PULL_FULL** | back+arms → pull (pas upper) — R4 avant R5 | P46 | **PASS** ✓ |
| **ARMS** | arms seul → upper (R5 matche via hasUpper=true) | P53 | **PASS** ✓ |
| **BUG-1** | strength+90min → adjustedSlotCount = min(base,5) | P50 | **PASS** ✓ (7 ex., pas 11) |
| **BUG-4** | SLOTS.push[5] = shoulders_rear (fix inclus) | P45, P47 | **PASS** ✓ |
| **UX-1** | arms+push split → warning "biceps absent" | P47 | **PASS** ✓ (UX-B) |
| **UX-2** | pull×N spécialisation → warning UX-D | P46 | **PASS** ✓ (UX-D) |
| **UX-5** | push sans pull → warning imbalance | P43, P44, P45, P47, P56 | **PASS** ✓ |

> **Aucun FAIL sur les assertions critiques du Groupe F.** Tous les nouveaux types lower_pull/lower_push, les règles de priorité (R3>R5, R4>R5, R6, R7), les guards d'ambiguïté (R∞→null→fullbody), le fix BUG-1 et le fix BUG-4 sont correctement implémentés.

---

## Tableau de synthèse P41–P57

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|--------|---------------------|---------|-------------------|
| P41 | LP1+LP4 lower_pull, autoProgress BB+DB | ⚠️ | 9 slots / 60 min hypertrophy : timing ~70 min ; back_width slot B limité sans câble |
| P42 | LP1+LP4 lower_pull×3, core en corePool | ⚠️ | 3× deadlift-based par semaine pour débutant : risque érecteurs/ischio ; timing serré |
| P43 | LP2+LP5 lower_push, 4 slots strength, OHP présent | ⚠️ | Timing 60 min juste avec 4 cmps strength 5×3-5 ; déséquilibre push/pull hebdomadaire (UX-5) |
| P44 | LP2+LP5 lower_push, 9 slots, FULL | ❌ | Trop dense pour débutant (4 cmps + 5 iso) ; déséquilibre push/pull structurel ; timing ~70 min |
| P45 | PUSH_FULL, BUG-4 shoulders_rear OK, DB | ⚠️ | Pas de tirage sur la semaine (UX-5) ; variété limitée en DB-only sur 3 sessions |
| P46 | PULL_FULL, biceps couvert, BB+DB+CABLE | ⚠️ | Triceps absent malgré focus 'arms' (pas de warning explicite pour ça) |
| P47 | push×2, BUG-4 OK, UX-1 warning | ⚠️ | Biceps absent (UX-1 correct) ; pas de tirage (UX-5) ; DB-only limité |
| P48 | upper A/B, épaules bien couvertes, FULL | ✅ | Timing 57 min légèrement tendu ; aucun legs sur la semaine |
| P49 | fat_loss 4j intermediate → push/pull/lower/fullbody | ✅ | — |
| P50 | BUG-1 fix : 5 slots, 7 ex. (pas 11) | ✅ | Fullbody 2j pour advanced : fréquence sous-optimale ; timing 90 min cohérent ✓ |
| P51 | endurance 5j advanced → push/pull/lower A/B/fullbody | ✅ | Fullbody 9 slots : timing ~65 min légèrement serré en endurance |
| P52 | LP3 : legs+push+pull → null → fullbody, UX-6 | ✅ | 9 slots beginner 60 min : timing ~70 min |
| P53 | ARMS : arms seul → upper, UX-6 warning | ⚠️ | Résultat contre-intuitif (bench+tractions en ciblant bras) ; UX-6 essentiel |
| P54 | upper A/B/C/D, 4j intermediate | ⚠️ | Aucun legs sur 4 séances/semaine ; bloc spécialisation courte durée seulement |
| P55 | LP1, lower_pull×3, selectedDays OK | ⚠️ | Identique P42 : fréquence 3× deadlift-based pour débutant risquée |
| P56 | LP2, 6 slots 45min endurance, BW | ⚠️ | Slot hamstrings cmp potentiellement vide (nordic curl = pullup_bar absent) ; pike push-up difficile beginner |
| P57 | LP1, lower_pull MACH+CABLE, slot deadlift vide | ⚠️ | Slot 0 (hamstrings/glutes cmp) probablement vide → BUG-5 warning ; hip hinge non couvert sans barre |

---

## Problèmes ouverts après Groupe F

### Anomalies / bugs résiduels

1. **Slot deadlift vide P57 (MACH+CABLE)** : lower_pull slot 0 = hamstrings/glutes composé — aucun exercice machine/câble ne cible primaryMuscle=hamstrings en composé dans le seed standard. Le générateur émettra un warning BUG-5 et sautera ce slot. Le programme perd son exercice central (deadlift) sans barre.
   - *Recommandation* : ajouter un slot fallback "romanian deadlift câble" dans le seed, ou redéfinir le slot 0 de lower_pull pour accepter aussi les machines (leg press en composé quads/glutes comme alternative).

2. **Slot hamstrings composé vide P56 (BW)** : lower_push slot 3 = hamstrings/glutes composé. Nordic curl nécessite pullup_bar (exclu de BW pur). Glute bridge est souvent isolation. Probable slot vide + BUG-5.

3. **Triceps absent en pull day pour focus 'arms' (P46)** : l'utilisateur ciblant 'arms' attend biceps+triceps. En split pull, le triceps n'a pas de slot. Aucun warning ne le signale (UX-B ne s'applique qu'au split push, UX-D signale juste la spécialisation). *Recommandation* : ajouter un warning "Focus bras en pull : le triceps n'est pas ciblé. Pour des bras complets, préférez un focus haut du corps."

### Réserves coach cumulées — thèmes récurrents

**Thème 1 : Timing 9 slots / 60 min** (P41, P42, P44, P52, P55)
- Les templates 9-slots (lower_pull, lower_push, fullbody-quad/hip) à 60 min non-strength génèrent ~70 min réel en hypertrophy (4 cmps × 4 séries × ~2.2 min + 5 iso × 3 × 2 min + transitions).
- *Recommandation* : plafonner les templates 9-slots à 8 slots pour une durée de 60 min non-strength (actuellement `base` = 9, ce qui dépasse la durée déclarée). Alternativement, afficher un warning "Programme estimé à 70–75 min".

**Thème 2 : Déséquilibre push/pull sans tirage (P43, P44, P45, P47, P56)**
- Tous les profils lower_push et push purs produisent une semaine sans aucun mouvement de tirage. UX-5 le signale correctement. Mais pour lower_push, l'utilisateur qui cible "jambes + épaules" ne s'attend pas à ce conseil.
- *Recommandation* : pour lower_push split, proposer une session pull optionnelle ou ajouter un row léger dans les slots isolations lower_push.

**Thème 3 : Fréquence deadlift-based pour débutant (P42, P55)**
- 3× lower_pull/semaine implique 3 séances avec soulevé de terre ou RDL pour un beginner. Risque de fatigue lombaire et de mauvaise technique par accumulation.
- *Recommandation* : pour beginner + focusType=lower_pull + daysPerWeek≥3, afficher un warning "Trois séances de chaîne postérieure par semaine est un volume élevé pour un débutant. Envisagez 2 séances pour favoriser la récupération lombaire."

**Thème 4 : Résultats contre-intuitifs non expliqués (P53, P46)**
- P53 : "arms" → upper avec bench press. UX-6 compense ✓.
- P46 : "arms" → pull sans triceps. Aucun warning. À corriger (voir anomalie 3).

**Thème 5 : Équipement machine+câble insuffisant pour hip hinge (P57)**
- La philosophie lower_pull est "deadlift-first", mais sans barre, il n'existe pas de vrai hip hinge lourd. Le slot est vide ou dégradé.
- *Recommandation* : cable pull-through (glutes/hamstrings, composé câble) — ajouter cet exercice au seed pour couvrir le slot deadlift en machine/câble.
