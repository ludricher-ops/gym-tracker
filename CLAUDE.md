# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

React 18 + Vite + TypeScript PWA, mono-utilisateur, local-first. Express sert le bundle et les endpoints de synchro. IndexedDB est la source de vérité ; PostgreSQL (Railway) est un miroir.

## Commandes essentielles

```bash
npm run dev          # dev Vite frontend (sans base de données)
npm run build        # compile dist/ — obligatoire avant tout push
npm run typecheck    # tsc --noEmit
npm test             # Vitest (run once)
npm run test:watch   # Vitest en watch
npm run lint         # ESLint
git push origin main # Railway redéploie automatiquement
```

**Lancer un seul fichier de test :**
```bash
npm test -- tests/programSchedule.test.ts
```

Il n'y a pas de serveur de dev pour la prod. Le workflow est toujours : `npm run build` → `git push`.

## Architecture locale-first — règles critiques

### IndexedDB

- `src/db/idb.ts` expose les primitives IDB : `idbTx`, `idbGet`, `idbGetAll`, `idbBatchGet`, `idbPut`, `idbDelete`.
- ⚠️ **Une transaction IDB se ferme au premier `await` d'une promesse non-IDB.** Le callback passé à `idbTx` doit être synchrone. C'est le bug n°1 historique.
- Pour lire N clés en une seule transaction : utiliser `idbBatchGet(store, ids)` au lieu de N `idbGet` séquentiels.
- `idbPut` bypasse le store React et l'outbox — utiliser uniquement pour les données venant du serveur (pull).

### Repo et outbox

- Toute écriture applicative passe par `src/db/repo.ts` → `repo.save` / `repo.remove`.
- Chaque appel stampe `updatedAt: Date.now()` et ajoute une entrée à l'outbox **dans la même transaction** — atomique.
- Le store React (`src/hooks/useStore.tsx`) charge tout en mémoire au démarrage et expose des mutateurs optimistes.

### Synchronisation

- `src/db/sync.ts` : **push avant pull** (`syncNow` appelle `pushOutbox` puis `pullChanges`). L'ordre est critique pour éviter d'écraser des données locales non encore poussées.
- `pullChanges` regroupe les records par store et fait des batch reads (`idbBatchGet`) + batch writes (`idbTx`) — une transaction par store, pas N×2.
- LWW : on n'écrase que si `record.updatedAt > local.updatedAt`.
- Le curseur de pull est en `localStorage` (appareil-spécifique), jamais dans `settings`.

### Auth sync (optionnelle)

Définir `SYNC_SECRET` (serveur Railway) et `VITE_SYNC_SECRET` (build Vite) avec la même valeur pour activer l'authentification Bearer sur les routes `/api/sync/*`. Sans ces variables, tout fonctionne sans auth (utile en dev local).

## Navigation

Pas de routeur : navigation maison typée dans `src/nav/`.

- **Ajouter un écran** : inscrire dans `ScreenName` (`navigation.ts`) + `SCREENS` (`screenRegistry.tsx`).
- **Params** : `params?: Record<string, unknown>` — toujours utiliser `typeof params?.x === 'string' ? params.x : undefined` pour lire les params, **jamais** `params?.x as string`.
- **Modale session** : `nav.modal.params?.sessionId` avec guard `typeof … === 'string'` avant de monter `SessionModal`.

## Séances actives

`src/hooks/useActiveSession.ts` dérive l'état de la séance en cours depuis les collections du store. Points clés :

- `exIndex` est initialisé via lazy `useState(() => …)` pour résister aux remontages de la modale.
- `validateSet` a un verrou `isValidating.current` pour empêcher les doubles validations (double-tap).
- Rotation superset : `nextSupersetIndex` (`src/utils/superset.ts`) — fonction pure testée.
- Repos 0 s : le timer ne démarre pas si `restSec === 0`.

## Planning de programme

`src/utils/programSchedule.ts` — logique pure testée dans `tests/programSchedule.test.ts` :

- `generateSchedule(program, workoutTemplates)` → `ScheduledSession[]` triés par date croissante.
- `scheduleCard(schedule, completedSessions, now)` → carte du dashboard (6 types : `scheduled`, `done_today`, `done_early`, `missed`, `early`, `rest_done`).
- **Important** : passer uniquement les sessions du programme actif (`s.programId === activeProgram.id`) à `scheduleCard` pour éviter les collisions de labels entre deux runs du même programme.
- `missedSession` = la plus **ancienne** session non faite (index 0 du tableau trié croissant).

## Design system

Tokens CSS dans `src/index.css` — **jamais de valeur en dur** dans les composants.

Tokens typographiques : `--fs-display` (30px), `--fs-title` (23px), `--fs-body` (14px), `--fs-caption` (12px), `--fs-eyebrow` (10.5px).

Tokens de couleur spéciaux : `--overlay-dim`, `--overlay-dark`, `--toggle-thumb`, `--danger-ink`.

Classes de texte : `.t-display`, `.t-title`, `.t-body`, `.t-caption`, `.t-eyebrow`, `.t-num` (mono).

## TypeScript — règles actives

`tsconfig.json` active `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`.

- `arr[i]` retourne `T | undefined` → toujours garder ou utiliser `!` quand l'invariant est certain.
- Pour les accès d'index connus (ex. `stack[stack.length - 1]`), `!` est acceptable si la valeur ne peut pas être undefined en pratique.
- Préférer `for...of entries()` à `for (let i …)` sur des tableaux pour éviter les accès indexés.

## Tests

Tests Vitest dans `tests/`. Uniquement de la logique pure (pas de jsdom, pas d'IDB réelle).

**Fonctions pures** (`programSchedule`, `superset`, `streak`, etc.) : mock minimal — tableaux et objets en dur.

**Fonctions async avec store** (`finalizeSession`, `startSessionFromTemplate`, etc.) : mock le store avec `vi.fn()`. Voir `tests/sessionOpsAsync.test.ts` pour le patron de mock store.

**Patron de mock store** pour fonctions async :
```ts
const store = {
  sets: [...],
  set: { save: vi.fn(async (s) => s), remove: vi.fn() },
  // ...
} as unknown as StoreApi
```

## Serveur Express

`server.js` + `src/server/syncRoutes.js` (ESM `.js`). Points importants :

- `express.json({ limit: '1mb' })` global ; `/api/sync/push` applique `{ limit: '20mb' }` pour les blobs.
- Maximum 500 entrées par push batch.
- Erreurs SQL : logger côté serveur, envoyer message générique au client.
- `pg` ne supporte pas plusieurs instructions par `query()` — un `CREATE TABLE` par appel.

## PWA

- `registerType: 'prompt'` dans `vite.config.ts` — les mises à jour attendent l'accord de l'utilisateur (pas de rechargement forcé pendant une séance).
- `UpdateBanner` (`src/components/ui/UpdateBanner.tsx`) s'affiche quand un nouveau SW est disponible.
