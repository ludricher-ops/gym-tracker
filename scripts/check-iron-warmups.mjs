import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL??process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} })
const client = await pool.connect()
try {
  const { rows: progs } = await client.query(`SELECT id FROM sync_records WHERE store='programs' AND data->>'name' ILIKE '%iron%' AND (data->>'deleted')::boolean IS NOT TRUE`)
  const progIds = progs.map(p => p.id)
  const { rows: wts } = await client.query(`SELECT id, data->>'name' AS name FROM sync_records WHERE store='workoutTemplates' AND data->>'programId'=ANY($1) AND (data->>'deleted')::boolean IS NOT TRUE`, [progIds])
  const wtIds = wts.map(w => w.id)

  // Tous les WETs triés par ordre, avec isWarmup
  const { rows } = await client.query(`
    SELECT DISTINCT ON (wet.id)
           wet.id,
           (wet.data->>'order')::int AS ord,
           wet.data->>'isWarmup' AS iw,
           ex.data->>'name' AS exname,
           wet.data->>'workoutTemplateId' AS wt_id
    FROM sync_records wet
    LEFT JOIN sync_records ex ON ex.store='exercises' AND ex.id=wet.data->>'exerciseId'
    WHERE wet.store='workoutExerciseTemplates'
      AND wet.data->>'workoutTemplateId'=ANY($1)
      AND (wet.data->>'deleted')::boolean IS NOT TRUE
    ORDER BY wet.id, (wet.data->>'order')::int
  `, [wtIds])

  const warmups = rows.filter(r => r.iw === 'true')
  console.log(`Exercices isWarmup:true dans Iron :\n`)
  const wt1 = wts[0]?.id
  const filtered = rows.filter(r => r.wt_id === wt1)
  console.log(`Séance : ${wts[0]?.name}`)
  for (const r of filtered) {
    const tag = r.iw === 'true' ? ' [WARMUP]' : ''
    console.log(`  ord:${String(r.ord).padStart(2)} – "${r.exname}"${tag}`)
  }

  console.log(`\nTotal isWarmup:true = ${warmups.length}`)
  for (const w of warmups) {
    const wt = wts.find(t => t.id === w.wt_id)
    console.log(`  ord:${w.ord} "${w.exname}" (${wt?.name ?? w.wt_id.slice(0,8)})`)
  }
} finally {
  client.release()
  await pool.end()
}
