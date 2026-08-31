import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const { rows } = await pool.query(`
  SELECT user_id, id, data->>'name' AS name, data->>'weekTemplate' AS wt, data->>'sessionsPerWeek' AS spw
  FROM sync_records
  WHERE store='programs' AND user_id IN (1,2)
    AND data->>'name' ILIKE '%iron upper%'
    AND (data->>'deleted')::boolean IS NOT TRUE
  ORDER BY user_id
`)
for (const r of rows) {
  console.log(`user:${r.user_id} | ${r.name} | spw=${r.spw} | id=${r.id}`)
  console.log('  weekTemplate:', JSON.stringify(JSON.parse(r.wt)))
}
await pool.end()
