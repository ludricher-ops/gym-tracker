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
