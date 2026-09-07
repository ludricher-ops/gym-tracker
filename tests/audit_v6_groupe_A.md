# Audit P01–P12 — Groupe A (v6)
**Date :** 2026-09-07  
**Fichiers lus :** `src/utils/programGenerator.ts` + `src/data/exercises-seed.json`  
**Fixes vérifiés :** BUG-BW-PULL (principal), BUG-HIP-BACK (slot fullbody-hip index 2), UX-NORDIC-BEGINNER, INC-1, BUG-A1, BUG-A2, BUG-A3, BUG-C2, BUG-C5, INC-4

---

## Formules de référence (extraites du code)

### adjustedSlotCount (code lignes 657–669)

| Duration | strength | autres goals |
|----------|----------|--------------|
| 20 min | min(3, max(2, floor(base×0.5))) | max(2, floor(base×0.5)) |
| 45 min | min(3, max(2, floor(base×0.5))) | max(4, floor(base×0.75)) |
| 60 min | max(4, floor(base×0.5)) | base (inchangé) |
| 90 min | min(base, 5) | min(base+2, 8) |

**Note v6 vs table audit_prompt :** Pour strength à 45 min, le code retourne `min(3, max(2, floor(base×0.5)))` (cap 3), alors que la table du prompt indique `max(3, floor(base×0.75))`. La table du prompt ne distinguait pas strength de non-strength à 45 min — **c'est le code qui fait foi.**

### adjustedSpec (code ligne 679–683)
- duration >= 45 → spec inchangé
- duration = 20 → sets = max(2, floor(sets×0.5))

### Tailles templates (SLOTS du code)
| Type | Slots définis | Notes |
|------|--------------|-------|
| push | 8 | slots 7-8 = bonus 90 min |
| pull | 8 | slots 7-8 = bonus 90 min |
| legs | 8 | slots 7-8 = bonus 90 min |
| fullbody-quad | 9 | |
| fullbody-hip | 9 | slot[2] = back_width+back_thickness+back (BUG-HIP-BACK fix) |
| lower-quad | 8 | slots 7-8 = bonus 90 min |
| lower-hip | 8 | slots 7-8 = bonus 90 min |
| upper | 8 | |
| upper-push | 8 | |
| upper-pull | 8 | |
| chest-tri | 8 | |
| back-bi | 8 | |
| shoulders-arms | 7 | |
| glutes-hip | 7 (8 dans le code ?) | (7 slots effectifs, le 8e absent) |
| quad-glutes | 8 | |

### Exercices compound de dos dans le seed (backMuscles = ['back_width','back_thickness','back'])

| Equipment | Exercice (id) | primaryMuscle | category |
|-----------|---------------|---------------|----------|
| barbell | seed-row-barbell | back_thickness | compound |
| barbell | seed-row-tbar | back_thickness | compound |
| barbell | seed-deadlift | back | compound |
| dumbbell | seed-row-dumbbell | back_thickness | compound |
| cable | seed-row-cable | back_thickness | compound |
| cable | seed-lat-pulldown | back_width | compound |
| machine | seed-row-machine | back_thickness | compound |
| pullup_bar | seed-pullup | back_width | compound |
| pullup_bar | bw-inverted-row | back_thickness | compound |
| kettlebell | kb-row | back_thickness | compound |
| kettlebell | kb-deadlift | back | compound |
| band | **band-row** | **back_thickness** | **compound** |
| bodyweight | **AUCUN** | — | — |

**AVERTISSEMENT IMPORTANT :** La description dans l'en-tête de l'audit_prompt_v6.md affirme que `band SEUL → AUCUN exercice de dos compound`. C'est **faux** : `band-row` (id: `band-row`) est présent dans le seed avec `primaryMuscle=back_thickness`, `category=compound`, `equipment=band`. Cette erreur de documentation impacte directement P02 et P11.

De même, l'en-tête cite "machine : lat pulldown machine" — cet exercice **n'existe pas** dans le seed actuel. Seul `seed-row-machine` (back_thickness, machine, compound, popularity=1) existe.

**Note sur bw-chinup :** `bw-chinup` a `primaryMuscle=biceps` (pas back_width). Il **ne contribue pas** à hasCompoundBack car biceps n'est pas dans backMuscles.

---

### P01 — [BUG-BW-PULL-FIXED] PPL en BW pur → doit être remplacé

**Paramètres :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight], level=intermediate, splitPreference=auto

**Simulation étape par étape :**

1. **selectSplit** : goal=hypertrophy + level=intermediate (not beginner) + 3j + auto → branche `if (goal === 'hypertrophy' && level !== 'beginner')` → `rawSplit = ['push', 'pull', 'legs']`

2. **available** : exercises filtrées par equipment=bodyweight, not deleted, not isWarmupExercise.
   - Exercices bodyweight compound dos candidats : seed-cat-cow (back, isolation, **isWarmupExercise=true** → exclu), seed-superman (back, isolation), seed-bird-dog (core, **isWarmupExercise=true** → exclu)
   - Aucun : `primaryMuscle ∈ {back_width, back_thickness, back}` ET `category=compound` ET non-warmup
   - **hasCompoundBack = false**

3. **hasPullInSplit** : `rawSplit.some(t => t === 'pull')` → true ('pull' en position 1)

4. **split final** : `(!hasCompoundBack && hasPullInSplit)` = true → `rawSplit.map(t => t === 'pull' ? 'fullbody-quad' : t)` = `['push', 'fullbody-quad', 'legs']`

5. **Warning** : `generatorWarnings.unshift('Séance "Pull" remplacée par "Full Body" : aucun exercice de tirage compound (dos)...')` → warning en tête de tableau

6. **Séance fullbody-quad (remplaçant)** :
   - SLOTS['fullbody-quad'], 9 slots base, 60 min, hypertrophy → adjustedSlotCount(9, 60, 'hypertrophy') = 9 (base inchangé)
   - Slot[2] = `{muscles:['back_width','back_thickness','back'], compound:true}` → candidats bodyweight compound back → AUCUN → **null → warning BUG-5** (attendu)
   - Autres slots (quads, chest, shoulders) : exercices BW disponibles (pompes, squats BW, OHP BW…) → OK

7. **Séances push et legs** : slots chest/shoulders/triceps et quads/hamstrings/glutes avec BW → exercices disponibles (pompes, dips, squat BW, etc.)

**Assertions : PASS/FAIL**

- rawSplit = ['push','pull','legs'] : **PASS** — hypertrophy+3j+intermediate → PPL
- hasCompoundBack = false (bodyweight seul) : **PASS** — aucun compound dos en BW
- Split final = ['push','fullbody-quad','legs'] : **PASS** — 'pull' remplacé
- generatorWarnings[0] contient "Séance Pull remplacée par Full Body" : **PASS** — texte exact : `'Séance "Pull" remplacée par "Full Body" : aucun exercice de tirage compound...'`
- Séance fullbody-quad : slot dos compound → null → warning BUG-5 (attendu) : **PASS**
- Programme non-vide (push et legs fonctionnels) : **PASS**

**Verdict : ✅ Bon programme**  
Le fix BUG-BW-PULL fonctionne correctement en BW pur. Le slot dos dans fullbody-quad reste vide (warning BUG-5 attendu — pas de compound dos disponible), mais push et legs sont pleinement fonctionnels.

---

### P02 — [BUG-BW-PULL-FIXED] PPL 5j en BW+band → vérification du seed

**Paramètres :** goal=hypertrophy, days=5, duration=60, equipment=[bodyweight, band], level=intermediate, splitPreference=auto

**Simulation étape par étape :**

1. **selectSplit** : isMass=true (hypertrophy) + 5j + intermediate → `rawSplit = ['push', 'pull', 'lower-quad', 'upper', 'lower-hip']`

2. **available** : exercises avec equipment ∈ {bodyweight, band}, not warmup.
   - `band-row` : primaryMuscle=**back_thickness**, category=**compound**, equipment=band, popularity=? → **présent dans le seed**
   - **hasCompoundBack = true** (band-row qualifie)

3. **hasPullInSplit** = true ('pull' en position 1)

4. **Condition** : `(!hasCompoundBack && hasPullInSplit)` = `(!true && true)` = false → **pas de remplacement**

5. **split final = rawSplit** = `['push', 'pull', 'lower-quad', 'upper', 'lower-hip']`

6. **Pas de warning** BUG-BW-PULL émis.

7. **Séance pull** : slot[0] = `{muscles:['back_width','back'], compound:true}` avec {bodyweight, band} → aucun exercice back_width compound en BW ou band → **null → warning BUG-5**
   - Slot[1] = `{muscles:['back_thickness','back'], compound:true}` → band-row (back_thickness, band, compound) → **PASS**

**Assertions (selon l'audit prompt) :**

- rawSplit = ['push','pull','lower-quad','upper','lower-hip'] : **PASS**
- hasCompoundBack selon le seed :
  - L'en-tête du prompt dit "band SEUL → AUCUN" → **FAUX selon le seed réel**
  - band-row.primaryMuscle = back_thickness, category = compound → **hasCompoundBack = true**
  - Conséquence : **pas de remplacement, pas de warning**
  - L'assertion "Documenter le résultat exact selon le seed" est donc : **hasCompoundBack = true, split inchangé**

**Verdict : ✅ Bon programme**  
⚠️ **Erreur de documentation dans l'audit_prompt** : l'en-tête affirme que "band SEUL → AUCUN exercice de dos compound" — c'est incorrect. `band-row` dans le seed est compound avec primaryMuscle=back_thickness. Le générateur est correct ; c'est la documentation du prompt v6 qui est erronée.  
**Réserve coach :** Le slot back_width compound reste vide dans la séance pull (tirage vertical non disponible en BW/band). Un warning BUG-5 est émis — le tirage vertical (lat pulldown) manque au programme.

---

### P03 — [BUG-BW-PULL-INTACT] PPL avec dumbbell → pull ne doit PAS être remplacé

**Paramètres :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight, dumbbell], level=intermediate, splitPreference=auto

**Simulation étape par étape :**

1. **selectSplit** → `['push', 'pull', 'legs']`

2. **available** : equipment ∈ {bodyweight, dumbbell}, not warmup.
   - `seed-row-dumbbell` : primaryMuscle=back_thickness, category=compound, equipment=dumbbell → **hasCompoundBack = true**

3. **hasPullInSplit** = true

4. **Condition** : `(!true && true)` = false → **pas de remplacement**

5. **Séance pull** :
   - Slot[0] `{muscles:['back_width','back'], compound:true}` + dumbbell : candidates compound back_width avec dumbbell ?
     - seed-pullover : back_width, dumbbell, **isolation** → exclu (compound strict)
     - Aucun compound back_width en dumbbell → **null → warning BUG-5**
   - Slot[1] `{muscles:['back_thickness','back'], compound:true}` → seed-row-dumbbell → **PASS**

**Assertions :**

- rawSplit = ['push','pull','legs'] : **PASS**
- hasCompoundBack = true (seed-row-dumbbell : back_thickness, compound) : **PASS**
- Split final = rawSplit (pas de remplacement) : **PASS**
- Séance pull, slot back_width compound → null → warning BUG-5 : **PASS** (attendu par le prompt)
- Séance pull, slot back_thickness compound → seed-row-dumbbell : **PASS**

**Verdict : ✅ Bon programme**  
Le fix ne s'applique pas correctement (hasCompoundBack = true). Réserve coach : pas de tirage vertical en haltères seuls (null slot back_width), warning BUG-5 attendu et émis.

---

### P04 — [BUG-BW-PULL-INTACT] PPL avec machine → pull ne doit PAS être remplacé

**Paramètres :** goal=hypertrophy, days=3, duration=60, equipment=[machine], level=intermediate, splitPreference=auto

**Simulation étape par étape :**

1. **selectSplit** → `['push', 'pull', 'legs']`

2. **available** : equipment=machine, not warmup.
   - `seed-row-machine` : primaryMuscle=back_thickness, category=compound, equipment=machine, popularity=1 → **hasCompoundBack = true**
   - Pas de machine lat pulldown (back_width) dans le seed — **seul back_thickness est disponible**

3. **hasPullInSplit** = true

4. **Condition** : false → **split inchangé**

5. **Séance pull** :
   - Slot[0] `{muscles:['back_width','back'], compound:true}` + machine : aucun exercice machine avec primaryMuscle=back_width compound → **null → warning BUG-5**
   - Slot[1] `{muscles:['back_thickness','back'], compound:true}` → seed-row-machine → **PASS**

**Assertions :**

- hasCompoundBack = true (seed-row-machine) : **PASS**
- Split inchangé ['push','pull','legs'] : **PASS**
- Séance pull complète : **⚠️ PARTIELLE** — slot back_width compound = null (pas de machine lat pulldown dans le seed). Contrairement à ce que l'en-tête du prompt affirme ("lat pulldown machine + seated row machine"), seul le seated row machine existe.

**Verdict : ⚠️ Problème mineur**  
Le générateur se comporte correctement (hasCompoundBack=true, pas de remplacement). Mais la documentation du prompt est inexacte : il n'y a pas de lat pulldown machine dans le seed — seul seed-row-machine (back_thickness) existe. Le slot back_width compound de la séance pull sera toujours vide en machine-only, avec un warning BUG-5 émis. L'assertion "Séance pull complète (lat pulldown + seated row disponibles)" est partiellement fausse — seulement seated row est disponible.

---

### P05 — [BUG-BW-PULL-PPF] Split PPF en BW pur → pull remplacé

**Paramètres :** goal=fat_loss, days=3, duration=60, equipment=[bodyweight], level=intermediate, splitPreference=auto

**Simulation étape par étape :**

1. **selectSplit** : fat_loss → isMass=false. 3j + level=intermediate → branche `if (!isMass && level !== 'beginner')` → `rawSplit = ['push', 'pull', 'fullbody-quad']`

2. **available** : bodyweight → hasCompoundBack = false

3. **hasPullInSplit** = true

4. **split final** : `['push', 'fullbody-quad', 'fullbody-quad']` ('pull' → 'fullbody-quad')

5. **Warning** : émis en tête

6. **Nommage** :
   - workoutType='push' : canon='push', count=1, totalOfType=1 → suffix='' → "Push — Poussée"
   - workoutType='fullbody-quad' (1er) : canon='fullbody', count=1, totalOfType=2 → suffix=' A' → "Full Body A"
   - workoutType='fullbody-quad' (2ème) : canon='fullbody', count=2, totalOfType=2 → suffix=' B' → "Full Body B"

**Assertions :**

- rawSplit = ['push','pull','fullbody-quad'] : **PASS**
- hasCompoundBack = false : **PASS**
- Split final = ['push','fullbody-quad','fullbody-quad'] : **PASS**
- Warning émis : **PASS**
- 2 séances fullbody-quad nommées "Full Body A" et "Full Body B" : **PASS**

**Verdict : ✅ Bon programme**  
Fix BUG-BW-PULL opérant sur un split PPF. Le nommage A/B fonctionne correctement. Réserve coach : deux séances fullbody-quad consécutives (slot dos toujours vide en BW) — programme BW fat_loss avec zéro tirage.

---

### P06 — [BUG-BW-PULL-PULLUP] PPL avec pullup_bar → pull ne doit PAS être remplacé

**Paramètres :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight, pullup_bar], level=intermediate, splitPreference=auto

**Simulation étape par étape :**

1. **selectSplit** → `['push', 'pull', 'legs']`

2. **available** : equipment ∈ {bodyweight, pullup_bar}, not warmup.
   - `seed-pullup` : primaryMuscle=back_width, category=compound, equipment=pullup_bar → **hasCompoundBack = true**
   - `bw-inverted-row` : primaryMuscle=back_thickness, category=compound, equipment=pullup_bar → aussi true
   - Note : `bw-chinup` a primaryMuscle=**biceps** → ne contribue PAS à hasCompoundBack

3. **hasPullInSplit** = true ; condition = false → **split inchangé**

4. **Séance pull** :
   - Slot[0] `{muscles:['back_width','back'], compound:true}` → seed-pullup (back_width, pullup_bar, compound) → **PASS**
   - Slot[1] `{muscles:['back_thickness','back'], compound:true}` → bw-inverted-row (back_thickness, pullup_bar, compound) → **PASS**
   - Au moins 2 exercices de dos → **PASS**

**Assertions :**

- hasCompoundBack = true : **PASS**
- Split inchangé ['push','pull','legs'] : **PASS**
- Séance pull fonctionnelle avec ≥ 2 exercices de dos : **PASS**

**Verdict : ✅ Bon programme**  
Le fix ne s'applique pas (hasCompoundBack=true grâce à seed-pullup). La séance pull est complète en BW+pullup_bar.

---

### P07 — [BUG-BW-PULL-CABLE] PPL avec câble → pull ne doit PAS être remplacé

**Paramètres :** goal=hypertrophy, days=3, duration=60, equipment=[cable], level=intermediate, splitPreference=auto

**Simulation étape par étape :**

1. **selectSplit** → `['push', 'pull', 'legs']`

2. **available** : equipment=cable, not warmup.
   - `seed-row-cable` : primaryMuscle=back_thickness, category=compound, equipment=cable → **hasCompoundBack = true**
   - `seed-lat-pulldown` : primaryMuscle=back_width, category=compound, equipment=cable → aussi true

3. **hasPullInSplit** = true ; condition = false → **split inchangé**

4. **Séance pull** :
   - Slot[0] → seed-lat-pulldown (back_width, cable, compound, popularity=3) → **PASS**
   - Slot[1] → seed-row-cable (back_thickness, cable, compound) → **PASS**
   - Séance pull complète avec câble

**Assertions :**

- hasCompoundBack = true (lat pulldown câble + seated cable row) : **PASS**
- Split inchangé : **PASS**
- Seed contient bien des exercices dos compound câble : **PASS** (seed-lat-pulldown + seed-row-cable)

**Verdict : ✅ Bon programme**  
Séance pull pleinement fonctionnelle en câble seul.

---

### P08 — [BUG-BW-PULL-KETTLEBELL] Split auto en KB-only → vérifier hasCompoundBack

**Paramètres :** goal=hypertrophy, days=3, duration=60, equipment=[kettlebell], level=intermediate, splitPreference=auto

**Simulation étape par étape :**

1. **selectSplit** : hypertrophy + 3j + intermediate → `rawSplit = ['push', 'pull', 'legs']`

2. **available** : equipment=kettlebell, not warmup.
   - `kb-row` : primaryMuscle=back_thickness, category=compound, equipment=kettlebell → **hasCompoundBack = true**
   - `kb-deadlift` : primaryMuscle=back, category=compound, equipment=kettlebell → aussi true
   - `kb-swing` : primaryMuscle=**glutes** → ne contribue PAS (glutes pas dans backMuscles)
   - `kb-rdl` : primaryMuscle=hamstrings → ne contribue PAS

3. **hasPullInSplit** = true ; condition = false → **split inchangé**

4. **Séance pull** :
   - Slot[0] `{muscles:['back_width','back'], compound:true}` + kettlebell : kb-deadlift (primaryMuscle=back) → **PASS** (back ∈ backMuscles)
   - Slot[1] `{muscles:['back_thickness','back'], compound:true}` → kb-row → **PASS**

**Assertions :**

- Le seed KB contient des exercices dos compound : **PASS** (kb-row back_thickness, kb-deadlift back)
- hasCompoundBack = true → split inchangé : **PASS**
- Note : kb-swing (glutes primary) et kb-rdl (hamstrings primary) ne qualifient pas pour hasCompoundBack

**État exact du seed KB** :
- kb-row : compound, back_thickness → qualifie
- kb-deadlift : compound, back → qualifie
- kb-swing : compound, glutes → ne qualifie pas
- kb-rdl : compound, hamstrings → ne qualifie pas

**Verdict : ✅ Bon programme**  
hasCompoundBack=true grâce à kb-row et kb-deadlift. Séance pull fonctionnelle en KB seul.

---

### P09 — [BUG-BW-PULL-PPL-PREF] PPL préférence explicite + BW pur → pull remplacé

**Paramètres :** goal=hypertrophy, days=3, duration=60, equipment=[bodyweight], level=intermediate, splitPreference=ppl

**Simulation étape par étape :**

1. **selectSplit** : pref='ppl', 3j → `rawSplit = ['push', 'pull', 'legs']`

2. **available** : bodyweight → hasCompoundBack = false (identique à P01)

3. **hasPullInSplit** = true

4. **split final** = `['push', 'fullbody-quad', 'legs']` (pull → fullbody-quad)

5. **Warning** : émis en tête malgré la préférence explicite ppl → **le fix est préférence-agnostique** (correct : il s'applique APRÈS selectSplit, quelle que soit la préférence)

**Assertions :**

- rawSplit (pref=ppl, 3j) = ['push','pull','legs'] : **PASS**
- hasCompoundBack = false : **PASS**
- Split final = ['push','fullbody-quad','legs'] : **PASS**
- Warning émis malgré la préférence explicite : **PASS**

**Verdict : ✅ Bon programme**  
Le fix BUG-BW-PULL s'applique correctement même avec splitPreference='ppl' explicite. La logique post-selectSplit est indépendante de la préférence.

---

### P10 — [BUG-BW-PULL-UPPER-LOWER] Split upper-lower en BW pur → aucun 'pull' dans le split

**Paramètres :** goal=hypertrophy, days=4, duration=60, equipment=[bodyweight], level=beginner, splitPreference=upper-lower

**Simulation étape par étape :**

1. **selectSplit** : pref='upper-lower', 4j → `rawSplit = ['upper-push', 'lower-quad', 'upper-pull', 'lower-hip']`

2. **hasPullInSplit** : `rawSplit.some(t => t === 'pull')` → 'upper-pull' !== 'pull' → **false**

3. **Condition BUG-BW-PULL** : hasPullInSplit = false → **non déclenchée**

4. **hasCompoundBack** : calculé mais sans effet puisque hasPullInSplit=false. Pour information : bodyweight seul → false.

5. **split final = rawSplit** (inchangé)

6. **Séance upper-pull** :
   - SLOTS['upper-pull'][0] = `{muscles:['back_width','back'], compound:true}` + bodyweight → aucun compound back_width en BW → **null → warning BUG-5**
   - Ce warning est attendu (pas un bug du fix BUG-BW-PULL)

**Assertions :**

- rawSplit = ['upper-push','lower-quad','upper-pull','lower-hip'] : **PASS**
- Aucun 'pull' dans le split → BUG-BW-PULL non déclenché : **PASS**
- hasCompoundBack = false (BW seul) : **PASS** (sans effet ici)
- Split inchangé (fix ne s'applique pas) : **PASS** — comportement correct
- Séance upper-pull slot back_width compound → null → warning BUG-5 : **PASS** (attendu)

**Verdict : ✅ Bon programme**  
Le fix BUG-BW-PULL distingue correctement 'pull' de 'upper-pull'. Le split upper-lower n'est pas affecté par le fix. Le warning BUG-5 sur upper-pull est attendu et documenté.

---

### P11 — [BUG-BW-PULL-GLUTES] Split glutes-focus en BW+band → pas de 'pull'

**Paramètres :** goal=fat_loss, days=4, duration=60, equipment=[bodyweight, band], level=intermediate, splitPreference=glutes-focus

**Simulation étape par étape :**

1. **selectSplit** : pref='glutes-focus', 4j → `rawSplit = ['glutes-hip', 'quad-glutes', 'glutes-hip', 'quad-glutes']`

2. **hasPullInSplit** : aucun des types n'est 'pull' → **false** → BUG-BW-PULL non déclenché

3. **split final = rawSplit** inchangé

4. **Programme glutes-hip et quad-glutes en BW+band** :
   - glutes-hip slot[0] : `{muscles:['glutes','hamstrings'], compound:true}` → exercices BW hip thrust ou squat BW → disponibles
   - glutes-hip slot[3] : `{muscles:['back_width','back'], compound:true}` → bodyweight+band compound back_width → aucun → **null → warning BUG-5**
   - quad-glutes slot[2] : `{muscles:['back_thickness','back'], compound:true}` → band-row (back_thickness, band, compound) → **PASS**

**Note sur band-row :** L'en-tête du prompt affirme que band SEUL n'a pas de compound dos. Or band-row existe. Ici, avec BW+band, le slot back_thickness de quad-glutes sera servi par band-row.

**Assertions :**

- rawSplit = ['glutes-hip','quad-glutes','glutes-hip','quad-glutes'] : **PASS**
- Aucun 'pull' → fix non déclenché : **PASS**
- Programme viable (glutes-hip et quad-glutes OK en BW+band) : **PASS** (avec réserve sur back_width)

**Verdict : ✅ Bon programme**  
Fix non déclenché à juste titre. Programme glutes-focus fonctionnel avec BW+band, sauf le slot back_width compound dans glutes-hip (null, warning BUG-5 attendu).

---

### P12 — [BUG-BW-PULL-BROSPLIT] Brosplit en BW+pullup_bar → back-bi contient du tirage

**Paramètres :** goal=hypertrophy, days=5, duration=60, equipment=[bodyweight, pullup_bar], level=intermediate, splitPreference=brosplit

**Simulation étape par étape :**

1. **selectSplit** : pref='brosplit', 5j → `rawSplit = ['chest-tri', 'back-bi', 'legs', 'shoulders-arms', 'upper']`

2. **hasPullInSplit** : `rawSplit.some(t => t === 'pull')` → aucun n'est 'pull' → **false** → BUG-BW-PULL non déclenché

3. **hasCompoundBack** : pullup_bar disponible → seed-pullup (back_width, compound) → **true**

4. **split final = rawSplit** inchangé

5. **Séance back-bi** :
   - SLOTS['back-bi'][0] = `{muscles:['back_width','back'], compound:true}` → seed-pullup (back_width, pullup_bar, compound) → **PASS**
   - SLOTS['back-bi'][1] = `{muscles:['back_thickness','back'], compound:true}` → bw-inverted-row (back_thickness, pullup_bar, compound) → **PASS**
   - Programme back fonctionnel en BW+pullup_bar

**Assertions :**

- rawSplit = ['chest-tri','back-bi','legs','shoulders-arms','upper'] : **PASS**
- 'back-bi' ≠ 'pull' → fix non déclenché : **PASS**
- hasCompoundBack = true (pullup_bar → seed-pullup compound back_width) : **PASS**
- Séance back-bi slot back_width compound → seed-pullup : **PASS**
- Programme back fonctionnel : **PASS**

**Verdict : ✅ Bon programme**  
Le brosplit fonctionne correctement avec BW+pullup_bar. Le fix BUG-BW-PULL ne s'applique pas (back-bi ≠ 'pull'). Séance dos et biceps complète.

---

## Tableau de synthèse P01–P12

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|--------|---------------------|---------|-------------------|
| P01 BW-PPL | rawSplit PPL ✓, hasCompoundBack=false ✓, pull→fullbody-quad ✓, warning ✓ | ✅ | Slot dos de fullbody-quad vide (BUG-5 attendu) — zéro tirage en BW |
| P02 BW+band PPL 5j | rawSplit 5j mass ✓, **hasCompoundBack=true** (band-row !) ✓, split inchangé ✓ | ✅ | Erreur de documentation du prompt (band n'est pas sans compound dos). Slot back_width vide (BUG-5) |
| P03 BW+DB PPL | hasCompoundBack=true (DB row) ✓, split inchangé ✓, slot back_width vide (BUG-5) ✓ | ✅ | Slot back_width toujours vide en haltères (pas de lat pulldown DB compound) |
| P04 Machine PPL | hasCompoundBack=true (row machine) ✓, split inchangé ✓, slot back_width null ✓ | ⚠️ | Pas de lat pulldown machine dans le seed (prompt erroné) — slot back_width vide systématiquement |
| P05 BW fat_loss PPF | rawSplit PPF ✓, pull→fullbody-quad ✓, warning ✓, noms "Full Body A/B" ✓ | ✅ | 2 séances fullbody-quad sans tirage — BW fat_loss dépourvu de dos |
| P06 BW+pullup PPL | hasCompoundBack=true (seed-pullup back_width) ✓, split inchangé ✓, 2 exos dos ✓ | ✅ | Aucune — séance pull complète |
| P07 Cable PPL | hasCompoundBack=true (lat-pulldown + row câble) ✓, split inchangé ✓ | ✅ | Aucune — séance pull complète |
| P08 KB-only PPL | hasCompoundBack=true (kb-row + kb-deadlift) ✓, split inchangé ✓ | ✅ | kb-swing (glutes) et kb-rdl (hamstrings) ne qualifient pas pour hasCompoundBack |
| P09 BW pref=ppl | pref ppl respectée ✓, pull→fullbody-quad ✓, warning malgré pref ✓ | ✅ | Fix appliqué après selectSplit, indépendant de la préférence — comportement correct |
| P10 BW beginner upper-lower | rawSplit upper-lower ✓, 'upper-pull'≠'pull' ✓, fix non déclenché ✓, BUG-5 attendu ✓ | ✅ | Slot back_width compound vide dans upper-pull (BUG-5 attendu et émis) |
| P11 BW+band glutes-focus | rawSplit glutes ✓, pas de 'pull' ✓, fix non déclenché ✓, programme viable ✓ | ✅ | Slot back_width de glutes-hip vide (BUG-5). band-row sert le slot back_thickness de quad-glutes |
| P12 BW+pullup brosplit | rawSplit brosplit 5j ✓, 'back-bi'≠'pull' ✓, hasCompoundBack=true ✓, back-bi fonctionnel ✓ | ✅ | Aucune — programme dos complet en BW+pullup_bar |

---

## Synthèse des problèmes ouverts

### Bugs / anomalies logicielles (assertions FAIL)

**Aucun FAIL détecté dans le code du générateur.**

Le fix BUG-BW-PULL est correctement implémenté :
- La détection `hasCompoundBack` vérifie bien `category==='compound' && backMuscles.includes(ex.primaryMuscle)` sur `available` (exercices filtrés par équipement)
- La condition `!hasCompoundBack && hasPullInSplit` est correcte
- Le remplacement `t === 'pull' ? 'fullbody-quad' : t` est exact (ne touche pas upper-pull, back-bi, chest-back, etc.)
- Le warning est inséré en tête (`unshift`) correctement

### Erreurs de documentation dans l'audit_prompt_v6.md

**ERREUR 1 — band-row (impact P02, P11) :**  
L'en-tête affirme : `"band SEUL → AUCUN exercice de dos compound"`  
Réalité dans le seed : `band-row` (id=band-row) a `primaryMuscle=back_thickness`, `category=compound`, `equipment=band`.  
Conséquence : pour equipment=[band] ou [bodyweight, band], hasCompoundBack = **true**, et aucun remplacement pull n'est effectué.

**ERREUR 2 — lat pulldown machine (impact P04, P17) :**  
L'en-tête affirme : `"machine : lat pulldown machine, seated row machine"`  
Réalité dans le seed : **pas de lat pulldown machine**. Seul `seed-row-machine` (back_thickness, machine, compound, popularity=1) existe.  
Conséquence : en machine-only, le slot back_width compound de la séance pull est **toujours vide** (warning BUG-5), y compris pour P04 et tout profil machine-only avec split pull.

**ERREUR 3 — bw-chinup (mention "chin-up" comme compound back) :**  
Le prompt cite "pullup_bar : pull-up, chin-up, inverted row" pour hasCompoundBack.  
Réalité : `bw-chinup` a `primaryMuscle=biceps` → **ne contribue pas** à hasCompoundBack (biceps ∉ backMuscles). Seuls seed-pullup (back_width) et bw-inverted-row (back_thickness) qualifient côté pullup_bar.

### Réserves coach cumulées (non-bloquants)

1. **Slot back_width compound vide en dumbbell-only, machine-only, KB-only, BW+band :** Le tirage vertical (lat pulldown) n'est disponible que via cable ou pullup_bar. Sans l'un ou l'autre, le slot back_width compound émet toujours BUG-5. Thème récurrent sur P03, P04, P08, P11.

2. **BW pur sans tirage :** En bodyweight seul (P01, P05, P09, P10), la séance pull est entièrement remplacée par fullbody-quad, mais le slot dos de fullbody-quad est aussi vide (BUG-5). L'utilisateur BW pur n'a structurellement aucun exercice de dos compound — réserve coach importante à documenter dans l'UX.

3. **bw-chinup non candidat pour hasCompoundBack :** Si jamais un utilisateur pullup_bar ne possède que la barre (sans BW), seuls seed-pullup et bw-inverted-row qualifient. Le bw-chinup, malgré son nom, cible les biceps en primary et ne protège pas le split pull.
