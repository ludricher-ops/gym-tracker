// Inspecte les programmes Iron (templates + workoutTemplates + exercises)
// Usage : railway run node scripts/inspect-iron-programs.mjs

import pg from 'pg'
const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function run() {
  const client = await pool.connect()
  try {
    // 1. Programmes "Iron"
    const { rows: progs } = await client.query(`
      SELECT id, data->>'name' AS name, data->>'color' AS color
      FROM sync_records
      WHERE store = 'programs'
        AND (data->>'deleted')::boolean IS NOT TRUE
        AND data->>'name' ILIKE '%iron%'
      ORDER BY data->>'name'
    `)
    console.log('\n── Programmes Iron ──────────────────────────────')
    for (const p of progs) console.log(`  [${p.id}] ${p.name}`)

    // 2. WorkoutTemplates liés
    const progIds = progs.map(p => p.id)
    if (!progIds.length) { console.log('Aucun programme Iron trouvé.'); return }

    const { rows: wts } = await client.query(`
      SELECT id, data->>'programId' AS program_id, data->>'name' AS name,
             data->>'dayOfWeek' AS day
      FROM sync_records
      WHERE store = 'workoutTemplates'
        AND (data->>'deleted')::boolean IS NOT TRUE
        AND data->>'programId' = ANY($1)
      ORDER BY data->>'programId', (data->>'dayOfWeek')::int
    `, [progIds])
    console.log('\n── Séances ──────────────────────────────────────')
    for (const w of wts) console.log(`  [${w.id}] ${w.name} (prog:${w.program_id}, jour:${w.day})`)

    // 3. WorkoutExerciseTemplates + nom exercice
    const wtIds = wts.map(w => w.id)
    if (!wtIds.length) return

    const { rows: wets } = await client.query(`
      SELECT wet.id,
             wet.data->>'workoutTemplateId' AS wt_id,
             wet.data->>'exerciseId' AS ex_id,
             ex.data->>'name' AS ex_name,
             wet.data->>'order' AS ord,
             wet.data->'sets' AS sets
      FROM sync_records wet
      LEFT JOIN sync_records ex
        ON ex.store = 'exercises'
        AND ex.id = wet.data->>'exerciseId'
        AND (ex.data->>'deleted')::boolean IS NOT TRUE
      WHERE wet.store = 'workoutExerciseTemplates'
        AND (wet.data->>'deleted')::boolean IS NOT TRUE
        AND wet.data->>'workoutTemplateId' = ANY($1)
      ORDER BY wet.data->>'workoutTemplateId', (wet.data->>'order')::int
    `, [wtIds])

    console.log('\n── Exercices par séance ──────────────────────────')
    let curWt = ''
    for (const r of wets) {
      const wt = wts.find(w => w.id === r.wt_id)
      if (r.wt_id !== curWt) {
        curWt = r.wt_id
        console.log(`\n  Séance : ${wt?.name ?? r.wt_id}`)
      }
      const sets = Array.isArray(r.sets) ? r.sets : []
      const setsStr = sets.map(s => {
        const parts = []
        if (s.reps) parts.push(`${s.reps}r`)
        if (s.weight) parts.push(`${s.weight}kg`)
        if (s.durationSec) parts.push(`${s.durationSec}s`)
        return parts.join('/')
      }).join(', ')
      console.log(`    [${r.id}] ord:${r.ord} – "${r.ex_name ?? r.ex_id}" sets:[${setsStr}]`)
    }
  } finally {
    client.release()
    await pool.end()
  }
}
run().catch(console.error)
