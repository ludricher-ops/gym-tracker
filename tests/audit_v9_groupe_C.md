# Audit v9 — GROUPE C : Régressions globales (P23–P30)

**Date :** 2026-09-07  
**Auditeur :** Claude Sonnet 4.6 (agent dédié)  
**Source :** `programGenerator.ts` + `exercises-seed.json` (lus intégralement)

---

## Rappel des exercices-clés utilisés dans ce groupe

| Id | Nom | primaryMuscle | equipment | category | pop |
|----|-----|---------------|-----------|----------|-----|
| seed-pullover | Pull-over haltère | back_width | dumbbell | **isolation** | 1 |
| seed-pullover-dumbbell | Pull-over haltère (bras fléchi) | back_thickness | dumbbell | isolation | 3 |
| seed-pullover-cable | Pull-over poulie haute | back_thickness | cable | isolation | 2 |
| seed-straight-arm-pulldown | Tirage bras tendus poulie | back_thickness | cable | isolation | 2 |
| machine-pullover | Pullover machine | back_width | machine | isolation | 2 |
| machine-low-row | Tirage buste machine | back_thickness | machine | isolation | 2 |
| machine-lat-pulldown | Tirage vertical machine | back_width | machine | compound | 2 |
| seed-row-machine | Rowing machine | back_thickness | machine | compound | 1 |
| seed-lat-pulldown | Tirage vertical | back_width | cable | compound | 3 |
| seed-row-cable | Tirage horizontal poulie | back_thickness | cable | compound | 2 |
| seed-row-barbell | Rowing barre | back_thickness | barbell | compound | 7 |
| seed-row-tbar | Rowing T-bar | back_thickness | barbell | compound | 2 |
| seed-deadlift | Soulevé de terre | back | barbell | compound | 3 |
| seed-pullup | Tractions | back_width | pullup_bar | compound | 3 |
| kb-row | Rowing kettlebell | back_thickness | kettlebell | compound | 2 |
| kb-deadlift | Soulevé de terre KB | back | kettlebell | compound | 2 |
| kb-pullover | Pull-over kettlebell | back_width | kettlebell | isolation | 1 |
| band-row | Rowing élastique | back_thickness | band | compound | 2 |

---

## Rappel formules

- `adjustedSlotCount(base, 60, 'hypertrophy') = base`
- `adjustedSlotCount(base, 60, 'strength') = max(4, floor(base × 0.5))`
- Base pull / back-bi / chest-back = 8 ; glutes-hip / quad-glutes = **8** (SLOTS[...].length dans le code — le tableau du prompt indiquait 6, mais les définitions SLOTS du code comptent 8 entrées pour ces deux types)
- Tri pickExercise : focusedMuscles → slotPrimary → usedGlobally → strengthEquipmentPrio → popularité desc
- Top-3 pool (level ≠ beginner) → sélection random parmi les 3 premiers

---

## P23 — Salle complète · PPL 60min intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell, dumbbell, cable, pullup_bar, machine], level=intermediate  
**Split :** PPL → `['push','pull','legs']`  
**Slots pull :** adjustedSlotCount(8, 60, 'hypertrophy') = **8 slots**

### Simulation

**hasCompoundBack :** vrai (seed-row-barbell, seed-lat-pulldown, machine-lat-pulldown, seed-pullup, etc.)  
**hasPullInSplit :** 'pull' ∈ rawSplit → vrai → BUG-BW-PULL = false (hasCompoundBack=true)

**Candidats compound dos disponibles :**
- back_width : seed-pullup (pop 3), seed-lat-pulldown (pop 3), machine-lat-pulldown (pop 2)
- back_thickness : seed-row-barbell (pop 7), seed-row-dumbbell (pop 3), seed-row-cable (pop 2), seed-row-tbar (pop 2), seed-row-machine (pop 1), bw-inverted-row (pop 1)

**pull[0]** `['back_width','back_thickness'] compound:true`  
- slotPrimary = 'back_width' → back_width candidates ranked 0 : seed-pullup (pop 3), seed-lat-pulldown (pop 3), machine-lat-pulldown (pop 2)  
- seed-pullover : equipment=dumbbell (disponible) MAIS category=isolation → **filtré par `compound:true`** ✅  
- seed-deadlift : primaryMuscle='back' ∉ ['back_width','back_thickness'] → **exclu** ✅  
- Top 3 : seed-pullup, seed-lat-pulldown, machine-lat-pulldown → random parmi ces 3 ✅

**pull[1]** `['back_thickness','back'] compound:true`  
- slotPrimary = 'back_thickness' → seed-row-barbell (pop 7) prime si non encore utilisé ✅

**pull[2]** `['back_thickness','back_width','back'] compound:false isolation`  
- slotPrimary = 'back_thickness' → candidats back_thickness isolation : seed-pullover-dumbbell (pop 3), machine-low-row (pop 2), seed-pullover-cable (pop 2), seed-straight-arm-pulldown (pop 2)  
- seed-pullover (back_width, pop 1) → rank 1 sur slotPrimary → position 5+ → hors top 3 probable  
- Slot isolation dos rempli (seed-pullover-dumbbell prime) ✅  
- seed-pullover absent du slot compound ✅

**pull[7]** `['back_width','back'] compound:false`  
- Candidats isolation back_width : machine-pullover (pop 2), seed-pullover (pop 1)  
- machine-pullover prime (pop 2 > pop 1) → seed-pullover apparaît en pool si machine-pullover déjà utilisé ✅

**Assertions vérifiées :**
- seed-pullover absent du slot compound pull[0] ✅
- Deadlift exclu de pull[0] (primaryMuscle='back' ∉ slot.muscles) ✅
- Slot isolation dos pull[2] non vide ✅
- Aucune régression observable ✅

**Résultat :** PASS  
**Slots clés :**
- pull[0] : seed-pullup OU seed-lat-pulldown OU machine-lat-pulldown (random top-3)
- pull[2] isolation dos : seed-pullover-dumbbell (pop 3, prime) ou concurrent pop 2
- pull[7] : machine-pullover (pop 2)
**Conclusion :** Salle complète — aucune régression. seed-pullover exclu des slots compound, machines isolation présentes, deadlift correctement exclu de pull[0].

---

## P24 — Machine + câble · upper-lower 4j 60min

**Profil :** goal=hypertrophy, days=4, duration=60, equipment=[machine, cable], level=intermediate, splitPreference=upper-lower  
**Split :** `['upper-push','lower-quad','upper-pull','lower-hip']`  
**Slots upper-pull :** adjustedSlotCount(8, 60, 'hypertrophy') = **8 slots**

### Simulation

**Exercices dos disponibles (machine + cable) :**
- Compound : seed-lat-pulldown (back_width, cable, pop 3), machine-lat-pulldown (back_width, machine, pop 2), seed-row-cable (back_thickness, cable, pop 2), seed-row-machine (back_thickness, machine, pop 1)
- Isolation : machine-pullover (back_width, machine, pop 2), machine-low-row (back_thickness, machine, pop 2), seed-pullover-cable (back_thickness, cable, pop 2), seed-straight-arm-pulldown (back_thickness, cable, pop 2)

**hasCompoundBack :** seed-lat-pulldown → vrai

**upper-pull[0]** `['back_width','back_thickness'] compound:true`  
- slotPrimary = 'back_width' → seed-lat-pulldown (cable, pop 3) vs machine-lat-pulldown (machine, pop 2)  
- Tri popularité : **seed-lat-pulldown (pop 3)** sélectionné ✅

**upper-pull[1]** `['back_thickness','back'] compound:true`  
- seed-row-cable (pop 2) ou seed-row-machine (pop 1) → seed-row-cable prime ✅

**upper-pull[5]** `['back_thickness','back'] compound:false isolation`  
- Candidats : machine-low-row (machine, back_thickness, pop 2), seed-pullover-cable (cable, back_thickness, pop 2), seed-straight-arm-pulldown (cable, back_thickness, pop 2)  
- Tous à pop 2 → top 3 → random parmi ces 3 ✅  
- Slot isolation dos rempli ✅

**Assertions vérifiées :**
- upper-pull[0] = seed-lat-pulldown (pop 3 > pop 2) ✅
- Slot isolation dos upper-pull[5] rempli (machine-low-row ou pullover-cable) ✅
- Aucune régression ✅

**Résultat :** PASS  
**Slots clés :**
- upper-pull[0] : seed-lat-pulldown (cable, pop 3)
- upper-pull[5] isolation dos : machine-low-row OU seed-pullover-cable OU seed-straight-arm-pulldown
**Conclusion :** Cable + machine — seed-lat-pulldown prime en upper-pull[0]. Slot isolation dos rempli parmi trois candidats équivalents (pop 2).

---

## P25 — Dumbbell · Arnold 5j 60min intermediate

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[dumbbell], level=intermediate, splitPreference=arnold  
**Split :** `['chest-back','shoulders-arms','legs','chest-back','shoulders-arms']`  
**Slots chest-back :** adjustedSlotCount(8, 60, 'hypertrophy') = **8 slots** (base chest-back = 8)

### Simulation

**Exercices dos disponibles (dumbbell uniquement) :**
- Compound : seed-row-dumbbell (back_thickness, pop 3)
- Isolation : seed-pullover (back_width, pop 1), seed-pullover-dumbbell (back_thickness, pop 3), seed-shrug (back, pop 2)

**hasCompoundBack :** seed-row-dumbbell → vrai  
**hasPullInSplit :** 'chest-back' ∈ backSessionTypes → vrai → condition BUG-BW-PULL = false (hasCompoundBack=true)

**chest-back[1]** `['back_width','back_thickness'] compound:true`  
- Candidats compound dumbbell dos : seed-row-dumbbell (back_thickness, pop 3) seulement  
- seed-pullover : isolation → **filtré par `compound:true`** ✅  
- **seed-row-dumbbell sélectionné** ✅

**chest-back[3]** `['back_thickness','back'] compound:true`  
- seed-row-dumbbell déjà dans usedInWorkout → filtré  
- Aucun autre compound dos dumbbell → slot vide (warning émis) ⚠️ (comportement attendu, aucun bug)

**chest-back[5]** `['back_thickness','back_width','back'] compound:false isolation`  
- Candidats isolation dumbbell dos : seed-pullover-dumbbell (back_thickness, pop 3), seed-shrug (back, pop 2), seed-pullover (back_width, pop 1)  
- Tri slotPrimary='back_thickness' → seed-pullover-dumbbell (rank 0, pop 3) prime  
- seed-pullover (back_width) → rank 1 sur slotPrimary → position 3 (après seed-pullover-dumbbell et seed-shrug)  
- Top 3 pool : seed-pullover-dumbbell, seed-shrug, seed-pullover → random parmi ces 3

**Réserve :** Le prompt d'audit indique "seed-pullover sélectionné en chest-back[5]" mais seed-pullover-dumbbell (back_thickness, pop 3) prime sur seed-pullover (back_width, pop 1) grâce au critère slotPrimary. seed-pullover est bien dans le pool (top 3) mais n'est pas garantissément sélectionné.

**Assertions vérifiées :**
- seed-pullover exclu du slot compound [1] ✅
- seed-pullover bien présent en slot isolation (dans le pool top 3) ✅
- seed-row-dumbbell en chest-back[1] ✅

**Résultat :** RÉSERVE  
**Slots clés :**
- chest-back[1] : seed-row-dumbbell (seul compound dos dumbbell)
- chest-back[5] isolation dos : seed-pullover-dumbbell (pop 3, prime) — seed-pullover dans le pool mais non garanti
**Conclusion :** seed-pullover correctement exclu des slots compound et présent dans le pool isolation. Réserve : le prompt surestimait la probabilité de sélection de seed-pullover (back_width, pop 1) face à seed-pullover-dumbbell (back_thickness, pop 3) qui prime sur slotPrimary.

---

## P26 — Barbell · PPL 60min strength

**Profil :** goal=strength, days=3, duration=60, equipment=[barbell], level=intermediate  
**Split :** PPL → `['push','pull','legs']`  
**Slots pull :** adjustedSlotCount(8, 60, 'strength') = max(4, floor(8×0.5)) = **4 slots**

### Simulation

**Exercices dos disponibles (barbell uniquement) :**
- Compound : seed-row-barbell (back_thickness, pop 7), seed-row-tbar (back_thickness, pop 2), seed-deadlift (back, pop 3)
- Isolation dos barbell : aucune (seed-shrug = dumbbell, non dispo)

**hasCompoundBack :** seed-row-barbell → vrai

**pull[0]** `['back_width','back_thickness'] compound:true`  
- Candidats : seed-row-barbell (back_thickness, pop 7), seed-row-tbar (back_thickness, pop 2)  
- seed-deadlift : primaryMuscle='back' ∉ ['back_width','back_thickness'] → **exclu** ✅  
- seed-pullover : dumbbell non dispo → **filtré** ✅  
- slotPrimary='back_width' → tous rank 1 (back_thickness) → strengthEquipmentPrio (tous barbell = 0) → popularité  
- **seed-row-barbell (pop 7) sélectionné** ✅

**pull[1]** `['back_thickness','back'] compound:true`  
- seed-row-barbell dans usedInWorkout → seed-row-tbar (pop 2) prime, puis seed-deadlift  
- **seed-row-tbar sélectionné**

**pull[2]** `['back_thickness','back_width','back'] compound:false`  
- Candidats barbell dos non utilisés : seed-deadlift (back, pop 3) — aucune isolation barbell dos  
- Pas d'isolation → fallback candidats compound → seed-deadlift (seul dispo)  
- **seed-deadlift sélectionné** (slot isolation dos comblé par un compound faute d'isolation barbell)

**pull[3]** `['biceps'] compound:false`  
- seed-curl-barbell (pop 3) ou seed-curl-preacher (pop 2) ✅

**Assertions vérifiées :**
- seed-row-barbell en pull[0] (strength + barbell, pop 7) ✅
- Deadlift exclu de pull[0] (primaryMuscle='back' ∉ slot.muscles) ✅
- seed-pullover filtré (dumbbell non dispo) ✅

**Résultat :** PASS  
**Slots clés :**
- pull[0] : seed-row-barbell (pop 7, strength barbell prime)
- pull[2] isolation dos : seed-deadlift (fallback compound, aucune isolation barbell dos disponible)
**Conclusion :** Barbell seul, force — seed-row-barbell prime en pull[0]. Deadlift exclu de pull[0]. seed-pullover absent (dumbbell non dispo). Le slot isolation dos est comblé par seed-deadlift faute d'isolation barbell, ce qui est un comportement normal (fallback).

---

## P27 — Kettlebell · PPL 60min intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[kettlebell], level=intermediate  
**Split :** PPL → `['push','pull','legs']`  
**Slots pull :** adjustedSlotCount(8, 60, 'hypertrophy') = **8 slots**

### Simulation

**Exercices dos disponibles (kettlebell uniquement) :**
- Compound : kb-row (back_thickness, pop 2), kb-deadlift (back, pop 2)
- Isolation : kb-pullover (back_width, pop 1)

**hasCompoundBack :** kb-row (back_thickness, compound) → vrai ✅  
**hasPullInSplit :** 'pull' ∈ rawSplit → vrai  
**Condition BUG-BW-PULL :** !hasCompoundBack && hasPullInSplit = false → **pas de remplacement** ✅  
**SEED-BW-NOBACK :** absent (hasPullInSplit=true) ✅

**pull[0]** `['back_width','back_thickness'] compound:true`  
- seed-pullup : pullup_bar non dispo → filtré  
- kb-pullover : isolation → filtré  
- kb-deadlift : primaryMuscle='back' ∉ ['back_width','back_thickness'] → exclu  
- kb-row (back_thickness, pop 2) → **seul candidat** → **sélectionné** ✅

**pull[1]** `['back_thickness','back'] compound:true`  
- kb-row dans usedInWorkout → kb-deadlift (back, pop 2) → **sélectionné**

**pull[2]** `['back_thickness','back_width','back'] compound:false isolation`  
- kb-pullover (back_width, isolation, pop 1) → seul candidat isolation dos KB  
- **kb-pullover sélectionné** ✅

**pull[3-7]** : biceps (kb-curl pop 1), shoulders_rear (aucun KB → slot vide), forearms (aucun KB → slot vide), biceps (kb-curl déjà utilisé → slot vide), back_width isolation (kb-pullover dans usedGlobally → slot vide)

**Assertions vérifiées :**
- hasCompoundBack = true (kb-row) → pas de BUG-BW-PULL ✅
- kb-row en pull[0] (seul compound dos KB dispo) ✅
- kb-pullover en slot isolation dos ✅

**Résultat :** PASS  
**Slots clés :**
- pull[0] : kb-row (seul compound back_thickness kettlebell)
- pull[2] isolation dos : kb-pullover (seul isolation dos KB)
**Conclusion :** Kettlebell seul — hasCompoundBack=true via kb-row, pas de BUG-BW-PULL. kb-row en pull[0], kb-pullover en slot isolation. Certains slots restent vides (shoulders_rear, forearms : aucun exercice KB pour ces muscles).

---

## P28 — Machine · glutes-focus 3j

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine], splitPreference=glutes-focus  
**Split :** `['glutes-hip','quad-glutes','glutes-hip']`  
**Slots glutes-hip :** SLOTS['glutes-hip'].length = **8 slots** (note : le tableau du prompt indiquait 6, mais le code définit bien 8 entrées pour glutes-hip)

### Simulation

**Exercices dos disponibles (machine uniquement) :**
- Compound : machine-lat-pulldown (back_width, pop 2), seed-row-machine (back_thickness, pop 1)
- Isolation : machine-pullover (back_width, pop 2), machine-low-row (back_thickness, pop 2)

**hasCompoundBack :** machine-lat-pulldown → vrai  
**hasPullInSplit :** rawSplit = ['glutes-hip','quad-glutes','glutes-hip'] → aucun ∈ ['pull','back-bi','chest-back'] → **faux**  
**isGlutesSplit :** rawSplit.every(t => t==='glutes-hip' || t==='quad-glutes') = **vrai**  
**SEED-BW-NOBACK :** !hasCompoundBack && !hasPullInSplit && splitPreference !== 'glutes-focus' && !isGlutesSplit = false (hasCompoundBack=true, splitPreference='glutes-focus') → **absent** ✅

**Slots glutes-hip (structure réelle du code) :**
```
[0] glutes,hamstrings compound:true   → Hip thrust machine (pop 3)
[1] hamstrings,glutes compound:true   → Leg curl machine
[2] quads,glutes compound:true        → Leg press / hack squat
[3] back_width,back_thickness compound:true  → machine-lat-pulldown (posture)
[4] glutes compound:false             → Machine abducteurs
[5] hamstrings compound:false         → Leg curl
[6] glutes compound:false             → 2e fessiers
[7] back_thickness,back compound:false → Isolation dos
```

**glutes-hip[3]** `['back_width','back_thickness'] compound:true`  
- machine-lat-pulldown (back_width, pop 2) — slotPrimary='back_width' → prime  
- **machine-lat-pulldown sélectionné** ✅  
- machine-pullover : isolation → **filtré par compound:true** — ne peut pas apparaître ici

**glutes-hip[7]** `['back_thickness','back'] compound:false isolation`  
- slotPrimary = 'back_thickness'  
- Candidats isolation machine : machine-low-row (back_thickness, pop 2)  
- machine-pullover : primaryMuscle='back_width' ∉ ['back_thickness','back'] → **non candidat pour ce slot**  
- **machine-low-row sélectionné** ✅

**RÉSERVE — Erreur dans le prompt d'audit P28 :**  
Le prompt indique : "Slot glutes-hip[3] `['back_width','back_thickness','back'] compound:false` → machine-pullover".  
C'est incorrect sur deux points :
1. Dans le code, glutes-hip[3] est `compound: true`, pas `compound: false`
2. Les muscles sont `['back_width','back_thickness']` sans 'back'
3. machine-pullover (isolation) est donc **exclu** de ce slot (compound:true)  
En réalité, machine-pullover n'apparaît dans **aucun slot de glutes-hip** : le seul slot isolation dos (glutes-hip[7]) a slotPrimary='back_thickness', et machine-pullover (back_width) y est hors-scope.

**Assertions vérifiées :**
- hasCompoundBack = true ✅
- SEED-BW-NOBACK absent (splitPreference='glutes-focus', isGlutesSplit=true) ✅
- glutes-hip[3] composé dos rempli (machine-lat-pulldown) ✅
- glutes-hip[7] isolation dos rempli (machine-low-row) ✅

**Résultat :** RÉSERVE  
**Slots clés :**
- glutes-hip[3] compound dos : machine-lat-pulldown (pop 2)
- glutes-hip[7] isolation dos : machine-low-row (pop 2)
**Conclusion :** Mécanismes SEED-BW-NOBACK et BUG-BW-PULL corrects. Mais l'assertion du prompt sur machine-pullover en slot glutes-hip[3] compound:false est erronée — ce slot est compound:true dans le code. machine-pullover (isolation) est exclu par définition. machine-low-row remplit correctement l'isolation dos à [7].

---

## P29 — Machine · focus back 3j

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine], focusMuscles=['back']  
**workoutTypeFromFocus(['back']) → 'pull'**  
**Split :** pull 3j → `['pull','upper-pull','pull']`  
**Slots pull :** adjustedSlotCount(8, 60, 'hypertrophy') = **8 slots**

### Simulation

**focusedMuscles :** FOCUS_TO_MUSCLES['back'] = ['back','back_width','back_thickness'] → Set

**Exercices dos disponibles (machine uniquement) :**
- Compound : machine-lat-pulldown (back_width, pop 2), seed-row-machine (back_thickness, pop 1)
- Isolation : machine-pullover (back_width, pop 2), machine-low-row (back_thickness, pop 2)

**hasCompoundBack :** machine-lat-pulldown → vrai  
**hasPullInSplit :** 'pull' ∈ rawSplit → vrai → BUG-BW-PULL = false (hasCompoundBack=true)

**Réordonnancement slots pull par focus 'back' :**  
Composés avec muscles ∩ focusedMuscles : [0] back_width/back_thickness ✅, [1] back_thickness/back ✅  
Isolations avec muscles ∩ focusedMuscles : [2] back_thickness/back_width/back ✅, [7] back_width/back ✅  
Isolations non-focusées : [3] biceps, [4] shoulders_rear, [5] forearms, [6] biceps  
Ordre effectif : [0],[1] | [2],[7] | [3],[4],[5],[6]

**pull[0]** `['back_width','back_thickness'] compound:true`  
- machine-lat-pulldown (back_width, pop 2) → slotPrimary='back_width' → prime  
- **machine-lat-pulldown sélectionné** ✅

**pull[1]** `['back_thickness','back'] compound:true`  
- seed-row-machine (back_thickness, pop 1) → seul compound back_thickness machine non utilisé  
- **seed-row-machine sélectionné** ✅

**pull[2]** `['back_thickness','back_width','back'] compound:false isolation`  
- slotPrimary = 'back_thickness'  
- Candidats isolation machine : machine-low-row (back_thickness, pop 2), machine-pullover (back_width, pop 2)  
- machine-low-row rank 0 (slotPrimary match) → prime  
- **machine-low-row sélectionné** ✅

**pull[7]** `['back_width','back'] compound:false isolation`  
- slotPrimary = 'back_width'  
- Candidats : machine-pullover (back_width, pop 2) si non encore utilisé  
- **machine-pullover sélectionné** ✅

**Assertions vérifiées :**
- pull[2] isolation dos = machine-low-row ✅
- pull[7] isolation dos = machine-pullover ✅
- Aucun slot compound vide ✅

**Résultat :** PASS  
**Slots clés :**
- pull[0] : machine-lat-pulldown
- pull[1] : seed-row-machine
- pull[2] isolation dos : machine-low-row (back_thickness prime)
- pull[7] isolation dos : machine-pullover (back_width)
**Conclusion :** Focus back machine — tous les slots dos remplis. machine-low-row et machine-pullover apparaissent bien en slots isolation. Aucun slot compound vide.

---

## P30 — BW · Arnold 5j avancé

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[bodyweight], level=advanced, splitPreference=arnold  
**Raw split arnold 5j :** `['chest-back','shoulders-arms','legs','chest-back','shoulders-arms']`

### Simulation

**Exercices dos disponibles (bodyweight uniquement) :**
- Compound : aucun avec primaryMuscle ∈ ['back_width','back_thickness','back'] (seed-good-morning-bw est isWarmupExercise=true → exclu des available ; bw-inverted-row = pullup_bar, non dispo)
- Isolation : aucune non plus

**hasCompoundBack :** false (aucun compound dos BW)  
**hasPullInSplit :** backSessionTypes = ['pull','back-bi','chest-back']. 'chest-back' ∈ rawSplit → **vrai**  
**Condition BUG-BW-PULL :** !hasCompoundBack && hasPullInSplit = true → **déclenché** ✅

**Remplacement :**  
- 'chest-back' → 'push' (règle : `if (t === 'chest-back') return 'push'`) ✅  
- Split résultant : `['push','shoulders-arms','legs','push','shoulders-arms']` ✅  
- Warning BUG-BW-PULL émis ✅

**isGlutesSplit :** rawSplit = ['chest-back','shoulders-arms','legs','chest-back','shoulders-arms'] → pas tout-glutes → **faux** ✅  
**SEED-BW-NOBACK :** !hasCompoundBack && !hasPullInSplit && splitPreference !== 'glutes-focus' && !isGlutesSplit  
= true && false && ... = **false** (hasPullInSplit=true → !hasPullInSplit=false) → **absent** ✅

**Assertions vérifiées :**
- BUG-BW-PULL déclenché (chest-back → push) ✅
- Warning émis ✅
- isGlutesSplit = false ✅
- SEED-BW-NOBACK absent (hasPullInSplit=true) ✅
- Régression P54 (chest-back BW) correctement gérée ✅

**Résultat :** PASS  
**Slots clés :**
- Séance 1 : push (BW) — remplace chest-back
- Séance 2 : shoulders-arms (BW)
**Conclusion :** BW + Arnold — BUG-BW-PULL s'étend bien à 'chest-back' (fix P54). SEED-BW-NOBACK absent car hasPullInSplit=true (même si on a remplacé chest-back, la condition est évaluée sur rawSplit). Comportement attendu.

---

## Synthèse GROUPE C

| Profil | Titre | Résultat | Motif |
|--------|-------|----------|-------|
| P23 | Salle complète PPL 60min | **PASS** | seed-pullover exclu compound, isolation dos remplie, deadlift exclu pull[0] |
| P24 | Machine+câble upper-lower | **PASS** | seed-lat-pulldown prime pull[0], isolation machine-low-row OU pullover-cable |
| P25 | Dumbbell Arnold 5j | **RÉSERVE** | seed-pullover exclu compound ✅, mais seed-pullover-dumbbell (pop 3) prime en isolation sur seed-pullover (pop 1) — le prompt indiquait seed-pullover directement, ce n'est pas garanti |
| P26 | Barbell PPL force | **PASS** | seed-row-barbell prime, deadlift exclu pull[0], seed-pullover filtré (dumbbell absent) |
| P27 | Kettlebell PPL | **PASS** | kb-row en pull[0], hasCompoundBack=true, pas de BUG-BW-PULL |
| P28 | Machine glutes-focus | **RÉSERVE** | Mécanismes SEED-BW-NOBACK/BUG-BW-PULL OK, mais assertion du prompt erronée : machine-pullover n'apparaît PAS dans glutes-hip (glutes-hip[3] est compound:true, machine-pullover=isolation exclu ; glutes-hip[7] = machine-low-row) |
| P29 | Machine focus back | **PASS** | machine-lat-pulldown, seed-row-machine, machine-low-row, machine-pullover tous présents dans bons slots |
| P30 | BW Arnold 5j | **PASS** | BUG-BW-PULL chest-back→push, SEED-BW-NOBACK absent, warning émis |

**Score :** 6 PASS / 0 FAIL / 2 RÉSERVE

---

## Observations transversales

### Réserve P25 — seed-pullover vs seed-pullover-dumbbell
Le slot `['back_thickness','back_width','back'] compound:false` utilise slotPrimary='back_thickness'. seed-pullover-dumbbell (back_thickness, pop 3) prime systématiquement sur seed-pullover (back_width, pop 1) grâce à ce critère. seed-pullover n'est sélectionné que si seed-pullover-dumbbell est déjà dans usedInWorkout (séance B du programme) ou si le niveau est beginner (top-1 fixe). Ce comportement est correct fonctionnellement (seed-pullover est bien en isolation, pas en compound), mais le prompt d'audit surestimait sa probabilité de sélection.

### Réserve P28 — Erreur de slot dans le prompt
Le prompt affirme que glutes-hip[3] est `['back_width','back_thickness','back'] compound:false` et que machine-pullover y serait sélectionné. C'est doublement inexact : le slot [3] de glutes-hip est `compound: true` dans le code (tirage lat pulldown posture), et ses muscles sont `['back_width','back_thickness']` sans 'back'. machine-pullover (isolation) est filtré. L'unique slot isolation dos de glutes-hip est [7] `['back_thickness','back']`, comblé par machine-low-row. machine-pullover n'apparaît dans aucun slot de glutes-hip.

**Ce bug dans le prompt n'est pas un bug du générateur** — le générateur se comporte correctement. C'est une erreur de description dans l'assertion P28.

### Discordance base de slots (prompt vs code)
Le tableau du prompt indique base=6 pour glutes-hip et quad-glutes, mais le code source montre 8 entrées dans SLOTS['glutes-hip'] et SLOTS['quad-glutes']. La base réelle = 8 → adjustedSlotCount(8, 60, 'hypertrophy') = 8 slots, pas 6. Cette discordance n'affecte pas les résultats (les slots supplémentaires sont simplement des isolations additionnelles correctement remplies), mais le tableau de référence du prompt devrait être mis à jour.
