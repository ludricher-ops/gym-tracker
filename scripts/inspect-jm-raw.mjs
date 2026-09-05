// Inspecte la structure brute des WTs JM Phase 2.
// Usage : railway run node scripts/inspect-jm-raw.mjs
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const client = await pool.connect()

const { rows: progs } = await client.query(`
  SELECT id, data->>'name' AS name FROM sync_records
  WHERE store='programs' AND user_id=1 AND data->>'name' ILIKE '%JM-Phase 2%'
    AND (data->>'deleted')::boolean IS NOT TRUE
`)
console.log('Programmes JM Phase 2 :', progs)

if (progs.length === 0) { client.release(); await pool.end(); process.exit(1) }
const progId = progs[0].id

const { rows: wts } = await client.query(`
  SELECT id, data FROM sync_records
  WHERE store='workoutTemplates' AND user_id=1 AND data->>'programId'=$1
    AND (data->>'deleted')::boolean IS NOT TRUE
  LIMIT 3
`, [progId])

wts.forEach(r => console.log('\n---\n', JSON.stringify(r.data, null, 2)))

// Un WET
const { rows: wets } = await client.query(`
  SELECT id, data FROM sync_records
  WHERE store='workoutExerciseTemplates' AND user_id=1
    AND data->>'workoutTemplateId'=$1
    AND (data->>'deleted')::boolean IS NOT TRUE
  LIMIT 2
`, [wts[0]?.id ?? ''])
wets.forEach(r => console.log('\nWET:', JSON.stringify(r.data, null, 2)))

client.release()
await pool.end()
