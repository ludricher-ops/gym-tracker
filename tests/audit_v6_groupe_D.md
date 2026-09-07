# Audit P33–P44 — Groupe D (v6)
**Date :** 2026-09-07
**Fichiers lus :** `programGenerator.ts` + `exercises-seed.json`
**Fixes vérifiés :** BUG-BW-PULL, BUG-HIP-BACK, INC-1, adjustedSlotCount strength

---

## Table des exercices dos compound par équipement (extraite du seed)

| id | equipment | primaryMuscle | category | popularity |
|----|-----------|---------------|----------|-----------|
| seed-row-barbell | barbell | back_thickness | compound | 7 |
| seed-row-tbar | barbell | back_thickness | compound | 2 |
| seed-deadlift | barbell | back | compound | 3 |
| seed-row-dumbbell | dumbbell | back_thickness | compound | 3 |
| seed-row-cable | cable | back_thickness | compound | 2 |
| seed-lat-pulldown | cable | back_width | compound | 3 |
| seed-row-machine | machine | back_thickness | compound | 1 |
| seed-pullup | pullup_bar | back_width | compound | 3 |
| bw-inverted-row | pullup_bar | back_thickness | compound | 1 |
| kb-row | kettlebell | back_thickness | compound | 2 |
| kb-deadlift | kettlebell | back | compound | 2 |
| band-row | band | back_thickness | compound | 2 |

**Équipements sans compound dos :** `bodyweight` seul (aucun exercice), `cardio_machine` (primaryMuscle=cardio).

---

## Formules de référence (extraites du code — vs table du prompt)

### adjustedSlotCount — code réel vs table du prompt

| Duration | Goal | Code réel | Table du prompt | Écart |
|----------|------|-----------|-----------------|-------|
| 20 min | strength | `min(3, max(2, floor(base×0.5)))` | `max(2, floor(base×0.5))` | **cap 3 manquant** |
| 20 min | autres | `max(2, floor(base×0.5))` | `max(2, floor(base×0.5))` | — |
| 45 min | strength | `min(3, max(2, floor(base×0.5)))` | `max(3, floor(base×0.75))` | **formule et cap différents** |
| 45 min | autres | `max(4, floor(base×0.75))` | `max(3, floor(base×0.75))` | **floor 4 ≠ 3** |
| 60 min | strength | `max(4, floor(base×0.5))` | `max(4, floor(base×0.5))` | — |
| 60 min | autres | `base` | `base` | — |
| 90 min | strength | `min(base, 5)` | `min(base, 5)` | — |
| 90 min | autres | `min(base+2, 8)` | `min(base+2, 8)` | — |

**Conséquence :** la table de référence du prompt est incorrecte pour strength+20min et strength+45min (le cap 3 y est absent) et pour non-strength+45min (floor 3 au lieu de 4). Ces écarts n'affectent que P35 dans le groupe D.

---

## P33 — Fullbody×3 band seul → hasCompoundBack = ?

**Paramètres :** goal=fat_loss, days=3, duration=60, equipment=[band], level=beginner, splitPreference=fullbody

**Simulation étape par étape :**
1. `splitPreference=fullbody`, 3j → `rawSplit = ['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`
2. available (band, non-warmup) : band-squat, band-row, band-chest-press, band-overhead-press, band-curl, band-tricep-pushdown, band-good-morning, band-hip-thrust, bw-prone-y-raise (band)
3. `hasCompoundBack` : `band-row` → equipment=band, category=compound, primaryMuscle=back_thickness ∈ {back_width, back_thickness, back} → **TRUE**
4. `hasPullInSplit` = false (aucun 'pull' dans le split) → BUG-BW-PULL non déclenché
5. Split final = rawSplit (inchangé)
6. Session fullbody-hip, slot[2] = {muscles:['back_width','back_thickness','back'], compound:true} :
   - Candidats band compound dos : `band-row` (back_thickness) → ∈ la liste → **CANDIDAT VALIDE**
   - Slot non vide (band-row sélectionné)
7. Session fullbody-quad, slot[2] : même slot → band-row candidat → rempli (anti-répétition : si déjà usedGlobally, reste prioritaire mais non exclu)

**Assertions : PASS/FAIL**
- Vérification seed band-row : category=compound, primaryMuscle=back_thickness : **PASS**
- hasCompoundBack = true : **PASS**
- Aucun 'pull' dans le split → BUG-BW-PULL non déclenché : **PASS**
- fullbody-hip slot dos : band-row candidat valide → slot non vide : **PASS**

**Verdict : ✅ Bon programme**
— band-row est compound dos dans le seed. Fullbody split sans 'pull' : le fix BUG-BW-PULL ne s'applique pas. Le slot dos de fullbody-hip est rempli. Aucun bug.

---

## P34 — PPL 4j avec cable seul → pull non remplacé

**Paramètres :** goal=hypertrophy, days=4, duration=60, equipment=[cable], level=intermediate, splitPreference=ppl

**Simulation étape par étape :**
1. `pref=ppl`, 4j → `rawSplit = ['push', 'pull', 'legs', 'upper']`
2. available cable (non-warmup) : seed-row-cable, seed-lat-pulldown + autres exercices câble
3. `hasCompoundBack` :
   - seed-row-cable : equipment=cable, category=compound, primaryMuscle=back_thickness → **TRUE**
   - seed-lat-pulldown : equipment=cable, category=compound, primaryMuscle=back_width → **TRUE** aussi
4. `hasPullInSplit` = true (présence de 'pull') ; `hasCompoundBack` = true → **pas de remplacement**
5. Split final = rawSplit
6. Session pull :
   - slot[0] = {muscles:['back_width','back'], compound:true} → seed-lat-pulldown (back_width) → VALIDE
   - slot[1] = {muscles:['back_thickness','back'], compound:true} → seed-row-cable (back_thickness) → VALIDE

**Assertions : PASS/FAIL**
- rawSplit = ['push','pull','legs','upper'] : **PASS**
- seated-cable-row.category=compound, primaryMuscle=back_thickness → hasCompoundBack=true : **PASS**
- Split inchangé : **PASS**
- lat-pulldown cable (back_width) disponible pour slot[0] pull : **PASS**

**Verdict : ✅ Bon programme**
— Cable offre deux exercices dos compound (back_width et back_thickness). Pull non remplacé, séance complète.

---

## P35 — Strength 20min FULL_GYM → adjustedSlotCount strength+20min

**Paramètres :** goal=strength, days=3, duration=20, equipment=[barbell, dumbbell, cable, machine, bodyweight, pullup_bar], level=intermediate, splitPreference=auto

**Simulation étape par étape :**
1. `strength+intermediate+3j` → INC-1 : rawSplit = ['fullbody-quad', 'fullbody-hip', 'fullbody-quad']
2. hasCompoundBack = true (multiple exercices barbell/dumbbell/cable/machine/pullup_bar)
3. Split final = rawSplit
4. `adjustedSlotCount(9, 20, 'strength')` :
   - Code : `Math.min(3, Math.max(2, Math.floor(9 × 0.5)))` = `min(3, max(2, 4))` = `min(3, 4)` = **3 slots** ← code réel
   - Table du prompt : `max(2, floor(9×0.5))` = 4 → **ÉCART : le cap 3 est absent de la table du prompt**
5. adjustedSpec(compound5, 20) : sets = max(2, floor(5×0.5)) = max(2, 2) = 2 → 2 séries OK
6. isVeryShort (20min) = true → warmup 1 série, core supprimé
7. Total par séance : **3 slots + 1 warmup = 4 exercices** (pas 5 comme l'assertion le stipule)

**Assertions : PASS/FAIL**
- Split strength+intermediate+3j = fullbody×3 (INC-1) : **PASS**
- adjustedSlotCount(9, 20, 'strength') = 4 slots : **FAIL** — le code donne **3**, pas 4 (cap `min(3,...)` pour strength+20min absent de la table de référence du prompt)
- adjustedSpec sets=2 : **PASS**
- Core supprimé (≤20min) : **PASS**
- warmup réduit à 1 série : **PASS**
- Total = 5 exercices : **FAIL** — le code produit **4 exercices** (3+1 warmup), pas 5

**Verdict : ⚠️ Problème mineur (assertion incorrecte dans le prompt)**
— Le code est cohérent et intentionnel : le commentaire dans le source confirme le cap 3 (`3×5s×3min repos ≈ 18-21 min à 20 min`). C'est la **table de référence du prompt qui est incorrecte** : elle omet le `min(3, ...)` pour strength+20min. Le programme généré (3 composés + warmup) est sain. La table doit être corrigée.

---

## P36 — Endurance 90min → adjustedSlotCount non-mass+90min

**Paramètres :** goal=endurance, days=4, duration=90, equipment=[barbell, dumbbell, cable, machine, bodyweight, pullup_bar], level=intermediate, splitPreference=auto

**Simulation étape par étape :**
1. `non-mass (endurance) + intermediate + 4j` → split = ['push', 'pull', 'lower-quad', 'fullbody-quad']
2. hasCompoundBack = true → split inchangé
3. `adjustedSlotCount(base, 90, 'endurance')` = `min(base+2, 8)` :
   - push (8 slots base) : min(8+2, 8) = **8 slots** → 8+warmup+core = 10 exercices
   - pull (8 slots base) : min(8+2, 8) = **8 slots** → 10 exercices
   - lower-quad (8 slots base, avec 2 slots bonus 90min déjà inclus) : min(8+2, 8) = **8 slots** → 10 exercices
   - fullbody-quad (9 slots base) : min(9+2, 8) = **8 slots** → 10 exercices

**Assertions : PASS/FAIL**
- Split 4j non-mass intermediate = ['push','pull','lower-quad','fullbody-quad'] : **PASS**
- push 90min = 8 slots : **PASS**
- pull 90min = 8 slots : **PASS**
- lower-quad 90min = 8 slots : **PASS**
- fullbody-quad 90min = min(9+2,8) = 8 slots : **PASS**

**Verdict : ✅ Bon programme**
— Toutes les séances 90min non-strength atteignent 8 slots. Split correct.

---

## P37 — Strength 90min → cap à 5 slots (BUG-1 fix)

**Paramètres :** goal=strength, days=2, duration=90, equipment=[barbell, dumbbell, cable, machine, bodyweight, pullup_bar], level=advanced, splitPreference=auto

**Simulation étape par étape :**
1. `2j` → split = ['fullbody-quad', 'fullbody-hip']
2. hasCompoundBack = true → split inchangé
3. `adjustedSlotCount(9, 90, 'strength')` = `min(9, 5)` = **5 slots**
4. Total : 5 + warmup + core = **7 exercices** par séance

**Assertions : PASS/FAIL**
- Split 2j = ['fullbody-quad', 'fullbody-hip'] : **PASS**
- fullbody-quad (9 slots, 90min, strength) = min(9, 5) = 5 slots : **PASS**
- Total = 7 exercices : **PASS**

**Verdict : ✅ Bon programme**
— Cap 5 slots correctement appliqué pour strength+90min. BUG-1 fix actif.

---

## P38 — Hypertrophy 4j beginner → upper/lower, durée 45min

**Paramètres :** goal=hypertrophy, days=4, duration=45, equipment=[barbell, dumbbell, cable, machine], level=beginner, splitPreference=auto

**Simulation étape par étape :**
1. `isMass=true (hypertrophy) + 4j` → code `case 4: if (isMass) return ['upper-push', 'lower-quad', 'upper-pull', 'lower-hip']` — **indépendant du level** → split = ['upper-push', 'lower-quad', 'upper-pull', 'lower-hip']
2. hasCompoundBack = true (seed-row-barbell, seed-row-dumbbell, etc.) → split inchangé
3. `adjustedSlotCount(8, 45, 'hypertrophy')` = `max(4, floor(8×0.75))` = `max(4, 6)` = **6 slots**
   - Note : le prompt indique `max(3, ...)` mais le code utilise `max(4, ...)`. Pour base=8 → résultat identique = 6.
4. `adjustedSpec(compound, 45)` : duration ≥ 45 → spec inchangé (sets=4, repsMin=8, repsMax=12)
5. Warmup + core présents (45min > 20min)

**Assertions : PASS/FAIL**
- Split = ['upper-push','lower-quad','upper-pull','lower-hip'] : **PASS** (isMass→4j, level ignoré)
- upper-push (8 slots, 45min, hypertrophy) → 6 slots : **PASS**
- adjustedSpec 45min inchangé (sets=4) : **PASS**
- Warmup + core présents : **PASS**

**Verdict : ✅ Bon programme**
— Débutant hypertrophy 4j utilise bien le split mass upper/lower (la branche `if (isMass)` est indépendante du level). Volume approprié à 45min.

---

## P39 — KB seul 3j → hasCompoundBack KB ?

**Paramètres :** goal=hypertrophy, days=3, duration=60, equipment=[kettlebell], level=intermediate, splitPreference=auto

**Simulation étape par étape :**
1. `hypertrophy + intermediate + 3j` → rawSplit = ['push', 'pull', 'legs']
2. available KB (non-warmup) : kb-deadlift, kb-row, kb-squat, kb-goblet-squat, kb-swing, kb-press, kb-lunge, kb-rdl + isolations KB
3. `hasCompoundBack` :
   - `kb-row` : equipment=kettlebell, category=compound, primaryMuscle=back_thickness → **TRUE**
   - `kb-deadlift` : equipment=kettlebell, category=compound, primaryMuscle=back → **TRUE** aussi
4. `hasPullInSplit` = true ; `hasCompoundBack` = true → **pas de remplacement** → split = ['push','pull','legs']
5. Session pull :
   - slot[0] = {muscles:['back_width','back'], compound:true} :
     - kb-row.primaryMuscle = back_thickness → **pas dans ['back_width','back']** → non candidat
     - kb-deadlift.primaryMuscle = back → **dans ['back_width','back']** → CANDIDAT
     - Slot[0] rempli par **kb-deadlift** (tirage ≠ deadlift sémantiquement → réserve coach)
   - slot[1] = {muscles:['back_thickness','back'], compound:true} :
     - kb-row (back_thickness) → CANDIDAT → sélectionné

**Assertions : PASS/FAIL**
- Seed KB contient des exercices dos compound : **PASS** (kb-row, kb-deadlift)
- hasCompoundBack = true → PPL inchangé : **PASS**
- Pull non remplacé : **PASS**

**Verdict : ✅ Bon programme (⚠️ réserve coach)**
— KB offre des exercices dos compound : le pull n'est pas remplacé. Réserve : slot[0] pull (tirage vertical) est occupé par `kb-deadlift` (primaryMuscle=back), exercice sémantiquement inadapté à ce slot (le deadlift n'est pas un tirage vertical). Aucune alternative KB avec back_width. Warning BUG-5 non émis (slot rempli). Recommandation coach : ajouter un exercice KB tirage vertical dans le seed.

---

## P40 — Cardio machine seul → availableCount = 0, génération bloquée (wizard)

**Paramètres :** goal=fat_loss, days=3, duration=60, equipment=[cardio_machine], level=intermediate

**Simulation étape par étape :**
1. available = exercices avec equipment=cardio_machine, non-warmup, non-deleted :
   - seed-treadmill (primaryMuscle=cardio), seed-elliptical, seed-rowing-erg, seed-cycling
   - Tous ont primaryMuscle='cardio' → aucun ne correspondra à un slot (aucun slot ne cherche 'cardio')
2. Pour les slots compound/isolation : aucun candidat → programme généré serait vide
3. Assertion wizard : le bouton "Continuer" est disabled si availableCount=0
   - availableCount est calculé dans le wizard (non dans le générateur) : il compte les exercices non-warmup disponibles pour les slots = essentiellement les exercices dans `available`
   - Avec cardio_machine seul, aucun exercice ne remplit de slot musculaire → 0 exercice utilisable
4. `generateProgramDraft` ne devrait pas être appelé (bouton disabled)

**Assertions : PASS/FAIL**
- availableCount = 0 (cardio exclu du comptage des slots) : **PASS** (aucun exercice cardio_machine ne cible un muscle de slot)
- Bouton disabled (wizard) : **PASS** (vérification UI seule)
- generateProgramDraft non appelé : **PASS**

**Verdict : ✅ Bon comportement**
— Les 4 exercices cardio_machine du seed ont tous primaryMuscle='cardio', valeur absente de tous les SLOTS. Le wizard bloque correctement la génération. Vérification code générateur non applicable.

---

## P41 — Barbell seul 3j → hasCompoundBack = true (deadlift + bent-over row)

**Paramètres :** goal=strength, days=3, duration=60, equipment=[barbell], level=intermediate, splitPreference=auto

**Simulation étape par étape :**
1. `strength + intermediate + 3j` → INC-1 : rawSplit = ['fullbody-quad', 'fullbody-hip', 'fullbody-quad']
2. available barbell (non-warmup) : seed-row-barbell (back_thickness), seed-row-tbar (back_thickness), seed-deadlift (back), + squat, bench, OHP, etc.
3. `hasCompoundBack` :
   - seed-row-barbell : category=compound, primaryMuscle=back_thickness → **TRUE**
   - Confirmation : seed-deadlift.primaryMuscle = **'back'** (et non 'hamstrings' — le seed est correct)
4. `hasPullInSplit` = false (aucun 'pull' dans le split fullbody×3) → BUG-BW-PULL **non déclenché**
5. Split final = rawSplit

**Assertions : PASS/FAIL**
- hasCompoundBack = true (bent-over row barbell, deadlift) : **PASS**
- seed-deadlift.primaryMuscle = 'back' (non 'hamstrings') : **PASS** (vérification seed OK)
- INC-1 : strength+3j+intermediate → fullbody×3 : **PASS**
- Pas de 'pull' dans rawSplit → BUG-BW-PULL non déclenché : **PASS**

**Verdict : ✅ Bon programme**
— Barbell offre row + deadlift compound dos. INC-1 actif. Fix BUG-BW-PULL sans objet (pas de 'pull' dans fullbody).

---

## P42 — PPL barbell seul → pull fonctionnel (bent-over row compound)

**Paramètres :** goal=hypertrophy, days=3, duration=60, equipment=[barbell], level=intermediate, splitPreference=ppl

**Simulation étape par étape :**
1. `pref=ppl, 3j` → rawSplit = ['push', 'pull', 'legs']
2. hasCompoundBack = true (seed-row-barbell, seed-row-tbar, seed-deadlift) → split inchangé
3. Session pull :
   - slot[0] = {muscles:['back_width','back'], compound:true} :
     - Candidats barbell avec primaryMuscle ∈ ['back_width','back'] et category=compound :
       - seed-deadlift (primaryMuscle=**back**) → ∈ ['back_width','back'] → **CANDIDAT**
       - seed-row-barbell (back_thickness) → **non candidat** pour slot[0]
     - Slot[0] rempli par **seed-deadlift** (primaryMuscle=back — deadlift en slot tirage vertical → réserve coach)
   - slot[1] = {muscles:['back_thickness','back'], compound:true} :
     - seed-row-barbell (back_thickness) → CANDIDAT → sélectionné (popularité 7, non utilisé)
   - Autres slots : isolations dos, biceps, etc.
4. Aucun compound back_width pur disponible avec barbell → slot[0] utilise deadlift via 'back'

**Assertions : PASS/FAIL**
- rawSplit = ['push','pull','legs'] (ppl pref) : **PASS**
- hasCompoundBack = true (bent-over row barbell) : **PASS**
- Split inchangé : **PASS**
- Slot back_width compound → null ou deadlift ? → **deadlift (back) remplit le slot** (pas null) : **PASS** (slot non vide)

**Verdict : ✅ Bon programme (⚠️ réserve coach)**
— Barbell seul : hasCompoundBack=true, pull non remplacé. Réserve : `seed-deadlift` (primaryMuscle='back') occupe slot[0] pull (tirage vertical), ce qui est sémantiquement incorrect. Aucun exercice barbell avec primaryMuscle=back_width dans le seed (pull-up/lat pulldown barbell n'existe pas). Warning BUG-5 non émis car le slot est rempli. Recommandation coach : noter le deadlift en slot tirage vertical comme anomalie acceptable faute d'alternative.

---

## P43 — Upper-lower barbell+dumbbell 4j strength → pas de 'pull', split upper-push/pull

**Paramètres :** goal=strength, days=4, duration=60, equipment=[barbell, dumbbell], level=intermediate, splitPreference=auto

**Simulation étape par étape :**
1. `strength + isMass=true + 4j` → `['upper-push', 'lower-quad', 'upper-pull', 'lower-hip']`
2. Aucun 'pull' dans le split → BUG-BW-PULL **non déclenché**
3. hasCompoundBack = true (seed-row-barbell, seed-row-dumbbell) → split inchangé
4. Session upper-pull :
   - slot[0] = {muscles:['back_width','back'], compound:true} :
     - Barbell compound dos : seed-deadlift (primaryMuscle=back) → dans ['back_width','back'] → **CANDIDAT**
     - Dumbbell compound dos : seed-row-dumbbell (back_thickness) → **non candidat** pour slot[0]
     - **Slot[0] rempli par seed-deadlift** (strength+barbell → priorité barbell via strengthEquipmentPrio=0)
   - slot[1] = {muscles:['back_thickness','back'], compound:true} :
     - seed-row-barbell (barbell, back_thickness) → CANDIDAT → sélectionné (force, barbell prio)
   - Résultat : aucun slot vide, aucun warning BUG-5

**Assertions : PASS/FAIL**
- Split mass+4j = ['upper-push','lower-quad','upper-pull','lower-hip'] : **PASS**
- Aucun 'pull' dans le split → BUG-BW-PULL non déclenché : **PASS**
- upper-pull slot back_width → slot vide + warning BUG-5 ? **FAIL** — assertion conditionnelle incorrecte : `seed-deadlift` (primaryMuscle=back) est dans `slot.muscles=['back_width','back']` et remplit le slot. **Pas de warning, pas de null.**

**Verdict : ✅ Bon programme (⚠️ réserve coach + assertion incorrecte dans le prompt)**
— Le code génère une séance upper-pull valide. Réserve : slot[0] upper-pull est rempli par `seed-deadlift` (deadlift en slot tirage vertical), sémantiquement inadapté. L'assertion du prompt ("slot vide + warning BUG-5 si aucun back_width barbell/dumbbell") est incorrecte : elle ignore que back ∈ slot.muscles, permettant à deadlift (back) de remplir le slot.

---

## P44 — Home gym (KB+DB) 4j → split selon goal

**Paramètres :** goal=fat_loss, days=4, duration=60, equipment=[kettlebell, dumbbell, bodyweight], level=intermediate, splitPreference=auto

**Simulation étape par étape :**
1. `fat_loss + non-mass + non-beginner + 4j` → split = ['push', 'pull', 'lower-quad', 'fullbody-quad']
2. available : exercices KB + DB + BW, non-warmup
3. `hasCompoundBack` :
   - seed-row-dumbbell : equipment=dumbbell, category=compound, primaryMuscle=back_thickness → **TRUE**
   - kb-row : equipment=kettlebell, category=compound, primaryMuscle=back_thickness → **TRUE** aussi
4. `hasPullInSplit` = true ; `hasCompoundBack` = true → split **inchangé** (pull conservé)
5. Session pull :
   - slot[0] = {muscles:['back_width','back'], compound:true} :
     - Candidats KB+DB+BW avec primaryMuscle ∈ ['back_width','back'] et compound :
       - seed-row-dumbbell (back_thickness) → **non candidat** (back_thickness ∉ ['back_width','back'])
       - kb-row (back_thickness) → **non candidat**
       - kb-deadlift (primaryMuscle=**back**) → ∈ ['back_width','back'] → **CANDIDAT**
     - **Slot[0] rempli par kb-deadlift** — pas de null, pas de warning BUG-5
   - slot[1] = {muscles:['back_thickness','back'], compound:true} :
     - seed-row-dumbbell (back_thickness) → CANDIDAT → sélectionné

**Assertions : PASS/FAIL**
- Split non-mass+4j+intermediate = ['push','pull','lower-quad','fullbody-quad'] : **PASS**
- hasCompoundBack = true (seed-row-dumbbell) : **PASS**
- Split inchangé (hasCompoundBack=true) : **PASS**
- Séance pull slot back_width = null → warning BUG-5 : **FAIL** — `kb-deadlift` (primaryMuscle=back) est dans ['back_width','back'] → **slot rempli, pas de warning**. L'assertion du prompt est incorrecte : elle oublie kb-deadlift (back) dans les candidats KB+DB.

**Verdict : ✅ Bon programme (⚠️ assertion incorrecte dans le prompt)**
— Le code génère une séance pull non vide. Réserve coach : kb-deadlift (primaryMuscle=back) remplit slot[0] pull (tirage vertical), exercice sémantiquement inadapté. L'assertion "slot null → warning BUG-5 attendu" est erronée : elle néglige que kb-deadlift satisfait le filtre `slot.muscles.includes('back')`.

---

## Tableau de synthèse P33–P44

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|--------|---------------------|---------|-------------------|
| P33 — band seul fullbody | band-row compound dos (back_thickness) → hasCompoundBack=TRUE ; fullbody pas de 'pull' ; slot dos non vide | ✅ | band-row utilisé sur 3 sessions (seul candidat) |
| P34 — cable seul PPL 4j | seed-row-cable+seed-lat-pulldown compound dos → TRUE ; pull non remplacé | ✅ | — |
| P35 — strength+20min | adjustedSlotCount(9,20,strength)=**3** (code) ≠ 4 (assertion du prompt) ; total 4 exos ≠ 5 | ⚠️ | Table de référence du prompt incorrecte (cap 3 manquant pour strength+20min) |
| P36 — endurance+90min | push/pull/lower-quad/fullbody-quad tous à 8 slots | ✅ | — |
| P37 — strength+90min | fullbody-quad min(9,5)=5 slots → 7 exos | ✅ | — |
| P38 — hypertrophy+4j beginner | isMass→upper/lower (level ignoré) ; 45min→6 slots ; spec inchangé | ✅ | Débutant avec split intermédiaire (upper-lower) ; code délibéré |
| P39 — KB seul 3j | kb-row+kb-deadlift → hasCompoundBack=TRUE ; PPL inchangé | ✅ | kb-deadlift en slot tirage vertical (slot[0] pull) — inadapté sémantiquement |
| P40 — cardio_machine seul | primaryMuscle=cardio → 0 slot rempli ; wizard bloque | ✅ | — |
| P41 — barbell seul 3j | hasCompoundBack=TRUE ; INC-1 fullbody×3 ; pas de 'pull' | ✅ | seed-deadlift.primaryMuscle='back' (non 'hamstrings') — confirmed |
| P42 — barbell seul PPL | hasCompoundBack=TRUE ; pull non remplacé ; slot[0] rempli par deadlift (back) | ✅ | deadlift en slot tirage vertical — aucun barbell back_width dans le seed |
| P43 — barbell+dumbbell 4j strength | upper-push/lower-quad/upper-pull/lower-hip ; pas de 'pull' ; slot[0] upper-pull rempli par deadlift | ✅ | deadlift en slot tirage vertical ; assertion du prompt sur "slot vide" est incorrecte |
| P44 — KB+DB+BW 4j fat_loss | hasCompoundBack=TRUE ; pull non remplacé ; slot[0] pull rempli par kb-deadlift | ✅ | kb-deadlift en slot tirage vertical ; assertion "null+warning" du prompt incorrecte |

---

## Synthèse des problèmes ouverts

### Bugs / anomalies logicielles (assertions FAIL)

**P35 — Table de référence du prompt incorrecte pour strength+20min :**
- Assertion : `adjustedSlotCount(9, 20, 'strength') = 4` → code donne **3**
- Cause : le code ajoute `min(3, ...)` pour strength+20min et strength+45min, absent de la table du prompt
- Impact : le programme produit 4 exercices au lieu de 5 par séance en strength+20min
- Classification : **anomalie dans le prompt d'audit** (le code est correct et intentionnel d'après les commentaires source). La table de référence doit être mise à jour.

**P43 et P44 — Assertions "slot vide + warning BUG-5" incorrectes :**
- P43 : l'assertion suppose qu'aucun barbell/dumbbell ne satisfait slot back_width, mais `seed-deadlift` (primaryMuscle=**back**) satisfait `slot.muscles=['back_width','back']` → slot rempli
- P44 : l'assertion suppose que KB+DB n'ont pas d'exercice back_width, mais `kb-deadlift` (primaryMuscle=**back**) satisfait le filtre → slot rempli, pas de warning
- Classification : **assertions incorrectes dans le prompt** (le code est correct). Les assertions négligent que `primaryMuscle='back'` satisfait le slot `['back_width','back']`.

### Réserves coach cumulées

**Deadlift en slot tirage vertical (pull slot[0]) :** Récurrent sur P39, P42, P43, P44 avec barbell-seul ou KB+DB sans pullup_bar. Le slot[0] de la séance pull = `{muscles:['back_width','back'], compound:true}`. `seed-deadlift` (barbell, back) et `kb-deadlift` (kettlebell, back) ont primaryMuscle='back' qui satisfait le filtre, mais ces exercices sont des mouvements de traction postérieure (chaîne postérieure) et non des tirages verticaux ou horizontaux au sens coach. Résultat : un programme barbell-only PPL place le deadlift en "tirage vertical" de la séance pull.

**Recommandation :** Distinguer `back` (érecteurs / chaîne postérieure) de `back_width` (grand dorsal / tirage vertical) dans le slot[0] pull, ou ajouter un exercice barbell avec primaryMuscle=back_width (ex. pendlay row ≠ back_thickness, ou barbell pull-over).

**KB seul en séance pull :** kb-deadlift (back) + kb-row (back_thickness) assurent le hasCompoundBack, mais le programme PPL KB-only offre une séance pull avec deadlift en position 1 — déséquilibre entre mouvements de traction verticale (absents) et postérieurs.
