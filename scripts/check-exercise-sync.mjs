import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const client = await pool.connect()
try {
  const { rows: [{ user_id: u2 }] } = await client.query(`SELECT user_id FROM sync_records WHERE user_id != 1 LIMIT 1`)

  const count = async (uid) => {
    const { rows: [r] } = await client.query(`SELECT COUNT(*) AS n FROM sync_records WHERE store='exercises' AND user_id=$1 AND (data->>'deleted')::boolean IS NOT TRUE`, [uid])
    return parseInt(r.n)
  }
  const withMedia = async (uid) => {
    const { rows: [r] } = await client.query(`SELECT COUNT(*) AS n FROM sync_records WHERE store='exercises' AND user_id=$1 AND (data->>'deleted')::boolean IS NOT TRUE AND data ? 'media' AND data->>'media' != 'null'`, [uid])
    return parseInt(r.n)
  }

  console.log(`user:1 — ${await count(1)} exercices, ${await withMedia(1)} avec image`)
  console.log(`user:${u2} (seed) — ${await count(u2)} exercices, ${await withMedia(u2)} avec image`)

  // Exercices dans user:1 mais pas dans user:2
  const { rows: missing } = await client.query(`
    SELECT u1.id, u1.data->>'name' AS name
    FROM sync_records u1
    WHERE u1.store='exercises' AND u1.user_id=1 AND (u1.data->>'deleted')::boolean IS NOT TRUE
      AND NOT EXISTS (
        SELECT 1 FROM sync_records u2
        WHERE u2.store='exercises' AND u2.user_id=$1 AND u2.id=u1.id
          AND (u2.data->>'deleted')::boolean IS NOT TRUE
      )
    ORDER BY u1.data->>'name'
  `, [u2])
  if (missing.length) {
    console.log(`\n⚠️  ${missing.length} exercice(s) user:1 absent(s) du seed :`)
    for (const r of missing) console.log(`  - ${r.id} "${r.name}"`)
  } else {
    console.log(`\n✅ Tous les exercices user:1 sont présents dans le seed`)
  }

  // Exercices avec image dans user:1 mais sans image dans user:2
  const { rows: noMedia } = await client.query(`
    SELECT u1.id, u1.data->>'name' AS name
    FROM sync_records u1
    WHERE u1.store='exercises' AND u1.user_id=1 AND (u1.data->>'deleted')::boolean IS NOT TRUE
      AND u1.data ? 'media' AND u1.data->>'media' != 'null'
      AND EXISTS (
        SELECT 1 FROM sync_records u2
        WHERE u2.store='exercises' AND u2.user_id=$1 AND u2.id=u1.id
          AND (u2.data->>'deleted')::boolean IS NOT TRUE
          AND (NOT u2.data ? 'media' OR u2.data->>'media' = 'null')
      )
    ORDER BY u1.data->>'name'
  `, [u2])
  if (noMedia.length) {
    console.log(`\n⚠️  ${noMedia.length} exercice(s) avec image chez user:1 mais sans image dans seed :`)
    for (const r of noMedia) console.log(`  - ${r.id} "${r.name}"`)
  } else {
    console.log(`✅ Toutes les images sont synchronisées dans le seed`)
  }
} finally { client.release(); await pool.end() }
