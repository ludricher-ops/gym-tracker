# Audit v8 — Groupe E (P81-P100) : FocusMuscles · Split selection · UX warnings

**Date :** 2026-09-07  
**Auditeur :** Claude Sonnet 4.6  
**Base de code :** `src/utils/programGenerator.ts` (post-commits v7)  
**Seed :** `src/data/exercises-seed.json`

---

## Rappels de code critiques

### `workoutTypeFromFocus` (lignes 417-452)

```typescript
function workoutTypeFromFocus(focusMuscles: FocusMuscle[]) {
  if (focusMuscles.length === 0) return null
  const hasLower = focusMuscles.includes('legs')
  const hasPush  = focusMuscles.includes('chest') || focusMuscles.includes('shoulders')
  const hasPull  = focusMuscles.includes('back')
  const hasArms  = focusMuscles.includes('arms')
  const hasCore  = focusMuscles.includes('core')
  const hasUpper = hasPush || hasPull || hasArms

  if (hasLower && !hasUpper)              return 'lower'
  if (hasCore && !hasLower && !hasUpper)  return null          // core seul → null
  if (hasPush && !hasPull && !hasLower)   return 'push'
  if (hasPull && !hasPush && !hasLower)   return 'pull'
  if (hasUpper && !hasLower)              return 'upper'
  if (hasLower && hasPush && !hasPull)    return 'lower_push'
  if (hasLower && hasPull && !hasPush)    return 'lower_pull'
  const hasGlutes = focusMuscles.includes('glutes')
  if (hasGlutes && !hasUpper && !hasLower) return 'glutes-hip'
  return null
}
```

**Ordre des checks est critique** : `hasPull && !hasPush && !hasLower` est évalué **avant** `hasUpper && !hasLower`.

### UX-B (lignes 1180-1185)

```typescript
if (split.every((t) => t === 'push' || t === 'upper-push') &&
    (focusMuscles ?? []).some((f) => f === 'arms' || f === 'shoulders')) {
  generatorWarnings.push('Focus bras en push : le biceps n\'est pas ciblé en séance push...')
}
```

Condition : **chaque** séance du split doit être `'push'` ou `'upper-push'`.

### `buildPhases` (lignes 904-958)

```typescript
export function buildPhases(totalWeeks: number, goal: ProgramGoal = 'strength'): DraftPhase[] | undefined {
  if (totalWeeks < 8) return undefined          // SEUIL = 8, PAS 4
  ...
  phases.push({
    name: 'Récup.',  // INC-4-RÉSIDUEL fix — ligne 948
    focus: 'deload',
    ...
  })
}
```

Seuil minimum = **8 semaines**. En dessous → `undefined`, aucune phase générée.

### `selectSplit` auto — focus='push', 3j (lignes 544-549)

```typescript
if (focusType === 'push') {
  switch (daysPerWeek) {
    case 3: return ['push', 'upper-push', 'push']
  }
}
```

### `selectSplit` auto — focus='upper', 3j (lignes 532-539)

```typescript
if (focusType === 'upper') {
  switch (daysPerWeek) {
    case 3: return level !== 'beginner'
      ? ['push', 'pull', 'upper']    // PPU — 3 types distincts
      : ['upper-push', 'upper-pull', 'upper-push']
  }
}
```

---

## Résultats par profil

---

### P81 — focusMuscles=['chest'] 3j intermediate ✅ PASS

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate

**Analyse :**
- `workoutTypeFromFocus(['chest'])` :
  - hasLower=false, hasPush=**true** (chest), hasPull=false, hasArms=false
  - Check `hasPush && !hasPull && !hasLower` → **true** → retourne `'push'`
- `selectSplit` focusType='push', 3j → `['push', 'upper-push', 'push']`
- Aucune séance tirage → aucun slot dos compound attendu

**Verdict :** ✅ PASS — workoutTypeFromFocus(['chest']) → 'push' ; split=['push','upper-push','push']

---

### P82 — focusMuscles=['shoulders'] 3j intermediate ✅ PASS

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate

**Analyse :**
- `workoutTypeFromFocus(['shoulders'])` :
  - hasPush=**true** (shoulders inclus dans `focusMuscles.includes('chest') || focusMuscles.includes('shoulders')`)
  - Check `hasPush && !hasPull && !hasLower` → **true** → retourne `'push'`
- `selectSplit` focusType='push', 3j → `['push', 'upper-push', 'push']`

**Verdict :** ✅ PASS — workoutTypeFromFocus(['shoulders']) → 'push' ; split=['push','upper-push','push']

---

### P83 — focusMuscles=['arms'] 3j intermediate ✅ PASS

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate

**Analyse :**
- `workoutTypeFromFocus(['arms'])` :
  - hasLower=false, hasPush=false, hasPull=false, hasArms=**true**
  - hasUpper = hasPush || hasPull || hasArms = **true**
  - Check `hasPush && ...` → false (hasPush=false)
  - Check `hasPull && ...` → false (hasPull=false)
  - Check `hasUpper && !hasLower` → **true** → retourne `'upper'`
- `selectSplit` focusType='upper', 3j, intermediate (level≠'beginner') → `['push', 'pull', 'upper']` (PPU)
- Présence de 'pull' dans le split → biceps ciblé en séance pull

**Verdict :** ✅ PASS — workoutTypeFromFocus(['arms']) → 'upper' (pas 'push') ; split PPU=['push','pull','upper']

---

### P84 — focusMuscles=['legs'] 3j intermediate ✅ PASS

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable,machine], level=intermediate

**Analyse :**
- `workoutTypeFromFocus(['legs'])` :
  - hasLower=**true**, hasUpper=false
  - Premier check `hasLower && !hasUpper` → **true** → retourne `'lower'`
- `selectSplit` focusType='lower' :
  ```typescript
  return Array.from({ length: 3 }, (_, i) => i % 2 === 0 ? 'lower-quad' : 'lower-hip') as Split
  ```
  → `['lower-quad', 'lower-hip', 'lower-quad']`

**Verdict :** ✅ PASS — workoutTypeFromFocus(['legs']) → 'lower' ; split=['lower-quad','lower-hip','lower-quad']

---

### P85 — focusMuscles=['core'] 3j intermediate ✅ PASS

**Profil :** goal=fat_loss, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate

**Analyse :**
- `workoutTypeFromFocus(['core'])` :
  - hasLower=false, hasPush=false, hasPull=false, hasArms=false, hasCore=**true**, hasUpper=false
  - Check `hasCore && !hasLower && !hasUpper` → **true** → retourne `null`
  - Commentaire dans le code (ligne 431-433) : *"le générateur produit un fullbody équilibré avec un exercice core ajouté en queue"*
- focusType=null → branche split par défaut, 3j, fat_loss, intermediate :
  - `!isMass && level !== 'beginner'` → `['push', 'pull', 'fullbody-quad']` (PPF)
- UX-6 "Core seul" émis (lignes 1221-1227) : *"Focus gainage : 'core' seul ne définit pas de type de séance..."*

**Verdict :** ✅ PASS — workoutTypeFromFocus(['core']) → **null** (confirmé ligne 434) ; split par défaut PPF=['push','pull','fullbody-quad'] ; warning UX-6 émis

---

### P86 — focusMuscles=['glutes'] 3j intermediate ✅ PASS

**Profil :** goal=fat_loss, days=3, duration=60, equipment=[dumbbell,machine], level=intermediate

**Analyse :**
- `workoutTypeFromFocus(['glutes'])` :
  - hasLower=false, hasPush=false, hasPull=false, hasArms=false, hasUpper=false
  - Tous les checks échouent jusqu'à :
  - hasGlutes=**true**, `hasGlutes && !hasUpper && !hasLower` → **true** → retourne `'glutes-hip'`
- `selectSplit` focusType='glutes-hip' (lignes 564-567) :
  ```typescript
  return Array.from({ length: 3 }, (_, i) => i % 2 === 0 ? 'glutes-hip' : 'quad-glutes') as Split
  ```
  → `['glutes-hip', 'quad-glutes', 'glutes-hip']`
- Fix P36 confirmé ✅

**Verdict :** ✅ PASS — workoutTypeFromFocus(['glutes']) → 'glutes-hip' ; split=['glutes-hip','quad-glutes','glutes-hip']

---

### P87 — focusMuscles=['glutes'] 4j intermediate ✅ PASS

**Profil :** goal=fat_loss, days=4, duration=60, equipment=[dumbbell,machine], level=intermediate

**Analyse :**
- Même logique que P86, daysPerWeek=4 :
  - i=0:'glutes-hip', i=1:'quad-glutes', i=2:'glutes-hip', i=3:'quad-glutes'
  - → `['glutes-hip', 'quad-glutes', 'glutes-hip', 'quad-glutes']`

**Verdict :** ✅ PASS — split=['glutes-hip','quad-glutes','glutes-hip','quad-glutes']

---

### P88 — focusMuscles=['glutes'] 5j intermediate ✅ PASS

**Profil :** goal=fat_loss, days=5, duration=60, equipment=[dumbbell,machine], level=intermediate

**Analyse :**
- Même logique, daysPerWeek=5 :
  - i=0:'glutes-hip', i=1:'quad-glutes', i=2:'glutes-hip', i=3:'quad-glutes', i=4:'glutes-hip'
  - → `['glutes-hip', 'quad-glutes', 'glutes-hip', 'quad-glutes', 'glutes-hip']`

**Verdict :** ✅ PASS — split 5 éléments en alternance correcte

---

### P89 — focusMuscles=['glutes'] 2j intermediate ✅ PASS

**Profil :** goal=fat_loss, days=2, duration=60, equipment=[dumbbell,machine], level=intermediate

**Analyse :**
- daysPerWeek=2 :
  - i=0:'glutes-hip', i=1:'quad-glutes'
  - → `['glutes-hip', 'quad-glutes']`

**Verdict :** ✅ PASS — split=['glutes-hip','quad-glutes']

---

### P90 — focusMuscles=['chest','back'] 3j intermediate ✅ PASS

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate

**Analyse :**
- `workoutTypeFromFocus(['chest','back'])` :
  - hasLower=false, hasPush=**true** (chest), hasPull=**true** (back), hasArms=false, hasUpper=true
  - Check `hasPush && !hasPull && !hasLower` → false (hasPull=true)
  - Check `hasPull && !hasPush && !hasLower` → false (hasPush=true)
  - Check `hasUpper && !hasLower` → **true** → retourne `'upper'`
- `selectSplit` focusType='upper', 3j, intermediate → `['push', 'pull', 'upper']` (PPU)

**Verdict :** ✅ PASS — workoutTypeFromFocus(['chest','back']) → 'upper' ; split PPU=['push','pull','upper']

---

### P91 — focusMuscles=['back','arms'] 3j intermediate ✅ PASS

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate

**Analyse :**
- `workoutTypeFromFocus(['back','arms'])` :
  - hasLower=false, hasPush=false, hasPull=**true** (back), hasArms=**true**, hasCore=false
  - hasUpper = hasPush || hasPull || hasArms = **true**
  - Check `hasPush && !hasPull && !hasLower` → false (hasPush=false)
  - Check `hasPull && !hasPush && !hasLower` → **true** (hasPull=true, hasPush=false, hasLower=false) → retourne `'pull'`
  - **Note critique** : le check `hasPull && !hasPush` passe **avant** `hasUpper && !hasLower`. Bien que hasUpper=true, le générateur retourne 'pull' et non 'upper', car la présence de 'back' sans push ni legs correspond sémantiquement à un programme de tirage (avec bras en synergiste).
- `selectSplit` focusType='pull', 3j (lignes 554-559) → `['pull', 'upper-pull', 'pull']`

**Verdict :** ✅ PASS — hasPull=true, hasPush=false → 'pull' retourné avant d'atteindre le check 'upper' ; split=['pull','upper-pull','pull']

---

### P92 — UX-B warning : focusMuscles=['arms'] en push split ❌ FAIL

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate, focusMuscles=['arms']

**Assertion du prompt :**
- split = `['push','upper-push','push']`
- UX-B émis

**Analyse réelle :**
- `workoutTypeFromFocus(['arms'])` → `'upper'` (identique à P83 — hasArms=true → hasUpper=true → check `hasUpper && !hasLower` → 'upper')
- `selectSplit` focusType='upper', 3j, level=intermediate → `['push', 'pull', 'upper']` (PPU)
- Le split est **NON** `['push','upper-push','push']`
- Condition UX-B :
  ```typescript
  split.every((t) => t === 'push' || t === 'upper-push')
  ```
  - `'push'` ✅, `'pull'` ❌ → `every()` = **false** → UX-B **NON émis**

**Erreur dans l'assertion :** L'audit confond le split résultant de focusMuscles=['arms']. arms → 'upper' → PPU `['push','pull','upper']`, **pas** `['push','upper-push','push']`. Ce dernier ne serait obtenu qu'avec focusMuscles=['chest'] ou focusMuscles=['shoulders'] (qui retournent 'push'). Avec un split PPU incluant 'pull', le biceps est bien ciblé, ce qui est cohérent — le warning UX-B ne doit pas se déclencher.

**Verdict :** ❌ FAIL — split réel = `['push','pull','upper']` (PPU) ≠ assertion `['push','upper-push','push']` ; UX-B **non émis** car `every('push'||'upper-push')` = false

---

### P93 — UX-B warning : focusMuscles=['shoulders'] en push split ✅ PASS

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate, focusMuscles=['shoulders']

**Analyse :**
- `workoutTypeFromFocus(['shoulders'])` → `'push'` (hasPush=true → `hasPush && !hasPull && !hasLower` → 'push')
- `selectSplit` focusType='push', 3j → `['push', 'upper-push', 'push']`
- Condition UX-B :
  - `split.every(t => t === 'push' || t === 'upper-push')` : push✅, upper-push✅, push✅ → **true**
  - `focusMuscles.some(f => f === 'arms' || f === 'shoulders')` : 'shoulders' → **true**
  - → UX-B **émis** ✅
- Message : *"Focus bras en push : le biceps n'est pas ciblé en séance push..."*
- Note : UX-5 (déséquilibre push/pull) également émis car hasPullSession=false pour ce split.

**Verdict :** ✅ PASS — split=['push','upper-push','push'] ✅ ; UX-B correctement émis

---

### P94 — UX-B absent : focusMuscles=['chest'] en push ✅ PASS

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate, focusMuscles=['chest']

**Analyse :**
- `workoutTypeFromFocus(['chest'])` → `'push'`
- split = `['push', 'upper-push', 'push']`
- Condition UX-B :
  - `split.every(...)` → **true** (split est tout-push)
  - `focusMuscles.some(f => f === 'arms' || f === 'shoulders')` : 'chest' → **false**
  - → UX-B **non émis** ✅

**Verdict :** ✅ PASS — 'chest' ne satisfait pas la condition UX-B (ni 'arms' ni 'shoulders') ; UX-B absent

---

### P95 — splitPreference=brosplit 5j intermediate salle complète ✅ PASS

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[barbell,dumbbell,cable,machine,bodyweight,pullup_bar], level=intermediate

**Analyse :**
- split brosplit 5j : `['chest-tri','back-bi','legs','shoulders-arms','upper']`
- back-bi[0] = `{ muscles: ['back_width','back_thickness'], compound: true }` (SEED-DEADLIFT-SLOT fix)
- seed-deadlift : primaryMuscle='**back**' ∉ `['back_width','back_thickness']` → **exclu** ✅
- Candidats : seed-pullup (back_width, pop 3), seed-lat-pulldown (back_width, cable, pop 3), machine-lat-pulldown (machine, pop 2)
- Slot non vide ✅

**Verdict :** ✅ PASS — seed-deadlift exclu de back-bi[0] ; slot compound dos servi

---

### P96 — splitPreference=arnold 5j intermediate salle complète ✅ PASS

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[barbell,dumbbell,cable,machine,bodyweight,pullup_bar], level=intermediate

**Analyse :**
- split arnold 5j : `['chest-back','shoulders-arms','legs','chest-back','shoulders-arms']`
- chest-back[1] = `{ muscles: ['back_width','back_thickness'], compound: true }` (SEED-DEADLIFT-SLOT fix)
- seed-deadlift : primaryMuscle='**back**' ∉ `['back_width','back_thickness']` → **exclu** ✅
- Slot servi par seed-pullup / seed-lat-pulldown ✅

**Verdict :** ✅ PASS — seed-deadlift exclu de chest-back[1] ; slot compound dos non vide

---

### P97 — totalWeeks=4 (programme court) intermediate hypertrophy ❌ FAIL

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate, totalWeeks=4

**Assertion du prompt :**
- "Phase deload si totalWeeks≥4 : nom='Récup.' *(fix INC-4-RÉSIDUEL confirmé)*"

**Analyse réelle :**
- `buildPhases(4, 'hypertrophy')` — code ligne 905 :
  ```typescript
  if (totalWeeks < 8) return undefined
  ```
  - 4 < 8 → **retourne `undefined` immédiatement**
  - **Aucune phase générée**
- Le seuil de déclenchement de la périodisation est `totalWeeks ≥ 8`, **pas** `totalWeeks ≥ 4`
- `generateProgramDraft` reçoit `phases: undefined` → le programme est généré sans aucune phase (programme monophase)

**Erreur dans l'assertion :** La condition "Phase deload si totalWeeks≥4" est fausse. La périodisation par blocs ne se déclenche qu'à partir de **8 semaines** (seuil codé en dur ligne 905). Avec totalWeeks=4, `buildPhases` retourne `undefined` et aucune phase n'existe dans le programme généré, y compris la phase deload. Le fix INC-4-RÉSIDUEL (name='Récup.') ne peut être observé ici car la fonction ne l'atteint pas.

**Verdict :** ❌ FAIL — buildPhases(4) → `undefined` (seuil=8, pas 4) ; aucune phase deload générée

---

### P98 — totalWeeks=12 avec phase deload vérifiée ✅ PASS

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate, totalWeeks=12

**Analyse :**
- `buildPhases(12, 'hypertrophy')` :
  - 12 ≥ 8 → proceed
  - `adapt = 2`
  - `deload = totalWeeks >= 12 ? 2 : 1` → **2** (12 ≥ 12)
  - `intensive = totalWeeks <= 9 ? 2 : (totalWeeks >= 16 ? 4 : 3)` → **3** (9 < 12 < 16)
  - `progress = max(1, 12 - 2 - 3 - 2)` = **5**
  - Phases générées :
    1. Adaptation : semaines 1-2, focus='adaptation'
    2. Progression : semaines 3-7, focus='progression'
    3. Intensification : semaines 8-10, focus='intensification'
    4. **`name: 'Récup.'`**, `focus: 'deload'`, semaines 11-12
  - `name: 'Récup.'` — fix INC-4-RÉSIDUEL confirmé, ligne 948 du code ✅
  - `focus: 'deload'` ✅
  - Total : 2 + 5 + 3 + 2 = 12 semaines ✅

**Verdict :** ✅ PASS — buildPhases(12) génère 4 phases ; deload name='Récup.' (INC-4-RÉSIDUEL fix) ✅ ; focus='deload' ✅

---

### P99 — selectedDays impact — 3j non consécutifs ✅ PASS

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate, selectedDays=['monday','wednesday','friday']

**Analyse :**
- `generateProgramDraft`, lignes 1003-1005 :
  ```typescript
  const days: Weekday[] = (selectedDays && selectedDays.length === daysPerWeek)
    ? selectedDays
    : (DAY_ASSIGNMENTS[daysPerWeek] ?? ...)
  ```
  - selectedDays.length (3) === daysPerWeek (3) → **selectedDays utilisés** ✅
- Split déterminé indépendamment des jours : hypertrophy, 3j, intermediate → PPL = `['push','pull','legs']`
- Assignation : push→monday, pull→wednesday, legs→friday
- La sélection d'exercices est identique à un profil sans selectedDays (les jours n'influencent pas pickExercise)

**Verdict :** ✅ PASS — selectedDays respectés ; split PPL assigné aux jours choisis ; sélection d'exercices inchangée

---

### P100 — Profil complet combiné ✅ PASS *(réserve mineure sur la formule)*

**Profil :** goal=hypertrophy, days=4, duration=45, equipment=[dumbbell,machine,pullup_bar], level=advanced, focusMuscles=['back','legs'], selectedDays=[...], totalWeeks=8

**Analyse :**

**1. workoutTypeFromFocus(['back','legs']) :**
- hasLower=**true** (legs), hasPush=false, hasPull=**true** (back), hasArms=false, hasUpper=**true** (hasPull)
- Check `hasLower && !hasUpper` → false (hasUpper=true)
- Check `hasPush && !hasPull && !hasLower` → false
- Check `hasPull && !hasPush && !hasLower` → false (hasLower=true)
- Check `hasUpper && !hasLower` → false (hasLower=true)
- Check `hasLower && hasPush && !hasPull` → false (hasPull=true)
- Check `hasLower && hasPull && !hasPush` → **true** → retourne `'lower_pull'` ✅

**2. Split 4j :**
- focusType='lower_pull' → branche finale (lignes 570-571) :
  ```typescript
  return Array.from({ length: daysPerWeek }, () => focusType) as Split
  ```
  → `['lower_pull','lower_pull','lower_pull','lower_pull']` ✅

**3. adjustedSlotCount(lower_pull, 45, hypertrophy) :**
- base réel = `SLOTS['lower_pull'].length` = **9** (4 composés + 5 isolations, dont biceps pos 9)
- ⚠️ L'audit prompt écrit "base=8" mais le compte réel est **9**
- Formule : `max(4, ⌊9 × 0.75⌋)` = `max(4, 6)` = **6 slots**
- Coïncidence : avec base=8 → ⌊8×0.75⌋=6. Le **résultat (6 slots) est identique** malgré la base incorrecte dans la formule

**4. lower_pull[1] `['back_width','back_thickness'] compound:true` :**
- equipment=[dumbbell,machine,pullup_bar] → candidats :
  - seed-pullup (back_width, pullup_bar, compound, pop 3)
  - machine-lat-pulldown (back_width, machine, compound, pop 2)
  - seed-pullover (back_width, dumbbell, compound, pop 1)
  - seed-row-dumbbell (back_thickness, dumbbell, compound, pop 3)
  - seed-row-machine (back_thickness, machine, compound, pop 1)
- focusedMuscles inclut back_width et back_thickness → priority focus=0 pour tous
- slotPrimary='back_width' → seed-pullup, machine-lat-pulldown, seed-pullover : aP=0 > seed-row-* : aP=1
- Tri popularité : seed-pullup (3) > machine-lat-pulldown (2) > seed-pullover (1)
- advanced → top-3 aléatoire → seed-pullup probable ✅

**5. buildPhases(8, 'hypertrophy') :**
- 8 ≥ 8 → proceed
- adapt=2, deload=1 (8 < 12), intensive=2 (8 ≤ 9), progress=8-2-2-1=3
- Phase deload : `name='Récup.'`, focus='deload', semaines 8 ✅

**6. Warnings dos :**
- `hasCompoundBack` : seed-pullup (back_width, pullup_bar, compound) → **true** → aucun warning dos ✅

**Verdict :** ✅ PASS — toutes les assertions clés confirmées ; ⚠️ RÉSERVE mineure : la formule de l'audit prompt utilise base=8 au lieu de 9 (SLOTS['lower_pull'] a 9 entrées), mais le résultat de 6 slots est identique (⌊9×0.75⌋=6 = ⌊8×0.75⌋=6)

---

## Tableau récapitulatif

| Profil | Sujet | Verdict |
|--------|-------|---------|
| P81 | focusMuscles=['chest'] → 'push' → ['push','upper-push','push'] | ✅ PASS |
| P82 | focusMuscles=['shoulders'] → 'push' → ['push','upper-push','push'] | ✅ PASS |
| P83 | focusMuscles=['arms'] → 'upper' → PPU ['push','pull','upper'] | ✅ PASS |
| P84 | focusMuscles=['legs'] → 'lower' → alternance quad/hip | ✅ PASS |
| P85 | focusMuscles=['core'] → null → split par défaut PPF | ✅ PASS |
| P86 | focusMuscles=['glutes'] 3j → 'glutes-hip' → [gh,qg,gh] | ✅ PASS |
| P87 | focusMuscles=['glutes'] 4j → [gh,qg,gh,qg] | ✅ PASS |
| P88 | focusMuscles=['glutes'] 5j → [gh,qg,gh,qg,gh] | ✅ PASS |
| P89 | focusMuscles=['glutes'] 2j → [gh,qg] | ✅ PASS |
| P90 | focusMuscles=['chest','back'] → 'upper' → PPU | ✅ PASS |
| P91 | focusMuscles=['back','arms'] → 'pull' (hasPull check avant hasUpper) | ✅ PASS |
| P92 | UX-B pour arms : split réel PPU ≠ ['push','upper-push','push'] ; UX-B non émis | ❌ FAIL |
| P93 | UX-B pour shoulders : split push ✅ ; UX-B correctement émis | ✅ PASS |
| P94 | UX-B absent pour chest : 'chest' ≠ 'arms'||'shoulders' | ✅ PASS |
| P95 | brosplit 5j : deadlift exclu de back-bi[0] | ✅ PASS |
| P96 | arnold 5j : deadlift exclu de chest-back[1] | ✅ PASS |
| P97 | totalWeeks=4 → buildPhases retourne undefined (seuil=8) | ❌ FAIL |
| P98 | totalWeeks=12 → deload name='Récup.' ; 4 phases ✅ | ✅ PASS |
| P99 | selectedDays respectés ; split PPL inchangé | ✅ PASS |
| P100 | lower_pull 4j ; 6 slots ; buildPhases(8) OK | ✅ PASS ⚠️ |

**Score : 18/20 PASS — 2 FAIL**

---

## Synthèse des anomalies

### ❌ P92 — Erreur d'assertion sur le split focusMuscles=['arms']

Le prompt affirme que focusMuscles=['arms'] produit le split `['push','upper-push','push']` et déclenche UX-B. C'est incorrect : 'arms' seul génère hasArms=true → hasUpper=true → workoutTypeFromFocus retourne **'upper'** (pas 'push'), et selectSplit produit le split PPU `['push','pull','upper']`. Ce split inclut une séance pull (biceps ciblé), donc la condition UX-B `split.every(t === 'push' || t === 'upper-push')` est **false**. UX-B ne se déclenche pour un focus 'arms' que si le split est intégralement push-only, ce qui n'est pas le cas en mode auto.

**Impact :** Aucun bug dans le générateur — le comportement réel est correct (PPU avec 'arms' est la bonne réponse). C'est l'assertion de l'audit qui est erronée.

### ❌ P97 — Mauvais seuil pour buildPhases

Le prompt affirme "Phase deload si totalWeeks≥4". Le seuil réel dans le code est `totalWeeks < 8 → return undefined` (ligne 905). Avec totalWeeks=4, aucune phase n'est générée. La périodisation ne commence qu'à **8 semaines**.

**Impact :** Si l'UI affiche des phases pour un programme de 4 semaines, c'est un bug d'affichage (données corrompues). La fonction buildPhases elle-même est correcte — c'est l'assertion de l'audit qui est erronée.

### ⚠️ P100 — Base=9 dans SLOTS['lower_pull']

Le prompt écrit "⌊8×0.75⌋=6" mais la base réelle de lower_pull est **9** (4 composés + 5 isolations). Par coïncidence ⌊9×0.75⌋=6=⌊8×0.75⌋, donc le résultat final (6 slots) est correct. Inaccuracy dans la formule uniquement, pas dans la conclusion.
