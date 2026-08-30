import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL??process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} })
const client = await pool.connect()
try {
  const { rows } = await client.query(`
    SELECT user_id::text as uid, store, COUNT(*) as n
    FROM sync_records
    WHERE store IN ('exercises','programs','workoutTemplates','workoutExerciseTemplates','sets','sessions')
    GROUP BY user_id, store ORDER BY uid, store
  `)
  let cur = ''
  for (const r of rows) {
    if (r.uid !== cur) { cur = r.uid; console.log(`\nUser ${r.uid}:`) }
    console.log(`  ${r.store}: ${r.n}`)
  }
} finally {
  client.release()
  await pool.end()
}
