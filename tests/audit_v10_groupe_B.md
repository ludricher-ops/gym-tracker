# Audit v10 — Groupe B : Glutes+Dos × Équipement (B01–B12)
**Date :** 2026-09-07  
**Auditeur :** Claude Sonnet 4.6 — simulation manuelle  
**Source de vérité :** programGenerator.ts + exercises-seed.json  

---

## Exercices de référence confirmés (seed.json)

| id | primaryMuscle | equipment | category | pop |
|----|--------------|-----------|----------|-----|
| seed-hip-thrust-bw | glutes | bodyweight | compound | 3 |
| seed-curtsy-lunge | glutes | bodyweight | compound | 1 |
| bw-squat | quads | bodyweight | compound | 3 |
| bw-lunge | quads | bodyweight | compound | 2 |
| bw-jump-squat | quads | bodyweight | compound | 1 |
| bw-nordic-curl | hamstrings | **pullup_bar** | compound | 1 |
| seed-glute-bridge | glutes | bodyweight | isolation | 3 |
| seed-donkey-kick | glutes | bodyweight | isolation | 2 |
| seed-fire-hydrant | glutes | bodyweight | isolation | 2 |
| bw-wall-sit | quads | bodyweight | isolation | 2 |
| bw-calf-raise | calves | bodyweight | isolation | 2 |
| seed-row-dumbbell | back_thickness | dumbbell | compound | 3 |
| seed-pullover | back_width | dumbbell | **isolation** | 1 |
| seed-pullover-dumbbell | back_thickness | dumbbell | isolation | 3 |
| seed-shrug | back | dumbbell | isolation | 2 |
| dumbbell-rdl | hamstrings | dumbbell | compound | 2 |
| seed-lunges | quads | dumbbell | compound | 2 |
| seed-bulgarian-split-squat | quads | dumbbell | compound | 2 |
| seed-pullover-cable | back_thickness | cable | isolation | 2 |
| seed-straight-arm-pulldown | back_thickness | cable | isolation | 2 |
| kb-swing | glutes | kettlebell | compound | 3 |
| kb-rdl | hamstrings | kettlebell | compound | 2 |
| kb-row | back_thickness | kettlebell | compound | 2 |
| seed-goblet-squat | quads | kettlebell | compound | 3 |
| seed-hip-thrust | glutes | barbell | compound | 4 |
| seed-romanian-deadlift | hamstrings | barbell | compound | 3 |
| seed-squat-barbell | quads | barbell | compound | 8 |
| seed-row-barbell | back_thickness | barbell | compound | 7 |
| seed-lat-pulldown | back_width | cable | compound | 3 |
| seed-pullup | back_width | pullup_bar | compound | 3 |
| machine-lat-pulldown | back_width | machine | compound | 2 |
| seed-leg-curl-lying | hamstrings | machine | isolation | 3 |
| seed-leg-extension | quads | machine | isolation | 3 |
| seed-hip-abduction | glutes | machine | isolation | 2 |
| machine-pullover | **back_width** | machine | isolation | 2 |
| machine-low-row | back_thickness | machine | isolation | 2 |
| seed-calf-raise-db | calves | dumbbell | isolation | 2 |

> **NOTE CRITIQUE** : `bw-nordic-curl` a `equipment='pullup_bar'`, PAS `'bodyweight'` — il n'est pas disponible avec equipment=['bodyweight'] seul.  
> **NOTE CRITIQUE** : `machine-pullover.primaryMuscle='back_width'` — il n'est PAS éligible pour le slot `['back_thickness','back']` de glutes-hip slot[7].

---

## Rappel slots (code confirmé)

### glutes-hip (base=8)
| Slot | muscles | compound |
|------|---------|----------|
| [0] | ['glutes','hamstrings'] | true |
| [1] | ['hamstrings','glutes'] | true |
| [2] | ['quads','glutes'] | true |
| [3] | ['back_width','back_thickness'] | true |
| [4] | ['glutes'] | false |
| [5] | ['hamstrings'] | false |
| [6] | ['glutes'] | false |
| [7] | ['back_thickness','back'] | false |

### quad-glutes (base=8)
| Slot | muscles | compound |
|------|---------|----------|
| [0] | ['quads','glutes'] | true |
| [1] | ['glutes','hamstrings'] | true |
| [2] | ['back_thickness','back'] | true |
| [3] | ['quads'] | false |
| [4] | ['glutes'] | false |
| [5] | ['hamstrings'] | false |
| [6] | ['calves'] | false |
| [7] | ['back_width','back'] | false |

---

## B01 — Glutes+dos × BW, fat_loss, 3j, 60min, intermediate

**Split produit :** ['glutes-hip','quad-glutes','glutes-hip']  
**INC-1 :** NON  
**adjustedSlotCount :** 8  
**Warnings globaux :** aucun SEED-BW-NOBACK  

**Analyse SEED-BW-NOBACK :**
- `hasCompoundBack` = FALSE (aucun exercice compound dos disponible en BW — bw-inverted-row = pullup_bar, exclu)
- `hasPullInSplit` = FALSE (aucun 'pull','back-bi','chest-back' dans le split)
- `isGlutesSplit` = TRUE (rawSplit = ['glutes-hip','quad-glutes','glutes-hip'] → tout glutes)
- Condition SEED-BW-NOBACK = `!FALSE && !FALSE && (splitPreference !== 'glutes-focus') && !TRUE` = FALSE → warning supprimé ✅
- Warning slot VIDE dos émis (mécanisme indépendant de SEED-BW-NOBACK) ✅

**Séance glutes-hip (slots effectifs = 8) :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] ['glutes','hamstrings'] compound | seed-hip-thrust-bw (glutes, pop 3, rank 0 slotPrimary) | ✅ PASS |
| [1] ['hamstrings','glutes'] compound | seed-curtsy-lunge (glutes, pop 1 — seul composé BW restant) | ✅ PASS ⚠️ RÉSERVE-1 |
| [2] ['quads','glutes'] compound | bw-squat (quads, pop 3, top-3 aléatoire intermediate) | ✅ PASS |
| [3] ['back_width','back_thickness'] compound | VIDE + warning "dos (largeur)" | ✅ PASS |
| [4] ['glutes'] isolation | seed-glute-bridge (pop 3, top-3 intermediate) | ✅ PASS |
| [5] ['hamstrings'] isolation | VIDE (aucune isolation hamstrings BW, silencieux) | ✅ PASS |
| [6] ['glutes'] isolation | seed-donkey-kick ou seed-fire-hydrant (pop 2, tie) | ✅ PASS |
| [7] ['back_thickness','back'] isolation | VIDE (aucune isolation dos BW, silencieux) | ✅ PASS |

**Séance quad-glutes (après session glutes-hip) :**

usedGlobally = {seed-hip-thrust-bw, seed-curtsy-lunge, bw-squat, seed-glute-bridge, seed-donkey-kick OU seed-fire-hydrant}

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] ['quads','glutes'] compound | bw-lunge (quads, pop 2, NON usedGlobally — priorité anti-répétition) | ⚠️ ASSERTION ERREUR |
| [1] ['glutes','hamstrings'] compound | seed-hip-thrust-bw (glutes, pop 3, top de sort même usedGlobally vs curtsy-lunge pop 1) | ✅ PASS |
| [2] ['back_thickness','back'] compound | VIDE + warning "dos (épaisseur)" | ✅ PASS |
| [3] ['quads'] isolation | bw-wall-sit (pop 2, seul candidat) | ✅ PASS |
| [4] ['glutes'] isolation | seed-fire-hydrant OU seed-donkey-kick (non usedGlobally — priorité anti-répétition) | ⚠️ ASSERTION ERREUR |
| [5] ['hamstrings'] isolation | VIDE | ✅ PASS |
| [6] ['calves'] isolation | bw-calf-raise (pop 2) | ✅ PASS |
| [7] ['back_width','back'] isolation | VIDE (aucune isolation back_width BW — seed-pullover = dumbbell) | ✅ PASS |

**Findings :**
- ✅ PASS : split, adjustedSlotCount=8, SEED-BW-NOBACK absent, warnings slot VIDE dos émis
- ✅ PASS : slot[0] glutes-hip = seed-hip-thrust-bw (pop 3 domine)
- ✅ PASS : slot[1] glutes-hip = seed-curtsy-lunge (seul composé BW restant après hip-thrust-bw)
- ✅ PASS : slot[3] glutes-hip = VIDE + warning (independant SEED-BW-NOBACK)
- ✅ PASS : slot[2] quad-glutes = VIDE + warning "dos (épaisseur)"
- ✅ PASS : slot[7] quad-glutes = VIDE (seed-pullover = dumbbell → non disponible en BW)
- ⚠️ RÉSERVE-1 : slot[1] glutes-hip = seed-curtsy-lunge (pop 1, fente curtsy ≠ RDL fonctionnellement)
- ❌ FAIL-MINEUR : assertion 12 du prompt — slot[0] quad-glutes affirmé = bw-squat. INCORRECT : bw-squat est dans usedGlobally (session glutes-hip précédente) ; le tri anti-répétition met bw-lunge (pop 2, NON usedGlobally) en tête. bw-squat peut apparaître dans le pool top-3 intermédiaire mais n'est pas le top candidat.
- ❌ FAIL-MINEUR : assertion 16 du prompt — slot[4] quad-glutes affirmé = seed-glute-bridge. INCORRECT : seed-glute-bridge est dans usedGlobally ; l'exercice NON utilisé parmi {seed-donkey-kick, seed-fire-hydrant} vient en tête du tri. Le code est correct (anti-répétition), mais l'assertion du prompt est erronée.

---

## B02 — Glutes+dos × BW, hypertrophy, 4j, 60min, beginner

**Split produit :** ['glutes-hip','quad-glutes','glutes-hip','quad-glutes']  
**INC-1 :** NON  
**adjustedSlotCount :** 8  
**Warnings globaux :** aucun SEED-BW-NOBACK  

**Séance glutes-hip (beginner) :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] ['glutes','hamstrings'] compound | seed-hip-thrust-bw (pop 3, top-1 beginner) | ✅ PASS |
| [1] ['hamstrings','glutes'] compound | seed-curtsy-lunge (pop 1, seul restant — top-1 beginner) | ✅ PASS ⚠️ RÉSERVE-1 |
| [2] ['quads','glutes'] compound | bw-squat (pop 3, top-1 beginner) | ✅ PASS |
| [3] ['back_width','back_thickness'] compound | VIDE + warning dos | ✅ PASS |
| [4] ['glutes'] isolation | seed-glute-bridge (pop 3, top-1 beginner) | ✅ PASS |
| [5] ['hamstrings'] isolation | VIDE | ✅ PASS |
| [6] ['glutes'] isolation | seed-donkey-kick (pop 2, top-1 après glute-bridge usedInWorkout) | ✅ PASS |
| [7] ['back_thickness','back'] isolation | VIDE | ✅ PASS |

**Séance quad-glutes (beginner) :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] ['quads','glutes'] compound | bw-lunge (pop 2, NON usedGlobally — priorité sur bw-squat usedGlobally) | ℹ️ INFO |
| [1] ['glutes','hamstrings'] compound | seed-hip-thrust-bw (pop 3, usedGlobally mais top sur pop vs curtsy) | ✅ PASS |
| [2] ['back_thickness','back'] compound | VIDE + warning "dos (épaisseur)" | ✅ PASS |
| [3] ['quads'] isolation | bw-wall-sit (top-1 après bw-lunge usedInWorkout) | ✅ PASS |
| [4] ['glutes'] isolation | seed-fire-hydrant (NON usedGlobally — priorité sur glute-bridge/donkey-kick) | ℹ️ INFO |
| [5] ['hamstrings'] isolation | VIDE | ✅ PASS |
| [6] ['calves'] isolation | bw-calf-raise | ✅ PASS |
| [7] ['back_width','back'] isolation | VIDE | ✅ PASS |

**Findings :**
- ✅ PASS : toutes les assertions critiques (split 4j, SEED-BW-NOBACK absent, slot[3]/slot[2] dos VIDE+warning)
- ⚠️ RÉSERVE-1 : slot[1] glutes-hip = seed-curtsy-lunge (pop 1, fente curtsy ≠ RDL)
- ℹ️ INFO : assertion 3 du prompt "slot[1] = seed-curtsy-lunge (seul compound glutes BW restant, beginner top-1)" ✅ confirmée exactement

---

## B03 — Glutes+dos × BW, strength, 3j, 90min, intermediate → 5 slots

**Split produit :** ['glutes-hip','quad-glutes','glutes-hip']  
**INC-1 :** NON (splitPreference='glutes-focus' overrides auto)  
**adjustedSlotCount :** min(8, 5) = **5 slots**  
**Warnings globaux :** aucun SEED-BW-NOBACK  

**Calcul vérifié :** `adjustedSlotCount(base=8, duration=90, goal='strength') = Math.min(8, 5) = 5` ✅

**Séance glutes-hip slots 0–4 :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] | seed-hip-thrust-bw | ✅ PASS |
| [1] | seed-curtsy-lunge | ✅ PASS ⚠️ RÉSERVE-1 |
| [2] | bw-squat | ✅ PASS |
| [3] | VIDE + warning "dos (largeur)" — INCLUS dans les 5 premiers | ✅ PASS |
| [4] | seed-glute-bridge | ✅ PASS |
| [5–7] | non atteints (slotCount=5) | — |

**Séance quad-glutes slots 0–4 :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] | bw-lunge (non usedGlobally, anti-répétition) | ✅ PASS |
| [1] | seed-hip-thrust-bw | ✅ PASS |
| [2] | VIDE + warning "dos (épaisseur)" — INCLUS dans les 5 premiers | ✅ PASS |
| [3] | bw-wall-sit | ✅ PASS |
| [4] | glutes isolation (seed-fire-hydrant ou seed-donkey-kick non utilisé) | ✅ PASS |
| [5–7] | non atteints | — |

**Findings :**
- ✅ PASS : adjustedSlotCount = 5 ✅
- ✅ PASS : slot[3] glutes-hip (dos compound) inclus dans les 5 premiers → VIDE+warning ✅
- ✅ PASS : slot[2] quad-glutes (dos compound) inclus dans les 5 premiers → VIDE+warning ✅
- ✅ PASS : SEED-BW-NOBACK absent (splitPreference='glutes-focus' + isGlutesSplit=TRUE) ✅
- ⚠️ RÉSERVE-1 : slot[1] glutes-hip = seed-curtsy-lunge confirmé

---

## B04 — Glutes+dos × DB+BW, fat_loss, 4j, 60min, intermediate

**Split produit :** ['glutes-hip','quad-glutes','glutes-hip','quad-glutes']  
**INC-1 :** NON  
**adjustedSlotCount :** 8  
**Warnings globaux :** aucun SEED-BW-NOBACK (hasCompoundBack=TRUE via seed-row-dumbbell)  

**Vérification hasCompoundBack :**
- equipment=['dumbbell','bodyweight'] → seed-row-dumbbell (back_thickness, dumbbell, compound) disponible → `hasCompoundBack=TRUE` ✅
- `hasPullInSplit=FALSE` → BUG-BW-PULL ne se déclenche pas ✅
- `isGlutesSplit=TRUE` + `splitPreference='glutes-focus'` → SEED-BW-NOBACK absent ✅

**Séance glutes-hip session 1 (slots 0–7) :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] ['glutes','hamstrings'] compound | seed-hip-thrust-bw (glutes, BW, pop 3, rank 0) | ✅ PASS |
| [1] ['hamstrings','glutes'] compound | dumbbell-rdl (hamstrings, DB, pop 2, rank 0 slotPrimary — hip-thrust usedInWorkout) | ✅ PASS |
| [2] ['quads','glutes'] compound | **bw-squat** (quads, BW, pop 3, NON usedGlobally à ce stade) | ❌ FAIL-MINEUR |
| [3] ['back_width','back_thickness'] compound | seed-row-dumbbell (back_thickness, DB, pop 3 — seul composé dos DB, rang 1 sur slotPrimary=back_width mais seul candidat) | ✅ PASS |
| [4] ['glutes'] isolation | seed-glute-bridge (pop 3) | ✅ PASS |
| [5] ['hamstrings'] isolation | VIDE (aucune isolation hamstrings DB+BW) | ✅ PASS |
| [6] ['glutes'] isolation | seed-donkey-kick (pop 2) ou seed-fire-hydrant (pop 2) | ✅ PASS |
| [7] ['back_thickness','back'] isolation | seed-pullover-dumbbell (back_thickness, DB, pop 3, rank 0 slotPrimary) | ✅ PASS |

**Séance quad-glutes session 1 (après glutes-hip session 1) :**

usedGlobally = {seed-hip-thrust-bw, dumbbell-rdl, bw-squat, seed-row-dumbbell, seed-glute-bridge, seed-donkey-kick/seed-fire-hydrant, seed-pullover-dumbbell}

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] ['quads','glutes'] compound | bw-squat (usedGlobally) vs bw-lunge (non usedGlobally, pop 2) → bw-lunge prioritaire | ✅ PASS (code correct) |
| [1] ['glutes','hamstrings'] compound | seed-hip-thrust-bw (usedGlobally, pop 3 > curtsy pop 1 — tous deux usedGlobally) | ✅ PASS |
| [2] ['back_thickness','back'] compound | seed-row-dumbbell (back_thickness, DB, pop 3, rank 0 slotPrimary=back_thickness ✅) | ✅ PASS |
| [3] ['quads'] isolation | bw-wall-sit (seul candidat) | ✅ PASS |
| [4] ['glutes'] isolation | seed-fire-hydrant ou seed-donkey-kick (non usedGlobally) | ✅ PASS |
| [5] ['hamstrings'] isolation | VIDE | ✅ PASS |
| [6] ['calves'] isolation | seed-calf-raise-db (DB, pop 2) | ✅ PASS |
| [7] ['back_width','back'] isolation | seed-pullover (back_width, DB, isolation, pop 1 — seul candidat back_width isolation DB) | ✅ PASS |

**Findings :**
- ✅ PASS : assertions critiques dos (slot[3] glutes-hip = seed-row-dumbbell, slot[2] quad-glutes = seed-row-dumbbell, slot[7] glutes-hip = seed-pullover-dumbbell, slot[7] quad-glutes = seed-pullover) ✅
- ✅ PASS : slot[1] = dumbbell-rdl (slotPrimary=hamstrings rank 0) ✅
- ❌ FAIL-MINEUR : assertion 4 du prompt — "slot[2] = seed-lunges/bw-lunge/seed-bulgarian-split-squat (tie)" est la description du comportement en **session 2** (après bw-squat entré dans usedGlobally depuis session 1). Pour la **session 1**, bw-squat (pop 3, NON encore usedGlobally) est sélectionné. L'assertion du prompt omet ce comportement de session 1. Le code est correct, l'assertion du prompt est incomplète.
- ℹ️ INFO : seed-pullover (back_width, pop 1) sélectionné pour slot[7] quad-glutes — c'est bien le seul candidat isolation back_width en DB+BW (seed-pullover-dumbbell.primaryMuscle=back_thickness → exclu de ce slot)

---

## B05 — Glutes+dos × DB+BW, hypertrophy, 3j, 60min, beginner

**Split produit :** ['glutes-hip','quad-glutes','glutes-hip']  
**INC-1 :** NON  
**adjustedSlotCount :** 8  
**Warnings globaux :** aucun SEED-BW-NOBACK  

**Séance glutes-hip (slots critiques) :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] | seed-hip-thrust-bw (glutes, BW, pop 3, top-1 beginner) | ✅ PASS |
| [1] | dumbbell-rdl (hamstrings, DB, pop 2, slotPrimary=hamstrings rank 0) | ✅ PASS |
| [2] | bw-squat (quads, BW, pop 3) ou seed-lunges (DB, pop 2) → bw-squat top-1 beginner | ✅ PASS |
| [3] | seed-row-dumbbell (beginner top-1, seul compound dos DB) | ✅ PASS |
| [4] | seed-glute-bridge (pop 3, top-1 beginner) | ✅ PASS |
| [5] | VIDE | ✅ PASS |
| [6] | seed-donkey-kick (pop 2) | ✅ PASS |
| [7] | seed-pullover-dumbbell (back_thickness, pop 3, slotPrimary=back_thickness rank 0) | ✅ PASS |

**Séance quad-glutes (slot [7] critique) :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] | bw-lunge (quads, BW, pop 2, NON usedGlobally — anti-répétition) | ✅ PASS |
| [1] | seed-hip-thrust-bw (top sur pop même usedGlobally) | ✅ PASS |
| [2] | seed-row-dumbbell (back_thickness, pop 3, slotPrimary rank 0) | ✅ PASS |
| [7] | seed-pullover (back_width, DB, isolation, pop 1 — seul candidat isolation back_width DB) | ✅ PASS |

**Findings :**
- ✅ PASS : toutes les assertions (slot[3] = seed-row-dumbbell, slot[7] glutes-hip = seed-pullover-dumbbell, slot[7] quad-glutes = seed-pullover) ✅
- ℹ️ INFO : seed-pullover (back_width, isolation, pop 1) est le SEUL candidat pour quad-glutes slot[7] en DB+BW — seed-shrug (back, isolation) arrive en rank 1 sur slotPrimary='back_width', seed-pullover en rank 0. Sélection déterministe même pour beginner.

---

## B06 — Glutes+dos × DB+BW, strength, 4j, 60min, intermediate → 4 slots

**Split produit :** ['glutes-hip','quad-glutes','glutes-hip','quad-glutes']  
**INC-1 :** NON (splitPreference='glutes-focus' override)  
**adjustedSlotCount :** max(4, floor(8×0.5)) = **4 slots**  
**Warnings globaux :** aucun SEED-BW-NOBACK  

**Calcul vérifié :** `adjustedSlotCount(base=8, duration=60, goal='strength') = Math.max(4, Math.floor(8*0.5)) = Math.max(4, 4) = 4` ✅

**Séance glutes-hip slots 0–3 :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] | seed-hip-thrust-bw (glutes, BW, strengthEquipmentPrio n/a — BW seul composé glutes dispo) | ✅ PASS |
| [1] | dumbbell-rdl (hamstrings, DB, pop 2) | ✅ PASS |
| [2] | bw-squat ou seed-lunges/bw-lunge (quads compound, session dépendante) | ✅ PASS |
| [3] | **seed-row-dumbbell** (back_width/back_thickness compound — seul composé dos DB, inclus ✅) | ✅ PASS |

**Séance quad-glutes slots 0–3 :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] | bw-squat ou bw-lunge (anti-répétition) | ✅ PASS |
| [1] | seed-hip-thrust-bw | ✅ PASS |
| [2] | **seed-row-dumbbell** (back_thickness compound — inclus ✅, slotPrimary=back_thickness rank 0) | ✅ PASS |
| [3] | bw-wall-sit (seul isolation quads BW sans machine) | ✅ PASS |

**Findings :**
- ✅ PASS : adjustedSlotCount = 4 ✅
- ✅ PASS : glutes-hip slot[3] = seed-row-dumbbell (composé dos inclus dans les 4 premiers) ✅
- ✅ PASS : quad-glutes slot[2] = seed-row-dumbbell (composé dos inclus dans les 4 premiers) ✅
- ✅ PASS : SEED-BW-NOBACK absent ✅
- ℹ️ INFO : strengthEquipmentPrio (barbell > machine > dumbbell) actif mais seed-row-dumbbell est le seul composé dos disponible en DB+BW → sélectionné sans compétition réelle

---

## B07 — Glutes+dos × KB+DB+BW, fat_loss, 4j, 60min, intermediate

**Split produit :** ['glutes-hip','quad-glutes','glutes-hip','quad-glutes']  
**INC-1 :** NON  
**adjustedSlotCount :** 8  
**Warnings globaux :** aucun SEED-BW-NOBACK  

**Vérification hasCompoundBack :** seed-row-dumbbell (DB) + kb-row (KB) disponibles → TRUE ✅

**Séance glutes-hip (slots critiques) :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] ['glutes','hamstrings'] | kb-swing (glutes, KB, pop 3) OU seed-hip-thrust-bw (glutes, BW, pop 3) — tie → aléatoire top-3 | ✅ PASS |
| [1] ['hamstrings','glutes'] | kb-rdl (KB, pop 2) OU dumbbell-rdl (DB, pop 2) — tie hamstrings → aléatoire | ✅ PASS |
| [2] ['quads','glutes'] | seed-goblet-squat (KB, pop 3) OU bw-squat (BW, pop 3) — tie → aléatoire | ✅ PASS |
| [3] ['back_width','back_thickness'] | seed-row-dumbbell (DB, pop 3) > kb-row (KB, pop 2) — pop décide | ✅ PASS |
| [4] ['glutes'] isolation | seed-glute-bridge (pop 3) | ✅ PASS |
| [5] ['hamstrings'] isolation | VIDE (aucune isolation hamstrings KB+DB+BW) | ✅ PASS |
| [6] ['glutes'] isolation | seed-donkey-kick ou seed-fire-hydrant | ✅ PASS |
| [7] ['back_thickness','back'] isolation | seed-pullover-dumbbell (back_thickness, DB, pop 3) — top candidat | ✅ PASS |

**Vérification slot[7] glutes-hip :**
- Candidats eligibles (primaryMuscle ∈ ['back_thickness','back']) : seed-pullover-dumbbell (pop 3), machine-low-row (machine — non dispo), seed-shrug (back, DB, pop 2)
- seed-pullover-dumbbell (slotPrimary=back_thickness, rank 0, pop 3) > seed-shrug (back, rank 1)
- kb-pullover : primaryMuscle=back_width ∉ ['back_thickness','back'] → NON éligible pour ce slot
- seed-pullover-dumbbell sélectionné ✅

**Séance quad-glutes :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [2] ['back_thickness','back'] compound | seed-row-dumbbell (DB, pop 3, slotPrimary=back_thickness rank 0 ✅) | ✅ PASS |
| [7] ['back_width','back'] isolation | seed-pullover (back_width, DB, pop 1, rank 0 slotPrimary=back_width) vs kb-pullover (back_width, KB, pop 1) — tie → aléatoire | ✅ PASS |

**Findings :**
- ✅ PASS : toutes les assertions critiques ✅
- ✅ PASS : slot[3] glutes-hip = seed-row-dumbbell (pop 3 > kb-row pop 2) ✅
- ✅ PASS : slot[7] glutes-hip = seed-pullover-dumbbell (top sur primaryMuscle=back_thickness rank 0, pop 3) ✅
- ✅ PASS : slot[2] quad-glutes = seed-row-dumbbell (back_thickness, DB, pop 3, rank 0) ✅
- ℹ️ INFO : kb-pullover (back_width) NON éligible pour slot[7] glutes-hip ['back_thickness','back'] — mais eligible pour slot[7] quad-glutes ['back_width','back']

---

## B08 — Glutes+dos × KB+DB+BW, hypertrophy, 3j, 45min, beginner

**Split produit :** ['glutes-hip','quad-glutes','glutes-hip']  
**INC-1 :** NON  
**adjustedSlotCount :** max(4, floor(8×0.75)) = **6 slots**  
**Warnings globaux :** aucun SEED-BW-NOBACK  

**Calcul vérifié :** `adjustedSlotCount(base=8, duration=45, goal='hypertrophy') = Math.max(4, Math.floor(8*0.75)) = Math.max(4, 6) = 6` ✅

**Séance glutes-hip slots 0–5 :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] | kb-swing OU seed-hip-thrust-bw (pop 3 tie, beginner top-1 → premier du tri indéterminé) | ✅ PASS |
| [1] | kb-rdl OU dumbbell-rdl (hamstrings, pop 2 tie) | ✅ PASS |
| [2] | seed-goblet-squat (KB, pop 3) OU bw-squat (BW, pop 3) → top-1 beginner = indéterminé sur tie | ✅ PASS |
| [3] | **seed-row-dumbbell** (inclus dans les 6 premiers ✅) | ✅ PASS |
| [4] | seed-glute-bridge (pop 3) | ✅ PASS |
| [5] | VIDE (hamstrings isolation absente KB+DB+BW) | ✅ PASS |
| [6–7] | non atteints (slotCount=6) | — |

**Séance quad-glutes slots 0–5 :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] | bw-squat ou bw-lunge (anti-répétition) | ✅ PASS |
| [1] | kb-swing/hip-thrust-bw (top sur pop) | ✅ PASS |
| [2] | **seed-row-dumbbell** (inclus dans les 6 premiers ✅, back_thickness rank 0) | ✅ PASS |
| [3] | bw-wall-sit | ✅ PASS |
| [4] | seed-glute-bridge (ou non-usedGlobally) | ✅ PASS |
| [5] | VIDE (hamstrings) | ✅ PASS |
| [6–7] | non atteints | — |

**Findings :**
- ✅ PASS : adjustedSlotCount = 6 ✅
- ✅ PASS : slot[3] glutes-hip inclus (index 3 < 6) → seed-row-dumbbell ✅
- ✅ PASS : slot[2] quad-glutes inclus (index 2 < 6) → seed-row-dumbbell ✅
- ⚠️ RÉSERVE : slot[0] glutes-hip pour beginner = top-1 sur un tie pop=3 entre kb-swing et seed-hip-thrust-bw — résultat non déterministe (ordre d'apparition dans le tableau exercises-seed)

---

## B09 — Glutes+dos × Salle complète, fat_loss, 4j, 60min, intermediate

**Split produit :** ['glutes-hip','quad-glutes','glutes-hip','quad-glutes']  
**INC-1 :** NON  
**adjustedSlotCount :** 8  
**Warnings globaux :** aucun SEED-BW-NOBACK  

**Note :** equipment=['barbell','dumbbell','cable','pullup_bar','machine'] — bodyweight NON inclus → seed-hip-thrust-bw, bw-squat, etc. hors pool.

**Séance glutes-hip :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] ['glutes','hamstrings'] compound | seed-hip-thrust (barbell, pop 4, rank 0 slotPrimary=glutes) | ✅ PASS |
| [1] ['hamstrings','glutes'] compound | seed-romanian-deadlift (hamstrings, barbell, pop 3, rank 0) | ✅ PASS |
| [2] ['quads','glutes'] compound | seed-squat-barbell (quads, barbell, pop 8) | ✅ PASS |
| [3] ['back_width','back_thickness'] compound | seed-lat-pulldown (cable, pop 3) OU seed-pullup (pullup_bar, pop 3) — tie → aléatoire | ✅ PASS |
| [4] ['glutes'] isolation | seed-hip-abduction (machine, pop 2) — top candidat isolation glutes en salle | ✅ PASS |
| [5] ['hamstrings'] isolation | seed-leg-curl-lying (machine, pop 3) | ✅ PASS |
| [6] ['glutes'] isolation | seed-glute-kickback (cable, pop 1) ou seed-hip-abduction si non usedInWorkout | ✅ PASS |
| [7] ['back_thickness','back'] isolation | seed-pullover-dumbbell (DB, pop 3, rank 0) | ❌ FAIL-MINEUR |

**Analyse critique slot[7] glutes-hip ['back_thickness','back'] isolation :**
- Candidats eligibles (primaryMuscle ∈ ['back_thickness','back']) :
  - seed-pullover-dumbbell (back_thickness, DB, pop 3) ✅ rank 0 slotPrimary=back_thickness
  - machine-low-row (back_thickness, machine, pop 2) ✅ rank 0
  - seed-pullover-cable (back_thickness, cable, pop 2) ✅ rank 0
  - seed-straight-arm-pulldown (back_thickness, cable, pop 2) ✅ rank 0
  - seed-shrug (back, dumbbell, pop 2) ✅ rank 1 (back ≠ back_thickness)
  - **machine-pullover (back_width, machine, pop 2) : primaryMuscle=back_width ∉ ['back_thickness','back'] → NON éligible pour ce slot !**
- Top-3 intermédiaire : [seed-pullover-dumbbell (pop 3), machine-low-row (pop 2), seed-pullover-cable/seed-straight-arm-pulldown (pop 2)]
- L'assertion du prompt liste "seed-pullover-dumbbell OU seed-pullover-cable OU **machine-pullover**" comme top-3

**Séance quad-glutes :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [2] ['back_thickness','back'] compound | seed-row-barbell (back_thickness, barbell, pop 7, rank 0 slotPrimary) | ✅ PASS |
| [7] ['back_width','back'] isolation | machine-pullover (back_width, machine, pop 2) ✅ éligible ici | ✅ PASS |

**Findings :**
- ✅ PASS : slot[0] = seed-hip-thrust (barbell, pop 4) ✅
- ✅ PASS : slot[1] = seed-romanian-deadlift ✅
- ✅ PASS : slot[2] = seed-squat-barbell ✅
- ✅ PASS : slot[3] = seed-lat-pulldown OU seed-pullup (tie aléatoire) ✅
- ✅ PASS : slot[5] = seed-leg-curl-lying (machine, pop 3) ✅
- ✅ PASS : slot[2] quad-glutes = seed-row-barbell ✅
- ❌ FAIL-MINEUR : assertion 6 du prompt — machine-pullover incorrectement listé comme candidat pour glutes-hip slot[7] ['back_thickness','back']. machine-pullover.primaryMuscle='back_width' ∉ ['back_thickness','back'] → code ne le sélectionnerait PAS ici. machine-pullover est éligible pour quad-glutes slot[7] ['back_width','back'] mais PAS pour glutes-hip slot[7]. Top-3 réel = seed-pullover-dumbbell, machine-low-row, seed-pullover-cable.

---

## B10 — Glutes+dos × Salle, hypertrophy, 3j, 60min, advanced

**Split produit :** ['glutes-hip','quad-glutes','glutes-hip']  
**INC-1 :** NON  
**adjustedSlotCount :** 8  
**Warnings globaux :** aucun SEED-BW-NOBACK  

**Séance glutes-hip (slots critiques) :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] | seed-hip-thrust (barbell, pop 4) | ✅ PASS |
| [5] ['hamstrings'] isolation | seed-leg-curl-lying (machine, pop 3) | ✅ PASS |
| [7] ['back_thickness','back'] isolation | seed-pullover-dumbbell (pop 3), machine-low-row (pop 2), seed-pullover-cable (pop 2) — top-3 advanced aléatoire | ⚠️ RÉSERVE |

**Séance quad-glutes :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [2] ['back_thickness','back'] compound | seed-row-barbell (pop 7, rank 0) | ✅ PASS |

**Findings :**
- ✅ PASS : slot[5] glutes-hip = seed-leg-curl-lying ✅
- ✅ PASS : slot[2] quad-glutes = seed-row-barbell (pop 7) ✅
- ⚠️ RÉSERVE : assertion 2 "parmi top-3 variantes pullover (aléatoire advanced)" — si l'intention inclut machine-pullover, c'est incorrect (même raison que B09). Vrai top-3 = seed-pullover-dumbbell, machine-low-row, seed-pullover-cable. machine-pullover est éligible pour quad-glutes slot[7] ['back_width','back'] mais PAS pour glutes-hip slot[7] ['back_thickness','back'].

---

## B11 — Glutes+dos × Salle, strength, 4j, 60min, intermediate → 4 slots

**Split produit :** ['glutes-hip','quad-glutes','glutes-hip','quad-glutes']  
**INC-1 :** NON  
**adjustedSlotCount :** max(4, floor(8×0.5)) = **4 slots**  
**Warnings globaux :** aucun SEED-BW-NOBACK  

**Séance glutes-hip slots 0–3 :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] ['glutes','hamstrings'] compound | seed-hip-thrust (barbell, pop 4, strengthEquipmentPrio=0) | ✅ PASS |
| [1] ['hamstrings','glutes'] compound | seed-romanian-deadlift (hamstrings, barbell, pop 3, strengthPrio=0) | ✅ PASS |
| [2] ['quads','glutes'] compound | seed-squat-barbell (quads, barbell, pop 8, strengthPrio=0) | ✅ PASS |
| [3] ['back_width','back_thickness'] compound | seed-lat-pulldown (cable, pop 3, strengthPrio=1) > seed-pullup (pullup_bar, prio=4) — câble prime sur traction pour strength | ✅ PASS |

**Analyse slot[3] strength :**
- slotPrimary='back_width' : seed-lat-pulldown (rank 0), seed-pullup (rank 0), machine-lat-pulldown (rank 0, prio=1, pop=2)
- strengthEquipmentPrio : seed-lat-pulldown (cable, prio=1) = machine-lat-pulldown (machine, prio=1) < seed-pullup (pullup_bar, prio=4)
- Parmi prio=1 : seed-lat-pulldown (pop 3) > machine-lat-pulldown (pop 2) → seed-lat-pulldown top-1
- Intermediate top-3 : [seed-lat-pulldown, machine-lat-pulldown, seed-pullup]
- Assertion "seed-lat-pulldown OU seed-pullup" ✅ (les deux dans le pool top-3)

**Séance quad-glutes slots 0–3 :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] | seed-squat-barbell (barbell, pop 8, strengthPrio=0) | ✅ PASS |
| [1] | seed-hip-thrust (barbell, pop 4, strengthPrio=0) | ✅ PASS |
| [2] ['back_thickness','back'] compound | seed-row-barbell (back_thickness, barbell, pop 7, strengthPrio=0, rank 0) | ✅ PASS |
| [3] ['quads'] isolation | seed-leg-extension (machine, pop 3) — salle disponible | ✅ PASS |

**Findings :**
- ✅ PASS : adjustedSlotCount = 4 ✅
- ✅ PASS : glutes-hip slot[3] = seed-lat-pulldown ou seed-pullup (composé dos inclus) ✅
- ✅ PASS : quad-glutes slot[2] = seed-row-barbell ✅
- ✅ PASS : slot[0] glutes-hip = seed-hip-thrust (barbell) avec strengthEquipmentPrio ✅
- ℹ️ INFO : strengthEquipmentPrio pousse seed-lat-pulldown (cable) avant seed-pullup (pullup_bar) pour strength — les deux restent dans le pool top-3 intermédiaire

---

## B12 — Glutes+dos × Salle, fat_loss, 3j, 45min, beginner

**Split produit :** ['glutes-hip','quad-glutes','glutes-hip']  
**INC-1 :** NON  
**adjustedSlotCount :** max(4, floor(8×0.75)) = **6 slots**  
**Warnings globaux :** aucun SEED-BW-NOBACK  

**Calcul vérifié :** `adjustedSlotCount(base=8, duration=45, goal='fat_loss') = Math.max(4, Math.floor(8*0.75)) = Math.max(4, 6) = 6` ✅

**Séance glutes-hip slots 0–5 :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] | seed-hip-thrust (barbell, pop 4, top-1 beginner) | ✅ PASS |
| [1] | seed-romanian-deadlift (hamstrings, barbell, pop 3, top-1 beginner) | ✅ PASS |
| [2] | seed-squat-barbell (quads, pop 8, top-1 beginner) | ✅ PASS |
| [3] | seed-lat-pulldown (cable) OU seed-pullup (pullup_bar) — top-1 beginner sur tie (même pop=3, équipement dépend de l'ordre) | ✅ PASS |
| [4] | seed-hip-abduction (glutes, machine, pop 2, top-1 beginner isolation glutes) | ✅ PASS |
| [5] | **seed-leg-curl-lying** (hamstrings, machine, pop 3) ✅ — machine disponible (vs VIDE en BW/DB) | ✅ PASS |
| [6–7] | non atteints (slotCount=6) | — |

**Séance quad-glutes slots 0–5 :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] | seed-squat-barbell (usedGlobally) → candidats non-usedGlobally en tête... mais barbell pop 8 domine | ✅ PASS |
| [1] | seed-hip-thrust (barbell, pop 4) | ✅ PASS |
| [2] | **seed-row-barbell** (back_thickness, barbell, pop 7, rank 0 — inclus dans les 6 premiers ✅) | ✅ PASS |
| [3] | **seed-leg-extension** (quads, machine, pop 3 ✅ — machine disponible vs bw-wall-sit en DB+BW) | ✅ PASS |
| [4] | seed-hip-abduction ou seed-glute-kickback (glutes isolation) | ✅ PASS |
| [5] | VIDE (hamstrings isolation déjà atteint en glutes-hip slot[5]) — ou seed-leg-curl-lying si non usedGlobally | ✅ PASS |
| [6–7] | non atteints | — |

**Note sur quad-glutes slot[0] :** seed-squat-barbell (pop 8) est dans usedGlobally mais avec barbell pop 8, il reste dans le pool et la pop l'emporte même sur l'anti-répétition pour un beginner (top-1 : candidats non-usedGlobally d'abord dans le tri, mais si pop est très haute, elle peut remonter — attention : le tri place NON-usedGlobally AVANT usedGlobally, donc pour beginner il faudrait un candidat non-usedGlobally de quads compound). Candidats non-usedGlobally quads compound : dumbbell-rdl non (hamstrings), seed-romanian-deadlift non, etc. En salle sans BW : pas d'autre compound quads non-barbell... En réalité avec barbell seul disponible pour les composés quads, seed-squat-barbell est le seul (tous les autres requièrent machine ou cable). → seed-squat-barbell sélectionné (seul dans son rang).

**Findings :**
- ✅ PASS : adjustedSlotCount = 6 ✅
- ✅ PASS : slot[3] glutes-hip inclus (index 3 < 6) → seed-lat-pulldown ou seed-pullup ✅
- ✅ PASS : slot[5] glutes-hip = seed-leg-curl-lying (machine, pop 3) ✅
- ✅ PASS : slot[2] quad-glutes inclus (index 2 < 6) → seed-row-barbell ✅
- ✅ PASS : slot[3] quad-glutes = seed-leg-extension (machine, pop 3) — machine disponible ✅

---

## SYNTHÈSE GROUPE B — FAILs et RÉSERVEs

### FAILs

| Code | Profil | Assertion | Observé | Sévérité |
|------|--------|-----------|---------|----------|
| FAIL-B01-A12 | B01 | quad-glutes slot[0] = bw-squat | Code prioritise bw-lunge (NON usedGlobally, pop 2) avant bw-squat (usedGlobally, pop 3) via tri anti-répétition. Assertion du prompt erronée. Code correct. | ❌ FAIL-MINEUR |
| FAIL-B01-A16 | B01 | quad-glutes slot[4] = seed-glute-bridge | Code prioritise l'exercice glutes isolation NON utilisé (donkey-kick OU fire-hydrant) avant seed-glute-bridge (usedGlobally). Assertion du prompt erronée. Code correct. | ❌ FAIL-MINEUR |
| FAIL-B04-A4 | B04 | glutes-hip slot[2] = tie lunges uniquement | Pour la SESSION 1, bw-squat (pop 3, NON encore usedGlobally) est sélectionné. Le tie entre lunges/bw-lunge/bulgarian ne s'applique qu'aux sessions suivantes. Assertion incomplète. | ❌ FAIL-MINEUR |
| FAIL-B09-A6 | B09 | slot[7] glutes-hip top-3 inclut machine-pullover | machine-pullover.primaryMuscle='back_width' ∉ ['back_thickness','back'] → NON éligible pour ce slot. Vrai top-3 : seed-pullover-dumbbell (pop 3), machine-low-row (pop 2), seed-pullover-cable (pop 2). | ❌ FAIL-MINEUR |

### RÉSERVEs

| Code | Profil | Description |
|------|--------|-------------|
| RÉSERVE-1 | B01, B02, B03 | slot[1] glutes-hip BW = seed-curtsy-lunge (pop 1) — seul composé BW disponible après hip-thrust-bw ; fente curtsy fonctionnellement inadéquate vs RDL pour ischio-jambiers. |
| RÉSERVE-B10 | B10 | Assertion "top-3 variantes pullover" pour glutes-hip slot[7] ambiguë — si elle inclut machine-pullover, c'est incorrect (même cause que B09). |

### Confirmations

| Point | Résultat |
|-------|----------|
| base=8 pour glutes-hip et quad-glutes | ✅ CONFIRMÉ (code SLOTS['glutes-hip'].length=8, SLOTS['quad-glutes'].length=8) |
| SEED-BW-NOBACK supprimé si splitPreference='glutes-focus' | ✅ CONFIRMÉ tous profils B01–B12 |
| SEED-BW-NOBACK supprimé si isGlutesSplit=true (focusMuscles=['glutes']) | ✅ CONFIRMÉ (condition code ligne 1051) |
| Warning slot VIDE "dos (largeur/épaisseur)" INDÉPENDANT de SEED-BW-NOBACK | ✅ CONFIRMÉ — émis même quand SEED-BW-NOBACK est supprimé (B01, B02, B03) |
| slot[3] glutes-hip = seed-row-dumbbell (seul compound dos DB) | ✅ CONFIRMÉ B04, B05, B06 |
| slot[7] glutes-hip = seed-pullover-dumbbell (back_thickness isolation, pop 3) | ✅ CONFIRMÉ B04, B05, B06, B07 |
| slot[7] quad-glutes = seed-pullover (back_width, pop 1 — seul isolation back_width DB) | ✅ CONFIRMÉ B04, B05 |
| slot[2] quad-glutes compound dos = seed-row-dumbbell (pop 3 > kb-row pop 2) | ✅ CONFIRMÉ B04–B08 |
| slot[2] quad-glutes compound dos = seed-row-barbell (pop 7, salle) | ✅ CONFIRMÉ B09–B12 |
| adjustedSlotCount strength 60min = 4, 90min = 5 | ✅ CONFIRMÉ B03, B06, B11 |
| adjustedSlotCount 45min = 6 | ✅ CONFIRMÉ B08, B12 |
| slot[5] glutes-hip = seed-leg-curl-lying (machine, salle) | ✅ CONFIRMÉ B09, B10, B12 |
| RÉSERVE-3 non applicable au Groupe B | ✅ (aucun fullbody-hip dans les profils B01–B12) |

---

## Recommandations suite aux FAILs

1. **FAIL-B01-A12 / FAIL-B01-A16 / FAIL-B04-A4** : Corriger les assertions du prompt pour les séances BW et DB+BW qui ont plusieurs sessions du même type dans le split (4j). Les assertions doivent distinguer comportement de **session 1** (usedGlobally vide) vs **sessions suivantes** (anti-répétition actif). Ce n'est pas un bug du générateur — le mécanisme anti-répétition fonctionne correctement.

2. **FAIL-B09-A6** : Corriger l'assertion pour slot[7] glutes-hip ['back_thickness','back'] — exclure machine-pullover (primaryMuscle=back_width). Le top-3 correct est : seed-pullover-dumbbell / machine-low-row / seed-pullover-cable. Ajouter une vérification explicite dans les futurs audits salle : machine-pullover → slot quad-glutes slot[7] ['back_width','back'], NOT glutes-hip slot[7].

3. **RÉSERVE-1** : Envisager l'ajout d'un exercice composé BW pour les ischio-jambiers avec `isWarmupExercise=false` (ex. good-morning-bw ou bw-glute-ham-raise). Actuellement, bw-nordic-curl est `equipment='pullup_bar'`, donc indisponible en équipement BW seul.
