// Supprime les objets media sans URL (résidu du script populate qui stockait
// un objet vide quand gifUrl était absent de la réponse ExerciseDB free tier).
// Usage : railway run node scripts/cleanup-broken-media.mjs

import pg from 'pg'

const { Pool } = pg

const connString = process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL
if (!connString) { console.error('❌ DATABASE_PUBLIC_URL requis.'); process.exit(1) }

const pool = new Pool({ connectionString: connString, ssl: { rejectUnauthorized: false } })

async function run() {
  const client = await pool.connect()
  try {
    // Exercices avec un objet media mais sans url → on retire le champ media
    // et on bumpe server_seq pour que les clients reçoivent la correction.
    const { rowCount } = await client.query(
      `UPDATE sync_records
       SET data       = data - 'media',
           updated_at = $1,
           server_seq = nextval(pg_get_serial_sequence('sync_records', 'server_seq'))
       WHERE store = 'exercises'
         AND data ? 'media'
         AND data->'media'->>'url' IS NULL
         AND (data->>'deleted')::boolean IS NOT TRUE`,
      [Date.now()],
    )
    console.log(`✅ ${rowCount} exercice(s) nettoyé(s) — champ media retiré.`)
    console.log('   Lance l\'app et attends la synchro (≤ 20 s) — le bouton "Importer" réapparaîtra.')
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(console.error)
