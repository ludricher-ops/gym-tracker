// Supprime les templates built-in (Full Body 3× et Push Pull Legs) de la base.
// Le client recevra la suppression au prochain pull et les retirera de l'IDB.
// Usage : railway run node scripts/delete-builtin-templates.mjs

import pg from 'pg'

const { Pool } = pg

const connString = process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL
if (!connString) { console.error('❌ DATABASE_PUBLIC_URL requis.'); process.exit(1) }

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
         (store = 'programs' AND id IN ('tpl-fullbody3', 'tpl-ppl3'))
         OR (store = 'workoutTemplates' AND (id LIKE 'tpl-fullbody3-%' OR id LIKE 'tpl-ppl3-%'))
         OR (store = 'workoutExerciseTemplates' AND (id LIKE 'tpl-fullbody3-%' OR id LIKE 'tpl-ppl3-%'))
       )`,
      [NOW],
    )
    console.log(`✅ ${rowCount} enregistrement(s) marqués comme supprimés.`)
    console.log('   Lance l\'app et attends la synchro (≤ 20 s) — Full Body 3× et Push Pull Legs disparaîtront.')
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(console.error)
