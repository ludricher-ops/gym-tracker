# Audit P58–P68 — Groupe G : Nouveaux équipements pullup_bar + cardio_machine (v5)
**Date :** 2026-09-06
**Fichiers lus :** programGenerator.ts + exercises-seed.json (131 exercices) + audit_prompt_v3.md
**Changements depuis v4 :** BUG-1 (strength 90min → cap 5 slots) · SEED-1 (seed-calf-raise-db) · SEED-2 (band-face-pull + bw-prone-y-raise) · SEED-3 (seed-hip-thrust-machine) · EQUIP-5 wizard (availableCount exclut cardio) · P59 warning wizard (BW+!pullup_bar)

---

## Inventaire exercices pullup_bar (non-warmup)

| id | primaryMuscle | category | pop |
|----|--------------|----------|-----|
| seed-pullup | back_width | compound | 3 |
| bw-chinup | biceps | compound | 3 |
| seed-dips | chest_lower | compound | 3 |
| seed-triceps-dips | triceps | compound | 2 |
| bw-inverted-row | back_thickness | compound | 1 |
| bw-nordic-curl | hamstrings | compound | 2 |
| seed-hanging-leg-raise | core | isolation | 2 |

## Inventaire exercices cardio_machine (non-warmup)

| id | primaryMuscle | category | pop |
|----|--------------|----------|-----|
| seed-treadmill | cardio | compound | 2 |
| seed-elliptical | cardio | compound | 2 |
| seed-rowing-erg | cardio | compound | 2 |
| seed-cycling | cardio | compound | 2 |

---

## P58 — Outdoor preset (BW+BAR) 3j intermediate hypertrophy

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:['bodyweight','pullup_bar'], level:'intermediate' }
```

**Simulation :**

**Étape 1** — `workoutTypeFromFocus(undefined)` → `null` (focusMuscles absent)

**Étape 2** — `selectSplit` : isMass=true (hypertrophy) + intermediate + 3j → case 3, branche `isMass && level !== 'beginner'`
→ Split = `['push', 'pull', 'legs']` (PPL)

**Étape 3** — `adjustedSlotCount(base, 60, 'hypertrophy')` : isStrength=false → retourne `base`
- push : base=6 → 6 slots
- pull : base=6 → 6 slots
- legs : base=6 → 6 slots

**autoProgress / progressStepKg :** `makeDraftWE` → equipment ∈ {bodyweight, pullup_bar} → progressStepKg=0, autoProgress=false pour tous.

**Pool disponible (equipment ∈ {bodyweight, pullup_bar}, !warmup, !deleted) :**
- chest compound : seed-pushup(BW,pop=2), seed-dips(pullup_bar,pop=3), bw-incline-pushup(BW,pop=2)
- shoulders compound : bw-pike-pushup(BW,pop=1)
- back_width compound : seed-pullup(pullup_bar,pop=3)
- back_thickness compound : bw-inverted-row(pullup_bar,pop=1)
- biceps compound : bw-chinup(pullup_bar,pop=3) [aucune isolation biceps BW+BAR]
- triceps compound : seed-triceps-dips(pullup_bar,pop=2) [aucune isolation triceps BW+BAR]
- quads compound : bw-squat(BW,pop=3), bw-lunge(BW,pop=2), bw-jump-squat(BW,pop=1)
- hamstrings compound : bw-nordic-curl(pullup_bar,pop=2)
- glutes compound : seed-hip-thrust-bw(BW,pop=3), seed-curtsy-lunge(BW,pop=1)
- glutes isolation : seed-glute-bridge(BW,pop=3), seed-donkey-kick(BW,pop=2), seed-fire-hydrant(BW,pop=2)
- quads isolation : bw-wall-sit(BW,pop=2)
- calves isolation : bw-calf-raise(BW,pop=2)
- [aucun] shoulders_lateral, shoulders_rear, forearms, chest isolation en BW+BAR

**Specs hypertrophy :** COMPOUND=4×8-12 (90s), ISOLATION=3×10-15 (75s)

---

### Table des exercices — Push (workout index 0)

Slots push : 1·{chest,cmp} 2·{shoulders,cmp} 3·{chest,iso} 4·{triceps,iso} 5·{shoulders_lateral,iso} 6·{shoulders_rear,iso}

| # | Slot (muscles / type) | Top-3 candidats (pop desc) | Exercice retenu* | Séries×Reps |
|---|----------------------|---------------------------|-----------------|-------------|
| 0 | warmup | seed-jumping-jacks(BW,warmup) | seed-jumping-jacks | 2×10 |
| 1 | chest compound | seed-pushup(2), seed-dips(3), bw-incline-pushup(2) | **seed-pushup** (slotPrimary=chest match) | 4×8-12 |
| 2 | shoulders compound | bw-pike-pushup(1) | **bw-pike-pushup** | 4×8-12 |
| 3 | chest iso → cmp fallback | seed-dips(3), bw-incline-pushup(2) [seed-pushup usedInWorkout] | **seed-dips** (pop=3) | 3×10-15 |
| 4 | triceps iso → cmp fallback | seed-triceps-dips(2) | **seed-triceps-dips** | 3×10-15 |
| 5 | shoulders_lateral iso | — aucun candidat BW+BAR — | **null** (skipped) | — |
| 6 | shoulders_rear iso | — aucun candidat BW+BAR — | **null** (skipped) | — |
| 7 | core | seed-plank(BW,pop=3) | seed-plank | 3×15 |

*intermediate → top-3 random ; ici candidats[0] le plus probable par analyse déterministe (slotPrimary + pop)

Exercices réels : 4 (seed-pushup, bw-pike-pushup, seed-dips, seed-triceps-dips) + warmup + core = **6 total**

---

### Table des exercices — Pull (workout index 1)

Slots pull : 1·{back_width,cmp} 2·{back_thickness,cmp} 3·{back,iso} 4·{biceps,iso} 5·{shoulders_rear,iso} 6·{forearms,iso}

| # | Slot (muscles / type) | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|----------------------|-----------------|-----------------|-------------|
| 0 | warmup | seed-bird-dog(BW,pop=2) | seed-bird-dog | 2×10 |
| 1 | back_width compound | seed-pullup(pullup_bar,pop=3) | **seed-pullup** ✓ EQUIP-FIX1 | 4×8-12 |
| 2 | back_thickness compound | bw-inverted-row(pullup_bar,pop=1) | **bw-inverted-row** ✓ EQUIP-FIX2 | 4×8-12 |
| 3 | back iso → cmp fallback | seed-pullup(usedInWkt), bw-inverted-row(usedInWkt) | **null** (skipped) | — |
| 4 | biceps iso → cmp fallback | bw-chinup(pullup_bar,pop=3) [seul candidat] | **bw-chinup** ✓ | 3×10-15 |
| 5 | shoulders_rear iso | — aucun — | **null** (skipped) | — |
| 6 | forearms iso | — aucun BW+BAR — | **null** (skipped) | — |
| 7 | core | seed-crunch(BW,pop=2) | seed-crunch | 3×15 |

Exercices réels : 3 + warmup + core = **5 total** ← Pull day très creux

---

### Table des exercices — Legs (workout index 2)

Slots legs : 1·{quads,cmp} 2·{hamstrings/glutes,cmp} 3·{quads,iso} 4·{glutes,iso} 5·{hamstrings,iso} 6·{calves,iso}

| # | Slot | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|------|-----------------|-----------------|-------------|
| 0 | warmup | seed-mountain-climbers(BW) | seed-mountain-climbers | 2×10 |
| 1 | quads compound | bw-squat(3), bw-lunge(2), bw-jump-squat(1) | **bw-squat** | 4×8-12 |
| 2 | hamstrings/glutes cmp | bw-nordic-curl(2)*, seed-hip-thrust-bw(3), seed-curtsy-lunge(1) | **bw-nordic-curl** ✓ EQUIP-FIX3 | 4×8-12 |
| 3 | quads iso | bw-wall-sit(2) | **bw-wall-sit** | 3×10-15 |
| 4 | glutes iso | seed-glute-bridge(3), seed-donkey-kick(2), seed-fire-hydrant(2) | **seed-glute-bridge** | 3×10-15 |
| 5 | hamstrings iso → cmp fallback | bw-nordic-curl (usedInWkt) | **null** (skipped) | — |
| 6 | calves iso | bw-calf-raise(2) | **bw-calf-raise** | 3×10-15 |
| 7 | core | seed-bicycle-crunch(BW,pop=2) | seed-bicycle-crunch | 3×15 |

*slotPrimary='hamstrings' → bw-nordic-curl en tête malgré pop=2 vs seed-hip-thrust-bw pop=3

Exercices réels : 5 + warmup + core = **7 total**

---

**Assertions :**
- Split PPL `['push','pull','legs']` : **PASS**
- autoProgress=false, progressStepKg=0 (PROG0) : **PASS**
- seed-pullup (back_width) dans Pull slot 1 (EQUIP-FIX1) : **PASS**
- bw-inverted-row (back_thickness) dans Pull slot 2 (EQUIP-FIX2) : **PASS**
- seed-dips (chest_lower) disponible et sélectionné en Push slot 3 (EQUIP-FIX2) : **PASS**
- bw-nordic-curl (hamstrings) dans Legs slot 2 (EQUIP-FIX3) : **PASS**
- Aucun exercice barbell/dumbbell/cable/machine/band/kettlebell : **PASS**

**Coach :**
- Équilibre musculaire : Pull day très creux (3 exercices de travail : seed-pullup, bw-inverted-row, bw-chinup). Les slots dos isolation, shoulders_rear et forearms sont tous vides faute d'exercices BW+BAR ciblant ces groupes. Ratio push/pull déséquilibré en volume.
- Cohérence objectif : hypertrophie 4×8-12 cohérent. Mais la progression est impossible (autoProgress=false) — seule la variation d'exercice ou la difficulté (lest, one-arm) permettrait de progresser.
- Durée/contenu : Push=6 exos, Pull=5, Legs=7. Timing correct pour 60 min.
- Équipement : 100% BW+BAR respecté.
- Progressivité : intermediate permet la rotation top-3 entre séances. Pool limité (3 chest, 1 back_width, 1 back_thickness) → répétitions inévitables sur 12 semaines.
- Verdict : ⚠️ Programme techniquement correct, mais Pull day structurellement pauvre. Calisthenics outdoor viable pour un utilisateur expérimenté; manque d'exercices isolation épaules/avant-bras/bras.

---

## P59 — BW-only sans pullup_bar 3j intermediate — conséquence de la séparation EQUIP-1/2

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:['bodyweight'], level:'intermediate' }
```

**Simulation :**

**Étape 1** — `workoutTypeFromFocus(undefined)` → null

**Étape 2** — Split = `['push','pull','legs']` (isMass + intermediate + 3j)

**Étape 3** — adjustedSlotCount(base, 60, 'hypertrophy') = base (non-strength)

**Pool BW pur (sans pullup_bar) — exercices perdus :**
- seed-pullup (back_width) → **pullup_bar → exclu**
- bw-inverted-row (back_thickness) → **pullup_bar → exclu**
- bw-chinup (biceps) → **pullup_bar → exclu**
- seed-dips (chest_lower) → **pullup_bar → exclu**
- seed-triceps-dips (triceps) → **pullup_bar → exclu**
- bw-nordic-curl (hamstrings) → **pullup_bar → exclu**
- seed-hanging-leg-raise (core) → **pullup_bar → exclu**

**Restants BW pur (non-warmup) :**
- chest compound : seed-pushup(BW,pop=2), bw-incline-pushup(BW,pop=2) [seed-dips exclu]
- shoulders compound : bw-pike-pushup(BW,pop=1)
- glutes compound : seed-hip-thrust-bw(BW,pop=3), seed-curtsy-lunge(BW,pop=1)
- quads compound : bw-squat(BW,pop=3), bw-lunge(BW,pop=2), bw-jump-squat(BW,pop=1)
- quads isolation : bw-wall-sit(BW,pop=2)
- glutes isolation : seed-glute-bridge(3), seed-donkey-kick(2), seed-fire-hydrant(2)
- calves isolation : bw-calf-raise(BW,pop=2)
- [aucun] back_width, back_thickness, biceps, triceps, hamstrings compound ou isolation

---

### Table — Pull day (workout index 1)

| # | Slot | Candidats BW pur | Résultat | Warning généré ? |
|---|------|-----------------|----------|-----------------|
| 0 | warmup | seed-bird-dog | seed-bird-dog | non |
| 1 | back_width compound | **AUCUN** (seed-pullup est pullup_bar) | **null** | ✓ WARNING : "Aucun exercice composé disponible pour dos (largeur)" |
| 2 | back_thickness compound | **AUCUN** (bw-inverted-row est pullup_bar) | **null** | ✓ WARNING : "Aucun exercice composé disponible pour dos (épaisseur)" |
| 3 | back iso → cmp fallback | **AUCUN** | **null** (skipped, non-compound) | non |
| 4 | biceps iso → cmp fallback | **AUCUN** (bw-chinup est pullup_bar) | **null** (skipped) | non |
| 5 | shoulders_rear iso | **AUCUN** | **null** (skipped) | non |
| 6 | forearms iso | **AUCUN** | **null** (skipped) | non |
| 7 | core | seed-plank | seed-plank | non |

**Pull day : 0 exercice de travail** + warmup + core = 2 exercices uniquement.

### Table — Push day

| # | Slot | Candidats BW pur | Exercice retenu | Séries×Reps |
|---|------|-----------------|-----------------|-------------|
| 0 | warmup | seed-jumping-jacks | seed-jumping-jacks | 2×10 |
| 1 | chest compound | seed-pushup(2), bw-incline-pushup(2) [seed-dips exclu] | seed-pushup | 4×8-12 |
| 2 | shoulders compound | bw-pike-pushup(1) | bw-pike-pushup | 4×8-12 |
| 3 | chest iso → cmp fallback | bw-incline-pushup(2) [seed-pushup usedInWkt] | bw-incline-pushup | 3×10-15 |
| 4 | triceps iso → cmp fallback | **AUCUN** (seed-triceps-dips exclu) | **null** (skipped) | — |
| 5 | shoulders_lateral iso | **AUCUN** | **null** (skipped) | — |
| 6 | shoulders_rear iso | **AUCUN** | **null** (skipped) | — |
| 7 | core | seed-crunch | seed-crunch | 3×15 |

Push : 3 exercices + warmup + core = 5 total

### Table — Legs day

| # | Slot | Candidats BW pur | Exercice retenu | Séries×Reps |
|---|------|-----------------|-----------------|-------------|
| 0 | warmup | seed-mountain-climbers | seed-mountain-climbers | 2×10 |
| 1 | quads compound | bw-squat(3), bw-lunge(2), bw-jump-squat(1) | bw-squat | 4×8-12 |
| 2 | hamstrings/glutes cmp | seed-hip-thrust-bw(3), seed-curtsy-lunge(1) [bw-nordic-curl exclu] | seed-hip-thrust-bw | 4×8-12 |
| 3 | quads iso | bw-wall-sit(2) | bw-wall-sit | 3×10-15 |
| 4 | glutes iso | seed-glute-bridge(3), seed-donkey-kick(2), seed-fire-hydrant(2) | seed-glute-bridge | 3×10-15 |
| 5 | hamstrings iso → cmp fallback | **AUCUN** (bw-nordic-curl exclu, aucun autre) | **null** (skipped) | — |
| 6 | calves iso | bw-calf-raise(2) | bw-calf-raise | 3×10-15 |
| 7 | core | seed-bicycle-crunch | seed-bicycle-crunch | 3×15 |

Legs : 4 exercices + warmup + core = 6 total

**Assertions :**
- BW-VIDE : back_width slot = null (PASS), back_thickness slot = null (PASS), biceps slot = null (PASS), chest_lower/triceps absents (PASS) : **PASS**
- 2 warnings générés (back_width + back_thickness) : **PASS**
- Pull day = 0 exercices de travail : **PASS (comportement attendu, problème UX documenté)**
- Warning wizard P59 (BW+!pullup_bar) présent depuis commit 92fecaa : hors scope générateur, **confirmé dans wizard**

**Coach :**
- ❌ Le Pull day génère un programme avec ZÉRO exercice de tirage dos. C'est un problème UX majeur : l'utilisateur reçoit une séance de 2 éléments (échauffement + abdos). Un Pull day sans tirage n'est pas un programme — c'est un programme vide déguisé.
- Le générateur émet des warnings mais génère quand même le programme. L'UI devrait soit bloquer la création ("Impossible de générer un Pull day avec le seul équipement poids du corps — ajoutez une barre de traction"), soit forcer le split PPF/fullbody qui présente moins ce problème.
- Comparé à P21 (beginner fullbody BW) : les slots dos y sont aussi vides mais le fullbody couvre quand même chest/shoulders/legs. Ici le PPL expose l'utilisateur à une séance entière inutile.
- Verdict : ❌ Problème UX sérieux. Slot dos entièrement vide en Pull day BW pur.

---

## P60 — Home gym (DB+KB+Band+BW) 3j intermediate hypertrophy

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:['dumbbell','kettlebell','band','bodyweight'], level:'intermediate' }
```

**Simulation :**

**Étape 1** → null (pas de focusMuscles)

**Étape 2** → Split = `['push','pull','legs']` (isMass + intermediate + 3j)

**Étape 3** → adjustedSlotCount(base, 60, 'hypertrophy') = base pour chaque session

**autoProgress :** dumbbell → progressStepKg=2.5, autoProgress=true ✓

Aucun pullup_bar dans HOME → seed-pullup, bw-inverted-row, bw-chinup, seed-dips, seed-triceps-dips, bw-nordic-curl, seed-hanging-leg-raise EXCLUS.

**Dos disponible (sans pullup_bar) :**
- back_width compound : AUCUN dans HOME (seed-pullup=pullup_bar, lat-pulldown=cable)
  → seul kb-deadlift (primaryMuscle=**back**, compound, KB, pop=2) qualifie via 'back' dans slot 1 muscles=['back_width','back']
- back_thickness compound : seed-row-dumbbell(DB,pop=3), kb-row(KB,pop=2), band-row(band,pop=2)

---

### Table — Pull day HOME

| # | Slot | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|------|-----------------|-----------------|-------------|
| 0 | warmup | seed-bird-dog | seed-bird-dog | 2×10 |
| 1 | back_width compound | **kb-deadlift(back,KB,2)** [seul compound pour 'back' dans HOME] | **kb-deadlift** | 4×8-12 |
| 2 | back_thickness compound | seed-row-dumbbell(3), kb-row(2), band-row(2) | **seed-row-dumbbell** (pop=3, slotPrimary=back_thickness) | 4×8-12 |
| 3 | back iso → cmp fallback | seed-pullover-dumbbell(DB,iso,pop=3), seed-shrug(DB,iso,pop=2), kb-pullover(KB,iso,pop=1) | **seed-pullover-dumbbell** | 3×10-15 |
| 4 | biceps iso | seed-curl-dumbbell(3), seed-curl-hammer(3), seed-curl-incline(2) | rand top-3 | 3×10-15 |
| 5 | shoulders_rear iso | seed-rear-delt-fly(DB,iso,pop=2), bw-prone-y-raise(band,iso,pop=1), band-face-pull(band,iso,pop=2) | seed-rear-delt-fly(pop=2) ou band-face-pull(pop=2) | 3×10-15 |
| 6 | forearms iso | **AUCUN dans HOME** (forearms=barbell/cable) | **null** (skipped) | — |
| 7 | core | seed-plank | seed-plank | 3×15 |

**HOME assertion** : dos couvert par seed-row-dumbbell (DB) + kb-deadlift (KB) sans pullup_bar ✓

---

### Table — Push day HOME

| # | Slot | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|------|-----------------|-----------------|-------------|
| 0 | warmup | seed-jumping-jacks | seed-jumping-jacks | 2×10 |
| 1 | chest compound | seed-bench-dumbbell(DB,3), kb-floor-press(KB,2), band-chest-press(band,1) | rand top-3 | 4×8-12 |
| 2 | shoulders compound | seed-shoulder-press-dumbbell(DB,3), band-overhead-press(band,2), kb-press(KB,2) | rand top-3 | 4×8-12 |
| 3 | chest iso | seed-fly-dumbbell(DB,iso,2) | seed-fly-dumbbell | 3×10-15 |
| 4 | triceps iso | seed-triceps-overhead(DB,iso,2), seed-triceps-kickback(DB,iso,1), band-tricep-pushdown(band,iso,2) | rand top-3 | 3×10-15 |
| 5 | shoulders_lateral iso | seed-lateral-raise(DB,iso,3) | seed-lateral-raise | 3×10-15 |
| 6 | shoulders_rear iso | seed-rear-delt-fly(2), band-face-pull(2), bw-prone-y-raise(1) | rand top-2 | 3×10-15 |
| 7 | core | seed-crunch | seed-crunch | 3×15 |

---

### Table — Legs day HOME

| # | Slot | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|------|-----------------|-----------------|-------------|
| 0 | warmup | seed-mountain-climbers | seed-mountain-climbers | 2×10 |
| 1 | quads compound | seed-lunges(DB,2), kb-lunge(KB,2), band-squat(band,2), bw-squat(BW,3) → slotPrimary=quads | seed-goblet-squat(KB,3) en tête... **seed-goblet-squat** | 4×8-12 |
| 2 | hamstrings/glutes cmp | dumbbell-rdl(DB,2), kb-rdl(KB,2), band-hip-thrust(band,2), kb-swing(glutes,KB,3) → slotPrimary=hamstrings | **dumbbell-rdl** (DB,hamstrings,pop=2) ou kb-swing (glutes,pop=3) selon match | 4×8-12 |
| 3 | quads iso | bw-wall-sit(BW,2) — seule isolation quads disponible | **bw-wall-sit** | 3×10-15 |
| 4 | glutes iso | band-hip-thrust(cmp,band)... seed-glute-bridge(BW,iso,3), seed-donkey-kick(2), seed-fire-hydrant(2) | **seed-glute-bridge** | 3×10-15 |
| 5 | hamstrings iso | **AUCUNE isolation hamstrings dans HOME** → cmp fallback dumbbell-rdl ou kb-rdl | rand top | 3×10-15 |
| 6 | calves iso | seed-calf-raise-db(DB,iso,2), bw-calf-raise(BW,iso,2), kb-calf-raise(KB,iso,1) | **seed-calf-raise-db** (DB,pop=2) SEED-1 ✓ | 3×10-15 |
| 7 | core | seed-bicycle-crunch | seed-bicycle-crunch | 3×15 |

**Assertions :**
- HOME : dos couvert par DB/KB row (pas pullup_bar) : **PASS**
- autoProgress=true, progressStepKg=2.5 : **PASS**
- Aucun exercice pullup_bar dans la sortie : **PASS**
- seed-calf-raise-db disponible (SEED-1) : **PASS**

**Coach :**
- Équilibre musculaire : Push day excellent (chest/shoulders/triceps/lateral/rear delt couverts). Pull day acceptable mais kb-deadlift en slot back_width est un choix discutable (soulevé de terre ≠ tirage vertical). Manque absolu d'exercice de tirage vertical (lat pulldown, traction) en HOME.
- Le slot calves profite de SEED-1 (seed-calf-raise-db) pour HOME. ✓
- Verdict : ✅ Bon programme home gym. Réserve : kb-deadlift en slot back_width est fonctionnellement acceptable mais pas optimal pour le développement en largeur du dos.

---

## P61 — Home gym 4j fat_loss intermediate

```
{ goal:'fat_loss', daysPerWeek:4, sessionDuration:60, equipment:['dumbbell','kettlebell','band','bodyweight'], level:'intermediate' }
```

**Simulation :**

**Étape 1** → null

**Étape 2** — `selectSplit` :
isMass=false (fat_loss) + intermediate + 4j → case 4 :
```
if (isMass) → non
if (level !== 'beginner') → ['push','pull','lower-quad','fullbody-quad']
```
Split = `['push', 'pull', 'lower-quad', 'fullbody-quad']`

Types publics : push, pull, lower, fullbody (1 de chaque → pas de suffixe A/B)
Noms : "Push — Poussée", "Pull — Tirage", "Lower — Bas du corps", "Full Body"

**Étape 3** — adjustedSlotCount(base, 60, 'fat_loss') = base (non-strength)
- push : 6 slots
- pull : 6 slots
- lower-quad : 6 slots
- fullbody-quad : 9 slots

**Specs fat_loss :** COMPOUND=3×12-15 (60s), ISOLATION=3×12-15 (60s)

**autoProgress :** dumbbell → progressStepKg=2.5, autoProgress=true ✓

**HOME dos :** seed-row-dumbbell (back_thickness, DB, pop=3) en Pull slot 2, kb-deadlift (back, KB) en Pull slot 1 — même analyse que P60.

**Table synthétique des 4 sessions :**

| Session | Slots clés | Exercices principaux retenus |
|---------|-----------|------------------------------|
| Push | chest/shoulders/chest-iso/triceps/lat/rear-delt | bench-DB, OHP-DB, fly-DB, triceps-overhead, lateral-raise, rear-delt-fly |
| Pull | back_width(kb-deadlift)/back_thick(row-DB)/back-iso/biceps/rear-delt/forearms | kb-deadlift, row-DB, pullover-DB, curl-DB, rear-delt, [forearms null] |
| Lower-quad | quads-cmp/ham-glutes-cmp/quads-iso/ham-iso/glutes-iso/calves | goblet-squat, dumbbell-rdl, bw-wall-sit, [ham-iso null→fallback], glute-bridge, calf-raise-db |
| Full Body | 9 slots : quads/chest/back/shoulders/ham/rear-delt/biceps/calves/triceps | bw-squat ou goblet-squat, bench-DB, row-DB, shoulder-press, ham-fallback, rear-delt, curl, calf-raise, triceps |

**Assertions :**
- Split ['push','pull','lower-quad','fullbody-quad'] fat_loss 4j intermediate : **PASS**
- Dos couvert par DB/KB row (HOME assertion) : **PASS**
- progressStepKg=2.5, autoProgress=true : **PASS**
- Aucun pullup_bar dans HOME : **PASS**

**Coach :**
- Fat_loss sans cardio machine dans le programme : l'objectif fat_loss repose ici uniquement sur les specs 3×12-15 à 60s de repos. KB swing (glutes compound, pop=3) sera fréquemment sélectionné pour les slots glutes — ce mouvement explosif est excellent pour la dépense énergétique, ce qui est cohérent.
- 4 sessions/semaine en fat_loss avec des specs hautes répétitions : volume approprié. Split push/pull/lower/fullbody bien équilibré sur la semaine.
- Verdict : ✅ Bon programme fat_loss home gym. Réserve : absence de cardio machine = pas de HIIT explicite dans le programme.

---

## P62 — Kettlebell seul 3j beginner hypertrophy

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:['kettlebell'], level:'beginner' }
```

**Simulation :**

**Étape 1** → null

**Étape 2** — Split : isMass + beginner + 3j → `['fullbody-quad','fullbody-hip','fullbody-quad']`
Types publics : fullbody × 3 → suffixes A, B, C
Noms : "Full Body A", "Full Body B", "Full Body C"

**Étape 3** — adjustedSlotCount(9, 60, 'hypertrophy') = 9 slots chaque session

**autoProgress :** kettlebell → progressStepKg=2.5, autoProgress=true ✓

**Pool KB disponible (14 exercices non-warmup) :**

| id | primaryMuscle | category | pop |
|----|--------------|----------|-----|
| seed-goblet-squat | quads | compound | 3 |
| kb-swing | glutes | compound | 3 |
| kb-clean | glutes | compound | 3 |
| kb-press | shoulders | compound | 2 |
| kb-row | back_thickness | compound | 2 |
| kb-rdl | hamstrings | compound | 2 |
| kb-deadlift | back | compound | 2 |
| kb-floor-press | chest | compound | 2 |
| kb-lunge | quads | compound | 2 |
| kb-turkish-getup | core | compound | 2 |
| kb-curl | biceps | isolation | 1 |
| kb-overhead-extension | triceps | isolation | 1 |
| kb-pullover | back_width | isolation | 1 |
| kb-calf-raise | calves | isolation | 1 |

**corePool KB :** inclut kb-turkish-getup (primaryMuscle=core, equipment=kettlebell, !warmup) + bodyweight core (plank, crunch, etc.)

**Slots vides identifiés (KB seul) :**
- shoulders_rear : aucun KB → null (slots 6 de fullbody-quad/hip)
- back_width compound : kb-pullover est **isolation** → le slot compound back_width est rempli via 'back_thickness' ou 'back' (slot muscles inclut ces deux → kb-row ou kb-deadlift)
- forearms : aucun KB → null si présent dans un slot

---

### Table — Full Body A (fullbody-quad, workout 0)

| # | Slot (muscles / type) | Candidats KB | Exercice retenu (beginner=cand[0]) | Séries×Reps |
|---|----------------------|-------------|-----------------------------------|-------------|
| 0 | warmup | seed-jumping-jacks(BW) | seed-jumping-jacks | 2×10 |
| 1 | quads/glutes cmp | seed-goblet-squat(quads,3), kb-lunge(quads,2) | **seed-goblet-squat** | 4×8-12 |
| 2 | chest/chest_upper cmp | kb-floor-press(chest,2) | **kb-floor-press** | 4×8-12 |
| 3 | back_width/back_thickness/back cmp | kb-row(back_thickness,2), kb-deadlift(back,2) | **kb-row** (premier par ordre tableau) | 4×8-12 |
| 4 | shoulders cmp | kb-press(shoulders,2) | **kb-press** | 4×8-12 |
| 5 | hamstrings iso → cmp fallback | kb-rdl(hamstrings,cmp,2) [aucune isolation ham KB] | **kb-rdl** | 3×10-15 |
| 6 | shoulders_rear iso | **AUCUN KB** | **null** (skipped) | — |
| 7 | biceps iso | kb-curl(biceps,iso,1) | **kb-curl** | 3×10-15 |
| 8 | calves iso | kb-calf-raise(calves,iso,1) | **kb-calf-raise** | 3×10-15 |
| 9 | triceps iso | kb-overhead-extension(triceps,iso,1) | **kb-overhead-extension** | 3×10-15 |
| 10 | core | seed-plank(BW,3) ou kb-turkish-getup(KB,2) → plank pop>TGU | seed-plank (BW,pop=3 > TGU pop=2 avec workouts.length%pool = position dépendant) | 3×15 |

Full Body A : 8 exercices de travail + warmup + core = **10 total**

---

### Table — Full Body B (fullbody-hip, workout 1)

| # | Slot | Candidats KB (usedGlobally de A) | Exercice retenu | Séries×Reps |
|---|------|----------------------------------|-----------------|-------------|
| 0 | warmup | seed-bird-dog(BW) | seed-bird-dog | 2×10 |
| 1 | glutes/hamstrings cmp | kb-swing(glutes,3), kb-clean(glutes,3), kb-rdl(ham,2,used) | **kb-swing** (glutes match slotPrimary='glutes', pop=3) | 4×8-12 |
| 2 | chest/chest_upper cmp | kb-floor-press(2, usedGlobally=1) → seul → **kb-floor-press** | **kb-floor-press** (répété) | 4×8-12 |
| 3 | back_width/back_thickness/back cmp | kb-row(used), kb-deadlift(2) | **kb-deadlift** (kb-row usedGlobally pénalisé) | 4×8-12 |
| 4 | shoulders cmp | kb-press(2,used) → seul → **kb-press** | **kb-press** (répété) | 4×8-12 |
| 5 | quads iso → cmp fallback | aucune iso quads KB → kb-lunge(cmp,quads,2) | **kb-lunge** | 3×10-15 |
| 6 | shoulders_lateral/rear iso | **AUCUN KB** | **null** (skipped) | — |
| 7 | biceps iso | kb-curl(1,used) → seul → **kb-curl** | **kb-curl** (répété) | 3×10-15 |
| 8 | calves iso | kb-calf-raise(1,used) → **kb-calf-raise** | **kb-calf-raise** (répété) | 3×10-15 |
| 9 | triceps iso | kb-overhead-extension(1,used) → **kb-overhead-extension** | **kb-overhead-extension** (répété) | 3×10-15 |
| 10 | core | seed-crunch(BW,2) [workouts.length=1 → index 1 dans corePool] | seed-crunch | 3×15 |

**Assertions :**
- Split fullbody×3 beginner hypertrophy : **PASS**
- autoProgress=true, progressStepKg=2.5 (KB) : **PASS**
- Slot shoulders_rear = null (aucun KB) : **PASS (documenté)**
- seed-goblet-squat en slot quads (remplace squat barre) : **PASS**
- kb-swing sélectionné en fullbody-hip slot 1 : **PASS**

**Coach :**
- Pool KB très restreint : 14 exercices pour 3 × 9 slots = 27 slots → répétitions inévitables dès la 2e session (kb-floor-press, kb-press, kb-curl, kb-overhead-extension, kb-calf-raise tous répétés en B).
- Progression avec une seule kettlebell : irréaliste. Il faut plusieurs poids ou un set de KBs pour suivre la progression 4×8-12.
- shoulders_rear systématiquement absent : déséquilibre posture.
- Verdict : ⚠️ Programme fonctionnel pour initiation KB, mais le pool d'exercices est trop limité pour 3j × 9 slots. Recommander un set de KBs (plusieurs poids) et compléter avec BW pour les isolations manquantes.

---

## P63 — Outdoor lower_pull (BW+BAR + focus legs+back) beginner

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:['bodyweight','pullup_bar'], level:'beginner',
  focusMuscles:['legs','back'] }
```

**Simulation :**

**Étape 1** — `workoutTypeFromFocus(['legs','back'])` :
- hasLower=true (legs), hasPull=true (back), hasPush=false
- → Branche `hasLower && hasPull && !hasPush` → `'lower_pull'`

**Étape 2** — focusType='lower_pull' → Split = Array.from({length:3}, () => 'lower_pull')
= `['lower_pull','lower_pull','lower_pull']`
Types publics : ['lower','lower','lower'] → suffixes A, B, C
Noms : "Lower — Chaîne postérieure A/B/C"

**Étape 3** — adjustedSlotCount(9, 60, 'hypertrophy') = 9 slots

**focusedMuscles** = legs→{quads,hamstrings,glutes,calves} + back→{back,back_width,back_thickness}

**reorderSlotsByFocus lower_pull :**
Slots lower_pull (9) :
1. {hamstrings/glutes, cmp} — focused ✓
2. {back_width/back, cmp} — focused ✓
3. {back_thickness/back, cmp} — focused ✓
4. {quads/glutes, cmp} — focused ✓
5. {glutes/hamstrings, iso} — focused ✓
6. {back_thickness/back_width/back, iso} — focused ✓
7. {hamstrings, iso} — focused ✓
8. {calves, iso} — focused ✓
9. {biceps, iso} — **NOT focused** → dernier parmi isolations

Ordre final : [1,2,3,4] compounds + [5,6,7,8,9] isolations (biceps reste en 9)

---

### Table — Lower Chaîne postérieure A (workout 0, beginner)

| # | Slot | Candidats BW+BAR | Exercice retenu | Séries×Reps |
|---|------|-----------------|-----------------|-------------|
| 0 | warmup | seed-jumping-jacks | seed-jumping-jacks | 2×10 |
| 1 | hamstrings/glutes cmp | bw-nordic-curl(ham,pullup_bar,2)*, seed-hip-thrust-bw(glutes,BW,3), seed-curtsy-lunge(glutes,BW,1) | **bw-nordic-curl** ✓ EQUIP-FIX3 | 4×8-12 |
| 2 | back_width/back cmp | seed-pullup(back_width,pullup_bar,3) | **seed-pullup** ✓ EQUIP-FIX1 | 4×8-12 |
| 3 | back_thickness/back cmp | bw-inverted-row(back_thickness,pullup_bar,1) | **bw-inverted-row** ✓ EQUIP-FIX2 | 4×8-12 |
| 4 | quads/glutes cmp | bw-squat(quads,BW,3), bw-lunge(quads,BW,2), bw-jump-squat(quads,BW,1) | **bw-squat** | 4×8-12 |
| 5 | glutes/hamstrings iso | seed-glute-bridge(BW,iso,3), seed-donkey-kick(2), seed-fire-hydrant(2) | **seed-glute-bridge** | 3×10-15 |
| 6 | back_thickness/.../back iso → cmp fallback | seed-pullup(used), bw-inverted-row(used) → **null** | **null** (skipped) | — |
| 7 | hamstrings iso → cmp fallback | bw-nordic-curl(used) → **null** | **null** (skipped) | — |
| 8 | calves iso | bw-calf-raise(BW,iso,2) | **bw-calf-raise** | 3×10-15 |
| 9 | biceps iso → cmp fallback | bw-chinup(biceps,pullup_bar,cmp,3) | **bw-chinup** | 3×10-15 |
| 10 | core | seed-plank(BW,3) | seed-plank | 3×15 |

*slotPrimary='hamstrings' → bw-nordic-curl en tête (match=0) même si pop=2 < seed-hip-thrust-bw pop=3

Exercices réels : 7 (slots 1-4 + 5 + 8 + 9) + warmup + core = **9 total**

---

### Sessions B et C (beginner → candidates[0] répété si même top)

Pour session B : usedGlobally inclut {bw-nordic-curl, seed-pullup, bw-inverted-row, bw-squat, seed-glute-bridge, bw-calf-raise, bw-chinup}.
Beginner toujours candidates[0]. Puisque le sort met slotPrimary-match avant usedGlobally, les mêmes exercices seront sélectionnés en B et C.

→ Répétition complète pour beginner sur les 3 sessions (variation=0). C'est le comportement normal du générateur pour beginner.

**autoProgress=false, progressStepKg=0 (BW+pullup_bar) ✓ (PROG0)**

**Assertions :**
- workoutTypeFromFocus(['legs','back']) = 'lower_pull' : **PASS**
- Split lower_pull × 3 : **PASS**
- Slot 1 = bw-nordic-curl (hamstrings cmp) EQUIP-FIX3 : **PASS**
- Slot 2 = seed-pullup (back_width cmp) EQUIP-FIX1 : **PASS**
- Slot 3 = bw-inverted-row (back_thickness cmp) EQUIP-FIX2 (back_thickness) : **PASS**
- autoProgress=false, progressStepKg=0 PROG0 : **PASS**

**Coach :**
- Nordic curl en slot 1 pour un débutant : ⚠️ Le nordic curl est l'un des exercices les plus difficiles pour les ischio-jambiers — extrêmement exigeant neurologiquement. Pour un beginner, le risque de blessure (claquage) est élevé sans préparation. seed-hip-thrust-bw serait plus approprié comme premier exercice (plus accessible et familier pour le niveau débutant).
- Répétition complète A=B=C pour beginner : attendu mais problématique sur 3 sessions. L'utilisateur fait exactement le même programme 3x par semaine.
- Verdict : ⚠️ Excellent programme structurel (lower_pull BW+BAR cohérent), mais nordic curl en premier slot pour beginner est un risque technique notable.

---

## P64 — BW+BAR+BAND 3j intermediate endurance (élastiques pour shoulders_rear)

```
{ goal:'endurance', daysPerWeek:3, sessionDuration:60, equipment:['bodyweight','pullup_bar','band'], level:'intermediate' }
```

**Simulation :**

**Étape 1** → null

**Étape 2** — isMass=false (endurance) + intermediate + 3j → `['push','pull','fullbody-quad']` (PPF)

**Étape 3** — adjustedSlotCount(base, 60, 'endurance') = base (non-strength)

**Specs endurance :** COMPOUND=3×15-20 (60s), ISOLATION=3×15-20 (45s)

**autoProgress :** band→0, pullup_bar→0, bodyweight→0 → autoProgress=false, progressStepKg=0 (PROG0) ✓

**Pool BW+BAR+BAND ajouts clés vs BW+BAR :**
- shoulders_rear iso : **band-face-pull** (band, iso, isWarmupExercise=false, pop=2) ✓ SEED-2
- shoulders_rear iso : **bw-prone-y-raise** (band, iso, isWarmupExercise=false, pop=1) ✓ SEED-2
- seed-band-pull-apart (band, warmup=TRUE) → exclu de available (dans warmupPool uniquement)
- chest compound bonus : band-chest-press(band,cmp,pop=1)
- shoulders compound bonus : band-overhead-press(band,cmp,pop=2)
- back_thickness compound bonus : band-row(band,cmp,pop=2)
- biceps iso bonus : band-curl(band,iso,pop=2)
- triceps iso bonus : band-tricep-pushdown(band,iso,pop=2)
- hamstrings bonus : band-good-morning(band,cmp,pop=1)
- glutes bonus : band-hip-thrust(band,cmp,pop=2)
- quads bonus : band-squat(band,cmp,pop=2)

---

### Table — Pull day (vérification slot shoulders_rear)

| # | Slot | Candidats BW+BAR+BAND | Exercice retenu | Séries×Reps |
|---|------|----------------------|-----------------|-------------|
| 0 | warmup | seed-bird-dog → + seed-band-pull-apart(warmup=true,dans warmupPool) | seed-bird-dog (index 0) | 2×10 |
| 1 | back_width cmp | seed-pullup(pullup_bar,3) | **seed-pullup** | 3×15-20 |
| 2 | back_thickness cmp | bw-inverted-row(pullup_bar,1), band-row(band,2) → sort: band-row pop=2 > bw-inverted-row pop=1 (même slotPrimary=back_thickness) | **band-row** (pop=2, intermediate top-3 random) ou **bw-inverted-row** | 3×15-20 |
| 3 | back iso → cmp fallback | seed-pullup(used), bw-inverted-row(potentiellement used) | **null** ou **bw-inverted-row** selon sélection slot 2 | — |
| 4 | biceps iso | band-curl(band,iso,2), bw-chinup(pullup_bar,cmp→fallback,3) → isolation first: band-curl | **band-curl** | 3×15-20 |
| **5** | **shoulders_rear iso** | **band-face-pull(band,iso,pop=2), bw-prone-y-raise(band,iso,pop=1)** | **band-face-pull** ✓ SEED-2 | 3×15-20 |
| 6 | forearms iso | **AUCUN BW+BAR+BAND forearms** | **null** (skipped) | — |
| 7 | core | seed-plank | seed-plank | 3×15 |

**SEED-2 assertion :** band-face-pull disponible et retenu pour slot shoulders_rear en Pull day : **PASS**
(seed-band-pull-apart exclus car isWarmupExercise=true → dans warmupPool seulement)

**Assertions :**
- Split PPF ['push','pull','fullbody-quad'] endurance intermediate 3j : **PASS**
- shoulders_rear slot rempli par band-face-pull (SEED-2) : **PASS**
- seed-band-pull-apart exclu de available (warmupExercise=true) : **PASS**
- autoProgress=false, progressStepKg=0 (PROG0) : **PASS**

**Coach :**
- Endurance calisthenics 3j avec élastiques : volume correct (3×15-20). L'ajout des bandes ouvre shoulders_rear, chest, triceps isolation à haute répétition — cohérent.
- Les slots barre (seed-pullup, bw-inverted-row) en 3×15-20 reps : très exigeant pour intermediate. La traction en 15+ reps suppose un niveau confirmé, pas vraiment "intermediate".
- Verdict : ⚠️ Programme structurellement solide. Réserve : 15-20 tractions pour intermediate → objectif ambitieux. Prévoir une progression ou des exercices assistés.

---

## P65 — FULL+CARDIO fat_loss 3j — cardio_machine jamais sélectionné (EQUIP-5)

```
{ goal:'fat_loss', daysPerWeek:3, sessionDuration:60, equipment:['barbell','dumbbell','cable','machine','bodyweight','pullup_bar','cardio_machine'], level:'intermediate' }
```

**Simulation :**

**Étape 1** → null

**Étape 2** — isMass=false (fat_loss) + intermediate + 3j → `['push','pull','fullbody-quad']` (PPF)

**EQUIP-5 — analyse du mécanisme d'exclusion cardio_machine :**

Les 4 exercices cardio_machine du seed ont tous `primaryMuscle: 'cardio'`.

Dans `pickExercise` (ligne 528-530) :
```typescript
let candidates = available.filter(
  (ex) => slot.muscles.includes(ex.primaryMuscle) && ...
)
```

Examinons chaque template de slot dans SLOTS :
- push, pull, legs, upper, lower, fullbody, upper-push, upper-pull, lower-quad, lower-hip, lower_pull, lower_push, fullbody-quad, fullbody-hip
- **Aucun slot ne liste 'cardio' dans son tableau muscles[]**

→ Pour tout exercice avec `primaryMuscle='cardio'` : `slot.muscles.includes('cardio')` = **false** pour tous les slots.
→ Ces exercices ne passent jamais le filtre candidats → jamais sélectionnés.

De plus, `strengthEquipmentPrio('cardio_machine') = 5` (ligne 511) confirme la note "jamais dans les slots de force".

**Programme généré = identique à FULL fat_loss 3j intermediate (cardio_machine ignoré).**

**Assertions :**
- Aucun exercice cardio_machine dans la sortie (EQUIP-5) : **PASS**
- Split PPF fat_loss intermediate 3j : **PASS**

**Coach :**
- ❌ Un utilisateur qui coche "Cardio machine" dans le wizard n'en voit aucun effet. C'est une promesse non tenue.
- Le programme fat_loss produit (3×12-15 à 60s) est correct du point de vue de la densité d'entraînement, mais l'absence totale de travail cardio explicite limite l'effet fat_loss vs un programme HIIT/circuit.
- Correction recommandée : ajouter un slot `cardio` en fin de séance (après core) pour fat_loss et endurance quand cardio_machine est dans l'équipement, ou afficher un message "Utilisez les machines cardio en échauffement (15 min) avant la séance."
- Verdict : ⚠️ Programme techniquement valide mais EQUIP-5 est un bug UX actif.

---

## P66 — cardio_machine seul → edge case dégradé

```
{ goal:'endurance', daysPerWeek:3, sessionDuration:60, equipment:['cardio_machine'], level:'beginner' }
```

**Simulation :**

**Étape 1** → null

**Étape 2** — isMass=false (endurance) + beginner + 3j → `['fullbody-quad','fullbody-hip','fullbody-quad']`

**Pool available** (equipment='cardio_machine', !warmup) : seed-treadmill, seed-elliptical, seed-rowing-erg, seed-cycling — tous primaryMuscle='cardio' → jamais candidats dans aucun slot (cf. EQUIP-5).

**warmupPool** : exercises où isWarmupExercise=true ET (allowed.has(equipment) || equipment='bodyweight')
- allowed={cardio_machine} → aucun warmup cardio_machine
- mais `|| equipment === 'bodyweight'` → tous les warmup bodyweight inclus
- warmupPool = seed-jumping-jacks, seed-bird-dog, seed-cat-cow, etc. (non vide)

**corePool** : primaryMuscle='core', !warmup, (allowed.has(equipment) || equipment='bodyweight')
- seed-plank, seed-crunch, etc. (bodyweight → inclus)
- corePool non vide

**Résultat pour chaque workout :**
- Tous les slots → 0 exercice de travail (tous null, aucun warning car slots non-compound skippés silencieusement)
- + warmup (1 exercice depuis warmupPool)
- + core (1 exercice depuis corePool)
= **2 exercices par workout**, 0 exercice de musculation

**Pas de crash** : le générateur ne crash pas, produit un DraftProgram valide avec des workouts ne contenant que warmup + core.

**CARDIO-EDGE assertion :** Programme "entièrement vide" de contenu musculaire : **PASS**

**Assertions :**
- Aucun exercice cardio_machine sélectionné : **PASS**
- Pas de crash, DraftProgram valide : **PASS**
- warmup (BW) + core (BW) présents malgré équipement cardio_machine : **PASS**

**Coach :**
- ❌ Un utilisateur qui sélectionne uniquement "Cardio machine" reçoit un programme qui ne contient que de l'échauffement et des abdos. C'est un edge case critique.
- Le wizard devrait détecter `equipment=['cardio_machine']` (ou tout set qui produit 0 exercice disponible) et bloquer la génération avec un message "Aucun équipement de musculation sélectionné — les machines cardio ne permettent pas de générer un programme de renforcement musculaire."
- Verdict : ❌ Edge case non bloqué. Programme vide généré sans avertissement explicite.

---

## P67 — BW+BAR strength advanced 4j upper/lower — progressStepKg=0

```
{ goal:'strength', daysPerWeek:4, sessionDuration:60, equipment:['bodyweight','pullup_bar'], level:'advanced' }
```

**Simulation :**

**Étape 1** → null

**Étape 2** — isMass=true (strength) + 4j → case 4, branche `if (isMass)` (pas de vérification level) :
`['upper-push', 'lower-quad', 'upper-pull', 'lower-hip']`

Noms :
- upper-push → "Upper — Haut du corps A" (canon=upper, count=1)
- lower-quad → "Lower — Bas du corps A" (canon=lower, count=1)
- upper-pull → "Upper — Haut du corps B" (canon=upper, count=2)
- lower-hip → "Lower — Bas du corps B" (canon=lower, count=2)

**Étape 3** — adjustedSlotCount(base, 60, 'strength') = max(4, floor(base×0.5))
- upper-push : base=8 → max(4, 4) = **4 slots**
- lower-quad : base=6 → max(4, 3) = **4 slots**
- upper-pull : base=8 → **4 slots**
- lower-hip : base=6 → **4 slots**

**Specs strength :** COMPOUND=5×3-5 (180s), ISOLATION=3×5-8 (120s)

**autoProgress / progressStepKg :** pullup_bar→0, bodyweight→0 → progressStepKg=0, autoProgress=false pour TOUS (PROG0) ✓

**advanced → pickExercise : candidates.slice(0,3) + Math.random()**

---

### Table — Upper-push A (4 slots de 8)

Slots upper-push (4 premiers après reorderSlotsByFocus — pas de focus) :
1. {chest/chest_upper, cmp} 2. {back_width/back_thickness/back, cmp} 3. {shoulders/shoulders_front, cmp} 4. {chest/chest_lower/chest_upper, iso}

| # | Slot | Top-3 candidats (strength sort: strengthEquipmentPrio) | Exercice retenu (advanced=rand top-3) | Séries×Reps |
|---|------|-------------------------------------------------------|--------------------------------------|-------------|
| 0 | warmup | seed-jumping-jacks | seed-jumping-jacks | 2×10 |
| 1 | chest compound | seed-pushup(BW,prio=4,pop=2), seed-dips(pullup_bar,prio=4,pop=3), bw-incline-pushup(BW,prio=4,pop=2) → prio égal, sort par slotPrimary=chest: seed-pushup(0), puis pop desc: seed-dips(3)>bw-incline-pushup(2) | **top-3 = [seed-pushup, seed-dips, bw-incline-pushup]** | 5×3-5 |
| 2 | back compound | seed-pullup(pullup_bar,prio=4,pop=3), bw-inverted-row(pullup_bar,prio=4,pop=1) → slotPrimary=back_width: seed-pullup(0) | **top-3 = [seed-pullup, bw-inverted-row]** → seed-pullup le + probable | 5×3-5 |
| 3 | shoulders compound | bw-pike-pushup(BW,prio=4,pop=1) — seul | **bw-pike-pushup** | 5×3-5 |
| 4 | chest iso → cmp fallback | seed-dips(pullup_bar,3), bw-incline-pushup(BW,2) [selon slot 1 usedInWkt] | rand top parmi restants ✓ seed-dips (EQUIP-FIX2) | 3×5-8 |
| 5 | core | seed-plank(BW,3) | seed-plank | 3×15 |

Upper-push A : 4 exercices + warmup + core = **6 total**

---

### Table — Lower-quad A (4 slots de 6)

Slots lower-quad (4 premiers) : 1·{quads/glutes,cmp} 2·{hamstrings/glutes,cmp} 3·{quads,iso} 4·{hamstrings,iso}

| # | Slot | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|------|-----------------|-----------------|-------------|
| 0 | warmup | seed-bird-dog | seed-bird-dog | 2×10 |
| 1 | quads/glutes cmp | bw-squat(BW,3), bw-lunge(BW,2), bw-jump-squat(BW,1) | rand top-3 | 5×3-5 |
| 2 | hamstrings/glutes cmp | bw-nordic-curl(ham,pullup_bar,2), seed-hip-thrust-bw(glutes,BW,3), seed-curtsy-lunge(glutes,BW,1) → slotPrimary=hamstrings: bw-nordic-curl(0) | rand top-3 | 5×3-5 |
| 3 | quads iso | bw-wall-sit(BW,iso,2) — seul | bw-wall-sit | 3×5-8 |
| 4 | hamstrings iso → cmp fallback | bw-nordic-curl (potentiellement usedInWkt) → null ou bw-nordic-curl | selon slot 2 | 3×5-8 |
| 5 | core | seed-crunch | seed-crunch | 3×15 |

---

### Table — Upper-pull B (4 slots de 8)

Slots upper-pull (4 premiers) : 1·{back_width/back,cmp} 2·{back_thickness/back,cmp} 3·{chest/chest_upper,cmp} 4·{shoulders_rear,iso}

| # | Slot | Candidats | Exercice retenu | Séries×Reps |
|---|------|-----------|-----------------|-------------|
| 0 | warmup | seed-mountain-climbers | seed-mountain-climbers | 2×10 |
| 1 | back_width cmp | seed-pullup(pullup_bar,3) — usedGlobally de upper-push → pénalisé mais seul candidat | **seed-pullup** ✓ EQUIP-FIX1 | 5×3-5 |
| 2 | back_thickness cmp | bw-inverted-row(pullup_bar,1) — usedGlobally possible → pénalisé mais seul | **bw-inverted-row** ✓ EQUIP-FIX2 | 5×3-5 |
| 3 | chest cmp | seed-pushup/seed-dips/bw-incline-pushup (usedGlobally) | rand parmi restants | 5×3-5 |
| 4 | shoulders_rear iso | **AUCUN BW+BAR** | **null** (skipped) | — |
| 5 | core | seed-bicycle-crunch | seed-bicycle-crunch | 3×15 |

---

### Table — Lower-hip B (4 slots de 6)

Slots lower-hip (4 premiers) : 1·{glutes/hamstrings,cmp} 2·{quads/glutes,cmp} 3·{glutes,iso} 4·{hamstrings,iso}

| # | Slot | Candidats | Exercice retenu | Séries×Reps |
|---|------|-----------|-----------------|-------------|
| 0 | warmup | seed-inchworm | seed-inchworm | 2×10 |
| 1 | glutes/hamstrings cmp | seed-hip-thrust-bw(glutes,BW,3), seed-curtsy-lunge(glutes,BW,1), bw-nordic-curl(ham,pullup_bar,2) → slotPrimary=glutes: seed-hip-thrust-bw(0,pop=3) | rand top-3 → seed-hip-thrust-bw probable | 5×3-5 |
| 2 | quads/glutes cmp | bw-squat(BW,3), bw-lunge(BW,2), bw-jump-squat(BW,1) — usedGlobally de lower-quad | rand top-3 | 5×3-5 |
| 3 | glutes iso | seed-glute-bridge(3), seed-donkey-kick(2), seed-fire-hydrant(2) | rand top-3 | 3×5-8 |
| 4 | hamstrings iso → cmp fallback | bw-nordic-curl (usedGlobally → pénalisé) | bw-nordic-curl ou null | 3×5-8 |
| 5 | core | seed-heel-touch | seed-heel-touch | 3×15 |

**Assertions :**
- Split upper/lower A/B (isMass strength 4j) : **PASS**
- autoProgress=false, progressStepKg=0 PROG0 : **PASS**
- seed-pullup dans upper-pull slot 1 EQUIP-FIX1 : **PASS**
- seed-dips disponible EQUIP-FIX2 : **PASS**
- bw-inverted-row dans upper-pull slot 2 : **PASS**
- Top-3 chest compound pour advanced = [seed-pushup, seed-dips, bw-incline-pushup] : **PASS**
- 4 slots par session (strength 60min = max(4, floor(base×0.5))) : **PASS**

**Coach :**
- ❌ Force 5×3-5 sur des exercices BW+pullup_bar est structurellement contradictoire. Le 3-5 reps en force suppose des charges progressives — impossible avec poids du corps (sauf lest, variantes avancées type muscle-up, dips lestés). La prescription est 5×3-5 mais sans surcharge progressive, c'est une prescription incompatible avec l'équipement.
- advanced + strength + BW : le générateur devrait soit adapter les specs (proposer endurance de type "max reps" ou "Grease the Groove"), soit alerter explicitement.
- upper/lower split correct pour 4j, mais 4 slots par session strength 60min est très court (20 exercices au total dans la semaine pour un confirmé force, très en dessous d'un 5/3/1 ou Sheiko typique).
- Verdict : ❌ Inadéquation specs force / équipement BW. Programme généré techniquement valide mais pédagogiquement incorrect pour un coach.

---

## P68 — BW+BAR 2j beginner endurance selectedDays custom

```
{ goal:'endurance', daysPerWeek:2, sessionDuration:45, equipment:['bodyweight','pullup_bar'], level:'beginner',
  selectedDays:['tuesday','saturday'] }
```

**Simulation :**

**Étape 1** → null

**Étape 2** — 2j → toujours `['fullbody-quad','fullbody-hip']` (case 2 : aucune condition)
Types publics : ['fullbody','fullbody'] → suffixes A, B
Noms : "Full Body A", "Full Body B"

**Étape 3** — adjustedSlotCount(9, 45, 'endurance')
isStrength=false → Math.max(3, Math.floor(9 × 0.75)) = max(3, 6) = **6 slots**

**selectedDays :** selectedDays=['tuesday','saturday'], daysPerWeek=2 → selectedDays.length === daysPerWeek → days=selectedDays
weekMap = { tuesday: fullbody-quad workout, saturday: fullbody-hip workout } ✓

**Specs endurance :** COMPOUND=3×15-20 (60s), ISOLATION=3×15-20 (45s)
adjustedSpec(spec, 45) → isStrength=false → Math.max(2, Math.floor(sets × 0.75)) :
- COMPOUND : sets=3 → max(2, floor(3×0.75))=max(2,2)=2 → **2×15-20**
- ISOLATION : sets=3 → max(2, 2) = **2×15-20**

**autoProgress=false, progressStepKg=0 (BW+pullup_bar) ✓ (PROG0)**

---

### Table — Full Body A / mardi (fullbody-quad, 6 slots de 9)

Slots fullbody-quad pris (6 premiers, pas de focus) :
1·{quads/glutes,cmp} 2·{chest/chest_upper,cmp} 3·{back_width/back_thickness/back,cmp} 4·{shoulders,cmp} 5·{hamstrings,iso} 6·{shoulders_rear,iso}

| # | Slot | Candidats BW+BAR | Exercice retenu (beginner) | Séries×Reps |
|---|------|-----------------|--------------------------|-------------|
| 0 | warmup | seed-jumping-jacks | seed-jumping-jacks | 2×10 |
| 1 | quads/glutes cmp | bw-squat(3), bw-lunge(2), bw-jump-squat(1) → slotPrimary=quads | **bw-squat** | 2×15-20 |
| 2 | chest/chest_upper cmp | seed-pushup(chest,2), seed-dips(chest_lower,3), bw-incline-pushup(chest_upper,2) → slotPrimary=chest: seed-pushup(0) | **seed-pushup** | 2×15-20 |
| 3 | back_width/back_thickness/back cmp | seed-pullup(back_width,pullup_bar,3) | **seed-pullup** ✓ EQUIP-FIX1 | 2×15-20 |
| 4 | shoulders cmp | bw-pike-pushup(shoulders,BW,1) | **bw-pike-pushup** | 2×15-20 |
| 5 | hamstrings iso → cmp fallback | bw-nordic-curl(ham,pullup_bar,cmp,2) [aucune iso ham BW+BAR] | **bw-nordic-curl** | 2×15-20 |
| 6 | shoulders_rear iso | **AUCUN BW+BAR** | **null** (skipped) | — |
| 7 | core | seed-plank(BW,3) | seed-plank | 3×15 |

Full Body A : 5 exercices + warmup + core = **7 total** (1 slot skipped)

---

### Table — Full Body B / samedi (fullbody-hip, 6 slots de 9)

Slots fullbody-hip (6 premiers) :
1·{hamstrings/glutes,cmp} 2·{chest/chest_upper,cmp} 3·{back_width/back,cmp} 4·{shoulders,cmp} 5·{quads,iso} 6·{shoulders_lateral/rear,iso}

| # | Slot | Candidats BW+BAR | Exercice retenu (beginner) | Séries×Reps |
|---|------|-----------------|--------------------------|-------------|
| 0 | warmup | seed-bird-dog(BW) [workouts.length=1 → index 1 warmupPool] | seed-bird-dog | 2×10 |
| 1 | hamstrings/glutes cmp | bw-nordic-curl(ham,2,usedGlobally), seed-hip-thrust-bw(glutes,3), seed-curtsy-lunge(glutes,1) → slotPrimary=hamstrings: bw-nordic-curl(0,usedG=1) vs others(1,usedG=0) → bw-nordic-curl toujours en tête (slotPrimary prioritaire) | **bw-nordic-curl** (répété) | 2×15-20 |
| 2 | chest/chest_upper cmp | seed-pushup(chest,2,usedG), seed-dips(chest_lower,3), bw-incline-pushup(chest_upper,2) → slotPrimary=chest: seed-pushup(0,usedG=1) en tête | **seed-pushup** (répété) | 2×15-20 |
| 3 | back_width/back cmp | seed-pullup(back_width,3,usedG) — seul → **seed-pullup** (répété) | **seed-pullup** | 2×15-20 |
| 4 | shoulders cmp | bw-pike-pushup(1,usedG) — seul | **bw-pike-pushup** (répété) | 2×15-20 |
| 5 | quads iso | bw-wall-sit(BW,iso,2) | **bw-wall-sit** | 2×15-20 |
| 6 | shoulders_lateral/rear iso | **AUCUN BW+BAR** | **null** (skipped) | — |
| 7 | core | seed-crunch(BW,2) [workouts.length=1 → index 1 corePool] | seed-crunch | 3×15 |

Full Body B : 5 exercices + warmup + core = **7 total**

**Assertions :**
- 2j = fullbody toujours (Split ['fullbody-quad','fullbody-hip']) : **PASS**
- selectedDays=['tuesday','saturday'] → weekMap={tuesday:fullbody-quad, saturday:fullbody-hip} : **PASS**
- adjustedSlotCount(9, 45, 'endurance') = 6 slots : **PASS**
- adjustedSpec(COMPOUND, 45) → sets=2 (×15-20) : **PASS**
- seed-pullup (back_width) présent EQUIP-FIX1 : **PASS**
- seed-dips disponible pour chest (chest_lower, EQUIP-FIX2) : **PASS** (dans top-3 slot chest)
- autoProgress=false, progressStepKg=0 PROG0 : **PASS**

**Coach :**
- 2j/semaine avec mardi+samedi (4 jours de repos entre séances) : optimal pour la récupération, idéal pour débutant.
- 2×15-20 sur tous les exercices (endurance 45min) : cohérent. Volume léger mais approprié pour initiation.
- Répétition A≈B en beginner sur BW+BAR : inévitable avec un pool limité. Les exercices principaux (bw-squat, bw-squat, seed-pullup, bw-pike-pushup) sont identiques dans les deux sessions — seul bw-wall-sit (A) vs bw-wall-sit (B différent via fullbody-hip) crée une légère variation.
- Verdict : ✅ Programme endurance débutant BW+BAR 2j cohérent. Réserve : variation inter-sessions très faible (pool BW+BAR trop petit pour distinguer A de B significativement).

---

## Récapitulatif des assertions critiques — Groupe G

| Code | Assertion | P58 | P59 | P60 | P61 | P62 | P63 | P64 | P65 | P66 | P67 | P68 |
|------|-----------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| EQUIP-FIX1 | seed-pullup (back_width) ∈ BW+BAR | ✅ | — | — | — | — | ✅ | ✅ | — | — | ✅ | ✅ |
| EQUIP-FIX2 | seed-dips (chest_lower), bw-inverted-row (back_thickness) ∈ BW+BAR | ✅ | — | — | — | — | ✅ | — | — | — | ✅ | ✅ |
| EQUIP-FIX3 | bw-nordic-curl (hamstrings) ∈ BW+BAR | ✅ | — | — | — | — | ✅ | — | — | — | — | — |
| BW-VIDE | BW pur : back_width/back_thickness/biceps → slots vides | — | ✅ | — | — | — | — | — | — | — | — | — |
| HOME | HOME : dos couvert par KB/DB row | — | — | ✅ | ✅ | — | — | — | — | — | — | — |
| KB | KB-only : slots vides documentés | — | — | — | — | ✅ | — | — | — | — | — | — |
| EQUIP5 | cardio_machine jamais sélectionné | — | — | — | — | — | — | — | ✅ | ✅ | — | — |
| CARDIO-EDGE | cardio_machine seul → programme vide | — | — | — | — | — | — | — | — | ✅ | — | — |
| PROG0 | BW+BAR : progressStepKg=0, autoProgress=false | ✅ | — | — | — | — | ✅ | ✅ | — | — | ✅ | ✅ |

---

## Tableau de synthèse P58–P68

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|--------|---------------------|---------|-------------------|
| P58 | PPL BW+BAR EQUIP-FIX1/2/3 PASS · PROG0 PASS | ⚠️ PASS | Pull day creux (3 exercices travail) ; slots shoulders_rear/forearms vides ; pas de progression possible sans lest |
| P59 | BW-VIDE PASS · Pull day = 0 exercice de travail | ❌ UX | Pull day entièrement vide (warmup+core uniquement) — problème UX majeur non bloqué |
| P60 | HOME PASS · autoProgress PASS · kb-deadlift en slot back_width | ⚠️ PASS | kb-deadlift (hip hinge) en slot "tirage vertical" discutable ; manque de traction verticale en HOME |
| P61 | Split push/pull/lower/fullbody fat_loss 4j · HOME PASS | ✅ | — |
| P62 | fullbody×3 KB · shoulders_rear vide · répétitions B=C | ⚠️ PASS | Pool KB trop petit (répétitions dès session B) ; shoulders_rear absent systématiquement ; surcharge progressive irréaliste avec une KB |
| P63 | lower_pull BW+BAR EQUIP-FIX1/2/3 · beginner répète A=B=C | ⚠️ PASS | Nordic curl en slot 1 pour beginner → risque blessure ; variation nulle entre sessions pour beginner |
| P64 | PPF endurance · band-face-pull (SEED-2) slot shoulders_rear · PROG0 | ✅ | 15-20 tractions pour intermediate → objectif très ambitieux |
| P65 | EQUIP-5 : cardio_machine ignoré · Split PPF fat_loss | ⚠️ PASS | cardio_machine coché par l'utilisateur mais aucun effet dans le programme (bug UX actif) |
| P66 | CARDIO-EDGE : programme vide généré sans crash | ❌ UX | Edge case non bloqué : 0 exercice de travail ; wizard devrait bloquer cette sélection |
| P67 | upper/lower A/B isMass strength 4j · PROG0 · 4 slots strength 60min | ❌ COACH | Specs 5×3-5 incompatibles avec BW+pullup_bar (pas de surcharge progressive) ; advanced strength sans poids = inadéquation fondamentale |
| P68 | 2j fullbody · selectedDays respecté · 6 slots 45min endurance | ✅ | Variation inter-sessions A/B très faible (pool BW+BAR limité) |

---

## Synthèse des problèmes ouverts

### Bugs / anomalies logicielles (assertions FAIL ou problèmes UX actifs)

**BUG-UX1 — P59 : Pull day entièrement vide en BW pur**
- Profil : P59
- Assertion : Pull day PPL = 0 exercice de travail
- Impact : L'utilisateur reçoit une séance réduite à warmup+core. Le générateur émet 2 warnings (back_width, back_thickness) mais génère quand même un programme inutilisable.
- Correction : Dans `selectSplit`, détecter qu'un pull day est impossible avec `equipment=['bodyweight']` et forcer le split PPF (push/pull/fullbody) ou fullbody×3 pour beginner. Alternativement, bloquer dans le wizard avec le warning P59 déjà en place (commit 92fecaa) — mais ce warning est affiché, pas bloquant.

**BUG-UX2 — P66 : Programme totalement vide (cardio_machine seul)**
- Profil : P66
- Assertion : CARDIO-EDGE
- Impact : DraftProgram généré avec 0 exercice de musculation. L'utilisateur pensant créer un programme reçoit un plan inutile.
- Correction : Détecter `available.length === 0` après le filtrage équipement → bloquer la génération avec un message explicite dans le wizard.

**BUG-UX3 — P65/P66 : cardio_machine jamais intégré au programme (EQUIP-5)**
- Profils : P65, P66
- Assertion : EQUIP-5
- Impact : L'équipement cardio_machine est proposé dans le wizard mais n'a aucun effet sur le programme généré (aucun slot ne cible primaryMuscle='cardio').
- Correction documentée dans audit_prompt_v3 : ajouter un slot `cardio` conditionnel (après core) pour fat_loss+endurance quand cardio_machine ∈ equipment, OU afficher un message informatif dans le wizard.

### Réserves coach cumulées

**Thème 1 : Programmes force sur équipement BW+pullup_bar (P67)**
- Specs 5×3-5 prescrivent des charges croissantes — incompatible avec poids du corps sans lest ou variantes progressives (one-arm pull-up, archer push-up).
- Recommandation : Pour strength + equipment sans poids externe, adapter les specs vers endurance-force (3×8-12 avec tempos) ou alerter l'utilisateur.

**Thème 2 : Pull day structurellement vide en BW pur (P59)**
- Le PPL est proposé pour intermediate quelle que soit l'équipement. Avec BW pur, le Pull day est vide.
- Recommandation : Vérifier la faisabilité du split proposé avant de le valider. Si `['back_width','back_thickness'].every(m => available.filter(e=>e.primaryMuscle===m && e.category==='compound').length===0)`, forcer un split sans jour Pull dédié.

**Thème 3 : Pool d'exercices insuffisant pour variation en KB-only et BW+BAR (P62, P63, P68)**
- KB-only : dès la 2e session fullbody, répétition systématique des mêmes exercices.
- BW+BAR beginner : variation A/B nulle pour fullbody.
- Recommandation : Pour KB-only, enrichir le seed en exercices kettlebell (shoulder press uni, swing uni, clean & press) ou combiner KB avec BW par défaut.

**Thème 4 : Nordic curl en premier slot pour beginner (P63)**
- bw-nordic-curl sélectionné systématiquement en slot 1 (hamstrings compound, slotPrimary='hamstrings') pour beginner BW+BAR lower_pull.
- C'est l'un des exercices les plus difficiles techniquement pour les ischio-jambiers.
- Recommandation : Abaisser la popularité de bw-nordic-curl (de 2 à 1) ou ajouter un tag "advanced_only" pour l'exclure des programmes beginner.

**Thème 5 : Slots épaules arrière vides en BW+BAR (P58, P67, P68)**
- shoulders_rear systématiquement null pour BW+BAR (pas d'exercice shoulders_rear en bodyweight/pullup_bar sans élastique).
- Déséquilibre postural à long terme.
- Recommandation : SEED-2 (band-face-pull, bw-prone-y-raise) résout ce problème pour BW+BAR+BAND mais pas BW+BAR pur. Envisager d'ajouter un exercice BW shoulders_rear (ex : rear delt push-up ou Y-raise au sol sans élastique).
