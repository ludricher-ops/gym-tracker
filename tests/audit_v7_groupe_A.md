# Audit v7 — Groupe A (P01-P12) : SEED-MACHINE-LATLIFT

**Date :** 2026-09-07
**Auditeur :** Claude Sonnet 4.6 (claude-code, non-interactive)
**Scope :** Vérification de l'ajout de `machine-lat-pulldown` (back_width, machine, compound, pop 2) et de son impact sur les slots tirage vertical en machine-only.

---

## Rappel des facts clés du seed (vérifiés)

| id | primaryMuscle | equipment | category | popularity |
|----|--------------|-----------|----------|-----------|
| machine-lat-pulldown | back_width | machine | compound | 2 |
| seed-row-machine | back_thickness | machine | compound | 1 |
| seed-lat-pulldown | back_width | cable | compound | 3 |
| seed-pullup | back_width | pullup_bar | compound | 3 |
| seed-pullover | back_width | dumbbell | compound | 1 |

Aucun exercice machine avec `primaryMuscle='back'` n'existe dans le seed (seed-deadlift=barbell, kb-deadlift=kettlebell).

**Règle clé de pickExercise :**
1. Filtre : `slot.muscles.includes(ex.primaryMuscle) && !usedInWorkout.has(ex.id)`
2. Si `slot.compound=true` : filtre `category==='compound'`
3. Tri : focused → **slotPrimary (muscles[0])** → usedGlobally → equipmentPrio (strength) → popularity
4. Pool : beginner=top-1, intermediate=top-3, advanced=top-5

**Important :** slotPrimary a PRIORITÉ sur usedGlobally. Si machine-lat-pulldown est slotPrimary (back_width), il reste classé #1 même après avoir été utilisé globalement.

---

## P01 — Machine seul, PPL 3j

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine], level=intermediate, splitPreference=auto

**Raisonnement :**

- `hasCompoundBack` : machine-lat-pulldown (back_width, compound) → **true**
- `hasPullInSplit` : auto 3j hypertrophy+intermediate → rawSplit=['push','pull','legs'], hasPullInSplit=true
- Pas de remplacement BUG-BW-PULL (hasCompoundBack=true) → split inchangé ['push','pull','legs']

Séance pull :
- pull[0] `['back_width','back_thickness'] compound:true` :
  - machine-lat-pulldown (back_width, compound, pop 2) → slotPrimary=back_width → ranked #1
  - seed-row-machine (back_thickness, compound, pop 1) → ranked #2
  - intermediate → pool top-3 = [machine-lat-pulldown, seed-row-machine] → machine-lat-pulldown priorisé
- pull[1] `['back_thickness','back'] compound:true` :
  - seed-row-machine (back_thickness) → slotPrimary=back_thickness → ranked #1 (machine-lat-pulldown non candidat si usedInWorkout, ou ranked #2 si back_thickness≠back_width)
  - Slot servi ✓
- Résolution SEED-MACHINE-LATLIFT confirmée : plus de slot dos vide en machine seul

**Conclusion :** ✅ PASS — machine-lat-pulldown est candidat priorisé en pull[0] ; le slot dos compound n'est plus vide en machine seul.

---

## P02 — Machine seul, fullbody 3j

**Profil :** goal=fat_loss, days=3, duration=60, equipment=[machine], level=beginner, splitPreference=fullbody

**Raisonnement :**

- splitPreference=fullbody, 3j → split=['fullbody-quad','fullbody-hip','fullbody-quad']
- `hasCompoundBack` = true

Séance fullbody-quad (A) :
- slot[2] `['back_width','back_thickness','back'] compound:true` :
  - machine-lat-pulldown (back_width, compound) → slotPrimary=back_width → ranked #1
  - seed-row-machine (back_thickness) → ranked #2
  - beginner → top-1 → **machine-lat-pulldown sélectionné** ✓ ; usedGlobally.add('machine-lat-pulldown')

Séance fullbody-hip (B) :
- slot[2] même définition :
  - machine-lat-pulldown (back_width) → usedGlobally=true, MAIS slotPrimary=back_width prend la priorité sur usedGlobally dans le tri → ranked #1 malgré usedGlobally
  - beginner → top-1 → **machine-lat-pulldown sélectionné encore** ✓
  - Aucune alternance automatique pour beginner (slotPrimary > usedGlobally)

- Pas de slot dos vide ✓

**Conclusion :** ✅ PASS — les deux séances fullbody ont un exercice dos non vide. Note : machine-lat-pulldown est sélectionné dans les deux séances pour un débutant (slotPrimary domine usedGlobally), pas de rotation avec seed-row-machine automatiquement en niveau beginner.

---

## P03 — Machine seul, split upper-lower 4j

**Profil :** goal=strength, days=4, duration=60, equipment=[machine], level=intermediate, splitPreference=upper-lower

**Raisonnement :**

- splitPreference=upper-lower, 4j → split=['upper-push','lower-quad','upper-pull','lower-hip']
- goal=strength, 60min → adjustedSlotCount = max(4, floor(base×0.5))
  - upper-pull : base=8 → max(4, 4) = **4 slots**

Séance upper-pull (slots 0 à 3) :
- slot[0] `['back_width','back_thickness'] compound:true` :
  - machine-lat-pulldown (back_width, compound) → slotPrimary=back_width → ranked #1
  - seed-row-machine (back_thickness) → ranked #2
  - intermediate → pool=[machine-lat-pulldown, seed-row-machine] → machine-lat-pulldown priorisé ✓
- slot[1] `['back_thickness','back'] compound:true` :
  - seed-row-machine (back_thickness) → slotPrimary=back_thickness → ranked #1 ✓

Séance upper-push :
- slot[1] `['back_width','back_thickness','back'] compound:true` :
  - machine-lat-pulldown ou seed-row-machine candidats → slot non vide ✓

INC-1 non déclenché : strength+4j → upper-lower (INC-1 ne s'applique qu'à 3j) ✓

**Conclusion :** ✅ PASS — upper-pull slot[0] et upper-push slot[1] servis ; machine-lat-pulldown disponible pour le tirage vertical en machine seul.

---

## P04 — Machine seul, back-bi brosplit

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[machine], level=advanced, splitPreference=brosplit

**Raisonnement :**

- splitPreference=brosplit, 5j → split=['chest-tri','back-bi','legs','shoulders-arms','upper']
- goal=hypertrophy, 60min → adjustedSlotCount = base = 8 slots pour back-bi

Séance back-bi :
- slot[0] `['back_width','back_thickness'] compound:true` :
  - machine-lat-pulldown (back_width, compound, pop 2) → slotPrimary=back_width → ranked #1
  - seed-row-machine (back_thickness, compound, pop 1) → ranked #2
  - advanced → pool top-5 = [machine-lat-pulldown, seed-row-machine] → machine-lat-pulldown priorisé ✓
- slot[1] `['back_thickness','back'] compound:true` :
  - machine-lat-pulldown usedInWorkout → exclu
  - seed-row-machine (back_thickness) → slotPrimary=back_thickness → **sélectionné** ✓
- 2 exercices dos distincts (back_width + back_thickness) ✓

**Conclusion :** ✅ PASS — back-bi dispose de 2 exercices dos distincts : machine-lat-pulldown (largeur) en slot[0], seed-row-machine (épaisseur) en slot[1].

---

## P05 — Machine + câble, PPL 3j (régression)

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine, cable], level=intermediate

**Raisonnement :**

- available = exercices machine ET cable
- `hasCompoundBack` = true (machine-lat-pulldown, seed-lat-pulldown, seed-row-machine)
- split=['push','pull','legs'] (auto hypertrophy+intermediate) ✓

Séance pull, slot[0] `['back_width','back_thickness'] compound:true` :
- Candidats back_width : seed-lat-pulldown (cable, pop 3), machine-lat-pulldown (machine, pop 2)
- Candidats back_thickness : seed-row-machine (machine, pop 1) + potentiellement d'autres cable rows
- slotPrimary=back_width → seed-lat-pulldown (pop 3) et machine-lat-pulldown (pop 2) au-dessus de seed-row-machine
- Tri secondaire par popularité : seed-lat-pulldown (pop 3) > machine-lat-pulldown (pop 2)
- intermediate → pool top-3 = [seed-lat-pulldown, machine-lat-pulldown, seed-row-machine]
- seed-lat-pulldown câble plus probable (ranked #1) ✓

Pas de régression : ajout de machine-lat-pulldown n'écrase pas seed-lat-pulldown en machine+cable ✓

**Conclusion :** ✅ PASS — pas de régression en machine+cable ; seed-lat-pulldown (cable, pop 3) reste prioritaire devant machine-lat-pulldown (machine, pop 2) pour le slot tirage vertical.

---

## P06 — Machine seul, upper-pull slot dos, beginner 45 min

**Profil :** goal=fat_loss, days=4, duration=45, equipment=[machine], level=beginner, splitPreference=upper-lower

**Raisonnement :**

- split=['upper-push','lower-quad','upper-pull','lower-hip']
- goal=fat_loss (non strength), duration=45 → adjustedSlotCount = max(4, floor(base×0.75))
  - upper-pull : base=8 → floor(8×0.75)=6 → max(4,6) = **6 slots** ✓

Séance upper-pull, slot[0] `['back_width','back_thickness'] compound:true` :
- machine-lat-pulldown (back_width, compound) → slotPrimary=back_width → ranked #1
- beginner → top-1 → **machine-lat-pulldown sélectionné** ✓

Avant le fix SEED-MACHINE-LATLIFT : aucun exercice machine back_width → slot compound vide → warning émis.
Après le fix : slot servi ✓

**Conclusion :** ✅ PASS — upper-pull slot[0] (auparavant vide en machine seul) est désormais servi par machine-lat-pulldown.

---

## P07 — Machine seul, chest-back Arnold 5j

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[machine], level=advanced, splitPreference=arnold
(6j non supporté → 5j corrigé)

**Raisonnement :**

- splitPreference=arnold, 5j → split=['chest-back','shoulders-arms','legs','chest-back','shoulders-arms']
- goal=hypertrophy, 60min → adjustedSlotCount = base = 9 slots pour chest-back

Séance chest-back :
- slot[1] `['back_width','back_thickness'] compound:true` :
  - machine-lat-pulldown (back_width, compound) → slotPrimary=back_width → ranked #1
  - seed-row-machine (back_thickness) → ranked #2
  - advanced → pool top-5 = [machine-lat-pulldown, seed-row-machine] → machine-lat-pulldown priorisé ✓
  - Slot non vide ✓

Répétition chest-back 2× dans la semaine :
- usedGlobally : machine-lat-pulldown après chest-back A → pour chest-back B, machine-lat-pulldown reste ranked #1 (slotPrimary > usedGlobally), mais advanced avec pool → variété possible

**Conclusion :** ✅ PASS — chest-back slot[1] servi par machine-lat-pulldown en machine seul.

---

## P08 — Machine seul, glutes-focus

**Profil :** goal=fat_loss, days=4, duration=60, equipment=[machine], level=intermediate, splitPreference=glutes-focus

**Raisonnement :**

- splitPreference=glutes-focus, 4j → split=['glutes-hip','quad-glutes','glutes-hip','quad-glutes']
- goal=fat_loss, 60min → adjustedSlotCount = base

Séance glutes-hip :
- slot[3] `['back_width','back_thickness'] compound:true` :
  - machine-lat-pulldown (back_width, compound) → slotPrimary=back_width → ranked #1
  - seed-row-machine (back_thickness) → ranked #2
  - intermediate → pool=[machine-lat-pulldown, seed-row-machine] → machine-lat-pulldown priorisé ✓
  - Slot non vide ✓

SLOTS['glutes-hip'] compte 8 entrées. adjustedSlotCount(8, 60, 'fat_loss')=8. Le slot[3] est bien inclus.

**Conclusion :** ✅ PASS — glutes-hip slot[3] (lat pulldown posture) servi par machine-lat-pulldown en machine seul.

---

## P09 — Machine seul, lower_pull focus jambes+dos

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine], level=intermediate, focusMuscles=['back','legs']

**Raisonnement :**

- workoutTypeFromFocus(['back','legs']) : hasLower=true (legs), hasPull=true (back), hasPush=false → **lower_pull** ✓
- split = ['lower_pull','lower_pull','lower_pull'] (3 séances du même type)
- focusedMuscles = Set{back, back_width, back_thickness, quads, hamstrings, glutes, calves}

Séance lower_pull :
- slot[1] `['back_width','back_thickness'] compound:true` :
  - machine-lat-pulldown (back_width, compound) → focused=true (back_width ∈ focusedMuscles) ET slotPrimary=back_width → ranked #1
  - seed-row-machine (back_thickness, compound) → focused=true également → tie sur focused, slotPrimary départage
  - intermediate → pool=[machine-lat-pulldown, seed-row-machine] → machine-lat-pulldown priorisé ✓

goal=hypertrophy, 60min → adjustedSlotCount(9, 60, 'hypertrophy') = 9 slots. lower_pull a 9 entrées (indices 0-8). Slot[1] bien inclus.

**Conclusion :** ✅ PASS — lower_pull slot[1] (tirage vertical) servi par machine-lat-pulldown en machine seul avec focus dos+jambes.

---

## P10 — Machine seul, 90 min PPL (bonus slots)

**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[machine], level=intermediate

**Raisonnement :**

- split=['push','pull','legs'] (auto hypertrophy+intermediate) ✓
- goal=hypertrophy, 90min → adjustedSlotCount = min(base+2, 8)
  - pull : base=8 → min(8+2,8) = **8 slots** (tous les 8 slots définis)

Slots pull (0-7) :

- slot[0] `['back_width','back_thickness'] compound:true` :
  - machine-lat-pulldown (back_width, compound) → **sélectionné** ; usedInWorkout.add('machine-lat-pulldown') ✓

- slot[7] `['back_width','back'] compound:false` (isolation bonus 90min) :
  - Filtre primaryMuscle ∈ ['back_width','back'] ET equipment=machine :
    - machine-lat-pulldown (back_width) → **usedInWorkout : EXCLU**
    - Aucun exercice machine avec primaryMuscle='back' dans le seed (seed-deadlift=barbell, kb-deadlift=kettlebell, seed-shrug=dumbbell, seed-superman/cat-cow/thoracic-rotation=bodyweight+warmup)
  - **Résultat : AUCUN CANDIDAT → slot[7] vide en machine seul à 90 min**
  - slot.compound=false → pas de warning émis (les warnings ne couvrent que les slots compound)

Le fix SEED-MACHINE-LATLIFT corrige bien slot[0] compound. Le slot[7] isolation à 90min reste vide — c'est une lacune antérieure du seed (absence d'exercice isolation machine pour dos largeur), non introduite par ce fix.

**Conclusion :** ⚠️ RÉSERVE — slot[0] compound servi (correction SEED-MACHINE-LATLIFT validée ✓). Mais slot[7] isolation `['back_width','back']` vide en machine seul à 90min : machine-lat-pulldown est déjà `usedInWorkout`, et aucun autre exercice machine avec `primaryMuscle∈{back_width,back}` n'existe dans le seed. Pas de warning UX émis (isolation). Lacune à corriger dans un futur fix (ajouter un exercice isolation machine dos, ex. straight-arm pushdown machine).

---

## P11 — Machine seul, strength 60min (INC-1)

**Profil :** goal=strength, days=3, duration=60, equipment=[machine], level=intermediate

**Raisonnement :**

- Auto 3j, strength+intermediate → INC-1 déclenché : split=['fullbody-quad','fullbody-hip','fullbody-quad'] ✓
  - Code : `if (goal === 'strength' && level !== 'beginner') return ['fullbody-quad','fullbody-hip','fullbody-quad']`
- goal=strength, 60min → adjustedSlotCount = max(4, floor(base×0.5))
  - fullbody-quad : base=9 → floor(9×0.5)=4 → max(4,4) = **4 slots**
  - fullbody-hip : base=9 → **4 slots**

Slots inclus (indices 0-3) pour fullbody-quad et fullbody-hip :
- slot[0] : quads/glutes compound
- slot[1] : chest/chest_upper compound
- slot[2] `['back_width','back_thickness','back'] compound:true` ← DOS SLOT ✓
- slot[3] : shoulders compound

Slot[2] `['back_width','back_thickness','back'] compound:true` :
- machine-lat-pulldown (back_width) → slotPrimary=back_width → ranked #1
- seed-row-machine (back_thickness) → ranked #2
- intermediate → pool=[machine-lat-pulldown, seed-row-machine] → machine-lat-pulldown priorisé ✓

Trois séances (fullbody-quad A, fullbody-hip, fullbody-quad B) : slot dos servi dans chacune ✓

**Conclusion :** ✅ PASS — INC-1 correctement déclenché (fullbody×3 pour strength 3j intermediate) ; slot[2] dos compound servi par machine-lat-pulldown en machine seul.

---

## P12 — Machine seul, 2j débutant

**Profil :** goal=hypertrophy, days=2, duration=60, equipment=[machine], level=beginner

**Raisonnement :**

- 2j auto → split=['fullbody-quad','fullbody-hip']
- goal=hypertrophy, 60min → adjustedSlotCount = base = 9 slots pour les deux types

Séance fullbody-quad (A) :
- slot[2] `['back_width','back_thickness','back'] compound:true` :
  - machine-lat-pulldown (back_width, compound) → slotPrimary=back_width → ranked #1
  - beginner → top-1 → **machine-lat-pulldown sélectionné** ; usedGlobally.add('machine-lat-pulldown') ✓

Séance fullbody-hip (B) :
- slot[2] même définition :
  - machine-lat-pulldown : usedGlobally=true, **mais slotPrimary=back_width > usedGlobally dans le tri** → ranked #1 malgré usedGlobally
  - beginner → top-1 → **machine-lat-pulldown sélectionné encore**

**Analyse de l'alternance :** L'assertion de l'audit ("machine-lat-pulldown en A → seed-row-machine en B via usedGlobally") est incorrecte. Le tri `pickExercise` place slotPrimary AVANT usedGlobally dans l'ordre de priorité (`if (aP !== bP) return aP - bP` avant le check usedGlobally). Puisque machine-lat-pulldown est back_width = slotPrimary, il reste ranked #1 même usedGlobally. Pour level=beginner (top-1), il est donc sélectionné dans les deux séances. Pas de rotation automatique.

- Correction principale : slot dos n'est plus vide en machine 2j ✓
- Défaut mineur : pas d'alternance naturelle A/B pour beginner sur le slot dos

**Conclusion :** ⚠️ RÉSERVE — slot dos non vide, correction SEED-MACHINE-LATLIFT validée ✓. Mais l'alternance machine-lat-pulldown / seed-row-machine entre séance A et B ne se produit pas automatiquement pour `level=beginner` : slotPrimary prend la priorité sur usedGlobally dans le tri, machine-lat-pulldown est sélectionné dans les deux séances. L'assertion de l'audit sur l'alternance usedGlobally est inexacte pour ce niveau. Comportement cohérent avec la logique du code (beginner = mouvement canonique systématique).

---

## Tableau récapitulatif

| Profil | Description | Résultat |
|--------|-------------|----------|
| P01 | Machine PPL 3j, intermediate | ✅ PASS |
| P02 | Machine fullbody 3j, beginner | ✅ PASS |
| P03 | Machine upper-lower 4j, strength | ✅ PASS |
| P04 | Machine back-bi brosplit 5j | ✅ PASS |
| P05 | Machine+câble PPL 3j (régression) | ✅ PASS |
| P06 | Machine upper-pull 45min, beginner | ✅ PASS |
| P07 | Machine chest-back Arnold 5j | ✅ PASS |
| P08 | Machine glutes-focus 4j | ✅ PASS |
| P09 | Machine lower_pull focus dos+jambes | ✅ PASS |
| P10 | Machine PPL 90min (bonus slots) | ⚠️ RÉSERVE |
| P11 | Machine strength INC-1 | ✅ PASS |
| P12 | Machine fullbody 2j, beginner | ⚠️ RÉSERVE |

**10 PASS / 2 RÉSERVES / 0 FAIL**

---

## Synthèse des réserves

### RÉSERVE P10 — Slot isolation back 90min vide en machine seul

**Slot concerné :** pull[7] `['back_width','back'] compound:false` (isolation dos, bonus 90min)

**Cause :** machine-lat-pulldown est `usedInWorkout` après pull[0], et aucun autre exercice machine avec `primaryMuscle∈{back_width,back}` n'existe dans le seed. Les exercices `primaryMuscle='back'` disponibles sont barbell (seed-deadlift), kettlebell (kb-deadlift), dumbbell (seed-shrug), ou bodyweight warmup (seed-superman, seed-cat-cow, seed-thoracic-rotation).

**Impact :** silencieux (pas de warning pour les slots isolation). L'exercice est simplement absent de la séance, ce qui est acceptable mais sous-optimal à 90min.

**Fix suggéré :** ajouter un exercice isolation machine dos (ex. `machine-pullover` ou `machine-straight-arm-pulldown`, primaryMuscle=back_width, equipment=machine, category=isolation).

### RÉSERVE P12 — Pas d'alternance A/B pour beginner en machine seul 2j

**Cause :** L'ordre de tri dans `pickExercise` place `slotPrimary` avant `usedGlobally`. machine-lat-pulldown (back_width = slotPrimary du slot dos fullbody) reste ranked #1 même usedGlobally. Pour `level=beginner` (toujours top-1), il est sélectionné dans les deux séances sans alternance.

**Impact :** faible — même exercice dos dans les séances A et B pour beginner machine seul. Comportement voulu pour beginner (mouvement le plus canonique) mais l'assertion de l'audit sur l'alternance via usedGlobally est inexacte.

**Pas de fix requis :** comportement intentionnel du générateur (beginner = top-1 systématiquement). À documenter si besoin.
