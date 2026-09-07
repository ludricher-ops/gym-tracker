# Audit `generateProgramDraft` v4 — GROUPE A (P01–P25)

> **Périmètre** : chemin *Auto* sans `focusMuscles` (25 profils).
> **Fichier simulé** : `src/utils/programGenerator.ts` (1172 lignes, lu intégralement).
> **Numéros de ligne** : tous relatifs à `src/utils/programGenerator.ts` sauf mention contraire.
> **Exercices** : le seed `exercises-seed.json` n'est pas dans le périmètre du groupe A — les tables
> listent donc les **slots dans l'ordre** (groupes musculaires cibles), pas les exercices concrets.

## Constantes utilisées dans tout le groupe

| Objectif | Compound (l.73-78) | Isolation (l.80-85) |
|---|---|---|
| strength | 5×3-5, repos 180 s | 3×5-8, repos 120 s |
| hypertrophy | 4×8-12, repos 90 s | 3×10-15, repos 75 s |
| endurance | 3×15-20, repos 60 s | 3×15-20, repos 45 s |
| fat_loss | 3×12-15, repos 60 s | 3×12-15, repos 60 s |

- Warmup (l.88) : `2×10`, repos 0, `autoProgress=false` forcé (l.1025). **Non soumis à `adjustedSpec`** (l.1024 utilise `WARMUP_SPEC` brut).
- Core (l.89) : `3×15`, repos 60. **Non soumis à `adjustedSpec`** non plus (l.1034).
- `adjustedSpec` (l.651-655) : 60/90 min → inchangé ; 45 min → `max(2, floor(sets×0.75))` ; 20 min → `max(2, floor(sets×0.5))`.
- `reorderSlotsByFocus` (l.691-701) : `focused.size === 0` → **retour identité** (l.692). Vrai pour les 25 profils du groupe A.
- `workoutTypeFromFocus([])` → `null` (l.402) pour les 25 profils.
- Jours par défaut (l.581-586) : 2j = lun/jeu · 3j = lun/mer/ven · 4j = lun/mar/jeu/ven · 5j = lun→ven.
- Nommage : suffixe A/B/C… seulement si le **type public canonique** apparaît plusieurs fois (l.1039-1041).
- `progressStepKg` (l.789-790) : 0 pour `bodyweight` / `band` / `pullup_bar`, sinon 2.5 ; `autoProgress = progressStepKg > 0` (l.799). **C'est une propriété par exercice, pas par programme.**

## Repère de timing utilisé par le coach

Estimation : compound hypertrophie ≈ 2,2 min/série (40 s effort + 90 s repos) · isolation hypertrophie ≈ 1,75 min/série ·
compound force ≈ 3,5 min/série (repos 180 s) · isolation force ≈ 2,3 min/série · fat_loss/endurance ≈ 1,5 min/série ·
warmup ≈ 3 min · core ≈ 4,5 min.

---

### P01 — Référence baseline : beginner hypertrophy 2j

`{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:FULL, level:'beginner' }`

**Simulation :**
- Étape 1 — `workoutTypeFromFocus([])` → `null` (l.402, `focusMuscles.length === 0`).
- Étape 2 — `selectSplit` : `pref='auto'` (l.437), `focusType=null` → switch défaut `case 2` (l.548-549) → **`['fullbody-quad','fullbody-hip']`**. Le `case 2` n'a aucune condition niveau/objectif : 2j = fullbody, toujours.
- Étape 3 — `adjustedSlotCount(9, 60, 'hypertrophy')` : `isStrength=false` → branche l.637-639 → `base` = **9 slots** pour les deux séances.
- Étape 4 — specs : compound 4×8-12/90 s · isolation 3×10-15/75 s · warmup 2×10 · core 3×15.
- Noms : canon `fullbody` ×2 (l.1039) → **"Full Body A"** (lundi), **"Full Body B"** (jeudi).

**Table — Full Body A (`fullbody-quad`, SLOTS l.361-373) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup (pool rotation `[0]`) | — | 2×10 |
| 1 | quads + glutes | cmp | 4×8-12 |
| 2 | chest / chest_upper | cmp | 4×8-12 |
| 3 | back_width / back_thickness / back | cmp | 4×8-12 |
| 4 | shoulders / shoulders_front (OHP) | cmp | 4×8-12 |
| 5 | hamstrings | iso | 3×10-15 |
| 6 | shoulders_rear | iso | 3×10-15 |
| 7 | biceps | iso | 3×10-15 |
| 8 | calves | iso | 3×10-15 |
| 9 | triceps | iso | 3×10-15 |
| c | core (pool rotation `[0]`) | — | 3×15 |

**Table — Full Body B (`fullbody-hip`, SLOTS l.374-386) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup (pool rotation `[1]`) | — | 2×10 |
| 1 | hamstrings + glutes (RDL/hip thrust) | cmp | 4×8-12 |
| 2 | chest / chest_upper | cmp | 4×8-12 |
| 3 | back_width / back | cmp | 4×8-12 |
| 4 | shoulders / shoulders_front (OHP) | cmp | 4×8-12 |
| 5 | quads | iso | 3×10-15 |
| 6 | shoulders_lateral / shoulders_rear | iso | 3×10-15 |
| 7 | biceps | iso | 3×10-15 |
| 8 | calves | iso | 3×10-15 |
| 9 | triceps | iso | 3×10-15 |
| c | core (pool rotation `[1]`) | — | 3×15 |

**Assertions :**
- `workoutTypeFromFocus([])` → null : **PASS** (l.402)
- Split `['fullbody-quad','fullbody-hip']` : **PASS** (l.549)
- Noms "Full Body" / "Full Body" : **PASS** (l.609-610) — avec suffixes " A"/" B" ajoutés (l.1040) ; l'assertion du prompt omet les suffixes, le comportement réel est "Full Body A"/"Full Body B".
- 9 slots par séance : **PASS** (l.639)
- 11 exercices/séance (9 + warmup + core) : **PASS** (l.1024 + l.1034)
- Compound 4×8-12 restSec=90 / isolation 3×10-15 : **PASS** (l.75, l.82)
- `autoProgress:true`, `progressStepKg:2.5` : **PASS partiel** (l.789-790) — vrai pour barbell/dumbbell/machine/cable, **faux** pour tout exercice `bodyweight`/`pullup_bar` retenu (traction sur le slot 3, dips…) qui reçoit `progressStepKg=0` et `autoProgress=false`. Le warmup est toujours à `false` (l.1025).
- Aucun `generatorWarnings` émis : **PASS** (aucune branche l.1066-1122 déclenchée — `publicTypes.size===1` mais le type est `fullbody`, exclu l.1085).

**Coach :**
- **Équilibre musculaire** : excellent. Sur la semaine, chaque groupe est touché 2× (quads en cmp A + iso B, ischios en iso A + cmp B, pec/dos/épaules 2× cmp). Push/pull équilibré (1 cmp chest + 1 cmp dos par séance). Aucun groupe absent.
- **Cohérence objectif** : 4×8-12 sur composés, 3×10-15 sur isolations = canonique hypertrophie. Volume hebdo : ~8 séries directes/gros groupe — **plancher acceptable** pour un débutant (recommandation littérature : 10+ séries), mais c'est le prix d'une fréquence 2j.
- **Durée/contenu** : 16 séries compound × 2,2 min + 15 séries iso × 1,75 min + 7,5 min (warmup+core) ≈ **69 min** pour un créneau annoncé de 60. Dépassement ~15 %.
- **Équipement** : FULL, aucune contrainte.
- **Variété structurelle A→B** : ✅ réelle — la séance B bascule le composé jambes en hip-dominant, remplace le tirage large-spectre par un tirage vertical, et échange l'isolation ischios contre quads.
- **Couverture isolation** : biceps, triceps, mollets, épaules (rear/lat), ischios, quads couverts. Manquent : isolation pectorale (fly) et isolation dorsale — acceptable, les composés couvrent.
- **Verdict global** : ✅ Bon programme — la meilleure structure possible à 2 séances/semaine. Réserve : ~69 min réels vs 60 annoncés.

---

### P02 — Beginner hypertrophy 3j

`{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner' }`

**Simulation :**
- Étape 1 — `workoutTypeFromFocus([])` → `null` (l.402).
- Étape 2 — `case 3` (l.551) : `isMass=true` (l.435) mais `level==='beginner'` → la condition l.553 (`isMass && level !== 'beginner'`) **échoue** ; l.555 (`!isMass && …`) échoue aussi → chute sur le `return` l.557 → **`['fullbody-quad','fullbody-hip','fullbody-quad']`**.
- Étape 3 — `adjustedSlotCount(9, 60, 'hypertrophy')` = 9 pour les trois séances (l.639).
- Étape 4 — compound 4×8-12/90 · isolation 3×10-15/75.
- Noms : canon `fullbody` ×3 → **"Full Body A" (lun) / "Full Body B" (mer) / "Full Body C" (ven)**.

**Table — Full Body A et C (`fullbody-quad`) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup (rotation `[0]` en A, `[2]` en C) | — | 2×10 |
| 1 | quads + glutes | cmp | 4×8-12 |
| 2 | chest / chest_upper | cmp | 4×8-12 |
| 3 | back_width / back_thickness / back | cmp | 4×8-12 |
| 4 | shoulders / shoulders_front | cmp | 4×8-12 |
| 5 | hamstrings | iso | 3×10-15 |
| 6 | shoulders_rear | iso | 3×10-15 |
| 7 | biceps | iso | 3×10-15 |
| 8 | calves | iso | 3×10-15 |
| 9 | triceps | iso | 3×10-15 |
| c | core (rotation `[0]` / `[2]`) | — | 3×15 |

**Table — Full Body B (`fullbody-hip`) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup (rotation `[1]`) | — | 2×10 |
| 1 | hamstrings + glutes | cmp | 4×8-12 |
| 2 | chest / chest_upper | cmp | 4×8-12 |
| 3 | back_width / back | cmp | 4×8-12 |
| 4 | shoulders / shoulders_front | cmp | 4×8-12 |
| 5 | quads | iso | 3×10-15 |
| 6 | shoulders_lateral / shoulders_rear | iso | 3×10-15 |
| 7 | biceps | iso | 3×10-15 |
| 8 | calves | iso | 3×10-15 |
| 9 | triceps | iso | 3×10-15 |
| c | core (rotation `[1]`) | — | 3×15 |

**Assertions :**
- beginner + isMass → fullbody×3, **jamais PPL** : **PASS** (l.553 exige `level !== 'beginner'` ; fallback l.557)
- Noms "Full Body" ×3 avec suffixes A/B/C : **PASS** (l.1040, `totalOfType=3`)
- Séances A et C structurellement identiques : **PASS** — même clé `SLOTS['fullbody-quad']`, aucun réordonnancement (l.692).
- Séance B différente (ham/glutes en cmp 1) : **PASS** (l.376)
- Exercices différents entre A et C malgré `level='beginner'` : **PASS** — `pickExercise` reste déterministe (`candidates[0]`, l.781) mais le tri place les exercices **non utilisés globalement avant les utilisés** (l.773-776) : la séance C ne peut pas reprendre le choix de la séance A tant qu'un candidat frais existe.

**Coach :**
- **Équilibre musculaire** : chaque groupe touché 3× par semaine (fréquence idéale débutant). Push/pull 1:1 par séance. Quads 2× cmp + 1× iso, ischios 1× cmp + 2× iso — léger biais quad-dominant sur 3 séances (A/B/A), acceptable.
- **Cohérence objectif** : ~12 séries/gros groupe/semaine — zone optimale hypertrophie débutant.
- **Durée/contenu** : ≈ 69 min réels par séance pour 60 annoncés (même calcul que P01). Dépassement systématique.
- **Équipement** : FULL, aucune contrainte.
- **Variété structurelle** : ⚠️ **Variété d'exercices seulement entre A et C** (slots strictement identiques, même ordre). Variété structurelle réelle uniquement A→B.
- **Couverture isolation** : ✅ complète pour les groupes attendus (ischios/quads, épaules rear+lat, bi, tri, mollets). Pas d'isolation pec ni dos, ce qui est cohérent en fullbody.
- **Réponse à la question du prompt** : oui, fullbody×3 est préférable à PPL pour un débutant — fréquence 3×/groupe, plus de répétitions techniques par pattern, et récupération suffisante à ce niveau de charge.
- **Verdict global** : ✅ Bon programme. Réserve : timing 60 min sous-estimé + A/C non différenciées structurellement.

---

### P03 — Beginner strength 3j → fullbody×3 (pas PPL)

`{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:BB+DB, level:'beginner' }`

**Simulation :**
- Étape 1 — `null` (l.402).
- Étape 2 — `isMass=true` (strength, l.435), `level='beginner'` → l.553 échoue, l.555 échoue → l.557 → **`['fullbody-quad','fullbody-hip','fullbody-quad']`**.
- Étape 3 — `adjustedSlotCount(9, 60, 'strength')` : `isStrength=true` → l.638 → `max(4, floor(9×0.5)) = max(4, 4)` = **4 slots**.
- Étape 4 — `adjustedSpec(spec, 60)` → inchangé (l.652). Compound 5×3-5/180 s (l.74).
- Noms : "Full Body A / B / C".

**Table — Full Body A et C (`fullbody-quad`, 4 premiers slots) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads + glutes (squat barre) | cmp | 5×3-5 |
| 2 | chest / chest_upper (développé couché) | cmp | 5×3-5 |
| 3 | back_width / back_thickness / back (rowing barre) | cmp | 5×3-5 |
| 4 | shoulders / shoulders_front (OHP) | cmp | 5×3-5 |
| c | core | — | 3×15 |

**Table — Full Body B (`fullbody-hip`, 4 premiers slots) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | hamstrings + glutes (soulevé de terre / RDL) | cmp | 5×3-5 |
| 2 | chest / chest_upper | cmp | 5×3-5 |
| 3 | back_width / back (**risque de slot vide en BB+DB**) | cmp | 5×3-5 |
| 4 | shoulders / shoulders_front | cmp | 5×3-5 |
| c | core | — | 3×15 |

**Assertions :**
- Split `['fullbody-quad','fullbody-hip','fullbody-quad']`, jamais PPL : **PASS** (l.557)
- `adjustedSlotCount(9,60,'strength') = 4` : **PASS** (l.638)
- 6 exercices/séance (4 + warmup + core) : **PASS**
- Compound strength 5×3-5, restSec=180 : **PASS** (l.74)
- `adjustedSpec` inchangé à 60 min : **PASS** (l.652)
- Squat + bench + deadlift tous présents dans les 4 slots : **PASS au niveau semaine, FAIL au niveau séance** — la séance A/C contient squat + bench (+ rowing + OHP) mais **pas de soulevé de terre** ; le deadlift n'apparaît qu'en séance B via le slot `hamstrings+glutes` (l.376). Sur la semaine les trois mouvements sont couverts.
- Warning "Force pour débutant" en tête des `generatorWarnings` : **PASS** (l.1066-1071).
- ⚠️ **Risque de slot vide non couvert par l'assertion** : `fullbody-hip` slot 3 = `['back_width','back']` uniquement (l.378). En BB+DB, sans `pullup_bar` ni `cable`/`machine`, un composé `primaryMuscle='back_width'` est improbable (le rowing barre est `back_thickness`) → `pickExercise` retourne `null` (l.745) → warning "Aucun exercice composé disponible pour dos (largeur)" (l.1002) et la séance B tombe à **5 exercices**. À confirmer sur le seed.

**Coach :**
- **Équilibre musculaire** : sur 3 séances, 6 poussées (2 bench + 2 OHP par cycle A/B/A ×…) contre 3 tirages seulement — et si le slot dos de la séance B est vide, **2 tirages pour 6 poussées**. Ratio push/pull dégradé, sans face pull ni écarté arrière (les isolations sont toutes coupées par le passage à 4 slots).
- **Cohérence objectif** : 5×3-5 à 180 s = force pure, correct pour l'objectif — mais discutable pour un débutant, ce que le générateur signale explicitement (l.1067).
- **Durée/contenu** : 4 composés × 5 séries × ~3,5 min = **70 min** + warmup + core ≈ **78 min** pour un créneau de 60. **Dépassement franc (~30 %)** malgré le barème force réduit. Le commentaire l.620 ("4 slots ≈ 65-70 min effectifs") sous-estime l'échauffement spécifique nécessaire en force.
- **Équipement** : BB+DB — la priorité barbell (`strengthEquipmentPrio`, l.707-719, appliquée l.769-772 sur les slots compound) sélectionne bien la barre pour squat/bench/rowing/OHP. Optimal.
- **Variété structurelle** : ⚠️ A et C identiques ; A→B ne change que le premier slot (squat → deadlift). Sur 4 slots, la variation structurelle est minimale.
- **Couverture isolation** : ❌ **aucune isolation dans le programme** — biceps, triceps, mollets, épaules postérieures totalement absents sur la semaine. Défendable en force pure débutant, mais l'absence de travail épaule postérieure/rotateurs face à 6 poussées hebdo est un facteur de risque épaule à moyen terme.
- **Verdict global** : ⚠️ Problème mineur à sérieux — timing sous-estimé, ratio push/pull dégradé, risque de slot dos vide en BB+DB.

---

### P04 — Beginner fat_loss 3j → fullbody×3

`{ goal:'fat_loss', daysPerWeek:3, sessionDuration:60, equipment:HOME, level:'beginner' }`

**Simulation :**
- Étape 1 — `null` (l.402).
- Étape 2 — `isMass=false` (fat_loss, l.435), `level='beginner'` → l.553 échoue (isMass faux), l.555 échoue (`level !== 'beginner'` faux) → l.557 → **`['fullbody-quad','fullbody-hip','fullbody-quad']`**. Même split que P03 : la branche beginner est atteinte par défaut, `isMass` n'y joue aucun rôle.
- Étape 3 — `adjustedSlotCount(9, 60, 'fat_loss')` = **9 slots** (l.639, non-strength).
- Étape 4 — compound 3×12-15/60 s (l.77) · isolation 3×12-15/60 s (l.84) — mêmes séries et mêmes repos pour les deux catégories.
- Noms : "Full Body A / B / C".

**Table — Full Body A et C (`fullbody-quad`) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads + glutes (goblet squat KB/DB) | cmp | 3×12-15 |
| 2 | chest / chest_upper (développé DB, pompes) | cmp | 3×12-15 |
| 3 | back_width / back_thickness / back (rowing DB) | cmp | 3×12-15 |
| 4 | shoulders / shoulders_front (OHP DB) | cmp | 3×12-15 |
| 5 | hamstrings | iso | 3×12-15 |
| 6 | shoulders_rear | iso | 3×12-15 |
| 7 | biceps | iso | 3×12-15 |
| 8 | calves | iso | 3×12-15 |
| 9 | triceps | iso | 3×12-15 |
| c | core | — | 3×15 |

**Table — Full Body B (`fullbody-hip`) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | hamstrings + glutes (KB swing / RDL DB / hip thrust) | cmp | 3×12-15 |
| 2 | chest / chest_upper | cmp | 3×12-15 |
| 3 | back_width / back (**risque de slot vide en HOME**) | cmp | 3×12-15 |
| 4 | shoulders / shoulders_front | cmp | 3×12-15 |
| 5 | quads | iso | 3×12-15 |
| 6 | shoulders_lateral / shoulders_rear | iso | 3×12-15 |
| 7 | biceps | iso | 3×12-15 |
| 8 | calves | iso | 3×12-15 |
| 9 | triceps | iso | 3×12-15 |
| c | core | — | 3×15 |

**Assertions :**
- `isMass=false` + beginner → fullbody×3, même split que P03 : **PASS** (l.557 — branche terminale commune)
- `adjustedSlotCount(9,60,'fat_loss') = 9` : **PASS** (l.639)
- HOME sans barbell ni pullup_bar : **PASS** (filtrage l.941-944)
- Compound fat_loss 3×12-15 restSec=60 : **PASS** (l.77)
- `progressStepKg` : **2.5** pour dumbbell/kettlebell, **0** pour band/bodyweight (l.789-790) — le programme sera donc mixte auto/non-auto.
- ⚠️ Slot 3 de `fullbody-hip` = `['back_width','back']` (l.378) : en HOME, un composé `back_width` n'existe probablement pas (le rowing DB/KB est `back_thickness`) → slot vide + warning (l.1002). Séance B à 10 exercices au lieu de 11.

**Coach :**
- **Équilibre musculaire** : bon sur A/C. Sur B, si le slot dos large est vide, la séance devient déséquilibrée en faveur de la poussée (bench + OHP contre zéro tirage).
- **Cohérence objectif** : 3×12-15 à 60 s de repos = densité correcte pour du fat_loss. En revanche `HOME` ne contient **aucun `cardio_machine`** : le générateur ne produit **aucun travail cardio** — le déficit énergétique repose entièrement sur la densité de la musculation et sur l'alimentation. Le KB swing peut apparaître sur le slot 1 de la séance B (`hamstrings+glutes`, compound) et c'est le seul candidat vraiment "métabolique" du programme.
- **Volume** : 9 slots × 3 séries = 27 séries + core, 3×/semaine ≈ 81 séries hebdo. Élevé pour un débutant, mais les charges HOME sont légères.
- **Durée/contenu** : 27 séries × ~1,5 min + 7,5 min ≈ **48 min**. Tient largement dans les 60 min — c'est le seul cas du groupe où le créneau est respecté avec marge (voire sous-rempli : ~12 min disponibles qui pourraient accueillir un finisher cardio).
- **Équipement** : respecté (l.941-944). Exploitation correcte, sauf le trou `back_width`.
- **Variété structurelle** : ⚠️ A/C identiques, A→B différenciée.
- **Couverture isolation** : ✅ complète (ischios/quads, épaules, bi, tri, mollets).
- **Verdict global** : ⚠️ Problème mineur — absence totale de composante cardio pour un objectif fat_loss + risque de slot dos vide en séance B.

---

### P05 — Beginner endurance 3j → fullbody×3 (invariant beginner)

`{ goal:'endurance', daysPerWeek:3, sessionDuration:60, equipment:BW+BAR, level:'beginner' }`

**Simulation :**
- Étape 1 — `null` (l.402).
- Étape 2 — `isMass=false`, beginner → l.557 → **`['fullbody-quad','fullbody-hip','fullbody-quad']`**. Invariant confirmé : les quatre objectifs (P02 hypertrophy, P03 strength, P04 fat_loss, P05 endurance) convergent vers la même ligne 557 dès que `level==='beginner'` à 3j.
- Étape 3 — `adjustedSlotCount(9, 60, 'endurance')` = **9 slots**.
- Étape 4 — compound 3×15-20/60 s (l.76) · isolation 3×15-20/45 s (l.83).
- Noms : "Full Body A / B / C".

**Table — Full Body A et C (`fullbody-quad`) :**

| # | Slot muscles | Cat | Séries×Reps | Candidat BW+BAR attendu |
|---|---|---|---|---|
| w | warmup | — | 2×10 | bodyweight |
| 1 | quads + glutes | cmp | 3×15-20 | squat BW / fente |
| 2 | chest / chest_upper | cmp | 3×15-20 | pompes |
| 3 | back_width / back_thickness / back | cmp | 3×15-20 | `seed-pullup` (back_width) ✓ |
| 4 | shoulders / shoulders_front | cmp | 3×15-20 | pike push-up (à confirmer) |
| 5 | hamstrings | iso | 3×15-20 | `bw-nordic-curl` par repli compound |
| 6 | shoulders_rear | iso | 3×15-20 | **probablement vide** |
| 7 | biceps | iso | 3×15-20 | `bw-chinup` par repli compound |
| 8 | calves | iso | 3×15-20 | calf raise BW |
| 9 | triceps | iso | 3×15-20 | `seed-triceps-dips` par repli compound |
| c | core | — | 3×15 | `seed-hanging-leg-raise` / gainage |

**Table — Full Body B (`fullbody-hip`) :**

| # | Slot muscles | Cat | Séries×Reps | Candidat BW+BAR attendu |
|---|---|---|---|---|
| w | warmup | — | 2×10 | bodyweight |
| 1 | hamstrings + glutes | cmp | 3×15-20 | nordic curl / hip thrust BW |
| 2 | chest / chest_upper | cmp | 3×15-20 | `seed-dips` (chest_lower) ou pompes inclinées |
| 3 | back_width / back | cmp | 3×15-20 | `seed-pullup` ✓ |
| 4 | shoulders / shoulders_front | cmp | 3×15-20 | pike push-up |
| 5 | quads | iso | 3×15-20 | fente / sissy squat |
| 6 | shoulders_lateral / shoulders_rear | iso | 3×15-20 | **probablement vide** |
| 7 | biceps | iso | 3×15-20 | `bw-chinup` |
| 8 | calves | iso | 3×15-20 | calf raise BW |
| 9 | triceps | iso | 3×15-20 | dips triceps |
| c | core | — | 3×15 | gainage |

**Assertions :**
- Invariant beginner 3j → fullbody×3 quel que soit l'objectif : **PASS** (l.557)
- Slot `back_width` → `seed-pullup` (pullup_bar) : **PASS** (candidat unique compound `back_width` de l'inventaire BW+BAR)
- Slot biceps → `bw-chinup` : **PASS avec nuance** — le slot est `compound:false` (l.370) ; `pickExercise` cherche d'abord une isolation (l.749-750), n'en trouve aucune en BW+BAR, et **conserve alors les candidats compound** (pas de `return null` pour un slot isolation) → chinup retenu. Mais s'il a déjà été consommé dans la même séance il est exclu (l.734).
- Specs endurance 3×15-20 : **PASS** (l.76, l.83 — restSec 60 en compound / 45 en isolation)
- `autoProgress:false`, `progressStepKg:0` : **PASS** (l.790, tous les exercices sont `bodyweight` ou `pullup_bar`)
- ⚠️ **Slots isolation vides silencieux** : `shoulders_rear` (A et C), `shoulders_lateral/shoulders_rear` (B) n'ont aucun candidat en BW+BAR. `pickExercise` retourne `null`, et le `continue` l.1007 ne produit **aucun warning** car le slot n'est pas compound (garde l.996). Les séances descendent silencieusement à 10 exercices.

**Coach :**
- **Équilibre musculaire** : traction 2× par séance en pratique (pull-up + chin-up), pompes/dips en poussée — ratio correct. Mais **zéro travail d'épaule postérieure** dans tout le programme (slots vides) alors que le volume de poussée est élevé : c'est la lacune structurelle du preset calisthenics.
- **Cohérence objectif** : 3×15-20 est cohérent avec l'endurance musculaire. **Mais** : 15-20 répétitions de traction pour un débutant est irréaliste (un débutant en fait 0 à 3). Le générateur ne module pas les répétitions selon la difficulté relative de l'exercice au poids du corps. C'est le principal défaut sportif de ce profil.
- **Progressivité** : `autoProgress=false` partout → aucune progression proposée par l'app. En calisthenics la progression passe par la variante (traction assistée → négative → complète → lestée), non modélisée par le générateur.
- **Durée/contenu** : 27 séries × ~1,5 min + 7,5 min ≈ **48 min**, tient dans 60 min.
- **Variété structurelle** : ⚠️ A/C identiques ; A→B différenciée (hip-dominant, tirage vertical strict).
- **Couverture isolation** : ❌ lacunes problématiques — épaules latérales et postérieures sans aucun candidat, ischios/triceps/biceps couverts uniquement par repli sur des composés déjà utilisés.
- **Verdict global** : ⚠️ Problème mineur côté code (comportement conforme), ❌ problème sportif : cible de répétitions inatteignable pour un débutant sur les tractions.

---

### P06 — Intermediate hypertrophy 3j → PPL

`{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'intermediate' }`

**Simulation :**
- Étape 1 — `null` (l.402).
- Étape 2 — `isMass=true`, `level='intermediate'` → condition l.553 vraie → **`['push','pull','legs']`**.
- Étape 3 — `adjustedSlotCount(6, 60, 'hypertrophy')` = **6 slots** pour chacune des 3 séances (l.639).
- Étape 4 — compound 4×8-12/90 · isolation 3×10-15/75.
- Noms : canon `push` / `pull` / `legs`, 1 occurrence chacun → **aucun suffixe** : "Push — Poussée", "Pull — Tirage", "Legs — Jambes" (l.591-593).
- `level='intermediate'` → `pickExercise` tire au hasard dans le **top-3** (l.782-783) : sélection non déterministe.

**Table — Push (SLOTS l.132-139) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | chest / chest_upper / chest_lower | cmp | 4×8-12 |
| 2 | shoulders / shoulders_front (OHP) | cmp | 4×8-12 |
| 3 | chest / chest_upper / chest_lower | iso | 3×10-15 |
| 4 | triceps | iso | 3×10-15 |
| 5 | shoulders_lateral / shoulders | iso | 3×10-15 |
| 6 | shoulders_rear | iso | 3×10-15 |
| c | core | — | 3×15 |

**Table — Pull (SLOTS l.140-147) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | back_width / back | cmp | 4×8-12 |
| 2 | back_thickness / back | cmp | 4×8-12 |
| 3 | back_thickness / back_width / back | iso | 3×10-15 |
| 4 | biceps | iso | 3×10-15 |
| 5 | shoulders_rear | iso | 3×10-15 |
| 6 | forearms | iso | 3×10-15 |
| c | core | — | 3×15 |

**Table — Legs (SLOTS l.148-155) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads | cmp | 4×8-12 |
| 2 | hamstrings + glutes | cmp | 4×8-12 |
| 3 | quads | iso | 3×10-15 |
| 4 | glutes | iso | 3×10-15 |
| 5 | hamstrings | iso | 3×10-15 |
| 6 | calves | iso | 3×10-15 |
| c | core | — | 3×15 |

**Assertions :**
- `isMass && level !== 'beginner'` → PPL : **PASS** (l.553)
- Noms "Push — Poussée" / "Pull — Tirage" / "Legs — Jambes" sans suffixe : **PASS** (l.591-593 + l.1040, `totalOfType=1`)
- 6 slots par séance : **PASS** (l.639)
- Compound 4×8-12 restSec=90 : **PASS** (l.75)
- 8 exercices par séance : **PASS**

**Coach :**
- **Équilibre musculaire** : ✅ excellent au sein de la semaine — 2 composés poussée vs 2 composés tirage, épaules postérieures travaillées 2× (push slot 6 + pull slot 5). Jambes complètes (quad + chaîne postérieure + mollets).
- **Cohérence objectif** : specs canoniques. **Mais fréquence 1×/groupe/semaine** — sous-optimal pour l'hypertrophie chez un intermédiaire (méta-analyses : 2×/semaine supérieur à volume égal). Volume par séance : seulement 8 séries pectoraux, 8 séries dos, 8 séries quads — insuffisant pour compenser la fréquence basse.
- **Durée/contenu** : 8 séries cmp × 2,2 + 12 séries iso × 1,75 + 7,5 ≈ **46 min** pour 60 annoncés. **Sous-remplissage de ~14 min** — l'inverse exact du problème fullbody (P01-P02 à 69 min). Les bases de slots (6 pour push/pull/legs, 9 pour fullbody) ne sont pas calibrées sur un budget temps commun.
- **Récupération** : lun/mer/ven → 48 h entre séances, très confortable puisque chaque groupe n'est sollicité qu'une fois.
- **Variété structurelle** : ✅ trois séances totalement distinctes.
- **Couverture isolation** : ✅ complète — pec, tri, deltoïde latéral et postérieur en push ; dos, bi, rear, avant-bras en pull ; quads, fessiers, ischios, mollets en legs.
- **Verdict global** : ⚠️ Problème mineur — structure irréprochable mais fréquence 1×/groupe et créneau 60 min sous-exploité. Un PPL 3j gagnerait à passer à 8 slots (base) pour remplir le créneau.

---

### P07 — Intermediate strength 3j → PPL (isMass=true)

`{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:BB+DB, level:'intermediate' }`

**Simulation :**
- Étape 1 — `null` (l.402).
- Étape 2 — `isMass = (goal==='strength' || goal==='hypertrophy')` → **true** (l.435) ; `level='intermediate'` → l.553 → **`['push','pull','legs']`**. C'est bien PPL et non PPF : la bascule PPF (l.555) exige `!isMass`, ce que `strength` ne satisfait pas.
- Étape 3 — `adjustedSlotCount(6, 60, 'strength')` = `max(4, floor(3))` = **4 slots** par séance (l.638).
- Étape 4 — compound 5×3-5/180 (l.74) · isolation 3×5-8/120 (l.81). `adjustedSpec` inchangé à 60 min.
- `strengthEquipmentPrio` (l.707-719) appliqué **uniquement aux slots compound** (garde `goal==='strength' && slot.compound`, l.769) → barbell prioritaire sur dumbbell.

**Table — Push (4 premiers slots) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | chest / chest_upper / chest_lower (bench barre) | cmp | 5×3-5 |
| 2 | shoulders / shoulders_front (OHP barre) | cmp | 5×3-5 |
| 3 | chest (isolation, fly) | iso | 3×5-8 |
| 4 | triceps | iso | 3×5-8 |
| c | core | — | 3×15 |

**Table — Pull (4 premiers slots) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | back_width / back (**risque de slot vide en BB+DB**) | cmp | 5×3-5 |
| 2 | back_thickness / back (rowing barre) | cmp | 5×3-5 |
| 3 | back_thickness / back_width / back | iso | 3×5-8 |
| 4 | biceps | iso | 3×5-8 |
| c | core | — | 3×15 |

**Table — Legs (4 premiers slots) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads (squat barre) | cmp | 5×3-5 |
| 2 | hamstrings + glutes (soulevé de terre / RDL) | cmp | 5×3-5 |
| 3 | quads (leg extension — absent en BB+DB → probablement vide) | iso | 3×5-8 |
| 4 | glutes | iso | 3×5-8 |
| c | core | — | 3×15 |

**Assertions :**
- strength → isMass=true → PPL (pas PPF) : **PASS** (l.435 + l.553)
- `adjustedSlotCount(6,60,'strength') = 4` : **PASS** (l.638)
- Compound strength 5×3-5, restSec=180 : **PASS** (l.74)
- Barbell prioritaire sur dumbbell pour les composés : **PASS** (l.769-772 + l.708-710) — **mais uniquement pour les slots compound** ; les isolations ignorent `strengthEquipmentPrio`.
- ⚠️ Slot 1 de Pull = `['back_width','back']` (l.141) : en BB+DB, aucun composé `back_width` probable (pas de traction ni de tirage vertical) → `null` (l.745) → warning "Aucun exercice composé disponible pour dos (largeur)" (l.1002), séance Pull à **5 exercices**.

**Coach :**
- **Équilibre musculaire** : sur la semaine, 2 composés de poussée contre 1 à 2 composés de tirage (selon le slot `back_width`). Épaules postérieures et avant-bras éjectés par la coupe à 4 slots. Ratio push/pull tendu.
- **Cohérence objectif** : bench/OHP/squat/deadlift en 5×3-5 barre = canonique. En revanche **les slots 3 et 4 sont des isolations à 3×5-8** : un fly à 5 répétitions lourdes ou une extension triceps à 5 reps est contre-indiqué (articulation en position vulnérable, bénéfice de force nul). `ISOLATION_SPEC.strength` (l.81) devrait plutôt être 3×8-12.
- **Volume force** : 2 composés lourds par groupe et par semaine seulement — insuffisant pour un intermédiaire cherchant à progresser en force (référence : 3 à 5 séances lourdes par mouvement principal et par semaine sur les programmes 5×5 / Texas Method).
- **Durée/contenu** : 10 séries cmp × 3,5 + 6 séries iso × 2,3 + 7,5 ≈ **56 min**. Cohérent avec les 60 min annoncés — c'est le seul cas "force" du groupe qui tient dans le créneau.
- **Variété structurelle** : ✅ trois séances distinctes.
- **Couverture isolation** : ⚠️ lacunes acceptables en force (pas de rear delt, ni mollets, ni avant-bras), mais les 2 isolations conservées sont mal spécifiées (3×5-8).
- **Verdict global** : ⚠️ Problème mineur — split correct, mais `ISOLATION_SPEC.strength` inadapté et risque de slot dos vide.
---

### P08 — Intermediate fat_loss 3j → PPF (push/pull/fullbody)

`{ goal:'fat_loss', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'intermediate' }`

**Simulation :**
- Étape 1 — `null` (l.402).
- Étape 2 — `isMass=false` (fat_loss n'est ni strength ni hypertrophy, l.435), `level='intermediate'` → l.553 échoue, **l.555 vraie** → **`['push','pull','fullbody-quad']`** (PPF).
- Étape 3 — `adjustedSlotCount(6, 60, 'fat_loss')` = **6** (push, pull) ; `adjustedSlotCount(9, 60, 'fat_loss')` = **9** (fullbody-quad). Ligne 639.
- Étape 4 — compound 3×12-15/60 (l.77) · isolation 3×12-15/60 (l.84).
- Noms : `push` ×1, `pull` ×1, `fullbody` ×1 → aucun suffixe → "Push — Poussée" / "Pull — Tirage" / "Full Body".

**Table — Push :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | chest / chest_upper / chest_lower | cmp | 3×12-15 |
| 2 | shoulders / shoulders_front | cmp | 3×12-15 |
| 3 | chest (fly) | iso | 3×12-15 |
| 4 | triceps | iso | 3×12-15 |
| 5 | shoulders_lateral / shoulders | iso | 3×12-15 |
| 6 | shoulders_rear | iso | 3×12-15 |
| c | core | — | 3×15 |

**Table — Pull :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | back_width / back | cmp | 3×12-15 |
| 2 | back_thickness / back | cmp | 3×12-15 |
| 3 | back_thickness / back_width / back | iso | 3×12-15 |
| 4 | biceps | iso | 3×12-15 |
| 5 | shoulders_rear | iso | 3×12-15 |
| 6 | forearms | iso | 3×12-15 |
| c | core | — | 3×15 |

**Table — Full Body (`fullbody-quad`) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads + glutes | cmp | 3×12-15 |
| 2 | chest / chest_upper | cmp | 3×12-15 |
| 3 | back_width / back_thickness / back | cmp | 3×12-15 |
| 4 | shoulders / shoulders_front | cmp | 3×12-15 |
| 5 | hamstrings | iso | 3×12-15 |
| 6 | shoulders_rear | iso | 3×12-15 |
| 7 | biceps | iso | 3×12-15 |
| 8 | calves | iso | 3×12-15 |
| 9 | triceps | iso | 3×12-15 |
| c | core | — | 3×15 |

**Assertions :**
- `!isMass && level !== 'beginner'` → PPF : **PASS** (l.555)
- Jamais PPL pour fat_loss intermediate 3j : **PASS** — l.553 exige `isMass`.
- Noms "Push — Poussée" / "Pull — Tirage" / "Full Body" : **PASS** (l.591, 592, 609)
- fullbody-quad = 9 slots : **PASS** (l.639)
- Push/Pull = 8 exercices, Full Body = 11 exercices : **PASS**

**Coach :**
- **Équilibre musculaire** : ⚠️ **déséquilibre jambes** — les quadriceps et la chaîne postérieure ne sont travaillés que dans la 3ᵉ séance (1 composé quad + 1 isolation ischios), soit ~6 séries/semaine contre ~15 pour le haut du corps. Sur un objectif fat_loss, où les gros groupes sont les plus rentables en dépense énergétique, c'est le contraire de l'optimum.
- **Cohérence objectif** : 3×12-15 à 60 s partout = format circuit correct. Mais aucune séance ni aucun slot cardio n'est généré, alors que `FULL` **contient `cardio_machine`** : le générateur n'utilise jamais cet équipement (aucun slot ne cible un muscle qu'un cardio_machine porterait, et `strengthEquipmentPrio` le déclasse explicitement l.716). Le préréglage "Salle" promet du cardio que le programme n'exploite pas.
- **Durée/contenu** : Push/Pull ≈ 6 slots × 3 séries × 1,5 min + 7,5 ≈ **35 min** pour 60 annoncés — très sous-rempli. Full Body ≈ **48 min**. Le créneau fat_loss laisse 12 à 25 min inutilisés qui devraient accueillir un finisher cardio.
- **Réponse à la question du prompt** : oui, la séance fullbody de fin de semaine donne un stimulus complet et rattrape partiellement le déficit jambes, mais un seul composé quad hebdomadaire reste faible.
- **Variété structurelle** : ✅ trois séances distinctes.
- **Couverture isolation** : ✅ haut du corps complet ; ⚠️ bas du corps : pas d'isolation quads, ni fessiers, ni mollets sauf via fullbody (mollets présents, fessiers absents).
- **Verdict global** : ⚠️ Problème mineur — volume jambes faible et créneau largement sous-exploité pour un objectif de dépense énergétique.

---

### P09 — Intermediate endurance 3j → PPF

`{ goal:'endurance', daysPerWeek:3, sessionDuration:60, equipment:BW+BAR, level:'intermediate' }`

**Simulation :**
- Étape 1 — `null` (l.402).
- Étape 2 — `isMass=false` (endurance), `level='intermediate'` → **l.555** → **`['push','pull','fullbody-quad']`**. Split strictement identique à P08 : la ligne 555 ne distingue pas `fat_loss` de `endurance`.
- Étape 3 — 6 / 6 / 9 slots (l.639).
- Étape 4 — compound 3×15-20/60 (l.76) · isolation 3×15-20/45 (l.83).
- Noms : "Push — Poussée" / "Pull — Tirage" / "Full Body".
- `level='intermediate'` → tirage aléatoire top-3 (l.782-783), mais en BW+BAR le pool est si étroit que le tirage est souvent dégénéré (1 seul candidat).

**Table — Push (BW+BAR) :**

| # | Slot muscles | Cat | Séries×Reps | Candidat attendu |
|---|---|---|---|---|
| w | warmup | — | 2×10 | bodyweight |
| 1 | chest / chest_upper / chest_lower | cmp | 3×15-20 | pompes / `seed-dips` |
| 2 | shoulders / shoulders_front | cmp | 3×15-20 | pike push-up (à confirmer) |
| 3 | chest (isolation) | iso | 3×15-20 | repli compound (pompes 2ᵉ variante) |
| 4 | triceps | iso | 3×15-20 | `seed-triceps-dips` (repli compound) |
| 5 | shoulders_lateral / shoulders | iso | 3×15-20 | **probablement vide** |
| 6 | shoulders_rear | iso | 3×15-20 | **probablement vide** |
| c | core | — | 3×15 | `seed-hanging-leg-raise` |

**Table — Pull (BW+BAR) :**

| # | Slot muscles | Cat | Séries×Reps | Candidat attendu |
|---|---|---|---|---|
| w | warmup | — | 2×10 | bodyweight |
| 1 | back_width / back | cmp | 3×15-20 | `seed-pullup` ✓ |
| 2 | back_thickness / back | cmp | 3×15-20 | `bw-inverted-row` ✓ |
| 3 | back_thickness / back_width / back | iso | 3×15-20 | repli compound (2ᵉ variante) ou vide |
| 4 | biceps | iso | 3×15-20 | `bw-chinup` (repli compound) |
| 5 | shoulders_rear | iso | 3×15-20 | **probablement vide** |
| 6 | forearms | iso | 3×15-20 | **probablement vide** (dead hang si présent) |
| c | core | — | 3×15 | gainage |

**Table — Full Body (`fullbody-quad`, BW+BAR) :**

| # | Slot muscles | Cat | Séries×Reps | Candidat attendu |
|---|---|---|---|---|
| w | warmup | — | 2×10 | bodyweight |
| 1 | quads + glutes | cmp | 3×15-20 | squat BW / fente |
| 2 | chest / chest_upper | cmp | 3×15-20 | pompes |
| 3 | back_width / back_thickness / back | cmp | 3×15-20 | `seed-pullup` |
| 4 | shoulders / shoulders_front | cmp | 3×15-20 | pike push-up |
| 5 | hamstrings | iso | 3×15-20 | `bw-nordic-curl` (repli) |
| 6 | shoulders_rear | iso | 3×15-20 | **probablement vide** |
| 7 | biceps | iso | 3×15-20 | `bw-chinup` |
| 8 | calves | iso | 3×15-20 | calf raise BW |
| 9 | triceps | iso | 3×15-20 | dips triceps |
| c | core | — | 3×15 | gainage |

**Assertions :**
- `!isMass && !beginner` → PPF : **PASS** (l.555)
- Même split que P08 malgré objectif différent : **PASS** — l.555 est la branche commune fat_loss/endurance.
- Pull : `back_width` → `seed-pullup`, `back_thickness` → `bw-inverted-row` : **PASS** (les deux slots compound du Pull ont un candidat en BW+BAR — contrairement à BB+DB en P07).
- Specs endurance 3×15-20 compound et isolation : **PASS** (l.76, l.83)
- `autoProgress:false` : **PASS** (l.790, tous bodyweight/pullup_bar)
- ⚠️ Jusqu'à 4 slots isolation vides par programme (deltoïde latéral, deltoïde postérieur ×2, avant-bras) sans aucun warning (garde compound-only l.996).

**Coach :**
- **Réponse à la question du prompt** : oui, le Pull day est viable — c'est même la séance la mieux servie du preset outdoor (traction + rowing inversé + chin-up couvrent largeur, épaisseur et biceps). En revanche le Push day est le maillon faible : deux tiers de ses isolations sont vides.
- **Équilibre musculaire** : dos très bien couvert, poussée moyennement, épaules latérales/postérieures absentes, jambes limitées au squat BW (charge insuffisante pour un intermédiaire).
- **Cohérence objectif** : « endurance » sans `cardio_machine` (absent du preset outdoor) = endurance **musculaire locale** uniquement, aucune composante cardio-respiratoire. C'est cohérent avec ce que le générateur sait faire, mais l'utilisateur qui choisit "Endurance" attendra probablement de la course/rameur.
- **Durée/contenu** : Push/Pull ≈ 35 min, Full Body ≈ 48 min pour 60 annoncés (et moins encore compte tenu des slots vides). Fortement sous-rempli.
- **Variété structurelle** : ✅ trois séances distinctes, mais la pénurie de candidats BW+BAR fait réapparaître les mêmes 6-7 exercices d'une séance à l'autre malgré le tri `usedGlobally` (l.773-776).
- **Couverture isolation** : ❌ lacunes problématiques (épaules latérale et postérieure jamais travaillées de la semaine).
- **Verdict global** : ⚠️ Problème mineur côté code, ❌ réserve sportive : programme d'endurance sans cardio et sans travail d'épaule postérieure.

---

### P10 — Intermediate hypertrophy 4j → Upper/Lower

`{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'intermediate' }`

**Simulation :**
- Étape 1 — `null` (l.402).
- Étape 2 — `case 4` (l.559) : `isMass=true` → **l.561** → **`['upper-push','lower-quad','upper-pull','lower-hip']`**.
- Étape 3 — `adjustedSlotCount(8, 60, 'hypertrophy')` = **8** (upper-push, upper-pull) ; `adjustedSlotCount(6, 60, 'hypertrophy')` = **6** (lower-quad, lower-hip). Ligne 639.
- Étape 4 — compound 4×8-12/90 · isolation 3×10-15/75.
- Noms : `toPublicType('upper-push')='upper'` et `('upper-pull')='upper'` (l.119) → 2 occurrences → suffixes A/B ; idem pour `lower` (l.120). → **"Upper — Haut du corps A" (lun) / "Lower — Bas du corps A" (mar) / "Upper — Haut du corps B" (jeu) / "Lower — Bas du corps B" (ven)**.

**Table — Upper A (`upper-push`, SLOTS l.188-199) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | chest / chest_upper (développé couché) | cmp | 4×8-12 |
| 2 | back_width / back_thickness / back (tirage ou rowing) | cmp | 4×8-12 |
| 3 | shoulders / shoulders_front (OHP) | cmp | 4×8-12 |
| 4 | chest / chest_lower / chest_upper (fly) | iso | 3×10-15 |
| 5 | triceps | iso | 3×10-15 |
| 6 | shoulders_lateral | iso | 3×10-15 |
| 7 | biceps | iso | 3×10-15 |
| 8 | back_thickness / back | iso | 3×10-15 |
| c | core | — | 3×15 |

**Table — Lower A (`lower-quad`, SLOTS l.215-224) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads + glutes (squat / leg press) | cmp | 4×8-12 |
| 2 | hamstrings + glutes (RDL) | cmp | 4×8-12 |
| 3 | quads (leg extension) | iso | 3×10-15 |
| 4 | hamstrings (leg curl) | iso | 3×10-15 |
| 5 | glutes | iso | 3×10-15 |
| 6 | calves | iso | 3×10-15 |
| c | core | — | 3×15 |

**Table — Upper B (`upper-pull`, SLOTS l.200-211) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | back_width / back (traction / lat pulldown) | cmp | 4×8-12 |
| 2 | back_thickness / back (rowing) | cmp | 4×8-12 |
| 3 | chest / chest_upper (développé incliné) | cmp | 4×8-12 |
| 4 | shoulders_rear (face pull) | iso | 3×10-15 |
| 5 | biceps | iso | 3×10-15 |
| 6 | back_thickness / back | iso | 3×10-15 |
| 7 | triceps | iso | 3×10-15 |
| 8 | shoulders_lateral | iso | 3×10-15 |
| c | core | — | 3×15 |

**Table — Lower B (`lower-hip`, SLOTS l.225-234) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | glutes + hamstrings (hip thrust / sumo DL) | cmp | 4×8-12 |
| 2 | quads + glutes (fente bulgare / step-up) | cmp | 4×8-12 |
| 3 | glutes (kickback / abduction) | iso | 3×10-15 |
| 4 | hamstrings (leg curl) | iso | 3×10-15 |
| 5 | quads (leg extension) | iso | 3×10-15 |
| 6 | calves | iso | 3×10-15 |
| c | core | — | 3×15 |

**Assertions :**
- `isMass` (sans condition de niveau) → upper/lower : **PASS** (l.561)
- Noms Upper A / Lower A / Upper B / Lower B : **PASS** (l.597-600 + l.1039-1041)
- upper-push 8 slots, lower-quad 6, upper-pull 8, lower-hip 6 : **PASS** (l.639)
- Chaque groupe touché 2×/semaine : **PASS** — pec (cmp A + cmp B), dos (cmp A + 2 cmp B), épaules (OHP A + lat A/B + rear B), quads (cmp+iso A, cmp+iso B), ischios (cmp+iso A, cmp+iso B), fessiers (A iso, B cmp+iso).
- Totaux : 10 / 8 / 10 / 8 exercices : **PASS**

**Coach :**
- **Équilibre musculaire** : ✅ le meilleur profil du groupe A. Push/pull équilibré à l'échelle de la semaine (upper-push : 1 pec + 1 dos ; upper-pull : 2 dos + 1 pec → 3 pec-ish contre 5 dos, biais tirage bénéfique posturalement). Deltoïde postérieur présent (Upper B slot 4), deltoïde latéral 2×.
- **Cohérence objectif** : fréquence 2×/groupe = optimum hypertrophie. Volume hebdo : pec ~13 séries, dos ~20, quads ~14, ischios ~14 — cohérent pour un intermédiaire.
- **Durée/contenu** : Upper = 12 séries cmp × 2,2 + 15 séries iso × 1,75 + 7,5 ≈ **60 min** exactement. Lower = 8 × 2,2 + 12 × 1,75 + 7,5 ≈ **46 min**. Les séances upper sont calibrées, les lower sous-remplies de ~14 min.
- **Récupération** : lun/mar/jeu/ven → 72 h entre Upper A et Upper B, 72 h entre Lower A et Lower B. Optimal.
- **Variété structurelle** : ✅ vraie variété — Upper A est bench-first (1 dos, 1 pec, OHP), Upper B est traction-first (2 dos, pec incliné) ; Lower A squat-dominant, Lower B hip-dominant. Ordre des isolations également différent.
- **Couverture isolation** : ✅ complète — pec, tri (×2), bi (×2), lat (×2), rear, dos (×2), quads (×2), ischios (×2), fessiers (×2), mollets (×2).
- **Verdict global** : ✅ Bon programme — référence de qualité du groupe A. Seule réserve : les séances Lower ne remplissent pas le créneau annoncé.

---

### P11 — Intermediate fat_loss 4j

`{ goal:'fat_loss', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'intermediate' }`

**Simulation :**
- Étape 1 — `null` (l.402).
- Étape 2 — `case 4` (l.559) : `isMass=false` → l.561 ignorée ; `level !== 'beginner'` vrai → **l.563** → **`['push','pull','lower-quad','fullbody-quad']`**.
- Étape 3 — 6 / 6 / 6 / 9 slots (l.639).
- Étape 4 — compound 3×12-15/60 · isolation 3×12-15/60.
- Noms : `push` ×1, `pull` ×1, `lower` ×1 (`toPublicType('lower-quad')='lower'`, l.120), `fullbody` ×1 → **aucun suffixe** → "Push — Poussée" / "Pull — Tirage" / "Lower — Bas du corps" / "Full Body".

**Table — Push :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | chest / chest_upper / chest_lower | cmp | 3×12-15 |
| 2 | shoulders / shoulders_front | cmp | 3×12-15 |
| 3 | chest (fly) | iso | 3×12-15 |
| 4 | triceps | iso | 3×12-15 |
| 5 | shoulders_lateral / shoulders | iso | 3×12-15 |
| 6 | shoulders_rear | iso | 3×12-15 |
| c | core | — | 3×15 |

**Table — Pull :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | back_width / back | cmp | 3×12-15 |
| 2 | back_thickness / back | cmp | 3×12-15 |
| 3 | back (isolation) | iso | 3×12-15 |
| 4 | biceps | iso | 3×12-15 |
| 5 | shoulders_rear | iso | 3×12-15 |
| 6 | forearms | iso | 3×12-15 |
| c | core | — | 3×15 |

**Table — Lower (`lower-quad`) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads + glutes | cmp | 3×12-15 |
| 2 | hamstrings + glutes | cmp | 3×12-15 |
| 3 | quads | iso | 3×12-15 |
| 4 | hamstrings | iso | 3×12-15 |
| 5 | glutes | iso | 3×12-15 |
| 6 | calves | iso | 3×12-15 |
| c | core | — | 3×15 |

**Table — Full Body (`fullbody-quad`) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads + glutes | cmp | 3×12-15 |
| 2 | chest / chest_upper | cmp | 3×12-15 |
| 3 | back_width / back_thickness / back | cmp | 3×12-15 |
| 4 | shoulders / shoulders_front | cmp | 3×12-15 |
| 5 | hamstrings | iso | 3×12-15 |
| 6 | shoulders_rear | iso | 3×12-15 |
| 7 | biceps | iso | 3×12-15 |
| 8 | calves | iso | 3×12-15 |
| 9 | triceps | iso | 3×12-15 |
| c | core | — | 3×15 |

**Assertions :**
- `!isMass && level !== 'beginner'` + 4j → `['push','pull','lower-quad','fullbody-quad']` : **PASS** (l.563)
- Jamais upper/lower pour fat_loss 4j intermediate : **PASS** — l.561 est gardée par `if (isMass)`.
- `lower-quad` → type public `'lower'` : **PASS** (l.120, appliqué l.1044)
- Nom "Lower — Bas du corps" sans suffixe : **PASS** (l.599 + l.1040, `totalOfType('lower')=1`)
- Totaux 8 / 8 / 8 / 11 exercices : **PASS**

**Coach :**
- **Réponse à la question du prompt** : le volume haut du corps est équilibré — poussée 2× (Push + Full Body), tirage 2× (Pull + Full Body). Bas du corps 2× également (Lower + Full Body), avec 4 séries composées quads par semaine. C'est un split honnête pour du fat_loss.
- **Équilibre musculaire** : ✅ correct. Deltoïde postérieur 3×/semaine (Push, Pull, Full Body) — bon point postural. Fessiers travaillés uniquement en Lower (1 iso + participation composée).
- **Cohérence objectif** : 3×12-15 à 60 s de repos partout, densité correcte. Comme en P08, **aucun travail cardio généré** malgré `cardio_machine` disponible dans FULL.
- **Durée/contenu** : Push/Pull/Lower ≈ **35 min** chacune, Full Body ≈ **48 min**, pour 60 annoncés. Sous-remplissage important sur 3 séances sur 4 — c'est précisément l'espace où un bloc cardio de 15-20 min aurait sa place.
- **Variété structurelle** : ✅ quatre séances distinctes (le Full Body réutilise cependant le même composé quad que la séance Lower).
- **Couverture isolation** : ✅ complète — tous les groupes ont au moins un slot isolation dédié sur la semaine.
- **Verdict global** : ⚠️ Problème mineur — bon split, mais créneau largement sous-exploité et zéro cardio pour un objectif de perte de gras.

---

### P12 — Intermediate endurance 4j (45 min, HOME)

`{ goal:'endurance', daysPerWeek:4, sessionDuration:45, equipment:HOME, level:'intermediate' }`

**Simulation :**
- Étape 1 — `null` (l.402).
- Étape 2 — `isMass=false`, `level='intermediate'` → **l.563** → **`['push','pull','lower-quad','fullbody-quad']`** — identique à P11.
- Étape 3 — `adjustedSlotCount(6, 45, 'endurance')` = `max(3, floor(6×0.75)) = max(3, 4)` = **4 slots** (push, pull, lower-quad) ; `adjustedSlotCount(9, 45, 'endurance')` = `max(3, floor(6.75)) = max(3, 6)` = **6 slots** (fullbody-quad). Ligne 634-636.
- Étape 4 — **`adjustedSpec` s'applique à 45 min** (l.653-654, factor 0.75) : compound endurance `max(2, floor(3×0.75)) = max(2, 2)` = **2 séries** × 15-20, repos 60 ; isolation idem → **2 séries** × 15-20, repos 45. Le warmup reste 2×10 (l.1024, non ajusté) et le core reste 3×15 (l.1034, non ajusté).
- Noms : "Push — Poussée" / "Pull — Tirage" / "Lower — Bas du corps" / "Full Body".

**Table — Push (4 premiers slots, HOME) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | chest / chest_upper / chest_lower (développé DB, pompes) | cmp | 2×15-20 |
| 2 | shoulders / shoulders_front (OHP DB/KB) | cmp | 2×15-20 |
| 3 | chest (écarté DB) | iso | 2×15-20 |
| 4 | triceps | iso | 2×15-20 |
| c | core | — | 3×15 |

**Table — Pull (4 premiers slots, HOME) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | back_width / back (**risque de slot vide — pas de pullup_bar**) | cmp | 2×15-20 |
| 2 | back_thickness / back (rowing DB/KB, band row) | cmp | 2×15-20 |
| 3 | back (isolation, pull-over DB / band) | iso | 2×15-20 |
| 4 | biceps | iso | 2×15-20 |
| c | core | — | 3×15 |

**Table — Lower (`lower-quad`, 4 premiers slots) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads + glutes (goblet squat) | cmp | 2×15-20 |
| 2 | hamstrings + glutes (RDL DB / KB swing) | cmp | 2×15-20 |
| 3 | quads | iso | 2×15-20 |
| 4 | hamstrings | iso | 2×15-20 |
| c | core | — | 3×15 |

**Table — Full Body (`fullbody-quad`, 6 premiers slots) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads + glutes | cmp | 2×15-20 |
| 2 | chest / chest_upper | cmp | 2×15-20 |
| 3 | back_width / back_thickness / back | cmp | 2×15-20 |
| 4 | shoulders / shoulders_front | cmp | 2×15-20 |
| 5 | hamstrings | iso | 2×15-20 |
| 6 | shoulders_rear | iso | 2×15-20 |
| c | core | — | 3×15 |

**Assertions :**
- Split identique à P11 : **PASS** (l.563)
- `adjustedSlotCount(6, 45, 'endurance') = 4` : **PASS** (l.636)
- `adjustedSlotCount(9, 45, 'endurance') = 6` : **PASS** (l.636)
- HOME sans pullup_bar → slot `back_width` du Pull à risque : **RISQUE CONFIRMÉ par le code** (l.141, `['back_width','back']`) — si aucun composé DB/KB/band n'a `primaryMuscle='back_width'` ou `'back'`, warning l.1002 et Pull réduit à 5 exercices.
- ⚠️ **Non couvert par les assertions du prompt** : à 45 min, `adjustedSpec` réduit **toutes** les séries à 2 (l.653-654). Un programme d'endurance à 2 séries par exercice est un choix fort qui n'est signalé nulle part dans le wizard.

**Coach :**
- **Réponse à la question du prompt** : 4 slots × 2 séries × ~1,5 min = 12 min de travail + 7,5 min warmup/core ≈ **20 min** pour un créneau de 45. La séance est **très largement sous-dimensionnée** : la réduction cumulée slots (÷1,33) × séries (÷1,5) divise le volume par 2 alors que la durée n'est réduite que d'un quart. C'est le défaut de calibration le plus net du groupe A.
- **Équilibre musculaire** : le Full Body à 6 slots couvre bien la semaine, mais épaules latérales, mollets, triceps et biceps sont éjectés de 3 séances sur 4.
- **Cohérence objectif** : 2×15-20 est en dessous du seuil de stimulus pour de l'endurance musculaire (référence : 3-4 séries longues). L'objectif est mal servi.
- **Équipement** : HOME couvre correctement push/jambes ; le tirage vertical est le trou (pas de barre de traction → pas de largeur dorsale). Un élastique ancré haut ferait un lat pulldown, à condition qu'un exercice `band` `back_width` compound existe dans le seed.
- **Variété structurelle** : ✅ quatre séances distinctes, mais avec 4 slots chacune, les trois premières se réduisent à « 2 composés + 2 isolations » très proches.
- **Couverture isolation** : ⚠️ lacunes acceptables compte tenu du format court, mais mollets et deltoïde latéral jamais travaillés de la semaine.
- **Verdict global** : ❌ Problème sérieux de calibration durée/volume (20 min de contenu pour 45 annoncés) + trou dorsal en HOME.

---

### P13 — Intermediate hypertrophy 5j → PPL+UL

`{ goal:'hypertrophy', daysPerWeek:5, sessionDuration:60, equipment:FULL, level:'intermediate' }`

**Simulation :**
- Étape 1 — `null` (l.402).
- Étape 2 — `case 5` (l.567) : `isMass=true && level !== 'beginner'` → **l.569** → **`['push','pull','legs','upper','lower']`**.
- Étape 3 — `adjustedSlotCount(6,60,'hypertrophy')` = 6 (push, pull, legs, lower) ; `adjustedSlotCount(8,60,'hypertrophy')` = 8 (upper). Ligne 639.
- Étape 4 — compound 4×8-12/90 · isolation 3×10-15/75.
- Noms : canons `push`, `pull`, `legs`, `upper`, `lower` — **5 canons distincts** (`toPublicType` renvoie `t` tel quel pour ces cinq types, l.126) → aucun suffixe → "Push — Poussée" / "Pull — Tirage" / "Legs — Jambes" / "Upper — Haut du corps" / "Lower — Bas du corps".

**Table — Push (6 slots)** : identique en structure à P06 (chest cmp · OHP cmp · chest iso · triceps iso · lat iso · rear iso), 4×8-12 / 3×10-15.

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | chest / chest_upper / chest_lower | cmp | 4×8-12 |
| 2 | shoulders / shoulders_front | cmp | 4×8-12 |
| 3 | chest (fly) | iso | 3×10-15 |
| 4 | triceps | iso | 3×10-15 |
| 5 | shoulders_lateral / shoulders | iso | 3×10-15 |
| 6 | shoulders_rear | iso | 3×10-15 |
| c | core | — | 3×15 |

**Table — Pull (6 slots) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | back_width / back | cmp | 4×8-12 |
| 2 | back_thickness / back | cmp | 4×8-12 |
| 3 | back (isolation) | iso | 3×10-15 |
| 4 | biceps | iso | 3×10-15 |
| 5 | shoulders_rear | iso | 3×10-15 |
| 6 | forearms | iso | 3×10-15 |
| c | core | — | 3×15 |

**Table — Legs (`legs`, SLOTS l.148-155) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads | cmp | 4×8-12 |
| 2 | hamstrings + glutes | cmp | 4×8-12 |
| 3 | quads | iso | 3×10-15 |
| 4 | glutes | iso | 3×10-15 |
| 5 | hamstrings | iso | 3×10-15 |
| 6 | calves | iso | 3×10-15 |
| c | core | — | 3×15 |

**Table — Upper (`upper`, SLOTS l.156-165, 8 slots) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | chest / chest_upper | cmp | 4×8-12 |
| 2 | back_width / back_thickness / back | cmp | 4×8-12 |
| 3 | shoulders / shoulders_front (OHP) | cmp | 4×8-12 |
| 4 | shoulders_lateral / shoulders_rear | iso | 3×10-15 |
| 5 | back_thickness / back | iso | 3×10-15 |
| 6 | chest / chest_lower | iso | 3×10-15 |
| 7 | biceps | iso | 3×10-15 |
| 8 | triceps | iso | 3×10-15 |
| c | core | — | 3×15 |

**Table — Lower (`lower`, SLOTS l.166-173, 6 slots) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads | cmp | 4×8-12 |
| 2 | hamstrings + glutes | cmp | 4×8-12 |
| 3 | quads | iso | 3×10-15 |
| 4 | glutes | iso | 3×10-15 |
| 5 | hamstrings | iso | 3×10-15 |
| 6 | calves | iso | 3×10-15 |
| c | core | — | 3×15 |

**Assertions :**
- `isMass && !beginner` + 5j → `['push','pull','legs','upper','lower']` : **PASS** (l.569)
- Noms sans suffixe A/B : **PASS** (l.1039-1040 — 5 canons différents)
- `upper` utilise bien `SLOTS['upper']` (8 slots, l.156-165) et non upper-push/upper-pull : **PASS**
- `lower` utilise `SLOTS['lower']` (6 slots, l.166-173) : **PASS**
- ❌ **FAIL sportif à documenter** : `SLOTS['lower']` (l.166-173) est **strictement identique**, slot par slot et dans le même ordre, à `SLOTS['legs']` (l.148-155). Les séances 3 et 5 sont donc structurellement le même entraînement, avec deux noms différents ("Legs — Jambes" / "Lower — Bas du corps"). Seuls les exercices diffèrent, via le tri `usedGlobally` (l.773-776) et le tirage top-3 (l.782-783).
- Aucun warning "volume élevé débutant" (l.1074) : **PASS** — la garde exige `level === 'beginner'`.

**Coach :**
- **Réponse à la question du prompt** : non, les séances Upper et Lower en positions 4-5 ne sont **pas** structurellement différenciées de ce qui précède. `Lower` = copie exacte de `Legs`. `Upper` recoupe Push (chest cmp, OHP, chest iso, tri iso, lat iso) et Pull (dos cmp, dos iso, bi iso) — c'est une redite condensée des deux premières séances. L'utilisateur perçoit 5 séances distinctes ; il en fait en réalité 3 types.
- **Équilibre musculaire** : ✅ correct. Fréquence : pec 2× (Push + Upper), dos 2× (Pull + Upper), épaules 2×, quads 2× (Legs + Lower), ischios 2×, mollets 2×. C'est le bon compromis d'un 5j.
- **Cohérence objectif** : volume hebdo ~14 séries pec, ~20 dos, ~14 quads. Cohérent hypertrophie intermédiaire.
- **Durée/contenu** : Push/Pull/Legs/Lower ≈ **46 min**, Upper ≈ **60 min**, pour 60 annoncés. 4 séances sur 5 sous-remplies.
- **Récupération** : lun→ven, jambes le mercredi et le vendredi = 48 h seulement entre deux séances jambes identiques, avec le week-end derrière. Acceptable mais serré si les charges sont réelles.
- **Variété structurelle** : ❌ **Répétition complète entre Legs (mer) et Lower (ven)** — mêmes slots, même ordre. C'est le défaut structurel le plus net du groupe A.
- **Couverture isolation** : ✅ complète.
- **Verdict global** : ⚠️ Problème mineur à sérieux — split valable mais `SLOTS['lower']` devrait être remplacé par `lower-hip` en position 5 pour produire une vraie alternance quad/hip.

---

### P14 — Intermediate fat_loss 5j

`{ goal:'fat_loss', daysPerWeek:5, sessionDuration:60, equipment:FULL, level:'intermediate' }`

**Simulation :**
- Étape 1 — `null` (l.402).
- Étape 2 — `case 5` (l.567) : `isMass=false` → l.569 ignorée, l.571 ignorée (`if (isMass)`), `level !== 'beginner'` vrai → **l.573** → **`['push','pull','lower-quad','lower-hip','fullbody-quad']`**.
- Étape 3 — 6 / 6 / 6 / 6 / 9 slots (l.639).
- Étape 4 — compound 3×12-15/60 · isolation 3×12-15/60.
- Noms : `push` ×1, `pull` ×1, **`lower` ×2** (lower-quad et lower-hip, l.120) → suffixes A/B, `fullbody` ×1 → **"Push — Poussée" / "Pull — Tirage" / "Lower — Bas du corps A" / "Lower — Bas du corps B" / "Full Body"**.

**Table — Push :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | chest / chest_upper / chest_lower | cmp | 3×12-15 |
| 2 | shoulders / shoulders_front | cmp | 3×12-15 |
| 3 | chest (fly) | iso | 3×12-15 |
| 4 | triceps | iso | 3×12-15 |
| 5 | shoulders_lateral / shoulders | iso | 3×12-15 |
| 6 | shoulders_rear | iso | 3×12-15 |
| c | core | — | 3×15 |

**Table — Pull :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | back_width / back | cmp | 3×12-15 |
| 2 | back_thickness / back | cmp | 3×12-15 |
| 3 | back (isolation) | iso | 3×12-15 |
| 4 | biceps | iso | 3×12-15 |
| 5 | shoulders_rear | iso | 3×12-15 |
| 6 | forearms | iso | 3×12-15 |
| c | core | — | 3×15 |

**Table — Lower A (`lower-quad`) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads + glutes (squat) | cmp | 3×12-15 |
| 2 | hamstrings + glutes (RDL) | cmp | 3×12-15 |
| 3 | quads | iso | 3×12-15 |
| 4 | hamstrings | iso | 3×12-15 |
| 5 | glutes | iso | 3×12-15 |
| 6 | calves | iso | 3×12-15 |
| c | core | — | 3×15 |

**Table — Lower B (`lower-hip`) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | glutes + hamstrings (hip thrust / sumo) | cmp | 3×12-15 |
| 2 | quads + glutes (fente / step-up) | cmp | 3×12-15 |
| 3 | glutes | iso | 3×12-15 |
| 4 | hamstrings | iso | 3×12-15 |
| 5 | quads | iso | 3×12-15 |
| 6 | calves | iso | 3×12-15 |
| c | core | — | 3×15 |

**Table — Full Body (`fullbody-quad`) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads + glutes | cmp | 3×12-15 |
| 2 | chest / chest_upper | cmp | 3×12-15 |
| 3 | back_width / back_thickness / back | cmp | 3×12-15 |
| 4 | shoulders / shoulders_front | cmp | 3×12-15 |
| 5 | hamstrings | iso | 3×12-15 |
| 6 | shoulders_rear | iso | 3×12-15 |
| 7 | biceps | iso | 3×12-15 |
| 8 | calves | iso | 3×12-15 |
| 9 | triceps | iso | 3×12-15 |
| c | core | — | 3×15 |

**Assertions :**
- `!isMass && !beginner` + 5j → `['push','pull','lower-quad','lower-hip','fullbody-quad']` : **PASS** (l.573)
- Pas de PPL+UL pour fat_loss 5j : **PASS** — l.569 gardée par `isMass`.
- lower-quad et lower-hip sont deux séances distinctes (alternance quad-dominant / hip-dominant) : **PASS** (l.215-224 vs l.225-234 — composés inversés et ordre des isolations différent)
- fullbody-quad en fin de semaine : **PASS** (position 5 du tableau l.573)
- Suffixes "Lower A" / "Lower B" : **PASS** (l.1039-1040)
- Aucun warning volume : **PASS** — l.1074 exige `level === 'beginner'`.

**Coach :**
- **Réponse à la question du prompt** : le volume n'est pas excessif en soi (15 séries × ~1,5 min = charges légères 12-15 reps), mais la **répartition est déséquilibrée** : 3 séances sur 5 sollicitent les jambes (Lower A, Lower B, Full Body) avec des composés lourds mer/jeu/ven consécutifs. Trois jours d'affilée de travail des quadriceps et des fessiers, sans jour de repos intercalé, est le point faible de ce split.
- **Équilibre musculaire** : haut du corps 3× (Push, Pull, Full Body), bas du corps 3×. Ratio correct. Deltoïde postérieur 3×.
- **Cohérence objectif** : 3×12-15 partout à 60 s. Comme P08/P11, **aucun bloc cardio** malgré `cardio_machine` disponible.
- **Durée/contenu** : Push/Pull/Lower A/Lower B ≈ **35 min**, Full Body ≈ **48 min**, pour 60 annoncés. Sous-remplissage marqué sur 4 séances — 5 séances de 35 min plutôt que 3 séances denses est discutable pour un objectif fat_loss chez un pratiquant dont la contrainte réelle est le temps.
- **Variété structurelle** : ✅ cinq séances distinctes, alternance quad/hip bien réalisée.
- **Couverture isolation** : ✅ complète, avec redondance jambes (quads, ischios, fessiers, mollets 2 à 3× chacun).
- **Verdict global** : ⚠️ Problème mineur — split correct, mais enchaînement jambes mer/jeu/ven, créneau sous-exploité et zéro cardio.
---

### P15 — Advanced hypertrophy 3j (90 min) → PPL

`{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:90, equipment:FULL, level:'advanced' }`

**Simulation :**
- Étape 1 — `null` (l.402).
- Étape 2 — `isMass=true`, `level='advanced'` → `level !== 'beginner'` vrai → **l.553** → **`['push','pull','legs']`**. Le niveau `advanced` ne crée aucune branche : `selectSplit` ne teste jamais `'advanced'`, seulement `!== 'beginner'`.
- Étape 3 — `adjustedSlotCount(6, 90, 'hypertrophy')` : branche 90 min non-strength (l.643) → `min(6+2, 8)` = **8**. **Mais** `baseSlots.slice(0, 8)` sur un tableau de 6 éléments (l.985) → **6 slots effectifs** pour push, pull et legs.
- Étape 4 — `adjustedSpec(spec, 90)` → inchangé (l.652). Compound 4×8-12/90 · isolation 3×10-15/75.
- `level='advanced'` → tirage aléatoire top-3 (l.782-783).
- Noms : "Push — Poussée" / "Pull — Tirage" / "Legs — Jambes".

**Table — Push (6 slots effectifs) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | chest / chest_upper / chest_lower | cmp | 4×8-12 |
| 2 | shoulders / shoulders_front | cmp | 4×8-12 |
| 3 | chest (fly) | iso | 3×10-15 |
| 4 | triceps | iso | 3×10-15 |
| 5 | shoulders_lateral / shoulders | iso | 3×10-15 |
| 6 | shoulders_rear | iso | 3×10-15 |
| c | core | — | 3×15 |

**Table — Pull (6 slots effectifs) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | back_width / back | cmp | 4×8-12 |
| 2 | back_thickness / back | cmp | 4×8-12 |
| 3 | back (isolation) | iso | 3×10-15 |
| 4 | biceps | iso | 3×10-15 |
| 5 | shoulders_rear | iso | 3×10-15 |
| 6 | forearms | iso | 3×10-15 |
| c | core | — | 3×15 |

**Table — Legs (6 slots effectifs) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads | cmp | 4×8-12 |
| 2 | hamstrings + glutes | cmp | 4×8-12 |
| 3 | quads | iso | 3×10-15 |
| 4 | glutes | iso | 3×10-15 |
| 5 | hamstrings | iso | 3×10-15 |
| 6 | calves | iso | 3×10-15 |
| c | core | — | 3×15 |

**Assertions :**
- advanced ne change pas le split à 3j → PPL identique à P06 : **PASS** (l.553, seul `!== 'beginner'` est testé)
- `adjustedSlotCount(6, 90, 'hypertrophy') = min(8, 8) = 8` : **PASS** au niveau de la fonction (l.643)
- « 8 slots (push et pull étendus) » : ❌ **FAIL au niveau du programme réel** — `SLOTS['push']` et `SLOTS['pull']` ne contiennent que 6 entrées (l.132-147), donc `slice(0, 8)` (l.985) rend 6 slots. **Le bonus +2 du créneau 90 min est inopérant sur tous les templates de base 6** (push, pull, legs, lower, lower-quad, lower-hip). Il n'est réellement utilisable que par les templates de base 7 à 9 (chest-tri, upper, upper-push, upper-pull, back-bi, glutes-hip, quad-glutes, fullbody-*, lower_pull, lower_push).
- Legs plafonné à 6 : **PASS** (comportement identique, déjà anticipé par le prompt)
- Specs advanced = specs intermediate : **PASS** — `COMPOUND_SPEC`/`ISOLATION_SPEC` sont indexés par `goal` uniquement (l.73, l.80) ; `level` n'intervient que dans `pickExercise` (l.781-783).

**Coach :**
- **Réponse à la question du prompt** : le problème est inverse de celui posé. Il n'y a pas 8 slots mais 6, et **8 exercices totaux (6 + warmup + core) dans un créneau de 90 min** : 8 séries composées × 2,2 min + 12 séries isolation × 1,75 min + 7,5 min ≈ **46 min de contenu pour 90 min annoncées**. Presque la moitié du créneau est vide.
- **Équilibre musculaire** : ✅ correct (identique à P06).
- **Cohérence objectif** : pour un pratiquant **confirmé** qui déclare 90 min disponibles, 8 séries pectorales hebdomadaires est nettement insuffisant. Le générateur ne récompense ni le niveau ni la disponibilité.
- **Fréquence** : 1×/groupe/semaine — le pire cas pour un avancé, qui a précisément besoin de plus de volume réparti sur plus de fréquence.
- **Variété structurelle** : ✅ trois séances distinctes. Le tirage top-3 (`advanced`) apporte de la variation d'exercices d'une semaine à l'autre au sein d'une même génération.
- **Couverture isolation** : ✅ complète.
- **Verdict global** : ❌ Problème sérieux de calibration — le créneau 90 min n'est pas exploitable par les templates de base 6, et le niveau avancé ne produit aucun volume supplémentaire.

---

### P16 — Advanced strength 3j → PPL

`{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'advanced' }`

**Simulation :**
- Étape 1 — `null` (l.402).
- Étape 2 — `isMass=true`, `!beginner` → **l.553** → **`['push','pull','legs']`**.
- Étape 3 — `adjustedSlotCount(6, 60, 'strength')` = `max(4, floor(3))` = **4 slots** par séance (l.638).
- Étape 4 — compound 5×3-5/180 (l.74) · isolation 3×5-8/120 (l.81). `adjustedSpec` inchangé à 60 min.
- `level='advanced'` → `candidates.slice(0,3)` + tirage aléatoire (l.782-783) pour **tous** les slots. Pour le slot chest compound en FULL, le top-3 attendu (après tri l.757-777 : muscle du slot d'abord, puis priorité barbell car `goal==='strength' && slot.compound`, puis non-utilisé, puis popularité) est : **développé couché barre > développé incliné barre > développé couché machine/haltères**. Non déterministe.
- Noms : "Push — Poussée" / "Pull — Tirage" / "Legs — Jambes".

**Table — Push (4 slots) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | chest / chest_upper / chest_lower (barre prioritaire) | cmp | 5×3-5 |
| 2 | shoulders / shoulders_front (OHP barre) | cmp | 5×3-5 |
| 3 | chest (fly) | iso | 3×5-8 |
| 4 | triceps | iso | 3×5-8 |
| c | core | — | 3×15 |

**Table — Pull (4 slots) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | back_width / back (traction / lat pulldown) | cmp | 5×3-5 |
| 2 | back_thickness / back (rowing barre) | cmp | 5×3-5 |
| 3 | back (isolation) | iso | 3×5-8 |
| 4 | biceps | iso | 3×5-8 |
| c | core | — | 3×15 |

**Table — Legs (4 slots) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads (squat barre) | cmp | 5×3-5 |
| 2 | hamstrings + glutes (soulevé de terre) | cmp | 5×3-5 |
| 3 | quads (leg extension) | iso | 3×5-8 |
| 4 | glutes | iso | 3×5-8 |
| c | core | — | 3×15 |

**Assertions :**
- Split PPL : **PASS** (l.553)
- `adjustedSlotCount(6,60,'strength') = 4` : **PASS** (l.638)
- advanced → tirage top-3 non déterministe : **PASS** (l.782-783) — top-3 chest compound cité ci-dessus.
- `autoProgress:true`, `progressStepKg:2.5` : **PASS partiel** (l.789-790) — vrai pour barre/haltères/machine/câble ; le slot `back_width` du Pull peut retenir une traction (`pullup_bar`) et recevoir alors `progressStepKg=0`, ce qui **désactive la progression automatique sur le mouvement de tirage principal** d'un programme de force. Point à corriger : en force, un lestage devrait être modélisé.
- Warning "Force pour débutant" absent : **PASS** (l.1066 exige `level==='beginner'`)

**Coach :**
- **Réponse à la question du prompt** : timing = 10 séries composées × 3,5 min + 6 séries isolation × 2,3 min + 7,5 min ≈ **56 min**. Cohérent avec les 60 min annoncés, contrairement à P03 (fullbody force à 78 min). Le barème force fonctionne bien sur les templates base 6.
- **Équipement** : ✅ `strengthEquipmentPrio` (l.707-719) place la barre en tête sur les slots compound — bench, OHP, rowing, squat, deadlift en version barre. Exploitation optimale de FULL. **Mais** la priorité ne s'applique pas aux isolations (garde `slot.compound` l.769), ce qui est sans conséquence pratique.
- **Équilibre musculaire** : 2 composés poussée / 2 composés tirage sur la semaine — équilibré. Mais aucune épaule postérieure, aucun mollet, aucun avant-bras : les slots 5 et 6 sont coupés dans les trois séances.
- **Cohérence objectif** : 5×3-5 canonique. Réserve identique à P07 : les slots 3-4 sont des **isolations en 3×5-8** (fly lourd 5 reps, extension triceps 5 reps) — spécification à revoir, contre-productive et à risque articulaire.
- **Fréquence** : 1× par mouvement principal par semaine. Pour un confirmé en force, c'est faible ; les standards (5/3/1, Texas Method, conjugué) reposent sur 2 à 3 expositions hebdomadaires par pattern.
- **Variété structurelle** : ✅ trois séances distinctes.
- **Couverture isolation** : ⚠️ lacunes acceptables en force pure.
- **Verdict global** : ⚠️ Problème mineur — timing correct, sélection barre optimale ; réserves sur `ISOLATION_SPEC.strength` et sur `autoProgress=false` pour une traction en programme de force.

---

### P17 — Advanced fat_loss 3j (45 min, BB+DB) → PPF

`{ goal:'fat_loss', daysPerWeek:3, sessionDuration:45, equipment:BB+DB, level:'advanced' }`

**Simulation :**
- Étape 1 — `null` (l.402).
- Étape 2 — `isMass=false`, `level='advanced'` (≠ beginner) → **l.555** → **`['push','pull','fullbody-quad']`** (PPF).
- Étape 3 — `adjustedSlotCount(6, 45, 'fat_loss')` = `max(3, floor(4.5)) = max(3, 4)` = **4 slots** (push, pull) ; `adjustedSlotCount(9, 45, 'fat_loss')` = `max(3, floor(6.75)) = max(3, 6)` = **6 slots** (fullbody-quad). Ligne 636.
- Étape 4 — `adjustedSpec(spec, 45)` : factor 0.75 → compound `max(2, floor(3×0.75)) = 2` → **2×12-15/60** ; isolation idem → **2×12-15/60**. Warmup 2×10 et core 3×15 non ajustés.
- Noms : "Push — Poussée" / "Pull — Tirage" / "Full Body".

**Table — Push (4 slots, BB+DB) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | chest / chest_upper / chest_lower | cmp | 2×12-15 |
| 2 | shoulders / shoulders_front | cmp | 2×12-15 |
| 3 | chest (écarté haltères) | iso | 2×12-15 |
| 4 | triceps | iso | 2×12-15 |
| c | core | — | 3×15 |

**Table — Pull (4 slots, BB+DB) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | back_width / back (**risque de slot vide en BB+DB**) | cmp | 2×12-15 |
| 2 | back_thickness / back (rowing barre / haltère) | cmp | 2×12-15 |
| 3 | back (isolation, pull-over) | iso | 2×12-15 |
| 4 | biceps | iso | 2×12-15 |
| c | core | — | 3×15 |

**Table — Full Body (`fullbody-quad`, 6 slots) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads + glutes (squat barre) | cmp | 2×12-15 |
| 2 | chest / chest_upper | cmp | 2×12-15 |
| 3 | back_width / back_thickness / back (rowing) | cmp | 2×12-15 |
| 4 | shoulders / shoulders_front | cmp | 2×12-15 |
| 5 | hamstrings | iso | 2×12-15 |
| 6 | shoulders_rear | iso | 2×12-15 |
| c | core | — | 3×15 |

**Assertions :**
- `!isMass && !beginner` → PPF : **PASS** (l.555)
- `adjustedSlotCount(6, 45, 'fat_loss') = 4` : **PASS** (l.636)
- `adjustedSlotCount(9, 45, 'fat_loss') = 6` : **PASS** (l.636)
- `adjustedSpec(compound_fat_loss, 45)` → `max(2, floor(3×0.75)) = 2` séries × 12-15 : **PASS** (l.654)
- ⚠️ Les **isolations** subissent la même réduction (3 → 2 séries), non mentionné dans l'assertion mais conforme au code (l.654 s'applique à tout `SetSpec`).
- ⚠️ Slot `back_width` du Pull sans candidat probable en BB+DB → warning l.1002, Pull à 5 exercices.

**Coach :**
- **Réponse à la question du prompt** : non, 2 séries par composé n'est pas suffisant pour un confirmé, même en fat_loss. En période de déficit calorique, le rôle premier de la musculation est de **préserver la masse maigre** : il faut maintenir le volume (et baisser plutôt l'intensité relative), or ici le volume est amputé de 33 % en plus de la réduction des slots (6 → 4). Effet cumulé : de 18 séries (6 slots × 3) à 8 séries (4 × 2), soit **−55 % de volume** pour −25 % de durée.
- **Durée/contenu** : Push/Pull = 8 séries × ~1,5 min + 7,5 ≈ **20 min** pour 45 annoncés. Full Body = 12 × 1,5 + 7,5 ≈ **26 min**. Sous-remplissage massif, même défaut que P12.
- **Équilibre musculaire** : jambes présentes uniquement en séance 3 (1 composé + 1 isolation ischios = 4 séries/semaine). Très faible pour du fat_loss chez un confirmé.
- **Équipement** : BB+DB correctement exploité pour la poussée et le rowing ; trou sur la largeur dorsale (pas de traction ni de poulie).
- **Variété structurelle** : ✅ trois séances distinctes, mais réduites à 4 slots elles se ressemblent (2 composés + 2 isolations).
- **Couverture isolation** : ⚠️ épaules (latérale et postérieure sauf Full Body), mollets, avant-bras jamais travaillés.
- **Verdict global** : ❌ Problème sérieux — la double réduction slots × séries à 45 min produit un programme deux fois plus court que le créneau annoncé et sous le seuil de maintien musculaire.

---

### P18 — Advanced endurance 3j → PPF

`{ goal:'endurance', daysPerWeek:3, sessionDuration:60, equipment:BW+BAR, level:'advanced' }`

**Simulation :**
- Étape 1 — `null` (l.402).
- Étape 2 — `isMass=false`, `!beginner` → **l.555** → **`['push','pull','fullbody-quad']`**. Split strictement identique à P09 (intermediate) : `advanced` ne modifie pas la sélection.
- Étape 3 — 6 / 6 / 9 slots (l.639).
- Étape 4 — compound 3×15-20/60 (l.76) · isolation 3×15-20/45 (l.83). `adjustedSpec` inchangé à 60 min.
- `level='advanced'` → tirage top-3 (l.782-783), pool étroit en BW+BAR.
- Noms : "Push — Poussée" / "Pull — Tirage" / "Full Body".

**Table — Push (BW+BAR) :**

| # | Slot muscles | Cat | Séries×Reps | Candidat attendu |
|---|---|---|---|---|
| w | warmup | — | 2×10 | bodyweight |
| 1 | chest / chest_upper / chest_lower | cmp | 3×15-20 | pompes / `seed-dips` |
| 2 | shoulders / shoulders_front | cmp | 3×15-20 | pike push-up |
| 3 | chest (isolation) | iso | 3×15-20 | repli compound |
| 4 | triceps | iso | 3×15-20 | `seed-triceps-dips` |
| 5 | shoulders_lateral / shoulders | iso | 3×15-20 | **probablement vide** |
| 6 | shoulders_rear | iso | 3×15-20 | **probablement vide** |
| c | core | — | 3×15 | `seed-hanging-leg-raise` |

**Table — Pull (BW+BAR) :**

| # | Slot muscles | Cat | Séries×Reps | Candidat attendu |
|---|---|---|---|---|
| w | warmup | — | 2×10 | bodyweight |
| 1 | back_width / back | cmp | 3×15-20 | `seed-pullup` ✓ |
| 2 | back_thickness / back | cmp | 3×15-20 | `bw-inverted-row` ✓ |
| 3 | back (isolation) | iso | 3×15-20 | repli compound / vide |
| 4 | biceps | iso | 3×15-20 | `bw-chinup` |
| 5 | shoulders_rear | iso | 3×15-20 | **probablement vide** |
| 6 | forearms | iso | 3×15-20 | **probablement vide** |
| c | core | — | 3×15 | gainage |

**Table — Full Body (`fullbody-quad`, BW+BAR) :**

| # | Slot muscles | Cat | Séries×Reps | Candidat attendu |
|---|---|---|---|---|
| w | warmup | — | 2×10 | bodyweight |
| 1 | quads + glutes | cmp | 3×15-20 | squat BW / fente |
| 2 | chest / chest_upper | cmp | 3×15-20 | pompes (variante fraîche) |
| 3 | back_width / back_thickness / back | cmp | 3×15-20 | `seed-pullup` |
| 4 | shoulders / shoulders_front | cmp | 3×15-20 | pike push-up |
| 5 | hamstrings | iso | 3×15-20 | `bw-nordic-curl` |
| 6 | shoulders_rear | iso | 3×15-20 | **probablement vide** |
| 7 | biceps | iso | 3×15-20 | `bw-chinup` |
| 8 | calves | iso | 3×15-20 | calf raise BW |
| 9 | triceps | iso | 3×15-20 | dips triceps |
| c | core | — | 3×15 | gainage |

**Assertions :**
- `!isMass && !beginner` → PPF : **PASS** (l.555)
- Même split que P09 malgré `advanced` : **PASS** — `selectSplit` ne teste que `level !== 'beginner'` (l.553, 555, 563, 569, 573).
- `autoProgress:false` sur tous les exercices : **PASS** (l.790 — `bodyweight` et `pullup_bar` → `progressStepKg=0`)
- ⚠️ Slots isolation vides (deltoïde latéral, deltoïde postérieur ×3, avant-bras) sans warning : conforme au code (garde compound-only l.996), mais lacune fonctionnelle.

**Coach :**
- **Réponse à la question du prompt** : non, un confirmé ne peut pas progresser correctement ici. Le générateur n'a **aucun modèle de progression au poids du corps** : pas de lestage (`progressStepKg=0` forcé pour `pullup_bar`/`bodyweight`, l.790), pas de progression par variante (traction archer, one-arm, pompes surélevées), pas de progression par tempo. À 3×15-20, un confirmé en calisthenics est déjà largement au-delà des cibles de répétitions sur pompes et squats BW — l'exercice devient de l'entretien.
- **Équilibre musculaire** : dos bien couvert (traction + rowing inversé + chin-up), poussée correcte (pompes + dips + pike), jambes faibles, **épaule postérieure et latérale absentes** de tout le programme.
- **Cohérence objectif** : endurance musculaire locale uniquement, aucune composante cardio-respiratoire (le preset outdoor n'inclut pas `cardio_machine`, et aucun slot ne le cible de toute façon).
- **Durée/contenu** : Push/Pull ≈ 35 min (moins avec les slots vides), Full Body ≈ 48 min, pour 60 annoncés.
- **Variété structurelle** : ✅ trois séances distinctes ; ⚠️ en pratique le même petit pool d'exercices tourne d'une séance à l'autre.
- **Couverture isolation** : ❌ lacunes problématiques.
- **Verdict global** : ⚠️ Problème mineur côté code, ❌ réserve sportive : aucune modélisation de la progression en calisthenics pour un niveau confirmé.

---

### P19 — Advanced hypertrophy 4j → Upper/Lower

`{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'advanced' }`

**Simulation :**
- Étape 1 — `null` (l.402).
- Étape 2 — `case 4` (l.559), `isMass=true` → **l.561** → **`['upper-push','lower-quad','upper-pull','lower-hip']`** — identique à P10.
- Étape 3 — 8 / 6 / 8 / 6 slots (l.639).
- Étape 4 — compound 4×8-12/90 · isolation 3×10-15/75.
- `level='advanced'` → tirage top-3 (l.782-783). Top-3 attendu pour le slot 0 de `upper-push` (chest/chest_upper compound, FULL, `goal!=='strength'` donc **pas** de priorité barre — tri par muscle du slot puis non-utilisé puis popularité, l.757-777) : **développé couché barre > développé couché haltères > développé incliné barre** (ordre exact selon les popularités du seed).
- Noms : "Upper — Haut du corps A" / "Lower — Bas du corps A" / "Upper — Haut du corps B" / "Lower — Bas du corps B".

**Table — Upper A (`upper-push`) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | chest / chest_upper | cmp | 4×8-12 |
| 2 | back_width / back_thickness / back | cmp | 4×8-12 |
| 3 | shoulders / shoulders_front (OHP) | cmp | 4×8-12 |
| 4 | chest / chest_lower / chest_upper (fly) | iso | 3×10-15 |
| 5 | triceps | iso | 3×10-15 |
| 6 | shoulders_lateral | iso | 3×10-15 |
| 7 | biceps | iso | 3×10-15 |
| 8 | back_thickness / back | iso | 3×10-15 |
| c | core | — | 3×15 |

**Table — Lower A (`lower-quad`) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads + glutes | cmp | 4×8-12 |
| 2 | hamstrings + glutes | cmp | 4×8-12 |
| 3 | quads | iso | 3×10-15 |
| 4 | hamstrings | iso | 3×10-15 |
| 5 | glutes | iso | 3×10-15 |
| 6 | calves | iso | 3×10-15 |
| c | core | — | 3×15 |

**Table — Upper B (`upper-pull`) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | back_width / back | cmp | 4×8-12 |
| 2 | back_thickness / back | cmp | 4×8-12 |
| 3 | chest / chest_upper (incliné) | cmp | 4×8-12 |
| 4 | shoulders_rear (face pull) | iso | 3×10-15 |
| 5 | biceps | iso | 3×10-15 |
| 6 | back_thickness / back | iso | 3×10-15 |
| 7 | triceps | iso | 3×10-15 |
| 8 | shoulders_lateral | iso | 3×10-15 |
| c | core | — | 3×15 |

**Table — Lower B (`lower-hip`) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | glutes + hamstrings | cmp | 4×8-12 |
| 2 | quads + glutes | cmp | 4×8-12 |
| 3 | glutes | iso | 3×10-15 |
| 4 | hamstrings | iso | 3×10-15 |
| 5 | quads | iso | 3×10-15 |
| 6 | calves | iso | 3×10-15 |
| c | core | — | 3×15 |

**Assertions :**
- Split identique à P10 : **PASS** (l.561 — aucune condition de niveau)
- advanced → tirage top-3 pour chest compound : **PASS** (l.782-783), top-3 cité ci-dessus.
- `autoProgress:true` : **PASS partiel** (l.789-790) — faux pour une traction (`pullup_bar`) éventuellement retenue sur `upper-pull` slot 1.
- 10 / 8 / 10 / 8 exercices : **PASS**

**Coach :**
- **Réponse à la question du prompt** : la fréquence 2×/groupe est le standard bien établi et convient à un confirmé ; ce n'est pas la fréquence qui limite ici mais le **volume par séance**. Un avancé absorbe 18 à 22 séries hebdomadaires par gros groupe ; ce programme en donne ~13 pour les pectoraux et ~14 pour les quadriceps. Un PPL×2 (6j) ou un upper/lower à 90 min serait plus adapté — mais on a vu en P15 que le créneau 90 min n'ajoute rien aux templates base 6.
- **Équilibre musculaire** : ✅ identique à P10, très bon (biais tirage bénéfique, deltoïde postérieur présent).
- **Durée/contenu** : Upper ≈ 60 min (calibré), Lower ≈ 46 min (sous-rempli).
- **Équipement** : FULL exploité ; en hypertrophie, aucune priorité barre n'est appliquée (l.769 exige `goal==='strength'`), le tirage top-3 peut donc retenir des machines — ce qui est parfaitement acceptable, voire souhaitable, en hypertrophie.
- **Variété structurelle** : ✅ vraie variété A/B côté upper comme côté lower.
- **Couverture isolation** : ✅ complète.
- **Verdict global** : ✅ Bon programme, avec la réserve d'un volume un peu court pour un confirmé et de séances Lower sous-remplies.

---

### P20 — Advanced strength 4j → Upper/Lower

`{ goal:'strength', daysPerWeek:4, sessionDuration:60, equipment:BB+DB, level:'advanced' }`

**Simulation :**
- Étape 1 — `null` (l.402).
- Étape 2 — `case 4` (l.559), `isMass=true` (strength) → **l.561** → **`['upper-push','lower-quad','upper-pull','lower-hip']`**.
- Étape 3 — `adjustedSlotCount(8, 60, 'strength')` = `max(4, floor(4))` = **4 slots** (upper-push, upper-pull) ; `adjustedSlotCount(6, 60, 'strength')` = `max(4, floor(3)) = max(4, 3)` = **4 slots** (lower-quad, lower-hip). Ligne 638.
- Étape 4 — compound 5×3-5/180 (l.74) · isolation 3×5-8/120 (l.81).
- `strengthEquipmentPrio` actif sur les compounds (l.769-772) → barre systématiquement préférée aux haltères.
- Noms : "Upper — Haut du corps A" / "Lower — Bas du corps A" / "Upper — Haut du corps B" / "Lower — Bas du corps B".

**Table — Upper A (`upper-push`, 4 premiers slots) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | chest / chest_upper (**développé couché barre**, pas haltères) | cmp | 5×3-5 |
| 2 | back_width / back_thickness / back (rowing barre) | cmp | 5×3-5 |
| 3 | shoulders / shoulders_front (OHP barre) | cmp | 5×3-5 |
| 4 | chest (fly haltères) | iso | 3×5-8 |
| c | core | — | 3×15 |

**Table — Lower A (`lower-quad`, 4 premiers slots) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads + glutes (squat barre) | cmp | 5×3-5 |
| 2 | hamstrings + glutes (soulevé de terre / RDL barre) | cmp | 5×3-5 |
| 3 | quads (isolation — rare en BB+DB, possible slot vide) | iso | 3×5-8 |
| 4 | hamstrings (isolation — idem) | iso | 3×5-8 |
| c | core | — | 3×15 |

**Table — Upper B (`upper-pull`, 4 premiers slots) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | back_width / back (**risque de slot vide en BB+DB**) | cmp | 5×3-5 |
| 2 | back_thickness / back (rowing barre) | cmp | 5×3-5 |
| 3 | chest / chest_upper (développé incliné barre) | cmp | 5×3-5 |
| 4 | shoulders_rear (face pull / écarté penché) | iso | 3×5-8 |
| c | core | — | 3×15 |

**Table — Lower B (`lower-hip`, 4 premiers slots) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | glutes + hamstrings (hip thrust / sumo DL barre) | cmp | 5×3-5 |
| 2 | quads + glutes (fente / split squat) | cmp | 5×3-5 |
| 3 | glutes (isolation) | iso | 3×5-8 |
| 4 | hamstrings (isolation) | iso | 3×5-8 |
| c | core | — | 3×15 |

**Assertions :**
- `isMass` + 4j → upper/lower : **PASS** (l.561)
- `adjustedSlotCount(8, 60, 'strength') = max(4, 4) = 4` : **PASS** (l.638)
- `adjustedSlotCount(6, 60, 'strength') = max(4, 3) = 4` : **PASS** (l.638)
- Barre prioritaire sur haltères pour le chest compound : **PASS** (l.708-710 via l.769-772)
- ⚠️ Slot `back_width` de `upper-pull` : en BB+DB sans `pullup_bar`, risque de `null` (l.745) → warning l.1002 → Upper B à 5 exercices seulement.
- ⚠️ En BB+DB, les isolations quadriceps (leg extension) et ischios (leg curl) n'existent pas en machine → slots 3 et 4 de Lower A potentiellement vides **sans warning** (garde compound-only l.996). Lower A pourrait tomber à 4 exercices (2 composés + warmup + core).

**Coach :**
- **Réponse à la question du prompt** : la structure Upper est excellente pour la force — **3 composés barre lourds** (bench, rowing, OHP en A ; traction/rowing/incliné en B), c'est exactement le format d'un bloc de force haut du corps. Les séances Lower sont en revanche déséquilibrées : seulement **2 composés**, suivis de deux isolations en 3×5-8 qui, en BB+DB, n'ont probablement aucun candidat. Résultat probable : Lower = squat + deadlift + warmup + core, soit 4 exercices pour 60 min.
- **Volume/intensité** : 10 séries lourdes par séance upper, 10 par séance lower, 2×/semaine par pattern. C'est cohérent avec un bloc de force pour confirmé.
- **Durée/contenu** : Upper A = 15 séries composées × 3,5 min + 3 séries iso × 2,3 + 7,5 ≈ **67 min** pour 60 annoncés (léger dépassement, acceptable). Lower ≈ 10 × 3,5 + 6 × 2,3 + 7,5 ≈ **56 min**, ou **43 min** si les isolations sont vides.
- **Équilibre musculaire** : sur la semaine, 3 poussées (bench, OHP, incliné) contre 3 tirages (rowing ×2, traction) — équilibré, avec un face pull en Upper B. Bon.
- **Équipement** : ✅ priorité barre pleinement exploitée sur les 6 slots composés du haut du corps. C'est le profil qui utilise le mieux `strengthEquipmentPrio`.
- **Variété structurelle** : ✅ Upper A bench-first vs Upper B traction-first ; Lower A squat-first vs Lower B hip-first. Réelle.
- **Couverture isolation** : ⚠️ à 4 slots, il ne reste qu'une isolation par séance, et celles des séances Lower risquent d'être vides en BB+DB. Mollets et bras jamais travaillés.
- **Verdict global** : ✅ Bon programme côté haut du corps, ⚠️ réserve sur les séances Lower (2 composés utiles + isolations probablement vides en BB+DB).
---

### P21 — Advanced fat_loss 4j

`{ goal:'fat_loss', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'advanced' }`

**Simulation :**
- Étape 1 — `null` (l.402).
- Étape 2 — `case 4` (l.559) : `isMass=false` → l.561 ignorée ; `level !== 'beginner'` vrai → **l.563** → **`['push','pull','lower-quad','fullbody-quad']`** — strictement identique à P11 (intermediate).
- Étape 3 — 6 / 6 / 6 / 9 slots (l.639).
- Étape 4 — compound 3×12-15/60 · isolation 3×12-15/60.
- `level='advanced'` → tirage top-3 (l.782-783) : seule différence de sortie avec P11.
- Noms : "Push — Poussée" / "Pull — Tirage" / "Lower — Bas du corps" / "Full Body".

**Table — Push :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | chest / chest_upper / chest_lower | cmp | 3×12-15 |
| 2 | shoulders / shoulders_front | cmp | 3×12-15 |
| 3 | chest (fly) | iso | 3×12-15 |
| 4 | triceps | iso | 3×12-15 |
| 5 | shoulders_lateral / shoulders | iso | 3×12-15 |
| 6 | shoulders_rear | iso | 3×12-15 |
| c | core | — | 3×15 |

**Table — Pull :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | back_width / back | cmp | 3×12-15 |
| 2 | back_thickness / back | cmp | 3×12-15 |
| 3 | back (isolation) | iso | 3×12-15 |
| 4 | biceps | iso | 3×12-15 |
| 5 | shoulders_rear | iso | 3×12-15 |
| 6 | forearms | iso | 3×12-15 |
| c | core | — | 3×15 |

**Table — Lower (`lower-quad`) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads + glutes | cmp | 3×12-15 |
| 2 | hamstrings + glutes | cmp | 3×12-15 |
| 3 | quads | iso | 3×12-15 |
| 4 | hamstrings | iso | 3×12-15 |
| 5 | glutes | iso | 3×12-15 |
| 6 | calves | iso | 3×12-15 |
| c | core | — | 3×15 |

**Table — Full Body (`fullbody-quad`) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads + glutes | cmp | 3×12-15 |
| 2 | chest / chest_upper | cmp | 3×12-15 |
| 3 | back_width / back_thickness / back | cmp | 3×12-15 |
| 4 | shoulders / shoulders_front | cmp | 3×12-15 |
| 5 | hamstrings | iso | 3×12-15 |
| 6 | shoulders_rear | iso | 3×12-15 |
| 7 | biceps | iso | 3×12-15 |
| 8 | calves | iso | 3×12-15 |
| 9 | triceps | iso | 3×12-15 |
| c | core | — | 3×15 |

**Assertions :**
- `!isMass && !beginner` + 4j → `['push','pull','lower-quad','fullbody-quad']` : **PASS** (l.563)
- Même split pour intermediate (P11) et advanced (P21) — le niveau ne bifurque pas : **PASS** — l.563 ne teste que `level !== 'beginner'`.
- Seule différence de sortie : `pickExercise` déterministe (jamais, car intermediate est déjà en mode top-3) — en réalité **P11 et P21 produisent des programmes rigoureusement équivalents** : même split, mêmes slots, mêmes specs, même mode de sélection aléatoire. `advanced` et `intermediate` sont **indistinguables** dans tout le générateur, à l'exception de `DURATION_WEEKS` (l.679-683 : 12 vs 16 semaines) et donc du découpage en phases (`buildPhases`, l.866).

**Coach :**
- **Réponse à la question du prompt** : non, ce n'est pas adapté à un confirmé. Un pratiquant avancé en fat_loss a besoin de **maintenir une intensité élevée** (charges lourdes, 5-8 reps sur les composés) pour préserver la masse maigre pendant le déficit, et de déplacer la dépense énergétique vers du cardio. Ici il reçoit exactement le programme d'un débutant-intermédiaire : 3×12-15 partout, aucun travail lourd, aucun cardio. Le seul différenciateur est la durée du programme (16 semaines au lieu de 12) et l'aléa de sélection d'exercices.
- **Manque pour advanced** : aucune variation de volume, d'intensité ni de fréquence en fonction du niveau. Le levier `level` n'agit que sur `pickExercise` (l.781) et `DURATION_WEEKS` (l.679).
- **Équilibre musculaire** : ✅ correct (identique à P11).
- **Durée/contenu** : Push/Pull/Lower ≈ 35 min, Full Body ≈ 48 min, pour 60 annoncés.
- **Variété structurelle** : ✅ quatre séances distinctes.
- **Couverture isolation** : ✅ complète.
- **Verdict global** : ⚠️ Problème mineur — programme correct dans l'absolu, mais totalement indifférencié du profil intermédiaire.

---

### P22 — Advanced hypertrophy 5j → PPL+UL

`{ goal:'hypertrophy', daysPerWeek:5, sessionDuration:60, equipment:FULL, level:'advanced' }`

**Simulation :**
- Étape 1 — `null` (l.402).
- Étape 2 — `case 5` (l.567) : `isMass=true && level !== 'beginner'` → **l.569** → **`['push','pull','legs','upper','lower']`** — identique à P13.
- Étape 3 — 6 / 6 / 6 / 8 / 6 slots (l.639).
- Étape 4 — compound 4×8-12/90 · isolation 3×10-15/75.
- `level='advanced'` → tirage top-3 (l.782-783).
  - **Top-3 chest compound (Push slot 1, muscles `['chest','chest_upper','chest_lower']`, FULL)** : tri l.757-777 — `focused` vide, puis `slot.muscles[0]='chest'` remonte les exercices dont `primaryMuscle==='chest'`, puis non-utilisés, puis popularité desc → **développé couché barre > développé couché haltères > développé couché machine / pec deck compound**. Les variantes `chest_upper` (incliné) sont reléguées après tous les `chest`.
  - **Top-3 back_width compound (Pull slot 1, muscles `['back_width','back']`, FULL)** : `slot.muscles[0]='back_width'` prioritaire → **traction > lat pulldown poulie > tirage vertical machine** (ordre selon popularité du seed). Un rowing (`back_thickness`) est exclu du slot faute d'appartenance aux muscles listés.
- Noms : "Push — Poussée" / "Pull — Tirage" / "Legs — Jambes" / "Upper — Haut du corps" / "Lower — Bas du corps" (5 canons distincts, aucun suffixe).

**Table — Push :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | chest / chest_upper / chest_lower | cmp | 4×8-12 |
| 2 | shoulders / shoulders_front | cmp | 4×8-12 |
| 3 | chest (fly) | iso | 3×10-15 |
| 4 | triceps | iso | 3×10-15 |
| 5 | shoulders_lateral / shoulders | iso | 3×10-15 |
| 6 | shoulders_rear | iso | 3×10-15 |
| c | core | — | 3×15 |

**Table — Pull :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | back_width / back | cmp | 4×8-12 |
| 2 | back_thickness / back | cmp | 4×8-12 |
| 3 | back (isolation) | iso | 3×10-15 |
| 4 | biceps | iso | 3×10-15 |
| 5 | shoulders_rear | iso | 3×10-15 |
| 6 | forearms | iso | 3×10-15 |
| c | core | — | 3×15 |

**Table — Legs :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads | cmp | 4×8-12 |
| 2 | hamstrings + glutes | cmp | 4×8-12 |
| 3 | quads | iso | 3×10-15 |
| 4 | glutes | iso | 3×10-15 |
| 5 | hamstrings | iso | 3×10-15 |
| 6 | calves | iso | 3×10-15 |
| c | core | — | 3×15 |

**Table — Upper (8 slots) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | chest / chest_upper | cmp | 4×8-12 |
| 2 | back_width / back_thickness / back | cmp | 4×8-12 |
| 3 | shoulders / shoulders_front | cmp | 4×8-12 |
| 4 | shoulders_lateral / shoulders_rear | iso | 3×10-15 |
| 5 | back_thickness / back | iso | 3×10-15 |
| 6 | chest / chest_lower | iso | 3×10-15 |
| 7 | biceps | iso | 3×10-15 |
| 8 | triceps | iso | 3×10-15 |
| c | core | — | 3×15 |

**Table — Lower (6 slots — identique à Legs) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads | cmp | 4×8-12 |
| 2 | hamstrings + glutes | cmp | 4×8-12 |
| 3 | quads | iso | 3×10-15 |
| 4 | glutes | iso | 3×10-15 |
| 5 | hamstrings | iso | 3×10-15 |
| 6 | calves | iso | 3×10-15 |
| c | core | — | 3×15 |

**Assertions :**
- Split `['push','pull','legs','upper','lower']` identique à P13 : **PASS** (l.569)
- advanced → top-3 cité pour 2 slots distincts (chest compound Push, back_width compound Pull) : **PASS** (l.782-783)
- ❌ **Même FAIL structurel qu'en P13** : `SLOTS['lower']` (l.166-173) ≡ `SLOTS['legs']` (l.148-155). Séances 3 et 5 identiques en structure.

**Coach :**
- **Réponse à la question du prompt** : PPL+UL n'est pas le split optimal pour un confirmé, principalement parce que les séances 4 et 5 sont des redites. Fréquence réelle par groupe : pectoraux 2× (Push + Upper), dos 2× (Pull + Upper), épaules 2×, **quadriceps 2× mais avec deux séances rigoureusement identiques** (mer + ven). Un confirmé serait mieux servi par PPL×2 sur 6 jours, ou par un upper/lower A/B/C.
- **Équilibre musculaire** : ✅ bon. Deltoïde postérieur 3× (Push, Pull, Upper).
- **Cohérence objectif** : ~14 séries pec, ~20 dos, ~16 quads par semaine. Correct sans être généreux pour un avancé.
- **Durée/contenu** : 4 séances à ≈ 46 min et une (Upper) à ≈ 60 min, pour 60 annoncés.
- **Récupération** : jambes mercredi et vendredi (48 h), haut du corps lundi/mardi/jeudi. Acceptable.
- **Variété structurelle** : ❌ Legs ≡ Lower ; Upper recoupe Push+Pull. 5 séances affichées, 3 structures réelles.
- **Couverture isolation** : ✅ complète.
- **Verdict global** : ⚠️ Problème mineur à sérieux — même défaut structurel que P13, non compensé par le niveau avancé.

---

### P23 — Advanced strength 5j (90 min)

`{ goal:'strength', daysPerWeek:5, sessionDuration:90, equipment:FULL, level:'advanced' }`

**Simulation :**
- Étape 1 — `null` (l.402).
- Étape 2 — `case 5` (l.567) : `isMass=true` (strength) `&& level !== 'beginner'` → **l.569** → **`['push','pull','legs','upper','lower']`**.
- Étape 3 — branche 90 min force (l.642) `min(base, 5)` :
  - push : `min(6, 5)` = **5 slots**
  - pull : `min(6, 5)` = **5 slots**
  - legs : `min(6, 5)` = **5 slots**
  - upper : `min(8, 5)` = **5 slots**
  - lower : `min(6, 5)` = **5 slots**
- Étape 4 — `adjustedSpec(spec, 90)` → inchangé (l.652). Compound 5×3-5/180 · isolation 3×5-8/120.
- `strengthEquipmentPrio` actif sur les compounds ; `level='advanced'` → tirage top-3.
- Noms : "Push — Poussée" / "Pull — Tirage" / "Legs — Jambes" / "Upper — Haut du corps" / "Lower — Bas du corps".

**Table — Push (5 slots) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | chest / chest_upper / chest_lower (barre) | cmp | 5×3-5 |
| 2 | shoulders / shoulders_front (OHP barre) | cmp | 5×3-5 |
| 3 | chest (fly) | iso | 3×5-8 |
| 4 | triceps | iso | 3×5-8 |
| 5 | shoulders_lateral / shoulders | iso | 3×5-8 |
| c | core | — | 3×15 |

**Table — Pull (5 slots) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | back_width / back | cmp | 5×3-5 |
| 2 | back_thickness / back (rowing barre) | cmp | 5×3-5 |
| 3 | back (isolation) | iso | 3×5-8 |
| 4 | biceps | iso | 3×5-8 |
| 5 | shoulders_rear | iso | 3×5-8 |
| c | core | — | 3×15 |

**Table — Legs (5 slots) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads (squat barre) | cmp | 5×3-5 |
| 2 | hamstrings + glutes (soulevé de terre) | cmp | 5×3-5 |
| 3 | quads | iso | 3×5-8 |
| 4 | glutes | iso | 3×5-8 |
| 5 | hamstrings | iso | 3×5-8 |
| c | core | — | 3×15 |

**Table — Upper (5 slots retenus sur 8) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | chest / chest_upper | cmp | 5×3-5 |
| 2 | back_width / back_thickness / back | cmp | 5×3-5 |
| 3 | shoulders / shoulders_front (OHP) | cmp | 5×3-5 |
| 4 | shoulders_lateral / shoulders_rear | iso | 3×5-8 |
| 5 | back_thickness / back | iso | 3×5-8 |
| c | core | — | 3×15 |

**Table — Lower (5 slots — mêmes slots que Legs) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads | cmp | 5×3-5 |
| 2 | hamstrings + glutes | cmp | 5×3-5 |
| 3 | quads | iso | 3×5-8 |
| 4 | glutes | iso | 3×5-8 |
| 5 | hamstrings | iso | 3×5-8 |
| c | core | — | 3×15 |

**Assertions :**
- Split `['push','pull','legs','upper','lower']` : **PASS** (l.569)
- `adjustedSlotCount(6, 90, 'strength') = min(6,5) = 5` (push, pull, legs, lower) : **PASS** (l.642)
- `adjustedSlotCount(8, 90, 'strength') = min(8,5) = 5` (upper) : **PASS** (l.642)
- 7 exercices par séance (5 + warmup + core) : **PASS**
- ❌ Même FAIL structurel qu'en P13/P22 : Legs et Lower partagent le même tableau de slots (l.148-155 ≡ l.166-173) — ici avec 5 slots retenus, les deux séances sont identiques slot pour slot.

**Coach :**
- **Réponse à la question du prompt (timing)** : le calcul du prompt (5×5×3 min = 75 min) ne tient que si les 5 slots sont des composés. Or **seuls les 2 premiers slots sont compound** dans push/pull/legs/lower ; les slots 3 à 5 sont des isolations à 3×5-8 / 120 s. Timing réel : 10 séries composées × 3,5 min + 9 séries isolation × 2,3 min + 7,5 min ≈ **64 min** pour 90 annoncées. Seule la séance Upper (3 composés) atteint ≈ **74 min**. Le créneau 90 min reste sous-exploité de 15 à 26 min.
- **Récupération** : 5 séances de force consécutives (lun→ven) avec squat le mercredi et à nouveau le vendredi, deadlift 2× dans la semaine à 5×3-5. **C'est le point critique** : la charge neurale d'un travail 3-5 reps ne se récupère pas en 48 h chez un confirmé sur les mouvements axiaux. Un split force 5j devrait alterner intensité (lourd/léger) ou patterns — le générateur ne modélise ni ondulation ni jour léger.
- **Cohérence objectif** : 5×3-5 canonique sur les composés, mais **9 séries d'isolation en 3×5-8 par séance** : fly, élévation latérale, leg extension, leg curl, curl biceps en 5-8 répétitions lourdes. Sportivement inapproprié et à risque (`ISOLATION_SPEC.strength`, l.81).
- **Équilibre musculaire** : bon sur le papier ; quadriceps sur-représentés (2 composés squat + 4 isolations quads/fessiers/ischios sur la semaine, en double via Legs≡Lower).
- **Variété structurelle** : ❌ Legs ≡ Lower.
- **Couverture isolation** : ✅ complète en nombre de slots, ❌ mal spécifiée (3×5-8).
- **Verdict global** : ❌ Problème sérieux — créneau 90 min sous-exploité, doublon Legs/Lower, absence d'ondulation d'intensité sur 5 jours de force consécutifs, `ISOLATION_SPEC.strength` inadapté.

---

### P24 — Beginner hypertrophy 4j → Upper/Lower (et non fullbody×4)

`{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'beginner' }`

**Simulation :**
- Étape 1 — `null` (l.402).
- Étape 2 — `case 4` (l.559) : `isMass=true` (hypertrophy) → **la condition l.561 est `if (isMass)` seule, sans aucun test de niveau** → **`['upper-push','lower-quad','upper-pull','lower-hip']`**. Les lignes 563 (`level !== 'beginner'`) et 565 (fullbody×4) ne sont jamais atteintes.
- Étape 3 — 8 / 6 / 8 / 6 slots (l.639).
- Étape 4 — compound 4×8-12/90 · isolation 3×10-15/75.
- `level='beginner'` → `pickExercise` retourne toujours `candidates[0]` (l.781) — sélection **déterministe**, avec rotation entre séances grâce au tri `usedGlobally` (l.773-776).
- Noms : "Upper — Haut du corps A" / "Lower — Bas du corps A" / "Upper — Haut du corps B" / "Lower — Bas du corps B".

**Table — Upper A (`upper-push`) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | chest / chest_upper | cmp | 4×8-12 |
| 2 | back_width / back_thickness / back | cmp | 4×8-12 |
| 3 | shoulders / shoulders_front (OHP) | cmp | 4×8-12 |
| 4 | chest / chest_lower / chest_upper (fly) | iso | 3×10-15 |
| 5 | triceps | iso | 3×10-15 |
| 6 | shoulders_lateral | iso | 3×10-15 |
| 7 | biceps | iso | 3×10-15 |
| 8 | back_thickness / back | iso | 3×10-15 |
| c | core | — | 3×15 |

**Table — Lower A (`lower-quad`) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads + glutes (squat) | cmp | 4×8-12 |
| 2 | hamstrings + glutes (RDL) | cmp | 4×8-12 |
| 3 | quads | iso | 3×10-15 |
| 4 | hamstrings | iso | 3×10-15 |
| 5 | glutes | iso | 3×10-15 |
| 6 | calves | iso | 3×10-15 |
| c | core | — | 3×15 |

**Table — Upper B (`upper-pull`) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | back_width / back | cmp | 4×8-12 |
| 2 | back_thickness / back | cmp | 4×8-12 |
| 3 | chest / chest_upper | cmp | 4×8-12 |
| 4 | shoulders_rear (face pull) | iso | 3×10-15 |
| 5 | biceps | iso | 3×10-15 |
| 6 | back_thickness / back | iso | 3×10-15 |
| 7 | triceps | iso | 3×10-15 |
| 8 | shoulders_lateral | iso | 3×10-15 |
| c | core | — | 3×15 |

**Table — Lower B (`lower-hip`) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | glutes + hamstrings (hip thrust) | cmp | 4×8-12 |
| 2 | quads + glutes (fente bulgare / step-up) | cmp | 4×8-12 |
| 3 | glutes | iso | 3×10-15 |
| 4 | hamstrings | iso | 3×10-15 |
| 5 | quads | iso | 3×10-15 |
| 6 | calves | iso | 3×10-15 |
| c | core | — | 3×15 |

**Assertions :**
- **Correction d'assertion du prompt confirmée** : `case 4` → `if (isMass) return ['upper-push','lower-quad','upper-pull','lower-hip']` à la **ligne 561**, sans condition sur `level`. Un débutant en hypertrophie ou en force à 4 j reçoit donc bien **upper/lower et non fullbody×4** : **PASS** (l.561).
- L'assertion initiale « JAMAIS upper/lower pour beginner 4j » est donc **FAIL** ; la correction figurant dans le prompt est la bonne.
- 8 / 6 / 8 / 6 slots : **PASS** (l.639)
- 10 / 8 / 10 / 8 exercices : **PASS**
- `pickExercise` déterministe (`candidates[0]`) : **PASS** (l.781)
- Aucun warning émis : **PASS** — l.1066 (force+débutant) inapplicable, l.1074 (≥5 j) inapplicable, l.1082-1091 (spécialisation) inapplicable (`publicTypes = {upper, lower}`, taille 2), l.1115 (déséquilibre push/pull) inapplicable (`upper-pull` présent).

**Coach :**
- **Réponse à la question du prompt** : upper/lower pour un débutant est **défendable mais discutable**. Points positifs : fréquence 2×/groupe (bonne pour l'apprentissage moteur), et les 4 séances contiennent toutes les deux mouvements fondamentaux du haut ou du bas du corps. Points négatifs : 10 exercices par séance upper dont 5 isolations, c'est **beaucoup de mouvements à apprendre en même temps** pour quelqu'un qui n'en maîtrise aucun. Un débutant progresse mieux avec 5-6 exercices bien exécutés qu'avec 10 approximatifs.
- **Incohérence de doctrine dans le code** : à 3 j (l.557) et à 4 j non-mass (l.565), le générateur protège explicitement le débutant en imposant du fullbody ; à 4 j en isMass (l.561) il ne le protège plus. Le même utilisateur passant de "Remise en forme" à "Prise de masse" bascule de fullbody×4 à upper/lower sans avertissement. **Recommandation : ajouter `&& level !== 'beginner'` à la ligne 561, ou émettre un `generatorWarning` dédié.**
- **Équilibre musculaire** : ✅ excellent (identique à P10/P19).
- **Cohérence objectif** : volume ~13 séries pec, ~20 dos — plutôt élevé pour un débutant, mais réparti sur 2 séances.
- **Durée/contenu** : Upper ≈ 60 min (calibré), Lower ≈ 46 min.
- **Variété structurelle** : ✅ vraie variété A/B côté upper et lower.
- **Couverture isolation** : ✅ complète.
- **Verdict global** : ⚠️ Problème mineur — programme techniquement bon, mais politique "débutant" incohérente entre les branches 3 j / 4 j-isMass / 4 j-non-mass.

---

### P25 — Beginner fat_loss 4j → fullbody×4

`{ goal:'fat_loss', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'beginner' }`

**Simulation :**
- Étape 1 — `null` (l.402).
- Étape 2 — `case 4` (l.559) : `isMass=false` → l.561 ignorée ; `level !== 'beginner'` faux → l.563 ignorée → **l.565** → **`['fullbody-quad','fullbody-hip','fullbody-quad','fullbody-hip']`**.
- Étape 3 — `adjustedSlotCount(9, 60, 'fat_loss')` = **9 slots** pour les quatre séances (l.639).
- Étape 4 — compound 3×12-15/60 · isolation 3×12-15/60.
- `level='beginner'` → `candidates[0]` déterministe (l.781), avec rotation via `usedGlobally` (l.773-776) : les séances A et C (même template) puisent dans des exercices différents tant que le pool le permet, idem B et D.
- Noms : canon `fullbody` ×4 → **"Full Body A" (lun) / "Full Body B" (mar) / "Full Body C" (jeu) / "Full Body D" (ven)**.
- Warmup et core tournent sur `workouts.length % pool.length` (l.1022, l.1032) → 4 échauffements et 4 exercices de gainage différents si les pools sont assez grands.

**Table — Full Body A et C (`fullbody-quad`) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup (rotation `[0]` / `[2]`) | — | 2×10 |
| 1 | quads + glutes | cmp | 3×12-15 |
| 2 | chest / chest_upper | cmp | 3×12-15 |
| 3 | back_width / back_thickness / back | cmp | 3×12-15 |
| 4 | shoulders / shoulders_front (OHP) | cmp | 3×12-15 |
| 5 | hamstrings | iso | 3×12-15 |
| 6 | shoulders_rear | iso | 3×12-15 |
| 7 | biceps | iso | 3×12-15 |
| 8 | calves | iso | 3×12-15 |
| 9 | triceps | iso | 3×12-15 |
| c | core (rotation `[0]` / `[2]`) | — | 3×15 |

**Table — Full Body B et D (`fullbody-hip`) :**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup (rotation `[1]` / `[3]`) | — | 2×10 |
| 1 | hamstrings + glutes (RDL / hip thrust) | cmp | 3×12-15 |
| 2 | chest / chest_upper | cmp | 3×12-15 |
| 3 | back_width / back (traction / lat pulldown) | cmp | 3×12-15 |
| 4 | shoulders / shoulders_front (OHP) | cmp | 3×12-15 |
| 5 | quads | iso | 3×12-15 |
| 6 | shoulders_lateral / shoulders_rear | iso | 3×12-15 |
| 7 | biceps | iso | 3×12-15 |
| 8 | calves | iso | 3×12-15 |
| 9 | triceps | iso | 3×12-15 |
| c | core (rotation `[1]` / `[3]`) | — | 3×15 |

**Assertions :**
- `!isMass` + beginner + 4 j → fullbody×4 : **PASS** (l.565, branche terminale du `case 4`)
- Comparaison avec P24 : **différence confirmée et documentée** — à 4 jours, `isMass` (hypertrophy/strength) mène à upper/lower **quel que soit le niveau** (l.561), tandis que `!isMass` (fat_loss/endurance) mène à fullbody×4 pour un débutant (l.565) et à push/pull/lower/fullbody pour un non-débutant (l.563). **C'est l'objectif, et non le niveau, qui décide de la protection du débutant à 4 jours.**
- 9 slots, 11 exercices par séance : **PASS**
- Aucun warning : **PASS** — `publicTypes = {fullbody}` de taille 1, mais `fullbody` est exclu de la liste des types de spécialisation (l.1085) ; `hasPullSession` vrai (l.1108).

**Coach :**
- **Réponse à la question du prompt** : 4 séances corps entier par semaine pour un débutant est **trop** en l'état — non pas en nombre de séances, mais en volume par séance. Chaque séance contient 9 slots × 3 séries = 27 séries de travail ; sur 4 séances, cela fait **108 séries hebdomadaires** avec chaque gros groupe sollicité 4×. Pour un débutant, la fatigue cumulée (courbatures persistantes, articulations non adaptées) est le premier facteur d'abandon. Un fullbody×3 (P04) ou un fullbody 4j réduit à 6 slots serait plus soutenable.
- **Récupération** : lun/mar puis jeu/ven — deux paires de jours consécutifs, chaque paire alternant quad-dominant et hip-dominant, ce qui limite le chevauchement direct sur les jambes. Le haut du corps, lui, est sollicité 4 jours par semaine à l'identique (bench + tirage + OHP à chaque séance) — c'est là que la récupération pèche.
- **Équilibre musculaire** : ✅ excellent — tout est couvert, push/pull 1:1 dans chaque séance, deltoïde postérieur systématique.
- **Cohérence objectif** : 3×12-15 à 60 s, format adapté au fat_loss. Mais, comme pour P08/P11/P14, **aucune composante cardio** n'est générée malgré `cardio_machine` disponible dans FULL.
- **Durée/contenu** : 27 séries × ~1,5 min + 7,5 ≈ **48 min** pour 60 annoncés. Marge de 12 min qui pourrait accueillir un finisher.
- **Variété structurelle** : ⚠️ deux structures pour quatre séances (A≡C, B≡D). Variété d'exercices assurée par `usedGlobally`, mais l'ordre musculaire ne varie jamais.
- **Couverture isolation** : ✅ complète.
- **Verdict global** : ⚠️ Problème mineur — bon squelette, mais volume hebdomadaire élevé pour un débutant et absence de cardio pour un objectif de perte de gras.

---

## Bloc 1 — Tableau de synthèse (P01–P25)

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|---|---|---|---|
| P01 | Split fullbody-quad/hip 2 j (l.549) · 9 slots · 11 ex. | ✅ PASS | Timing ≈ 69 min pour 60 annoncés ; noms réels "Full Body A/B" (suffixes non prévus par l'assertion) |
| P02 | beginner+isMass → fullbody×3, jamais PPL (l.557) | ✅ PASS | A≡C structurellement ; timing ≈ 69 min |
| P03 | beginner+strength → fullbody×3 (l.557) · 4 slots (l.638) · 5×3-5 | ✅ PASS | ≈ 78 min réels pour 60 ; zéro isolation ; deadlift seulement en séance B ; slot `back_width` probablement vide en BB+DB |
| P04 | !isMass+beginner → fullbody×3 (l.557) · 9 slots · 3×12-15 | ✅ PASS | Aucun cardio pour un objectif fat_loss ; slot `back_width` à risque en HOME |
| P05 | Invariant beginner 3 j (l.557) · pullup/chinup · autoProgress=false | ✅ PASS | 15-20 reps de traction irréaliste pour un débutant ; slots deltoïde lat/rear vides sans warning |
| P06 | isMass+!beginner → PPL (l.553) · 6 slots | ✅ PASS | Fréquence 1×/groupe ; séance ≈ 46 min pour 60 |
| P07 | strength=isMass → PPL et non PPF (l.435, 553) · 4 slots (l.638) | ✅ PASS | `ISOLATION_SPEC.strength` 3×5-8 inadapté ; slot `back_width` probablement vide en BB+DB |
| P08 | !isMass+!beginner → PPF (l.555) · fullbody 9 slots | ✅ PASS | Volume jambes faible ; séances 35-48 min pour 60 ; aucun cardio |
| P09 | PPF identique à P08 (l.555) · pullup+inverted row | ✅ PASS | Endurance sans cardio ; épaules lat/rear absentes de la semaine |
| P10 | isMass+4 j → upper/lower (l.561) · 8/6/8/6 · noms A/B | ✅ PASS | Séances Lower ≈ 46 min pour 60 |
| P11 | !isMass+!beginner+4 j (l.563) · lower-quad → type public `lower` (l.120) | ✅ PASS | 3 séances sur 4 à ≈ 35 min ; aucun cardio |
| P12 | Split identique P11 · 4 et 6 slots (l.636) | ❌ FAIL sportif | `adjustedSpec` réduit aussi à 2 séries (l.654) → ≈ 20 min de contenu pour 45 annoncés ; trou dorsal en HOME |
| P13 | isMass+!beginner+5 j → PPL+UL (l.569) · SLOTS['upper'] / SLOTS['lower'] | ⚠️ PASS avec réserve | **`SLOTS['lower']` ≡ `SLOTS['legs']`** → séances 3 et 5 identiques ; 4 séances sur 5 à ≈ 46 min |
| P14 | !isMass+!beginner+5 j (l.573) · lower-quad/lower-hip distincts · suffixes A/B | ✅ PASS | Jambes 3 jours consécutifs (mer/jeu/ven) ; ≈ 35 min/séance ; aucun cardio |
| P15 | advanced+3 j → PPL (l.553) · `adjustedSlotCount(6,90)=8` | ⚠️ PASS fonction / ❌ FAIL effet | Le bonus +2 des 90 min est **inopérant** sur les templates base 6 (`slice`, l.985) → 6 slots ≈ 46 min pour 90 annoncées |
| P16 | PPL force advanced · 4 slots (l.638) · top-3 aléatoire (l.782) | ✅ PASS | `ISOLATION_SPEC.strength` ; `autoProgress=false` si traction retenue en force |
| P17 | PPF (l.555) · 4 et 6 slots (l.636) · 2 séries (l.654) | ❌ FAIL sportif | −55 % de volume pour −25 % de durée ; ≈ 20-26 min pour 45 annoncées |
| P18 | PPF identique à P09 malgré advanced (l.555) · autoProgress=false | ✅ PASS | Aucune modélisation de progression en calisthenics ; épaules lat/rear absentes |
| P19 | upper/lower identique à P10 (l.561) · top-3 chest compound | ✅ PASS | Volume court pour un confirmé ; Lower ≈ 46 min |
| P20 | isMass+4 j (l.561) · 4 slots pour base 8 et base 6 (l.638) · barre prioritaire (l.708) | ✅ PASS | Isolations Lower probablement vides en BB+DB (sans warning) ; slot `back_width` à risque |
| P21 | !isMass+!beginner+4 j (l.563) — niveau sans effet | ✅ PASS | **advanced ≡ intermediate** dans tout le générateur sauf `DURATION_WEEKS` (l.679) |
| P22 | PPL+UL identique à P13 (l.569) · top-3 sur 2 slots | ⚠️ PASS avec réserve | Legs ≡ Lower ; Upper recoupe Push+Pull → 3 structures pour 5 séances |
| P23 | 5 j force 90 min · `min(base,5)` = 5 slots partout (l.642) | ⚠️ PASS avec réserve | ≈ 64 min pour 90 annoncées ; Legs ≡ Lower ; 5 jours de force consécutifs sans ondulation ; `ISOLATION_SPEC.strength` |
| P24 | **beginner+isMass+4 j → upper/lower** (l.561, `if (isMass)` sans test de niveau) | ✅ PASS (correction du prompt validée) | Politique "débutant" incohérente : protégé à 3 j (l.557) et à 4 j non-mass (l.565), pas à 4 j isMass |
| P25 | !isMass+beginner+4 j → fullbody×4 (l.565) · 9 slots · noms A/B/C/D | ✅ PASS | 108 séries/semaine pour un débutant ; haut du corps sollicité 4 j/7 ; aucun cardio |

---

## Bloc 2 — Synthèse des problèmes ouverts (groupe A)

### Bugs / anomalies logicielles

1. **`SLOTS['lower']` est un doublon exact de `SLOTS['legs']`** (l.148-155 vs l.166-173).
   *Profils* : P13, P22, P23.
   *Impact* : dans tout split 5 j isMass (`['push','pull','legs','upper','lower']`, l.569), les séances 3 et 5 sont le même entraînement sous deux noms différents. L'utilisateur croit avoir une alternance, il subit une répétition ; les jambes reçoivent deux séances quad-dominantes rapprochées.
   *Correction* : remplacer `'lower'` par `'lower-hip'` en position 5 de la ligne 569 (et éventuellement `'legs'` par `'lower-quad'`), ou redéfinir `SLOTS['lower']` en variante hip-dominante.

2. **Le bonus « +2 slots » du créneau 90 min est inopérant sur tous les templates de base 6** (l.643 + `slice` l.985).
   *Profils* : P15 (hypertrophy 90 min), et tout profil 90 min non-force sur push/pull/legs/lower/lower-quad/lower-hip.
   *Impact* : `adjustedSlotCount` retourne 8, mais le tableau de slots n'en contient que 6 → la séance de 90 min est identique à celle de 60 min (≈ 46 min de contenu réel). Le choix de durée le plus engageant du wizard n'a aucun effet.
   *Correction* : étendre les templates base 6 à 8 slots (ajouter par ex. un 2ᵉ composé pec/dos en push/pull, un slot adducteurs/abducteurs en legs), ou signaler dans le wizard que 90 min n'apporte rien sur ces splits.

3. **Double réduction slots × séries à 45 min** (`adjustedSlotCount` l.636 **et** `adjustedSpec` l.654).
   *Profils* : P12 (endurance 45 min), P17 (fat_loss 45 min).
   *Impact* : le volume chute de 50 à 55 % quand la durée ne baisse que de 25 %. Contenu réel ≈ 20 min pour un créneau de 45 min. Sous le seuil de stimulus.
   *Correction* : n'appliquer qu'un seul des deux mécanismes à 45 min — soit couper les slots, soit couper les séries, pas les deux.

4. **Slots isolation vides silencieux.**
   *Profils* : P05, P09, P18 (BW+BAR : deltoïde latéral, deltoïde postérieur, avant-bras), P20 (BB+DB : leg extension, leg curl), P12 (HOME).
   *Impact* : `pickExercise` retourne `null`, le `continue` l.1007 saute le slot, et le warning n'est émis **que si `slot.compound`** (garde l.996). L'utilisateur reçoit une séance amputée sans savoir pourquoi.
   *Correction* : émettre aussi un warning (ou un slot de repli) pour les isolations vides, au moins de façon agrégée ("3 slots d'isolation n'ont pas pu être remplis avec votre équipement").

5. **`ISOLATION_SPEC.strength` = 3×5-8 / repos 120 s** (l.81).
   *Profils* : P07, P16, P20, P23 (tout profil force dont le nombre de slots dépasse le nombre de composés du template).
   *Impact* : écarté haltères, élévation latérale, leg extension, leg curl et curl biceps prescrits en 5 à 8 répétitions lourdes. Sans bénéfice de force (ce ne sont pas des mouvements de force) et avec un risque articulaire réel (épaule en fly lourd, genou en leg extension lourde).
   *Correction* : passer `ISOLATION_SPEC.strength` à 3×8-12 / 90 s.

6. **`autoProgress=false` sur les mouvements au poids du corps, y compris quand ils portent un programme de force** (l.789-790).
   *Profils* : P16, P19 (traction retenue sur le slot `back_width` en FULL), tous les profils BW+BAR.
   *Impact* : le mouvement de tirage principal d'un programme de force n'a aucune progression automatique. En calisthenics (P05, P09, P18), c'est tout le programme qui est privé de progression.
   *Correction* : modéliser le lest (`pullup_bar` avec ceinture) ou une progression par variante.

7. **Politique « protection du débutant » incohérente entre les branches de `selectSplit`.**
   *Profils* : P24 vs P25.
   *Impact* : `case 3` (l.557) et `case 4` non-mass (l.565) imposent du fullbody au débutant ; `case 4` isMass (l.561) ne le fait pas. Un même débutant obtient fullbody×4 en "Remise en forme" et upper/lower en "Prise de masse", sans avertissement.
   *Correction* : ajouter `&& level !== 'beginner'` à la ligne 561, ou émettre un `generatorWarning` dédié pour beginner + upper/lower.

8. **`level='advanced'` est fonctionnellement identique à `level='intermediate'`.**
   *Profils* : P15-P23 comparés à P06-P14.
   *Impact* : `selectSplit` ne teste que `!== 'beginner'` (l.553, 555, 563, 569, 573) ; les specs sont indexées par objectif seul (l.73, l.80) ; `pickExercise` traite les deux niveaux à l'identique (l.782). Seul `DURATION_WEEKS` diffère (12 vs 16 semaines, l.679-683). Un utilisateur confirmé n'obtient ni plus de volume, ni plus de fréquence, ni des specs différentes.
   *Correction* : différencier au moins le volume (slots ou séries) ou la fréquence pour `advanced`.

### Réserves coach cumulées, par thème

**Calibration durée ↔ contenu (le thème le plus lourd — 20 profils sur 25 concernés)**
Le générateur annonce une durée que le contenu ne respecte presque jamais. Deux régimes opposés coexistent :
- *Sur-remplissage* : templates base 9 en hypertrophie ou en force → P01, P02 (≈ 69 min pour 60), P03 (≈ 78 min pour 60).
- *Sous-remplissage* : templates base 6 → P06, P08, P09, P11, P13, P14, P15, P17, P19, P21, P22, P23 (de 35 à 46 min pour 60, ≈ 46 min pour 90 en P15, ≈ 64 min pour 90 en P23), et cas extrêmes à 45 min : P12 et P17 (≈ 20 min pour 45).
*Recommandation* : calibrer les bases de slots sur un **budget temps** (durée × objectif) plutôt que sur un nombre fixe par template ; les bases actuelles (6 vs 8 vs 9) ne représentent pas le même volume horaire.

**Absence de cardio pour l'objectif `fat_loss` (P04, P08, P11, P14, P21, P25) et l'objectif `endurance` (P05, P09, P12, P18)**
Aucun slot du générateur ne cible `cardio_machine`, et `strengthEquipmentPrio` le déclasse explicitement (l.716). Le préréglage "Salle" (FULL) inclut pourtant cet équipement. L'utilisateur qui choisit "Remise en forme" ou "Endurance" reçoit un programme de musculation en séries longues, sans travail cardio-respiratoire — alors que 12 à 25 min sont libres dans chaque créneau.
*Recommandation* : ajouter un slot terminal conditionnel `cardio` pour `goal ∈ {fat_loss, endurance}` quand `cardio_machine` est disponible, ou un finisher métabolique (KB swing, circuit) sinon.

**Fréquence par groupe musculaire (P06, P07, P15, P16, P18)**
Les splits PPL et PPF à 3 j ne sollicitent chaque groupe qu'une fois par semaine, y compris pour des profils confirmés à 90 min. C'est le paramètre le plus corrélé aux gains d'hypertrophie et de force après le stade débutant.
*Recommandation* : préférer upper/lower ou fullbody à 3 j pour `advanced`, ou densifier les séances PPL.

**Trous d'équipement (P03, P04, P07, P12, P17, P20 : slot `back_width` compound ; P05, P09, P18 : deltoïdes ; P20 : isolations jambes)**
Le slot `['back_width','back']` apparaît dans `pull`, `upper-pull`, `fullbody-hip`, `lower_pull`, `chest-back`, `back-bi`, `glutes-hip`. Sans `pullup_bar` ni `cable`/`machine` (donc en BB+DB comme en HOME), il n'a très probablement aucun candidat, ce qui prive de tirage vertical tous les profils "barre + haltères" et "home gym".
*Recommandation* : élargir ce slot à `['back_width','back','back_thickness']` en repli, ou vérifier/ajouter dans le seed un composé `back_width` réalisable en haltères (pull-over) et en élastique (lat pulldown ancré).

**Récupération et enchaînement des jours (P14, P23, P25)**
`DAY_ASSIGNMENTS` (l.581-586) est statique et ignore la nature des séances : P14 enchaîne trois séances sollicitant les jambes mer/jeu/ven ; P23 place cinq séances de force consécutives avec deux séances jambes identiques à 48 h ; P25 fait travailler le haut du corps quatre jours par semaine chez un débutant.
*Recommandation* : ordonner les séances du split de façon à espacer les types identiques, ou proposer des jours par défaut dépendant du split.

**Différenciation des séances de même type (P02, P04, P05, P25 : A≡C / A≡C et B≡D ; P13, P22, P23 : Legs≡Lower)**
Quand un même template apparaît plusieurs fois dans la semaine, seuls les exercices changent (via le tri `usedGlobally`, l.773-776) ; l'ordre musculaire et le choix des slots sont figés.
*Recommandation* : introduire une variante B pour chaque template répété (comme `fullbody-quad`/`fullbody-hip` le fait déjà correctement), notamment pour `legs`/`lower`.

**Répétitions inatteignables au poids du corps (P05, P09, P18)**
`COMPOUND_SPEC.endurance` prescrit 15-20 répétitions sans tenir compte de la difficulté relative de l'exercice : 15-20 tractions pour un débutant (P05) est hors de portée ; 3×15-20 pompes pour un confirmé (P18) est de l'entretien.
*Recommandation* : moduler les cibles de répétitions pour les exercices `bodyweight`/`pullup_bar`, ou proposer une progression par variante.

### Incohérences wizard ↔ générateur relevées depuis le groupe A

- **P07 (auto, force, intermediate, 3 j) → PPL** via la ligne 553, alors que le filtre wizard `incompatibleReason('ppl')` bloque le choix explicite de PPL pour l'objectif Force (à vérifier en P58, groupe D). Le générateur produit donc automatiquement un split que le wizard interdit de choisir. À trancher : soit `isMass` doit exclure `strength` du PPL 3 j, soit le filtre wizard est trop strict.
- **P24 (beginner, hypertrophy, 4 j) → upper/lower** sans aucun garde-fou de niveau, alors que le wizard bloque explicitement Arnold et Bro Split pour les débutants au motif de la complexité (P53, P57). La même logique de protection devrait s'appliquer à upper/lower généré automatiquement, ou ne s'appliquer nulle part.
- **P15 / P23 (90 min)** : le wizard affiche pour l'objectif Force une note « 90 min = 5 exercices », cohérente avec `min(base,5)` (l.642). En revanche, rien n'informe l'utilisateur non-force que 90 min ne produit **aucun exercice supplémentaire** sur les splits PPL/legs/lower (base 6).

