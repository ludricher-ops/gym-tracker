# Audit P27–P30 — Groupe D : Durée × slots

Sources lues :
- `src/utils/programGenerator.ts` (lignes 356–361 pour `adjustedSlotCount`, lignes 214–239 pour les slots fullbody, lignes 107–129 pour push/pull/legs)
- `tests/audit_prompt_v3.md` (Groupe D, section méthode)

---

## P27 — 20 min fullbody beginner 2j

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:20, equipment:FULL, level:'beginner' }
```

### Simulation

**Étape 1 — workoutTypeFromFocus(undefined)**
focusMuscles absent → `return null` (ligne 253 : `if (focusMuscles.length === 0) return null`)

**Étape 2 — selectSplit**
daysPerWeek=2 → case 2 : `return ['fullbody-quad', 'fullbody-hip']` (ligne 298)

**Étape 3 — adjustedSlotCount**

`adjustedSlotCount(9, 20)` (ligne 357) :
- `Math.floor(9 × 0.5)` = `Math.floor(4.5)` = **4**
- `Math.max(2, 4)` = **4 slots**

`reorderSlotsByFocus` : focusedMuscles.size === 0 → slots retournés sans modification (ligne 409 : `if (focused.size === 0) return slots`)

**Slots retenus — Full Body A (fullbody-quad), 4 premiers :**

| # | Muscles cibles | compound |
|---|----------------|----------|
| 1 | quads, glutes | true |
| 2 | chest, chest_upper | true |
| 3 | back_width, back_thickness, back | true |
| 4 | shoulders, shoulders_front | true |
| — | hamstrings | false — élidé |
| — | shoulders_rear | false — élidé |
| — | biceps | false — élidé |
| — | triceps | false — élidé |
| — | calves | false — élidé |

**Slots retenus — Full Body B (fullbody-hip), 4 premiers :**

| # | Muscles cibles | compound |
|---|----------------|----------|
| 1 | hamstrings, glutes | true |
| 2 | chest, chest_upper | true |
| 3 | back_width, back | true |
| 4 | shoulders, shoulders_front | true |
| — | quads | false — élidé |
| — | shoulders_lateral, shoulders_rear | false — élidé |
| — | biceps | false — élidé |
| — | triceps | false — élidé |
| — | calves | false — élidé |

**Étape 4 — adjustedSpec (ligne 368–372) pour 20 min**
`factor = 0.5`
- Compound hypertrophy (`sets:4`) → `max(2, floor(4×0.5))` = `max(2, 2)` = **2 séries** → 2×8-12, repos 90s
- Warmup : WARMUP_SPEC fixe → 2×10, repos 0s (non ajusté)
- Core : CORE_SPEC fixe → 3×15, repos 60s (non ajusté)

**Étape 5 — Programme final**

Full Body A (fullbody-quad) — beginner → `candidates[0]` (déterministe) :

| # | Slot (muscles cibles) | Cat | Exercice retenu (FULL, beginner) | Séries×Reps |
|---|-----------------------|-----|----------------------------------|-------------|
| 0 | warmup | — | warmup (1er du pool) | 2×10 |
| 1 | quads/glutes | cmp | squat barbell (candidat[0] probable) | 2×8-12 |
| 2 | chest/chest_upper | cmp | bench press BB | 2×8-12 |
| 3 | back_width/back_thickness/back | cmp | lat pulldown ou barbell row | 2×8-12 |
| 4 | shoulders/shoulders_front | cmp | overhead press BB | 2×8-12 |
| 5 | core | — | planche (1er du pool) | 3×15 |

Full Body B (fullbody-hip) — usedGlobally = exercices de A :

| # | Slot (muscles cibles) | Cat | Exercice retenu | Séries×Reps |
|---|-----------------------|-----|-----------------|-------------|
| 0 | warmup | — | warmup suivant dans le pool | 2×10 |
| 1 | hamstrings/glutes | cmp | RDL ou hip thrust BB | 2×8-12 |
| 2 | chest/chest_upper | cmp | incline bench ou alternative (squat/bench déjà pris) | 2×8-12 |
| 3 | back_width/back | cmp | alternative tirage vertical | 2×8-12 |
| 4 | shoulders/shoulders_front | cmp | alternative OHP | 2×8-12 |
| 5 | core | — | core suivant dans le pool | 3×15 |

Note : beginner + FULL, donc `candidates[0]` par popularité décroissante. Les exercices barbell ont la priorité de popularité la plus haute. Le seed complet n'est pas lu dans cet audit (Groupe D ne l'exige pas) — les noms ci-dessus sont illustratifs.

### Assertions [PASS/FAIL]

- `adjustedSlotCount(9, 20)` = 4 : **PASS** (ligne 357 : `Math.max(2, Math.floor(9×0.5))` = 4)
- Total exercices par workout = 6 (4 slots + warmup + core) : **PASS**
- Split = `['fullbody-quad', 'fullbody-hip']` → type public `['fullbody', 'fullbody']` : **PASS**
- 4 slots = 4 composés (tous les slots retenus sont compound=true) : **PASS**
- Tous les slots coupés sont des isolations (slots 5–9) : **PASS**

### Évaluation coach

**Timing réaliste ?**
- 4 composés × 2 séries × (travail ~45s + repos 90s) ≈ 4 × 3.75 min = **15 min**
- Warmup 2×10 ≈ **3 min** (WARMUP_SPEC non réduit pour durée courte)
- Core 3×15 ≈ **5 min** (CORE_SPEC non réduit pour durée courte)
- Total estimé : **~23 min** — dépasse légèrement la cible de 20 min
- Problème : WARMUP_SPEC (2×10) et CORE_SPEC (3×15) ne sont pas ajustés par `adjustedSpec`, contrairement aux slots principaux. Pour une séance de 20 min, le warmup + core représentent ~8 min sur 20, soit 40 % du crédit temps.

**Contenu cohérent avec la durée ?**
- 4 exercices composés uniquement : logique pour 20 min. Pas d'isolation — acceptable.
- Seule faiblesse : aucun travail d'isolation du tout ; les mollets, biceps, triceps sont absents.

**Équilibre musculaire :**
- Full Body A : quad/glutes + chest + back + shoulders → carré haut du corps, 1 groupe jambes. Cohérent.
- Full Body B : post-chaîne (hamstrings/glutes) + chest + back + shoulders → bonne complémentarité avec A.
- Couverture isolation : aucune (biceps, triceps, calves, hamstrings isol absents) — **lacune acceptable** pour 20 min.

**Variété inter-sessions :**
- A et B ont des structures différenciées (quad-dominant vs hip-dominant) : **variété structurelle** — bien.

**Verdict global : ⚠️ Problème mineur**
Le programme est structurellement solide mais le timing réel excède 20 min à cause du WARMUP_SPEC et CORE_SPEC non ajustés. Pour une séance de 20 min, il serait préférable de supprimer le core fixe (ou de le compter dans les slots) et de réduire le warmup à 1 série.

---

## P28 — 45 min fullbody beginner 2j

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:45, equipment:FULL, level:'beginner' }
```

### Simulation

**Étape 1 — workoutTypeFromFocus(undefined)** → null

**Étape 2 — selectSplit**
daysPerWeek=2 → `['fullbody-quad', 'fullbody-hip']` (ligne 298)

**Étape 3 — adjustedSlotCount**

`adjustedSlotCount(9, 45)` (ligne 358) :
- `Math.floor(9 × 0.75)` = `Math.floor(6.75)` = **6**
- `Math.max(3, 6)` = **6 slots**

**Slots retenus — Full Body A (fullbody-quad), 6 premiers :**

| # | Muscles cibles | compound |
|---|----------------|----------|
| 1 | quads, glutes | true |
| 2 | chest, chest_upper | true |
| 3 | back_width, back_thickness, back | true |
| 4 | shoulders, shoulders_front | true |
| 5 | hamstrings | false |
| 6 | shoulders_rear | false |
| — | biceps | false — élidé |
| — | triceps | false — élidé |
| — | calves | false — élidé |

**Slots retenus — Full Body B (fullbody-hip), 6 premiers :**

| # | Muscles cibles | compound |
|---|----------------|----------|
| 1 | hamstrings, glutes | true |
| 2 | chest, chest_upper | true |
| 3 | back_width, back | true |
| 4 | shoulders, shoulders_front | true |
| 5 | quads | false |
| 6 | shoulders_lateral, shoulders_rear | false |
| — | biceps | false — élidé |
| — | triceps | false — élidé |
| — | calves | false — élidé |

**Étape 4 — adjustedSpec pour 45 min**
`factor = 0.75`
- Compound hypertrophy (`sets:4`) → `max(2, floor(4×0.75))` = `max(2, 3)` = **3 séries** → 3×8-12, repos 90s
- Isolation hypertrophy (`sets:3`) → `max(2, floor(3×0.75))` = `max(2, 2)` = **2 séries** → 2×10-15, repos 75s
- Warmup : 2×10 (non réduit)
- Core : 3×15 (non réduit)

**Étape 5 — Programme final**

Full Body A (fullbody-quad) :

| # | Slot (muscles cibles) | Cat | Exercice retenu | Séries×Reps |
|---|-----------------------|-----|-----------------|-------------|
| 0 | warmup | — | warmup pool[0] | 2×10 |
| 1 | quads/glutes | cmp | squat BB | 3×8-12 |
| 2 | chest/chest_upper | cmp | bench press BB | 3×8-12 |
| 3 | back_width/back_thickness/back | cmp | lat pulldown / barbell row | 3×8-12 |
| 4 | shoulders/shoulders_front | cmp | OHP BB | 3×8-12 |
| 5 | hamstrings | isol | leg curl | 2×10-15 |
| 6 | shoulders_rear | isol | face pull / rear delt fly | 2×10-15 |
| 7 | core | — | planche | 3×15 |

Full Body B (fullbody-hip) — usedGlobally = exercices de A :

| # | Slot (muscles cibles) | Cat | Exercice retenu | Séries×Reps |
|---|-----------------------|-----|-----------------|-------------|
| 0 | warmup | — | warmup pool[1] | 2×10 |
| 1 | hamstrings/glutes | cmp | RDL ou hip thrust BB | 3×8-12 |
| 2 | chest/chest_upper | cmp | incline bench ou alternative | 3×8-12 |
| 3 | back_width/back | cmp | alternative tirage vertical | 3×8-12 |
| 4 | shoulders/shoulders_front | cmp | alternative OHP | 3×8-12 |
| 5 | quads | isol | leg extension | 2×10-15 |
| 6 | shoulders_lateral/rear | isol | lateral raise / rear delt | 2×10-15 |
| 7 | core | — | core pool[1] | 3×15 |

### Assertions [PASS/FAIL]

- `adjustedSlotCount(9, 45)` = 6 : **PASS** (ligne 358 : `Math.max(3, Math.floor(9×0.75))` = `max(3, 6)` = 6)
- Total exercices par workout = 8 (6 slots + warmup + core) : **PASS**
- Split = type public `['fullbody', 'fullbody']` : **PASS**
- 4 slots compound + 2 slots isolation : **PASS**

### Évaluation coach

**Timing réaliste ?**
- 4 composés × 3 séries × (set ~1min + repos 90s) ≈ 4 × 7.5 min = 30 min
- 2 isolations × 2 séries × (set ~1min + repos 75s) ≈ 2 × 4.5 min = 9 min
- Warmup ≈ 3 min, Core ≈ 5 min
- Total estimé : **~47 min** — légèrement au-dessus de la cible 45 min, mais acceptable.

**Contenu cohérent avec la durée ?**
- 6 exercices principaux pour 45 min : bon équilibre. 4 composés + 2 isolations.
- Biceps et triceps absents dans les deux séances — lacune modérée.

**Équilibre musculaire :**
- Full Body A (quad-dominant) : jambes quad, poitrine, dos, épaules, ischio, deltoïdes postérieurs.
- Full Body B (hip-dominant) : chaîne postérieure, poitrine, dos, épaules, quads isol, épaules latérales.
- Complémentarité A/B : correcte — quad dominant vs hip dominant bien différencié.
- Manque : biceps, triceps (jamais couverts en isolation sur les 2 séances) ; calves également absent.
- Pour un débutant sur 2 séances/semaine, ces lacunes sont **acceptables** : les composés sollicitent bras et mollets de façon synergique.

**Variété inter-sessions : variété structurelle** (slots différents A vs B) — bien.

**Couverture isolation :** lacunes acceptables (bras, mollets) compte tenu du temps et du niveau.

**Verdict global : ✅ Bon programme**
45 min / 8 exercices : timing cohérent. Structure A/B bien différenciée. Seule réserve : biceps et triceps jamais isolés sur la semaine.

---

## P29 — 90 min fullbody beginner 2j

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:90, equipment:FULL, level:'beginner' }
```

### Simulation

**Étape 1 — workoutTypeFromFocus(undefined)** → null

**Étape 2 — selectSplit**
daysPerWeek=2 → `['fullbody-quad', 'fullbody-hip']` (ligne 298)

**Étape 3 — adjustedSlotCount**

`adjustedSlotCount(9, 90)` (ligne 359) :
- `base + 2` = `9 + 2` = **11**
- `Math.min(11, 8)` = **8 slots** (cap à 8)

Le cap à 8 signifie que le 9e slot (calves) est élidé pour les deux types fullbody.

**Pourquoi le cap à 8 existe-t-il ?**
La formule `min(base+2, 8)` impose un plafond absolu à 8 slots, indépendamment de la base. Pour fullbody-quad/hip (base=9), sans cap, on prendrait 9 slots (tous), soit la même chose qu'une séance 60 min mais avec 2 séries supplémentaires par exercice (grâce à adjustedSpec). Le cap force l'élision du dernier slot (calves) pour maintenir une structure gérée. Pour des types de séance avec base=6 (push/pull/legs/lower), base+2=8 et min(8,8)=8 — mais il n'y a que 6 slots, donc on prend min(8,6)=6 en pratique (slice ne dépasse pas la longueur du tableau). Le cap est donc utile principalement pour éviter que fullbody (base=9) n'inclue systématiquement tous ses slots à 90 min.

**Slots retenus — Full Body A (fullbody-quad), 8 premiers :**

| # | Muscles cibles | compound |
|---|----------------|----------|
| 1 | quads, glutes | true |
| 2 | chest, chest_upper | true |
| 3 | back_width, back_thickness, back | true |
| 4 | shoulders, shoulders_front | true |
| 5 | hamstrings | false |
| 6 | shoulders_rear | false |
| 7 | biceps | false |
| 8 | triceps | false |
| — | calves | false — élidé (slot 9, cap à 8) |

**Slots retenus — Full Body B (fullbody-hip), 8 premiers :**

| # | Muscles cibles | compound |
|---|----------------|----------|
| 1 | hamstrings, glutes | true |
| 2 | chest, chest_upper | true |
| 3 | back_width, back | true |
| 4 | shoulders, shoulders_front | true |
| 5 | quads | false |
| 6 | shoulders_lateral, shoulders_rear | false |
| 7 | biceps | false |
| 8 | triceps | false |
| — | calves | false — élidé (slot 9, cap à 8) |

**Étape 4 — adjustedSpec pour 90 min (ligne 369)**
`duration === 90` → specs inchangées (identiques à 60 min)
- Compound hypertrophy : **4×8-12**, repos 90s
- Isolation hypertrophy : **3×10-15**, repos 75s
- Warmup : 2×10
- Core : 3×15

**Étape 5 — Programme final**

Full Body A (fullbody-quad) :

| # | Slot (muscles cibles) | Cat | Exercice retenu | Séries×Reps |
|---|-----------------------|-----|-----------------|-------------|
| 0 | warmup | — | warmup pool[0] | 2×10 |
| 1 | quads/glutes | cmp | squat BB | 4×8-12 |
| 2 | chest/chest_upper | cmp | bench press BB | 4×8-12 |
| 3 | back_width/back_thickness/back | cmp | lat pulldown / barbell row | 4×8-12 |
| 4 | shoulders/shoulders_front | cmp | OHP BB | 4×8-12 |
| 5 | hamstrings | isol | leg curl | 3×10-15 |
| 6 | shoulders_rear | isol | face pull / rear delt | 3×10-15 |
| 7 | biceps | isol | curl BB | 3×10-15 |
| 8 | triceps | isol | triceps pushdown | 3×10-15 |
| 9 | core | — | planche | 3×15 |

Full Body B (fullbody-hip) — usedGlobally = exercices de A :

| # | Slot (muscles cibles) | Cat | Exercice retenu | Séries×Reps |
|---|-----------------------|-----|-----------------|-------------|
| 0 | warmup | — | warmup pool[1] | 2×10 |
| 1 | hamstrings/glutes | cmp | RDL ou hip thrust BB | 4×8-12 |
| 2 | chest/chest_upper | cmp | alternative bench (squat/bench déjà pris) | 4×8-12 |
| 3 | back_width/back | cmp | alternative tirage vertical | 4×8-12 |
| 4 | shoulders/shoulders_front | cmp | alternative OHP | 4×8-12 |
| 5 | quads | isol | leg extension | 3×10-15 |
| 6 | shoulders_lateral/rear | isol | lateral raise / rear delt | 3×10-15 |
| 7 | biceps | isol | alternative curl (curl BB déjà pris) | 3×10-15 |
| 8 | triceps | isol | alternative triceps | 3×10-15 |
| 9 | core | — | core pool[1] | 3×15 |

### Assertions [PASS/FAIL]

- `adjustedSlotCount(9, 90)` = 8 (cap à 8) : **PASS** (ligne 359 : `Math.min(9+2, 8)` = `min(11, 8)` = 8)
- Total exercices par workout = 10 (8 slots + warmup + core) : **PASS**
- Le 9e slot (calves) est élidé dans les deux séances : **PASS**
- Specs inchangées par rapport à 60 min (adjustedSpec retourne spec direct à 90min) : **PASS** (ligne 369)
- Split = type public `['fullbody', 'fullbody']` : **PASS**

### Évaluation coach

**Timing réaliste ?**
- 4 composés × 4 séries × (set ~1.5min + repos 90s) ≈ 4 × 10 min = 40 min
- 4 isolations × 3 séries × (set ~1min + repos 75s) ≈ 4 × 7 min = 28 min
- Warmup ≈ 3 min, Core ≈ 5 min
- Total estimé : **~76 min** — en dessous de la cible 90 min

Le temps restant (~14 min) est absorbé par des pauses plus longues entre exercices, le temps de transition matériel (changements de barres, réglages de machine), et le temps de mise en place. Pour un débutant, ce programme à 90 min semble légèrement sous-rempli mais sécurisé.

**Contenu cohérent avec la durée ?**
- 8 exercices principaux pour 90 min : correct pour un débutant, potentiellement léger pour un intermédiaire.
- Calves absent dans les deux séances : seule vraie lacune (élidé par le cap).
- Si la cible est vraiment 90 min et que l'utilisateur est débutant, ce programme est adapté car les récupérations plus longues (erreurs de technique, temps de compréhension) comblent l'écart.

**Équilibre musculaire :**
- Full Body A + B couvrent : quads, glutes, hamstrings, chest, back (width + thickness), shoulders (tous), biceps, triceps. Couverture quasi-complète hors calves.
- Calves absent (élidé par cap) : **lacune problématique** sur le long terme si le programme dure 8 semaines sans aucun travail de mollets.

**Pourquoi le cap à 8 avec base=9 pose-t-il problème ici ?**
La logique `min(base+2, 8)` devrait raisonner ainsi : à 90 min, on peut faire plus qu'à 60 min, donc on ajoute 2 slots. Mais le cap à 8 écrase l'ajout pour les types fullbody (base=9). Le résultat est qu'une séance 90 min fullbody produit la même structure qu'une séance 60 min fullbody à 8 slots — sauf que P27/60 min prendrait base=9 → 9 slots. Incohérence : le cap à 8 réduit le contenu de 90 min par rapport à 60 min.

**Variété inter-sessions : variété structurelle** (quad-dominant vs hip-dominant) — bien.

**Verdict global : ⚠️ Problème mineur**
Cap à 8 élimine systématiquement les mollets pour les séances fullbody de 90 min, ce qui est une lacune discutable. Le timing estimé (~76 min) est en dessous de la cible annoncée.

---

## P30 — 20 min PPL strength intermediate

```
{ goal:'strength', daysPerWeek:3, sessionDuration:20, equipment:FULL, level:'intermediate' }
```

### Simulation

**Étape 1 — workoutTypeFromFocus(undefined)** → null (pas de focusMuscles)

**Étape 2 — selectSplit**
goal='strength' → isMass=true, level='intermediate' ≠ 'beginner', daysPerWeek=3 :
→ case 3 : `isMass && level !== 'beginner'` → `['push', 'pull', 'legs']` (ligne 302)

**Étape 3 — adjustedSlotCount par session**

**Session Push** : base = 6 slots (tableau SLOTS['push'], lignes 107–114)
`adjustedSlotCount(6, 20)` (ligne 357) :
- `Math.floor(6 × 0.5)` = `Math.floor(3)` = **3**
- `Math.max(2, 3)` = **3 slots**

**Session Pull** : base = 6 slots (tableau SLOTS['pull'], lignes 115–122)
`adjustedSlotCount(6, 20)` = **3 slots** (même calcul)

**Session Legs** : base = 6 slots (tableau SLOTS['legs'], lignes 123–130)
`adjustedSlotCount(6, 20)` = **3 slots** (même calcul)

Total exercices par session : 3 slots + 1 warmup + 1 core = **5 exercices**

**Slots retenus par session (3 premiers dans l'ordre du tableau SLOTS) :**

Push — 3 premiers :
| # | Muscles cibles | compound |
|---|----------------|----------|
| 1 | chest, chest_upper, chest_lower | true |
| 2 | shoulders, shoulders_front | true |
| 3 | chest, chest_upper, chest_lower | false (isolation) |
| — | triceps | false — élidé |
| — | shoulders_lateral, shoulders | false — élidé |
| — | triceps | false — élidé |

Pull — 3 premiers :
| # | Muscles cibles | compound |
|---|----------------|----------|
| 1 | back_width, back | true |
| 2 | back_thickness, back | true |
| 3 | back_thickness, back_width, back | false (isolation) |
| — | biceps | false — élidé |
| — | shoulders_rear | false — élidé |
| — | forearms | false — élidé |

Legs — 3 premiers :
| # | Muscles cibles | compound |
|---|----------------|----------|
| 1 | quads | true |
| 2 | hamstrings, glutes | true |
| 3 | quads | false (isolation) |
| — | glutes | false — élidé |
| — | hamstrings | false — élidé |
| — | calves | false — élidé |

**Étape 4 — adjustedSpec pour 20 min, strength**
`factor = 0.5`
- Compound strength (`sets:5`) → `max(2, floor(5×0.5))` = `max(2, 2)` = **2 séries** → 2×3-5, repos 180s
- Isolation strength (`sets:3`) → `max(2, floor(3×0.5))` = `max(2, floor(1.5))` = `max(2, 1)` = **2 séries** → 2×5-8, repos 120s
- Warmup : 2×10 (non réduit)
- Core : 3×15 (non réduit)

**Étape 5 — Programme final**

Push (intermediate → random top-3, mais FULL disponible → barbell prioritaire sur composés strength) :

| # | Slot (muscles cibles) | Cat | Exercice retenu (indicatif, top-3) | Séries×Reps |
|---|-----------------------|-----|------------------------------------|-------------|
| 0 | warmup | — | warmup pool[0] | 2×10 |
| 1 | chest/chest_upper/chest_lower | cmp | bench press BB (eq prio strength) | 2×3-5 |
| 2 | shoulders/shoulders_front | cmp | OHP BB | 2×3-5 |
| 3 | chest/chest_upper/chest_lower | isol | fly ou push-up | 2×5-8 |
| 4 | core | — | planche | 3×15 |

Pull :

| # | Slot (muscles cibles) | Cat | Exercice retenu | Séries×Reps |
|---|-----------------------|-----|-----------------|-------------|
| 0 | warmup | — | warmup pool[1] | 2×10 |
| 1 | back_width/back | cmp | barbell row ou lat pulldown | 2×3-5 |
| 2 | back_thickness/back | cmp | cable row ou barbell row variant | 2×3-5 |
| 3 | back_thickness/back_width/back | isol | isolation dos | 2×5-8 |
| 4 | core | — | core pool[1] | 3×15 |

Legs :

| # | Slot (muscles cibles) | Cat | Exercice retenu | Séries×Reps |
|---|-----------------------|-----|-----------------|-------------|
| 0 | warmup | — | warmup pool[2] | 2×10 |
| 1 | quads | cmp | squat BB | 2×3-5 |
| 2 | hamstrings/glutes | cmp | deadlift BB / RDL | 2×3-5 |
| 3 | quads | isol | leg extension | 2×5-8 |
| 4 | core | — | core pool[2] | 3×15 |

### Assertions [PASS/FAIL]

- Split = `['push', 'pull', 'legs']` (PPL) : **PASS** (ligne 302 : isMass=true && level !== 'beginner' && daysPerWeek=3)
- `adjustedSlotCount(6, 20)` = 3 pour push : **PASS** (ligne 357 : `Math.max(2, Math.floor(6×0.5))` = `max(2,3)` = 3)
- `adjustedSlotCount(6, 20)` = 3 pour pull : **PASS** (même calcul, base=6)
- `adjustedSlotCount(6, 20)` = 3 pour legs : **PASS** (même calcul, base=6)
- Total exercices par session = 5 (3 slots + warmup + core) : **PASS**
- Réduction durée s'applique correctement sur PPL (pas seulement fullbody) : **PASS** — `adjustedSlotCount` reçoit `baseSlots.length` (ligne 670), qui vaut 6 pour push/pull/legs comme pour tout autre type de séance

### Évaluation coach

**Timing réaliste ? Push en 20 min, force :**
- Slot 1 (chest compound) : 2 séries × (work ~45s + repos 180s) ≈ 2 × 3.75 min = 7.5 min
- Slot 2 (shoulders compound) : 2 × 3.75 min = 7.5 min
- Slot 3 (chest isolation) : 2 × (work ~45s + repos 120s) ≈ 2 × 2.75 min = 5.5 min
- Warmup 2×10 ≈ 3 min
- Core 3×15 ≈ 5 min
- Total estimé : **~28.5 min** — dépasse significativement la cible de 20 min.

Le problème principal est le repos de 180s (3 min) entre chaque série en mode force. Même avec seulement 2 séries composées, les repos seuls représentent 6 min de récupération. Ajoutés au warmup et au core non réduits, le dépassement est structurel.

**Problème critique :** `adjustedSpec` réduit les séries mais pas les repos (`restSec` reste à 180s pour les composés strength). Sur une séance de 20 min avec des repos de 3 min, le calcul de slots n'est pas adapté au mode force : chaque série composée "coûte" ~4.5 min (work + repos), contre ~2.5 min en hypertrophie.

**Contenu cohérent avec l'objectif strength ?**
- 2 composés lourds par séance : conceptuellement correct pour la force. Mais 2×3-5 avec 180s de repos sur 3 exercices = séance "mini" qui ne ressemble pas à de la force traditionnelle.
- Meilleur ratio pour 20 min / strength : 1 exercice principal + 1 accessoire, sans isolation ni core long.
- L'isolation (chest fly) à 2×5-8 en force sur du 20 min est inutile : trop peu de volume, trop longue en temps de récupération.

**Équilibre musculaire :**
- Push : chest + shoulders + chest isol → triceps absents (élidés).
- Pull : back_width + back_thickness + back isol → biceps et rear delt absents (élidés).
- Legs : quads cmp + hamstrings/glutes cmp + quads isol → glutes isol, hamstrings isol, calves absents.
- Couverture globale sur 3j : correcte pour les groupes composés ; les isolations de bras et mollets sont absentes.

**Adéquation durée/contenu :**
- ❌ Problème structurel : les repos de 180s en strength rendent le planning 20min incohérent avec adjustedSlotCount qui ne tient compte que du nombre de slots, pas des temps de repos par objectif.

**Verdict global : ❌ Problème sérieux**
La réduction de durée à 20 min n'est pas calibrée pour le mode force (restSec=180s). Le timing réel excède 28 min malgré la réduction des séries. Une séance PPL strength de 20 min nécessiterait soit une réduction additionnelle des repos (non implémentée), soit un cap de 2 slots maximum pour ce cas.

---

## Récapitulatif Groupe D

| Profil | Assertion principale | `adjustedSlotCount` | Slots retenus | Total exercices | Timing estimé | Verdict |
|--------|----------------------|---------------------|---------------|-----------------|---------------|---------|
| P27 | fullbody-quad/hip, 20min, beginner hypertrophy | max(2, floor(9×0.5))=4 | 4 (tous compound) | 6 | ~23min | ⚠️ Mineur (warmup+core non réduits) |
| P28 | fullbody-quad/hip, 45min, beginner hypertrophy | max(3, floor(9×0.75))=6 | 4 cmp + 2 isol | 8 | ~47min | ✅ Bon |
| P29 | fullbody-quad/hip, 90min, beginner hypertrophy | min(9+2, 8)=8 (cap) | 4 cmp + 4 isol | 10 | ~76min | ⚠️ Mineur (calves élidé, timing sous-cible) |
| P30 | PPL push/pull/legs, 20min, intermediate strength | max(2, floor(6×0.5))=3 | 2 cmp + 1 isol | 5 | ~28min | ❌ Sérieux (restSec=180s incompatible 20min) |

### Régressions à ne jamais casser (Groupe D)

| Code | Assertion | Profils | Statut |
|------|-----------|---------|--------|
| SLOTS | Fullbody base = 9 slots (fullbody-quad et fullbody-hip) | P27–P29 | ✅ PASS |
| DUR20 | `adjustedSlotCount(N, 20)` = max(2, floor(N×0.5)) | P27, P30 | ✅ PASS |
| DUR45 | `adjustedSlotCount(N, 45)` = max(3, floor(N×0.75)) | P28 | ✅ PASS |
| DUR90 | `adjustedSlotCount(N, 90)` = min(N+2, 8) | P29 | ✅ PASS — cap déclenché pour fullbody (base=9) |
| PPL20 | Réduction durée s'applique sur PPL, pas seulement fullbody | P30 | ✅ PASS |

### Problèmes ouverts

**Bugs / anomalies logicielles :**
- Aucun FAIL sur les assertions techniques — toutes les formules sont correctement implémentées.

**Réserves coach :**
1. **WARMUP_SPEC et CORE_SPEC non ajustés pour les séances courtes (P27, P30)** : Pour 20 min, le warmup (2×10 ≈ 3min) et le core (3×15 ≈ 5min) représentent ~40% du crédit temps et ne passent pas par `adjustedSpec`. Recommandation : appliquer un facteur de réduction aux specs warmup/core (ou supprimer le core pour les séances ≤ 20min).
2. **restSec non réduit pour séances courtes en mode force (P30)** : `adjustedSpec` réduit les séries mais pas les `restSec` (180s en strength). Une séance 20min strength reste à 28min réels. Recommandation : réduire aussi `restSec` proportionnellement, ou limiter davantage le nombre de slots pour les objectifs à repos long.
3. **Cap à 8 slots élimine les mollets sur fullbody 90min (P29)** : La formule `min(base+2, 8)` avec base=9 capte exactement à 8, élidant systématiquement le slot calves. Recommandation : reconsidérer le cap à 9 pour permettre le slot calves en 90min.
