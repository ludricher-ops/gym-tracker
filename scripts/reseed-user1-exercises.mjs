// Re-insère les seed exercises pour user 1 (perdu lors de la dédup).
// Récupère les exercices de user 2 (qui a les seed-*) et les duplique pour user 1.
// Usage : railway run node scripts/reseed-user1-exercises.mjs
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL??process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} })
const client = await pool.connect()
try {
  // Identifier les users
  const { rows: users } = await client.query(`
    SELECT user_id, COUNT(*) as n
    FROM sync_records GROUP BY user_id ORDER BY n DESC
  `)
  console.log('Users :', users.map(u => `${u.user_id}(${u.n})`).join(', '))
  const user1 = users[0].user_id  // le + de records = le vrai user
  const user2 = users[1]?.user_id

  if (!user2) { console.log('✅ Un seul user, rien à faire.'); process.exit(0) }

  // Exercices que user 2 a mais pas user 1
  const { rows: missing } = await client.query(`
    SELECT u2.id, u2.data
    FROM sync_records u2
    WHERE u2.user_id = $2 AND u2.store = 'exercises'
      AND NOT EXISTS (
        SELECT 1 FROM sync_records u1
        WHERE u1.user_id = $1 AND u1.store = 'exercises' AND u1.id = u2.id
      )
  `, [user1, user2])
  console.log(`\n${missing.length} exercice(s) manquants pour user 1 :`)

  const NOW = Date.now()
  let inserted = 0
  for (const r of missing) {
    const data = { ...r.data, updatedAt: r.data.updatedAt ?? 1 }  // garde le LWW seed
    await client.query(`
      INSERT INTO sync_records (user_id, store, id, data, updated_at)
      VALUES ($1, 'exercises', $2, $3::jsonb, $4)
      ON CONFLICT DO NOTHING
    `, [user1, r.id, JSON.stringify(data), Math.max(data.updatedAt, 1)])
    console.log(`  ✅ ${data.name ?? r.id}`)
    inserted++
  }

  console.log(`\n── Résultat ──────────────────────────────────────────
   ✅ ${inserted} exercice(s) re-insérés pour user 1
   Synchro automatique dans ≤ 20 s.`)
} finally {
  client.release()
  await pool.end()
}
