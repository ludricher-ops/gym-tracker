// Tombstone les anciens abdos Melissa pour user:2 (seed)
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL??process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} })
const client = await pool.connect()
const NOW = 1  // LWW seed
try {
  const { user_id: u2 } = (await client.query(
    `SELECT user_id FROM sync_records WHERE user_id!=1 LIMIT 1`
  )).rows[0]

  let total = 0
  for (const wt of ['melissa-j1','melissa-j2','melissa-j3']) {
    const { rowCount } = await client.query(`
      UPDATE sync_records
      SET data=jsonb_set(jsonb_set(data,'{deleted}','true'::jsonb),'{updatedAt}',to_jsonb($1::bigint)),
          updated_at=$1,
          server_seq=nextval(pg_get_serial_sequence('sync_records','server_seq'))
      WHERE store='workoutExerciseTemplates' AND user_id=$2
        AND data->>'workoutTemplateId'=$3
        AND (data->>'isAb')::boolean IS TRUE
        AND id NOT LIKE 'melissa-%-ab%'   -- garder les nouveaux déjà insérés
        AND (data->>'deleted')::boolean IS NOT TRUE
    `, [NOW, u2, wt])
    console.log(`✅ ${wt} — ${rowCount} ancien(s) abdos seed supprimé(s)`)
    total += rowCount
  }
  console.log(`\n✅ ${total} anciens abdos supprimés du seed. Template Melissa à jour.`)
} finally { client.release(); await pool.end() }
