# Audit v8 — Groupe A (P01-P20) — SEED-MACHINE-LATLIFT élargi

**Date :** 2026-09-07  
**Auditeur :** Claude Sonnet 4.6 (subagent)  
**Scope :** P01-P20 — profils machine-only ou machine+X  
**Fichiers lus :** `src/utils/programGenerator.ts`, `src/data/exercises-seed.json`, `tests/audit_prompt_v8.md`

---

## Référentiel exercices machine (exhaustif, hors warmup, pop > 0)

| id | primaryMuscle | category | pop |
|----|--------------|----------|-----|
| machine-lat-pulldown | back_width | compound | 2 |
| seed-row-machine | back_thickness | compound | 1 |
| seed-leg-press | quads | compound | 3 |
| seed-hack-squat | quads | compound | 2 |
| seed-chest-press-machine | chest | compound | 3 |
| seed-shoulder-press-machine | shoulders | compound | 3 |
| seed-hip-thrust-machine | glutes | compound | 3 |
| seed-leg-extension | quads | isolation | 3 |
| seed-leg-curl-lying | hamstrings | isolation | 3 |
| seed-leg-curl-seated | hamstrings | isolation | 2 |
| seed-leg-curl-standing | hamstrings | isolation | 2 |
| seed-hip-abduction | glutes | isolation | 2 |
| seed-hip-adduction-machine | hamstrings | isolation | 2 |
| seed-calf-raise-seated | calves | isolation | 2 |
| seed-calf-raise-standing | calves | isolation | 2 |
| seed-pec-deck | chest | isolation | 2 |

**Constat critique :** Aucun exercice machine avec `primaryMuscle ∈ {back_width, back_thickness, back}` et `category=isolation`. Cela entraîne des slots isolation dos systématiquement vides pour les profils machine-only — impact observé sur P06, P07, P13, P14.

---

## Rappel formule adjustedSlotCount

```
duration=20 : strength → min(3, max(2, ⌊base×0.5⌋))  ; autres → max(2, ⌊base×0.5⌋)
duration=45 : strength → min(3, max(2, ⌊base×0.5⌋))  ; autres → max(4, ⌊base×0.75⌋)
duration=60 : strength → max(4, ⌊base×0.5⌋)          ; autres → base
duration=90 : strength → min(base, 5)                 ; autres → min(base+2, 8)
```

Bases de slots : pull=8, fullbody-quad=9, fullbody-hip=9, back-bi=8, chest-back=9, upper=9, upper-pull=8, lower_pull=9 (9 slots, index 0-8)

---

## Rappel ordre de tri dans pickExercise

1. `focused.size > 0` → muscles ciblés (focusedMuscles) d'abord
2. `slotPrimary = slot.muscles[0]` → primaryMuscle === slotPrimary prime (**avant** anti-répétition)
3. `usedGlobally` → exercice non encore utilisé prime
4. `goal=strength && slot.compound` → priorité équipement chargé (barbell > machine/cable > …)
5. `popularity DESC`

**Important :** le critère `slotPrimary` (rang 2) est classé AVANT `usedGlobally` (rang 3). Un exercice avec le bon primaryMuscle sera donc sélectionné même s'il a déjà été utilisé dans une autre séance, si aucun concurrent non-usedGlobally n'a le même slotPrimary.

---

## P01 — Machine seul, PPL 3j hypertrophy intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine], level=intermediate

**Calcul :**
- selectSplit → hypertrophy + intermediate + 3j → PPL → `['push','pull','legs']`
- pull base=8, adjustedSlotCount(8, 60, hypertrophy) = base = **8 slots**
- pull[0] `['back_width','back_thickness']` compound=true :
  - Candidats : machine-lat-pulldown (back_width, pop 2), seed-row-machine (back_thickness, pop 1)
  - slotPrimary=back_width → machine-lat-pulldown aP=0, seed-row-machine aP=1 → machine-lat-pulldown **PREMIER**

**Verdict : ✅ PASS** — machine-lat-pulldown correctement sélectionné en pull[0].

---

## P02 — Machine seul, fullbody 3j fat_loss beginner (splitPreference=fullbody)

**Profil :** goal=fat_loss, days=3, duration=60, equipment=[machine], level=beginner, splitPreference=fullbody

**Calcul :**
- selectSplit → splitPreference=fullbody, days=3 → `['fullbody-quad','fullbody-hip','fullbody-quad']`
- fullbody-quad base=9, adjustedSlotCount(9, 60, fat_loss) = 9 (non-strength 60min = base)
- slot[2] `['back_width','back_thickness','back']` compound=true :
  - machine-lat-pulldown (back_width, aP=0), seed-row-machine (back_thickness, aP=1)
  - beginner → top-1 → machine-lat-pulldown déterministe

**Verdict : ✅ PASS** — machine-lat-pulldown en fullbody[2]. Correct.

---

## P03 — Machine seul, PPL 3j strength intermediate (INC-1 attendu)

**Profil :** goal=strength, days=3, duration=60, equipment=[machine], level=intermediate

**Calcul :**
- selectSplit : strength + intermediate + 3j → branche INC-1 : `['fullbody-quad','fullbody-hip','fullbody-quad']`
  - Code : `if (goal === 'strength' && level !== 'beginner') return ['fullbody-quad','fullbody-hip','fullbody-quad']` ✅
- adjustedSlotCount(9, 60, strength) :
  - isStrength=true, duration=60 → `Math.max(4, Math.floor(9 × 0.5))` = max(4, 4) = **4 slots**
- Slots 0-3 de fullbody-quad :
  - slot[0] `['quads','glutes']` compound : seed-leg-press (quads, pop 3) vs seed-hack-squat (quads, pop 2) → seed-leg-press (slotPrimary=quads, aP=0 pour les deux, pop 3 > 2)
  - slot[1] `['chest','chest_upper']` compound : seed-chest-press-machine (chest, pop 3)
  - slot[2] `['back_width','back_thickness','back']` compound : machine-lat-pulldown (back_width, aP=0) prime sur seed-row-machine (back_thickness, aP=1) ✅
  - slot[3] `['shoulders','shoulders_front']` compound : seed-shoulder-press-machine (shoulders, pop 3)

**Verdict : ✅ PASS** — INC-1 déclenché, 4 slots calculés correctement, machine-lat-pulldown en slot[2].

---

## P04 — Machine seul, strength 3j beginner (fullbody attendu)

**Profil :** goal=strength, days=3, duration=60, equipment=[machine], level=beginner

**Calcul :**
- selectSplit : beginner → branche finale → `['fullbody-quad','fullbody-hip','fullbody-quad']` (indépendamment de INC-1)
- adjustedSlotCount(9, 60, strength) = max(4, floor(4.5)) = **4 slots** (identique à P03)
- slot[2] compound dos : machine-lat-pulldown (slotPrimary=back_width) ✅
- beginner → top-1 (déterministe)

**Verdict : ✅ PASS** — même résultat que P03 pour le split et la sélection dos. Distinct de INC-1 (beginner ne passe jamais par la branche INC-1).

---

## P05 — Machine seul, 20 min hypertrophy intermediate

**Profil :** goal=hypertrophy, days=3, duration=20, equipment=[machine], level=intermediate

**Calcul adjustedSlotCount :**
- isStrength=false, duration=20 → `Math.max(2, Math.floor(8 × 0.5))` = max(2, 4) = **4 slots**
- Détail : ⌊8×0.5⌋ = ⌊4.0⌋ = 4 ; max(2, 4) = 4

**Slots pull 0-3 (après reorderSlotsByFocus, focusedMuscles=∅) :**
- pull[0] `['back_width','back_thickness']` compound : machine-lat-pulldown (aP=0), seed-row-machine (aP=1) → machine-lat-pulldown ✅
- pull[1] `['back_thickness','back']` compound : seed-row-machine (back_thickness, aP=0, pop 1) — seul candidat machine compound non-usedInWorkout ✅
- pull[2] `['back_thickness','back_width','back']` compound=false : aucun exercice machine isolation dos → slot vide (silencieux)
- pull[3] `['biceps']` compound=false : aucun exercice machine biceps → slot vide (silencieux)

**Verdict : ✅ PASS** — formule 4 slots correcte, pull[0] et pull[1] servis. Les slots 2-3 vides sont attendus et silencieux (les warnings ne s'appliquent qu'aux slots compound vides).

---

## P06 — Machine seul, 45 min hypertrophy intermediate

**Profil :** goal=hypertrophy, days=3, duration=45, equipment=[machine], level=intermediate

**Calcul adjustedSlotCount :**
- isStrength=false, duration=45 → `Math.max(4, Math.floor(8 × 0.75))` = max(4, 6) = **6 slots**
- Détail : ⌊8×0.75⌋ = ⌊6.0⌋ = 6 ; max(4, 6) = 6

**Slots pull 0-5 :**
- pull[0] : machine-lat-pulldown ✅
- pull[1] : seed-row-machine ✅
- pull[2] `['back_thickness','back_width','back']` compound=false : machine-lat-pulldown (usedInWorkout) + seed-row-machine (usedInWorkout) → **vide silencieux**
- pull[3] `['biceps']` : aucun machine → **vide silencieux**
- pull[4] `['shoulders_rear']` : aucun machine → **vide silencieux**
- pull[5] `['forearms']` : aucun machine → **vide silencieux**

La séance pull machine-only à 45min ne génère que **2 exercices effectifs** pour 6 slots théoriques. Les slots 2-5 sont vides sans warning émis (comportement conforme : warnings uniquement pour les slots compound vides).

**Verdict : ⚠️ RÉSERVE** — La formule 6 slots est correcte (✅). Mais pour machine-only, 4 slots sur 6 sont vides silencieusement. La séance est structurellement très pauvre : 2 exercices de dos compound uniquement, sans aucune isolation, biceps, épaules arrière ou avant-bras. Aucun mécanisme d'alerte pour l'utilisateur.

---

## P07 — Machine seul, 90 min hypertrophy intermediate

**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[machine], level=intermediate

**Calcul adjustedSlotCount :**
- isStrength=false, duration=90 → `Math.min(base + 2, 8)` = min(8+2, 8) = **8 slots** (cap à 8)
- Détail : base=8 ; base+2=10 ; min(10, 8) = 8

**Slots pull 0-7 :**
- pull[0] : machine-lat-pulldown ✅
- pull[1] : seed-row-machine ✅
- pull[2] `['back_thickness','back_width','back']` compound=false : **vide silencieux**
- pull[3] `['biceps']` : **vide silencieux**
- pull[4] `['shoulders_rear']` : **vide silencieux**
- pull[5] `['forearms']` : **vide silencieux**
- pull[6] `['biceps']` (slot bonus 90min) : **vide silencieux**
- pull[7] `['back_width','back']` compound=false : **vide silencieux**

La séance pull machine-only à 90min ne génère que **2 exercices effectifs** pour 8 slots théoriques. Les 6 slots bonus (90min) sont tous vides car il n'existe aucun exercice machine d'isolation pour dos, biceps, épaules arrière ou avant-bras.

**Verdict : ⚠️ RÉSERVE** — La formule 8 slots est correcte (✅). La situation est pire qu'à 45min : l'utilisateur déclare 90min de séance mais ne génère que 2 exercices (même résultat qu'à 20min). Écart fort entre la durée déclarée et le volume réel généré. Aucun warning émis.

---

## P08 — Machine seul, 20 min strength intermediate (INC-1 + peu de slots)

**Profil :** goal=strength, days=3, duration=20, equipment=[machine], level=intermediate

**Calcul adjustedSlotCount :**
- INC-1 → fullbody-quad, base=9
- isStrength=true, duration=20 → `Math.min(3, Math.max(2, Math.floor(9 × 0.5)))` = min(3, max(2, 4)) = min(3, 4) = **3 slots**
- Détail : ⌊9×0.5⌋ = ⌊4.5⌋ = 4 ; max(2, 4) = 4 ; min(3, 4) = 3

**Slots fullbody-quad 0-2 :**
- slot[0] `['quads','glutes']` compound : seed-leg-press (pop 3) ✅
- slot[1] `['chest','chest_upper']` compound : seed-chest-press-machine (pop 3) ✅
- slot[2] `['back_width','back_thickness','back']` compound : machine-lat-pulldown (slotPrimary=back_width, aP=0) ✅

**Verdict : ✅ PASS** — INC-1 actif, 3 slots calculés correctement, machine-lat-pulldown en slot[2].

---

## P09 — Machine seul, 45 min strength intermediate

**Profil :** goal=strength, days=3, duration=45, equipment=[machine], level=intermediate

**Calcul adjustedSlotCount :**
- INC-1 → fullbody-quad, base=9
- isStrength=true, duration=45 → `Math.min(3, Math.max(2, Math.floor(9 × 0.5)))` = min(3, max(2, 4)) = min(3, 4) = **3 slots**
- Identique à la formule 20min strength : le cap min(3, …) est le facteur déterminant dans les deux cas

**Résultat :** même sélection que P08 (3 slots, machine-lat-pulldown en slot[2]).

**Verdict : ✅ PASS** — La formule 45min strength donne bien 3 slots (identique à 20min strength pour base≥4). L'assertion "même résultat que 20min strength" est confirmée.

---

## P10 — Machine + pullup_bar, PPL 3j hypertrophy intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine, pullup_bar], level=intermediate

**Exercices disponibles pour slot pull[0] `['back_width','back_thickness']` compound :**
- machine-lat-pulldown (back_width, machine, pop 2)
- seed-pullup (back_width, pullup_bar, pop 3)
- bw-inverted-row (back_thickness, pullup_bar, compound, pop 1) — primaryMuscle=back_thickness ∈ liste

**Tri (slotPrimary=back_width) :**
| Exercice | aP | aUsed | pop | Rang |
|---------|----|-------|-----|------|
| seed-pullup | 0 | 0 | 3 | 1er |
| machine-lat-pulldown | 0 | 0 | 2 | 2e |
| bw-inverted-row | 1 | 0 | 1 | 3e |

- seed-pullup et machine-lat-pulldown ont tous deux `slotPrimary=back_width` → aP=0 (tie)
- Sort final par popularité : seed-pullup (pop 3) > machine-lat-pulldown (pop 2) → **seed-pullup PREMIER**
- Intermediate → pool top-3 : [seed-pullup, machine-lat-pulldown, bw-inverted-row] → aléatoire dans ce pool

**Verdict : ✅ PASS** — L'ordre de tri est correct. seed-pullup (pop 3) prime sur machine-lat-pulldown (pop 2) quand slotPrimary est à égalité. L'assertion "seed-pullup probable" est confirmée pour intermediate (tête du pool).

---

## P11 — Machine + câble, upper-lower 4j intermediate (splitPreference=upper-lower)

**Profil :** goal=hypertrophy, days=4, duration=60, equipment=[machine, cable], level=intermediate, splitPreference=upper-lower

**upper-pull[0] `['back_width','back_thickness']` compound :**
- seed-lat-pulldown (back_width, cable, compound, pop 3)
- machine-lat-pulldown (back_width, machine, compound, pop 2)
- seed-row-machine (back_thickness, machine, compound, pop 1) → aP=1 (slotPrimary=back_width)

**Tri :**
| Exercice | aP | pop | Rang |
|---------|----|-----|------|
| seed-lat-pulldown | 0 | 3 | 1er |
| machine-lat-pulldown | 0 | 2 | 2e |
| seed-row-machine | 1 | 1 | 3e |

- seed-lat-pulldown prime (aP=0, pop 3) ✅
- machine-lat-pulldown en 2e position (accessible dans top-3 intermediate) ✅

**Verdict : ✅ PASS** — seed-lat-pulldown (cable, pop 3) correctement priorisé sur machine-lat-pulldown (pop 2). Les deux sont dans le pool top-3 intermediate.

---

## P12 — Machine + dumbbell, PPL 3j hypertrophy intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine, dumbbell], level=intermediate

**pull[0] `['back_width','back_thickness']` compound (slotPrimary=back_width) :**
| Exercice | primaryMuscle | aP | pop | Rang |
|---------|--------------|-----|-----|------|
| machine-lat-pulldown | back_width | 0 | 2 | 1er |
| seed-pullover | back_width | 0 | 1 | 2e |
| seed-row-dumbbell | back_thickness | 1 | 3 | 3e |
| seed-row-machine | back_thickness | 1 | 1 | 4e |

- Les deux `back_width` (aP=0) sont triés entre eux par popularité : machine-lat-pulldown (2) > seed-pullover (1)
- machine-lat-pulldown PREMIER malgré pop inférieure à seed-row-dumbbell (pop 3) — car slotPrimary=back_width prime sur la popularité absolue
- Intermediate top-3 : [machine-lat-pulldown, seed-pullover, seed-row-dumbbell]

**Compétition machine-lat-pulldown vs seed-pullover (back_width, pop 2 vs 1) :**
- Les deux ont aP=0 (slotPrimary=back_width)
- Sort final : machine-lat-pulldown (pop 2) > seed-pullover (pop 1) → machine-lat-pulldown PREMIER ✅
- seed-pullover reste accessible en #2 du pool top-3 ✅

**Verdict : ✅ PASS** — machine-lat-pulldown prime sur seed-pullover par popularité (aP identiques). seed-pullover accessible via pool intermediate. L'ordre de tri est conforme.

---

## P13 — Machine seul, brosplit 5j advanced

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[machine], level=advanced, splitPreference=brosplit

**Split :** `['chest-tri','back-bi','legs','shoulders-arms','upper']`

**Séance back-bi (base=8, adjustedSlotCount=8 pour hypertrophy 60min) :**

| Slot | muscles | compound | Résultat |
|------|---------|----------|---------|
| [0] | back_width, back_thickness | true | machine-lat-pulldown (back_width, aP=0, pop 2) ✅ |
| [1] | back_thickness, back | true | seed-row-machine (back_thickness, aP=0, pop 1) ✅ |
| [2] | biceps | false | aucun machine biceps → **vide silencieux** |
| [3] | back_thickness, back_width, back | false | machine-lat-pulldown (usedInWorkout) + seed-row-machine (usedInWorkout) → **vide silencieux** |
| [4] | biceps | false | **vide silencieux** |
| [5] | back_width | false | **vide silencieux** |
| [6] | shoulders_rear | false | **vide silencieux** |
| [7] | forearms | false | **vide silencieux** |

**6 slots sur 8 vides.** La séance back-bi machine-only ne génère que 2 exercices effectifs pour un brosplit advanced (niveau et objectif censés maximiser le volume).

**Isolation dos (slot[3]) :** aucun exercice machine avec primaryMuscle ∈ {back_thickness, back_width, back} et category=isolation dans le seed → vide silencieux confirmé ⚠️

**Verdict : ⚠️ RÉSERVE** — Slots [0] et [1] servis correctement (✅). Slots [2]-[7] vides silencieusement faute d'exercices machine pour isolation dos, biceps, épaules arrière et avant-bras. La séance back-bi machine-only est quasi-vide pour un brosplit advanced : structurellement insuffisant, aucun warning utilisateur.

---

## P14 — Machine seul, Arnold 5j intermediate (splitPreference=arnold)

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[machine], level=intermediate, splitPreference=arnold

**Split :** `['chest-back','shoulders-arms','legs','chest-back','shoulders-arms']`

**Séance chest-back (base=9, adjustedSlotCount=9 pour hypertrophy 60min) :**

| Slot | muscles | compound | Résultat |
|------|---------|----------|---------|
| [0] | chest, chest_upper | true | seed-chest-press-machine (chest, pop 3) ✅ |
| [1] | back_width, back_thickness | true | machine-lat-pulldown (back_width, aP=0, pop 2) ✅ |
| [2] | shoulders, shoulders_front | true | seed-shoulder-press-machine (shoulders, pop 3) ✅ |
| [3] | back_thickness, back | true | seed-row-machine (back_thickness, aP=0, pop 1) ✅ |
| [4] | chest, chest_lower, chest_upper | false | seed-pec-deck (chest, isolation, pop 2) ✅ |
| [5] | back_thickness, back_width, back | false | machine-lat-pulldown (usedInWorkout) + seed-row-machine (usedInWorkout) → **vide silencieux ⚠️** |
| [6] | biceps | false | aucun machine biceps → **vide silencieux** |
| [7] | triceps | false | aucun machine triceps → **vide silencieux** |
| [8] | shoulders_rear | false | aucun machine shoulders_rear → **vide silencieux** |

**Note d'indexation :** le prompt cite "chest-back[4] isolation dos vide probable" — c'est en réalité le slot[5] qui est le slot isolation dos. Le slot[4] (chest isolation) est servi par seed-pec-deck ✅. La réserve sur le slot isolation dos est confirmée à l'index correct (slot[5]).

**Verdict : ⚠️ RÉSERVE** — Slots dos composés [1] et [3] servis correctement (✅). Slot isolation dos [5] vide silencieusement. L'Arnold machine-only génère 4 composés + 1 isolation poitrine (pec-deck), mais zéro isolation dos, biceps, triceps, épaules arrière. Structure creuse pour un programme Arnold.

---

## P15 — Machine seul, glutes-focus 3j intermediate (splitPreference=glutes-focus)

**Profil :** goal=fat_loss, days=3, duration=60, equipment=[machine], level=intermediate, splitPreference=glutes-focus

**Calcul :**
- split : `['glutes-hip','quad-glutes','glutes-hip']`
- hasCompoundBack : machine-lat-pulldown (back_width, machine, compound) → **true**
- hasPullInSplit : `rawSplit.some(t => t === 'pull')` → glutes-hip ≠ pull → **false**
- Condition SEED-BW-NOBACK : `!hasCompoundBack && !hasPullInSplit && splitPreference !== 'glutes-focus'`
  → `false && true && false` → **NON émis**
  - Double protection : hasCompoundBack=true suffisait déjà à bloquer le warning ; la condition `splitPreference !== 'glutes-focus'` est une protection redondante ici.

**glutes-hip[3] `['back_width','back_thickness']` compound :**
- machine-lat-pulldown (back_width, aP=0) prime sur seed-row-machine (back_thickness, aP=1) ✅

**Verdict : ✅ PASS** — machine-lat-pulldown correctement servi en glutes-hip[3]. SEED-BW-NOBACK non émis (hasCompoundBack=true est déterminant ; l'exception glutes-focus est redondante mais non nuisible).

---

## P16 — Machine seul, focusMuscles=['back'] 3j intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine], level=intermediate, focusMuscles=['back']

**Calcul :**
- workoutTypeFromFocus(['back']) : hasPull=true, !hasLower, !hasPush → retourne 'pull'
- split focusMuscles pull, 3j : `['pull','upper-pull','pull']`
- pull[0] : machine-lat-pulldown ✅

**upper-pull[0] (séance 2) `['back_width','back_thickness']` compound :**
- usedGlobally après séance pull[1] : machine-lat-pulldown (usedGlobally=1), seed-row-machine (usedGlobally=1)
- Sort : slotPrimary=back_width → machine-lat-pulldown (aP=0) AVANT seed-row-machine (aP=1)
- Le critère slotPrimary (rang 2) prenant précédence sur usedGlobally (rang 3), machine-lat-pulldown est sélectionné même si usedGlobally=1
- → machine-lat-pulldown sélectionné à nouveau (répétition inter-séances attendue pour machine-only)

**Verdict : ✅ PASS** — Le tri confirme que slotPrimary prime sur anti-répétition globale. machine-lat-pulldown est sélectionné dans chaque séance pull pour un utilisateur machine-only avec focusMuscles=['back'].

---

## P17 — Machine seul, focusMuscles=['back','legs'] 3j intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine], level=intermediate, focusMuscles=['back','legs']

**Calcul :**
- workoutTypeFromFocus(['back','legs']) : hasPull=true, hasLower=true, !hasPush → branche `lower_pull`
- split : `['lower_pull','lower_pull','lower_pull']`
- lower_pull[1] `['back_width','back_thickness']` compound (slotPrimary=back_width) :
  - machine-lat-pulldown (back_width, aP=0) ✅
  - seed-row-machine (back_thickness, aP=1)

**Verdict : ✅ PASS** — machine-lat-pulldown correctement positionné en lower_pull[1].

---

## P18 — Machine seul, fat_loss 2j beginner

**Profil :** goal=fat_loss, days=2, duration=60, equipment=[machine], level=beginner

**Calcul :**
- selectSplit : days=2 → `['fullbody-quad','fullbody-hip']` (branche case 2 par défaut)
- fullbody-quad[2] compound dos : machine-lat-pulldown ✅
- fullbody-hip[2] `['back_width','back_thickness','back']` compound :
  - usedGlobally après séance 1 : machine-lat-pulldown (usedGlobally=1)
  - slotPrimary=back_width → machine-lat-pulldown (aP=0) prime sur seed-row-machine (aP=1), malgré usedGlobally=1
  - beginner → top-1 déterministe → machine-lat-pulldown
- Le même exercice apparaît dans les deux séances (attendu pour machine-only, slotPrimary déterminant)

**Verdict : ✅ PASS** — machine-lat-pulldown servi dans les deux séances fullbody.

---

## P19 — Machine + barbell, PPL 3j hypertrophy intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine, barbell], level=intermediate

**pull[0] `['back_width','back_thickness']` compound (slotPrimary=back_width) :**

| Exercice | primaryMuscle | aP | aUsed | pop | Rang |
|---------|--------------|-----|-------|-----|------|
| machine-lat-pulldown | back_width | **0** | 0 | 2 | 1er |
| seed-pullover | back_width | 0 | 0 | 1 | — (dumbbell, non dispo) |
| seed-row-barbell | back_thickness | 1 | 0 | 7 | 2e |
| seed-row-tbar | back_thickness | 1 | 0 | 2 | 3e |
| seed-row-machine | back_thickness | 1 | 0 | 1 | 4e |
| seed-deadlift | **back** | — | — | — | **EXCLU** (back ∉ ['back_width','back_thickness']) |

machine-lat-pulldown prime sur seed-row-barbell (pop 7) car slotPrimary=back_width (aP=0 vs aP=1). Le critère slotPrimary est déterminant, quelle que soit la popularité.

**pull[1] `['back_thickness','back']` compound (slotPrimary=back_thickness) :**

| Exercice | primaryMuscle | aP | aUsed | pop | Rang |
|---------|--------------|-----|-------|-----|------|
| seed-row-barbell | back_thickness | **0** | 0 | 7 | **1er** |
| seed-row-tbar | back_thickness | 0 | 0 | 2 | 2e |
| seed-deadlift | back | 1 | 0 | 3 | 3e |
| seed-row-machine | back_thickness | 0 | 1 (usedInWorkout) | 1 | après seed-row-tbar |
| machine-lat-pulldown | back_width | 1 | 1 | 2 | dernier |

seed-row-barbell (pop 7, aP=0, aUsed=0) est **PREMIER** ✅. seed-deadlift est présent dans le pool (back ∈ ['back_thickness','back'] ✓) mais classé après les back_thickness.

**Verdict : ✅ PASS** — L'ordre de tri est exact. machine-lat-pulldown prime en slot[0] malgré pop=2 vs pop=7 pour seed-row-barbell (slotPrimary déterminant). seed-row-barbell correctement sélectionné en slot[1] (slotPrimary=back_thickness, pop 7, non-usedInWorkout, non-usedGlobally).

---

## P20 — Machine seul, 5j hypertrophy advanced (splitPreference=auto)

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[machine], level=advanced

**Calcul :**
- selectSplit : goal=hypertrophy (isMass=true), level=advanced (≠beginner), days=5 → `['push','pull','lower-quad','upper','lower-hip']`
  - Code : `if (isMass && level !== 'beginner') return ['push','pull','lower-quad','upper','lower-hip']` ✅
- pull[0] : machine-lat-pulldown ✅
- upper slot[1] `['back_width','back_thickness','back']` compound (séance 4, slotPrimary=back_width) :
  - machine-lat-pulldown usedGlobally=1 (pull séance), seed-row-machine usedGlobally=1
  - slotPrimary=back_width → machine-lat-pulldown (aP=0) prime malgré usedGlobally
  - → machine-lat-pulldown sélectionné à nouveau

**Verdict : ✅ PASS** — Split 5j auto correct pour hypertrophy advanced. machine-lat-pulldown en pull[0] et upper[1] (slotPrimary déterminant même en présence d'usedGlobally).

---

## Tableau récapitulatif Groupe A

| Profil | Description | Verdict |
|--------|-------------|---------|
| P01 | Machine seul, PPL 3j hypertrophy intermediate | ✅ PASS |
| P02 | Machine seul, fullbody 3j fat_loss beginner | ✅ PASS |
| P03 | Machine seul, PPL→fullbody 3j strength intermediate (INC-1) | ✅ PASS |
| P04 | Machine seul, strength 3j beginner (fullbody) | ✅ PASS |
| P05 | Machine seul, 20min hypertrophy — 4 slots | ✅ PASS |
| P06 | Machine seul, 45min hypertrophy — 6 slots, isolation vide | ⚠️ RÉSERVE |
| P07 | Machine seul, 90min hypertrophy — 8 slots, 6 vides | ⚠️ RÉSERVE |
| P08 | Machine seul, 20min strength INC-1 — 3 slots | ✅ PASS |
| P09 | Machine seul, 45min strength INC-1 — 3 slots | ✅ PASS |
| P10 | Machine + pullup_bar, PPL — seed-pullup prime (pop 3>2) | ✅ PASS |
| P11 | Machine + câble, upper-lower — seed-lat-pulldown prime (pop 3>2) | ✅ PASS |
| P12 | Machine + dumbbell, PPL — machine-lat-pulldown prime sur pullover (pop 2>1) | ✅ PASS |
| P13 | Machine seul, brosplit advanced — 6/8 slots vides | ⚠️ RÉSERVE |
| P14 | Machine seul, Arnold — slot isolation dos vide | ⚠️ RÉSERVE |
| P15 | Machine seul, glutes-focus — machine-lat-pulldown slot[3] | ✅ PASS |
| P16 | Machine seul, focus back — slotPrimary prime sur usedGlobally | ✅ PASS |
| P17 | Machine seul, focus back+legs (lower_pull) | ✅ PASS |
| P18 | Machine seul, 2j fat_loss beginner | ✅ PASS |
| P19 | Machine + barbell — slotPrimary vs pop 7, ordre de tri exact | ✅ PASS |
| P20 | Machine seul, 5j advanced auto | ✅ PASS |

**PASS ✅ : 16/20 — RÉSERVE ⚠️ : 4/20 — FAIL ❌ : 0/20**

---

## Synthèse des points critiques

### Formule adjustedSlotCount — vérifiée pour tous les cas P05-P09

| Profil | Type | Base | Duration | Goal | Calcul détaillé | Résultat |
|--------|------|------|----------|------|-----------------|---------|
| P05 | pull | 8 | 20min | hypertrophy | max(2, ⌊8×0.5⌋)=max(2,4) | **4** ✅ |
| P06 | pull | 8 | 45min | hypertrophy | max(4, ⌊8×0.75⌋)=max(4,6) | **6** ✅ |
| P07 | pull | 8 | 90min | hypertrophy | min(8+2, 8)=min(10,8) | **8** ✅ |
| P08 | fullbody-quad | 9 | 20min | strength | min(3, max(2, ⌊9×0.5⌋))=min(3,4) | **3** ✅ |
| P09 | fullbody-quad | 9 | 45min | strength | min(3, max(2, ⌊9×0.5⌋))=min(3,4) | **3** ✅ |

### Compétitions exercices dos (P10, P12, P19) — ordre de tri exact

- **P10** (machine-lat-pulldown pop 2 vs seed-pullup pop 3) : slotPrimary tie sur back_width → popularité décide → seed-pullup premier ✅
- **P12** (machine-lat-pulldown pop 2 vs seed-pullover pop 1) : slotPrimary tie sur back_width → popularité décide → machine-lat-pulldown premier ✅
- **P19** (machine-lat-pulldown pop 2 vs seed-row-barbell pop 7) : slotPrimary différent (back_width vs back_thickness) → slotPrimary prime → machine-lat-pulldown premier malgré pop inférieure ✅

### Slots isolation dos vides (P06, P07, P13, P14)

**Cause racine :** le seed ne contient aucun exercice machine avec `primaryMuscle ∈ {back_width, back_thickness, back}` et `category=isolation`. Pour les utilisateurs machine-only, tous les slots isolation dos sont systématiquement vides et silencieux (aucun warning pour les slots isolation vides — seuls les slots compound vides déclenchent un warning).

**Impact :** Pour un utilisateur machine-only ayant déclaré 45min ou 90min (P06, P07), la séance pull réelle contient seulement 2 exercices. Le brosplit back-bi (P13) et l'Arnold chest-back (P14) présentent le même problème.

**Recommandation :** envisager d'ajouter au seed un ou deux exercices machine d'isolation dos (ex. face pull machine, pull-over machine) pour que les profils machine-only génèrent des séances complètes.

### Propriété slotPrimary vs usedGlobally (P16, P18, P19, P20)

Le critère `slotPrimary` (rang 2 dans le tri) prend PRECEDENCE sur `usedGlobally` (rang 3). Pour les utilisateurs machine-only, cela signifie que machine-lat-pulldown sera systématiquement sélectionné pour chaque slot `back_width`-primary, même si l'exercice a déjà été utilisé dans des séances précédentes. Ce comportement est intentionnel (variété de type de mouvement via slotPrimary, mais pas de variété d'exercice quand une seule option existe).
