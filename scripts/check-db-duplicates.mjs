// Vérifie les vraies lignes dupliquées en base (même store+id)
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL??process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} })
const client = await pool.connect()
try {
  // Contraintes de la table
  const { rows: constraints } = await client.query(`
    SELECT constraint_name, constraint_type
    FROM information_schema.table_constraints
    WHERE table_name='sync_records'
  `)
  console.log('Contraintes sync_records :')
  for (const c of constraints) console.log(' ', c.constraint_type, c.constraint_name)

  // Vraies lignes dupliquées (même store+id, indépendamment des données)
  const { rows: dups } = await client.query(`
    SELECT store, id, COUNT(*) as cnt
    FROM sync_records
    GROUP BY store, id
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC, store, id
    LIMIT 10
  `)
  if (!dups.length) {
    console.log('\n✅ Aucune ligne dupliquée (store+id) en base.')
  } else {
    console.log(`\n❌ ${dups.length} combinaisons (store+id) en double :`)
    for (const d of dups) console.log(`  ${d.cnt}x [${d.store}] ${d.id}`)
  }

  // Total lignes exercises
  const { rows: total } = await client.query(`SELECT COUNT(*) FROM sync_records WHERE store='exercises'`)
  const { rows: unique } = await client.query(`SELECT COUNT(DISTINCT id) FROM sync_records WHERE store='exercises'`)
  console.log(`\nTotal exercices : ${total[0].count} lignes / ${unique[0].count} IDs uniques`)
} finally {
  client.release()
  await pool.end()
}
