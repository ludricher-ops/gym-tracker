// Remplace les échauffements Iron Upper (ord 20-24) par Vélo 5 min.
// Ciblé sur tous les workoutTemplates liés aux programmes "Iron Upper".
// Usage : railway run node scripts/replace-warmup-velo.mjs

import pg from 'pg'
import { randomUUID } from 'crypto'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function run() {
  const client = await pool.connect()
  const NOW = Date.now()
  try {
    // 1. Récupérer l'ID de l'exercice "Vélo"
    const { rows: veloRows } = await client.query(`
      SELECT id FROM sync_records
      WHERE store = 'exercises'
        AND data->>'name' = 'Vélo'
        AND (data->>'deleted')::boolean IS NOT TRUE
      LIMIT 1
    `)
    if (!veloRows.length) { console.error('❌ Exercice "Vélo" introuvable.'); return }
    const veloId = veloRows[0].id
    console.log(`   Vélo exercise id : ${veloId}`)

    // 2. Trouver tous les programmes Iron Upper
    const { rows: progs } = await client.query(`
      SELECT id FROM sync_records
      WHERE store = 'programs'
        AND data->>'name' ILIKE '%iron%'
        AND (data->>'deleted')::boolean IS NOT TRUE
    `)
    const progIds = progs.map(p => p.id)
    console.log(`   ${progIds.length} programme(s) Iron Upper : ${progIds.join(', ')}`)

    // 3. Trouver toutes leurs séances
    const { rows: wts } = await client.query(`
      SELECT id, data->>'name' AS name
      FROM sync_records
      WHERE store = 'workoutTemplates'
        AND (data->>'deleted')::boolean IS NOT TRUE
        AND data->>'programId' = ANY($1)
    `, [progIds])
    const wtIds = wts.map(w => w.id)
    console.log(`   ${wtIds.length} séances : ${wts.map(w => w.name).join(', ')}`)

    // 4. Identifier les WETs d'échauffement (ord 20-24)
    const { rows: warmupWets } = await client.query(`
      SELECT wet.id, wet.data->>'workoutTemplateId' AS wt_id,
             (wet.data->>'order')::int AS ord,
             ex.data->>'name' AS ex_name
      FROM sync_records wet
      LEFT JOIN sync_records ex
        ON ex.store = 'exercises' AND ex.id = wet.data->>'exerciseId'
      WHERE wet.store = 'workoutExerciseTemplates'
        AND (wet.data->>'deleted')::boolean IS NOT TRUE
        AND wet.data->>'workoutTemplateId' = ANY($1)
        AND (wet.data->>'order')::int BETWEEN 20 AND 24
    `, [wtIds])
    console.log(`\n   ${warmupWets.length} WETs échauffement à remplacer :`)
    for (const w of warmupWets) {
      console.log(`     [${w.id}] "${w.ex_name}" ord:${w.ord} (séance:${w.wt_id.slice(0,8)}…)`)
    }

    // 5. Tombstoner les anciens WETs échauffement
    const oldIds = [...new Set(warmupWets.map(w => w.id))]
    if (oldIds.length) {
      const { rowCount } = await client.query(`
        UPDATE sync_records
        SET data = jsonb_set(
              jsonb_set(data, '{deleted}', 'true'::jsonb),
              '{updatedAt}', to_jsonb($1::bigint)
            ),
            updated_at = $1,
            server_seq = nextval(pg_get_serial_sequence('sync_records', 'server_seq'))
        WHERE store = 'workoutExerciseTemplates'
          AND id = ANY($2)
      `, [NOW, oldIds])
      console.log(`\n   🗑️  ${rowCount} WETs anciens supprimés.`)
    }

    // 6. Créer un WET "Vélo 5 min" (ord 20) pour chaque séance
    let created = 0
    for (const wt of wts) {
      const wetId = randomUUID()
      const wetData = {
        id:                 wetId,
        workoutTemplateId:  wt.id,
        exerciseId:         veloId,
        order:              20,
        sets:               [{ durationSec: 300 }],   // 5 minutes
        createdAt:          NOW,
        updatedAt:          NOW,
      }
      await client.query(`
        INSERT INTO sync_records (id, store, data, updated_at)
        VALUES ($1, 'workoutExerciseTemplates', $2::jsonb, $3)
      `, [wetId, JSON.stringify(wetData), NOW])
      console.log(`   ✅ Vélo 5 min ajouté → séance "${wt.name}" (ord:20)`)
      created++
    }

    console.log(`
── Résultat ──────────────────────────────────────────
   🗑️  ${oldIds.length} exercices échauffement supprimés
   ✅  ${created} Vélo 5 min insérés (1 par séance)

   Synchro automatique dans ≤ 20 s.`)
  } finally {
    client.release()
    await pool.end()
  }
}
run().catch(console.error)
