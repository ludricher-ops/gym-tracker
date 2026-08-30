// Remplace les abdos Melissa par le bloc abdos Iron Upper (9 exercices)
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL??process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} })
const client = await pool.connect()
const NOW = Date.now()

const SESSIONS = ['melissa-j1', 'melissa-j2', 'melissa-j3']
const u2 = (await client.query(`SELECT user_id FROM sync_records WHERE user_id!=1 LIMIT 1`)).rows[0].user_id

try {
  // ── Récupérer les IDs exercices abdos ────────────────────────────────────
  const getEx = async (name) => {
    const { rows } = await client.query(`
      SELECT id FROM sync_records WHERE store='exercises' AND user_id=1
        AND data->>'name'=$1 AND (data->>'deleted')::boolean IS NOT TRUE LIMIT 1
    `, [name])
    if (!rows[0]) throw new Error(`Introuvable: "${name}"`)
    return rows[0].id
  }

  const AB_BLOCK = [
    // [ordre, nom, sets, repsMode, repsMin, durationSec]
    [10, await getEx('Planche'),                    2, 'fixed', 1,  45],
    [11, await getEx('Gainage latéral'),             2, 'fixed', 1,  30],
    [12, await getEx('Ciseaux abdominaux'),          1, 'fixed', 40, null],
    [13, await getEx('Relevé de jambes'),            1, 'fixed', 15, null],
    [14, await getEx('Crunch bicyclette'),           1, 'fixed', 40, null],
    [15, await getEx('Russian twist'),               1, 'fixed', 40, null],
    [16, await getEx('Touche talons alternés'),      1, 'fixed', 40, null],
    [17, await getEx('Crunch'),                      1, 'fixed', 15, null],
    [18, await getEx('Crunch avec jambes verticales'), 1, 'fixed', 15, null],
  ]
  console.log(`✅ ${AB_BLOCK.length} exercices abdos trouvés`)

  const upsert = async (userId, id, data) => {
    const full = { id, deleted:false, dirty:true, updatedAt: userId===1 ? NOW : 1, ...data }
    await client.query(`
      INSERT INTO sync_records (user_id, store, id, data, updated_at)
      VALUES ($1,'workoutExerciseTemplates',$2,$3::jsonb,$4)
      ON CONFLICT (user_id, store, id) DO UPDATE
        SET data=EXCLUDED.data, updated_at=EXCLUDED.updated_at,
            server_seq=nextval(pg_get_serial_sequence('sync_records','server_seq'))
    `, [userId, id, JSON.stringify(full), userId===1 ? NOW : 1])
  }

  for (const wt of SESSIONS) {
    const letter = wt.slice(-1) // j1→1, j2→2, j3→3

    // 1. Tombstoner les anciens abdos
    await client.query(`
      UPDATE sync_records
      SET data=jsonb_set(jsonb_set(data,'{deleted}','true'::jsonb),'{updatedAt}',to_jsonb($1::bigint)),
          updated_at=$1,
          server_seq=nextval(pg_get_serial_sequence('sync_records','server_seq'))
      WHERE store='workoutExerciseTemplates' AND user_id=1
        AND data->>'workoutTemplateId'=$2
        AND (data->>'isAb')::boolean IS TRUE
        AND (data->>'deleted')::boolean IS NOT TRUE
    `, [NOW, wt])

    // 2. Insérer les nouveaux abdos
    let i = 1
    for (const [ord, exId, sets, mode, reps, dur] of AB_BLOCK) {
      const wetId = `melissa-${letter}-ab${i++}`
      const data = {
        workoutTemplateId: wt,
        exerciseId: exId,
        order: ord,
        targetSets: sets,
        repsMode: mode,
        targetRepsMin: reps,
        autoProgress: false,
        progressStepKg: 0,
        restSec: 0,
        isAb: true,
        ...(dur ? { targetDurationSec: dur } : {}),
      }
      await upsert(1,   wetId, data)
      await upsert(u2, wetId, { ...data, updatedAt: 1 })
    }
    console.log(`✅ ${wt} — 9 abdos insérés`)
  }

  console.log('\n✅ Abdos Melissa remplacés par le bloc Iron Upper. Synchro dans ≤ 20 s.')
} finally { client.release(); await pool.end() }
