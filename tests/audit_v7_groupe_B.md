# Audit v7 — Groupe B (P13-P24) : SEED-PULLOVER-COMPOUND + SEED-DEADLIFT-SLOT

**Date :** 2026-09-07
**Auditeur :** Claude Sonnet 4.6

---

## Notes préliminaires — Écarts avec la table de référence du prompt

Après lecture du seed réel (`exercises-seed.json`), plusieurs écarts existent entre la table de référence fournie dans le prompt et les valeurs du seed :

| id | Popularité prompt | Popularité seed | Écart |
|----|-------------------|-----------------|-------|
| seed-deadlift | 6 | **3** | −3 |
| seed-row-tbar | 4 | **2** | −2 |

Ces écarts n'affectent aucune conclusion (seed-row-barbell à pop=7 domine dans tous les cas barbell).

**`dumbbell-deadlift` est absent du seed.** Il n'existe aucun exercice avec `primaryMuscle: "back"` et `equipment: "dumbbell"` dans `exercises-seed.json`. Les profils DB-only n'ont donc jamais eu de deadlift dumbbell comme candidat pour les slots dos — la mention du prompt est théorique et applicable pour des seeds futurs.

**`seed-pullover-dumbbell` (id distinct)** existe dans le seed : `primaryMuscle: back_thickness`, `dumbbell`, `isolation`, `popularity: 3`. À ne pas confondre avec `seed-pullover` (`back_width`, devenu `compound`).

---

## Exercices de référence (valeurs seed réelles)

| id | primaryMuscle | equipment | category | popularity |
|----|--------------|-----------|----------|------------|
| seed-pullover | back_width | dumbbell | **compound** (v7) | 1 |
| seed-pullover-dumbbell | back_thickness | dumbbell | isolation | 3 |
| seed-row-dumbbell | back_thickness | dumbbell | compound | 3 |
| seed-shrug | back | dumbbell | isolation | 2 |
| seed-deadlift | back | barbell | compound | **3** (≠6 prompt) |
| seed-row-barbell | back_thickness | barbell | compound | 7 |
| seed-row-tbar | back_thickness | barbell | compound | **2** (≠4 prompt) |
| kb-row | back_thickness | kettlebell | compound | 2 |
| kb-deadlift | back | kettlebell | compound | 2 |
| kb-pullover | back_width | kettlebell | isolation | — |
| seed-pullup | back_width | pullup_bar | compound | 3 |
| seed-lat-pulldown | back_width | cable | compound | 3 |
| machine-lat-pulldown | back_width | machine | compound | 2 |
| seed-row-machine | back_thickness | machine | compound | 1 |

---

## P13 — DB seul, PPL 3j — pullover remplace deadlift dans slot tirage

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell], level=intermediate

**Raisonnement :**

hasCompoundBack :
- seed-pullover (back_width, dumbbell, compound) → `compound && backMuscles.includes('back_width')` → **true** ← EFFET SEED-PULLOVER-COMPOUND
- seed-row-dumbbell (back_thickness, dumbbell, compound) → également true
- `hasCompoundBack = true` (déjà true avant v7 grâce à seed-row-dumbbell, mais pullover renforce)

hasPullInSplit : rawSplit = ['push','pull','legs'] → true → BUG-BW-PULL non déclenché → split inchangé ✓

pull slot[0] `['back_width','back_thickness'] compound:true` (SEED-DEADLIFT-SLOT fix) :
- Candidates compound avec primaryMuscle ∈ ['back_width','back_thickness'] :
  - seed-pullover (back_width, compound) → **NOUVEAU candidat** (avant v7 : isolation → exclu)
  - seed-row-dumbbell (back_thickness, compound) → candidat
- Sort : `slotPrimary='back_width'` → seed-pullover (aP=0) > seed-row-dumbbell (aP=1) → seed-pullover classé premier
- intermediate → top-3 → pool = [seed-pullover, seed-row-dumbbell] → **seed-pullover sélectionné en majorité**
- Avant v7 : seed-pullover (isolation) filtré → seul seed-row-dumbbell (back_thickness ≠ slotPrimary) → slot[0] suboptimal

pull slot[1] `['back_thickness','back'] compound:true` (inchangé) :
- seed-pullover in usedInWorkout → exclu
- seed-row-dumbbell (back_thickness ∈ liste) → **sélectionné** ✓
- (Pas d'exercice dumbbell avec primaryMuscle=back)

**Conclusion :** ✅ PASS — seed-pullover (back_width, compound) sélectionné en slot pull[0] (tirage vertical DB-only). Avant v7, seed-row-dumbbell (back_thickness) prenait ce slot de façon suboptimale. Deux exercices dos distincts dans la séance pull.

---

## P14 — DB seul, deadlift ne remplit plus le slot tirage vertical

**Profil :** goal=strength, days=3, duration=60, equipment=[dumbbell], level=intermediate

**Raisonnement :**

INC-1 : strength + 3j + intermediate → `['fullbody-quad','fullbody-hip','fullbody-quad']` ✓

hasCompoundBack = true (seed-pullover compound + seed-row-dumbbell)
hasPullInSplit = false (split fullbody) → SEED-BW-NOBACK non déclenché (hasCompoundBack=true)

fullbody-quad slot[2] `['back_width','back_thickness','back'] compound:true` (**SLOT INCHANGÉ**) :
- Candidates dumbbell, compound, primaryMuscle ∈ ['back_width','back_thickness','back'] :
  - seed-pullover (back_width) → ✓
  - seed-row-dumbbell (back_thickness) → ✓
  - (seed-shrug : isolation → exclu du filtre compound)
  - **Aucun exercice dumbbell avec primaryMuscle=back dans le seed** (dumbbell-deadlift absent)
- Sort : slotPrimary='back_width' → seed-pullover (aP=0) → priorisé
- strength 60min : adjustedSlotCount(9, 60, 'strength') = max(4, floor(9×0.5)) = **4 slots**
- slot[2] est à l'index 2, dans les 4 premiers → inclus ✓
- **seed-pullover probable** (slotPrimary + strength → prio barbell non active pour dumbbell)

Confirmation SEED-DEADLIFT-SLOT :
- Les 6 slots modifiés (`['back_width','back']` → `['back_width','back_thickness']`) concernent pull[0], upper-pull[0], lower_pull[1], chest-back[1], back-bi[0], glutes-hip[3].
- fullbody-quad[2] et fullbody-hip[2] avec `['back_width','back_thickness','back']` sont **INCHANGÉS** ✓
- Pour un profil barbell (P20), seed-deadlift (back ∈ liste) resterait candidat pour ce slot. En DB-only, la question est théorique (pas de dumbbell avec primaryMuscle=back dans le seed).

**Conclusion :** ✅ PASS — Slot fullbody `['back_width','back_thickness','back']` INCHANGÉ confirmé. En DB seul, seed-pullover couvre le slot dos compound des séances fullbody. Note : dumbbell-deadlift n'existe pas dans le seed — la garantie de non-régression vaut surtout pour P20 (barbell).

---

## P15 — DB seul, fullbody 3j — pullover dans le slot dos fullbody

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell], level=beginner, splitPreference=fullbody

**Raisonnement :**

Split explicite fullbody : `['fullbody-quad','fullbody-hip','fullbody-quad']`
hasCompoundBack = true

fullbody-quad [A] slot[2] `['back_width','back_thickness','back'] compound:true` :
- slotPrimary='back_width' → seed-pullover (aP=0) classé premier
- beginner → top-1 → **seed-pullover sélectionné** → ajouté à usedGlobally

fullbody-hip [B] slot[2] `['back_width','back_thickness','back'] compound:true` :
- Candidates : seed-pullover (back_width, usedGlobally → aUsed=1), seed-row-dumbbell (back_thickness, aUsed=0)
- Sort : slotPrimary='back_width' → seed-pullover (aP=0) vs seed-row-dumbbell (aP=1)
- **La vérification slotPrimary est antérieure à usedGlobally** (`if (aP !== bP) return aP - bP` → retour précoce)
- seed-pullover classé PREMIER malgré le malus usedGlobally (aP=0 < aP=1 → retour avant le check usedGlobally)
- beginner → top-1 → **seed-pullover sélectionné également en séance B**

fullbody-quad [C] = copie de fullbody-quad [A], mêmes candidats → seed-pullover sélectionné (beginner top-1)

Slot servi dans les 3 séances ✓. Les deux exercices dos distincts (pullover et row) sont bien dans le seed pour cet équipement.

**Conclusion :** ✅ PASS — fullbody slot[2] servi dans les 3 séances. ⚠️ RÉSERVE : pour les débutants (top-1), slotPrimary=back_width prime sur usedGlobally → seed-pullover sélectionné aux 3 séances (pas d'alternance avec seed-row-dumbbell). L'alternance pullover↔row ne fonctionne qu'en intermediate/advanced (pool top-3, sélection aléatoire).

---

## P16 — DB seul, PPL 5j avec pullover dans séances pull

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[dumbbell], level=advanced

**Raisonnement :**

Split : 5j mass + advanced → `['push','pull','lower-quad','upper','lower-hip']` ✓
hasCompoundBack = true

Séance pull :
- slot[0] `['back_width','back_thickness'] compound:true` : seed-pullover (slotPrimary=back_width) → **sélectionné** → usedInWorkout + usedGlobally
- slot[1] `['back_thickness','back'] compound:true` : seed-row-dumbbell (back_thickness, not usedInWorkout) → **sélectionné**

Séance upper :
- slot[1] `['back_width','back_thickness','back'] compound:true` (upper[1] inchangé) :
  - seed-pullover (aP=0, aUsed=1) vs seed-row-dumbbell (aP=1, aUsed=1)
  - slotPrimary prime sur usedGlobally → seed-pullover classé premier
  - advanced → top-5 → pool = [seed-pullover, seed-row-dumbbell] → random 50/50

Séances lower-quad et lower-hip : pas de slot dos → aucun impact.

5 séances : pull (2 exercices dos), upper (1 exercice dos), push/lower (aucun slot dos) → toutes les séances qui comportent des slots dos sont servies ✓.

**Conclusion :** ✅ PASS — DB-only 5j : seed-pullover en pull slot[0] (tirage vertical), seed-row-dumbbell en pull slot[1], un des deux en upper slot[1] (random pour advanced). Tous les slots dos non vides.

---

## P17 — DB seul, back-bi brosplit — pullover en lat pulldown slot

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[dumbbell], level=intermediate, splitPreference=brosplit

**Raisonnement :**

brosplit 5j : `['chest-tri','back-bi','legs','shoulders-arms','upper']`
hasCompoundBack = true

back-bi slot[0] `['back_width','back_thickness'] compound:true` (SEED-DEADLIFT-SLOT fix) :
- seed-pullover (back_width, compound) → slotPrimary=back_width → classé premier
- **seed-pullover sélectionné** ✓ (avant v7 : isolation → exclu → seed-row-dumbbell suboptimal)
- → usedInWorkout + usedGlobally

back-bi slot[1] `['back_thickness','back'] compound:true` :
- seed-row-dumbbell (back_thickness, not usedInWorkout) → **sélectionné** ✓
- → usedInWorkout + usedGlobally

back-bi slot[3] `['back_thickness','back_width','back'] compound:false` (isolation dos) :
- seed-pullover en usedInWorkout → **exclu**
- seed-row-dumbbell en usedInWorkout → **exclu**
- Isolation first filter : seed-pullover-dumbbell (back_thickness, dumbbell, isolation, pop=3) → ✓ candidat
- seed-shrug (back, dumbbell, isolation, pop=2) → candidat
- slotPrimary='back_thickness' → seed-pullover-dumbbell (aP=0) > seed-shrug (aP=1)
- **seed-pullover-dumbbell sélectionné** ✓ (exercice distinct des slots 0 et 1)

Trois exercices dos distincts dans back-bi : seed-pullover (compound back_width), seed-row-dumbbell (compound back_thickness), seed-pullover-dumbbell (isolation back_thickness).

**Conclusion :** ✅ PASS — back-bi DB : slot[0]=seed-pullover (compound back_width via SEED-PULLOVER-COMPOUND), slot[1]=seed-row-dumbbell, slot[3]=seed-pullover-dumbbell (isolation). Aucun conflit d'exercices.

---

## P18 — Barbell seul, PPL — deadlift ne remplit plus le slot tirage

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell], level=intermediate

**Raisonnement :**

hasCompoundBack : seed-row-barbell (back_thickness, barbell, compound), seed-row-tbar (back_thickness, barbell, compound), seed-deadlift (back, barbell, compound) → **true**
Split : `['push','pull','legs']`

pull slot[0] `['back_width','back_thickness'] compound:true` (SEED-DEADLIFT-SLOT fix : était `['back_width','back']`) :
- Candidates barbell, compound, primaryMuscle ∈ ['back_width','back_thickness'] :
  - seed-row-barbell (back_thickness, pop=7) → ✓
  - seed-row-tbar (back_thickness, pop=2) → ✓
  - seed-deadlift (back) → **back ∉ ['back_width','back_thickness'] → EXCLU** ✓
  - Aucun exercice barbell avec primaryMuscle=back_width dans le seed
- Sort : slotPrimary='back_width' → tous aP=1 → tie → usedGlobally (aucun) → equipment prio (non-strength) → popularité : seed-row-barbell (pop=7) > seed-row-tbar (pop=2)
- intermediate → top-3 → pool = [seed-row-barbell, seed-row-tbar] → **seed-row-barbell probable** ✓

pull slot[1] `['back_thickness','back'] compound:true` (inchangé) :
- seed-row-barbell en usedInWorkout → exclu
- seed-row-tbar (back_thickness ∈ liste) → candidat (aP=0, slotPrimary=back_thickness)
- seed-deadlift (back ∈ liste) → candidat (aP=1)
- **seed-row-tbar probable** (slotPrimary=back_thickness wins)

Note : les popularités réelles dans le seed (seed-deadlift=3, seed-row-tbar=2) diffèrent de la table du prompt (6 et 4), mais les conclusions sont identiques — seed-row-barbell (pop=7) est le seul exercice vraiment dominant.

**Conclusion :** ✅ PASS — Barbell seul : seed-deadlift EXCLU du slot[0] pull (back ∉ ['back_width','back_thickness']). seed-row-barbell sélectionné en slot[0]. Comportement correct : le deadlift ne prend plus la place du lat pulldown.

---

## P19 — KB seul, PPL — deadlift KB ne remplit plus le slot tirage

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[kettlebell], level=intermediate

**Raisonnement :**

hasCompoundBack : kb-row (back_thickness, kettlebell, compound), kb-deadlift (back, kettlebell, compound) → **true**
hasPullInSplit = true → BUG-BW-PULL non déclenché → split `['push','pull','legs']`

pull slot[0] `['back_width','back_thickness'] compound:true` (SEED-DEADLIFT-SLOT fix) :
- Candidates kettlebell, compound, primaryMuscle ∈ ['back_width','back_thickness'] :
  - kb-row (back_thickness, compound, pop=2) → ✓
  - kb-pullover (back_width, kettlebell, **isolation**) → compound filter → **EXCLU** (isolation)
  - kb-deadlift (back) → back ∉ ['back_width','back_thickness'] → **EXCLU** ✓
- Seul kb-row candidat → **kb-row sélectionné** ✓ → usedInWorkout + usedGlobally

pull slot[1] `['back_thickness','back'] compound:true` (inchangé) :
- kb-row en usedInWorkout → exclu
- kb-deadlift (back ∈ liste, compound) → **kb-deadlift sélectionné** ✓

Deux exercices dos KB distincts : kb-row (tirage compound, slot[0]), kb-deadlift (deadlift, slot[1]).
Le deadlift est correctement relégué au slot[1] (tirage horizontal/deadlift), pas au slot[0] (tirage vertical).

**Conclusion :** ✅ PASS — KB seul : slot[0] pull = kb-row (tirage compound back_thickness), slot[1] = kb-deadlift (back). kb-deadlift exclu du slot tirage vertical par SEED-DEADLIFT-SLOT. Les deux slots sont servis.

---

## P20 — Barbell seul, fullbody 3j — deadlift reste dans slot fullbody

**Profil :** goal=strength, days=3, duration=60, equipment=[barbell], level=intermediate

**Raisonnement :**

INC-1 : strength + 3j + intermediate → `['fullbody-quad','fullbody-hip','fullbody-quad']` ✓

hasCompoundBack = true (seed-row-barbell, seed-row-tbar, seed-deadlift)

fullbody-quad slot[2] `['back_width','back_thickness','back'] compound:true` (**SLOT INCHANGÉ — 3 muscles**) :
- Candidates barbell, compound, primaryMuscle ∈ ['back_width','back_thickness','back'] :
  - seed-row-barbell (back_thickness, pop=7) → ✓
  - seed-row-tbar (back_thickness, pop=2) → ✓
  - seed-deadlift (back) → **back ∈ ['back_width','back_thickness','back'] → TOUJOURS candidat** ✓
  - Aucun barbell avec back_width dans le seed
- Sort : slotPrimary='back_width' → tous aP=1 → tie → usedGlobally (none, séance A) → equipment prio (strength → barbell=0 pour tous, tie) → popularité : seed-row-barbell (7) > seed-deadlift (3) > seed-row-tbar (2)
- **seed-row-barbell probable** (pop=7 le plus fort)
- seed-deadlift reste dans le pool (candidat légitime pour ce slot inchangé)

strength 60min : adjustedSlotCount(9, 60, 'strength') = max(4, floor(9×0.5)) = **4 slots**
- Indices [0..3] : [quads/glutes], [chest], [back_width/back_thickness/back], [shoulders] → slot[2] inclus ✓

Confirmation SEED-DEADLIFT-SLOT : seuls les 6 slots avec 2 muscles `['back_width','back']` ont été modifiés en `['back_width','back_thickness']`. Les slots fullbody à 3 muscles `['back_width','back_thickness','back']` (fullbody-quad[2], fullbody-hip[2], upper[1], upper-push[1]) sont **INCHANGÉS**. Le code le confirme ligne par ligne dans `SLOTS['fullbody-quad']` et `SLOTS['fullbody-hip']`.

**Conclusion :** ✅ PASS — Slot fullbody `['back_width','back_thickness','back']` INCHANGÉ confirmé. seed-deadlift (barbell) TOUJOURS candidat pour les slots fullbody à 3 muscles. seed-row-barbell probable (pop=7 dominant). Régression non introduite.

---

## P21 — SALLE COMPLÈTE — régression globale, slots tirage non régressés

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable,machine,bodyweight,pullup_bar], level=intermediate

**Raisonnement :**

hasCompoundBack = true (nombreux exercices)
Split : `['push','pull','legs']` (hypertrophy + 3j + intermediate)

pull slot[0] `['back_width','back_thickness'] compound:true` (SEED-DEADLIFT-SLOT fix) :
- Candidates compound, back_width : seed-pullup (pop=3, pullup_bar), seed-lat-pulldown (pop=3, cable), machine-lat-pulldown (pop=2, machine), seed-pullover (pop=1, dumbbell)
- Candidates compound, back_thickness : seed-row-barbell (pop=7), seed-row-dumbbell (pop=3), seed-row-cable (pop=2), seed-row-tbar (pop=2), seed-row-machine (pop=1)
- seed-deadlift (back) → **back ∉ ['back_width','back_thickness'] → EXCLU** ✓
- Sort : slotPrimary='back_width' → seed-pullup, seed-lat-pulldown, machine-lat-pulldown, seed-pullover tous aP=0 (groupe 1 prioritaire)
- Parmi groupe back_width → popularité : seed-pullup (3) = seed-lat-pulldown (3) > machine-lat-pulldown (2) > seed-pullover (1)
- intermediate → top-3 → pool = [seed-pullup, seed-lat-pulldown, machine-lat-pulldown] → **random parmi les 3 back_width compound** ✓

pull slot[1] `['back_thickness','back'] compound:true` :
- seed-row-barbell (pop=7) non utilisé en slot[0] → **seed-row-barbell probable** ✓

Aucun slot dos vide en salle complète ✓. seed-deadlift exclu de slot[0] ✓.

**Conclusion :** ✅ PASS — Salle complète : slot[0] = seed-pullup ou seed-lat-pulldown (back_width, random intermediate). seed-deadlift exclu de slot[0] (SEED-DEADLIFT-SLOT). slot[1] = seed-row-barbell probable. Régression globale validée, aucun slot tirage vide.

---

## P22 — chest-back Arnold, barbell+dumbbell — deadlift exclu slot[1]

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[barbell,dumbbell], level=intermediate, splitPreference=arnold

**Raisonnement :**

arnold 5j : `['chest-back','shoulders-arms','legs','chest-back','shoulders-arms']`

chest-back slot[1] `['back_width','back_thickness'] compound:true` (SEED-DEADLIFT-SLOT fix) :
- Candidates barbell+dumbbell, compound, primaryMuscle ∈ ['back_width','back_thickness'] :
  - seed-pullover (back_width, dumbbell, compound, pop=1) → **NOUVEAU** via SEED-PULLOVER-COMPOUND
  - seed-row-barbell (back_thickness, barbell, compound, pop=7) → ✓
  - seed-row-dumbbell (back_thickness, dumbbell, compound, pop=3) → ✓
  - seed-deadlift (back) → **EXCLU** ✓
- Sort : slotPrimary='back_width' → seed-pullover (aP=0) classé PREMIER (les deux rowing aP=1)
- intermediate → top-3 → pool = [seed-pullover, seed-row-barbell, seed-row-dumbbell] → random

**Point d'attention — Interaction SEED-PULLOVER-COMPOUND × SEED-DEADLIFT-SLOT :**
L'assertion du prompt prédisait "seed-row-barbell (pop 7) probable" en supposant que les deux rowing seraient seuls en lice. Avec SEED-PULLOVER-COMPOUND, seed-pullover (back_width) est maintenant **classé premier** dans ce slot (slotPrimary=back_width). Seed-row-barbell n'est plus le candidat dominant — seed-pullover l'est.

Ce comportement est **architecturalement correct** : chest-back slot[1] est le "tirage vertical" (lat pulldown equiv), et seed-pullover (back_width) est plus approprié qu'un rowing. Mais l'assertion du prompt sous-estime l'impact de SEED-PULLOVER-COMPOUND sur les profils mixtes barbell+dumbbell.

**Conclusion :** ✅ PASS (assertion principale validée : deadlift EXCLU de slot[1] ✓). ⚠️ RÉSERVE : seed-pullover (back_width, compound) est désormais le candidat prioritaire pour chest-back slot[1] en barbell+dumbbell, pas seed-row-barbell comme prédit. Interaction non anticipée entre SEED-PULLOVER-COMPOUND et les slots modifiés par SEED-DEADLIFT-SLOT sur les profils mixtes.

---

## P23 — glutes-hip, DB seul — tirage posture corrigé

**Profil :** goal=fat_loss, days=4, duration=60, equipment=[dumbbell], level=intermediate, splitPreference=glutes-focus

**Raisonnement :**

glutes-focus 4j : `['glutes-hip','quad-glutes','glutes-hip','quad-glutes']`
hasCompoundBack = true (seed-pullover compound + seed-row-dumbbell)

fat_loss 60min : adjustedSlotCount(8, 60, 'fat_loss') = base = 8 → tous les 8 slots inclus ✓

glutes-hip slot[3] `['back_width','back_thickness'] compound:true` (SEED-DEADLIFT-SLOT fix : était `['back_width','back']`) :
- Avant fix : les candidats incluaient les exercices avec 'back' → potentiellement seed-shrug (isolation) et aucun compound back pour dumbbell → slot vide ou suboptimal
- Après fix : slot `['back_width','back_thickness']` + SEED-PULLOVER-COMPOUND :
  - seed-pullover (back_width, dumbbell, compound, pop=1) → ✓
  - seed-row-dumbbell (back_thickness, dumbbell, compound, pop=3) → ✓
- Sort : slotPrimary='back_width' → seed-pullover (aP=0) → classé premier
- intermediate → top-3 → pool = [seed-pullover, seed-row-dumbbell]
- **seed-pullover probable** (slotPrimary advantage) ✓

Séance quad-glutes slot[2] `['back_thickness','back'] compound:true` (inchangé) :
- seed-row-dumbbell (back_thickness) → candidat (slotPrimary=back_thickness → aP=0) → probable
- usedGlobally : seed-pullover de glutes-hip → malus si réutilisé, mais seed-row-dumbbell est distinct

**Conclusion :** ✅ PASS — glutes-hip slot[3] `['back_width','back_thickness']` servi par seed-pullover (DB seul). La combinaison SEED-DEADLIFT-SLOT + SEED-PULLOVER-COMPOUND résout le slot posture en glutes-hip pour les profils dumbbell-only.

---

## P24 — lower_pull, KB+DB — slot tirage vertical corrigé

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[kettlebell,dumbbell], level=intermediate, focusMuscles=['back','legs']

**Raisonnement :**

workoutTypeFromFocus(['back','legs']) : hasLower=true, hasPull=true, hasPush=false → `'lower_pull'`
Split : `['lower_pull','lower_pull','lower_pull']` (focusType fixe → tous les jours lower_pull)
hasCompoundBack = true (seed-pullover, seed-row-dumbbell, kb-row, kb-deadlift)

lower_pull slot[1] `['back_width','back_thickness'] compound:true` (SEED-DEADLIFT-SLOT fix) :
- Candidates KB+dumbbell, compound, primaryMuscle ∈ ['back_width','back_thickness'] :
  - seed-pullover (back_width, dumbbell, compound, pop=1) → ✓ **NOUVEAU** via SEED-PULLOVER-COMPOUND
  - seed-row-dumbbell (back_thickness, dumbbell, compound, pop=3) → ✓
  - kb-row (back_thickness, kettlebell, compound, pop=2) → ✓
  - kb-pullover (back_width, kettlebell, isolation) → compound filter → **EXCLU** (isolation)
  - kb-deadlift (back) → back ∉ ['back_width','back_thickness'] → **EXCLU** ✓
- Sort : slotPrimary='back_width' → seed-pullover (aP=0) classé premier ; seed-row-dumbbell (aP=1) et kb-row (aP=1) ties → popularité : seed-row-dumbbell (3) > kb-row (2)
- intermediate → top-3 → pool = [seed-pullover, seed-row-dumbbell, kb-row] → **seed-pullover probable** (index 0)

lower_pull slot[2] `['back_thickness','back'] compound:true` (inchangé) :
- seed-row-dumbbell probable (back_thickness, slotPrimary=back_thickness, si pas déjà usedInWorkout)
- kb-row candidat aussi
- kb-deadlift (back ∈ liste) → candidat si seed-pullover + seed-row-dumbbell déjà usedInWorkout

Rotation entre les 3 séances lower_pull : usedGlobally assure la variété entre séances ✓

**Confirmation du rôle de remplacement :**
- Avant SEED-DEADLIFT-SLOT : slot était `['back_width','back']` → kb-deadlift (back ∈ liste) était candidat → pouvait parasiter le slot tirage vertical
- Après : kb-deadlift exclu de slot[1] → seed-pullover (back_width) prend le rôle de tirage vertical ✓

**Conclusion :** ✅ PASS — lower_pull slot[1] `['back_width','back_thickness']` : seed-pullover (back_width, compound) candidat prioritaire. kb-deadlift exclu du slot tirage vertical. seed-pullover remplace efficacement le rôle que le deadlift occupait avant le fix. Variété inter-séances assurée par usedGlobally.

---

## Tableau récapitulatif — Groupe B

| Profil | Correction principale | Résultat | Note |
|--------|----------------------|----------|------|
| P13 — DB PPL 3j | SEED-PULLOVER-COMPOUND : slot[0] pull servi | ✅ PASS | seed-pullover (back_width) remplace seed-row-dumbbell (back_thickness) en slot[0] |
| P14 — DB fullbody strength (INC-1) | Slot fullbody INCHANGÉ confirmé | ✅ PASS | dumbbell-deadlift absent du seed — impact théorique uniquement |
| P15 — DB fullbody hypertrophy beginner | Slot dos fullbody servi | ✅ PASS | ⚠️ Pas d'alternance pullover↔row pour beginner (slotPrimary prime sur usedGlobally) |
| P16 — DB PPL 5j advanced | Tous les slots dos servis | ✅ PASS | upper slot[1] random entre pullover et row (advanced) |
| P17 — DB back-bi brosplit | slot[0] compound, slot[3] isolation distincts | ✅ PASS | seed-pullover-dumbbell (isolation) en slot[3] — 3 exercices dos distincts |
| P18 — Barbell PPL | seed-deadlift exclu slot[0] pull | ✅ PASS | seed-row-barbell sélectionné en slot[0] |
| P19 — KB PPL | kb-deadlift exclu slot[0] pull | ✅ PASS | kb-row en slot[0], kb-deadlift en slot[1] |
| P20 — Barbell fullbody strength | Slot fullbody INCHANGÉ, deadlift toujours candidat | ✅ PASS | seed-row-barbell probable (pop=7), seed-deadlift dans le pool |
| P21 — Salle complète | Régression globale validée | ✅ PASS | seed-deadlift exclu slot[0], tractions/lat-pulldown en slot[0] |
| P22 — Arnold barbell+dumbbell | seed-deadlift exclu chest-back slot[1] | ✅ PASS | ⚠️ seed-pullover (back_width) désormais prioritaire — assertion "seed-row-barbell probable" à réviser |
| P23 — glutes-hip DB seul | slot[3] posture servi | ✅ PASS | seed-pullover résout le slot back_width pour dumbbell |
| P24 — lower_pull KB+DB | slot[1] tirage vertical servi | ✅ PASS | seed-pullover remplace le rôle du deadlift en slot tirage |

**Bilan : 12/12 PASS, 0 FAIL, 3 réserves signalées**

---

## Réserves globales

1. **RÉSERVE P15 / P14 — Alternance beginner** : Pour les débutants (top-1), `slotPrimary` prime systématiquement sur `usedGlobally` — seed-pullover est sélectionné à chaque séance fullbody sans alternance avec seed-row-dumbbell. Ce n'est pas un bug (seed-pullover est bien le meilleur exercice back_width), mais l'absence de variété pour les débutants est un point coach à surveiller.

2. **RÉSERVE P22 — Interaction SEED-PULLOVER-COMPOUND × profils mixtes** : Dans les profils barbell+dumbbell, seed-pullover (back_width, compound) est maintenant classé PREMIER pour tous les slots tirage vertical (slotPrimary=back_width), devant seed-row-barbell. L'assertion du prompt ("seed-row-barbell probable") était valide avant v7, mais ne tient plus après SEED-PULLOVER-COMPOUND. Ce comportement est correct (seed-pullover est plus adapté à un slot tirage vertical qu'un rowing), mais tous les profils mixtes contenant dumbbell sont affectés.

3. **RÉSERVE générale — dumbbell-deadlift absent** : La table de référence du prompt mentionne `dumbbell-deadlift` (back, dumbbell, compound) qui n'existe pas dans le seed actuel. Si cet exercice est ajouté ultérieurement, son impact sur `hasCompoundBack` et sur les slots fullbody à 3 muscles (`['back_width','back_thickness','back']`) devra être ré-audité. En l'état, aucun impact.
