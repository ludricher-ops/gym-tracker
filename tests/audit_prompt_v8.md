# Audit prompt v8 — gym-tracker · programGenerator.ts
**Date :** 2026-09-07  
**Objectif :** Couverture élargie — 100 profils, 5 groupes de 20  
**Base :** Corrections v6 + v7 toutes appliquées (commits 029b27e, 6f045d2, 0ab65f3, c64cba7)

---

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

## Groupe A (P01-P20) — Équipements machine : couverture élargie

### P01 — Machine seul, PPL 3j hypertrophy intermediate *(régression v7)*
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine], level=intermediate  
**Assertions :**
- pull[0] `['back_width','back_thickness']` → machine-lat-pulldown ✅

### P02 — Machine seul, fullbody 3j fat_loss beginner *(régression v7)*
**Profil :** goal=fat_loss, days=3, duration=60, equipment=[machine], level=beginner, splitPreference=fullbody  
**Assertions :**
- fullbody[2] dos compound servi (machine-lat-pulldown) ✅

### P03 — Machine seul, PPL 3j **strength intermediate** (INC-1 attendu)
**Profil :** goal=strength, days=3, duration=60, equipment=[machine], level=intermediate  
**Assertions :**
- selectSplit → `['fullbody-quad','fullbody-hip','fullbody-quad']` (INC-1)
- adjustedSlotCount(fullbody-quad, 60, strength) = max(4, ⌊9×0.5⌋) = max(4,4) = **4 slots**
- fullbody[2] compound dos : machine-lat-pulldown candidat (back_width slotPrimary) ✅

### P04 — Machine seul, PPL 3j **strength beginner** (fullbody attendu)
**Profil :** goal=strength, days=3, duration=60, equipment=[machine], level=beginner  
**Assertions :**
- selectSplit beginner → fullbody×3 (pas INC-1, déjà fullbody de base)
- adjustedSlotCount = max(4, ⌊9×0.5⌋) = 4 slots (strength 60min)
- fullbody[2] : machine-lat-pulldown ✅

### P05 — Machine seul, **20 min** hypertrophy intermediate
**Profil :** goal=hypertrophy, days=3, duration=20, equipment=[machine], level=intermediate  
**Assertions :**
- split PPL → pull séance
- adjustedSlotCount(pull, 20, hypertrophy) = max(2, ⌊8×0.5⌋) = max(2,4) = **4 slots**
- pull[0] compound dos : machine-lat-pulldown (back_width) ✅
- pull[1] compound dos : seed-row-machine ✅

### P06 — Machine seul, **45 min** hypertrophy intermediate
**Profil :** goal=hypertrophy, days=3, duration=45, equipment=[machine], level=intermediate  
**Assertions :**
- adjustedSlotCount(pull, 45, hypertrophy) = max(4, ⌊8×0.75⌋) = max(4,6) = **6 slots**
- pull[0] et pull[1] servis ✅
- pull[3] `['back_thickness','back_width','back'] compound:false` (slot isolation) :
  - machine-lat-pulldown déjà usedInWorkout → exclu
  - seed-row-machine (back_thickness) probablement déjà usedInWorkout → exclu
  - Candidats isolation machine dos : à vérifier dans le seed (possible slot vide)

### P07 — Machine seul, **90 min** hypertrophy intermediate
**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[machine], level=intermediate  
**Assertions :**
- adjustedSlotCount(pull, 90, hypertrophy) = min(8+2, 8) = **8 slots** (cap)
- pull[0] : machine-lat-pulldown ✅
- pull[1] : seed-row-machine ✅
- pull[7] isolation dos : slot vide probable (P10 v7 confirmé) → **⚠️ RÉSERVE attendue**

### P08 — Machine seul, **20 min strength** intermediate (INC-1 + peu de slots)
**Profil :** goal=strength, days=3, duration=20, equipment=[machine], level=intermediate  
**Assertions :**
- selectSplit → fullbody×3 (INC-1)
- adjustedSlotCount(fullbody-quad, 20, strength) = min(3, max(2, ⌊9×0.5⌋)) = min(3,4) = **3 slots**
- fullbody-quad slots 0,1,2 seulement — slot[2] dos compound : machine-lat-pulldown ✅

### P09 — Machine seul, **45 min strength** intermediate
**Profil :** goal=strength, days=3, duration=45, equipment=[machine], level=intermediate  
**Assertions :**
- INC-1 → fullbody×3
- adjustedSlotCount(45, strength) = min(3, max(2, ⌊9×0.5⌋)) = **3 slots**
- slot[2] dos : machine-lat-pulldown ✅ (même résultat que 20min strength)

### P10 — Machine + pullup_bar, PPL 3j intermediate
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine, pullup_bar], level=intermediate  
**Assertions :**
- pull[0] `['back_width','back_thickness']` compound : machine-lat-pulldown (pop 2) vs seed-pullup (pop 3)
- slotPrimary=back_width → tie (les deux ont back_width=slotPrimary)
- Tri secondaire : popularité → seed-pullup (pop 3) > machine-lat-pulldown (pop 2)
- intermediate top-3 → seed-pullup probable (pop plus élevé) ✅
- machine-lat-pulldown reste dans le pool → variété possible

### P11 — Machine + câble, upper-lower 4j intermediate
**Profil :** goal=hypertrophy, days=4, duration=60, equipment=[machine, cable], level=intermediate, splitPreference=upper-lower  
**Assertions :**
- upper-pull[0] : seed-lat-pulldown (cable, pop 3) vs machine-lat-pulldown (machine, pop 2)
- seed-lat-pulldown priorisé (pop 3 > 2) ✅
- machine-lat-pulldown dans le pool top-3 intermediate ✅

### P12 — Machine + dumbbell, PPL 3j intermediate
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine, dumbbell], level=intermediate  
**Assertions :**
- pull[0] `['back_width','back_thickness']` : machine-lat-pulldown (back_width, pop 2) vs seed-pullover (back_width, pop 1)
- slotPrimary tie → popularité : machine-lat-pulldown (pop 2) > seed-pullover (pop 1)
- machine-lat-pulldown probable en slot[0] ✅
- seed-pullover accessible via pool intermediate top-3

### P13 — Machine seul, brosplit 5j advanced
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[machine], level=advanced, splitPreference=brosplit  
**Assertions :**
- back-bi[0] : machine-lat-pulldown ✅
- back-bi[1] : seed-row-machine ✅
- back-bi[3] isolation dos : aucun exercice machine isolation dos dans le seed → slot vide possible **⚠️**
- Confirmer si le générateur émet un avertissement ou laisse silencieusement

### P14 — Machine seul, Arnold 5j intermediate
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[machine], level=intermediate, splitPreference=arnold  
**Assertions :**
- chest-back[1] : machine-lat-pulldown (back_width slotPrimary) ✅
- chest-back[4] isolation dos : vide probable ⚠️

### P15 — Machine seul, glutes-focus 3j intermediate
**Profil :** goal=fat_loss, days=3, duration=60, equipment=[machine], level=intermediate, splitPreference=glutes-focus  
**Assertions :**
- split : `['glutes-hip','quad-glutes','glutes-hip']`
- glutes-hip[3] : machine-lat-pulldown ✅
- SEED-BW-NOBACK : splitPreference='glutes-focus' → exception → **NON émis** ✅

### P16 — Machine seul, **focusMuscles=['back']** 3j intermediate
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine], level=intermediate, focusMuscles=['back']  
**Assertions :**
- workoutTypeFromFocus(['back']) → 'pull' → split=['pull','upper-pull','pull']
- pull[0] : machine-lat-pulldown ✅
- upper-pull[0] : machine-lat-pulldown (mais usedGlobally) ou seed-row-machine selon pool

### P17 — Machine seul, **focusMuscles=['back','legs']** 3j intermediate
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine], level=intermediate, focusMuscles=['back','legs']  
**Assertions :**
- workoutTypeFromFocus(['back','legs']) → 'lower_pull'
- split = `['lower_pull','lower_pull','lower_pull']`
- lower_pull[1] `['back_width','back_thickness']` : machine-lat-pulldown ✅

### P18 — Machine seul, **fat_loss 2j** beginner
**Profil :** goal=fat_loss, days=2, duration=60, equipment=[machine], level=beginner  
**Assertions :**
- split : `['fullbody-quad','fullbody-hip']`
- fullbody-quad[2] et fullbody-hip[2] : machine-lat-pulldown ✅

### P19 — Machine + barbell, PPL 3j intermediate *(conflit machine vs barbell pour dos)*
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine, barbell], level=intermediate  
**Assertions :**
- pull[0] `['back_width','back_thickness']` :
  - machine-lat-pulldown (back_width, pop 2) vs seed-row-barbell (back_thickness, pop 7)
  - slotPrimary=back_width → machine-lat-pulldown (aP=0) > seed-row-barbell (aP=1) → machine-lat-pulldown priorisé malgré pop plus faible
- pull[1] `['back_thickness','back']` : seed-row-barbell (back_thickness, pop 7) probable

### P20 — Machine seul, **6j hypertrophy advanced** (si supporté, sinon 5j)
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[machine], level=advanced, splitPreference=auto  
**Assertions :**
- 5j auto advanced hypertrophy → `['push','pull','lower-quad','upper','lower-hip']`
- pull[0] : machine-lat-pulldown ✅
- upper[1] `['back_width','back_thickness','back']` : machine-lat-pulldown ou seed-row-machine ✅

---

## Groupe B (P21-P40) — Pullover compound + Slots deadlift : couverture élargie

### P21 — DB seul, PPL 3j hypertrophy intermediate *(régression v7 P13)*
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell], level=intermediate  
**Assertions :**
- pull[0] `['back_width','back_thickness']` : seed-pullover (back_width, compound, slotPrimary) ✅
- pull[1] : seed-row-dumbbell ✅

### P22 — DB seul, **strength 3j beginner** (INC-1 + pullover fullbody)
**Profil :** goal=strength, days=3, duration=60, equipment=[dumbbell], level=beginner  
**Assertions :**
- selectSplit beginner → fullbody×3
- adjustedSlotCount(60, strength) = max(4, ⌊9×0.5⌋) = 4 slots
- fullbody[2] compound dos : seed-pullover (back_width slotPrimary) probable ✅

### P23 — DB seul, **fat_loss 4j intermediate**
**Profil :** goal=fat_loss, days=4, duration=60, equipment=[dumbbell], level=intermediate  
**Assertions :**
- selectSplit 4j fat_loss intermediate → `['push','pull','lower-quad','upper']` ou similaire
- pull[0] : seed-pullover ✅
- hasCompoundBack = true → pas de remplacement BUG-BW-PULL

### P24 — DB seul, **20 min strength intermediate** (peu de slots)
**Profil :** goal=strength, days=3, duration=20, equipment=[dumbbell], level=intermediate  
**Assertions :**
- INC-1 → fullbody×3
- adjustedSlotCount(20, strength) = min(3, max(2, ⌊9×0.5⌋)) = **3 slots**
- slot[2] compound dos : seed-pullover (slotPrimary back_width) ou seed-row-dumbbell ✅

### P25 — DB seul, **45 min hypertrophy beginner** (fullbody)
**Profil :** goal=hypertrophy, days=3, duration=45, equipment=[dumbbell], level=beginner  
**Assertions :**
- beginner → fullbody×3
- adjustedSlotCount(45, hypertrophy) = max(4, ⌊9×0.75⌋) = max(4,6) = **6 slots**
- fullbody[2] compound dos : seed-pullover (beginner top-1, slotPrimary) ✅

### P26 — DB seul, **90 min hypertrophy intermediate** (8 slots)
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

### P27 — DB seul, **back-bi brosplit advanced**
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[dumbbell], level=advanced, splitPreference=brosplit  
**Assertions :**
- back-bi[0] : seed-pullover (back_width) ✅
- back-bi[1] : seed-row-dumbbell (back_thickness) ✅
- back-bi[3] isolation : seed-pullover-dumbbell ou seed-shrug ✅

### P28 — Barbell seul, **20 min hypertrophy intermediate**
**Profil :** goal=hypertrophy, days=3, duration=20, equipment=[barbell], level=intermediate  
**Assertions :**
- adjustedSlotCount(pull, 20, hypertrophy) = max(2, ⌊8×0.5⌋) = **4 slots**
- pull[0] : seed-deadlift EXCLU, seed-row-barbell (back_thickness) ou seed-row-tbar ✅
- pull[1] `['back_thickness','back']` : seed-deadlift (back ∈ liste) candidat ✅

### P29 — Barbell seul, **45 min strength intermediate** (INC-1)
**Profil :** goal=strength, days=3, duration=45, equipment=[barbell], level=intermediate  
**Assertions :**
- INC-1 → fullbody×3
- adjustedSlotCount(45, strength) = min(3, max(2, ⌊9×0.5⌋)) = **3 slots**
- fullbody[2] `['back_width','back_thickness','back']` : seed-deadlift ENCORE CANDIDAT (slot inchangé)
- seed-row-barbell (back_thickness, pop 7) probable (slotPrimary=back_width → tie → pop) ✅

### P30 — Barbell seul, **90 min hypertrophy intermediate**
**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[barbell], level=intermediate  
**Assertions :**
- pull[0] : seed-deadlift EXCLU (slot modifié) → seed-row-barbell ✅
- pull[1] `['back_thickness','back']` : seed-row-tbar ou seed-deadlift ✅
- pull slots bonus 90min : vérifier que les slots isolation dos (back) acceptent seed-deadlift ✅

### P31 — KB seul, **PPL 3j fat_loss intermediate**
**Profil :** goal=fat_loss, days=3, duration=60, equipment=[kettlebell], level=intermediate  
**Assertions :**
- hasCompoundBack = true (kb-row back_thickness compound)
- pull[0] `['back_width','back_thickness']` : kb-deadlift EXCLU (back ∉ liste) → kb-row (back_thickness) ✅
- pull[1] `['back_thickness','back']` : kb-row (usedInWorkout) probable exclu → kb-deadlift (back) candidat ✅

### P32 — KB seul, **strength 4j intermediate**
**Profil :** goal=strength, days=4, duration=60, equipment=[kettlebell], level=intermediate, splitPreference=upper-lower  
**Assertions :**
- upper-pull[0] : kb-deadlift EXCLU (back ∉ ['back_width','back_thickness']) → kb-row ✅
- adjustedSlotCount(upper-pull, 60, strength) = max(4, ⌊8×0.5⌋) = **4 slots**

### P33 — DB + pullup_bar, **PPL 3j intermediate** *(pullover vs pullup compétition)*
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell, pullup_bar], level=intermediate  
**Assertions :**
- pull[0] `['back_width','back_thickness']` :
  - seed-pullover (back_width, dumbbell, compound, pop 1)
  - seed-pullup (back_width, pullup_bar, compound, pop 3)
  - slotPrimary tie → popularité : seed-pullup (pop 3) > seed-pullover (pop 1)
  - intermediate top-3 → seed-pullup probable ✅

### P34 — Barbell + dumbbell, **PPL 3j advanced** *(deadlift exclu, pullover priorisé)*
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell, dumbbell], level=advanced  
**Assertions :**
- pull[0] `['back_width','back_thickness']` :
  - seed-deadlift (back) → EXCLU ✅
  - seed-pullover (back_width, pop 1) → slotPrimary=back_width → aP=0
  - seed-row-barbell (back_thickness, pop 7) → slotPrimary → aP=1
  - seed-pullover priorisé malgré pop faible (slotPrimary prime) ⚠️ RÉSERVE

### P35 — Barbell + cable, **PPL 3j intermediate**
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell, cable], level=intermediate  
**Assertions :**
- pull[0] `['back_width','back_thickness']` :
  - seed-lat-pulldown (back_width, cable, pop 3) → slotPrimary=back_width → aP=0
  - seed-row-barbell (back_thickness, pop 7) → aP=1
  - seed-lat-pulldown priorisé (slotPrimary) ✅
  - seed-deadlift EXCLU ✅

### P36 — Salle complète, **PPL 3j advanced** (régression globale)
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable,machine,bodyweight,pullup_bar], level=advanced  
**Assertions :**
- pull[0] : seed-pullup (pop 3) ou seed-lat-pulldown (pop 3) — tie → aléatoire (advanced top-5) ✅
- seed-deadlift EXCLU de pull[0] ✅
- split PPL inchangé (hasCompoundBack=true) ✅

### P37 — DB seul, **lower_pull 3j intermediate** *(pullover dans tirage vertical lower_pull)*
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell], level=intermediate, focusMuscles=['back','legs']  
**Assertions :**
- lower_pull[1] : seed-pullover (back_width, slotPrimary) ✅

### P38 — DB seul, **chest-back Arnold 5j intermediate**
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[dumbbell], level=intermediate, splitPreference=arnold  
**Assertions :**
- chest-back[1] `['back_width','back_thickness']` : seed-pullover (back_width, slotPrimary, compound) ✅
- chest-back[4] isolation dos : seed-pullover-dumbbell ou seed-shrug ✅

### P39 — KB + band, **fullbody 3j intermediate** *(band-row vs kb-row)*
**Profil :** goal=fat_loss, days=3, duration=60, equipment=[kettlebell, band], level=intermediate, splitPreference=fullbody  
**Assertions :**
- hasCompoundBack = true (band-row ET kb-row)
- fullbody[2] `['back_width','back_thickness','back']` :
  - kb-row (back_thickness, pop 2) → aP=1
  - band-row (back_thickness, pop 2) → aP=1
  - Tie complet → aléatoire ✅

### P40 — DB + band, **PPL 3j intermediate** *(pullover + band-row : 3 candidats pour 2 slots)*
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell, band], level=intermediate  
**Assertions :**
- pull[0] `['back_width','back_thickness']` : seed-pullover (back_width, pop 1, slotPrimary) ✅
- pull[1] `['back_thickness','back']` : seed-row-dumbbell (pop 3) ou band-row (pop 2)
- seed-row-dumbbell probable (pop plus élevé) ✅

---

## Groupe C (P41-P60) — BW interactions + warnings : couverture élargie

### P41 — BW seul, PPL 3j intermediate → BUG-BW-PULL only *(régression v7 P25)*
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight], level=intermediate  
**Assertions :**
- BUG-BW-PULL émis, SEED-BW-NOBACK absent ✅

### P42 — BW seul, fullbody 3j beginner → SEED-BW-NOBACK *(régression v7 P26)*
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight], level=beginner  
**Assertions :**
- SEED-BW-NOBACK émis, BUG-BW-PULL absent ✅

### P43 — BW seul, fat_loss 3j intermediate → BUG-BW-PULL (PPF) *(régression v7 P27)*
**Profil :** goal=fat_loss, days=3, duration=60, equipment=[bodyweight], level=intermediate  
**Assertions :**
- rawSplit = ['push','pull','fullbody-quad'] → hasPullInSplit=true → BUG-BW-PULL ✅

### P44 — BW seul, 2j fullbody beginner → SEED-BW-NOBACK *(régression v7 P28)*
**Profil :** goal=hypertrophy, days=2, duration=60, equipment=[bodyweight], level=beginner  
**Assertions :**
- SEED-BW-NOBACK émis ✅

### P45 — BW + pullup_bar, fullbody 3j beginner → aucun warning *(régression v7 P29)*
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight, pullup_bar], level=beginner  
**Assertions :**
- hasCompoundBack=true → aucun warning dos ✅

### P46 — BW + band, fullbody 3j intermediate → aucun warning *(régression v7 P30)*
**Profil :** goal=fat_loss, days=3, duration=60, equipment=[bodyweight, band], level=intermediate  
**Assertions :**
- hasCompoundBack=true (band-row compound) → aucun warning dos ✅

### P47 — BW seul, upper-lower 4j → SEED-BW-NOBACK *(régression v7 P31)*
**Profil :** goal=hypertrophy, days=4, duration=60, equipment=[bodyweight], level=intermediate, splitPreference=upper-lower  
**Assertions :**
- 'upper-pull' ≠ 'pull' → hasPullInSplit=false → SEED-BW-NOBACK émis ✅

### P48 — BW seul, glutes-focus 4j → **PAS** de SEED-BW-NOBACK *(régression v7 P32, fix c64cba7)*
**Profil :** goal=fat_loss, days=4, duration=60, equipment=[bodyweight], level=intermediate, splitPreference=glutes-focus  
**Assertions :**
- splitPreference='glutes-focus' → exception dans la condition → SEED-BW-NOBACK **NON émis** ✅

### P49 — BW seul, **strength 3j intermediate** (INC-1 + BW + fullbody)
**Profil :** goal=strength, days=3, duration=60, equipment=[bodyweight], level=intermediate  
**Assertions :**
- INC-1 → fullbody×3
- hasCompoundBack=false, hasPullInSplit=false → SEED-BW-NOBACK émis ✅
- Programme fullbody généré quand même (warning non bloquant) ✅

### P50 — BW seul, **strength 3j beginner**
**Profil :** goal=strength, days=3, duration=60, equipment=[bodyweight], level=beginner  
**Assertions :**
- selectSplit beginner → fullbody×3 (indépendamment de INC-1)
- SEED-BW-NOBACK émis (hasCompoundBack=false, hasPullInSplit=false) ✅

### P51 — BW + cable, **PPL 3j intermediate** *(câble donne compound dos)*
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight, cable], level=intermediate  
**Assertions :**
- hasCompoundBack : seed-lat-pulldown (back_width, cable, compound) → **true** ✅
- hasPullInSplit=true → BUG-BW-PULL non déclenché
- SEED-BW-NOBACK : hasCompoundBack=true → non émis ✅
- split inchangé ['push','pull','legs']
- pull[0] : seed-lat-pulldown (back_width, pop 3) ✅

### P52 — BW + machine, **fullbody 3j intermediate** *(machine donne compound dos)*
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight, machine], level=intermediate  
**Assertions :**
- hasCompoundBack : machine-lat-pulldown (back_width, machine, compound) → **true** ✅
- SEED-BW-NOBACK non émis ✅
- BUG-BW-PULL non déclenché (hasCompoundBack=true) ✅
- fullbody[2] : machine-lat-pulldown (back_width, slotPrimary) ✅

### P53 — BW + dumbbell, **PPL 3j intermediate** *(pullover donne compound dos)*
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight, dumbbell], level=intermediate  
**Assertions :**
- hasCompoundBack : seed-pullover (back_width, dumbbell, compound) → **true** ✅
- split PPL inchangé (hasCompoundBack=true) ✅
- pull[0] : seed-pullover (back_width, slotPrimary) ✅

### P54 — BW seul, **brosplit 5j intermediate** *(back-bi sans compound dos → warning?)*
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

### P55 — BW seul, **4j fat_loss intermediate** (split non-PPL, pas de 'pull' exact)
**Profil :** goal=fat_loss, days=4, duration=60, equipment=[bodyweight], level=intermediate  
**Assertions :**
- selectSplit 4j fat_loss intermediate → à vérifier dans le code (ex. upper-lower?)
- hasPullInSplit dépend du split → identifier le comportement
- hasCompoundBack=false → warning dos selon split

### P56 — BW seul, **5j hypertrophy advanced**
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[bodyweight], level=advanced  
**Assertions :**
- selectSplit 5j hypertrophy advanced → ['push','pull','lower-quad','upper','lower-hip']
- hasPullInSplit=true ('pull' présent) → BUG-BW-PULL déclenché ✅
- SEED-BW-NOBACK non émis ✅

### P57 — BW + barbell, **PPL 3j intermediate**
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight, barbell], level=intermediate  
**Assertions :**
- hasCompoundBack : seed-row-barbell (back_thickness, compound) → **true** ✅
- BUG-BW-PULL non déclenché ✅
- SEED-BW-NOBACK non émis ✅
- pull[0] : seed-deadlift EXCLU → seed-row-barbell (back_thickness, pop 7) ✅

### P58 — BW seul, **focusMuscles=['glutes']** 3j intermediate
**Profil :** goal=fat_loss, days=3, duration=60, equipment=[bodyweight], level=intermediate, focusMuscles=['glutes']  
**Assertions :**
- workoutTypeFromFocus → 'glutes-hip'
- selectSplit avec focusType='glutes-hip' → `['glutes-hip','quad-glutes','glutes-hip']` *(fix P36)* ✅
- splitPreference='auto' (pas 'glutes-focus') → exception non déclenchée
- hasPullInSplit=false, hasCompoundBack=false → SEED-BW-NOBACK **ÉMIS**
  *(car splitPreference !== 'glutes-focus' — l'utilisateur n'a pas explicitement choisi glutes-focus)*

### P59 — BW seul, **focusMuscles=['core']** 3j intermediate
**Profil :** goal=fat_loss, days=3, duration=60, equipment=[bodyweight], level=intermediate, focusMuscles=['core']  
**Assertions :**
- workoutTypeFromFocus(['core']) → 'fullbody-quad' ou null (à vérifier dans le code)
- hasPullInSplit=false probable → SEED-BW-NOBACK selon hasCompoundBack
- hasCompoundBack=false → SEED-BW-NOBACK émis probable

### P60 — BW + pullup_bar, **strength 4j intermediate** (upper-lower)
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

### P61 — **push 20min hypertrophy** intermediate
**Profil :** goal=hypertrophy, days=3, duration=20, equipment=[barbell,dumbbell,cable], level=intermediate  
**Assertions :**
- adjustedSlotCount(push, 20, hypertrophy) = max(2, ⌊8×0.5⌋) = max(2,4) = **4 slots**
- Séance push avec 4 slots seulement (base=8 → réduit à 4)
- Exercices 0-3 seulement (compter les slots dans SLOTS['push'])

### P62 — **push 45min hypertrophy** intermediate
**Profil :** goal=hypertrophy, days=3, duration=45, equipment=[barbell,dumbbell,cable], level=intermediate  
**Assertions :**
- adjustedSlotCount(push, 45, hypertrophy) = max(4, ⌊8×0.75⌋) = max(4,6) = **6 slots**

### P63 — **push 90min hypertrophy** intermediate
**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[barbell,dumbbell,cable], level=intermediate  
**Assertions :**
- adjustedSlotCount(push, 90, hypertrophy) = min(8+2, 8) = **8 slots** (cap à base)

### P64 — **legs 20min hypertrophy** intermediate
**Profil :** goal=hypertrophy, days=3, duration=20, equipment=[barbell,dumbbell,cable,machine], level=intermediate  
**Assertions :**
- adjustedSlotCount(legs, 20, hypertrophy) = max(2, ⌊8×0.5⌋) = **4 slots**
- Vérifier les 4 premiers slots de SLOTS['legs'] : compound quad, compound hip, isolation ×2

### P65 — **legs 90min hypertrophy** intermediate
**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[barbell,dumbbell,cable,machine], level=intermediate  
**Assertions :**
- adjustedSlotCount(legs, 90, hypertrophy) = min(8+2, 8) = **8 slots**

### P66 — **upper 20min strength** intermediate
**Profil :** goal=strength, days=4, duration=20, equipment=[barbell,dumbbell,cable,machine], level=intermediate, splitPreference=upper-lower  
**Assertions :**
- adjustedSlotCount(upper, 20, strength) = min(3, max(2, ⌊9×0.5⌋)) = min(3,4) = **3 slots**
- Séance upper très courte : seulement 3 exercices

### P67 — **upper 45min strength** intermediate
**Profil :** goal=strength, days=4, duration=45, equipment=[barbell,dumbbell,cable,machine], level=intermediate, splitPreference=upper-lower  
**Assertions :**
- adjustedSlotCount(upper, 45, strength) = min(3, max(2, ⌊9×0.5⌋)) = **3 slots**
- Même résultat que 20min strength (le cap min(3,...) est le déterminant)

### P68 — **upper 60min strength** intermediate
**Profil :** goal=strength, days=4, duration=60, equipment=[barbell,dumbbell,cable,machine], level=intermediate, splitPreference=upper-lower  
**Assertions :**
- adjustedSlotCount(upper, 60, strength) = max(4, ⌊9×0.5⌋) = max(4,4) = **4 slots**
- Différent de 45min strength (3 → 4 slots à 60min)

### P69 — **upper 90min strength** intermediate
**Profil :** goal=strength, days=4, duration=90, equipment=[barbell,dumbbell,cable,machine], level=intermediate, splitPreference=upper-lower  
**Assertions :**
- adjustedSlotCount(upper, 90, strength) = min(9,5) = **5 slots**

### P70 — **fullbody 20min strength** intermediate (INC-1)
**Profil :** goal=strength, days=3, duration=20, equipment=[barbell,dumbbell,cable,machine], level=intermediate  
**Assertions :**
- INC-1 → fullbody×3
- adjustedSlotCount(fullbody-quad, 20, strength) = min(3, max(2, ⌊9×0.5⌋)) = **3 slots**
- Séance fullbody avec seulement 3 exercices : slot[0] compound quad, slot[1] compound hip, slot[2] compound dos

### P71 — **fullbody 90min hypertrophy** beginner
**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[barbell,dumbbell,cable,machine,pullup_bar], level=beginner  
**Assertions :**
- beginner → fullbody×3
- adjustedSlotCount(fullbody-quad, 90, hypertrophy) = min(9+2, 8) = **8 slots** (cap)
- Séance fullbody très longue avec 8 exercices
- slot[2] dos : seed-pullup ou seed-lat-pulldown (back_width, pop 3) ✅

### P72 — **back-bi 20min hypertrophy** intermediate (brosplit)
**Profil :** goal=hypertrophy, days=5, duration=20, equipment=[barbell,dumbbell,cable,machine,pullup_bar], level=intermediate, splitPreference=brosplit  
**Assertions :**
- adjustedSlotCount(back-bi, 20, hypertrophy) = max(2, ⌊8×0.5⌋) = **4 slots**
- back-bi[0] compound dos (tirage vertical) ✅
- back-bi[1] compound dos (rowing) ✅

### P73 — **chest-back 20min strength** intermediate (Arnold)
**Profil :** goal=strength, days=5, duration=20, equipment=[barbell,dumbbell,cable,machine,pullup_bar], level=intermediate, splitPreference=arnold  
**Assertions :**
- adjustedSlotCount(chest-back, 20, strength) = min(3, max(2, ⌊9×0.5⌋)) = **3 slots**
- chest-back[0] compound poitrine, chest-back[1] compound dos, chest-back[2] compound combo
- 3 exercices seulement dans cette séance poitrine+dos

### P74 — **lower-quad 20min fat_loss** intermediate
**Profil :** goal=fat_loss, days=4, duration=20, equipment=[barbell,dumbbell,cable,machine], level=intermediate, splitPreference=upper-lower  
**Assertions :**
- adjustedSlotCount(lower-quad, 20, fat_loss) = max(2, ⌊8×0.5⌋) = **4 slots**

### P75 — **lower-quad 90min fat_loss** intermediate
**Profil :** goal=fat_loss, days=4, duration=90, equipment=[barbell,dumbbell,cable,machine], level=intermediate, splitPreference=upper-lower  
**Assertions :**
- adjustedSlotCount(lower-quad, 90, fat_loss) = min(8+2, 8) = **8 slots**

### P76 — **glutes-hip 20min fat_loss** intermediate (glutes-focus)
**Profil :** goal=fat_loss, days=4, duration=20, equipment=[dumbbell,machine], level=intermediate, splitPreference=glutes-focus  
**Assertions :**
- adjustedSlotCount(glutes-hip, 20, fat_loss) = max(2, ⌊8×0.5⌋) = **4 slots**
- glutes-hip slots 0-3 seulement (pas de slot[3] dos compound dans les 4 premiers)
- IMPORTANT : glutes-hip[3] est-il dans les 4 premiers slots ? (index 3 = 4e slot, inclus ✅)
- slot[3] `['back_width','back_thickness']` : machine-lat-pulldown ✅

### P77 — **glutes-hip 45min fat_loss** intermediate (glutes-focus)
**Profil :** goal=fat_loss, days=4, duration=45, equipment=[dumbbell,machine], level=intermediate, splitPreference=glutes-focus  
**Assertions :**
- adjustedSlotCount(glutes-hip, 45, fat_loss) = max(4, ⌊8×0.75⌋) = **6 slots**
- glutes-hip[3] dos compound inclus ✅

### P78 — **pull 20min fat_loss intermediate** (PPF BW → BUG-BW-PULL)
**Profil :** goal=fat_loss, days=3, duration=20, equipment=[barbell,dumbbell,cable], level=intermediate  
**Assertions :**
- split PPF : ['push','pull','fullbody-quad']
- adjustedSlotCount(pull, 20, fat_loss) = max(2, ⌊8×0.5⌋) = **4 slots**
- pull[0] dos compound ✅, pull[1] ✅, pull[3] isolation éventuel

### P79 — **upper-pull 45min hypertrophy** intermediate
**Profil :** goal=hypertrophy, days=4, duration=45, equipment=[barbell,dumbbell,cable,machine,pullup_bar], level=intermediate, splitPreference=upper-lower  
**Assertions :**
- adjustedSlotCount(upper-pull, 45, hypertrophy) = max(4, ⌊8×0.75⌋) = **6 slots**
- upper-pull[0] dos compound ✅, upper-pull[1] ✅

### P80 — **2j 90min hypertrophy** beginner (maximum par séance)
**Profil :** goal=hypertrophy, days=2, duration=90, equipment=[barbell,dumbbell,cable,machine,pullup_bar], level=beginner  
**Assertions :**
- split fullbody : ['fullbody-quad','fullbody-hip']
- adjustedSlotCount(fullbody, 90, hypertrophy) = min(9+2, 8) = **8 slots**
- beginner top-1 → exercices les plus populaires sélectionnés ✅

---

## Groupe E (P81-P100) — FocusMuscles, split selection, UX warnings

### P81 — focusMuscles=['chest'] 3j intermediate
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate  
**Assertions :**
- workoutTypeFromFocus(['chest']) → 'push'
- selectSplit : 3j push → `['push','upper-push','push']`
- Aucune séance dos ✅ (focus pec → pas de tirage attendu)

### P82 — focusMuscles=['shoulders'] 3j intermediate
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate  
**Assertions :**
- workoutTypeFromFocus(['shoulders']) → 'push' (shoulders = hasPush)
- split 3j push : `['push','upper-push','push']`

### P83 — focusMuscles=['arms'] 3j intermediate
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate  
**Assertions :**
- workoutTypeFromFocus(['arms']) → 'upper' (bras seuls → haut du corps mixte)
- split 3j upper : `['push','pull','upper']` (PPU) si level≠beginner ✅

### P84 — focusMuscles=['legs'] 3j intermediate
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable,machine], level=intermediate  
**Assertions :**
- workoutTypeFromFocus(['legs']) → 'lower'
- selectSplit : alterner `['lower-quad','lower-hip','lower-quad']` ✅

### P85 — focusMuscles=['core'] 3j intermediate
**Profil :** goal=fat_loss, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate  
**Assertions :**
- workoutTypeFromFocus(['core']) → à déterminer (core seul → fullbody? null?)
- Si null → split par défaut PPL ou PPF

### P86 — focusMuscles=['glutes'] 3j intermediate *(régression fix P36)*
**Profil :** goal=fat_loss, days=3, duration=60, equipment=[dumbbell,machine], level=intermediate  
**Assertions :**
- workoutTypeFromFocus(['glutes']) → 'glutes-hip'
- split : `['glutes-hip','quad-glutes','glutes-hip']` *(fix P36 confirmé)* ✅

### P87 — focusMuscles=['glutes'] 4j intermediate
**Profil :** goal=fat_loss, days=4, duration=60, equipment=[dumbbell,machine], level=intermediate  
**Assertions :**
- split : `['glutes-hip','quad-glutes','glutes-hip','quad-glutes']` ✅ (alternance sur 4j)

### P88 — focusMuscles=['glutes'] 5j intermediate
**Profil :** goal=fat_loss, days=5, duration=60, equipment=[dumbbell,machine], level=intermediate  
**Assertions :**
- split : `['glutes-hip','quad-glutes','glutes-hip','quad-glutes','glutes-hip']` ✅

### P89 — focusMuscles=['glutes'] 2j intermediate
**Profil :** goal=fat_loss, days=2, duration=60, equipment=[dumbbell,machine], level=intermediate  
**Assertions :**
- split : `['glutes-hip','quad-glutes']` ✅

### P90 — focusMuscles=['chest','back'] 3j intermediate (haut mixte)
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate  
**Assertions :**
- workoutTypeFromFocus(['chest','back']) → 'upper' (hasPush=true, hasPull=true)
- split 3j upper : PPU `['push','pull','upper']` (level≠beginner) ✅

### P91 — focusMuscles=['back','arms'] 3j intermediate
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate  
**Assertions :**
- workoutTypeFromFocus(['back','arms']) → 'pull' (hasPull=true, arms → pas hasUpper seul)
- split 3j pull : `['pull','upper-pull','pull']` ✅

### P92 — **UX-B warning** : focusMuscles=['arms'] en push split
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate, focusMuscles=['arms']  
**Assertions :**
- split PPU : ['push','upper-push','push']
- UX-B : `split.every(t => t === 'push' || t === 'upper-push') && focusMuscles.some(f => f === 'arms' || f === 'shoulders')` = **true** → warning UX-B émis ✅
- "Focus bras en push : le biceps n'est pas ciblé en séance push..."

### P93 — **UX-B warning** : focusMuscles=['shoulders'] en push split
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate, focusMuscles=['shoulders']  
**Assertions :**
- split PPU (shoulders → push) → `['push','upper-push','push']`
- UX-B : focusMuscles.some(f => f === 'arms' || f === 'shoulders') = **true** → warning émis ✅

### P94 — **UX-B absent** : focusMuscles=['chest'] en push (pas d'arms/shoulders)
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate, focusMuscles=['chest']  
**Assertions :**
- split push
- UX-B : focusMuscles.some(f => f === 'arms' || f === 'shoulders') = **false** → UX-B NON émis ✅

### P95 — **splitPreference=brosplit** 5j intermediate salle complète (régression)
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[barbell,dumbbell,cable,machine,bodyweight,pullup_bar], level=intermediate  
**Assertions :**
- split brosplit : ['chest-tri','back-bi','legs','shoulders-arms','upper']
- back-bi[0] compound dos ✅ (tirage vertical non vide)
- seed-deadlift EXCLU de back-bi[0] ✅

### P96 — **splitPreference=arnold** 5j intermediate salle complète (régression)
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[barbell,dumbbell,cable,machine,bodyweight,pullup_bar], level=intermediate  
**Assertions :**
- chest-back[1] compound dos ✅
- seed-deadlift EXCLU ✅

### P97 — **totalWeeks=4** (programme court) intermediate hypertrophy
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate, totalWeeks=4  
**Assertions :**
- Programme de 4 semaines au lieu du défaut (8 semaines intermediate?)
- Phases buildPhases(4) : adapter selon le code
- Phase deload si totalWeeks≥4 : nom='Récup.' *(fix INC-4-RÉSIDUEL confirmé)*

### P98 — **totalWeeks=12** avec phase deload vérifiée
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate, totalWeeks=12  
**Assertions :**
- buildPhases(12) → phases incluent une phase deload
- Phase deload : `name='Récup.'` *(fix INC-4-RÉSIDUEL : aligne avec PHASE_NAME_FR.deload)* ✅
- Phase deload : `focus='deload'` ✅

### P99 — **selectedDays** impact — 3j non consécutifs
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate, selectedDays=[1,3,5] (lun/mer/ven)  
**Assertions :**
- Programme généré avec 3 jours espacés
- Split PPL respecté (push lun, pull mer, legs ven) ✅
- Aucun impact sur la sélection d'exercices vs sans selectedDays

### P100 — **Profil complet** : toutes les options combinées
**Profil :** goal=hypertrophy, days=4, duration=45, equipment=[dumbbell,machine,pullup_bar], level=advanced, focusMuscles=['back','legs'], selectedDays=[2,4,6,7], totalWeeks=8  
**Assertions :**
- workoutTypeFromFocus(['back','legs']) → 'lower_pull'
- split 4j lower_pull : `['lower_pull','lower_pull','lower_pull','lower_pull']` (type fixe, pas d'alternance pour lower_pull)
- adjustedSlotCount(lower_pull, 45, hypertrophy) = max(4, ⌊8×0.75⌋) = **6 slots**
- lower_pull[1] `['back_width','back_thickness']` : seed-pullup (back_width, pullup_bar, pop 3) probable
- Programme 8 semaines, phase deload name='Récup.' ✅
- Aucun warning dos (hasCompoundBack=true via seed-pullup) ✅

---

## Tableau récapitulatif attendu

Chaque profil : `✅ PASS` / `❌ FAIL` / `⚠️ RÉSERVE`

**Note pour l'auditeur :** Lire `src/utils/programGenerator.ts` et `src/data/exercises-seed.json` en entier avant de commencer. Plusieurs assertions demandent d'inspecter le code pour confirmer des comportements (hasPullInSplit exact, workoutTypeFromFocus pour 'core', nombre de slots par type).
