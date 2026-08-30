// Supprime les templates Iron Upper et BW ajoutés par buildTemplateRecords
// (préfixes tpl-iu-* et tpl-bw-*) — les versions créées par les scripts
// recreate-iron-upper.mjs et create-sans-materiel.mjs sont conservées.
// Usage : railway run node scripts/delete-tpl-iu-bw.mjs

import pg from 'pg'

const { Pool } = pg

const connString = process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL
if (!connString) { console.error('❌ DATABASE_PUBLIC_URL ou DATABASE_URL requis.'); process.exit(1) }

const pool = new Pool({ connectionString: connString, ssl: { rejectUnauthorized: false } })

async function run() {
  const client = await pool.connect()
  try {
    const NOW = Date.now()
    const { rowCount } = await client.query(
      `UPDATE sync_records
       SET data = jsonb_set(
             jsonb_set(data, '{deleted}', 'true'::jsonb),
             '{updatedAt}', to_jsonb($1::bigint)
           ),
           updated_at = $1,
           server_seq = nextval(pg_get_serial_sequence('sync_records', 'server_seq'))
       WHERE (
         (store = 'programs' AND (id = 'tpl-iu-prog' OR id = 'tpl-bw-prog'))
         OR (store = 'workoutTemplates' AND (id LIKE 'tpl-iu-%' OR id LIKE 'tpl-bw-%'))
         OR (store = 'workoutExerciseTemplates' AND (id LIKE 'tpl-iu-%' OR id LIKE 'tpl-bw-%'))
       )`,
      [NOW],
    )
    console.log(`✅ ${rowCount} enregistrement(s) supprimés (tpl-iu-* et tpl-bw-*).`)
    console.log('   Synchro automatique dans l\'app — les doublons disparaîtront dans ≤ 20 s.')
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(console.error)
