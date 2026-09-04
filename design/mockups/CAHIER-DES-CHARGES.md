# Gym Track — Cahier des charges (mobile)

> Document de spécifications fonctionnelles et techniques pour le développement de l'app mobile **Gym Track**. À destination d'un agent de développement (Claude Code).

---

## 1. Vue d'ensemble

**Gym Track** est une **application web mobile-first** (Progressive Web App) de suivi de séances de sport (musculation, hypertrophie, force). L'utilisateur crée des programmes, exécute des séances avec un suivi série-par-série en temps réel, et consulte sa progression sur le long terme.

**Plateforme cible** : web mobile (iPhone/Android via Safari/Chrome), install able en PWA sur l'écran d'accueil. Desktop fonctionnel mais design centré sur la viewport mobile (402px de large — le canvas n'est pas réactif au-delà, l'écran est centré sur fond neutre sur grand écran).
**Public** : pratiquants intermédiaires à avancés en salle de sport, francophones d'abord
**Mode hors-ligne** : obligatoire pendant une séance — Service Worker + IndexedDB. L'app doit pouvoir lancer, exécuter et terminer une séance complète sans réseau.
**Installable** : manifest PWA + icônes → ajout à l'écran d'accueil iOS / Android, lancement en mode standalone (sans barre URL).

---

## 2. Stack technique recommandée

**Framework** : **Next.js 15 (App Router)** ou **Vite + React 18**
- Next.js si tu veux SSR/SSG des pages publiques (landing, blog) un jour
- Vite si tu veux purement une SPA mobile sans backend (recommandé pour le MVP local-first)

**Langage** : TypeScript strict

**UI**
- React 18
- **Tailwind CSS** pour les utilities + CSS custom properties pour les tokens (le thème change à chaud sans rebuild)
- **Radix UI primitives** pour les composants accessibles (Dialog, Select, Switch, Slider, Toast)
- **framer-motion** pour les transitions et célébrations PR
- **clsx** + **tailwind-merge** pour la composition de classes

**Routing**
- Next.js App Router OU `react-router-dom` v7
- Transitions de page mobile-like (slide horizontal) via `framer-motion`

**État**
- **Zustand** pour l'état global UI
- **TanStack Query** (alias React Query) pour la couche data (même en local : invalidation cache, optimistic updates)

**Persistance locale (source de vérité)**
- **IndexedDB via Dexie.js** — ORM-like, requêtes async, hooks `useLiveQuery` pour le data binding réactif
- Schéma versionné avec migrations Dexie
- Backups manuels en JSON (équivalent du "export complet" du cahier)

**Charts**
- **Recharts** (simple, suffisant pour 1RM lines + volume bars + heatmap custom en SVG)
- Alternative : SVG "à la main" (comme dans les mockups) si tu veux 100% de contrôle

**Notifications**
- **Web Notifications API** + **Service Worker** pour les notifications locales (rappel séance, fin de repos)
- Sur iOS Safari : ne fonctionne qu'en mode PWA installée (iOS 16.4+)
- Fallback son + vibration `navigator.vibrate()` pendant la séance active

**Service Worker**
- **Workbox** via `vite-plugin-pwa` ou `next-pwa`
- Stratégie : `NetworkFirst` pour l'app shell, `CacheFirst` pour les assets, IndexedDB pour les données

**Media (création d'exercice perso avec image/GIF)**
- `<input type="file" accept="image/*,video/*">` pour le picker (utilise le picker système natif sur mobile)
- **react-image-crop** pour le cadrage
- **gifshot** ou **ffmpeg.wasm** pour conversion vidéo → GIF (lourd, ~25 MB ; à lazy-load uniquement quand nécessaire)
- Stockage : Blob dans IndexedDB (pas de filesystem en web)

**Auth (phase 1 MVP)**
- 100% local, pas d'auth. L'utilisateur ouvre l'app, ses données vivent dans son navigateur.
- Warning sticky discret : "Tes données sont stockées localement. Pense à exporter régulièrement."

**Auth (phase 4 cloud, optionnelle)**
- **Clerk** ou **Supabase Auth** (sign in with Apple/Google + email)

**Backend cloud (phase 4, optionnel)**
- **Supabase** (Postgres + Auth + Storage pour les médias)
- Sync IndexedDB ↔ Postgres via une couche custom (le modèle de données est déjà compatible)

**Fonts**
- Auto-hébergées (Space Grotesk + JetBrains Mono via `@fontsource/...`)
- Pas de fetch Google Fonts (mauvais offline)

**Tooling**
- **pnpm** comme package manager
- **Vitest** pour les tests unitaires
- **Playwright** pour les tests E2E sur 1-2 flows critiques (création programme, exécution séance)
- **Biome** ou **ESLint + Prettier** pour le linting
- **TypeScript strict** + `tsc --noEmit` en CI

**Déploiement**
- **Vercel** (Next.js natif) ou **Cloudflare Pages** (Vite, plus simple, gratuit généreux)
- Domaine custom recommandé dès le début pour "l'effet PWA" propre

---

## 3. Modèle de données

```ts
User {
  id: uuid
  email: string
  firstName: string
  lastName: string
  avatar?: blob
  bio?: string
  gender?: 'male' | 'female' | 'other'
  birthDate?: Date
  heightCm?: number
  preferences: UserPreferences
  createdAt: Date
}

UserPreferences {
  weightUnit: 'kg' | 'lb'
  distanceUnit: 'km' | 'mi'
  measurementUnit: 'cm' | 'in'
  defaultRestSec: number              // default 90
  restSoundEnabled: boolean
  hapticsEnabled: boolean
  autoBarbellWeight: boolean          // 20 kg + olympic plates
  theme: 'auto' | 'light' | 'dark'
  accentColor: string                 // oklch string
  language: 'fr' | 'en'
  weekStart: 'monday' | 'sunday'
  rpeScale: '6-10' | '1-10'
  oneRMFormula: 'epley' | 'brzycki' | 'lombardi'
  notificationsEnabled: boolean
  quietHoursStart?: string            // "22:30"
  quietHoursEnd?: string              // "07:00"
}

Exercise {
  id: uuid
  name: string
  primaryMuscle: MuscleGroup
  secondaryMuscles: MuscleGroup[]
  equipment: 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'kettlebell' | 'band'
  category: 'compound' | 'isolation'
  trackingType: 'weight_reps' | 'reps_only' | 'time'  // ce qui est saisi pendant la séance
  instructions?: string
  imageUrl?: string                   // illustration mus culaire built-in
  media?: ExerciseMedia               // média perso (photo/gif/vidéo)
  isCustom: boolean                   // user-created
  popularity?: number                 // 0-3 stars
  usageCount?: number                 // utilisations dans des séances
  createdAt: Date
}

ExerciseMedia {
  type: 'photo' | 'gif' | 'video'
  blobId: string                      // clé vers IndexedDB table 'blobs' (le Blob lui-même)
  thumbnailBlobId?: string            // première frame pour les listes
  originalSizeBytes: number
  compressedSizeBytes: number
  durationMs?: number                 // gif/video
  aspectRatio: number                 // pour préserver le cadrage
  loop: boolean                       // gif looping
  mirrored: boolean
  importedAt: Date
}

MuscleGroup =
  | 'chest' | 'chest_upper' | 'chest_lower'
  | 'back' | 'back_width' | 'back_thickness'
  | 'shoulders' | 'shoulders_front' | 'shoulders_lateral' | 'shoulders_rear'
  | 'biceps' | 'triceps' | 'forearms'
  | 'quads' | 'hamstrings' | 'glutes' | 'calves'
  | 'core' | 'cardio'

Program {
  id: uuid
  name: string
  goal: 'hypertrophy' | 'strength' | 'endurance' | 'fat_loss'
  level: 'beginner' | 'intermediate' | 'advanced'
  durationWeeks: number
  sessionsPerWeek: number
  color: string                       // hex
  isTemplate: boolean                 // built-in
  isActive: boolean                   // user's current
  startedAt?: Date
  weekTemplate: WeeklyTemplate        // 7 slots (Mon-Sun)
  createdAt: Date
}

WeeklyTemplate {
  monday?: WorkoutTemplateRef
  tuesday?: WorkoutTemplateRef
  // ... thursday is null = rest
  sunday?: WorkoutTemplateRef
}

WorkoutTemplate {
  id: uuid
  programId: uuid
  name: string                        // "Push · Pec & Triceps"
  type: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'fullbody' | 'custom'
  muscleGroups: MuscleGroup[]
  exercises: WorkoutExerciseTemplate[]
}

WorkoutExerciseTemplate {
  id: uuid
  workoutTemplateId: uuid
  exerciseId: uuid
  order: number
  supersetGroup?: string              // 'A', 'B' — null if no superset
  targetSets: number                  // 4
  repsMode: 'fixed' | 'range' | 'amrap'
  targetRepsMin: number               // 6
  targetRepsMax?: number              // 8 (null if fixed)
  targetRPE?: number                  // 6-10 in 0.5 steps
  restSec: number                     // 120
  autoProgress: boolean
  progressStepKg: number              // 2.5
  notes?: string
}

Session {
  id: uuid
  workoutTemplateId?: uuid             // null if freestyle
  programId?: uuid
  programWeek?: number
  name: string                         // copied from template at start
  startedAt: Date
  endedAt?: Date
  durationSec?: number                 // computed at end
  totalVolumeKg?: number               // computed
  totalSets: number
  completedSets: number
  notes?: string
}

SessionExercise {
  id: uuid
  sessionId: uuid
  exerciseId: uuid
  order: number
  supersetGroup?: string
}

Set {
  id: uuid
  sessionExerciseId: uuid
  index: number                        // 0-based
  weightKg: number
  reps: number
  rpe?: number
  restAfterSec?: number                // measured actual rest
  isWarmup: boolean
  isFailure: boolean
  completedAt?: Date                   // null until validated
  isPersonalRecord: boolean            // computed at validation
}

BodyMeasurement {
  id: uuid
  userId: uuid
  takenAt: Date
  weightKg?: number
  chestCm?: number
  waistCm?: number
  hipsCm?: number
  bicepCm?: number
  thighCm?: number
  calfCm?: number
  bodyFatPct?: number
  photoUrl?: blob
}

Goal {
  id: uuid
  userId: uuid
  type: 'exercise_1rm' | 'exercise_reps' | 'sessions_per_week' | 'bodyweight' | 'custom'
  exerciseId?: uuid
  targetValue: number
  currentValue: number
  unit: string
  deadline?: Date
  isActive: boolean
  achievedAt?: Date
}

PersonalRecord {
  id: uuid
  userId: uuid
  exerciseId: uuid
  type: '1rm' | 'reps_at_weight' | 'volume_set' | 'volume_session'
  weightKg: number
  reps: number
  estimated1RM: number                // computed
  setId: uuid                         // ref to the set that achieved it
  achievedAt: Date
}
```

**Index importants** : `Session(startedAt)`, `Set(sessionExerciseId, index)`, `PersonalRecord(exerciseId, type, achievedAt DESC)`

---

## 4. Système de design

### 4.1 Couleurs (tokens)

```css
/* Mode sombre (défaut) */
--bg:        oklch(0.16 0.008 75);    /* fond app */
--surface:   oklch(0.22 0.008 75);    /* cartes */
--surface2:  oklch(0.27 0.008 75);    /* surfaces secondaires */
--border:    oklch(0.33 0.010 75);
--text:      oklch(0.97 0.003 80);
--muted:     oklch(0.62 0.008 75);
--dim:       oklch(0.45 0.008 75);
--danger:    oklch(0.70 0.18 25);

/* Mode clair */
--bg:        oklch(0.985 0.004 80);
--surface:   #ffffff;
--surface2:  oklch(0.965 0.005 80);
--border:    oklch(0.90 0.006 80);
--text:      oklch(0.18 0.010 75);

/* Accent (configurable par l'utilisateur) */
--accent:    oklch(0.88 0.20 130);    /* lime par défaut */
--accent-ink: oklch(0.18 0.02 130);   /* texte sur l'accent (dark) */

/* Palette d'accents proposés */
lime    oklch(0.88 0.20 130)
orange  oklch(0.74 0.19 48)
blue    oklch(0.74 0.17 245)
pink    oklch(0.74 0.20 8)
amber   oklch(0.78 0.16 75)
```

### 4.2 Typo

- **UI** : Space Grotesk (400, 500, 600, 700)
- **Chiffres / monospace** : JetBrains Mono (400, 500, 600, 700)

Échelle :
- Display: 28-32px / weight 700 / letter-spacing -0.6
- Title: 22-26px / weight 700
- Body: 14px / weight 500
- Caption: 11-13px / weight 500
- Eyebrow: 10-11px / weight 700 / uppercase / letter-spacing 1.2-1.5
- Big numbers (poids, timer): JetBrains Mono / 40-72px / weight 700 / letter-spacing -1 à -3

### 4.3 Espacements & rayons

- Border-radius : 8 (tags) / 12 (boutons compacts) / 14-16 (rows) / 18-22 (cartes) / 999 (pills)
- Padding cartes : 16-22
- Padding écran horizontal : 20
- Gap stat tiles : 10
- Hit targets min : 44×44 px

### 4.4 Composants UI

| Composant | Usage |
|---|---|
| `Card` | Conteneur arrondi avec border subtile |
| `Pill` | Badge inline (surface / surface2 / accent) |
| `TabBar` | 4 tabs : Aujourd'hui / Historique / Stats / Profil |
| `Row` | Ligne de liste : icône + label + valeur + chevron |
| `ToggleRow` | Row avec contrôle trailing (switch/segmented/stepper) |
| `Segmented` | Sélecteur 2-4 options (kg/lb, thème...) |
| `Switch` | iOS-style on/off |
| `Stepper` | − [valeur] + pour KG/REPS |
| `PrimaryBar` | CTA collant en bas d'écran (couleur accent) |
| `ProgressBar` | Barre fine 4-6 px |
| `Heatmap` | Grille semaines × jours |

### 4.5 Iconographie

Icônes stroke 1.6, lineCap round, viewBox 24×24. Set complet à fournir : flame, list, chart, user, plus, minus, check, close, clock, arrow, bolt, dumbbell, chevron-right, pause, skip, trend, heart, target, ruler, cog, bell, database, info, logout, camera, scale, world, search, filter, grip, copy, trash, link, edit.

---

## 5. Navigation

```
┌─ TabBar (root)
│  ├─ Aujourd'hui (Dashboard)
│  │   ├─ Aperçu séance du jour  →  Briefing pré-séance  →  Modale Session
│  │   └─ Détail séance passée
│  ├─ Historique
│  │   └─ Détail séance
│  ├─ Stats
│  │   └─ Détail exercice (graph + historique)
│  └─ Profil (hub)
│      ├─ Compte personnel (edit)
│      ├─ Objectifs & programmes
│      │   ├─ Bibliothèque programmes  ←─┐
│      │   ├─ Détail programme ──────────┼→  Activation Sheet (bottom sheet)
│      │   └─ Création programme ────────┤  (workflow 4 étapes)
│      │       ├─ Méta (1/4)             │
│      │       ├─ Structure semaine (2/4)│
│      │       ├─ Éditer séance (3/4)    │
│      │       │   ├─ Picker exo ──────────→  Mes exercices
│      │       │   │                       └─ Créer exercice (form)
│      │       │   │                          ├─ Source média (sheet)
│      │       │   │                          ├─ Galerie interne
│      │       │   │                          └─ Éditeur (crop/trim)
│      │       │   └─ Config exo         │
│      │       └─ Revue (4/4) ───────────┘
│      ├─ Corps & mesures
│      │   └─ Ajouter mesure / photo
│      ├─ Préférences
│      ├─ Notifications
│      ├─ Données & export
│      └─ À propos
│
└─ Modale séance active (full-screen, par-dessus toute la nav)
    ├─ Vue d'ensemble (sheet)
    ├─ Timer de repos (inline)
    ├─ PR celebration (overlay)
    ├─ Picker exo (ajouter en cours)
    └─ Séance terminée → Récap détaillé
```

Modale "Séance active" : ne peut pas être quittée par swipe-down accidentel. Bouton fermer demande confirmation si > 0 séries faites.

---

## 6. Spécifications fonctionnelles écran par écran

### 6.1 Dashboard / Aujourd'hui

**Données affichées**
- Date et salutation
- Streak (jours consécutifs avec ≥1 série complétée)
- Carte hero : prochaine séance prévue selon programme + jour de la semaine
- 3 tuiles stats hebdo (séances, volume, temps) avec delta vs semaine précédente
- 3 dernières séances

**Logique**
- Si l'utilisateur n'a pas de programme actif → carte hero "Démarrer une séance libre"
- Si l'utilisateur est en jour de repos selon programme → carte hero "Repos · prochaine séance lundi"
- Le streak se calcule sur la timezone locale ; reset à minuit
- "Tap démarrer la séance" → ouvre la modale Session avec workout pré-rempli depuis le template

**États**
- Vide (pas de programme, pas d'historique) → onboarding inline
- Jour de repos
- Séance en cours (banner persistant en haut "Reprendre la séance")

---

### 6.2 Session active (modale plein écran)

**Top bar (sticky)**
- Bouton fermer ✕ (confirmation requise si séries faites)
- Chrono session (HH:MM:SS, démarre à `startedAt`)
- Compteur "X/Y" séries complétées
- Barre de progression

**Bloc exercice courant**
- Tag groupe musculaire
- Position "EX 2/5"
- Nom
- Précédent (perf séance similaire la plus récente)
- PR (record personnel sur cet exercice)

**Saisie (alterne avec Timer)**
- Stepper KG (step 2.5 par défaut, configurable)
- Stepper REPS (step 1)
- RPE optionnel (slider 6-10 par 0.5)
- Bouton "Valider la série"
  - Crée le Set
  - Détecte PR (compare 1RM estimé au max précédent sur cet exo)
  - Si PR : animation + notification subtile
  - Démarre timer de repos automatiquement

**Timer de repos**
- mm:ss en grand
- Barre de progression
- Cible configurable (depuis WorkoutExerciseTemplate.restSec ou prefs)
- Boutons : Passer · +15s
- Notification système quand fini (si app en background)
- Son + vibration selon prefs

**Tableau séries**
- Toutes les séries de l'exercice courant (planifiées + faites)
- Set actif surligné en accent
- Tap sur une série faite → édition

**Suivant**
- Aperçu de l'exercice suivant

**Actions cachées (long-press / swipe)**
- Échanger exercice
- Ajouter une série (au-delà du target)
- Marquer comme warmup
- Marquer comme échec (failure)
- Skip exercice

**Fin de séance**
- Détecté automatiquement quand tous les sets sont done OU bouton manuel "Terminer"
- Écran récap : durée, volume total, nombre PR, comparaison vs séance précédente
- Possibilité d'ajouter notes
- "Sauvegarder" persiste, met à jour Goals, PR, stats

---

### 6.3 Historique

- En-tête avec sélecteur mois
- Heatmap 4 semaines × 7 jours (jours d'entraînement en accent, intensité = % progression)
- Bar chart volume hebdo (4 dernières semaines)
- Liste des séances (carte par séance : jour, nom, durée, volume, tap → détail)

**Filtres** : type de séance, programme, période custom

**Détail d'une séance** (sub-screen)
- Header avec nom, date, durée, volume total
- Liste des exercices avec séries (poids × reps × RPE)
- Comparaison vs séance précédente du même type
- Bouton "Refaire cette séance" → ouvre Session avec les mêmes exos

---

### 6.4 Stats / Progression

- Sélecteur d'exercice (chips scrollables horizontalement)
- Carte PR : poids × reps + 1RM estimé + date + delta vs précédent
- Line chart 1RM estimé sur période (1M / 3M / 6M / 1A / Tout)
- Tonnage total + nombre de séries sur la période
- Liste des 5 dernières performances sur cet exercice avec delta

**Calcul 1RM** (formule Epley par défaut) :
```
1RM = weight × (1 + reps / 30)
```

---

### 6.5 Profil — Hub

Voir section 6.6-6.11 pour les sous-écrans.

- Carte identité (avatar, nom, email, depuis)
- 3 stats lifetime (séances, streak record, tonnage total)
- Bannière "Passer à Pro" (si plan gratuit)
- 3 groupes de rows :
  - **Compte** : Compte personnel · Objectifs & programmes · Corps & mesures
  - **Application** : Préférences · Notifications · Données & export
  - **À propos** : À propos · Déconnexion

---

### 6.6 Compte personnel (edit)

Champs éditables :
- Photo (camera / galerie / supprimer)
- Prénom, Nom
- Email (vérification par lien si changement)
- Date de naissance → calcule âge
- Sexe (homme/femme/autre/non précisé)
- Taille (cm/in selon prefs)
- Bio (textarea 200 caractères max, avec compteur)

Action destructive en bas : "Supprimer le compte" → flow de confirmation 3 étapes.

---

### 6.7 Corps & mesures

- Carte poids actuel + objectif + courbe d'évolution (1M/3M/6M/1A/Tout)
- Grille 2×3 mensurations : poitrine, taille, hanches, bras, cuisse, mollet (cm/in)
- Photos de progression : grille mensuelle (3 mois visibles), tap → fullscreen avec swipe gauche/droite pour comparer
- CTA "+" header → ajout d'une mesure (sheet bottom avec champs)

**Logique poids** : si Apple Health connecté, sync auto en background ; sinon saisie manuelle.

---

### 6.8 Objectifs & programmes

**Programme en cours** (carte accent)
- Nom, fréquence, durée
- Progression (% complété sur la durée)
- Lien "Voir le programme"

**Objectifs actifs** (jusqu'à 5)
- Type : 1RM exercice / reps exercice / séances/sem / poids corporel / custom
- Barre de progression
- % complété
- CTA "Nouvel objectif" → sheet de création

**Bibliothèque programmes** : voir 6.13

---

### 6.9 Préférences

Voir UserPreferences pour tous les champs.

Sections :
- Unités (poids, distance, mensurations)
- Entraînement (repos défaut, son, vibrations, poids barre auto)
- Apparence (thème, langue, début semaine, couleur accent)
- Avancé (Apple Health, échelle RPE, formule 1RM)

---

### 6.10 Notifications

- **Toggle maître** en haut (carte accent)
- Catégories :
  - Entraînement : rappel séance (jours + heure config), fin de repos, séance non terminée
  - Progrès : nouveaux PR, résumé hebdo, streak en danger
  - Horaires silencieux (range heure début/fin)
- Note de bas avec lien vers réglages système

**Implémentation** : Expo Notifications côté local. Le rappel séance est programmé en local selon le planning du programme actif.

---

### 6.11 Données & export

- Exporter mes données (CSV / JSON, par email ou save fichier)
- Importer depuis Strong / Hevy (parser CSV)
- Synchronisation iCloud (iOS) / Google Drive (Android) — phase 2
- Effacer toutes les données (avec confirmation triple)

---

### 6.12 Workflow Création de programme (4 étapes)

**Entrée** : Profil → Objectifs & programmes → "Créer mon programme" OU template "Personnaliser"

#### Étape 1/4 — Méta
- Nom (input)
- Objectif (radio 4 options : hypertrophie / force / endurance / perte de gras)
- Niveau (segmented : débutant / intermédiaire / avancé)
- Durée en semaines (stepper, 4-52, défaut 12)
- Séances/sem (visuel 1-7, sélection)
- Couleur (palette 5 options)

**Validation** : nom requis ; les autres ont des défauts.

#### Étape 2/4 — Structure semaine
- 7 slots jour (Lun → Dim)
- Chaque jour : soit assigner une session (push/pull/legs/upper/lower/full body/custom), soit repos
- Drag pour réordonner
- Stats live : nb séances, nb repos, durée estimée totale
- Tap sur un jour de repos → ajouter une séance (sheet avec choix du type ou créer custom)
- Tap sur un slot rempli → éditer (étape 3)
- Long-press → dupliquer / supprimer

**Règle** : les séances avec le même `type` partagent leur progression (ex. 2x Push = même exos / progression croisée).

#### Étape 3/4 — Éditer une séance
- Pour chaque WorkoutTemplate :
  - Nom (input)
  - Groupes musculaires (chips multi-sélection)
  - Liste exercices ordonnés
  - Drag pour réordonner
  - Boutons : "Ajouter exercice" (→ Picker), Dupliquer la séance, Supprimer

**Supersets** : 2+ exos peuvent partager un `supersetGroup` (A/B/C). Visuellement reliés par un trait + label "SUPERSET A".

**Picker (sub-screen modal)**
- Search input
- Chips muscles (Tous, Pecs, Dos, Épaules, Bras, Jambes, Core)
- Liste résultats avec preview (nom, muscle, équipement, popularité ★)
- Sélection multiple (checkbox)
- CTA bas "Ajouter X exercices"
- Bouton "Créer un exercice personnalisé" en fin de liste

**Config exo (sub-screen modal)**
- Illustration muscle + tags
- Séries (stepper, défaut 3)
- Reps mode (segmented : Fixe / Plage / AMRAP)
- Reps target (stepper unique ou min-max)
- RPE cible (slider visuel 6-10 par 0.5)
- Repos (presets 1:00 / 1:30 / 2:00 / 3:00 + custom)
- Toggle "Progression auto" (+2.5 kg quand reps max atteintes)
- Notes (textarea)

#### Étape 4/4 — Revue
- Carte hero avec stats agrégées (sem, jrs/sem, exos totaux, RPE moyen)
- Visuel rythme hebdo (7 cases)
- Liste séances avec durée estimée
- Date de démarrage (date picker, défaut = prochain jour assigné)
- CTA "Activer le programme"
  - Si programme actif existe → confirmation "Remplace [nom]"
  - Crée occurrence Program et planifie notifications

---

### 6.13 Bibliothèque programmes

- Header avec search
- CTA "Créer mon programme" (carte accent)
- Filtres chips (Tous / Force / Hypertrophie / Débutant / Full body...)
- Section "Mes programmes" (custom + actif marqué "ACTIF")
- Section "Templates" (built-in)
- Tap programme → **Détail programme (6.14)**

**Templates built-in (minimum)** :
- Full Body 3× (débutant, 8 sem)
- Upper / Lower 4× (intermédiaire, 10 sem)
- Push Pull Legs 6× (hypertrophie, 12 sem)
- 5/3/1 BBB (force, 12 sem)
- StrongLifts 5×5 (débutant, 12 sem)

---

### 6.14 Workflow Choisir programme & démarrer séance

#### Détail programme

Vue de prévisualisation **avant** activation d'un programme (template ou perso).

- **Hero plein largeur** en couleur accent : tag objectif, nom (gros), 4 métriques (semaines, jrs/sem, exos totaux, niveau)
- **Social proof** : nombre d'utilisateurs actifs + rating ★ (uniquement pour templates built-in / partagés)
- **Description courte** + volume/intensité indicative (séries par muscle/sem, plage RPE)
- **Rythme hebdo** : 7 cases jour avec tag PUSH/PULL/LEGS et code couleur
- **Liste des séances** : carte par séance avec aperçu des exos principaux (résumé une ligne)
- **CTA double** sticky en bas :
  - "Personnaliser" → ouvre workflow création préfillé à l'étape 2 (Structure semaine)
  - "Utiliser ce programme" → ouvre l'**Activation Sheet**

#### Activation Sheet (bottom sheet)

Confirmation modale avant d'activer un programme.

- **Drag handle** en haut + bouton ✕
- **Nom + durée** du programme
- **Warning** si un programme est déjà actif : "Remplace ton programme actuel. [nom] sera archivé. L'historique reste accessible."
- **Date de démarrage** :
  - Sélecteur date (par défaut = prochain jour assigné au programme)
  - Aperçu de la 1re séance ("1re séance · Push · Pec & Triceps")
  - 3 boutons rapides : Aujourd'hui · Demain · Lundi prochain
- **Toggles** :
  - Notifications de rappel (avec heure / jours configurables)
  - Reset des PR de référence (repartir des perfs actuelles comme baseline)
- **CTA** : "Activer maintenant" (accent) + "Annuler"

**Action** : à la confirmation
1. Marque l'ancien programme `isActive=false`, `archivedAt=now`
2. Crée le nouveau avec `startedAt`, `isActive=true`
3. Génère les WorkoutTemplates pour la durée
4. Planifie les notifications locales pour les jours d'entraînement
5. Naviguer vers Dashboard

#### Aperçu séance du jour

Écran intermédiaire entre Dashboard et Session active. Optionnel — accessible depuis le CTA "Démarrer" du Dashboard. L'utilisateur peut le passer (réglage dans Préférences).

- **Hero accent** : tag muscle, position dans le programme (jour X · séance Y/total), nom, 4 métriques (exos, sets, volume estimé, durée estimée)
- **Comparaison vs dernière fois** : grille 3 colonnes avec exos principaux et progression de poids ("80 → 82,5 kg")
- **Liste exercices détaillée** : numéro/lettre superset, nom, séries × reps target, poids cible, RPE
- **Actions secondaires** : Personnaliser (ajouter/retirer/échanger un exo pour cette séance uniquement) · Reporter (à demain)
- **CTA bas** : "Commencer" avec durée estimée à droite

**Note** : les "poids cibles" sont calculés à partir de la dernière session + règles de progression auto définies dans le template (e.g. +2.5 kg si reps_max atteintes la fois précédente).

#### Briefing pré-séance (optionnel)

Écran de transition juste avant l'ouverture de la modale Session active. Désactivable dans Préférences.

- Status bar visible (vraie heure)
- **Top bar** : bouton fermer + label "PRÊT À COMMENCER"
- **Tag + titre** de la séance
- **Matériel requis** (carte) : liste chips des équipements (banc, barre, haltères range, poulie, etc.) — auto-extrait des exercices
- **Échauffement suggéré** (carte) : checklist d'exercices d'échauffement personnalisés (cardio léger, mobilité, échauffement spécifique avec les poids de la 1re série)
- **Focus 1re série** : carte avec contraste fort montrant l'exercice, le poids cible et la plage de reps en très grand, plus les notes/instructions
- **CTA primaire massive** : "C'est parti" (accent, ~20px padding)
- **Lien secondaire** : "Passer l'échauffement"

**Génération auto de l'échauffement** :
- Cardio 3 min systématique
- Mobilité ciblée selon les groupes musculaires de la séance
- Ramp-up sets du 1er exercice composé : barre vide × 12, puis 50% × 8, puis 70% × 5 avant la série de travail

---

### 6.15 Workflow Exécution de séance (in-session + post-session)

Complémentaire à **6.2 Session active**. Ces écrans cadencent l'expérience pendant et juste après la séance.

#### Vue d'ensemble in-session (sheet)

Sheet glissable depuis le haut de la modale Session, pour zoom-out sur l'ensemble de la séance.

- Drag handle + bouton fermer
- Bandeau progression : X/Y séries faites · durée · volume cumulé
- **Liste de tous les exercices** avec :
  - Numéro ou lettre de superset
  - Nom de l'exercice
  - Badge **PR** si nouveau record déjà battu sur cette séance
  - Compteur sets faits / target
  - Mini-barres latérales (1 par série) — remplies en accent quand validées
  - L'exo actif est mis en évidence (fond accent)
- **Ajouter un exercice** (renvoie au Picker en mode in-session — ne modifie pas le template du programme)
- Actions bas de sheet : Réorganiser · Notes · **Terminer** (rouge, danger)

**Comportements**
- Tap sur un exercice futur → saute à cet exo (skip)
- Tap sur un exo fait → édition des séries
- Drag : changer l'ordre. Si l'exercice était lié à un superset, demander confirmation pour casser le lien

#### Célébration PR (overlay plein écran)

Déclenchée à la validation d'une série qui bat le 1RM estimé sur l'exercice.

- Backdrop semi-opaque sur l'écran de session
- Confettis statiques (12-20 points + 4 streamers) — pas d'animation requise pour MVP (CSS keyframes acceptables phase 2)
- Trophée centré dans un halo accent
- Tag "NOUVEAU RECORD" + nom de l'exercice (gros)
- Encadré central : poids × reps en très grand (60-70px, mono, accent)
- Grille 2 tuiles : précédent vs nouveau 1RM estimé (avec delta)
- Bandeau motivationnel : "X<sup>e</sup> PR de l'année · plus que Y kg avant ton objectif Z"
- CTA primaire "Continuer la séance" + lien secondaire "Partager"

**Trigger** : à chaque set validé qui établit un nouveau record sur ANY type (1RM estimé OU rep PR à un poids donné OU volume set PR). 1 overlay max par série. Limité à 1 overlay par exercice par séance (sinon trop intrusif).

**Désactivable** dans Préférences → "Notifications PR · pendant la séance".

#### Séance terminée (celebration)

Déclenché automatiquement quand toutes les séries planifiées sont validées, OU manuellement via "Terminer".

- Halo accent + check géant
- Eyebrow "SÉANCE TERMINÉE" + titre "Beau boulot." (ou variation, voir copywriting)
- Sous-titre : nom de la séance + position dans le programme
- **Durée totale** en très grand (mono, ~56px)
- 3 tuiles : Séries (X/Y), Volume total, Nombre de PR
- Bannière PR si ≥1 record battu (avec détail)
- Bandeau streak (jours d'affilée actualisé)
- Actions : "Voir le récap détaillé" (primaire) · Partager · Accueil

**Sauvegarde** : à l'arrivée sur cet écran, la Session est déjà persistée. Cet écran consume les données déjà committées.

#### Récap détaillé

Vue post-séance complète, accessible depuis "Voir le récap détaillé" OU depuis l'Historique.

- Header avec date + plage horaire (18:32 → 19:30) + bouton partager
- Carte titre accent (programme/jour/semaine)
- **3 tuiles comparatives** : Volume / Durée / RPE moyen avec delta vs séance équivalente précédente
- **Card PR** (s'il y en a) — borderée accent
- **Distribution volume par groupe musculaire** : barre segmentée + légende avec pourcentages
- **Détail exercice par exercice** : chaque carte avec
  - Nom (+ lettre superset si applicable)
  - Total tonnage de l'exo
  - Chaque série en chip (poids × reps, séries PR en accent avec icône trophée)
- **Notes** (éditables) : textarea pour commentaires post-séance
- **Card prochaine séance** : aperçu de la prochaine occurrence du programme (jour, type) — CTA navigation

**Partage** (CTA en haut + dans T3) : génère un visuel exportable (PNG 1080×1080 ou story 1080×1920) avec les chiffres clés. Phase 1 : copier-coller texte ; phase 2 : génération image native.

---

### 6.16 Workflow Création d'exercice perso avec import média

L'utilisateur peut créer ses propres exercices (variations, exos spécifiques de coach) et **y attacher un média visuel personnel** (photo, GIF ou vidéo) pour avoir une démo sous les yeux pendant la séance.

#### Mes exercices (bibliothèque)

Hub de gestion des exercices personnels — accessible depuis :
- Profil → Bibliothèque
- Picker exercice (filtre "Mes exercices")

Contenu :
- Header avec back + search
- Carte CTA "Créer un exercice" (accent)
- 3 tuiles stats : nombre persos · nombre biblio totale · favoris
- Filtres chips : Tous · Pecs · Dos · Jambes · **Avec média** (filtre dédié)
- Liste exercices personnels avec :
  - Vignette 52×52 : si média, gradient ou première frame ; badge "GIF" si gif
  - Nom · groupe muscle · équipement · compteur d'usage

#### Form de création

- Top bar : ✕ · Titre "Exercice perso" · CTA Sauver (désactivé tant que name + primaryMuscle absents)
- **Slot média en haut** (dashed border accent, aspect 4:3) : grand bouton "+" central avec label "Ajouter une démo visuelle" + sous-texte "Photo, GIF ou vidéo depuis ton téléphone — visible pendant tes séances" + ligne de 4 mini-icônes (image/gif/vidéo/caméra) pour suggérer les options
- Champ **Nom** (border accent quand focus)
- Champ **Groupe musculaire principal*** (tap → muscle picker plein écran avec illustration corps + tap zones)
- Champ **Groupes secondaires** (chips multi-sélection)
- Row Équipement + Catégorie (compound/isolation) côte à côte
- **Type de mesure** segmented : `Poids × Reps` / `Reps seules` / `Temps` (corps poids ou isométrique)
- **Instructions** : textarea libre

#### Source média (bottom sheet)

Affichée au tap sur le slot média.

Options :
1. **Photothèque** (recommandé, badge "RECO" en accent) — déclenche `<input type="file" accept="image/*,video/*">` qui ouvre le picker système natif sur mobile (PHPicker iOS / Photo Picker Android). Pas de permission à gérer côté app, le navigateur s'en charge.
2. **GIFs** — `<input type="file" accept="image/gif">` pour filtrer
3. **Vidéos** — `<input type="file" accept="video/*">`, max 30 s, converties en GIF côté client
4. **Prendre maintenant** — `<input type="file" accept="image/*,video/*" capture="environment">` ouvre la caméra directement sur mobile
5. **Fichiers** — `<input type="file">` sans filtre (accès aux fichiers locaux)

**Note privacy** en bas : "🔒 Les médias restent dans ton navigateur (IndexedDB local). Aucun upload, aucune synchronisation cloud par défaut."

Bouton "Annuler" en bas.

**Permissions web** : aucun manifest spécial requis. Pour la caméra (option 4) avec `capture="environment"`, le navigateur demande l'autorisation au premier usage. Sur iOS Safari < 14, fallback : galerie uniquement.

#### Galerie interne (picker)

**Note** : sur web, on délègue toujours au picker système natif via `<input type="file">`. Le picker custom décrit ci-dessous est réservé à une **réutilisation interne** : si l'utilisateur a déjà importé des médias dans Gym Track (pour d'autres exercices), on lui permet de les réutiliser via cet écran sans repasser par le file input.

- Top bar : ✕ · "X sélectionné" · Album dropdown (Tous médias / Par exercice)
- Segmented filtre type : Tout (24) / Photos (15) / GIFs (8) / Vidéos (1) — chiffres = médias déjà dans IndexedDB
- Sections par date d'import
- Grid 3 colonnes carrées
- Sélection : cercle vide → cercle accent avec ✓
- CTA bas sticky "Suivant"

**Phase 1 MVP** : skip cet écran, on va directement du file input au cropper. Cet écran arrive en phase 2 quand l'utilisateur commence à avoir une bibliothèque média.

#### Éditeur (crop + trim)

Affiché après sélection d'un média.

- Top bar : back · "Cadrer & ajuster" · CTA OK (accent)
- **Preview** aspect 4:3 avec :
  - Cadre de crop en blanc avec poignées accent aux 4 coins
  - Grille rule-of-thirds
  - Backdrop sombre autour du crop
  - Badge "GIF · 1.2 s" haut gauche si applicable
- **Cadrage** : 5 ratios (1:1, 4:3, 16:9, 9:16, Libre) en segmented avec icônes proportionnelles
- **Découper** (si gif/vidéo) : timeline avec frames en mini, poignées accent gauche/droite, plage en mono "0.3 — 1.5 s", durée totale en bas
- Toggles :
  - Boucle infinie (gif uniquement)
  - Compresser pour stockage (auto on, avec info "~480p · 1.4 MB après réduction")
  - Miroir horizontal
- Footer info fichier : "IMG_2734.GIF · 4.2 MB → 1.4 MB" (taille originale → finale)

**À la validation** :
1. Appliquer crop côté client via **react-image-crop** ou Canvas API
2. Si vidéo → convertir en GIF via **ffmpeg.wasm** (lazy-load uniquement quand vidéo détectée ; ~25 MB de wasm)
   - Paramètres : résolution max 480p, durée max 5s, framerate ≤24
   - Alternative légère : **gifshot.js** pour conversion basique sans wasm
3. Si > 30s vidéo source → erreur "Vidéo trop longue (max 30 s)"
4. Sauvegarder le Blob final dans IndexedDB (table `exerciseMedia` + table `blobs`)
5. Générer thumbnail (première frame en JPG 200×200) via Canvas
6. Hydrater `ExerciseMedia` et naviguer back vers le form
7. Slot média affiche maintenant la preview via `URL.createObjectURL(blob)` + bouton "Modifier" / "Remplacer"

**Important** : `URL.revokeObjectURL()` au unmount des composants pour éviter les fuites mémoire.

**Quotas** :
- Taille max par média : 5 MB après compression (sinon avertir)
- Stockage total : warn si > 200 MB de médias exercices
- Format de sortie : GIF (animé) ou JPG (photo) — JAMAIS de MP4 dans la DB locale pour rester simple

#### Utilisation du média dans la séance

Pendant **Session active** (6.2), à côté du nom de l'exercice :
- Tap sur le nom de l'exercice → ouvre une mini-vue média plein largeur entre le bloc exercice et la saisie KG/REPS
- Si gif → joue en boucle automatiquement
- Si photo → affichée statique
- Tap dehors ou bouton "✕" pour replier

Aussi affiché dans :
- **Aperçu séance du jour** (S3) : mini-vignette à côté de chaque exo s'il a un média
- **Picker exercices** (G5) : vignette dans la liste
- **Mes exercices** (E1) : vignette dans la liste

---

## 7. Edge cases & règles métier

- **Validation série** : pas de validation si weight=0 ET reps=0 ; warning si reps > 30
- **PR detection** : recalculer 1RM estimé après chaque set validé ; si > max existant pour l'exo, créer PersonalRecord et flagger le Set
- **Streak** : se reset à 0 si pas de session avec ≥1 set validé dans une journée locale. Tolérance configurable (1 jour de grâce par semaine ?)
- **Repos timer en background** : continuer le décompte ; notification locale à la fin
- **Reprise après crash** : si Session.startedAt existe sans endedAt et < 12h, proposer "Reprendre la séance" au lancement de l'app
- **Programme terminé** : à la fin de `durationWeeks`, marquer `isActive=false`, proposer renouveler / changer
- **Conflit horaire** : si l'utilisateur démarre une séance manuelle alors qu'une autre est en cours, demander confirmation
- **Conversion unité** : stocker en SI (kg, cm) ; conversion à l'affichage uniquement

---

## 8. Notifications locales

| Trigger | Contenu | Condition |
|---|---|---|
| Rappel séance | "C'est l'heure du Push 💪" | Heure configurée + jour assigné au programme |
| Fin de repos | "Repos terminé · prochaine série" | Timer décompté pendant app background |
| Séance non terminée | "Tu as une séance en cours depuis 2h" | Session ouverte > 2h sans activité |
| Nouveau PR | "🎯 PR sur Développé couché — 102.5 kg × 5" | À la validation d'un set qui bat le record |
| Résumé hebdo | "Cette semaine : 4 séances · 18.4k kg" | Dimanche 19:00 |
| Streak en danger | "Ton streak de 12 jours est en jeu" | 20:00 si aucune séance dans la journée |

Toutes respectent les **horaires silencieux**.

---

## 9. Intégrations

**Apple Health / Google Fit**
- En web : pas d'accès direct. Phase 3 optionnelle : export manuel d'une séance vers Apple Health via un raccourci Shortcuts iOS (l'app expose un endpoint d'export que l'utilisateur peut router vers Health). Hors scope MVP.

**Import** : CSV format Strong / Hevy (drag-and-drop dans la page Réglages → Données). Parser côté client.

**Export** : JSON complet (download d'un blob) + CSV "à plat" des sessions/sets.

**Média exercices (photo/gif/vidéo)** : import via `<input type="file" accept="image/*,video/*">` qui déclenche le picker système natif sur mobile (PHPicker iOS / Photo Picker Android). Pas de permission à gérer en web (le navigateur la demande lui-même). Les médias sont stockés comme **Blobs dans IndexedDB** (compressés avant stockage : GIF max 480p / 5 s / 5 MB). Affichage via `URL.createObjectURL(blob)`. Inclus dans l'export JSON en base64 (option "avec médias" car ça peut être gros).

**Notifications push** : pas dans le MVP. Phase 3 : Web Push API + backend cloud (nécessite Supabase ou équivalent).

**Partage du récap (T3/T4)** : `navigator.share()` Web Share API (fonctionne sur mobile, fallback copier-coller sur desktop). Phase 2 : génération d'une image 1080×1080 via Canvas API pour partage Instagram.

---

## 10. Accessibilité

- Contrast AA min partout (WCAG 2.1 AA)
- Tous les boutons : `aria-label` explicite (ne pas se reposer sur l'icône)
- Police scalable : utiliser `rem` partout pour la typo principale
- Animations : désactiver via `@media (prefers-reduced-motion: reduce)` les confettis PR et transitions de page
- Navigation clavier : focus visible, ordre logique de tabulation
- Mode sombre auto via `prefers-color-scheme` (overridable dans Préférences)
- Lecteurs d'écran : structurer les sections avec héadings, `role` et `aria-label`. Sur Session active : `aria-live="polite"` sur le timer et le compteur de séries.

---

## 11. Performance

- **Session active** : DOIT rester fluide même avec 100+ sets dans l'historique de l'exercice. Pas de requête bloquante au validate.
- **Charts** : virtualiser au-delà de 100 points ; agréger par semaine pour vues > 6 mois.
- **Première visite (cold start)** : Lighthouse Performance > 90, FCP < 1.5s sur 4G simulée.
- **Visites suivantes (PWA installée)** : démarrage < 500ms grâce au Service Worker.
- **Bundle JS initial** : < 150 KB gzipped pour le chemin critique (Dashboard). Lazy-load les workflows (création programme, stats avancées, éditeur média).
- **Service Worker** : pré-cache l'app shell + fonts ; cache les médias d'exercices avec stratégie cache-first.
- **DB (IndexedDB)** : indexer `sessions.startedAt`, `sets.sessionExerciseId`, `personalRecords.exerciseId+achievedAt`. Requêtes async via `useLiveQuery` de Dexie pour le data-binding réactif sans re-renders inutiles.

---

## 12. Phases de livraison

**Phase 1 — MVP web (3-4 sem)**
- Scaffold Vite/Next.js + Tailwind + Dexie + Service Worker basique
- Système de design complet (tokens, primitives)
- Schéma IndexedDB + migrations + seed ~150 exercices
- CRUD exercices custom (sans média encore)
- Workflow création programme complet
- Session active avec timer + vue d'ensemble in-session
- Séance terminée + récap détaillé
- Historique + détail séance
- Stats basiques (PR + tonnage)
- Profil + Préférences
- Manifest PWA + icônes → installable sur iPhone/Android

**Phase 2 — Progression (2 sem)**
- Stats avancées (graphs 1RM Recharts, volumes par muscle)
- Goals & tracking
- Corps & mesures + photos (Blob IndexedDB)
- Notifications locales (Web Notifications API + Service Worker)
- Célébration PR (overlay in-session avec framer-motion)
- Détail programme + workflow activation

**Phase 3 — Écosystème (2 sem)**
- Import Strong/Hevy (parser CSV client-side)
- Export CSV/JSON (download Blob)
- Templates programmes built-in (5)
- **Média exercices** : import via file input + crop (react-image-crop) + trim/conversion GIF (ffmpeg.wasm lazy)
- Briefing pré-séance optionnel (échauffement généré)
- Partage récap (Web Share API + Canvas pour image)

**Phase 4 — Cloud (optionnelle, 3-4 sem)**
- Backend Supabase (auth + Postgres + Storage)
- Sync IndexedDB ↔ Postgres (last-write-wins simple)
- Multi-device
- Partage de programmes / templates communautaires

---

## 13. Mockups designés (référence visuelle)

Voir le fichier HTML `Gym Track Mobile.html` pour les mockups interactifs des **30 écrans** :

**Écrans principaux (4)**
1. Dashboard
2. Session active (interactive avec timer + steppers)
3. Historique
4. Stats / Progression

**Profil — flow (6)**
5. Profil hub
6. Compte personnel
7. Corps & mesures
8. Objectifs & programmes
9. Préférences
10. Notifications

**Création de programme — workflow (7)**
11. Bibliothèque programmes
12. Création — Méta (1/4)
13. Création — Structure semaine (2/4)
14. Création — Éditer séance
15. Création — Picker exercices
16. Création — Config exercice
17. Création — Récap (4/4)

**Choisir programme & démarrer — workflow (4)**
18. Détail du programme
19. Activation (bottom sheet)
20. Aperçu séance du jour
21. Briefing pré-séance

**Exécuter la séance — workflow (4)**
22. Vue d'ensemble in-session (sheet)
23. Célébration PR (overlay)
24. Séance terminée (celebration)
25. Récap détaillé

**Créer un exercice avec média — workflow (5)**
26. Mes exercices (bibliothèque perso)
27. Form de création
28. Source média (bottom sheet)
29. Galerie interne (picker)
30. Éditeur (crop & trim)

Tous les écrans utilisent les mêmes tokens et composants — référence d'implémentation directe.

---

## 14. Livrables attendus

- Application web déployée (Vercel / Cloudflare Pages) sur un sous-domaine ou domaine custom
- PWA installable : manifest + icônes (192, 512, maskable) + Service Worker pré-cache de l'app shell
- Code source dans un repo Git avec README, instructions de développement local (`pnpm install && pnpm dev`), scripts de seed pour les exercices
- Base de données seed : ~150 exercices de musculation classiques (JSON embarqué, chargé dans IndexedDB au premier lancement)
- Tests : Vitest sur la logique métier (1RM, PR detection, streak), Playwright sur 1-2 flows critiques (création programme, séance complète de bout en bout)
- Documentation : architecture, schéma IndexedDB, conventions de code, comment déployer
- Score Lighthouse > 90 sur Performance, PWA, Accessibility, Best Practices (testé sur le Dashboard et la Session active)

---

*Fin du cahier des charges. Pour toute ambiguïté : se référer aux mockups HTML qui font foi sur le visuel et les interactions.*
