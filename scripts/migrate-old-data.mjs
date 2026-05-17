// Migration ponctuelle : ancien projet `gymtracker` (PWA Alpine.js, 3 tables
// JSONB) → nouveau modèle Gym Track. Les enregistrements transformés sont
// insérés dans la table `sync_records` de la nouvelle base ; l'app les
// récupère ensuite via sa synchronisation normale.
//
// Usage :
//   OLD_DATABASE_URL=... NEW_DATABASE_URL=... node scripts/migrate-old-data.mjs
//   (ajouter --commit pour écrire réellement ; sinon simple aperçu à blanc)
//
// Le mapping groupe musculaire est best-effort — vérifier le résultat.

import pg from 'pg'
import { randomUUID } from 'node:crypto'

const { Pool } = pg
const COMMIT = process.argv.includes('--commit')
const NOW = Date.now()

const OLD_URL = process.env.OLD_DATABASE_URL
const NEW_URL = process.env.NEW_DATABASE_URL
if (!OLD_URL || !NEW_URL) {
  console.error('OLD_DATABASE_URL et NEW_DATABASE_URL sont requis.')
  process.exit(1)
}

// Groupe musculaire français (ancien) → MuscleGroup (nouveau).
const MUSCLE_MAP = {
  pectoraux: 'chest', pecs: 'chest', poitrine: 'chest',
  dos: 'back', 'épaules': 'shoulders', epaules: 'shoulders',
  biceps: 'biceps', triceps: 'triceps', 'avant-bras': 'forearms',
  jambes: 'quads', quadriceps: 'quads', cuisses: 'quads',
  ischios: 'hamstrings', 'ischio-jambiers': 'hamstrings',
  fessiers: 'glutes', mollets: 'calves',
  abdos: 'core', abdominaux: 'core', gainage: 'core', cardio: 'cardio',
}
const toMuscle = (group) => MUSCLE_MAP[String(group ?? '').trim().toLowerCase()] ?? 'core'

const sync = (extra) => ({ updatedAt: NOW, deleted: false, dirty: false, ...extra })
const records = [] // { store, record }

async function main() {
  const oldPool = new Pool({ connectionString: OLD_URL, ssl: { rejectUnauthorized: false } })
  const oldExercises = (await oldPool.query('SELECT data FROM exercises')).rows.map((r) => r.data)
  const oldProgrammes = (await oldPool.query('SELECT data FROM programmes')).rows.map((r) => r.data)
  const oldSessions = (await oldPool.query('SELECT data FROM sessions')).rows.map((r) => r.data)
  await oldPool.end()

  // id ancien exercice → id nouveau exercice
  const exerciseIdMap = new Map()

  // ── Exercices ──
  for (const ex of oldExercises) {
    const id = `mig-ex-${ex.id}`
    exerciseIdMap.set(ex.id, id)
    records.push({
      store: 'exercises',
      record: sync({
        id,
        name: ex.name ?? 'Exercice importé',
        primaryMuscle: toMuscle(ex.group),
        secondaryMuscles: [],
        equipment: 'barbell',
        category: 'compound',
        trackingType: 'weight_reps',
        isCustom: true,
        usageCount: 0,
        createdAt: NOW,
      }),
    })
  }

  const ensureExercise = (e) => {
    if (e.id && exerciseIdMap.has(e.id)) return exerciseIdMap.get(e.id)
    const id = `mig-ex-${e.id ?? randomUUID()}`
    if (!exerciseIdMap.has(e.id)) {
      exerciseIdMap.set(e.id, id)
      records.push({
        store: 'exercises',
        record: sync({
          id, name: e.name ?? 'Exercice importé', primaryMuscle: toMuscle(e.group),
          secondaryMuscles: [], equipment: 'barbell', category: 'compound',
          trackingType: 'weight_reps', isCustom: true, usageCount: 0, createdAt: NOW,
        }),
      })
    }
    return id
  }

  // ── Programmes → Program + WorkoutTemplate + WorkoutExerciseTemplate ──
  for (const prog of oldProgrammes) {
    const programId = `mig-prog-${prog.id ?? randomUUID()}`
    const wtId = `${programId}-w`
    records.push({
      store: 'programs',
      record: sync({
        id: programId, name: prog.name ?? 'Programme importé', goal: 'hypertrophy',
        level: 'intermediate', durationWeeks: 12, sessionsPerWeek: 3, color: '#c8f000',
        isTemplate: false, isActive: false, weekTemplate: { monday: wtId }, createdAt: NOW,
      }),
    })
    records.push({
      store: 'workoutTemplates',
      record: sync({
        id: wtId, programId, name: prog.name ?? 'Séance', type: 'custom', muscleGroups: [],
      }),
    })
    ;(prog.exercises ?? []).forEach((e, i) => {
      records.push({
        store: 'workoutExerciseTemplates',
        record: sync({
          id: `${wtId}-e${i}`, workoutTemplateId: wtId, exerciseId: ensureExercise(e),
          order: i, targetSets: Number(e.sets) || 3, repsMode: 'fixed',
          targetRepsMin: Number(e.reps) || 10, restSec: 90, autoProgress: true,
          progressStepKg: 2.5,
        }),
      })
    })
  }

  // ── Sessions → Session + SessionExercise + Set ──
  for (const s of oldSessions) {
    const startedAt = s.date ? new Date(s.date).getTime() || NOW : NOW
    const durationSec = Number(s.duration) || 0
    const sessionId = `mig-sess-${s.id ?? randomUUID()}`
    let totalSets = 0
    let totalVolumeKg = 0
    const seRecords = []
    ;(s.exercises ?? []).forEach((e, exi) => {
      const seId = `${sessionId}-se${exi}`
      seRecords.push({
        store: 'sessionExercises',
        record: sync({ id: seId, sessionId, exerciseId: ensureExercise(e), order: exi }),
      })
      ;(e.sets ?? []).forEach((set, si) => {
        const weightKg = Number(set.weight) || 0
        const reps = Number(set.reps) || 0
        totalSets++
        totalVolumeKg += weightKg * reps
        seRecords.push({
          store: 'sets',
          record: sync({
            id: `${seId}-s${si}`, sessionExerciseId: seId, index: si, weightKg, reps,
            isWarmup: false, isFailure: false, isPersonalRecord: false,
            completedAt: set.done ? startedAt + durationSec * 1000 : undefined,
          }),
        })
      })
    })
    records.push({
      store: 'sessions',
      record: sync({
        id: sessionId, name: s.programmeName ?? 'Séance importée', startedAt,
        endedAt: startedAt + durationSec * 1000, durationSec, totalVolumeKg,
        totalSets, completedSets: totalSets,
      }),
    })
    records.push(...seRecords)
  }

  console.log(
    `Transformé : ${oldExercises.length} exercices, ${oldProgrammes.length} programmes, ` +
      `${oldSessions.length} séances → ${records.length} enregistrements.`,
  )

  if (!COMMIT) {
    console.log('Aperçu à blanc — relancer avec --commit pour écrire dans la nouvelle base.')
    return
  }

  const newPool = new Pool({ connectionString: NEW_URL, ssl: { rejectUnauthorized: false } })
  const client = await newPool.connect()
  try {
    await client.query('BEGIN')
    for (const { store, record } of records) {
      await client.query(
        `INSERT INTO sync_records (store, id, data, updated_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (store, id) DO UPDATE
           SET data = EXCLUDED.data,
               updated_at = EXCLUDED.updated_at,
               server_seq = nextval(pg_get_serial_sequence('sync_records', 'server_seq'))`,
        [store, record.id, JSON.stringify(record), record.updatedAt],
      )
    }
    await client.query('COMMIT')
    console.log(`${records.length} enregistrements insérés dans la nouvelle base.`)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await newPool.end()
  }
}

main().catch((err) => {
  console.error('Échec de la migration :', err.message)
  process.exit(1)
})
