// Vérifie les sessionExercises Vélo dans les sessions récentes (Iron)
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL??process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} })
const client = await pool.connect()
try {
  // Exercice Vélo
  const { rows: veloEx } = await client.query(`
    SELECT id FROM sync_records WHERE store='exercises' AND data->>'name'='Vélo'
      AND (data->>'deleted')::boolean IS NOT TRUE LIMIT 1
  `)
  const veloId = veloEx[0]?.id
  if (!veloId) { console.error('❌ Exercice Vélo introuvable'); process.exit(1) }
  console.log(`Vélo exerciseId: ${veloId}`)

  // Sessions Iron récentes (30 derniers jours)
  const { rows: sessions } = await client.query(`
    SELECT id, data->>'name' AS name, data->>'startedAt' AS started
    FROM sync_records
    WHERE store='sessions'
      AND (data->>'deleted')::boolean IS NOT TRUE
      AND (data->>'startedAt')::bigint > $1
    ORDER BY (data->>'startedAt')::bigint DESC
    LIMIT 20
  `, [Date.now() - 30*24*60*60*1000])

  console.log(`\n${sessions.length} session(s) récente(s) :`)

  for (const sess of sessions) {
    const { rows: ses } = await client.query(`
      SELECT id, data->>'exerciseId' AS ex_id, data->>'isWarmup' AS iw, (data->>'order')::int AS ord
      FROM sync_records
      WHERE store='sessionExercises'
        AND data->>'sessionId'=$1
        AND (data->>'deleted')::boolean IS NOT TRUE
      ORDER BY (data->>'order')::int
    `, [sess.id])

    const veloSEs = ses.filter(s => s.ex_id === veloId)
    if (veloSEs.length > 0) {
      const d = new Date(Number(sess.started)).toLocaleDateString('fr-FR')
      console.log(`\nSession "${sess.name ?? '(sans nom)'}" [${d}]`)
      for (const se of ses) {
        const isVelo = se.ex_id === veloId
        const tag = isVelo ? ' ← VÉLO' : ''
        console.log(`  ord:${String(se.ord).padStart(2)} isWarmup:${se.iw}${tag}`)
      }
    }
  }
} finally {
  client.release()
  await pool.end()
}
