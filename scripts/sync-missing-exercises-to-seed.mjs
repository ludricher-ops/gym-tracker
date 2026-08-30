// Copie les exercices présents chez user:1 mais absents du seed (user:2)
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const client = await pool.connect()
try {
  const { rows: [{ user_id: u2 }] } = await client.query(`SELECT user_id FROM sync_records WHERE user_id != 1 LIMIT 1`)

  const { rows: missing } = await client.query(`
    SELECT u1.id, u1.data
    FROM sync_records u1
    WHERE u1.store='exercises' AND u1.user_id=1 AND (u1.data->>'deleted')::boolean IS NOT TRUE
      AND NOT EXISTS (
        SELECT 1 FROM sync_records u2
        WHERE u2.store='exercises' AND u2.user_id=$1 AND u2.id=u1.id
          AND (u2.data->>'deleted')::boolean IS NOT TRUE
      )
    ORDER BY u1.data->>'name'
  `, [u2])

  console.log(`${missing.length} exercice(s) à propager vers seed user:${u2}`)
  let done = 0
  for (const { id, data } of missing) {
    const seedData = { ...data, updatedAt: 1, dirty: true }
    await client.query(`
      INSERT INTO sync_records (user_id, store, id, data, updated_at)
      VALUES ($1, 'exercises', $2, $3::jsonb, 1)
      ON CONFLICT (user_id, store, id) DO UPDATE
        SET data = EXCLUDED.data, updated_at = 1,
            server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))
    `, [u2, id, JSON.stringify(seedData)])
    console.log(`  ✅ "${data.name}" (${id})`)
    done++
  }
  console.log(`\n✅ ${done} exercice(s) ajouté(s) au seed. Synchro ≤ 20 s.`)
} finally { client.release(); await pool.end() }
