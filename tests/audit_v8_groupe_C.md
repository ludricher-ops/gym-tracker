# Audit v8 — Groupe C (P41-P60) : BW interactions élargi

**Date :** 2026-09-07  
**Auditeur :** Claude Sonnet 4.6 (agent)  
**Sources :**
- `src/utils/programGenerator.ts` — lu intégralement
- `src/data/exercises-seed.json` — extrait par grep (bodyweight + pullup_bar + back compound)
- `tests/audit_prompt_v8.md` — section Groupe C

---

## Préambule : variables clés du générateur

### hasPullInSplit vs hasPullSession

Deux variables distinctes dans le code — confusion fréquente, clarification avant tout :

**`hasPullInSplit`** (ligne 1026) — utilisé exclusivement pour **BUG-BW-PULL** :
```typescript
const hasPullInSplit = rawSplit.some((t) => t === 'pull')
```
Égalité **stricte** sur le type `'pull'`. `'back-bi'`, `'upper-pull'`, `'chest-back'` → tous `false`.

**`hasPullSession`** (lignes 1189-1194) — utilisé exclusivement pour **UX-5** (déséquilibre push/pull) :
```typescript
const hasPullSession = split.some(
  (t) =>
    t === 'pull' || t === 'upper-pull' || t === 'lower_pull' ||
    t === 'back-bi' || t === 'chest-back' ||
    t === 'glutes-hip' || t === 'quad-glutes' ||
    t === 'fullbody-quad' || t === 'fullbody-hip',
)
```
Liste étendue : `'back-bi'` y est inclus, `'glutes-hip'`, `'quad-glutes'`, fullbody, etc.

### Conditions de warning dos (rappel)

| Warning | Condition exacte (lignes 1027, 1031, 1042) |
|---------|-------------------------------------------|
| **BUG-BW-PULL** | `!hasCompoundBack && hasPullInSplit` |
| **SEED-BW-NOBACK** | `!hasCompoundBack && !hasPullInSplit && splitPreference !== 'glutes-focus'` |

Les deux sont mutuellement exclusifs (`hasPullInSplit` ne peut être vrai et faux en même temps).

### hasCompoundBack pour équipement BW seul

```typescript
const backMuscles: MuscleGroup[] = ['back_width', 'back_thickness', 'back']
const hasCompoundBack = available.some(
  (ex) => ex.category === 'compound' && backMuscles.includes(ex.primaryMuscle),
)
```

**Équipement `[bodyweight]` seul → `hasCompoundBack = false`.**  
Aucun exercice `bodyweight` dans le seed n'a `primaryMuscle ∈ {back_width, back_thickness, back}` ET `category = 'compound'`.  
(Les push-ups : primaryMuscle=chest ou shoulders_front. Le hip thrust BW : primaryMuscle=glutes. Burpees/Mountain climbers : cardio.)

---

## Analyse profil par profil

---

### P41 — BW seul, PPL 3j intermediate *(régression v7 P25)*

**Profil :** goal=hypertrophy, days=3, equipment=[bodyweight], level=intermediate

**Raisonnement :**
- `selectSplit` : hypertrophy + intermediate + 3j → `['push','pull','legs']` (PPL)
- `hasCompoundBack = false` (BW seul)
- `hasPullInSplit = rawSplit.some(t => t === 'pull')` → `'pull'` présent → **true**
- Condition BUG-BW-PULL : `!false && true` = **true** → déclenché
- split final : `['push','fullbody-quad','legs']` (la séance 'pull' remplacée)
- Condition SEED-BW-NOBACK : `!hasPullInSplit = false` → **non émis**

**Résultat : ✅ PASS** — BUG-BW-PULL émis, SEED-BW-NOBACK absent.

---

### P42 — BW seul, fullbody 3j beginner *(régression v7 P26)*

**Profil :** goal=hypertrophy, days=3, equipment=[bodyweight], level=beginner

**Raisonnement :**
- `selectSplit` : beginner → `['fullbody-quad','fullbody-hip','fullbody-quad']`
- `hasCompoundBack = false`
- `hasPullInSplit = rawSplit.some(t => t === 'pull')` → aucun 'pull' dans le split → **false**
- BUG-BW-PULL : `!false && false` → **non déclenché**
- SEED-BW-NOBACK : `true && true && ('auto' !== 'glutes-focus')` → **émis** ✅

**Résultat : ✅ PASS** — SEED-BW-NOBACK émis, BUG-BW-PULL absent.

---

### P43 — BW seul, fat_loss 3j intermediate *(régression v7 P27)*

**Profil :** goal=fat_loss, days=3, equipment=[bodyweight], level=intermediate

**Raisonnement :**
- `selectSplit` fat_loss + 3j + intermediate + non-mass : ligne 586 → `['push','pull','fullbody-quad']` (PPF)
- `hasCompoundBack = false`
- `hasPullInSplit` : `'pull'` ∈ rawSplit → **true**
- BUG-BW-PULL déclenché → split = `['push','fullbody-quad','fullbody-quad']`
- SEED-BW-NOBACK : `!hasPullInSplit = false` → **non émis**

**Résultat : ✅ PASS** — BUG-BW-PULL émis (PPF), SEED-BW-NOBACK absent.

---

### P44 — BW seul, 2j fullbody beginner *(régression v7 P28)*

**Profil :** goal=hypertrophy, days=2, equipment=[bodyweight], level=beginner

**Raisonnement :**
- `selectSplit` 2j → `['fullbody-quad','fullbody-hip']`
- `hasPullInSplit` = false (aucun 'pull')
- `hasCompoundBack = false`
- SEED-BW-NOBACK : `true && true && true` → **émis** ✅

**Résultat : ✅ PASS** — SEED-BW-NOBACK émis.

---

### P45 — BW + pullup_bar, fullbody 3j beginner *(régression v7 P29)*

**Profil :** goal=hypertrophy, days=3, equipment=[bodyweight, pullup_bar], level=beginner

**Raisonnement :**
- `available` inclut `seed-pullup` (primaryMuscle=back_width, equipment=pullup_bar, category=compound, pop=3)
- `hasCompoundBack` : `back_width ∈ backMuscles` && compound → **true**
- BUG-BW-PULL : `!true && ...` = **false** → non déclenché
- SEED-BW-NOBACK : `!hasCompoundBack = false` → **non émis**
- Aucun warning dos ✅

**Résultat : ✅ PASS** — hasCompoundBack=true, aucun warning.

---

### P46 — BW + band, fullbody 3j intermediate *(régression v7 P30)*

**Profil :** goal=fat_loss, days=3, equipment=[bodyweight, band], level=intermediate

**Raisonnement :**
- `available` inclut `band-row` (primaryMuscle=back_thickness, equipment=band, category=compound, pop=2)
- `hasCompoundBack` : `back_thickness ∈ backMuscles` && compound → **true**
- Aucun warning dos ✅

**Résultat : ✅ PASS** — hasCompoundBack=true (band-row), aucun warning.

---

### P47 — BW seul, upper-lower 4j *(régression v7 P31)*

**Profil :** goal=hypertrophy, days=4, equipment=[bodyweight], level=intermediate, splitPreference=upper-lower

**Raisonnement :**
- `selectSplit` upper-lower 4j → `['upper-push','lower-quad','upper-pull','lower-hip']`
- `hasPullInSplit` : `rawSplit.some(t => t === 'pull')` → `'upper-pull'` **≠** `'pull'` → **false**
- `hasCompoundBack = false`
- SEED-BW-NOBACK : `true && true && ('upper-lower' !== 'glutes-focus')` → **émis** ✅

**Résultat : ✅ PASS** — `'upper-pull' !== 'pull'` (stricte), SEED-BW-NOBACK émis.

---

### P48 — BW seul, glutes-focus 4j *(régression v7 P32, fix c64cba7)*

**Profil :** goal=fat_loss, days=4, equipment=[bodyweight], level=intermediate, splitPreference=glutes-focus

**Raisonnement :**
- split : `['glutes-hip','quad-glutes','glutes-hip','quad-glutes']`
- `hasPullInSplit` = false (aucun 'pull' dans le split)
- `hasCompoundBack = false`
- SEED-BW-NOBACK : `!hasCompoundBack && !hasPullInSplit && splitPreference !== 'glutes-focus'`  
  = `true && true && ('glutes-focus' !== 'glutes-focus')` = `true && true && **false**` → **NON émis** ✅

**Résultat : ✅ PASS** — exception glutes-focus correcte, SEED-BW-NOBACK supprimé.

---

### P49 — BW seul, strength 3j intermediate

**Profil :** goal=strength, days=3, equipment=[bodyweight], level=intermediate

**Raisonnement :**
- `selectSplit` : strength + intermediate + 3j → INC-1 → `['fullbody-quad','fullbody-hip','fullbody-quad']`
- `hasPullInSplit = false`
- `hasCompoundBack = false`
- SEED-BW-NOBACK : `true && true && true` → **émis** ✅
- Le programme fullbody est quand même généré (warning non bloquant)

**Résultat : ✅ PASS** — INC-1 actif, SEED-BW-NOBACK émis.

---

### P50 — BW seul, strength 3j beginner

**Profil :** goal=strength, days=3, equipment=[bodyweight], level=beginner

**Raisonnement :**
- `selectSplit` : beginner → fullbody×3 (indépendamment de INC-1)
- Même résultat que P49 pour les conditions warnings
- SEED-BW-NOBACK émis ✅

**Résultat : ✅ PASS** — SEED-BW-NOBACK émis.

---

### P51 — BW + cable, PPL 3j intermediate

**Profil :** goal=hypertrophy, days=3, equipment=[bodyweight, cable], level=intermediate

**Raisonnement :**
- `available` inclut `seed-lat-pulldown` (primaryMuscle=back_width, equipment=cable, category=compound, pop=3)
- `hasCompoundBack` : `back_width ∈ backMuscles` && compound → **true**
- PPL split `['push','pull','legs']` inchangé
- BUG-BW-PULL : `!true && ...` → **non déclenché** ✅
- SEED-BW-NOBACK : `!true` → **non émis** ✅
- pull[0] `['back_width','back_thickness']` compound : `seed-lat-pulldown` (slotPrimary=back_width, aP=0, pop=3) ✅

**Résultat : ✅ PASS** — hasCompoundBack=true, aucun warning, split PPL intact.

---

### P52 — BW + machine, fullbody 3j intermediate

**Profil :** goal=hypertrophy, days=3, equipment=[bodyweight, machine], level=intermediate

**Raisonnement :**
- `available` inclut `machine-lat-pulldown` (primaryMuscle=back_width, machine, compound, pop=2)
- `hasCompoundBack = true`
- Pas de warning dos ✅
- fullbody[2] `['back_width','back_thickness','back']` compound : `machine-lat-pulldown` (slotPrimary=back_width, aP=0) ✅

**Résultat : ✅ PASS** — hasCompoundBack=true, aucun warning.

---

### P53 — BW + dumbbell, PPL 3j intermediate

**Profil :** goal=hypertrophy, days=3, equipment=[bodyweight, dumbbell], level=intermediate

**Raisonnement :**
- `available` inclut `seed-pullover` (primaryMuscle=back_width, dumbbell, compound, pop=1)
- `hasCompoundBack = true`
- split PPL inchangé ✅
- BUG-BW-PULL / SEED-BW-NOBACK : **non émis** (hasCompoundBack=true) ✅
- pull[0] `['back_width','back_thickness']` compound : `seed-pullover` (slotPrimary=back_width, aP=0) ✅

**Résultat : ✅ PASS** — hasCompoundBack=true via pullover, split PPL intact.

---

### P54 — BW seul, brosplit 5j intermediate ← CAS CRITIQUE

**Profil :** goal=hypertrophy, days=5, equipment=[bodyweight], level=intermediate, splitPreference=brosplit

**Analyse détaillée ligne par ligne :**

**Étape 1 — rawSplit brosplit 5j (ligne 495) :**
```typescript
case 5: return ['chest-tri', 'back-bi', 'legs', 'shoulders-arms', 'upper']
```
→ `rawSplit = ['chest-tri','back-bi','legs','shoulders-arms','upper']`

**Étape 2 — hasCompoundBack (ligne 1023-1025) :**
```typescript
const backMuscles: MuscleGroup[] = ['back_width', 'back_thickness', 'back']
const hasCompoundBack = available.some(
  (ex) => ex.category === 'compound' && backMuscles.includes(ex.primaryMuscle),
)
```
BW seul → aucun exercice compound back en bodyweight → **`hasCompoundBack = false`**

**Étape 3 — hasPullInSplit (ligne 1026) :**
```typescript
const hasPullInSplit = rawSplit.some((t) => t === 'pull')
```
- `'chest-tri' === 'pull'` → false
- `'back-bi' === 'pull'` → **false** (égalité STRICTE — `'back-bi'` n'est PAS `'pull'`)
- `'legs' === 'pull'` → false
- `'shoulders-arms' === 'pull'` → false
- `'upper' === 'pull'` → false
- **`hasPullInSplit = false`**

**Étape 4 — Condition BUG-BW-PULL (ligne 1027-1028) :**
```typescript
const split: Split = (!hasCompoundBack && hasPullInSplit)
    ? rawSplit.map((t) => (t === 'pull' ? 'fullbody-quad' : t)) as Split
    : rawSplit
```
`!false && false` = **false** → **BUG-BW-PULL NON DÉCLENCHÉ**  
→ split = rawSplit inchangé : `['chest-tri','back-bi','legs','shoulders-arms','upper']`  
→ La séance `'back-bi'` est **conservée telle quelle** (non remplacée)

**Étape 5 — Warning BUG-BW-PULL (ligne 1031) :**
```typescript
if (!hasCompoundBack && hasPullInSplit) {
  generatorWarnings.unshift('Séance "Pull" remplacée...')
}
```
Condition false → **warning BUG-BW-PULL non émis**

**Étape 6 — Condition SEED-BW-NOBACK (ligne 1042) :**
```typescript
if (!hasCompoundBack && !hasPullInSplit && splitPreference !== 'glutes-focus') {
```
`true && true && ('brosplit' !== 'glutes-focus')` = **true** → **SEED-BW-NOBACK ÉMIS** ✅

**Étape 7 — hasPullSession pour UX-5 (lignes 1189-1194) :**
```typescript
const hasPullSession = split.some(
  (t) =>
    t === 'pull' || t === 'upper-pull' || t === 'lower_pull' ||
    t === 'back-bi' || t === 'chest-back' || ...
)
```
`'back-bi'` ∈ liste étendue → **`hasPullSession = true`** → UX-5 (déséquilibre push/pull) **non déclenché**

**Étape 8 — Slots de la séance back-bi avec BW :**
La séance `'back-bi'` est générée normalement. Ses slots composés :
- slot[0] `['back_width','back_thickness'] compound:true` → aucun candidat BW → **slot vide** → warning "Aucun exercice composé disponible pour dos (largeur)" émis
- slot[1] `['back_thickness','back'] compound:true` → aucun candidat BW → **slot vide** → warning "Aucun exercice composé disponible pour dos (épaisseur)" émis

Les slots isolation (biceps, etc.) peuvent avoir quelques exercices BW (si des curls BW existent dans le seed), mais les deux premiers slots compound sont vides.

**Conclusion — Comportement observé :**
- `hasPullInSplit = false` (strict equality `=== 'pull'`)
- La variable `hasPullSession` (distincte) vaut `true` pour `'back-bi'`
- BUG-BW-PULL **non déclenché** : `'back-bi'` n'est pas remplacé par `'fullbody-quad'`
- SEED-BW-NOBACK **émis** : avertissement générique "dos non couvert"
- La séance `'back-bi'` subsiste mais ses slots composés dos sont vides → warnings slots émis

**Gap détecté :** Le mécanisme BUG-BW-PULL couvre uniquement `'pull'` (strict) et ne traite pas `'back-bi'`. Un utilisateur BW avec brosplit reçoit : (1) un SEED-BW-NOBACK générique, (2) une séance `'back-bi'` quasi-vide, (3) des warnings de slots vides. L'expérience est moins claire que le cas PPL où `'pull'` est remplacé proprement par `'fullbody-quad'`.

**Résultat : ⚠️ RÉSERVE** — Comportement techniquement cohérent avec le code (hasPullInSplit=false confirmé), mais gap UX : la séance `'back-bi'` en BW est conservée avec slots composés vides au lieu d'être remplacée comme `'pull'`. La combinaison brosplit + BW seul est donc sous-optimalement gérée.

---

### P55 — BW seul, 4j fat_loss intermediate

**Profil :** goal=fat_loss, days=4, equipment=[bodyweight], level=intermediate

**Raisonnement :**
- `selectSplit` case 4 : fat_loss non-mass, intermediate → ligne 594 :
  ```typescript
  if (level !== 'beginner') return ['push', 'pull', 'lower-quad', 'fullbody-quad']
  ```
  → `rawSplit = ['push','pull','lower-quad','fullbody-quad']`
- `hasCompoundBack = false`
- `hasPullInSplit` : `'pull'` ∈ rawSplit → **true**
- BUG-BW-PULL déclenché → split = `['push','fullbody-quad','lower-quad','fullbody-quad']`
- SEED-BW-NOBACK : `!hasPullInSplit = false` → **non émis**

**Résultat : ✅ PASS** — Split identifié : `['push','pull','lower-quad','fullbody-quad']`, BUG-BW-PULL déclenché, 'pull' → 'fullbody-quad'.

---

### P56 — BW seul, 5j hypertrophy advanced

**Profil :** goal=hypertrophy, days=5, equipment=[bodyweight], level=advanced

**Raisonnement :**
- `selectSplit` 5j mass + non-beginner → ligne 601 :
  ```typescript
  if (isMass && level !== 'beginner') return ['push', 'pull', 'lower-quad', 'upper', 'lower-hip']
  ```
- `hasCompoundBack = false`, `hasPullInSplit = true`
- BUG-BW-PULL déclenché → 'pull' → 'fullbody-quad'
- split = `['push','fullbody-quad','lower-quad','upper','lower-hip']`
- SEED-BW-NOBACK : **non émis** ✅

**Résultat : ✅ PASS** — BUG-BW-PULL déclenché, SEED-BW-NOBACK absent.

---

### P57 — BW + barbell, PPL 3j intermediate

**Profil :** goal=hypertrophy, days=3, equipment=[bodyweight, barbell], level=intermediate

**Raisonnement :**
- `available` inclut `seed-row-barbell` (primaryMuscle=back_thickness, barbell, compound, pop=7) et `seed-deadlift` (primaryMuscle=back, barbell, compound, pop=3)
- `hasCompoundBack` : `back_thickness ∈ backMuscles` && compound → **true** ✅
- BUG-BW-PULL / SEED-BW-NOBACK : **non déclenchés**
- pull[0] `['back_width','back_thickness']` compound :
  - `seed-deadlift` (primaryMuscle=back) : `back ∉ ['back_width','back_thickness']` → **exclu** ✅
  - `seed-row-barbell` (back_thickness) : `back_thickness ∈ ['back_width','back_thickness']` → **candidat** ✅
  - slotPrimary=back_width : seed-row-barbell aP=1 (pas slotPrimary) — mais seul compound disponible
  - seed-row-barbell sélectionné (pop=7) ✅

**Résultat : ✅ PASS** — hasCompoundBack=true, seed-deadlift exclu de pull[0], seed-row-barbell sélectionné.

---

### P58 — BW seul, focusMuscles=['glutes'] 3j intermediate

**Profil :** goal=fat_loss, days=3, equipment=[bodyweight], level=intermediate, focusMuscles=['glutes']

**Raisonnement :**
- `workoutTypeFromFocus(['glutes'])` (lignes 448-449) :
  ```typescript
  const hasGlutes = focusMuscles.includes('glutes')
  if (hasGlutes && !hasUpper && !hasLower) return 'glutes-hip'
  ```
  hasLower=false, hasUpper=false, hasGlutes=true → retourne **'glutes-hip'** ✅
- `selectSplit` focusType='glutes-hip' (lignes 564-567) :
  ```typescript
  if (focusType === 'glutes-hip') {
    return Array.from({ length: daysPerWeek }, (_, i) =>
      i % 2 === 0 ? 'glutes-hip' : 'quad-glutes',
    ) as Split
  }
  ```
  → `['glutes-hip','quad-glutes','glutes-hip']`
- splitPreference = `'auto'` (pas `'glutes-focus'`)
- `hasCompoundBack = false`, `hasPullInSplit = false`
- SEED-BW-NOBACK : `true && true && ('auto' !== 'glutes-focus')` → **ÉMIS**

**Note design :** L'utilisateur a choisi `focusMuscles=['glutes']` (intention fessiers, sans tirage), mais le warning "dos non couvert" est émis car `splitPreference='auto'` ≠ `'glutes-focus'`. L'exception ne s'applique qu'au splitPreference explicite. Ce comportement est documenté dans le prompt (l'utilisateur n'a pas choisi explicitement glutes-focus).

**Résultat : ✅ PASS** — workoutTypeFromFocus=['glutes']→'glutes-hip', split alternance glutes-hip/quad-glutes, SEED-BW-NOBACK émis (splitPreference='auto'≠'glutes-focus').

---

### P59 — BW seul, focusMuscles=['core'] 3j intermediate

**Profil :** goal=fat_loss, days=3, equipment=[bodyweight], level=intermediate, focusMuscles=['core']

**Correction de l'hypothèse du prompt :** Le prompt supposait "hasPullInSplit=false probable → SEED-BW-NOBACK émis probable". L'analyse du code montre le contraire.

**Raisonnement :**
- `workoutTypeFromFocus(['core'])` (lignes 433-434) :
  ```typescript
  if (hasCore && !hasLower && !hasUpper) return null
  ```
  hasCore=true, hasLower=false, hasUpper=false → retourne **null**
- `focusType = null` → branche split par défaut (ligne 574+)
- `selectSplit` fat_loss + 3j + intermediate + non-mass → ligne 586 :
  ```typescript
  if (!isMass && level !== 'beginner') return ['push', 'pull', 'fullbody-quad']
  ```
  → `rawSplit = ['push','pull','fullbody-quad']`
- `hasCompoundBack = false`, `hasPullInSplit = true` ('pull' présent !)
- BUG-BW-PULL : `true && true` → **déclenché** → split = `['push','fullbody-quad','fullbody-quad']`
- SEED-BW-NOBACK : `!hasPullInSplit = false` → **non émis**
- Warning UX-6 "core seul" (ligne 1221-1227) également émis :
  ```typescript
  if (hasFocusCore && !hasFocusLower && !hasFocusUpper) {
    generatorWarnings.unshift('Focus gainage : ...')
  }
  ```

**Conclusion :** L'hypothèse du prompt était erronée. La branche fat_loss 3j intermediate produit PPF avec `'pull'`, donc `hasPullInSplit=true`. C'est BUG-BW-PULL qui est déclenché, pas SEED-BW-NOBACK. Le comportement est correct : la séance pull vide est remplacée par fullbody, et un warning UX-6 explique que core seul → programme fullbody.

**Résultat : ✅ PASS** — workoutTypeFromFocus(['core'])=null confirmé, split PPF produit `hasPullInSplit=true`, BUG-BW-PULL déclenché (correction de l'hypothèse du prompt : c'est BUG-BW-PULL et non SEED-BW-NOBACK).

---

### P60 — BW + pullup_bar, strength 4j intermediate, upper-lower

**Profil :** goal=strength, days=4, equipment=[bodyweight, pullup_bar], level=intermediate, splitPreference=upper-lower

**Raisonnement :**
- `available` inclut `seed-pullup` (primaryMuscle=back_width, pullup_bar, compound, pop=3)
- `hasCompoundBack` : `back_width ∈ backMuscles` && compound → **true** ✅
- Aucun warning dos ✅
- split upper-lower 4j : `['upper-push','lower-quad','upper-pull','lower-hip']`
- upper-pull[0] `['back_width','back_thickness']` compound :
  - `seed-pullup` (back_width, slotPrimary → aP=0, pop=3) ✅
- `adjustedSlotCount(upper-pull, 60, strength)` :
  ```
  isStrength=true, duration=60 → max(4, ⌊8×0.5⌋) = max(4,4) = 4 slots
  ```
  → **4 slots** ✅

**Résultat : ✅ PASS** — hasCompoundBack=true (seed-pullup), aucun warning, 4 slots upper-pull en force 60min.

---

## Tableau récapitulatif — Groupe C (P41-P60)

| Profil | Description | Verdict | Note |
|--------|-------------|---------|------|
| P41 | BW PPL 3j intermediate | ✅ PASS | BUG-BW-PULL émis |
| P42 | BW fullbody 3j beginner | ✅ PASS | SEED-BW-NOBACK émis |
| P43 | BW fat_loss 3j intermediate (PPF) | ✅ PASS | BUG-BW-PULL émis |
| P44 | BW 2j fullbody beginner | ✅ PASS | SEED-BW-NOBACK émis |
| P45 | BW + pullup_bar fullbody 3j beginner | ✅ PASS | hasCompoundBack=true, aucun warning |
| P46 | BW + band fullbody 3j intermediate | ✅ PASS | hasCompoundBack=true (band-row) |
| P47 | BW upper-lower 4j intermediate | ✅ PASS | 'upper-pull'≠'pull', SEED-BW-NOBACK |
| P48 | BW glutes-focus 4j intermediate | ✅ PASS | Exception splitPreference='glutes-focus' |
| P49 | BW strength 3j intermediate | ✅ PASS | INC-1, SEED-BW-NOBACK |
| P50 | BW strength 3j beginner | ✅ PASS | fullbody beginner, SEED-BW-NOBACK |
| P51 | BW + cable PPL 3j intermediate | ✅ PASS | hasCompoundBack=true (seed-lat-pulldown) |
| P52 | BW + machine fullbody 3j intermediate | ✅ PASS | hasCompoundBack=true (machine-lat-pulldown) |
| P53 | BW + dumbbell PPL 3j intermediate | ✅ PASS | hasCompoundBack=true (seed-pullover) |
| P54 | BW brosplit 5j intermediate | ⚠️ RÉSERVE | hasPullInSplit=false strict ; 'back-bi' conservé avec slots vides |
| P55 | BW 4j fat_loss intermediate | ✅ PASS | Split PPL+Lower+FB, BUG-BW-PULL déclenché |
| P56 | BW 5j hypertrophy advanced | ✅ PASS | BUG-BW-PULL déclenché |
| P57 | BW + barbell PPL 3j intermediate | ✅ PASS | hasCompoundBack=true, seed-deadlift exclu pull[0] |
| P58 | BW focusMuscles=['glutes'] 3j | ✅ PASS | SEED-BW-NOBACK émis (splitPref='auto'≠'glutes-focus') |
| P59 | BW focusMuscles=['core'] 3j | ✅ PASS | workoutTypeFromFocus=null, BUG-BW-PULL (pas SEED-BW-NOBACK) |
| P60 | BW + pullup_bar strength upper-lower 4j | ✅ PASS | hasCompoundBack=true, 4 slots upper-pull |

**Bilan : 19 ✅ PASS — 0 ❌ FAIL — 1 ⚠️ RÉSERVE**

---

## Constatations transversales

### 1. Distinction `hasPullInSplit` vs `hasPullSession` — clé de compréhension

`hasPullInSplit` (ligne 1026) est un test strict `=== 'pull'` utilisé uniquement pour le mécanisme de remplacement de séance (BUG-BW-PULL). Il ne couvre pas `'back-bi'`, `'upper-pull'`, `'chest-back'`, etc.

`hasPullSession` (ligne 1189) est un test large (liste exhaustive) utilisé pour l'avertissement d'équilibre push/pull (UX-5). Il inclut `'back-bi'`, `'glutes-hip'`, `'quad-glutes'`, fullbody, etc.

### 2. Gap BUG-BW-PULL pour brosplit (P54)

Le mécanisme BUG-BW-PULL ne couvre que `t === 'pull'`. Un utilisateur BW seul + brosplit reçoit la séance `'back-bi'` inchangée mais vide (slots composés dos sans candidats), complétée d'un SEED-BW-NOBACK générique — moins clair que le remplacement propre effectué pour PPL. Un fix éventuel consisterait à élargir `hasPullInSplit` à `|| t === 'back-bi' || t === 'chest-back'` (ou à ajouter un mécanisme similaire de remplacement pour ces types).

### 3. P59 — Correction d'hypothèse

Le prompt postulait SEED-BW-NOBACK pour focusMuscles=['core'] + BW. La réalité : `workoutTypeFromFocus(['core'])` retourne `null`, le split fat_loss 3j intermediate produit PPF avec `'pull'`, donc `hasPullInSplit=true` → BUG-BW-PULL déclenché. Le comportement est correct mais différent de l'hypothèse initiale.

### 4. workoutTypeFromFocus(['core']) = null (confirmé)

Ligne 434 du code : `if (hasCore && !hasLower && !hasUpper) return null`. Le générateur produit alors un split par défaut (selon goal/level/days) et ajoute un exercice de gainage en fin de séance via `corePool`. Un warning UX-6 "Focus gainage" explique le comportement.

### 5. Exercices compound dos par équipement (résumé seed)

| Équipement | Exercice | primaryMuscle | pop |
|-----------|----------|--------------|-----|
| bodyweight | aucun | — | — |
| pullup_bar | seed-pullup | back_width | 3 |
| pullup_bar | inverted-row | back_thickness | 1 |
| cable | seed-lat-pulldown | back_width | 3 |
| machine | machine-lat-pulldown | back_width | 2 |
| machine | seed-row-machine | back_thickness | 1 |
| dumbbell | seed-pullover | back_width | 1 |
| dumbbell | seed-row-dumbbell | back_thickness | 3 |
| barbell | seed-row-barbell | back_thickness | 7 |
| barbell | seed-row-tbar | back_thickness | 2 |
| barbell | seed-deadlift | back | 3 |
| kettlebell | kb-row | back_thickness | 2 |
| kettlebell | kb-deadlift | back | 2 |
| band | band-row | back_thickness | 2 |
