// Diagnostic + correction des exercices finishers jambes :
// 1. Liste tous les Glute bridge et Leg curl allongé existants
// 2. Corrige les WETs pour pointer vers les bons exercices
// 3. Supprime les doublons créés par add-finishers-jambes.mjs
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const client = await pool.connect()

try {
  // ── 1. Diagnostic ─────────────────────────────────────────────────────────
  console.log('=== Exercices Glute bridge ===')
  const { rows: glutes } = await client.query(`
    SELECT id, user_id, data->>'name' AS name,
           data->'media'->>'url' AS img_url,
           data->'media'->>'blobId' AS blob_id,
           updated_at
    FROM sync_records
    WHERE store = 'exercises' AND user_id IN (1, 2)
      AND data->>'name' ILIKE '%glute bridge%'
      AND (data->>'deleted')::boolean IS NOT TRUE
    ORDER BY user_id, updated_at DESC
  `)
  glutes.forEach(r => console.log(` user:${r.user_id} | ${r.id} | url=${r.img_url} | blob=${r.blob_id}`))

  console.log('\n=== Exercices Leg curl ===')
  const { rows: curls } = await client.query(`
    SELECT id, user_id, data->>'name' AS name,
           data->'media'->>'url' AS img_url,
           data->'media'->>'blobId' AS blob_id,
           updated_at
    FROM sync_records
    WHERE store = 'exercises' AND user_id IN (1, 2)
      AND data->>'name' ILIKE '%leg curl%'
      AND (data->>'deleted')::boolean IS NOT TRUE
    ORDER BY user_id, updated_at DESC
  `)
  curls.forEach(r => console.log(` user:${r.user_id} | ${r.id} | name="${r.name}" | url=${r.img_url} | blob=${r.blob_id}`))

  // ── 2. Pour chaque user, résoudre le bon exercice à utiliser ──────────────
  // Leg curl allongé : prendre l'exercice existant (pas seed-leg-curl-allonge) si possible
  // Glute bridge : idem, prendre le non-seed si un autre existe

  for (const userId of [1, 2]) {
    const nowMs = userId === 1 ? Date.now() : 1

    console.log(`\n${'═'.repeat(60)}`)
    console.log(`user:${userId}`)

    // ── Glute bridge ──
    const userGlutes = glutes.filter(r => r.user_id === userId)
    const seedGlute = userGlutes.find(r => r.id === 'seed-glute-bridge')
    const realGlute = userGlutes.find(r => r.id !== 'seed-glute-bridge')

    let gluteBridgeId
    if (realGlute) {
      // Il existe un vrai Glute bridge avec image — seed-glute-bridge est un doublon
      gluteBridgeId = realGlute.id
      console.log(`  Glute bridge réel trouvé : ${realGlute.id} (image: ${realGlute.img_url ?? realGlute.blob_id})`)
      if (seedGlute) {
        // Supprimer le doublon seed
        await client.query(`
          UPDATE sync_records
          SET data = jsonb_set(data, '{deleted}', 'true'),
              updated_at = $1,
              server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))
          WHERE store = 'exercises' AND user_id = $2 AND id = 'seed-glute-bridge'
        `, [nowMs, userId])
        console.log(`  ✅ seed-glute-bridge supprimé (doublon)`)
      }
    } else if (seedGlute) {
      // seed-glute-bridge est le seul — il a perdu son image via l'upsert
      gluteBridgeId = 'seed-glute-bridge'
      console.log(`  Glute bridge : uniquement seed-glute-bridge (image perdue lors de l'upsert)`)
      // On ne peut pas restaurer l'image originale — on garde le seed tel quel
      // L'utilisateur devra réassigner l'image via l'app
    } else {
      console.log(`  ⚠️  Aucun Glute bridge trouvé pour user:${userId}`)
      continue
    }

    // ── Leg curl allongé ──
    const userCurls = curls.filter(r => r.user_id === userId && r.name?.toLowerCase().includes('allongé'))
    const seedCurl = userCurls.find(r => r.id === 'seed-leg-curl-allonge')
    const realCurl = userCurls.find(r => r.id !== 'seed-leg-curl-allonge')

    let legCurlId
    if (realCurl) {
      legCurlId = realCurl.id
      console.log(`  Leg curl allongé réel : ${realCurl.id} (image: ${realCurl.img_url ?? realCurl.blob_id})`)
      if (seedCurl) {
        await client.query(`
          UPDATE sync_records
          SET data = jsonb_set(data, '{deleted}', 'true'),
              updated_at = $1,
              server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))
          WHERE store = 'exercises' AND user_id = $2 AND id = 'seed-leg-curl-allonge'
        `, [nowMs, userId])
        console.log(`  ✅ seed-leg-curl-allonge supprimé (doublon)`)
      }
    } else if (seedCurl) {
      legCurlId = 'seed-leg-curl-allonge'
      console.log(`  Leg curl allongé : uniquement seed (image perdue)`)
    } else {
      console.log(`  ⚠️  Aucun Leg curl allongé trouvé pour user:${userId}`)
      continue
    }

    // ── 3. Mettre à jour les WETs pour pointer vers les bons IDs ─────────────
    // WETs Glute bridge
    if (gluteBridgeId !== 'seed-glute-bridge') {
      const { rowCount } = await client.query(`
        UPDATE sync_records
        SET data = jsonb_set(data, '{exerciseId}', $1::jsonb),
            updated_at = $2,
            server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))
        WHERE store = 'workoutExerciseTemplates'
          AND user_id = $3
          AND data->>'exerciseId' = 'seed-glute-bridge'
          AND (data->>'deleted')::boolean IS NOT TRUE
      `, [JSON.stringify(gluteBridgeId), nowMs, userId])
      if (rowCount > 0) console.log(`  ✅ ${rowCount} WET(s) Glute bridge redirigé(s) vers ${gluteBridgeId}`)
    }

    // WETs Leg curl allongé
    if (legCurlId !== 'seed-leg-curl-allonge') {
      const { rowCount } = await client.query(`
        UPDATE sync_records
        SET data = jsonb_set(data, '{exerciseId}', $1::jsonb),
            updated_at = $2,
            server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))
        WHERE store = 'workoutExerciseTemplates'
          AND user_id = $3
          AND data->>'exerciseId' = 'seed-leg-curl-allonge'
          AND (data->>'deleted')::boolean IS NOT TRUE
      `, [JSON.stringify(legCurlId), nowMs, userId])
      if (rowCount > 0) console.log(`  ✅ ${rowCount} WET(s) Leg curl redirigé(s) vers ${legCurlId}`)
    }
  }

  console.log('\n✅ Terminé — synchro ≤ 20 s.')
} finally {
  client.release()
  await pool.end()
}
