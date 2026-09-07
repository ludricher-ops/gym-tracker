# Audit v9 — Groupe B (P11-P22)
# Fix 2 & Fix 3 : seed-pullover isolation + BUG-BW-PULL élargi

**Date :** 2026-09-07  
**Auditeur :** Claude Sonnet 4.6 (agent)  
**Source code :** `src/utils/programGenerator.ts` + `src/data/exercises-seed.json`

---

## Données confirmées dans le seed

| ID | primaryMuscle | equipment | category | popularity |
|----|--------------|-----------|----------|------------|
| seed-pullover | back_width | dumbbell | **isolation** | 1 |
| seed-row-barbell | back_thickness | barbell | compound | 7 |
| seed-row-dumbbell | back_thickness | dumbbell | compound | 3 |
| seed-row-tbar | back_thickness | barbell | compound | 2 |
| machine-pullover | back_width | machine | isolation | 2 |
| machine-low-row | back_thickness | machine | isolation | 2 |
| seed-pullup | back_width | pullup_bar | compound | 3 |
| bw-inverted-row | back_thickness | pullup_bar | compound | 1 |
| band-row | back_thickness | band | compound | 2 |
| kb-row | back_thickness | kettlebell | compound | 2 |

**Fix 2 confirmé :** `seed-pullover` est bien `category: "isolation"` dans le seed — il sera exclu de tous les slots `compound: true`.

**Fix 3 confirmé dans le code (ligne 1028-1035) :**
```typescript
const backSessionTypes = ['pull', 'back-bi', 'chest-back'] as const
const hasPullInSplit = rawSplit.some((t) => (backSessionTypes as readonly string[]).includes(t))
// Remplacement :
if (t === 'pull' || t === 'back-bi') return 'fullbody-quad'
if (t === 'chest-back') return 'push'
```

**Fix 4 confirmé dans le code (lignes 1050-1051) :**
```typescript
const isGlutesSplit = rawSplit.every((t) => t === 'glutes-hip' || t === 'quad-glutes')
if (!hasCompoundBack && !hasPullInSplit && splitPreference !== 'glutes-focus' && !isGlutesSplit) { ... }
```

**Bodyweight seul :** aucun exercice compound avec primaryMuscle ∈ {back_width, back_thickness, back} en équipement bodyweight pur → `hasCompoundBack = false` pour tous les profils BW-only.

---

## Résultats profil par profil

---

### P11 — DB + barbell · PPL pull[0] → barbell-row prime (ex-P34)

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell, barbell], level=intermediate  
**Split :** ['push','pull','legs']

**Simulation pull[0]** `{ muscles: ['back_width','back_thickness'], compound: true }` :
- seed-pullover (dumbbell, isolation) → **filtré** (compound strict) ✅
- Candidats compound restants avec barbell ou dumbbell : seed-row-barbell (back_thickness, pop 7), seed-row-dumbbell (back_thickness, pop 3), seed-row-tbar (back_thickness, pop 2)
- seed-deadlift (back primary, ∉ ['back_width','back_thickness']) → exclu
- slotPrimary = back_width → tous back_thickness → rank 1 (tie), pas de strengthEquipmentPrio (hypertrophy), popularité desc : **seed-row-barbell (pop 7) sélectionné** ✅

**Simulation pull[2]** `{ muscles: ['back_thickness','back_width','back'], compound: false }` :
- Isolation dumbbell disponible : seed-pullover (back_width, pop 1)
- slotPrimary = back_thickness → seed-pullover est back_width → rank 1 (pas de match slotPrimary exact), mais seul isolant dos dumbbell → sélectionné ✅

**Résultat :** PASS  
**Slots clés :**
- pull[0] : seed-row-barbell (back_thickness, pop 7) — seed-pullover exclu du slot compound ✅
- pull[2] : seed-pullover (isolation, back_width, dumbbell) — maintenant en slot isolation ✅  
**Conclusion :** La reclassification isolation de seed-pullover libère pull[0] pour seed-row-barbell, le composé barbell le plus populaire.

---

### P12 — DB seul · PPL pull[0] → seed-row-dumbbell prime

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell], level=intermediate  
**Split :** ['push','pull','legs']

**Simulation pull[0]** `{ muscles: ['back_width','back_thickness'], compound: true }` :
- seed-pullover (dumbbell, isolation) → **filtré** ✅
- seed-row-dumbbell (dumbbell, compound, back_thickness) → **seul candidat compound dos dumbbell** ✅

**hasCompoundBack** = seed-row-dumbbell ∈ available (compound, back_thickness) → **true** → pas de BUG-BW-PULL, pas de SEED-BW-NOBACK ✅

**Simulation pull[2]** : seed-pullover (isolation, dumbbell) → présent en slot isolation ✅

**Résultat :** PASS  
**Slots clés :**
- pull[0] : seed-row-dumbbell (seul compound dos dumbbell disponible) ✅
- pull[2] : seed-pullover (isolation, maintenant au bon slot) ✅  
**Conclusion :** Dumbbell seul → seed-row-dumbbell prend pull[0] correctement ; seed-pullover apparaît en isolation, pas en compound.

---

### P13 — BW · PPL → BUG-BW-PULL (régression — comportement inchangé)

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight], level=intermediate  
**Split PPL :** ['push','pull','legs']

**hasCompoundBack** = aucun composé dos en bodyweight pur → **false**  
**hasPullInSplit** = 'pull' ∈ ['pull','back-bi','chest-back'] → **true**  
**BUG-BW-PULL déclenché** : 'pull' → 'fullbody-quad' ✅  
**Split résultant :** ['push','fullbody-quad','legs'] ✅  
**Warning émis** ✅  
**SEED-BW-NOBACK absent** (hasPullInSplit=true, condition court-circuitée) ✅

**Résultat :** PASS  
**Slots clés :** pull absent (remplacé par fullbody-quad) ✅  
**Conclusion :** Régression confirmée — BW + PPL déclenche toujours BUG-BW-PULL, comportement inchangé.

---

### P14 — BW · Brosplit → BUG-BW-PULL élargi back-bi (ex-P54 GAP)

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[bodyweight], level=advanced, splitPreference=brosplit  
**Split brosplit 5j :** ['chest-tri','back-bi','legs','shoulders-arms','upper']

**hasCompoundBack** = false (BW uniquement)  
**hasPullInSplit** = 'back-bi' ∈ ['pull','back-bi','chest-back'] → **true** ✅ (Fix 3)  
**BUG-BW-PULL déclenché** ✅  
**'back-bi' → 'fullbody-quad'** ✅  
**Split résultant :** ['chest-tri','fullbody-quad','legs','shoulders-arms','upper'] ✅  
**Warning émis** ✅  
**SEED-BW-NOBACK absent** (hasPullInSplit=true) ✅

**Résultat :** PASS  
**Slots clés :** back-bi absent (remplacé par fullbody-quad), warning correctement émis ✅  
**Conclusion :** GAP P54 corrigé — 'back-bi' est maintenant inclus dans backSessionTypes, le remplacement fullbody-quad est déclenché pour BW + brosplit.

---

### P15 — BW · Arnold → BUG-BW-PULL élargi chest-back (variante P54)

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[bodyweight], level=advanced, splitPreference=arnold  
**Split Arnold 5j :** ['chest-back','shoulders-arms','legs','chest-back','shoulders-arms']

**hasCompoundBack** = false (BW uniquement)  
**hasPullInSplit** = 'chest-back' ∈ ['pull','back-bi','chest-back'] → **true** ✅ (Fix 3)  
**BUG-BW-PULL déclenché** ✅  
**'chest-back' → 'push'** (remplacement spécifique, différent de back-bi→fullbody-quad) ✅  
**Split résultant :** ['push','shoulders-arms','legs','push','shoulders-arms'] ✅  
**Warning émis** ✅  
**SEED-BW-NOBACK absent** (hasPullInSplit=true) ✅

**Résultat :** PASS  
**Slots clés :** chest-back absent (remplacé par push), warning émis ✅  
**Conclusion :** Variante Arnold couverte par Fix 3 — 'chest-back' remplacé par 'push' (et non fullbody-quad), ce qui est sémantiquement correct pour une séance Arnold BW.

---

### P16 — BW · Upper-lower 4j → SEED-BW-NOBACK (régression — comportement inchangé)

**Profil :** goal=hypertrophy, days=4, duration=60, equipment=[bodyweight], level=intermediate  
**Split upper-lower 4j :** ['upper-push','lower-quad','upper-pull','lower-hip']

**hasCompoundBack** = false  
**hasPullInSplit** = 'upper-push' ∉ backSessionTypes, 'lower-quad' ∉, 'upper-pull' ∉ (n'est PAS dans ['pull','back-bi','chest-back']), 'lower-hip' ∉ → **false** ✅  
**isGlutesSplit** = 'upper-push' ≠ 'glutes-hip'/'quad-glutes' → **false** ✅  
**splitPreference** ≠ 'glutes-focus' ✅  
**Condition SEED-BW-NOBACK :** !false && !false && true && !false = **true → WARNING ÉMIS** ✅

**Résultat :** PASS  
**Slots clés :** SEED-BW-NOBACK émis comme attendu ✅  
**Conclusion :** Régression confirmée — upper-pull ne fait pas partie de backSessionTypes, SEED-BW-NOBACK est toujours émis pour un split BW upper-lower sans composé dos.

---

### P17 — BW · Fat_loss PPF → BUG-BW-PULL ('pull' strict — régression)

**Profil :** goal=fat_loss, days=3, duration=60, equipment=[bodyweight], level=intermediate  
**Split PPF :** ['push','pull','fullbody-quad']

**hasCompoundBack** = false  
**hasPullInSplit** = 'pull' ∈ backSessionTypes → **true** ✅  
**BUG-BW-PULL déclenché** : 'pull' → 'fullbody-quad' ✅  
**Split résultant :** ['push','fullbody-quad','fullbody-quad'] ✅  
**Warning émis** ✅

**Résultat :** PASS  
**Slots clés :** pull → fullbody-quad (régression correcte) ✅  
**Conclusion :** fat_loss BW avec split PPF déclenche toujours BUG-BW-PULL via 'pull' strict ; comportement inchangé confirmé.

---

### P18 — BW · Fullbody 3j → SEED-BW-NOBACK (régression inchangée)

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight], level=beginner  
**Split :** ['fullbody-quad','fullbody-hip','fullbody-quad']

**hasCompoundBack** = false  
**hasPullInSplit** = 'fullbody-quad' ∉ backSessionTypes, 'fullbody-hip' ∉ → **false** ✅  
**isGlutesSplit** = false ✅  
**splitPreference** non défini ≠ 'glutes-focus' ✅  
**SEED-BW-NOBACK émis** ✅

**Résultat :** PASS  
**Slots clés :** SEED-BW-NOBACK émis correctement ✅  
**Conclusion :** Fullbody BW débutant → warning inchangé, régression confirmée.

---

### P19 — BW · focusMuscles=['glutes'] sans splitPreference → PAS de warning (ex-P58)

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight], level=intermediate, focusMuscles=['glutes']  
**splitPreference :** undefined → 'auto'

**workoutTypeFromFocus(['glutes'])** = 'glutes-hip' (code ligne 448-449) ✅  
**selectSplit** → focusType='glutes-hip' → alternance glutes-hip/quad-glutes :  
→ **rawSplit = ['glutes-hip','quad-glutes','glutes-hip']** ✅

**hasCompoundBack** = false  
**hasPullInSplit** = 'glutes-hip' ∉ backSessionTypes, 'quad-glutes' ∉ → **false** ✅  
**isGlutesSplit** = rawSplit.every(t => t==='glutes-hip'||t==='quad-glutes') → every(['glutes-hip','quad-glutes','glutes-hip']) → **true** ✅  
**splitPreference** undefined ≠ 'glutes-focus' (la condition porte sur la valeur littérale, non le split résultant) ✅

**Condition SEED-BW-NOBACK :**  
`!hasCompoundBack(true) && !hasPullInSplit(true) && splitPreference!=='glutes-focus'(true) && !isGlutesSplit(false)` → **false → WARNING SUPPRIMÉ** ✅

**Résultat :** PASS  
**Slots clés :** aucun warning SEED-BW-NOBACK ✅  
**Conclusion :** P58 corrigé — focusMuscles=['glutes'] auto-détecte un split tout-glutes, isGlutesSplit=true court-circuite le warning inutile.

---

### P20 — BW · focusMuscles=['glutes'] 4j et 5j → PAS de warning (variante P58)

**Profil 4j :** rawSplit = ['glutes-hip','quad-glutes','glutes-hip','quad-glutes']  
isGlutesSplit = tous éléments ∈ {glutes-hip, quad-glutes} → **true** → warning supprimé ✅

**Profil 5j :** rawSplit = ['glutes-hip','quad-glutes','glutes-hip','quad-glutes','glutes-hip']  
isGlutesSplit = **true** → warning supprimé ✅

**Résultat :** PASS  
**Slots clés :** isGlutesSplit=true pour 4j et 5j ✅  
**Conclusion :** La généralisation fonctionne pour tous les daysPerWeek avec focusMuscles=['glutes'].

---

### P21 — BW + band · brosplit → hasCompoundBack via band-row (régression)

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[bodyweight, band], level=advanced, splitPreference=brosplit  
**Split brosplit 5j :** ['chest-tri','back-bi','legs','shoulders-arms','upper']

**hasCompoundBack** :
- band-row (equipment=band, category=compound, primaryMuscle=back_thickness) → band ∈ allowed → **true** ✅

Puisque hasCompoundBack=true, la condition `(!hasCompoundBack && hasPullInSplit)` = false → **BUG-BW-PULL NON déclenché** ✅  
**Split maintenu intact** ✅  
**SEED-BW-NOBACK** : !hasCompoundBack=false → condition false → **pas de warning** ✅

**back-bi[0]** `{ muscles: ['back_width','back_thickness'], compound: true }` :
- band-row (back_thickness, compound, band, pop 2) → candidat unique compound dos avec band
- **back-bi[0] = band-row** ✅

**Résultat :** PASS  
**Slots clés :**
- back-bi[0] : band-row (compound, band) ✅
- Aucun remplacement, split brosplit maintenu ✅  
**Conclusion :** BW + band → band-row satisfait hasCompoundBack, les séances back-bi sont générées normalement ; pas de faux positif BUG-BW-PULL.

---

### P22 — BW · 2j fullbody (régression — SEED-BW-NOBACK inchangé)

**Profil :** goal=fat_loss, days=2, duration=60, equipment=[bodyweight], level=beginner  
**Split :** ['fullbody-quad','fullbody-hip']

**hasCompoundBack** = false  
**hasPullInSplit** = 'fullbody-quad' ∉ backSessionTypes, 'fullbody-hip' ∉ → **false** ✅  
**isGlutesSplit** = false ✅  
**splitPreference** non défini ≠ 'glutes-focus' ✅  
**SEED-BW-NOBACK émis** ✅

**Résultat :** PASS  
**Slots clés :** warning SEED-BW-NOBACK émis correctement ✅  
**Conclusion :** fat_loss BW 2j fullbody → warning inchangé, régression confirmée.

---

## Synthèse Groupe B

| Profil | Titre résumé | Résultat |
|--------|-------------|---------|
| P11 | DB+barbell PPL — barbell-row en pull[0] | **PASS** |
| P12 | DB seul PPL — dumbbell-row en pull[0] | **PASS** |
| P13 | BW PPL — BUG-BW-PULL 'pull' (régression) | **PASS** |
| P14 | BW brosplit — BUG-BW-PULL élargi back-bi (ex-P54) | **PASS** |
| P15 | BW Arnold — BUG-BW-PULL élargi chest-back | **PASS** |
| P16 | BW upper-lower — SEED-BW-NOBACK (régression) | **PASS** |
| P17 | BW fat_loss PPF — BUG-BW-PULL 'pull' (régression) | **PASS** |
| P18 | BW fullbody débutant — SEED-BW-NOBACK (régression) | **PASS** |
| P19 | BW glutes auto 3j — warning supprimé (ex-P58) | **PASS** |
| P20 | BW glutes auto 4j+5j — warning supprimé (variante P58) | **PASS** |
| P21 | BW+band brosplit — band-row satisfait hasCompoundBack | **PASS** |
| P22 | BW fat_loss 2j — SEED-BW-NOBACK (régression) | **PASS** |

**Score global Groupe B : 12/12 PASS — 0 FAIL — 0 RÉSERVE**

---

## Observations transversales

### Fix 2 (seed-pullover → isolation)
Vérifié directement dans le seed : `"category": "isolation"`. Tous les slots `compound: true` utilisent `candidates.filter(ex => ex.category === 'compound')` — seed-pullover est donc exclu mécaniquement. P11 et P12 le confirment : seed-row-barbell (pop 7) et seed-row-dumbbell (pop 3) prennent correctement pull[0] selon l'équipement disponible.

### Fix 3 (backSessionTypes élargi)
Le tableau `['pull', 'back-bi', 'chest-back']` est bien en place (ligne 1028). Les remplacement sont asymétriques et corrects sémantiquement : `pull/back-bi → fullbody-quad` (séance complète du corps car la séance tirage disparaît) et `chest-back → push` (on garde la composante poussée de la séance antagoniste). P14 valide back-bi, P15 valide chest-back.

### Fix 4 (isGlutesSplit — exception glutes auto)
Le prédicat `rawSplit.every(t => t === 'glutes-hip' || t === 'quad-glutes')` couvre correctement 2j, 3j, 4j, 5j avec focusMuscles=['glutes'] auto. Il ne se déclenche pas pour un split fullbody ou upper-lower (P18, P16), ce qui évite les faux négatifs. La condition check splitPreference !== 'glutes-focus' est maintenue en amont pour le cas explicite, et `!isGlutesSplit` gère le cas implicite auto.

### Régressions
Tous les profils de régression (P13, P16, P17, P18, P22) confirment que les comportements antérieurs aux fixes sont inchangés. Le profil P21 (BW+band) démontre que l'ajout d'un équipement compound (band-row) neutralise correctement BUG-BW-PULL sans faux positif.

### Point d'attention (non bloquant)
P15 produit un split Arnold BW remplacé par ['push','shoulders-arms','legs','push','shoulders-arms']. La vérification UX-5 (déséquilibre push/pull) s'applique en aval sur ce split modifié : hasPullSession sera false (push, shoulders-arms, legs, push, shoulders-arms n'incluent aucun type pull/fullbody/glutes), hasPushSession sera true → le warning UX-5 "Déséquilibre push/pull" sera émis en complément du warning BUG-BW-PULL. Ce double warning est correct et attendu pour BW Arnold : l'utilisateur est bien informé que son programme BW ne peut pas couvrir le dos.
