# Audit v7 — Groupe C (P25-P36) : SEED-BW-NOBACK + Régressions v6

**Date :** 2026-09-07
**Auditeur :** Claude Sonnet 4.6 (agent)
**Fichier audité :** `src/utils/programGenerator.ts`
**Seed audité :** `src/data/exercises-seed.json`

---

## Rappel des faits établis avant audit

### Exercices BW compound dos dans le seed

Résultat de l'inspection du seed (bodyweight) :
- `seed-cat-cow` : back, bodyweight, **isolation**, warmup → NON qualifiant
- `seed-thoracic-rotation` : back, bodyweight, **isolation**, warmup → NON qualifiant
- `seed-good-morning-bw` : hamstrings, bodyweight, compound, warmup → primaryMuscle=hamstrings, NON qualifiant pour hasCompoundBack
- Aucun exercice `bodyweight` avec `category === 'compound'` ET `primaryMuscle ∈ ['back_width','back_thickness','back']`

**Conclusion : hasCompoundBack = false pour tout profil BW-only.**

### Exercices non-BW compound dos pertinents

- `seed-pullup` : back_width, **pullup_bar**, compound, pop 3 → hasCompoundBack=true si pullup_bar disponible
- `band-row` : back_thickness, **band**, compound, pop 2 → hasCompoundBack=true si band disponible
- `seed-pullover` : back_width, **dumbbell**, compound, pop 1 → hasCompoundBack=true si dumbbell disponible

### Point critique P31 — hasPullInSplit strict equality

```typescript
// ligne 1019
const hasPullInSplit = rawSplit.some((t) => t === 'pull')
```

La vérification utilise `===` strict. `'upper-pull' === 'pull'` → **false**. Seul le type exactement `'pull'` (séance PPL) déclenche BUG-BW-PULL. Les splits upper-lower avec `'upper-pull'` ne déclenchent PAS BUG-BW-PULL mais peuvent déclencher SEED-BW-NOBACK.

---

## P25 — BW seul, PPL — BUG-BW-PULL warning (PAS le nouveau warning)

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight], level=intermediate, splitPreference=auto

**Raisonnement :**
- `hasCompoundBack` : BW seul → aucun exercice compound dos → **false**
- `rawSplit` = selectSplit → `goal=hypertrophy && level !== 'beginner'` → `['push','pull','legs']`
- `hasPullInSplit` = `['push','pull','legs'].some(t => t === 'pull')` = **true**
- Condition BUG-BW-PULL : `!hasCompoundBack && hasPullInSplit` = `true && true` → **déclenché**
  - split final : `['push','fullbody-quad','legs']`, warning BUG-BW-PULL émis en tête
- Condition SEED-BW-NOBACK : `!hasCompoundBack && !hasPullInSplit` = `false && false` (hasPullInSplit=true) → **false** → **NON émis**
- Les deux warnings ne se cumulent pas → comportement correct

**Conclusion :** ✅ PASS — seul BUG-BW-PULL émis, SEED-BW-NOBACK correctement supprimé

---

## P26 — BW seul, fullbody×3 — NOUVEAU warning SEED-BW-NOBACK

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight], level=beginner, splitPreference=auto

**Raisonnement :**
- `hasCompoundBack` : BW seul → **false**
- `rawSplit` = selectSplit → `level=beginner` → `['fullbody-quad','fullbody-hip','fullbody-quad']`
- `hasPullInSplit` = `['fullbody-quad','fullbody-hip','fullbody-quad'].some(t => t === 'pull')` = **false**
- Condition BUG-BW-PULL : `!hasCompoundBack && hasPullInSplit` = `true && false` → **NON déclenché**
- Condition SEED-BW-NOBACK : `!hasCompoundBack && !hasPullInSplit` = **true** → **warning émis** :
  `"Dos non couvert : aucun exercice de tirage compound..."`
- Programme généré normalement avec split fullbody A/B/A et warning en appendice

**Conclusion :** ✅ PASS — SEED-BW-NOBACK émis, BUG-BW-PULL correctement absent

---

## P27 — BW seul, fat_loss PPF — hasPullInSplit=true, seul BUG-BW-PULL warning

**Profil :** goal=fat_loss, days=3, duration=60, equipment=[bodyweight], level=intermediate, splitPreference=auto

**Raisonnement :**
- `hasCompoundBack` : BW seul → **false**
- `rawSplit` = selectSplit → `!isMass && level !== 'beginner'` → `['push','pull','fullbody-quad']` (PPF)
- `hasPullInSplit` = `['push','pull','fullbody-quad'].some(t => t === 'pull')` = **true** ('pull' en index 1)
- Condition BUG-BW-PULL : `!hasCompoundBack && hasPullInSplit` → **déclenché**
  - 'pull' remplacé par 'fullbody-quad' → split final : `['push','fullbody-quad','fullbody-quad']`
  - Warning BUG-BW-PULL émis
- Condition SEED-BW-NOBACK : hasPullInSplit=true → `!hasPullInSplit` = false → **NON émis**

**Conclusion :** ✅ PASS — BUG-BW-PULL émis (fat_loss PPF), SEED-BW-NOBACK correctement supprimé

---

## P28 — BW seul, 2j fullbody — warning SEED-BW-NOBACK

**Profil :** goal=hypertrophy, days=2, duration=60, equipment=[bodyweight], level=beginner, splitPreference=auto

**Raisonnement :**
- `hasCompoundBack` : BW seul → **false**
- `rawSplit` = selectSplit → `days=2` → `['fullbody-quad','fullbody-hip']`
- `hasPullInSplit` = **false** (ni 'pull' en fullbody-quad ni en fullbody-hip)
- Condition SEED-BW-NOBACK : `true && true` → **émis**
- BUG-BW-PULL : hasPullInSplit=false → **NON émis**
- Programme généré avec 2 séances fullbody A+B malgré le warning

**Conclusion :** ✅ PASS — SEED-BW-NOBACK émis même en 2j fullbody

---

## P29 — BW+pullup_bar, fullbody — PAS de warning (hasCompoundBack=true)

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight, pullup_bar], level=beginner, splitPreference=auto

**Raisonnement :**
- `available` inclut `seed-pullup` (back_width, pullup_bar, compound, pop 3)
- `hasCompoundBack` = `available.some(ex => ex.category === 'compound' && ['back_width','back_thickness','back'].includes(ex.primaryMuscle))`
  - seed-pullup : category='compound', primaryMuscle='back_width' ∈ liste → **true**
- `rawSplit` = `['fullbody-quad','fullbody-hip','fullbody-quad']` (beginner)
- `hasPullInSplit` = false
- Condition BUG-BW-PULL : `!hasCompoundBack && hasPullInSplit` = `false && false` → **NON déclenché**
- Condition SEED-BW-NOBACK : `!hasCompoundBack && !hasPullInSplit` = `false && true` → hasCompoundBack=true → `!hasCompoundBack`=false → **NON émis**
- Slot fullbody-quad[2] `['back_width','back_thickness','back'] compound:true` :
  - seed-pullup (back_width, pullup_bar) → slotPrimary=back_width → **sélectionné**

**Conclusion :** ✅ PASS — aucun des deux warnings dos, programme complet avec tractions

---

## P30 — BW+band, fullbody — PAS de warning (band-row compound)

**Profil :** goal=fat_loss, days=3, duration=60, equipment=[bodyweight, band], level=intermediate, splitPreference=fullbody

**Raisonnement :**
- `available` inclut `band-row` (back_thickness, band, **compound**, pop 2) — confirmé dans le seed
- `hasCompoundBack` : band-row category='compound', primaryMuscle='back_thickness' ∈ liste → **true**
- `rawSplit` = `['fullbody-quad','fullbody-hip','fullbody-quad']` (splitPreference=fullbody, fat_loss)
- `hasPullInSplit` = false
- Condition BUG-BW-PULL : `!true && false` → **NON**
- Condition SEED-BW-NOBACK : `!true && !false` = `false` → **NON**
- Slot fullbody dos compound : band-row candidat (back_thickness), slot servi

**Conclusion :** ✅ PASS — aucun warning dos, band-row confirme sa catégorie compound dans le seed

---

## P31 — BW seul, upper-lower 4j — SEED-BW-NOBACK émis (titre prompt trompeur)

**Profil :** goal=hypertrophy, days=4, duration=60, equipment=[bodyweight], level=intermediate, splitPreference=upper-lower

**Note sur le titre :** Le titre du prompt ("PAS de warning SEED-BW-NOBACK") est trompeur. Les assertions dans le corps du prompt confirment que le warning **EST** émis — c'est le comportement attendu selon le code.

**Raisonnement :**
- `rawSplit` = selectSplit → `pref='upper-lower', days=4` → `['upper-push','lower-quad','upper-pull','lower-hip']`
- `hasPullInSplit` = `rawSplit.some(t => t === 'pull')` — vérification STRICTE :
  - `'upper-push' === 'pull'` → false
  - `'lower-quad' === 'pull'` → false
  - `'upper-pull' === 'pull'` → **false** (comparaison exacte : 'upper-pull' ≠ 'pull')
  - `'lower-hip' === 'pull'` → false
  - → `hasPullInSplit` = **false**
- `hasCompoundBack` : BW seul → **false**
- Condition BUG-BW-PULL : `!false && false` → **NON** (hasPullInSplit=false : pas de remplacement de séance pull)
- Condition SEED-BW-NOBACK : `!false && !false` = **true** → **warning émis**
- Comportement attendu : upper-pull BW ayant un slot dos compound vide, le warning est légitime
- Note coach : la séance 'upper-pull' BW a bien un slot `['back_width','back_thickness'] compound:true` qui sera vide puisque aucun compound dos BW n'existe — le warning SEED-BW-NOBACK est donc précis et utile ici

**Conclusion :** ✅ PASS — SEED-BW-NOBACK correctement émis ; la distinction stricte `=== 'pull'` (vs 'upper-pull') est un choix de design documenté et cohérent avec le rawSplit avant remplacement

---

## P32 — BW seul, glutes-focus — SEED-BW-NOBACK émis (⚠️ RÉSERVE)

**Profil :** goal=fat_loss, days=4, duration=60, equipment=[bodyweight], level=intermediate, splitPreference=glutes-focus

**Note sur le titre :** Même situation que P31 — le titre dit "PAS de warning" mais les assertions confirment que le warning est émis. C'est un point d'analyse (faut-il le supprimer pour ce profil ?).

**Raisonnement :**
- `rawSplit` = selectSplit → `pref='glutes-focus', days=4` → `['glutes-hip','quad-glutes','glutes-hip','quad-glutes']`
- `hasPullInSplit` = `rawSplit.some(t => t === 'pull')` :
  - Aucun des 4 types n'est exactement 'pull' → **false**
- `hasCompoundBack` : BW seul → **false**
- Condition SEED-BW-NOBACK : **true** → warning émis
- Analyse du contexte :
  - glutes-hip slot[3] `['back_width','back_thickness'] compound:true` → vide en BW (aucun compound dos BW)
  - quad-glutes slot[2] `['back_thickness','back'] compound:true` → vide en BW
  - Le warning "dos non couvert" est **techniquement correct** : les slots de tirage posture sont effectivement vides
  - Cependant, un programme glutes-focus BW n'est pas censé inclure de tirage — l'utilisateur cible les fessiers, pas le dos. Le warning peut sembler invasif.
  - Alternative recommandée : conditionner SEED-BW-NOBACK à l'absence de splitPreference 'glutes-focus' (ou à la présence d'un slot dos dans le split effectif). Un profil glutes-focus BW est fonctionnel sans dos compound — la posture peut être assurée par des exercices BW (e.g. cat-cow warmup).

**Conclusion :** ✅ PASS sur le comportement code (warning émis logiquement) + ⚠️ RÉSERVE — le warning SEED-BW-NOBACK devrait être conditionnel au splitPreference : pour un profil `glutes-focus` explicite, l'absence de compound dos est intentionnelle et le warning est contre-intuitif. Suggestion : ajouter `&& splitPreference !== 'glutes-focus'` dans la condition SEED-BW-NOBACK.

---

## P33 — Régression INC-1 — strength+3j+intermediate

**Profil :** goal=strength, days=3, duration=60, equipment=[barbell,dumbbell,cable,machine,bodyweight,pullup_bar], level=intermediate, splitPreference=auto

**Raisonnement :**
- selectSplit ligne 575 : `if (goal === 'strength' && level !== 'beginner') return ['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`
- → rawSplit = `['fullbody-quad','fullbody-hip','fullbody-quad']` ✅ (INC-1 corrigé confirmé)
- `hasCompoundBack` : salle complète → multiple exercices disponibles → true
- Aucun warning dos
- fullbody-quad slot[2] `['back_width','back_thickness','back'] compound:true` :
  - seed-pullup (pop 3), seed-lat-pulldown câble (pop 3), machine-lat-pulldown (pop 2) → candidats
  - slotPrimary=back_width → traction ou lat pulldown priorisé
  - Slot non vide ✅
- fullbody-hip slot[2] même slot : idem, exercice dos disponible ✅

**Conclusion :** ✅ PASS — INC-1 (strength+3j+intermediate → fullbody×3) confirmé et non régressé en v7

---

## P34 — Régression BUG-A1 — 5j mass intermediate

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[barbell,dumbbell,cable,machine,bodyweight,pullup_bar], level=intermediate, splitPreference=auto

**Raisonnement :**
- `isMass` = true (hypertrophy), `level !== 'beginner'`
- selectSplit ligne 594 : `if (isMass && level !== 'beginner') return ['push', 'pull', 'lower-quad', 'upper', 'lower-hip']`
- → rawSplit = `['push','pull','lower-quad','upper','lower-hip']` ✅ (public : push/pull/lower/upper/lower)
- Note BUG-A1 : l'ancien code retournait `['push','pull','lower','upper','lower']` avec doublon 'lower' exact. Depuis le fix, lower-quad et lower-hip garantissent la variété bas du corps.
- `hasPullInSplit` = true ('pull' présent) → hasCompoundBack=true (salle complète) → BUG-BW-PULL NON déclenché
- pull slot[0] `['back_width','back_thickness'] compound:true` : seed-pullup, seed-lat-pulldown, machine-lat-pulldown → non vide ✅

**Conclusion :** ✅ PASS — BUG-A1 (5j mass intermediate → split correct avec lower-quad/lower-hip) confirmé et non régressé en v7

---

## P35 — Régression BUG-HIP-BACK — fullbody-hip slot[2]

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell], level=beginner, splitPreference=fullbody

**Raisonnement :**
- rawSplit = `['fullbody-quad','fullbody-hip','fullbody-quad']`
- `hasCompoundBack` : seed-pullover (back_width, dumbbell, **compound** — confirmé dans le seed) → **true**
- SLOTS['fullbody-hip'][2] = `{ muscles: ['back_width','back_thickness','back'], compound: true }` — slot non modifié par SEED-DEADLIFT-SLOT (les slots fullbody gardent 'back' dans leur liste)
- Séance fullbody-hip, slot[2] compound dos :
  - seed-pullover (back_width, dumbbell, compound, pop 1) → `primaryMuscle='back_width' ∈ ['back_width','back_thickness','back']` → candidat
  - seed-row-dumbbell (back_thickness, dumbbell, compound, pop 3) → candidat
  - slotPrimary = `slot.muscles[0]` = 'back_width' → seed-pullover priorisé malgré popularité plus faible
  - **slot non vide** ✅ (amélioration directe de SEED-PULLOVER-COMPOUND passé compound en v7)
- Avant le fix SEED-PULLOVER-COMPOUND : seed-pullover était isolation → ne qualifiait pas pour `compound:true` → slot vide en DB seul → BUG-HIP-BACK
- En v7 : slot servi par le pullover → régression BUG-HIP-BACK non présente ✅

**Conclusion :** ✅ PASS — BUG-HIP-BACK (fullbody-hip slot[2] vide) résolu par SEED-PULLOVER-COMPOUND, non régressé en v7

---

## P36 — Régression NEW-GLUTES-FOCUS — focusMuscles=['glutes']

**Profil :** goal=fat_loss, days=3, duration=60, equipment=[barbell,dumbbell,cable,machine], level=intermediate, focusMuscles=['glutes'], splitPreference=auto

**Raisonnement :**

**Partie 1 — workoutTypeFromFocus (v6 fix à vérifier) :**
```typescript
const hasGlutes = focusMuscles.includes('glutes')
if (hasGlutes && !hasUpper && !hasLower) return 'glutes-hip'
```
- focusMuscles=['glutes'] → hasGlutes=true
- hasLower = focusMuscles.includes('legs') = false
- hasPush = false, hasPull = false, hasArms = false → hasUpper = false
- → `workoutTypeFromFocus` retourne `'glutes-hip'` ✅ (fix v6 confirmé)

**Partie 2 — Split assembly (RÉGRESSION) :**
```typescript
const focusType = workoutTypeFromFocus(focusMuscles) // = 'glutes-hip'
if (focusType) {
  if (focusType === 'lower') { ... } // NON
  if (focusType === 'upper') { ... } // NON
  if (focusType === 'push')  { ... } // NON
  if (focusType === 'pull')  { ... } // NON
  // fallback générique
  return Array.from({ length: daysPerWeek }, () => focusType) as Split
}
```
- `'glutes-hip'` ne correspond à aucune branche spécialisée
- Split produit : `['glutes-hip','glutes-hip','glutes-hip']` — **3 séances identiques**
- Assertion attendue : `glutes-hip/quad-glutes alternés`
- **RÉGRESSION confirmée** : l'alternance glutes-hip / quad-glutes n'est pas implémentée dans la branche `focusType`. Elle n'existe que dans `splitPreference='glutes-focus'` (lignes 508-516).
- Différence :
  - `splitPreference='glutes-focus'` → `['glutes-hip','quad-glutes','glutes-hip']` ✅ (alterné)
  - `focusMuscles=['glutes']` auto → `['glutes-hip','glutes-hip','glutes-hip']` ❌ (3× identique)

**Partie 3 — Slot dos (salle complète) :**
- glutes-hip slot[3] `['back_width','back_thickness'] compound:true` :
  - machine-lat-pulldown (back_width, machine, compound) → candidat → sélectionné ✅
- Le slot dos est servi correctement en salle complète

**Correction suggérée** dans selectSplit, après la branche `pull`, ajouter :
```typescript
if (focusType === 'glutes-hip') {
  return Array.from({ length: daysPerWeek }, (_, i) =>
    i % 2 === 0 ? 'glutes-hip' : 'quad-glutes',
  ) as Split
}
```

**Conclusion :** ❌ FAIL — `workoutTypeFromFocus(['glutes']) → 'glutes-hip'` ✅ (fix v6 préservé) | split final = `['glutes-hip','glutes-hip','glutes-hip']` ❌ (attendu : glutes-hip/quad-glutes alternés) — la branche `focusType` ne gère pas l'alternance pour 'glutes-hip', seul `splitPreference='glutes-focus'` produit un split alterné correct

---

## Tableau récapitulatif

| ID  | Description | hasCompoundBack | hasPullInSplit | BUG-BW-PULL | SEED-BW-NOBACK | Résultat |
|-----|-------------|:-:|:-:|:-:|:-:|:-:|
| P25 | BW seul, PPL, hypertrophy intermédiaire | false | true | ✅ émis | ✅ absent | ✅ PASS |
| P26 | BW seul, fullbody×3, hypertrophy débutant | false | false | ✅ absent | ✅ émis | ✅ PASS |
| P27 | BW seul, fat_loss PPF, intermédiaire | false | true | ✅ émis | ✅ absent | ✅ PASS |
| P28 | BW seul, 2j fullbody, débutant | false | false | ✅ absent | ✅ émis | ✅ PASS |
| P29 | BW+pullup_bar, fullbody×3, débutant | **true** | false | ✅ absent | ✅ absent | ✅ PASS |
| P30 | BW+band, fullbody×3 fat_loss, intermédiaire | **true** | false | ✅ absent | ✅ absent | ✅ PASS |
| P31 | BW seul, upper-lower 4j, intermédiaire | false | false¹ | ✅ absent | ✅ émis | ✅ PASS |
| P32 | BW seul, glutes-focus 4j, fat_loss | false | false | ✅ absent | ✅ émis | ✅ PASS ⚠️ RÉSERVE |
| P33 | Salle complète, strength 3j intermédiaire (INC-1) | true | — | — | — | ✅ PASS |
| P34 | Salle complète, hypertrophy 5j intermédiaire (BUG-A1) | true | — | — | — | ✅ PASS |
| P35 | DB seul, fullbody 3j débutant (BUG-HIP-BACK) | **true** | — | — | — | ✅ PASS |
| P36 | Salle, fat_loss 3j, focusMuscles=['glutes'] (NEW-GLUTES-FOCUS) | true | — | — | — | ❌ FAIL |

¹ hasPullInSplit=false pour upper-lower car `'upper-pull' !== 'pull'` (vérification stricte).

---

## Synthèse

### Corrections v7 SEED-BW-NOBACK — bilan

La logique mutuellement exclusive entre BUG-BW-PULL et SEED-BW-NOBACK est **correctement implémentée** :
- Si `hasPullInSplit=true` → seul BUG-BW-PULL est émis (P25, P27)
- Si `hasPullInSplit=false` → seul SEED-BW-NOBACK est émis si `!hasCompoundBack` (P26, P28, P31, P32)
- Si `hasCompoundBack=true` → aucun warning dos (P29, P30, P33, P34, P35)

Le cas `'upper-pull' !== 'pull'` (P31) est un comportement correct par design : le test porte sur le rawSplit avant remplacement, et 'upper-pull' n'est pas une séance PPL pull.

### Régression confirmée — P36 NEW-GLUTES-FOCUS

Le fix v6 `workoutTypeFromFocus(['glutes']) → 'glutes-hip'` est préservé, mais l'assemblage du split ne produit pas l'alternance `glutes-hip/quad-glutes` attendue. La branche `focusType` dans `selectSplit` manque d'un cas spécifique pour 'glutes-hip'. Ce comportement est distinct du `splitPreference='glutes-focus'` qui lui alterne correctement.

### Réserve — P32 SEED-BW-NOBACK pour glutes-focus

Le warning est techniquement correct mais peut être perçu comme contradictoire par un utilisateur qui a explicitement choisi un programme fessiers. Une suppression conditionnelle pour `splitPreference === 'glutes-focus'` améliorerait l'UX sans perte de sécurité.
