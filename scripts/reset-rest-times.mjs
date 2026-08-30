// Met restSec=0 sur tous les WETs (user:1 et seed user:2)
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const client = await pool.connect()
const NOW = Date.now()

try {
  // user:1 — données réelles
  const { rowCount: r1 } = await client.query(`
    UPDATE sync_records
    SET data = jsonb_set(
          jsonb_set(data, '{restSec}', '0'::jsonb),
          '{updatedAt}', to_jsonb($1::bigint)
        ),
        updated_at = $1,
        server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))
    WHERE store = 'workoutExerciseTemplates'
      AND user_id = 1
      AND (data->>'deleted')::boolean IS NOT TRUE
      AND (data->>'restSec')::numeric != 0
  `, [NOW])
  console.log(`✅ user:1 — ${r1} WET(s) mis à restSec=0`)

  // user:2 (seed) — updatedAt=1 pour que les données user gagnent toujours
  const { rows } = await client.query(`SELECT user_id FROM sync_records WHERE user_id != 1 LIMIT 1`)
  const u2 = rows[0]?.user_id
  if (u2) {
    const { rowCount: r2 } = await client.query(`
      UPDATE sync_records
      SET data = jsonb_set(
            jsonb_set(data, '{restSec}', '0'::jsonb),
            '{updatedAt}', '1'::jsonb
          ),
          updated_at = 1,
          server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))
      WHERE store = 'workoutExerciseTemplates'
        AND user_id = $1
        AND (data->>'deleted')::boolean IS NOT TRUE
        AND (data->>'restSec')::numeric != 0
    `, [u2])
    console.log(`✅ user:${u2} (seed) — ${r2} WET(s) mis à restSec=0`)
  }

  console.log('\n✅ Tous les temps de repos supprimés. Synchro dans ≤ 20 s.')
} finally {
  client.release()
  await pool.end()
}
