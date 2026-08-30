// Inspecte et corrige les WETs Vélo Iron : targetSets, repsMode, targetDurationSec
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL??process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} })
const client = await pool.connect()
const NOW = Date.now()
try {
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

  const { rows: veloEx } = await client.query(`
    SELECT id, data FROM sync_records WHERE store='exercises' AND data->>'name'='Vélo'
      AND (data->>'deleted')::boolean IS NOT TRUE LIMIT 1
  `)
  const velo = veloEx[0]
  if (!velo) { console.error('❌ Exercice Vélo introuvable'); process.exit(1) }
  console.log(`Vélo exerciseId: ${velo.id}`)
  console.log(`Vélo trackingType: ${velo.data.trackingType}\n`)

  const { rows: wets } = await client.query(`
    SELECT id, data FROM sync_records
    WHERE store='workoutExerciseTemplates'
      AND data->>'workoutTemplateId'=ANY($1)
      AND data->>'exerciseId'=$2
      AND (data->>'deleted')::boolean IS NOT TRUE
  `, [wtIds, velo.id])

  console.log(`${wets.length} WET(s) Vélo avant correction :`)
  for (const w of wets) {
    console.log(`  ${w.id.slice(0,8)}… targetSets=${w.data.targetSets} repsMode=${w.data.repsMode} targetRepsMin=${w.data.targetRepsMin} targetDurationSec=${w.data.targetDurationSec} order=${w.data.order} isWarmup=${w.data.isWarmup}`)
  }

  // Correction : 1 set, 5 min (300s), repsMode fixed, 1 rep (= 1 durée)
  let updated = 0
  for (const w of wets) {
    const newData = {
      ...w.data,
      targetSets: 1,
      repsMode: 'fixed',
      targetRepsMin: 1,
      targetDurationSec: 300,
      autoProgress: false,
      progressStepKg: 0,
      restSec: 0,
      isWarmup: true,
      order: 1,
      updatedAt: NOW,
    }
    // Supprimer les champs parasites créés par replace-warmup-velo.mjs
    delete newData.sets
    await client.query(`
      UPDATE sync_records
      SET data = $1::jsonb,
          updated_at = $2,
          server_seq = nextval(pg_get_serial_sequence('sync_records', 'server_seq'))
      WHERE store='workoutExerciseTemplates' AND id=$3
    `, [JSON.stringify(newData), NOW, w.id])
    console.log(`  ✅ ${w.id.slice(0,8)}…`)
    updated++
  }

  console.log(`\n✅ ${updated} WET(s) corrigés (targetSets:1, repsMode:fixed, targetDurationSec:300). Synchro dans ≤ 20 s.`)
} finally {
  client.release()
  await pool.end()
}
