# CLAUDE.md — Gym Track

App web de suivi de séances de musculation. Mono-utilisateur, sans
authentification, **local-first** (utilisable hors-ligne pendant une séance).

## Stack

- **Frontend** : React 18 + Vite + TypeScript
- **Backend** : Express (`server.js`) — sert le bundle + endpoints de synchro
- **Persistance** : IndexedDB (source de vérité) ; PostgreSQL côté serveur = miroir
- **Déploiement** : Railway via `git push origin main`

## Workflow

```
npm run dev        # serveur Vite (frontend) — fonctionne sans base
npm run build      # compile dans dist/  (gate avant tout push)
npm run typecheck  # tsc --noEmit
npm test           # Vitest — logique métier dans src/utils/
npm run lint       # ESLint
git push origin main   # Railway redéploie
```

Il n'y a pas de serveur de dev pour la prod : `npm run build` valide, puis push.
Le serveur Express ne tourne en local que si `DATABASE_URL` est défini ; sans
base, l'app reste 100 % fonctionnelle (la synchro est simplement désactivée).

## Architecture local-first

- **IndexedDB est la source de vérité.** Toute lecture/écriture passe par
  `src/db/repo.ts`. Chaque écriture (`repo.save`/`repo.remove`) met à jour
  l'entité **et** ajoute une entrée à l'`outbox` dans la **même transaction
  IndexedDB**.
- ⚠️ Une transaction IndexedDB se ferme au premier `await` d'une promesse
  non-IDB. La fonction passée à `idbTx` (`src/db/idb.ts`) **doit rester
  synchrone**. C'est la zone de bug n°1.
- **Synchro** (`src/db/sync.ts`) : `push` draine l'outbox, `pull` fusionne en
  last-write-wins sur `updatedAt`. Le serveur (`sync_records`, table JSONB
  générique) est un simple miroir. Le curseur de pull est en `localStorage`
  (spécifique appareil), jamais dans `settings`.
- **Store React** (`src/hooks/useStore.tsx`) : charge tous les stores en
  mémoire au démarrage, expose des mutateurs optimistes.

## Conventions

- `"type": "module"` partout. Fichiers serveur en `.js`, frontend en `.ts/.tsx`.
- Données stockées en SI : poids en **kg**, longueurs en **cm**. Conversion à
  l'affichage uniquement (`src/utils/units.ts`).
- Pas de routeur : navigation maison typée (`src/nav/`). Ajouter un écran =
  l'inscrire dans `ScreenName` (navigation.ts) + `SCREENS` (screenRegistry.tsx).
- Tokens de design en variables CSS (`src/index.css`) ; jamais de couleur en dur.
- `pg` ne gère pas plusieurs instructions par `query()` — un `CREATE TABLE` par
  appel.

## Structure

```
server.js              Express : statique + /api/sync + /api/health
src/db/                idb · schema · repo · sync · seed
src/hooks/             useStore · useSettings · useSync · useTheme · timers
src/nav/               navigation · useNavigation · screenRegistry
src/components/ui/     primitives (Card, Row, Stepper, Sheet, Modal…)
src/components/screens/ écrans (~22)
src/utils/             logique métier pure + tests Vitest associés
scripts/migrate-old-data.mjs   migration depuis l'ancien projet gymtracker
```

## Périmètre

Phase 1 (MVP) livrée. Hors périmètre, non bloqué par l'architecture : overlay
de célébration PR, mesures corporelles, objectifs, notifications, médias
d'exercices, import/export CSV, graphiques avancés.
