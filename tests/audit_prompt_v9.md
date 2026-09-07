# Audit v9 — Vérification des réserves audit v8

**Date :** 2026-09-07  
**Objectif :** Valider les 4 fixes apportés après audit v8 sur les profils qui avaient échoué ou été réservés. Vérifier aussi les régressions éventuelles.

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

## GROUPE A — Fix 1 : machine isolation back (P01-P10)

Tous les profils machine-only. Exercices composés machine : `machine-lat-pulldown` (back_width, compound, pop 2) et `seed-row-machine` (back_thickness, compound, pop 1). Exercices isolation machine : `machine-pullover` (back_width, isolation, pop 2) et `machine-low-row` (back_thickness, isolation, pop 2).

### P01 — Machine · PPL 45min hypertrophy intermediate (ex-P06)
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

### P02 — Machine · PPL 90min hypertrophy advanced (ex-P07)
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

### P03 — Machine · Brosplit back-bi 45min advanced (ex-P13)
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

### P04 — Machine · Arnold chest-back 45min intermediate (ex-P14)
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

### P05 — Machine · PPL 20min hypertrophy intermediate
**Profil :** goal=hypertrophy, days=3, duration=20, equipment=[machine], level=intermediate  
**Slots pull 20min :** max(2, ⌊8×0.5⌋) = max(2,4) = **4 slots**  
**Assertions :**
- pull[0] machine-lat-pulldown ✅
- pull[1] seed-row-machine ✅
- pull[2] machine-low-row ✅
- pull[3] biceps machine ✅
- **4 slots pull — aucun vide** ✅

### P06 — Machine · PPL 60min hypertrophy intermediate
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine], level=intermediate  
**Slots pull 60min :** base=8, 60min autres → **8 slots**  
**Assertions :**
- pull[0-1] composés ✅
- pull[2] machine-low-row ✅
- pull[7] machine-pullover (slot 8 : back_width isolation) ✅
- **Aucun slot isolation dos vide** ✅

### P07 — Machine · Brosplit back-bi 20min intermediate
**Profil :** goal=hypertrophy, days=5, duration=20, equipment=[machine], level=intermediate, splitPreference=brosplit  
**Slots back-bi 20min :** max(2, ⌊8×0.5⌋) = **4 slots**  
**Assertions :**
- back-bi[0] machine-lat-pulldown, back-bi[1] seed-row-machine ✅
- back-bi[2] biceps machine ✅
- back-bi[3] machine-low-row ✅
- **4 slots — aucun vide** ✅

### P08 — Machine · Back-bi 90min advanced (régression 8 slots)
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

### P09 — Machine + pullup_bar · PPL 45min (régression — pas de régression pullup)
**Profil :** goal=hypertrophy, days=3, duration=45, equipment=[machine, pullup_bar], level=intermediate  
**Assertions :**
- pull[0] `['back_width','back_thickness'] compound:true` : candidats = machine-lat-pulldown (back_width, pop 2), seed-pullup (back_width, pop 3), seed-row-machine (back_thickness, pop 1) → slotPrimary=back_width → tie back_width : machine-lat-pulldown (pop 2) vs seed-pullup (pop 3) → **seed-pullup prime** (pop 3 > pop 2) ✅
- pull[2] isolation dos : machine-low-row (machine, pop 2) ✅
- **Régression pullup_bar non impactée** ✅

### P10 — Machine · Strength INC-1 fullbody 60min (régression — no isolation dos)
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

### P11 — DB + barbell · PPL pull[0] → barbell-row prime (ex-P34)
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

### P12 — DB seul · PPL pull[0] → seed-row-dumbbell prime
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell], level=intermediate  
**Candidates pull[0] `['back_width','back_thickness'] compound:true` :**
- seed-pullover : **exclus** (isolation)
- seed-row-dumbbell : back_thickness, compound, dumbbell ← seul candidat compound dos dumbbell
**Assertions :**
- hasCompoundBack = seed-row-dumbbell (back_thickness, compound) → **true** ✅
- pull[0] = **seed-row-dumbbell** ✅
- pull[2] isolation dos → seed-pullover (back_width, isolation, dumbbell) — maintenant en slot isolation ✅
- **Pas de SEED-BW-NOBACK** (hasCompoundBack=true via seed-row-dumbbell) ✅

### P13 — BW · PPL → BUG-BW-PULL (régression — comportement inchangé)
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight], level=intermediate  
**hasPullInSplit** = rawSplit PPL → 'pull' → true → **BUG-BW-PULL émis** ✅
- 'pull' → remplacé par 'fullbody-quad' ✅
- SEED-BW-NOBACK absent (hasPullInSplit=true) ✅

### P14 — BW · Brosplit → BUG-BW-PULL élargi back-bi (ex-P54 GAP)
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[bodyweight], level=advanced, splitPreference=brosplit  
**Split brosplit :** ['chest-tri','back-bi','legs','shoulders-arms','upper']  
**hasPullInSplit** = rawSplit → 'back-bi' → `backSessionTypes.includes('back-bi')` = **true** ✅
- BUG-BW-PULL émis ✅
- 'back-bi' → remplacé par **'fullbody-quad'** ✅
- split résultant : ['chest-tri','fullbody-quad','legs','shoulders-arms','upper'] ✅
- SEED-BW-NOBACK absent (hasPullInSplit=true) ✅
- **Warning émis : "Séance(s) dos remplacée(s)..."** ✅
- **C'était le GAP P54 — maintenant corrigé** ✅

### P15 — BW · Arnold → BUG-BW-PULL élargi chest-back (variante P54)
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[bodyweight], level=advanced, splitPreference=arnold  
**Split Arnold :** contient 'chest-back'  
**hasPullInSplit** = rawSplit → 'chest-back' → `backSessionTypes.includes('chest-back')` = **true** ✅
- BUG-BW-PULL émis ✅
- 'chest-back' → remplacé par **'push'** (différent de back-bi→fullbody-quad) ✅
- Warning émis ✅
- SEED-BW-NOBACK absent ✅

### P16 — BW · Upper-lower 4j → SEED-BW-NOBACK (régression — comportement inchangé)
**Profil :** goal=hypertrophy, days=4, duration=60, equipment=[bodyweight], level=intermediate  
**Split :** ['upper-push','lower-quad','upper-pull','lower-hip']  
**hasPullInSplit** = 'upper-pull' → `backSessionTypes.includes('upper-pull')` = **false** (non dans la liste) ✅
- isGlutesSplit = false (upper-push, lower-quad… ≠ glutes-hip/quad-glutes) ✅
- splitPreference ≠ 'glutes-focus' ✅
- **SEED-BW-NOBACK émis** ✅ (comportement attendu, inchangé)

### P17 — BW · Fat_loss PPF → BUG-BW-PULL ('pull' strict — régression)
**Profil :** goal=fat_loss, days=3, duration=60, equipment=[bodyweight], level=intermediate  
**Split PPF :** ['push','pull','fullbody-quad']  
**hasPullInSplit** = 'pull' → true → **BUG-BW-PULL** ✅

### P18 — BW · Fullbody 3j → SEED-BW-NOBACK (régression inchangée)
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight], level=beginner  
**Split :** ['fullbody-quad','fullbody-hip','fullbody-quad']  
**hasPullInSplit** = false, isGlutesSplit = false, splitPreference ≠ glutes-focus ✅
- **SEED-BW-NOBACK émis** ✅

### P19 — BW · focusMuscles=['glutes'] sans splitPreference → PAS de warning (ex-P58)
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight], level=intermediate, focusMuscles=['glutes']  
**workoutTypeFromFocus(['glutes']) → 'glutes-hip'**  
**selectSplit avec glutes-hip :** fix P36 → alternance ['glutes-hip','quad-glutes','glutes-hip']  
**rawSplit = ['glutes-hip','quad-glutes','glutes-hip']**  
**isGlutesSplit** = rawSplit.every(t => t==='glutes-hip' || t==='quad-glutes') = **true** ✅
**hasCompoundBack** (BW) = false (pas de pullup, pas de barre, pas de dumbbell)  
**hasPullInSplit** = false  
**Condition SEED-BW-NOBACK :** !hasCompoundBack && !hasPullInSplit && splitPreference !== 'glutes-focus' && **!isGlutesSplit** = false → **WARNING SUPPRIMÉ** ✅  
**C'était le problème de P58 — maintenant corrigé** ✅

### P20 — BW · focusMuscles=['glutes'] 4j et 5j → PAS de warning (variante P58)
**Profil 4j :** rawSplit=['glutes-hip','quad-glutes','glutes-hip','quad-glutes'] → isGlutesSplit=true → pas de warning ✅  
**Profil 5j :** rawSplit=['glutes-hip','quad-glutes','glutes-hip','quad-glutes','glutes-hip'] → isGlutesSplit=true → pas de warning ✅

### P21 — BW + band · brosplit → hasPullInSplit via back-bi (régression)
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[bodyweight, band], level=advanced, splitPreference=brosplit  
**hasCompoundBack** = band-row (back_thickness, compound, band) → **true** → BUG-BW-PULL et SEED-BW-NOBACK absents ✅
- Split brosplit maintenu sans remplacement ✅
- back-bi[0] compound : band-row ou bw-inverted-row ✅

### P22 — BW · 2j fullbody (régression — SEED-BW-NOBACK inchangé)
**Profil :** goal=fat_loss, days=2, duration=60, equipment=[bodyweight], level=beginner  
**Split :** ['fullbody-quad','fullbody-hip']  
**hasPullInSplit** = false, isGlutesSplit = false → **SEED-BW-NOBACK émis** ✅

---

## GROUPE C — Régressions globales et cas limites (P23-P30)

### P23 — Salle complète · PPL 60min intermediate (régression globale)
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell, dumbbell, cable, pullup_bar, machine], level=intermediate  
**Assertions :**
- pull[0] : candidats compound back_width = seed-pullup (pop 3), seed-lat-pulldown (pop 3), machine-lat-pulldown (pop 2). machine-lat-pulldown (pop 2) arrive derrière. Tie pullup/lat-pulldown → **l'un des deux** (random parmi top-3) ✅
- seed-pullover **absent du slot compound** ✅ (maintenant isolation)
- pull[2] isolation dos : seed-pullover (back_width, isolation, dumbbell, pop 1) OU seed-pullover-dumbbell (back_thickness, isolation) OU autre isolation dos
- Deadlift exclu de pull[0] ✅
- Aucune régression ✅

### P24 — Machine + câble · upper-lower 4j 60min (régression — slot upper-pull[0])
**Profil :** goal=hypertrophy, days=4, duration=60, equipment=[machine, cable], level=intermediate  
**Split :** ['upper-push','lower-quad','upper-pull','lower-hip']  
**Slot upper-pull[0] `['back_width','back_thickness'] compound:true` :**
- seed-lat-pulldown (cable, back_width, pop 3) → slotPrimary match → prime ✅
- machine-lat-pulldown (machine, back_width, pop 2) → slotPrimary match → pop 2 < pop 3
- **seed-lat-pulldown sélectionné** ✅
**Slot upper-pull[2] isolation dos `['back_thickness','back_width','back']` :**
- machine-low-row (machine, back_thickness, pop 2) ou seed-pullover-cable (cable, back_thickness, pop ?) ✅

### P25 — Dumbbell · Arnold 5j 60min intermediate (régression — pullover en isolation)
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[dumbbell], level=intermediate, splitPreference=arnold  
**Séance chest-back :**
- chest-back[1] `['back_width','back_thickness'] compound:true` → seed-row-dumbbell (back_thickness, compound) — seul compound dos dumbbell ✅
- seed-pullover exclu du slot compound ✅
- chest-back[5] isolation dos → **seed-pullover** (back_width, isolation, dumbbell, pop 1) ✅
- **seed-pullover bien présent en isolation** ✅

### P26 — Barbell · PPL 60min strength (régression — barbell-row compound)
**Profil :** goal=strength, days=3, duration=60, equipment=[barbell], level=intermediate  
**pull[0] strength :** slotPrimary=back_width → tous candidats barbell dos → back_thickness (seed-row-barbell) ≠ slotPrimary → rank 1 → usedGlobally (non utilisé) → strengthEquipmentPrio → popularité. **seed-row-barbell sélectionné** (seul compound dos barbell disponible, deadlift exclu) ✅
- seed-pullover : dumbbell non dispo → filtré ✅

### P27 — Kettlebell · PPL 60min intermediate (régression — kb-row)
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[kettlebell], level=intermediate  
**hasPullInSplit** = rawSplit PPF ou PPL → 'pull' → BUG-BW-PULL si pas de compound dos KB
**hasCompoundBack** = kb-row (back_thickness, compound) ou kb-deadlift (back, compound) → **true** ✅
- Pas de warning BUG-BW-PULL ✅
- pull[0] = kb-row (back_thickness, compound) — seul candidat compound dos KB ✅

### P28 — Machine · glutes-focus 3j (régression — machine-pullover en slot posture)
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine], splitPreference=glutes-focus  
**Split :** ['glutes-hip','quad-glutes','glutes-hip']  
**hasCompoundBack** = machine-lat-pulldown → true  
**Slot glutes-hip[3] `['back_width','back_thickness','back'] compound:false`** → slotPrimary=back_width → **machine-pullover** (back_width, isolation, pop 2) ✅
- SEED-BW-NOBACK absent (splitPreference='glutes-focus') ✅

### P29 — Machine · focus back 3j (régression — slots isolation dos machine)
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine], focusMuscles=['back']  
**workoutTypeFromFocus(['back']) → 'pull' → split ['pull','upper-pull','pull']**  
**pull[2] isolation dos :** machine-low-row ✅  
**Aucun slot vide** ✅

### P30 — BW · Brosplit arnold 5j avancé (régression combinée fix P54 + P58)
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[bodyweight], level=advanced  
**splitPreference=arnold** → Arnold contient 'chest-back'  
**hasPullInSplit** = 'chest-back' → true → BUG-BW-PULL  
- 'chest-back' → remplacé par 'push' ✅
- Warning émis ✅
- isGlutesSplit = false (chest-tri, back-bi, legs, shoulders… ≠ tout-glutes) ✅
- SEED-BW-NOBACK absent (hasPullInSplit=true) ✅

---

## Instructions pour les agents

**Pour chaque profil :**
1. Simuler le générateur avec les paramètres donnés
2. Vérifier **chaque assertion** (PASS si l'assertion est vérifiée, FAIL sinon)
3. Écrire une conclusion en une ligne mentionnant les exercices sélectionnés aux slots clés
4. Signaler toute incohérence ou comportement inattendu en RÉSERVE

**Format de réponse :**
```
### Pxx — Titre
**Résultat :** PASS | FAIL | RÉSERVE
**Slots clés :**
- pull[0] / back-bi[0] / chest-back[1] : [exercice sélectionné]
- pull[2] / back-bi[3] / chest-back[5] : [exercice isolation sélectionné]
**Conclusion :** [phrase unique résumant le résultat]
```

**À la fin :** synthèse groupée PASS/FAIL/RÉSERVE + observations.
