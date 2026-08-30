// Vérifie toutes les URLs media en base et liste celles qui sont cassées (404, timeout…).
// Usage : railway run node scripts/check-media-urls.mjs

import pg from 'pg'

const { Pool } = pg

const connString = process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL
if (!connString) { console.error('❌ DATABASE_PUBLIC_URL requis.'); process.exit(1) }

const pool = new Pool({ connectionString: connString, ssl: { rejectUnauthorized: false } })

async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(6000) })
    return res.status
  } catch {
    return 0 // timeout ou erreur réseau
  }
}

async function run() {
  const client = await pool.connect()
  try {
    const { rows } = await client.query(
      `SELECT id, data->>'name' AS name, data->'media'->>'url' AS url
       FROM sync_records
       WHERE store = 'exercises'
         AND data->'media'->>'url' IS NOT NULL
         AND (data->>'deleted')::boolean IS NOT TRUE
       ORDER BY data->>'name'`,
    )
    console.log(`   ${rows.length} exercices avec URL media.\n`)

    const broken = []
    const ok = []

    // Vérification par lots de 10 pour ne pas surcharger
    for (let i = 0; i < rows.length; i += 10) {
      const batch = rows.slice(i, i + 10)
      const results = await Promise.all(
        batch.map(async (row) => {
          const status = await checkUrl(row.url)
          return { ...row, status }
        }),
      )
      for (const r of results) {
        if (r.status === 200 || r.status === 206) {
          ok.push(r)
        } else {
          broken.push(r)
          console.log(`   ❌ [${r.status || 'timeout'}] ${r.name}`)
          console.log(`         ${r.url}`)
        }
      }
      // Petit délai entre les lots
      if (i + 10 < rows.length) await new Promise(r => setTimeout(r, 300))
    }

    console.log(`\n── Résultat ──────────────────────────────────────────`)
    console.log(`   ✅ ${ok.length}  URLs valides`)
    console.log(`   ❌ ${broken.length}  URLs cassées`)
    if (broken.length > 0) {
      console.log(`\n   Exercices à corriger :`)
      for (const r of broken) {
        console.log(`   - "${r.name}" (id: ${r.id})`)
        console.log(`     URL: ${r.url}`)
      }
    }
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(console.error)
