import pkg from 'pg'
const { Pool } = pkg
const pool = new Pool({
  connectionString: 'postgresql://postgres:GSjxCCiPcnLMMROqkRpNzjoBrRUYYqTs@autorack.proxy.rlwy.net:29368/railway',
  ssl: { rejectUnauthorized: false }
})

const ADMIN = 1
const SRC   = 5
const PROG_IDS = ['tpl-wb-prog', 'tpl-wm-prog']

const client = await pool.connect()
try {
  await client.query('BEGIN')

  // 1. Récupère les workout template IDs liés à ces programmes (chez user 5)
  const { rows: wtRows } = await client.query(
    `SELECT id FROM sync_records
     WHERE user_id=$1 AND store='workoutTemplates'
       AND data->>'programId' = ANY($2)
       AND (data->>'deleted')::boolean IS NOT TRUE`,
    [SRC, PROG_IDS]
  )
  const wtIds = wtRows.map(r => r.id)
  console.log(`workout templates à migrer: ${wtIds.length}`, wtIds)

  // 2. Copie programmes
  const { rows: progs } = await client.query(
    `SELECT id, data, updated_at FROM sync_records
     WHERE user_id=$1 AND store='programs' AND id=ANY($2)`,
    [SRC, PROG_IDS]
  )
  for (const r of progs) {
    await client.query(
      `INSERT INTO sync_records (user_id, store, id, data, updated_at)
       VALUES ($1, 'programs', $2, $3::jsonb, $4)
       ON CONFLICT (user_id, store, id) DO UPDATE
         SET data=EXCLUDED.data, updated_at=EXCLUDED.updated_at,
             server_seq=nextval(pg_get_serial_sequence('sync_records','server_seq'))`,
      [ADMIN, r.id, JSON.stringify(r.data), r.updated_at]
    )
  }
  console.log(`${progs.length} programme(s) copié(s) vers admin`)

  // 3. Copie workout templates
  if (wtIds.length > 0) {
    const { rows: wts } = await client.query(
      `SELECT id, data, updated_at FROM sync_records
       WHERE user_id=$1 AND store='workoutTemplates' AND id=ANY($2)`,
      [SRC, wtIds]
    )
    for (const r of wts) {
      await client.query(
        `INSERT INTO sync_records (user_id, store, id, data, updated_at)
         VALUES ($1, 'workoutTemplates', $2, $3::jsonb, $4)
         ON CONFLICT (user_id, store, id) DO UPDATE
           SET data=EXCLUDED.data, updated_at=EXCLUDED.updated_at,
               server_seq=nextval(pg_get_serial_sequence('sync_records','server_seq'))`,
        [ADMIN, r.id, JSON.stringify(r.data), r.updated_at]
      )
    }
    console.log(`${wts.length} workout template(s) copié(s) vers admin`)

    // 4. Copie workout exercise templates
    const { rows: wets } = await client.query(
      `SELECT id, data, updated_at FROM sync_records
       WHERE user_id=$1 AND store='workoutExerciseTemplates'
         AND data->>'workoutTemplateId' = ANY($2)
         AND (data->>'deleted')::boolean IS NOT TRUE`,
      [SRC, wtIds]
    )
    for (const r of wets) {
      await client.query(
        `INSERT INTO sync_records (user_id, store, id, data, updated_at)
         VALUES ($1, 'workoutExerciseTemplates', $2, $3::jsonb, $4)
         ON CONFLICT (user_id, store, id) DO UPDATE
           SET data=EXCLUDED.data, updated_at=EXCLUDED.updated_at,
               server_seq=nextval(pg_get_serial_sequence('sync_records','server_seq'))`,
        [ADMIN, r.id, JSON.stringify(r.data), r.updated_at]
      )
    }
    console.log(`${wets.length} exercise template(s) copié(s) vers admin`)

    // 5. Supprime les originaux de user 5
    await client.query(
      `DELETE FROM sync_records WHERE user_id=$1 AND store='workoutExerciseTemplates'
       AND data->>'workoutTemplateId' = ANY($2)`,
      [SRC, wtIds]
    )
    await client.query(
      `DELETE FROM sync_records WHERE user_id=$1 AND store='workoutTemplates' AND id=ANY($2)`,
      [SRC, wtIds]
    )
  }
  await client.query(
    `DELETE FROM sync_records WHERE user_id=$1 AND store='programs' AND id=ANY($2)`,
    [SRC, PROG_IDS]
  )
  console.log('Originaux supprimés de user 5')

  await client.query('COMMIT')
  console.log('\n✅ COMMIT OK')
} catch (err) {
  await client.query('ROLLBACK')
  console.error('❌ ROLLBACK:', err.message)
  process.exit(1)
} finally {
  client.release()
  await pool.end()
}
