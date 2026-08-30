// Liste tous les exercices bas du corps disponibles dans le DB
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL??process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} })
const client = await pool.connect()
try {
  const { rows } = await client.query(`
    SELECT DISTINCT ON (id)
           id,
           data->>'name' AS name,
           data->>'muscleGroup' AS muscle,
           data->>'equipment' AS equipment,
           data->>'trackingType' AS tracking
    FROM sync_records
    WHERE store='exercises'
      AND (data->>'deleted')::boolean IS NOT TRUE
      AND user_id = (
        SELECT user_id FROM sync_records GROUP BY user_id ORDER BY COUNT(*) DESC LIMIT 1
      )
    ORDER BY id, data->>'muscleGroup', data->>'name'
  `)

  // Grouper par muscle
  const byMuscle = {}
  for (const r of rows) {
    const m = r.muscle ?? 'autre'
    ;(byMuscle[m] ??= []).push(r)
  }

  for (const [muscle, exs] of Object.entries(byMuscle).sort()) {
    console.log(`\n── ${muscle.toUpperCase()} ──`)
    for (const e of exs) {
      console.log(`  ${e.name} [${e.equipment ?? '-'}] [${e.tracking ?? '-'}]`)
    }
  }

  console.log(`\nTotal : ${rows.length} exercices`)
} finally {
  client.release()
  await pool.end()
}
