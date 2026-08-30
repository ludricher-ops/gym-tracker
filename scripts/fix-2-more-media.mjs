// Corrige Gainage latéral (PNG) et Rowing machine (Seated-Row-Machine.gif)
// trouvés après le premier fix-broken-media-urls.mjs.
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL??process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} })
const client = await pool.connect()
const NOW = Date.now()

const FIXES = {
  'Gainage latéral':  { url: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Side-Plank-1.png', type: 'photo', mime: 'image/png' },
  'Rowing machine':   { url: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Seated-Row-Machine.gif', type: 'gif', mime: 'image/gif' },
}

try {
  const { rows } = await client.query(`
    SELECT id, data->>'name' AS name FROM sync_records
    WHERE store='exercises' AND (data->>'deleted')::boolean IS NOT TRUE
      AND data->>'name' = ANY($1)
  `, [Object.keys(FIXES)])

  let updated = 0
  for (const row of rows) {
    const fix = FIXES[row.name]
    await client.query(`
      UPDATE sync_records
      SET data = jsonb_set(
            jsonb_set(data, '{media}', $1::jsonb),
            '{updatedAt}', to_jsonb($2::bigint)
          ),
          updated_at = $2,
          server_seq = nextval(pg_get_serial_sequence('sync_records', 'server_seq'))
      WHERE store='exercises' AND id=$3
    `, [
      JSON.stringify({ type: fix.type, url: fix.url, mime: fix.mime, aspectRatio: 1, sizeBytes: 0, importedAt: NOW }),
      NOW, row.id,
    ])
    console.log(`✅ "${row.name}"`)
    updated++
  }
  console.log(`\n${updated} enregistrement(s) mis à jour.`)
} finally {
  client.release()
  await pool.end()
}
