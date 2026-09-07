# Audit v8 — Groupe B (P21-P40)
**Date :** 2026-09-07  
**Auditeur :** Claude Sonnet 4.6  
**Scope :** Pullover compound + Slots deadlift élargi

---

## Données de référence utilisées

### Exercices pertinents (vérifiés dans exercises-seed.json)

| id | primaryMuscle | equipment | category | pop |
|----|--------------|-----------|----------|-----|
| seed-pullover | back_width | dumbbell | **compound** | 1 |
| seed-row-dumbbell | back_thickness | dumbbell | compound | 3 |
| seed-pullover-dumbbell | back_thickness | dumbbell | **isolation** | 3 |
| seed-shrug | back | dumbbell | isolation | 2 |
| seed-row-barbell | back_thickness | barbell | compound | 7 |
| seed-row-tbar | back_thickness | barbell | compound | 2 |
| seed-deadlift | back | barbell | compound | 3 |
| seed-lat-pulldown | back_width | cable | compound | 3 |
| seed-row-cable | back_thickness | cable | compound | 2 |
| machine-lat-pulldown | back_width | machine | compound | 2 |
| seed-row-machine | back_thickness | machine | compound | 1 |
| seed-pullup | back_width | pullup_bar | compound | 3 |
| bw-inverted-row | back_thickness | pullup_bar | compound | 1 |
| kb-row | back_thickness | kettlebell | compound | 2 |
| kb-deadlift | back | kettlebell | compound | 2 |
| band-row | back_thickness | band | compound | 2 |

### Slots pull modifiés (SEED-DEADLIFT-SLOT fix v7)

Les 6 slots de tirage vertical (`pull[0]`, `upper-pull[0]`, `lower_pull[1]`, `chest-back[1]`, `back-bi[0]`, `glutes-hip[3]`) ont pour muscles `['back_width','back_thickness']` — ce qui exclut `seed-deadlift` (primaryMuscle=`back`). Les slots fullbody `['back_width','back_thickness','back']` restent inchangés — le deadlift y est candidat.

### Formules adjustedSlotCount

| goal | 20 min | 45 min | 60 min | 90 min |
|------|--------|--------|--------|--------|
| strength | min(3, max(2, ⌊base×0.5⌋)) | min(3, max(2, ⌊base×0.5⌋)) | max(4, ⌊base×0.5⌋) | min(base, 5) |
| autres | max(2, ⌊base×0.5⌋) | max(4, ⌊base×0.75⌋) | base | min(base+2, 8) |

### Logique de tri dans pickExercise (ordre de priorité)

1. focusMuscles (muscles ciblés en premier)
2. slotPrimary = `slot.muscles[0]` (`primaryMuscle === slotPrimary ? 0 : 1`)
3. usedGlobally (non utilisé → 0)
4. (strength + compound) : strengthEquipmentPrio
5. popularité desc

Sélection finale : `beginner` → top-1 ; `intermediate`/`advanced` → aléatoire parmi top-3.

---

## P21 — DB seul, PPL 3j hypertrophy intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell], level=intermediate

**Raisonnement :**
- `selectSplit` : hypertrophy + intermediate + 3j → `['push','pull','legs']` (PPL)
- `adjustedSlotCount(pull, 60, hyp)` : base=8, 60min → **8 slots**
- `pull[0]` `['back_width','back_thickness']` compound : candidats dumbbell → seed-pullover (back_width, aP=0, pop 1) et seed-row-dumbbell (back_thickness, aP=1, pop 3). slotPrimary=back_width → seed-pullover en tête. ✅
- `pull[1]` `['back_thickness','back']` compound : seed-row-dumbbell (back_thickness, aP=0, seul compound dumbbell non usedInWorkout). ✅

**Verdict : ✅ PASS**

---

## P22 — DB seul, strength 3j beginner

**Profil :** goal=strength, days=3, duration=60, equipment=[dumbbell], level=beginner

**Raisonnement :**
- `selectSplit` : beginner → case 3 → `return ['fullbody-quad','fullbody-hip','fullbody-quad']` (la règle INC-1 s'applique uniquement si `level !== 'beginner'`, donc pas ici)
- `adjustedSlotCount(fullbody-quad, 60, strength)` : base=9, 60min strength → max(4, ⌊9×0.5⌋) = **4 slots**
- `fullbody-quad[2]` `['back_width','back_thickness','back']` compound : seed-pullover (back_width, aP=0) > seed-row-dumbbell (back_thickness, aP=1). beginner → top-1 → **seed-pullover** ✅

**Verdict : ✅ PASS**

---

## P23 — DB seul, fat_loss 4j intermediate

**Profil :** goal=fat_loss, days=4, duration=60, equipment=[dumbbell], level=intermediate

**Raisonnement :**
- `selectSplit` : 4j, fat_loss (!isMass), intermediate (level!='beginner') → `['push','pull','lower-quad','fullbody-quad']`
- `pull[0]` : seed-pullover (slotPrimary back_width) ✅
- `hasCompoundBack` : seed-pullover (back_width, compound, dumbbell) → true → BUG-BW-PULL non déclenché ✅

**Verdict : ✅ PASS**

---

## P24 — DB seul, 20 min strength intermediate

**Profil :** goal=strength, days=3, duration=20, equipment=[dumbbell], level=intermediate

**Raisonnement :**
- `selectSplit` : INC-1 → strength + intermediate + 3j → `['fullbody-quad','fullbody-hip','fullbody-quad']`
- `adjustedSlotCount(fullbody-quad, 20, strength)` : base=9, 20min strength → min(3, max(2, ⌊9×0.5⌋)) = min(3, max(2,4)) = min(3,4) = **3 slots**
- Slots 0,1,2 :
  - `[0]` `['quads','glutes']` compound → squat DB (si dispo)
  - `[1]` `['chest','chest_upper']` compound → bench DB
  - `[2]` `['back_width','back_thickness','back']` compound → seed-pullover (slotPrimary=back_width, aP=0) probable ✅
- Avec strength+compound, equipmentPrio(dumbbell)=2 identique pour les deux → le critère slotPrimary prime

**Verdict : ✅ PASS**

---

## P25 — DB seul, 45 min hypertrophy beginner

**Profil :** goal=hypertrophy, days=3, duration=45, equipment=[dumbbell], level=beginner

**Raisonnement :**
- `selectSplit` : beginner → fullbody×3 : `['fullbody-quad','fullbody-hip','fullbody-quad']`
- `adjustedSlotCount(fullbody-quad, 45, hyp)` : base=9, 45min non-strength → max(4, ⌊9×0.75⌋) = max(4,6) = **6 slots**
- `fullbody-quad[2]` compound dos : seed-pullover (slotPrimary back_width). beginner → top-1 → **seed-pullover** ✅

**Verdict : ✅ PASS**

---

## P26 — DB seul, 90 min hypertrophy intermediate (8 slots) *(point critique pull[3])*

**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[dumbbell], level=intermediate

**Raisonnement :**
- `selectSplit` : hypertrophy + intermediate + 3j → PPL : `['push','pull','legs']`
- `adjustedSlotCount(pull, 90, hyp)` : base=8, 90min → min(8+2, 8) = **8 slots**

**Analyse des 8 slots pull :**

| Index | Slot | Résultat attendu |
|-------|------|-----------------|
| 0 | `['back_width','back_thickness']` compound | seed-pullover (slotPrimary back_width) |
| 1 | `['back_thickness','back']` compound | seed-row-dumbbell (back_thickness, seul compound restant) |
| **2** | `['back_thickness','back_width','back']` compound:false (isolation dos) | seed-pullover-dumbbell (back_thickness, isolation, pop 3) |
| 3 | `['biceps']` compound:false | seed-curl-dumbbell ou hammer |
| 4 | `['shoulders_rear']` compound:false | seed-rear-delt-fly |
| 5 | `['forearms']` compound:false | slot potentiellement vide (pas d'isolation forearms dumbbell évident) |
| 6 | `['biceps']` compound:false | seed-curl-hammer |
| 7 | `['back_width','back']` compound:false | seed-shrug (back) ou seed-pullover si non usedGlobally |

**Note critique — numérotation :** L'audit prompt désigne le slot isolation dos comme "pull[3]" mais dans le code, cet index est `pull[2]` (indexation 0-based). Le slot `pull[3]` dans le code est `['biceps']`. C'est une erreur de numérotation dans le prompt.

**slot isolation dos = pull[2] :**
- seed-pullover usedInWorkout → exclu
- seed-row-dumbbell usedInWorkout → exclu
- Isolation dumbbell pour back_thickness/back_width/back :
  - seed-pullover-dumbbell (back_thickness, isolation, pop 3, aP=0 car slotPrimary=back_thickness) ✅
  - seed-shrug (back, isolation, pop 2, aP=1)
- → **seed-pullover-dumbbell** en tête ✅ (l'assertion de l'audit est correcte même si la numérotation est erronée)

**Verdict : ✅ PASS** *(numérotation des slots dans l'audit incorrecte : pull[3] isolation dos → doit lire pull[2] en indexation 0-based)*

---

## P27 — DB seul, back-bi brosplit advanced

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[dumbbell], level=advanced, splitPreference=brosplit

**Raisonnement :**
- `selectSplit` : brosplit 5j → `['chest-tri','back-bi','legs','shoulders-arms','upper']`
- `adjustedSlotCount(back-bi, 60, hyp)` : base=8 → **8 slots**
- `back-bi[0]` `['back_width','back_thickness']` compound : seed-pullover (slotPrimary back_width, aP=0, pop 1) ✅
- `back-bi[1]` `['back_thickness','back']` compound : seed-row-dumbbell (slotPrimary back_thickness, aP=0, pop 3) ✅
- `back-bi[3]` isolation dos `['back_thickness','back_width','back']` :
  - seed-pullover usedInWorkout, seed-row-dumbbell usedInWorkout → exclus
  - seed-pullover-dumbbell (back_thickness, isolation, pop 3, aP=0) > seed-shrug (back, pop 2, aP=1)
  - → **seed-pullover-dumbbell** ✅

**Verdict : ✅ PASS**

---

## P28 — Barbell seul, 20 min hypertrophy intermediate

**Profil :** goal=hypertrophy, days=3, duration=20, equipment=[barbell], level=intermediate

**Raisonnement :**
- `selectSplit` : hypertrophy + intermediate + 3j → PPL
- `adjustedSlotCount(pull, 20, hyp)` : base=8, 20min → max(2, ⌊8×0.5⌋) = max(2,4) = **4 slots**
- Aucun exercice barbell n'a primaryMuscle=back_width (seed-lat-pulldown=cable, seed-pullup=pullup_bar, machine-lat-pulldown=machine)

**pull[0] `['back_width','back_thickness']` compound :**
- Candidats barbell : seed-row-barbell (back_thickness, aP=1), seed-row-tbar (back_thickness, aP=1)
- seed-deadlift (back) → back ∉ ['back_width','back_thickness'] → **EXCLU** ✅
- Aucun aP=0 disponible. Tri par pop : seed-row-barbell (7) > seed-row-tbar (2) → **seed-row-barbell** ✅

**pull[1] `['back_thickness','back']` compound :**
- seed-row-barbell usedInWorkout → exclu
- Candidats : seed-row-tbar (back_thickness, aP=0, pop 2), seed-deadlift (back, aP=1, pop 3)
- → seed-row-tbar probable, mais pool top-3 aléatoire pour intermediate ✅

**Verdict : ✅ PASS**

---

## P29 — Barbell seul, 45 min strength intermediate (INC-1)

**Profil :** goal=strength, days=3, duration=45, equipment=[barbell], level=intermediate

**Raisonnement :**
- `selectSplit` : INC-1 → strength + intermediate + 3j → `['fullbody-quad','fullbody-hip','fullbody-quad']`
- `adjustedSlotCount(fullbody-quad, 45, strength)` : base=9, 45min strength → min(3, max(2, ⌊9×0.5⌋)) = **3 slots**

**fullbody-quad[2] `['back_width','back_thickness','back']` compound :**
- Ce slot n'est **PAS** un des 6 slots SEED-DEADLIFT-SLOT modifiés → seed-deadlift (back) reste candidat ici
- Candidats barbell : seed-row-barbell (back_thickness, aP=1, pop 7), seed-row-tbar (back_thickness, aP=1, pop 2), seed-deadlift (back, aP=1, pop 3)
- Aucun candidat back_width barbell → tous aP=1
- strength+compound → equipmentPrio(barbell)=0 (identique pour tous)
- Tri par pop : seed-row-barbell (7) → **seed-row-barbell** probable ✅
- seed-deadlift est bien candidat mais troisième par pop (pop 3 < 7)

**Verdict : ✅ PASS**

---

## P30 — Barbell seul, 90 min hypertrophy intermediate

**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[barbell], level=intermediate

**Raisonnement :**
- `selectSplit` : PPL
- `adjustedSlotCount(pull, 90, hyp)` : base=8, 90min → min(10,8) = **8 slots**

**pull[0] `['back_width','back_thickness']` compound :**
- Aucun back_width barbell → aP=1 pour tous
- seed-deadlift (back) → back ∉ liste → **EXCLU** ✅
- seed-row-barbell (pop 7) → **seed-row-barbell** ✅

**pull[1] `['back_thickness','back']` compound :**
- seed-row-barbell usedInWorkout → exclu
- seed-row-tbar (aP=0, pop 2) vs seed-deadlift (aP=1, pop 3) → seed-row-tbar ou seed-deadlift (top-3 aléatoire)

**pull[7] `['back_width','back']` compound:false :**
- Isolation barbell avec primaryMuscle=back_width ou back → aucune isolation barbell disponible dans le seed
- Fallback compound : seed-deadlift (back, pop 3) si non usedInWorkout/usedGlobally → candidat ✅
- Le slot peut être servi par seed-deadlift ou seed-row-tbar selon ce qui reste disponible

**Verdict : ✅ PASS**

---

## P31 — KB seul, PPL 3j fat_loss intermediate

**Profil :** goal=fat_loss, days=3, duration=60, equipment=[kettlebell], level=intermediate

**Raisonnement :**
- `selectSplit` : **Attention** — le split réel n'est PAS PPL mais **PPF** : fat_loss (!isMass) + intermediate → `['push','pull','fullbody-quad']`. L'audit dit "PPL" — **erreur dans le libellé du profil** (le split génère bien une séance pull, ce qui permet de tester les assertions)
- `adjustedSlotCount(pull, 60, fat_loss)` : base=8 → **8 slots**

**pull[0] `['back_width','back_thickness']` compound :**
- Candidats kettlebell : kb-row (back_thickness), kb-deadlift (back → exclu car back ∉ liste) ✅
- Seul candidat : **kb-row** ✅

**pull[1] `['back_thickness','back']` compound :**
- kb-row usedInWorkout → exclu
- kb-deadlift (back, aP=1, seul candidat restant) → **kb-deadlift** ✅

**hasCompoundBack** : kb-row (back_thickness, compound) → true → BUG-BW-PULL non déclenché ✅

**Verdict : ✅ PASS** *(note : le split réel est PPF et non PPL comme écrit dans l'audit ; le comportement est correct)*

---

## P32 — KB seul, strength 4j intermediate (upper-lower)

**Profil :** goal=strength, days=4, duration=60, equipment=[kettlebell], level=intermediate, splitPreference=upper-lower

**Raisonnement :**
- `selectSplit` : upper-lower explicite + 4j → `['upper-push','lower-quad','upper-pull','lower-hip']`
- `adjustedSlotCount(upper-pull, 60, strength)` : base=8, 60min strength → max(4, ⌊8×0.5⌋) = max(4,4) = **4 slots**

**upper-pull[0] `['back_width','back_thickness']` compound :**
- Candidats kettlebell : kb-row (back_thickness, aP=1)
- kb-deadlift (back) → back ∉ ['back_width','back_thickness'] → **EXCLU** ✅
- Seul candidat : **kb-row** ✅

**upper-pull[1] `['back_thickness','back']` compound :**
- kb-row usedInWorkout → exclu
- kb-deadlift (back, aP=1, pop 2) → seul candidat restant → **kb-deadlift** ✅

**Verdict : ✅ PASS**

---

## P33 — DB + pullup_bar, PPL 3j intermediate *(pullover vs pullup compétition)*

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell, pullup_bar], level=intermediate

**Raisonnement :**
- `selectSplit` : hypertrophy + intermediate + 3j → PPL

**pull[0] `['back_width','back_thickness']` compound :**
- Candidats avec primaryMuscle=back_width : seed-pullover (dumbbell, pop 1, aP=0), seed-pullup (pullup_bar, pop 3, aP=0)
- Candidats avec primaryMuscle=back_thickness : seed-row-dumbbell (pop 3, aP=1), bw-inverted-row (pullup_bar, pop 1, aP=1)
- Tri : aP d'abord → {seed-pullup, seed-pullover} avant {seed-row-dumbbell, bw-inverted-row}
- Parmi aP=0 : seed-pullup (pop 3) > seed-pullover (pop 1)
- Top-3 = [seed-pullup, seed-pullover, seed-row-dumbbell]
- intermediate → aléatoire parmi top-3 → **seed-pullup probable** (premier dans le tri) ✅

**Verdict : ✅ PASS**

---

## P34 — Barbell + dumbbell, PPL 3j advanced *(pullover priorisé malgré pop faible)* ⚠️

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell, dumbbell], level=advanced

**Raisonnement :**
- `selectSplit` : hypertrophy + advanced + 3j → PPL

**pull[0] `['back_width','back_thickness']` compound :**
- Candidats avec primaryMuscle=back_width : seed-pullover (dumbbell, pop 1, **aP=0**)
- Candidats avec primaryMuscle=back_thickness : seed-row-barbell (barbell, pop 7, aP=1), seed-row-dumbbell (dumbbell, pop 3, aP=1), seed-row-tbar (barbell, pop 2, aP=1)
- seed-deadlift (back) → back ∉ ['back_width','back_thickness'] → **EXCLU** ✅
- **Problème :** seed-pullover (pop 1, dumbbell) est systématiquement en tête du tri (aP=0) malgré sa faible popularité
- Top-3 = [seed-pullover, seed-row-barbell, seed-row-dumbbell]
- advanced → aléatoire parmi top-3

**Analyse :** Le mécanisme SEED-DEADLIFT-SLOT a fixé slotPrimary=back_width pour écarter le deadlift, mais cette correction crée un biais défavorable : seed-pullover (pop 1, mouvement secondaire) est systématiquement prioritaire sur seed-row-barbell (pop 7, mouvement de référence pour un utilisateur avec barbell). Pour un utilisateur barbell+dumbbell advanced, obtenir un pull-over comme premier exercice de dos est sous-optimal. Le critère slotPrimary prime ici sur une popularité 7×supérieure.

**Verdict : ⚠️ RÉSERVE** — Comportement conforme au code, mais la priorisation de seed-pullover (pop 1) sur seed-row-barbell (pop 7) pour les profils barbell+dumbbell est une limitation de conception à surveiller. L'assertion du prompt est correcte.

---

## P35 — Barbell + cable, PPL 3j intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell, cable], level=intermediate

**Raisonnement :**
- `selectSplit` : hypertrophy + intermediate + 3j → PPL

**Exercices disponibles (barbell + cable) pour dos :**
- seed-lat-pulldown (back_width, cable, compound, pop 3) ← seul candidat back_width
- seed-row-barbell (back_thickness, barbell, compound, pop 7)
- seed-row-tbar (back_thickness, barbell, compound, pop 2)
- seed-row-cable (back_thickness, cable, compound, pop 2)
- seed-deadlift (back, barbell, compound, pop 3)

**pull[0] `['back_width','back_thickness']` compound :**
- seed-deadlift (back) → **EXCLU** ✅
- seed-lat-pulldown (back_width, **aP=0**, pop 3) vs seed-row-barbell (aP=1, pop 7) vs seed-row-cable (aP=1, pop 2)
- seed-lat-pulldown priorisé (slotPrimary=back_width → aP=0)
- Top-3 = [seed-lat-pulldown, seed-row-barbell, seed-row-cable]
- intermediate → **seed-lat-pulldown probable** ✅

**Comparaison seed-lat-pulldown vs seed-row-barbell :** seed-lat-pulldown (aP=0 car back_width = slotPrimary) prime sur seed-row-barbell (aP=1, pop 7) — ici c'est correct car le lat pulldown est bien un exercice de tirage vertical pertinent.

**Verdict : ✅ PASS**

---

## P36 — Salle complète, PPL 3j advanced

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable,machine,bodyweight,pullup_bar], level=advanced

**Raisonnement :**
- `selectSplit` : hypertrophy + advanced + 3j → PPL

**pull[0] `['back_width','back_thickness']` compound :**
- Candidats avec back_width : seed-lat-pulldown (cable, pop 3, aP=0), seed-pullup (pullup_bar, pop 3, aP=0), machine-lat-pulldown (machine, pop 2, aP=0), seed-pullover (dumbbell, pop 1, aP=0)
- seed-deadlift (back) → **EXCLU** ✅
- Tri des aP=0 par pop : seed-lat-pulldown et seed-pullup (pop 3) ex aequo, puis machine-lat-pulldown (pop 2), seed-pullover (pop 1)
- Top-3 = [seed-lat-pulldown, seed-pullup, machine-lat-pulldown]

**Note :** Le prompt indique "top-5" pour advanced, mais le code utilise `candidates.slice(0, 3)` pour tous les non-beginner (intermediate et advanced identiques). La sélection est donc top-3, pas top-5. **Erreur dans l'audit prompt.**

- intermediate et advanced → mêmes 3 candidats : seed-lat-pulldown ou seed-pullup probables ✅

**Verdict : ✅ PASS** *(correction : top-3 et non top-5 comme l'audit l'indique)*

---

## P37 — DB seul, lower_pull 3j intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell], level=intermediate, focusMuscles=['back','legs']

**Raisonnement :**
- `workoutTypeFromFocus(['back','legs'])` : hasPull=true, hasLower=true, hasPush=false → `'lower_pull'`
- `selectSplit` : focusType='lower_pull' → `['lower_pull','lower_pull','lower_pull']`
- `adjustedSlotCount(lower_pull, 60, hyp)` : SLOTS['lower_pull'] a 9 slots → base=9 → **9 slots**

**lower_pull[1] `['back_width','back_thickness']` compound :**
- Candidats dumbbell : seed-pullover (back_width, aP=0, pop 1), seed-row-dumbbell (back_thickness, aP=1, pop 3)
- seed-pullover priorisé (slotPrimary=back_width) ✅
- intermediate top-3 → [seed-pullover, seed-row-dumbbell] → seed-pullover probable ✅

**Verdict : ✅ PASS**

---

## P38 — DB seul, chest-back Arnold 5j intermediate

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[dumbbell], level=intermediate, splitPreference=arnold

**Raisonnement :**
- `selectSplit` : arnold 5j → `['chest-back','shoulders-arms','legs','chest-back','shoulders-arms']`
- `adjustedSlotCount(chest-back, 60, hyp)` : SLOTS['chest-back'] a 9 slots → **9 slots**

**chest-back[1] `['back_width','back_thickness']` compound :**
- seed-pullover (back_width, aP=0, pop 1) > seed-row-dumbbell (back_thickness, aP=1, pop 3)
- → **seed-pullover** ✅

**chest-back[5] isolation dos `['back_thickness','back_width','back']` :**
- seed-pullover usedInWorkout (slot[1]) → exclu
- seed-row-dumbbell usedInWorkout (slot[3] `['back_thickness','back']`) → exclu
- Isolation dumbbell restante : seed-pullover-dumbbell (back_thickness, isolation, pop 3, aP=0) et seed-shrug (back, isolation, pop 2, aP=1)
- slotPrimary=back_thickness → seed-pullover-dumbbell (aP=0) en tête ✅

**Verdict : ✅ PASS**

---

## P39 — KB + band, fullbody 3j intermediate *(tie complet kb-row vs band-row)*

**Profil :** goal=fat_loss, days=3, duration=60, equipment=[kettlebell, band], level=intermediate, splitPreference=fullbody

**Raisonnement :**
- `selectSplit` : fullbody explicite + 3j → `['fullbody-quad','fullbody-hip','fullbody-quad']`
- `hasCompoundBack` : kb-row (compound, back_thickness) et band-row (compound, back_thickness) → **true** ✅

**fullbody-quad[2] `['back_width','back_thickness','back']` compound :**
- Candidats : kb-row (back_thickness, pop 2, aP=1), band-row (back_thickness, pop 2, aP=1), kb-deadlift (back, pop 2, aP=1)
- Aucun candidat avec back_width (kettlebell ou band) → tous aP=1
- usedGlobally=0 pour tous → tri final par pop → **tie complet** (pop=2 pour les trois)
- Résolution aléatoire parmi top-3 ✅

**Verdict : ✅ PASS**

---

## P40 — DB + band, PPL 3j intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell, band], level=intermediate

**Raisonnement :**
- `selectSplit` : hypertrophy + intermediate + 3j → PPL

**Exercices dos disponibles (dumbbell + band) :**
- seed-pullover (back_width, dumbbell, compound, pop 1)
- seed-row-dumbbell (back_thickness, dumbbell, compound, pop 3)
- band-row (back_thickness, band, compound, pop 2)
- seed-pullover-dumbbell (back_thickness, dumbbell, isolation, pop 3)
- seed-shrug (back, dumbbell, isolation, pop 2)

**pull[0] `['back_width','back_thickness']` compound :**
- seed-pullover (back_width, **aP=0**, pop 1) en tête (slotPrimary)
- Top-3 = [seed-pullover, seed-row-dumbbell, band-row]
- → **seed-pullover** probable ✅

**pull[1] `['back_thickness','back']` compound :**
- seed-pullover usedInWorkout → exclu
- Candidats : seed-row-dumbbell (back_thickness, aP=0, pop 3), band-row (back_thickness, aP=0, pop 2)
- Tri par pop : seed-row-dumbbell (3) > band-row (2) → **seed-row-dumbbell probable** ✅

**Verdict : ✅ PASS**

---

## Tableau récapitulatif Groupe B

| Profil | Description | Verdict |
|--------|-------------|---------|
| P21 | DB seul, PPL 3j hypertrophy intermediate | ✅ PASS |
| P22 | DB seul, strength 3j beginner | ✅ PASS |
| P23 | DB seul, fat_loss 4j intermediate | ✅ PASS |
| P24 | DB seul, 20min strength intermediate | ✅ PASS |
| P25 | DB seul, 45min hypertrophy beginner | ✅ PASS |
| P26 | DB seul, 90min hypertrophy intermediate (8 slots) | ✅ PASS *(numérotation pull[3] incorrecte dans le prompt → pull[2])* |
| P27 | DB seul, back-bi brosplit advanced | ✅ PASS |
| P28 | Barbell seul, 20min hypertrophy intermediate | ✅ PASS |
| P29 | Barbell seul, 45min strength intermediate (INC-1) | ✅ PASS |
| P30 | Barbell seul, 90min hypertrophy intermediate | ✅ PASS |
| P31 | KB seul, fat_loss 3j intermediate *(split PPF, non PPL)* | ✅ PASS |
| P32 | KB seul, strength 4j upper-lower | ✅ PASS |
| P33 | DB + pullup_bar, PPL 3j intermediate | ✅ PASS |
| P34 | Barbell + dumbbell, PPL 3j advanced | ⚠️ RÉSERVE |
| P35 | Barbell + cable, PPL 3j intermediate | ✅ PASS |
| P36 | Salle complète, PPL 3j advanced | ✅ PASS *(top-3, non top-5)* |
| P37 | DB seul, lower_pull 3j intermediate | ✅ PASS |
| P38 | DB seul, chest-back Arnold 5j intermediate | ✅ PASS |
| P39 | KB + band, fullbody 3j intermediate | ✅ PASS |
| P40 | DB + band, PPL 3j intermediate | ✅ PASS |

**Bilan : 19 PASS · 0 FAIL · 1 RÉSERVE**

---

## Anomalies détectées dans le prompt d'audit

### A1 — Numérotation de slot erronée (P26)
Le prompt désigne l'isolation dos comme "pull[3]" mais le code utilise l'indexation 0-based : l'isolation dos est `SLOTS['pull'][2]` (index 2). Le slot `SLOTS['pull'][3]` est `['biceps']`. L'assertion reste correcte dans son contenu (seed-pullover-dumbbell attendu).

### A2 — Libellé "PPL" incorrect pour P31
P31 dit "PPL 3j fat_loss intermediate" mais le générateur produit `['push','pull','fullbody-quad']` (PPF) pour fat_loss+intermediate+3j (branche `!isMass && level !== 'beginner'`). La séance pull est bien présente — les assertions de slots sont valides.

### A3 — "top-5" incorrect pour advanced (P36)
Le prompt indique "intermediate top-3 → … (advanced top-5?)" mais le code utilise `candidates.slice(0, 3)` pour tous les niveaux non-beginner (intermediate ET advanced identiques) — pas de pool élargi pour advanced.

---

## Point critique confirmé : P34 — Biais slotPrimary back_width

Le fix SEED-DEADLIFT-SLOT (slot pull[0] = `['back_width','back_thickness']`) a pour effet de systématiquement prioriser tout exercice avec `primaryMuscle=back_width` via le critère slotPrimary. Lorsque le seul candidat back_width est seed-pullover (pop 1, dumbbell), il prime sur seed-row-barbell (pop 7, barbell) dans un profil barbell+dumbbell.

Ce biais est acceptable si l'utilisateur n'a que des haltères (P21, P27), mais devient problématique dès que barbell est disponible. Un profil barbell+dumbbell advanced qui obtient un pull-over comme exercice principal du slot tirage vertical au lieu du rowing barre (pop 7) est une dégradation de la recommandation.

**Recommandation :** Envisager un critère d'équipement supérieur à slotPrimary dans ce slot spécifique pour les objectifs force/hypertrophie, ou augmenter la popularité de seed-pullover.
