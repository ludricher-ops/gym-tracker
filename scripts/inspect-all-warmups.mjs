// Liste tous les programmes et leurs exercices d'échauffement (ord 20+)
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL??process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} })
const client = await pool.connect()
try {
  const { rows: progs } = await client.query(`
    SELECT id, data->>'name' AS name FROM sync_records
    WHERE store='programs' AND (data->>'deleted')::boolean IS NOT TRUE
    ORDER BY data->>'name'
  `)
  console.log(`${progs.length} programmes :\n`)

  for (const prog of progs) {
    const { rows: wts } = await client.query(`
      SELECT id, data->>'name' AS name FROM sync_records
      WHERE store='workoutTemplates' AND data->>'programId'=$1
        AND (data->>'deleted')::boolean IS NOT TRUE
    `, [prog.id])

    const wtIds = wts.map(w => w.id)
    if (!wtIds.length) { console.log(`[${prog.name}] — pas de séances`); continue }

    const { rows: wets } = await client.query(`
      SELECT wet.data->>'workoutTemplateId' AS wt_id,
             (wet.data->>'order')::int AS ord,
             ex.data->>'name' AS ex_name
      FROM sync_records wet
      LEFT JOIN sync_records ex ON ex.store='exercises' AND ex.id=wet.data->>'exerciseId'
      WHERE wet.store='workoutExerciseTemplates'
        AND (wet.data->>'deleted')::boolean IS NOT TRUE
        AND wet.data->>'workoutTemplateId'=ANY($1)
        AND (wet.data->>'order')::int >= 20
      ORDER BY wet.data->>'workoutTemplateId', (wet.data->>'order')::int
    `, [wtIds])

    if (!wets.length) {
      console.log(`[${prog.name}] — aucun échauffement (ord ≥20)`)
    } else {
      const byWt = {}
      for (const w of wets) {
        const wt = wts.find(t=>t.id===w.wt_id)
        const key = wt?.name ?? w.wt_id
        ;(byWt[key] ??= []).push(`ord:${w.ord} ${w.ex_name}`)
      }
      console.log(`[${prog.name}]`)
      for (const [sname, exs] of Object.entries(byWt)) {
        console.log(`  ${sname}: ${exs.join(' | ')}`)
      }
    }
    console.log()
  }
} finally {
  client.release()
  await pool.end()
}
