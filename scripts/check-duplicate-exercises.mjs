// Vérifie les exercices en double (même nom, non supprimés)
// Usage : railway run node scripts/check-duplicate-exercises.mjs
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL??process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} })

const client = await pool.connect()
try {
  const { rows } = await client.query(`
    SELECT data->>'name' AS name, COUNT(*) AS cnt, array_agg(id ORDER BY id) AS ids,
           array_agg(data->>'updatedAt' ORDER BY id) AS updated_ats,
           array_agg(data->'media'->>'url' ORDER BY id) AS media_urls
    FROM sync_records
    WHERE store='exercises' AND (data->>'deleted')::boolean IS NOT TRUE
    GROUP BY data->>'name'
    HAVING COUNT(*) > 1
    ORDER BY name
  `)
  if (!rows.length) {
    console.log('✅ Aucun exercice en doublon.')
  } else {
    console.log(`❌ ${rows.length} exercice(s) en doublon :\n`)
    for (const r of rows) {
      console.log(`  ${r.cnt}x "${r.name}"`)
      r.ids.forEach((id, i) => {
        const hasMedia = r.media_urls[i] ? '📷' : '—'
        console.log(`    [${id}] updatedAt:${r.updated_ats[i]} ${hasMedia}`)
      })
    }
  }
} finally {
  client.release()
  await pool.end()
}
