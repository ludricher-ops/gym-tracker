// 1. Supprime le programme "Galbe et Force"
// 2. Passe Melissa en template (isTemplate: true) pour user:1 + copie en seed user:2
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL??process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} })
const client = await pool.connect()
const NOW = Date.now()

try {
  const u1 = 1
  const { rows:[{user_id: u2}] } = await client.query(
    `SELECT user_id FROM sync_records WHERE user_id != $1 GROUP BY user_id ORDER BY COUNT(*) LIMIT 1`, [u1]
  )

  // ── 1. Trouver et tombstoner "Galbe et Force" ───────────────────────────
  const { rows: galbeProgs } = await client.query(`
    SELECT id FROM sync_records
    WHERE store='programs' AND user_id=$1
      AND data->>'name' ILIKE '%galbe%'
      AND (data->>'deleted')::boolean IS NOT TRUE
  `, [u1])

  if (galbeProgs.length === 0) {
    console.log('❓ Programme "Galbe et Force" introuvable — vérifie le nom exact')
    // Lister les programmes existants
    const { rows: all } = await client.query(`
      SELECT id, data->>'name' AS name FROM sync_records
      WHERE store='programs' AND user_id=$1 AND (data->>'deleted')::boolean IS NOT TRUE
    `, [u1])
    console.log('Programmes existants :')
    for (const p of all) console.log(`  - "${p.name}" (${p.id})`)
  } else {
    for (const prog of galbeProgs) {
      // Tombstoner le programme
      await client.query(`
        UPDATE sync_records SET
          data = jsonb_set(jsonb_set(data,'{deleted}','true'::jsonb),'{updatedAt}',to_jsonb($1::bigint)),
          updated_at=$1, server_seq=nextval(pg_get_serial_sequence('sync_records','server_seq'))
        WHERE store='programs' AND user_id=$2 AND id=$3
      `, [NOW, u1, prog.id])

      // Tombstoner ses workoutTemplates
      const { rows: wts } = await client.query(`
        SELECT id FROM sync_records WHERE store='workoutTemplates' AND user_id=$1 AND data->>'programId'=$2
      `, [u1, prog.id])
      for (const wt of wts) {
        await client.query(`
          UPDATE sync_records SET
            data = jsonb_set(jsonb_set(data,'{deleted}','true'::jsonb),'{updatedAt}',to_jsonb($1::bigint)),
            updated_at=$1, server_seq=nextval(pg_get_serial_sequence('sync_records','server_seq'))
          WHERE store='workoutTemplates' AND user_id=$2 AND id=$3
        `, [NOW, u1, wt.id])
        // Tombstoner ses WETs
        await client.query(`
          UPDATE sync_records SET
            data = jsonb_set(jsonb_set(data,'{deleted}','true'::jsonb),'{updatedAt}',to_jsonb($1::bigint)),
            updated_at=$1, server_seq=nextval(pg_get_serial_sequence('sync_records','server_seq'))
          WHERE store='workoutExerciseTemplates' AND user_id=$2 AND data->>'workoutTemplateId'=$3
        `, [NOW, u1, wt.id])
      }
      console.log(`✅ Programme "${prog.id}" + ${wts.length} séances supprimés`)
    }
  }

  // ── 2. Melissa → isTemplate: true pour user:1 ───────────────────────────
  await client.query(`
    UPDATE sync_records SET
      data = jsonb_set(jsonb_set(data,'{isTemplate}','true'::jsonb),'{updatedAt}',to_jsonb($1::bigint)),
      updated_at=$1, server_seq=nextval(pg_get_serial_sequence('sync_records','server_seq'))
    WHERE store='programs' AND user_id=$2 AND id='melissa-prog'
  `, [NOW, u1])
  console.log('✅ Melissa → isTemplate: true (user:1)')

  // ── 3. Copier Melissa en seed (user:2) avec updatedAt:1 ─────────────────
  const stores = ['programs','workoutTemplates','workoutExerciseTemplates']
  let total = 0
  for (const store of stores) {
    let whereClause
    if (store === 'programs') whereClause = `id='melissa-prog'`
    else if (store === 'workoutTemplates') whereClause = `data->>'programId'='melissa-prog'`
    else whereClause = `data->>'workoutTemplateId' IN ('melissa-j1','melissa-j2','melissa-j3')`

    const { rows: records } = await client.query(`
      SELECT id, data FROM sync_records WHERE store=$1 AND user_id=$2 AND ${whereClause}
    `, [store, u1])

    for (const r of records) {
      const seedData = { ...r.data, isTemplate: true, updatedAt: 1 }
      await client.query(`
        INSERT INTO sync_records (user_id, store, id, data, updated_at)
        VALUES ($1,$2,$3,$4::jsonb,1)
        ON CONFLICT (user_id, store, id) DO UPDATE
          SET data=EXCLUDED.data, updated_at=1,
              server_seq=nextval(pg_get_serial_sequence('sync_records','server_seq'))
      `, [u2, store, r.id, JSON.stringify(seedData)])
      total++
    }
  }
  console.log(`✅ Melissa copiée en seed (user:${u2}) — ${total} enregistrements`)
  console.log('\nSynchro dans ≤ 20 s.')
} finally { client.release(); await pool.end() }
