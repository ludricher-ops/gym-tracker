# Audit v4 — GROUPE D (P52 → P59)
## Filtres d'incompatibilité du wizard — `incompatibleReason(splitPreference)`

**Fichiers audités :**
- `src/components/screens/ProgramGeneratorScreen.tsx` (lu en entier — 1332 lignes)
- `src/utils/programGenerator.ts` (lu en entier — 1171 lignes)

**Rôle :** coach sportif certifié — simulation d'exécution + évaluation sportive.

---

## 0. Rappel du code sous test (référence de lignes)

### 0.1 — `incompatibleReason` — `ProgramGeneratorScreen.tsx` L626–648

```
L626  function incompatibleReason(value: SplitPreference): string | null {
L627    switch (value) {
L628      case 'brosplit':
L629        if (days !== null && days < 5) return `Nécessite 5 séances/sem. — tu en as ${days}`
L630        if (level === 'beginner')      return 'Fréquence trop faible par muscle pour un débutant'
L631        if (goal === 'strength')       return 'Force requiert 2-3 stimuli/sem. par muscle — Brosplit n\'en donne qu\'un'
L632        if (goal === 'endurance')      return 'Endurance : fréquence élevée par muscle requise — Brosplit trop peu fréquent'
L633        return null
L634      case 'arnold':
L635        if (days !== null && days < 3) return `Nécessite 3 séances/sem. minimum — tu en as ${days}`
L636        if (level === 'beginner')      return 'Volume et complexité élevés — déconseillé en débutant'
L637        if (goal === 'strength')       return 'Split bodybuilding — Force préfère Full Body ou Upper/Lower (fréquence 2-3×/sem.)'
L638        if (goal === 'endurance')      return 'Endurance : fréquence élevée par muscle requise — préfère Full Body ou Upper/Lower'
L639        return null
L640      case 'ppl':
L641        if (days !== null && days < 3) return `Nécessite 3 séances/sem. minimum — tu en as ${days}`
L642        if (goal === 'strength')       return 'Split orienté hypertrophie — Force préfère Full Body ou Upper/Lower (2-3 stimuli/sem.)'
L643        if (goal === 'endurance')      return 'Endurance : fréquence élevée par muscle requise — préfère Full Body ou Upper/Lower'
L644        return null
L645      default:
L646        return null
L647    }
L648  }
```

**Propriétés structurelles vérifiées :**

| Point | Constat | Ligne |
|---|---|---|
| Closure | `days`, `level`, `goal` sont des `useState` du composant (L198–204) — la fonction est redéfinie à chaque rendu de `renderSplitPicker`, donc jamais de closure périmée | L198, L199, L204 |
| Ordre des tests | **days → level → goal** pour brosplit et arnold ; **days → goal** pour PPL (pas de test `level` sur PPL) | L629-632 / L635-638 / L641-643 |
| Garde null | `days !== null &&` protège l'interpolation ; `level`/`goal` n'ont pas de garde mais `null !== 'beginner'` et `null !== 'strength'` → sûr | L629, L635, L641 |
| Splits jamais bloqués | `auto`, `fullbody`, `upper-lower` tombent dans `default` → toujours `null` | L645-646 |
| `glutes-focus` | **N'est jamais passé à `incompatibleReason`** — le bouton est rendu hors de la boucle `OPTIONS.map` avec `disabled: false` et `reason: null` codés en dur | L673-681 (L679-680) |
| Atteignabilité des états | Ordre wizard : Objectif(0) → Niveau(1) → Fréquence(2) → Durée(3) → **Structure(4)** → … ⇒ `goal`, `level`, `days` sont **toujours non-null** à l'étape 4 | L282-324 |

### 0.2 — Consommation du résultat — L656–661

```
L657  {OPTIONS.map(({ value, icon, label, sub }) => {
L658    const active = splitPreference === value
L659    const reason = incompatibleReason(value)      ← appel
L660    const disabled = reason !== null
L661    return renderSplitButton({ value, icon, label, sub, active, disabled, reason })
```

### 0.3 — Rendu UI d'un split bloqué — `renderSplitButton` L687–741

| Effet visuel / comportement | Implémentation | Ligne |
|---|---|---|
| Clic neutralisé | `onClick={() => { if (disabled) return; … }}` | L696-697 |
| Opacité 0.45 | `opacity: disabled ? 0.45 : 1` | L718 |
| Curseur interdit | `cursor: disabled ? 'not-allowed' : 'pointer'` | L715 |
| Message d'avertissement | bloc `{reason && …}` en `var(--warn, #f59e0b)`, préfixe `⚠ `, `fontWeight: 600` | L730-734 |
| Coche ✓ masquée | `{active && !disabled && …}` | L736 |
| Transition | `transition: 'opacity 0.15s'` | L719 |

⚠️ **Défaut transverse (voir §3, BUG-D1) :** l'attribut HTML `disabled` **n'est pas posé** sur le `<button>`. Le blocage est purement visuel + garde JS. Le bouton reste focusable au clavier et annoncé « bouton activé » par un lecteur d'écran.

---

# P52 — Brosplit bloqué par fréquence insuffisante

**Contexte wizard :** `{ goal:'hypertrophy', level:'intermediate', days:4 }` · Split testé : `'brosplit'`

### 1. Simulation `incompatibleReason('brosplit')`

| Étape | Ligne | Test | Évaluation | Sortie |
|---|---|---|---|---|
| entrée | L628 | `case 'brosplit'` | match | — |
| 1 | **L629** | `days !== null && days < 5` → `4 !== null && 4 < 5` | **true** | **`return`** |

Interpolation du template literal : `` `Nécessite 5 séances/sem. — tu en as ${days}` `` avec `days = 4`.

**Valeur retournée :** `"Nécessite 5 séances/sem. — tu en as 4"`

**Assertion attendue :** `"Nécessite 5 séances/sem. — tu en as 4"` → ✅ **PASS** (chaîne exacte, ligne 629)

Les tests L630 (level), L631 (strength), L632 (endurance) ne sont **jamais atteints** — court-circuit au premier `return`.

### 2. Comportement UI attendu

`disabled = reason !== null` → **`true`** (L660).

| Attribut | Valeur | PASS/FAIL |
|---|---|---|
| `opacity` | `0.45` (L718) | ✅ PASS |
| `cursor` | `not-allowed` (L715) | ✅ PASS |
| Clic | no-op via `if (disabled) return` (L697) | ✅ PASS |
| Texte affiché sous le sous-titre | `⚠ Nécessite 5 séances/sem. — tu en as 4` en orange (L730-734) | ✅ PASS |
| Attribut HTML `disabled` | **absent** | ❌ FAIL (BUG-D1) |
| `aria-disabled` | **absent** | ❌ FAIL (BUG-D1) |

Bouton **Bro Split grisé, non fonctionnel**. Les 5 autres options (`auto`, `fullbody`, `upper-lower`, `ppl`, `arnold`) restent actives : `ppl` passe L641 (4 ≥ 3) puis L642/L643 (goal = hypertrophy) → `null` ; `arnold` passe L635 (4 ≥ 3), L636 (intermediate), L637/L638 → `null`.

### 3. Analyse technique — si le filtre était ignoré

Appel `selectSplit({ goal:'hypertrophy', daysPerWeek:4, level:'intermediate', splitPreference:'brosplit' })` :

- `programGenerator.ts` L468 : `if (pref === 'brosplit')`
- L470 `switch (daysPerWeek)` → **L473** `case 4: return ['chest-tri', 'back-bi', 'shoulders-arms', 'legs']`

**Split produit :** `['chest-tri','back-bi','shoulders-arms','legs']` → ✅ conforme à l'assertion du prompt.

Suite de la génération (hypothèse `sessionDuration = 60`, non fourni par le contexte wizard) :

| # | Type interne | Base | `adjustedSlotCount(base,60,'hypertrophy')` | Type public (L117-127) | Nom final (L590-611 + L1040) |
|---|---|---|---|---|---|
| 1 | `chest-tri` | 7 | **7** | `push` | Chest & Triceps — Pectoraux & Triceps |
| 2 | `back-bi` | 8 | **8** | `pull` | Back & Biceps — Dos & Biceps |
| 3 | `shoulders-arms` | 8 | **8** | `upper` | Shoulders & Arms — Épaules & Bras |
| 4 | `legs` | 6 | **6** | `legs` | Legs — Jambes |

Aucun type canonique n'apparaît 2× → `totalOfType === 1` → **aucun suffixe A/B** (L1039-1040). Total : 7+8+8+6 = 29 slots + 4 warmups + 4 core = **37 exercices/semaine**.

Warnings générés : `hasPushSession` = true (`chest-tri`, `shoulders-arms`, L1113) et `hasPullSession` = true (`back-bi`, L1106) → pas de warning UX-5. `publicTypes.size = 4` → pas de warning UX-D. `level ≠ beginner` → pas de UX-H. **Aucun warning.** Le générateur accepte ce programme sans réserve : **le filtre est purement wizard**, confirmé.

### 4. Évaluation coach

**Le générateur produit ici un split parfaitement valide — et c'est le problème du filtre.**

Couverture du brosplit 4j : pectoraux+triceps (J1), dos+biceps (J2), épaules+bras (J3), jambes complètes incl. mollets (J4). **Tous les groupes sont couverts exactement 1× ; les bras reçoivent 2 stimuli/semaine** (chest-tri → triceps, back-bi → biceps, puis shoulders-arms → les deux). Deltoïde postérieur présent 3× (chest-tri pos 7, back-bi pos 7, shoulders-arms pos 3) — excellent pour la santé d'épaule. Avant-bras couverts (back-bi pos 8, shoulders-arms pos 8).

**Verdict coach : le brosplit 4j est structurellement plus « propre » que le brosplit 5j autorisé par le wizard.** Le 5j (L474) ajoute une séance `upper` qui redouble pecs/dos/épaules/bras — ce n'est plus « un groupe par séance ». Le seuil `days < 5` est donc **mal calibré** : il interdit la version la plus fidèle au concept et n'autorise que la version hybride.

Cela dit, le blocage reste **défendable sur le fond hypertrophique** : 1×/semaine par groupe est sous-optimal (méta-analyses Schoenfeld — 2×/sem. supérieur à volume égal). Mais alors le motif affiché est faux : ce n'est pas « il te faut 5 séances », c'est « cette structure a une fréquence trop faible quel que soit le nombre de jours ».

**Recommandation :** remplacer le blocage dur par un avertissement non bloquant à 4 jours, ou reformuler le motif. Le message actuel pousse l'utilisateur à **augmenter sa fréquence à 5 séances pour débloquer une option moins bonne** — incitation contre-productive.

---

# P53 — Brosplit bloqué par niveau débutant (5j)

**Contexte wizard :** `{ goal:'hypertrophy', level:'beginner', days:5 }` · Split testé : `'brosplit'`

### 1. Simulation `incompatibleReason('brosplit')`

| Étape | Ligne | Test | Évaluation | Sortie |
|---|---|---|---|---|
| entrée | L628 | `case 'brosplit'` | match | — |
| 1 | **L629** | `5 !== null && 5 < 5` | **false** | poursuite |
| 2 | **L630** | `level === 'beginner'` | **true** | **`return`** |

**Valeur retournée :** `"Fréquence trop faible par muscle pour un débutant"`

**Assertion attendue :** identique → ✅ **PASS** (ligne 630)

**Ordre des vérifications — assertion critique du prompt :** le test `days` (L629) est bien évalué **avant** le test `level` (L630). Preuve par contre-exemple : avec `{ level:'beginner', days:3 }` le message retourné serait `"Nécessite 5 séances/sem. — tu en as 3"` et **non** le message débutant. ✅ **PASS** — l'ordre days→level est respecté.

Conséquence UX de cet ordre : un débutant à 3 jours reçoit un motif « fréquence » trompeur, qui suggère qu'en passant à 5 séances le split se débloquerait — alors qu'il resterait bloqué par L630. **Le motif affiché n'est pas le motif le plus structurant.** (Voir BUG-D2.)

### 2. Comportement UI attendu

`disabled = true` → bouton Bro Split grisé (opacity 0.45, cursor not-allowed), message `⚠ Fréquence trop faible par muscle pour un débutant`. ✅ PASS (mêmes réserves BUG-D1).

Autres options à ce contexte : `arnold` → L635 (5 ≥ 3) puis **L636** `level === 'beginner'` → bloqué aussi (`"Volume et complexité élevés — déconseillé en débutant"`). `ppl` → L641 (5 ≥ 3), L642/L643 (hypertrophy) → **actif**. Donc à `beginner/5j/hypertrophy`, seuls `auto`, `fullbody`, `upper-lower`, `ppl`, `glutes-focus` sont cliquables.

### 3. Analyse technique — si le filtre était ignoré

`selectSplit` → L468 `pref === 'brosplit'` → **L474** `case 5: return ['chest-tri','back-bi','legs','shoulders-arms','upper']`

| # | Type interne | Base | slots (60 min, hypertrophy) | Type public | Nom |
|---|---|---|---|---|---|
| 1 | `chest-tri` | 7 | 7 | `push` | Chest & Triceps — Pectoraux & Triceps |
| 2 | `back-bi` | 8 | 8 | `pull` | Back & Biceps — Dos & Biceps |
| 3 | `legs` | 6 | 6 | `legs` | Legs — Jambes |
| 4 | `shoulders-arms` | 8 | 8 | `upper` | Shoulders & Arms — Épaules & Bras |
| 5 | `upper` | 8 | 8 | `upper` | Upper — Haut du corps |

⚠️ **Effet de nommage :** `shoulders-arms` et `upper` se projettent tous deux sur `'upper'` (L122 et L126) → `totalOfType = 2` → **suffixes ajoutés** (L1039-1040) : séance 4 = « Shoulders & Arms — Épaules & Bras **A** », séance 5 = « Upper — Haut du corps **B** ». Nommage incohérent : deux libellés différents partageant une numérotation A/B.

`level = 'beginner'` → `pickExercise` retourne `candidates[0]` (L781), déterministe.

Total : 37 slots + 5 warmups + 5 core = **47 exercices/semaine**.

Warnings du générateur : **UX-H déclenché** (L1074-1079, `level === 'beginner' && daysPerWeek >= 5`) → *« Volume élevé pour débutant : 5 séances/semaine génère un volume proche d'un programme intermédiaire… »*. Double protection cohérente : le wizard bloque en amont, le générateur avertirait en aval.

### 4. Évaluation coach

**Filtre pleinement justifié — c'est le meilleur des 8 blocages du groupe D.**

Trois arguments convergents :
1. **Apprentissage moteur.** Un débutant progresse d'abord par adaptation neurale. Le squat, le développé et le tirage doivent être répétés **2-3×/semaine** pour ancrer le pattern. Le brosplit 5j donne 1 séance jambes/semaine → 1 seule exposition au squat. C'est le pire format possible pour un novice.
2. **Volume ingérable.** 47 exercices/semaine, dont une séance `back-bi` de 8 slots et deux séances upper de 8 slots. Un débutant n'a ni la capacité de récupération ni la tolérance au volume pour cela (courbatures prolongées, abandon).
3. **Rendement décroissant.** Le brosplit tire sa logique du volume intra-séance maximal — pertinent chez un pratiquant avancé proche de son plafond. Chez un débutant, 3 séries suffisent à saturer le stimulus ; les séries 4-8 sont du volume perdu.

**Le message affiché est cependant partiellement faux.** À 5 jours, `selectSplit` L474 produit `chest-tri + upper` (pecs 2×), `back-bi + upper` (dos 2×), `shoulders-arms + upper` (épaules et bras 2×). La fréquence réelle est de **2×/semaine pour tout le haut du corps** — seules les jambes restent à 1×. Le motif *« fréquence trop faible par muscle »* décrit donc une propriété que le split 5j n'a pas. Les vrais motifs sont le volume et la complexité (exactement le message utilisé pour `arnold` en L636).

**Recommandation :** aligner le message brosplit/beginner sur celui d'arnold — *« Volume élevé et fréquence jambes trop faible — déconseillé en débutant »*.

---

# P54 — Brosplit bloqué par objectif Force

**Contexte wizard :** `{ goal:'strength', level:'intermediate', days:5 }` · Split testé : `'brosplit'`

### 1. Simulation `incompatibleReason('brosplit')`

| Étape | Ligne | Test | Évaluation | Sortie |
|---|---|---|---|---|
| entrée | L628 | `case 'brosplit'` | match | — |
| 1 | **L629** | `5 !== null && 5 < 5` | **false** | poursuite |
| 2 | **L630** | `'intermediate' === 'beginner'` | **false** | poursuite |
| 3 | **L631** | `goal === 'strength'` | **true** | **`return`** |

**Valeur retournée :** `"Force requiert 2-3 stimuli/sem. par muscle — Brosplit n'en donne qu'un"`

(dans le source : `'Force requiert 2-3 stimuli/sem. par muscle — Brosplit n\'en donne qu\'un'` — apostrophe échappée, L631)

**Assertion attendue :** identique → ✅ **PASS** (ligne 631)

### 2. Comportement UI attendu

Bouton Bro Split grisé, `⚠ Force requiert 2-3 stimuli/sem. par muscle — Brosplit n'en donne qu'un`. ✅ PASS.

Contexte croisé : `arnold` est bloqué en parallèle par **L637** (`"Split bodybuilding — Force préfère Full Body ou Upper/Lower (fréquence 2-3×/sem.)"`), `ppl` par **L642**. À `strength/intermediate/5j`, **trois des six** options standard sont grisées ; il ne reste que `auto`, `fullbody`, `upper-lower` (+ `glutes-focus`, jamais filtré).

⚠️ Le wizard affiche ici une note ℹ️ à l'étape Durée pour la Force (L297-314) : *« les repos de 3 min limitent le volume — 60 min = 4 exercices »*. Cohérent avec le barème `adjustedSlotCount`.

### 3. Analyse technique — si le filtre était ignoré

`selectSplit` → L474 → `['chest-tri','back-bi','legs','shoulders-arms','upper']` (identique à P53 — `selectSplit` ne lit **jamais** `goal` dans la branche `pref === 'brosplit'`, L468-476).

L'objectif n'intervient qu'ensuite, via `adjustedSlotCount` (`programGenerator.ts` L627-644) et les specs :

| # | Type | Base | `adjustedSlotCount(base, 60, 'strength')` = `max(4, floor(base×0.5))` | Slots retenus |
|---|---|---|---|---|
| 1 | `chest-tri` | 7 | `max(4, 3)` = **4** | chest cmp · chest_upper cmp · triceps iso · chest fly iso |
| 2 | `back-bi` | 8 | `max(4, 4)` = **4** | back_width cmp · back_thickness cmp · biceps iso · back iso |
| 3 | `legs` | 6 | `max(4, 3)` = **4** | quads cmp · ham/glutes cmp · quads iso · glutes iso |
| 4 | `shoulders-arms` | 8 | `max(4, 4)` = **4** | OHP cmp · shldr_lat iso · shldr_rear iso · biceps iso |
| 5 | `upper` | 8 | `max(4, 4)` = **4** | chest cmp · back cmp · OHP cmp · shldr_lat/rear iso |

Specs : compound `5×3-5 / rest 180s` (L74), isolation `3×5-8 / rest 120s` (L81). `adjustedSpec` inchangé à 60 min (L652).

**Résultat sportivement aberrant, quantifié :**
- Séance 4 (`shoulders-arms`) = **1 composé + 3 isolations**, dont un élévation latérale à **3×5-8 avec 2 min de repos** et un curl biceps idem. Charger lourd un deltoïde latéral sur 5-8 reps est un non-sens biomécanique (risque articulaire, ratio stimulus/fatigue déplorable).
- Séance 1 (`chest-tri`) = 2 développés + 2 isolations lourdes ; le triceps pushdown à 3×5-8 également.
- **Sur 20 slots hebdomadaires, seulement 8 sont des composés** (2+2+2+1+3 → 10 précisément : chest, chest_upper, back_width, back_thickness, quads, ham/glutes, OHP, chest, back, OHP = 10). Les 10 autres sont des isolations traitées en régime de force.
- **Fréquence par pattern lourd :** squat 1×/sem., soulevé/RDL 1×/sem., développé couché 2×/sem. (chest-tri + upper), OHP 2×/sem. (shoulders-arms + upper), tirage 2×/sem.

### 4. Évaluation coach

**Filtre justifié sur le fond, mais son motif est partiellement contredit par le code.**

Le fond est solide : la force maximale est une **compétence motrice**. La littérature (Grgic 2018 ; Ralston 2018) et la pratique (Sheiko, 5/3/1, Texas Method) convergent sur 2-3 expositions hebdomadaires par mouvement de compétition. Le brosplit organise le travail par **muscle**, pas par **mouvement** — inadapté par construction.

**Mais le motif littéral est faux à 5 jours.** Le message affirme « Brosplit n'en donne qu'un [stimulus] ». Or le split 5j réel donne 2×/sem. pour pecs, dos et épaules (grâce à la séance `upper` en position 5). **Le seul pattern réellement à 1×/semaine, c'est le squat et le soulevé de terre** — les deux plus importants en force. Le message serait juste s'il disait : *« Brosplit : squat et soulevé de terre 1×/semaine seulement »*.

**Défaut aggravant révélé par la simulation :** le vrai problème n'est pas la fréquence mais la **composition des séances sous barème force**. `adjustedSlotCount` cape à 4 slots, et sur les templates `shoulders-arms` / `chest-tri` / `back-bi` les positions 3-4 sont des isolations. Un athlète de force se retrouve donc à faire des élévations latérales en 5×3-5. **Aucun filtre du wizard ne couvre ce cas** : `glutes-focus` + strength (profil P50) produit exactement la même anomalie et n'est **pas** bloqué.

**Recommandation :** en objectif Force, prioriser les slots `compound: true` dans le cap de `adjustedSlotCount` plutôt que de tronquer l'ordre canonique. Cela corrigerait P54, P50 et le brosplit force d'un seul coup.

---

# P55 — Brosplit bloqué par objectif Endurance

**Contexte wizard :** `{ goal:'endurance', level:'intermediate', days:5 }` · Split testé : `'brosplit'`

### 1. Simulation `incompatibleReason('brosplit')`

| Étape | Ligne | Test | Évaluation | Sortie |
|---|---|---|---|---|
| entrée | L628 | `case 'brosplit'` | match | — |
| 1 | **L629** | `5 < 5` | **false** | poursuite |
| 2 | **L630** | `'intermediate' === 'beginner'` | **false** | poursuite |
| 3 | **L631** | `'endurance' === 'strength'` | **false** | poursuite |
| 4 | **L632** | `goal === 'endurance'` | **true** | **`return`** |

**Valeur retournée :** `"Endurance : fréquence élevée par muscle requise — Brosplit trop peu fréquent"`

**Assertion attendue :** identique → ✅ **PASS** (ligne 632)

C'est le **chemin le plus long** du switch brosplit : les 4 tests sont évalués avant le `return`. Si `goal` valait `'fat_loss'`, la fonction atteindrait **L633 `return null`** → bouton actif. Confirmation directe de l'assertion P47 du groupe C : `fat_loss` n'est bloqué par **aucun** des trois filtres.

### 2. Comportement UI attendu

Bouton Bro Split grisé, `⚠ Endurance : fréquence élevée par muscle requise — Brosplit trop peu fréquent`. ✅ PASS.

`arnold` bloqué en parallèle par L638 (message quasi identique), `ppl` par L643. Même configuration que P54 : 3 options grisées sur 6.

### 3. Analyse technique — si le filtre était ignoré

`selectSplit` → L474 → `['chest-tri','back-bi','legs','shoulders-arms','upper']` (inchangé — `goal` n'est pas lu).

`adjustedSlotCount(base, 60, 'endurance')` : `duration === 60` et `isStrength = false` → **`return base`** (L638-639 de `programGenerator.ts`). Aucune réduction :

| # | Type | Slots | Specs compound (L76) | Specs isolation (L83) |
|---|---|---|---|---|
| 1 | `chest-tri` | **7** | 3×15-20, rest 60s | 3×15-20, rest 45s |
| 2 | `back-bi` | **8** | idem | idem |
| 3 | `legs` | **6** | idem | idem |
| 4 | `shoulders-arms` | **8** | idem | idem |
| 5 | `upper` | **8** | idem | idem |

Total 37 slots + 5 warmups (2×10) + 5 core (3×15) = **47 exercices**, soit **~141 séries hebdomadaires** à 15-20 répétitions.

**Estimation de durée par séance (`back-bi`, 8 slots) :** 24 séries de travail. À ~45 s de travail (18 reps × 2,5 s) + 45-60 s de repos ≈ 1 min 45 par série → **~42 min de slots + warmup + core ≈ 50-55 min**. Tient dans le créneau 60 min — le problème n'est pas la durée mais la **fréquence** et la **redondance**.

### 4. Évaluation coach

**Filtre justifié — mais moins nettement que P53, et pour une raison différente de celle affichée.**

L'endurance musculaire locale repose sur des adaptations **périphériques** (densité capillaire, densité mitochondriale, tampon lactique, recrutement des fibres I). Ces adaptations ont un **décours court** : le stimulus doit être répété fréquemment, idéalement 3×/semaine par groupe, avec une fatigue résiduelle faible qui le permet parfaitement (charges légères, pas de dommage musculaire significatif). Un format qui concentre 24 séries sur un groupe une fois par semaine est doublement mauvais : trop de volume localisé d'un coup (fatigue métabolique dépassant l'utile), trop d'écart entre expositions.

**Comme en P54, le motif littéral surestime le défaut :** à 5 jours, la séance `upper` finale porte pecs, dos et épaules à **2×/semaine**. Le déficit réel concerne les jambes (1×/semaine) et l'absence totale de travail cardiovasculaire — que le wizard signale d'ailleurs honnêtement dans le libellé de l'objectif Endurance (L33 : *« Séries longues, peu de repos — cardio non inclus »*).

**Nuance à charge du filtre :** l'alternative proposée implicitement (l'auto) donne pour `endurance/intermediate/5j` la branche L573 → `['push','pull','lower-quad','lower-hip','fullbody-quad']`. Fréquence : pecs 2× (push + fullbody), dos 2×, jambes 3× (lower-quad + lower-hip + fullbody). **C'est effectivement bien supérieur** pour l'endurance. Le blocage oriente donc vers une option réellement meilleure — contrairement à P52. ✅

---

# P56 — Arnold bloqué par fréquence insuffisante

**Contexte wizard :** `{ goal:'hypertrophy', level:'intermediate', days:2 }` · Split testé : `'arnold'`

### 1. Simulation `incompatibleReason('arnold')`

| Étape | Ligne | Test | Évaluation | Sortie |
|---|---|---|---|---|
| entrée | L634 | `case 'arnold'` | match | — |
| 1 | **L635** | `days !== null && days < 3` → `2 !== null && 2 < 3` | **true** | **`return`** |

**Valeur retournée :** `"Nécessite 3 séances/sem. minimum — tu en as 2"`

**Assertion attendue :** identique → ✅ **PASS** (ligne 635)

L636 (beginner), L637 (strength), L638 (endurance) non atteints.

### 2. Comportement UI attendu

Bouton Arnold Split grisé (opacity 0.45, cursor not-allowed), `⚠ Nécessite 3 séances/sem. minimum — tu en as 2`. ✅ PASS.

**Contexte remarquable : à `days = 2`, deux boutons sont grisés simultanément.** `brosplit` → L629 (`2 < 5`) → `"Nécessite 5 séances/sem. — tu en as 2"` ; `ppl` → **L641** (`2 < 3`) → `"Nécessite 3 séances/sem. minimum — tu en as 2"`. Seuls `auto`, `fullbody`, `upper-lower` et `glutes-focus` restent cliquables — ce qui est **sportivement correct** : à 2 séances/semaine, seul le corps entier ou un upper/lower a du sens.

### 3. Analyse technique — si le filtre était ignoré

`selectSplit` → `programGenerator.ts` L458 `if (pref === 'arnold')` → L460 switch → **L461** `case 2: return ['chest-back', 'legs']`

**Split produit :** `['chest-back','legs']` → ✅ conforme à l'assertion du prompt.

| # | Type interne | Base | slots (60, hypertrophy) | Type public (L122) | Nom (L603) |
|---|---|---|---|---|---|
| 1 | `chest-back` | 9 | **9** | `upper` | Chest & Back — Pectoraux & Dos |
| 2 | `legs` | 6 | **6** | `legs` | Legs — Jambes |

Pas de suffixe (chaque canon 1×). Total 15 slots + 2 warmups + 2 core = **19 exercices**.

Détail `chest-back` (9 slots, tous retenus, L274-286) : chest cmp · back_width cmp · OHP cmp · back_thickness cmp · chest iso · back iso · biceps iso · triceps iso · shoulders_rear iso.
Détail `legs` (6 slots, L148-155) : quads cmp · ham/glutes cmp · quads iso · glutes iso · ham iso · calves iso.

**Audit de couverture — groupes musculaires absents du programme entier :**

| Groupe | Présent ? | Où |
|---|---|---|
| chest / chest_upper / chest_lower | ✅ | chest-back pos 1, 5 |
| back_width / back_thickness | ✅ | chest-back pos 2, 4, 6 |
| shoulders / shoulders_front | ✅ | chest-back pos 3 (OHP) |
| shoulders_rear | ✅ | chest-back pos 9 |
| **shoulders_lateral** | ❌ **ABSENT** | aucun slot dans `chest-back` ni `legs` |
| biceps / triceps | ✅ | chest-back pos 7, 8 |
| **forearms** | ❌ **ABSENT** | — |
| quads / hamstrings / glutes / calves | ✅ | legs pos 1-6 |
| core | ✅ | corePool en queue (L1031-1036) |

Warnings : `hasPushSession` = true et `hasPullSession` = true (`chest-back` figure dans les deux listes, L1106 et L1113) → aucun warning UX-5. `publicTypes = {upper, legs}`, size 2 → pas d'UX-D. **Aucun warning émis** malgré l'absence de deltoïde latéral.

### 4. Évaluation coach

**Filtre justifié, et pour la bonne raison — mais le programme sous-jacent n'est effectivement pas un Arnold split.**

Réponse directe à la question du prompt : **non, `['chest-back','legs']` n'est pas un Arnold split.** L'Arnold repose sur trois séances (Pecs+Dos / Épaules+Bras / Jambes) répétées 2× pour 6 jours — c'est un format de **haute fréquence à haut volume**. En amputer la séance Épaules+Bras détruit à la fois le concept et la couverture : **le deltoïde latéral disparaît complètement du programme**, alors qu'il est le principal contributeur à la largeur d'épaule, c'est-à-dire précisément l'esthétique « Arnold ». Ironie complète.

Ce qui reste est un **upper/lower 2 jours déguisé**, avec un upper surchargé (9 slots, 4 composés consécutifs : développé, traction, OHP, rowing = 16 séries lourdes avant la première isolation) et déséquilibré vers l'antérieur.

Le seuil `days < 3` est donc **bien calibré** et le message est **exact** : Arnold nécessite structurellement 3 séances distinctes.

**Point de comparaison favorable :** à 2 jours, l'utilisateur redirigé vers `auto` obtient `['fullbody-quad','fullbody-hip']` (L549) — deux corps entiers avec OHP, écarté latéral (fullbody-hip pos 6), mollets et biceps. **Couverture complète, fréquence 2×/semaine sur tout.** Le filtre oriente vers strictement mieux. ✅

**Note technique complémentaire :** l'absence de deltoïde latéral n'émet **aucun warning générateur** — les warnings de slot vide ne se déclenchent que sur un slot `compound: true` sans candidat (L996-1006), jamais sur un groupe musculaire **non représenté par un slot**. Angle mort à signaler hors groupe D.

---

# P57 — Arnold bloqué par niveau débutant

**Contexte wizard :** `{ goal:'hypertrophy', level:'beginner', days:3 }` · Split testé : `'arnold'`

### 1. Simulation `incompatibleReason('arnold')`

| Étape | Ligne | Test | Évaluation | Sortie |
|---|---|---|---|---|
| entrée | L634 | `case 'arnold'` | match | — |
| 1 | **L635** | `3 !== null && 3 < 3` | **false** | poursuite |
| 2 | **L636** | `level === 'beginner'` | **true** | **`return`** |

**Valeur retournée :** `"Volume et complexité élevés — déconseillé en débutant"`

**Assertion attendue :** identique → ✅ **PASS** (ligne 636)

Ordre days→level confirmé une seconde fois (cf. P53) : à `days = 2` le message aurait été celui de la fréquence.

### 2. Comportement UI attendu

Bouton Arnold Split grisé, `⚠ Volume et complexité élevés — déconseillé en débutant`. ✅ PASS.

Contexte : `brosplit` bloqué par L629 (`3 < 5`, message fréquence — **et non** le message débutant, illustration de BUG-D2). `ppl` → L641 (3 ≥ 3), L642/L643 (hypertrophy) → **actif**. Un débutant peut donc choisir PPL explicitement à 3 jours, alors que l'auto lui donnerait fullbody×3 (L557). Incohérence de philosophie signalée en §3 (BUG-D4).

### 3. Analyse technique — si le filtre était ignoré

`selectSplit` → L458 → **L462** `case 3: return ['chest-back','shoulders-arms','legs']` — l'Arnold classique.

| # | Type interne | Base | slots (60, hypertrophy) | Type public | Nom |
|---|---|---|---|---|---|
| 1 | `chest-back` | 9 | **9** | `upper` | Chest & Back — Pectoraux & Dos **A** |
| 2 | `shoulders-arms` | 8 | **8** | `upper` | Shoulders & Arms — Épaules & Bras **B** |
| 3 | `legs` | 6 | **6** | `legs` | Legs — Jambes |

⚠️ Même artefact de nommage qu'en P53 : `chest-back` et `shoulders-arms` partagent le type public `'upper'` (L122) → `totalOfType = 2` → suffixes **A** et **B** accolés à deux noms déjà distincts.

`level = 'beginner'` → `pickExercise` déterministe, `candidates[0]` (L781). Total 23 slots + 3 warmups + 3 core = **29 exercices/semaine**.

**Charge réelle de la séance `chest-back` (9 slots) :**

| Pos | Slot | Cat | Spec | Séries |
|---|---|---|---|---|
| 1 | chest / chest_upper | cmp | 4×8-12, rest 90 | 4 |
| 2 | back_width / back | cmp | 4×8-12, rest 90 | 4 |
| 3 | shoulders / shoulders_front | cmp | 4×8-12, rest 90 | 4 |
| 4 | back_thickness / back | cmp | 4×8-12, rest 90 | 4 |
| 5-9 | 5 isolations | iso | 3×10-15, rest 75 | 15 |

**35 séries de travail + warmup (2) + core (3) = 40 séries.** Estimation : 16 séries composées × ~2 min (travail + repos 90 s) = 32 min ; 15 séries isolation × ~1 min 45 = 26 min ; warmup + core ≈ 10 min → **≈ 68 min minimum, sans transition ni installation**, pour un créneau annoncé de 60 min. Dépassement de ~15 %.

### 4. Évaluation coach

**Filtre pleinement justifié — le message est exact ET les deux motifs qu'il cite sont vérifiables dans la simulation.**

**« Complexité » :** la séance A enchaîne **quatre composés lourds** (développé couché, traction/tirage, développé militaire, rowing barre) avant la moindre isolation. Cela suppose la maîtrise simultanée de quatre patterns techniques exigeants. Un débutant a typiquement une exécution acceptable sur un ou deux d'entre eux ; sur les composés 3 et 4, la technique se dégrade sous la fatigue accumulée par 8 séries lourdes préalables. C'est le scénario classique d'ancrage d'un défaut moteur.

**« Volume » :** 35 séries de travail sur une séance, dont 16 lourdes. La recommandation usuelle pour un novice est de **10-15 séries par séance**, 10-12 séries hebdomadaires par groupe musculaire. On est ici à plus du double, dès la première semaine.

**Argument supplémentaire non mentionné par le message — le principe même du split antagoniste est prématuré.** Pecs+dos dans la même séance vise le « pompage mutuel » et la récupération croisée entre séries antagonistes : un raffinement de gestion de fatigue qui ne produit un bénéfice que chez un pratiquant capable de générer une fatigue locale significative. Chez un débutant, ce mécanisme n'a rien à réguler.

**L'alternative est nettement supérieure.** À `beginner/3j/hypertrophy`, l'auto donne L557 → `['fullbody-quad','fullbody-hip','fullbody-quad']` : squat, développé et tirage **3× par semaine** (2× pour le pattern hip/RDL), 9 slots par séance dont 4 composés seulement, et surtout **répétition du même geste tous les 2 jours** — le format optimal pour l'apprentissage moteur. Le filtre redirige vers strictement mieux. ✅

---

# P58 — PPL bloqué par objectif Force ⚠️ INCOHÉRENCE MAJEURE

**Contexte wizard :** `{ goal:'strength', level:'intermediate', days:3 }` · Split testé : `'ppl'`

### 1. Simulation `incompatibleReason('ppl')`

| Étape | Ligne | Test | Évaluation | Sortie |
|---|---|---|---|---|
| entrée | L640 | `case 'ppl'` | match | — |
| 1 | **L641** | `days !== null && days < 3` → `3 !== null && 3 < 3` | **false** | poursuite |
| 2 | **L642** | `goal === 'strength'` | **true** | **`return`** |

**Valeur retournée :** `"Split orienté hypertrophie — Force préfère Full Body ou Upper/Lower (2-3 stimuli/sem.)"`

**Assertion attendue :** identique → ✅ **PASS** (ligne 642)

**À noter :** le `case 'ppl'` **ne teste pas `level`** — contrairement à `brosplit` (L630) et `arnold` (L636). PPL est donc autorisé aux débutants (cf. P57 §2). Asymétrie délibérée ou oubli ? Voir BUG-D4.

### 2. Comportement UI attendu

Bouton PPL grisé, `⚠ Split orienté hypertrophie — Force préfère Full Body ou Upper/Lower (2-3 stimuli/sem.)`. ✅ PASS.

Contexte `strength/intermediate/3j` : `brosplit` bloqué par L629 (`3 < 5`), `arnold` bloqué par **L637** (`"Split bodybuilding — Force préfère Full Body ou Upper/Lower (fréquence 2-3×/sem.)"`). **Trois options grisées ; restent `auto`, `fullbody`, `upper-lower`, `glutes-focus`.**

### 3. Analyse technique — si le filtre était ignoré

`selectSplit` → `programGenerator.ts` L440 `if (pref === 'ppl')` → L441 switch → **L443** `case 3: return ['push','pull','legs']`

| # | Type | Base | `adjustedSlotCount(base,60,'strength')` | Slots retenus (après troncature) |
|---|---|---|---|---|
| 1 | `push` | 6 | `max(4, 3)` = **4** | chest cmp · shoulders cmp · chest iso · triceps iso |
| 2 | `pull` | 6 | `max(4, 3)` = **4** | back_width cmp · back_thickness cmp · back iso · biceps iso |
| 3 | `legs` | 6 | `max(4, 3)` = **4** | quads cmp · ham/glutes cmp · quads iso · glutes iso |

Slots éjectés par la troncature : push pos 5-6 (shoulders_lat, shoulders_rear), pull pos 5-6 (shoulders_rear, forearms), legs pos 5-6 (hamstrings iso, **calves**).

Specs : compound 5×3-5 rest 180 (L74) ; isolation 3×5-8 rest 120 (L81). `goal === 'strength' && slot.compound` → `strengthEquipmentPrio` s'applique dans le tri (L769-772), barbell prioritaire.

Total 12 slots + 3 warmups + 3 core = **18 exercices**. Fréquence : **1×/semaine pour chaque pattern** (squat, soulevé, développé, tirage).

### 3bis. ⚠️ INCOHÉRENCE — le chemin AUTO produit exactement le split interdit

**Simulation `selectSplit` en mode auto avec les mêmes paramètres** (`splitPreference` absent → `pref = 'auto'`, `focusMuscles = []` → `workoutTypeFromFocus([])` retourne `null` en L402) :

```
programGenerator.ts
L435   const isMass = goal === 'strength' || goal === 'hypertrophy'   → isMass = TRUE
L500   const focusType = workoutTypeFromFocus([])                     → null
L501   if (focusType)                                                 → skip
L547   switch (daysPerWeek)                                           → case 3 (L551)
L553   if (isMass && level !== 'beginner') return ['push','pull','legs']   ← MATCH
```

**Résultat auto : `['push','pull','legs']` — strictement identique au PPL explicite bloqué par L642.**

| Chemin utilisateur | Ce que dit le wizard | Split réellement généré |
|---|---|---|
| Étape 4 → clic « PPL » | 🚫 grisé : *« Split orienté hypertrophie — Force préfère Full Body ou Upper/Lower »* | *(inaccessible)* |
| Étape 4 → clic « Auto » | ✅ *« Le coach choisit selon tes critères »* | **`['push','pull','legs']`** — le PPL interdit |

Le même utilisateur, à un clic de distance, se voit refuser une structure puis la recevoir sans le moindre avertissement — et sans qu'aucun `generatorWarning` ne soit émis (aucune règle des L1063-1157 ne couvre ce cas).

**Aggravation : le chemin auto est le plus emprunté.** `'auto'` est la valeur initiale du state (L205) et la première option de la liste (L617). L'utilisateur qui suit le parcours nominal tombe donc systématiquement dans le cas non protégé, tandis que le filtre ne s'applique qu'à celui qui explore les options manuellement.

**Bug ou choix délibéré ?** — **Bug.** Trois éléments l'établissent :
1. Un choix délibéré aurait produit une cohérence inverse (auto plus conservateur que l'explicite, jamais l'inverse) — le rôle d'un mode « le coach choisit » est d'être le chemin **sûr**.
2. La branche L553 est écrite en termes de `isMass`, qui **agrège** `strength` et `hypertrophy` (L435). Le PPL y est manifestement pensé pour l'hypertrophie ; `strength` est embarqué par effet de bord de l'agrégat, pas par intention.
3. Le libellé du filtre L642 dit littéralement *« Split orienté hypertrophie »* — l'auteur du filtre sait que PPL est un split d'hypertrophie. La branche L553 le contredit.

**Correctif recommandé (côté générateur, pas côté wizard — le filtre a raison) :**

```ts
// programGenerator.ts, case 3 (L551-557)
case 3:
  // Force : fullbody 3× — chaque pattern lourd 3 fois par semaine
  if (goal === 'strength' && level !== 'beginner')
    return ['fullbody-quad', 'fullbody-hip', 'fullbody-quad']
  if (isMass && level !== 'beginner') return ['push', 'pull', 'legs']   // hypertrophie seule
  if (!isMass && level !== 'beginner') return ['push', 'pull', 'fullbody-quad']
  return ['fullbody-quad', 'fullbody-hip', 'fullbody-quad']
```

Effet : `adjustedSlotCount(9, 60, 'strength') = max(4, 4) = 4` → 4 slots par séance fullbody = squat, développé, tirage, OHP à 5×3-5. **C'est exactement la structure d'un Starting Strength / Texas Method** — le standard de la force à 3 jours. Le générateur y est déjà parfaitement adapté.

⚠️ **Portée du correctif à vérifier :** cette même incohérence touche potentiellement `daysPerWeek = 5` (L569 : `isMass && !beginner` → `['push','pull','legs','upper','lower']`, PPL+UL également refusé par le filtre PPL). À traiter dans le même correctif.

### 4. Évaluation coach

**Le filtre a raison ; c'est `selectSplit` qui a tort.**

Pour un intermédiaire visant la force à 3 séances/semaine, `['push','pull','legs']` est un mauvais choix, pour un motif qui n'apparaît pleinement que dans la simulation :

1. **Fréquence par pattern : 1×/semaine.** Un squat le vendredi, le suivant le vendredi d'après. La force étant une compétence, l'espacement de 7 jours entre expositions est très en deçà de l'optimum (2-3×/sem., cf. Grgic 2018).
2. **Composition dégradée par le cap force.** Le cap à 4 slots laisse **2 composés + 2 isolations** par séance. Sur 12 slots hebdomadaires, seuls **6 sont des composés**. Un programme de force à 6 séries d'exercices lourds par semaine est un programme d'hypertrophie mal réglé. En fullbody 3×, le même cap de 4 slots donnerait **4 composés par séance = 12 composés/semaine**, soit le double.
3. **Isolations en régime de force.** Curl biceps et extension triceps à 3×5-8 avec 2 min de repos : ratio stimulus/fatigue défavorable, temps consommé sans transfert.
4. **Mollets supprimés.** La troncature à 4 slots éjecte systématiquement le slot `calves` (position 6 de `legs`).

Le message affiché est donc **juste sur le diagnostic** (« split orienté hypertrophie ») et **juste sur la prescription** (« Force préfère Full Body ou Upper/Lower »). C'est la meilleure formulation des huit filtres du groupe D.

**Verdict global P58 :** filtre wizard ✅ correct · générateur auto ❌ à corriger · sévérité **haute** (touche le parcours par défaut, objectif Force, niveau intermédiaire et confirmé).

---

# P59 — PPL bloqué par objectif Endurance

**Contexte wizard :** `{ goal:'endurance', level:'intermediate', days:3 }` · Split testé : `'ppl'`

### 1. Simulation `incompatibleReason('ppl')`

| Étape | Ligne | Test | Évaluation | Sortie |
|---|---|---|---|---|
| entrée | L640 | `case 'ppl'` | match | — |
| 1 | **L641** | `3 !== null && 3 < 3` | **false** | poursuite |
| 2 | **L642** | `'endurance' === 'strength'` | **false** | poursuite |
| 3 | **L643** | `goal === 'endurance'` | **true** | **`return`** |

**Valeur retournée :** `"Endurance : fréquence élevée par muscle requise — préfère Full Body ou Upper/Lower"`

**Assertion attendue :** identique → ✅ **PASS** (ligne 643)

### 2. Comportement UI attendu

Bouton PPL grisé, `⚠ Endurance : fréquence élevée par muscle requise — préfère Full Body ou Upper/Lower`. ✅ PASS.

Contexte `endurance/intermediate/3j` : `brosplit` bloqué par L629 (`3 < 5`), `arnold` bloqué par L638. Trois options grisées, `auto`/`fullbody`/`upper-lower`/`glutes-focus` disponibles.

### 3. Analyse technique — si le filtre était ignoré

`selectSplit` → L440 → **L443** `case 3: return ['push','pull','legs']`

`adjustedSlotCount(6, 60, 'endurance')` : `duration === 60`, `isStrength = false` → `return base` = **6 slots** par séance (aucune troncature, contrairement à P58).

| # | Type | Slots (6/6) | Contenu complet |
|---|---|---|---|
| 1 | `push` | 6 | chest cmp · shoulders cmp · chest iso · triceps iso · shoulders_lat iso · shoulders_rear iso |
| 2 | `pull` | 6 | back_width cmp · back_thickness cmp · back iso · biceps iso · shoulders_rear iso · forearms iso |
| 3 | `legs` | 6 | quads cmp · ham/glutes cmp · quads iso · glutes iso · ham iso · calves iso |

Specs endurance : compound 3×15-20 rest 60 (L76), isolation 3×15-20 rest 45 (L83). Total 18 slots + 3 warmups + 3 core = **24 exercices**, 54 séries de travail hebdomadaires.

### 3bis. Comparaison avec le chemin AUTO — cohérence vérifiée

```
programGenerator.ts
L435   isMass = ('endurance' === 'strength' || 'endurance' === 'hypertrophy')  → FALSE
L500   workoutTypeFromFocus([])                                               → null
L547   switch (3) → case 3 (L551)
L553   if (isMass && …)                                       → false, skip
L555   if (!isMass && level !== 'beginner') return ['push','pull','fullbody-quad']   ← MATCH
```

**Résultat auto : `['push','pull','fullbody-quad']` (PPF)** ≠ `['push','pull','legs']` (PPL).

✅ **Aucune incohérence de type P58 ici** : le chemin auto ne produit jamais le split que le filtre interdit. L'assertion du prompt est confirmée.

**Analyse fine de la différence — la fréquence promise n'est que partiellement livrée :**

| Groupe musculaire | PPL explicite (bloqué) | PPF auto (autorisé) | Gain |
|---|---|---|---|
| Pectoraux | 1× (push) | **2×** (push + fullbody pos 2) | ✅ +1 |
| Dos | 1× (pull) | **2×** (pull + fullbody pos 3) | ✅ +1 |
| Épaules (front/OHP) | 1× (push) | **2×** (push + fullbody pos 4) | ✅ +1 |
| Biceps | 1× (pull) | **2×** (pull + fullbody pos 7) | ✅ +1 |
| Triceps | 1× (push) | **2×** (push + fullbody pos 9) | ✅ +1 |
| Quadriceps | 1× **6 slots jambes** | 1× (fullbody pos 1, quads/glutes cmp) | ⚠️ volume ÷ 3 |
| Ischio-jambiers | 1× (2 slots : cmp + iso) | 1× (fullbody pos 5, iso seule) | ⚠️ perte du composé |
| Fessiers | 1× (2 slots) | 1× (via quads/glutes cmp seulement) | ⚠️ perte de l'iso |
| Mollets | 1× (legs pos 6) | 1× (fullbody pos 8) | = |

**Le gain de fréquence est réel sur tout le haut du corps (1× → 2×), mais il est payé par un effondrement du volume jambes** : la séance `legs` dédiée (6 slots) est remplacée par 3 slots répartis dans un fullbody. Le message du filtre est donc vrai pour 5 groupes sur 9 et faux pour les jambes.

**Nuance sur le libellé :** le message dit *« préfère Full Body ou Upper/Lower »*. L'auto ne donne **ni** l'un **ni** l'autre : il donne un PPF, c'est-à-dire un PPL dont on a remplacé la troisième séance. Le conseil affiché et le comportement réel du mode auto ne coïncident pas — décalage mineur mais réel (BUG-D3).

### 4. Évaluation coach

**Filtre justifié, mais c'est le plus faible des huit sur le plan de l'argumentation.**

Le fond est correct : l'endurance musculaire locale demande une **fréquence élevée et une fatigue résiduelle faible**. Les charges légères (15-20 reps, RPE modéré) génèrent peu de dommage musculaire, ce qui autorise et rend souhaitable un retour rapide sur le même groupe. Un PPL à 3 jours donne 7 jours entre deux sollicitations d'un même muscle — largement au-delà de la fenêtre utile (48-72 h).

**Trois réserves :**

1. **PPL 3j n'est pas catastrophique en endurance.** Contrairement à l'objectif Force (P58), l'endurance ne souffre pas du cap de slots : les 6 slots complets sont conservés, chaque séance est riche (2 composés + 4 isolations) et parfaitement réalisable en 60 min à 45-60 s de repos. La qualité intrinsèque des séances est bonne ; seul l'espacement pose problème.
2. **L'alternative proposée dégrade les jambes.** Voir le tableau ci-dessus : passer de 6 slots jambes à 3 est un recul sur le bas du corps. Pour un utilisateur cycliste ou coureur — profil typique de l'objectif Endurance — c'est contre-productif.
3. **Deux poids, deux mesures avec `fat_loss`.** L'argument de fréquence s'applique **identiquement** à `fat_loss` (3×12-15, rest 60 s — même logique métabolique, même faible dommage musculaire). Or `fat_loss` traverse les trois filtres sans être bloqué (L633, L639, L644 → `null`). Le profil P43 (PPL explicit + fat_loss) le confirme : bouton actif. **Le traitement d'`endurance` et de `fat_loss` devrait être identique** — soit les deux bloqués, soit aucun.

**Recommandation :** transformer le blocage endurance/PPL en avertissement non bloquant (le split reste utilisable, l'utilisateur est informé), ou étendre le blocage à `fat_loss` pour cohérence. La solution la plus défendable sportivement est la première : PPL 3j en endurance est sous-optimal, pas dangereux.

---

# Synthèse Groupe D

## Tableau récapitulatif — 8/8 assertions PASS

| # | Split | Contexte | Ligne déclenchante | Message retourné | Assertion | UI |
|---|---|---|---|---|---|---|
| P52 | brosplit | hyp / inter / 4j | **L629** | `Nécessite 5 séances/sem. — tu en as 4` | ✅ PASS | grisé |
| P53 | brosplit | hyp / **beginner** / 5j | **L630** | `Fréquence trop faible par muscle pour un débutant` | ✅ PASS | grisé |
| P54 | brosplit | **strength** / inter / 5j | **L631** | `Force requiert 2-3 stimuli/sem. par muscle — Brosplit n'en donne qu'un` | ✅ PASS | grisé |
| P55 | brosplit | **endurance** / inter / 5j | **L632** | `Endurance : fréquence élevée par muscle requise — Brosplit trop peu fréquent` | ✅ PASS | grisé |
| P56 | arnold | hyp / inter / **2j** | **L635** | `Nécessite 3 séances/sem. minimum — tu en as 2` | ✅ PASS | grisé |
| P57 | arnold | hyp / **beginner** / 3j | **L636** | `Volume et complexité élevés — déconseillé en débutant` | ✅ PASS | grisé |
| P58 | ppl | **strength** / inter / 3j | **L642** | `Split orienté hypertrophie — Force préfère Full Body ou Upper/Lower (2-3 stimuli/sem.)` | ✅ PASS | grisé |
| P59 | ppl | **endurance** / inter / 3j | **L643** | `Endurance : fréquence élevée par muscle requise — préfère Full Body ou Upper/Lower` | ✅ PASS | grisé |

**Toutes les chaînes de caractères, tous les ordres de test et tous les comportements UI attendus sont conformes.** `incompatibleReason` fonctionne exactement comme spécifié.

## Splits produits si les filtres étaient contournés

| # | `selectSplit` | Ligne | Split retourné | Le générateur bloque-t-il ? |
|---|---|---|---|---|
| P52 | brosplit 4j | `programGenerator.ts` L473 | `['chest-tri','back-bi','shoulders-arms','legs']` | ❌ non — 0 warning |
| P53 | brosplit 5j | L474 | `['chest-tri','back-bi','legs','shoulders-arms','upper']` | ⚠️ warning UX-H (volume débutant) |
| P54 | brosplit 5j | L474 | idem P53 | ❌ non |
| P55 | brosplit 5j | L474 | idem P53 | ❌ non |
| P56 | arnold 2j | L461 | `['chest-back','legs']` | ❌ non (deltoïde latéral absent, non détecté) |
| P57 | arnold 3j | L462 | `['chest-back','shoulders-arms','legs']` | ❌ non |
| P58 | ppl 3j | L443 | `['push','pull','legs']` | ❌ non |
| P59 | ppl 3j | L443 | `['push','pull','legs']` | ❌ non |

**Confirmation :** `selectSplit` ne consulte **jamais** `level`, et ne consulte `goal` que dans la branche `auto`. Les filtres sont **exclusivement** une barrière d'interface. Toute génération contournant l'UI (test unitaire, reprise de brouillon, futur endpoint) échappe intégralement à ces protections.

## Bugs et incohérences identifiés

### BUG-D4 — ⚠️ MAJEUR — Le mode Auto produit le split que le filtre PPL interdit (P58)

`incompatibleReason('ppl')` bloque PPL pour `goal === 'strength'` (L642), mais `selectSplit` en mode auto retourne `['push','pull','legs']` pour `strength + intermediate/advanced + 3j` (`programGenerator.ts` **L553**, via l'agrégat `isMass` défini L435). Le chemin par défaut du wizard délivre donc sans avertissement la structure que le chemin explicite déclare incompatible.

- **Sévérité :** haute — `'auto'` est la valeur initiale du state (L205) et la première option affichée (L617) ; c'est le parcours nominal.
- **Portée :** `strength` + `intermediate`/`advanced` + 3j (L553) ; à vérifier également pour 5j (L569 → `['push','pull','legs','upper','lower']`, également refusé par L642).
- **Diagnostic :** bug du générateur, pas du filtre. `isMass` agrège `strength` et `hypertrophy` alors que le PPL est un split d'hypertrophie — ce que le libellé du filtre reconnaît explicitement (« Split orienté hypertrophie »).
- **Correctif :** router `strength` vers fullbody×3 dans `case 3` (détail et code en P58 §3bis). `adjustedSlotCount(9,60,'strength') = 4` donne alors 4 composés lourds par séance — structure Starting Strength / Texas Method, déjà parfaitement supportée par le générateur.

### BUG-D1 — Accessibilité : blocage visuel sans blocage sémantique

`renderSplitButton` (L687-741) applique `opacity: 0.45` (L718), `cursor: 'not-allowed'` (L715) et une garde `if (disabled) return` (L697), mais **ne pose ni l'attribut HTML `disabled` ni `aria-disabled`**. Conséquences : le bouton reste dans l'ordre de tabulation, est annoncé « bouton, activé » par un lecteur d'écran, et un utilisateur au clavier obtient un `Enter` silencieusement ignoré sans retour. À comparer avec les autres boutons du même écran, correctement gérés (`disabled={advancing}` L353, `disabled={equipment.length === 0 …}` L589, `disabled={disabled}` L977).

**Correctif :** `disabled={disabled}` + `aria-describedby` pointant sur le bloc `reason`.

### BUG-D2 — Le motif affiché n'est pas toujours le motif structurant

L'ordre days→level→goal fait qu'un test précoce masque les suivants. Un débutant sélectionnant 3 jours voit sur Bro Split : *« Nécessite 5 séances/sem. — tu en as 3 »* (L629), ce qui laisse croire qu'à 5 séances l'option se débloquerait — alors qu'elle resterait bloquée par L630 (niveau). L'utilisateur peut modifier sa fréquence pour rien.

**Correctif :** collecter toutes les raisons applicables et afficher la plus structurante d'abord (niveau/objectif avant fréquence), ou les concaténer.

### BUG-D3 — Motifs partiellement démentis par le générateur

Trois messages décrivent une propriété que le split visé n'a pas :

| Message | Ligne | Réalité mesurée |
|---|---|---|
| brosplit « fréquence trop faible par muscle » | L630, L631, L632 | à 5j (L474), la séance `upper` finale porte pecs/dos/épaules/bras à **2×/semaine** ; seules les jambes sont à 1× |
| ppl endurance « préfère Full Body ou Upper/Lower » | L643 | l'auto ne donne **ni** l'un **ni** l'autre : il donne un **PPF** (L555) |
| arnold « Force préfère Full Body ou Upper/Lower » | L637 | l'auto en `strength/3j` donne **PPL** (L553) — cf. BUG-D4 |

Les blocages restent défendables ; ce sont les justifications qui sont imprécises.

### BUG-D5 — `fat_loss` échappe à tous les filtres

`fat_loss` atteint systématiquement `return null` (L633, L639, L644) : Bro Split, Arnold et PPL lui sont ouverts sans réserve, quels que soient le niveau et la fréquence. Or `fat_loss` (3×12-15, rest 60 s) partage exactement la logique métabolique d'`endurance` (3×15-20, rest 60 s) — même faible dommage musculaire, même bénéfice à une fréquence élevée. Les deux objectifs devraient être traités de la même façon. Confirmé par les profils P43, P45, P47 du groupe C (tous « bouton actif »).

### BUG-D6 — `glutes-focus` court-circuite entièrement le filtrage

Le bouton est rendu **hors** de la boucle `OPTIONS.map`, dans un bloc « Programmes spécialisés » (L673-681), avec `disabled: false` et `reason: null` **codés en dur** (L679-680). `incompatibleReason` n'est jamais appelée pour lui. Conséquence : `glutes-focus` est sélectionnable pour un **débutant**, à **2 jours**, en objectif **Force** — combinaison qui déclencherait trois blocages sur n'importe quel autre split. Le profil P50 (`glutes-focus` + strength + advanced) montre le résultat : `adjustedSlotCount(8,60,'strength') = 4` → hip thrust et RDL en 5×3-5, puis deux isolations fessiers en 3×5-8.

**Correctif :** passer `glutes-focus` par `incompatibleReason` (le `default` L645-646 rendrait `null` sans changer le comportement actuel), ce qui permet d'y ajouter ultérieurement des règles sans refactoriser.

### BUG-D7 — Angle mort : aucun warning sur un groupe musculaire sans slot

Les warnings de slot vide (`programGenerator.ts` L994-1007) ne se déclenchent que si un slot `compound: true` n'a **aucun candidat pour l'équipement disponible**. Un groupe musculaire qui n'a **aucun slot dans le split** passe totalement inaperçu. Illustration en P56 : `['chest-back','legs']` ne contient aucun slot `shoulders_lateral` ni `forearms` — **zéro warning émis**. Hors périmètre strict du groupe D, mais découvert lors de la simulation P56.

## Évaluation coach — les 8 filtres classés

| Filtre | Ligne | Fond sportif | Motif affiché | Verdict |
|---|---|---|---|---|
| arnold + beginner (P57) | L636 | ✅ excellent — 4 composés lourds enchaînés, 35 séries, ~68 min pour un créneau de 60 | ✅ exact (volume ET complexité, tous deux vérifiés) | **À conserver tel quel** |
| brosplit + beginner (P53) | L630 | ✅ excellent — 47 exercices/sem., squat 1×/sem. chez un novice | ⚠️ imprécis (le 5j donne 2× sur le haut du corps) | **Conserver, reformuler** |
| ppl + strength (P58) | L642 | ✅ solide — 1×/pattern, 6 composés/sem. seulement après le cap force | ✅ le mieux formulé des huit | **Conserver — corriger le générateur (BUG-D4)** |
| arnold + days<3 (P56) | L635 | ✅ solide — le 2j n'est pas un Arnold ; deltoïde latéral absent du programme entier | ✅ exact | **À conserver tel quel** |
| arnold + strength (—) | L637 | ✅ solide — même logique que P58 | ⚠️ « préfère Full Body ou Upper/Lower » démenti par l'auto (BUG-D4) | **Conserver, dépend du correctif D4** |
| brosplit + strength (P54) | L631 | ✅ solide — élévations latérales en 3×5-8, squat 1×/sem. | ⚠️ « n'en donne qu'un » faux à 5j | **Conserver, reformuler** |
| brosplit + endurance (P55) | L632 | ✅ correct — l'auto (L573) donne réellement mieux (jambes 3×/sem.) | ⚠️ même imprécision | **Conserver, reformuler** |
| ppl + endurance (P59) | L643 | ⚠️ le plus faible — PPL 3j en endurance est sous-optimal, pas mauvais ; l'alternative dégrade les jambes | ⚠️ conseille FB/UL, l'auto donne un PPF | **Passer en avertissement non bloquant** |

## Recommandations par ordre de priorité

1. **Corriger BUG-D4** (`programGenerator.ts` L551-557, et vérifier L567-575) — router `strength` vers fullbody×3. C'est le seul défaut fonctionnel réel du groupe : il touche le parcours par défaut et contredit le conseil affiché par le wizard.
2. **Corriger BUG-D1** — ajouter `disabled={disabled}` et `aria-disabled` sur le bouton de `renderSplitButton` (L694-721). Correctif d'une ligne.
3. **Trancher sur BUG-D5** — aligner `fat_loss` sur `endurance` dans les trois `case`, ou assumer explicitement l'asymétrie.
4. **Reformuler les motifs de BUG-D3** — remplacer l'argument de fréquence par l'argument réel (volume et fréquence jambes) pour les trois filtres brosplit.
5. **Passer `glutes-focus` par `incompatibleReason`** (BUG-D6) — sans changement de comportement immédiat, mais rend le filtrage extensible.
6. **Envisager BUG-D2** — afficher le motif structurant plutôt que le premier motif rencontré.

---

*Fin du Groupe D — profils P52 à P59, aucun profil omis.*
