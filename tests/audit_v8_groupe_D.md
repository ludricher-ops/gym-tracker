# Audit v8 — Groupe D (P61-P80) : Matrice Duration × Slots

**Date :** 2026-09-07  
**Auditeur :** Claude Sonnet 4.6 (claude-sonnet-4-6)  
**Fichiers lus :**
- `src/utils/programGenerator.ts`
- `src/data/exercises-seed.json`
- `tests/audit_prompt_v8.md` (section Groupe D)

---

## 1. Vérification de la formule `adjustedSlotCount` (lignes 659-681)

```typescript
function adjustedSlotCount(base, duration, goal): number {
  const isStrength = goal === 'strength'
  if (duration === 20) return isStrength
    ? Math.min(3, Math.max(2, Math.floor(base * 0.5)))
    : Math.max(2, Math.floor(base * 0.5))
  if (duration === 45) return isStrength
    ? Math.min(3, Math.max(2, Math.floor(base * 0.5)))   // cap 3
    : Math.max(4, Math.floor(base * 0.75))
  if (duration === 60) return isStrength
    ? Math.max(4, Math.floor(base * 0.5))
    : base
  // 90 min
  return isStrength
    ? Math.min(base, 5)
    : Math.min(base + 2, 8)
}
```

**Correspondance avec le tableau du prompt :**

| goal | 20 min | 45 min | 60 min | 90 min |
|------|--------|--------|--------|--------|
| strength | `min(3, max(2, ⌊base×0.5⌋))` | `min(3, max(2, ⌊base×0.5⌋))` | `max(4, ⌊base×0.5⌋)` | `min(base, 5)` |
| autres | `max(2, ⌊base×0.5⌋)` | `max(4, ⌊base×0.75⌋)` | `base` | `min(base+2, 8)` |

**Verdict : la formule du code correspond exactement au tableau du prompt.** ✅

---

## 2. Bases réelles des types de séance (comptées dans le code)

> **ÉCART DÉTECTÉ** : la table de référence du prompt (section "Groupe D") liste `upper` avec base=**9**. Le code montre **8 slots** pour ce type (lignes 167-176).

| Type | Slots dans le code | Base correcte | Base dans le prompt |
|------|--------------------|--------------|---------------------|
| push | [0..7] (8 entrées) | **8** | 8 ✅ |
| pull | [0..7] | **8** | 8 ✅ |
| upper-pull | [0..7] | **8** | 8 ✅ |
| upper-push | [0..7] | **8** | 8 ✅ |
| **upper** | **[0..7] (8 entrées)** | **8** | ~~9~~ ❌ |
| fullbody-quad | [0..8] (9 entrées) | **9** | 9 ✅ |
| fullbody-hip | [0..8] | **9** | 9 ✅ |
| legs | [0..7] | **8** | 8 ✅ |
| lower-quad | [0..7] | **8** | 8 ✅ |
| lower-hip | [0..7] | **8** | 8 ✅ |
| glutes-hip | [0..7] | **8** | 8 ✅ |
| quad-glutes | [0..7] | **8** | 8 ✅ |
| back-bi | [0..7] | **8** | 8 ✅ |
| chest-back | [0..8] (9 entrées) | **9** | 9 ✅ |

L'erreur sur `upper` (9 au lieu de 8) n'affecte aucun résultat de P61-P80 par coïncidence arithmétique (voir P66-P69 ci-dessous).

---

## 3. Audit profil par profil

---

### P61 — push 20min hypertrophy intermediate ✅ PASS

**Profil :** goal=hypertrophy, days=3, duration=20, equipment=[barbell,dumbbell,cable], level=intermediate

**Split :** hypertrophy + intermediate + 3j → PPL `['push','pull','legs']` (ligne 584)

**Calcul :**
- base(push) = 8 (8 slots, indices 0-7)
- duration=20, goal=hypertrophy → `max(2, ⌊8×0.5⌋)` = `max(2, 4)` = **4**

**Assertion du prompt :** 4 slots ✅

**Slots retenus (push[0..3]) :**
- [0] `['chest','chest_upper']` compound → développé couché
- [1] `['shoulders','shoulders_front']` compound → OHP
- [2] `['chest','chest_upper','chest_lower']` isolation → fly
- [3] `['triceps']` isolation → pushdown

**Verdict : ✅ PASS**

---

### P62 — push 45min hypertrophy intermediate ✅ PASS

**Profil :** goal=hypertrophy, days=3, duration=45, equipment=[barbell,dumbbell,cable], level=intermediate

**Split :** PPL

**Calcul :**
- base(push) = 8
- duration=45, goal=hypertrophy → `max(4, ⌊8×0.75⌋)` = `max(4, 6)` = **6**

**Assertion du prompt :** 6 slots ✅

**Slots retenus (push[0..5]) :** 2 composés + 4 isolations (triceps, latéral, arrière).

**Verdict : ✅ PASS**

---

### P63 — push 90min hypertrophy intermediate ✅ PASS

**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[barbell,dumbbell,cable], level=intermediate

**Split :** PPL

**Calcul :**
- base(push) = 8
- duration=90, goal=hypertrophy → `min(8+2, 8)` = `min(10, 8)` = **8**

**Assertion du prompt :** 8 slots (cap à base) ✅

Le cap `min(base+2, 8)` est opérant car `base+2=10 > 8`. Tous les 8 slots push sont utilisés, incluant les slots bonus 90min (fly incliné + 2e triceps).

**Verdict : ✅ PASS**

---

### P64 — legs 20min hypertrophy intermediate ✅ PASS

**Profil :** goal=hypertrophy, days=3, duration=20, equipment=[barbell,dumbbell,cable,machine], level=intermediate

**Split :** PPL `['push','pull','legs']`

**Calcul :**
- base(legs) = 8
- duration=20, goal=hypertrophy → `max(2, ⌊8×0.5⌋)` = `max(2, 4)` = **4**

**Assertion du prompt :** 4 slots ✅

**Slots retenus (legs[0..3]) :**
- [0] `['quads']` compound → squat / leg press
- [1] `['hamstrings','glutes']` compound → RDL
- [2] `['quads']` isolation → leg extension
- [3] `['glutes']` isolation → hip abduction

**Verdict : ✅ PASS**

---

### P65 — legs 90min hypertrophy intermediate ✅ PASS

**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[barbell,dumbbell,cable,machine], level=intermediate

**Calcul :**
- base(legs) = 8
- duration=90, goal=hypertrophy → `min(8+2, 8)` = **8**

**Assertion du prompt :** 8 slots ✅

Tous les 8 slots legs sont utilisés, y compris les slots bonus 90min [6] (2e fessiers) et [7] (2e ischio).

**Verdict : ✅ PASS**

---

### P66 — "upper" 20min strength intermediate ⚠️ RÉSERVE

**Profil :** goal=strength, days=4, duration=20, equipment=[barbell,dumbbell,cable,machine], level=intermediate, splitPreference=upper-lower

**Split réel :** upper-lower/4j → `['upper-push','lower-quad','upper-pull','lower-hip']` (ligne 474)

> **Réserve 1 :** Le prompt parle de sessions 'upper', mais le split avec `upper-lower`/4j ne produit **aucune session de type 'upper'**. Les sessions haut du corps réelles sont **upper-push** et **upper-pull** (base=8 chacune).

> **Réserve 2 :** La table de référence du prompt liste base=9 pour 'upper'. Le code montre 8 slots (lignes 167-176). L'erreur n'affecte pas le résultat final car `⌊9×0.5⌋ = ⌊8×0.5⌋ = 4`.

**Calcul correct (sur upper-push, base=8) :**
- duration=20, goal=strength → `min(3, max(2, ⌊8×0.5⌋))` = `min(3, max(2,4))` = `min(3,4)` = **3**

**Assertion du prompt :** `min(3, max(2, ⌊9×0.5⌋)) = 3` → résultat final **identique** ✅

**Conclusion :** Le décompte final de 3 slots est correct pour les sessions upper-push et upper-pull réellement générées.

**Verdict : ⚠️ RÉSERVE** (base erronée dans le tableau de référence, type de session inexact, mais résultat final correct)

---

### P67 — "upper" 45min strength intermediate ⚠️ RÉSERVE

**Profil :** goal=strength, days=4, duration=45, equipment=[barbell,dumbbell,cable,machine], level=intermediate, splitPreference=upper-lower

**Split réel :** `['upper-push','lower-quad','upper-pull','lower-hip']` — pas de session 'upper'.

**Calcul correct (upper-push, base=8) :**
- duration=45, goal=strength → `min(3, max(2, ⌊8×0.5⌋))` = `min(3, max(2,4))` = **3**

**Assertion du prompt :** `min(3, max(2, ⌊9×0.5⌋)) = 3` → résultat identique ✅

**Note :** Pour strength, 20min et 45min donnent le même résultat (3 slots) car la formule est identique pour ces deux durées. Le prompt le souligne correctement.

**Verdict : ⚠️ RÉSERVE** (mêmes réserves que P66 — base 9 vs 8, type 'upper' absent du split — résultat final correct)

---

### P68 — "upper" 60min strength intermediate ⚠️ RÉSERVE

**Profil :** goal=strength, days=4, duration=60, equipment=[barbell,dumbbell,cable,machine], level=intermediate, splitPreference=upper-lower

**Split réel :** `['upper-push','lower-quad','upper-pull','lower-hip']` — pas de session 'upper'.

**Calcul correct (upper-push, base=8) :**
- duration=60, goal=strength → `max(4, ⌊8×0.5⌋)` = `max(4, 4)` = **4**

**Assertion du prompt :** `max(4, ⌊9×0.5⌋) = max(4,4) = 4` → résultat identique ✅

**Note importante :** 60min strength donne **4 slots** contre **3 slots** pour 20/45min. Le saut de formule (de `min(3,...)` à `max(4,...)`) est bien là — le prompt le souligne ("Différent de 45min strength"). ✅

**Verdict : ⚠️ RÉSERVE** (mêmes réserves que P66-P67, résultat final 4 correct)

---

### P69 — "upper" 90min strength intermediate ⚠️ RÉSERVE

**Profil :** goal=strength, days=4, duration=90, equipment=[barbell,dumbbell,cable,machine], level=intermediate, splitPreference=upper-lower

**Split réel :** `['upper-push','lower-quad','upper-pull','lower-hip']` — pas de session 'upper'.

**Calcul correct (upper-push, base=8) :**
- duration=90, goal=strength → `min(8, 5)` = **5**

**Assertion du prompt :** `min(9, 5) = 5` → résultat identique ✅

Note : `min(8,5) = min(9,5) = 5`. L'erreur de base (8 vs 9) ne change pas le résultat car le cap est la valeur de droite (5).

**Verdict : ⚠️ RÉSERVE** (mêmes réserves que P66-P68, résultat final 5 correct)

---

### P70 — fullbody 20min strength intermediate (INC-1) ✅ PASS

**Profil :** goal=strength, days=3, duration=20, equipment=[barbell,dumbbell,cable,machine], level=intermediate

**INC-1 :** `goal === 'strength' && level !== 'beginner'` → ligne 582 → `['fullbody-quad','fullbody-hip','fullbody-quad']` ✅

**Calcul :**
- base(fullbody-quad) = 9 (9 entrées, indices 0-8)
- duration=20, goal=strength → `min(3, max(2, ⌊9×0.5⌋))` = `min(3, max(2, 4))` = `min(3, 4)` = **3**

**Assertion du prompt :** 3 slots ✅

**Slots retenus (fullbody-quad[0..2]) :**
- [0] `['quads','glutes']` compound → squat / leg press
- [1] `['chest','chest_upper']` compound → développé couché
- [2] `['back_width','back_thickness','back']` compound → tirage vertical / rowing

Séance minimaliste fullbody "force" : 3 composés uniquement, pas d'isolation, warmup réduit à 1 série, pas d'abdo (isVeryShort=true). Cohérence temporelle : 3×(5 séries×3min repos) ≈ 18-21 min. ✅

**Verdict : ✅ PASS**

---

### P71 — fullbody 90min hypertrophy beginner ✅ PASS

**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[barbell,dumbbell,cable,machine,pullup_bar], level=beginner

**Split :** beginner/3j → `['fullbody-quad','fullbody-hip','fullbody-quad']` (ligne 588 — INC-1 ne s'applique pas, beginner)

**Calcul :**
- base(fullbody-quad) = 9
- duration=90, goal=hypertrophy → `min(9+2, 8)` = `min(11, 8)` = **8**

**Assertion du prompt :** min(9+2, 8) = 8 slots (cap) ✅

Le cap 8 est opérant (11 > 8). Les 8 premiers slots de fullbody-quad sont utilisés :
- [0..3] : 4 composés (squat, bench, tirage, OHP)
- [4..7] : 4 isolations (leg curl, face pull, biceps, mollets)
- Slot [8] (triceps) exclu — dépasserait le cap.

**slot[2] dos :** `['back_width','back_thickness','back']` compound. Avec pullup_bar disponible :
- seed-pullup (back_width, pullup_bar, compound, pop=3) ✅
- seed-lat-pulldown (back_width, cable, compound, pop=3)
- Beginner → top-1 popularité → l'un ou l'autre (ex æquo pop=3, aléatoire possible).

**Verdict : ✅ PASS**

---

### P72 — back-bi 20min hypertrophy intermediate (brosplit 5j) ✅ PASS

**Profil :** goal=hypertrophy, days=5, duration=20, equipment=[barbell,dumbbell,cable,machine,pullup_bar], level=intermediate, splitPreference=brosplit

**Split :** brosplit/5j → `['chest-tri','back-bi','legs','shoulders-arms','upper']` (ligne 495)

**Calcul (session back-bi) :**
- base(back-bi) = 8
- duration=20, goal=hypertrophy → `max(2, ⌊8×0.5⌋)` = `max(2, 4)` = **4**

**Assertion du prompt :** 4 slots ✅

**Slots retenus (back-bi[0..3]) :**
- [0] `['back_width','back_thickness']` compound → tirage vertical (slot v7-modifié, deadlift exclu) ✅
- [1] `['back_thickness','back']` compound → rowing barre/haltères ✅
- [2] `['biceps']` isolation → curl barre EZ
- [3] `['back_thickness','back_width','back']` isolation → isolation dos (pull-over, cable)

**Verdict : ✅ PASS**

---

### P73 — chest-back 20min strength intermediate (Arnold 5j) ✅ PASS

**Profil :** goal=strength, days=5, duration=20, equipment=[barbell,dumbbell,cable,machine,pullup_bar], level=intermediate, splitPreference=arnold

**Split :** arnold/5j → `['chest-back','shoulders-arms','legs','chest-back','shoulders-arms']` (ligne 485)

**Calcul (session chest-back) :**
- base(chest-back) = 9 (9 entrées, indices 0-8, vérifié lignes 291-303)
- duration=20, goal=strength → `min(3, max(2, ⌊9×0.5⌋))` = `min(3, max(2, 4))` = `min(3, 4)` = **3**

**Assertion du prompt :** 3 slots ✅

**Slots retenus (chest-back[0..2]) :**
- [0] `['chest','chest_upper']` compound → développé couché
- [1] `['back_width','back_thickness']` compound → tirage vertical (slot v7-modifié) ✅
- [2] `['shoulders','shoulders_front']` compound → OHP

Séance chest+back minimaliste : 3 composés, pas d'isolation. Temporellement cohérent (3×5s×3min repos ≈ 20min strength).

**Verdict : ✅ PASS**

---

### P74 — lower-quad 20min fat_loss intermediate (upper-lower 4j) ✅ PASS

**Profil :** goal=fat_loss, days=4, duration=20, equipment=[barbell,dumbbell,cable,machine], level=intermediate, splitPreference=upper-lower

**Split :** `['upper-push','lower-quad','upper-pull','lower-hip']`

**Calcul (session lower-quad) :**
- base(lower-quad) = 8
- duration=20, goal=fat_loss → `max(2, ⌊8×0.5⌋)` = `max(2, 4)` = **4**

**Assertion du prompt :** 4 slots ✅

**Slots retenus (lower-quad[0..3]) :**
- [0] `['quads','glutes']` compound → squat / leg press
- [1] `['hamstrings','glutes']` compound → RDL
- [2] `['quads']` isolation → leg extension
- [3] `['hamstrings']` isolation → leg curl

**Verdict : ✅ PASS**

---

### P75 — lower-quad 90min fat_loss intermediate (upper-lower 4j) ✅ PASS

**Profil :** goal=fat_loss, days=4, duration=90, equipment=[barbell,dumbbell,cable,machine], level=intermediate, splitPreference=upper-lower

**Calcul :**
- base(lower-quad) = 8
- duration=90, goal=fat_loss → `min(8+2, 8)` = `min(10, 8)` = **8**

**Assertion du prompt :** 8 slots ✅

Tous les 8 slots lower-quad utilisés, incluant les slots bonus 90min :
- [6] `['glutes']` isolation (2e fessiers : cable kickback)
- [7] `['hamstrings']` isolation (2e ischio : nordic curl)

**Verdict : ✅ PASS**

---

### P76 — glutes-hip 20min fat_loss intermediate (glutes-focus 4j) ✅ PASS

**Profil :** goal=fat_loss, days=4, duration=20, equipment=[dumbbell,machine], level=intermediate, splitPreference=glutes-focus

**Split :** glutes-focus/4j → `['glutes-hip','quad-glutes','glutes-hip','quad-glutes']` (ligne 514)

**Calcul (session glutes-hip) :**
- base(glutes-hip) = 8
- duration=20, goal=fat_loss → `max(2, ⌊8×0.5⌋)` = `max(2, 4)` = **4**

**Assertion du prompt :** 4 slots ✅

**Question critique : glutes-hip[3] est-il inclus dans les 4 premiers slots ?**

`baseSlots.slice(0, 4)` → indices 0, 1, 2, 3 → **index 3 inclus** ✅

**Slots retenus (glutes-hip[0..3]) :**
- [0] `['glutes','hamstrings']` compound (hip thrust / Sumo DL)
- [1] `['hamstrings','glutes']` compound (RDL)
- [2] `['quads','glutes']` compound (fente bulgare)
- [3] `['back_width','back_thickness']` compound (lat pulldown) ← **inclus** ✅

**Sélection pour slot[3] avec equipment=[dumbbell,machine] :**
- Candidats compound avec primaryMuscle ∈ ['back_width','back_thickness'] :
  - `machine-lat-pulldown` (back_width, machine, compound, pop=2) ✅
  - `seed-pullover` (back_width, dumbbell, compound, pop=1) ✅
- Tri : slotPrimary=back_width → les deux ont primaryMuscle=back_width (aP=0 ex æquo)
- Tri secondaire : usedGlobally=0 pour les deux (1ère séance)
- Tri tertiaire : popularité → machine-lat-pulldown(2) > seed-pullover(1)
- **machine-lat-pulldown sélectionné** ✅

**Assertion du prompt :** slot[3] → machine-lat-pulldown ✅ PASS

**Verdict : ✅ PASS**

---

### P77 — glutes-hip 45min fat_loss intermediate (glutes-focus 4j) ✅ PASS

**Profil :** goal=fat_loss, days=4, duration=45, equipment=[dumbbell,machine], level=intermediate, splitPreference=glutes-focus

**Calcul :**
- base(glutes-hip) = 8
- duration=45, goal=fat_loss → `max(4, ⌊8×0.75⌋)` = `max(4, 6)` = **6**

**Assertion du prompt :** 6 slots ✅

**Slots retenus (glutes-hip[0..5]) :**
- [0..3] : 4 composés (hip thrust, RDL, fente, lat pulldown)
- [4] `['glutes']` isolation (hip abduction)
- [5] `['hamstrings']` isolation (leg curl)

glutes-hip[3] dos compound inclus ✅ (index 3 < 6)

**Verdict : ✅ PASS**

---

### P78 — pull 20min fat_loss intermediate (PPF) ✅ PASS

**Profil :** goal=fat_loss, days=3, duration=20, equipment=[barbell,dumbbell,cable], level=intermediate

**Split :** 3j, fat_loss, intermediate, !isMass, level≠beginner → ligne 586 → `['push','pull','fullbody-quad']` (PPF)

**Calcul (session pull) :**
- base(pull) = 8
- duration=20, goal=fat_loss → `max(2, ⌊8×0.5⌋)` = `max(2, 4)` = **4**

**Assertion du prompt :** 4 slots ✅

**Slots retenus (pull[0..3]) :**
- [0] `['back_width','back_thickness']` compound (tirage vertical, slot v7-modifié)
- [1] `['back_thickness','back']` compound (rowing)
- [2] `['back_thickness','back_width','back']` isolation (isolation dos)
- [3] `['biceps']` isolation (curl)

pull[0] et pull[1] dos compound servis ✅

**Verdict : ✅ PASS**

---

### P79 — upper-pull 45min hypertrophy intermediate (upper-lower 4j) ✅ PASS

**Profil :** goal=hypertrophy, days=4, duration=45, equipment=[barbell,dumbbell,cable,machine,pullup_bar], level=intermediate, splitPreference=upper-lower

**Split :** `['upper-push','lower-quad','upper-pull','lower-hip']`

**Calcul (session upper-pull) :**
- base(upper-pull) = 8
- duration=45, goal=hypertrophy → `max(4, ⌊8×0.75⌋)` = `max(4, 6)` = **6**

**Assertion du prompt :** 6 slots ✅

**Slots retenus (upper-pull[0..5]) :**
- [0] `['back_width','back_thickness']` compound (tirage vertical, v7-modifié) ✅
- [1] `['back_thickness','back']` compound (rowing) ✅
- [2] `['chest','chest_upper']` compound (bench incliné)
- [3] `['shoulders_rear']` isolation (face pull)
- [4] `['biceps']` isolation (curl)
- [5] `['back_thickness','back']` isolation (isolation dos)

upper-pull[0] et [1] dos compound servis ✅

**Verdict : ✅ PASS**

---

### P80 — 2j 90min hypertrophy beginner ✅ PASS

**Profil :** goal=hypertrophy, days=2, duration=90, equipment=[barbell,dumbbell,cable,machine,pullup_bar], level=beginner

**Split :** 2j défaut → `['fullbody-quad','fullbody-hip']` (ligne 577)

**Calcul (fullbody-quad et fullbody-hip, base=9 chacun) :**
- duration=90, goal=hypertrophy → `min(9+2, 8)` = `min(11, 8)` = **8**

**Assertion du prompt :** min(9+2, 8) = 8 slots ✅

Beginner → sélection top-1 popularité pour chaque slot. Avec l'équipement complet :
- slot[2] dos (fullbody-quad) : seed-pullup (pullup_bar, pop=3) ou seed-lat-pulldown (cable, pop=3) — ex æquo
- Séances complètes 8 exercices + warmup + core ✅

**Verdict : ✅ PASS**

---

## 4. Tableau récapitulatif

| Profil | Type de séance | base | Duration | Goal | adjustedSlotCount | Prompt | Résultat |
|--------|---------------|------|----------|------|-------------------|--------|----------|
| P61 | push | 8 | 20 | hyp | max(2,4)=**4** | 4 | ✅ PASS |
| P62 | push | 8 | 45 | hyp | max(4,6)=**6** | 6 | ✅ PASS |
| P63 | push | 8 | 90 | hyp | min(10,8)=**8** | 8 | ✅ PASS |
| P64 | legs | 8 | 20 | hyp | max(2,4)=**4** | 4 | ✅ PASS |
| P65 | legs | 8 | 90 | hyp | min(10,8)=**8** | 8 | ✅ PASS |
| P66 | upper-push¹ | 8² | 20 | str | min(3,max(2,4))=**3** | 3 | ⚠️ RÉSERVE |
| P67 | upper-push¹ | 8² | 45 | str | min(3,max(2,4))=**3** | 3 | ⚠️ RÉSERVE |
| P68 | upper-push¹ | 8² | 60 | str | max(4,4)=**4** | 4 | ⚠️ RÉSERVE |
| P69 | upper-push¹ | 8² | 90 | str | min(8,5)=**5** | 5 | ⚠️ RÉSERVE |
| P70 | fullbody-quad | 9 | 20 | str | min(3,max(2,4))=**3** | 3 | ✅ PASS |
| P71 | fullbody-quad | 9 | 90 | hyp | min(11,8)=**8** | 8 | ✅ PASS |
| P72 | back-bi | 8 | 20 | hyp | max(2,4)=**4** | 4 | ✅ PASS |
| P73 | chest-back | 9 | 20 | str | min(3,max(2,4))=**3** | 3 | ✅ PASS |
| P74 | lower-quad | 8 | 20 | fat | max(2,4)=**4** | 4 | ✅ PASS |
| P75 | lower-quad | 8 | 90 | fat | min(10,8)=**8** | 8 | ✅ PASS |
| P76 | glutes-hip | 8 | 20 | fat | max(2,4)=**4** | 4 | ✅ PASS |
| P77 | glutes-hip | 8 | 45 | fat | max(4,6)=**6** | 6 | ✅ PASS |
| P78 | pull | 8 | 20 | fat | max(2,4)=**4** | 4 | ✅ PASS |
| P79 | upper-pull | 8 | 45 | hyp | max(4,6)=**6** | 6 | ✅ PASS |
| P80 | fullbody-quad/hip | 9 | 90 | hyp | min(11,8)=**8** | 8 | ✅ PASS |

¹ Le split `upper-lower`/4j produit `upper-push` et `upper-pull`, pas `upper`. La session 'upper' n'existe pas dans ce split.  
² La table de référence du prompt indique base=9 pour 'upper' ; le code montre 8 slots (lignes 167-176).

---

## 5. Synthèse des écarts

### Écart #1 — Base incorrecte pour 'upper' dans la table de référence

**Localisation :** Section "Groupe D — Références des slots de base" du prompt d'audit.  
**Valeur du prompt :** `upper` → 9  
**Valeur réelle (code, lignes 167-176) :** `upper` → **8**  
**Impact :** Nul pour P61-P80. Pour toutes les durées testées, `⌊8×0.5⌋ = ⌊9×0.5⌋ = 4` et `min(8,5) = min(9,5) = 5`. L'erreur n'est visible qu'à 60min hypertrophy où la formule retourne `base` directement (8 vs 9 — mais ce cas n'est pas testé dans ce groupe).  
**Recommandation :** Corriger la table de référence (upper → 8).

### Écart #2 — P66/P67/P68/P69 : type de session référencé inexistant dans le split

**Localisation :** Assertions de P66-P69.  
**Attendu selon le prompt :** Session 'upper' avec base=9.  
**Réel :** Le split `upper-lower`/4j produit `['upper-push','lower-quad','upper-pull','lower-hip']`. Pas de session 'upper'. Les sessions haut du corps réelles sont upper-push et upper-pull (base=8).  
**Impact :** Nul sur les comptes de slots (les formules donnent les mêmes résultats pour base=8). Les assertions finales (3, 3, 4, 5 slots) sont correctes.  
**Recommandation :** Reformuler P66-P69 pour référencer upper-push/upper-pull avec base=8, ou utiliser un split `upper-lower`/5j qui inclut une session 'upper' (5e jour).

### Aucun FAIL détecté

La formule `adjustedSlotCount` est correctement implémentée. Tous les comptes de slots assertés dans le prompt sont corrects pour P61-P80.

---

## 6. Points d'attention confirmés

**P70 (INC-1 + 20min strength) :** 3 slots seulement, tous composés (squat + bench + tirage). Le `isVeryShort=true` supprime le core et réduit le warmup à 1 série. Cohérent. ✅

**P76 (glutes-hip[3] dans 20min) :** Index 3 = 4e slot. `slice(0,4)` l'inclut bien (indices 0,1,2,3). La séance glutes-hip à 20min inclut le slot dos compound (lat pulldown). machine-lat-pulldown sélectionné avec equipment=[dumbbell,machine]. ✅

**P71 (cap min(base+2, 8) pour hypertrophy 90min) :** base=9, min(11,8)=8 slots max. Cap opérant, slot triceps (index 8) exclu. ✅
