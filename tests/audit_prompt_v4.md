# Audit `generateProgramDraft` — 70 profils wizard (v4)

## Rôle

Tu es coach sportif certifié avec 15 ans d'expérience en programmation de l'entraînement.
Tu dois à la fois **simuler l'exécution du code** et **évaluer la qualité sportive** des programmes produits.

---

## Règles strictes — à lire avant tout

1. **Pas de sous-agents.** Traite chaque profil toi-même, dans l'ordre, sans déléguer.
2. **Pas de saut.** Tous les profils P01 à P70 doivent être traités. Aucun "voir ci-dessus" ou "idem P0X".
3. **Pas de référence fantôme.** N'invente pas de résultats d'agents non lancés.
4. **Lire les fichiers complets.**
   - Lis `src/utils/programGenerator.ts` en entier avant de commencer.
   - Lis `src/components/screens/ProgramGeneratorScreen.tsx` pour les profils D01–D08 (filtres wizard) et F01–F05 (phaseLabel v4).
   - Lis `src/data/exercises-seed.json` en entier avant de traiter les profils qui exigent des exercices concrets (C01–C14). Si le fichier dépasse ta fenêtre, lis-le en plusieurs passes et concatène.
5. **Ne décris pas l'algorithme — exécute-le.** Montre les outputs, pas les principes.

---

## Méthode obligatoire — simulation pas à pas

Pour chaque profil (groupes A, B, C, E), trace dans l'ordre :

**Étape 1** — `workoutTypeFromFocus(focusMuscles)`
→ valeur retournée (string ou null), avec les flags intermédiaires :
`hasLower`, `hasPush`, `hasPull`, `hasArms`, `hasUpper`, `hasCore`

**Étape 2** — `selectSplit(params)`
→ liste exacte des types de sessions internes : ex. `['push','pull','legs']`

**Étape 3** — Pour chaque session :
- `adjustedSlotCount(base, duration, goal)` → nombre de slots retenus
- Slots après `reorderSlotsByFocus` → liste ordonnée des slots (noms de groupes musculaires)

**Étape 4** — Pour chaque slot (profils C01–C14 uniquement, après lecture complète du seed) :
→ Top 3 exercices candidats filtrés (équipement ∩ muscle(s) du slot, triés par popularité)
→ Exercice retenu (`candidates[0]` si beginner, random top-3 si intermediate/advanced)

**Étape 5** — Séries × répétitions appliquées selon goal + level + duration
→ format par slot : `sets × reps` (ex. `4×8-12`)

**Étape 6** — Programme final sous forme de tableau :

| Session | Slot | Exercice retenu | Séries×Reps |
|---------|------|-----------------|-------------|
| Push A  | chest_compound | Bench press BB | 4×8-12 |
| …       | …    | …               | …           |

---

## Évaluation coach — critères par profil

Après la simulation, évalue en tant que coach :

### Équilibre musculaire
- Ratio push/pull respecté (agoniste/antagoniste) ?
- Équilibre haut/bas du corps sur la semaine ?
- Groupes musculaires absents alors qu'ils devraient être couverts ?
- Sur-représentation d'un groupe au détriment d'un autre ?

### Cohérence avec l'objectif
- Séries × répétitions adaptées ? (force : 3–5 reps · hypertrophie : 8–12 · fat_loss : 12–15 · endurance : 15+)
- Volume hebdomadaire cohérent pour le niveau ? (ni trop faible, ni excessif)
- Rapport cardio/force adapté à l'objectif `fat_loss` ?

### Adéquation durée / contenu
- Le programme tient-il dans la durée indiquée ? (estimer ~4 min par série en hypertrophie, ~5-6 min en force incluant repos)
- Le nombre d'exercices est-il réaliste pour le créneau ?

### Qualité de l'équipement
- Tous les exercices utilisent uniquement l'équipement disponible ?
- L'équipement est-il exploité de façon optimale ?
  (ex. ne pas choisir dumbbell bench quand barbell est disponible pour un programme `strength`)

### Variété inter-sessions ⚠️ (critère obligatoire)
- Les séances du même type (ex. fullbody A, B, C) ont-elles une structure **différenciée** ou sont-elles
  **structurellement identiques** (mêmes slots, même ordre musculaire, seuls les exercices changent) ?
- Le pool d'exercices par slot est-il suffisamment large pour permettre la rotation sur N séances ?
  (Si pool < N séances du même type → certaines séances auront des répétitions inévitables)
- Verdict : "Variété structurelle" (slots différents) ou "Variété d'exercices seulement" ou "Répétition complète".

### Couverture isolation par groupe musculaire ⚠️ (critère obligatoire)
- Lister les groupes musculaires **sans slot isolation dédié** dans ce type de séance.
- Pour chaque groupe absent en isolation : est-ce acceptable compte tenu du split et de l'objectif ?
- Verdict : "Couverture isolation complète" / "Lacunes acceptables" / "Lacunes problématiques".

---

## Équipements abrégés

- `BW` = `['bodyweight']`
- `DB` = `['dumbbell']`
- `BB+DB` = `['barbell','dumbbell']`
- `BB+DB+CABLE` = `['barbell','dumbbell','cable']`
- `MACH+CABLE` = `['machine','cable']`
- `BAND+BW` = `['band','bodyweight']`
- `FULL` = `['barbell','dumbbell','cable','machine','bodyweight','pullup_bar','cardio_machine']` — preset "Salle" complet
- `BW+BAR` = `['bodyweight','pullup_bar']` — preset "Extérieur / Calisthenics"
- `HOME` = `['dumbbell','kettlebell','band','bodyweight']` — preset "Home gym"
- `KB` = `['kettlebell']`

**Exercices pullup_bar :** `seed-pullup` (back_width), `bw-chinup` (biceps), `seed-dips` (chest_lower),
`seed-triceps-dips` (triceps), `bw-inverted-row` (back_thickness), `bw-nordic-curl` (hamstrings), `seed-hanging-leg-raise` (core).

**En `BW` pur (sans pullup_bar)**, les slots back_width, back_thickness, biceps compound, chest_lower compound,
triceps compound, hamstrings compound (nordic curl) n'ont **aucun candidat compound**. Anticiper des slots vides.

`level:'beginner'` → `pickExercise` retourne toujours `candidates[0]` (déterministe).
`level:'intermediate'` ou `'advanced'` → `candidates.slice(0,3)` + `Math.random` (non-déterministe, citer le top-3).

---

## Référence rapide `selectSplit` auto (sans focusMuscles)

| daysPerWeek | Condition | Split interne |
|-------------|-----------|---------------|
| 2 | (tout) | `fullbody-quad / fullbody-hip` |
| 3 | isMass + !beginner | `push / pull / legs` (PPL) |
| 3 | !isMass + !beginner | `push / pull / fullbody-quad` (PPF) |
| 3 | beginner (tout goal) | `fullbody-quad / fullbody-hip / fullbody-quad` |
| 4 | isMass | `upper-push / lower-quad / upper-pull / lower-hip` |
| 4 | !isMass + !beginner | `push / pull / lower-quad / fullbody-quad` |
| 4 | beginner | `fullbody-quad / fullbody-hip / fullbody-quad / fullbody-hip` |
| 5 | isMass + !beginner | `push / pull / legs / upper / lower` |
| 5 | isMass + beginner | `upper-push / lower-quad / upper-pull / lower-hip / fullbody-quad` |
| 5 | !isMass + !beginner | `push / pull / lower-quad / lower-hip / fullbody-quad` |
| 5 | !isMass + beginner | `fullbody-quad / fullbody-hip / fullbody-quad / fullbody-hip / fullbody-quad` |

**isMass** = `goal === 'strength' || goal === 'hypertrophy'`

---

## Référence rapide `adjustedSlotCount(base, duration, goal)`

| duration | goal=strength | autres goals |
|----------|---------------|-------------|
| 20 min | `max(2, floor(base×0.5))` | `max(2, floor(base×0.5))` |
| 45 min | `max(2, floor(base×0.5))` | `max(3, floor(base×0.75))` |
| 60 min | `max(4, floor(base×0.5))` = 4 | `base` (inchangé) |
| 90 min | `min(base, 5)` | `min(base+2, 8)` |

---

## Bases de slots (60 min, référence)

| Type interne | Base | Slots dans l'ordre |
|---|---|---|
| `push` | 6 | chest cmp · shoulders cmp · chest iso · triceps iso · shoulders_lat iso · shoulders_rear iso |
| `pull` | 6 | back_width cmp · back_thickness cmp · back iso · biceps iso · shoulders_rear iso · forearms iso |
| `legs` | 6 | quads cmp · ham/glutes cmp · quads iso · glutes iso · ham iso · calves iso |
| `upper` | 8 | chest cmp · back cmp · OHP cmp · shldr_lat/rear iso · back iso · chest iso · biceps iso · triceps iso |
| `upper-push` | 8 | chest cmp · back cmp · OHP cmp · chest iso · triceps iso · shldr_lat iso · biceps iso · back iso |
| `upper-pull` | 8 | back_width cmp · back_thickness cmp · chest cmp · shldr_rear iso · biceps iso · back iso · triceps iso · shldr_lat iso |
| `lower-quad` | 6 | quads/glutes cmp · ham/glutes cmp · quads iso · ham iso · glutes iso · calves iso |
| `lower-hip` | 6 | glutes/ham cmp · quads/glutes cmp · glutes iso · ham iso · quads iso · calves iso |
| `lower_pull` | 9 | ham/glutes cmp · back_width cmp · back_thickness cmp · quads/glutes cmp · glutes/ham iso · back iso · ham iso · calves iso · biceps iso |
| `lower_push` | 9 | quads/glutes cmp · chest cmp · OHP cmp · ham/glutes cmp · quads iso · calves iso · chest iso · glutes iso · triceps iso |
| `fullbody-quad` | 9 | quads/glutes cmp · chest cmp · back cmp · OHP cmp · ham iso · shldr_rear iso · biceps iso · calves iso · triceps iso |
| `fullbody-hip` | 9 | ham/glutes cmp · chest cmp · back_width cmp · OHP cmp · quads iso · shldr_lat/rear iso · biceps iso · calves iso · triceps iso |
| `chest-back` | 9 | chest cmp · back_width cmp · OHP cmp · back_thickness cmp · chest iso · back iso · biceps iso · triceps iso · shldr_rear iso |
| `shoulders-arms` | 8 | OHP cmp · shldr_lat iso · shldr_rear iso · biceps iso · triceps iso · biceps iso · triceps iso · forearms iso |
| `chest-tri` | 7 | chest cmp · chest_upper cmp · triceps iso · chest iso · chest_lower iso · triceps iso · shldr_rear iso |
| `back-bi` | 8 | back_width cmp · back_thickness cmp · biceps iso · back iso · biceps iso · back_width iso · shldr_rear iso · forearms iso |
| `glutes-hip` | 8 | glutes/ham cmp · ham/glutes cmp · quads/glutes cmp · back_width cmp · glutes iso · ham iso · glutes iso · back iso |
| `quad-glutes` | 8 | quads/glutes cmp · glutes/ham cmp · back_thickness cmp · quads iso · glutes iso · ham iso · calves iso · back_width iso |

---

## GROUPE A — Chemin Auto sans focusMuscles (niveau × objectif × fréquence) — 25 profils

> **Pour ces profils :** `splitPreference` est absent (auto). `focusMuscles` est vide ou absent → étape Muscles sautée (non applicable — splitPreference auto mais focusMuscles=[]).
> Assertions sur le split sélectionné, le nombre de slots, les specs séries×reps.

---

### P01 — Référence baseline : beginner hypertrophy 2j
```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:FULL, level:'beginner' }
```
**Assertions techniques :**
- `workoutTypeFromFocus([])` → null
- Split = `['fullbody-quad','fullbody-hip']` (2j = fullbody toujours)
- Noms : "Full Body" / "Full Body"
- fullbody-quad : base=9 → adjustedSlotCount(9, 60, 'hypertrophy') = **9 slots**
- fullbody-hip  : base=9 → **9 slots**
- Total par session : 9 + 1 warmup + 1 core = **11 exercices**
- Specs compound : 4×8-12, restSec=90. Specs isolation : 3×10-15
- `autoProgress: true`, `progressStepKg: 2.5` (FULL contient barbell/dumbbell)

**Coach :** 2j fullbody — volume total suffisant ? Récupération idéale avec 2 seules sessions ?

---

### P02 — Beginner hypertrophy 3j
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner' }
```
**Assertions techniques :**
- isMass=true, beginner → Split = `['fullbody-quad','fullbody-hip','fullbody-quad']`
- **CRITIQUE** : beginner + isMass → fullbody×3, JAMAIS PPL
- Noms : "Full Body" × 3 avec suffixes A/B/C
- Séance A (fullbody-quad) et C (fullbody-quad) : mêmes slots — variété d'exercices uniquement (pas structurelle)
- Séance B (fullbody-hip) : différente (ham/glutes cmp en premier, pas quads)

**Coach :** fullbody×3 débutant — est-ce que 3 séances corps entier sont préférables à PPL pour quelqu'un sans expérience ?

---

### P03 — Beginner strength 3j → fullbody×3 (pas PPL)
```
{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:BB+DB, level:'beginner' }
```
**Assertions CRITIQUES :**
- isMass=true (strength), beginner → Split = `['fullbody-quad','fullbody-hip','fullbody-quad']`
- **JAMAIS PPL** — beginner force reste fullbody
- adjustedSlotCount(9, 60, 'strength') = max(4, floor(9×0.5)) = **4 slots** (force : repos 3min contraignants)
- Total par session : 4 + 1 warmup + 1 core = **6 exercices**
- Specs compound strength : 5×3-5, restSec=180
- adjustedSpec(compound_strength, 60min) → inchangé (60min = pas de réduction)

**Coach :** force beginner fullbody 3j — 4 composés en 60min force (tempo + repos 3min) est-il réaliste ? Le barbell squat, bench et deadlift sont-ils tous présents dans les 4 slots ?

---

### P04 — Beginner fat_loss 3j → fullbody×3 (même que strength)
```
{ goal:'fat_loss', daysPerWeek:3, sessionDuration:60, equipment:HOME, level:'beginner' }
```
**Assertions CRITIQUES :**
- isMass=false (fat_loss), beginner → Split = `['fullbody-quad','fullbody-hip','fullbody-quad']`
- Même split que P03 malgré un objectif différent — la branche beginner ignore isMass
- adjustedSlotCount(9, 60, 'fat_loss') = **9 slots** (pas de réduction sur fat_loss 60min)
- HOME = ['dumbbell','kettlebell','band','bodyweight'] — pas de barbell, pas de pullup_bar
- Specs compound fat_loss : 3×12-15, restSec=60

**Coach :** fat_loss HOME sans machines cardio — le programme peut-il atteindre l'objectif ? KB swing en circuit fat_loss style serait-il présent ?

---

### P05 — Beginner endurance 3j → fullbody×3 (invariant beginner)
```
{ goal:'endurance', daysPerWeek:3, sessionDuration:60, equipment:BW+BAR, level:'beginner' }
```
**Assertions CRITIQUES :**
- isMass=false, beginner → Split = `['fullbody-quad','fullbody-hip','fullbody-quad']`
- **INVARIANT** : tout débutant (quel que soit l'objectif) → fullbody×3 à 3j
- BW+BAR = ['bodyweight','pullup_bar']
- Slot back_width : `seed-pullup` (pullup_bar) ✓
- Slot biceps : `bw-chinup` (pullup_bar) ✓
- Specs endurance : 3×15-20, restSec=60
- `autoProgress: false`, `progressStepKg: 0`

**Coach :** endurance calisthenics débutant — reps 15+ sur tractions débutant, est-ce réaliste ? Progressivité sans poids externe ?

---

### P06 — Intermediate hypertrophy 3j → PPL
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'intermediate' }
```
**Assertions CRITIQUES :**
- isMass=true, !beginner → Split = `['push','pull','legs']` (PPL classique)
- Noms : "Push — Poussée" / "Pull — Tirage" / "Legs — Jambes"
- Push base=6 : adjustedSlotCount(6, 60, 'hypertrophy') = **6 slots**
- Pull base=6 : **6 slots**
- Legs base=6 : **6 slots**
- Specs compound hypertrophy : 4×8-12, restSec=90

**Coach :** PPL 3j intermediate — chaque groupe musculaire n'est touché qu'une fois par semaine. Fréquence suffisante pour l'hypertrophie ? Récupération entre les sessions ?

---

### P07 — Intermediate strength 3j → PPL (isMass=true)
```
{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:BB+DB, level:'intermediate' }
```
**Assertions CRITIQUES :**
- isMass=true (strength), !beginner → Split = `['push','pull','legs']`
- **CRITIQUE** : strength est isMass=true → PPL, pas PPF (contrairement à fat_loss/endurance)
- adjustedSlotCount(6, 60, 'strength') = max(4, floor(6×0.5)) = **4 slots** par session
- Specs compound strength : 5×3-5, restSec=180
- Barbell prioritaire sur dumbbell pour tous les composés (scoreEquip strength)

**Coach :** PPL force 3j intermediate — les compound barbell (bench, deadlift, squat) sont-ils bien retenus ? Le volume par groupe est-il suffisant avec seulement 4 slots ?

---

### P08 — Intermediate fat_loss 3j → PPF (push/pull/fullbody)
```
{ goal:'fat_loss', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'intermediate' }
```
**Assertions CRITIQUES :**
- isMass=false (fat_loss), !beginner → Split = `['push','pull','fullbody-quad']` **(PPF)**
- **JAMAIS PPL** pour fat_loss/endurance intermediate
- Noms : "Push — Poussée" / "Pull — Tirage" / "Full Body"
- fullbody-quad : 9 slots

**Coach :** PPF fat_loss — la séance fullbody donne-t-elle un stimulus complet pour les jours de "récup active" ? Volume cardio/force équilibre ?

---

### P09 — Intermediate endurance 3j → PPF
```
{ goal:'endurance', daysPerWeek:3, sessionDuration:60, equipment:BW+BAR, level:'intermediate' }
```
**Assertions CRITIQUES :**
- isMass=false, !beginner → Split = `['push','pull','fullbody-quad']` (PPF)
- Même split que P08 malgré objectifs différents (fat_loss et endurance : même branche !isMass+!beginner+3j)
- BW+BAR : Pull day slot back_width → seed-pullup ✓, back_thickness → bw-inverted-row ✓
- Specs endurance : 3×15-20 (compound), 3×15-20 (isolation)
- `autoProgress: false`

**Coach :** endurance BW+BAR — le Pull day est-il viable ? L'endurance sans cardio machine (pas dans le preset outdoor) est-elle réelle ?

---

### P10 — Intermediate hypertrophy 4j → Upper/Lower
```
{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'intermediate' }
```
**Assertions techniques :**
- isMass=true → Split = `['upper-push','lower-quad','upper-pull','lower-hip']`
- Noms : "Upper — Haut du corps A" / "Lower — Bas du corps A" / "Upper — Haut du corps B" / "Lower — Bas du corps B"
- upper-push base=8 → 8 slots · lower-quad base=6 → 6 slots
- upper-pull base=8 → 8 slots · lower-hip base=6 → 6 slots
- Total semaine : 2 sessions upper + 2 sessions lower → chaque groupe musculaire touché 2× par semaine

**Coach :** Upper/Lower 4j intermédiaire hypertrophie — la fréquence 2× par groupe est optimale. Récupération entre upper A et B (72h si lundi/jeudi) ?

---

### P11 — Intermediate fat_loss 4j
```
{ goal:'fat_loss', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'intermediate' }
```
**Assertions CRITIQUES :**
- isMass=false, !beginner → Split = `['push','pull','lower-quad','fullbody-quad']`
- **JAMAIS upper/lower** pour fat_loss+4j+intermediate (upper/lower est réservé à isMass)
- Noms : "Push — Poussée" / "Pull — Tirage" / "Lower — Bas du corps" (lower-quad) / "Full Body"
- Vérifier que lower-quad type retourne `'lower'` public (pas `'lower-quad'`)

**Coach :** fat_loss 4j intermediate — push/pull/lower/fullbody : le volume haut du corps est-il équilibré sur la semaine (2× push, 2× pull via pull+fullbody) ?

---

### P12 — Intermediate endurance 4j
```
{ goal:'endurance', daysPerWeek:4, sessionDuration:45, equipment:HOME, level:'intermediate' }
```
**Assertions CRITIQUES :**
- isMass=false, !beginner → Split = `['push','pull','lower-quad','fullbody-quad']` (identique à P11)
- adjustedSlotCount(6, 45, 'endurance') = max(3, floor(6×0.75)) = max(3, 4) = **4 slots** (push/pull/lower)
- adjustedSlotCount(9, 45, 'endurance') = max(3, floor(9×0.75)) = max(3, 6) = **6 slots** (fullbody)
- HOME sans pullup_bar : slot back_width compound (home gym) → chercher rowing DB/KB

**Coach :** endurance 45min HOME — 4 slots push en 45min à 15+ reps, timing cohérent ? Sans barre de traction, l'endurance dos est-elle couverte ?

---

### P13 — Intermediate hypertrophy 5j → PPL+UL
```
{ goal:'hypertrophy', daysPerWeek:5, sessionDuration:60, equipment:FULL, level:'intermediate' }
```
**Assertions techniques :**
- isMass=true, !beginner → Split = `['push','pull','legs','upper','lower']`
- Noms : "Push — Poussée" / "Pull — Tirage" / "Legs — Jambes" / "Upper — Haut du corps" / "Lower — Bas du corps"
- upper type interne = `'upper'` (pas upper-push ou upper-pull) — vérifier les slots SLOTS['upper']
- lower type interne = `'lower'` (pas lower-quad ou lower-hip) — vérifier les slots SLOTS['lower']

**Coach :** 5j PPL+UL — upper et lower "génériques" (pas A/B) en position 4 et 5 : est-ce qu'ils diffèrent structurellement des sessions push/pull/legs déjà faites ?

---

### P14 — Intermediate fat_loss 5j
```
{ goal:'fat_loss', daysPerWeek:5, sessionDuration:60, equipment:FULL, level:'intermediate' }
```
**Assertions CRITIQUES :**
- isMass=false, !beginner → Split = `['push','pull','lower-quad','lower-hip','fullbody-quad']`
- **CRITIQUE** : 5j fat_loss intermediate → pas de PPL+UL (isMass requis)
- Vérifier que lower-quad et lower-hip sont deux sessions distinctes (alternance quad-dominant/hip-dominant)
- fullbody-quad en fin de semaine comme séance polyvalente

**Coach :** fat_loss 5j intermediate — le volume est-il excessif pour un objectif fat_loss ? 5 sessions avec peu de repos entre les groupes musculaires ?

---

### P15 — Advanced hypertrophy 3j → PPL (comme intermediate)
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:90, equipment:FULL, level:'advanced' }
```
**Assertions CRITIQUES :**
- isMass=true, !beginner → Split = `['push','pull','legs']` (identique à intermediate 3j)
- **CRITIQUE** : advanced ne change pas le split auto à 3j — seul le niveau intermediate/advanced unifie la branche
- adjustedSlotCount(6, 90, 'hypertrophy') = min(6+2, 8) = **8 slots** (push et pull étendus)
- adjustedSlotCount(6, 90, 'hypertrophy') pour legs = min(6+2, 8) = **8 slots** — mais legs n'a que 6 slots → cap à 6 effectivement
- Specs compound advanced : 4×8-12 (inchangé par rapport au niveau — le niveau ne modifie que pickExercise)

**Coach :** PPL advanced 90min — est-ce que 8 slots push (6 exercices + warmup + core) en 90min d'hypertrophie est réaliste (~4min/série×3-4 séries = 96-128 min) ? Sous-estimation du temps ?

---

### P16 — Advanced strength 3j → PPL
```
{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'advanced' }
```
**Assertions CRITIQUES :**
- isMass=true, !beginner → Split = `['push','pull','legs']`
- adjustedSlotCount(6, 60, 'strength') = max(4, floor(6×0.5)) = **4 slots**
- level='advanced' → `pickExercise` utilise random top-3 (non déterministe) — lister les 3 candidats pour chest compound slot
- `autoProgress: true`, `progressStepKg: 2.5`

**Coach :** PPL force advanced 60min — 4 exercices force (3-5 reps, repos 3min) : ~4×5×3min = ~60min → timing juste. Les exercices avancés (barbell compound) couvrent-ils bien les 4 slots ?

---

### P17 — Advanced fat_loss 3j → PPF
```
{ goal:'fat_loss', daysPerWeek:3, sessionDuration:45, equipment:BB+DB, level:'advanced' }
```
**Assertions techniques :**
- isMass=false, !beginner → Split = `['push','pull','fullbody-quad']` (PPF)
- adjustedSlotCount(6, 45, 'fat_loss') = max(3, floor(6×0.75)) = max(3, 4) = **4 slots** (push/pull)
- adjustedSlotCount(9, 45, 'fat_loss') = max(3, floor(9×0.75)) = max(3, 6) = **6 slots** (fullbody-quad)
- adjustedSpec(compound_fat_loss, 45min) : factor=0.75 → sets=max(2, floor(3×0.75))=max(2,2)=**2 séries** × 12-15

**Coach :** fat_loss advanced 45min — 2 séries seulement sur les composés : suffisant pour un confirmé ? La durée justifie-t-elle la réduction de volume ?

---

### P18 — Advanced endurance 3j → PPF
```
{ goal:'endurance', daysPerWeek:3, sessionDuration:60, equipment:BW+BAR, level:'advanced' }
```
**Assertions techniques :**
- isMass=false, !beginner → Split = `['push','pull','fullbody-quad']` (PPF)
- Même split que P09 (intermediate endurance 3j BW+BAR) — advanced ne change pas le split
- `autoProgress: false`

**Coach :** endurance advanced calisthenics 3j — un confirmé peut-il vraiment progresser sans charge externe ? Weighted calisthenics non modélisé ?

---

### P19 — Advanced hypertrophy 4j → Upper/Lower
```
{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'advanced' }
```
**Assertions techniques :**
- isMass=true → Split = `['upper-push','lower-quad','upper-pull','lower-hip']` (identique à P10)
- level='advanced' → pickExercise random top-3 : lister les 3 candidats pour chest compound (upper-push slot 0)
- `autoProgress: true`

**Coach :** Upper/Lower advanced — fréquence 2× par groupe suffit-elle pour un confirmé ? Certains avancés préfèrent 3× par groupe en PPL+.

---

### P20 — Advanced strength 4j → Upper/Lower
```
{ goal:'strength', daysPerWeek:4, sessionDuration:60, equipment:BB+DB, level:'advanced' }
```
**Assertions CRITIQUES :**
- isMass=true → Split = `['upper-push','lower-quad','upper-pull','lower-hip']`
- adjustedSlotCount(8, 60, 'strength') = max(4, floor(8×0.5)) = **4 slots** pour upper-push et upper-pull
- adjustedSlotCount(6, 60, 'strength') = max(4, floor(6×0.5)) = **4 slots** pour lower-quad et lower-hip (floor(3)=3, max(4,3)=4)
- Barbell prioritaire : chest compound → bench barbell, not DB bench

**Coach :** Upper/Lower force advanced — 4 composés lourds par session force (barbell bench, row, OHP, puis lower squat, deadlift, etc.). Volume et intensité cohérents pour un confirmé ?

---

### P21 — Advanced fat_loss 4j
```
{ goal:'fat_loss', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'advanced' }
```
**Assertions techniques :**
- isMass=false, !beginner → Split = `['push','pull','lower-quad','fullbody-quad']` (identique à P11)
- **CRITIQUE** : même split pour intermediate et advanced en fat_loss 4j — le niveau ne bifurque pas ici

**Coach :** fat_loss 4j advanced — même structure que l'intermédiaire. Est-ce adapté à un confirmé qui a besoin de plus de volume/intensité ? Manque-t-il une variation pour advanced ?

---

### P22 — Advanced hypertrophy 5j → PPL+UL
```
{ goal:'hypertrophy', daysPerWeek:5, sessionDuration:60, equipment:FULL, level:'advanced' }
```
**Assertions techniques :**
- isMass=true, !beginner → Split = `['push','pull','legs','upper','lower']` (identique à P13)
- level='advanced' → random top-3 : citer top-3 candidats pour au moins 2 slots distincts (chest compound push, back_width compound pull)

**Coach :** 5j PPL+UL advanced — est-ce le split optimal pour un confirmé ? La fréquence par groupe varie selon le split (push 1-2×, chest par ex. en push + upper).

---

### P23 — Advanced strength 5j
```
{ goal:'strength', daysPerWeek:5, sessionDuration:90, equipment:FULL, level:'advanced' }
```
**Assertions CRITIQUES :**
- isMass=true, !beginner → Split = `['push','pull','legs','upper','lower']`
- adjustedSlotCount(6, 90, 'strength') = min(6, 5) = **5 slots** (force 90min capped à 5)
- adjustedSlotCount(6, 90, 'strength') pour legs = min(6, 5) = **5 slots**
- adjustedSlotCount(8, 90, 'strength') pour upper = min(8, 5) = **5 slots**
- adjustedSlotCount(6, 90, 'strength') pour lower = min(6, 5) = **5 slots**

**Coach :** force advanced 5j 90min — 5 slots force (3-5 reps, repos 3min) → ~5×5×3min = 75min + warmup + core ≈ 90min. Timing validé ? Récupération sur 5j consécutifs force ?

---

### P24 — Beginner hypertrophy 4j → fullbody×4
```
{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'beginner' }
```
**Assertions CRITIQUES :**
- isMass=true, beginner → Split = `['fullbody-quad','fullbody-hip','fullbody-quad','fullbody-hip']`
- **JAMAIS upper/lower pour beginner 4j** (upper/lower requiert isMass sans condition beginner)

Wait — re-lire `selectSplit` case 4 : `if (isMass) return ['upper-push','lower-quad','upper-pull','lower-hip']`
La condition est simplement `if (isMass)` sans vérifier le niveau.
**CORRECTION d'assertion** : beginner + isMass + 4j → `['upper-push','lower-quad','upper-pull','lower-hip']` (**pas fullbody×4**)

Vérifier cette assertion dans le code et indiquer la ligne exacte.

**Coach :** Upper/Lower pour un débutant 4j — est-ce approprié ou surcharge-t-on le contenu d'un débutant ?

---

### P25 — Beginner fat_loss 4j → fullbody×4
```
{ goal:'fat_loss', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'beginner' }
```
**Assertions CRITIQUES :**
- isMass=false, beginner → Split = `['fullbody-quad','fullbody-hip','fullbody-quad','fullbody-hip']`
- **CRITIQUE** : fat_loss beginner 4j → fullbody×4 (branche `else` : ni isMass, ni !beginner+!isMass)
- Comparer avec P24 (hypertrophy beginner 4j → upper/lower si isMass)
- Documenter la différence : isMass beginner → upper/lower · !isMass beginner → fullbody

**Coach :** fullbody×4 fat_loss débutant — 4 séances corps entier par semaine est-il trop intense pour un débutant ? Récupération suffisante ?

---

## GROUPE B — Chemin Auto + focusMuscles (étape Muscles active) — 12 profils

> **Contexte wizard :** quand l'utilisateur choisit `splitPreference = 'auto'` (étape 4), il accède ensuite à l'étape 5 Muscles.
> Les profils B01–B12 testent le chemin `auto + focusMuscles` — comment `workoutTypeFromFocus` influence le split final.

---

### P26 — Auto + chest → push (alternance push/upper-push)
```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:DB, level:'beginner',
  focusMuscles:['chest'] }
```
**Assertions CRITIQUES :**
- `workoutTypeFromFocus(['chest'])` : `hasPush=true (chest)`, `hasPull=false`, `hasLower=false` → `'push'`
- focusType = 'push'
- Split 2j push : `['push','upper-push']` (alternance, pas ['push','push'])
- Noms : "Push — Poussée" / "Upper — Haut du corps"
- Chest en tête via `reorderSlotsByFocus(['chest'])` dans les deux séances

**Coach :** chest focus en push+upper-push — les pectoraux sont-ils bien prioritaires dans les deux séances ? Le upper-push apporte-t-il suffisamment de dos pour l'équilibre push/pull ?

---

### P27 — Auto + back → pull (alternance pull/upper-pull)
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:BB+DB+CABLE, level:'beginner',
  focusMuscles:['back'] }
```
**Assertions CRITIQUES :**
- `workoutTypeFromFocus(['back'])` : `hasPull=true`, `hasPush=false`, `hasLower=false` → `'pull'`
- Split 3j pull : `['pull','upper-pull','pull']`
- Noms : "Pull — Tirage" A/B/C
- Dos en tête dans chaque séance via `reorderSlotsByFocus(['back'])`

**Coach :** dos focus pull×3 3j — les pectoraux et quadriceps sont totalement absents. Est-ce acceptable pour un programme court-terme de spécialisation dos ?

---

### P28 — Auto + legs → lower alternant quad/hip
```
{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:BW, level:'beginner',
  focusMuscles:['legs'] }
```
**Assertions CRITIQUES :**
- `workoutTypeFromFocus(['legs'])` : `hasLower=true`, `hasUpper=false` → `'lower'`
- Split 4j lower : `['lower-quad','lower-hip','lower-quad','lower-hip']`
- Noms : "Lower — Bas du corps" A/B/C/D
- BW pur : slot hamstrings compound → `bw-nordic-curl` est pullup_bar → **slot vide** en BW pur
- `autoProgress: false`, `progressStepKg: 0`

**Coach :** jambes focus 4j BW — sans barbell (squat barre, deadlift, leg press), les quads sont-ils correctement couverts ? Squats BW suffisants pour un débutant ?

---

### P29 — Auto + core seul → null → fullbody (régression BUG#3)
```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:BW, level:'beginner',
  focusMuscles:['core'] }
```
**Assertions CRITIQUES :**
- `workoutTypeFromFocus(['core'])` : `hasCore=true`, `hasLower=false`, `hasUpper=false` → **null**
- Split par défaut 2j → `['fullbody-quad','fullbody-hip']`
- **JAMAIS `['lower','lower']`** — core seul ne mappe jamais sur lower
- Core apparaît en queue via corePool (comportement normal)

---

### P30 — Auto + shoulders → push (hasPush via shoulders)
```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:DB, level:'beginner',
  focusMuscles:['shoulders'] }
```
**Assertions techniques :**
- `workoutTypeFromFocus(['shoulders'])` : `hasPush=true (shoulders ∈ push)` → `'push'`
- Split 2j : `['push','upper-push']`
- Épaules remontées en tête via `reorderSlotsByFocus(['shoulders'])`

**Coach :** épaules focus en push+upper-push — slot OHP présent dans les deux types ? Risque de surcharge épaule (push composé + isolation) sans dos antagoniste suffisant ?

---

### P31 — Auto + chest+back → upper (push+pull → upper)
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner',
  focusMuscles:['chest','back'] }
```
**Assertions CRITIQUES :**
- `workoutTypeFromFocus(['chest','back'])` : `hasPush=true (chest)`, `hasPull=true (back)`, `hasLower=false` → `'upper'`
- Split 3j upper, beginner : `['upper-push','upper-pull','upper-push']` (branche beginner)
- Noms : "Upper — Haut du corps" A/B/C
- chest ET back remontés en tête selon la session (upper-push : chest premier, upper-pull : back premier)

**Coach :** chest+back → upper×3 beginner — pas de jambes dans tout le programme. Est-ce acceptable pour une phase de spécialisation haut du corps ?

---

### P32 — Auto + legs+back → lower_pull (chaîne postérieure)
```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:BB+DB, level:'beginner',
  focusMuscles:['legs','back'] }
```
**Assertions CRITIQUES :**
- `workoutTypeFromFocus(['legs','back'])` : `hasLower=true (legs)`, `hasPull=true (back)`, `hasPush=false` → `'lower_pull'`
- Split : `['lower_pull','lower_pull']` (fixe, pas d'alternance)
- Noms : "Lower — Chaîne postérieure" A/B
- lower_pull base=9 → adjustedSlotCount(9, 60, 'hypertrophy') = **9 slots** — mais cap éventuel ?
  Vérifier : 9 slots + 1 warmup + 1 core = 11 exercices

**Coach :** lower_pull 2j — deadlift premier slot, puis tractions, puis rowing, puis squat. Le programme fessiers+dos sans pec/épaules/bras est-il complet pour 2j par semaine ?

---

### P33 — Auto + legs+shoulders → lower_push (pattern Wendler)
```
{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:BB+DB, level:'intermediate',
  focusMuscles:['legs','shoulders'] }
```
**Assertions CRITIQUES :**
- `workoutTypeFromFocus(['legs','shoulders'])` : `hasLower=true`, `hasPush=true (shoulders)`, `hasPull=false` → `'lower_push'`
- Split : `['lower_push','lower_push','lower_push']`
- Noms : "Lower — Squat & Press" A/B/C
- adjustedSlotCount(9, 60, 'strength') = max(4, floor(9×0.5)) = **4 slots** (force)
- Slot 0 : quads/glutes compound (squat barbell) · Slot 1 : chest compound (bench) · Slot 2 : OHP · Slot 3 : ham/glutes compound (RDL)

**Coach :** Squat + OHP pattern en force 3j — cohérent avec les méthodes Wendler/5×5 ? Les 4 slots couvrent-ils l'essentiel ?

---

### P34 — Auto + arms seul → upper (rule 5 : hasUpper+!hasLower)
```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:DB, level:'beginner',
  focusMuscles:['arms'] }
```
**Assertions CRITIQUES :**
- `workoutTypeFromFocus(['arms'])` : `hasArms=true → hasUpper=true`, `hasPush=false`, `hasPull=false`, `hasLower=false`
- Règle appliquée : `hasUpper && !hasLower` → `'upper'`
- Split 2j upper : `['push','pull']` (pas `['upper-push','upper-pull']` !)

Vérifier dans le code la branche exacte pour `focusType === 'upper'` case 2j.
```
case 2: return ['push', 'pull']
```
- Noms : "Push — Poussée" / "Pull — Tirage"

**Coach :** "bras" focus → upper push+pull : l'utilisateur cherchait des bras mais obtient push+pull complets. Les biceps (pull) ET triceps (push) sont couverts — est-ce pertinent ou déroutant ?

---

### P35 — Auto + legs+core → lower (core ne neutralise pas)
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:BW, level:'beginner',
  focusMuscles:['legs','core'] }
```
**Assertions CRITIQUES :**
- `workoutTypeFromFocus(['legs','core'])` : `hasLower=true (legs)`, `hasCore=true`, `hasUpper=false`
- Règle appliquée en premier : `hasLower && !hasUpper` → `'lower'`
- **JAMAIS null** — core seul → null, mais legs+core → lower (legs domine)
- Split 3j lower, beginner : `['lower-quad','lower-hip','lower-quad']`
- Core apparaît en queue via corePool

---

### P36 — Auto + chest+back+legs → null → fullbody (ambiguïté totale)
```
{ goal:'hypertrophy', daysPerWeek:2, sessionDuration:60, equipment:FULL, level:'beginner',
  focusMuscles:['chest','back','legs'] }
```
**Assertions CRITIQUES :**
- `workoutTypeFromFocus(['chest','back','legs'])` : `hasLower=true`, `hasPush=true (chest)`, `hasPull=true (back)`
- lower_push requiert !hasPull → échoue. lower_pull requiert !hasPush → échoue.
- **Ambiguïté totale → null**
- Split par défaut 2j → `['fullbody-quad','fullbody-hip']`

**Coach :** "chest+back+legs" → fullbody — le système dégénère correctement vers fullbody. L'utilisateur obtient un programme équilibré même si sa demande était contradictoire.

---

### P37 — Auto + back+legs → lower_pull × 3 (intermediate)
```
{ goal:'fat_loss', daysPerWeek:3, sessionDuration:45, equipment:FULL, level:'intermediate',
  focusMuscles:['back','legs'] }
```
**Assertions CRITIQUES :**
- `workoutTypeFromFocus(['back','legs'])` : `hasLower=true (legs)`, `hasPull=true (back)`, `hasPush=false` → `'lower_pull'`
- Split : `['lower_pull','lower_pull','lower_pull']`
- adjustedSlotCount(9, 45, 'fat_loss') = max(3, floor(9×0.75)) = max(3, 6) = **6 slots**
- Total : 6 + warmup + core = 8 exercices
- `level:'intermediate'` → random top-3 : citer top-3 pour slot 0 (hamstrings/glutes compound)

**Coach :** lower_pull fat_loss 45min 3j — uniquement dos+jambes sans haut du corps pousseur. Équilibre musculaire sur la semaine acceptable pour fat_loss ?

---

## GROUPE C — Splits explicites (étape Muscles sautée, stepIndex 4→6) — 14 profils

> **Contexte wizard :** l'utilisateur choisit un split explicite (pas 'auto') en étape 4. Le wizard saute directement à l'étape 6 (Jours). `focusMuscles` est réinitialisé à `[]`.
> Assertions sur le split généré selon `splitPreference`, les noms des sessions, les slots par session.
>
> **Lire `exercises-seed.json` en entier avant ces profils.**

---

### P38 — Fullbody explicit, beginner, 3j, hypertrophy
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner',
  splitPreference:'fullbody' }
```
**Assertions CRITIQUES :**
- `selectSplit` branche pref='fullbody', 3j → `['fullbody-quad','fullbody-hip','fullbody-quad']`
- Même split que A02 (auto beginner 3j hypertrophy) — l'utilisateur a choisi explicitement ce que l'auto aurait donné
- `focusMuscles=[]` → `reorderSlotsByFocus` = ordre canonique (aucun réordonnancement)
- Identifier pour fullbody-quad beginner FULL : exercice retenu pour chest compound (candidats[0]) et back compound

**Table des exercices (obligatoire — une table par type de séance) :**

Fullbody-quad (séances A et C) :
| # | Slot muscles | Cat | Exercice retenu (beginner=candidates[0]) | Séries×Reps |
|---|---|---|---|---|
| w | warmup | — | seed-? | 2×10 |
| 1 | quads/glutes | cmp | squat-barbell ? | 4×8-12 |
| 2 | chest/chest_upper | cmp | bench-press-bb ? | 4×8-12 |
| 3 | back_width/back_thickness/back | cmp | ? | 4×8-12 |
| 4 | shoulders/shoulders_front | cmp | ? | 4×8-12 |
| 5 | hamstrings | iso | ? | 3×10-15 |
| 6 | shoulders_rear | iso | ? | 3×10-15 |
| 7 | biceps | iso | ? | 3×10-15 |
| 8 | calves | iso | ? | 3×10-15 |
| c | core | — | plank ? | 3×15 |

Fullbody-hip (séance B) :
| # | Slot muscles | Cat | Exercice retenu | Séries×Reps |
|---|---|---|---|---|
| w | warmup | — | seed-? | 2×10 |
| 1 | hamstrings/glutes | cmp | rdl-barbell ? | 4×8-12 |
| 2 | chest/chest_upper | cmp | ? | 4×8-12 |
| … | … | … | … | … |
| c | core | — | ? | 3×15 |

**Coach :** fullbody beginner 3j — la séance quad-dominant vs hip-dominant offre-t-elle une vraie variété structurelle ? Les 9 composés+isolations en 60min sont-ils réalistes (9 slots × 4 séries × ~1.5min ≈ 54min de travail pur + 90s repos × ~36 séries ≈ 54min de repos → ~108min réels) ?

---

### P39 — Fullbody explicit, intermediate, 3j, strength, BB+DB
```
{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:BB+DB, level:'intermediate',
  splitPreference:'fullbody' }
```
**Assertions CRITIQUES :**
- pref='fullbody', 3j → `['fullbody-quad','fullbody-hip','fullbody-quad']`
- adjustedSlotCount(9, 60, 'strength') = max(4, floor(9×0.5)) = **4 slots**
- Slot 0 fullbody-quad : quads/glutes cmp → squat barbell (BB+DB, priorité barbell)
- Total : 4 + warmup + core = **6 exercices**
- Specs compound strength : 5×3-5, restSec=180
- level='intermediate' → random top-3, citer top-3 pour quads/glutes compound

**Coach :** fullbody force explicit — l'utilisateur a choisi fullbody malgré intermediate (le coach auto aurait donné PPL). Le fullbody 4 slots force est-il suffisant pour un intermédiaire voulant progresser en force ?

---

### P40 — Upper/Lower explicit, intermediate, 4j, hypertrophy, FULL
```
{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'intermediate',
  splitPreference:'upper-lower' }
```
**Assertions CRITIQUES :**
- pref='upper-lower', 4j → `['upper-push','lower-quad','upper-pull','lower-hip']`
- Identique à A10 (auto intermediate hypertrophy 4j) — le choix explicite upper-lower donne le même split que l'auto
- Documenter la différence fonctionnelle : en auto, focusMuscles pourrait influencer ; en explicit, non
- Identifier top-3 candidats pour slot 0 upper-push (chest compound, intermediate FULL)

**Coach :** Upper/Lower 4j — la fréquence 2× par groupe est optimale en hypertrophie. Le split explicite vs auto donne-t-il ici le même résultat ? L'utilisateur a-t-il eu raison de choisir explicitement ?

---

### P41 — Upper/Lower explicit, beginner, 4j, fat_loss, HOME
```
{ goal:'fat_loss', daysPerWeek:4, sessionDuration:60, equipment:HOME, level:'beginner',
  splitPreference:'upper-lower' }
```
**Assertions CRITIQUES :**
- pref='upper-lower', 4j → `['upper-push','lower-quad','upper-pull','lower-hip']`
- Comparer avec P25 (fat_loss beginner 4j AUTO → fullbody×4) — l'explicit upper-lower FORCE ce split même pour un débutant !
- HOME sans pullup_bar : upper-pull slot back_width → aucun candidate pullup_bar → chercher DB/KB row
- Vérifier slots vides éventuels en HOME pour upper-pull

**Coach :** upper-lower explicit pour un débutant fat_loss — l'auto aurait donné fullbody×4 (plus adapté). Est-ce que upper/lower est trop complexe pour un débutant ? Y a-t-il un guard dans le wizard pour déconseiller ce split ?

---

### P42 — PPL explicit, intermediate, 3j, hypertrophy, FULL (compatible wizard)
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'intermediate',
  splitPreference:'ppl' }
```
**Assertions CRITIQUES :**
- pref='ppl', 3j → `['push','pull','legs']`
- **Filter wizard** : PPL compatible ? days=3≥3 ✓, goal=hypertrophy (ni strength ni endurance) ✓
  → `incompatibleReason('ppl')` = null → bouton actif (pas grisé)
- Identique à A06 (auto intermediate hypertrophy 3j) — même split
- Identifier top-3 pour chest compound push (intermediate FULL)

**Coach :** PPL explicit 3j — cohérent. Le split auto aurait donné le même résultat. Avantage de choisir explicit : pas d'étape Muscles (plus rapide).

---

### P43 — PPL explicit, intermediate, 3j, fat_loss, FULL (non bloqué par wizard)
```
{ goal:'fat_loss', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'intermediate',
  splitPreference:'ppl' }
```
**Assertions CRITIQUES :**
- **Filter wizard** : PPL + fat_loss → `incompatibleReason('ppl')` = null (fat_loss NON bloqué — seuls strength et endurance le sont)
- Comparer avec A08 (auto fat_loss 3j → PPF push/pull/fullbody) — l'auto aurait donné PPF, mais l'explicit PPL donne PPL
- Est-ce que PPL est objectivement moins adapté à fat_loss que PPF ? Documenter la différence coach

**Coach :** PPL explicit fat_loss — le coach aurait recommandé PPF (fullbody en fin de semaine stimulus total pour fat_loss) mais l'utilisateur a choisi PPL. Impact sur la qualité du programme ?

---

### P44 — Arnold explicit, intermediate, 4j, hypertrophy, FULL (compatible)
```
{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:60, equipment:FULL, level:'intermediate',
  splitPreference:'arnold' }
```
**Assertions CRITIQUES :**
- **Filter wizard** : arnold, days=4≥3 ✓, level=intermediate (pas beginner) ✓, goal=hypertrophy ✓
  → `incompatibleReason('arnold')` = null → bouton actif
- pref='arnold', 4j → `['chest-back','shoulders-arms','legs','upper']`
- Noms : "Chest & Back — Pectoraux & Dos" / "Shoulders & Arms — Épaules & Bras" / "Legs — Jambes" / "Upper — Haut du corps"
- chest-back base=9 → 9 slots · shoulders-arms base=8 → 8 slots · legs base=6 → 6 slots · upper base=8 → 8 slots
- Identifier top-3 pour chest compound (chest-back, intermediate FULL)

**Coach :** Arnold Split 4j — les antagonistes pec/dos dans la même séance : avantage du pompage mutuel et récupération plus rapide. Mais le volume bras (shoulders-arms) est-il suffisant pour de l'hypertrophie bras ?

---

### P45 — Arnold explicit, advanced, 3j, fat_loss, BB+DB (compatible)
```
{ goal:'fat_loss', daysPerWeek:3, sessionDuration:45, equipment:BB+DB, level:'advanced',
  splitPreference:'arnold' }
```
**Assertions CRITIQUES :**
- **Filter wizard** : arnold + fat_loss → `incompatibleReason('arnold')` = null (fat_loss non bloqué) ✓
- pref='arnold', 3j → `['chest-back','shoulders-arms','legs']` (le classique)
- adjustedSlotCount(9, 45, 'fat_loss') = max(3, floor(9×0.75)) = max(3, 6) = **6 slots** (chest-back)
- adjustedSlotCount(8, 45, 'fat_loss') = max(3, floor(8×0.75)) = max(3, 6) = **6 slots** (shoulders-arms)
- adjustedSlotCount(6, 45, 'fat_loss') = max(3, floor(6×0.75)) = max(3, 4) = **4 slots** (legs)

**Coach :** Arnold 3j fat_loss — l'Arnold split classique pour maigrir est-il optimal ? Le volume bras (shoulders-arms) est-il justifié en fat_loss ?

---

### P46 — Brosplit explicit, intermediate, 5j, hypertrophy, FULL (compatible)
```
{ goal:'hypertrophy', daysPerWeek:5, sessionDuration:60, equipment:FULL, level:'intermediate',
  splitPreference:'brosplit' }
```
**Assertions CRITIQUES :**
- **Filter wizard** : brosplit, days=5≥5 ✓, level=intermediate (pas beginner) ✓, goal=hypertrophy ✓
  → `incompatibleReason('brosplit')` = null → bouton actif
- pref='brosplit', 5j → `['chest-tri','back-bi','legs','shoulders-arms','upper']`
- Noms : "Chest & Triceps" / "Back & Biceps" / "Legs" / "Shoulders & Arms" / "Upper"
- chest-tri base=7 → 7 slots · back-bi base=8 → 8 slots · legs base=6 → 6 slots
- Identifier top-3 pour chest compound (chest-tri, intermediate FULL)

**Coach :** Brosplit 5j intermediate hypertrophy — chaque groupe 1× par semaine. Fréquence suffisante pour l'hypertrophie selon la science (2× recommandé) ? Volume intra-session maximisé mais fréquence minimale.

---

### P47 — Brosplit explicit, advanced, 5j, fat_loss, BB+DB (compatible)
```
{ goal:'fat_loss', daysPerWeek:5, sessionDuration:60, equipment:BB+DB, level:'advanced',
  splitPreference:'brosplit' }
```
**Assertions CRITIQUES :**
- **Filter wizard** : brosplit + fat_loss → `incompatibleReason('brosplit')` = null (fat_loss non bloqué) ✓
- pref='brosplit', 5j → `['chest-tri','back-bi','legs','shoulders-arms','upper']`
- Specs fat_loss : 3×12-15, restSec=60
- advanced → random top-3 : citer top-3 pour chest compound

**Coach :** Brosplit fat_loss — fréquence basse + séries endurance (12-15 reps, repos 60s) : le circuit style est-il cohérent ? La fréquence 1× par groupe est-elle acceptable pour un objectif fat_loss (maintien de la masse maigre) ?

---

### P48 — Glutes-focus explicit, beginner, 3j, hypertrophy, FULL (NOUVEAU)
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:60, equipment:FULL, level:'beginner',
  splitPreference:'glutes-focus' }
```
**Assertions CRITIQUES :**
- pref='glutes-focus', 3j → `['glutes-hip','quad-glutes','glutes-hip']`
- Noms : "Glutes & Hip — Fessiers & Ischio" A / "Quad & Glutes — Jambes & Fessiers" B / "Glutes & Hip — Fessiers & Ischio" C
- glutes-hip base=8 → adjustedSlotCount(8, 60, 'hypertrophy') = **8 slots**
- quad-glutes base=8 → **8 slots**
- Total : 8 + warmup + core = **10 exercices** par session
- Aucun slot pectoraux, épaules (front/lat), ou triceps — programme "sans push" vérifié
- Slot back_width (glutes-hip pos 4) : `seed-pullup` disponible avec FULL
- Identifier pour glutes-hip beginner FULL : exercice retenu pour glutes/ham compound (pos 0)

**Table des exercices — glutes-hip (séances A et C) :**
| # | Slot muscles | Cat | Exercice retenu (beginner) | Séries×Reps |
|---|---|---|---|---|
| w | warmup | — | seed-? | 2×10 |
| 1 | glutes/ham | cmp | hip-thrust-bb ? | 4×8-12 |
| 2 | ham/glutes | cmp | rdl-barbell ? | 4×8-12 |
| 3 | quads/glutes | cmp | ? | 4×8-12 |
| 4 | back_width | cmp | seed-pullup ? | 4×8-12 |
| 5 | glutes | iso | ? | 3×10-15 |
| 6 | hamstrings | iso | ? | 3×10-15 |
| 7 | glutes | iso | ? | 3×10-15 |
| 8 | back (thickness) | iso | ? | 3×10-15 |
| c | core | — | ? | 3×15 |

**Table des exercices — quad-glutes (séance B) :**
| # | Slot muscles | Cat | Exercice retenu | Séries×Reps |
|---|---|---|---|---|
| w | warmup | — | ? | 2×10 |
| 1 | quads/glutes | cmp | squat-barbell ? | 4×8-12 |
| 2 | glutes/ham | cmp | hip-thrust-bb ? | 4×8-12 |
| 3 | back_thickness | cmp | row-barbell ? | 4×8-12 |
| 4 | quads | iso | ? | 3×10-15 |
| 5 | glutes | iso | ? | 3×10-15 |
| 6 | hamstrings | iso | ? | 3×10-15 |
| 7 | calves | iso | ? | 3×10-15 |
| 8 | back_width | iso | ? | 3×10-15 |
| c | core | — | ? | 3×15 |

**Coach :** programme glutes-focus — fessiers × 2-3 slots par séance, dos en soutien posture. Zéro push (pec/épaule/tris). Sur 3 séances/semaine, les fessiers sont touchés 6-8× — est-ce excessif ou optimal pour un programme spécialisé ? Le dos est-il suffisamment couvert (lat pulldown + rowing) ?

---

### P49 — Glutes-focus explicit, intermediate, 4j, fat_loss, HOME (NOUVEAU)
```
{ goal:'fat_loss', daysPerWeek:4, sessionDuration:60, equipment:HOME, level:'intermediate',
  splitPreference:'glutes-focus' }
```
**Assertions CRITIQUES :**
- pref='glutes-focus', 4j → `['glutes-hip','quad-glutes','glutes-hip','quad-glutes']`
- HOME = ['dumbbell','kettlebell','band','bodyweight'] — pas de pullup_bar
- glutes-hip slot back_width (pos 4) : pullup_bar absent → candidats DB/KB row pour back_width ? Vérifier dans le seed si des exercices DB/KB ont `primaryMuscle: 'back_width'`
- intermediate → random top-3 pour glutes/ham compound
- Specs fat_loss : 3×12-15, restSec=60

**Coach :** glutes-focus fat_loss HOME 4j — sans barre de traction (pullup_bar), le slot dos posture est-il rempli ? Un rowing KB ou DB peut-il remplacer le lat pulldown ? Pertinence fat_loss d'un programme spécialisé fessiers ?

---

### P50 — Glutes-focus explicit, advanced, 3j, strength, BB+DB (NOUVEAU)
```
{ goal:'strength', daysPerWeek:3, sessionDuration:60, equipment:BB+DB, level:'advanced',
  splitPreference:'glutes-focus' }
```
**Assertions CRITIQUES :**
- pref='glutes-focus', 3j → `['glutes-hip','quad-glutes','glutes-hip']`
- adjustedSlotCount(8, 60, 'strength') = max(4, floor(8×0.5)) = max(4, 4) = **4 slots**
- Total : 4 + warmup + core = **6 exercices** par session
- Specs compound strength : 5×3-5, restSec=180
- advanced → random top-3 pour glutes/ham compound (hip thrust barbell vs sumo DL ?)
- hip thrust barbell × 5×3-5 : adapté à la force ? Ou le hip thrust est-il davantage un exercice d'hypertrophie ?

**Coach :** glutes-focus strength — hip thrust et RDL en 5×3-5 est-il cohérent ? La force maximale sur fessiers/ischio est-elle un objectif sportif valide (powerlifting femmes, sport) ?

---

### P51 — Glutes-focus explicit, beginner, 2j, fat_loss, FULL (NOUVEAU — minimum jours)
```
{ goal:'fat_loss', daysPerWeek:2, sessionDuration:60, equipment:FULL, level:'beginner',
  splitPreference:'glutes-focus' }
```
**Assertions CRITIQUES :**
- pref='glutes-focus', 2j → `['glutes-hip','quad-glutes']`
- glutes-hip (A) + quad-glutes (B) — deux séances structurellement différentes
- Vérifier que les deux séances couvrent l'ensemble fessiers + ischio + quads + dos
- Slot back_width glutes-hip (FULL) : seed-pullup (pullup_bar) ✓
- Specs fat_loss : 3×12-15 · Total : 8 slots + warmup + core = 10 exercices

**Coach :** glutes-focus 2j — minimum viable pour un programme fessiers&dos ? Avec seulement 2 séances, chaque groupe est touché 1-2× par semaine. Suffisant pour progresser ?

---

## GROUPE D — Filtres d'incompatibilité wizard — 8 profils

> **Contexte :** Ces profils testent la fonction `incompatibleReason(splitPreference)` dans `ProgramGeneratorScreen.tsx`.
> Elle retourne `null` (bouton actif) ou une string d'avertissement (bouton grisé, opacity 0.45, non cliquable).
>
> **Lire `ProgramGeneratorScreen.tsx`** pour vérifier la logique exacte de `incompatibleReason` (fermeture sur `days`, `level`, `goal`).
>
> **Méthode :** pour chaque profil, indiquer :
> 1. La valeur de `incompatibleReason(split)` avec le contexte wizard donné
> 2. Le comportement attendu dans l'UI (grisé / actif)
> 3. Ce qui se passerait si le générateur était appelé malgré le filtre (analyse technique)

---

### P52 — Brosplit bloqué par fréquence insuffisante
```
Contexte wizard : { goal:'hypertrophy', level:'intermediate', days:4 }
Split testé : 'brosplit'
```
**Assertions :**
- `incompatibleReason('brosplit')` : days=4 < 5 → `"Nécessite 5 séances/sem. — tu en as 4"` : PASS/FAIL
- Bouton Bro Split grisé (opacity 0.45), cursor: not-allowed : PASS/FAIL
- Si ignoré et appelé quand même : `selectSplit({..., splitPreference:'brosplit', daysPerWeek:4})` → `['chest-tri','back-bi','shoulders-arms','legs']` (le générateur l'accepte malgré tout — le filtre est purement wizard)

**Coach :** brosplit 4j — le générateur génère un brosplit 4j valide. Le filtre wizard protège-t-il correctement l'utilisateur ?

---

### P53 — Brosplit bloqué par niveau débutant (5j)
```
Contexte wizard : { goal:'hypertrophy', level:'beginner', days:5 }
Split testé : 'brosplit'
```
**Assertions :**
- `incompatibleReason('brosplit')` : days=5 ≥ 5 ✓ (premier check passe), level='beginner' → `"Fréquence trop faible par muscle pour un débutant"` : PASS/FAIL
- L'ordre des vérifications est crucial : days check AVANT level check

**Coach :** brosplit interdit aux débutants — justification coach : 1× par groupe/semaine est insuffisant pour les débutants qui bénéficient d'une fréquence élevée pour apprendre le mouvement.

---

### P54 — Brosplit bloqué par objectif Force
```
Contexte wizard : { goal:'strength', level:'intermediate', days:5 }
Split testé : 'brosplit'
```
**Assertions :**
- `incompatibleReason('brosplit')` : days=5 ✓, level≠beginner ✓, goal='strength' → `"Force requiert 2-3 stimuli/sem. par muscle — Brosplit n'en donne qu'un"` : PASS/FAIL

**Coach :** brosplit force — scientifiquement, la force requiert une fréquence élevée (2-3× par semaine par groupe). Le filtre est justifié.

---

### P55 — Brosplit bloqué par objectif Endurance
```
Contexte wizard : { goal:'endurance', level:'intermediate', days:5 }
Split testé : 'brosplit'
```
**Assertions :**
- `incompatibleReason('brosplit')` : days=5 ✓, level≠beginner ✓, goal='endurance' → `"Endurance : fréquence élevée par muscle requise — Brosplit trop peu fréquent"` : PASS/FAIL

**Coach :** brosplit endurance — 1×/semaine par groupe est incompatible avec l'endurance musculaire qui nécessite une fréquence élevée. Filtre justifié.

---

### P56 — Arnold bloqué par fréquence insuffisante
```
Contexte wizard : { goal:'hypertrophy', level:'intermediate', days:2 }
Split testé : 'arnold'
```
**Assertions :**
- `incompatibleReason('arnold')` : days=2 < 3 → `"Nécessite 3 séances/sem. minimum — tu en as 2"` : PASS/FAIL
- Si ignoré : `selectSplit({splitPreference:'arnold', daysPerWeek:2})` → `['chest-back','legs']` (2j arnold valide techniquement)

**Coach :** Arnold 2j — chest+back le lundi, jambes le jeudi. Pas de séance épaules+bras. Est-ce vraiment un Arnold split ou un split custom ?

---

### P57 — Arnold bloqué par niveau débutant
```
Contexte wizard : { goal:'hypertrophy', level:'beginner', days:3 }
Split testé : 'arnold'
```
**Assertions :**
- `incompatibleReason('arnold')` : days=3 ≥ 3 ✓, level='beginner' → `"Volume et complexité élevés — déconseillé en débutant"` : PASS/FAIL

**Coach :** Arnold split débutant — chest-back requiert 4 composés lourds dans la même séance. Trop complexe pour un débutant qui ne maîtrise pas encore les mouvements de base.

---

### P58 — PPL bloqué par objectif Force
```
Contexte wizard : { goal:'strength', level:'intermediate', days:3 }
Split testé : 'ppl'
```
**Assertions :**
- `incompatibleReason('ppl')` : days=3 ≥ 3 ✓, goal='strength' → `"Split orienté hypertrophie — Force préfère Full Body ou Upper/Lower (2-3 stimuli/sem.)"` : PASS/FAIL
- Auto strength 3j intermediate → PPL (ironie : le filtre bloque PPL explicit, mais l'auto donne PPL !)

**⚠️ Incohérence à documenter :** le filtre wizard bloque PPL explicit pour strength, mais `selectSplit` auto donne PPL pour strength intermediate 3j (isMass=true, !beginner, 3j → PPL). Cette incohérence est-elle un bug wizard ou un choix délibéré ?

---

### P59 — PPL bloqué par objectif Endurance
```
Contexte wizard : { goal:'endurance', level:'intermediate', days:3 }
Split testé : 'ppl'
```
**Assertions :**
- `incompatibleReason('ppl')` : days=3 ≥ 3 ✓, goal='endurance' → `"Endurance : fréquence élevée par muscle requise — préfère Full Body ou Upper/Lower"` : PASS/FAIL
- Auto endurance 3j intermediate → PPF (push/pull/fullbody) : cohérent avec le filtre

**Coach :** PPL endurance bloqué — justifié. L'endurance nécessite que chaque groupe soit touché plusieurs fois par semaine. PPL (1×/groupe) est sous-optimal.

---

## GROUPE E — Durée × Structure — 6 profils

> **Contexte :** La durée est maintenant l'étape 3 du wizard (avant la structure étape 4).
> L'objectif influence `adjustedSlotCount` différemment selon la durée (force : barème réduit vs autres).
> Pour l'objectif force, le wizard affiche une note ℹ️ : "Force : les repos de 3 min entre séries limitent le volume.
> 20 min = 2 exercices · 45 min = 3 exercices · 60 min = 4 exercices · 90 min = 5 exercices."
> Vérifier que cette note est cohérente avec `adjustedSlotCount(base, duration, 'strength')`.

---

### P60 — 20min + strength + intermediate 3j → volume extrêmement réduit
```
{ goal:'strength', daysPerWeek:3, sessionDuration:20, equipment:FULL, level:'intermediate' }
```
**Assertions CRITIQUES :**
- Split auto : isMass+!beginner+3j → `['push','pull','legs']`
- push base=6 : adjustedSlotCount(6, 20, 'strength') = max(2, floor(6×0.5)) = max(2, 3) = **3 slots**
- pull base=6 : **3 slots**
- legs base=6 : **3 slots**
- Total par session : 3 + warmup + core = **5 exercices**
- adjustedSpec(compound_strength, 20min) : factor=0.5, sets=max(2, floor(5×0.5))=max(2,2)=**2 séries** × 3-5 reps
- Note wizard affichée : "20 min = 2 exercices" — COHÉRENT avec 3 slots ? (3 slots ≠ 2 exercices → incohérence à signaler)

**⚠️ VÉRIFICATION NOTE WIZARD :** "20 min = 2 exercices" fait référence aux slots (hors warmup/core). Pour base=6 push : 3 slots. La note est-elle inexacte ou fait-elle référence à une autre base ? Vérifier les bases concernées.

**Coach :** force 20min — 2 séries × 3-5 reps sur 3 exercices. En 20min avec repos 3min : 3 exercices × 2 séries × 3min = 18min → à peine réaliste. Le timing de la note ≈ juste.

---

### P61 — 20min + hypertrophy + beginner 3j → fullbody 4 slots
```
{ goal:'hypertrophy', daysPerWeek:3, sessionDuration:20, equipment:FULL, level:'beginner' }
```
**Assertions CRITIQUES :**
- Split : `['fullbody-quad','fullbody-hip','fullbody-quad']`
- fullbody-quad base=9 : adjustedSlotCount(9, 20, 'hypertrophy') = max(2, floor(9×0.5)) = max(2, 4) = **4 slots**
- Total : 4 + warmup + core = **6 exercices** par session
- adjustedSpec(compound_hypertrophy, 20min) : factor=0.5, sets=max(2, floor(4×0.5))=max(2,2)=**2 séries** × 8-12

**Coach :** fullbody 20min beginner — 4 composés × 2 séries × 90s repos ≈ 12-16min. Réaliste. Mais 2 séries par exercice est-il suffisant pour déclencher des adaptations chez un débutant ?

---

### P62 — 45min + strength + intermediate 3j → barème réduit
```
{ goal:'strength', daysPerWeek:3, sessionDuration:45, equipment:BB+DB, level:'intermediate' }
```
**Assertions CRITIQUES :**
- Split : `['push','pull','legs']`
- push base=6 : adjustedSlotCount(6, 45, 'strength') = max(2, floor(6×0.5)) = max(2, 3) = **3 slots**
- adjustedSpec(compound_strength, 45min) : factor=0.75, sets=max(2, floor(5×0.75))=max(2,3)=**3 séries** × 3-5 reps
- Note wizard affichée : "45 min = 3 exercices" ← VÉRIFIER cohérence avec base=6 push → 3 slots ✓

**Coach :** force 45min — 3 exercices × 3 séries × 3min = 27min de repos + travail → largement réalisable en 45min. La note wizard est juste pour push/pull/legs (base=6).

---

### P63 — 90min + hypertrophy + intermediate 4j → cap 8 slots
```
{ goal:'hypertrophy', daysPerWeek:4, sessionDuration:90, equipment:FULL, level:'intermediate' }
```
**Assertions CRITIQUES :**
- Split : `['upper-push','lower-quad','upper-pull','lower-hip']`
- upper-push base=8 : adjustedSlotCount(8, 90, 'hypertrophy') = min(8+2, 8) = **8 slots** (cap à 8)
- lower-quad base=6 : adjustedSlotCount(6, 90, 'hypertrophy') = min(6+2, 8) = **8 slots** (8 > 6 → séance prend les 6 slots disponibles → effective = 6)
- Vérifier dans le code : si adjusted > base de SLOTS[type], slice(0, adjusted) retourne tous les slots
- Total upper-push : 8 + warmup + core = 10 exercices
- Total lower-quad : 6 + warmup + core = 8 exercices

**Coach :** 90min upper — 8 exercices × 4 séries × 90s repos ≈ 96min de travail+repos. 90min est insuffisant → soit le timing est mal évalué, soit il faut réduire les repos.

---

### P64 — 20min + glutes-focus explicit + beginner + fat_loss
```
{ goal:'fat_loss', daysPerWeek:3, sessionDuration:20, equipment:FULL, level:'beginner',
  splitPreference:'glutes-focus' }
```
**Assertions CRITIQUES :**
- Split : `['glutes-hip','quad-glutes','glutes-hip']`
- glutes-hip base=8 : adjustedSlotCount(8, 20, 'fat_loss') = max(2, floor(8×0.5)) = max(2, 4) = **4 slots**
- quad-glutes base=8 : **4 slots**
- Total : 4 + warmup + core = **6 exercices** par session
- adjustedSpec(compound_fat_loss, 20min) : factor=0.5, sets=max(2, floor(3×0.5))=max(2,1)=**2 séries** × 12-15

**Coach :** glutes-focus 20min fat_loss — hip thrust et RDL en 2 séries 12-15 reps en 20min. Suffisant pour des fessiers ? Pertinence fat_loss d'un programme si court ?

---

### P65 — 45min + auto + fullbody explicit + fat_loss + beginner — comparaison durées
```
{ goal:'fat_loss', daysPerWeek:2, sessionDuration:45, equipment:HOME, level:'beginner',
  splitPreference:'fullbody' }
```
**Assertions CRITIQUES :**
- pref='fullbody', 2j → `['fullbody-quad','fullbody-hip']`
- fullbody-quad base=9 : adjustedSlotCount(9, 45, 'fat_loss') = max(3, floor(9×0.75)) = max(3, 6) = **6 slots**
- Total : 6 + warmup + core = **8 exercices**
- HOME : pas de barbell, pas de pullup_bar — identifier candidats DB/KB pour chest compound et back compound
- adjustedSpec(compound_fat_loss, 45min) : factor=0.75, sets=max(2, floor(3×0.75))=max(2,2)=**2 séries** × 12-15

**Coach :** fullbody fat_loss 45min HOME 2j — 2 séances par semaine suffisantes pour fat_loss ? 2 séries par composé est-il le minimum viable ?

---

## GROUPE F — phaseLabel v4 (nouveau format `→` + labels français) — 5 profils

> **Contexte :** Le wizard a été mis à jour pour utiliser une fonction `phaseLabel` avec un séparateur `→` et des labels en français simple.
>
> **Nouveau format v4 :**
> ```typescript
> const plain: Record<string, string> = {
>   adaptation:      'rodage',
>   progression:     'progression',
>   intensification: 'pic d\'effort',
>   deload:          'récup.',
> }
> // Jointure : ' → ' (espace-flèche-espace, pas ' · ')
> ```
>
> **Lire `ProgramGeneratorScreen.tsx`** (fonction `phaseLabel`) et `programGenerator.ts` (fonction `buildPhases`) avant ces profils.
>
> **buildPhases(totalWeeks, goal?)** retourne undefined si totalWeeks < 8.
> Calcul des durées :
> - adapt = 2 (fixe pour tous ≥ 8 sem.)
> - deload = 1 si totalWeeks < 12, 2 si totalWeeks ≥ 12
> - intensive = 2 si totalWeeks ≤ 9, 3 si 10 ≤ totalWeeks ≤ 15, 4 si totalWeeks ≥ 16
> - progress = max(1, totalWeeks − adapt − intensive − deload)

---

### P66 — buildPhases(7) → undefined → phaseLabel vide
```
buildPhases(7)  →  phaseLabel(7)
```
**Assertions :**
- totalWeeks=7 < 8 → `buildPhases` retourne `undefined` : PASS/FAIL
- `phaseLabel(7)` → `''` (chaîne vide) : PASS/FAIL
- Dans le wizard, le sous-titre de la carte programme n'affiche rien pour 7 sem. : PASS/FAIL

---

### P67 — buildPhases(8) → 4 phases → phaseLabel avec nouveau séparateur
```
buildPhases(8)  →  phaseLabel(8)
```
**Calcul attendu :**
- adapt=2, deload=1 (8<12), intensive=2 (8≤9), progress=max(1, 8−2−2−1)=**3**
- Total: 2+3+2+1=**8** ✓
- Semaines : [1-2 rodage, 3-5 progression, 6-7 pic d'effort, 8 récup.]

**Assertions :**
- 4 phases, somme=8 : PASS/FAIL
- adaptation.weekStart=1, weekEnd=2 : PASS/FAIL
- progression.weekStart=3, weekEnd=5 : PASS/FAIL
- intensification.weekStart=6, weekEnd=7 : PASS/FAIL
- deload.weekStart=8, weekEnd=8 : PASS/FAIL
- `phaseLabel(8)` = `"2 sem. rodage → 3 sem. progression → 2 sem. pic d'effort → 1 sem. récup."` : PASS/FAIL
- **CRITIQUE** : séparateur est `' → '` (pas `' · '` de la v3) : PASS/FAIL
- **CRITIQUE** : `'adaptation'` → `'rodage'` (pas `'adaptation'`) : PASS/FAIL
- **CRITIQUE** : `'intensification'` → `"pic d'effort"` (pas `'intensification'`) : PASS/FAIL
- **CRITIQUE** : `'deload'` → `'récup.'` (pas `'décharge'`) : PASS/FAIL

---

### P68 — buildPhases(10) → intensive=3
```
buildPhases(10)  →  phaseLabel(10)
```
**Calcul attendu :**
- adapt=2, deload=1 (10<12), intensive=3 (10>9 et 10<16), progress=max(1, 10−2−3−1)=**4**
- Total: 2+4+3+1=**10** ✓

**Assertions :**
- intensive=3 (seuil >9 sem.) : PASS/FAIL
- progression.weekEnd=6 (sem. 3 à 6 = 4 sem.) : PASS/FAIL
- `phaseLabel(10)` = `"2 sem. rodage → 4 sem. progression → 3 sem. pic d'effort → 1 sem. récup."` : PASS/FAIL

---

### P69 — buildPhases(12) → deload=2
```
buildPhases(12)  →  phaseLabel(12)
```
**Calcul attendu :**
- adapt=2, deload=2 (12≥12), intensive=3 (10≤12<16), progress=max(1, 12−2−3−2)=**5**
- Total: 2+5+3+2=**12** ✓

**Assertions :**
- deload=2 (premier seuil ≥12 sem.) : PASS/FAIL
- progression : 5 semaines, weekStart=3, weekEnd=7 : PASS/FAIL
- deload.weekStart=11, weekEnd=12 : PASS/FAIL
- `phaseLabel(12)` = `"2 sem. rodage → 5 sem. progression → 3 sem. pic d'effort → 2 sem. récup."` : PASS/FAIL

---

### P70 — buildPhases(16) → intensive=4 + deload=2
```
buildPhases(16)  →  phaseLabel(16)
```
**Calcul attendu :**
- adapt=2, deload=2 (16≥12), intensive=4 (16≥16), progress=max(1, 16−2−4−2)=**8**
- Total: 2+8+4+2=**16** ✓

**Assertions :**
- intensive=4 (seuil ≥16 sem.) : PASS/FAIL
- progression : 8 semaines, weekStart=3, weekEnd=10 : PASS/FAIL
- intensification.weekStart=11, weekEnd=14 : PASS/FAIL
- deload.weekStart=15, weekEnd=16 : PASS/FAIL
- `phaseLabel(16)` = `"2 sem. rodage → 8 sem. progression → 4 sem. pic d'effort → 2 sem. récup."` : PASS/FAIL

---

## Récapitulatif des assertions critiques (régressions à ne jamais casser)

| Code | Assertion | Profils |
|------|-----------|---------|
| BEG | Tout débutant 3j = fullbody×3 (quel que soit l'objectif) | P02, P03, P04, P05 |
| IMASS | isMass = strength OU hypertrophy (pas fat_loss ni endurance) | P07, P08 |
| PPF | fat_loss/endurance + !beginner + 3j → PPF (push/pull/fullbody) | P08, P09 |
| 2J | 2j = fullbody toujours (aucune exception niveau/objectif) | P01 |
| 4J-IMASS | isMass + 4j → upper/lower (tous niveaux, même beginner !) | P10, P24 |
| 4J-NOTMASS-BEG | !isMass + beginner + 4j → fullbody×4 | P25 |
| CORE | focusMuscles=['core'] → null → jamais 'lower' | P29 |
| LEGS+CORE | focusMuscles=['legs','core'] → 'lower' (legs domine) | P35 |
| AMBIGU | hasLower+hasPush+hasPull → null → split par défaut | P36 |
| PUSH-ALT | focusType='push' + 2j → ['push','upper-push'] (alternance, pas ['push','push']) | P26 |
| PULL-ALT | focusType='pull' + 2j → ['pull','upper-pull'] (alternance) | P27 |
| UPPER-BEG | focusType='upper' + 3j + beginner → ['upper-push','upper-pull','upper-push'] | P31 |
| GLUTES | glutes-focus : 2j→glutes-hip/quad-glutes ; 3j→glutes-hip/quad-glutes/glutes-hip | P48, P51 |
| GLUTES-SLOTS | glutes-hip/quad-glutes = zéro slot push (pec, OHP, triceps) | P48, P49, P50, P51 |
| WIZARD-D | incompatibleReason() bloque brosplit<5j, brosplit+beginner, brosplit+strength/endurance | P52–P55 |
| WIZARD-A | incompatibleReason() bloque arnold<3j, arnold+beginner, arnold+strength/endurance | P56, P57 |
| WIZARD-P | incompatibleReason() bloque ppl+strength, ppl+endurance | P58, P59 |
| PPL-IRONIE | auto strength 3j !beginner → PPL, mais ppl explicit strength → bloqué par wizard | P07, P58 |
| PHASE-SEP | phaseLabel v4 : séparateur `' → '` (pas `' · '`) | P67–P70 |
| PHASE-FR | phaseLabel v4 : labels FR : rodage/progression/pic d'effort/récup. | P67–P70 |
| SLOT-FORCE | adjustedSlotCount(base, 60, 'strength') = 4 (tous templates base≥8) | P03, P07, P39 |
| SLOT-FORCE20 | adjustedSlotCount(base, 20, 'strength') = max(2, floor(base×0.5)) | P60, P61 |

---

## Format de réponse attendu

> **RÈGLE ABSOLUE — à ne jamais omettre :**
> La table des exercices est **obligatoire pour chaque profil des groupes A, B, C, E** (sauf groupes D et F qui n'ont pas de sortie exercices).
> Sans cette table, le coach (15 ans d'expérience) ne peut pas évaluer l'équilibre musculaire,
> la cohérence des specs, ni la qualité réelle du programme généré.
> Il ne suffit pas d'écrire "3×15-20 sur tous les exercices" — il faut nommer chaque exercice.

Pour chaque profil, structure ta réponse en 3 blocs :

```
### P01 — Référence baseline : beginner hypertrophy 2j

**Simulation :**
- workoutTypeFromFocus([]) → null
- selectSplit → ['fullbody-quad','fullbody-hip']
- adjustedSlotCount(9, 60, 'hypertrophy') → 9

**Table des exercices — une table par type de séance du split :**

Fullbody-quad (séance A) :
| # | Slot (muscles cibles) | Cat | Top-3 candidats (pop desc) | Exercice retenu | Séries×Reps |
|---|---|---|---|---|---|
| w | warmup | — | seed-jumping-jacks(5), … | seed-jumping-jacks | 2×10 |
| 1 | quads/glutes | cmp | squat-bb(8), leg-press(6), goblet-squat(3) | squat-bb | 4×8-12 |
| … | … | … | … | … | … |
| c | core | — | plank(4), crunch(3), … | plank | 3×15 |

Fullbody-hip (séance B) :
| … | (variation structurelle — noter différences vs séance A) | … |

**Assertions : [PASS/FAIL]**
- Split ['fullbody-quad','fullbody-hip'] (2j) : PASS (ligne XX)
- 11 exercices (9 + warmup + core) : PASS
- …

**Coach :**
- Équilibre musculaire (groupes couverts / manquants) : …
- Cohérence objectif (specs séries×reps vs goal) : …
- Durée/contenu (timing réaliste ?) : …
- Équipement (aucun exercice hors contrainte ?) : …
- Variété structurelle A→B (variation suffisante ?) : ✅ Variété structurelle / ⚠️ Variété d'exercices seulement / ❌ Répétition complète
- Couverture isolation : ✅ Complète / ⚠️ Lacunes acceptables / ❌ Lacunes problématiques
- Verdict global : ✅ Bon programme / ⚠️ Problème mineur / ❌ Problème sérieux
```

Indique le numéro de ligne dans `programGenerator.ts` ou `ProgramGeneratorScreen.tsx` pour chaque assertion de code.

---

## Récapitulatif de l'audit complet (à produire à la fin)

> **RÈGLE ABSOLUE** : à la fin de l'audit (après P01–P70), produire **deux** blocs de synthèse, dans cet ordre :

### Bloc 1 — Tableau de synthèse

Un tableau avec **une ligne par profil** et **quatre colonnes** :

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|--------|----------------------|---------|-------------------|
| P01 | Split fullbody-quad/hip beginner 2j | ✅ PASS | — |
| P52 | incompatibleReason('brosplit') jours<5 | ✅ PASS | Filtre correct — le générateur l'accepterait quand même |
| … | … | … | … |

### Bloc 2 — Synthèse des problèmes ouverts

**Bugs / anomalies logicielles** (assertions FAIL) :
- Lister chaque FAIL avec : profil, assertion, impact concret, correction recommandée.

**Réserves coach cumulées** (⚠️ de tous les profils) :
- Regrouper les réserves par thème (volume, timing, fréquence, équilibre musculaire, incohérences wizard/générateur).
- Pour chaque thème : citer les profils concernés et formuler une recommandation d'amélioration.

**Incohérences wizard ↔ générateur à signaler :**
- PPL bloqué explicit force (P58) mais auto force intermediate 3j → PPL (P07) : documenter.
- Tout autre cas où le filtre wizard et la logique auto sont contradictoires.
