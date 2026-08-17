// Liste les exercices sans image (pas de media.url) en base Railway.
// Usage : railway run node scripts/diagnose-missing-media.mjs

import pg from 'pg'

const { Pool } = pg
const connString = process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL
if (!connString) { console.error('❌ DATABASE_PUBLIC_URL requis.'); process.exit(1) }

const pool = new Pool({ connectionString: connString, ssl: { rejectUnauthorized: false } })

async function run() {
  const client = await pool.connect()
  try {
    const { rows } = await client.query(
      `SELECT
         data->>'name'           AS name,
         data->'media'->>'url'   AS url,
         (data->>'deleted')::boolean AS deleted
       FROM sync_records
       WHERE store = 'exercises'
       ORDER BY data->>'name'`,
    )

    const active = rows.filter((r) => !r.deleted)
    const withUrl = active.filter((r) => r.url)
    const missing = active.filter((r) => !r.url)

    console.log(`\n══ Exercices en base : ${active.length} actifs ══════════════════`)
    console.log(`   ✅ ${withUrl.length} ont une image`)
    console.log(`   ❌ ${missing.length} n'ont pas d'image\n`)

    if (missing.length > 0) {
      console.log('── Exercices sans image ─────────────────────────────────')
      for (const r of missing) console.log(`   • "${r.name}"`)
    }

    console.log('')
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(console.error)
