# Prompt de démarrage pour Claude Code

Copie-colle le bloc ci-dessous dans ta session Claude Code après avoir placé les fichiers du dossier `handoff/` à la racine de ton projet vide.

---

```
Tu vas développer "Gym Track", une application mobile de suivi de séances de musculation.

## Inputs fournis (dans le dossier de référence ./design/)

1. `CAHIER-DES-CHARGES.md` — spécification fonctionnelle et technique complète.
   Lis-le INTÉGRALEMENT avant de commencer. Il contient :
   - Stack technique recommandée
   - Modèle de données complet (tables + types + index)
   - Système de design (tokens, typo, composants)
   - Navigation
   - 6 workflows détaillés écran par écran (30 écrans au total)
   - Edge cases, notifications, intégrations, accessibilité
   - Phases de livraison

2. `Gym Track Mobile (mockups).html` — mockups visuels interactifs des 30 écrans,
   organisés en 6 sections dans un canvas pan/zoom :
   - Écrans principaux (Dashboard, Session active, Historique, Stats)
   - Profil (6 écrans)
   - Création de programme (7 écrans)
   - Choisir programme & démarrer (4 écrans)
   - Exécuter la séance (4 écrans)
   - Créer un exercice avec média (5 écrans)

   Ouvre-le dans un navigateur pour voir le rendu exact attendu. Les couleurs, espacements,
   typo, comportements interactifs (timer de session, steppers, etc.) font foi.

## Stack imposée

- React Native + Expo (TypeScript)
- SQLite via Drizzle ORM pour la persistance locale
- Zustand pour l'état global UI
- React Navigation (stack + bottom tabs)
- Expo Notifications (locales uniquement)
- react-native-svg pour les charts
- expo-image-picker + expo-media-library pour l'import média
- expo-image-manipulator + ffmpeg-kit-react-native pour crop/trim/conversion GIF

## Méthode de travail

1. Commence par créer la structure du projet Expo et installer les dépendances.
2. Implémente le **système de design** d'abord (tokens, primitives : Card, Pill, TabBar,
   Row, Switch, Segmented, Stepper, PrimaryBar). Référence-toi à `screens.jsx` source
   pour les valeurs exactes (oklch, sizes, paddings).
3. Crée le schéma DB Drizzle complet avec migrations + un seed de ~150 exercices classiques.
4. Implémente la navigation root (tabs + stacks).
5. Développe écran par écran en suivant l'ordre des phases de livraison du cahier des charges.
6. Pour chaque écran : implémente la logique métier (pas seulement le visuel), connecte à la DB,
   gère les états vides / loading / erreur.
7. Écris des tests unitaires sur la logique métier critique (calcul 1RM, détection PR, streak).

## Règles strictes

- **Pixel fidelity** : respecte les valeurs exactes des mockups (couleurs oklch, radius,
  paddings, font weights). Ne réinvente pas la roue visuelle.
- **Tokens** : ne hardcode jamais de couleur ou size — tout passe par le thème.
- **Hors-ligne first** : aucun appel réseau dans le MVP. Tout est local SQLite.
- **i18n FR/EN** : prépare la structure i18n dès le début même si seul le FR est rempli.
- **Tests** : minimum 70% de couverture sur la logique métier.
- **Performance** : la modale Session active doit rester fluide avec 100+ sets historiques.
  Pas de requête bloquante au validate.

## Premier livrable attendu

Phase 1 du cahier des charges (MVP, 4-6 semaines) — buildable sur TestFlight iOS :
- Auth locale
- CRUD exercices custom (sans média encore)
- Workflow création programme complet
- Session active avec timer + vue d'ensemble in-session
- Séance terminée + récap détaillé
- Historique + détail séance
- Stats basiques (PR + tonnage)
- Profil + Préférences

Pose-moi toutes les questions nécessaires AVANT de coder une ligne.
Commence par : (1) lire le cahier des charges en entier, (2) ouvrir le HTML mockup,
(3) me lister les ambiguïtés ou décisions techniques à valider.
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
   puis commencer à scaffolder le projet Expo.

### Option B — Claude.ai web avec connecteur GitHub

1. Crée un repo GitHub vide.
2. Push le dossier `design/` (avec le cahier + le HTML).
3. Dans Claude.ai web, ouvre une nouvelle conversation avec le connecteur GitHub activé.
4. Colle le prompt en spécifiant le repo.

### Option C — En l'absence d'outil dev

Tu peux aussi simplement ouvrir un chat Claude classique, attacher le cahier des charges
en pièce jointe, et copier-coller le prompt. Tu obtiendras du code par chunks mais sans
l'autonomie de Claude Code pour scaffolder et tester.

---

## Ce que Claude Code va probablement te demander en retour

Anticipe ces questions pour gagner du temps :

1. **Nom d'app + bundle identifier** (ex. `com.leomercier.gymtrack`)
2. **Distribution** : TestFlight only, App Store public, ou Expo Go pendant le dev ?
3. **Apple Developer account** : as-tu un compte développeur Apple (99$/an) pour publier ?
4. **Compte Expo / EAS Build** : prêt à payer EAS pour les builds cloud, ou builds locaux ?
5. **Backend cloud à terme** : oui/non ? (impacte les choix d'architecture dès le début)
6. **Public visé** : francophones uniquement au lancement, ou multi-langues dès le MVP ?
7. **Authentification** : 100% local au début, ou tu veux Sign in with Apple dès la v1 ?
8. **Apple Health** : prioritaire ou phase 3 OK ?
9. **Données d'exercices** : tu as une source à toi (CSV) ou Claude Code génère le seed
   à partir d'une base publique ?

---

## Conseils pratiques

- **Versionne tout dès le début** : `git init` avant la première commande, push régulièrement.
- **Une feature, un PR** : demande à Claude Code de travailler par PR pour pouvoir review.
- **Le HTML mockup est ta référence absolue** : à chaque écran codé, ouvre le mockup
  correspondant côte à côte et compare. Si Claude Code dévie visuellement, redirige-le.
- **Garde le cahier des charges sous la main** : si Claude Code propose une fonctionnalité
  qui n'est pas dedans, demande-toi si elle vaut la peine d'être ajoutée ou si c'est du
  scope creep.
- **Test sur device tôt** : dès que tu as l'écran Dashboard qui tourne, installe sur ton
  iPhone via TestFlight ou Expo Go. Tu sentiras tout de suite ce qui marche ou pas.
- **Itère sur le design via le mockup** : si pendant le dev tu veux changer un écran,
  reviens vers moi pour modifier le mockup → re-déploie → re-spec.

---

Bon dev. Si tu bloques sur un point, reviens ici avec la question — je peux affiner le
cahier des charges, ajouter des mockups manquants, ou clarifier un comportement.
