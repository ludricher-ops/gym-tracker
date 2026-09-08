# Contribuer à Gym Track

Guide pour développer à deux sur ce projet sans casser la production.

Le dépôt est `ludricher-ops/gym-tracker`. La branche `main` est déployée
automatiquement sur Railway : **tout ce qui arrive sur `main` part en prod dans
la minute**, sur l'app réellement utilisée pendant les séances.

---

## 1. Installation (5 minutes)

**Prérequis** : [Node.js](https://nodejs.org) 20 ou plus récent, et Git.

```bash
git clone https://github.com/ludricher-ops/gym-tracker.git
cd gym-tracker
npm install
npm run dev
```

L'app tourne sur http://localhost:5173.

**Aucune base de données n'est nécessaire.** L'app est *local-first* : toutes
les données vivent dans IndexedDB, dans le navigateur. PostgreSQL ne sert qu'à
la sauvegarde et à la synchro multi-appareils, et la synchro est simplement
inactive en local.

Pas besoin non plus de fichier `.env` pour démarrer. Si tu en crées un (copie de
`.env.example`), il est ignoré par Git — **ne jamais commiter de secret**.

### Vérifier que tout marche

```bash
npm test        # 585 tests unitaires, doivent tous passer
npm run build   # doit produire dist/ sans erreur
```

---

## 2. Le workflow, étape par étape

Personne ne pousse directement sur `main` — la branche est protégée sur GitHub.
Tout passe par une Pull Request relue par Ludo.

```bash
# 1. Partir d'un main à jour
git checkout main
git pull

# 2. Créer une branche
git checkout -b feat/nom-de-la-fonctionnalite

# 3. Développer, commiter au fil de l'eau
git add -A
git commit -m "feat(sessions): ajoute le tri par date"

# 4. Vérifier AVANT de pousser
npm test
npm run build

# 5. Pousser et ouvrir la PR
git push -u origin feat/nom-de-la-fonctionnalite
gh pr create           # ou via l'interface GitHub
```

La CI GitHub Actions rejoue `npm test` et `npm run build` sur la PR. Une PR
rouge n'est pas mergeable.

Une fois la PR mergée par Ludo, Railway redéploie tout seul.

### Conventions de nommage

| Préfixe de branche | Usage |
|---|---|
| `feat/…` | nouvelle fonctionnalité |
| `fix/…` | correction de bug |
| `refactor/…` | réorganisation sans changement de comportement |
| `docs/…` | documentation seule |

Messages de commit : `type(scope): description à l'impératif`, en anglais.
Exemples : `fix(sync): avoid overwriting local edits`, `feat(pr): detect 1RM records`.

### Taille des PR

Une PR = un sujet. Une PR de 200 lignes se relit en 10 minutes ; une PR de 2000
lignes ne se relit pas et finit par être mergée sans vraie revue — c'est comme
ça que la prod casse.

---

## 3. Les règles qui protègent la prod

### 3.1 Ne jamais toucher à la base de production

La `DATABASE_URL` Railway ne quitte pas le dashboard de Ludo. Aucun script, aucun
test, aucune migration ne doit pointer dessus depuis un poste de dev. Les tables
se créent seules au démarrage du serveur (`CREATE TABLE IF NOT EXISTS`) : il n'y
a rien à provisionner à la main.

### 3.2 IndexedDB : le vrai point de fragilité

La source de vérité, ce sont les données dans le navigateur du téléphone. Un
mauvais changement de schéma IDB peut effacer un historique d'entraînement
irrécupérable.

- `DB_VERSION` est dans `src/db/schema.ts` (actuellement `4`). L'incrémenter
  déclenche `onupgradeneeded` **chez tous les utilisateurs**.
- Une migration doit être **additive** : ajouter un store ou un index, jamais
  supprimer ni renommer un store existant, jamais réécrire des enregistrements
  en masse.
- Toute PR qui touche `src/db/` doit le dire explicitement dans sa description.
- Tester une migration en conditions réelles : ouvrir l'app avec l'ancienne
  version, créer des données, puis charger la nouvelle version et vérifier que
  tout est encore là.

### 3.3 Synchronisation

- `src/db/sync.ts` : **push avant pull**, toujours. Inverser l'ordre écrase des
  données locales pas encore envoyées.
- Le last-write-wins repose sur `updatedAt` — ne pas fabriquer de timestamps à
  la main.
- Toute écriture applicative passe par `repo.save` / `repo.remove`
  (`src/db/repo.ts`). `idbPut` court-circuite l'outbox et n'est réservé qu'aux
  données descendantes du serveur.

### 3.4 Schéma PostgreSQL

Même règle que pour IDB : **additif uniquement**. Ajouter une colonne nullable,
oui. Renommer ou supprimer une colonne, non — pendant le redéploiement l'ancien
code tourne encore quelques secondes contre le nouveau schéma.

### 3.5 Conventions de code

Lire [CLAUDE.md](CLAUDE.md) avant la première PR : il contient les pièges
connus (transactions IDB qui se ferment sur un `await`, navigation maison sans
routeur, tokens CSS obligatoires, règles TypeScript strictes). C'est le document
de référence technique.

---

## 4. Checklist avant d'ouvrir une PR

- [ ] `npm test` passe
- [ ] `npm run build` passe
- [ ] Pas de `console.log` de debug oublié
- [ ] Pas de secret, de token ni d'URL de base de données dans le diff
- [ ] Si `src/db/` est touché : la description de la PR explique l'impact sur les
      données existantes
- [ ] Si le design change : les tokens CSS de `src/index.css` sont utilisés,
      aucune valeur en dur

---

## 5. En cas de casse en production

1. **Rollback immédiat** : Railway → projet `gym-tracker` → onglet *Deployments*
   → dernier déploiement sain → **Redeploy**. Environ 30 secondes.
2. Ensuite seulement, corriger à froid : `git revert <sha>` sur une branche, PR,
   merge.

Ne jamais « corriger en urgence » par un push direct sur `main` : c'est le
scénario qui transforme un bug en panne.

Le rollback est de la responsabilité de Ludo (seul accès Railway).

---

## 6. Qui fait quoi

| | Ludo | Contributeur |
|---|---|---|
| Accès GitHub | Admin | Write |
| Accès Railway | Oui | Non |
| Merge sur `main` | Oui | Non |
| Ouvrir des PR | Oui | Oui |
| Rollback prod | Oui | Non |
