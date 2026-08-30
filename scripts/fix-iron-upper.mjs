// Corrections programme Iron Upper :
// 1. Poitrine+Dos : Rowing haltère (SS-B) → Pull-over haltère ; Écarté → SS-C + Oiseau
// 2. Épaules+Bras : Curl haltères + Curl marteau 3×20 → 3×12
import pg from 'pg'
import { randomUUID } from 'crypto'
const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const client = await pool.connect()

try {
  // ── 1. Récupérer les IDs d'exercices nécessaires (user:1) ──────────────
  const exQuery = await client.query(`
    SELECT id, data->>'name' AS name
    FROM sync_records
    WHERE store='exercises' AND user_id=1
      AND (data->>'deleted')::boolean IS NOT TRUE
      AND data->>'name' ILIKE ANY(ARRAY[
        '%pull-over halt%', '%écarté halt%',
        '%oiseau (buste penché)%', '%curl halt%', '%curl marteau%',
        '%rowing halt%'
      ])
    ORDER BY data->>'name'
  `)

  const exByName = {}
  for (const r of exQuery.rows) exByName[r.name.toLowerCase()] = r.id
  console.log('Exercices trouvés :', exQuery.rows.map(r => `${r.name} → ${r.id}`).join('\n  '))

  const pullOverId = Object.entries(exByName).find(([k]) => k.includes('pull-over'))?.[1]
  const oiseauId   = Object.entries(exByName).find(([k]) => k.includes('oiseau'))?.[1]
  const ecartéId   = Object.entries(exByName).find(([k]) => k.includes('écarté'))?.[1]
  const curlHaltId = Object.entries(exByName).find(([k]) => k.includes('curl halt'))?.[1]
  const curlMartId = Object.entries(exByName).find(([k]) => k.includes('curl marteau'))?.[1]

  if (!pullOverId || !oiseauId || !ecartéId || !curlHaltId || !curlMartId) {
    console.error('❌ Un ou plusieurs exercices introuvables :', { pullOverId, oiseauId, ecartéId, curlHaltId, curlMartId })
    process.exit(1)
  }
  console.log('\nIDs résolus :', { pullOverId, oiseauId, ecartéId, curlHaltId, curlMartId })

  // ── 2. Trouver tous les programmes Iron Upper ──────────────────────────
  const progsQ = await client.query(`
    SELECT id, user_id, data->>'name' AS name, data->>'isTemplate' AS is_template
    FROM sync_records
    WHERE store='programs' AND user_id IN (1,2)
      AND data->>'name' ILIKE '%iron upper%'
      AND (data->>'deleted')::boolean IS NOT TRUE
    ORDER BY user_id, data->>'name'
  `)
  console.log(`\n${progsQ.rows.length} programme(s) Iron Upper trouvé(s)`)

  for (const prog of progsQ.rows) {
    const userId = prog.user_id
    const now = userId === 1 ? Date.now() : 1
    console.log(`\n${'═'.repeat(60)}`)
    console.log(`Programme : "${prog.name}" | user:${userId} | template:${prog.is_template}`)
    console.log('═'.repeat(60))

    // Trouver les workoutTemplates de ce programme pour cet user
    const { rows: wts } = await client.query(`
      SELECT id, data->>'name' AS name
      FROM sync_records
      WHERE store='workoutTemplates' AND user_id=$1
        AND data->>'programId'=$2
        AND (data->>'deleted')::boolean IS NOT TRUE
    `, [userId, prog.id])

    for (const wt of wts) {
      const seance = wt.name

      // ── Poitrine + Dos ───────────────────────────────────────────────
      if (seance.toLowerCase().includes('poitrine')) {
        console.log(`\n  [Poitrine + Dos] workoutTemplate ${wt.id}`)

        const { rows: wets } = await client.query(`
          SELECT w.id, e.data->>'name' AS exname, e.id AS ex_id,
                 w.data->>'supersetGroup' AS ss,
                 w.data->>'order' AS ord,
                 w.data->>'targetSets' AS sets
          FROM sync_records w
          JOIN sync_records e ON e.store='exercises' AND e.user_id=$1 AND e.id=w.data->>'exerciseId'
          WHERE w.store='workoutExerciseTemplates' AND w.user_id=$1
            AND w.data->>'workoutTemplateId'=$2
            AND (w.data->>'deleted')::boolean IS NOT TRUE
          ORDER BY (w.data->>'order')::int
        `, [userId, wt.id])

        for (const wet of wets) {
          // a) Rowing haltère bilateral en SS-B → devient Pull-over haltère
          if (
            wet.exname.toLowerCase().includes('rowing halt') &&
            !wet.exname.toLowerCase().includes('droit') &&
            !wet.exname.toLowerCase().includes('gauche') &&
            wet.ss === 'B'
          ) {
            console.log(`    → Remplace Rowing haltère SS-B par Pull-over haltère (${wet.id})`)
            await client.query(`
              UPDATE sync_records
              SET data = jsonb_set(
                    jsonb_set(data, '{exerciseId}', $1::jsonb),
                    '{updatedAt}', $2::jsonb
                  ),
                  updated_at = $3,
                  server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))
              WHERE store='workoutExerciseTemplates' AND user_id=$4 AND id=$5
            `, [JSON.stringify(pullOverId), JSON.stringify(now), now, userId, wet.id])
            console.log('      ✅ exerciseId → Pull-over haltère')
          }

          // b) Écarté haltères (pas de SS) → SS-C
          if (wet.exname.toLowerCase().includes('écarté') && !wet.ss) {
            console.log(`    → Écarté haltères (ordre ${wet.ord}) passe en SS-C (${wet.id})`)
            await client.query(`
              UPDATE sync_records
              SET data = jsonb_set(
                    jsonb_set(data, '{supersetGroup}', '"C"'),
                    '{updatedAt}', $1::jsonb
                  ),
                  updated_at = $2,
                  server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))
              WHERE store='workoutExerciseTemplates' AND user_id=$3 AND id=$4
            `, [JSON.stringify(now), now, userId, wet.id])
            console.log('      ✅ supersetGroup → C')

            // c) Ajouter Oiseau (buste penché) en SS-C juste après Écarté
            const newOrd = parseInt(wet.ord) + 1
            const newId = `iron-oiseau-${userId}-${Date.now()}`
            // Décaler les exercices suivants
            await client.query(`
              UPDATE sync_records
              SET data = jsonb_set(data, '{order}', ((data->>'order')::int + 1)::text::jsonb),
                  updated_at = $1,
                  server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))
              WHERE store='workoutExerciseTemplates' AND user_id=$2
                AND data->>'workoutTemplateId'=$3
                AND (data->>'order')::int >= $4
                AND id != $5
                AND (data->>'deleted')::boolean IS NOT TRUE
            `, [now, userId, wt.id, newOrd, wet.id])

            const newData = {
              id: newId,
              workoutTemplateId: wt.id,
              exerciseId: oiseauId,
              targetSets: wet.sets ?? '3',
              targetRepsMin: '12',
              targetRepsMax: '12',
              targetDurationSec: null,
              supersetGroup: 'C',
              isWarmup: false,
              isAb: false,
              trackingType: 'weight_reps',
              order: newOrd,
              updatedAt: now,
              deleted: false,
            }
            await client.query(`
              INSERT INTO sync_records (id, user_id, store, data, updated_at)
              VALUES ($1, $2, 'workoutExerciseTemplates', $3::jsonb, $4)
              ON CONFLICT (user_id, store, id) DO UPDATE
                SET data = EXCLUDED.data,
                    updated_at = EXCLUDED.updated_at,
                    server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))
            `, [newId, userId, JSON.stringify(newData), now])
            console.log(`      ✅ Ajout Oiseau (buste penché) SS-C ordre ${newOrd}`)
          }
        }
      }

      // ── Épaules + Bras ───────────────────────────────────────────────
      if (seance.toLowerCase().includes('épaules')) {
        console.log(`\n  [Épaules + Bras] workoutTemplate ${wt.id}`)

        const { rows: wets } = await client.query(`
          SELECT w.id, e.data->>'name' AS exname,
                 w.data->>'targetRepsMin' AS rmin,
                 w.data->>'targetRepsMax' AS rmax
          FROM sync_records w
          JOIN sync_records e ON e.store='exercises' AND e.user_id=$1 AND e.id=w.data->>'exerciseId'
          WHERE w.store='workoutExerciseTemplates' AND w.user_id=$1
            AND w.data->>'workoutTemplateId'=$2
            AND (w.data->>'deleted')::boolean IS NOT TRUE
        `, [userId, wt.id])

        for (const wet of wets) {
          const isCurl = wet.exname.toLowerCase().includes('curl halt')
          const isMarteau = wet.exname.toLowerCase().includes('curl marteau')
          if ((isCurl || isMarteau) && (wet.rmin === '20' || wet.rmax === '20')) {
            console.log(`    → ${wet.exname} : ${wet.rmin}-${wet.rmax} reps → 12`)
            await client.query(`
              UPDATE sync_records
              SET data = jsonb_set(
                    jsonb_set(
                      jsonb_set(data, '{targetRepsMin}', '"12"'),
                      '{targetRepsMax}', '"12"'
                    ),
                    '{updatedAt}', $1::jsonb
                  ),
                  updated_at = $2,
                  server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))
              WHERE store='workoutExerciseTemplates' AND user_id=$3 AND id=$4
            `, [JSON.stringify(now), now, userId, wet.id])
            console.log('      ✅ reps → 12')
          }
        }
      }
    }
  }

  console.log('\n✅ Toutes les corrections appliquées — synchro ≤ 20 s.')
} finally {
  client.release()
  await pool.end()
}
