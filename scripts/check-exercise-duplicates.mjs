// Trouve les exercices en doublon par nom dans la DB (tous users)
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL??process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} })
const client = await pool.connect()
try {
  const { rows } = await client.query(`
    SELECT
      user_id,
      id,
      data->>'name' AS name,
      data->>'equipment' AS equipment,
      data->'media'->>'url' AS img
    FROM sync_records
    WHERE store='exercises'
      AND (data->>'deleted')::boolean IS NOT TRUE
    ORDER BY data->>'name', user_id
  `)

  // Grouper par nom (tous users confondus)
  const byName = {}
  for (const r of rows) {
    ;(byName[r.name] ??= []).push(r)
  }

  const dupes = Object.entries(byName).filter(([, v]) => v.length > 1)
  console.log(`${dupes.length} noms en doublon :\n`)
  for (const [name, list] of dupes) {
    console.log(`"${name}"`)
    for (const r of list) {
      const hasImg = r.img ? '✅' : '🔴'
      console.log(`  user:${r.user_id} id:${r.id} ${hasImg}`)
    }
  }

  if (dupes.length === 0) console.log('Aucun doublon trouvé.')
} finally {
  client.release()
  await pool.end()
}
