# Audit `generateProgramDraft` — Groupe A (P01–P10)

> Coach sportif certifié — simulation pas à pas de `programGenerator.ts` + évaluation qualité.
> Fichiers lus intégralement avant analyse :
> - `src/utils/programGenerator.ts` (814 lignes)
> - `tests/audit_prompt_v3.md` (sections Rôle, Règles, Méthode, Évaluation, Groupe A)
>
> Étape 4 (exercices concrets depuis le seed) non effectuée pour P01–P10 (hors périmètre).
> Colonne « Exercice retenu » = `—` dans toutes les tables de ce groupe.

---

## Données de référence extraites du code

### Slots de base (nombre d'entrées dans `SLOTS`, ligne 109–277)

| Type interne | Nb slots base | Composés | Isolations |
|---|---|---|---|
| `push` | 6 | 2 | 4 |
| `pull` | 6 | 2 | 4 |
| `legs` | 6 | 2 | 4 |
| `upper` | 8 | 3 | 5 |
| `lower` | 6 | 2 | 4 |
| `upper-push` | 8 | 3 | 5 |
| `upper-pull` | 8 | 3 | 5 |
| `lower-quad` | 6 | 2 | 4 |
| `lower-hip` | 6 | 2 | 4 |
| `fullbody-quad` | **9** | 4 | 5 |
| `fullbody-hip` | **9** | 4 | 5 |

### `adjustedSlotCount(base, duration, goal)` — ligne 416–431

| Duration | Strength | Non-strength |
|---|---|---|
| 20 min | `max(2, floor(base×0.5))` | `max(2, floor(base×0.5))` |
| 45 min | `max(2, floor(base×0.5))` | `max(3, floor(base×0.75))` |
| 60 min | `max(3, floor(base×0.75))` | `base` |
| 90 min | `base` | `min(base+2, 8)` |

### `adjustedSpec(spec, duration)` — ligne 438–442

| Duration | Facteur sets |
|---|---|
| 60 min | inchangé |
| 90 min | inchangé |
| 45 min | `max(2, floor(sets×0.75))` |
| 20 min | `max(2, floor(sets×0.5))` |

### Specs par objectif (60 min → inchangées)

| Objectif | Composé S×R | Repos composé | Isolation S×R | Repos isolation |
|---|---|---|---|---|
| `strength` | 5×3–5 | 180 s | 3×5–8 | 120 s |
| `hypertrophy` | 4×8–12 | 90 s | 3×10–15 | 75 s |
| `endurance` | 3×15–20 | 60 s | 3×15–20 | 45 s |
| `fat_loss` | 3×12–15 | 60 s | 3×12–15 | 60 s |

`WARMUP_SPEC` : 2×10 (fixe, restSec=0). `CORE_SPEC` : 3×15 (fixe, restSec=60).

---

## P01 — Référence fullbody beginner

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:FULL, level:'beginner' }
```

### Simulation

**Étape 1 — `workoutTypeFromFocus([])`** (ligne 293)
- `focusMuscles` vide → `return null` immédiatement
- Flags : tous à `false` (non calculés — court-circuit ligne 293)
- Résultat : **`null`**

**Étape 2 — `selectSplit`** (ligne 348–350)
- `focusType = null` → branche switch `daysPerWeek=2`
- Ligne 350 : `return ['fullbody-quad', 'fullbody-hip']`
- Types publics : `['fullbody', 'fullbody']`
- Noms : `toPublicType` → 'fullbody' × 2 ; `totalOfType=2` → suffixe A/B
  - Séance 1 : **Full Body A**
  - Séance 2 : **Full Body B**

**Étape 3 — Sessions**

*Full Body A — type interne `fullbody-quad` (base = 9 slots)*
- `adjustedSlotCount(9, 60, 'hypertrophy')` → non-strength, 60 min → `base = 9` → **9 slots retenus**
- `reorderSlotsByFocus(slots, {})` → `focused.size=0` → aucun réordonnancement (ligne 479)

*Full Body B — type interne `fullbody-hip` (base = 9 slots)*
- `adjustedSlotCount(9, 60, 'hypertrophy')` → **9 slots retenus**

**Étape 5 — Specs hypertrophy + 60 min (inchangées)**
- Composé : 4×8–12, repos 90 s
- Isolation : 3×10–15, repos 75 s
- Warmup : 2×10, repos 0 s
- Core : 3×15, repos 60 s

**Étape 6 — Tables**

**Full Body A — `fullbody-quad`** (usedGlobally vide)

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Full Body A | warmup | — | — | 2×10 |
| 1 | Full Body A | quads + glutes | cmp | — | 4×8–12 |
| 2 | Full Body A | chest + chest_upper | cmp | — | 4×8–12 |
| 3 | Full Body A | back_width + back_thickness + back | cmp | — | 4×8–12 |
| 4 | Full Body A | shoulders + shoulders_front | cmp | — | 4×8–12 |
| 5 | Full Body A | hamstrings | iso | — | 3×10–15 |
| 6 | Full Body A | shoulders_rear | iso | — | 3×10–15 |
| 7 | Full Body A | biceps | iso | — | 3×10–15 |
| 8 | Full Body A | triceps | iso | — | 3×10–15 |
| 9 | Full Body A | calves | iso | — | 3×10–15 |
| 10 | Full Body A | core | — | — | 3×15 |

**Total Full Body A : 11 exercices** (1 warmup + 9 slots + 1 core)

**Full Body B — `fullbody-hip`** (usedGlobally = exercices de A)

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Full Body B | warmup | — | — | 2×10 |
| 1 | Full Body B | hamstrings + glutes | cmp | — | 4×8–12 |
| 2 | Full Body B | chest + chest_upper | cmp | — | 4×8–12 |
| 3 | Full Body B | back_width + back | cmp | — | 4×8–12 |
| 4 | Full Body B | shoulders + shoulders_front | cmp | — | 4×8–12 |
| 5 | Full Body B | quads | iso | — | 3×10–15 |
| 6 | Full Body B | shoulders_lateral + shoulders_rear | iso | — | 3×10–15 |
| 7 | Full Body B | biceps | iso | — | 3×10–15 |
| 8 | Full Body B | triceps | iso | — | 3×10–15 |
| 9 | Full Body B | calves | iso | — | 3×10–15 |
| 10 | Full Body B | core | — | — | 3×15 |

**Total Full Body B : 11 exercices**

### Assertions

| Assertion | Résultat | Ligne code |
|---|---|---|
| Split = `['fullbody','fullbody']` (types publics) | ✅ PASS | 350 |
| Types internes : `['fullbody-quad','fullbody-hip']` | ✅ PASS | 350 |
| Chaque workout : 1 warmup + 9 slots + 1 core = **11 exercices** | ✅ PASS | 760–774 |
| Pas de doublon intra-workout (`usedInWorkout` set) | ✅ PASS | 745, 753 |
| Premier exercice = warmup (`unshift`) | ✅ PASS | 760–767 |
| Dernier exercice = core (`push`) | ✅ PASS | 769–774 |
| Slots fullbody-quad = 9 (pas 8) | ✅ PASS | 252–264 |
| Slots fullbody-hip = 9 (pas 8) | ✅ PASS | 265–277 |

### Évaluation coach

**Équilibre musculaire :**
- Full Body A couvre : quads/glutes (cmp), chest (cmp), back (cmp), shoulders (cmp), puis hamstrings, shoulders_rear, biceps, triceps, calves (iso). ✅ Couverture quasi complète.
- Full Body B inverse la dominance : hamstrings/glutes (cmp) en tête, puis quads en iso → complémentarité A/B excellente.
- Ratio push/pull sur la séance A : chest + shoulders (push) vs back (pull) = légère asymétrie push. Compensée en séance B (back en composé toujours présent).
- Groupes absents en isolation : chest_iso absent dans A et B (pas de fly) ; glutes_iso absent en A. Acceptable pour un fullbody hypertrophie 60 min.

**Cohérence objectif :**
- 4×8–12 sur composés → zone hypertrophie classique ✅
- 3×10–15 sur isolations → légèrement au-dessus de la plage stricte (6–12) mais acceptable pour finition ✅

**Durée/contenu :**
- Estimation : 4 composés × (4 sets × ~2 min/set) ≈ 32 min + 5 isolations × (3 sets × ~1,75 min/set) ≈ 26 min + warmup (~3 min) + core (~6 min) = **~67 min**
- ⚠️ La session fullbody hypertrophie 9 slots en 60 min est **légèrement sous-estimée** (~7 min de dépassement probable). Aucun cap n'est appliqué par le code pour non-strength 60 min.

**Équipement :** FULL — aucune contrainte. Tous types d'exercices disponibles. ✅

**Variété inter-sessions :**
- fullbody-quad ≠ fullbody-hip (structures de slots différentes : squat-dominant vs hip-dominant).
- Verdict : **Variété structurelle** ✅

**Couverture isolation :**
- Absents en isolation : chest_iso, quads_iso direct (slot 5 de fullbody-quad est `hamstrings`, pas `quads`), glutes_iso en A.
- Verdict : **Lacunes acceptables** — fullbody 60 min ne peut tout isoler ; composés couvrent ces muscles secondairement.

**Verdict global : ✅ Bon programme** (réserve mineure sur le timing ~67 min vs 60 min annoncé)

---

## P02 — Fullbody beginner force 3j

```
{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner' }
```

### Simulation

**Étape 1 — `workoutTypeFromFocus([])`** → `null` (ligne 293)

**Étape 2 — `selectSplit`** (ligne 353–358)
- `daysPerWeek=3`, `isMass=true` (strength), `level='beginner'`
- Ligne 354 : `isMass && level !== 'beginner'` → **false** (beginner) → non pris
- Ligne 356 : `!isMass && level !== 'beginner'` → **false** (isMass=true) → non pris
- Ligne 358 : fallback → `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`
- Types publics : `['fullbody','fullbody','fullbody']`
- `totalOfType('fullbody') = 3` → suffixes A/B/C
  - Séance 1 (fullbody-quad, count=1) : **Full Body A**
  - Séance 2 (fullbody-hip, count=2) : **Full Body B**
  - Séance 3 (fullbody-quad, count=3) : **Full Body C**

**Étape 3 — Sessions**

*Full Body A & C — type `fullbody-quad` (base = 9 slots)*
- `adjustedSlotCount(9, 60, 'strength')` → `isStrength=true`, 60 min → `max(3, floor(9×0.75)) = max(3,6) = **6 slots retenus**` (ligne 428)

*Full Body B — type `fullbody-hip` (base = 9 slots)*
- `adjustedSlotCount(9, 60, 'strength')` → **6 slots retenus**

**Étape 5 — Specs strength + 60 min (inchangées par `adjustedSpec`)**
- Composé : **5×3–5**, repos 180 s
- Isolation : **3×5–8**, repos 120 s

**Étape 6 — Tables**

**Full Body A — `fullbody-quad` (6 premiers slots)**

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Full Body A | warmup | — | — | 2×10 |
| 1 | Full Body A | quads + glutes | cmp | — | 5×3–5 |
| 2 | Full Body A | chest + chest_upper | cmp | — | 5×3–5 |
| 3 | Full Body A | back_width + back_thickness + back | cmp | — | 5×3–5 |
| 4 | Full Body A | shoulders + shoulders_front | cmp | — | 5×3–5 |
| 5 | Full Body A | hamstrings | iso | — | 3×5–8 |
| 6 | Full Body A | shoulders_rear | iso | — | 3×5–8 |
| 7 | Full Body A | core | — | — | 3×15 |

**Total Full Body A : 8 exercices** (1 warmup + 6 slots + 1 core)

Slots coupés (7–9) : biceps iso, triceps iso, calves iso.

**Full Body B — `fullbody-hip` (6 premiers slots)**

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Full Body B | warmup | — | — | 2×10 |
| 1 | Full Body B | hamstrings + glutes | cmp | — | 5×3–5 |
| 2 | Full Body B | chest + chest_upper | cmp | — | 5×3–5 |
| 3 | Full Body B | back_width + back | cmp | — | 5×3–5 |
| 4 | Full Body B | shoulders + shoulders_front | cmp | — | 5×3–5 |
| 5 | Full Body B | quads | iso | — | 3×5–8 |
| 6 | Full Body B | shoulders_lateral + shoulders_rear | iso | — | 3×5–8 |
| 7 | Full Body B | core | — | — | 3×15 |

**Total Full Body B : 8 exercices**

**Full Body C = Full Body A** (même slots fullbody-quad, exercices différents via `usedGlobally`)

### Assertions

| Assertion | Résultat | Ligne code |
|---|---|---|
| Split = `['fullbody','fullbody','fullbody']` (types publics) | ✅ PASS | 358 |
| Beginner reste fullbody — PPL exige intermediate+ | ✅ PASS | 354 |
| **11 exercices par workout (9 slots + warmup + core)** | ❌ **FAIL** | 416–429 |

**Explication du FAIL :** L'assertion suppose 9 slots retenus. Or `adjustedSlotCount(9, 60, 'strength')` applique la pénalité force 60 min → `max(3, floor(9×0.75)) = 6 slots` (ligne 428). Le total est donc **8 exercices** (6 + warmup + core), pas 11. L'assertion du prompt d'audit est incorrecte pour l'objectif `strength`.

### Évaluation coach

**Équilibre musculaire :**
- 4 composés couvrent tout le corps (quads/glutes, chest, back, shoulders) — excellent pour un fullbody.
- En B : hamstrings/glutes en composé en tête → complémentarité A/B ✅
- Isolation très réduite (2 slots sur 9 disponibles) : biceps, triceps, calves absents → couverture accessoire nulle.

**Cohérence objectif :**
- 5×3–5 reps → zone de force ✅ en termes de plage de répétitions.
- ⚠️ **Risque technique pour un débutant** : 5 reps lourdes sur squat, bench, overhead press et tirage dans la même séance → technique non consolidée. Les débutants bénéficient davantage de 3×5 ou 5×5 sur des mouvements d'abord appris séparément.
- ⚠️ **Volume surchargé par la durée réelle** (voir ci-dessous).

**Durée/contenu :**
- Estimation 4 composés strength : 4 × (5 sets × 180 s repos + ~1,5 min travail) ≈ 4 × 13 = **52 min** uniquement pour les composés.
- + 2 isolations : 2 × (3 sets × 120 s repos) ≈ 12 min.
- + Warmup + core : ~9 min.
- **Total estimé : ~73 min pour un créneau de 60 min.** ❌ La pénalité ×0.75 des slots ne suffit pas à compenser les repos de 180 s en force.

**Équipement :** FULL ✅

**Variété inter-sessions :**
- A et B : fullbody-quad vs fullbody-hip → Variété structurelle ✅
- A et C : même slots fullbody-quad → **Variété d'exercices seulement** (C utilise des exercices alternatifs via `usedGlobally`).

**Couverture isolation :**
- Avec 6 slots (4 cmp + 2 iso), biceps, triceps et calves sont absents. Acceptable pour la force où le volume composite prime, mais mollets et bras jamais travaillés en isolation.
- Verdict : **Lacunes acceptables** (force = priorité composés).

**Verdict global : ⚠️ Problème mineur**
- Assertion "11 exercices" incorrecte (8 réels).
- Session strength fullbody 60 min dépasse la durée cible (~73 min estimés).
- Specs force pour débutants : techniquement conformes aux plages mais pédagogiquement risquées.

---

## P03 — PPL strength intermediate 3j

```
{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'intermediate' }
```

### Simulation

**Étape 1 — `workoutTypeFromFocus([])`** → `null` (ligne 293)

**Étape 2 — `selectSplit`** (ligne 354)
- `daysPerWeek=3`, `isMass=true`, `level='intermediate'`
- Ligne 354 : `isMass && level !== 'beginner'` → **true** → `['push','pull','legs']`
- Types publics : `['push','pull','legs']`
- Chaque type apparaît une fois → pas de suffixe
  - **Push — Poussée** | **Pull — Tirage** | **Legs — Jambes**

**Étape 3 — Sessions**

*Push — base = 6 slots*
- `adjustedSlotCount(6, 60, 'strength')` → `max(3, floor(6×0.75)) = max(3,4) = **4 slots**`

*Pull — base = 6 slots*
- `adjustedSlotCount(6, 60, 'strength')` → **4 slots**

*Legs — base = 6 slots*
- `adjustedSlotCount(6, 60, 'strength')` → **4 slots**

**Étape 5 — Specs strength + 60 min**
- Composé : 5×3–5, repos 180 s
- Isolation : 3×5–8, repos 120 s

**Étape 6 — Tables**

**Push — Poussée (4 premiers slots de `push`)**

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Push | warmup | — | — | 2×10 |
| 1 | Push | chest + chest_upper + chest_lower | cmp | — | 5×3–5 |
| 2 | Push | shoulders + shoulders_front | cmp | — | 5×3–5 |
| 3 | Push | chest + chest_upper + chest_lower | iso | — | 3×5–8 |
| 4 | Push | triceps | iso | — | 3×5–8 |
| 5 | Push | core | — | — | 3×15 |

**Total Push : 6 exercices** (4 slots + warmup + core). Slots coupés : shoulders_lateral iso, triceps iso (2ème).

**Pull — Tirage (4 premiers slots de `pull`)**

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Pull | warmup | — | — | 2×10 |
| 1 | Pull | back_width + back | cmp | — | 5×3–5 |
| 2 | Pull | back_thickness + back | cmp | — | 5×3–5 |
| 3 | Pull | back_thickness + back_width + back | iso | — | 3×5–8 |
| 4 | Pull | biceps | iso | — | 3×5–8 |
| 5 | Pull | core | — | — | 3×15 |

**Total Pull : 6 exercices.** Slots coupés : shoulders_rear iso, forearms iso.

**Legs — Jambes (4 premiers slots de `legs`)**

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Legs | warmup | — | — | 2×10 |
| 1 | Legs | quads | cmp | — | 5×3–5 |
| 2 | Legs | hamstrings + glutes | cmp | — | 5×3–5 |
| 3 | Legs | quads | iso | — | 3×5–8 |
| 4 | Legs | glutes | iso | — | 3×5–8 |
| 5 | Legs | core | — | — | 3×15 |

**Total Legs : 6 exercices.** Slots coupés : hamstrings iso, calves iso.

### Assertions

| Assertion | Résultat | Ligne code |
|---|---|---|
| Split = `['push','pull','legs']` | ✅ PASS | 354 |
| Push contient chest compound + shoulders compound | ✅ PASS | 110–112 |
| Pull contient dos (2 cmp) + biceps (iso) | ✅ PASS | 119–122 |
| Legs contient quads cmp + hamstrings/glutes cmp | ✅ PASS | 127–128 |

### Évaluation coach

**Équilibre musculaire :**
- Push/pull ratio : 1 séance push + 1 séance pull / semaine → ratio 1:1 ✅
- Jambes : 1 séance dédiée ✅
- Haut/bas : 2 séances haut + 1 séance bas → asymétrie acceptable en PPL pur.
- Slots coupés (strength 60 min) : shoulders_lateral, 2ème triceps (push) ; shoulders_rear, forearms (pull) ; hamstrings iso, calves (legs).
- ⚠️ **Calves absentes** sur toute la semaine (slot cut sur legs). Acceptable pour la force pure mais notable.
- ⚠️ **Shoulders_rear absente** (slot coupé sur pull) : déséquilibre postérieur potentiel si le dos est déjà faible.

**Cohérence objectif :**
- 5×3–5 sur composés → zone de force maximale ✅
- Volume force : 2 composés × 5 sets par séance = 10 sets par groupe musculaire principal (chest 5 sets push, back 10 sets pull) — adapté pour intermediate.

**Durée/contenu :**
- Estimation push : 2 composés × 13 min + 2 isolations × 8 min + warmup/core = **42 min**. Tient dans 60 min ✅ (marge de ~18 min).
- PPL avec 4 slots en force est bien calibré.

**Équipement :** FULL — barbell prioritaire via `strengthEquipmentPrio` (score 0) ✅

**Variété inter-sessions :** Push ≠ Pull ≠ Legs → **Variété structurelle maximale** ✅

**Couverture isolation :**
- Push : calves ✗, shoulders_lat ✗, triceps 2ème ✗ → Lacunes acceptables (force = volume composé)
- Pull : shoulders_rear ✗, forearms ✗ → Lacunes acceptables
- Legs : hamstrings iso ✗, calves ✗ → ⚠️ Calves systématiquement absentes sur la semaine

**Verdict global : ✅ Bon programme** (réserve : calves absentes sur la semaine entière)

---

## P04 — PPL hypertrophie intermediate 3j

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'intermediate' }
```

### Simulation

**Étape 1 — `workoutTypeFromFocus([])`** → `null` (ligne 293)

**Étape 2 — `selectSplit`** (ligne 354)
- `daysPerWeek=3`, `isMass=true` (hypertrophy), `level='intermediate'`
- Même branche que P03 → `['push','pull','legs']`
- Confirmation : le split ne dépend **pas** du goal spécifique, uniquement du flag `isMass` (ligne 327)

**Étape 3 — Sessions**

*Push, Pull, Legs — base = 6 slots*
- `adjustedSlotCount(6, 60, 'hypertrophy')` → non-strength, 60 min → `base = 6` → **6 slots retenus** (aucune réduction)

**Étape 5 — Specs hypertrophy + 60 min (inchangées)**
- Composé : **4×8–12**, repos 90 s
- Isolation : **3×10–15**, repos 75 s

**Étape 6 — Tables**

**Push — Poussée (6 slots)**

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Push | warmup | — | — | 2×10 |
| 1 | Push | chest + chest_upper + chest_lower | cmp | — | 4×8–12 |
| 2 | Push | shoulders + shoulders_front | cmp | — | 4×8–12 |
| 3 | Push | chest + chest_upper + chest_lower | iso | — | 3×10–15 |
| 4 | Push | triceps | iso | — | 3×10–15 |
| 5 | Push | shoulders_lateral + shoulders | iso | — | 3×10–15 |
| 6 | Push | triceps | iso | — | 3×10–15 |
| 7 | Push | core | — | — | 3×15 |

**Total Push : 8 exercices** (6 slots + warmup + core)

**Pull — Tirage (6 slots)**

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Pull | warmup | — | — | 2×10 |
| 1 | Pull | back_width + back | cmp | — | 4×8–12 |
| 2 | Pull | back_thickness + back | cmp | — | 4×8–12 |
| 3 | Pull | back_thickness + back_width + back | iso | — | 3×10–15 |
| 4 | Pull | biceps | iso | — | 3×10–15 |
| 5 | Pull | shoulders_rear | iso | — | 3×10–15 |
| 6 | Pull | forearms | iso | — | 3×10–15 |
| 7 | Pull | core | — | — | 3×15 |

**Total Pull : 8 exercices**

**Legs — Jambes (6 slots)**

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Legs | warmup | — | — | 2×10 |
| 1 | Legs | quads | cmp | — | 4×8–12 |
| 2 | Legs | hamstrings + glutes | cmp | — | 4×8–12 |
| 3 | Legs | quads | iso | — | 3×10–15 |
| 4 | Legs | glutes | iso | — | 3×10–15 |
| 5 | Legs | hamstrings | iso | — | 3×10–15 |
| 6 | Legs | calves | iso | — | 3×10–15 |
| 7 | Legs | core | — | — | 3×15 |

**Total Legs : 8 exercices**

### Assertions

| Assertion | Résultat | Ligne code |
|---|---|---|
| Split = `['push','pull','legs']` | ✅ PASS | 354 |
| Même split que P03 (indépendant du goal, dépend de `isMass`) | ✅ PASS | 327, 354 |
| 6 slots retenus pour hypertrophy 60 min (aucune réduction) | ✅ PASS | 428 |

### Évaluation coach

**Équilibre musculaire :**
- Push : chest 2 slots (1 cmp + 1 iso), shoulders 2 slots (1 cmp OHP + 1 iso latéral), triceps **2 slots isolation** ✅ mais redondant.
- Pull : back 3 slots (2 cmp + 1 iso), biceps 1 slot, shoulders_rear 1 slot, forearms 1 slot — excellent dos ✅
- Legs : quads 2 slots, hamstrings 2 slots, glutes 1 slot, calves 1 slot — couverture complète ✅

**Problème coach :**
- ⚠️ **Double slot triceps en push** (slots 4 et 6 de `push` : `SLOTS.push[3]` et `SLOTS.push[5]` = 2 × triceps isolation). Deux exercices triceps différents en une session est un choix discutable pour l'hypertrophie. Justifiable à haut niveau (volume triceps important) mais inhabituel dans un programme généré automatiquement.
- Le slot chest_iso (slot 3 de push) cible les mêmes groupes que le slot composé → bon pour l'isolation finition ✅

**Cohérence objectif :**
- 4×8–12 sur composés → zone hypertrophie parfaite ✅
- 3×10–15 sur isolations → légèrement au-dessus du 6–12 strict, mais utilisé classiquement en finition ✅
- Volume par groupe : chest ~7 sets/sem (4 cmp + 3 iso×2 = 10 sets réels), dos ~14 sets/sem → adéquat.

**Durée/contenu :**
- Estimation push : 2 cmp × 7 min + 4 iso × 5 min + warmup/core ≈ **43 min** ✅ Confortable dans 60 min.

**Variété inter-sessions :** Push ≠ Pull ≠ Legs → **Variété structurelle maximale** ✅

**Couverture isolation :**
- Push : chest_iso ✅, triceps ✅×2, shoulders_lat ✅ → complète (et même surchargée triceps)
- Pull : back_iso ✅, biceps ✅, shoulders_rear ✅, forearms ✅ → complète
- Legs : quads ✅, hamstrings ✅, glutes ✅, calves ✅ → complète
- Verdict : **Couverture isolation complète** (légère sur-représentation triceps en push)

**Verdict global : ✅ Bon programme** (réserve : double slot triceps en push — peut être intentionnel mais inhabituel)

---

## P05 — Endurance intermediate 3j → PPF

```
{ goal:'endurance', daysPerWeek:3, sessionDuration:60, equipment:BW, level:'intermediate' }
```

### Simulation

**Étape 1 — `workoutTypeFromFocus([])`** → `null` (ligne 293)

**Étape 2 — `selectSplit`** (ligne 356)
- `daysPerWeek=3`, `isMass=false` (endurance), `level='intermediate'`
- Ligne 354 : `isMass && level !== 'beginner'` → **false** (isMass=false)
- Ligne 356 : `!isMass && level !== 'beginner'` → **true** → `['push', 'pull', 'fullbody-quad']`
- Types publics : push / pull / fullbody
- Chaque type apparaît une fois → pas de suffixe
  - **Push — Poussée** | **Pull — Tirage** | **Full Body**

**Étape 3 — Sessions**

*Push — base = 6 slots*
- `adjustedSlotCount(6, 60, 'endurance')` → non-strength, 60 min → `base = 6`

*Pull — base = 6 slots*
- `adjustedSlotCount(6, 60, 'endurance')` → `base = 6`

*fullbody-quad — base = 9 slots*
- `adjustedSlotCount(9, 60, 'endurance')` → `base = 9`

**Étape 5 — Specs endurance + 60 min (inchangées)**
- Composé : **3×15–20**, repos 60 s
- Isolation : **3×15–20**, repos 45 s

**Étape 6 — Tables**

**Push — Poussée (6 slots, BW only)**

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Push | warmup | — | — | 2×10 |
| 1 | Push | chest + chest_upper + chest_lower | cmp | — | 3×15–20 |
| 2 | Push | shoulders + shoulders_front | cmp | — | 3×15–20 |
| 3 | Push | chest + chest_upper + chest_lower | iso | — | 3×15–20 |
| 4 | Push | triceps | iso | — | 3×15–20 |
| 5 | Push | shoulders_lateral + shoulders | iso | — | 3×15–20 |
| 6 | Push | triceps | iso | — | 3×15–20 |
| 7 | Push | core | — | — | 3×15 |

**Total Push : 8 exercices**

**Pull — Tirage (6 slots, BW only)**

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Pull | warmup | — | — | 2×10 |
| 1 | Pull | back_width + back | cmp | — | 3×15–20 |
| 2 | Pull | back_thickness + back | cmp | — | 3×15–20 |
| 3 | Pull | back_thickness + back_width + back | iso | — | 3×15–20 |
| 4 | Pull | biceps | iso | — | 3×15–20 |
| 5 | Pull | shoulders_rear | iso | — | 3×15–20 |
| 6 | Pull | forearms | iso | — | 3×15–20 |
| 7 | Pull | core | — | — | 3×15 |

**Total Pull : 8 exercices**

**Full Body (fullbody-quad, 9 slots, BW only)**

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Full Body | warmup | — | — | 2×10 |
| 1 | Full Body | quads + glutes | cmp | — | 3×15–20 |
| 2 | Full Body | chest + chest_upper | cmp | — | 3×15–20 |
| 3 | Full Body | back_width + back_thickness + back | cmp | — | 3×15–20 |
| 4 | Full Body | shoulders + shoulders_front | cmp | — | 3×15–20 |
| 5 | Full Body | hamstrings | iso | — | 3×15–20 |
| 6 | Full Body | shoulders_rear | iso | — | 3×15–20 |
| 7 | Full Body | biceps | iso | — | 3×15–20 |
| 8 | Full Body | triceps | iso | — | 3×15–20 |
| 9 | Full Body | calves | iso | — | 3×15–20 |
| 10 | Full Body | core | — | — | 3×15 |

**Total Full Body : 11 exercices**

### Assertions

| Assertion | Résultat | Ligne code |
|---|---|---|
| Split = `['push','pull','fullbody']` (PPF, pas PPL ni fullbody×3) | ✅ PASS | 356 |
| Branche `!isMass && level !== 'beginner'` dans selectSplit case 3 | ✅ PASS | 356 |
| Noms sans suffixe A/B (1 occurrence de chaque type) | ✅ PASS | 779 |
| Pas de doublon intra-workout | ✅ PASS | 745, 753 |

### Évaluation coach

**Équilibre musculaire :**
- Semaine : push + pull + fullbody → chaque groupe musculaire du haut touché 2× (push + fullbody pour chest/shoulders ; pull + fullbody pour back). Bas du corps uniquement dans fullbody. ⚠️ Jambes sous-représentées (1 séance sur 3).

**Cohérence objectif endurance :**
- 3×15–20 → zone endurance ✅
- ⚠️ **BW only — push day** : options pour chest compound = pompes, défis si 15–20 reps ne sont pas challenging → progression difficile sans équipement (pas d'autoProgress en BW)
- ⚠️ **BW only — pull day** : back_width compound = tractions (pullup). 15–20 répétitions de tractions en endurance est ambitieux pour un intermédiaire.
- Fullbody squat composé en BW → pistol squat, squat sauté, ou squat classique × 15–20 ✅ faisable

**Durée/contenu :**
- Endurance avec repos courts (45–60 s) : 6 slots × (3 sets × ~1,25 min/set) ≈ 22 min + warmup/core ≈ 30 min total push/pull. ✅ Confortable.
- Fullbody 9 slots endurance : ~45 min ✅

**Équipement :**
- BW only → `autoProgress=false`, `progressStepKg=0` ✅
- ⚠️ Slot back compound (pull) sur BW : nécessite une barre de traction (pullup). Si indisponible, le slot sera vide (`ex = null`, l'exercice est ignoré).

**Variété inter-sessions :** Push ≠ Pull ≠ FullBody → **Variété structurelle maximale** ✅

**Couverture isolation :** Acceptable pour un programme PPF endurance.

**Verdict global : ✅ Bon programme** (réserves : tractions en 15–20 reps exigeantes, jambes sous-représentées en semaine)

---

## P06 — Fat loss intermediate 3j → PPF

```
{ goal:'fat_loss', daysPerWeek:3, sessionDuration:60, equipment:BW, level:'intermediate' }
```

### Simulation

**Étape 1 — `workoutTypeFromFocus([])`** → `null` (ligne 293)

**Étape 2 — `selectSplit`** (ligne 356)
- `daysPerWeek=3`, `isMass=false` (fat_loss), `level='intermediate'`
- Ligne 356 : `!isMass && level !== 'beginner'` → **true** → `['push', 'pull', 'fullbody-quad']`
- Identique à P05 — fat_loss et endurance partagent le même flag `isMass=false`.

**Étape 3 — Sessions**
- Push : `adjustedSlotCount(6, 60, 'fat_loss')` → 6 slots
- Pull : 6 slots
- fullbody-quad : 9 slots

**Étape 5 — Specs fat_loss + 60 min**
- Composé : **3×12–15**, repos 60 s
- Isolation : **3×12–15**, repos 60 s

**Étape 6 — Tables**

**Push — Poussée (6 slots, BW only)**

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Push | warmup | — | — | 2×10 |
| 1 | Push | chest + chest_upper + chest_lower | cmp | — | 3×12–15 |
| 2 | Push | shoulders + shoulders_front | cmp | — | 3×12–15 |
| 3 | Push | chest + chest_upper + chest_lower | iso | — | 3×12–15 |
| 4 | Push | triceps | iso | — | 3×12–15 |
| 5 | Push | shoulders_lateral + shoulders | iso | — | 3×12–15 |
| 6 | Push | triceps | iso | — | 3×12–15 |
| 7 | Push | core | — | — | 3×15 |

**Pull — Tirage (6 slots, BW only)**

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Pull | warmup | — | — | 2×10 |
| 1 | Pull | back_width + back | cmp | — | 3×12–15 |
| 2 | Pull | back_thickness + back | cmp | — | 3×12–15 |
| 3 | Pull | back_thickness + back_width + back | iso | — | 3×12–15 |
| 4 | Pull | biceps | iso | — | 3×12–15 |
| 5 | Pull | shoulders_rear | iso | — | 3×12–15 |
| 6 | Pull | forearms | iso | — | 3×12–15 |
| 7 | Pull | core | — | — | 3×15 |

**Full Body (fullbody-quad, 9 slots, BW only)**

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Full Body | warmup | — | — | 2×10 |
| 1 | Full Body | quads + glutes | cmp | — | 3×12–15 |
| 2 | Full Body | chest + chest_upper | cmp | — | 3×12–15 |
| 3 | Full Body | back_width + back_thickness + back | cmp | — | 3×12–15 |
| 4 | Full Body | shoulders + shoulders_front | cmp | — | 3×12–15 |
| 5 | Full Body | hamstrings | iso | — | 3×12–15 |
| 6 | Full Body | shoulders_rear | iso | — | 3×12–15 |
| 7 | Full Body | biceps | iso | — | 3×12–15 |
| 8 | Full Body | triceps | iso | — | 3×12–15 |
| 9 | Full Body | calves | iso | — | 3×12–15 |
| 10 | Full Body | core | — | — | 3×15 |

### Assertions

| Assertion | Résultat | Ligne code |
|---|---|---|
| Split = `['push','pull','fullbody']` (PPF) | ✅ PASS | 356 |
| Même règle que P05 (fat_loss = isMass=false) | ✅ PASS | 327 |
| Noms sans suffixe | ✅ PASS | 779 |

### Évaluation coach

**Rapport cardio/force pour fat_loss :**
- 3×12–15 avec repos 60 s → densité élevée, proche du circuit training → **bon pour le fat loss** ✅
- BW + reps 12–15 → maintien de la masse maigre tout en brûlant des calories ✅
- ⚠️ **Absence de composante cardio/HIIT** dans le programme généré — pour `fat_loss`, des exercices cardiovasculaires (burpees, jump squats) seraient idéaux. Le générateur produit de la musculation traditionnelle sans cardio intégré.

**Volume hebdomadaire :**
- 3 séances × (6 à 9 slots × 3 sets) → 54 à 81 sets/semaine totaux.
- Approprié pour un intermédiaire en fat_loss BW.

**BW only — mêmes contraintes que P05 :**
- Pull composé = tractions 12–15 reps (faisable pour un intermédiaire en endurance/fat_loss)
- ⚠️ Pas d'autoProgress → plateau possible

**Variété inter-sessions :** Variété structurelle maximale (3 types distincts) ✅

**Verdict global : ✅ Bon programme** (réserve : absence de cardio dans un programme fat_loss ; tractions 12–15 reps exigeantes en BW)

---

## P07 — Upper/Lower beginner 4j

```
{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'beginner' }
```

### Simulation

**Étape 1 — `workoutTypeFromFocus([])`** → `null` (ligne 293)

**Étape 2 — `selectSplit`** (ligne 361–362)
- `daysPerWeek=4`, `isMass=true` (hypertrophy), `level='beginner'`
- Ligne 362 : `if (isMass)` → **true** (aucune vérification du niveau pour 4j isMass)
- → `['upper-push', 'lower-quad', 'upper-pull', 'lower-hip']`
- Types publics : `['upper','lower','upper','lower']`
- `totalOfType('upper') = 2`, `totalOfType('lower') = 2` → suffixes A/B pour chacun
  - upper-push (count=1) → **Upper — Haut du corps A**
  - lower-quad (count=1) → **Lower — Bas du corps A**
  - upper-pull (count=2) → **Upper — Haut du corps B**
  - lower-hip (count=2) → **Lower — Bas du corps B**

**Étape 3 — Sessions**

*Upper A (upper-push) — base = 8 slots*
- `adjustedSlotCount(8, 60, 'hypertrophy')` → non-strength, 60 min → `base = 8` → **8 slots**

*Lower A (lower-quad) — base = 6 slots*
- `adjustedSlotCount(6, 60, 'hypertrophy')` → `base = 6` → **6 slots**

*Upper B (upper-pull) — base = 8 slots*
- → **8 slots**

*Lower B (lower-hip) — base = 6 slots*
- → **6 slots**

**Étape 5 — Specs hypertrophy + 60 min**
- Composé : 4×8–12, repos 90 s
- Isolation : 3×10–15, repos 75 s

**Étape 6 — Tables**

**Upper A — Haut du corps (`upper-push`, 8 slots)**

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Upper A | warmup | — | — | 2×10 |
| 1 | Upper A | chest + chest_upper | cmp | — | 4×8–12 |
| 2 | Upper A | back_width + back_thickness + back | cmp | — | 4×8–12 |
| 3 | Upper A | shoulders + shoulders_front | cmp | — | 4×8–12 |
| 4 | Upper A | chest + chest_lower + chest_upper | iso | — | 3×10–15 |
| 5 | Upper A | triceps | iso | — | 3×10–15 |
| 6 | Upper A | shoulders_lateral | iso | — | 3×10–15 |
| 7 | Upper A | biceps | iso | — | 3×10–15 |
| 8 | Upper A | back_thickness + back | iso | — | 3×10–15 |
| 9 | Upper A | core | — | — | 3×15 |

**Total Upper A : 10 exercices** (8 slots + warmup + core)

**Lower A — Bas du corps (`lower-quad`, 6 slots)**

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Lower A | warmup | — | — | 2×10 |
| 1 | Lower A | quads + glutes | cmp | — | 4×8–12 |
| 2 | Lower A | hamstrings + glutes | cmp | — | 4×8–12 |
| 3 | Lower A | quads | iso | — | 3×10–15 |
| 4 | Lower A | hamstrings | iso | — | 3×10–15 |
| 5 | Lower A | glutes | iso | — | 3×10–15 |
| 6 | Lower A | calves | iso | — | 3×10–15 |
| 7 | Lower A | core | — | — | 3×15 |

**Total Lower A : 8 exercices** (6 slots + warmup + core)

**Upper B — Haut du corps (`upper-pull`, 8 slots)**

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Upper B | warmup | — | — | 2×10 |
| 1 | Upper B | back_width + back | cmp | — | 4×8–12 |
| 2 | Upper B | back_thickness + back | cmp | — | 4×8–12 |
| 3 | Upper B | chest + chest_upper | cmp | — | 4×8–12 |
| 4 | Upper B | shoulders_rear | iso | — | 3×10–15 |
| 5 | Upper B | biceps | iso | — | 3×10–15 |
| 6 | Upper B | back_thickness + back | iso | — | 3×10–15 |
| 7 | Upper B | triceps | iso | — | 3×10–15 |
| 8 | Upper B | shoulders_lateral | iso | — | 3×10–15 |
| 9 | Upper B | core | — | — | 3×15 |

**Total Upper B : 10 exercices**

**Lower B — Bas du corps (`lower-hip`, 6 slots)**

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Lower B | warmup | — | — | 2×10 |
| 1 | Lower B | glutes + hamstrings | cmp | — | 4×8–12 |
| 2 | Lower B | quads + glutes | cmp | — | 4×8–12 |
| 3 | Lower B | glutes | iso | — | 3×10–15 |
| 4 | Lower B | hamstrings | iso | — | 3×10–15 |
| 5 | Lower B | quads | iso | — | 3×10–15 |
| 6 | Lower B | calves | iso | — | 3×10–15 |
| 7 | Lower B | core | — | — | 3×15 |

**Total Lower B : 8 exercices**

### Assertions

| Assertion | Résultat | Ligne code |
|---|---|---|
| Split public = `['upper','lower','upper','lower']` | ✅ PASS | 362 |
| Types internes : upper-push / lower-quad / upper-pull / lower-hip | ✅ PASS | 362 |
| Noms avec A/B | ✅ PASS | 779 |
| Upper A (upper-push) : 8 slots → 10 exercices | ✅ PASS | 166–176, 760–774 |
| Upper B (upper-pull) : 8 slots → 10 exercices | ✅ PASS | 178–188, 760–774 |
| Lower A (lower-quad) : 6 slots → 8 exercices | ✅ PASS | 193–201, 760–774 |
| Lower B (lower-hip) : 6 slots → 8 exercices | ✅ PASS | 203–211, 760–774 |
| Lower A et B incluent un slot calves isolation | ✅ PASS | 200, 210 |
| Upper A : chest compound en tête | ✅ PASS | 166 |
| Upper B : back compound en tête (traction-first) | ✅ PASS | 178–179 |

### Évaluation coach

**Équilibre musculaire :**
- Semaine : 2 upper + 2 lower → ratio haut/bas parfait ✅
- Upper A (bench-first) vs Upper B (traction-first) → complémentarité push/pull ✅
- Lower A (squat-dominant) vs Lower B (hip-dominant) → complémentarité quad/postérieur ✅

**Cohérence objectif :**
- 4×8–12 composés → zone hypertrophie ✅
- 3×10–15 isolations → acceptable pour finition ✅

**Durée/contenu :**
- Upper : 3 composés × 7 min + 5 isolations × 5 min ≈ **46 min** ✅
- Lower : 2 composés × 7 min + 4 isolations × 5 min ≈ **34 min** ✅
- Les deux types tiennent confortablement dans 60 min.

**Adapté aux débutants ?**
- ⚠️ **10 exercices par session upper pour un débutant** = surcharge cognitive potentielle (apprentissage de 8 nouveaux mouvements par séance). Le split upper/lower A/B est normalement réservé aux intermédiaires.
- Le générateur ne vérifie pas le niveau (`level`) pour 4j + isMass (ligne 362) : beginner et advanced reçoivent le même split.
- Structure pédagogique correcte (composés en tête, isolations en fin) ✅

**Variété inter-sessions :**
- Upper A ≠ Upper B (bench-first vs traction-first, structures différentes) ✅
- Lower A ≠ Lower B (squat-first vs hip-thrust-first) ✅
- Verdict : **Variété structurelle** ✅

**Couverture isolation :**
- Upper A : chest_iso ✅, triceps ✅, shoulders_lat ✅, biceps ✅, back_iso ✅ → complète
- Upper B : shoulders_rear ✅, biceps ✅, back_iso ✅, triceps ✅, shoulders_lat ✅ → complète
- Lower : calves ✅, quads ✅, hamstrings ✅, glutes ✅ → complète
- Verdict : **Couverture isolation complète** ✅

**Récupération :**
- Par défaut (ligne 385) : lundi / mardi / jeudi / vendredi.
- Upper A (lundi) → Lower A (mardi) → Upper B (jeudi) → Lower B (vendredi).
- Repos entre Upper A et Upper B : 2 jours (mardi legs, mercredi repos) → ✅ suffisant.
- Repos entre Lower A et Lower B : idem ✅

**Verdict global : ✅ Bon programme** (réserve : volume/complexité élevé pour un débutant — 10 exercices par session upper)

---

## P08 — 5j intermediate PPL+UL

```
{ goal:'strength', daysPerWeek:5, sessionDuration:60, equipment:FULL, level:'intermediate' }
```

### Simulation

**Étape 1 — `workoutTypeFromFocus([])`** → `null` (ligne 293)

**Étape 2 — `selectSplit`** (ligne 370)
- `daysPerWeek=5`, `isMass=true` (strength), `level='intermediate'`
- Ligne 370 : `isMass && level !== 'beginner'` → **true** → `['push','pull','legs','upper','lower']`
- 5 types distincts → pas de suffixe
  - **Push — Poussée** | **Pull — Tirage** | **Legs — Jambes** | **Upper — Haut du corps** | **Lower — Bas du corps**

**Étape 3 — Sessions**

*Push, Pull, Legs — base = 6 slots*
- `adjustedSlotCount(6, 60, 'strength')` → `max(3, floor(6×0.75)) = max(3,4) = **4 slots**`

*Upper — base = 8 slots*
- `adjustedSlotCount(8, 60, 'strength')` → `max(3, floor(8×0.75)) = max(3,6) = **6 slots**`

*Lower — base = 6 slots*
- `adjustedSlotCount(6, 60, 'strength')` → **4 slots**

**Étape 5 — Specs strength + 60 min**
- Composé : 5×3–5, repos 180 s | Isolation : 3×5–8, repos 120 s

**Étape 6 — Tables**

**Push — Poussée (4 slots)**

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Push | warmup | — | — | 2×10 |
| 1 | Push | chest + chest_upper + chest_lower | cmp | — | 5×3–5 |
| 2 | Push | shoulders + shoulders_front | cmp | — | 5×3–5 |
| 3 | Push | chest + chest_upper + chest_lower | iso | — | 3×5–8 |
| 4 | Push | triceps | iso | — | 3×5–8 |
| 5 | Push | core | — | — | 3×15 |

**Pull — Tirage (4 slots)**

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Pull | warmup | — | — | 2×10 |
| 1 | Pull | back_width + back | cmp | — | 5×3–5 |
| 2 | Pull | back_thickness + back | cmp | — | 5×3–5 |
| 3 | Pull | back_thickness + back_width + back | iso | — | 3×5–8 |
| 4 | Pull | biceps | iso | — | 3×5–8 |
| 5 | Pull | core | — | — | 3×15 |

**Legs — Jambes (4 slots)**

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Legs | warmup | — | — | 2×10 |
| 1 | Legs | quads | cmp | — | 5×3–5 |
| 2 | Legs | hamstrings + glutes | cmp | — | 5×3–5 |
| 3 | Legs | quads | iso | — | 3×5–8 |
| 4 | Legs | glutes | iso | — | 3×5–8 |
| 5 | Legs | core | — | — | 3×15 |

**Upper — Haut du corps (6 premiers slots de `upper`)**

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Upper | warmup | — | — | 2×10 |
| 1 | Upper | chest + chest_upper | cmp | — | 5×3–5 |
| 2 | Upper | back_width + back_thickness + back | cmp | — | 5×3–5 |
| 3 | Upper | shoulders + shoulders_front | cmp | — | 5×3–5 |
| 4 | Upper | shoulders_lateral + shoulders_rear | iso | — | 3×5–8 |
| 5 | Upper | back_thickness + back | iso | — | 3×5–8 |
| 6 | Upper | chest + chest_lower | iso | — | 3×5–8 |
| 7 | Upper | core | — | — | 3×15 |

**Total Upper : 8 exercices** (6 slots retenus). Slots coupés : biceps iso, triceps iso (8 → 6).

**Lower — Bas du corps (4 slots, identique à `lower`)**

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Lower | warmup | — | — | 2×10 |
| 1 | Lower | quads | cmp | — | 5×3–5 |
| 2 | Lower | hamstrings + glutes | cmp | — | 5×3–5 |
| 3 | Lower | quads | iso | — | 3×5–8 |
| 4 | Lower | glutes | iso | — | 3×5–8 |
| 5 | Lower | core | — | — | 3×15 |

### Assertions

| Assertion | Résultat | Ligne code |
|---|---|---|
| Split = `['push','pull','legs','upper','lower']` | ✅ PASS | 370 |
| 5 workouts distincts | ✅ PASS | 370 |

### Évaluation coach

**Équilibre musculaire et récupération :**
- Chest : push (2 slots = 1 cmp + 1 iso) + upper (1 cmp + 1 iso) = **2× par semaine** ✅
- Back : pull (2 cmp + 1 iso) + upper (1 cmp + 1 iso) = **2×** ✅
- Shoulders : push (1 cmp) + upper (1 cmp + 1 iso) = **2×** ✅
- Legs : legs (2 cmp + 2 iso) + lower (2 cmp + 2 iso) = **2×** ✅
- Fréquence 2× par groupe → optimal pour la force ✅
- ⚠️ Chevauchement push + upper (chest/shoulders travaillés dans les deux) + pull + upper (back). Si les séances sont consécutives (lundi–vendredi par défaut), il faut surveiller :
  - Lundi (push) + Mardi (pull) → OK (groupes différents)
  - Mercredi (legs) → OK
  - Jeudi (upper) → chest et back déjà travaillés lundi/mardi → **48 h de repos pour chest/back** ✅
  - Vendredi (lower) → OK

**Cohérence objectif :** 5×3–5 sur composés = force pure ✅

**Durée/contenu :**
- Push/pull/legs/lower (4 slots) : ~42 min ✅
- Upper (6 slots strength) : 3 cmp × 13 min + 3 iso × 8 min ≈ **63 min** — légèrement au-dessus de 60 min.

**Calves absentes** sur toute la semaine (legs et lower coupent le slot calves) ⚠️

**Verdict global : ✅ Bon programme** (réserves : upper strength 6 slots ~63 min ; calves systématiquement absentes)

---

## P09 — 5j beginner → upper/lower+fullbody

```
{ goal:'hypertrophy', daysPerWeek:5, sessionDuration:60, equipment:FULL, level:'beginner' }
```

### Simulation

**Étape 1 — `workoutTypeFromFocus([])`** → `null` (ligne 293)

**Étape 2 — `selectSplit`** (ligne 370–372)
- `daysPerWeek=5`, `isMass=true` (hypertrophy), `level='beginner'`
- Ligne 370 : `isMass && level !== 'beginner'` → **false** (beginner)
- Ligne 372 : `if (isMass)` → **true** (2ème branche) → `['upper-push','lower-quad','upper-pull','lower-hip','fullbody-quad']`
- Types publics : `['upper','lower','upper','lower','fullbody']`
- `totalOfType('upper')=2`, `totalOfType('lower')=2`, `totalOfType('fullbody')=1`
  - upper-push (count=1) → **Upper — Haut du corps A**
  - lower-quad (count=1) → **Lower — Bas du corps A**
  - upper-pull (count=2) → **Upper — Haut du corps B**
  - lower-hip (count=2) → **Lower — Bas du corps B**
  - fullbody-quad (count=1, total=1) → **Full Body** (pas de suffixe)

**Étape 3 — Sessions**
- upper-push (base 8) → 8 slots (hypertrophy, non-strength, 60 min)
- lower-quad (base 6) → 6 slots
- upper-pull (base 8) → 8 slots
- lower-hip (base 6) → 6 slots
- fullbody-quad (base 9) → 9 slots

**Étape 5 — Specs hypertrophy + 60 min**
- Composé : 4×8–12 | Isolation : 3×10–15

**Étape 6 — Tables**

Sessions upper-push et upper-pull : identiques à P07 (même types, même specs).
Sessions lower-quad et lower-hip : identiques à P07.

**Full Body (`fullbody-quad`, 9 slots) :**

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Full Body | warmup | — | — | 2×10 |
| 1 | Full Body | quads + glutes | cmp | — | 4×8–12 |
| 2 | Full Body | chest + chest_upper | cmp | — | 4×8–12 |
| 3 | Full Body | back_width + back_thickness + back | cmp | — | 4×8–12 |
| 4 | Full Body | shoulders + shoulders_front | cmp | — | 4×8–12 |
| 5 | Full Body | hamstrings | iso | — | 3×10–15 |
| 6 | Full Body | shoulders_rear | iso | — | 3×10–15 |
| 7 | Full Body | biceps | iso | — | 3×10–15 |
| 8 | Full Body | triceps | iso | — | 3×10–15 |
| 9 | Full Body | calves | iso | — | 3×10–15 |
| 10 | Full Body | core | — | — | 3×15 |

### Assertions

| Assertion | Résultat | Ligne code |
|---|---|---|
| Split public = `['upper','lower','upper','lower','fullbody']` | ✅ PASS | 372 |
| Types internes : upper-push/lower-quad/upper-pull/lower-hip/fullbody-quad | ✅ PASS | 372 |
| **CRITIQUE** : beginner + isMass + 5j → upper/lower A/B + fullbody (pas fullbody×5) | ✅ PASS | 372 |
| fullbody×5 seulement pour beginner + !isMass (endurance/fat_loss) à 5j | ✅ PASS | 376 |
| Noms : A/B pour upper et lower, pas de suffixe pour fullbody | ✅ PASS | 779 |
| Exercices par workout : upper=10, lower=8, fullbody=11 | ✅ PASS | — |

### Évaluation coach

**Volume pour un débutant 5j :**
- ⚠️ **5 séances/semaine pour un débutant est excessif.** Les recommandations classiques (NSCA, ACSM) préconisent 2–3 séances pour un débutant afin de maximiser la récupération et l'apprentissage moteur.
- Exercices par semaine : 10 + 8 + 10 + 8 + 11 = **47 séries de travail** (hors warmup/core) × specs → volume considérable.
- Chaque groupe musculaire est travaillé **3× par semaine** (upper A + upper B + fullbody pour chest/back/shoulders ; lower A + lower B + fullbody pour jambes) → trop fréquent pour un débutant.

**Structure positive :**
- Upper A/B variété structurelle ✅, Lower A/B variété structurelle ✅
- fullbody-quad en séance 5 apporte un accent quad différent ✅

**Verdict global : ⚠️ Problème mineur** (le split est techniquement correct et bien structuré, mais 5j + 3× par groupe pour un débutant en hypertrophie est excessif — risque de surentraînement et d'abandon)

---

## P10 — 2j intermediate → toujours fullbody

```
{ goal:'strength', daysPerWeek:2, sessionDuration:60, equipment:BB+DB, level:'intermediate' }
```

### Simulation

**Étape 1 — `workoutTypeFromFocus([])`** → `null` (ligne 293)

**Étape 2 — `selectSplit`** (ligne 350)
- `daysPerWeek=2` → ligne 350 retourne **toujours** `['fullbody-quad','fullbody-hip']` quelle que soit la combinaison goal/level.
- Types publics : `['fullbody','fullbody']`
- `totalOfType('fullbody') = 2` → **Full Body A** / **Full Body B**

**Étape 3 — Sessions**

*Full Body A (fullbody-quad) — base = 9 slots*
- `adjustedSlotCount(9, 60, 'strength')` → `max(3, floor(9×0.75)) = 6 slots`

*Full Body B (fullbody-hip) — base = 9 slots*
- → 6 slots

**Étape 5 — Specs strength + 60 min**
- Composé : 5×3–5, repos 180 s | Isolation : 3×5–8, repos 120 s
- **Priorité barbell** : `strengthEquipmentPrio(barbell) = 0` < `strengthEquipmentPrio(dumbbell) = 2` (ligne 496–504)
  → sur chaque slot composé, si barbell ET dumbbell disponibles, le tri de `pickExercise` favorise barbell.

**Étape 6 — Tables**

**Full Body A — `fullbody-quad` (6 premiers slots, BB+DB, strength)**

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Full Body A | warmup | — | — | 2×10 |
| 1 | Full Body A | quads + glutes | cmp | — (barbell squat prioritaire) | 5×3–5 |
| 2 | Full Body A | chest + chest_upper | cmp | — (barbell bench prioritaire) | 5×3–5 |
| 3 | Full Body A | back_width + back_thickness + back | cmp | — (barbell row prioritaire) | 5×3–5 |
| 4 | Full Body A | shoulders + shoulders_front | cmp | — (barbell OHP prioritaire) | 5×3–5 |
| 5 | Full Body A | hamstrings | iso | — | 3×5–8 |
| 6 | Full Body A | shoulders_rear | iso | — | 3×5–8 |
| 7 | Full Body A | core | — | — | 3×15 |

**Total Full Body A : 8 exercices** (6 slots + warmup + core)

**Full Body B — `fullbody-hip` (6 premiers slots, BB+DB, strength)**

| # | Session | Slot — muscles cibles | Cat | Exercice | S×R |
|---|---|---|---|---|---|
| 0 | Full Body B | warmup | — | — | 2×10 |
| 1 | Full Body B | hamstrings + glutes | cmp | — (barbell RDL/deadlift prioritaire) | 5×3–5 |
| 2 | Full Body B | chest + chest_upper | cmp | — (barbell incliné prioritaire) | 5×3–5 |
| 3 | Full Body B | back_width + back | cmp | — (barbell/cable row prioritaire) | 5×3–5 |
| 4 | Full Body B | shoulders + shoulders_front | cmp | — (barbell OHP prioritaire) | 5×3–5 |
| 5 | Full Body B | quads | iso | — | 3×5–8 |
| 6 | Full Body B | shoulders_lateral + shoulders_rear | iso | — | 3×5–8 |
| 7 | Full Body B | core | — | — | 3×15 |

**Total Full Body B : 8 exercices**

### Assertions

| Assertion | Résultat | Ligne code |
|---|---|---|
| Split = `['fullbody-quad','fullbody-hip']` → public `['fullbody','fullbody']` | ✅ PASS | 350 |
| **CRITIQUE** : 2j = fullbody toujours, peu importe niveau/objectif | ✅ PASS | 350 |
| Priorité barbell sur dumbbell pour composés strength (`strengthEquipmentPrio`) | ✅ PASS | 494–504, 543–545 |

### Évaluation coach

**Équilibre musculaire :**
- Full Body A (squat-dominant) + Full Body B (hip-dominant) → complémentarité A/B ✅
- Slots coupés : biceps, triceps, calves (non prioritaires pour la force fullbody 2j).
- ⚠️ **Biceps, triceps et calves absents sur toute la semaine.** Acceptable pour un programme force pur, mais à signaler.

**Cohérence objectif :**
- 5×3–5 sur 4 composés → force maximale ✅
- `autoProgress = true`, `progressStepKg = 2.5` (barbell/dumbbell) → progression linéaire ✅
- ⚠️ **Durée estimée** (cf. P02) : 4 composés × 13 min + 2 isolations × 8 min + warmup/core ≈ **73 min** pour un créneau de 60 min. Même problème que P02.

**2j pour un intermédiaire en force :**
- ⚠️ 2 séances/semaine est le **minimum absolu** pour maintenir les acquis, mais insuffisant pour progresser significativement en force pour un intermédiaire. Les meilleures pratiques recommandent 3–4 séances (DUP, 5/3/1).
- Si c'est la contrainte de l'utilisateur, le générateur respecte le choix ✅. Mais aucun avertissement n'est produit.

**Barbell effectivement privilégié :**
- `pickExercise` trie les candidats par `strengthEquipmentPrio` → barbell (score 0) en tête ✅
- Dumbbell sert de fallback si barbell non disponible ✅

**Variété inter-sessions :** fullbody-quad ≠ fullbody-hip → **Variété structurelle** ✅

**Verdict global : ⚠️ Problème mineur** (dépassement durée ~73 min ; volume force 2j insuffisant pour progression intermédiaire)

---

## Récapitulatif Groupe A

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|---|---|---|---|
| P01 | Split fullbody A/B, 11 exercices, warmup/core OK | ✅ PASS | Session ~67 min pour créneau 60 min déclaré |
| P02 | Split fullbody A/B/C ✅ ; **11 exercices ❌ (8 réels)** | ❌ FAIL | Assertion "11 exercices" incorrecte (6 slots strength, pas 9) ; durée ~73 min ; 5×3–5 techniquement risqué pour débutants |
| P03 | Split PPL, chest+shoulders push, back+biceps pull, quads+hams legs | ✅ PASS | Calves absentes toute la semaine (slot coupé strength) |
| P04 | Split PPL, même que P03 (isMass=true), 6 slots hypertrophie | ✅ PASS | Double slot triceps en push (slots 4 et 6 identiques) |
| P05 | Split PPF (pas PPL), !isMass intermediate → push/pull/fullbody | ✅ PASS | Tractions 15–20 reps ambitieuses en BW ; jambes 1×/semaine seulement |
| P06 | Split PPF, fat_loss = isMass=false | ✅ PASS | Absence de cardio/HIIT dans fat_loss ; mêmes contraintes BW que P05 |
| P07 | Split upper/lower A/B beginner hypertrophie, 10/8 exercices, calves ✅ | ✅ PASS | 10 exercices upper pour un débutant = surcharge cognitive |
| P08 | Split push/pull/legs/upper/lower, 5 workouts distincts | ✅ PASS | Upper strength 6 slots ~63 min ; calves absentes toute la semaine |
| P09 | beginner+isMass+5j → upper/lower+fullbody (pas fullbody×5) ✅ | ✅ PASS | 5j/semaine + 3× par groupe pour débutant = risque surentraînement |
| P10 | 2j = fullbody toujours ✅ ; barbell prioritaire strength ✅ | ✅ PASS | Durée ~73 min ; 2j insuffisant pour progression force intermédiaire |

---

## Synthèse des problèmes ouverts — Groupe A

### Bugs / anomalies logicielles (assertions FAIL)

**P02 — Assertion "11 exercices par workout" : ❌ FAIL**
- Assertion : 9 slots + warmup + core = 11 exercices.
- Code réel : `adjustedSlotCount(9, 60, 'strength') = max(3, floor(9×0.75)) = 6` → 8 exercices.
- Impact : le document d'audit v3 contient une assertion incorrecte pour P02. Le code se comporte correctement (la pénalité strength 60 min s'applique bien), mais l'attendu dans le prompt est faux.
- Correction recommandée : corriger l'assertion de P02 dans l'audit prompt → "8 exercices par workout (6 slots + warmup + core)".

### Réserves coach cumulées — thèmes récurrents

**Thème 1 : Dépassement de durée sur les sessions strength fullbody**
- Profils concernés : P02, P10
- Problème : `adjustedSlotCount` applique ×0.75 sur les slots pour strength 60 min (6 au lieu de 9), mais les repos de 180 s entre sets font que 4 composés × (5 sets + 3 min repos) ≈ 52–60 min uniquement pour les composés. Le total dépasse systématiquement 60 min (~73 min estimés).
- Recommandation : pour strength + 60 min + fullbody, descendre à 5 slots (×0.55) ou plafonner les repos dans la spec PPL (2 composés seulement par séance).

**Thème 2 : Calves systématiquement absentes en strength 60 min**
- Profils concernés : P02, P03, P08
- Problème : le slot calves est toujours le dernier (index 5) dans `push`, `pull`, `legs`, `lower`. La coupure à 4 slots en strength 60 min élimine systématiquement ce slot.
- Recommandation : remonter le slot calves ou prévoir un slot calves minimal même en force.

**Thème 3 : Double slot triceps en push (hypertrophie 6 slots)**
- Profils concernés : P04, P05, P06 (push day 6 slots)
- Problème : `SLOTS.push[3]` = triceps iso et `SLOTS.push[5]` = triceps iso → 2 exercices triceps en une session.
- Recommandation : remplacer le slot `SLOTS.push[5]` par `{ muscles: ['chest_lower'], compound: false }` (dips / cable crossover) pour plus de diversité.

**Thème 4 : Volume débutant excessif**
- Profils concernés : P07 (10 exercices upper pour beginner), P09 (5j/semaine + 3× par groupe)
- Problème : le générateur ne limite pas le contenu pour le niveau beginner sur les splits intensifs (4j isMass, 5j isMass). Un beginner reçoit exactement les mêmes slots qu'un intermédiaire.
- Recommandation : ajouter un plafond `level='beginner'` → max 6 slots par session (quel que soit le type) ou limiter à 3j pour les beginners qui choisissent 4–5j.

**Thème 5 : BW + pull composé (tractions)**
- Profils concernés : P05, P06
- Problème : le slot back_width compound avec BW only suppose la disponibilité d'une barre de traction. Si absente, `pickExercise` retourne `null` et le slot est silencieusement ignoré.
- Recommandation : avertir l'utilisateur si `equipment=['bodyweight']` et pull/fullbody inclus dans le split.

**Thème 6 : 2j insuffisant pour force intermédiaire**
- Profils concernés : P10
- Problème : 2j/semaine est le minimum pour maintenir les acquis mais insuffisant pour la progression force intermédiaire. Le code ne génère aucun avertissement.
- Recommandation : afficher un message conseil ("Pour progresser en force au niveau intermédiaire, 3–4 séances/semaine sont recommandées") sans bloquer la génération.
