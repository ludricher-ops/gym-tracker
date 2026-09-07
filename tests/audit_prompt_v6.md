# Audit v6 — gym-tracker / programGenerator.ts
**Date :** 2026-09-07  
**Objectif :** Vérification des corrections post-audit v5 + régression complète des fixes v4  
**Code cible :** commit b3f22a6 (post BUG-HIP-BACK + BUG-BW-PULL + UX-NORDIC-BEGINNER)

---

## Contexte des fixes depuis v5

### BUG-BW-PULL (nouveau)
Après `selectSplit`, si `rawSplit` contient `'pull'` ET qu'aucun exercice compound de dos
(`primaryMuscle ∈ {back_width, back_thickness, back}`, `category === 'compound'`) n'est disponible :
- Chaque `'pull'` dans le split est remplacé par `'fullbody-quad'`
- Un warning est ajouté en tête : "Séance Pull remplacée par Full Body…"

Équipements avec exercices de dos compound disponibles (dans le seed) :
- `barbell` : deadlift, bent-over row
- `dumbbell` : dumbbell row, dumbbell deadlift
- `cable` : lat pulldown cable, seated cable row
- `machine` : lat pulldown machine, seated row machine
- `pullup_bar` : pull-up, chin-up, inverted row
- `kettlebell` : KB deadlift, KB swing (selon seed)
- `bodyweight` SEUL → AUCUN exercice de dos compound (pullup_bar est séparé)
- `band` SEUL → AUCUN exercice de dos compound

### BUG-HIP-BACK (nouveau)
`SLOTS['fullbody-hip'][2]` (slot dos compound) :
- Avant : `muscles: ['back_width', 'back']`
- Après : `muscles: ['back_width', 'back_thickness', 'back']`
- Effet : seed-row-dumbbell (primaryMuscle=back_thickness) est maintenant candidat pour fullbody-hip en DB-only ; band-row aussi en BAND+BW

### UX-NORDIC-BEGINNER (nouveau)
`bw-nordic-curl.popularity` : 2 → 1  
Effet : le nordic curl est dé-priorisé dans le tri de `pickExercise` (score popularité plus faible)

### Fixes v4 encore actifs (régression obligatoire)
- **INC-1** : strength + 3j → fullbody×3 (pas PPL)
- **BUG-A1** : 5j mass+intermediate → `['push','pull','lower-quad','upper','lower-hip']` (pas legs/lower)
- **BUG-A3** : adjustedSpec 45min → inchangé (pas de réduction séries)
- **BUG-A2** : templates push/pull/lower-quad/lower-hip/chest-tri étendus à 8 slots (90min fonctionnel)
- **BUG-C2** : `usedGlobally` trié AVANT `strengthEquipmentPrio`
- **BUG-D6** : glutes-focus passe par `incompatibleReason` (plus hardcoded disabled:false)
- **INC-4** : phaseLabel `'Récup.'` (plus `'Décharge'`)
- **BUG-C5** : hip-adduction-machine.primaryMuscle = `'hamstrings'` (plus `'glutes'`)

---

## Formules de référence (code actuel)

### adjustedSlotCount(base, duration, goal)
| Duration | Strength | Autres goals |
|----------|----------|--------------|
| 20 min | max(2, floor(base×0.5)) | max(2, floor(base×0.5)) |
| 45 min | max(3, floor(base×0.75)) | max(3, floor(base×0.75)) |
| 60 min | max(4, floor(base×0.5)) | base |
| 90 min | min(base, 5) | min(base+2, 8) |

### adjustedSpec(spec, duration)
- duration >= 45 → spec inchangé
- duration = 20 → sets = max(2, floor(sets×0.5))

### Tailles des templates (SLOTS)
| Type | Slots | Note |
|------|-------|------|
| push | 6 | slot 6=shoulders_rear, slot 7-8 bonus 90min |
| pull | 6 | slot 7-8 bonus 90min |
| legs | 6 | |
| upper | 8 | |
| lower | 6 | |
| upper-push | 8 | |
| upper-pull | 8 | |
| lower-quad | 6 (+2 à 90min) | |
| lower-hip | 6 (+2 à 90min) | |
| fullbody-quad | 9 | |
| fullbody-hip | 9 | slot dos = back_width+back_thickness+back (fix) |
| lower_pull | 8 | deadlift+tirage+squat+iso |
| lower_push | 9 | squat+hip+lunge+iso |
| chest-back | 8 | Arnold |
| shoulders-arms | 7 | Arnold |
| chest-tri | 8 | Bro |
| back-bi | 8 | Bro |
| glutes-hip | 7 | |
| quad-glutes | 7 | |

### selectSplit (auto) — cas clés
| Days | Goal | Level | Split |
|------|------|-------|-------|
| 2 | any | any | fullbody-quad + fullbody-hip |
| 3 | strength | intermediate | fullbody×3 (INC-1) |
| 3 | hypertrophy | intermediate | push+pull+legs |
| 3 | any | beginner | fullbody×3 |
| 4 | mass (str/hyp) | any | upper-push+lower-quad+upper-pull+lower-hip |
| 4 | non-mass | intermediate | push+pull+lower-quad+fullbody-quad |
| 5 | mass | intermediate | push+pull+lower-quad+upper+lower-hip (BUG-A1) |

---

## Instructions pour les agents

Pour chaque profil :
1. Lire `src/utils/programGenerator.ts` (focus : `selectSplit`, `adjustedSlotCount`, `adjustedSpec`, `SLOTS`, `generateProgramDraft`, BUG-BW-PULL fix)
2. Lire `src/data/exercises-seed.json` si besoin (équipements, popularité)
3. Simuler manuellement la génération du programme
4. Vérifier chaque assertion (PASS/FAIL)
5. Donner un verdict par profil + tableau de synthèse + liste des bugs

**Format de sortie :**
- Analyse détaillée par profil (étapes de génération)
- Tableau final : `| Profil | Assertions clés | Verdict | Réserves coach |`
- Section "Bugs / anomalies" listant tous les FAIL

---

## Groupe A — P01–P12 : Régression BUG-BW-PULL (vérification du fix)

### P01 — [BUG-BW-PULL-FIXED] PPL en BW pur → doit être remplacé
```
goal: hypertrophy, days: 3, duration: 60, equipment: [bodyweight], level: intermediate
splitPreference: auto
```
**Assertions :**
- rawSplit sélectionné par selectSplit : `['push', 'pull', 'legs']` (hypertrophy+3j+intermediate)
- hasCompoundBack = false (bodyweight seul, aucun exercice dos compound dans le seed BW)
- Split final : `['push', 'fullbody-quad', 'legs']` (pull → fullbody-quad)
- generatorWarnings[0] contient "Séance Pull remplacée par Full Body"
- Séance fullbody-quad (remplaçant) : contient des exercices de dos (slot back_width+back_thickness+back compound → null → warning BUG-5, mais autres slots OK)
- Programme non-vide : push et legs fonctionnels

### P02 — [BUG-BW-PULL-FIXED] PPL 5j en BW+band → doit être remplacé
```
goal: hypertrophy, days: 5, duration: 60, equipment: [bodyweight, band], level: intermediate
splitPreference: auto
```
**Assertions :**
- rawSplit : `['push', 'pull', 'lower-quad', 'upper', 'lower-hip']` (mass+5j+intermediate)
- hasCompoundBack : bande = band-row ? Vérifier le seed — band-row.primaryMuscle et category
  - Si band-row existe avec category=compound ET primaryMuscle∈{back_width,back_thickness,back} → hasCompoundBack = true → pas de remplacement
  - Si non → hasCompoundBack = false → pull remplacé
- Documenter le résultat exact selon le seed

### P03 — [BUG-BW-PULL-INTACT] PPL avec dumbbell → pull ne doit PAS être remplacé
```
goal: hypertrophy, days: 3, duration: 60, equipment: [bodyweight, dumbbell], level: intermediate
splitPreference: auto
```
**Assertions :**
- rawSplit : `['push', 'pull', 'legs']`
- hasCompoundBack = true (seed-row-dumbbell : back_thickness, compound=true, equipment=dumbbell)
- Split final = rawSplit (pas de remplacement)
- Séance pull : slot back_width+back_thickness compound → seed-row-dumbbell → PASS
- Séance pull : slot back_width compound → null possible (tirage vertical = pullup_bar) → warning BUG-5

### P04 — [BUG-BW-PULL-INTACT] PPL avec machine → pull ne doit PAS être remplacé
```
goal: hypertrophy, days: 3, duration: 60, equipment: [machine], level: intermediate
splitPreference: auto
```
**Assertions :**
- hasCompoundBack = true (lat-pulldown machine + seated-row machine → compound dos)
- Split inchangé : `['push', 'pull', 'legs']`
- Séance pull complète (lat pulldown + seated row disponibles)

### P05 — [BUG-BW-PULL-PPF] Split PPF en BW pur → pull remplacé
```
goal: fat_loss, days: 3, duration: 60, equipment: [bodyweight], level: intermediate
splitPreference: auto
```
**Assertions :**
- rawSplit : `['push', 'pull', 'fullbody-quad']` (non-mass+3j+intermediate)
- hasCompoundBack = false → pull → fullbody-quad
- Split final : `['push', 'fullbody-quad', 'fullbody-quad']`
- Warning émis
- 2 séances fullbody-quad → nommées "Full Body A" et "Full Body B" (typeCount)

### P06 — [BUG-BW-PULL-PULLUP] PPL avec pullup_bar → pull ne doit PAS être remplacé
```
goal: hypertrophy, days: 3, duration: 60, equipment: [bodyweight, pullup_bar], level: intermediate
splitPreference: auto
```
**Assertions :**
- hasCompoundBack = true (pull-up, chin-up, inverted-row : equipment=pullup_bar, compound=true, primaryMuscle=back_width ou back)
- Split inchangé : `['push', 'pull', 'legs']`
- Séance pull fonctionnelle avec au moins 2 exercices de dos

### P07 — [BUG-BW-PULL-CABLE] PPL avec câble → pull ne doit PAS être remplacé
```
goal: hypertrophy, days: 3, duration: 60, equipment: [cable], level: intermediate
splitPreference: auto
```
**Assertions :**
- hasCompoundBack = true (seated cable row, cable pulldown si dans le seed)
- Split inchangé
- Vérifier que le seed contient bien des exercices dos compound câble

### P08 — [BUG-BW-PULL-KETTLEBELL] Split auto en KB-only → vérifier hasCompoundBack
```
goal: hypertrophy, days: 3, duration: 60, equipment: [kettlebell], level: intermediate
splitPreference: auto
```
**Assertions :**
- Vérifier si le seed KB contient des exercices dos compound (KB deadlift, KB row)
- Si oui : split inchangé. Si non : pull → fullbody-quad
- Documenter l'état exact du seed KB

### P09 — [BUG-BW-PULL-PPL-PREF] PPL préférence explicite + BW pur → pull remplacé
```
goal: hypertrophy, days: 3, duration: 60, equipment: [bodyweight], level: intermediate
splitPreference: ppl
```
**Assertions :**
- rawSplit (pref=ppl, 3j) : `['push', 'pull', 'legs']`
- hasCompoundBack = false → pull → fullbody-quad
- Split final : `['push', 'fullbody-quad', 'legs']`
- Warning émis malgré la préférence explicite

### P10 — [BUG-BW-PULL-UPPER-LOWER] Split upper-lower en BW pur → aucun 'pull' dans le split
```
goal: hypertrophy, days: 4, duration: 60, equipment: [bodyweight], level: beginner
splitPreference: upper-lower
```
**Assertions :**
- rawSplit (upper-lower, 4j) : `['upper-push', 'lower-quad', 'upper-pull', 'lower-hip']`
- Aucun 'pull' dans le split → BUG-BW-PULL non déclenché
- hasCompoundBack = false (BW seul)
- Split inchangé : le fix ne s'applique pas (correct — upper-pull ≠ 'pull')
- Séance upper-pull : slot back_width compound → null → warning BUG-5 (attendu)

### P11 — [BUG-BW-PULL-GLUTES] Split glutes-focus en BW+band → pas de 'pull'
```
goal: fat_loss, days: 4, duration: 60, equipment: [bodyweight, band], level: intermediate
splitPreference: glutes-focus
```
**Assertions :**
- rawSplit : `['glutes-hip', 'quad-glutes', 'glutes-hip', 'quad-glutes']`
- Aucun 'pull' → fix non déclenché
- Programme viable (glutes-hip et quad-glutes OK en BW+band)

### P12 — [BUG-BW-PULL-BROSPLIT] Brosplit en BW+pullup_bar → back-bi contient du tirage
```
goal: hypertrophy, days: 5, duration: 60, equipment: [bodyweight, pullup_bar], level: intermediate
splitPreference: brosplit
```
**Assertions :**
- rawSplit (brosplit, 5j) : `['chest-tri', 'back-bi', 'legs', 'shoulders-arms', 'upper']`
- 'back-bi' ≠ 'pull' → fix non déclenché
- hasCompoundBack = true (pullup_bar → pull-up compound back)
- Séance back-bi : slot back_width compound → pull-up ou chin-up
- Programme back fonctionnel

---

## Groupe B — P13–P22 : Régression BUG-HIP-BACK (fullbody-hip slot dos)

### P13 — [BUG-HIP-BACK-FIXED-DB] Fullbody×3 DB-only → fullbody-hip slot dos
```
goal: hypertrophy, days: 3, duration: 60, equipment: [dumbbell], level: beginner
splitPreference: auto
```
**Assertions :**
- Split : `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`
- Séance fullbody-hip (session B) :
  - SLOTS['fullbody-hip'][2] = `{muscles:['back_width','back_thickness','back'], compound:true}` (fix appliqué)
  - Candidats : exercices compound dos avec equipment=dumbbell
  - seed-row-dumbbell : primaryMuscle=back_thickness → dans la liste → CANDIDAT VALIDE
  - Ce slot ne doit plus être vide (fix BUG-HIP-BACK)
- Séance fullbody-quad (session A, C) : même slot mais fullbody-quad[2] avait déjà back_thickness → PASS (inchangé)

### P14 — [BUG-HIP-BACK-FIXED-BAND] Fullbody×3 BAND+BW → fullbody-hip slot dos
```
goal: fat_loss, days: 3, duration: 60, equipment: [bodyweight, band], level: intermediate
splitPreference: fullbody
```
**Assertions :**
- Split : `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']`
- Séance fullbody-hip slot dos compound :
  - Candidats band : band-row (vérifier primaryMuscle et category dans le seed)
  - Si band-row.primaryMuscle = back_thickness : CANDIDAT VALIDE → slot non vide
  - Si non : slot vide → toujours un bug → documenter

### P15 — [BUG-HIP-BACK-FIXED-HOME] Fullbody×2 HOME (KB+DB+BW) → fullbody-hip slot dos
```
goal: hypertrophy, days: 2, duration: 60, equipment: [kettlebell, dumbbell, bodyweight], level: intermediate
splitPreference: auto
```
**Assertions :**
- Split : `['fullbody-quad', 'fullbody-hip']`
- Séance fullbody-hip slot dos compound : DB row ou KB row disponible
- Les deux sessions ont des exercices de dos

### P16 — [BUG-HIP-BACK-QUAD-INTACT] fullbody-quad slot dos — inchangé (régression)
```
goal: hypertrophy, days: 2, duration: 60, equipment: [dumbbell], level: intermediate
splitPreference: auto
```
**Assertions :**
- Séance fullbody-quad : SLOTS['fullbody-quad'][2] = `{muscles:['back_width','back_thickness','back'], compound:true}`
- Ce slot était déjà correct avant le fix → PASS (régression)
- seed-row-dumbbell qualifié → slot non vide

### P17 — [BUG-HIP-BACK-MACH] Fullbody×3 machines → fullbody-hip slot dos
```
goal: fat_loss, days: 3, duration: 60, equipment: [machine], level: beginner
splitPreference: fullbody
```
**Assertions :**
- Séance fullbody-hip slot dos compound : lat-pulldown-machine ou seated-row-machine
  - lat-pulldown-machine.primaryMuscle = ? (vérifier dans le seed)
  - seated-row-machine.primaryMuscle = ? (vérifier dans le seed)
- L'un des deux doit être dans la liste back_width+back_thickness+back

### P18 — [BUG-HIP-BACK-CABLE] Fullbody alternant câble → fullbody-hip slot dos
```
goal: hypertrophy, days: 4, duration: 60, equipment: [cable, dumbbell], level: intermediate
splitPreference: fullbody
```
**Assertions :**
- Split : `['fullbody-quad', 'fullbody-hip', 'fullbody-quad', 'fullbody-hip']`
- Toutes les séances fullbody-hip ont un exercice de dos
- Vérifier les candidats câble pour back_width et back_thickness

### P19 — [BUG-HIP-BACK-PULLUP] Fullbody×3 BW+BAR → fullbody-hip slot dos
```
goal: endurance, days: 3, duration: 60, equipment: [bodyweight, pullup_bar], level: intermediate
splitPreference: fullbody
```
**Assertions :**
- Séance fullbody-hip slot dos compound : pull-up ou chin-up (equipment=pullup_bar)
  - primaryMuscle = back_width → dans la liste → CANDIDAT VALIDE
- Slot non vide

### P20 — [BUG-HIP-BACK-FULLGYM] Fullbody×3 salle complète → régression, exercice dos attendu
```
goal: hypertrophy, days: 3, duration: 60, equipment: [barbell, dumbbell, cable, machine, bodyweight, pullup_bar], level: intermediate
splitPreference: fullbody
```
**Assertions :**
- Séance fullbody-hip : exercice dos compound sélectionné parmi les meilleurs (popularité)
- Exercice de dos présent dans toutes les sessions hip

### P21 — [NORDIC-BEGINNER-FIXED] lower_pull BW+BAR débutant → nordic curl moins prioritaire
```
goal: hypertrophy, days: 3, duration: 60, equipment: [bodyweight, pullup_bar], level: beginner
splitPreference: auto
```
**Assertions :**
- Split : fullbody×3 (beginner 3j)
- Pas de lower_pull dans ce split → nordic curl pas en slot 1 (indirect)
- Vérifier : dans un contexte fullbody-quad, le slot hamstrings compound (absent de fullbody-quad, mais lower-quad en a un)

### P22 — [NORDIC-BEGINNER-FIXED] lower_pull BW+BAR intermédiaire → nordic curl possible mais dé-priorisé
```
goal: fat_loss, days: 3, duration: 60, equipment: [bodyweight, pullup_bar], level: intermediate
splitPreference: lower-split (via focusMuscles=['legs'])
```
**Assertions :**
- Split : lower-quad + lower-hip + lower-quad
- lower-quad slot hamstrings compound : candidats BW+BAR = [bw-nordic-curl (popularité 1), autres?]
- bw-nordic-curl popularité 1 → score popularité plus faible → moins prioritaire
- Vérifier si un autre exercice hamstrings compound BW+BAR existe dans le seed avec popularité > 1

---

## Groupe C — P23–P32 : Régression fixes v4 (INC-1, BUG-A1, BUG-A3, splits)

### P23 — [INC-1] Force + 3j + intermédiaire → fullbody×3 (pas PPL)
```
goal: strength, days: 3, duration: 60, equipment: [barbell, dumbbell, cable, machine, bodyweight, pullup_bar], level: intermediate
splitPreference: auto
```
**Assertions :**
- rawSplit : `['fullbody-quad', 'fullbody-hip', 'fullbody-quad']` (INC-1 fix actif)
- Pas de PPL pour strength + intermediate
- hasCompoundBack = true → pas de remplacement pull (de toute façon pas de pull)

### P24 — [BUG-A1] Force + 5j + intermédiaire → push/pull/lower-quad/upper/lower-hip
```
goal: strength, days: 5, duration: 60, equipment: [barbell, dumbbell, cable, machine, bodyweight, pullup_bar], level: intermediate
splitPreference: auto
```
**Assertions :**
- Split (types publics) : `['push', 'pull', 'lower', 'upper', 'lower']` (BUG-A1 fix)
- Pas de doublon `legs/lower` identiques
- hasCompoundBack = true → pull inchangé

### P25 — [BUG-A3] adjustedSpec 45min → séries inchangées
```
goal: hypertrophy, days: 3, duration: 45, equipment: [barbell, dumbbell], level: intermediate
splitPreference: auto
```
**Assertions :**
- COMPOUND_SPEC.hypertrophy = `{sets:4, repsMin:8, repsMax:12, restSec:90}`
- adjustedSpec(compound4, 45) : duration >= 45 → spec inchangé → sets = 4
- ISOLATION_SPEC.hypertrophy = `{sets:3, repsMin:10, repsMax:15, restSec:60}`
- adjustedSpec(isolation3, 45) → sets = 3 (inchangé)
- adjustedSlotCount(base, 45, 'hypertrophy') = max(3, floor(base×0.75))
- push(6 slots, 45min) : max(3, floor(6×0.75)) = max(3,4) = 4 slots

### P26 — [BUG-A2] Bonus 90min → push 90min = 6 slots (pas cap à 6 natif)
```
goal: hypertrophy, days: 3, duration: 90, equipment: [barbell, dumbbell, cable, machine, bodyweight, pullup_bar], level: intermediate
splitPreference: ppl
```
**Assertions :**
- push(6 slots, 90min, hypertrophy) : min(6+2, 8) = 8 slots mais slice(0,8) → 8 slots natifs (SLOTS.push a 8 entrées)
- Total push 90min : 8 + warmup + core = 10 exercices
- pull 90min : 8 slots → 10 exercices
- legs 90min : min(6+2, 8) = 8 → mais SLOTS.legs n'a que 6 → 6 slots → 8 exercices

### P27 — [BUG-C2] Anti-répétition force (usedGlobally avant strengthEquipmentPrio)
```
goal: strength, days: 3, duration: 60, equipment: [barbell, dumbbell], level: intermediate
splitPreference: fullbody
```
**Assertions :**
- Split fullbody×3 (strength+intermediate)
- Séances A et C (toutes deux fullbody-quad) : exercices composés différents grâce à usedGlobally
- Exercice utilisé en A ne doit pas être répété en C pour le même slot

### P28 — [BUG-D6] glutes-focus bloqué pour strength
```
goal: strength, days: 4, duration: 60, equipment: [barbell, dumbbell, cable, machine, bodyweight, pullup_bar], level: intermediate
splitPreference: glutes-focus
```
**Assertions :**
- incompatibleReason('glutes-focus') avec goal=strength → doit retourner une raison (bloqué)
- Le split glutes-focus n'est pas sélectionnable pour strength
- Vérifier le code dans ProgramGeneratorScreen.tsx

### P29 — [INC-5] fat_loss bloqué pour brosplit et arnold
```
goal: fat_loss, days: 5, duration: 60, equipment: [barbell, dumbbell, cable, machine], level: intermediate
splitPreference: brosplit
```
**Assertions :**
- incompatibleReason('brosplit') avec goal=fat_loss → doit retourner une raison
- fat_loss bénéficie d'une haute fréquence par groupe musculaire → brosplit incompatible
- Vérifier INC-5 fix dans ProgramGeneratorScreen.tsx

### P30 — [INC-4] phaseLabel affiche 'Récup.' et non 'Décharge'
```
goal: hypertrophy, durationWeeks: 8
```
**Assertions :**
- `buildPhases(8, 'hypertrophy')` retourne les phases
- La phase deload : `phaseLabel` retourne 'Récup.' (ProgramGeneratorScreen) et `PHASE_NAME_FR.deload` = 'Récup.' (ProgramDetailScreen)
- Plus aucune instance de 'Décharge' dans le code

### P31 — [BUG-C5] hip-adduction-machine.primaryMuscle = 'hamstrings'
```
Vérification seed uniquement
```
**Assertions :**
- Dans exercises-seed.json, l'entrée `hip-adduction-machine` (ou id équivalent) a `primaryMuscle = 'hamstrings'`
- Plus de `primaryMuscle = 'glutes'` pour cet exercice

### P32 — Régression globale : programme FULL_GYM hypertrophie 5j → cohérence complète
```
goal: hypertrophy, days: 5, duration: 60, equipment: [barbell, dumbbell, cable, machine, bodyweight, pullup_bar], level: intermediate
splitPreference: auto
```
**Assertions :**
- Split : `['push', 'pull', 'lower-quad', 'upper', 'lower-hip']`
- hasCompoundBack = true → pull non remplacé
- Chaque séance non vide (exercices disponibles pour tous les slots)
- generatorWarnings vide (ou seulement des réserves mineures)
- Noms : Push, Pull, Lower A, Upper, Lower B

---

## Groupe D — P33–P44 : Edge cases équipements restreints + nouveaux scénarios

### P33 — Fullbody×3 band seul → hasCompoundBack = ?
```
goal: fat_loss, days: 3, duration: 60, equipment: [band], level: beginner
splitPreference: fullbody
```
**Assertions :**
- Vérifier si le seed contient des exercices dos compound avec equipment=band
  - band-row : vérifier primaryMuscle et category
- Si band-row est compound + dos → hasCompoundBack = true → split PPL inchangé (mais ici on est en fullbody, pas PPL)
- Séance fullbody-hip slot dos : band-row candidat possible si primaryMuscle ∈ {back_width, back_thickness, back}
- Documenter l'état réel du seed

### P34 — PPL 4j avec cable seul → pull non remplacé
```
goal: hypertrophy, days: 4, duration: 60, equipment: [cable], level: intermediate
splitPreference: ppl
```
**Assertions :**
- rawSplit (ppl, 4j) : `['push', 'pull', 'legs', 'upper']`
- hasCompoundBack : vérifier exercices compound dos câble dans le seed
- Si seated-cable-row.category = compound et primaryMuscle = back_thickness → true → pas de remplacement

### P35 — Strength 20min FULL_GYM → adjustedSlotCount strength+20min
```
goal: strength, days: 3, duration: 20, equipment: [barbell, dumbbell, cable, machine, bodyweight, pullup_bar], level: intermediate
splitPreference: auto
```
**Assertions :**
- Split strength+intermediate+3j : fullbody×3
- fullbody-quad (9 slots, 20min, strength) : max(2, floor(9×0.5)) = max(2, 4) = 4 slots
- adjustedSpec(compound5, 20) : sets = max(2, floor(5×0.5)) = max(2, 2) = 2
- Total : 4 slots + warmup(1 série) + NO core (≤20min) = 5 exercices

### P36 — Endurance 90min → adjustedSlotCount non-mass+90min
```
goal: endurance, days: 4, duration: 90, equipment: [barbell, dumbbell, cable, machine, bodyweight, pullup_bar], level: intermediate
splitPreference: auto
```
**Assertions :**
- Split 4j non-mass intermediate : `['push', 'pull', 'lower-quad', 'fullbody-quad']`
- push (6 slots, 90min, endurance) : min(6+2, 8) = 8 → mais SLOTS.push a 8 entrées → 8 slots → 10 exos
- pull (6 slots, 90min) : même calcul → 8 slots
- lower-quad (6 slots, 90min) : min(6+2, 8) = 8 → mais SLOTS.lower-quad a 6+2 bonus = 8 → 8 slots
- fullbody-quad (9 slots, 90min) : min(9+2, 8) = 8 → 8 slots → 10 exercices

### P37 — Strength 90min → cap à 5 slots (BUG-1 fix)
```
goal: strength, days: 2, duration: 90, equipment: [barbell, dumbbell, cable, machine, bodyweight, pullup_bar], level: advanced
splitPreference: auto
```
**Assertions :**
- Split 2j : `['fullbody-quad', 'fullbody-hip']`
- fullbody-quad (9 slots, 90min, strength) : min(9, 5) = 5 slots
- Total : 5 + warmup + core = 7 exercices (pas 11)

### P38 — Hypertrophy 4j beginner → upper/lower, durée 45min
```
goal: hypertrophy, days: 4, duration: 45, equipment: [barbell, dumbbell, cable, machine], level: beginner
splitPreference: auto
```
**Assertions :**
- Split : `['upper-push', 'lower-quad', 'upper-pull', 'lower-hip']`
- upper-push (8 slots, 45min, hypertrophy) : max(3, floor(8×0.75)) = max(3, 6) = 6 slots
- adjustedSpec 45min : inchangé (duration >= 45)
- Warmup + core présents

### P39 — KB seul 3j → hasCompoundBack KB ?
```
goal: hypertrophy, days: 3, duration: 60, equipment: [kettlebell], level: intermediate
splitPreference: auto
```
**Assertions :**
- Vérifier si le seed contient kb-deadlift ou kb-row avec category=compound, primaryMuscle∈{back_width,back_thickness,back}
- Si oui : hasCompoundBack = true → PPL inchangé (hypertrophy+3j+intermediate → push+pull+legs)
- Si non : pull → fullbody-quad + warning
- Documenter l'état exact du seed KB

### P40 — Cardio machine seul → availableCount = 0, génération bloquée (wizard)
```
goal: fat_loss, days: 3, duration: 60, equipment: [cardio_machine], level: intermediate
```
**Assertions :**
- availableCount = 0 (cardio exclu du comptage)
- Le bouton "Continuer" est disabled dans le wizard
- generateProgramDraft ne devrait pas être appelé
- (Vérification wizard uniquement — pas de génération)

### P41 — Barbell seul 3j → hasCompoundBack = true (deadlift + bent-over row)
```
goal: strength, days: 3, duration: 60, equipment: [barbell], level: intermediate
splitPreference: auto
```
**Assertions :**
- hasCompoundBack = true (deadlift, bent-over row : barbell, compound, primaryMuscle=hamstrings/back)
  - Attention : deadlift.primaryMuscle peut être 'hamstrings' et non 'back' → vérifier
  - bent-over-row.primaryMuscle = back_thickness probablement → dans la liste → true
- INC-1 : strength+3j+intermediate → fullbody×3 → pas de 'pull' dans rawSplit
- Fix BUG-BW-PULL non déclenché (pas de 'pull' dans le split)

### P42 — PPL barbell seul → pull fonctionnel (bent-over row compound)
```
goal: hypertrophy, days: 3, duration: 60, equipment: [barbell], level: intermediate
splitPreference: ppl
```
**Assertions :**
- rawSplit (ppl pref, 3j) : `['push', 'pull', 'legs']`
- hasCompoundBack = true (bent-over row barbell compound)
- Split inchangé
- Séance pull : slot back_width compound → si barbell back_width → null ou bent-over row (back_thickness) ?
- Vérifier quels exercices barbell ciblent back_width vs back_thickness

### P43 — Upper-lower barbell+dumbbell 4j strength → pas de 'pull', split upper-push/pull
```
goal: strength, days: 4, duration: 60, equipment: [barbell, dumbbell], level: intermediate
splitPreference: auto
```
**Assertions :**
- Split mass+4j : `['upper-push', 'lower-quad', 'upper-pull', 'lower-hip']`
- Aucun 'pull' dans le split → BUG-BW-PULL non déclenché
- Séance upper-pull : slot back_width compound → tirage vertical barbell ou dumbbell
  - Si aucun exercice barbell/dumbbell avec primaryMuscle=back_width compound → slot vide + warning

### P44 — Home gym (KB+DB) 4j → upper-lower ou PPL selon goal
```
goal: fat_loss, days: 4, duration: 60, equipment: [kettlebell, dumbbell, bodyweight], level: intermediate
splitPreference: auto
```
**Assertions :**
- Split non-mass+4j+intermediate : `['push', 'pull', 'lower-quad', 'fullbody-quad']`
- hasCompoundBack : dumbbell → seed-row-dumbbell → true → split inchangé
- Séance pull : slot back_width compound → null possible (tirage vertical DB ?)
  - Si seed-row-dumbbell = back_thickness compound → slot back_width compound = null → warning BUG-5 attendu

---

## Groupe E — P45–P56 : Périodisation, nommage, warnings, splits préférentiels

### P45 — Vérification noms de séances post-fixes (PPL, Upper-Lower, Arnold, Bro)
```
goal: hypertrophy, days: 3, duration: 60, equipment: [barbell, dumbbell, cable, machine, bodyweight, pullup_bar], level: intermediate
splitPreference: ppl
```
**Assertions :**
- workouts[0].name = 'Push — Poussée'
- workouts[1].name = 'Pull — Tirage'
- workouts[2].name = 'Legs — Jambes'
- Pas de suffixe A/B (pas de doublon du même type)

### P46 — Arnold split 5j FULL_GYM → nommage et contenu
```
goal: hypertrophy, days: 5, duration: 60, equipment: [barbell, dumbbell, cable, machine, bodyweight, pullup_bar], level: intermediate
splitPreference: arnold
```
**Assertions :**
- rawSplit (arnold, 5j) : `['chest-back', 'shoulders-arms', 'legs', 'chest-back', 'shoulders-arms']`
- hasCompoundBack = true → split inchangé (chest-back ≠ 'pull')
- Noms : 'Chest & Back A', 'Shoulders & Arms A', 'Legs', 'Chest & Back B', 'Shoulders & Arms B'

### P47 — Brosplit 5j FULL_GYM → nommage et contenu
```
goal: hypertrophy, days: 5, duration: 60, equipment: [barbell, dumbbell, cable, machine, bodyweight, pullup_bar], level: intermediate
splitPreference: brosplit
```
**Assertions :**
- rawSplit (brosplit, 5j) : `['chest-tri', 'back-bi', 'legs', 'shoulders-arms', 'upper']`
- hasCompoundBack = true → 'back-bi' non remplacé (back-bi ≠ 'pull')
- Séance back-bi : exercices de dos et biceps

### P48 — Phase intensification strength → repsOffset = -2 (BUG-3 fix)
```
goal: strength, durationWeeks: 8
```
**Assertions :**
- PHASE_CONFIG_BY_GOAL['strength'].compound.intensification.repsOffset = -2
- Pour compound strength base : repsMin=3, repsMax=5
- En phase intensification : repsMin = 3 + (-2) = 1, repsMax = 5 + (-2) = 3 → sets=5, reps=1-3
- Pas de repsMin = 0 (BUG-3 résolu)

### P49 — Warning force + débutant (UX-C)
```
goal: strength, days: 3, duration: 60, equipment: [barbell, dumbbell], level: beginner
splitPreference: auto
```
**Assertions :**
- generatorWarnings contient "Force pour débutant : les specs 5×3–5…"
- Programme généré quand même (warning non bloquant)

### P50 — Warning débutant 5j (UX-H)
```
goal: hypertrophy, days: 5, duration: 60, equipment: [barbell, dumbbell, cable, machine], level: beginner
splitPreference: auto
```
**Assertions :**
- generatorWarnings contient "Volume élevé pour débutant"
- Programme généré

### P51 — focusMuscles=['glutes'] avec glutes-focus → split glutes
```
goal: fat_loss, days: 3, duration: 60, equipment: [barbell, dumbbell, cable, machine, bodyweight, pullup_bar], level: intermediate
splitPreference: auto, focusMuscles: ['glutes']
```
**Assertions :**
- workoutTypeFromFocus(['glutes']) → 'glutes-hip' ou glutes-dominance
- Split : alternance glutes-hip / quad-glutes selon le code
- Vérifier le résultat exact via workoutTypeFromFocus

### P52 — Séance express 20min avec core supprimé
```
goal: fat_loss, days: 3, duration: 20, equipment: [barbell, dumbbell], level: intermediate
splitPreference: auto
```
**Assertions :**
- Non-mass+3j+intermediate → push+pull+fullbody-quad
- hasCompoundBack = true → split inchangé
- push (6 slots, 20min) : max(2, floor(6×0.5)) = max(2, 3) = 3 slots
- Core supprimé (sessionDuration ≤ 20min)
- warmup réduit à 1 série
- Total push : 3 + 1 warmup = 4 exercices
- generatorWarnings[0] = "Séance express (20 min)…"

### P53 — selectedDays personnalisés → jours respectés
```
goal: hypertrophy, days: 3, duration: 60, equipment: [barbell, dumbbell, cable, machine], level: intermediate
selectedDays: ['tuesday', 'thursday', 'saturday']
```
**Assertions :**
- programme.week[0].day = 'tuesday'
- programme.week[1].day = 'thursday'
- programme.week[2].day = 'saturday'
- Les jours par défaut (lun/mer/ven) ne sont pas utilisés

### P54 — Séance push focus shoulders+arms → warning UX-B
```
goal: hypertrophy, days: 3, duration: 60, equipment: [barbell, dumbbell, cable, machine, bodyweight, pullup_bar], level: intermediate
focusMuscles: ['shoulders', 'arms'], splitPreference: auto
```
**Assertions :**
- workoutTypeFromFocus(['shoulders','arms']) → retourne un type push-dominant ou null
- generatorWarnings contient "Focus bras en push : le biceps n'est pas ciblé…"
- Warning UX-5 (déséquilibre push/pull) si toutes les séances sont push

### P55 — Split upper-lower préférence explicite 3j → 3 séances
```
goal: hypertrophy, days: 3, duration: 60, equipment: [barbell, dumbbell, cable, machine, bodyweight, pullup_bar], level: intermediate
splitPreference: upper-lower
```
**Assertions :**
- rawSplit (upper-lower, 3j) : `['upper-push', 'lower-quad', 'upper-pull']`
- Aucun 'pull' dans le split → BUG-BW-PULL non déclenché
- 3 séances avec nommage correct

### P56 — Vérification warning pull/push équilibre (UX-5)
```
goal: hypertrophy, days: 3, duration: 60, equipment: [barbell, dumbbell, cable, machine, bodyweight, pullup_bar], level: intermediate
focusMuscles: ['chest'], splitPreference: auto
```
**Assertions :**
- workoutTypeFromFocus(['chest']) → 'push'
- Split 3j push focus : ['push', 'push', 'push'] ? ou PPU ?
  - Vérifier le code workoutTypeFromFocus + selectSplit
- Si toutes les séances sont push → UX-5 warning (déséquilibre push/pull)

---

## Groupe F — P57–P66 : Cas avancés, warmup/core, anti-répétition

### P57 — Warmup filtré par équipement — BW pur sans élastique
```
goal: fat_loss, days: 2, duration: 60, equipment: [bodyweight], level: beginner
splitPreference: auto
```
**Assertions :**
- warmupPool = exercices isWarmupExercise=true avec equipment ∈ {bodyweight} ou equipment=bodyweight
- Pas de warmup élastique (band-pull-apart exclu car equipment=band)
- warmup sélectionné parmi les exercices BW warmup disponibles

### P58 — Core filtré par équipement — FULL_GYM
```
goal: hypertrophy, days: 2, duration: 60, equipment: [barbell, dumbbell, cable, machine, bodyweight, pullup_bar], level: intermediate
splitPreference: auto
```
**Assertions :**
- corePool = exercices primaryMuscle='core' non warmup avec equipment ∈ allowed ou bodyweight
- Un exercice core est sélectionné en dernière position

### P59 — Anti-répétition exercices entre séances du même type (usedGlobally)
```
goal: hypertrophy, days: 5, duration: 60, equipment: [barbell, dumbbell, cable, machine, bodyweight, pullup_bar], level: intermediate
splitPreference: ppl
```
**Assertions :**
- rawSplit (ppl, 5j) : `['push', 'pull', 'legs', 'push', 'pull']`
- hasCompoundBack = true → split inchangé
- Push A et Push B : exercices différents (usedGlobally actif)
- Pull A et Pull B : exercices différents
- Aucun exerciceId dupliqué dans l'ensemble du programme (usedGlobally)

### P60 — Strength + focusMuscles=['back'] + 3j → split fullbody ou PPU ?
```
goal: strength, days: 3, duration: 60, equipment: [barbell, dumbbell, cable, machine, bodyweight, pullup_bar], level: intermediate
focusMuscles: ['back'], splitPreference: auto
```
**Assertions :**
- workoutTypeFromFocus(['back']) → 'pull' (focusType = 'upper', sous-type pull)
  - Vérifier le code de workoutTypeFromFocus pour 'back'
- Si focusType = 'pull' : split 3j pull-focus = ? (vérifier le code)
- hasCompoundBack = true → si 'pull' dans le split, non remplacé

### P61 — Strength + barbell + 20min → slots très réduits
```
goal: strength, days: 3, duration: 20, equipment: [barbell], level: intermediate
splitPreference: fullbody
```
**Assertions :**
- Split fullbody×3 (strength+intermediate)
- fullbody-quad (9 slots, 20min, strength) : max(2, floor(9×0.5)) = 4 slots
- adjustedSpec(compound5, 20) : sets = max(2, floor(5×0.5)) = 2 → 2 séries × 3-5 reps
- Core supprimé, warmup 1 série
- Total : 4 + 1 warmup = 5 exercices par séance

### P62 — lower-quad 90min → 8 slots (bonus 90min pour non-strength)
```
goal: hypertrophy, days: 5, duration: 90, equipment: [barbell, dumbbell, cable, machine, bodyweight, pullup_bar], level: intermediate
splitPreference: auto
```
**Assertions :**
- Split : `['push', 'pull', 'lower-quad', 'upper', 'lower-hip']`
- lower-quad (6 slots, 90min, hypertrophy) : min(6+2, 8) = 8
- SLOTS['lower-quad'] a 8 entrées → slice(0,8) = 8 slots
- Total lower-quad : 8 + warmup + core = 10 exercices
- lower-hip idem : 8 slots → 10 exercices

### P63 — upper 90min hypertrophy → 8 slots
```
goal: hypertrophy, days: 5, duration: 90, equipment: [barbell, dumbbell, cable, machine, bodyweight, pullup_bar], level: intermediate
splitPreference: upper-lower
```
**Assertions :**
- split (upper-lower, 5j) : `['upper-push', 'lower-quad', 'upper-pull', 'lower-hip', 'upper']`
- upper (8 slots, 90min, hypertrophy) : min(8+2, 8) = 8 → 8 slots (déjà cap)
- upper-push (8 slots, 90min) : min(8+2, 8) = 8 → 8 slots
- Total : 8 + warmup + core = 10 exercices

### P64 — Régression strengthEquipmentPrio vs usedGlobally (BUG-C2)
```
goal: strength, days: 5, duration: 60, equipment: [barbell, dumbbell, cable, machine, bodyweight, pullup_bar], level: intermediate
splitPreference: auto
```
**Assertions :**
- Split : `['push', 'pull', 'lower-quad', 'upper', 'lower-hip']`
- Dans pickExercise : l'ordre de tri est usedGlobally AVANT strengthEquipmentPrio
- Un exercice déjà utilisé dans une séance précédente est écarté même s'il est barbell
- Vérifier le code de pickExercise pour confirmer l'ordre des critères de tri

### P65 — Programme 3j avec selectedDays non respectant la fréquence → fallback
```
goal: hypertrophy, days: 3, duration: 60, equipment: [barbell, dumbbell, cable, machine], level: intermediate
selectedDays: ['monday'] (longueur ≠ daysPerWeek)
```
**Assertions :**
- La condition `selectedDays.length === daysPerWeek` est false (1 ≠ 3)
- Fallback vers DAY_ASSIGNMENTS[3] = ['monday', 'wednesday', 'friday']
- Les jours fournis sont ignorés

### P66 — Hypertrophy 2j beginner BW → fullbody A/B, exercices distincts
```
goal: hypertrophy, days: 2, duration: 60, equipment: [bodyweight, pullup_bar], level: beginner
splitPreference: auto
```
**Assertions :**
- Split : `['fullbody-quad', 'fullbody-hip']`
- hasCompoundBack : pullup_bar → pull-up compound → true → fix BUG-BW-PULL non déclenché
- Séance fullbody-quad (A) et fullbody-hip (B) : exercices partiellement différents
- fullbody-hip slot dos : back_width+back_thickness+back compound → pull-up/chin-up (pullup_bar)
  - Avec le fix BUG-HIP-BACK, le slot accepte maintenant aussi back_thickness
  - pull-up.primaryMuscle = back_width → candidat pour le slot (qui inclut back_width)

---

## Format de rendu pour chaque groupe

Produire un fichier markdown structuré :

```markdown
# Audit P[XX]–P[YY] — Groupe [X] (v6)
**Date :** 2026-09-07
**Fichiers lus :** programGenerator.ts + [autres fichiers lus]
**Fixes vérifiés :** [liste des fixes]

---

## Formules de référence (extraites du code)
[Tables résumant les valeurs observées dans le code — toujours extraites du code, jamais supposées]

---

### P[N] — [Titre]
**Paramètres :** [...]

**Simulation étape par étape :**
1. selectSplit → rawSplit = [...]
2. available filtré : [N exercices]
3. hasCompoundBack = [true/false] car [raison]
4. split final = [...]
5. Pour chaque workoutType : slots, exercices sélectionnés

**Assertions : PASS/FAIL**
- Assertion 1 : **PASS/FAIL** — [explication]
- ...

**Verdict : ✅ Bon programme / ⚠️ Problème mineur / ❌ Problème sérieux**
— [explication]

---

[... autres profils ...]

---

## Tableau de synthèse P[XX]–P[YY]

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|--------|---------------------|---------|-------------------|
| P[N] | ... | ✅/⚠️/❌ | ... |

---

## Synthèse des problèmes ouverts

### Bugs / anomalies logicielles (assertions FAIL)
[Liste ou "Aucun FAIL détecté"]

### Réserves coach cumulées
[Thèmes récurrents]
```
