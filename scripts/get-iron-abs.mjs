// Affiche les exercices abdos des 3 séances Iron Upper
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL??process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} })
const client = await pool.connect()
try {
  const { rows: wts } = await client.query(`
    SELECT wt.id, wt.data->>'name' AS wt_name
    FROM sync_records wt
    JOIN sync_records p ON p.store='programs' AND p.id=wt.data->>'programId'
    WHERE wt.store='workoutTemplates' AND p.data->>'name'='Iron Upper'
      AND (wt.data->>'deleted')::boolean IS NOT TRUE
      AND wt.user_id=1
    ORDER BY (wt.data->>'order')::int
  `)

  for (const wt of wts) {
    const { rows: abs } = await client.query(`
      SELECT wet.id, wet.data, ex.data->>'name' AS exname
      FROM sync_records wet
      LEFT JOIN sync_records ex ON ex.store='exercises' AND ex.id=wet.data->>'exerciseId'
      WHERE wet.store='workoutExerciseTemplates'
        AND wet.data->>'workoutTemplateId'=$1
        AND (wet.data->>'isAb')::boolean IS TRUE
        AND (wet.data->>'deleted')::boolean IS NOT TRUE
      ORDER BY (wet.data->>'order')::int
    `, [wt.id])

    console.log(`\n${wt.wt_name} (${wt.id})`)
    for (const r of abs) {
      const d = r.data
      const dur = d.targetDurationSec ? ` ${d.targetDurationSec}s` : ` ${d.targetRepsMin} reps`
      console.log(`  ord:${d.order} "${r.exname}" — ${d.targetSets}×${dur.trim()} repos:${d.restSec}s`)
      console.log(`    wet_id: ${r.id}`)
    }
  }
} finally { client.release(); await pool.end() }
