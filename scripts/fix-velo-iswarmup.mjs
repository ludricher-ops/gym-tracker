// Ajoute isWarmup: true sur les WETs Vélo des programmes Iron Upper.
// Usage : railway run node scripts/fix-velo-iswarmup.mjs
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL??process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} })
const client = await pool.connect()
const NOW = Date.now()
try {
  // WETs qui pointent vers l'exercice Vélo dans les séances Iron Upper
  const { rows: progRows } = await client.query(`
    SELECT id FROM sync_records
    WHERE store='programs' AND data->>'name' ILIKE '%iron%'
      AND (data->>'deleted')::boolean IS NOT TRUE
  `)
  const progIds = progRows.map(p => p.id)

  const { rows: wtRows } = await client.query(`
    SELECT id FROM sync_records
    WHERE store='workoutTemplates' AND data->>'programId'=ANY($1)
      AND (data->>'deleted')::boolean IS NOT TRUE
  `, [progIds])
  const wtIds = wtRows.map(w => w.id)

  // Exercice Vélo
  const { rows: veloEx } = await client.query(`
    SELECT id FROM sync_records WHERE store='exercises' AND data->>'name'='Vélo'
      AND (data->>'deleted')::boolean IS NOT TRUE LIMIT 1
  `)
  const veloId = veloEx[0]?.id
  if (!veloId) { console.error('❌ Exercice Vélo introuvable'); process.exit(1) }

  // WETs Vélo dans ces séances qui n'ont pas isWarmup
  const { rows: wets } = await client.query(`
    SELECT id, data FROM sync_records
    WHERE store='workoutExerciseTemplates'
      AND data->>'workoutTemplateId'=ANY($1)
      AND data->>'exerciseId'=$2
      AND (data->>'deleted')::boolean IS NOT TRUE
  `, [wtIds, veloId])

  console.log(`${wets.length} WET(s) Vélo trouvé(s)`)

  let updated = 0
  for (const w of wets) {
    const newData = { ...w.data, isWarmup: true, updatedAt: NOW }
    await client.query(`
      UPDATE sync_records
      SET data = $1::jsonb,
          updated_at = $2,
          server_seq = nextval(pg_get_serial_sequence('sync_records', 'server_seq'))
      WHERE store='workoutExerciseTemplates' AND id=$3
    `, [JSON.stringify(newData), NOW, w.id])
    console.log(`  ✅ ${w.id.slice(0,8)}… → isWarmup: true`)
    updated++
  }

  console.log(`\n✅ ${updated} WET(s) mis à jour. Synchro dans ≤ 20 s.`)
} finally {
  client.release()
  await pool.end()
}
