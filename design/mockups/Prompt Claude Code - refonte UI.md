# Refonte UI Gym Track — prompt d'implémentation

## Avant de lancer Claude Code

1. Télécharge les trois maquettes depuis le projet de design :
   - `Session active — refonte UI.html`
   - `Refonte UI — écrans principaux.html`
   - `Refonte UI — post-séance.html`
2. Place-les dans le dépôt sous `design/mockups/`.
3. Commit ce dossier (`git add design/mockups && git commit -m "design: maquettes refonte UI"`).

Sans cette étape, Claude Code travaille à l'aveugle : il ne peut pas voir les maquettes.

---

## Le prompt

```
Refonte UI de Gym Track. Objectif : rapprocher l'app de ses maquettes, sans
toucher au design system ni à la logique métier.

═══════════════════════════════════════════════════════════════
CE QUE TU NE CHANGES PAS
═══════════════════════════════════════════════════════════════
- Aucun nouveau token. `src/index.css` et `src/theme/accents.ts` restent tels quels.
- Aucune valeur CSS en dur dans les composants — toujours var(--token).
  Les valeurs en dur existantes que tu croises dans les fichiers que tu
  modifies doivent être remplacées par le token correspondant.
- Aucune modification de logique : store, IndexedDB, sync, calcul 1RM,
  détection PR, planning de programme, streak. Si un changement d'UI semble
  exiger de toucher à `src/utils/`, arrête-toi et demande.
- Les tests existants passent tous à la fin. `npm run typecheck`,
  `npm test`, `npm run lint`, `npm run build` : verts.

═══════════════════════════════════════════════════════════════
LES MAQUETTES
═══════════════════════════════════════════════════════════════
`design/mockups/*.html` — ouvre-les. Ce sont des documents à cadres :
chaque cadre est un écran à 430px de large, avec des annotations à droite
qui expliquent le pourquoi de chaque changement. Les annotations citent les
fichiers et les lignes concernés : lis-les, elles sont le cahier des charges.

Les maquettes utilisent exactement les tokens de `src/index.css` et les
tracés d'icônes de `src/components/ui/Icon.tsx`. Si une valeur de maquette
ne correspond à aucun token, c'est une erreur de maquette — utilise le
token le plus proche et signale-le.

═══════════════════════════════════════════════════════════════
LES SEPT RÈGLES (transverses, à appliquer partout)
═══════════════════════════════════════════════════════════════
1. Un hero, pas six cartes. `DashboardScreen` écrit six variantes quasi
   identiques (scheduled / done_today / done_early / missed / early /
   rest_done). Extrais un `<SessionHero>` unique avec props : state,
   eyebrow, title, subtitle, metrics?, actions. La variation devient de la
   donnée.
2. Le sujet de l'écran est en display. Le nom de la séance passe de
   `t-title` (23px) à `--fs-display`. Un écran a un sujet, et un seul.
3. Tout chiffre est en mono via `.t-num`, et le chiffre principal d'un bloc
   fait au moins 23px.
4. Une section a un en-tête. Crée `<SectionHeader label value?>` et
   remplace tous les `<p className="t-eyebrow">` flottants, y compris ceux
   corrigés à la main par `margin: '20px 0 8px'`. Plus aucune marge en dur.
5. Zéro widget inventé sur place. Ce qui est écrit en styles inline devient
   une primitive dans `src/components/ui/` + `ui.css` :
   - `MiniBars` (une barre par série, remplie = validée)
   - `DateBlock` (jour + mois en mono, 44×44)
   - `DeltaPill` (delta signé, accent si positif)
   - `ExerciseRow` (poignée, nom, mini-barres, compteur)
   - `Swatch` (pastille de légende à opacité variable)
6. Une ligne temporelle commence par sa date. Les séances passées utilisent
   `DateBlock` en leading, plus l'icône `dumbbell`. L'icône ne sert qu'aux
   lignes de navigation.
7. Un graphique porte de vraies étiquettes. Les huit barres de
   `StatsScreen` libellées `S1…S8` reçoivent la date de début de semaine.
   Aucune étiquette sous 9,5px, aucune barre sous 6px de haut.

═══════════════════════════════════════════════════════════════
ORDRE DE TRAVAIL — un commit par lot
═══════════════════════════════════════════════════════════════

LOT 0 — Primitives
  Ajoute les cinq primitives de la règle 5 + `SectionHeader`, avec leur CSS
  dans `ui.css`, exportées depuis `src/components/ui/index.ts`.
  Aucun écran modifié dans ce lot. Build vert.

LOT 1 — Session active
  Maquette : `Session active — refonte UI.html`
  Fichiers : `SessionModal.tsx`, `SetTable.tsx`, `RestTimerBar.tsx`
  - Top bar à 3 zones : ✕ · eyebrow « En cours » + chrono mono 22px ·
    compteur X/Y qui OUVRE la vue d'ensemble (absorbe le bouton list).
    Le menu Actions (bouton grip) descend dans la carte de saisie.
  - Barre de progression segmentée : une micro-barre par série de la séance.
  - Hero : tag muscle en accent, `EX n/total` en mono, nom à 26px,
    méta « Préc. 32×10 · PR 36×6 » sur une ligne en mono.
  - `SetTable` passe en grille SET / KG / REPS + marqueur, avec ligne
    d'en-tête. Conserve les marqueurs existants (RPE, Échec, éclair PR) et
    la pastille ronde cliquable de validation.
  - Saisie regroupée dans une carte : deux steppers à 30px séparés par un
    filet, bouton pleine largeur dessous, puis une ligne d'actions
    secondaires (+ RPE · + Série · Actions).
  - `RestTimerBar` : le mm:ss passe de 34px aligné à droite à 56px centré,
    dans le même cadre que la saisie. Garde la logique existante des
    boutons (+15 s, puis Passer / Continuer à 0).

LOT 2 — Écrans principaux
  Maquette : `Refonte UI — écrans principaux.html`
  Fichiers : `DashboardScreen.tsx`, `HistoryScreen.tsx`, `StatsScreen.tsx`,
             `Heatmap.tsx`
  - Dashboard : `SessionHero` (règle 1), streak en bloc chiffré dans la top
    bar, rattrapages condensés en UNE ligne « N rattrapages en attente »
    cliquable au lieu de N boutons ghost empilés, avancement regroupé par
    semaine avec libellé (au lieu de cellules de 16px en wrap libre),
    séance du jour cerclée et non colorée.
  - Historique : en-tête de mois dans une ligne unique, heatmap avec
    en-tête L M M J V S D et jours hors mois atténués, carte volume avec le
    chiffre de la semaine en cours à 30px avant les barres, barres
    étiquetées par date de début de semaine.
  - Stats : barres étiquetées par date réelle, chips muscles touchés en
    accent au premier rang et non touchés en second rang atténué, records
    récents en lignes avec `DateBlock` accent + `DeltaPill`, progression
    30 jours en lignes avec `DeltaPill`.

LOT 3 — Post-séance
  Maquette : `Refonte UI — post-séance.html`
  Fichiers : `SessionCompleteView.tsx`, `PRCelebrationOverlay.tsx`,
             `SessionOverviewSheet.tsx`, `SessionRecapScreen.tsx`
  - Séance terminée : nom de la séance à 26px (il est en `t-caption` 12px),
    « Beau boulot » redescend en eyebrow, ajoute la position programme
    (`session.programWeek` est déjà disponible), et les deux cartes
    PR / streak fusionnent en deux lignes de fait avec chiffre mono à droite.
  - Célébration PR : le delta sort du libellé de tuile (`1RM estimé (+1.5)`
    en 11px) pour devenir une valeur accent à 19px dans un bloc
    avant → après. `CONFETTI_COLORS` ne garde que l'accent courant et le
    blanc — pas les cinq accents de la palette.
  - Vue d'ensemble : les lignes d'exercice passent de `.gt-set` détourné
    (avec son override `fontFamily: var(--font-ui)`) à `ExerciseRow`, avec
    mini-barres par série (cahier 6.15). Les deux chevrons de 26px sont
    remplacés par une poignée de glissement pleine hauteur — cible ≥ 44px.
    « Terminer la séance » passe de `variant="danger"` à `primary`.
  - Récap : hero accent fusionne date, plage horaire, nom, position et les
    trois tuiles comparatives. La légende des muscles reçoit un `Swatch` à
    l'opacité du segment correspondant. Les chips de série remplacent les
    emoji `🔥` / `★` par les icônes `flame` / `trophy`. L'action Partager
    utilise l'icône `share` et non `copy`. Les deux boutons de fin de
    scroll descendent dans `PrimaryBar` — « Terminé » est supprimé, le
    retour suffit.

═══════════════════════════════════════════════════════════════
DEUX INCOHÉRENCES À ARBITRER — demande-moi avant de trancher
═══════════════════════════════════════════════════════════════
- `navigation.ts` : l'onglet s'appelle « Stats », l'écran s'intitule
  « Progression ».
- `flame` sert à la fois d'icône de l'onglet Aujourd'hui et de glyphe du
  streak, donc apparaît deux fois sur le dashboard.

═══════════════════════════════════════════════════════════════
MÉTHODE
═══════════════════════════════════════════════════════════════
Commence par le LOT 0 et montre-moi les primitives avant d'attaquer le
LOT 1. Ensuite un lot par commit, avec `npm run build` vert à chaque fois.
Si une maquette et le code se contredisent sur un comportement (pas sur un
visuel), le code a raison — signale-le, ne le change pas.
```
