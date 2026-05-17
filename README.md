# Gym Track

Application web de suivi de séances de musculation — création de programmes,
exécution de séances série par série, suivi de la progression. Mono-utilisateur,
**local-first** : entièrement utilisable hors-ligne pendant une séance.

## Démarrage

```bash
npm install
npm run dev      # http://localhost:5173
```

L'app fonctionne sans base de données : toutes les données vivent dans
IndexedDB. La base PostgreSQL n'est utilisée que pour la sauvegarde et la
synchronisation multi-appareils.

## Scripts

| Commande | Rôle |
|----------|------|
| `npm run dev` | Serveur de développement Vite |
| `npm run build` | Build de production dans `dist/` |
| `npm start` | Serveur Express (sert `dist/` + API de synchro) |
| `npm test` | Tests unitaires (Vitest) sur la logique métier |
| `npm run typecheck` | Vérification TypeScript |
| `npm run lint` | ESLint |

## Déploiement (Railway)

`git push origin main` → Railway exécute `npm ci && npm run build`, puis
`node server.js`. Variables : `DATABASE_URL` (PostgreSQL), `PORT`.

## Architecture

- **IndexedDB** est la source de vérité côté client.
- Le backend Express expose une table `sync_records` générique ; la
  synchronisation applique un *last-write-wins* sur `updatedAt`.
- PWA installable, coquille d'app disponible hors-ligne.

Détails techniques et conventions : voir [CLAUDE.md](CLAUDE.md).

## Migration depuis l'ancien projet

`scripts/migrate-old-data.mjs` convertit les données de l'ancienne PWA
`gymtracker` vers le nouveau modèle :

```bash
OLD_DATABASE_URL=... NEW_DATABASE_URL=... node scripts/migrate-old-data.mjs --commit
```

## Tests

La logique métier (`src/utils/`) est couverte par Vitest : estimation du 1RM,
détection de records, streak, progression automatique, échauffement, stats
hebdomadaires, conversions d'unités, dates.

## Spécification

Le cahier des charges fonctionnel et les maquettes sont dans `design/`.
