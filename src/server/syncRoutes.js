// Endpoints de synchronisation. Le serveur est un simple miroir : il stocke
// les enregistrements tels quels dans une table générique `sync_records` et
// applique un last-write-wins sur `updated_at`. Toutes les requêtes sont
// filtrées par user_id (extrait du JWT via le middleware extractUser).
//
// Admin (user_id = 1) : ses exercices et templates sont automatiquement
// propagés vers tous les autres users (seed LWW updated_at=1).

/** Stores autorisés (doit refléter SyncStoreName côté client). */
const ALLOWED_STORES = new Set([
  'settings', 'exercises', 'programs', 'workoutTemplates',
  'workoutExerciseTemplates', 'sessions', 'sessionExercises',
  'sets', 'personalRecords', 'goals', 'bodyMeasurements', 'blobs',
])

const PULL_LIMIT = 1000
const MAX_PUSH_BATCH = 500

/** user_id de l'administrateur — seul à pouvoir créer/modifier exercices et templates. */
const ADMIN_USER_ID = 1

/**
 * Propage les exercices de l'admin vers tous les autres users.
 * Les programmes isTemplate et leurs séances/exercices sont servis directement
 * via le pull (voir endpoint GET /api/sync/pull) — pas besoin de propagation.
 * Best-effort : appelée après le commit, les erreurs sont loggées mais non fatales.
 * LWW : updated_at = 1 → n'écrase que les enregistrements non modifiés par l'utilisateur.
 */
async function propagateAdminChanges(pool, changes) {
  const exerciseChanges = changes.filter(({ store }) => store === 'exercises')
  if (exerciseChanges.length === 0) return

  const { rows: otherUsers } = await pool.query(
    `SELECT DISTINCT user_id FROM sync_records WHERE user_id != $1`,
    [ADMIN_USER_ID],
  )
  if (otherUsers.length === 0) return
  const otherIds = otherUsers.map((r) => r.user_id)

  for (const { record } of exerciseChanges) {
    const seedData = { ...record, updatedAt: 1, dirty: true }
    const seedJson = JSON.stringify(seedData)
    for (const uid of otherIds) {
      await pool.query(
        `INSERT INTO sync_records (user_id, store, id, data, updated_at)
         VALUES ($1, 'exercises', $2, $3::jsonb, 1)
         ON CONFLICT (user_id, store, id) DO UPDATE
           SET data       = EXCLUDED.data,
               updated_at = 1,
               server_seq = nextval(pg_get_serial_sequence('sync_records', 'server_seq'))
         WHERE sync_records.updated_at = 1`,
        [uid, record.id, seedJson],
      )
    }
  }

  console.log(
    `[admin-propagation] ${exerciseChanges.length} exercice(s) → ${otherIds.length} user(s)`,
  )
}

export function registerSyncRoutes(app, pool, extractUser, requireUser) {
  // Sans base de données (dev local), la synchro est indisponible mais
  // l'app reste 100 % fonctionnelle sur IndexedDB.
  if (!pool) {
    app.all('/api/sync/*', (_req, res) =>
      res.status(503).json({ error: 'Synchronisation indisponible (pas de base)' }),
    )
    return
  }

  // POST /api/sync/push — { changes: [{ store, record }] }
  app.post('/api/sync/push', extractUser, requireUser, async (req, res) => {
    const userId = req.userId
    const changes = Array.isArray(req.body?.changes) ? req.body.changes : null
    if (!changes) return res.status(400).json({ error: 'changes[] requis' })
    if (changes.length > MAX_PUSH_BATCH)
      return res.status(413).json({ error: `Trop d'entrées (max ${MAX_PUSH_BATCH})` })

    const client = await pool.connect()
    let committed = false
    try {
      await client.query('BEGIN')
      for (const change of changes) {
        const { store, record } = change ?? {}
        if (!ALLOWED_STORES.has(store)) throw new Error(`store invalide: ${store}`)
        if (!record || typeof record.id !== 'string') throw new Error('record.id manquant')
        if (typeof record.updatedAt !== 'number') throw new Error('record.updatedAt manquant')
        await client.query(
          `INSERT INTO sync_records (user_id, store, id, data, updated_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, store, id) DO UPDATE
             SET data = EXCLUDED.data,
                 updated_at = EXCLUDED.updated_at,
                 server_seq = nextval(pg_get_serial_sequence('sync_records', 'server_seq'))
           WHERE EXCLUDED.updated_at > sync_records.updated_at`,
          [userId, store, record.id, JSON.stringify(record), record.updatedAt],
        )
      }
      await client.query('COMMIT')
      committed = true
    } catch (err) {
      await client.query('ROLLBACK')
      console.error('sync/push:', err.message)
      const isValidation = err.message.startsWith('store invalide') || err.message.includes('manquant')
      res.status(400).json({ error: isValidation ? err.message : 'Erreur de synchronisation' })
    } finally {
      client.release()
    }

    if (!committed) return
    res.json({ ok: true, count: changes.length })

    // Propagation best-effort des données admin vers les autres users
    if (userId === ADMIN_USER_ID) {
      propagateAdminChanges(pool, changes).catch((err) =>
        console.error('sync/propagation:', err.message),
      )
    }
  })

  // GET /api/sync/pull?since=<server_seq>
  //
  // Pour les non-admins : les programmes isTemplate et leurs séances/exercices
  // sont injectés depuis les records de l'admin (source unique de vérité).
  // Pas de copie per-user → pas de propagation à déclencher.
  // LWW côté client : le record avec le updatedAt le plus élevé gagne.
  app.get('/api/sync/pull', extractUser, requireUser, async (req, res) => {
    const userId = req.userId
    const since = Number(req.query.since) || 0
    try {
      // 1. Records propres à l'utilisateur (filtrés par curseur)
      const { rows: ownRows } = await pool.query(
        `SELECT store, id, data, updated_at, server_seq
           FROM sync_records
          WHERE user_id = $1 AND server_seq > $2
          ORDER BY server_seq ASC
          LIMIT $3`,
        [userId, since, PULL_LIMIT],
      )

      // 2. Templates admin (non-admins uniquement) — toujours la version courante,
      //    sans filtre de curseur : source unique, toujours à jour.
      let templateRows = []
      if (userId !== ADMIN_USER_ID) {
        const { rows } = await pool.query(
          `WITH tprog AS (
             SELECT id FROM sync_records
             WHERE user_id = $1 AND store = 'programs'
               AND (data->>'isTemplate')::boolean = true
               AND (data->>'deleted')::boolean IS NOT TRUE
           ),
           twt AS (
             SELECT id FROM sync_records
             WHERE user_id = $1 AND store = 'workoutTemplates'
               AND data->>'programId' IN (SELECT id FROM tprog)
               AND (data->>'deleted')::boolean IS NOT TRUE
           )
           SELECT store, id, data, updated_at, server_seq
             FROM sync_records
            WHERE user_id = $1 AND (
              (store = 'programs'                 AND id IN (SELECT id FROM tprog))
              OR (store = 'workoutTemplates'      AND id IN (SELECT id FROM twt))
              OR (store = 'workoutExerciseTemplates'
                  AND data->>'workoutTemplateId' IN (SELECT id FROM twt)
                  AND (data->>'deleted')::boolean IS NOT TRUE)
            )`,
          [ADMIN_USER_ID],
        )
        templateRows = rows
      }

      // 3. Fusion LWW : templates d'abord, propres records ensuite (updated_at arbitre).
      //    Un même id ne peut apparaître qu'une fois dans la réponse.
      const seen = new Map()
      for (const r of templateRows) seen.set(`${r.store}:${r.id}`, r)
      for (const r of ownRows) {
        const key = `${r.store}:${r.id}`
        const prev = seen.get(key)
        if (!prev || Number(r.updated_at) >= Number(prev.updated_at)) seen.set(key, r)
      }

      const records = [...seen.values()].map((r) => ({
        store: r.store,
        record: r.data,
        serverSeq: Number(r.server_seq),
      }))

      // 4. Curseur = max server_seq des propres records (pas des templates admin)
      const cursor = ownRows.length
        ? Number(ownRows[ownRows.length - 1].server_seq)
        : since

      res.json({
        records,
        cursor,
        hasMore: ownRows.length === PULL_LIMIT,
        isAdmin: userId === ADMIN_USER_ID,
      })
    } catch (err) {
      console.error('sync/pull:', err.message)
      res.status(500).json({ error: 'Erreur de synchronisation' })
    }
  })
}
