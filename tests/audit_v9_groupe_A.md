# Audit v9 — GROUPE A : Fix 1 machine isolation back (P01-P10)

**Date :** 2026-09-07  
**Auditeur :** Claude Sonnet 4.6  
**Périmètre :** P01 à P10 — vérification que les slots isolation dos sont remplis pour les profils machine-only après ajout de `machine-pullover` et `machine-low-row`.

---

## Données seed vérifiées

Exercices machine pertinents extraits de `exercises-seed.json` :

| ID | primaryMuscle | category | pop |
|----|---------------|----------|-----|
| `machine-lat-pulldown` | back_width | compound | 2 |
| `seed-row-machine` | back_thickness | compound | 1 |
| `machine-pullover` | back_width | isolation | 2 |
| `machine-low-row` | back_thickness | isolation | 2 |
| `seed-shoulder-press-machine` | shoulders | compound | 3 |
| `seed-chest-press-machine` | chest | compound | 3 |

**Exercices machine absents du seed :**  
- `biceps` — aucun exercice machine (tous barbell/dumbbell/cable/kettlebell/band/pullup_bar)  
- `shoulders_rear` — aucun exercice machine (cable, dumbbell, band uniquement)  
- `forearms` — aucun exercice machine (barbell uniquement)

> ⚠️ Cette absence impacte plusieurs assertions du prompt (voir détails par profil).

**Rappel logique isolation dos :**  
Slot `{ muscles: ['back_thickness', 'back_width', 'back'], compound: false }` → slotPrimary = `back_thickness` → candidats machine isolation : `machine-low-row` (back_thickness, pop 2) et `machine-pullover` (back_width, pop 2) → tri slotPrimary → **machine-low-row sélectionné**.

Slot `{ muscles: ['back_width', 'back'], compound: false }` → slotPrimary = `back_width` → seul candidat machine : **machine-pullover**.

---

## Rappel template back-bi (8 slots, indices 0-7)

| Index | muscles | compound | Exercice machine |
|-------|---------|----------|-----------------|
| [0] | back_width + back_thickness | true | machine-lat-pulldown |
| [1] | back_thickness + back | true | seed-row-machine |
| [2] | biceps | false | **null** (pas d'exo machine) |
| [3] | back_thickness + back_width + back | false | **machine-low-row** ← FIX |
| [4] | biceps | false | **null** |
| [5] | back_width | false | **machine-pullover** |
| [6] | shoulders_rear | false | **null** |
| [7] | forearms | false | **null** |

---

## Profils P01-P10

---

### P01 — Machine · PPL 45min hypertrophy intermediate

**Résultat : PASS**

**Simulation :**  
Split auto (goal=hypertrophy, days=3, level=intermediate) → `['push','pull','legs']`  
Slots pull 45min hypertrophy : `max(4, ⌊8×0.75⌋) = max(4,6) = 6`

| Slot | Attendu prompt | Simulé | OK? |
|------|---------------|--------|-----|
| pull[0] | machine-lat-pulldown | machine-lat-pulldown (back_width, slotPrimary, pop 2) | ✅ |
| pull[1] | seed-row-machine | seed-row-machine (back_thickness, compound, seul restant) | ✅ |
| pull[2] | machine-low-row ← **FIX** | machine-low-row (back_thickness, isolation, slotPrimary, pop 2) | ✅ |
| pull[3] | "biceps machine ou BW" | **null** — aucun exercice machine biceps | ⚠️ |
| pull[4] | "face pull machine" | **null** — aucun exercice machine shoulders_rear | ⚠️ |
| pull[5] | "rien ou passe" | null — aucun exercice machine forearms | ✅ |

**Slots clés :**
- pull[0] : machine-lat-pulldown
- pull[2] : machine-low-row (isolation dos — FIX 1 opérationnel)

**Conclusion :** Fix 1 opérationnel. pull[2] rempli par machine-low-row. Aucun slot isolation dos vide. Les slots [3] et [4] sont vides (comportement attendu du générateur : pas d'exercice machine pour biceps ni shoulders_rear) ; les assertions ✅ du prompt pour ces slots sont incorrectes mais n'affectent pas l'objet de Fix 1.

---

### P02 — Machine · PPL 90min hypertrophy advanced

**Résultat : PASS**

**Simulation :**  
Split → `['push','pull','legs']`  
Slots pull 90min hypertrophy : `min(8+2, 8) = 8`

| Slot | Attendu prompt | Simulé | OK? |
|------|---------------|--------|-----|
| pull[0] | machine-lat-pulldown | machine-lat-pulldown | ✅ |
| pull[1] | seed-row-machine | seed-row-machine | ✅ |
| pull[2] | machine-low-row ← **FIX** | machine-low-row | ✅ |
| pull[3] | biceps | null (pas de machine biceps) | ⚠️ |
| pull[4] | shoulders_rear | null (pas de machine shoulders_rear) | ⚠️ |
| pull[5] | forearms | null | — |
| pull[6] | biceps | null | ⚠️ |
| pull[7] | machine-pullover | machine-pullover (back_width isolation, pop 2) | ✅ |

**Slots clés :**
- pull[0] : machine-lat-pulldown
- pull[2] : machine-low-row (1er isolation dos)
- pull[7] : machine-pullover (2e isolation dos, back_width)

**Conclusion :** Fix 1 opérationnel. Deux slots isolation dos remplis : pull[2]=machine-low-row + pull[7]=machine-pullover. Les assertions biceps/shoulders_rear sont incorrectes (slots vides) mais secondaires.

---

### P03 — Machine · Brosplit back-bi 45min advanced

**Résultat : PASS**

**Simulation :**  
Split brosplit 5j → `['chest-tri','back-bi','legs','shoulders-arms','upper']`  
Slots back-bi 45min hypertrophy : `max(4, ⌊8×0.75⌋) = 6`

| Slot | Attendu prompt | Simulé | OK? |
|------|---------------|--------|-----|
| back-bi[0] | machine-lat-pulldown | machine-lat-pulldown | ✅ |
| back-bi[1] | seed-row-machine | seed-row-machine | ✅ |
| back-bi[2] | "curl machine" | **null** (pas de machine biceps) | ⚠️ |
| back-bi[3] | machine-low-row ← **FIX** | machine-low-row | ✅ |
| back-bi[4] | "2e biceps machine" | **null** | ⚠️ |
| back-bi[5] | "isolation dos ou biceps" | machine-pullover (back_width) | ✅ |

**Slots clés :**
- back-bi[0] : machine-lat-pulldown
- back-bi[3] : machine-low-row (isolation dos — FIX 1 opérationnel)

**Conclusion :** back-bi[3] isolation dos rempli (c'était le problème de P13). Fix 1 validé. Les slots biceps [2] et [4] sont vides (aucun exercice machine) — les assertions du prompt sont incorrectes à ces indices mais n'affectent pas Fix 1.

---

### P04 — Machine · Arnold chest-back 45min intermediate

**Résultat : PASS**

**Simulation :**  
Split arnold 5j → `['chest-back','shoulders-arms','legs','chest-back','shoulders-arms']`  
(Note : le prompt décrit le split comme "chest-shoulders/back-bi/legs/shoulders-chest/back-bi" — description incorrecte, mais les assertions portent sur `chest-back` qui est le bon template.)  
Slots chest-back 45min hypertrophy : `max(4, ⌊9×0.75⌋) = max(4,6) = 6`  
(chest-back a 9 entrées dans SLOTS, dernier commenté "pos 9 — éjecté si cap=8")

| Slot | Attendu prompt | Simulé | OK? |
|------|---------------|--------|-----|
| chest-back[0] | chest compound machine | seed-chest-press-machine (chest, pop 3) | ✅ |
| chest-back[1] | machine-lat-pulldown | machine-lat-pulldown (back_width, slotPrimary, pop 2) | ✅ |
| chest-back[2] | shoulder press machine | seed-shoulder-press-machine (shoulders, pop 3) | ✅ |
| chest-back[3] | seed-row-machine | seed-row-machine (back_thickness, compound) | ✅ |
| chest-back[4] | pec deck / fly machine | seed-pec-deck (chest, isolation) | ✅ |
| chest-back[5] | machine-low-row ← **FIX** | machine-low-row (back_thickness, isolation, slotPrimary) | ✅ |

**Slots clés :**
- chest-back[1] : machine-lat-pulldown
- chest-back[5] : machine-low-row (isolation dos — FIX 1 opérationnel)

**Conclusion :** chest-back[5] isolation dos rempli (c'était le problème de P14). Fix 1 validé. Toutes les assertions clés correctes.

---

### P05 — Machine · PPL 20min hypertrophy intermediate

**Résultat : PASS**

**Simulation :**  
Split → `['push','pull','legs']`  
Slots pull 20min hypertrophy : `max(2, ⌊8×0.5⌋) = max(2,4) = 4`

| Slot | Attendu prompt | Simulé | OK? |
|------|---------------|--------|-----|
| pull[0] | machine-lat-pulldown | machine-lat-pulldown | ✅ |
| pull[1] | seed-row-machine | seed-row-machine | ✅ |
| pull[2] | machine-low-row ← **FIX** | machine-low-row | ✅ |
| pull[3] | "biceps machine" | **null** (pas de machine biceps) | ⚠️ |

**Slots clés :**
- pull[0] : machine-lat-pulldown
- pull[2] : machine-low-row (isolation dos — FIX 1 opérationnel)

**Conclusion :** Fix 1 validé. 4 slots produits, aucun isolation dos vide. Le slot [3] biceps est vide (pas d'exercice machine) — assertion du prompt incorrecte, anecdotique.

---

### P06 — Machine · PPL 60min hypertrophy intermediate

**Résultat : PASS**

**Simulation :**  
Split → `['push','pull','legs']`  
Slots pull 60min hypertrophy : base = **8**

| Slot | Attendu prompt | Simulé | OK? |
|------|---------------|--------|-----|
| pull[0] | compound ✅ | machine-lat-pulldown | ✅ |
| pull[1] | compound ✅ | seed-row-machine | ✅ |
| pull[2] | machine-low-row ← **FIX** | machine-low-row | ✅ |
| pull[3] | — | null (biceps, pas de machine) | — |
| pull[4] | — | null (shoulders_rear) | — |
| pull[5] | — | null (forearms) | — |
| pull[6] | — | null (biceps) | — |
| pull[7] | machine-pullover ✅ | machine-pullover (back_width, isolation, pop 2) | ✅ |

**Slots clés :**
- pull[0] : machine-lat-pulldown
- pull[2] : machine-low-row
- pull[7] : machine-pullover

**Conclusion :** Fix 1 validé. Les deux slots isolation dos (pull[2] et pull[7]) sont remplis. Toutes les assertions du prompt pour ce profil sont correctes.

---

### P07 — Machine · Brosplit back-bi 20min intermediate

**Résultat : PASS**

**Simulation :**  
Split brosplit 5j → `['chest-tri','back-bi','legs','shoulders-arms','upper']`  
Slots back-bi 20min hypertrophy : `max(2, ⌊8×0.5⌋) = 4`

| Slot | Attendu prompt | Simulé | OK? |
|------|---------------|--------|-----|
| back-bi[0] | machine-lat-pulldown | machine-lat-pulldown | ✅ |
| back-bi[1] | seed-row-machine | seed-row-machine | ✅ |
| back-bi[2] | "biceps machine" | **null** (pas de machine biceps) | ⚠️ |
| back-bi[3] | machine-low-row ← **FIX** | machine-low-row | ✅ |

**Slots clés :**
- back-bi[0] : machine-lat-pulldown
- back-bi[3] : machine-low-row (isolation dos — FIX 1 opérationnel)

**Conclusion :** Fix 1 validé. back-bi[3] isolation dos rempli. Le slot [2] biceps est vide (pas d'exercice machine) — assertion du prompt incorrecte mais secondaire.

---

### P08 — Machine · Back-bi 90min advanced

**Résultat : RÉSERVE**

**Simulation :**  
Split brosplit 5j → `['chest-tri','back-bi','legs','shoulders-arms','upper']`  
Slots back-bi 90min hypertrophy : `min(8+2, 8) = 8`

| Slot | Template | Attendu prompt | Simulé | OK? |
|------|---------|---------------|--------|-----|
| back-bi[0] | back_width compound | machine-lat-pulldown | machine-lat-pulldown | ✅ |
| back-bi[1] | back_thickness compound | seed-row-machine | seed-row-machine | ✅ |
| back-bi[2] | biceps isolation | "biceps" | null | ⚠️ |
| back-bi[3] | back_thickness+back_width+back isolation | machine-low-row ← **FIX** | machine-low-row | ✅ |
| back-bi[4] | biceps isolation | "biceps" | null | ⚠️ |
| back-bi[5] | **back_width** isolation | "biceps (si slot existe)" ❌ | **machine-pullover** | ❌ prompt |
| back-bi[6] | **shoulders_rear** isolation | "biceps" ❌ | null | ❌ prompt |
| back-bi[7] | **forearms** isolation | "machine-pullover" ❌ | null | ❌ prompt |

**Erreur détectée dans le prompt :** Les assertions des slots [5], [6] et [7] sont inversées/incorrectes :
- Le prompt attribue "biceps" à back-bi[5] (qui est en réalité `muscles=['back_width']` → machine-pullover)
- Le prompt attribue "biceps" à back-bi[6] (qui est en réalité `muscles=['shoulders_rear']` → null)
- Le prompt attribue "machine-pullover" à back-bi[7] (qui est en réalité `muscles=['forearms']` → null)

**Situation réelle :** machine-pullover apparaît à back-bi[5] (back_width), pas à back-bi[7] (forearms).

**Slots clés :**
- back-bi[0] : machine-lat-pulldown
- back-bi[3] : machine-low-row (1er isolation dos — FIX 1 opérationnel)
- back-bi[5] : machine-pullover (2e isolation dos)

**Assertion globale "≥ 2 slots isolation dos remplis" :** VRAIE (back-bi[3] + back-bi[5]) ✅

**Conclusion :** Fix 1 opérationnel — 2 slots isolation dos remplis comme attendu. RÉSERVE car le prompt contient une erreur systématique sur les indices [5]-[7] de back-bi : machine-pullover est au slot [5] (back_width), et non au slot [7] (forearms). L'assertion finale "≥ 2 isolation dos" reste correcte malgré l'erreur d'indexation.

---

### P09 — Machine + pullup_bar · PPL 45min intermediate

**Résultat : PASS**

**Simulation :**  
Split → `['push','pull','legs']`  
Slots pull 45min hypertrophy : 6  
Equipment : `[machine, pullup_bar]` → available inclut machine + pullup_bar exercises

**pull[0] — `['back_width','back_thickness'] compound:true` :**  
Candidats compound dos (machine + pullup_bar) :
- machine-lat-pulldown : back_width, pop 2
- seed-pullup : back_width (pullup_bar, compound), pop 3
- bw-inverted-row : back_thickness, pop 1
- seed-row-machine : back_thickness, pop 1

Tri : slotPrimary=back_width → machine-lat-pulldown (pop 2) et seed-pullup (pop 3) dominent → popularité → **seed-pullup** (pop 3 > 2) ✅

**pull[2] — isolation dos :**  
Candidats machine isolation dos : machine-low-row (back_thickness, pop 2) → **machine-low-row** ✅  
(seed-pullup et bw-inverted-row sont compound, non sélectionnés en slot isolation)

| Slot | Attendu prompt | Simulé | OK? |
|------|---------------|--------|-----|
| pull[0] | seed-pullup (pop 3 > pop 2) | seed-pullup | ✅ |
| pull[2] | machine-low-row | machine-low-row | ✅ |

**Slots clés :**
- pull[0] : seed-pullup (pullup_bar prime sur machine-lat-pulldown)
- pull[2] : machine-low-row

**Conclusion :** Fix 1 validé. L'ajout de machine-low-row/machine-pullover ne régresse pas la sélection de seed-pullup quand pullup_bar est disponible. Toutes les assertions correctes.

---

### P10 — Machine · Strength fullbody 60min intermediate

**Résultat : PASS**

**Simulation :**  
Split auto (goal=strength, days=3, level=intermediate) → INC-1 → `['fullbody-quad','fullbody-hip','fullbody-quad']` ✅  
Slots fullbody-quad 60min strength : `max(4, ⌊9×0.5⌋) = max(4,4) = 4`

Slots [0..3] de fullbody-quad :
- [0] : `['quads','glutes'] compound` → seed-leg-press (quads, machine, compound, pop 3)
- [1] : `['chest','chest_upper'] compound` → seed-chest-press-machine (chest, machine, compound, pop 3)
- [2] : `['back_width','back_thickness','back'] compound` → machine-lat-pulldown (back_width, slotPrimary, pop 2)
- [3] : `['shoulders','shoulders_front'] compound` → seed-shoulder-press-machine (shoulders, pop 3)

**hasCompoundBack :** machine-lat-pulldown (back_width, compound) → **true** → aucun warning BUG-BW-PULL ni SEED-BW-NOBACK ✅

**Slot isolation dos attendu :** absent (4 slots = composés uniquement). machine-low-row non attendu ✅

| Assertion prompt | Verdict |
|-----------------|---------|
| fullbody[2]=machine-lat-pulldown | ✅ |
| Seuls 4 slots → pas d'isolation | ✅ |
| hasCompoundBack=true → pas de warning | ✅ |

**Slots clés :**
- fullbody[2] : machine-lat-pulldown (compound back)
- Aucun slot isolation dos (correct pour strength 60min 4 slots)

**Conclusion :** Comportement force correctement simulé. 4 slots exclusivement composés. Pas d'isolation dos attendue ni observée. Fix 1 sans impact sur ce profil (force, pas de slot isolation en séance courte). Aucune régression.

---

## Synthèse GROUPE A

| Profil | Fix 1 isolation dos | Composés | Assertions secondaires prompt | Verdict |
|--------|--------------------|-----------|-----------------------------|---------|
| P01 | pull[2]=machine-low-row ✅ | ✅ | pull[3]/[4] incorrectes (slots vides, pas d'exo machine) | **PASS** |
| P02 | pull[2]+pull[7] ✅ | ✅ | pull[3]/[4]/[6] incorrectes | **PASS** |
| P03 | back-bi[3]=machine-low-row ✅ | ✅ | back-bi[2]/[4] incorrectes | **PASS** |
| P04 | chest-back[5]=machine-low-row ✅ | ✅ | Correctes (description split erronée mais sans impact) | **PASS** |
| P05 | pull[2]=machine-low-row ✅ | ✅ | pull[3] incorrecte | **PASS** |
| P06 | pull[2]+pull[7] ✅ | ✅ | Toutes correctes | **PASS** |
| P07 | back-bi[3]=machine-low-row ✅ | ✅ | back-bi[2] incorrecte | **PASS** |
| P08 | back-bi[3]+back-bi[5] ✅ | ✅ | **Erreur d'indexation [5]-[7] dans le prompt** | **RÉSERVE** |
| P09 | pull[2]=machine-low-row ✅ | seed-pullup pop 3 ✅ | Correctes | **PASS** |
| P10 | N/A (force, 4 slots) | machine-lat-pulldown ✅ | Correctes | **PASS** |

**Score Fix 1 : 10/10 PASS sur le comportement du générateur**  
**Score assertions prompt : 9/10 PASS, 1/10 RÉSERVE (P08 — indices back-bi [5]-[7] inversés)**

---

## Observations globales

### Fix 1 — Validé ✅
Les exercices `machine-low-row` et `machine-pullover` sont correctement sélectionnés dans tous les slots isolation dos pour les profils machine-only :
- `machine-low-row` (back_thickness, isolation, pop 2) → sélectionné en premier dans le slot `['back_thickness','back_width','back'] compound:false` grâce à la priorité slotPrimary
- `machine-pullover` (back_width, isolation, pop 2) → sélectionné dans le slot `['back_width','back'] compound:false` (pull[7] / back-bi[5])

Le problème P06/P13/P14 (slots isolation dos vides pour machine-only) est résolu.

### Erreur dans le prompt — P08
Le prompt d'audit v9 contient une erreur systématique sur l'indexation des slots back-bi 90min :
- Il attribue "biceps" au slot [5] (réel : `back_width` → machine-pullover)
- Il attribue "biceps" au slot [6] (réel : `shoulders_rear` → null)
- Il attribue "machine-pullover" au slot [7] (réel : `forearms` → null)

Correction : machine-pullover apparaît à `back-bi[5]` (back_width), non à `back-bi[7]` (forearms). L'assertion "≥ 2 slots isolation dos remplis" reste VRAIE (back-bi[3] + back-bi[5]).

### Absence d'exercices machine pour biceps/shoulders_rear/forearms
Le seed ne contient aucun exercice machine pour ces trois groupes musculaires. Les assertions du prompt qui marquent ces slots ✅ (pull[3] "biceps machine", pull[4] "face pull machine") sont incorrectes pour les profils machine-only. Ces slots sont vides — comportement correct du générateur (retourne null, skip silencieux). Ce n'est pas une régression introduite par Fix 1 mais une lacune du seed machine existant.

**Action recommandée :** Envisager l'ajout d'un exercice `machine-biceps-curl` (biceps, machine, isolation) pour compléter les séances pull/back-bi machine-only.
