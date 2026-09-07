# Audit `generateProgramDraft` v4 — Résultats complets (P01–P70)

> Généré par 6 agents parallèles — fusionné le 2026-09-07.
> Fichiers sources : audit_result_v4_group[A-F].md

---

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




---


# Audit `generateProgramDraft` v4 — GROUPE B (P26 → P37)

> Chemin **Auto + focusMuscles** (`splitPreference` absent → `'auto'`, étape 5 Muscles active).
> Toutes les lignes citées réfèrent à `src/utils/programGenerator.ts`.

## Rappels de code utilisés dans tout le groupe

`workoutTypeFromFocus` (l. 399-431), ordre des règles :

| # | Ligne | Règle | Retour |
|---|-------|-------|--------|
| 0 | 402 | `focusMuscles.length === 0` | `null` |
| 1 | 412 | `hasLower && !hasUpper` | `'lower'` |
| 2 | 416 | `hasCore && !hasLower && !hasUpper` | `null` |
| 3 | 418 | `hasPush && !hasPull && !hasLower` | `'push'` |
| 4 | 420 | `hasPull && !hasPush && !hasLower` | `'pull'` |
| 5 | 422 | `hasUpper && !hasLower` | `'upper'` |
| 6 | 425 | `hasLower && hasPush && !hasPull` | `'lower_push'` |
| 7 | 428 | `hasLower && hasPull && !hasPush` | `'lower_pull'` |
| 8 | 430 | (défaut) | `null` |

Flags (l. 404-409) : `hasLower = legs`, `hasPush = chest || shoulders`, `hasPull = back`,
`hasArms = arms`, `hasCore = core`, `hasUpper = hasPush || hasPull || hasArms`.

`selectSplit` (l. 433) → `focusType` calculé l. 500, branches : `lower` l. 503-507 ·
`upper` l. 511-520 · `push` l. 523-530 · `pull` l. 533-540 · fallback type fixe l. 543 ·
split par défaut l. 547-576.

`adjustedSlotCount` l. 627-644 · `adjustedSpec` l. 651-655 · `reorderSlotsByFocus` l. 691-701
(appliqué **avant** la coupe de durée, l. 983-985 — un slot ciblé remonté survit à la coupe).
Nommage / suffixes A/B/C : l. 1038-1041 (le suffixe se calcule sur le **type public**, `toPublicType` l. 117-127).

Specs (l. 73-89) : hypertrophie cmp `4×8-12`/90 s, iso `3×10-15`/75 s · force cmp `5×3-5`/180 s,
iso `3×5-8`/120 s · fat_loss cmp & iso `3×12-15`/60 s · warmup `2×10`/0 s · core `3×15`/60 s.

---

## P26 — Auto + chest, hypertrophy 2j 60 min DB beginner

**Étape 1** — `workoutTypeFromFocus(['chest'])`
`hasLower=false · hasPush=true (chest, l.405) · hasPull=false · hasArms=false · hasCore=false · hasUpper=true`
→ règles 1-2 ignorées, **règle l. 418** `hasPush && !hasPull && !hasLower` → **`'push'`**

**Étape 2** — `selectSplit` : `pref='auto'` (l. 436), `focusType='push'` → branche l. 523,
`case 2` **l. 525** → **`['push','upper-push']`**
Types publics : `push` / `upper` → 2 canons distincts → `totalOfType=1` chacun (l. 1039) → **aucun suffixe**.
Noms : `Push — Poussée` / `Upper — Haut du corps`.

**Étape 3** — `focusedMuscles = {chest, chest_upper, chest_lower}` (l. 936-938).
- `push` : base 6 → `adjustedSlotCount(6, 60, 'hypertrophy')` = 60 min non-force → `base` = **6**
- `upper-push` : base 8 → **8**
`reorderSlotsByFocus` : les slots pectoraux sont déjà en tête de leur bloc (cmp 0, iso 0) → **ordre canonique inchangé** dans les deux séances.

**Étape 4/5 — Séance 1 · Push — Poussée (6 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | chest / chest_upper / chest_lower | cmp | 4×8-12 (90 s) |
| 2 | shoulders / shoulders_front | cmp | 4×8-12 |
| 3 | chest / chest_upper / chest_lower | iso | 3×10-15 (75 s) |
| 4 | triceps | iso | 3×10-15 |
| 5 | shoulders_lateral / shoulders | iso | 3×10-15 |
| 6 | shoulders_rear | iso | 3×10-15 |
| c | core | — | 3×15 |

**Séance 2 · Upper — Haut du corps (8 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | chest / chest_upper | cmp | 4×8-12 |
| 2 | back_width / back_thickness / back | cmp | 4×8-12 |
| 3 | shoulders / shoulders_front | cmp | 4×8-12 |
| 4 | chest / chest_lower / chest_upper | iso | 3×10-15 |
| 5 | triceps | iso | 3×10-15 |
| 6 | shoulders_lateral | iso | 3×10-15 |
| 7 | biceps | iso | 3×10-15 |
| 8 | back_thickness / back | iso | 3×10-15 |
| c | core | — | 3×15 |

Remplissage DB : les 14 slots sont pourvus (bench DB, shoulder press DB, fly, triceps, lateral raise, rear-delt fly, row DB, curl, pullover DB). Aucun slot vide.
`progressStepKg = 2.5`, `autoProgress = true` (l. 789-790, dumbbell).

**Assertions**

| Assertion | Verdict | Ligne |
|---|---|---|
| `workoutTypeFromFocus(['chest'])` → `'push'` | **PASS** | 418 |
| Split 2j push = `['push','upper-push']` (alternance, pas `['push','push']`) | **PASS** | 525 |
| Noms `Push — Poussée` / `Upper — Haut du corps` (sans suffixe) | **PASS** | 1039-1041 |
| Chest en tête dans les deux séances | **PASS** (déjà slot 0 canonique ; reorder sans effet) | 691-701 |

**Warning généré** : UX-5 (l. 1115) — `hasPushSession=true`, `hasPullSession=false` (`upper-push` n'est pas dans la liste pull l. 1103-1109) → *« Déséquilibre push/pull : aucune séance de tirage »*.
⚠️ **Faux positif partiel** : la séance `upper-push` contient bien 1 composé dos + 1 isolation dos. Le message est trop absolu.

**Évaluation coach** — Sur la semaine : 4 slots pecs, 4 slots épaules, 2 triceps… contre **1 composé dos + 1 isolation dos**. Ratio push/pull ≈ 5:1, très au-delà du 1:1 recommandé. Sur 2 séances/sem. c'est tenable 4-6 semaines en bloc de spécialisation, pas plus. 6 et 8 slots + warmup + core en 60 min hypertrophie (≈ 22 et 29 séries) → **irréaliste** : ~4 min/série ⇒ 90-115 min réels. Le bas du corps est totalement absent (cohérent avec un focus, mais aucun warning ne le signale). Verdict variété : **variété structurelle** (push ≠ upper-push). Isolation manquante : dos, jambes, avant-bras — lacune acceptable pour un bloc pec, **problématique** au-delà.

---

## P27 — Auto + back, hypertrophy 3j 60 min BB+DB+CABLE beginner

**Étape 1** — `workoutTypeFromFocus(['back'])`
`hasLower=false · hasPush=false · hasPull=true (l.406) · hasArms=false · hasCore=false · hasUpper=true`
→ règle 3 (l. 418) échoue (`hasPush=false`), **règle l. 420** `hasPull && !hasPush && !hasLower` → **`'pull'`**

**Étape 2** — branche `pull` l. 533, `case 3` **l. 535** → **`['pull','upper-pull','pull']`**
Types publics : `pull`, **`upper`**, `pull` → `totalOfType('pull')=2`, `totalOfType('upper')=1`.
Noms réels : **`Pull — Tirage A` / `Upper — Haut du corps` (sans suffixe) / `Pull — Tirage B`**.

**Étape 3** — `focused = {back, back_width, back_thickness}`.
- `pull` base 6 → `adjustedSlotCount(6,60,'hypertrophy')` = **6**
- `upper-pull` base 8 → **8**
Reorder `pull` : les 3 premiers slots sont déjà dos → inchangé.
Reorder `upper-pull` : compounds inchangés (2 dos puis chest) ; **isolations réordonnées** — l'isolation dos (pos 6 canonique) remonte en **1ʳᵉ isolation**, devant face pull / biceps.

**Séances A et C · Pull — Tirage (6 slots)**

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

**Séance B · Upper — Haut du corps (8 slots, après reorder)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | back_width / back | cmp | 4×8-12 |
| 2 | back_thickness / back | cmp | 4×8-12 |
| 3 | chest / chest_upper | cmp | 4×8-12 |
| 4 | back_thickness / back (iso dos — **remonté**) | iso | 3×10-15 |
| 5 | shoulders_rear | iso | 3×10-15 |
| 6 | biceps | iso | 3×10-15 |
| 7 | triceps | iso | 3×10-15 |
| 8 | shoulders_lateral | iso | 3×10-15 |
| c | core | — | 3×15 |

Remplissage BB+DB+CABLE : tous les slots pourvus (lat pulldown câble, row barbell, pullover DB, curl, face pull, wrist curl, bench barbell…).

**Assertions**

| Assertion | Verdict | Ligne |
|---|---|---|
| `workoutTypeFromFocus(['back'])` → `'pull'` | **PASS** | 420 |
| Split 3j pull = `['pull','upper-pull','pull']` | **PASS** | 535 |
| Noms « Pull — Tirage A/B/C » | **FAIL** — réel : `Pull — Tirage A` / `Upper — Haut du corps` / `Pull — Tirage B`. `upper-pull` se projette sur le type public `upper` (l. 119) donc compte séparément dans `totalOfType` | 1039-1041 |
| Dos en tête dans chaque séance | **PASS** (compounds dos en 1-2 partout ; iso dos remontée en B) | 691-701 |

**Warnings** : aucun. `publicTypes = {pull, upper}` → taille 2, donc **pas** de warning de spécialisation (l. 1083). `hasPullSession=true` → pas de warning push/pull.

**Évaluation coach** — 3 séances, 20 slots, dont **14 orientés dos/biceps**. Pectoraux : 1 seul composé sur la semaine ; quadriceps, ischios, fessiers, mollets : **zéro**. Le ratio pull/push ≈ 7:1 inverse le déséquilibre habituel — sans risque postural (le tirage protège l'épaule) mais le programme n'est **pas complet** : c'est un bloc de spécialisation. Problème : **aucun warning n'est émis** alors que le programme est aussi déséquilibré que P26 (qui, lui, en reçoit un). L'asymétrie de la règle UX-5 (elle ne détecte que l'absence de tirage) est une lacune à corriger. Variété : **structurelle** (pull vs upper-pull) mais A et C sont **identiques structurellement** — seule la rotation d'exercices via `usedGlobally` (l. 773-775) les différencie. Couverture isolation : complète côté dos/bras, **lacunes problématiques** sur jambes et pecs.

---

## P28 — Auto + legs, hypertrophy 4j 60 min BW beginner

**Étape 1** — `workoutTypeFromFocus(['legs'])`
`hasLower=true · hasPush=false · hasPull=false · hasArms=false · hasCore=false · hasUpper=false`
→ **règle l. 412** `hasLower && !hasUpper` → **`'lower'`**

**Étape 2** — branche `focusType === 'lower'` **l. 503-506** :
`Array.from({length:4}, (_,i) => i%2===0 ? 'lower-quad' : 'lower-hip')`
→ **`['lower-quad','lower-hip','lower-quad','lower-hip']`**
`toPublicType` → `'lower'` ×4 → `totalOfType=4` → suffixes **A/B/C/D**, tous nommés `Lower — Bas du corps`.

**Étape 3** — `focused = {quads, hamstrings, glutes, calves}` : **tous** les slots de `lower-quad` et `lower-hip` sont ciblés → `reorderSlotsByFocus` sans effet (tous `aF=0`).
`adjustedSlotCount(6, 60, 'hypertrophy')` = **6** pour les deux types.

**Séances A et C · lower-quad (6 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads / glutes | cmp | 4×8-12 |
| 2 | hamstrings / glutes | cmp | 4×8-12 |
| 3 | quads | iso | 3×10-15 |
| 4 | hamstrings | iso | 3×10-15 |
| 5 | glutes | iso | 3×10-15 |
| 6 | calves | iso | 3×10-15 |
| c | core | — | 3×15 |

**Séances B et D · lower-hip (6 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | glutes / hamstrings | cmp | 4×8-12 |
| 2 | quads / glutes | cmp | 4×8-12 |
| 3 | glutes | iso | 3×10-15 |
| 4 | hamstrings | iso | 3×10-15 |
| 5 | quads | iso | 3×10-15 |
| 6 | calves | iso | 3×10-15 |
| c | core | — | 3×15 |

**Remplissage réel en BW pur** (vérifié dans `exercises-seed.json`) :
le pool bodyweight non-warmup contient `bw-squat`, `bw-lunge`, `bw-jump-squat`, `seed-curtsy-lunge`, `seed-hip-thrust-bw`, `bw-wall-sit`, `seed-glute-bridge`, `seed-donkey-kick`, `seed-fire-hydrant`, `bw-calf-raise`.
**Aucun exercice ischio-jambiers** : `seed-good-morning-bw` est `isWarmupExercise` (exclu l. 943) et `bw-nordic-curl` est `pullup_bar`.
→ slot 4 (`hamstrings` iso) **vide et silencieux** dans les 4 séances (pas de warning : le warning n'existe que pour `slot.compound`, l. 996).
→ chaque séance rend **5 exercices + warmup + core = 7**, pas 8.

**Assertions**

| Assertion | Verdict | Ligne |
|---|---|---|
| `workoutTypeFromFocus(['legs'])` → `'lower'` | **PASS** | 412 |
| Split = `['lower-quad','lower-hip','lower-quad','lower-hip']` | **PASS** | 503-506 |
| Noms `Lower — Bas du corps A/B/C/D` | **PASS** | 1039-1041 |
| « slot hamstrings **compound** vide en BW pur » | **FAIL** — le slot `{hamstrings, glutes}` cmp trouve `seed-hip-thrust-bw` (glutes, compound, pop 3) : le filtre `slot.muscles.includes(primaryMuscle)` (l. 733) accepte glutes. Le slot **réellement vide** est l'isolation `hamstrings` (silencieuse) | 733-745 |
| `autoProgress:false`, `progressStepKg:0` | **PASS** (equipment `bodyweight`) | 789-790 |

**Warnings** : UX-D (l. 1083-1090) — `publicTypes = {'lower'}`, taille 1, `t==='lower'` → *« Programme de spécialisation… »*. Aucun warning « composé indisponible » (tous les slots compound trouvent un candidat).

**Évaluation coach** — 4 séances jambes/sem. en poids du corps chez un débutant : **volume excessif en fréquence, insuffisant en intensité**. Le squat BW (pop 3) sature dès la 2ᵉ semaine chez la plupart des débutants ; sans charge externe, la progression passe uniquement par les reps, et `autoProgress=false` le confirme. Les ischios ne sont **jamais** entraînés (ni compound ni isolation) — lacune **problématique** sur un programme jambes : déséquilibre quadriceps/ischios direct, facteur de risque genou. Le haut du corps est absent des 4 séances : sur 4 j/sem. c'est une semaine entière sans tirage → poids sur la posture. Verdict variété : **structurelle** (quad-dominant vs hip-dominant) + rotation exercices forcée par `usedGlobally` (séance B prendra `seed-curtsy-lunge`/`bw-lunge` faute d'inédits). Recommandation : 2 j jambes + 2 j haut du corps, ou ajouter une barre de traction (`bw-nordic-curl` débloque les ischios).

---

## P29 — Auto + core seul, hypertrophy 2j 60 min BW beginner (régression BUG#3)

**Étape 1** — `workoutTypeFromFocus(['core'])`
`hasLower=false · hasPush=false · hasPull=false · hasArms=false · hasCore=true · hasUpper=false`
→ règle 1 (l. 412) échoue (`hasLower=false`), **règle l. 416** `hasCore && !hasLower && !hasUpper` → **`null`**

**Étape 2** — `focusType` falsy → le bloc l. 501-544 est sauté → split par défaut, `switch(daysPerWeek)` **case 2, l. 548-549** → **`['fullbody-quad','fullbody-hip']`**
`toPublicType` → `'fullbody'` ×2 → **`Full Body A` / `Full Body B`**.

**Étape 3** — `focused = {core}`. Aucun slot de `SLOTS` ne contient `core` → tous les slots ont `aF=1` → tri stable neutre, ordre canonique conservé (l. 693-700).
`adjustedSlotCount(9, 60, 'hypertrophy')` = **9** pour les deux séances.

**Séance A · fullbody-quad (9 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads / glutes | cmp | 4×8-12 |
| 2 | chest / chest_upper | cmp | 4×8-12 |
| 3 | back_width / back_thickness / back | cmp | 4×8-12 |
| 4 | shoulders / shoulders_front | cmp | 4×8-12 |
| 5 | hamstrings | iso | 3×10-15 |
| 6 | shoulders_rear | iso | 3×10-15 |
| 7 | biceps | iso | 3×10-15 |
| 8 | calves | iso | 3×10-15 |
| 9 | triceps | iso | 3×10-15 |
| c | **core** (corePool, l. 1031-1036) | — | 3×15 |

**Séance B · fullbody-hip (9 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | hamstrings / glutes | cmp | 4×8-12 |
| 2 | chest / chest_upper | cmp | 4×8-12 |
| 3 | back_width / back | cmp | 4×8-12 |
| 4 | shoulders / shoulders_front | cmp | 4×8-12 |
| 5 | quads | iso | 3×10-15 |
| 6 | shoulders_lateral / shoulders_rear | iso | 3×10-15 |
| 7 | biceps | iso | 3×10-15 |
| 8 | calves | iso | 3×10-15 |
| 9 | triceps | iso | 3×10-15 |
| c | **core** | — | 3×15 |

**Remplissage réel en BW pur** — sévère :
- A : slot 3 (dos cmp) **vide → warning** (tous les exos dos BW — `seed-cat-cow`, `seed-superman`, `seed-thoracic-rotation` — sont `isWarmupExercise`) ; slots 5 (ham), 6 (rear delt), 7 (biceps), 9 (triceps) vides et silencieux. **4 exercices retenus** sur 9.
- B : slot 3 (dos cmp) **vide → warning** ; slots 6, 7, 9 vides. **5 exercices retenus**.
⚠️ **Bug de déduplication** : la clé est `` `${workoutType}:${primaryMuscle}` `` (l. 998) → `fullbody-quad:back_width` ≠ `fullbody-hip:back_width` → **le même message « Aucun exercice composé disponible pour "dos (largeur)" » est poussé deux fois** dans `generatorWarnings`.

**Assertions**

| Assertion | Verdict | Ligne |
|---|---|---|
| `workoutTypeFromFocus(['core'])` → **null** | **PASS** | 416 |
| Split 2j → `['fullbody-quad','fullbody-hip']` | **PASS** | 548-549 |
| **JAMAIS** `['lower','lower']` | **PASS** — la règle l. 412 exige `hasLower`, faux ici ; l. 416 intercepte avant toute autre | 412 / 416 |
| Core en queue via `corePool` | **PASS** | 1031-1036 |

**Warnings** : (1) UX-6 « Focus gainage » `unshift` (l. 1135-1141) ✔ ; (2) « Aucun exercice composé disponible pour "dos (largeur)" » **×2** (doublon). Pas de warning de spécialisation (`publicTypes={'fullbody'}` mais `t` n'est ni push/pull/lower, l. 1085).

**Évaluation coach** — La dégradation sémantique est **correcte** : « core » n'est pas un type de séance, le fullbody + gainage en queue est la bonne réponse, et le warning UX-6 l'explique à l'utilisateur. En revanche l'exécution en **BW pur est très pauvre** : 4-5 exercices utiles sur 9 slots, sans **aucun** travail de dos ni de bras — un fullbody amputé de toute la chaîne de tirage. C'est le pire déséquilibre postural du groupe (pompes sans tirage), et il n'y a pas de warning global qui le dise (UX-5 ne se déclenche pas car `fullbody-*` est considéré comme séance de tirage l. 1108). Un utilisateur « core, poids du corps » devrait au minimum être orienté vers l'ajout d'une barre de traction. Verdict variété : structurelle (quad vs hip) mais annulée en pratique par le nombre de slots vides. Couverture isolation : **lacunes problématiques** (dos, bras, ischios).

---

## P30 — Auto + shoulders, hypertrophy 2j 60 min DB beginner

**Étape 1** — `workoutTypeFromFocus(['shoulders'])`
`hasLower=false · hasPush=true (**shoulders**, l. 405) · hasPull=false · hasArms=false · hasCore=false · hasUpper=true`
→ **règle l. 418** → **`'push'`**

**Étape 2** — branche `push` l. 523, `case 2` **l. 525** → **`['push','upper-push']`**
Noms : `Push — Poussée` / `Upper — Haut du corps` (canons distincts → aucun suffixe).

**Étape 3** — `focused = {shoulders, shoulders_front, shoulders_lateral, shoulders_rear}`.
Ici `reorderSlotsByFocus` **modifie réellement l'ordre** :
- `push` : compounds `[chest(NF), shoulders(F)]` → **`[shoulders, chest]`** ; isolations `[chest(NF), triceps(NF), sh_lat(F), sh_rear(F)]` → **`[sh_lat, sh_rear, chest, triceps]`**
- `upper-push` : compounds `[chest, back, shoulders(F)]` → **`[shoulders, chest, back]`** ; isolations `[chest, triceps, sh_lat(F), biceps, back]` → **`[sh_lat, chest, triceps, biceps, back]`**

`adjustedSlotCount(6,60,'hypertrophy')=6` · `adjustedSlotCount(8,60,'hypertrophy')=8`.

**Séance 1 · Push — Poussée (6 slots, réordonnés)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | **shoulders / shoulders_front (OHP)** | cmp | 4×8-12 |
| 2 | chest / chest_upper / chest_lower | cmp | 4×8-12 |
| 3 | shoulders_lateral / shoulders | iso | 3×10-15 |
| 4 | shoulders_rear | iso | 3×10-15 |
| 5 | chest / chest_upper / chest_lower | iso | 3×10-15 |
| 6 | triceps | iso | 3×10-15 |
| c | core | — | 3×15 |

**Séance 2 · Upper — Haut du corps (8 slots, réordonnés)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | **shoulders / shoulders_front (OHP)** | cmp | 4×8-12 |
| 2 | chest / chest_upper | cmp | 4×8-12 |
| 3 | back_width / back_thickness / back | cmp | 4×8-12 |
| 4 | shoulders_lateral | iso | 3×10-15 |
| 5 | chest / chest_lower / chest_upper | iso | 3×10-15 |
| 6 | triceps | iso | 3×10-15 |
| 7 | biceps | iso | 3×10-15 |
| 8 | back_thickness / back | iso | 3×10-15 |
| c | core | — | 3×15 |

Remplissage DB : tous les slots pourvus (shoulder press DB / arnold press, bench DB, row DB, lateral raise, rear-delt fly, fly, triceps, curl, pullover DB).

**Assertions**

| Assertion | Verdict | Ligne |
|---|---|---|
| `hasPush=true` via `shoulders` → `'push'` | **PASS** | 405 / 418 |
| Split = `['push','upper-push']` | **PASS** | 525 |
| Épaules remontées en tête | **PASS** — OHP passe de la position 2 → **1** dans `push` et de 3 → **1** dans `upper-push` ; latéral/postérieur en tête des isolations | 691-701 |
| Slot OHP présent dans les deux types | **PASS** | SLOTS l. 134 & 192 |

**Warnings** : UX-5 (l. 1115) → déséquilibre push/pull (même faux positif partiel qu'en P26 : `upper-push` contient 1 composé dos).
UX-B (l. 1094) **ne se déclenche pas** : `split.every(t => t === 'push')` est faux à cause de `upper-push`. Or le focus est `shoulders` et le biceps n'apparaît qu'une fois (séance 2, pos 7) — le garde-fou rate partiellement sa cible.

**Évaluation coach** — Sur la semaine : **2 OHP + 2 élévations latérales + 1 postérieure = 5 slots épaules**, contre 1 composé dos et 1 isolation dos. Le deltoïde antérieur est en plus sollicité par les 2 développés couchés → volume antérieur ~7 slots vs 1 postérieur. C'est le profil type de la **douleur d'épaule antérieure / conflit sous-acromial** à 6-8 semaines. Point positif : le slot `shoulders_rear` est bien remonté en 4ᵉ position de la séance 1 (le générateur protège l'arrière d'épaule par construction). Recommandation coach : imposer un ratio, ex. 1 slot postérieur par OHP. Durée : 6 et 8 slots + warmup + core en 60 min hypertrophie → **hors créneau** (~90-115 min). Variété : **structurelle**. Isolation : jambes, dos (largeur), avant-bras absents — **lacunes acceptables** pour un bloc épaules court, sauf le dos.

---

## P31 — Auto + chest+back, hypertrophy 3j 60 min FULL beginner

**Étape 1** — `workoutTypeFromFocus(['chest','back'])`
`hasLower=false · hasPush=true (chest) · hasPull=true (back) · hasArms=false · hasCore=false · hasUpper=true`
→ l. 412 non · l. 416 non · l. 418 non (`hasPull=true`) · l. 420 non (`hasPush=true`) · **règle l. 422** `hasUpper && !hasLower` → **`'upper'`**

**Étape 2** — branche `upper` l. 511, `case 3` **l. 514-516** :
`level !== 'beginner' ? ['push','pull','upper'] : ['upper-push','upper-pull','upper-push']`
`level='beginner'` → **`['upper-push','upper-pull','upper-push']`**
Les 3 se projettent sur `'upper'` → `totalOfType=3` → **`Upper — Haut du corps A / B / C`**.

**Étape 3** — `focused = {chest, chest_upper, chest_lower, back, back_width, back_thickness}`.
- `upper-push` : compounds `[chest(F), back(F), shoulders(NF)]` → inchangés ; isolations `[chest(F), triceps, sh_lat, biceps, back(F)]` → **`[chest, back, triceps, sh_lat, biceps]`**
- `upper-pull` : compounds `[back_width(F), back_thickness(F), chest(F)]` → inchangés ; isolations `[sh_rear, biceps, back(F), triceps, sh_lat]` → **`[back, sh_rear, biceps, triceps, sh_lat]`**
`adjustedSlotCount(8, 60, 'hypertrophy')` = **8** partout.

**Séances A et C · upper-push (8 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | **chest / chest_upper** | cmp | 4×8-12 |
| 2 | back_width / back_thickness / back | cmp | 4×8-12 |
| 3 | shoulders / shoulders_front | cmp | 4×8-12 |
| 4 | chest / chest_lower / chest_upper | iso | 3×10-15 |
| 5 | back_thickness / back (**remonté**) | iso | 3×10-15 |
| 6 | triceps | iso | 3×10-15 |
| 7 | shoulders_lateral | iso | 3×10-15 |
| 8 | biceps | iso | 3×10-15 |
| c | core | — | 3×15 |

**Séance B · upper-pull (8 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | **back_width / back** | cmp | 4×8-12 |
| 2 | back_thickness / back | cmp | 4×8-12 |
| 3 | chest / chest_upper | cmp | 4×8-12 |
| 4 | back_thickness / back (**remonté**) | iso | 3×10-15 |
| 5 | shoulders_rear | iso | 3×10-15 |
| 6 | biceps | iso | 3×10-15 |
| 7 | triceps | iso | 3×10-15 |
| 8 | shoulders_lateral | iso | 3×10-15 |
| c | core | — | 3×15 |

Remplissage FULL : 24 slots tous pourvus (bench BB, lat pulldown / pullup, OHP BB, fly, pullover, triceps, curl, lateral raise, row BB, face pull…).

**Assertions**

| Assertion | Verdict | Ligne |
|---|---|---|
| `['chest','back']` → `'upper'` | **PASS** | 422 |
| Split 3j upper beginner = `['upper-push','upper-pull','upper-push']` | **PASS** (branche `level === 'beginner'`) | 514-516 |
| Noms `Upper — Haut du corps A/B/C` | **PASS** | 1039-1041 |
| upper-push : chest premier · upper-pull : back premier | **PASS** | 691-701 / SLOTS 188, 200 |

⚠️ **Effet secondaire du reorder** : en `upper-push` le slot `shoulders_lateral` (écarté latéral) descend en position 7 et le **face pull disparaît totalement** de ce type (il n'y est pas au catalogue) ; en `upper-pull` le face pull, décrit dans le code comme « obligatoire » (commentaire l. 206), est **rétrogradé de la 1ʳᵉ à la 2ᵉ isolation** par le focus. Comportement mineur mais contraire à l'intention du commentaire.

**Warnings** : **aucun**. `publicTypes = {'upper'}` (taille 1) mais `'upper'` n'est pas dans la liste `push|pull|lower` (l. 1085) → **pas de warning de spécialisation** ; `hasPushSession` et `hasPullSession` tous deux vrais → pas d'UX-5 ; UX-6 branche 3 exige `hasFocusLower` → pas déclenchée.
→ **Lacune identifiée** : un programme **sans une seule séance de jambes sur 3 j/sem.** ne produit aucun avertissement. `'upper'` devrait être ajouté à la liste l. 1085.

**Évaluation coach** — Structurellement c'est le meilleur profil du groupe : équilibre push/pull quasi parfait (A : 1 chest cmp + 1 back cmp ; B : 2 back cmp + 1 chest cmp ; C = A), fréquence 3× par groupe du haut, biceps et triceps couverts dans les deux patterns. La faiblesse est **l'absence totale de bas du corps** sur un programme de 8 semaines (`DURATION_WEEKS.beginner`) : acceptable en bloc de spécialisation de 4-6 semaines, discutable en programme complet — et **non signalé**. A et C sont structurellement identiques : **variété d'exercices seulement** (via `usedGlobally`) — avec FULL le pool est assez large pour éviter les répétitions. 8 slots + warmup + core en 60 min → ~29 séries, **hors créneau** (~110 min). Couverture isolation : complète sur le haut du corps (pecs, dos, bis, tris, latéral, postérieur) — **lacunes acceptables** hors jambes.

---

## P32 — Auto + legs+back, hypertrophy 2j 60 min BB+DB beginner

**Étape 1** — `workoutTypeFromFocus(['legs','back'])`
`hasLower=true · hasPush=false · hasPull=true · hasArms=false · hasCore=false · hasUpper=true (via hasPull)`
→ l. 412 non (`hasUpper=true`) · l. 416 non · l. 418 non · l. 420 non (`hasLower=true`) · l. 422 non (`hasLower=true`) · l. 425 non (`hasPush=false`) · **règle l. 428** `hasLower && hasPull && !hasPush` → **`'lower_pull'`**

**Étape 2** — `lower_pull` ne correspond à aucune branche spéciale → **fallback l. 543** `Array.from({length:2}, () => 'lower_pull')` → **`['lower_pull','lower_pull']`** (type fixe, aucune alternance).
`toPublicType('lower_pull') = 'lower'` (l. 121) → `totalOfType=2` → **`Lower — Chaîne postérieure A` / `B`**.

**Étape 3** — `focused = {quads, hamstrings, glutes, calves, back, back_width, back_thickness}`.
8 des 9 slots sont ciblés (seul le curl biceps, pos 9, ne l'est pas) et il est déjà en dernier → **ordre canonique inchangé**.
`adjustedSlotCount(9, 60, 'hypertrophy')` : `duration===60` et goal ≠ strength → **`base` = 9**, aucun cap (le cap `min(base+2, 8)` n'existe qu'à 90 min, l. 643).
→ **9 slots + warmup + core = 11 exercices** ✔

**Séances A et B · lower_pull (9 slots — identiques)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | hamstrings / glutes | cmp | 4×8-12 (90 s) |
| 2 | back_width / back | cmp | 4×8-12 |
| 3 | back_thickness / back | cmp | 4×8-12 |
| 4 | quads / glutes | cmp | 4×8-12 |
| 5 | glutes / hamstrings | iso | 3×10-15 (75 s) |
| 6 | back_thickness / back_width / back | iso | 3×10-15 |
| 7 | hamstrings | iso | 3×10-15 |
| 8 | calves | iso | 3×10-15 |
| 9 | biceps | iso | 3×10-15 |
| c | core | — | 3×15 |

**Remplissage BB+DB** — tous les slots pourvus, mais avec des substitutions notables :
- slot 2 (`back_width/back` cmp) : **aucun back_width compound** en BB+DB (lat pulldown = câble, pull-up = pullup_bar) → le seul candidat est `seed-deadlift` (`primaryMuscle: 'back'`) → **le soulevé de terre atterrit sur le slot « largeur du dos »**, pas sur le slot ischios.
- slot 1 (`hamstrings/glutes` cmp) : `seed-romanian-deadlift` (pop 3) — le RDL, pas le deadlift.
- slots 5 et 7 : **aucune isolation glutes/hamstrings** en BB+DB → repli sur des composés (l. 749-750 : `isolationFirst` vide ⇒ on garde les composés) → hip thrust barbell (slot 5) et RDL DB (slot 7), avec les specs **isolation 3×10-15** appliquées à des composés lourds.

**Assertions**

| Assertion | Verdict | Ligne |
|---|---|---|
| `['legs','back']` → `'lower_pull'` | **PASS** | 428 |
| Split = `['lower_pull','lower_pull']` (fixe) | **PASS** | 543 |
| Noms `Lower — Chaîne postérieure A/B` | **PASS** | 601 / 1039-1041 |
| `adjustedSlotCount(9,60,'hypertrophy')` = 9, pas de cap → 11 exercices | **PASS** | 638-639 |
| « deadlift premier slot, puis tractions, puis rowing, puis squat » | **PASS sur la structure**, **nuance** : en BB+DB le slot 1 reçoit le **RDL** et le deadlift remonte au slot 2 (largeur dos) ; sans câble ni barre de traction il n'y a pas de traction | 733-745 |

**Warnings** : UX-D spécialisation (l. 1083-1090, `publicTypes={'lower'}`). Pas d'UX-5 (`lower_pull` compte comme séance de tirage, l. 1105). Pas d'UX-6.

**Évaluation coach** — Excellente logique de programmation : deadlift-first, 4 composés puis isolations, chaîne postérieure + dos = les deux blocs qui se marient le mieux dans une même séance. **Zéro pectoraux / épaules / triceps** sur la semaine, mais c'est le contrat du focus et le tirage protège la posture, donc **aucun risque postural** (contrairement à P26/P30). Vraies faiblesses : (1) les **deux séances sont structurellement identiques** — `['lower_pull','lower_pull']` sans variante quad/hip alors que le générateur sait alterner (`lower-quad`/`lower-hip`) : verdict **variété d'exercices seulement**, et avec BB+DB le pool est étroit (4-5 candidats par slot) donc les répétitions arrivent vite ; (2) 9 slots ≈ 33 séries en 60 min → **très hors créneau** (~120 min réels) ; (3) les slots d'isolation fessiers/ischios se remplissent avec des composés en 3×10-15, ce qui déforme l'intention. Recommandation : introduire une variante `lower_pull-quad` / `lower_pull-hip` pour l'alternance A/B.

---

## P33 — Auto + legs+shoulders, strength 3j 60 min BB+DB intermediate

**Étape 1** — `workoutTypeFromFocus(['legs','shoulders'])`
`hasLower=true · hasPush=true (shoulders) · hasPull=false · hasArms=false · hasCore=false · hasUpper=true`
→ l. 412 non · l. 416 non · l. 418 non (`hasLower`) · l. 420 non · l. 422 non (`hasLower`) · **règle l. 425** `hasLower && hasPush && !hasPull` → **`'lower_push'`**

**Étape 2** — fallback **l. 543** → **`['lower_push','lower_push','lower_push']`**
`toPublicType = 'lower'` → `totalOfType=3` → **`Lower — Squat & Press A / B / C`**.

**Étape 3** — `focused = {quads, hamstrings, glutes, calves, shoulders, shoulders_front, shoulders_lateral, shoulders_rear}`.
`reorderSlotsByFocus` **modifie l'ordre des composés** :
compounds canoniques `[0 quads(F), 1 chest(NF), 2 OHP(F), 3 ham/glutes(F)]` → tri stable par flag → **`[quads, OHP, ham/glutes, chest]`**
isolations `[4 quads(F), 5 calves(F), 6 chest(NF), 7 glutes(F), 8 triceps(NF)]` → **`[quads, calves, glutes, chest, triceps]`**

**Étape 4** — `adjustedSlotCount(9, 60, 'strength')` = `max(4, floor(9×0.5)) = max(4, 4)` = **4 slots** (l. 638) → on garde les **4 composés réordonnés**.

**Séances A / B / C · lower_push (4 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads / glutes (squat) | cmp | 5×3-5 (180 s) |
| 2 | **shoulders / shoulders_front (OHP)** | cmp | 5×3-5 |
| 3 | **hamstrings / glutes (RDL)** | cmp | 5×3-5 |
| 4 | **chest / chest_upper (bench)** | cmp | 5×3-5 |
| c | core | — | 3×15 |

Total : **4 + warmup + core = 6 exercices** ✔ · `adjustedSpec(…, 60)` = inchangé (l. 652).

**Sélection `intermediate` (random top-3, l. 782-783)** — priorité barbell active (`goal==='strength' && slot.compound`, l. 769-771) :
- slot 1 : `seed-squat-barbell` (8) · `seed-front-squat` (2) · `seed-lunges`/`seed-bulgarian-split-squat` (DB, 2)
- slot 2 : `seed-ohp-barbell` (3) · `seed-shoulder-press-dumbbell` (3) · `seed-arnold-press` (2)
- slot 3 : `seed-romanian-deadlift` (3) · `seed-good-morning` (1) · `dumbbell-rdl` (2)
- slot 4 : `seed-bench-barbell` (8) · `seed-bench-dumbbell` (3) · `seed-incline-bench-barbell` (4)

**Assertions**

| Assertion | Verdict | Ligne |
|---|---|---|
| `['legs','shoulders']` → `'lower_push'` | **PASS** | 425 |
| Split = `['lower_push','lower_push','lower_push']` | **PASS** | 543 |
| Noms `Lower — Squat & Press A/B/C` | **PASS** | 602 / 1039-1041 |
| `adjustedSlotCount(9,60,'strength')` = 4 | **PASS** | 638 |
| « Slot 0 quads · **Slot 1 chest (bench)** · **Slot 2 OHP** · Slot 3 ham/glutes » | **FAIL** — `reorderSlotsByFocus` (appliqué **avant** la coupe, l. 983-984) hisse l'OHP (ciblé par `shoulders`) au-dessus du bench : ordre réel **quads → OHP → ham/glutes → bench**. Les 4 mêmes mouvements, mais pas le même ordre | 691-701 / 983-985 |

**Warnings** : (1) UX-D spécialisation (`publicTypes={'lower'}`) ; (2) **UX-5 déséquilibre push/pull** — `lower_push` est dans la liste push (l. 1112) et dans aucune liste pull → warning émis, et ici il est **pleinement justifié**. Pas de warning « force + débutant » (niveau intermediate).

**Évaluation coach** — Squat + OHP + RDL + bench en 5×3-5 trois fois par semaine : c'est exactement le squelette d'un **Wendler 5/3/1 « Boring But Big » ou d'un Starting Strength étendu**, et l'ordre réel (squat → OHP → RDL → bench) est même **plus cohérent** que celui annoncé dans l'assertion (les deux pressings ne s'enchaînent pas). Timing : 4×5 = 20 séries à ~3 min de repos ≈ 65-70 min + warmup + core → légèrement au-dessus des 60 min annoncées, mais c'est le compromis assumé documenté l. 617-623. **Le vrai problème est l'absence totale de tirage** : 3 séances/sem., 9 slots de pressing et de squat, zéro rowing, zéro traction. Sur 12 semaines (`DURATION_WEEKS.intermediate`) c'est un facteur de déséquilibre scapulaire net — le RDL travaille les érecteurs mais pas les rhomboïdes/trapèzes moyens. Le warning UX-5 le dit correctement ; il devrait être **bloquant côté wizard**, pas seulement informatif. Volume force par groupe : 15 séries/sem. de squat et 15 d'OHP → élevé mais gérable en 5/3/1 si l'intensité est ondulée (le générateur ne module pas l'intensité entre A/B/C : **3 séances identiques à 5×3-5**, ce qu'aucun coach ne programmerait — c'est la limite structurelle du fallback l. 543). Variété : **répétition complète** (structure identique ×3, seule la rotation top-3 varie les exercices). Isolation : aucune (normal à 4 slots en force).

---

## P34 — Auto + arms seul, hypertrophy 2j 60 min DB beginner

**Étape 1** — `workoutTypeFromFocus(['arms'])`
`hasLower=false · hasPush=false · hasPull=false · **hasArms=true** · hasCore=false · **hasUpper=true** (l. 409, via `hasArms`)`
→ l. 412 non · l. 416 non (`hasUpper=true`) · l. 418 non (`hasPush=false`) · l. 420 non (`hasPull=false`) · **règle l. 422** `hasUpper && !hasLower` → **`'upper'`**

**Étape 2** — branche `upper` l. 511, **`case 2: return ['push','pull']` (l. 513)** → **`['push','pull']`**
(et **non** `['upper-push','upper-pull']`).
Canons `push` / `pull` distincts → aucun suffixe → **`Push — Poussée` / `Pull — Tirage`** ✔

**Étape 3** — `focused = {biceps, triceps, forearms}` (`FOCUS_TO_MUSCLES.arms`, l. 24).
**Aucun slot compound ne cible les bras** → les compounds restent en tête, inchangés ; seules les isolations bougent :
- `push` : isolations `[chest(NF), triceps(F), sh_lat(NF), sh_rear(NF)]` → **`[triceps, chest, sh_lat, sh_rear]`**
- `pull` : isolations `[back(NF), biceps(F), sh_rear(NF), forearms(F)]` → **`[biceps, forearms, back, sh_rear]`**
`adjustedSlotCount(6, 60, 'hypertrophy')` = **6** pour les deux séances.

**Séance 1 · Push — Poussée (6 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | chest / chest_upper / chest_lower | cmp | 4×8-12 |
| 2 | shoulders / shoulders_front | cmp | 4×8-12 |
| 3 | **triceps (remonté)** | iso | 3×10-15 |
| 4 | chest / chest_upper / chest_lower | iso | 3×10-15 |
| 5 | shoulders_lateral / shoulders | iso | 3×10-15 |
| 6 | shoulders_rear | iso | 3×10-15 |
| c | core | — | 3×15 |

**Séance 2 · Pull — Tirage (6 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | back_width / back | cmp | 4×8-12 |
| 2 | back_thickness / back | cmp | 4×8-12 |
| 3 | **biceps (remonté)** | iso | 3×10-15 |
| 4 | **forearms (remonté)** | iso | 3×10-15 |
| 5 | back_thickness / back_width / back | iso | 3×10-15 |
| 6 | shoulders_rear | iso | 3×10-15 |
| c | core | — | 3×15 |

**Remplissage DB** — deux slots tombent :
- slot 1 pull (`back_width/back` cmp) : **aucun composé DB** en back_width ni back (`seed-pullover` est isolation, `seed-row-dumbbell` est back_thickness) → **slot vide + warning** « Aucun exercice composé disponible pour "dos (largeur)" » (l. 1002-1004).
- slot 4 pull (`forearms` iso) : **aucun exercice avant-bras en dumbbell** au catalogue (`seed-wrist-curl` est barbell) → **slot vide, silencieux**.
→ séance Pull réelle : **4 exercices + warmup + core = 6**, alors que le focus est « bras ».

**Assertions**

| Assertion | Verdict | Ligne |
|---|---|---|
| `hasArms=true → hasUpper=true`, `hasPush=hasPull=hasLower=false` | **PASS** | 404-409 |
| Règle appliquée `hasUpper && !hasLower` → `'upper'` | **PASS** | 422 |
| Split 2j upper = **`['push','pull']`** (pas `['upper-push','upper-pull']`) | **PASS** | 513 |
| Noms `Push — Poussée` / `Pull — Tirage` | **PASS** | 1039-1041 |

**Warnings** : (1) UX-6 branche « bras seul » (l. 1143-1149) **`unshift`** → *« Focus bras : "arms" seul génère un programme haut du corps complet… »* ✔ ; (2) warning composé dos (largeur) ; pas d'UX-5 (séance pull présente), pas d'UX-D (2 canons).

**Évaluation coach** — La décision de code est **sportivement juste** : les bras sont des muscles assistants, ils progressent dans un contexte de pressing/tirage lourd, et le warning UX-6 l'explique clairement à l'utilisateur — bonne UX. Mais la traduction concrète est décevante : sur 12 slots de la semaine, **2 seulement ciblent les bras** (triceps en push, biceps en pull), le 3ᵉ (avant-bras) tombe faute d'exercice DB. Un « focus bras » qui donne 2 slots bras par semaine est **contre-intuitif** au-delà de l'explication. Le reorder ne peut rien faire de plus : aucun slot compound « bras » n'existe (dips, curl barre en compound ne sont pas au catalogue en DB). Piste : ajouter à `upper`/`push`/`pull` un 2ᵉ slot bras quand `focusMuscles` contient `arms`. Équilibre push/pull : correct (1 séance chacune). Équipement : DB pénalise fortement le dos (pas de traction ni de tirage vertical) — un simple `pullup_bar` débloquerait `seed-pullup` **et** `bw-chinup` (biceps, compound, pop 3), soit exactement ce que veut l'utilisateur. Variété : **structurelle**. Isolation : jambes absentes (normal), avant-bras manquant (**lacune**, aggravée par le focus).

---

## P35 — Auto + legs+core, hypertrophy 3j 60 min BW beginner

**Étape 1** — `workoutTypeFromFocus(['legs','core'])`
`hasLower=true · hasPush=false · hasPull=false · hasArms=false · hasCore=true · hasUpper=false`
→ **règle l. 412** `hasLower && !hasUpper` → **`'lower'`** — évaluée **avant** la règle core (l. 416), qui exige `!hasLower` et n'est donc jamais atteinte. **Jamais `null`.**

**Étape 2** — branche `focusType === 'lower'` **l. 503-506**, `daysPerWeek=3` :
`i=0 → 'lower-quad'`, `i=1 → 'lower-hip'`, `i=2 → 'lower-quad'` → **`['lower-quad','lower-hip','lower-quad']`**
`toPublicType = 'lower'` ×3 → **`Lower — Bas du corps A / B / C`**.

**Étape 3** — `focused = {quads, hamstrings, glutes, calves, core}`. Aucun slot ne contient `core`, mais les 6 slots de chaque type sont ciblés par les 4 muscles jambes → `aF=0` partout → **ordre canonique inchangé**.
`adjustedSlotCount(6, 60, 'hypertrophy')` = **6** pour les deux types.

**Séances A et C · lower-quad (6 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads / glutes | cmp | 4×8-12 |
| 2 | hamstrings / glutes | cmp | 4×8-12 |
| 3 | quads | iso | 3×10-15 |
| 4 | hamstrings | iso | 3×10-15 |
| 5 | glutes | iso | 3×10-15 |
| 6 | calves | iso | 3×10-15 |
| c | **core** (corePool, l. 1031-1036) | — | 3×15 |

**Séance B · lower-hip (6 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | glutes / hamstrings | cmp | 4×8-12 |
| 2 | quads / glutes | cmp | 4×8-12 |
| 3 | glutes | iso | 3×10-15 |
| 4 | hamstrings | iso | 3×10-15 |
| 5 | quads | iso | 3×10-15 |
| 6 | calves | iso | 3×10-15 |
| c | **core** | — | 3×15 |

**Remplissage BW pur** : comme en P28, **le slot `hamstrings` isolation est vide** dans les 3 séances (aucun exercice ischio bodyweight non-warmup au catalogue) → 5 exercices utiles + warmup + core = **7** par séance.
`autoProgress = false`, `progressStepKg = 0`.

**Assertions**

| Assertion | Verdict | Ligne |
|---|---|---|
| `hasLower=true`, `hasCore=true`, `hasUpper=false` | **PASS** | 404-409 |
| Règle appliquée en premier : `hasLower && !hasUpper` → `'lower'` | **PASS** | 412 |
| **JAMAIS null** (legs domine core) | **PASS** — l. 416 exige `!hasLower` | 416 |
| Split 3j lower beginner = `['lower-quad','lower-hip','lower-quad']` | **PASS** | 503-506 |
| Core en queue via corePool | **PASS** — 1 exercice core par séance, avec rotation `workouts.length % corePool.length` | 1031-1036 |

**Warnings** : UX-D spécialisation (`publicTypes={'lower'}`, l. 1085) uniquement.
UX-6 « Focus gainage » **non déclenché** (l. 1135 exige `!hasFocusLower`) — **correct** : ici le core est bien pris en compte, un exercice par séance.

**Évaluation coach** — La hiérarchie de règles est la bonne : « jambes + gainage » est une demande cohérente et le résultat (3 séances bas du corps + 1 gainage en fin de chaque séance) y répond exactement. Réserve principale : **le core reste limité à 1 exercice de 3×15 par séance** — un utilisateur qui a explicitement coché « core » attend davantage (l'anti-extension, l'anti-rotation, le carry ne sont pas couverts). Le corePool tourne bien entre les séances (`seed-plank`, `seed-crunch`, `seed-leg-raise`, `seed-side-plank`…), ce qui limite la monotonie. Comme en P28, l'**ischio est totalement absent** en BW (slot iso vide, slot cmp rabattu sur le hip thrust BW) : déséquilibre quadriceps/ischios sur 8 semaines, à corriger en priorité. Zéro haut du corps sur 3 j/sem. — le warning de spécialisation le signale correctement. Variété : **structurelle** (A/C quad-dominant, B hip-dominant), mais A et C identiques : rotation d'exercices seulement, sur un pool BW très étroit (5-6 candidats pour tous les slots jambes) → répétitions inévitables dès la séance C.

---

## P36 — Auto + chest+back+legs, hypertrophy 2j 60 min FULL beginner

**Étape 1** — `workoutTypeFromFocus(['chest','back','legs'])`
`hasLower=true · hasPush=true (chest) · hasPull=true (back) · hasArms=false · hasCore=false · hasUpper=true`

| Règle | Test | Résultat |
|---|---|---|
| l. 412 | `hasLower && !hasUpper` | ✗ (`hasUpper=true`) |
| l. 416 | `hasCore && …` | ✗ (`hasCore=false`) |
| l. 418 | `hasPush && !hasPull && !hasLower` | ✗ |
| l. 420 | `hasPull && !hasPush && !hasLower` | ✗ |
| l. 422 | `hasUpper && !hasLower` | ✗ |
| l. 425 | `hasLower && hasPush && !hasPull` | ✗ (`hasPull=true`) |
| l. 428 | `hasLower && hasPull && !hasPush` | ✗ (`hasPush=true`) |
| **l. 430** | défaut | → **`null`** |

**Ambiguïté totale → `null`** ✔

**Étape 2** — `focusType` falsy → split par défaut, **case 2 l. 548-549** → **`['fullbody-quad','fullbody-hip']`**
→ **`Full Body A` / `Full Body B`**.

**Étape 3** — `focused = {chest, chest_upper, chest_lower, back, back_width, back_thickness, quads, hamstrings, glutes, calves}` (10 muscles).
`adjustedSlotCount(9, 60, 'hypertrophy')` = **9** pour les deux séances.
`reorderSlotsByFocus` : les 3 premiers composés sont ciblés, l'OHP ne l'est pas → compounds inchangés. Les isolations bougent :
- `fullbody-quad` : `[ham(F), sh_rear(NF), biceps(NF), calves(F), triceps(NF)]` → **`[ham, calves, sh_rear, biceps, triceps]`**
- `fullbody-hip` : `[quads(F), sh_lat/rear(NF), biceps(NF), calves(F), triceps(NF)]` → **`[quads, calves, sh_lat/rear, biceps, triceps]`**

**Séance A · fullbody-quad (9 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | quads / glutes | cmp | 4×8-12 |
| 2 | chest / chest_upper | cmp | 4×8-12 |
| 3 | back_width / back_thickness / back | cmp | 4×8-12 |
| 4 | shoulders / shoulders_front | cmp | 4×8-12 |
| 5 | hamstrings | iso | 3×10-15 |
| 6 | calves (**remonté**) | iso | 3×10-15 |
| 7 | shoulders_rear (**rétrogradé**) | iso | 3×10-15 |
| 8 | biceps | iso | 3×10-15 |
| 9 | triceps | iso | 3×10-15 |
| c | core | — | 3×15 |

**Séance B · fullbody-hip (9 slots)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | hamstrings / glutes | cmp | 4×8-12 |
| 2 | chest / chest_upper | cmp | 4×8-12 |
| 3 | back_width / back | cmp | 4×8-12 |
| 4 | shoulders / shoulders_front | cmp | 4×8-12 |
| 5 | quads | iso | 3×10-15 |
| 6 | calves (**remonté**) | iso | 3×10-15 |
| 7 | shoulders_lateral / shoulders_rear | iso | 3×10-15 |
| 8 | biceps | iso | 3×10-15 |
| 9 | triceps | iso | 3×10-15 |
| c | core | — | 3×15 |

Remplissage FULL : les 18 slots sont pourvus (squat BB, bench BB, pullup/lat pulldown, OHP BB, leg curl machine, calf raise, face pull, curl, triceps, RDL…).

**Assertions**

| Assertion | Verdict | Ligne |
|---|---|---|
| `hasLower`, `hasPush`, `hasPull` tous vrais | **PASS** | 404-409 |
| `lower_push` échoue (`!hasPull` faux) · `lower_pull` échoue (`!hasPush` faux) | **PASS** | 425 / 428 |
| Ambiguïté totale → **null** | **PASS** | 430 |
| Split par défaut 2j → `['fullbody-quad','fullbody-hip']` | **PASS** | 548-549 |

⚠️ **Effet secondaire à noter** : le face pull (`shoulders_rear`), explicitement commenté « prioritaire » (l. 369), **recule de la position 6 à la position 7** derrière les mollets, parce que `calves` fait partie du focus `legs` et pas `shoulders_rear`. Sans conséquence ici (9 slots retenus), mais à 45 min (`adjustedSlotCount(9,45,…) = 6`) le face pull **serait éjecté** au profit des mollets — inversion de priorité coach.

**Warnings** : UX-6 branche 3 (l. 1151-1156) **`unshift`** → *« Sélection complète : votre focus couvre poitrine, dos et jambes — le programme généré est un full body… »* ✔ Message exact et pédagogique. Pas d'UX-D (`'fullbody'` hors liste l. 1085), pas d'UX-5 (`fullbody-*` compte comme tirage).

**Évaluation coach** — **Meilleure dégénérescence du groupe.** L'utilisateur a coché trois groupes contradictoires ; le système ne bricole pas un split bancal, il retombe sur un full body équilibré **et** utilise le focus pour hisser les muscles demandés en tête des isolations. Équilibre : 1 pressing + 1 tirage + 1 OHP + 1 mouvement jambes par séance, quad-dominant en A, hip-dominant en B → couverture complète, fréquence 2× par groupe. Cohérence objectif : 4×8-12 / 3×10-15 conformes à l'hypertrophie. **Durée : le point noir** — 9 slots + warmup + core = 11 exercices ≈ 33 séries de travail en « 60 min » ⇒ ~110-120 min réels. C'est le défaut systémique de `adjustedSlotCount` à 60 min hors force (`return base`, l. 639) : les templates 9 slots ne sont jamais coupés. Variété : **structurelle** (quad vs hip), pool FULL largement suffisant. Couverture isolation : complète (ischios ou quads, mollets, arrière/latéral d'épaule, biceps, triceps) — **aucune lacune**.

---

## P37 — Auto + back+legs, fat_loss 3j 45 min FULL intermediate

**Étape 1** — `workoutTypeFromFocus(['back','legs'])`
`hasLower=true (legs) · hasPush=false · hasPull=true (back) · hasArms=false · hasCore=false · hasUpper=true (via hasPull)`
→ l. 412 non (`hasUpper`) · l. 416 non · l. 418 non · l. 420 non (`hasLower`) · l. 422 non (`hasLower`) · l. 425 non (`hasPush=false`) · **règle l. 428** → **`'lower_pull'`**

**Étape 2** — fallback **l. 543** → **`['lower_pull','lower_pull','lower_pull']`**
`toPublicType='lower'` ×3 → **`Lower — Chaîne postérieure A / B / C`**.

**Étape 3** — `focused = {back, back_width, back_thickness, quads, hamstrings, glutes, calves}`.
8 slots sur 9 ciblés (seul le curl biceps pos 9 ne l'est pas, déjà dernier) → **ordre canonique inchangé**.

**Étape 4** — `adjustedSlotCount(9, 45, 'fat_loss')` : `duration===45`, goal ≠ strength → `max(3, floor(9×0.75)) = max(3, 6)` = **6 slots** (l. 636).
Éjectés par la coupe : pos 7 `hamstrings` iso, pos 8 `calves` iso, pos 9 `biceps` iso.
Total : **6 + warmup + core = 8 exercices** ✔

**Étape 5** — `adjustedSpec(spec, 45)` (l. 651-655), `factor = 0.75` :
compound fat_loss `3×12-15` → `sets = max(2, floor(3×0.75)) = max(2, 2)` = **2×12-15** (repos 60 s)
isolation fat_loss `3×12-15` → **2×12-15** (repos 60 s)
Warmup et core **ne passent pas** par `adjustedSpec` (l. 1018 / 1034) → restent `2×10` et `3×15`.

**Séances A / B / C · lower_pull (6 slots — identiques)**

| # | Slot muscles | Cat | Séries×Reps |
|---|---|---|---|
| w | warmup | — | 2×10 |
| 1 | hamstrings / glutes | cmp | **2×12-15** (60 s) |
| 2 | back_width / back | cmp | **2×12-15** |
| 3 | back_thickness / back | cmp | **2×12-15** |
| 4 | quads / glutes | cmp | **2×12-15** |
| 5 | glutes / hamstrings | iso | **2×12-15** |
| 6 | back_thickness / back_width / back | iso | **2×12-15** |
| c | core | — | 3×15 |

**Sélection `intermediate` (random top-3, l. 782-783) — slot 1 (`hamstrings/glutes` cmp, FULL)** :
candidats compound triés (focus → tous ciblés ; `slot.muscles[0]='hamstrings'` prioritaire ; goal ≠ strength donc pas de priorité barbell ; puis popularité) :
1. `seed-romanian-deadlift` (barbell, hamstrings, pop 3)
2. `dumbbell-rdl` (dumbbell, hamstrings, pop 2)
3. `bw-nordic-curl` (pullup_bar, hamstrings, pop 2)
(puis `seed-good-morning` pop 1, puis les glutes-compound `seed-hip-thrust` pop 4 / `seed-hip-thrust-machine` pop 3, relégués par le critère `slotPrimary`).
→ tirage aléatoire parmi ces 3 à chaque séance, avec bonus « non utilisé globalement » (l. 773-775) qui **force** de facto trois exercices différents en A/B/C.

**Assertions**

| Assertion | Verdict | Ligne |
|---|---|---|
| `['back','legs']` → `'lower_pull'` | **PASS** | 428 |
| Split = `['lower_pull','lower_pull','lower_pull']` | **PASS** | 543 |
| `adjustedSlotCount(9,45,'fat_loss')` = 6 | **PASS** | 636 |
| Total 6 + warmup + core = 8 exercices | **PASS** | 1021-1036 |
| top-3 pour slot 0 (hamstrings/glutes cmp) cité | **PASS** (voir ci-dessus) | 757-783 |
| *(non listé dans le prompt)* séries = 2 et non 3 | **À noter** — `adjustedSpec` à 45 min ramène **tous** les slots à 2 séries | 651-655 |

**Warnings** : UX-D spécialisation (`publicTypes={'lower'}`). Pas d'UX-5 (`lower_pull` ∈ liste tirage). Pas d'UX-6.

**Évaluation coach** — Le choix de split est pertinent : chaîne postérieure + dos, deadlift-first, 4 composés puis 2 isolations, c'est dense et métaboliquement coûteux — exactement ce qu'on veut en fat_loss. Mais **le volume s'effondre** : 6 exercices × 2 séries = **12 séries de travail par séance**, ~24 min de travail effectif repos compris sur un créneau de 45 min. Pour un intermédiaire en déficit calorique, 12 séries/séance est **sous le seuil de maintien de la masse maigre** (~10 séries/groupe/semaine recommandées ; ici les ischios en reçoivent 4, le dos 6, les quads 2). La réduction cumulée slots (9→6) **et** séries (3→2) est trop agressive : une seule des deux suffirait. Ratio cardio/force : **aucun cardio** dans le générateur alors que `cardio_machine` fait partie de FULL et que le catalogue contient tapis/vélo/rameur/elliptique — pour un objectif fat_loss c'est une lacune de conception, pas seulement de profil. Équilibre : zéro poussée sur la semaine (pas de pec, épaule ni triceps) — sans risque postural (le tirage domine) mais le programme reste **incomplet** sur 12 semaines ; le warning de spécialisation le signale. Mollets et ischios en isolation, ainsi que le curl biceps, sont coupés par la durée. Variété : **répétition complète** au niveau structurel (3 séances identiques), compensée par la rotation top-3 + pénalité `usedGlobally` qui garantit 3 exercices distincts par slot avec l'équipement FULL — c'est le seul profil du groupe où le pool est assez large pour que la rotation fonctionne vraiment.

---

# Synthèse GROUPE B (P26 → P37)

## Assertions du prompt en échec

| Profil | Assertion | Réel |
|---|---|---|
| **P27** | Noms « Pull — Tirage A/B/C » | `Pull — Tirage A` / **`Upper — Haut du corps`** (sans suffixe) / `Pull — Tirage B` — le suffixe se calcule sur le type **public**, et `upper-pull` → `'upper'` (l. 119, 1039) |
| **P28** | « slot hamstrings **compound** vide en BW pur » | Le slot cmp `{hamstrings, glutes}` est rempli par `seed-hip-thrust-bw` (glutes). Le slot réellement vide est l'**isolation** `hamstrings` — et il ne produit **aucun warning** (l. 996 ne couvre que les compounds) |
| **P33** | « Slot 1 = chest (bench) · Slot 2 = OHP » | `reorderSlotsByFocus` s'applique **avant** la coupe (l. 983-985) et hisse l'OHP (ciblé) au-dessus du bench : **quads → OHP → ham/glutes → bench** |

Toutes les autres assertions critiques du groupe passent, y compris les quatre cas spéciaux :
**P29** core seul → `null` (l. 416, jamais `'lower'`) · **P35** legs+core → `'lower'` (l. 412 évaluée avant 416) ·
**P36** chest+back+legs → `null` (l. 430) · **P26** push 2j → `['push','upper-push']` (l. 525).

## Défauts de code identifiés

1. **Warning de spécialisation aveugle à `'upper'`** (l. 1085) — P31 génère 3 séances haut du corps sans une seule séance de jambes sur 8 semaines, **sans aucun avertissement**. Ajouter `'upper'` à la liste `push | pull | lower`.
2. **UX-5 asymétrique** (l. 1103-1122) — détecte l'absence de tirage (P26, P30, P33) mais **jamais** l'absence de poussée (P27, P32, P37, où pecs/épaules/triceps sont à zéro). Et il est **faux-positif** en P26/P30, où `upper-push` contient bien un composé dos.
3. **Doublon de warning** (l. 998) — la clé de déduplication `` `${workoutType}:${muscle}` `` inclut le type de séance : en P29 le message « Aucun exercice composé disponible pour "dos (largeur)" » est poussé **deux fois** (`fullbody-quad` + `fullbody-hip`). Dédupliquer sur le seul muscle, ou sur le message final.
4. **Slots d'isolation vides et silencieux** — P28/P35 (ischios en BW), P34 (avant-bras en DB) : le slot disparaît sans trace, l'utilisateur ne sait pas qu'un groupe n'est jamais entraîné. Étendre le warning aux slots isolation quand **aucun** exercice du groupe n'existe dans l'équipement choisi.
5. **`reorderSlotsByFocus` peut rétrograder un slot « prioritaire »** — le face pull (`shoulders_rear`, commenté « prioritaire » l. 369 et « obligatoire » l. 206) recule derrière les mollets en P36 et derrière l'isolation dos en P31. À 45 min il serait purement éjecté. Prévoir des slots épinglés (non réordonnables).
6. **`lower_pull` / `lower_push` n'alternent jamais** (fallback l. 543) — P32, P33, P37 produisent 2 à 3 séances **structurellement identiques**, alors que `lower` sait alterner quad/hip (l. 503-506). Créer des variantes A/B pour ces deux types.
7. **Double réduction à 45 min** — P37 : slots 9→6 (`adjustedSlotCount`) **et** séries 3→2 (`adjustedSpec`), soit 12 séries par séance en fat_loss. Cumul trop agressif ; n'appliquer qu'une des deux réductions.
8. **Aucun cardio en fat_loss** — `cardio_machine` fait partie du preset FULL et le catalogue contient 4 exercices cardio + burpees / jump rope / high knees, mais aucun slot ne les cible (P37).
9. **Templates 9 slots jamais coupés à 60 min** (l. 639, `return base`) — P29, P32, P36 : 11 exercices ≈ 33 séries dans un créneau annoncé de 60 min, soit ~110-120 min réels. Le barème « autres objectifs » à 60 min devrait plafonner comme celui de la force.
10. **Focus « arms » très peu servi** (P34) — 2 slots bras sur 12 dans la semaine, aucun slot compound bras n'existant, et l'avant-bras tombe faute d'exercice DB. Envisager un slot bras supplémentaire lorsque `focusMuscles` contient `arms`.

## Tableau récapitulatif

| # | focusMuscles | focusType (ligne) | Split | Slots/séance | Specs |
|---|---|---|---|---|---|
| P26 | chest | `push` (418) | push · upper-push | 6 · 8 | 4×8-12 / 3×10-15 |
| P27 | back | `pull` (420) | pull · upper-pull · pull | 6 · 8 · 6 | 4×8-12 / 3×10-15 |
| P28 | legs | `lower` (412) | lower-quad/hip ×2 | 6 (5 remplis) | 4×8-12 / 3×10-15 |
| P29 | core | **null** (416) | fullbody-quad · fullbody-hip | 9 (4-5 remplis) | 4×8-12 / 3×10-15 |
| P30 | shoulders | `push` (418) | push · upper-push | 6 · 8 | 4×8-12 / 3×10-15 |
| P31 | chest+back | `upper` (422) | upper-push · upper-pull · upper-push | 8 ×3 | 4×8-12 / 3×10-15 |
| P32 | legs+back | `lower_pull` (428) | lower_pull ×2 | 9 | 4×8-12 / 3×10-15 |
| P33 | legs+shoulders | `lower_push` (425) | lower_push ×3 | 4 | 5×3-5 (force) |
| P34 | arms | `upper` (422) | **push · pull** (513) | 6 · 6 (4 remplis en pull) | 4×8-12 / 3×10-15 |
| P35 | legs+core | `lower` (412) | lower-quad · lower-hip · lower-quad | 6 (5 remplis) | 4×8-12 / 3×10-15 |
| P36 | chest+back+legs | **null** (430) | fullbody-quad · fullbody-hip | 9 | 4×8-12 / 3×10-15 |
| P37 | back+legs | `lower_pull` (428) | lower_pull ×3 | 6 | **2×12-15** (45 min) |



---


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



---


# Audit v4 — GROUPE D (P52 → P59)
## Filtres d'incompatibilité du wizard — `incompatibleReason(splitPreference)`

**Fichiers audités :**
- `src/components/screens/ProgramGeneratorScreen.tsx` (lu en entier — 1332 lignes)
- `src/utils/programGenerator.ts` (lu en entier — 1171 lignes)

**Rôle :** coach sportif certifié — simulation d'exécution + évaluation sportive.

---

## 0. Rappel du code sous test (référence de lignes)

### 0.1 — `incompatibleReason` — `ProgramGeneratorScreen.tsx` L626–648

```
L626  function incompatibleReason(value: SplitPreference): string | null {
L627    switch (value) {
L628      case 'brosplit':
L629        if (days !== null && days < 5) return `Nécessite 5 séances/sem. — tu en as ${days}`
L630        if (level === 'beginner')      return 'Fréquence trop faible par muscle pour un débutant'
L631        if (goal === 'strength')       return 'Force requiert 2-3 stimuli/sem. par muscle — Brosplit n\'en donne qu\'un'
L632        if (goal === 'endurance')      return 'Endurance : fréquence élevée par muscle requise — Brosplit trop peu fréquent'
L633        return null
L634      case 'arnold':
L635        if (days !== null && days < 3) return `Nécessite 3 séances/sem. minimum — tu en as ${days}`
L636        if (level === 'beginner')      return 'Volume et complexité élevés — déconseillé en débutant'
L637        if (goal === 'strength')       return 'Split bodybuilding — Force préfère Full Body ou Upper/Lower (fréquence 2-3×/sem.)'
L638        if (goal === 'endurance')      return 'Endurance : fréquence élevée par muscle requise — préfère Full Body ou Upper/Lower'
L639        return null
L640      case 'ppl':
L641        if (days !== null && days < 3) return `Nécessite 3 séances/sem. minimum — tu en as ${days}`
L642        if (goal === 'strength')       return 'Split orienté hypertrophie — Force préfère Full Body ou Upper/Lower (2-3 stimuli/sem.)'
L643        if (goal === 'endurance')      return 'Endurance : fréquence élevée par muscle requise — préfère Full Body ou Upper/Lower'
L644        return null
L645      default:
L646        return null
L647    }
L648  }
```

**Propriétés structurelles vérifiées :**

| Point | Constat | Ligne |
|---|---|---|
| Closure | `days`, `level`, `goal` sont des `useState` du composant (L198–204) — la fonction est redéfinie à chaque rendu de `renderSplitPicker`, donc jamais de closure périmée | L198, L199, L204 |
| Ordre des tests | **days → level → goal** pour brosplit et arnold ; **days → goal** pour PPL (pas de test `level` sur PPL) | L629-632 / L635-638 / L641-643 |
| Garde null | `days !== null &&` protège l'interpolation ; `level`/`goal` n'ont pas de garde mais `null !== 'beginner'` et `null !== 'strength'` → sûr | L629, L635, L641 |
| Splits jamais bloqués | `auto`, `fullbody`, `upper-lower` tombent dans `default` → toujours `null` | L645-646 |
| `glutes-focus` | **N'est jamais passé à `incompatibleReason`** — le bouton est rendu hors de la boucle `OPTIONS.map` avec `disabled: false` et `reason: null` codés en dur | L673-681 (L679-680) |
| Atteignabilité des états | Ordre wizard : Objectif(0) → Niveau(1) → Fréquence(2) → Durée(3) → **Structure(4)** → … ⇒ `goal`, `level`, `days` sont **toujours non-null** à l'étape 4 | L282-324 |

### 0.2 — Consommation du résultat — L656–661

```
L657  {OPTIONS.map(({ value, icon, label, sub }) => {
L658    const active = splitPreference === value
L659    const reason = incompatibleReason(value)      ← appel
L660    const disabled = reason !== null
L661    return renderSplitButton({ value, icon, label, sub, active, disabled, reason })
```

### 0.3 — Rendu UI d'un split bloqué — `renderSplitButton` L687–741

| Effet visuel / comportement | Implémentation | Ligne |
|---|---|---|
| Clic neutralisé | `onClick={() => { if (disabled) return; … }}` | L696-697 |
| Opacité 0.45 | `opacity: disabled ? 0.45 : 1` | L718 |
| Curseur interdit | `cursor: disabled ? 'not-allowed' : 'pointer'` | L715 |
| Message d'avertissement | bloc `{reason && …}` en `var(--warn, #f59e0b)`, préfixe `⚠ `, `fontWeight: 600` | L730-734 |
| Coche ✓ masquée | `{active && !disabled && …}` | L736 |
| Transition | `transition: 'opacity 0.15s'` | L719 |

⚠️ **Défaut transverse (voir §3, BUG-D1) :** l'attribut HTML `disabled` **n'est pas posé** sur le `<button>`. Le blocage est purement visuel + garde JS. Le bouton reste focusable au clavier et annoncé « bouton activé » par un lecteur d'écran.

---

# P52 — Brosplit bloqué par fréquence insuffisante

**Contexte wizard :** `{ goal:'hypertrophy', level:'intermediate', days:4 }` · Split testé : `'brosplit'`

### 1. Simulation `incompatibleReason('brosplit')`

| Étape | Ligne | Test | Évaluation | Sortie |
|---|---|---|---|---|
| entrée | L628 | `case 'brosplit'` | match | — |
| 1 | **L629** | `days !== null && days < 5` → `4 !== null && 4 < 5` | **true** | **`return`** |

Interpolation du template literal : `` `Nécessite 5 séances/sem. — tu en as ${days}` `` avec `days = 4`.

**Valeur retournée :** `"Nécessite 5 séances/sem. — tu en as 4"`

**Assertion attendue :** `"Nécessite 5 séances/sem. — tu en as 4"` → ✅ **PASS** (chaîne exacte, ligne 629)

Les tests L630 (level), L631 (strength), L632 (endurance) ne sont **jamais atteints** — court-circuit au premier `return`.

### 2. Comportement UI attendu

`disabled = reason !== null` → **`true`** (L660).

| Attribut | Valeur | PASS/FAIL |
|---|---|---|
| `opacity` | `0.45` (L718) | ✅ PASS |
| `cursor` | `not-allowed` (L715) | ✅ PASS |
| Clic | no-op via `if (disabled) return` (L697) | ✅ PASS |
| Texte affiché sous le sous-titre | `⚠ Nécessite 5 séances/sem. — tu en as 4` en orange (L730-734) | ✅ PASS |
| Attribut HTML `disabled` | **absent** | ❌ FAIL (BUG-D1) |
| `aria-disabled` | **absent** | ❌ FAIL (BUG-D1) |

Bouton **Bro Split grisé, non fonctionnel**. Les 5 autres options (`auto`, `fullbody`, `upper-lower`, `ppl`, `arnold`) restent actives : `ppl` passe L641 (4 ≥ 3) puis L642/L643 (goal = hypertrophy) → `null` ; `arnold` passe L635 (4 ≥ 3), L636 (intermediate), L637/L638 → `null`.

### 3. Analyse technique — si le filtre était ignoré

Appel `selectSplit({ goal:'hypertrophy', daysPerWeek:4, level:'intermediate', splitPreference:'brosplit' })` :

- `programGenerator.ts` L468 : `if (pref === 'brosplit')`
- L470 `switch (daysPerWeek)` → **L473** `case 4: return ['chest-tri', 'back-bi', 'shoulders-arms', 'legs']`

**Split produit :** `['chest-tri','back-bi','shoulders-arms','legs']` → ✅ conforme à l'assertion du prompt.

Suite de la génération (hypothèse `sessionDuration = 60`, non fourni par le contexte wizard) :

| # | Type interne | Base | `adjustedSlotCount(base,60,'hypertrophy')` | Type public (L117-127) | Nom final (L590-611 + L1040) |
|---|---|---|---|---|---|
| 1 | `chest-tri` | 7 | **7** | `push` | Chest & Triceps — Pectoraux & Triceps |
| 2 | `back-bi` | 8 | **8** | `pull` | Back & Biceps — Dos & Biceps |
| 3 | `shoulders-arms` | 8 | **8** | `upper` | Shoulders & Arms — Épaules & Bras |
| 4 | `legs` | 6 | **6** | `legs` | Legs — Jambes |

Aucun type canonique n'apparaît 2× → `totalOfType === 1` → **aucun suffixe A/B** (L1039-1040). Total : 7+8+8+6 = 29 slots + 4 warmups + 4 core = **37 exercices/semaine**.

Warnings générés : `hasPushSession` = true (`chest-tri`, `shoulders-arms`, L1113) et `hasPullSession` = true (`back-bi`, L1106) → pas de warning UX-5. `publicTypes.size = 4` → pas de warning UX-D. `level ≠ beginner` → pas de UX-H. **Aucun warning.** Le générateur accepte ce programme sans réserve : **le filtre est purement wizard**, confirmé.

### 4. Évaluation coach

**Le générateur produit ici un split parfaitement valide — et c'est le problème du filtre.**

Couverture du brosplit 4j : pectoraux+triceps (J1), dos+biceps (J2), épaules+bras (J3), jambes complètes incl. mollets (J4). **Tous les groupes sont couverts exactement 1× ; les bras reçoivent 2 stimuli/semaine** (chest-tri → triceps, back-bi → biceps, puis shoulders-arms → les deux). Deltoïde postérieur présent 3× (chest-tri pos 7, back-bi pos 7, shoulders-arms pos 3) — excellent pour la santé d'épaule. Avant-bras couverts (back-bi pos 8, shoulders-arms pos 8).

**Verdict coach : le brosplit 4j est structurellement plus « propre » que le brosplit 5j autorisé par le wizard.** Le 5j (L474) ajoute une séance `upper` qui redouble pecs/dos/épaules/bras — ce n'est plus « un groupe par séance ». Le seuil `days < 5` est donc **mal calibré** : il interdit la version la plus fidèle au concept et n'autorise que la version hybride.

Cela dit, le blocage reste **défendable sur le fond hypertrophique** : 1×/semaine par groupe est sous-optimal (méta-analyses Schoenfeld — 2×/sem. supérieur à volume égal). Mais alors le motif affiché est faux : ce n'est pas « il te faut 5 séances », c'est « cette structure a une fréquence trop faible quel que soit le nombre de jours ».

**Recommandation :** remplacer le blocage dur par un avertissement non bloquant à 4 jours, ou reformuler le motif. Le message actuel pousse l'utilisateur à **augmenter sa fréquence à 5 séances pour débloquer une option moins bonne** — incitation contre-productive.

---

# P53 — Brosplit bloqué par niveau débutant (5j)

**Contexte wizard :** `{ goal:'hypertrophy', level:'beginner', days:5 }` · Split testé : `'brosplit'`

### 1. Simulation `incompatibleReason('brosplit')`

| Étape | Ligne | Test | Évaluation | Sortie |
|---|---|---|---|---|
| entrée | L628 | `case 'brosplit'` | match | — |
| 1 | **L629** | `5 !== null && 5 < 5` | **false** | poursuite |
| 2 | **L630** | `level === 'beginner'` | **true** | **`return`** |

**Valeur retournée :** `"Fréquence trop faible par muscle pour un débutant"`

**Assertion attendue :** identique → ✅ **PASS** (ligne 630)

**Ordre des vérifications — assertion critique du prompt :** le test `days` (L629) est bien évalué **avant** le test `level` (L630). Preuve par contre-exemple : avec `{ level:'beginner', days:3 }` le message retourné serait `"Nécessite 5 séances/sem. — tu en as 3"` et **non** le message débutant. ✅ **PASS** — l'ordre days→level est respecté.

Conséquence UX de cet ordre : un débutant à 3 jours reçoit un motif « fréquence » trompeur, qui suggère qu'en passant à 5 séances le split se débloquerait — alors qu'il resterait bloqué par L630. **Le motif affiché n'est pas le motif le plus structurant.** (Voir BUG-D2.)

### 2. Comportement UI attendu

`disabled = true` → bouton Bro Split grisé (opacity 0.45, cursor not-allowed), message `⚠ Fréquence trop faible par muscle pour un débutant`. ✅ PASS (mêmes réserves BUG-D1).

Autres options à ce contexte : `arnold` → L635 (5 ≥ 3) puis **L636** `level === 'beginner'` → bloqué aussi (`"Volume et complexité élevés — déconseillé en débutant"`). `ppl` → L641 (5 ≥ 3), L642/L643 (hypertrophy) → **actif**. Donc à `beginner/5j/hypertrophy`, seuls `auto`, `fullbody`, `upper-lower`, `ppl`, `glutes-focus` sont cliquables.

### 3. Analyse technique — si le filtre était ignoré

`selectSplit` → L468 `pref === 'brosplit'` → **L474** `case 5: return ['chest-tri','back-bi','legs','shoulders-arms','upper']`

| # | Type interne | Base | slots (60 min, hypertrophy) | Type public | Nom |
|---|---|---|---|---|---|
| 1 | `chest-tri` | 7 | 7 | `push` | Chest & Triceps — Pectoraux & Triceps |
| 2 | `back-bi` | 8 | 8 | `pull` | Back & Biceps — Dos & Biceps |
| 3 | `legs` | 6 | 6 | `legs` | Legs — Jambes |
| 4 | `shoulders-arms` | 8 | 8 | `upper` | Shoulders & Arms — Épaules & Bras |
| 5 | `upper` | 8 | 8 | `upper` | Upper — Haut du corps |

⚠️ **Effet de nommage :** `shoulders-arms` et `upper` se projettent tous deux sur `'upper'` (L122 et L126) → `totalOfType = 2` → **suffixes ajoutés** (L1039-1040) : séance 4 = « Shoulders & Arms — Épaules & Bras **A** », séance 5 = « Upper — Haut du corps **B** ». Nommage incohérent : deux libellés différents partageant une numérotation A/B.

`level = 'beginner'` → `pickExercise` retourne `candidates[0]` (L781), déterministe.

Total : 37 slots + 5 warmups + 5 core = **47 exercices/semaine**.

Warnings du générateur : **UX-H déclenché** (L1074-1079, `level === 'beginner' && daysPerWeek >= 5`) → *« Volume élevé pour débutant : 5 séances/semaine génère un volume proche d'un programme intermédiaire… »*. Double protection cohérente : le wizard bloque en amont, le générateur avertirait en aval.

### 4. Évaluation coach

**Filtre pleinement justifié — c'est le meilleur des 8 blocages du groupe D.**

Trois arguments convergents :
1. **Apprentissage moteur.** Un débutant progresse d'abord par adaptation neurale. Le squat, le développé et le tirage doivent être répétés **2-3×/semaine** pour ancrer le pattern. Le brosplit 5j donne 1 séance jambes/semaine → 1 seule exposition au squat. C'est le pire format possible pour un novice.
2. **Volume ingérable.** 47 exercices/semaine, dont une séance `back-bi` de 8 slots et deux séances upper de 8 slots. Un débutant n'a ni la capacité de récupération ni la tolérance au volume pour cela (courbatures prolongées, abandon).
3. **Rendement décroissant.** Le brosplit tire sa logique du volume intra-séance maximal — pertinent chez un pratiquant avancé proche de son plafond. Chez un débutant, 3 séries suffisent à saturer le stimulus ; les séries 4-8 sont du volume perdu.

**Le message affiché est cependant partiellement faux.** À 5 jours, `selectSplit` L474 produit `chest-tri + upper` (pecs 2×), `back-bi + upper` (dos 2×), `shoulders-arms + upper` (épaules et bras 2×). La fréquence réelle est de **2×/semaine pour tout le haut du corps** — seules les jambes restent à 1×. Le motif *« fréquence trop faible par muscle »* décrit donc une propriété que le split 5j n'a pas. Les vrais motifs sont le volume et la complexité (exactement le message utilisé pour `arnold` en L636).

**Recommandation :** aligner le message brosplit/beginner sur celui d'arnold — *« Volume élevé et fréquence jambes trop faible — déconseillé en débutant »*.

---

# P54 — Brosplit bloqué par objectif Force

**Contexte wizard :** `{ goal:'strength', level:'intermediate', days:5 }` · Split testé : `'brosplit'`

### 1. Simulation `incompatibleReason('brosplit')`

| Étape | Ligne | Test | Évaluation | Sortie |
|---|---|---|---|---|
| entrée | L628 | `case 'brosplit'` | match | — |
| 1 | **L629** | `5 !== null && 5 < 5` | **false** | poursuite |
| 2 | **L630** | `'intermediate' === 'beginner'` | **false** | poursuite |
| 3 | **L631** | `goal === 'strength'` | **true** | **`return`** |

**Valeur retournée :** `"Force requiert 2-3 stimuli/sem. par muscle — Brosplit n'en donne qu'un"`

(dans le source : `'Force requiert 2-3 stimuli/sem. par muscle — Brosplit n\'en donne qu\'un'` — apostrophe échappée, L631)

**Assertion attendue :** identique → ✅ **PASS** (ligne 631)

### 2. Comportement UI attendu

Bouton Bro Split grisé, `⚠ Force requiert 2-3 stimuli/sem. par muscle — Brosplit n'en donne qu'un`. ✅ PASS.

Contexte croisé : `arnold` est bloqué en parallèle par **L637** (`"Split bodybuilding — Force préfère Full Body ou Upper/Lower (fréquence 2-3×/sem.)"`), `ppl` par **L642**. À `strength/intermediate/5j`, **trois des six** options standard sont grisées ; il ne reste que `auto`, `fullbody`, `upper-lower` (+ `glutes-focus`, jamais filtré).

⚠️ Le wizard affiche ici une note ℹ️ à l'étape Durée pour la Force (L297-314) : *« les repos de 3 min limitent le volume — 60 min = 4 exercices »*. Cohérent avec le barème `adjustedSlotCount`.

### 3. Analyse technique — si le filtre était ignoré

`selectSplit` → L474 → `['chest-tri','back-bi','legs','shoulders-arms','upper']` (identique à P53 — `selectSplit` ne lit **jamais** `goal` dans la branche `pref === 'brosplit'`, L468-476).

L'objectif n'intervient qu'ensuite, via `adjustedSlotCount` (`programGenerator.ts` L627-644) et les specs :

| # | Type | Base | `adjustedSlotCount(base, 60, 'strength')` = `max(4, floor(base×0.5))` | Slots retenus |
|---|---|---|---|---|
| 1 | `chest-tri` | 7 | `max(4, 3)` = **4** | chest cmp · chest_upper cmp · triceps iso · chest fly iso |
| 2 | `back-bi` | 8 | `max(4, 4)` = **4** | back_width cmp · back_thickness cmp · biceps iso · back iso |
| 3 | `legs` | 6 | `max(4, 3)` = **4** | quads cmp · ham/glutes cmp · quads iso · glutes iso |
| 4 | `shoulders-arms` | 8 | `max(4, 4)` = **4** | OHP cmp · shldr_lat iso · shldr_rear iso · biceps iso |
| 5 | `upper` | 8 | `max(4, 4)` = **4** | chest cmp · back cmp · OHP cmp · shldr_lat/rear iso |

Specs : compound `5×3-5 / rest 180s` (L74), isolation `3×5-8 / rest 120s` (L81). `adjustedSpec` inchangé à 60 min (L652).

**Résultat sportivement aberrant, quantifié :**
- Séance 4 (`shoulders-arms`) = **1 composé + 3 isolations**, dont un élévation latérale à **3×5-8 avec 2 min de repos** et un curl biceps idem. Charger lourd un deltoïde latéral sur 5-8 reps est un non-sens biomécanique (risque articulaire, ratio stimulus/fatigue déplorable).
- Séance 1 (`chest-tri`) = 2 développés + 2 isolations lourdes ; le triceps pushdown à 3×5-8 également.
- **Sur 20 slots hebdomadaires, seulement 8 sont des composés** (2+2+2+1+3 → 10 précisément : chest, chest_upper, back_width, back_thickness, quads, ham/glutes, OHP, chest, back, OHP = 10). Les 10 autres sont des isolations traitées en régime de force.
- **Fréquence par pattern lourd :** squat 1×/sem., soulevé/RDL 1×/sem., développé couché 2×/sem. (chest-tri + upper), OHP 2×/sem. (shoulders-arms + upper), tirage 2×/sem.

### 4. Évaluation coach

**Filtre justifié sur le fond, mais son motif est partiellement contredit par le code.**

Le fond est solide : la force maximale est une **compétence motrice**. La littérature (Grgic 2018 ; Ralston 2018) et la pratique (Sheiko, 5/3/1, Texas Method) convergent sur 2-3 expositions hebdomadaires par mouvement de compétition. Le brosplit organise le travail par **muscle**, pas par **mouvement** — inadapté par construction.

**Mais le motif littéral est faux à 5 jours.** Le message affirme « Brosplit n'en donne qu'un [stimulus] ». Or le split 5j réel donne 2×/sem. pour pecs, dos et épaules (grâce à la séance `upper` en position 5). **Le seul pattern réellement à 1×/semaine, c'est le squat et le soulevé de terre** — les deux plus importants en force. Le message serait juste s'il disait : *« Brosplit : squat et soulevé de terre 1×/semaine seulement »*.

**Défaut aggravant révélé par la simulation :** le vrai problème n'est pas la fréquence mais la **composition des séances sous barème force**. `adjustedSlotCount` cape à 4 slots, et sur les templates `shoulders-arms` / `chest-tri` / `back-bi` les positions 3-4 sont des isolations. Un athlète de force se retrouve donc à faire des élévations latérales en 5×3-5. **Aucun filtre du wizard ne couvre ce cas** : `glutes-focus` + strength (profil P50) produit exactement la même anomalie et n'est **pas** bloqué.

**Recommandation :** en objectif Force, prioriser les slots `compound: true` dans le cap de `adjustedSlotCount` plutôt que de tronquer l'ordre canonique. Cela corrigerait P54, P50 et le brosplit force d'un seul coup.

---

# P55 — Brosplit bloqué par objectif Endurance

**Contexte wizard :** `{ goal:'endurance', level:'intermediate', days:5 }` · Split testé : `'brosplit'`

### 1. Simulation `incompatibleReason('brosplit')`

| Étape | Ligne | Test | Évaluation | Sortie |
|---|---|---|---|---|
| entrée | L628 | `case 'brosplit'` | match | — |
| 1 | **L629** | `5 < 5` | **false** | poursuite |
| 2 | **L630** | `'intermediate' === 'beginner'` | **false** | poursuite |
| 3 | **L631** | `'endurance' === 'strength'` | **false** | poursuite |
| 4 | **L632** | `goal === 'endurance'` | **true** | **`return`** |

**Valeur retournée :** `"Endurance : fréquence élevée par muscle requise — Brosplit trop peu fréquent"`

**Assertion attendue :** identique → ✅ **PASS** (ligne 632)

C'est le **chemin le plus long** du switch brosplit : les 4 tests sont évalués avant le `return`. Si `goal` valait `'fat_loss'`, la fonction atteindrait **L633 `return null`** → bouton actif. Confirmation directe de l'assertion P47 du groupe C : `fat_loss` n'est bloqué par **aucun** des trois filtres.

### 2. Comportement UI attendu

Bouton Bro Split grisé, `⚠ Endurance : fréquence élevée par muscle requise — Brosplit trop peu fréquent`. ✅ PASS.

`arnold` bloqué en parallèle par L638 (message quasi identique), `ppl` par L643. Même configuration que P54 : 3 options grisées sur 6.

### 3. Analyse technique — si le filtre était ignoré

`selectSplit` → L474 → `['chest-tri','back-bi','legs','shoulders-arms','upper']` (inchangé — `goal` n'est pas lu).

`adjustedSlotCount(base, 60, 'endurance')` : `duration === 60` et `isStrength = false` → **`return base`** (L638-639 de `programGenerator.ts`). Aucune réduction :

| # | Type | Slots | Specs compound (L76) | Specs isolation (L83) |
|---|---|---|---|---|
| 1 | `chest-tri` | **7** | 3×15-20, rest 60s | 3×15-20, rest 45s |
| 2 | `back-bi` | **8** | idem | idem |
| 3 | `legs` | **6** | idem | idem |
| 4 | `shoulders-arms` | **8** | idem | idem |
| 5 | `upper` | **8** | idem | idem |

Total 37 slots + 5 warmups (2×10) + 5 core (3×15) = **47 exercices**, soit **~141 séries hebdomadaires** à 15-20 répétitions.

**Estimation de durée par séance (`back-bi`, 8 slots) :** 24 séries de travail. À ~45 s de travail (18 reps × 2,5 s) + 45-60 s de repos ≈ 1 min 45 par série → **~42 min de slots + warmup + core ≈ 50-55 min**. Tient dans le créneau 60 min — le problème n'est pas la durée mais la **fréquence** et la **redondance**.

### 4. Évaluation coach

**Filtre justifié — mais moins nettement que P53, et pour une raison différente de celle affichée.**

L'endurance musculaire locale repose sur des adaptations **périphériques** (densité capillaire, densité mitochondriale, tampon lactique, recrutement des fibres I). Ces adaptations ont un **décours court** : le stimulus doit être répété fréquemment, idéalement 3×/semaine par groupe, avec une fatigue résiduelle faible qui le permet parfaitement (charges légères, pas de dommage musculaire significatif). Un format qui concentre 24 séries sur un groupe une fois par semaine est doublement mauvais : trop de volume localisé d'un coup (fatigue métabolique dépassant l'utile), trop d'écart entre expositions.

**Comme en P54, le motif littéral surestime le défaut :** à 5 jours, la séance `upper` finale porte pecs, dos et épaules à **2×/semaine**. Le déficit réel concerne les jambes (1×/semaine) et l'absence totale de travail cardiovasculaire — que le wizard signale d'ailleurs honnêtement dans le libellé de l'objectif Endurance (L33 : *« Séries longues, peu de repos — cardio non inclus »*).

**Nuance à charge du filtre :** l'alternative proposée implicitement (l'auto) donne pour `endurance/intermediate/5j` la branche L573 → `['push','pull','lower-quad','lower-hip','fullbody-quad']`. Fréquence : pecs 2× (push + fullbody), dos 2×, jambes 3× (lower-quad + lower-hip + fullbody). **C'est effectivement bien supérieur** pour l'endurance. Le blocage oriente donc vers une option réellement meilleure — contrairement à P52. ✅

---

# P56 — Arnold bloqué par fréquence insuffisante

**Contexte wizard :** `{ goal:'hypertrophy', level:'intermediate', days:2 }` · Split testé : `'arnold'`

### 1. Simulation `incompatibleReason('arnold')`

| Étape | Ligne | Test | Évaluation | Sortie |
|---|---|---|---|---|
| entrée | L634 | `case 'arnold'` | match | — |
| 1 | **L635** | `days !== null && days < 3` → `2 !== null && 2 < 3` | **true** | **`return`** |

**Valeur retournée :** `"Nécessite 3 séances/sem. minimum — tu en as 2"`

**Assertion attendue :** identique → ✅ **PASS** (ligne 635)

L636 (beginner), L637 (strength), L638 (endurance) non atteints.

### 2. Comportement UI attendu

Bouton Arnold Split grisé (opacity 0.45, cursor not-allowed), `⚠ Nécessite 3 séances/sem. minimum — tu en as 2`. ✅ PASS.

**Contexte remarquable : à `days = 2`, deux boutons sont grisés simultanément.** `brosplit` → L629 (`2 < 5`) → `"Nécessite 5 séances/sem. — tu en as 2"` ; `ppl` → **L641** (`2 < 3`) → `"Nécessite 3 séances/sem. minimum — tu en as 2"`. Seuls `auto`, `fullbody`, `upper-lower` et `glutes-focus` restent cliquables — ce qui est **sportivement correct** : à 2 séances/semaine, seul le corps entier ou un upper/lower a du sens.

### 3. Analyse technique — si le filtre était ignoré

`selectSplit` → `programGenerator.ts` L458 `if (pref === 'arnold')` → L460 switch → **L461** `case 2: return ['chest-back', 'legs']`

**Split produit :** `['chest-back','legs']` → ✅ conforme à l'assertion du prompt.

| # | Type interne | Base | slots (60, hypertrophy) | Type public (L122) | Nom (L603) |
|---|---|---|---|---|---|
| 1 | `chest-back` | 9 | **9** | `upper` | Chest & Back — Pectoraux & Dos |
| 2 | `legs` | 6 | **6** | `legs` | Legs — Jambes |

Pas de suffixe (chaque canon 1×). Total 15 slots + 2 warmups + 2 core = **19 exercices**.

Détail `chest-back` (9 slots, tous retenus, L274-286) : chest cmp · back_width cmp · OHP cmp · back_thickness cmp · chest iso · back iso · biceps iso · triceps iso · shoulders_rear iso.
Détail `legs` (6 slots, L148-155) : quads cmp · ham/glutes cmp · quads iso · glutes iso · ham iso · calves iso.

**Audit de couverture — groupes musculaires absents du programme entier :**

| Groupe | Présent ? | Où |
|---|---|---|
| chest / chest_upper / chest_lower | ✅ | chest-back pos 1, 5 |
| back_width / back_thickness | ✅ | chest-back pos 2, 4, 6 |
| shoulders / shoulders_front | ✅ | chest-back pos 3 (OHP) |
| shoulders_rear | ✅ | chest-back pos 9 |
| **shoulders_lateral** | ❌ **ABSENT** | aucun slot dans `chest-back` ni `legs` |
| biceps / triceps | ✅ | chest-back pos 7, 8 |
| **forearms** | ❌ **ABSENT** | — |
| quads / hamstrings / glutes / calves | ✅ | legs pos 1-6 |
| core | ✅ | corePool en queue (L1031-1036) |

Warnings : `hasPushSession` = true et `hasPullSession` = true (`chest-back` figure dans les deux listes, L1106 et L1113) → aucun warning UX-5. `publicTypes = {upper, legs}`, size 2 → pas d'UX-D. **Aucun warning émis** malgré l'absence de deltoïde latéral.

### 4. Évaluation coach

**Filtre justifié, et pour la bonne raison — mais le programme sous-jacent n'est effectivement pas un Arnold split.**

Réponse directe à la question du prompt : **non, `['chest-back','legs']` n'est pas un Arnold split.** L'Arnold repose sur trois séances (Pecs+Dos / Épaules+Bras / Jambes) répétées 2× pour 6 jours — c'est un format de **haute fréquence à haut volume**. En amputer la séance Épaules+Bras détruit à la fois le concept et la couverture : **le deltoïde latéral disparaît complètement du programme**, alors qu'il est le principal contributeur à la largeur d'épaule, c'est-à-dire précisément l'esthétique « Arnold ». Ironie complète.

Ce qui reste est un **upper/lower 2 jours déguisé**, avec un upper surchargé (9 slots, 4 composés consécutifs : développé, traction, OHP, rowing = 16 séries lourdes avant la première isolation) et déséquilibré vers l'antérieur.

Le seuil `days < 3` est donc **bien calibré** et le message est **exact** : Arnold nécessite structurellement 3 séances distinctes.

**Point de comparaison favorable :** à 2 jours, l'utilisateur redirigé vers `auto` obtient `['fullbody-quad','fullbody-hip']` (L549) — deux corps entiers avec OHP, écarté latéral (fullbody-hip pos 6), mollets et biceps. **Couverture complète, fréquence 2×/semaine sur tout.** Le filtre oriente vers strictement mieux. ✅

**Note technique complémentaire :** l'absence de deltoïde latéral n'émet **aucun warning générateur** — les warnings de slot vide ne se déclenchent que sur un slot `compound: true` sans candidat (L996-1006), jamais sur un groupe musculaire **non représenté par un slot**. Angle mort à signaler hors groupe D.

---

# P57 — Arnold bloqué par niveau débutant

**Contexte wizard :** `{ goal:'hypertrophy', level:'beginner', days:3 }` · Split testé : `'arnold'`

### 1. Simulation `incompatibleReason('arnold')`

| Étape | Ligne | Test | Évaluation | Sortie |
|---|---|---|---|---|
| entrée | L634 | `case 'arnold'` | match | — |
| 1 | **L635** | `3 !== null && 3 < 3` | **false** | poursuite |
| 2 | **L636** | `level === 'beginner'` | **true** | **`return`** |

**Valeur retournée :** `"Volume et complexité élevés — déconseillé en débutant"`

**Assertion attendue :** identique → ✅ **PASS** (ligne 636)

Ordre days→level confirmé une seconde fois (cf. P53) : à `days = 2` le message aurait été celui de la fréquence.

### 2. Comportement UI attendu

Bouton Arnold Split grisé, `⚠ Volume et complexité élevés — déconseillé en débutant`. ✅ PASS.

Contexte : `brosplit` bloqué par L629 (`3 < 5`, message fréquence — **et non** le message débutant, illustration de BUG-D2). `ppl` → L641 (3 ≥ 3), L642/L643 (hypertrophy) → **actif**. Un débutant peut donc choisir PPL explicitement à 3 jours, alors que l'auto lui donnerait fullbody×3 (L557). Incohérence de philosophie signalée en §3 (BUG-D4).

### 3. Analyse technique — si le filtre était ignoré

`selectSplit` → L458 → **L462** `case 3: return ['chest-back','shoulders-arms','legs']` — l'Arnold classique.

| # | Type interne | Base | slots (60, hypertrophy) | Type public | Nom |
|---|---|---|---|---|---|
| 1 | `chest-back` | 9 | **9** | `upper` | Chest & Back — Pectoraux & Dos **A** |
| 2 | `shoulders-arms` | 8 | **8** | `upper` | Shoulders & Arms — Épaules & Bras **B** |
| 3 | `legs` | 6 | **6** | `legs` | Legs — Jambes |

⚠️ Même artefact de nommage qu'en P53 : `chest-back` et `shoulders-arms` partagent le type public `'upper'` (L122) → `totalOfType = 2` → suffixes **A** et **B** accolés à deux noms déjà distincts.

`level = 'beginner'` → `pickExercise` déterministe, `candidates[0]` (L781). Total 23 slots + 3 warmups + 3 core = **29 exercices/semaine**.

**Charge réelle de la séance `chest-back` (9 slots) :**

| Pos | Slot | Cat | Spec | Séries |
|---|---|---|---|---|
| 1 | chest / chest_upper | cmp | 4×8-12, rest 90 | 4 |
| 2 | back_width / back | cmp | 4×8-12, rest 90 | 4 |
| 3 | shoulders / shoulders_front | cmp | 4×8-12, rest 90 | 4 |
| 4 | back_thickness / back | cmp | 4×8-12, rest 90 | 4 |
| 5-9 | 5 isolations | iso | 3×10-15, rest 75 | 15 |

**35 séries de travail + warmup (2) + core (3) = 40 séries.** Estimation : 16 séries composées × ~2 min (travail + repos 90 s) = 32 min ; 15 séries isolation × ~1 min 45 = 26 min ; warmup + core ≈ 10 min → **≈ 68 min minimum, sans transition ni installation**, pour un créneau annoncé de 60 min. Dépassement de ~15 %.

### 4. Évaluation coach

**Filtre pleinement justifié — le message est exact ET les deux motifs qu'il cite sont vérifiables dans la simulation.**

**« Complexité » :** la séance A enchaîne **quatre composés lourds** (développé couché, traction/tirage, développé militaire, rowing barre) avant la moindre isolation. Cela suppose la maîtrise simultanée de quatre patterns techniques exigeants. Un débutant a typiquement une exécution acceptable sur un ou deux d'entre eux ; sur les composés 3 et 4, la technique se dégrade sous la fatigue accumulée par 8 séries lourdes préalables. C'est le scénario classique d'ancrage d'un défaut moteur.

**« Volume » :** 35 séries de travail sur une séance, dont 16 lourdes. La recommandation usuelle pour un novice est de **10-15 séries par séance**, 10-12 séries hebdomadaires par groupe musculaire. On est ici à plus du double, dès la première semaine.

**Argument supplémentaire non mentionné par le message — le principe même du split antagoniste est prématuré.** Pecs+dos dans la même séance vise le « pompage mutuel » et la récupération croisée entre séries antagonistes : un raffinement de gestion de fatigue qui ne produit un bénéfice que chez un pratiquant capable de générer une fatigue locale significative. Chez un débutant, ce mécanisme n'a rien à réguler.

**L'alternative est nettement supérieure.** À `beginner/3j/hypertrophy`, l'auto donne L557 → `['fullbody-quad','fullbody-hip','fullbody-quad']` : squat, développé et tirage **3× par semaine** (2× pour le pattern hip/RDL), 9 slots par séance dont 4 composés seulement, et surtout **répétition du même geste tous les 2 jours** — le format optimal pour l'apprentissage moteur. Le filtre redirige vers strictement mieux. ✅

---

# P58 — PPL bloqué par objectif Force ⚠️ INCOHÉRENCE MAJEURE

**Contexte wizard :** `{ goal:'strength', level:'intermediate', days:3 }` · Split testé : `'ppl'`

### 1. Simulation `incompatibleReason('ppl')`

| Étape | Ligne | Test | Évaluation | Sortie |
|---|---|---|---|---|
| entrée | L640 | `case 'ppl'` | match | — |
| 1 | **L641** | `days !== null && days < 3` → `3 !== null && 3 < 3` | **false** | poursuite |
| 2 | **L642** | `goal === 'strength'` | **true** | **`return`** |

**Valeur retournée :** `"Split orienté hypertrophie — Force préfère Full Body ou Upper/Lower (2-3 stimuli/sem.)"`

**Assertion attendue :** identique → ✅ **PASS** (ligne 642)

**À noter :** le `case 'ppl'` **ne teste pas `level`** — contrairement à `brosplit` (L630) et `arnold` (L636). PPL est donc autorisé aux débutants (cf. P57 §2). Asymétrie délibérée ou oubli ? Voir BUG-D4.

### 2. Comportement UI attendu

Bouton PPL grisé, `⚠ Split orienté hypertrophie — Force préfère Full Body ou Upper/Lower (2-3 stimuli/sem.)`. ✅ PASS.

Contexte `strength/intermediate/3j` : `brosplit` bloqué par L629 (`3 < 5`), `arnold` bloqué par **L637** (`"Split bodybuilding — Force préfère Full Body ou Upper/Lower (fréquence 2-3×/sem.)"`). **Trois options grisées ; restent `auto`, `fullbody`, `upper-lower`, `glutes-focus`.**

### 3. Analyse technique — si le filtre était ignoré

`selectSplit` → `programGenerator.ts` L440 `if (pref === 'ppl')` → L441 switch → **L443** `case 3: return ['push','pull','legs']`

| # | Type | Base | `adjustedSlotCount(base,60,'strength')` | Slots retenus (après troncature) |
|---|---|---|---|---|
| 1 | `push` | 6 | `max(4, 3)` = **4** | chest cmp · shoulders cmp · chest iso · triceps iso |
| 2 | `pull` | 6 | `max(4, 3)` = **4** | back_width cmp · back_thickness cmp · back iso · biceps iso |
| 3 | `legs` | 6 | `max(4, 3)` = **4** | quads cmp · ham/glutes cmp · quads iso · glutes iso |

Slots éjectés par la troncature : push pos 5-6 (shoulders_lat, shoulders_rear), pull pos 5-6 (shoulders_rear, forearms), legs pos 5-6 (hamstrings iso, **calves**).

Specs : compound 5×3-5 rest 180 (L74) ; isolation 3×5-8 rest 120 (L81). `goal === 'strength' && slot.compound` → `strengthEquipmentPrio` s'applique dans le tri (L769-772), barbell prioritaire.

Total 12 slots + 3 warmups + 3 core = **18 exercices**. Fréquence : **1×/semaine pour chaque pattern** (squat, soulevé, développé, tirage).

### 3bis. ⚠️ INCOHÉRENCE — le chemin AUTO produit exactement le split interdit

**Simulation `selectSplit` en mode auto avec les mêmes paramètres** (`splitPreference` absent → `pref = 'auto'`, `focusMuscles = []` → `workoutTypeFromFocus([])` retourne `null` en L402) :

```
programGenerator.ts
L435   const isMass = goal === 'strength' || goal === 'hypertrophy'   → isMass = TRUE
L500   const focusType = workoutTypeFromFocus([])                     → null
L501   if (focusType)                                                 → skip
L547   switch (daysPerWeek)                                           → case 3 (L551)
L553   if (isMass && level !== 'beginner') return ['push','pull','legs']   ← MATCH
```

**Résultat auto : `['push','pull','legs']` — strictement identique au PPL explicite bloqué par L642.**

| Chemin utilisateur | Ce que dit le wizard | Split réellement généré |
|---|---|---|
| Étape 4 → clic « PPL » | 🚫 grisé : *« Split orienté hypertrophie — Force préfère Full Body ou Upper/Lower »* | *(inaccessible)* |
| Étape 4 → clic « Auto » | ✅ *« Le coach choisit selon tes critères »* | **`['push','pull','legs']`** — le PPL interdit |

Le même utilisateur, à un clic de distance, se voit refuser une structure puis la recevoir sans le moindre avertissement — et sans qu'aucun `generatorWarning` ne soit émis (aucune règle des L1063-1157 ne couvre ce cas).

**Aggravation : le chemin auto est le plus emprunté.** `'auto'` est la valeur initiale du state (L205) et la première option de la liste (L617). L'utilisateur qui suit le parcours nominal tombe donc systématiquement dans le cas non protégé, tandis que le filtre ne s'applique qu'à celui qui explore les options manuellement.

**Bug ou choix délibéré ?** — **Bug.** Trois éléments l'établissent :
1. Un choix délibéré aurait produit une cohérence inverse (auto plus conservateur que l'explicite, jamais l'inverse) — le rôle d'un mode « le coach choisit » est d'être le chemin **sûr**.
2. La branche L553 est écrite en termes de `isMass`, qui **agrège** `strength` et `hypertrophy` (L435). Le PPL y est manifestement pensé pour l'hypertrophie ; `strength` est embarqué par effet de bord de l'agrégat, pas par intention.
3. Le libellé du filtre L642 dit littéralement *« Split orienté hypertrophie »* — l'auteur du filtre sait que PPL est un split d'hypertrophie. La branche L553 le contredit.

**Correctif recommandé (côté générateur, pas côté wizard — le filtre a raison) :**

```ts
// programGenerator.ts, case 3 (L551-557)
case 3:
  // Force : fullbody 3× — chaque pattern lourd 3 fois par semaine
  if (goal === 'strength' && level !== 'beginner')
    return ['fullbody-quad', 'fullbody-hip', 'fullbody-quad']
  if (isMass && level !== 'beginner') return ['push', 'pull', 'legs']   // hypertrophie seule
  if (!isMass && level !== 'beginner') return ['push', 'pull', 'fullbody-quad']
  return ['fullbody-quad', 'fullbody-hip', 'fullbody-quad']
```

Effet : `adjustedSlotCount(9, 60, 'strength') = max(4, 4) = 4` → 4 slots par séance fullbody = squat, développé, tirage, OHP à 5×3-5. **C'est exactement la structure d'un Starting Strength / Texas Method** — le standard de la force à 3 jours. Le générateur y est déjà parfaitement adapté.

⚠️ **Portée du correctif à vérifier :** cette même incohérence touche potentiellement `daysPerWeek = 5` (L569 : `isMass && !beginner` → `['push','pull','legs','upper','lower']`, PPL+UL également refusé par le filtre PPL). À traiter dans le même correctif.

### 4. Évaluation coach

**Le filtre a raison ; c'est `selectSplit` qui a tort.**

Pour un intermédiaire visant la force à 3 séances/semaine, `['push','pull','legs']` est un mauvais choix, pour un motif qui n'apparaît pleinement que dans la simulation :

1. **Fréquence par pattern : 1×/semaine.** Un squat le vendredi, le suivant le vendredi d'après. La force étant une compétence, l'espacement de 7 jours entre expositions est très en deçà de l'optimum (2-3×/sem., cf. Grgic 2018).
2. **Composition dégradée par le cap force.** Le cap à 4 slots laisse **2 composés + 2 isolations** par séance. Sur 12 slots hebdomadaires, seuls **6 sont des composés**. Un programme de force à 6 séries d'exercices lourds par semaine est un programme d'hypertrophie mal réglé. En fullbody 3×, le même cap de 4 slots donnerait **4 composés par séance = 12 composés/semaine**, soit le double.
3. **Isolations en régime de force.** Curl biceps et extension triceps à 3×5-8 avec 2 min de repos : ratio stimulus/fatigue défavorable, temps consommé sans transfert.
4. **Mollets supprimés.** La troncature à 4 slots éjecte systématiquement le slot `calves` (position 6 de `legs`).

Le message affiché est donc **juste sur le diagnostic** (« split orienté hypertrophie ») et **juste sur la prescription** (« Force préfère Full Body ou Upper/Lower »). C'est la meilleure formulation des huit filtres du groupe D.

**Verdict global P58 :** filtre wizard ✅ correct · générateur auto ❌ à corriger · sévérité **haute** (touche le parcours par défaut, objectif Force, niveau intermédiaire et confirmé).

---

# P59 — PPL bloqué par objectif Endurance

**Contexte wizard :** `{ goal:'endurance', level:'intermediate', days:3 }` · Split testé : `'ppl'`

### 1. Simulation `incompatibleReason('ppl')`

| Étape | Ligne | Test | Évaluation | Sortie |
|---|---|---|---|---|
| entrée | L640 | `case 'ppl'` | match | — |
| 1 | **L641** | `3 !== null && 3 < 3` | **false** | poursuite |
| 2 | **L642** | `'endurance' === 'strength'` | **false** | poursuite |
| 3 | **L643** | `goal === 'endurance'` | **true** | **`return`** |

**Valeur retournée :** `"Endurance : fréquence élevée par muscle requise — préfère Full Body ou Upper/Lower"`

**Assertion attendue :** identique → ✅ **PASS** (ligne 643)

### 2. Comportement UI attendu

Bouton PPL grisé, `⚠ Endurance : fréquence élevée par muscle requise — préfère Full Body ou Upper/Lower`. ✅ PASS.

Contexte `endurance/intermediate/3j` : `brosplit` bloqué par L629 (`3 < 5`), `arnold` bloqué par L638. Trois options grisées, `auto`/`fullbody`/`upper-lower`/`glutes-focus` disponibles.

### 3. Analyse technique — si le filtre était ignoré

`selectSplit` → L440 → **L443** `case 3: return ['push','pull','legs']`

`adjustedSlotCount(6, 60, 'endurance')` : `duration === 60`, `isStrength = false` → `return base` = **6 slots** par séance (aucune troncature, contrairement à P58).

| # | Type | Slots (6/6) | Contenu complet |
|---|---|---|---|
| 1 | `push` | 6 | chest cmp · shoulders cmp · chest iso · triceps iso · shoulders_lat iso · shoulders_rear iso |
| 2 | `pull` | 6 | back_width cmp · back_thickness cmp · back iso · biceps iso · shoulders_rear iso · forearms iso |
| 3 | `legs` | 6 | quads cmp · ham/glutes cmp · quads iso · glutes iso · ham iso · calves iso |

Specs endurance : compound 3×15-20 rest 60 (L76), isolation 3×15-20 rest 45 (L83). Total 18 slots + 3 warmups + 3 core = **24 exercices**, 54 séries de travail hebdomadaires.

### 3bis. Comparaison avec le chemin AUTO — cohérence vérifiée

```
programGenerator.ts
L435   isMass = ('endurance' === 'strength' || 'endurance' === 'hypertrophy')  → FALSE
L500   workoutTypeFromFocus([])                                               → null
L547   switch (3) → case 3 (L551)
L553   if (isMass && …)                                       → false, skip
L555   if (!isMass && level !== 'beginner') return ['push','pull','fullbody-quad']   ← MATCH
```

**Résultat auto : `['push','pull','fullbody-quad']` (PPF)** ≠ `['push','pull','legs']` (PPL).

✅ **Aucune incohérence de type P58 ici** : le chemin auto ne produit jamais le split que le filtre interdit. L'assertion du prompt est confirmée.

**Analyse fine de la différence — la fréquence promise n'est que partiellement livrée :**

| Groupe musculaire | PPL explicite (bloqué) | PPF auto (autorisé) | Gain |
|---|---|---|---|
| Pectoraux | 1× (push) | **2×** (push + fullbody pos 2) | ✅ +1 |
| Dos | 1× (pull) | **2×** (pull + fullbody pos 3) | ✅ +1 |
| Épaules (front/OHP) | 1× (push) | **2×** (push + fullbody pos 4) | ✅ +1 |
| Biceps | 1× (pull) | **2×** (pull + fullbody pos 7) | ✅ +1 |
| Triceps | 1× (push) | **2×** (push + fullbody pos 9) | ✅ +1 |
| Quadriceps | 1× **6 slots jambes** | 1× (fullbody pos 1, quads/glutes cmp) | ⚠️ volume ÷ 3 |
| Ischio-jambiers | 1× (2 slots : cmp + iso) | 1× (fullbody pos 5, iso seule) | ⚠️ perte du composé |
| Fessiers | 1× (2 slots) | 1× (via quads/glutes cmp seulement) | ⚠️ perte de l'iso |
| Mollets | 1× (legs pos 6) | 1× (fullbody pos 8) | = |

**Le gain de fréquence est réel sur tout le haut du corps (1× → 2×), mais il est payé par un effondrement du volume jambes** : la séance `legs` dédiée (6 slots) est remplacée par 3 slots répartis dans un fullbody. Le message du filtre est donc vrai pour 5 groupes sur 9 et faux pour les jambes.

**Nuance sur le libellé :** le message dit *« préfère Full Body ou Upper/Lower »*. L'auto ne donne **ni** l'un **ni** l'autre : il donne un PPF, c'est-à-dire un PPL dont on a remplacé la troisième séance. Le conseil affiché et le comportement réel du mode auto ne coïncident pas — décalage mineur mais réel (BUG-D3).

### 4. Évaluation coach

**Filtre justifié, mais c'est le plus faible des huit sur le plan de l'argumentation.**

Le fond est correct : l'endurance musculaire locale demande une **fréquence élevée et une fatigue résiduelle faible**. Les charges légères (15-20 reps, RPE modéré) génèrent peu de dommage musculaire, ce qui autorise et rend souhaitable un retour rapide sur le même groupe. Un PPL à 3 jours donne 7 jours entre deux sollicitations d'un même muscle — largement au-delà de la fenêtre utile (48-72 h).

**Trois réserves :**

1. **PPL 3j n'est pas catastrophique en endurance.** Contrairement à l'objectif Force (P58), l'endurance ne souffre pas du cap de slots : les 6 slots complets sont conservés, chaque séance est riche (2 composés + 4 isolations) et parfaitement réalisable en 60 min à 45-60 s de repos. La qualité intrinsèque des séances est bonne ; seul l'espacement pose problème.
2. **L'alternative proposée dégrade les jambes.** Voir le tableau ci-dessus : passer de 6 slots jambes à 3 est un recul sur le bas du corps. Pour un utilisateur cycliste ou coureur — profil typique de l'objectif Endurance — c'est contre-productif.
3. **Deux poids, deux mesures avec `fat_loss`.** L'argument de fréquence s'applique **identiquement** à `fat_loss` (3×12-15, rest 60 s — même logique métabolique, même faible dommage musculaire). Or `fat_loss` traverse les trois filtres sans être bloqué (L633, L639, L644 → `null`). Le profil P43 (PPL explicit + fat_loss) le confirme : bouton actif. **Le traitement d'`endurance` et de `fat_loss` devrait être identique** — soit les deux bloqués, soit aucun.

**Recommandation :** transformer le blocage endurance/PPL en avertissement non bloquant (le split reste utilisable, l'utilisateur est informé), ou étendre le blocage à `fat_loss` pour cohérence. La solution la plus défendable sportivement est la première : PPL 3j en endurance est sous-optimal, pas dangereux.

---

# Synthèse Groupe D

## Tableau récapitulatif — 8/8 assertions PASS

| # | Split | Contexte | Ligne déclenchante | Message retourné | Assertion | UI |
|---|---|---|---|---|---|---|
| P52 | brosplit | hyp / inter / 4j | **L629** | `Nécessite 5 séances/sem. — tu en as 4` | ✅ PASS | grisé |
| P53 | brosplit | hyp / **beginner** / 5j | **L630** | `Fréquence trop faible par muscle pour un débutant` | ✅ PASS | grisé |
| P54 | brosplit | **strength** / inter / 5j | **L631** | `Force requiert 2-3 stimuli/sem. par muscle — Brosplit n'en donne qu'un` | ✅ PASS | grisé |
| P55 | brosplit | **endurance** / inter / 5j | **L632** | `Endurance : fréquence élevée par muscle requise — Brosplit trop peu fréquent` | ✅ PASS | grisé |
| P56 | arnold | hyp / inter / **2j** | **L635** | `Nécessite 3 séances/sem. minimum — tu en as 2` | ✅ PASS | grisé |
| P57 | arnold | hyp / **beginner** / 3j | **L636** | `Volume et complexité élevés — déconseillé en débutant` | ✅ PASS | grisé |
| P58 | ppl | **strength** / inter / 3j | **L642** | `Split orienté hypertrophie — Force préfère Full Body ou Upper/Lower (2-3 stimuli/sem.)` | ✅ PASS | grisé |
| P59 | ppl | **endurance** / inter / 3j | **L643** | `Endurance : fréquence élevée par muscle requise — préfère Full Body ou Upper/Lower` | ✅ PASS | grisé |

**Toutes les chaînes de caractères, tous les ordres de test et tous les comportements UI attendus sont conformes.** `incompatibleReason` fonctionne exactement comme spécifié.

## Splits produits si les filtres étaient contournés

| # | `selectSplit` | Ligne | Split retourné | Le générateur bloque-t-il ? |
|---|---|---|---|---|
| P52 | brosplit 4j | `programGenerator.ts` L473 | `['chest-tri','back-bi','shoulders-arms','legs']` | ❌ non — 0 warning |
| P53 | brosplit 5j | L474 | `['chest-tri','back-bi','legs','shoulders-arms','upper']` | ⚠️ warning UX-H (volume débutant) |
| P54 | brosplit 5j | L474 | idem P53 | ❌ non |
| P55 | brosplit 5j | L474 | idem P53 | ❌ non |
| P56 | arnold 2j | L461 | `['chest-back','legs']` | ❌ non (deltoïde latéral absent, non détecté) |
| P57 | arnold 3j | L462 | `['chest-back','shoulders-arms','legs']` | ❌ non |
| P58 | ppl 3j | L443 | `['push','pull','legs']` | ❌ non |
| P59 | ppl 3j | L443 | `['push','pull','legs']` | ❌ non |

**Confirmation :** `selectSplit` ne consulte **jamais** `level`, et ne consulte `goal` que dans la branche `auto`. Les filtres sont **exclusivement** une barrière d'interface. Toute génération contournant l'UI (test unitaire, reprise de brouillon, futur endpoint) échappe intégralement à ces protections.

## Bugs et incohérences identifiés

### BUG-D4 — ⚠️ MAJEUR — Le mode Auto produit le split que le filtre PPL interdit (P58)

`incompatibleReason('ppl')` bloque PPL pour `goal === 'strength'` (L642), mais `selectSplit` en mode auto retourne `['push','pull','legs']` pour `strength + intermediate/advanced + 3j` (`programGenerator.ts` **L553**, via l'agrégat `isMass` défini L435). Le chemin par défaut du wizard délivre donc sans avertissement la structure que le chemin explicite déclare incompatible.

- **Sévérité :** haute — `'auto'` est la valeur initiale du state (L205) et la première option affichée (L617) ; c'est le parcours nominal.
- **Portée :** `strength` + `intermediate`/`advanced` + 3j (L553) ; à vérifier également pour 5j (L569 → `['push','pull','legs','upper','lower']`, également refusé par L642).
- **Diagnostic :** bug du générateur, pas du filtre. `isMass` agrège `strength` et `hypertrophy` alors que le PPL est un split d'hypertrophie — ce que le libellé du filtre reconnaît explicitement (« Split orienté hypertrophie »).
- **Correctif :** router `strength` vers fullbody×3 dans `case 3` (détail et code en P58 §3bis). `adjustedSlotCount(9,60,'strength') = 4` donne alors 4 composés lourds par séance — structure Starting Strength / Texas Method, déjà parfaitement supportée par le générateur.

### BUG-D1 — Accessibilité : blocage visuel sans blocage sémantique

`renderSplitButton` (L687-741) applique `opacity: 0.45` (L718), `cursor: 'not-allowed'` (L715) et une garde `if (disabled) return` (L697), mais **ne pose ni l'attribut HTML `disabled` ni `aria-disabled`**. Conséquences : le bouton reste dans l'ordre de tabulation, est annoncé « bouton, activé » par un lecteur d'écran, et un utilisateur au clavier obtient un `Enter` silencieusement ignoré sans retour. À comparer avec les autres boutons du même écran, correctement gérés (`disabled={advancing}` L353, `disabled={equipment.length === 0 …}` L589, `disabled={disabled}` L977).

**Correctif :** `disabled={disabled}` + `aria-describedby` pointant sur le bloc `reason`.

### BUG-D2 — Le motif affiché n'est pas toujours le motif structurant

L'ordre days→level→goal fait qu'un test précoce masque les suivants. Un débutant sélectionnant 3 jours voit sur Bro Split : *« Nécessite 5 séances/sem. — tu en as 3 »* (L629), ce qui laisse croire qu'à 5 séances l'option se débloquerait — alors qu'elle resterait bloquée par L630 (niveau). L'utilisateur peut modifier sa fréquence pour rien.

**Correctif :** collecter toutes les raisons applicables et afficher la plus structurante d'abord (niveau/objectif avant fréquence), ou les concaténer.

### BUG-D3 — Motifs partiellement démentis par le générateur

Trois messages décrivent une propriété que le split visé n'a pas :

| Message | Ligne | Réalité mesurée |
|---|---|---|
| brosplit « fréquence trop faible par muscle » | L630, L631, L632 | à 5j (L474), la séance `upper` finale porte pecs/dos/épaules/bras à **2×/semaine** ; seules les jambes sont à 1× |
| ppl endurance « préfère Full Body ou Upper/Lower » | L643 | l'auto ne donne **ni** l'un **ni** l'autre : il donne un **PPF** (L555) |
| arnold « Force préfère Full Body ou Upper/Lower » | L637 | l'auto en `strength/3j` donne **PPL** (L553) — cf. BUG-D4 |

Les blocages restent défendables ; ce sont les justifications qui sont imprécises.

### BUG-D5 — `fat_loss` échappe à tous les filtres

`fat_loss` atteint systématiquement `return null` (L633, L639, L644) : Bro Split, Arnold et PPL lui sont ouverts sans réserve, quels que soient le niveau et la fréquence. Or `fat_loss` (3×12-15, rest 60 s) partage exactement la logique métabolique d'`endurance` (3×15-20, rest 60 s) — même faible dommage musculaire, même bénéfice à une fréquence élevée. Les deux objectifs devraient être traités de la même façon. Confirmé par les profils P43, P45, P47 du groupe C (tous « bouton actif »).

### BUG-D6 — `glutes-focus` court-circuite entièrement le filtrage

Le bouton est rendu **hors** de la boucle `OPTIONS.map`, dans un bloc « Programmes spécialisés » (L673-681), avec `disabled: false` et `reason: null` **codés en dur** (L679-680). `incompatibleReason` n'est jamais appelée pour lui. Conséquence : `glutes-focus` est sélectionnable pour un **débutant**, à **2 jours**, en objectif **Force** — combinaison qui déclencherait trois blocages sur n'importe quel autre split. Le profil P50 (`glutes-focus` + strength + advanced) montre le résultat : `adjustedSlotCount(8,60,'strength') = 4` → hip thrust et RDL en 5×3-5, puis deux isolations fessiers en 3×5-8.

**Correctif :** passer `glutes-focus` par `incompatibleReason` (le `default` L645-646 rendrait `null` sans changer le comportement actuel), ce qui permet d'y ajouter ultérieurement des règles sans refactoriser.

### BUG-D7 — Angle mort : aucun warning sur un groupe musculaire sans slot

Les warnings de slot vide (`programGenerator.ts` L994-1007) ne se déclenchent que si un slot `compound: true` n'a **aucun candidat pour l'équipement disponible**. Un groupe musculaire qui n'a **aucun slot dans le split** passe totalement inaperçu. Illustration en P56 : `['chest-back','legs']` ne contient aucun slot `shoulders_lateral` ni `forearms` — **zéro warning émis**. Hors périmètre strict du groupe D, mais découvert lors de la simulation P56.

## Évaluation coach — les 8 filtres classés

| Filtre | Ligne | Fond sportif | Motif affiché | Verdict |
|---|---|---|---|---|
| arnold + beginner (P57) | L636 | ✅ excellent — 4 composés lourds enchaînés, 35 séries, ~68 min pour un créneau de 60 | ✅ exact (volume ET complexité, tous deux vérifiés) | **À conserver tel quel** |
| brosplit + beginner (P53) | L630 | ✅ excellent — 47 exercices/sem., squat 1×/sem. chez un novice | ⚠️ imprécis (le 5j donne 2× sur le haut du corps) | **Conserver, reformuler** |
| ppl + strength (P58) | L642 | ✅ solide — 1×/pattern, 6 composés/sem. seulement après le cap force | ✅ le mieux formulé des huit | **Conserver — corriger le générateur (BUG-D4)** |
| arnold + days<3 (P56) | L635 | ✅ solide — le 2j n'est pas un Arnold ; deltoïde latéral absent du programme entier | ✅ exact | **À conserver tel quel** |
| arnold + strength (—) | L637 | ✅ solide — même logique que P58 | ⚠️ « préfère Full Body ou Upper/Lower » démenti par l'auto (BUG-D4) | **Conserver, dépend du correctif D4** |
| brosplit + strength (P54) | L631 | ✅ solide — élévations latérales en 3×5-8, squat 1×/sem. | ⚠️ « n'en donne qu'un » faux à 5j | **Conserver, reformuler** |
| brosplit + endurance (P55) | L632 | ✅ correct — l'auto (L573) donne réellement mieux (jambes 3×/sem.) | ⚠️ même imprécision | **Conserver, reformuler** |
| ppl + endurance (P59) | L643 | ⚠️ le plus faible — PPL 3j en endurance est sous-optimal, pas mauvais ; l'alternative dégrade les jambes | ⚠️ conseille FB/UL, l'auto donne un PPF | **Passer en avertissement non bloquant** |

## Recommandations par ordre de priorité

1. **Corriger BUG-D4** (`programGenerator.ts` L551-557, et vérifier L567-575) — router `strength` vers fullbody×3. C'est le seul défaut fonctionnel réel du groupe : il touche le parcours par défaut et contredit le conseil affiché par le wizard.
2. **Corriger BUG-D1** — ajouter `disabled={disabled}` et `aria-disabled` sur le bouton de `renderSplitButton` (L694-721). Correctif d'une ligne.
3. **Trancher sur BUG-D5** — aligner `fat_loss` sur `endurance` dans les trois `case`, ou assumer explicitement l'asymétrie.
4. **Reformuler les motifs de BUG-D3** — remplacer l'argument de fréquence par l'argument réel (volume et fréquence jambes) pour les trois filtres brosplit.
5. **Passer `glutes-focus` par `incompatibleReason`** (BUG-D6) — sans changement de comportement immédiat, mais rend le filtrage extensible.
6. **Envisager BUG-D2** — afficher le motif structurant plutôt que le premier motif rencontré.

---

*Fin du Groupe D — profils P52 à P59, aucun profil omis.*



---


# Audit `generateProgramDraft` v4 — GROUPE E (Durée × Structure) — P60 → P65

**Auditeur :** coach sportif certifié (15 ans de programmation) + simulation ligne à ligne du code.
**Fichiers simulés :**
- `src/utils/programGenerator.ts` (1172 lignes, lu en entier)
- `src/components/screens/ProgramGeneratorScreen.tsx` (note ℹ️ durée force, l. 296–314)
- `src/data/exercises-seed.json` (151 exercices, ordre fichier utilisé pour les départages)

**Rappel des barèmes lus dans le code**

`adjustedSlotCount(base, duration, goal)` — l. 627–644 :

| durée | strength | autres goals | ligne |
|---|---|---|---|
| 20 | `max(2, floor(base×0.5))` | `max(2, floor(base×0.5))` | 633 |
| 45 | `max(2, floor(base×0.5))` | `max(3, floor(base×0.75))` | 634–636 |
| 60 | `max(4, floor(base×0.5))` | `base` | 637–639 |
| 90 | `min(base, 5)` | `min(base+2, 8)` | 641–643 |

`adjustedSpec(spec, duration)` — l. 651–655 : 60/90 → inchangé ; 20 → `×0.5` ; 45 → `×0.75` ; plancher `max(2, …)` (l. 654).

**Règle « séance très courte » (l. 1017–1036) — impacte tout le groupe E à 20 min :**
```ts
const isVeryShort = sessionDuration <= 20            // l. 1017
const effectiveWarmupSpec = isVeryShort ? { ...WARMUP_SPEC, sets: 1 } : WARMUP_SPEC   // l. 1018
if (!isVeryShort && corePool.length > 0) { … }       // l. 1031 → PAS de core à 20 min
```
→ à 20 min le total réel est **slots + 1 (warmup)**, et non `slots + warmup + core`. Les totaux annoncés dans le prompt d'audit pour P60, P61 et P64 sont donc à corriger (voir assertions).

---

## P60 — 20 min + strength + intermediate 3j → volume extrêmement réduit

```
{ goal:'strength', daysPerWeek:3, sessionDuration:20, equipment:FULL, level:'intermediate' }
```

### Simulation

**Étape 1 —** `focusMuscles` absent → `[]` → `workoutTypeFromFocus([])` → `null` (l. 402, retour immédiat sur `length === 0`).
Flags non évalués : `hasLower=–, hasPush=–, hasPull=–, hasArms=–, hasUpper=–, hasCore=–`.

**Étape 2 —** `selectSplit` : `pref='auto'`, `focusType=null` → switch par défaut, `case 3` :
`isMass = (goal==='strength') → true` ; `level='intermediate' ≠ 'beginner'` → **`['push','pull','legs']`** (l. 553).
Noms (l. 590–611 + suffixe l. 1039–1041) : canons `push`/`pull`/`legs` uniques → aucun suffixe →
« Push — Poussée » · « Pull — Tirage » · « Legs — Jambes ».

**Étape 3 — `adjustedSlotCount` pas à pas** (duration=20 → l. 633, formule identique quel que soit le goal) :
- push  : base=6 → `max(2, floor(6×0.5)) = max(2, floor(3)) = max(2,3) = **3**`
- pull  : base=6 → `max(2, floor(3)) = **3**`
- legs  : base=6 → `max(2, floor(3)) = **3**`

**`adjustedSpec` pas à pas** (duration=20 → `factor = 0.5`, l. 653) :
- compound strength `{sets:5, 3-5, rest 180}` → `max(2, floor(5×0.5)) = max(2, floor(2.5)) = max(2,2) = **2 séries × 3-5**, rest 180 s
- isolation strength `{sets:3, 5-8, rest 120}` → `max(2, floor(3×0.5)) = max(2, floor(1.5)) = max(2,1) = **2 séries × 5-8**, rest 120 s
- warmup : `isVeryShort` → **1 × 10** (l. 1018)
- core : **supprimé** (l. 1031)

**Total réel par séance : 3 slots + 1 warmup + 0 core = 4 exercices.**

`reorderSlotsByFocus` : `focused.size === 0` → retour identité (l. 692), ordre canonique conservé.
`level='intermediate'` → `pickExercise` renvoie un aléatoire du top-3 (l. 782–783) ; le top-3 est cité, le « retenu » indiqué est `candidates[0]` (issue la plus probable / référence déterministe).
`goal='strength'` + `slot.compound` → tri par `strengthEquipmentPrio` (l. 707–719, appliqué l. 769–772) : barbell(0) > machine/câble(1) > haltère/KB(2) > élastique(3) > BW/pullup(4).

### Tables des exercices

**Push (séance 1, warmupPool[0 % 16])**

| # | Slot muscles | Cat | Top-3 candidats (tri code) | Retenu (réf.) | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | seed-bird-dog | seed-bird-dog · Bird dog | 1×10 |
| 1 | chest / chest_upper / chest_lower | cmp | seed-bench-barbell(bb,8), seed-chest-press-machine(mach,3), seed-bench-dumbbell(db,3) | seed-bench-barbell · Développé couché barre | 2×3-5 (180 s) |
| 2 | shoulders / shoulders_front | cmp | seed-ohp-barbell(bb,3), seed-shoulder-press-machine(mach,3), seed-shoulder-press-dumbbell(db,3) | seed-ohp-barbell · Développé militaire barre | 2×3-5 (180 s) |
| 3 | chest / chest_upper / chest_lower | iso | seed-fly-dumbbell(2), seed-fly-cable(2), seed-pec-deck(2) | seed-fly-dumbbell · Écarté haltères | 2×5-8 (120 s) |
| c | core | — | — (supprimé, l. 1031) | — | — |

**Pull (séance 2, warmupPool[1])**

| # | Slot muscles | Cat | Top-3 candidats | Retenu (réf.) | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | seed-cat-cow | seed-cat-cow · Cat-Cow | 1×10 |
| 1 | back_width / back | cmp | seed-lat-pulldown(cable,3), seed-pullup(pu_bar,3), seed-deadlift(bb,3) | seed-lat-pulldown · Tirage vertical | 2×3-5 (180 s) |
| 2 | back_thickness / back | cmp | seed-row-barbell(bb,7), seed-row-tbar(bb,2), seed-row-cable(cable,2) | seed-row-barbell · Rowing barre | 2×3-5 (180 s) |
| 3 | back_thickness / back_width / back | iso | seed-pullover-dumbbell(3), seed-pullover-cable(2), seed-straight-arm-pulldown(2) | seed-pullover-dumbbell · Pull-over haltère | 2×5-8 (120 s) |
| c | core | — | — (supprimé) | — | — |

**Legs (séance 3, warmupPool[2])**

| # | Slot muscles | Cat | Top-3 candidats | Retenu (réf.) | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | seed-shoulder-circles | seed-shoulder-circles · Cercles d'épaules | 1×10 |
| 1 | quads | cmp | seed-squat-barbell(bb,8), seed-front-squat(bb,2), seed-leg-press(mach,3) | seed-squat-barbell · Squat barre | 2×3-5 (180 s) |
| 2 | hamstrings / glutes | cmp | seed-romanian-deadlift(bb,3), seed-good-morning(bb,1), dumbbell-rdl(db,2) | seed-romanian-deadlift · SDT jambes tendues | 2×3-5 (180 s) |
| 3 | quads | iso | seed-leg-extension(3), bw-wall-sit(2) *(pool = 2)* | seed-leg-extension · Leg extension | 2×5-8 (120 s) |
| c | core | — | — (supprimé) | — | — |

`generatorWarnings` : aucun (pas de force+débutant l. 1066, 3 types publics distincts l. 1083, push ET pull présents l. 1115).

### Assertions [PASS/FAIL]

| # | Assertion | Résultat | Ligne |
|---|---|---|---|
| 1 | `workoutTypeFromFocus([])` → null | ✅ PASS | 402 |
| 2 | Split auto = `['push','pull','legs']` | ✅ PASS | 553 |
| 3 | `adjustedSlotCount(6,20,'strength') = max(2,floor(3)) = 3` (×3 sessions) | ✅ PASS | 633 |
| 4 | **Total par session = 3 + warmup + core = 5 exercices** | ❌ **FAIL — 4 exercices** : le core est supprimé quand `sessionDuration ≤ 20` | 1017, 1031 |
| 5 | Warmup réduit à 1 série à 20 min | ✅ PASS (non prévu par le prompt, mais correct) | 1018 |
| 6 | `adjustedSpec(compound_strength, 20)` = 2 séries × 3-5 | ✅ PASS | 653–654 |
| 7 | `adjustedSpec(isolation_strength, 20)` = 2 séries × 5-8 | ✅ PASS | 654 |
| 8 | Barbell prioritaire sur les composés force | ✅ PASS (bench bb, OHP bb, squat bb, RDL bb) | 707–719 / 769–772 |
| 9 | **Note wizard « 20 min = 2 exercices » cohérente avec 3 slots calculés** | ❌ **FAIL — incohérence confirmée** | ProgramGeneratorScreen l. 310–311 |
| 10 | `autoProgress: true`, `progressStepKg: 2.5` sur les composés barre | ✅ PASS | 789–790 |

### ⚠️ Vérification de la note wizard (demande explicite)

Note affichée uniquement si `goal === 'strength'` (l. 297) :
> « Force : les repos de 3 min entre séries limitent le volume. 20 min = 2 exercices · 45 min = 3 exercices · 60 min = 4 exercices · 90 min = 5 exercices. » (l. 310–311)

Confrontation avec `adjustedSlotCount(base, duration, 'strength')` pour **toutes** les bases existantes :

| durée | note | base=6 (push/pull/legs/lower-quad/lower-hip) | base=7 (chest-tri) | base=8 (upper, upper-push/pull, shoulders-arms, back-bi, glutes-hip, quad-glutes) | base=9 (fullbody, lower_pull, lower_push, chest-back) | verdict |
|---|---|---|---|---|---|---|
| 20 | **2** | 3 | 3 | 4 | 4 | ❌ **jamais exact** — aucun template ne descend à 2 |
| 45 | **3** | 3 | 3 | 4 | 4 | ⚠️ exact seulement pour base ≤ 7 |
| 60 | **4** | 4 | 4 | 4 | 4 | ✅ exact partout |
| 90 | **5** | 5 | 5 | 5 | 5 | ✅ exact partout |

Deux conséquences :
1. **« 20 min = 2 exercices » est faux dans 100 % des cas** — le plancher `max(2, …)` n'est jamais atteint puisque `base ≥ 6` partout (`floor(6×0.5)=3`). Le minimum réel est 3, et 4 pour les templates base 8/9 (fullbody force débutant, upper/lower force, glutes-focus force).
2. **20 min et 45 min appliquent exactement la même formule en force** (`×0.5`, l. 633 et 634–635) : le nombre d'exercices est identique ; seules les **séries** changent (2 vs 3). La note laisse croire à une gradation 2/3/4/5 alors que le code produit 3/3/4/5 (base 6) ou 4/4/4/5 (base 8-9).
3. La note parle d'« exercices » alors que l'écran final affichera slots **+1 warmup** (+1 core au-dessus de 20 min) : à 60 min force l'utilisateur voit 6 lignes pour une note qui en annonce 4.

**Correctif recommandé :** rendre la note dynamique (calculée depuis `adjustedSlotCount` avec la base du split retenu), ou à défaut la corriger en « 20 min = 3 exercices · 45 min = 3-4 · 60 min = 4 · 90 min = 5 (+ échauffement, + gainage au-delà de 20 min) ».

### Coach

- **Équilibre musculaire :** push/pull/legs équilibré sur la semaine (1 poussée horizontale, 1 verticale, 1 tirage vertical, 1 horizontal, squat + charnière de hanche). Mais avec 3 slots seulement : **zéro bras, zéro mollets, zéro deltoïde postérieur, zéro core**. Sur 3 séances/semaine cela reste défendable en force (les bras travaillent en synergie), mais l'absence totale de face pull / deltoïde arrière sur un programme avec 2 pressions lourdes par semaine est un facteur de risque épaule à moyen terme.
- **Cohérence objectif :** 2×3-5 à 180 s de repos = specs de force correctes, mais **2 séries de travail par exercice, soit 4 séries lourdes par séance** = volume infra-minimal. En force, l'effet dose-réponse démarre vers 4-6 séries lourdes par pattern et par semaine ; ici on est à 2 séries/pattern/semaine. Progression réelle attendue : très lente, essentiellement neuromusculaire les 3-4 premières semaines puis plateau.
- **Timing réaliste :** 2 composés × 2 séries = 4 séries à 180 s + 1 isolation × 2 séries à 120 s.
  Travail ≈ 6 × 40 s = 4 min · repos ≈ 3×180 + 2×120 = 13 min · warmup 1 série ≈ 1 min · transitions ≈ 2 min → **≈ 20 min**. Le dimensionnement du code (3 slots) est **juste** ; c'est la note wizard qui sous-estime.
- **Équipement :** FULL exploité correctement, barre systématiquement prioritaire sur les composés (bench barre, OHP barre, squat barre, RDL barre) grâce à `strengthEquipmentPrio`. ⚠️ Réserve : `seed-chest-press-machine` et `seed-shoulder-press-machine` sont classés **au-dessus des haltères** (prio 1 vs 2) : un tirage aléatoire du top-3 peut donner une *presse poitrine machine en 2×3-5*, ce qui n'a aucun sens en force (pas de stabilisation, plafond de charge machine). La priorité machine/câble devrait passer **après** l'haltère pour les slots compound en force.
- **Variété inter-sessions :** 3 types distincts → ✅ variété structurelle complète.
- **Couverture isolation :** ❌ **Lacunes problématiques** — un seul slot isolation par séance (pec, dos, quadriceps). Biceps, triceps, mollets, deltoïdes latéral/postérieur, abdos : absents du programme entier.
- **Verdict global : ⚠️ Problème mineur côté code (le calcul de slots est sain et le timing tient), ❌ problème sérieux côté wizard** (note ℹ️ fausse) + réserve coach sur le volume total, structurellement insuffisant pour progresser en force.

---

## P61 — 20 min + hypertrophy + beginner 3j → fullbody 4 slots

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:20, equipment:FULL, level:'beginner' }
```

### Simulation

**Étape 1 —** `workoutTypeFromFocus([])` → `null` (l. 402).

**Étape 2 —** `selectSplit`, `case 3` : `isMass=true` mais `level==='beginner'` → les deux premiers `if` (l. 553, 555) échouent → retour ligne 557 :
**`['fullbody-quad','fullbody-hip','fullbody-quad']`**.
Noms : canon `fullbody` ×3 → suffixes A/B/C → « Full Body A » · « Full Body B » · « Full Body C » (l. 1039–1041).

**Étape 3 — `adjustedSlotCount`** (duration=20 → l. 633) :
- fullbody-quad : base=9 → `max(2, floor(9×0.5)) = max(2, floor(4.5)) = max(2,4) = **4**`
- fullbody-hip  : base=9 → `max(2, floor(4.5)) = **4**`
- fullbody-quad : **4**

Les 4 premiers slots des deux templates fullbody sont **tous compound** (l. 361–366 et 374–379) → **aucun slot isolation n'est atteint**.

**`adjustedSpec`** (factor 0.5) :
- compound hypertrophy `{4, 8-12, 90 s}` → `max(2, floor(4×0.5)) = max(2,2) = **2 × 8-12**, rest 90 s
- isolation hypertrophy `{3, 10-15, 75 s}` → `max(2, floor(1.5)) = **2 × 10-15**` — *jamais utilisé ici (aucun slot iso)*
- warmup 1×10 (l. 1018) · core supprimé (l. 1031)

**Total réel : 4 slots + 1 warmup = 5 exercices** par séance.

`level='beginner'` → `pickExercise` renvoie **toujours `candidates[0]`** (l. 781) → sélection déterministe.
`usedGlobally` (l. 773–775) départage avant la popularité → la séance C diffère de la séance A.

### Tables des exercices

**Full Body A — fullbody-quad (warmupPool[0])**

| # | Slot muscles | Cat | Exercice retenu (déterministe) | Séries×Reps |
|---|---|---|---|---|
| w | warmup | — | seed-bird-dog · Bird dog | 1×10 |
| 1 | quads / glutes | cmp | seed-squat-barbell · Squat barre (pop 8) | 2×8-12 (90 s) |
| 2 | chest / chest_upper | cmp | seed-bench-barbell · Développé couché barre (pop 8) | 2×8-12 |
| 3 | back_width / back_thickness / back | cmp | seed-lat-pulldown · Tirage vertical (pop 3, fichier < pullup) | 2×8-12 |
| 4 | shoulders / shoulders_front | cmp | seed-shoulder-press-dumbbell · Développé épaules haltères (pop 3, 1er du fichier) | 2×8-12 |
| c | core | — | — (supprimé, l. 1031) | — |

**Full Body B — fullbody-hip (warmupPool[1])**

| # | Slot muscles | Cat | Exercice retenu | Séries×Reps |
|---|---|---|---|---|
| w | warmup | — | seed-cat-cow · Cat-Cow | 1×10 |
| 1 | hamstrings / glutes | cmp | seed-romanian-deadlift · SDT jambes tendues | 2×8-12 |
| 2 | chest / chest_upper | cmp | seed-bench-dumbbell · Développé couché haltères *(bench barre pénalisé par `usedGlobally`)* | 2×8-12 |
| 3 | back_width / back | cmp | seed-pullup · Tractions *(lat pulldown déjà utilisé)* | 2×8-12 |
| 4 | shoulders / shoulders_front | cmp | seed-ohp-barbell · Développé militaire barre | 2×8-12 |
| c | core | — | — | — |

**Full Body C — fullbody-quad (warmupPool[2])**

| # | Slot muscles | Cat | Exercice retenu | Séries×Reps |
|---|---|---|---|---|
| w | warmup | — | seed-shoulder-circles · Cercles d'épaules | 1×10 |
| 1 | quads / glutes | cmp | seed-leg-press · Presse à cuisses *(squat déjà utilisé)* | 2×8-12 |
| 2 | chest / chest_upper | cmp | seed-chest-press-machine · Presse poitrine | 2×8-12 |
| 3 | back_width / back_thickness / back | cmp | seed-lat-pulldown · Tirage vertical *(les 2 candidats back_width sont utilisés → départage par popularité/ordre fichier)* | 2×8-12 |
| 4 | shoulders / shoulders_front | cmp | seed-shoulder-press-machine · Développé épaules machine | 2×8-12 |

`generatorWarnings` : aucun (débutant mais `daysPerWeek=3 < 5`, l. 1074 ; split non unilatéral ; pull présent).

### Assertions [PASS/FAIL]

| # | Assertion | Résultat | Ligne |
|---|---|---|---|
| 1 | Split = `['fullbody-quad','fullbody-hip','fullbody-quad']` (débutant, isMass ignoré) | ✅ PASS | 557 |
| 2 | `adjustedSlotCount(9,20,'hypertrophy') = max(2,floor(4.5)) = 4` | ✅ PASS | 633 |
| 3 | **Total = 4 + warmup + core = 6 exercices** | ❌ **FAIL — 5 exercices** (core supprimé à 20 min) | 1031 |
| 4 | `adjustedSpec(compound_hyp, 20)` = 2 séries × 8-12 | ✅ PASS | 653–654 |
| 5 | Warmup à 1 série | ✅ PASS | 1018 |
| 6 | Beginner → `candidates[0]` déterministe | ✅ PASS | 781 |
| 7 | Rotation d'exercices A→C via `usedGlobally` | ✅ PASS | 773–775 |
| 8 | Assertion transverse SLOT-FORCE20 (`max(2, floor(base×0.5))`) vérifiée aussi hors force | ✅ PASS (formule commune à tous les goals à 20 min) | 633 |
| 9 | Note wizard durée | n/a — non affichée (`goal !== 'strength'`) | ProgramGeneratorScreen l. 297 |

### Coach

- **Équilibre musculaire :** excellent pour un format 20 min — les 4 patterns fondamentaux (squat/charnière, poussée horizontale, tirage vertical, poussée verticale) sont couverts chaque séance. Sur la semaine : 2 séances quad-dominantes + 1 hip-dominante, 3 poussées horizontales, 3 tirages verticaux, 3 pressions verticales. ⚠️ **Aucun tirage horizontal** : le slot dos de `fullbody-quad` cible `back_width` en priorité (`slot.muscles[0]`, tri l. 763–767) et celui de `fullbody-hip` est explicitement `back_width` → le rowing n'apparaît **jamais** dans le programme complet. Déséquilibre scapulaire réel (lat dominant, rhomboïdes/trapèzes moyens jamais chargés) — d'autant que le slot `shoulders_rear` (position 6) est coupé par la durée.
- **Cohérence objectif :** 2×8-12 = specs d'hypertrophie correctes en reps, mais **2 séries par exercice**. Volume hebdo par groupe : pec 6 séries, dos 6, épaules 6, quads 4, ischios 2. Le seuil communément retenu pour l'hypertrophie est ~10 séries/muscle/semaine ; chez un **débutant**, 6 séries suffisent à déclencher des adaptations les 8 premières semaines — c'est donc **acceptable pour ce profil précis**, mais ce sera un plancher dès la semaine 8-10. Les ischios (2 séries/sem.) et les mollets/bras/abdos (0) sont clairement sacrifiés.
- **Timing réaliste :** 4 exercices × 2 séries = 8 séries, cycle ≈ 45 s travail + 90 s repos = 135 s → 18 min, − 1 repos final ≈ 16,5 min, + warmup 1 min + 3 transitions ≈ 2 min → **≈ 19-20 min. Parfaitement calibré.**
- **Équipement :** FULL exploité, mouvements canoniques (squat barre, bench barre) en séance A — idéal pour un débutant. Réserve : la séance C bascule sur **presse à cuisses + presse poitrine machine + développé épaules machine** à cause de la pénalité `usedGlobally` — une séance « tout machine » pour un débutant qui devrait au contraire répéter les patterns libres pour les automatiser. La variation forcée dessert l'apprentissage moteur à ce niveau.
- **Variété inter-sessions :** A et C = **mêmes slots, même ordre** → ⚠️ **variété d'exercices seulement** (structure identique). B est réellement différenciée (charnière de hanche en ouverture).
- **Couverture isolation :** ❌ **aucune isolation dans tout le programme** (les slots 5-9 sont coupés) + core supprimé. Pour un débutant hypertrophie à 20 min, les lacunes bras/mollets/abdos sont acceptables ; l'absence de **deltoïde postérieur** (slot 6 de fullbody-quad) l'est moins compte tenu des 3 pressions/semaine.
- **Verdict global : ⚠️ Problème mineur** — dimensionnement et timing exacts, mais (a) totaux du prompt d'audit faux (core supprimé), (b) aucun tirage horizontal sur l'ensemble du programme, (c) dérive « tout machine » en séance C.

---

## P62 — 45 min + strength + intermediate 3j → barème réduit

```
{ goal:'strength', daysPerWeek:3, sessionDuration:45, equipment:BB+DB, level:'intermediate' }
```

### Simulation

**Étape 1 —** `workoutTypeFromFocus([])` → `null` (l. 402).

**Étape 2 —** `selectSplit`, `case 3` : isMass=true, `level='intermediate'` → **`['push','pull','legs']`** (l. 553).
Noms sans suffixe : « Push — Poussée » · « Pull — Tirage » · « Legs — Jambes ».

**Étape 3 — `adjustedSlotCount`** (duration=45, `isStrength=true` → branche l. 634–635) :
- push : base=6 → `max(2, floor(6×0.5)) = max(2, floor(3)) = max(2,3) = **3**`
- pull : base=6 → **3**
- legs : base=6 → **3**

**`adjustedSpec`** (duration=45 → `factor = 0.75`, l. 653) :
- compound strength → `max(2, floor(5×0.75)) = max(2, floor(3.75)) = max(2,3) = **3 séries × 3-5**, rest 180 s
- isolation strength → `max(2, floor(3×0.75)) = max(2, floor(2.25)) = max(2,2) = **2 séries × 5-8**, rest 120 s
- `isVeryShort = false` → warmup **2×10**, core **3×15** (rest 60 s)

**Total réel : 3 slots + warmup + core = 5 exercices.**

Équipement BB+DB → `available` = barbell + dumbbell uniquement.
- warmupPool (l. 948–951, `allowed || bodyweight`) : 16 entrées (band exclu) → séances 0/1/2 → bird-dog / cat-cow / cercles d'épaules.
- corePool (l. 952–955) : 11 entrées (cable-crunch, hanging-leg-raise, turkish get-up exclus) → séances 0/1/2 → **seed-scissors / seed-crunch / seed-bicycle-crunch**.

### Tables des exercices

**Push (séance 1)**

| # | Slot muscles | Cat | Top-3 candidats (BB+DB, tri force) | Retenu (réf.) | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | — | seed-bird-dog · Bird dog | 2×10 |
| 1 | chest / chest_upper / chest_lower | cmp | seed-bench-barbell(bb,8), seed-bench-dumbbell(db,3), seed-incline-bench-barbell(bb,4) | seed-bench-barbell · Développé couché barre | 3×3-5 (180 s) |
| 2 | shoulders / shoulders_front | cmp | seed-ohp-barbell(bb,3), seed-shoulder-press-dumbbell(db,3), seed-arnold-press(db,2) | seed-ohp-barbell · Développé militaire barre | 3×3-5 |
| 3 | chest (iso) | iso | **1 seul candidat** : seed-fly-dumbbell(2) | seed-fly-dumbbell · Écarté haltères | 2×5-8 (120 s) |
| c | core | — | — | seed-scissors · Ciseaux abdominaux | 3×15 |

**Pull (séance 2)**

| # | Slot muscles | Cat | Top-3 candidats | Retenu (réf.) | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | — | seed-cat-cow · Cat-Cow | 2×10 |
| 1 | back_width / back | cmp | **1 seul candidat** : seed-deadlift(bb,3) — aucun tirage vertical en BB+DB (lat pulldown=câble, traction=barre fixe) | seed-deadlift · Soulevé de terre | 3×3-5 (180 s) |
| 2 | back_thickness / back | cmp | seed-row-barbell(bb,7), seed-row-tbar(bb,2), seed-row-dumbbell(db,3) | seed-row-barbell · Rowing barre | 3×3-5 |
| 3 | back_thickness / back_width / back | iso | seed-pullover-dumbbell(3), seed-shrug(2), seed-pullover(1) | seed-pullover-dumbbell · Pull-over haltère | 2×5-8 |
| c | core | — | — | seed-crunch · Crunch | 3×15 |

**Legs (séance 3)**

| # | Slot muscles | Cat | Top-3 candidats | Retenu (réf.) | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | — | seed-shoulder-circles · Cercles d'épaules | 2×10 |
| 1 | quads | cmp | seed-squat-barbell(bb,8), seed-front-squat(bb,2), seed-lunges(db,2) | seed-squat-barbell · Squat barre | 3×3-5 (180 s) |
| 2 | hamstrings / glutes | cmp | seed-romanian-deadlift(bb,3), seed-good-morning(bb,1), dumbbell-rdl(db,2) | seed-romanian-deadlift · SDT jambes tendues | 3×3-5 |
| 3 | quads | iso | ⚠️ **aucune isolation quads en BB+DB** → repli compound (l. 748–751) : seed-lunges(2), seed-front-squat(2), seed-bulgarian-split-squat(2) | seed-lunges · Fentes | **2×5-8** (spec isolation appliquée à un composé) |
| c | core | — | — | seed-bicycle-crunch · Crunch bicyclette | 3×15 |

`generatorWarnings` : aucun.

### Assertions [PASS/FAIL]

| # | Assertion | Résultat | Ligne |
|---|---|---|---|
| 1 | Split = `['push','pull','legs']` | ✅ PASS | 553 |
| 2 | `adjustedSlotCount(6,45,'strength') = max(2,floor(3)) = 3` | ✅ PASS | 634–635 |
| 3 | `adjustedSpec(compound_strength,45)` = 3 séries × 3-5 | ✅ PASS | 653–654 |
| 4 | `adjustedSpec(isolation_strength,45)` = 2 séries × 5-8 | ✅ PASS | 654 |
| 5 | Total = 3 + warmup + core = 5 exercices | ✅ PASS (45 > 20 → core conservé) | 1017, 1031 |
| 6 | Note wizard « 45 min = 3 exercices » cohérente **pour base=6** | ✅ PASS partiel | Screen l. 311 |
| 7 | Note wizard « 45 min = 3 exercices » **universellement exacte** | ❌ **FAIL** — base 8/9 (upper/lower, fullbody, glutes-focus) donne `floor(8×0.5)=4` / `floor(9×0.5)=4` | 634–635 vs Screen l. 311 |
| 8 | 20 min et 45 min produisent le **même** nombre de slots en force | ✅ PASS (constat) — formules identiques `×0.5` | 633 vs 634–635 |
| 9 | Barbell prioritaire sur tous les composés | ✅ PASS | 707–719 |
| 10 | Slot `back_width` couvert en BB+DB | ❌ **FAIL fonctionnel** — aucun candidat `back_width` compound ; repli sur `seed-deadlift` (via `back`). Pas de warning émis car le slot est rempli. | 738–746 |

### Coach

- **Équilibre musculaire :** correct sur les patterns lourds (bench, OHP, deadlift, row, squat, RDL = les 6 mouvements de base). ⚠️ **Aucun tirage vertical de la semaine** : en BB+DB le slot `back_width` tombe sur le soulevé de terre, si bien que la séance Pull enchaîne **deadlift + rowing barre** — deux charnières de hanche lourdes en 3×3-5 le même jour, alors que la séance Legs remet **squat + RDL** 48 h plus tard. Charge lombaire cumulée très élevée : c'est le vrai défaut de ce profil.
- **Cohérence objectif :** 3×3-5 à 180 s = force pure, cohérent. 3 séries lourdes par pattern et par semaine : c'est le minimum syndical mais **fonctionnel** pour un intermédiaire (proche d'un 5×5 allégé). Bien meilleur que P60.
- **Timing réaliste :** 2 composés × 3 séries = 6 séries à 180 s (≈ 6×45 s travail + 5×180 s repos ≈ 19,5 min) + 1 isolation × 2 séries (≈ 3,5 min) + warmup 2 séries (≈ 2 min) + core 3×15 (≈ 4 min) + 4 transitions (≈ 4 min) → **≈ 33 min pour un créneau de 45 min**. Le barème force à 45 min est **trop conservateur** : il resterait la place pour un 4ᵉ slot (~+8 min) ou une 4ᵉ série sur les composés. C'est le pendant du problème de P60 : à 20 min le code est juste et la note fausse ; à 45 min le code sous-remplit le créneau.
- **Équipement :** BB+DB bien exploité (barre partout sur les composés). Deux limites du seed plus que du générateur : une seule isolation pectorale disponible (écarté haltères) et **zéro isolation quadriceps** → le slot 3 de Legs se remplit avec des **fentes en 2×5-8** (spec isolation collée sur un exercice composé, l. 991 `slot.compound ? COMPOUND : ISOLATION`). Fentes lourdes en 5-8 reps après squat + RDL : discutable mais pas absurde.
- **Variété inter-sessions :** ✅ 3 types distincts, variété structurelle.
- **Couverture isolation :** ⚠️ **lacunes acceptables** — 1 isolation par séance (pec / dos / quads « fentes »). Bras, mollets, deltoïdes latéral et postérieur absents ; acceptable en force pure sur un créneau de 45 min, mais l'absence de travail deltoïde postérieur reste une réserve posturale.
- **Verdict global : ⚠️ Problème mineur** — code conforme à sa spec, mais (a) note wizard inexacte pour les templates base ≥ 8, (b) créneau 45 min sous-exploité (~12 min inutilisées), (c) enchaînement deadlift + rowing lourd le même jour en BB+DB.

---

## P63 — 90 min + hypertrophy + intermediate 4j → cap 8 slots

```
{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:90, equipment:FULL, level:'intermediate' }
```

### Simulation

**Étape 1 —** `workoutTypeFromFocus([])` → `null` (l. 402).

**Étape 2 —** `selectSplit`, `case 4` : `isMass=true` → **`['upper-push','lower-quad','upper-pull','lower-hip']`** (l. 561, condition `if (isMass)` sans test de niveau).
Noms : canon `upper` ×2 et `lower` ×2 → suffixes → « Upper — Haut du corps **A** » · « Lower — Bas du corps **A** » · « Upper — Haut du corps **B** » · « Lower — Bas du corps **B** » (l. 1039–1041).

**Étape 3 — `adjustedSlotCount`** (duration=90, non-force → l. 643 `min(base+2, 8)`) :
- upper-push : base=8 → `min(8+2, 8) = min(10,8) = **8**` → `slice(0,8)` sur 8 slots → **8 slots effectifs**
- lower-quad : base=6 → `min(6+2, 8) = **8**` → `slice(0,8)` sur un tableau de **6** → **6 slots effectifs** (l. 985, `slice` borne naturellement)
- upper-pull : base=8 → **8** → 8 slots effectifs
- lower-hip  : base=6 → **8** → **6 slots effectifs**

**`adjustedSpec`** : duration=90 → **retour inchangé** (l. 652) :
- compound hypertrophy = **4 × 8-12**, rest 90 s
- isolation hypertrophy = **3 × 10-15**, rest 75 s
- warmup 2×10 · core 3×15 (`isVeryShort=false`)

**Totaux :** Upper A = 8 + 2 = **10 exercices** · Lower A = 6 + 2 = **8** · Upper B = **10** · Lower B = **8**.

`level='intermediate'` → aléatoire dans le top-3 (l. 782–783) ; le « retenu » cité est `candidates[0]`, et les sessions C/D sont simulées avec cette hypothèse (l'effet `usedGlobally` est réel quel que soit le tirage).
warmupPool FULL séances 0-3 → bird-dog / cat-cow / cercles d'épaules / dead-bug.
corePool FULL séances 0-3 → seed-scissors / seed-crunch / seed-cable-crunch / seed-bicycle-crunch.

### Tables des exercices

**Upper A — upper-push (8 slots)**

| # | Slot muscles | Cat | Top-3 candidats | Retenu (réf.) | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | — | seed-bird-dog | 2×10 |
| 1 | chest / chest_upper | cmp | bench-barbell(8), bench-dumbbell(3), chest-press-machine(3) | seed-bench-barbell | 4×8-12 (90 s) |
| 2 | back_width / back_thickness / back | cmp | lat-pulldown(3), pullup(3), row-barbell(7)* | seed-lat-pulldown | 4×8-12 |
| 3 | shoulders / shoulders_front | cmp | shoulder-press-dumbbell(3), ohp-barbell(3), shoulder-press-machine(3) | seed-shoulder-press-dumbbell | 4×8-12 |
| 4 | chest / chest_lower / chest_upper | iso | fly-dumbbell(2), fly-cable(2), pec-deck(2) | seed-fly-dumbbell | 3×10-15 (75 s) |
| 5 | triceps | iso | triceps-rope(3), triceps-pushdown(3), skullcrusher(2) | seed-triceps-rope | 3×10-15 |
| 6 | shoulders_lateral | iso | lateral-raise(3), lateral-raise-cable(2) *(pool=2)* | seed-lateral-raise | 3×10-15 |
| 7 | biceps | iso | curl-barbell(3), curl-dumbbell(3), curl-hammer(3) | seed-curl-barbell | 3×10-15 |
| 8 | back_thickness / back | iso | pullover-dumbbell(3), pullover-cable(2), straight-arm-pulldown(2) | seed-pullover-dumbbell | 3×10-15 |
| c | core | — | — | seed-scissors | 3×15 |

\* `row-barbell` (pop 7) passe **derrière** lat-pulldown/pullup (pop 3) car `slot.muscles[0]='back_width'` prime sur la popularité (tri l. 763–767).

**Lower A — lower-quad (6 slots — les 2 slots « bonus » du barème 90 min sont perdus)**

| # | Slot muscles | Cat | Top-3 candidats | Retenu (réf.) | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | — | seed-cat-cow | 2×10 |
| 1 | quads / glutes | cmp | squat-barbell(8), leg-press(3), bw-squat(3) | seed-squat-barbell | 4×8-12 |
| 2 | hamstrings / glutes | cmp | romanian-deadlift(3), bw-nordic-curl(2), dumbbell-rdl(2) | seed-romanian-deadlift | 4×8-12 |
| 3 | quads | iso | leg-extension(3), bw-wall-sit(2) *(pool=2)* | seed-leg-extension | 3×10-15 |
| 4 | hamstrings | iso | leg-curl-lying(3), leg-curl-seated(2), leg-curl-standing(2) | seed-leg-curl-lying | 3×10-15 |
| 5 | glutes | iso | glute-bridge(3), donkey-kick(2), fire-hydrant(2) | seed-glute-bridge | 3×10-15 |
| 6 | calves | iso | calf-raise-seated(2), calf-raise-standing(2), bw-calf-raise(2) | seed-calf-raise-seated | 3×10-15 |
| c | core | — | — | seed-crunch | 3×15 |

**Upper B — upper-pull (8 slots)**

| # | Slot muscles | Cat | Top-3 candidats (après pénalité `usedGlobally`) | Retenu (réf.) | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | — | seed-shoulder-circles | 2×10 |
| 1 | back_width / back | cmp | pullup(3, inutilisé), lat-pulldown(3, utilisé), deadlift(3) | seed-pullup | 4×8-12 |
| 2 | back_thickness / back | cmp | row-barbell(7), row-dumbbell(3), row-tbar(2) | seed-row-barbell | 4×8-12 |
| 3 | chest / chest_upper | cmp | bench-dumbbell(3), chest-press-machine(3), pushup(2) | seed-bench-dumbbell | 4×8-12 |
| 4 | shoulders_rear | iso | face-pull(2), rear-delt-fly(2) *(pool=2)* | seed-face-pull | 3×10-15 |
| 5 | biceps | iso | curl-dumbbell(3), curl-hammer(3), curl-incline(2) | seed-curl-dumbbell | 3×10-15 |
| 6 | back_thickness / back | iso | pullover-cable(2), straight-arm-pulldown(2), pullover-dumbbell(3, utilisé) | seed-pullover-cable | 3×10-15 |
| 7 | triceps | iso | triceps-pushdown(3), skullcrusher(2), triceps-overhead(2) | seed-triceps-pushdown | 3×10-15 |
| 8 | shoulders_lateral | iso | lateral-raise-cable(2), lateral-raise(3, utilisé) *(pool=2)* | seed-lateral-raise-cable | 3×10-15 |
| c | core | — | — | seed-cable-crunch | 3×15 |

**Lower B — lower-hip (6 slots)**

| # | Slot muscles | Cat | Top-3 candidats | Retenu (réf.) | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | — | seed-dead-bug | 2×10 |
| 1 | glutes / hamstrings | cmp | hip-thrust(4), hip-thrust-bw(3), hip-thrust-machine(3) | seed-hip-thrust | 4×8-12 |
| 2 | quads / glutes | cmp | leg-press(3), bw-squat(3), lunges(2) *(squat barre pénalisé)* | seed-leg-press | 4×8-12 |
| 3 | glutes | iso | donkey-kick(2), fire-hydrant(2), hip-abduction(2) | seed-donkey-kick | 3×10-15 |
| 4 | hamstrings | iso | leg-curl-seated(2), leg-curl-standing(2), leg-curl-lying(3, utilisé) | seed-leg-curl-seated | 3×10-15 |
| 5 | quads | iso | bw-wall-sit(2), leg-extension(3, utilisé) *(pool=2)* | bw-wall-sit | 3×10-15 |
| 6 | calves | iso | calf-raise-standing(2), bw-calf-raise(2), calf-raise-db(2) | seed-calf-raise-standing | 3×10-15 |
| c | core | — | — | seed-bicycle-crunch | 3×15 |

`generatorWarnings` : aucun.

### Assertions [PASS/FAIL]

| # | Assertion | Résultat | Ligne |
|---|---|---|---|
| 1 | Split = `['upper-push','lower-quad','upper-pull','lower-hip']` | ✅ PASS | 561 |
| 2 | `adjustedSlotCount(8,90,'hypertrophy') = min(10,8) = 8` | ✅ PASS | 643 |
| 3 | `adjustedSlotCount(6,90,'hypertrophy') = min(8,8) = 8` mais effectif = 6 | ✅ PASS | 643 + 985 |
| 4 | `slice(0, adjusted)` borne sans erreur quand `adjusted > slots.length` | ✅ PASS (sémantique de `Array.slice`) | 985 |
| 5 | Total upper-push = 8 + warmup + core = 10 exercices | ✅ PASS | 1021–1035 |
| 6 | Total lower-quad = 6 + warmup + core = 8 exercices | ✅ PASS | — |
| 7 | `adjustedSpec(·, 90)` inchangé (4×8-12 / 3×10-15) | ✅ PASS | 652 |
| 8 | Noms Upper A/B et Lower A/B (suffixe par type **public**) | ✅ PASS | 1039–1041 + 117–127 |
| 9 | Note wizard durée | n/a — non affichée (`goal !== 'strength'`) | Screen l. 297 |
| 10 | **90 min apporte plus de contenu que 60 min sur les séances Lower** | ❌ **FAIL** — `adjustedSlotCount(6,60,'hypertrophy') = base = 6` et `(6,90) = 6` effectifs, `adjustedSpec` identique à 60 et 90 → **séances Lower strictement identiques en 60 et 90 min** | 639 vs 643, 652 |

### Coach

- **Équilibre musculaire :** ✅ excellent. Fréquence 2×/semaine par groupe (upper A/B, lower A/B), alternance bench-first / traction-first en haut, squat-dominant / hip-dominant en bas. Ratio push/pull sur la semaine : 4 slots poussée (bench, OHP, fly, bench DB) vs 5 slots tirage (lat pulldown, pullup, row, 2 isolations dos) + face pull → ratio favorable au tirage, idéal pour la santé d'épaule. Mollets, fessiers, ischios, bras, deltoïdes latéraux et postérieurs : tous couverts.
- **Cohérence objectif :** 4×8-12 (composés) / 3×10-15 (isolations) = specs d'hypertrophie canoniques. Volume hebdo : pec ≈ 11 séries, dos ≈ 20, quads ≈ 10, ischios ≈ 10, fessiers ≈ 10, biceps 6, triceps 6, deltoïdes 4+6. **Volume dos très élevé (~20 séries)** par rapport au pec (~11) — c'est un choix défendable (posture) mais l'écart est important pour un intermédiaire.
- **Timing réaliste :** Upper A = 3 composés × 4 + 5 isolations × 3 = **27 séries de travail**.
  Cycle composé ≈ 45 s + 90 s = 135 s → 12 séries ≈ 27 min. Cycle isolation ≈ 40 s + 75 s = 115 s → 15 séries ≈ 29 min. + warmup 2 séries ≈ 2 min + core 3×15 ≈ 4 min + 9 transitions/installations ≈ 9-12 min → **≈ 72-75 min pour un créneau de 90 min : ça tient** (l'estimation « 96 min » du prompt d'audit surestime, elle compte 4 min/série ce qui correspond au barème force, pas à un repos de 90 s).
  Lower A = 2 composés × 4 + 4 isolations × 3 = 20 séries → ≈ 18 + 23 + 6 + 7 = **≈ 54 min**. → **~36 min de créneau inutilisées les jours Lower.**
- **⚠️ Anomalie structurelle majeure du profil :** le barème 90 min (`min(base+2, 8)`) n'a d'effet que sur les templates de base 6 ou 7 **dont le tableau `SLOTS` contient plus d'entrées** — or `lower-quad` et `lower-hip` n'ont **que 6 entrées**. Le bonus « +2 » est donc structurellement inatteignable : passer de 60 à 90 min ne change **rien** aux séances Lower (mêmes 6 slots, mêmes séries — `adjustedSpec` est identité à 60 et 90). L'utilisateur paie 30 min de plus pour un contenu identique. Même constat pour tout template base 6 en non-force (`push`, `pull`, `legs`). **Correctif : allonger les tableaux `SLOTS['lower-quad']`/`['lower-hip']`/`['push']`/`['pull']`/`['legs']` à 8 entrées, ou augmenter les séries à 90 min (ex. `+1 série` sur les composés).**
- **Équipement :** FULL bien exploité, mix barre/haltère/poulie/machine cohérent en hypertrophie (contrairement à la force, aucune priorité d'équipement n'est appliquée ici — c'est correct pour ce goal).
- **Variété inter-sessions :** ✅ **variété structurelle réelle** — upper-push et upper-pull ont des slots et un ordre différents ; lower-quad et lower-hip aussi. La pénalité `usedGlobally` évite en plus la répétition d'exercices entre A et B.
- **Couverture isolation :** ✅ **complète** — chaque groupe (pec, dos, deltoïde latéral, deltoïde postérieur, biceps, triceps, quads, ischios, fessiers, mollets, abdos) dispose d'au moins un slot isolation sur la semaine. Seuls les avant-bras n'ont pas de slot dédié : lacune acceptable.
- **Verdict global : ✅ Bon programme**, avec **⚠️ une réserve produit sérieuse** : le créneau 90 min n'est honoré que sur les séances Upper ; les séances Lower sont identiques à leur version 60 min.

---

## P64 — 20 min + glutes-focus explicite + beginner + fat_loss

```
{ goal:'fat_loss', daysPerWeek:3, sessionDuration:20, equipment:FULL, level:'beginner',
  splitPreference:'glutes-focus' }
```

### Simulation

**Étape 1 —** split explicite → l'étape Muscles du wizard est sautée, `focusMuscles = []` → `workoutTypeFromFocus([])` → `null` (l. 402). *Note : avec `pref='glutes-focus'`, `selectSplit` retourne avant même d'appeler `workoutTypeFromFocus` (l. 487 vs l. 500) — le focus est donc doublement inopérant.*

**Étape 2 —** `selectSplit`, `pref='glutes-focus'`, `case 3` → **`['glutes-hip','quad-glutes','glutes-hip']`** (l. 492).
`toPublicType` : `glutes-hip` et `quad-glutes` → **`'lower'`** (l. 125) → canon unique compté 3 fois → suffixes A/B/C :
« Glutes & Hip — Fessiers & Ischio **A** » · « Quad & Glutes — Jambes & Fessiers **B** » · « Glutes & Hip — Fessiers & Ischio **C** » (l. 1039–1041).

**Étape 3 — `adjustedSlotCount`** (duration=20 → l. 633) :
- glutes-hip  : base=8 → `max(2, floor(8×0.5)) = max(2, floor(4)) = max(2,4) = **4**`
- quad-glutes : base=8 → `max(2, floor(4)) = **4**`
- glutes-hip  : **4**

**`adjustedSpec`** (factor 0.5) :
- compound fat_loss `{3, 12-15, 60 s}` → `max(2, floor(3×0.5)) = max(2, floor(1.5)) = max(2,1) = **2 × 12-15**, rest 60 s
- isolation fat_loss `{3, 12-15, 60 s}` → `max(2, floor(1.5)) = **2 × 12-15**, rest 60 s
- warmup **1×10** (l. 1018) · core **supprimé** (l. 1031)

**Total réel : 4 slots + 1 warmup = 5 exercices** par séance.

Découpe des slots : `glutes-hip` positions 1-4 = **4 composés** (glutes/ham, ham/glutes, quads/glutes, back_width) ; `quad-glutes` positions 1-4 = 3 composés + 1 isolation quads.
`level='beginner'` → `candidates[0]` déterministe (l. 781).

### Tables des exercices

**Glutes & Hip A — glutes-hip (warmupPool[0])**

| # | Slot muscles | Cat | Exercice retenu (déterministe) | Séries×Reps |
|---|---|---|---|---|
| w | warmup | — | seed-bird-dog · Bird dog | 1×10 |
| 1 | glutes / hamstrings | cmp | seed-hip-thrust · Hip thrust (barre, pop 4) | 2×12-15 (60 s) |
| 2 | hamstrings / glutes | cmp | seed-romanian-deadlift · SDT jambes tendues | 2×12-15 |
| 3 | quads / glutes | cmp | seed-squat-barbell · Squat barre | 2×12-15 |
| 4 | back_width / back | cmp | seed-lat-pulldown · Tirage vertical | 2×12-15 |
| c | core | — | — (supprimé, l. 1031) | — |

**Quad & Glutes B — quad-glutes (warmupPool[1])**

| # | Slot muscles | Cat | Exercice retenu | Séries×Reps |
|---|---|---|---|---|
| w | warmup | — | seed-cat-cow · Cat-Cow | 1×10 |
| 1 | quads / glutes | cmp | seed-leg-press · Presse à cuisses *(squat pénalisé par `usedGlobally`)* | 2×12-15 |
| 2 | glutes / hamstrings | cmp | seed-hip-thrust-bw · Hip thrust poids du corps | 2×12-15 |
| 3 | back_thickness / back | cmp | seed-row-barbell · Rowing barre | 2×12-15 |
| 4 | quads | iso | seed-leg-extension · Leg extension | 2×12-15 |
| c | core | — | — | — |

**Glutes & Hip C — glutes-hip (warmupPool[2])**

| # | Slot muscles | Cat | Exercice retenu | Séries×Reps |
|---|---|---|---|---|
| w | warmup | — | seed-shoulder-circles · Cercles d'épaules | 1×10 |
| 1 | glutes / hamstrings | cmp | seed-hip-thrust-machine · Hip thrust machine *(hip-thrust et hip-thrust-bw utilisés)* | 2×12-15 |
| 2 | hamstrings / glutes | cmp | ⚠️ **bw-nordic-curl · Nordic curl** *(RDL utilisé ; nordic pop 2 passe devant dumbbell-rdl par ordre fichier)* | 2×12-15 |
| 3 | quads / glutes | cmp | bw-squat · Squat poids du corps | 2×12-15 |
| 4 | back_width / back | cmp | ⚠️ **seed-pullup · Tractions** *(lat pulldown utilisé)* | 2×12-15 |
| c | core | — | — | — |

`generatorWarnings` (l. 1082–1091) : `publicTypes = {'lower'}` (taille 1) → **1 warning émis** :
> « Programme de spécialisation : toutes les séances ciblent le même groupe. Convient pour un bloc court (4–6 semaines) mais ne constitue pas un programme complet. »
(Pas de warning push/pull : `hasPushSession=false` → la condition l. 1115 exige `hasPushSession && !hasPullSession`.)

### Assertions [PASS/FAIL]

| # | Assertion | Résultat | Ligne |
|---|---|---|---|
| 1 | Split = `['glutes-hip','quad-glutes','glutes-hip']` | ✅ PASS | 492 |
| 2 | `adjustedSlotCount(8,20,'fat_loss') = max(2,floor(4)) = 4` (glutes-hip **et** quad-glutes) | ✅ PASS | 633 |
| 3 | **Total = 4 + warmup + core = 6 exercices** | ❌ **FAIL — 5 exercices** (core supprimé à 20 min) | 1031 |
| 4 | `adjustedSpec(compound_fat_loss,20)` = 2 séries × 12-15 | ✅ PASS | 653–654 |
| 5 | `adjustedSpec(isolation_fat_loss,20)` = 2 séries × 12-15 | ✅ PASS | 654 |
| 6 | Assertion GLUTES-SLOTS : zéro slot push (pec / OHP / triceps) | ✅ PASS | 331–355 |
| 7 | Nommage A/B/C sur le canon `'lower'` commun aux deux templates | ✅ PASS | 125 + 1039–1041 |
| 8 | Warning « Programme de spécialisation » émis | ✅ PASS | 1083–1091 |
| 9 | Note wizard durée | n/a — non affichée (`goal !== 'strength'`) | Screen l. 297 |
| 10 | Slot `back_width` rempli avec FULL (`seed-pullup` disponible) | ✅ PASS (lat pulldown en A, traction en C) | 738–746 |

### Coach

- **Équilibre musculaire :** conforme à l'intention du template (fessiers/ischios prioritaires, dos en soutien postural, zéro poussée). Sur la semaine : fessiers touchés dans **7 des 12 slots**, ischios 3, quads 3, dos 2. C'est un programme de spécialisation assumé — le warning l. 1086 le dit. Mais à 20 min, la coupe à 4 slots supprime **toutes les isolations fessiers** de `glutes-hip` (hip abduction, kickback) : le programme devient « 3-4 gros composés » et perd précisément ce qui fait la valeur d'un programme fessiers (le travail d'abduction/extension isolée en fin de séance). Paradoxe : le template le plus orienté isolation est celui qui perd le plus à la troncature.
- **Cohérence objectif fat_loss :** 2×12-15 à 60 s de repos = bon format métabolique. Mais **8 séries de travail par séance, 24/semaine, sans aucun cardio** : le générateur ne place jamais d'exercice `primaryMuscle: 'cardio'` (burpees, corde à sauter, rameur existent pourtant dans le seed) car aucun slot ne cible ce muscle. Pour un objectif fat_loss, c'est la lacune de fond — la dépense énergétique du programme est marginale (~3×20 min/semaine).
- **Timing réaliste :** 4 exercices × 2 séries = 8 séries, cycle ≈ 40 s + 60 s = 100 s → 13 min − dernier repos ≈ 12 min, + warmup 1 min + 3 transitions ≈ 3 min → **≈ 17-18 min. Calibrage correct** (il resterait même la place pour le core supprimé).
- **Équipement :** FULL, cohérent. ⚠️ **Deux choix inadaptés au niveau débutant en séance C**, tous deux causés par la pénalité `usedGlobally` (l. 773–775) : **Nordic curl** (un des exercices les plus durs du répertoire ischios, excentrique lourd — inaccessible à un débutant) et **tractions** en 2×12-15 (une débutante en programme fessiers ne fera pas 12-15 tractions). Le générateur n'a aucun garde-fou de difficulté : `usedGlobally` prime sur la popularité, donc plus il y a de séances du même type, plus les exercices retenus sont exotiques. **Correctif recommandé : pondérer la pénalité `usedGlobally` par la popularité (ex. ne pas déclasser un exercice pop ≥ 3 au profit d'un pop ≤ 2), ou introduire un champ `difficulty` filtré par `level`.**
- **Variété inter-sessions :** A et C = mêmes slots, même ordre → ⚠️ **variété d'exercices seulement**. B est structurellement différente (squat-first + rowing).
- **Couverture isolation :** ❌ **lacunes problématiques pour ce type de programme** — une seule isolation dans toute la semaine (leg extension, séance B). Zéro isolation fessiers, zéro ischios isolés, zéro abdos (core supprimé) — sur un programme dont c'est la raison d'être.
- **Verdict global : ⚠️ Problème mineur côté code** (calculs et timing exacts) **mais ❌ inadéquation produit** : glutes-focus à 20 min perd sa spécificité (0 isolation fessiers) et sert du Nordic curl / des tractions à une débutante. **Recommandation produit : afficher un avertissement quand `splitPreference='glutes-focus'` est combiné à `sessionDuration=20`, ou réordonner les templates féminins pour placer au moins une isolation fessiers dans les 4 premiers slots.**

---

## P65 — 45 min + fullbody explicite + fat_loss + beginner (HOME, 2j)

```
{ goal:'fat_loss', daysPerWeek:2, sessionDuration:45, equipment:HOME, level:'beginner',
  splitPreference:'fullbody' }
```

### Simulation

**Étape 1 —** split explicite → `focusMuscles = []` → `workoutTypeFromFocus([])` → `null` (l. 402) ; de nouveau non atteint, `selectSplit` sort en l. 478–485 avant la logique auto.

**Étape 2 —** `selectSplit`, `pref='fullbody'`, `case 2` → **`['fullbody-quad','fullbody-hip']`** (l. 480).
Noms : canon `fullbody` ×2 → « Full Body **A** » · « Full Body **B** ».

**Étape 3 — `adjustedSlotCount`** (duration=45, `goal='fat_loss'` → branche non-force l. 636) :
- fullbody-quad : base=9 → `max(3, floor(9×0.75)) = max(3, floor(6.75)) = max(3,6) = **6**`
- fullbody-hip  : base=9 → `max(3, floor(6.75)) = **6**`

**`adjustedSpec`** (duration=45 → `factor = 0.75`) :
- compound fat_loss `{3, 12-15, 60 s}` → `max(2, floor(3×0.75)) = max(2, floor(2.25)) = max(2,2) = **2 × 12-15**, rest 60 s
- isolation fat_loss `{3, 12-15, 60 s}` → `max(2, floor(2.25)) = **2 × 12-15**, rest 60 s
- `isVeryShort=false` → warmup **2×10**, core **3×15**

**Total réel : 6 slots + warmup + core = 8 exercices** par séance.

Slots retenus (6 premiers) :
- `fullbody-quad` : quads/glutes cmp · chest cmp · back cmp · OHP cmp · **hamstrings iso** · **shoulders_rear iso** (biceps, mollets, triceps coupés)
- `fullbody-hip` : ham/glutes cmp · chest cmp · back_width cmp · OHP cmp · **quads iso** · **shoulders_lat/rear iso**

HOME = `['dumbbell','kettlebell','band','bodyweight']` → ni barre, ni poulie, ni machine, ni barre de traction.
- warmupPool HOME : **18 entrées** (band autorisé) → séance 0 → `seed-band-pull-apart`, séance 1 → `seed-bird-dog`.
- corePool HOME : 12 entrées (cable-crunch et hanging-leg-raise exclus, turkish get-up inclus) → séance 0 → `seed-scissors`, séance 1 → `seed-crunch`.
`level='beginner'` → `candidates[0]` (l. 781).

### Tables des exercices

**Full Body A — fullbody-quad (warmupPool[0])**

| # | Slot muscles | Cat | Exercice retenu (déterministe, HOME) | Séries×Reps |
|---|---|---|---|---|
| w | warmup | — | seed-band-pull-apart · Band pull-apart | 2×10 |
| 1 | quads / glutes | cmp | seed-goblet-squat · Goblet squat (KB, pop 3) | 2×12-15 (60 s) |
| 2 | chest / chest_upper | cmp | seed-bench-dumbbell · Développé couché haltères | 2×12-15 |
| 3 | back_width / back_thickness / back | cmp | seed-row-dumbbell · Rowing haltère *(aucun candidat `back_width` compound en HOME → repli sur back_thickness via le tri)* | 2×12-15 |
| 4 | shoulders / shoulders_front | cmp | seed-shoulder-press-dumbbell · Développé épaules haltères | 2×12-15 |
| 5 | hamstrings | iso | ⚠️ **kb-rdl · SDT kettlebell jambes tendues** — aucune isolation ischios en HOME → repli compound (l. 748–751), **spec isolation appliquée** | 2×12-15 |
| 6 | shoulders_rear | iso | seed-rear-delt-fly · Oiseau buste penché | 2×12-15 |
| c | core | — | seed-scissors · Ciseaux abdominaux | 3×15 |

**Full Body B — fullbody-hip (warmupPool[1])**

| # | Slot muscles | Cat | Exercice retenu | Séries×Reps |
|---|---|---|---|---|
| w | warmup | — | seed-bird-dog · Bird dog | 2×10 |
| 1 | hamstrings / glutes | cmp | dumbbell-rdl · SDT jambes tendues haltères *(kb-rdl pénalisé par `usedGlobally`)* | 2×12-15 |
| 2 | chest / chest_upper | cmp | seed-pushup · Pompes *(bench DB utilisé)* | 2×12-15 |
| 3 | back_width / back | cmp | ⚠️ **kb-deadlift · Soulevé de terre kettlebell** — seul composé du slot en HOME (`back_width` vide, `back` → kb-deadlift). **Aucun tirage dans la séance B.** | 2×12-15 |
| 4 | shoulders / shoulders_front | cmp | seed-arnold-press · Développé Arnold | 2×12-15 |
| 5 | quads | iso | bw-wall-sit · Wall sit (seule isolation quads en HOME) | 2×12-15 |
| 6 | shoulders_lateral / shoulders_rear | iso | seed-lateral-raise · Élévations latérales | 2×12-15 |
| c | core | — | seed-crunch · Crunch | 3×15 |

`progressStepKg` (l. 789–790) : 2,5 kg + `autoProgress: true` pour les haltères/KB ; **0 et `autoProgress: false`** pour `seed-pushup`, `bw-wall-sit`, `seed-band-pull-apart` (bodyweight/band).
`generatorWarnings` : aucun (fullbody → `hasPullSession=true` l. 1108 ; 2 jours ; pas de focus).

### Assertions [PASS/FAIL]

| # | Assertion | Résultat | Ligne |
|---|---|---|---|
| 1 | `pref='fullbody'`, 2j → `['fullbody-quad','fullbody-hip']` | ✅ PASS | 480 |
| 2 | `adjustedSlotCount(9,45,'fat_loss') = max(3,floor(6.75)) = 6` | ✅ PASS | 636 |
| 3 | Total = 6 + warmup + core = 8 exercices | ✅ PASS | 1021–1035 |
| 4 | `adjustedSpec(compound_fat_loss,45)` = 2 séries × 12-15 | ✅ PASS | 653–654 |
| 5 | Aucun exercice hors HOME (ni barre, ni poulie, ni machine, ni pullup_bar) | ✅ PASS | 941–944 |
| 6 | Candidat chest compound identifié en HOME | ✅ PASS — `seed-bench-dumbbell` (A) / `seed-pushup` (B) | — |
| 7 | Candidat back compound identifié en HOME | ⚠️ **PASS partiel** — `seed-row-dumbbell` en A, mais en B le slot `['back_width','back']` n'a que `kb-deadlift` → **zéro tirage en séance B**, sans warning (le slot est « rempli ») | 738–746 |
| 8 | Noms « Full Body A / B » | ✅ PASS | 1039–1041 |
| 9 | Note wizard durée | n/a — non affichée (`goal !== 'strength'`) | Screen l. 297 |
| 10 | Spec isolation appliquée à un composé de repli (kb-rdl slot 5, séance A) | ⚠️ comportement voulu mais discutable | 991 + 748–751 |

### Coach

- **Équilibre musculaire :** séance A équilibrée (squat, poussée horizontale, tirage horizontal, poussée verticale, ischios, deltoïde postérieur) — c'est un très bon full body maison. **Séance B en revanche est déséquilibrée** : `dumbbell-rdl` (slot 1) + `kb-deadlift` (slot 3) = **deux charnières de hanche consécutives**, et **aucun mouvement de tirage** (ni vertical ni horizontal) face à deux poussées (pompes + Arnold press). Cause racine : le slot 3 de `fullbody-hip` est défini `['back_width','back']` (l. 378) — sans barre de traction ni poulie, `back_width` est vide en HOME et le tri retombe sur `seed-deadlift`/`kb-deadlift` via `back`. **Correctif : élargir ce slot à `['back_width','back_thickness','back']` comme celui de `fullbody-quad` (l. 365)** — le rowing haltère deviendrait alors candidat et la séance B retrouverait un tirage.
- **Cohérence objectif :** 2×12-15 à 60 s = format fat_loss correct en reps/densité. Mais **12 séries de travail par séance, 24 par semaine, pour tout le corps** : c'est un volume de maintien, pas de progression. Et là encore, **zéro cardio** : le seed contient burpees, corde à sauter, high knees (`primaryMuscle: 'cardio'`) mais aucun slot ne cible ce muscle, donc un programme `fat_loss` n'inclut jamais de travail cardio-métabolique. Pour 2 séances/semaine à domicile, c'est la principale limite du programme.
- **Timing réaliste :** 6 exercices × 2 séries = 12 séries, cycle ≈ 40 s + 60 s = 100 s → 20 min ; + warmup 2×10 (≈ 2 min) + core 3×15 avec repos 60 s (≈ 4 min) + 7 transitions (≈ 5 min) → **≈ 31 min pour un créneau de 45 min**. Le barème 45 min non-force (`×0.75` sur les slots **et** sur les séries) **double la réduction** : on coupe à la fois le nombre d'exercices et le nombre de séries. Il reste ~14 min inutilisées. **Recommandation : à 45 min, ne réduire que l'un des deux axes** (par ex. garder 3 séries et 6 slots ≈ 42 min, ou 2 séries et 7-8 slots).
- **Équipement :** HOME correctement respecté, aucun exercice hors périmètre. Bonne exploitation du KB (goblet squat, kb-rdl) et des haltères. ⚠️ `bw-wall-sit` reçoit une spec « 2×12-15 répétitions » alors que c'est un exercice isométrique (tenue en temps) — incohérence de prescription, mineure mais visible par l'utilisateur.
- **Variété inter-sessions :** ✅ **variété structurelle** — A quad-dominante / B hip-dominante, ordres différents, et `usedGlobally` évite tout doublon d'exercice entre les deux séances.
- **Couverture isolation :** ⚠️ **lacunes acceptables** compte tenu du format : ischios (via repli composé), deltoïdes postérieur et latéral, quads couverts ; **biceps, triceps, mollets absents** (slots 7-9 coupés) — normal à 45 min en full body. Le core est bien présent (2 séances).
- **Verdict global : ⚠️ Problème mineur** — génération correcte et conforme, mais (a) séance B sans aucun tirage (bug de définition de slot en équipement limité), (b) créneau 45 min sous-exploité de ~30 %, (c) aucun cardio pour un objectif fat_loss.

---

# Synthèse GROUPE E

## Bloc 1 — Tableau de synthèse

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|---|---|---|---|
| **P60** | `adjustedSlotCount(6,20,'strength')=3` ✅ · split PPL ✅ · 2 séries ✅ · **total 4 ≠ 5** ❌ · **note wizard « 20 min = 2 exercices »** ❌ | ⚠️ **FAIL (note wizard + total)** | Volume infra-minimal (4 séries lourdes/séance) ; 0 isolation bras/mollets/deltoïdes ; machine prioritaire sur haltère en force |
| **P61** | Split fullbody×3 débutant ✅ · `adjustedSlotCount(9,20)=4` ✅ · 2×8-12 ✅ · **total 5 ≠ 6** ❌ | ⚠️ **PASS avec réserve** | Aucun tirage horizontal du programme entier ; séance C « tout machine » ; 0 isolation |
| **P62** | Split PPL ✅ · `adjustedSlotCount(6,45,'strength')=3` ✅ · 3 séries ✅ · total 5 ✅ · **note wizard exacte seulement pour base ≤ 7** ❌ | ⚠️ **PASS avec réserve** | Créneau 45 min rempli à ~33 min ; deadlift + rowing lourds le même jour ; pas de tirage vertical en BB+DB |
| **P63** | Split upper/lower ✅ · cap 8 ✅ · Lower effectif 6 ✅ · specs 90 min inchangées ✅ · **90 min ≡ 60 min sur les Lower** ❌ | ✅ **Bon programme** (⚠️ réserve produit) | Séances Lower à 54 min pour un créneau de 90 ; bonus `+2` inatteignable sur tout template base 6 |
| **P64** | Split glutes-focus 3j ✅ · `adjustedSlotCount(8,20)=4` ✅ · 2 séries ✅ · zéro slot push ✅ · warning spécialisation ✅ · **total 5 ≠ 6** ❌ | ⚠️ **PASS technique / inadéquation produit** | 0 isolation fessiers (le cœur du template est coupé) ; Nordic curl + tractions servis à une débutante ; 0 cardio en fat_loss |
| **P65** | Split fullbody 2j ✅ · `adjustedSlotCount(9,45,'fat_loss')=6` ✅ · 2 séries ✅ · total 8 ✅ · équipement HOME respecté ✅ · **séance B sans tirage** ❌ | ⚠️ **PASS avec réserve** | Double réduction slots+séries à 45 min (~14 min inutilisées) ; 2 charnières de hanche et 0 tirage en séance B ; 0 cardio ; wall sit prescrit en reps |

## Bloc 2 — Problèmes ouverts

### Bugs / anomalies logicielles

1. **[FAIL — note wizard] « 20 min = 2 exercices » est faux pour tous les templates.**
   *Profils :* P60 (et P62 partiellement). *Fichier :* `ProgramGeneratorScreen.tsx` l. 310–311 vs `programGenerator.ts` l. 633–635.
   *Impact :* l'utilisateur force voit une promesse de 2 exercices et en reçoit 3 (base 6) ou 4 (base 8-9) ; à 45 min la note annonce 3 pour un résultat de 4 sur fullbody / upper-lower / glutes-focus. La note laisse aussi croire à une gradation 2/3/4/5 alors que 20 et 45 min appliquent **la même formule** (`×0.5`).
   *Correction :* note dynamique calculée depuis `adjustedSlotCount(base_du_split, duration, 'strength')`, ou libellé corrigé : « 20 min = 3 · 45 min = 3-4 · 60 min = 4 · 90 min = 5 exercices (hors échauffement et gainage) ».

2. **[FAIL — totaux du prompt] Le core est supprimé sous 20 min et le warmup passe à 1 série.**
   *Profils :* P60 (4 et non 5), P61 (5 et non 6), P64 (5 et non 6). *Lignes :* 1017, 1018, 1031.
   *Impact :* comportement du **code correct et voulu**, mais les assertions du référentiel d'audit v4 sont fausses. À corriger dans `audit_prompt_v4.md`. Effet secondaire réel : à 20 min il n'y a **aucun travail abdominal** dans le programme, alors que les slots core n'existent nulle part ailleurs.

3. **[FAIL — barème 90 min] `min(base + 2, 8)` est inopérant pour tous les templates de base 6.**
   *Profil :* P63 (`lower-quad`, `lower-hip`), s'étend à `push`/`pull`/`legs`/`lower`. *Lignes :* 643 + 985 + 652.
   *Impact :* une séance de 90 min est **strictement identique** à la même séance en 60 min (mêmes 6 slots, mêmes séries — `adjustedSpec` est l'identité à 60 comme à 90). L'utilisateur ne reçoit rien pour ses 30 min supplémentaires ; en P63 les jours Lower durent ~54 min pour un créneau annoncé de 90.
   *Correction :* allonger les tableaux `SLOTS` base 6 à 8 entrées, **ou** ajouter une série sur les composés à 90 min (`adjustedSpec` : `duration===90 → sets+1`).

4. **[FAIL fonctionnel — slot `back_width` en équipement limité]**
   *Profils :* P62 (BB+DB : le slot `['back_width','back']` de `pull` tombe sur `seed-deadlift`), P65 (HOME : le slot `['back_width','back']` de `fullbody-hip` tombe sur `kb-deadlift` → **séance B sans aucun tirage**). *Lignes :* 144, 378, 738–746.
   *Impact :* le slot est « rempli », donc **aucun warning n'est émis** (l. 996–1006 ne se déclenche que sur un slot vide), et l'utilisateur se retrouve avec deux charnières de hanche et zéro tirage dans la même séance.
   *Correction :* élargir le slot dos de `fullbody-hip` à `['back_width','back_thickness','back']` (comme `fullbody-quad`, l. 365) et, plus généralement, émettre un warning quand un slot compound est rempli par un exercice dont le `primaryMuscle` n'appartient pas aux 2 premiers muscles du slot.

5. **[Anomalie — `usedGlobally` prime sur la popularité]**
   *Profils :* P61 (séance C « tout machine »), P64 (Nordic curl + tractions pour une débutante en programme fessiers). *Lignes :* 773–775 (comparaison `usedGlobally` **avant** `popularity`).
   *Impact :* plus il y a de séances du même type dans la semaine, plus les exercices retenus s'éloignent des mouvements canoniques — l'inverse de ce qu'il faut pour un débutant.
   *Correction :* pondérer (ne pas déclasser un exercice `popularity ≥ 3` au profit d'un `popularity ≤ 2`), ou introduire un champ `difficulty` filtré par `level`.

6. **[Anomalie mineure — spec isolation sur exercice composé de repli]**
   *Profils :* P62 (fentes en 2×5-8), P65 (kb-rdl en 2×12-15 sur un slot isolation). *Lignes :* 991 + 748–751. Comportement voulu, mais un composé lourd hérite d'un repos de 120 s (force) ou d'un format d'isolation. À surveiller.

7. **[Anomalie mineure — `strengthEquipmentPrio` place machine/câble devant l'haltère]**
   *Profil :* P60. *Lignes :* 707–719. En force, `seed-chest-press-machine` et `seed-shoulder-press-machine` se retrouvent en 2ᵉ position du top-3 et peuvent être tirés au sort pour un 2×3-5. Recommandation : `barbell(0) < dumbbell/kettlebell(1) < machine/cable(2) < band(3) < bodyweight(4)` pour les slots compound en force.

8. **[Anomalie mineure — prescription en répétitions d'un exercice isométrique]** `bw-wall-sit` prescrit « 2×12-15 reps » (P65, slot quads iso HOME).

### Réserves coach cumulées (par thème)

**Volume trop faible aux durées courtes** — P60 (4 séries lourdes/séance), P61 (2 séries/exercice, 0 isolation), P64 (8 séries/séance).
→ *Recommandation :* à 20 min, privilégier **moins d'exercices mais plus de séries** (2 slots × 3-4 séries plutôt que 3-4 slots × 2 séries) : c'est plus efficace physiologiquement et plus simple à exécuter. Le plancher `max(2, …)` de `adjustedSpec` mérite d'être relevé à 3 pour les composés.

**Créneaux moyens/longs sous-exploités** — P62 (33 min réelles pour 45 annoncées), P63 (54 min pour 90 sur les Lower), P65 (31 min pour 45).
→ *Recommandation :* le barème 45 min non-force applique `×0.75` **deux fois** (slots ET séries) ; n'en réduire qu'un seul. Le barème 45 min force est identique au barème 20 min, ce qui est trop conservateur (il y a la place pour un 4ᵉ slot).

**Équilibre musculaire / patterns manquants** — P61 (aucun tirage horizontal du programme), P62 (aucun tirage vertical + deadlift & rowing le même jour), P65 (séance B sans tirage, 2 charnières de hanche).
→ *Recommandation :* ajouter une vérification post-génération « au moins 1 tirage horizontal ET 1 tirage vertical par semaine » et, à défaut, un warning explicite. La priorité `slot.muscles[0]` (l. 763–767) est la cause première : elle verrouille le slot dos de `fullbody-quad` sur `back_width` alors que le tableau autorise aussi `back_thickness`.

**Objectif fat_loss sans cardio** — P64, P65.
→ *Recommandation :* aucun slot ne cible `primaryMuscle: 'cardio'`, donc burpees, corde à sauter, rameur, tapis ne sont **jamais** proposés. Pour `goal === 'fat_loss'` (et `endurance`), ajouter un slot cardio en fin de séance, ou un format circuit (repos réduits, superset) qui justifierait le choix d'objectif.

**Adéquation niveau ↔ exercices** — P64 (Nordic curl, tractions pour une débutante), P61 (dérive machine).
→ *Recommandation :* champ `difficulty` dans le seed, filtré par `level`.

**Spécialisation à durée courte** — P64 : `glutes-focus` + 20 min supprime toutes les isolations fessiers, c'est-à-dire la raison d'être du template.
→ *Recommandation :* pour les templates spécialisés, réordonner les slots afin qu'au moins une isolation du muscle cible figure dans les 4 premiers, ou avertir dans le wizard.

### Incohérences wizard ↔ générateur (groupe E)

| # | Incohérence | Détail |
|---|---|---|
| E-1 | **Note ℹ️ durée force fausse à 20 min (toujours) et à 45 min (base ≥ 8)** | Screen l. 310–311 vs générateur l. 633–635. Le wizard promet 2/3/4/5 exercices ; le code produit 3/3/4/5 (base 6) ou 4/4/4/5 (base 8-9). |
| E-2 | **La note compte les slots, l'écran final affiche slots + warmup (+ core)** | À 60 min force la note annonce « 4 exercices » et la séance générée en contient 6. Aucun des deux nombres n'est faux, mais ils ne parlent pas de la même chose. |
| E-3 | **La durée est choisie (étape 3) avant la structure (étape 4)** alors que le nombre d'exercices dépend de la base du split retenu | Screen l. 295–321 (durée) puis l. 324 (structure). Une note dynamique n'est donc calculable qu'après l'étape 4 — d'où le libellé figé, et l'incohérence E-1. *Correction possible : déplacer la note sur l'écran de récapitulatif, où le split est connu.* |
| E-4 | **Aucun garde-fou wizard sur durée × structure** | `glutes-focus` + 20 min (P64) supprime toute l'identité du template, `fullbody` + 20 min supprime toutes les isolations (P61). `incompatibleReason` (Screen l. 628–645) ne teste que `days`, `level` et `goal` — jamais `duration`. |



---


# Audit v4 — GROUPE F (P66–P70) : `phaseLabel` v4 (séparateur `→` + labels FR)

**Auditeur :** coach sportif certifié (15 ans de programmation de l'entraînement)
**Périmètre :** P66 à P70 uniquement (GROUPE F)
**Date :** 2026-09-07

---

## Code de référence (lu en entier)

### `src/utils/programGenerator.ts` — `buildPhases`

| Ligne | Code |
|-------|------|
| 860 | `export function buildPhases(totalWeeks: number, goal: ProgramGoal = 'strength'): DraftPhase[] \| undefined {` |
| 861 | `if (totalWeeks < 8) return undefined` |
| 863 | `const cfg = PHASE_CONFIG_BY_GOAL[goal]` |
| 864 | `const adapt = 2` |
| 865 | `const deload = totalWeeks >= 12 ? 2 : 1` |
| 866 | `const intensive = totalWeeks <= 9 ? 2 : (totalWeeks >= 16 ? 4 : 3)` |
| 867 | `const progress = Math.max(1, totalWeeks - adapt - intensive - deload)` |
| 869 | `let w = 1` |
| 872–880 | push `{ name:'Adaptation', focus:'adaptation', weekStart: w (875), weekEnd: w + adapt - 1 (876) }` |
| 881 | `w += adapt` |
| 883–890 | push `{ name:'Progression', focus:'progression', weekStart: w (886), weekEnd: w + progress - 1 (887) }` |
| 891 | `w += progress` |
| 892–901 | push `{ name:'Intensification', focus:'intensification', weekStart: w (896), weekEnd: w + intensive - 1 (897) }` |
| 902 | `w += intensive` |
| 903–911 | push `{ name:'Décharge', focus:'deload', weekStart: w (906), weekEnd: totalWeeks (907) }` |
| 913 | `return phases` |

**Note structurelle :** la dernière phase se termine sur `weekEnd: totalWeeks` (ligne 907) et non sur `w + deload - 1`. La somme des phases est donc **arithmétiquement garantie** d'être égale à `totalWeeks` quelle que soit la valeur de `deload` — c'est un filet de sécurité contre les décalages d'arrondi. Vérifié pour chaque profil ci-dessous.

### `src/components/screens/ProgramGeneratorScreen.tsx` — `phaseLabel`

| Ligne | Code |
|-------|------|
| 11 | `buildPhases,` (import depuis `../../utils/programGenerator`) |
| 749 | `function phaseLabel(weeks: number): string {` (fonction locale à `renderProgramWeeksPicker`) |
| 750 | `const phases = buildPhases(weeks)` — **délègue à la source de vérité, aucune formule dupliquée** |
| 751 | `if (!phases) return ''` |
| 752 | `const plain: Record<string, string> = {` |
| 753 | `adaptation:      'rodage',` |
| 754 | `progression:     'progression',` |
| 755 | `intensification: 'pic d\'effort',` |
| 756 | `deload:          'récup.',` |
| 757 | `}` |
| 758 | `return phases.map((ph) => {` |
| 759 | `const dur = ph.weekEnd - ph.weekStart + 1` |
| 760 | `` return `${dur} sem. ${plain[ph.focus] ?? ph.focus}` `` |
| 761 | `` }).join(' → ') `` |

**Points clés vérifiés dans le code :**
- Le séparateur littéral de la ligne 761 est bien `' → '` (U+2192 encadré d'espaces), **pas** `' · '`.
- La table `plain` est indexée sur `ph.focus` (ligne 760), **pas** sur `ph.name`. C'est essentiel : la phase 4 porte `name: 'Décharge'` (ligne 904 du générateur) mais `focus: 'deload'` (ligne 905) → le mapping produit bien `'récup.'`.
- `plain` est typé `Record<string, string>` et non `Record<PhaseKey, string>` → l'accès `plain[ph.focus]` retourne `string | undefined` sous `noUncheckedIndexedAccess`, d'où le fallback `?? ph.focus`. Ce fallback n'est jamais atteint pour les 4 focus produits par `buildPhases`.
- Rendu UI : ligne 776 `const phaseInfo = opt.value !== null ? phaseLabel(opt.value) : null` ; lignes 804–808 `{phaseInfo && (<div …>{phaseInfo}</div>)}`.
- Options de durée proposées (ligne 174–183, `programWeeksOptions`) : `null` (Standard), `8`, `10`, `12`, `16`.

---

## P66 — `buildPhases(7)` → `undefined` → `phaseLabel(7)` vide

### Simulation

```
buildPhases(7)
  ligne 861 : 7 < 8  → true
  → return undefined

phaseLabel(7)
  ligne 750 : phases = undefined
  ligne 751 : !phases → true
  → return ''
```

Aucune des lignes 863–913 n'est exécutée : pas de `cfg`, pas de calcul `adapt`/`deload`/`intensive`/`progress`.

### Assertions

| # | Assertion | Résultat | Ligne |
|---|-----------|----------|-------|
| 1 | `totalWeeks = 7 < 8` → `buildPhases` retourne `undefined` | ✅ **PASS** | `programGenerator.ts:861` |
| 2 | `phaseLabel(7)` → `''` (chaîne vide, pas `undefined`, pas de throw) | ✅ **PASS** | `ProgramGeneratorScreen.tsx:751` |
| 3 | Sous-titre de la carte programme n'affiche rien pour 7 sem. | ✅ **PASS** | `ProgramGeneratorScreen.tsx:804` — `{phaseInfo && …}` : `''` est falsy → le `<div>` n'est pas monté (ni bloc vide, ni espace résiduel) |
| 4 | Aucune exception sur `.map()` d'un `undefined` (garde présente avant l'itération) | ✅ **PASS** | garde 751 **avant** le `.map()` 758 |
| 5 | Le générateur propage `phases: undefined` dans le draft | ✅ **PASS** | `programGenerator.ts:1168` — `phases: buildPhases(durationWeeks, goal)` |

**Verdict P66 : ✅ PASS (5/5)**

### Réserves ⚠️

- **7 semaines est inatteignable depuis le wizard.** `programWeeksOptions` (ligne 176–182) ne propose que `null / 8 / 10 / 12 / 16`. `phaseLabel(7)` n'est donc exerçable que par appel programmatique ou via `totalWeeks` injecté hors wizard. Le comportement est correct mais le chemin est mort côté UI — assertion 3 vérifiée par lecture du code, non observable en usage réel.
- **L'option « 📅 Standard » (`value: null`) n'affiche aucun libellé de phases** (ligne 776 : `opt.value !== null ? … : null`), alors qu'elle produit bel et bien 4 phases (8 sem. débutant, 12 intermédiaire, 16 confirmé — `DURATION_WEEKS`, `programGenerator.ts:679-683`). C'est l'option par défaut, donc la plus choisie, et c'est la seule qui ne montre pas sa périodisation. Correctif d'une ligne : `phaseLabel(opt.value ?? defaultWeeks)`.

### Coach

Le seuil à 8 semaines est **sportivement justifié** : en dessous, une périodisation en 4 blocs donnerait des phases de 1 semaine, trop courtes pour produire une adaptation mesurable (une phase d'intensification d'1 semaine n'a aucun effet de surcompensation). Renvoyer `undefined` plutôt que des phases dégénérées est le bon choix. Le silence de l'UI en dessous de 8 sem. est cohérent.

---

## P67 — `buildPhases(8)` → 4 phases → séparateur v4

### Simulation

```
buildPhases(8)
  861 : 8 < 8            → false, on continue
  864 : adapt     = 2
  865 : deload    = 8 >= 12 ? 2 : 1                         → 1
  866 : intensive = 8 <= 9 ? 2 : (…)                        → 2
  867 : progress  = max(1, 8 − 2 − 2 − 1) = max(1, 3)       → 3
  Contrôle de somme : 2 + 3 + 2 + 1 = 8 ✓

  w=1  → Adaptation      weekStart=1,  weekEnd=1+2−1=2   ; w=3
  w=3  → Progression     weekStart=3,  weekEnd=3+3−1=5   ; w=6
  w=6  → Intensification weekStart=6,  weekEnd=6+2−1=7   ; w=8
  w=8  → Décharge        weekStart=8,  weekEnd=8 (totalWeeks)
```

| Phase | `name` | `focus` | weekStart | weekEnd | Durée | Label v4 |
|-------|--------|---------|-----------|---------|-------|----------|
| 1 | Adaptation | `adaptation` | 1 | 2 | 2 | `2 sem. rodage` |
| 2 | Progression | `progression` | 3 | 5 | 3 | `3 sem. progression` |
| 3 | Intensification | `intensification` | 6 | 7 | 2 | `2 sem. pic d'effort` |
| 4 | Décharge | `deload` | 8 | 8 | 1 | `1 sem. récup.` |

```
phaseLabel(8) = "2 sem. rodage → 3 sem. progression → 2 sem. pic d'effort → 1 sem. récup."
```

### Assertions

| # | Assertion | Attendu | Obtenu | Résultat | Ligne |
|---|-----------|---------|--------|----------|-------|
| 1 | 4 phases, somme = 8 | 4 / 8 | 4 / 2+3+2+1=8 | ✅ **PASS** | `programGenerator.ts:872,883,892,903` |
| 2 | `adaptation.weekStart=1, weekEnd=2` | 1–2 | 1–2 | ✅ **PASS** | 875–876 |
| 3 | `progression.weekStart=3, weekEnd=5` | 3–5 | 3–5 | ✅ **PASS** | 886–887 |
| 4 | `intensification.weekStart=6, weekEnd=7` | 6–7 | 6–7 | ✅ **PASS** | 896–897 |
| 5 | `deload.weekStart=8, weekEnd=8` | 8–8 | 8–8 | ✅ **PASS** | 906–907 |
| 6 | `phaseLabel(8)` string complète | `"2 sem. rodage → 3 sem. progression → 2 sem. pic d'effort → 1 sem. récup."` | identique | ✅ **PASS** | 758–761 |
| 7 | **CRITIQUE** séparateur `' → '` (pas `' · '` v3) | `' → '` | `' → '` | ✅ **PASS** | `ProgramGeneratorScreen.tsx:761` |
| 8 | **CRITIQUE** `adaptation` → `'rodage'` (pas `'adaptation'`) | `rodage` | `rodage` | ✅ **PASS** | 753 |
| 9 | **CRITIQUE** `intensification` → `"pic d'effort"` | `pic d'effort` | `pic d'effort` | ✅ **PASS** | 755 |
| 10 | **CRITIQUE** `deload` → `'récup.'` (pas `'décharge'`) | `récup.` | `récup.` | ✅ **PASS** | 756 |
| 11 | `progression` reste `'progression'` (seul label inchangé v3→v4) | `progression` | `progression` | ✅ **PASS** | 754 |
| 12 | Le mapping utilise `ph.focus`, pas `ph.name` (sinon `'Décharge'` fuiterait) | `focus` | `focus` | ✅ **PASS** | 760 |

**Verdict P67 : ✅ PASS (12/12) — les 4 assertions CRITIQUES v4 passent.**

### Comparaison v3 → v4

| | v3 (ancien) | v4 (actuel) |
|---|---|---|
| Séparateur | `' · '` | **`' → '`** |
| adaptation | `adaptation` | **`rodage`** |
| progression | `progression` | `progression` (inchangé) |
| intensification | `intensification` | **`pic d'effort`** |
| deload | `décharge` | **`récup.`** |
| Sortie 8 sem. | `2 sem. adaptation · 3 sem. progression · 2 sem. intensification · 1 sem. décharge` | `2 sem. rodage → 3 sem. progression → 2 sem. pic d'effort → 1 sem. récup.` |

Longueur de chaîne : 88 car. (v3) → 76 car. (v4). Gain net sur une `t-caption` de 12 px en mobile.

### Coach

**8 semaines = 2 / 3 / 2 / 1.** C'est le format minimal viable et il est correctement réparti :
- 2 sem. de rodage : suffisant pour ancrer les patterns et calibrer les charges de départ.
- 3 sem. de progression : le bloc de travail réel — c'est court, mais c'est la contrainte d'un bloc de 8 sem.
- 2 sem. de pic d'effort : le minimum pour une surcharge exploitable (1 semaine ne produirait rien).
- 1 sem. de récup. : correct pour un cycle court, la dette de fatigue accumulée sur 7 semaines ne justifie pas 2 semaines de décharge.

**Réserve ⚠️ — le bloc de progression (3 sem.) est plus court que la somme rodage + pic (4 sem.).** Sur un cycle de 8 semaines, plus de la moitié du programme est consacrée aux phases d'encadrement et non au travail productif. C'est structurellement inévitable avec `adapt` fixé à 2 (ligne 864), mais pour un profil déjà entraîné, 1 semaine de rodage suffirait et libérerait une semaine de progression. Recommandation : rendre `adapt` dépendant du niveau (`beginner: 2`, `intermediate/advanced: 1` en dessous de 12 sem.).

**Sur le vocabulaire v4 :** « rodage », « pic d'effort » et « récup. » sont de bons choix pour un utilisateur non initié — ils décrivent une sensation, pas un concept de théorie de l'entraînement. « pic d'effort » est particulièrement juste : il communique l'intention (aller chercher le maximum) sans le jargon de la périodisation. Le séparateur `→` renforce la lecture chronologique là où `·` suggérait une énumération sans ordre. **Amélioration réelle de l'intelligibilité.**

---

## P68 — `buildPhases(10)` → `intensive = 3`

### Simulation

```
buildPhases(10)
  861 : 10 < 8            → false
  864 : adapt     = 2
  865 : deload    = 10 >= 12 ? 2 : 1                        → 1
  866 : intensive = 10 <= 9 ? 2 : (10 >= 16 ? 4 : 3)        → 3   ← franchissement du seuil >9
  867 : progress  = max(1, 10 − 2 − 3 − 1) = max(1, 4)      → 4
  Contrôle de somme : 2 + 4 + 3 + 1 = 10 ✓

  w=1  → Adaptation      1 → 2   ; w=3
  w=3  → Progression     3 → 6   ; w=7
  w=7  → Intensification 7 → 9   ; w=10
  w=10 → Décharge       10 → 10
```

| Phase | `focus` | weekStart | weekEnd | Durée | Label v4 |
|-------|---------|-----------|---------|-------|----------|
| Adaptation | `adaptation` | 1 | 2 | 2 | `2 sem. rodage` |
| Progression | `progression` | 3 | 6 | 4 | `4 sem. progression` |
| Intensification | `intensification` | 7 | 9 | 3 | `3 sem. pic d'effort` |
| Décharge | `deload` | 10 | 10 | 1 | `1 sem. récup.` |

```
phaseLabel(10) = "2 sem. rodage → 4 sem. progression → 3 sem. pic d'effort → 1 sem. récup."
```

### Assertions

| # | Assertion | Attendu | Obtenu | Résultat | Ligne |
|---|-----------|---------|--------|----------|-------|
| 1 | `intensive = 3` (seuil `>9` sem. franchi) | 3 | 3 | ✅ **PASS** | `programGenerator.ts:866` |
| 2 | `progression.weekEnd = 6` (sem. 3 à 6 = 4 sem.) | 6 | 6 | ✅ **PASS** | 886–887 |
| 3 | `phaseLabel(10)` string complète | `"2 sem. rodage → 4 sem. progression → 3 sem. pic d'effort → 1 sem. récup."` | identique | ✅ **PASS** | 758–761 |
| 4 | `deload` reste à 1 (10 < 12) | 1 | 1 | ✅ **PASS** | 865 |
| 5 | Somme = 10 | 10 | 2+4+3+1=10 | ✅ **PASS** | — |
| 6 | Séparateur `' → '` × 3 occurrences | 3 | 3 | ✅ **PASS** | 761 |
| 7 | Labels FR v4 (rodage / pic d'effort / récup.) | v4 | v4 | ✅ **PASS** | 753–756 |
| 8 | `deload.weekStart = 10, weekEnd = 10` | 10–10 | 10–10 | ✅ **PASS** | 906–907 |

**Verdict P68 : ✅ PASS (8/8)**

### Vérification du seuil `intensive` (ligne 866)

L'expression ternaire imbriquée `totalWeeks <= 9 ? 2 : (totalWeeks >= 16 ? 4 : 3)` a été évaluée sur la frontière :

| totalWeeks | Branche | `intensive` |
|-----------|---------|-------------|
| 8 | `<= 9` | 2 |
| 9 | `<= 9` | 2 |
| **10** | ni `<=9` ni `>=16` | **3** ← P68 |
| 15 | ni `<=9` ni `>=16` | 3 |
| 16 | `>= 16` | 4 |

Aucun trou ni chevauchement — la partition de l'axe est complète.

### Coach

**10 semaines = 2 / 4 / 3 / 1.** Le ratio s'améliore nettement par rapport à 8 sem. : le bloc de progression (4 sem.) devient enfin dominant et le pic d'effort passe à 3 semaines, ce qui correspond au format classique d'un bloc d'intensification (3 semaines de montée en charge avant décharge). C'est **le premier format réellement périodisé** de la grille.

**Réserve ⚠️ — 1 seule semaine de décharge après 3 semaines d'intensification, c'est court.** Le seuil de `deload` est posé à 12 sem. (ligne 865), mais la fatigue accumulée dépend surtout de la longueur du bloc d'intensification, pas de la longueur totale du programme. À 10 semaines on a déjà `intensive = 3` — le même bloc d'intensification qu'à 12 semaines — mais seulement la moitié de la décharge. **Recommandation : indexer `deload` sur `intensive` plutôt que sur `totalWeeks`** (`deload = intensive >= 3 ? 2 : 1`), ce qui donnerait 2/3/3/2 à 10 semaines — plus cohérent physiologiquement.

**Réserve ⚠️ UI —** le sous-titre statique de l'option 10 semaines (ligne 179) annonce `'Adaptation + Progression + Intensification'` : il **omet la phase de décharge** et emploie encore le vocabulaire v3 (« Adaptation », « Intensification »). Il s'affiche juste au-dessus du libellé v4 « 2 sem. rodage → 4 sem. progression → 3 sem. pic d'effort → 1 sem. récup. » (ligne 804), soit deux vocabulaires contradictoires dans la même carte, à 2 px d'écart. Correctif : aligner le `sub` sur la v4 ou le rendre neutre (« Bloc moyen — périodisation complète »).

---

## P69 — `buildPhases(12)` → `deload = 2`

### Simulation

```
buildPhases(12)
  861 : 12 < 8            → false
  864 : adapt     = 2
  865 : deload    = 12 >= 12 ? 2 : 1                        → 2   ← franchissement du seuil >=12
  866 : intensive = 12 <= 9 ? 2 : (12 >= 16 ? 4 : 3)        → 3
  867 : progress  = max(1, 12 − 2 − 3 − 2) = max(1, 5)      → 5
  Contrôle de somme : 2 + 5 + 3 + 2 = 12 ✓

  w=1  → Adaptation       1 → 2   ; w=3
  w=3  → Progression      3 → 7   ; w=8
  w=8  → Intensification  8 → 10  ; w=11
  w=11 → Décharge        11 → 12
```

| Phase | `focus` | weekStart | weekEnd | Durée | Label v4 |
|-------|---------|-----------|---------|-------|----------|
| Adaptation | `adaptation` | 1 | 2 | 2 | `2 sem. rodage` |
| Progression | `progression` | 3 | 7 | 5 | `5 sem. progression` |
| Intensification | `intensification` | 8 | 10 | 3 | `3 sem. pic d'effort` |
| Décharge | `deload` | 11 | 12 | 2 | `2 sem. récup.` |

```
phaseLabel(12) = "2 sem. rodage → 5 sem. progression → 3 sem. pic d'effort → 2 sem. récup."
```

### Assertions

| # | Assertion | Attendu | Obtenu | Résultat | Ligne |
|---|-----------|---------|--------|----------|-------|
| 1 | `deload = 2` (premier seuil `>= 12` sem.) | 2 | 2 | ✅ **PASS** | `programGenerator.ts:865` |
| 2 | `progression` = 5 sem., `weekStart=3`, `weekEnd=7` | 5 / 3 / 7 | 5 / 3 / 7 | ✅ **PASS** | 886–887 |
| 3 | `deload.weekStart=11, weekEnd=12` | 11–12 | 11–12 | ✅ **PASS** | 906–907 |
| 4 | `phaseLabel(12)` string complète | `"2 sem. rodage → 5 sem. progression → 3 sem. pic d'effort → 2 sem. récup."` | identique | ✅ **PASS** | 758–761 |
| 5 | `intensive = 3` (12 dans la plage 10–15) | 3 | 3 | ✅ **PASS** | 866 |
| 6 | `intensification.weekStart=8, weekEnd=10` | 8–10 | 8–10 | ✅ **PASS** | 896–897 |
| 7 | Somme = 12 | 12 | 2+5+3+2=12 | ✅ **PASS** | — |
| 8 | Labels FR v4 + séparateur `' → '` | v4 | v4 | ✅ **PASS** | 753–756, 761 |
| 9 | `weekEnd` de la décharge = `totalWeeks` (pas `w + deload − 1`) | 12 | 12 | ✅ **PASS** | 907 |

**Verdict P69 : ✅ PASS (9/9)**

**Cohérence avec `DURATION_WEEKS`** (`programGenerator.ts:679-683`) : 12 sem. est la durée par défaut du niveau `intermediate`. C'est donc la configuration la plus fréquemment générée en production — elle est correcte.

### Coach

**12 semaines = 2 / 5 / 3 / 2.** C'est **le format de référence** et il est bien construit :
- Bloc de progression de 5 semaines : assez long pour une vraie progression linéaire de charge (5 incréments hebdomadaires).
- Pic d'effort de 3 semaines : format classique de surcharge.
- 2 semaines de récupération : correct après 3 semaines d'intensification sur un cycle de 3 mois.

Le ratio travail productif / encadrement passe à 5/(2+3+2) = 5/7 — le meilleur des formats courts. **Verdict sportif : ✅ format bien calibré, rien à redire.**

**Réserve ⚠️ mineure —** le saut de `deload` de 1 à 2 se produit exactement à 12 semaines alors que `intensive` est identique (3) à 10, 11, 12 et 15 semaines. Un programme de 11 semaines a donc le même bloc d'intensification qu'un programme de 12 mais moitié moins de décharge (voir la recommandation détaillée en P68).

---

## P70 — `buildPhases(16)` → `intensive = 4` + `deload = 2`

### Simulation

```
buildPhases(16)
  861 : 16 < 8            → false
  864 : adapt     = 2
  865 : deload    = 16 >= 12 ? 2 : 1                        → 2
  866 : intensive = 16 <= 9 ? 2 : (16 >= 16 ? 4 : 3)        → 4   ← franchissement du seuil >=16
  867 : progress  = max(1, 16 − 2 − 4 − 2) = max(1, 8)      → 8
  Contrôle de somme : 2 + 8 + 4 + 2 = 16 ✓

  w=1  → Adaptation       1 → 2   ; w=3
  w=3  → Progression      3 → 10  ; w=11
  w=11 → Intensification 11 → 14  ; w=15
  w=15 → Décharge        15 → 16
```

| Phase | `focus` | weekStart | weekEnd | Durée | Label v4 |
|-------|---------|-----------|---------|-------|----------|
| Adaptation | `adaptation` | 1 | 2 | 2 | `2 sem. rodage` |
| Progression | `progression` | 3 | 10 | 8 | `8 sem. progression` |
| Intensification | `intensification` | 11 | 14 | 4 | `4 sem. pic d'effort` |
| Décharge | `deload` | 15 | 16 | 2 | `2 sem. récup.` |

```
phaseLabel(16) = "2 sem. rodage → 8 sem. progression → 4 sem. pic d'effort → 2 sem. récup."
```

### Assertions

| # | Assertion | Attendu | Obtenu | Résultat | Ligne |
|---|-----------|---------|--------|----------|-------|
| 1 | `intensive = 4` (seuil `>= 16` sem.) | 4 | 4 | ✅ **PASS** | `programGenerator.ts:866` |
| 2 | `progression` = 8 sem., `weekStart=3`, `weekEnd=10` | 8 / 3 / 10 | 8 / 3 / 10 | ✅ **PASS** | 886–887 |
| 3 | `intensification.weekStart=11, weekEnd=14` | 11–14 | 11–14 | ✅ **PASS** | 896–897 |
| 4 | `deload.weekStart=15, weekEnd=16` | 15–16 | 15–16 | ✅ **PASS** | 906–907 |
| 5 | `phaseLabel(16)` string complète | `"2 sem. rodage → 8 sem. progression → 4 sem. pic d'effort → 2 sem. récup."` | identique | ✅ **PASS** | 758–761 |
| 6 | `deload = 2` (16 ≥ 12) | 2 | 2 | ✅ **PASS** | 865 |
| 7 | Somme = 16 | 16 | 2+8+4+2=16 | ✅ **PASS** | — |
| 8 | `adapt = 2` malgré 16 sem. (constante, pas proportionnelle) | 2 | 2 | ✅ **PASS** | 864 |
| 9 | Labels FR v4 + séparateur `' → '` × 3 | v4 | v4 | ✅ **PASS** | 753–756, 761 |

**Verdict P70 : ✅ PASS (9/9)**

**Cohérence avec `DURATION_WEEKS`** : 16 sem. est la durée par défaut du niveau `advanced` (`programGenerator.ts:682`). Configuration correcte pour le profil confirmé.

### Coach

**16 semaines = 2 / 8 / 4 / 2.** Ratio excellent : 8 semaines de progression pure sur 16, soit la moitié du cycle en travail productif. Le pic d'effort à 4 semaines est le maximum recommandable — au-delà, le risque de surmenage central dépasse le bénéfice de surcharge. **Format sportivement solide.**

**Réserve ⚠️ — un bloc de progression de 8 semaines sans décharge intermédiaire est long.** La pratique standard sur un macrocycle de 4 mois insère une semaine de décharge légère à mi-parcours (typiquement sem. 6 ou 7) pour éviter la stagnation en fin de bloc. Ici, l'athlète enchaîne 12 semaines consécutives (sem. 3 à 14) sans aucune baisse de volume avant la décharge finale. Le modèle à 4 phases linéaires ne permet pas d'exprimer cette décharge intermédiaire.
**Recommandation :** pour `totalWeeks >= 16`, découper le bloc de progression en `Progression A → mini-décharge (1 sem.) → Progression B`, ou plus simplement autoriser un tableau de 5–6 phases quand `progress > 6`.

**Réserve ⚠️ — `adapt` reste fixé à 2 quelle que soit la durée** (ligne 864, commentaire `// max 2 semaines`). Sur 16 semaines, 2 semaines de rodage représentent 12,5 % du cycle ; sur 8 semaines, 25 %. La constante est trop courte pour un débutant sur 16 sem. (qui gagnerait à 3–4 sem. de technique) et trop longue pour un confirmé sur 8 sem. Recommandation : `adapt = level === 'beginner' ? min(3, ceil(totalWeeks/6)) : 2`.

**Longueur de la chaîne UI :** `"2 sem. rodage → 8 sem. progression → 4 sem. pic d'effort → 2 sem. récup."` = 74 caractères dans une `t-caption` (12 px). Sur un écran de 360 px de large avec 32 px de padding horizontal, cela passe sur 3 lignes. Lisible, mais c'est le libellé le plus long de la grille — à surveiller si un label FR devait s'allonger.

---

## Tableau de synthèse — GROUPE F

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|--------|----------------------|---------|-------------------|
| **P66** | `buildPhases(7)` → `undefined` ✅ · `phaseLabel(7)` = `''` ✅ · sous-titre non rendu (falsy) ✅ · pas de crash sur `.map` ✅ · `phases: undefined` dans le draft ✅ | ✅ **PASS** (5/5) | 7 sem. inatteignable depuis le wizard (options : null/8/10/12/16) · l'option « 📅 Standard » n'affiche aucun libellé alors qu'elle produit 4 phases |
| **P67** | 4 phases somme=8 ✅ · 1-2 / 3-5 / 6-7 / 8-8 ✅ · **séparateur `' → '`** ✅ · **`rodage`** ✅ · **`pic d'effort`** ✅ · **`récup.`** ✅ · mapping sur `focus` et non `name` ✅ | ✅ **PASS** (12/12) | Bloc de progression (3 sem.) plus court que rodage+pic (4 sem.) — `adapt=2` fixe pénalise les cycles courts |
| **P68** | `intensive=3` (seuil >9) ✅ · progression 3→6 ✅ · `deload=1` (10<12) ✅ · somme=10 ✅ · labels v4 ✅ | ✅ **PASS** (8/8) | 1 sem. de décharge après 3 sem. d'intensification = insuffisant · `sub` de l'option 10 sem. (ligne 179) omet la décharge et utilise le vocabulaire v3 |
| **P69** | `deload=2` (seuil ≥12) ✅ · progression 3→7 (5 sem.) ✅ · décharge 11→12 ✅ · `intensive=3` ✅ · somme=12 ✅ · labels v4 ✅ | ✅ **PASS** (9/9) | Aucune sur la répartition — format de référence bien calibré · seuil `deload` indexé sur `totalWeeks` plutôt que sur `intensive` |
| **P70** | `intensive=4` (seuil ≥16) ✅ · progression 3→10 (8 sem.) ✅ · intensification 11→14 ✅ · décharge 15→16 ✅ · `adapt=2` constant ✅ · somme=16 ✅ · labels v4 ✅ | ✅ **PASS** (9/9) | 8 sem. de progression sans décharge intermédiaire (12 sem. consécutives sans baisse de volume) · `adapt` fixe à 2 inadapté aux extrêmes de durée |

**Total GROUPE F : 43 assertions, 43 PASS, 0 FAIL.**

---

## Synthèse des problèmes ouverts — GROUPE F

### Bugs / anomalies logicielles (assertions FAIL)

**Aucun.** Les 43 assertions du groupe F passent, dont les 4 assertions critiques v4 (`PHASE-SEP`, `PHASE-FR` × 3) validées sur P67 et confirmées sur P68–P70.

Vérification des régressions du récapitulatif :

| Code | Assertion | Profils | Résultat |
|------|-----------|---------|----------|
| `PHASE-SEP` | séparateur `' → '` (pas `' · '`) | P67–P70 | ✅ **PASS** — `ProgramGeneratorScreen.tsx:761` |
| `PHASE-FR` | labels FR : rodage / progression / pic d'effort / récup. | P67–P70 | ✅ **PASS** — `ProgramGeneratorScreen.tsx:753-756` |

La migration v3 → v4 est **complète et correcte** : aucune trace du séparateur `' · '` ni des labels v3 dans `phaseLabel`. La fonction continue de déléguer intégralement à `buildPhases` (ligne 750) — aucune formule de périodisation dupliquée dans le composant, ce qui garantit que le libellé affiché ne peut pas diverger des phases réellement générées.

### Incohérences de vocabulaire à signaler (UI, non bloquantes)

Le vocabulaire v4 (`rodage` / `pic d'effort` / `récup.`) n'a été appliqué **qu'à `phaseLabel`**. Le reste de l'application affiche toujours les `name` des phases produits par `buildPhases` (`Adaptation` / `Progression` / `Intensification` / `Décharge`, lignes 873, 884, 893, 904) :

| Emplacement | Vocabulaire affiché | Fichier:ligne |
|---|---|---|
| Wizard — sélecteur de durée (`phaseLabel`) | **v4** : rodage / pic d'effort / récup. | `ProgramGeneratorScreen.tsx:753-756` |
| Wizard — récapitulatif des blocs à l'étape Objectif | v3 : Adaptation / Intensification / **Décharge** | `ProgramGeneratorScreen.tsx:1052-1056` |
| Wizard — `sub` de l'option 10 semaines | v3 : « Adaptation + Progression + Intensification » (décharge omise) | `ProgramGeneratorScreen.tsx:179` |
| Écran Détail programme | v3 : Intensification / **Décharge** | `ProgramDetailScreen.tsx:651-652` |
| Dashboard (bandeau phase courante) | `phase.name` → **Décharge** | `DashboardScreen.tsx:275, 549` |
| Modale de séance | `phase.name` → **Décharge** | `SessionModal.tsx:292` |

**Impact concret :** l'utilisateur choisit « 12 semaines » en lisant « … → 2 sem. **récup.** », puis, arrivé en semaine 11, voit son dashboard afficher « 🔄 **DÉCHARGE** ». Deux mots pour la même phase, à deux moments du parcours. Le plus visible est le cas interne au wizard : le récapitulatif « Décharge » (ligne 1055) et le libellé « récup. » (ligne 756) coexistent dans le même écran, à deux étapes d'écart.

**Correction recommandée (hors périmètre du groupe F, à arbitrer) :** soit propager les labels v4 en exportant une table `PHASE_PLAIN_LABEL` depuis `programGenerator.ts` et l'utiliser partout où `phase.name` est rendu, soit assumer la distinction (langage accessible dans le wizard, terminologie technique en cours de programme) et documenter le choix. La première option est préférable — la v4 a manifestement pour objectif de retirer le jargon du parcours utilisateur, et le laisser réapparaître au moment où l'utilisateur vit la phase annule le bénéfice.

### Réserves coach cumulées — par thème

**1. Répartition des phases sur les cycles courts** (P67)
`adapt = 2` est une constante (ligne 864). Sur 8 semaines, rodage + pic + récup. = 5 semaines contre 3 de progression : plus de la moitié du cycle en phases d'encadrement. Recommandation : indexer `adapt` sur le niveau et la durée — `beginner: min(3, ceil(totalWeeks/6))`, `intermediate/advanced: totalWeeks < 12 ? 1 : 2`.

**2. Calibrage de la décharge** (P68, P69)
`deload` est indexé sur `totalWeeks` (ligne 865) alors que la fatigue à évacuer dépend de la longueur du bloc d'intensification. Résultat : 10 et 11 semaines ont `intensive = 3` mais `deload = 1`, tandis que 12 semaines a le même `intensive = 3` avec `deload = 2`. Recommandation : `deload = intensive >= 3 ? 2 : 1` — ce qui préserve exactement les sorties de P67 (intensive=2 → deload=1), P69 et P70, et corrige uniquement la plage 10–11 semaines.

**3. Absence de décharge intermédiaire sur les cycles longs** (P70)
Sur 16 semaines, l'athlète enchaîne les semaines 3 à 14 (12 semaines) sans aucune baisse de volume. Le modèle linéaire à 4 phases ne peut pas exprimer une décharge de mi-parcours, pourtant standard sur un macrocycle de 4 mois. Recommandation : autoriser 5–6 phases quand `progress > 6` (Progression A → mini-décharge 1 sem. → Progression B).

**4. Lisibilité et cohérence de l'UI du sélecteur de durée** (P66, P68)
- L'option « 📅 Standard » — celle par défaut, donc la plus choisie — est la seule à ne pas afficher sa périodisation (ligne 776). Correctif d'une ligne.
- Le `sub` statique de l'option 10 semaines (ligne 179) énumère 3 phases sur 4 et emploie le vocabulaire v3, en contradiction directe avec le libellé v4 affiché 2 px en dessous.

### Points forts à préserver

- **`phaseLabel` délègue à `buildPhases`** (ligne 750) : le libellé du wizard ne peut structurellement pas diverger des phases générées. C'est la bonne architecture — à ne jamais remplacer par une formule inline.
- **`weekEnd: totalWeeks` sur la dernière phase** (ligne 907) : la somme des phases est arithmétiquement garantie égale à `totalWeeks`, quel que soit l'arrondi des phases précédentes. Vérifié sur 8, 10, 12 et 16.
- **Mapping sur `ph.focus` et non `ph.name`** (ligne 760) : c'est ce qui permet à la traduction v4 de fonctionner malgré un `name` resté « Décharge » côté générateur. Un mapping sur `name` aurait silencieusement fait échouer l'assertion critique `deload → récup.`.
- **Le fallback `?? ph.focus`** (ligne 760) : si une 5ᵉ phase était ajoutée à `buildPhases` sans mise à jour de la table `plain`, l'UI afficherait la clé brute plutôt que `undefined`. Dégradation propre.



---


