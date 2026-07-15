// Diagnostic : vérifie l'état des médias dans la base et teste les URLs.
// Usage : railway run node scripts/diagnose-media.mjs

import pg from 'pg'

const { Pool } = pg

const connString = process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL
if (!connString) {
  console.error('❌ DATABASE_PUBLIC_URL ou DATABASE_URL requis.')
  process.exit(1)
}

const pool = new Pool({ connectionString: connString, ssl: { rejectUnauthorized: false } })

async function testUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
    return `HTTP ${res.status}`
  } catch (e) {
    return `ERREUR: ${e.message}`
  }
}

async function run() {
  const client = await pool.connect()
  try {
    // 1. Curseur client (pour info — valeur stockée côté client, pas en base)
    console.log('══ 1. État des exercices en base ════════════════════════\n')

    const { rows } = await client.query(
      `SELECT
         id,
         data->>'name' AS name,
         data->'media' AS media,
         server_seq,
         updated_at
       FROM sync_records
       WHERE store = 'exercises'
         AND (data->>'deleted')::boolean IS NOT TRUE
       ORDER BY server_seq DESC
       LIMIT 30`,
    )

    console.log(`   ${rows.length} exercices (les 30 plus récents par server_seq)\n`)

    let withMedia = 0
    let withUrl = 0

    for (const row of rows) {
      const media = row.media
      const hasMedia = media !== null && media !== undefined
      const url = hasMedia ? (typeof media === 'object' ? media.url : JSON.parse(media)?.url) : null

      if (hasMedia) withMedia++
      if (url) withUrl++

      const badge = url ? '✅' : hasMedia ? '⚠️ media sans url' : '○'
      const shortUrl = url ? url.substring(0, 60) + '…' : '—'
      console.log(`   ${badge} [seq=${row.server_seq}] ${row.name}`)
      if (url) console.log(`        URL: ${shortUrl}`)
    }

    console.log(`\n   → ${withMedia} avec objet media  |  ${withUrl} avec URL`)

    // 2. Tester les URLs accessibles
    const { rows: urlRows } = await client.query(
      `SELECT
         data->>'name' AS name,
         data->'media'->>'url' AS url
       FROM sync_records
       WHERE store = 'exercises'
         AND data->'media'->>'url' IS NOT NULL
         AND (data->>'deleted')::boolean IS NOT TRUE`,
    )

    if (urlRows.length === 0) {
      console.log('\n══ 2. Test URLs ═══════════════════════════════════════\n')
      console.log('   ⚠️  Aucun exercice n\'a encore d\'URL en base.')
      console.log('   → Lance : railway run node scripts/populate-exercise-media.mjs')
    } else {
      console.log(`\n══ 2. Test des ${urlRows.length} URL(s) en base ══════════════════\n`)
      for (const r of urlRows) {
        const status = await testUrl(r.url)
        const ok = status === 'HTTP 200'
        console.log(`   ${ok ? '✅' : '❌'} ${r.name} → ${status}`)
        console.log(`        ${r.url}`)
      }
    }

    // 3. server_seq le plus haut
    const { rows: seqRows } = await client.query(
      `SELECT MAX(server_seq) AS max_seq FROM sync_records`,
    )
    const maxSeq = seqRows[0]?.max_seq ?? 0
    console.log(`\n══ 3. server_seq max en base : ${maxSeq} ══════════════════`)
    console.log('   (le client pull tout ce qui est > son curseur local)\n')
    console.log('   Si le curseur client ≥ max_seq → relance le script populate.')
    console.log('   Pour voir le curseur client : ouvre l\'app → DevTools → Application → localStorage → gymtrack-sync-cursor\n')
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(console.error)
