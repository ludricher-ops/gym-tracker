// Copie les champs media manquants des exercices user:1 vers user:2 (seed)
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const client = await pool.connect()

try {
  const { rows: [{ user_id: u2 }] } = await client.query(
    `SELECT user_id FROM sync_records WHERE user_id != 1 LIMIT 1`
  )

  // Exercices user:1 qui ont un media
  const { rows: u1exs } = await client.query(`
    SELECT id, data->'media' AS media
    FROM sync_records
    WHERE store = 'exercises' AND user_id = 1
      AND (data->>'deleted')::boolean IS NOT TRUE
      AND data ? 'media'
      AND data->'media' IS NOT NULL
      AND data->>'media' != 'null'
  `)
  console.log(`user:1 — ${u1exs.length} exercice(s) avec media`)

  let updated = 0
  let skipped = 0

  for (const { id, media } of u1exs) {
    // Vérifier si user:2 a cet exercice sans media (ou avec un media différent)
    const { rows: [u2ex] } = await client.query(`
      SELECT id, data->'media' AS media
      FROM sync_records
      WHERE store = 'exercises' AND user_id = $1 AND id = $2
        AND (data->>'deleted')::boolean IS NOT TRUE
    `, [u2, id])

    if (!u2ex) { skipped++; continue } // l'exercice n'existe pas chez user:2

    const u2media = u2ex.media
    const mediaStr = JSON.stringify(media)
    if (JSON.stringify(u2media) === mediaStr) { skipped++; continue } // déjà identique

    // Appliquer le media de user:1 → user:2 (updatedAt=1 pour que user gagne)
    await client.query(`
      UPDATE sync_records
      SET data = jsonb_set(
            jsonb_set(data, '{media}', $1::jsonb),
            '{updatedAt}', '1'::jsonb
          ),
          updated_at = 1,
          server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))
      WHERE store = 'exercises' AND user_id = $2 AND id = $3
    `, [mediaStr, u2, id])
    console.log(`  ✅ ${id} → media copié vers user:${u2}`)
    updated++
  }

  console.log(`\n✅ ${updated} media propagé(s) vers seed, ${skipped} inchangé(s). Synchro ≤ 20 s.`)
} finally {
  client.release()
  await pool.end()
}
