# Prompt d'audit coaching — programGenerator.ts
**Date :** 2026-09-08
**Version :** v12 (reformulation coaching)
**Objectif :** Évaluation de la qualité coaching des programmes générés, profil par profil.
**Profils :** ~130 (profils non reproductibles via le wizard supprimés)

---

## Rôle

Tu es coach sportif certifié avec 15 ans d'expérience en programmation de l'entraînement.
Ta mission comporte deux volets indissociables :

1. **Simulation** : Tu lis `src/utils/programGenerator.ts` en entier, puis tu exécutes mentalement le générateur sur chaque profil pour identifier le split produit, le nombre d'exercices par séance et les groupes musculaires couverts.
2. **Évaluation coaching** : Tu juges la *qualité sportive* du programme produit — pertinence du split pour ce profil, équilibre musculaire sur la semaine, cohérence volume/durée, exploitation de l'équipement, sécurité.

Tu ne décris pas le code — tu évalues le résultat comme un coach recevrait une fiche programme d'un collègue.

---

## Règles strictes

1. **Pas de sous-agents.** Traite chaque profil toi-même, dans l'ordre.
2. **Pas de saut.** Tous les profils doivent être traités. Aucun "idem P0X".
3. **Lis les fichiers avant de commencer :**
   - `src/utils/programGenerator.ts` — entier (split, slots, adjustedSlotCount, warnings)
   - `src/data/exercises-seed.json` — entier (disponibilité des exercices par équipement/muscle)
4. **Ne liste pas les exercices slot par slot** sauf si un exercice précis est mentionné dans les critères. Évalue la structure globale.
5. **Identifie les slots vides** dus aux contraintes d'équipement — c'est coaching-critique.

---

## Critères d'évaluation par profil

### 1. Adéquation split / profil
- Le type de split est-il approprié pour ce niveau, objectif et fréquence d'entraînement ?
  - Débutant → fullbody ou upper-lower (fréquence élevée par groupe)
  - Force → fréquence ≥2×/sem. par groupe (fullbody ou upper-lower)
  - Hypertrophie avancé → PPL ou brosplit acceptable
- Le split respecte-t-il les incompatibilités du wizard (brosplit ≠ débutant, arnold ≠ force…) ?

### 2. Équilibre musculaire
- Ratio push/pull respecté sur la semaine (agoniste/antagoniste) ?
- Équilibre haut / bas du corps ?
- Groupes musculaires absents qui devraient être couverts (manque critique) ?
- Sur-représentation d'un groupe au détriment d'un autre ?

### 3. Cohérence objectif / sets×reps
- Les plages de répétitions correspondent-elles à l'objectif ?
  - Strength : 3–5 reps, repos 3 min
  - Hypertrophie : 8–12 reps, repos 90 s
  - Fat_loss : 12–15 reps, repos 60 s
  - Endurance : 15+ reps, repos 45 s
- Le volume est-il cohérent pour le niveau (ni trop faible, ni excessif) ?

### 4. Adéquation durée / nombre d'exercices
- Le nombre d'exercices effectifs tient-il dans la durée déclarée ?
  - Référence : ~4 min/série en hypertrophie (2 min exo + 90 s repos) — 3 séries → 12 min/exercice
  - Référence force : 5 séries × 4 min (exo + 3 min repos) → 20 min/exercice
- En force, le nombre de slots est-il correctement réduit (adjustedSlotCount) ?
- Des slots vides imprévus gonflent-ils artificiellement la durée ?

### 5. Qualité de l'équipement
- Tous les exercices utilisent uniquement l'équipement déclaré ?
- Les contraintes d'équipement créent-elles des lacunes critiques (back vide en BW seul) ?
- L'équipement disponible est-il bien exploité (préférer barre aux haltères pour la force) ?

### 6. Avertissements utilisateur
- Les warnings appropriés sont-ils émis ?
  - SEED-BW-NOBACK : BW seul sans barre de traction → dos vide
  - BUG-BW-PULL : séance pull avec BW seul → remplacée par fullbody
  - Slots vides dans une séance spécialisée
- L'utilisateur est-il correctement informé des limitations de son setup ?

### 7. Variété inter-séances
- Les séances du même type se différencient-elles structurellement (fullbody-quad vs fullbody-hip) ou répètent-elles les mêmes exercices ?
- Le pool d'exercices disponibles est-il suffisant pour éviter la répétition entre séances similaires ?

---

## Format de rendu

### Rendu intermédiaire (par groupe)

Chaque agent produit un rendu markdown structuré par groupe :

### Rendu final (rapport complet)

Le rapport consolidé final doit être livré sous forme de **fichier HTML** (`audit_report_v11.html`) produit par l'orchestrateur après réception de tous les groupes. Le fichier HTML doit :

- Avoir un **header** avec titre, date, version du prompt et nombre de profils traités
- Avoir une **navigation** par ancre entre groupes (A, B, C, D, E)
- Afficher chaque profil dans une **carte** avec : paramètres, simulation, assertions (badge vert PASS / rouge FAIL), verdict coloré (✅ vert / ⚠️ orange / ❌ rouge)
- Inclure les **tableaux de synthèse** par groupe avec coloration des lignes par verdict
- Terminer par la **synthèse finale** : tableau global, liste des ❌, liste des ⚠️, bugs logiciels, recommandations
- Être **lisible sans JS** (HTML/CSS statique) et avoir un design sobre (fond blanc, typographie claire, couleurs sémantiques uniquement)

---

### Structure markdown par groupe

```markdown
# Audit [GroupeX] — [Titre groupe]
**Date :** [date]
**Fichiers lus :** programGenerator.ts + exercises-seed.json
**Fixes vérifiés :** [liste des comportements vérifiés dans ce groupe]

---

## Formules de référence (extraites du code)
[Tables résumant les valeurs clés observées dans le code — toujours extraites du code, jamais supposées :
adjustedSlotCount par goal/duration, seuils INC-1, logique BUG-BW-PULL, etc.]

---

### [Code] — [Nom court]
**Paramètres :** goal=X, level=Y, days=N, duration=D, equipment=[...], splitPreference=Z

**Simulation étape par étape :**
1. selectSplit → rawSplit = [...]
2. available filtré : [N exercices correspondant à l'équipement]
3. hasCompoundBack = [true/false] car [raison — exercice ou absence]
4. split final = [liste des workoutTypes produits]
5. Pour chaque workoutType : slots effectifs (après adjustedSlotCount), exercices sélectionnés ou slots vides

**Assertions :**
- Assertion 1 : **PASS/FAIL** — [explication courte]
- Assertion 2 : **PASS/FAIL** — [explication courte]
- ...

**Verdict : ✅ Bon programme / ⚠️ Problème mineur / ❌ Problème sérieux**
— [1-3 phrases coaching — pourquoi ce verdict]

---

[... autres profils du groupe ...]

---

## Tableau de synthèse [GroupeX]

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|--------|---------------------|---------|-------------------|
| [Code] | [résumé assertions] | ✅/⚠️/❌ | [point d'attention] |

---

## Synthèse des problèmes ouverts

### Bugs / anomalies logicielles (assertions FAIL)
[Liste des FAIL avec code profil + description, ou "Aucun FAIL détecté"]

### Réserves coach cumulées
[Thèmes récurrents sur l'ensemble du groupe]
```

### Codes de verdict

| Verdict | Signification |
|---------|--------------|
| ✅ Bon programme | Programme de qualité acceptable pour ce profil |
| ⚠️ Problème mineur | Programme fonctionnel mais un point mérite l'attention |
| ❌ Problème sérieux | Programme inadapté, déséquilibré ou trompeur pour ce profil |

---

## Équipements abrégés

- `BW` = `['bodyweight']`
- `DB` = `['dumbbell']`
- `BB+DB` = `['barbell','dumbbell']`
- `BB+DB+CABLE` = `['barbell','dumbbell','cable']`
- `MACH+CABLE` = `['machine','cable']`
- `FULL` = `['barbell','dumbbell','cable','machine','bodyweight','pullup_bar','cardio_machine']`
- `BW+BAR` = `['bodyweight','pullup_bar']`
- `HOME` = `['dumbbell','kettlebell','band','bodyweight']`
- `KB` = `['kettlebell']`

**Contrainte BW seul (sans pullup_bar ni équipement lesté) :**
Les slots back_width, back_thickness, biceps compound, chest_lower compound, triceps compound et hamstrings compound (nordic curl) n'ont aucun exercice composé disponible. Ce déséquilibre anterior/posterior est un problème coaching majeur que le warning SEED-BW-NOBACK doit signaler.

**Déterminisme :**
- `level='beginner'` → sélection déterministe (candidat top-1 par popularité)
- `level='intermediate'` ou `'advanced'` → sélection aléatoire dans le top-3 (non-déterministe)

---

## GROUPE A — FULLBODY × ÉQUIPEMENT (12 profils)

---

### A01 — Fullbody × BW, hypertrophy, 2j, 60min, beginner

```
goal='hypertrophy', level='beginner', daysPerWeek=2, duration=60
equipment=BW, splitPreference='fullbody'
```

**Split attendu :** `['fullbody-quad','fullbody-hip']`
**Slots effectifs :** 9 nominaux → ~4 réels (dos vide, isolations hamstrings/biceps/triceps vides en BW)

**Critères coaching :**
- Fullbody 2j/sem. est le split minimal acceptable pour un débutant : fréquence correcte ✅
- BW seul sans barre de traction → 0 exercice composé de dos : déséquilibre anterior/posterior majeur
- 4 exercices effectifs pour 60 min hypertrophie (~48 min) : sous-utilisé mais ne pas surcharger un débutant
- Warning SEED-BW-NOBACK doit être émis pour informer l'utilisateur du manque de dos
- Variété structurelle quad/hip : différenciation correcte entre les deux séances ✅

---

### A02 — Fullbody × BW, strength, 3j, 60min, intermediate → INC-1

```
goal='strength', level='intermediate', daysPerWeek=3, duration=60
equipment=BW, splitPreference=undefined (auto)
```

**Split attendu :** `['fullbody-quad','fullbody-hip','fullbody-quad']` (INC-1 : force 3j → fullbody)
**Slots effectifs :** max(4, floor(9×0.5)) = 4 slots

**Critères coaching :**
- INC-1 : la force intermédiaire 3j produit automatiquement fullbody (fréquence 3×/groupe) — décision coach correcte ✅
- 4 exercices par séance en force 60 min : cohérent (5 séries × 4 min repos × 4 exos ≈ 80 min — légèrement au-dessus, RÉSERVE)
- BW + force : progression externe impossible — le wizard doit avertir, mais ce profil est marginal
- BW seul : dos toujours vide — sur 4 slots (quad, chest, back_vide, OHP), le slot dos est inclus mais non rempli
- Warning SEED-BW-NOBACK attendu ✅

---

### A03 — Fullbody × BW, fat_loss, 3j, 45min, beginner

```
goal='fat_loss', level='beginner', daysPerWeek=3, duration=45
equipment=BW, splitPreference='fullbody'
```

**Split attendu :** `['fullbody-quad','fullbody-hip','fullbody-quad']`
**Slots effectifs :** max(4, floor(9×0.75)) = 6 slots → ~3-4 réels (dos vide)

**Critères coaching :**
- Fullbody 3j fat_loss débutant : adapté — haute fréquence, effort métabolique ✅
- 6 slots pour 45 min fat_loss : ~7.5 min/exercice (3 séries × 12-15 reps + 60 s repos ≈ 7 min) — cohérent ✅
- BW seul : dos absent — sur 6 slots effectifs, le slot dos est vide avec warning
- 3-4 exercices réels sur 6 slots : acceptable pour débutant BW
- Warning SEED-BW-NOBACK attendu ✅

---

### A04 — Fullbody × DB+BW, hypertrophy, 3j, 60min, beginner

```
goal='hypertrophy', level='beginner', daysPerWeek=3, duration=60
equipment=['dumbbell','bodyweight'], splitPreference='fullbody'
```

**Split attendu :** `['fullbody-quad','fullbody-hip','fullbody-quad']`
**Slots effectifs :** 9 slots

**Critères coaching :**
- Fullbody 3j débutant hypertrophie : excellent split — fréquence maximale par groupe ✅
- DB+BW : dos couvert (rowing haltère) — déséquilibre anterior/posterior résolu ✅
- 9 exercices en 60 min hypertrophie : ~9 × ~7 min = 63 min — limite haute mais réaliste ✅
- Aucun slot dos vide → pas de warning SEED-BW-NOBACK ✅
- Hamstrings isolation probablement vide (pas d'isolation ischio DB+BW sans machine) — RÉSERVE mineur

---

### A05 — Fullbody × DB+BW, strength, 3j, 60min, intermediate → INC-1

```
goal='strength', level='intermediate', daysPerWeek=3, duration=60
equipment=['dumbbell','bodyweight'], splitPreference=undefined (auto)
```

**Split attendu :** `['fullbody-quad','fullbody-hip','fullbody-quad']` (INC-1)
**Slots effectifs :** max(4, floor(9×0.5)) = 4 slots

**Critères coaching :**
- INC-1 force intermédiaire : fullbody 3j = fréquence maximale par groupe, optimal pour la force ✅
- Slot dos inclus dans les 4 premiers → rowing haltère couvre le dos ✅
- 4 exercices force en 60 min : 5×3-5 reps + 3 min repos × 4 exos ≈ 80-90 min réels — timing serré, RÉSERVE
- DB pour force : limitation de charge progressive — objectif force sous-optimal avec haltères seulement

---

### A06 — Fullbody × DB+BW, fat_loss, 2j, 45min, beginner

```
goal='fat_loss', level='beginner', daysPerWeek=2, duration=45
equipment=['dumbbell','bodyweight'], splitPreference='fullbody'
```

**Split attendu :** `['fullbody-quad','fullbody-hip']`
**Slots effectifs :** max(4, floor(9×0.75)) = 6 slots

**Critères coaching :**
- 2j/sem. fat_loss débutant : fréquence minimale — acceptable pour démarrer, mais 3j serait préférable
- DB+BW 6 exercices 45 min : cohérent en fat_loss (repos courts 60 s) ✅
- Dos couvert (rowing haltère inclus dans les 6 premiers slots) ✅
- Variété quad/hip entre les deux séances : équilibre ischio/quads sur la semaine ✅

---

### A07 — Fullbody × KB+DB+BW, hypertrophy, 3j, 60min, intermediate

```
goal='hypertrophy', level='intermediate', daysPerWeek=3, duration=60
equipment=['kettlebell','dumbbell','bodyweight'], splitPreference='fullbody'
```

**Split attendu :** `['fullbody-quad','fullbody-hip','fullbody-quad']`
**Slots effectifs :** 9 slots

**Critères coaching :**
- Fullbody 3j hypertrophie intermédiaire : acceptable mais PPL donnerait plus de volume par groupe
- KB+DB : équipement riche — bonne variété d'exercices possible ✅
- Hamstrings isolation : toujours absent sans machine (VIDE) — lacune répétée RÉSERVE
- Variété inter-séances : le générateur alterne exercices entre quad/hip — structurellement différenciées ✅

---

### A08 — Fullbody × KB+DB+BW, fat_loss, 4j, 60min, intermediate

```
goal='fat_loss', level='intermediate', daysPerWeek=4, duration=60
equipment=['kettlebell','dumbbell','bodyweight'], splitPreference='fullbody'
```

**Split attendu :** `['fullbody-quad','fullbody-hip','fullbody-quad','fullbody-hip']`
**Slots effectifs :** 9 slots

**Critères coaching :**
- Fullbody 4j fat_loss : haute fréquence métabolique — excellent pour la dépense énergétique ✅
- Récupération entre séances : 4j fullbody = pas de jour off consécutifs, fatigue cumulative — RÉSERVE
- KB : swing et goblet squat apportent une composante cardio-musculaire utile pour fat_loss ✅
- Dos couvert (rowing haltère ou KB) ✅

---

### A09 — Fullbody × Salle complète, hypertrophy, 3j, 60min, intermediate

```
goal='hypertrophy', level='intermediate', daysPerWeek=3, duration=60
equipment=['barbell','dumbbell','cable','pullup_bar','machine'], splitPreference='fullbody'
```

**Split attendu :** `['fullbody-quad','fullbody-hip','fullbody-quad']`
**Slots effectifs :** 9 slots

**Critères coaching :**
- Fullbody avec salle complète : sous-optimal pour hypertrophie intermédiaire (PPL permettrait un volume par groupe bien supérieur)
- 9 exercices couvrant tous les groupes musculaires en salle complète ✅
- Tous les slots isolation remplis (machine disponible : leg curl, leg extension) ✅
- Squat barre pour quads, RDL barre pour ischio : choix force/hypertrophie optimal ✅
- RÉSERVE : fullbody 3j est plus adapté à la force qu'à l'hypertrophie intermédiaire

---

### A10 — Fullbody × Salle, hypertrophy, 4j, 60min, intermediate

```
goal='hypertrophy', level='intermediate', daysPerWeek=4, duration=60
equipment=['barbell','dumbbell','cable','pullup_bar','machine'], splitPreference='fullbody'
```

**Split attendu :** `['fullbody-quad','fullbody-hip','fullbody-quad','fullbody-hip']`
**Slots effectifs :** 9 slots

**Critères coaching :**
- Fullbody 4j avec salle complète : volume total élevé mais par groupe équivalent à 2×/sem. — acceptable
- 4 séances distinctes (2 quad-dominant, 2 hip-dominant) : variété structurelle réelle ✅
- Récupération : 9 exercices × 4j = charge hebdomadaire élevée — RÉSERVE pour volume total
- Salle complète : isolation complète dans toutes les séances ✅

---

### A11 — Fullbody × Salle, strength, 4j, 90min, advanced

```
goal='strength', level='advanced', daysPerWeek=4, duration=90
equipment=['barbell','dumbbell','cable','pullup_bar','machine'], splitPreference='fullbody'
```

**Split attendu :** `['fullbody-quad','fullbody-hip','fullbody-quad','fullbody-hip']`
**Slots effectifs :** min(9, 5) = 5 slots

**Critères coaching :**
- Fullbody 4j force avancé avec 90 min : 5 exercices force par séance — excellent programme force ✅
- 5 séries × 5 min/exercice × 5 exercices ≈ 125 min — timing légèrement au-dessus de 90 min annoncés, RÉSERVE
- Salle complète : squat, bench, dos compound, OHP, isolation — couverture optimale ✅
- Fréquence 4×/sem. par groupe musculaire principal : surfréquence pour la force (2-3× recommandé) — RÉSERVE

---

### A12 — Fullbody × Salle, fat_loss, 5j, 60min, beginner

```
goal='fat_loss', level='beginner', daysPerWeek=5, duration=60
equipment=['barbell','dumbbell','cable','pullup_bar','machine'], splitPreference='fullbody'
```

**Split attendu :** 5 séances fullbody alternées
**Slots effectifs :** 9 slots

**Critères coaching :**
- Fullbody 5j fat_loss débutant : fréquence extrême pour un débutant — risque de surentraînement ⚠️
- Récupération insuffisante entre séances similaires — RÉSERVE coaching fort
- Salle complète + 9 exercices : programme riche mais possiblement trop dense pour débuter
- Sécurité : aucune séance de repos programmée sur 5j — le wizard devrait recommander 3-4j

---

## GROUPE B — GLUTES+DOS × ÉQUIPEMENT (12 profils)

---

### B01 — Glutes+dos × BW, fat_loss, 3j, 60min, intermediate

```
goal='fat_loss', level='intermediate', daysPerWeek=3, duration=60
equipment=BW, splitPreference='glutes-focus'
```

**Split attendu :** `['glutes-hip','quad-glutes','glutes-hip']`
**Slots effectifs :** 8 slots → ~5 réels (dos vide BW, hamstrings isolation vide)

**Critères coaching :**
- Glutes-focus BW : split adapté à l'objectif féminisé sans push — pertinent ✅
- BW seul sans barre de traction → slot dos (lat pulldown posture) vide — déséquilibre postérieur partiel
- Warning slot vide "dos" attendu (indépendant de SEED-BW-NOBACK qui est supprimé pour glutes-focus) ✅
- 5 exercices effectifs par séance en fat_loss 60 min : cohérent ✅
- Hip thrust + good morning + squat BW : chaîne postérieure bien couverte malgré BW seul ✅
- Glutes-hip et quad-glutes : excellente variété structurelle (hip-dominant vs squat-dominant) ✅

---

### B02 — Glutes+dos × BW, hypertrophy, 4j, 60min, beginner

```
goal='hypertrophy', level='beginner', daysPerWeek=4, duration=60
equipment=BW, splitPreference='glutes-focus'
```

**Split attendu :** `['glutes-hip','quad-glutes','glutes-hip','quad-glutes']`
**Slots effectifs :** 8 slots

**Critères coaching :**
- 4j glutes-focus débutant : haute fréquence sur le bas du corps — adapté à l'objectif ✅
- BW : dos vide dans les 2 types de séances (slot posture) — limitation structurelle prévisible
- 4 séances sans push : absence totale de pectoraux, épaules, triceps sur la semaine — programme volontairement spécialisé ✅
- Récupération : 4j avec chevauchement fessiers — volume cumulatif à surveiller

---

### B03 — Glutes+dos × BW, strength, 3j, 90min, intermediate → 5 slots

```
goal='strength', level='intermediate', daysPerWeek=3, duration=90
equipment=BW, splitPreference='glutes-focus'
```

**Split attendu :** `['glutes-hip','quad-glutes','glutes-hip']`
**Slots effectifs :** min(8, 5) = 5 slots

**Critères coaching :**
- Force 90 min : 5 exercices × 5 séries × 4 min ≈ 100 min — légèrement au-dessus de 90 min, RÉSERVE
- BW + force : progression de charge impossible sans équipement lesté — combinaison sous-optimale
- 5 slots couvrent les composés principaux glutes-hip + quad-glutes — squelette programme acceptable
- Slot dos compound (index 3 dans glutes-hip) inclus dans les 5 premiers → vide en BW mais présent
- Warning slot vide "dos" émis dans les 5 premiers slots ✅

---

### B04 — Glutes+dos × DB+BW, fat_loss, 4j, 60min, intermediate

```
goal='fat_loss', level='intermediate', daysPerWeek=4, duration=60
equipment=['dumbbell','bodyweight'], splitPreference='glutes-focus'
```

**Split attendu :** `['glutes-hip','quad-glutes','glutes-hip','quad-glutes']`
**Slots effectifs :** 8 slots

**Critères coaching :**
- Glutes-focus 4j fat_loss intermédiaire : programme bien ciblé — dépense calorique élevée ✅
- DB+BW : dos couvert (rowing haltère dans les 2 types de séances) — pas de slot vide dos ✅
- Hip thrust BW + RDL haltère + squat : chaîne postérieure complète sur la semaine ✅
- Pullover haltère : isolation dos disponible en fin de séance ✅
- 8 exercices fat_loss 60 min : 3 séries × 13 reps × 8 exos ≈ 64 min — cohérent ✅

---

### B05 — Glutes+dos × DB+BW, hypertrophy, 3j, 60min, beginner

```
goal='hypertrophy', level='beginner', daysPerWeek=3, duration=60
equipment=['dumbbell','bodyweight'], splitPreference='glutes-focus'
```

**Split attendu :** `['glutes-hip','quad-glutes','glutes-hip']`
**Slots effectifs :** 8 slots

**Critères coaching :**
- Glutes-focus 3j débutant hypertrophie : adapté — fréquence correcte par groupe ✅
- DB+BW : dos compound et isolation couverts (rowing + pullover) ✅
- Débutant top-1 : sélection déterministe — programme stable et prévisible ✅
- 8 exercices 60 min débutant : volume élevé — surveiller la fatigue en semaine 1-2

---

### B06 — Glutes+dos × DB+BW, strength, 4j, 60min, intermediate → 4 slots

```
goal='strength', level='intermediate', daysPerWeek=4, duration=60
equipment=['dumbbell','bodyweight'], splitPreference='glutes-focus'
```

**Split attendu :** `['glutes-hip','quad-glutes','glutes-hip','quad-glutes']`
**Slots effectifs :** max(4, floor(8×0.5)) = 4 slots

**Critères coaching :**
- Force 4j glutes-focus : 4 exercices par séance — volume correct pour la force ✅
- Slot dos compound (index 3 dans glutes-hip) inclus dans les 4 premiers → rowing haltère ✅
- Slot dos compound (index 2 dans quad-glutes) inclus dans les 4 premiers → rowing haltère ✅
- DB + force : progression de charge externe limitée — RÉSERVE (barre recommandée pour la force)
- 4 séances sur la semaine : fréquence glutes 4×/sem. — acceptable pour hypertrophie fessiers

---

### B07 — Glutes+dos × KB+DB+BW, fat_loss, 4j, 60min, intermediate

```
goal='fat_loss', level='intermediate', daysPerWeek=4, duration=60
equipment=['kettlebell','dumbbell','bodyweight'], splitPreference='glutes-focus'
```

**Split attendu :** `['glutes-hip','quad-glutes','glutes-hip','quad-glutes']`
**Slots effectifs :** 8 slots

**Critères coaching :**
- KB swing pour glutes-hip : excellent pour fat_loss (composante cardio-musculaire) ✅
- KB+DB : dos couvert (rowing haltère > rowing KB en popularité pour slot composé) ✅
- Pullover haltère en isolation dos : couverture complète ✅
- 4j fat_loss : dépense calorique optimale sur la semaine ✅
- Variété KB/DB inter-séances : pool large, répétitions d'exercices limitées ✅

---

### B08 — Glutes+dos × KB+DB+BW, hypertrophy, 3j, 45min, beginner

```
goal='hypertrophy', level='beginner', daysPerWeek=3, duration=45
equipment=['kettlebell','dumbbell','bodyweight'], splitPreference='glutes-focus'
```

**Split attendu :** `['glutes-hip','quad-glutes','glutes-hip']`
**Slots effectifs :** max(4, floor(8×0.75)) = 6 slots

**Critères coaching :**
- 6 exercices 45 min hypertrophie débutant : 3 séries × 10 reps × 6 exos ≈ 45 min — parfait ✅
- Slot dos (index 3 glutes-hip, index 2 quad-glutes) inclus dans les 6 premiers ✅
- Débutant + KB+DB : exercices accessibles, KB swing et goblet squat adaptés aux débutants ✅
- Anti-répétition inter-séances : rowing haltère (glutes-hip) → kb-row (quad-glutes) — variété maintenue ✅

---

### B09 — Glutes+dos × Salle complète, fat_loss, 4j, 60min, intermediate

```
goal='fat_loss', level='intermediate', daysPerWeek=4, duration=60
equipment=['barbell','dumbbell','cable','pullup_bar','machine'], splitPreference='glutes-focus'
```

**Split attendu :** `['glutes-hip','quad-glutes','glutes-hip','quad-glutes']`
**Slots effectifs :** 8 slots

**Critères coaching :**
- Salle complète + glutes-focus : programme optimal — hip thrust barre, squat barre, lat pulldown ✅
- Tous les slots isolation remplis (leg curl machine pour hamstrings) ✅
- Dos compound + isolation : lat pulldown / rowing barre + pullover — couverture complète ✅
- 8 exercices fat_loss 60 min : volume approprié ✅
- Programme équilibré sur la semaine : fessiers, ischio, quads, dos — complet ✅

---

### B10 — Glutes+dos × Salle, hypertrophy, 3j, 60min, advanced

```
goal='hypertrophy', level='advanced', daysPerWeek=3, duration=60
equipment=['barbell','dumbbell','cable','pullup_bar','machine'], splitPreference='glutes-focus'
```

**Split attendu :** `['glutes-hip','quad-glutes','glutes-hip']`
**Slots effectifs :** 8 slots

**Critères coaching :**
- Glutes-focus avancé 3j hypertrophie : adapté — volume par session élevé ✅
- Salle complète : top-3 aléatoire pour avancé — variété maximale d'exercices ✅
- Leg curl machine + leg extension machine : isolation complète ✅
- Pullover (top-3 variantes) en fin de séance dos : excellent travail posture ✅

---

### B11 — (Profil B11 non défini dans v10 — sauté)

---

### B12 — Glutes+dos × Salle, fat_loss, 3j, 45min, beginner

```
goal='fat_loss', level='beginner', daysPerWeek=3, duration=45
equipment=['barbell','dumbbell','cable','pullup_bar','machine'], splitPreference='glutes-focus'
```

**Split attendu :** `['glutes-hip','quad-glutes','glutes-hip']`
**Slots effectifs :** max(4, floor(8×0.75)) = 6 slots

**Critères coaching :**
- 6 exercices 45 min fat_loss débutant : cohérent ✅
- Slot dos compound inclus dans les 6 premiers (index 3 glutes-hip, index 2 quad-glutes) ✅
- Leg curl machine (index 5 glutes-hip) inclus → hamstrings isolation couverte ✅
- Leg extension machine (index 3 quad-glutes) inclus → quads isolation couverte ✅
- Débutant en salle complète : bonne base d'apprentissage des mouvements fondamentaux ✅

---

## GROUPE C — CAS SPÉCIAUX (1 profil valide)

*Note : les profils C01–C04 (focusMuscles=['glutes'] ou ['glutes','back']) et C06 (glutes-focus + strength) ont été retirés car impossibles à reproduire via le wizard (voir étape 2 de l'audit).*

---

### C05 — Machine seul, fullbody, hypertrophy, 3j, 60min, intermediate

```
goal='hypertrophy', level='intermediate', daysPerWeek=3, duration=60
equipment=['machine'], splitPreference='fullbody'
```

**Split attendu :** `['fullbody-quad','fullbody-hip','fullbody-quad']`
**Slots effectifs :** 9 slots

**Critères coaching :**
- Machine seul : couverture dos couverte (machine lat pulldown) ✅
- Biceps machine disponible (machine-biceps-curl ajouté v9) : couverture bras complète ✅
- Isolation dos machine : machine-low-row (back_thickness) et machine-pullover (back_width) disponibles ✅
- Programme machine-only : exercices guidés, adapté à l'hypertrophie intermédiaire ✅
- 9 exercices 60 min hypertrophie : limite haute mais tous les groupes musculaires couverts ✅
- RÉSERVE : fullbody 3j en machine seul — manque de liberté de mouvement pour les patterns composés naturels

---

## GROUPE D — RÉGRESSIONS ÉQUIPEMENT ET DURÉE

*Les profils D-P73 (arnold + strength), D-P86 à D-P89 (focusMuscles=['glutes']) ont été retirés (invalides via wizard).*

---

### D — Groupe A : Couverture machine

### D-P02 — Machine seul, fullbody 3j, fat_loss, beginner

**Profil :** goal=fat_loss, days=3, duration=60, equipment=[machine], level=beginner, splitPreference=fullbody

**Critères coaching :**
- Slot dos compound : machine-lat-pulldown disponible → dos couvert ✅
- Machine seul débutant : guidage des mouvements, sécurité accrue ✅
- Fat_loss 3j beginner fullbody : split adapté ✅

---

### D-P04 — Machine seul, strength, 3j, beginner (fullbody attendu)

**Profil :** goal=strength, days=3, duration=60, equipment=[machine], level=beginner

**Critères coaching :**
- Beginner → fullbody×3 (pas INC-1, déjà fullbody de base)
- 4 slots force 60 min : machine-lat-pulldown en slot dos ✅
- Machine + force débutant : progression guidée, acceptable pour apprendre les patterns ✅

---

### D-P07 — Machine seul, 90 min, hypertrophy, intermediate

**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[machine], level=intermediate

**Critères coaching :**
- 8 slots pull 90 min : 8 exercices dos — volume extrême sur une séance dos
- machine-lat-pulldown + seed-row-machine (composés) + machine-low-row (isolation) : couverture verticale/horizontale/isolation ✅
- Slot 8 forearms : probablement vide (pas d'exercice machine forearms) — RÉSERVE mineur
- Programme très volumineux sur dos — récupération à surveiller ✅

---

### D-P08 — Machine seul, 20 min, strength, intermediate (INC-1)

**Profil :** goal=strength, days=3, duration=20, equipment=[machine], level=intermediate

**Critères coaching :**
- INC-1 → fullbody×3
- 3 slots (20 min strength) : quad, chest, dos — programme minimal mais fonctionnel ✅
- 20 min force : 3 exercices × 5 séries × 4 min ≈ 60 min réels — durée annoncée irréaliste ⚠️ RÉSERVE
- machine-lat-pulldown en slot dos (index 2) ✅

---

### D-P09 — Machine seul, 45 min, strength, intermediate

**Profil :** goal=strength, days=3, duration=45, equipment=[machine], level=intermediate

**Critères coaching :**
- INC-1 → fullbody×3, 3 slots (même formule que 20 min strength)
- 3 exercices × 5 séries × 4 min ≈ 60 min réels — 45 min annoncés sous-estimés, RÉSERVE
- machine-lat-pulldown en slot dos ✅

---

### D-P10 — Machine + pullup_bar, PPL 3j, intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine, pullup_bar], level=intermediate

**Critères coaching :**
- Avec pullup_bar : seed-pullup (pop 3) prime sur machine-lat-pulldown (pop 2) au slot dos compound ✅
- Machine pour isolation : couverture complète dos ✅
- Équilibre PPL : 1 pull / 1 push / 1 legs — correct ✅

---

### D-P12 — Machine + dumbbell, PPL 3j, intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine, dumbbell], level=intermediate

**Critères coaching :**
- Slot dos compound : machine-lat-pulldown (back_width, pop 2) probable — dos couvert ✅
- Haltères pour bench et shoulder press : bon équilibre multiplanaire ✅
- Machine isolation + haltère free-weight : programme varié ✅

---

### D-P13 — Machine seul, brosplit, 5j, advanced

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[machine], level=advanced, splitPreference=brosplit

**Critères coaching :**
- Brosplit machine-only avancé : machine-lat-pulldown + seed-row-machine couvrent le dos ✅
- Slot isolation dos (back-bi[3]) : machine-low-row disponible v9 → slot rempli ✅
- 5j brosplit avancé : volume par groupe élevé, récupération 7j avant revisiter le même groupe ✅

---

### D-P14 — Machine seul, Arnold, 5j, intermediate

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[machine], level=intermediate, splitPreference=arnold

**Critères coaching :**
- Arnold split machine : chest-back[1] dos compound = machine-lat-pulldown ✅
- Slot isolation dos (chest-back[5]) : machine-low-row disponible v9 → rempli ✅
- Arnold split hypertrophie intermédiaire : volume par groupe élevé — acceptable ✅

---

### D-P15 — Machine seul, glutes-focus, 3j, intermediate

**Profil :** goal=fat_loss, days=3, duration=60, equipment=[machine], level=intermediate, splitPreference=glutes-focus

**Critères coaching :**
- Split glutes-focus machine : glutes-hip[3] = machine-lat-pulldown (slot posture) ✅
- SEED-BW-NOBACK non émis (splitPreference='glutes-focus' exception) ✅
- Machine + glutes-focus : tous les slots isolation (leg curl, leg extension, abducteur) disponibles ✅

---

### D-P16 — Machine seul, focusMuscles=['back'], 3j, intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine], level=intermediate, focusMuscles=['back']

**Critères coaching :**
- workoutTypeFromFocus(['back']) → 'pull' → split pull-based ✅
- Pull machine : machine-lat-pulldown + seed-row-machine + machine-low-row = couverture dos complète ✅
- Programme dos-focused cohérent avec le focus demandé ✅
- Absence de séances jambes/push : programme de spécialisation — acceptable si l'utilisateur en est conscient

---

### D-P17 — Machine seul, focusMuscles=['back','legs'], 3j, intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine], level=intermediate, focusMuscles=['back','legs']

**Critères coaching :**
- workoutTypeFromFocus(['back','legs']) → 'lower_pull' (chaîne postérieure) ✅
- Split lower_pull 3j : deadlift → tirage → rowing → squat — structure chaîne postérieure correcte ✅
- Machine seul : deadlift machine limité — RÉSERVE (la chaîne postérieure bénéficie d'une barre)

---

### D-P18 — Machine seul, fat_loss, 2j, beginner

**Profil :** goal=fat_loss, days=2, duration=60, equipment=[machine], level=beginner

**Critères coaching :**
- Split fullbody-quad + fullbody-hip : adapté à 2j débutant ✅
- Machine : dos couvert dans les deux séances (machine-lat-pulldown) ✅
- 2j/sem. fat_loss : fréquence minimale acceptable pour démarrer ✅

---

### D-P19 — Machine + barbell, PPL 3j, intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine, barbell], level=intermediate

**Critères coaching :**
- Slot pull[0] : machine-lat-pulldown (slotPrimary back_width) prime sur seed-row-barbell malgré pop plus élevée ✅
- Slot pull[1] : seed-row-barbell (back_thickness) — dos bien couvert ✅
- Barre : bench press et squat barre disponibles — excellent pour hypertrophie ✅

---

### D-P20 — Machine seul, 5j, hypertrophy, advanced (auto)

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[machine], level=advanced, splitPreference=auto

**Critères coaching :**
- 5j auto advanced hypertrophy → ['push','pull','lower-quad','upper','lower-hip'] ✅
- Machine seul : couverture complète sur les 5 types de séances ✅
- PPL+upper+lower : programme varié, chaque groupe musculaire stimulé 2×/sem. ✅

---

### D — Groupe B : Pullover et slots deadlift

### D-P22 — DB seul, strength, 3j, beginner

**Profil :** goal=strength, days=3, duration=60, equipment=[dumbbell], level=beginner

**Critères coaching :**
- Beginner → fullbody×3 (INC-1), 4 slots force 60 min
- seed-pullover (back_width, compound) probable en slot dos ✅
- DB force débutant : poids limités mais apprentissage des patterns ✅

---

### D-P23 — DB seul, fat_loss, 4j, intermediate

**Profil :** goal=fat_loss, days=4, duration=60, equipment=[dumbbell], level=intermediate

**Critères coaching :**
- 4j fat_loss DB : split auto → ['push','pull','lower-quad','fullbody-quad'] ou similaire
- seed-pullover en slot pull[0] (back_width compound) ✅
- Dos couvert (hasCompoundBack=true) → pas de remplacement BUG-BW-PULL ✅

---

### D-P24 — DB seul, 20 min, strength, intermediate

**Profil :** goal=strength, days=3, duration=20, equipment=[dumbbell], level=intermediate

**Critères coaching :**
- INC-1 → fullbody×3, 3 slots (20 min strength)
- Slot dos (index 2) : seed-pullover ou seed-row-dumbbell — dos couvert ✅
- 20 min force : timing irréaliste (RÉSERVE identique à D-P08)

---

### D-P25 — DB seul, 45 min, hypertrophy, beginner

**Profil :** goal=hypertrophy, days=3, duration=45, equipment=[dumbbell], level=beginner

**Critères coaching :**
- Beginner → fullbody×3, 6 slots (45 min hypertrophie)
- seed-pullover (beginner top-1) en slot dos : dos couvert ✅
- 6 exercices 45 min DB débutant : volume adapté ✅

---

### D-P26 — DB seul, 90 min, hypertrophy, intermediate

**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[dumbbell], level=intermediate

**Critères coaching :**
- 8 slots pull 90 min DB : seed-pullover + seed-row-dumbbell composés + seed-pullover-dumbbell isolation ✅
- Couverture dos complète en haltères seul (pullover compound → pullover isolation) ✅
- Volume dos 90 min : élevé mais acceptable pour hypertrophie avancée dos

---

### D-P27 — DB seul, brosplit back-bi, advanced

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[dumbbell], level=advanced, splitPreference=brosplit

**Critères coaching :**
- back-bi[0] : seed-pullover (back_width) — dos compound disponible en DB seul ✅
- back-bi[1] : seed-row-dumbbell (back_thickness) ✅
- back-bi[3] isolation : seed-pullover-dumbbell ou seed-shrug ✅

---

### D-P28 — Barbell seul, 20 min, hypertrophy, intermediate

**Profil :** goal=hypertrophy, days=3, duration=20, equipment=[barbell], level=intermediate

**Critères coaching :**
- 4 slots pull 20 min : seed-row-barbell ou seed-row-tbar en slot[0] (deadlift exclu de pull[0]) ✅
- Barbell : exercices composés lourds optimaux pour hypertrophie ✅
- Slot[1] : seed-deadlift accepté (back inclus dans la liste du slot) ✅

---

### D-P29 — Barbell seul, 45 min, strength, intermediate (INC-1)

**Profil :** goal=strength, days=3, duration=45, equipment=[barbell], level=intermediate

**Critères coaching :**
- INC-1 → fullbody×3, 3 slots (45 min strength)
- Slot dos (index 2) : seed-row-barbell (pop 7) probable — dos couvert ✅
- Barbell force 45 min : squat + bench + rowing = séance force complète en 3 exercices ✅

---

### D-P30 — Barbell seul, 90 min, hypertrophy, intermediate

**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[barbell], level=intermediate

**Critères coaching :**
- 8 slots pull barre : seed-row-barbell + seed-row-tbar + deadlift (sur slots secondaires) ✅
- Couverture dos barbell complète : vertical (manque sans pullup ou cable — RÉSERVE) ✅
- Barbell seul + tirage vertical absent : déséquilibre largeur de dos — RÉSERVE

---

### D-P31 — KB seul, PPL, 3j, fat_loss, intermediate

**Profil :** goal=fat_loss, days=3, duration=60, equipment=[kettlebell], level=intermediate

**Critères coaching :**
- KB : kb-row (back_thickness, compound) → hasCompoundBack=true → pas de BUG-BW-PULL ✅
- Pull[0] : kb-row (deadlift exclu pour ce slot) — dos couvert ✅
- KB fat_loss : kb-swing excellent pour effort cardio-musculaire ✅

---

### D-P32 — KB seul, strength, 4j, upper-lower, intermediate

**Profil :** goal=strength, days=4, duration=60, equipment=[kettlebell], level=intermediate, splitPreference=upper-lower

**Critères coaching :**
- Upper-pull : kb-row en slot[0] dos compound ✅
- 4 slots force 60 min upper-pull — structure correcte ✅
- KB force : progression de charge limited vs barre — RÉSERVE coaching

---

### D-P33 — DB + pullup_bar, PPL 3j, intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell, pullup_bar], level=intermediate

**Critères coaching :**
- seed-pullup (pop 3) > seed-pullover (pop 1) en slot pull[0] — traction prime ✅
- Combo haltères + barre de traction : excellent équipement polyvalent ✅
- Tirage vertical (pullup) + rowing haltère : couverture dos width + thickness ✅

---

### D-P34 — BB+DB, PPL, 3j, advanced

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell, dumbbell], level=advanced

**Critères coaching :**
- Slot pull[0] : seed-pullover (slotPrimary back_width) prime sur seed-row-barbell (pop 7) — priorisation algorithmique sur popularité ⚠️ RÉSERVE coaching
- Un coach préférerait seed-row-barbell pour un avancé force/hypertrophie — seed-pullover est moins polyvalent

---

### D-P35 — Barbell + cable, PPL 3j, intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell, cable], level=intermediate

**Critères coaching :**
- seed-lat-pulldown (cable, back_width, pop 3) en slot pull[0] : tirage vertical cable ✅
- Deadlift exclu de pull[0] ✅
- Barre + cable : équipement optimal pour PPL hypertrophie ✅

---

### D-P36 — Salle complète, PPL, 3j, advanced

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=FULL, level=advanced

**Critères coaching :**
- seed-pullup ou seed-lat-pulldown (tie pop 3) en slot pull[0] — aléatoire parmi top-5 avancé ✅
- Deadlift exclu de pull[0] ✅
- Salle complète PPL avancé : programme hypertrophie optimal ✅

---

### D-P37 — DB seul, lower_pull, 3j, intermediate (focusMuscles=['back','legs'])

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell], level=intermediate, focusMuscles=['back','legs']

**Critères coaching :**
- lower_pull : deadlift + tirage vertical + rowing + squat — chaîne postérieure complète ✅
- lower_pull[1] : seed-pullover (back_width, slotPrimary) en DB seul ✅
- Focus dos + jambes cohérent avec le split lower_pull ✅

---

### D-P39 — KB + band, fullbody, 3j, intermediate

**Profil :** goal=fat_loss, days=3, duration=60, equipment=[kettlebell, band], level=intermediate, splitPreference=fullbody

**Critères coaching :**
- hasCompoundBack : band-row ET kb-row → true → aucun warning dos ✅
- Slot dos : kb-row ou band-row (tie) — aléatoire ✅
- KB + band fat_loss : équipement adapté, effort métabolique élevé ✅

---

### D-P40 — DB + band, PPL, 3j, intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell, band], level=intermediate

**Critères coaching :**
- seed-pullover (back_width) en slot pull[0] — dos couvert ✅
- seed-row-dumbbell (pop 3) > band-row (pop 2) en slot pull[1] ✅
- DB + band : équipement home gym riche pour PPL ✅

---

### D — Groupe C : Interactions BW et warnings

### D-P44 — BW seul, 2j, fullbody, beginner (SEED-BW-NOBACK)

**Profil :** goal=hypertrophy, days=2, duration=60, equipment=[bodyweight], level=beginner

**Critères coaching :**
- SEED-BW-NOBACK émis : l'utilisateur est informé du manque de dos ✅
- 2j BW débutant : programme très limité, seul split acceptable ✅

---

### D-P45 — BW + pullup_bar, fullbody, 3j, beginner (aucun warning)

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight, pullup_bar], level=beginner

**Critères coaching :**
- hasCompoundBack=true (seed-pullup) → aucun warning dos ✅
- BW + pullup_bar : dos couvert via tractions — déséquilibre résolu ✅
- Calisthenics débutant 3j : programme équilibré ✅

---

### D-P46 — BW + band, fullbody, 3j, intermediate (aucun warning)

**Profil :** goal=fat_loss, days=3, duration=60, equipment=[bodyweight, band], level=intermediate

**Critères coaching :**
- hasCompoundBack=true (band-row compound) → aucun warning dos ✅
- Dos couvert via rowing élastique — déséquilibre atténué ✅

---

### D-P48 — BW seul, glutes-focus, 4j (PAS de SEED-BW-NOBACK)

**Profil :** goal=fat_loss, days=4, duration=60, equipment=[bodyweight], level=intermediate, splitPreference=glutes-focus

**Critères coaching :**
- splitPreference='glutes-focus' → SEED-BW-NOBACK non émis (exception) ✅
- Slot dos toujours vide en BW, mais warning individuel par slot émis ✅
- Glutes-focus BW : programme cohérent pour l'objectif spécialisé fessiers ✅

---

### D-P50 — BW seul, strength, 3j, beginner

**Profil :** goal=strength, days=3, duration=60, equipment=[bodyweight], level=beginner

**Critères coaching :**
- Beginner → fullbody×3 (force ou non)
- SEED-BW-NOBACK émis ✅
- BW + force débutant : progression impossible — wizard doit informer ⚠️

---

### D-P51 — BW + cable, PPL, 3j, intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight, cable], level=intermediate

**Critères coaching :**
- seed-lat-pulldown (cable, compound) → hasCompoundBack=true ✅
- Pas de BUG-BW-PULL, pas de SEED-BW-NOBACK ✅
- pull[0] : seed-lat-pulldown (back_width, pop 3) ✅

---

### D-P52 — BW + machine, fullbody, 3j, intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight, machine], level=intermediate

**Critères coaching :**
- machine-lat-pulldown → hasCompoundBack=true → dos couvert ✅
- Aucun warning dos ✅
- BW + machine : curieux comme combinaison (machine isolée sans autres équipements) mais valide ✅

---

### D-P53 — BW + dumbbell, PPL, 3j, intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight, dumbbell], level=intermediate

**Critères coaching :**
- seed-pullover (back_width, dumbbell, compound) → hasCompoundBack=true ✅
- split PPL maintenu (hasCompoundBack=true) ✅
- pull[0] : seed-pullover en slot dos compound ✅

---

### D-P54 — BW seul, brosplit, 5j, intermediate

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[bodyweight], level=intermediate, splitPreference=brosplit

**Critères coaching :**
- hasCompoundBack=false (BW seul)
- hasPullInSplit : vérifier si 'back-bi' → BUG-BW-PULL élargi → 'back-bi' remplacé par 'fullbody-quad'
- Si BUG-BW-PULL déclenché : split modifié, warning émis — utilisateur informé ✅
- BW seul brosplit : équipement inadapté à ce split, le remplacement est une correction coaching correcte ✅

---

### D-P55 — BW seul, 4j, fat_loss, intermediate

**Profil :** goal=fat_loss, days=4, duration=60, equipment=[bodyweight], level=intermediate

**Critères coaching :**
- Split 4j fat_loss intermediate auto : vérifier le type produit (upper-lower ou fullbody)
- hasPullInSplit dépend du split → identifier et appliquer la logique warning ✅
- hasCompoundBack=false → warning dos selon contexte ✅

---

### D-P56 — BW seul, 5j, hypertrophy, advanced

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[bodyweight], level=advanced

**Critères coaching :**
- 5j advanced hypertrophy → ['push','pull','lower-quad','upper','lower-hip']
- hasPullInSplit=true ('pull' présent) → BUG-BW-PULL déclenché ✅
- 'pull' remplacé par 'fullbody-quad' + warning émis ✅
- SEED-BW-NOBACK non émis (hasPullInSplit=true) ✅

---

### D-P57 — BW + barbell, PPL, 3j, intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight, barbell], level=intermediate

**Critères coaching :**
- seed-row-barbell (back_thickness, compound) → hasCompoundBack=true ✅
- Deadlift exclu de pull[0] ✅
- BW + barre : équipement minimal mais efficace pour PPL ✅

---

### D-P59 — BW seul, focusMuscles=['core'], 3j, intermediate

**Profil :** goal=fat_loss, days=3, duration=60, equipment=[bodyweight], level=intermediate, focusMuscles=['core']

**Critères coaching :**
- workoutTypeFromFocus(['core']) → null (core seul → fullbody par défaut, pas 'lower')
- Split résultant : fullbody×3 ou PPF (fat_loss intermediate 3j)
- hasCompoundBack=false → SEED-BW-NOBACK probable ✅
- Focus core : le générateur ajoute un exercice core en fin de séance — cohérent ✅

---

### D-P60 — BW + pullup_bar, strength, 4j, upper-lower, intermediate

**Profil :** goal=strength, days=4, duration=60, equipment=[bodyweight, pullup_bar], level=intermediate, splitPreference=upper-lower

**Critères coaching :**
- hasCompoundBack=true (seed-pullup) → aucun warning dos ✅
- upper-pull[0] : seed-pullup (pullup_bar, pop 3) ✅
- 4 slots force 60 min upper-lower : structure correcte ✅
- BW + pullup_bar + force : progressif via lestage, acceptable ✅

---

### D — Groupe D : Durée × Slots

*Ce groupe valide que le nombre d'exercices par séance est coaching-approprié pour chaque durée et objectif.*

### D-P61 — push, 20 min, hypertrophy, intermediate

**Profil :** goal=hypertrophy, days=3, duration=20, equipment=[barbell,dumbbell,cable], level=intermediate

**Critères coaching :**
- 4 slots push 20 min : ~4 × 4 séries × 1.5 min = 24 min — cohérent ✅
- Slots 0-3 de SLOTS['push'] : chest compound, OHP, chest isolation, triceps — couverture de base ✅

---

### D-P62 — push, 45 min, hypertrophy, intermediate

**Profil :** goal=hypertrophy, days=3, duration=45, equipment=[barbell,dumbbell,cable], level=intermediate

**Critères coaching :**
- 6 slots push 45 min : 6 × 4 séries × 1.5 min = 36 min (sous-estimation des temps de transition) — cohérent ✅
- Chest, OHP, chest isolation, triceps, shoulders_lateral, shoulders_rear : push équilibré ✅

---

### D-P63 — push, 90 min, hypertrophy, intermediate

**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[barbell,dumbbell,cable], level=intermediate

**Critères coaching :**
- 8 slots push 90 min : programme push complet — volume élevé mais justifié sur 90 min ✅
- Couverture : pecs 3 slots, triceps 2 slots, épaules 3 slots — volume par groupe adapté ✅

---

### D-P64 — legs, 20 min, hypertrophy, intermediate

**Profil :** goal=hypertrophy, days=3, duration=20, equipment=[barbell,dumbbell,cable,machine], level=intermediate

**Critères coaching :**
- 4 slots legs 20 min : squat + RDL + isolation quads + isolation ischio — base complète ✅
- 20 min pour 4 exercices jambes composés : timing serré mais acceptable ✅

---

### D-P65 — legs, 90 min, hypertrophy, intermediate

**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[barbell,dumbbell,cable,machine], level=intermediate

**Critères coaching :**
- 8 slots legs 90 min : quads, ischio, glutes, mollets — programme jambes complet ✅
- Volume legs 8 exercices : approprié pour un programme axé sur le développement des jambes ✅

---

### D-P66 — upper, 20 min, strength, intermediate (upper-lower)

**Profil :** goal=strength, days=4, duration=20, equipment=[barbell,dumbbell,cable,machine], level=intermediate, splitPreference=upper-lower

**Critères coaching :**
- 3 slots upper 20 min strength : bench, dos compound, OHP — 3 composés haut du corps ✅
- 20 min force : 3 × 5 séries × 4 min ≈ 60 min — durée annoncée irréaliste, RÉSERVE

---

### D-P67 — upper, 45 min, strength, intermediate

**Profil :** goal=strength, days=4, duration=45, equipment=[barbell,dumbbell,cable,machine], level=intermediate, splitPreference=upper-lower

**Critères coaching :**
- 3 slots upper 45 min strength (même formule que 20 min strength) ✅
- 45 min pour 3 exercices force : 3 × 5 séries × 4 min = 60 min — RÉSERVE identique

---

### D-P68 — upper, 60 min, strength, intermediate

**Profil :** goal=strength, days=4, duration=60, equipment=[barbell,dumbbell,cable,machine], level=intermediate, splitPreference=upper-lower

**Critères coaching :**
- 4 slots upper 60 min strength (≠ 3 slots à 45 min) : 4 × 5 séries × 4 min = 80 min — cohérent ✅
- Ajout d'un 4e composé (OHP ou isolation) par rapport à 45 min — progression logique ✅

---

### D-P69 — upper, 90 min, strength, intermediate

**Profil :** goal=strength, days=4, duration=90, equipment=[barbell,dumbbell,cable,machine], level=intermediate, splitPreference=upper-lower

**Critères coaching :**
- 5 slots upper 90 min strength : 5 × 5 séries × 4 min = 100 min — proche de 90 min, RÉSERVE
- Programme haut du corps force complet sur 5 composés ✅

---

### D-P70 — fullbody, 20 min, strength, intermediate (INC-1)

**Profil :** goal=strength, days=3, duration=20, equipment=[barbell,dumbbell,cable,machine], level=intermediate

**Critères coaching :**
- INC-1 → fullbody×3, 3 slots (20 min strength)
- 3 exercices : quad compound, chest compound, dos compound — squelette force minimal ✅
- 20 min pour 3 exercices force : irréaliste (RÉSERVE identique à D-P08, D-P66)

---

### D-P71 — fullbody, 90 min, hypertrophy, beginner

**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[barbell,dumbbell,cable,machine,pullup_bar], level=beginner

**Critères coaching :**
- Beginner → fullbody×3, 8 slots 90 min (cap)
- 8 exercices fullbody débutant 90 min : volume élevé pour un débutant — RÉSERVE
- Salle complète : tous les groupes musculaires couverts ✅

---

### D-P72 — back-bi, 20 min, hypertrophy, intermediate (brosplit)

**Profil :** goal=hypertrophy, days=5, duration=20, equipment=[barbell,dumbbell,cable,machine,pullup_bar], level=intermediate, splitPreference=brosplit

**Critères coaching :**
- 4 slots back-bi 20 min : dos compound × 2 + biceps + isolation dos — couverture dos correcte ✅
- 20 min brosplit dos : 4 exercices en 20 min — timing très serré ✅

---

### D-P74 — lower-quad, 20 min, fat_loss, intermediate (upper-lower)

**Profil :** goal=fat_loss, days=4, duration=20, equipment=[barbell,dumbbell,cable,machine], level=intermediate, splitPreference=upper-lower

**Critères coaching :**
- 4 slots lower-quad 20 min fat_loss : squat + RDL + isolation quads + isolation ischio ✅
- 20 min jambes fat_loss : 4 exercices × 3 séries × ~2 min = 24 min — cohérent ✅

---

### D-P75 — lower-quad, 90 min, fat_loss, intermediate (upper-lower)

**Profil :** goal=fat_loss, days=4, duration=90, equipment=[barbell,dumbbell,cable,machine], level=intermediate, splitPreference=upper-lower

**Critères coaching :**
- 8 slots lower-quad 90 min : programme jambes complet fat_loss ✅
- Volume jambes élevé : approprié pour dépense calorique fat_loss ✅

---

### D-P76 — glutes-hip, 20 min, fat_loss, intermediate (glutes-focus)

**Profil :** goal=fat_loss, days=4, duration=20, equipment=[dumbbell,machine], level=intermediate, splitPreference=glutes-focus

**Critères coaching :**
- 4 slots glutes-hip 20 min : hip thrust, RDL, squat, dos compound (index 3 inclus ✅)
- Le slot dos posture (index 3) est dans les 4 premiers → machine-lat-pulldown ✅
- 20 min 4 exercices fat_loss : cohérent ✅

---

### D-P77 — glutes-hip, 45 min, fat_loss, intermediate (glutes-focus)

**Profil :** goal=fat_loss, days=4, duration=45, equipment=[dumbbell,machine], level=intermediate, splitPreference=glutes-focus

**Critères coaching :**
- 6 slots glutes-hip 45 min : couverture fessiers + ischio + dos complète ✅
- Slot dos (index 3) et isolation ischio (index 5) inclus dans les 6 premiers ✅

---

### D-P78 — pull, 20 min, fat_loss, intermediate (PPF)

**Profil :** goal=fat_loss, days=3, duration=20, equipment=[barbell,dumbbell,cable], level=intermediate

**Critères coaching :**
- Split PPF : ['push','pull','fullbody-quad'] ✅
- 4 slots pull 20 min fat_loss : dos couvert en 4 exercices ✅

---

### D-P79 — upper-pull, 45 min, hypertrophy, intermediate (upper-lower)

**Profil :** goal=hypertrophy, days=4, duration=45, equipment=[barbell,dumbbell,cable,machine,pullup_bar], level=intermediate, splitPreference=upper-lower

**Critères coaching :**
- 6 slots upper-pull 45 min : dos compound ×2 + bench incliné + face pull + biceps + isolation dos ✅
- Salle complète 45 min upper-pull : programme dense et équilibré ✅

---

### D-P80 — 2j, 90 min, hypertrophy, beginner

**Profil :** goal=hypertrophy, days=2, duration=90, equipment=[barbell,dumbbell,cable,machine,pullup_bar], level=beginner

**Critères coaching :**
- Split fullbody 2j : minimal pour hypertrophie, mais 90 min permet 8 exercices — volume compensé ✅
- Beginner top-1 : sélection déterministe — exercices les plus populaires ✅
- 2j/sem. fullbody beginner : fréquence faible mais acceptable en débutant ✅

---

### D — Groupe E : FocusMuscles, split selection, UX warnings

### D-P84 — focusMuscles=['legs'], 3j, intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable,machine], level=intermediate

**Critères coaching :**
- workoutTypeFromFocus(['legs']) → 'lower' → alternance lower-quad / lower-hip ✅
- Programme entier dédié aux jambes : sous-développement haut du corps sur la durée
- Acceptable si l'utilisateur complète avec une activité haut du corps externe

---

### D-P85 — focusMuscles=['core'], 3j, intermediate

**Profil :** goal=fat_loss, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate

**Critères coaching :**
- workoutTypeFromFocus(['core']) → null → split par défaut PPF
- Core ajouté en fin de chaque séance via corePool ✅
- Programme fat_loss avec emphase core : cohérent ✅

---

### D-P90 — focusMuscles=['chest','back'], 3j, intermediate (haut mixte)

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate

**Critères coaching :**
- workoutTypeFromFocus(['chest','back']) → 'upper' (push+pull mixte) ✅
- Split 3j upper intermédiaire : ['push','pull','upper'] (PPU) ✅
- Push+pull équilibre agoniste/antagoniste : excellent pour la santé articulaire ✅

---

### D-P91 — focusMuscles=['back','arms'], 3j, intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate

**Critères coaching :**
- workoutTypeFromFocus(['back','arms']) → 'pull' (hasPull=true) ✅
- Split pull-based 3j : ['pull','upper-pull','pull'] — dos dominant ✅
- Bras bénéficient des séances pull (synergistes) ✅

---

### D-P92 — UX-B warning : focusMuscles=['arms'] en push split

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate, focusMuscles=['arms']

**Critères coaching :**
- workoutTypeFromFocus(['arms']) → 'upper' (hasArms → hasUpper) — pas de 'push' seul
- Mais split résultant push-focused → biceps sous-représenté
- Warning UX-B doit être émis : "Focus bras en push — biceps non ciblé en séance push" ✅
- Coaching : le wizard doit avertir que 'arms' seul donne un split push/upper sans séance pull dédiée

---

### D-P93 — UX-B warning : focusMuscles=['shoulders'] en push split

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate, focusMuscles=['shoulders']

**Critères coaching :**
- Split PPU (shoulders → push) avec warning UX-B émis ✅
- Épaules bien couvertes en push : OHP + écarté latéral + face pull ✅

---

### D-P94 — UX-B absent : focusMuscles=['chest'] en push

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate, focusMuscles=['chest']

**Critères coaching :**
- UX-B non émis (chest ≠ arms/shoulders) ✅
- Split push-focused cohérent avec focus pectoraux ✅

---

### D-P95 — brosplit, 5j, intermediate, salle complète

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=FULL, level=intermediate

**Critères coaching :**
- Brosplit salle complète intermédiaire : compatible wizard (5j, pas débutant, hypertrophie) ✅
- back-bi[0] : dos compound non vide ✅
- Deadlift exclu de back-bi[0] ✅
- 5j brosplit : volume par groupe élevé, approprié pour intermédiaire confirmé ✅

---

### D-P96 — arnold, 5j, intermediate, salle complète

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=FULL, level=intermediate

**Critères coaching :**
- Arnold split intermédiaire salle : compatible wizard ✅
- chest-back[1] dos compound inclus ✅
- Arnold 5j : volume chest+back dans la même séance — antagonistes en superset potentiel ✅

---

### D-P97 — totalWeeks=4, hypertrophy, intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate, totalWeeks=4

**Critères coaching :**
- Programme 4 semaines : phases buildPhases(4) correctement structurées
- Phase deload si totalWeeks≥4 : name='Récup.' ✅
- Bloc court : utile pour évaluation initiale ou retour après blessure ✅

---

### D-P98 — totalWeeks=12, hypertrophy, intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate, totalWeeks=12

**Critères coaching :**
- Programme 12 semaines : phases incluant deload ✅
- Phase deload : name='Récup.', focus='deload' ✅
- 12 semaines = durée classique pour des gains visibles en hypertrophie ✅

---

### D-P99 — selectedDays=[lun,mer,ven], 3j, hypertrophy, intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell,dumbbell,cable], level=intermediate, selectedDays=['monday','wednesday','friday']

**Critères coaching :**
- Jours espacés (48h de récupération entre séances) : optimal pour hypertrophie ✅
- Split PPL respecté, aucun impact sur la sélection d'exercices ✅

---

### D-P100 — Profil complet : toutes options combinées

**Profil :** goal=hypertrophy, days=4, duration=45, equipment=[dumbbell,machine,pullup_bar], level=advanced, focusMuscles=['back','legs'], selectedDays=[mar,jeu,sam,dim], totalWeeks=8

**Critères coaching :**
- workoutTypeFromFocus(['back','legs']) → 'lower_pull' ✅
- split 4j : ['lower_pull','lower_pull','lower_pull','lower_pull'] (type fixe)
- 6 slots lower_pull 45 min hypertrophie ✅
- seed-pullup (pullup_bar, back_width, pop 3) en slot tirage vertical ✅
- Programme 8 semaines, phase deload='Récup.' ✅
- Dos + jambes uniquement : programme de spécialisation, pas de push — acceptable si volontaire ✅

---

## GROUPE E — Régressions v9 : isolation machine + pullover + BUG-BW-PULL élargi

*Les profils G-V9-P19 (focusMuscles=['glutes'] BW 3j) et G-V9-P20 (focusMuscles=['glutes'] 4j et 5j) ont été retirés : 'glutes' n'est pas disponible dans les FOCUS_OPTIONS du wizard.*

---

### Groupe A — Fix 1 : isolation dos machine

### G-V9-P01 — Machine · PPL, 45 min, hypertrophy, intermediate

**Profil :** goal=hypertrophy, days=3, duration=45, equipment=[machine], level=intermediate

**Critères coaching :**
- 6 slots pull 45 min : machine-lat-pulldown + seed-row-machine + machine-low-row (isolation) ✅
- Dos entièrement couvert en machine seul (compound + isolation) ✅
- Aucun slot isolation dos vide — correction v9 vérifiée ✅

---

### G-V9-P02 — Machine · PPL, 90 min, hypertrophy, advanced

**Profil :** goal=hypertrophy, days=3, duration=90, equipment=[machine], level=advanced

**Critères coaching :**
- 8 slots pull 90 min : lat pulldown + row machine + machine-low-row + machine-pullover ✅
- Couverture dos machine complète (width + thickness + isolation ×2) ✅
- Programme dos machine avancé 90 min : volume élevé cohérent ✅

---

### G-V9-P03 — Machine · Brosplit back-bi, 45 min, advanced

**Profil :** goal=hypertrophy, days=5, duration=45, equipment=[machine], level=advanced, splitPreference=brosplit

**Critères coaching :**
- 6 slots back-bi : lat pulldown + row machine + biceps + machine-low-row ✅
- Slot isolation dos rempli (machine-low-row) — correction v9 vérifiée ✅

---

### G-V9-P04 — Machine · Arnold, chest-back, 45 min, intermediate

**Profil :** goal=hypertrophy, days=5, duration=45, equipment=[machine], level=intermediate, splitPreference=arnold

**Critères coaching :**
- 6 slots chest-back : pec machine, lat pulldown, OHP machine, row machine, fly machine, machine-low-row ✅
- Isolation dos remplie (machine-low-row) — correction v9 vérifiée ✅

---

### G-V9-P05 — Machine · PPL, 20 min, hypertrophy, intermediate

**Profil :** goal=hypertrophy, days=3, duration=20, equipment=[machine], level=intermediate

**Critères coaching :**
- 4 slots pull 20 min : lat pulldown + row machine + machine-low-row + biceps ✅
- Tous les slots remplis en machine — correction v9 vérifiée ✅

---

### G-V9-P06 — Machine · PPL, 60 min, hypertrophy, intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine], level=intermediate

**Critères coaching :**
- 8 slots pull : machine-low-row (slot 3) + machine-pullover (slot 8) ✅
- Aucun slot isolation dos vide — correction v9 vérifiée ✅

---

### G-V9-P07 — Machine · Brosplit back-bi, 20 min, intermediate

**Profil :** goal=hypertrophy, days=5, duration=20, equipment=[machine], level=intermediate, splitPreference=brosplit

**Critères coaching :**
- 4 slots : lat pulldown + row machine + biceps + machine-low-row ✅
- Correction v9 vérifiée — aucun slot vide ✅

---

### G-V9-P08 — Machine · Brosplit back-bi, 90 min, advanced

**Profil :** goal=hypertrophy, days=5, duration=90, equipment=[machine], level=advanced, splitPreference=brosplit

**Critères coaching :**
- 8 slots : 2 composés dos + biceps ×3 + machine-low-row + machine-pullover ✅
- Couverture isolation dos complète (≥2 exercices isolation) ✅

---

### G-V9-P09 — Machine + pullup_bar · PPL, 45 min, intermediate

**Profil :** goal=hypertrophy, days=3, duration=45, equipment=[machine, pullup_bar], level=intermediate

**Critères coaching :**
- seed-pullup (pop 3) > machine-lat-pulldown (pop 2) en slot pull[0] ✅
- machine-low-row disponible pour isolation dos ✅
- Pullup_bar non impacté par les corrections machine ✅

---

### G-V9-P10 — Machine · Strength, INC-1, fullbody, 60 min, intermediate

**Profil :** goal=strength, days=3, duration=60, equipment=[machine], level=intermediate

**Critères coaching :**
- INC-1 → fullbody×3, 4 slots (strength 60 min)
- fullbody[2] dos compound : machine-lat-pulldown ✅
- 4 slots seulement → pas de slot isolation → machine-low-row non attendu ✅
- hasCompoundBack=true → pas de warning ✅

---

### Groupe B — Fix 2 & 3 : pullover isolation + BUG-BW-PULL élargi

### G-V9-P11 — BB+DB · PPL, pull[0] → barbell-row prime

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell, barbell], level=intermediate

**Critères coaching :**
- seed-pullover exclu du slot compound (désormais isolation) ✅
- seed-row-barbell (pop 7) en pull[0] — exercice composé optimal ✅
- seed-pullover en slot isolation (pull[2]) ✅
- Barbell + haltères : combinaison idéale, meilleur du bilat + unilatéral ✅

---

### G-V9-P12 — DB seul · PPL, pull[0] → row-dumbbell prime

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[dumbbell], level=intermediate

**Critères coaching :**
- seed-pullover exclu du slot compound ✅
- seed-row-dumbbell en pull[0] : seul composé dos disponible en DB ✅
- seed-pullover en slot isolation ✅
- hasCompoundBack=true → pas de BUG-BW-PULL ✅

---

### G-V9-P13 — BW · PPL → BUG-BW-PULL (comportement attendu)

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight], level=intermediate

**Critères coaching :**
- hasPullInSplit=true → BUG-BW-PULL → 'pull' remplacé par 'fullbody-quad' ✅
- Utilisateur informé via warning ✅
- Programme adapté à l'équipement disponible ✅

---

### G-V9-P14 — BW · Brosplit → BUG-BW-PULL élargi back-bi

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[bodyweight], level=advanced, splitPreference=brosplit

**Critères coaching :**
- 'back-bi' dans backSessionTypes → BUG-BW-PULL déclenché ✅
- 'back-bi' remplacé par 'fullbody-quad' + warning émis ✅
- Programme cohérent malgré la contrainte BW ✅

---

### G-V9-P15 — BW · Arnold → BUG-BW-PULL élargi chest-back

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[bodyweight], level=advanced, splitPreference=arnold

**Critères coaching :**
- 'chest-back' → BUG-BW-PULL → remplacé par 'push' ✅
- Warning émis ✅
- SEED-BW-NOBACK absent (hasPullInSplit=true) ✅

---

### G-V9-P16 — BW · Upper-lower, 4j → SEED-BW-NOBACK

**Profil :** goal=hypertrophy, days=4, duration=60, equipment=[bodyweight], level=intermediate

**Critères coaching :**
- Split ['upper-push','lower-quad','upper-pull','lower-hip']
- hasPullInSplit : 'upper-pull' ≠ 'pull' strict → false (selon implémentation)
- SEED-BW-NOBACK émis si hasPullInSplit=false ✅
- Coaching : upper-lower BW sans pullup_bar crée un déséquilibre dos — warning correct ✅

---

### G-V9-P17 — BW · Fat_loss, PPF → BUG-BW-PULL ('pull' strict)

**Profil :** goal=fat_loss, days=3, duration=60, equipment=[bodyweight], level=intermediate

**Critères coaching :**
- Split PPF : ['push','pull','fullbody-quad']
- 'pull' exact → hasPullInSplit=true → BUG-BW-PULL ✅
- Warning émis, programme adapté ✅

---

### G-V9-P18 — BW · Fullbody, 3j → SEED-BW-NOBACK

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight], level=beginner

**Critères coaching :**
- Split fullbody×3 : hasPullInSplit=false, isGlutesSplit=false → SEED-BW-NOBACK émis ✅
- Comportement inchangé ✅

---

### G-V9-P21 — BW + band · Brosplit, 5j, advanced

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[bodyweight, band], level=advanced, splitPreference=brosplit

**Critères coaching :**
- hasCompoundBack=true (band-row compound) → BUG-BW-PULL et SEED-BW-NOBACK absents ✅
- Split brosplit maintenu sans modification ✅
- back-bi : band-row ou bw-inverted-row en compound ✅

---

### G-V9-P22 — BW · 2j, fullbody → SEED-BW-NOBACK

**Profil :** goal=fat_loss, days=2, duration=60, equipment=[bodyweight], level=beginner

**Critères coaching :**
- Split fullbody-quad + fullbody-hip : SEED-BW-NOBACK émis ✅
- Comportement inchangé ✅

---

### Groupe C — Régressions globales et cas limites

### G-V9-P23 — Salle complète · PPL, 60 min, intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[barbell, dumbbell, cable, pullup_bar, machine], level=intermediate

**Critères coaching :**
- pull[0] : seed-pullup ou seed-lat-pulldown (tie pop 3) — un des deux sélectionné aléatoirement ✅
- seed-pullover absent du slot compound (maintenant isolation) ✅
- Deadlift exclu ✅
- Programme PPL salle complète intermédiaire : optimal ✅

---

### G-V9-P24 — Machine + cable · Upper-lower, 4j, 60 min, intermediate

**Profil :** goal=hypertrophy, days=4, duration=60, equipment=[machine, cable], level=intermediate

**Critères coaching :**
- upper-pull[0] : seed-lat-pulldown (cable, pop 3) > machine-lat-pulldown (pop 2) ✅
- Slot isolation upper-pull[2] : machine-low-row ou seed-pullover-cable ✅
- Machine + cable : bon équipement pour isolation ✅

---

### G-V9-P25 — DB · Arnold, 5j, 60 min, intermediate

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[dumbbell], level=intermediate, splitPreference=arnold

**Critères coaching :**
- chest-back[1] : seed-row-dumbbell (compound) — seed-pullover exclu du slot compound ✅
- chest-back[5] isolation dos : seed-pullover (isolation, dumbbell) ✅
- Arnold split DB : acceptable pour hypertrophie intermédiaire ✅

---

### G-V9-P26 — Barbell · PPL, 60 min, strength, intermediate

**Profil :** goal=strength, days=3, duration=60, equipment=[barbell], level=intermediate

**Critères coaching :**
- pull[0] : seed-row-barbell (seul composé dos barbell, deadlift exclu) ✅
- Barbell force : progression externe mesurable ✅
- PPL + force + barbell seul : tirage vertical impossible (pas de pullup_bar ni cable) — RÉSERVE

---

### G-V9-P27 — KB · PPL, 60 min, intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[kettlebell], level=intermediate

**Critères coaching :**
- hasCompoundBack=true (kb-row) → pas de BUG-BW-PULL ✅
- pull[0] : kb-row (seul composé dos KB) ✅
- KB PPL : équipement fonctionnel pour hypertrophie ✅

---

### G-V9-P28 — Machine · Glutes-focus, 3j, intermediate (regression machine-pullover)

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine], splitPreference=glutes-focus

**Critères coaching :**
- glutes-hip[3] slot isolation dos : machine-pullover (back_width, isolation) ✅
- SEED-BW-NOBACK non émis (splitPreference='glutes-focus') ✅
- Machine + glutes-focus : couverture complète ✅

---

### G-V9-P29 — Machine · focusMuscles=['back'], 3j, intermediate

**Profil :** goal=hypertrophy, days=3, duration=60, equipment=[machine], focusMuscles=['back']

**Critères coaching :**
- workoutTypeFromFocus(['back']) → 'pull' → split pull-based ✅
- pull[2] isolation dos : machine-low-row ✅
- Aucun slot isolation dos vide — correction v9 vérifiée ✅

---

### G-V9-P30 — BW · Arnold, 5j, advanced (régression combinée)

**Profil :** goal=hypertrophy, days=5, duration=60, equipment=[bodyweight], level=advanced, splitPreference=arnold

**Critères coaching :**
- Arnold contient 'chest-back' → hasPullInSplit=true → BUG-BW-PULL
- 'chest-back' → remplacé par 'push' ✅
- Warning émis ✅
- isGlutesSplit=false → SEED-BW-NOBACK absent (hasPullInSplit=true) ✅
- Programme adapté à la contrainte BW ✅

---

## SYNTHÈSE FINALE ATTENDUE

Après tous les groupes, produire :

1. **Tableau global de verdicts** (✅/⚠️/❌) par profil — tous groupes confondus
2. **Liste des ❌ Problème sérieux** — programmes inadaptés, déséquilibrés ou trompeurs
3. **Liste des ⚠️ Problème mineur** — points d'attention coaching (timing serré, déséquilibre, limitation équipement)
4. **Profils avec warnings attendus** — vérifier que les avertissements informent correctement l'utilisateur
5. **Bugs / anomalies logicielles** (assertions FAIL globales) — si nouveaux problèmes détectés
6. **Recommandations** — thèmes récurrents et suggestions d'amélioration

---

## PROFILS RETIRÉS (non reproductibles via le wizard)

| Profil | Raison de suppression |
|--------|----------------------|
| C01 — focusMuscles=['glutes','back'] | 'glutes' absent des options de focus du wizard |
| C02 — focusMuscles=['glutes','back'] | idem |
| C03 — focusMuscles=['glutes'] BW | idem |
| C04 — focusMuscles=['glutes'] DB+BW | idem |
| C06 — glutes-focus + strength | glutes-focus désactivé pour goal=strength dans le wizard |
| D-P73 — arnold + strength | arnold désactivé pour goal=strength dans le wizard |
| D-P86 — focusMuscles=['glutes'] | 'glutes' absent des options de focus |
| D-P87 — focusMuscles=['glutes'] 4j | idem |
| D-P88 — focusMuscles=['glutes'] 5j | idem |
| D-P89 — focusMuscles=['glutes'] 2j | idem |
| G-V9-P19 — focusMuscles=['glutes'] BW 3j | idem |
| G-V9-P20 — focusMuscles=['glutes'] 4j et 5j | idem |

**Note :** Ces profils testaient des chemins de code accessibles en appelant directement l'API du générateur, mais impossibles via l'interface wizard. Pour tester `workoutTypeFromFocus(['glutes'])`, utiliser `splitPreference='glutes-focus'` dans le wizard (résultat équivalent).
