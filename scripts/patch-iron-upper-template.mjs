// Passe Iron Upper de "Mes programmes" à "Templates" (isTemplate: true).
// Sécuritaire : trouve le programme par nom, ne modifie que isTemplate et isActive.
// Usage : railway run node scripts/patch-iron-upper-template.mjs

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
             jsonb_set(data, '{isTemplate}', 'true'::jsonb),
             '{isActive}', 'false'::jsonb
           ),
           updated_at = $1,
           server_seq = nextval(pg_get_serial_sequence('sync_records', 'server_seq'))
       WHERE store = 'programs'
         AND data->>'name' = 'Iron Upper'
         AND (data->>'deleted')::boolean IS NOT TRUE`,
      [NOW],
    )
    if (rowCount === 0) {
      console.log('⚠️  Aucun programme "Iron Upper" trouvé en base.')
    } else {
      console.log(`✅ Iron Upper → isTemplate: true, isActive: false (${rowCount} enregistrement mis à jour).`)
      console.log('   Lance l\'app et attends la synchro (≤ 20 s) — Iron Upper apparaîtra dans Templates.')
    }
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(console.error)
