import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL??process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} })
const client = await pool.connect()
try {
  const { rows } = await client.query(`
    SELECT user_id::text as uid, COUNT(*) as n
    FROM sync_records
    GROUP BY user_id
    ORDER BY n DESC
  `)
  console.log(`${rows.length} user(s) en base :`)
  for (const r of rows) {
    const short = String(r.uid).slice(0,20)
    console.log(`  ${short}…  (${r.n} records)`)
  }

  // Doublons : même (store, id) mais user_id différent ?
  const { rows: dups } = await client.query(`
    SELECT store, id, COUNT(DISTINCT user_id) as users
    FROM sync_records
    WHERE store = 'exercises'
    GROUP BY store, id
    HAVING COUNT(DISTINCT user_id) > 1
    LIMIT 5
  `)
  console.log(`\nExercices partagés entre plusieurs users : ${dups.length}`)
  for (const d of dups) console.log(`  [${d.store}] ${d.id} → ${d.users} users`)
} finally {
  client.release()
  await pool.end()
}
