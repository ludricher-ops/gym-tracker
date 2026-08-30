// Vérifie les images des exercices du programme Melissa
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL??process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} })
const client = await pool.connect()

const NEEDED = [
  'Hip thrust',
  'Kickback fessier poulie',
  'Fentes',
  'Abduction hanches',
  'Presse à cuisses',
  'Leg extension',
  'Leg curl allongé',
  'Squat bulgare',
  'Soulevé de terre jambes tendues',
  'Goblet squat',
  'Vélo',
]

try {
  const userId = (await client.query(`SELECT user_id FROM sync_records GROUP BY user_id ORDER BY COUNT(*) DESC LIMIT 1`)).rows[0].user_id

  for (const name of NEEDED) {
    const { rows } = await client.query(`
      SELECT id, data->>'name' AS name, data->'media' AS media
      FROM sync_records
      WHERE store='exercises' AND user_id=$1
        AND data->>'name' ILIKE $2
        AND (data->>'deleted')::boolean IS NOT TRUE
      LIMIT 1
    `, [userId, name])

    if (!rows[0]) {
      console.log(`❌ INTROUVABLE : "${name}"`)
      continue
    }
    const r = rows[0]
    const url = r.media?.url
    if (!url) {
      console.log(`🔴 PAS D'IMAGE : "${r.name}"`)
    } else {
      console.log(`✅ "${r.name}" → ${url.slice(0,80)}`)
    }
  }
} finally {
  client.release()
  await pool.end()
}
