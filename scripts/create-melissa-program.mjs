// Crée le programme Melissa — 3J Bas du corps (tous les champs requis)
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL??process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} })
const client = await pool.connect()
const NOW = Date.now()

const IDS = {
  adductionEx: 'seed-hip-adduction-machine',
  prog:  'melissa-prog',
  j1:    'melissa-j1',
  j2:    'melissa-j2',
  j3:    'melissa-j3',
}

// ── Bases WET ──────────────────────────────────────────────────────────────
const WARMUP = { targetSets:1, repsMode:'fixed', targetRepsMin:1, targetDurationSec:300,
                 autoProgress:false, progressStepKg:0, restSec:0, isWarmup:true }
const ISO3   = { targetSets:3, repsMode:'range', targetRepsMin:12, targetRepsMax:15,
                 autoProgress:true, progressStepKg:2.5, restSec:60 }
const COMP3  = { targetSets:3, repsMode:'range', targetRepsMin:10, targetRepsMax:12,
                 autoProgress:true, progressStepKg:2.5, restSec:75 }
const COMP4  = { ...COMP3, targetSets:4, restSec:90 }
const AB     = { targetSets:3, repsMode:'fixed', targetRepsMin:15,
                 autoProgress:false, progressStepKg:0, restSec:40, isAb:true }

try {
  // ── User ──────────────────────────────────────────────────────────────────
  const { rows:[{user_id: userId}] } = await client.query(
    `SELECT user_id FROM sync_records GROUP BY user_id ORDER BY COUNT(*) DESC LIMIT 1`
  )
  console.log(`User: ${userId}`)

  // ── Helper upsert ─────────────────────────────────────────────────────────
  const upsert = async (store, id, data) => {
    const full = { id, deleted:false, dirty:true, updatedAt:NOW, ...data }
    await client.query(`
      INSERT INTO sync_records (user_id, store, id, data, updated_at)
      VALUES ($1,$2,$3,$4::jsonb,$5)
      ON CONFLICT (user_id, store, id) DO UPDATE
        SET data=EXCLUDED.data, updated_at=EXCLUDED.updated_at,
            server_seq=nextval(pg_get_serial_sequence('sync_records','server_seq'))
    `, [userId, store, id, JSON.stringify(full), NOW])
  }

  // ── 1. Exercice Adduction hanches ─────────────────────────────────────────
  await upsert('exercises', IDS.adductionEx, {
    name: 'Adduction hanches',
    muscleGroup: 'quads',
    equipment: 'machine',
    trackingType: 'weight_reps',
    isWarmupExercise: false,
    updatedAt: 1,  // LWW seed – ne sera pas écrasé par les données user
    media: {
      type:'gif', mime:'image/gif', aspectRatio:1, sizeBytes:0, importedAt:NOW,
      url:'https://fitnessprogramer.com/wp-content/uploads/2021/02/HIP-ADDUCTION-MACHINE.gif',
    },
  })
  console.log('✅ Exercice "Adduction hanches" créé')

  // ── 2. Récup IDs exercices ─────────────────────────────────────────────────
  const getEx = async (name) => {
    const { rows } = await client.query(`
      SELECT id FROM sync_records WHERE store='exercises' AND user_id=$1
        AND data->>'name' ILIKE $2 AND (data->>'deleted')::boolean IS NOT TRUE LIMIT 1
    `, [userId, name])
    if (!rows[0]) throw new Error(`Exercice introuvable: "${name}"`)
    return rows[0].id
  }
  const EX = {
    velo:      await getEx('Vélo'),
    hipT:      await getEx('Hip thrust'),
    kickback:  await getEx('Kickback fessier poulie'),
    fentes:    await getEx('Fentes'),
    abduct:    await getEx('Abduction hanches'),
    adduct:    IDS.adductionEx,
    legPress:  await getEx('Presse à cuisses'),
    legExt:    await getEx('Leg extension'),
    legCurl:   await getEx('Leg curl allongé'),
    sqBulg:    await getEx('Squat bulgare'),
    rdl:       await getEx('Soulevé de terre jambes tendues'),
    // Abdos
    planche:   await getEx('Planche'),
    crunch:    await getEx('Crunch'),
    relevJ:    await getEx('Relevé de jambes'),
    russian:   await getEx('Russian twist'),
    gainage:   await getEx('Gainage latéral'),
  }
  console.log('✅ Tous les exercices trouvés')

  // ── 3. Programme ──────────────────────────────────────────────────────────
  await upsert('programs', IDS.prog, {
    name: 'Melissa — 3J Bas du corps',
    goal: 'fat_loss',
    level: 'beginner',
    durationWeeks: 8,
    sessionsPerWeek: 3,
    color: '#ec4899',
    isTemplate: false,
    isActive: false,
    createdAt: NOW,
    weekTemplate: {
      monday:    IDS.j1,
      wednesday: IDS.j2,
      friday:    IDS.j3,
    },
  })
  console.log('✅ Programme créé')

  // ── 4. Séances (workoutTemplates) ─────────────────────────────────────────
  await upsert('workoutTemplates', IDS.j1, {
    programId: IDS.prog,
    name: 'Séance A – Fessiers / Abducteurs / Adducteurs',
    type: 'lower',
    muscleGroups: ['glutes', 'quads'],
  })
  await upsert('workoutTemplates', IDS.j2, {
    programId: IDS.prog,
    name: 'Séance B – Cuisses (Quads + Ischios)',
    type: 'lower',
    muscleGroups: ['quads', 'hamstrings'],
  })
  await upsert('workoutTemplates', IDS.j3, {
    programId: IDS.prog,
    name: 'Séance C – Fessiers + Chaîne postérieure',
    type: 'lower',
    muscleGroups: ['glutes', 'hamstrings'],
  })
  console.log('✅ 3 séances créées')

  // ── 5. Exercices (workoutExerciseTemplates) ───────────────────────────────
  const wets = [
    // ── SÉANCE A : Fessiers / Abducteurs / Adducteurs ──────────────────────
    { id:'melissa-j1-00', wt:IDS.j1, ex:EX.velo,     ord:0,  ...WARMUP },
    { id:'melissa-j1-01', wt:IDS.j1, ex:EX.hipT,     ord:1,  ...COMP4,  progressStepKg:5 },
    { id:'melissa-j1-02', wt:IDS.j1, ex:EX.kickback, ord:2,  ...ISO3 },
    { id:'melissa-j1-03', wt:IDS.j1, ex:EX.fentes,   ord:3,  ...COMP3 },
    { id:'melissa-j1-04', wt:IDS.j1, ex:EX.abduct,   ord:4,  ...ISO3, restSec:0,  supersetGroup:'A' },
    { id:'melissa-j1-05', wt:IDS.j1, ex:EX.adduct,   ord:5,  ...ISO3, restSec:60, supersetGroup:'A' },
    // Abdos A
    { id:'melissa-j1-a1', wt:IDS.j1, ex:EX.planche,  ord:10, ...AB, repsMode:'fixed', targetRepsMin:1, targetDurationSec:30 },
    { id:'melissa-j1-a2', wt:IDS.j1, ex:EX.crunch,   ord:11, ...AB },
    { id:'melissa-j1-a3', wt:IDS.j1, ex:EX.relevJ,   ord:12, ...AB },

    // ── SÉANCE B : Cuisses ──────────────────────────────────────────────────
    { id:'melissa-j2-00', wt:IDS.j2, ex:EX.velo,     ord:0,  ...WARMUP },
    { id:'melissa-j2-01', wt:IDS.j2, ex:EX.legPress, ord:1,  ...COMP4,  progressStepKg:5 },
    { id:'melissa-j2-02', wt:IDS.j2, ex:EX.legExt,   ord:2,  ...ISO3 },
    { id:'melissa-j2-03', wt:IDS.j2, ex:EX.legCurl,  ord:3,  ...ISO3 },
    { id:'melissa-j2-04', wt:IDS.j2, ex:EX.sqBulg,   ord:4,  ...COMP3 },
    // Abdos B
    { id:'melissa-j2-a1', wt:IDS.j2, ex:EX.russian,  ord:10, ...AB },
    { id:'melissa-j2-a2', wt:IDS.j2, ex:EX.crunch,   ord:11, ...AB },
    { id:'melissa-j2-a3', wt:IDS.j2, ex:EX.gainage,  ord:12, ...AB, repsMode:'fixed', targetRepsMin:1, targetDurationSec:30 },

    // ── SÉANCE C : Fessiers + Chaîne postérieure ────────────────────────────
    { id:'melissa-j3-00', wt:IDS.j3, ex:EX.velo,     ord:0,  ...WARMUP },
    { id:'melissa-j3-01', wt:IDS.j3, ex:EX.rdl,      ord:1,  ...COMP4,  progressStepKg:5 },
    { id:'melissa-j3-02', wt:IDS.j3, ex:EX.legCurl,  ord:2,  ...ISO3 },
    { id:'melissa-j3-03', wt:IDS.j3, ex:EX.hipT,     ord:3,  ...COMP3,  progressStepKg:5 },
    { id:'melissa-j3-04', wt:IDS.j3, ex:EX.abduct,   ord:4,  ...ISO3, restSec:0,  supersetGroup:'A' },
    { id:'melissa-j3-05', wt:IDS.j3, ex:EX.adduct,   ord:5,  ...ISO3, restSec:60, supersetGroup:'A' },
    // Abdos C
    { id:'melissa-j3-a1', wt:IDS.j3, ex:EX.relevJ,   ord:10, ...AB },
    { id:'melissa-j3-a2', wt:IDS.j3, ex:EX.russian,  ord:11, ...AB },
    { id:'melissa-j3-a3', wt:IDS.j3, ex:EX.planche,  ord:12, ...AB, repsMode:'fixed', targetRepsMin:1, targetDurationSec:30 },
  ]

  for (const w of wets) {
    const { id, wt, ex, ord, ...rest } = w
    await upsert('workoutExerciseTemplates', id, {
      workoutTemplateId: wt,
      exerciseId: ex,
      order: ord,
      ...rest,
    })
  }
  console.log(`✅ ${wets.length} WETs insérés`)

  console.log(`
─────────────────────────────────────────────────────
✅ Programme "Melissa — 3J Bas du corps" opérationnel
   Synchro dans ≤ 20 s — couleur rose #ec4899
─────────────────────────────────────────────────────`)
} finally {
  client.release()
  await pool.end()
}
