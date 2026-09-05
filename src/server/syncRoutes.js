// Endpoints de synchronisation. Le serveur est un simple miroir : il stocke
// les enregistrements tels quels dans une table générique `sync_records` et
// applique un last-write-wins sur `updated_at`. Toutes les requêtes sont
// filtrées par user_id (extrait du JWT via le middleware extractUser).
//
// Admin (user_id = 1) : ses exercices sont propagés vers tous les autres users
// avec leur vrai updated_at (LWW réel — pas de timestamp forcé à 1).
// La propagation a lieu à chaque push admin et au démarrage du serveur.

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
 * Propage les exercices et blobs de l'admin vers tous les autres users.
 * Les blobs sont inclus pour que les images d'exercices soient visibles
 * dès le premier pull après la propagation.
 * LWW : updated_at = 1 → n'écrase que les enregistrements non modifiés par l'utilisateur.
 * Best-effort : appelée après le commit, les erreurs sont loggées mais non fatales.
 */
async function propagateAdminChanges(pool, changes) {
  // Propager exercices uniquement — les blobs sont servis via le curseur partagé
  // (un seul enregistrement dans la DB, pas de copie per-user).
  const toPropagate = changes.filter(({ store }) => store === 'exercises')
  if (toPropagate.length === 0) return

  const { rows: otherUsers } = await pool.query(
    `SELECT DISTINCT user_id FROM sync_records WHERE user_id != $1`,
    [ADMIN_USER_ID],
  )
  if (otherUsers.length === 0) return
  const otherIds = otherUsers.map((r) => r.user_id)

  for (const { record } of toPropagate) {
    // On conserve le vrai updatedAt pour que le LWW côté client (updatedAt > 1)
    // puisse écraser le seed local (updatedAt = 1).
    const propagated = { ...record, dirty: true }
    const propagatedJson = JSON.stringify(propagated)
    for (const uid of otherIds) {
      await pool.query(
        `INSERT INTO sync_records (user_id, store, id, data, updated_at)
         VALUES ($1, 'exercises', $2, $3::jsonb, $4)
         ON CONFLICT (user_id, store, id) DO UPDATE
           SET data       = EXCLUDED.data,
               updated_at = EXCLUDED.updated_at,
               server_seq = nextval(pg_get_serial_sequence('sync_records', 'server_seq'))
         WHERE sync_records.updated_at < EXCLUDED.updated_at`,
        [uid, record.id, propagatedJson, record.updatedAt],
      )
    }
  }

  console.log(
    `[admin-propagation] ${toPropagate.length} exercice(s) → ${otherIds.length} user(s)`,
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

  // Migration exercices : insère dans le compte admin les exercices KB, band et
  // bodyweight manquants (IDs introduits en sept. 2026). Idempotente — ON CONFLICT
  // DO NOTHING garantit qu'elle ne touche pas aux exercices déjà personnalisés.
  // Doit s'exécuter AVANT la propagation pour que les nouveaux IDs soient inclus.
  ;(async () => {
    // gif: URL externe fitnessprogramer.com — absent = pas d'image (placeholder dans l'app)
    const NEW_EXERCISES = [
      { id: 'kb-swing',              name: 'Kettlebell swing',                    primaryMuscle: 'glutes',        secondaryMuscles: ['hamstrings','back_thickness'], equipment: 'kettlebell', category: 'compound',  trackingType: 'weight_reps', popularity: 3, gif: 'https://fitnessprogramer.com/wp-content/uploads/2021/09/Kettlebell-Swings.gif' },
      { id: 'kb-press',              name: 'Kettlebell press',                    primaryMuscle: 'shoulders',     secondaryMuscles: ['triceps'],                     equipment: 'kettlebell', category: 'compound',  trackingType: 'weight_reps', popularity: 2, gif: 'https://fitnessprogramer.com/wp-content/uploads/2021/09/Kettlebell-One-Arm-Military-Press.gif' },
      { id: 'kb-row',                name: 'Rowing kettlebell',                   primaryMuscle: 'back_thickness',secondaryMuscles: ['biceps'],                      equipment: 'kettlebell', category: 'compound',  trackingType: 'weight_reps', popularity: 2, gif: 'https://fitnessprogramer.com/wp-content/uploads/2021/06/Kettlebell-Bent-Over-Row.gif' },
      { id: 'kb-rdl',                name: 'Soulevé de terre KB jambes tendues', primaryMuscle: 'hamstrings',    secondaryMuscles: ['glutes','back_thickness'],      equipment: 'kettlebell', category: 'compound',  trackingType: 'weight_reps', popularity: 2, gif: 'https://fitnessprogramer.com/wp-content/uploads/2021/05/Kettlebell-Single-Leg-Deadlift.gif' },
      { id: 'kb-deadlift',           name: 'Soulevé de terre kettlebell',         primaryMuscle: 'back',          secondaryMuscles: ['hamstrings','glutes'],          equipment: 'kettlebell', category: 'compound',  trackingType: 'weight_reps', popularity: 2, gif: 'https://fitnessprogramer.com/wp-content/uploads/2021/06/kettlebell-deadlift.gif' },
      { id: 'kb-floor-press',        name: 'Floor press kettlebell',              primaryMuscle: 'chest',         secondaryMuscles: ['triceps','shoulders_front'],    equipment: 'kettlebell', category: 'compound',  trackingType: 'weight_reps', popularity: 1, gif: 'https://fitnessprogramer.com/wp-content/uploads/2022/10/Kettlebell-Chest-Press-on-the-Floor.gif' },
      { id: 'kb-curl',               name: 'Curl kettlebell',                     primaryMuscle: 'biceps',        secondaryMuscles: [],                              equipment: 'kettlebell', category: 'isolation', trackingType: 'weight_reps', popularity: 1 },
      { id: 'kb-overhead-extension', name: 'Extension triceps KB nuque',          primaryMuscle: 'triceps',       secondaryMuscles: [],                              equipment: 'kettlebell', category: 'isolation', trackingType: 'weight_reps', popularity: 1 },
      { id: 'kb-pullover',           name: 'Pull-over kettlebell',                primaryMuscle: 'back_width',    secondaryMuscles: ['chest'],                       equipment: 'kettlebell', category: 'isolation', trackingType: 'weight_reps', popularity: 1 },
      { id: 'kb-calf-raise',         name: 'Mollets kettlebell',                  primaryMuscle: 'calves',        secondaryMuscles: [],                              equipment: 'kettlebell', category: 'isolation', trackingType: 'weight_reps', popularity: 1, gif: 'https://fitnessprogramer.com/wp-content/uploads/2021/06/Single-Leg-Calf-Raises.gif' },
      { id: 'band-squat',            name: 'Squat élastique',                     primaryMuscle: 'quads',         secondaryMuscles: ['glutes'],                      equipment: 'band',       category: 'compound',  trackingType: 'reps_only',   popularity: 2, gif: 'https://fitnessprogramer.com/wp-content/uploads/2022/10/Banded-Kettlebell-Goblet-Squat.gif' },
      { id: 'band-row',              name: 'Rowing élastique',                    primaryMuscle: 'back_thickness',secondaryMuscles: ['biceps'],                      equipment: 'band',       category: 'compound',  trackingType: 'reps_only',   popularity: 2 },
      { id: 'band-chest-press',      name: 'Développé poitrine élastique',        primaryMuscle: 'chest',         secondaryMuscles: ['triceps','shoulders_front'],    equipment: 'band',       category: 'compound',  trackingType: 'reps_only',   popularity: 1, gif: 'https://fitnessprogramer.com/wp-content/uploads/2022/05/Standing-incline-chest-press.gif' },
      { id: 'band-overhead-press',   name: 'Développé militaire élastique',       primaryMuscle: 'shoulders',     secondaryMuscles: ['triceps'],                     equipment: 'band',       category: 'compound',  trackingType: 'reps_only',   popularity: 2, gif: 'https://fitnessprogramer.com/wp-content/uploads/2021/08/Resistance-Band-Seated-Shoulder-Press.gif' },
      { id: 'band-curl',             name: 'Curl biceps élastique',               primaryMuscle: 'biceps',        secondaryMuscles: [],                              equipment: 'band',       category: 'isolation', trackingType: 'reps_only',   popularity: 2, gif: 'https://fitnessprogramer.com/wp-content/uploads/2022/06/Seated-Bicep-Curl-With-Resistance-Band.gif' },
      { id: 'band-tricep-pushdown',  name: 'Extension triceps élastique',         primaryMuscle: 'triceps',       secondaryMuscles: [],                              equipment: 'band',       category: 'isolation', trackingType: 'reps_only',   popularity: 2, gif: 'https://fitnessprogramer.com/wp-content/uploads/2022/02/Band-Pushdown.gif' },
      { id: 'band-good-morning',     name: 'Good morning élastique',              primaryMuscle: 'hamstrings',    secondaryMuscles: ['glutes','back'],               equipment: 'band',       category: 'compound',  trackingType: 'reps_only',   popularity: 1, gif: 'https://fitnessprogramer.com/wp-content/uploads/2022/07/Good-Morning-With-Resistance-Band.gif' },
      { id: 'band-hip-thrust',       name: 'Hip thrust élastique',                primaryMuscle: 'glutes',        secondaryMuscles: ['hamstrings'],                  equipment: 'band',       category: 'compound',  trackingType: 'reps_only',   popularity: 2, gif: 'https://fitnessprogramer.com/wp-content/uploads/2022/09/Resistance-Band-Hip-Thrust.gif' },
      { id: 'bw-incline-pushup',     name: 'Pompes inclinées (pieds surélevés)',  primaryMuscle: 'chest_upper',   secondaryMuscles: ['triceps','shoulders_front'],    equipment: 'bodyweight', category: 'compound',  trackingType: 'reps_only',   popularity: 2, gif: 'https://fitnessprogramer.com/wp-content/uploads/2015/07/Decline-Push-Up.gif' },
      { id: 'bw-chinup',             name: 'Tractions prise supination',          primaryMuscle: 'biceps',        secondaryMuscles: ['back_width'],                  equipment: 'bodyweight', category: 'compound',  trackingType: 'weight_reps', popularity: 3, gif: 'https://fitnessprogramer.com/wp-content/uploads/2021/04/Close-Grip-Chin-Up.gif' },
      { id: 'bw-nordic-curl',        name: 'Nordic curl',                         primaryMuscle: 'hamstrings',    secondaryMuscles: ['glutes'],                      equipment: 'bodyweight', category: 'compound',  trackingType: 'reps_only',   popularity: 2, gif: 'https://fitnessprogramer.com/wp-content/uploads/2021/06/Nordic-Hamstring-Curl.gif' },
      { id: 'bw-calf-raise',         name: 'Mollets poids du corps',              primaryMuscle: 'calves',        secondaryMuscles: [],                              equipment: 'bodyweight', category: 'isolation', trackingType: 'reps_only',   popularity: 2 },
      { id: 'bw-squat',              name: 'Squat poids du corps',                primaryMuscle: 'quads',         secondaryMuscles: ['glutes'],                       equipment: 'bodyweight', category: 'compound',  trackingType: 'reps_only',   popularity: 3 },
      { id: 'bw-lunge',              name: 'Fentes poids du corps',               primaryMuscle: 'quads',         secondaryMuscles: ['glutes', 'hamstrings'],          equipment: 'bodyweight', category: 'compound',  trackingType: 'reps_only',   popularity: 2 },
      { id: 'dumbbell-rdl',          name: 'Soulevé de terre jambes tendues haltères', primaryMuscle: 'hamstrings', secondaryMuscles: ['glutes', 'back_thickness'],    equipment: 'dumbbell',   category: 'compound',  trackingType: 'weight_reps', popularity: 2 },
    ]
    const now = Date.now()
    let inserted = 0
    for (const ex of NEW_EXERCISES) {
      const data = {
        id: ex.id, name: ex.name,
        primaryMuscle: ex.primaryMuscle, secondaryMuscles: ex.secondaryMuscles,
        equipment: ex.equipment, category: ex.category, trackingType: ex.trackingType,
        isCustom: false, isWarmupExercise: false, popularity: ex.popularity,
        usageCount: 0, createdAt: now, updatedAt: now, deleted: false, dirty: false,
        ...(ex.gif ? { media: { url: ex.gif, mime: 'image/gif', type: 'gif', sizeBytes: 0, importedAt: now, aspectRatio: 1 } } : {}),
      }
      const { rowCount } = await pool.query(
        `INSERT INTO sync_records (user_id, store, id, data, updated_at)
         VALUES ($1, 'exercises', $2, $3::jsonb, $4)
         ON CONFLICT (user_id, store, id) DO NOTHING`,
        [ADMIN_USER_ID, ex.id, JSON.stringify(data), now],
      )
      inserted += rowCount
    }
    if (inserted > 0)
      console.log(`[startup] ${inserted} nouvel(aux) exercice(s) ajouté(s) au compte admin`)

    // Patch popularités & données correctives (analyse coach oct. 2026).
    // DO UPDATE ciblé uniquement si les données sont encore dans leur état d'origine.
    const POPULARITY_PATCHES = [
      { id: 'seed-bench-barbell',        data: { popularity: 8 } },
      { id: 'seed-squat-barbell',        data: { popularity: 8 } },
      { id: 'seed-row-barbell',          data: { popularity: 7 } },
      { id: 'seed-hip-thrust',           data: { popularity: 4 } },
      { id: 'seed-incline-bench-barbell',data: { popularity: 4 } },
      { id: 'bw-wall-sit',               data: { popularity: 0 } },
      { id: 'seed-elliptical',           data: { isWarmupExercise: false } },
      { id: 'seed-bodyweight-squat',     data: { name: 'Squat mobilité' } },
    ]
    for (const p of POPULARITY_PATCHES) {
      await pool.query(
        `UPDATE sync_records
            SET data = data || $1::jsonb,
                updated_at = $2
          WHERE user_id = $3 AND store = 'exercises' AND id = $4`,
        [JSON.stringify(p.data), now, ADMIN_USER_ID, p.id],
      )
    }

    // Patch seed-hip-adduction-machine : primaryMuscle et category manquants dans le seed initial.
    // DO UPDATE ciblé → updated_at = now pour passer le LWW lors de la propagation.
    await pool.query(
      `UPDATE sync_records
          SET data = data || $1::jsonb,
              updated_at = $2
        WHERE user_id = $3 AND store = 'exercises' AND id = 'seed-hip-adduction-machine'
          AND (data->>'primaryMuscle' IS NULL OR data->>'category' IS NULL)`,
      [JSON.stringify({ primaryMuscle: 'glutes', category: 'isolation', popularity: 2 }), now, ADMIN_USER_ID],
    )

    // Propagation immédiatement après la migration (même bloc, séquentiel).
    // Ainsi les nouveaux IDs sont inclus dès le premier redémarrage.
    await pool.query(
      `INSERT INTO sync_records (user_id, store, id, data, updated_at)
       SELECT u.user_id, 'exercises', e.id,
              e.data || '{"dirty":true}'::jsonb,
              e.updated_at
         FROM (
           SELECT id, data, updated_at
             FROM sync_records
            WHERE user_id = $1
              AND store = 'exercises'
              AND (data->>'deleted')::boolean IS NOT TRUE
         ) e
         CROSS JOIN (
           SELECT DISTINCT user_id FROM sync_records WHERE user_id != $1
         ) u
       ON CONFLICT (user_id, store, id) DO UPDATE
         SET data       = EXCLUDED.data,
             updated_at = EXCLUDED.updated_at,
             server_seq = nextval(pg_get_serial_sequence('sync_records', 'server_seq'))
       WHERE sync_records.updated_at < EXCLUDED.updated_at`,
      [ADMIN_USER_ID],
    )
    console.log('[startup] Propagation admin exercices → OK')
  })().catch((err) => console.error('[startup-migrate/propagate]', err.message))

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
    const sinceShared = Number(req.query.sinceShared) || 0
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

      // 3. Blobs admin d'exercices — servis sans copie per-user, filtrés par
      //    sinceShared pour ne renvoyer que les nouveaux/modifiés depuis le dernier pull.
      //    Un blob admin non modifié ne transite plus du tout une fois reçu.
      let sharedBlobRows = []
      let newSharedCursor = sinceShared
      if (userId !== ADMIN_USER_ID) {
        const { rows } = await pool.query(
          `SELECT sr.store, sr.id, sr.data, sr.updated_at, sr.server_seq
             FROM sync_records sr
            WHERE sr.user_id = $1
              AND sr.store = 'blobs'
              AND sr.server_seq > $2
              AND sr.id IN (
                SELECT data->'media'->>'blobId'
                  FROM sync_records
                 WHERE user_id = $1
                   AND store = 'exercises'
                   AND data->'media'->>'blobId' IS NOT NULL
                   AND (data->>'deleted')::boolean IS NOT TRUE
              )
              AND (sr.data->>'deleted')::boolean IS NOT TRUE
            ORDER BY sr.server_seq ASC
            LIMIT $3`,
          [ADMIN_USER_ID, sinceShared, PULL_LIMIT],
        )
        sharedBlobRows = rows
        if (rows.length > 0) {
          newSharedCursor = Number(rows[rows.length - 1].server_seq)
        }
      }

      // 4. Fusion LWW : templates + blobs partagés d'abord, propres records ensuite.
      const seen = new Map()
      for (const r of templateRows)    seen.set(`${r.store}:${r.id}`, r)
      for (const r of sharedBlobRows)  seen.set(`${r.store}:${r.id}`, r)
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

      // 5. Curseurs — own records et blobs partagés sont indépendants.
      const cursor = ownRows.length
        ? Number(ownRows[ownRows.length - 1].server_seq)
        : since

      res.json({
        records,
        cursor,
        sharedCursor: newSharedCursor,
        hasMore: ownRows.length === PULL_LIMIT,
        isAdmin: userId === ADMIN_USER_ID,
      })
    } catch (err) {
      console.error('sync/pull:', err.message)
      res.status(500).json({ error: 'Erreur de synchronisation' })
    }
  })
}
