import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL??process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} })
const client = await pool.connect()
const NOW = Date.now()

const RENAMES = {
  'seed-hip-abduction':         'Machine abducteurs',   // cuisses extérieures
  'seed-hip-adduction-machine': 'Machine adducteurs',   // cuisses intérieures
}

try {
  for (const [id, newName] of Object.entries(RENAMES)) {
    const { rowCount } = await client.query(`
      UPDATE sync_records
      SET data = jsonb_set(jsonb_set(data, '{name}', to_jsonb($1::text)), '{updatedAt}', to_jsonb($2::bigint)),
          updated_at = $2,
          server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))
      WHERE store='exercises' AND id=$3
        AND (data->>'deleted')::boolean IS NOT TRUE
    `, [newName, NOW, id])
    console.log(`✅ "${id}" → "${newName}" (${rowCount} ligne(s))`)
  }
  console.log('\nSynchro dans ≤ 20 s.')
} finally { client.release(); await pool.end() }
