// Ajoute les finishers jambes à Iron Upper :
// - Lundi (Poitrine + Dos) → Glute bridge 2×10
// - Mercredi (Épaules + Bras) → Leg curl allongé 2×10
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const client = await pool.connect()

try {
  // ── 1. Exercices ──────────────────────────────────────────────────────────
  const exercises = [
    {
      id: 'seed-glute-bridge',
      name: 'Glute bridge',
      primaryMuscle: 'glutes',
      secondaryMuscles: ['hamstrings', 'core'],
      equipment: 'bodyweight',
      category: 'isolation',
      trackingType: 'weight_reps',
      instructions: 'Allongé sur le dos, pieds à plat, pousser les hanches vers le haut en contractant les fessiers. Maintenir 1s en haut.',
      media: {
        type: 'gif',
        url: 'https://fitnessprogramer.com/wp-content/uploads/2021/06/Glute-Bridge.gif',
        mime: 'image/gif',
        sizeBytes: 0,
        aspectRatio: 1,
        importedAt: 1,
      },
    },
    {
      id: 'seed-leg-curl-allonge',
      name: 'Leg curl allongé',
      primaryMuscle: 'hamstrings',
      secondaryMuscles: ['calves'],
      equipment: 'machine',
      category: 'isolation',
      trackingType: 'weight_reps',
      instructions: 'Allongé ventre vers le bas sur la machine. Ramener les talons vers les fessiers en contractant les ischios. Descendre lentement.',
      media: {
        type: 'gif',
        url: 'https://fitnessprogramer.com/wp-content/uploads/2021/06/Lying-Leg-Curl.gif',
        mime: 'image/gif',
        sizeBytes: 0,
        aspectRatio: 1,
        importedAt: 1,
      },
    },
  ]

  for (const userId of [1, 2]) {
    const updatedAt = userId === 1 ? Date.now() : 1
    for (const ex of exercises) {
      const data = {
        ...ex,
        isCustom: false,
        isUnilateral: false,
        secondaryMuscles: ex.secondaryMuscles,
        updatedAt,
        deleted: false,
        createdAt: updatedAt,
      }
      await client.query(`
        INSERT INTO sync_records (id, user_id, store, data, updated_at)
        VALUES ($1, $2, 'exercises', $3::jsonb, $4)
        ON CONFLICT (user_id, store, id) DO UPDATE
          SET data = EXCLUDED.data,
              updated_at = EXCLUDED.updated_at,
              server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))
      `, [ex.id, userId, JSON.stringify(data), updatedAt])
      console.log(`✅ Exercice "${ex.name}" upsert pour user:${userId}`)
    }
  }

  // ── 2. Récupérer les programmes Iron Upper ────────────────────────────────
  const { rows: progs } = await client.query(`
    SELECT id, user_id,
           data->>'name' AS name,
           data->>'weekTemplate' AS week_template
    FROM sync_records
    WHERE store = 'programs'
      AND user_id IN (1, 2)
      AND data->>'name' ILIKE '%iron upper%'
      AND (data->>'deleted')::boolean IS NOT TRUE
    ORDER BY user_id
  `)

  // Déduplique par (user_id, id)
  const seen = new Set()
  const unique = progs.filter((p) => {
    const key = `${p.user_id}:${p.id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  for (const prog of unique) {
    const userId = prog.user_id
    const nowMs = userId === 1 ? Date.now() : 1
    const weekTemplate = JSON.parse(prog.week_template)

    const mondayWtId    = weekTemplate.monday
    const wednesdayWtId = weekTemplate.wednesday

    console.log(`\n${'═'.repeat(60)}`)
    console.log(`Programme "${prog.name}" | user:${userId} | id=${prog.id}`)
    console.log(`  monday    → ${mondayWtId ?? '(non assigné)'}`)
    console.log(`  wednesday → ${wednesdayWtId ?? '(non assigné)'}`)

    // Couples (workoutTemplateId, exerciceId) à insérer
    const toInsert = [
      { wtId: mondayWtId,    exId: 'seed-glute-bridge',    label: 'Glute bridge → Lundi' },
      { wtId: wednesdayWtId, exId: 'seed-leg-curl-allonge', label: 'Leg curl allongé → Mercredi' },
    ]

    for (const { wtId, exId, label } of toInsert) {
      if (!wtId) {
        console.log(`  ⚠️  ${label} : pas de WT assigné, skip`)
        continue
      }

      // Vérifier si le WET existe déjà
      const { rows: existing } = await client.query(`
        SELECT id FROM sync_records
        WHERE store = 'workoutExerciseTemplates'
          AND user_id = $1
          AND data->>'workoutTemplateId' = $2
          AND data->>'exerciseId' = $3
          AND (data->>'deleted')::boolean IS NOT TRUE
        LIMIT 1
      `, [userId, wtId, exId])

      if (existing.length > 0) {
        console.log(`  ⏭️  ${label} : WET déjà présent, skip`)
        continue
      }

      // Ordre max existant dans ce workoutTemplate
      const { rows: orderRows } = await client.query(`
        SELECT COALESCE(MAX((data->>'order')::int), -1) AS max_order
        FROM sync_records
        WHERE store = 'workoutExerciseTemplates'
          AND user_id = $1
          AND data->>'workoutTemplateId' = $2
          AND (data->>'deleted')::boolean IS NOT TRUE
      `, [userId, wtId])

      const nextOrder = (orderRows[0]?.max_order ?? -1) + 1
      const wetId = `finisher-${exId}-${userId}-${wtId.slice(0, 8)}`

      const wetData = {
        id: wetId,
        workoutTemplateId: wtId,
        exerciseId: exId,
        order: nextOrder,
        supersetGroup: null,
        targetSets: 2,
        repsMode: 'fixed',
        targetRepsMin: 10,
        targetRepsMax: 10,
        targetDurationSec: null,
        targetRPE: null,
        restSec: 60,
        autoProgress: false,
        progressStepKg: 2.5,
        isWarmup: false,
        isAb: false,
        updatedAt: nowMs,
        deleted: false,
        createdAt: nowMs,
      }

      await client.query(`
        INSERT INTO sync_records (id, user_id, store, data, updated_at)
        VALUES ($1, $2, 'workoutExerciseTemplates', $3::jsonb, $4)
        ON CONFLICT (user_id, store, id) DO UPDATE
          SET data = EXCLUDED.data,
              updated_at = EXCLUDED.updated_at,
              server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))
      `, [wetId, userId, JSON.stringify(wetData), nowMs])

      console.log(`  ✅ ${label} : WET créé (order=${nextOrder}, 2×10, repos 60s)`)
    }
  }

  console.log('\n✅ Terminé — synchro ≤ 20 s.')
} finally {
  client.release()
  await pool.end()
}
