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
 * Propage les exercices et templates de l'admin vers tous les autres users.
 * Best-effort : appelée après le commit, les erreurs sont loggées mais non fatales.
 * LWW : updated_at = 1 → n'écrase que les enregistrements non modifiés par l'utilisateur.
 */
async function propagateAdminChanges(pool, changes) {
  // Récupère tous les user_id non-admin
  const { rows: otherUsers } = await pool.query(
    `SELECT DISTINCT user_id FROM sync_records WHERE user_id != $1`,
    [ADMIN_USER_ID],
  )
  if (otherUsers.length === 0) return
  const otherIds = otherUsers.map((r) => r.user_id)

  const toPropagate = []

  for (const { store, record } of changes) {
    if (store === 'exercises') {
      toPropagate.push({ store, record })
    } else if (store === 'programs' && record.isTemplate) {
      toPropagate.push({ store, record })
    } else if (store === 'workoutTemplates' && record.programId) {
      // Vérifie que le programme parent est un template
      const { rows } = await pool.query(
        `SELECT 1 FROM sync_records
         WHERE user_id=$1 AND store='programs' AND id=$2
           AND (data->>'isTemplate')::boolean = true`,
        [ADMIN_USER_ID, record.programId],
      )
      if (rows.length > 0) toPropagate.push({ store, record })
    } else if (store === 'workoutExerciseTemplates' && record.workoutTemplateId) {
      // Vérifie que la séance parente appartient à un programme template
      const { rows } = await pool.query(
        `SELECT 1 FROM sync_records wt
         INNER JOIN sync_records prog
           ON prog.user_id = $1 AND prog.store = 'programs'
           AND prog.id = wt.data->>'programId'
           AND (prog.data->>'isTemplate')::boolean = true
         WHERE wt.user_id=$1 AND wt.store='workoutTemplates' AND wt.id=$2`,
        [ADMIN_USER_ID, record.workoutTemplateId],
      )
      if (rows.length > 0) toPropagate.push({ store, record })
    }
  }

  if (toPropagate.length === 0) return

  // Upsert vers chaque user non-admin :
  // - INSERT si l'enregistrement n'existe pas encore
  // - UPDATE seulement si l'utilisateur n'a pas modifié sa copie (updated_at = 1)
  for (const { store, record } of toPropagate) {
    const seedData = { ...record, updatedAt: 1, dirty: true }
    const seedJson = JSON.stringify(seedData)
    for (const uid of otherIds) {
      await pool.query(
        `INSERT INTO sync_records (user_id, store, id, data, updated_at)
         VALUES ($1, $2, $3, $4::jsonb, 1)
         ON CONFLICT (user_id, store, id) DO UPDATE
           SET data       = EXCLUDED.data,
               updated_at = 1,
               server_seq = nextval(pg_get_serial_sequence('sync_records', 'server_seq'))
         WHERE sync_records.updated_at = 1`,
        [uid, store, record.id, seedJson],
      )
    }
  }

  console.log(
    `[admin-propagation] ${toPropagate.length} record(s) → ${otherIds.length} user(s)`,
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
  app.get('/api/sync/pull', extractUser, requireUser, async (req, res) => {
    const userId = req.userId
    const since = Number(req.query.since) || 0
    try {
      const { rows } = await pool.query(
        `SELECT store, id, data, updated_at, server_seq
           FROM sync_records
          WHERE user_id = $1 AND server_seq > $2
          ORDER BY server_seq ASC
          LIMIT $3`,
        [userId, since, PULL_LIMIT],
      )
      const records = rows.map((r) => ({
        store: r.store,
        record: r.data,
        serverSeq: Number(r.server_seq),
      }))
      const cursor = records.length
        ? records[records.length - 1].serverSeq
        : since
      res.json({
        records,
        cursor,
        hasMore: records.length === PULL_LIMIT,
        isAdmin: userId === ADMIN_USER_ID,
      })
    } catch (err) {
      console.error('sync/pull:', err.message)
      res.status(500).json({ error: 'Erreur de synchronisation' })
    }
  })
}
