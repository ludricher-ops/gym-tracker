# Audit P31–P40 — Groupe E : Périodisation buildPhases (v5)
**Date :** 2026-09-06
**Fichiers lus :** programGenerator.ts + ProgramGeneratorScreen.tsx + audit_prompt_v3.md
**Changements depuis v4 :** BUG-3 repsOffset strength intensification -3→-2 · BUG-1 UX-4 note 90min=5 exercices

---

## Rappel — valeurs actuelles dans le code

### COMPOUND_SPEC (ligne 58–63 de programGenerator.ts)
| Goal | sets | repsMin | repsMax | restSec |
|------|------|---------|---------|---------|
| strength | 5 | 3 | 5 | 180 |
| hypertrophy | 4 | 8 | 12 | 90 |
| endurance | 3 | 15 | 20 | 60 |
| fat_loss | 3 | 12 | 15 | 60 |

### ISOLATION_SPEC (ligne 65–70 de programGenerator.ts)
| Goal | sets | repsMin | repsMax | restSec |
|------|------|---------|---------|---------|
| strength | 3 | 5 | 8 | 120 |
| hypertrophy | 3 | 10 | 15 | 75 |
| endurance | 3 | 15 | 20 | 45 |
| fat_loss | 3 | 12 | 15 | 60 |

### PHASE_CONFIG_BY_GOAL (ligne 619–641 de programGenerator.ts)
| Goal | Phase | setsModifier | repsOffset |
|------|-------|-------------|-----------|
| strength | adaptation | -1 | +3 |
| strength | intensification | 0 | **-2** ← BUG-3 corrigé (était -3) |
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

Le commentaire en ligne 623 du code confirme explicitement le fix :
> `// repsOffset: -2 et non -3 pour garantir repsMin ≥ 1 (COMPOUND_SPEC.strength.repsMin = 3 → 3-2=1)`

### PHASE_ORDER (ligne 646–648)
```
adaptation: 1, progression: 2, intensification: 3, deload: 4
```

### buildPhases (ligne 655–709)
```typescript
if (totalWeeks < 8) return undefined
adapt     = 2                                           // fixe
deload    = totalWeeks >= 12 ? 2 : 1
intensive = totalWeeks <= 9 ? 2 : (totalWeeks >= 16 ? 4 : 3)
progress  = Math.max(1, totalWeeks - adapt - intensive - deload)
```

### adjustedSlotCount — barème strength 90min (UX-4, commit e9da515)
```typescript
// 90 min, strength
return Math.min(base, 5)   // cap à 5 slots (était 6 avant BUG-1 fix)
// → 5 slots + warmup + core = 7 exercices (pas 8 comme indiqué avant le fix)
```

---

## P31 — buildPhases(7) → pas de périodisation

**Simulation :**
- totalWeeks = 7 < 8 → `return undefined` (ligne 656)
- `phaseLabel(7)` → appelle `buildPhases(7)` → undefined → `return ''` (ligne 605 ProgramGeneratorScreen)
- `generateProgramDraft({ totalWeeks: 7, ... })` → ligne 957 : `phases: buildPhases(7, goal)` = undefined

**Assertions :**
- BUILD1 — totalWeeks < 8 → buildPhases() = undefined : **PASS** (ligne 656)
- WIZ1 — `phaseLabel(7)` = '' : **PASS** (ligne 604–605, branche `if (!phases) return ''`)
- DraftProgram phases = undefined avec totalWeeks:7 : **PASS** (ligne 957, `buildPhases(7, goal)` = undefined propagé tel quel)

**Coach :** 7 semaines = trop court pour une périodisation en 4 blocs. Correct d'y renoncer — l'adaptation seule prendrait 2 semaines, il resterait 5 semaines sans structure de surcharge. Pas de problème.

---

## P32 — buildPhases(8, 'strength')

**Simulation pas à pas :**
```
adapt     = 2
deload    = 1  (8 < 12)
intensive = 2  (8 ≤ 9)
progress  = max(1, 8-2-2-1) = max(1, 3) = 3
Somme : 2+3+2+1 = 8  ✓

w=1 → adaptation   weekStart=1, weekEnd=2  (w=3)
w=3 → progression  weekStart=3, weekEnd=5  (w=6)
w=6 → intensification weekStart=6, weekEnd=7  (w=8)
w=8 → deload       weekStart=8, weekEnd=8  (totalWeeks=8)
```

**Semaines :** `[1-2 Adaptation | 3-5 Progression | 6-7 Intensification | 8 Décharge]`

**Assertions :**
- 4 phases retournées : **PASS**
- adaptation.weekStart=1, weekEnd=2 : **PASS**
- progression.weekStart=3, weekEnd=5 : **PASS**
- intensification.weekStart=6, weekEnd=7 : **PASS**
- deload.weekStart=8, weekEnd=8 : **PASS**
- Modificateurs strength adaptation : setsModifier=-1, repsOffset=+3 : **PASS** (code ligne 621)
- Modificateurs strength intensification : setsModifier=0, repsOffset=-2 : **PASS** (code ligne 623)
  - ⚠️ L'assertion dans audit_prompt_v3.md dit encore repsOffset=-3 — valeur **obsolète depuis BUG-3**. Le code est correct à -2.
- Modificateurs strength deload : setsModifier=-2, repsOffset=+4 : **PASS** (code ligne 624)

**Coach :** Programme 8 semaines strength bien structuré. 3 semaines de progression = volume court mais suffisant pour un bloc de force. 1 semaine de décharge correcte. La phase intensification à 2 semaines avec repsOffset=-2 donne repsMin=1 (3-2=1) — spécifications extrêmes mais techniquement valides ; à réserver aux pratiquants confirmés malgré la durée courte.

---

## P33 — buildPhases(9, 'endurance')

**Simulation pas à pas :**
```
adapt     = 2
deload    = 1  (9 < 12)
intensive = 2  (9 ≤ 9)
progress  = max(1, 9-2-2-1) = max(1, 4) = 4
Somme : 2+4+2+1 = 9  ✓

w=1 → adaptation      weekStart=1, weekEnd=2  (w=3)
w=3 → progression     weekStart=3, weekEnd=6  (w=7)
w=7 → intensification weekStart=7, weekEnd=8  (w=9)
w=9 → deload          weekStart=9, weekEnd=9
```

**Assertions :**
- 4 phases, somme=9 : **PASS**
- adaptation.weekEnd=2 : **PASS**
- progression.weekEnd=6 : **PASS**
- intensification.weekEnd=8 : **PASS**
- endurance adaptation : setsModifier=-1, repsOffset=-2 : **PASS** (code ligne 632)
- endurance intensification : setsModifier=+1, repsOffset=+3 : **PASS** (code ligne 633)

**Coach :** Endurance 9 semaines — la phase intensification à 2 semaines avec +1 série et +3 reps est ambitieuse (4 séries × 18 reps) mais cohérente avec l'objectif endurance. 1 semaine de décharge est le minimum acceptable. Pas de problème structurel.

---

## P34 — buildPhases(10, 'hypertrophy')

**Simulation pas à pas :**
```
adapt     = 2
deload    = 1  (10 < 12)
intensive = 3  (10 > 9 et 10 < 16)  ← seuil ≤9 dépassé, bascule à 3
progress  = max(1, 10-2-3-1) = max(1, 4) = 4
Somme : 2+4+3+1 = 10  ✓

w=1  → adaptation      weekStart=1, weekEnd=2  (w=3)
w=3  → progression     weekStart=3, weekEnd=6  (w=7)
w=7  → intensification weekStart=7, weekEnd=9  (w=10)
w=10 → deload          weekStart=10, weekEnd=10
```

**Assertions :**
- intensive=3 (pas 2, car 10>9) : **PASS** (condition `totalWeeks <= 9` = false, `totalWeeks >= 16` = false → valeur 3)
- progression.weekEnd=6 : **PASS**
- intensification.weekStart=7, weekEnd=9 : **PASS**
- deload.weekStart=10, weekEnd=10 : **PASS**
- hypertrophy intensification : setsModifier=+1, repsOffset=-2 : **PASS** (code ligne 629)

**Coach :** Hypertrophie 10 semaines — structure solide. 3 semaines d'intensification avec +1 série et -2 reps (6–10 reps au lieu de 8–12) correspondent bien à la zone de volume dense. Très bon programme pour un cycle de prise de masse.

---

## P35 — buildPhases(12, 'fat_loss')

**Simulation pas à pas :**
```
adapt     = 2
deload    = 2  (12 ≥ 12)  ← premier seuil deload=2
intensive = 3  (12 > 9 et 12 < 16)
progress  = max(1, 12-2-3-2) = max(1, 5) = 5
Somme : 2+5+3+2 = 12  ✓

w=1  → adaptation      weekStart=1, weekEnd=2  (w=3)
w=3  → progression     weekStart=3, weekEnd=7  (w=8)
w=8  → intensification weekStart=8, weekEnd=10 (w=11)
w=11 → deload          weekStart=11, weekEnd=12
```

**Assertions :**
- deload=2 (premier seuil ≥12) : **PASS** (code ligne 660 : `totalWeeks >= 12 ? 2 : 1`)
- progression.weekStart=3, weekEnd=7 (5 semaines) : **PASS**
- deload.weekStart=11, weekEnd=12 : **PASS**
- fat_loss adaptation : setsModifier=-1, repsOffset=0 : **PASS** (code ligne 638)
- fat_loss deload : setsModifier=-1, repsOffset=0 : **PASS** (code ligne 640)

**Coach :** Fat_loss 12 semaines — excellente structure. 5 semaines de progression permettent une progression réelle. 3 semaines d'intensification (+3 reps = 15 reps composés) maximisent la densité. 2 semaines de décharge bienvenues après un bloc intense.

---

## P36 — buildPhases(16, 'strength')

**Simulation pas à pas :**
```
adapt     = 2
deload    = 2  (16 ≥ 12)
intensive = 4  (16 ≥ 16)  ← seuil ≥16 atteint
progress  = max(1, 16-2-4-2) = max(1, 8) = 8
Somme : 2+8+4+2 = 16  ✓

w=1  → adaptation      weekStart=1, weekEnd=2  (w=3)
w=3  → progression     weekStart=3, weekEnd=10 (w=11)
w=11 → intensification weekStart=11, weekEnd=14 (w=15)
w=15 → deload          weekStart=15, weekEnd=16
```

**Assertions :**
- intensive=4 (seuil ≥16) : **PASS** (code ligne 661 : `totalWeeks >= 16 ? 4 : 3`)
- progression : 8 semaines, weekStart=3, weekEnd=10 : **PASS**
- intensification.weekStart=11, weekEnd=14 : **PASS**
- deload.weekStart=15, weekEnd=16 : **PASS**

**Coach :** Strength 16 semaines — programme de compétition. 8 semaines de progression permettent une montée en charge sérieuse. 4 semaines d'intensification (repsMin=1 avec repsOffset=-2) correspondent à un vrai bloc de peak pour athlète. 2 semaines de décharge après un effort de cette intensité est le minimum. Excellent programme pour un powerlifter confirmé.

---

## P37 — Specs finales ≥ 1 après modificateurs (tous goals × phases)

**Note :** la table ci-dessous utilise les valeurs **actuelles** du code (BUG-3 corrigé : strength intensification repsOffset=-2 et non -3). La table du prompt v3 était obsolète sur cette ligne.

### Composés

| Goal | Phase | Base sets | Modifier | = sets | Base repsMin | Offset | = repsMin | Valide |
|------|-------|-----------|----------|--------|--------------|--------|-----------|--------|
| strength | adaptation | 5 | -1 | **4** | 3 | +3 | **6** | ✅ |
| strength | intensification | 5 | 0 | **5** | 3 | **-2** | **1** | ✅ BUG-3 résolu |
| strength | deload | 5 | -2 | **3** | 3 | +4 | **7** | ✅ |
| hypertrophy | adaptation | 4 | -1 | **3** | 8 | +2 | **10** | ✅ |
| hypertrophy | intensification | 4 | +1 | **5** | 8 | -2 | **6** | ✅ |
| hypertrophy | deload | 4 | -2 | **2** | 8 | 0 | **8** | ✅ |
| endurance | adaptation | 3 | -1 | **2** | 15 | -2 | **13** | ✅ |
| endurance | intensification | 3 | +1 | **4** | 15 | +3 | **18** | ✅ |
| endurance | deload | 3 | -2 | **1** | 15 | 0 | **15** | ✅ |
| fat_loss | adaptation | 3 | -1 | **2** | 12 | 0 | **12** | ✅ |
| fat_loss | intensification | 3 | 0 | **3** | 12 | +3 | **15** | ✅ |
| fat_loss | deload | 3 | -1 | **2** | 12 | 0 | **12** | ✅ |

### Isolations

| Goal | Phase | Base sets | Modifier | = sets | Base repsMin | Offset | = repsMin | Valide |
|------|-------|-----------|----------|--------|--------------|--------|-----------|--------|
| strength | adaptation | 3 | -1 | **2** | 5 | +3 | **8** | ✅ |
| strength | intensification | 3 | 0 | **3** | 5 | **-2** | **3** | ✅ |
| strength | deload | 3 | -2 | **1** | 5 | +4 | **9** | ✅ |
| hypertrophy | adaptation | 3 | -1 | **2** | 10 | +2 | **12** | ✅ |
| hypertrophy | intensification | 3 | +1 | **4** | 10 | -2 | **8** | ✅ |
| hypertrophy | deload | 3 | -2 | **1** | 10 | 0 | **10** | ✅ |
| endurance | adaptation | 3 | -1 | **2** | 15 | -2 | **13** | ✅ |
| endurance | intensification | 3 | +1 | **4** | 15 | +3 | **18** | ✅ |
| endurance | deload | 3 | -2 | **1** | 15 | 0 | **15** | ✅ |
| fat_loss | adaptation | 3 | -1 | **2** | 12 | 0 | **12** | ✅ |
| fat_loss | intensification | 3 | 0 | **3** | 12 | +3 | **15** | ✅ |
| fat_loss | deload | 3 | -1 | **2** | 12 | 0 | **12** | ✅ |

**Assertions :**
- Toutes les valeurs sets ≥ 1 : **PASS** (minimum = 1, strength compound deload et hypertrophy isolation deload)
- Toutes les valeurs repsMin ≥ 1 : **PASS** (minimum = 1, strength compound intensification → 3+(-2)=1 ✓)
- BUG-3 résolu — strength compound intensification n'est plus 0 mais 1 : **PASS**
- La table du prompt v3 qui signalait `strength + compound + intensification → repsMin=0` est **périmée** — le code corrigé donne 1.

**Coach :**
- strength compound intensification : 5×1 rep = spectre de la force pure (1RM). En usage application : techniquement valide pour un athlète avancé en semaine de peak. Pour un débutant ou intermédiaire en strength, risque blessure non négligeable à 1 rep max. Recommandation : alerter si level=beginner ou intermediate.
- endurance compound intensification : 4×18 reps sur composés = volume très élevé. Cohérent avec l'objectif mais fatiguant — récupération entre sessions à surveiller.
- strength isolation deload : 1×9 reps = seule série de récupération, acceptable.

---

## P38 — phaseAtLeast : logique d'ordre correct (ligne 651–653)

**Code :**
```typescript
const PHASE_ORDER: Record<PhaseKey, number> = {
  adaptation: 1, progression: 2, intensification: 3, deload: 4,
}
export function phaseAtLeast(current: PhaseKey, required: PhaseKey): boolean {
  return PHASE_ORDER[current] >= PHASE_ORDER[required]
}
```

**Simulation de chaque assertion :**

| Appel | Calcul | Résultat attendu | Résultat réel | Assertion |
|-------|--------|-----------------|---------------|-----------|
| `phaseAtLeast('adaptation', 'adaptation')` | 1 ≥ 1 | true | true | **PASS** |
| `phaseAtLeast('adaptation', 'progression')` | 1 ≥ 2 | false | false | **PASS** |
| `phaseAtLeast('progression', 'progression')` | 2 ≥ 2 | true | true | **PASS** |
| `phaseAtLeast('intensification', 'progression')` | 3 ≥ 2 | true | true | **PASS** |
| `phaseAtLeast('progression', 'intensification')` | 2 ≥ 3 | false | false | **PASS** |
| `phaseAtLeast('deload', 'intensification')` | 4 ≥ 3 | true | true | **PASS** |
| `phaseAtLeast('intensification', 'deload')` | 3 ≥ 4 | false | false | **PASS** |
| `phaseAtLeast('deload', 'deload')` | 4 ≥ 4 | true | true | **PASS** |

**Assertions :** Toutes les 8 comparaisons : **PASS**

**Coach :** Logique d'ordre correcte. La notion de "décharge est plus avancée que l'intensification" (PHASE_ORDER[deload]=4 > PHASE_ORDER[intensification]=3) est contre-intuitive pour certains usages (ex. "est-on en phase dure ?") mais cohérente avec la chronologie linéaire du programme. Si `phaseAtLeast` est utilisée pour déverrouiller des fonctionnalités (ex. "l'utilisateur est en intensification ou au-delà"), la sémantique est correcte.

---

## P39 — Cohérence wizard : phaseLabel vs buildPhases

**Code phaseLabel (ProgramGeneratorScreen.tsx lignes 603–614) :**
```typescript
function phaseLabel(weeks: number): string {
  const phases = buildPhases(weeks)   // appel sans goal → default 'strength'
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

**Observation :** `phaseLabel` appelle `buildPhases(weeks)` sans passer le goal → `goal = 'strength'` par défaut. Mais la durée des phases ne dépend pas du goal (seuls les modificateurs changent). Les labels produits (durées + noms) sont donc identiques quel que soit le goal réel du programme — comportement correct pour un label de durée.

**Test 7 semaines :**
```
buildPhases(7) → undefined → '' ✓
```

**Test 8 semaines :**
```
adapt=2, progress=3, intens=2, deload=1
Phases : [1-2 adaptation] [3-5 progression] [6-7 intensification] [8-8 deload]
→ "2 sem. adaptation · 3 sem. progression · 2 sem. intensification · 1 sem. décharge"
```

**Test 10 semaines :**
```
adapt=2, progress=4, intens=3, deload=1
Phases : [1-2] [3-6] [7-9] [10-10]
→ "2 sem. adaptation · 4 sem. progression · 3 sem. intensification · 1 sem. décharge"
```

**Test 12 semaines :**
```
adapt=2, progress=5, intens=3, deload=2
Phases : [1-2] [3-7] [8-10] [11-12]
→ "2 sem. adaptation · 5 sem. progression · 3 sem. intensification · 2 sem. décharge"
```

**Test 16 semaines :**
```
adapt=2, progress=8, intens=4, deload=2
Phases : [1-2] [3-10] [11-14] [15-16]
→ "2 sem. adaptation · 8 sem. progression · 4 sem. intensification · 2 sem. décharge"
```

**Vérification des sommes :**
- 8 sem : 2+3+2+1 = **8** ✓
- 10 sem : 2+4+3+1 = **10** ✓
- 12 sem : 2+5+3+2 = **12** ✓
- 16 sem : 2+8+4+2 = **16** ✓

**Assertions :**
- Somme des durées = totalWeeks pour toutes valeurs ci-dessus : **PASS**
- Noms 'décharge' (pas 'deload') : **PASS** (ligne 610 du screen : `deload: 'décharge'`)
- Nom 'intensification' (pas 'intensive') : **PASS** (ligne 610 : `intensification: 'intensification'`)
- adapt toujours = 2 semaines dans la string, jamais 3 : **PASS** (`adapt` est hardcodé à 2 en ligne 659 de programGenerator.ts)
- WIZ1 — phaseLabel() délègue à buildPhases() sans formule inline : **PASS** (ligne 604)

**Coach :** Le label est lisible et correct. Le format "N sem. nom" est compact et clair pour l'utilisateur du wizard. La chaîne "décharge" (et non "deload" anglais) est bonne pour la localisation française.

---

## P40 — fmtMod : strings GOAL_PHASES correspondent à PHASE_CONFIG_BY_GOAL

**Code fmtMod (ProgramGeneratorScreen.tsx lignes 887–892) :**
```typescript
function fmtMod(sets: number, reps: number): string {
  const parts: string[] = []
  if (sets !== 0) parts.push(`${sets > 0 ? '+' : ''}${sets} série${Math.abs(sets) > 1 ? 's' : ''}`)
  if (reps !== 0) parts.push(`${reps > 0 ? '+' : ''}${reps} reps`)
  return parts.length ? parts.join(', ') : 'Specs inchangées'
}
```

**Règles de formatage :**
- sets=-1 → `-1 série` (|sets|=1 → "série" sans s)
- sets=-2 → `-2 séries` (|sets|=2 → "séries" avec s)
- sets=+1 → `+1 série`
- sets=0 → non inclus dans parts
- reps=-2 → `-2 reps`
- reps=+3 → `+3 reps`
- reps=0 → non inclus dans parts
- parts=[] → `'Specs inchangées'`

**Simulation complète :**

| Goal | Phase | setsModifier | repsOffset | Appel fmtMod | String produite | Prompt dit | Cohérence |
|------|-------|-------------|-----------|--------------|-----------------|------------|-----------|
| strength | adaptation | -1 | +3 | fmtMod(-1, 3) | `-1 série, +3 reps` | `-1 série, +3 reps` | **PASS** |
| strength | intensification | 0 | **-2** | fmtMod(0, -2) | **`-2 reps`** | `-3 reps` ← obsolète | **PASS** (code correct ; prompt stale) |
| strength | deload | -2 | +4 | fmtMod(-2, 4) | `-2 séries, +4 reps` | `-2 séries, +4 reps` | **PASS** |
| hypertrophy | adaptation | -1 | +2 | fmtMod(-1, 2) | `-1 série, +2 reps` | `-1 série, +2 reps` | **PASS** |
| hypertrophy | intensification | +1 | -2 | fmtMod(1, -2) | `+1 série, -2 reps` | `+1 série, -2 reps` | **PASS** |
| hypertrophy | deload | -2 | 0 | fmtMod(-2, 0) | `-2 séries` | `-2 séries` | **PASS** |
| endurance | adaptation | -1 | -2 | fmtMod(-1, -2) | `-1 série, -2 reps` | `-1 série, -2 reps` | **PASS** |
| endurance | intensification | +1 | +3 | fmtMod(1, 3) | `+1 série, +3 reps` | `+1 série, +3 reps` | **PASS** |
| endurance | deload | -2 | 0 | fmtMod(-2, 0) | `-2 séries` | `-2 séries` | **PASS** |
| fat_loss | adaptation | -1 | 0 | fmtMod(-1, 0) | `-1 série` | `-1 série` | **PASS** |
| fat_loss | intensification | 0 | +3 | fmtMod(0, 3) | `+3 reps` | `+3 reps` | **PASS** |
| fat_loss | deload | -1 | 0 | fmtMod(-1, 0) | `-1 série` | `-1 série` | **PASS** |
| — | — | 0 | 0 | fmtMod(0, 0) | `Specs inchangées` | `Specs inchangées` | **PASS** |

**Assertions :**
- Toutes les strings correspondent aux numériques de `PHASE_CONFIG_BY_GOAL` (code actuel) : **PASS** (12/12 + cas limite)
- La phase `progression` n'a pas de setsModifier/repsOffset → non affichée dans GOAL_PHASES : **PASS**
  - `GoalPhaseRow = Record<'adaptation' | 'intensification' | 'deload', string>` (ligne 893 ProgramGeneratorScreen)
  - `progression` est délibérément absent du type et du reduce
- `fmtMod(0, 0)` → `"Specs inchangées"` : **PASS** (parts=[], return 'Specs inchangées')

**Point clé BUG-3 / P40 :** La string pour strength intensification est désormais `"-2 reps"` (et non `"-3 reps"` comme indiqué dans le prompt v3). La table du prompt était synchronisée avec l'ancien code. Avec le fix, le code, PHASE_CONFIG_BY_GOAL et fmtMod sont tous cohérents entre eux : **PASS**.

**Coach :** Le formatage fmtMod est clair pour l'utilisateur wizard. "−2 séries" et "+3 reps" se lisent intuitivement. Le fallback "Specs inchangées" pour la progression (0,0) est propre — même si ce cas ne s'affiche pas en pratique puisque progression est absent de GOAL_PHASES.

---

## Récapitulatif des assertions — Groupe E

| Code | Assertion | Profils | Résultat |
|------|-----------|---------|----------|
| BUILD1 | totalWeeks<8 → buildPhases()=undefined | P31 | **PASS** |
| BUILD2 | adapt=2 fixe pour tous totalWeeks≥8 | P32-P36 | **PASS** |
| BUILD3 | deload=1 si <12sem, =2 si ≥12sem | P32,P33,P35,P36 | **PASS** |
| BUILD4 | intensive=2 si ≤9sem, 3 si 10-15sem, 4 si ≥16sem | P32-P36 | **PASS** |
| BUILD5 | progress=max(1, total-adapt-intens-deload) | P32-P36 | **PASS** |
| BUG3-FIX | strength compound intensification → repsMin=3+(−2)=1 ≥ 1 | P37 | **PASS** (BUG-3 corrigé) |
| ALL-VALID | Toutes combinaisons goal×type×phase → sets≥1 et repsMin≥1 | P37 | **PASS** |
| PHASE1 | phaseAtLeast compare les ordres 1-4 correctement (8 cas) | P38 | **PASS** |
| WIZ1 | phaseLabel() délègue à buildPhases() sans formule inline | P39 | **PASS** |
| WIZ2 | phaseLabel() produit les strings correctes pour 7/8/10/12/16 sem | P39 | **PASS** |
| WIZ3 | 'décharge' et 'intensification' (pas 'deload'/'intensive') dans phaseLabel | P39 | **PASS** |
| WIZ4 | fmtMod génère les strings à partir des numériques PHASE_CONFIG_BY_GOAL | P40 | **PASS** |
| WIZ5 | progression absente de GOAL_PHASES | P40 | **PASS** |
| WIZ6 | fmtMod(0,0) → 'Specs inchangées' | P40 | **PASS** |

**Verdict global Groupe E : ✅ 14/14 PASS — Aucun bug détecté dans l'état actuel du code.**

---

## Tableau de synthèse — P31 à P40

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|--------|----------------------|---------|-------------------|
| P31 | buildPhases(7)=undefined, phaseLabel(7)='', phases:undefined dans DraftProgram | ✅ PASS | — |
| P32 | buildPhases(8,'strength') : 4 phases correctes, semaines exactes, modificateurs strength corrects | ✅ PASS | intensity 5×1 rep viable seulement pour pratiquant confirmé ; à signaler si level≠advanced |
| P33 | buildPhases(9,'endurance') : somme=9, weekEnds corrects, modificateurs endurance corrects | ✅ PASS | intensification 4×18 reps = volume très élevé ; récupération inter-sessions critique |
| P34 | buildPhases(10,'hypertrophy') : intensive=3 (seuil 10>9), semaines exactes | ✅ PASS | — |
| P35 | buildPhases(12,'fat_loss') : deload=2 (seuil ≥12), progression 5 sem, décharge sem 11-12 | ✅ PASS | — |
| P36 | buildPhases(16,'strength') : intensive=4 (seuil ≥16), progression 8 sem, somme=16 | ✅ PASS | programme peak-powerlifter ; 5×1 rep en intensification sur 4 semaines = risque si technique insuffisante |
| P37 | Toutes combinaisons goal×type×phase : sets≥1 et repsMin≥1 (BUG-3 résolu : 3-2=1≥1) | ✅ PASS | strength compound intensification = 5×1 rep : spécification extrême, acceptable pour advanced uniquement |
| P38 | phaseAtLeast : 8 comparaisons d'ordre toutes correctes | ✅ PASS | — |
| P39 | phaseLabel() délègue à buildPhases(), strings correctes, 'décharge'/'intensification' corrects, adapt=2 toujours | ✅ PASS | phaseLabel appelle buildPhases(weeks) sans goal → goal='strength' par défaut ; inoffensif car durées indépendantes du goal, mais légèrement trompeur à la lecture du code |
| P40 | fmtMod() produit les 12 strings correctes depuis PHASE_CONFIG_BY_GOAL ; strength intensification = '-2 reps' (pas '-3 reps') ; progression absente de GOAL_PHASES ; fmtMod(0,0)='Specs inchangées' | ✅ PASS | La table dans audit_prompt_v3.md section P40 et P32 indique encore repsOffset=-3 pour strength intensification → table du prompt **obsolète**, le code est correct |

---

## Synthèse des problèmes ouverts

### Bugs / anomalies logicielles (assertions FAIL)

**Aucun FAIL détecté dans le Groupe E.**

Le seul bug identifié historiquement (BUG-3 : strength intensification repsOffset=-3 → repsMin=0) est **corrigé** en commit c409784 (repsOffset=-2 → repsMin=1). Le code, le commentaire inline (ligne 623), et le comportement runtime sont tous cohérents.

### Points de maintenance à surveiller

1. **Table P37 et P40 dans audit_prompt_v3.md** — La valeur `repsOffset=-3` pour strength intensification apparaît encore dans la table P37 (ligne marquée ❌ BUG) et dans la table P40 (colonne "String attendue" : "-3 reps"). Ces deux entrées sont **obsolètes depuis BUG-3** et doivent être mises à jour dans audit_prompt_v4+ pour éviter une régression de test fantôme.

2. **phaseLabel sans goal (P39)** — `phaseLabel(weeks)` appelle `buildPhases(weeks)` sans transmettre le goal courant. C'est inoffensif aujourd'hui (les durées de phases ne dépendent pas du goal), mais si une future version de buildPhases différenciait les durées par goal, le label afficherait la mauvaise structure. Faible risque, faible urgence.

3. **strength compound intensification : 5×1 rep** — Techniquement valide (repsMin=1≥1), mais pédagogiquement risqué pour beginner et intermediate. Aucun garde-fou dans le code actuel. Recommandation : ajouter un warning `generatorWarnings` quand `goal=strength && level!=='advanced'` et une phase intensification est active.

### Réserves coach cumulées

| Thème | Profils | Recommandation |
|-------|---------|----------------|
| Spécifications 1 rep max en strength intensification | P32, P36, P37 | Ajouter un warning si level ≠ 'advanced' : "Intensification force : les répétitions très faibles (1–2 reps) exigent une technique parfaite. Envisagez de commencer à 3 reps minimum." |
| Volume endurance intensification (4×18 reps) | P33, P37 | Acceptable sportivement, mais à mentionner dans la description de phase : "4 séries à 18+ reps = effort maximal. Réduire si récupération insuffisante." |
| Cohérence programme 8 semaines strength pour non-advanced | P32 | Durée courte + specs extrêmes = risque blessure si l'utilisateur n'est pas advanced. Le programme ne vérifie pas la cohérence durée/niveau/goal. |
