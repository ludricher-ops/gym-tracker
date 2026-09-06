# Audit `generateProgramDraft` — 68 profils wizard (v4)

## Rôle

Tu es coach sportif certifié avec 15 ans d'expérience en programmation de l'entraînement.
Tu dois à la fois **simuler l'exécution du code** et **évaluer la qualité sportive** des programmes produits.

---

## Règles strictes — à lire avant tout

1. **Pas de sous-agents.** Traite chaque profil toi-même, dans l'ordre, sans déléguer.
2. **Pas de saut.** Tous les profils P01 à P30 doivent être traités. Aucun "voir ci-dessus" ou "idem P0X".
3. **Pas de référence fantôme.** N'invente pas de résultats d'agents non lancés.
4. **Lire les fichiers complets.**
   - Lis `src/utils/programGenerator.ts` en entier avant de commencer.
   - Lis `src/data/exercises-seed.json` en entier (toutes les lignes) avant de traiter les profils qui exigent des exercices concrets (P21–P26). Si le fichier dépasse ta fenêtre, lis-le en plusieurs passes et concatène.
5. **Ne décris pas l'algorithme — exécute-le.** Montre les outputs, pas les principes.

---

## Méthode obligatoire — simulation pas à pas

Pour chaque profil, trace dans l'ordre :

**Étape 1** — `workoutTypeFromFocus(focusMuscles)`
→ valeur retournée (string ou null), avec les flags intermédiaires :
`hasLower`, `hasPush`, `hasPull`, `hasArms`, `hasUpper`, `hasCore`

**Étape 2** — `selectSplit(params)`
→ liste exacte des types de sessions : ex. `['push','pull','legs']`

**Étape 3** — Pour chaque session :
- `adjustedSlotCount(base, duration)` → nombre de slots retenus
- Slots après `reorderSlotsByFocus` → liste ordonnée des slots (noms de groupes musculaires)

**Étape 4** — Pour chaque slot (profils P21–P26 uniquement, après lecture complète du seed) :
→ Top 3 exercices candidats filtrés (équipement ∩ muscle(s) du slot, triés par popularité)
→ Exercice retenu (`candidates[0]` si beginner, random top-3 si intermediate/advanced)

**Étape 5** — Séries × répétitions appliquées selon goal + level
→ format par slot : `sets × reps` (ex. `4×8`)

**Étape 6** — Programme final sous forme de tableau :

| Session | Slot | Exercice retenu | Séries×Reps |
|---------|------|-----------------|-------------|
| Push A  | chest_compound | Bench press BB | 4×8 |
| …       | …    | …               | …           |

---

## Évaluation coach — critères par profil

Après la simulation, évalue en tant que coach :

### Équilibre musculaire
- Ratio push/pull respecté (agoniste/antagoniste) ?
- Équilibre haut/bas du corps sur la semaine ?
- Groupes musculaires absents alors qu'ils devraient être couverts ?
- Sur-représentation d'un groupe au détriment d'un autre ?

### Cohérence avec l'objectif
- Séries × répétitions adaptées ? (force : 1–5 reps · hypertrophie : 6–12 · endurance : 15+)
- Volume hebdomadaire cohérent pour le niveau ? (ni trop faible, ni excessif)
- Rapport cardio/force adapté à l'objectif `fat_loss` ?

### Adéquation durée / contenu
- Le programme tient-il dans la durée indiquée ? (estimer ~4 min par série incluant repos)
- Le nombre d'exercices est-il réaliste pour le créneau ?

### Qualité de l'équipement
- Tous les exercices utilisent uniquement l'équipement disponible ?
- L'équipement est-il exploité de façon optimale ?
  (ex. ne pas choisir dumbbell bench quand barbell est disponible pour un programme `strength`)

### Variété inter-sessions ⚠️ (critère obligatoire)
- Les séances du même type (ex. fullbody A, B, C) ont-elles une structure **différenciée** ou sont-elles
  **structurellement identiques** (mêmes slots, même ordre musculaire, seuls les exercices changent) ?
- Le pool d'exercices par slot est-il suffisamment large pour permettre la rotation sur N séances ?
  (Si pool < N séances du même type → certaines séances auront des répétitions inévitables)
- Verdict : "Variété structurelle" (slots différents) ou "Variété d'exercices seulement" ou "Répétition complète".

### Couverture isolation par groupe musculaire ⚠️ (critère obligatoire)
- Lister les groupes musculaires **sans slot isolation dédié** dans ce type de séance.
  (ex. fullbody : pas de slot chest_isol, quads_isol, calves)
- Pour chaque groupe absent en isolation : est-ce acceptable compte tenu du split et de l'objectif ?
- Verdict : "Couverture isolation complète" / "Lacunes acceptables" / "Lacunes problématiques".

---

## Équipements abrégés

- `BW` = `['bodyweight']`
- `DB` = `['dumbbell']`
- `BB+DB` = `['barbell','dumbbell']`
- `BB+DB+CABLE` = `['barbell','dumbbell','cable']`
- `MACH+CABLE` = `['machine','cable']`
- `BAND+BW` = `['band','bodyweight']`
- `FULL` = `['barbell','dumbbell','cable','machine','bodyweight']`

**Nouveaux équipements ajoutés en commit `5941987` :**

- `BW+BAR` = `['bodyweight','pullup_bar']` — preset "Extérieur / Calisthenics"
- `HOME` = `['dumbbell','kettlebell','band','bodyweight']` — preset "Home gym"
- `KB` = `['kettlebell']`
- `BW+BAR+BAND` = `['bodyweight','pullup_bar','band']`
- `CARDIO` = `['cardio_machine']`
- `FULL+CARDIO` = `['barbell','dumbbell','cable','machine','bodyweight','pullup_bar','cardio_machine']` — preset "Salle" complet avec cardio

**Exercices re-tagués en `pullup_bar` (étaient `bodyweight`) :**
`seed-pullup` (back_width), `bw-chinup` (biceps), `seed-dips` (chest_lower), `seed-triceps-dips` (triceps), `bw-inverted-row` (back_thickness), `bw-nordic-curl` (hamstrings), `seed-hanging-leg-raise` (core).

**Conséquence directe :** en `BW` pur (sans `pullup_bar`), les slots `back_width`, `back_thickness`, `biceps`, `chest_lower` (Dips), `triceps` (Dips triceps) et `hamstrings` (Nordic curl) sont **sans candidats composés**. Anticiper des slots vides et des warnings BUG-5.

`level:'beginner'` sauf mention contraire → `pickExercise` retourne toujours `candidates[0]` (déterministe).

---

## GROUPE A — Split pur (selectSplit sans focusMuscles) — 10 profils

### P01 — Référence fullbody beginner
```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:FULL, level:'beginner' }
```
**Assertions techniques :**
- Split = `['fullbody','fullbody']`
- Chaque workout : 1 warmup + 9 slots + 1 core = **11 exercices**
- Pas de doublon intra-workout
- Premier exercice = warmup (`isWarmupExercise: true`)
- Dernier exercice = core (`primaryMuscle: 'core'`)

**Cas limites coach :** programme 2j — contenu raisonnable ou surchargé ?

---

### P02 — Fullbody beginner force 3j
```
{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner' }
```
**Assertions techniques :**
- Split = `['fullbody','fullbody','fullbody']`
- Beginner reste fullbody en strength — PPL nécessite intermediate+
- 11 exercices par workout (9 slots + warmup + core)

---

### P03 — PPL strength intermediate 3j
```
{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'intermediate' }
```
**Assertions techniques :**
- Split = `['push','pull','legs']`
- Workout push : contient un exercice chest compound ET un exercice shoulders
- Workout pull : contient dos + biceps
- Workout legs : contient quads + hamstrings/glutes

**Coach :** ratio push/pull équilibré sur la semaine ? sets×reps cohérents avec `strength` ?

---

### P04 — PPL hypertrophie intermediate 3j
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'intermediate' }
```
**Assertions techniques :**
- Split = `['push','pull','legs']`
- Même split que P03 : la branche PPL ne dépend pas de l'objectif, seulement du niveau

**Coach :** reps dans la zone hypertrophie (6–12) ? Volume suffisant par groupe musculaire ?

---

### P05 — Endurance intermediate 3j → PAS PPL
```
{ goal:'endurance', daysPerWeek:3, sessionDuration:60, equipment:BW, level:'intermediate' }
```
**Assertions techniques :**
- Split = `['push','pull','fullbody']` — **push/pull/fullbody (PPF)**
- **CRITIQUE** : `endurance` (isMass=false) + intermediate + 3j → PPF, **pas PPL ni fullbody×3**
- Vérifier la branche `!isMass && level !== 'beginner'` dans `selectSplit` case 3
- Noms : "Push — Poussée", "Pull — Tirage", "Full Body" (pas de suffixe A/B : une occurrence de chaque)
- Pas de doublon intra-workout (chaque workout unique du split)

> **⚠️ Post-commit `5941987`** : `seed-pullup` et `bw-inverted-row` sont maintenant `pullup_bar`, pas `bodyweight`.
> En `BW` pur, le jour **Pull** n'a plus aucun exercice `back_width` compound ni `back_thickness` compound.
> Ces slots seront vides → vérifier le fallback et l'émission du warning BUG-5.

**Coach :** reps en zone endurance (15+) ? BW-only pur : les slots dos sont maintenant vides (post-fix EQUIP-1/2) — le programme pull est-il encore viable ?

---

### P06 — Fat loss intermediate 3j → PAS PPL
```
{ goal:'fat_loss', daysPerWeek:3, sessionDuration:60, equipment:BW, level:'intermediate' }
```
**Assertions techniques :**
- Split = `['push','pull','fullbody']` — **push/pull/fullbody (PPF)**
- Même règle que P05 : fat_loss (isMass=false) + intermediate → PPF
- Noms : "Push — Poussée", "Pull — Tirage", "Full Body"

> **⚠️ Post-commit `5941987`** : même impact que P05 — Pull day sans dos compound en BW pur.

**Coach :** rapport cardio/force adapté à fat_loss ? Slots dos vides en BW-only (pullup_bar séparé) — impact sur la qualité du programme ?

---

### P07 — Upper/Lower beginner 4j
```
{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'beginner' }
```
**Assertions techniques :**
- Split public = `['upper','lower','upper','lower']` (types internes : upper-push / lower-quad / upper-pull / lower-hip)
- Noms : "Upper — Haut du corps A", "Lower — Bas du corps A", "Upper — Haut du corps B", "Lower — Bas du corps B"
- Upper A (upper-push) : 8 slots → 10 exercices — chest compound en tête, puis back compound, puis OHP, puis isolations
- Upper B (upper-pull) : 8 slots → 10 exercices — back compound en tête, puis chest compound, puis isolations
- Lower A (lower-quad) : 6 slots → 8 exercices — quads/glutes compound en tête (squat/leg press)
- Lower B (lower-hip)  : 6 slots → 8 exercices — glutes/hamstrings compound en tête (hip hinge/deadlift)
- Chaque variant lower inclut un slot calves isolation

**Coach :** équilibre haut/bas sur la semaine (2 upper + 2 lower) ? Récupération suffisante entre sessions upper ?

---

### P08 — 5j intermediate PPL+UL
```
{ goal:'strength', daysPerWeek:5, sessionDuration:60, equipment:FULL, level:'intermediate' }
```
**Assertions techniques :**
- Split = `['push','pull','legs','upper','lower']`
- 5 workouts distincts

**Coach :** groupes musculaires ont-ils assez de récupération sur 5j ? Pas de sur-entraînement ?

---

### P09 — 5j beginner → fullbody×5
```
{ goal:'hypertrophy', daysPerWeek:5, sessionDuration:60, equipment:FULL, level:'beginner' }
```
**Assertions techniques :**
- Split public = `['upper','lower','upper','lower','fullbody']`
- Types internes : upper-push / lower-quad / upper-pull / lower-hip / fullbody-quad
- **CRITIQUE** : beginner + isMass (hypertrophy) + 5j → upper/lower A/B + fullbody (**pas fullbody×5**)
- Noms : "Upper — Haut du corps A", "Lower — Bas du corps A", "Upper — Haut du corps B", "Lower — Bas du corps B", "Full Body"
- Note : fullbody×5 (public) seulement pour beginner + !isMass (endurance/fat_loss) à 5j
- Exercices par workout : upper=10, lower=8, upper=10, lower=8, fullbody=11

**Coach :** upper/lower A/B + fullbody pour un débutant en hypertrophie 5j — le volume est-il adapté ?

---

### P10 — 2j intermediate → toujours fullbody
```
{ goal:'strength', daysPerWeek:2, sessionDuration:60, equipment:BB+DB, level:'intermediate' }
```
**Assertions techniques :**
- Split = `['fullbody','fullbody']`
- **CRITIQUE** : 2j = fullbody toujours, peu importe niveau/objectif
- Priorité barbell sur dumbbell pour les compound (scoreEquip strength)

**Coach :** programme 2j — contenu raisonnable ? Barbell effectivement privilégié pour les gros mouvements ?

---

## GROUPE B — focusMuscles (override du split) — 10 profils

### P11 — chest seul → push
```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:DB, level:'beginner',
  focusMuscles:['chest'] }
```
**Assertions techniques :**
- `workoutTypeFromFocus(['chest'])` : `hasPush=true, hasPull=false, hasLower=false` → `'push'`
- Split = `['push','push']`
- Exercices chest en tête (reorderSlotsByFocus)

---

### P12 — back seul → pull
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:BB+DB+CABLE, level:'beginner',
  focusMuscles:['back'] }
```
**Assertions techniques :**
- `workoutTypeFromFocus(['back'])` : `hasPull=true` → `'pull'`
- Split = `['pull','pull','pull']`

---

### P13 — legs seul → lower
```
{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:BW, level:'beginner',
  focusMuscles:['legs'] }
```
**Assertions techniques :**
- `workoutTypeFromFocus(['legs'])` : `hasLower=true, hasUpper=false` → `'lower'`
- Split public = `['lower','lower','lower','lower']` (types internes alternés : lower-quad / lower-hip / lower-quad / lower-hip)
- Noms : "Lower — Bas du corps A", "Lower — Bas du corps B", "Lower — Bas du corps C", "Lower — Bas du corps D"
- Lower-quad (A/C) : quads/glutes compound en tête — squat, leg press, puis hamstrings, glutes, calves en isolation
- Lower-hip  (B/D) : glutes/hamstrings compound en tête — hip hinge, RDL, puis quads, calves en isolation
- Vérifier que les 4 sessions ont une structure **différenciée** (pas seulement des exercices différents)

**Cas limites coach :** bodyweight only + lower — quels exercices de jambes sont disponibles dans le seed ?

---

### P14 — **[RÉGRESSION BUG #3]** core seul → fullbody
```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:BW, level:'beginner',
  focusMuscles:['core'] }
```
**Assertions CRITIQUES :**
- `workoutTypeFromFocus(['core'])` doit retourner `null`
  (flags : `hasLower=false, hasUpper=false, hasCore=true` → aucune branche ne retourne lower)
- Split = `['fullbody','fullbody']` — **JAMAIS `['lower','lower']`**
- Le core apparaît en queue via `corePool` (comportement normal)

---

### P15 — **[RÉGRESSION BUG #3 / 4j]** core seul → split par défaut upper/lower
```
{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'beginner',
  focusMuscles:['core'] }
```
**Assertions CRITIQUES :**
- `workoutTypeFromFocus(['core'])` = `null` → split 4j beginner par défaut = upper/lower
- Split = `['upper','lower','upper','lower']` — **JAMAIS `['lower','lower','lower','lower']`**

---

### P16 — shoulders seul → push
```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:DB, level:'beginner',
  focusMuscles:['shoulders'] }
```
**Assertions techniques :**
- `hasPush=true` (shoulders ∈ push) → retourne `'push'`
- Split = `['push','push']`

---

### P17 — chest+back → upper
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner',
  focusMuscles:['chest','back'] }
```
**Assertions techniques :**
- `hasPush=true, hasPull=true, hasLower=false` → retourne `'upper'`
- Split = `['upper','upper','upper']`

**Coach :** slots réordonnés — chest et back bien en tête ? Ratio push/pull sur la séance ?

---

### P18 — **legs+core → lower** (core ne neutralise pas legs)
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:BW, level:'beginner',
  focusMuscles:['legs','core'] }
```
**Assertions CRITIQUES :**
- `hasLower=true, hasUpper=false` → retourne `'lower'`
  (core seul = null, mais ici legs présent → lower)
- Split = `['lower','lower','lower']`

---

### P19 — chest+back+legs → null → split défaut
```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:FULL, level:'beginner',
  focusMuscles:['chest','back','legs'] }
```
**Assertions techniques :**
- `hasLower=true, hasUpper=true` → ambiguïté → retourne `null`
- Split par défaut = `['fullbody','fullbody']`

---

### P20 — shoulders+arms → push
```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:DB, level:'beginner',
  focusMuscles:['shoulders','arms'] }
```
**Assertions techniques :**
- `hasPush=true (shoulders), hasPull=false, hasLower=false` → retourne `'push'`
- Split = `['push','push']`
- NB : arms seul → `hasArms=true, hasUpper=true, hasPush=false` → `'upper'`
  mais shoulders+arms → hasPush=true → push prioritaire

---

## GROUPE C — Equipment × slot — 6 profils

> **Pour ces profils :** lire `exercises-seed.json` en entier. Citer le `id` et l'équipement exact de l'exercice retenu pour chaque slot. Ne pas inventer d'exercices non présents dans le seed.

### P21 — Bodyweight only
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:BW, level:'beginner' }
```
**Assertions techniques :**
- Vérifier dans le code que `filterByEquipment` exclut tout exercice non-BW
- Aucun exercice avec `equipment` ≠ `'bodyweight'` dans la sortie
- `autoProgress: false`, `progressStepKg: 0`

> **⚠️ Post-commit `5941987`** : `seed-pullup`, `bw-chinup`, `seed-dips`, `seed-triceps-dips`,
> `bw-inverted-row`, `bw-nordic-curl`, `seed-hanging-leg-raise` sont maintenant `pullup_bar`.
> En BW pur, les slots `back_width`, `back_thickness`, `biceps`, `chest_lower` compound, `triceps` compound
> et `hamstrings` compound (nordic curl) n'ont **aucun candidat**. Lister précisément quels slots sont vides
> et quels exercices `bodyweight` restent pour remplir (fallback isolation si aucun compound).

**Coach :** BW-only post-fix — le dos est-il toujours couvert ? (`seed-pullup` étant maintenant `pullup_bar`, la réponse est non.) Programme viable ou trop tronqué ?

---

### P22 — **Haltères seuls → slot dos compound**
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:DB, level:'beginner' }
```
**Assertions CRITIQUES :**
- Dans le code : le slot dos compound liste-t-il les muscles `['back_width','back_thickness','back']`
  ou seulement `['back_width']` ? (BUG#4 : si uniquement back_width, row-db non qualifié → slot vide)
- Identifier dans le seed l'exercice id retenu pour le slot dos en DB-only
- Vérifier que ce slot n'est pas null/vide

---

### P23 — BB+DB strength intermediate → priorité barbell
```
{ goal:'strength', daysPerWeek:4, sessionDuration:60, equipment:BB+DB, level:'intermediate' }
```
**Assertions techniques :**
- `scoreEquip(strength, barbell)` < `scoreEquip(strength, dumbbell)` → barbell prioritaire
- Slot chest compound : identifier l'exercice retenu (doit être barbell bench, pas DB bench)
- Slot squat : doit être barbell squat, pas goblet squat

**Coach :** autoProgress et progressStepKg cohérents pour un programme force avec barbell ?

---

### P24 — Machine+Cable only
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:MACH+CABLE, level:'beginner' }
```
**Assertions techniques :**
- Aucun exercice `equipment: 'barbell'` ou `equipment: 'dumbbell'` dans la sortie
- Identifier dans le seed l'exercice pour : slot dos compound (lat pulldown ou machine row ?) et slot chest compound (machine chest press ?)

---

### P25 — Band+Bodyweight
```
{ goal:'fat_loss', daysPerWeek:2, sessionDuration:60, equipment:BAND+BW, level:'beginner' }
```
**Assertions techniques :**
- Aucun exercice nécessitant haltère/barre/câble/machine
- Identifier dans le seed quels exercices band sont disponibles par groupe musculaire

> **⚠️ Post-commit `5941987`** : `seed-pullup`, `bw-inverted-row` etc. sont maintenant `pullup_bar` → exclus de BAND+BW.
> Même impact que P21 pour les slots dos. En revanche, `seed-band-pull-apart` (élastique) reste disponible
> pour `shoulders_rear` mais est `isWarmupExercise:true` → exclu d'`available` (SEED-2 toujours ouvert).

**Coach :** fat_loss avec Band+BW — slots dos vides (back_width, back_thickness) post-fix, le programme est-il encore équilibré ?

---

### P26 — Advanced strength 3j → PPL + random top-3
```
{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'advanced' }
```
**Assertions techniques :**
- Split = `['push','pull','legs']`
- Dans le code : `level:'advanced'` → `pickExercise` utilise `candidates.slice(0,3)` avec `Math.random`
  (vérifier la branche dans le code, pas le résultat aléatoire)
- Lister les 3 candidats du top pour le slot chest compound (ce sont les 3 possibles)

---

## GROUPE D — Durée × slots — 4 profils

### P27 — 20 minutes → 4 slots → 6 exercices
```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:20, equipment:FULL, level:'beginner' }
```
**Assertions techniques :**
- `adjustedSlotCount(9, 20)` = `max(2, floor(9×0.5))` = `max(2,4)` = **4 slots**
- Total exercices par workout = 4 + 1 warmup + 1 core = **6**

**Coach :** 20min / 6 exercices à ~4 min/série — le timing tient-il ? Warmup + core compris ?

---

### P28 — 45 minutes → 6 slots → 8 exercices
```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:45, equipment:FULL, level:'beginner' }
```
**Assertions techniques :**
- `adjustedSlotCount(9, 45)` = `max(3, floor(9×0.75))` = `max(3,6)` = **6 slots**
- Total = 6 + 1 warmup + 1 core = **8 exercices**

**Coach :** 45min / 8 exercices — timing cohérent ?

---

### P29 — 90 minutes → même que 60 min (cap à 8)
```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:90, equipment:FULL, level:'beginner' }
```
**Assertions CRITIQUES :**
- `adjustedSlotCount(9, 90)` = `min(9+2, 8)` = `min(11,8)` = **8 slots** (cap à 8)
- Total = 8 + 1 warmup + 1 core = **10 exercices**
- Note : sur un fullbody-quad (base=9 slots), la session 90min est capée à 8 slots — le slot le moins prioritaire (le dernier) est élidé
- Expliquer pourquoi le cap à 8 existe et dans quel cas il serait atteint sans cap

**Coach :** 90min pour seulement 10 exercices — le reste du temps est absorbé par les repos longs (force) ?

---

### P30 — Duration 20min sur PPL (pas juste fullbody)
```
{ goal:'strength', daysPerWeek:3, sessionDuration:20, equipment:FULL, level:'intermediate' }
```
**Assertions techniques :**
- Split = `['push','pull','legs']`
- `adjustedSlotCount(base_push, 20)` : calculer le nombre exact de slots pour le split push
- Vérifier que la réduction de durée s'applique correctement sur PPL (pas seulement fullbody)

**Coach :** push en 20min avec des sets×reps force — réaliste ? Combien de mouvements possibles ?

---

## Récapitulatif des assertions critiques (régressions à ne jamais casser)

| Code | Assertion | Profils |
|------|-----------|---------|
| BUG3 | `focusMuscles:['core']` → null → jamais 'lower' | P14, P15 |
| BUG4 | DB-only → slot dos non-vide (back_thickness dans le slot) | P22 |
| SLOTS | Fullbody base = **9 slots** (pas 8) — fullbody-quad et fullbody-hip ont chacun 9 slots | P01, P27–P29 |
| PPF | endurance/fat_loss intermediate 3j → **push/pull/fullbody** (PPF) — pas PPL ni fullbody×3 | P05, P06 |
| 2J | 2j = fullbody toujours | P10 |
| BEG5J | isMass+beginner+5j = ['upper','lower','upper','lower','fullbody'] — fullbody×5 seulement si !isMass | P09 |
| LEGS+CORE | legs+core → lower (core ne neutralise pas) | P18 |
| EQUIP | Aucun exercice hors équipement dispo | P21–P25 |

---

## Format de réponse attendu

> **RÈGLE ABSOLUE — à ne jamais omettre :**
> La table des exercices est **obligatoire pour chaque profil, pour chaque type de séance du split**.
> Sans cette table, le coach (15 ans d'expérience) ne peut pas évaluer l'équilibre musculaire,
> la cohérence des specs, ni la qualité réelle du programme généré.
> Il ne suffit pas d'écrire "3×15-20 sur tous les exercices" — il faut nommer chaque exercice.

Pour chaque profil, structure ta réponse en 3 blocs :

```
### P01 — Référence fullbody beginner

**Simulation :**
- workoutTypeFromFocus(undefined) → null
- selectSplit → ['fullbody','fullbody']
- adjustedSlotCount(8, 60) → 8

**Table des exercices — une table par type de séance du split :**

Full Body A (usedGlobally vide) :
| # | Slot (muscles cibles) | Cat | Top-3 candidats (pop desc) | Exercice retenu | Séries×Reps ajustés |
|---|----------------------|-----|---------------------------|-----------------|---------------------|
| 0 | warmup               | —   | —                         | seed-xxx        | 2×10                |
| 1 | quads/glutes         | cmp | squat-barbell(8), leg-press(3), bw-squat(3) | squat-barbell | 4×8-12 |
| … | …                    | …   | …                         | …               | …                   |
| N | core                 | —   | plank(3), crunch(2), …    | plank           | 3×15                |

Full Body B (usedGlobally = exercices de A) :
| … | (idem avec variation — noter quels exercices remplacent ceux de A) | … |

Full Body C (si applicable) :
| … | … | … |

> Pour beginner : retenir candidats[0] (pop max).
> Pour intermediate/advanced : noter le top-3 et indiquer la sélection la plus probable.
> Si un slot est null (aucun candidat) : écrire "— slot vide —" dans la colonne exercice.

**Assertions : [PASS/FAIL]**
- Split ['fullbody','fullbody'] : PASS (ligne XX)
- 10 exercices : PASS
- …

**Coach :**
- Équilibre musculaire (groupes couverts / manquants) : …
- Cohérence objectif (specs séries×reps vs goal) : …
- Durée/contenu (timing réaliste ?) : …
- Équipement (aucun exercice hors contrainte ?) : …
- Progression sessions A→B→C (variation suffisante ?) : …
- Verdict global : ✅ Bon programme / ⚠️ Problème mineur / ❌ Problème sérieux
```

Indique le numéro de ligne dans `programGenerator.ts` pour chaque assertion de code.

---

## Récapitulatif de l'audit complet (à produire à la fin)

> **RÈGLE ABSOLUE** : à la fin de l'audit (après P01–P40), produire **deux** blocs de synthèse,
> dans cet ordre :

### Bloc 1 — Tableau de synthèse

Un tableau avec **une ligne par profil** et **quatre colonnes** :

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|--------|----------------------|---------|-------------------|
| P01 | Split fullbody×3 beginner hypertrophy | ✅ PASS | — |
| P02 | … | ⚠️ PASS | Row barbell en 3×15-20 : risque lombaire ; OHP barre en haute rep : charge technique élevée |
| … | … | … | … |

Règles pour la colonne **Réserves coach ⚠️** :
- **Obligatoire** : y reporter toutes les réserves soulevées dans le bloc Coach de chaque profil.
- Si le verdict est ✅ sans réserve : écrire `—`.
- Si plusieurs réserves : les séparer par ` ; `.
- Ne pas se limiter aux bugs techniques — inclure aussi les problèmes pédagogiques,
  de sécurité (risque technique), de volume excessif ou insuffisant, de pertinence pour
  le niveau ou l'objectif.

### Bloc 2 — Synthèse des problèmes ouverts

Deux sous-sections :

**Bugs / anomalies logicielles** (assertions FAIL) :
- Lister chaque FAIL avec : profil, assertion, impact concret, correction recommandée.

**Réserves coach cumulées** (⚠️ de tous les profils) :
- Regrouper les réserves par thème (ex. : exercices à risque en haute rep, volume débutant,
  slots vides, diversité manquante) pour identifier les patterns récurrents du générateur.
- Pour chaque thème : citer les profils concernés et formuler une recommandation d'amélioration
  du générateur ou du seed.

---

## Groupe E — Périodisation `buildPhases` (P31–P40)

Vérifie la formule `buildPhases` (ligne 431), les modificateurs `PHASE_CONFIG_BY_GOAL` (ligne 396),
`phaseAtLeast` (ligne 427), et la cohérence wizard → logique.

---

### P31 — buildPhases(7) → pas de périodisation

```
buildPhases(7)
```
**Assertions CRITIQUES :**
- totalWeeks=7 < 8 → `return undefined` (ligne 432) : PASS/FAIL
- Wizard : `phaseLabel(7)` → `''` (retour d'`undefined`) : PASS/FAIL
- `generateProgramDraft` avec `totalWeeks:7` → `phases: undefined` dans le DraftProgram : PASS/FAIL

---

### P32 — buildPhases(8, 'strength')

```
buildPhases(8, 'strength')
```
**Calcul attendu :**
- adapt=2, deload=1 (8<12), intensive=2 (8≤9), progress=max(1,8-2-2-1)=**3**
- Total: 2+3+2+1=**8** ✓
- Semaines : [1-2 Adaptation, 3-5 Progression, 6-7 Intensification, 8 Décharge]

**Assertions CRITIQUES :**
- 4 phases retournées : PASS/FAIL
- adaptation.weekStart=1, weekEnd=2 : PASS/FAIL
- progression.weekStart=3, weekEnd=5 : PASS/FAIL
- intensification.weekStart=6, weekEnd=7 : PASS/FAIL
- deload.weekStart=8, weekEnd=8 : PASS/FAIL
- Modificateurs strength adaptation : setsModifier=-1, repsOffset=+3 : PASS/FAIL
- Modificateurs strength intensification : setsModifier=0, repsOffset=-3 : PASS/FAIL
- Modificateurs strength deload : setsModifier=-2, repsOffset=+4 : PASS/FAIL

---

### P33 — buildPhases(9, 'endurance')

```
buildPhases(9, 'endurance')
```
**Calcul attendu :**
- adapt=2, deload=1 (9<12), intensive=2 (9≤9), progress=max(1,9-2-2-1)=**4**
- Total: 2+4+2+1=**9** ✓
- Semaines : [1-2 Adaptation, 3-6 Progression, 7-8 Intensification, 9 Décharge]

**Assertions :**
- 4 phases, somme=9 : PASS/FAIL
- adaptation.weekEnd=2, progression.weekEnd=6, intensification.weekEnd=8 : PASS/FAIL
- endurance adaptation : setsModifier=-1, repsOffset=-2 : PASS/FAIL
- endurance intensification : setsModifier=+1, repsOffset=+3 : PASS/FAIL

---

### P34 — buildPhases(10, 'hypertrophy')

```
buildPhases(10, 'hypertrophy')
```
**Calcul attendu :**
- adapt=2, deload=1 (10<12), intensive=3 (10>9 et 10<16), progress=max(1,10-2-3-1)=**4**
- Total: 2+4+3+1=**10** ✓
- Semaines : [1-2 Adaptation, 3-6 Progression, 7-9 Intensification, 10 Décharge]

**Assertions :**
- intensive=3 (pas 2, car 10>9) : PASS/FAIL
- progression.weekEnd=6, intensification.weekStart=7, weekEnd=9 : PASS/FAIL
- deload.weekStart=10, weekEnd=10 : PASS/FAIL
- hypertrophy intensification : setsModifier=+1, repsOffset=-2 : PASS/FAIL

---

### P35 — buildPhases(12, 'fat_loss')

```
buildPhases(12, 'fat_loss')
```
**Calcul attendu :**
- adapt=2, deload=2 (12≥12), intensive=3 (12>9 et 12<16), progress=max(1,12-2-3-2)=**5**
- Total: 2+5+3+2=**12** ✓
- Semaines : [1-2 Adaptation, 3-7 Progression, 8-10 Intensification, 11-12 Décharge]

**Assertions :**
- deload=2 (premier seuil ≥12) : PASS/FAIL
- progression.weekStart=3, weekEnd=7 (5 semaines) : PASS/FAIL
- deload.weekStart=11, weekEnd=12 : PASS/FAIL
- fat_loss adaptation : setsModifier=-1, repsOffset=0 : PASS/FAIL
- fat_loss deload : setsModifier=-1, repsOffset=0 : PASS/FAIL

---

### P36 — buildPhases(16, 'strength')

```
buildPhases(16, 'strength')
```
**Calcul attendu :**
- adapt=2, deload=2 (16≥12), intensive=4 (16≥16), progress=max(1,16-2-4-2)=**8**
- Total: 2+8+4+2=**16** ✓
- Semaines : [1-2 Adaptation, 3-10 Progression, 11-14 Intensification, 15-16 Décharge]

**Assertions :**
- intensive=4 (seuil ≥16) : PASS/FAIL
- progression : 8 semaines, weekStart=3, weekEnd=10 : PASS/FAIL
- intensification.weekStart=11, weekEnd=14 : PASS/FAIL
- deload.weekStart=15, weekEnd=16 : PASS/FAIL

---

### P37 — Specs finales ≥ 1 après modificateurs (tous goals × phases)

Vérifie que `baseSets + setsModifier ≥ 1` et `baseRepsMin + repsOffset ≥ 1`.
Base : `COMPOUND_SPEC` (ligne 58) et `ISOLATION_SPEC` (ligne 65).

| Goal | Type | Phase | Base sets | +modifier | = sets | Base repsMin | +offset | = reps | Valide |
|------|------|-------|-----------|-----------|--------|--------------|---------|--------|--------|
| strength | compound | adaptation | 5 | -1 | 4 | 3 | +3 | 6 | ✅ |
| **strength** | **compound** | **intensification** | **5** | **0** | **5** | **3** | **-3** | **0** | **❌ BUG** |
| strength | compound | deload | 5 | -2 | 3 | 3 | +4 | 7 | ✅ |
| strength | isolation | adaptation | 3 | -1 | 2 | 5 | +3 | 8 | ✅ |
| strength | isolation | intensification | 3 | 0 | 3 | 5 | -3 | 2 | ✅ |
| strength | isolation | deload | 3 | -2 | 1 | 5 | +4 | 9 | ✅ |
| hypertrophy | compound | adaptation | 4 | -1 | 3 | 8 | +2 | 10 | ✅ |
| hypertrophy | compound | intensification | 4 | +1 | 5 | 8 | -2 | 6 | ✅ |
| hypertrophy | compound | deload | 4 | -2 | 2 | 8 | 0 | 8 | ✅ |
| hypertrophy | isolation | adaptation | 3 | -1 | 2 | 10 | +2 | 12 | ✅ |
| hypertrophy | isolation | intensification | 3 | +1 | 4 | 10 | -2 | 8 | ✅ |
| hypertrophy | isolation | deload | 3 | -2 | 1 | 10 | 0 | 10 | ✅ |
| endurance | compound | adaptation | 3 | -1 | 2 | 15 | -2 | 13 | ✅ |
| endurance | compound | intensification | 3 | +1 | 4 | 15 | +3 | 18 | ✅ |
| endurance | compound | deload | 3 | -2 | 1 | 15 | 0 | 15 | ✅ |
| endurance | isolation | adaptation | 3 | -1 | 2 | 15 | -2 | 13 | ✅ |
| endurance | isolation | intensification | 3 | +1 | 4 | 15 | +3 | 18 | ✅ |
| endurance | isolation | deload | 3 | -2 | 1 | 15 | 0 | 15 | ✅ |
| fat_loss | compound | adaptation | 3 | -1 | 2 | 12 | 0 | 12 | ✅ |
| fat_loss | compound | intensification | 3 | 0 | 3 | 12 | +3 | 15 | ✅ |
| fat_loss | compound | deload | 3 | -1 | 2 | 12 | 0 | 12 | ✅ |
| fat_loss | isolation | adaptation | 3 | -1 | 2 | 12 | 0 | 12 | ✅ |
| fat_loss | isolation | intensification | 3 | 0 | 3 | 12 | +3 | 15 | ✅ |
| fat_loss | isolation | deload | 3 | -1 | 2 | 12 | 0 | 12 | ✅ |

**⚠️ BUG CRITIQUE** : `strength` + `compound` + `intensification` → repsMin = 3 + (−3) = **0 reps**.
Le code qui applique les modificateurs (hors `programGenerator.ts`) doit utiliser `max(1, repsMin + repsOffset)`.

---

### P38 — phaseAtLeast : logique d'ordre correct (ligne 427)

```typescript
phaseAtLeast(current, required) → PHASE_ORDER[current] >= PHASE_ORDER[required]
// PHASE_ORDER: adaptation=1, progression=2, intensification=3, deload=4
```

**Assertions :**
- `phaseAtLeast('adaptation', 'adaptation')` → 1≥1 → **true** : PASS/FAIL
- `phaseAtLeast('adaptation', 'progression')` → 1≥2 → **false** : PASS/FAIL
- `phaseAtLeast('progression', 'progression')` → 2≥2 → **true** : PASS/FAIL
- `phaseAtLeast('intensification', 'progression')` → 3≥2 → **true** : PASS/FAIL
- `phaseAtLeast('progression', 'intensification')` → 2≥3 → **false** : PASS/FAIL
- `phaseAtLeast('deload', 'intensification')` → 4≥3 → **true** : PASS/FAIL
- `phaseAtLeast('intensification', 'deload')` → 3≥4 → **false** : PASS/FAIL
- `phaseAtLeast('deload', 'deload')` → 4≥4 → **true** : PASS/FAIL

---

### P39 — Cohérence wizard : phaseLabel vs buildPhases

Le wizard (`ProgramGeneratorScreen.tsx`) appelle `buildPhases(weeks)` et formate :
`${dur} sem. ${names[ph.focus] ?? ph.focus}` joint par ` · `

**Test 7 semaines :**
- `buildPhases(7)` → undefined → `phaseLabel(7)` = `''` ✓

**Test 8 semaines :**
- adapt=2, prog=3, intens=2, deload=1
- `phaseLabel(8)` = `"2 sem. adaptation · 3 sem. progression · 2 sem. intensification · 1 sem. décharge"`

**Test 10 semaines :**
- adapt=2, prog=4, intens=3, deload=1
- `phaseLabel(10)` = `"2 sem. adaptation · 4 sem. progression · 3 sem. intensification · 1 sem. décharge"`

**Test 12 semaines :**
- adapt=2, prog=5, intens=3, deload=2
- `phaseLabel(12)` = `"2 sem. adaptation · 5 sem. progression · 3 sem. intensification · 2 sem. décharge"`

**Test 16 semaines :**
- adapt=2, prog=8, intens=4, deload=2
- `phaseLabel(16)` = `"2 sem. adaptation · 8 sem. progression · 4 sem. intensification · 2 sem. décharge"`

**Assertions :**
- Somme des durées = totalWeeks pour toutes valeurs ci-dessus : PASS/FAIL
- Noms 'décharge' (pas 'deload') et 'intensification' (pas 'intensive') : PASS/FAIL
- adapt toujours = 2 semaines dans la string, jamais 3 : PASS/FAIL

---

### P40 — fmtMod : strings GOAL_PHASES correspondent à PHASE_CONFIG_BY_GOAL

```typescript
fmtMod(sets, reps):
  sets!==0 → "${sets>0?'+':''}${sets} série${|sets|>1?'s':''}"
  reps!==0 → "${reps>0?'+':''}${reps} reps"
  les deux à 0 → "Specs inchangées"
```

**Valeurs attendues :**

| Goal | Phase | setsModifier | repsOffset | String attendue |
|------|-------|-------------|-----------|-----------------|
| strength | adaptation | -1 | +3 | "-1 série, +3 reps" |
| strength | intensification | 0 | -3 | "-3 reps" |
| strength | deload | -2 | +4 | "-2 séries, +4 reps" |
| hypertrophy | adaptation | -1 | +2 | "-1 série, +2 reps" |
| hypertrophy | intensification | +1 | -2 | "+1 série, -2 reps" |
| hypertrophy | deload | -2 | 0 | "-2 séries" |
| endurance | adaptation | -1 | -2 | "-1 série, -2 reps" |
| endurance | intensification | +1 | +3 | "+1 série, +3 reps" |
| endurance | deload | -2 | 0 | "-2 séries" |
| fat_loss | adaptation | -1 | 0 | "-1 série" |
| fat_loss | intensification | 0 | +3 | "+3 reps" |
| fat_loss | deload | -1 | 0 | "-1 série" |

**Assertions :**
- Toutes les strings correspondent aux numériques de `PHASE_CONFIG_BY_GOAL` (ligne 396) : PASS/FAIL
- La phase `progression` n'a pas de setsModifier/repsOffset → non affichée dans GOAL_PHASES : PASS/FAIL
- `fmtMod(0, 0)` → `"Specs inchangées"` (cas impossible mais cas limite à préserver) : PASS/FAIL

---

## Récapitulatif des assertions critiques Groupe E

| Code | Assertion | Profils |
|------|-----------|---------|
| BUILD1 | totalWeeks<8 → buildPhases()=undefined | P31 |
| BUILD2 | adapt=2 fixe pour tous totalWeeks≥8 | P32-P36 |
| BUILD3 | deload=1 si <12sem, =2 si ≥12sem | P32,P33,P35,P36 |
| BUILD4 | intensive=2 si ≤9sem, 3 si 10-15sem, 4 si ≥16sem | P32-P36 |
| BUILD5 | progress=max(1, total-adapt-intens-deload) | P32-P36 |
| BUG5 | strength compound intensification → repsMin=3+(−3)=0 en théorie, mais `sessionOps.ts:140` applique déjà `Math.max(1, …)` — pas de bug réel | P37 |
| PHASE1 | phaseAtLeast compare les ordres 1-4 correctement | P38 |
| WIZ1 | phaseLabel() appelle buildPhases() (pas de formule inline) | P39 |
| WIZ2 | fmtMod génère les strings à partir des numériques PHASE_CONFIG_BY_GOAL | P40 |

---

## Groupe F — Nouveaux types lower_pull / lower_push + focusMuscles cross-body (P41–P57)

> **Contexte :** deux nouveaux types internes ont été ajoutés depuis la v3 :
> - `lower_pull` → `'lower'` public — "Chaîne postérieure" (deadlift-first + tirage)
> - `lower_push` → `'lower'` public — "Squat & Press" (squat-first + bench/OHP)
>
> Leurs règles dans `workoutTypeFromFocus` :
> - `hasLower && hasPush && !hasPull` → `lower_push`  (avant lower_pull)
> - `hasLower && hasPull && !hasPush` → `lower_pull`
>
> **SLOTS de référence (base 60 min, 9 slots chacun) :**
> - `lower_pull` : hamstrings/glutes cpd → back_width cpd → back_thickness cpd → quads/glutes cpd → glutes/hamstrings isol → back isol → hamstrings isol → biceps isol → calves isol
> - `lower_push` : quads/glutes cpd → chest cpd → shoulders cpd → hamstrings/glutes cpd → quads isol → chest isol → triceps isol → glutes isol → calves isol

---

### P41 — **legs + back → lower_pull** (chaîne postérieure)
```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:BB+DB, level:'beginner',
  focusMuscles:['legs','back'] }
```
**Assertions CRITIQUES :**
- `hasLower=true, hasPull=true, hasPush=false` → `'lower_pull'`
- Split public = `['lower','lower']`
- Noms : "Lower — Chaîne postérieure A", "Lower — Chaîne postérieure B"
- Premier exercice de travail (index 1, après warmup) = composé hamstrings/glutes (deadlift ou RDL)
- `autoProgress: true`, `progressStepKg: 2.5` (équipement barbell/dumbbell)

**Coach :** le deadlift couvre-t-il bien jambes ET dos dans un seul mouvement ? Pool d'exercices suffisant pour 2 sessions distinctes ?

---

### P42 — **legs + back + core → lower_pull** (core ne change pas le type)
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner',
  focusMuscles:['legs','back','core'] }
```
**Assertions CRITIQUES :**
- `hasLower=true, hasPull=true, hasPush=false, hasCore=true` → `'lower_pull'`
- Split public = `['lower','lower','lower']` (lower_pull × 3)
- Noms : "Lower — Chaîne postérieure A/B/C"
- Core apparaît en queue via `corePool` (comportement normal)
- Persona typique : femme focus fessiers + posture + gainage

**Coach :** profil féminin (fessiers/dos/gainage) — le programme est-il adapté ? Hip thrust présent ?

---

### P43 — **legs + shoulders → lower_push** (squat+press, haltérophile)
```
{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:BB+DB, level:'intermediate',
  focusMuscles:['legs','shoulders'] }
```
**Assertions CRITIQUES :**
- `hasLower=true, hasPush=true (shoulders), hasPull=false` → `'lower_push'`
- Split public = `['lower','lower','lower']`
- Noms : "Lower — Squat & Press A/B/C"
- Premier exercice de travail = composé quads/glutes (squat)
- Deuxième composé = shoulders/front (OHP) présent dans les slots
- `autoProgress: true` (barbell prioritaire en strength)

**Coach :** pattern Wendler / haltérophile — le split est-il cohérent pour la force ? OHP et squat sont-ils bien les deux piliers ?

---

### P44 — **legs + chest + shoulders → lower_push** (push complet + jambes)
```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:FULL, level:'beginner',
  focusMuscles:['legs','chest','shoulders'] }
```
**Assertions CRITIQUES :**
- `hasLower=true, hasPush=true (chest+shoulders), hasPull=false` → `'lower_push'`
- Split public = `['lower','lower']`
- Noms : "Lower — Squat & Press A", "Lower — Squat & Press B"

**Coach :** surcharge musculaire — quads + pecs + épaules dans la même séance, est-ce trop pour un débutant ?

---

### P45 — **chest + shoulders → push** (push day complet)
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:DB, level:'beginner',
  focusMuscles:['chest','shoulders'] }
```
**Assertions CRITIQUES :**
- `hasPush=true (chest+shoulders), hasPull=false, hasLower=false` → `'push'`
- Split = `['push','push','push']`
- Slots chest ET shoulders bien couverts (pas seulement l'un des deux)

**Coach :** push day DB-only — l'OHP est-il disponible ? Le chest est-il correctement travaillé sans barre ?

---

### P46 — **back + arms → pull** (pull day complet)
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:BB+DB+CABLE, level:'intermediate',
  focusMuscles:['back','arms'] }
```
**Assertions CRITIQUES :**
- `hasPull=true (back), hasArms=true → hasUpper=true, hasPush=false, hasLower=false` → `'pull'`
- Split = `['pull','pull','pull']`
- Slots biceps (arms) ET dos (back) tous deux couverts

**Coach :** pull day "dos + bras" — les biceps bénéficient-ils d'un slot dédié en plus du tirage composé ?

---

### P47 — **chest + arms → push** (push day avec bras)
```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:DB, level:'beginner',
  focusMuscles:['chest','arms'] }
```
**Assertions CRITIQUES :**
- `hasPush=true (chest), hasArms=true → hasUpper=true, hasPull=false, hasLower=false`
- Vérifier la priorité des règles : `hasPush && !hasPull && !hasLower` → `'push'` (rule 3 avant rule 5)
- Split = `['push','push']`
- Triceps (arms) ET chest couverts

**Coach :** chest + triceps en push day — cohérence musculaire (synergistes) ?

---

### P48 — **shoulders + back → upper** (mixte haut du corps)
```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:FULL, level:'beginner',
  focusMuscles:['shoulders','back'] }
```
**Assertions CRITIQUES :**
- `hasPush=true (shoulders), hasPull=true (back)` → `hasUpper=true, hasLower=false` → `'upper'`
- Split = `['upper','upper']` (upper-push / upper-pull en interne)
- Noms : "Upper — Haut du corps A", "Upper — Haut du corps B"

**Coach :** `shoulders + back` → upper A/B — les épaules sont-elles bien représentées dans upper-push ET upper-pull ? Est-ce le meilleur split pour cet objectif ?

---

### P49 — **fat_loss 4j intermediate** (gap auto-split)
```
{ goal:'fat_loss', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'intermediate' }
```
**Assertions CRITIQUES :**
- `isMass = false` (fat_loss) + intermediate + 4j → identifier la branche exacte dans `selectSplit`
- Vérifier : fat_loss 4j intermediate ne tombe pas dans upper/lower (qui est isMass+4j)
- Afficher le split exact produit

**Coach :** fat_loss 4j intermediate — intensité cardio vs force, structure adaptée ?

---

### P50 — **strength 2j advanced** (gap niveau advanced)
```
{ goal:'strength', daysPerWeek:2, sessionDuration:90, equipment:FULL, level:'advanced' }
```
**Assertions CRITIQUES :**
- 2j = fullbody toujours (vérifier que le niveau advanced ne bifurque pas avant daysPerWeek)
- Split = `['fullbody','fullbody']`
- 90 min strength advanced → `adjustedSlotCount(9, 90, 'strength')` = base 9 (pas de bonus +2 en strength)
- Total = 9 + warmup + core = 11 exercices

**Coach :** advanced en strength sur seulement 2j — fullbody est-il adapté ? Quid des sets×reps ?

---

### P51 — **endurance 5j advanced** (gap niveau advanced + beaucoup de jours)
```
{ goal:'endurance', daysPerWeek:5, sessionDuration:60, equipment:FULL, level:'advanced' }
```
**Assertions CRITIQUES :**
- `isMass=false` (endurance) + advanced + 5j → identifier la branche dans selectSplit
- Afficher le split exact
- Vérifier que le niveau `advanced` ne produit pas de crash ou de split inattendu

**Coach :** endurance 5j advanced — volume hebdomadaire par groupe musculaire, récupération suffisante ?

---

### P52 — **legs + back + chest (ambiguïté totale) → fullbody**
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner',
  focusMuscles:['legs','back','chest'] }
```
**Assertions CRITIQUES :**
- `hasLower=true, hasPull=true, hasPush=true` → toutes les règles lower_push/lower_pull échouent → `null`
- Split par défaut 3j beginner isMass = `['fullbody','fullbody','fullbody']`
- **JAMAIS** `['lower_pull','lower_pull','lower_pull']` ou `['lower_push','lower_push','lower_push']`

---

### P53 — **arms seul → upper** (cas surprenant mais documenté)
```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:DB, level:'beginner',
  focusMuscles:['arms'] }
```
**Assertions CRITIQUES :**
- `hasArms=true → hasUpper=true, hasPush=false, hasPull=false, hasLower=false`
- Vérifie que rule 5 (`hasUpper && !hasLower`) matche → `'upper'`
- Split = `['upper','upper']` (upper-push / upper-pull en interne)
- Vérifier que les slots upper contiennent bien des exercices biceps ET triceps

**Coach :** "arms seul" en upper — est-ce que l'utilisateur va vraiment faire du bench press en cherchant des bras ?

---

### P54 — **chest + back + shoulders + arms → upper** (haut du corps complet sans jambes)
```
{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'intermediate',
  focusMuscles:['chest','back','shoulders','arms'] }
```
**Assertions CRITIQUES :**
- `hasUpper=true (tous), hasLower=false` → `'upper'`
- Split 4j intermediate isMass → mais avec focusMuscles → override → upper × 4
- Types internes : upper-push / upper-pull / upper-push / upper-pull
- Noms : "Upper — Haut du corps A/B/C/D"

**Coach :** programme "haut du corps only" 4j intermediate — récupération entre sessions upper ?

---

### P55 — **focusMuscles + selectedDays custom** (override jours + focus)
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner',
  focusMuscles:['legs','back'], selectedDays:['tuesday','thursday','saturday'] }
```
**Assertions CRITIQUES :**
- `selectedDays` remplace le mapping par défaut (lundi/mercredi/vendredi)
- Split = lower_pull × 3, jours : mardi, jeudi, samedi
- Vérifier que `selectedDays` est respecté dans le `weekMap` du DraftProgram

---

### P56 — **lower_push + BW only** (squat+press sans équipement)
```
{ goal:'endurance', daysPerWeek:2, sessionDuration:45, equipment:BW, level:'beginner',
  focusMuscles:['legs','shoulders'] }
```
**Assertions CRITIQUES :**
- → `'lower_push'`, Split = `['lower','lower']`
- 45min endurance → `adjustedSlotCount(9, 45, 'endurance')` = max(3, floor(9×0.75)) = 6 slots
- BW only : exercices shoulders disponibles ? (bw-pike-push-up ou similaire)
- `autoProgress: false`, `progressStepKg: 0`

**Coach :** squat+press en BW — push-ups et pike push-ups suffisent-ils pour les épaules ? Quads bien couverts en BW ?

---

### P57 — **lower_pull + machine+cable only** (chaîne postérieure sans barbell)
```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:MACH+CABLE, level:'beginner',
  focusMuscles:['legs','back'] }
```
**Assertions CRITIQUES :**
- → `'lower_pull'`, Split = `['lower','lower']`
- Slot 1 (hamstrings/glutes compound) : aucun barbell deadlift → machine leg curl ou leg press ?
- Slot 2 (back_width compound) : lat pulldown machine ou cable row ?
- Vérifier qu'aucun exercice barbell/dumbbell n'apparaît

**Coach :** lower_pull sans barre — le slot deadlift est-il bien rempli ? Quelle machine simule le hip hinge ?

---

## Récapitulatif assertions critiques Groupe F

| Code | Assertion | Profils |
|------|-----------|---------|
| LP1 | legs+back(!push) → lower_pull, jamais fullbody | P41, P42, P57 |
| LP2 | legs+push(!pull) → lower_push, jamais fullbody | P43, P44, P56 |
| LP3 | legs+push+pull → null → fullbody (ambiguïté) | P52 |
| LP4 | lower_pull deadlift-first : slot 1 = hamstrings/glutes compound | P41, P42 |
| LP5 | lower_push squat-first : slot 1 = quads/glutes compound | P43, P44 |
| PUSH_FULL | chest+shoulders → push (pas upper) | P45 |
| PULL_FULL | back+arms → pull (pas upper) | P46 |
| ARMS | arms seul → upper (rule 5 avant rule 3/4) | P53 |

---

## Groupe G — Nouveaux équipements & presets wizard (P58–P68)

> **Contexte :** commit `5941987` a ajouté deux nouveaux types d'équipement :
> - `pullup_bar` : barre de traction, barres parallèles, barre horizontale — 7 exercices re-tagués
> - `cardio_machine` : tapis, vélo, rameur, elliptique — 4 exercices (primaryMuscle: 'cardio')
>
> Ces profils vérifient (1) que les exercices pullup_bar apparaissent uniquement quand `pullup_bar ∈ allowed`,
> (2) que BW-only est bien plus restreint qu'avant, (3) le comportement de cardio_machine dans le générateur.
>
> **Rappel exercices pullup_bar :** `seed-pullup` (back_width, cmp), `bw-chinup` (biceps, cmp),
> `seed-dips` (chest_lower, cmp), `seed-triceps-dips` (triceps, iso), `bw-inverted-row` (back_thickness, cmp),
> `bw-nordic-curl` (hamstrings, cmp), `seed-hanging-leg-raise` (core).
>
> **Rappel exercices cardio_machine :** `seed-treadmill`, `seed-elliptical`, `seed-rowing-erg`, `seed-cycling`
> (tous primaryMuscle:'cardio', category:'compound'). Il n'existe **aucun slot template** ciblant `'cardio'`
> dans `programGenerator.ts` — ces exercices ne peuvent donc jamais être sélectionnés par `pickExercise`.

---

### P58 — **Outdoor preset (BW+BAR) 3j intermediate hypertrophy — vérification post-fix EQUIP-1/2**
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:BW+BAR, level:'intermediate' }
```
**Assertions CRITIQUES :**
- isMass (hypertrophy) + intermediate + 3j → Split = `['push','pull','legs']` (PPL)
- `autoProgress: false`, `progressStepKg: 0` (pullup_bar + bodyweight : pas de poids externe)
- Pull day slot `back_width` compound → `seed-pullup` (pullup_bar) ✓ (EQUIP-1 corrigé)
- Pull day slot `back_thickness` compound → `bw-inverted-row` (pullup_bar) ✓ (EQUIP-2 corrigé)
- Pull day slot `biceps` → `bw-chinup` (pullup_bar) ✓
- Push day slot `chest_lower` compound → `seed-dips` (pullup_bar) ✓ (EQUIP-2 corrigé)
- Push day slot `triceps` isolation → `seed-triceps-dips` (pullup_bar) ✓
- Legs slot `hamstrings` compound → `bw-nordic-curl` (pullup_bar) ✓ (EQUIP-3 corrigé)
- Aucun exercice `barbell`, `dumbbell`, `cable`, `machine`, `band`, `kettlebell` dans la sortie

**Coach :** programme calisthenics outdoor complet — ratio push/pull équilibré ? Progressivité possible sans poids externe (autoProgress=false) ?

---

### P59 — **BW-only sans pullup_bar 3j intermediate — conséquence de la séparation EQUIP-1/2**
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:BW, level:'intermediate' }
```
**Assertions CRITIQUES :**
- Split = `['push','pull','legs']` (PPL, isMass + intermediate + 3j)
- Pull day slot `back_width` compound → **aucun candidat** (seed-pullup est pullup_bar, exclu) → slot vide → null
- Pull day slot `back_thickness` compound → **aucun candidat** (bw-inverted-row est pullup_bar) → null
- Pull day slot `biceps` compound → **aucun candidat** (bw-chinup est pullup_bar) → null
- Push day slot `chest_lower` → **aucun candidat** (seed-dips est pullup_bar) → null (fallback isolation ?)
- Legs slot `hamstrings` compound → **aucun candidat** (bw-nordic-curl est pullup_bar) → null
- Vérifier combien de slots sont null au total et si le générateur émet des warnings (BUG-5)
- Nommer les exercices bodyweight restants pour chaque slot non-vide

**⚠️ CRITIQUE** : comparer avec P21 (beginner, qui est fullbody — moins de slots back). Ici c'est PPL : le Pull day entier est structurellement vide de dos. Documenter cet état comme un problème UX majeur.

**Coach :** BW pur sans pullup_bar — un pull day sans dos est-il acceptable ? Le générateur devrait-il avertir "impossible de générer un Pull day sans barre de traction" ?

---

### P60 — **Home gym (DB+KB+Band+BW) 3j intermediate hypertrophy**
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:HOME, level:'intermediate' }
```
**Assertions techniques :**
- `HOME` = `['dumbbell','kettlebell','band','bodyweight']`
- Split = `['push','pull','legs']` (PPL, isMass + intermediate + 3j)
- Aucun exercice pullup_bar (barre de traction non dans HOME)
- Pull day `back_width` compound : pool candidats = exercices dumbbell/kettlebell pour `back_width` — identifier dans le seed (rowing DB / KB row)
- Pull day `back_thickness` compound : `kb-row` (KB) ou row dumbbell ?
- Trier les candidats par `strengthEquipmentPrio` : dumbbell(2) < kettlebell(2) < band(3) < bodyweight(4)
  → dumbbell prioritaire sur kettlebell sur band sur bodyweight pour les composés en hypertrophy
- Identifier pour chaque slot le top-3 candidats et l'exercice retenu (intermediate → random top-3)
- `autoProgress: true`, `progressStepKg: 2.5` (dumbbell/kettlebell ont du poids externe)

**Coach :** home gym cohérent — le KB swing est-il sélectionné pour un slot jambes/fessiers ? L'elliptique est absent (cardio_machine) — le programme couvre-t-il le fat_loss si l'objectif était fat_loss ?

---

### P61 — **Home gym 4j fat_loss intermediate**
```
{ goal:'fat_loss', daysPerWeek:4, sessionDuration:60, equipment:HOME, level:'intermediate' }
```
**Assertions CRITIQUES :**
- isMass=false (fat_loss) + intermediate + 4j → identifier la branche exacte dans `selectSplit`
  (comparer avec P49 FULL+fat_loss+4j+intermediate)
- Afficher le split exact et les types internes
- Vérifier que les slots dos sont remplis avec DB/KB (pas de pullup_bar dans HOME)
- `progressStepKg: 2.5` (dumbbell/kettlebell disponibles)

**Coach :** fat_loss home gym sans cardio_machine — le programme peut-il atteindre l'objectif fat_loss ? KB swing en circuit-style serait pertinent — est-il sélectionné ?

---

### P62 — **Kettlebell seul 3j beginner hypertrophy**
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:KB, level:'beginner' }
```
**Assertions techniques :**
- `KB` = `['kettlebell']`
- beginner + isMass + 3j → Split = `['fullbody','fullbody','fullbody']` (fullbody×3)
- Pool kettlebell disponible (14 exercices) — lister par groupe musculaire : chest, back, shoulders, legs, arms, core
- Slots fullbody-quad : identifier candidats KB pour quads/glutes compound (kb-deadlift, kb-goblet-squat ?), back_width (kb-row), chest (kb-floor-press), etc.
- Slots vides éventuels : pas d'exercice KB pour `back_width` compound ?
  (vérifier si `kb-row` qualifie pour `back_width` ou seulement `back_thickness`)
- `autoProgress: true`, `progressStepKg: 2.5`

**Coach :** programme KB-only fullbody débutant — le goblet squat remplace-t-il bien le squat barre ? Le KB swing est-il sélectionné et dans quel slot ? La surcharge progressive est-elle réaliste avec une seule kettlebell ?

---

### P63 — **Outdoor lower_pull (BW+BAR + focus legs+back)**
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:BW+BAR, level:'beginner',
  focusMuscles:['legs','back'] }
```
**Assertions CRITIQUES :**
- `hasLower=true, hasPull=true (back), hasPush=false` → `'lower_pull'`
- Split = `['lower','lower','lower']` (lower_pull × 3)
- Noms : "Lower — Chaîne postérieure A/B/C"
- Slot 1 (hamstrings/glutes compound) → `bw-nordic-curl` (pullup_bar) ✓ (EQUIP-3 corrigé)
- Slot 2 (back_width compound) → `seed-pullup` (pullup_bar) ✓
- Slot 3 (back_thickness compound) → `bw-inverted-row` (pullup_bar) ✓
- Slot quads/glutes compound → `bw-squat` (bodyweight) ✓
- `autoProgress: false`, `progressStepKg: 0`
- Vérifier que 3 sessions lower_pull distincts sont générées avec variation d'exercices

**Coach :** lower_pull outdoor (tractions + nordic curl + squat BW) — programme fonctionnel et réaliste ? Nordic curl en premier slot d'un débutant est-il approprié ?

---

### P64 — **BW+BAR+BAND 3j intermediate endurance (élastiques pour shoulders_rear)**
```
{ goal:'endurance', daysPerWeek:3, sessionDuration:60, equipment:BW+BAR+BAND, level:'intermediate' }
```
**Assertions techniques :**
- `BW+BAR+BAND` = `['bodyweight','pullup_bar','band']`
- isMass=false (endurance) + intermediate + 3j → Split PPF = `['push','pull','fullbody']`
- Pull day slot `shoulders_rear` : `seed-band-pull-apart` est `band` + `isWarmupExercise:true` → exclu
  → vérifier si un autre exercice `band` cible `shoulders_rear` dans le seed (SEED-2 toujours ouvert)
- Push day + pull day : slots pullup_bar disponibles (tractions, dips, inverted row)
- Reps endurance : 15+ sur tous les slots
- `autoProgress: false`, `progressStepKg: 0` (band + bodyweight + pullup_bar, aucun poids externe)

**Coach :** élastiques pour shoulders_rear — le slot est-il vide (SEED-2) ou rempli ? Endurance calisthenics 3j intermediate — volume hebdomadaire adapté ?

---

### P65 — **FULL+CARDIO fat_loss 3j — cardio_machine jamais sélectionné (EQUIP-5)**
```
{ goal:'fat_loss', daysPerWeek:3, sessionDuration:60, equipment:FULL+CARDIO, level:'intermediate' }
```
**Assertions CRITIQUES :**
- `FULL+CARDIO` inclut `cardio_machine` dans les équipements autorisés
- isMass=false (fat_loss) + intermediate + 3j → Split PPF = `['push','pull','fullbody']`
- **Assertion principale (EQUIP-5)** : aucun exercice `equipment:'cardio_machine'` dans la sortie
  (seed-treadmill, seed-elliptical, seed-rowing-erg, seed-cycling ont `primaryMuscle:'cardio'` —
  il n'existe aucun slot template ciblant `'cardio'` dans `programGenerator.ts`)
- Vérifier dans le code que `pickExercise` filtre sur `slot.muscles.includes(ex.primaryMuscle)` :
  aucun slot ne liste `'cardio'` → les 4 exercices cardio_machine ne sont jamais candidats
- Programme généré = identique à FULL 3j fat_loss intermediate (cardio_machine ignoré)
- `strengthEquipmentPrio('cardio_machine')` = 5 → commentaire "jamais dans les slots de force" (ligne ~511)

**⚠️ BUG EQUIP-5** : `cardio_machine` est dans l'interface `Equipment`, dans les préférences utilisateur,
dans le wizard — mais le générateur ne l'utilise jamais. L'utilisateur qui coche "Cardio machine" n'en voit
aucun effet dans le programme généré.

**Correction recommandée :** soit ajouter un slot `cardio` en fin de séance (après core) pour les objectifs
`fat_loss` et `endurance`, soit afficher un message "Les machines cardio ne sont pas intégrées au programme —
les utiliser en échauffement ou en finisher."

**Coach :** fat_loss sans cardio_machine dans le programme — le programme peut-il atteindre l'objectif ? L'absence d'exercice cardio explicite est-elle acceptable ?

---

### P66 — **cardio_machine seul → edge case dégradé**
```
{ goal:'endurance', daysPerWeek:3, sessionDuration:60, equipment:CARDIO, level:'beginner' }
```
**Assertions CRITIQUES :**
- `CARDIO` = `['cardio_machine']` uniquement
- Tous les exercices du seed qui sont `cardio_machine` ont `primaryMuscle:'cardio'`
- Aucun slot template ne cible `'cardio'` → tous les slots sont vides → programme entièrement vide
- Vérifier le comportement exact du générateur : crash ? programme avec 0 exercices ? warnings ?
- L'unique contenu possible = warmup (`isWarmupExercise:true`) — vérifier si le warmup est cardio_machine
  (seed-jumping-jacks est bodyweight, non cardio_machine — pool warmup = bodyweight uniquement)
- Résultat attendu : DraftProgram avec 0 WorkoutExercise générés dans chaque session

**⚠️ Edge case** : le wizard ne bloque pas cette sélection. Un utilisateur peut cocher uniquement "Cardio machine" et lancer le générateur. Le résultat est un programme vide.

**Coach :** un programme vide est-il acceptable ? Comment le wizard devrait-il prévenir l'utilisateur ?

---

### P67 — **BW+BAR strength advanced 4j upper/lower — progressStepKg=0**
```
{ goal:'strength', daysPerWeek:4, sessionDuration:60, equipment:BW+BAR, level:'advanced' }
```
**Assertions CRITIQUES :**
- isMass (strength considéré isMass ? — vérifier dans le code) + advanced + 4j → Split = upper/lower A/B
- `progressStepKg: 0` pour tous les exercices (`pullup_bar` et `bodyweight` → `progressStepKg=0` dans `makeDraftWE`)
- `autoProgress: false` (bodyweight+pullup_bar, pas de poids externe incrémentable)
- Séries × reps strength advanced : vérifier que les specs force (5×3-5) sont générées malgré `autoProgress=false`
- Upper A : chest compound → seed-pushup (bodyweight) ; chest_lower → seed-dips (pullup_bar) ✓
- Upper B : back_width compound → seed-pullup (pullup_bar) ✓ ; biceps → bw-chinup (pullup_bar) ✓
- Advanced : `pickExercise` utilise random top-3 → lister les 3 candidats pour le slot chest compound

**Coach :** strength advanced calisthenics — sets×reps force (3-5 reps) sur des exercices bodyweight est-il réaliste ? La progression sans poids additionnel est-elle possible ? Recommandation : weighted calisthenics ou progression par variation d'exercice.

---

### P68 — **BW+BAR 2j beginner endurance selectedDays custom**
```
{ goal:'endurance', daysPerWeek:2, sessionDuration:45, equipment:BW+BAR, level:'beginner',
  selectedDays:['tuesday','saturday'] }
```
**Assertions techniques :**
- 2j = fullbody toujours → Split = `['fullbody','fullbody']`
- `selectedDays:['tuesday','saturday']` → weekMap = { tuesday: templateA, saturday: templateB }
  (lundi/mercredi par défaut remplacés)
- 45min endurance → `adjustedSlotCount(9, 45)` = 6 slots
- Total = 6 + warmup + core = 8 exercices par session
- `autoProgress: false`, `progressStepKg: 0`
- Reps endurance : 15+
- Vérifier que seed-pullup (pullup_bar) apparaît dans le slot back_width ✓
- Vérifier que seed-dips (pullup_bar) est disponible pour chest_lower ✓

**Coach :** endurance calisthenics 2j 45min — contenu suffisant ? Mardi + samedi : 4 jours de repos entre les séances, récupération optimale. Programme cohérent pour un débutant fitness ?

---

## Récapitulatif assertions critiques Groupe G

| Code | Assertion | Profils |
|------|-----------|---------|
| EQUIP-FIX1 | BW+BAR : seed-pullup (back_width) ∈ allowed ✓ | P58, P63, P67, P68 |
| EQUIP-FIX2 | BW+BAR : seed-dips (chest_lower), bw-inverted-row (back_thickness) ∈ allowed ✓ | P58, P67 |
| EQUIP-FIX3 | BW+BAR : bw-nordic-curl (hamstrings) ∈ allowed ✓ | P58, P63 |
| BW-VIDE | BW pur : back_width, back_thickness, biceps compound → slots vides (pullup_bar séparé) | P59, P05, P06, P21, P25 |
| HOME | HOME = DB+KB+Band+BW : dos couvert par KB/DB row (pullup_bar absent) | P60, P61 |
| KB | KB-only : identifier les slots vides faute de candidats kettlebell | P62 |
| EQUIP5 | cardio_machine jamais sélectionné par pickExercise (no 'cardio' slot in templates) | P65, P66 |
| CARDIO-EDGE | cardio_machine seul → programme entièrement vide | P66 |
| PROG0 | BW+BAR : progressStepKg=0, autoProgress=false | P58, P63, P67, P68 |
