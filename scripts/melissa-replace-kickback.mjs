import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL??process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} })
const client = await pool.connect()
const NOW = Date.now()
try {
  // ID de Fente curtsy
  const { rows: ex } = await client.query(`
    SELECT id FROM sync_records WHERE store='exercises'
      AND data->>'name'='Fente curtsy'
      AND (data->>'deleted')::boolean IS NOT TRUE LIMIT 1
  `)
  if (!ex[0]) throw new Error('Exercice "Fente curtsy" introuvable')
  const curtsy = ex[0].id
  console.log(`Fente curtsy id: ${curtsy}`)

  // WET kickback dans melissa-j1 (id: melissa-j1-02)
  // Fente curtsy = bodyweight reps_only → autoProgress:false, progressStepKg:0
  const newData = {
    id: 'melissa-j1-02',
    workoutTemplateId: 'melissa-j1',
    exerciseId: curtsy,
    order: 2,
    targetSets: 3,
    repsMode: 'fixed',
    targetRepsMin: 12,
    autoProgress: false,
    progressStepKg: 0,
    restSec: 60,
    deleted: false,
    dirty: true,
    updatedAt: NOW,
  }

  await client.query(`
    UPDATE sync_records
    SET data=$1::jsonb, updated_at=$2,
        server_seq=nextval(pg_get_serial_sequence('sync_records','server_seq'))
    WHERE store='workoutExerciseTemplates' AND id='melissa-j1-02'
  `, [JSON.stringify(newData), NOW])
  console.log('✅ Kickback remplacé par Fente curtsy dans Séance A')

  // Mettre à jour aussi dans le seed user:2
  await client.query(`
    INSERT INTO sync_records (user_id, store, id, data, updated_at)
    VALUES ((SELECT user_id FROM sync_records WHERE user_id!=1 LIMIT 1),
            'workoutExerciseTemplates','melissa-j1-02',$1::jsonb,1)
    ON CONFLICT (user_id, store, id) DO UPDATE
      SET data=jsonb_set(EXCLUDED.data,'{updatedAt}','1'::jsonb), updated_at=1,
          server_seq=nextval(pg_get_serial_sequence('sync_records','server_seq'))
  `, [JSON.stringify({ ...newData, updatedAt: 1 })])
  console.log('✅ Seed user:2 mis à jour')
  console.log('\nSynchro dans ≤ 20 s.')
} finally { client.release(); await pool.end() }
