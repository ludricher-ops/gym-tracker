// Endpoints de synchronisation. Le serveur est un simple miroir : il stocke
// les enregistrements tels quels dans une table générique `sync_records` et
// applique un last-write-wins sur `updated_at`. Toutes les requêtes sont
// filtrées par user_id (extrait du JWT via le middleware extractUser).
//
// Admin (user_id = 1) : ses exercices sont propagés vers tous les autres users
// avec leur vrai updated_at (LWW réel — pas de timestamp forcé à 1).
// La propagation a lieu à chaque push admin et au démarrage du serveur.

/** Stores autorisés (doit refléter SyncStoreName côté client). */
export const ALLOWED_STORES = new Set([
  'settings', 'exercises', 'programs', 'workoutTemplates',
  'workoutExerciseTemplates', 'sessions', 'sessionExercises',
  'sets', 'personalRecords', 'goals', 'bodyMeasurements', 'blobs',
])

export const PULL_LIMIT = 1000
export const MAX_PUSH_BATCH = 500

/**
 * Champs non-nullables requis par store (au-delà de id + updatedAt déjà vérifiés).
 * Validation légère — détecte les corruptions les plus fréquentes sans zod/joi.
 */
export const STORE_REQUIRED_FIELDS = {
  exercises:                ['name', 'primaryMuscle', 'equipment'],
  programs:                 ['name', 'goal', 'level'],
  workoutTemplates:         ['name', 'programId'],
  workoutExerciseTemplates: ['workoutTemplateId', 'exerciseId'],
  sessions:                 ['startedAt'],
  sessionExercises:         ['sessionId', 'exerciseId'],
  sets:                     ['sessionExerciseId'],
  personalRecords:          ['exerciseId', 'type'],
  goals:                    [],
  bodyMeasurements:         [],
  settings:                 [],
  blobs:                    [],
}

/**
 * Valide les champs obligatoires d'un record selon son store.
 * Lève une Error si un champ est absent ou vide — interrompra la transaction.
 */
export function validateStoreRecord(storeName, record) {
  const required = STORE_REQUIRED_FIELDS[storeName] ?? []
  for (const field of required) {
    if (record[field] == null || record[field] === '')
      throw new Error(`${storeName}: champ requis absent: ${field}`)
  }
}

/**
 * Valide un batch de changes push, lève une Error à la première anomalie.
 * Logique extraite du handler POST /api/sync/push — testable sans base de données.
 *
 * @param {Array<{store: string, record: unknown}>} changes
 */
export function validatePushBatch(changes) {
  if (!Array.isArray(changes)) throw new Error('changes[] requis')
  if (changes.length > MAX_PUSH_BATCH)
    throw new Error(`Trop d'entrées (max ${MAX_PUSH_BATCH})`)
  for (const change of changes) {
    const { store, record } = change ?? {}
    if (!ALLOWED_STORES.has(store)) throw new Error(`store invalide: ${store}`)
    if (!record || typeof record.id !== 'string' || record.id.length === 0)
      throw new Error('record.id manquant ou vide')
    if (typeof record.updatedAt !== 'number' || record.updatedAt <= 0)
      throw new Error('record.updatedAt invalide')
    validateStoreRecord(store, record)
  }
}

/**
 * Fusionne (LWW) des listes de records serveur en dédupliquant par (store, id).
 * Les records avec le updatedAt le plus élevé gagnent.
 * Ordre de priorité : templateRows, sharedBlobRows, puis ownRows (ownRows domine à égalité).
 *
 * @param {Array<{store:string,id:string,data:object,updated_at:number|string,server_seq:number|string}>} templateRows
 * @param {Array<{store:string,id:string,data:object,updated_at:number|string,server_seq:number|string}>} sharedBlobRows
 * @param {Array<{store:string,id:string,data:object,updated_at:number|string,server_seq:number|string}>} ownRows
 * @returns {Array<{store:string,record:object,serverSeq:number}>}
 */
export function mergePullRows(templateRows, sharedBlobRows, ownRows) {
  const seen = new Map()
  for (const r of templateRows)   seen.set(`${r.store}:${r.id}`, r)
  for (const r of sharedBlobRows) seen.set(`${r.store}:${r.id}`, r)
  for (const r of ownRows) {
    const key = `${r.store}:${r.id}`
    const prev = seen.get(key)
    if (!prev || Number(r.updated_at) >= Number(prev.updated_at)) seen.set(key, r)
  }
  return [...seen.values()].map((r) => ({
    store: r.store,
    record: r.data,
    serverSeq: Number(r.server_seq),
  }))
}

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

  // Batch INSERT avec UNNEST : une seule requête pour N exercices × M users
  // au lieu de N×M requêtes séquentielles.
  const userIds = []
  const exIds = []
  const dataJsons = []
  const updatedAts = []
  for (const uid of otherIds) {
    for (const { record } of toPropagate) {
      userIds.push(uid)
      exIds.push(record.id)
      dataJsons.push(JSON.stringify({ ...record, dirty: true }))
      updatedAts.push(record.updatedAt)
    }
  }

  await pool.query(
    `INSERT INTO sync_records (user_id, store, id, data, updated_at)
     SELECT unnest($1::int[]), 'exercises', unnest($2::text[]), unnest($3::jsonb[]), unnest($4::bigint[])
     ON CONFLICT (user_id, store, id) DO UPDATE
       SET data       = EXCLUDED.data,
           updated_at = EXCLUDED.updated_at,
           server_seq = nextval(pg_get_serial_sequence('sync_records', 'server_seq'))
     WHERE sync_records.updated_at < EXCLUDED.updated_at`,
    [userIds, exIds, dataJsons, updatedAts],
  )

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

  // Startup : migrations one-shot + propagation admin.
  // La table schema_migrations évite de rejouer les patches à chaque redémarrage.
  // Les blocs NEW_EXERCISES et la propagation finale restent toujours actifs
  // (idempotents par nature : ON CONFLICT DO NOTHING / LWW).
  ;(async () => {
    // ── Table de suivi des migrations ────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id         TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    /**
     * Exécute fn() une seule fois pour l'identifiant donné.
     * Les appels suivants sont silencieusement ignorés (ON CONFLICT DO NOTHING).
     */
    async function runMigration(id, fn) {
      const { rowCount } = await pool.query(
        `INSERT INTO schema_migrations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`,
        [id],
      )
      if (rowCount === 0) return   // déjà appliquée
      console.log(`[migration] ${id}…`)
      await fn()
      console.log(`[migration] ${id} ✓`)
    }

    // ── Insertion des exercices manquants (sept. 2026) ───────────────────────
    // Toujours actif — ON CONFLICT DO NOTHING = idempotent nativement.
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
      { id: 'machine-pullover',      name: 'Pullover machine',                         primaryMuscle: 'back_width',    secondaryMuscles: ['chest'],                       equipment: 'machine',    category: 'isolation', trackingType: 'weight_reps', popularity: 2, gif: 'https://fitnessprogramer.com/wp-content/uploads/2021/06/Lever-Pullover.gif' },
      { id: 'machine-low-row',       name: 'Tirage buste machine',                     primaryMuscle: 'back_thickness', secondaryMuscles: ['biceps'],                     equipment: 'machine',    category: 'isolation', trackingType: 'weight_reps', popularity: 2, gif: 'https://fitnessprogramer.com/wp-content/uploads/2021/04/Lever-Seated-Row.gif' },
      { id: 'machine-biceps-curl',   name: 'Curl biceps machine',                      primaryMuscle: 'biceps',         secondaryMuscles: ['forearms'],                   equipment: 'machine',    category: 'isolation', trackingType: 'weight_reps', popularity: 2, gif: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Bicep-Curl-Machine.gif' },
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

    // ── Patches one-shot (via runMigration) ──────────────────────────────────

    await runMigration('popularity-patches-oct-2026', async () => {
      // Popularités & données correctives (analyse coach oct. 2026).
      const POPULARITY_PATCHES = [
        { id: 'seed-bench-barbell',        data: { popularity: 8 } },
        { id: 'seed-squat-barbell',        data: { popularity: 8 } },
        { id: 'seed-row-barbell',          data: { popularity: 7 } },
        { id: 'seed-hip-thrust',           data: { popularity: 4 } },
        { id: 'seed-incline-bench-barbell',data: { popularity: 4 } },
        { id: 'bw-wall-sit',               data: { popularity: 0 } },
        { id: 'seed-elliptical',           data: { isWarmupExercise: false } },
        { id: 'seed-bodyweight-squat',     data: { name: 'Squat mobilité' } },
        // P34 fix : seed-pullover reclassifié compound → isolation pour exclure du slot compound pull[0]
        { id: 'seed-pullover',             data: { category: 'isolation' } },
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
    })

    await runMigration('bug-c5-hip-adduction-machine', async () => {
      // Patch seed-hip-adduction-machine : primaryMuscle corrigé de 'glutes' → 'hamstrings'
      // (BUG-C5 fix : la machine adducteurs cible les adducteurs / inner thigh, pas les fessiers).
      // Le patch s'applique aussi aux users existants dont la donnée est déjà en base.
      await pool.query(
        `UPDATE sync_records
            SET data = data || $1::jsonb,
                updated_at = $2
          WHERE store = 'exercises' AND id = 'seed-hip-adduction-machine'
            AND (data->>'primaryMuscle' IS NULL OR data->>'primaryMuscle' = 'glutes' OR data->>'category' IS NULL)`,
        [JSON.stringify({ primaryMuscle: 'hamstrings', category: 'isolation', popularity: 2 }), now],
      )
    })

    await runMigration('bug-img-bw', async () => {
      // Patch images incorrectes : exercices bodyweight avec GIF barre (BUG-IMG-BW).
      // bw-squat : barbell-full-squat.gif → frankenstein-squat.gif (squat poids du corps)
      // seed-good-morning-bw : barbell-good-morning.gif → suppression (aucun GIF BW disponible)
      const BW_IMG_FIX_URL = 'https://raw.githubusercontent.com/JahelCuadrado/ExerciseGymGifsDB/main/glutes/frankenstein-squat.gif'
      await pool.query(
        `UPDATE sync_records
            SET data = data || $1::jsonb,
                updated_at = $2
          WHERE store = 'exercises' AND id = 'bw-squat'
            AND data->'media'->>'url' LIKE '%barbell%'`,
        [JSON.stringify({ media: { url: BW_IMG_FIX_URL, mime: 'image/gif', type: 'gif', sizeBytes: 0, importedAt: now, aspectRatio: 1 } }), now],
      )
      await pool.query(
        `UPDATE sync_records
            SET data = data - 'media',
                updated_at = $1
          WHERE store = 'exercises' AND id = 'seed-good-morning-bw'
            AND data->'media'->>'url' LIKE '%barbell%'`,
        [now],
      )
    })

    await runMigration('bug-img-2', async () => {
      // Patch images incorrectes (BUG-IMG-2) :
      // seed-vertical-leg-crunch : lever machine → jackknife-sit-up (bodyweight le plus proche)
      // band-good-morning : barbell → GIF élastique fitnessprogramer
      // dumbbell-rdl : barbell → dumbbell-stiff-leg-deadlift
      const IMG_PATCHES = [
        {
          id: 'seed-vertical-leg-crunch',
          media: { url: 'https://raw.githubusercontent.com/JahelCuadrado/ExerciseGymGifsDB/main/abs/jackknife-sit-up.gif', mime: 'image/gif', type: 'gif', sizeBytes: 0, importedAt: now, aspectRatio: 1 },
          cond: '%lever%',
        },
        {
          id: 'band-good-morning',
          media: { url: 'https://fitnessprogramer.com/wp-content/uploads/2022/07/Good-Morning-With-Resistance-Band.gif', mime: 'image/gif', type: 'gif', sizeBytes: 0, importedAt: now, aspectRatio: 1 },
          cond: '%barbell%',
        },
        {
          id: 'dumbbell-rdl',
          media: { url: 'https://raw.githubusercontent.com/JahelCuadrado/ExerciseGymGifsDB/main/glutes/dumbbell-stiff-leg-deadlift.gif', mime: 'image/gif', type: 'gif', sizeBytes: 0, importedAt: now, aspectRatio: 1 },
          cond: '%barbell%',
        },
      ]
      for (const p of IMG_PATCHES) {
        await pool.query(
          `UPDATE sync_records
              SET data = data || $1::jsonb,
                  updated_at = $2
            WHERE store = 'exercises' AND id = $3
              AND (data->'media'->>'url' LIKE $4 OR data->>'media' IS NULL)`,
          [JSON.stringify({ media: p.media }), now, p.id, p.cond],
        )
      }
    })

    await runMigration('bug-img-3', async () => {
      // Patch images incorrectes (BUG-IMG-3) : GIFs d'exercices totalement différents de l'exercice.
      // Solution : supprimer le champ media (mieux que montrer un GIF faux).
      // seed-hip-thrust-bw : glute-bridge-march → low-glute-bridge-on-floor (le plus proche dispo)
      const IMG_REMOVE_PATCHES = [
        { id: 'seed-cat-cow',            cond: '%upper-back-stretch%' },
        { id: 'seed-bird-dog',           cond: '%dead-bug%' },
        { id: 'seed-shoulder-circles',   cond: '%rear-deltoid-stretch%' },
        { id: 'seed-scissors',           cond: '%twisted-leg-raise%' },
        { id: 'seed-fire-hydrant',       cond: '%band-lying-hip-internal-rotation%' },
        { id: 'seed-clamshell',          cond: '%band-lying-hip-internal-rotation%' },
        { id: 'bw-hollow-body',          cond: '%hanging-pike%' },
        { id: 'seed-leg-swings',         cond: '%monster-walk%' },
        { id: 'seed-rowing-erg',         cond: '%run-equipment%' },
        { id: 'seed-superman',           cond: '%reverse-hyper-on-flat-bench%' },
        { id: 'bw-wall-sit',             cond: '%squat-to-overhead-reach%' },
        { id: 'band-face-pull',          cond: '%band-reverse-fly%' },
        { id: 'seed-hip-thrust-machine', cond: '%lever-horizontal-one-leg-press%' },
      ]
      for (const p of IMG_REMOVE_PATCHES) {
        await pool.query(
          `UPDATE sync_records
              SET data = data - 'media',
                  updated_at = $1
            WHERE store = 'exercises' AND id = $2
              AND data->'media'->>'url' LIKE $3`,
          [now, p.id, p.cond],
        )
      }
      // seed-hip-thrust-bw : glute-bridge-march (faux) → low-glute-bridge-on-floor (le plus proche)
      await pool.query(
        `UPDATE sync_records
            SET data = data || $1::jsonb,
                updated_at = $2
          WHERE store = 'exercises' AND id = 'seed-hip-thrust-bw'
            AND data->'media'->>'url' LIKE '%glute-bridge-march%'`,
        [JSON.stringify({ media: { url: 'https://raw.githubusercontent.com/JahelCuadrado/ExerciseGymGifsDB/main/glutes/low-glute-bridge-on-floor.gif', mime: 'image/gif', type: 'gif', sizeBytes: 0, importedAt: now, aspectRatio: 1 } }), now],
      )
    })

    await runMigration('bug-img-4', async () => {
      // Patch images incorrectes (BUG-IMG-4) : ajout des GIFs fitnessprogramer.com pour les exercices
      // dont le media avait été supprimé (BUG-IMG-3) faute de GIF correct dans JahelCuadrado.
      const FP_IMG_PATCHES = [
        { id: 'seed-cat-cow',            url: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/cat-cow.gif',                     mime: 'image/gif' },
        { id: 'seed-bird-dog',           url: 'https://fitnessprogramer.com/wp-content/uploads/2022/07/Bird-Dog.gif',                    mime: 'image/gif' },
        { id: 'seed-shoulder-circles',   url: 'https://fitnessprogramer.com/wp-content/uploads/2021/07/Arm-Circles_Shoulders.gif',       mime: 'image/gif' },
        { id: 'seed-scissors',           url: 'https://fitnessprogramer.com/wp-content/uploads/2022/12/Leg-Scissors.gif',                mime: 'image/gif' },
        { id: 'seed-fire-hydrant',       url: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Fire-Hydrant.gif',                mime: 'image/gif' },
        { id: 'seed-clamshell',          url: 'https://fitnessprogramer.com/wp-content/uploads/2021/05/Side-Lying-Clam.gif',             mime: 'image/gif' },
        { id: 'bw-hollow-body',          url: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/HollowHold.png',                  mime: 'image/png' },
        { id: 'seed-leg-swings',         url: 'https://fitnessprogramer.com/wp-content/uploads/2025/07/Leg-Swings-Front-to-Back.gif',    mime: 'image/gif' },
        { id: 'seed-rowing-erg',         url: 'https://fitnessprogramer.com/wp-content/uploads/2021/06/Rowing-Machine.gif',              mime: 'image/gif' },
        { id: 'seed-superman',           url: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Superman-exercise.gif',           mime: 'image/gif' },
        { id: 'bw-wall-sit',             url: 'https://fitnessprogramer.com/wp-content/uploads/2021/06/Wall-Sit.png',                    mime: 'image/png' },
        { id: 'band-face-pull',          url: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Face-Pull.gif',                   mime: 'image/gif' },
        { id: 'seed-hip-thrust-machine', url: 'https://fitnessprogramer.com/wp-content/uploads/2022/02/Hip-Thrust-Machine.gif',          mime: 'image/gif' },
      ]
      for (const p of FP_IMG_PATCHES) {
        const isGif = p.mime === 'image/gif'
        await pool.query(
          `UPDATE sync_records
              SET data = data || $1::jsonb,
                  updated_at = $2
            WHERE store = 'exercises' AND id = $3
              AND data->>'media' IS NULL`,
          [JSON.stringify({ media: { url: p.url, mime: p.mime, type: isGif ? 'gif' : 'photo', sizeBytes: 0, importedAt: now, aspectRatio: 1 } }), now, p.id],
        )
      }
    })

    await runMigration('bug-img-5', async () => {
      // Corrections d'images incorrectes (audit 2026-09-13) :
      // — seed-reverse-curl-barbell : wrist-curl.gif → reverse-curl.gif (biceps, pas avant-bras)
      // — seed-cable-hip-abduction  : hip-extension.gif → straight-leg-outer-hip-abductor.gif (abduction ≠ extension)
      // — bw-nordic-curl            : cable-machine.gif → bench-support.gif (poids du corps, pas de machine)
      // — seed-cable-hamstring-curl : nordic-style.gif → standing-single-leg-curl.gif (leg curl debout, plus proche)
      // — seed-good-morning-bw      : pas de média → barbell-good-morning.gif (même mouvement)
      const BASE = 'https://raw.githubusercontent.com/JahelCuadrado/ExerciseGymGifsDB/main'
      const IMG5_PATCHES = [
        { id: 'seed-reverse-curl-barbell', url: `${BASE}/biceps/barbell-reverse-curl.gif` },
        { id: 'seed-cable-hip-abduction',  url: `${BASE}/abductors/straight-leg-outer-hip-abductor.gif` },
        { id: 'bw-nordic-curl',            url: `${BASE}/hamstrings/inverse-leg-curl-bench-support.gif` },
        { id: 'seed-cable-hamstring-curl', url: `${BASE}/hamstrings/standing-single-leg-curl.gif` },
        { id: 'seed-good-morning-bw',      url: `${BASE}/hamstrings/barbell-good-morning.gif` },
      ]
      for (const p of IMG5_PATCHES) {
        await pool.query(
          `UPDATE sync_records
              SET data = data || $1::jsonb,
                  updated_at = $2
            WHERE store = 'exercises' AND id = $3`,
          [JSON.stringify({ media: { url: p.url, mime: 'image/gif', type: 'gif', sizeBytes: 0, importedAt: now, aspectRatio: 1 } }), now, p.id],
        )
      }
    })

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
        if (!record || typeof record.id !== 'string' || record.id.length === 0)
          throw new Error('record.id manquant ou vide')
        if (typeof record.updatedAt !== 'number' || record.updatedAt <= 0)
          throw new Error('record.updatedAt invalide')
        validateStoreRecord(store, record)
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
      const isValidation = err.message.startsWith('store invalide')
        || err.message.includes('manquant')
        || err.message.includes('invalide')
        || err.message.includes('champ requis')
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
        // hasMore = true si l'une des sources paginées a atteint sa limite.
        // ownRows et sharedBlobRows sont tous deux limités à PULL_LIMIT — si
        // sharedBlobRows est saturé, le client doit rappuller même si ownRows est vide.
        hasMore: ownRows.length === PULL_LIMIT || sharedBlobRows.length === PULL_LIMIT,
        isAdmin: userId === ADMIN_USER_ID,
      })
    } catch (err) {
      console.error('sync/pull:', err.message)
      res.status(500).json({ error: 'Erreur de synchronisation' })
    }
  })
}
