// Vérifie si les séances et le programme actif sont bien en base.
// Usage : railway run node scripts/diagnose-history.mjs

import pg from 'pg'

const { Pool } = pg

const connString = process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL
if (!connString) { console.error('❌ DATABASE_PUBLIC_URL requis.'); process.exit(1) }

const pool = new Pool({ connectionString: connString, ssl: { rejectUnauthorized: false } })

async function run() {
  const client = await pool.connect()
  try {
    // 1. Programmes actifs
    const { rows: activeProgs } = await client.query(
      `SELECT id, data->>'name' AS name, data->>'isActive' AS active, data->>'isTemplate' AS template
       FROM sync_records
       WHERE store = 'programs' AND (data->>'deleted')::boolean IS NOT TRUE
       ORDER BY updated_at DESC`,
    )
    console.log('\n══ Programmes en base ════════════════════════════')
    if (activeProgs.length === 0) {
      console.log('   ⚠️  Aucun programme !')
    } else {
      for (const p of activeProgs) {
        const badge = p.active === 'true' ? '✅ ACTIF  ' : p.template === 'true' ? '📋 template' : '○ inactif'
        console.log(`   ${badge}  "${p.name}"  (${p.id.slice(0, 8)}…)`)
      }
    }

    // 2. Séances
    const { rows: sessions } = await client.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE data->>'endedAt' IS NOT NULL) AS ended,
         MIN(to_timestamp((data->>'startedAt')::bigint / 1000)) AS oldest,
         MAX(to_timestamp((data->>'startedAt')::bigint / 1000)) AS newest
       FROM sync_records
       WHERE store = 'sessions' AND (data->>'deleted')::boolean IS NOT TRUE`,
    )
    const s = sessions[0]
    console.log('\n══ Séances en base ══════════════════════════════')
    console.log(`   Total : ${s?.total ?? 0}  (terminées : ${s?.ended ?? 0})`)
    if (s?.oldest) console.log(`   De : ${s.oldest}`)
    if (s?.newest) console.log(`   À  : ${s.newest}`)

    // 3. 5 dernières séances
    const { rows: lastSessions } = await client.query(
      `SELECT
         data->>'name' AS name,
         to_timestamp((data->>'startedAt')::bigint / 1000) AS started,
         data->>'endedAt' IS NOT NULL AS ended
       FROM sync_records
       WHERE store = 'sessions' AND (data->>'deleted')::boolean IS NOT TRUE
       ORDER BY updated_at DESC
       LIMIT 5`,
    )
    if (lastSessions.length > 0) {
      console.log('\n   5 dernières séances :')
      for (const s of lastSessions) {
        console.log(`   • ${s.ended ? '✅' : '⏳'} "${s.name}"  ${s.started?.toLocaleDateString('fr-FR')}`)
      }
    }

    // 4. server_seq max
    const { rows: seqRows } = await client.query(`SELECT MAX(server_seq) AS max FROM sync_records`)
    console.log(`\n══ server_seq max en base : ${seqRows[0]?.max}`)
    console.log('   (le curseur IDB doit être ≤ cette valeur pour tout voir)\n')

  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(console.error)
