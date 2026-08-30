import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL??process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} })
const client = await pool.connect()
const NOW = Date.now()
try {
  const { rows } = await client.query(`
    SELECT id, data->>'name' AS name FROM sync_records
    WHERE store='exercises' AND user_id=1
      AND data->>'name'='Crunch bicyclette'
      AND id != 'seed-bicycle-crunch'
      AND (data->>'deleted')::boolean IS NOT TRUE
  `)
  console.log(`${rows.length} doublon(s) à supprimer :`)
  for (const r of rows) {
    await client.query(`
      UPDATE sync_records
      SET data = jsonb_set(jsonb_set(data, '{deleted}', 'true'::jsonb), '{updatedAt}', to_jsonb($1::bigint)),
          updated_at = $1,
          server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))
      WHERE store='exercises' AND user_id=1 AND id=$2
    `, [NOW, r.id])
    console.log(`  ✅ Supprimé : ${r.id}`)
  }
  if (rows.length === 0) console.log('  Aucun doublon trouvé.')
} finally { client.release(); await pool.end() }
