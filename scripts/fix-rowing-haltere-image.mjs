// Met à jour l'image de "Rowing haltère" (bilatéral) pour user:1 et user:2 (seed)
// Le GIF unilatéral était incorrect ; on remplace par le Bent Over Dumbbell Row.
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const client = await pool.connect()

const NEW_URL = 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Bent-Over-Dumbbell-Row.gif'

try {
  // Trouver "Rowing haltère" (sans Droit/Gauche) chez user:1
  const { rows } = await client.query(`
    SELECT id, data->>'name' AS name, user_id
    FROM sync_records
    WHERE store = 'exercises'
      AND user_id IN (1, 2)
      AND data->>'name' ILIKE 'rowing halt%'
      AND data->>'name' NOT ILIKE '%gauche%'
      AND data->>'name' NOT ILIKE '%droit%'
      AND (data->>'deleted')::boolean IS NOT TRUE
    ORDER BY user_id
  `)

  if (rows.length === 0) {
    console.log('❌ Exercice "Rowing haltère" introuvable')
    process.exit(1)
  }

  for (const { id, name, user_id } of rows) {
    console.log(`Mise à jour user:${user_id} — "${name}" (${id})`)
    const updatedAt = user_id === 1 ? Date.now() : 1

    await client.query(`
      UPDATE sync_records
      SET data = jsonb_set(
            jsonb_set(
              jsonb_set(data, '{media,url}', $1::jsonb),
              '{media,importedAt}', $2::jsonb
            ),
            '{updatedAt}', $3::jsonb
          ),
          updated_at = $4,
          server_seq = nextval(pg_get_serial_sequence('sync_records', 'server_seq'))
      WHERE store = 'exercises' AND user_id = $5 AND id = $6
    `, [
      JSON.stringify(NEW_URL),
      JSON.stringify(Date.now()),
      JSON.stringify(updatedAt),
      updatedAt,
      user_id,
      id,
    ])
    console.log(`  ✅ Image mise à jour`)
  }

  console.log(`\n✅ Terminé — synchro ≤ 20 s.`)
} finally {
  client.release()
  await pool.end()
}
