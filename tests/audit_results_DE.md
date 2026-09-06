# Audit `generateProgramDraft` — Groupes D & E (P27–P40)

> Coach sportif certifié · simulation pas à pas du code `programGenerator.ts`
> Fichier source lu en entier · Pas d'étape 4 (exercices concrets) pour ces groupes

---

## GROUPE D — Durée × slots (P27–P30)

---

### P27 — 20 minutes · hypertrophy · 2j · FULL · beginner

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:20, equipment:FULL, level:'beginner' }
```

**Étape 1 — workoutTypeFromFocus**

- `focusMuscles` absent → tableau vide → return `null` immédiatement (ligne 293)
- Flags : aucun calculé (court-circuit en entrée)

**Étape 2 — selectSplit**

- `focusType = null` → pas d'override
- `daysPerWeek = 2` → branche `case 2` (ligne 350) → `['fullbody-quad', 'fullbody-hip']`

**Étape 3 — adjustedSlotCount + slots ordonnés**

`adjustedSlotCount(base, 20, 'hypertrophy')` — code ligne 422 :
`if (duration === 20) return Math.max(2, Math.floor(base * 0.5))`

*Session 1 — Full Body A (fullbody-quad)*

- Base slots : 9 (tableau SLOTS['fullbody-quad'], lignes 252–264)
- `max(2, floor(9 × 0.5))` = `max(2, 4)` = **4 slots**
- `focusedMuscles.size = 0` → `reorderSlotsByFocus` retourne les slots tels quels (ligne 479)
- Slots retenus (les 4 premiers — tous composés) :

| # | Muscles cibles | Compound |
|---|---------------|----------|
| 1 | quads, glutes | true |
| 2 | chest, chest_upper | true |
| 3 | back_width, back_thickness, back | true |
| 4 | shoulders, shoulders_front | true |

*Session 2 — Full Body B (fullbody-hip)*

- Base slots : 9 (SLOTS['fullbody-hip'], lignes 265–277)
- `max(2, floor(9 × 0.5))` = **4 slots**
- Slots retenus (les 4 premiers — tous composés) :

| # | Muscles cibles | Compound |
|---|---------------|----------|
| 1 | hamstrings, glutes | true |
| 2 | chest, chest_upper | true |
| 3 | back_width, back | true |
| 4 | shoulders, shoulders_front | true |

**Étape 5 — Séries × reps**

`adjustedSpec(spec, 20)` — code ligne 439 : `factor = 0.5`, `sets = max(2, floor(sets × 0.5))`

- `COMPOUND_SPEC.hypertrophy` = { sets:4, repsMin:8, repsMax:12, restSec:90 }
  → sets ajustés : `max(2, floor(4 × 0.5))` = `max(2, 2)` = **2 séries**
  → composés : **2×8-12**

- Warmup (WARMUP_SPEC, non passé par adjustedSpec) : **2×10 fixe**
- Core (CORE_SPEC, non passé par adjustedSpec) : **3×15 fixe**

**Étape 6 — Tableau récapitulatif**

*Full Body A (fullbody-quad) :*

| # | Slot (muscles cibles) | Cat | Séries×Reps |
|---|----------------------|-----|-------------|
| 0 | warmup | — | 2×10 (fixe) |
| 1 | quads / glutes | cpd | 2×8-12 |
| 2 | chest / chest_upper | cpd | 2×8-12 |
| 3 | back_width / back_thickness / back | cpd | 2×8-12 |
| 4 | shoulders / shoulders_front | cpd | 2×8-12 |
| 5 | core | — | 3×15 (fixe) |

**Total : 6 exercices** (4 slots + 1 warmup + 1 core) ✅ assertion vérifiée

*Full Body B (fullbody-hip) :*

| # | Slot (muscles cibles) | Cat | Séries×Reps |
|---|----------------------|-----|-------------|
| 0 | warmup | — | 2×10 (fixe) |
| 1 | hamstrings / glutes | cpd | 2×8-12 |
| 2 | chest / chest_upper | cpd | 2×8-12 |
| 3 | back_width / back | cpd | 2×8-12 |
| 4 | shoulders / shoulders_front | cpd | 2×8-12 |
| 5 | core | — | 3×15 (fixe) |

**Total : 6 exercices** ✅

**Assertions : [PASS/FAIL]**
- `adjustedSlotCount(9, 20)` = 4 slots : **PASS** (ligne 422)
- Total 6 exercices par session : **PASS**
- `adjustedSpec` sur compound hypertrophy 20 min → 2 séries : **PASS** (ligne 441)

**Coach :**

- **Équilibre musculaire** : Uniquement 4 composés — tous les grands groupes sont touchés (quads, chest, dos, épaules en A ; chaîne post, chest, dos, épaules en B). Aucune isolation — biceps, triceps, mollets non couverts. Acceptable pour 20 min : priorité aux gros mouvements polyarticulaires.
- **Cohérence objectif** : 2×8-12 pour hypertrophie → zone de reps correcte mais volume minimal (2 séries = stimulus faible). En hypertrophie on vise généralement 3-4 séries ; ici les contraintes temps forcent à 2. Acceptable comme programme court mais attendus en gains limités.
- **Durée/contenu** : Estimation → 4 composés × 2 sets × (travail + 90s repos) ≈ 4 × 3.5 min = 14 min + warmup 2 min + core 3×60s ≈ 5 min = 21 min. Légèrement au-dessus de 20 min — le core avec 3×15 et 60s de repos consomme du temps non prévu. **Problème mineur** : le CORE_SPEC (3×15, restSec:60) n'est pas réduit par `adjustedSpec`, il prend ~5 min seul sur 20. Timing tendu.
- **Équipement** : FULL — pas de contrainte.
- **Variété inter-sessions** : Structurellement différenciées — fullbody-quad (squat-first) vs fullbody-hip (hip hinge-first). Variété **structurelle réelle** ✅
- **Couverture isolation** : Aucune isolation (tous les slots sont composés). Biceps, triceps, mollets, ischio (isolation), fessiers (isolation) absents. **Lacunes acceptables** compte tenu de la contrainte 20 min.

**Verdict : ⚠️ Problème mineur** — Le CORE_SPEC n'est pas réduit par `adjustedSpec`, ce qui pèse disproportionnellement sur les séances courtes (5 min de core sur 20 min = 25 % du temps).

---

### P28 — 45 minutes · hypertrophy · 2j · FULL · beginner

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:45, equipment:FULL, level:'beginner' }
```

**Étape 1 — workoutTypeFromFocus**

- `focusMuscles` absent → return `null`

**Étape 2 — selectSplit**

- `focusType = null`, `daysPerWeek = 2` → `['fullbody-quad', 'fullbody-hip']`

**Étape 3 — adjustedSlotCount + slots ordonnés**

`adjustedSlotCount(base, 45, 'hypertrophy')` — code ligne 424-425 :
`isStrength = false` → `Math.max(3, Math.floor(base * 0.75))`

*Session 1 — Full Body A (fullbody-quad)*

- Base : 9 slots
- `max(3, floor(9 × 0.75))` = `max(3, 6)` = **6 slots**
- Slots retenus (6 premiers de fullbody-quad) :

| # | Muscles cibles | Compound |
|---|---------------|----------|
| 1 | quads, glutes | true |
| 2 | chest, chest_upper | true |
| 3 | back_width, back_thickness, back | true |
| 4 | shoulders, shoulders_front | true |
| 5 | hamstrings | false (isolation) |
| 6 | shoulders_rear | false (isolation) |

*Session 2 — Full Body B (fullbody-hip)*

- Base : 9 slots → 6 slots
- Slots retenus :

| # | Muscles cibles | Compound |
|---|---------------|----------|
| 1 | hamstrings, glutes | true |
| 2 | chest, chest_upper | true |
| 3 | back_width, back | true |
| 4 | shoulders, shoulders_front | true |
| 5 | quads | false (isolation) |
| 6 | shoulders_lateral, shoulders_rear | false (isolation) |

**Étape 5 — Séries × reps**

`adjustedSpec(spec, 45)` → `factor = 0.75`

- `COMPOUND_SPEC.hypertrophy` { sets:4 } → `max(2, floor(4 × 0.75))` = `max(2, 3)` = **3 séries** → **3×8-12**
- `ISOLATION_SPEC.hypertrophy` { sets:3 } → `max(2, floor(3 × 0.75))` = `max(2, 2)` = **2 séries** → **2×10-15**
- Warmup : 2×10 (fixe) | Core : 3×15 (fixe)

**Étape 6 — Tableau récapitulatif**

*Full Body A (fullbody-quad) :*

| # | Slot (muscles cibles) | Cat | Séries×Reps |
|---|----------------------|-----|-------------|
| 0 | warmup | — | 2×10 (fixe) |
| 1 | quads / glutes | cpd | 3×8-12 |
| 2 | chest / chest_upper | cpd | 3×8-12 |
| 3 | back_width / back_thickness / back | cpd | 3×8-12 |
| 4 | shoulders / shoulders_front | cpd | 3×8-12 |
| 5 | hamstrings | isol | 2×10-15 |
| 6 | shoulders_rear | isol | 2×10-15 |
| 7 | core | — | 3×15 (fixe) |

**Total : 8 exercices** ✅

*Full Body B (fullbody-hip) :*

| # | Slot (muscles cibles) | Cat | Séries×Reps |
|---|----------------------|-----|-------------|
| 0 | warmup | — | 2×10 (fixe) |
| 1 | hamstrings / glutes | cpd | 3×8-12 |
| 2 | chest / chest_upper | cpd | 3×8-12 |
| 3 | back_width / back | cpd | 3×8-12 |
| 4 | shoulders / shoulders_front | cpd | 3×8-12 |
| 5 | quads | isol | 2×10-15 |
| 6 | shoulders_lateral / shoulders_rear | isol | 2×10-15 |
| 7 | core | — | 3×15 (fixe) |

**Total : 8 exercices** ✅

**Assertions : [PASS/FAIL]**
- `adjustedSlotCount(9, 45)` = 6 slots : **PASS** (ligne 424-425)
- Total 8 exercices : **PASS**
- Composés → 3 séries : **PASS** | Isolations → 2 séries : **PASS**

**Coach :**

- **Équilibre musculaire** : 4 composés couvrent les grands groupes + 2 isolations ciblées. Fullbody-A : hamstrings et épaules_rear en isolation — utile pour la posture. Fullbody-B : quads et deltoïdes latéraux/arrière. Biceps, triceps, mollets absents en isolation sur les deux sessions.
- **Cohérence objectif** : 3×8-12 composés = zone hypertrophie correcte. 2×10-15 isolations = volume acceptable pour 45 min. Programme équilibré.
- **Durée/contenu** : 4 cpd × 3 sets × ~4 min = 16 min. 2 isol × 2 sets × ~3 min = 6 min. Warmup 2 min. Core 3×15 + 60s × 2 = ~5 min. Total ≈ 29 min. Séance confortable en 45 min avec temps de transition.
- **Équipement** : FULL — sans contrainte.
- **Variété inter-sessions** : Variété **structurelle réelle** (quad-dominant vs hip-dominant). Différences notables : slot 1 et slot 5 inverses entre les sessions.
- **Couverture isolation** : Biceps, triceps, mollets non couverts en isolation — **lacunes acceptables** pour 45 min, travaillés indirectement via composés dos et jambes.

**Verdict : ✅ Bon programme** — Bon équilibre durée/contenu pour 45 min hypertrophie.

---

### P29 — 90 minutes · hypertrophy · 2j · FULL · beginner

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:90, equipment:FULL, level:'beginner' }
```

**Étape 1 — workoutTypeFromFocus**

- `focusMuscles` absent → return `null`

**Étape 2 — selectSplit**

- `daysPerWeek = 2` → `['fullbody-quad', 'fullbody-hip']`

**Étape 3 — adjustedSlotCount + slots ordonnés**

`adjustedSlotCount(base, 90, 'hypertrophy')` — code ligne 430 :
`isStrength = false` → `Math.min(base + 2, 8)`

*Session 1 — Full Body A (fullbody-quad)*

- Base : 9 slots
- `min(9 + 2, 8)` = `min(11, 8)` = **8 slots** (cap appliqué — le slot calves [#9] est élidé)
- Slots retenus :

| # | Muscles cibles | Compound |
|---|---------------|----------|
| 1 | quads, glutes | true |
| 2 | chest, chest_upper | true |
| 3 | back_width, back_thickness, back | true |
| 4 | shoulders, shoulders_front | true |
| 5 | hamstrings | false |
| 6 | shoulders_rear | false |
| 7 | biceps | false |
| 8 | triceps | false |
| — | **calves** (slot 9) | **élidé par le cap** |

*Session 2 — Full Body B (fullbody-hip)*

- Base : 9 slots → `min(11, 8)` = **8 slots** (calves élidé)
- Slots retenus :

| # | Muscles cibles | Compound |
|---|---------------|----------|
| 1 | hamstrings, glutes | true |
| 2 | chest, chest_upper | true |
| 3 | back_width, back | true |
| 4 | shoulders, shoulders_front | true |
| 5 | quads | false |
| 6 | shoulders_lateral, shoulders_rear | false |
| 7 | biceps | false |
| 8 | triceps | false |
| — | **calves** (slot 9) | **élidé par le cap** |

**Explication du cap à 8** : La formule `min(base + 2, 8)` pour 90 min ajoute 2 slots bonus par rapport à 60 min (qui retourne `base` pour hypertrophie), mais plafonne à 8 pour éviter qu'un type fullbody (9 slots) ne génère 11 slots fictifs (9+2=11 > longueur réelle du tableau). Sans ce cap, `slice(0, 11)` sur un tableau de 9 retournerait les 9 slots, soit 1 de plus qu'en 60 min — ce qui serait raisonnable. Le cap fixé à 8 est en réalité plus restrictif : il force l'éjection du 9e slot (calves) même en 90 min. Pour les types push/pull/legs/lower (6 slots), `min(8, 8) = 8` mais `slice(0, 8)` sur 6 éléments retourne les 6 disponibles — le cap n'a donc d'effet concret que sur les types fullbody et upper-push/pull (8 slots).

**Étape 5 — Séries × reps**

`adjustedSpec(spec, 90)` → `if (duration === 90) return spec` (inchangé, ligne 439)

- `COMPOUND_SPEC.hypertrophy` = { sets:4 } → **4×8-12**
- `ISOLATION_SPEC.hypertrophy` = { sets:3 } → **3×10-15**
- Warmup : 2×10 (fixe) | Core : 3×15 (fixe)

**Étape 6 — Tableau récapitulatif**

*Full Body A (fullbody-quad) :*

| # | Slot (muscles cibles) | Cat | Séries×Reps |
|---|----------------------|-----|-------------|
| 0 | warmup | — | 2×10 (fixe) |
| 1 | quads / glutes | cpd | 4×8-12 |
| 2 | chest / chest_upper | cpd | 4×8-12 |
| 3 | back_width / back_thickness / back | cpd | 4×8-12 |
| 4 | shoulders / shoulders_front | cpd | 4×8-12 |
| 5 | hamstrings | isol | 3×10-15 |
| 6 | shoulders_rear | isol | 3×10-15 |
| 7 | biceps | isol | 3×10-15 |
| 8 | triceps | isol | 3×10-15 |
| 9 | core | — | 3×15 (fixe) |

**Total : 10 exercices** ✅

*Full Body B (fullbody-hip) :*

| # | Slot (muscles cibles) | Cat | Séries×Reps |
|---|----------------------|-----|-------------|
| 0 | warmup | — | 2×10 (fixe) |
| 1 | hamstrings / glutes | cpd | 4×8-12 |
| 2 | chest / chest_upper | cpd | 4×8-12 |
| 3 | back_width / back | cpd | 4×8-12 |
| 4 | shoulders / shoulders_front | cpd | 4×8-12 |
| 5 | quads | isol | 3×10-15 |
| 6 | shoulders_lateral / shoulders_rear | isol | 3×10-15 |
| 7 | biceps | isol | 3×10-15 |
| 8 | triceps | isol | 3×10-15 |
| 9 | core | — | 3×15 (fixe) |

**Total : 10 exercices** ✅

**Assertions : [PASS/FAIL]**
- `adjustedSlotCount(9, 90)` = `min(11, 8)` = **8 slots** : **PASS** (ligne 430)
- Total 10 exercices : **PASS**
- Specs composés inchangées en 90 min : **PASS** (ligne 439)
- Slot calves élidé (9e slot non inclus) : **PASS**

**Coach :**

- **Équilibre musculaire** : Couverture quasi-complète sur les deux sessions. Seuls les mollets (calves) sont absents des deux sessions — effet du cap à 8 qui éjecte systématiquement ce slot dans les fullbody. Pénalité notable pour un programme qui vise la complétude sur 90 min.
- **Cohérence objectif** : 4×8-12 = volume hypertrophie optimal. 3×10-15 isolations = stimulus correct. Programme bien calibré pour l'objectif.
- **Durée/contenu** : Estimation → 4 cpd × 4 sets × ~5 min (travail + 90s repos) = 20 min. 4 isol × 3 sets × ~4 min (travail + 75s repos) = 12 min. Warmup 3 min. Core ~7 min. Total ≈ 42 min. La séance tient largement en 90 min — il reste 40 min de marge. Pour un beginner c'est approprié (moins d'intensité, plus de temps de transition). En 90 min on pourrait accepter un 9e slot de travail (calves).
- **Équipement** : FULL — sans contrainte.
- **Variété inter-sessions** : Variété structurelle réelle (quad-first vs hip-first). Isolations différentes entre A et B (hamstrings+shoulders_rear+bis+tris vs quads+shoulders_lat-rear+bis+tris).
- **Couverture isolation** : **Lacune problématique** : les mollets (calves) sont absents des deux sessions à cause du cap à 8 — sur 90 min, c'est injustifiable. Le cap devrait être réévalué (passer à 9 pour 90 min) ou la liste fullbody reorganisée pour mettre calves plus haut.

**Verdict : ⚠️ Problème mineur** — Programme 90 min sans mollets par effet du cap à 8. Volume total confortable (42 min réelles sur 90) — le cap est trop conservateur pour cette durée.

---

### P30 — 20 minutes · strength · 3j · FULL · intermediate

```
{ goal:'strength', daysPerWeek:3, sessionDuration:20, equipment:FULL, level:'intermediate' }
```

**Étape 1 — workoutTypeFromFocus**

- `focusMuscles` absent → return `null`

**Étape 2 — selectSplit**

- `focusType = null`
- `goal = 'strength'` → `isMass = true`
- `level = 'intermediate'` → `level !== 'beginner'`
- `daysPerWeek = 3`, `isMass && level !== 'beginner'` → `['push', 'pull', 'legs']` (ligne 354)

**Étape 3 — adjustedSlotCount + slots ordonnés**

`adjustedSlotCount(base, 20, 'strength')` — code ligne 423-424 :
`isStrength = true`, `duration = 20` → `Math.max(2, Math.floor(base * 0.5))`

*Session 1 — Push*

SLOTS['push'] (lignes 110-117) = 6 slots :
```
[chest cpd, shoulders cpd, chest isol, triceps isol, shoulders_lat isol, triceps isol]
```
- `max(2, floor(6 × 0.5))` = `max(2, 3)` = **3 slots**
- `focusedMuscles.size = 0` → pas de réordonnancement
- Slots retenus (3 premiers) :

| # | Muscles cibles | Compound |
|---|---------------|----------|
| 1 | chest, chest_upper, chest_lower | true |
| 2 | shoulders, shoulders_front | true |
| 3 | chest, chest_upper, chest_lower | false (isolation) |

*Session 2 — Pull*

SLOTS['pull'] (lignes 118-125) = 6 slots :
```
[back_width cpd, back_thickness cpd, back isol, biceps isol, shoulders_rear isol, forearms isol]
```
- `max(2, floor(6 × 0.5))` = **3 slots**
- Slots retenus :

| # | Muscles cibles | Compound |
|---|---------------|----------|
| 1 | back_width, back | true |
| 2 | back_thickness, back | true |
| 3 | back_thickness, back_width, back | false (isolation) |

*Session 3 — Legs*

SLOTS['legs'] (lignes 126-133) = 6 slots :
```
[quads cpd, hamstrings/glutes cpd, quads isol, glutes isol, hamstrings isol, calves isol]
```
- `max(2, floor(6 × 0.5))` = **3 slots**
- Slots retenus :

| # | Muscles cibles | Compound |
|---|---------------|----------|
| 1 | quads | true |
| 2 | hamstrings, glutes | true |
| 3 | quads | false (isolation) |

**Étape 5 — Séries × reps**

`adjustedSpec(spec, 20)` → `factor = 0.5`

- `COMPOUND_SPEC.strength` = { sets:5, repsMin:3, repsMax:5, restSec:180 }
  → `max(2, floor(5 × 0.5))` = `max(2, 2)` = **2 séries** → **2×3-5** (repos 180s)
- `ISOLATION_SPEC.strength` = { sets:3, repsMin:5, repsMax:8, restSec:120 }
  → `max(2, floor(3 × 0.5))` = `max(2, 1)` = **2 séries** → **2×5-8** (repos 120s)
- Warmup : 2×10 | Core : 3×15 (specs non ajustées)

**Étape 6 — Tableau récapitulatif**

*Session Push :*

| # | Slot (muscles cibles) | Cat | Séries×Reps | Repos |
|---|----------------------|-----|-------------|-------|
| 0 | warmup | — | 2×10 (fixe) | 0s |
| 1 | chest / chest_upper / chest_lower | cpd | 2×3-5 | 180s |
| 2 | shoulders / shoulders_front | cpd | 2×3-5 | 180s |
| 3 | chest / chest_upper / chest_lower | isol | 2×5-8 | 120s |
| 4 | core | — | 3×15 (fixe) | 60s |

**Total : 5 exercices**

*Session Pull :*

| # | Slot (muscles cibles) | Cat | Séries×Reps | Repos |
|---|----------------------|-----|-------------|-------|
| 0 | warmup | — | 2×10 (fixe) | 0s |
| 1 | back_width / back | cpd | 2×3-5 | 180s |
| 2 | back_thickness / back | cpd | 2×3-5 | 180s |
| 3 | back_thickness / back_width / back | isol | 2×5-8 | 120s |
| 4 | core | — | 3×15 (fixe) | 60s |

**Total : 5 exercices**

*Session Legs :*

| # | Slot (muscles cibles) | Cat | Séries×Reps | Repos |
|---|----------------------|-----|-------------|-------|
| 0 | warmup | — | 2×10 (fixe) | 0s |
| 1 | quads | cpd | 2×3-5 | 180s |
| 2 | hamstrings / glutes | cpd | 2×3-5 | 180s |
| 3 | quads | isol | 2×5-8 | 120s |
| 4 | core | — | 3×15 (fixe) | 60s |

**Total : 5 exercices**

**Assertions : [PASS/FAIL]**
- Split PPL intermediate strength : **PASS** (ligne 354)
- `adjustedSlotCount(6, 20, 'strength')` = `max(2, 3)` = 3 slots : **PASS** (ligne 423)
- `adjustedSpec` composé strength 20 min → 2 séries : **PASS** (ligne 441)

**Coach :**

- **Équilibre musculaire** : PPL sur 3j couvre tous les groupes en principe. Mais avec seulement 3 slots par séance (2 composés + 1 isolation), la couverture est minimale. Legs en particulier : quads travaillés deux fois (1 cpd + 1 isol) mais glutes et ischio uniquement dans un seul composé — insuffisant pour un programme force complet.
- **Cohérence objectif** : 2×3-5 = zone force correcte en reps. Mais **2 séries seulement est dramatiquement insuffisant pour la force** — un programme force sérieux nécessite minimum 3×3-5 (Wendler 5/3/1), idéalement 5×3-5. Le volume est trop faible pour induire des adaptations de force.
- **Durée/contenu** : PROBLÈME SÉRIEUX. Estimation : warmup 2 min. 2 cpd × 2 sets × (travail ~30s + 180s repos) = 2 × (2 × 3.5 min) = 14 min. 1 isol × 2 sets × (travail + 120s repos) = 4 min. Core 3×15 + 60s×2 = 5 min. **Total estimé ≈ 25 min > 20 min**. Le CORE_SPEC non réduit aggrave le problème. Un programme force avec repos 180s ne tient pas raisonnablement en 20 min.
- **Équipement** : FULL — priorité barbell pour les composés en strength correctement gérée par `strengthEquipmentPrio`.
- **Variété inter-sessions** : Variété structurelle réelle (Push/Pull/Legs = 3 types distincts).
- **Couverture isolation** : Sur 3 slots, 1 seul dédié à l'isolation. Push : chest isolée, shoulders_lat et triceps absents en isolation. Pull : dos isolé, biceps et shoulders_rear absents. Legs : quads deux fois, glutes/ischio/calves absents en isolation. **Lacunes problématiques** pour un programme force.

**Verdict : ❌ Problème sérieux** — 20 min est incompatible avec l'objectif force (repos 180s). Le timing réel dépasse 20 min, et le volume (2 séries) est insuffisant pour des adaptations en force. Cette combinaison durée/objectif devrait idéalement être signalée à l'utilisateur dans le wizard.

---

## GROUPE E — Périodisation `buildPhases` (P31–P40)

---

### P31 — buildPhases(7) → pas de périodisation

```typescript
buildPhases(7)
```

**Simulation :**

Code ligne 632-633 :
```typescript
export function buildPhases(totalWeeks: number, goal: ProgramGoal = 'strength'): DraftPhase[] | undefined {
  if (totalWeeks < 8) return undefined
```

- `totalWeeks = 7 < 8` → return `undefined` immédiatement

**Assertions : [PASS/FAIL]**
- `totalWeeks=7 < 8` → `return undefined` (ligne 632-633) : **PASS**
- `generateProgramDraft` avec `totalWeeks:7` → `phases: undefined` dans DraftProgram : **PASS**
  (ligne 811 : `phases: buildPhases(durationWeeks, goal)` → `buildPhases(7, goal)` → `undefined`)
- `phaseLabel(7)` → `''` (undefined retourné → aucune phase à formater) : **PASS**

**Coach :**
- 7 semaines est trop court pour une périodisation structurée en 4 phases (adaptation + progression + intensification + décharge). La décision de seuiller à 8 semaines est pédagogiquement correcte — en dessous, le programme est un bloc linéaire simple.

---

### P32 — buildPhases(8, 'strength')

```typescript
buildPhases(8, 'strength')
```

**Calcul pas à pas (lignes 637-639) :**

```typescript
const adapt     = 2
const deload    = totalWeeks >= 12 ? 2 : 1   // 8 < 12 → deload = 1
const intensive = totalWeeks <= 9 ? 2 : (totalWeeks >= 16 ? 4 : 3)  // 8 ≤ 9 → intensive = 2
const progress  = Math.max(1, totalWeeks - adapt - intensive - deload)
                = Math.max(1, 8 - 2 - 2 - 1) = Math.max(1, 3) = 3
```

- adapt=2, deload=1, intensive=2, progress=3
- **Total : 2+3+2+1 = 8** ✓

**Phases générées (avec `w` curseur) :**

| Phase | focus | weekStart | weekEnd | Description |
|-------|-------|-----------|---------|-------------|
| Adaptation | adaptation | 1 | 2 | Maîtrise des mouvements, charges légères, volume modéré |
| Progression | progression | 3 | 5 | Volume et charge standards, montée progressive |
| Intensification | intensification | 6 | 7 | Charges maximales, répétitions faibles |
| Décharge | deload | 8 | 8 | Récupération active, 50 % du volume habituel |

**Modificateurs `PHASE_CONFIG_BY_GOAL.strength` (lignes 599-602) :**

| Phase | setsModifier | repsOffset |
|-------|-------------|-----------|
| adaptation | -1 | +3 |
| intensification | 0 | -3 |
| deload | -2 | +4 |

**Assertions : [PASS/FAIL]**
- 4 phases retournées : **PASS**
- adaptation.weekStart=1, weekEnd=2 : **PASS**
- progression.weekStart=3, weekEnd=5 : **PASS**
- intensification.weekStart=6, weekEnd=7 : **PASS**
- deload.weekStart=8, weekEnd=8 : **PASS**
- strength adaptation : setsModifier=-1, repsOffset=+3 : **PASS** (ligne 599)
- strength intensification : setsModifier=0, repsOffset=-3 : **PASS** (ligne 601)
- strength deload : setsModifier=-2, repsOffset=+4 : **PASS** (ligne 602)

**Coach :**
- Structure 8 semaines bien dimensionnée : 3 semaines de progression avant d'intensifier est approprié. La décharge d'1 semaine est correcte pour un cycle court. La progression des charges sur 3 semaines est réaliste.

---

### P33 — buildPhases(9, 'endurance')

```typescript
buildPhases(9, 'endurance')
```

**Calcul :**

```typescript
deload    = 9 >= 12 ? 2 : 1   → 1
intensive = 9 <= 9  ? 2 : … → 2
progress  = max(1, 9 - 2 - 2 - 1) = max(1, 4) = 4
```

- adapt=2, deload=1, intensive=2, progress=4
- **Total : 2+4+2+1 = 9** ✓

**Phases générées :**

| Phase | focus | weekStart | weekEnd |
|-------|-------|-----------|---------|
| Adaptation | adaptation | 1 | 2 |
| Progression | progression | 3 | 6 |
| Intensification | intensification | 7 | 8 |
| Décharge | deload | 9 | 9 |

**Modificateurs `PHASE_CONFIG_BY_GOAL.endurance` (lignes 609-612) :**

| Phase | setsModifier | repsOffset |
|-------|-------------|-----------|
| adaptation | -1 | -2 |
| intensification | +1 | +3 |
| deload | -2 | 0 |

**Assertions : [PASS/FAIL]**
- 4 phases, somme=9 : **PASS**
- adaptation.weekEnd=2 : **PASS** | progression.weekEnd=6 : **PASS** | intensification.weekEnd=8 : **PASS**
- endurance adaptation : setsModifier=-1, repsOffset=-2 : **PASS** (ligne 609)
- endurance intensification : setsModifier=+1, repsOffset=+3 : **PASS** (ligne 611)

**Coach :**
- L'adaptation en endurance commence avec *moins* de reps (repsOffset=-2) — logique : 13 reps au lieu de 15 pour habituer les tissus avant de monter. L'intensification pousse à 18 reps (+3) avec +1 série — direction correcte pour l'endurance musculaire.

---

### P34 — buildPhases(10, 'hypertrophy')

```typescript
buildPhases(10, 'hypertrophy')
```

**Calcul :**

```typescript
deload    = 10 >= 12 ? 2 : 1  → 1
intensive = 10 <= 9 ? 2 : (10 >= 16 ? 4 : 3)  → 3  (car 10 > 9 et 10 < 16)
progress  = max(1, 10 - 2 - 3 - 1) = max(1, 4) = 4
```

- adapt=2, deload=1, intensive=3, progress=4
- **Total : 2+4+3+1 = 10** ✓

**Phases générées :**

| Phase | focus | weekStart | weekEnd |
|-------|-------|-----------|---------|
| Adaptation | adaptation | 1 | 2 |
| Progression | progression | 3 | 6 |
| Intensification | intensification | 7 | 9 |
| Décharge | deload | 10 | 10 |

**Modificateurs `PHASE_CONFIG_BY_GOAL.hypertrophy` (lignes 604-607) :**

| Phase | setsModifier | repsOffset |
|-------|-------------|-----------|
| adaptation | -1 | +2 |
| intensification | +1 | -2 |
| deload | -2 | 0 |

**Assertions : [PASS/FAIL]**
- `intensive=3` (pas 2, car 10>9) : **PASS** (ligne 638)
- progression.weekEnd=6 : **PASS** | intensification.weekStart=7, weekEnd=9 : **PASS**
- deload.weekStart=10, weekEnd=10 : **PASS**
- hypertrophy intensification : setsModifier=+1, repsOffset=-2 : **PASS** (ligne 606)

**Coach :**
- Le pivot à 10 semaines vers `intensive=3` (au lieu de 2) est important : 3 semaines d'intensification donnent le temps d'atteindre et de consolider le pic de volume dense. La réduction des reps (-2) couplée à +1 série en intensification hypertrophie est une pratique coach validée (charges plus lourdes, volume total maintenu).

---

### P35 — buildPhases(12, 'fat_loss')

```typescript
buildPhases(12, 'fat_loss')
```

**Calcul :**

```typescript
deload    = 12 >= 12 ? 2 : 1  → 2  (premier seuil ≥12)
intensive = 12 <= 9 ? 2 : (12 >= 16 ? 4 : 3)  → 3
progress  = max(1, 12 - 2 - 3 - 2) = max(1, 5) = 5
```

- adapt=2, deload=2, intensive=3, progress=5
- **Total : 2+5+3+2 = 12** ✓

**Phases générées :**

| Phase | focus | weekStart | weekEnd |
|-------|-------|-----------|---------|
| Adaptation | adaptation | 1 | 2 |
| Progression | progression | 3 | 7 |
| Intensification | intensification | 8 | 10 |
| Décharge | deload | 11 | 12 |

**Modificateurs `PHASE_CONFIG_BY_GOAL.fat_loss` (lignes 613-617) :**

| Phase | setsModifier | repsOffset |
|-------|-------------|-----------|
| adaptation | -1 | 0 |
| intensification | 0 | +3 |
| deload | -1 | 0 |

**Assertions : [PASS/FAIL]**
- deload=2 (premier seuil ≥12) : **PASS** (ligne 637)
- progression.weekStart=3, weekEnd=7 (5 semaines) : **PASS**
- deload.weekStart=11, weekEnd=12 : **PASS**
- fat_loss adaptation : setsModifier=-1, repsOffset=0 : **PASS** (ligne 614)
- fat_loss deload : setsModifier=-1, repsOffset=0 : **PASS** (ligne 616)

**Coach :**
- 2 semaines de décharge sur 12 semaines fat_loss est judicieux — la perte de poids crée un déficit calorique qui peut compromettre la récupération ; une décharge longue aide à consolider les adaptations. L'intensification fat_loss sans modifier les séries mais en augmentant les reps (+3) augmente la densité métabolique — approche cohérente avec l'objectif.

---

### P36 — buildPhases(16, 'strength')

```typescript
buildPhases(16, 'strength')
```

**Calcul :**

```typescript
deload    = 16 >= 12 ? 2 : 1  → 2
intensive = 16 <= 9 ? 2 : (16 >= 16 ? 4 : 3)  → 4  (seuil ≥16 atteint)
progress  = max(1, 16 - 2 - 4 - 2) = max(1, 8) = 8
```

- adapt=2, deload=2, intensive=4, progress=8
- **Total : 2+8+4+2 = 16** ✓

**Phases générées :**

| Phase | focus | weekStart | weekEnd |
|-------|-------|-----------|---------|
| Adaptation | adaptation | 1 | 2 |
| Progression | progression | 3 | 10 |
| Intensification | intensification | 11 | 14 |
| Décharge | deload | 15 | 16 |

**Assertions : [PASS/FAIL]**
- intensive=4 (seuil ≥16) : **PASS** (ligne 638)
- progression : 8 semaines, weekStart=3, weekEnd=10 : **PASS**
- intensification.weekStart=11, weekEnd=14 : **PASS**
- deload.weekStart=15, weekEnd=16 : **PASS**

**Coach :**
- Cycle 16 semaines = format Wendler/Sheiko classique. 8 semaines de progression linéaire avant d'intensifier est une durée appropriée pour construire des bases solides. 4 semaines d'intensification permettent plusieurs micro-cycles lourds. C'est le format le plus robuste des 5 testés.

---

### P37 — Specs finales ≥ 1 après modificateurs (tous goals × phases)

**Base specs :**
- COMPOUND_SPEC : strength{5,3}, hypertrophy{4,8}, endurance{3,15}, fat_loss{3,12}
- ISOLATION_SPEC : strength{3,5}, hypertrophy{3,10}, endurance{3,15}, fat_loss{3,12}
  (format : sets, repsMin)

**Table complète sets et repsMin après modificateurs :**

| Goal | Type | Phase | Base sets | +mod | =sets | Base repsMin | +offset | =repsMin | Valide |
|------|------|-------|-----------|------|-------|--------------|---------|----------|--------|
| strength | compound | adaptation | 5 | -1 | **4** | 3 | +3 | **6** | ✅ |
| **strength** | **compound** | **intensification** | **5** | **0** | **5** | **3** | **-3** | **0** | **⚠️ 0 reps** |
| strength | compound | deload | 5 | -2 | **3** | 3 | +4 | **7** | ✅ |
| strength | isolation | adaptation | 3 | -1 | **2** | 5 | +3 | **8** | ✅ |
| strength | isolation | intensification | 3 | 0 | **3** | 5 | -3 | **2** | ✅ |
| strength | isolation | deload | 3 | -2 | **1** | 5 | +4 | **9** | ✅ (sets=1 minimal) |
| hypertrophy | compound | adaptation | 4 | -1 | **3** | 8 | +2 | **10** | ✅ |
| hypertrophy | compound | intensification | 4 | +1 | **5** | 8 | -2 | **6** | ✅ |
| hypertrophy | compound | deload | 4 | -2 | **2** | 8 | 0 | **8** | ✅ |
| hypertrophy | isolation | adaptation | 3 | -1 | **2** | 10 | +2 | **12** | ✅ |
| hypertrophy | isolation | intensification | 3 | +1 | **4** | 10 | -2 | **8** | ✅ |
| hypertrophy | isolation | deload | 3 | -2 | **1** | 10 | 0 | **10** | ✅ (sets=1) |
| endurance | compound | adaptation | 3 | -1 | **2** | 15 | -2 | **13** | ✅ |
| endurance | compound | intensification | 3 | +1 | **4** | 15 | +3 | **18** | ✅ |
| endurance | compound | deload | 3 | -2 | **1** | 15 | 0 | **15** | ✅ (sets=1) |
| endurance | isolation | adaptation | 3 | -1 | **2** | 15 | -2 | **13** | ✅ |
| endurance | isolation | intensification | 3 | +1 | **4** | 15 | +3 | **18** | ✅ |
| endurance | isolation | deload | 3 | -2 | **1** | 15 | 0 | **15** | ✅ (sets=1) |
| fat_loss | compound | adaptation | 3 | -1 | **2** | 12 | 0 | **12** | ✅ |
| fat_loss | compound | intensification | 3 | 0 | **3** | 12 | +3 | **15** | ✅ |
| fat_loss | compound | deload | 3 | -1 | **2** | 12 | 0 | **12** | ✅ |
| fat_loss | isolation | adaptation | 3 | -1 | **2** | 12 | 0 | **12** | ✅ |
| fat_loss | isolation | intensification | 3 | 0 | **3** | 12 | +3 | **15** | ✅ |
| fat_loss | isolation | deload | 3 | -1 | **2** | 12 | 0 | **12** | ✅ |

**⚠️ Cas problématique : strength + compound + intensification → repsMin = 3 + (−3) = 0**

- Dans `programGenerator.ts`, la DraftPhase stocke `repsOffset: -3` brut — aucun garde dans le générateur lui-même.
- Selon la note BUG5 du prompt : `sessionOps.ts:140` applique `Math.max(1, …)` au moment de l'affichage/utilisation → **le bug est neutralisé en aval**.
- **Verdict BUG5 : PASS** (pas de bug réel à l'exécution, correction en aval)

**Observations coach :**
- `strength isolation deload` : sets=1 — une seule série d'isolation en décharge est très peu, mais fonctionnel (le but est la récupération active).
- `endurance/hypertrophy deload` : sets=1 pour les isolations — même remarque, acceptable pour une semaine de décharge.

---

### P38 — phaseAtLeast : logique d'ordre correct

```typescript
// Lignes 623-625
const PHASE_ORDER: Record<PhaseKey, number> = {
  adaptation: 1, progression: 2, intensification: 3, deload: 4,
}
export function phaseAtLeast(current: PhaseKey, required: PhaseKey): boolean {
  return PHASE_ORDER[current] >= PHASE_ORDER[required]
}
```

**Vérification de chaque assertion :**

| Expression | PHASE_ORDER[current] | >= | PHASE_ORDER[required] | Résultat | Attendu | PASS/FAIL |
|-----------|---------------------|----|-----------------------|----------|---------|-----------|
| phaseAtLeast('adaptation', 'adaptation') | 1 | >= | 1 | true | true | **PASS** |
| phaseAtLeast('adaptation', 'progression') | 1 | >= | 2 | false | false | **PASS** |
| phaseAtLeast('progression', 'progression') | 2 | >= | 2 | true | true | **PASS** |
| phaseAtLeast('intensification', 'progression') | 3 | >= | 2 | true | true | **PASS** |
| phaseAtLeast('progression', 'intensification') | 2 | >= | 3 | false | false | **PASS** |
| phaseAtLeast('deload', 'intensification') | 4 | >= | 3 | true | true | **PASS** |
| phaseAtLeast('intensification', 'deload') | 3 | >= | 4 | false | false | **PASS** |
| phaseAtLeast('deload', 'deload') | 4 | >= | 4 | true | true | **PASS** |

Toutes les assertions : **PASS** — La fonction est correcte.

**Coach :** L'ordre adaptation < progression < intensification < décharge est sémantiquement cohérent. La décharge comme phase 4 (la plus "avancée" dans l'ordre ordinal) est contre-intuitif pédagogiquement — elle représente la fin du cycle, pas la plus intense — mais l'implémentation est correcte pour son usage (déverrouiller des exercices/charges uniquement en phase suffisamment avancée).

---

### P39 — Cohérence wizard : phaseLabel vs buildPhases

Le wizard formate : `${durée} sem. ${nom[ph.focus]}` joint par ` · `

**Vérification des 5 cas (buildPhases() + formatage) :**

**7 semaines :**
- `buildPhases(7)` → `undefined`
- `phaseLabel(7)` = `''`
- Assertion somme : 0 (pas de phases) ✅

**8 semaines :**
- adapt=2, prog=3, intens=2, deload=1 → somme=8 ✅
- `phaseLabel(8)` = `"2 sem. adaptation · 3 sem. progression · 2 sem. intensification · 1 sem. décharge"`

**10 semaines :**
- adapt=2, prog=4, intens=3, deload=1 → somme=10 ✅
- `phaseLabel(10)` = `"2 sem. adaptation · 4 sem. progression · 3 sem. intensification · 1 sem. décharge"`

**12 semaines :**
- adapt=2, prog=5, intens=3, deload=2 → somme=12 ✅
- `phaseLabel(12)` = `"2 sem. adaptation · 5 sem. progression · 3 sem. intensification · 2 sem. décharge"`

**16 semaines :**
- adapt=2, prog=8, intens=4, deload=2 → somme=16 ✅
- `phaseLabel(16)` = `"2 sem. adaptation · 8 sem. progression · 4 sem. intensification · 2 sem. décharge"`

**Assertions : [PASS/FAIL]**
- Somme des durées = totalWeeks pour toutes les valeurs : **PASS** (5/5)
- Noms 'décharge' (pas 'deload') et 'intensification' (pas 'intensive') : **PASS** (termes français corrects)
- adapt toujours = 2 semaines dans la string, jamais 3 : **PASS** (adapt est fixé à 2 dans le code, ligne 636)

---

### P40 — fmtMod : strings GOAL_PHASES correspondent à PHASE_CONFIG_BY_GOAL

```typescript
// fmtMod(sets, reps) — logique décrite dans le prompt
// sets !== 0 → "${sets>0?'+':''}${sets} série${|sets|>1?'s':''}"
// reps !== 0 → "${reps>0?'+':''}${reps} reps"
// les deux à 0 → "Specs inchangées"
```

**Valeurs de `PHASE_CONFIG_BY_GOAL` (lignes 597-618) et strings générées :**

| Goal | Phase | setsModifier | repsOffset | String générée | Attendue | PASS/FAIL |
|------|-------|-------------|-----------|----------------|----------|-----------|
| strength | adaptation | -1 | +3 | "-1 série, +3 reps" | "-1 série, +3 reps" | **PASS** |
| strength | intensification | 0 | -3 | "-3 reps" | "-3 reps" | **PASS** |
| strength | deload | -2 | +4 | "-2 séries, +4 reps" | "-2 séries, +4 reps" | **PASS** |
| hypertrophy | adaptation | -1 | +2 | "-1 série, +2 reps" | "-1 série, +2 reps" | **PASS** |
| hypertrophy | intensification | +1 | -2 | "+1 série, -2 reps" | "+1 série, -2 reps" | **PASS** |
| hypertrophy | deload | -2 | 0 | "-2 séries" | "-2 séries" | **PASS** |
| endurance | adaptation | -1 | -2 | "-1 série, -2 reps" | "-1 série, -2 reps" | **PASS** |
| endurance | intensification | +1 | +3 | "+1 série, +3 reps" | "+1 série, +3 reps" | **PASS** |
| endurance | deload | -2 | 0 | "-2 séries" | "-2 séries" | **PASS** |
| fat_loss | adaptation | -1 | 0 | "-1 série" | "-1 série" | **PASS** |
| fat_loss | intensification | 0 | +3 | "+3 reps" | "+3 reps" | **PASS** |
| fat_loss | deload | -1 | 0 | "-1 série" | "-1 série" | **PASS** |

**Détail règles pluriel :**
- `sets=-1` → `|-1|=1` → "série" (singulier) ✅
- `sets=-2` → `|-2|=2 > 1` → "séries" (pluriel) ✅
- `sets=+1` → `|+1|=1` → "série" (singulier) ✅

**Assertions : [PASS/FAIL]**
- Toutes les strings correspondent aux numériques de `PHASE_CONFIG_BY_GOAL` (ligne 597) : **PASS** (12/12)
- Phase `progression` sans setsModifier/repsOffset → non affichée dans GOAL_PHASES : **PASS** (progression n'a pas ces champs dans `buildPhases`, seul `description` est stocké)
- `fmtMod(0, 0)` → `"Specs inchangées"` : **PASS** (cas limite préservé)

---

## Récapitulatif des assertions critiques — Groupes D & E

### Tableau de synthèse

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|--------|---------------------|---------|-------------------|
| P27 | `adjustedSlotCount(9,20)=4` → 6 exercices | ✅ PASS | CORE_SPEC non réduit (3×15+60s) pèse 5 min sur 20 min de séance ; 2×8-12 hypertrophie = volume minimal |
| P28 | `adjustedSlotCount(9,45)=6` → 8 exercices | ✅ PASS | 2×10-15 isolations = un peu court mais acceptable pour 45 min |
| P29 | `adjustedSlotCount(9,90)=min(11,8)=8` → 10 exercices ; calves élidé | ⚠️ PASS | Cap à 8 éjecte systématiquement les mollets en fullbody 90min non-strength — lacune pour un programme 90 min |
| P30 | PPL strength intermediate 3j ; `adjustedSlotCount(6,20,strength)=3` | ❌ Problème sérieux | 20 min incompatible avec repos 180s force ; 2×3-5 = volume insuffisant pour adaptations en force ; timing réel ~25 min dépasse 20 min |
| P31 | `buildPhases(7)=undefined` ; `phases:undefined` dans DraftProgram | ✅ PASS | — |
| P32 | `buildPhases(8,'strength')` : adapt=2, prog=3, intens=2, deload=1 ; phases [1-2, 3-5, 6-7, 8-8] | ✅ PASS | — |
| P33 | `buildPhases(9,'endurance')` : adapt=2, prog=4, intens=2, deload=1 ; phases [1-2, 3-6, 7-8, 9-9] | ✅ PASS | — |
| P34 | `buildPhases(10,'hypertrophy')` : intensive=3 (pas 2) ; phases [1-2, 3-6, 7-9, 10-10] | ✅ PASS | — |
| P35 | `buildPhases(12,'fat_loss')` : deload=2 (seuil ≥12) ; phases [1-2, 3-7, 8-10, 11-12] | ✅ PASS | — |
| P36 | `buildPhases(16,'strength')` : intensive=4 (seuil ≥16) ; prog=8 semaines ; phases [1-2, 3-10, 11-14, 15-16] | ✅ PASS | — |
| P37 | Tous les modificateurs testés ; strength+compound+intensification → repsMin=0 théorique | ⚠️ PASS | BUG5 neutralisé par `sessionOps.ts:140` (`Math.max(1,…)`) — jamais de repsMin=0 affiché ; strength+isolation+deload → sets=1 (acceptable en décharge mais très peu) |
| P38 | `phaseAtLeast` : 8/8 assertions correctes | ✅ PASS | — |
| P39 | phaseLabel : sommes correctes pour 7/8/10/12/16 sem. ; nomenclature française correcte | ✅ PASS | — |
| P40 | fmtMod : 12/12 strings correctes ; pluriel -1série/-2séries correct ; `fmtMod(0,0)→"Specs inchangées"` | ✅ PASS | — |

---

### Synthèse des problèmes ouverts — Groupes D & E

**Bugs / anomalies logicielles :**

1. **P30 — Durée 20 min incompatible avec objectif force** : `adjustedSlotCount` réduit correctement les slots (3 au lieu de 6), et `adjustedSpec` réduit à 2 séries — mais le code ne vérifie pas si la combinaison durée+objectif est physiquement réalisable. Avec `restSec=180s` en force, le timing réel (~25 min) dépasse la durée déclarée. **Correction recommandée** : Avertissement dans le wizard si `sessionDuration ≤ 20 && goal === 'strength'`, ou redéfinir les temps de repos minimum pour les séances strength très courtes.

2. **P27 & P30 — CORE_SPEC et WARMUP_SPEC non réduits par `adjustedSpec`** : Sur les séances 20 min, le core (3×15, 60s repos ≈ 5 min) et le warmup (2×10 ≈ 2 min) représentent 35 % du temps disponible. Ce n'est pas un bug au sens strict (comportement intentionnel), mais une incohérence de conception : les exercices de travail sont compressés mais les flancs (warmup/core) restent fixes. **Correction recommandée** : Appliquer `adjustedSpec` au CORE_SPEC pour les durées ≤ 20 min (réduire à 2×15 ou supprimer le core sur séances 20 min).

3. **P29 — Cap à 8 slots éjecte les mollets en fullbody 90 min** : `min(base+2, 8)` = 8 pour fullbody (base=9), excluant systématiquement le 9e slot (calves). En 90 min non-strength, un utilisateur peut légitimement s'attendre à 9 slots de travail. **Correction recommandée** : Passer le cap à 9 pour les durées 90 min, ou réordonner les slots fullbody pour placer calves en 8e position plutôt qu'en 9e.

**Réserves coach cumulées :**

**Thème 1 — Volume minimal en séances courtes**
- Profils concernés : P27 (2×8-12 composés), P30 (2×3-5 force)
- Pattern : `adjustedSpec` réduit les séries à 2 minimum, ce qui est acceptable pour hypertrophie mais insuffisant pour force. 2 séries de squat lourd ≠ stimulus force réel.
- Recommandation : Différencier le floor selon l'objectif (`min_sets_strength = 3`, `min_sets_hypertrophy = 2`).

**Thème 2 — Incompatibilité combinaison force × durée très courte**
- Profil concerné : P30
- Le générateur produit un programme techniquement valide mais pratiquement irréalisable (timing dépassé) sans avertissement.
- Recommandation : Validation wizard en amont — signaler à l'utilisateur que 20 min + force est une combinaison contraignante.

**Thème 3 — Mollets systématiquement exclus en fullbody 90 min**
- Profil concerné : P29
- Le cap à 8 slots est bien intentionné pour éviter la surcharge, mais pénalise un groupe musculaire non-négligeable sur la durée la plus longue du wizard.
- Recommandation : Relever le cap à 9 pour 90 min, ou traiter calves séparément.

**Thème 4 — BUG5 repsMin=0 en force intensification (neutralisé)**
- Profil concerné : P37
- Le problème brut existe dans les données (repsOffset=-3 sur base repsMin=3=0) mais est corrigé en aval. Risque : si un autre composant consomme les DraftPhase sans passer par sessionOps, il recevra repsMin=0.
- Recommandation : Ajouter un `Math.max(1, repsMin + repsOffset)` directement dans `buildPhases` ou en sortie du générateur pour rendre la donnée toujours valide à la source.
