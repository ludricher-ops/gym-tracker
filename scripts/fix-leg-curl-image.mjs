import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL??process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} })
const client = await pool.connect()
const NOW = Date.now()
const URL = 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Leg-Curl.gif'
try {
  const { rowCount } = await client.query(`
    UPDATE sync_records
    SET data = jsonb_set(jsonb_set(data, '{media}', $1::jsonb), '{updatedAt}', to_jsonb($2::bigint)),
        updated_at=$2,
        server_seq=nextval(pg_get_serial_sequence('sync_records','server_seq'))
    WHERE store='exercises' AND id='seed-leg-curl-lying'
      AND (data->>'deleted')::boolean IS NOT TRUE
  `, [
    JSON.stringify({ type:'gif', mime:'image/gif', aspectRatio:1, sizeBytes:0, importedAt:NOW, url:URL }),
    NOW
  ])
  console.log(`✅ Leg curl allongé → image machine (${rowCount} ligne(s) mises à jour)`)
  console.log('Synchro dans ≤ 20 s.')
} finally { client.release(); await pool.end() }
