# Audit P45–P66 — Groupes E et F (v6)
**Date :** 2026-09-07
**Fichiers lus :** `src/utils/programGenerator.ts` (intégralité), `src/data/exercises-seed.json`, `tests/audit_prompt_v6.md`
**Fixes vérifiés :** BUG-3, BUG-C2, BUG-HIP-BACK, BUG-BW-PULL, UX-B, UX-C, UX-H, UX-5, adjustedSlotCount, adjustedSpec, buildPhases, nommage A/B

---

## Formules de référence (extraites du code)

### adjustedSlotCount — code exact

```typescript
if (duration === 20) return isStrength
    ? Math.min(3, Math.max(2, Math.floor(base * 0.5)))   // ← cap 3 pour force
    : Math.max(2, Math.floor(base * 0.5))
if (duration === 45) return isStrength
    ? Math.min(3, Math.max(2, Math.floor(base * 0.5)))   // ← cap 3 pour force
    : Math.max(4, Math.floor(base * 0.75))               // ← min 4, pas 3
if (duration === 60) return isStrength
    ? Math.max(4, Math.floor(base * 0.5))
    : base
// 90 min
return isStrength ? Math.min(base, 5) : Math.min(base + 2, 8)
```

**Attention :** la table de référence du prompt audit_v6.md est inexacte sur deux points :
- 20 min force → `min(3, max(2, floor(base×0.5)))` et non `max(2, floor(base×0.5))`
- 45 min non-strength → `max(4, floor(base×0.75))` et non `max(3, floor(base×0.75))`

### Tailles SLOTS (extraites du code)

| Type | Nb slots |
|------|---------|
| push | 8 (6 normaux + 2 bonus 90min) |
| pull | 8 |
| legs | 8 |
| upper | 8 |
| lower | 8 |
| upper-push | 8 |
| upper-pull | 8 |
| lower-quad | 8 (6 + 2 bonus 90min) |
| lower-hip | 8 (6 + 2 bonus 90min) |
| fullbody-quad | 9 |
| fullbody-hip | 9 |

### Exercices compound dos — seed

| id | equipment | primaryMuscle |
|----|-----------|---------------|
| seed-row-barbell | barbell | back_thickness |
| seed-row-tbar | barbell | back_thickness |
| seed-deadlift | barbell | back |
| seed-row-dumbbell | dumbbell | back_thickness |
| bw-inverted-row | pullup_bar | back_thickness |
| seed-row-machine | machine | back_thickness |
| seed-row-cable | cable | back_thickness |
| seed-lat-pulldown | cable | back_width |
| seed-pullup | pullup_bar | back_width |
| kb-row | kettlebell | back_thickness |
| kb-deadlift | kettlebell | back |
| band-row | band | back_thickness |

→ `bodyweight` seul : **aucun** exercice compound dos → hasCompoundBack = false.

### FocusMuscle — type valide

`'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core'`

**'glutes' n'est PAS un FocusMuscle valide.**

---

## Groupe E — P45–P56

---

### P45 — Nommage PPL (hypertrophy, 3j, FULL_GYM, pref=ppl)

**Paramètres :** goal=hypertrophy, days=3, duration=60, equipment=FULL_GYM, level=intermediate, splitPreference=ppl

**Simulation :**
1. `selectSplit(ppl, 3j)` → `['push', 'pull', 'legs']`
2. hasCompoundBack = true (barbell/dumbbell/cable/pullup_bar compound dos disponibles)
3. hasPullInSplit = true → mais hasCompoundBack=true → split inchangé
4. typeCount : push→1 (total=1), pull→1 (total=1), legs→1 (total=1)
5. totalOfType = 1 pour chaque → suffix = ''
6. Noms :
   - `WORKOUT_NAMES['push'] + '' = 'Push — Poussée'`
   - `WORKOUT_NAMES['pull'] + '' = 'Pull — Tirage'`
   - `WORKOUT_NAMES['legs'] + '' = 'Legs — Jambes'`

**Assertions :**
- workouts[0].name = 'Push — Poussée' : **PASS**
- workouts[1].name = 'Pull — Tirage' : **PASS**
- workouts[2].name = 'Legs — Jambes' : **PASS**
- Pas de suffixe A/B (pas de doublon) : **PASS**

**Verdict : ✅ Bon programme** — Nommage PPL correct, aucun suffixe.

---

### P46 — Arnold split 5j FULL_GYM (nommage)

**Paramètres :** goal=hypertrophy, days=5, duration=60, equipment=FULL_GYM, level=intermediate, splitPreference=arnold

**Simulation :**
1. `selectSplit(arnold, 5j)` → `['chest-back', 'shoulders-arms', 'legs', 'chest-back', 'shoulders-arms']`
2. hasCompoundBack = true → 'chest-back' ≠ 'pull' → fix BUG-BW-PULL non déclenché
3. split inchangé
4. typeCount par toPublicType :
   - chest-back → publicType='upper' : canon='upper' count=1 puis 2 (total=2 → suffix A/B)
   - shoulders-arms → publicType='upper' : canon='upper' count=3 puis 4 (total=2 dans le filtre `split.filter(t => toPublicType(t) === canon)`)
   
   **Attention :** le calcul du suffix utilise `totalOfType = split.filter(t => toPublicType(t) === canon).length`. Pour les types Arnold, tous (chest-back, shoulders-arms, legs) ont toPublicType='upper', 'upper', 'lower'. Donc :
   - chest-back : canon='upper', total dans split = split.filter(t => toPublicType(t)==='upper').length = 4 (chest-back×2 + shoulders-arms×2) → suffix
   - shoulders-arms : canon='upper', total=4 → suffix
   - legs : canon='lower', total=1 → pas de suffix

5. Noms finaux :
   - `'Chest & Back — Pectoraux & Dos' + ' A'` = `'Chest & Back — Pectoraux & Dos A'`
   - `'Shoulders & Arms — Épaules & Bras' + ' A'` = `'Shoulders & Arms — Épaules & Bras A'`
   - `'Legs — Jambes'` (pas de suffix)
   - `'Chest & Back — Pectoraux & Dos' + ' B'` = `'Chest & Back — Pectoraux & Dos B'`
   - `'Shoulders & Arms — Épaules & Bras' + ' B'` = `'Shoulders & Arms — Épaules & Bras B'`

**Assertions :**
- rawSplit = ['chest-back', 'shoulders-arms', 'legs', 'chest-back', 'shoulders-arms'] : **PASS**
- hasCompoundBack = true → split inchangé : **PASS**
- Noms 'Chest & Back A', 'Shoulders & Arms A', 'Legs', 'Chest & Back B', 'Shoulders & Arms B' (noms complets avec sous-titres français) : **PASS**

**Réserve coach ⚠️ :** Les noms intègrent le sous-titre français complet (ex. `'Chest & Back — Pectoraux & Dos A'`). Le prompt attendait les noms courts. Ce n'est pas un bug — c'est le comportement volontaire du code. L'UI peut afficher seulement la première partie.

**Verdict : ✅ Bon programme**

---

### P47 — Brosplit 5j FULL_GYM (nommage)

**Paramètres :** goal=hypertrophy, days=5, duration=60, equipment=FULL_GYM, level=intermediate, splitPreference=brosplit

**Simulation :**
1. `selectSplit(brosplit, 5j)` → `['chest-tri', 'back-bi', 'legs', 'shoulders-arms', 'upper']`
2. hasCompoundBack = true → 'back-bi' ≠ 'pull' → fix BUG-BW-PULL non déclenché
3. Chaque type apparaît une seule fois → pas de suffix
4. Noms :
   - `'Chest & Triceps — Pectoraux & Triceps'`
   - `'Back & Biceps — Dos & Biceps'`
   - `'Legs — Jambes'`
   - `'Shoulders & Arms — Épaules & Bras'`
   - `'Upper — Haut du corps'`

**Assertions :**
- rawSplit = ['chest-tri', 'back-bi', 'legs', 'shoulders-arms', 'upper'] : **PASS**
- hasCompoundBack = true → 'back-bi' non remplacé : **PASS**
- Séance back-bi : slot[0] = {muscles:['back_width','back'], compound:true} → pull-up/lat-pulldown ; slot[1] = {muscles:['back_thickness','back'], compound:true} → row barbell : **PASS**

**Verdict : ✅ Bon programme**

---

### P48 — Phase intensification strength → repsOffset = -2 (BUG-3 fix)

**Paramètres :** goal=strength, durationWeeks=8

**Simulation :**
```typescript
PHASE_CONFIG_BY_GOAL['strength'] = {
    adaptation:      { setsModifier: -1, repsOffset: +3, ... },
    intensification: { setsModifier:  0, repsOffset: -2, ... },
    deload:          { setsModifier: -2, repsOffset: +4, ... },
}
```

- `PHASE_CONFIG_BY_GOAL['strength'].intensification.repsOffset = -2` ✓
- COMPOUND_SPEC.strength = {sets:5, repsMin:3, repsMax:5}
- En intensification : repsMin = 3 + (-2) = 1, repsMax = 5 + (-2) = 3 → 5×1-3 reps ✓
- repsMin = 1 ≥ 1 → BUG-3 résolu ✓

**Assertions :**
- repsOffset = -2 dans le code : **PASS**
- repsMin en intensification = 1 (pas 0) : **PASS**

**Réserve ⚠️ :** L'assertion du prompt écrit `PHASE_CONFIG_BY_GOAL['strength'].compound.intensification.repsOffset`. La structure réelle n'a PAS de niveau `.compound` intermédiaire — le chemin correct est `['strength'].intensification.repsOffset`. Ce n'est pas un bug du code, c'est une typo dans le prompt d'audit. La valeur -2 est bien présente.

**Verdict : ✅ Bon programme** — BUG-3 fix confirmé.

---

### P49 — Warning force + débutant (UX-C)

**Paramètres :** goal=strength, days=3, duration=60, equipment=[barbell, dumbbell], level=beginner

**Simulation :**
1. Split strength+3j+beginner (non-intermediate) → fullbody×3 : `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`
2. Code UX-C :
   ```typescript
   if (goal === 'strength' && level === 'beginner') {
       generatorWarnings.unshift('Force pour débutant : les specs 5×3–5…')
   }
   ```
3. Conditions : goal='strength' ✓, level='beginner' ✓ → warning ajouté via `unshift`

**Assertions :**
- generatorWarnings contient "Force pour débutant…" : **PASS**
- Programme généré quand même (non bloquant) : **PASS**

**Verdict : ✅ Bon programme**

---

### P50 — Warning débutant 5j (UX-H)

**Paramètres :** goal=hypertrophy, days=5, duration=60, equipment=[barbell, dumbbell, cable, machine], level=beginner

**Simulation :**
1. Split beginner 5j → `['upper-push', 'lower-quad', 'upper-pull', 'lower-hip', 'fullbody-quad']`
2. Code UX-H :
   ```typescript
   if (level === 'beginner' && daysPerWeek >= 5) {
       generatorWarnings.push('Volume élevé pour débutant…')
   }
   ```
3. Conditions : level='beginner' ✓, daysPerWeek=5 ≥ 5 ✓ → warning ajouté via `push`

**Assertions :**
- generatorWarnings contient "Volume élevé pour débutant…" : **PASS**
- Programme généré : **PASS**

**Verdict : ✅ Bon programme**

---

### P51 — focusMuscles=['glutes'] avec split auto

**Paramètres :** goal=fat_loss, days=3, duration=60, equipment=FULL_GYM, level=intermediate, splitPreference=auto, focusMuscles=['glutes']

**Simulation :**
1. `FocusMuscle = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core'`
   **'glutes' n'est PAS un FocusMuscle valide.** TypeScript génère une erreur de compilation. À l'exécution, `FOCUS_TO_MUSCLES['glutes']` = undefined.
2. `workoutTypeFromFocus(['glutes'])` :
   - hasLower = includes('legs') = false
   - hasPush = includes('chest')||includes('shoulders') = false
   - hasPull = includes('back') = false
   - hasArms = includes('arms') = false
   - hasCore = includes('core') = false
   → **Retourne null** (aucune condition ne correspond à 'glutes')
3. focusType = null → logique split auto par défaut :
   - fat_loss, !isMass, level!='beginner' → `['push', 'pull', 'fullbody-quad']`
4. Split final : `['push', 'pull', 'fullbody-quad']` — **aucune séance glutes-hip**

**Assertions :**
- workoutTypeFromFocus(['glutes']) → 'glutes-hip' : **FAIL** — retourne null
- Split : alternance glutes-hip / quad-glutes : **FAIL** — split réel est ['push','pull','fullbody-quad']

**Verdict : ❌ Problème sérieux** — 'glutes' n'est pas un FocusMuscle géré par le code. Le seul moyen d'obtenir un split glutes-hip est `splitPreference: 'glutes-focus'`. La fonctionnalité de focus muscles ne couvre pas 'glutes' directement. Le wizard n'expose probablement pas 'glutes' comme option (puisque c'est absent du type), donc le scénario ne peut pas survenir via l'UI normale. Mais la lacune est réelle côté type.

---

### P52 — Séance express 20min

**Paramètres :** goal=fat_loss, days=3, duration=20, equipment=[barbell, dumbbell], level=intermediate

**Simulation :**
1. Split fat_loss + 3j + intermediate : `['push', 'pull', 'fullbody-quad']`
2. hasCompoundBack = true (seed-row-dumbbell : dumbbell, compound, back_thickness) → split inchangé
3. Pour push (base=8, duration=20, goal=fat_loss) :
   - adjustedSlotCount(8, 20, 'fat_loss') = max(2, floor(8×0.5)) = max(2, 4) = **4 slots**
   - (non-strength → formule sans cap min(3,...))
   
   **Note :** le prompt d'assertion dit "push (6 slots, 20min) : max(2, floor(6×0.5)) = 3 slots". Mais SLOTS['push'] a 8 entrées (base=8 depuis BUG-A2), donc floor(8×0.5)=4 → 4 slots, pas 3. L'assertion est basée sur l'ancienne taille de push (6 slots). Le résultat correct est 4.

4. adjustedSpec fat_loss compound {sets:3,...} à 20min : sets = max(2, floor(3×0.5)) = max(2,1) = 2 → 2 séries
5. isVeryShort = (20 ≤ 20) = true
   - Core supprimé : `if (!isVeryShort && corePool.length > 0)` → false → core absent ✓
   - Warmup réduit à 1 série : `effectiveWarmupSpec = { ...WARMUP_SPEC, sets: 1 }` ✓
6. Total push : 4 slots + 1 warmup = **5 exercices** (pas 4 comme indiqué dans le prompt)
7. generatorWarnings après le loop :
   - BUG-E2 : `if (sessionDuration <= 20)` → unshift "Séance express (20 min)…" ✓
   - generatorWarnings[0] = "Séance express…"

**Assertions :**
- Core supprimé (≤20min) : **PASS**
- warmup réduit à 1 série : **PASS**
- generatorWarnings[0] = "Séance express…" : **PASS**
- push = 3 slots (assertion prompt) : **FAIL** — base=8 depuis BUG-A2, résultat réel = 4 slots
- Total push = 4 exercices (assertion prompt) : **FAIL** — résultat réel = 4 slots + 1 warmup = 5 exercices

**Réserve ⚠️ :** L'assertion du prompt utilise base=6 pour push (ancienne valeur pré-BUG-A2). Depuis BUG-A2, SLOTS['push'] a 8 entrées. Les calculs du prompt pour P52 sont obsolètes. Le code se comporte correctement (4 slots + 1 warmup = 5 exercices). La logique express est saine.

**Verdict : ⚠️ Problème mineur** — Le comportement est correct mais l'assertion du prompt est fondée sur l'ancienne taille de template (6 au lieu de 8). P52 = OK en pratique, les assertions numériques du prompt sont à corriger.

---

### P53 — selectedDays personnalisés

**Paramètres :** goal=hypertrophy, days=3, duration=60, equipment=[barbell, dumbbell, cable, machine], level=intermediate, selectedDays=['tuesday','thursday','saturday']

**Simulation :**
```typescript
const days: Weekday[] = (selectedDays && selectedDays.length === daysPerWeek)
    ? selectedDays
    : (DAY_ASSIGNMENTS[daysPerWeek] ?? [...])
```
- selectedDays.length = 3 === daysPerWeek = 3 → condition true
- days = ['tuesday', 'thursday', 'saturday']
- week['tuesday'] = workoutId[0], week['thursday'] = workoutId[1], week['saturday'] = workoutId[2]

**Assertions :**
- programme.week['tuesday'] assigné : **PASS**
- programme.week['thursday'] assigné : **PASS**
- programme.week['saturday'] assigné : **PASS**
- Jours par défaut (lun/mer/ven) non utilisés : **PASS**

**Verdict : ✅ Bon programme**

---

### P54 — focusMuscles=['shoulders','arms'] → UX-B et UX-5

**Paramètres :** goal=hypertrophy, days=3, duration=60, equipment=FULL_GYM, level=intermediate, focusMuscles=['shoulders','arms']

**Simulation :**
1. `workoutTypeFromFocus(['shoulders','arms'])` :
   - hasPush = includes('shoulders') = true
   - hasArms = true → hasUpper = true
   - hasPull=false, hasLower=false
   - `hasPush && !hasPull && !hasLower` → return **'push'**
2. focusType = 'push', daysPerWeek=3 :
   ```typescript
   case 3: return ['push', 'upper-push', 'push']
   ```
   Split = `['push', 'upper-push', 'push']`
3. Vérification UX-B :
   ```typescript
   if (split.every((t) => t === 'push') && ...)
   ```
   - `split.every(t => t === 'push')` : 'upper-push' ≠ 'push' → **false** → **UX-B NON déclenché**
4. Vérification UX-5 :
   - hasPullSession : aucun 'pull', 'upper-pull', etc. dans ['push','upper-push','push'] → false
   - hasPushSession : 'push' et 'upper-push' → true
   - `hasPushSession && !hasPullSession` → **UX-5 déclenché** ✓

**Assertions :**
- workoutTypeFromFocus(['shoulders','arms']) → type push-dominant ('push') : **PASS**
- generatorWarnings contient UX-B "Focus bras en push : le biceps n'est pas ciblé…" : **FAIL** — UX-B non déclenché car `split.every(t => t === 'push')` = false (upper-push présent)
- Warning UX-5 (déséquilibre push/pull) : **PASS** — déclenché car hasPullSession=false

**Verdict : ⚠️ Problème mineur** — UX-B a une condition trop restrictive : `split.every(t => t === 'push')`. Avec le split focus push à 3j = ['push','upper-push','push'], la condition échoue à cause de 'upper-push'. Logiquement, l'avertissement devrait s'appliquer (tout le split est push-dominant), mais le code ne le déclenche pas. UX-5 compense partiellement mais ne mentionne pas le biceps spécifiquement.

---

### P55 — Upper-lower préférence explicite 3j

**Paramètres :** goal=hypertrophy, days=3, duration=60, equipment=FULL_GYM, level=intermediate, splitPreference=upper-lower

**Simulation :**
1. `selectSplit(upper-lower, 3j)` → `['upper-push', 'lower-quad', 'upper-pull']`
2. Aucun 'pull' (InternalWorkoutType) dans le split → BUG-BW-PULL non déclenché
3. typeCount : upper-push→canon='upper' count=1 ; lower-quad→canon='lower' count=1 ; upper-pull→canon='upper' count=2
4. totalOfType pour 'upper' = split.filter(t => toPublicType(t)==='upper').length = 2 (upper-push + upper-pull) → suffix A/B
5. Noms :
   - 'Upper — Haut du corps A' (upper-push)
   - 'Lower — Bas du corps' (lower-quad, totalOfType=1)
   - 'Upper — Haut du corps B' (upper-pull)

**Assertions :**
- rawSplit = ['upper-push', 'lower-quad', 'upper-pull'] : **PASS**
- Aucun 'pull' dans le split → fix non déclenché : **PASS**
- 3 séances avec nommage correct (Upper A / Lower / Upper B) : **PASS**

**Verdict : ✅ Bon programme**

---

### P56 — Warning UX-5 avec focusMuscles=['chest']

**Paramètres :** goal=hypertrophy, days=3, duration=60, equipment=FULL_GYM, level=intermediate, focusMuscles=['chest']

**Simulation :**
1. `workoutTypeFromFocus(['chest'])` :
   - hasPush = includes('chest') = true
   - hasPull=false, hasLower=false
   - `hasPush && !hasPull && !hasLower` → return **'push'**
2. focusType='push', daysPerWeek=3 :
   - `['push', 'upper-push', 'push']` (PPU, pas PPP)
3. UX-5 :
   - hasPullSession = false (aucun type pull dans le split)
   - hasPushSession = true ('push' et 'upper-push' inclus dans la liste)
   - → **UX-5 déclenché** : "Déséquilibre push/pull…"
4. Le split réel n'est donc **pas** ['push','push','push'] mais ['push','upper-push','push'] (PPU)

**Assertions :**
- workoutTypeFromFocus(['chest']) → 'push' : **PASS**
- Split 3j : ['push','upper-push','push'] (PPU, pas PPP) : **PASS** — clarification utile
- UX-5 warning (déséquilibre push/pull) : **PASS**

**Verdict : ✅ Bon programme** — UX-5 correct. La question "['push','push','push'] ou PPU" est résolue : c'est PPU.

---

## Groupe F — P57–P66

---

### P57 — Warmup filtré par équipement (BW pur)

**Paramètres :** goal=fat_loss, days=2, duration=60, equipment=[bodyweight], level=beginner

**Simulation :**
```typescript
const warmupPool = exercises.filter(
    (ex) => !ex.deleted && ex.isWarmupExercise &&
    (allowed.has(ex.equipment) || ex.equipment === 'bodyweight'),
)
```
- allowed = Set{'bodyweight'}
- seed-band-pull-apart : equipment=band → allowed.has('band')=false, 'band'≠'bodyweight' → **EXCLU** ✓
- seed-clamshell : equipment=band → **EXCLU** ✓
- Tous les warmup BW (bird-dog, cat-cow, shoulder-circles, dead-bug, walking-lunges, glute-bridge-warmup, good-morning-bw, hip-9090, inchworm, jumping-jacks, leg-swings, mountain-climbers, thoracic-rotation, bodyweight-squat, superman, worlds-greatest-stretch) → **INCLUS** ✓

**Assertions :**
- warmupPool filtrée (pas d'élastique en BW pur) : **PASS**
- band-pull-apart exclu (equipment=band) : **PASS**
- Warmup sélectionné parmi BW disponibles : **PASS**

**Verdict : ✅ Bon programme**

---

### P58 — corePool présent en FULL_GYM

**Paramètres :** goal=hypertrophy, days=2, duration=60, equipment=FULL_GYM, level=intermediate

**Simulation :**
```typescript
const corePool = exercises.filter(
    (ex) => !ex.deleted && !ex.isWarmupExercise && ex.primaryMuscle === 'core' &&
    (allowed.has(ex.equipment) || ex.equipment === 'bodyweight'),
)
```
- allowed = Set{barbell, dumbbell, cable, machine, bodyweight, pullup_bar}
- Exercices core disponibles :
  - seed-plank (BW) ✓, seed-crunch (BW) ✓, seed-bicycle-crunch (BW) ✓
  - seed-cable-crunch (cable) ✓, seed-hanging-leg-raise (pullup_bar) ✓
  - seed-leg-raise (BW), seed-side-plank (BW), seed-ab-wheel (BW), etc.
- corePool non vide → un exercice core ajouté en dernière position ✓

**Assertions :**
- corePool non vide en FULL_GYM : **PASS**
- Un exercice core sélectionné en queue de séance : **PASS**

**Verdict : ✅ Bon programme**

---

### P59 — Anti-répétition usedGlobally (PPL 5j FULL_GYM)

**Paramètres :** goal=hypertrophy, days=5, duration=60, equipment=FULL_GYM, level=intermediate, splitPreference=ppl

**Simulation :**
1. `selectSplit(ppl, 5j)` → `['push', 'pull', 'legs', 'push', 'pull']`
2. hasCompoundBack = true → split inchangé
3. Mécanisme usedGlobally :
   - Push A construit : IDs des exercices ajoutés à `usedGlobally`
   - Push B construit : dans `pickExercise`, le tri :
     ```typescript
     const aUsed = usedGlobally.has(a.id) ? 1 : 0
     const bUsed = usedGlobally.has(b.id) ? 1 : 0
     if (aUsed !== bUsed) return aUsed - bUsed
     ```
     → Exercices non encore utilisés triés AVANT les utilisés → variété favorisée
   - En FULL_GYM (nombreux exercices), Push B choisit des exercices différents pour la majorité des slots

**Nuance importante :** usedGlobally **déprioritise** (ne bloque pas strictement). Si un seul candidat existe pour un slot, il sera réutilisé malgré usedGlobally. Pour FULL_GYM, la variété est quasi garantie en pratique mais pas mathématiquement absolue.

**Assertions :**
- rawSplit = ['push','pull','legs','push','pull'] : **PASS**
- hasCompoundBack = true → split inchangé : **PASS**
- Push A et Push B exercices différents (usedGlobally actif) : **PASS** (en pratique avec FULL_GYM)
- Pull A et Pull B exercices différents : **PASS** (idem)
- "Aucun exerciceId dupliqué dans l'ensemble du programme" : **FAIL (partiel)** — ce n'est pas garanti par le code (déprioritisation, pas exclusion stricte). Assertion trop forte.

**Verdict : ⚠️ Problème mineur** — Le mécanisme usedGlobally fonctionne correctement pour déprioritiser les répétitions. L'assertion "aucun doublon" est trop stricte pour la logique implémentée. En FULL_GYM, les doublons sont rares mais possibles.

---

### P60 — Strength + focusMuscles=['back'] + 3j

**Paramètres :** goal=strength, days=3, duration=60, equipment=FULL_GYM, level=intermediate, focusMuscles=['back'], splitPreference=auto

**Simulation :**
1. `workoutTypeFromFocus(['back'])` :
   - hasPull = includes('back') = true
   - hasPush=false, hasLower=false
   - `hasPull && !hasPush && !hasLower` → return **'pull'**
2. focusType='pull', daysPerWeek=3 :
   ```typescript
   if (focusType === 'pull') {
       case 3: return ['pull', 'upper-pull', 'pull']
   }
   ```
   Split = `['pull', 'upper-pull', 'pull']`
3. hasCompoundBack = true (FULL_GYM) → hasPullInSplit = split.some(t => t === 'pull') = true → mais hasCompoundBack=true → **aucun remplacement**
4. Split final = `['pull', 'upper-pull', 'pull']`
5. Séance 'pull' : slots composés back_width + back_thickness disponibles en FULL_GYM

**Assertions :**
- workoutTypeFromFocus(['back']) → 'pull' : **PASS**
- Split 3j pull-focus = ['pull','upper-pull','pull'] : **PASS**
- hasCompoundBack = true → 'pull' non remplacé : **PASS**

**Verdict : ✅ Bon programme**

---

### P61 — Strength + barbell + 20min → slots réduits

**Paramètres :** goal=strength, days=3, duration=20, equipment=[barbell], level=intermediate, splitPreference=fullbody

**Simulation :**
1. `selectSplit(fullbody, 3j)` → `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`
2. hasCompoundBack = true (seed-row-barbell, compound, back_thickness) → split inchangé
3. fullbody-quad (base=9, duration=20, goal=strength) :
   ```typescript
   if (duration === 20) return isStrength
       ? Math.min(3, Math.max(2, Math.floor(base * 0.5)))
       : Math.max(2, Math.floor(base * 0.5))
   ```
   = min(3, max(2, floor(9×0.5))) = min(3, max(2, 4)) = min(3, 4) = **3 slots**

   **L'assertion du prompt dit 4 slots — c'est INCORRECT.** Le code a un cap `min(3,...)` pour strength à 20min non présent dans la table du prompt. Résultat réel : **3 slots**.

4. adjustedSpec(COMPOUND_SPEC.strength, 20) : sets = max(2, floor(5×0.5)) = max(2, 2) = **2 séries** ✓
5. isVeryShort = true → core supprimé ✓, warmup 1 série ✓
6. Total par séance : **3 slots + 1 warmup = 4 exercices** (pas 5 comme dit le prompt)

**Assertions :**
- Split fullbody×3 (strength+intermediate) : **PASS**
- adjustedSlotCount = 4 slots (assertion prompt) : **FAIL** — réel = **3 slots** (cap strength 20min)
- adjustedSpec compound : 2 séries × 3-5 reps : **PASS**
- Core supprimé, warmup 1 série : **PASS**
- Total = 5 exercices (assertion prompt) : **FAIL** — réel = 3+1 = **4 exercices**

**Verdict : ⚠️ Problème mineur** — Le code est cohérent avec la logique force (cap à 3 slots à 20min). Le prompt d'audit oublie le `min(3,...)` cap strength à 20min. Aucun bug dans le générateur — l'assertion du prompt est erronée. 3 slots + 1 warmup = 4 exercices est raisonnable pour une séance force de 20min.

---

### P62 — lower-quad 90min hypertrophy

**Paramètres :** goal=hypertrophy, days=5, duration=90, equipment=FULL_GYM, level=intermediate, splitPreference=auto

**Simulation :**
1. Split mass+5j+intermediate = `['push', 'pull', 'lower-quad', 'upper', 'lower-hip']`
2. lower-quad : SLOTS['lower-quad'] a **8 entrées** (6 de base + 2 bonus 90min déjà intégrées dans le template)
3. adjustedSlotCount(8, 90, 'hypertrophy') = min(8+2, 8) = min(10, 8) = **8 slots**
4. Total lower-quad : 8 slots + warmup + core = **10 exercices** ✓
5. lower-hip idem : base=8, adjustedSlotCount=8 → 10 exercices ✓

**Réserve :** le prompt écrit "min(6+2,8)=8" en supposant base=6. La vraie base est 8 (BUG-A2 fix). Le résultat (8) est correct.

**Assertions :**
- Split = ['push','pull','lower-quad','upper','lower-hip'] : **PASS**
- lower-quad 90min → 8 slots : **PASS** (via min(8+2,8)=8)
- SLOTS['lower-quad'] a 8 entrées (slots bonus 90min inclus) : **PASS**
- Total lower-quad : 10 exercices (8+warmup+core) : **PASS**
- lower-hip idem : **PASS**

**Verdict : ✅ Bon programme**

---

### P63 — upper 90min hypertrophy (upper-lower 5j)

**Paramètres :** goal=hypertrophy, days=5, duration=90, equipment=FULL_GYM, level=intermediate, splitPreference=upper-lower

**Simulation :**
1. `selectSplit(upper-lower, 5j)` → `['upper-push', 'lower-quad', 'upper-pull', 'lower-hip', 'upper']`
2. Séance 'upper' : SLOTS['upper'] a **8 entrées** (base=8)
   - adjustedSlotCount(8, 90, 'hypertrophy') = min(8+2, 8) = min(10, 8) = **8 slots** (déjà au cap)
3. Séance 'upper-push' : base=8 → min(8+2,8) = **8 slots**
4. Total upper : 8 + warmup + core = **10 exercices** ✓

**Assertions :**
- split (upper-lower, 5j) = ['upper-push','lower-quad','upper-pull','lower-hip','upper'] : **PASS**
- upper (8 slots, 90min) → min(8+2,8)=8 → 8 slots (déjà cap) : **PASS**
- upper-push → 8 slots idem : **PASS**
- Total : 10 exercices (8+warmup+core) : **PASS**

**Verdict : ✅ Bon programme**

---

### P64 — Ordre usedGlobally vs strengthEquipmentPrio (BUG-C2)

**Paramètres :** goal=strength, days=5, duration=60, equipment=FULL_GYM, level=intermediate, splitPreference=auto

**Simulation :**
1. Split mass+strength+5j+intermediate = `['push', 'pull', 'lower-quad', 'upper', 'lower-hip']`
2. Code de tri dans pickExercise :
   ```typescript
   // 1. Focus muscle priority
   if (focused.size > 0) { ... }
   // 2. slotPrimary match
   const slotPrimary = slot.muscles[0]
   if (slotPrimary) { ... }
   // 3. BUG-C2 fix : anti-répétition globale AVANT préférence équipement force
   const aUsed = usedGlobally.has(a.id) ? 1 : 0
   const bUsed = usedGlobally.has(b.id) ? 1 : 0
   if (aUsed !== bUsed) return aUsed - bUsed
   // 4. strengthEquipmentPrio (seulement après usedGlobally)
   if (goal === 'strength' && slot.compound) {
       const eqDiff = strengthEquipmentPrio(a.equipment) - strengthEquipmentPrio(b.equipment)
       if (eqDiff !== 0) return eqDiff
   }
   // 5. popularité
   ```
3. Ordre confirmé dans le code : usedGlobally (critère 3) AVANT strengthEquipmentPrio (critère 4) ✓

**Assertions :**
- Ordre de tri pickExercise : usedGlobally avant strengthEquipmentPrio : **PASS**
- Un exercice déjà utilisé dans une séance précédente est écarté même s'il est barbell : **PASS** (déprioritisé, pas exclu — voir nuance P59)

**Verdict : ✅ Bon programme** — BUG-C2 confirmé actif.

---

### P65 — selectedDays incompatible → fallback DAY_ASSIGNMENTS

**Paramètres :** goal=hypertrophy, days=3, duration=60, equipment=[barbell, dumbbell, cable, machine], level=intermediate, selectedDays=['monday']

**Simulation :**
```typescript
const days: Weekday[] = (selectedDays && selectedDays.length === daysPerWeek)
    ? selectedDays
    : (DAY_ASSIGNMENTS[daysPerWeek] ?? ['monday', 'wednesday', 'friday'] as Weekday[])
```
- selectedDays.length = 1 ≠ daysPerWeek = 3 → condition **false**
- Fallback : DAY_ASSIGNMENTS[3] = `['monday', 'wednesday', 'friday']`
- Les jours fournis sont ignorés ✓

**Assertions :**
- `selectedDays.length === daysPerWeek` = false (1 ≠ 3) : **PASS**
- Fallback vers DAY_ASSIGNMENTS[3] = ['monday','wednesday','friday'] : **PASS**
- Jours fournis ignorés : **PASS**

**Verdict : ✅ Bon programme**

---

### P66 — Hypertrophy 2j beginner BW+pullup_bar → fullbody A/B

**Paramètres :** goal=hypertrophy, days=2, duration=60, equipment=[bodyweight, pullup_bar], level=beginner

**Simulation :**
1. Split 2j → `['fullbody-quad', 'fullbody-hip']`
2. available : exercices non-warmup avec equipment ∈ {bodyweight, pullup_bar}
3. hasCompoundBack : seed-pullup (pullup_bar, back_width, compound) et bw-inverted-row (pullup_bar, back_thickness, compound) → **true** → BUG-BW-PULL non déclenché ✓
4. Séance fullbody-hip (session B) :
   - SLOTS['fullbody-hip'][2] = `{ muscles: ['back_width', 'back_thickness', 'back'], compound: true }` (BUG-HIP-BACK fix)
   - Candidats compound back avec equipment ∈ {bodyweight, pullup_bar} :
     - seed-pullup : equipment=pullup_bar, primaryMuscle=back_width → dans ['back_width','back_thickness','back'] → **CANDIDAT** ✓
     - bw-inverted-row : equipment=pullup_bar, primaryMuscle=back_thickness → **CANDIDAT** (BUG-HIP-BACK fix actif) ✓
   - Slot non vide ✓
5. Exercices A (fullbody-quad) et B (fullbody-hip) partiellement différents (types de séances différents, slots différents)

**Assertions :**
- Split = ['fullbody-quad','fullbody-hip'] : **PASS**
- hasCompoundBack = true (pullup_bar → pull-up compound) : **PASS**
- BUG-BW-PULL non déclenché : **PASS**
- fullbody-hip slot dos : back_width+back_thickness+back compound → pull-up/inverted-row → slot non vide : **PASS**
- BUG-HIP-BACK fix actif (back_thickness accepté pour le slot hip) : **PASS**

**Verdict : ✅ Bon programme** — BUG-HIP-BACK fix confirmé actif.

---

## Tableau de synthèse P45–P66

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|--------|---------------------|---------|-------------------|
| P45 — PPL nommage | Noms Push/Pull/Legs corrects, pas de suffix | ✅ | — |
| P46 — Arnold 5j | Split + noms A/B corrects | ✅ | Noms incluent sous-titre FR |
| P47 — Brosplit 5j | Split + back-bi non remplacé | ✅ | — |
| P48 — Phase intensification strength | repsOffset=-2 confirmé dans code | ✅ | Prompt a une typo dans le chemin (.compound inexistant) |
| P49 — UX-C (force+débutant) | Warning présent via unshift | ✅ | — |
| P50 — UX-H (débutant 5j) | Warning présent via push | ✅ | — |
| P51 — focusMuscles=['glutes'] | 'glutes' ∉ FocusMuscle → null → split par défaut | ❌ | Fonctionnalité manquante : 'glutes' non géré comme FocusMuscle |
| P52 — Express 20min | Core supprimé, warmup 1 série ✓ ; calcul slots basé sur ancienne taille de template (6→8) | ⚠️ | Assertion du prompt obsolète (push base=8 pas 6) |
| P53 — selectedDays | Jours respectés quand length===days | ✅ | — |
| P54 — UX-B (shoulders+arms en push) | UX-B non déclenché (upper-push ≠ 'push') ; UX-5 déclenché | ⚠️ | Bug UX-B : condition trop stricte (every === 'push') |
| P55 — Upper-lower 3j | Split [upper-push, lower-quad, upper-pull], pas de 'pull' | ✅ | — |
| P56 — UX-5 (chest focus) | Split PPU, UX-5 déclenché | ✅ | — |
| P57 — Warmup filtré BW | Band exclu, BW inclus | ✅ | — |
| P58 — corePool FULL_GYM | Core présent, sélection en queue | ✅ | — |
| P59 — usedGlobally PPL 5j | Anti-repeat actif (déprioritisation) ; "aucun doublon" non garanti | ⚠️ | Assertion trop forte ; déprioritisation ≠ exclusion stricte |
| P60 — Strength + focus back | workoutTypeFromFocus('back')→'pull' ; split pull-focus correct | ✅ | — |
| P61 — Strength + barbell + 20min | Code donne 3 slots (cap min(3,...)) ; assertion prompt dit 4 | ⚠️ | Assertion du prompt oublie le cap strength 20min |
| P62 — lower-quad 90min | 8 slots (min(10,8)=8) ✓ | ✅ | Prompt note base=6 mais réel=8 ; résultat identique |
| P63 — upper 90min | 8 slots (déjà cap) ✓ | ✅ | — |
| P64 — BUG-C2 usedGlobally avant strengthEquipmentPrio | Ordre confirmé dans le code | ✅ | — |
| P65 — selectedDays incompatible | Fallback DAY_ASSIGNMENTS[3] ✓ | ✅ | — |
| P66 — 2j BW+BAR fullbody | BUG-HIP-BACK fix actif, slot dos non vide | ✅ | — |

---

## Synthèse des problèmes ouverts

### Bugs / anomalies logicielles (assertions FAIL ou FAIL partiel)

#### FAIL

**P51 — 'glutes' absent de FocusMuscle**
- Gravité : modérée
- 'glutes' n'est pas géré dans `workoutTypeFromFocus` ni dans `FOCUS_TO_MUSCLES`. Un utilisateur qui souhaiterait ciblerles fessiers via `focusMuscles` (sans passer par `splitPreference: 'glutes-focus'`) obtient le split auto par défaut sans avertissement. Le scénario n'est pas exposé dans l'UI (puisque le type FocusMuscle ne l'inclut pas), mais représente une incohérence entre les intentions de l'utilisateur et le générateur.

#### FAIL PARTIEL / Assertions erronées dans le prompt

**P52 / P61 / P62 — Formules adjustedSlotCount inexactes dans le prompt d'audit**
- La table de référence du prompt omet le cap `min(3,...)` pour strength à 20min et 45min.
- P52 : push base=6 supposé dans le prompt (réel=8 depuis BUG-A2) → calcul du prompt obsolète.
- P61 : prompt dit 4 slots → réel = 3 (cap strength 20min). Le code est correct ; le prompt est erroné.
- Ces assertions sont **des erreurs dans le prompt d'audit**, pas des bugs du générateur.

**P54 — UX-B non déclenché (condition trop restrictive)**
- Gravité : mineure
- `split.every(t => t === 'push')` exige que TOUTES les sessions soient littéralement 'push'. Avec le split focus push à 3j = ['push','upper-push','push'], 'upper-push' bloque la condition.
- Logiquement, un split entièrement push-dominant (push + upper-push) devrait déclencher UX-B si l'utilisateur a des bras/épaules en focus.
- Fix suggéré : remplacer `every(t => t === 'push')` par `every(t => t === 'push' || t === 'upper-push')` (ou tester hasPullSession=false && hasFocusArms).

**P59 — "Aucun doublon" non garanti**
- Gravité : faible
- usedGlobally déprioritise les exercices déjà utilisés dans d'autres séances, mais ne les exclut pas strictement. Un doublon reste possible si c'est le seul candidat pour un slot. L'assertion du prompt ("aucun exerciceId dupliqué") est trop forte pour la logique implémentée.

### Observations hors-scope (non P45-P66 mais notées lors de la lecture du code)

**buildPhases — phase 'Décharge' non renommée**
- `phases.push({ name: 'Décharge', focus: 'deload', ... })` — le INC-4 fix (P30) voulait 'Récup.' mais cela concerne peut-être uniquement les composants d'affichage (`PHASE_NAME_FR`). À vérifier lors de l'audit P30.

### Réserves coach cumulées

1. **UX-B trop stricte :** Les scénarios focus shoulders/arms avec split PPU ne déclenchent pas l'avertissement UX-B. L'utilisateur n'est pas alerté que son biceps n'est pas ciblé malgré un focus bras.
2. **usedGlobally ≠ exclusion stricte :** La propriété anti-répétition est présentée comme garantissant des exercices différents entre séances, mais c'est une déprioritisation. En équipement restreint (ex. barbell seul), le bench press peut apparaître deux fois.
3. **'glutes' comme FocusMuscle manquant :** Si l'app est étendue pour offrir 'glutes' en focus muscle direct, le code ne supporte pas ce cas — il faudrait ajouter 'glutes' à FocusMuscle et FOCUS_TO_MUSCLES, et gérer le retour de 'glutes-hip' dans workoutTypeFromFocus.
4. **Taille des templates dans le prompt :** Plusieurs assertions du prompt utilisent encore "base=6" pour push/pull/lower-quad (ancienne valeur pré-BUG-A2). Les formules doivent être mises à jour pour refléter base=8.
