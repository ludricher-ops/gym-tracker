// Supprime les lignes dupliquées dans sync_records (même store+id).
// Pour chaque doublon, garde uniquement la ligne avec le server_seq le plus élevé.
// Usage : railway run node scripts/deduplicate-sync-records.mjs
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL??process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} })
const client = await pool.connect()

try {
  // 1. Compter les doublons avant
  const { rows: before } = await client.query(`
    SELECT COUNT(*) AS dups FROM (
      SELECT store, id FROM sync_records
      GROUP BY store, id HAVING COUNT(*) > 1
    ) t
  `)
  console.log(`Combinaisons (store,id) en double avant : ${before[0].dups}`)

  if (before[0].dups === '0') {
    console.log('✅ Aucun doublon à traiter.')
    process.exit(0)
  }

  // 2. Supprimer les lignes en double — garder le server_seq MAX pour chaque (store,id)
  const { rowCount } = await client.query(`
    DELETE FROM sync_records
    WHERE server_seq NOT IN (
      SELECT MAX(server_seq) FROM sync_records GROUP BY store, id
    )
  `)
  console.log(`🗑️  ${rowCount} ligne(s) dupliquée(s) supprimées.`)

  // 3. Vérifier après
  const { rows: after } = await client.query(`
    SELECT COUNT(*) AS dups FROM (
      SELECT store, id FROM sync_records
      GROUP BY store, id HAVING COUNT(*) > 1
    ) t
  `)
  console.log(`Combinaisons (store,id) en double après : ${after[0].dups}`)

  const { rows: total } = await client.query(`SELECT COUNT(*) FROM sync_records`)
  console.log(`Total lignes sync_records : ${total[0].count}`)
  console.log('\n✅ Déduplication terminée. Synchro automatique dans ≤ 20 s.')
} finally {
  client.release()
  await pool.end()
}
