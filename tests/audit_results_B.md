# Audit `generateProgramDraft` — Groupe B (P11–P20)
# focusMuscles — override du split

> Coach sportif certifié · Simulation pas à pas selon la méthode `audit_prompt_v3.md`
> Étape 4 (exercices concrets) volontairement omise pour ce groupe — seed non lu.

---

## Données de référence extraites de `programGenerator.ts`

### COMPOUND_SPEC (hypertrophy, seul goal utilisé dans ce groupe)
- **hypertrophy** : sets=4, repsMin=8, repsMax=12, restSec=90

### ISOLATION_SPEC
- **hypertrophy** : sets=3, repsMin=10, repsMax=15, restSec=75

### WARMUP_SPEC : sets=2, reps=10 fixed
### CORE_SPEC : sets=3, reps=15 fixed

### adjustedSpec (durée=60 → inchangé, ligne 439)
Tous les profils P11–P20 utilisent `sessionDuration:60` → `adjustedSpec` retourne les specs brutes sans modification.

### adjustedSlotCount (durée=60, goal=hypertrophy, ligne 427)
`isStrength = false` → retourne `base` inchangé pour 60 min.
Exception : `duration=60, isStrength=true` → `max(3, floor(base×0.75))` — non applicable ici.

### Slots de base (nombre par type interne)
| Type interne | Nb slots base |
|---|---|
| push | 6 |
| pull | 6 |
| lower-quad | 6 |
| lower-hip | 6 |
| upper-push | 8 |
| upper-pull | 8 |
| fullbody-quad | 9 |
| fullbody-hip | 9 |

---

## P11 — chest seul → push

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:DB, level:'beginner',
  focusMuscles:['chest'] }
```

### Étape 1 — workoutTypeFromFocus(['chest']) (lignes 290–322)

Flags calculés (ligne 295–300) :
- `hasLower` = false ('legs' absent)
- `hasPush`  = true  ('chest' ∈ {chest, shoulders} — ligne 297)
- `hasPull`  = false ('back' absent)
- `hasArms`  = false ('arms' absent)
- `hasCore`  = false ('core' absent)
- `hasUpper` = hasPush || hasPull || hasArms = **true**

Règles appliquées :
1. `hasLower && !hasUpper` → false
2. `hasCore && !hasLower && !hasUpper` → false
3. `hasPush && !hasPull && !hasLower` → **true** → **return 'push'** (ligne 309)

**focusType = `'push'`**

### Étape 2 — selectSplit (lignes 324–377)

`focusType` = 'push' ≠ 'lower' ≠ 'upper' → branche générique (ligne 344) :
```ts
Array.from({ length: 2 }, () => 'push')
```
**Split = `['push', 'push']`**

Jours (DAY_ASSIGNMENTS[2], ligne 384) : lundi, jeudi.
Nommage : totalOfType=2 → suffixe A/B → "Push — Poussée A", "Push — Poussée B"

### Étape 3 — adjustedSlotCount + slots ordonnés

`adjustedSlotCount(6, 60, 'hypertrophy')` = 6 (non-strength, 60 min → base inchangé)

`focusedMuscles` = Set(['chest', 'chest_upper', 'chest_lower']) (FOCUS_TO_MUSCLES['chest'], ligne 21)

**reorderSlotsByFocus (lignes 478–488) :**

SLOTS['push'] bruts (lignes 111–117) :
| # | Muscles | Cat |
|---|---------|-----|
| 1 | chest / chest_upper / chest_lower | compound |
| 2 | shoulders / shoulders_front | compound |
| 3 | chest / chest_upper / chest_lower | isolation |
| 4 | triceps | isolation |
| 5 | shoulders_lateral / shoulders | isolation |
| 6 | triceps | isolation |

Tri composés par focus (aF=0 si muscle∈focused) :
- slot 1 : chest∈focused → aF=0
- slot 2 : shoulders∉focused → aF=1
→ Composés réordonnés : [slot1 (chest), slot2 (shoulders)]

Tri isolations :
- slot 3 : chest∈focused → aF=0
- slot 4 : triceps∉focused → aF=1
- slot 5 : shoulders_lateral∉focused → aF=1
- slot 6 : triceps∉focused → aF=1
→ Isolations réordonnées : [slot3 (chest), slot4 (triceps), slot5 (shoulders_lat), slot6 (triceps)]

**Ordre final des slots (les 6 pris) :**
1. chest/chest_upper/chest_lower — compound
2. shoulders/shoulders_front — compound
3. chest/chest_upper/chest_lower — isolation
4. triceps — isolation
5. shoulders_lateral/shoulders — isolation
6. triceps — isolation

### Étape 5 — Séries × répétitions

Tous les profils 60 min → `adjustedSpec` inchangé.
- Compound hypertrophy : **4×8-12**
- Isolation hypertrophy : **3×10-15**
- Warmup : **2×10** (fixed)
- Core : **3×15** (fixed)

### Étape 6 — Tableau récapitulatif

**Push A (lundi) — 8 exercices au total**

| # | Slot (muscles cibles) | Cat | Séries×Reps |
|---|----------------------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | chest / chest_upper / chest_lower | Compound | 4×8-12 |
| 2 | shoulders / shoulders_front | Compound | 4×8-12 |
| 3 | chest / chest_upper / chest_lower | Isolation | 3×10-15 |
| 4 | triceps | Isolation | 3×10-15 |
| 5 | shoulders_lateral / shoulders | Isolation | 3×10-15 |
| 6 | triceps | Isolation | 3×10-15 |
| 7 | Core | — | 3×15 |

**Push B (jeudi) — structure identique, exercices différents (usedGlobally de A)**

| # | Slot (muscles cibles) | Cat | Séries×Reps |
|---|----------------------|-----|-------------|
| 0 | Warmup (rotation pool) | — | 2×10 |
| 1 | chest / chest_upper / chest_lower | Compound | 4×8-12 |
| 2 | shoulders / shoulders_front | Compound | 4×8-12 |
| 3 | chest / chest_upper / chest_lower | Isolation | 3×10-15 |
| 4 | triceps | Isolation | 3×10-15 |
| 5 | shoulders_lateral / shoulders | Isolation | 3×10-15 |
| 6 | triceps | Isolation | 3×10-15 |
| 7 | Core (rotation pool) | — | 3×15 |

### Assertions : [PASS/FAIL]

- `workoutTypeFromFocus(['chest'])` = 'push' : **PASS** (ligne 309)
- Split = `['push','push']` : **PASS** (ligne 344)
- `adjustedSlotCount(6, 60, 'hypertrophy')` = 6 : **PASS** (ligne 428)
- chest compound en position 1 (reorderSlotsByFocus) : **PASS** (ligne 485)
- 8 exercices par workout (6 + warmup + core) : **PASS**

### Coach

**Équilibre musculaire :** La poitrine est bien couverte (1 composé + 1 isolation). Les épaules sont présentes (1 composé + 1 isolation latéral). Les **triceps ont 2 slots isolation** — redondant pour un débutant, mais cohérent avec la logique push. **Dos et biceps totalement absents** — intentionnel pour un programme focus push, mais sur 2 séances/semaine sans pull day, ce déséquilibre agoniste/antagoniste est problématique à long terme.

**Cohérence objectif :** 4×8-12 composé, 3×10-15 isolation → zone hypertrophie respectée ✅.

**Durée/contenu :** 6 exercices de travail + warmup + core. Estimation : (4 sets × 90 s repos × 2 composés) + (3 sets × 75 s repos × 4 isolations) ≈ 19 min repos + temps de travail ≈ ~40-45 min → tient dans 60 min ✅.

**Équipement DB :** Pas de barre → développé haltères (moins de charge possible qu'un bench barbell). OHP DB acceptable. Variété de chest en DB-only : limitée (développé couché + développé incliné ou écarté). Pool push en DB = restreint.

**Variété inter-sessions :** Structure A et B identique (mêmes slots) → **variété d'exercices uniquement**. Pool DB chest composé = 2-3 exercices max → **risque de répétition** entre A et B si pool insuffisant.

**Couverture isolation :** Dos absent (intentionnel), biceps absent (intentionnel push). Mollets absents (pas de slot calves en push) — **lacune acceptable** (pas de jambes dans ce programme). 2 slots triceps = légèrement sur-représenté.

**Verdict : ⚠️ Problème mineur** — Déséquilibre push/pull sur la semaine entière (aucun pull day). Acceptable si l'utilisateur combine avec un autre programme ou du sport, mais en programme autonome, à signaler à l'utilisateur.

---

## P12 — back seul → pull

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:BB+DB+CABLE, level:'beginner',
  focusMuscles:['back'] }
```

### Étape 1 — workoutTypeFromFocus(['back'])

Flags :
- `hasLower` = false
- `hasPush`  = false
- `hasPull`  = true ('back' — ligne 298)
- `hasArms`  = false
- `hasCore`  = false
- `hasUpper` = true (hasPull)

Règles :
1. `hasLower && !hasUpper` → false
2. `hasCore && …` → false
3. `hasPush && !hasPull && !hasLower` → false
4. `hasPull && !hasPush && !hasLower` → **true** → **return 'pull'** (ligne 311)

**focusType = `'pull'`**

### Étape 2 — selectSplit

`focusType` = 'pull' → branche générique (ligne 344) :
```ts
Array.from({ length: 3 }, () => 'pull')
```
**Split = `['pull', 'pull', 'pull']`**

Jours : lundi, mercredi, vendredi.
Nommage : totalOfType=3 → "Pull — Tirage A", "Pull — Tirage B", "Pull — Tirage C"

### Étape 3 — adjustedSlotCount + slots ordonnés

`adjustedSlotCount(6, 60, 'hypertrophy')` = 6

`focusedMuscles` = Set(['back', 'back_width', 'back_thickness'])

SLOTS['pull'] bruts (lignes 119–125) :
| # | Muscles | Cat |
|---|---------|-----|
| 1 | back_width / back | compound |
| 2 | back_thickness / back | compound |
| 3 | back_thickness / back_width / back | isolation |
| 4 | biceps | isolation |
| 5 | shoulders_rear | isolation |
| 6 | forearms | isolation |

reorderSlotsByFocus :
- Composés : slot1 (back∈focused → aF=0), slot2 (back∈focused → aF=0) → ordre préservé
- Isolations : slot3 (back∈focused → aF=0), slot4 (biceps∉focused → aF=1), slot5 (shoulders_rear∉focused → aF=1), slot6 (forearms∉focused → aF=1) → [slot3, slot4, slot5, slot6]

**Ordre final : identique aux slots bruts** — tous les slots dos déjà en tête dans le template pull.

### Étape 5 — Séries × répétitions
- Compound : **4×8-12**
- Isolation : **3×10-15**
- Warmup : **2×10** · Core : **3×15**

### Étape 6 — Tableau récapitulatif

**Pull A (lundi) — 8 exercices**

| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | back_width / back | Compound | 4×8-12 |
| 2 | back_thickness / back | Compound | 4×8-12 |
| 3 | back_thickness / back_width / back | Isolation | 3×10-15 |
| 4 | biceps | Isolation | 3×10-15 |
| 5 | shoulders_rear | Isolation | 3×10-15 |
| 6 | forearms | Isolation | 3×10-15 |
| 7 | Core | — | 3×15 |

**Pull B (mercredi) et Pull C (vendredi) : même structure, usedGlobally croissant**

### Assertions : [PASS/FAIL]

- `workoutTypeFromFocus(['back'])` = 'pull' : **PASS** (ligne 311)
- Split = `['pull','pull','pull']` : **PASS** (ligne 344)
- `adjustedSlotCount(6, 60, 'hypertrophy')` = 6 : **PASS**
- Slots dos en tête après reorder : **PASS**
- 8 exercices par workout : **PASS**

### Coach

**Équilibre musculaire :** Le dos est très bien couvert : 2 composés (tirage vertical + rowing) + 1 isolation. Biceps et épaules arrière = accessoires tirage → logique. Avant-bras = bonus. **Aucun push** — déséquilibre sur la semaine entière en programme autonome 3 jours.

**Cohérence objectif :** Zones hypertrophie respectées ✅.

**Durée/contenu :** ~40-45 min estimés → tient dans 60 min ✅.

**Équipement BB+DB+CABLE :** Excellent pour le pull : lat pulldown câble, rowing barre, rowing DB, curl barre/haltères — pool riche, variété possible sur 3 sessions.

**Variété inter-sessions :** Structure identique (mêmes slots) → variété d'exercices uniquement. **Pool BB+DB+CABLE = suffisamment large** pour 3 sessions sans répétition (lat pulldown / traction / rowing barre / rowing DB / curl barre / curl incliné…). Verdict : **variété d'exercices suffisante**.

**Couverture isolation :** Dos isolation présent ✅. Chest/shoulders/triceps absents = intentionnel (pull day). Mollets absents — lacune acceptable (pas de jambes).

**Verdict : ✅ Bon programme** — programme focus tirage cohérent. Déséquilibre push/pull sur la semaine = même réserve que P11, mais la séquence A/B/C a un pool suffisant.

---

## P13 — legs seul → lower

```
{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:BW, level:'beginner',
  focusMuscles:['legs'] }
```

### Étape 1 — workoutTypeFromFocus(['legs'])

Flags :
- `hasLower` = true ('legs' — ligne 296)
- `hasPush`  = false
- `hasPull`  = false
- `hasArms`  = false
- `hasCore`  = false
- `hasUpper` = false

Règle 1 : `hasLower && !hasUpper` → **true** → **return 'lower'** (ligne 303)

**focusType = `'lower'`**

### Étape 2 — selectSplit

`focusType === 'lower'` → branche spéciale (lignes 334–338) :
```ts
Array.from({ length: 4 }, (_, i) => i % 2 === 0 ? 'lower-quad' : 'lower-hip')
```
**Split interne = `['lower-quad', 'lower-hip', 'lower-quad', 'lower-hip']`**
**Split public = `['lower', 'lower', 'lower', 'lower']`**

Jours (DAY_ASSIGNMENTS[4], ligne 386) : lundi, mardi, jeudi, vendredi.

Nommage (totalOfType=4, tous → public 'lower') :
- lower-quad (count=1) → "Lower — Bas du corps A"
- lower-hip  (count=2) → "Lower — Bas du corps B"
- lower-quad (count=3) → "Lower — Bas du corps C"
- lower-hip  (count=4) → "Lower — Bas du corps D"

### Étape 3 — adjustedSlotCount + slots ordonnés

`adjustedSlotCount(6, 60, 'hypertrophy')` = 6 (pour lower-quad et lower-hip)

`focusedMuscles` = Set(['quads', 'hamstrings', 'glutes', 'calves'])

**SLOTS['lower-quad'] (lignes 193–202) :**
| # | Muscles | Cat |
|---|---------|-----|
| 1 | quads / glutes | compound |
| 2 | hamstrings / glutes | compound |
| 3 | quads | isolation |
| 4 | glutes | isolation |
| 5 | hamstrings | isolation |
| 6 | calves | isolation |

Tous les muscles de ces slots ∈ focusedMuscles → aF=0 pour tous → **pas de réordonnancement**.

**SLOTS['lower-hip'] (lignes 203–212) :**
| # | Muscles | Cat |
|---|---------|-----|
| 1 | glutes / hamstrings | compound |
| 2 | quads / glutes | compound |
| 3 | glutes | isolation |
| 4 | hamstrings | isolation |
| 5 | quads | isolation |
| 6 | calves | isolation |

Même conclusion : tous focalisés → **pas de réordonnancement**.

### Étape 5 — Séries × répétitions
- Compound : **4×8-12**
- Isolation : **3×10-15**
- Warmup : **2×10** · Core : **3×15**

### Étape 6 — Tableau récapitulatif

**Lower A — lower-quad (lundi) — 8 exercices**

| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | quads / glutes | Compound | 4×8-12 |
| 2 | hamstrings / glutes | Compound | 4×8-12 |
| 3 | quads | Isolation | 3×10-15 |
| 4 | glutes | Isolation | 3×10-15 |
| 5 | hamstrings | Isolation | 3×10-15 |
| 6 | calves | Isolation | 3×10-15 |
| 7 | Core | — | 3×15 |

**Lower B — lower-hip (mardi) — 8 exercices**

| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | glutes / hamstrings | Compound | 4×8-12 |
| 2 | quads / glutes | Compound | 4×8-12 |
| 3 | glutes | Isolation | 3×10-15 |
| 4 | hamstrings | Isolation | 3×10-15 |
| 5 | quads | Isolation | 3×10-15 |
| 6 | calves | Isolation | 3×10-15 |
| 7 | Core | — | 3×15 |

**Lower C (jeudi) = structure identique à Lower A (lower-quad)**
**Lower D (vendredi) = structure identique à Lower B (lower-hip)**

### Assertions : [PASS/FAIL]

- `workoutTypeFromFocus(['legs'])` = 'lower' : **PASS** (ligne 303)
- Split interne = `['lower-quad','lower-hip','lower-quad','lower-hip']` : **PASS** (lignes 334–338)
- Split public = `['lower','lower','lower','lower']` : **PASS**
- Noms A/B/C/D : **PASS** (compteur canon='lower', count 1→4)
- Structure différenciée lower-quad vs lower-hip : **PASS** (composé quad-first vs hip-first)
- `adjustedSlotCount(6,60,'hypertrophy')` = 6 : **PASS**
- 8 exercices par workout : **PASS**

### Coach

**Équilibre musculaire :** Quads, hamstrings, glutes, calves — tout le bas du corps couvert ✅. Haut du corps absent (intentionnel = focus jambes). Core ajouté en fin de séance via corePool ✅.

**Cohérence objectif :** 4×8-12 / 3×10-15 → zone hypertrophie ✅.

**Durée/contenu :** 6 exercices de travail + warmup + core → ~40-45 min / 60 min ✅.

**Équipement BW :** Pool poids du corps pour le bas du corps = **très limité** : squat BW, fente avant/arrière, fente bulgare (si chaise), glute bridge, step-up (si banc), nordic curl (complexe). Leg extension, leg curl machine = impossibles. **Le slot composé quads/glutes** en BW se résoudra sur squat poids du corps ou fente — masse musculaire mais intensité limitée. Pool risque d'être insuffisant pour 4 sessions (A/C identiques, B/D identiques) avec usedGlobally.

**Variété inter-sessions :** A et C = même template lower-quad → **variété d'exercices seulement** entre A et C. B et D = même template lower-hip → idem. **Risque de répétition réel en BW-only** : si le pool BW quads composé = 2 exercices seulement (squat + fente), la session C n'aura plus de candidat "nouveau" pour le slot composé quads.

**Couverture isolation :** Toutes les grandes chaînes du bas du corps ont un slot isolation dédié ✅. Lacune notable : **pas d'isolation mollets en BW** efficace (les exercices calves BW = montée sur pointes, peu stimulants comparés à une machine).

**Verdict : ⚠️ Problème mineur** — Programme cohérent pour le focus bas du corps, mais l'équipement BW-only est un vrai facteur limitant : pool extrêmement restreint, risque de répétition dès la session C, charge de progression nulle (BW = même poids). À signaler à l'utilisateur.

---

## P14 — [RÉGRESSION BUG #3] core seul → fullbody

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:BW, level:'beginner',
  focusMuscles:['core'] }
```

### Étape 1 — workoutTypeFromFocus(['core'])

Flags :
- `hasLower` = false
- `hasPush`  = false
- `hasPull`  = false
- `hasArms`  = false
- `hasCore`  = true ('core' — ligne 299)
- `hasUpper` = false

Règles :
1. `hasLower && !hasUpper` → false
2. `hasCore && !hasLower && !hasUpper` → **true** → **return null** (ligne 307)
   _(Commentaire du code : "le générateur produit un fullbody équilibré avec un exercice core ajouté en queue")_

**focusType = `null`** — BUG#3 : jamais 'lower' pour un focus core seul ✅

### Étape 2 — selectSplit

`focusType = null` → split par défaut.
`daysPerWeek = 2` → `case 2 : return ['fullbody-quad', 'fullbody-hip']` (ligne 350)

**Split = `['fullbody-quad', 'fullbody-hip']`** — JAMAIS `['lower','lower']` ✅

Jours : lundi, jeudi.
Nommage (totalOfType=2) : "Full Body A", "Full Body B"

### Étape 3 — adjustedSlotCount + slots ordonnés

`adjustedSlotCount(9, 60, 'hypertrophy')` = 9

`focusedMuscles` = Set(['core'])

reorderSlotsByFocus : aucun slot de fullbody-quad ni fullbody-hip ne liste 'core' dans ses muscles → tous aF=1 → **pas de réordonnancement**. L'ordre d'origine est conservé.

**SLOTS['fullbody-quad'] (lignes 252–264) — ordre conservé :**
| # | Muscles | Cat |
|---|---------|-----|
| 1 | quads / glutes | compound |
| 2 | chest / chest_upper | compound |
| 3 | back_width / back_thickness / back | compound |
| 4 | shoulders / shoulders_front | compound |
| 5 | hamstrings | isolation |
| 6 | shoulders_rear | isolation |
| 7 | biceps | isolation |
| 8 | triceps | isolation |
| 9 | calves | isolation |

**SLOTS['fullbody-hip'] (lignes 265–277) — ordre conservé :**
| # | Muscles | Cat |
|---|---------|-----|
| 1 | hamstrings / glutes | compound |
| 2 | chest / chest_upper | compound |
| 3 | back_width / back | compound |
| 4 | shoulders / shoulders_front | compound |
| 5 | quads | isolation |
| 6 | shoulders_lateral / shoulders_rear | isolation |
| 7 | biceps | isolation |
| 8 | triceps | isolation |
| 9 | calves | isolation |

### Étape 5 — Séries × répétitions
- Compound : **4×8-12** · Isolation : **3×10-15**
- Warmup : **2×10** · Core : **3×15**

### Étape 6 — Tableau récapitulatif

**Full Body A — fullbody-quad (lundi) — 11 exercices**

| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | quads / glutes | Compound | 4×8-12 |
| 2 | chest / chest_upper | Compound | 4×8-12 |
| 3 | back_width / back_thickness / back | Compound | 4×8-12 |
| 4 | shoulders / shoulders_front | Compound | 4×8-12 |
| 5 | hamstrings | Isolation | 3×10-15 |
| 6 | shoulders_rear | Isolation | 3×10-15 |
| 7 | biceps | Isolation | 3×10-15 |
| 8 | triceps | Isolation | 3×10-15 |
| 9 | calves | Isolation | 3×10-15 |
| 10 | Core (via corePool) | — | 3×15 |

**Full Body B — fullbody-hip (jeudi) — 11 exercices**

| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | hamstrings / glutes | Compound | 4×8-12 |
| 2 | chest / chest_upper | Compound | 4×8-12 |
| 3 | back_width / back | Compound | 4×8-12 |
| 4 | shoulders / shoulders_front | Compound | 4×8-12 |
| 5 | quads | Isolation | 3×10-15 |
| 6 | shoulders_lateral / shoulders_rear | Isolation | 3×10-15 |
| 7 | biceps | Isolation | 3×10-15 |
| 8 | triceps | Isolation | 3×10-15 |
| 9 | calves | Isolation | 3×10-15 |
| 10 | Core (via corePool) | — | 3×15 |

### Assertions : [PASS/FAIL]

- `workoutTypeFromFocus(['core'])` = null (ligne 307) : **PASS** — BUG#3 non reproduit ✅
- Split = `['fullbody-quad','fullbody-hip']` : **PASS** — jamais `['lower','lower']` ✅
- Core ajouté en queue via corePool (ligne 770–776) : **PASS**
- `adjustedSlotCount(9, 60, 'hypertrophy')` = 9 : **PASS**
- 11 exercices par workout (9+warmup+core) : **PASS**

### Coach

**Équilibre musculaire :** Fullbody complet avec 4 composés multi-articulaires + 5 isolations → couverture totale du corps ✅. Push/pull bien équilibré (chest + back + shoulders).

**Cohérence objectif :** Zone hypertrophie respectée ✅.

**Durée/contenu :** 11 exercices × durée estimée. En BW : repos plus courts car charges moindres. (4×8-12 BW + 90s × 4 composés) + (3×10-15 BW + 75s × 5 isolations) ≈ 14 min repos composés + 11 min repos isolations + temps de séries ≈ 50-55 min → limite haute de 60 min ⚠️.

**Équipement BW :** Slot back_width/back_thickness compound = **traction** (pull-up). Si l'utilisateur n'a pas de barre de traction, ce slot sera vide ou rempli par un fallback inadapté. **Point critique pour BW-only** : le slot tirage dos composé est le plus problématique.

**Variété structurelle A/B :** fullbody-quad vs fullbody-hip = **différenciation structurelle** (composé quad-first vs hip-first) ✅. Deux séances structurellement distinctes.

**Couverture isolation :** Toutes les chaînes principales couvertes ✅. Pas de slot core dédié en isolation (core géré via corePool = exercice ajouté en queue) ✅ — c'est précisément ce que l'utilisateur voulait.

**UX / Pertinence :** Un utilisateur qui sélectionne 'core' attend peut-être un programme gainage/abdos, pas un fullbody complet. Le fallback null→fullbody est techniquement correct (code) mais peut surprendre l'utilisateur (UX). Le core n'est pas le focus structurel — il est juste ajouté en queue comme sur n'importe quel programme.

**Verdict : ✅ Bon programme** (code correct, BUG#3 validé) avec réserve UX : l'utilisateur "core seul" reçoit un fullbody générique — inadéquation entre l'intention déclarée et le programme produit.

---

## P15 — [RÉGRESSION BUG #3 / 4j] core seul → split défaut upper/lower

```
{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'beginner',
  focusMuscles:['core'] }
```

### Étape 1 — workoutTypeFromFocus(['core'])

Identique à P14 :
- `hasCore=true, hasLower=false, hasUpper=false` → **return null** (ligne 307)

**focusType = `null`** — BUG#3 validé ✅

### Étape 2 — selectSplit

`focusType = null` → split par défaut.
`daysPerWeek = 4`, `goal = 'hypertrophy'` → `isMass = true`.

Branche `case 4` (lignes 360–366) :
```ts
if (isMass) return ['upper-push', 'lower-quad', 'upper-pull', 'lower-hip']
```
`isMass = true` → première condition → **retour immédiat**, indépendamment du niveau.

**Split interne = `['upper-push', 'lower-quad', 'upper-pull', 'lower-hip']`**
**Split public = `['upper', 'lower', 'upper', 'lower']`**

Jours : lundi, mardi, jeudi, vendredi.

Nommage :
- upper-push (count=1, totalOfType upper=2) → "Upper — Haut du corps A"
- lower-quad (count=1, totalOfType lower=2) → "Lower — Bas du corps A"
- upper-pull (count=2) → "Upper — Haut du corps B"
- lower-hip  (count=2) → "Lower — Bas du corps B"

### Étape 3 — adjustedSlotCount + slots ordonnés

| Session | Type interne | Base slots | adjustedSlotCount(base,60,hyp) | Slots retenus |
|---------|-------------|-----------|-------------------------------|---------------|
| Upper A | upper-push | 8 | 8 | 8 |
| Lower A | lower-quad | 6 | 6 | 6 |
| Upper B | upper-pull | 8 | 8 | 8 |
| Lower B | lower-hip | 6 | 6 | 6 |

`focusedMuscles` = Set(['core']) → aucun slot ne cible 'core' → **pas de réordonnancement** dans aucune session.

Ordre des slots pour chaque session = identique aux templates SLOTS (lignes 166–212).

**Upper A (upper-push) — 8 slots dans l'ordre brut :**
1. chest / chest_upper — compound
2. back_width / back_thickness / back — compound
3. shoulders / shoulders_front — compound
4. chest / chest_lower / chest_upper — isolation
5. triceps — isolation
6. shoulders_lateral — isolation
7. biceps — isolation
8. back_thickness / back — isolation

**Lower A (lower-quad) — 6 slots :**
1. quads / glutes — compound
2. hamstrings / glutes — compound
3. quads — isolation
4. glutes — isolation
5. hamstrings — isolation
6. calves — isolation

**Upper B (upper-pull) — 8 slots dans l'ordre brut :**
1. back_width / back — compound
2. back_thickness / back — compound
3. chest / chest_upper — compound
4. shoulders_rear — isolation
5. biceps — isolation
6. back_thickness / back — isolation
7. triceps — isolation
8. shoulders_lateral — isolation

**Lower B (lower-hip) — 6 slots :**
1. glutes / hamstrings — compound
2. quads / glutes — compound
3. glutes — isolation
4. hamstrings — isolation
5. quads — isolation
6. calves — isolation

### Étape 5 — Séries × répétitions
- Compound : **4×8-12** · Isolation : **3×10-15**
- Warmup : **2×10** · Core : **3×15**

### Étape 6 — Tableau récapitulatif

**Upper A — upper-push (lundi) — 10 exercices**

| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | chest / chest_upper | Compound | 4×8-12 |
| 2 | back_width / back_thickness / back | Compound | 4×8-12 |
| 3 | shoulders / shoulders_front | Compound | 4×8-12 |
| 4 | chest / chest_lower / chest_upper | Isolation | 3×10-15 |
| 5 | triceps | Isolation | 3×10-15 |
| 6 | shoulders_lateral | Isolation | 3×10-15 |
| 7 | biceps | Isolation | 3×10-15 |
| 8 | back_thickness / back | Isolation | 3×10-15 |
| 9 | Core | — | 3×15 |

**Lower A — lower-quad (mardi) — 8 exercices**

| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | quads / glutes | Compound | 4×8-12 |
| 2 | hamstrings / glutes | Compound | 4×8-12 |
| 3 | quads | Isolation | 3×10-15 |
| 4 | glutes | Isolation | 3×10-15 |
| 5 | hamstrings | Isolation | 3×10-15 |
| 6 | calves | Isolation | 3×10-15 |
| 7 | Core | — | 3×15 |

**Upper B — upper-pull (jeudi) — 10 exercices**

| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | back_width / back | Compound | 4×8-12 |
| 2 | back_thickness / back | Compound | 4×8-12 |
| 3 | chest / chest_upper | Compound | 4×8-12 |
| 4 | shoulders_rear | Isolation | 3×10-15 |
| 5 | biceps | Isolation | 3×10-15 |
| 6 | back_thickness / back | Isolation | 3×10-15 |
| 7 | triceps | Isolation | 3×10-15 |
| 8 | shoulders_lateral | Isolation | 3×10-15 |
| 9 | Core | — | 3×15 |

**Lower B — lower-hip (vendredi) — 8 exercices**

| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | glutes / hamstrings | Compound | 4×8-12 |
| 2 | quads / glutes | Compound | 4×8-12 |
| 3 | glutes | Isolation | 3×10-15 |
| 4 | hamstrings | Isolation | 3×10-15 |
| 5 | quads | Isolation | 3×10-15 |
| 6 | calves | Isolation | 3×10-15 |
| 7 | Core | — | 3×15 |

### Assertions : [PASS/FAIL]

- `workoutTypeFromFocus(['core'])` = null : **PASS** — BUG#3 non reproduit ✅
- Split = `['upper','lower','upper','lower']` public : **PASS** — jamais `['lower','lower','lower','lower']` ✅
- `adjustedSlotCount` correct pour les 4 sessions : **PASS**
- Exercices par workout : upper=10, lower=8 : **PASS**

### Coach

**Équilibre musculaire :** Programme 4j upper/lower équilibré haut/bas (2 upper + 2 lower) ✅. Push/pull différencié entre Upper A (bench-first) et Upper B (traction-first) ✅.

**Cohérence objectif :** Hypertrophie 4×8-12 / 3×10-15 = correct ✅.

**Durée/contenu :** Upper = 10 exercices (~48-52 min en hypertrophie 90s repos) → limite haute. Lower = 8 exercices (~38-42 min) → confortable. Équipement FULL = pas de contrainte.

**Variété structurelle :** Upper A vs Upper B = différenciation structurelle ✅. Lower A vs Lower B = différenciation structurelle ✅.

**Couverture isolation :** Core en queue de chaque session ✅ — c'est l'objectif déclaré. Couverture globale complète.

**UX :** Même réserve que P14 — l'utilisateur "core" reçoit un programme upper/lower complet sans que le core soit le focus structurel. La logique est correcte, mais l'expérience utilisateur mérite une note explicative dans le wizard.

**Verdict : ✅ Bon programme** (code correct, BUG#3 validé) avec même réserve UX que P14.

---

## P16 — shoulders seul → push

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:DB, level:'beginner',
  focusMuscles:['shoulders'] }
```

### Étape 1 — workoutTypeFromFocus(['shoulders'])

Flags :
- `hasLower` = false
- `hasPush`  = true ('shoulders' ∈ {chest, shoulders} — ligne 297)
- `hasPull`  = false
- `hasArms`  = false
- `hasCore`  = false
- `hasUpper` = true

Règle 3 : `hasPush && !hasPull && !hasLower` → **true** → **return 'push'** (ligne 309)

**focusType = `'push'`**

### Étape 2 — selectSplit

**Split = `['push', 'push']`** (ligne 344)

Jours : lundi, jeudi. Noms : "Push — Poussée A", "Push — Poussée B"

### Étape 3 — adjustedSlotCount + slots ordonnés

`adjustedSlotCount(6, 60, 'hypertrophy')` = 6

`focusedMuscles` = Set(['shoulders', 'shoulders_front', 'shoulders_lateral', 'shoulders_rear'])

SLOTS['push'] bruts :
1. chest / chest_upper / chest_lower — compound
2. shoulders / shoulders_front — compound
3. chest / chest_upper / chest_lower — isolation
4. triceps — isolation
5. shoulders_lateral / shoulders — isolation
6. triceps — isolation

reorderSlotsByFocus :

Composés :
- slot 1 : chest∉focused → aF=1
- slot 2 : shoulders∈focused → aF=0
→ **Réordonnancement** : [slot2 (shoulders cmp), slot1 (chest cmp)]

Isolations :
- slot 3 : chest∉focused → aF=1
- slot 4 : triceps∉focused → aF=1
- slot 5 : shoulders_lateral∈focused → aF=0
- slot 6 : triceps∉focused → aF=1
→ Réordonnés : [slot5 (shoulders_lat), slot3 (chest isol), slot4 (triceps), slot6 (triceps)]

**Ordre final :**
1. shoulders / shoulders_front — compound ← **remonté en tête**
2. chest / chest_upper / chest_lower — compound
3. shoulders_lateral / shoulders — isolation ← **remonté**
4. chest / chest_upper / chest_lower — isolation
5. triceps — isolation
6. triceps — isolation

### Étape 5 — Séries × répétitions
- Compound : **4×8-12** · Isolation : **3×10-15**
- Warmup : **2×10** · Core : **3×15**

### Étape 6 — Tableau récapitulatif

**Push A (lundi) — 8 exercices**

| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | shoulders / shoulders_front | Compound | 4×8-12 |
| 2 | chest / chest_upper / chest_lower | Compound | 4×8-12 |
| 3 | shoulders_lateral / shoulders | Isolation | 3×10-15 |
| 4 | chest / chest_upper / chest_lower | Isolation | 3×10-15 |
| 5 | triceps | Isolation | 3×10-15 |
| 6 | triceps | Isolation | 3×10-15 |
| 7 | Core | — | 3×15 |

**Push B (jeudi) — structure identique, exercices différents**

### Assertions : [PASS/FAIL]

- `workoutTypeFromFocus(['shoulders'])` = 'push' : **PASS** (ligne 309)
- Split = `['push','push']` : **PASS**
- Shoulders compound en position 1 (reorderSlotsByFocus) : **PASS** ✅
- `adjustedSlotCount(6,60,'hypertrophy')` = 6 : **PASS**
- 8 exercices par workout : **PASS**

### Coach

**Équilibre musculaire :** Les épaules passent bien en tête grâce à reorderSlotsByFocus ✅ (OHP + latéraux prioritaires). Poitrine présente en composé + isolation. Triceps = 2 slots (même remarque que P11). **Dos/biceps absents** — même déséquilibre push/pull que P11.

**Cohérence objectif :** Zone hypertrophie ✅.

**Durée/contenu :** ~40-45 min ✅.

**Équipement DB :** OHP dumbbell, élévations latérales DB = OK pour épaules. Pas de barre pour développé incliné → DB bench. Pool DB-only suffisant pour 2 sessions push.

**Variété A→B :** Même structure → variété d'exercices uniquement. Pool DB push acceptable pour 2 sessions sans répétition problématique.

**Couverture isolation :** Shoulders_rear absent (pas de slot face pull / écarté penché dans le template push) — **lacune problématique** pour un focus épaules complet : la tête postérieure de l'épaule n'est pas couverte, ce qui peut créer un déséquilibre interne de l'épaule (sur-développement antérieur/latéral vs postérieur).

**Verdict : ⚠️ Problème mineur** — OHP et latéraux bien priorisés, mais l'épaule postérieure (face pull, écarté penché) absente du template push. Déséquilibre push/pull sur la semaine entière.

---

## P17 — chest+back → upper

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner',
  focusMuscles:['chest','back'] }
```

### Étape 1 — workoutTypeFromFocus(['chest','back'])

Flags :
- `hasLower` = false
- `hasPush`  = true ('chest')
- `hasPull`  = true ('back')
- `hasArms`  = false
- `hasCore`  = false
- `hasUpper` = true

Règles :
1-2. false
3. `hasPush && !hasPull && !hasLower` → false (hasPull=true)
4. `hasPull && !hasPush && !hasLower` → false (hasPush=true)
5. `hasUpper && !hasLower` → **true** → **return 'upper'** (ligne 313)

**focusType = `'upper'`**

### Étape 2 — selectSplit

`focusType === 'upper'` → branche spéciale (lignes 339–342) :
```ts
Array.from({ length: 3 }, (_, i) => i % 2 === 0 ? 'upper-push' : 'upper-pull')
```
**Split interne = `['upper-push', 'upper-pull', 'upper-push']`**
**Split public = `['upper', 'upper', 'upper']`**

Jours : lundi, mercredi, vendredi.

Nommage (totalOfType upper=3) :
- upper-push (count=1) → "Upper — Haut du corps A"
- upper-pull (count=2) → "Upper — Haut du corps B"
- upper-push (count=3) → "Upper — Haut du corps C"

### Étape 3 — adjustedSlotCount + slots ordonnés

`adjustedSlotCount(8, 60, 'hypertrophy')` = 8 pour les deux templates upper.

`focusedMuscles` = Set(['chest','chest_upper','chest_lower','back','back_width','back_thickness'])

**Reorder pour upper-push (lignes 166–177) :**

SLOTS['upper-push'] bruts :
1. chest / chest_upper — compound
2. back_width / back_thickness / back — compound
3. shoulders / shoulders_front — compound
4. chest / chest_lower / chest_upper — isolation
5. triceps — isolation
6. shoulders_lateral — isolation
7. biceps — isolation
8. back_thickness / back — isolation

Composés :
- slot 1 : chest∈focused → aF=0
- slot 2 : back_width∈focused → aF=0
- slot 3 : shoulders∉focused → aF=1
→ [slot1, slot2, slot3] (1 et 2 tous deux focused, ordre stable)

Isolations :
- slot 4 : chest∈focused → aF=0
- slot 5 : triceps∉focused → aF=1
- slot 6 : shoulders_lateral∉focused → aF=1
- slot 7 : biceps∉focused → aF=1
- slot 8 : back_thickness∈focused → aF=0
→ [slot4 (chest, focused), slot8 (back, focused), slot5, slot6, slot7]

**Ordre final upper-push :**
1. chest/chest_upper — compound
2. back_width/back_thickness/back — compound
3. shoulders/shoulders_front — compound
4. chest/chest_lower/chest_upper — isolation
5. back_thickness/back — isolation ← **remonté**
6. triceps — isolation
7. shoulders_lateral — isolation
8. biceps — isolation

**Reorder pour upper-pull (lignes 178–189) :**

SLOTS['upper-pull'] bruts :
1. back_width / back — compound
2. back_thickness / back — compound
3. chest / chest_upper — compound
4. shoulders_rear — isolation
5. biceps — isolation
6. back_thickness / back — isolation
7. triceps — isolation
8. shoulders_lateral — isolation

Composés :
- slot 1 : back_width∈focused → aF=0
- slot 2 : back_thickness∈focused → aF=0
- slot 3 : chest∈focused → aF=0
→ [slot1, slot2, slot3] (tous focused, ordre stable)

Isolations :
- slot 4 : shoulders_rear∉focused → aF=1
- slot 5 : biceps∉focused → aF=1
- slot 6 : back_thickness∈focused → aF=0
- slot 7 : triceps∉focused → aF=1
- slot 8 : shoulders_lateral∉focused → aF=1
→ [slot6 (back isol, focused), slot4, slot5, slot7, slot8]

**Ordre final upper-pull :**
1. back_width/back — compound
2. back_thickness/back — compound
3. chest/chest_upper — compound
4. back_thickness/back — isolation ← **remonté**
5. shoulders_rear — isolation
6. biceps — isolation
7. triceps — isolation
8. shoulders_lateral — isolation

### Étape 5 — Séries × répétitions
- Compound : **4×8-12** · Isolation : **3×10-15**
- Warmup : **2×10** · Core : **3×15**

### Étape 6 — Tableau récapitulatif

**Upper A — upper-push (lundi) — 10 exercices**

| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | chest / chest_upper | Compound | 4×8-12 |
| 2 | back_width / back_thickness / back | Compound | 4×8-12 |
| 3 | shoulders / shoulders_front | Compound | 4×8-12 |
| 4 | chest / chest_lower / chest_upper | Isolation | 3×10-15 |
| 5 | back_thickness / back | Isolation | 3×10-15 |
| 6 | triceps | Isolation | 3×10-15 |
| 7 | shoulders_lateral | Isolation | 3×10-15 |
| 8 | biceps | Isolation | 3×10-15 |
| 9 | Core | — | 3×15 |

**Upper B — upper-pull (mercredi) — 10 exercices**

| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | back_width / back | Compound | 4×8-12 |
| 2 | back_thickness / back | Compound | 4×8-12 |
| 3 | chest / chest_upper | Compound | 4×8-12 |
| 4 | back_thickness / back | Isolation | 3×10-15 |
| 5 | shoulders_rear | Isolation | 3×10-15 |
| 6 | biceps | Isolation | 3×10-15 |
| 7 | triceps | Isolation | 3×10-15 |
| 8 | shoulders_lateral | Isolation | 3×10-15 |
| 9 | Core | — | 3×15 |

**Upper C — upper-push (vendredi) — 10 exercices** : structure identique à Upper A (même template interne), exercices différents via usedGlobally A et B.

### Assertions : [PASS/FAIL]

- `workoutTypeFromFocus(['chest','back'])` = 'upper' : **PASS** (ligne 313)
- Split interne = `['upper-push','upper-pull','upper-push']` : **PASS** (lignes 339–342)
- chest ET back en position composé de tête (après reorder) : **PASS** ✅
- `adjustedSlotCount(8,60,'hypertrophy')` = 8 : **PASS**
- 10 exercices par workout : **PASS**

### Coach

**Équilibre musculaire :** Chest et back couverts en composé + isolation dans les deux sessions ✅. Le reorderSlotsByFocus place les slots chest et back avant shoulders dans upper-push, et back isolation avant les autres en upper-pull — priorité visible ✅. Ratio push/pull sur la semaine : upper-push A/C (bench-first) + upper-pull B (traction-first) = 2 sessions push-dominantes, 1 pull-dominante. À long terme, léger biais push.

**Cohérence objectif :** Hypertrophie ✅.

**Durée/contenu :** 10 exercices → ~48-52 min en hypertrophie → serré mais réaliste ✅.

**Équipement FULL :** Pool très large — barre + haltères + câble + machine → grande variété pour 3 sessions.

**Variété inter-sessions :** Upper A et C ont même template (upper-push) → variété d'exercices uniquement entre A et C. Pool FULL = suffisant pour éviter les répétitions. Upper B (upper-pull) est structurellement différent ✅.

**Couverture isolation :** Chest : 1 slot isolation ✅. Back : 1 slot isolation remonté ✅. Biceps : 1 slot ✅. Triceps : 1 slot ✅. Shoulders_rear : présent dans upper-pull ✅. Shoulders_lateral : présent dans les deux ✅. Couverture globale excellente.

**Verdict : ✅ Bon programme** — focus chest+back bien répercuté, structure A/B différenciée, couverture complète du haut du corps.

---

## P18 — legs+core → lower (core ne neutralise pas legs)

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:BW, level:'beginner',
  focusMuscles:['legs','core'] }
```

### Étape 1 — workoutTypeFromFocus(['legs','core'])

Flags :
- `hasLower` = true ('legs' — ligne 296)
- `hasPush`  = false
- `hasPull`  = false
- `hasArms`  = false
- `hasCore`  = true ('core' — ligne 299)
- `hasUpper` = false

Règles dans l'ordre :
1. `hasLower && !hasUpper` → **true** → **return 'lower'** (ligne 303)

La règle core (ligne 307) n'est pas atteinte car la règle 1 déclenche en premier.

**focusType = `'lower'`** — core ne neutralise pas legs ✅

### Étape 2 — selectSplit

`focusType === 'lower'` → alternance lower-quad / lower-hip (lignes 334–338) :
```ts
Array.from({ length: 3 }, (_, i) => i % 2 === 0 ? 'lower-quad' : 'lower-hip')
```
**Split interne = `['lower-quad', 'lower-hip', 'lower-quad']`**

Jours : lundi, mercredi, vendredi.
Nommage (totalOfType lower=3) :
- lower-quad (count=1) → "Lower — Bas du corps A"
- lower-hip  (count=2) → "Lower — Bas du corps B"
- lower-quad (count=3) → "Lower — Bas du corps C"

### Étape 3 — adjustedSlotCount + slots ordonnés

`adjustedSlotCount(6, 60, 'hypertrophy')` = 6

`focusedMuscles` = Set(['quads','hamstrings','glutes','calves','core'])

Tous les slots lower-quad et lower-hip ciblent des muscles ∈ focusedMuscles (quads, hamstrings, glutes, calves) → aF=0 pour tous → **pas de réordonnancement** (même résultat que P13).

**Slots lower-quad et lower-hip : identiques à P13.**

### Étape 5 — Séries × répétitions
- Compound : **4×8-12** · Isolation : **3×10-15**
- Warmup : **2×10** · Core : **3×15**

### Étape 6 — Tableau récapitulatif

**Lower A — lower-quad (lundi) — 8 exercices**

| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | quads / glutes | Compound | 4×8-12 |
| 2 | hamstrings / glutes | Compound | 4×8-12 |
| 3 | quads | Isolation | 3×10-15 |
| 4 | glutes | Isolation | 3×10-15 |
| 5 | hamstrings | Isolation | 3×10-15 |
| 6 | calves | Isolation | 3×10-15 |
| 7 | Core (via corePool) | — | 3×15 |

**Lower B — lower-hip (mercredi) — 8 exercices**

| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | glutes / hamstrings | Compound | 4×8-12 |
| 2 | quads / glutes | Compound | 4×8-12 |
| 3 | glutes | Isolation | 3×10-15 |
| 4 | hamstrings | Isolation | 3×10-15 |
| 5 | quads | Isolation | 3×10-15 |
| 6 | calves | Isolation | 3×10-15 |
| 7 | Core (via corePool) | — | 3×15 |

**Lower C — lower-quad (vendredi) : structure identique à Lower A**

### Assertions : [PASS/FAIL]

- `workoutTypeFromFocus(['legs','core'])` = 'lower' (règle 1 déclenche avant règle core) : **PASS** (ligne 303)
- `hasLower && !hasUpper` → 'lower' (core ne neutralise pas) : **PASS** ✅
- Split = `['lower-quad','lower-hip','lower-quad']` : **PASS**
- Core ajouté en queue via corePool à chaque session : **PASS** ✅
- 8 exercices par workout : **PASS**

### Coach

**Équilibre musculaire :** Bas du corps complet ✅. Core systématique en fin de session = ce que l'utilisateur voulait ✅.

**Cohérence objectif :** Zone hypertrophie ✅.

**Durée/contenu :** 8 exercices → ~38-42 min / 60 min ✅.

**Équipement BW :** Mêmes limitations que P13 : pool bas du corps limité. L'exercice core BW (planche, crunch…) = accessible ✅.

**Variété inter-sessions :** A et C identiques (lower-quad) → variété d'exercices uniquement. Pool BW legs = même contrainte que P13. En 3 sessions, la session C partage le même template que A : si le pool BW pour slot 1 (quads/glutes compound) = 2 exercices (squat + fente), A et C utiliseront des exercices différents mais le pool sera épuisé.

**Couverture isolation :** Idem P13 ✅.

**Verdict : ✅ Bon programme** (code correct, LEGS+CORE assertion validée ✅) avec mêmes réserves BW-only que P13. Le core en queue satisfait l'intention de l'utilisateur.

---

## P19 — chest+back+legs → null → split défaut

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:FULL, level:'beginner',
  focusMuscles:['chest','back','legs'] }
```

### Étape 1 — workoutTypeFromFocus(['chest','back','legs'])

Flags :
- `hasLower` = true ('legs')
- `hasPush`  = true ('chest')
- `hasPull`  = true ('back')
- `hasArms`  = false
- `hasCore`  = false
- `hasUpper` = true (hasPush || hasPull)

Règles :
1. `hasLower && !hasUpper` → false (hasUpper=true)
2. `hasCore && …` → false
3. `hasPush && !hasPull && !hasLower` → false (hasPull=true, hasLower=true)
4. `hasPull && !hasPush && !hasLower` → false (hasPush=true, hasLower=true)
5. `hasUpper && !hasLower` → false (hasLower=true)
6. `hasLower && hasPush && !hasPull` → false (hasPull=true)
7. `hasLower && hasPull && !hasPush` → false (hasPush=true)
8. **return null** (ligne 321 — ambiguïté totale)

**focusType = `null`**

### Étape 2 — selectSplit

`focusType = null` → split par défaut.
`daysPerWeek = 2` → `['fullbody-quad', 'fullbody-hip']` (ligne 350)

**Split = `['fullbody-quad', 'fullbody-hip']`**

Jours : lundi, jeudi. Noms : "Full Body A", "Full Body B"

### Étape 3 — adjustedSlotCount + slots ordonnés

`adjustedSlotCount(9, 60, 'hypertrophy')` = 9

`focusedMuscles` = Set(['chest','chest_upper','chest_lower','back','back_width','back_thickness','quads','hamstrings','glutes','calves'])

**Reorder pour fullbody-quad :**

SLOTS['fullbody-quad'] bruts :
1. quads / glutes — compound
2. chest / chest_upper — compound
3. back_width / back_thickness / back — compound
4. shoulders / shoulders_front — compound
5. hamstrings — isolation
6. shoulders_rear — isolation
7. biceps — isolation
8. triceps — isolation
9. calves — isolation

Composés :
- slot 1 : quads∈focused → aF=0
- slot 2 : chest∈focused → aF=0
- slot 3 : back_width∈focused → aF=0
- slot 4 : shoulders∉focused → aF=1
→ [slot1, slot2, slot3, slot4] (1-3 focused, stable)

Isolations :
- slot 5 : hamstrings∈focused → aF=0
- slot 6 : shoulders_rear∉focused → aF=1
- slot 7 : biceps∉focused → aF=1
- slot 8 : triceps∉focused → aF=1
- slot 9 : calves∈focused → aF=0
→ [slot5 (hamstrings), slot9 (calves), slot6, slot7, slot8]

**Ordre final fullbody-quad :**
1. quads/glutes — compound
2. chest/chest_upper — compound
3. back_width/back_thickness/back — compound
4. shoulders/shoulders_front — compound
5. hamstrings — isolation ← conservé (focused)
6. calves — isolation ← **remonté** (focused)
7. shoulders_rear — isolation
8. biceps — isolation
9. triceps — isolation

**Reorder pour fullbody-hip :**

SLOTS['fullbody-hip'] bruts :
1. hamstrings / glutes — compound
2. chest / chest_upper — compound
3. back_width / back — compound
4. shoulders / shoulders_front — compound
5. quads — isolation
6. shoulders_lateral / shoulders_rear — isolation
7. biceps — isolation
8. triceps — isolation
9. calves — isolation

Composés :
- slot 1 : hamstrings∈focused → aF=0
- slot 2 : chest∈focused → aF=0
- slot 3 : back_width∈focused → aF=0
- slot 4 : shoulders∉focused → aF=1
→ [slot1, slot2, slot3, slot4] (stable)

Isolations :
- slot 5 : quads∈focused → aF=0
- slot 6 : shoulders_lateral∉focused → aF=1
- slot 7 : biceps∉focused → aF=1
- slot 8 : triceps∉focused → aF=1
- slot 9 : calves∈focused → aF=0
→ [slot5 (quads), slot9 (calves), slot6, slot7, slot8]

**Ordre final fullbody-hip :**
1. hamstrings/glutes — compound
2. chest/chest_upper — compound
3. back_width/back — compound
4. shoulders/shoulders_front — compound
5. quads — isolation ← conservé (focused)
6. calves — isolation ← **remonté** (focused)
7. shoulders_lateral/shoulders_rear — isolation
8. biceps — isolation
9. triceps — isolation

### Étape 5 — Séries × répétitions
- Compound : **4×8-12** · Isolation : **3×10-15**
- Warmup : **2×10** · Core : **3×15**

### Étape 6 — Tableau récapitulatif

**Full Body A — fullbody-quad (lundi) — 11 exercices**

| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | quads / glutes | Compound | 4×8-12 |
| 2 | chest / chest_upper | Compound | 4×8-12 |
| 3 | back_width / back_thickness / back | Compound | 4×8-12 |
| 4 | shoulders / shoulders_front | Compound | 4×8-12 |
| 5 | hamstrings | Isolation | 3×10-15 |
| 6 | calves | Isolation | 3×10-15 |
| 7 | shoulders_rear | Isolation | 3×10-15 |
| 8 | biceps | Isolation | 3×10-15 |
| 9 | triceps | Isolation | 3×10-15 |
| 10 | Core | — | 3×15 |

**Full Body B — fullbody-hip (jeudi) — 11 exercices**

| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | hamstrings / glutes | Compound | 4×8-12 |
| 2 | chest / chest_upper | Compound | 4×8-12 |
| 3 | back_width / back | Compound | 4×8-12 |
| 4 | shoulders / shoulders_front | Compound | 4×8-12 |
| 5 | quads | Isolation | 3×10-15 |
| 6 | calves | Isolation | 3×10-15 |
| 7 | shoulders_lateral / shoulders_rear | Isolation | 3×10-15 |
| 8 | biceps | Isolation | 3×10-15 |
| 9 | triceps | Isolation | 3×10-15 |
| 10 | Core | — | 3×15 |

### Assertions : [PASS/FAIL]

- `workoutTypeFromFocus(['chest','back','legs'])` = null (ambiguïté totale) : **PASS** (ligne 321)
- Split par défaut 2j = `['fullbody-quad','fullbody-hip']` : **PASS**
- Muscles ciblés (chest, back, legs) remontés dans les composés via reorder : **PASS** ✅
- 11 exercices par workout (9+warmup+core) : **PASS**

### Coach

**Équilibre musculaire :** Fullbody complet ✅. Chest, back et legs (le groupe ciblé) bien couverts en composé ET en isolation (calves et hamstrings/quads remontés en isolation). Push/pull équilibré. Shoulders également couverts.

**Cohérence objectif :** Hypertrophie ✅.

**Durée/contenu :** 11 exercices × ~4-4.5 min → ~44-50 min / 60 min → acceptable.

**Équipement FULL :** Aucune contrainte, pool riche ✅.

**Variété structurelle A/B :** fullbody-quad vs fullbody-hip = différenciation structurelle (squat-first vs RDL/hip hinge-first) ✅. Les deux sessions offrent une stimulation différenciée du bas du corps.

**Couverture isolation :** Excellente — quads, hamstrings, calves, chest, biceps, triceps, shoulders_rear couverts ✅. Le reorderSlotsByFocus remonte intelligemment les groupes ciblés.

**UX :** L'ambiguïté est correctement gérée (null → fullbody) et le reorderSlotsByFocus garantit que chest+back+legs sont bien en tête de séance ✅. La logique fallback est pertinente : un utilisateur avec ces 3 groupes veut clairement un programme complet.

**Verdict : ✅ Bon programme** — gestion d'ambiguïté correcte, reorderSlotsByFocus effectif, équilibre musculaire excellent.

---

## P20 — shoulders+arms → push

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:DB, level:'beginner',
  focusMuscles:['shoulders','arms'] }
```

### Étape 1 — workoutTypeFromFocus(['shoulders','arms'])

Flags :
- `hasLower` = false
- `hasPush`  = true ('shoulders' ∈ {chest, shoulders} — ligne 297)
- `hasPull`  = false
- `hasArms`  = true ('arms' — ligne 298)
- `hasCore`  = false
- `hasUpper` = hasPush || hasArms = **true**

Règles dans l'ordre :
1. `hasLower && !hasUpper` → false
2. `hasCore && …` → false
3. `hasPush && !hasPull && !hasLower` → **true** → **return 'push'** (ligne 309)

La règle 5 (`hasUpper && !hasLower → 'upper'`) n'est **jamais atteinte** — rule 3 déclenche avant.

**focusType = `'push'`**

Note de l'audit : "arms seul → hasArms=true, hasPush=false → rule 5 → 'upper'. Mais shoulders+arms → hasPush=true → push prioritaire (rule 3 avant rule 5)" — **PASS** ✅

### Étape 2 — selectSplit

**Split = `['push', 'push']`** (ligne 344)

Jours : lundi, jeudi. Noms : "Push — Poussée A", "Push — Poussée B"

### Étape 3 — adjustedSlotCount + slots ordonnés

`adjustedSlotCount(6, 60, 'hypertrophy')` = 6

`focusedMuscles` = Set(['shoulders','shoulders_front','shoulders_lateral','shoulders_rear','biceps','triceps','forearms'])

SLOTS['push'] bruts :
1. chest / chest_upper / chest_lower — compound
2. shoulders / shoulders_front — compound
3. chest / chest_upper / chest_lower — isolation
4. triceps — isolation
5. shoulders_lateral / shoulders — isolation
6. triceps — isolation

reorderSlotsByFocus :

Composés :
- slot 1 : chest∉focused, chest_upper∉focused, chest_lower∉focused → aF=1
- slot 2 : shoulders∈focused → aF=0
→ [slot2 (shoulders cmp), slot1 (chest cmp)] ← **OHP passe avant chest**

Isolations :
- slot 3 : chest∉focused → aF=1
- slot 4 : triceps∈focused → aF=0
- slot 5 : shoulders_lateral∈focused → aF=0
- slot 6 : triceps∈focused → aF=0
→ [slot4 (triceps, aF=0), slot5 (shoulders_lat, aF=0), slot6 (triceps, aF=0), slot3 (chest, aF=1)]
(ordre stable parmi les focused : 4, 5, 6 en ordre d'origine)

**Ordre final :**
1. shoulders / shoulders_front — compound ← **remonté**
2. chest / chest_upper / chest_lower — compound
3. triceps — isolation ← **remonté**
4. shoulders_lateral / shoulders — isolation ← **remonté**
5. triceps — isolation ← **remonté**
6. chest / chest_upper / chest_lower — isolation ← **relégué en fin**

### Étape 5 — Séries × répétitions
- Compound : **4×8-12** · Isolation : **3×10-15**
- Warmup : **2×10** · Core : **3×15**

### Étape 6 — Tableau récapitulatif

**Push A (lundi) — 8 exercices**

| # | Slot | Cat | Séries×Reps |
|---|------|-----|-------------|
| 0 | Warmup | — | 2×10 |
| 1 | shoulders / shoulders_front | Compound | 4×8-12 |
| 2 | chest / chest_upper / chest_lower | Compound | 4×8-12 |
| 3 | triceps | Isolation | 3×10-15 |
| 4 | shoulders_lateral / shoulders | Isolation | 3×10-15 |
| 5 | triceps | Isolation | 3×10-15 |
| 6 | chest / chest_upper / chest_lower | Isolation | 3×10-15 |
| 7 | Core | — | 3×15 |

**Push B (jeudi) — structure identique, exercices différents**

### Assertions : [PASS/FAIL]

- `workoutTypeFromFocus(['shoulders','arms'])` = 'push' (rule 3 avant rule 5) : **PASS** (ligne 309)
- Split = `['push','push']` : **PASS**
- Shoulders compound en position 1 (reorderSlotsByFocus) : **PASS** ✅
- Triceps isolation(s) remontés : **PASS** ✅
- `adjustedSlotCount(6,60,'hypertrophy')` = 6 : **PASS**
- 8 exercices par workout : **PASS**

### Coach

**Équilibre musculaire :** Épaules en tête ✅ (OHP + latéraux prioritaires). Triceps bien présent (2 slots isolation). Chest couvert mais relégué en fin. **Biceps totalement absent** — le slot biceps n'existe pas dans le template push. Or l'utilisateur a sélectionné 'arms' (biceps + triceps + forearms). Le générateur couvre les triceps mais ignore les biceps, car le push day ne contient structurellement aucun slot biceps. C'est une **lacune fonctionnelle** par rapport à l'intention utilisateur.

**Cohérence objectif :** Zone hypertrophie ✅.

**Durée/contenu :** ~40-45 min ✅.

**Équipement DB :** OHP DB, élévations latérales DB, extensions triceps DB = tous disponibles. Développé DB = accessible. Pool suffisant pour 2 sessions.

**Variété A→B :** Même structure → variété d'exercices uniquement. Pool DB push-day acceptable.

**Couverture isolation :** Shoulders_rear absent (même lacune que P16). **Biceps absent** alors que l'utilisateur a coché 'arms' → **lacune problématique** : l'utilisateur qui veut travailler ses bras ne bénéficiera d'aucun curl dans ce programme.

**Recommandation :** Quand 'arms' est sélectionné avec 'shoulders' (ou tout autre groupe push), le générateur pourrait détecter que le template push ne couvre pas les biceps et ajouter dynamiquement un slot biceps isolation si le pool n'est pas épuisé.

**Verdict : ⚠️ Problème mineur** — Épaules et triceps bien priorisés, mais biceps absent du template push = inadéquation entre l'intention "arms" et le programme produit. 2 slots triceps redondants pour un débutant.

---

## Récapitulatif Groupe B (P11–P20)

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|--------|----------------------|---------|-------------------|
| P11 — chest seul | workoutTypeFromFocus→'push', split=['push','push'], reorder chest-first | ✅ PASS | Déséquilibre push/pull sur la semaine (aucun pull day) ; 2 slots triceps redondants ; pool DB-only limité pour variété A/B |
| P12 — back seul | workoutTypeFromFocus→'pull', split=['pull','pull','pull'] | ✅ PASS | Déséquilibre push/pull sur la semaine (aucun push day) ; acceptable en programme focus pull |
| P13 — legs seul BW | workoutTypeFromFocus→'lower', alternance lower-quad/lower-hip, 4 sessions | ⚠️ PASS | Pool BW-only insuffisant pour 4 sessions sans répétition (A=C structurellement) ; progression nulle (poids fixe) ; mollets BW peu stimulants |
| P14 — core seul BW 2j | BUG#3 : workoutTypeFromFocus→null (jamais 'lower'), split fullbody-quad/hip | ✅ PASS | Slot dos composé (back_width) = traction BW : si pas de barre, slot potentiellement vide ; 11 exercices en 60 min BW = timing serré ; UX : utilisateur "core" reçoit fullbody générique |
| P15 — core seul FULL 4j | BUG#3 : workoutTypeFromFocus→null, split upper/lower (isMass+4j) | ✅ PASS | UX : même inadéquation core→fullbody que P14 ; volume 4j upper/lower pour débutant = élevé mais gérable |
| P16 — shoulders seul DB | workoutTypeFromFocus→'push', reorder shoulders-first | ⚠️ PASS | Épaule postérieure (shoulders_rear) absente du template push — déséquilibre interne de l'épaule ; déséquilibre push/pull sur la semaine |
| P17 — chest+back FULL | workoutTypeFromFocus→'upper', alternance upper-push/pull, 3 sessions | ✅ PASS | Léger biais push sur la semaine (2×upper-push, 1×upper-pull) ; 10 exercices/session → timing serré (50 min) |
| P18 — legs+core BW | legs+core→lower (core ne neutralise pas), alternance lower-quad/hip, 3 sessions | ✅ PASS | Mêmes limitations BW que P13 ; A=C structurellement (pool BW restreint) |
| P19 — chest+back+legs FULL | Ambiguïté→null, split fullbody-quad/hip, reorder ciblé | ✅ PASS | 11 exercices/session → timing serré (50 min) mais acceptable ; — |
| P20 — shoulders+arms DB | hasPush=true→rule 3→'push' (avant rule 5 'upper'), reorder shoulders+triceps-first | ⚠️ PASS | **Biceps totalement absent** malgré focus 'arms' — lacune fonctionnelle vs intention utilisateur ; 2 slots triceps redondants ; épaule postérieure absente |

---

## Synthèse des problèmes ouverts — Groupe B

### Bugs / anomalies logicielles

**Aucun FAIL sur les assertions critiques de P11–P20.** Les régressions BUG#3 (core→null), LEGS+CORE (legs+core→lower), et la priorité des règles push/upper sont toutes correctement implémentées.

### Réserves coach cumulées (thèmes récurrents)

**1. Déséquilibre push/pull sur la semaine entière (P11, P12, P13, P16)**
Lorsque focusMuscles désigne un seul côté (push pur ou pull pur), le générateur produit un split monotone sans contre-mouvement. Sur 2-3 semaines d'entraînement exclusivement push (P11, P16) ou pull (P12), le risque de déséquilibre musculaire antagoniste est réel (pectoraux vs dos, épaules antérieures vs postérieures). *Recommandation : ajouter une note dans le wizard ou forcer un contre-exercice léger en fin de session.*

**2. Biceps absent du template push (P20) — inadéquation intention/structure**
Quand l'utilisateur coche 'arms' + 'shoulders', le générateur produit un push day sans aucun slot biceps (le template push n'en contient structurellement aucun). Les biceps sont pourtant la moitié des "bras". *Recommandation : détecter la combinaison arms+push et injecter un slot biceps isolation si le quota de slots n'est pas atteint.*

**3. Épaule postérieure absente du template push (P11, P16, P20)**
Le slot shoulders_rear (face pull, écarté penché) n'apparaît pas dans le template push. Pour les profils ciblant les épaules, la tête postérieure n'est jamais travaillée, ce qui génère un déséquilibre antérieur/postérieur de la ceinture scapulaire — facteur de risque articulaire. *Recommandation : ajouter un slot shoulders_rear facultatif dans le template push, ou le glisser dans la rotation isolations.*

**4. Pool d'exercices limité en BW-only sur programmes multi-sessions jambes (P13, P18)**
Avec 4 sessions legs (P13) ou 3 sessions lower (P18) en bodyweight-only, le pool d'exercices disponibles est insuffisant pour assurer une vraie variété entre sessions du même type (lower-quad A = lower-quad C structurellement). *Recommandation : informer l'utilisateur que BW-only + focus jambes + haute fréquence génèrera des répétitions, ou limiter la fréquence.*

**5. Inadéquation UX "core seul" → fullbody générique (P14, P15)**
L'implémentation est correcte (null → fullbody) mais l'utilisateur qui sélectionne uniquement 'core' s'attend probablement à un programme gainage/abdos, pas à un fullbody complet. Le core n'est qu'un exercice en fin de séance. *Recommandation : ajouter un message explicatif dans le wizard ou une page de résultats précisant que "core seul" génère un programme complet avec du gainage en fin de séance.*

**6. Timing 60 min avec 11 exercices (P14, P15, P19)**
Les sessions fullbody 60 min hypertrophie produisent 11 exercices (9 slots + warmup + core). Estimation réaliste : 4 composés × (4 séries × ~45s travail + 90s repos) + 5 isolations × (3 séries × ~30s travail + 75s repos) ≈ 22 min composés + 19 min isolations + warmup + core ≈ 50-55 min → limite haute mais faisable. Aucun problème critique, mais la marge est faible si l'utilisateur prend du temps entre les exercices.
