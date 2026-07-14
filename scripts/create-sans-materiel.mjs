// Crée le programme "3 Semaines Sans Matériel" + exercices bodyweight manquants.
// Usage (depuis le dossier gym-tracker) : railway run node scripts/create-sans-materiel.mjs

import pg from 'pg'
import { randomUUID } from 'node:crypto'

const { Pool } = pg
const NOW = Date.now()

const connString = process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL
if (!connString) {
  console.error('❌ DATABASE_PUBLIC_URL ou DATABASE_URL requis.')
  process.exit(1)
}

const pool = new Pool({ connectionString: connString, ssl: { rejectUnauthorized: false } })

function syncable(id) {
  return { id, updatedAt: NOW, deleted: false, dirty: false }
}

async function upsert(client, store, id, data) {
  await client.query(
    `INSERT INTO sync_records (store, id, data, updated_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (store, id) DO UPDATE
       SET data = $3, updated_at = $4,
           server_seq = nextval(pg_get_serial_sequence('sync_records', 'server_seq'))`,
    [store, id, JSON.stringify({ ...syncable(id), ...data }), NOW],
  )
}

// exerciseId, order, targetSets, targetRepsMin, restSec, opts?
function wet(exerciseId, order, sets, repsMin, rest, opts = {}) {
  const e = {
    exerciseId,
    order,
    targetSets: sets,
    repsMode: opts.repsMode ?? 'fixed',
    targetRepsMin: repsMin,
    restSec: rest,
    autoProgress: false,
    progressStepKg: 0,
  }
  if (opts.repsMax     !== undefined) e.targetRepsMax     = opts.repsMax
  if (opts.durationSec !== undefined) e.targetDurationSec = opts.durationSec
  if (opts.notes       !== undefined) e.notes             = opts.notes
  return e
}

// ── Exercices bodyweight à ajouter à la bibliothèque ─────────────────────────

const NEW_EXERCISES = [
  {
    id: 'bw-burpees',
    name: 'Burpees',
    primaryMuscle: 'cardio',
    secondaryMuscles: ['core', 'chest', 'quads'],
    equipment: 'bodyweight',
    category: 'compound',
    trackingType: 'reps_only',
    popularity: 2,
  },
  {
    id: 'bw-pike-pushup',
    name: 'Pike push-ups',
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['triceps', 'core'],
    equipment: 'bodyweight',
    category: 'compound',
    trackingType: 'reps_only',
    popularity: 1,
  },
  {
    id: 'bw-jump-squat',
    name: 'Squats sautés',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes', 'calves', 'cardio'],
    equipment: 'bodyweight',
    category: 'compound',
    trackingType: 'reps_only',
    popularity: 1,
  },
  {
    id: 'bw-wall-sit',
    name: 'Wall sit',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes', 'hamstrings'],
    equipment: 'bodyweight',
    category: 'isolation',
    trackingType: 'time',
    popularity: 1,
  },
  {
    id: 'bw-high-knees',
    name: 'High knees',
    primaryMuscle: 'cardio',
    secondaryMuscles: ['core', 'quads'],
    equipment: 'bodyweight',
    category: 'compound',
    trackingType: 'time',
    popularity: 1,
  },
  {
    id: 'bw-hollow-body',
    name: 'Hollow body',
    primaryMuscle: 'core',
    secondaryMuscles: [],
    equipment: 'bodyweight',
    category: 'isolation',
    trackingType: 'time',
    popularity: 1,
  },
  {
    id: 'bw-inverted-row',
    name: 'Rowing inversé (table)',
    primaryMuscle: 'back_thickness',
    secondaryMuscles: ['biceps', 'core'],
    equipment: 'bodyweight',
    category: 'compound',
    trackingType: 'reps_only',
    popularity: 1,
  },
]

// ── Exécution ─────────────────────────────────────────────────────────────────

async function run() {
  const client = await pool.connect()
  try {
    // 1. Récupérer les exercices existants par nom
    const { rows } = await client.query(
      `SELECT id, data->>'name' AS name
       FROM sync_records
       WHERE store = 'exercises' AND (data->>'deleted')::boolean IS NOT TRUE`,
    )
    const byName = Object.fromEntries(rows.map((r) => [r.name, r.id]))

    // Références aux exercices (seed existants + nouveaux)
    const EX = {
      pompes:       byName['Pompes']                      ?? 'seed-pushup',
      dips:         byName['Dips triceps']                ?? 'seed-triceps-dips',
      planche:      byName['Planche']                     ?? 'seed-plank',
      crunch:       byName['Crunch']                      ?? 'seed-crunch',
      releveJambes: byName['Relevé de jambes']            ?? 'seed-leg-raise',
      squatBW:      byName['Squat poids du corps']        ?? 'seed-bodyweight-squat',
      fentes:       byName['Fentes marchées']             ?? 'seed-walking-lunges',
      mountainCli:  byName['Mountain climbers']           ?? 'seed-mountain-climbers',
      jumpingJacks: byName['Jumping jacks']               ?? 'seed-jumping-jacks',
      superman:     byName['Superman']                    ?? 'seed-superman',
      goodMorning:  byName['Good morning poids du corps'] ?? 'seed-good-morning-bw',
      gainageLat:   byName['Gainage latéral']             ?? 'seed-side-plank',
      birdDog:      byName['Bird dog']                    ?? 'seed-bird-dog',
      squat:        byName['Squat bulgare']               ?? 'seed-bulgarian-split-squat',
      // nouveaux
      burpees:      'bw-burpees',
      pikePushup:   'bw-pike-pushup',
      jumpSquat:    'bw-jump-squat',
      wallSit:      'bw-wall-sit',
      highKnees:    'bw-high-knees',
      hollowBody:   'bw-hollow-body',
      invertedRow:  'bw-inverted-row',
    }

    await client.query('BEGIN')

    // 2. Insérer les exercices manquants
    for (const ex of NEW_EXERCISES) {
      await upsert(client, 'exercises', ex.id, ex)
    }

    // 3. Générer les IDs
    const progId = randomUUID()
    const wt1Id  = randomUUID() // Push · Gainage   (lundi)
    const wt2Id  = randomUUID() // Jambes · Cardio  (mardi)
    const wt3Id  = randomUUID() // Tirage · Gainage (mercredi)
    const wt4Id  = randomUUID() // HIIT             (jeudi)
    const wt5Id  = randomUUID() // Full Body        (vendredi)

    // 4. Programme
    await upsert(client, 'programs', progId, {
      name: '3 Semaines Sans Matériel',
      goal: 'endurance',
      level: 'intermediate',
      durationWeeks: 3,
      sessionsPerWeek: 5,
      color: '#00C9A7',
      isTemplate: true,
      isActive: false,
      createdAt: NOW,
      weekTemplate: {
        monday:    wt1Id,
        tuesday:   wt2Id,
        wednesday: wt3Id,
        thursday:  wt4Id,
        friday:    wt5Id,
      },
    })

    // 5. Séances
    for (const t of [
      { id: wt1Id, name: 'Push · Gainage',   type: 'push',     muscleGroups: ['chest', 'triceps', 'core'] },
      { id: wt2Id, name: 'Jambes · Cardio',  type: 'legs',     muscleGroups: ['quads', 'glutes', 'hamstrings'] },
      { id: wt3Id, name: 'Tirage · Gainage', type: 'pull',     muscleGroups: ['back', 'core'] },
      { id: wt4Id, name: 'HIIT',             type: 'custom',   muscleGroups: ['cardio', 'core'] },
      { id: wt5Id, name: 'Full Body',        type: 'fullbody', muscleGroups: ['chest', 'quads', 'core'] },
    ]) {
      await upsert(client, 'workoutTemplates', t.id, { programId: progId, ...t })
    }

    // 6. Exercices par séance
    // La note sur chaque exercice documente la progression S2 et S3.

    // ── Lundi : Push · Gainage ────────────────────────────────────
    const j1 = [
      wet(EX.pompes,      0, 4, 12, 60, { notes: 'S2 : pompes diamant 4×10 | S3 : archer push-ups 4×10/ch' }),
      wet(EX.pikePushup,  1, 3, 10, 60, { notes: 'S2 : 4×12 | S3 : 4×15' }),
      wet(EX.dips,        2, 3, 10, 60, { notes: 'S2 : 4×10 | S3 : + decline push-ups 4×12' }),
      wet(EX.planche,     3, 4,  1, 30, { durationSec: 30, notes: 'S2 : 4×45 s | S3 : 5×60 s' }),
      wet(EX.crunch,      4, 3, 20, 30, { notes: 'S2 : crunch vélo 3×20 | S3 : dragon flag négatif 3×5' }),
      wet(EX.releveJambes,5, 3, 15, 30, { notes: 'S2 : 3×15 | S3 : 4×15' }),
    ]

    // ── Mardi : Jambes · Cardio ───────────────────────────────────
    const j2 = [
      wet(EX.squatBW,     0, 4, 20, 60, { notes: 'S2 : squats sautés 4×15 | S3 : pistol squat 3×8/ch' }),
      wet(EX.fentes,      1, 3, 12, 60, { notes: 'S2 : squat bulgare 3×10/ch | S3 : 4×12/ch' }),
      wet(EX.wallSit,     2, 3,  1, 45, { durationSec: 45, notes: 'S2 : 3×60 s | S3 : 4×75 s' }),
      wet(EX.burpees,     3, 3, 10, 60, { notes: 'S2 : box jumps (chaise) 3×10 | S3 : EMOM 10 min — 10 burpees/min' }),
      wet(EX.mountainCli, 4, 3, 20, 30, { notes: 'S2 : 3×20 | S3 : intégré dans le circuit AMRAP' }),
      wet(EX.jumpingJacks,5, 3, 30, 30, { notes: 'S2 : remplacé par squats sautés 4×15 | S3 : box jumps 4×12' }),
    ]

    // ── Mercredi : Tirage · Gainage ───────────────────────────────
    const j3 = [
      wet(EX.invertedRow, 0, 4, 10, 60, { notes: 'S2 : prise serrée 4×12 | S3 : pieds surélevés 4×12' }),
      wet(EX.superman,    1, 3, 15, 45, { notes: 'S2 : rythme lent 3×12 | S3 : hold 3 s au sommet — 3×12' }),
      wet(EX.goodMorning, 2, 3, 20, 45, { notes: 'S2 : bird dog 3×12/ch | S3 : arch body rock 3×15' }),
      wet(EX.hollowBody,  3, 3,  1, 30, { durationSec: 20, notes: 'S2 : creux abdominal 3×30 s | S3 : L-sit (chaises) 4×12 s' }),
      wet(EX.gainageLat,  4, 3,  1, 30, { durationSec: 25, notes: 'S2 : + rotation bassin 3×10/ch | S3 : planche 3D 3 min total' }),
    ]

    // ── Jeudi : HIIT ──────────────────────────────────────────────
    // S1 : circuit 4 tours · 30 s on / 15 s off · repos 60 s entre tours
    // S2 : Tabata · 8 cycles 20 s / 10 s par exercice · repos 2 min entre séries
    // S3 : AMRAP 20 min (10 burpees / 15 pompes / 20 squats sautés / 25 mountain climbers)
    const j4 = [
      wet(EX.burpees,     0, 4, 0, 15, { repsMode: 'amrap', durationSec: 30, notes: 'S1 : 30s on/15s off | S2 : Tabata 8×20s/10s | S3 : AMRAP 20min — 10 reps' }),
      wet(EX.highKnees,   1, 4, 0, 15, { repsMode: 'amrap', durationSec: 30, notes: 'S1 : 30s on/15s off | S2 : Tabata 8×20s/10s | S3 : AMRAP 20min' }),
      wet(EX.jumpSquat,   2, 4, 0, 15, { repsMode: 'amrap', durationSec: 30, notes: 'S1 : 30s on/15s off | S2 : Tabata 8×20s/10s | S3 : AMRAP 20min — 20 reps' }),
      wet(EX.mountainCli, 3, 4, 0, 15, { repsMode: 'amrap', durationSec: 30, notes: 'S1 : 30s on/15s off | S2 : Tabata 8×20s/10s | S3 : AMRAP 20min — 25 reps' }),
      wet(EX.pompes,      4, 4, 0, 60, { repsMode: 'amrap', durationSec: 30, notes: 'S1 : 30s on/15s off · repos 60s entre tours | S2 : Tabata | S3 : AMRAP 20min — 15 reps' }),
    ]

    // ── Vendredi : Full Body ──────────────────────────────────────
    const j5 = [
      wet(EX.pompes,      0, 3, 15, 60, { notes: 'S2 : circuit 4 tours 15 reps | S3 : AMRAP 30min — 10 pompes diamant' }),
      wet(EX.squatBW,     1, 3, 25, 60, { notes: 'S2 : squats sautés ×15 | S3 : AMRAP 30min — 15 squats sautés' }),
      wet(EX.dips,        2, 3, 12, 60, { notes: 'S2 : ×12 | S3 : AMRAP 30min — 10 dips' }),
      wet(EX.fentes,      3, 3, 12, 60, { notes: 'S2 : ×12/ch | S3 : AMRAP 30min — 10/ch' }),
      wet(EX.planche,     4, 3,  1, 30, { durationSec: 40, notes: 'S2 : 45 s | S3 : AMRAP 30min — 45 s' }),
      wet(EX.superman,    5, 3, 15, 30),
    ]

    for (const [wtId, exos] of [[wt1Id, j1], [wt2Id, j2], [wt3Id, j3], [wt4Id, j4], [wt5Id, j5]]) {
      for (const ex of exos) {
        await upsert(client, 'workoutExerciseTemplates', randomUUID(), { workoutTemplateId: wtId, ...ex })
      }
    }

    await client.query('COMMIT')

    console.log('✅ Programme "3 Semaines Sans Matériel" créé.')
    console.log(`   ID programme : ${progId}`)
    console.log('   7 exercices bodyweight ajoutés à la bibliothèque.')
    console.log("   Ouvre l'app et force une synchro pour le voir apparaître.")
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
