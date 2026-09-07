# Audit v4 — GROUPE F (P66–P70) : `phaseLabel` v4 (séparateur `→` + labels FR)

**Auditeur :** coach sportif certifié (15 ans de programmation de l'entraînement)
**Périmètre :** P66 à P70 uniquement (GROUPE F)
**Date :** 2026-09-07

---

## Code de référence (lu en entier)

### `src/utils/programGenerator.ts` — `buildPhases`

| Ligne | Code |
|-------|------|
| 860 | `export function buildPhases(totalWeeks: number, goal: ProgramGoal = 'strength'): DraftPhase[] \| undefined {` |
| 861 | `if (totalWeeks < 8) return undefined` |
| 863 | `const cfg = PHASE_CONFIG_BY_GOAL[goal]` |
| 864 | `const adapt = 2` |
| 865 | `const deload = totalWeeks >= 12 ? 2 : 1` |
| 866 | `const intensive = totalWeeks <= 9 ? 2 : (totalWeeks >= 16 ? 4 : 3)` |
| 867 | `const progress = Math.max(1, totalWeeks - adapt - intensive - deload)` |
| 869 | `let w = 1` |
| 872–880 | push `{ name:'Adaptation', focus:'adaptation', weekStart: w (875), weekEnd: w + adapt - 1 (876) }` |
| 881 | `w += adapt` |
| 883–890 | push `{ name:'Progression', focus:'progression', weekStart: w (886), weekEnd: w + progress - 1 (887) }` |
| 891 | `w += progress` |
| 892–901 | push `{ name:'Intensification', focus:'intensification', weekStart: w (896), weekEnd: w + intensive - 1 (897) }` |
| 902 | `w += intensive` |
| 903–911 | push `{ name:'Décharge', focus:'deload', weekStart: w (906), weekEnd: totalWeeks (907) }` |
| 913 | `return phases` |

**Note structurelle :** la dernière phase se termine sur `weekEnd: totalWeeks` (ligne 907) et non sur `w + deload - 1`. La somme des phases est donc **arithmétiquement garantie** d'être égale à `totalWeeks` quelle que soit la valeur de `deload` — c'est un filet de sécurité contre les décalages d'arrondi. Vérifié pour chaque profil ci-dessous.

### `src/components/screens/ProgramGeneratorScreen.tsx` — `phaseLabel`

| Ligne | Code |
|-------|------|
| 11 | `buildPhases,` (import depuis `../../utils/programGenerator`) |
| 749 | `function phaseLabel(weeks: number): string {` (fonction locale à `renderProgramWeeksPicker`) |
| 750 | `const phases = buildPhases(weeks)` — **délègue à la source de vérité, aucune formule dupliquée** |
| 751 | `if (!phases) return ''` |
| 752 | `const plain: Record<string, string> = {` |
| 753 | `adaptation:      'rodage',` |
| 754 | `progression:     'progression',` |
| 755 | `intensification: 'pic d\'effort',` |
| 756 | `deload:          'récup.',` |
| 757 | `}` |
| 758 | `return phases.map((ph) => {` |
| 759 | `const dur = ph.weekEnd - ph.weekStart + 1` |
| 760 | `` return `${dur} sem. ${plain[ph.focus] ?? ph.focus}` `` |
| 761 | `` }).join(' → ') `` |

**Points clés vérifiés dans le code :**
- Le séparateur littéral de la ligne 761 est bien `' → '` (U+2192 encadré d'espaces), **pas** `' · '`.
- La table `plain` est indexée sur `ph.focus` (ligne 760), **pas** sur `ph.name`. C'est essentiel : la phase 4 porte `name: 'Décharge'` (ligne 904 du générateur) mais `focus: 'deload'` (ligne 905) → le mapping produit bien `'récup.'`.
- `plain` est typé `Record<string, string>` et non `Record<PhaseKey, string>` → l'accès `plain[ph.focus]` retourne `string | undefined` sous `noUncheckedIndexedAccess`, d'où le fallback `?? ph.focus`. Ce fallback n'est jamais atteint pour les 4 focus produits par `buildPhases`.
- Rendu UI : ligne 776 `const phaseInfo = opt.value !== null ? phaseLabel(opt.value) : null` ; lignes 804–808 `{phaseInfo && (<div …>{phaseInfo}</div>)}`.
- Options de durée proposées (ligne 174–183, `programWeeksOptions`) : `null` (Standard), `8`, `10`, `12`, `16`.

---

## P66 — `buildPhases(7)` → `undefined` → `phaseLabel(7)` vide

### Simulation

```
buildPhases(7)
  ligne 861 : 7 < 8  → true
  → return undefined

phaseLabel(7)
  ligne 750 : phases = undefined
  ligne 751 : !phases → true
  → return ''
```

Aucune des lignes 863–913 n'est exécutée : pas de `cfg`, pas de calcul `adapt`/`deload`/`intensive`/`progress`.

### Assertions

| # | Assertion | Résultat | Ligne |
|---|-----------|----------|-------|
| 1 | `totalWeeks = 7 < 8` → `buildPhases` retourne `undefined` | ✅ **PASS** | `programGenerator.ts:861` |
| 2 | `phaseLabel(7)` → `''` (chaîne vide, pas `undefined`, pas de throw) | ✅ **PASS** | `ProgramGeneratorScreen.tsx:751` |
| 3 | Sous-titre de la carte programme n'affiche rien pour 7 sem. | ✅ **PASS** | `ProgramGeneratorScreen.tsx:804` — `{phaseInfo && …}` : `''` est falsy → le `<div>` n'est pas monté (ni bloc vide, ni espace résiduel) |
| 4 | Aucune exception sur `.map()` d'un `undefined` (garde présente avant l'itération) | ✅ **PASS** | garde 751 **avant** le `.map()` 758 |
| 5 | Le générateur propage `phases: undefined` dans le draft | ✅ **PASS** | `programGenerator.ts:1168` — `phases: buildPhases(durationWeeks, goal)` |

**Verdict P66 : ✅ PASS (5/5)**

### Réserves ⚠️

- **7 semaines est inatteignable depuis le wizard.** `programWeeksOptions` (ligne 176–182) ne propose que `null / 8 / 10 / 12 / 16`. `phaseLabel(7)` n'est donc exerçable que par appel programmatique ou via `totalWeeks` injecté hors wizard. Le comportement est correct mais le chemin est mort côté UI — assertion 3 vérifiée par lecture du code, non observable en usage réel.
- **L'option « 📅 Standard » (`value: null`) n'affiche aucun libellé de phases** (ligne 776 : `opt.value !== null ? … : null`), alors qu'elle produit bel et bien 4 phases (8 sem. débutant, 12 intermédiaire, 16 confirmé — `DURATION_WEEKS`, `programGenerator.ts:679-683`). C'est l'option par défaut, donc la plus choisie, et c'est la seule qui ne montre pas sa périodisation. Correctif d'une ligne : `phaseLabel(opt.value ?? defaultWeeks)`.

### Coach

Le seuil à 8 semaines est **sportivement justifié** : en dessous, une périodisation en 4 blocs donnerait des phases de 1 semaine, trop courtes pour produire une adaptation mesurable (une phase d'intensification d'1 semaine n'a aucun effet de surcompensation). Renvoyer `undefined` plutôt que des phases dégénérées est le bon choix. Le silence de l'UI en dessous de 8 sem. est cohérent.

---

## P67 — `buildPhases(8)` → 4 phases → séparateur v4

### Simulation

```
buildPhases(8)
  861 : 8 < 8            → false, on continue
  864 : adapt     = 2
  865 : deload    = 8 >= 12 ? 2 : 1                         → 1
  866 : intensive = 8 <= 9 ? 2 : (…)                        → 2
  867 : progress  = max(1, 8 − 2 − 2 − 1) = max(1, 3)       → 3
  Contrôle de somme : 2 + 3 + 2 + 1 = 8 ✓

  w=1  → Adaptation      weekStart=1,  weekEnd=1+2−1=2   ; w=3
  w=3  → Progression     weekStart=3,  weekEnd=3+3−1=5   ; w=6
  w=6  → Intensification weekStart=6,  weekEnd=6+2−1=7   ; w=8
  w=8  → Décharge        weekStart=8,  weekEnd=8 (totalWeeks)
```

| Phase | `name` | `focus` | weekStart | weekEnd | Durée | Label v4 |
|-------|--------|---------|-----------|---------|-------|----------|
| 1 | Adaptation | `adaptation` | 1 | 2 | 2 | `2 sem. rodage` |
| 2 | Progression | `progression` | 3 | 5 | 3 | `3 sem. progression` |
| 3 | Intensification | `intensification` | 6 | 7 | 2 | `2 sem. pic d'effort` |
| 4 | Décharge | `deload` | 8 | 8 | 1 | `1 sem. récup.` |

```
phaseLabel(8) = "2 sem. rodage → 3 sem. progression → 2 sem. pic d'effort → 1 sem. récup."
```

### Assertions

| # | Assertion | Attendu | Obtenu | Résultat | Ligne |
|---|-----------|---------|--------|----------|-------|
| 1 | 4 phases, somme = 8 | 4 / 8 | 4 / 2+3+2+1=8 | ✅ **PASS** | `programGenerator.ts:872,883,892,903` |
| 2 | `adaptation.weekStart=1, weekEnd=2` | 1–2 | 1–2 | ✅ **PASS** | 875–876 |
| 3 | `progression.weekStart=3, weekEnd=5` | 3–5 | 3–5 | ✅ **PASS** | 886–887 |
| 4 | `intensification.weekStart=6, weekEnd=7` | 6–7 | 6–7 | ✅ **PASS** | 896–897 |
| 5 | `deload.weekStart=8, weekEnd=8` | 8–8 | 8–8 | ✅ **PASS** | 906–907 |
| 6 | `phaseLabel(8)` string complète | `"2 sem. rodage → 3 sem. progression → 2 sem. pic d'effort → 1 sem. récup."` | identique | ✅ **PASS** | 758–761 |
| 7 | **CRITIQUE** séparateur `' → '` (pas `' · '` v3) | `' → '` | `' → '` | ✅ **PASS** | `ProgramGeneratorScreen.tsx:761` |
| 8 | **CRITIQUE** `adaptation` → `'rodage'` (pas `'adaptation'`) | `rodage` | `rodage` | ✅ **PASS** | 753 |
| 9 | **CRITIQUE** `intensification` → `"pic d'effort"` | `pic d'effort` | `pic d'effort` | ✅ **PASS** | 755 |
| 10 | **CRITIQUE** `deload` → `'récup.'` (pas `'décharge'`) | `récup.` | `récup.` | ✅ **PASS** | 756 |
| 11 | `progression` reste `'progression'` (seul label inchangé v3→v4) | `progression` | `progression` | ✅ **PASS** | 754 |
| 12 | Le mapping utilise `ph.focus`, pas `ph.name` (sinon `'Décharge'` fuiterait) | `focus` | `focus` | ✅ **PASS** | 760 |

**Verdict P67 : ✅ PASS (12/12) — les 4 assertions CRITIQUES v4 passent.**

### Comparaison v3 → v4

| | v3 (ancien) | v4 (actuel) |
|---|---|---|
| Séparateur | `' · '` | **`' → '`** |
| adaptation | `adaptation` | **`rodage`** |
| progression | `progression` | `progression` (inchangé) |
| intensification | `intensification` | **`pic d'effort`** |
| deload | `décharge` | **`récup.`** |
| Sortie 8 sem. | `2 sem. adaptation · 3 sem. progression · 2 sem. intensification · 1 sem. décharge` | `2 sem. rodage → 3 sem. progression → 2 sem. pic d'effort → 1 sem. récup.` |

Longueur de chaîne : 88 car. (v3) → 76 car. (v4). Gain net sur une `t-caption` de 12 px en mobile.

### Coach

**8 semaines = 2 / 3 / 2 / 1.** C'est le format minimal viable et il est correctement réparti :
- 2 sem. de rodage : suffisant pour ancrer les patterns et calibrer les charges de départ.
- 3 sem. de progression : le bloc de travail réel — c'est court, mais c'est la contrainte d'un bloc de 8 sem.
- 2 sem. de pic d'effort : le minimum pour une surcharge exploitable (1 semaine ne produirait rien).
- 1 sem. de récup. : correct pour un cycle court, la dette de fatigue accumulée sur 7 semaines ne justifie pas 2 semaines de décharge.

**Réserve ⚠️ — le bloc de progression (3 sem.) est plus court que la somme rodage + pic (4 sem.).** Sur un cycle de 8 semaines, plus de la moitié du programme est consacrée aux phases d'encadrement et non au travail productif. C'est structurellement inévitable avec `adapt` fixé à 2 (ligne 864), mais pour un profil déjà entraîné, 1 semaine de rodage suffirait et libérerait une semaine de progression. Recommandation : rendre `adapt` dépendant du niveau (`beginner: 2`, `intermediate/advanced: 1` en dessous de 12 sem.).

**Sur le vocabulaire v4 :** « rodage », « pic d'effort » et « récup. » sont de bons choix pour un utilisateur non initié — ils décrivent une sensation, pas un concept de théorie de l'entraînement. « pic d'effort » est particulièrement juste : il communique l'intention (aller chercher le maximum) sans le jargon de la périodisation. Le séparateur `→` renforce la lecture chronologique là où `·` suggérait une énumération sans ordre. **Amélioration réelle de l'intelligibilité.**

---

## P68 — `buildPhases(10)` → `intensive = 3`

### Simulation

```
buildPhases(10)
  861 : 10 < 8            → false
  864 : adapt     = 2
  865 : deload    = 10 >= 12 ? 2 : 1                        → 1
  866 : intensive = 10 <= 9 ? 2 : (10 >= 16 ? 4 : 3)        → 3   ← franchissement du seuil >9
  867 : progress  = max(1, 10 − 2 − 3 − 1) = max(1, 4)      → 4
  Contrôle de somme : 2 + 4 + 3 + 1 = 10 ✓

  w=1  → Adaptation      1 → 2   ; w=3
  w=3  → Progression     3 → 6   ; w=7
  w=7  → Intensification 7 → 9   ; w=10
  w=10 → Décharge       10 → 10
```

| Phase | `focus` | weekStart | weekEnd | Durée | Label v4 |
|-------|---------|-----------|---------|-------|----------|
| Adaptation | `adaptation` | 1 | 2 | 2 | `2 sem. rodage` |
| Progression | `progression` | 3 | 6 | 4 | `4 sem. progression` |
| Intensification | `intensification` | 7 | 9 | 3 | `3 sem. pic d'effort` |
| Décharge | `deload` | 10 | 10 | 1 | `1 sem. récup.` |

```
phaseLabel(10) = "2 sem. rodage → 4 sem. progression → 3 sem. pic d'effort → 1 sem. récup."
```

### Assertions

| # | Assertion | Attendu | Obtenu | Résultat | Ligne |
|---|-----------|---------|--------|----------|-------|
| 1 | `intensive = 3` (seuil `>9` sem. franchi) | 3 | 3 | ✅ **PASS** | `programGenerator.ts:866` |
| 2 | `progression.weekEnd = 6` (sem. 3 à 6 = 4 sem.) | 6 | 6 | ✅ **PASS** | 886–887 |
| 3 | `phaseLabel(10)` string complète | `"2 sem. rodage → 4 sem. progression → 3 sem. pic d'effort → 1 sem. récup."` | identique | ✅ **PASS** | 758–761 |
| 4 | `deload` reste à 1 (10 < 12) | 1 | 1 | ✅ **PASS** | 865 |
| 5 | Somme = 10 | 10 | 2+4+3+1=10 | ✅ **PASS** | — |
| 6 | Séparateur `' → '` × 3 occurrences | 3 | 3 | ✅ **PASS** | 761 |
| 7 | Labels FR v4 (rodage / pic d'effort / récup.) | v4 | v4 | ✅ **PASS** | 753–756 |
| 8 | `deload.weekStart = 10, weekEnd = 10` | 10–10 | 10–10 | ✅ **PASS** | 906–907 |

**Verdict P68 : ✅ PASS (8/8)**

### Vérification du seuil `intensive` (ligne 866)

L'expression ternaire imbriquée `totalWeeks <= 9 ? 2 : (totalWeeks >= 16 ? 4 : 3)` a été évaluée sur la frontière :

| totalWeeks | Branche | `intensive` |
|-----------|---------|-------------|
| 8 | `<= 9` | 2 |
| 9 | `<= 9` | 2 |
| **10** | ni `<=9` ni `>=16` | **3** ← P68 |
| 15 | ni `<=9` ni `>=16` | 3 |
| 16 | `>= 16` | 4 |

Aucun trou ni chevauchement — la partition de l'axe est complète.

### Coach

**10 semaines = 2 / 4 / 3 / 1.** Le ratio s'améliore nettement par rapport à 8 sem. : le bloc de progression (4 sem.) devient enfin dominant et le pic d'effort passe à 3 semaines, ce qui correspond au format classique d'un bloc d'intensification (3 semaines de montée en charge avant décharge). C'est **le premier format réellement périodisé** de la grille.

**Réserve ⚠️ — 1 seule semaine de décharge après 3 semaines d'intensification, c'est court.** Le seuil de `deload` est posé à 12 sem. (ligne 865), mais la fatigue accumulée dépend surtout de la longueur du bloc d'intensification, pas de la longueur totale du programme. À 10 semaines on a déjà `intensive = 3` — le même bloc d'intensification qu'à 12 semaines — mais seulement la moitié de la décharge. **Recommandation : indexer `deload` sur `intensive` plutôt que sur `totalWeeks`** (`deload = intensive >= 3 ? 2 : 1`), ce qui donnerait 2/3/3/2 à 10 semaines — plus cohérent physiologiquement.

**Réserve ⚠️ UI —** le sous-titre statique de l'option 10 semaines (ligne 179) annonce `'Adaptation + Progression + Intensification'` : il **omet la phase de décharge** et emploie encore le vocabulaire v3 (« Adaptation », « Intensification »). Il s'affiche juste au-dessus du libellé v4 « 2 sem. rodage → 4 sem. progression → 3 sem. pic d'effort → 1 sem. récup. » (ligne 804), soit deux vocabulaires contradictoires dans la même carte, à 2 px d'écart. Correctif : aligner le `sub` sur la v4 ou le rendre neutre (« Bloc moyen — périodisation complète »).

---

## P69 — `buildPhases(12)` → `deload = 2`

### Simulation

```
buildPhases(12)
  861 : 12 < 8            → false
  864 : adapt     = 2
  865 : deload    = 12 >= 12 ? 2 : 1                        → 2   ← franchissement du seuil >=12
  866 : intensive = 12 <= 9 ? 2 : (12 >= 16 ? 4 : 3)        → 3
  867 : progress  = max(1, 12 − 2 − 3 − 2) = max(1, 5)      → 5
  Contrôle de somme : 2 + 5 + 3 + 2 = 12 ✓

  w=1  → Adaptation       1 → 2   ; w=3
  w=3  → Progression      3 → 7   ; w=8
  w=8  → Intensification  8 → 10  ; w=11
  w=11 → Décharge        11 → 12
```

| Phase | `focus` | weekStart | weekEnd | Durée | Label v4 |
|-------|---------|-----------|---------|-------|----------|
| Adaptation | `adaptation` | 1 | 2 | 2 | `2 sem. rodage` |
| Progression | `progression` | 3 | 7 | 5 | `5 sem. progression` |
| Intensification | `intensification` | 8 | 10 | 3 | `3 sem. pic d'effort` |
| Décharge | `deload` | 11 | 12 | 2 | `2 sem. récup.` |

```
phaseLabel(12) = "2 sem. rodage → 5 sem. progression → 3 sem. pic d'effort → 2 sem. récup."
```

### Assertions

| # | Assertion | Attendu | Obtenu | Résultat | Ligne |
|---|-----------|---------|--------|----------|-------|
| 1 | `deload = 2` (premier seuil `>= 12` sem.) | 2 | 2 | ✅ **PASS** | `programGenerator.ts:865` |
| 2 | `progression` = 5 sem., `weekStart=3`, `weekEnd=7` | 5 / 3 / 7 | 5 / 3 / 7 | ✅ **PASS** | 886–887 |
| 3 | `deload.weekStart=11, weekEnd=12` | 11–12 | 11–12 | ✅ **PASS** | 906–907 |
| 4 | `phaseLabel(12)` string complète | `"2 sem. rodage → 5 sem. progression → 3 sem. pic d'effort → 2 sem. récup."` | identique | ✅ **PASS** | 758–761 |
| 5 | `intensive = 3` (12 dans la plage 10–15) | 3 | 3 | ✅ **PASS** | 866 |
| 6 | `intensification.weekStart=8, weekEnd=10` | 8–10 | 8–10 | ✅ **PASS** | 896–897 |
| 7 | Somme = 12 | 12 | 2+5+3+2=12 | ✅ **PASS** | — |
| 8 | Labels FR v4 + séparateur `' → '` | v4 | v4 | ✅ **PASS** | 753–756, 761 |
| 9 | `weekEnd` de la décharge = `totalWeeks` (pas `w + deload − 1`) | 12 | 12 | ✅ **PASS** | 907 |

**Verdict P69 : ✅ PASS (9/9)**

**Cohérence avec `DURATION_WEEKS`** (`programGenerator.ts:679-683`) : 12 sem. est la durée par défaut du niveau `intermediate`. C'est donc la configuration la plus fréquemment générée en production — elle est correcte.

### Coach

**12 semaines = 2 / 5 / 3 / 2.** C'est **le format de référence** et il est bien construit :
- Bloc de progression de 5 semaines : assez long pour une vraie progression linéaire de charge (5 incréments hebdomadaires).
- Pic d'effort de 3 semaines : format classique de surcharge.
- 2 semaines de récupération : correct après 3 semaines d'intensification sur un cycle de 3 mois.

Le ratio travail productif / encadrement passe à 5/(2+3+2) = 5/7 — le meilleur des formats courts. **Verdict sportif : ✅ format bien calibré, rien à redire.**

**Réserve ⚠️ mineure —** le saut de `deload` de 1 à 2 se produit exactement à 12 semaines alors que `intensive` est identique (3) à 10, 11, 12 et 15 semaines. Un programme de 11 semaines a donc le même bloc d'intensification qu'un programme de 12 mais moitié moins de décharge (voir la recommandation détaillée en P68).

---

## P70 — `buildPhases(16)` → `intensive = 4` + `deload = 2`

### Simulation

```
buildPhases(16)
  861 : 16 < 8            → false
  864 : adapt     = 2
  865 : deload    = 16 >= 12 ? 2 : 1                        → 2
  866 : intensive = 16 <= 9 ? 2 : (16 >= 16 ? 4 : 3)        → 4   ← franchissement du seuil >=16
  867 : progress  = max(1, 16 − 2 − 4 − 2) = max(1, 8)      → 8
  Contrôle de somme : 2 + 8 + 4 + 2 = 16 ✓

  w=1  → Adaptation       1 → 2   ; w=3
  w=3  → Progression      3 → 10  ; w=11
  w=11 → Intensification 11 → 14  ; w=15
  w=15 → Décharge        15 → 16
```

| Phase | `focus` | weekStart | weekEnd | Durée | Label v4 |
|-------|---------|-----------|---------|-------|----------|
| Adaptation | `adaptation` | 1 | 2 | 2 | `2 sem. rodage` |
| Progression | `progression` | 3 | 10 | 8 | `8 sem. progression` |
| Intensification | `intensification` | 11 | 14 | 4 | `4 sem. pic d'effort` |
| Décharge | `deload` | 15 | 16 | 2 | `2 sem. récup.` |

```
phaseLabel(16) = "2 sem. rodage → 8 sem. progression → 4 sem. pic d'effort → 2 sem. récup."
```

### Assertions

| # | Assertion | Attendu | Obtenu | Résultat | Ligne |
|---|-----------|---------|--------|----------|-------|
| 1 | `intensive = 4` (seuil `>= 16` sem.) | 4 | 4 | ✅ **PASS** | `programGenerator.ts:866` |
| 2 | `progression` = 8 sem., `weekStart=3`, `weekEnd=10` | 8 / 3 / 10 | 8 / 3 / 10 | ✅ **PASS** | 886–887 |
| 3 | `intensification.weekStart=11, weekEnd=14` | 11–14 | 11–14 | ✅ **PASS** | 896–897 |
| 4 | `deload.weekStart=15, weekEnd=16` | 15–16 | 15–16 | ✅ **PASS** | 906–907 |
| 5 | `phaseLabel(16)` string complète | `"2 sem. rodage → 8 sem. progression → 4 sem. pic d'effort → 2 sem. récup."` | identique | ✅ **PASS** | 758–761 |
| 6 | `deload = 2` (16 ≥ 12) | 2 | 2 | ✅ **PASS** | 865 |
| 7 | Somme = 16 | 16 | 2+8+4+2=16 | ✅ **PASS** | — |
| 8 | `adapt = 2` malgré 16 sem. (constante, pas proportionnelle) | 2 | 2 | ✅ **PASS** | 864 |
| 9 | Labels FR v4 + séparateur `' → '` × 3 | v4 | v4 | ✅ **PASS** | 753–756, 761 |

**Verdict P70 : ✅ PASS (9/9)**

**Cohérence avec `DURATION_WEEKS`** : 16 sem. est la durée par défaut du niveau `advanced` (`programGenerator.ts:682`). Configuration correcte pour le profil confirmé.

### Coach

**16 semaines = 2 / 8 / 4 / 2.** Ratio excellent : 8 semaines de progression pure sur 16, soit la moitié du cycle en travail productif. Le pic d'effort à 4 semaines est le maximum recommandable — au-delà, le risque de surmenage central dépasse le bénéfice de surcharge. **Format sportivement solide.**

**Réserve ⚠️ — un bloc de progression de 8 semaines sans décharge intermédiaire est long.** La pratique standard sur un macrocycle de 4 mois insère une semaine de décharge légère à mi-parcours (typiquement sem. 6 ou 7) pour éviter la stagnation en fin de bloc. Ici, l'athlète enchaîne 12 semaines consécutives (sem. 3 à 14) sans aucune baisse de volume avant la décharge finale. Le modèle à 4 phases linéaires ne permet pas d'exprimer cette décharge intermédiaire.
**Recommandation :** pour `totalWeeks >= 16`, découper le bloc de progression en `Progression A → mini-décharge (1 sem.) → Progression B`, ou plus simplement autoriser un tableau de 5–6 phases quand `progress > 6`.

**Réserve ⚠️ — `adapt` reste fixé à 2 quelle que soit la durée** (ligne 864, commentaire `// max 2 semaines`). Sur 16 semaines, 2 semaines de rodage représentent 12,5 % du cycle ; sur 8 semaines, 25 %. La constante est trop courte pour un débutant sur 16 sem. (qui gagnerait à 3–4 sem. de technique) et trop longue pour un confirmé sur 8 sem. Recommandation : `adapt = level === 'beginner' ? min(3, ceil(totalWeeks/6)) : 2`.

**Longueur de la chaîne UI :** `"2 sem. rodage → 8 sem. progression → 4 sem. pic d'effort → 2 sem. récup."` = 74 caractères dans une `t-caption` (12 px). Sur un écran de 360 px de large avec 32 px de padding horizontal, cela passe sur 3 lignes. Lisible, mais c'est le libellé le plus long de la grille — à surveiller si un label FR devait s'allonger.

---

## Tableau de synthèse — GROUPE F

| Profil | Assertions critiques | Verdict | Réserves coach ⚠️ |
|--------|----------------------|---------|-------------------|
| **P66** | `buildPhases(7)` → `undefined` ✅ · `phaseLabel(7)` = `''` ✅ · sous-titre non rendu (falsy) ✅ · pas de crash sur `.map` ✅ · `phases: undefined` dans le draft ✅ | ✅ **PASS** (5/5) | 7 sem. inatteignable depuis le wizard (options : null/8/10/12/16) · l'option « 📅 Standard » n'affiche aucun libellé alors qu'elle produit 4 phases |
| **P67** | 4 phases somme=8 ✅ · 1-2 / 3-5 / 6-7 / 8-8 ✅ · **séparateur `' → '`** ✅ · **`rodage`** ✅ · **`pic d'effort`** ✅ · **`récup.`** ✅ · mapping sur `focus` et non `name` ✅ | ✅ **PASS** (12/12) | Bloc de progression (3 sem.) plus court que rodage+pic (4 sem.) — `adapt=2` fixe pénalise les cycles courts |
| **P68** | `intensive=3` (seuil >9) ✅ · progression 3→6 ✅ · `deload=1` (10<12) ✅ · somme=10 ✅ · labels v4 ✅ | ✅ **PASS** (8/8) | 1 sem. de décharge après 3 sem. d'intensification = insuffisant · `sub` de l'option 10 sem. (ligne 179) omet la décharge et utilise le vocabulaire v3 |
| **P69** | `deload=2` (seuil ≥12) ✅ · progression 3→7 (5 sem.) ✅ · décharge 11→12 ✅ · `intensive=3` ✅ · somme=12 ✅ · labels v4 ✅ | ✅ **PASS** (9/9) | Aucune sur la répartition — format de référence bien calibré · seuil `deload` indexé sur `totalWeeks` plutôt que sur `intensive` |
| **P70** | `intensive=4` (seuil ≥16) ✅ · progression 3→10 (8 sem.) ✅ · intensification 11→14 ✅ · décharge 15→16 ✅ · `adapt=2` constant ✅ · somme=16 ✅ · labels v4 ✅ | ✅ **PASS** (9/9) | 8 sem. de progression sans décharge intermédiaire (12 sem. consécutives sans baisse de volume) · `adapt` fixe à 2 inadapté aux extrêmes de durée |

**Total GROUPE F : 43 assertions, 43 PASS, 0 FAIL.**

---

## Synthèse des problèmes ouverts — GROUPE F

### Bugs / anomalies logicielles (assertions FAIL)

**Aucun.** Les 43 assertions du groupe F passent, dont les 4 assertions critiques v4 (`PHASE-SEP`, `PHASE-FR` × 3) validées sur P67 et confirmées sur P68–P70.

Vérification des régressions du récapitulatif :

| Code | Assertion | Profils | Résultat |
|------|-----------|---------|----------|
| `PHASE-SEP` | séparateur `' → '` (pas `' · '`) | P67–P70 | ✅ **PASS** — `ProgramGeneratorScreen.tsx:761` |
| `PHASE-FR` | labels FR : rodage / progression / pic d'effort / récup. | P67–P70 | ✅ **PASS** — `ProgramGeneratorScreen.tsx:753-756` |

La migration v3 → v4 est **complète et correcte** : aucune trace du séparateur `' · '` ni des labels v3 dans `phaseLabel`. La fonction continue de déléguer intégralement à `buildPhases` (ligne 750) — aucune formule de périodisation dupliquée dans le composant, ce qui garantit que le libellé affiché ne peut pas diverger des phases réellement générées.

### Incohérences de vocabulaire à signaler (UI, non bloquantes)

Le vocabulaire v4 (`rodage` / `pic d'effort` / `récup.`) n'a été appliqué **qu'à `phaseLabel`**. Le reste de l'application affiche toujours les `name` des phases produits par `buildPhases` (`Adaptation` / `Progression` / `Intensification` / `Décharge`, lignes 873, 884, 893, 904) :

| Emplacement | Vocabulaire affiché | Fichier:ligne |
|---|---|---|
| Wizard — sélecteur de durée (`phaseLabel`) | **v4** : rodage / pic d'effort / récup. | `ProgramGeneratorScreen.tsx:753-756` |
| Wizard — récapitulatif des blocs à l'étape Objectif | v3 : Adaptation / Intensification / **Décharge** | `ProgramGeneratorScreen.tsx:1052-1056` |
| Wizard — `sub` de l'option 10 semaines | v3 : « Adaptation + Progression + Intensification » (décharge omise) | `ProgramGeneratorScreen.tsx:179` |
| Écran Détail programme | v3 : Intensification / **Décharge** | `ProgramDetailScreen.tsx:651-652` |
| Dashboard (bandeau phase courante) | `phase.name` → **Décharge** | `DashboardScreen.tsx:275, 549` |
| Modale de séance | `phase.name` → **Décharge** | `SessionModal.tsx:292` |

**Impact concret :** l'utilisateur choisit « 12 semaines » en lisant « … → 2 sem. **récup.** », puis, arrivé en semaine 11, voit son dashboard afficher « 🔄 **DÉCHARGE** ». Deux mots pour la même phase, à deux moments du parcours. Le plus visible est le cas interne au wizard : le récapitulatif « Décharge » (ligne 1055) et le libellé « récup. » (ligne 756) coexistent dans le même écran, à deux étapes d'écart.

**Correction recommandée (hors périmètre du groupe F, à arbitrer) :** soit propager les labels v4 en exportant une table `PHASE_PLAIN_LABEL` depuis `programGenerator.ts` et l'utiliser partout où `phase.name` est rendu, soit assumer la distinction (langage accessible dans le wizard, terminologie technique en cours de programme) et documenter le choix. La première option est préférable — la v4 a manifestement pour objectif de retirer le jargon du parcours utilisateur, et le laisser réapparaître au moment où l'utilisateur vit la phase annule le bénéfice.

### Réserves coach cumulées — par thème

**1. Répartition des phases sur les cycles courts** (P67)
`adapt = 2` est une constante (ligne 864). Sur 8 semaines, rodage + pic + récup. = 5 semaines contre 3 de progression : plus de la moitié du cycle en phases d'encadrement. Recommandation : indexer `adapt` sur le niveau et la durée — `beginner: min(3, ceil(totalWeeks/6))`, `intermediate/advanced: totalWeeks < 12 ? 1 : 2`.

**2. Calibrage de la décharge** (P68, P69)
`deload` est indexé sur `totalWeeks` (ligne 865) alors que la fatigue à évacuer dépend de la longueur du bloc d'intensification. Résultat : 10 et 11 semaines ont `intensive = 3` mais `deload = 1`, tandis que 12 semaines a le même `intensive = 3` avec `deload = 2`. Recommandation : `deload = intensive >= 3 ? 2 : 1` — ce qui préserve exactement les sorties de P67 (intensive=2 → deload=1), P69 et P70, et corrige uniquement la plage 10–11 semaines.

**3. Absence de décharge intermédiaire sur les cycles longs** (P70)
Sur 16 semaines, l'athlète enchaîne les semaines 3 à 14 (12 semaines) sans aucune baisse de volume. Le modèle linéaire à 4 phases ne peut pas exprimer une décharge de mi-parcours, pourtant standard sur un macrocycle de 4 mois. Recommandation : autoriser 5–6 phases quand `progress > 6` (Progression A → mini-décharge 1 sem. → Progression B).

**4. Lisibilité et cohérence de l'UI du sélecteur de durée** (P66, P68)
- L'option « 📅 Standard » — celle par défaut, donc la plus choisie — est la seule à ne pas afficher sa périodisation (ligne 776). Correctif d'une ligne.
- Le `sub` statique de l'option 10 semaines (ligne 179) énumère 3 phases sur 4 et emploie le vocabulaire v3, en contradiction directe avec le libellé v4 affiché 2 px en dessous.

### Points forts à préserver

- **`phaseLabel` délègue à `buildPhases`** (ligne 750) : le libellé du wizard ne peut structurellement pas diverger des phases générées. C'est la bonne architecture — à ne jamais remplacer par une formule inline.
- **`weekEnd: totalWeeks` sur la dernière phase** (ligne 907) : la somme des phases est arithmétiquement garantie égale à `totalWeeks`, quel que soit l'arrondi des phases précédentes. Vérifié sur 8, 10, 12 et 16.
- **Mapping sur `ph.focus` et non `ph.name`** (ligne 760) : c'est ce qui permet à la traduction v4 de fonctionner malgré un `name` resté « Décharge » côté générateur. Un mapping sur `name` aurait silencieusement fait échouer l'assertion critique `deload → récup.`.
- **Le fallback `?? ph.focus`** (ligne 760) : si une 5ᵉ phase était ajoutée à `buildPhases` sans mise à jour de la table `plain`, l'UI afficherait la clé brute plutôt que `undefined`. Dégradation propre.
