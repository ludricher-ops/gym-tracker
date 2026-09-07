# Prompt d'audit v10 — programGenerator.ts
**Date :** 2026-09-07  
**Objectif :** Couvrir les 14 trous identifiés dans coverage_analysis.md — fullbody et glutes+dos avec les 4 équipements prioritaires.  
**Profils :** 30 (12 Fullbody, 12 Glutes+dos, 6 cas spéciaux)

---

## RÉFÉRENCE TECHNIQUE — CORRECTIONS v10

### 1. Bases de slots par type de séance

| Type | Base |
|------|------|
| fullbody-quad | **9** |
| fullbody-hip | **9** |
| glutes-hip | **8** ← CORRECTION (v9 indiquait 6 par erreur) |
| quad-glutes | **8** ← CORRECTION (v9 indiquait 6 par erreur) |
| push / pull / legs / back-bi / chest-back | 8 |

### 2. adjustedSlotCount — formule

| goal | 20 min | 45 min | 60 min | 90 min |
|------|--------|--------|--------|--------|
| strength | min(3, max(2, ⌊base×0.5⌋)) | min(3, max(2, ⌊base×0.5⌋)) | max(4, ⌊base×0.5⌋) | min(base, 5) |
| autres | max(2, ⌊base×0.5⌋) | max(4, ⌊base×0.75⌋) | base | min(base+2, 8) |

**Résultats clés :**

| Session (base) | goal | durée | cap |
|----------------|------|-------|-----|
| fullbody-quad (9) | hypertrophy | 60 min | **9** (slots 0–8, triceps inclus) |
| fullbody-quad (9) | hypertrophy | 45 min | **6** (slots 0–5) |
| fullbody-quad (9) | hypertrophy | 90 min | **8** (slots 0–7, triceps exclu) |
| fullbody-quad (9) | strength | 60 min | **4** (slots 0–3) |
| fullbody-quad (9) | strength | 90 min | **5** (slots 0–4) |
| glutes-hip (8) | fat_loss | 60 min | **8** (tous) |
| glutes-hip (8) | fat_loss | 45 min | **6** (slots 0–5) |
| glutes-hip (8) | strength | 60 min | **4** (slots 0–3) |
| glutes-hip (8) | strength | 90 min | **5** (slots 0–4) |
| quad-glutes (8) | identique glutes-hip | — | — |

### 3. Slots détaillés

#### fullbody-quad (base=9)
```
[0] ['quads','glutes']                      compound
[1] ['chest','chest_upper']                 compound
[2] ['back_width','back_thickness','back']  compound  ← slot dos critique
[3] ['shoulders','shoulders_front']         compound
[4] ['hamstrings']                          isolation  ← VIDE en BW/DB/KB
[5] ['shoulders_rear']                      isolation
[6] ['biceps']                              isolation
[7] ['calves']                              isolation
[8] ['triceps']                             isolation  ← éjecté si cap≤8
```

#### fullbody-hip (base=9)
```
[0] ['hamstrings','glutes']                 compound
[1] ['chest','chest_upper']                 compound
[2] ['back_width','back_thickness','back']  compound
[3] ['shoulders','shoulders_front']         compound
[4] ['quads']                               isolation  ← bw-sissy-squat en BW/DB/KB (weight_reps ✅ FIXÉ R3)
[5] ['shoulders_lateral','shoulders_rear']  isolation
[6] ['biceps']                              isolation
[7] ['calves']                              isolation
[8] ['triceps']                             isolation  ← éjecté si cap≤8
```

#### glutes-hip (base=8)
```
[0] ['glutes','hamstrings']                 compound  ← slotPrimary=glutes
[1] ['hamstrings','glutes']                 compound  ← slotPrimary=hamstrings
[2] ['quads','glutes']                      compound
[3] ['back_width','back_thickness']         compound  ← "slot posture dos"  VIDE si BW
[4] ['glutes']                              isolation
[5] ['hamstrings']                          isolation  ← VIDE en BW/DB/KB
[6] ['glutes']                              isolation
[7] ['back_thickness','back']               isolation
```

#### quad-glutes (base=8)
```
[0] ['quads','glutes']                      compound
[1] ['glutes','hamstrings']                 compound  ← slotPrimary=glutes
[2] ['back_thickness','back']               compound  ← VIDE si BW
[3] ['quads']                               isolation
[4] ['glutes']                              isolation
[5] ['hamstrings']                          isolation  ← VIDE en BW/DB/KB
[6] ['calves']                              isolation
[7] ['back_width','back']                   isolation  ← seed-pullover (DB, isolation, pop 1)
```

### 4. pickExercise — ordre de tri

1. focusMuscleRank (index de primaryMuscle dans focusMuscles)
2. slotPrimaryRank (index de primaryMuscle dans slot.muscles, 0=meilleur)
3. usedGlobally (false < true)
4. strengthEquipmentPrio (goal=strength + compound → barbell/machine prime)
5. popularity desc

Pool : top-1 pour beginner, top-3 pour intermediate/advanced (aléatoire dans le pool).

### 5. workoutTypeFromFocus — CORRECTION CRITIQUE

| focusMuscles | résultat | raison |
|-------------|----------|--------|
| ['glutes'] | 'glutes-hip' | hasGlutes prime |
| ['glutes','back'] | **'pull'** ✅ CONFIRMÉ | hasPull=true vérifié AVANT hasGlutes → split dos sans fessiers |
| ['legs'] | 'lower' → lower-quad/lower-hip | hasLower prime |
| ['chest','back'] | 'fullbody' | hasPush+hasPull+!hasLower |

> ⚠️ `focusMuscles=['glutes','back']` produit un split pull/upper-pull, PAS un split fessiers. L'utilisateur qui cible fessiers+dos reçoit des séances dos pures.  
> 🔧 **RÉSERVE-2 FIXÉE (commit 1fcef7f) :** warning UX-6 désormais émis quand `hasFocusPull && hasFocusGlutes && !hasFocusLower`. Message : "Focus dos + fessiers : la combinaison génère un programme de tirage (dos) où les fessiers sont sollicités en secondaires — pour des séances fessiers autonomes, sélectionnez uniquement Fessiers."

### 6. BUG-BW-PULL (fix v9 — élargi)

```typescript
const backSessionTypes = ['pull', 'back-bi', 'chest-back']
const hasPullInSplit = rawSplit.some(t => backSessionTypes.includes(t))
const hasCompoundBack = available.some(ex =>
  ex.category === 'compound' &&
  ['back_width','back_thickness','back'].includes(ex.primaryMuscle)
)
// Si !hasCompoundBack && hasPullInSplit :
// 'pull' | 'back-bi' → 'fullbody-quad'
// 'chest-back' → 'push'
// + warning "Séance(s) dos remplacée(s)..."
```

### 7. SEED-BW-NOBACK (fix v9)

Émis si : `!hasCompoundBack && !hasPullInSplit && splitPreference !== 'glutes-focus' && !isGlutesSplit`

`isGlutesSplit = rawSplit.every(t => t === 'glutes-hip' || t === 'quad-glutes')`

> Le warning "Aucun exercice composé disponible pour dos (largeur)" par slot est **indépendant** de SEED-BW-NOBACK. Il peut être émis même si SEED-BW-NOBACK est supprimé (ex : BW + splitPreference='glutes-focus').

### 8. INC-1

Déclenché si : `goal === 'strength' && level !== 'beginner' && daysPerWeek <= 3 && !splitPreference`  
→ split = `['fullbody-quad','fullbody-hip','fullbody-quad']`  
**Ne se déclenche PAS si splitPreference est défini.**

### 9. Exercices de référence par équipement

#### BW seul
| Muscle / slot | Exercice | Pop | Statut |
|---------------|----------|-----|--------|
| compound quads/glutes | bw-squat | 3 | ✅ |
| compound chest | seed-pushup | 2 | ✅ |
| compound shoulders | bw-pike-pushup | 1 | ✅ seul |
| compound hamstrings | seed-good-morning-bw | 1 | ✅ FIXÉ R1 (12cf14e) |
| compound back | **AUCUN** | — | ❌ + WARNING |
| compound glutes slot[0] glutes-hip | seed-hip-thrust-bw | 3 | ✅ |
| compound hamstrings slot[1] glutes-hip | seed-good-morning-bw | 1 | ✅ FIXÉ R1 (slotPrimary=hamstrings) |
| isolation quads | bw-sissy-squat | 3 | ✅ FIXÉ R3 (bw-wall-sit → warmup) |
| isolation glutes | seed-glute-bridge (3), seed-donkey-kick (2), seed-fire-hydrant (2) | — | ✅ |
| isolation calves | bw-calf-raise | 2 | ✅ |
| isolation hamstrings | AUCUN | — | ❌ |
| isolation biceps | AUCUN | — | ❌ |
| isolation shoulders_rear | AUCUN | — | ❌ |

#### DB + BW
| Muscle / slot | Exercice | Pop | Note |
|---------------|----------|-----|------|
| compound quads/glutes | bw-squat (BW,3) > seed-lunges (DB,2) | — | bw-squat gagne sur pop |
| compound chest | seed-bench-dumbbell | 3 | ✅ |
| compound back (SEUL) | seed-row-dumbbell (back_thickness) | 3 | ⚠️ back_width non couvert |
| compound hamstrings | dumbbell-rdl | 2 | ✅ slot[1] glutes-hip |
| compound glutes slot[0] glutes-hip | seed-hip-thrust-bw | 3 | ✅ |
| compound shoulders | seed-shoulder-press-dumbbell | 3 | ✅ |
| isolation quads | bw-sissy-squat | 3 | ✅ FIXÉ R3 (bw-wall-sit → warmup) |
| isolation hamstrings | AUCUN | — | ❌ silencieux |
| isolation shoulders_rear | seed-rear-delt-fly | 2 | ✅ |
| isolation biceps | seed-curl-dumbbell (3) / seed-curl-hammer (3) | — | aléatoire |
| isolation calves | seed-calf-raise-db | 2 | ✅ |
| isolation back_thickness slot[7] glutes-hip | seed-pullover-dumbbell | 3 | ✅ |
| isolation back_width slot[7] quad-glutes | seed-pullover | 1 | ✅ seul |

#### KB + DB + BW (différences vs DB+BW)
| Slot | DB+BW | KB ajouté |
|------|-------|-----------|
| compound quads/glutes | bw-squat (pop 3) | seed-goblet-squat (KB, pop 3) → tie → aléatoire |
| compound hamstrings slot[1] glutes-hip | dumbbell-rdl (pop 2) | kb-rdl (KB, pop 2) → tie → aléatoire |
| compound glutes slot[0] glutes-hip | seed-hip-thrust-bw (pop 3) | kb-swing (KB, pop 3) → tie → aléatoire |
| compound back | seed-row-dumbbell (pop 3) | kb-row (pop 2) → seed-row-dumbbell gagne |
| isolation back | seed-pullover-dumbbell (pop 3) | kb-pullover (pop 1) → seed-pullover-dumbbell gagne |

#### Salle complète (exercices clés)
| Slot | Exercice (beginner=top-1) |
|------|---------------------------|
| compound quads/glutes | seed-squat-barbell (pop 8) |
| compound chest | seed-bench-barbell (pop 8) |
| compound back_width | seed-pullup (pop 3) tie seed-lat-pulldown (pop 3) → aléatoire |
| compound hamstrings slot[0] fullbody-hip | seed-romanian-deadlift (pop 3, rank 0) |
| compound glutes slot[0] glutes-hip | seed-hip-thrust (barbell, pop 4, rank 0) |
| compound shoulders | seed-ohp-barbell (pop 3) |
| compound back slot[3] glutes-hip | seed-lat-pulldown (cable,3) / seed-pullup (pullup_bar,3) |
| compound back slot[2] quad-glutes | seed-row-barbell (pop 7) |
| isolation hamstrings | seed-leg-curl-lying (machine, pop 3) ← DISPONIBLE en salle (vs VIDE en DB) |
| isolation quads | seed-leg-extension (machine, pop 3) ← DISPONIBLE en salle (vs bw-wall-sit en DB) |
| isolation back slot[7] glutes-hip | seed-pullover-dumbbell (3) / seed-pullover-cable (2) / machine-pullover (2) |

---

## PROFILS À AUDITER (30 profils)

**Convention :** Simuler la génération du programme et vérifier chaque assertion.  
Format : `✅ PASS`, `❌ FAIL [attendu vs observé]`, `⚠️ RÉSERVE [non-bloquant]`.

---

### GROUPE A — FULLBODY × ÉQUIPEMENT (12 profils)

---

#### A01 — Fullbody × BW, hypertrophy, 2j, 60min, beginner ⭐ P1.1

```
goal='hypertrophy', level='beginner', daysPerWeek=2, duration=60
equipment=['bodyweight'], splitPreference='fullbody'
```

**Split attendu :** `['fullbody-quad','fullbody-hip']`  
**adjustedSlotCount :** 9 slots chaque  
**SEED-BW-NOBACK attendu :** OUI

**Assertions — fullbody-quad :**
1. Warning SEED-BW-NOBACK présent
2. slot[0] = bw-squat (quads rank 0, pop 3, beginner top-1)
3. slot[1] = seed-pushup (chest rank 0, pop 2, beginner top-1)
4. slot[2] = VIDE + warning "Aucun exercice composé disponible pour dos"
5. slot[3] = bw-pike-pushup (shoulders, pop 1, seul candidat)
6. slot[4] = VIDE (aucune isolation hamstrings BW)
7. slot[5] = VIDE (aucune isolation shoulders_rear BW)
8. slot[6] = VIDE (aucune isolation biceps BW)
9. slot[7] = bw-calf-raise (pop 2)
10. slot[8] = VIDE (aucune isolation triceps BW)
11. Séance effective : 4 exercices réels

**Assertions — fullbody-hip :**
12. slot[0] = seed-hip-thrust-bw (glutes, pop 3 — seul compound hamstrings/glutes BW)
13. slot[1] = seed-pushup
14. slot[2] = VIDE + warning dos
15. slot[3] = bw-pike-pushup
16. slot[4] = bw-sissy-squat (quads isolation, pop 3, seul candidat) ✅ FIXÉ R3
17. slot[5] = VIDE
18. slot[6] = VIDE
19. slot[7] = bw-calf-raise

---

#### A02 — Fullbody × BW, strength, 3j, 60min, intermediate → INC-1 ⭐ P1.1

```
goal='strength', level='intermediate', daysPerWeek=3, duration=60
equipment=['bodyweight'], splitPreference=undefined
```

**INC-1 attendu :** OUI → split `['fullbody-quad','fullbody-hip','fullbody-quad']`  
**adjustedSlotCount :** max(4,⌊9×0.5⌋) = **4 slots**

**Assertions :**
1. INC-1 déclenché, split = ['fullbody-quad','fullbody-hip','fullbody-quad']
2. SEED-BW-NOBACK présent
3. adjustedSlotCount = 4
4. fullbody-quad : slot[0]=bw-squat, slot[1]=seed-pushup, slot[2]=VIDE+warning, slot[3]=bw-pike-pushup → 3 exercices effectifs
5. fullbody-hip : slot[0]=seed-hip-thrust-bw, slot[1]=seed-pushup, slot[2]=VIDE+warning, slot[3]=bw-pike-pushup → 3 exercices effectifs

---

#### A03 — Fullbody × BW, fat_loss, 3j, 45min, beginner

```
goal='fat_loss', level='beginner', daysPerWeek=3, duration=45
equipment=['bodyweight'], splitPreference='fullbody'
```

**adjustedSlotCount :** max(4,⌊9×0.75⌋) = **6 slots**

**Assertions :**
1. SEED-BW-NOBACK présent
2. adjustedSlotCount = 6
3. fullbody-quad slots 0–5 : bw-squat, seed-pushup, VIDE+warning, bw-pike-pushup, VIDE, VIDE → 3 exercices effectifs
4. fullbody-hip slots 0–5 : seed-hip-thrust-bw, seed-pushup, VIDE+warning, bw-pike-pushup, bw-sissy-squat, VIDE → 4 exercices effectifs ✅ FIXÉ R3

---

#### A04 — Fullbody × DB+BW, hypertrophy, 3j, 60min, beginner ⭐ P1.3a CRITIQUE

```
goal='hypertrophy', level='beginner', daysPerWeek=3, duration=60
equipment=['dumbbell','bodyweight'], splitPreference='fullbody'
```

**Split attendu :** `['fullbody-quad','fullbody-hip','fullbody-quad']`  
**SEED-BW-NOBACK attendu :** NON (seed-row-dumbbell = compound back)  
**adjustedSlotCount :** 9 slots

**Assertions — fullbody-quad :**
1. Pas de warning SEED-BW-NOBACK
2. slot[0] = bw-squat (BW, pop 3 > seed-lunges DB pop 2, beginner top-1)
3. slot[1] = seed-bench-dumbbell (chest, DB, pop 3 > seed-pushup pop 2, beginner top-1)
4. slot[2] = seed-row-dumbbell (back_thickness, DB, pop 3) — SEUL compound back en DB+BW (seed-pullover = isolation post-fix v9)
5. slot[3] = seed-shoulder-press-dumbbell (DB, pop 3, beginner top-1)
6. slot[4] = VIDE (aucune isolation hamstrings DB+BW)
7. slot[5] = seed-rear-delt-fly (DB, pop 2, seul candidat shoulders_rear DB)
8. slot[6] = seed-curl-dumbbell (DB, pop 3, beginner top-1)
9. slot[7] = seed-calf-raise-db (DB, pop 2)
10. slot[8] = vérifier isolation triceps DB disponible (seed-triceps-kickback ou équivalent)

**Assertions — fullbody-hip :**
11. slot[0] = dumbbell-rdl (hamstrings, DB, pop 2, slotPrimary=hamstrings rank 0)
12. slot[1] = seed-bench-dumbbell (pop 3)
13. slot[2] = seed-row-dumbbell — seul compound back (usedGlobally potentiel)
14. slot[3] = seed-shoulder-press-dumbbell
15. slot[4] = bw-sissy-squat (quads, BW, pop 3, seul isolation quads sans machine) ✅ FIXÉ R3
16. slot[5] = seed-lateral-raise (shoulders_lateral, DB, pop 3, slotPrimary=shoulders_lateral rank 0)
17. slot[6] = seed-curl-dumbbell ou seed-curl-hammer (aléatoire, pop 3 tie)
18. slot[7] = seed-calf-raise-db

---

#### A05 — Fullbody × DB+BW, strength, 3j, 60min, intermediate → INC-1 ⭐ P1.3b CRITIQUE

```
goal='strength', level='intermediate', daysPerWeek=3, duration=60
equipment=['dumbbell','bodyweight'], splitPreference=undefined
```

**INC-1 attendu :** OUI  
**adjustedSlotCount :** max(4,⌊9×0.5⌋) = **4 slots**

**Assertions :**
1. INC-1 déclenché
2. Pas de SEED-BW-NOBACK (hasCompoundBack=true)
3. adjustedSlotCount = 4
4. fullbody-quad slot[2] = seed-row-dumbbell ✅ (inclus dans les 4 premiers → slot dos couvert même en strength)
5. fullbody-hip slot[2] = seed-row-dumbbell (usedGlobally mais seul compound back → sélectionné quand même)
6. fullbody-hip slot[0] = dumbbell-rdl (slotPrimary=hamstrings rank 0)

---

#### A06 — Fullbody × DB+BW, fat_loss, 2j, 45min, beginner

```
goal='fat_loss', level='beginner', daysPerWeek=2, duration=45
equipment=['dumbbell','bodyweight'], splitPreference='fullbody'
```

**adjustedSlotCount :** max(4,⌊9×0.75⌋) = **6 slots**

**Assertions :**
1. Pas de SEED-BW-NOBACK
2. adjustedSlotCount = 6
3. fullbody-quad slot[2] = seed-row-dumbbell (inclus dans les 6 premiers ✅)
4. fullbody-hip slot[4] = bw-sissy-squat (inclus dans les 6 premiers ✅ FIXÉ R3)
5. fullbody-hip slot[5] = seed-lateral-raise (inclus dans les 6 premiers ✅)

---

#### A07 — Fullbody × KB+DB+BW, hypertrophy, 3j, 60min, intermediate ⭐ P2.1

```
goal='hypertrophy', level='intermediate', daysPerWeek=3, duration=60
equipment=['kettlebell','dumbbell','bodyweight'], splitPreference='fullbody'
```

**adjustedSlotCount :** 9 slots

**Assertions — fullbody-quad :**
1. slot[0] = seed-goblet-squat (KB, pop 3) OU bw-squat (BW, pop 3) — tie → aléatoire intermediate top-3
2. slot[1] = seed-bench-dumbbell (DB, pop 3) — pas de bench KB
3. slot[2] = seed-row-dumbbell (DB, pop 3) > kb-row (KB, pop 2) — seed-row-dumbbell gagne sur pop
4. slot[3] = seed-shoulder-press-dumbbell (DB, pop 3) OU kb-press (KB, pop 2) — aléatoire top-3
5. slot[4] = VIDE (aucune isolation hamstrings en KB+DB+BW)
6. slot[6] = seed-curl-dumbbell (DB, pop 3) > kb-curl (KB, pop 1)
7. slot[7] = seed-calf-raise-db (DB, pop 2) > kb-calf-raise (KB, pop 1)

**Assertions — fullbody-hip :**
8. slot[0] = kb-rdl (KB, pop 2) OU dumbbell-rdl (DB, pop 2) — tie → aléatoire intermediate
9. slot[4] = bw-sissy-squat ✅ FIXÉ R3 (seul isolation quads sans machine)

---

#### A08 — Fullbody × KB+DB+BW, fat_loss, 4j, 60min, intermediate

```
goal='fat_loss', level='intermediate', daysPerWeek=4, duration=60
equipment=['kettlebell','dumbbell','bodyweight'], splitPreference='fullbody'
```

**Assertions :**
1. Split = ['fullbody-quad','fullbody-hip','fullbody-quad','fullbody-hip'] (4j alternés)
2. adjustedSlotCount = 9
3. slot[2] dos : seed-row-dumbbell sélectionné en séance 1 et 2 (seul compound back, usedGlobally n'éjecte pas si seul candidat)
4. Pas de SEED-BW-NOBACK

---

#### A09 — Fullbody × Salle complète, hypertrophy, 3j, 60min, intermediate (non-INC-1)

```
goal='hypertrophy', level='intermediate', daysPerWeek=3, duration=60
equipment=['barbell','dumbbell','cable','pullup_bar','machine'], splitPreference='fullbody'
```

**INC-1 attendu :** NON (splitPreference explicite)  
**adjustedSlotCount :** 9 slots

**Assertions — fullbody-quad :**
1. slot[0] = seed-squat-barbell (pop 8, slotPrimary=quads rank 0, toujours top-3)
2. slot[1] = seed-bench-barbell (pop 8)
3. slot[2] = seed-pullup (pop 3) OU seed-lat-pulldown (pop 3) — tie → aléatoire intermediate
4. slot[3] = seed-ohp-barbell (pop 3) — intermediate top-3 (> seed-ohp-dumbbell pop 2)
5. slot[4] = seed-leg-curl-lying (machine, pop 3) ✅ — disponible en salle (vs VIDE en BW/DB)
6. slot[6] = seed-curl-barbell (pop 3) ou autre curl pop 3 — aléatoire
7. slot[8] = isolation triceps (inclus car adjustedSlotCount=9)

**Assertions — fullbody-hip :**
8. slot[0] = seed-romanian-deadlift (hamstrings, barbell, pop 3, slotPrimary=hamstrings rank 0)
9. slot[4] = seed-leg-extension (machine, pop 3) ✅ — vs bw-wall-sit en DB+BW

---

#### A10 — Fullbody × Salle, hypertrophy, 4j, 60min, intermediate

```
goal='hypertrophy', level='intermediate', daysPerWeek=4, duration=60
equipment=['barbell','dumbbell','cable','pullup_bar','machine'], splitPreference='fullbody'
```

**Assertions :**
1. Split = 4 séances fullbody alternées quad/hip
2. adjustedSlotCount = 9
3. slot[2] rempli dans chaque séance (salle = compound back toujours dispo)
4. Exercices dos variés entre séances (usedGlobally → alternance pullup/lat-pulldown)

---

#### A11 — Fullbody × Salle, strength, 4j, 90min, advanced

```
goal='strength', level='advanced', daysPerWeek=4, duration=90
equipment=['barbell','dumbbell','cable','pullup_bar','machine'], splitPreference='fullbody'
```

**adjustedSlotCount :** min(9,5) = **5 slots**

**Assertions :**
1. adjustedSlotCount = 5 pour fullbody-quad et fullbody-hip
2. fullbody-quad slots 0–4 : squat, bench, dos compound, ohp, hamstrings isolation (leg-curl) ✅
3. fullbody-hip slots 0–4 : rdl, bench, dos compound, ohp, quads isolation (leg-extension) ✅
4. slot[2] rempli dans les 2 types ✅

---

#### A12 — Fullbody × Salle, fat_loss, 5j, 60min, beginner

```
goal='fat_loss', level='beginner', daysPerWeek=5, duration=60
equipment=['barbell','dumbbell','cable','pullup_bar','machine'], splitPreference='fullbody'
```

**Assertions :**
1. Split = 5 séances fullbody alternées
2. adjustedSlotCount = 9
3. Pas de SEED-BW-NOBACK
4. Tous les slots isolation remplis (machine disponible → pas de VIDE pour hamstrings, biceps, calves)

---

### GROUPE B — GLUTES+DOS × ÉQUIPEMENT (12 profils)

---

#### B01 — Glutes+dos × BW, fat_loss, 3j, 60min, intermediate ⭐ P1.2 CRITIQUE

```
goal='fat_loss', level='intermediate', daysPerWeek=3, duration=60
equipment=['bodyweight'], splitPreference='glutes-focus'
```

**Split attendu :** `['glutes-hip','quad-glutes','glutes-hip']`  
**SEED-BW-NOBACK attendu :** NON (splitPreference='glutes-focus' prime)  
**Warning slot VIDE attendu :** OUI (slot[3] glutes-hip, slot[2] quad-glutes — mécanisme indépendant)  
**adjustedSlotCount :** 8 slots

**Assertions — glutes-hip :**
1. Pas de warning SEED-BW-NOBACK ✅
2. Warning "Aucun exercice composé disponible pour dos (largeur)" émis pour slot[3] ⚠️ indépendant
3. slot[0] = seed-hip-thrust-bw (glutes, BW, pop 3, slotPrimary=glutes rank 0)
4. slot[1] = seed-good-morning-bw (hamstrings, BW, pop 1, slotPrimary=hamstrings rank 0) ✅ FIXÉ R1
5. slot[2] = bw-squat (quads, BW, pop 3, slotPrimary=quads rank 0)
6. slot[3] = VIDE + warning (aucun compound back_width/back_thickness BW)
7. slot[4] = seed-glute-bridge (BW, pop 3)
8. slot[5] = VIDE (aucune isolation hamstrings BW)
9. slot[6] = seed-donkey-kick (pop 2) ou seed-fire-hydrant (pop 2) — aléatoire
10. slot[7] = VIDE (aucune isolation back_thickness BW)

**Assertions — quad-glutes :**
11. adjustedSlotCount = 8
12. slot[0] = bw-squat (quads, pop 3, slotPrimary=quads rank 0)
13. slot[1] = seed-hip-thrust-bw (glutes, pop 3)
14. slot[2] = VIDE + warning (aucun compound back_thickness BW)
15. slot[3] = bw-sissy-squat (quads, pop 3, seul isolation quads BW) ✅ FIXÉ R3
16. slot[4] = seed-glute-bridge (pop 3)
17. slot[5] = VIDE (hamstrings)
18. slot[6] = bw-calf-raise (pop 2)
19. slot[7] = VIDE (aucune isolation back_width BW — seed-pullover = dumbbell)

---

#### B02 — Glutes+dos × BW, hypertrophy, 4j, 60min, beginner

```
goal='hypertrophy', level='beginner', daysPerWeek=4, duration=60
equipment=['bodyweight'], splitPreference='glutes-focus'
```

**Assertions :**
1. Split = ['glutes-hip','quad-glutes','glutes-hip','quad-glutes']
2. Pas de SEED-BW-NOBACK ✅
3. slot[1] glutes-hip = seed-good-morning-bw (hamstrings, BW, pop 1, seul compound hamstrings BW) ✅ FIXÉ R1
4. slot[3] glutes-hip = VIDE + warning dos
5. slot[2] quad-glutes = VIDE + warning dos

---

#### B03 — Glutes+dos × BW, strength, 3j, 90min, intermediate → 5 slots

```
goal='strength', level='intermediate', daysPerWeek=3, duration=90
equipment=['bodyweight'], splitPreference='glutes-focus'
```

**adjustedSlotCount :** min(8,5) = **5 slots**

**Assertions :**
1. adjustedSlotCount = 5
2. Glutes-hip slots 0–4 : slot[3] (dos compound) = VIDE + warning (inclus dans les 5 premiers ✅)
3. Quad-glutes slots 0–4 : slot[2] (dos compound) = VIDE + warning (inclus dans les 5 premiers ✅)
4. Pas de SEED-BW-NOBACK ✅

---

#### B04 — Glutes+dos × DB+BW, fat_loss, 4j, 60min, intermediate ⭐ P1.4 CRITIQUE

```
goal='fat_loss', level='intermediate', daysPerWeek=4, duration=60
equipment=['dumbbell','bodyweight'], splitPreference='glutes-focus'
```

**adjustedSlotCount :** 8 slots  
**hasCompoundBack :** OUI (seed-row-dumbbell)

**Assertions — glutes-hip :**
1. Pas de SEED-BW-NOBACK ✅
2. slot[0] = seed-hip-thrust-bw (glutes, BW, pop 3) — > dumbbell-rdl (hamstrings, rank 1)
3. slot[1] = dumbbell-rdl (hamstrings, DB, pop 2, slotPrimary=hamstrings rank 0, seed-hip-thrust-bw usedGlobally)
4. slot[2] = seed-lunges (DB,2) ou bw-lunge (BW,2) ou seed-bulgarian-split-squat (DB,2) — tie → aléatoire intermediate
5. slot[3] = seed-row-dumbbell (back_thickness, DB, pop 3) — seul compound back DB, slotPrimary=back_width non matché (rank 1) mais seul candidat ✅
6. slot[4] = seed-glute-bridge (BW, pop 3) ou seed-donkey-kick (pop 2)
7. slot[5] = VIDE (aucune isolation hamstrings DB+BW)
8. slot[6] = seed-donkey-kick (pop 2) ou seed-fire-hydrant (pop 2)
9. slot[7] = seed-pullover-dumbbell (back_thickness, DB, pop 3, slotPrimary=back_thickness rank 0) ✅

**Assertions — quad-glutes :**
10. slot[0] = bw-squat (quads, BW, pop 3 > seed-lunges DB pop 2)
11. slot[1] = seed-hip-thrust-bw (glutes, BW, pop 3, slotPrimary=glutes rank 0)
12. slot[2] = seed-row-dumbbell (back_thickness, DB, pop 3, slotPrimary=back_thickness rank 0 ✅)
13. slot[3] = bw-sissy-squat (quads, BW, pop 3, seul isolation quads sans machine) ✅ FIXÉ R3
14. slot[4] = seed-glute-bridge (BW, pop 3)
15. slot[5] = VIDE (hamstrings)
16. slot[6] = seed-calf-raise-db (DB, pop 2)
17. slot[7] = seed-pullover (back_width, DB, isolation, pop 1) — slotPrimary=back_width ∈ ['back_width','back'] ✅

---

#### B05 — Glutes+dos × DB+BW, hypertrophy, 3j, 60min, beginner

```
goal='hypertrophy', level='beginner', daysPerWeek=3, duration=60
equipment=['dumbbell','bodyweight'], splitPreference='glutes-focus'
```

**Assertions :**
1. Pas de SEED-BW-NOBACK ✅
2. slot[3] glutes-hip = seed-row-dumbbell (beginner top-1, seul compound dos DB)
3. slot[7] glutes-hip = seed-pullover-dumbbell (back_thickness, pop 3, slotPrimary=back_thickness rank 0)
4. slot[7] quad-glutes = seed-pullover (back_width, DB, isolation, pop 1, seul candidat isolation back_width DB)

---

#### B06 — Glutes+dos × DB+BW, strength, 4j, 60min, intermediate → 4 slots ⭐ P2.4

```
goal='strength', level='intermediate', daysPerWeek=4, duration=60
equipment=['dumbbell','bodyweight'], splitPreference='glutes-focus'
```

**adjustedSlotCount :** max(4,⌊8×0.5⌋) = **4 slots**

**Assertions :**
1. adjustedSlotCount = 4
2. Glutes-hip slots 0–3 : slot[3] = seed-row-dumbbell ✅ (compound dos inclus dans les 4 premiers)
3. Quad-glutes slots 0–3 : slot[2] = seed-row-dumbbell ✅ (compound dos inclus dans les 4 premiers)
4. Pas de SEED-BW-NOBACK ✅

---

#### B07 — Glutes+dos × KB+DB+BW, fat_loss, 4j, 60min, intermediate ⭐ P2.2

```
goal='fat_loss', level='intermediate', daysPerWeek=4, duration=60
equipment=['kettlebell','dumbbell','bodyweight'], splitPreference='glutes-focus'
```

**Assertions — glutes-hip :**
1. slot[0] = kb-swing (glutes, KB, pop 3) OU seed-hip-thrust-bw (BW, pop 3) — tie → aléatoire intermediate
2. slot[1] = kb-rdl (hamstrings, KB, pop 2) OU dumbbell-rdl (DB, pop 2) — tie → aléatoire
3. slot[2] = seed-goblet-squat (KB, pop 3) OU bw-squat (BW, pop 3) — tie → aléatoire
4. slot[3] = seed-row-dumbbell (DB, pop 3) > kb-row (KB, pop 2) sur popularité ✅
5. slot[7] = seed-pullover-dumbbell (DB, pop 3) > kb-pullover (KB, back_width, pop 1) ✅

**Assertions — quad-glutes :**
6. slot[2] = seed-row-dumbbell (back_thickness, DB, pop 3, slotPrimary=back_thickness rank 0 ✅)

---

#### B08 — Glutes+dos × KB+DB+BW, hypertrophy, 3j, 45min, beginner

```
goal='hypertrophy', level='beginner', daysPerWeek=3, duration=45
equipment=['kettlebell','dumbbell','bodyweight'], splitPreference='glutes-focus'
```

**adjustedSlotCount :** max(4,⌊8×0.75⌋) = **6 slots**

**Assertions :**
1. adjustedSlotCount = 6
2. Glutes-hip slots 0–5 : slot[3] (dos compound) inclus → seed-row-dumbbell ✅
3. Quad-glutes slots 0–5 : slot[2] (dos compound) inclus → seed-row-dumbbell ✅
4. slot[0] glutes-hip = kb-swing ou seed-hip-thrust-bw (beginner top-1 → premier du tri)

---

#### B09 — Glutes+dos × Salle complète, fat_loss, 4j, 60min, intermediate

```
goal='fat_loss', level='intermediate', daysPerWeek=4, duration=60
equipment=['barbell','dumbbell','cable','pullup_bar','machine'], splitPreference='glutes-focus'
```

**adjustedSlotCount :** 8 slots

**Assertions — glutes-hip :**
1. slot[0] = seed-hip-thrust (barbell, pop 4, slotPrimary=glutes rank 0)
2. slot[1] = seed-romanian-deadlift (hamstrings, barbell, pop 3, slotPrimary=hamstrings rank 0)
3. slot[2] = seed-squat-barbell (quads, pop 8, slotPrimary=quads rank 0)
4. slot[3] = seed-lat-pulldown (cable, pop 3) OU seed-pullup (pullup_bar, pop 3) — aléatoire intermediate
5. slot[5] = seed-leg-curl-lying (machine, pop 3) ✅ — disponible en salle (vs VIDE en BW/DB)
6. slot[7] = seed-pullover-dumbbell (pop 3) OU seed-pullover-cable (pop 2) OU machine-pullover (pop 2) — top-3 aléatoire

**Assertions — quad-glutes :**
7. slot[2] = seed-row-barbell (back_thickness, barbell, pop 7, slotPrimary=back_thickness rank 0) ✅

---

#### B10 — Glutes+dos × Salle, hypertrophy, 3j, 60min, advanced

```
goal='hypertrophy', level='advanced', daysPerWeek=3, duration=60
equipment=['barbell','dumbbell','cable','pullup_bar','machine'], splitPreference='glutes-focus'
```

**Assertions :**
1. slot[5] glutes-hip = seed-leg-curl-lying (machine, pop 3) ✅
2. slot[7] glutes-hip = parmi top-3 variantes pullover (aléatoire advanced)
3. slot[2] quad-glutes = seed-row-barbell (pop 7) ✅

---

#### B11 — Glutes+dos × Salle, strength, 4j, 60min, intermediate → 4 slots

```
goal='strength', level='intermediate', daysPerWeek=4, duration=60
equipment=['barbell','dumbbell','cable','pullup_bar','machine'], splitPreference='glutes-focus'
```

**adjustedSlotCount :** max(4,⌊8×0.5⌋) = **4 slots**

**Assertions :**
1. adjustedSlotCount = 4
2. Glutes-hip slots 0–3 : slot[3] = seed-lat-pulldown ou seed-pullup ✅ (compound dos inclus)
3. Quad-glutes slots 0–3 : slot[2] = seed-row-barbell ✅
4. slot[0] glutes-hip = seed-hip-thrust (barbell, pop 4) — strengthEquipmentPrio + barbell compound

---

#### B12 — Glutes+dos × Salle, fat_loss, 3j, 45min, beginner

```
goal='fat_loss', level='beginner', daysPerWeek=3, duration=45
equipment=['barbell','dumbbell','cable','pullup_bar','machine'], splitPreference='glutes-focus'
```

**adjustedSlotCount :** max(4,⌊8×0.75⌋) = **6 slots**

**Assertions :**
1. adjustedSlotCount = 6
2. Glutes-hip slots 0–5 : slot[3] dos compound inclus ✅, slot[5] hamstrings isolation = seed-leg-curl-lying ✅
3. Quad-glutes slots 0–5 : slot[2] dos compound inclus ✅, slot[3] quads isolation = seed-leg-extension ✅ (machine disponible)

---

### GROUPE C — CAS SPÉCIAUX (6 profils)

---

#### C01 — focusMuscles=['glutes','back'] × Salle+cable → 'pull' ⭐ P1.5 CRITIQUE

```
goal='hypertrophy', level='intermediate', daysPerWeek=3, duration=60
equipment=['barbell','dumbbell','cable']
focusMuscles=['glutes','back'], splitPreference=undefined
```

**Comportement attendu :**  
`workoutTypeFromFocus(['glutes','back'])` → hasPull=true vérifié AVANT hasGlutes → **'pull'**  
Split = `['pull','upper-pull','pull']` (ou similaire pull-based, 3j)

**Assertions :**
1. workoutTypeFromFocus(['glutes','back']) = 'pull' ← confirmer explicitement
2. Split produit est pull-based, AUCUNE séance glutes-hip ou quad-glutes
3. Warning UX-6 émis ✅ FIXÉ R2 (commit 1fcef7f) — message "Focus dos + fessiers : la combinaison génère un programme de tirage…"
4. Séances 'pull' générées correctement avec barbell+dumbbell+cable
5. focusMuscles=['glutes'] n'est PAS dans le split → l'utilisateur ne reçoit pas ce qu'il demande, mais le warning UX l'en informe désormais ✅ FIXÉ R2

---

#### C02 — focusMuscles=['glutes','back'] × DB+BW, fat_loss, 3j, 60min, beginner

```
goal='fat_loss', level='beginner', daysPerWeek=3, duration=60
equipment=['dumbbell','bodyweight']
focusMuscles=['glutes','back']
```

**Assertions :**
1. workoutTypeFromFocus(['glutes','back']) = 'pull' → split pull-based
2. hasPullInSplit=true + !hasCompoundBack → BUG-BW-PULL déclenché → 'pull' → 'fullbody-quad'
3. Documenter le comportement exact du split final (quel type de séance produit 'upper-pull' après remplacement ?)
4. Warning BUG-BW-PULL émis ✅

---

#### C03 — focusMuscles=['glutes'] × BW → isGlutesSplit ⭐ P3.1

```
goal='fat_loss', level='intermediate', daysPerWeek=3, duration=60
equipment=['bodyweight'], focusMuscles=['glutes'], splitPreference=undefined
```

**Assertions :**
1. workoutTypeFromFocus(['glutes']) = 'glutes-hip' ✅
2. Split = ['glutes-hip','quad-glutes','glutes-hip']
3. isGlutesSplit = true → pas de SEED-BW-NOBACK ✅
4. Warning slot VIDE "dos (largeur)" émis pour slot[3] glutes-hip ⚠️ (indépendant)
5. Warning slot VIDE "dos (épaisseur)" émis pour slot[2] quad-glutes ⚠️ (indépendant) — à confirmer
6. slot[1] glutes-hip = seed-good-morning-bw (hamstrings, BW, pop 1) ✅ FIXÉ R1

---

#### C04 — focusMuscles=['glutes'] × DB+BW, fat_loss, 3j, 60min, intermediate

```
goal='fat_loss', level='intermediate', daysPerWeek=3, duration=60
equipment=['dumbbell','bodyweight'], focusMuscles=['glutes']
```

**Assertions :**
1. workoutTypeFromFocus(['glutes']) = 'glutes-hip' → split glutes
2. isGlutesSplit = true → pas de SEED-BW-NOBACK ✅
3. hasCompoundBack = true (seed-row-dumbbell) → pas de warning dos global
4. slot[3] glutes-hip = seed-row-dumbbell ✅
5. slot[7] glutes-hip = seed-pullover-dumbbell ✅

---

#### C05 — Machine seul, fullbody, hypertrophy, 3j, 60min, intermediate → machine-biceps-curl

```
goal='hypertrophy', level='intermediate', daysPerWeek=3, duration=60
equipment=['machine'], splitPreference='fullbody'
```

**Assertions :**
1. slot[6] fullbody-quad/hip = machine-biceps-curl (biceps, machine, isolation, pop 2) ✅ (ajouté fix v9)
2. slot[2] fullbody-quad/hip = machine-lat-pulldown (back_width, machine, compound, pop 2, slotPrimary=back_width rank 0)
3. slot[5] glutes-hip (si glutes-focus machine) = machine-low-row ✅
4. slot[7] glutes-hip = machine-pullover (back_width, machine, isolation, pop 2) OU machine-low-row

---

#### C06 — Salle, glutes-focus, strength, 4j, 60min, intermediate → 4 slots + slot[3] dos inclus

```
goal='strength', level='intermediate', daysPerWeek=4, duration=60
equipment=['barbell','dumbbell','cable','pullup_bar','machine'], splitPreference='glutes-focus'
```

**adjustedSlotCount :** max(4,⌊8×0.5⌋) = **4 slots** (slots 0–3)

**Assertions :**
1. adjustedSlotCount = 4
2. Glutes-hip slots 0–3 : slot[3] = seed-lat-pulldown ou seed-pullup ✅ (compound dos inclus dans les 4 premiers)
3. Quad-glutes slots 0–3 : slot[2] = seed-row-barbell ✅
4. strengthEquipmentPrio appliqué : barbell/machine prime
5. slot[0] glutes-hip = seed-hip-thrust (barbell, pop 4) ✅

---

## FORMAT DE RÉPONSE

Pour chaque profil :

```
### [Code] — [Nom court]

**Split produit :** [types de séances]
**INC-1 :** OUI/NON
**adjustedSlotCount :** [valeur]
**Warnings globaux :** [liste ou aucun]

**Séance [type] (slots effectifs) :**
| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] ... | ... | ✅/❌/⚠️ |
...

**Findings :**
- ✅ PASS : ...
- ❌ FAIL-CRITIQUE : [attendu] vs [observé]
- ❌ FAIL-MINEUR : ...
- ⚠️ RÉSERVE : ...
```

### Codes de sévérité

| Code | Signification |
|------|--------------|
| ✅ PASS | Conforme aux assertions |
| ❌ FAIL-CRITIQUE | Programme inutilisable pour ce profil |
| ❌ FAIL-MINEUR | Exercice sous-optimal mais programme fonctionnel |
| ⚠️ RÉSERVE | Sous-optimal documenté, non-bloquant |
| ℹ️ INFO | Observation neutre |

### Réserves pré-identifiées — TOUTES FIXÉES v10

| Réserve | Condition | Statut |
|---------|-----------|--------|
| RÉSERVE-1 | BW + glutes-hip + slot[1] | ✅ FIXÉ R1 — seed-good-morning-bw (commit 12cf14e) : isWarmupExercise false + seed.ts patche les users existants |
| RÉSERVE-2 | focusMuscles=['glutes','back'] | ✅ FIXÉ R2 — warning UX-6 émis (commit 1fcef7f) : hasFocusPull && hasFocusGlutes && !hasFocusLower |
| RÉSERVE-3 | DB+BW + fullbody-hip + slot[4] | ✅ FIXÉ R3 — bw-wall-sit → warmup, bw-sissy-squat ajouté (quads, weight_reps, pop 3) |

---

## SYNTHÈSE FINALE ATTENDUE

1. **Tableau de couverture mis à jour** (8 cases : fullbody/glutes×4 équipements)
2. **Liste des FAILs** par sévérité
3. **Confirmation des 3 RÉSERVES fixées** (RÉSERVE-1 ✅ commit 12cf14e, RÉSERVE-2 ✅ commit 1fcef7f, RÉSERVE-3 ✅ bw-sissy-squat)
4. **État machine-pullover, machine-low-row, machine-biceps-curl** : slots vérifiés
5. **Recommandations** si de nouveaux bugs sont détectés
