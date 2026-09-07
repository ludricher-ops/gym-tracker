# Audit `generateProgramDraft` v4 — GROUPE C (P38 → P51)

> **Périmètre :** splits explicites (`splitPreference ≠ 'auto'`). Le wizard saute l'étape Muscles
> (`ProgramGeneratorScreen.tsx:703-704` — `setStepIndex(s => s+2)` puis `setFocusMuscles([])`),
> et `focusMuscles` est envoyé `undefined` au générateur (`ProgramGeneratorScreen.tsx:243`).
> Donc pour **tous** les profils de ce groupe :
> - `workoutTypeFromFocus([])` → `null` (garde `focusMuscles.length === 0` — `programGenerator.ts:402`)
>   — sans effet de toute façon : les branches `pref` sont évaluées **avant** le bloc auto (`:440-496` vs `:500`).
> - `focusedMuscles` = `Set{}` → `reorderSlotsByFocus` retourne les slots **inchangés** (`:692`) → ordre canonique.

---

## Référentiel utilisé (extrait de `exercises-seed.json`, 151 exercices, 0 `deleted`)

**Règle de tri de `pickExercise` (`:757-777`), dans l'ordre :**
1. muscles focus (inopérant ici, `focused.size === 0`)
2. **`slot.muscles[0]`** — le muscle primaire du slot passe devant (`:763-768`)
3. **force + compound uniquement** → `strengthEquipmentPrio` : barbell 0 · machine/cable 1 · dumbbell/kb 2 · band 3 · pullup_bar/bodyweight 4 (`:707-719`, appliqué `:769-772`)
4. `usedGlobally` — non-utilisé d'abord (`:773-775`)
5. `popularity` desc (`:776`) — **`Array.sort` est stable → à popularité égale, l'ordre du seed tranche**

**Pools warmup / core** (non triés par popularité — rotation `workouts.length % pool.length`, `:1022` et `:1032`) :

| Équipement | Warmup pool (ordre seed) | Core pool (ordre seed) |
|---|---|---|
| FULL / BB+DB | bird-dog · cat-cow · shoulder-circles · dead-bug · walking-lunges · … (16) | scissors · crunch · cable-crunch\* · bicycle-crunch · vertical-leg-crunch … |
| HOME | band-pull-apart · bird-dog · cat-cow · shoulder-circles · clamshell … (18) | scissors · crunch · bicycle-crunch · vertical-leg-crunch · side-plank … (12) |

\* `cable-crunch` absent en BB+DB (cable non dispo) → BB+DB : scissors · crunch · bicycle-crunch · …

**Trous d'équipement structurels repérés dans le seed :**
- `back_width` **compound** n'existe qu'en `cable` (seed-lat-pulldown) et `pullup_bar` (seed-pullup). → **aucun** en BB+DB ni en HOME.
- `hamstrings` **isolation** n'existe qu'en `machine` (3 leg curls). → aucun en BB+DB, HOME, BW.
- `quads` **isolation** : `seed-leg-extension` (machine) + `bw-wall-sit` (bodyweight, `trackingType: 'time'`). → aucun en BB+DB.
- `forearms` : uniquement 2 exercices `barbell`. → aucun en HOME/BW/FULL-sans-barre.
- `chest_lower` : 2 exercices, tous deux **compound** (`seed-dips` pullup_bar, `seed-decline-bench-barbell`).
- `shoulders_front` : 1 seul exercice (`seed-front-raise`, isolation) → **aucun compound OHP indexé `shoulders_front`**.

---

# P38 — Fullbody explicit, beginner, 3j, hypertrophy, FULL, 60 min

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner', splitPreference:'fullbody' }
```

**Simulation :**
- Étape 1 — `workoutTypeFromFocus([])` → `null` (`:402`) — non consulté, `pref='fullbody'` court-circuite (`:478`)
- Étape 2 — `selectSplit` → `['fullbody-quad','fullbody-hip','fullbody-quad']` (`:481`)
- Noms (`:1039-1041`) : canon `fullbody` × 3 → suffixes → **"Full Body A" / "Full Body B" / "Full Body C"**
- Étape 3 — `adjustedSlotCount(9, 60, 'hypertrophy')` = `base` = **9 slots** (`:639-640`) pour les 3 séances
- Étape 5 — compound `4×8-12` rest 90 (`:75`) · isolation `3×10-15` rest 75 (`:82`) · `adjustedSpec` inchangé à 60 min (`:652`)
- `level='beginner'` → `candidates[0]`, déterministe (`:781`)
- Total par séance : 9 + warmup + core = **11 exercices**

## Séance A — Full Body A (`fullbody-quad`, warmup #0, core #0)

| # | Slot muscles | Cat | Top-3 candidats (tri final) | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[0 % 16] | seed-bird-dog | 2×10 |
| 1 | quads/glutes | cmp | squat-barbell(8) · leg-press(3) · bw-squat(3) | **seed-squat-barbell** | 4×8-12 |
| 2 | chest/chest_upper | cmp | bench-barbell(8) · bench-dumbbell(3) · chest-press-machine(3) | **seed-bench-barbell** | 4×8-12 |
| 3 | back_width/back_thickness/back | cmp | lat-pulldown(3) · pullup(3) · row-barbell(7) | **seed-lat-pulldown** | 4×8-12 |
| 4 | shoulders/shoulders_front | cmp | shoulder-press-db(3) · ohp-barbell(3) · shoulder-press-machine(3) | **seed-shoulder-press-dumbbell** | 4×8-12 |
| 5 | hamstrings | iso | leg-curl-lying(3) · leg-curl-seated(2) · leg-curl-standing(2) | **seed-leg-curl-lying** | 3×10-15 |
| 6 | shoulders_rear | iso | face-pull(2) · rear-delt-fly(2) | **seed-face-pull** | 3×10-15 |
| 7 | biceps | iso | curl-barbell(3) · curl-dumbbell(3) · curl-hammer(3) | **seed-curl-barbell** | 3×10-15 |
| 8 | calves | iso | calf-seated(2) · calf-standing(2) · bw-calf-raise(2) | **seed-calf-raise-seated** | 3×10-15 |
| 9 | triceps | iso | triceps-rope(3) · triceps-pushdown(3) · skullcrusher(2) | **seed-triceps-rope** | 3×10-15 |
| c | core | — | pool[0 % 13] | seed-scissors | 3×15 |

⚠️ Slot 3 : `slot.muscles[0] = 'back_width'` remonte lat-pulldown/pullup (pop 3) **devant** `seed-row-barbell` (pop 7). Le rowing barre — l'exercice de dos le plus populaire du seed — n'est jamais atteignable ici.

## Séance B — Full Body B (`fullbody-hip`, warmup #1, core #1)

| # | Slot muscles | Cat | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[1] | seed-cat-cow | 2×10 |
| 1 | hamstrings/glutes | cmp | romanian-deadlift(3) · bw-nordic-curl(2) · dumbbell-rdl(2) | **seed-romanian-deadlift** | 4×8-12 |
| 2 | chest/chest_upper | cmp | bench-dumbbell(3,neuf) · chest-press-machine(3,neuf) · pushup(2,neuf) | **seed-bench-dumbbell** | 4×8-12 |
| 3 | back_width/back | cmp | pullup(3,neuf) · lat-pulldown(3,utilisé) · deadlift(3) | **seed-pullup** | 4×8-12 |
| 4 | shoulders/shoulders_front | cmp | ohp-barbell(3,neuf) · shoulder-press-machine(3,neuf) · arnold-press(2) | **seed-ohp-barbell** | 4×8-12 |
| 5 | quads | iso | leg-extension(3) · bw-wall-sit(2) | **seed-leg-extension** | 3×10-15 |
| 6 | shoulders_lateral/rear | iso | lateral-raise(3) · lateral-raise-cable(2) · rear-delt-fly(2) | **seed-lateral-raise** | 3×10-15 |
| 7 | biceps | iso | curl-dumbbell(3,neuf) · curl-hammer(3,neuf) · curl-incline(2) | **seed-curl-dumbbell** | 3×10-15 |
| 8 | calves | iso | calf-standing(2,neuf) · bw-calf-raise(2) · calf-db(2) | **seed-calf-raise-standing** | 3×10-15 |
| 9 | triceps | iso | triceps-pushdown(3,neuf) · skullcrusher(2) · triceps-overhead(2) | **seed-triceps-pushdown** | 3×10-15 |
| c | core | — | pool[1] | seed-crunch | 3×15 |

## Séance C — Full Body C (`fullbody-quad`, warmup #2, core #2)

| # | Slot muscles | Cat | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[2] | seed-shoulder-circles | 2×10 |
| 1 | quads/glutes | cmp | leg-press(3,neuf) · bw-squat(3,neuf) · lunges(2) | **seed-leg-press** | 4×8-12 |
| 2 | chest/chest_upper | cmp | chest-press-machine(3,neuf) · pushup(2,neuf) · bench-barbell(8,utilisé) | **seed-chest-press-machine** | 4×8-12 |
| 3 | back_width/back_thickness/back | cmp | lat-pulldown(3,utilisé) · pullup(3,utilisé) · row-barbell(7,neuf) | **seed-lat-pulldown** ⚠️ | 4×8-12 |
| 4 | shoulders/shoulders_front | cmp | shoulder-press-machine(3,neuf) · arnold-press(2) · pike-pushup(1) | **seed-shoulder-press-machine** | 4×8-12 |
| 5 | hamstrings | iso | leg-curl-seated(2,neuf) · leg-curl-standing(2,neuf) · leg-curl-lying(3,utilisé) | **seed-leg-curl-seated** | 3×10-15 |
| 6 | shoulders_rear | iso | rear-delt-fly(2,neuf) · face-pull(2,utilisé) | **seed-rear-delt-fly** | 3×10-15 |
| 7 | biceps | iso | curl-hammer(3,neuf) · curl-incline(2) · curl-cable(2) | **seed-curl-hammer** | 3×10-15 |
| 8 | calves | iso | bw-calf-raise(2,neuf) · calf-db(2,neuf) · calf-bb(2,neuf) | **bw-calf-raise** ⚠️ | 3×10-15 |
| 9 | triceps | iso | skullcrusher(2,neuf) · triceps-overhead(2,neuf) · kickback(1) | **seed-skullcrusher** | 3×10-15 |
| c | core | — | pool[2] | seed-cable-crunch | 3×15 |

**Assertions : [PASS/FAIL]**
- `workoutTypeFromFocus([])` → null : **PASS** (`:402`) — non atteint (`pref` court-circuite `:478`)
- Split = `['fullbody-quad','fullbody-hip','fullbody-quad']` : **PASS** (`:481`)
- Même split que l'auto beginner 3j hypertrophy (P02) : **PASS** (`:557` retourne le même tableau)
- `reorderSlotsByFocus` = ordre canonique : **PASS** (`:692`, `focused.size === 0` → return slots)
- 9 slots par séance : **PASS** (`:639-640`)
- 11 exercices par séance : **PASS**
- chest compound séance A = `seed-bench-barbell` : **PASS**
- back compound séance A = `seed-lat-pulldown` (et **non** row-barbell malgré pop 7) : **PASS avec réserve** — voir ⚠️
- `autoProgress: true / progressStepKg: 2.5` : **PARTIEL** — faux pour `seed-pullup` (pullup_bar) et `bw-calf-raise` (bodyweight) → `progressStepKg: 0`, `autoProgress: false` (`:789-790`)

**Coach :**
- **Équilibre musculaire** : ✅ excellent sur la semaine. Push 3× (bench bb/db/machine), pull 3× (lat pulldown ×2, pullup), OHP 3×, quads 3×, ischios 3× (RDL + 2 leg curls), fessiers en secondaire seulement (aucun slot glutes dédié en fullbody-quad/hip), mollets 3×, biceps 3×, triceps 3×, deltoïde postérieur 3×. Ratio push/pull horizontal ≈ 1:1. **Fessiers en isolation = 0** sur les 3 séances.
- **Cohérence objectif** : ✅ 4×8-12 / 3×10-15 = hypertrophie canonique. Volume hebdo par groupe : pecs 3 séries×4 = 12 séries/sem, dos 12, quads 12+9 iso, épaules 12+9. Élevé pour un **débutant** (recommandé 10-12 séries/groupe/sem) → à la limite haute.
- **Durée/contenu** : ❌ **irréaliste**. 9 slots = 4 composés (4 séries × 90 s repos) + 5 isolations (3 séries × 75 s) = 16 + 15 = 31 séries. Travail ~40 s/série + repos → 4×4×(40+90) = 34,7 min pour les composés + 5×3×(35+75) = 27,5 min pour les isolations + warmup 3 min + core 4 min ≈ **69 min minimum**, plus réalistement **85-100 min**. Annoncé 60 min → **dérive de +40 à +65 %**.
- **Équipement** : ✅ aucun exercice hors FULL. ⚠️ Exploitation sous-optimale : séance C slot 8 retient `bw-calf-raise` (poids du corps, non chargeable, `progressStepKg=0`) alors que `seed-calf-raise-db` et `seed-calf-raise-bb` sont disponibles à popularité identique — c'est l'ordre du seed (index 133 < 146) qui tranche.
- **Variété inter-sessions** : ⚠️ **Variété d'exercices seulement** entre A et C (mêmes 9 slots, même ordre musculaire — 8 exercices sur 9 diffèrent grâce à `usedGlobally`, mais slot 3 **répète lat-pulldown**). Entre A et B : ✅ vraie variété structurelle (quad-dominant vs hip-dominant, slot 5 hamstrings→quads, slot 6 rear→lateral).
- **Couverture isolation** : ⚠️ **Lacunes acceptables**. Sans slot isolation dédié : **fessiers** (couverts en secondaire par squat/RDL/hip hinge — acceptable en fullbody), **avant-bras** (acceptable), **pec supérieur/inférieur** (le slot 2 est compound uniquement, pas de fly — acceptable à 3j fullbody). L'absence de fessiers en isolation dans **les deux** templates fullbody est le seul vrai trou.
- **Verdict global : ⚠️ Problème mineur** — programme sportivement correct et bien varié, mais **la durée annoncée est fausse d'environ 30 min** et le rowing barre est structurellement inaccessible.

---

# P39 — Fullbody explicit, intermediate, 3j, strength, BB+DB, 60 min

```
{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:BB+DB, level:'intermediate', splitPreference:'fullbody' }
```

**Simulation :**
- Étape 2 — `selectSplit` → `['fullbody-quad','fullbody-hip','fullbody-quad']` (`:481`) → "Full Body A/B/C"
- Étape 3 — `adjustedSlotCount(9, 60, 'strength')` = `max(4, floor(9×0.5))` = `max(4,4)` = **4 slots** (`:638`)
  → les 4 slots retenus sont **les 4 composés** de chaque template ; les 5 isolations sont **éjectées**
- Étape 5 — compound strength `5×3-5` rest 180 (`:74`) · `adjustedSpec` inchangé à 60 min (`:652`)
- `level='intermediate'` → `candidates.slice(0,3)` + `Math.random` (`:782-783`) — **non déterministe**
- `goal='strength'` + slot compound → `strengthEquipmentPrio` actif (`:769-772`)
- Total : 4 + warmup + core = **6 exercices**
- ⚠️ Warning contexte : `goal==='strength' && level==='beginner'` → non (intermediate) → pas de warning UX-C

**Pools BB+DB compound :** quads squat-bb(8)/front-squat(2)/lunges-db(2)/bulgarian-db(2) · glutes hip-thrust-bb(4) · chest bench-bb(8)/bench-db(3) · chest_upper incline-bb(4)/incline-db(2) · **back_width : ∅** · back_thickness row-bb(7)/row-tbar(2)/row-db(3) · back deadlift-bb(3) · shoulders ohp-bb(3)/press-db(3)/arnold-db(2) · hamstrings rdl-bb(3)/good-morning-bb(1)/rdl-db(2)

## Séance A — Full Body A (`fullbody-quad`, 4 slots)

| # | Slot muscles | Cat | Top-3 candidats (prio équip. force) | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[0] | seed-bird-dog | 2×10 |
| 1 | quads/glutes | cmp | **squat-barbell**(bb,8) · front-squat(bb,2) · lunges(db,2) | squat-barbell *(2/3 chances hors squat)* | 5×3-5 (r180) |
| 2 | chest/chest_upper | cmp | **bench-barbell**(bb,8) · bench-dumbbell(db,3) · incline-bench-barbell(bb,4) | bench-barbell | 5×3-5 |
| 3 | back_width/thickness/back | cmp | **row-barbell**(bb,7) · deadlift(bb,3) · row-tbar(bb,2) | row-barbell | 5×3-5 |
| 4 | shoulders/shoulders_front | cmp | **ohp-barbell**(bb,3) · shoulder-press-db(db,3) · arnold-press(db,2) | ohp-barbell | 5×3-5 |
| c | core | — | pool[0] | seed-scissors | 3×15 |

⚠️ Slot 2 : le critère `slot.muscles[0]='chest'` s'applique **avant** la priorité équipement → `bench-dumbbell` (db, pop 3) passe **devant** `incline-bench-barbell` (bb, pop 4). Il y a donc **1 chance sur 3** que le développé couché haltères soit retenu pour un programme de force alors que la barre est disponible — exactement le contre-exemple cité dans la grille d'audit.

## Séance B — Full Body B (`fullbody-hip`, 4 slots)

| # | Slot muscles | Cat | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[1] | seed-cat-cow | 2×10 |
| 1 | hamstrings/glutes | cmp | **romanian-deadlift**(bb,3) · good-morning(bb,1) · dumbbell-rdl(db,2) | romanian-deadlift | 5×3-5 |
| 2 | chest/chest_upper | cmp | **bench-barbell**(bb,8,*utilisé*) · bench-dumbbell(db,3) · incline-bench-barbell(bb,4) | bench-barbell (répétition probable) | 5×3-5 |
| 3 | back_width/back | cmp | **seed-deadlift** — *candidat unique* | seed-deadlift | 5×3-5 |
| 4 | shoulders/shoulders_front | cmp | **ohp-barbell**(bb,3,*utilisé*) · shoulder-press-db · arnold-press | ohp-barbell (répétition probable) | 5×3-5 |
| c | core | — | pool[1] | seed-crunch | 3×15 |

⚠️ Slot 1 : `good-morning` (pop 1, technique très exigeante) figure dans le top-3 **devant** `hip-thrust` (pop 4) — parce que `slot.muscles[0]='hamstrings'` puis la prio barre l'emporte. 1/3 de chance de 5×3-5 de good morning barre.

⚠️ Slot 3 : `back_width` n'a **aucun compound** en BB+DB → le slot retombe sur `seed-deadlift` (primaryMuscle `back`). **Aucun warning n'est émis** (`:994-1007` ne déclenche que si `pickExercise` retourne `null`) alors que le programme n'a **aucun tirage vertical ni horizontal** dans cette séance.

## Séance C — Full Body C (`fullbody-quad`, 4 slots)

| # | Slot muscles | Cat | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[2] | seed-shoulder-circles | 2×10 |
| 1 | quads/glutes | cmp | **front-squat**(bb,2,neuf) · squat-barbell(bb,8,utilisé) · lunges(db,2) | front-squat | 5×3-5 |
| 2 | chest/chest_upper | cmp | **bench-barbell**(bb,utilisé) · bench-dumbbell(db) · incline-bench-barbell(bb) | bench-barbell (3ᵉ fois) | 5×3-5 |
| 3 | back_width/thickness/back | cmp | **row-tbar**(bb,2,neuf) · row-barbell(bb,7,utilisé) · deadlift(bb,3,utilisé) | row-tbar | 5×3-5 |
| 4 | shoulders/shoulders_front | cmp | **ohp-barbell**(bb,utilisé) · shoulder-press-db · arnold-press | ohp-barbell (3ᵉ fois) | 5×3-5 |
| c | core | — | pool[2] | seed-bicycle-crunch | 3×15 |

**Assertions : [PASS/FAIL]**
- Split `['fullbody-quad','fullbody-hip','fullbody-quad']` : **PASS** (`:481`)
- `adjustedSlotCount(9,60,'strength') = 4` : **PASS** (`:638`) — assertion SLOT-FORCE
- Slot 0 fullbody-quad = squat barbell prioritaire (BB+DB, prio barre) : **PASS** (`:769-772`, `strengthEquipmentPrio('barbell')=0` `:709`)
- 6 exercices par séance : **PASS**
- Compound strength `5×3-5`, rest 180 : **PASS** (`:74`)
- intermediate → top-3 random : **PASS** (`:782-783`) — top-3 quads/glutes cités ci-dessus
- **FAIL découvert** : `strengthEquipmentPrio` (`:769-772`) est évalué **avant** `usedGlobally` (`:773-775`) → la rotation anti-répétition est **neutralisée** sur les slots composés en force. Le bench barre et l'OHP barre sont reconduits aux 3 séances. En `beginner`, ce serait strictement identique aux 3 séances.

**Coach :**
- **Équilibre musculaire** : ⚠️ correct en volume (3× squat-pattern, 3× bench-pattern, 3× press vertical, 2× rowing + 1 deadlift), mais **zéro tirage vertical de toute la semaine** (pas de traction ni de lat pulldown en BB+DB) et **zéro travail direct de bras, mollets, deltoïde postérieur, ischios en isolation** (les 5 slots isolation sont coupés par le barème force). Ratio press vertical/tirage vertical = 3:0 → risque épaule à moyen terme.
- **Cohérence objectif** : ✅ 5×3-5 rest 180 = force classique. 4 gros composés/séance × 3 séances = 12 exercices lourds/sem, soit un volume de type 5×5 / Starting Strength étendu. Cohérent pour un intermédiaire.
- **Durée/contenu** : ✅ 4 × 5 séries × ~3,5 min (travail + repos 180 s) ≈ 70 min + warmup 3 min + core 4 min ≈ **77 min** annoncés 60 min → dérive de +28 %, la moins mauvaise du groupe C mais toujours optimiste. Le commentaire du code annonce lui-même « 4 slots ≈ 65-70 min effectifs » (`:620`) — l'aveu est dans la source.
- **Équipement** : ⚠️ **prio barre respectée sur 3 slots/4**, mais brèche identifiée sur le slot chest (bench db possible devant incline bb). Trou dur : `back_width` sans compound en BB+DB.
- **Variété inter-sessions** : ❌ **Répétition quasi complète** A→C sur 3 slots/4 en pratique (bench bb, ohp bb reconduits ; seuls les slots 1 et 3 tournent). Le mécanisme `usedGlobally` est court-circuité par la prio équipement. Verdict : **variété d'exercices marginale**.
- **Couverture isolation** : ❌ **Lacunes problématiques** — 0 slot isolation sur les 3 séances. Biceps, triceps, mollets, deltoïde postérieur, ischios (leg curl), quadriceps (leg extension) totalement absents. Pour un intermédiaire en force sur 12-16 semaines, l'absence d'accessoires est un facteur de plafonnement et de blessure.
- **Verdict global : ❌ Problème sérieux** — le choix explicite « fullbody » en force à 60 min réduit le programme à 4 composés répétés à l'identique, sans aucun accessoire ni tirage vertical.

---

# P40 — Upper/Lower explicit, intermediate, 4j, hypertrophy, FULL, 60 min

```
{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'intermediate', splitPreference:'upper-lower' }
```

**Simulation :**
- Étape 2 — `selectSplit` pref `upper-lower`, case 4 → `['upper-push','lower-quad','upper-pull','lower-hip']` (`:453`)
- Noms : `toPublicType` → upper/lower/upper/lower (`:119-120`) → 2 `upper` + 2 `lower` → suffixes A/B
  → **"Upper — Haut du corps A" / "Lower — Bas du corps A" / "Upper — Haut du corps B" / "Lower — Bas du corps B"**
- Étape 3 — upper-push base 8 → **8** · lower-quad base 6 → **6** · upper-pull base 8 → **8** · lower-hip base 6 → **6** (`:640`)
- Étape 5 — cmp `4×8-12` r90 · iso `3×10-15` r75
- `intermediate` → top-3 random (`:782-783`)

## Séance 1 — Upper A (`upper-push`, 8 slots · warmup bird-dog · core scissors)

| # | Slot muscles | Cat | Top-3 candidats (pop desc) | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[0] | seed-bird-dog | 2×10 |
| 1 | chest/chest_upper | cmp | bench-barbell(8) · bench-dumbbell(3) · chest-press-machine(3) | bench-barbell | 4×8-12 |
| 2 | back_width/thickness/back | cmp | lat-pulldown(3) · pullup(3) · row-barbell(7) | lat-pulldown | 4×8-12 |
| 3 | shoulders/shoulders_front | cmp | shoulder-press-db(3) · ohp-barbell(3) · shoulder-press-machine(3) | shoulder-press-db | 4×8-12 |
| 4 | chest/chest_lower/chest_upper | iso | fly-dumbbell(2) · fly-cable(2) · pec-deck(2) | fly-dumbbell | 3×10-15 |
| 5 | triceps | iso | triceps-rope(3) · triceps-pushdown(3) · skullcrusher(2) | triceps-rope | 3×10-15 |
| 6 | shoulders_lateral | iso | lateral-raise(3) · lateral-raise-cable(2) *(pool = 2)* | lateral-raise | 3×10-15 |
| 7 | biceps | iso | curl-barbell(3) · curl-dumbbell(3) · curl-hammer(3) | curl-barbell | 3×10-15 |
| 8 | back_thickness/back | iso | pullover-dumbbell(3) · pullover-cable(2) · straight-arm-pulldown(2) | pullover-dumbbell | 3×10-15 |
| c | core | — | pool[0] | seed-scissors | 3×15 |

## Séance 2 — Lower A (`lower-quad`, 6 slots · warmup cat-cow · core crunch)

| # | Slot muscles | Cat | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[1] | seed-cat-cow | 2×10 |
| 1 | quads/glutes | cmp | squat-barbell(8) · leg-press(3) · bw-squat(3) | squat-barbell | 4×8-12 |
| 2 | hamstrings/glutes | cmp | romanian-deadlift(3) · bw-nordic-curl(2) · dumbbell-rdl(2) | romanian-deadlift | 4×8-12 |
| 3 | quads | iso | leg-extension(3) · bw-wall-sit(2) *(pool = 2)* | leg-extension | 3×10-15 |
| 4 | hamstrings | iso | leg-curl-lying(3) · leg-curl-seated(2) · leg-curl-standing(2) | leg-curl-lying | 3×10-15 |
| 5 | glutes | iso | glute-bridge(3) · donkey-kick(2) · fire-hydrant(2) | glute-bridge | 3×10-15 |
| 6 | calves | iso | calf-seated(2) · calf-standing(2) · bw-calf-raise(2) | calf-raise-seated | 3×10-15 |
| c | core | — | pool[1] | seed-crunch | 3×15 |

⚠️ Slot 5 : le top-3 fessiers ne contient **que du poids du corps** (glute bridge, donkey kick, fire hydrant) alors que `seed-hip-abduction` / `seed-hip-adduction-machine` (machine, chargeables) sont disponibles à popularité 2 mais plus loin dans le seed — trois exercices non chargeables pour un objectif hypertrophie en salle complète.

## Séance 3 — Upper B (`upper-pull`, 8 slots · warmup shoulder-circles · core cable-crunch)

| # | Slot muscles | Cat | Top-3 candidats (neuf d'abord) | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[2] | seed-shoulder-circles | 2×10 |
| 1 | back_width/back | cmp | pullup(3,neuf) · lat-pulldown(3,utilisé) · deadlift(3) | pullup | 4×8-12 |
| 2 | back_thickness/back | cmp | row-barbell(7) · row-dumbbell(3) · row-tbar(2) | row-barbell | 4×8-12 |
| 3 | chest/chest_upper | cmp | bench-dumbbell(3,neuf) · chest-press-machine(3,neuf) · pushup(2,neuf) | bench-dumbbell | 4×8-12 |
| 4 | shoulders_rear | iso | face-pull(2) · rear-delt-fly(2) *(pool = 2)* | face-pull | 3×10-15 |
| 5 | biceps | iso | curl-dumbbell(3,neuf) · curl-hammer(3,neuf) · curl-incline(2) | curl-dumbbell | 3×10-15 |
| 6 | back_thickness/back | iso | pullover-cable(2,neuf) · straight-arm-pulldown(2,neuf) · pullover-db(3,utilisé) | pullover-cable | 3×10-15 |
| 7 | triceps | iso | triceps-pushdown(3,neuf) · skullcrusher(2) · triceps-overhead(2) | triceps-pushdown | 3×10-15 |
| 8 | shoulders_lateral | iso | lateral-raise-cable(2,neuf) · lateral-raise(3,utilisé) | lateral-raise-cable | 3×10-15 |
| c | core | — | pool[2] | seed-cable-crunch | 3×15 |

⚠️ Slot 3 : le commentaire du code annonce « **Développé incliné** » (`:204`) mais `slot.muscles[0]='chest'` place les 4 compounds `chest` devant tous les `chest_upper` → `seed-incline-bench-barbell` (pop 4) est **inatteignable dans le top-3**. Le pec supérieur n'est jamais chargé en compound dans tout le programme.

## Séance 4 — Lower B (`lower-hip`, 6 slots · warmup dead-bug · core bicycle-crunch)

| # | Slot muscles | Cat | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[3] | seed-dead-bug | 2×10 |
| 1 | glutes/hamstrings | cmp | hip-thrust(4) · hip-thrust-bw(3) · hip-thrust-machine(3) | hip-thrust | 4×8-12 |
| 2 | quads/glutes | cmp | leg-press(3,neuf) · bw-squat(3,neuf) · lunges(2,neuf) | leg-press ⚠️ | 4×8-12 |
| 3 | glutes | iso | donkey-kick(2,neuf) · fire-hydrant(2,neuf) · hip-abduction(2,neuf) | donkey-kick | 3×10-15 |
| 4 | hamstrings | iso | leg-curl-seated(2,neuf) · leg-curl-standing(2,neuf) · leg-curl-lying(3,utilisé) | leg-curl-seated | 3×10-15 |
| 5 | quads | iso | bw-wall-sit(2,neuf) · leg-extension(3,utilisé) | bw-wall-sit ⚠️ | 3×10-15 |
| 6 | calves | iso | calf-standing(2,neuf) · bw-calf-raise(2,neuf) · calf-db(2,neuf) | calf-raise-standing | 3×10-15 |
| c | core | — | pool[3] | seed-bicycle-crunch | 3×15 |

⚠️ Slot 2 : le commentaire annonce « **Fente bulgare / lunge / step-up** » (`:229`) mais `slot.muscles[0]='quads'` + popularité fait remonter la presse à cuisses. La séance hip-dominante ne contient **aucun mouvement unilatéral**.
⚠️ Slot 5 : `bw-wall-sit` a `trackingType: 'time'` mais reçoit une spec `3×10-15 reps`. Incohérence de spec.

**Assertions : [PASS/FAIL]**
- Split `['upper-push','lower-quad','upper-pull','lower-hip']` : **PASS** (`:453`)
- Identique au split auto intermediate hypertrophy 4j (P10) : **PASS** (`:561` retourne exactement le même tableau)
- 8/6/8/6 slots : **PASS** (`:640`)
- Noms Upper A / Lower A / Upper B / Lower B : **PASS** (`:1039-1041`)
- Top-3 slot 0 upper-push : bench-barbell(8) · bench-dumbbell(3) · chest-press-machine(3) : **PASS**
- Différence fonctionnelle auto vs explicit : **PASS** — en `auto`, `focusMuscles` pourrait réordonner via `reorderSlotsByFocus` (`:983`) et changer le split via `workoutTypeFromFocus` (`:500-501`) ; en explicit, `focusMuscles` est vidé par le wizard (`ProgramGeneratorScreen.tsx:704`) et `pref` court-circuite le bloc auto → **résultat strictement identique et non influençable**.
- Filtre wizard `upper-lower` : tombe dans `default: return null` (`ProgramGeneratorScreen.tsx:645-646`) → **jamais grisé** : **PASS**

**Coach :**
- **Équilibre musculaire** : ✅ excellent. Fréquence 2×/sem pour pecs (S1, S3), dos (S1×2 slots, S3×3 slots), quads (S2, S4), ischios (S2, S4), fessiers (S2, S4). Tirage : 5 slots/sem vs poussée : 4 → légèrement pull-dominant, ce qui est **sain**. ⚠️ OHP 1×/sem seulement (upper-pull n'a pas de slot press vertical) ; deltoïde antérieur sous-stimulé.
- **Cohérence objectif** : ✅ 4×8-12 / 3×10-15 canonique. Volume/sem : pecs 4+4+3 = 11 séries, dos 4+4+3+3 = 14, quads 4+4+3+3 = 14, épaules 4+3+3+3 = 13. **Excellente** répartition intermédiaire.
- **Durée/contenu** : ❌ Upper (8 slots) : 3 composés × 4 séries × ~2,2 min + 5 isolations × 3 séries × ~1,9 min ≈ 26 + 28 = **54 min de travail-repos** + warmup/core 7 min ≈ **61 min**… mais en réalité la transition entre 8 machines/postes ajoute 8-10 min → **~70 min pour 60 annoncés**. Lower (6 slots) tient dans 60 min. Verdict : Upper légèrement long, Lower correct.
- **Équipement** : ✅ tout dans FULL. ⚠️ Sous-exploitation : le slot fessiers ne propose que du BW en top-3 ; les machines abducteurs/adducteurs (chargeables) n'apparaissent qu'en 3ᵉ position.
- **Variété inter-sessions** : ✅ **Variété structurelle** — upper-push (bench-first, 3 cmp + 5 iso) vs upper-pull (traction-first, 2 cmp dos + 1 cmp chest) : slots différents et ordre différent. Idem lower-quad (squat-first) vs lower-hip (hip-thrust-first). C'est le meilleur profil du groupe C sur ce critère.
- **Couverture isolation** : ✅ **Complète** sur la semaine — pecs (fly S1), triceps (S1, S3), biceps (S1, S3), latéral (S1, S3), postérieur (S3), dos (S1, S3), quads (S2, S4), ischios (S2, S4), fessiers (S2, S4), mollets (S2, S4). Seul absent : avant-bras (acceptable).
- **Verdict global : ✅ Bon programme** — le meilleur du groupe C. Seules réserves : pec supérieur jamais chargé en compound, unilatéral absent, Upper un peu long.

---

# P41 — Upper/Lower explicit, beginner, 4j, fat_loss, HOME, 60 min

```
{ goal:'fat_loss', daysPerWeek:4, sessionDuration:60, equipment:HOME, level:'beginner', splitPreference:'upper-lower' }
```
HOME = `['dumbbell','kettlebell','band','bodyweight']` — **ni barbell, ni pullup_bar, ni machine, ni cable**.

**Simulation :**
- Étape 2 — `['upper-push','lower-quad','upper-pull','lower-hip']` (`:453`) → Upper A / Lower A / Upper B / Lower B
- Étape 3 — 8 / 6 / 8 / 6 slots (`:640`, fat_loss 60 min = base)
- Étape 5 — compound fat_loss `3×12-15` r60 (`:77`) · isolation fat_loss `3×12-15` r60 (`:84`) — **spec identique cmp/iso**
- `beginner` → `candidates[0]` déterministe (`:781`)
- Warmup pool HOME = 18 (le `band` est admis) : band-pull-apart · bird-dog · cat-cow · shoulder-circles …
- Core pool HOME = 12 : scissors · crunch · bicycle-crunch · vertical-leg-crunch …

## Séance 1 — Upper A (`upper-push`, 8 slots)

| # | Slot muscles | Cat | Candidats HOME (tri) | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[0] | seed-band-pull-apart | 2×10 |
| 1 | chest/chest_upper | cmp | bench-dumbbell(3) · pushup(2) · kb-floor-press(2) | **seed-bench-dumbbell** | 3×12-15 |
| 2 | back_width/thickness/back | cmp | *back_width : ∅* → row-dumbbell(3) · kb-row(2) · band-row(2) | **seed-row-dumbbell** | 3×12-15 |
| 3 | shoulders/shoulders_front | cmp | shoulder-press-db(3) · arnold-press(2) · kb-press(2) | **seed-shoulder-press-dumbbell** | 3×12-15 |
| 4 | chest/chest_lower/chest_upper | iso | fly-dumbbell(2) — *candidat unique* | **seed-fly-dumbbell** | 3×12-15 |
| 5 | triceps | iso | triceps-overhead(2) · band-tricep-pushdown(2) · kickback(1) | **seed-triceps-overhead** | 3×12-15 |
| 6 | shoulders_lateral | iso | lateral-raise(3) — *candidat unique* | **seed-lateral-raise** | 3×12-15 |
| 7 | biceps | iso | curl-dumbbell(3) · curl-hammer(3) · curl-incline(2) | **seed-curl-dumbbell** | 3×12-15 |
| 8 | back_thickness/back | iso | pullover-dumbbell(3) · shrug(2) | **seed-pullover-dumbbell** | 3×12-15 |
| c | core | — | pool[0] | seed-scissors | 3×15 |

## Séance 2 — Lower A (`lower-quad`, 6 slots)

| # | Slot muscles | Cat | Candidats HOME | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[1] | seed-bird-dog | 2×10 |
| 1 | quads/glutes | cmp | goblet-squat(3,kb) · bw-squat(3) · lunges(2,db) | **seed-goblet-squat** | 3×12-15 |
| 2 | hamstrings/glutes | cmp | kb-rdl(2) · dumbbell-rdl(2) · band-good-morning(1) | **kb-rdl** | 3×12-15 |
| 3 | quads | iso | bw-wall-sit(2) — *candidat unique* | **bw-wall-sit** ⚠️ | 3×12-15 |
| 4 | hamstrings | iso | *isolation : ∅* → fallback compound : dumbbell-rdl(2) · band-good-morning(1) | **dumbbell-rdl** ⚠️ | 3×12-15 |
| 5 | glutes | iso | glute-bridge(3) · donkey-kick(2) · fire-hydrant(2) | **seed-glute-bridge** | 3×12-15 |
| 6 | calves | iso | bw-calf-raise(2) · calf-raise-db(2) · kb-calf-raise(1) | **bw-calf-raise** | 3×12-15 |
| c | core | — | pool[1] | seed-crunch | 3×15 |

⚠️ Slot 3 : `bw-wall-sit` est un isométrique (`trackingType: 'time'`) prescrit en `3×12-15 reps`.
⚠️ Slot 4 : le slot « leg curl » n'a **aucun candidat isolation en HOME** → `isolationFirst.length === 0` (`:749-750`) → fallback sur les compounds → **deuxième RDL de la séance**. Les ischios reçoivent 2 hip-hinge et 0 flexion de genou.

## Séance 3 — Upper B (`upper-pull`, 8 slots)

| # | Slot muscles | Cat | Candidats HOME (neuf d'abord) | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[2] | seed-cat-cow | 2×10 |
| 1 | back_width/back | cmp | *back_width : ∅* → **kb-deadlift(2)** — *candidat unique* | **kb-deadlift** ❌ | 3×12-15 |
| 2 | back_thickness/back | cmp | kb-row(2,neuf) · band-row(2,neuf) · row-dumbbell(3,utilisé) | **kb-row** | 3×12-15 |
| 3 | chest/chest_upper | cmp | pushup(2,neuf) · kb-floor-press(2,neuf) · band-chest-press(1,neuf) | **seed-pushup** | 3×12-15 |
| 4 | shoulders_rear | iso | rear-delt-fly(2) · band-face-pull(2) · prone-y-raise(1) | **seed-rear-delt-fly** | 3×12-15 |
| 5 | biceps | iso | curl-hammer(3,neuf) · curl-incline(2,neuf) · band-curl(2,neuf) | **seed-curl-hammer** | 3×12-15 |
| 6 | back_thickness/back | iso | pullover-dumbbell(3,utilisé) · shrug(2,neuf) | **seed-pullover-dumbbell** ⚠️ *(répétition)* | 3×12-15 |
| 7 | triceps | iso | band-tricep-pushdown(2,neuf) · kickback(1,neuf) · kb-overhead-ext(1,neuf) | **band-tricep-pushdown** | 3×12-15 |
| 8 | shoulders_lateral | iso | lateral-raise(3,utilisé) — *candidat unique* | **seed-lateral-raise** ⚠️ *(répétition)* | 3×12-15 |
| c | core | — | pool[2] | seed-bicycle-crunch | 3×15 |

❌ **Slot 1 — trouvaille majeure du profil.** `back_width` n'a aucun compound en HOME ; le seul candidat via `back` est `kb-deadlift` (soulevé de terre kettlebell). Le slot « Traction / lat pulldown » (`:202`) devient un **hip-hinge**, sans aucun tirage. Et parce que `pickExercise` retourne un exercice (non `null`), **aucun warning n'est émis** (`:994-1007`). L'utilisateur reçoit une séance « Upper — tirage » dont le premier exercice ne travaille pas le dos en tirage.
⚠️ Slot 6 : `slot.muscles[0]='back_thickness'` prime sur `usedGlobally` → `pullover-dumbbell` est repris malgré `seed-shrug` disponible et neuf.

## Séance 4 — Lower B (`lower-hip`, 6 slots)

| # | Slot muscles | Cat | Candidats HOME (neuf d'abord) | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[3] | seed-shoulder-circles | 2×10 |
| 1 | glutes/hamstrings | cmp | hip-thrust-bw(3) · kb-swing(3) · kb-clean(3) | **seed-hip-thrust-bw** | 3×12-15 |
| 2 | quads/glutes | cmp | bw-squat(3,neuf) · lunges(2,neuf) · bulgarian(2,neuf) | **bw-squat** | 3×12-15 |
| 3 | glutes | iso | donkey-kick(2,neuf) · fire-hydrant(2,neuf) · glute-bridge(3,utilisé) | **seed-donkey-kick** | 3×12-15 |
| 4 | hamstrings | iso | *isolation : ∅* → band-good-morning(1,neuf) · kb-rdl(utilisé) · dumbbell-rdl(utilisé) | **band-good-morning** ⚠️ | 3×12-15 |
| 5 | quads | iso | bw-wall-sit(2,utilisé) — *candidat unique* | **bw-wall-sit** ⚠️ *(répétition)* | 3×12-15 |
| 6 | calves | iso | calf-raise-db(2,neuf) · kb-calf-raise(1,neuf) · bw-calf-raise(utilisé) | **seed-calf-raise-db** | 3×12-15 |
| c | core | — | pool[3] | seed-vertical-leg-crunch | 3×15 |

**Assertions : [PASS/FAIL]**
- Split `['upper-push','lower-quad','upper-pull','lower-hip']` : **PASS** (`:453`)
- Comparaison P25 (fat_loss beginner 4j **auto** → fullbody×4, `:565`) : **PASS** — le choix explicite **force** upper/lower là où l'auto aurait donné fullbody×4. Le générateur n'oppose aucune résistance.
- HOME sans pullup_bar → upper-pull back_width sans candidat pullup_bar : **PASS**, mais **remplacé silencieusement par `kb-deadlift`** (via `back`) et non par un rowing DB/KB comme l'assertion l'anticipait : **FAIL partiel de l'attente**
- Slots vides éventuels en HOME pour upper-pull : **aucun slot vide** — donc **aucun warning `generatorWarnings`** émis : **PASS technique / ❌ problème UX**
- Guard wizard déconseillant upper/lower à un débutant : **FAIL** — `incompatibleReason('upper-lower')` tombe dans `default: return null` (`ProgramGeneratorScreen.tsx:645-646`). **Aucun garde-fou** n'existe pour `upper-lower`, ni pour `fullbody`, ni pour `glutes-focus`.
- `progressStepKg` : 0 / `autoProgress: false` pour tous les bodyweight et band retenus (pushup, bw-squat, hip-thrust-bw, bw-wall-sit, bw-calf-raise, donkey-kick, glute-bridge, band-good-morning, band-tricep-pushdown, band-pull-apart) : **PASS** (`:789-790`) — soit **10 exercices sur 32** sans progression automatique.

**Coach :**
- **Équilibre musculaire** : ⚠️ Push (bench db, pushup, shoulder press, fly, lateral, 2× triceps) = 7 slots ; Pull réel (row-dumbbell, kb-row, 2× pullover, shrug-absent, rear-delt-fly) = 4 slots + 1 faux (kb-deadlift). **Aucun tirage vertical de toute la semaine** (impossible en HOME sans barre de traction). Ratio poussée/tirage ≈ 7:4 → **déséquilibre postural** chez un débutant. Le warning UX-5 (`:1115`) ne se déclenche pas car `upper-pull` est bien présent dans le split.
- **Cohérence objectif** : ⚠️ specs `3×12-15` r60 partout — cohérent fat_loss. Mais aucune composante cardio : le seed contient 4 `cardio_machine` (tapis, elliptique, rameur, vélo) et 4 cardio bodyweight (burpees, corde à sauter, high knees, jumping jacks) qui **ne sont jamais sélectionnables** — aucun slot n'a `primaryMuscle: 'cardio'`. Pour un objectif fat_loss, c'est une **lacune structurelle du générateur**, pas de ce profil.
- **Durée/contenu** : ✅ Upper 8 slots × 3 séries × ~1,6 min ≈ 39 min + 7 min warmup/core ≈ **46 min** ; Lower 6 slots ≈ 36 min. Avec repos 60 s, les séances **tiennent largement** dans les 60 min — c'est le seul profil du groupe C dont la durée annoncée est correcte (voire sous-remplie de 10-15 min).
- **Équipement** : ✅ aucun exercice hors HOME. ⚠️ Exploitation contrainte : 10/32 exercices non chargeables. `seed-calf-raise-db` n'arrive qu'en séance 4 alors que `bw-calf-raise` (non chargeable) passe devant en séance 2, uniquement par ordre du seed.
- **Variété inter-sessions** : ✅ **Variété structurelle** upper-push vs upper-pull et lower-quad vs lower-hip. ⚠️ Mais 3 répétitions forcées par pools trop courts : `seed-lateral-raise` (pool = 1), `bw-wall-sit` (pool = 1), `seed-pullover-dumbbell` (pool de 2, mais `slot.muscles[0]` reconduit le même).
- **Couverture isolation** : ⚠️ **Lacunes acceptables → problématiques**. Sans isolation dédiée en HOME : **ischios** (0 leg curl → fallback sur RDL/good morning), **quads** (1 seul wall-sit isométrique), **avant-bras** (0 candidat), **chest_lower** (0 candidat). Trois de ces quatre trous relèvent de l'équipement, pas du générateur — mais rien ne le signale à l'utilisateur.
- **Verdict global : ⚠️ Problème mineur à modéré** — programme viable et bien calibré en durée, mais le slot « traction » devient un soulevé de terre kettlebell **sans avertissement**, et un débutant a choisi un split intermédiaire sans qu'aucun garde-fou wizard ne l'en dissuade.

---

# P42 — PPL explicit, intermediate, 3j, hypertrophy, FULL, 60 min

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'intermediate', splitPreference:'ppl' }
```

**Simulation :**
- Étape 2 — `selectSplit` pref `ppl`, case 3 → `['push','pull','legs']` (`:443`)
- Noms : `toPublicType` identité pour push/pull/legs (`:126`) → 1 occurrence chacun → **aucun suffixe**
  → "Push — Poussée" / "Pull — Tirage" / "Legs — Jambes" (`:591-593`)
- Étape 3 — push base 6 → **6** · pull base 6 → **6** · legs base 6 → **6** (`:640`)
- Étape 5 — cmp `4×8-12` r90 · iso `3×10-15` r75
- **Filtre wizard** — `incompatibleReason('ppl')` : `days=3` ≥ 3 → pas de blocage (`ProgramGeneratorScreen.tsx:641`) ; `goal='hypertrophy'` ≠ strength (`:642`) ≠ endurance (`:643`) → **`null`** → bouton **actif**
- `intermediate` → top-3 random (`:782-783`)

## Séance 1 — Push — Poussée (6 slots · warmup bird-dog · core scissors)

| # | Slot muscles | Cat | Top-3 candidats (pop desc) | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[0] | seed-bird-dog | 2×10 |
| 1 | chest/chest_upper/chest_lower | cmp | bench-barbell(8) · bench-dumbbell(3) · chest-press-machine(3) | bench-barbell | 4×8-12 |
| 2 | shoulders/shoulders_front | cmp | shoulder-press-db(3) · ohp-barbell(3) · shoulder-press-machine(3) | shoulder-press-db | 4×8-12 |
| 3 | chest/chest_upper/chest_lower | iso | fly-dumbbell(2) · fly-cable(2) · pec-deck(2) | fly-dumbbell | 3×10-15 |
| 4 | triceps | iso | triceps-rope(3) · triceps-pushdown(3) · skullcrusher(2) | triceps-rope | 3×10-15 |
| 5 | shoulders_lateral/shoulders | iso | lateral-raise(3) · lateral-raise-cable(2) *(pool = 2)* | lateral-raise | 3×10-15 |
| 6 | shoulders_rear | iso | face-pull(2) · rear-delt-fly(2) *(pool = 2)* | face-pull | 3×10-15 |
| c | core | — | pool[0] | seed-scissors | 3×15 |

## Séance 2 — Pull — Tirage (6 slots · warmup cat-cow · core crunch)

| # | Slot muscles | Cat | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[1] | seed-cat-cow | 2×10 |
| 1 | back_width/back | cmp | lat-pulldown(3) · pullup(3) · deadlift(3) | lat-pulldown | 4×8-12 |
| 2 | back_thickness/back | cmp | row-barbell(7) · row-dumbbell(3) · row-tbar(2) | row-barbell | 4×8-12 |
| 3 | back_thickness/back_width/back | iso | pullover-dumbbell(3) · pullover-cable(2) · straight-arm-pulldown(2) | pullover-dumbbell | 3×10-15 |
| 4 | biceps | iso | curl-barbell(3) · curl-dumbbell(3) · curl-hammer(3) | curl-barbell | 3×10-15 |
| 5 | shoulders_rear | iso | rear-delt-fly(2,neuf) · face-pull(2,utilisé) | rear-delt-fly | 3×10-15 |
| 6 | forearms | iso | wrist-curl(1) · reverse-wrist-curl(1) *(pool = 2)* | seed-wrist-curl | 3×10-15 |
| c | core | — | pool[1] | seed-crunch | 3×15 |

## Séance 3 — Legs — Jambes (6 slots · warmup shoulder-circles · core cable-crunch)

| # | Slot muscles | Cat | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[2] | seed-shoulder-circles | 2×10 |
| 1 | quads | cmp | squat-barbell(8) · leg-press(3) · bw-squat(3) | squat-barbell | 4×8-12 |
| 2 | hamstrings/glutes | cmp | romanian-deadlift(3) · bw-nordic-curl(2) · dumbbell-rdl(2) | romanian-deadlift | 4×8-12 |
| 3 | quads | iso | leg-extension(3) · bw-wall-sit(2) *(pool = 2)* | leg-extension | 3×10-15 |
| 4 | glutes | iso | glute-bridge(3) · donkey-kick(2) · fire-hydrant(2) | glute-bridge | 3×10-15 |
| 5 | hamstrings | iso | leg-curl-lying(3) · leg-curl-seated(2) · leg-curl-standing(2) | leg-curl-lying | 3×10-15 |
| 6 | calves | iso | calf-seated(2) · calf-standing(2) · bw-calf-raise(2) | calf-raise-seated | 3×10-15 |
| c | core | — | pool[2] | seed-cable-crunch | 3×15 |

**Assertions : [PASS/FAIL]**
- Split `['push','pull','legs']` : **PASS** (`:443`)
- `incompatibleReason('ppl')` = `null` avec days=3 / hypertrophy → bouton actif : **PASS** (`ProgramGeneratorScreen.tsx:640-644`)
- Identique au split auto intermediate hypertrophy 3j (P06) : **PASS** (`:553` retourne le même tableau)
- 6/6/6 slots : **PASS** (`:640`)
- Top-3 chest compound push : bench-barbell(8) · bench-dumbbell(3) · chest-press-machine(3) : **PASS**
- Avantage explicit = étape Muscles sautée : **PASS** (`ProgramGeneratorScreen.tsx:703` — `stepIndex + 2`)
- 8 exercices par séance (6 + warmup + core) : **PASS**

**Coach :**
- **Équilibre musculaire** : ⚠️ Push 6 slots, Pull 6 slots, Legs 6 slots — équilibre **inter-séance parfait**, mais **fréquence 1×/semaine par groupe**. Ratio push/pull horizontal 1:1 (bench vs row), vertical 1:1 (OHP vs lat pulldown). Deltoïde postérieur travaillé 2× (push slot 6 + pull slot 5) — bon point. Fessiers : 1 seul slot isolation + secondaire du squat/RDL.
- **Cohérence objectif** : ⚠️ 4×8-12 / 3×10-15 = hypertrophie correcte, mais **10 séries/groupe/semaine** concentrées en une seule séance. La littérature (Schoenfeld 2016) montre une supériorité de la fréquence 2× à volume égal. Pour un intermédiaire, PPL 3j est un plancher acceptable mais pas optimal.
- **Durée/contenu** : ⚠️ 2 composés × 4 séries × 2,2 min + 4 isolations × 3 séries × 1,9 min ≈ 17,6 + 22,8 = **40 min** + warmup/core 7 min ≈ **47-55 min**. **Tient dans 60 min** — le seul profil FULL du groupe C au timing franchement confortable. Il resterait même de la marge pour 1-2 slots.
- **Équipement** : ✅ tout dans FULL, bon usage barre/haltère/poulie/machine. ⚠️ `seed-wrist-curl` (pop 1) est le seul choix d'avant-bras — slot de faible valeur qui consomme 3 séries.
- **Variété inter-sessions** : ✅ **Variété structurelle** — 3 types de séance totalement disjoints. Aucune séance du même type dans la semaine, donc pas de problème de rotation.
- **Couverture isolation** : ⚠️ **Lacunes acceptables**. Sans slot isolation dédié : **pec supérieur/inférieur** (le slot 3 est `chest`-first → fly plat), **dos largeur en isolation** (pullover-dumbbell est `back_thickness`), **abducteurs**. Le slot avant-bras (pull #6) serait mieux employé en 2ᵉ slot biceps ou en face pull supplémentaire.
- **Verdict global : ✅ Bon programme** — PPL canonique, bien équilibré, timing réaliste. Réserve unique : fréquence 1×/groupe, sous-optimale en hypertrophie pour un intermédiaire ; 60 min sous-utilisées (~10 min de marge).

---

# P43 — PPL explicit, intermediate, 3j, fat_loss, FULL, 60 min

```
{ goal:'fat_loss', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'intermediate', splitPreference:'ppl' }
```

**Simulation :**
- Étape 2 — `['push','pull','legs']` (`:443`) — la branche `pref === 'ppl'` **ignore totalement `goal`**
- Étape 3 — `adjustedSlotCount(6, 60, 'fat_loss')` = `base` = **6 slots** ×3 (`:640`, `isStrength = false`)
- Étape 5 — compound fat_loss `3×12-15` r60 (`:77`) · isolation fat_loss `3×12-15` r60 (`:84`) — **specs strictement identiques cmp/iso**
- **Filtre wizard** — `incompatibleReason('ppl')` : days=3 ✓, `goal='fat_loss'` n'est testé **ni** ligne 642 (strength) **ni** ligne 643 (endurance) → **`null`** → bouton **actif**, non grisé

## Séance 1 — Push — Poussée (6 slots · warmup bird-dog · core scissors)

| # | Slot muscles | Cat | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[0] | seed-bird-dog | 2×10 |
| 1 | chest/chest_upper/chest_lower | cmp | bench-barbell(8) · bench-dumbbell(3) · chest-press-machine(3) | bench-barbell | 3×12-15 (r60) |
| 2 | shoulders/shoulders_front | cmp | shoulder-press-db(3) · ohp-barbell(3) · shoulder-press-machine(3) | shoulder-press-db | 3×12-15 |
| 3 | chest/chest_upper/chest_lower | iso | fly-dumbbell(2) · fly-cable(2) · pec-deck(2) | fly-dumbbell | 3×12-15 |
| 4 | triceps | iso | triceps-rope(3) · triceps-pushdown(3) · skullcrusher(2) | triceps-rope | 3×12-15 |
| 5 | shoulders_lateral/shoulders | iso | lateral-raise(3) · lateral-raise-cable(2) | lateral-raise | 3×12-15 |
| 6 | shoulders_rear | iso | face-pull(2) · rear-delt-fly(2) | face-pull | 3×12-15 |
| c | core | — | pool[0] | seed-scissors | 3×15 |

## Séance 2 — Pull — Tirage (6 slots · warmup cat-cow · core crunch)

| # | Slot muscles | Cat | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[1] | seed-cat-cow | 2×10 |
| 1 | back_width/back | cmp | lat-pulldown(3) · pullup(3) · deadlift(3) | lat-pulldown | 3×12-15 |
| 2 | back_thickness/back | cmp | row-barbell(7) · row-dumbbell(3) · row-tbar(2) | row-barbell | 3×12-15 |
| 3 | back_thickness/back_width/back | iso | pullover-dumbbell(3) · pullover-cable(2) · straight-arm-pulldown(2) | pullover-dumbbell | 3×12-15 |
| 4 | biceps | iso | curl-barbell(3) · curl-dumbbell(3) · curl-hammer(3) | curl-barbell | 3×12-15 |
| 5 | shoulders_rear | iso | rear-delt-fly(2,neuf) · face-pull(2,utilisé) | rear-delt-fly | 3×12-15 |
| 6 | forearms | iso | wrist-curl(1) · reverse-wrist-curl(1) | seed-wrist-curl | 3×12-15 |
| c | core | — | pool[1] | seed-crunch | 3×15 |

## Séance 3 — Legs — Jambes (6 slots · warmup shoulder-circles · core cable-crunch)

| # | Slot muscles | Cat | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[2] | seed-shoulder-circles | 2×10 |
| 1 | quads | cmp | squat-barbell(8) · leg-press(3) · bw-squat(3) | squat-barbell | 3×12-15 |
| 2 | hamstrings/glutes | cmp | romanian-deadlift(3) · bw-nordic-curl(2) · dumbbell-rdl(2) | romanian-deadlift | 3×12-15 |
| 3 | quads | iso | leg-extension(3) · bw-wall-sit(2) | leg-extension | 3×12-15 |
| 4 | glutes | iso | glute-bridge(3) · donkey-kick(2) · fire-hydrant(2) | glute-bridge | 3×12-15 |
| 5 | hamstrings | iso | leg-curl-lying(3) · leg-curl-seated(2) · leg-curl-standing(2) | leg-curl-lying | 3×12-15 |
| 6 | calves | iso | calf-seated(2) · calf-standing(2) · bw-calf-raise(2) | calf-raise-seated | 3×12-15 |
| c | core | — | pool[2] | seed-cable-crunch | 3×15 |

**Assertions : [PASS/FAIL]**
- `incompatibleReason('ppl')` = `null` pour fat_loss (seuls strength et endurance sont bloqués) : **PASS** (`ProgramGeneratorScreen.tsx:640-644`)
- Comparaison P08 (auto fat_loss 3j intermediate → PPF `['push','pull','fullbody-quad']`, `:555`) : **PASS** — l'explicit PPL **remplace** le fullbody de fin de semaine par une séance Legs
- Split identique à P42 malgré le changement d'objectif : **PASS** — la branche `pref` (`:440-447`) n'utilise **jamais** `goal`
- Specs fat_loss 3×12-15 r60 sur compounds **et** isolations : **PASS** (`:77` et `:84` identiques pour fat_loss)

**PPL vs PPF pour `fat_loss` — analyse coach comparative :**

| Critère | PPF (auto, P08) | PPL (explicit, P43) |
|---|---|---|
| Fréquence pecs / dos / épaules | **2×** (push + fullbody, pull + fullbody) | 1× |
| Fréquence quads / ischios | 1× (dans le fullbody-quad) | 1× (séance Legs, mieux détaillée) |
| Dépense énergétique séance 3 | Fullbody = 4 composés multi-articulaires enchaînés → **EPOC supérieur** | Legs = 2 composés + 4 isolations jambes |
| Rétention masse maigre en déficit | **Meilleure** (stimulus 2× sur le haut du corps) | Moindre (1× par groupe) |
| Format circuit / densité | Le fullbody s'y prête | Les isolations jambes s'y prêtent mal |

→ **Le PPF est objectivement supérieur pour `fat_loss`.** L'écart n'est pas dramatique (le PPL reste un programme complet et bien équilibré), mais en déficit calorique la fréquence de stimulus est le premier levier de rétention de masse maigre.

**Coach :**
- **Équilibre musculaire** : ✅ identique à P42 — push/pull/legs équilibrés, deltoïde postérieur 2×, fessiers 1 slot isolation.
- **Cohérence objectif** : ❌ **Le principal problème.** `fat_loss` produit `3×12-15` r60 sur **tous** les slots, compounds inclus (`COMPOUND_SPEC.fat_loss` = `ISOLATION_SPEC.fat_loss`, `:77`/`:84`). Un squat barre à 12-15 reps avec 60 s de repos est physiologiquement très dur et pousse à sous-charger. Surtout : **aucune composante cardio n'est jamais insérée** — les 8 exercices `primaryMuscle: 'cardio'` du seed (tapis, vélo, rameur, elliptique, burpees, corde à sauter, high knees, jumping jacks) ne sont ciblés par **aucun slot** de `SLOTS`. Pour un objectif « perte de gras », c'est une lacune structurelle du générateur.
- **Durée/contenu** : ✅ 6 slots × 3 séries × ~1,6 min ≈ 29 min + 7 min warmup/core ≈ **36-42 min** pour 60 annoncés. **Sous-rempli de ~20 min** — précisément l'espace qu'un bloc cardio ou un finisher en circuit aurait dû occuper.
- **Équipement** : ✅ conforme FULL.
- **Variété inter-sessions** : ✅ **Variété structurelle** (3 types disjoints).
- **Couverture isolation** : ⚠️ **Lacunes acceptables** — identiques à P42 (pec sup./inf., dos largeur iso, abducteurs).
- **Verdict global : ⚠️ Problème mineur** — programme correct, mais l'auto aurait mieux servi l'objectif (PPF), les 60 min sont sous-employées de 20 min, et l'objectif `fat_loss` n'ajoute **aucun** cardio.

---

# P44 — Arnold explicit, intermediate, 4j, hypertrophy, FULL, 60 min

```
{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'intermediate', splitPreference:'arnold' }
```

**Simulation :**
- **Filtre wizard** — `incompatibleReason('arnold')` : `days=4` ≥ 3 (`:635`) ✓ · `level='intermediate'` ≠ beginner (`:636`) ✓ · `goal='hypertrophy'` ≠ strength (`:637`) ≠ endurance (`:638`) → **`null`** → bouton **actif**
- Étape 2 — `selectSplit` pref `arnold`, case 4 → `['chest-back','shoulders-arms','legs','upper']` (`:463`)
- Étape 3 — chest-back 9 → **9** · shoulders-arms 8 → **8** · legs 6 → **6** · upper 8 → **8** (`:640`)
- Étape 5 — cmp `4×8-12` r90 · iso `3×10-15` r75 · `intermediate` → top-3 random

**❌ NOMS — écart avec l'assertion attendue.** `toPublicType` projette `chest-back` → `'upper'` (`:122`), `shoulders-arms` → `'upper'` (`:122`) et `upper` → `'upper'` (`:126`). Le canon `'upper'` apparaît donc **3 fois** → `totalOfType = 3 > 1` → suffixe appliqué (`:1039-1041`). Noms réels :
> **"Chest & Back — Pectoraux & Dos A"** · **"Shoulders & Arms — Épaules & Bras B"** · **"Legs — Jambes"** · **"Upper — Haut du corps C"**

Un suffixe A/B/C réparti sur **trois noms différents** est incompréhensible : les lettres suggèrent des variantes d'une même séance.

## Séance 1 — Chest & Back A (`chest-back`, 9 slots · warmup bird-dog · core scissors)

| # | Slot muscles | Cat | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[0] | seed-bird-dog | 2×10 |
| 1 | chest/chest_upper | cmp | bench-barbell(8) · bench-dumbbell(3) · chest-press-machine(3) | bench-barbell | 4×8-12 |
| 2 | back_width/back | cmp | lat-pulldown(3) · pullup(3) · deadlift(3) | lat-pulldown | 4×8-12 |
| 3 | shoulders/shoulders_front | cmp | shoulder-press-db(3) · ohp-barbell(3) · shoulder-press-machine(3) | shoulder-press-db | 4×8-12 |
| 4 | back_thickness/back | cmp | row-barbell(7) · row-dumbbell(3) · row-tbar(2) | row-barbell | 4×8-12 |
| 5 | chest/chest_lower/chest_upper | iso | fly-dumbbell(2) · fly-cable(2) · pec-deck(2) | fly-dumbbell | 3×10-15 |
| 6 | back_thickness/back_width/back | iso | pullover-dumbbell(3) · pullover-cable(2) · straight-arm-pulldown(2) | pullover-dumbbell | 3×10-15 |
| 7 | biceps | iso | curl-barbell(3) · curl-dumbbell(3) · curl-hammer(3) | curl-barbell | 3×10-15 |
| 8 | triceps | iso | triceps-rope(3) · triceps-pushdown(3) · skullcrusher(2) | triceps-rope | 3×10-15 |
| 9 | shoulders_rear | iso | face-pull(2) · rear-delt-fly(2) | face-pull | 3×10-15 |
| c | core | — | pool[0] | seed-scissors | 3×15 |

## Séance 2 — Shoulders & Arms B (`shoulders-arms`, 8 slots · warmup cat-cow · core crunch)

| # | Slot muscles | Cat | Top-3 candidats (neuf d'abord) | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[1] | seed-cat-cow | 2×10 |
| 1 | shoulders/shoulders_front | cmp | ohp-barbell(3,neuf) · shoulder-press-machine(3,neuf) · arnold-press(2,neuf) | ohp-barbell | 4×8-12 |
| 2 | shoulders_lateral | iso | lateral-raise(3) · lateral-raise-cable(2) *(pool = 2)* | lateral-raise | 3×10-15 |
| 3 | shoulders_rear | iso | rear-delt-fly(2,neuf) · face-pull(2,utilisé) | rear-delt-fly | 3×10-15 |
| 4 | biceps | iso | curl-dumbbell(3,neuf) · curl-hammer(3,neuf) · curl-incline(2,neuf) | curl-dumbbell | 3×10-15 |
| 5 | triceps | iso | triceps-pushdown(3,neuf) · skullcrusher(2,neuf) · triceps-overhead(2,neuf) | triceps-pushdown | 3×10-15 |
| 6 | biceps (2ᵉ) | iso | curl-hammer(3) · curl-incline(2) · curl-cable(2) *(hors usedInWorkout)* | curl-hammer | 3×10-15 |
| 7 | triceps (2ᵉ) | iso | skullcrusher(2) · triceps-overhead(2) · triceps-kickback(1) | skullcrusher | 3×10-15 |
| 8 | forearms | iso | wrist-curl(1) · reverse-wrist-curl(1) *(pool = 2)* | seed-wrist-curl | 3×10-15 |
| c | core | — | pool[1] | seed-crunch | 3×15 |

## Séance 3 — Legs — Jambes (`legs`, 6 slots · warmup shoulder-circles · core cable-crunch)

| # | Slot muscles | Cat | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[2] | seed-shoulder-circles | 2×10 |
| 1 | quads | cmp | squat-barbell(8) · leg-press(3) · bw-squat(3) | squat-barbell | 4×8-12 |
| 2 | hamstrings/glutes | cmp | romanian-deadlift(3) · bw-nordic-curl(2) · dumbbell-rdl(2) | romanian-deadlift | 4×8-12 |
| 3 | quads | iso | leg-extension(3) · bw-wall-sit(2) | leg-extension | 3×10-15 |
| 4 | glutes | iso | glute-bridge(3) · donkey-kick(2) · fire-hydrant(2) | glute-bridge | 3×10-15 |
| 5 | hamstrings | iso | leg-curl-lying(3) · leg-curl-seated(2) · leg-curl-standing(2) | leg-curl-lying | 3×10-15 |
| 6 | calves | iso | calf-seated(2) · calf-standing(2) · bw-calf-raise(2) | calf-raise-seated | 3×10-15 |
| c | core | — | pool[2] | seed-cable-crunch | 3×15 |

## Séance 4 — Upper — Haut du corps C (`upper`, 8 slots · warmup dead-bug · core bicycle-crunch)

| # | Slot muscles | Cat | Top-3 candidats (neuf d'abord) | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[3] | seed-dead-bug | 2×10 |
| 1 | chest/chest_upper | cmp | bench-dumbbell(3,neuf) · chest-press-machine(3,neuf) · pushup(2,neuf) | bench-dumbbell | 4×8-12 |
| 2 | back_width/thickness/back | cmp | pullup(3,neuf) · lat-pulldown(3,utilisé) · deadlift(3,neuf) | pullup | 4×8-12 |
| 3 | shoulders/shoulders_front | cmp | shoulder-press-machine(3,neuf) · arnold-press(2,neuf) · pike-pushup(1,neuf) | shoulder-press-machine | 4×8-12 |
| 4 | shoulders_lateral/rear | iso | lateral-raise-cable(2,neuf) · lateral-raise(3,utilisé) · face-pull(2,utilisé) | lateral-raise-cable | 3×10-15 |
| 5 | back_thickness/back | iso | pullover-cable(2,neuf) · straight-arm-pulldown(2,neuf) · pullover-db(3,utilisé) | pullover-cable | 3×10-15 |
| 6 | chest/chest_lower | iso | fly-cable(2,neuf) · pec-deck(2,neuf) · fly-dumbbell(2,utilisé) | fly-cable | 3×10-15 |
| 7 | biceps | iso | curl-incline(2,neuf) · curl-cable(2,neuf) · curl-preacher(2,neuf) | curl-incline | 3×10-15 |
| 8 | triceps | iso | triceps-overhead(2,neuf) · triceps-kickback(1,neuf) · triceps-rope(3,utilisé) | triceps-overhead | 3×10-15 |
| c | core | — | pool[3] | seed-bicycle-crunch | 3×15 |

**Assertions : [PASS/FAIL]**
- `incompatibleReason('arnold')` = `null` (days 4 ≥ 3, intermediate, hypertrophy) → bouton actif : **PASS** (`ProgramGeneratorScreen.tsx:634-639`)
- Split `['chest-back','shoulders-arms','legs','upper']` : **PASS** (`:463`)
- Slots 9 / 8 / 6 / 8 : **PASS** (`:640`)
- Noms « Chest & Back / Shoulders & Arms / Legs / Upper » **sans suffixe** : **❌ FAIL** — les 3 séances de canon `'upper'` reçoivent **A / B / C** (`:1039-1041`)
- Top-3 chest compound (chest-back, intermediate FULL) : bench-barbell(8) · bench-dumbbell(3) · chest-press-machine(3) : **PASS**
- `hasPushSession` / `hasPullSession` : `chest-back` compte pour les deux (`:1107`, `:1113`) → pas de warning UX-5 : **PASS**

**Coach :**
- **Équilibre musculaire** : ✅ très bon sur le haut du corps. Pecs 2× (S1, S4), dos 2× (S1 ×2 slots, S4), épaules **3×** (S1, S2, S4), biceps 4 slots, triceps 4 slots. Le principe antagoniste de S1 est respecté (bench → lat pulldown → OHP → row en alternance).
- ⚠️ **Déséquilibre haut/bas flagrant** : **25 slots haut du corps contre 6 slots jambes** sur la semaine (ratio 4:1), jambes travaillées **1× seulement**. Défaut inhérent à l'Arnold 4j, aggravé par la séance `upper` en position 4 (`:463`) au lieu d'une 2ᵉ séance jambes.
- **Cohérence objectif** : ✅ specs hypertrophie canoniques. Volume bras : biceps 4 slots × 3 = **12 séries/sem**, triceps 12 séries/sem → **suffisant, voire généreux** pour l'hypertrophie des bras (la question posée par l'audit reçoit une réponse positive). En revanche épaules = 3 compounds + 3 isolations, excessif face à 6 slots jambes.
- **Durée/contenu** : ❌ S1 = 9 slots : 4 composés × 4 séries × 2,2 min + 5 isolations × 3 séries × 1,9 min ≈ 35 + 28 = **63 min** de travail-repos + 7 min warmup/core ≈ **70 min minimum**, réellement 80-90 min avec les transitions. Annoncé 60 min → **dérive de +35 à +50 %**. S2 (8 slots quasi tout isolation) ≈ 55 min, correct. S4 ≈ 65 min.
- **Équipement** : ✅ FULL bien exploité (barre, haltère, poulie, machine, barre de traction tous représentés).
- **Variété inter-sessions** : ✅ **Variété structurelle** — 4 templates aux slots totalement différents et **aucune répétition d'exercice sur les 31 slots** de la semaine. Meilleure variété d'exercices du groupe C.
- **Couverture isolation** : ✅ **Complète** haut du corps (pecs ×2, dos ×2, latéral ×2, postérieur ×2, biceps ×4, triceps ×4, avant-bras ×1). ⚠️ **Lacune bas du corps** : quads/ischios/fessiers/mollets = 1 slot chacun sur toute la semaine.
- **Verdict global : ⚠️ Problème mineur** — bon programme de bodybuilding classique, mais (a) ratio haut/bas 4:1, (b) séance 1 déborde de ~25 min, (c) **bug de nommage A/B/C réparti sur trois noms de séance différents**.

---

# P45 — Arnold explicit, advanced, 3j, fat_loss, BB+DB, 45 min

```
{ goal:'fat_loss', daysPerWeek:3, sessionDuration:45, equipment:BB+DB, level:'advanced', splitPreference:'arnold' }
```

**Simulation :**
- **Filtre wizard** — `incompatibleReason('arnold')` : days=3 ≥ 3 ✓ · advanced ≠ beginner ✓ · `goal='fat_loss'` non testé (seuls strength `:637` et endurance `:638`) → **`null`** → bouton **actif**
- Étape 2 — `selectSplit` pref `arnold`, case 3 → `['chest-back','shoulders-arms','legs']` — **l'Arnold classique** (`:462`)
- Noms : canon `'upper'` **2×** → suffixes A/B → **"Chest & Back — Pectoraux & Dos A"** · **"Shoulders & Arms — Épaules & Bras B"** · **"Legs — Jambes"**
- Étape 3 — chest-back 9 → `max(3, floor(6.75))` = **6** · shoulders-arms 8 → `max(3,6)` = **6** · legs 6 → `max(3, floor(4.5))` = **4** (`:634-636`)
- Étape 5 — `adjustedSpec(spec, 45)` : factor 0.75 (`:653-654`) → compound fat_loss `sets = max(2, floor(3×0.75)) = 2` → **2×12-15 r60** · isolation idem → **2×12-15 r60**
- `advanced` → top-3 random (`:782-783`)

## Séance 1 — Chest & Back A (`chest-back`, 6 slots retenus sur 9)

| # | Slot muscles | Cat | Top-3 candidats BB+DB | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[0] | seed-bird-dog | 2×10 |
| 1 | chest/chest_upper | cmp | bench-barbell(8) · bench-dumbbell(3) · incline-bench-barbell(4) | bench-barbell | 2×12-15 |
| 2 | back_width/back | cmp | **seed-deadlift** — *candidat unique* (`back_width` : ∅ en BB+DB) | seed-deadlift ❌ | 2×12-15 |
| 3 | shoulders/shoulders_front | cmp | shoulder-press-db(3) · ohp-barbell(3) · arnold-press(2) | shoulder-press-db | 2×12-15 |
| 4 | back_thickness/back | cmp | row-barbell(7) · row-dumbbell(3) · row-tbar(2) | row-barbell | 2×12-15 |
| 5 | chest/chest_lower/chest_upper | iso | **fly-dumbbell(2)** — *candidat isolation unique* | seed-fly-dumbbell | 2×12-15 |
| 6 | back_thickness/back_width/back | iso | pullover-dumbbell(3) · shrug(2) · seed-pullover(1) | pullover-dumbbell | 2×12-15 |
| — | ~~biceps · triceps · shoulders_rear~~ | — | **slots 7-8-9 éjectés par le cap 6** | — | — |
| c | core | — | pool[0] | seed-scissors | 3×15 |

❌ Slot 2 : le « Traction / lat pulldown » (`:277`) devient un **soulevé de terre barre** à 2×12-15 — un hip-hinge lourd prescrit en reps élevées. Aucun warning (`pickExercise` retourne un exercice non `null`).
⚠️ Les 3 slots coupés incluent le **face pull** (`:285`, commenté « pos 9 — éjecté si cap=8 »), seul travail d'épaule postérieure de la séance.

## Séance 2 — Shoulders & Arms B (`shoulders-arms`, 6 slots retenus sur 8)

| # | Slot muscles | Cat | Top-3 candidats BB+DB | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[1] | seed-cat-cow | 2×10 |
| 1 | shoulders/shoulders_front | cmp | ohp-barbell(3,neuf) · arnold-press(2,neuf) · shoulder-press-db(3,utilisé) | ohp-barbell | 2×12-15 |
| 2 | shoulders_lateral | iso | **lateral-raise(3)** — *unique* (upright-row = compound, écarté `:749-750`) | seed-lateral-raise | 2×12-15 |
| 3 | shoulders_rear | iso | **rear-delt-fly(2)** — *unique* (face-pull = cable, band hors BB+DB) | seed-rear-delt-fly | 2×12-15 |
| 4 | biceps | iso | curl-barbell(3) · curl-dumbbell(3) · curl-hammer(3) | curl-barbell | 2×12-15 |
| 5 | triceps | iso | skullcrusher(2) · triceps-overhead(2) · triceps-kickback(1) | skullcrusher | 2×12-15 |
| 6 | biceps (2ᵉ) | iso | curl-dumbbell(3) · curl-hammer(3) · curl-incline(2) | curl-dumbbell | 2×12-15 |
| — | ~~triceps (2ᵉ) · forearms~~ | — | **slots 7-8 éjectés par le cap 6** | — | — |
| c | core | — | pool[1] | seed-crunch | 3×15 |

⚠️ Le cap 6 coupe le **2ᵉ slot triceps** mais garde le **2ᵉ slot biceps** (ordre canonique `:296-300` : bi, tri, bi, tri, avant-bras) → **biceps 2 slots / triceps 1 slot** dans une séance « bras ». Déséquilibre agoniste/antagoniste inversé.

## Séance 3 — Legs — Jambes (`legs`, 4 slots retenus sur 6)

| # | Slot muscles | Cat | Top-3 candidats BB+DB | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[2] | seed-shoulder-circles | 2×10 |
| 1 | quads | cmp | squat-barbell(8) · lunges(2) · front-squat(2) | squat-barbell | 2×12-15 |
| 2 | hamstrings/glutes | cmp | romanian-deadlift(3) · dumbbell-rdl(2) · good-morning(1) | romanian-deadlift | 2×12-15 |
| 3 | quads | iso | *isolation : ∅ en BB+DB* → fallback cmp : lunges(2) · front-squat(2) · bulgarian(2) | seed-lunges ⚠️ | 2×12-15 |
| 4 | glutes | iso | *isolation : ∅* → **seed-hip-thrust(4)** — *unique* | seed-hip-thrust ⚠️ | 2×12-15 |
| — | ~~hamstrings iso · calves~~ | — | **slots 5-6 éjectés par le cap 4** | — | — |
| c | core | — | pool[2] | seed-bicycle-crunch | 3×15 |

⚠️ Slots 3 et 4 : aucune isolation `quads` ni `glutes` en BB+DB → `isolationFirst.length === 0` (`:749-750`) → fallback sur les compounds. Le « leg extension » devient une **3ᵉ variante de squat/fente**, le « hip abduction » un **hip thrust barre**.
❌ **Mollets totalement absents** du programme (slot 6 éjecté, aucun autre slot calves dans l'Arnold 3j).

**Assertions : [PASS/FAIL]**
- `incompatibleReason('arnold')` = `null` pour fat_loss : **PASS** (`ProgramGeneratorScreen.tsx:634-639`)
- Split `['chest-back','shoulders-arms','legs']` : **PASS** (`:462`)
- `adjustedSlotCount(9,45,'fat_loss')` = 6 : **PASS** (`:635-636`)
- `adjustedSlotCount(8,45,'fat_loss')` = 6 : **PASS**
- `adjustedSlotCount(6,45,'fat_loss')` = 4 : **PASS**
- `adjustedSpec(compound_fat_loss, 45)` → 2 séries : **PASS** (`:653-654`)
- Noms sans suffixe : **❌ FAIL** — suffixes **A** et **B** appliqués (`:1039-1041`)
- `advanced` → top-3 random : **PASS** (`:782-783`)

**Coach :**
- **Équilibre musculaire** : ❌ Pecs 2 slots, dos 3 (dont 1 faux : deadlift), épaules 3, biceps 3, triceps 1, jambes 4, **mollets 0**, **deltoïde postérieur 1** (celui de S1 est coupé). Ratio biceps/triceps 3:1 — inversé. La coupe à 45 min supprime exactement les slots d'équilibre et de finition.
- **Cohérence objectif** : ❌ **2 séries par exercice** est sous le seuil de maintien de masse maigre en déficit (minimum admis ≈ 4-6 séries/groupe/sem ; ici pecs = 4, triceps = 2, mollets = 0). Pour un **confirmé** en fat_loss, c'est nettement insuffisant : c'est le niveau qui a le plus besoin de volume pour préserver l'acquis. Et là encore, **zéro cardio**.
- **Durée/contenu** : ✅ 6 slots × 2 séries × ~1,6 min ≈ 19 min + 7 min warmup/core ≈ **26-32 min** pour 45 annoncés. **Sous-rempli de 13-19 min.** Le barème 45 min coupe trop : garder 8 slots × 2 séries (≈ 33 min) aurait été plus juste que 6 slots × 2 séries.
- **Équipement** : ⚠️ BB+DB respecté, mais trois trous durs subis sans avertissement : `back_width` (aucun compound), `quads`/`glutes` (aucune isolation), `shoulders_rear` (1 seul candidat, coupé en S1).
- **Variété inter-sessions** : ✅ **Variété structurelle** — 3 templates disjoints, aucune séance du même type. Pas de problème de rotation à 3 séances.
- **Couverture isolation** : ❌ **Lacunes problématiques** — sur 16 slots, 6 seulement sont de vraies isolations, et les slots isolation jambes sont remplis par des composés. Absents : mollets (0), deltoïde postérieur en S1 (0), 2ᵉ triceps (0), avant-bras (0), ischios en isolation (0).
- **Verdict global : ❌ Problème sérieux** — la triple compression (Arnold 3j **+** barème 45 min **+** équipement BB+DB) réduit le programme à 16 slots dont plusieurs détournés, avec 2 séries chacun, sans mollets ni cardio, pour un objectif fat_loss chez un confirmé.

---

# P46 — Brosplit explicit, intermediate, 5j, hypertrophy, FULL, 60 min

```
{ goal:'hypertrophy', daysPerWeek:5, sessionDuration:60, equipment:FULL, level:'intermediate', splitPreference:'brosplit' }
```

**Simulation :**
- **Filtre wizard** — `incompatibleReason('brosplit')` : `days=5` **non** < 5 (`:629`) ✓ · intermediate ≠ beginner (`:630`) ✓ · hypertrophy ≠ strength (`:631`) ≠ endurance (`:632`) → **`null`** → bouton **actif**
- Étape 2 — `selectSplit` pref `brosplit`, case 5 → `['chest-tri','back-bi','legs','shoulders-arms','upper']` (`:474`)
- Étape 3 — chest-tri 7 → **7** · back-bi 8 → **8** · legs 6 → **6** · shoulders-arms 8 → **8** · upper 8 → **8** (`:640`)
- Étape 5 — cmp `4×8-12` r90 · iso `3×10-15` r75 · `intermediate` → top-3 random

**❌ NOMS.** `chest-tri`→`'push'` (`:123`), `back-bi`→`'pull'` (`:124`), `legs`→`'legs'`, `shoulders-arms`→`'upper'` (`:122`), `upper`→`'upper'` (`:126`). Canon `'upper'` **2×** → suffixes A/B sur les séances 4 et 5 :
> "Chest & Triceps — Pectoraux & Triceps" · "Back & Biceps — Dos & Biceps" · "Legs — Jambes" · **"Shoulders & Arms — Épaules & Bras A"** · **"Upper — Haut du corps B"**

## Séance 1 — Chest & Triceps (`chest-tri`, 7 slots · warmup bird-dog · core scissors)

| # | Slot muscles | Cat | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[0] | seed-bird-dog | 2×10 |
| 1 | chest/chest_upper | cmp | bench-barbell(8) · bench-dumbbell(3) · chest-press-machine(3) | bench-barbell | 4×8-12 |
| 2 | **chest_upper**/chest | cmp | incline-bench-barbell(4) · incline-bench-dumbbell(2) · bw-incline-pushup(2) | incline-bench-barbell | 4×8-12 |
| 3 | triceps | iso | triceps-rope(3) · triceps-pushdown(3) · skullcrusher(2) | triceps-rope | 3×10-15 |
| 4 | chest/chest_lower/chest_upper | iso | fly-dumbbell(2) · fly-cable(2) · pec-deck(2) | fly-dumbbell | 3×10-15 |
| 5 | chest_lower | iso | *isolation : ∅* → fallback cmp : **seed-dips(3)** · decline-bench-barbell(1) *(pool = 2)* | seed-dips ⚠️ | 3×10-15 |
| 6 | triceps (2ᵉ) | iso | triceps-pushdown(3,neuf) · skullcrusher(2) · triceps-overhead(2) | triceps-pushdown | 3×10-15 |
| 7 | shoulders_rear | iso | face-pull(2) · rear-delt-fly(2) | face-pull | 3×10-15 |
| c | core | — | pool[0] | seed-scissors | 3×15 |

✅ Slot 2 : `slot.muscles[0] = 'chest_upper'` (`:308`) inverse la priorité → l'incliné barre est atteint. C'est **le seul template du générateur où le pec supérieur est chargé en compound**.
⚠️ Slot 5 : `chest_lower` n'a aucune isolation → le « cable crossover bas » (`:311`) devient des **dips** (compound, `pullup_bar`, `progressStepKg: 0`) prescrits en 3×10-15.

## Séance 2 — Back & Biceps (`back-bi`, 8 slots · warmup cat-cow · core crunch)

| # | Slot muscles | Cat | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[1] | seed-cat-cow | 2×10 |
| 1 | back_width/back | cmp | lat-pulldown(3) · pullup(3) · deadlift(3) | lat-pulldown | 4×8-12 |
| 2 | back_thickness/back | cmp | row-barbell(7) · row-dumbbell(3) · row-tbar(2) | row-barbell | 4×8-12 |
| 3 | biceps | iso | curl-barbell(3) · curl-dumbbell(3) · curl-hammer(3) | curl-barbell | 3×10-15 |
| 4 | back_thickness/back_width/back | iso | pullover-dumbbell(3) · pullover-cable(2) · straight-arm-pulldown(2) | pullover-dumbbell | 3×10-15 |
| 5 | biceps (2ᵉ) | iso | curl-dumbbell(3,neuf) · curl-hammer(3,neuf) · curl-incline(2) | curl-dumbbell | 3×10-15 |
| 6 | back_width | iso | **seed-pullover(1)** — *candidat isolation unique* | seed-pullover | 3×10-15 |
| 7 | shoulders_rear | iso | rear-delt-fly(2,neuf) · face-pull(2,utilisé) | rear-delt-fly | 3×10-15 |
| 8 | forearms | iso | wrist-curl(1) · reverse-wrist-curl(1) | seed-wrist-curl | 3×10-15 |
| c | core | — | pool[1] | seed-crunch | 3×15 |

## Séance 3 — Legs — Jambes (`legs`, 6 slots · warmup shoulder-circles · core cable-crunch)

| # | Slot muscles | Cat | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[2] | seed-shoulder-circles | 2×10 |
| 1 | quads | cmp | squat-barbell(8) · leg-press(3) · bw-squat(3) | squat-barbell | 4×8-12 |
| 2 | hamstrings/glutes | cmp | romanian-deadlift(3) · bw-nordic-curl(2) · dumbbell-rdl(2) | romanian-deadlift | 4×8-12 |
| 3 | quads | iso | leg-extension(3) · bw-wall-sit(2) | leg-extension | 3×10-15 |
| 4 | glutes | iso | glute-bridge(3) · donkey-kick(2) · fire-hydrant(2) | glute-bridge | 3×10-15 |
| 5 | hamstrings | iso | leg-curl-lying(3) · leg-curl-seated(2) · leg-curl-standing(2) | leg-curl-lying | 3×10-15 |
| 6 | calves | iso | calf-seated(2) · calf-standing(2) · bw-calf-raise(2) | calf-raise-seated | 3×10-15 |
| c | core | — | pool[2] | seed-cable-crunch | 3×15 |

## Séance 4 — Shoulders & Arms A (`shoulders-arms`, 8 slots · warmup dead-bug · core bicycle-crunch)

| # | Slot muscles | Cat | Top-3 candidats (neuf d'abord) | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[3] | seed-dead-bug | 2×10 |
| 1 | shoulders/shoulders_front | cmp | shoulder-press-db(3,neuf) · ohp-barbell(3,neuf) · shoulder-press-machine(3,neuf) | shoulder-press-db | 4×8-12 |
| 2 | shoulders_lateral | iso | lateral-raise(3) · lateral-raise-cable(2) | lateral-raise | 3×10-15 |
| 3 | shoulders_rear | iso | face-pull(2,utilisé) · rear-delt-fly(2,utilisé) *(pool = 2, épuisé)* | face-pull ⚠️ *(répétition)* | 3×10-15 |
| 4 | biceps | iso | curl-hammer(3,neuf) · curl-incline(2,neuf) · curl-cable(2,neuf) | curl-hammer | 3×10-15 |
| 5 | triceps | iso | skullcrusher(2,neuf) · triceps-overhead(2,neuf) · kickback(1,neuf) | skullcrusher | 3×10-15 |
| 6 | biceps (2ᵉ) | iso | curl-incline(2) · curl-cable(2) · curl-preacher(2) | curl-incline | 3×10-15 |
| 7 | triceps (2ᵉ) | iso | triceps-overhead(2) · triceps-kickback(1) · triceps-rope(3,utilisé) | triceps-overhead | 3×10-15 |
| 8 | forearms | iso | reverse-wrist-curl(1,neuf) · wrist-curl(1,utilisé) | reverse-wrist-curl | 3×10-15 |
| c | core | — | pool[3] | seed-bicycle-crunch | 3×15 |

## Séance 5 — Upper — Haut du corps B (`upper`, 8 slots · warmup walking-lunges · core vertical-leg-crunch)

| # | Slot muscles | Cat | Top-3 candidats (neuf d'abord) | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[4] | seed-walking-lunges | 2×10 |
| 1 | chest/chest_upper | cmp | bench-dumbbell(3,neuf) · chest-press-machine(3,neuf) · pushup(2,neuf) | bench-dumbbell | 4×8-12 |
| 2 | back_width/thickness/back | cmp | pullup(3,neuf) · lat-pulldown(3,utilisé) · deadlift(3,neuf) | pullup | 4×8-12 |
| 3 | shoulders/shoulders_front | cmp | ohp-barbell(3,neuf) · shoulder-press-machine(3,neuf) · arnold-press(2,neuf) | ohp-barbell | 4×8-12 |
| 4 | shoulders_lateral/rear | iso | lateral-raise-cable(2,neuf) · lateral-raise(3,utilisé) · rear-delt-fly(2,utilisé) | lateral-raise-cable | 3×10-15 |
| 5 | back_thickness/back | iso | pullover-cable(2,neuf) · straight-arm-pulldown(2,neuf) · pullover-db(3,utilisé) | pullover-cable | 3×10-15 |
| 6 | chest/chest_lower | iso | fly-cable(2,neuf) · pec-deck(2,neuf) · fly-dumbbell(2,utilisé) | fly-cable | 3×10-15 |
| 7 | biceps | iso | curl-cable(2,neuf) · curl-preacher(2,neuf) · curl-concentration(1,neuf) | curl-cable | 3×10-15 |
| 8 | triceps | iso | triceps-kickback(1,neuf) · triceps-rope(3,utilisé) · triceps-pushdown(3,utilisé) | triceps-kickback | 3×10-15 |
| c | core | — | pool[4] | seed-vertical-leg-crunch | 3×15 |

**Assertions : [PASS/FAIL]**
- `incompatibleReason('brosplit')` = `null` (days 5, intermediate, hypertrophy) → bouton actif : **PASS** (`ProgramGeneratorScreen.tsx:628-633`)
- Split `['chest-tri','back-bi','legs','shoulders-arms','upper']` : **PASS** (`:474`)
- Slots 7 / 8 / 6 / 8 / 8 : **PASS** (`:640`)
- Noms sans suffixe : **❌ FAIL** — `shoulders-arms` et `upper` partagent le canon `'upper'` → suffixes **A** / **B** (`:1039-1041`)
- Top-3 chest compound (chest-tri) : bench-barbell(8) · bench-dumbbell(3) · chest-press-machine(3) : **PASS**
- Warning volume débutant (`:1074`) : non émis (level ≠ beginner) : **PASS**

**Coach :**
- **Équilibre musculaire** : ⚠️ Le split **n'est pas un vrai brosplit** : la 5ᵉ séance `upper` réintroduit pecs, dos et épaules. Fréquences réelles : pecs **2×** (S1, S5), dos **2×** (S2, S5), épaules **2×** (S4, S5), biceps 5 slots, triceps 5 slots, **jambes 1×**. Deltoïde postérieur 3× ✅.
- ❌ **Jambes 1×/semaine (6 slots) contre 31 slots haut du corps** — ratio 5:1, le plus gros déséquilibre haut/bas du groupe C.
- **Cohérence objectif** : ⚠️ La question de l'audit (« fréquence 1× suffisante en hypertrophie ? ») reçoit une réponse nuancée : **grâce à la séance `upper`, le haut du corps est en réalité à 2×** — conforme à la recommandation scientifique. **Seules les jambes restent à 1×.** Volume bras : 15 séries biceps + 15 triceps/semaine → **excessif** (12-16 recommandé, atteint sans même compter les composés).
- **Durée/contenu** : ❌ S2, S4, S5 (8 slots) ≈ 60-65 min de travail-repos + 7 min ≈ **67-72 min** pour 60 annoncés. S1 (7 slots) ≈ 62 min. Seule S3 (legs) tient. Dérive moyenne +15 %.
- **Équipement** : ✅ FULL exploité à fond. ⚠️ `seed-dips` (S1) et `seed-pullup` (S5) ont `progressStepKg: 0` → pas de progression automatique.
- **Variété inter-sessions** : ✅ **Variété structurelle** entre les 5 templates. ⚠️ Une seule répétition forcée : `face-pull` en S4 slot 3 (pool `shoulders_rear` = 2 en FULL, épuisé dès S2). Les pools biceps (7) et triceps (5) tiennent les 5 slots demandés ; `forearms` (2) est juste suffisant.
- **Couverture isolation** : ✅ **Complète** haut du corps. ⚠️ **Lacune bas du corps** : 1 slot par groupe (quads, glutes, ischios, mollets), 1 fois par semaine.
- **Verdict global : ⚠️ Problème mineur** — programme d'hypertrophie riche et varié, mais (a) jambes 1×/sem contre haut du corps 2×, (b) séances de 8 slots débordent de ~10 min, (c) bug de suffixe A/B sur deux noms différents.

---

# P47 — Brosplit explicit, advanced, 5j, fat_loss, BB+DB, 60 min

```
{ goal:'fat_loss', daysPerWeek:5, sessionDuration:60, equipment:BB+DB, level:'advanced', splitPreference:'brosplit' }
```

**Simulation :**
- **Filtre wizard** — `incompatibleReason('brosplit')` : days=5 ✓ · advanced ≠ beginner ✓ · `goal='fat_loss'` non testé (`:631` strength, `:632` endurance uniquement) → **`null`** → bouton **actif**
- Étape 2 — `['chest-tri','back-bi','legs','shoulders-arms','upper']` (`:474`)
- Noms : idem P46 → séances 4 et 5 suffixées **A** et **B** (`:1039-1041`)
- Étape 3 — 7 / 8 / 6 / 8 / 8 slots (`:640`, fat_loss 60 min = base)
- Étape 5 — compound **et** isolation fat_loss `3×12-15` r60 (`:77`/`:84`) · `adjustedSpec` inchangé à 60 min
- `advanced` → top-3 random · Core pool BB+DB (11) : scissors · crunch · bicycle-crunch · vertical-leg-crunch · side-plank

## Séance 1 — Chest & Triceps (`chest-tri`, 7 slots · warmup bird-dog · core scissors)

| # | Slot muscles | Cat | Top-3 candidats BB+DB | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[0] | seed-bird-dog | 2×10 |
| 1 | chest/chest_upper | cmp | bench-barbell(8) · bench-dumbbell(3) · incline-bench-barbell(4) | bench-barbell | 3×12-15 (r60) |
| 2 | **chest_upper**/chest | cmp | incline-bench-barbell(4) · incline-bench-dumbbell(2) · bench-dumbbell(3, groupe chest) | incline-bench-barbell | 3×12-15 |
| 3 | triceps | iso | skullcrusher(2) · triceps-overhead(2) · triceps-kickback(1) | skullcrusher | 3×12-15 |
| 4 | chest/chest_lower/chest_upper | iso | **fly-dumbbell(2)** — *candidat isolation unique* | seed-fly-dumbbell | 3×12-15 |
| 5 | chest_lower | iso | *isolation : ∅* → **decline-bench-barbell(1)** — *unique* (dips = pullup_bar) | seed-decline-bench-barbell ⚠️ | 3×12-15 |
| 6 | triceps (2ᵉ) | iso | triceps-overhead(2,neuf) · triceps-kickback(1,neuf) · skullcrusher(utilisé) | triceps-overhead | 3×12-15 |
| 7 | shoulders_rear | iso | **rear-delt-fly(2)** — *candidat unique* | seed-rear-delt-fly | 3×12-15 |
| c | core | — | pool[0] | seed-scissors | 3×15 |

## Séance 2 — Back & Biceps (`back-bi`, 8 slots · warmup cat-cow · core crunch)

| # | Slot muscles | Cat | Top-3 candidats BB+DB | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[1] | seed-cat-cow | 2×10 |
| 1 | back_width/back | cmp | **seed-deadlift** — *candidat unique* (`back_width` : ∅) | seed-deadlift ❌ | 3×12-15 |
| 2 | back_thickness/back | cmp | row-barbell(7) · row-dumbbell(3) · row-tbar(2) | row-barbell | 3×12-15 |
| 3 | biceps | iso | curl-barbell(3) · curl-dumbbell(3) · curl-hammer(3) | curl-barbell | 3×12-15 |
| 4 | back_thickness/back_width/back | iso | pullover-dumbbell(3) · shrug(2) · seed-pullover(1) | pullover-dumbbell | 3×12-15 |
| 5 | biceps (2ᵉ) | iso | curl-dumbbell(3) · curl-hammer(3) · curl-incline(2) | curl-dumbbell | 3×12-15 |
| 6 | back_width | iso | **seed-pullover(1)** — *unique* | seed-pullover | 3×12-15 |
| 7 | shoulders_rear | iso | **rear-delt-fly(2,utilisé)** — *unique* | rear-delt-fly ⚠️ *(répétition)* | 3×12-15 |
| 8 | forearms | iso | wrist-curl(1) · reverse-wrist-curl(1) | seed-wrist-curl | 3×12-15 |
| c | core | — | pool[1] | seed-crunch | 3×15 |

❌ Slot 1 : `back_width` sans compound en BB+DB → **soulevé de terre à 3×12-15** en ouverture de séance dos. **Aucun tirage vertical dans tout le programme** (S5 a le même trou).

## Séance 3 — Legs — Jambes (`legs`, 6 slots · warmup shoulder-circles · core bicycle-crunch)

| # | Slot muscles | Cat | Top-3 candidats BB+DB | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[2] | seed-shoulder-circles | 2×10 |
| 1 | quads | cmp | squat-barbell(8) · lunges(2) · front-squat(2) | squat-barbell | 3×12-15 |
| 2 | hamstrings/glutes | cmp | romanian-deadlift(3) · dumbbell-rdl(2) · good-morning(1) | romanian-deadlift | 3×12-15 |
| 3 | quads | iso | *isolation : ∅* → fallback cmp : lunges(2) · front-squat(2) · bulgarian(2) | seed-lunges ⚠️ | 3×12-15 |
| 4 | glutes | iso | *isolation : ∅* → **seed-hip-thrust(4)** — *unique* | seed-hip-thrust ⚠️ | 3×12-15 |
| 5 | hamstrings | iso | *isolation : ∅* → fallback cmp : dumbbell-rdl(2,neuf) · good-morning(1,neuf) | dumbbell-rdl ⚠️ | 3×12-15 |
| 6 | calves | iso | calf-raise-db(2) · calf-raise-bb(2) *(pool = 2)* | seed-calf-raise-db | 3×12-15 |
| c | core | — | pool[2] | seed-bicycle-crunch | 3×15 |

⚠️ 3 slots isolation sur 4 sont remplis par des composés (fallback `:749-750`). La séance = squat + RDL + fente + hip thrust + RDL haltères + mollets — **5 mouvements de hanche/genou lourds à 12-15 reps**.

## Séance 4 — Shoulders & Arms A (`shoulders-arms`, 8 slots · warmup dead-bug · core vertical-leg-crunch)

| # | Slot muscles | Cat | Top-3 candidats BB+DB | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[3] | seed-dead-bug | 2×10 |
| 1 | shoulders/shoulders_front | cmp | shoulder-press-db(3) · ohp-barbell(3) · arnold-press(2) | shoulder-press-db | 3×12-15 |
| 2 | shoulders_lateral | iso | **lateral-raise(3)** — *unique* (upright row = compound, écarté) | seed-lateral-raise | 3×12-15 |
| 3 | shoulders_rear | iso | **rear-delt-fly(2,utilisé)** — *unique* | rear-delt-fly ⚠️ *(3ᵉ fois)* | 3×12-15 |
| 4 | biceps | iso | curl-hammer(3,neuf) · curl-incline(2,neuf) · curl-preacher(2,neuf) | curl-hammer | 3×12-15 |
| 5 | triceps | iso | triceps-kickback(1,neuf) · skullcrusher(utilisé) · triceps-overhead(utilisé) | triceps-kickback | 3×12-15 |
| 6 | biceps (2ᵉ) | iso | curl-incline(2) · curl-preacher(2) · curl-concentration(1) | curl-incline | 3×12-15 |
| 7 | triceps (2ᵉ) | iso | skullcrusher(2,utilisé) · triceps-overhead(2,utilisé) *(pool épuisé)* | skullcrusher ⚠️ *(répétition)* | 3×12-15 |
| 8 | forearms | iso | reverse-wrist-curl(1,neuf) · wrist-curl(1,utilisé) | reverse-wrist-curl | 3×12-15 |
| c | core | — | pool[3] | seed-vertical-leg-crunch | 3×15 |

⚠️ Pool `triceps` BB+DB = 3 exercices pour **5 slots triceps** dans la semaine → répétitions inévitables dès S4.

## Séance 5 — Upper — Haut du corps B (`upper`, 8 slots · warmup walking-lunges · core side-plank)

| # | Slot muscles | Cat | Top-3 candidats BB+DB | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[4] | seed-walking-lunges | 2×10 |
| 1 | chest/chest_upper | cmp | bench-dumbbell(3,neuf) · incline-bench-dumbbell(2,neuf) · bench-barbell(utilisé) | bench-dumbbell | 3×12-15 |
| 2 | back_width/thickness/back | cmp | *back_width : ∅* → row-dumbbell(3,neuf) · row-tbar(2,neuf) · row-barbell(utilisé) | row-dumbbell | 3×12-15 |
| 3 | shoulders/shoulders_front | cmp | ohp-barbell(3,neuf) · arnold-press(2,neuf) · shoulder-press-db(utilisé) | ohp-barbell | 3×12-15 |
| 4 | shoulders_lateral/rear | iso | lateral-raise(3,utilisé) · rear-delt-fly(2,utilisé) *(pool = 2, épuisé)* | lateral-raise ⚠️ | 3×12-15 |
| 5 | back_thickness/back | iso | pullover-dumbbell(3,utilisé) · shrug(2,neuf) — *`slot.muscles[0]` prime* | pullover-dumbbell ⚠️ | 3×12-15 |
| 6 | chest/chest_lower | iso | **fly-dumbbell(2,utilisé)** — *unique* | fly-dumbbell ⚠️ *(répétition)* | 3×12-15 |
| 7 | biceps | iso | curl-preacher(2,neuf) · curl-concentration(1,neuf) · curl-barbell(utilisé) | curl-preacher | 3×12-15 |
| 8 | triceps | iso | triceps-overhead(2,utilisé) · kickback(1,utilisé) · skullcrusher(utilisé) *(pool épuisé)* | triceps-overhead ⚠️ | 3×12-15 |
| c | core | — | pool[4] | seed-side-plank | 3×15 |

**Assertions : [PASS/FAIL]**
- `incompatibleReason('brosplit')` = `null` pour fat_loss : **PASS** (`ProgramGeneratorScreen.tsx:628-633`)
- Split `['chest-tri','back-bi','legs','shoulders-arms','upper']` : **PASS** (`:474`)
- Specs fat_loss `3×12-15` r60 : **PASS** (`:77`, `:84`)
- `advanced` → top-3 random, top-3 chest compound cité : **PASS**
- Noms sans suffixe : **❌ FAIL** — suffixes A/B (`:1039-1041`)
- 37 slots, aucun slot vide → **aucun `generatorWarnings`** : **PASS technique**, mais 4 slots isolation détournés en compound sans avertissement

**Coach :**
- **Équilibre musculaire** : ⚠️ Pecs 2×, dos 2× (dont un deadlift au lieu d'un tirage vertical), épaules 2×, biceps 5 slots, triceps 5 slots, jambes 1× (6 slots dont 3 détournés). **Aucun tirage vertical de la semaine.** Deltoïde postérieur 3× mais **toujours le même exercice** (pool = 1 en BB+DB).
- **Cohérence objectif** : ❌ Question de l'audit — « fréquence 1× acceptable pour la rétention de masse maigre ? » : **non pour les jambes** (1×, dont 3 slots en fallback), **oui pour le haut du corps** (2× grâce à `upper`). Mais le vrai problème est ailleurs : `3×12-15` r60 sur un **squat barre** et un **soulevé de terre** chez un confirmé → charge nécessairement sous-maximale, forme dégradée en fin de série, risque lombaire élevé. Et toujours **zéro cardio**.
- **Durée/contenu** : ⚠️ S2/S4/S5 (8 slots × 3 séries × ~1,6 min ≈ 39 min) + 7 min ≈ **46 min** pour 60 annoncés → **sous-rempli de ~14 min** (le repos 60 s en fat_loss compense la densité de slots). S3 legs ≈ 36 min.
- **Équipement** : ❌ BB+DB est **mal adapté au brosplit**. Pools d'isolation trop courts : `shoulders_rear` = 1, `shoulders_lateral` = 1, `chest` iso = 1, `chest_lower` = 1 compound, `triceps` = 3 pour 5 slots, `quads`/`glutes`/`hamstrings` iso = 0. Le brosplit exige un large catalogue ; BB+DB ne le fournit pas.
- **Variété inter-sessions** : ❌ **Répétition partielle** — 6 répétitions forcées (rear-delt-fly ×3, lateral-raise ×2, fly-dumbbell ×2, skullcrusher ×2, triceps-overhead ×2, pullover-dumbbell ×2). Pool structurellement insuffisant pour 37 slots.
- **Couverture isolation** : ❌ **Lacunes problématiques** — jambes : 0 isolation réelle sur 4 slots isolation demandés. Haut du corps : couverture nominale mais avec exercices dupliqués.
- **Verdict global : ❌ Problème sérieux** — 6 slots dupliqués et 4 détournés en composés, sans aucun avertissement à l'utilisateur.

---

# P48 — Glutes-focus explicit, beginner, 3j, hypertrophy, FULL, 60 min

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner', splitPreference:'glutes-focus' }
```

**Simulation :**
- **Filtre wizard** — `glutes-focus` est rendu **hors de la liste `OPTIONS`**, dans le bloc « Programmes spécialisés », avec `disabled: false, reason: null` **codés en dur** (`ProgramGeneratorScreen.tsx:673-681`). Il ne passe **jamais** par `incompatibleReason` → **aucun garde-fou possible**, quel que soit le niveau, l'objectif ou la fréquence.
- Étape 2 — `selectSplit` pref `glutes-focus`, case 3 → `['glutes-hip','quad-glutes','glutes-hip']` (`:492`)
- Noms : `toPublicType` → les deux templates donnent `'lower'` (`:125`) → canon `'lower'` **3×** → suffixes A/B/C
  → **"Glutes & Hip — Fessiers & Ischio A"** · **"Quad & Glutes — Jambes & Fessiers B"** · **"Glutes & Hip — Fessiers & Ischio C"** ✅ (conforme à l'assertion)
- Étape 3 — glutes-hip base 8 → **8** · quad-glutes base 8 → **8** (`:640`)
- Étape 5 — cmp `4×8-12` r90 (`:75`) · iso `3×10-15` r75 (`:82`) · `beginner` → `candidates[0]` déterministe (`:781`)
- Total : 8 + warmup + core = **10 exercices** par séance
- **Warning émis** : `publicTypes` = `{'lower'}`, taille 1, `t === 'lower'` → UX-D « Programme de spécialisation… » (`:1082-1091`) ✅

## Séance A — Glutes & Hip A (`glutes-hip`, 8 slots · warmup bird-dog · core scissors)

| # | Slot muscles | Cat | Top-3 candidats (pop desc) | Exercice retenu (beginner) | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[0] | seed-bird-dog | 2×10 |
| 1 | **glutes**/hamstrings | cmp | hip-thrust(4,bb) · hip-thrust-bw(3) · hip-thrust-machine(3) | **seed-hip-thrust** | 4×8-12 |
| 2 | **hamstrings**/glutes | cmp | romanian-deadlift(3,bb) · bw-nordic-curl(2) · dumbbell-rdl(2) | **seed-romanian-deadlift** | 4×8-12 |
| 3 | **quads**/glutes | cmp | squat-barbell(8) · leg-press(3) · bw-squat(3) | **seed-squat-barbell** ⚠️ | 4×8-12 |
| 4 | **back_width**/back | cmp | lat-pulldown(3, idx 103) · pullup(3, idx 105) · deadlift(3) | **seed-lat-pulldown** ⚠️ | 4×8-12 |
| 5 | glutes | iso | glute-bridge(3) · donkey-kick(2) · fire-hydrant(2) | **seed-glute-bridge** ⚠️ | 3×10-15 |
| 6 | hamstrings | iso | leg-curl-lying(3) · leg-curl-seated(2) · leg-curl-standing(2) | **seed-leg-curl-lying** | 3×10-15 |
| 7 | glutes (2ᵉ) | iso | donkey-kick(2) · fire-hydrant(2) · hip-abduction(2) *(glute-bridge hors usedInWorkout)* | **seed-donkey-kick** ⚠️ | 3×10-15 |
| 8 | back_thickness/back | iso | pullover-dumbbell(3) · pullover-cable(2) · straight-arm-pulldown(2) | **seed-pullover-dumbbell** | 3×10-15 |
| c | core | — | pool[0] | seed-scissors | 3×15 |

⚠️ Slot 3 : le commentaire annonce « Fente bulgare / split squat » (`:335`) ; `slot.muscles[0]='quads'` + popularité 8 imposent le **squat barre**. Aucun unilatéral.
⚠️ Slot 4 : l'assertion attendait `seed-pullup` ; c'est `seed-lat-pulldown` qui gagne (popularité 3 identique, **index seed 103 < 105**). Sans conséquence sportive, mais **l'assertion est FAIL**.
⚠️ Slots 5 et 7 : les deux isolations fessiers sont **du poids du corps non chargeable** (glute bridge, donkey kick — `progressStepKg: 0`, `autoProgress: false`) alors que `seed-hip-abduction` et `seed-hip-adduction-machine` (machine, chargeables) sont disponibles à popularité 2. Pour un objectif **hypertrophie**, c'est un choix faible : après un hip thrust barre lourd, un glute bridge au poids du corps n'apporte aucun stimulus.

## Séance B — Quad & Glutes B (`quad-glutes`, 8 slots · warmup cat-cow · core crunch)

| # | Slot muscles | Cat | Top-3 candidats (neuf d'abord) | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[1] | seed-cat-cow | 2×10 |
| 1 | **quads**/glutes | cmp | leg-press(3,neuf) · bw-squat(3,neuf) · lunges(2,neuf) *(squat-bb utilisé)* | **seed-leg-press** | 4×8-12 |
| 2 | **glutes**/hamstrings | cmp | hip-thrust-bw(3,neuf,idx 61) · hip-thrust-machine(3,neuf,idx 150) · curtsy-lunge(1) | **seed-hip-thrust-bw** ⚠️ | 4×8-12 |
| 3 | **back_thickness**/back | cmp | row-barbell(7) · row-dumbbell(3) · row-tbar(2) | **seed-row-barbell** | 4×8-12 |
| 4 | quads | iso | leg-extension(3) · bw-wall-sit(2) *(pool = 2)* | **seed-leg-extension** | 3×10-15 |
| 5 | glutes | iso | fire-hydrant(2,neuf) · hip-abduction(2,neuf) · hip-adduction(2,neuf) | **seed-fire-hydrant** ⚠️ | 3×10-15 |
| 6 | hamstrings | iso | leg-curl-seated(2,neuf) · leg-curl-standing(2,neuf) · leg-curl-lying(utilisé) | **seed-leg-curl-seated** | 3×10-15 |
| 7 | calves | iso | calf-seated(2) · calf-standing(2) · bw-calf-raise(2) | **seed-calf-raise-seated** | 3×10-15 |
| 8 | **back_width**/back | iso | seed-pullover(1, back_width) · shrug(2, back) *(pool = 2)* | **seed-pullover** | 3×10-15 |
| c | core | — | pool[1] | seed-crunch | 3×15 |

⚠️ Slot 2 : `seed-hip-thrust-bw` (poids du corps, `progressStepKg: 0`) est retenu alors que `seed-hip-thrust-machine` a la **même popularité 3** — départage par l'index seed (61 < 150). En salle complète, prescrire un hip thrust au poids du corps en 4×8-12 à un débutant est un **gaspillage de slot composé**.

## Séance C — Glutes & Hip C (`glutes-hip`, 8 slots · warmup shoulder-circles · core cable-crunch)

| # | Slot muscles | Cat | Top-3 candidats (neuf d'abord) | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[2] | seed-shoulder-circles | 2×10 |
| 1 | **glutes**/hamstrings | cmp | hip-thrust-machine(3,neuf) · curtsy-lunge(1,neuf) · hip-thrust(4,utilisé) | **seed-hip-thrust-machine** | 4×8-12 |
| 2 | **hamstrings**/glutes | cmp | bw-nordic-curl(2,neuf,idx 132) · dumbbell-rdl(2,neuf,idx 136) · good-morning(1,neuf) | **bw-nordic-curl** ❌ | 4×8-12 |
| 3 | **quads**/glutes | cmp | bw-squat(3,neuf) · lunges(2,neuf) · hack-squat(2,neuf) *(squat-bb, leg-press utilisés)* | **bw-squat** ⚠️ | 4×8-12 |
| 4 | **back_width**/back | cmp | pullup(3,neuf) · lat-pulldown(3,utilisé) · deadlift(3,neuf) | **seed-pullup** | 4×8-12 |
| 5 | glutes | iso | hip-abduction(2,neuf) · hip-adduction(2,neuf) · glute-kickback(1,neuf) | **seed-hip-abduction** | 3×10-15 |
| 6 | hamstrings | iso | leg-curl-standing(2,neuf) · leg-curl-lying(utilisé) · leg-curl-seated(utilisé) | **seed-leg-curl-standing** | 3×10-15 |
| 7 | glutes (2ᵉ) | iso | hip-adduction-machine(2,neuf) · glute-kickback(1,neuf) | **seed-hip-adduction-machine** ❌ | 3×10-15 |
| 8 | back_thickness/back | iso | pullover-cable(2,neuf) · straight-arm-pulldown(2,neuf) · pullover-db(utilisé) | **seed-pullover-cable** | 3×10-15 |
| c | core | — | pool[2] | seed-cable-crunch | 3×15 |

❌ Slot 2 : **`bw-nordic-curl` prescrit à un débutant en 4×8-12.** Le nordic curl est l'un des exercices excentriques les plus exigeants qui soient (la plupart des débutants ne réalisent pas une seule répétition contrôlée). En plus, il est classé `pullup_bar` → `progressStepKg: 0`. Le `dumbbell-rdl` (même popularité 2, index 136) aurait été le bon choix ; seul l'index seed (132 < 136) décide.
❌ Slot 7 : `seed-hip-adduction-machine` (« Machine adducteurs ») a `primaryMuscle: 'glutes'` **dans le seed** — c'est une erreur de données : les adducteurs ne sont pas les fessiers. Elle contamine le slot « Cable kickback / donkey kick » (`:340`) d'un programme spécialisé fessiers.
⚠️ Slot 3 : `bw-squat` (squat au poids du corps, non chargeable) en 4×8-12 dans une salle complète, alors que `seed-front-squat`, `seed-hack-squat` et `seed-bulgarian-split-squat` sont disponibles.

**Assertions : [PASS/FAIL]**
- Split `['glutes-hip','quad-glutes','glutes-hip']` : **PASS** (`:492`) — assertion **GLUTES**
- Noms A / B / C : **PASS** (`:1039-1041`, canon `'lower'` ×3)
- 8 slots par séance : **PASS** (`:640`)
- 10 exercices par séance : **PASS**
- **Aucun slot pectoraux / épaules (front, lat) / triceps** : **PASS** — assertion **GLUTES-SLOTS** vérifiée sur `SLOTS['glutes-hip']` (`:331-342`) et `SLOTS['quad-glutes']` (`:344-355`) : les seuls muscles présents sont glutes, hamstrings, quads, back_width, back_thickness, back, calves
- Slot back_width (glutes-hip pos 4) rempli avec FULL : **PASS** — mais avec `seed-lat-pulldown` en A, `seed-pullup` en C
- Assertion « slot 4 = seed-pullup » : **❌ FAIL** en séance A — `seed-lat-pulldown` gagne le départage d'index seed (103 < 105)
- Exercice retenu glutes/ham compound pos 0 (beginner FULL) = `seed-hip-thrust` : **PASS**
- Warning UX-D spécialisation émis : **PASS** (`:1082-1091`)
- Warning UX-5 push/pull : **non émis** — `hasPullSession` est vrai car `glutes-hip`/`quad-glutes` sont listés (`:1107`) et `hasPushSession` est faux : **PASS** (comportement voulu)

**Coach :**
- **Équilibre musculaire** : ⚠️ Par construction, programme **sans push** — pecs, deltoïdes antérieur/latéral et triceps totalement absents (0 slot sur 24). C'est le cahier des charges du template, donc **acceptable pour un bloc de spécialisation de 6-8 semaines**, pas comme programme unique sur 8 semaines (`DURATION_WEEKS.beginner = 8`, `:680`). Le warning UX-D le dit correctement.
- Fessiers : **8 slots primaires sur la semaine** (hip thrust ×3 variantes, glute bridge, donkey kick, hip abduction, hip adduction, fire hydrant) + fessiers en secondaire sur squat/leg press/RDL/nordic. Ischios : 5 slots. Quads : 4 slots. Dos : 6 slots (2 verticaux + 1 rowing + 3 isolations). Mollets : 1 slot.
- → **Question de l'audit : « 6-8 sollicitations fessiers, excessif ou optimal ? »** Réponse : le **nombre** de slots est bon pour un programme spécialisé, mais la **qualité de charge** ne suit pas — 4 des 8 slots fessiers sont au poids du corps non chargeable (glute bridge, donkey kick, fire hydrant, hip thrust BW). Le volume utile réel est donc d'environ **4 slots chargés**, ce qui est correct mais loin des 8 affichés.
- → **Question de l'audit : « le dos est-il suffisamment couvert ? »** ✅ Oui : lat pulldown (A), traction (C), rowing barre (B) + 3 isolations (pull-over ×2, pull-over poulie). Verticaux **2×**, horizontal **1×** — bon pour un rôle postural.
- **Cohérence objectif** : ⚠️ specs hypertrophie correctes (4×8-12 / 3×10-15), mais **le nordic curl en 4×8-12 chez un débutant est inapplicable** et 4 exercices non chargeables plafonnent immédiatement la progression (`autoProgress: false`).
- **Durée/contenu** : ❌ 8 slots = 4 composés × 4 séries × 2,2 min + 4 isolations × 3 séries × 1,9 min ≈ 35 + 23 = **58 min** + 7 min warmup/core ≈ **65 min minimum**, réellement **75-85 min**. Annoncé 60 min → dérive de +25 à +40 %.
- **Équipement** : ⚠️ FULL disponible mais **mal exploité** : 4 sélections en poids du corps (hip-thrust-bw, bw-squat, bw-nordic-curl, glute-bridge, donkey-kick, fire-hydrant → 6 en réalité) alors que barre, machines et poulies sont accessibles. La cause est systémique : `popularity` + index seed priment, sans critère de « chargeabilité » pour l'hypertrophie (contrairement à `strengthEquipmentPrio` qui n'existe que pour `goal === 'strength'`, `:769`).
- **Variété inter-sessions** : ⚠️ **Variété d'exercices seulement** entre A et C (slots strictement identiques). La rotation via `usedGlobally` fonctionne bien (8/8 exercices différents entre A et C) mais l'**ordre musculaire est identique** — l'utilisateur enchaîne deux fois la même structure. A→B : ✅ variété structurelle (hip-first vs squat-first, back_width vs back_thickness, calves ajoutés en B).
- **Couverture isolation** : ✅ **Complète pour le périmètre du template** — fessiers ×4, ischios ×3, quads ×1, dos ×3, mollets ×1. Sans slot isolation dédié : quads (1 seul, en B), mollets (1 seul, en B) — acceptable dans un programme fessiers.
- **Verdict global : ⚠️ Problème mineur à modéré** — structure de programme excellente et fidèle à sa promesse (zéro push, dos couvert), mais **6 sélections au poids du corps en salle complète**, un **nordic curl chez un débutant**, la **machine adducteurs étiquetée `glutes`**, et une durée réelle de ~80 min pour 60 annoncés.

---

# P49 — Glutes-focus explicit, intermediate, 4j, fat_loss, HOME, 60 min

```
{ goal:'fat_loss', daysPerWeek:4, sessionDuration:60, equipment:HOME, level:'intermediate', splitPreference:'glutes-focus' }
```
HOME = `['dumbbell','kettlebell','band','bodyweight']` — **pas de pullup_bar, pas de machine, pas de cable, pas de barbell.**

**Simulation :**
- **Filtre wizard** — aucun (`glutes-focus` rendu avec `disabled: false` en dur, `ProgramGeneratorScreen.tsx:673-681`)
- Étape 2 — `selectSplit` pref `glutes-focus`, case 4 → `['glutes-hip','quad-glutes','glutes-hip','quad-glutes']` (`:493`)
- Noms : canon `'lower'` × 4 → suffixes → **"Glutes & Hip … A" / "Quad & Glutes … B" / "Glutes & Hip … C" / "Quad & Glutes … D"**
- Étape 3 — 8 slots × 4 séances (`:640`)
- Étape 5 — compound **et** isolation fat_loss `3×12-15` r60 (`:77`/`:84`) · `intermediate` → top-3 random
- Warmup pool HOME (18, `band` admis) : band-pull-apart · bird-dog · cat-cow · shoulder-circles
- Core pool HOME (12) : scissors · crunch · bicycle-crunch · vertical-leg-crunch
- **Warning émis** : UX-D spécialisation (`publicTypes = {'lower'}`, `:1082-1091`) ✅

**Pools HOME utiles :** glutes cmp = hip-thrust-bw(3) · kb-swing(3) · kb-clean(3) · band-hip-thrust(2) · curtsy-lunge(1) — glutes iso = glute-bridge(3) · donkey-kick(2) · fire-hydrant(2) — hamstrings cmp = kb-rdl(2) · dumbbell-rdl(2) · band-good-morning(1), **iso = ∅** — quads cmp = goblet-squat(3) · bw-squat(3) · lunges(2) · bulgarian(2) · kb-lunge(2) · band-squat(2) · bw-lunge(2) · bw-jump-squat(1), **iso = bw-wall-sit(2) seul** — **back_width cmp = ∅**, back cmp = kb-deadlift(2) — back_thickness cmp = row-dumbbell(3) · kb-row(2) · band-row(2) — back iso = pullover-dumbbell(3, back_thickness) · shrug(2, back) · seed-pullover(1, back_width) · kb-pullover(1, back_width) — calves = bw-calf-raise(2) · calf-raise-db(2) · kb-calf-raise(1)

## Séance A — Glutes & Hip A (`glutes-hip`, 8 slots · warmup band-pull-apart · core scissors)

| # | Slot muscles | Cat | Top-3 candidats HOME | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[0] | seed-band-pull-apart | 2×10 |
| 1 | **glutes**/hamstrings | cmp | hip-thrust-bw(3,idx61) · kb-swing(3,idx109) · kb-clean(3,idx119) | hip-thrust-bw | 3×12-15 (r60) |
| 2 | **hamstrings**/glutes | cmp | kb-rdl(2,idx112) · dumbbell-rdl(2,idx136) · band-good-morning(1) | kb-rdl | 3×12-15 |
| 3 | **quads**/glutes | cmp | goblet-squat(3) · bw-squat(3) · lunges(2) | goblet-squat | 3×12-15 |
| 4 | **back_width**/back | cmp | **kb-deadlift(2)** — *candidat unique* (`back_width` cmp : ∅) | kb-deadlift ❌ | 3×12-15 |
| 5 | glutes | iso | glute-bridge(3) · donkey-kick(2) · fire-hydrant(2) | glute-bridge | 3×12-15 |
| 6 | hamstrings | iso | *isolation : ∅* → fallback cmp : dumbbell-rdl(2) · band-good-morning(1) *(kb-rdl utilisé en séance)* | dumbbell-rdl ⚠️ | 3×12-15 |
| 7 | glutes (2ᵉ) | iso | donkey-kick(2) · fire-hydrant(2) *(glute-bridge utilisé en séance)* | donkey-kick | 3×12-15 |
| 8 | back_thickness/back | iso | pullover-dumbbell(3) · shrug(2) *(pool = 2)* | pullover-dumbbell | 3×12-15 |
| c | core | — | pool[0] | seed-scissors | 3×15 |

❌ **Slot 4 — réponse directe à la question de l'audit.** Le seed **ne contient aucun exercice DB/KB avec `primaryMuscle: 'back_width'` de catégorie compound** : `seed-pullover` (db) et `kb-pullover` (kb) sont **isolation**, donc écartés par le filtre compound (`:740-746`). Le seul candidat restant vient de `back` : **`kb-deadlift`**. Le slot « Lat pulldown (posture) » (`:336`) devient un **soulevé de terre kettlebell**, c'est-à-dire un **quatrième hip-hinge** dans une séance qui en comptait déjà trois (hip thrust, kb-rdl, plus le RDL du slot 6). Et comme `pickExercise` retourne un exercice, **aucun warning n'est émis** (`:994-1007`).
→ **Un rowing KB/DB peut-il remplacer le lat pulldown ?** Oui sportivement — mais le code ne le permet pas : le slot ne liste que `['back_width','back']` (`:336`), or les rowings ont `primaryMuscle: 'back_thickness'`. Correction recommandée : ajouter `'back_thickness'` à ce slot.
⚠️ Slot 6 : aucune isolation ischios en HOME → fallback compound → **2ᵉ RDL de la séance**.

## Séance B — Quad & Glutes B (`quad-glutes`, 8 slots · warmup bird-dog · core crunch)

| # | Slot muscles | Cat | Top-3 candidats HOME (neuf d'abord) | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[1] | seed-bird-dog | 2×10 |
| 1 | **quads**/glutes | cmp | bw-squat(3,neuf) · lunges(2,neuf) · bulgarian(2,neuf) *(goblet utilisé)* | bw-squat | 3×12-15 |
| 2 | **glutes**/hamstrings | cmp | kb-swing(3,neuf) · kb-clean(3,neuf) · band-hip-thrust(2,neuf) | kb-swing | 3×12-15 |
| 3 | **back_thickness**/back | cmp | row-dumbbell(3) · kb-row(2) · band-row(2) | row-dumbbell ✅ | 3×12-15 |
| 4 | quads | iso | **bw-wall-sit(2)** — *candidat unique* | bw-wall-sit ⚠️ | 3×12-15 |
| 5 | glutes | iso | fire-hydrant(2,neuf) · glute-bridge(3,utilisé) · donkey-kick(2,utilisé) | fire-hydrant | 3×12-15 |
| 6 | hamstrings | iso | *isolation : ∅* → band-good-morning(1,neuf) · kb-rdl(utilisé) · dumbbell-rdl(utilisé) | band-good-morning ⚠️ | 3×12-15 |
| 7 | calves | iso | bw-calf-raise(2,idx133) · calf-raise-db(2,idx146) · kb-calf-raise(1) | bw-calf-raise | 3×12-15 |
| 8 | **back_width**/back | iso | seed-pullover(1,idx82) · kb-pullover(1,idx117) · shrug(2, groupe back) | seed-pullover | 3×12-15 |
| c | core | — | pool[1] | seed-crunch | 3×15 |

✅ Slot 3 : c'est **le seul vrai tirage horizontal du programme** (row-dumbbell / kb-row / band-row), présent uniquement dans les séances `quad-glutes`.

## Séance C — Glutes & Hip C (`glutes-hip`, 8 slots · warmup cat-cow · core bicycle-crunch)

| # | Slot muscles | Cat | Top-3 candidats (neuf d'abord — pools déjà largement consommés) | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[2] | seed-cat-cow | 2×10 |
| 1 | **glutes**/hamstrings | cmp | kb-clean(3,neuf) · band-hip-thrust(2,neuf) · curtsy-lunge(1,neuf) | kb-clean | 3×12-15 |
| 2 | **hamstrings**/glutes | cmp | *tous utilisés* → kb-rdl(2) · dumbbell-rdl(2) · band-good-morning(1) | kb-rdl ⚠️ *(répétition)* | 3×12-15 |
| 3 | **quads**/glutes | cmp | lunges(2,neuf) · bulgarian(2,neuf) · kb-lunge(2,neuf) | seed-lunges | 3×12-15 |
| 4 | **back_width**/back | cmp | **kb-deadlift(2, utilisé)** — *candidat unique* | kb-deadlift ❌ *(répétition)* | 3×12-15 |
| 5 | glutes | iso | *pool de 3 épuisé* → glute-bridge(3) · donkey-kick(2) · fire-hydrant(2) | glute-bridge ⚠️ | 3×12-15 |
| 6 | hamstrings | iso | fallback cmp, tous utilisés → dumbbell-rdl(2) · band-good-morning(1) | dumbbell-rdl ⚠️ | 3×12-15 |
| 7 | glutes (2ᵉ) | iso | donkey-kick(2) · fire-hydrant(2) *(hors usedInWorkout)* | donkey-kick ⚠️ | 3×12-15 |
| 8 | back_thickness/back | iso | shrug(2,neuf) · pullover-dumbbell(3,utilisé) — *`slot.muscles[0]` prime* | pullover-dumbbell ⚠️ | 3×12-15 |
| c | core | — | pool[2] | seed-bicycle-crunch | 3×15 |

## Séance D — Quad & Glutes D (`quad-glutes`, 8 slots · warmup shoulder-circles · core vertical-leg-crunch)

| # | Slot muscles | Cat | Top-3 candidats (neuf d'abord) | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[3] | seed-shoulder-circles | 2×10 |
| 1 | **quads**/glutes | cmp | bulgarian(2,neuf) · kb-lunge(2,neuf) · band-squat(2,neuf) | seed-bulgarian-split-squat | 3×12-15 |
| 2 | **glutes**/hamstrings | cmp | band-hip-thrust(2,neuf) · curtsy-lunge(1,neuf) · hip-thrust-bw(utilisé) | band-hip-thrust | 3×12-15 |
| 3 | **back_thickness**/back | cmp | kb-row(2,neuf) · band-row(2,neuf) · row-dumbbell(utilisé) | kb-row | 3×12-15 |
| 4 | quads | iso | **bw-wall-sit(2, utilisé)** — *unique* | bw-wall-sit ⚠️ *(répétition)* | 3×12-15 |
| 5 | glutes | iso | fire-hydrant(2) · glute-bridge(3) · donkey-kick(2) *(tous utilisés)* | fire-hydrant ⚠️ | 3×12-15 |
| 6 | hamstrings | iso | fallback cmp : band-good-morning(1) · kb-rdl · dumbbell-rdl *(tous utilisés)* | band-good-morning ⚠️ | 3×12-15 |
| 7 | calves | iso | calf-raise-db(2,neuf) · kb-calf-raise(1,neuf) · bw-calf-raise(utilisé) | seed-calf-raise-db | 3×12-15 |
| 8 | **back_width**/back | iso | kb-pullover(1,neuf) · seed-pullover(1,utilisé) · shrug(2, groupe back) | kb-pullover | 3×12-15 |
| c | core | — | pool[3] | seed-vertical-leg-crunch | 3×15 |

**Assertions : [PASS/FAIL]**
- Split `['glutes-hip','quad-glutes','glutes-hip','quad-glutes']` : **PASS** (`:493`)
- HOME sans pullup_bar : **PASS**
- Slot back_width (glutes-hip pos 4) : **le seed ne contient AUCUN compound DB/KB avec `primaryMuscle: 'back_width'`** → rempli par `kb-deadlift` via `'back'` : **PASS technique / ❌ défaut fonctionnel** — aucun warning
- `intermediate` → top-3 random pour glutes/ham compound cité : **PASS** (`:782-783`)
- Specs fat_loss `3×12-15` r60 : **PASS** (`:77`, `:84`)
- Zéro slot push (pecs, OHP, triceps) : **PASS** — assertion **GLUTES-SLOTS**
- Warning UX-D spécialisation : **PASS** (`:1082-1091`)

**Coach :**
- **Équilibre musculaire** : ❌ **Chaîne postérieure sur-représentée à l'extrême.** Sur la semaine : hip-hinge = hip thrust BW, kb-rdl ×2, kb-deadlift ×2, kb-swing, kb-clean, dumbbell-rdl ×2, band-good-morning ×2, band-hip-thrust = **12 mouvements de charnière de hanche**. Quads : 5 (goblet, bw-squat, lunges, bulgarian, wall-sit ×2). Tirage réel : 3 seulement (row-dumbbell, kb-row + isolations pull-over). Le programme n'est pas « fessiers & dos » mais **« charnière de hanche & un peu de dos »**.
- **Cohérence objectif** : ⚠️ `3×12-15` r60 en circuit convient au fat_loss. Mais : **zéro cardio** (lacune générale, voir synthèse) et surtout, **7 exercices sur 32 sont au poids du corps ou en élastique** avec `autoProgress: false` — la progression en déficit calorique repose alors uniquement sur les reps.
- → **Question de l'audit : « pertinence fat_loss d'un programme spécialisé fessiers ? »** ⚠️ Discutable. En déficit, la priorité est de préserver la masse maigre **globale** ; un programme sans aucun travail du haut du corps pousseur sacrifie pecs, deltoïdes et triceps pendant 12 semaines (`DURATION_WEEKS.intermediate = 12`, `:681`). Acceptable en **bloc de 4-6 semaines**, pas sur un cycle complet.
- **Durée/contenu** : ✅ 8 slots × 3 séries × ~1,6 min ≈ 39 min + 7 min ≈ **46 min** pour 60 annoncés. Le repos court (60 s) compense la densité → **tient largement**, avec ~14 min de marge (idéalement occupée par un finisher cardio).
- **Équipement** : ⚠️ HOME respecté, mais trois trous durs subis sans avertissement : `back_width` compound (∅), `hamstrings` isolation (∅), `quads` isolation (1 seul, isométrique).
- **Variété inter-sessions** : ❌ **Répétition partielle**. Pools trop courts pour 4 séances : `glutes` iso = 3 pour **6 slots** demandés (A ×2, C ×2, B ×1, D ×1) → tous les fessiers reviennent 2×. `hamstrings` iso = 0 (3 fallbacks pour 4 slots). `quads` iso = 1 pour 2 slots → wall-sit ×2. `back_width` cmp = 1 pour 2 slots → kb-deadlift ×2. Verdict : **variété d'exercices insuffisante dès la séance C**.
- **Couverture isolation** : ❌ **Lacunes problématiques** — ischios 0 isolation réelle (4 slots en fallback compound), quads 1 seul isométrique répété.
- **Verdict global : ❌ Problème sérieux** — le template `glutes-hip` est **incompatible avec HOME** : son slot dos postural devient un soulevé de terre kettlebell, et les pools d'isolation jambes sont vides ou de taille 1. Un avertissement équipement devrait être émis.

---

# P50 — Glutes-focus explicit, advanced, 3j, strength, BB+DB, 60 min

```
{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:BB+DB, level:'advanced', splitPreference:'glutes-focus' }
```

**Simulation :**
- **Filtre wizard** — aucun garde-fou pour `glutes-focus` (`ProgramGeneratorScreen.tsx:673-681`). À comparer avec `ppl` + strength qui **est** bloqué (`:642`) : le programme spécialisé, lui, passe.
- Étape 2 — `['glutes-hip','quad-glutes','glutes-hip']` (`:492`) → "Glutes & Hip … A" / "Quad & Glutes … B" / "Glutes & Hip … C"
- Étape 3 — `adjustedSlotCount(8, 60, 'strength')` = `max(4, floor(8×0.5))` = `max(4,4)` = **4 slots** (`:638`)
- Étape 5 — compound strength `5×3-5` r180 (`:74`) · isolation strength `3×5-8` r120 (`:81`) · `adjustedSpec` inchangé à 60 min
- `goal='strength'` + slot compound → `strengthEquipmentPrio` actif (`:769-772`)
- `advanced` → top-3 random (`:782-783`)
- Total : 4 + warmup + core = **6 exercices**
- **Warnings émis** : UX-D spécialisation (`:1082-1091`) ✅ · UX-C force+débutant : **non** (advanced) · warning volume 5j : non

**Pools BB+DB pertinents :** glutes cmp = **seed-hip-thrust(4, bb) uniquement** (hip-thrust-bw = bodyweight, hip-thrust-machine = machine, band-hip-thrust = band, curtsy-lunge = bodyweight → tous hors BB+DB) · hamstrings cmp = romanian-deadlift(3, bb) · good-morning(1, bb) · dumbbell-rdl(2, db) · quads cmp = squat-barbell(8, bb) · front-squat(2, bb) · lunges(2, db) · bulgarian(2, db) · **back_width cmp = ∅**, back cmp = seed-deadlift(3, bb) · back_thickness cmp = row-barbell(7, bb) · row-tbar(2, bb) · row-dumbbell(3, db)

## Séance A — Glutes & Hip A (`glutes-hip`, 4 slots retenus sur 8)

| # | Slot muscles | Cat | Top-3 candidats (prio équip. force) | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[0] | seed-bird-dog | 2×10 |
| 1 | **glutes**/hamstrings | cmp | **seed-hip-thrust**(bb, glutes) · romanian-deadlift(bb, ham) · good-morning(bb, ham) | hip-thrust ⚠️ | 5×3-5 (r180) |
| 2 | **hamstrings**/glutes | cmp | **romanian-deadlift**(bb,3) · good-morning(bb,1) · dumbbell-rdl(db,2) | romanian-deadlift | 5×3-5 |
| 3 | **quads**/glutes | cmp | **squat-barbell**(bb,8) · front-squat(bb,2) · lunges(db,2) | squat-barbell | 5×3-5 |
| 4 | **back_width**/back | cmp | **seed-deadlift** — *candidat unique* (`back_width` : ∅) | seed-deadlift ❌ | 5×3-5 |
| — | ~~glutes iso · ham iso · glutes iso · back iso~~ | — | **slots 5-6-7-8 éjectés par le cap 4** | — | — |
| c | core | — | pool[0] | seed-scissors | 3×15 |

⚠️ Slot 1 : `good-morning` (pop 1, techniquement le plus risqué du seed) figure dans le top-3 — il y a **1 chance sur 3** que la séance ouvre par un good morning barre en 5×3-5. Cause : `slot.muscles[0]='glutes'` ne matche que hip-thrust, puis la prio barre (`:769-772`) fait remonter tous les barbell avant `dumbbell-rdl`, en ignorant la popularité entre groupes de muscles distincts.
❌ Slot 4 : `back_width` sans compound en BB+DB → **soulevé de terre 5×3-5 en 4ᵉ position, après hip thrust 5×3-5, RDL 5×3-5 et squat 5×3-5.** Quatre mouvements maximaux de chaîne postérieure / colonne dans la même séance, 2 fois par semaine (A et C). **C'est le point le plus dangereux de tout le groupe C.**

## Séance B — Quad & Glutes B (`quad-glutes`, 4 slots retenus sur 8)

| # | Slot muscles | Cat | Top-3 candidats (prio équip. force, neuf d'abord dans le tier) | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[1] | seed-cat-cow | 2×10 |
| 1 | **quads**/glutes | cmp | **front-squat**(bb,2,neuf) · squat-barbell(bb,8,utilisé) · lunges(db,2) | front-squat | 5×3-5 |
| 2 | **glutes**/hamstrings | cmp | **seed-hip-thrust**(bb, seul glutes) · romanian-deadlift(bb) · good-morning(bb) | hip-thrust *(2ᵉ fois)* | 5×3-5 |
| 3 | **back_thickness**/back | cmp | **row-barbell**(bb,7) · row-tbar(bb,2) · row-dumbbell(db,3) | row-barbell ✅ | 5×3-5 |
| 4 | quads | **iso** | *isolation quads : ∅ en BB+DB* → fallback cmp : lunges(2,neuf) · bulgarian(2,neuf) · squat-barbell(8,utilisé) | seed-lunges ⚠️ | **3×5-8** (r120) |
| — | ~~glutes iso · ham iso · calves · back_width iso~~ | — | **slots 5-6-7-8 éjectés par le cap 4** | — | — |
| c | core | — | pool[1] | seed-bicycle-crunch *(core pool BB+DB : scissors · crunch · bicycle-crunch)* → **seed-crunch** | 3×15 |

⚠️ Slot 4 : le « leg extension » (`:350`) devient une **3ᵉ variante de squat/fente** prescrite en 3×5-8 — 3 mouvements de quadriceps lourds dans une séance de 4 slots.

## Séance C — Glutes & Hip C (`glutes-hip`, 4 slots retenus sur 8)

| # | Slot muscles | Cat | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[2] | seed-shoulder-circles | 2×10 |
| 1 | **glutes**/hamstrings | cmp | **seed-hip-thrust**(bb, seul glutes, utilisé — la prio équip. précède `usedGlobally`) · romanian-deadlift · good-morning | hip-thrust ❌ *(3ᵉ fois)* | 5×3-5 |
| 2 | **hamstrings**/glutes | cmp | good-morning(bb,1,neuf) · romanian-deadlift(bb,3,utilisé) · dumbbell-rdl(db,2,neuf) | good-morning ⚠️ | 5×3-5 |
| 3 | **quads**/glutes | cmp | bulgarian(db,2,neuf) *après* squat-bb(bb,utilisé) et front-squat(bb,utilisé) — la prio barre les maintient devant | squat-barbell / front-squat *(répétition)* | 5×3-5 |
| 4 | **back_width**/back | cmp | **seed-deadlift** — *unique* | seed-deadlift ❌ *(2ᵉ fois)* | 5×3-5 |
| — | ~~4 isolations~~ | — | **éjectées par le cap 4** | — | — |
| c | core | — | pool[2] | seed-bicycle-crunch | 3×15 |

❌ Slot 1 : `seed-hip-thrust` est le **seul** compound `glutes` en BB+DB, et `strengthEquipmentPrio` (`:769-772`) s'applique **avant** `usedGlobally` (`:773-775`) → il est reconduit à **chaque** séance A, B et C, soit **3 hip thrust 5×3-5 par semaine**.

**Assertions : [PASS/FAIL]**
- Split `['glutes-hip','quad-glutes','glutes-hip']` : **PASS** (`:492`)
- `adjustedSlotCount(8, 60, 'strength')` = 4 : **PASS** (`:638`) — assertion **SLOT-FORCE**
- 6 exercices par séance : **PASS**
- Compound strength `5×3-5` r180 : **PASS** (`:74`)
- `advanced` → top-3 random pour glutes/ham compound cité (hip-thrust · romanian-deadlift · good-morning) : **PASS**
- Zéro slot push : **PASS** — assertion **GLUTES-SLOTS**
- **Assertion coach « hip thrust barre en 5×3-5, cohérent ? »** : voir ci-dessous.
- ❌ **FAIL structurel** : la coupe à 4 slots supprime **les 4 slots d'isolation fessiers/ischios/dos** de `glutes-hip` et les **4 slots quads/glutes/ischios/mollets/dos** de `quad-glutes`. Un programme **spécialisé fessiers** se retrouve **sans une seule isolation fessier de la semaine**.

**Coach :**
- **Équilibre musculaire** : ❌ Sur les 12 slots de la semaine : 6 sont des hip-hinge/hip-thrust (hip thrust ×3, RDL, good morning, deadlift ×2 = 7 en réalité), 4 des squats/fentes, 1 rowing. **Zéro isolation.** Zéro mollet. Zéro dos vertical. Ratio charnière/genou ≈ 2:1, très inhabituel même pour un programme postérieur.
- **Cohérence objectif** : ⚠️ **Question de l'audit : « hip thrust et RDL en 5×3-5, cohérent ? »** Réponse nuancée :
  - Le **RDL en 3-5 reps** est légitime et pratiqué (accessoire de force au deadlift) — mais l'amplitude et la tension excentrique le rendent plus productif en 5-8.
  - Le **hip thrust en 5×3-5** est **discutable** : c'est un mouvement à faible amplitude, sans phase excentrique lourde ni composante de stabilisation, dont l'intérêt principal est la tension métabolique/mécanique sur le grand fessier en 6-15 reps. En 3-5 reps très lourd, il devient surtout un exercice d'inconfort (barre sur les hanches, cisaillement du bassin) au rapport bénéfice/risque médiocre. La littérature (Contreras) le positionne à 8-12 reps.
  - **« La force sur fessiers/ischios est-elle un objectif sportif valide ? »** ✅ **Oui, sans réserve** : sprint, saut, powerlifting (deadlift, squat), sports de contact et athlétisme féminin reposent directement sur la force de la chaîne postérieure. L'objectif est légitime ; c'est la **prescription** (hip thrust en 3-5) et la **sécurité de la séance** (4 mouvements maximaux de colonne enchaînés) qui posent problème.
- **Durée/contenu** : ⚠️ 4 slots × 5 séries × ~3,5 min ≈ 70 min + warmup/core 7 min ≈ **77 min** pour 60 annoncés (+28 %). Le code lui-même annonce « 4 slots ≈ 65-70 min effectifs » (`:620`).
- **Équipement** : ⚠️ Prio barre correctement appliquée (5 des 6 exercices distincts sont en barre). Mais 3 trous durs : `back_width` cmp (∅), `quads` iso (∅), `glutes` cmp = 1 seul candidat.
- **Variété inter-sessions** : ❌ **Répétition quasi complète** A→C : hip thrust identique (slot 1, la prio équipement neutralise `usedGlobally`), deadlift identique (slot 4, candidat unique). Seuls les slots 2 et 3 tournent. Verdict : **variété d'exercices marginale**.
- **Couverture isolation** : ❌ **Lacunes problématiques — les pires du groupe C.** 0 slot isolation sur les 3 séances : ni fessiers, ni ischios, ni quadriceps, ni mollets, ni dos. Un programme « spécialisé fessiers » qui ne contient **aucun exercice de fessier isolé**.
- **Verdict global : ❌ Problème sérieux** — trois défauts cumulés : (1) 4 mouvements maximaux de chaîne postérieure/colonne dans la même séance (hip thrust + RDL + squat + deadlift en 5×3-5), 2× par semaine ; (2) hip thrust reconduit 3× par la neutralisation de `usedGlobally` par la prio équipement ; (3) **zéro isolation fessier dans un programme fessiers**. Le wizard ne propose aucun garde-fou alors qu'il bloque PPL pour ce même objectif force.

---

# P51 — Glutes-focus explicit, beginner, 2j, fat_loss, FULL, 60 min

```
{ goal:'fat_loss', daysPerWeek:2, sessionDuration:60, equipment:FULL, level:'beginner', splitPreference:'glutes-focus' }
```

**Simulation :**
- **Filtre wizard** — aucun garde-fou (`ProgramGeneratorScreen.tsx:673-681`)
- Étape 2 — `selectSplit` pref `glutes-focus`, case 2 → `['glutes-hip','quad-glutes']` (`:491`) — assertion **GLUTES**
- Noms : canon `'lower'` × 2 → suffixes A/B → **"Glutes & Hip — Fessiers & Ischio A"** · **"Quad & Glutes — Jambes & Fessiers B"**
- Étape 3 — 8 slots chacune (`:640`, fat_loss 60 min = base)
- Étape 5 — compound **et** isolation fat_loss `3×12-15` r60 (`:77`/`:84`) · `beginner` → `candidates[0]` déterministe (`:781`)
- Total : 8 + warmup + core = **10 exercices** par séance
- Jours : `DAY_ASSIGNMENTS[2]` = lundi / jeudi (`:582`)
- **Warning émis** : UX-D spécialisation (`publicTypes = {'lower'}`, `:1082-1091`) ✅

## Séance A — Glutes & Hip A (`glutes-hip`, 8 slots · warmup bird-dog · core scissors)

| # | Slot muscles | Cat | Top-3 candidats (pop desc) | Exercice retenu (beginner) | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[0] | seed-bird-dog | 2×10 |
| 1 | **glutes**/hamstrings | cmp | hip-thrust(4,bb) · hip-thrust-bw(3) · hip-thrust-machine(3) | **seed-hip-thrust** | 3×12-15 (r60) |
| 2 | **hamstrings**/glutes | cmp | romanian-deadlift(3,bb) · bw-nordic-curl(2) · dumbbell-rdl(2) | **seed-romanian-deadlift** | 3×12-15 |
| 3 | **quads**/glutes | cmp | squat-barbell(8,bb) · leg-press(3) · bw-squat(3) | **seed-squat-barbell** | 3×12-15 |
| 4 | **back_width**/back | cmp | lat-pulldown(3, idx103) · pullup(3, idx105) · deadlift(3) | **seed-lat-pulldown** ⚠️ | 3×12-15 |
| 5 | glutes | iso | glute-bridge(3) · donkey-kick(2) · fire-hydrant(2) | **seed-glute-bridge** | 3×12-15 |
| 6 | hamstrings | iso | leg-curl-lying(3) · leg-curl-seated(2) · leg-curl-standing(2) | **seed-leg-curl-lying** | 3×12-15 |
| 7 | glutes (2ᵉ) | iso | donkey-kick(2) · fire-hydrant(2) · hip-abduction(2) | **seed-donkey-kick** | 3×12-15 |
| 8 | back_thickness/back | iso | pullover-dumbbell(3) · pullover-cable(2) · straight-arm-pulldown(2) | **seed-pullover-dumbbell** | 3×12-15 |
| c | core | — | pool[0] | seed-scissors | 3×15 |

⚠️ Slot 4 : l'assertion attendait `seed-pullup` (pullup_bar) ; c'est **`seed-lat-pulldown`** qui l'emporte — popularité 3 identique, départage par l'index seed (103 < 105). Sportivement c'est **meilleur** pour un débutant (charge ajustable vs traction complète), mais l'assertion est **FAIL**.

## Séance B — Quad & Glutes B (`quad-glutes`, 8 slots · warmup cat-cow · core crunch)

| # | Slot muscles | Cat | Top-3 candidats (neuf d'abord) | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | pool[1] | seed-cat-cow | 2×10 |
| 1 | **quads**/glutes | cmp | leg-press(3,neuf) · bw-squat(3,neuf) · lunges(2,neuf) *(squat-bb utilisé)* | **seed-leg-press** | 3×12-15 |
| 2 | **glutes**/hamstrings | cmp | hip-thrust-bw(3,neuf,idx61) · hip-thrust-machine(3,neuf,idx150) · curtsy-lunge(1) | **seed-hip-thrust-bw** ⚠️ | 3×12-15 |
| 3 | **back_thickness**/back | cmp | row-barbell(7) · row-dumbbell(3) · row-tbar(2) | **seed-row-barbell** ✅ | 3×12-15 |
| 4 | quads | iso | leg-extension(3) · bw-wall-sit(2) *(pool = 2)* | **seed-leg-extension** | 3×12-15 |
| 5 | glutes | iso | fire-hydrant(2,neuf) · hip-abduction(2,neuf) · hip-adduction(2,neuf) | **seed-fire-hydrant** ⚠️ | 3×12-15 |
| 6 | hamstrings | iso | leg-curl-seated(2,neuf) · leg-curl-standing(2,neuf) · leg-curl-lying(utilisé) | **seed-leg-curl-seated** | 3×12-15 |
| 7 | calves | iso | calf-seated(2,idx73) · calf-standing(2,idx74) · bw-calf-raise(2,idx133) | **seed-calf-raise-seated** | 3×12-15 |
| 8 | **back_width**/back | iso | seed-pullover(1, back_width, idx82) · shrug(2, back, idx57) | **seed-pullover** | 3×12-15 |
| c | core | — | pool[1] | seed-crunch | 3×15 |

⚠️ Slot 2 : `seed-hip-thrust-bw` (poids du corps) retenu alors que `seed-hip-thrust-machine` a la même popularité — départage par l'index seed (61 < 150). En salle complète, un slot composé au poids du corps est un gaspillage.
⚠️ Slot 5 : `seed-fire-hydrant` (poids du corps, très faible tension) plutôt que `seed-hip-abduction` (machine, chargeable) — même popularité 2, index seed 49 < 71.

**Couverture des deux séances (vérification de l'assertion) :**

| Groupe | Séance A | Séance B | Total slots primaires/sem |
|---|---|---|---|
| Fessiers | hip-thrust (cmp) · glute-bridge (iso) · donkey-kick (iso) | hip-thrust-bw (cmp) · fire-hydrant (iso) | **5** |
| Ischios | romanian-deadlift (cmp) · leg-curl-lying (iso) | leg-curl-seated (iso) | **3** |
| Quadriceps | squat-barbell (cmp) | leg-press (cmp) · leg-extension (iso) | **3** |
| Dos | lat-pulldown (cmp, vertical) · pullover-dumbbell (iso) | row-barbell (cmp, horizontal) · seed-pullover (iso) | **4** |
| Mollets | — | calf-raise-seated (iso) | **1** |
→ ✅ **Assertion « les deux séances couvrent fessiers + ischios + quads + dos » : PASS.** Le dos est même couvert dans les deux plans (vertical en A, horizontal en B).

**Assertions : [PASS/FAIL]**
- Split `['glutes-hip','quad-glutes']` : **PASS** (`:491`) — assertion **GLUTES**
- Deux séances structurellement différentes : **PASS** — `SLOTS['glutes-hip']` (`:331-342`) démarre par hip thrust + RDL + fente + lat pulldown, `SLOTS['quad-glutes']` (`:344-355`) par squat + hip thrust + rowing ; ordres musculaires et slots isolation distincts (calves et quads iso uniquement en B, 2 slots fessiers iso uniquement en A)
- Couverture fessiers + ischios + quads + dos : **PASS** (tableau ci-dessus)
- Slot back_width glutes-hip (FULL) = `seed-pullup` : **❌ FAIL** — `seed-lat-pulldown` gagne le départage d'index seed
- Specs fat_loss `3×12-15` : **PASS** (`:77`, `:84`)
- 8 slots + warmup + core = 10 exercices : **PASS**
- Zéro slot push : **PASS** — assertion **GLUTES-SLOTS**
- Warning UX-D spécialisation : **PASS** (`:1082-1091`)

**Coach :**
- **Équilibre musculaire** : ⚠️ Par construction sans push (0 pec, 0 deltoïde, 0 triceps sur 16 slots). Le dos est bien couvert dans les **deux plans** (vertical + horizontal) — c'est le point fort du template à 2j. Sur le bas du corps, l'équilibre fessiers/ischios/quads (5/3/3) est cohérent avec la promesse « fessiers ».
- **Cohérence objectif** : ⚠️ `3×12-15` r60 convient au fat_loss. Volume : fessiers 15 séries/sem, ischios 9, quads 9, dos 12, mollets 3. **Volume total 48 séries/semaine sur 2 séances** — élevé par séance (24), correct sur la semaine pour un débutant. Toujours **zéro cardio** malgré l'objectif.
- → **Question de l'audit : « 2 séances suffisent-elles pour progresser ? »** ✅ **Oui pour un débutant**, et c'est même le meilleur ratio du groupe C : à 2j, chaque groupe est touché 1-2× — dans la fourchette recommandée (1,5-2×/sem). Les fessiers sont travaillés **dans les deux séances** (hip thrust en A **et** B), ce qui donne la fréquence 2× recherchée. Le seul groupe sous-servi est les mollets (1×).
- **Durée/contenu** : ✅ 8 slots × 3 séries × ~1,6 min ≈ 39 min + 7 min warmup/core ≈ **46 min** pour 60 annoncés. **Tient confortablement**, ~14 min de marge.
- **Équipement** : ⚠️ FULL disponible mais **3 sélections en poids du corps** (hip-thrust-bw, glute-bridge, donkey-kick, fire-hydrant → 4 en réalité) avec `progressStepKg: 0` / `autoProgress: false` (`:789-790`) — soit **4 exercices sur 16 sans progression automatique** dans un programme d'accompagnement débutant. Les machines abducteurs/adducteurs et le hip thrust machine, tous chargeables, restent inutilisés.
- **Variété inter-sessions** : ✅ **Variété structurelle** A→B — templates différents, ordres différents, aucun exercice répété (16/16 distincts grâce à `usedGlobally`). Aucune séance du même type dans la semaine → pas de problème de rotation.
- **Couverture isolation** : ✅ **Complète pour le périmètre** — fessiers ×3, ischios ×2, quads ×1, dos ×2, mollets ×1. Verdict : couverture cohérente.
- **Verdict global : ✅ Bon programme avec réserve mineure** — c'est **le profil glutes-focus le mieux calibré du groupe C** : durée respectée, variété structurelle réelle, dos couvert dans les deux plans, fréquence fessiers 2×. Réserve unique : 4 sélections au poids du corps là où la salle offre des équivalents chargeables.

---

# Bloc 1 — Tableau de synthèse (P38 → P51)

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|---|---|---|---|
| **P38** fullbody beginner 3j hyp FULL | Split fullbody-quad/hip/quad (`:481`) · 9 slots (`:640`) · 11 exercices · beginner déterministe | ✅ PASS *(1 réserve : `autoProgress` faux pour pullup/bw-calf)* | Durée réelle ~85-100 min pour 60 annoncés · `seed-row-barbell` (pop 7) inatteignable · A et C structurellement identiques · 0 isolation fessiers |
| **P39** fullbody intermediate 3j **force** BB+DB | Split fullbody ×3 · `adjustedSlotCount(9,60,'strength')=4` (`:638`) · 6 exercices · 5×3-5 r180 · prio barre (`:769-772`) | ⚠️ PASS avec **1 FAIL découvert** | `strengthEquipmentPrio` évalué **avant** `usedGlobally` → bench bb + ohp bb aux 3 séances · 0 isolation de la semaine · 0 tirage vertical (back_width cmp ∅ en BB+DB) · durée ~77 min |
| **P40** upper-lower intermediate 4j hyp FULL | Split upper-push/lower-quad/upper-pull/lower-hip (`:453`) · 8/6/8/6 · noms A/B · identique à l'auto P10 (`:561`) | ✅ PASS | Pec supérieur jamais chargé en compound (`slot.muscles[0]='chest'`) · aucun unilatéral · slot fessiers = top-3 100 % poids du corps · `bw-wall-sit` (`time`) prescrit en reps · Upper ~70 min |
| **P41** upper-lower **beginner** 4j fat_loss HOME | Split upper/lower forcé (`:453`) · 8/6/8/6 · 3×12-15 r60 · **aucun guard wizard** (`Screen:645-646`) | ⚠️ PASS avec **1 FAIL d'attente** | Slot back_width upper-pull → **`kb-deadlift`** au lieu d'un rowing, **sans warning** · ischios : 0 isolation → fallback RDL · débutant sur split intermédiaire sans garde-fou · 10/32 exercices sans autoProgress |
| **P42** ppl intermediate 3j hyp FULL | Split push/pull/legs (`:443`) · `incompatibleReason('ppl')=null` (`Screen:640-644`) · 6/6/6 · identique à l'auto P06 | ✅ PASS | Fréquence 1×/groupe (sous-optimal en hypertrophie) · 60 min sous-utilisées (~47-55 min réels) · slot avant-bras de faible valeur |
| **P43** ppl intermediate 3j **fat_loss** FULL | `incompatibleReason('ppl')=null` pour fat_loss · split identique à P42 (`goal` ignoré par la branche `pref`) | ✅ PASS | PPF (auto) supérieur pour fat_loss (fréquence 2× haut du corps) · **zéro cardio** malgré l'objectif · squat en 12-15 reps r60 · 20 min inutilisées |
| **P44** arnold intermediate 4j hyp FULL | `incompatibleReason('arnold')=null` (`Screen:634-639`) · split chest-back/shoulders-arms/legs/upper (`:463`) · 9/8/6/8 | ⚠️ PASS avec **FAIL sur les noms** | **Suffixes A/B/C répartis sur 3 noms différents** (`:1039-1041`) · ratio haut/bas **4:1**, jambes 1× · séance 1 ~80-90 min pour 60 |
| **P45** arnold **advanced** 3j fat_loss 45 min BB+DB | Split chest-back/shoulders-arms/legs (`:462`) · slots 6/6/4 (`:635-636`) · **2 séries** (`:653-654`) | ❌ FAIL (noms) + problèmes coach | Slot back_width → **deadlift 2×12-15** · face pull coupé · biceps 2 slots / triceps 1 · **mollets 0** · 2 séries insuffisantes pour un confirmé en déficit · 26-32 min pour 45 annoncés |
| **P46** brosplit intermediate 5j hyp FULL | `incompatibleReason('brosplit')=null` (`Screen:628-633`) · split chest-tri/back-bi/legs/shoulders-arms/upper (`:474`) · 7/8/6/8/8 | ⚠️ PASS avec **FAIL sur les noms** | Suffixes A/B sur `shoulders-arms` et `upper` · **jambes 1× (6 slots) vs 31 slots haut du corps** · bras 15+15 séries/sem (excessif) · `chest_lower` iso → dips · séances 8 slots ~70 min |
| **P47** brosplit **advanced** 5j fat_loss BB+DB | Split identique P46 · specs 3×12-15 r60 · 37 slots, aucun slot vide → **aucun warning** | ❌ FAIL (noms) + problèmes coach | **6 répétitions forcées** (pools BB+DB trop courts) · 4 slots isolation détournés en compound · back_width → deadlift · **0 tirage vertical** · squat/DL en 12-15 chez un confirmé |
| **P48** glutes-focus **beginner** 3j hyp FULL | Split glutes-hip/quad-glutes/glutes-hip (`:492`) · noms A/B/C · 8 slots · **zéro slot push** (`:331-355`) · warning UX-D émis (`:1082-1091`) | ⚠️ PASS *(1 FAIL : slot 4 = lat-pulldown, pas pullup)* | **`bw-nordic-curl` 4×8-12 chez un débutant** · 6 sélections poids du corps en salle complète · `seed-hip-adduction-machine` étiqueté `glutes` (erreur seed) · A et C structurellement identiques · ~75-85 min pour 60 |
| **P49** glutes-focus intermediate 4j fat_loss **HOME** | Split ×4 (`:493`) · 8 slots · **back_width cmp = ∅ en HOME** → `kb-deadlift` sans warning | ❌ Problème sérieux | 12 charnières de hanche/sem, 3 tirages seulement · ischios 0 isolation (4 fallbacks) · quads 1 isométrique répété · glutes iso : pool 3 pour 6 slots → répétitions dès C · aucun avertissement équipement |
| **P50** glutes-focus **advanced** 3j **force** BB+DB | Split ×3 (`:492`) · `adjustedSlotCount(8,60,'strength')=4` (`:638`) · 5×3-5 r180 · zéro slot push · **aucun guard wizard** | ❌ Problème sérieux | **hip thrust + RDL + squat + deadlift en 5×3-5 dans la même séance, 2×/sem** · hip thrust 3×/sem (prio équip. neutralise `usedGlobally`) · **0 isolation fessier dans un programme fessiers** · good morning dans le top-3 du slot 1 · ~77 min pour 60 |
| **P51** glutes-focus beginner 2j fat_loss FULL | Split `['glutes-hip','quad-glutes']` (`:491`) · 8 slots · 10 exercices · couverture fessiers/ischios/quads/dos vérifiée · warning UX-D | ✅ PASS *(1 FAIL : slot 4 = lat-pulldown, pas pullup)* | 4 sélections poids du corps (`autoProgress: false`) alors que hip-thrust-machine / hip-abduction sont disponibles · mollets 1×/sem · zéro cardio |

---

# Bloc 2 — Synthèse des problèmes ouverts (groupe C)

## A. Bugs / anomalies logicielles (assertions FAIL)

### BUG-C1 — Suffixes A/B/C appliqués à des séances de noms différents · **P44, P45, P46, P47**
`toPublicType` (`:117-127`) projette `chest-back`, `shoulders-arms` et `upper` sur le même canon `'upper'`, puis `:1039-1041` calcule `totalOfType` sur ce canon et suffixe **tous** ces workouts.
- **Impact concret** : l'Arnold 4j produit "Chest & Back — Pectoraux & Dos **A**", "Shoulders & Arms — Épaules & Bras **B**", "Legs — Jambes", "Upper — Haut du corps **C**". L'utilisateur voit trois séances aux noms différents portant les lettres A, B, C — qui suggèrent des variantes d'une même séance.
- **Correction recommandée** : ne suffixer que si le **nom affiché** (`WORKOUT_NAMES[workoutType]`) est identique, pas le type public. Remplacer `split.filter(t => toPublicType(t) === canon).length` par `split.filter(t => WORKOUT_NAMES[t] === WORKOUT_NAMES[workoutType]).length` et compter l'occurrence sur la même clé.

### BUG-C2 — `strengthEquipmentPrio` court-circuite l'anti-répétition · **P39, P50**
Dans `pickExercise` (`:757-777`), l'ordre des critères place la priorité d'équipement force (`:769-772`) **avant** `usedGlobally` (`:773-775`).
- **Impact concret** : sur tout slot composé en `goal === 'strength'`, l'exercice barbell le mieux placé est reconduit à **chaque** séance. P39 : bench barre et OHP barre aux 3 séances. P50 : hip thrust aux 3 séances (seul compound `glutes` en BB+DB) et deadlift 2×. En `level: 'beginner'`, ce serait strictement le même programme répété.
- **Correction recommandée** : déplacer le bloc `usedGlobally` **avant** le bloc `strengthEquipmentPrio`, ou n'appliquer la prio équipement qu'à égalité d'usage.

### BUG-C3 — Slot composé détourné vers un muscle secondaire, sans warning · **P39, P41, P45, P47, P49, P50**
Quand `slot.muscles[0]` n'a aucun candidat compound mais qu'un muscle plus loin dans la liste en a un, `pickExercise` retourne cet exercice — le warning de `:994-1007` ne se déclenche que si le retour est `null`.
- **Impact concret** : le slot `['back_width','back']` (traction / lat pulldown) devient `seed-deadlift` en BB+DB (P39, P45, P47, P50) et `kb-deadlift` en HOME (P41, P49). L'utilisateur croit avoir un tirage vertical, il a un hip-hinge. Aucun message ne l'informe.
- **Correction recommandée** : émettre un warning quand l'exercice retenu n'a **pas** `slot.muscles[0]` comme `primaryMuscle` sur un slot composé (ex. « Aucun exercice de tirage vertical avec votre équipement — remplacé par un soulevé de terre »). Et ajouter `'back_thickness'` au slot `back_width` de `glutes-hip` (`:336`) pour que les rowings DB/KB soient éligibles.

### BUG-C4 — Slot isolation rempli par un composé, sans distinction · **P41, P45, P47, P49**
`:749-750` : si aucun exercice `isolation` ne correspond, la liste complète (composés inclus) est conservée.
- **Impact concret** : en BB+DB et HOME, les slots « leg extension », « leg curl », « hip abduction », « cable crossover » sont remplis par une 3ᵉ variante de squat, un 2ᵉ RDL, un hip thrust barre ou des dips — avec la spec **isolation** (3×5-8 en force, P50 slot 4). Le pic est P47 séance Legs : 3 slots isolation sur 4 remplis par des composés.
- **Correction recommandée** : conserver le fallback mais l'exclure quand l'exercice retenu est déjà présent dans la séance sous un autre slot ; et signaler la substitution.

### BUG-C5 — Donnée seed erronée : `seed-hip-adduction-machine` étiqueté `glutes` · **P48**
`seed-hip-adduction-machine` (« Machine adducteurs ») a `primaryMuscle: 'glutes'`. Les adducteurs sont un groupe distinct.
- **Impact concret** : il occupe un slot d'isolation fessier dans un programme spécialisé fessiers (P48 séance C slot 7).
- **Correction recommandée** : ajouter un `MuscleGroup` `adductors` ou re-classer en `quads` avec `secondaryMuscles: ['glutes']`, et retirer l'exercice du pool `glutes`.

### FAIL-C6 — Attentes du prompt d'audit corrigées par le code
- P48 / P51 slot 4 `back_width` : l'assertion attendait `seed-pullup` ; le code retient **`seed-lat-pulldown`** (popularité 3 identique, index seed 103 < 105, tri stable `:776`). Sportivement meilleur pour un débutant, mais l'assertion est **FAIL**.
- P41 : l'assertion anticipait un « rowing DB/KB » pour le slot `back_width` en HOME ; le code retient `kb-deadlift` (voir BUG-C3). **FAIL**.

## B. Réserves coach cumulées, par thème

### Thème 1 — Timing annoncé vs timing réel (le problème le plus systématique)
| Profil | Slots | Durée annoncée | Durée estimée | Écart |
|---|---|---|---|---|
| P38 fullbody 9 slots hyp | 9 | 60 min | 85-100 min | **+40 à +65 %** |
| P44 chest-back 9 slots hyp | 9 | 60 min | 80-90 min | **+35 à +50 %** |
| P48 glutes-hip 8 slots hyp | 8 | 60 min | 75-85 min | **+25 à +40 %** |
| P39 / P50 force 4 slots | 4 | 60 min | ~77 min | **+28 %** |
| P46 brosplit 8 slots hyp | 8 | 60 min | 67-72 min | +15 % |
| P40 upper-push 8 slots hyp | 8 | 60 min | ~70 min | +15 % |
| P42 / P43 / P51 / P41 / P47 | 6-8 | 60 min | 36-55 min | **−10 à −40 % (sous-rempli)** |
| P45 arnold 45 min | 6 | 45 min | 26-32 min | **−30 à −40 %** |
- **Diagnostic** : `adjustedSlotCount` (`:627-644`) ne dépend **que** de la durée et du booléen `isStrength`. Il ignore complètement le `restSec` réel de l'objectif — or `hypertrophy` (r90 cmp / r75 iso) coûte ~40 % de temps de plus par slot que `fat_loss` (r60 partout).
- **Recommandation** : indexer le nombre de slots sur un **budget temps** = `Σ (sets × (tempo + restSec))` par slot, plutôt que sur un facteur multiplicatif. Cela résorberait à la fois le débordement des profils hypertrophie et le sous-remplissage des profils fat_loss.

### Thème 2 — Objectif `fat_loss` : aucun cardio, jamais · **P41, P43, P45, P47, P49, P51 (6 profils sur 14)**
Le seed contient 8 exercices `primaryMuscle: 'cardio'` (tapis, vélo, rameur, elliptique, burpees, corde à sauter, high knees, jumping jacks) ; **aucun slot de `SLOTS` (`:131-387`) ne cible `'cardio'`**. Un programme `fat_loss` est donc strictement un programme de musculation à reps élevées et repos courts.
- **Recommandation** : ajouter en queue de `SLOTS`, conditionnellement à `goal === 'fat_loss' || goal === 'endurance'`, un slot `{ muscles: ['cardio'], compound: true }` — et le placer dans la marge de 15-20 min identifiée au thème 1.

### Thème 3 — Pas de critère de « chargeabilité » hors objectif force · **P38, P40, P48, P49, P51**
`strengthEquipmentPrio` (`:707-719`) n'est appliqué que si `goal === 'strength'` (`:769`). Pour l'hypertrophie et le fat_loss, la sélection ne dépend que de `popularity` puis de l'index seed. Résultat en salle complète :
- P48 : `seed-hip-thrust-bw` (BW) devant `seed-hip-thrust-machine` (idx 61 < 150) · `bw-squat` en 4×8-12 · `bw-nordic-curl` chez un débutant · `glute-bridge`, `donkey-kick`, `fire-hydrant` (BW) devant `seed-hip-abduction` (machine)
- P38 : `bw-calf-raise` devant `seed-calf-raise-db` et `seed-calf-raise-bb`
- P40 : top-3 fessiers = 100 % poids du corps
- **Impact** : les exercices retenus ont `progressStepKg: 0` et `autoProgress: false` (`:789-790`) — l'app ne peut plus proposer de progression. 4 à 6 exercices par programme dans ce cas.
- **Recommandation** : appliquer un `hypertrophyEquipmentPrio` (chargeable > non chargeable) pour `goal === 'hypertrophy'` sur les slots composés **et** sur les isolations, ou dégrader la popularité des exercices `bodyweight`/`band` quand un équipement chargé est disponible.

### Thème 4 — `slot.muscles[0]` prime sur tout, y compris sur l'intention du template · **P38, P40, P46, P47, P48, P50**
Le critère `slotPrimary` (`:763-768`) est évalué juste après le focus, avant l'équipement, l'usage global et la popularité. Conséquences observées :
- `seed-row-barbell` (pop 7, l'exercice de dos le plus populaire) est **inatteignable** dans tout slot commençant par `back_width` (P38 fullbody-quad, P40, P48).
- `seed-incline-bench-barbell` (pop 4) est **inatteignable** dans tout slot commençant par `chest` — le pec supérieur n'est jamais chargé en compound sauf dans `chest-tri` (`:308`, seul slot à mettre `chest_upper` en tête).
- Les commentaires du code sont contredits : « Fente bulgare / lunge / step-up » (`:229`, `:335`) donne un **leg press** ou un **squat barre** ; « Développé incliné » (`:204`) donne un **développé couché haltères**.
- Le critère écrase aussi `usedGlobally` → répétitions (P38 lat-pulldown en A et C, P41 et P47 pullover-dumbbell).
- **Recommandation** : soit accepter des exercices d'un muscle voisin quand l'écart de popularité est important (ex. pondération plutôt que tri lexicographique), soit corriger les listes `muscles` des slots concernés pour refléter l'intention (mettre `chest_upper` en tête du slot « incliné » d'`upper-pull`, `back_thickness` en tête du slot rowing).

### Thème 5 — Pools d'exercices trop courts pour certains couples split × équipement · **P41, P47, P49, P50**
| Contexte | Pool | Slots demandés/sem | Résultat |
|---|---|---|---|
| P47 BB+DB `triceps` | 3 | 5 | 2 répétitions |
| P47 BB+DB `shoulders_rear` | 1 | 3 | 3× le même exercice |
| P47 BB+DB `shoulders_lateral` / `chest` iso | 1 / 1 | 2 / 2 | répétitions |
| P49 HOME `glutes` iso | 3 | 6 | tous 2× |
| P49 HOME `quads` iso | 1 | 2 | wall-sit 2× |
| P49/P41 HOME `hamstrings` iso | **0** | 4 | 4 fallbacks compound |
| P50 BB+DB `glutes` cmp | 1 | 3 | hip thrust 3× |
| P41 HOME `shoulders_lateral` | 1 | 2 | lateral raise 2× |
- **Recommandation** : au moment de la validation du wizard, calculer `pool_size(muscle, equipment)` vs `slots_demandés(split, days)` et afficher un avertissement d'équipement (« Avec votre matériel, certaines séances répéteront les mêmes exercices — envisagez X ou un autre split »).

### Thème 6 — Sécurité et niveau : prescriptions inadaptées · **P48, P50, P39**
- **P50** : `hip thrust 5×3-5` + `RDL 5×3-5` + `squat 5×3-5` + `deadlift 5×3-5` dans la **même séance**, 2× par semaine. Quatre efforts maximaux de charnière de hanche et de colonne enchaînés — c'est la configuration la plus risquée produite par tout le groupe C. Et le wizard **ne bloque pas** `glutes-focus` en force alors qu'il **bloque** `ppl` en force (`Screen:642`).
- **P48** : `bw-nordic-curl` en 4×8-12 chez un **débutant** — exercice qu'une majorité de débutants ne peut pas exécuter une seule fois proprement.
- **P39 / P50** : `seed-good-morning` (pop 1) figure dans le top-3 de slots ischios en force, uniquement grâce à la priorité barre — 1/3 de chance de good morning en 5×3-5.
- **Recommandation** : introduire un champ `technicalDifficulty` dans le seed et l'utiliser comme filtre pour `level === 'beginner'` (exclure nordic curl, good morning, front squat…) ; plafonner les slots composés de charnière de hanche à 2 par séance en `goal === 'strength'`.

### Thème 7 — Déséquilibres de volume propres aux splits explicites
- **P44 (Arnold 4j)** : 25 slots haut du corps / 6 slots jambes, jambes 1×/sem.
- **P46, P47 (Brosplit 5j)** : 31 slots haut du corps / 6 slots jambes, jambes 1×/sem. Bras 15+15 séries/sem.
- **P45 (Arnold 45 min)** : biceps 2 slots / triceps 1 slot — l'ordre canonique de `shoulders-arms` (`:296-300` : bi, tri, bi, tri, avant-bras) fait que toute coupe paire favorise les biceps.
- **P39, P50 (force 60 min)** : 0 isolation sur toute la semaine.
- **Recommandation** : pour `arnold` case 4 (`:463`) et `brosplit` case 5 (`:474`), remplacer la séance `upper` finale par une 2ᵉ séance jambes (`lower-hip`) — elle rétablirait la fréquence 2× sur le bas du corps sans rien retirer au haut du corps (déjà à 2× via les templates existants). Et intercaler l'ordre de `shoulders-arms` en bi/tri/bi/tri → bi/tri/bi/tri reste correct, mais mettre les 2 premiers slots bras en tête de liste après le compound épaules.

## C. Incohérences wizard ↔ générateur

### INC-1 — `glutes-focus` échappe totalement au filtre d'incompatibilité · **P48, P49, P50, P51**
Le bouton est rendu hors de `OPTIONS`, dans le bloc « Programmes spécialisés », avec `disabled: false, reason: null` **codés en dur** (`ProgramGeneratorScreen.tsx:673-681`). Il ne traverse jamais `incompatibleReason`.
- Conséquence directe : **P50** (`glutes-focus` + `strength`) est autorisé alors que **P58** (`ppl` + `strength`) est bloqué avec le message « Force préfère Full Body ou Upper/Lower » (`Screen:642`) — alors que `glutes-focus` en force produit un programme objectivement plus risqué (4 charnières maximales par séance, 0 isolation).
- **P48** (`glutes-focus` + `beginner`) est autorisé alors qu'`arnold` + `beginner` est bloqué (`Screen:636`) — et le programme produit contient un nordic curl.
- **Recommandation** : faire passer `glutes-focus` par `incompatibleReason` avec au minimum une entrée `case 'glutes-focus': if (goal === 'strength') return 'Programme de volume — Force préfère Full Body ou Upper/Lower'`.

### INC-2 — `upper-lower` et `fullbody` sans aucun garde-fou · **P41**
`incompatibleReason` ne traite que `brosplit`, `arnold` et `ppl` ; tout le reste tombe dans `default: return null` (`Screen:645-646`).
- **P41** : un **débutant** choisit `upper-lower` à 4j en fat_loss ; l'auto lui aurait donné fullbody×4 (`:565`), nettement plus adapté. Aucun avertissement.
- **Recommandation** : ajouter `case 'upper-lower': if (days !== null && days < 2) …` et, en information non bloquante, une note « L'auto recommanderait Full Body pour ton niveau ».

### INC-3 — Les branches `pref` ignorent `goal` et `level` · **P41, P43, P45, P47, P50**
Toutes les branches explicites de `selectSplit` (`:440-496`) ne lisent que `daysPerWeek`. `isMass` et `level` ne sont calculés que pour le bloc auto (`:435`, `:547-576`).
- Conséquence : le même split est produit pour un débutant et un confirmé, pour de l'hypertrophie et de la force. C'est le comportement voulu (« choix explicite = choix respecté »), mais il n'est **pas signalé** à l'utilisateur, et le filtre wizard ne rattrape que 3 splits sur 6.
- **Recommandation** : afficher dans le récapitulatif final du wizard une ligne « Structure choisie : X — le coach aurait recommandé Y » quand `selectSplit({...params, splitPreference: undefined})` diffère du split explicite.

### INC-4 — Aucun warning d'équipement pour les templates incompatibles · **P41, P45, P47, P49, P50**
Les `generatorWarnings` (`:970-1007`, `:1063-1157`) ne couvrent que le cas `pickExercise === null` sur un slot composé. Or, dans les 5 profils ci-dessus, **aucun slot n'est vide** : ils sont remplis par des exercices détournés (BUG-C3) ou par des composés en place d'isolations (BUG-C4). Le tableau des warnings reste donc vide alors que le programme est structurellement dégradé.
- **Recommandation** : étendre la détection aux deux cas — `primaryMuscle ≠ slot.muscles[0]` sur compound, et `category === 'compound'` retenu sur un slot `compound: false`.
