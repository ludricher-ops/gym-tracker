// Crée le programme "Iron Upper" directement dans sync_records.
// L'app le récupère au prochain pull de synchronisation.
//
// Usage (depuis le dossier gym-tracker) :
//   railway run node scripts/create-iron-upper.mjs

import pg from 'pg'
import { randomUUID } from 'node:crypto'

const { Pool } = pg
const NOW = Date.now()

const connString = process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL
if (!connString) {
  console.error('❌ DATABASE_PUBLIC_URL ou DATABASE_URL requis.')
  process.exit(1)
}

const pool = new Pool({
  connectionString: connString,
  ssl: { rejectUnauthorized: false },
})

// ── Helpers ──────────────────────────────────────────────────────────────────

function syncable(id) {
  return { id, updatedAt: NOW, deleted: false, dirty: false }
}

async function upsert(client, store, id, data) {
  await client.query(
    `INSERT INTO sync_records (store, id, data, updated_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (store, id) DO UPDATE SET data = $3, updated_at = $4`,
    [store, id, JSON.stringify({ ...syncable(id), ...data }), NOW],
  )
}

// ── Définition du programme ───────────────────────────────────────────────────

// Exercice : { exerciseId, order, targetSets, repsMin, repsMode?,
//              targetDurationSec?, restSec, supersetGroup?, autoProgress? }
function wet(exerciseId, order, sets, repsMin, rest, group, opts = {}) {
  return {
    exerciseId,
    order,
    targetSets: sets,
    repsMode: opts.repsMode ?? 'fixed',
    targetRepsMin: repsMin,
    targetRepsMax: opts.repsMax,
    targetDurationSec: opts.durationSec,
    restSec: rest,
    supersetGroup: group,
    autoProgress: opts.autoProgress ?? false,
    progressStepKg: opts.progressStep ?? 0,
  }
}

// ── Exécution ─────────────────────────────────────────────────────────────────

async function run() {
  const client = await pool.connect()
  try {
    // 1. Récupérer les IDs des exercices par nom
    const { rows } = await client.query(
      `SELECT id, data->>'name' AS name
       FROM sync_records
       WHERE store = 'exercises' AND (data->>'deleted')::boolean IS NOT TRUE`,
    )
    const byName = Object.fromEntries(rows.map((r) => [r.name, r.id]))

    const needed = {
      devCouche:    'Développé couché haltères',
      rowingUni:    'Rowing haltère unilatéral (appui sur banc)',
      devIncline:   'Développé incliné haltères',
      rowing:       'Rowing haltère',
      ecarte:       'Écarté haltères',
      devEpaules:   'Développé épaules haltères',
      curlAlt:      'Curl haltères alterné',
      extTriceps:   'Extension triceps nuque',
      curlMarteau:  'Curl marteau',
      elevLat:      'Élévations latérales',
      oiseau:       'Oiseau (buste penché)',
      dips:         'Dips triceps',
      pullover:     'Pull-over haltère',
      planche:      'Planche',
      crunchVelo:   'Crunch bicyclette',
      russian:      'Russian twist',
      crunch:       'Crunch',
      crunchVert:   'Crunch avec jambes verticales',
      ciseaux:      'Ciseaux',
      gainageLat:   'Gainage latéral',
      toucheTalon:  'Touche talon alternés',
    }

    const ex = {}
    const missing = []
    for (const [key, name] of Object.entries(needed)) {
      ex[key] = byName[name]
      if (!ex[key]) missing.push(`"${name}"`)
    }
    if (missing.length) {
      console.error('❌ Exercices introuvables :')
      missing.forEach((m) => console.error(`   ${m}`))
      console.error('\nExercices disponibles :')
      rows.forEach((r) => console.error(`   "${r.name}"`))
      process.exit(1)
    }

    // 2. Générer les IDs
    const progId = randomUUID()
    const wt1Id  = randomUUID() // Poitrine + Dos   (lundi)
    const wt2Id  = randomUUID() // Épaules + Bras   (mercredi)
    const wt3Id  = randomUUID() // Full Upper        (vendredi)

    await client.query('BEGIN')

    // 3. Programme
    await upsert(client, 'programs', progId, {
      name: 'Iron Upper',
      goal: 'hypertrophy',
      level: 'beginner',
      durationWeeks: 13,
      sessionsPerWeek: 3,
      color: '#f97316',
      isTemplate: true,
      isActive: false,
      createdAt: NOW,
      weekTemplate: {
        monday:    wt1Id,
        wednesday: wt2Id,
        friday:    wt3Id,
      },
    })

    // 4. Séances
    await upsert(client, 'workoutTemplates', wt1Id, {
      programId: progId,
      name: 'Poitrine + Dos',
      type: 'upper',
      muscleGroups: ['chest', 'back', 'core'],
    })
    await upsert(client, 'workoutTemplates', wt2Id, {
      programId: progId,
      name: 'Épaules + Bras',
      type: 'upper',
      muscleGroups: ['shoulders', 'biceps', 'triceps', 'core'],
    })
    await upsert(client, 'workoutTemplates', wt3Id, {
      programId: progId,
      name: 'Full Upper',
      type: 'upper',
      muscleGroups: ['chest', 'back', 'triceps', 'core'],
    })

    // ── Bloc core commun (réutilisé dans les 3 séances) ──────────────────────
    // Groupes C/D/E ; supersets D et E partagent les mêmes exercices.
    // C = triset cardio-core   D = triset crunch   E = paire latéral/talon
    function coreBlock(wtId, startOrder, groupOffset) {
      // groupOffset permet de décaler les lettres quand A/B/C sont déjà pris
      const g = (letter) => {
        const base = 'A'.charCodeAt(0)
        const off  = letter.charCodeAt(0) - 'A'.charCodeAt(0)
        return String.fromCharCode(base + groupOffset + off)
      }
      return [
        wet(ex.planche,     startOrder + 0, 3, 1,  30, g('C'), { durationSec: 45 }),
        wet(ex.crunchVelo,  startOrder + 1, 3, 20, 30, g('C')),
        wet(ex.russian,     startOrder + 2, 3, 20, 30, g('C')),
        wet(ex.crunch,      startOrder + 3, 3, 15, 30, g('D')),
        wet(ex.crunchVert,  startOrder + 4, 3, 15, 30, g('D')),
        wet(ex.ciseaux,     startOrder + 5, 3, 20, 30, g('D')),
        wet(ex.gainageLat,  startOrder + 6, 3, 1,  30, g('E'), { durationSec: 30 }),
        wet(ex.toucheTalon, startOrder + 7, 3, 20, 30, g('E')),
      ]
    }

    // 5. Exercices — Jour 1 : Poitrine + Dos
    const j1 = [
      wet(ex.devCouche,  0, 3, 10, 90, 'A', { autoProgress: true, progressStep: 2.5 }),
      wet(ex.rowingUni,  1, 3, 10, 90, 'A', { autoProgress: true, progressStep: 2.5 }),
      wet(ex.devIncline, 2, 3, 10, 90, 'B', { autoProgress: true, progressStep: 2.5 }),
      wet(ex.rowing,     3, 3, 10, 90, 'B', { autoProgress: true, progressStep: 2.5 }),
      wet(ex.ecarte,     4, 3, 12, 90, null),
      ...coreBlock(wt1Id, 5, 2), // groupes C, D, E
    ]
    for (const w of j1) {
      const id = randomUUID()
      await upsert(client, 'workoutExerciseTemplates', id, { workoutTemplateId: wt1Id, ...w })
    }

    // 6. Exercices — Jour 2 : Épaules + Bras
    const j2 = [
      wet(ex.devEpaules,  0, 3, 10, 90, 'A', { autoProgress: true, progressStep: 2.5 }),
      wet(ex.curlAlt,     1, 3, 10, 90, 'A'),
      wet(ex.extTriceps,  2, 3, 10, 90, 'B'),
      wet(ex.curlMarteau, 3, 3, 10, 90, 'B'),
      wet(ex.elevLat,     4, 3, 12, 90, 'C'),
      wet(ex.oiseau,      5, 3, 12, 90, 'C'),
      ...coreBlock(wt2Id, 6, 3), // groupes D, E, F
    ]
    for (const w of j2) {
      const id = randomUUID()
      await upsert(client, 'workoutExerciseTemplates', id, { workoutTemplateId: wt2Id, ...w })
    }

    // 7. Exercices — Jour 3 : Full Upper
    const j3 = [
      wet(ex.dips,     0, 3, 10, 90, 'A'),
      wet(ex.pullover, 1, 3, 10, 90, 'A'),
      wet(ex.ecarte,   2, 3, 12, 90, 'B'),
      wet(ex.oiseau,   3, 3, 12, 90, 'B'),
      ...coreBlock(wt3Id, 4, 2), // groupes C, D, E
    ]
    for (const w of j3) {
      const id = randomUUID()
      await upsert(client, 'workoutExerciseTemplates', id, { workoutTemplateId: wt3Id, ...w })
    }

    await client.query('COMMIT')

    console.log('✅ Programme "Iron Upper" créé.')
    console.log(`   ID programme : ${progId}`)
    console.log('   Ouvre l\'app et force une synchro pour le voir apparaître.')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Erreur :', err.message)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(console.error)
