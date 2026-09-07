# Audit prompt v7 — gym-tracker · programGenerator.ts
**Date :** 2026-09-07
**Objectif :** Vérifier les 4 corrections issues des réserves de l'audit v6

---

## Contexte des corrections à tester

### SEED-MACHINE-LATLIFT — ajout de `machine-lat-pulldown`
- Nouveau dans le seed : `{ id: "machine-lat-pulldown", primaryMuscle: "back_width", equipment: "machine", category: "compound", popularity: 2 }`
- Attendu : les utilisateurs machine-only ont maintenant un exercice de tirage vertical

### SEED-PULLOVER-COMPOUND — `seed-pullover` passe en compound
- Avant : `seed-pullover` avait `category: "isolation"` (dumbbell, back_width)
- Après : `category: "compound"`
- Attendu : en DB-only, le slot `['back_width','back_thickness'] compound:true` peut être servi par le pullover

### SEED-DEADLIFT-SLOT — 6 slots `['back_width','back']` → `['back_width','back_thickness']`
- Slots modifiés : pull[0], upper-pull[0], lower_pull[1], chest-back[1], back-bi[0], glutes-hip[3]
- Attendu : le deadlift (primaryMuscle=back) ne qualifie plus pour ces slots
- Les slots fullbody (['back_width','back_thickness','back']) sont INCHANGÉS — deadlift toujours valide

### SEED-BW-NOBACK — warning UX pour BW-only sans compound dos
- Condition : `!hasCompoundBack && !hasPullInSplit`
- Émis quand : profil bodyweight seul ET split fullbody (pas de séance 'pull')
- NE doit PAS être émis si BUG-BW-PULL warning est déjà présent (hasPullInSplit=true)

---

## Rappel formules (inchangées depuis v6)

| Duration | strength | autres goals |
|----------|----------|--------------|
| 20 min | min(3, max(2, floor(base×0.5))) | max(2, floor(base×0.5)) |
| 45 min | min(3, max(2, floor(base×0.5))) | max(4, floor(base×0.75)) |
| 60 min | max(4, floor(base×0.5)) | base (inchangé) |
| 90 min | min(base, 5) | min(base+2, 8) |

---

## Groupe A (P01-P12) — SEED-MACHINE-LATLIFT

### P01 — Machine seul, PPL 3j
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine], level=intermediate, splitPreference=auto
**Assertions :**
- hasCompoundBack : `machine-lat-pulldown` (back_width, machine, compound) → **true**
  ET `seed-row-machine` (back_thickness, machine, compound) → déjà true
- Split inchangé ['push','pull','legs'] (pas de remplacement BUG-BW-PULL)
- Slot pull[0] `['back_width','back_thickness'] compound:true` avec machine :
  - machine-lat-pulldown (back_width, pop 2) : candidat valide
  - seed-row-machine (back_thickness, pop 1) : candidat valide
  - slotPrimary = 'back_width' → machine-lat-pulldown priorisé
  - **machine-lat-pulldown sélectionné en slot[0]**
- Slot pull[1] `['back_thickness','back'] compound:true` → seed-row-machine
- **Plus de slot back vide en machine seul (résolution SEED-MACHINE-LATLIFT)**

### P02 — Machine seul, fullbody 3j
**Profil :** goal=fat_loss, days=3, duration=60, equipment=[machine], level=beginner, splitPreference=fullbody
**Assertions :**
- Split ['fullbody-quad','fullbody-hip','fullbody-quad']
- fullbody-quad slot[2] `['back_width','back_thickness','back'] compound:true` :
  - machine-lat-pulldown (back_width) : candidat → sélectionné
  - seed-row-machine (back_thickness) : candidat
- fullbody-hip slot[2] `['back_width','back_thickness','back'] compound:true` :
  - idem, les deux candidats disponibles
- **Pas de slot dos vide en fullbody machine**

### P03 — Machine seul, split upper-lower 4j
**Profil :** goal=strength, days=4, duration=60, equipment=[machine], level=intermediate, splitPreference=upper-lower
**Assertions :**
- INC-1 non déclenché (strength 4j → upper-lower OK)
- Split ['upper-push','lower-quad','upper-pull','lower-hip']
- upper-pull slot[0] `['back_width','back_thickness'] compound:true` :
  - machine-lat-pulldown (back_width, pop 2) → sélectionné (back_width priorisé)
- upper-push slot[1] `['back_width','back_thickness','back'] compound:true` :
  - machine-lat-pulldown ou seed-row-machine → candidat
- **Séances upper-pull et upper-push ont un exercice de dos**

### P04 — Machine seul, back-bi brosplit
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[machine], level=advanced, splitPreference=brosplit
**Assertions :**
- Split brosplit 5j : ['chest-tri','back-bi','legs','shoulders-arms','upper']
- back-bi slot[0] `['back_width','back_thickness'] compound:true` :
  - machine-lat-pulldown (back_width, compound, pop 2) → priorisé
- back-bi slot[1] `['back_thickness','back'] compound:true` → seed-row-machine
- **back-bi a 2 exercices de dos distincts**

### P05 — Machine + câble, PPL 3j (régression)
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine, cable], level=intermediate
**Assertions :**
- machine-lat-pulldown (back_width, machine) ET seed-lat-pulldown (back_width, cable) disponibles
- hasCompoundBack = true, split inchangé
- pull slot[0] `['back_width','back_thickness']` : les 2 exercices back_width candidats
- Intermediate → top-3 pool → machine-lat-pulldown ou seed-lat-pulldown selon popularité
  - seed-lat-pulldown (pop 3) > machine-lat-pulldown (pop 2) → lat pulldown câble plus probable

### P06 — Machine seul, upper-pull slot dos — vérifier qu'il n'y a plus de slot vide
**Profil :** goal=fat_loss, days=4, duration=45, equipment=[machine], level=beginner, splitPreference=upper-lower
**Assertions :**
- adjustedSlotCount(8, 45, 'fat_loss') = max(4, floor(8×0.75)) = 6
- upper-pull slot[0] `['back_width','back_thickness']` : machine-lat-pulldown → non vide ✅
- **Contraste avec avant le fix : ce slot était vide en machine seul**

### P07 — Machine seul, chest-back Arnold
**Profil :** goal=hypertrophy, days=6, duration=60, equipment=[machine], level=advanced, splitPreference=arnold
**Note :** 6j non supporté par le générateur → tester avec 5j
**Profil corrigé :** goal=hypertrophy, days=5, duration=60, equipment=[machine], level=advanced, splitPreference=arnold
**Assertions :**
- Split arnold 5j : vérifier chest-back slot[1] `['back_width','back_thickness']` compound:true
- machine-lat-pulldown candidat → slot non vide

### P08 — Machine seul, glutes-focus
**Profil :** goal=fat_loss, days=4, duration=60, equipment=[machine], level=intermediate, splitPreference=glutes-focus
**Assertions :**
- Split ['glutes-hip','quad-glutes','glutes-hip','quad-glutes']
- glutes-hip slot[3] `['back_width','back_thickness'] compound:true` :
  - machine-lat-pulldown (back_width) → candidat valide (sélectionné)
- **Séance glutes-hip a un tirage machine**

### P09 — Machine seul, lower_pull focus jambes+dos
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine], level=intermediate, focusMuscles=['back','legs']
**Assertions :**
- workoutTypeFromFocus(['back','legs']) → 'lower_pull'
- lower_pull split 3j : ['lower_pull','lower_pull','lower_pull'] ou géré autrement
- lower_pull slot[1] `['back_width','back_thickness']` → machine-lat-pulldown candidat

### P10 — Machine seul, 90 min PPL (bonus slots)
**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[machine], level=intermediate
**Assertions :**
- Pull 90min : adjustedSlotCount(8, 90, 'hypertrophy') = min(8+2,8) = 8 → 8 slots
- pull slot[7] (compound:false) `['back_width','back']` (isolation dos) :
  - Ce slot inclut 'back' → seed-row-machine (back_thickness, machine) pourrait candidater
  - machine-lat-pulldown (back_width) candidat aussi
  - Vérifier que le slot est servi

### P11 — Machine seul, strength 60min (INC-1)
**Profil :** goal=strength, days=3, duration=60, equipment=[machine], level=intermediate
**Assertions :**
- INC-1 : strength+3j+intermediate → fullbody×3
- fullbody-quad slot[2] et fullbody-hip slot[2] `['back_width','back_thickness','back']` compound:true :
  - machine-lat-pulldown (back_width) sélectionné en priorité (slotPrimary=back_width)

### P12 — Machine seul, 2j débutant
**Profil :** goal=hypertrophy, days=2, duration=60, equipment=[machine], level=beginner
**Assertions :**
- Split ['fullbody-quad','fullbody-hip']
- Slot dos compound des deux séances : machine-lat-pulldown disponible
- usedGlobally : machine-lat-pulldown utilisé en A → seed-row-machine en B (et inversement)
- Plus de slot dos vide en machine 2j

---

## Groupe B (P13-P24) — SEED-PULLOVER-COMPOUND + SEED-DEADLIFT-SLOT

### P13 — DB seul, PPL 3j — pullover remplace deadlift dans slot tirage
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell], level=intermediate
**Assertions :**
- hasCompoundBack :
  - seed-pullover (back_width, dumbbell, compound) → **true** ← NOUVEAU (avant: isolation → false)
  - seed-row-dumbbell (back_thickness, dumbbell, compound) → true
- Split inchangé ['push','pull','legs'] (hasCompoundBack=true)
- pull slot[0] `['back_width','back_thickness'] compound:true` avec dumbbell :
  - seed-pullover (back_width, pop 1) : candidat
  - seed-row-dumbbell (back_thickness, pop 3) : candidat
  - slotPrimary = 'back_width' → seed-pullover priorisé malgré pop plus faible
  - **seed-pullover sélectionné en slot[0] (tirage vertical)**
- pull slot[1] `['back_thickness','back']` → seed-row-dumbbell
- **DB-only : 2 exercices dos distincts dans la séance pull**

### P14 — DB seul, deadlift ne remplit plus le slot tirage vertical
**Profil :** goal=strength, days=3, duration=60, equipment=[dumbbell], level=intermediate
**Assertions :**
- INC-1 : strength+3j+intermediate → fullbody×3
- fullbody-quad slot[2] `['back_width','back_thickness','back'] compound:true` (3 muscles, inchangé) :
  - dumbbell-deadlift ou seed-deadlift : primaryMuscle=back → **TOUJOURS candidat** (slot fullbody non modifié)
  - seed-pullover (back_width) ou seed-row-dumbbell (back_thickness) : candidats prioritaires
  - slotPrimary = back_width → seed-pullover priorisé
- **Confirmer que le slot fullbody (['back_width','back_thickness','back']) n'a PAS été modifié**
- **Le deadlift dumbbell reste candidat pour les slots fullbody (comportement attendu)**

### P15 — DB seul, fullbody 3j — pullover dans le slot dos fullbody
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell], level=beginner, splitPreference=fullbody
**Assertions :**
- Split ['fullbody-quad','fullbody-hip','fullbody-quad']
- fullbody-hip slot[2] `['back_width','back_thickness','back'] compound:true` :
  - seed-pullover (back_width, compound) → candidat
  - seed-row-dumbbell (back_thickness, compound) → candidat
  - slotPrimary = back_width → seed-pullover priorisé
- usedGlobally assure variété entre séances fullbody-quad et fullbody-hip

### P16 — DB seul, PPL 5j avec pullover dans séances pull
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[dumbbell], level=advanced
**Assertions :**
- Split 5j mass : ['push','pull','lower-quad','upper','lower-hip']
- hasCompoundBack=true (seed-pullover compound + seed-row-dumbbell)
- Séance pull : pullover en slot[0], seed-row-dumbbell en slot[1]
- upper slot[1] `['back_width','back_thickness','back']` : pullover candidat
- 5 séances toutes non vides pour le dos

### P17 — DB seul, back-bi brosplit — pullover en lat pulldown slot
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[dumbbell], level=intermediate, splitPreference=brosplit
**Assertions :**
- back-bi slot[0] `['back_width','back_thickness'] compound:true` :
  - seed-pullover (back_width, dumbbell, compound) → sélectionné
- back-bi slot[1] `['back_thickness','back']` → seed-row-dumbbell
- back-bi slot[3] `['back_thickness','back_width','back'] compound:false` → isolation dos

### P18 — Barbell seul, PPL — deadlift ne remplit plus le slot tirage
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell], level=intermediate
**Assertions :**
- hasCompoundBack : seed-row-barbell (back_thickness), seed-row-tbar (back_thickness), seed-deadlift (back) → true
- pull slot[0] `['back_width','back_thickness'] compound:true` (modifié) :
  - seed-deadlift (primaryMuscle=back) : **back ∉ ['back_width','back_thickness'] → EXCLU**
  - seed-row-barbell (back_thickness) → candidat
  - seed-row-tbar (back_thickness) → candidat
  - Aucun exercice barbell avec primaryMuscle=back_width dans le seed
  - slotPrimary=back_width → seed-row-barbell et seed-row-tbar ont primaryMuscle=back_thickness ≠ back_width → tie sur slotPrimary
  - Sort par popularité : seed-row-barbell (pop 7) > seed-row-tbar → seed-row-barbell probable
  - **slot[0] = seed-row-barbell (CORRECT : le deadlift ne prend plus la place de la traction)**
- pull slot[1] `['back_thickness','back']` → seed-row-tbar ou seed-deadlift (back ∈ liste)

### P19 — KB seul, PPL — deadlift KB ne remplit plus le slot tirage
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[kettlebell], level=intermediate
**Assertions :**
- pull slot[0] `['back_width','back_thickness'] compound:true` (modifié) :
  - kb-deadlift (primaryMuscle=back) : **EXCLU** (back ∉ liste)
  - kb-row (back_thickness, compound) → candidat
  - slot[0] = kb-row ✅
- pull slot[1] `['back_thickness','back']` (inchangé) :
  - kb-deadlift (back ∈ liste) → candidat
  - kb-row (back_thickness ∈ liste) → candidat
  - usedGlobally : kb-row déjà utilisé → kb-deadlift probable en slot[1]

### P20 — Barbell seul, fullbody 3j — deadlift reste dans slot fullbody
**Profil :** goal=strength, days=3, duration=60, equipment=[barbell], level=intermediate
**Assertions :**
- INC-1 : strength+3j → fullbody×3
- fullbody-quad slot[2] `['back_width','back_thickness','back'] compound:true` (INCHANGÉ) :
  - seed-deadlift (back ∈ liste) → **TOUJOURS candidat** (slot fullbody non modifié)
  - seed-row-barbell (back_thickness) → candidat prioritaire (slotPrimary=back_width → tie, pop 7)
  - En barbell seul, aucun exercice back_width → deadlift reste le seul 'back' candidat
- **Confirmer : fullbody (['back_width','back_thickness','back']) non modifié → deadlift OK**

### P21 — SALLE COMPLÈTE — régression globale, slots tirage non régressés
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable,machine,bodyweight,pullup_bar], level=intermediate
**Assertions :**
- pull slot[0] `['back_width','back_thickness']` : seed-pullup (back_width, pop 3) ou seed-lat-pulldown (back_width, pop 3)
- pull slot[1] `['back_thickness','back']` : seed-row-barbell (pop 7) probable
- Aucun slot tirage vide en salle complète
- seed-deadlift EXCLU du slot[0] (ne prend plus la place de la traction) ✅

### P22 — chest-back Arnold, barbell — deadlift exclu slot[1]
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[barbell,dumbbell], level=intermediate, splitPreference=arnold
**Assertions :**
- chest-back slot[1] `['back_width','back_thickness'] compound:true` (modifié) :
  - seed-row-barbell (back_thickness) → candidat
  - seed-row-dumbbell (back_thickness) → candidat
  - seed-deadlift (back) → **EXCLU** du slot[1]
  - slotPrimary=back_width → les deux rowing ties → seed-row-barbell (pop 7) probable

### P23 — glutes-hip, DB seul — tirage posture corrigé
**Profil :** goal=fat_loss, days=4, duration=60, equipment=[dumbbell], level=intermediate, splitPreference=glutes-focus
**Assertions :**
- glutes-hip slot[3] `['back_width','back_thickness'] compound:true` (modifié) :
  - seed-pullover (back_width, dumbbell, compound) → candidat (slotPrimary=back_width → priorisé)
  - seed-row-dumbbell (back_thickness) → candidat
  - **seed-pullover sélectionné en slot posture (meilleur exercice dos DB)**

### P24 — lower_pull, KB+DB — slot tirage vertical corrigé
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[kettlebell,dumbbell], level=intermediate, focusMuscles=['back','legs']
**Assertions :**
- lower_pull slot[1] `['back_width','back_thickness'] compound:true` (modifié) :
  - seed-pullover (back_width, dumbbell) → candidat (slotPrimary=back_width → priorisé)
  - kb-row (back_thickness) → candidat
  - seed-row-dumbbell (back_thickness) → candidat
  - **seed-pullover probable en slot[1] (tirage vertical)**
  - Résolution : en KB+DB, pullover remplace le rôle que le deadlift prenait avant

---

## Groupe C (P25-P36) — SEED-BW-NOBACK + régressions v6

### P25 — BW seul, PPL — BUG-BW-PULL warning (PAS le nouveau warning)
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight], level=intermediate
**Assertions :**
- hasCompoundBack = false (BW seul)
- hasPullInSplit = true (PPL)
- BUG-BW-PULL déclenché → split ['push','fullbody-quad','legs'], warning BUG-BW-PULL émis
- **SEED-BW-NOBACK warning NE doit PAS être émis** (car hasPullInSplit=true — déjà couvert)
- Les deux warnings ne doivent pas se cumuler

### P26 — BW seul, fullbody×3 — NOUVEAU warning SEED-BW-NOBACK
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight], level=beginner
**Assertions :**
- hasCompoundBack = false (BW seul)
- hasPullInSplit = false (split fullbody : aucun 'pull' dans rawSplit)
- **SEED-BW-NOBACK warning émis** : "Dos non couvert : aucun exercice de tirage compound..."
- BUG-BW-PULL NE doit PAS être émis (hasPullInSplit=false)
- Programme généré quand même (fullbody-quad×3) avec warning

### P27 — BW seul, fat_loss PPF — hasPullInSplit=true, seul BUG-BW-PULL warning
**Profil :** goal=fat_loss, days=3, duration=60, equipment=[bodyweight], level=intermediate
**Assertions :**
- rawSplit = ['push','pull','fullbody-quad'] (PPF fat_loss)
- hasPullInSplit = true → BUG-BW-PULL déclenché
- **SEED-BW-NOBACK NE doit PAS être émis**

### P28 — BW seul, 2j fullbody — warning SEED-BW-NOBACK
**Profil :** goal=hypertrophy, days=2, duration=60, equipment=[bodyweight], level=beginner
**Assertions :**
- Split ['fullbody-quad','fullbody-hip'], pas de 'pull' → hasPullInSplit=false
- hasCompoundBack = false
- **SEED-BW-NOBACK émis** — même en 2j fullbody

### P29 — BW+pullup_bar, fullbody — PAS de warning (hasCompoundBack=true)
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight,pullup_bar], level=beginner
**Assertions :**
- hasCompoundBack = true (seed-pullup back_width, pullup_bar compound)
- hasPullInSplit = false (fullbody×3 débutant)
- **Ni BUG-BW-PULL, ni SEED-BW-NOBACK** — programme complet

### P30 — BW+band, fullbody — PAS de warning (band-row compound)
**Profil :** goal=fat_loss, days=3, duration=60, equipment=[bodyweight,band], level=intermediate, splitPreference=fullbody
**Assertions :**
- band-row (back_thickness, band, compound) → hasCompoundBack = true
- **Aucun warning dos** — band-row couvre le slot dos
- Confirme que band-row est toujours compound dans le seed (pas régressé)

### P31 — BW seul, upper-lower 4j — PAS de warning SEED-BW-NOBACK
**Profil :** goal=hypertrophy, days=4, duration=60, equipment=[bodyweight], level=intermediate, splitPreference=upper-lower
**Assertions :**
- hasPullInSplit = false (aucun type 'pull' exact dans upper-lower)
- hasCompoundBack = false
- **SEED-BW-NOBACK est émis** (hasCompoundBack=false && !hasPullInSplit)
- Note : le warning est légitime — upper-pull BW a aussi un slot dos vide

### P32 — BW seul, glutes-focus — PAS de warning SEED-BW-NOBACK
**Profil :** goal=fat_loss, days=4, duration=60, equipment=[bodyweight], level=intermediate, splitPreference=glutes-focus
**Assertions :**
- Split ['glutes-hip','quad-glutes','glutes-hip','quad-glutes']
- hasPullInSplit = false, hasCompoundBack = false
- **SEED-BW-NOBACK est émis** (logique : même si glutes-focus, le dos reste non couvert)
- Vérifier que le warning a du sens dans ce contexte (glutes-focus n'est pas censé avoir du dos — peut-être que ce warning est trop agressif ici ?)

### P33 — Régression INC-1 — strength+3j+intermediate
**Profil :** goal=strength, days=3, duration=60, equipment=[barbell,dumbbell,cable,machine,bodyweight,pullup_bar], level=intermediate
**Assertions :**
- selectSplit → ['fullbody-quad','fullbody-hip','fullbody-quad'] (INC-1 confirmé)
- fullbody-quad slot[2] `['back_width','back_thickness','back']` : exercice sélectionné (salle complète)

### P34 — Régression BUG-A1 — 5j mass intermediate
**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[barbell,dumbbell,cable,machine,bodyweight,pullup_bar], level=intermediate
**Assertions :**
- selectSplit → ['push','pull','lower-quad','upper','lower-hip'] (public: push/pull/lower/upper/lower)
- pull slot[0] `['back_width','back_thickness']` : exercice back_width/back_thickness disponible

### P35 — Régression BUG-HIP-BACK — fullbody-hip slot[2]
**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell], level=beginner, splitPreference=fullbody
**Assertions :**
- SLOTS['fullbody-hip'][2] = `['back_width','back_thickness','back'] compound:true` (INCHANGÉ depuis v5 fix)
- seed-pullover (back_width, compound) → candidat valide, slotPrimary priorisé
- **slot non vide en DB seul** (amélioration par rapport à avant pullover compound)

### P36 — Régression NEW-GLUTES-FOCUS — focusMuscles=['glutes']
**Profil :** goal=fat_loss, days=3, duration=60, equipment=[barbell,dumbbell,cable,machine], level=intermediate, focusMuscles=['glutes']
**Assertions :**
- workoutTypeFromFocus(['glutes']) → 'glutes-hip' (fix v6 confirmé)
- Split : glutes-hip/quad-glutes alternés
- glutes-hip slot[3] `['back_width','back_thickness']` → exercice dos disponible (salle complète)

---

## Tableau récapitulatif attendu

Chaque profil doit être conclu avec :
- `✅ PASS` : toutes assertions validées
- `❌ FAIL` : au moins une assertion failed (avec description)
- `⚠️ RÉSERVE` : comportement correct mais point coach à signaler
