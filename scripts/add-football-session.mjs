// Ajoute une séance Football ⚽ le samedi dans Iron Upper (tous les programmes).
// - Crée l'exercice "Football" (trackingType: time)
// - Crée un workoutTemplate "Football ⚽" par programme
// - Crée un WET avec targetDurationSec: 3600
// - Ajoute saturday → wtId dans le weekTemplate du programme
import pg from 'pg'
import { randomUUID } from 'crypto'
const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const client = await pool.connect()

const FOOTBALL_EX_ID = 'seed-football'

try {
  // ── 1. Créer l'exercice "Football" pour user:1 et user:2 ──────────────
  for (const userId of [1, 2]) {
    const updatedAt = userId === 1 ? Date.now() : 1
    const exData = {
      id: FOOTBALL_EX_ID,
      name: 'Football',
      primaryMuscle: 'cardio',
      secondaryMuscles: [],
      equipment: 'bodyweight',
      trackingType: 'time',
      isCustom: false,
      isUnilateral: false,
      media: null,
      instructions: 'Séance de football : course, sprints, dribbles. Durée cible : 60 min.',
      updatedAt,
      deleted: false,
      createdAt: updatedAt,
    }
    await client.query(`
      INSERT INTO sync_records (id, user_id, store, data, updated_at)
      VALUES ($1, $2, 'exercises', $3::jsonb, $4)
      ON CONFLICT (user_id, store, id) DO UPDATE
        SET data = EXCLUDED.data,
            updated_at = EXCLUDED.updated_at,
            server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))
    `, [FOOTBALL_EX_ID, userId, JSON.stringify(exData), updatedAt])
    console.log(`✅ Exercice Football créé pour user:${userId}`)
  }

  // ── 2. Récupérer tous les programmes Iron Upper ───────────────────────
  const { rows: progs } = await client.query(`
    SELECT id, user_id, data->>'name' AS name, data->>'weekTemplate' AS wt, data->>'sessionsPerWeek' AS spw
    FROM sync_records
    WHERE store='programs' AND user_id IN (1,2)
      AND data->>'name' ILIKE '%iron upper%'
      AND (data->>'deleted')::boolean IS NOT TRUE
    ORDER BY user_id
  `)

  // Dédupliquer par id pour ne pas traiter le même programme 2 fois (user:1 et user:2 partagent parfois le même id)
  const seen = new Set()
  const unique = progs.filter(p => {
    const key = `${p.user_id}:${p.id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  for (const prog of unique) {
    const userId = prog.user_id
    const nowMs = userId === 1 ? Date.now() : 1
    const weekTemplate = JSON.parse(prog.wt)

    if (weekTemplate.saturday) {
      console.log(`⏭️  Programme ${prog.id} (user:${userId}) a déjà un samedi — skip`)
      continue
    }

    console.log(`\n${'═'.repeat(60)}`)
    console.log(`Programme "${prog.name}" | user:${userId} | id=${prog.id}`)

    // a) Créer le workoutTemplate "Football ⚽"
    const wtId = `iron-football-${userId}-${prog.id.slice(0, 8)}`
    const wtData = {
      id: wtId,
      programId: prog.id,
      name: 'Football ⚽',
      type: 'custom',
      muscleGroups: [],
      updatedAt: nowMs,
      deleted: false,
      createdAt: nowMs,
    }
    await client.query(`
      INSERT INTO sync_records (id, user_id, store, data, updated_at)
      VALUES ($1, $2, 'workoutTemplates', $3::jsonb, $4)
      ON CONFLICT (user_id, store, id) DO UPDATE
        SET data = EXCLUDED.data,
            updated_at = EXCLUDED.updated_at,
            server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))
    `, [wtId, userId, JSON.stringify(wtData), nowMs])
    console.log(`  ✅ workoutTemplate "${wtData.name}" créé (${wtId})`)

    // b) Créer le workoutExerciseTemplate (1 set × 3600s)
    const wetId = `iron-football-wet-${userId}-${prog.id.slice(0, 8)}`
    const wetData = {
      id: wetId,
      workoutTemplateId: wtId,
      exerciseId: FOOTBALL_EX_ID,
      order: 0,
      supersetGroup: null,
      targetSets: '1',
      targetRepsMin: null,
      targetRepsMax: null,
      targetDurationSec: '3600',
      targetRPE: null,
      restSec: '0',
      autoProgress: false,
      isWarmup: false,
      isAb: false,
      trackingType: 'time',
      updatedAt: nowMs,
      deleted: false,
      createdAt: nowMs,
    }
    await client.query(`
      INSERT INTO sync_records (id, user_id, store, data, updated_at)
      VALUES ($1, $2, 'workoutExerciseTemplates', $3::jsonb, $4)
      ON CONFLICT (user_id, store, id) DO UPDATE
        SET data = EXCLUDED.data,
            updated_at = EXCLUDED.updated_at,
            server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))
    `, [wetId, userId, JSON.stringify(wetData), nowMs])
    console.log(`  ✅ workoutExerciseTemplate créé — 1×3600s`)

    // c) Mettre à jour le weekTemplate du programme : ajouter saturday
    const newWeekTemplate = { ...weekTemplate, saturday: wtId }
    const newSpw = parseInt(prog.spw ?? '3') + 1
    await client.query(`
      UPDATE sync_records
      SET data = jsonb_set(
            jsonb_set(data, '{weekTemplate}', $1::jsonb),
            '{sessionsPerWeek}', $2::jsonb
          ),
          updated_at = $3,
          server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))
      WHERE store='programs' AND user_id=$4 AND id=$5
    `, [JSON.stringify(newWeekTemplate), JSON.stringify(newSpw), nowMs, userId, prog.id])
    console.log(`  ✅ weekTemplate mis à jour → saturday=${wtId}  sessionsPerWeek: ${prog.spw} → ${newSpw}`)
  }

  console.log('\n✅ Terminé — synchro ≤ 20 s.')
} finally {
  client.release()
  await pool.end()
}
