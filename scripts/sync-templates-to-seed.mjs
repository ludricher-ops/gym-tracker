// Propage tous les programmes isTemplate:true de user:1 vers user:2 (seed)
// Inclut workoutTemplates + workoutExerciseTemplates associés
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const client = await pool.connect()

const upsertSeed = async (u2, store, id, data) => {
  const full = { ...data, updatedAt: 1, dirty: true }
  await client.query(`
    INSERT INTO sync_records (user_id, store, id, data, updated_at)
    VALUES ($1, $2, $3, $4::jsonb, 1)
    ON CONFLICT (user_id, store, id) DO UPDATE
      SET data = EXCLUDED.data,
          updated_at = 1,
          server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))
  `, [u2, store, id, JSON.stringify(full)])
}

try {
  const { rows: [{ user_id: u2 }] } = await client.query(
    `SELECT user_id FROM sync_records WHERE user_id != 1 LIMIT 1`
  )

  // 1. Programmes template de user:1
  const { rows: programs } = await client.query(`
    SELECT id, data FROM sync_records
    WHERE store = 'programs' AND user_id = 1
      AND (data->>'isTemplate')::boolean IS TRUE
      AND (data->>'deleted')::boolean IS NOT TRUE
  `)
  console.log(`${programs.length} programme(s) template trouvé(s) chez user:1`)

  let wt_count = 0, wet_count = 0

  for (const prog of programs) {
    await upsertSeed(u2, 'programs', prog.id, prog.data)
    console.log(`  📋 programme "${prog.data.name}" (${prog.id})`)

    // 2. WorkoutTemplates de ce programme
    const { rows: wts } = await client.query(`
      SELECT id, data FROM sync_records
      WHERE store = 'workoutTemplates' AND user_id = 1
        AND data->>'programId' = $1
        AND (data->>'deleted')::boolean IS NOT TRUE
    `, [prog.id])
    for (const wt of wts) {
      await upsertSeed(u2, 'workoutTemplates', wt.id, wt.data)
      wt_count++

      // 3. WETs de cette workoutTemplate
      const { rows: wets } = await client.query(`
        SELECT id, data FROM sync_records
        WHERE store = 'workoutExerciseTemplates' AND user_id = 1
          AND data->>'workoutTemplateId' = $1
          AND (data->>'deleted')::boolean IS NOT TRUE
      `, [wt.id])
      for (const wet of wets) {
        await upsertSeed(u2, 'workoutExerciseTemplates', wet.id, wet.data)
        wet_count++
      }
    }
    console.log(`     → ${wts.length} séances, ${wet_count} exercices`)
  }

  console.log(`\n✅ ${programs.length} template(s) propagé(s) : ${wt_count} séances + ${wet_count} WETs vers user:${u2}. Synchro ≤ 20 s.`)
} finally {
  client.release()
  await pool.end()
}
