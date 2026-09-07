# Audit v10 — Groupe C (Cas spéciaux) : C01–C06
**Date :** 2026-09-07  
**Auditeur :** Simulation manuelle — lecture directe de programGenerator.ts + exercises-seed.json  
**Référence :** audit_prompt_v10.md, coverage_analysis.md  

---

## Préambule méthodologique

Chaque profil est simulé en suivant le code réel dans l'ordre exact d'exécution :
1. `workoutTypeFromFocus()` (lignes 417–452)
2. `selectSplit()` (lignes 454–608)
3. BUG-BW-PULL check (lignes 1022–1044)
4. SEED-BW-NOBACK check (lignes 1047–1059)
5. `adjustedSlotCount()` (lignes 659–681)
6. `pickExercise()` slot par slot (lignes 760–828)
7. Warnings UX (lignes 1150–1252)

---

## C01 — focusMuscles=['glutes','back'] × Salle+cable → 'pull'

```
goal='hypertrophy', level='intermediate', daysPerWeek=3, duration=60
equipment=['barbell','dumbbell','cable']
focusMuscles=['glutes','back'], splitPreference=undefined
```

**Split produit :** `['pull', 'upper-pull', 'pull']`  
**INC-1 :** NON (focusMuscles défini → branche focusType)  
**adjustedSlotCount :** 8 (hypertrophy, 60 min, base pull=8)  
**Warnings globaux :** aucun (hasCompoundBack=true, hasPullInSplit=true, UX-6 non déclenché)

### Trace workoutTypeFromFocus(['glutes','back'])

```
hasLower = includes('legs')    = false
hasPush  = includes('chest')||includes('shoulders') = false
hasPull  = includes('back')    = true   ← décisif
hasArms  = includes('arms')    = false
hasCore  = includes('core')    = false
hasUpper = hasPush||hasPull||hasArms = true

// Évaluations par ordre dans le code :
if (hasLower && !hasUpper)   → false, skip
if (hasCore && !hasLower && !hasUpper) → false, skip
if (hasPush && !hasPull && !hasLower) → false, skip
if (hasPull && !hasPush && !hasLower) → TRUE && TRUE && TRUE → return 'pull'
// hasGlutes n'est JAMAIS évalué — il arrive après ce return
```

**Résultat : 'pull'** — hasPull prime avant hasGlutes, confirmé par le code.  
Le check `hasGlutes` (ligne 448) n'est atteint qu'en l'absence de `hasUpper && !hasLower`.

### selectSplit avec focusType='pull', daysPerWeek=3

```typescript
if (focusType === 'pull') {
  case 3: return ['pull', 'upper-pull', 'pull']
}
```

rawSplit = `['pull', 'upper-pull', 'pull']`

### BUG-BW-PULL check

```
backSessionTypes = ['pull', 'back-bi', 'chest-back']
hasPullInSplit = rawSplit.some(t => backSessionTypes.includes(t))
              = ('pull' ∈ backSessionTypes) = true

equipment=['barbell','dumbbell','cable']
hasCompoundBack = available.some(ex => ex.category==='compound' && backMuscles.includes(ex.primaryMuscle))
→ seed-row-barbell (barbell, compound, back_thickness, pop 7) ✅
→ hasCompoundBack = true

condition BUG-BW-PULL : (!hasCompoundBack && hasPullInSplit) = (false && true) = false → NON déclenché
```

split final = `['pull', 'upper-pull', 'pull']` (inchangé)

### SEED-BW-NOBACK check

`!hasCompoundBack` = false → condition non remplie → NON émis.

### isGlutesSplit

rawSplit ne contient ni 'glutes-hip' ni 'quad-glutes' → isGlutesSplit = false.

### Séance pull (slots effectifs, 8 slots)

| Slot | Muscles | Compound | Exercice sélectionné | Statut |
|------|---------|----------|---------------------|--------|
| [0] | back_width, back_thickness | ✓ | seed-row-barbell (barbell, pop 7, rank 1 slotPrimary=back_width) → compétition avec seed-pullup/seed-lat-pulldown : slotPrimary=back_width → rank 0 pour ces deux ; mais pour goal≠strength strengthEquipmentPrio inactif sur tri final → sort par pop : seed-pullup (pop 3) = seed-lat-pulldown (pop 3) ; intermédiaire → top-3 aléatoire parmi [seed-pullup, seed-lat-pulldown, seed-row-barbell] | ✅ compound back couvert |
| [1] | back_thickness, back | ✓ | slotPrimary=back_thickness, rank 0 ; seed-row-barbell non usedInWorkout → sélectionné (barbell, pop 7) OU parmi top-3 : seed-row-barbell (pop 7), seed-row-cable (pop 2), seed-row-dumbbell (pop 3) → intermédiaire aléatoire | ✅ |
| [2] | back_thickness, back_width, back | ✗ | isolation : seed-pullover-dumbbell (pop 3), seed-pullover-cable (pop 2), seed-straight-arm-pulldown (pop 2) — aléatoire intermédiaire | ✅ |
| [3] | biceps | ✗ | isolation : seed-curl-barbell (pop 3), seed-curl-dumbbell (pop 3)… | ✅ |
| [4] | shoulders_rear | ✗ | seed-rear-delt-fly (dumbbell, pop 2) ou seed-face-pull (cable, pop 2) | ✅ |
| [5] | forearms | ✗ | exercice forearms cable/barbell disponible | ✅ |
| [6] | biceps (2e) | ✗ | variante curl non-usedInWorkout | ✅ |
| [7] | back_width, back | ✗ | seed-pullover (back_width, dumbbell, iso, pop 1) ou seed-straight-arm-pulldown (pop 2) | ✅ |

### UX warnings — vérification UX-6

```
fm = ['glutes', 'back']
hasFocusLower = false, hasFocusPush = false, hasFocusPull = true
hasFocusArms = false, hasFocusCore = false, hasFocusUpper = true

Conditions UX-6 :
• "core seul" → false
• "arms seul" → false
• "lower+push+pull" → false (pas de lower)
→ AUCUN warning UX-6 émis concernant l'absence des fessiers
```

UX-D : publicTypes = {pull, upper} → size=2 → UX-D non déclenché.  
UX-5 (push sans pull) : hasPullSession=true → non déclenché.

**Findings :**
- ✅ PASS-1 : workoutTypeFromFocus(['glutes','back']) = 'pull' — hasPull prime avant hasGlutes (ligne 438 exécutée avant ligne 448)
- ✅ PASS-2 : split pull-based, zéro séance glutes-hip ou quad-glutes
- ✅ PASS-3 : séances 'pull' générées correctement avec barbell+dumbbell+cable
- ⚠️ RÉSERVE-2 CONFIRMÉE : aucun warning UX ne signale à l'utilisateur que son focus ['glutes','back'] produit un split purement dos sans fessiers. UX-6 n'a pas de cas couvrant "focus glutes+pull → split pull seulement". L'utilisateur qui cible fessiers+dos reçoit un split Pull/Upper-Pull/Pull sans aucune explication.

---

## C02 — focusMuscles=['glutes','back'] × DB+BW, fat_loss, 3j, 60min, beginner

```
goal='fat_loss', level='beginner', daysPerWeek=3, duration=60
equipment=['dumbbell','bodyweight']
focusMuscles=['glutes','back']
```

**Split produit :** `['pull', 'upper-pull', 'pull']` (NON remplacé — voir finding critique)  
**INC-1 :** NON  
**adjustedSlotCount :** 8 (fat_loss, 60 min, base=8)  
**Warnings globaux :** AUCUN BUG-BW-PULL — voir analyse

### workoutTypeFromFocus(['glutes','back'])

Identique à C01 → **'pull'** (hasPull prime).  
rawSplit = `['pull', 'upper-pull', 'pull']`

### BUG-BW-PULL check — FINDING CRITIQUE ❌

L'assertion 2 du profil C02 prédit : "!hasCompoundBack → BUG-BW-PULL déclenché".  
**Cette prédiction est ERRONÉE.**

```
equipment = ['dumbbell', 'bodyweight']
available.filter(ex => !ex.deleted && !ex.isWarmupExercise && allowed.has(ex.equipment))

seed-row-dumbbell :
  equipment = 'dumbbell'   → allowed.has('dumbbell') = true ✅
  category  = 'compound'   → ex.category === 'compound' ✅
  primaryMuscle = 'back_thickness' → backMuscles.includes('back_thickness') = true ✅

hasCompoundBack = true  ← seed-row-dumbbell suffit
```

Condition BUG-BW-PULL : `(!hasCompoundBack && hasPullInSplit)` = **(false && true) = false**  
→ BUG-BW-PULL **NON déclenché**.  
→ split reste `['pull', 'upper-pull', 'pull']` — aucun remplacement par fullbody-quad.  
→ Aucun warning "Séance(s) dos remplacée(s)" émis.

### SEED-BW-NOBACK check

`!hasCompoundBack` = false → condition non remplie → SEED-BW-NOBACK NON émis.

### Comportement réel du split 'pull' avec DB+BW (beginner, fat_loss)

SLOTS['pull'] = 8 slots. adjustedSlotCount(8, 60, fat_loss) = 8.

| Slot | Muscles | Compound | Exercice sélectionné | Statut |
|------|---------|----------|---------------------|--------|
| [0] | back_width, back_thickness | ✓ | seed-row-dumbbell (back_thickness, pop 3) — slotPrimary=back_width → rank 1 mais seul compound back DB+BW → sélectionné | ✅ |
| [1] | back_thickness, back | ✓ | seed-row-dumbbell usedInWorkout → aucun autre compound back DB+BW → **null** → WARNING "dos (épaisseur)" | ⚠️ VIDE systématique |
| [2] | back_thickness, back_width, back | ✗ | seed-pullover-dumbbell (back_thickness, isolation, pop 3) — seul if usedGlobally différent | ✅ |
| [3] | biceps | ✗ | seed-curl-dumbbell (pop 3) — beginner top-1 | ✅ |
| [4] | shoulders_rear | ✗ | seed-rear-delt-fly (dumbbell, pop 2) | ✅ |
| [5] | forearms | ✗ | probablement VIDE (peu d'exercices forearms DB non-warmup) | ⚠️ |
| [6] | biceps (2e) | ✗ | seed-curl-hammer (pop 3) — différent de slot[3] | ✅ |
| [7] | back_width, back | ✗ | seed-pullover (back_width, dumbbell, isolation, pop 1) — rank 0 pour slotPrimary=back_width | ✅ |

**Comportement 'upper-pull' avec DB+BW :**

SLOTS['upper-pull'] = 8 slots.

| Slot | Muscles | Compound | Exercice | Statut |
|------|---------|----------|----------|--------|
| [0] | back_width, back_thickness | ✓ | seed-row-dumbbell | ✅ |
| [1] | back_thickness, back | ✓ | seed-row-dumbbell usedInWorkout → **null** → WARNING "dos (épaisseur)" | ⚠️ VIDE |
| [2] | chest, chest_upper | ✓ | seed-bench-dumbbell (pop 3) | ✅ |
| [3] | shoulders_rear | ✗ | seed-rear-delt-fly | ✅ |
| [4] | biceps | ✗ | seed-curl-dumbbell | ✅ |
| [5] | back_thickness, back | ✗ | seed-pullover-dumbbell | ✅ |
| [6] | triceps | ✗ | exercice triceps DB disponible | ✅ |
| [7] | shoulders_lateral | ✗ | seed-lateral-raise (pop 3) | ✅ |

**Split final réel :** `['pull', 'upper-pull', 'pull']` — toutes les séances ont slot[1] VIDE car seed-row-dumbbell est consommé en slot[0] et c'est le seul compound back DB+BW.

**Findings :**
- ❌ FAIL-CRITIQUE : assertion 2 "hasPullInSplit=true + !hasCompoundBack → BUG-BW-PULL déclenché" est **FAUSSE**. seed-row-dumbbell (dumbbell, compound, back_thickness) rend `hasCompoundBack = true`. BUG-BW-PULL ne se déclenche PAS avec DB+BW.
- ❌ FAIL-MINEUR : assertion 4 "Warning BUG-BW-PULL émis" est FAUSSE — aucun warning de ce type n'est émis.
- ✅ PASS : assertion 1 — workoutTypeFromFocus(['glutes','back']) = 'pull' → split pull-based ✅
- ℹ️ INFO : le split 'pull' avec DB+BW produit un programme fonctionnel mais structurellement sous-optimal : slot[1] de chaque séance 'pull' et 'upper-pull' est systématiquement VIDE (un seul compound back DB). Un warning "dos (épaisseur)" est émis à chaque séance mais le programme s'exécute.
- ⚠️ RÉSERVE-2 CONFIRMÉE (comme C01) : aucun warning UX signalant que glutes+back → split pull sans fessiers.

---

## C03 — focusMuscles=['glutes'] × BW → isGlutesSplit

```
goal='fat_loss', level='intermediate', daysPerWeek=3, duration=60
equipment=['bodyweight'], focusMuscles=['glutes'], splitPreference=undefined
```

**Split produit :** `['glutes-hip', 'quad-glutes', 'glutes-hip']`  
**INC-1 :** NON  
**adjustedSlotCount :** 8 (fat_loss, 60 min, base=8)  
**Warnings globaux :** SEED-BW-NOBACK supprimé (isGlutesSplit=true)

### workoutTypeFromFocus(['glutes'])

```
hasLower = false, hasPush = false, hasPull = false
hasArms = false, hasCore = false, hasUpper = false

// Aucune des conditions précoces ne matche (toutes requièrent hasUpper ou hasLower)
// On arrive à :
const hasGlutes = focusMuscles.includes('glutes')  // true
if (hasGlutes && !hasUpper && !hasLower)  // true && true && true → return 'glutes-hip'
```

Résultat : **'glutes-hip'** ✅ (assertion 1)

### selectSplit — focusType='glutes-hip', daysPerWeek=3

```typescript
if (focusType === 'glutes-hip') {
  return Array.from({ length: 3 }, (_, i) => i % 2 === 0 ? 'glutes-hip' : 'quad-glutes')
}
// i=0 → 'glutes-hip', i=1 → 'quad-glutes', i=2 → 'glutes-hip'
```

rawSplit = `['glutes-hip', 'quad-glutes', 'glutes-hip']` ✅ (assertion 2)

### isGlutesSplit

```typescript
rawSplit.every(t => t === 'glutes-hip' || t === 'quad-glutes')
// true && true && true = true
```

isGlutesSplit = **true** ✅

### BUG-BW-PULL check

hasPullInSplit = rawSplit.some(t => ['pull','back-bi','chest-back'].includes(t)) = **false**  
→ BUG-BW-PULL non déclenché.

### SEED-BW-NOBACK check

```typescript
if (!hasCompoundBack && !hasPullInSplit && splitPreference !== 'glutes-focus' && !isGlutesSplit)
```

- `!hasCompoundBack` = true (BW, aucun compound dos)
- `!hasPullInSplit` = true
- `splitPreference !== 'glutes-focus'` = true (undefined)
- `!isGlutesSplit` = **false** ← BLOQUANT

Condition non remplie → **SEED-BW-NOBACK NON émis** ✅ (assertion 3)

### Warnings slot VIDE — mécanisme indépendant

Les warnings slot VIDE sont émis à l'intérieur de la boucle `for (const slot of slots)` par `pickExercise` → null, indépendamment des warnings globaux.

**glutes-hip slot[3]** = `{muscles: ['back_width','back_thickness'], compound: true}` :
```
Aucun compound back BW → null → warnKey = "glutes-hip:back_width" (pas encore vu)
→ Warning émis : "Aucun exercice composé disponible pour 'dos (largeur)'"
```
✅ (assertion 4)

**quad-glutes slot[2]** = `{muscles: ['back_thickness','back'], compound: true}` :
```
Aucun compound back BW → null → warnKey = "quad-glutes:back_thickness" (nouveau)
→ Warning émis : "Aucun exercice composé disponible pour 'dos (épaisseur)'"
```
✅ (assertion 5)

### Séance glutes-hip (BW, 8 slots)

| Slot | Muscles | Compound | Exercice sélectionné | Statut |
|------|---------|----------|---------------------|--------|
| [0] | glutes, hamstrings | ✓ | seed-hip-thrust-bw (glutes, BW, pop 3, slotPrimary=glutes rank 0) | ✅ |
| [1] | hamstrings, glutes | ✓ | slotPrimary=hamstrings. Compound hamstrings BW non-warmup : **AUCUN**. Compound glutes BW : seed-hip-thrust-bw (usedInWorkout ✗), seed-curtsy-lunge (pop 1) ← seul restant | ⚠️ RÉSERVE-1 |
| [2] | quads, glutes | ✓ | bw-squat (quads, pop 3, slotPrimary=quads rank 0) | ✅ |
| [3] | back_width, back_thickness | ✓ | **VIDE** + WARNING "dos (largeur)" | ⚠️ |
| [4] | glutes | ✗ | seed-glute-bridge (BW, pop 3) — isolation glutes | ✅ |
| [5] | hamstrings | ✗ | **VIDE** (aucune isolation hamstrings BW non-warmup) | ℹ️ silencieux |
| [6] | glutes | ✗ | seed-donkey-kick (pop 2) ou seed-fire-hydrant (pop 2) — aléatoire intermédiaire | ✅ |
| [7] | back_thickness, back | ✗ | **VIDE** (aucune isolation dos BW) | ℹ️ silencieux |

### Séance quad-glutes (BW, 8 slots)

| Slot | Muscles | Compound | Exercice sélectionné | Statut |
|------|---------|----------|---------------------|--------|
| [0] | quads, glutes | ✓ | bw-squat (pop 3, rank 0) | ✅ |
| [1] | glutes, hamstrings | ✓ | slotPrimary=glutes ; seed-hip-thrust-bw (pop 3, rank 0) — usedGlobally depuis glutes-hip mais non usedInWorkout → sélectionné | ✅ |
| [2] | back_thickness, back | ✓ | **VIDE** + WARNING "dos (épaisseur)" | ⚠️ |
| [3] | quads | ✗ | bw-wall-sit (pop 2) — seul isolation quads BW | ⚠️ RÉSERVE-3 (time-based) |
| [4] | glutes | ✗ | seed-glute-bridge (pop 3) — si non usedInWorkout | ✅ |
| [5] | hamstrings | ✗ | **VIDE** | ℹ️ |
| [6] | calves | ✗ | bw-calf-raise (pop 2) | ✅ |
| [7] | back_width, back | ✗ | **VIDE** (seed-pullover = dumbbell, non disponible) | ℹ️ |

**Findings :**
- ✅ PASS-1 : workoutTypeFromFocus(['glutes']) = 'glutes-hip' ✅
- ✅ PASS-2 : split = ['glutes-hip','quad-glutes','glutes-hip'] ✅
- ✅ PASS-3 : isGlutesSplit=true → SEED-BW-NOBACK supprimé ✅
- ✅ PASS-4 : warning slot VIDE "dos (largeur)" émis pour glutes-hip slot[3] ✅
- ✅ PASS-5 : warning slot VIDE "dos (épaisseur)" émis pour quad-glutes slot[2] ✅ — mécanisme indépendant confirmé
- ⚠️ RÉSERVE-1 CONFIRMÉE : glutes-hip slot[1] = seed-curtsy-lunge (compound, BW, glutes, pop 1). Confirmé dans exercises-seed.json : `category: "compound"`, `equipment: "bodyweight"`, `popularity: 1`. Seul composé restant après seed-hip-thrust-bw usedInWorkout.
- ⚠️ RÉSERVE-3 CONFIRMÉE : quad-glutes slot[3] bw-wall-sit (isolation quads, BW, time-based).

---

## C04 — focusMuscles=['glutes'] × DB+BW, fat_loss, 3j, 60min, intermediate

```
goal='fat_loss', level='intermediate', daysPerWeek=3, duration=60
equipment=['dumbbell','bodyweight'], focusMuscles=['glutes']
```

**Split produit :** `['glutes-hip', 'quad-glutes', 'glutes-hip']`  
**INC-1 :** NON  
**adjustedSlotCount :** 8 (fat_loss, 60 min, base=8)  
**Warnings globaux :** aucun

### workoutTypeFromFocus(['glutes']) = 'glutes-hip' (identique C03)

### selectSplit → focusType='glutes-hip', daysPerWeek=3

rawSplit = `['glutes-hip', 'quad-glutes', 'glutes-hip']` ✅ (assertion 1)

### isGlutesSplit = true (même logique que C03) ✅ (assertion 2)

### BUG-BW-PULL check

hasPullInSplit = false → BUG-BW-PULL non déclenché.

### hasCompoundBack avec DB+BW

seed-row-dumbbell (dumbbell, compound, back_thickness) → **hasCompoundBack = true** ✅ (assertion 3)

### SEED-BW-NOBACK check

Conditions :
- `!hasCompoundBack` = **false** ← BLOQUANT (seed-row-dumbbell)
- `!isGlutesSplit` = **false** ← BLOQUANT

Deux conditions bloquantes → SEED-BW-NOBACK NON émis ✅

### Séance glutes-hip (DB+BW, 8 slots)

| Slot | Muscles | Compound | Exercice sélectionné | Statut |
|------|---------|----------|---------------------|--------|
| [0] | glutes, hamstrings | ✓ | seed-hip-thrust-bw (glutes, BW, pop 3, slotPrimary=glutes rank 0) > dumbbell-rdl (hamstrings, DB, pop 2, rank 1) | ✅ |
| [1] | hamstrings, glutes | ✓ | dumbbell-rdl (hamstrings, DB, pop 2, slotPrimary=hamstrings rank 0) — seed-hip-thrust-bw usedInWorkout | ✅ |
| [2] | quads, glutes | ✓ | bw-squat (BW, pop 3) > seed-lunges (DB, pop 2) — bw-squat gagne sur pop | ✅ |
| [3] | back_width, back_thickness | ✓ | seed-row-dumbbell (back_thickness, DB, pop 3) — slotPrimary=back_width → rank 1 mais seul compound back DB → sélectionné. Aucun warning car ex≠null. | ✅ (assertion 4) |
| [4] | glutes | ✗ | seed-glute-bridge (BW, pop 3) | ✅ |
| [5] | hamstrings | ✗ | **VIDE** (aucune isolation hamstrings DB+BW) | ℹ️ silencieux |
| [6] | glutes | ✗ | seed-donkey-kick (pop 2) ou seed-fire-hydrant (pop 2) — aléatoire intermédiaire | ✅ |
| [7] | back_thickness, back | ✗ | seed-pullover-dumbbell (back_thickness, DB, isolation, pop 3, slotPrimary=back_thickness rank 0) | ✅ (assertion 5) |

### Séance quad-glutes (DB+BW, 8 slots)

| Slot | Muscles | Compound | Exercice sélectionné | Statut |
|------|---------|----------|---------------------|--------|
| [0] | quads, glutes | ✓ | bw-squat (pop 3, rank 0 slotPrimary=quads) | ✅ |
| [1] | glutes, hamstrings | ✓ | seed-hip-thrust-bw (glutes, BW, pop 3, rank 0) — usedGlobally mais non usedInWorkout | ✅ |
| [2] | back_thickness, back | ✓ | seed-row-dumbbell (back_thickness, DB, pop 3, slotPrimary=back_thickness rank 0) ✅ | ✅ |
| [3] | quads | ✗ | bw-wall-sit (BW, pop 2) | ⚠️ RÉSERVE-3 |
| [4] | glutes | ✗ | seed-glute-bridge (pop 3) | ✅ |
| [5] | hamstrings | ✗ | **VIDE** | ℹ️ |
| [6] | calves | ✗ | seed-calf-raise-db (DB, pop 2) | ✅ |
| [7] | back_width, back | ✗ | seed-pullover (back_width, DB, isolation, pop 1, rank 0 pour slotPrimary=back_width) | ✅ |

**Findings :**
- ✅ PASS-1 : workoutTypeFromFocus(['glutes']) = 'glutes-hip' → split glutes ✅
- ✅ PASS-2 : isGlutesSplit=true → SEED-BW-NOBACK supprimé ✅
- ✅ PASS-3 : hasCompoundBack=true (seed-row-dumbbell) → pas de warning dos global ✅
- ✅ PASS-4 : glutes-hip slot[3] = seed-row-dumbbell ✅ — aucun warning car l'exercice est trouvé
- ✅ PASS-5 : glutes-hip slot[7] = seed-pullover-dumbbell (back_thickness, pop 3, rank 0) ✅
- ⚠️ RÉSERVE-3 CONFIRMÉE : quad-glutes slot[3] = bw-wall-sit (time-based).

---

## C05 — Machine seul, fullbody, hypertrophy, 3j, 60min, intermediate

```
goal='hypertrophy', level='intermediate', daysPerWeek=3, duration=60
equipment=['machine'], splitPreference='fullbody'
```

**Split produit :** `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`  
**INC-1 :** NON (splitPreference='fullbody' explicite)  
**adjustedSlotCount :** 9 (hypertrophy, 60 min, base=9)  
**Warnings globaux :** aucun (hasCompoundBack=true via machine-lat-pulldown)

### selectSplit — pref='fullbody', daysPerWeek=3

```typescript
if (pref === 'fullbody') {
  case 3: return ['fullbody-quad', 'fullbody-hip', 'fullbody-quad']
}
```

### hasCompoundBack avec machine seul

machine-lat-pulldown (back_width, compound, machine, pop 2) → hasCompoundBack = true  
→ SEED-BW-NOBACK NON émis, BUG-BW-PULL NON déclenché.

### Séance fullbody-quad (machine, 9 slots)

| Slot | Muscles | Compound | Exercice sélectionné | Statut |
|------|---------|----------|---------------------|--------|
| [0] | quads, glutes | ✓ | Compound quads machine (seed-leg-press, pop ? ou machine squat) — slotPrimary=quads | ✅ |
| [1] | chest, chest_upper | ✓ | seed-chest-press-machine ou équivalent machine | ✅ |
| [2] | back_width, back_thickness, back | ✓ | Candidats : machine-lat-pulldown (back_width, compound, pop 2, rank 0) et seed-row-machine (back_thickness, compound, pop 1, rank 1). Tri : rank 0 prime → machine-lat-pulldown en tête. Intermédiaire top-3 : pool=[machine-lat-pulldown, seed-row-machine] → aléatoire. | ✅ (assertion 2) |
| [3] | shoulders, shoulders_front | ✓ | seed-shoulder-press-machine ou équivalent | ✅ |
| [4] | hamstrings | ✗ | seed-leg-curl-lying (machine, hamstrings, isolation, pop 3) ✅ — disponible en salle (vs VIDE en BW/DB) | ✅ |
| [5] | shoulders_rear | ✗ | machine isolation épaules arrière (si disponible) | ℹ️ |
| [6] | biceps | ✗ | **machine-biceps-curl** (biceps, machine, isolation, pop 2) — seul isolation biceps machine | ✅ (assertion 1) |
| [7] | calves | ✗ | machine mollets (machine-calf-raise si dispo) | ✅ |
| [8] | triceps | ✗ | machine isolation triceps (éjecté si cap≤8 — mais ici cap=9 → inclus) | ✅ |

### Séance fullbody-hip (machine, 9 slots)

| Slot | Muscles | Compound | Exercice sélectionné | Statut |
|------|---------|----------|---------------------|--------|
| [0] | hamstrings, glutes | ✓ | seed-hip-thrust-machine (glutes, machine, compound, pop 3?) ou machine hip thrust | ✅ |
| [1] | chest, chest_upper | ✓ | idem fullbody-quad slot[1] | ✅ |
| [2] | back_width, back_thickness, back | ✓ | machine-lat-pulldown ou seed-row-machine — aléatoire intermédiaire (usedGlobally en jeu) | ✅ |
| [3] | shoulders, shoulders_front | ✓ | machine shoulder press | ✅ |
| [4] | quads | ✗ | seed-leg-extension (machine, quads, isolation, pop 3) ✅ — vs bw-wall-sit en DB+BW | ✅ |
| [5] | shoulders_lateral, shoulders_rear | ✗ | machine isolation épaules | ✅ |
| [6] | biceps | ✗ | **machine-biceps-curl** (pop 2) — seul isolation biceps machine | ✅ (assertion 1) |
| [7] | calves | ✗ | machine mollets | ✅ |

### Vérification assertions 3 et 4 (slot[5] et slot[7] glutes-hip "si glutes-focus machine")

Ces assertions sont hors périmètre C05 (C05 est fullbody, non glutes-focus). Elles s'appliquent à un profil hypothétique machine+glutes-focus. **Non évaluées pour C05.**

**Findings :**
- ✅ PASS-1 : slot[6] fullbody-quad ET fullbody-hip = machine-biceps-curl (biceps, machine, isolation, pop 2) — confirmé dans exercises-seed.json : `id: "machine-biceps-curl"`, `category: "isolation"`, `equipment: "machine"`, `popularity: 2` ✅
- ✅ PASS-2 : slot[2] fullbody-quad/hip = machine-lat-pulldown (rank 0 slotPrimary=back_width) ou seed-row-machine (rank 1) — machine-lat-pulldown prioritaire mais aléatoire intermédiaire top-2. Assertion légèrement approximative (dit "machine-lat-pulldown" sans mentionner seed-row-machine dans le pool) mais structurellement correcte.
- ✅ PASS-4 : slot[4] fullbody-hip = seed-leg-extension (machine, pop 3) — machine disponible en salle vs bw-wall-sit en DB+BW ✅
- ℹ️ INFO : slot[5] glutes-hip (assertion 3) et slot[7] glutes-hip (assertion 4) ne s'appliquent pas à C05 fullbody. Ces assertions traitent un cas machine+glutes-focus non couvert par ce profil.
- ✅ PASS général : pas de SEED-BW-NOBACK, pas de BUG-BW-PULL, program machine cohérent avec 9 slots dont machine-biceps-curl et machine-lat-pulldown.

---

## C06 — Salle, glutes-focus, strength, 4j, 60min, intermediate → 4 slots

```
goal='strength', level='intermediate', daysPerWeek=4, duration=60
equipment=['barbell','dumbbell','cable','pullup_bar','machine'], splitPreference='glutes-focus'
```

**Split produit :** `['glutes-hip', 'quad-glutes', 'glutes-hip', 'quad-glutes']`  
**INC-1 :** NON (splitPreference='glutes-focus' override)  
**adjustedSlotCount :** **4** ✅  
**Warnings globaux :** aucun (hasCompoundBack=true, isGlutesSplit=true)

### selectSplit — pref='glutes-focus', daysPerWeek=4

```typescript
if (pref === 'glutes-focus') {
  case 4: return ['glutes-hip', 'quad-glutes', 'glutes-hip', 'quad-glutes']
}
```

### adjustedSlotCount(8, 60, 'strength')

```typescript
if (duration === 60) return isStrength
  ? Math.max(4, Math.floor(base * 0.5))
  : base

Math.max(4, Math.floor(8 * 0.5)) = Math.max(4, 4) = 4
```

**adjustedSlotCount = 4** ✅ (assertion 1) — slots 0, 1, 2, 3 seulement.

### INC-1 — non déclenché

```typescript
// INC-1 : if (goal === 'strength' && level !== 'beginner') return ['fullbody-quad','fullbody-hip','fullbody-quad']
// Cette branche est dans la section "split par défaut" (pref === 'auto')
// Ici pref === 'glutes-focus' → branche explicite exécutée avant → INC-1 jamais atteint
```

✅ confirmé par code (ligne 508 : `if (pref === 'glutes-focus')` avant le bloc auto).

### Glutes-hip — slots 0–3

SLOTS['glutes-hip'] (4 slots retournés) :
```
[0] { muscles: ['glutes','hamstrings'],        compound: true  }
[1] { muscles: ['hamstrings','glutes'],         compound: true  }
[2] { muscles: ['quads','glutes'],              compound: true  }
[3] { muscles: ['back_width','back_thickness'], compound: true  }  ← inclus dans les 4 slots ✅
```

**slot[3] — back_width, back_thickness, compound, goal=strength**

Candidats compound back disponibles (salle complète) :
- seed-lat-pulldown (cable, back_width, pop 3) — strengthEquipmentPrio=1
- seed-pullup (pullup_bar, back_width, pop 3) — strengthEquipmentPrio=4
- machine-lat-pulldown (machine, back_width, pop 2) — strengthEquipmentPrio=1
- seed-row-barbell (barbell, back_thickness, pop 7) — strengthEquipmentPrio=0, **rank 1** (slotPrimary=back_width)

Tri (strength + compound) :
1. slotPrimary = 'back_width' → rank 0 pour back_width, rank 1 pour back_thickness
2. usedGlobally (false en début de séance 1)
3. strengthEquipmentPrio : cable/machine (1) < pullup_bar (4)
4. popularité

Parmi rank 0 (back_width) : seed-lat-pulldown (cable, prio 1, pop 3), machine-lat-pulldown (machine, prio 1, pop 2), seed-pullup (pullup_bar, prio 4, pop 3)

Ordre de tri : seed-lat-pulldown = machine-lat-pulldown (prio 1) avant seed-pullup (prio 4).  
À parité de prio : pop → seed-lat-pulldown (pop 3) > machine-lat-pulldown (pop 2).

Tri final (pour slot[3]) : [seed-lat-pulldown, machine-lat-pulldown, seed-pullup, seed-row-barbell, ...]

Intermédiaire top-3 : pool = [seed-lat-pulldown, machine-lat-pulldown, seed-pullup] → aléatoire. ✅

**Note :** l'assertion 2 dit "seed-lat-pulldown ou seed-pullup" mais machine-lat-pulldown est également dans le top-3 pool. L'assertion est incomplète mais le comportement attendu (compound dos inclus dans les 4 slots) est correct. ✅

**slot[0] — glutes, hamstrings, compound, goal=strength**

Candidats compound glutes salle complète :
- seed-hip-thrust (barbell, glutes, compound, pop 4) — slotPrimary=glutes rank 0, strengthEquipmentPrio=0
- seed-hip-thrust-machine (machine, glutes, compound) — strengthEquipmentPrio=1
- seed-sumo-deadlift (barbell, glutes, compound?) — à vérifier

sort : seed-hip-thrust (rank 0, prio 0, pop 4) → premier du tri.  
Intermédiaire top-3 : seed-hip-thrust dans le pool → fort probable mais aléatoire.

✅ (assertion 5 confirmée comme probable)

### Quad-glutes — slots 0–3

SLOTS['quad-glutes'] (4 slots retournés) :
```
[0] { muscles: ['quads','glutes'],      compound: true  }
[1] { muscles: ['glutes','hamstrings'], compound: true  }
[2] { muscles: ['back_thickness','back'], compound: true }  ← inclus dans les 4 slots ✅
[3] { muscles: ['quads'],               compound: false }
```

**slot[2] — back_thickness, back, compound, goal=strength, slotPrimary=back_thickness**

Candidats compound back_thickness salle complète :
- seed-row-barbell (barbell, back_thickness, pop 7, rank 0) — strengthEquipmentPrio=0
- seed-row-cable (cable, back_thickness, pop 2, rank 0) — prio=1
- seed-row-machine (machine, back_thickness, pop 1, rank 0) — prio=1
- seed-row-dumbbell (dumbbell, back_thickness, pop 3, rank 0) — prio=2
- kb-row (kettlebell, back_thickness, pop 2, rank 0) — prio=2

Tri strength + compound : seed-row-barbell (prio 0, pop 7) → premier.  
→ seed-row-barbell sélectionné (dans pool top-3, premier en tri) ✅ (assertion 3)

### strengthEquipmentPrio confirmé

À 4 slots strength salle, les composés clés reçoivent barbell/machine en priorité (prio 0–1) sur dumbbell (prio 2) et pullup_bar (prio 4). ✅ (assertion 4)

**Findings :**
- ✅ PASS-1 : adjustedSlotCount = max(4, ⌊8×0.5⌋) = 4 ✅
- ✅ PASS-2 : glutes-hip slot[3] (compound dos) inclus dans les 4 premiers → seed-lat-pulldown ou machine-lat-pulldown ou seed-pullup (top-3 aléatoire intermédiaire strength). L'assertion "seed-lat-pulldown ou seed-pullup" est incomplète (omet machine-lat-pulldown) mais le fond est correct.
- ✅ PASS-3 : quad-glutes slot[2] = seed-row-barbell (barbell, pop 7, rank 0, strengthEquipmentPrio=0) ✅
- ✅ PASS-4 : strengthEquipmentPrio appliqué — barbell/machine prime pour composés force ✅
- ✅ PASS-5 : slot[0] glutes-hip = seed-hip-thrust (barbell, pop 4) premier du tri (rank 0, prio 0) → dans le pool intermédiaire top-3 ✅

---

## SYNTHÈSE GLOBALE — GROUPE C

### Tableau de résultats par profil

| Profil | Assertions | PASS | FAIL-CRITIQUE | FAIL-MINEUR | RÉSERVE |
|--------|-----------|------|---------------|-------------|---------|
| C01 | 5 | 4 | 0 | 0 | RÉSERVE-2 confirmée |
| C02 | 4 | 1 | 1 | 1 | RÉSERVE-2 confirmée |
| C03 | 6 | 6 | 0 | 0 | RÉSERVE-1, RÉSERVE-3 confirmées |
| C04 | 5 | 5 | 0 | 0 | RÉSERVE-3 confirmée |
| C05 | 4 évaluables | 3 | 0 | 0 | — |
| C06 | 5 | 5 | 0 | 0 | — |

### FAIL unique

**C02 — FAIL-CRITIQUE : BUG-BW-PULL ne se déclenche pas avec DB+BW**

L'audit attendait que `hasCompoundBack = false` avec `equipment=['dumbbell','bodyweight']`, déclenchant BUG-BW-PULL et remplaçant `'pull'→'fullbody-quad'`. La lecture du code réel montre :

```
seed-row-dumbbell : equipment='dumbbell', category='compound', primaryMuscle='back_thickness'
hasCompoundBack = true → BUG-BW-PULL non déclenché → split 'pull' conservé
```

Le split `['pull','upper-pull','pull']` produit des séances fonctionnelles mais avec slot[1] systématiquement VIDE (seul compound back DB consommé en slot[0]). Un warning "dos (épaisseur)" est émis à chaque séance.

---

### Confirmation des 3 RÉSERVES

#### RÉSERVE-1 — glutes-hip slot[1] BW : seed-curtsy-lunge (pop 1)

**Confirmée sur C03 et B01-class profiles (BW + glutes-hip).**

Mécanisme exact :
1. slot[1] = `{muscles: ['hamstrings','glutes'], compound: true}`
2. Compound hamstrings BW non-warmup : AUCUN → pool filtré sur glutes
3. seed-hip-thrust-bw usedInWorkout depuis slot[0]
4. Seul compound glutes BW restant : seed-curtsy-lunge (`category: "compound"`, `equipment: "bodyweight"`, `popularity: 1`) — confirmé dans exercises-seed.json (ligne 950)
5. Résultat : fente curtsy pop 1 sélectionnée systématiquement pour le slot ischio-jambiers

**Problème coach :** la fente curtsy (slotPrimary=glutes, pop 1) ne cible pas les ischio-jambiers de façon significative. Un RDL ou un good-morning BW serait fonctionnellement approprié.

**Recommandation :** ajouter `bw-good-morning` (hamstrings, compound, BW, non-warmup) dans exercises-seed.json. Cela remplirait slot[1] (slotPrimary=hamstrings, rank 0) avec un exercice adapté et reléguerait seed-curtsy-lunge en exercice de secours.

#### RÉSERVE-2 — focusMuscles=['glutes','back'] → split 'pull' sans UX warning

**Confirmée sur C01 et C02.**

Mécanisme exact :
1. `workoutTypeFromFocus(['glutes','back'])` → `hasPull=true` → check ligne 438 (`if hasPull && !hasPush && !hasLower`) → return 'pull'
2. `hasGlutes` (ligne 448) jamais évalué
3. UX-6 (lignes 1220–1252) : aucun des 3 cas ne couvre "glutes+pull → split pull seulement"
   - Cas 1 : core seul → non
   - Cas 2 : arms seul → non
   - Cas 3 : lower+push+pull → non
4. UX-D (programme de spécialisation) : publicTypes = {pull, upper} → size=2 → non déclenché

**Impact utilisateur :** la personne qui coche "fessiers" et "dos" dans le wizard reçoit un split Pull/Upper-Pull/Pull — programme purement dos sans un seul exercice fessiers — sans aucune explication. Contre-intuitif et non documenté.

**Recommandation :** ajouter un cas UX-6 couvrant ce scénario :
```typescript
// Dans UX-6 : après les 3 cas existants
const hasFocusGlutes = fm.includes('glutes')
if (hasFocusGlutes && (hasFocusPull || hasFocusPush) && !hasFocusLower) {
  generatorWarnings.unshift(
    'Focus fessiers + dos : votre sélection inclut "fessiers" et "dos". ' +
    'Étant donné que le dos (tirage) prime dans la classification, le programme ' +
    'généré est un split Pull — vos fessiers seront travaillés indirectement dans les ' +
    'composés de tirage. Pour cibler les fessiers directement, sélectionnez uniquement ' +
    '"fessiers" ou utilisez le split "Glutes Focus".'
  )
}
```

#### RÉSERVE-3 — DB+BW fullbody-hip slot[4] (et quad-glutes slot[3]) : bw-wall-sit time-based

**Confirmée sur C03, C04 et B01-class profiles.**

Mécanisme exact :
- fullbody-hip slot[4] = `{muscles: ['quads'], compound: false}` isolation
- Candidats isolation quads sans machine : `bw-wall-sit` (BW, pop 2, `trackingType: "time"`)
- Aucune isolation quads DB (leg extension = machine uniquement)
- bw-wall-sit sélectionné par défaut → incohérence dans la séance (tous les autres exercices sont weight_reps ou reps_only)

Idem quad-glutes slot[3] `{muscles: ['quads'], compound: false}` → même résultat.

**Recommandation :** ajouter un exercice isolation quads DB/KB (ex. `db-step-up` si compound acceptable, ou `db-sissy-squat` si isolation) pour couvrir ce slot sans recourir au time-based.

---

### État des exercices machine clés (C05)

| Exercice | primaryMuscle | equipment | category | trackingType | popularity | Slot concerné |
|----------|--------------|-----------|----------|--------------|------------|---------------|
| machine-biceps-curl | biceps | machine | isolation | weight_reps | 2 | fullbody-quad/hip slot[6] ✅ |
| machine-lat-pulldown | back_width | machine | compound | weight_reps | 2 | fullbody slot[2], glutes-hip slot[3] ✅ |
| machine-pullover | back_width | machine | isolation | weight_reps | 2 | glutes-hip slot[7], quad-glutes slot[7] ✅ |
| machine-low-row | back_thickness | machine | isolation | weight_reps | 2 | glutes-hip slot[7] (back_thickness ∈ ['back_thickness','back']) ✅ |

Tous les 4 exercices machine ciblés par v9 sont présents dans exercises-seed.json avec les bons attributs.

---

### Recommandations globales issues du Groupe C

1. **Correction critique (C02) :** la prédiction "BUG-BW-PULL déclenché avec DB+BW" dans l'audit_prompt est erronée. seed-row-dumbbell fournit hasCompoundBack=true. Les futures versions de l'audit doivent corriger cette assertion. BUG-BW-PULL ne se déclenche qu'avec équipement bodyweight seul ou band seul.

2. **UX manquant (RÉSERVE-2) :** ajouter un cas dans UX-6 pour `focusMuscles.includes('glutes') && (hasFocusPull || hasFocusPush)` → split pull/push sans fessiers. Priorité : haute (comportement contre-intuitif sans feedback).

3. **Seed à compléter (RÉSERVE-1) :** ajouter `bw-good-morning` (hamstrings, compound, BW, non-warmup, pop 2) pour remplir glutes-hip slot[1] correctement. Priorité : moyenne.

4. **Seed à compléter (RÉSERVE-3) :** ajouter une isolation quads DB ou KB (sissy squat haltères ou équivalent, weight_reps) pour éviter bw-wall-sit (time-based) en slot isolation quads. Priorité : faible.

5. **Assertion C05 à préciser :** les assertions 3 et 4 de C05 (slot[5]/slot[7] glutes-hip "si glutes-focus machine") ne relèvent pas du profil C05 fullbody. Elles doivent être associées à un profil glutes-focus machine dédié dans un futur audit v11.
