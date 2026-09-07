# Audit P23–P32 — Groupe C (v6)
**Date :** 2026-09-07  
**Fichiers lus :**
- `src/utils/programGenerator.ts`
- `src/components/screens/ProgramGeneratorScreen.tsx`
- `src/components/screens/ProgramDetailScreen.tsx`
- `src/data/exercises-seed.json`

**Fixes vérifiés :** INC-1, BUG-A1, BUG-A2, BUG-A3, BUG-C2, BUG-D6, INC-4, INC-5, BUG-C5

---

## Formules de référence (extraites du code — valeurs réelles)

### adjustedSlotCount(base, duration, goal) — code actuel

| Duration | Strength | Autres goals |
|----------|----------|--------------|
| 20 min | `min(3, max(2, floor(base × 0.5)))` | `max(2, floor(base × 0.5))` |
| 45 min | `min(3, max(2, floor(base × 0.5)))` | `max(4, floor(base × 0.75))` |
| 60 min | `max(4, floor(base × 0.5))` | `base` (inchangé) |
| 90 min | `min(base, 5)` | `min(base + 2, 8)` |

> ⚠️ **Écart avec le tableau de référence du prompt v6** : les formules de 20 min et 45 min strength diffèrent de la référence (le prompt note `max(3, floor(base×0.75))` pour 45 min, le code applique `min(3, max(2, floor(base×0.5)))` avec cap à 3). Les formules 60 min et 90 min sont conformes.

### adjustedSpec(spec, duration) — code actuel

```
if (duration >= 45) return spec   // inchangé
// 20 min uniquement :
return { ...spec, sets: Math.max(2, Math.floor(spec.sets * 0.5)) }
```

### Tailles réelles des templates (SLOTS) dans le code

| Type | Entrées SLOTS | Note |
|------|--------------|------|
| push | **8** | slots 7–8 bonus 90 min |
| pull | **8** | slots 7–8 bonus 90 min |
| legs | **8** | slots 7–8 bonus 90 min (⚠️ tableau prompt dit 6) |
| lower | **8** | slots 7–8 bonus 90 min |
| lower-quad | **8** | slots 7–8 bonus 90 min |
| lower-hip | **8** | slots 7–8 bonus 90 min |
| fullbody-quad | **9** | slot 9 éjecté si cap < 9 |
| fullbody-hip | **9** | slot dos : back_width+back_thickness+back (BUG-HIP-BACK fix) |
| upper | **8** | — |
| upper-push | **8** | — |
| upper-pull | **8** | — |

### selectSplit — cas vérifiés P23/P24/P32

| Days | Goal | Level | Split interne |
|------|------|-------|--------------|
| 3 | strength | intermediate | `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']` |
| 5 | strength | intermediate | `['push', 'pull', 'lower-quad', 'upper', 'lower-hip']` |
| 5 | hypertrophy | intermediate | `['push', 'pull', 'lower-quad', 'upper', 'lower-hip']` |

### COMPOUND_SPEC et ISOLATION_SPEC (code réel)

| Objectif | Compound | Isolation |
|----------|----------|-----------|
| hypertrophy | sets:4, 8–12 reps, 90 s | sets:3, 10–15 reps, 75 s |
| strength | sets:5, 3–5 reps, 180 s | sets:3, 8–12 reps, 75 s |

---

### P23 — [INC-1] Force + 3j + intermédiaire → fullbody×3 (pas PPL)
**Paramètres :** goal=strength, days=3, duration=60, equipment=FULL_GYM, level=intermediate, splitPreference=auto

**Simulation étape par étape :**

1. `selectSplit` → code : `if (goal === 'strength' && level !== 'beginner') return ['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`
   - rawSplit = `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`
2. `hasPullInSplit` = false (aucun 'pull' dans le split)
3. `hasCompoundBack` : FULL_GYM → barbell (bent-over-row, deadlift), dumbbell (DB row), cable (lat pulldown cable, seated cable row), machine (lat pulldown machine, seated row machine), pullup_bar (pull-up, chin-up) → `true`
4. Aucun 'pull' dans rawSplit → BUG-BW-PULL non déclenché, `split = rawSplit`
5. Types publics : fullbody-quad → `'fullbody'`, fullbody-hip → `'fullbody'`
6. Nommage : 3 séances de type 'fullbody' → 'Full Body A', 'Full Body B', 'Full Body C'

**Assertions : PASS/FAIL**
- rawSplit = `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']` : **PASS**
- Pas de PPL pour strength + intermediate : **PASS** (branche INC-1 explicitement commentée dans le code)
- hasCompoundBack = true → pas de remplacement pull (de toute façon pas de pull) : **PASS**

**Verdict : ✅ Bon programme**
— INC-1 fix confirmé actif. Le branch `goal === 'strength' && level !== 'beginner'` est en tête du case 3, avant la branche hypertrophie. Aucune régression.

---

### P24 — [BUG-A1] Force + 5j + intermédiaire → push/pull/lower-quad/upper/lower-hip
**Paramètres :** goal=strength, days=5, duration=60, equipment=FULL_GYM, level=intermediate, splitPreference=auto

**Simulation étape par étape :**

1. `selectSplit` → `isMass = (goal === 'strength' || goal === 'hypertrophy') = true`
   - case 5 : `if (isMass && level !== 'beginner') return ['push', 'pull', 'lower-quad', 'upper', 'lower-hip']`
   - rawSplit = `['push', 'pull', 'lower-quad', 'upper', 'lower-hip']`
2. `hasCompoundBack` = true (FULL_GYM)
3. 'pull' dans rawSplit ET hasCompoundBack = true → pas de remplacement
4. split final = rawSplit
5. `toPublicType` appliqué à chaque type interne :
   - push → push
   - pull → pull
   - lower-quad → lower
   - upper → upper
   - lower-hip → lower
   - Types publics : `['push', 'pull', 'lower', 'upper', 'lower']`
6. Nommage (canon = type public, count par canon) :
   - push (1 occurrence) → 'Push — Poussée'
   - pull (1 occurrence) → 'Pull — Tirage'
   - lower-quad (lower, 1er/2) → 'Lower — Bas du corps A'
   - upper (1 occurrence) → 'Upper — Haut du corps'
   - lower-hip (lower, 2e/2) → 'Lower — Bas du corps B'

**Assertions : PASS/FAIL**
- Split (types internes) = `['push', 'pull', 'lower-quad', 'upper', 'lower-hip']` : **PASS**
- Types publics = `['push', 'pull', 'lower', 'upper', 'lower']` : **PASS** (BUG-A1 fix : plus de doublon exact legs/lower)
- hasCompoundBack = true → pull inchangé : **PASS**
- Pas de doublon `legs/lower` identiques : **PASS** (lower-quad et lower-hip sont distincts)

**Verdict : ✅ Bon programme**
— BUG-A1 fix confirmé. Le split 5j masse+intermédiaire utilise bien lower-quad / lower-hip et non legs+lower, offrant deux patterns jambes distincts (squat-dominant vs hip-dominant).

---

### P25 — [BUG-A3] adjustedSpec 45min → séries inchangées
**Paramètres :** goal=hypertrophy, days=3, duration=45, equipment=[barbell, dumbbell], level=intermediate, splitPreference=auto

**Simulation étape par étape :**

1. `selectSplit` → hypertrophy + 3j + intermediate : `return ['push', 'pull', 'legs']`
2. `adjustedSpec(COMPOUND_SPEC.hypertrophy, 45)` :
   - Code : `if (duration >= 45) return spec` → retourne spec inchangé
   - COMPOUND_SPEC.hypertrophy = `{sets:4, repsMin:8, repsMax:12, restSec:90}`
   - Résultat : sets = 4 (inchangé)
3. `adjustedSpec(ISOLATION_SPEC.hypertrophy, 45)` :
   - Code : `if (duration >= 45) return spec` → retourne spec inchangé
   - ISOLATION_SPEC.hypertrophy = `{sets:3, repsMin:10, repsMax:15, restSec:75}`
   - Résultat : sets = 3 (inchangé)
4. `adjustedSlotCount(6, 45, 'hypertrophy')` (pour push, 6 slots base) :
   - Code : `Math.max(4, Math.floor(6 * 0.75))` = `Math.max(4, 4)` = **4 slots**
   - Note : le tableau de référence du prompt dit `max(3, floor(base×0.75))`, le code dit `max(4, ...)` — même résultat pour base=6 (floor(6×0.75)=4), différent pour base≤4.

**Assertions : PASS/FAIL**
- `adjustedSpec(compound4, 45)` → spec inchangé → sets = 4 : **PASS** (BUG-A3 fix confirmé)
- `adjustedSpec(isolation3, 45)` → sets = 3 inchangé : **PASS**
- `adjustedSlotCount(6, 45, 'hypertrophy')` = 4 slots : **PASS** (résultat correct même si formule légèrement différente du prompt)

> ⚠️ **Réserve** : La formule de référence du prompt (`max(3, floor(base×0.75))`) diverge du code (`max(4, floor(base×0.75))`) pour les templates de base ≤ 4. En pratique cela ne touche aucun template existant (tous ont base ≥ 6). La formule du prompt est obsolète sur ce point.

**Verdict : ✅ Bon programme**
— BUG-A3 fix confirmé actif. À 45 min, aucune réduction de séries n'est appliquée ; seul le nombre de slots est ajusté (4 au lieu de 6 pour push), évitant la double réduction dénoncée en v3.

---

### P26 — [BUG-A2] Bonus 90min → push 90min = 8 slots
**Paramètres :** goal=hypertrophy, days=3, duration=90, equipment=FULL_GYM, level=intermediate, splitPreference=ppl

**Simulation étape par étape :**

1. `selectSplit` (pref=ppl, 3j) → `['push', 'pull', 'legs']`
2. `hasCompoundBack` = true (FULL_GYM) → split inchangé
3. `adjustedSlotCount` pour 90 min hypertrophy : `min(base + 2, 8)`

| Séance | SLOTS.length | Calcul | Slots retenus |
|--------|-------------|--------|---------------|
| push | 8 | min(8+2, 8) = min(10,8) = **8** | 8 |
| pull | 8 | min(8+2, 8) = **8** | 8 |
| legs | 8 | min(8+2, 8) = **8** | 8 |

4. Total par séance (avec warmup + core) : 8 slots + 1 warmup + 1 core = **10 exercices**

**Assertions : PASS/FAIL**
- SLOTS.push a 8 entrées → vérification dans le code : index 0–7 listés → **PASS**
- push 90min : `min(6+2, 8) = 8` selon prompt ; code : `min(8+2, 8) = 8` → **résultat identique : 8 slots** : **PASS**
- Total push 90min : 8 + warmup + core = 10 exercices : **PASS**
- pull 90min : 8 slots → 10 exercices : **PASS**
- legs 90min : **PASS** — mais avec une réserve sur le prompt

> ⚠️ **Réserve sur l'assertion legs** : le prompt affirme "SLOTS.legs n'a que 6 → 6 slots → 8 exercices (6+2)" mais le code montre que **SLOTS.legs a bien 8 entrées** (slots 7–8 étiquetés "90 min" dans les commentaires, inclus dans le template par le fix BUG-A2). Le résultat est identique (8 slots), mais la mécanique diffère : base=8 → `min(10,8)=8`, et non base=6 → `min(8,8)=8`. La référence du prompt est obsolète sur le décompte de SLOTS.legs.

**Verdict : ✅ Bon programme**
— BUG-A2 fix confirmé. Le bonus 90 min est pleinement opérationnel car les templates push/pull/legs ont été étendus à 8 entrées. Les 8 slots sont effectivement utilisés à 90 min.

---

### P27 — [BUG-C2] Anti-répétition force (usedGlobally avant strengthEquipmentPrio)
**Paramètres :** goal=strength, days=3, duration=60, equipment=[barbell, dumbbell], level=intermediate, splitPreference=fullbody

**Simulation étape par étape :**

1. `selectSplit` (pref=fullbody, 3j) → `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`
2. Vérification de l'ordre de tri dans `pickExercise` (extrait du code) :

```typescript
candidates.sort((a, b) => {
  // 1. Muscles ciblés (focus)
  if (focused.size > 0) { ... }
  // 2. Muscle principal du slot (slot.muscles[0])
  const slotPrimary = slot.muscles[0]
  if (slotPrimary) { ... if (aP !== bP) return aP - bP }
  // 3. BUG-C2 fix : anti-répétition globale AVANT préférence équipement force
  const aUsed = usedGlobally.has(a.id) ? 1 : 0
  const bUsed = usedGlobally.has(b.id) ? 1 : 0
  if (aUsed !== bUsed) return aUsed - bUsed
  // 4. Préférence équipement force (barbell > machine/cable > dumbbell …)
  if (goal === 'strength' && slot.compound) {
    const eqDiff = strengthEquipmentPrio(a.equipment) - strengthEquipmentPrio(b.equipment)
    if (eqDiff !== 0) return eqDiff
  }
  // 5. Popularité descendante
  return (b.popularity ?? 0) - (a.popularity ?? 0)
})
```

3. L'ordre est : focus → slotPrimary → **usedGlobally** → strengthEquipmentPrio → popularité
4. Effet attendu : en séance C (fullbody-quad), les exercices déjà sélectionnés en séance A sont déprioritisés même s'ils sont barbell (score usedGlobally=1 vs 0 pour un exercice non encore vu).

**Assertions : PASS/FAIL**
- Dans `pickExercise` : l'ordre de tri est usedGlobally AVANT strengthEquipmentPrio : **PASS** (confirmé dans le code, commentaire BUG-C2 fix explicite)
- Séances A et C (fullbody-quad) : exercices composés différents grâce à usedGlobally : **PASS** (logique correcte, exercice usé → score 1 → écarté devant un exercice vierge même barbell)

**Verdict : ✅ Bon programme**
— BUG-C2 fix confirmé. L'anti-répétition globale s'applique avant la préférence d'équipement force, ce qui permet la rotation entre séances fullbody A et C. Un barbell squat utilisé en A ne sera pas répété au même slot en C si un autre composé est disponible.

---

### P28 — [BUG-D6] glutes-focus bloqué pour strength
**Paramètres :** goal=strength, days=4, duration=60, equipment=FULL_GYM, level=intermediate, splitPreference=glutes-focus

**Simulation étape par étape :**

1. `incompatibleReason('glutes-focus')` dans `ProgramGeneratorScreen.tsx` :

```typescript
case 'glutes-focus':
  if (goal === 'strength')
    return 'Programme spécialisation bas du corps — Force préfère des splits incluant des composés haut du corps'
  return null
```

2. Avec goal=strength → retourne une raison non nulle
3. `disabled = reason !== null = true`
4. Le bouton 'glutes-focus' est rendu avec `disabled={true}`, `opacity: 0.45`, `cursor: not-allowed`
5. Le onClick retourne sans action si `disabled`

**Assertions : PASS/FAIL**
- `incompatibleReason('glutes-focus')` avec goal=strength → retourne une raison non nulle : **PASS**
- Le split glutes-focus n'est pas sélectionnable pour strength : **PASS** (disabled=true côté UI)
- Le code passe par `incompatibleReason` (plus hardcoded `disabled:false`) : **PASS** (commentaire "BUG-D6 / INC-3 fix : glutes-focus passe désormais par incompatibleReason" confirme)

**Verdict : ✅ Bon programme**
— BUG-D6 fix confirmé. Le split glutes-focus est géré uniformément par `incompatibleReason`, comme tous les autres splits explicites. Pour strength, la raison est affichée en orange dans l'UI.

---

### P29 — [INC-5] fat_loss bloqué pour brosplit et arnold
**Paramètres :** goal=fat_loss, days=5, duration=60, equipment=[barbell, dumbbell, cable, machine], level=intermediate, splitPreference=brosplit

**Simulation étape par étape :**

1. `incompatibleReason('brosplit')` avec goal=fat_loss :

```typescript
case 'brosplit':
  if (days !== null && days < 5) return `Nécessite 5 séances/sem. — tu en as ${days}`
  if (level === 'beginner') return '...'
  if (goal === 'strength') return '...'
  if (goal === 'endurance') return '...'
  // INC-5 fix :
  if (goal === 'fat_loss') return 'Remise en forme : fréquence élevée par muscle recommandée — Brosplit stimule chaque muscle 1×/sem.'
  return null
```

2. days=5 → première condition false ; level=intermediate → deuxième false ; goal=fat_loss → retourne raison INC-5
3. `incompatibleReason('arnold')` avec goal=fat_loss :

```typescript
case 'arnold':
  ...
  // INC-5 fix
  if (goal === 'fat_loss') return 'Remise en forme : fréquence élevée par muscle recommandée — préfère Full Body ou Upper/Lower'
  return null
```

**Assertions : PASS/FAIL**
- `incompatibleReason('brosplit')` avec goal=fat_loss → retourne une raison : **PASS**
- fat_loss bloqué pour brosplit : **PASS** (disabled=true)
- fat_loss bloqué pour arnold : **PASS** (vérification symétrique)
- Raison affichée en orange sous le bouton dans l'UI : **PASS** (logique renderSplitButton)

**Verdict : ✅ Bon programme**
— INC-5 fix confirmé pour brosplit ET arnold. Le cas fat_loss est traité après strength et endurance dans la cascade switch, ce qui est correct (order of conditions).

---

### P30 — [INC-4] phaseLabel affiche 'Récup.' et non 'Décharge'
**Paramètres :** goal=hypertrophy, durationWeeks=8

**Simulation étape par étape :**

1. `buildPhases(8, 'hypertrophy')` → génère les phases :
   - adapt=2, deload=1, intensive=2, progress=3
   - Phases retournées avec `name: 'Décharge'` et `focus: 'deload'`

2. **ProgramGeneratorScreen.tsx** — `phaseLabel()` :
```typescript
const plain: Record<string, string> = {
    adaptation:      'rodage',
    progression:     'progression',
    intensification: 'pic d\'effort',
    deload:          'récup.',
}
```
→ deload → 'récup.' ✅

3. **ProgramGeneratorScreen.tsx** — `PHASE_ROWS` :
```typescript
{ key: 'deload', emoji: '🔄', name: 'Récup.' }, // INC-4 fix : cohérence v4
```
→ 'Récup.' ✅

4. **ProgramDetailScreen.tsx** — `PHASE_NAME_FR` :
```typescript
const PHASE_NAME_FR: Record<PhaseKey, string> = {
  deload: 'Récup.', // INC-4 fix : alignement vocabulaire v4
  ...
}
```
→ `PHASE_NAME_FR.deload` = 'Récup.' ✅
→ Utilisé dans `ExRow` : `Dispo en ${PHASE_EMOJI[wet.startPhase]} ${PHASE_NAME_FR[wet.startPhase]}`

5. **Résidu 'Décharge'** — `buildPhases()` génère `name: 'Décharge'` pour la phase deload :
```typescript
phases.push({
    name: 'Décharge',   // ← toujours 'Décharge'
    focus: 'deload',
    ...
})
```
→ Ce `phase.name` est affiché dans ProgramDetailScreen :
```typescript
<span style={{ fontWeight: 700, fontSize: 13, color }}>{phase.name}</span>
```
→ L'en-tête de la phase deload dans la vue "Périodisation" affiche **'Décharge'**, pas 'Récup.'

**Assertions : PASS/FAIL**
- `phaseLabel` retourne 'récup.' (ProgramGeneratorScreen) : **PASS**
- `PHASE_NAME_FR.deload` = 'Récup.' (ProgramDetailScreen) : **PASS** (utilisé pour les exercices verrouillés)
- Plus aucune instance de 'Décharge' dans le code : **FAIL** ❌ — `buildPhases()` génère encore `name: 'Décharge'`, affiché dans la section "Périodisation" de ProgramDetailScreen

**Verdict : ⚠️ Problème mineur**
— INC-4 partiellement appliqué. PHASE_NAME_FR.deload = 'Récup.' est correct et s'affiche pour les exercices verrouillés. Mais le champ `name` généré par `buildPhases()` reste 'Décharge' et s'affiche dans la liste des phases de ProgramDetailScreen. L'UI montre 'Décharge' dans le titre de la phase, 'Récup.' dans le sous-contexte des exercices verrouillés — **incohérence terminologique résiduelle**.

---

### P31 — [BUG-C5] hip-adduction-machine.primaryMuscle = 'hamstrings'
**Paramètres :** vérification seed uniquement

**Vérification dans exercises-seed.json :**

```json
{
  "id": "seed-hip-adduction-machine",
  "name": "Machine adducteurs",
  "primaryMuscle": "hamstrings",
  ...
}
```

**Assertions : PASS/FAIL**
- `hip-adduction-machine.primaryMuscle` = 'hamstrings' dans le seed : **PASS**
- Plus de `primaryMuscle: 'glutes'` pour cet exercice : **PASS**

**Verdict : ✅ Bon programme**
— BUG-C5 fix confirmé. La machine adducteurs est correctement classée en `hamstrings` (chaîne postérieure de la hanche). Cela permet sa sélection dans les slots ischio-jambiers (lower-hip slot 4 `{muscles:['hamstrings'], compound:false}`) et évite un faux doublon en slot fessiers.

---

### P32 — Régression globale : programme FULL_GYM hypertrophie 5j → cohérence complète
**Paramètres :** goal=hypertrophy, days=5, duration=60, equipment=FULL_GYM, level=intermediate, splitPreference=auto

**Simulation étape par étape :**

1. `selectSplit` :
   - isMass = true (hypertrophy)
   - case 5 : `if (isMass && level !== 'beginner') return ['push', 'pull', 'lower-quad', 'upper', 'lower-hip']`
   - rawSplit = `['push', 'pull', 'lower-quad', 'upper', 'lower-hip']` ✅

2. `hasCompoundBack` = true (FULL_GYM : barbell, dumbbell, cable, machine, pullup_bar → nombreux composés dos)
3. `hasPullInSplit` = true ('pull' dans rawSplit)
4. `hasCompoundBack && hasPullInSplit` → pas de remplacement BUG-BW-PULL → split = rawSplit ✅

5. Comptage des types publics (canon) pour le nommage :
   - push → 'push' (1 occurrence)
   - pull → 'pull' (1 occurrence)
   - lower-quad → 'lower' (1er/2)
   - upper → 'upper' (1 occurrence)
   - lower-hip → 'lower' (2e/2)

6. Noms des séances :
   - workoutType=push, count=1, total=1 → 'Push — Poussée'
   - workoutType=pull, count=1, total=1 → 'Pull — Tirage'
   - workoutType=lower-quad, count=1, total=2 → 'Lower — Bas du corps A'
   - workoutType=upper, count=1, total=1 → 'Upper — Haut du corps'
   - workoutType=lower-hip, count=2, total=2 → 'Lower — Bas du corps B'

7. Slots par séance à 60 min (hypertrophy, base = taille du template) :
   - `adjustedSlotCount(base, 60, 'hypertrophy')` = `base` (inchangé à 60 min)
   - push : base=8 mais slotCount=8 → slice(0,8) = 8 slots (tous utilisés)

   Wait — code : `if (duration === 60) return isStrength ? ... : base`  
   base = SLOTS.push.length = 8 → slotCount = 8 → tous les slots disponibles

   | Séance | base (SLOTS.length) | slotCount | Exercices |
   |--------|---------------------|-----------|-----------|
   | push | 8 | 8 | 8 + warmup + core = 10 |
   | pull | 8 | 8 | 10 |
   | lower-quad | 8 | 8 | 10 |
   | upper | 8 | 8 | 10 |
   | lower-hip | 8 | 8 | 10 |

   > ⚠️ **Réserve** : à 60 min, `adjustedSlotCount` retourne `base` pour non-strength, soit **8 slots** pour push/pull/lower-quad/lower-hip. Cela représente ~60+ min avec des exercices standards (4×8–12 + 90 s repos). À 60 min, 8 exercices composés-isolations est ambitieux ; la mécanique ne plafonne pas à 6 pour les durées de 60 min (seul le 45 min plafonne via `floor(base×0.75)`). C'est un comportement existant, non un bug.

8. `generatorWarnings` :
   - BUG-BW-PULL non déclenché → pas de warning de remplacement
   - Aucun slot composé vide attendu avec FULL_GYM
   - Pas de warning UX-C (intermediate, pas beginner)
   - Pas de warning UX-H (< 5j → 5j mais intermediate)
   → `generatorWarnings` = undefined (aucun warning) ✅

**Assertions : PASS/FAIL**
- Split = `['push', 'pull', 'lower-quad', 'upper', 'lower-hip']` : **PASS**
- hasCompoundBack = true → pull non remplacé : **PASS**
- Chaque séance non vide (exercices disponibles pour tous les slots) : **PASS** (FULL_GYM couvre tous les muscles)
- generatorWarnings vide : **PASS**
- Noms : Push, Pull, Lower A, Upper, Lower B : **PASS**

**Verdict : ✅ Bon programme**
— Régression globale PASS. Le programme FULL_GYM 5j hypertrophie est cohérent. Tous les fixes v4 (BUG-A1, BUG-A2, BUG-C2) contribuent à un split varié et bien nommé.

---

## Tableau de synthèse P23–P32

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|--------|---------------------|---------|-------------------|
| P23 — INC-1 | strength+3j+intermediate → fullbody×3 | ✅ | — |
| P24 — BUG-A1 | strength+5j+intermediate → push/pull/lower-quad/upper/lower-hip | ✅ | — |
| P25 — BUG-A3 | adjustedSpec(45min) → spec inchangé, sets=4 compound | ✅ | Formule référence prompt 45min inexacte (max3 vs max4) — résultat identique pour base≥6 |
| P26 — BUG-A2 | SLOTS.push/pull/legs 8 entrées → 90min = 8 slots | ✅ | Prompt dit SLOTS.legs=6 mais code en a 8 ; résultat final identique |
| P27 — BUG-C2 | pickExercise tri : usedGlobally AVANT strengthEquipmentPrio | ✅ | — |
| P28 — BUG-D6 | glutes-focus disabled pour strength via incompatibleReason | ✅ | — |
| P29 — INC-5 | fat_loss bloqué brosplit ET arnold | ✅ | — |
| P30 — INC-4 | PHASE_NAME_FR.deload='Récup.' | ⚠️ | buildPhases() génère encore name:'Décharge' → affiché dans la liste des phases ProgramDetailScreen |
| P31 — BUG-C5 | seed-hip-adduction-machine.primaryMuscle='hamstrings' | ✅ | — |
| P32 — Régression | FULL_GYM 5j hypertrophie cohérence complète | ✅ | 60 min retourne base slots (8) sans plafond — léger sur-volume théorique |

---

## Synthèse des problèmes ouverts

### Bugs / anomalies logicielles (assertions FAIL)

#### FAIL — P30 : Résidu 'Décharge' dans buildPhases (INC-4 incomplet)

**Fichier :** `src/utils/programGenerator.ts`, fonction `buildPhases()`

**Description :** Le champ `name` de la phase deload est encore 'Décharge' dans `buildPhases()` :
```typescript
phases.push({
    name: 'Décharge',   // ← toujours 'Décharge'
    focus: 'deload',
    ...
})
```
Ce nom est utilisé directement dans `ProgramDetailScreen.tsx` pour l'en-tête de la phase :
```typescript
<span style={{ fontWeight: 700, fontSize: 13, color }}>{phase.name}</span>
```

**Effet :** L'interface "Périodisation" dans ProgramDetailScreen affiche **'Décharge'** comme titre de la dernière phase, alors que ProgramGeneratorScreen et PHASE_NAME_FR utilisent 'Récup.'. Incohérence terminologique visible par l'utilisateur.

**Correction suggérée :** Changer `name: 'Décharge'` en `name: 'Récup.'` dans `buildPhases()`.

---

### Réserves coach cumulées (non bloquant)

1. **Formules de référence du prompt v6 obsolètes** (P25, P26) :
   - Tableau "Formules de référence" : 20 min et 45 min strength indiquent `max(3, floor(base×0.75))`, le code applique `min(3, max(2, floor(base×0.5)))` (cap différent, formule différente). Aucun impact pratique sur les cas testés (base ≥ 6 dans tous les profils), mais la documentation est trompeuse.
   - SLOTS.legs décrit comme "6" dans la table mais a 8 entrées dans le code (fix BUG-A2 appliqué également à legs).

2. **Volume à 60 min non plafonné** (P32) :
   - Pour les non-strength, `adjustedSlotCount(base=8, 60)` retourne 8 (tous les slots). Un programme Push 60 min à 8 exercices (4 composés + 4 isolations, 4×8–12 + 90 s repos) dépasse réalistement 60 min. Ce n'est pas un bug introduit par les fixes récents, mais une tension de design existante entre le template étendu à 8 slots (nécessaire pour le bonus 90 min) et le comportement à 60 min.

3. **Nommage 'Full Body A/B/C' vs 'Full Body'** (P23) :
   - En fullbody×3 force (3 séances), les 3 séances sont nommées 'Full Body A', 'Full Body B', 'Full Body C'. C'est correct (3 types canoniques 'fullbody' → suffixes A/B/C), mais les séances A et C sont identiques (fullbody-quad) alors que B est différent (fullbody-hip). Le suffixe C pour fullbody-quad est logique du point de vue du compteur mais pourrait surprendre l'utilisateur qui s'attendrait à "A puis B puis A".
