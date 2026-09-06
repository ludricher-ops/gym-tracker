# Audit P11–P20 — Groupe B : focusMuscles override

> Simulation complète de `generateProgramDraft` pour les profils P11 à P20.
> Code de référence : `src/utils/programGenerator.ts`.
> Étapes tracées : 1 (workoutTypeFromFocus), 2 (selectSplit), 3 (adjustedSlotCount + reorderSlotsByFocus), 5 (séries×reps).
> Étape 4 (pickExercise depuis seed) non applicable au groupe B (seed requis uniquement pour P21–P26).

---

## Rappel des constantes utilisées

```
COMPOUND_SPEC['hypertrophy'] = { sets:4, repsMin:8,  repsMax:12, restSec:90  }
ISOLATION_SPEC['hypertrophy'] = { sets:3, repsMin:10, repsMax:15, restSec:75  }
WARMUP_SPEC                   = { sets:2, repsMin:10, repsMax:10, restSec:0   }
CORE_SPEC                     = { sets:3, repsMin:15, repsMax:15, restSec:60  }

adjustedSlotCount(base, 60) → base        (durée de référence, inchangé)
adjustedSlotCount(base, 45) → max(3, floor(base × 0.75))
adjustedSlotCount(base, 20) → max(2, floor(base × 0.5))
adjustedSlotCount(base, 90) → min(base+2, 8)

Base de slots par type interne :
  push / pull / legs / upper / lower  → 6 / 6 / 6 / 8 / 6
  upper-push / upper-pull             → 8 / 8
  lower-quad / lower-hip              → 6 / 6
  fullbody-quad / fullbody-hip        → 9 / 9
```

---

## P11 — chest seul → push

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:['dumbbell'],
  level:'beginner', focusMuscles:['chest'] }
```

### Étape 1 — workoutTypeFromFocus(['chest'])

| Flag      | Valeur | Raison                                   |
|-----------|--------|------------------------------------------|
| hasLower  | false  | 'legs' absent                            |
| hasPush   | true   | 'chest' présent → `includes('chest')`   |
| hasPull   | false  | 'back' absent                            |
| hasArms   | false  | 'arms' absent                            |
| hasCore   | false  | 'core' absent                            |
| hasUpper  | true   | hasPush=true                             |

Branche activée : `hasPush && !hasPull && !hasLower` → **retourne `'push'`** (ligne 269)

### Étape 2 — selectSplit

focusType='push' ≠ 'lower' → `Array.from({ length:2 }, () => 'push')`

- Types internes : `['push', 'push']`
- Types publics  : `['push', 'push']` (push est déjà un type public)
- Noms : "Push — Poussée A", "Push — Poussée B"

### Étape 3 — Slots pour Push (60 min, focusedMuscles={chest, chest_upper, chest_lower})

`SLOTS['push']` (6 slots), `adjustedSlotCount(6, 60)` → **6 slots retenus**.

reorderSlotsByFocus : composés ciblés chest en tête, OHP après ; isolations chest d'abord, puis triceps/lat.

| # | Muscles cibles | Cat | Focus? |
|---|---------------|-----|--------|
| 1 | chest, chest_upper, chest_lower | compound  | ✓ |
| 2 | shoulders, shoulders_front      | compound  | ✗ |
| 3 | chest, chest_upper, chest_lower | isolation | ✓ |
| 4 | triceps                         | isolation | ✗ |
| 5 | shoulders_lateral, shoulders    | isolation | ✗ |
| 6 | triceps                         | isolation | ✗ |

(+ warmup en tête, core en queue)

### Étape 5 — Séries × répétitions (hypertrophy, 60 min)

| Slot | Cat      | Séries × Reps | Repos  |
|------|----------|---------------|--------|
| 0    | warmup   | 2 × 10        | 0 s    |
| 1    | compound | 4 × 8-12      | 90 s   |
| 2    | compound | 4 × 8-12      | 90 s   |
| 3    | isolation| 3 × 10-15     | 75 s   |
| 4    | isolation| 3 × 10-15     | 75 s   |
| 5    | isolation| 3 × 10-15     | 75 s   |
| 6    | isolation| 3 × 10-15     | 75 s   |
| core | core     | 3 × 15        | 60 s   |

Total sets par séance : 2+8+8+3+3+3+3+3 = **33 sets**.

Variation A→B : usedGlobally force des exercices différents pour chaque slot commun. Les deux séances sont structurellement identiques (mêmes 6 slots dans le même ordre) — seuls les exercices changent si le pool est suffisant.

### Assertions [PASS/FAIL]

- `workoutTypeFromFocus(['chest'])` = `'push'` : **PASS** (ligne 269)
- Split = `['push','push']` : **PASS** (ligne 293)
- Exercices chest compound en tête (reorderSlotsByFocus) : **PASS** (ligne 669)
- Nombre de slots = 6 (base=6, 60 min) : **PASS** (ligne 671)

### Coach

**Équilibre musculaire :** Programme de spécialisation chest. Aucune séance pull ni lower — déséquilibre agoniste/antagoniste (pec-deltoïde antérieur sur-sollicité, dos et jambes absents). Acceptable uniquement comme programme d'appoint, pas comme programme principal.

**Cohérence objectif :** 4×8-12 hypertrophie → correct. Deux slots triceps (slots 4 et 6) = sur-représentation triceps relative au reste du programme.

**Durée/contenu :** 33 sets × ~3 min estimé (90 s rest compound, 75 s isolation) = ~90 min réels vs 60 min annoncés. ⚠️ Le générateur ne réduit pas les slots pour 60 min (c'est la base), mais le volume réel dépasse la fenêtre pour un beginner.

**Équipement :** DB seul — pas de barbell bench possible. En hypertrophie c'est acceptable (dumbell bench, incliné DB, etc.).

**Variété inter-sessions :** Variété d'exercices seulement (mêmes 6 slots, exercices différents si le pool DB chest est suffisant). Si le seed a < 2 exercices compound chest en dumbbell → doublon inévitable entre A et B.

**Verdict :** ⚠️ Problème mineur — programme unilatéral push sans pull/lower, volume réel probablement supérieur à 60 min, risque de doublon si pool DB étroit.

---

## P12 — back seul → pull

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60,
  equipment:['barbell','dumbbell','cable'], level:'beginner',
  focusMuscles:['back'] }
```

### Étape 1 — workoutTypeFromFocus(['back'])

| Flag      | Valeur | Raison                  |
|-----------|--------|-------------------------|
| hasLower  | false  | 'legs' absent           |
| hasPush   | false  | 'chest'/'shoulders' absents |
| hasPull   | true   | 'back' présent          |
| hasArms   | false  | 'arms' absent           |
| hasCore   | false  | 'core' absent           |
| hasUpper  | true   | hasPull=true            |

Branche activée : `hasPull && !hasPush && !hasLower` → **retourne `'pull'`** (ligne 271)

### Étape 2 — selectSplit

focusType='pull' ≠ 'lower' → `Array.from({ length:3 }, () => 'pull')`

- Types internes : `['pull', 'pull', 'pull']`
- Types publics  : `['pull', 'pull', 'pull']`
- Noms : "Pull — Tirage A", "Pull — Tirage B", "Pull — Tirage C"

### Étape 3 — Slots pour Pull (60 min, focusedMuscles={back, back_width, back_thickness})

`SLOTS['pull']` (6 slots), `adjustedSlotCount(6, 60)` → **6 slots retenus**.

reorderSlotsByFocus : tous les composés dos ont focus → ordre inchangé. Slot isolation back (slot 2 original) remonte avant biceps/rear delts/forearms.

| # | Muscles cibles | Cat | Focus? |
|---|---------------|-----|--------|
| 1 | back_width, back                            | compound  | ✓ |
| 2 | back_thickness, back                        | compound  | ✓ |
| 3 | back_thickness, back_width, back            | isolation | ✓ |
| 4 | biceps                                      | isolation | ✗ |
| 5 | shoulders_rear                              | isolation | ✗ |
| 6 | forearms                                    | isolation | ✗ |

(+ warmup + core)

### Étape 5 — Séries × répétitions (hypertrophy, 60 min)

| Slot | Cat      | Séries × Reps | Repos |
|------|----------|---------------|-------|
| 0    | warmup   | 2 × 10        | 0 s   |
| 1    | compound | 4 × 8-12      | 90 s  |
| 2    | compound | 4 × 8-12      | 90 s  |
| 3    | isolation| 3 × 10-15     | 75 s  |
| 4    | isolation| 3 × 10-15     | 75 s  |
| 5    | isolation| 3 × 10-15     | 75 s  |
| 6    | isolation| 3 × 10-15     | 75 s  |
| core | core     | 3 × 15        | 60 s  |

Variation A→B→C : usedGlobally force rotation des exercices. BB+DB+CABLE offre un pool riche pour le dos.

### Assertions [PASS/FAIL]

- `workoutTypeFromFocus(['back'])` = `'pull'` : **PASS** (ligne 271)
- Split = `['pull','pull','pull']` : **PASS** (ligne 293)
- Slots back compound en tête : **PASS**
- Nombre de slots = 6 : **PASS**

### Coach

**Équilibre musculaire :** Spécialisation pull. Aucun push, aucun lower. Acceptable en isolation mais pas comme programme principal.

**Cohérence objectif :** 4×8-12 pour composés dos → correct. Le slot forearms (slot 6) est souvent négligé dans les programmes classiques — présence ici pertinente.

**Durée/contenu :** Même calcul que P11 — ~90 min réels vs 60 annoncés. ⚠️

**Équipement :** BB+DB+CABLE → pool riche, excellent pour le dos (tirage barre, cable, rowing DB). Bonne exploitation.

**Variété inter-sessions :** Variété d'exercices avec pool BB+DB+CABLE large. Avec 3 sessions, le pool back doit contenir ≥ 3 exercices compound distincts. BB+DB+CABLE → très probable.

**Verdict :** ⚠️ Problème mineur — programme unilatéral pull sans push/lower, timing sous-estimé.

---

## P13 — legs seul → lower×4 BW

```
{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:['bodyweight'],
  level:'beginner', focusMuscles:['legs'] }
```

### Étape 1 — workoutTypeFromFocus(['legs'])

| Flag      | Valeur | Raison                |
|-----------|--------|-----------------------|
| hasLower  | true   | 'legs' présent        |
| hasPush   | false  |                       |
| hasPull   | false  |                       |
| hasArms   | false  |                       |
| hasCore   | false  |                       |
| hasUpper  | false  | hasPush=hasPull=hasArms=false |

Branche activée : `hasLower && !hasUpper` → **retourne `'lower'`** (ligne 263)

### Étape 2 — selectSplit

focusType='lower' → branche `lower` spéciale (ligne 287-290) :

```
Array.from({ length:4 }, (_, i) => i%2===0 ? 'lower-quad' : 'lower-hip')
→ ['lower-quad', 'lower-hip', 'lower-quad', 'lower-hip']
```

- Types internes : `['lower-quad', 'lower-hip', 'lower-quad', 'lower-hip']`
- Types publics  : `['lower', 'lower', 'lower', 'lower']`

Nommage (canon='lower', total=4, suffixes A/B/C/D) :
- lower-quad (count=1) → "Lower — Bas du corps A"
- lower-hip  (count=2) → "Lower — Bas du corps B"
- lower-quad (count=3) → "Lower — Bas du corps C"
- lower-hip  (count=4) → "Lower — Bas du corps D"

### Étape 3 — Slots (60 min, focusedMuscles={quads, hamstrings, glutes, calves})

`adjustedSlotCount(6, 60)` → **6 slots** pour lower-quad et lower-hip.

Tous les slots lower-quad et lower-hip contiennent des muscles legs → reorderSlotsByFocus ne change pas l'ordre (tous aF=0).

**Lower-quad (A et C) :**

| # | Muscles cibles | Cat | Ordre original preservé |
|---|---------------|-----|------------------------|
| 1 | quads, glutes        | compound  | Squat / leg press |
| 2 | hamstrings, glutes   | compound  | RDL                |
| 3 | quads                | isolation | Leg extension      |
| 4 | hamstrings           | isolation | Leg curl           |
| 5 | glutes               | isolation | Hip abduction      |
| 6 | calves               | isolation | Calf raise         |

**Lower-hip (B et D) :**

| # | Muscles cibles | Cat | Ordre original preservé |
|---|---------------|-----|------------------------|
| 1 | glutes, hamstrings   | compound  | Hip thrust / sumo DL |
| 2 | quads, glutes        | compound  | Fente / lunge        |
| 3 | glutes               | isolation | Cable kickback       |
| 4 | hamstrings           | isolation | Leg curl             |
| 5 | quads                | isolation | Leg extension        |
| 6 | calves               | isolation | Calf raise           |

Différenciation structurelle A/C vs B/D : composé 1 = squat-dominant vs hip-thrust-dominant → **variété structurelle réelle**.

Sessions A et C (lower-quad) : même structure, exercices différents forcés par usedGlobally.
Sessions B et D (lower-hip) : même structure, exercices différents forcés par usedGlobally.

### Étape 5 — Séries × répétitions (hypertrophy, 60 min)

| Slot | Cat      | Séries × Reps | Repos |
|------|----------|---------------|-------|
| 0    | warmup   | 2 × 10        | 0 s   |
| 1    | compound | 4 × 8-12      | 90 s  |
| 2    | compound | 4 × 8-12      | 90 s  |
| 3    | isolation| 3 × 10-15     | 75 s  |
| 4    | isolation| 3 × 10-15     | 75 s  |
| 5    | isolation| 3 × 10-15     | 75 s  |
| 6    | isolation| 3 × 10-15     | 75 s  |
| core | core     | 3 × 15        | 60 s  |

### Assertions [PASS/FAIL]

- `workoutTypeFromFocus(['legs'])` = `'lower'` : **PASS** (ligne 263)
- Split public = `['lower','lower','lower','lower']` : **PASS** (ligne 288-290)
- Types internes alternés lower-quad/lower-hip : **PASS** (ligne 289)
- Noms A/B/C/D : **PASS** (ligne 707)
- Structure différenciée quad vs hip (composé dominant différent) : **PASS**

### Coach

**Équilibre musculaire :** Spécialisation jambes parfaitement cohérente avec focusMuscles=['legs']. Aucun upper — acceptable pour un bloc de spécialisation.

**Cohérence objectif :** 4×8-12 hypertrophie → correct. Volume 4 lower/sem = élevé mais gérable avec l'alternance quad/hip qui répartit la charge.

**Durée/contenu :** ~90 min réels vs 60 annoncés (même calcul). ⚠️

**Équipement BW only — risque de slots vides :** Les exercices isolation jambes (leg extension, leg curl, cable kickback) nécessitent machine/câble. En BW seul :
- Leg extension → pas d'équivalent BW pur (slot risque d'être vide ou de fallback vers un composé BW)
- Leg curl → même problème (Nordic curl possible mais technique élevée pour débutant)
- Hip abduction / kickback → possible en BW (bandes idéales, mais ici BW only)
- Calf raise → OK en BW (wall/step)

⚠️ **Risque de 2-3 slots vides** sur chaque session en BW only pour un programme lower. Le pool bodyweight legs est très mince pour les isolations machine.

**Variété inter-sessions :** Excellente — alternance structurelle quad/hip (différents mouvements composés), plus rotation exercices via usedGlobally. Verdict : "Variété structurelle".

**Verdict :** ⚠️ Problème potentiellement sérieux — plusieurs slots isolation jambes risquent d'être vides en BW only (leg extension, leg curl n'ont pas d'équivalent BW standard). À tester avec le seed réel.

---

## P14 — core seul → fullbody [BUG3]

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:['bodyweight'],
  level:'beginner', focusMuscles:['core'] }
```

### Étape 1 — workoutTypeFromFocus(['core'])

| Flag      | Valeur | Raison                 |
|-----------|--------|------------------------|
| hasLower  | false  | 'legs' absent          |
| hasPush   | false  | 'chest'/'shoulders' absents |
| hasPull   | false  | 'back' absent          |
| hasArms   | false  | 'arms' absent          |
| hasCore   | true   | 'core' présent         |
| hasUpper  | false  | hasPush=hasPull=hasArms=false |

Branches testées :
1. `hasLower && !hasUpper` → false (hasLower=false)
2. `hasCore && !hasLower && !hasUpper` → **true → retourne `null`** (ligne 267)

→ **retourne `null`**

La branche `return 'lower'` n'est jamais atteinte. BUG3 vérifié.

### Étape 2 — selectSplit

focusType=null → switch daysPerWeek=2 → **retourne `['fullbody-quad', 'fullbody-hip']`** (ligne 298)

- Types internes : `['fullbody-quad', 'fullbody-hip']`
- Types publics  : `['fullbody', 'fullbody']`
- Noms : "Full Body A", "Full Body B"

### Étape 3 — Slots (60 min, focusedMuscles={core})

`adjustedSlotCount(9, 60)` → **9 slots** pour fullbody-quad et fullbody-hip.

Aucun slot de fullbody-quad ou fullbody-hip ne contient 'core' comme muscle cible → reorderSlotsByFocus ne change aucun ordre (tous aF=1). Core est ajouté **en queue via corePool** (pas comme slot).

**fullbody-quad (A) — ordre original preservé :**

| # | Muscles cibles | Cat |
|---|---------------|-----|
| 1 | quads, glutes                        | compound  |
| 2 | chest, chest_upper                   | compound  |
| 3 | back_width, back_thickness, back     | compound  |
| 4 | shoulders, shoulders_front           | compound  |
| 5 | hamstrings                           | isolation |
| 6 | shoulders_rear                       | isolation |
| 7 | biceps                               | isolation |
| 8 | triceps                              | isolation |
| 9 | calves                               | isolation |

**fullbody-hip (B) — ordre original preservé :**

| # | Muscles cibles | Cat |
|---|---------------|-----|
| 1 | hamstrings, glutes                   | compound  |
| 2 | chest, chest_upper                   | compound  |
| 3 | back_width, back                     | compound  |
| 4 | shoulders, shoulders_front           | compound  |
| 5 | quads                                | isolation |
| 6 | shoulders_lateral, shoulders_rear    | isolation |
| 7 | biceps                               | isolation |
| 8 | triceps                              | isolation |
| 9 | calves                               | isolation |

### Étape 5 — Séries × répétitions (hypertrophy, 60 min)

| Slot | Cat      | Séries × Reps | Repos |
|------|----------|---------------|-------|
| 0    | warmup   | 2 × 10        | 0 s   |
| 1-4  | compound | 4 × 8-12      | 90 s  |
| 5-9  | isolation| 3 × 10-15     | 75 s  |
| core | core     | 3 × 15        | 60 s  |

Total par séance : 2 + 16 + 15 + 3 = **36 sets**.

### Assertions [PASS/FAIL]

- `workoutTypeFromFocus(['core'])` = `null` : **PASS** (ligne 267)
- Split = `['fullbody','fullbody']` JAMAIS `['lower','lower']` : **PASS** (BUG3 absent)
- Core en queue via corePool (pas comme slot) : **PASS** (ligne 698-703)

### Coach

**Équilibre musculaire :** Fullbody équilibré, excellent. L'utilisateur voulait du gainage — le core est bien présent en queue. Les 9 slots couvrent tout le corps.

**Cohérence objectif :** Hypertrophie 4×8-12 sur fullbody × 2 — volume correct pour un débutant.

**Durée/contenu :** 36 sets × ~3 min = ~108 min réels. ⚠️ Nettement supérieur à 60 min. En BW, les repos sont plus courts — estimation plus proche de 60-75 min praticable.

**Équipement BW :** back compound (slot 3 A / slot 3 B) nécessite pull-up bar. En l'absence de barre, ce slot risque d'être vide. ⚠️

**Verdict :** ✅ Bon programme sur la logique (BUG3 correctement absent) — réserves timing et dépendance pull-up bar en BW.

---

## P15 — core seul → upper/lower 4j [BUG3 / 4j]

```
{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:FULL,
  level:'beginner', focusMuscles:['core'] }
```

### Étape 1 — workoutTypeFromFocus(['core'])

Identique à P14 → **retourne `null`** (ligne 267).

### Étape 2 — selectSplit

focusType=null → switch daysPerWeek=4 :
- `isMass = (hypertrophy) → true`
- branche `if (isMass)` → **retourne `['upper-push','lower-quad','upper-pull','lower-hip']`** (ligne 310)

- Types internes : `['upper-push', 'lower-quad', 'upper-pull', 'lower-hip']`
- Types publics  : `['upper', 'lower', 'upper', 'lower']`
- Noms :
  - upper-push (count=1/2) → "Upper — Haut du corps A"
  - lower-quad (count=1/2) → "Lower — Bas du corps A"
  - upper-pull (count=2/2) → "Upper — Haut du corps B"
  - lower-hip  (count=2/2) → "Lower — Bas du corps B"

### Étape 3 — Slots (60 min, focusedMuscles={core})

`adjustedSlotCount(8, 60)` → **8 slots** (upper-push, upper-pull)
`adjustedSlotCount(6, 60)` → **6 slots** (lower-quad, lower-hip)

Aucun slot upper/lower ne contient 'core' → reorderSlotsByFocus sans effet (tous aF=1).

**Upper-push A (8 slots) :**

| # | Muscles cibles | Cat |
|---|---------------|-----|
| 1 | chest, chest_upper                          | compound  |
| 2 | back_width, back_thickness, back            | compound  |
| 3 | shoulders, shoulders_front                  | compound  |
| 4 | chest, chest_lower, chest_upper             | isolation |
| 5 | triceps                                     | isolation |
| 6 | shoulders_lateral                           | isolation |
| 7 | biceps                                      | isolation |
| 8 | back_thickness, back                        | isolation |

**Lower-quad A (6 slots) :**

| # | Muscles cibles | Cat |
|---|---------------|-----|
| 1 | quads, glutes       | compound  |
| 2 | hamstrings, glutes  | compound  |
| 3 | quads               | isolation |
| 4 | hamstrings          | isolation |
| 5 | glutes              | isolation |
| 6 | calves              | isolation |

**Upper-pull B (8 slots) :**

| # | Muscles cibles | Cat |
|---|---------------|-----|
| 1 | back_width, back                            | compound  |
| 2 | back_thickness, back                        | compound  |
| 3 | chest, chest_upper                          | compound  |
| 4 | shoulders_rear                              | isolation |
| 5 | biceps                                      | isolation |
| 6 | back_thickness, back                        | isolation |
| 7 | triceps                                     | isolation |
| 8 | shoulders_lateral                           | isolation |

**Lower-hip B (6 slots) :**

| # | Muscles cibles | Cat |
|---|---------------|-----|
| 1 | glutes, hamstrings  | compound  |
| 2 | quads, glutes       | compound  |
| 3 | glutes              | isolation |
| 4 | hamstrings          | isolation |
| 5 | quads               | isolation |
| 6 | calves              | isolation |

### Étape 5 — Séries × répétitions (hypertrophy, 60 min)

| Session      | Slots cmp | Slots isol | Séries cmp | Séries isol |
|-------------|-----------|------------|------------|-------------|
| Upper-push A | 3         | 5          | 4×8-12     | 3×10-15     |
| Lower-quad A | 2         | 4          | 4×8-12     | 3×10-15     |
| Upper-pull B | 3         | 5          | 4×8-12     | 3×10-15     |
| Lower-hip B  | 2         | 4          | 4×8-12     | 3×10-15     |

Chaque séance : + warmup 2×10 + core 3×15.
Upper : 10 exercices total. Lower : 8 exercices total.

### Assertions [PASS/FAIL]

- `workoutTypeFromFocus(['core'])` = `null` : **PASS** (ligne 267)
- Split = `['upper','lower','upper','lower']` JAMAIS `['lower','lower','lower','lower']` : **PASS** (BUG3 absent)
- BUG3 / 4j : correctement géré → PASS

### Coach

**Équilibre musculaire :** Upper/lower A/B = programme équilibré classique. Excellent pour un débutant voulant améliorer son gainage (core en queue de chaque séance).

**Cohérence objectif :** 4×8-12 sur un upper/lower 4j hypertrophie → très bon schéma.

**Durée/contenu :** Upper (~100 min réels), Lower (~75 min réels) vs 60 annoncés. ⚠️ Surcharge habituelle du générateur.

**Équipement FULL :** Optimal, aucun slot vide possible.

**Verdict :** ✅ Bon programme — réserve timing comme pour tous les profils 60 min.

---

## P16 — shoulders seul → push

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:['dumbbell'],
  level:'beginner', focusMuscles:['shoulders'] }
```

### Étape 1 — workoutTypeFromFocus(['shoulders'])

| Flag      | Valeur | Raison                               |
|-----------|--------|--------------------------------------|
| hasLower  | false  |                                      |
| hasPush   | true   | `includes('shoulders')` = true       |
| hasPull   | false  |                                      |
| hasArms   | false  |                                      |
| hasCore   | false  |                                      |
| hasUpper  | true   | hasPush=true                         |

Branche activée : `hasPush && !hasPull && !hasLower` → **retourne `'push'`** (ligne 269)

### Étape 2 — selectSplit

focusType='push' → `['push', 'push']`

- Types internes/publics : `['push', 'push']`
- Noms : "Push — Poussée A", "Push — Poussée B"

### Étape 3 — Slots (60 min, focusedMuscles={shoulders, shoulders_front, shoulders_lateral, shoulders_rear})

`adjustedSlotCount(6, 60)` → **6 slots**.

reorderSlotsByFocus sur SLOTS['push'] :

Composés :
- slot 0 (chest cmp) : muscles=[chest,chest_upper,chest_lower] → aucun dans focused → aF=1
- slot 1 (OHP) : muscles=[shoulders,shoulders_front] → dans focused → aF=0
- Après tri : [slot 1 (OHP), slot 0 (chest cmp)]

Isolations :
- slot 2 (chest isol) : aF=1
- slot 3 (triceps) : aF=1
- slot 4 (lat raise, muscles=[shoulders_lateral,shoulders]) : dans focused → aF=0
- slot 5 (triceps) : aF=1
- Après tri : [slot 4 (lat raise), slot 2 (chest isol), slot 3 (triceps), slot 5 (triceps)]

Ordre final :

| # | Muscles cibles | Cat | Focus? |
|---|---------------|-----|--------|
| 1 | shoulders, shoulders_front              | compound  | ✓ OHP en tête |
| 2 | chest, chest_upper, chest_lower         | compound  | ✗ |
| 3 | shoulders_lateral, shoulders            | isolation | ✓ |
| 4 | chest, chest_upper, chest_lower         | isolation | ✗ |
| 5 | triceps                                 | isolation | ✗ |
| 6 | triceps                                 | isolation | ✗ |

### Étape 5 — Séries × répétitions (hypertrophy, 60 min)

| Slot | Cat      | Séries × Reps | Repos |
|------|----------|---------------|-------|
| 0    | warmup   | 2 × 10        | 0 s   |
| 1    | compound | 4 × 8-12      | 90 s  |
| 2    | compound | 4 × 8-12      | 90 s  |
| 3    | isolation| 3 × 10-15     | 75 s  |
| 4    | isolation| 3 × 10-15     | 75 s  |
| 5    | isolation| 3 × 10-15     | 75 s  |
| 6    | isolation| 3 × 10-15     | 75 s  |
| core | core     | 3 × 15        | 60 s  |

### Assertions [PASS/FAIL]

- `hasPush=true` (shoulders ∈ push) → `'push'` : **PASS** (ligne 256, 269)
- Split = `['push','push']` : **PASS**
- OHP (shoulders cmp) monté en tête par reorderSlotsByFocus : **PASS**

### Coach

**Équilibre musculaire :** Focus shoulders en push. OHP + lat raise couverts. Rear deltoid **absent** des slots push (attendu — c'est un muscle pull). Pour un focus épaules complet, le rear delt manque. Aussi : aucun pull, aucun lower.

**Cohérence objectif :** 4×8-12 correct. Deux slots triceps = surcharge triceps pour un focus épaules.

**Durée/contenu :** Même estimation ~90 min réels. ⚠️

**Équipement DB :** OHP DB, lat raise DB → équipement adapté. Chest DB bench présent pour équilibre.

**Couverture isolation épaules :** Un seul slot shoulders_lateral — rear deltoid absent. Lacune acceptable pour push mais notable pour un focus épaules.

**Verdict :** ⚠️ Problème mineur — rear deltoid non couvert (expected pour push), déséquilibre pull/lower, timing surestimé.

---

## P17 — chest+back → upper

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL,
  level:'beginner', focusMuscles:['chest','back'] }
```

### Étape 1 — workoutTypeFromFocus(['chest','back'])

| Flag      | Valeur | Raison                              |
|-----------|--------|-------------------------------------|
| hasLower  | false  |                                     |
| hasPush   | true   | 'chest' présent                     |
| hasPull   | true   | 'back' présent                      |
| hasArms   | false  |                                     |
| hasCore   | false  |                                     |
| hasUpper  | true   | hasPush=true, hasPull=true          |

Branches testées dans l'ordre :
1. `hasLower && !hasUpper` → false
2. `hasCore && !hasLower && !hasUpper` → false
3. `hasPush && !hasPull && !hasLower` → false (hasPull=true)
4. `hasPull && !hasPush && !hasLower` → false (hasPush=true)
5. `hasUpper && !hasLower` → **true → retourne `'upper'`** (ligne 273)

→ **retourne `'upper'`**

### Étape 2 — selectSplit

focusType='upper' ≠ 'lower' → `Array.from({ length:3 }, () => 'upper')`

- Types internes/publics : `['upper', 'upper', 'upper']`
- Noms : "Upper — Haut du corps A", "Upper — Haut du corps B", "Upper — Haut du corps C"

Note : il s'agit ici de `SLOTS['upper']` (pas upper-push/upper-pull).

### Étape 3 — Slots (60 min, focusedMuscles={chest, chest_upper, chest_lower, back, back_width, back_thickness})

`adjustedSlotCount(8, 60)` → **8 slots**.

SLOTS['upper'] original (indices 0-7) :
- 0 : chest/chest_upper — compound
- 1 : back_width/back_thickness/back — compound
- 2 : shoulders/shoulders_front — compound (OHP)
- 3 : shoulders_lateral/shoulders_rear — isolation
- 4 : back_thickness/back — isolation
- 5 : chest/chest_lower — isolation
- 6 : biceps — isolation
- 7 : triceps — isolation

reorderSlotsByFocus :
Composés : slots 0 (chest, aF=0), 1 (back, aF=0), 2 (OHP, aF=1) → [0, 1, 2]
Isolations : slot 3 (aF=1), 4 (back_thickness aF=0), 5 (chest_lower aF=0), 6 (aF=1), 7 (aF=1)
   Triés : [4, 5, 3, 6, 7]

Ordre final :

| # | Muscles cibles | Cat | Focus? |
|---|---------------|-----|--------|
| 1 | chest, chest_upper                          | compound  | ✓ |
| 2 | back_width, back_thickness, back            | compound  | ✓ |
| 3 | shoulders, shoulders_front (OHP)            | compound  | ✗ |
| 4 | back_thickness, back                        | isolation | ✓ |
| 5 | chest, chest_lower                          | isolation | ✓ |
| 6 | shoulders_lateral, shoulders_rear           | isolation | ✗ |
| 7 | biceps                                      | isolation | ✗ |
| 8 | triceps                                     | isolation | ✗ |

### Étape 5 — Séries × répétitions (hypertrophy, 60 min)

| Slot | Cat      | Séries × Reps | Repos |
|------|----------|---------------|-------|
| 0    | warmup   | 2 × 10        | 0 s   |
| 1    | compound | 4 × 8-12      | 90 s  |
| 2    | compound | 4 × 8-12      | 90 s  |
| 3    | compound | 4 × 8-12      | 90 s  |
| 4    | isolation| 3 × 10-15     | 75 s  |
| 5    | isolation| 3 × 10-15     | 75 s  |
| 6    | isolation| 3 × 10-15     | 75 s  |
| 7    | isolation| 3 × 10-15     | 75 s  |
| 8    | isolation| 3 × 10-15     | 75 s  |
| core | core     | 3 × 15        | 60 s  |

Total : 10 exercices par séance × 3 sessions.

### Assertions [PASS/FAIL]

- `workoutTypeFromFocus(['chest','back'])` = `'upper'` : **PASS** (ligne 273)
- Split = `['upper','upper','upper']` : **PASS** (ligne 293)
- chest et back en tête (slots 1-2) par reorderSlotsByFocus : **PASS**
- OHP (slot 3) après les composés ciblés : **PASS**

### Coach

**Équilibre musculaire :** chest + back bien priorisés. Ratio push/pull par séance : composé 1 (chest push) + composé 2 (back pull) + 1 isolation back + 1 isolation chest → équilibré. OHP en 3e composé. Jambes absentes — programme haut du corps.

**Cohérence objectif :** 3 composés + 5 isolations par upper → volume élevé. Pour un débutant, 3 séances upper/sem avec 10 exercices chacune représente un stimulus important.

**Durée/contenu :** ~105 min réels vs 60 annoncés. ⚠️

**Variété inter-sessions A/B/C :** `SLOTS['upper']` (pas upper-push/upper-pull) → même structure pour A, B, C. Variété d'exercices seulement (usedGlobally). Sur 3 sessions, le pool doit être suffisamment large — avec FULL equipment, oui.

**Couverture isolation :** rear deltoid présent (slot 6, shoulders_rear), biceps et triceps présents. Couverture complète.

**Verdict :** ⚠️ Problème mineur — volume très élevé pour un débutant en upper×3, timing sous-estimé, mais structure correcte et équilibrée.

---

## P18 — legs+core → lower (core ne neutralise pas legs)

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:['bodyweight'],
  level:'beginner', focusMuscles:['legs','core'] }
```

### Étape 1 — workoutTypeFromFocus(['legs','core'])

| Flag      | Valeur | Raison               |
|-----------|--------|----------------------|
| hasLower  | true   | 'legs' présent       |
| hasPush   | false  |                      |
| hasPull   | false  |                      |
| hasArms   | false  |                      |
| hasCore   | true   | 'core' présent       |
| hasUpper  | false  | hasPush=hasPull=hasArms=false |

Branches testées :
1. `hasLower && !hasUpper` → **true → retourne `'lower'`** (ligne 263)

La branche `hasCore && !hasLower && !hasUpper` (ligne 267) n'est jamais atteinte car hasLower=true bloque à la ligne 263. Core ne neutralise pas legs.

→ **retourne `'lower'`**

### Étape 2 — selectSplit

focusType='lower' → branche lower spéciale :

```
Array.from({ length:3 }, (_, i) => i%2===0 ? 'lower-quad' : 'lower-hip')
→ ['lower-quad', 'lower-hip', 'lower-quad']
```

- Types internes : `['lower-quad', 'lower-hip', 'lower-quad']`
- Types publics  : `['lower', 'lower', 'lower']`

Nommage (total=3 → suffixes A/B/C) :
- lower-quad (count=1) → "Lower — Bas du corps A"
- lower-hip  (count=2) → "Lower — Bas du corps B"
- lower-quad (count=3) → "Lower — Bas du corps C"

### Étape 3 — Slots (60 min, focusedMuscles={quads, hamstrings, glutes, calves, core})

`adjustedSlotCount(6, 60)` → **6 slots** chacun.

Tous les muscles lower-quad/lower-hip sont dans focusedMuscles → reorderSlotsByFocus sans effet.

**Lower-quad (A, C) :**

| # | Muscles cibles | Cat |
|---|---------------|-----|
| 1 | quads, glutes       | compound  |
| 2 | hamstrings, glutes  | compound  |
| 3 | quads               | isolation |
| 4 | hamstrings          | isolation |
| 5 | glutes              | isolation |
| 6 | calves              | isolation |

**Lower-hip (B) :**

| # | Muscles cibles | Cat |
|---|---------------|-----|
| 1 | glutes, hamstrings  | compound  |
| 2 | quads, glutes       | compound  |
| 3 | glutes              | isolation |
| 4 | hamstrings          | isolation |
| 5 | quads               | isolation |
| 6 | calves              | isolation |

Note : 'core' dans focusedMuscles mais aucun slot lower ne cible 'core' → core ajouté en queue via corePool uniquement.

### Étape 5 — Séries × répétitions (hypertrophy, 60 min)

| Slot | Cat      | Séries × Reps | Repos |
|------|----------|---------------|-------|
| 0    | warmup   | 2 × 10        | 0 s   |
| 1    | compound | 4 × 8-12      | 90 s  |
| 2    | compound | 4 × 8-12      | 90 s  |
| 3    | isolation| 3 × 10-15     | 75 s  |
| 4    | isolation| 3 × 10-15     | 75 s  |
| 5    | isolation| 3 × 10-15     | 75 s  |
| 6    | isolation| 3 × 10-15     | 75 s  |
| core | core     | 3 × 15        | 60 s  |

### Assertions [PASS/FAIL]

- `hasLower=true, hasUpper=false` → `'lower'` (core ne neutralise pas) : **PASS** (ligne 263)
- Split = `['lower','lower','lower']` : **PASS**
- `workoutTypeFromFocus(['legs','core'])` ≠ null : **PASS** (hasLower prioritaire)
- BUG3 non déclenché (core seul → null, mais legs+core → lower) : **PASS**

### Coach

**Équilibre musculaire :** Spécialisation lower + gainage en queue = cohérent. Aucun upper — programme de bloc.

**Cohérence objectif :** Correct.

**Durée/contenu :** ~90 min réels vs 60 annoncés. ⚠️

**Équipement BW :** Mêmes risques que P13 — slots isolation jambes (leg extension, leg curl) risquent d'être vides. ⚠️

**Verdict :** ⚠️ Mêmes réserves que P13 sur le BW + slots potentiellement vides. Logique focusMuscles correcte.

---

## P19 — chest+back+legs → null → fullbody par défaut

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:FULL,
  level:'beginner', focusMuscles:['chest','back','legs'] }
```

### Étape 1 — workoutTypeFromFocus(['chest','back','legs'])

| Flag      | Valeur | Raison                    |
|-----------|--------|---------------------------|
| hasLower  | true   | 'legs' présent            |
| hasPush   | true   | 'chest' présent           |
| hasPull   | true   | 'back' présent            |
| hasArms   | false  |                           |
| hasCore   | false  |                           |
| hasUpper  | true   | hasPush=true, hasPull=true |

Branches testées :
1. `hasLower && !hasUpper` → false (hasUpper=true)
2. `hasCore && !hasLower && !hasUpper` → false
3. `hasPush && !hasPull && !hasLower` → false (hasPull=true, hasLower=true)
4. `hasPull && !hasPush && !hasLower` → false
5. `hasUpper && !hasLower` → false (hasLower=true)
6. Aucune branche → **retourne `null`** (ligne 275)

→ **retourne `null`** (ambiguïté hasUpper + hasLower)

### Étape 2 — selectSplit

focusType=null → switch daysPerWeek=2 → **`['fullbody-quad', 'fullbody-hip']`** (ligne 298)

- Types internes : `['fullbody-quad', 'fullbody-hip']`
- Types publics  : `['fullbody', 'fullbody']`
- Noms : "Full Body A", "Full Body B"

### Étape 3 — Slots (60 min, focusedMuscles={chest, chest_upper, chest_lower, back, back_width, back_thickness, quads, hamstrings, glutes, calves})

`adjustedSlotCount(9, 60)` → **9 slots** chacun.

**fullbody-quad (A) reorderSlotsByFocus :**

Original : quads/glutes[cmp, aF=0], chest[cmp, aF=0], back[cmp, aF=0], shoulders[cmp, aF=1], hamstrings[isol, aF=0], shoulders_rear[isol, aF=1], biceps[isol, aF=1], triceps[isol, aF=1], calves[isol, aF=0]

Composés triés : [quads/glutes, chest, back, shoulders] (0,0,0,1 → stables)
Isolations triées : [hamstrings (aF=0), calves (aF=0), shoulders_rear (aF=1), biceps (aF=1), triceps (aF=1)]

| # | Muscles cibles | Cat | Focus? |
|---|---------------|-----|--------|
| 1 | quads, glutes                        | compound  | ✓ |
| 2 | chest, chest_upper                   | compound  | ✓ |
| 3 | back_width, back_thickness, back     | compound  | ✓ |
| 4 | shoulders, shoulders_front           | compound  | ✗ |
| 5 | hamstrings                           | isolation | ✓ |
| 6 | calves                               | isolation | ✓ |
| 7 | shoulders_rear                       | isolation | ✗ |
| 8 | biceps                               | isolation | ✗ |
| 9 | triceps                              | isolation | ✗ |

**fullbody-hip (B) reorderSlotsByFocus :**

Original : hamstrings/glutes[cmp, aF=0], chest[cmp, aF=0], back_width/back[cmp, aF=0], shoulders[cmp, aF=1], quads[isol, aF=0], shoulders_lat/rear[isol, aF=1], biceps[isol, aF=1], triceps[isol, aF=1], calves[isol, aF=0]

Composés triés : [hamstrings/glutes, chest, back, shoulders]
Isolations triées : [quads (aF=0), calves (aF=0), shoulders_lat/rear (aF=1), biceps (aF=1), triceps (aF=1)]

| # | Muscles cibles | Cat | Focus? |
|---|---------------|-----|--------|
| 1 | hamstrings, glutes                   | compound  | ✓ |
| 2 | chest, chest_upper                   | compound  | ✓ |
| 3 | back_width, back                     | compound  | ✓ |
| 4 | shoulders, shoulders_front           | compound  | ✗ |
| 5 | quads                                | isolation | ✓ |
| 6 | calves                               | isolation | ✓ |
| 7 | shoulders_lateral, shoulders_rear    | isolation | ✗ |
| 8 | biceps                               | isolation | ✗ |
| 9 | triceps                              | isolation | ✗ |

### Étape 5 — Séries × répétitions (hypertrophy, 60 min)

| Slot | Cat      | Séries × Reps | Repos |
|------|----------|---------------|-------|
| 0    | warmup   | 2 × 10        | 0 s   |
| 1-4  | compound | 4 × 8-12      | 90 s  |
| 5-9  | isolation| 3 × 10-15     | 75 s  |
| core | core     | 3 × 15        | 60 s  |

Total : 11 exercices par séance (9 + warmup + core).

### Assertions [PASS/FAIL]

- `workoutTypeFromFocus(['chest','back','legs'])` = `null` (hasUpper + hasLower) : **PASS** (ligne 275)
- Split par défaut 2j = `['fullbody','fullbody']` : **PASS** (ligne 298)
- Muscles ciblés (chest/back/legs) remontent en tête via reorderSlotsByFocus : **PASS**

### Coach

**Équilibre musculaire :** Fullbody équilibré. La remontée des slots ciblés (chest, back, legs) est parfaitement pertinente — les muscles importants sont faits en début de séance, quand l'énergie est maximale.

**Cohérence objectif :** 4×8-12 fullbody × 2 → correct pour débutant.

**Durée/contenu :** 11 exercices × ~3.5 min = ~38 min warmup+core inclus... recalcul : 4 composés × 4 sets + 5 isolations × 3 sets + 2 warmup + 3 core = 16+15+2+3 = 36 sets × ~3 min = ~108 min. ⚠️

**Variété structurelle A→B :** fullbody-quad vs fullbody-hip — composé 1 = squat-dominant vs RDL-dominant → variété structurelle réelle. Excellent.

**Verdict :** ✅ Bon programme — reorderSlotsByFocus pertinent, alternance quad/hip. Réserve timing habituelle.

---

## P20 — shoulders+arms → push

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:['dumbbell'],
  level:'beginner', focusMuscles:['shoulders','arms'] }
```

### Étape 1 — workoutTypeFromFocus(['shoulders','arms'])

| Flag      | Valeur | Raison                                   |
|-----------|--------|------------------------------------------|
| hasLower  | false  |                                          |
| hasPush   | true   | `includes('shoulders')` = true           |
| hasPull   | false  |                                          |
| hasArms   | true   | `includes('arms')` = true               |
| hasCore   | false  |                                          |
| hasUpper  | true   | hasPush=true ET hasArms=true            |

Branches testées :
1. `hasLower && !hasUpper` → false
2. `hasCore && !hasLower && !hasUpper` → false
3. `hasPush && !hasPull && !hasLower` → **true → retourne `'push'`** (ligne 269)

La branche `hasUpper && !hasLower` (ligne 273) n'est jamais atteinte car hasPush=true déclenche la branche ligne 269 en premier.

→ **retourne `'push'`**

Contra-exemple : arms seul → hasArms=true, hasPush=false → branche ligne 269 false → branche ligne 273 (`hasUpper && !hasLower`) → retourne `'upper'`. Mais shoulders+arms → hasPush=true → push prioritaire sur upper. **PASS (comportement documenté).**

### Étape 2 — selectSplit

focusType='push' → `['push', 'push']`

- Types internes/publics : `['push', 'push']`
- Noms : "Push — Poussée A", "Push — Poussée B"

### Étape 3 — Slots (60 min, focusedMuscles={shoulders, shoulders_front, shoulders_lateral, shoulders_rear, biceps, triceps, forearms})

`adjustedSlotCount(6, 60)` → **6 slots**.

SLOTS['push'] (indices 0-5) :
- 0 : chest/chest_upper/chest_lower — compound → muscles ∉ focused → aF=1
- 1 : shoulders/shoulders_front — compound → dans focused → aF=0
- 2 : chest/chest_upper/chest_lower — isolation → aF=1
- 3 : triceps — isolation → dans focused (triceps) → aF=0
- 4 : shoulders_lateral/shoulders — isolation → dans focused → aF=0
- 5 : triceps — isolation → dans focused → aF=0

Composés triés : [slot 1 (OHP, aF=0), slot 0 (chest, aF=1)]
Isolations triées : [slot 3 (triceps), slot 4 (lat raise), slot 5 (triceps)] (tous aF=0, ordre stable), puis [slot 2 (chest isol, aF=1)]

Ordre final :

| # | Muscles cibles | Cat | Focus? |
|---|---------------|-----|--------|
| 1 | shoulders, shoulders_front              | compound  | ✓ OHP en tête |
| 2 | chest, chest_upper, chest_lower         | compound  | ✗ |
| 3 | triceps                                 | isolation | ✓ |
| 4 | shoulders_lateral, shoulders            | isolation | ✓ |
| 5 | triceps                                 | isolation | ✓ |
| 6 | chest, chest_upper, chest_lower         | isolation | ✗ |

### Étape 5 — Séries × répétitions (hypertrophy, 60 min)

| Slot | Cat      | Séries × Reps | Repos |
|------|----------|---------------|-------|
| 0    | warmup   | 2 × 10        | 0 s   |
| 1    | compound | 4 × 8-12      | 90 s  |
| 2    | compound | 4 × 8-12      | 90 s  |
| 3    | isolation| 3 × 10-15     | 75 s  |
| 4    | isolation| 3 × 10-15     | 75 s  |
| 5    | isolation| 3 × 10-15     | 75 s  |
| 6    | isolation| 3 × 10-15     | 75 s  |
| core | core     | 3 × 15        | 60 s  |

### Assertions [PASS/FAIL]

- `hasPush=true` (shoulders) → `'push'` prioritaire sur `'upper'` : **PASS** (ligne 269 avant 273)
- Split = `['push','push']` : **PASS**
- OHP (shoulders) en tête (aF=0 vs chest aF=1) : **PASS**
- triceps + lat raise montés avant chest isol : **PASS**

### Coach

**Équilibre musculaire :** Focus shoulders + arms → triceps bien couvert (2 slots, slots 3 et 5). Shoulders bien couvert (OHP + lat raise). **Biceps absent** : SLOTS['push'] ne contient aucun slot biceps. L'utilisateur voulait muscler les bras — seul le triceps est servi par le push, le biceps est structurellement absent.

**Cohérence objectif :** OHP en tête est excellent pour le focus épaules. Double triceps (slots 3 et 5) → sur-représentation triceps relatif au biceps (absent).

**Durée/contenu :** ~90 min réels vs 60 annoncés. ⚠️

**Lacune notable :** L'utilisateur ciblant 'arms' s'attend à un biceps couvert. Dans un programme push, biceps est structurellement absent. Un split 'upper' (si arms seul) couvrirait biceps via SLOTS['upper']. Ici le générateur choisit push car shoulders déclenche hasPush — comportement logique mais potentiellement décevant pour l'utilisateur.

**Verdict :** ⚠️ Problème mineur — biceps non couvert malgré focusMuscles=['arms'] (expected en push, mais contre-intuitif pour l'utilisateur qui voulait "les bras"). Recommandation : documenter ce comportement dans le wizard.

---

## Tableau de synthèse Groupe B

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|--------|---------------------|---------|-------------------|
| P11 | push×2 avec chest en tête (DB) | ✅ PASS | Aucun pull/lower ; timing ~90 min vs 60 ; risque doublon si pool DB chest < 2 exercices compound |
| P12 | pull×3 avec back en tête (BB+DB+CABLE) | ✅ PASS | Aucun push/lower ; timing ~90 min vs 60 |
| P13 | lower×4 alternant quad/hip, noms A/B/C/D (BW) | ✅ PASS | Slots isolation jambes (leg ext, leg curl) probablement vides en BW only ; aucun upper ; timing surestimé |
| P14 | BUG3 : core→null→fullbody×2, jamais lower (BW) | ✅ PASS | timing ~108 min vs 60 ; back compound nécessite pull-up bar en BW |
| P15 | BUG3/4j : core→null→upper/lower A/B, jamais lower×4 (FULL) | ✅ PASS | timing upper ~100 min vs 60 |
| P16 | push×2 avec OHP en tête, shoulders prioritaire (DB) | ✅ PASS | Rear deltoid absent (normal en push) ; aucun pull/lower ; timing ~90 min vs 60 |
| P17 | upper×3 avec chest+back en tête (FULL) | ✅ PASS | Volume élevé pour débutant (upper×3) ; timing ~105 min vs 60 ; variété d'exercices seulement (pas variété structurelle entre A/B/C) |
| P18 | legs+core→lower (core non neutralisant) ; 3 sessions BW | ✅ PASS | Mêmes slots vides BW que P13 ; timing surestimé |
| P19 | hasUpper+hasLower→null→fullbody×2 ; reorder pertinent | ✅ PASS | Timing ~108 min vs 60 (attendu) |
| P20 | shoulders+arms→push (hasPush prioritaire sur hasArms→upper) ; biceps absent | ✅ PASS | Biceps absent malgré focusMuscles=['arms'] ; timing ~90 min vs 60 ; comportement contre-intuitif à documenter |

---

## Synthèse des problèmes ouverts — Groupe B

### Bugs / anomalies logicielles

**Aucun FAIL technique** détecté sur les assertions P11–P20 après refactoring BUG3. Toutes les assertions critiques passent :
- BUG3 (P14, P15) : `focusMuscles:['core']` → null → split par défaut. ✅
- legs+core → lower (P18) : core ne neutralise pas legs. ✅
- Alternance lower-quad/lower-hip sur N jours (P13, P18). ✅
- shoulders+arms → push (hasPush prioritaire, P20). ✅

### Réserves coach cumulées

**Thème 1 — Volume réel vs durée annoncée (tous profils)**
Affecte : P11, P12, P13, P14, P15, P16, P17, P18, P19, P20.
La durée 60 min ne réduit pas le nombre de slots (`adjustedSlotCount(base, 60) → base`). Avec 90 s de repos compound et 75 s isolation, la durée réelle dépasse systématiquement 60 min d'environ 40-70 %. Recommandation : calibrer la base de slots sur un ratio 3-3.5 min/set pour que 60 min = ~18-20 sets = ~7 slots, ou ajouter un facteur de réduction même à 60 min (ex. base × 0.85).

**Thème 2 — Slots isolation jambes vides en BW only (P13, P18)**
Affecte : P13, P18.
Leg extension et leg curl n'ont pas d'équivalent bodyweight standard. Le slot peut retourner `null` → exercice élidé silencieusement. Recommandation : ajouter des exercices BW pour quads isolation (wall squat tenu, sissy squat) et hamstrings isolation (Nordic curl balisé pour débutant) dans le seed, ou afficher un avertissement "équipement insuffisant pour ce slot".

**Thème 3 — Biceps absent en push avec focusMuscles=['arms'] (P20)**
Affecte : P20.
Contre-intuitif : l'utilisateur cible les bras mais push → biceps structurellement absent. Le générateur est logiquement correct (shoulders → hasPush → push), mais l'expérience utilisateur est décevante. Recommandation : dans le wizard, afficher un avertissement "focus bras en push ne couvre pas le biceps — envisagez pull ou upper".

**Thème 4 — Programmes unilatéraux (push only, pull only, lower only)**
Affecte : P11, P12, P13, P16, P17, P18.
Ces programmes créés par focusMuscles n'ont aucune couverture des groupes antagonistes. Acceptable pour un bloc de spécialisation, mais le wizard devrait avertir l'utilisateur qu'il s'agit d'un programme de spécialisation, pas d'un programme complet.

**Thème 5 — Variété structurelle inter-sessions (P17 upper×3)**
Affecte : P17.
Trois séances upper avec `SLOTS['upper']` (pas upper-push/upper-pull) → structure identique pour A/B/C, seuls les exercices varient. Verdict : "Variété d'exercices seulement". En revanche P11/P12/P16 (push×2/pull×3) souffrent du même problème mais avec seulement 2-3 sessions du même type, c'est moins critique. Recommandation : pour focusType='upper' avec N≥2 séances, alterner upper-push/upper-pull comme pour le split par défaut.

**Thème 6 — Dépendance pull-up bar en BW (P14)**
Affecte : P14.
Le slot back compound (back_width) nécessite pull-up/lat pulldown. En BW sans barre de traction, ce slot est probablement vide. Recommandation : inclure dans le seed des exercices de dos bodyweight sans barre (inverted rows sur table, etc.) ou détecter l'absence de substitut.
