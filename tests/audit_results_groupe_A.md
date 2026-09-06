# Audit P01–P10 — Groupe A : Split pur

> Simulation de `generateProgramDraft` pour les profils sans `focusMuscles`.
> Fichiers lus : `src/utils/programGenerator.ts` (742 lignes) + `tests/audit_prompt_v3.md`.
> Exercices : génériques (seed non requis pour le Groupe A).

---

## Rappel des constantes utilisées

**COMPOUND_SPEC** (ligne 58) :
| Goal | sets | repsMin–repsMax | restSec |
|---|---|---|---|
| strength | 5 | 3–5 | 180 |
| hypertrophy | 4 | 8–12 | 90 |
| endurance | 3 | 15–20 | 60 |
| fat_loss | 3 | 12–15 | 60 |

**ISOLATION_SPEC** (ligne 65) :
| Goal | sets | repsMin–repsMax | restSec |
|---|---|---|---|
| strength | 3 | 5–8 | 120 |
| hypertrophy | 3 | 10–15 | 75 |
| endurance | 3 | 15–20 | 45 |
| fat_loss | 3 | 12–15 | 60 |

**WARMUP_SPEC** (ligne 73) : 2×10 fixe, restSec=0, autoProgress=false
**CORE_SPEC** (ligne 74) : 3×15 fixe, restSec=60

**adjustedSlotCount** (ligne 356–361) :
- 20 min → `max(2, floor(base × 0.5))`
- 45 min → `max(3, floor(base × 0.75))`
- 60 min → base inchangé
- 90 min → `min(base + 2, 8)`

**adjustedSpec** (ligne 368–372) :
- 60 / 90 min → spec inchangée
- 20 min → sets = max(2, floor(sets × 0.5))
- 45 min → sets = max(2, floor(sets × 0.75))

**Nombre de slots par type interne** (SLOTS, lignes 106–239) :
| Type interne | Slots |
|---|---|
| push | 6 |
| pull | 6 |
| legs | 6 |
| upper | 8 |
| lower | 6 |
| upper-push | 8 |
| upper-pull | 8 |
| lower-quad | 6 |
| lower-hip | 6 |
| fullbody-quad | 9 |
| fullbody-hip | 9 |

**Nommage** (lignes 706–707) :
- `totalOfType = split.filter(t => toPublicType(t) === canon).length`
- `suffix = totalOfType > 1 ? ' ' + String.fromCharCode(64 + count) : ''`
- Si 2 fullbody → "Full Body A" / "Full Body B"
- Si 1 occurrence → pas de suffixe

---

## P01 — Référence fullbody beginner

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:FULL, level:'beginner' }
```

### Simulation

**Étape 1 — workoutTypeFromFocus([])**
- focusMuscles = undefined → `focusMuscles = []` (ligne 279)
- `focusMuscles.length === 0` → return null immédiatement (ligne 253)
- Flags : N/A (court-circuit avant tout calcul)
- Résultat : **null**

**Étape 2 — selectSplit**
- isMass = `'hypertrophy' === 'strength' || 'hypertrophy' === 'hypertrophy'` = **true** (ligne 280)
- focusType = null → pas de retour anticipé
- daysPerWeek = 2 → case 2 (ligne 298) → `['fullbody-quad', 'fullbody-hip']`
- Split interne : `['fullbody-quad', 'fullbody-hip']`
- Split public : `['fullbody', 'fullbody']`

**Étape 3 — adjustedSlotCount + slots**

fullbody-quad (9 slots bruts, 60 min) → adjustedSlotCount(9, 60) = **9 slots**
fullbody-hip (9 slots bruts, 60 min) → adjustedSlotCount(9, 60) = **9 slots**

focusedMuscles = Set{} vide → reorderSlotsByFocus retourne les slots dans l'ordre original (ligne 409).

**Slots fullbody-quad** (lignes 214–226) :
| # | Muscles | compound |
|---|---|---|
| 1 | quads, glutes | true — Squat / leg press |
| 2 | chest, chest_upper | true — Développé couché |
| 3 | back_width, back_thickness, back | true — Tirage vertical / rowing |
| 4 | shoulders, shoulders_front | true — OHP |
| 5 | hamstrings | false — Leg curl |
| 6 | shoulders_rear | false — Face pull |
| 7 | biceps | false — Curl biceps |
| 8 | triceps | false — Extension triceps |
| 9 | calves | false — Mollets |

**Slots fullbody-hip** (lignes 227–239) :
| # | Muscles | compound |
|---|---|---|
| 1 | hamstrings, glutes | true — RDL / hip thrust |
| 2 | chest, chest_upper | true — Développé couché (variant via usedGlobally) |
| 3 | back_width, back | true — Traction / tirage (variant) |
| 4 | shoulders, shoulders_front | true — OHP (variant) |
| 5 | quads | false — Leg extension |
| 6 | shoulders_lateral, shoulders_rear | false — Écarté latéral / face pull |
| 7 | biceps | false — Curl variant |
| 8 | triceps | false — Extension variant |
| 9 | calves | false — Mollets variant |

**Étape 5 — Séries × Reps (hypertrophy, 60 min)**
- Compound : COMPOUND_SPEC[hypertrophy] → 4×8-12 (adjustedSpec inchangé à 60 min)
- Isolation : ISOLATION_SPEC[hypertrophy] → 3×10-15
- Warmup : 2×10 (autoProgress=false)
- Core : 3×15

**Étape 6 — Tables des exercices**

**Full Body A** (fullbody-quad, workouts.length=0, usedGlobally=∅) :
| # | Slot (muscles cibles) | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement #1 (rotation 0 % warmupPool.length) | 2×10 |
| 1 | quads / glutes | cmp | Squat (candidat #1 popularité max) | 4×8-12 |
| 2 | chest / chest_upper | cmp | Développé couché | 4×8-12 |
| 3 | back_width / back_thickness / back | cmp | Tirage vertical | 4×8-12 |
| 4 | shoulders / shoulders_front | cmp | OHP | 4×8-12 |
| 5 | hamstrings | isol | Leg curl | 3×10-15 |
| 6 | shoulders_rear | isol | Face pull | 3×10-15 |
| 7 | biceps | isol | Curl biceps | 3×10-15 |
| 8 | triceps | isol | Extension triceps | 3×10-15 |
| 9 | calves | isol | Mollets debout | 3×10-15 |
| 10 | core | — | Core #1 (rotation 0 % corePool.length) | 3×15 |

**Full Body B** (fullbody-hip, workouts.length=1, usedGlobally = exercices de A) :
| # | Slot (muscles cibles) | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement #2 (rotation 1 % warmupPool.length) | 2×10 |
| 1 | hamstrings / glutes | cmp | RDL / Hip thrust | 4×8-12 |
| 2 | chest / chest_upper | cmp | Développé incliné (squat de A dans usedGlobally → candidat suivant) | 4×8-12 |
| 3 | back_width / back | cmp | Rowing horizontal (tirage vertical de A dans usedGlobally) | 4×8-12 |
| 4 | shoulders / shoulders_front | cmp | OHP DB (OHP BB de A dans usedGlobally) | 4×8-12 |
| 5 | quads | isol | Leg extension | 3×10-15 |
| 6 | shoulders_lateral / shoulders_rear | isol | Écarté latéral | 3×10-15 |
| 7 | biceps | isol | Curl marteau (variant) | 3×10-15 |
| 8 | triceps | isol | Pushdown câble (variant) | 3×10-15 |
| 9 | calves | isol | Mollets assis (variant) | 3×10-15 |
| 10 | core | — | Core #2 (rotation 1) | 3×15 |

**Assertions : [PASS/FAIL]**
- Split interne ['fullbody-quad','fullbody-hip'] → public ['fullbody','fullbody'] (ligne 298) : **PASS**
- 11 exercices par workout (9 slots + 1 warmup + 1 core) : **PASS**
- Noms "Full Body A" / "Full Body B" (ligne 707, totalOfType=2) : **PASS**
- Premier exercice = warmup (unshift ligne 691) : **PASS**
- Dernier exercice = core (push ligne 699) : **PASS**
- Pas de doublon intra-workout (usedInWorkout Set, ligne 448) : **PASS**

### Coach

**Équilibre musculaire :**
- 4 composés couvrent les grands groupes (quads, pectoraux, dos, épaules) → bonne couverture haut/bas.
- Séance A : isolation hamstrings (leg curl) mais pas quads isolation → asymétrie quad/ischios en isolation.
- Séance B : isolation quads (leg extension) mais pas hamstrings isolation → complémentaire à A.
- Ratio push/pull composés : 1 push (bench) + 1 pull (dos) + 1 OHP (push) = 2 push / 1 pull par séance → légère dominance push. Sur la semaine (×2) = ratio 2:1 push/pull en composé — acceptable pour fullbody beginner mais à surveiller.
- Mollets présents dans les deux séances : ✓.

**Cohérence objectif (hypertrophy) :**
- Composés 4×8-12 : zone hypertrophie optimale ✓.
- Isolations 3×10-15 : zone hypertrophie correcte ✓.
- Volume hebdomadaire par groupe : chest ×2 (1 cmp + 1 isol par semaine ×2j = 8 séries composés + pas d'isolation dédiée chest en B), acceptable pour débutant.

**Adéquation durée / contenu (60 min) :**
- Estimation : 4 composés × 4 séries + 5 isolations × 3 séries + 2 warmup + 3 core = 16+15+2+3 = 36 séries.
- À ~2-2.5 min/série (45s travail + 90s repos hypertrophie) = **72-90 min** → dépasse 60 min.
- ⚠️ Le programme est sensiblement trop chargé pour 60 min. Un débutant réel mettra plus de temps entre les exercices (setup, apprentissage). Recommandation : réduire à 45 min ou baisser les séries composés à 3.

**Qualité de l'équipement :**
- FULL : tous exercices disponibles → aucun problème ✓.

**Variété inter-sessions :**
- Structure A (fullbody-quad) vs B (fullbody-hip) : slots différents aux positions 1 et 5 (squat vs RDL en composé, leg curl vs leg extension en isolation) → **Variété structurelle partielle**. Les slots pectoraux, dos, OHP, biceps, triceps, mollets sont communs mais les exercices choisis via usedGlobally varient.
- Verdict : **Variété structurelle** (dominance quad A vs hip B) avec variation d'exercices pour les groupes communs.

**Couverture isolation :**
- Chest isolation : absent des deux séances (slots fullbody-quad/hip ne comportent pas de slot chest_isol) → **lacune notable** pour hypertrophie.
- Glutes isolation : absent de fullbody-quad, présent en fullbody-hip via slot quads/glutes (isol) → partiel.
- Quads isol : absent en A, présent en B → acceptable sur 2 séances.
- Verdict : **Lacunes acceptables** pour un programme débutant 2j (volume global modeste), mais l'absence de fly / chest isolation sur 2j hypertrophie est un point à améliorer.

**Verdict global : ⚠️ Problème mineur** — contenu cohérent pour un débutant hypertrophie, mais timing estimé à 70-90 min dépasse la cible 60 min, et la poitrine manque d'isolation directe.

---

## P02 — Fullbody beginner force 3j

```
{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner' }
```

### Simulation

**Étape 1 — workoutTypeFromFocus([])**
- focusMuscles = [] → length === 0 → return **null** (ligne 253)

**Étape 2 — selectSplit**
- isMass = `'strength' === 'strength'` = **true** (ligne 280)
- focusType = null
- daysPerWeek = 3 (ligne 300) :
  - `isMass && level !== 'beginner'` → `true && false` = **false**
  - `!isMass && level !== 'beginner'` → false
  - else (beginner) → `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']` (ligne 306)
- Split interne : `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`
- Split public : `['fullbody', 'fullbody', 'fullbody']`

**Étape 3 — adjustedSlotCount (60 min)**
- fullbody-quad (×2) : 9 slots → **9**
- fullbody-hip (×1) : 9 slots → **9**

**Étape 5 — Séries × Reps (strength, 60 min)**
- Compound : 5×3-5
- Isolation : 3×5-8
- Warmup : 2×10 / Core : 3×15

**Nommage :**
- canon 'fullbody' apparaît 3 fois → totalOfType=3
- Workout 1 (fullbody-quad, count=1) → "Full Body A"
- Workout 2 (fullbody-hip, count=2) → "Full Body B"
- Workout 3 (fullbody-quad, count=3) → "Full Body C"

**Étape 6 — Tables des exercices**

**Full Body A** (fullbody-quad, strength, beginner) :
| # | Slot | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement #1 | 2×10 |
| 1 | quads / glutes | cmp | Squat BB | 5×3-5 |
| 2 | chest / chest_upper | cmp | Développé couché BB | 5×3-5 |
| 3 | back_width / back_thickness / back | cmp | Tirage vertical | 5×3-5 |
| 4 | shoulders / shoulders_front | cmp | OHP BB | 5×3-5 |
| 5 | hamstrings | isol | Leg curl | 3×5-8 |
| 6 | shoulders_rear | isol | Face pull | 3×5-8 |
| 7 | biceps | isol | Curl BB | 3×5-8 |
| 8 | triceps | isol | Extension triceps | 3×5-8 |
| 9 | calves | isol | Mollets debout | 3×5-8 |
| 10 | core | — | Core #1 | 3×15 |

**Full Body B** (fullbody-hip, strength, beginner, usedGlobally=exercices de A) :
| # | Slot | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement #2 | 2×10 |
| 1 | hamstrings / glutes | cmp | RDL BB | 5×3-5 |
| 2 | chest / chest_upper | cmp | Développé incliné BB | 5×3-5 |
| 3 | back_width / back | cmp | Rowing BB | 5×3-5 |
| 4 | shoulders / shoulders_front | cmp | OHP DB (variant) | 5×3-5 |
| 5 | quads | isol | Leg extension | 3×5-8 |
| 6 | shoulders_lateral / shoulders_rear | isol | Écarté latéral | 3×5-8 |
| 7 | biceps | isol | Curl DB (variant) | 3×5-8 |
| 8 | triceps | isol | Pushdown (variant) | 3×5-8 |
| 9 | calves | isol | Mollets assis | 3×5-8 |
| 10 | core | — | Core #2 | 3×15 |

**Full Body C** (fullbody-quad, strength, beginner, usedGlobally=A+B) :
| # | Slot | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement #3 | 2×10 |
| 1 | quads / glutes | cmp | Leg press (squat BB déjà dans usedGlobally) | 5×3-5 |
| 2 | chest / chest_upper | cmp | Développé couché DB (variants BB utilisés) | 5×3-5 |
| 3 | back_width / back_thickness / back | cmp | Tirage vertical variant (si pool suffisant) | 5×3-5 |
| 4 | shoulders / shoulders_front | cmp | OHP variant #3 | 5×3-5 |
| 5 | hamstrings | isol | Nordic curl (leg curl utilisé) | 3×5-8 |
| 6 | shoulders_rear | isol | Oiseau / Rear delt fly | 3×5-8 |
| 7 | biceps | isol | Curl marteau | 3×5-8 |
| 8 | triceps | isol | Dips (extension utilisée) | 3×5-8 |
| 9 | calves | isol | Mollets unijambiste | 3×5-8 |
| 10 | core | — | Core #3 | 3×15 |

**Assertions : [PASS/FAIL]**
- Split public ['fullbody','fullbody','fullbody'] (ligne 306) : **PASS**
- Beginner reste fullbody en strength (branche `isMass && level!=='beginner'` non déclenchée, ligne 302) : **PASS**
- 11 exercices par workout : **PASS**
- Noms "Full Body A/B/C" (totalOfType=3, ligne 706) : **PASS**

### Coach

**Équilibre musculaire :**
- Couverture complète sur 3j : quads (A/C), ischios (B), chest, dos, OHP, bras, mollets à chaque séance.
- Ratio push/pull en composé : séance A = 2 push (bench+OHP) / 1 pull (tirage) → déséquilibre. Sur 3j : 6 push composés / 3 pull composés. ⚠️ Le dos (tirage) est sous-représenté face aux poussées.

**Cohérence objectif (strength) :**
- Composés 5×3-5 : zone force pure, correcte ✓.
- Isolations 3×5-8 : zone force acceptable (force-hypertrophie mixte) ✓.
- ⚠️ OHP barre + rowing BB + squat + développé BB à 5×3-5 pour un débutant : charge technique élevée. La force brute à faible répétition suppose une technique parfaite, ce que les débutants n'ont pas encore. Recommandation : débutants en force devraient commencer en 5×5-8 plutôt que 5×3-5.

**Adéquation durée / contenu (60 min) :**
- 36 séries × ~3.5 min/série (180s repos strength) = ~126 min pour les composés seuls. TRÈS long.
- Réalité terrain : 4 composés ×5s + 5 isolations ×3s = 20+15=35 séries × 3.5 min = **122 min**. ❌ Programme irréaliste en 60 min avec des temps de repos strength (180 s).
- Pour tenir en 60 min avec ces specs, il faudrait ~15-16 séries totales → environ 3 composés × 3 séries + 2 isolations × 2 séries.

**Variété inter-sessions :**
- A vs B : structure différente (quad-dominant vs hip-dominant) → variété structurelle réelle ✓.
- B vs C : C reprend la structure fullbody-quad de A → mêmes types de slots, exercices différents via usedGlobally.
- Verdict : **Variété structurelle A/B, variété d'exercices seulement B/C**.

**Couverture isolation :**
- Chest isolation : aucun slot dédié (fly / câble croisé) dans fullbody-quad ou fullbody-hip → lacune.
- Glutes isolation : partiel (présent en B uniquement via quads isol fullbody-hip slot 5).
- Verdict : **Lacunes acceptables** dans le contexte strength (les composés suffisent pour un débutant), mais l'absence de chest isolation sur 3j force est une opportunité manquée.

**Verdict global : ⚠️ Problème mineur** — split correct, specs de reps adaptées à strength, mais 5×3-5 pour un débutant est techniquement hasardeux, et le volume par séance dépasse largement 60 min avec les temps de repos force (180 s).

---

## P03 — PPL strength intermediate 3j

```
{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'intermediate' }
```

### Simulation

**Étape 1 — workoutTypeFromFocus([])**
- focusMuscles = [] → return **null** (ligne 253)

**Étape 2 — selectSplit**
- isMass = true (strength)
- daysPerWeek = 3 :
  - `isMass && level !== 'beginner'` → `true && true` = **true** → `['push', 'pull', 'legs']` (ligne 302)
- Split interne = public : `['push', 'pull', 'legs']`

**Étape 3 — adjustedSlotCount (60 min)**
- push : 6 slots → **6**
- pull : 6 slots → **6**
- legs : 6 slots → **6**

**Slots push** (lignes 107–114) :
| # | Muscles | compound |
|---|---|---|
| 1 | chest, chest_upper, chest_lower | true — Développé couché |
| 2 | shoulders, shoulders_front | true — OHP |
| 3 | chest, chest_upper, chest_lower | false — Fly pectoraux |
| 4 | triceps | false — Extension |
| 5 | shoulders_lateral, shoulders | false — Écarté latéral |
| 6 | triceps | false — Pushdown |

**Slots pull** (lignes 115–121) :
| # | Muscles | compound |
|---|---|---|
| 1 | back_width, back | true — Tirage vertical |
| 2 | back_thickness, back | true — Rowing BB |
| 3 | back_thickness, back_width, back | false — Isolation dos |
| 4 | biceps | false — Curl |
| 5 | shoulders_rear | false — Face pull |
| 6 | forearms | false — Curl pronation |

**Slots legs** (lignes 123–130) :
| # | Muscles | compound |
|---|---|---|
| 1 | quads | true — Squat |
| 2 | hamstrings, glutes | true — RDL / Deadlift |
| 3 | quads | false — Leg extension |
| 4 | glutes | false — Hip abduction |
| 5 | hamstrings | false — Leg curl |
| 6 | calves | false — Mollets |

**Étape 5 — Séries × Reps (strength, 60 min)**
- Compound : 5×3-5 (ajusté inchangé à 60 min)
- Isolation : 3×5-8
- Warmup : 2×10 / Core : 3×15

Total par workout : 6 slots + 1 warmup + 1 core = **8 exercices**

**Nommage :**
- Chaque type apparaît 1× → totalOfType=1 → pas de suffixe
- "Push — Poussée", "Pull — Tirage", "Legs — Jambes"

**Étape 6 — Tables des exercices**

**Push — Poussée** (strength, FULL, beginner→N/A, intermediate) :
| # | Slot | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement #1 | 2×10 |
| 1 | chest / chest_upper / chest_lower | cmp | Développé couché BB | 5×3-5 |
| 2 | shoulders / shoulders_front | cmp | OHP BB | 5×3-5 |
| 3 | chest / chest_upper / chest_lower | isol | Fly haltères | 3×5-8 |
| 4 | triceps | isol | Extension triceps BB/cable | 3×5-8 |
| 5 | shoulders_lateral / shoulders | isol | Écarté latéral | 3×5-8 |
| 6 | triceps | isol | Pushdown câble | 3×5-8 |
| 7 | core | — | Core #1 | 3×15 |

**Pull — Tirage** (strength, FULL, intermediate) :
| # | Slot | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement #2 | 2×10 |
| 1 | back_width / back | cmp | Tirage vertical (lat pulldown BB / traction lestée) | 5×3-5 |
| 2 | back_thickness / back | cmp | Rowing BB | 5×3-5 |
| 3 | back_thickness / back_width / back | isol | Pull-over / isolation dos | 3×5-8 |
| 4 | biceps | isol | Curl BB | 3×5-8 |
| 5 | shoulders_rear | isol | Face pull / oiseau | 3×5-8 |
| 6 | forearms | isol | Curl inversé / poignet curl | 3×5-8 |
| 7 | core | — | Core #2 | 3×15 |

**Legs — Jambes** (strength, FULL, intermediate) :
| # | Slot | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement #3 | 2×10 |
| 1 | quads | cmp | Squat BB | 5×3-5 |
| 2 | hamstrings / glutes | cmp | RDL BB (Romanian Deadlift) | 5×3-5 |
| 3 | quads | isol | Leg extension | 3×5-8 |
| 4 | glutes | isol | Hip abduction machine | 3×5-8 |
| 5 | hamstrings | isol | Leg curl | 3×5-8 |
| 6 | calves | isol | Mollets debout BB | 3×5-8 |
| 7 | core | — | Core #3 | 3×15 |

**Assertions : [PASS/FAIL]**
- Split ['push','pull','legs'] (ligne 302) : **PASS**
- Push contient chest compound + OHP (épaules) : **PASS** (slots 1 et 2)
- Pull contient dos (back_width/back) + biceps : **PASS** (slots 1, 4)
- Legs contient quads + hamstrings/glutes : **PASS** (slots 1 et 2)

### Coach

**Équilibre musculaire :**
- PPL classique : 1 séance push / 1 pull / 1 legs sur 3j.
- Ratio push/pull sur la semaine : 1 séance push (chest+OHP) / 1 séance pull (dos+biceps) → équilibre 1:1 ✓.
- Haut/bas du corps : 2 séances haut (push+pull) / 1 séance bas (legs) → ⚠️ haut du corps plus sollicité. Sur une semaine, jambes ne travaillent qu'1×. Acceptable pour un PPL 3j mais insuffisant si l'objectif inclut le développement des jambes.

**Cohérence objectif (strength) :**
- Squat 5×3-5 + RDL 5×3-5 : force pure, pertinent ✓.
- Développé couché BB 5×3-5 + OHP BB 5×3-5 : classique du programme force ✓.
- Isolations 3×5-8 en force : zone haute pour l'isolation, charge technique modérée, acceptable ✓.

**Adéquation durée / contenu (60 min) :**
- 8 exercices. Composés (2×5 séries) + isolations (4×3 séries) + warmup/core = 10+12+2+3 = 27 séries.
- Strength : ~3.5 min/série (temps set ~30s + repos 180s + installation). 27 × 3.5 = **94 min**. ❌ Excède encore 60 min.
- En pratique strength PPL : les composés mono-exercice (squat seul en force) permettent des transitions rapides. Estimation réaliste : ~75-80 min. Encore trop long pour 60 min strict.

**Variété inter-sessions :**
- Push / Pull / Legs : 3 types de séances radicalement différents → **Variété structurelle maximale** ✓.
- Aucune répétition inter-séances puisque chaque type cible des groupes musculaires distincts.

**Couverture isolation :**
- Push : triceps 2 slots isolation → bonne couverture ✓. Chest isolation 1 slot ✓. Shoulders_rear absent → acceptable (couvert en pull via face pull).
- Pull : biceps 1 slot, forearms 1 slot, shoulders_rear 1 slot → couverture complète ✓.
- Legs : quads isol + glutes isol + hamstrings isol + calves → couverture totale ✓.
- Verdict : **Couverture isolation complète** pour PPL ✓.

**Verdict global : ✅ Bon programme** — PPL strength intermediate est un classique éprouvé. Seul point de vigilance : le timing (27 séries force avec repos 180s) excède 60 min, mais c'est inhérent au protocole force, et les intermédiaires savent gérer leur temps.

---

## P04 — PPL hypertrophie intermediate 3j

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'intermediate' }
```

### Simulation

**Étape 1 — workoutTypeFromFocus([])**
- return **null** (ligne 253)

**Étape 2 — selectSplit**
- isMass = true (hypertrophy)
- daysPerWeek=3, intermediate :
  - `isMass && level !== 'beginner'` → true → `['push', 'pull', 'legs']` (ligne 302)
- Split interne = public : `['push', 'pull', 'legs']`

> Même split que P03. La branche PPL ne dépend pas de l'objectif (strength vs hypertrophy), seulement du niveau (intermediate+) et du isMass. (ligne 302)

**Étape 3 — adjustedSlotCount (60 min)**
- push : 6 → **6**, pull : 6 → **6**, legs : 6 → **6**

**Étape 5 — Séries × Reps (hypertrophy, 60 min)**
- Compound : 4×8-12
- Isolation : 3×10-15
- Warmup : 2×10 / Core : 3×15

Total par workout : 6 + 1 + 1 = **8 exercices**

**Étape 6 — Tables des exercices**

**Push — Poussée** (hypertrophy) :
| # | Slot | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement #1 | 2×10 |
| 1 | chest / chest_upper / chest_lower | cmp | Développé couché BB | 4×8-12 |
| 2 | shoulders / shoulders_front | cmp | OHP BB | 4×8-12 |
| 3 | chest / chest_upper / chest_lower | isol | Fly haltères | 3×10-15 |
| 4 | triceps | isol | Extension triceps câble | 3×10-15 |
| 5 | shoulders_lateral / shoulders | isol | Écarté latéral | 3×10-15 |
| 6 | triceps | isol | Pushdown câble | 3×10-15 |
| 7 | core | — | Core #1 | 3×15 |

**Pull — Tirage** (hypertrophy) :
| # | Slot | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement #2 | 2×10 |
| 1 | back_width / back | cmp | Tirage vertical | 4×8-12 |
| 2 | back_thickness / back | cmp | Rowing BB | 4×8-12 |
| 3 | back_thickness / back_width / back | isol | Pull-over DB | 3×10-15 |
| 4 | biceps | isol | Curl BB | 3×10-15 |
| 5 | shoulders_rear | isol | Face pull câble | 3×10-15 |
| 6 | forearms | isol | Curl inversé | 3×10-15 |
| 7 | core | — | Core #2 | 3×15 |

**Legs — Jambes** (hypertrophy) :
| # | Slot | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement #3 | 2×10 |
| 1 | quads | cmp | Squat BB | 4×8-12 |
| 2 | hamstrings / glutes | cmp | RDL BB | 4×8-12 |
| 3 | quads | isol | Leg extension | 3×10-15 |
| 4 | glutes | isol | Hip abduction machine | 3×10-15 |
| 5 | hamstrings | isol | Leg curl | 3×10-15 |
| 6 | calves | isol | Mollets debout | 3×10-15 |
| 7 | core | — | Core #3 | 3×15 |

**Assertions : [PASS/FAIL]**
- Split ['push','pull','legs'] identique à P03 (objectif ≠ n'affecte pas la branche, ligne 302) : **PASS**
- Reps dans la zone hypertrophie (8-12 composés, 10-15 isolation) : **PASS**

### Coach

**Équilibre musculaire :**
- Identique à P03 dans la structure, différent dans les specs.
- Push vs pull : 1:1 sur la semaine ✓. Haut/bas : 2:1 → ⚠️ mêmes réserves que P03.

**Cohérence objectif (hypertrophy) :**
- Composés 4×8-12 : zone hypertrophie standard ✓.
- Isolations 3×10-15 : zone hypertrophie optimale ✓.
- Volume par groupe : chest = 1 composé (4 séries) + 1 isolation (3 séries) = 7 séries/semaine. Minimum recommandé hypertrophie = 10-15 séries/semaine. ⚠️ PPL 3j est insuffisant en volume chest pour de l'hypertrophie sérieuse ; il faudrait 2× par semaine ou plus de slots chest.

**Adéquation durée / contenu (60 min) :**
- 8 exercices. Séries totales : 2×4 + 4×3 + 2 + 3 = 8+12+2+3 = 25 séries.
- Hypertrophy rest 90s : ~2.25 min/série. 25 × 2.25 = **56 min**. ✅ Tient en 60 min (contrairement à P03 strength).

**Variété inter-sessions :**
- PPL structure : variété structurelle maximale ✓.

**Couverture isolation :**
- Idem P03 : complète pour PPL ✓.

**Verdict global : ✅ Bon programme** — PPL hypertrophie intermediate est cohérent. Réserve : volume hebdomadaire par groupe (7-10 séries pour les principaux) est à la limite basse pour de l'hypertrophie maximale, mais acceptable pour un programme 3j.

---

## P05 — Endurance intermediate 3j → PPF (pas PPL)

```
{ goal:'endurance', daysPerWeek:3, sessionDuration:60, equipment:BW, level:'intermediate' }
```
BW = `['bodyweight']`

### Simulation

**Étape 1 — workoutTypeFromFocus([])**
- return **null** (ligne 253)

**Étape 2 — selectSplit**
- isMass = `'endurance' === 'strength' || 'endurance' === 'hypertrophy'` = **false** (ligne 280)
- daysPerWeek=3 (ligne 300) :
  - `isMass && level !== 'beginner'` → false (isMass=false)
  - `!isMass && level !== 'beginner'` → `true && true` = **true** → `['push', 'pull', 'fullbody-quad']` (ligne 304)
- Split interne : `['push', 'pull', 'fullbody-quad']`
- Split public : push→'push', pull→'pull', fullbody-quad→'fullbody' = `['push', 'pull', 'fullbody']`

**CRITIQUE :** branche ligne 304 — endurance (isMass=false) + intermediate → PPF (**pas** PPL ni fullbody×3). ✓

**Étape 3 — adjustedSlotCount (60 min)**
- push : 6 → **6**
- pull : 6 → **6**
- fullbody-quad : 9 → **9**

**Étape 5 — Séries × Reps (endurance, 60 min)**
- Compound : 3×15-20
- Isolation : 3×15-20
- Warmup : 2×10 / Core : 3×15

Total par workout :
- push : 6+1+1 = **8 exercices**
- pull : 6+1+1 = **8 exercices**
- fullbody-quad : 9+1+1 = **11 exercices**

**Nommage :**
- push : 1× → pas de suffixe → "Push — Poussée"
- pull : 1× → "Pull — Tirage"
- fullbody : 1× → "Full Body"

**Étape 6 — Tables des exercices**

Equipment BW only : seuls les exercices `equipment='bodyweight'` sont dans `available` (ligne 633).
Les exercices warmup/core sont filtrés par `allowed.has(ex.equipment) || ex.equipment === 'bodyweight'` (lignes 640, 644).

**Push — Poussée** (endurance, BW, intermediate) :
| # | Slot | Cat | Exercice générique BW | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement BW #1 | 2×10 |
| 1 | chest / chest_upper / chest_lower | cmp | Push-up | 3×15-20 |
| 2 | shoulders / shoulders_front | cmp | Pike push-up / HSPU | 3×15-20 |
| 3 | chest / chest_upper / chest_lower | isol | Push-up large / diamant | 3×15-20 |
| 4 | triceps | isol | Dips BW (banc) | 3×15-20 |
| 5 | shoulders_lateral / shoulders | isol | Prone Y-T / arm circle | 3×15-20 |
| 6 | triceps | isol | Triceps extension au sol | 3×15-20 |
| 7 | core | — | Planche | 3×15 |

**Pull — Tirage** (endurance, BW, intermediate) :
| # | Slot | Cat | Exercice générique BW | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement BW #2 | 2×10 |
| 1 | back_width / back | cmp | Pull-up / Traction BW | 3×15-20 |
| 2 | back_thickness / back | cmp | Inverted row / Australian pull-up | 3×15-20 |
| 3 | back_thickness / back_width / back | isol | Superman / isolation dos au sol | 3×15-20 |
| 4 | biceps | isol | Chin-up étroit | 3×15-20 |
| 5 | shoulders_rear | isol | Face pull BW (avec bandes si dispo) / oiseau sol | 3×15-20 |
| 6 | forearms | isol | Extension poignet au sol | 3×15-20 |
| 7 | core | — | Crunch | 3×15 |

**Full Body** (fullbody-quad, endurance, BW, intermediate) :
| # | Slot | Cat | Exercice générique BW | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement BW #3 | 2×10 |
| 1 | quads / glutes | cmp | Squat BW / Squat sauté | 3×15-20 |
| 2 | chest / chest_upper | cmp | Push-up (variant) | 3×15-20 |
| 3 | back_width / back_thickness / back | cmp | Pull-up (variant) / Inverted row | 3×15-20 |
| 4 | shoulders / shoulders_front | cmp | Pike push-up | 3×15-20 |
| 5 | hamstrings | isol | Nordic curl / pont ischios | 3×15-20 |
| 6 | shoulders_rear | isol | Oiseau au sol / Superman rear delt | 3×15-20 |
| 7 | biceps | isol | Chin-up prise serrée | 3×15-20 |
| 8 | triceps | isol | Dips BW / extension au sol | 3×15-20 |
| 9 | calves | isol | Mollets unijambiste BW | 3×15-20 |
| 10 | core | — | Crunch obliques | 3×15 |

**Assertions : [PASS/FAIL]**
- Split interne ['push','pull','fullbody-quad'] → public ['push','pull','fullbody'] (ligne 304) : **PASS**
- PPF et non PPL (isMass=false, ligne 302 non déclenchée) : **PASS**
- Noms sans suffixe A/B (chaque type 1×, ligne 706) : **PASS**
- Pas de doublon intra-workout : **PASS** (usedInWorkout)

### Coach

**Équilibre musculaire :**
- Push couvre chest+OHP + triceps + épaules latérales : bon équilibre push ✓.
- Pull couvre dos vertical+horizontal, biceps, épaules arrière, avant-bras ✓.
- ⚠️ BW only : le slot dos compound (pull cmp) à haute rep (15-20) en pull-up est très difficile — 3×15-20 pull-ups pour un intermédiaire est élite. Risque que le slot soit vide ou sous-optimal pour la majorité.

**Cohérence objectif (endurance) :**
- 3×15-20 : zone endurance ✓.
- BW + hautes répétitions = parfaitement adapté à l'endurance musculaire ✓.

**Adéquation durée / contenu (60 min) :**
- Push : 8 exercices, 22 séries. Endurance rest 60s : ~1.75 min/série. 22 × 1.75 = **38 min**. ✅ Tient.
- Pull : 8 exercices, 22 séries → ~38 min. ✅
- Full Body : 11 exercices, 31 séries. 31 × 1.75 = **54 min**. ✅ Tient juste.

**Jambes BW :**
- Slot quads/glutes en fullbody : squat BW à 3×15-20 est accessible ✓.
- Hamstrings isol BW : Nordic curl est très exigeant et peu adapté aux débutants → pour un intermédiaire, acceptable.
- ⚠️ Séances push/pull ne comportent aucun slot jambes → les jambes ne sont couvertes que 1×/semaine (fullbody). Insuffisant pour un programme endurance qui devrait inclure de la cardio et du travail fonctionnel jambes quotidien.

**Variété inter-sessions :**
- Push / Pull / Full Body : structures radicalement différentes → **Variété structurelle maximale** ✓.

**Couverture isolation :**
- Chest isolation : 1 slot push (isol chest) → couvert ✓.
- Jambes isolation : seulement en fullbody → fréquence 1×/semaine. **Lacune acceptable** dans le contexte PPF.
- Verdict : **Couverture isolation complète** pour PPF endurance.

**Verdict global : ✅ Bon programme** — PPF cohérent pour endurance intermediate BW. Réserve principale : 3×15-20 pull-ups en compound est irréaliste pour la majorité des intermédiaires ; un fallback vers inverted row ou assisted pull-up est nécessaire.

---

## P06 — Fat loss intermediate 3j → PPF (pas PPL)

```
{ goal:'fat_loss', daysPerWeek:3, sessionDuration:60, equipment:BW, level:'intermediate' }
```

### Simulation

**Étape 1 — workoutTypeFromFocus([])**
- return **null** (ligne 253)

**Étape 2 — selectSplit**
- isMass = `'fat_loss' === 'strength' || 'fat_loss' === 'hypertrophy'` = **false** (ligne 280)
- daysPerWeek=3, intermediate :
  - `!isMass && level !== 'beginner'` → true → `['push', 'pull', 'fullbody-quad']` (ligne 304)
- Split interne : `['push', 'pull', 'fullbody-quad']`
- Split public : `['push', 'pull', 'fullbody']`

**Même règle que P05** : fat_loss (isMass=false) + intermediate → PPF (ligne 304).

**Étape 3 — adjustedSlotCount (60 min)** : push=6, pull=6, fullbody-quad=9

**Étape 5 — Séries × Reps (fat_loss, 60 min)**
- Compound : 3×12-15 (restSec=60)
- Isolation : 3×12-15 (restSec=60)
- Warmup : 2×10 / Core : 3×15

**Nommage :** "Push — Poussée", "Pull — Tirage", "Full Body" (1× chaque, pas de suffixe)

**Étape 6 — Tables des exercices**

**Push — Poussée** (fat_loss, BW) :
| # | Slot | Cat | Exercice générique BW | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement BW #1 | 2×10 |
| 1 | chest / chest_upper / chest_lower | cmp | Push-up | 3×12-15 |
| 2 | shoulders / shoulders_front | cmp | Pike push-up | 3×12-15 |
| 3 | chest / chest_upper / chest_lower | isol | Push-up diamant | 3×12-15 |
| 4 | triceps | isol | Dips BW | 3×12-15 |
| 5 | shoulders_lateral / shoulders | isol | Prone Y-T | 3×12-15 |
| 6 | triceps | isol | Extension triceps sol | 3×12-15 |
| 7 | core | — | Planche | 3×15 |

**Pull — Tirage** (fat_loss, BW) :
| # | Slot | Cat | Exercice générique BW | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement BW #2 | 2×10 |
| 1 | back_width / back | cmp | Pull-up BW | 3×12-15 |
| 2 | back_thickness / back | cmp | Inverted row | 3×12-15 |
| 3 | back_thickness / back_width / back | isol | Superman | 3×12-15 |
| 4 | biceps | isol | Chin-up | 3×12-15 |
| 5 | shoulders_rear | isol | Rear delt fly sol | 3×12-15 |
| 6 | forearms | isol | Planche pronation | 3×12-15 |
| 7 | core | — | Crunch | 3×15 |

**Full Body** (fullbody-quad, fat_loss, BW) :
| # | Slot | Cat | Exercice générique BW | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement BW #3 | 2×10 |
| 1 | quads / glutes | cmp | Squat BW | 3×12-15 |
| 2 | chest / chest_upper | cmp | Push-up | 3×12-15 |
| 3 | back_width / back_thickness / back | cmp | Pull-up / Inverted row | 3×12-15 |
| 4 | shoulders / shoulders_front | cmp | Pike push-up | 3×12-15 |
| 5 | hamstrings | isol | Nordic curl / pont ischios | 3×12-15 |
| 6 | shoulders_rear | isol | Rear delt fly sol | 3×12-15 |
| 7 | biceps | isol | Chin-up | 3×12-15 |
| 8 | triceps | isol | Dips BW | 3×12-15 |
| 9 | calves | isol | Mollets unijambiste | 3×12-15 |
| 10 | core | — | Crunch obliques | 3×15 |

**Assertions : [PASS/FAIL]**
- Split public ['push','pull','fullbody'] (ligne 304, fat_loss → isMass=false) : **PASS**
- PPF et non PPL ni fullbody×3 : **PASS**
- Noms sans suffixe : **PASS**

### Coach

**Rapport cardio / force pour fat_loss :**
- Le programme génère de la musculation BW à 12-15 reps / 60s repos → format circuit-adjacent, métaboliquement stimulant ✓.
- ⚠️ Aucun cardio dédié dans le programme (pas de HIIT, pas de gainage à haute intensité, pas d'intervalles). Fat_loss avec musculation seule est moins efficace. Le générateur ne prévoit pas de composante cardio.
- Volume hebdomadaire : 3j × ~22-31 séries = 66-93 séries/semaine → élevé, compatible avec fat_loss (densité haute).

**Timing (60 min) :**
- Avec repos 60s : même calcul que P05 → push/pull ~38 min, fullbody ~54 min. ✅ Tient.

**Variété inter-sessions :**
- PPF : **Variété structurelle maximale** ✓.

**Couverture isolation :**
- Idem P05 (mêmes slots) → **Lacunes acceptables** (jambes 1×/semaine en fullbody seulement).

**Verdict global : ⚠️ Problème mineur** — PPF correctement identifié pour fat_loss intermediate BW. Réserve principale : absence de composante cardio dédiée dans un programme fat_loss ; les specs 3×12-15 + repos 60s créent de la densité mais pas de l'intensité cardio véritable. BW pull-up à 12-15 reps reste exigeant.

---

## P07 — Upper/Lower beginner 4j

```
{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'beginner' }
```

### Simulation

**Étape 1 — workoutTypeFromFocus([])**
- return **null** (ligne 253)

**Étape 2 — selectSplit**
- isMass = true (hypertrophy)
- daysPerWeek=4 (ligne 308) :
  - `isMass` → **true** → `['upper-push', 'lower-quad', 'upper-pull', 'lower-hip']` (ligne 310)
- Split interne : `['upper-push', 'lower-quad', 'upper-pull', 'lower-hip']`
- Split public : upper-push→'upper', lower-quad→'lower', upper-pull→'upper', lower-hip→'lower'
- Split public : `['upper', 'lower', 'upper', 'lower']`

**Étape 3 — adjustedSlotCount (60 min)**
- upper-push : 8 slots → **8**
- lower-quad : 6 slots → **6**
- upper-pull : 8 slots → **8**
- lower-hip : 6 slots → **6**

**Slots upper-push** (lignes 163–174) :
| # | Muscles | compound |
|---|---|---|
| 1 | chest, chest_upper | true — Développé couché |
| 2 | back_width, back_thickness, back | true — Tirage / rowing |
| 3 | shoulders, shoulders_front | true — OHP |
| 4 | chest, chest_lower, chest_upper | false — Fly pectoraux |
| 5 | triceps | false — Extension |
| 6 | shoulders_lateral | false — Écarté latéral |
| 7 | biceps | false — Curl |
| 8 | back_thickness, back | false — Isolation dos |

**Slots upper-pull** (lignes 175–186) :
| # | Muscles | compound |
|---|---|---|
| 1 | back_width, back | true — Traction |
| 2 | back_thickness, back | true — Rowing |
| 3 | chest, chest_upper | true — Développé incliné |
| 4 | shoulders_rear | false — Face pull |
| 5 | biceps | false — Curl |
| 6 | back_thickness, back | false — Isolation dos |
| 7 | triceps | false — Extension |
| 8 | shoulders_lateral | false — Écarté latéral |

**Slots lower-quad** (lignes 190–199) :
| # | Muscles | compound |
|---|---|---|
| 1 | quads, glutes | true — Squat / leg press |
| 2 | hamstrings, glutes | true — RDL |
| 3 | quads | false — Leg extension |
| 4 | hamstrings | false — Leg curl |
| 5 | glutes | false — Hip abduction |
| 6 | calves | false — Mollets |

**Slots lower-hip** (lignes 200–209) :
| # | Muscles | compound |
|---|---|---|
| 1 | glutes, hamstrings | true — Hip thrust / Sumo DL |
| 2 | quads, glutes | true — Fente bulgare / lunge |
| 3 | glutes | false — Cable kickback |
| 4 | hamstrings | false — Leg curl |
| 5 | quads | false — Leg extension |
| 6 | calves | false — Mollets |

**Étape 5 — Séries × Reps (hypertrophy, 60 min)**
- Compound : 4×8-12
- Isolation : 3×10-15
- Warmup : 2×10 / Core : 3×15

Total :
- upper-push : 8+1+1 = **10 exercices**
- lower-quad : 6+1+1 = **8 exercices**
- upper-pull : 8+1+1 = **10 exercices**
- lower-hip : 6+1+1 = **8 exercices**

**Nommage :**
- canon 'upper' : totalOfType = 2 (upper-push + upper-pull)
- canon 'lower' : totalOfType = 2 (lower-quad + lower-hip)
- Workout 1 (upper-push, count=1) → "Upper — Haut du corps A"
- Workout 2 (lower-quad, count=1) → "Lower — Bas du corps A"
- Workout 3 (upper-pull, count=2) → "Upper — Haut du corps B"
- Workout 4 (lower-hip, count=2) → "Lower — Bas du corps B"

**Étape 6 — Tables des exercices**

**Upper — Haut du corps A** (upper-push, hypertrophy, FULL, beginner, workouts.length=0) :
| # | Slot | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement #1 | 2×10 |
| 1 | chest / chest_upper | cmp | Développé couché | 4×8-12 |
| 2 | back_width / back_thickness / back | cmp | Tirage vertical | 4×8-12 |
| 3 | shoulders / shoulders_front | cmp | OHP | 4×8-12 |
| 4 | chest / chest_lower / chest_upper | isol | Fly haltères | 3×10-15 |
| 5 | triceps | isol | Extension triceps | 3×10-15 |
| 6 | shoulders_lateral | isol | Écarté latéral | 3×10-15 |
| 7 | biceps | isol | Curl biceps | 3×10-15 |
| 8 | back_thickness / back | isol | Isolation dos (pull-over) | 3×10-15 |
| 9 | core | — | Core #1 | 3×15 |

**Lower — Bas du corps A** (lower-quad, hypertrophy, FULL, beginner, workouts.length=1) :
| # | Slot | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement #2 | 2×10 |
| 1 | quads / glutes | cmp | Squat BB | 4×8-12 |
| 2 | hamstrings / glutes | cmp | RDL BB | 4×8-12 |
| 3 | quads | isol | Leg extension | 3×10-15 |
| 4 | hamstrings | isol | Leg curl | 3×10-15 |
| 5 | glutes | isol | Hip abduction machine | 3×10-15 |
| 6 | calves | isol | Mollets debout | 3×10-15 |
| 7 | core | — | Core #2 | 3×15 |

**Upper — Haut du corps B** (upper-pull, hypertrophy, FULL, beginner, workouts.length=2) :
| # | Slot | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement #3 | 2×10 |
| 1 | back_width / back | cmp | Traction / Lat pulldown (variant tirage vert.) | 4×8-12 |
| 2 | back_thickness / back | cmp | Rowing BB (variant) | 4×8-12 |
| 3 | chest / chest_upper | cmp | Développé incliné | 4×8-12 |
| 4 | shoulders_rear | isol | Face pull | 3×10-15 |
| 5 | biceps | isol | Curl marteau (variant) | 3×10-15 |
| 6 | back_thickness / back | isol | Isolation dos (variant) | 3×10-15 |
| 7 | triceps | isol | Pushdown câble | 3×10-15 |
| 8 | shoulders_lateral | isol | Écarté latéral (variant) | 3×10-15 |
| 9 | core | — | Core #3 | 3×15 |

**Lower — Bas du corps B** (lower-hip, hypertrophy, FULL, beginner, workouts.length=3) :
| # | Slot | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement #4 | 2×10 |
| 1 | glutes / hamstrings | cmp | Hip thrust / Sumo DL | 4×8-12 |
| 2 | quads / glutes | cmp | Fente bulgare / Lunge | 4×8-12 |
| 3 | glutes | isol | Cable kickback / Abducteur machine | 3×10-15 |
| 4 | hamstrings | isol | Leg curl (variant) | 3×10-15 |
| 5 | quads | isol | Leg extension (variant) | 3×10-15 |
| 6 | calves | isol | Mollets assis | 3×10-15 |
| 7 | core | — | Core #4 | 3×15 |

**Assertions : [PASS/FAIL]**
- Split interne ['upper-push','lower-quad','upper-pull','lower-hip'] (ligne 310) : **PASS**
- Split public ['upper','lower','upper','lower'] : **PASS**
- Noms "Upper — Haut du corps A", "Lower — Bas du corps A", "Upper — Haut du corps B", "Lower — Bas du corps B" (lignes 706–707) : **PASS**
- Upper A (upper-push) : 8 slots → 10 exercices : **PASS**
- Upper B (upper-pull) : 8 slots → 10 exercices : **PASS**
- Lower A (lower-quad) : 6 slots → 8 exercices : **PASS**
- Lower B (lower-hip) : 6 slots → 8 exercices : **PASS**
- Chaque lower inclut un slot calves isolation (lower-quad slot 6, lower-hip slot 6) : **PASS**
- Upper A : chest compound en tête (slot 1), puis back compound (slot 2), puis OHP (slot 3) : **PASS**
- Upper B : back compound en tête (slots 1-2), puis chest compound (slot 3) : **PASS**
- Lower A : quads/glutes compound (squat) en tête : **PASS**
- Lower B : glutes/hamstrings compound (hip hinge) en tête : **PASS**

### Coach

**Équilibre musculaire :**
- 2 upper (A=bench-first, B=pull-first) + 2 lower (A=quad-first, B=hip-first) → équilibre parfait haut/bas et push/pull ✓.
- Sur la semaine : chest 2× (composé), back 2× (composé), OHP 2×, jambes 2× → volume suffisant pour un débutant.
- Récupération upper A → upper B : si les 4 jours sont lundi-mardi-jeudi-vendredi (DAY_ASSIGNMENTS[4] ligne 332), upper A (lundi) → lower A (mardi) → upper B (jeudi) → lower B (vendredi). Repos upper A→B : 3 jours ✓.

**Cohérence objectif (hypertrophy) :**
- Composés 4×8-12 : zone hypertrophie ✓.
- Isolations 3×10-15 : zone hypertrophie ✓.
- Volume chest : 2 composés/semaine (upper A + incliné upper B) + 1 fly/semaine. Total ~11 séries chest/semaine ✓.
- Volume dos : 3 composés/semaine (tirage A + traction B + rowing B) + 2 isolation dos. Total ~18 séries → légèrement dominant par rapport au chest ✓ (favorable pour la posture).

**Adéquation durée / contenu (60 min) :**
- Upper (10 ex) : 3 composés × 4s + 5 isolations × 3s + 2 warmup + 3 core = 12+15+2+3 = 32 séries. 90s rest : ~2.25 min. 32 × 2.25 = **72 min**. ⚠️ Dépasse 60 min.
- Lower (8 ex) : 2 composés × 4s + 4 isolations × 3s + 2+3 = 8+12+2+3 = 25 séries. 25 × 2.25 = **56 min**. ✅

**Variété inter-sessions :**
- Upper A vs B : structure différenciée (bench-first vs pull-first, slots différents en composé, order différent en isolation) → **Variété structurelle** ✓.
- Lower A vs B : squat-dominant vs hip-dominant → structures réellement différentes ✓.
- Verdict : **Variété structurelle** pour les 4 séances ✓.

**Couverture isolation :**
- Upper A : chest isol (fly), triceps ×1, épaules latérales, biceps, dos isolation → complet ✓.
- Upper B : shoulders_rear (face pull obligatoire), biceps, dos isol, triceps, épaules lat → complet ✓.
- Lower : quads isol, hamstrings isol, glutes isol, calves dans les deux variants → complet ✓.
- Verdict : **Couverture isolation complète** ✓.

**Verdict global : ✅ Bon programme** — Upper/Lower A/B 4j hypertrophie est un split excellent, bien équilibré push/pull et haut/bas. Seul point : les séances upper (10 exercices) dépassent 60 min à 90s de repos ; légère surcharge pour un débutant.

---

## P08 — 5j intermediate PPL+UL

```
{ goal:'strength', daysPerWeek:5, sessionDuration:60, equipment:FULL, level:'intermediate' }
```

### Simulation

**Étape 1 — workoutTypeFromFocus([])**
- return **null** (ligne 253)

**Étape 2 — selectSplit**
- isMass = true (strength)
- daysPerWeek=5 (ligne 316) :
  - `isMass && level !== 'beginner'` → `true && true` = **true** → `['push', 'pull', 'legs', 'upper', 'lower']` (ligne 318)
- Split interne = public : `['push', 'pull', 'legs', 'upper', 'lower']`

**Étape 3 — adjustedSlotCount (60 min)**
- push : 6 → **6**
- pull : 6 → **6**
- legs : 6 → **6**
- upper : 8 → **8**
- lower : 6 → **6**

**Étape 5 — Séries × Reps (strength, 60 min)**
- Compound : 5×3-5
- Isolation : 3×5-8
- Warmup : 2×10 / Core : 3×15

Total :
- push : 6+1+1 = **8 exercices**
- pull : 6+1+1 = **8 exercices**
- legs : 6+1+1 = **8 exercices**
- upper : 8+1+1 = **10 exercices**
- lower : 6+1+1 = **8 exercices**

**Nommage :** Chaque type 1× → pas de suffixe.
"Push — Poussée", "Pull — Tirage", "Legs — Jambes", "Upper — Haut du corps", "Lower — Bas du corps"

**Étape 6 — Tables des exercices**

**Push — Poussée** (strength, FULL, intermediate) :
| # | Slot | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement #1 | 2×10 |
| 1 | chest / chest_upper / chest_lower | cmp | Développé couché BB | 5×3-5 |
| 2 | shoulders / shoulders_front | cmp | OHP BB | 5×3-5 |
| 3 | chest / chest_upper / chest_lower | isol | Fly haltères | 3×5-8 |
| 4 | triceps | isol | Extension triceps | 3×5-8 |
| 5 | shoulders_lateral / shoulders | isol | Écarté latéral | 3×5-8 |
| 6 | triceps | isol | Pushdown | 3×5-8 |
| 7 | core | — | Core #1 | 3×15 |

**Pull — Tirage** (strength, FULL, intermediate) :
| # | Slot | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement #2 | 2×10 |
| 1 | back_width / back | cmp | Tirage vertical lest. | 5×3-5 |
| 2 | back_thickness / back | cmp | Rowing BB | 5×3-5 |
| 3 | back_thickness / back_width / back | isol | Pull-over | 3×5-8 |
| 4 | biceps | isol | Curl BB | 3×5-8 |
| 5 | shoulders_rear | isol | Face pull | 3×5-8 |
| 6 | forearms | isol | Curl inversé | 3×5-8 |
| 7 | core | — | Core #2 | 3×15 |

**Legs — Jambes** (strength, FULL, intermediate) :
| # | Slot | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement #3 | 2×10 |
| 1 | quads | cmp | Squat BB | 5×3-5 |
| 2 | hamstrings / glutes | cmp | RDL BB | 5×3-5 |
| 3 | quads | isol | Leg extension | 3×5-8 |
| 4 | glutes | isol | Hip abduction | 3×5-8 |
| 5 | hamstrings | isol | Leg curl | 3×5-8 |
| 6 | calves | isol | Mollets debout | 3×5-8 |
| 7 | core | — | Core #3 | 3×15 |

**Upper — Haut du corps** (strength, FULL, intermediate, 8 slots) :

Slots upper (lignes 131–140) :
1. chest/chest_upper cmp, 2. back_width/back_thickness/back cmp, 3. shoulders/shoulders_front cmp,
4. shoulders_lateral/shoulders_rear isol, 5. back_thickness/back isol, 6. chest/chest_lower isol,
7. biceps isol, 8. triceps isol

| # | Slot | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement #4 | 2×10 |
| 1 | chest / chest_upper | cmp | Développé couché BB (variant/usedGlobally) | 5×3-5 |
| 2 | back_width / back_thickness / back | cmp | Tirage vertical (variant) | 5×3-5 |
| 3 | shoulders / shoulders_front | cmp | OHP BB (variant) | 5×3-5 |
| 4 | shoulders_lateral / shoulders_rear | isol | Écarté latéral | 3×5-8 |
| 5 | back_thickness / back | isol | Rowing horizontal (isol) | 3×5-8 |
| 6 | chest / chest_lower | isol | Fly bas / câble croisé | 3×5-8 |
| 7 | biceps | isol | Curl BB (variant) | 3×5-8 |
| 8 | triceps | isol | Extension (variant) | 3×5-8 |
| 9 | core | — | Core #4 | 3×15 |

**Lower — Bas du corps** (strength, FULL, intermediate, 6 slots) :

Slots lower (lignes 141–148) : quads cmp, hamstrings/glutes cmp, quads isol, glutes isol, hamstrings isol, calves isol

| # | Slot | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement #5 | 2×10 |
| 1 | quads | cmp | Leg press (squat utilisé dans Legs) | 5×3-5 |
| 2 | hamstrings / glutes | cmp | Deadlift conventionnel BB (RDL utilisé) | 5×3-5 |
| 3 | quads | isol | Leg extension (variant) | 3×5-8 |
| 4 | glutes | isol | Hip abduction (variant) | 3×5-8 |
| 5 | hamstrings | isol | Leg curl (variant) | 3×5-8 |
| 6 | calves | isol | Mollets assis | 3×5-8 |
| 7 | core | — | Core #5 | 3×15 |

**Assertions : [PASS/FAIL]**
- Split ['push','pull','legs','upper','lower'] (ligne 318) : **PASS**
- 5 workouts distincts : **PASS**

### Coach

**Récupération musculaire sur 5j :**
- Jours par défaut (DAY_ASSIGNMENTS[5]) : lundi–vendredi.
- Séquence : Push(lun), Pull(mar), Legs(mer), Upper(jeu), Lower(ven).
- Chest : Push lun + Upper jeu → 3j repos ✓.
- Dos : Pull mar + Upper jeu → 2j repos ⚠️ (relativement court pour la force).
- Jambes : Legs mer + Lower ven → 2j repos ⚠️ (squat mer + leg press ven, 2j entre les deux).
- Épaules : Push lun + Upper jeu → 3j ✓.
- ⚠️ 5j consécutifs sans repos obligatoire sur la semaine. Pour la force (charges maximales), la récupération est critique — risque de surmenage si la programmation est linéaire.

**Chevauchement Legs/Lower :**
- Legs (mer) : Squat BB + RDL + isolations quads/hamstrings.
- Lower (ven) : Leg press + Deadlift + même isolations.
- Intervalle : 2j. Pour force à 5×3-5, les composés jambes deux fois en 2j sont contraignants en récupération des quadriceps et lombaires.

**Cohérence strength :**
- Tous les composés 5×3-5 : zones force ✓.
- Upper : 3 composés × 5 séries = 15 séries composés strength en une séance → charge élevée mais cohérente pour un intermédiaire ✓.

**Adéquation durée (60 min) :**
- Push/Pull/Legs : 8 exercices, ~27 séries × 3.5 min = **94 min**. ❌
- Upper : 10 exercices, 3×5 + 5×3 + 2+3 = 15+15+2+3 = 35 séries × 3.5 = **122 min**. ❌ Très long.
- Lower : 8 exercices, 27 séries → **94 min**. ❌
- ⚠️ Timing structurellement impossible en 60 min avec repos force 180s. Programme de 90-120 min de facto.

**Verdict global : ⚠️ Problème mineur** — split correct et bien structuré, mais 5 séances strength en 5j consécutifs avec 180s de repos excède largement 60 min par séance et expose à un manque de récupération inter-séances pour les jambes et le dos.

---

## P09 — 5j beginner → upper/lower A/B + fullbody

```
{ goal:'hypertrophy', daysPerWeek:5, sessionDuration:60, equipment:FULL, level:'beginner' }
```

### Simulation

**Étape 1 — workoutTypeFromFocus([])**
- return **null** (ligne 253)

**Étape 2 — selectSplit**
- isMass = true (hypertrophy)
- daysPerWeek=5 (ligne 316) :
  - `isMass && level !== 'beginner'` → `true && false` = **false**
  - `if (isMass)` → **true** → `['upper-push', 'lower-quad', 'upper-pull', 'lower-hip', 'fullbody-quad']` (ligne 320)
- Split interne : `['upper-push', 'lower-quad', 'upper-pull', 'lower-hip', 'fullbody-quad']`
- Split public : upper-push→upper, lower-quad→lower, upper-pull→upper, lower-hip→lower, fullbody-quad→fullbody
- Split public : `['upper', 'lower', 'upper', 'lower', 'fullbody']`

**CRITIQUE** : ligne 320 — beginner+isMass+5j → upper/lower A/B + fullbody (**pas** fullbody×5). ✓
(fullbody×5 = seulement si `!isMass` + beginner, ligne 324)

**Étape 3 — adjustedSlotCount (60 min)**
- upper-push : 8 → **8**
- lower-quad : 6 → **6**
- upper-pull : 8 → **8**
- lower-hip : 6 → **6**
- fullbody-quad : 9 → **9**

**Étape 5 — Séries × Reps (hypertrophy, 60 min)**
- Compound : 4×8-12, Isolation : 3×10-15

Total :
- upper-push : 8+1+1 = **10**
- lower-quad : 6+1+1 = **8**
- upper-pull : 8+1+1 = **10**
- lower-hip : 6+1+1 = **8**
- fullbody-quad : 9+1+1 = **11**

**Nommage :**
- upper : totalOfType=2 → count 1→'A', count 2→'B'
- lower : totalOfType=2 → count 1→'A', count 2→'B'
- fullbody : totalOfType=1 → pas de suffixe
- "Upper — Haut du corps A" / "Lower — Bas du corps A" / "Upper — Haut du corps B" / "Lower — Bas du corps B" / "Full Body"

**Étape 6 — Tables des exercices**

**Upper — Haut du corps A** (upper-push, hypertrophy, FULL, beginner) :
*(structure identique à P07 Upper A)*
| # | Slot | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement #1 | 2×10 |
| 1 | chest / chest_upper | cmp | Développé couché | 4×8-12 |
| 2 | back_width / back_thickness / back | cmp | Tirage vertical | 4×8-12 |
| 3 | shoulders / shoulders_front | cmp | OHP | 4×8-12 |
| 4 | chest / chest_lower / chest_upper | isol | Fly haltères | 3×10-15 |
| 5 | triceps | isol | Extension triceps | 3×10-15 |
| 6 | shoulders_lateral | isol | Écarté latéral | 3×10-15 |
| 7 | biceps | isol | Curl biceps | 3×10-15 |
| 8 | back_thickness / back | isol | Isolation dos | 3×10-15 |
| 9 | core | — | Core #1 | 3×15 |

**Lower — Bas du corps A** (lower-quad, hypertrophy, FULL, beginner) :
| # | Slot | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement #2 | 2×10 |
| 1 | quads / glutes | cmp | Squat BB | 4×8-12 |
| 2 | hamstrings / glutes | cmp | RDL BB | 4×8-12 |
| 3 | quads | isol | Leg extension | 3×10-15 |
| 4 | hamstrings | isol | Leg curl | 3×10-15 |
| 5 | glutes | isol | Hip abduction | 3×10-15 |
| 6 | calves | isol | Mollets debout | 3×10-15 |
| 7 | core | — | Core #2 | 3×15 |

**Upper — Haut du corps B** (upper-pull, hypertrophy, FULL, beginner) :
| # | Slot | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement #3 | 2×10 |
| 1 | back_width / back | cmp | Traction / Lat pulldown | 4×8-12 |
| 2 | back_thickness / back | cmp | Rowing BB | 4×8-12 |
| 3 | chest / chest_upper | cmp | Développé incliné | 4×8-12 |
| 4 | shoulders_rear | isol | Face pull | 3×10-15 |
| 5 | biceps | isol | Curl marteau | 3×10-15 |
| 6 | back_thickness / back | isol | Isolation dos (variant) | 3×10-15 |
| 7 | triceps | isol | Pushdown | 3×10-15 |
| 8 | shoulders_lateral | isol | Écarté latéral | 3×10-15 |
| 9 | core | — | Core #3 | 3×15 |

**Lower — Bas du corps B** (lower-hip, hypertrophy, FULL, beginner) :
| # | Slot | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement #4 | 2×10 |
| 1 | glutes / hamstrings | cmp | Hip thrust / Sumo DL | 4×8-12 |
| 2 | quads / glutes | cmp | Fente bulgare | 4×8-12 |
| 3 | glutes | isol | Cable kickback | 3×10-15 |
| 4 | hamstrings | isol | Leg curl | 3×10-15 |
| 5 | quads | isol | Leg extension | 3×10-15 |
| 6 | calves | isol | Mollets assis | 3×10-15 |
| 7 | core | — | Core #4 | 3×15 |

**Full Body** (fullbody-quad, hypertrophy, FULL, beginner, workouts.length=4, usedGlobally dense) :
| # | Slot | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement #5 | 2×10 |
| 1 | quads / glutes | cmp | Leg press (squat + fente dans usedGlobally) | 4×8-12 |
| 2 | chest / chest_upper | cmp | Développé couché DB (variants BB utilisés) | 4×8-12 |
| 3 | back_width / back_thickness / back | cmp | Rowing DB (tirage vert. + rowing BB utilisés) | 4×8-12 |
| 4 | shoulders / shoulders_front | cmp | OHP DB (variant) | 4×8-12 |
| 5 | hamstrings | isol | Nordic curl (leg curl utilisé) | 3×10-15 |
| 6 | shoulders_rear | isol | Face pull (variant) | 3×10-15 |
| 7 | biceps | isol | Curl concentration (variants utilisés) | 3×10-15 |
| 8 | triceps | isol | Dips BW (pushdown utilisé) | 3×10-15 |
| 9 | calves | isol | Mollets unijambiste | 3×10-15 |
| 10 | core | — | Core #5 | 3×15 |

**Assertions : [PASS/FAIL]**
- Split public ['upper','lower','upper','lower','fullbody'] (ligne 320) : **PASS**
- Types internes upper-push/lower-quad/upper-pull/lower-hip/fullbody-quad : **PASS**
- Noms corrects avec A/B et "Full Body" sans suffixe : **PASS**
- beginner + isMass → upper/lower A/B + fullbody (pas fullbody×5) : **PASS** (ligne 320 vs 324)
- Exercices : upper=10, lower=8, upper=10, lower=8, fullbody=11 : **PASS**

### Coach

**Volume pour un débutant en hypertrophie 5j :**
- 5 séances / semaine pour un débutant est très ambitieux. Le risque principal est le surmenage et l'abandon.
- Volume total : upper A (32 séries) + lower A (25) + upper B (32) + lower B (25) + fullbody (36) = **150 séries/semaine**. C'est le volume d'un programme intermédiaire avancé.
- ⚠️ Pour un débutant, 3j sont généralement suffisants. 5j avec ce volume est excessif et contre-productif.

**Jours par défaut (DAY_ASSIGNMENTS[5])** : lun-mar-mer-jeu-ven.
- Upper A (lun) → Lower A (mar) → Upper B (mer) → Lower B (jeu) → Full Body (ven).
- Repos entre Upper A et B : 2j (lun→mer). Chest apparaît en upper A (bench) + upper B (incliné) + fullbody (bench DB) = 3× en 5j avec peu de repos entre certaines apparitions.
- Jambes : lower A (mar) + lower B (jeu) + fullbody (ven) → jambes 3× en 5j. ⚠️

**Cohérence objectif :**
- 4×8-12 composés + 3×10-15 isolations : zone hypertrophie ✓.
- usedGlobally force la variation des exercices entre séances → variété ✓.

**Timing (60 min) :**
- Upper (10 ex) : ~72 min ⚠️. Lower (8 ex) : ~56 min ✅. Fullbody (11 ex) : ~72-80 min ⚠️.

**Verdict global : ⚠️ Problème mineur** — split correctement calculé (assertions toutes PASS), structure UL A/B + fullbody pertinente en théorie. Réserve principale : 5j/semaine + ce volume pour un débutant est excessif ; risque élevé de surmenage et d'abandon. Le générateur devrait alerter sur la charge pour les débutants à 5j.

---

## P10 — 2j intermediate → toujours fullbody

```
{ goal:'strength', daysPerWeek:2, sessionDuration:60, equipment:BB+DB, level:'intermediate' }
```
BB+DB = `['barbell', 'dumbbell']`

### Simulation

**Étape 1 — workoutTypeFromFocus([])**
- return **null** (ligne 253)

**Étape 2 — selectSplit**
- isMass = true (strength), level=intermediate
- daysPerWeek=2 → case 2 (ligne 298) → `['fullbody-quad', 'fullbody-hip']`
- **CRITIQUE** : 2j = fullbody toujours, peu importe le niveau ou l'objectif (ligne 298 sans condition). ✓
- Split interne : `['fullbody-quad', 'fullbody-hip']`
- Split public : `['fullbody', 'fullbody']`

**Étape 3 — adjustedSlotCount (60 min)**
- fullbody-quad : 9 → **9**
- fullbody-hip : 9 → **9**

**Étape 5 — Séries × Reps (strength, 60 min)**
- Compound : 5×3-5 (restSec=180)
- Isolation : 3×5-8 (restSec=120)

Total par workout : 9+1+1 = **11 exercices**

**Priorité barbell (goal=strength, compound) :**
- `pickExercise` trie selon `strengthEquipmentPrio` (ligne 473) pour `goal === 'strength' && slot.compound`.
- `strengthEquipmentPrio('barbell')` = 0 (ligne 426).
- `strengthEquipmentPrio('dumbbell')` = 2 (ligne 430).
- → Barbell classé avant dumbbell pour tous les slots composés en strength ✓.

**Nommage :**
- fullbody apparaît 2× → "Full Body A", "Full Body B"

**Étape 6 — Tables des exercices**

**Full Body A** (fullbody-quad, strength, BB+DB, intermediate, workouts.length=0) :
| # | Slot | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement BB/DB #1 | 2×10 |
| 1 | quads / glutes | cmp | **Squat BB** (barbell prio 0 < dumbbell prio 2) | 5×3-5 |
| 2 | chest / chest_upper | cmp | **Développé couché BB** (barbell prioritaire) | 5×3-5 |
| 3 | back_width / back_thickness / back | cmp | **Rowing BB** (barbell prioritaire) | 5×3-5 |
| 4 | shoulders / shoulders_front | cmp | **OHP BB** (barbell prioritaire) | 5×3-5 |
| 5 | hamstrings | isol | Leg curl DB | 3×5-8 |
| 6 | shoulders_rear | isol | Face pull DB / oiseau | 3×5-8 |
| 7 | biceps | isol | Curl BB | 3×5-8 |
| 8 | triceps | isol | Extension BB / DB | 3×5-8 |
| 9 | calves | isol | Mollets BB / DB | 3×5-8 |
| 10 | core | — | Core #1 | 3×15 |

**Full Body B** (fullbody-hip, strength, BB+DB, intermediate, workouts.length=1, usedGlobally=A) :
| # | Slot | Cat | Exercice générique | Séries×Reps |
|---|---|---|---|---|
| 0 | warmup | — | Échauffement BB/DB #2 | 2×10 |
| 1 | hamstrings / glutes | cmp | **Deadlift BB** (barbell prio, RDL vs hip thrust via usedGlobally) | 5×3-5 |
| 2 | chest / chest_upper | cmp | **Développé incliné BB** (bench BB utilisé en A) | 5×3-5 |
| 3 | back_width / back | cmp | **Traction lestée / Lat pulldown BB** (rowing BB utilisé en A) | 5×3-5 |
| 4 | shoulders / shoulders_front | cmp | **OHP DB** (OHP BB utilisé en A) | 5×3-5 |
| 5 | quads | isol | Leg extension DB / Fente DB | 3×5-8 |
| 6 | shoulders_lateral / shoulders_rear | isol | Écarté latéral DB | 3×5-8 |
| 7 | biceps | isol | Curl DB (curl BB utilisé en A) | 3×5-8 |
| 8 | triceps | isol | Extension DB (variant) | 3×5-8 |
| 9 | calves | isol | Mollets assis BB / DB | 3×5-8 |
| 10 | core | — | Core #2 | 3×15 |

**Assertions : [PASS/FAIL]**
- Split ['fullbody','fullbody'] peu importe niveau (case 2 sans condition, ligne 298) : **PASS**
- Barbell prioritaire pour composés strength (strengthEquipmentPrio, ligne 473) : **PASS**
- 11 exercices par workout : **PASS**

### Coach

**Programme 2j — contenu raisonnable :**
- 2j/semaine : fréquence minimale, acceptable pour un maintien ou un débutant. Pour un intermédiaire en force, 2j est sous-optimal (la littérature recommande 3-4j pour force intermédiaire).
- 11 exercices × 2j = 22 sessions/semaine, mais les groupes musculaires ne sont touchés que 2×/semaine → volume hebdomadaire limité.
- Squat BB + Deadlift BB dans la même semaine (A vs B) : 2 grands composés lombaires — les lombaires sont sollicitées très lourdement. ⚠️ Attention à la récupération lombaire entre lundi et jeudi (DAY_ASSIGNMENTS[2] = lundi/jeudi) : 3 jours de repos → acceptable.

**Barbell effectivement privilégié :**
- Les 4 composés de chaque séance sont barbell (squat, bench, row, OHP en A ; deadlift, incliné BB, traction lestée, OHP DB en B) → BB prioritaire respecté ✓.
- OHP en B passe sur DB car OHP BB est déjà dans usedGlobally → comportement correct et attendu.

**Timing (60 min, strength 180s repos) :**
- 11 exercices. Composés 4×5s + isolations 5×3s + 2+3 = 20+15+2+3 = 40 séries.
- 40 × 3.5 min = **140 min**. ❌ Très largement au-dessus de 60 min.
- ⚠️ Un programme strength fullbody 11 exercices en 60 min est irréaliste avec repos 180s. En pratique, un intermédiaire strength fait 4-5 exercices en 60 min.

**Variété inter-sessions :**
- A (fullbody-quad, squat-dominant) vs B (fullbody-hip, deadlift-dominant) → **Variété structurelle** ✓.

**Couverture isolation :**
- Chest isolation : absent (pas de slot fly dans fullbody-quad/hip) → lacune notable pour un intermédiaire.
- Calves : présents dans les 2 séances ✓.
- Glutes isol : absent en fullbody-quad, partiel en fullbody-hip (slot quads/glutes isol) → acceptable.
- Verdict : **Lacunes acceptables** dans le contexte force 2j.

**Verdict global : ⚠️ Problème mineur** — split et priorité barbell corrects. Réserves : (1) timing 140 min pour 60 min ciblées est structurellement impossible, (2) 2j/semaine force pour un intermédiaire est sous-optimal, (3) cumul lombaire squat+deadlift sur 2 séances espacées de 3j à demander une surveillance.

---

## Récapitulatif Groupe A — Tableau de synthèse P01–P10

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|--------|----------------------|---------|---|
| P01 | Split fullbody-quad/hip → public fullbody×2 ; 11 ex/workout ; noms A/B | ✅ PASS | Timing estimé 70-90 min > 60 min cible ; absence de chest isolation sur 2j |
| P02 | Beginner reste fullbody en strength ; split fullbody×3 ; noms A/B/C | ✅ PASS | 5×3-5 pour débutant techniquement hasardeux ; timing ~120 min >> 60 min avec repos 180s |
| P03 | PPL correctement déclenché (isMass+intermediate) ; dos+biceps en pull ; chest+OHP en push ; quads+ham en legs | ✅ PASS | Timing ~94 min > 60 min avec repos 180s (inhérent au protocole force) ; jambes 1×/semaine seulement |
| P04 | PPL identique à P03 (objectif n'affecte pas la branche) ; specs 4×8-12 en zone hypertrophie | ✅ PASS | Volume par groupe (7-10 séries/semaine) à la limite basse pour hypertrophie max ; jambes 1×/semaine |
| P05 | PPF correctement déclenché (endurance → !isMass, intermediate) ; pas de suffixe A/B ; BW only filtré | ✅ PASS | 3×15-20 pull-ups en composé irréaliste pour la majorité ; jambes couvertes 1×/semaine seulement |
| P06 | PPF correctement déclenché (fat_loss → !isMass, intermediate) ; pas de suffixe A/B | ✅ PASS | Aucune composante cardio dédiée dans programme fat_loss ; pull-up 12-15 reps exigeant en BW |
| P07 | Split upper-push/lower-quad/upper-pull/lower-hip ; 10/8/10/8 exercices ; noms A/B corrects ; calves dans les 2 lower | ✅ PASS | Séances upper (10 ex, 32 séries) estimées à ~72 min > 60 min cible |
| P08 | Split PPL+UL 5 workouts distincts ; chaque type 1× sans suffixe | ✅ PASS | Jambes 3j/5j (Legs mer + Lower ven) avec seulement 2j repos entre elles ; timing ~94-122 min/séance >> 60 min ; 5j consécutifs sans repos |
| P09 | Split isMass+beginner+5j = upper/lower A/B + fullbody (pas fullbody×5) ; 10/8/10/8/11 exercices | ✅ PASS | Volume 150 séries/semaine excessif pour un débutant ; jambes 3×/semaine sur 5j consécutifs ; timing upper et fullbody > 60 min |
| P10 | 2j = fullbody toujours (pas de condition sur niveau) ; barbell prioritaire en composés strength | ✅ PASS | Timing ~140 min >> 60 min avec repos 180s ; 2j/semaine sous-optimal pour intermédiaire force ; cumul lombaire squat+deadlift à surveiller |

---

## Synthèse des problèmes ouverts — Groupe A

### Bugs / anomalies logicielles

Aucune assertion FAIL dans les profils P01–P10. Toutes les assertions techniques PASS.

### Réserves coach cumulées — patterns récurrents

**1. Timing systématiquement dépassé (tous profils)**
- Concernés : P01, P02, P03, P08, P09, P10 (particulièrement)
- Cause : le générateur alloue les slots sur la base des durées théoriques, mais les specs strength (180s repos) rendent pratiquement tous les programmes >60 min. Même l'hypertrophie (90s) dépasse 60 min pour les séances de 10+ exercices.
- Recommandation : `adjustedSlotCount` pour 60 min devrait être plus restrictif selon le goal. Exemple : strength 60 min → réduire les slots composés à 3-4 max. Ou adapter `adjustedSpec` pour réduire les séries selon le goal et la durée réelle.

**2. Spécifications 5×3-5 inadaptées aux débutants (P02)**
- Concernés : P02 (strength + beginner)
- Le générateur produit 5×3-5 pour un débutant strength sans distinction. Les débutants en force devraient faire 3×8-12 puis progresser vers 5×5 avant d'atteindre 5×3-5.
- Recommandation : ajouter une branche level='beginner' dans COMPOUND_SPEC pour strength → ex. `{ sets:3, repsMin:5, repsMax:8 }` au lieu de `{ sets:5, repsMin:3, repsMax:5 }`.

**3. Absence de chest isolation dans les fullbody (P01, P02, P10)**
- Les patterns fullbody-quad/hip ne comportent aucun slot chest isolation (fly, câble croisé).
- Les patterns upper (P07, P09) compensent via le slot `chest/chest_lower/chest_upper compound:false` (fly).
- Recommandation : ajouter un slot `chest isolation` dans fullbody-quad ou fullbody-hip, quitte à réduire un autre slot isolation moins critique.

**4. Jambes sous-représentées dans PPL/PPF (P03, P04, P05, P06)**
- En PPL 3j et PPF 3j, les jambes n'apparaissent qu'en séance Legs ou fullbody (1×/semaine).
- Pour l'hypertrophie et la force, 1×/semaine est insuffisant (recommandation : 2×/semaine minimum).
- Recommandation : pour PPL 4j, le générateur pourrait proposer PPL+Legs (P08 résout ce problème en 5j).

**5. Volume débutant excessif à 5j (P09)**
- beginner+isMass+5j génère upper/lower A/B + fullbody = ~150 séries/semaine, soit le volume d'un programme intermédiaire confirmé.
- Recommandation : avertissement ou plafonnement automatique du volume pour level='beginner' indépendamment du daysPerWeek.

**6. Pull-up BW à hautes répétitions (P05, P06)**
- En BW + endurance/fat_loss, le slot dos compound génère 3×15-20 pull-ups, ce qui est élite.
- Le slot est techniquement fonctionnel (filterByEquipment retourne les pull-ups BW), mais irréaliste pour la quasi-totalité des utilisateurs.
- Recommandation : ajouter une logique de fallback (inverted row, australian pull-up) pour les slots dos compound BW à haute répétition, ou accepter l'exercice mais noter la difficulté.

**7. Timing incompatible pour fullbody strength 2j (P10)**
- 11 exercices × 40 séries × 3.5 min/série (180s repos) = 140 min pour une cible de 60 min.
- La combinaison 2j+strength+fullbody génère des programmes de facto de 90-140 min, non annoncés à l'utilisateur.
