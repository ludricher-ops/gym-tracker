# Analyse de couverture des audits v7/v8/v9 — programGenerator.ts
**Date :** 2026-09-07  
**Auteur :** Analyse statique + simulation manuelle

---

## 1. État du générateur post-v9 (référence)

### Exercices dos clés (post-fix SEED-PULLOVER-ISOLATION v9)

| id | primaryMuscle | equipment | category | pop |
|----|--------------|-----------|----------|-----|
| machine-lat-pulldown | back_width | machine | compound | 2 |
| seed-row-machine | back_thickness | machine | compound | 1 |
| machine-pullover | back_width | machine | **isolation** | 2 |
| machine-low-row | back_thickness | machine | **isolation** | 2 |
| seed-lat-pulldown | back_width | cable | compound | 3 |
| seed-row-cable | back_thickness | cable | compound | 2 |
| seed-pullover-cable | back_thickness | cable | isolation | 2 |
| seed-straight-arm-pulldown | back_thickness | cable | isolation | 2 |
| seed-pullup | back_width | pullup_bar | compound | 3 |
| bw-inverted-row | back_thickness | pullup_bar | compound | 1 |
| seed-pullover | back_width | dumbbell | **isolation** | 1 |
| seed-row-dumbbell | back_thickness | dumbbell | compound | 3 |
| seed-pullover-dumbbell | back_thickness | dumbbell | isolation | 3 |
| seed-shrug | back | dumbbell | isolation | 2 |
| seed-row-barbell | back_thickness | barbell | compound | 7 |
| seed-row-tbar | back_thickness | barbell | compound | 2 |
| seed-deadlift | back | barbell | compound | 3 |
| kb-row | back_thickness | kettlebell | compound | 2 |
| kb-deadlift | back | kettlebell | compound | 2 |
| kb-pullover | back_width | kettlebell | isolation | 1 |
| band-row | back_thickness | band | compound | 2 |

> **Rappel critique :** depuis v9, `seed-pullover` est `isolation` (pas compound). Il n'y a donc **aucun compound dos pour l'équipement dumbbell seul ayant `primaryMuscle=back_width`**. Le slot `['back_width','back_thickness'] compound:true` avec haltères seuls est servi uniquement par `seed-row-dumbbell` (back_thickness, rank 1 sur slotPrimary=back_width).

### Bases de slots par type de séance (code réel)

| Type | Slots définis (base) |
|------|----------------------|
| fullbody-quad | 9 |
| fullbody-hip | 9 |
| glutes-hip | **8** |
| quad-glutes | **8** |
| push, pull, legs | 8 |
| upper, upper-push, upper-pull | 8 (upper) / 8 (push/pull) |
| lower-quad, lower-hip, lower_pull | 8 |
| chest-back | 9 |
| back-bi, chest-tri | 8 |
| shoulders-arms | 8 |

> **Erreur de documentation v9 :** le tableau des bases en v9 indique `glutes-hip, quad-glutes : 6`. C'est faux — le code a **8 slots** pour ces deux types. Conséquence : `adjustedSlotCount(8, 45, fat_loss) = max(4, ⌊8×0.75⌋) = 6` (correct) mais la base de départ utilisée dans les calculs est toujours 8.

### adjustedSlotCount — formule de référence

| goal | 20 min | 45 min | 60 min | 90 min |
|------|--------|--------|--------|--------|
| strength | min(3, max(2, ⌊base×0.5⌋)) | min(3, max(2, ⌊base×0.5⌋)) | max(4, ⌊base×0.5⌋) | min(base, 5) |
| autres | max(2, ⌊base×0.5⌋) | max(4, ⌊base×0.75⌋) | base | min(base+2, 8) |

### Slots clés fullbody-quad (index 0–8)

```
[0] ['quads','glutes']                  compound  → Squat / presse
[1] ['chest','chest_upper']             compound  → Bench
[2] ['back_width','back_thickness','back'] compound → Tirage vertical
[3] ['shoulders','shoulders_front']     compound  → OHP
[4] ['hamstrings']                      isolation
[5] ['shoulders_rear']                  isolation
[6] ['biceps']                          isolation
[7] ['calves']                          isolation (pos 8, cap=8 → inclus)
[8] ['triceps']                         isolation (pos 9, éjecté si cap=8)
```

### Slots clés fullbody-hip (index 0–8)

```
[0] ['hamstrings','glutes']             compound  → RDL / Hip thrust
[1] ['chest','chest_upper']             compound  → Bench
[2] ['back_width','back_thickness','back'] compound → Tirage vertical
[3] ['shoulders','shoulders_front']     compound  → OHP
[4] ['quads']                           isolation
[5] ['shoulders_lateral','shoulders_rear'] isolation
[6] ['biceps']                          isolation
[7] ['calves']                          isolation (pos 8, inclus)
[8] ['triceps']                         isolation (pos 9, éjecté)
```

### Slots clés glutes-hip (index 0–7)

```
[0] ['glutes','hamstrings']             compound  → Hip thrust / Sumo DL
[1] ['hamstrings','glutes']             compound  → RDL
[2] ['quads','glutes']                  compound  → Fente bulgare
[3] ['back_width','back_thickness']     compound  → Lat pulldown (posture)
[4] ['glutes']                          isolation
[5] ['hamstrings']                      isolation
[6] ['glutes']                          isolation
[7] ['back_thickness','back']           isolation
```

### Slots clés quad-glutes (index 0–7)

```
[0] ['quads','glutes']                  compound  → Squat
[1] ['glutes','hamstrings']             compound  → Hip thrust
[2] ['back_thickness','back']           compound  → DB row / seated row
[3] ['quads']                           isolation
[4] ['glutes']                          isolation
[5] ['hamstrings']                      isolation
[6] ['calves']                          isolation
[7] ['back_width','back']               isolation
```

---

## 2. workoutTypeFromFocus — analyse des cas pertinents

### workoutTypeFromFocus(['glutes'])
→ `hasGlutes=true`, `!hasUpper`, `!hasLower` → **retourne 'glutes-hip'**  
Confirmé en v7:P36, v8:P86, v9:P19.

### workoutTypeFromFocus(['glutes','back'])
→ `hasPull=true` ('back' présent), `!hasPush`, `!hasLower`  
→ check `hasPull && !hasPush && !hasLower` = **true → retourne 'pull'**  
La vérification `hasGlutes` n'est atteinte qu'après ce bloc, donc elle ne s'exécute pas.  
Résultat : split de type pull (`['pull','upper-pull','pull']` pour 3j) — **jamais testé dans aucun audit**.

### workoutTypeFromFocus(['glutes','legs'])
→ `hasLower=true`, `!hasUpper` → retourne 'lower' → alternance lower-quad/lower-hip  
Non testé.

---

## 3. INC-1 — conditions et splits produits

**Déclenchement :** `goal === 'strength' && level !== 'beginner'` + pas de splitPreference explicite + `daysPerWeek === 3`  
→ split = `['fullbody-quad','fullbody-hip','fullbody-quad']`

| Condition | INC-1 ? |
|-----------|---------|
| strength + intermediate + 3j + auto | **OUI** |
| strength + advanced + 3j + auto | **OUI** |
| strength + beginner + 3j + auto | NON (fullbody débutant de base) |
| hypertrophy + intermediate + 3j + auto | NON (PPL) |
| strength + intermediate + 3j + splitPreference=ppl | NON (PPL explicite prime) |
| strength + intermediate + 2j | NON (2j → fullbody-quad/hip de toute façon) |
| strength + intermediate + 4j | NON (4j mass → upper-lower) |

Couverture INC-1 dans les audits :
- v7:P11 (machine, INC-1), v7:P14 (DB, INC-1), v7:P20 (barbell, INC-1), v7:P33 (salle complète)
- v8:P03/P04 (machine, strength, INC-1 vs beginner), v8:P08/P09 (machine, 20/45min strength)
- v8:P29 (barbell, 45min strength), v8:P49/P50 (BW, INC-1)
- v9:P10 (machine, INC-1 60min strength, 4 slots)

**Trous INC-1 :** DB+BW combo (jamais testé), KB+DB+BW (jamais), BW+pullup_bar (partiellement).

---

## 4. Tableau de couverture : Fullbody × 4 équipements

### Légende
- ✅ **Couvert** : exercices sélectionnés vérifiés, slots analysés
- ⚠️ **Partiel** : split/warning confirmé mais exercices des slots non analysés
- ❌ **Non couvert** : aucun profil testé pour cette combinaison

---

### A1. Fullbody × Salle complète (barbell+dumbbell+cable+pullup_bar+machine)

**Statut : ⚠️ Partiel**

Profils couverts :
- v7:P33 → INC-1, strength, 3j, 60min : fullbody-quad slot[2] = seed-pullup ou seed-lat-pulldown ✅
- v8:P71 → beginner, 3j, 90min, hypertrophy : 8 slots ✅
- v8:P80 → beginner, 2j, 90min : 8 slots ✅
- v8:P34 → P36 (régression globale PPL, pas fullbody)

**Exercices attendus aux slots critiques (60min, salle complète) :**

| Slot | fullbody-quad | fullbody-hip |
|------|---------------|--------------|
| [0] compound | seed-squat-barbell (quads, pop 8) | seed-romanian-deadlift (hamstrings, pop 3) ou seed-hip-thrust (glutes, pop 4) |
| [1] compound | seed-bench-barbell (chest, pop 8) | seed-bench-barbell (chest, pop 8) |
| [2] compound | seed-pullup ou seed-lat-pulldown (back_width, pop 3, tie aléatoire intermediate) | idem |
| [3] compound | seed-ohp-barbell (shoulders, pop 3) | seed-ohp-barbell |

**Trous :** fullbody 4j et 5j salle complète jamais testés. Hypertrophy 3j 60min non-INC-1 salle complète jamais testé (serait PPL auto, pas fullbody).

---

### A2. Fullbody × Haltères + poids du corps (dumbbell + bodyweight)

**Statut : ❌ Non couvert (combo DB+BW)**

Les audits v7/v8/v9 testent soit `dumbbell seul`, soit `bodyweight seul`, jamais la combinaison DB+BW pour des séances fullbody.

**Simulation manuelle — fullbody-quad × DB+BW, 60min, hypertrophy, beginner, splitPreference='fullbody' :**

| Slot | Exercice sélectionné | Raison |
|------|---------------------|--------|
| [0] ['quads','glutes'] compound | **bw-squat** (pop 3) | bw-squat (BW,3) > seed-lunges (DB,2) sur popularité |
| [1] ['chest','chest_upper'] compound | **seed-bench-dumbbell** (DB, pop 3) | seed-bench-dumbbell > seed-pushup (pop 2) |
| [2] ['back_width','back_thickness','back'] compound | **seed-row-dumbbell** (back_thickness, pop 3) | seul compound dos disponible — seed-pullover est désormais isolation ; slotPrimary=back_width non matché (rank 1) mais seul candidat |
| [3] ['shoulders','shoulders_front'] compound | **seed-shoulder-press-dumbbell** (pop 3) | > seed-arnold-press (pop 2) > bw-pike-pushup (pop 1) |
| [4] ['hamstrings'] isolation | **VIDE** | aucune isolation hamstrings non-warmup en DB+BW |
| [5] ['shoulders_rear'] isolation | **seed-rear-delt-fly** (DB, pop 2) | seul candidat ✅ |
| [6] ['biceps'] isolation | **seed-curl-dumbbell** (DB, pop 3) | ✅ |
| [7] ['calves'] isolation | **seed-calf-raise-db** (DB, pop 2) | ✅ |
| [8] ['triceps'] isolation (éjecté à 60min) | — | cap=8, slot[8] non atteint |

**Simulation fullbody-hip × DB+BW, mêmes paramètres :**

| Slot | Exercice sélectionné | Raison |
|------|---------------------|--------|
| [0] ['hamstrings','glutes'] compound | **dumbbell-rdl** (hamstrings, DB, pop 2) | slotPrimary=hamstrings → rank 0 ; > seed-hip-thrust-bw (glutes, BW, pop 3 mais rank 1) |
| [1] ['chest','chest_upper'] compound | **seed-bench-dumbbell** (pop 3) | ✅ |
| [2] ['back_width','back_thickness','back'] compound | **seed-row-dumbbell** (usedGlobally) | usedGlobally → seed-row-dumbbell priorité basse → si aucun autre : seed-row-dumbbell quand même (seul compound dos) |
| [3] ['shoulders','shoulders_front'] compound | **seed-shoulder-press-dumbbell** (pop 3) | ✅ |
| [4] ['quads'] isolation | **bw-wall-sit** (BW, pop 2) | seul candidat isolation quads BW+DB (leg extension = machine) |
| [5] ['shoulders_lateral','shoulders_rear'] isolation | **seed-lateral-raise** (DB, pop 3) | shoulders_lateral ∈ slot.muscles ✅ |
| [6] ['biceps'] isolation | **seed-curl-dumbbell** (pop 3) ou seed-curl-hammer (pop 3) | tie aléatoire |
| [7] ['calves'] isolation | **seed-calf-raise-db** (pop 2) | ✅ |

**Points notables DB+BW :**
- slot[2] dos utilise seed-row-dumbbell à chaque séance du split (back_thickness, pas back_width) → aucune variété pour le tirage vertical
- slot[4] fullbody-hip quads isolation → bw-wall-sit (time-based, pas weight_reps) — comportement inhabituel
- aucun slot vide critique hormis hamstrings isolation (non bloquant)

---

### A3. Fullbody × Haltères + poids du corps + kettlebell (dumbbell + bodyweight + kettlebell)

**Statut : ❌ Non couvert**

Jamais testé dans aucun audit.

**Simulation manuelle — fullbody-quad × KB+DB+BW, 60min, hypertrophy, intermediate :**

| Slot | Exercice sélectionné | Raison |
|------|---------------------|--------|
| [0] ['quads','glutes'] compound | **seed-goblet-squat** (KB, pop 3) ou **bw-squat** (BW, pop 3) | tie popularité → aléatoire intermediate top-3 |
| [1] ['chest','chest_upper'] compound | **seed-bench-dumbbell** (DB, pop 3) | > bw-pike-pushup (pop 1), pas de KB chest compound si kb-floor-press non dispo... kb-floor-press (chest, KB, pop 2) < seed-bench-dumbbell (pop 3) |
| [2] ['back_width','back_thickness','back'] compound | **seed-row-dumbbell** (back_thickness, DB, pop 3) | > kb-row (pop 2) > kb-deadlift (pop 2) sur popularité, tous rank 1 sur slotPrimary=back_width |
| [3] ['shoulders','shoulders_front'] compound | **seed-shoulder-press-dumbbell** (DB, pop 3) | > kb-press (pop 2) > bw-pike-pushup (pop 1) |
| [4] ['hamstrings'] isolation | **VIDE** | aucune isolation hamstrings en DB+BW+KB (leg curl = machine) |
| [5] ['shoulders_rear'] isolation | **seed-rear-delt-fly** (DB, pop 2) | ✅ |
| [6] ['biceps'] isolation | **seed-curl-dumbbell** (DB, pop 3) | > kb-curl (pop 1) |
| [7] ['calves'] isolation | **seed-calf-raise-db** (DB, pop 2) | > kb-calf-raise (pop 1) |

**fullbody-hip × KB+DB+BW, slot[0] :**
- kb-rdl (hamstrings, KB, pop 2) : rank 0 (slotPrimary=hamstrings) et non utilisé
- dumbbell-rdl (hamstrings, DB, pop 2) : rank 0, non utilisé
- Tie → aléatoire intermediate top-3

---

### A4. Fullbody × Poids du corps seul (bodyweight)

**Statut : ⚠️ Partiel — warnings confirmés, exercices jamais analysés**

Profils couverts (warning uniquement) :
- v7:P26 (beginner, 3j) et v7:P28 (beginner, 2j) → SEED-BW-NOBACK émis ✅
- v8:P42/P44 (beginner) → idem
- v8:P49/P50 (intermediate, INC-1) → SEED-BW-NOBACK + fullbody générée

**Exercices disponibles en BW seul (non-warmup, non-supprimés) pour les slots fullbody :**

| Muscle | Compound BW | Isolation BW |
|--------|-------------|--------------|
| quads | bw-squat (pop 3), bw-lunge (pop 2), bw-jump-squat (pop 1) | bw-wall-sit (pop 2) |
| chest | seed-pushup (pop 2) | — |
| chest_upper | bw-incline-pushup (pop 2) | — |
| hamstrings | **AUCUN non-warmup** | — |
| glutes | seed-hip-thrust-bw (pop 3), seed-curtsy-lunge (pop 1) | seed-glute-bridge (pop 3), seed-donkey-kick (pop 2), seed-fire-hydrant (pop 2) |
| shoulders | bw-pike-pushup (pop 1) | — |
| back_width | **AUCUN** | — |
| back_thickness | **AUCUN** | — |
| calves | — | bw-calf-raise (pop 2) |
| biceps | — | **AUCUN** |
| triceps | — | **AUCUN** |
| shoulders_rear | — | **AUCUN** (band-face-pull = band, pas BW) |
| shoulders_lateral | — | **AUCUN** |

**Simulation complète — fullbody-quad × BW seul, 60min, hypertrophy, beginner :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] ['quads','glutes'] compound | **bw-squat** (pop 3, slotPrimary=quads → rank 0) | ✅ |
| [1] ['chest','chest_upper'] compound | **seed-pushup** (chest, pop 2, rank 0) > bw-incline-pushup (chest_upper, rank 1) | ✅ |
| [2] ['back_width','back_thickness','back'] compound | **VIDE** — aucun compound dos en BW | ⚠️ WARNING émis : "Aucun exercice composé disponible pour dos (largeur)" |
| [3] ['shoulders','shoulders_front'] compound | **bw-pike-pushup** (pop 1) | ✅ seul candidat |
| [4] ['hamstrings'] isolation | **VIDE** — aucune isolation hamstrings en BW non-warmup | silencieux |
| [5] ['shoulders_rear'] isolation | **VIDE** | silencieux |
| [6] ['biceps'] isolation | **VIDE** | silencieux |
| [7] ['calves'] isolation | **bw-calf-raise** (pop 2) | ✅ |
| [8] ['triceps'] isolation (éjecté) | — | — |
| warmup | exercice BW ou bodyweight | ✅ |
| core | seed-crunch / seed-plank / etc. | ✅ |

**Séance effective :** 4 exercices réels (squat, pushup, pike pushup, calf raise) + 1 warning + warmup + core.

**Simulation — fullbody-hip × BW seul, 60min :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] ['hamstrings','glutes'] compound | **seed-hip-thrust-bw** (glutes, pop 3) — glutes ∈ liste mais slotPrimary=hamstrings → rank 1 ; seul candidat glutes/hamstrings compound BW | ✅ |
| [1] ['chest','chest_upper'] compound | **seed-pushup** (pop 2) | ✅ |
| [2] ['back_width','back_thickness','back'] compound | **VIDE** | ⚠️ WARNING |
| [3] ['shoulders','shoulders_front'] compound | **bw-pike-pushup** (pop 1) | ✅ |
| [4] ['quads'] isolation | **bw-wall-sit** (pop 2) | ✅ |
| [5] ['shoulders_lateral','shoulders_rear'] isolation | **VIDE** | silencieux |
| [6] ['biceps'] isolation | **VIDE** | silencieux |
| [7] ['calves'] isolation | **bw-calf-raise** (pop 2) | ✅ |

---

## 5. Tableau de couverture : Glutes+Dos × 4 équipements

> **Rappel split :** `splitPreference='glutes-focus'` → `['glutes-hip','quad-glutes']` alternés.  
> `focusMuscles=['glutes']` → `workoutTypeFromFocus` → 'glutes-hip' → même split (fix v9).  
> `focusMuscles=['glutes','back']` → `workoutTypeFromFocus` → **'pull'** (hasPull prime) → split pull/upper-pull.

---

### B1. Glutes+Dos × Salle complète

**Statut : ⚠️ Partiel**

Profils couverts :
- v7:P08 (machine seul, glutes-focus 4j) : slot[3] glutes-hip = machine-lat-pulldown ✅
- v7:P23 (DB seul, glutes-focus 4j) : slot[3] = seed-pullover (était compound à l'époque) → **obsolète post-v9**
- v7:P36 (salle complète, focusMuscles=['glutes']) : slot[3] ✅
- v8:P15 (machine 3j), P76/P77 (DB+machine, 20/45min)
- v9:P28 (machine, glutes-hip slot[3] = machine-pullover isolation → slot[7])

**Exercices attendus — glutes-hip × salle complète, 60min :**

| Slot | Exercice attendu |
|------|-----------------|
| [0] ['glutes','hamstrings'] compound | seed-hip-thrust (barbell, pop 4) ou seed-hip-thrust-machine (machine, pop 3) |
| [1] ['hamstrings','glutes'] compound | seed-romanian-deadlift (barbell, pop 3) |
| [2] ['quads','glutes'] compound | seed-squat-barbell (pop 8) — slotPrimary=quads |
| [3] ['back_width','back_thickness'] compound | seed-lat-pulldown (cable, pop 3) ou seed-pullup (pullup_bar, pop 3) |
| [4] ['glutes'] isolation | seed-hip-abduction (machine, pop 2) ou seed-glute-kickback (cable, pop 1) |
| [5] ['hamstrings'] isolation | seed-leg-curl-lying (machine, pop 3) |
| [6] ['glutes'] isolation | variante abducteur |
| [7] ['back_thickness','back'] isolation | seed-pullover-dumbbell (back_thickness, pop 3) ou seed-pullover-cable (pop 2) |

---

### B2. Glutes+Dos × Haltères + poids du corps (dumbbell + bodyweight)

**Statut : ❌ Non couvert (combo DB+BW)**

v7:P23 teste `dumbbell seul` glutes-focus, pas la combinaison DB+BW.

**Simulation — glutes-hip × DB+BW, 60min, fat_loss, intermediate :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] ['glutes','hamstrings'] compound | **seed-hip-thrust-bw** ou dumbbell-rdl — slotPrimary=glutes → seed-hip-thrust-bw (glutes, BW, pop 3, rank 0) vs dumbbell-rdl (hamstrings, DB, pop 2, rank 1) → seed-hip-thrust-bw | ✅ |
| [1] ['hamstrings','glutes'] compound | **dumbbell-rdl** (hamstrings, DB, pop 2, slotPrimary=hamstrings, rank 0) — usedGlobally: seed-hip-thrust-bw déjà utilisé | ✅ |
| [2] ['quads','glutes'] compound | **seed-lunges** (quads, DB, pop 2) ou **bw-lunge** (BW, pop 2) — seed-bulgarian-split-squat (DB, pop 2) → tie → aléatoire | ✅ |
| [3] ['back_width','back_thickness'] compound | **seed-row-dumbbell** (back_thickness, DB, pop 3) — seed-pullover est isolation → exclu ; seed-row-dumbbell seul compound dos dumbbell, slotPrimary=back_width non matché (rank 1) | ✅ seul candidat |
| [4] ['glutes'] isolation | **seed-glute-bridge** (BW, pop 3) ou seed-donkey-kick (BW, pop 2) | ✅ |
| [5] ['hamstrings'] isolation | **VIDE** — aucune isolation hamstrings en DB+BW | silencieux |
| [6] ['glutes'] isolation | **seed-donkey-kick** ou seed-fire-hydrant | ✅ |
| [7] ['back_thickness','back'] isolation | **seed-pullover-dumbbell** (back_thickness, DB, pop 3) | ✅ |

**Simulation — quad-glutes × DB+BW :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] ['quads','glutes'] compound | **seed-lunges** (quads, DB, pop 2) — bw-squat (pop 3) aussi disponible → bw-squat probablement sélectionné (pop 3) | ✅ |
| [1] ['glutes','hamstrings'] compound | **seed-hip-thrust-bw** (glutes, pop 3, rank 0 sur slotPrimary=glutes) | ✅ |
| [2] ['back_thickness','back'] compound | **seed-row-dumbbell** (back_thickness, DB, pop 3, slotPrimary=back_thickness → rank 0) | ✅ |
| [3] ['quads'] isolation | **bw-wall-sit** (BW, pop 2) — seul candidat | ✅ |
| [4] ['glutes'] isolation | **seed-glute-bridge** (pop 3) — si non usedInWorkout | ✅ |
| [5] ['hamstrings'] isolation | **VIDE** | silencieux |
| [6] ['calves'] isolation | **seed-calf-raise-db** (DB, pop 2) | ✅ |
| [7] ['back_width','back'] isolation | **seed-pullover** (back_width, DB, isolation, pop 1) — back_width ∈ ['back_width','back'] ✅ | ✅ |

---

### B3. Glutes+Dos × Haltères + poids du corps + kettlebell

**Statut : ❌ Non couvert**

**Simulation — glutes-hip × KB+DB+BW, 60min :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] ['glutes','hamstrings'] compound | **kb-swing** (glutes, KB, pop 3) ou **seed-hip-thrust-bw** (glutes, BW, pop 3) — tie → aléatoire top-3 intermediate | ✅ |
| [1] ['hamstrings','glutes'] compound | **kb-rdl** (hamstrings, KB, pop 2) ou **dumbbell-rdl** (hamstrings, DB, pop 2) — tie usedGlobally/pop → aléatoire | ✅ |
| [2] ['quads','glutes'] compound | **seed-goblet-squat** (quads, KB, pop 3) ou bw-squat (pop 3) — tie pop → top-3 aléatoire | ✅ |
| [3] ['back_width','back_thickness'] compound | **seed-row-dumbbell** (back_thickness, DB, pop 3) > kb-row (KB, pop 2) — tous rank 1 (slotPrimary=back_width non matché), usedGlobally → pop → seed-row-dumbbell | ✅ |
| [4] ['glutes'] isolation | **seed-glute-bridge** (BW, pop 3) | ✅ |
| [5] ['hamstrings'] isolation | **VIDE** (aucune isolation hamstrings KB+DB+BW) | silencieux |
| [6] ['glutes'] isolation | seed-donkey-kick / seed-fire-hydrant (pop 2) | ✅ |
| [7] ['back_thickness','back'] isolation | **seed-pullover-dumbbell** (back_thickness, DB, pop 3) > kb-pullover (back_width, KB, isolation, pop 1) | ✅ |

---

### B4. Glutes+Dos × Poids du corps seul

**Statut : ⚠️ Partiel — warning confirmed, exercices jamais analysés**

Profils couverts :
- v7:P32 (BW seul, glutes-focus 4j) : confirmé NO SEED-BW-NOBACK (via splitPreference='glutes-focus') ✅
- v8:P48 (BW seul, glutes-focus 4j) : idem ✅
- v9:P19 (BW seul, focusMuscles=['glutes'], isGlutesSplit=true) : pas de warning ✅

Aucun audit n'a analysé les exercices sélectionnés.

**Simulation — glutes-hip × BW seul, 60min, fat_loss, intermediate :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] ['glutes','hamstrings'] compound | **seed-hip-thrust-bw** (glutes, BW, pop 3) | ✅ |
| [1] ['hamstrings','glutes'] compound | usedInWorkout: seed-hip-thrust-bw → **seed-curtsy-lunge** (glutes, BW, pop 1) seul compound restant (glutes ∈ liste) | ⚠️ RÉSERVE : remplacement très faible (fente curtsy ≠ RDL) |
| [2] ['quads','glutes'] compound | **bw-squat** (quads, BW, pop 3) | ✅ |
| [3] ['back_width','back_thickness'] compound | **VIDE** — aucun compound dos en BW | ⚠️ WARNING émis : "Aucun exercice composé disponible pour dos (largeur)" |
| [4] ['glutes'] isolation | **seed-glute-bridge** (pop 3) | ✅ |
| [5] ['hamstrings'] isolation | **VIDE** | silencieux |
| [6] ['glutes'] isolation | **seed-donkey-kick** ou seed-fire-hydrant (pop 2) | ✅ |
| [7] ['back_thickness','back'] isolation | **VIDE** — aucun isolation dos en BW | silencieux |

**Simulation — quad-glutes × BW seul :**

| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] ['quads','glutes'] compound | **bw-squat** (quads, BW, pop 3) | ✅ |
| [1] ['glutes','hamstrings'] compound | **seed-hip-thrust-bw** (glutes, pop 3) | ✅ |
| [2] ['back_thickness','back'] compound | **VIDE** — aucun compound dos en BW | ⚠️ WARNING |
| [3] ['quads'] isolation | **bw-wall-sit** (pop 2) | ✅ |
| [4] ['glutes'] isolation | **seed-glute-bridge** (pop 3) | ✅ |
| [5] ['hamstrings'] isolation | **VIDE** | silencieux |
| [6] ['calves'] isolation | **bw-calf-raise** (pop 2) | ✅ |
| [7] ['back_width','back'] isolation | **VIDE** (aucune isolation back_width/back en BW non-warmup) | silencieux |

---

## 6. Tableau récapitulatif synthétique

### Fullbody (fullbody-quad / fullbody-hip)

| Équipement | Couvert ? | Profil(s) de référence | Verdict |
|------------|-----------|------------------------|---------|
| Salle complète | ⚠️ Partiel | v7:P33, v8:P71, v8:P80 | INC-1 strength ok ; hypertrophy fullbody 3j/4j/5j manquant |
| DB + BW | ❌ Non couvert | — | Tous slots à tester ; slot[2] dos = seed-row-dumbbell (seul compound) |
| DB + BW + KB | ❌ Non couvert | — | Tous slots à tester |
| BW seul | ⚠️ Partiel | v7:P26/P28, v8:P42/P49 | Warning SEED-BW-NOBACK confirmé ; exercices jamais analysés ; slot[2] VIDE, slot[4] VIDE |

### Glutes + dos (glutes-hip / quad-glutes via glutes-focus)

| Équipement | Couvert ? | Profil(s) de référence | Verdict |
|------------|-----------|------------------------|---------|
| Salle complète | ⚠️ Partiel | v7:P08, v7:P36, v8:P15, v9:P28 | slot[3] ok ; autres slots glutes peu vérifiés |
| DB + BW | ❌ Non couvert | — | slot[3] glutes-hip = seed-row-dumbbell (seul compound dos DB) |
| DB + BW + KB | ❌ Non couvert | — | Tous slots à tester |
| BW seul | ⚠️ Partiel | v7:P32, v8:P48, v9:P19 | Warning absent confirmé ; slot[3] glutes-hip VIDE ; slot[2] quad-glutes VIDE ; slot[1] glutes-hip très faible (curtsy lunge) |

---

## 7. Anomalies et bugs identifiés lors de l'analyse

### BUG-DOC-1 — Erreur base=6 pour glutes-hip/quad-glutes dans v9
**Source :** tableau "Base par type de séance" dans audit_prompt_v9.md  
**Valeur erronée :** `glutes-hip, quad-glutes : 6`  
**Valeur réelle (code) :** SLOTS['glutes-hip'].length = **8**, SLOTS['quad-glutes'].length = **8**  
**Impact :** les calculs adjustedSlotCount corrects (v8:P76 → max(4,⌊8×0.75⌋)=6 est correct, base=8 est bien utilisé), mais la documentation induit en erreur pour tout audit futur.  

### RÉSERVE-1 — glutes-hip slot[1] avec BW seul : seed-curtsy-lunge très faible
**Condition :** BW seul + glutes-hip + slot[1] `['hamstrings','glutes'] compound`  
**Problème :** seed-hip-thrust-bw usedInWorkout (slot[0]) → seul composé restant = seed-curtsy-lunge (glutes, pop 1). Une fente curtsy n'est pas fonctionnellement équivalente à un RDL pour les ischio-jambiers.  
**Recommandation audit :** vérifier si un compound hamstrings BW devrait être ajouté (ex. good-morning-bw en non-warmup).

### RÉSERVE-2 — workoutTypeFromFocus(['glutes','back']) retourne 'pull' (contre-intuitif)
**Comportement :** l'utilisateur qui cible fessiers+dos obtient un split pull/upper-pull, non un split glutes-hip/quad-glutes.  
**Raison :** dans workoutTypeFromFocus, le check `hasPull && !hasPush && !hasLower` passe avant le check `hasGlutes`.  
**Impact :** jamais documenté, jamais testé. L'utilisateur reçoit des séances purement dos sans fessiers.  
**Recommandation audit :** tester explicitement focusMuscles=['glutes','back'] → confirmer split et émettre un UX warning.

### RÉSERVE-3 — slot[4] fullbody-hip quads isolation avec DB+BW : bw-wall-sit (time-based)
**Condition :** DB+BW + fullbody-hip + slot[4] `['quads'] isolation`  
**Problème :** seul candidat isolation quads sans machine = bw-wall-sit (trackingType='time'). Crée une incohérence dans la séance (les autres exercices sont en weight_reps).  
**Recommandation :** vérifier si un exercice isolation quads en DB existe (il n'y en a pas actuellement).

---

## 8. Liste ordonnée des trous prioritaires pour l'audit v10

### Priorité 1 — Trous critiques (comportement jamais observé)

**P1.1 — fullbody-quad/hip × BW seul : exercices sélectionnés**
- Profil : `goal=hypertrophy, days=2, duration=60, equipment=[bodyweight], level=beginner, splitPreference='fullbody'`
- Assertions clés : slot[2] VIDE + warning dos, slot[3] = bw-pike-pushup, slot[4] VIDE hamstrings, séance à 4 exercices effectifs
- Second profil : `strength, intermediate, 3j` → INC-1 + SEED-BW-NOBACK

**P1.2 — glutes-hip/quad-glutes × BW seul : exercices sélectionnés**
- Profil : `goal=fat_loss, days=3, duration=60, equipment=[bodyweight], level=intermediate, splitPreference='glutes-focus'`
- Assertions clés : slot[1] glutes-hip = seed-curtsy-lunge (⚠️ faible), slot[3] glutes-hip VIDE + warning, slot[2] quad-glutes VIDE + warning, slot[7] quad-glutes VIDE

**P1.3 — fullbody × DB+BW : exercices aux slots critiques**
- Profil A : `goal=hypertrophy, days=3, duration=60, equipment=[dumbbell,bodyweight], level=beginner, splitPreference='fullbody'`
- Assertions : slot[0] = bw-squat (pop 3 > seed-lunges pop 2), slot[2] = seed-row-dumbbell (seul compound dos), slot[4] VIDE hamstrings, slot[7] = bw-calf-raise ou seed-calf-raise-db
- Profil B : `goal=strength, days=3, equipment=[dumbbell,bodyweight], level=intermediate` → INC-1 fullbody, adjustedSlotCount(9,60,strength)=4 → vérifier que slot[2] dos reste rempli avec 4 slots

**P1.4 — glutes-hip/quad-glutes × DB+BW : exercices aux slots critiques**
- Profil : `goal=fat_loss, days=4, duration=60, equipment=[dumbbell,bodyweight], level=intermediate, splitPreference='glutes-focus'`
- Assertions : slot[3] glutes-hip = seed-row-dumbbell (seul compound dos, slotPrimary non matché), slot[7] glutes-hip = seed-pullover-dumbbell, slot[2] quad-glutes = seed-row-dumbbell, slot[7] quad-glutes = seed-pullover (back_width isolation, pop 1)

**P1.5 — workoutTypeFromFocus(['glutes','back']) → 'pull' : confirmation et UX**
- Profil : `goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate, focusMuscles=['glutes','back']`
- Assertions : workoutTypeFromFocus → 'pull' (pas 'glutes-hip'), split = ['pull','upper-pull','pull'], vérifier si UX-6 warning émis ("sélection complète" ou "push+pull+jambes") — probablement NON (pas de legs, pas de hasFocusLower)
- Point coach : l'utilisateur attendrait un split fessiers+dos, reçoit un split purement dos

### Priorité 2 — Trous partiels (comportement connu mais incomplet)

**P2.1 — fullbody × KB+DB+BW : all slots**
- Profil : `goal=hypertrophy, days=3, duration=60, equipment=[kettlebell,dumbbell,bodyweight], level=intermediate, splitPreference='fullbody'`
- Assertions : slot[0] = seed-goblet-squat (KB, pop 3) vs bw-squat (pop 3) → tie → aléatoire, slot[2] = seed-row-dumbbell (DB, pop 3) > kb-row (KB, pop 2)

**P2.2 — glutes-hip/quad-glutes × KB+DB+BW**
- Profil : `goal=fat_loss, days=4, equipment=[kettlebell,dumbbell,bodyweight], splitPreference='glutes-focus'`
- Assertions : slot[0] kb-swing vs seed-hip-thrust-bw, slot[3] glutes-hip = seed-row-dumbbell (pop 3) > kb-row (pop 2)

**P2.3 — INC-1 × DB+BW : vérifier que le slot dos (4 slots strength) reste servi**
- Profil : `goal=strength, days=3, duration=60, equipment=[dumbbell,bodyweight], level=intermediate`
- adjustedSlotCount(9,60,strength)=max(4,⌊9×0.5⌋)=4 → slots 0,1,2,3 seulement → slot[2] dos = seed-row-dumbbell ✅ probable

**P2.4 — Glutes-focus strength (jamais testé)**
- Profil : `goal=strength, days=3, duration=60, equipment=[barbell,dumbbell,machine], level=intermediate, splitPreference='glutes-focus'`
- INC-1 ne se déclenche pas (splitPreference explicite overrides auto) → split glutes-hip/quad-glutes
- adjustedSlotCount(8,60,strength)=max(4,⌊8×0.5⌋)=**4** → slot[3] glutes-hip (dos compound) inclus dans les 4 premiers → ok

**P2.5 — Fullbody 4j et 5j salle complète**
- Profil 4j : `goal=hypertrophy, days=4, equipment=[barbell,dumbbell,cable,pullup_bar,machine], level=intermediate, splitPreference='fullbody'`
- Profil 5j : idem, days=5

**P2.6 — Erreur de documentation base glutes-hip/quad-glutes (BUG-DOC-1)**
- Corriger le tableau des bases dans audit_prompt_v9.md et tout document futur : base=8 pour glutes-hip et quad-glutes (pas 6)

### Priorité 3 — Cas limites (vérification fine)

**P3.1 — BW seul + glutes-focus : warning slot VIDE correctement émis (pas supprimé)**
- Vérifier que le warning "Aucun exercice composé disponible pour dos (largeur)" est bien émis pour glutes-hip slot[3] avec BW seul, même quand SEED-BW-NOBACK est supprimé (splitPreference='glutes-focus' ou isGlutesSplit=true). Les deux mécanismes sont indépendants.

**P3.2 — quad-glutes slot[2] `['back_thickness','back'] compound` avec BW seul**
- Ce slot est compound:true → VIDE avec BW → warning "Aucun exercice composé disponible pour dos (épaisseur)" — à confirmer explicitement

**P3.3 — Glutes-hip 90min BW seul : adjustedSlotCount = min(8,5)=5 pour strength**
- Profil : `goal=strength, days=3, duration=90, equipment=[bodyweight], splitPreference='glutes-focus'`
- adjustedSlotCount(8,90,strength)=min(8,5)=**5** → slots 0,1,2,3,4 → slot[3] dos compound VIDE

**P3.4 — seed-curtsy-lunge comme substitut dans slot[1] glutes-hip BW : réserve à documenter**
- Confirmer que seed-curtsy-lunge (glutes, compound, BW, pop 1) est bien le seul exercice restant après seed-hip-thrust-bw
- Coach remark : envisager l'ajout de bw-good-morning non-warmup ou de bw-rdl

---

## 9. Résumé exécutif

**Couverture actuelle (v7+v8+v9) :**
- ✅ Complète : machine seul (tous aspects), salle complète (slots dos), BW warnings, BUG-BW-PULL élargi, INC-1, ajustements durée×slots, focus muscles (sauf glutes+back), glutes-focus avec équipements chargés
- ⚠️ Partielle : fullbody BW seul (warnings ok, exercices non), glutes-focus BW seul (warnings ok, exercices non), salle complète non-INC-1
- ❌ Absente : tout combo DB+BW, tout combo KB+DB+BW, workoutTypeFromFocus(['glutes','back'])

**8 profils recommandés pour v10 (minimum viable) :**
1. fullbody × BW seul, 60min, hypertrophy, beginner (P1.1)
2. glutes-hip+quad-glutes × BW seul, 60min, fat_loss, intermediate (P1.2)
3. fullbody × DB+BW, 60min, hypertrophy, beginner (P1.3a)
4. fullbody × DB+BW, INC-1 strength, 60min, intermediate (P1.3b)
5. glutes-focus × DB+BW, 60min, fat_loss, intermediate (P1.4)
6. focusMuscles=['glutes','back'] × salle, 60min (P1.5)
7. fullbody × KB+DB+BW, 60min (P2.1)
8. glutes-focus × KB+DB+BW, 60min (P2.2)
