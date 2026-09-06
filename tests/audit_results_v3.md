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

---

# Audit P11–P20 — Groupe B : focusMuscles override

> Simulation complète de `generateProgramDraft` pour les profils P11 à P20.
> Code de référence : `src/utils/programGenerator.ts`.
> Étapes tracées : 1 (workoutTypeFromFocus), 2 (selectSplit), 3 (adjustedSlotCount + reorderSlotsByFocus), 5 (séries×reps).
> Étape 4 (pickExercise depuis seed) non applicable au groupe B (seed requis uniquement pour P21–P26).

---

## Rappel des constantes utilisées

```
COMPOUND_SPEC['hypertrophy'] = { sets:4, repsMin:8,  repsMax:12, restSec:90  }
ISOLATION_SPEC['hypertrophy'] = { sets:3, repsMin:10, repsMax:15, restSec:75  }
WARMUP_SPEC                   = { sets:2, repsMin:10, repsMax:10, restSec:0   }
CORE_SPEC                     = { sets:3, repsMin:15, repsMax:15, restSec:60  }

adjustedSlotCount(base, 60) → base        (durée de référence, inchangé)
adjustedSlotCount(base, 45) → max(3, floor(base × 0.75))
adjustedSlotCount(base, 20) → max(2, floor(base × 0.5))
adjustedSlotCount(base, 90) → min(base+2, 8)

Base de slots par type interne :
  push / pull / legs / upper / lower  → 6 / 6 / 6 / 8 / 6
  upper-push / upper-pull             → 8 / 8
  lower-quad / lower-hip              → 6 / 6
  fullbody-quad / fullbody-hip        → 9 / 9
```

---

## P11 — chest seul → push

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:['dumbbell'],
  level:'beginner', focusMuscles:['chest'] }
```

### Étape 1 — workoutTypeFromFocus(['chest'])

| Flag      | Valeur | Raison                                   |
|-----------|--------|------------------------------------------|
| hasLower  | false  | 'legs' absent                            |
| hasPush   | true   | 'chest' présent → `includes('chest')`   |
| hasPull   | false  | 'back' absent                            |
| hasArms   | false  | 'arms' absent                            |
| hasCore   | false  | 'core' absent                            |
| hasUpper  | true   | hasPush=true                             |

Branche activée : `hasPush && !hasPull && !hasLower` → **retourne `'push'`** (ligne 269)

### Étape 2 — selectSplit

focusType='push' ≠ 'lower' → `Array.from({ length:2 }, () => 'push')`

- Types internes : `['push', 'push']`
- Types publics  : `['push', 'push']` (push est déjà un type public)
- Noms : "Push — Poussée A", "Push — Poussée B"

### Étape 3 — Slots pour Push (60 min, focusedMuscles={chest, chest_upper, chest_lower})

`SLOTS['push']` (6 slots), `adjustedSlotCount(6, 60)` → **6 slots retenus**.

reorderSlotsByFocus : composés ciblés chest en tête, OHP après ; isolations chest d'abord, puis triceps/lat.

| # | Muscles cibles | Cat | Focus? |
|---|---------------|-----|--------|
| 1 | chest, chest_upper, chest_lower | compound  | ✓ |
| 2 | shoulders, shoulders_front      | compound  | ✗ |
| 3 | chest, chest_upper, chest_lower | isolation | ✓ |
| 4 | triceps                         | isolation | ✗ |
| 5 | shoulders_lateral, shoulders    | isolation | ✗ |
| 6 | triceps                         | isolation | ✗ |

(+ warmup en tête, core en queue)

### Étape 5 — Séries × répétitions (hypertrophy, 60 min)

| Slot | Cat      | Séries × Reps | Repos  |
|------|----------|---------------|--------|
| 0    | warmup   | 2 × 10        | 0 s    |
| 1    | compound | 4 × 8-12      | 90 s   |
| 2    | compound | 4 × 8-12      | 90 s   |
| 3    | isolation| 3 × 10-15     | 75 s   |
| 4    | isolation| 3 × 10-15     | 75 s   |
| 5    | isolation| 3 × 10-15     | 75 s   |
| 6    | isolation| 3 × 10-15     | 75 s   |
| core | core     | 3 × 15        | 60 s   |

Total sets par séance : 2+8+8+3+3+3+3+3 = **33 sets**.

Variation A→B : usedGlobally force des exercices différents pour chaque slot commun. Les deux séances sont structurellement identiques (mêmes 6 slots dans le même ordre) — seuls les exercices changent si le pool est suffisant.

### Assertions [PASS/FAIL]

- `workoutTypeFromFocus(['chest'])` = `'push'` : **PASS** (ligne 269)
- Split = `['push','push']` : **PASS** (ligne 293)
- Exercices chest compound en tête (reorderSlotsByFocus) : **PASS** (ligne 669)
- Nombre de slots = 6 (base=6, 60 min) : **PASS** (ligne 671)

### Coach

**Équilibre musculaire :** Programme de spécialisation chest. Aucune séance pull ni lower — déséquilibre agoniste/antagoniste (pec-deltoïde antérieur sur-sollicité, dos et jambes absents). Acceptable uniquement comme programme d'appoint, pas comme programme principal.

**Cohérence objectif :** 4×8-12 hypertrophie → correct. Deux slots triceps (slots 4 et 6) = sur-représentation triceps relative au reste du programme.

**Durée/contenu :** 33 sets × ~3 min estimé (90 s rest compound, 75 s isolation) = ~90 min réels vs 60 min annoncés. ⚠️ Le générateur ne réduit pas les slots pour 60 min (c'est la base), mais le volume réel dépasse la fenêtre pour un beginner.

**Équipement :** DB seul — pas de barbell bench possible. En hypertrophie c'est acceptable (dumbell bench, incliné DB, etc.).

**Variété inter-sessions :** Variété d'exercices seulement (mêmes 6 slots, exercices différents si le pool DB chest est suffisant). Si le seed a < 2 exercices compound chest en dumbbell → doublon inévitable entre A et B.

**Verdict :** ⚠️ Problème mineur — programme unilatéral push sans pull/lower, volume réel probablement supérieur à 60 min, risque de doublon si pool DB étroit.

---

## P12 — back seul → pull

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60,
  equipment:['barbell','dumbbell','cable'], level:'beginner',
  focusMuscles:['back'] }
```

### Étape 1 — workoutTypeFromFocus(['back'])

| Flag      | Valeur | Raison                  |
|-----------|--------|-------------------------|
| hasLower  | false  | 'legs' absent           |
| hasPush   | false  | 'chest'/'shoulders' absents |
| hasPull   | true   | 'back' présent          |
| hasArms   | false  | 'arms' absent           |
| hasCore   | false  | 'core' absent           |
| hasUpper  | true   | hasPull=true            |

Branche activée : `hasPull && !hasPush && !hasLower` → **retourne `'pull'`** (ligne 271)

### Étape 2 — selectSplit

focusType='pull' ≠ 'lower' → `Array.from({ length:3 }, () => 'pull')`

- Types internes : `['pull', 'pull', 'pull']`
- Types publics  : `['pull', 'pull', 'pull']`
- Noms : "Pull — Tirage A", "Pull — Tirage B", "Pull — Tirage C"

### Étape 3 — Slots pour Pull (60 min, focusedMuscles={back, back_width, back_thickness})

`SLOTS['pull']` (6 slots), `adjustedSlotCount(6, 60)` → **6 slots retenus**.

reorderSlotsByFocus : tous les composés dos ont focus → ordre inchangé. Slot isolation back (slot 2 original) remonte avant biceps/rear delts/forearms.

| # | Muscles cibles | Cat | Focus? |
|---|---------------|-----|--------|
| 1 | back_width, back                            | compound  | ✓ |
| 2 | back_thickness, back                        | compound  | ✓ |
| 3 | back_thickness, back_width, back            | isolation | ✓ |
| 4 | biceps                                      | isolation | ✗ |
| 5 | shoulders_rear                              | isolation | ✗ |
| 6 | forearms                                    | isolation | ✗ |

(+ warmup + core)

### Étape 5 — Séries × répétitions (hypertrophy, 60 min)

| Slot | Cat      | Séries × Reps | Repos |
|------|----------|---------------|-------|
| 0    | warmup   | 2 × 10        | 0 s   |
| 1    | compound | 4 × 8-12      | 90 s  |
| 2    | compound | 4 × 8-12      | 90 s  |
| 3    | isolation| 3 × 10-15     | 75 s  |
| 4    | isolation| 3 × 10-15     | 75 s  |
| 5    | isolation| 3 × 10-15     | 75 s  |
| 6    | isolation| 3 × 10-15     | 75 s  |
| core | core     | 3 × 15        | 60 s  |

Variation A→B→C : usedGlobally force rotation des exercices. BB+DB+CABLE offre un pool riche pour le dos.

### Assertions [PASS/FAIL]

- `workoutTypeFromFocus(['back'])` = `'pull'` : **PASS** (ligne 271)
- Split = `['pull','pull','pull']` : **PASS** (ligne 293)
- Slots back compound en tête : **PASS**
- Nombre de slots = 6 : **PASS**

### Coach

**Équilibre musculaire :** Spécialisation pull. Aucun push, aucun lower. Acceptable en isolation mais pas comme programme principal.

**Cohérence objectif :** 4×8-12 pour composés dos → correct. Le slot forearms (slot 6) est souvent négligé dans les programmes classiques — présence ici pertinente.

**Durée/contenu :** Même calcul que P11 — ~90 min réels vs 60 annoncés. ⚠️

**Équipement :** BB+DB+CABLE → pool riche, excellent pour le dos (tirage barre, cable, rowing DB). Bonne exploitation.

**Variété inter-sessions :** Variété d'exercices avec pool BB+DB+CABLE large. Avec 3 sessions, le pool back doit contenir ≥ 3 exercices compound distincts. BB+DB+CABLE → très probable.

**Verdict :** ⚠️ Problème mineur — programme unilatéral pull sans push/lower, timing sous-estimé.

---

## P13 — legs seul → lower×4 BW

```
{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:['bodyweight'],
  level:'beginner', focusMuscles:['legs'] }
```

### Étape 1 — workoutTypeFromFocus(['legs'])

| Flag      | Valeur | Raison                |
|-----------|--------|-----------------------|
| hasLower  | true   | 'legs' présent        |
| hasPush   | false  |                       |
| hasPull   | false  |                       |
| hasArms   | false  |                       |
| hasCore   | false  |                       |
| hasUpper  | false  | hasPush=hasPull=hasArms=false |

Branche activée : `hasLower && !hasUpper` → **retourne `'lower'`** (ligne 263)

### Étape 2 — selectSplit

focusType='lower' → branche `lower` spéciale (ligne 287-290) :

```
Array.from({ length:4 }, (_, i) => i%2===0 ? 'lower-quad' : 'lower-hip')
→ ['lower-quad', 'lower-hip', 'lower-quad', 'lower-hip']
```

- Types internes : `['lower-quad', 'lower-hip', 'lower-quad', 'lower-hip']`
- Types publics  : `['lower', 'lower', 'lower', 'lower']`

Nommage (canon='lower', total=4, suffixes A/B/C/D) :
- lower-quad (count=1) → "Lower — Bas du corps A"
- lower-hip  (count=2) → "Lower — Bas du corps B"
- lower-quad (count=3) → "Lower — Bas du corps C"
- lower-hip  (count=4) → "Lower — Bas du corps D"

### Étape 3 — Slots (60 min, focusedMuscles={quads, hamstrings, glutes, calves})

`adjustedSlotCount(6, 60)` → **6 slots** pour lower-quad et lower-hip.

Tous les slots lower-quad et lower-hip contiennent des muscles legs → reorderSlotsByFocus ne change pas l'ordre (tous aF=0).

**Lower-quad (A et C) :**

| # | Muscles cibles | Cat | Ordre original preservé |
|---|---------------|-----|------------------------|
| 1 | quads, glutes        | compound  | Squat / leg press |
| 2 | hamstrings, glutes   | compound  | RDL                |
| 3 | quads                | isolation | Leg extension      |
| 4 | hamstrings           | isolation | Leg curl           |
| 5 | glutes               | isolation | Hip abduction      |
| 6 | calves               | isolation | Calf raise         |

**Lower-hip (B et D) :**

| # | Muscles cibles | Cat | Ordre original preservé |
|---|---------------|-----|------------------------|
| 1 | glutes, hamstrings   | compound  | Hip thrust / sumo DL |
| 2 | quads, glutes        | compound  | Fente / lunge        |
| 3 | glutes               | isolation | Cable kickback       |
| 4 | hamstrings           | isolation | Leg curl             |
| 5 | quads                | isolation | Leg extension        |
| 6 | calves               | isolation | Calf raise           |

Différenciation structurelle A/C vs B/D : composé 1 = squat-dominant vs hip-thrust-dominant → **variété structurelle réelle**.

Sessions A et C (lower-quad) : même structure, exercices différents forcés par usedGlobally.
Sessions B et D (lower-hip) : même structure, exercices différents forcés par usedGlobally.

### Étape 5 — Séries × répétitions (hypertrophy, 60 min)

| Slot | Cat      | Séries × Reps | Repos |
|------|----------|---------------|-------|
| 0    | warmup   | 2 × 10        | 0 s   |
| 1    | compound | 4 × 8-12      | 90 s  |
| 2    | compound | 4 × 8-12      | 90 s  |
| 3    | isolation| 3 × 10-15     | 75 s  |
| 4    | isolation| 3 × 10-15     | 75 s  |
| 5    | isolation| 3 × 10-15     | 75 s  |
| 6    | isolation| 3 × 10-15     | 75 s  |
| core | core     | 3 × 15        | 60 s  |

### Assertions [PASS/FAIL]

- `workoutTypeFromFocus(['legs'])` = `'lower'` : **PASS** (ligne 263)
- Split public = `['lower','lower','lower','lower']` : **PASS** (ligne 288-290)
- Types internes alternés lower-quad/lower-hip : **PASS** (ligne 289)
- Noms A/B/C/D : **PASS** (ligne 707)
- Structure différenciée quad vs hip (composé dominant différent) : **PASS**

### Coach

**Équilibre musculaire :** Spécialisation jambes parfaitement cohérente avec focusMuscles=['legs']. Aucun upper — acceptable pour un bloc de spécialisation.

**Cohérence objectif :** 4×8-12 hypertrophie → correct. Volume 4 lower/sem = élevé mais gérable avec l'alternance quad/hip qui répartit la charge.

**Durée/contenu :** ~90 min réels vs 60 annoncés (même calcul). ⚠️

**Équipement BW only — risque de slots vides :** Les exercices isolation jambes (leg extension, leg curl, cable kickback) nécessitent machine/câble. En BW seul :
- Leg extension → pas d'équivalent BW pur (slot risque d'être vide ou de fallback vers un composé BW)
- Leg curl → même problème (Nordic curl possible mais technique élevée pour débutant)
- Hip abduction / kickback → possible en BW (bandes idéales, mais ici BW only)
- Calf raise → OK en BW (wall/step)

⚠️ **Risque de 2-3 slots vides** sur chaque session en BW only pour un programme lower. Le pool bodyweight legs est très mince pour les isolations machine.

**Variété inter-sessions :** Excellente — alternance structurelle quad/hip (différents mouvements composés), plus rotation exercices via usedGlobally. Verdict : "Variété structurelle".

**Verdict :** ⚠️ Problème potentiellement sérieux — plusieurs slots isolation jambes risquent d'être vides en BW only (leg extension, leg curl n'ont pas d'équivalent BW standard). À tester avec le seed réel.

---

## P14 — core seul → fullbody [BUG3]

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:['bodyweight'],
  level:'beginner', focusMuscles:['core'] }
```

### Étape 1 — workoutTypeFromFocus(['core'])

| Flag      | Valeur | Raison                 |
|-----------|--------|------------------------|
| hasLower  | false  | 'legs' absent          |
| hasPush   | false  | 'chest'/'shoulders' absents |
| hasPull   | false  | 'back' absent          |
| hasArms   | false  | 'arms' absent          |
| hasCore   | true   | 'core' présent         |
| hasUpper  | false  | hasPush=hasPull=hasArms=false |

Branches testées :
1. `hasLower && !hasUpper` → false (hasLower=false)
2. `hasCore && !hasLower && !hasUpper` → **true → retourne `null`** (ligne 267)

→ **retourne `null`**

La branche `return 'lower'` n'est jamais atteinte. BUG3 vérifié.

### Étape 2 — selectSplit

focusType=null → switch daysPerWeek=2 → **retourne `['fullbody-quad', 'fullbody-hip']`** (ligne 298)

- Types internes : `['fullbody-quad', 'fullbody-hip']`
- Types publics  : `['fullbody', 'fullbody']`
- Noms : "Full Body A", "Full Body B"

### Étape 3 — Slots (60 min, focusedMuscles={core})

`adjustedSlotCount(9, 60)` → **9 slots** pour fullbody-quad et fullbody-hip.

Aucun slot de fullbody-quad ou fullbody-hip ne contient 'core' comme muscle cible → reorderSlotsByFocus ne change aucun ordre (tous aF=1). Core est ajouté **en queue via corePool** (pas comme slot).

**fullbody-quad (A) — ordre original preservé :**

| # | Muscles cibles | Cat |
|---|---------------|-----|
| 1 | quads, glutes                        | compound  |
| 2 | chest, chest_upper                   | compound  |
| 3 | back_width, back_thickness, back     | compound  |
| 4 | shoulders, shoulders_front           | compound  |
| 5 | hamstrings                           | isolation |
| 6 | shoulders_rear                       | isolation |
| 7 | biceps                               | isolation |
| 8 | triceps                              | isolation |
| 9 | calves                               | isolation |

**fullbody-hip (B) — ordre original preservé :**

| # | Muscles cibles | Cat |
|---|---------------|-----|
| 1 | hamstrings, glutes                   | compound  |
| 2 | chest, chest_upper                   | compound  |
| 3 | back_width, back                     | compound  |
| 4 | shoulders, shoulders_front           | compound  |
| 5 | quads                                | isolation |
| 6 | shoulders_lateral, shoulders_rear    | isolation |
| 7 | biceps                               | isolation |
| 8 | triceps                              | isolation |
| 9 | calves                               | isolation |

### Étape 5 — Séries × répétitions (hypertrophy, 60 min)

| Slot | Cat      | Séries × Reps | Repos |
|------|----------|---------------|-------|
| 0    | warmup   | 2 × 10        | 0 s   |
| 1-4  | compound | 4 × 8-12      | 90 s  |
| 5-9  | isolation| 3 × 10-15     | 75 s  |
| core | core     | 3 × 15        | 60 s  |

Total par séance : 2 + 16 + 15 + 3 = **36 sets**.

### Assertions [PASS/FAIL]

- `workoutTypeFromFocus(['core'])` = `null` : **PASS** (ligne 267)
- Split = `['fullbody','fullbody']` JAMAIS `['lower','lower']` : **PASS** (BUG3 absent)
- Core en queue via corePool (pas comme slot) : **PASS** (ligne 698-703)

### Coach

**Équilibre musculaire :** Fullbody équilibré, excellent. L'utilisateur voulait du gainage — le core est bien présent en queue. Les 9 slots couvrent tout le corps.

**Cohérence objectif :** Hypertrophie 4×8-12 sur fullbody × 2 — volume correct pour un débutant.

**Durée/contenu :** 36 sets × ~3 min = ~108 min réels. ⚠️ Nettement supérieur à 60 min. En BW, les repos sont plus courts — estimation plus proche de 60-75 min praticable.

**Équipement BW :** back compound (slot 3 A / slot 3 B) nécessite pull-up bar. En l'absence de barre, ce slot risque d'être vide. ⚠️

**Verdict :** ✅ Bon programme sur la logique (BUG3 correctement absent) — réserves timing et dépendance pull-up bar en BW.

---

## P15 — core seul → upper/lower 4j [BUG3 / 4j]

```
{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:FULL,
  level:'beginner', focusMuscles:['core'] }
```

### Étape 1 — workoutTypeFromFocus(['core'])

Identique à P14 → **retourne `null`** (ligne 267).

### Étape 2 — selectSplit

focusType=null → switch daysPerWeek=4 :
- `isMass = (hypertrophy) → true`
- branche `if (isMass)` → **retourne `['upper-push','lower-quad','upper-pull','lower-hip']`** (ligne 310)

- Types internes : `['upper-push', 'lower-quad', 'upper-pull', 'lower-hip']`
- Types publics  : `['upper', 'lower', 'upper', 'lower']`
- Noms :
  - upper-push (count=1/2) → "Upper — Haut du corps A"
  - lower-quad (count=1/2) → "Lower — Bas du corps A"
  - upper-pull (count=2/2) → "Upper — Haut du corps B"
  - lower-hip  (count=2/2) → "Lower — Bas du corps B"

### Étape 3 — Slots (60 min, focusedMuscles={core})

`adjustedSlotCount(8, 60)` → **8 slots** (upper-push, upper-pull)
`adjustedSlotCount(6, 60)` → **6 slots** (lower-quad, lower-hip)

Aucun slot upper/lower ne contient 'core' → reorderSlotsByFocus sans effet (tous aF=1).

**Upper-push A (8 slots) :**

| # | Muscles cibles | Cat |
|---|---------------|-----|
| 1 | chest, chest_upper                          | compound  |
| 2 | back_width, back_thickness, back            | compound  |
| 3 | shoulders, shoulders_front                  | compound  |
| 4 | chest, chest_lower, chest_upper             | isolation |
| 5 | triceps                                     | isolation |
| 6 | shoulders_lateral                           | isolation |
| 7 | biceps                                      | isolation |
| 8 | back_thickness, back                        | isolation |

**Lower-quad A (6 slots) :**

| # | Muscles cibles | Cat |
|---|---------------|-----|
| 1 | quads, glutes       | compound  |
| 2 | hamstrings, glutes  | compound  |
| 3 | quads               | isolation |
| 4 | hamstrings          | isolation |
| 5 | glutes              | isolation |
| 6 | calves              | isolation |

**Upper-pull B (8 slots) :**

| # | Muscles cibles | Cat |
|---|---------------|-----|
| 1 | back_width, back                            | compound  |
| 2 | back_thickness, back                        | compound  |
| 3 | chest, chest_upper                          | compound  |
| 4 | shoulders_rear                              | isolation |
| 5 | biceps                                      | isolation |
| 6 | back_thickness, back                        | isolation |
| 7 | triceps                                     | isolation |
| 8 | shoulders_lateral                           | isolation |

**Lower-hip B (6 slots) :**

| # | Muscles cibles | Cat |
|---|---------------|-----|
| 1 | glutes, hamstrings  | compound  |
| 2 | quads, glutes       | compound  |
| 3 | glutes              | isolation |
| 4 | hamstrings          | isolation |
| 5 | quads               | isolation |
| 6 | calves              | isolation |

### Étape 5 — Séries × répétitions (hypertrophy, 60 min)

| Session      | Slots cmp | Slots isol | Séries cmp | Séries isol |
|-------------|-----------|------------|------------|-------------|
| Upper-push A | 3         | 5          | 4×8-12     | 3×10-15     |
| Lower-quad A | 2         | 4          | 4×8-12     | 3×10-15     |
| Upper-pull B | 3         | 5          | 4×8-12     | 3×10-15     |
| Lower-hip B  | 2         | 4          | 4×8-12     | 3×10-15     |

Chaque séance : + warmup 2×10 + core 3×15.
Upper : 10 exercices total. Lower : 8 exercices total.

### Assertions [PASS/FAIL]

- `workoutTypeFromFocus(['core'])` = `null` : **PASS** (ligne 267)
- Split = `['upper','lower','upper','lower']` JAMAIS `['lower','lower','lower','lower']` : **PASS** (BUG3 absent)
- BUG3 / 4j : correctement géré → PASS

### Coach

**Équilibre musculaire :** Upper/lower A/B = programme équilibré classique. Excellent pour un débutant voulant améliorer son gainage (core en queue de chaque séance).

**Cohérence objectif :** 4×8-12 sur un upper/lower 4j hypertrophie → très bon schéma.

**Durée/contenu :** Upper (~100 min réels), Lower (~75 min réels) vs 60 annoncés. ⚠️ Surcharge habituelle du générateur.

**Équipement FULL :** Optimal, aucun slot vide possible.

**Verdict :** ✅ Bon programme — réserve timing comme pour tous les profils 60 min.

---

## P16 — shoulders seul → push

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:['dumbbell'],
  level:'beginner', focusMuscles:['shoulders'] }
```

### Étape 1 — workoutTypeFromFocus(['shoulders'])

| Flag      | Valeur | Raison                               |
|-----------|--------|--------------------------------------|
| hasLower  | false  |                                      |
| hasPush   | true   | `includes('shoulders')` = true       |
| hasPull   | false  |                                      |
| hasArms   | false  |                                      |
| hasCore   | false  |                                      |
| hasUpper  | true   | hasPush=true                         |

Branche activée : `hasPush && !hasPull && !hasLower` → **retourne `'push'`** (ligne 269)

### Étape 2 — selectSplit

focusType='push' → `['push', 'push']`

- Types internes/publics : `['push', 'push']`
- Noms : "Push — Poussée A", "Push — Poussée B"

### Étape 3 — Slots (60 min, focusedMuscles={shoulders, shoulders_front, shoulders_lateral, shoulders_rear})

`adjustedSlotCount(6, 60)` → **6 slots**.

reorderSlotsByFocus sur SLOTS['push'] :

Composés :
- slot 0 (chest cmp) : muscles=[chest,chest_upper,chest_lower] → aucun dans focused → aF=1
- slot 1 (OHP) : muscles=[shoulders,shoulders_front] → dans focused → aF=0
- Après tri : [slot 1 (OHP), slot 0 (chest cmp)]

Isolations :
- slot 2 (chest isol) : aF=1
- slot 3 (triceps) : aF=1
- slot 4 (lat raise, muscles=[shoulders_lateral,shoulders]) : dans focused → aF=0
- slot 5 (triceps) : aF=1
- Après tri : [slot 4 (lat raise), slot 2 (chest isol), slot 3 (triceps), slot 5 (triceps)]

Ordre final :

| # | Muscles cibles | Cat | Focus? |
|---|---------------|-----|--------|
| 1 | shoulders, shoulders_front              | compound  | ✓ OHP en tête |
| 2 | chest, chest_upper, chest_lower         | compound  | ✗ |
| 3 | shoulders_lateral, shoulders            | isolation | ✓ |
| 4 | chest, chest_upper, chest_lower         | isolation | ✗ |
| 5 | triceps                                 | isolation | ✗ |
| 6 | triceps                                 | isolation | ✗ |

### Étape 5 — Séries × répétitions (hypertrophy, 60 min)

| Slot | Cat      | Séries × Reps | Repos |
|------|----------|---------------|-------|
| 0    | warmup   | 2 × 10        | 0 s   |
| 1    | compound | 4 × 8-12      | 90 s  |
| 2    | compound | 4 × 8-12      | 90 s  |
| 3    | isolation| 3 × 10-15     | 75 s  |
| 4    | isolation| 3 × 10-15     | 75 s  |
| 5    | isolation| 3 × 10-15     | 75 s  |
| 6    | isolation| 3 × 10-15     | 75 s  |
| core | core     | 3 × 15        | 60 s  |

### Assertions [PASS/FAIL]

- `hasPush=true` (shoulders ∈ push) → `'push'` : **PASS** (ligne 256, 269)
- Split = `['push','push']` : **PASS**
- OHP (shoulders cmp) monté en tête par reorderSlotsByFocus : **PASS**

### Coach

**Équilibre musculaire :** Focus shoulders en push. OHP + lat raise couverts. Rear deltoid **absent** des slots push (attendu — c'est un muscle pull). Pour un focus épaules complet, le rear delt manque. Aussi : aucun pull, aucun lower.

**Cohérence objectif :** 4×8-12 correct. Deux slots triceps = surcharge triceps pour un focus épaules.

**Durée/contenu :** Même estimation ~90 min réels. ⚠️

**Équipement DB :** OHP DB, lat raise DB → équipement adapté. Chest DB bench présent pour équilibre.

**Couverture isolation épaules :** Un seul slot shoulders_lateral — rear deltoid absent. Lacune acceptable pour push mais notable pour un focus épaules.

**Verdict :** ⚠️ Problème mineur — rear deltoid non couvert (expected pour push), déséquilibre pull/lower, timing surestimé.

---

## P17 — chest+back → upper

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL,
  level:'beginner', focusMuscles:['chest','back'] }
```

### Étape 1 — workoutTypeFromFocus(['chest','back'])

| Flag      | Valeur | Raison                              |
|-----------|--------|-------------------------------------|
| hasLower  | false  |                                     |
| hasPush   | true   | 'chest' présent                     |
| hasPull   | true   | 'back' présent                      |
| hasArms   | false  |                                     |
| hasCore   | false  |                                     |
| hasUpper  | true   | hasPush=true, hasPull=true          |

Branches testées dans l'ordre :
1. `hasLower && !hasUpper` → false
2. `hasCore && !hasLower && !hasUpper` → false
3. `hasPush && !hasPull && !hasLower` → false (hasPull=true)
4. `hasPull && !hasPush && !hasLower` → false (hasPush=true)
5. `hasUpper && !hasLower` → **true → retourne `'upper'`** (ligne 273)

→ **retourne `'upper'`**

### Étape 2 — selectSplit

focusType='upper' ≠ 'lower' → `Array.from({ length:3 }, () => 'upper')`

- Types internes/publics : `['upper', 'upper', 'upper']`
- Noms : "Upper — Haut du corps A", "Upper — Haut du corps B", "Upper — Haut du corps C"

Note : il s'agit ici de `SLOTS['upper']` (pas upper-push/upper-pull).

### Étape 3 — Slots (60 min, focusedMuscles={chest, chest_upper, chest_lower, back, back_width, back_thickness})

`adjustedSlotCount(8, 60)` → **8 slots**.

SLOTS['upper'] original (indices 0-7) :
- 0 : chest/chest_upper — compound
- 1 : back_width/back_thickness/back — compound
- 2 : shoulders/shoulders_front — compound (OHP)
- 3 : shoulders_lateral/shoulders_rear — isolation
- 4 : back_thickness/back — isolation
- 5 : chest/chest_lower — isolation
- 6 : biceps — isolation
- 7 : triceps — isolation

reorderSlotsByFocus :
Composés : slots 0 (chest, aF=0), 1 (back, aF=0), 2 (OHP, aF=1) → [0, 1, 2]
Isolations : slot 3 (aF=1), 4 (back_thickness aF=0), 5 (chest_lower aF=0), 6 (aF=1), 7 (aF=1)
   Triés : [4, 5, 3, 6, 7]

Ordre final :

| # | Muscles cibles | Cat | Focus? |
|---|---------------|-----|--------|
| 1 | chest, chest_upper                          | compound  | ✓ |
| 2 | back_width, back_thickness, back            | compound  | ✓ |
| 3 | shoulders, shoulders_front (OHP)            | compound  | ✗ |
| 4 | back_thickness, back                        | isolation | ✓ |
| 5 | chest, chest_lower                          | isolation | ✓ |
| 6 | shoulders_lateral, shoulders_rear           | isolation | ✗ |
| 7 | biceps                                      | isolation | ✗ |
| 8 | triceps                                     | isolation | ✗ |

### Étape 5 — Séries × répétitions (hypertrophy, 60 min)

| Slot | Cat      | Séries × Reps | Repos |
|------|----------|---------------|-------|
| 0    | warmup   | 2 × 10        | 0 s   |
| 1    | compound | 4 × 8-12      | 90 s  |
| 2    | compound | 4 × 8-12      | 90 s  |
| 3    | compound | 4 × 8-12      | 90 s  |
| 4    | isolation| 3 × 10-15     | 75 s  |
| 5    | isolation| 3 × 10-15     | 75 s  |
| 6    | isolation| 3 × 10-15     | 75 s  |
| 7    | isolation| 3 × 10-15     | 75 s  |
| 8    | isolation| 3 × 10-15     | 75 s  |
| core | core     | 3 × 15        | 60 s  |

Total : 10 exercices par séance × 3 sessions.

### Assertions [PASS/FAIL]

- `workoutTypeFromFocus(['chest','back'])` = `'upper'` : **PASS** (ligne 273)
- Split = `['upper','upper','upper']` : **PASS** (ligne 293)
- chest et back en tête (slots 1-2) par reorderSlotsByFocus : **PASS**
- OHP (slot 3) après les composés ciblés : **PASS**

### Coach

**Équilibre musculaire :** chest + back bien priorisés. Ratio push/pull par séance : composé 1 (chest push) + composé 2 (back pull) + 1 isolation back + 1 isolation chest → équilibré. OHP en 3e composé. Jambes absentes — programme haut du corps.

**Cohérence objectif :** 3 composés + 5 isolations par upper → volume élevé. Pour un débutant, 3 séances upper/sem avec 10 exercices chacune représente un stimulus important.

**Durée/contenu :** ~105 min réels vs 60 annoncés. ⚠️

**Variété inter-sessions A/B/C :** `SLOTS['upper']` (pas upper-push/upper-pull) → même structure pour A, B, C. Variété d'exercices seulement (usedGlobally). Sur 3 sessions, le pool doit être suffisamment large — avec FULL equipment, oui.

**Couverture isolation :** rear deltoid présent (slot 6, shoulders_rear), biceps et triceps présents. Couverture complète.

**Verdict :** ⚠️ Problème mineur — volume très élevé pour un débutant en upper×3, timing sous-estimé, mais structure correcte et équilibrée.

---

## P18 — legs+core → lower (core ne neutralise pas legs)

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:['bodyweight'],
  level:'beginner', focusMuscles:['legs','core'] }
```

### Étape 1 — workoutTypeFromFocus(['legs','core'])

| Flag      | Valeur | Raison               |
|-----------|--------|----------------------|
| hasLower  | true   | 'legs' présent       |
| hasPush   | false  |                      |
| hasPull   | false  |                      |
| hasArms   | false  |                      |
| hasCore   | true   | 'core' présent       |
| hasUpper  | false  | hasPush=hasPull=hasArms=false |

Branches testées :
1. `hasLower && !hasUpper` → **true → retourne `'lower'`** (ligne 263)

La branche `hasCore && !hasLower && !hasUpper` (ligne 267) n'est jamais atteinte car hasLower=true bloque à la ligne 263. Core ne neutralise pas legs.

→ **retourne `'lower'`**

### Étape 2 — selectSplit

focusType='lower' → branche lower spéciale :

```
Array.from({ length:3 }, (_, i) => i%2===0 ? 'lower-quad' : 'lower-hip')
→ ['lower-quad', 'lower-hip', 'lower-quad']
```

- Types internes : `['lower-quad', 'lower-hip', 'lower-quad']`
- Types publics  : `['lower', 'lower', 'lower']`

Nommage (total=3 → suffixes A/B/C) :
- lower-quad (count=1) → "Lower — Bas du corps A"
- lower-hip  (count=2) → "Lower — Bas du corps B"
- lower-quad (count=3) → "Lower — Bas du corps C"

### Étape 3 — Slots (60 min, focusedMuscles={quads, hamstrings, glutes, calves, core})

`adjustedSlotCount(6, 60)` → **6 slots** chacun.

Tous les muscles lower-quad/lower-hip sont dans focusedMuscles → reorderSlotsByFocus sans effet.

**Lower-quad (A, C) :**

| # | Muscles cibles | Cat |
|---|---------------|-----|
| 1 | quads, glutes       | compound  |
| 2 | hamstrings, glutes  | compound  |
| 3 | quads               | isolation |
| 4 | hamstrings          | isolation |
| 5 | glutes              | isolation |
| 6 | calves              | isolation |

**Lower-hip (B) :**

| # | Muscles cibles | Cat |
|---|---------------|-----|
| 1 | glutes, hamstrings  | compound  |
| 2 | quads, glutes       | compound  |
| 3 | glutes              | isolation |
| 4 | hamstrings          | isolation |
| 5 | quads               | isolation |
| 6 | calves              | isolation |

Note : 'core' dans focusedMuscles mais aucun slot lower ne cible 'core' → core ajouté en queue via corePool uniquement.

### Étape 5 — Séries × répétitions (hypertrophy, 60 min)

| Slot | Cat      | Séries × Reps | Repos |
|------|----------|---------------|-------|
| 0    | warmup   | 2 × 10        | 0 s   |
| 1    | compound | 4 × 8-12      | 90 s  |
| 2    | compound | 4 × 8-12      | 90 s  |
| 3    | isolation| 3 × 10-15     | 75 s  |
| 4    | isolation| 3 × 10-15     | 75 s  |
| 5    | isolation| 3 × 10-15     | 75 s  |
| 6    | isolation| 3 × 10-15     | 75 s  |
| core | core     | 3 × 15        | 60 s  |

### Assertions [PASS/FAIL]

- `hasLower=true, hasUpper=false` → `'lower'` (core ne neutralise pas) : **PASS** (ligne 263)
- Split = `['lower','lower','lower']` : **PASS**
- `workoutTypeFromFocus(['legs','core'])` ≠ null : **PASS** (hasLower prioritaire)
- BUG3 non déclenché (core seul → null, mais legs+core → lower) : **PASS**

### Coach

**Équilibre musculaire :** Spécialisation lower + gainage en queue = cohérent. Aucun upper — programme de bloc.

**Cohérence objectif :** Correct.

**Durée/contenu :** ~90 min réels vs 60 annoncés. ⚠️

**Équipement BW :** Mêmes risques que P13 — slots isolation jambes (leg extension, leg curl) risquent d'être vides. ⚠️

**Verdict :** ⚠️ Mêmes réserves que P13 sur le BW + slots potentiellement vides. Logique focusMuscles correcte.

---

## P19 — chest+back+legs → null → fullbody par défaut

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:FULL,
  level:'beginner', focusMuscles:['chest','back','legs'] }
```

### Étape 1 — workoutTypeFromFocus(['chest','back','legs'])

| Flag      | Valeur | Raison                    |
|-----------|--------|---------------------------|
| hasLower  | true   | 'legs' présent            |
| hasPush   | true   | 'chest' présent           |
| hasPull   | true   | 'back' présent            |
| hasArms   | false  |                           |
| hasCore   | false  |                           |
| hasUpper  | true   | hasPush=true, hasPull=true |

Branches testées :
1. `hasLower && !hasUpper` → false (hasUpper=true)
2. `hasCore && !hasLower && !hasUpper` → false
3. `hasPush && !hasPull && !hasLower` → false (hasPull=true, hasLower=true)
4. `hasPull && !hasPush && !hasLower` → false
5. `hasUpper && !hasLower` → false (hasLower=true)
6. Aucune branche → **retourne `null`** (ligne 275)

→ **retourne `null`** (ambiguïté hasUpper + hasLower)

### Étape 2 — selectSplit

focusType=null → switch daysPerWeek=2 → **`['fullbody-quad', 'fullbody-hip']`** (ligne 298)

- Types internes : `['fullbody-quad', 'fullbody-hip']`
- Types publics  : `['fullbody', 'fullbody']`
- Noms : "Full Body A", "Full Body B"

### Étape 3 — Slots (60 min, focusedMuscles={chest, chest_upper, chest_lower, back, back_width, back_thickness, quads, hamstrings, glutes, calves})

`adjustedSlotCount(9, 60)` → **9 slots** chacun.

**fullbody-quad (A) reorderSlotsByFocus :**

Original : quads/glutes[cmp, aF=0], chest[cmp, aF=0], back[cmp, aF=0], shoulders[cmp, aF=1], hamstrings[isol, aF=0], shoulders_rear[isol, aF=1], biceps[isol, aF=1], triceps[isol, aF=1], calves[isol, aF=0]

Composés triés : [quads/glutes, chest, back, shoulders] (0,0,0,1 → stables)
Isolations triées : [hamstrings (aF=0), calves (aF=0), shoulders_rear (aF=1), biceps (aF=1), triceps (aF=1)]

| # | Muscles cibles | Cat | Focus? |
|---|---------------|-----|--------|
| 1 | quads, glutes                        | compound  | ✓ |
| 2 | chest, chest_upper                   | compound  | ✓ |
| 3 | back_width, back_thickness, back     | compound  | ✓ |
| 4 | shoulders, shoulders_front           | compound  | ✗ |
| 5 | hamstrings                           | isolation | ✓ |
| 6 | calves                               | isolation | ✓ |
| 7 | shoulders_rear                       | isolation | ✗ |
| 8 | biceps                               | isolation | ✗ |
| 9 | triceps                              | isolation | ✗ |

**fullbody-hip (B) reorderSlotsByFocus :**

Original : hamstrings/glutes[cmp, aF=0], chest[cmp, aF=0], back_width/back[cmp, aF=0], shoulders[cmp, aF=1], quads[isol, aF=0], shoulders_lat/rear[isol, aF=1], biceps[isol, aF=1], triceps[isol, aF=1], calves[isol, aF=0]

Composés triés : [hamstrings/glutes, chest, back, shoulders]
Isolations triées : [quads (aF=0), calves (aF=0), shoulders_lat/rear (aF=1), biceps (aF=1), triceps (aF=1)]

| # | Muscles cibles | Cat | Focus? |
|---|---------------|-----|--------|
| 1 | hamstrings, glutes                   | compound  | ✓ |
| 2 | chest, chest_upper                   | compound  | ✓ |
| 3 | back_width, back                     | compound  | ✓ |
| 4 | shoulders, shoulders_front           | compound  | ✗ |
| 5 | quads                                | isolation | ✓ |
| 6 | calves                               | isolation | ✓ |
| 7 | shoulders_lateral, shoulders_rear    | isolation | ✗ |
| 8 | biceps                               | isolation | ✗ |
| 9 | triceps                              | isolation | ✗ |

### Étape 5 — Séries × répétitions (hypertrophy, 60 min)

| Slot | Cat      | Séries × Reps | Repos |
|------|----------|---------------|-------|
| 0    | warmup   | 2 × 10        | 0 s   |
| 1-4  | compound | 4 × 8-12      | 90 s  |
| 5-9  | isolation| 3 × 10-15     | 75 s  |
| core | core     | 3 × 15        | 60 s  |

Total : 11 exercices par séance (9 + warmup + core).

### Assertions [PASS/FAIL]

- `workoutTypeFromFocus(['chest','back','legs'])` = `null` (hasUpper + hasLower) : **PASS** (ligne 275)
- Split par défaut 2j = `['fullbody','fullbody']` : **PASS** (ligne 298)
- Muscles ciblés (chest/back/legs) remontent en tête via reorderSlotsByFocus : **PASS**

### Coach

**Équilibre musculaire :** Fullbody équilibré. La remontée des slots ciblés (chest, back, legs) est parfaitement pertinente — les muscles importants sont faits en début de séance, quand l'énergie est maximale.

**Cohérence objectif :** 4×8-12 fullbody × 2 → correct pour débutant.

**Durée/contenu :** 11 exercices × ~3.5 min = ~38 min warmup+core inclus... recalcul : 4 composés × 4 sets + 5 isolations × 3 sets + 2 warmup + 3 core = 16+15+2+3 = 36 sets × ~3 min = ~108 min. ⚠️

**Variété structurelle A→B :** fullbody-quad vs fullbody-hip — composé 1 = squat-dominant vs RDL-dominant → variété structurelle réelle. Excellent.

**Verdict :** ✅ Bon programme — reorderSlotsByFocus pertinent, alternance quad/hip. Réserve timing habituelle.

---

## P20 — shoulders+arms → push

```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:['dumbbell'],
  level:'beginner', focusMuscles:['shoulders','arms'] }
```

### Étape 1 — workoutTypeFromFocus(['shoulders','arms'])

| Flag      | Valeur | Raison                                   |
|-----------|--------|------------------------------------------|
| hasLower  | false  |                                          |
| hasPush   | true   | `includes('shoulders')` = true           |
| hasPull   | false  |                                          |
| hasArms   | true   | `includes('arms')` = true               |
| hasCore   | false  |                                          |
| hasUpper  | true   | hasPush=true ET hasArms=true            |

Branches testées :
1. `hasLower && !hasUpper` → false
2. `hasCore && !hasLower && !hasUpper` → false
3. `hasPush && !hasPull && !hasLower` → **true → retourne `'push'`** (ligne 269)

La branche `hasUpper && !hasLower` (ligne 273) n'est jamais atteinte car hasPush=true déclenche la branche ligne 269 en premier.

→ **retourne `'push'`**

Contra-exemple : arms seul → hasArms=true, hasPush=false → branche ligne 269 false → branche ligne 273 (`hasUpper && !hasLower`) → retourne `'upper'`. Mais shoulders+arms → hasPush=true → push prioritaire sur upper. **PASS (comportement documenté).**

### Étape 2 — selectSplit

focusType='push' → `['push', 'push']`

- Types internes/publics : `['push', 'push']`
- Noms : "Push — Poussée A", "Push — Poussée B"

### Étape 3 — Slots (60 min, focusedMuscles={shoulders, shoulders_front, shoulders_lateral, shoulders_rear, biceps, triceps, forearms})

`adjustedSlotCount(6, 60)` → **6 slots**.

SLOTS['push'] (indices 0-5) :
- 0 : chest/chest_upper/chest_lower — compound → muscles ∉ focused → aF=1
- 1 : shoulders/shoulders_front — compound → dans focused → aF=0
- 2 : chest/chest_upper/chest_lower — isolation → aF=1
- 3 : triceps — isolation → dans focused (triceps) → aF=0
- 4 : shoulders_lateral/shoulders — isolation → dans focused → aF=0
- 5 : triceps — isolation → dans focused → aF=0

Composés triés : [slot 1 (OHP, aF=0), slot 0 (chest, aF=1)]
Isolations triées : [slot 3 (triceps), slot 4 (lat raise), slot 5 (triceps)] (tous aF=0, ordre stable), puis [slot 2 (chest isol, aF=1)]

Ordre final :

| # | Muscles cibles | Cat | Focus? |
|---|---------------|-----|--------|
| 1 | shoulders, shoulders_front              | compound  | ✓ OHP en tête |
| 2 | chest, chest_upper, chest_lower         | compound  | ✗ |
| 3 | triceps                                 | isolation | ✓ |
| 4 | shoulders_lateral, shoulders            | isolation | ✓ |
| 5 | triceps                                 | isolation | ✓ |
| 6 | chest, chest_upper, chest_lower         | isolation | ✗ |

### Étape 5 — Séries × répétitions (hypertrophy, 60 min)

| Slot | Cat      | Séries × Reps | Repos |
|------|----------|---------------|-------|
| 0    | warmup   | 2 × 10        | 0 s   |
| 1    | compound | 4 × 8-12      | 90 s  |
| 2    | compound | 4 × 8-12      | 90 s  |
| 3    | isolation| 3 × 10-15     | 75 s  |
| 4    | isolation| 3 × 10-15     | 75 s  |
| 5    | isolation| 3 × 10-15     | 75 s  |
| 6    | isolation| 3 × 10-15     | 75 s  |
| core | core     | 3 × 15        | 60 s  |

### Assertions [PASS/FAIL]

- `hasPush=true` (shoulders) → `'push'` prioritaire sur `'upper'` : **PASS** (ligne 269 avant 273)
- Split = `['push','push']` : **PASS**
- OHP (shoulders) en tête (aF=0 vs chest aF=1) : **PASS**
- triceps + lat raise montés avant chest isol : **PASS**

### Coach

**Équilibre musculaire :** Focus shoulders + arms → triceps bien couvert (2 slots, slots 3 et 5). Shoulders bien couvert (OHP + lat raise). **Biceps absent** : SLOTS['push'] ne contient aucun slot biceps. L'utilisateur voulait muscler les bras — seul le triceps est servi par le push, le biceps est structurellement absent.

**Cohérence objectif :** OHP en tête est excellent pour le focus épaules. Double triceps (slots 3 et 5) → sur-représentation triceps relatif au biceps (absent).

**Durée/contenu :** ~90 min réels vs 60 annoncés. ⚠️

**Lacune notable :** L'utilisateur ciblant 'arms' s'attend à un biceps couvert. Dans un programme push, biceps est structurellement absent. Un split 'upper' (si arms seul) couvrirait biceps via SLOTS['upper']. Ici le générateur choisit push car shoulders déclenche hasPush — comportement logique mais potentiellement décevant pour l'utilisateur.

**Verdict :** ⚠️ Problème mineur — biceps non couvert malgré focusMuscles=['arms'] (expected en push, mais contre-intuitif pour l'utilisateur qui voulait "les bras"). Recommandation : documenter ce comportement dans le wizard.

---

## Tableau de synthèse Groupe B

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|--------|---------------------|---------|-------------------|
| P11 | push×2 avec chest en tête (DB) | ✅ PASS | Aucun pull/lower ; timing ~90 min vs 60 ; risque doublon si pool DB chest < 2 exercices compound |
| P12 | pull×3 avec back en tête (BB+DB+CABLE) | ✅ PASS | Aucun push/lower ; timing ~90 min vs 60 |
| P13 | lower×4 alternant quad/hip, noms A/B/C/D (BW) | ✅ PASS | Slots isolation jambes (leg ext, leg curl) probablement vides en BW only ; aucun upper ; timing surestimé |
| P14 | BUG3 : core→null→fullbody×2, jamais lower (BW) | ✅ PASS | timing ~108 min vs 60 ; back compound nécessite pull-up bar en BW |
| P15 | BUG3/4j : core→null→upper/lower A/B, jamais lower×4 (FULL) | ✅ PASS | timing upper ~100 min vs 60 |
| P16 | push×2 avec OHP en tête, shoulders prioritaire (DB) | ✅ PASS | Rear deltoid absent (normal en push) ; aucun pull/lower ; timing ~90 min vs 60 |
| P17 | upper×3 avec chest+back en tête (FULL) | ✅ PASS | Volume élevé pour débutant (upper×3) ; timing ~105 min vs 60 ; variété d'exercices seulement (pas variété structurelle entre A/B/C) |
| P18 | legs+core→lower (core non neutralisant) ; 3 sessions BW | ✅ PASS | Mêmes slots vides BW que P13 ; timing surestimé |
| P19 | hasUpper+hasLower→null→fullbody×2 ; reorder pertinent | ✅ PASS | Timing ~108 min vs 60 (attendu) |
| P20 | shoulders+arms→push (hasPush prioritaire sur hasArms→upper) ; biceps absent | ✅ PASS | Biceps absent malgré focusMuscles=['arms'] ; timing ~90 min vs 60 ; comportement contre-intuitif à documenter |

---

## Synthèse des problèmes ouverts — Groupe B

### Bugs / anomalies logicielles

**Aucun FAIL technique** détecté sur les assertions P11–P20 après refactoring BUG3. Toutes les assertions critiques passent :
- BUG3 (P14, P15) : `focusMuscles:['core']` → null → split par défaut. ✅
- legs+core → lower (P18) : core ne neutralise pas legs. ✅
- Alternance lower-quad/lower-hip sur N jours (P13, P18). ✅
- shoulders+arms → push (hasPush prioritaire, P20). ✅

### Réserves coach cumulées

**Thème 1 — Volume réel vs durée annoncée (tous profils)**
Affecte : P11, P12, P13, P14, P15, P16, P17, P18, P19, P20.
La durée 60 min ne réduit pas le nombre de slots (`adjustedSlotCount(base, 60) → base`). Avec 90 s de repos compound et 75 s isolation, la durée réelle dépasse systématiquement 60 min d'environ 40-70 %. Recommandation : calibrer la base de slots sur un ratio 3-3.5 min/set pour que 60 min = ~18-20 sets = ~7 slots, ou ajouter un facteur de réduction même à 60 min (ex. base × 0.85).

**Thème 2 — Slots isolation jambes vides en BW only (P13, P18)**
Affecte : P13, P18.
Leg extension et leg curl n'ont pas d'équivalent bodyweight standard. Le slot peut retourner `null` → exercice élidé silencieusement. Recommandation : ajouter des exercices BW pour quads isolation (wall squat tenu, sissy squat) et hamstrings isolation (Nordic curl balisé pour débutant) dans le seed, ou afficher un avertissement "équipement insuffisant pour ce slot".

**Thème 3 — Biceps absent en push avec focusMuscles=['arms'] (P20)**
Affecte : P20.
Contre-intuitif : l'utilisateur cible les bras mais push → biceps structurellement absent. Le générateur est logiquement correct (shoulders → hasPush → push), mais l'expérience utilisateur est décevante. Recommandation : dans le wizard, afficher un avertissement "focus bras en push ne couvre pas le biceps — envisagez pull ou upper".

**Thème 4 — Programmes unilatéraux (push only, pull only, lower only)**
Affecte : P11, P12, P13, P16, P17, P18.
Ces programmes créés par focusMuscles n'ont aucune couverture des groupes antagonistes. Acceptable pour un bloc de spécialisation, mais le wizard devrait avertir l'utilisateur qu'il s'agit d'un programme de spécialisation, pas d'un programme complet.

**Thème 5 — Variété structurelle inter-sessions (P17 upper×3)**
Affecte : P17.
Trois séances upper avec `SLOTS['upper']` (pas upper-push/upper-pull) → structure identique pour A/B/C, seuls les exercices varient. Verdict : "Variété d'exercices seulement". En revanche P11/P12/P16 (push×2/pull×3) souffrent du même problème mais avec seulement 2-3 sessions du même type, c'est moins critique. Recommandation : pour focusType='upper' avec N≥2 séances, alterner upper-push/upper-pull comme pour le split par défaut.

**Thème 6 — Dépendance pull-up bar en BW (P14)**
Affecte : P14.
Le slot back compound (back_width) nécessite pull-up/lat pulldown. En BW sans barre de traction, ce slot est probablement vide. Recommandation : inclure dans le seed des exercices de dos bodyweight sans barre (inverted rows sur table, etc.) ou détecter l'absence de substitut.

---

# Audit P21–P26 — Groupe C : Equipment × slot

> Sources lues : `audit_prompt_v3.md`, `programGenerator.ts`, `exercises-seed.json` (intégralité, 8 passes).

---

## Catalogue d'exercices — référence rapide (non-warmup, non-deleted, popularity > 0)

| id | Muscle primaire | Équipement | Cat | Pop |
|----|----------------|-----------|-----|-----|
| seed-bench-barbell | chest | barbell | cmp | 8 |
| seed-squat-barbell | quads | barbell | cmp | 8 |
| seed-row-barbell | back_thickness | barbell | cmp | 7 |
| seed-incline-bench-barbell | chest_upper | barbell | cmp | 4 |
| seed-hip-thrust | glutes | barbell | cmp | 4 |
| seed-ohp-barbell | shoulders | barbell | cmp | 3 |
| seed-romanian-deadlift | hamstrings | barbell | cmp | 3 |
| seed-deadlift | back | barbell | cmp | 3 |
| seed-curl-barbell | biceps | barbell | iso | 3 |
| seed-front-squat | quads | barbell | cmp | 2 |
| seed-row-tbar | back_thickness | barbell | cmp | 2 |
| seed-skullcrusher | triceps | barbell | iso | 2 |
| seed-curl-preacher | biceps | barbell | iso | 2 |
| seed-upright-row-barbell | shoulders_lateral | barbell | cmp | 2 |
| seed-close-grip-bench | triceps | barbell | cmp | 2 |
| seed-decline-bench-barbell | chest_lower | barbell | cmp | 1 |
| seed-good-morning | hamstrings | barbell | cmp | 1 |
| seed-wrist-curl | forearms | barbell | iso | 1 |
| seed-reverse-wrist-curl | forearms | barbell | iso | 1 |
| seed-bench-dumbbell | chest | dumbbell | cmp | 3 |
| seed-shoulder-press-dumbbell | shoulders | dumbbell | cmp | 3 |
| seed-curl-dumbbell | biceps | dumbbell | iso | 3 |
| seed-curl-hammer | biceps | dumbbell | iso | 3 |
| seed-lateral-raise | shoulders_lateral | dumbbell | iso | 3 |
| seed-pullover-dumbbell | back_thickness | dumbbell | iso | 3 |
| seed-row-dumbbell | back_thickness | dumbbell | cmp | 3 |
| seed-arnold-press | shoulders | dumbbell | cmp | 2 |
| seed-incline-bench-dumbbell | chest_upper | dumbbell | cmp | 2 |
| seed-fly-dumbbell | chest | dumbbell | iso | 2 |
| seed-rear-delt-fly | shoulders_rear | dumbbell | iso | 2 |
| seed-triceps-overhead | triceps | dumbbell | iso | 2 |
| seed-curl-incline | biceps | dumbbell | iso | 2 |
| seed-lunges | quads | dumbbell | cmp | 2 |
| seed-bulgarian-split-squat | quads | dumbbell | cmp | 2 |
| seed-shrug | back | dumbbell | iso | 2 |
| dumbbell-rdl | hamstrings | dumbbell | cmp | 2 |
| seed-triceps-kickback | triceps | dumbbell | iso | 1 |
| seed-curl-concentration | biceps | dumbbell | iso | 1 |
| seed-front-raise | shoulders_front | dumbbell | iso | 1 |
| seed-pullover | back_width | dumbbell | iso | 1 |
| seed-lat-pulldown | back_width | cable | cmp | 3 |
| seed-triceps-rope | triceps | cable | iso | 3 |
| seed-triceps-pushdown | triceps | cable | iso | 3 |
| seed-row-cable | back_thickness | cable | cmp | 2 |
| seed-face-pull | shoulders_rear | cable | iso | 2 |
| seed-curl-cable | biceps | cable | iso | 2 |
| seed-fly-cable | chest | cable | iso | 2 |
| seed-lateral-raise-cable | shoulders_lateral | cable | iso | 2 |
| seed-pullover-cable | back_thickness | cable | iso | 2 |
| seed-straight-arm-pulldown | back_thickness | cable | iso | 2 |
| seed-upright-row-cable | shoulders_lateral | cable | cmp | 2 |
| seed-cable-crunch | core | cable | iso | 2 |
| seed-glute-kickback | glutes | cable | iso | 1 |
| seed-leg-press | quads | machine | cmp | 3 |
| seed-leg-extension | quads | machine | iso | 3 |
| seed-leg-curl-lying | hamstrings | machine | iso | 3 |
| seed-chest-press-machine | chest | machine | cmp | 3 |
| seed-shoulder-press-machine | shoulders | machine | cmp | 3 |
| seed-calf-raise-seated | calves | machine | iso | 2 |
| seed-calf-raise-standing | calves | machine | iso | 2 |
| seed-hack-squat | quads | machine | cmp | 2 |
| seed-leg-curl-seated | hamstrings | machine | iso | 2 |
| seed-leg-curl-standing | hamstrings | machine | iso | 2 |
| seed-hip-abduction | glutes | machine | iso | 2 |
| seed-hip-adduction-machine | glutes | machine | iso | 2 |
| seed-row-machine | back_thickness | machine | cmp | 1 |
| seed-pullup | back_width | bodyweight | cmp | 3 |
| bw-chinup | biceps | bodyweight | cmp | 3 |
| seed-plank | core | bodyweight | iso | 3 |
| seed-hip-thrust-bw | glutes | bodyweight | cmp | 4 |
| seed-glute-bridge | glutes | bodyweight | iso | 3 |
| seed-dips | chest_lower | bodyweight | cmp | 3 |
| seed-pushup | chest | bodyweight | cmp | 2 |
| bw-squat | quads | bodyweight | cmp | 3 |
| bw-calf-raise | calves | bodyweight | iso | 2 |
| bw-lunge | quads | bodyweight | cmp | 2 |
| bw-nordic-curl | hamstrings | bodyweight | cmp | 2 |
| bw-incline-pushup | chest_upper | bodyweight | cmp | 2 |
| bw-wall-sit | quads | bodyweight | iso | 2 |
| seed-donkey-kick | glutes | bodyweight | iso | 2 |
| seed-fire-hydrant | glutes | bodyweight | iso | 2 |
| seed-triceps-dips | triceps | bodyweight | cmp | 2 |
| bw-pike-pushup | shoulders | bodyweight | cmp | 1 |
| bw-jump-squat | quads | bodyweight | cmp | 1 |
| seed-curtsy-lunge | glutes | bodyweight | cmp | 1 |
| bw-inverted-row | back_thickness | bodyweight | cmp | 1 |
| band-squat | quads | band | cmp | 2 |
| band-row | back_thickness | band | cmp | 2 |
| band-overhead-press | shoulders | band | cmp | 2 |
| band-hip-thrust | glutes | band | cmp | 2 |
| band-curl | biceps | band | iso | 2 |
| band-tricep-pushdown | triceps | band | iso | 2 |
| band-chest-press | chest | band | cmp | 1 |
| band-good-morning | hamstrings | band | cmp | 1 |

> **Note :** `seed-band-pull-apart` (shoulders_rear, band) est **isWarmupExercise:true** → exclu de `available`, présent dans `warmupPool` uniquement si band ∈ allowed. `seed-glute-bridge` (glutes, bodyweight, iso, pop:3) non-warmup, `seed-glute-bridge-warmup` est warmup.

---

## P21 — Bodyweight only, hypertrophie, 3j, beginner

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:['bodyweight'], level:'beginner' }
```

### Étape 1 — workoutTypeFromFocus
Pas de focusMuscles → `null`

### Étape 2 — selectSplit (ligne 302–306)
`daysPerWeek:3`, `isMass:true`, `level:'beginner'`
→ branche beginner 3j : `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`
Noms : "Full Body A", "Full Body B", "Full Body C"

### Étape 3 — adjustedSlotCount
`adjustedSlotCount(9, 60)` = 9 slots (durée=60, retourne base=9)

### Étape 4 — Sélection d'exercices

**available (BW uniquement, non-warmup, non-deleted, pop>0) :**
quads cmp : bw-squat(3), bw-lunge(2), bw-jump-squat(1)
chest cmp : seed-pushup(2), bw-incline-pushup(2)
back_width cmp : seed-pullup(3)
back_thickness cmp : bw-inverted-row(1)
glutes cmp : seed-hip-thrust-bw(4), seed-curtsy-lunge(1)
hamstrings cmp : bw-nordic-curl(2) [seul]
hamstrings iso : **aucune** → fallback sur compound
shoulders cmp : bw-pike-pushup(1)
biceps cmp : bw-chinup(3) [seul, compound]
triceps cmp : seed-triceps-dips(2) [seul, compound]
calves iso : bw-calf-raise(2)
chest_lower cmp : seed-dips(3)
shoulders_rear : **aucune** (band-pull-apart est warmup, exclu)
shoulders_lateral : **aucune**
glutes iso : seed-donkey-kick(2), seed-fire-hydrant(2), seed-glute-bridge(3)

**warmupPool (BW)** : seed-bird-dog(2), seed-cat-cow(2), seed-shoulder-circles(1), seed-walking-lunges(2), seed-glute-bridge-warmup(2), seed-bodyweight-squat(2), seed-mountain-climbers(2), seed-jumping-jacks(2), seed-dead-bug(2), seed-good-morning-bw(1), seed-superman(1), seed-worlds-greatest-stretch(1), seed-leg-swings(1), seed-hip-9090(1), seed-thoracic-rotation(1), seed-inchworm(1)
→ Session 0 : warmupPool[0] = `seed-bird-dog`
→ Session 1 : warmupPool[1] = `seed-cat-cow`
→ Session 2 : warmupPool[2] = `seed-shoulder-circles`

**corePool (BW)** (ordre JSON) : seed-scissors(1), seed-crunch(2), seed-bicycle-crunch(2), seed-vertical-leg-crunch(1), bw-hollow-body(1), seed-side-plank(2), seed-russian-twist(1), seed-plank(3), seed-leg-raise(2), seed-hanging-leg-raise(2), seed-ab-wheel(1), seed-heel-touch(1)
→ Session 0 : corePool[0] = `seed-scissors`
→ Session 1 : corePool[1] = `seed-crunch`
→ Session 2 : corePool[2] = `seed-bicycle-crunch`

---

**Full Body A (fullbody-quad, usedGlobally = ∅) :**

| # | Slot (muscles) | Cmp? | Top-3 candidats (pop desc) | Exercice retenu | Séries×Reps |
|---|---------------|------|---------------------------|-----------------|-------------|
| 0 | warmup | — | — | seed-bird-dog | 2×10 |
| 1 | quads/glutes | cmp | bw-squat(3), bw-lunge(2), bw-jump-squat(1) | **bw-squat** | 4×8-12 |
| 2 | chest/chest_upper | cmp | seed-pushup(2), bw-incline-pushup(2) | **seed-pushup** | 4×8-12 |
| 3 | back_width/back_thickness/back | cmp | seed-pullup(3), bw-inverted-row(1) | **seed-pullup** | 4×8-12 |
| 4 | shoulders/shoulders_front | cmp | bw-pike-pushup(1) seul | **bw-pike-pushup** | 4×8-12 |
| 5 | hamstrings | iso→fallback | bw-nordic-curl(2) seul | **bw-nordic-curl** | 3×10-15 |
| 6 | shoulders_rear | iso | **aucun candidat BW** | — slot vide — | — |
| 7 | biceps | iso→fallback | bw-chinup(3) seul | **bw-chinup** | 3×10-15 |
| 8 | triceps | iso→fallback | seed-triceps-dips(2) seul | **seed-triceps-dips** | 3×10-15 |
| 9 | calves | iso | bw-calf-raise(2) seul | **bw-calf-raise** | 3×10-15 |
| 10 | core | — | — | seed-scissors | 3×15 |

usedGlobally après A : {bw-squat, seed-pushup, seed-pullup, bw-pike-pushup, bw-nordic-curl, bw-chinup, seed-triceps-dips, bw-calf-raise}
Total exercices A : 8 slots effectifs + warmup + core = **10**

---

**Full Body B (fullbody-hip, usedGlobally = {bw-squat, seed-pushup, seed-pullup, bw-pike-pushup, bw-nordic-curl, bw-chinup, seed-triceps-dips, bw-calf-raise}) :**

Slots fullbody-hip :
```
hamstrings/glutes cmp | chest/chest_upper cmp | back_width/back cmp | shoulders/shoulders_front cmp
quads iso | shoulders_lateral/shoulders_rear iso | biceps iso | triceps iso | calves iso
```

| # | Slot | Exercice retenu | Note |
|---|------|-----------------|------|
| 0 | warmup | seed-cat-cow | rotation |
| 1 | hamstrings/glutes cmp | **seed-hip-thrust-bw** (pop:4, non utilisé) | bw-nordic-curl utilisé → hip-thrust-bw |
| 2 | chest/chest_upper cmp | **bw-incline-pushup** (pop:2, non utilisé) | seed-pushup utilisé |
| 3 | back_width/back cmp | **seed-pullup** (pop:3, UTILISÉ — seul candidat BW) | Répétition forcée |
| 4 | shoulders/shoulders_front cmp | **bw-pike-pushup** (pop:1, UTILISÉ — seul) | Répétition forcée |
| 5 | quads iso | **bw-wall-sit** (isolation, pop:2) | bw-squat utilisé mais bw-wall-sit dispo |
| 6 | shoulders_lat/rear iso | — slot vide — | Aucun BW shoulders_lateral ni shoulders_rear |
| 7 | biceps iso→fallback | **bw-chinup** (UTILISÉ — seul) | Répétition forcée |
| 8 | triceps iso→fallback | **seed-triceps-dips** (UTILISÉ — seul) | Répétition forcée |
| 9 | calves iso | **bw-calf-raise** (UTILISÉ — seul) | Répétition forcée |
| 10 | core | seed-crunch | rotation |

usedGlobally après B += {seed-hip-thrust-bw, bw-incline-pushup, bw-wall-sit}

---

**Full Body C (fullbody-quad, usedGlobally étendu) :**

| # | Slot | Exercice retenu | Note |
|---|------|-----------------|------|
| 0 | warmup | seed-shoulder-circles | rotation |
| 1 | quads/glutes cmp | **bw-lunge** (pop:2, non utilisé) | bw-squat/hip-thrust-bw utilisés |
| 2 | chest/chest_upper cmp | **seed-pushup** (UTILISÉ — bw-incline-pushup aussi utilisé) | Répétition forcée |
| 3 | back_width/back_thickness/back cmp | **bw-inverted-row** (pop:1, non utilisé) | seed-pullup utilisé |
| 4 | shoulders cmp | **bw-pike-pushup** (UTILISÉ — seul) | Répétition forcée |
| 5 | hamstrings iso→fallback | **bw-nordic-curl** (UTILISÉ — seul) | Répétition forcée |
| 6 | shoulders_rear iso | — slot vide — | |
| 7 | biceps iso→fallback | **bw-chinup** (UTILISÉ — seul) | Répétition forcée |
| 8 | triceps iso→fallback | **seed-triceps-dips** (UTILISÉ — seul) | Répétition forcée |
| 9 | calves iso | **bw-calf-raise** (UTILISÉ — seul) | Répétition forcée |
| 10 | core | seed-bicycle-crunch | rotation |

### Étape 5 — Séries×Reps
Goal hypertrophie, 60 min → pas d'ajustement (`adjustedSpec` retourne le spec brut pour 60/90 min).
- Compound : `COMPOUND_SPEC.hypertrophy` → 4 séries, 8-12 reps, repos 90s
- Isolation : `ISOLATION_SPEC.hypertrophy` → 3 séries, 10-15 reps, repos 75s
- Warmup : 2×10, repos 0s
- Core : 3×15, repos 60s

### progressStepKg / autoProgress
`makeDraftWE` (ligne 501-502) : `progressStepKg = equipment === 'bodyweight' ? 0 : 2.5`
Tous les exercices BW → `progressStepKg: 0`
`autoProgress: true` (valeur par défaut) — seul le warmup reçoit `autoProgress: false` (ligne 693)

### Assertions [PASS/FAIL]

- Split `['fullbody-quad','fullbody-hip','fullbody-quad']` (beginner 3j) : **PASS** (ligne 306)
- Aucun exercice non-BW dans la sortie : **PASS**
- `progressStepKg: 0` pour tous les exercices BW : **PASS** (ligne 502)
- `autoProgress: false` pour les exercices de slots : **FAIL** — `autoProgress` = `true` par défaut ; seul le warmup reçoit `false` (ligne 693). Les exercices de slots ont `autoProgress:true`, `progressStepKg:0`.
- Slot `shoulders_rear` vide : **PASS** (aucun exercice BW shoulders_rear non-warmup)

### Évaluation coach

**Équilibre musculaire :**
- Dos couvert par pullup (back_width) ✓, mais aucun rowing vertical possible → pas de back_thickness compound BW sauf bw-inverted-row (pop:1, peu connu)
- Épaules très limites : seul bw-pike-pushup pour OHP compound (1 seul candidat)
- Mollets, ischiojambiers, biceps, triceps : 1 seul exercice disponible → répétitions garanties dès B
- Épaules arrière/latérales : slots **toujours vides** — pas de mouvement BW pour shoulders_rear ou shoulders_lateral non-warmup dans le seed

**Cohérence objectif :**
- Hypertrophie 4×8-12 sur des pompes et squats BW : charge insuffisante pour un intermédiaire ou un pratiquant régulier. Pour un débutant strict, acceptable.

**Durée/contenu :**
- 10 exercices × ~4 min = ~40 min effectifs : créneau 60 min tenu (repos 90s hypertrophie absorbés)

**Qualité équipement :**
- BW exploité au maximum de ce que le seed permet ✓
- Pool trop étroit : 5-6 exercices de slots effectifs seulement, contre 9 slots théoriques
- Slot shoulders_rear systématiquement vide sur les 3 sessions : manque de band-pull-apart non-warmup

**Variété inter-sessions :**
Sessions A/B ont une structure différenciée (fullbody-quad vs fullbody-hip) ✓
Mais en B et C : 5 exercices répétés sur 8 slots (pullup, pike-pushup, chinup, dips, calf-raise)
→ Verdict : **"Variété structurelle A/B, mais répétition quasi-totale dès la session B"**

**Couverture isolation :**
Pas de slot isolation pour shoulders (lateral/rear) → lacune problématique
Aucun leg curl machine ou ischio dédié → bw-nordic-curl en compound fallback
→ Verdict : **Lacunes problématiques** (shoulders_rear/lat manquants, ischio limité)

**Verdict global :** ⚠️ Problème mineur à modéré — programme fonctionnel pour un débutant absolu mais avec un pool d'exercices insuffisant pour 3 sessions distinctes en BW seul. Recommandation : ajouter des exercices BW non-warmup pour shoulders_rear (ex. reverse snow angel) et calves isolation.

---

## P22 — Haltères seuls, hypertrophie, 3j, beginner

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:['dumbbell'], level:'beginner' }
```

### Étapes 1–2
workoutTypeFromFocus → null
selectSplit : 3j, isMass, beginner → `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`

### Étape 3 — adjustedSlotCount(9, 60) = 9

### Étape 4 — Sélection (BUG4 focus)

**Vérification BUG4 — slot dos compound en DB-only :**

Slot fullbody-quad #3 : `{ muscles: ['back_width', 'back_thickness', 'back'], compound: true }`

Candidats DB avec primaryMuscle ∈ ['back_width', 'back_thickness', 'back'] :
- `seed-row-dumbbell` (back_thickness, **compound**, pop:3) ✓
- `seed-pullover-dumbbell` (back_thickness, isolation, pop:3) — filtré car compound preferred
- `seed-pullover` (back_width, isolation, pop:1) — filtré
- `seed-shrug` (back, isolation, pop:2) — filtré

Filtre compound : `seed-row-dumbbell` (seul compound) → **slot non vide**
→ BUG4 : **PASS** — `back_thickness` est bien dans les muscles du slot (ligne 152-153), donc `seed-row-dumbbell` qualifie.

Le BUG4 aurait été déclenché si le slot n'avait listé que `['back_width']`. Avec `['back_width','back_thickness','back']`, le rowing haltère est qualifié.

**Full Body A (fullbody-quad) :**

| # | Slot (muscles) | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|---------------|-----------------|-----------------|-------------|
| 0 | warmup | — | seed-bird-dog | 2×10 |
| 1 | quads/glutes cmp | seed-lunges(2,db), seed-bulgarian-split-squat(2,db) | **seed-lunges** | 4×8-12 |
| 2 | chest/chest_upper cmp | seed-bench-dumbbell(3), seed-incline-bench-dumbbell(2) | **seed-bench-dumbbell** | 4×8-12 |
| 3 | back_width/back_thickness/back cmp | seed-row-dumbbell(3) seul compound | **seed-row-dumbbell** | 4×8-12 |
| 4 | shoulders/shoulders_front cmp | seed-shoulder-press-dumbbell(3), seed-arnold-press(2) | **seed-shoulder-press-dumbbell** | 4×8-12 |
| 5 | hamstrings iso→fallback | dumbbell-rdl(2) seul DB hamstrings | **dumbbell-rdl** | 3×10-15 |
| 6 | shoulders_rear iso | seed-rear-delt-fly(2) seul DB | **seed-rear-delt-fly** | 3×10-15 |
| 7 | biceps iso | seed-curl-dumbbell(3), seed-curl-hammer(3), seed-curl-incline(2) | **seed-curl-dumbbell** | 3×10-15 |
| 8 | triceps iso | seed-triceps-overhead(2), seed-triceps-kickback(1) | **seed-triceps-overhead** | 3×10-15 |
| 9 | calves iso | **aucun exercice DB calves** | — slot vide — | — |
| 10 | core | seed-scissors | | 3×15 |

usedGlobally après A : {seed-lunges, seed-bench-dumbbell, seed-row-dumbbell, seed-shoulder-press-dumbbell, dumbbell-rdl, seed-rear-delt-fly, seed-curl-dumbbell, seed-triceps-overhead}
Total : 8 slots effectifs + warmup + core = **10**

---

**Full Body B (fullbody-hip) :**

Slots fullbody-hip : hamstrings/glutes cmp | chest/chest_upper cmp | back_width/back cmp | shoulders cmp | quads iso | shoulders_lat/rear iso | biceps iso | triceps iso | calves iso

| # | Slot | Exercice retenu | Note |
|---|------|-----------------|------|
| 0 | warmup | seed-cat-cow | |
| 1 | hamstrings/glutes cmp | **dumbbell-rdl** (UTILISÉ — seul DB hamstrings) | Répétition forcée |
| 2 | chest/chest_upper cmp | **seed-incline-bench-dumbbell** (non utilisé) | |
| 3 | back_width/back cmp `['back_width','back']` | **seed-shrug** (back, iso, pop:2) | Aucun DB compound pour back_width ou back — fallback iso. seed-pullover(1) en second. |
| 4 | shoulders cmp | **seed-arnold-press** (non utilisé, pop:2) | seed-shoulder-press utilisé |
| 5 | quads iso→fallback | **seed-bulgarian-split-squat** (non utilisé, cmp fallback) | Aucun DB quads isolation |
| 6 | shoulders_lat/rear iso | **seed-lateral-raise** (non utilisé, pop:3) | seed-rear-delt-fly utilisé |
| 7 | biceps iso | **seed-curl-hammer** (non utilisé, pop:3) | seed-curl-dumbbell utilisé |
| 8 | triceps iso | **seed-triceps-kickback** (non utilisé, pop:1) | seed-triceps-overhead utilisé |
| 9 | calves iso | — slot vide — | Aucun DB calves |
| 10 | core | seed-crunch | |

---

**Full Body C (fullbody-quad) :**

| # | Slot | Exercice retenu | Note |
|---|------|-----------------|------|
| 0 | warmup | seed-shoulder-circles | |
| 1 | quads/glutes cmp | **seed-lunges** (tous DB quads utilisés — lunges retenu car pop:2 = bulgarian) | Répétition forcée |
| 2 | chest/chest_upper cmp | **seed-bench-dumbbell** (utilisé, bw-incline aussi utilisé) | Répétition forcée |
| 3 | back_width/back_thickness/back cmp | **seed-row-dumbbell** (utilisé — seul compound) | Répétition forcée |
| 4 | shoulders cmp | **seed-shoulder-press-dumbbell** (utilisé) | Répétition forcée |
| 5 | hamstrings iso→fallback | **dumbbell-rdl** (utilisé — seul) | Répétition forcée |
| 6 | shoulders_rear iso | **seed-rear-delt-fly** (utilisé — seul) | Répétition forcée |
| 7 | biceps iso | **seed-curl-incline** (non utilisé, pop:2) | |
| 8 | triceps iso | **seed-triceps-overhead** (utilisé — kickback aussi utilisé) | Répétition forcée |
| 9 | calves | — slot vide — | |
| 10 | core | seed-bicycle-crunch | |

### Assertions [PASS/FAIL]

- Split `['fullbody-quad','fullbody-hip','fullbody-quad']` : **PASS**
- BUG4 — slot dos compound non vide en DB-only : **PASS** (seed-row-dumbbell retenu)
- `back_thickness` dans muscles du slot compound back (ligne 152) : **PASS**
- Aucun exercice non-dumbbell : **PASS**
- Slot calves vide en DB-only (aucun dumbbell calves dans le seed) : **PASS** (comportement attendu, slot skippé)

### Évaluation coach

**Équilibre musculaire :**
- Push/pull respecté (bench + row) ✓
- Slot back_width : fallback sur shrug (isolation "dos général") en session B — tirage vertical absent en DB-only (pullup est BW, lat pulldown est câble) → back_width mal couvert

**Cohérence objectif :**
- 4×8-12 hypertrophie ✓
- dumbbell-rdl en compound ET isolation hamstrings → même exercice dans deux rôles différents entre sessions

**Équipement :**
- Pas de calves DB dans le seed → slot calves systématiquement vide (3 sessions)
- Pas de quads isolation DB → fallback Bulgarian split squat (compound) pour le slot iso

**Variété :**
- Session C quasiment identique à A (mêmes exercices, pool épuisé)
- Verdict : **"Variété exercices uniquement A→B, Répétition partielle B→C"**

**Verdict global :** ⚠️ Problème mineur — BUG4 bien corrigé (row-dumbbell qualifié). Lacune notable : absence de calves DB et de quads isolation DB dans le seed limite la qualité du programme.

---

## P23 — BB+DB strength, intermediate, 4j → Upper/Lower A/B

```
{ goal:'strength', daysPerWeek:4, sessionDuration:60, equipment:['barbell','dumbbell'], level:'intermediate' }
```

### Étape 1
workoutTypeFromFocus → null

### Étape 2 — selectSplit (ligne 309–310)
`daysPerWeek:4`, `isMass:true` → `['upper-push', 'lower-quad', 'upper-pull', 'lower-hip']`
Noms : "Upper — Haut du corps A", "Lower — Bas du corps A", "Upper — Haut du corps B", "Lower — Bas du corps B"

### Étape 3 — adjustedSlotCount
- upper-push / upper-pull : base = 8 slots → `adjustedSlotCount(8, 60)` = 8
- lower-quad / lower-hip : base = 6 slots → `adjustedSlotCount(6, 60)` = 6

Specs strength :
- Compound : 5 séries, 3-5 reps, repos 180s
- Isolation : 3 séries, 5-8 reps, repos 120s

Tri strength compound (ligne 473-475) : `strengthEquipmentPrio` → barbell(0) < machine(1) = cable(1) < dumbbell(2) < band(3) < bodyweight(4)

### Étape 4 — Session 1 : upper-push

Slots : chest/chest_upper cmp | back/width/thickness cmp | shoulders cmp | chest isol | triceps isol | shoulders_lat isol | biceps isol | back_thickness isol

| # | Slot | Top-3 candidats (pop × équip) | Exercice probable (intermédiaire) | Séries×Reps |
|---|------|-------------------------------|----------------------------------|-------------|
| 0 | warmup | — | seed-bird-dog | 2×10 |
| 1 | chest/chest_upper cmp ★ | **seed-bench-barbell(8,bb)**, seed-incline-bench-barbell(4,bb), seed-bench-dumbbell(3,db) | seed-bench-barbell (random top-3, bb favori) | 5×3-5 |
| 2 | back_width/thickness/back cmp | **seed-row-barbell(7,bb)**, seed-deadlift(3,bb), seed-row-tbar(2,bb) | seed-row-barbell (random top-3) | 5×3-5 |
| 3 | shoulders/shoulders_front cmp | **seed-ohp-barbell(3,bb)**, seed-shoulder-press-dumbbell(3,db), seed-arnold-press(2,db) | seed-ohp-barbell (bb prioritaire) | 5×3-5 |
| 4 | chest/chest_lower/chest_upper isol | seed-fly-dumbbell(2,db) seul isol | **seed-fly-dumbbell** | 3×5-8 |
| 5 | triceps isol | seed-skullcrusher(2,bb), seed-triceps-overhead(2,db), seed-triceps-kickback(1,db) | random top-3 | 3×5-8 |
| 6 | shoulders_lateral isol | seed-lateral-raise(3,db) seul isol | **seed-lateral-raise** | 3×5-8 |
| 7 | biceps isol | seed-curl-barbell(3,bb), seed-curl-dumbbell(3,db), seed-curl-hammer(3,db) | random top-3 | 3×5-8 |
| 8 | back_thickness/back isol | seed-pullover-dumbbell(3,db), seed-shrug(2,db) | random top-2 | 3×5-8 |
| 9 | core | seed-scissors | | 3×15 |

★ Assertion P23 : slot chest compound → barbell prioritaire. Top-3 = [seed-bench-barbell, seed-incline-bench-barbell, seed-decline-bench-barbell]. Tous BB. **PASS**.

### Session 2 : lower-quad

Slots : quads/glutes cmp | hamstrings/glutes cmp | quads isol | hamstrings isol | glutes isol | calves isol

| # | Slot | Top-3 candidats | Exercice probable | Séries×Reps |
|---|------|-----------------|-------------------|-------------|
| 0 | warmup | — | seed-cat-cow | 2×10 |
| 1 | quads/glutes cmp ★★ | **seed-squat-barbell(8,bb)**, seed-hip-thrust(4,bb), seed-front-squat(2,bb) | seed-squat-barbell (bb prioritaire) | 5×3-5 |
| 2 | hamstrings/glutes cmp | seed-hip-thrust(4,bb), seed-romanian-deadlift(3,bb), seed-good-morning(1,bb) | random top-3 | 5×3-5 |
| 3 | quads isol→fallback cmp | seed-front-squat(2,bb), seed-lunges(2,db), seed-bulgarian-split-squat(2,db) | random top-3 (aucun isol BB/DB quads) | 3×5-8 |
| 4 | hamstrings isol→fallback | dumbbell-rdl(2,db), seed-good-morning(1,bb) | dumbbell-rdl ou good-morning | 3×5-8 |
| 5 | glutes isol | **— slot vide —** | Aucun glutes isolation BB/DB | — |
| 6 | calves isol | **— slot vide —** | Aucun calves BB/DB | — |
| 7 | core | seed-bicycle-crunch | | 3×15 |

★★ Assertion : squat slot → barbell squat, pas goblet squat. **PASS** (goblet-squat est kettlebell, exclu de available).

### Session 3 : upper-pull

Slots : back_width/back cmp | back_thickness/back cmp | chest/chest_upper cmp | shoulders_rear isol | biceps isol | back_thickness/back isol | triceps isol | shoulders_lateral isol

| # | Slot | Top-3 candidats | Exercice probable | Séries×Reps |
|---|------|-----------------|-------------------|-------------|
| 0 | warmup | seed-shoulder-circles | | 2×10 |
| 1 | back_width/back cmp | seed-deadlift(3,bb) [seul bb back_width/back], seed-row-dumbbell(3,db) | seed-deadlift ou row-dumbbell | 5×3-5 |
| 2 | back_thickness/back cmp | seed-row-barbell(7,bb), seed-row-tbar(2,bb), seed-row-dumbbell(3,db) | random top-3 (bb first) | 5×3-5 |
| 3 | chest/chest_upper cmp | seed-bench-barbell(8,bb), seed-incline-bench-barbell(4,bb), seed-bench-dumbbell(3,db) | random top-3 non utilisé | 5×3-5 |
| 4 | shoulders_rear isol | seed-rear-delt-fly(2,db) seul | **seed-rear-delt-fly** | 3×5-8 |
| 5 | biceps isol | seed-curl-barbell(3,bb), seed-curl-dumbbell(3,db), seed-curl-hammer(3,db) | random top-3 | 3×5-8 |
| 6 | back_thickness/back isol | seed-pullover-dumbbell(3,db), seed-shrug(2,db) | random top-2 | 3×5-8 |
| 7 | triceps isol | seed-skullcrusher(2,bb), seed-triceps-overhead(2,db), seed-triceps-kickback(1,db) | random top-3 | 3×5-8 |
| 8 | shoulders_lateral isol | seed-lateral-raise(3,db) | **seed-lateral-raise** | 3×5-8 |
| 9 | core | seed-vertical-leg-crunch | | 3×15 |

### Session 4 : lower-hip

Slots : glutes/hamstrings cmp | quads/glutes cmp | glutes isol | hamstrings isol | quads isol | calves isol

| # | Slot | Top-3 candidats | Exercice probable | Séries×Reps |
|---|------|-----------------|-------------------|-------------|
| 0 | warmup | seed-dead-bug | | 2×10 |
| 1 | glutes/hamstrings cmp | seed-hip-thrust(4,bb), seed-romanian-deadlift(3,bb), seed-good-morning(1,bb) | random top-3 | 5×3-5 |
| 2 | quads/glutes cmp | seed-squat-barbell(8,bb), seed-front-squat(2,bb), seed-lunges(2,db) | random top-3 | 5×3-5 |
| 3 | glutes isol | **— slot vide —** | Aucun glutes iso BB/DB | — |
| 4 | hamstrings isol→fallback | dumbbell-rdl(2,db), seed-good-morning(1,bb) | | 3×5-8 |
| 5 | quads isol→fallback | seed-front-squat(2,bb), seed-lunges(2,db), seed-bulgarian-split-squat(2,db) | | 3×5-8 |
| 6 | calves isol | **— slot vide —** | Aucun calves BB/DB | — |
| 7 | core | seed-leg-raise | | 3×15 |

### Assertions [PASS/FAIL]

- Split `['upper-push','lower-quad','upper-pull','lower-hip']` : **PASS** (ligne 310)
- `scoreEquip(strength, barbell) < scoreEquip(strength, dumbbell)` → prio bb (0 < 2) : **PASS** (ligne 424-434)
- Slot chest compound → barbell en top-3, barbell prioritaire : **PASS**
- Slot squat → seed-squat-barbell (bb, pop:8) en tête : **PASS**
- Slots glutes isolation et calves vides (aucun BB/DB dans le seed) : attendu, **PASS comportemental**

### autoProgress / progressStepKg P23
BB/DB exercises → `progressStepKg: 2.5`, `autoProgress: true` ✓

### Évaluation coach

**Qualité équipement :**
- Barbell bien prioritaire sur compound en strength ✓
- Excellent pour les composés majeurs (squat, bench, row, OHP)
- Manque isolation glutes et mollets (aucun BB/DB disponible dans seed)

**Cohérence objectif :**
- 5×3-5 sur compound strength ✓ — approprié pour force
- 3×5-8 sur isolation — cohérent avec strength (force-endurance)
- Repos 180s/120s — correct pour développement force

**Variété :**
- Structure différenciée upper-push/upper-pull ✓ (bench-first vs traction-first)
- Structure différenciée lower-quad/lower-hip ✓ (squat-dominant vs hip-dominant)
- intermediate → pickExercise random top-3 → rotation naturelle ✓

**Lacunes :**
- 2 slots systématiquement vides sur lower-quad ET lower-hip : glutes isolation + calves isolation
- Hamstrings isolation : fallback sur compound (dumbbell-rdl ou good-morning) — acceptable pour strength

**Verdict global :** ✅ Bon programme avec réserves sur les slots vides (glutes iso, calves iso). Structure BB+DB strength bien implémentée.

---

## P24 — Machine+Cable only, hypertrophie, 3j, beginner

```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:['machine','cable'], level:'beginner' }
```

### Étapes 1–2
workoutTypeFromFocus → null
selectSplit : 3j, isMass, beginner → `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`

### Étape 4 — Sélection

**available Machine+Cable (non-warmup, non-deleted, pop>0) :**
Muscle → exercices :
- quads cmp : seed-leg-press(3,mach), seed-hack-squat(2,mach)
- chest cmp : seed-chest-press-machine(3,mach)
- back_width cmp : seed-lat-pulldown(3,cable)
- back_thickness cmp : seed-row-cable(2,cable), seed-row-machine(1,mach)
- shoulders cmp : seed-shoulder-press-machine(3,mach)
- hamstrings iso : seed-leg-curl-lying(3,mach), seed-leg-curl-seated(2), seed-leg-curl-standing(2)
- quads iso : seed-leg-extension(3,mach)
- glutes iso : seed-hip-abduction(2,mach), seed-hip-adduction-machine(2,mach), seed-glute-kickback(1,cable)
- calves iso : seed-calf-raise-seated(2,mach), seed-calf-raise-standing(2,mach)
- triceps iso : seed-triceps-rope(3,cable), seed-triceps-pushdown(3,cable)
- biceps iso : seed-curl-cable(2,cable)
- shoulders_rear iso : seed-face-pull(2,cable)
- shoulders_lateral iso : seed-lateral-raise-cable(2,cable)
- shoulders_lateral cmp : seed-upright-row-cable(2,cable)
- back_thickness iso : seed-pullover-cable(2,cable), seed-straight-arm-pulldown(2,cable)
- chest iso : seed-fly-cable(2,cable)
- core : seed-cable-crunch(2,cable) + BW core pool

**MANQUANTS :** Aucun machine ou cable pour back_width machine ; aucun hamstrings/glutes compound machine/cable.

---

**Full Body A (fullbody-quad) :**

| # | Slot | Top-3 candidats | Exercice retenu | Séries×Reps |
|---|------|-----------------|-----------------|-------------|
| 0 | warmup | — | seed-bird-dog | 2×10 |
| 1 | quads/glutes cmp | seed-leg-press(3,mach), seed-hack-squat(2,mach) | **seed-leg-press** | 4×8-12 |
| 2 | chest/chest_upper cmp | seed-chest-press-machine(3,mach) seul | **seed-chest-press-machine** | 4×8-12 |
| 3 | back_width/thickness/back cmp | seed-lat-pulldown(3,cable), seed-row-cable(2,cable), seed-row-machine(1,mach) | **seed-lat-pulldown** | 4×8-12 |
| 4 | shoulders cmp | seed-shoulder-press-machine(3,mach) seul | **seed-shoulder-press-machine** | 4×8-12 |
| 5 | hamstrings iso | seed-leg-curl-lying(3,mach), seed-leg-curl-seated(2), seed-leg-curl-standing(2) | **seed-leg-curl-lying** | 3×10-15 |
| 6 | shoulders_rear iso | seed-face-pull(2,cable) seul | **seed-face-pull** | 3×10-15 |
| 7 | biceps iso | seed-curl-cable(2,cable) seul | **seed-curl-cable** | 3×10-15 |
| 8 | triceps iso | seed-triceps-rope(3,cable), seed-triceps-pushdown(3,cable) | **seed-triceps-rope** | 3×10-15 |
| 9 | calves iso | seed-calf-raise-seated(2), seed-calf-raise-standing(2) | **seed-calf-raise-seated** | 3×10-15 |
| 10 | core | seed-scissors → mais cable-crunch disponible | corePool[0] = seed-scissors* | 3×15 |

*corePool pour Machine+Cable : le code filtre `allowed.has(ex.equipment) || ex.equipment === 'bodyweight'`. seed-cable-crunch (cable) → allowed.has('cable') = true. Mais les exercices BW core sont aussi inclus. corePool en ordre JSON : seed-scissors(BW), seed-crunch(BW), seed-cable-crunch(cable)... → corePool[0] = seed-scissors.

Total : 9 slots + warmup + core = **11 exercices**

---

**Full Body B (fullbody-hip) :**

usedGlobally = {seed-leg-press, seed-chest-press-machine, seed-lat-pulldown, seed-shoulder-press-machine, seed-leg-curl-lying, seed-face-pull, seed-curl-cable, seed-triceps-rope, seed-calf-raise-seated}

| # | Slot | Exercice retenu | Note |
|---|------|-----------------|------|
| 0 | warmup | seed-cat-cow | |
| 1 | hamstrings/glutes cmp | **seed-glute-kickback** (iso fallback, pop:1) | Aucun machine/cable hamstring ou glute compound → fallback iso |
| 2 | chest/chest_upper cmp | **seed-chest-press-machine** (UTILISÉ — seul) | Répétition forcée |
| 3 | back_width/back cmp `['back_width','back']` | **seed-lat-pulldown** (UTILISÉ — seul back_width cable) | Répétition forcée |
| 4 | shoulders cmp | **seed-shoulder-press-machine** (UTILISÉ — seul) | Répétition forcée |
| 5 | quads iso | **seed-leg-extension** (non utilisé, pop:3) | |
| 6 | shoulders_lat/rear iso | **seed-lateral-raise-cable** (non utilisé, pop:2) | seed-face-pull utilisé |
| 7 | biceps iso | **seed-curl-cable** (UTILISÉ — seul) | Répétition forcée |
| 8 | triceps iso | **seed-triceps-pushdown** (non utilisé, pop:3) | seed-triceps-rope utilisé |
| 9 | calves iso | **seed-calf-raise-standing** (non utilisé, pop:2) | |
| 10 | core | seed-crunch | |

**Problème majeur B :** slot 1 (hamstrings/glutes compound) → aucun machine/cable compound → fallback sur `seed-glute-kickback` (isolation cable, pop:1) — un kickback fessier comme premier exercice de la session fullbody-hip.

---

**Full Body C (fullbody-quad) :**

| # | Slot | Exercice retenu |
|---|------|-----------------|
| 0 | warmup | seed-shoulder-circles |
| 1 | quads/glutes cmp | **seed-hack-squat** (non utilisé, pop:2) |
| 2 | chest cmp | **seed-chest-press-machine** (utilisé 2×) |
| 3 | back cmp | **seed-lat-pulldown** (utilisé 2×) |
| 4 | shoulders cmp | **seed-shoulder-press-machine** (utilisé 2×) |
| 5 | hamstrings iso | **seed-leg-curl-seated** (non utilisé, pop:2) |
| 6 | shoulders_rear iso | **seed-face-pull** (utilisé — seul) |
| 7 | biceps iso | **seed-curl-cable** (utilisé 2×) |
| 8 | triceps iso | **seed-triceps-rope** (utilisé — pushdown aussi utilisé) → seed-triceps-rope retenu (push-down en usedGlobally, rope aussi) → les deux utilisés → seed-triceps-rope (pop:3 = pushdown) → ordre array : seed-triceps-rope avant |
| 9 | calves iso | **seed-calf-raise-seated** (utilisé) ou seed-calf-raise-standing (utilisé) → les deux utilisés → seed-calf-raise-seated (array order) |
| 10 | core | seed-bicycle-crunch |

### Assertions [PASS/FAIL]

- Aucun exercice barbell ou dumbbell : **PASS**
- Slot dos compound — lat pulldown (cable) identifié : **PASS** (seed-lat-pulldown, pop:3)
- Slot chest compound — machine chest press identifié : **PASS** (seed-chest-press-machine, pop:3)
- Slot hamstrings/glutes compound en fullbody-hip → fallback iso (glute-kickback) : anomalie comportementale — **à noter**

### Évaluation coach

**Qualité équipement :**
- Machine/Cable bien exploité pour les isolations : excellentes machines (leg curl, extension, calf raise) ✓
- Lat pulldown cable = meilleur substitut au pullup ✓
- **Manque critique** : aucun compound machine ou cable pour hamstrings ni glutes — la session fullbody-hip démarre avec un kickback fessier (isolation câble, pop:1) au lieu d'un composé hip-dominant

**Équilibre musculaire :**
- Sessions A/C : quads très bien couvertes (leg press + hack squat sur la semaine)
- Session B : glutes/hamstrings sous-stimulés (kickback seulement)
- Biceps : 1 seul exercice dans le seed (curl câble) → répétition garantie

**Variété :**
- 4 exercices structurellement répétés dès session B (chest press, lat pulldown, shoulder press machine, curl câble)
- Verdict : **"Variété partielle — pool machine trop restreint pour composés bas du corps"**

**Verdict global :** ⚠️ Problème modéré — filtrage équipement correct mais le seed ne couvre pas les composés bas du corps en machine/cable. Recommandation : ajouter des exercices machine pour hamstrings compound (leg press horizontal), ou marquer seed-leg-press comme glutes/quads compound utilisable pour fullbody-hip.

---

## P25 — Band+Bodyweight, fat_loss, 2j, beginner

```
{ goal:'fat_loss', daysPerWeek:2, sessionDuration:60, equipment:['band','bodyweight'], level:'beginner' }
```

### Étapes 1–2
workoutTypeFromFocus → null
selectSplit : 2j → `['fullbody-quad', 'fullbody-hip']`
Noms : "Full Body A", "Full Body B"

### Specs fat_loss
- Compound : 3 séries, 12-15 reps, repos 60s
- Isolation : 3 séries, 12-15 reps, repos 60s
- Warmup : 2×10, repos 0s / Core : 3×15, repos 60s

### available Band+BW (non-warmup, non-deleted, pop>0)

Band : band-squat(2), band-row(2), band-overhead-press(2), band-hip-thrust(2), band-curl(2), band-tricep-pushdown(2), band-chest-press(1), band-good-morning(1)
BW : seed-hip-thrust-bw(4), seed-glute-bridge(3), bw-squat(3), bw-chinup(3), seed-dips(3), seed-pullup(3), seed-pushup(2), bw-lunge(2), bw-nordic-curl(2), bw-calf-raise(2), bw-incline-pushup(2), bw-wall-sit(2), seed-donkey-kick(2), seed-fire-hydrant(2), seed-triceps-dips(2), seed-curtsy-lunge(1), bw-inverted-row(1), bw-pike-pushup(1), bw-jump-squat(1)

**Note critique :** `seed-band-pull-apart` (shoulders_rear, band) est `isWarmupExercise:true` → exclu de `available`, uniquement dans `warmupPool`.

**warmupPool Band+BW :** seed-band-pull-apart(2,band) en tête (premier en JSON), puis BW warmup
→ Session A (index 0) : seed-band-pull-apart
→ Session B (index 1) : seed-bird-dog

**corePool Band+BW :** BW core + aucun band core → même que P21
→ Session A (index 0) : seed-scissors
→ Session B (index 1) : seed-crunch

---

**Full Body A (fullbody-quad) :**

| # | Slot (muscles) | Top-3 candidats (pop desc) | Exercice retenu | Séries×Reps |
|---|---------------|---------------------------|-----------------|-------------|
| 0 | warmup | — | seed-band-pull-apart | 2×10 |
| 1 | quads/glutes cmp | seed-hip-thrust-bw(4,BW), bw-squat(3,BW), band-squat(2,band) | **seed-hip-thrust-bw** | 3×12-15 |
| 2 | chest/chest_upper cmp | seed-pushup(2,BW), bw-incline-pushup(2,BW), band-chest-press(1,band) | **seed-pushup** | 3×12-15 |
| 3 | back_width/thickness/back cmp | seed-pullup(3,BW), band-row(2,band), bw-inverted-row(1,BW) | **seed-pullup** | 3×12-15 |
| 4 | shoulders/shoulders_front cmp | band-overhead-press(2,band), bw-pike-pushup(1,BW) | **band-overhead-press** | 3×12-15 |
| 5 | hamstrings iso→fallback | bw-nordic-curl(2,BW), band-good-morning(1,band) | **bw-nordic-curl** | 3×12-15 |
| 6 | shoulders_rear iso | **— slot vide —** | Aucun BW/band shoulders_rear non-warmup | — |
| 7 | biceps iso | band-curl(2,band) [seul isolation] | **band-curl** | 3×12-15 |
| 8 | triceps iso | band-tricep-pushdown(2,band) [seul isolation] | **band-tricep-pushdown** | 3×12-15 |
| 9 | calves iso | bw-calf-raise(2,BW) seul | **bw-calf-raise** | 3×12-15 |
| 10 | core | seed-scissors | | 3×15 |

Total : 8 slots effectifs + warmup + core = **10 exercices**

Note coach : slot 1 retient seed-hip-thrust-bw (pop:4) pour quads/glutes — la fullbody-quad devrait commencer par un squat, mais l'algorithme choisit l'exercice de plus haute popularité (hip-thrust-bw). Résultat : la session A commence par un hip thrust, exercice hip-dominant, dans une session fullbody-**quad**.

---

**Full Body B (fullbody-hip) :**

usedGlobally = {seed-hip-thrust-bw, seed-pushup, seed-pullup, band-overhead-press, bw-nordic-curl, band-curl, band-tricep-pushdown, bw-calf-raise}

| # | Slot | Top-3 candidats | Exercice retenu | Note |
|---|------|-----------------|-----------------|------|
| 0 | warmup | — | seed-bird-dog | |
| 1 | hamstrings/glutes cmp | band-hip-thrust(2,non utilisé), band-good-morning(1,non utilisé), seed-curtsy-lunge(1,non utilisé) | **band-hip-thrust** | seed-hip-thrust-bw utilisé |
| 2 | chest/chest_upper cmp | bw-incline-pushup(2,non utilisé), band-chest-press(1) | **bw-incline-pushup** | seed-pushup utilisé |
| 3 | back_width/back cmp `['back_width','back']` | seed-pullup(3,UTILISÉ — seul back_width/back BW/band) | **seed-pullup** (répétition forcée) | bw-inverted-row a primaryMuscle:back_thickness, pas dans ce slot |
| 4 | shoulders cmp | bw-pike-pushup(1,non utilisé) | **bw-pike-pushup** | band-overhead-press utilisé |
| 5 | quads iso | bw-wall-sit(2,iso,non utilisé) | **bw-wall-sit** | |
| 6 | shoulders_lat/rear iso | **— slot vide —** | Aucun BW/band shoulders_lateral/rear non-warmup | |
| 7 | biceps iso | band-curl(UTILISÉ — seul iso biceps) | **band-curl** (répétition) | |
| 8 | triceps iso | band-tricep-pushdown(UTILISÉ — seul iso) | **band-tricep-pushdown** (répétition) | |
| 9 | calves iso | bw-calf-raise(UTILISÉ — seul) | **bw-calf-raise** (répétition) | |
| 10 | core | seed-crunch | | |

### Assertions [PASS/FAIL]

- Aucun exercice nécessitant haltère/barre/câble/machine : **PASS**
- Slot shoulders_rear vide (band-pull-apart est warmup → exclu de available) : **PASS** comportemental, anomalie sémantique
- fat_loss → 3×12-15, repos 60s : **PASS**
- autoProgress:true pour slots non-warmup, progressStepKg:0 (band et bodyweight) : **PASS** (partial — autoProgress:true, non false)

### Évaluation coach

**Objectif fat_loss / intensité :**
- 3×12-15 à 60s repos en circuit → bon stimulus cardio-force ✓
- Band + BW = faible résistance absolue → difficile de progresser au-delà d'un niveau intermédiaire
- hip-thrust-bw (pop:4) en slot 1 fullbody-quad : inadéquat pour une session quad-dominante

**Équilibre :**
- Slot shoulders_rear systématiquement vide (2 sessions) — déséquilibre push/pull vertical
- Biceps et triceps : 1 seul exercice disponible chacun → répétition totale dès session B

**Qualité band :**
- Band correctement utilisé pour press, row, curl, tricep, OHP ✓
- band-chest-press (pop:1) peu connu mais fonctionnel

**Verdict global :** ⚠️ Problème modéré — filtrage correct, mais pool Band+BW insuffisant (shoulders_rear absent hors warmup, biceps et triceps 1 exercice chacun). Programme acceptable pour un total débutant, insuffisant au-delà.

---

## P26 — Advanced strength PPL 3j → pickExercise random top-3

```
{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'advanced' }
```

### Étape 1
workoutTypeFromFocus → null

### Étape 2 — selectSplit (ligne 302)
`daysPerWeek:3`, `isMass:true` (strength), `level:'advanced'` (≠ 'beginner')
→ `if (isMass && level !== 'beginner') return ['push', 'pull', 'legs']`
Noms : "Push — Poussée", "Pull — Tirage", "Legs — Jambes"

### Vérification branche pickExercise (ligne 484-486)

```typescript
if (level === 'beginner') return candidates[0] ?? null  // ligne 484
const pool = candidates.slice(0, 3)                     // ligne 485
return pool[Math.floor(Math.random() * pool.length)] ?? null  // ligne 486
```

`level:'advanced'` → branche else → `candidates.slice(0,3)` + `Math.random()` ✓

### Étape 4 — Top-3 chest compound (Push, slot 0)

Slot : `{ muscles: ['chest', 'chest_upper', 'chest_lower'], compound: true }`
Goal : strength → `strengthEquipmentPrio` appliqué (barbell=0, machine=1, cable=1, dumbbell=2, bodyweight=4)

Candidats FULL avec primaryMuscle ∈ ['chest', 'chest_upper', 'chest_lower'] et category='compound' :

| id | Muscle | Equipment | Prio | Pop |
|----|--------|-----------|------|-----|
| seed-bench-barbell | chest | barbell | 0 | 8 |
| seed-incline-bench-barbell | chest_upper | barbell | 0 | 4 |
| seed-decline-bench-barbell | chest_lower | barbell | 0 | 1 |
| seed-bench-dumbbell | chest | dumbbell | 2 | 3 |
| seed-incline-bench-dumbbell | chest_upper | dumbbell | 2 | 2 |
| seed-dips | chest_lower | bodyweight | 4 | 3 |
| seed-pushup | chest | bodyweight | 4 | 2 |
| bw-incline-pushup | chest_upper | bodyweight | 4 | 2 |
| seed-chest-press-machine | chest | machine | 1 | 3 |

Tri : prio équipement (asc), puis usedGlobally, puis pop desc :
1. **seed-bench-barbell** (barbell, prio:0, pop:8)
2. **seed-incline-bench-barbell** (barbell, prio:0, pop:4)
3. **seed-decline-bench-barbell** (barbell, prio:0, pop:1)

→ `candidates.slice(0,3)` = [seed-bench-barbell, seed-incline-bench-barbell, seed-decline-bench-barbell]

Tous les 3 sont des exercices **barbell** (bench couché, incliné, décliné). Le random choisit l'un des trois.

**Les 3 candidats chest compound pour P26 (advanced, strength, FULL) :**
1. `seed-bench-barbell` — Développé couché barre (chest, barbell, pop:8)
2. `seed-incline-bench-barbell` — Développé incliné barre (chest_upper, barbell, pop:4)
3. `seed-decline-bench-barbell` — Développé décliné barre (chest_lower, barbell, pop:1)

### Programme Push complet (advanced, strength, FULL)

Slots push (6 slots, 60 min) :
```
chest/chest_upper/chest_lower cmp | shoulders/shoulders_front cmp
chest/chest_upper/chest_lower iso | triceps iso | shoulders_lateral/shoulders iso | triceps iso
```

| # | Slot | Top-3 candidats | Séries×Reps |
|---|------|-----------------|-------------|
| 0 | warmup | — | seed-bird-dog, 2×10 |
| 1 | chest cmp | seed-bench-barbell(8,bb), seed-incline-bench-barbell(4,bb), seed-decline-bench-barbell(1,bb) | 5×3-5 |
| 2 | shoulders cmp | seed-ohp-barbell(3,bb), seed-shoulder-press-dumbbell(3,db), seed-shoulder-press-machine(3,mach) | 5×3-5 |
| 3 | chest iso | seed-fly-dumbbell(2,db), seed-fly-cable(2,cable), seed-pec-deck(2,mach) | 3×5-8 |
| 4 | triceps iso | seed-triceps-rope(3,cable), seed-triceps-pushdown(3,cable), seed-skullcrusher(2,bb) | 3×5-8 |
| 5 | shoulders_lat/shoulders iso | seed-lateral-raise(3,db), seed-lateral-raise-cable(2,cable), seed-upright-row-cable(2,cable) | 3×5-8 |
| 6 | triceps iso | pool résiduel, ex. seed-skullcrusher ou seed-triceps-overhead | 3×5-8 |
| 7 | core | seed-scissors | 3×15 |

Note : slot 5 `{ muscles: ['shoulders_lateral', 'shoulders'], compound: false }` — seed-lateral-raise(3,db,iso) en tête d'isolation, top-3 random pour advanced.

### Assertions [PASS/FAIL]

- Split `['push','pull','legs']` (advanced strength 3j) : **PASS** (ligne 302)
- `level:'advanced'` → `pickExercise` utilise `candidates.slice(0,3)` + `Math.random()` (ligne 485-486) : **PASS**
- Top-3 chest compound = [seed-bench-barbell, seed-incline-bench-barbell, seed-decline-bench-barbell] (tous BB, barbell prioritaire en strength) : **PASS**
- Aucun exercice non-FULL : trivial (**PASS**)

### Évaluation coach

**Qualité équipement :**
- FULL équipement → accès optimal au barbell pour tous les composés ✓
- random top-3 advanced → variété séance à séance ✓

**Cohérence objectif :**
- 5×3-5 compound strength → optimal ✓
- Repos 180s → nécessaire pour la force ✓

**Variété inter-sessions :**
- 3 séances distinctes (push/pull/legs) → pas de répétition de type ✓
- random top-3 crée une variation naturelle sur plusieurs semaines ✓

**Réserve coach :**
- seed-decline-bench-barbell (pop:1) en top-3 — exercice rarement sélectionné dans les programmes standard; pression discale cervicale à surveiller
- Slot triceps apparaît 2× dans push (slots 4 et 6) — sur-représentation triceps

**Verdict global :** ✅ Bon programme — PPL strength advanced bien structuré. La logique random top-3 est correctement implémentée.

---

## Récapitulatif Groupe C

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|--------|----------------------|---------|-------------------|
| P21 BW 3j | autoProgress:false FAIL (true pour slots) ; shoulders_rear slot vide ×3 | ⚠️ PASS partiel | Répétitions massives dès session B ; pool BW trop petit pour 3 sessions distinctes ; slot shoulders vide systématique |
| P22 DB 3j | BUG4 PASS (seed-row-dumbbell qualifie) ; slot calves vide ×3 | ⚠️ PASS partiel | Calves absent en DB ; back_width couvert par shrug (isolation) en session B ; C ≈ A |
| P23 BB+DB strength 4j | Barbell prioritaire PASS ; squat barbell PASS ; glutes iso + calves vides | ✅ PASS | Slots glutes isolation et calves vides (aucun BB/DB dans seed) ; hamstrings fallback compound |
| P24 Machine+Cable 3j | Aucun barbell/dumbbell PASS ; lat pulldown = slot back_width PASS ; hamstrings/glutes compound absent → fallback iso | ⚠️ PASS partiel | Session fullbody-hip débute par kickback cable (isolation) faute de composé hip machine/cable ; biceps 1 seul exercice |
| P25 Band+BW fat_loss 2j | Aucun BB/DB/mach/cable PASS ; shoulders_rear vide (band-pull-apart warmup) | ⚠️ PASS partiel | Slot shoulders_rear vide ; hip-thrust-bw choisi en slot quads/glutes cmp fullbody-quad (incohérent) ; pool trop étroit pour fat_loss |
| P26 Advanced PPL strength | Split PPL PASS ; random top-3 PASS (ligne 485) ; top-3 chest = 3 BB PASS | ✅ PASS | Slot triceps ×2 dans push ; decline bench (pop:1) en top-3 peu courant |

### Problèmes récurrents identifiés (Groupe C)

**Bug / Anomalie logicielle :**
- **[SLOTS-VIDES-CALVES]** Aucun exercice calves pour les équipements DB, BB+DB, Band+BW → slot calves systématiquement vide pour ces profils. Correction : ajouter `bw-calf-raise` au seed (déjà présent, BW) → sera disponible pour BB+DB et Band+BW via `ex.equipment==='bodyweight'`? Non — `available` filtre sur `allowed.has(ex.equipment)` strictement. Correction requise : ajouter dumbbell-calf-raise ou barbell-calf-raise dans le seed.
- **[SLOTS-VIDES-SHOULDERS]** Aucun exercice `shoulders_rear` ou `shoulders_lateral` en BW non-warmup → slot vide pour BW et Band+BW. `seed-band-pull-apart` devrait exister en version non-warmup (ou un exercice BW shoulders_rear dédié ajouté).
- **[AUTOPROGRESS-ASSERTION]** Assertion P21 spécifie `autoProgress:false` pour BW — le code génère `autoProgress:true` avec `progressStepKg:0`. Fonctionnellement sans impact (progressStep=0 → pas de progression réelle), mais l'assertion est inexacte ou le code devrait forcer `autoProgress:false` quand `progressStepKg===0`.

**Réserves coach thématiques :**
1. **Pool BW/Band insuffisant** (P21, P25) : 3 sessions identiques de type = répétitions quasi totales. Le seed manque d'exercices BW pour épaules arrière/latérales et ischiojambiers isolation.
2. **Absence composé machine bas du corps** (P24) : pas de squat machine/cable, pas de RDL cable → fullbody-hip machine/cable démarre par une isolation (kickback).
3. **Slot calves vide** (P22, P23) : absence d'exercice calves pour dumbbell et barbell. Impact réel sur la complétude du programme lower.
4. **Hip-thrust-bw priorité haute dans slot quads/glutes** (P21, P25) : pop:4 le place avant le squat BW (pop:3) dans le slot fullbody-quad — incohérent avec l'intention quad-dominante de la session A.

---

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

---

# Audit P31–P40 — Groupe E : Périodisation buildPhases

Source principale : `src/utils/programGenerator.ts`
Source wizard : `src/components/screens/ProgramGeneratorScreen.tsx`

---

## Rappel des formules clés (extraites du code)

```typescript
// buildPhases (ligne 560-614)
if (totalWeeks < 8) return undefined
const adapt     = 2
const deload    = totalWeeks >= 12 ? 2 : 1
const intensive = totalWeeks <= 9 ? 2 : (totalWeeks >= 16 ? 4 : 3)
const progress  = Math.max(1, totalWeeks - adapt - intensive - deload)
```

### COMPOUND_SPEC (ligne 58)
| Goal | sets | repsMin | repsMax | restSec |
|------|------|---------|---------|---------|
| strength | 5 | 3 | 5 | 180 |
| hypertrophy | 4 | 8 | 12 | 90 |
| endurance | 3 | 15 | 20 | 60 |
| fat_loss | 3 | 12 | 15 | 60 |

### ISOLATION_SPEC (ligne 65)
| Goal | sets | repsMin | repsMax | restSec |
|------|------|---------|---------|---------|
| strength | 3 | 5 | 8 | 120 |
| hypertrophy | 3 | 10 | 15 | 75 |
| endurance | 3 | 15 | 20 | 45 |
| fat_loss | 3 | 12 | 15 | 60 |

### PHASE_CONFIG_BY_GOAL (ligne 525)
| Goal | Phase | setsModifier | repsOffset |
|------|-------|-------------|-----------|
| strength | adaptation | -1 | +3 |
| strength | intensification | 0 | -3 |
| strength | deload | -2 | +4 |
| hypertrophy | adaptation | -1 | +2 |
| hypertrophy | intensification | +1 | -2 |
| hypertrophy | deload | -2 | 0 |
| endurance | adaptation | -1 | -2 |
| endurance | intensification | +1 | +3 |
| endurance | deload | -2 | 0 |
| fat_loss | adaptation | -1 | 0 |
| fat_loss | intensification | 0 | +3 |
| fat_loss | deload | -1 | 0 |

---

## P31 — buildPhases(7) → pas de périodisation

### Simulation

**Entrée :** `buildPhases(7)`

**Exécution :**
- Ligne 561 : `if (totalWeeks < 8) return undefined` → 7 < 8 → **retourne `undefined`** immédiatement.
- Le corps de la fonction n'est jamais exécuté.

**Wizard `phaseLabel(7)` (ProgramGeneratorScreen.tsx ligne 479–490) :**
```typescript
const phases = buildPhases(7)  // → undefined
if (!phases) return ''          // → condition vraie → retourne ''
```
→ `phaseLabel(7)` = `''` ✓

**`generateProgramDraft` avec `totalWeeks:7` (ligne 739) :**
```typescript
phases: buildPhases(durationWeeks, goal)  // = buildPhases(7, goal) = undefined
```
→ `DraftProgram.phases = undefined` ✓

### Assertions : [PASS/FAIL]
- `totalWeeks=7 < 8 → return undefined` (ligne 561) : **PASS**
- `phaseLabel(7)` → `''` (retour d'undefined) : **PASS**
- `generateProgramDraft` avec `totalWeeks:7` → `phases: undefined` : **PASS**

### Coach
Un programme de 7 semaines ne génère aucune périodisation : c'est la bonne décision. La littérature scientifique (Bompa, Issurin) s'accorde pour qu'un bloc de périodisation soit au minimum de 3–4 semaines. Avec seulement 7 semaines, une répartition en 4 phases produirait des blocs trop courts pour provoquer une adaptation physiologique significative. L'absence de périodisation (charge standard sur toutes les semaines) est donc pédagogiquement et physiologiquement justifiée.

**Verdict coach : ✅ Bon comportement — seuil ≥ 8 semaines pertinent**

---

## P32 — buildPhases(8, 'strength')

### Simulation

**Entrée :** `buildPhases(8, 'strength')`

**Calcul des durées :**
- `adapt = 2` (fixe)
- `deload = 8 >= 12 ? 2 : 1` → 8 < 12 → **deload = 1**
- `intensive = 8 <= 9 ? 2 : ...` → 8 ≤ 9 → **intensive = 2**
- `progress = max(1, 8 - 2 - 2 - 1) = max(1, 3)` → **progress = 3**
- Somme : 2 + 3 + 2 + 1 = **8 ✓**

**Construction des phases (w initialisé à 1) :**

| Phase | focus | weekStart | weekEnd | dur |
|-------|-------|-----------|---------|-----|
| Adaptation | adaptation | 1 | 2 | 2 |
| Progression | progression | 3 | 5 | 3 |
| Intensification | intensification | 6 | 7 | 2 |
| Décharge | deload | 8 | 8 | 1 |

**Modificateurs strength (depuis PHASE_CONFIG_BY_GOAL) :**
- adaptation : setsModifier=-1, repsOffset=+3
- intensification : setsModifier=0, repsOffset=-3
- deload : setsModifier=-2, repsOffset=+4

*(La phase Progression n'a pas de modificateurs — description fixe, volume standard.)*

### Assertions : [PASS/FAIL]
- 4 phases retournées : **PASS**
- `adaptation.weekStart=1, weekEnd=2` : **PASS**
- `progression.weekStart=3, weekEnd=5` : **PASS**
- `intensification.weekStart=6, weekEnd=7` : **PASS**
- `deload.weekStart=8, weekEnd=8` : **PASS**
- Modificateurs strength adaptation : setsModifier=-1, repsOffset=+3 : **PASS**
- Modificateurs strength intensification : setsModifier=0, repsOffset=-3 : **PASS**
- Modificateurs strength deload : setsModifier=-2, repsOffset=+4 : **PASS**

### Coach
Périodisation 8 semaines force : 2 sem. apprentissage → 3 sem. charge progressive → 2 sem. pic d'intensité → 1 sem. décharge.

Points positifs : le bloc d'adaptation de 2 semaines est suffisant pour la maîtrise technique des mouvements lourds (squat, deadlift, press). L'intensification sans modification du volume (setsModifier=0) mais avec réduction des reps (-3) est conforme à la logique force : les charges montent, les reps baissent.

Réserve : 1 semaine de décharge sur un programme de 8 semaines force est le strict minimum. En pratique, une semaine suffit pour une récupération passive, mais le praticien doit s'assurer que la semaine 7 (pic d'intensité) ne soit pas excessivement chargée, au risque de sous-performer la semaine 8 (décharge) et d'entrer dans la suivante encore fatigué.

**Verdict coach : ✅ Périodisation solide pour 8 semaines**

---

## P33 — buildPhases(9, 'endurance')

### Simulation

**Entrée :** `buildPhases(9, 'endurance')`

**Calcul des durées :**
- `adapt = 2`
- `deload = 9 >= 12 ? 2 : 1` → **deload = 1**
- `intensive = 9 <= 9 ? 2 : ...` → 9 ≤ 9 → **intensive = 2**
- `progress = max(1, 9 - 2 - 2 - 1) = max(1, 4)` → **progress = 4**
- Somme : 2 + 4 + 2 + 1 = **9 ✓**

**Construction des phases :**

| Phase | focus | weekStart | weekEnd | dur |
|-------|-------|-----------|---------|-----|
| Adaptation | adaptation | 1 | 2 | 2 |
| Progression | progression | 3 | 6 | 4 |
| Intensification | intensification | 7 | 8 | 2 |
| Décharge | deload | 9 | 9 | 1 |

**Modificateurs endurance :**
- adaptation : setsModifier=-1, repsOffset=-2
- intensification : setsModifier=+1, repsOffset=+3
- deload : setsModifier=-2, repsOffset=0

### Assertions : [PASS/FAIL]
- 4 phases, somme=9 : **PASS**
- `adaptation.weekEnd=2` : **PASS**
- `progression.weekEnd=6` : **PASS**
- `intensification.weekEnd=8` : **PASS**
- endurance adaptation : setsModifier=-1, repsOffset=-2 : **PASS**
- endurance intensification : setsModifier=+1, repsOffset=+3 : **PASS**

### Coach
La logique endurance est inversée par rapport à la force : l'intensification augmente séries ET répétitions (+1 série, +3 reps). C'est cohérent avec la définition de l'endurance musculaire — l'intensité se mesure par le volume de travail total, pas par la charge absolue.

Réserve notable : pour un objectif endurance, l'adaptation à -2 reps par rapport à la base (15 repsMin) donne 13 repsMin — toujours dans la zone endurance (>12), donc acceptable. Le pic d'intensification à +3 reps donne 18 repsMin — en haut de la plage, ce qui est physiologiquement cohérent pour l'endurance musculaire.

**Verdict coach : ✅ Logique d'intensification endurance correcte et pertinente**

---

## P34 — buildPhases(10, 'hypertrophy')

### Simulation

**Entrée :** `buildPhases(10, 'hypertrophy')`

**Calcul des durées :**
- `adapt = 2`
- `deload = 10 >= 12 ? 2 : 1` → **deload = 1**
- `intensive = 10 <= 9 ? 2 : (10 >= 16 ? 4 : 3)` → 10 > 9 et 10 < 16 → **intensive = 3**
- `progress = max(1, 10 - 2 - 3 - 1) = max(1, 4)` → **progress = 4**
- Somme : 2 + 4 + 3 + 1 = **10 ✓**

**Construction des phases :**

| Phase | focus | weekStart | weekEnd | dur |
|-------|-------|-----------|---------|-----|
| Adaptation | adaptation | 1 | 2 | 2 |
| Progression | progression | 3 | 6 | 4 |
| Intensification | intensification | 7 | 9 | 3 |
| Décharge | deload | 10 | 10 | 1 |

**Modificateurs hypertrophy :**
- adaptation : setsModifier=-1, repsOffset=+2
- intensification : setsModifier=+1, repsOffset=-2
- deload : setsModifier=-2, repsOffset=0

### Assertions : [PASS/FAIL]
- `intensive=3` (pas 2, car 10>9) : **PASS**
- `progression.weekEnd=6` : **PASS**
- `intensification.weekStart=7, weekEnd=9` : **PASS**
- `deload.weekStart=10, weekEnd=10` : **PASS**
- hypertrophy intensification : setsModifier=+1, repsOffset=-2 : **PASS**

### Coach
La saut de intensive=2 (≤9 sem) à intensive=3 (10–15 sem) est le bon moment : à 10 semaines, on peut allouer 3 semaines entières de surcharge volumique dense (volume max + charges lourdes), ce qui est le cœur du stimulus hypertrophique en phase avancée.

L'intensification hypertrophie (+1 série, -2 reps) est la combinaison classique de la "surcharge progressive" : plus de sets sur une plage de reps réduite (6 repsMin au lieu de 8) = charges plus lourdes + volume maintenu. Mécaniquement solide.

**Verdict coach : ✅ Excellent — seuil 10 sem. déclenche le bon bloc d'intensification**

---

## P35 — buildPhases(12, 'fat_loss')

### Simulation

**Entrée :** `buildPhases(12, 'fat_loss')`

**Calcul des durées :**
- `adapt = 2`
- `deload = 12 >= 12 ? 2 : 1` → 12 ≥ 12 → **deload = 2**
- `intensive = 12 <= 9 ? 2 : (12 >= 16 ? 4 : 3)` → 12 > 9 et 12 < 16 → **intensive = 3**
- `progress = max(1, 12 - 2 - 3 - 2) = max(1, 5)` → **progress = 5**
- Somme : 2 + 5 + 3 + 2 = **12 ✓**

**Construction des phases :**

| Phase | focus | weekStart | weekEnd | dur |
|-------|-------|-----------|---------|-----|
| Adaptation | adaptation | 1 | 2 | 2 |
| Progression | progression | 3 | 7 | 5 |
| Intensification | intensification | 8 | 10 | 3 |
| Décharge | deload | 11 | 12 | 2 |

**Modificateurs fat_loss :**
- adaptation : setsModifier=-1, repsOffset=0
- intensification : setsModifier=0, repsOffset=+3
- deload : setsModifier=-1, repsOffset=0

### Assertions : [PASS/FAIL]
- `deload=2` (premier seuil ≥12) : **PASS**
- `progression.weekStart=3, weekEnd=7` (5 semaines) : **PASS**
- `deload.weekStart=11, weekEnd=12` : **PASS**
- fat_loss adaptation : setsModifier=-1, repsOffset=0 : **PASS**
- fat_loss deload : setsModifier=-1, repsOffset=0 : **PASS**

### Coach
À 12 semaines, le passage à deload=2 est justifié physiologiquement : plus le programme est long, plus la fatigue accumulée est importante, et plus la décharge doit être longue pour permettre une super-compensation complète.

La logique fat_loss est singulière et pertinente : l'intensification augmente uniquement les reps (+3 sur une base de 12 → 15 repsMin) sans modifier le volume (setsModifier=0). Cette approche favorise la "densité métabolique" — plus de répétitions à charge constante = plus de dépense calorique sans risque de blessure. La décharge fat_loss conserve également les reps (repsOffset=0) et réduit seulement les séries (-1), ce qui est correct : on garde le rythme cardiaque, on réduit le volume.

**Verdict coach : ✅ Logique de densité fat_loss bien construite**

---

## P36 — buildPhases(16, 'strength')

### Simulation

**Entrée :** `buildPhases(16, 'strength')`

**Calcul des durées :**
- `adapt = 2`
- `deload = 16 >= 12 ? 2 : 1` → **deload = 2**
- `intensive = 16 <= 9 ? 2 : (16 >= 16 ? 4 : 3)` → 16 ≥ 16 → **intensive = 4**
- `progress = max(1, 16 - 2 - 4 - 2) = max(1, 8)` → **progress = 8**
- Somme : 2 + 8 + 4 + 2 = **16 ✓**

**Construction des phases :**

| Phase | focus | weekStart | weekEnd | dur |
|-------|-------|-----------|---------|-----|
| Adaptation | adaptation | 1 | 2 | 2 |
| Progression | progression | 3 | 10 | 8 |
| Intensification | intensification | 11 | 14 | 4 |
| Décharge | deload | 15 | 16 | 2 |

**Modificateurs strength (identiques à P32) :**
- adaptation : setsModifier=-1, repsOffset=+3
- intensification : setsModifier=0, repsOffset=-3
- deload : setsModifier=-2, repsOffset=+4

### Assertions : [PASS/FAIL]
- `intensive=4` (seuil ≥16) : **PASS**
- `progression` : 8 semaines, weekStart=3, weekEnd=10 : **PASS**
- `intensification.weekStart=11, weekEnd=14` : **PASS**
- `deload.weekStart=15, weekEnd=16` : **PASS**

### Coach
Un programme force de 16 semaines est un macrocycle complet — le format classique des préparations powerlifting. La répartition 2/8/4/2 est structurellement excellente :
- 8 semaines de progression : temps suffisant pour un cycle de force linéaire complet (montée graduelle des charges hebdomadaires)
- 4 semaines d'intensification : 4 semaines de travail au-delà de 90% du max, structure utilisée dans les programmes de type conjuguée
- 2 semaines de décharge : nécessaires après un pic de 4 semaines à haute intensité

Réserve technique : avec intensive=4 semaines à setsModifier=0 (même volume) mais repsOffset=-3 (barbell squat/deadlift à 3+(-3)=0 repsMin théorique), il faut s'assurer que `sessionOps.ts` protège bien contre repsMin=0 via `Math.max(1,...)`. L'audit P37 le confirme.

**Verdict coach : ✅ Macrocycle 16 semaines force : structure de référence**

---

## P37 — Specs finales ≥ 1 après modificateurs (tous goals × phases)

### Calcul exhaustif

Pour chaque combinaison (goal × type slot × phase), on calcule :
- **sets_final** = base sets + setsModifier
- **repsMin_final** = base repsMin + repsOffset

Les bases proviennent de COMPOUND_SPEC et ISOLATION_SPEC (lignes 58–70).

#### Compound — repsMin base : strength=3, hypertrophy=8, endurance=15, fat_loss=12
#### Isolation — repsMin base : strength=5, hypertrophy=10, endurance=15, fat_loss=12

| Goal | Type | Phase | Base sets | setsModifier | = sets | Base repsMin | repsOffset | = repsMin | Valide |
|------|------|-------|-----------|-------------|--------|-------------|-----------|-----------|--------|
| strength | compound | adaptation | 5 | -1 | **4** | 3 | +3 | **6** | ✅ |
| **strength** | **compound** | **intensification** | **5** | **0** | **5** | **3** | **-3** | **0** | **⚠️ 0 en théorie** |
| strength | compound | deload | 5 | -2 | **3** | 3 | +4 | **7** | ✅ |
| strength | isolation | adaptation | 3 | -1 | **2** | 5 | +3 | **8** | ✅ |
| strength | isolation | intensification | 3 | 0 | **3** | 5 | -3 | **2** | ✅ |
| strength | isolation | deload | 3 | -2 | **1** | 5 | +4 | **9** | ✅ |
| hypertrophy | compound | adaptation | 4 | -1 | **3** | 8 | +2 | **10** | ✅ |
| hypertrophy | compound | intensification | 4 | +1 | **5** | 8 | -2 | **6** | ✅ |
| hypertrophy | compound | deload | 4 | -2 | **2** | 8 | 0 | **8** | ✅ |
| hypertrophy | isolation | adaptation | 3 | -1 | **2** | 10 | +2 | **12** | ✅ |
| hypertrophy | isolation | intensification | 3 | +1 | **4** | 10 | -2 | **8** | ✅ |
| hypertrophy | isolation | deload | 3 | -2 | **1** | 10 | 0 | **10** | ✅ |
| endurance | compound | adaptation | 3 | -1 | **2** | 15 | -2 | **13** | ✅ |
| endurance | compound | intensification | 3 | +1 | **4** | 15 | +3 | **18** | ✅ |
| endurance | compound | deload | 3 | -2 | **1** | 15 | 0 | **15** | ✅ |
| endurance | isolation | adaptation | 3 | -1 | **2** | 15 | -2 | **13** | ✅ |
| endurance | isolation | intensification | 3 | +1 | **4** | 15 | +3 | **18** | ✅ |
| endurance | isolation | deload | 3 | -2 | **1** | 15 | 0 | **15** | ✅ |
| fat_loss | compound | adaptation | 3 | -1 | **2** | 12 | 0 | **12** | ✅ |
| fat_loss | compound | intensification | 3 | 0 | **3** | 12 | +3 | **15** | ✅ |
| fat_loss | compound | deload | 3 | -1 | **2** | 12 | 0 | **12** | ✅ |
| fat_loss | isolation | adaptation | 3 | -1 | **2** | 12 | 0 | **12** | ✅ |
| fat_loss | isolation | intensification | 3 | 0 | **3** | 12 | +3 | **15** | ✅ |
| fat_loss | isolation | deload | 3 | -1 | **2** | 12 | 0 | **12** | ✅ |

### Analyse du cas strength compound intensification

`repsMin = 3 + (−3) = 0` en théorie dans `programGenerator.ts`.

Cependant, conformément au récapitulatif du prompt (BUG5), `sessionOps.ts` ligne 140 applique déjà `Math.max(1, ...)` lors de la génération des targets de session. Le bug ne se manifeste donc **pas en production** : repsMin sera au minimum 1 à l'affichage et à la validation.

### Assertions : [PASS/FAIL]
- 23 combinaisons sur 24 ont sets_final ≥ 1 et repsMin_final ≥ 1 : **PASS**
- 1 cas limite : strength compound intensification → repsMin_final = 0 en théorie, protégé par sessionOps.ts : **⚠️ PASS atténué (BUG5 — protégé downstream)**
- Aucune combinaison ne produit sets_final ≤ 0 : **PASS**

### Coach
Le seul cas problématique est strength compound intensification (repsMin=0 théorique) — exactement le cas le plus critique : les compounds force en phase d'intensification. Heureusement, le garde en aval dans sessionOps.ts protège l'utilisateur. La recommandation de correction à la source reste valide : il faudrait soit relever repsMin strength de 3 à 4, soit ajuster repsOffset intensification de -3 à -2, pour avoir repsMin_final = 1 sans dépendre du garde aval.

**Verdict coach : ⚠️ Problème mineur — 0-rep compound strength en intensification, protégé mais à corriger à la source**

---

## P38 — phaseAtLeast : logique d'ordre (ligne 427 / 551–558)

### Code vérifié (lignes 551–558)

```typescript
const PHASE_ORDER: Record<PhaseKey, number> = {
  adaptation: 1, progression: 2, intensification: 3, deload: 4,
}

export function phaseAtLeast(current: PhaseKey, required: PhaseKey): boolean {
  return PHASE_ORDER[current] >= PHASE_ORDER[required]
}
```

### Simulation des 8 assertions

| Expression | Calcul | Résultat attendu | Résultat code |
|-----------|--------|-----------------|---------------|
| `phaseAtLeast('adaptation', 'adaptation')` | 1 ≥ 1 | **true** | **true** |
| `phaseAtLeast('adaptation', 'progression')` | 1 ≥ 2 | **false** | **false** |
| `phaseAtLeast('progression', 'progression')` | 2 ≥ 2 | **true** | **true** |
| `phaseAtLeast('intensification', 'progression')` | 3 ≥ 2 | **true** | **true** |
| `phaseAtLeast('progression', 'intensification')` | 2 ≥ 3 | **false** | **false** |
| `phaseAtLeast('deload', 'intensification')` | 4 ≥ 3 | **true** | **true** |
| `phaseAtLeast('intensification', 'deload')` | 3 ≥ 4 | **false** | **false** |
| `phaseAtLeast('deload', 'deload')` | 4 ≥ 4 | **true** | **true** |

### Assertions : [PASS/FAIL]
- `phaseAtLeast('adaptation', 'adaptation')` → true : **PASS**
- `phaseAtLeast('adaptation', 'progression')` → false : **PASS**
- `phaseAtLeast('progression', 'progression')` → true : **PASS**
- `phaseAtLeast('intensification', 'progression')` → true : **PASS**
- `phaseAtLeast('progression', 'intensification')` → false : **PASS**
- `phaseAtLeast('deload', 'intensification')` → true : **PASS**
- `phaseAtLeast('intensification', 'deload')` → false : **PASS**
- `phaseAtLeast('deload', 'deload')` → true : **PASS**

### Coach
L'ordre numérique (1→4) est intuitif et correctement mappé. Un cas notable : `phaseAtLeast('deload', 'intensification')` retourne `true` — ce qui signifie que le code peut interpréter "en décharge" comme "au moins en intensification". C'est logique pour conditionner des comportements progressifs (ex. "active les options avancées à partir de l'intensification") : la décharge vient après, donc elle satisfait aussi la condition.

**Verdict coach : ✅ Logique d'ordre totalement correcte**

---

## P39 — Cohérence wizard phaseLabel vs buildPhases

### Code vérifié (ProgramGeneratorScreen.tsx lignes 479–490)

```typescript
function phaseLabel(weeks: number): string {
  const phases = buildPhases(weeks)
  if (!phases) return ''
  return phases.map((ph) => {
    const dur = ph.weekEnd - ph.weekStart + 1
    const names: Record<string, string> = {
      adaptation: 'adaptation', progression: 'progression',
      intensification: 'intensification', deload: 'décharge',
    }
    return `${dur} sem. ${names[ph.focus] ?? ph.focus}`
  }).join(' · ')
}
```

`phaseLabel` délègue **entièrement** à `buildPhases` pour les données — pas de formule inline.

### Test 7 semaines
- `buildPhases(7)` → `undefined`
- `if (!phases) return ''` → `''`
- **Résultat : `''`** ✓

### Test 8 semaines
- `buildPhases(8)` avec goal par défaut='strength' : adapt=2, prog=3, intens=2, deload=1
- Phases : [{weekStart:1,weekEnd:2,focus:'adaptation'}, {weekStart:3,weekEnd:5,focus:'progression'}, {weekStart:6,weekEnd:7,focus:'intensification'}, {weekStart:8,weekEnd:8,focus:'deload'}]
- `dur` pour chaque : 2, 3, 2, 1
- Strings : "2 sem. adaptation", "3 sem. progression", "2 sem. intensification", "1 sem. décharge"
- **Résultat : `"2 sem. adaptation · 3 sem. progression · 2 sem. intensification · 1 sem. décharge"`**
- Somme : 2+3+2+1 = **8 ✓**

### Test 10 semaines
- adapt=2, prog=4, intens=3, deload=1 (totalWeeks=10)
- **Résultat : `"2 sem. adaptation · 4 sem. progression · 3 sem. intensification · 1 sem. décharge"`**
- Somme : 2+4+3+1 = **10 ✓**

### Test 12 semaines
- adapt=2, prog=5, intens=3, deload=2 (totalWeeks=12)
- **Résultat : `"2 sem. adaptation · 5 sem. progression · 3 sem. intensification · 2 sem. décharge"`**
- Somme : 2+5+3+2 = **12 ✓**

### Test 16 semaines
- adapt=2, prog=8, intens=4, deload=2 (totalWeeks=16)
- **Résultat : `"2 sem. adaptation · 8 sem. progression · 4 sem. intensification · 2 sem. décharge"`**
- Somme : 2+8+4+2 = **16 ✓**

### Assertions : [PASS/FAIL]
- Somme des durées = totalWeeks pour 7, 8, 10, 12, 16 semaines : **PASS**
- Noms 'décharge' (pas 'deload') : **PASS** (clé 'deload' mappée à 'décharge' dans le dictionnaire)
- Noms 'intensification' (pas 'intensive') : **PASS**
- `adapt` toujours = 2 semaines dans la string pour toutes valeurs ≥8 : **PASS**
- `phaseLabel` délègue à `buildPhases` (pas de formule inline) : **PASS**

### Coach
Le wizard affiche les durées correctement et utilise le bon vocabulaire français. L'utilisation de `buildPhases` comme unique source de vérité (pas de recalcul dans le wizard) est une excellente pratique : tout changement dans la formule de périodisation se répercute automatiquement dans l'UI sans risque de divergence.

Note pédagogique : le goal par défaut de `buildPhases` est 'strength' (ligne 560), ce qui n'affecte que les modificateurs, pas les durées affichées par `phaseLabel`. Puisque `phaseLabel` ne lit que `weekStart`/`weekEnd`/`focus` (pas les modificateurs), le goal ne change pas les strings affichées dans le wizard — comportement correct.

**Verdict coach : ✅ Cohérence wizard/logique parfaite, architecture source-de-vérité unique**

---

## P40 — fmtMod : strings GOAL_PHASES correspondent à PHASE_CONFIG_BY_GOAL

### Code vérifié (ProgramGeneratorScreen.tsx lignes 737–752)

```typescript
function fmtMod(sets: number, reps: number): string {
  const parts: string[] = []
  if (sets !== 0) parts.push(`${sets > 0 ? '+' : ''}${sets} série${Math.abs(sets) > 1 ? 's' : ''}`)
  if (reps !== 0) parts.push(`${reps > 0 ? '+' : ''}${reps} reps`)
  return parts.length ? parts.join(', ') : 'Specs inchangées'
}

const GOAL_PHASES = (Object.keys(PHASE_CONFIG_BY_GOAL) as ProgramGoal[]).reduce<Record<ProgramGoal, GoalPhaseRow>>((acc, g) => {
  const cfg = PHASE_CONFIG_BY_GOAL[g]
  acc[g] = {
    adaptation:      fmtMod(cfg.adaptation.setsModifier,      cfg.adaptation.repsOffset),
    intensification: fmtMod(cfg.intensification.setsModifier, cfg.intensification.repsOffset),
    deload:          fmtMod(cfg.deload.setsModifier,          cfg.deload.repsOffset),
  }
  return acc
}, {} as Record<ProgramGoal, GoalPhaseRow>)
```

### Règle de pluralisation sets

- `Math.abs(sets) > 1` → 's' (pluriel) sinon '' (singulier)
- Exemples : abs(-1)=1 → "série" ; abs(-2)=2 → "séries" ; abs(+1)=1 → "série"

### Calcul de toutes les strings

| Goal | Phase | setsModifier | repsOffset | Calcul | String résultante |
|------|-------|-------------|-----------|--------|------------------|
| strength | adaptation | -1 | +3 | sets=-1≠0 → "-1 série" + reps=+3≠0 → "+3 reps" | **"-1 série, +3 reps"** |
| strength | intensification | 0 | -3 | sets=0 → skip + reps=-3≠0 → "-3 reps" | **"-3 reps"** |
| strength | deload | -2 | +4 | sets=-2 → "-2 séries" + reps=+4 → "+4 reps" | **"-2 séries, +4 reps"** |
| hypertrophy | adaptation | -1 | +2 | sets=-1 → "-1 série" + reps=+2 → "+2 reps" | **"-1 série, +2 reps"** |
| hypertrophy | intensification | +1 | -2 | sets=+1 → "+1 série" + reps=-2 → "-2 reps" | **"+1 série, -2 reps"** |
| hypertrophy | deload | -2 | 0 | sets=-2 → "-2 séries" + reps=0 → skip | **"-2 séries"** |
| endurance | adaptation | -1 | -2 | sets=-1 → "-1 série" + reps=-2 → "-2 reps" | **"-1 série, -2 reps"** |
| endurance | intensification | +1 | +3 | sets=+1 → "+1 série" + reps=+3 → "+3 reps" | **"+1 série, +3 reps"** |
| endurance | deload | -2 | 0 | sets=-2 → "-2 séries" + reps=0 → skip | **"-2 séries"** |
| fat_loss | adaptation | -1 | 0 | sets=-1 → "-1 série" + reps=0 → skip | **"-1 série"** |
| fat_loss | intensification | 0 | +3 | sets=0 → skip + reps=+3 → "+3 reps" | **"+3 reps"** |
| fat_loss | deload | -1 | 0 | sets=-1 → "-1 série" + reps=0 → skip | **"-1 série"** |

### Vérification des strings attendues dans le prompt

| Goal | Phase | Attendu | Calculé | Match |
|------|-------|---------|---------|-------|
| strength | adaptation | "-1 série, +3 reps" | "-1 série, +3 reps" | ✅ |
| strength | intensification | "-3 reps" | "-3 reps" | ✅ |
| strength | deload | "-2 séries, +4 reps" | "-2 séries, +4 reps" | ✅ |
| hypertrophy | adaptation | "-1 série, +2 reps" | "-1 série, +2 reps" | ✅ |
| hypertrophy | intensification | "+1 série, -2 reps" | "+1 série, -2 reps" | ✅ |
| hypertrophy | deload | "-2 séries" | "-2 séries" | ✅ |
| endurance | adaptation | "-1 série, -2 reps" | "-1 série, -2 reps" | ✅ |
| endurance | intensification | "+1 série, +3 reps" | "+1 série, +3 reps" | ✅ |
| endurance | deload | "-2 séries" | "-2 séries" | ✅ |
| fat_loss | adaptation | "-1 série" | "-1 série" | ✅ |
| fat_loss | intensification | "+3 reps" | "+3 reps" | ✅ |
| fat_loss | deload | "-1 série" | "-1 série" | ✅ |

### Cas limite fmtMod(0, 0)
- `sets=0` → skip
- `reps=0` → skip
- `parts.length = 0` → retourne `'Specs inchangées'` ✓

### Assertion la phase progression
La clé `'progression'` n'apparaît **pas** dans `GoalPhaseRow` (type: `Record<'adaptation' | 'intensification' | 'deload', string>`). La phase Progression n'a pas de setsModifier/repsOffset dans `buildPhases` (aucun de ces champs dans l'objet pushé à la ligne 583–589). Donc GOAL_PHASES ne l'inclut pas. Cohérence parfaite.

### Assertions : [PASS/FAIL]
- Toutes les 12 strings correspondent aux numériques de PHASE_CONFIG_BY_GOAL : **PASS**
- La phase `progression` n'est pas dans GOAL_PHASES : **PASS**
- `fmtMod(0, 0)` → `"Specs inchangées"` : **PASS**

### Coach
La fonction `fmtMod` est correcte et défensive. Deux points de qualité à noter :

1. La pluralisation est gérée via `Math.abs(sets) > 1` : correct pour +2, -2 ("séries") mais aussi pour +1, -1 ("série"). Le signe négatif n'affecte pas la forme JavaScript de la template string : `-1 série` s'affiche bien avec le `-` intégré dans la valeur entière.

2. Le fait que `GOAL_PHASES` est dérivé **dynamiquement** de `PHASE_CONFIG_BY_GOAL` via `reduce` + `fmtMod` garantit que tout changement de config se répercute automatiquement dans l'affichage wizard — même architecture source-de-vérité unique que `phaseLabel`.

**Verdict coach : ✅ Implémentation propre, cohérente et défensive**

---

## Récapitulatif des assertions critiques Groupe E

| Code | Assertion | Profil | Résultat |
|------|-----------|--------|---------|
| BUILD1 | totalWeeks<8 → buildPhases()=undefined | P31 | ✅ PASS |
| BUILD2 | adapt=2 fixe pour tous totalWeeks≥8 | P32–P36 | ✅ PASS |
| BUILD3 | deload=1 si <12sem, =2 si ≥12sem | P32,P33,P35,P36 | ✅ PASS |
| BUILD4 | intensive=2 si ≤9sem, 3 si 10-15sem, 4 si ≥16sem | P32–P36 | ✅ PASS |
| BUILD5 | progress=max(1, total-adapt-intens-deload) | P32–P36 | ✅ PASS |
| BUG5 | strength compound intensification → repsMin=0 en théorie, protégé par sessionOps.ts | P37 | ⚠️ PASS atténué |
| PHASE1 | phaseAtLeast compare les ordres 1-4 correctement (8/8 cas) | P38 | ✅ PASS |
| WIZ1 | phaseLabel() délègue à buildPhases() (pas de formule inline) | P39 | ✅ PASS |
| WIZ2 | fmtMod génère les 12 strings à partir des numériques PHASE_CONFIG_BY_GOAL | P40 | ✅ PASS |

---

## Tableau de synthèse Groupe E

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|--------|----------------------|---------|-------------------|
| P31 | totalWeeks<8 → undefined | ✅ PASS | — |
| P32 | 8 sem strength : adapt=2, prog=3, intens=2, deload=1 | ✅ PASS | Décharge 1 sem : minimum strict après 7 sem de charge |
| P33 | 9 sem endurance : adapt=2, prog=4, intens=2, deload=1 | ✅ PASS | — |
| P34 | 10 sem hypertrophy : intensive=3 (seuil 10>9) | ✅ PASS | — |
| P35 | 12 sem fat_loss : deload=2 (seuil ≥12) | ✅ PASS | — |
| P36 | 16 sem strength : intensive=4 (seuil ≥16), prog=8 | ✅ PASS | repsMin compound intensification = 0 théorique (protégé sessionOps.ts) |
| P37 | 23/24 specs ≥1 ; 1 cas strength cmpd intens = 0 repsMin | ⚠️ PASS | strength compound intensification : repsMin=0 à corriger à la source (raiseDeltaToMin=1) |
| P38 | phaseAtLeast : 8/8 assertions correctes | ✅ PASS | — |
| P39 | phaseLabel : délégation buildPhases, noms français corrects | ✅ PASS | — |
| P40 | fmtMod : 12/12 strings correctes, pluralisation correcte | ✅ PASS | — |

---

## Synthèse des problèmes ouverts — Groupe E

### Bugs / anomalies logicielles

**BUG5 (P37, P36) — strength compound intensification → repsMin théorique = 0**

- Profil : P37 (et transitif P36, P32)
- Assertion : COMPOUND_SPEC strength repsMin=3 + repsOffset intensification (-3) = 0
- Impact concret : repsMin=0 est transmis à sessionOps.ts qui applique `Math.max(1, ...)` — l'utilisateur ne voit jamais 0 reps. Pas de bug en production.
- Correction recommandée (deux options) :
  1. Relever `COMPOUND_SPEC.strength.repsMin` de 3 à 4 (compound strength deload deviendrait 4+4=8, encore acceptable)
  2. Réduire `PHASE_CONFIG_BY_GOAL.strength.intensification.repsOffset` de -3 à -2 (repsMin_final = 1 ≥ 1 ✓)
  3. Ou appliquer `Math.max(1, repsMin + repsOffset)` directement dans `buildPhases` / `makeDraftWE` pour protéger à la source

### Réserves coach cumulées

**Thème 1 — Décharge trop courte sur les programmes courts**
- Profils : P32 (8 sem), P33 (9 sem)
- Observation : deload=1 semaine sur des programmes de 8–9 semaines incluant 2 semaines d'intensification. Après un bloc intensif, 1 semaine de décharge est le minimum physiologique — acceptable mais juste.
- Recommandation : envisager de signaler dans le wizard que les programmes < 10 semaines n'offrent qu'une décharge minimale.

**Thème 2 — repsMin compound strength en intensification**
- Profils : P36, P37
- Observation : le repsMin théorique de 0 indique que la plage strength (3–5 reps) est trop étroite pour absorber un repsOffset=-3. En pratique, l'intensification force à 0 reps n'a pas de sens pédagogique — l'utilisateur ferait du 1RM pur.
- Recommandation : ajuster soit la base strength compound (repsMin→4), soit l'offset intensification (repsOffset→-2), pour que la phase d'intensification produise au moins 1 rep de plage (ex. 1–3 reps en compound strength intensification).
---

## Bloc 1 — Tableau de synthèse global P01–P40

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|--------|----------------------|---------|-------------------|
| P01 | Split fullbody-quad/hip → public fullbody×2 ; 11 ex/workout ; noms A/B ; warmup en tête, core en queue | ✅ PASS | Timing estimé 70-90 min > 60 min cible ; absence de chest isolation sur 2j fullbody |
| P02 | Beginner reste fullbody en strength ; split fullbody×3 ; noms A/B/C | ✅ PASS | 5×3-5 pour débutant techniquement hasardeux ; timing ~120 min >> 60 min avec repos 180s |
| P03 | PPL déclenché (isMass+intermediate) ; dos+biceps en pull ; chest+OHP en push ; quads+ischios en legs | ✅ PASS | Timing ~94 min > 60 min (inhérent au protocole force) ; jambes 1×/semaine seulement |
| P04 | PPL identique à P03 (objectif n'affecte pas la branche) ; specs 4×8-12 zone hypertrophie | ✅ PASS | Volume par groupe (7-10 séries/semaine) limite basse pour hypertrophie max ; jambes 1×/semaine |
| P05 | PPF déclenché (endurance → !isMass, intermediate) ; pas de suffixe A/B ; BW only filtré | ✅ PASS | 3×15-20 pull-ups en composé irréaliste pour la majorité ; jambes 1×/semaine seulement |
| P06 | PPF déclenché (fat_loss → !isMass, intermediate) ; pas de suffixe A/B | ✅ PASS | Aucune composante cardio dédiée dans programme fat_loss ; pull-up 12-15 reps exigeant en BW |
| P07 | Split upper-push/lower-quad/upper-pull/lower-hip ; 10/8/10/8 ex/workout ; noms A/B corrects ; calves dans les 2 lower | ✅ PASS | Séances upper (10 ex, 32 séries) estimées à ~72 min > 60 min cible |
| P08 | Split PPL+UL 5 workouts distincts ; chaque type 1× sans suffixe | ✅ PASS | Jambes : seulement 2j repos entre Legs et Lower ; timing ~94-122 min/séance >> 60 min ; 5j consécutifs sans repos |
| P09 | beginner+isMass+5j = upper/lower A/B + fullbody (pas fullbody×5) ; 10/8/10/8/11 ex/workout | ✅ PASS | Volume 150 séries/semaine excessif pour débutant ; jambes 3×/5j consécutifs ; timing upper et fullbody > 60 min |
| P10 | 2j = fullbody toujours (sans condition de niveau) ; barbell prioritaire en composés strength | ✅ PASS | Timing ~140 min >> 60 min avec repos 180s ; 2j/semaine sous-optimal pour intermédiaire force ; cumul lombaire squat+deadlift à surveiller |
| P11 | workoutTypeFromFocus(['chest'])='push' ; split push×2 ; chest compound en tête (DB) | ✅ PASS | Aucun pull/lower ; timing ~90 min vs 60 ; risque doublon si pool DB chest < 2 exercices compound |
| P12 | workoutTypeFromFocus(['back'])='pull' ; split pull×3 ; back compound en tête (BB+DB+CABLE) | ✅ PASS | Aucun push/lower ; timing ~90 min vs 60 |
| P13 | workoutTypeFromFocus(['legs'])='lower' ; split lower×4 alternant quad/hip ; noms A/B/C/D (BW) | ✅ PASS | Slots isolation jambes (leg extension, leg curl) probablement vides en BW only ; aucun upper ; timing surestimé |
| P14 | BUG3 absent : core→null→fullbody×2, jamais lower (BW) | ✅ PASS | Timing ~108 min vs 60 ; back compound nécessite pull-up bar en BW |
| P15 | BUG3/4j absent : core→null→upper/lower A/B, jamais lower×4 (FULL) | ✅ PASS | Timing upper ~100 min vs 60 |
| P16 | shoulders→hasPush→'push' ; split push×2 ; OHP en tête (DB) | ✅ PASS | Rear deltoid absent (normal en push) ; aucun pull/lower ; timing ~90 min vs 60 |
| P17 | chest+back→'upper' ; split upper×3 ; chest et back en tête via reorderSlotsByFocus (FULL) | ✅ PASS | Volume élevé pour débutant (upper×3) ; timing ~105 min vs 60 ; variété d'exercices seulement entre A/B/C (pas variété structurelle) |
| P18 | legs+core→'lower' (core ne neutralise pas legs) ; split lower×3 alternant quad/hip (BW) | ✅ PASS | Mêmes slots vides BW que P13 ; timing surestimé |
| P19 | hasUpper+hasLower→null→fullbody×2 par défaut ; muscles ciblés remontent via reorderSlotsByFocus | ✅ PASS | Timing ~108 min vs 60 |
| P20 | shoulders+arms→push (hasPush prioritaire sur hasArms) ; OHP en tête ; biceps structurellement absent en push | ✅ PASS | Biceps absent malgré focusMuscles=['arms'] ; timing ~90 min vs 60 ; comportement contre-intuitif à documenter dans le wizard |
| P21 | autoProgress:true pour BW-only (devrait être false, progressStepKg=0) | ❌ FAIL | Pool BW trop petit pour 3 sessions distinctes ; slot shoulders_rear systématiquement vide ; répétitions massives dès session B |
| P22 | BUG4 PASS (seed-row-dumbbell qualifie le slot back compound DB) ; slot calves vide ×3 (comportement attendu) | ⚠️ PASS | Calves absent en DB (aucun exercice DB calves dans le seed) ; back_width couvert par shrug (isolation) en session B ; session C ≈ session A (pool épuisé) |
| P23 | Barbell prioritaire en strength (prio 0 < 2) ; squat barbell en tête du slot quads/glutes ; split upper/lower A/B | ✅ PASS | Slots glutes isolation et calves systématiquement vides (aucun BB/DB dans seed) ; hamstrings isolation → fallback compound |
| P24 | Aucun barbell/dumbbell dans la sortie ; lat pulldown = slot back_width ; chest press machine identifié | ⚠️ PASS | Session fullbody-hip débute par kickback câble (isolation, pop:1) faute de composé hip machine/câble ; biceps : 1 seul exercice disponible |
| P25 | Aucun BB/DB/machine/câble ; shoulders_rear vide (band-pull-apart=warmup, exclu de available) ; fat_loss 3×12-15 / 60s | ⚠️ PASS | Slot shoulders_rear vide sur les 2 sessions ; hip-thrust-bw (pop:4) retenu en slot quads/glutes cmp fullbody-quad (incohérent pour session quad-dominante) ; pool Band+BW trop étroit |
| P26 | Split PPL (advanced strength 3j) ; random top-3 correctement implémenté (ligne 485) ; top-3 chest = 3 barbell (prio force) | ✅ PASS | Slot triceps ×2 dans push (sur-représentation) ; decline bench (pop:1) en top-3 peu courant |
| P27 | adjustedSlotCount(9,20)=4 (max(2,floor(9×0.5))) ; 4 composés + warmup + core = 6 ex total | ⚠️ PASS | WARMUP_SPEC (2×10) et CORE_SPEC (3×15) non réduits pour 20 min (~40% du crédit temps) |
| P28 | adjustedSlotCount(9,45)=6 (max(3,floor(9×0.75))) ; 4 cmp + 2 isol + warmup + core = 8 ex | ✅ PASS | Biceps et triceps jamais isolés sur la semaine (2j) ; calves absent |
| P29 | adjustedSlotCount(9,90)=8 (min(9+2,8)=8, cap déclenché) ; specs inchangées vs 60 min | ⚠️ PASS | Cap à 8 élimine calves pour fullbody 90 min ; timing estimé ~76 min < cible 90 min |
| P30 | Split PPL à 20 min ; adjustedSlotCount(6,20)=3 pour push/pull/legs ; 2 cmp + 1 isol + warmup + core = 5 ex/session | ⚠️ PASS | restSec=180s (strength) incompatible avec 20 min — timing réel ~28 min ; adjustedSlotCount ne tient pas compte du temps de repos par objectif |
| P31 | totalWeeks=7 < 8 → buildPhases()=undefined ; phaseLabel(7)='' ; DraftProgram.phases=undefined | ✅ PASS | — |
| P32 | buildPhases(8,'strength') : adapt=2, prog=3, intens=2, deload=1 ; somme=8 ; modificateurs corrects | ✅ PASS | Décharge 1 sem : minimum strict après 7 sem de charge |
| P33 | buildPhases(9,'endurance') : adapt=2, prog=4, intens=2, deload=1 ; somme=9 ; modificateurs endurance corrects | ✅ PASS | — |
| P34 | buildPhases(10,'hypertrophy') : intensive=3 (seuil 10>9) ; prog=4 sem ; somme=10 | ✅ PASS | — |
| P35 | buildPhases(12,'fat_loss') : deload=2 (seuil ≥12) ; prog=5 sem ; somme=12 | ✅ PASS | — |
| P36 | buildPhases(16,'strength') : intensive=4 (seuil ≥16) ; prog=8 sem ; deload=2 ; somme=16 | ✅ PASS | repsMin compound strength intensification = 0 théorique (protégé par sessionOps.ts) |
| P37 | 23/24 specs ≥ 1 ; strength compound intensification → repsMin=0 théorique, protégé par sessionOps.ts Max(1,…) | ⚠️ PASS | strength compound intensification : repsMin=0 à corriger à la source |
| P38 | phaseAtLeast : 8/8 assertions correctes (PHASE_ORDER 1→4) | ✅ PASS | — |
| P39 | phaseLabel délègue entièrement buildPhases ; noms français corrects ; sommes exactes (7–16 sem) | ✅ PASS | — |
| P40 | fmtMod : 12/12 strings correctes ; pluralisation (-1 série / -2 séries) correcte ; fmtMod(0,0)='Specs inchangées' | ✅ PASS | — |
---

## Bloc 2 — Synthèse des problèmes ouverts

### Bugs / anomalies logicielles (assertions FAIL)

**P21 — autoProgress:true pour exercices BW-only (devrait être false)**
- Assertion : `autoProgress:false` pour les slots d'exercices en equipment=bodyweight
- Comportement réel : `autoProgress:true` (valeur par défaut) avec `progressStepKg:0`
- Impact : aucun effet utilisateur visible (progressStep=0 → pas de progression réelle), mais incohérence sémantique — la progression automatique est activée sans moyen de progresser en charge externe. Un coach attendrait `autoProgress:false` pour les exercices sans charge externe.
- Correction recommandée : dans `makeDraftWE` (ligne 501-502), forcer `autoProgress: progressStepKg > 0` (ou `autoProgress: equipment !== 'bodyweight' && equipment !== 'band'`).

**Tout autre FAIL :** Aucun autre FAIL d'assertion détecté dans les groupes A, B, D, E.

---

### Anomalies comportementales notées (PASS avec réserves majeures)

**[SLOTS-VIDES-CALVES]** — P22, P23, P25
Aucun exercice calves pour les équipements DB (dumbbell seul), BB+DB, Band+BW → slot calves systématiquement vide sur ces profils.
- `bw-calf-raise` est présent dans le seed (BW) mais n'est pas dans `available` pour BB+DB car `available` filtre strictement sur `allowed.has(ex.equipment)`.
- Correction : ajouter `dumbbell-calf-raise` et/ou `barbell-calf-raise` dans le seed.

**[SLOTS-VIDES-SHOULDERS]** — P21, P25
Aucun exercice `shoulders_rear` ou `shoulders_lateral` en BW non-warmup dans le seed. `seed-band-pull-apart` (shoulders_rear, band) est `isWarmupExercise:true` → exclu de `available`, présent uniquement dans `warmupPool`. Slot vide systématique pour BW et Band+BW.
- Correction : ajouter un exercice BW shoulders_rear non-warmup (ex. reverse snow angel, rear delt raise au sol) dans le seed.

**[BUG5 — protégé downstream]** — P36, P37
`COMPOUND_SPEC.strength.repsMin=3` + `repsOffset.intensification=-3` = `repsMin_final=0` en théorie.
- Impact concret : `sessionOps.ts` applique `Math.max(1, ...)` → l'utilisateur ne voit jamais 0 reps. Pas de bug en production.
- Correction recommandée à la source (deux options) :
  1. Relever `COMPOUND_SPEC.strength.repsMin` de 3 à 4.
  2. Réduire `PHASE_CONFIG_BY_GOAL.strength.intensification.repsOffset` de -3 à -2.
  3. Ou appliquer `Math.max(1, repsMin + repsOffset)` directement dans `buildPhases` / `makeDraftWE`.

---

### Réserves coach cumulées (regroupées par thème)

**Thème 1 — Timing strength (restSec non réduit pour séances courtes)**
Profils concernés : P02, P03, P08, P10, P30 (particulièrement sévère).
Le générateur réduit le nombre de slots et le nombre de séries via `adjustedSlotCount` et `adjustedSpec`, mais ne réduit pas `restSec`. En mode strength (restSec=180s), chaque série composée coûte ~3.5-4.5 min (travail + repos). Résultat : les séances strength dépassent systématiquement leur cible de durée. P30 (20 min strength) génère un timing réel de ~28 min malgré la réduction des slots. Recommandation : réduire `restSec` proportionnellement selon la durée cible, ou appliquer un plafond de slots plus agressif pour les goals à repos long.

**Thème 2 — Slots vides dans le seed (calves, shoulders_rear, glutes isolation)**
Profils concernés : P22 (calves DB), P23 (calves BB/DB, glutes isolation), P24 (composé hip machine/câble), P25 (shoulders_rear Band+BW).
Plusieurs combinaisons équipement × slot génèrent des exercices manquants dans le seed. Les slots vides sont élidés silencieusement — l'utilisateur reçoit un programme incomplet sans avertissement. Recommandation : ajouter des exercices manquants (calf raises DB/BB, exercice BW shoulders_rear non-warmup, glute isolation BB/DB) et/ou afficher un avertissement "équipement insuffisant pour ce slot".

**Thème 3 — Volume débutant excessif (5j/semaine)**
Profils concernés : P09.
beginner+isMass+5j génère upper/lower A/B + fullbody = ~150 séries/semaine, volume d'un programme intermédiaire confirmé. Sur 5j consécutifs sans repos obligatoire, les jambes apparaissent 3 fois (lower A, lower B, fullbody). Recommandation : ajouter un avertissement ou un plafond de volume automatique pour level='beginner' au-delà de 3j/semaine.

**Thème 4 — Variété structurelle absente sur focusType='upper' × N sessions**
Profils concernés : P17 (upper×3).
Quand focusType='upper', le générateur utilise `SLOTS['upper']` (8 slots fixes) pour toutes les sessions — pas d'alternance upper-push/upper-pull. Pour N=2 sessions upper (P11 push×2, P16 push×2), la répétition structurelle est modérée. Pour N=3 (P17 upper×3), les trois sessions A/B/C partagent la même structure, seuls les exercices variant. Recommandation : pour focusType='upper' avec N≥2 sessions, alterner upper-push/upper-pull comme pour le split par défaut 4j.

**Thème 5 — hip-thrust-bw dans slot quads/glutes compound fullbody-quad**
Profils concernés : P21, P25.
`seed-hip-thrust-bw` (primaryMuscle: glutes, pop:4) est sélectionné avant `bw-squat` (primaryMuscle: quads, pop:3) dans le slot `{muscles: ['quads','glutes'], compound:true}` de fullbody-quad. Résultat : la session fullbody-**quad** (censée être quad-dominante) démarre par un hip thrust, exercice hip-dominant. La popularité prime sur la cohérence structurelle. Recommandation : introduire un critère de tri secondaire par `primaryMuscle` pour que le premier slot d'un type de séance soit rempli par l'exercice dont le muscle primaire correspond au "focus" du type (quads pour fullbody-quad, glutes/hamstrings pour fullbody-hip).

**Thème 6 — WARMUP_SPEC et CORE_SPEC non ajustés pour séances courtes**
Profils concernés : P27 (20 min), P30 (20 min strength).
Pour une séance de 20 min, le warmup (2×10 ≈ 3 min) et le core (3×15 ≈ 5 min) sont fixes et non réduits par `adjustedSpec`. Ils représentent ~40% du crédit temps total. `adjustedSlotCount` réduit le nombre de slots principaux, mais l'utilisateur paie encore le coût fixe du warmup+core. Recommandation : conditionner WARMUP_SPEC et CORE_SPEC à la durée (ex. supprimer le core pour les séances ≤ 20 min, réduire le warmup à 1 série).
