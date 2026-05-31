// Endpoints de synchronisation. Le serveur est un simple miroir : il stocke
// les enregistrements tels quels dans une table générique `sync_records` et
// applique un last-write-wins sur `updated_at`. Aucune logique métier ici.

/** Stores autorisés (doit refléter SyncStoreName côté client). */
const ALLOWED_STORES = new Set([
  'settings', 'exercises', 'programs', 'workoutTemplates',
  'workoutExerciseTemplates', 'sessions', 'sessionExercises',
  'sets', 'personalRecords', 'goals', 'bodyMeasurements', 'blobs',
])

const PULL_LIMIT = 1000
const MAX_PUSH_BATCH = 500

// Auth optionnelle : si SYNC_SECRET est défini côté serveur, le client doit
// envoyer `Authorization: Bearer <secret>`. Sans SYNC_SECRET, toutes les
// requêtes sont acceptées (utile en dev local).
const SYNC_SECRET = process.env.SYNC_SECRET
function requireAuth(req, res, next) {
  if (!SYNC_SECRET) return next()
  if (req.headers['authorization'] !== `Bearer ${SYNC_SECRET}`) {
    return res.status(401).json({ error: 'Non autorisé' })
  }
  next()
}

export function registerSyncRoutes(app, pool) {
  // Sans base de données (dev local), la synchro est indisponible mais
  // l'app reste 100 % fonctionnelle sur IndexedDB.
  if (!pool) {
    app.all('/api/sync/*', (_req, res) =>
      res.status(503).json({ error: 'Synchronisation indisponible (pas de base)' }),
    )
    return
  }

  // POST /api/sync/push — { changes: [{ store, record }] }
  app.post('/api/sync/push', requireAuth, async (req, res) => {
    const changes = Array.isArray(req.body?.changes) ? req.body.changes : null
    if (!changes) return res.status(400).json({ error: 'changes[] requis' })
    if (changes.length > MAX_PUSH_BATCH)
      return res.status(413).json({ error: `Trop d'entrées (max ${MAX_PUSH_BATCH})` })

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      for (const change of changes) {
        const { store, record } = change ?? {}
        if (!ALLOWED_STORES.has(store)) throw new Error(`store invalide: ${store}`)
        if (!record || typeof record.id !== 'string') throw new Error('record.id manquant')
        if (typeof record.updatedAt !== 'number') throw new Error('record.updatedAt manquant')
        await client.query(
          `INSERT INTO sync_records (store, id, data, updated_at)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (store, id) DO UPDATE
             SET data = EXCLUDED.data,
                 updated_at = EXCLUDED.updated_at,
                 server_seq = nextval(pg_get_serial_sequence('sync_records', 'server_seq'))
           WHERE EXCLUDED.updated_at > sync_records.updated_at`,
          [store, record.id, JSON.stringify(record), record.updatedAt],
        )
      }
      await client.query('COMMIT')
      res.json({ ok: true, count: changes.length })
    } catch (err) {
      await client.query('ROLLBACK')
      console.error('sync/push:', err.message)
      const isValidation = err.message.startsWith('store invalide') || err.message.includes('manquant')
      res.status(400).json({ error: isValidation ? err.message : 'Erreur de synchronisation' })
    } finally {
      client.release()
    }
  })

  // GET /api/sync/pull?since=<server_seq>
  app.get('/api/sync/pull', requireAuth, async (req, res) => {
    const since = Number(req.query.since) || 0
    try {
      const { rows } = await pool.query(
        `SELECT store, id, data, updated_at, server_seq
           FROM sync_records
          WHERE server_seq > $1
          ORDER BY server_seq ASC
          LIMIT $2`,
        [since, PULL_LIMIT],
      )
      const records = rows.map((r) => ({
        store: r.store,
        record: r.data,
        serverSeq: Number(r.server_seq),
      }))
      const cursor = records.length
        ? records[records.length - 1].serverSeq
        : since
      res.json({ records, cursor, hasMore: records.length === PULL_LIMIT })
    } catch (err) {
      console.error('sync/pull:', err.message)
      res.status(500).json({ error: 'Erreur de synchronisation' })
    }
  })
}
