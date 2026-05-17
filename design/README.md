# Prompt de démarrage pour Claude Code

Copie-colle le bloc ci-dessous dans ta session Claude Code après avoir placé les fichiers du dossier `handoff/` à la racine de ton projet vide, dans un sous-dossier `design/`.

---

```
Tu vas développer "Gym Track", une application web mobile-first (PWA) de suivi de séances de musculation.

## Inputs fournis (dans le dossier de référence ./design/)

1. `CAHIER-DES-CHARGES.md` — spécification fonctionnelle et technique complète.
   Lis-le INTÉGRALEMENT avant de commencer. Il contient :
   - Stack technique imposée (Vite + React + TypeScript + Tailwind + Dexie + Workbox)
   - Modèle de données complet (tables IndexedDB + types + index)
   - Système de design (tokens oklch, typo, composants)
   - Navigation
   - 6 workflows détaillés écran par écran (30 écrans au total)
   - Edge cases, notifications web, intégrations, accessibilité, performance
   - Phases de livraison

2. `Gym Track Mobile (mockups).html` — mockups visuels interactifs des 30 écrans,
   organisés en 6 sections dans un canvas pan/zoom :
   - Écrans principaux (Dashboard, Session active, Historique, Stats)
   - Profil (6 écrans)
   - Création de programme (7 écrans)
   - Choisir programme & démarrer (4 écrans)
   - Exécuter la séance (4 écrans)
   - Créer un exercice avec média (5 écrans)

   Ouvre-le dans un navigateur pour voir le rendu exact attendu. Les couleurs,
   espacements, typo, comportements interactifs (timer de session, steppers, etc.)
   font foi.

   Note : les mockups sont rendus dans un cadre iPhone à des fins de présentation,
   mais l'app cible est une PWA web mobile-first (viewport mobile 402×874 sur
   téléphone, centrée sur fond neutre sur desktop).

## Stack imposée

- **Vite + React 18 + TypeScript strict**
- **Tailwind CSS** (utilities) + CSS custom properties pour les tokens
- **Dexie.js** pour IndexedDB (persistance locale source de vérité)
- **Zustand** pour l'état global UI
- **TanStack Query** pour la couche data (cache + invalidation)
- **react-router-dom v7** pour la navigation
- **Radix UI** pour les composants accessibles (Dialog, Switch, Slider, Toast)
- **framer-motion** pour transitions et célébrations
- **Recharts** ou SVG custom pour les charts
- **vite-plugin-pwa** + **Workbox** pour le Service Worker (offline-first)
- **react-image-crop** + **ffmpeg.wasm** (lazy) pour la création d'exercice avec média
- **@fontsource/space-grotesk** + **@fontsource/jetbrains-mono** (fonts auto-hébergées)
- **Vitest** pour les tests unitaires, **Playwright** pour 1-2 E2E critiques
- **pnpm** comme package manager
- **Biome** pour linting + formatting

## Méthode de travail

1. Scaffold le projet Vite + React + TypeScript et installe les dépendances.
2. Configure Tailwind avec les tokens oklch du cahier (CSS variables pour le thème).
3. Configure vite-plugin-pwa avec manifest + Service Worker.
4. Implémente le **système de design** (primitives : Card, Pill, TabBar, Row, Switch,
   Segmented, Stepper, PrimaryBar). Référence les valeurs exactes des mockups.
5. Crée le schéma Dexie complet avec migrations + un seed JSON de ~150 exercices.
6. Implémente la navigation root (tabs + stack avec transitions slide).
7. Développe écran par écran en suivant l'ordre des phases de livraison du cahier.
8. Pour chaque écran : logique métier complète, connexion DB via `useLiveQuery`,
   gestion des états vides / loading / erreur.
9. Tests unitaires sur la logique métier (1RM, PR detection, streak).

## Règles strictes

- **Pixel fidelity** : respecte les valeurs exactes des mockups (couleurs oklch, radius,
  paddings, font weights). Ne réinvente pas la roue visuelle.
- **Tokens** : ne hardcode jamais de couleur ou size — tout passe par CSS variables.
- **Hors-ligne first** : aucun appel réseau dans le MVP. Tout est local IndexedDB +
  Service Worker.
- **Mobile-first** : design pour viewport 402px de large d'abord, dégrade
  gracieusement sur desktop (centré, fond neutre).
- **TypeScript strict** : pas de `any`, pas de `// @ts-ignore`.
- **i18n FR/EN** : prépare la structure avec `react-i18next` même si seul le FR est rempli.
- **Tests** : minimum 70% de couverture sur la logique métier.
- **Performance** : Lighthouse > 90 partout. La modale Session active doit rester
  fluide avec 100+ sets historiques.
- **PWA** : installable sur iPhone/Android, fonctionne 100% hors-ligne après 1re visite.

## Premier livrable attendu

Phase 1 du cahier des charges (MVP web, 3-4 semaines) — déployé sur Vercel/Cloudflare :
- Scaffold + design system + tokens + PWA
- Schéma IndexedDB + seed exercices
- CRUD exercices custom (sans média)
- Workflow création programme complet
- Session active avec timer + vue d'ensemble in-session
- Séance terminée + récap détaillé
- Historique + détail séance
- Stats basiques (PR + tonnage)
- Profil + Préférences
- Manifest PWA + icônes → installable

Pose-moi toutes les questions nécessaires AVANT de coder une ligne.
Commence par : (1) lire le cahier des charges en entier, (2) ouvrir le HTML mockup
dans le browser, (3) me lister les ambiguïtés ou décisions techniques à valider.
```

---

## Comment utiliser ce pack

### Option A — Claude Code en local (recommandé)

1. Crée un dossier vide sur ta machine pour le projet (ex. `~/gym-track/`).
2. Dans ce dossier, crée un sous-dossier `design/` et copies-y :
   - `CAHIER-DES-CHARGES.md`
   - `Gym Track Mobile (mockups).html`
3. Lance Claude Code dans le dossier racine.
4. Colle le prompt ci-dessus dans la première invite.
5. Claude Code va lire le cahier des charges, te poser des questions de validation,
   puis commencer à scaffolder le projet Vite.

### Option B — Claude.ai web avec connecteur GitHub

1. Crée un repo GitHub vide.
2. Push le dossier `design/` (avec le cahier + le HTML).
3. Dans Claude.ai web, ouvre une nouvelle conversation avec le connecteur GitHub activé.
4. Colle le prompt en spécifiant le repo.

### Option C — Cursor / Windsurf / autre IDE IA

Même principe : ouvre le projet vide dans l'IDE, mets les fichiers `design/`, colle le
prompt dans le chat IA. La plupart des IDE IA modernes comprennent les markdown
et HTML attachés.

---

## Ce que Claude Code va probablement te demander en retour

Anticipe ces questions pour gagner du temps :

1. **Nom de domaine** : tu en as un, ou tu veux un sous-domaine Vercel temporaire (gym-track.vercel.app) ?
2. **Hébergement** : Vercel, Cloudflare Pages, Netlify ou Fly.io ? (Vercel le plus simple)
3. **Repo Git** : monorepo, ou tout dans une seule racine ?
4. **Source des exercices** : tu as un CSV à toi (avec descriptions, muscles ciblés)
   ou Claude Code génère le seed à partir d'une base publique (ex. exercemus.com) ?
5. **Backend cloud à terme** : Supabase, ou tu restes 100% local-first et tu intègreras
   un backend plus tard si nécessaire ?
6. **Auth Sign in with Apple / Google** dès le MVP ou plus tard ?
7. **Public visé au lancement** : francophones uniquement, ou multi-langues dès le MVP ?
8. **Branding** : couleur d'accent par défaut (lime fluo / orange / autre), nom définitif ?
9. **Analytics** : Plausible / Umami / pas d'analytics au début ?

---

## Conseils pratiques

- **Versionne tout dès le début** : `git init` avant la première commande, push régulièrement.
- **Une feature, un PR** : demande à Claude Code de travailler par PR pour pouvoir review.
- **Le HTML mockup est ta référence absolue** : à chaque écran codé, ouvre le mockup
  correspondant côte à côte et compare. Si Claude Code dévie visuellement, redirige-le.
- **Garde le cahier des charges sous la main** : si Claude Code propose une fonctionnalité
  qui n'est pas dedans, demande-toi si elle vaut la peine d'être ajoutée ou si c'est du
  scope creep.
- **Test sur device tôt** : dès que tu as le Dashboard, ouvre l'URL sur ton iPhone
  Safari → "Ajouter à l'écran d'accueil" → tu vois si la PWA fonctionne comme une vraie app.
- **iOS Safari = ennemi #1** : Safari iOS limite Web Notifications (PWA installée uniquement,
  iOS 16.4+), Web Push, et certaines APIs. Teste TOUT sur iPhone, pas juste sur Chrome desktop.
- **Storage** : IndexedDB sur iOS Safari est purgé si l'utilisateur n'utilise pas
  l'app pendant 7+ jours en mode non-installé. Solution : pousser fortement l'install
  PWA dès le premier usage (sheet "Installer Gym Track"), et avoir un export JSON
  automatique périodique.
- **Itère sur le design via le mockup** : si pendant le dev tu veux changer un écran,
  reviens vers moi pour modifier le mockup → re-déploie → re-spec.

---

Bon dev. Si tu bloques sur un point, reviens ici avec la question — je peux affiner le
cahier des charges, ajouter des mockups manquants, ou clarifier un comportement.
