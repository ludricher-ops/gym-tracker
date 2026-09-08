# Prompt d'audit v11 — programGenerator.ts
**Date :** 2026-09-08
**Objectif :** Référence complète — fusion exhaustive v8+v9+v10, doublons stricts retirés.
**Profils :** ~143 (29 v10 + 84 v8 + 30 v9)
**Suite de tests :** `tests/audit_v11.test.ts` — 196 tests ✅

---

## TABLE DE DÉDUPLICATION

Les profils suivants sont retirés (doublons couverts par un profil plus complet) :

| Profil retiré | Doublon gardé | Raison |
|---|---|---|
| v8 P48 — BW glutes-focus 4j SEED-BW-NOBACK absent | B01 | splitPreference='glutes-focus' → exception identique |
| v8 P86 — focusMuscles=['glutes'] 3j intermediate (fat_loss) | C03 | mêmes params (equipment DB+machine, légère diff) |
| v9 P19 — BW focusMuscles=['glutes'] sans splitPreference → pas de warning | C03 | même comportement isGlutesSplit |
| D-P01 — Machine seul, PPL 3j hypertrophy intermediate | G-V9-P06 | même profil machine PPL 60min, assertions machine-low-row + machine-pullover |
| D-P03 — Machine seul, PPL 3j strength intermediate (INC-1) | G-V9-P10 | même profil machine strength INC-1 fullbody, assertions plus complètes |
| D-P05 — Machine seul, 20min hypertrophy intermediate | G-V9-P05 | même profil machine pull 20min, assertions machine-low-row complètes |
| D-P06 — Machine seul, 45min hypertrophy intermediate | G-V9-P01 | même profil machine pull 45min, assertions isolation dos remplies |
| D-P11 — Machine + câble, upper-lower 4j intermediate | G-V9-P24 | même profil machine+câble upper-pull, assertions isolation dos |
| D-P21 — DB seul, PPL 3j hypertrophy intermediate | G-V9-P12 | même profil DB pull, seed-pullover reclassifié isolation |
| D-P38 — DB seul, chest-back Arnold 5j intermediate | G-V9-P25 | même profil DB arnold, seed-pullover en isolation |
| D-P41 — BW seul, PPL 3j intermediate → BUG-BW-PULL | G-V9-P13 | même profil BW PPL, assertions BUG-BW-PULL inchangées |
| D-P42 — BW seul, fullbody 3j beginner → SEED-BW-NOBACK | G-V9-P18 | même profil BW fullbody beginner, comportement inchangé |
| D-P43 — BW seul, fat_loss 3j intermediate → BUG-BW-PULL (PPF) | G-V9-P17 | même profil BW fat_loss PPF, assertions BUG-BW-PULL |
| D-P47 — BW seul, upper-lower 4j → SEED-BW-NOBACK | G-V9-P16 | même profil BW upper-lower, hasPullInSplit=false confirmé |
| D-P49 — BW seul, strength 3j intermediate (INC-1 + BW) | A02 | même profil BW strength INC-1 fullbody, assertions plus complètes |
| D-P58 — BW seul, focusMuscles=['glutes'] 3j intermediate | C03 | assertions incorrectes (pré-fix) — C03 couvre isGlutesSplit=true |
| D-P81 — focusMuscles=['chest'] 3j intermediate | D-P94 | D-P81 subset de D-P94 (UX-B absent confirmé) |
| D-P82 — focusMuscles=['shoulders'] 3j intermediate | D-P93 | D-P82 subset de D-P93 (UX-B présent) |
| D-P83 — focusMuscles=['arms'] 3j intermediate | D-P92 | D-P83 subset de D-P92 (UX-B appliqué) |
| B11 — Glutes+dos × Salle, strength 4j, 60min | C06 | C06 identique + assertion strengthEquipmentPrio explicite (5 vs 4 assertions) |

---

---

## RÉFÉRENCE TECHNIQUE — CORRECTIONS v10

### 1. Bases de slots par type de séance

| Type | Base |
|------|------|
| fullbody-quad | **9** |
| fullbody-hip | **9** |
| glutes-hip | **8** ← CORRECTION (v9 indiquait 6 par erreur) |
| quad-glutes | **8** ← CORRECTION (v9 indiquait 6 par erreur) |
| push / pull / legs / back-bi / chest-back | 8 |

### 2. adjustedSlotCount — formule

| goal | 20 min | 45 min | 60 min | 90 min |
|------|--------|--------|--------|--------|
| strength | min(3, max(2, ⌊base×0.5⌋)) | min(3, max(2, ⌊base×0.5⌋)) | max(4, ⌊base×0.5⌋) | min(base, 5) |
| autres | max(2, ⌊base×0.5⌋) | max(4, ⌊base×0.75⌋) | base | min(base+2, 8) |

**Résultats clés :**

| Session (base) | goal | durée | cap |
|----------------|------|-------|-----|
| fullbody-quad (9) | hypertrophy | 60 min | **9** (slots 0–8, triceps inclus) |
| fullbody-quad (9) | hypertrophy | 45 min | **6** (slots 0–5) |
| fullbody-quad (9) | hypertrophy | 90 min | **8** (slots 0–7, triceps exclu) |
| fullbody-quad (9) | strength | 60 min | **4** (slots 0–3) |
| fullbody-quad (9) | strength | 90 min | **5** (slots 0–4) |
| glutes-hip (8) | fat_loss | 60 min | **8** (tous) |
| glutes-hip (8) | fat_loss | 45 min | **6** (slots 0–5) |
| glutes-hip (8) | strength | 60 min | **4** (slots 0–3) |
| glutes-hip (8) | strength | 90 min | **5** (slots 0–4) |
| quad-glutes (8) | identique glutes-hip | — | — |

### 3. Slots détaillés

#### fullbody-quad (base=9)
```
[0] ['quads','glutes']                      compound
[1] ['chest','chest_upper']                 compound
[2] ['back_width','back_thickness','back']  compound  ← slot dos critique
[3] ['shoulders','shoulders_front']         compound
[4] ['hamstrings']                          isolation  ← VIDE en BW/DB/KB
[5] ['shoulders_rear']                      isolation
[6] ['biceps']                              isolation
[7] ['calves']                              isolation
[8] ['triceps']                             isolation  ← éjecté si cap≤8
```

#### fullbody-hip (base=9)
```
[0] ['hamstrings','glutes']                 compound
[1] ['chest','chest_upper']                 compound
[2] ['back_width','back_thickness','back']  compound
[3] ['shoulders','shoulders_front']         compound
[4] ['quads']                               isolation  ← bw-sissy-squat en BW/DB/KB (weight_reps ✅ FIXÉ R3)
[5] ['shoulders_lateral','shoulders_rear']  isolation
[6] ['biceps']                              isolation
[7] ['calves']                              isolation
[8] ['triceps']                             isolation  ← éjecté si cap≤8
```

#### glutes-hip (base=8)
```
[0] ['glutes','hamstrings']                 compound  ← slotPrimary=glutes
[1] ['hamstrings','glutes']                 compound  ← slotPrimary=hamstrings
[2] ['quads','glutes']                      compound
[3] ['back_width','back_thickness']         compound  ← "slot posture dos"  VIDE si BW
[4] ['glutes']                              isolation
[5] ['hamstrings']                          isolation  ← VIDE en BW/DB/KB
[6] ['glutes']                              isolation
[7] ['back_thickness','back']               isolation
```

#### quad-glutes (base=8)
```
[0] ['quads','glutes']                      compound
[1] ['glutes','hamstrings']                 compound  ← slotPrimary=glutes
[2] ['back_thickness','back']               compound  ← VIDE si BW
[3] ['quads']                               isolation
[4] ['glutes']                              isolation
[5] ['hamstrings']                          isolation  ← VIDE en BW/DB/KB
[6] ['calves']                              isolation
[7] ['back_width','back']                   isolation  ← seed-pullover (DB, isolation, pop 1)
```

### 4. pickExercise — ordre de tri

1. focusMuscleRank (index de primaryMuscle dans focusMuscles)
2. slotPrimaryRank (index de primaryMuscle dans slot.muscles, 0=meilleur)
3. usedGlobally (false < true)
4. strengthEquipmentPrio (goal=strength + compound → barbell/machine prime)
5. popularity desc

Pool : top-1 pour beginner, top-3 pour intermediate/advanced (aléatoire dans le pool).

### 5. workoutTypeFromFocus — CORRECTION CRITIQUE

| focusMuscles | résultat | raison |
|-------------|----------|--------|
| ['glutes'] | 'glutes-hip' | hasGlutes prime |
| ['glutes','back'] | **'pull'** ✅ CONFIRMÉ | hasPull=true vérifié AVANT hasGlutes → split dos sans fessiers |
| ['legs'] | 'lower' → lower-quad/lower-hip | hasLower prime |
| ['chest','back'] | 'fullbody' | hasPush+hasPull+!hasLower |

> ⚠️ `focusMuscles=['glutes','back']` produit un split pull/upper-pull, PAS un split fessiers. L'utilisateur qui cible fessiers+dos reçoit des séances dos pures.  
> 🔧 **RÉSERVE-2 FIXÉE (commit 1fcef7f) :** warning UX-6 désormais émis quand `hasFocusPull && hasFocusGlutes && !hasFocusLower`. Message : "Focus dos + fessiers : la combinaison génère un programme de tirage (dos) où les fessiers sont sollicités en secondaires — pour des séances fessiers autonomes, sélectionnez uniquement Fessiers."

### 6. BUG-BW-PULL (fix v9 — élargi)

```typescript
const backSessionTypes = ['pull', 'back-bi', 'chest-back']
const hasPullInSplit = rawSplit.some(t => backSessionTypes.includes(t))
const hasCompoundBack = available.some(ex =>
  ex.category === 'compound' &&
  ['back_width','back_thickness','back'].includes(ex.primaryMuscle)
)
// Si !hasCompoundBack && hasPullInSplit :
// 'pull' | 'back-bi' → 'fullbody-quad'
// 'chest-back' → 'push'
// + warning "Séance(s) dos remplacée(s)..."
```

### 7. SEED-BW-NOBACK (fix v9)

Émis si : `!hasCompoundBack && !hasPullInSplit && splitPreference !== 'glutes-focus' && !isGlutesSplit`

`isGlutesSplit = rawSplit.every(t => t === 'glutes-hip' || t === 'quad-glutes')`

> Le warning "Aucun exercice composé disponible pour dos (largeur)" par slot est **indépendant** de SEED-BW-NOBACK. Il peut être émis même si SEED-BW-NOBACK est supprimé (ex : BW + splitPreference='glutes-focus').

### 8. INC-1

Déclenché si : `goal === 'strength' && level !== 'beginner' && daysPerWeek <= 3 && !splitPreference`  
→ split = `['fullbody-quad','fullbody-hip','fullbody-quad']`  
**Ne se déclenche PAS si splitPreference est défini.**

### 9. Exercices de référence par équipement

#### BW seul
| Muscle / slot | Exercice | Pop | Statut |
|---------------|----------|-----|--------|
| compound quads/glutes | bw-squat | 3 | ✅ |
| compound chest | seed-pushup (chest, rank 0) | 2 | ✅ beginner |
| compound chest (intermediate) | seed-pushup OU bw-incline-pushup (chest_upper, pop 2) | 2 | ⚠️ top-3 random → 50/50 |
| compound shoulders | bw-pike-pushup | 1 | ✅ seul |
| compound hamstrings | seed-good-morning-bw | 1 | ✅ FIXÉ R1 (12cf14e) |
| compound back | **AUCUN** | — | ❌ + WARNING |
| compound glutes slot[0] glutes-hip | seed-hip-thrust-bw | 3 | ✅ (slotPrimary=glutes rank 0) |
| compound hamstrings/glutes slot[0] **fullbody-hip** | **seed-good-morning-bw** | 1 | ✅ slotPrimary='hamstrings' → good-morning rank 0 prime sur hip-thrust-bw (glutes rank 1, pop 3) ⚠️ DÉCOUVERTE |
| compound hamstrings slot[1] glutes-hip | seed-good-morning-bw | 1 | ✅ FIXÉ R1 (slotPrimary=hamstrings) |
| isolation quads | bw-sissy-squat | 3 | ✅ FIXÉ R3 (bw-wall-sit → warmup) |
| isolation glutes | seed-glute-bridge (3), seed-donkey-kick (2), seed-fire-hydrant (2) | — | ✅ |
| isolation calves | bw-calf-raise | 2 | ✅ |
| isolation hamstrings | AUCUN | — | ❌ |
| isolation biceps | AUCUN | — | ❌ |
| isolation shoulders_rear | AUCUN | — | ❌ |

> ⚠️ **DÉCOUVERTE :** `fullbody-hip slot[0] = ['hamstrings','glutes']` → slotPrimary='hamstrings'. `seed-good-morning-bw` (hamstrings, rank 0) bat `seed-hip-thrust-bw` (glutes, rank 1) même si pop 3 > pop 1. Ce slot sélectionne **good-morning-bw** en BW, jamais hip-thrust-bw. Le fullbody-hip slot[1] = chest — hip-thrust-bw n'apparaît **PAS** dans fullbody-hip (contrairement à glutes-hip).

#### DB + BW
| Muscle / slot | Exercice | Pop | Note |
|---------------|----------|-----|------|
| compound quads/glutes | bw-squat (BW,3) > seed-lunges (DB,2) | — | bw-squat gagne sur pop |
| compound chest | seed-bench-dumbbell | 3 | ✅ |
| compound back (SEUL) | seed-row-dumbbell (back_thickness) | 3 | ⚠️ back_width non couvert |
| compound hamstrings slot[0] glutes-hip | seed-hip-thrust-bw (glutes,3) usé → dumbbell-rdl (hamstrings,2) | — | slot[0]=glutes, slot[1]=hamstrings |
| compound hamstrings slot[1] glutes-hip | dumbbell-rdl | 2 | ✅ slotPrimary=hamstrings |
| compound hamstrings/glutes slot[0] **fullbody-hip** | **seed-good-morning-bw** si dumbbell-rdl usedGlobally | 1 | ⚠️ DÉCOUVERTE : fullbody-quad slot[4] sélectionne dumbbell-rdl comme fallback hamstrings → usedGlobally → fullbody-hip slot[0] prend good-morning-bw |
| compound glutes slot[0] glutes-hip | seed-hip-thrust-bw | 3 | ✅ (slotPrimary=glutes rank 0) |
| compound shoulders | seed-shoulder-press-dumbbell | 3 | ✅ |
| isolation quads | bw-sissy-squat | 3 | ✅ FIXÉ R3 (bw-wall-sit → warmup) |
| isolation hamstrings | AUCUN | — | ❌ silencieux |
| isolation shoulders_rear | seed-rear-delt-fly | 2 | ✅ |
| isolation biceps | seed-curl-dumbbell (3) / seed-curl-hammer (3) | — | aléatoire |
| isolation calves | seed-calf-raise-db | 2 | ✅ |
| isolation back_thickness slot[7] glutes-hip | seed-pullover-dumbbell | 3 | ✅ |
| isolation back_width slot[7] quad-glutes | seed-pullover | 1 | ✅ seul |

> ⚠️ **DÉCOUVERTE A04 :** En DB+BW fullbody, `fullbody-quad slot[4]` (hamstrings isolation, compound:false) n'a aucun exercice isolation → fallback sur le compound : `dumbbell-rdl` sélectionné (top-1 beginner). Résultat : `dumbbell-rdl` est **usedGlobally** quand fullbody-hip est généré → `fullbody-hip slot[0]` sélectionne `seed-good-morning-bw` (hamstrings, rank 0, non usé) au lieu de dumbbell-rdl.

#### KB + DB + BW (différences vs DB+BW)
| Slot | DB+BW | KB ajouté |
|------|-------|-----------|
| compound quads/glutes | bw-squat (pop 3) | seed-goblet-squat (KB, pop 3) → tie → aléatoire |
| compound hamstrings slot[1] glutes-hip | dumbbell-rdl (pop 2) | kb-rdl (KB, pop 2) → tie → aléatoire |
| compound glutes slot[0] glutes-hip | seed-hip-thrust-bw (pop 3) | kb-swing (KB, pop 3) → tie → aléatoire |
| compound back (dos compound) | seed-row-dumbbell (pop 3) | kb-row (pop 2) → seed-row-dumbbell gagne en priorité |
| **compound back — autre candidat** | — | **kb-deadlift** (KB, primaryMuscle=**'back'**, compound, pop ?) ← candidat valide pour slot `['back_width','back_thickness','back']` → alterné via anti-répétition ⚠️ DÉCOUVERTE |
| isolation back | seed-pullover-dumbbell (pop 3) | kb-pullover (pop 1) → seed-pullover-dumbbell gagne |

> ⚠️ **DÉCOUVERTE A08 :** `kb-deadlift` a `primaryMuscle='back'` (pas 'hamstrings'). `'back'` est dans `slot.muscles` des slots dos compound `['back_width','back_thickness','back']`. `kb-deadlift` est donc un **candidat valide** pour les slots dos compound en fullbody et glutes splits. Il s'alterne avec `seed-row-dumbbell` et `kb-row` via anti-répétition.

> ⚠️ **DÉCOUVERTE B08 :** En `glutes-hip`, `seed-row-dumbbell` est sélectionné pour slot[3] (dos compound). En `quad-glutes` de la même séance suivante, `seed-row-dumbbell` est `usedGlobally` → **`kb-row`** est sélectionné à la place. C'est le comportement correct de l'anti-répétition inter-séances.

#### Salle complète (exercices clés)
| Slot | Exercice (beginner=top-1) |
|------|---------------------------|
| compound quads/glutes | seed-squat-barbell (pop 8) |
| compound chest | seed-bench-barbell (pop 8) |
| compound back_width | seed-pullup (pop 3) tie seed-lat-pulldown (pop 3) → aléatoire |
| compound hamstrings slot[0] fullbody-hip | seed-romanian-deadlift (pop 3, rank 0) |
| compound glutes slot[0] glutes-hip | seed-hip-thrust (barbell, pop 4, rank 0) |
| compound shoulders | seed-ohp-barbell (pop 3) |
| compound back slot[3] glutes-hip | seed-lat-pulldown (cable,3) / seed-pullup (pullup_bar,3) |
| compound back slot[2] quad-glutes | seed-row-barbell (pop 7) |
| isolation hamstrings | seed-leg-curl-lying (machine, pop 3) ← DISPONIBLE en salle (vs VIDE en DB) |
| isolation quads | seed-leg-extension (machine, pop 3) ← DISPONIBLE en salle (vs bw-wall-sit en DB) |
| isolation back slot[7] glutes-hip | seed-pullover-dumbbell (3) / seed-pullover-cable (2) / machine-pullover (2) |

---

### Référence complémentaire — exercices et règles (v8/v9)

## Rappel état du générateur (post-v7)

### Exercices seed clés
| id | primaryMuscle | equipment | category | pop |
|----|--------------|-----------|----------|-----|
| machine-lat-pulldown | back_width | machine | compound | 2 |
| seed-row-machine | back_thickness | machine | compound | 1 |
| seed-lat-pulldown | back_width | cable | compound | 3 |
| seed-pullup | back_width | pullup_bar | compound | 3 |
| seed-pullover | back_width | dumbbell | **compound** | 1 |
| seed-row-dumbbell | back_thickness | dumbbell | compound | 3 |
| seed-row-barbell | back_thickness | barbell | compound | 7 |
| seed-row-tbar | back_thickness | barbell | compound | 2 |
| seed-deadlift | back | barbell | compound | 3 |
| kb-row | back_thickness | kettlebell | compound | 2 |
| kb-deadlift | back | kettlebell | compound | 2 |
| band-row | back_thickness | band | compound | 2 |

### Slots tirage vertical (6 slots modifiés en v7)
`pull[0]`, `upper-pull[0]`, `lower_pull[1]`, `chest-back[1]`, `back-bi[0]`, `glutes-hip[3]`  
→ `{ muscles: ['back_width', 'back_thickness'], compound: true }`  
→ deadlift (primaryMuscle=back) exclu ; slots fullbody `['back_width','back_thickness','back']` inchangés

### Conditions warnings dos
- **BUG-BW-PULL** : `!hasCompoundBack && hasPullInSplit` (hasPullInSplit = `rawSplit.some(t => t === 'pull')`)
- **SEED-BW-NOBACK** : `!hasCompoundBack && !hasPullInSplit && splitPreference !== 'glutes-focus'`

### adjustedSlotCount (duration)
| goal | 20 min | 45 min | 60 min | 90 min |
|------|--------|--------|--------|--------|
| strength | min(3, max(2, ⌊base×0.5⌋)) | min(3, max(2, ⌊base×0.5⌋)) | max(4, ⌊base×0.5⌋) | min(base, 5) |
| autres | max(2, ⌊base×0.5⌋) | max(4, ⌊base×0.75⌋) | base | min(base+2, 8) |

### Splits auto par défaut (selectSplit)
- beginner (tout goal) : `['fullbody-quad','fullbody-hip','fullbody-quad']` (3j) etc.
- strength + intermediate/advanced 3j : `['fullbody-quad','fullbody-hip','fullbody-quad']` (INC-1)
- hypertrophy/fat_loss 3j intermediate : `['push','pull','legs']` (PPL)
- fat_loss 3j intermediate : `['push','pull','fullbody-quad']` (PPF)
- 5j mass+intermediate : `['push','pull','lower-quad','upper','lower-hip']`
- focusMuscles=['glutes'] → `workoutTypeFromFocus` → 'glutes-hip' → alternance hip/quad (fix P36)

---

---

## Contexte des fixes à tester

### Fix 1 — machine-pullover + machine-low-row (Réserve A)
Deux nouveaux exercices ajoutés dans le seed :
- `machine-pullover` : `{ primaryMuscle: 'back_width', equipment: 'machine', category: 'isolation', popularity: 2 }`
- `machine-low-row` : `{ primaryMuscle: 'back_thickness', equipment: 'machine', category: 'isolation', popularity: 2 }`

**Attendu :** les slots isolation dos (`compound: false, muscles: ['back_thickness','back_width','back']`) sont maintenant remplis pour machine seul.

### Fix 2 — seed-pullover reclassifié isolation (Réserve B·P34)
`seed-pullover` : `{ primaryMuscle: 'back_width', equipment: 'dumbbell', category: 'isolation' }` (était `compound`)

**Attendu :** exclu des slots `compound: true`. Pull[0] barbell+dumbbell → `seed-row-barbell` (back_thickness, pop 7) ou autre compound dos barbell prime.

### Fix 3 — BUG-BW-PULL élargi back-bi + chest-back (GAP P54)
```typescript
const backSessionTypes = ['pull', 'back-bi', 'chest-back'] as const
const hasPullInSplit = rawSplit.some((t) => backSessionTypes.includes(t))
// Remplacement :
// 'pull' | 'back-bi' → 'fullbody-quad'
// 'chest-back' → 'push'
```

**Attendu :** BW + brosplit → back-bi remplacé par fullbody-quad + warning.  
**Attendu :** BW + Arnold → chest-back remplacé par push + warning.

### Fix 4 — SEED-BW-NOBACK exception glutes auto (Réserve C·P58)
```typescript
const isGlutesSplit = rawSplit.every((t) => t === 'glutes-hip' || t === 'quad-glutes')
if (!hasCompoundBack && !hasPullInSplit && splitPreference !== 'glutes-focus' && !isGlutesSplit) {
  // warning
}
```

**Attendu :** BW + `focusMuscles=['glutes']` sans splitPreference → split tout-glutes → `isGlutesSplit=true` → warning supprimé.

---

## Rappel : règles générales du générateur

### adjustedSlotCount
| goal | 20 min | 45 min | 60 min | 90 min |
|------|--------|--------|--------|--------|
| strength | min(3, max(2, ⌊base×0.5⌋)) | min(3, max(2, ⌊base×0.5⌋)) | max(4, ⌊base×0.5⌋) | min(base, 5) |
| autres | max(2, ⌊base×0.5⌋) | max(4, ⌊base×0.75⌋) | base | min(base+2, 8) |

Base par type de séance :
- push, pull, legs, back-bi, chest-tri : 8
- upper, upper-push, upper-pull, chest-back : 8
- lower-quad, lower-hip, lower_pull : 8
- fullbody, fullbody-quad, fullbody-hip : 9
- glutes-hip, quad-glutes : 6

### pickExercise — ordre de tri
1. `focusedMuscles` (muscles ciblés en premier)
2. `slotPrimary` = `slot.muscles[0]` (match primaryMuscle → rank 0)
3. `usedGlobally` (non utilisé en premier)
4. `strength + compound` → `strengthEquipmentPrio` (barbell > câble > dumbbell > …)
5. `popularity` desc

### hasPullInSplit (post-fix)
`rawSplit.some(t => ['pull','back-bi','chest-back'].includes(t))`

### isGlutesSplit (post-fix)
`rawSplit.every(t => t === 'glutes-hip' || t === 'quad-glutes')`

### hasCompoundBack
`available.some(ex => ex.category === 'compound' && ['back_width','back_thickness','back'].includes(ex.primaryMuscle))`

### Slots tirage compound (pull[0] / upper-pull[0] / chest-back[1])
`{ muscles: ['back_width', 'back_thickness'], compound: true }` — deadlift exclu (primaryMuscle='back' ∉ liste)

### Slots isolation dos (pull[2] / back-bi[3] / chest-back[5])
`{ muscles: ['back_thickness', 'back_width', 'back'], compound: false }` — slotPrimary = 'back_thickness'

---

---

## PROFILS À AUDITER (30 profils)

**Convention :** Simuler la génération du programme et vérifier chaque assertion.  
Format : `✅ PASS`, `❌ FAIL [attendu vs observé]`, `⚠️ RÉSERVE [non-bloquant]`.

---

### GROUPE A — FULLBODY × ÉQUIPEMENT (12 profils)

---

#### A01 — Fullbody × BW, hypertrophy, 2j, 60min, beginner ⭐ P1.1

```
goal='hypertrophy', level='beginner', daysPerWeek=2, duration=60
equipment=['bodyweight'], splitPreference='fullbody'
```

**Split attendu :** `['fullbody-quad','fullbody-hip']`  
**adjustedSlotCount :** 9 slots chaque  
**SEED-BW-NOBACK attendu :** OUI

**Assertions — fullbody-quad :**
1. Warning SEED-BW-NOBACK présent
2. slot[0] = bw-squat (quads rank 0, pop 3, beginner top-1)
3. slot[1] = seed-pushup (chest rank 0, pop 2, beginner top-1)
4. slot[2] = VIDE + warning "Aucun exercice composé disponible pour dos"
5. slot[3] = bw-pike-pushup (shoulders, pop 1, seul candidat)
6. slot[4] = VIDE (aucune isolation hamstrings BW)
7. slot[5] = VIDE (aucune isolation shoulders_rear BW)
8. slot[6] = VIDE (aucune isolation biceps BW)
9. slot[7] = bw-calf-raise (pop 2)
10. slot[8] = VIDE (aucune isolation triceps BW)
11. Séance effective : 4 exercices réels

**Assertions — fullbody-hip :**
12. slot[0] = **seed-good-morning-bw** (hamstrings, pop 1, slotPrimary='hamstrings' rank 0 → prime sur seed-hip-thrust-bw glutes rank 1) ⚠️ DÉCOUVERTE — seed-hip-thrust-bw N'EST PAS dans fullbody-hip
13. slot[1] = seed-pushup (chest compound ← slot[1] est CHEST, pas glutes)
14. slot[2] = VIDE + warning dos
15. slot[3] = bw-pike-pushup
16. slot[4] = bw-sissy-squat (quads isolation, pop 3, seul candidat) ✅ FIXÉ R3
17. slot[5] = VIDE
18. slot[6] = VIDE
19. slot[7] = bw-calf-raise

---

#### A02 — Fullbody × BW, strength, 3j, 60min, intermediate → INC-1 ⭐ P1.1

```
goal='strength', level='intermediate', daysPerWeek=3, duration=60
equipment=['bodyweight'], splitPreference=undefined
```

**INC-1 attendu :** OUI → split `['fullbody-quad','fullbody-hip','fullbody-quad']`  
**adjustedSlotCount :** max(4,⌊9×0.5⌋) = **4 slots**

**Assertions :**
1. INC-1 déclenché, split = ['fullbody-quad','fullbody-hip','fullbody-quad']
2. SEED-BW-NOBACK présent
3. adjustedSlotCount = 4
4. fullbody-quad : slot[0]=bw-squat, slot[1]=seed-pushup, slot[2]=VIDE+warning, slot[3]=bw-pike-pushup → 3 exercices effectifs
5. fullbody-hip : slot[0]=**seed-good-morning-bw**, slot[1]=seed-pushup, slot[2]=VIDE+warning, slot[3]=bw-pike-pushup → 3 exercices effectifs (⚠️ DÉCOUVERTE : slotPrimary='hamstrings' → good-morning-bw, pas hip-thrust-bw)

---

#### A03 — Fullbody × BW, fat_loss, 3j, 45min, beginner

```
goal='fat_loss', level='beginner', daysPerWeek=3, duration=45
equipment=['bodyweight'], splitPreference='fullbody'
```

**adjustedSlotCount :** max(4,⌊9×0.75⌋) = **6 slots**

**Assertions :**
1. SEED-BW-NOBACK présent
2. adjustedSlotCount = 6
3. fullbody-quad slots 0–5 : bw-squat, seed-pushup, VIDE+warning, bw-pike-pushup, VIDE, VIDE → 3 exercices effectifs
4. fullbody-hip slots 0–5 : **seed-good-morning-bw**, seed-pushup, VIDE+warning, bw-pike-pushup, bw-sissy-squat, VIDE → 4 exercices effectifs ✅ FIXÉ R3 (⚠️ DÉCOUVERTE : slot[0] slotPrimary='hamstrings' → good-morning-bw, pas hip-thrust-bw)

---

#### A04 — Fullbody × DB+BW, hypertrophy, 3j, 60min, beginner ⭐ P1.3a CRITIQUE

```
goal='hypertrophy', level='beginner', daysPerWeek=3, duration=60
equipment=['dumbbell','bodyweight'], splitPreference='fullbody'
```

**Split attendu :** `['fullbody-quad','fullbody-hip','fullbody-quad']`  
**SEED-BW-NOBACK attendu :** NON (seed-row-dumbbell = compound back)  
**adjustedSlotCount :** 9 slots

**Assertions — fullbody-quad :**
1. Pas de warning SEED-BW-NOBACK
2. slot[0] = bw-squat (BW, pop 3 > seed-lunges DB pop 2, beginner top-1)
3. slot[1] = seed-bench-dumbbell (chest, DB, pop 3 > seed-pushup pop 2, beginner top-1)
4. slot[2] = seed-row-dumbbell (back_thickness, DB, pop 3) — SEUL compound back en DB+BW (seed-pullover = isolation post-fix v9)
5. slot[3] = seed-shoulder-press-dumbbell (DB, pop 3, beginner top-1)
6. slot[4] = **dumbbell-rdl** (fallback compound — aucune isolation hamstrings en DB+BW → le générateur tombe en fallback sur les compounds ; dumbbell-rdl sélectionné → devient usedGlobally) ⚠️ DÉCOUVERTE
7. slot[5] = seed-rear-delt-fly (DB, pop 2, seul candidat shoulders_rear DB)
8. slot[6] = seed-curl-dumbbell (DB, pop 3, beginner top-1)
9. slot[7] = seed-calf-raise-db (DB, pop 2)
10. slot[8] = vérifier isolation triceps DB disponible (seed-triceps-kickback ou équivalent)

**Assertions — fullbody-hip :**
11. slot[0] = **seed-good-morning-bw** (hamstrings, BW, pop 1 — dumbbell-rdl usedGlobally via fullbody-quad slot[4] fallback → seul hamstrings compound non usé) ⚠️ DÉCOUVERTE
12. slot[1] = seed-bench-dumbbell (pop 3)
13. slot[2] = seed-row-dumbbell — seul compound back (usedGlobally potentiel)
14. slot[3] = seed-shoulder-press-dumbbell
15. slot[4] = bw-sissy-squat (quads, BW, pop 3, seul isolation quads sans machine) ✅ FIXÉ R3
16. slot[5] = seed-lateral-raise (shoulders_lateral, DB, pop 3, slotPrimary=shoulders_lateral rank 0)
17. slot[6] = seed-curl-dumbbell ou seed-curl-hammer (aléatoire, pop 3 tie)
18. slot[7] = seed-calf-raise-db

---

#### A05 — Fullbody × DB+BW, strength, 3j, 60min, intermediate → INC-1 ⭐ P1.3b CRITIQUE

```
goal='strength', level='intermediate', daysPerWeek=3, duration=60
equipment=['dumbbell','bodyweight'], splitPreference=undefined
```

**INC-1 attendu :** OUI  
**adjustedSlotCount :** max(4,⌊9×0.5⌋) = **4 slots**

**Assertions :**
1. INC-1 déclenché
2. Pas de SEED-BW-NOBACK (hasCompoundBack=true)
3. adjustedSlotCount = 4
4. fullbody-quad slot[2] = seed-row-dumbbell ✅ (inclus dans les 4 premiers → slot dos couvert même en strength)
5. fullbody-hip slot[2] = seed-row-dumbbell (usedGlobally mais seul compound back → sélectionné quand même)
6. fullbody-hip slot[0] = dumbbell-rdl (slotPrimary=hamstrings rank 0)

---

#### A06 — Fullbody × DB+BW, fat_loss, 2j, 45min, beginner

```
goal='fat_loss', level='beginner', daysPerWeek=2, duration=45
equipment=['dumbbell','bodyweight'], splitPreference='fullbody'
```

**adjustedSlotCount :** max(4,⌊9×0.75⌋) = **6 slots**

**Assertions :**
1. Pas de SEED-BW-NOBACK
2. adjustedSlotCount = 6
3. fullbody-quad slot[2] = seed-row-dumbbell (inclus dans les 6 premiers ✅)
4. fullbody-hip slot[4] = bw-sissy-squat (inclus dans les 6 premiers ✅ FIXÉ R3)
5. fullbody-hip slot[5] = seed-lateral-raise (inclus dans les 6 premiers ✅)

---

#### A07 — Fullbody × KB+DB+BW, hypertrophy, 3j, 60min, intermediate ⭐ P2.1

```
goal='hypertrophy', level='intermediate', daysPerWeek=3, duration=60
equipment=['kettlebell','dumbbell','bodyweight'], splitPreference='fullbody'
```

**adjustedSlotCount :** 9 slots

**Assertions — fullbody-quad :**
1. slot[0] = seed-goblet-squat (KB, pop 3) OU bw-squat (BW, pop 3) — tie → aléatoire intermediate top-3
2. slot[1] = seed-bench-dumbbell (DB, pop 3) — pas de bench KB
3. slot[2] = seed-row-dumbbell (DB, pop 3) > kb-row (KB, pop 2) — seed-row-dumbbell gagne sur pop
4. slot[3] = seed-shoulder-press-dumbbell (DB, pop 3) OU kb-press (KB, pop 2) — aléatoire top-3
5. slot[4] = VIDE (aucune isolation hamstrings en KB+DB+BW)
6. slot[6] = seed-curl-dumbbell (DB, pop 3) > kb-curl (KB, pop 1)
7. slot[7] = seed-calf-raise-db (DB, pop 2) > kb-calf-raise (KB, pop 1)

**Assertions — fullbody-hip :**
8. slot[0] = kb-rdl (KB, pop 2) OU dumbbell-rdl (DB, pop 2) — tie → aléatoire intermediate
9. slot[4] = bw-sissy-squat ✅ FIXÉ R3 (seul isolation quads sans machine)

---

#### A08 — Fullbody × KB+DB+BW, fat_loss, 4j, 60min, intermediate

```
goal='fat_loss', level='intermediate', daysPerWeek=4, duration=60
equipment=['kettlebell','dumbbell','bodyweight'], splitPreference='fullbody'
```

**Assertions :**
1. Split = ['fullbody-quad','fullbody-hip','fullbody-quad','fullbody-hip'] (4j alternés)
2. adjustedSlotCount = 9
3. slot[2] dos : seed-row-dumbbell OU kb-deadlift — kb-deadlift a `primaryMuscle='back'` → candidat valide pour les slots dos compound `['back_width','back_thickness','back']` ; alternance possible via anti-répétition inter-séances ⚠️ DÉCOUVERTE
4. Pas de SEED-BW-NOBACK

---

#### A09 — Fullbody × Salle complète, hypertrophy, 3j, 60min, intermediate (non-INC-1)

```
goal='hypertrophy', level='intermediate', daysPerWeek=3, duration=60
equipment=['barbell','dumbbell','cable','pullup_bar','machine'], splitPreference='fullbody'
```

**INC-1 attendu :** NON (splitPreference explicite)  
**adjustedSlotCount :** 9 slots

**Assertions — fullbody-quad :**
1. slot[0] = seed-squat-barbell (pop 8, slotPrimary=quads rank 0, toujours top-3)
2. slot[1] = seed-bench-barbell (pop 8)
3. slot[2] = seed-pullup (pop 3) OU seed-lat-pulldown (pop 3) — tie → aléatoire intermediate
4. slot[3] = seed-ohp-barbell (pop 3) — intermediate top-3 (> seed-ohp-dumbbell pop 2)
5. slot[4] = seed-leg-curl-lying (machine, pop 3) ✅ — disponible en salle (vs VIDE en BW/DB)
6. slot[6] = seed-curl-barbell (pop 3) ou autre curl pop 3 — aléatoire
7. slot[8] = isolation triceps (inclus car adjustedSlotCount=9)

**Assertions — fullbody-hip :**
8. slot[0] = seed-romanian-deadlift (hamstrings, barbell, pop 3, slotPrimary=hamstrings rank 0)
9. slot[4] = seed-leg-extension (machine, pop 3) ✅ — vs bw-wall-sit en DB+BW

---

#### A10 — Fullbody × Salle, hypertrophy, 4j, 60min, intermediate

```
goal='hypertrophy', level='intermediate', daysPerWeek=4, duration=60
equipment=['barbell','dumbbell','cable','pullup_bar','machine'], splitPreference='fullbody'
```

**Assertions :**
1. Split = 4 séances fullbody alternées quad/hip
2. adjustedSlotCount = 9
3. slot[2] rempli dans chaque séance (salle = compound back toujours dispo)
4. Exercices dos variés entre séances (usedGlobally → alternance pullup/lat-pulldown)

---

#### A11 — Fullbody × Salle, strength, 4j, 90min, advanced

```
goal='strength', level='advanced', daysPerWeek=4, duration=90
equipment=['barbell','dumbbell','cable','pullup_bar','machine'], splitPreference='fullbody'
```

**adjustedSlotCount :** min(9,5) = **5 slots**

**Assertions :**
1. adjustedSlotCount = 5 pour fullbody-quad et fullbody-hip
2. fullbody-quad slots 0–4 : squat, bench, dos compound, ohp, hamstrings isolation (leg-curl) ✅
3. fullbody-hip slots 0–4 : rdl, bench, dos compound, ohp, quads isolation (leg-extension) ✅
4. slot[2] rempli dans les 2 types ✅

---

#### A12 — Fullbody × Salle, fat_loss, 5j, 60min, beginner

```
goal='fat_loss', level='beginner', daysPerWeek=5, duration=60
equipment=['barbell','dumbbell','cable','pullup_bar','machine'], splitPreference='fullbody'
```

**Assertions :**
1. Split = 5 séances fullbody alternées
2. adjustedSlotCount = 9
3. Pas de SEED-BW-NOBACK
4. Tous les slots isolation remplis (machine disponible → pas de VIDE pour hamstrings, biceps, calves)

---

### GROUPE B — GLUTES+DOS × ÉQUIPEMENT (12 profils)

---

#### B01 — Glutes+dos × BW, fat_loss, 3j, 60min, intermediate ⭐ P1.2 CRITIQUE

```
goal='fat_loss', level='intermediate', daysPerWeek=3, duration=60
equipment=['bodyweight'], splitPreference='glutes-focus'
```

**Split attendu :** `['glutes-hip','quad-glutes','glutes-hip']`  
**SEED-BW-NOBACK attendu :** NON (splitPreference='glutes-focus' prime)  
**Warning slot VIDE attendu :** OUI (slot[3] glutes-hip, slot[2] quad-glutes — mécanisme indépendant)  
**adjustedSlotCount :** 8 slots

**Assertions — glutes-hip :**
1. Pas de warning SEED-BW-NOBACK ✅
2. Warning "Aucun exercice composé disponible pour dos (largeur)" émis pour slot[3] ⚠️ indépendant
3. slot[0] = seed-hip-thrust-bw (glutes, BW, pop 3, slotPrimary=glutes rank 0)
4. slot[1] = seed-good-morning-bw (hamstrings, BW, pop 1, slotPrimary=hamstrings rank 0) ✅ FIXÉ R1
5. slot[2] = bw-squat (quads, BW, pop 3, slotPrimary=quads rank 0)
6. slot[3] = VIDE + warning (aucun compound back_width/back_thickness BW)
7. slot[4] = seed-glute-bridge (BW, pop 3)
8. slot[5] = VIDE (aucune isolation hamstrings BW)
9. slot[6] = seed-donkey-kick (pop 2) ou seed-fire-hydrant (pop 2) — aléatoire
10. slot[7] = VIDE (aucune isolation back_thickness BW)

**Assertions — quad-glutes :**
11. adjustedSlotCount = 8
12. slot[0] = bw-squat (quads, pop 3, slotPrimary=quads rank 0)
13. slot[1] = seed-hip-thrust-bw (glutes, pop 3)
14. slot[2] = VIDE + warning (aucun compound back_thickness BW)
15. slot[3] = bw-sissy-squat (quads, pop 3, seul isolation quads BW) ✅ FIXÉ R3
16. slot[4] = seed-glute-bridge (pop 3)
17. slot[5] = VIDE (hamstrings)
18. slot[6] = bw-calf-raise (pop 2)
19. slot[7] = VIDE (aucune isolation back_width BW — seed-pullover = dumbbell)

---

#### B02 — Glutes+dos × BW, hypertrophy, 4j, 60min, beginner

```
goal='hypertrophy', level='beginner', daysPerWeek=4, duration=60
equipment=['bodyweight'], splitPreference='glutes-focus'
```

**Assertions :**
1. Split = ['glutes-hip','quad-glutes','glutes-hip','quad-glutes']
2. Pas de SEED-BW-NOBACK ✅
3. slot[1] glutes-hip = seed-good-morning-bw (hamstrings, BW, pop 1, seul compound hamstrings BW) ✅ FIXÉ R1
4. slot[3] glutes-hip = VIDE + warning dos
5. slot[2] quad-glutes = VIDE + warning dos

---

#### B03 — Glutes+dos × BW, strength, 3j, 90min, intermediate → 5 slots

```
goal='strength', level='intermediate', daysPerWeek=3, duration=90
equipment=['bodyweight'], splitPreference='glutes-focus'
```

**adjustedSlotCount :** min(8,5) = **5 slots**

**Assertions :**
1. adjustedSlotCount = 5
2. Glutes-hip slots 0–4 : slot[3] (dos compound) = VIDE + warning (inclus dans les 5 premiers ✅)
3. Quad-glutes slots 0–4 : slot[2] (dos compound) = VIDE + warning (inclus dans les 5 premiers ✅)
4. Pas de SEED-BW-NOBACK ✅

---

#### B04 — Glutes+dos × DB+BW, fat_loss, 4j, 60min, intermediate ⭐ P1.4 CRITIQUE

```
goal='fat_loss', level='intermediate', daysPerWeek=4, duration=60
equipment=['dumbbell','bodyweight'], splitPreference='glutes-focus'
```

**adjustedSlotCount :** 8 slots  
**hasCompoundBack :** OUI (seed-row-dumbbell)

**Assertions — glutes-hip :**
1. Pas de SEED-BW-NOBACK ✅
2. slot[0] = seed-hip-thrust-bw (glutes, BW, pop 3) — > dumbbell-rdl (hamstrings, rank 1)
3. slot[1] = dumbbell-rdl (hamstrings, DB, pop 2, slotPrimary=hamstrings rank 0, seed-hip-thrust-bw usedGlobally)
4. slot[2] = seed-lunges (DB,2) ou bw-lunge (BW,2) ou seed-bulgarian-split-squat (DB,2) — tie → aléatoire intermediate
5. slot[3] = seed-row-dumbbell (back_thickness, DB, pop 3) — seul compound back DB, slotPrimary=back_width non matché (rank 1) mais seul candidat ✅
6. slot[4] = seed-glute-bridge (BW, pop 3) ou seed-donkey-kick (pop 2)
7. slot[5] = VIDE (aucune isolation hamstrings DB+BW)
8. slot[6] = seed-donkey-kick (pop 2) ou seed-fire-hydrant (pop 2)
9. slot[7] = seed-pullover-dumbbell (back_thickness, DB, pop 3, slotPrimary=back_thickness rank 0) ✅

**Assertions — quad-glutes :**
10. slot[0] = bw-squat (quads, BW, pop 3 > seed-lunges DB pop 2)
11. slot[1] = seed-hip-thrust-bw (glutes, BW, pop 3, slotPrimary=glutes rank 0)
12. slot[2] = seed-row-dumbbell (back_thickness, DB, pop 3, slotPrimary=back_thickness rank 0 ✅)
13. slot[3] = bw-sissy-squat (quads, BW, pop 3, seul isolation quads sans machine) ✅ FIXÉ R3
14. slot[4] = seed-glute-bridge (BW, pop 3)
15. slot[5] = VIDE (hamstrings)
16. slot[6] = seed-calf-raise-db (DB, pop 2)
17. slot[7] = seed-pullover (back_width, DB, isolation, pop 1) — slotPrimary=back_width ∈ ['back_width','back'] ✅

---

#### B05 — Glutes+dos × DB+BW, hypertrophy, 3j, 60min, beginner

```
goal='hypertrophy', level='beginner', daysPerWeek=3, duration=60
equipment=['dumbbell','bodyweight'], splitPreference='glutes-focus'
```

**Assertions :**
1. Pas de SEED-BW-NOBACK ✅
2. slot[3] glutes-hip = seed-row-dumbbell (beginner top-1, seul compound dos DB)
3. slot[7] glutes-hip = seed-pullover-dumbbell (back_thickness, pop 3, slotPrimary=back_thickness rank 0)
4. slot[7] quad-glutes = seed-pullover (back_width, DB, isolation, pop 1, seul candidat isolation back_width DB)

---

#### B06 — Glutes+dos × DB+BW, strength, 4j, 60min, intermediate → 4 slots ⭐ P2.4

```
goal='strength', level='intermediate', daysPerWeek=4, duration=60
equipment=['dumbbell','bodyweight'], splitPreference='glutes-focus'
```

**adjustedSlotCount :** max(4,⌊8×0.5⌋) = **4 slots**

**Assertions :**
1. adjustedSlotCount = 4
2. Glutes-hip slots 0–3 : slot[3] = seed-row-dumbbell ✅ (compound dos inclus dans les 4 premiers)
3. Quad-glutes slots 0–3 : slot[2] = seed-row-dumbbell ✅ (compound dos inclus dans les 4 premiers)
4. Pas de SEED-BW-NOBACK ✅

---

#### B07 — Glutes+dos × KB+DB+BW, fat_loss, 4j, 60min, intermediate ⭐ P2.2

```
goal='fat_loss', level='intermediate', daysPerWeek=4, duration=60
equipment=['kettlebell','dumbbell','bodyweight'], splitPreference='glutes-focus'
```

**Assertions — glutes-hip :**
1. slot[0] = kb-swing (glutes, KB, pop 3) OU seed-hip-thrust-bw (BW, pop 3) — tie → aléatoire intermediate
2. slot[1] = kb-rdl (hamstrings, KB, pop 2) OU dumbbell-rdl (DB, pop 2) — tie → aléatoire
3. slot[2] = seed-goblet-squat (KB, pop 3) OU bw-squat (BW, pop 3) — tie → aléatoire
4. slot[3] = seed-row-dumbbell (DB, pop 3) > kb-row (KB, pop 2) sur popularité ✅
5. slot[7] = seed-pullover-dumbbell (DB, pop 3) > kb-pullover (KB, back_width, pop 1) ✅

**Assertions — quad-glutes :**
6. slot[2] = seed-row-dumbbell (back_thickness, DB, pop 3, slotPrimary=back_thickness rank 0 ✅)

---

#### B08 — Glutes+dos × KB+DB+BW, hypertrophy, 3j, 45min, beginner

```
goal='hypertrophy', level='beginner', daysPerWeek=3, duration=45
equipment=['kettlebell','dumbbell','bodyweight'], splitPreference='glutes-focus'
```

**adjustedSlotCount :** max(4,⌊8×0.75⌋) = **6 slots**

**Assertions :**
1. adjustedSlotCount = 6
2. Glutes-hip slots 0–5 : slot[3] (dos compound) inclus → seed-row-dumbbell ✅
3. Quad-glutes slots 0–5 : slot[2] (dos compound) inclus → **kb-row** (seed-row-dumbbell usedGlobally depuis glutes-hip slot[3] → anti-répétition sélectionne kb-row) ⚠️ DÉCOUVERTE
4. slot[0] glutes-hip = kb-swing ou seed-hip-thrust-bw (beginner top-1 → premier du tri)

---

#### B09 — Glutes+dos × Salle complète, fat_loss, 4j, 60min, intermediate

```
goal='fat_loss', level='intermediate', daysPerWeek=4, duration=60
equipment=['barbell','dumbbell','cable','pullup_bar','machine'], splitPreference='glutes-focus'
```

**adjustedSlotCount :** 8 slots

**Assertions — glutes-hip :**
1. slot[0] = seed-hip-thrust (barbell, pop 4, slotPrimary=glutes rank 0)
2. slot[1] = seed-romanian-deadlift (hamstrings, barbell, pop 3, slotPrimary=hamstrings rank 0)
3. slot[2] = seed-squat-barbell (quads, pop 8, slotPrimary=quads rank 0)
4. slot[3] = seed-lat-pulldown (cable, pop 3) OU seed-pullup (pullup_bar, pop 3) — aléatoire intermediate
5. slot[5] = seed-leg-curl-lying (machine, pop 3) ✅ — disponible en salle (vs VIDE en BW/DB)
6. slot[7] = seed-pullover-dumbbell (pop 3) OU seed-pullover-cable (pop 2) OU machine-pullover (pop 2) — top-3 aléatoire

**Assertions — quad-glutes :**
7. slot[2] = seed-row-barbell (back_thickness, barbell, pop 7, slotPrimary=back_thickness rank 0) ✅

---

#### B10 — Glutes+dos × Salle, hypertrophy, 3j, 60min, advanced

```
goal='hypertrophy', level='advanced', daysPerWeek=3, duration=60
equipment=['barbell','dumbbell','cable','pullup_bar','machine'], splitPreference='glutes-focus'
```

**Assertions :**
1. slot[5] glutes-hip = seed-leg-curl-lying (machine, pop 3) ✅
2. slot[7] glutes-hip = parmi top-3 variantes pullover (aléatoire advanced)
3. slot[2] quad-glutes = seed-row-barbell (pop 7) ✅

---

#### B12 — Glutes+dos × Salle, fat_loss, 3j, 45min, beginner

```
goal='fat_loss', level='beginner', daysPerWeek=3, duration=45
equipment=['barbell','dumbbell','cable','pullup_bar','machine'], splitPreference='glutes-focus'
```

**adjustedSlotCount :** max(4,⌊8×0.75⌋) = **6 slots**

**Assertions :**
1. adjustedSlotCount = 6
2. Glutes-hip slots 0–5 : slot[3] dos compound inclus ✅, slot[5] hamstrings isolation = seed-leg-curl-lying ✅
3. Quad-glutes slots 0–5 : slot[2] dos compound inclus ✅, slot[3] quads isolation = seed-leg-extension ✅ (machine disponible)

---

### GROUPE C — CAS SPÉCIAUX (6 profils)

---

#### C01 — focusMuscles=['glutes','back'] × Salle+cable → 'pull' ⭐ P1.5 CRITIQUE

```
goal='hypertrophy', level='intermediate', daysPerWeek=3, duration=60
equipment=['barbell','dumbbell','cable']
focusMuscles=['glutes','back'], splitPreference=undefined
```

**Comportement attendu :**  
`workoutTypeFromFocus(['glutes','back'])` → hasPull=true vérifié AVANT hasGlutes → **'pull'**  
Split = `['pull','upper-pull','pull']` (ou similaire pull-based, 3j)

**Assertions :**
1. workoutTypeFromFocus(['glutes','back']) = 'pull' ← confirmer explicitement
2. Split produit est pull-based, AUCUNE séance glutes-hip ou quad-glutes
3. Warning UX-6 émis ✅ FIXÉ R2 (commit 1fcef7f) — message "Focus dos + fessiers : la combinaison génère un programme de tirage…"
4. Séances 'pull' générées correctement avec barbell+dumbbell+cable
5. focusMuscles=['glutes'] n'est PAS dans le split → l'utilisateur ne reçoit pas ce qu'il demande, mais le warning UX l'en informe désormais ✅ FIXÉ R2

---

#### C02 — focusMuscles=['glutes','back'] × DB+BW, fat_loss, 3j, 60min, beginner

```
goal='fat_loss', level='beginner', daysPerWeek=3, duration=60
equipment=['dumbbell','bodyweight']
focusMuscles=['glutes','back']
```

**Assertions :**
1. workoutTypeFromFocus(['glutes','back']) = 'pull' → split pull-based
2. hasPullInSplit=true MAIS hasCompoundBack=**true** (seed-row-dumbbell disponible en DB+BW) → **BUG-BW-PULL NON déclenché** ⚠️ DÉCOUVERTE
3. Split final = pull (glutes+dos avec DB+BW) — seed-row-dumbbell couvre le slot dos compound ✅
4. Warning BUG-BW-PULL **NON** émis — pas de déclenchement avec DB+BW ✅

---

#### C03 — focusMuscles=['glutes'] × BW → isGlutesSplit ⭐ P3.1

```
goal='fat_loss', level='intermediate', daysPerWeek=3, duration=60
equipment=['bodyweight'], focusMuscles=['glutes'], splitPreference=undefined
```

**Assertions :**
1. workoutTypeFromFocus(['glutes']) = 'glutes-hip' ✅
2. Split = ['glutes-hip','quad-glutes','glutes-hip']
3. isGlutesSplit = true → pas de SEED-BW-NOBACK ✅
4. Warning slot VIDE "dos (largeur)" émis pour slot[3] glutes-hip ⚠️ (indépendant)
5. Warning slot VIDE "dos (épaisseur)" émis pour slot[2] quad-glutes ⚠️ (indépendant) — à confirmer
6. slot[1] glutes-hip = seed-good-morning-bw (hamstrings, BW, pop 1) ✅ FIXÉ R1

---

#### C04 — focusMuscles=['glutes'] × DB+BW, fat_loss, 3j, 60min, intermediate

```
goal='fat_loss', level='intermediate', daysPerWeek=3, duration=60
equipment=['dumbbell','bodyweight'], focusMuscles=['glutes']
```

**Assertions :**
1. workoutTypeFromFocus(['glutes']) = 'glutes-hip' → split glutes
2. isGlutesSplit = true → pas de SEED-BW-NOBACK ✅
3. hasCompoundBack = true (seed-row-dumbbell) → pas de warning dos global
4. slot[3] glutes-hip = seed-row-dumbbell ✅
5. slot[7] glutes-hip = seed-pullover-dumbbell ✅

---

#### C05 — Machine seul, fullbody, hypertrophy, 3j, 60min, intermediate → machine-biceps-curl

```
goal='hypertrophy', level='intermediate', daysPerWeek=3, duration=60
equipment=['machine'], splitPreference='fullbody'
```

**Assertions :**
1. slot[6] fullbody-quad/hip = machine-biceps-curl (biceps, machine, isolation, pop 2) ✅ (ajouté fix v9)
2. slot[2] fullbody-quad/hip = machine-lat-pulldown (back_width, machine, compound, pop 2, slotPrimary=back_width rank 0)
3. slot[5] glutes-hip (si glutes-focus machine) = machine-low-row ✅
4. slot[7] glutes-hip = machine-pullover (back_width, machine, isolation, pop 2) OU machine-low-row

---

#### C06 — Salle, glutes-focus, strength, 4j, 60min, intermediate → 4 slots + slot[3] dos inclus

```
goal='strength', level='intermediate', daysPerWeek=4, duration=60
equipment=['barbell','dumbbell','cable','pullup_bar','machine'], splitPreference='glutes-focus'
```

**adjustedSlotCount :** max(4,⌊8×0.5⌋) = **4 slots** (slots 0–3)

**Assertions :**
1. adjustedSlotCount = 4
2. Glutes-hip slots 0–3 : slot[3] = seed-lat-pulldown ou seed-pullup ✅ (compound dos inclus dans les 4 premiers)
3. Quad-glutes slots 0–3 : slot[2] = seed-row-barbell ✅
4. strengthEquipmentPrio appliqué : barbell/machine prime
5. slot[0] glutes-hip = seed-hip-thrust (barbell, pop 4) ✅

---

---

## GROUPE D — Équipements machine : couverture élargie (v8 P01–P20)

*Exercices composés machine : `machine-lat-pulldown` (back_width, compound, pop 2), `seed-row-machine` (back_thickness, compound, pop 1).*
*Exercices isolation machine (ajoutés fix v9) : `machine-pullover` (back_width, isolation, pop 2), `machine-low-row` (back_thickness, isolation, pop 2).*

## Groupe A (P01-P20) — Équipements machine : couverture élargie

### D-P02 — Machine seul, fullbody 3j fat_loss beginner *(régression v7)*
**Profil :** goal=fat_loss, days=3, duration=60, equipment=[machine], level=beginner, splitPreference=fullbody  
**Assertions :**
- fullbody[2] dos compound servi (machine-lat-pulldown) ✅

### D-P04 — Machine seul, PPL 3j **strength beginner** (fullbody attendu)
**Profil :** goal=strength, days=3, duration=60, equipment=[machine], level=beginner  
**Assertions :**
- selectSplit beginner → fullbody×3 (pas INC-1, déjà fullbody de base)
- adjustedSlotCount = max(4, ⌊9×0.5⌋) = 4 slots (strength 60min)
- fullbody[2] : machine-lat-pulldown ✅

### D-P07 — Machine seul, **90 min** hypertrophy intermediate
**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[machine], level=intermediate  
**Assertions :**
- adjustedSlotCount(pull, 90, hypertrophy) = min(8+2, 8) = **8 slots** (cap)
- pull[0] : machine-lat-pulldown ✅
- pull[1] : seed-row-machine ✅
- pull[7] isolation dos : slot vide probable (P10 v7 confirmé) → **⚠️ RÉSERVE attendue**

### D-P08 — Machine seul, **20 min strength** intermediate (INC-1 + peu de slots)
**Profil :** goal=strength, days=3, duration=20, equipment=[machine], level=intermediate  
**Assertions :**
- selectSplit → fullbody×3 (INC-1)
- adjustedSlotCount(fullbody-quad, 20, strength) = min(3, max(2, ⌊9×0.5⌋)) = min(3,4) = **3 slots**
- fullbody-quad slots 0,1,2 seulement — slot[2] dos compound : machine-lat-pulldown ✅

### D-P09 — Machine seul, **45 min strength** intermediate
**Profil :** goal=strength, days=3, duration=45, equipment=[machine], level=intermediate  
**Assertions :**
- INC-1 → fullbody×3
- adjustedSlotCount(45, strength) = min(3, max(2, ⌊9×0.5⌋)) = **3 slots**
- slot[2] dos : machine-lat-pulldown ✅ (même résultat que 20min strength)

### D-P10 — Machine + pullup_bar, PPL 3j intermediate
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine, pullup_bar], level=intermediate  
**Assertions :**
- pull[0] `['back_width','back_thickness']` compound : machine-lat-pulldown (pop 2) vs seed-pullup (pop 3)
- slotPrimary=back_width → tie (les deux ont back_width=slotPrimary)
- Tri secondaire : popularité → seed-pullup (pop 3) > machine-lat-pulldown (pop 2)
- intermediate top-3 → seed-pullup probable (pop plus élevé) ✅
- machine-lat-pulldown reste dans le pool → variété possible

### D-P12 — Machine + dumbbell, PPL 3j intermediate
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine, dumbbell], level=intermediate  
**Assertions :**
- pull[0] `['back_width','back_thickness']` : machine-lat-pulldown (back_width, pop 2) vs seed-pullover (back_width, pop 1)
- slotPrimary tie → popularité : machine-lat-pulldown (pop 2) > seed-pullover (pop 1)
- machine-lat-pulldown probable en slot[0] ✅
- seed-pullover accessible via pool intermediate top-3

### D-P13 — Machine seul, brosplit 5j advanced
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[machine], level=advanced, splitPreference=brosplit  
**Assertions :**
- back-bi[0] : machine-lat-pulldown ✅
- back-bi[1] : seed-row-machine ✅
- back-bi[3] isolation dos : aucun exercice machine isolation dos dans le seed → slot vide possible **⚠️**
- Confirmer si le générateur émet un avertissement ou laisse silencieusement

### D-P14 — Machine seul, Arnold 5j intermediate
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[machine], level=intermediate, splitPreference=arnold  
**Assertions :**
- chest-back[1] : machine-lat-pulldown (back_width slotPrimary) ✅
- chest-back[4] isolation dos : vide probable ⚠️

### D-P15 — Machine seul, glutes-focus 3j intermediate
**Profil :** goal=fat_loss, days=3, duration=60, equipment=[machine], level=intermediate, splitPreference=glutes-focus  
**Assertions :**
- split : `['glutes-hip','quad-glutes','glutes-hip']`
- glutes-hip[3] : machine-lat-pulldown ✅
- SEED-BW-NOBACK : splitPreference='glutes-focus' → exception → **NON émis** ✅

### D-P16 — Machine seul, **focusMuscles=['back']** 3j intermediate
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine], level=intermediate, focusMuscles=['back']  
**Assertions :**
- workoutTypeFromFocus(['back']) → 'pull' → split=['pull','upper-pull','pull']
- pull[0] : machine-lat-pulldown ✅
- upper-pull[0] : machine-lat-pulldown (mais usedGlobally) ou seed-row-machine selon pool

### D-P17 — Machine seul, **focusMuscles=['back','legs']** 3j intermediate
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine], level=intermediate, focusMuscles=['back','legs']  
**Assertions :**
- workoutTypeFromFocus(['back','legs']) → 'lower_pull'
- split = `['lower_pull','lower_pull','lower_pull']`
- lower_pull[1] `['back_width','back_thickness']` : machine-lat-pulldown ✅

### D-P18 — Machine seul, **fat_loss 2j** beginner
**Profil :** goal=fat_loss, days=2, duration=60, equipment=[machine], level=beginner  
**Assertions :**
- split : `['fullbody-quad','fullbody-hip']`
- fullbody-quad[2] et fullbody-hip[2] : machine-lat-pulldown ✅

### D-P19 — Machine + barbell, PPL 3j intermediate *(conflit machine vs barbell pour dos)*
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine, barbell], level=intermediate  
**Assertions :**
- pull[0] `['back_width','back_thickness']` :
  - machine-lat-pulldown (back_width, pop 2) vs seed-row-barbell (back_thickness, pop 7)
  - slotPrimary=back_width → machine-lat-pulldown (aP=0) > seed-row-barbell (aP=1) → machine-lat-pulldown priorisé malgré pop plus faible
- pull[1] `['back_thickness','back']` : seed-row-barbell (back_thickness, pop 7) probable

### D-P20 — Machine seul, **6j hypertrophy advanced** (si supporté, sinon 5j)
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[machine], level=advanced, splitPreference=auto  
**Assertions :**
- 5j auto advanced hypertrophy → `['push','pull','lower-quad','upper','lower-hip']`
- pull[0] : machine-lat-pulldown ✅
- upper[1] `['back_width','back_thickness','back']` : machine-lat-pulldown ou seed-row-machine ✅

---

## Groupe B (P21-P40) — Pullover compound + Slots deadlift : couverture élargie

### D-P22 — DB seul, **strength 3j beginner** (INC-1 + pullover fullbody)
**Profil :** goal=strength, days=3, duration=60, equipment=[dumbbell], level=beginner  
**Assertions :**
- selectSplit beginner → fullbody×3
- adjustedSlotCount(60, strength) = max(4, ⌊9×0.5⌋) = 4 slots
- fullbody[2] compound dos : seed-pullover (back_width slotPrimary) probable ✅

### D-P23 — DB seul, **fat_loss 4j intermediate**
**Profil :** goal=fat_loss, days=4, duration=60, equipment=[dumbbell], level=intermediate  
**Assertions :**
- selectSplit 4j fat_loss intermediate → `['push','pull','lower-quad','upper']` ou similaire
- pull[0] : seed-pullover ✅
- hasCompoundBack = true → pas de remplacement BUG-BW-PULL

### D-P24 — DB seul, **20 min strength intermediate** (peu de slots)
**Profil :** goal=strength, days=3, duration=20, equipment=[dumbbell], level=intermediate  
**Assertions :**
- INC-1 → fullbody×3
- adjustedSlotCount(20, strength) = min(3, max(2, ⌊9×0.5⌋)) = **3 slots**
- slot[2] compound dos : seed-pullover (slotPrimary back_width) ou seed-row-dumbbell ✅

### D-P25 — DB seul, **45 min hypertrophy beginner** (fullbody)
**Profil :** goal=hypertrophy, days=3, duration=45, equipment=[dumbbell], level=beginner  
**Assertions :**
- beginner → fullbody×3
- adjustedSlotCount(45, hypertrophy) = max(4, ⌊9×0.75⌋) = max(4,6) = **6 slots**
- fullbody[2] compound dos : seed-pullover (beginner top-1, slotPrimary) ✅

### D-P26 — DB seul, **90 min hypertrophy intermediate** (8 slots)
**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[dumbbell], level=intermediate  
**Assertions :**
- pull séance avec 8 slots
- pull[0] : seed-pullover ✅
- pull[1] : seed-row-dumbbell ✅
- pull[3] isolation dos `['back_thickness','back_width','back'] compound:false` :
  - seed-pullover usedInWorkout → exclu
  - seed-row-dumbbell usedInWorkout → exclu
  - seed-pullover-dumbbell (back_thickness, dumbbell, isolation, pop 3) → candidat ✅
  - seed-shrug (back, dumbbell, isolation, pop 2) → candidat

### D-P27 — DB seul, **back-bi brosplit advanced**
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[dumbbell], level=advanced, splitPreference=brosplit  
**Assertions :**
- back-bi[0] : seed-pullover (back_width) ✅
- back-bi[1] : seed-row-dumbbell (back_thickness) ✅
- back-bi[3] isolation : seed-pullover-dumbbell ou seed-shrug ✅

### D-P28 — Barbell seul, **20 min hypertrophy intermediate**
**Profil :** goal=hypertrophy, days=3, duration=20, equipment=[barbell], level=intermediate  
**Assertions :**
- adjustedSlotCount(pull, 20, hypertrophy) = max(2, ⌊8×0.5⌋) = **4 slots**
- pull[0] : seed-deadlift EXCLU, seed-row-barbell (back_thickness) ou seed-row-tbar ✅
- pull[1] `['back_thickness','back']` : seed-deadlift (back ∈ liste) candidat ✅

### D-P29 — Barbell seul, **45 min strength intermediate** (INC-1)
**Profil :** goal=strength, days=3, duration=45, equipment=[barbell], level=intermediate  
**Assertions :**
- INC-1 → fullbody×3
- adjustedSlotCount(45, strength) = min(3, max(2, ⌊9×0.5⌋)) = **3 slots**
- fullbody[2] `['back_width','back_thickness','back']` : seed-deadlift ENCORE CANDIDAT (slot inchangé)
- seed-row-barbell (back_thickness, pop 7) probable (slotPrimary=back_width → tie → pop) ✅

### D-P30 — Barbell seul, **90 min hypertrophy intermediate**
**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[barbell], level=intermediate  
**Assertions :**
- pull[0] : seed-deadlift EXCLU (slot modifié) → seed-row-barbell ✅
- pull[1] `['back_thickness','back']` : seed-row-tbar ou seed-deadlift ✅
- pull slots bonus 90min : vérifier que les slots isolation dos (back) acceptent seed-deadlift ✅

### D-P31 — KB seul, **PPL 3j fat_loss intermediate**
**Profil :** goal=fat_loss, days=3, duration=60, equipment=[kettlebell], level=intermediate  
**Assertions :**
- hasCompoundBack = true (kb-row back_thickness compound)
- pull[0] `['back_width','back_thickness']` : kb-deadlift EXCLU (back ∉ liste) → kb-row (back_thickness) ✅
- pull[1] `['back_thickness','back']` : kb-row (usedInWorkout) probable exclu → kb-deadlift (back) candidat ✅

### D-P32 — KB seul, **strength 4j intermediate**
**Profil :** goal=strength, days=4, duration=60, equipment=[kettlebell], level=intermediate, splitPreference=upper-lower  
**Assertions :**
- upper-pull[0] : kb-deadlift EXCLU (back ∉ ['back_width','back_thickness']) → kb-row ✅
- adjustedSlotCount(upper-pull, 60, strength) = max(4, ⌊8×0.5⌋) = **4 slots**

### D-P33 — DB + pullup_bar, **PPL 3j intermediate** *(pullover vs pullup compétition)*
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell, pullup_bar], level=intermediate  
**Assertions :**
- pull[0] `['back_width','back_thickness']` :
  - seed-pullover (back_width, dumbbell, compound, pop 1)
  - seed-pullup (back_width, pullup_bar, compound, pop 3)
  - slotPrimary tie → popularité : seed-pullup (pop 3) > seed-pullover (pop 1)
  - intermediate top-3 → seed-pullup probable ✅

### D-P34 — Barbell + dumbbell, **PPL 3j advanced** *(deadlift exclu, pullover priorisé)*
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell, dumbbell], level=advanced  
**Assertions :**
- pull[0] `['back_width','back_thickness']` :
  - seed-deadlift (back) → EXCLU ✅
  - seed-pullover (back_width, pop 1) → slotPrimary=back_width → aP=0
  - seed-row-barbell (back_thickness, pop 7) → slotPrimary → aP=1
  - seed-pullover priorisé malgré pop faible (slotPrimary prime) ⚠️ RÉSERVE

### D-P35 — Barbell + cable, **PPL 3j intermediate**
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell, cable], level=intermediate  
**Assertions :**
- pull[0] `['back_width','back_thickness']` :
  - seed-lat-pulldown (back_width, cable, pop 3) → slotPrimary=back_width → aP=0
  - seed-row-barbell (back_thickness, pop 7) → aP=1
  - seed-lat-pulldown priorisé (slotPrimary) ✅
  - seed-deadlift EXCLU ✅

### D-P36 — Salle complète, **PPL 3j advanced** (régression globale)
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable,machine,bodyweight,pullup_bar], level=advanced  
**Assertions :**
- pull[0] : seed-pullup (pop 3) ou seed-lat-pulldown (pop 3) — tie → aléatoire (advanced top-5) ✅
- seed-deadlift EXCLU de pull[0] ✅
- split PPL inchangé (hasCompoundBack=true) ✅

### D-P37 — DB seul, **lower_pull 3j intermediate** *(pullover dans tirage vertical lower_pull)*
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell], level=intermediate, focusMuscles=['back','legs']  
**Assertions :**
- lower_pull[1] : seed-pullover (back_width, slotPrimary) ✅

### D-P39 — KB + band, **fullbody 3j intermediate** *(band-row vs kb-row)*
**Profil :** goal=fat_loss, days=3, duration=60, equipment=[kettlebell, band], level=intermediate, splitPreference=fullbody  
**Assertions :**
- hasCompoundBack = true (band-row ET kb-row)
- fullbody[2] `['back_width','back_thickness','back']` :
  - kb-row (back_thickness, pop 2) → aP=1
  - band-row (back_thickness, pop 2) → aP=1
  - Tie complet → aléatoire ✅

### D-P40 — DB + band, **PPL 3j intermediate** *(pullover + band-row : 3 candidats pour 2 slots)*
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell, band], level=intermediate  
**Assertions :**
- pull[0] `['back_width','back_thickness']` : seed-pullover (back_width, pop 1, slotPrimary) ✅
- pull[1] `['back_thickness','back']` : seed-row-dumbbell (pop 3) ou band-row (pop 2)
- seed-row-dumbbell probable (pop plus élevé) ✅

---

## Groupe C (P41-P60) — BW interactions + warnings : couverture élargie

### D-P44 — BW seul, 2j fullbody beginner → SEED-BW-NOBACK *(régression v7 P28)*
**Profil :** goal=hypertrophy, days=2, duration=60, equipment=[bodyweight], level=beginner  
**Assertions :**
- SEED-BW-NOBACK émis ✅

### D-P45 — BW + pullup_bar, fullbody 3j beginner → aucun warning *(régression v7 P29)*
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight, pullup_bar], level=beginner  
**Assertions :**
- hasCompoundBack=true → aucun warning dos ✅

### D-P46 — BW + band, fullbody 3j intermediate → aucun warning *(régression v7 P30)*
**Profil :** goal=fat_loss, days=3, duration=60, equipment=[bodyweight, band], level=intermediate  
**Assertions :**
- hasCompoundBack=true (band-row compound) → aucun warning dos ✅

### D-P48 — BW seul, glutes-focus 4j → **PAS** de SEED-BW-NOBACK *(régression v7 P32, fix c64cba7)*
**Profil :** goal=fat_loss, days=4, duration=60, equipment=[bodyweight], level=intermediate, splitPreference=glutes-focus  
**Assertions :**
- splitPreference='glutes-focus' → exception dans la condition → SEED-BW-NOBACK **NON émis** ✅

### D-P50 — BW seul, **strength 3j beginner**
**Profil :** goal=strength, days=3, duration=60, equipment=[bodyweight], level=beginner  
**Assertions :**
- selectSplit beginner → fullbody×3 (indépendamment de INC-1)
- SEED-BW-NOBACK émis (hasCompoundBack=false, hasPullInSplit=false) ✅

### D-P51 — BW + cable, **PPL 3j intermediate** *(câble donne compound dos)*
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight, cable], level=intermediate  
**Assertions :**
- hasCompoundBack : seed-lat-pulldown (back_width, cable, compound) → **true** ✅
- hasPullInSplit=true → BUG-BW-PULL non déclenché
- SEED-BW-NOBACK : hasCompoundBack=true → non émis ✅
- split inchangé ['push','pull','legs']
- pull[0] : seed-lat-pulldown (back_width, pop 3) ✅

### D-P52 — BW + machine, **fullbody 3j intermediate** *(machine donne compound dos)*
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight, machine], level=intermediate  
**Assertions :**
- hasCompoundBack : machine-lat-pulldown (back_width, machine, compound) → **true** ✅
- SEED-BW-NOBACK non émis ✅
- BUG-BW-PULL non déclenché (hasCompoundBack=true) ✅
- fullbody[2] : machine-lat-pulldown (back_width, slotPrimary) ✅

### D-P53 — BW + dumbbell, **PPL 3j intermediate** *(pullover donne compound dos)*
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight, dumbbell], level=intermediate  
**Assertions :**
- hasCompoundBack : seed-pullover (back_width, dumbbell, compound) → **true** ✅
- split PPL inchangé (hasCompoundBack=true) ✅
- pull[0] : seed-pullover (back_width, slotPrimary) ✅

### D-P54 — BW seul, **brosplit 5j intermediate** *(back-bi sans compound dos → warning?)*
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[bodyweight], level=intermediate, splitPreference=brosplit  
**Assertions :**
- hasCompoundBack=false (BW seul)
- rawSplit brosplit = ['chest-tri','back-bi','legs','shoulders-arms','upper']
- hasPullInSplit : 'back-bi' !== 'pull' (vérification stricte) → **false** ?
  - Ou 'back-bi'.includes('back') → à vérifier dans le code
  - IMPORTANT : vérifier si `hasPullInSplit` cherche uniquement le type 'pull' exact ou une famille
- Si hasPullInSplit=false → SEED-BW-NOBACK émis
- Si hasPullInSplit=true → BUG-BW-PULL déclenché (remplace back-bi par fullbody?)
- **Cas critique : quelle est la valeur de hasPullInSplit pour 'back-bi' ?**

### D-P55 — BW seul, **4j fat_loss intermediate** (split non-PPL, pas de 'pull' exact)
**Profil :** goal=fat_loss, days=4, duration=60, equipment=[bodyweight], level=intermediate  
**Assertions :**
- selectSplit 4j fat_loss intermediate → à vérifier dans le code (ex. upper-lower?)
- hasPullInSplit dépend du split → identifier le comportement
- hasCompoundBack=false → warning dos selon split

### D-P56 — BW seul, **5j hypertrophy advanced**
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[bodyweight], level=advanced  
**Assertions :**
- selectSplit 5j hypertrophy advanced → ['push','pull','lower-quad','upper','lower-hip']
- hasPullInSplit=true ('pull' présent) → BUG-BW-PULL déclenché ✅
- SEED-BW-NOBACK non émis ✅

### D-P57 — BW + barbell, **PPL 3j intermediate**
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight, barbell], level=intermediate  
**Assertions :**
- hasCompoundBack : seed-row-barbell (back_thickness, compound) → **true** ✅
- BUG-BW-PULL non déclenché ✅
- SEED-BW-NOBACK non émis ✅
- pull[0] : seed-deadlift EXCLU → seed-row-barbell (back_thickness, pop 7) ✅

### D-P59 — BW seul, **focusMuscles=['core']** 3j intermediate
**Profil :** goal=fat_loss, days=3, duration=60, equipment=[bodyweight], level=intermediate, focusMuscles=['core']  
**Assertions :**
- workoutTypeFromFocus(['core']) → 'fullbody-quad' ou null (à vérifier dans le code)
- hasPullInSplit=false probable → SEED-BW-NOBACK selon hasCompoundBack
- hasCompoundBack=false → SEED-BW-NOBACK émis probable

### D-P60 — BW + pullup_bar, **strength 4j intermediate** (upper-lower)
**Profil :** goal=strength, days=4, duration=60, equipment=[bodyweight, pullup_bar], level=intermediate, splitPreference=upper-lower  
**Assertions :**
- hasCompoundBack=true (seed-pullup) → aucun warning dos ✅
- upper-pull[0] : seed-pullup (back_width, pullup_bar, compound, pop 3) ✅
- adjustedSlotCount(upper-pull, 60, strength) = max(4, ⌊8×0.5⌋) = **4 slots**

---

## Groupe D (P61-P80) — Duration × Slots : matrice complète

*Ce groupe valide systématiquement la formule adjustedSlotCount sur différents types de séance, goals et durées.*

### Références des slots de base (base = nombre de slots à 60min)
| Type | base |
|------|------|
| pull | 8 |
| upper-pull | 8 |
| push | 8 |
| upper-push | 8 |
| upper | 9 |
| fullbody-quad | 9 |
| fullbody-hip | 9 |
| legs | 8 |
| lower-quad | 8 |
| lower-hip | 8 |
| glutes-hip | 8 |
| quad-glutes | 8 |
| back-bi | 8 |
| chest-back | 9 |

### D-P61 — **push 20min hypertrophy** intermediate
**Profil :** goal=hypertrophy, days=3, duration=20, equipment=[barbell,dumbbell,cable], level=intermediate  
**Assertions :**
- adjustedSlotCount(push, 20, hypertrophy) = max(2, ⌊8×0.5⌋) = max(2,4) = **4 slots**
- Séance push avec 4 slots seulement (base=8 → réduit à 4)
- Exercices 0-3 seulement (compter les slots dans SLOTS['push'])

### D-P62 — **push 45min hypertrophy** intermediate
**Profil :** goal=hypertrophy, days=3, duration=45, equipment=[barbell,dumbbell,cable], level=intermediate  
**Assertions :**
- adjustedSlotCount(push, 45, hypertrophy) = max(4, ⌊8×0.75⌋) = max(4,6) = **6 slots**

### D-P63 — **push 90min hypertrophy** intermediate
**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[barbell,dumbbell,cable], level=intermediate  
**Assertions :**
- adjustedSlotCount(push, 90, hypertrophy) = min(8+2, 8) = **8 slots** (cap à base)

### D-P64 — **legs 20min hypertrophy** intermediate
**Profil :** goal=hypertrophy, days=3, duration=20, equipment=[barbell,dumbbell,cable,machine], level=intermediate  
**Assertions :**
- adjustedSlotCount(legs, 20, hypertrophy) = max(2, ⌊8×0.5⌋) = **4 slots**
- Vérifier les 4 premiers slots de SLOTS['legs'] : compound quad, compound hip, isolation ×2

### D-P65 — **legs 90min hypertrophy** intermediate
**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[barbell,dumbbell,cable,machine], level=intermediate  
**Assertions :**
- adjustedSlotCount(legs, 90, hypertrophy) = min(8+2, 8) = **8 slots**

### D-P66 — **upper 20min strength** intermediate
**Profil :** goal=strength, days=4, duration=20, equipment=[barbell,dumbbell,cable,machine], level=intermediate, splitPreference=upper-lower  
**Assertions :**
- adjustedSlotCount(upper, 20, strength) = min(3, max(2, ⌊9×0.5⌋)) = min(3,4) = **3 slots**
- Séance upper très courte : seulement 3 exercices

### D-P67 — **upper 45min strength** intermediate
**Profil :** goal=strength, days=4, duration=45, equipment=[barbell,dumbbell,cable,machine], level=intermediate, splitPreference=upper-lower  
**Assertions :**
- adjustedSlotCount(upper, 45, strength) = min(3, max(2, ⌊9×0.5⌋)) = **3 slots**
- Même résultat que 20min strength (le cap min(3,...) est le déterminant)

### D-P68 — **upper 60min strength** intermediate
**Profil :** goal=strength, days=4, duration=60, equipment=[barbell,dumbbell,cable,machine], level=intermediate, splitPreference=upper-lower  
**Assertions :**
- adjustedSlotCount(upper, 60, strength) = max(4, ⌊9×0.5⌋) = max(4,4) = **4 slots**
- Différent de 45min strength (3 → 4 slots à 60min)

### D-P69 — **upper 90min strength** intermediate
**Profil :** goal=strength, days=4, duration=90, equipment=[barbell,dumbbell,cable,machine], level=intermediate, splitPreference=upper-lower  
**Assertions :**
- adjustedSlotCount(upper, 90, strength) = min(9,5) = **5 slots**

### D-P70 — **fullbody 20min strength** intermediate (INC-1)
**Profil :** goal=strength, days=3, duration=20, equipment=[barbell,dumbbell,cable,machine], level=intermediate  
**Assertions :**
- INC-1 → fullbody×3
- adjustedSlotCount(fullbody-quad, 20, strength) = min(3, max(2, ⌊9×0.5⌋)) = **3 slots**
- Séance fullbody avec seulement 3 exercices : slot[0] compound quad, slot[1] compound hip, slot[2] compound dos

### D-P71 — **fullbody 90min hypertrophy** beginner
**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[barbell,dumbbell,cable,machine,pullup_bar], level=beginner  
**Assertions :**
- beginner → fullbody×3
- adjustedSlotCount(fullbody-quad, 90, hypertrophy) = min(9+2, 8) = **8 slots** (cap)
- Séance fullbody très longue avec 8 exercices
- slot[2] dos : seed-pullup ou seed-lat-pulldown (back_width, pop 3) ✅

### D-P72 — **back-bi 20min hypertrophy** intermediate (brosplit)
**Profil :** goal=hypertrophy, days=5, duration=20, equipment=[barbell,dumbbell,cable,machine,pullup_bar], level=intermediate, splitPreference=brosplit  
**Assertions :**
- adjustedSlotCount(back-bi, 20, hypertrophy) = max(2, ⌊8×0.5⌋) = **4 slots**
- back-bi[0] compound dos (tirage vertical) ✅
- back-bi[1] compound dos (rowing) ✅

### D-P73 — **chest-back 20min strength** intermediate (Arnold)
**Profil :** goal=strength, days=5, duration=20, equipment=[barbell,dumbbell,cable,machine,pullup_bar], level=intermediate, splitPreference=arnold  
**Assertions :**
- adjustedSlotCount(chest-back, 20, strength) = min(3, max(2, ⌊9×0.5⌋)) = **3 slots**
- chest-back[0] compound poitrine, chest-back[1] compound dos, chest-back[2] compound combo
- 3 exercices seulement dans cette séance poitrine+dos

### D-P74 — **lower-quad 20min fat_loss** intermediate
**Profil :** goal=fat_loss, days=4, duration=20, equipment=[barbell,dumbbell,cable,machine], level=intermediate, splitPreference=upper-lower  
**Assertions :**
- adjustedSlotCount(lower-quad, 20, fat_loss) = max(2, ⌊8×0.5⌋) = **4 slots**

### D-P75 — **lower-quad 90min fat_loss** intermediate
**Profil :** goal=fat_loss, days=4, duration=90, equipment=[barbell,dumbbell,cable,machine], level=intermediate, splitPreference=upper-lower  
**Assertions :**
- adjustedSlotCount(lower-quad, 90, fat_loss) = min(8+2, 8) = **8 slots**

### D-P76 — **glutes-hip 20min fat_loss** intermediate (glutes-focus)
**Profil :** goal=fat_loss, days=4, duration=20, equipment=[dumbbell,machine], level=intermediate, splitPreference=glutes-focus  
**Assertions :**
- adjustedSlotCount(glutes-hip, 20, fat_loss) = max(2, ⌊8×0.5⌋) = **4 slots**
- glutes-hip slots 0-3 seulement (pas de slot[3] dos compound dans les 4 premiers)
- IMPORTANT : glutes-hip[3] est-il dans les 4 premiers slots ? (index 3 = 4e slot, inclus ✅)
- slot[3] `['back_width','back_thickness']` : machine-lat-pulldown ✅

### D-P77 — **glutes-hip 45min fat_loss** intermediate (glutes-focus)
**Profil :** goal=fat_loss, days=4, duration=45, equipment=[dumbbell,machine], level=intermediate, splitPreference=glutes-focus  
**Assertions :**
- adjustedSlotCount(glutes-hip, 45, fat_loss) = max(4, ⌊8×0.75⌋) = **6 slots**
- glutes-hip[3] dos compound inclus ✅

### D-P78 — **pull 20min fat_loss intermediate** (PPF BW → BUG-BW-PULL)
**Profil :** goal=fat_loss, days=3, duration=20, equipment=[barbell,dumbbell,cable], level=intermediate  
**Assertions :**
- split PPF : ['push','pull','fullbody-quad']
- adjustedSlotCount(pull, 20, fat_loss) = max(2, ⌊8×0.5⌋) = **4 slots**
- pull[0] dos compound ✅, pull[1] ✅, pull[3] isolation éventuel

### D-P79 — **upper-pull 45min hypertrophy** intermediate
**Profil :** goal=hypertrophy, days=4, duration=45, equipment=[barbell,dumbbell,cable,machine,pullup_bar], level=intermediate, splitPreference=upper-lower  
**Assertions :**
- adjustedSlotCount(upper-pull, 45, hypertrophy) = max(4, ⌊8×0.75⌋) = **6 slots**
- upper-pull[0] dos compound ✅, upper-pull[1] ✅

### D-P80 — **2j 90min hypertrophy** beginner (maximum par séance)
**Profil :** goal=hypertrophy, days=2, duration=90, equipment=[barbell,dumbbell,cable,machine,pullup_bar], level=beginner  
**Assertions :**
- split fullbody : ['fullbody-quad','fullbody-hip']
- adjustedSlotCount(fullbody, 90, hypertrophy) = min(9+2, 8) = **8 slots**
- beginner top-1 → exercices les plus populaires sélectionnés ✅

---

## Groupe E (P81-P100) — FocusMuscles, split selection, UX warnings

### D-P84 — focusMuscles=['legs'] 3j intermediate
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable,machine], level=intermediate  
**Assertions :**
- workoutTypeFromFocus(['legs']) → 'lower'
- selectSplit : alterner `['lower-quad','lower-hip','lower-quad']` ✅

### D-P85 — focusMuscles=['core'] 3j intermediate
**Profil :** goal=fat_loss, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate  
**Assertions :**
- workoutTypeFromFocus(['core']) → à déterminer (core seul → fullbody? null?)
- Si null → split par défaut PPL ou PPF

### D-P86 — focusMuscles=['glutes'] 3j intermediate *(régression fix P36)*
**Profil :** goal=fat_loss, days=3, duration=60, equipment=[dumbbell,machine], level=intermediate  
**Assertions :**
- workoutTypeFromFocus(['glutes']) → 'glutes-hip'
- split : `['glutes-hip','quad-glutes','glutes-hip']` *(fix P36 confirmé)* ✅

### D-P87 — focusMuscles=['glutes'] 4j intermediate
**Profil :** goal=fat_loss, days=4, duration=60, equipment=[dumbbell,machine], level=intermediate  
**Assertions :**
- split : `['glutes-hip','quad-glutes','glutes-hip','quad-glutes']` ✅ (alternance sur 4j)

### D-P88 — focusMuscles=['glutes'] 5j intermediate
**Profil :** goal=fat_loss, days=5, duration=60, equipment=[dumbbell,machine], level=intermediate  
**Assertions :**
- split : `['glutes-hip','quad-glutes','glutes-hip','quad-glutes','glutes-hip']` ✅

### D-P89 — focusMuscles=['glutes'] 2j intermediate
**Profil :** goal=fat_loss, days=2, duration=60, equipment=[dumbbell,machine], level=intermediate  
**Assertions :**
- split : `['glutes-hip','quad-glutes']` ✅

### D-P90 — focusMuscles=['chest','back'] 3j intermediate (haut mixte)
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate  
**Assertions :**
- workoutTypeFromFocus(['chest','back']) → 'upper' (hasPush=true, hasPull=true)
- split 3j upper : PPU `['push','pull','upper']` (level≠beginner) ✅

### D-P91 — focusMuscles=['back','arms'] 3j intermediate
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate  
**Assertions :**
- workoutTypeFromFocus(['back','arms']) → 'pull' (hasPull=true, arms → pas hasUpper seul)
- split 3j pull : `['pull','upper-pull','pull']` ✅

### D-P92 — **UX-B warning** : focusMuscles=['arms'] en push split
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate, focusMuscles=['arms']  
**Assertions :**
- split PPU : ['push','upper-push','push']
- UX-B : `split.every(t => t === 'push' || t === 'upper-push') && focusMuscles.some(f => f === 'arms' || f === 'shoulders')` = **true** → warning UX-B émis ✅
- "Focus bras en push : le biceps n'est pas ciblé en séance push..."

### D-P93 — **UX-B warning** : focusMuscles=['shoulders'] en push split
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate, focusMuscles=['shoulders']  
**Assertions :**
- split PPU (shoulders → push) → `['push','upper-push','push']`
- UX-B : focusMuscles.some(f => f === 'arms' || f === 'shoulders') = **true** → warning émis ✅

### D-P94 — **UX-B absent** : focusMuscles=['chest'] en push (pas d'arms/shoulders)
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate, focusMuscles=['chest']  
**Assertions :**
- split push
- UX-B : focusMuscles.some(f => f === 'arms' || f === 'shoulders') = **false** → UX-B NON émis ✅

### D-P95 — **splitPreference=brosplit** 5j intermediate salle complète (régression)
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[barbell,dumbbell,cable,machine,bodyweight,pullup_bar], level=intermediate  
**Assertions :**
- split brosplit : ['chest-tri','back-bi','legs','shoulders-arms','upper']
- back-bi[0] compound dos ✅ (tirage vertical non vide)
- seed-deadlift EXCLU de back-bi[0] ✅

### D-P96 — **splitPreference=arnold** 5j intermediate salle complète (régression)
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[barbell,dumbbell,cable,machine,bodyweight,pullup_bar], level=intermediate  
**Assertions :**
- chest-back[1] compound dos ✅
- seed-deadlift EXCLU ✅

### D-P97 — **totalWeeks=4** (programme court) intermediate hypertrophy
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate, totalWeeks=4  
**Assertions :**
- Programme de 4 semaines au lieu du défaut (8 semaines intermediate?)
- Phases buildPhases(4) : adapter selon le code
- Phase deload si totalWeeks≥4 : nom='Récup.' *(fix INC-4-RÉSIDUEL confirmé)*

### D-P98 — **totalWeeks=12** avec phase deload vérifiée
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate, totalWeeks=12  
**Assertions :**
- buildPhases(12) → phases incluent une phase deload
- Phase deload : `name='Récup.'` *(fix INC-4-RÉSIDUEL : aligne avec PHASE_NAME_FR.deload)* ✅
- Phase deload : `focus='deload'` ✅

### D-P99 — **selectedDays** impact — 3j non consécutifs
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate, selectedDays=[1,3,5] (lun/mer/ven)  
**Assertions :**
- Programme généré avec 3 jours espacés
- Split PPL respecté (push lun, pull mer, legs ven) ✅
- Aucun impact sur la sélection d'exercices vs sans selectedDays

### D-P100 — **Profil complet** : toutes les options combinées
**Profil :** goal=hypertrophy, days=4, duration=45, equipment=[dumbbell,machine,pullup_bar], level=advanced, focusMuscles=['back','legs'], selectedDays=[2,4,6,7], totalWeeks=8  
**Assertions :**
- workoutTypeFromFocus(['back','legs']) → 'lower_pull'
- split 4j lower_pull : `['lower_pull','lower_pull','lower_pull','lower_pull']` (type fixe, pas d'alternance pour lower_pull)
- adjustedSlotCount(lower_pull, 45, hypertrophy) = max(4, ⌊8×0.75⌋) = **6 slots**
- lower_pull[1] `['back_width','back_thickness']` : seed-pullup (back_width, pullup_bar, pop 3) probable
- Programme 8 semaines, phase deload name='Récup.' ✅
- Aucun warning dos (hasCompoundBack=true via seed-pullup) ✅

---

---

## GROUPE E — Fixes v9 : machine isolation + pullover + BUG-BW-PULL élargi + isGlutesSplit (v9 P01–P30)

## GROUPE A — Fix 1 : machine isolation back (P01-P10)

Tous les profils machine-only. Exercices composés machine : `machine-lat-pulldown` (back_width, compound, pop 2) et `seed-row-machine` (back_thickness, compound, pop 1). Exercices isolation machine : `machine-pullover` (back_width, isolation, pop 2) et `machine-low-row` (back_thickness, isolation, pop 2).

### G-V9-P01 — Machine · PPL 45min hypertrophy intermediate (ex-P06)
**Profil :** goal=hypertrophy, days=3, duration=45, equipment=[machine], level=intermediate  
**Split :** PPL → ['push','pull','legs']  
**Slots pull 45min :** max(4, ⌊8×0.75⌋) = max(4,6) = **6 slots**  
**Assertions :**
- pull[0] `['back_width','back_thickness'] compound:true` → `machine-lat-pulldown` (back_width, slotPrimary) ✅
- pull[1] `['back_thickness','back'] compound:true` → `seed-row-machine` ✅
- pull[2] `['back_thickness','back_width','back'] compound:false isolation` → slotPrimary=back_thickness → **`machine-low-row` sélectionné** (pop 2, machine, isolation, back_thickness) ✅
- pull[3] `['biceps'] compound:false` → exercice biceps machine ou BW ✅
- pull[4] `['shoulders_rear'] compound:false` → face pull machine ✅
- pull[5] `['forearms'] compound:false` → rien ou passe (pas d'exo machine forearms) ✅
- **Aucun slot isolation dos vide** ← c'était le problème de P06 ✅

### G-V9-P02 — Machine · PPL 90min hypertrophy advanced (ex-P07)
**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[machine], level=advanced  
**Slots pull 90min :** min(8+2,8) = **8 slots**  
**Assertions :**
- pull[0] machine-lat-pulldown ✅
- pull[1] seed-row-machine ✅
- pull[2] isolation dos → **machine-low-row** (slotPrimary back_thickness) ✅
- pull[3] biceps ✅
- pull[4] shoulders_rear ✅
- pull[5] forearms ✅
- pull[6] biceps ✅ (slot 7 — curl marteau)
- pull[7] `['back_width','back'] compound:false` → **machine-pullover** (back_width, isolation, pop 2) — slot 8 tirage bras tendus ✅
- **Tous les slots remplis (ou ignorés si pas d'exo dispo pour forearms)** ✅

### G-V9-P03 — Machine · Brosplit back-bi 45min advanced (ex-P13)
**Profil :** goal=hypertrophy, days=5, duration=45, equipment=[machine], level=advanced, splitPreference=brosplit  
**Split :** ['chest-tri','back-bi','legs','shoulders-arms','upper']  
**Slots back-bi 45min :** max(4, ⌊8×0.75⌋) = **6 slots**  
**Assertions :**
- back-bi[0] `['back_width','back_thickness'] compound:true` → machine-lat-pulldown (slotPrimary back_width) ✅
- back-bi[1] `['back_thickness','back'] compound:true` → seed-row-machine ✅
- back-bi[2] `['biceps'] compound:false` → biceps machine (curl machine) ✅
- back-bi[3] `['back_thickness','back_width','back'] compound:false` → slotPrimary=back_thickness → **machine-low-row** ✅
- back-bi[4] `['biceps'] compound:false` → 2e biceps machine ✅
- back-bi[5] → si slot existe : isolation dos ou biceps
- **back-bi[3] isolation dos rempli** ← c'était le problème de P13 ✅

### G-V9-P04 — Machine · Arnold chest-back 45min intermediate (ex-P14)
**Profil :** goal=hypertrophy, days=5, duration=45, equipment=[machine], level=intermediate, splitPreference=arnold  
**Split Arnold :** ['chest-shoulders','back-bi','legs','shoulders-chest','back-bi'] ou équivalent  
**Slots chest-back 45min :** max(4, ⌊8×0.75⌋) = **6 slots**  
**Assertions pour séance chest-back :**
- chest-back[0] `['chest','chest_upper'] compound:true` → pec deck ou machine chest ✅
- chest-back[1] `['back_width','back_thickness'] compound:true` → machine-lat-pulldown ✅
- chest-back[2] `['shoulders','shoulders_front'] compound:true` → shoulder press machine ✅
- chest-back[3] `['back_thickness','back'] compound:true` → seed-row-machine ✅
- chest-back[4] `['chest','chest_lower','chest_upper'] compound:false` → pec deck / fly machine ✅
- chest-back[5] `['back_thickness','back_width','back'] compound:false` → **machine-low-row** ✅
- **chest-back[5] isolation dos rempli** ← c'était le problème de P14 ✅

### G-V9-P05 — Machine · PPL 20min hypertrophy intermediate
**Profil :** goal=hypertrophy, days=3, duration=20, equipment=[machine], level=intermediate  
**Slots pull 20min :** max(2, ⌊8×0.5⌋) = max(2,4) = **4 slots**  
**Assertions :**
- pull[0] machine-lat-pulldown ✅
- pull[1] seed-row-machine ✅
- pull[2] machine-low-row ✅
- pull[3] biceps machine ✅
- **4 slots pull — aucun vide** ✅

### G-V9-P06 — Machine · PPL 60min hypertrophy intermediate
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine], level=intermediate  
**Slots pull 60min :** base=8, 60min autres → **8 slots**  
**Assertions :**
- pull[0-1] composés ✅
- pull[2] machine-low-row ✅
- pull[7] machine-pullover (slot 8 : back_width isolation) ✅
- **Aucun slot isolation dos vide** ✅

### G-V9-P07 — Machine · Brosplit back-bi 20min intermediate
**Profil :** goal=hypertrophy, days=5, duration=20, equipment=[machine], level=intermediate, splitPreference=brosplit  
**Slots back-bi 20min :** max(2, ⌊8×0.5⌋) = **4 slots**  
**Assertions :**
- back-bi[0] machine-lat-pulldown, back-bi[1] seed-row-machine ✅
- back-bi[2] biceps machine ✅
- back-bi[3] machine-low-row ✅
- **4 slots — aucun vide** ✅

### G-V9-P08 — Machine · Back-bi 90min advanced (régression 8 slots)
**Profil :** goal=hypertrophy, days=5, duration=90, equipment=[machine], level=advanced, splitPreference=brosplit  
**Slots back-bi 90min :** min(8+2,8) = **8 slots**  
**Assertions :**
- back-bi[0] machine-lat-pulldown ✅
- back-bi[1] seed-row-machine ✅
- back-bi[2] biceps ✅
- back-bi[3] machine-low-row (back_thickness isolation) ✅
- back-bi[4] biceps ✅
- back-bi[5] biceps (si slot existe) ✅
- back-bi[6] biceps ✅
- back-bi[7] machine-pullover (back_width isolation, slot 8) — si slot existe pour back-bi ✅
- **≥ 2 slots isolation dos remplis** ✅

### G-V9-P09 — Machine + pullup_bar · PPL 45min (régression — pas de régression pullup)
**Profil :** goal=hypertrophy, days=3, duration=45, equipment=[machine, pullup_bar], level=intermediate  
**Assertions :**
- pull[0] `['back_width','back_thickness'] compound:true` : candidats = machine-lat-pulldown (back_width, pop 2), seed-pullup (back_width, pop 3), seed-row-machine (back_thickness, pop 1) → slotPrimary=back_width → tie back_width : machine-lat-pulldown (pop 2) vs seed-pullup (pop 3) → **seed-pullup prime** (pop 3 > pop 2) ✅
- pull[2] isolation dos : machine-low-row (machine, pop 2) ✅
- **Régression pullup_bar non impactée** ✅

### G-V9-P10 — Machine · Strength INC-1 fullbody 60min (régression — no isolation dos)
**Profil :** goal=strength, days=3, duration=60, equipment=[machine], level=intermediate  
**INC-1 (strength ≥60min ≤3j) → fullbody×3**  
**Slots fullbody 60min strength :** max(4, ⌊9×0.5⌋) = max(4,4) = **4 slots**  
**fullbody slots :** [0] quads+glutes compound, [1] chest compound, [2] back compound, [3] hamstrings/glutes  
**Assertions :**
- fullbody[2] `['back_width','back_thickness','back'] compound:true` → machine-lat-pulldown (back_width, slotPrimary, pop 2) ✅
- **Seuls 4 slots → pas de slot isolation** → aucun machine-low-row attendu ✅
- hasCompoundBack = true (machine-lat-pulldown) → pas de warning ✅

---

## GROUPE B — Fix 2 & 3 : seed-pullover isolation + BUG-BW-PULL élargi (P11-P22)

### G-V9-P11 — DB + barbell · PPL pull[0] → barbell-row prime (ex-P34)
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell, barbell], level=intermediate  
**Candidates pull[0] `['back_width','back_thickness'] compound:true` :**
- seed-pullover : **exclus** (maintenant isolation, filtré par `compound: true`) ✅
- seed-row-barbell : back_thickness, compound, barbell, pop 7 — **candidat**
- seed-row-dumbbell : back_thickness, compound, dumbbell, pop ?
- seed-row-tbar : back_thickness, compound, barbell, pop ? — candidat
- (seed-pullup, seed-lat-pulldown, machine-lat-pulldown : équipement non dispo)
**Sort :** slotPrimary=back_width → tous back_thickness → tous rank 1 sur slotPrimary → usedGlobally (non utilisé) → goal=hypertrophy (pas de strengthEquipmentPrio) → **popularité desc**
- seed-row-barbell pop 7 prime sur seed-row-dumbbell et seed-row-tbar
- **seed-row-barbell sélectionné en pull[0]** ✅ (était seed-pullover avant)
**Régression :** pull[2] isolation dos → seed-pullover (back_width, isolation, pop 1) devrait apparaître ici ✅

### G-V9-P12 — DB seul · PPL pull[0] → seed-row-dumbbell prime
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell], level=intermediate  
**Candidates pull[0] `['back_width','back_thickness'] compound:true` :**
- seed-pullover : **exclus** (isolation)
- seed-row-dumbbell : back_thickness, compound, dumbbell ← seul candidat compound dos dumbbell
**Assertions :**
- hasCompoundBack = seed-row-dumbbell (back_thickness, compound) → **true** ✅
- pull[0] = **seed-row-dumbbell** ✅
- pull[2] isolation dos → seed-pullover (back_width, isolation, dumbbell) — maintenant en slot isolation ✅
- **Pas de SEED-BW-NOBACK** (hasCompoundBack=true via seed-row-dumbbell) ✅

### G-V9-P13 — BW · PPL → BUG-BW-PULL (régression — comportement inchangé)
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight], level=intermediate  
**hasPullInSplit** = rawSplit PPL → 'pull' → true → **BUG-BW-PULL émis** ✅
- 'pull' → remplacé par 'fullbody-quad' ✅
- SEED-BW-NOBACK absent (hasPullInSplit=true) ✅

### G-V9-P14 — BW · Brosplit → BUG-BW-PULL élargi back-bi (ex-P54 GAP)
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[bodyweight], level=advanced, splitPreference=brosplit  
**Split brosplit :** ['chest-tri','back-bi','legs','shoulders-arms','upper']  
**hasPullInSplit** = rawSplit → 'back-bi' → `backSessionTypes.includes('back-bi')` = **true** ✅
- BUG-BW-PULL émis ✅
- 'back-bi' → remplacé par **'fullbody-quad'** ✅
- split résultant : ['chest-tri','fullbody-quad','legs','shoulders-arms','upper'] ✅
- SEED-BW-NOBACK absent (hasPullInSplit=true) ✅
- **Warning émis : "Séance(s) dos remplacée(s)..."** ✅
- **C'était le GAP P54 — maintenant corrigé** ✅

### G-V9-P15 — BW · Arnold → BUG-BW-PULL élargi chest-back (variante P54)
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[bodyweight], level=advanced, splitPreference=arnold  
**Split Arnold :** contient 'chest-back'  
**hasPullInSplit** = rawSplit → 'chest-back' → `backSessionTypes.includes('chest-back')` = **true** ✅
- BUG-BW-PULL émis ✅
- 'chest-back' → remplacé par **'push'** (différent de back-bi→fullbody-quad) ✅
- Warning émis ✅
- SEED-BW-NOBACK absent ✅

### G-V9-P16 — BW · Upper-lower 4j → SEED-BW-NOBACK (régression — comportement inchangé)
**Profil :** goal=hypertrophy, days=4, duration=60, equipment=[bodyweight], level=intermediate  
**Split :** ['upper-push','lower-quad','upper-pull','lower-hip']  
**hasPullInSplit** = 'upper-pull' → `backSessionTypes.includes('upper-pull')` = **false** (non dans la liste) ✅
- isGlutesSplit = false (upper-push, lower-quad… ≠ glutes-hip/quad-glutes) ✅
- splitPreference ≠ 'glutes-focus' ✅
- **SEED-BW-NOBACK émis** ✅ (comportement attendu, inchangé)

### G-V9-P17 — BW · Fat_loss PPF → BUG-BW-PULL ('pull' strict — régression)
**Profil :** goal=fat_loss, days=3, duration=60, equipment=[bodyweight], level=intermediate  
**Split PPF :** ['push','pull','fullbody-quad']  
**hasPullInSplit** = 'pull' → true → **BUG-BW-PULL** ✅

### G-V9-P18 — BW · Fullbody 3j → SEED-BW-NOBACK (régression inchangée)
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight], level=beginner  
**Split :** ['fullbody-quad','fullbody-hip','fullbody-quad']  
**hasPullInSplit** = false, isGlutesSplit = false, splitPreference ≠ glutes-focus ✅
- **SEED-BW-NOBACK émis** ✅

### G-V9-P19 — BW · focusMuscles=['glutes'] sans splitPreference → PAS de warning (ex-P58)
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight], level=intermediate, focusMuscles=['glutes']  
**workoutTypeFromFocus(['glutes']) → 'glutes-hip'**  
**selectSplit avec glutes-hip :** fix P36 → alternance ['glutes-hip','quad-glutes','glutes-hip']  
**rawSplit = ['glutes-hip','quad-glutes','glutes-hip']**  
**isGlutesSplit** = rawSplit.every(t => t==='glutes-hip' || t==='quad-glutes') = **true** ✅
**hasCompoundBack** (BW) = false (pas de pullup, pas de barre, pas de dumbbell)  
**hasPullInSplit** = false  
**Condition SEED-BW-NOBACK :** !hasCompoundBack && !hasPullInSplit && splitPreference !== 'glutes-focus' && **!isGlutesSplit** = false → **WARNING SUPPRIMÉ** ✅  
**C'était le problème de P58 — maintenant corrigé** ✅

### G-V9-P20 — BW · focusMuscles=['glutes'] 4j et 5j → PAS de warning (variante P58)
**Profil 4j :** rawSplit=['glutes-hip','quad-glutes','glutes-hip','quad-glutes'] → isGlutesSplit=true → pas de warning ✅  
**Profil 5j :** rawSplit=['glutes-hip','quad-glutes','glutes-hip','quad-glutes','glutes-hip'] → isGlutesSplit=true → pas de warning ✅

### G-V9-P21 — BW + band · brosplit → hasPullInSplit via back-bi (régression)
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[bodyweight, band], level=advanced, splitPreference=brosplit  
**hasCompoundBack** = band-row (back_thickness, compound, band) → **true** → BUG-BW-PULL et SEED-BW-NOBACK absents ✅
- Split brosplit maintenu sans remplacement ✅
- back-bi[0] compound : band-row ou bw-inverted-row ✅

### G-V9-P22 — BW · 2j fullbody (régression — SEED-BW-NOBACK inchangé)
**Profil :** goal=fat_loss, days=2, duration=60, equipment=[bodyweight], level=beginner  
**Split :** ['fullbody-quad','fullbody-hip']  
**hasPullInSplit** = false, isGlutesSplit = false → **SEED-BW-NOBACK émis** ✅

---

## GROUPE C — Régressions globales et cas limites (P23-P30)

### G-V9-P23 — Salle complète · PPL 60min intermediate (régression globale)
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell, dumbbell, cable, pullup_bar, machine], level=intermediate  
**Assertions :**
- pull[0] : candidats compound back_width = seed-pullup (pop 3), seed-lat-pulldown (pop 3), machine-lat-pulldown (pop 2). machine-lat-pulldown (pop 2) arrive derrière. Tie pullup/lat-pulldown → **l'un des deux** (random parmi top-3) ✅
- seed-pullover **absent du slot compound** ✅ (maintenant isolation)
- pull[2] isolation dos : seed-pullover (back_width, isolation, dumbbell, pop 1) OU seed-pullover-dumbbell (back_thickness, isolation) OU autre isolation dos
- Deadlift exclu de pull[0] ✅
- Aucune régression ✅

### G-V9-P24 — Machine + câble · upper-lower 4j 60min (régression — slot upper-pull[0])
**Profil :** goal=hypertrophy, days=4, duration=60, equipment=[machine, cable], level=intermediate  
**Split :** ['upper-push','lower-quad','upper-pull','lower-hip']  
**Slot upper-pull[0] `['back_width','back_thickness'] compound:true` :**
- seed-lat-pulldown (cable, back_width, pop 3) → slotPrimary match → prime ✅
- machine-lat-pulldown (machine, back_width, pop 2) → slotPrimary match → pop 2 < pop 3
- **seed-lat-pulldown sélectionné** ✅
**Slot upper-pull[2] isolation dos `['back_thickness','back_width','back']` :**
- machine-low-row (machine, back_thickness, pop 2) ou seed-pullover-cable (cable, back_thickness, pop ?) ✅

### G-V9-P25 — Dumbbell · Arnold 5j 60min intermediate (régression — pullover en isolation)
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[dumbbell], level=intermediate, splitPreference=arnold  
**Séance chest-back :**
- chest-back[1] `['back_width','back_thickness'] compound:true` → seed-row-dumbbell (back_thickness, compound) — seul compound dos dumbbell ✅
- seed-pullover exclu du slot compound ✅
- chest-back[5] isolation dos → **seed-pullover** (back_width, isolation, dumbbell, pop 1) ✅
- **seed-pullover bien présent en isolation** ✅

### G-V9-P26 — Barbell · PPL 60min strength (régression — barbell-row compound)
**Profil :** goal=strength, days=3, duration=60, equipment=[barbell], level=intermediate  
**pull[0] strength :** slotPrimary=back_width → tous candidats barbell dos → back_thickness (seed-row-barbell) ≠ slotPrimary → rank 1 → usedGlobally (non utilisé) → strengthEquipmentPrio → popularité. **seed-row-barbell sélectionné** (seul compound dos barbell disponible, deadlift exclu) ✅
- seed-pullover : dumbbell non dispo → filtré ✅

### G-V9-P27 — Kettlebell · PPL 60min intermediate (régression — kb-row)
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[kettlebell], level=intermediate  
**hasPullInSplit** = rawSplit PPF ou PPL → 'pull' → BUG-BW-PULL si pas de compound dos KB
**hasCompoundBack** = kb-row (back_thickness, compound) ou kb-deadlift (back, compound) → **true** ✅
- Pas de warning BUG-BW-PULL ✅
- pull[0] = kb-row (back_thickness, compound) — seul candidat compound dos KB ✅

### G-V9-P28 — Machine · glutes-focus 3j (régression — machine-pullover en slot posture)
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine], splitPreference=glutes-focus  
**Split :** ['glutes-hip','quad-glutes','glutes-hip']  
**hasCompoundBack** = machine-lat-pulldown → true  
**Slot glutes-hip[3] `['back_width','back_thickness','back'] compound:false`** → slotPrimary=back_width → **machine-pullover** (back_width, isolation, pop 2) ✅
- SEED-BW-NOBACK absent (splitPreference='glutes-focus') ✅

### G-V9-P29 — Machine · focus back 3j (régression — slots isolation dos machine)
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine], focusMuscles=['back']  
**workoutTypeFromFocus(['back']) → 'pull' → split ['pull','upper-pull','pull']**  
**pull[2] isolation dos :** machine-low-row ✅  
**Aucun slot vide** ✅

### G-V9-P30 — BW · Brosplit arnold 5j avancé (régression combinée fix P54 + P58)
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[bodyweight], level=advanced  
**splitPreference=arnold** → Arnold contient 'chest-back'  
**hasPullInSplit** = 'chest-back' → true → BUG-BW-PULL  
- 'chest-back' → remplacé par 'push' ✅
- Warning émis ✅
- isGlutesSplit = false (chest-tri, back-bi, legs, shoulders… ≠ tout-glutes) ✅
- SEED-BW-NOBACK absent (hasPullInSplit=true) ✅

---

---

## FORMAT DE RÉPONSE

Pour chaque profil :

```
### [Code] — [Nom court]

**Split produit :** [types de séances]
**INC-1 :** OUI/NON
**adjustedSlotCount :** [valeur]
**Warnings globaux :** [liste ou aucun]

**Séance [type] (slots effectifs) :**
| Slot | Exercice sélectionné | Statut |
|------|---------------------|--------|
| [0] ... | ... | ✅/❌/⚠️ |
...

**Findings :**
- ✅ PASS : ...
- ❌ FAIL-CRITIQUE : [attendu] vs [observé]
- ❌ FAIL-MINEUR : ...
- ⚠️ RÉSERVE : ...
```

### Codes de sévérité

| Code | Signification |
|------|--------------|
| ✅ PASS | Conforme aux assertions |
| ❌ FAIL-CRITIQUE | Programme inutilisable pour ce profil |
| ❌ FAIL-MINEUR | Exercice sous-optimal mais programme fonctionnel |
| ⚠️ RÉSERVE | Sous-optimal documenté, non-bloquant |
| ℹ️ INFO | Observation neutre |

### Réserves pré-identifiées — TOUTES FIXÉES v10

| Réserve | Condition | Statut |
|---------|-----------|--------|
| RÉSERVE-1 | BW + glutes-hip + slot[1] | ✅ FIXÉ R1 — seed-good-morning-bw (commit 12cf14e) : isWarmupExercise false + seed.ts patche les users existants |
| RÉSERVE-2 | focusMuscles=['glutes','back'] | ✅ FIXÉ R2 — warning UX-6 émis (commit 1fcef7f) : hasFocusPull && hasFocusGlutes && !hasFocusLower |
| RÉSERVE-3 | DB+BW + fullbody-hip + slot[4] | ✅ FIXÉ R3 — bw-wall-sit → warmup, bw-sissy-squat ajouté (quads, weight_reps, pop 3) |

---

## SYNTHÈSE FINALE ATTENDUE

1. **Tableau de couverture mis à jour** (8 cases : fullbody/glutes×4 équipements)
2. **Liste des FAILs** par sévérité
3. **Confirmation des 3 RÉSERVES fixées** (RÉSERVE-1 ✅ commit 12cf14e, RÉSERVE-2 ✅ commit 1fcef7f, RÉSERVE-3 ✅ bw-sissy-squat)
4. **État machine-pullover, machine-low-row, machine-biceps-curl** : slots vérifiés
5. **Recommandations** si de nouveaux bugs sont détectés

---

## RÉSULTATS SUITE AUTOMATISÉE

**Commit :** `f382fed` — Suite complète 129 tests verts ✅  
**Date :** 2026-09-07  
**Fichier :** `tests/audit_v10.test.ts`

### Bilan global

| Groupe | Profils | Tests | Statut |
|--------|---------|-------|--------|
| A — Fullbody | A01–A12 (12 profils) | 57 | ✅ 57/57 |
| B — Glutes+dos | B01–B12 (12 profils) | 48 | ✅ 48/48 |
| C — Cas spéciaux | C01–C06 (6 profils) | 24 | ✅ 24/24 |
| **TOTAL** | **30 profils** | **129** | **✅ 129/129** |

### Découvertes clés (confirmées par les tests)

1. **fullbody-hip slot[0] = seed-good-morning-bw, jamais seed-hip-thrust-bw**  
   `slot.muscles=['hamstrings','glutes']`, `slotPrimary='hamstrings'`. `seed-good-morning-bw` (hamstrings, rank 0) prime sur `seed-hip-thrust-bw` (glutes, rank 1) malgré pop 3 > pop 1.  
   → Assertions A01/A02/A03 corrigées en conséquence.

2. **A04 — dumbbell-rdl sélectionné en fullbody-quad slot[4] (fallback compound)**  
   Pas d'isolation hamstrings en DB+BW → fallback sur compound → `dumbbell-rdl` usedGlobally → fullbody-hip slot[0] prend `seed-good-morning-bw`.  
   → Assertion A04-11 corrigée : `seed-good-morning-bw` (pas `dumbbell-rdl`).

3. **kb-deadlift candidat valide pour slots dos compound**  
   `kb-deadlift` a `primaryMuscle='back'`. `'back'` est dans `slot.muscles` des slots dos → il s'alterne avec `seed-row-dumbbell` et `kb-row` via anti-répétition.  
   → Assertion A08-3 corrigée pour accepter `seed-row-dumbbell` OU `kb-deadlift`.

4. **B08 — kb-row sélectionné en quad-glutes slot[2] par anti-répétition**  
   En glutes-hip, `seed-row-dumbbell` est au slot[3]. En quad-glutes (séance suivante), `seed-row-dumbbell` est usedGlobally → `kb-row` sélectionné à la place.  
   → Assertion B08-3 corrigée : `kb-row` (pas `seed-row-dumbbell`).

5. **C02 — BUG-BW-PULL NON déclenché avec DB+BW**  
   `hasCompoundBack=true` car `seed-row-dumbbell` est disponible en DB+BW → la condition `!hasCompoundBack` n'est pas satisfaite.  
   → Assertions C02-2/4 corrigées : BUG-BW-PULL **non** déclenché.

6. **bw-incline-pushup compète avec seed-pushup (BW intermédiaire)**  
   Chest compound intermediate pool : `seed-pushup` (chest, rank 0, pop 2) + `bw-incline-pushup` (chest_upper, rank 1, pop 2) → tie → top-3 aléatoire → 50/50.  
   → Tests A02/A03 BW utilisent `appearsOneOf([...pushup variants])`.

### Helpers de test (patterns clés)

```typescript
// Containment-based (pas d'index positionnel — robuste aux slots VIDE)
function inW(workout, id) { return slotIds(workout).includes(id) }
function slotIds(workout) { const all = allIds(workout); return all.slice(1, all.length - 1) }

// Probabiliste sur plusieurs tirages
function appearsInPool(params, workoutIdx, id, tries=20)
function appearsOneOf(params, workoutIdx, ids, tries=20)

// C05 machine-lat-pulldown : tries=30 et workoutIdx=-1 (cherche dans TOUS les workouts)
```